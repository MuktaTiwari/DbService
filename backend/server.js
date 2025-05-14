const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const csv = require('csv-parser');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const databasesRoutes = require('./routes/databases');
const superadminRoutes = require('./routes/superadmin');
const accessRoutes = require('./routes/access');
const oDataAccessRoutes = require('./routes/oDataAccess');
const { verifyToken } = require('./middleware/authMiddleware');

const app = express();

dotenv.config();

app.use(cors());
app.use(express.json({
  strict: false // Allow empty bodies
}
));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin:'*',
  credentials:true
}))

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD || 'ptspl1234',
  database: process.env.DB_NAME || 'superadmin_db',
  port: process.env.DB_PORT || 5432,
};

console.log('Connecting with user:', dbConfig.user);
console.log('Database host:', dbConfig.host);
console.log('Database port:', dbConfig.port);

const createDatabase = async () => {
  const defaultPool = new Pool({
    ...dbConfig,
    database: 'postgres'
  });

  try {
    const result = await defaultPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbConfig.database]
    );

    if (result.rows.length === 0) {
      await defaultPool.query(`CREATE DATABASE ${dbConfig.database}`);
      console.log(`Database ${dbConfig.database} created successfully`);
    } else {
      console.log(`Database ${dbConfig.database} already exists`);
    }
  } catch (err) {
    console.error('Error creating database:', err);
  } finally {
    await defaultPool.end();
  }
};

const mainPool = new Pool(dbConfig);

mainPool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err);
    return;
  }
  console.log('Connected to PostgreSQL successfully');
  release();
});

app.use((req, res, next) => {
  req.mainPool = mainPool;
  next();
});

const initializeDatabase = async () => {
  try {
    await createDatabase();

    await mainPool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await mainPool.query(`
      CREATE TABLE IF NOT EXISTS superadmins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        mobile_no VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        organization VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await mainPool.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        org_id UUID PRIMARY KEY,
        organization_name VARCHAR(255) NOT NULL UNIQUE,
        domain VARCHAR(255) NOT NULL,
        registryId UUID NULL,
        secondaryERPId UUID NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await mainPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        password VARCHAR(255),
        organization_name VARCHAR(255),
        domain_name VARCHAR(255),
        owner_email VARCHAR(255),
        org_id UUID NOT NULL REFERENCES organizations (org_id),
        isPyramidDocument BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    

    await mainPool.query(`
      CREATE TABLE IF NOT EXISTS db_collection (
        dbid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        dbname VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id UUID NOT NULL REFERENCES users(user_id),
        apikey TEXT NOT NULL UNIQUE
      )
    `);

    await mainPool.query(`
      CREATE TABLE IF NOT EXISTS table_collection (
        tableid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        dbid UUID NOT NULL REFERENCES db_collection(dbid),
        tablename VARCHAR(255) NOT NULL,
        schema JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(dbid, tablename)
      )
    `);

    // Add password_reset_tokens table
    await mainPool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

initializeDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/databases', verifyToken, databasesRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/query', accessRoutes); // Added access routes
app.use('/api/access', oDataAccessRoutes);


app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ message: `Welcome, ${req.user.username}!` });
});

const port = process.env.PORT || 5000;

app.get('/', async(req, res) => {
  res.send(`Welcome`);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = { mainPool };
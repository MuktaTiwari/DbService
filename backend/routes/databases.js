const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const csv = require('csv-parser');
const { verifyToken } = require('../middleware/authMiddleware'); // Add this line
require('dotenv').config();


// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
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

// Utility function to generate API key
const generateApiKey = () => {
  const buffer = require('crypto').randomBytes(32);
  return buffer.toString('hex');
};

// POST route to create a new database and table
// Helper function to build column definition with constraints
const buildColumnDefinition = (column) => {
  let definition = `${column.name} ${column.type}`;
  
  if (column.isPrimary) {
    definition += ' PRIMARY KEY';
  }
  
  if (column.isNotNull) {
    definition += ' NOT NULL';
  }
  
  if (column.isUnique) {
    definition += ' UNIQUE';
  }
  
  if (column.defaultValue) {
    definition += ` DEFAULT ${column.defaultValue}`;
  }
  
  if (column.isForeignKey && column.foreignKeyTable && column.foreignKeyColumn) {
    definition += ` REFERENCES ${column.foreignKeyTable}(${column.foreignKeyColumn})`;
  }
  
  return definition;
};

// POST route to create a new database and table
router.post('/', verifyToken, async (req, res) => {
  const { databaseName } = req.body;
  const userId = req.user.user_id;
  let tempPool = null;
  let client = null;

  try {
    if (!databaseName) {
      return res.status(400).json({ error: 'Database name is required' });
    }

    // Connect to postgres database to create the new database
    tempPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    await tempPool.query(`CREATE DATABASE ${databaseName}`);

    // Generate API key
    const apiKey = generateApiKey();

    // Store metadata in main database
    client = await req.mainPool.connect();
    await client.query('BEGIN');

    const dbCollectionResult = await client.query(
      `INSERT INTO db_collection (dbname, user_id, apikey)
       VALUES ($1, $2, $3)
       RETURNING dbid`,
      [databaseName, userId, apiKey]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Database created successfully',
      apiKey,
      dbid: dbCollectionResult.rows[0].dbid
    });

  } catch (error) {
    console.error('Error creating database:', error);
    
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    
    // Clean up if database was created but metadata failed
    if (tempPool) {
      try {
        await tempPool.query(`
          SELECT pg_terminate_backend(pg_stat_activity.pid)
          FROM pg_stat_activity
          WHERE pg_stat_activity.datname = $1
          AND pid <> pg_backend_pid();
        `, [databaseName]);
        
        await tempPool.query(`DROP DATABASE IF EXISTS ${databaseName}`);
      } catch (dropError) {
        console.error('Error dropping database:', dropError);
      }
    }
    
    res.status(500).json({ 
      error: error.message.includes('already exists') 
        ? 'Database name already exists' 
        : 'Failed to create database'
    });
  } finally {
    if (tempPool) await tempPool.end().catch(console.error);
    if (client) client.release();
  }
});

// GET route to fetch databases for the current user
router.get('/', async (req, res) => {
  const userId = req.user.user_id; // Assuming user is authenticated and user_id is available
  let client = null;

  try {
    client = await req.mainPool.connect();
    
    // Get all databases for this user with their tables
    const result = await client.query(`
      SELECT 
        db.dbid,
        db.dbname,
        db.created_at as db_created_at,
        db.apikey,
        json_agg(
          json_build_object(
            'tableid', t.tableid,
            'tablename', t.tablename,
            'schema', t.schema,
            'created_at', t.created_at
          )
        ) as tables
      FROM db_collection db
      LEFT JOIN table_collection t ON db.dbid = t.dbid
      WHERE db.user_id = $1
      GROUP BY db.dbid, db.dbname, db.created_at, db.apikey
      ORDER BY db.created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching databases:', error);
    res.status(500).json({ error: 'Failed to fetch databases' });
  } finally {
    if (client) client.release();
  }
});
// Add this route to your existing database routes
router.post('/:dbName/create-table', upload.single('csvFile'), async (req, res) => {
  const { tableName, columns } = req.body;
  const { dbName } = req.params;
  const csvFile = req.file;
  const userId = req.user.user_id;

  let dbPool = null;
  let client = null;

  try {
    // Validate inputs first
    if (!dbName || !tableName) {
      throw new Error('Database name and table name are required');
    }

    // Start transaction early
    client = await req.mainPool.connect();
    await client.query('BEGIN');

    // Check database exists and get dbid
    const dbResult = await client.query(
      'SELECT dbid FROM db_collection WHERE dbname = $1 AND user_id = $2',
      [dbName, userId]
    );

    if (dbResult.rows.length === 0) {
      throw new Error('Database not found in metadata');
    }

    const dbid = dbResult.rows[0].dbid;

    // Check table count BEFORE any processing
    const tableCountResult = await client.query(
      'SELECT COUNT(*) AS count FROM table_collection WHERE dbid = $1',
      [dbid]
    );
    const tableCount = parseInt(tableCountResult.rows[0].count, 10);

    if (tableCount >= 3) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: 'Table limit exceeded. You can only create up to 3 tables per database.'
      });
    }

    // Now process CSV or columns
    let parsedColumns = [];
    if (columns) {
      try {
        parsedColumns = JSON.parse(columns);
      } catch (err) {
        throw new Error('Invalid columns format');
      }
    }

    if (parsedColumns.length === 0 && !csvFile) {
      throw new Error('Either columns or CSV file must be provided');
    }

    // Connect to target database
    dbPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: dbName,
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    // Process CSV/file upload
    let tableColumns = [];
    let schema = {};

    if (csvFile) {
      await new Promise((resolve, reject) => {
        fs.createReadStream(csvFile.path)
          .pipe(csv())
          .on('headers', (headers) => {
            headers.forEach(header => {
              const cleanHeader = header.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
              tableColumns.push(`${cleanHeader} TEXT`);
              schema[cleanHeader] = 'TEXT';
            });
            resolve();
          })
          .on('error', reject);
      });
    } else {
      tableColumns = parsedColumns.map(buildColumnDefinition);
      parsedColumns.forEach(col => {
        schema[col.name] = col.type;
      });
    }

    // Create table
    const createTableQuery = `CREATE TABLE ${tableName} (${tableColumns.join(', ')})`;
    await dbPool.query(createTableQuery);

    // Insert metadata
    await client.query(
      `INSERT INTO table_collection (dbid, tablename, schema)
       VALUES ($1, $2, $3)`,
      [dbid, tableName, schema]
    );

    // Commit transaction
    await client.query('COMMIT');

    if (csvFile) {
      fs.unlinkSync(csvFile.path);
    }

    res.status(201).json({
      message: `Table '${tableName}' created successfully`,
      dbid: dbid
    });

  } catch (error) {
    console.error('Error creating table:', error);
    
    // Rollback transaction if any
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError);
      }
    }
    
    // Cleanup created database connection
    if (dbPool) await dbPool.end().catch(console.error);
    
    res.status(500).json({ 
      error: error.message.includes('already exists') 
        ? 'Table already exists' 
        : error.message 
    });
  } finally {
    if (client) client.release();
  }
});



router.get('/:dbName', verifyToken, async (req, res) => {
  const { dbName } = req.params;
  const userId = req.user.user_id;
  let client = null;

  try {
    client = await req.mainPool.connect();
    
    // Get database details with tables
    const result = await client.query(`
      SELECT 
        db.dbid,
        db.dbname,
        db.apikey,
        db.created_at,
        json_agg(
          json_build_object(
            'tableid', t.tableid,
            'tablename', t.tablename,
            'schema', t.schema,
            'created_at', t.created_at
          )
        ) as tables
      FROM db_collection db
      LEFT JOIN table_collection t ON db.dbid = t.dbid
      WHERE db.dbname = $1 AND db.user_id = $2
      GROUP BY db.dbid, db.dbname, db.apikey, db.created_at
    `, [dbName, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Database not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching database details:', error);
    res.status(500).json({ error: 'Failed to fetch database details' });
  } finally {
    if (client) client.release();
  }
});

router.get('/:dbName/tables', verifyToken, async (req, res) => {
  const { dbName } = req.params;
  const userId = req.user.user_id;
  let client = null;

  try {
    client = await req.mainPool.connect();
    
    // First get the dbid for this database
    const dbResult = await client.query(
      'SELECT dbid FROM db_collection WHERE dbname = $1 AND user_id = $2',
      [dbName, userId]
    );

    if (dbResult.rows.length === 0) {
      return res.status(404).json({ error: 'Database not found' });
    }

    const dbid = dbResult.rows[0].dbid;

    // Then get all tables for this database
    const tablesResult = await client.query(
      'SELECT tableid, tablename, schema, created_at FROM table_collection WHERE dbid = $1',
      [dbid]
    );

    res.json(tablesResult.rows);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  } finally {
    if (client) client.release();
  }
});
// Add these new routes to your existing database routes

// DELETE route to delete a database
router.delete('/:dbName', verifyToken, async (req, res) => {
  const { dbName } = req.params;
  const userId = req.user.user_id;
  let tempPool = null;
  let client = null;

  try {
    // Connect to postgres database first
    tempPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    // Connect to main database to store metadata
    client = await req.mainPool.connect();
    await client.query('BEGIN');

    // Get the dbid for this database
    const dbResult = await client.query(
      'SELECT dbid FROM db_collection WHERE dbname = $1 AND user_id = $2',
      [dbName, userId]
    );

    if (dbResult.rows.length === 0) {
      return res.status(404).json({ error: 'Database not found' });
    }

    const dbid = dbResult.rows[0].dbid;

    // Delete from table_collection first (due to foreign key constraint)
    await client.query(
      'DELETE FROM table_collection WHERE dbid = $1',
      [dbid]
    );

    // Then delete from db_collection
    await client.query(
      'DELETE FROM db_collection WHERE dbid = $1',
      [dbid]
    );

    // Terminate all connections to the target database first
    await tempPool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
      AND pid <> pg_backend_pid();
    `, [dbName]);
    
    // Then drop the database
    await tempPool.query(`DROP DATABASE IF EXISTS ${dbName}`);

    await client.query('COMMIT');

    res.json({ message: 'Database deleted successfully' });

  } catch (error) {
    console.error('Error deleting database:', error);
    
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    
    res.status(500).json({ error: error.message });
  } finally {
    if (tempPool) await tempPool.end().catch(console.error);
    if (client) client.release();
  }
});

// DELETE route to delete a table
router.delete('/:dbName/tables/:tableName', verifyToken, async (req, res) => {
  const { dbName, tableName } = req.params;
  const userId = req.user.user_id;
  let dbPool = null;
  let client = null;

  try {
    // Connect to the existing database
    dbPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: dbName,
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    // Drop the table
    await dbPool.query(`DROP TABLE IF EXISTS ${tableName}`);

    // Connect to main database to store metadata
    client = await req.mainPool.connect();
    await client.query('BEGIN');

    // Get the dbid for this database
    const dbResult = await client.query(
      'SELECT dbid FROM db_collection WHERE dbname = $1 AND user_id = $2',
      [dbName, userId]
    );

    if (dbResult.rows.length === 0) {
      return res.status(404).json({ error: 'Database not found in metadata' });
    }

    const dbid = dbResult.rows[0].dbid;

    // Delete from table_collection
    await client.query(
      'DELETE FROM table_collection WHERE dbid = $1 AND tablename = $2',
      [dbid, tableName]
    );

    await client.query('COMMIT');

    res.json({ message: `Table '${tableName}' deleted successfully` });

  } catch (error) {
    console.error('Error deleting table:', error);
    
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    
    res.status(500).json({ error: error.message });
  } finally {
    if (dbPool) await dbPool.end().catch(console.error);
    if (client) client.release();
  }
});
// Add this new route to get columns for a specific table
router.get('/:dbName/tables/:tableName/columns', verifyToken, async (req, res) => {
  const { dbName, tableName } = req.params;
  const userId = req.user.user_id;
  let dbPool = null;
  let client = null;

  try {
    // First verify the user has access to this database
    client = await req.mainPool.connect();
    const dbResult = await client.query(
      'SELECT dbid FROM db_collection WHERE dbname = $1 AND user_id = $2',
      [dbName, userId]
    );

    if (dbResult.rows.length === 0) {
      return res.status(404).json({ error: 'Database not found or access denied' });
    }

    // Connect to the specific database
    dbPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: dbName,
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    // Query to get column information from the PostgreSQL information schema
    const columnsResult = await dbPool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM 
        information_schema.columns 
      WHERE 
        table_name = $1
      ORDER BY 
        ordinal_position
    `, [tableName]);

    res.json(columnsResult.rows);
  } catch (error) {
    console.error('Error fetching table columns:', error);
    res.status(500).json({ error: 'Failed to fetch table columns' });
  } finally {
    if (dbPool) await dbPool.end().catch(console.error);
    if (client) client.release();
  }
});




// PUT route to update table structure
// PUT route to update table structure
router.put('/:dbName/:tableName', verifyToken, async (req, res) => {
  const { dbName, tableName } = req.params;
  const { columns } = req.body;
  const userId = req.user.user_id;
  let dbPool = null;
  let client = null;

  try {
    // Verify user access
    client = await req.mainPool.connect();
    const dbResult = await client.query(
      'SELECT dbid FROM db_collection WHERE dbname = $1 AND user_id = $2',
      [dbName, userId]
    );

    if (dbResult.rows.length === 0) {
      return res.status(404).json({ error: 'Database not found or access denied' });
    }

    const dbid = dbResult.rows[0].dbid;

    // Connect to the specific database
    dbPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: dbName,
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    // Check if table has data
    const hasDataResult = await dbPool.query(
      `SELECT EXISTS (SELECT 1 FROM ${tableName} LIMIT 1)`
    );
    const hasData = hasDataResult.rows[0].exists;

    // Get current columns
    const currentColumns = await dbPool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = $1
    `, [tableName]);

    const currentColumnMap = {};
    currentColumns.rows.forEach(row => {
      currentColumnMap[row.column_name] = row.data_type;
    });

    const currentColumnNames = Object.keys(currentColumnMap);
    const newColumnNames = columns.map(col => col.column_name);

    // Determine columns to add and remove
    const columnsToAdd = columns.filter(col => 
      !currentColumnNames.includes(col.column_name)
    );
    const columnsToRemove = currentColumnNames.filter(name => 
      !newColumnNames.includes(name)
    );

    await dbPool.query('BEGIN');
    await client.query('BEGIN');

    // Check for type changes when data exists
    if (hasData) {
      for (const column of columns) {
        if (currentColumnMap[column.column_name] && 
            column.data_type.toLowerCase() !== currentColumnMap[column.column_name].toLowerCase()) {
          await dbPool.query('ROLLBACK');
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            error: `Cannot change data type of column ${column.column_name} Because it contains data`
          });
        }
      }
    }

    // Remove columns
    for (const columnName of columnsToRemove) {
      await dbPool.query(
        `ALTER TABLE ${tableName} DROP COLUMN IF EXISTS ${columnName}`
      );
    }

    // Add or modify columns
    for (const column of columns) {
      const columnDef = [
        column.column_name,
        column.data_type,
        column.is_nullable === 'NO' ? 'NOT NULL' : '',
        column.column_default ? `DEFAULT ${column.column_default}` : ''
      ].filter(Boolean).join(' ');

      if (columnsToAdd.some(c => c.column_name === column.column_name)) {
        // New column
        await dbPool.query(
          `ALTER TABLE ${tableName} ADD COLUMN ${columnDef}`
        );
      } else {
        // Modify existing column - only if no data or not changing type
        if (!hasData && column.data_type.toLowerCase() !== currentColumnMap[column.column_name].toLowerCase()) {
          await dbPool.query(
            `ALTER TABLE ${tableName} ALTER COLUMN ${column.column_name} TYPE ${column.data_type} 
             USING ${column.column_name}::${column.data_type}`
          );
        }

        // Handle null constraint
        await dbPool.query(
          `ALTER TABLE ${tableName} ALTER COLUMN ${column.column_name} ${column.is_nullable === 'NO' ? 'SET NOT NULL' : 'DROP NOT NULL'}`
        );

        // Handle default value
        if (column.column_default) {
          await dbPool.query(
            `ALTER TABLE ${tableName} ALTER COLUMN ${column.column_name} SET DEFAULT ${column.column_default}`
          );
        } else {
          await dbPool.query(
            `ALTER TABLE ${tableName} ALTER COLUMN ${column.column_name} DROP DEFAULT`
          );
        }
      }
    }

    // Update schema in metadata
    const schema = {};
    columns.forEach(col => {
      schema[col.column_name] = col.data_type;
    });

    await client.query(
      'UPDATE table_collection SET schema = $1 WHERE dbid = $2 AND tablename = $3',
      [schema, dbid, tableName]
    );

    await dbPool.query('COMMIT');
    await client.query('COMMIT');
    
    res.json({ 
      message: 'Table structure updated successfully',
      schema
    });
  } catch (error) {
    console.error('Error updating table:', error);
    
    if (dbPool) {
      try {
        await dbPool.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back DB transaction:', rollbackError);
      }
    }
    
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error rolling back client transaction:', rollbackError);
      }
    }
    
    res.status(500).json({ error: error.message });
  } finally {
    if (dbPool) await dbPool.end().catch(console.error);
    if (client) client.release();
  }
});




// Add this route to get table data
// Add this route to get table data
router.get('/:dbName/tables/:tableName/data', verifyToken, async (req, res) => {
  const { dbName, tableName } = req.params;
  const userId = req.user.user_id;
  let dbPool = null;
  let client = null;

  try {
    // First verify the user has access to this database
    client = await req.mainPool.connect();
    const dbResult = await client.query(
      'SELECT dbid FROM db_collection WHERE dbname = $1 AND user_id = $2',
      [dbName, userId]
    );

    if (dbResult.rows.length === 0) {
      return res.status(404).json({ error: 'Database not found or access denied' });
    }

    // Connect to the specific database
    dbPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: dbName,
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    // Query to get all data from the table
    const dataResult = await dbPool.query(`SELECT * FROM ${tableName}`);

    res.json(dataResult.rows);
  } catch (error) {
    console.error('Error fetching table data:', error);
    res.status(500).json({ error: 'Failed to fetch table data' });
  } finally {
    if (dbPool) await dbPool.end().catch(console.error);
    if (client) client.release();
  }
});

module.exports = router;
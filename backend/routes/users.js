const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { verifyToken } = require('../middleware/authMiddleware');
const { v4: uuidv4 } = require('uuid'); // Make sure to install this package
require('dotenv').config();

const generateApiKey = () => {
  const buffer = require('crypto').randomBytes(32);
  return buffer.toString('hex');
};

// GET all organizations
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await req.mainPool.query('SELECT * FROM users WHERE organization_name IS NOT NULL ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({ message: 'Error fetching organizations' });
  }
});

// POST route to create a new organization
// router.post('/', verifyToken, async (req, res) => {
//   const { 
//     organizationName, 
//     domainName, 
//     ownerEmail, 
//     firstName, 
//     lastName,
//     password
//   } = req.body;
  
//   let userId;
//   try {
//     // If the user_id is already a valid UUID, this will work
//     if (req.user.user_id && typeof req.user.user_id === 'string' && 
//         req.user.user_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
//       userId = req.user.user_id;
//     } else {
//       userId = uuidv4();
//     }
//   } catch (error) {
//     console.error('Error with user ID:', error);
//     userId = uuidv4(); // Generate UUID as fallback
//   }
  
//   let client = null;

//   try {
//     // Validate required fields
//     if (!organizationName || !domainName || !ownerEmail || !firstName || !lastName || !password) {
//       return res.status(400).json({ error: 'All fields are required' });
//     }

//     // Validate domain format
//     const domainRegex = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
//     if (!domainRegex.test(domainName)) {
//       return res.status(400).json({ error: 'Invalid domain name format' });
//     }

//     // Validate password length
//     if (password.length < 8) {
//       return res.status(400).json({ error: 'Password must be at least 8 characters long' });
//     }

//     // Validate email matches domain
//     const emailDomain = ownerEmail.split('@')[1];
//     if (emailDomain !== domainName) {
//       return res.status(400).json({ error: 'Owner email domain must match organization domain' });
//     }

//     // Verify mainPool exists
//     if (!req.mainPool) {
//       throw new Error('Database connection pool not found on request object');
//     }

//     client = await req.mainPool.connect();
//     await client.query('BEGIN');

//     // Ensure uuid-ossp extension is enabled
//     await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

//     // Check if domain is already taken
//     const domainCheck = await client.query(
//       'SELECT 1 FROM users WHERE domain_name = $1',
//       [domainName]
//     );

//     if (domainCheck.rows.length > 0) {
//       return res.status(400).json({ error: 'Domain name is already taken' });
//     }

//     // Hash the password
//     const saltRounds = 10;
//     const passwordHash = await bcrypt.hash(password, saltRounds);

//     // Store organization information in users table
//     const userResult = await client.query(
//   `INSERT INTO users (
//     user_id,
//     first_name, 
//     last_name,
//     password, 
//     organization_name, 
//     domain_name,
//     owner_email
//   ) VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6)
//   RETURNING user_id`,
//   [firstName, lastName, passwordHash, organizationName, domainName, ownerEmail]
// );

//     const newUserId = userResult.rows[0].user_id;

//     // Generate API key for the organization
//     const apiKey = generateApiKey();

//     // Create user_organizations table if not exists (with proper constraints)
//     await client.query(`
//       CREATE TABLE IF NOT EXISTS user_organizations (
//         id SERIAL PRIMARY KEY,
//         user_id UUID,
//         organization_id UUID,
//         api_key VARCHAR(255) NOT NULL
//       );
//     `);

//     // Use UUID generation directly in the query for both user_id and organization_id
//     await client.query(
//       `INSERT INTO user_organizations (user_id, organization_id, api_key)
//        VALUES (uuid_generate_v4(), $1, $2)`,
//       [newUserId, apiKey]
//     );

//     await client.query('COMMIT');

//     res.status(201).json({
//       message: 'Organization created successfully',
//       apiKey: apiKey,
//       organizationId: newUserId
//     });

//   } catch (error) {
//     console.error('Error creating organization:', error);
    
//     if (client) {
//       try {
//         await client.query('ROLLBACK');
//       } catch (rollbackError) {
//         console.error('Error rolling back transaction:', rollbackError);
//       }
//     }
    
//     res.status(500).json({ error: error.message });
//   } finally {
//     if (client) client.release();
//   }
// });

// In your routes/users.js
router.post('/', verifyToken, async (req, res) => {
  const { 
    organizationName, 
    domainName, 
    ownerEmail, 
    firstName, 
    lastName,
    password
  } = req.body;
  
  let client = null;

  try {
    // Validate required fields (keep your existing validation)

    client = await req.mainPool.connect();
    await client.query('BEGIN');

    // First, insert into organizations table
    const orgResult = await client.query(
      `INSERT INTO organizations (
        org_id,
        organization_name, 
        domain
      ) VALUES (uuid_generate_v4(), $1, $2)
      RETURNING org_id`,
      [organizationName, domainName]
    );

    const orgId = orgResult.rows[0].org_id;

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Then insert into users table with reference to the organization
    const userResult = await client.query(
      `INSERT INTO users (
        user_id,
        first_name, 
        last_name,
        password, 
        organization_name, 
        domain_name,
        owner_email,
        org_id
      ) VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7)
      RETURNING user_id`,
      [firstName, lastName, passwordHash, organizationName, domainName, ownerEmail, orgId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Organization and user created successfully',
      organizationId: orgId,
      userId: userResult.rows[0].user_id
    });

  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error creating organization:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (client) client.release();
  }
});

// Delete an organization
router.delete('/:organizationId', verifyToken, async (req, res) => {
  const { organizationId } = req.params;

  if (!organizationId) {
    return res.status(400).json({ message: 'Organization ID is required' });
  }

  const client = await req.mainPool.connect();
  try {
    await client.query('BEGIN');

    // Check if organization exists
    const orgCheck = await client.query(
      'SELECT * FROM users WHERE user_id::text = $1 AND organization_name IS NOT NULL',
      [organizationId]
    );

    if (orgCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Delete organization by updating the user record
    await client.query(
      'DELETE FROM users WHERE user_id::text = $1',
      [organizationId]
    );

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Organization deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting organization:', error);
    res.status(500).json({ 
      message: 'Error deleting organization',
      error: error.message
    });
  } finally {
    client.release();
  }
});

module.exports = router;
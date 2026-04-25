const { Client } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_0yVGPe7MxtYs@ep-small-grass-ana26xxn.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function testConnection() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Connection error code:', err.code);
    console.error('Connection error message:', err.message);
    console.error('Connection error stack:', err.stack);
  }
}

testConnection();


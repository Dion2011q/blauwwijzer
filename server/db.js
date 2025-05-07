// Database verbinding setup met PostgreSQL (geen TypeScript of Drizzle)
const { Pool } = require('pg');
const ws = require('ws');

// Controleer of DATABASE_URL is ingesteld
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL moet ingesteld zijn. Is de database wel opgezet?');
}

// Maak een pool aan voor PostgreSQL verbindingen
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// Database operaties met pure SQL (geen ORM)
async function getUserByName(username) {
  try {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows[0];
  } catch (error) {
    console.error('Fout bij ophalen gebruiker:', error);
    return null;
  }
}

async function createUser(username, calendarUrl) {
  try {
    const query = 'INSERT INTO users (username, calendar_url) VALUES ($1, $2) RETURNING *';
    const result = await pool.query(query, [username, calendarUrl]);
    return result.rows[0];
  } catch (error) {
    console.error('Fout bij aanmaken gebruiker:', error);
    return null;
  }
}

async function updateUserCalendarUrl(username, calendarUrl) {
  try {
    const query = 'UPDATE users SET calendar_url = $2 WHERE username = $1 RETURNING *';
    const result = await pool.query(query, [username, calendarUrl]);
    return result.rows[0];
  } catch (error) {
    console.error('Fout bij bijwerken kalender URL:', error);
    return null;
  }
}

// Maak de users tabel aan indien deze nog niet bestaat
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        calendar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database geïnitialiseerd');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Exporteer database functies
module.exports = {
  initializeDatabase,
  getUserByName,
  createUser,
  updateUserCalendarUrl
};
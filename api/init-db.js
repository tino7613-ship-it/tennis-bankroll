import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bets (
        id SERIAL PRIMARY KEY,
        user_name VARCHAR(50) NOT NULL,
        match_name VARCHAR(200) NOT NULL,
        pari VARCHAR(200) NOT NULL,
        cote DECIMAL(10,2) NOT NULL,
        mise DECIMAL(10,2) NOT NULL,
        result VARCHAR(20) DEFAULT 'pending',
        jour VARCHAR(50),
        tournoi VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    return res.json({ success: true, message: 'Tables créées !' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

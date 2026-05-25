import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    await pool.query('DELETE FROM bets');
    await pool.query('DELETE FROM bankroll_settings');
    return res.json({ success: true, message: 'Reset complet !' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
// reset

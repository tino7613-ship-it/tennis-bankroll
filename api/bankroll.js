import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bankroll_settings (
        id SERIAL PRIMARY KEY,
        user_name VARCHAR(50) UNIQUE NOT NULL,
        starting_amount DECIMAL(10,2) DEFAULT 100,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    if (req.method === 'GET') {
      const { user } = req.query;
      const r = await pool.query('SELECT * FROM bankroll_settings WHERE user_name=$1', [user]);
      if (r.rows.length === 0) return res.json({ starting_amount: 100 });
      return res.json(r.rows[0]);
    }

    if (req.method === 'POST') {
      const { user, starting_amount } = req.body;
      const r = await pool.query(
        'INSERT INTO bankroll_settings (user_name, starting_amount) VALUES ($1,$2) ON CONFLICT (user_name) DO UPDATE SET starting_amount=$2, updated_at=NOW() RETURNING *',
        [user, starting_amount]
      );
      return res.json(r.rows[0]);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

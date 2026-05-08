import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await pool.query(`
      ALTER TABLE bets ADD COLUMN IF NOT EXISTS conseil_pct INTEGER;
    `);

    if (req.method === 'GET') {
      const result = await pool.query('SELECT * FROM bets ORDER BY created_at DESC');
      return res.json(result.rows);
    }
    if (req.method === 'POST') {
      const { user, match, pari, cote, mise, jour, tournoi, conseil_pct } = req.body;
      const result = await pool.query(
        'INSERT INTO bets (user_name, match_name, pari, cote, mise, result, jour, tournoi, conseil_pct) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
        [user, match, pari, cote, mise, 'pending', jour, tournoi, conseil_pct || null]
      );
      return res.json(result.rows[0]);
    }
    if (req.method === 'PUT') {
      const { id, result, mise, jour } = req.body;
      if (mise !== undefined) {
        const r = await pool.query('UPDATE bets SET mise=$1 WHERE id=$2 RETURNING *', [mise, id]);
        return res.json(r.rows[0]);
      }
      if (jour !== undefined) {
        const r = await pool.query('UPDATE bets SET jour=$1 WHERE id=$2 RETURNING *', [jour, id]);
        return res.json(r.rows[0]);
      }
      const r = await pool.query('UPDATE bets SET result=$1 WHERE id=$2 RETURNING *', [result, id]);
      return res.json(r.rows[0]);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      await pool.query('DELETE FROM bets WHERE id=$1', [id]);
      return res.json({ success: true });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

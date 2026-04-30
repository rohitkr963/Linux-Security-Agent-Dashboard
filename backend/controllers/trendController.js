const db = require('../db/database');
const { ok, serverErr } = require('../utils/respond');

exports.getTrend = async (_req, res) => {
  try {
    // Get average score per day for the last 30 days
    const trend = await db.all(`
      SELECT 
        DATE(createdAt) as date,
        ROUND(AVG(score), 1) as avgScore
      FROM scan_history
      WHERE createdAt >= date('now', '-30 days')
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `);
    
    return ok(res, trend || []);
  } catch (err) {
    console.error('[TREND ERROR]', err);
    return serverErr(res, 'Failed to fetch compliance trend');
  }
};

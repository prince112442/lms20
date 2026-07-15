// controllers/dashboardController.js
const pool = require("../config/db");

// GET /api/dashboard/stats
async function getStats(req, res) {
  try {
    const [[{ totalMembers }]] = await pool.query(`SELECT COUNT(*) AS totalMembers FROM members`);
    const [[{ issuedBooks }]] = await pool.query(
      `SELECT COUNT(*) AS issuedBooks FROM issued_books WHERE status IN ('ISSUED','OVERDUE')`
    );
    const [[{ totalBooks }]] = await pool.query(`SELECT COALESCE(SUM(total_copies),0) AS totalBooks FROM books`);
    const [[{ totalFine }]] = await pool.query(
      `SELECT COALESCE(SUM(amount),0) AS totalFine FROM fines WHERE status = 'UNPAID'`
    );

    // Month-over-month deltas are optional polish — wire these up once you have
    // historical snapshots. For now they default to 0 so the UI still renders.
    res.json({
      totalMembers, membersDelta: 0,
      issuedBooks, issuedDelta: 0,
      totalBooks, totalBooksDelta: 0,
      totalFine, fineDelta: 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load dashboard stats" });
  }
}

// GET /api/dashboard/books-overview?range=week
async function getBooksOverview(req, res) {
  const days = req.query.range === "month" ? 30 : req.query.range === "year" ? 365 : 7;

  try {
    const [issuedRows] = await pool.query(
      `SELECT DATE(issue_date) AS day, COUNT(*) AS count
       FROM issued_books
       WHERE issue_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(issue_date) ORDER BY day`,
      [days]
    );
    const [returnedRows] = await pool.query(
      `SELECT DATE(return_date) AS day, COUNT(*) AS count
       FROM issued_books
       WHERE return_date IS NOT NULL AND return_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(return_date) ORDER BY day`,
      [days]
    );

    res.json({
      labels: issuedRows.map(r => r.day),
      issued: issuedRows.map(r => r.count),
      returned: returnedRows.map(r => r.count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load books overview" });
  }
}

// GET /api/dashboard/activity
async function getActivity(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT actor_name, action, created_at
       FROM activity_log ORDER BY created_at DESC LIMIT 5`
    );
    res.json(rows.map(r => ({
      iconName: "check",
      text: `${r.actor_name} ${r.action}`,
      time: r.created_at
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load recent activity" });
  }
}

// GET /api/dashboard/top-books  (by category, matching the donut chart)
async function getTopBooks(req, res) {
  const colors = ["#1f9d6b", "#2f6fed", "#7c5cf0", "#f0972f", "#ef4b7a"];
  try {
    const [rows] = await pool.query(
      `SELECT c.name, SUM(b.total_copies) AS value
       FROM books b JOIN categories c ON b.category_id = c.id
       GROUP BY c.name ORDER BY value DESC LIMIT 5`
    );
    res.json(rows.map((r, i) => ({ name: r.name, value: r.value, color: colors[i % colors.length] })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load top books" });
  }
}

module.exports = { getStats, getBooksOverview, getActivity, getTopBooks };

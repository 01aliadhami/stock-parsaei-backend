const express = require("express");
const pool = require("../db");
const { authenticate } = require("../middleware/auth");
const { isAdmin } = require("../middleware/admin");

const router = express.Router();

// همه مسیرهای کاربران نیاز به ادمین دارن
router.use(authenticate);
router.use(isAdmin);

// لیست همه کاربران
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        u.id, u.username, u.name, u.email, 
        u.is_admin, u.is_blocked, 
        u.created_at, u.last_login,
        (SELECT COUNT(*) FROM orders WHERE user_id = u.id) AS orders_count
      FROM users u
      ORDER BY u.id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

// تغییر وضعیت مسدود
router.put("/:id/block", async (req, res) => {
  try {
    const { blocked } = req.body;
    const userId = req.params.id;

    // نذار ادمین خودش رو مسدود کنه
    if (Number(userId) === req.user.userId) {
      return res.status(400).json({ error: "نمی‌تونی خودت رو مسدود کنی" });
    }

    await pool.execute("UPDATE users SET is_blocked = ? WHERE id = ?", [
      !!blocked,
      userId,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

// تغییر وضعیت ادمین
router.put("/:id/admin", async (req, res) => {
  try {
    const { admin } = req.body;
    const userId = req.params.id;

    // نذار ادمین خودش رو از ادمینی دربیاره
    if (Number(userId) === req.user.userId) {
      return res
        .status(400)
        .json({ error: "نمی‌تونی خودت رو از ادمینی دربیاری" });
    }

    await pool.execute("UPDATE users SET is_admin = ? WHERE id = ?", [
      !!admin,
      userId,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

module.exports = router;

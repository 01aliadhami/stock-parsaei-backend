const express = require("express");
const pool = require("../db");
const { authenticate } = require("../middleware/auth");
const { isAdmin } = require("../middleware/admin");

const router = express.Router();

// همه تنظیمات (public - برای نمایش در سایت)
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT setting_key, setting_value FROM settings",
    );
    const settings = {};
    rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

// آپدیت تنظیمات (ادمین)
router.put("/", authenticate, isAdmin, async (req, res) => {
  try {
    const updates = req.body; // { card_number: '...', shop_phone: '...' }

    for (const [key, value] of Object.entries(updates)) {
      await pool.execute(
        `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [key, value, value],
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

module.exports = router;

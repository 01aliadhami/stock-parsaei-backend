const express = require("express");
const pool = require("../db");
const { authenticate } = require("../middleware/auth");
const { isAdmin } = require("../middleware/admin");

const router = express.Router();

// ===== دریافت همه دسته‌ها (عمومی) =====
router.get("/", async (req, res) => {
  try {
    const { type } = req.query;
    const sql = type
      ? "SELECT * FROM categories WHERE type = ? ORDER BY name"
      : "SELECT * FROM categories ORDER BY type, name";
    const [rows] = await pool.execute(sql, type ? [type] : []);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

// ===== افزودن دسته (فقط ادمین) =====
router.post("/", authenticate, isAdmin, async (req, res) => {
  try {
    const { name, slug, type } = req.body;

    if (!name || !slug || !type) {
      return res.status(400).json({ error: "همه فیلدها الزامی است" });
    }

    if (!["car", "part"].includes(type)) {
      return res.status(400).json({ error: "نوع نامعتبر" });
    }

    const [result] = await pool.execute(
      "INSERT INTO categories (name, slug, type) VALUES (?, ?, ?)",
      [name, slug, type],
    );

    res.status(201).json({ id: result.insertId, name, slug, type });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "این slug قبلاً استفاده شده" });
    }
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

// ===== حذف دسته (فقط ادمین) =====
router.delete("/:id", authenticate, isAdmin, async (req, res) => {
  try {
    await pool.execute("DELETE FROM categories WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

module.exports = router;

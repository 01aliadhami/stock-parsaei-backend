const express = require("express");
const pool = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM products ORDER BY id DESC",
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM products WHERE id = ?", [
      req.params.id,
    ]);
    if (!rows.length) return res.status(404).json({ error: "محصول یافت نشد" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const {
      title,
      price,
      car,
      category,
      condition,
      image,
      description,
      stock,
    } = req.body;
    if (!title || !price) {
      return res.status(400).json({ error: "عنوان و قیمت الزامی است" });
    }

    const [result] = await pool.execute(
      `INSERT INTO products (title, price, car, category, \`condition\`, image, description, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, price, car, category, condition, image, description, stock || 1],
    );

    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.put("/:id", authenticate, async (req, res) => {
  try {
    const {
      title,
      price,
      car,
      category,
      condition,
      image,
      description,
      stock,
    } = req.body;
    await pool.execute(
      `UPDATE products SET title = ?, price = ?, car = ?, category = ?,
       \`condition\` = ?, image = ?, description = ?, stock = ? WHERE id = ?`,
      [
        title,
        price,
        car,
        category,
        condition,
        image,
        description,
        stock,
        req.params.id,
      ],
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    await pool.execute("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "خطای سرور" });
  }
});

module.exports = router;

const express = require("express");
const pool = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.id, c.product_id, c.qty,
              p.title, p.price, p.image, p.car, p.stock
       FROM carts c
       JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ?
       ORDER BY c.id DESC`,
      [req.user.userId],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.post("/add", async (req, res) => {
  try {
    const { product_id, qty = 1 } = req.body;
    const userId = req.user.userId;
    if (!product_id)
      return res.status(400).json({ error: "شناسه محصول الزامی" });

    const [existing] = await pool.execute(
      "SELECT id, qty FROM carts WHERE user_id = ? AND product_id = ?",
      [userId, product_id],
    );

    if (existing.length) {
      await pool.execute("UPDATE carts SET qty = qty + ? WHERE id = ?", [
        qty,
        existing[0].id,
      ]);
    } else {
      await pool.execute(
        "INSERT INTO carts (user_id, product_id, qty) VALUES (?, ?, ?)",
        [userId, product_id, qty],
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.put("/item/:id", async (req, res) => {
  try {
    const { qty } = req.body;
    if (qty < 1) {
      await pool.execute("DELETE FROM carts WHERE id = ? AND user_id = ?", [
        req.params.id,
        req.user.userId,
      ]);
    } else {
      await pool.execute(
        "UPDATE carts SET qty = ? WHERE id = ? AND user_id = ?",
        [qty, req.params.id, req.user.userId],
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.delete("/item/:id", async (req, res) => {
  try {
    await pool.execute("DELETE FROM carts WHERE id = ? AND user_id = ?", [
      req.params.id,
      req.user.userId,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.delete("/clear", async (req, res) => {
  try {
    await pool.execute("DELETE FROM carts WHERE user_id = ?", [
      req.user.userId,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "خطای سرور" });
  }
});

module.exports = router;

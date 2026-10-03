const express = require("express");
const pool = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.post("/", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { customer, phone, address, postalCode, note, receipt, tracking } =
      req.body;

    const [cartItems] = await conn.execute(
      `SELECT c.product_id, c.qty, p.title, p.price
       FROM carts c
       JOIN products p ON p.id = c.product_id
       WHERE c.user_id = ?`,
      [req.user.userId],
    );

    if (!cartItems.length) {
      await conn.rollback();
      return res.status(400).json({ error: "سبد خرید خالی است" });
    }

    const total = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);

    const [orderResult] = await conn.execute(
      `INSERT INTO orders (user_id, customer, phone, address, postal_code, note, total, receipt, tracking)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.userId,
        customer,
        phone,
        address,
        postalCode,
        note,
        total,
        receipt,
        tracking,
      ],
    );

    const orderId = orderResult.insertId;

    for (const item of cartItems) {
      await conn.execute(
        `INSERT INTO order_items (order_id, product_id, title, price, qty)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.title, item.price, item.qty],
      );
    }

    await conn.execute("DELETE FROM carts WHERE user_id = ?", [
      req.user.userId,
    ]);
    await conn.commit();
    res.status(201).json({ id: orderId, total });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  } finally {
    conn.release();
  }
});

router.get("/my", async (req, res) => {
  try {
    const [orders] = await pool.execute(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC",
      [req.user.userId],
    );
    for (const order of orders) {
      const [items] = await pool.execute(
        "SELECT * FROM order_items WHERE order_id = ?",
        [order.id],
      );
      order.items = items;
    }
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.get("/", async (req, res) => {
  try {
    const [orders] = await pool.execute(
      "SELECT * FROM orders ORDER BY id DESC",
    );
    for (const order of orders) {
      const [items] = await pool.execute(
        "SELECT * FROM order_items WHERE order_id = ?",
        [order.id],
      );
      order.items = items;
    }
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "approved", "rejected", "shipped"].includes(status)) {
      return res.status(400).json({ error: "وضعیت نامعتبر" });
    }
    await pool.execute("UPDATE orders SET status = ? WHERE id = ?", [
      status,
      req.params.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "خطای سرور" });
  }
});

module.exports = router;

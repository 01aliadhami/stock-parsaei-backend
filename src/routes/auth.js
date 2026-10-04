const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// ===== ثبت‌نام =====
router.post("/register", async (req, res) => {
  try {
    const { username, password, name, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "نام کاربری و رمز الزامی است" });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: "نام کاربری حداقل ۳ کاراکتر" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "رمز حداقل ۶ کاراکتر" });
    }

    const [exists] = await pool.execute(
      "SELECT id FROM users WHERE username = ?",
      [username],
    );
    if (exists.length) {
      return res.status(400).json({ error: "این نام کاربری قبلاً ثبت شده" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      "INSERT INTO users (username, password, name, email) VALUES (?, ?, ?, ?)",
      [username, hashed, name || null, email || null],
    );

    const token = jwt.sign(
      { userId: result.insertId, username, isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: "30d" },
    );

    res.status(201).json({
      token,
      user: {
        id: result.insertId,
        username,
        name: name || null,
        email: email || null,
        isAdmin: false,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

// ===== ورود =====
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "نام کاربری و رمز الزامی است" });
    }

    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE username = ?",
      [username],
    );
    if (!rows.length) {
      return res.status(401).json({ error: "نام کاربری یا رمز اشتباه است" });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "نام کاربری یا رمز اشتباه است" });
    }
    if (user.is_blocked) {
      return res.status(403).json({ error: "حساب شما مسدود شده است" });
    }

    await pool.execute("UPDATE users SET last_login = NOW() WHERE id = ?", [
      user.id,
    ]);

    const token = jwt.sign(
      { userId: user.id, username: user.username, isAdmin: !!user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: "30d" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        isAdmin: !!user.is_admin,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

// ===== اطلاعات کاربر فعلی =====
router.get("/me", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, username, name, email, is_admin, created_at FROM users WHERE id = ?",
      [req.user.userId],
    );
    if (!rows.length) return res.status(404).json({ error: "کاربر یافت نشد" });

    res.json({
      user: {
        id: rows[0].id,
        username: rows[0].username,
        name: rows[0].name,
        email: rows[0].email,
        isAdmin: !!rows[0].is_admin,
        created_at: rows[0].created_at,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

module.exports = router;

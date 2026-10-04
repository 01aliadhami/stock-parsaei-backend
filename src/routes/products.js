const express = require("express");
const multer = require("multer");
const path = require("path");
const pool = require("../db");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// ===== تنظیمات ذخیره‌سازی =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

// ===== فیلتر فایل (فقط JPG/PNG/WebP) =====
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

    console.log("📁 نام:", file.originalname, "| پسوند:", ext);

    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("فقط عکس JPG یا PNG آپلود کن"));
    }
  },
});

// ===== دریافت همه محصولات =====
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

// ===== دریافت یه محصول =====
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

// ===== افزودن محصول =====
router.post("/", authenticate, upload.single("image"), async (req, res) => {
  try {
    const { title, price, car, category, condition, description, stock } =
      req.body;

    if (!title || !price) {
      return res.status(400).json({ error: "عنوان و قیمت الزامی است" });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
      console.log("✅ عکس ذخیره شد:", imageUrl);
    } else if (req.body.image && req.body.image.startsWith("http")) {
      imageUrl = req.body.image;
    }

    const [result] = await pool.execute(
      `INSERT INTO products (title, price, car, category, \`condition\`, image, description, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        price,
        car,
        category,
        condition,
        imageUrl,
        description,
        stock || 1,
      ],
    );

    res.status(201).json({ id: result.insertId, image: imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

// ===== ویرایش محصول =====
router.put("/:id", authenticate, upload.single("image"), async (req, res) => {
  try {
    const { title, price, car, category, condition, description, stock } =
      req.body;

    let imageUrl = null;
    if (req.file) {
      imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
      console.log("✅ عکس جدید ذخیره شد:", imageUrl);
    } else if (req.body.image && req.body.image.startsWith("http")) {
      imageUrl = req.body.image;
    }

    await pool.execute(
      `UPDATE products SET title = ?, price = ?, car = ?, category = ?,
       \`condition\` = ?, image = ?, description = ?, stock = ? WHERE id = ?`,
      [
        title,
        price,
        car,
        category,
        condition,
        imageUrl,
        description,
        stock,
        req.params.id,
      ],
    );

    res.json({ success: true, image: imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

// ===== حذف محصول =====
router.delete("/:id", authenticate, async (req, res) => {
  try {
    await pool.execute("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطای سرور" });
  }
});

module.exports = router;

const express = require("express");
const multer = require("multer");
const path = require("path");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

// تنظیمات ذخیره‌سازی
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// فیلتر فرمت فایل
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("فقط فایل تصویری مجاز است"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// آپلود عکس (فقط کاربر لاگین‌شده)
router.post("/", authenticate, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "فایلی آپلود نشد" });
  }

  const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url: imageUrl, filename: req.file.filename });
});

module.exports = router;

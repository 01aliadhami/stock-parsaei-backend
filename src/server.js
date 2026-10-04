console.log("🚀 شروع سرور...");

const express = require("express");
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

console.log("📦 پکیج‌ها لود شدند");

// ===== روت‌ها =====
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const uploadRoutes = require("./routes/upload");
const settingsRoutes = require("./routes/settings");
const userRoutes = require("./routes/users");
const categoryRoutes = require("./routes/categories");

console.log("✅ روت‌ها لود شدند");

const app = express();

// ===== CORS =====
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  }),
);

// ===== Rate Limiting =====
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: "درخواست‌های زیادی فرستادی، لطفاً بعداً تلاش کن" },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "تلاش‌های زیادی برای ورود، ۱۵ دقیقه صبر کن" },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "تعداد ثبت‌نام از این IP زیاده، بعداً تلاش کن" },
  standardHeaders: true,
  legacyHeaders: false,
});

const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "تعداد سفارش‌های شما زیاده، بعداً تلاش کن" },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== Middleware =====
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

console.log("⚙️ Middleware ست شد");

// ===== فایل‌های استاتیک =====
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads"), {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
      res.set("Cache-Control", "public, max-age=3600");
    },
  }),
);

// ===== APIها با Rate Limiting =====
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/register", registerLimiter);
app.use("/api/orders", orderLimiter);
app.use("/api", generalLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);

// ===== تست سرور =====
app.get("/", (req, res) => {
  res.json({ ok: true, message: "Stock Parsaei API" });
});

// ===== مدیریت خطا =====
app.use((err, req, res, next) => {
  console.error("❌ خطا:", err.message);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "حجم فایل بیشتر از حد مجاز است" });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "توکن نامعتبر" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "توکن منقضی شده" });
  }

  res.status(500).json({ error: "خطای داخلی سرور" });
});

// ===== 404 =====
app.use((req, res) => {
  res.status(404).json({ error: "مسیر یافت نشد" });
});

console.log("🛣️ روت‌ها ست شدند");

// ===== اجرای سرور =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ سرور روی http://localhost:${PORT} اجرا شد`);
  console.log(`🔒 امنیت: Rate Limiting فعال`);
});

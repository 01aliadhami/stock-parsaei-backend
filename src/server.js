console.log("🚀 شروع سرور...");

const express = require("express");
const cors = require("cors");
require("dotenv").config();

console.log("📦 پکیج‌های اصلی لود شدند");

const authRoutes = require("./routes/auth");
console.log("✅ auth routes");

const productRoutes = require("./routes/products");
console.log("✅ product routes");

const cartRoutes = require("./routes/cart");
console.log("✅ cart routes");

const orderRoutes = require("./routes/orders");
console.log("✅ order routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

console.log("⚙️ Middleware ست شد");

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Stock Parsaei API" });
});

console.log("🛣️ روت‌ها ست شدند");

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ سرور روی http://localhost:${PORT} اجرا شد`);
});

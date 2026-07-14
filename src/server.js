require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDB, getDBStatus } = require("./config/db");
const errorHandler = require("./middleware/errorMiddleware");

const app = express();

// Express Middlewares
app.use(express.json());
app.use(cookieParser());

// CORS configuration supporting dynamic client origins and credential cookies
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://aonelube.com', 'https://www.aonelube.com', process.env.CLIENT_URL].filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:3001'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Healthcheck Route detailing DB mode
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "A One Lub REST API Service is healthy",
    timestamp: new Date().toISOString(),
    databaseMode: getDBStatus() ? "MongoDB Live" : "MongoDB Disconnected",
  });
});

// Mount Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// Root Index route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "A One Lub REST API Service",
  });
});

// Express global exception interceptor
app.use(errorHandler);

// Establish database and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`API Base Address: http://localhost:${PORT}`);
    console.log(`DB Mode: ${getDBStatus() ? "MongoDB-Live" : "MongoDB-Disconnected"}`);
    console.log("================================================================\n");
  });
};

if (require.main === module) {
  startServer().catch(() => {
    process.exit(1);
  });
}

module.exports = app;

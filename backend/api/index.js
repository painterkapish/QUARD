const express = require("express");
const cors = require("cors");
const dataRoutes = require("../routes/data");
const imageRoutes = require("../routes/images");

const app = express();

const registrationRoutes = require("../routes/registration");
app.use("/api/registrations", registrationRoutes);
// CORS — allow only your Vercel frontend
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PATCH", "DELETE"],
}));

app.use(express.json());

// Routes
app.use("/api/items", dataRoutes);
app.use("/api/images", imageRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Export for Vercel
module.exports = app;
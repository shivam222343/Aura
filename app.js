import express from 'express';
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import connection from './db/db.js';
import router from './routes/user.routes.js'
import artrouter from './routes/art.router.js'

// Initialize app
dotenv.config();
connection();

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

// Routes
app.use("/user", router);
app.use("/art", artrouter);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: err.message || "Server Error" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

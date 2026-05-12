"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5001;
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Database Connection (Neon)
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Requerido para muchas DBs en la nube como Neon
    }
});
// Test DB Route
app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as currentTime');
        res.json({
            status: 'ok',
            db_connection: 'success',
            timestamp: result.rows[0].currenttime
        });
    }
    catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to connect to database',
            error: error.message
        });
    }
});
// Start Server
app.listen(port, () => {
    console.log(`AXON TIRE Backend running on port ${port}`);
});
//# sourceMappingURL=index.js.map
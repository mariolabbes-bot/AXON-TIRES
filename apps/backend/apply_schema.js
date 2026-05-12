"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '.env') });
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
async function run() {
    try {
        const schemaSql = fs_1.default.readFileSync(path_1.default.join(__dirname, 'db', 'schema.sql'), 'utf-8');
        console.log('Aplicando schema...');
        await pool.query(schemaSql);
        console.log('Schema aplicado correctamente.');
        process.exit(0);
    }
    catch (error) {
        console.error('Error aplicando schema:', error);
        process.exit(1);
    }
}
run();
//# sourceMappingURL=apply_schema.js.map
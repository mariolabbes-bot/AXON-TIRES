import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

import tireRoutes from './routes/tireRoutes';
import assignmentRoutes from './routes/assignmentRoutes';
import telemetryRoutes from './routes/telemetryRoutes';
import companyRoutes from './routes/companyRoutes';
import branchRoutes from './routes/branchRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import assetRoutes from './routes/assetRoutes';
import { requireCompany } from './middleware/authMiddleware';

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas protegidas (Multi-Tenant)
app.use('/api/branches', requireCompany, branchRoutes);
app.use('/api/purchases', requireCompany, purchaseRoutes);
app.use('/api/vehicles', requireCompany, vehicleRoutes);
app.use('/api/assets', requireCompany, assetRoutes);
app.use('/api/tires', requireCompany, tireRoutes);
app.use('/api/assignments', requireCompany, assignmentRoutes);
app.use('/api/telemetry', requireCompany, telemetryRoutes);
app.use('/api/companies', requireCompany, companyRoutes);

// Test DB Route
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as currentTime');
    res.json({
      status: 'ok',
      db_connection: 'success',
      timestamp: result.rows[0].currenttime
    });
  } catch (error: any) {
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

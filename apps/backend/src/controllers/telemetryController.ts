import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import pool from '../db';

export const createTelemetryReading = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  const { sensor_mac, pressure_psi, temperature_c } = req.body;

  try {
    // Verificar que la empresa permita TPMS y que el sensor le pertenezca
    const companyRes = await pool.query('SELECT subscription_plan FROM companies WHERE id = $1', [companyId]);
    if (companyRes.rows[0].subscription_plan === 'RFID_ONLY') {
      return res.status(403).json({ error: 'Telemetry not allowed on RFID_ONLY plan' });
    }

    const sensorRes = await pool.query('SELECT 1 FROM sensors WHERE mac_address = $1 AND company_id = $2', [sensor_mac, companyId]);
    if (sensorRes.rows.length === 0) {
       return res.status(404).json({ error: 'Sensor not found in company inventory' });
    }

    const result = await pool.query(
      `INSERT INTO telemetry_readings (sensor_mac, pressure_psi, temperature_c) 
       VALUES ($1, $2, $3) RETURNING *`,
      [sensor_mac, pressure_psi, temperature_c]
    );

    await pool.query(`UPDATE sensors SET last_seen = NOW() WHERE mac_address = $1`, [sensor_mac]);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTireTelemetry = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  const { tire_fire_mark } = req.params;

  try {
    const query = `
      SELECT tr.pressure_psi, tr.temperature_c, tr.reading_timestamp, a.vehicle_id, a.axle_position
      FROM assignments a
      JOIN telemetry_readings tr ON a.sensor_mac = tr.sensor_mac
      WHERE a.tire_fire_mark = $1 AND a.company_id = $2
        AND tr.reading_timestamp >= a.assigned_at
        AND (a.unassigned_at IS NULL OR tr.reading_timestamp <= a.unassigned_at)
      ORDER BY tr.reading_timestamp DESC
      LIMIT 100
    `;
    const result = await pool.query(query, [tire_fire_mark, companyId]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

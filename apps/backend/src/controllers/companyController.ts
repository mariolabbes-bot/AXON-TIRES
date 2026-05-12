import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import pool from '../db';

// Endpoint para carga masiva inicial (Onboarding)
export const bulkOnboard = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  const { vehicles, tires } = req.body; 
  // vehicles: [{ plate, vehicle_type, axle_config, current_odometer }]
  // tires: [{ fire_mark_id, rfid_id, brand, size, initial_depth }]

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Insertar Vehículos
    if (vehicles && vehicles.length > 0) {
      for (const v of vehicles) {
        await client.query(
          `INSERT INTO vehicles (company_id, plate, vehicle_type, axle_config, current_odometer)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`,
          [companyId, v.plate, v.vehicle_type, v.axle_config, v.current_odometer || 0]
        );
      }
    }

    // 2. Insertar Neumáticos
    if (tires && tires.length > 0) {
      for (const t of tires) {
        await client.query(
          `INSERT INTO tires (company_id, fire_mark_id, rfid_id, brand, size, initial_depth, state)
           VALUES ($1, $2, $3, $4, $5, $6, 'Bodega') ON CONFLICT DO NOTHING`,
          [companyId, t.fire_mark_id, t.rfid_id, t.brand, t.size, t.initial_depth]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Onboarding data imported successfully' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

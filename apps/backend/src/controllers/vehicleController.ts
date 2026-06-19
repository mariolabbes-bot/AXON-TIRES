import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import pool from '../db';

export const getVehicles = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  try {
    const query = `
      SELECT 
        v.*,
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'fire_mark_id', t.fire_mark_id,
              'axle_position', ta.axle_position,
              'sensor_mac', ta.sensor_mac,
              'brand', t.brand,
              'state', t.state
            ))
            FROM tire_assignments ta
            JOIN tires t ON t.fire_mark_id = ta.tire_fire_mark
            WHERE ta.vehicle_id = v.id AND ta.is_active = TRUE AND ta.company_id = $1
          ), '[]'::json
        ) as tires,
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'id', a.id,
              'asset_type', a.asset_type,
              'serial_number', a.serial_number,
              'state', a.state,
              'rfid_id', a.rfid_id
            ))
            FROM asset_assignments aa
            JOIN assets a ON a.id = aa.asset_id
            WHERE aa.vehicle_id = v.id AND aa.is_active = TRUE AND aa.company_id = $1
          ), '[]'::json
        ) as general_assets
      FROM vehicles v
      WHERE v.company_id = $1
      ORDER BY v.created_at DESC
    `;
    const result = await pool.query(query, [companyId]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createVehicle = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  const { branch_id, plate, rfid_id, vehicle_type, axle_config, current_odometer, brand, model, year } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO vehicles (company_id, branch_id, plate, rfid_id, vehicle_type, axle_config, current_odometer, brand, model, year)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [companyId, branch_id || null, plate, rfid_id || null, vehicle_type, axle_config, current_odometer || 0, brand || null, model || null, year || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import pool from '../db';

export const getVehicles = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  try {
    const result = await pool.query('SELECT * FROM vehicles WHERE company_id = $1 ORDER BY created_at DESC', [companyId]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createVehicle = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  const { branch_id, plate, rfid_id, vehicle_type, axle_config, current_odometer } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO vehicles (company_id, branch_id, plate, rfid_id, vehicle_type, axle_config, current_odometer) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [companyId, branch_id, plate, rfid_id, vehicle_type, axle_config, current_odometer || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

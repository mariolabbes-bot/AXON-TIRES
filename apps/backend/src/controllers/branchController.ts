import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import pool from '../db';

export const getBranches = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  try {
    const result = await pool.query('SELECT * FROM branches WHERE company_id = $1 ORDER BY created_at ASC', [companyId]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createBranch = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  const { name, type, address } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO branches (company_id, name, type, address) VALUES ($1, $2, $3, $4) RETURNING *`,
      [companyId, name, type, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

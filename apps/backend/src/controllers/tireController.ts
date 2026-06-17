import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import pool from '../db';

export const getTires = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  try {
    const result = await pool.query('SELECT * FROM tires WHERE company_id = $1 ORDER BY created_at DESC', [companyId]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTireState = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  const { fire_mark_id } = req.params;
  const { new_state, branch_id, reason, operator_id } = req.body;

  try {
    await pool.query('BEGIN');
    
    const tireRes = await pool.query('SELECT state FROM tires WHERE fire_mark_id = $1 AND company_id = $2', [fire_mark_id, companyId]);
    if (tireRes.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Tire not found or access denied' });
    }
    const previous_state = tireRes.rows[0].state;

    const updateRes = await pool.query(
      'UPDATE tires SET state = $1, branch_id = $2 WHERE fire_mark_id = $3 AND company_id = $4 RETURNING *',
      [new_state, branch_id, fire_mark_id, companyId]
    );

    await pool.query(
      `INSERT INTO tire_state_logs (company_id, tire_fire_mark, previous_state, new_state, branch_id, reason, operator_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [companyId, fire_mark_id, previous_state, new_state, branch_id, reason, operator_id]
    );

    await pool.query('COMMIT');
    res.json(updateRes.rows[0]);
  } catch (error: any) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
};

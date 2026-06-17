import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import pool from '../db';

export const getAssets = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  try {
    const result = await pool.query('SELECT * FROM assets WHERE company_id = $1 ORDER BY created_at DESC', [companyId]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAssetState = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  const { id } = req.params;
  const { new_state, branch_id, reason, operator_id } = req.body;

  try {
    await pool.query('BEGIN');
    
    const assetRes = await pool.query('SELECT state FROM assets WHERE id = $1 AND company_id = $2', [id, companyId]);
    if (assetRes.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Asset not found or access denied' });
    }
    const previous_state = assetRes.rows[0].state;

    // Actualizar estado y branch
    const updateRes = await pool.query(
      'UPDATE assets SET state = $1, branch_id = $2 WHERE id = $3 AND company_id = $4 RETURNING *',
      [new_state, branch_id, id, companyId]
    );

    // Insertar en log
    await pool.query(
      `INSERT INTO asset_state_logs (company_id, asset_id, previous_state, new_state, branch_id, reason, operator_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [companyId, id, previous_state, new_state, branch_id, reason, operator_id]
    );

    await pool.query('COMMIT');
    res.json(updateRes.rows[0]);
  } catch (error: any) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
};

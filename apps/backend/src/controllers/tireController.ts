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

export const massUpdateTires = async (req: AuthRequest, res: Response) => {
    const companyId = req.companyId;
    const { action_type, new_state, rfids } = req.body; // rfids = array of fire_mark_id
    const document_number = `DOC-${Date.now()}`;
    const operator_id = null; // until we add real auth

    try {
        await pool.query('BEGIN');
        
        // Update all tires
        const updateRes = await pool.query(
            `UPDATE tires SET state = $1 
             WHERE fire_mark_id = ANY($2::text[]) AND company_id = $3
             RETURNING fire_mark_id`,
            [new_state, rfids, companyId]
        );

        // Generate control document
        const insertDoc = await pool.query(
            `INSERT INTO control_documents (company_id, document_number, action_type, operator_id, affected_tires)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [companyId, document_number, action_type, operator_id, JSON.stringify(rfids)]
        );

        await pool.query('COMMIT');
        res.json({
            message: `Actualizados ${updateRes.rowCount} neumáticos a ${new_state}`,
            document: insertDoc.rows[0]
        });
    } catch (error: any) {
        await pool.query('ROLLBACK');
        console.error('Error in mass update:', error);
        res.status(500).json({ error: error.message });
    }
};

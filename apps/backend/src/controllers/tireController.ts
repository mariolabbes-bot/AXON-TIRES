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

export const sendTiresToRetread = async (req: AuthRequest, res: Response) => {
    const companyId = req.companyId;
    const { supplier_branch_id, rfids } = req.body; // rfids = array of fire_mark_id
    const document_number = `DESP-REC-${Date.now()}`;
    const operator_id = null;

    try {
        await pool.query('BEGIN');

        // Verificar que la sucursal existe y es de tipo planta recauchaje
        const branchRes = await pool.query(
            `SELECT id FROM branches WHERE id = $1 AND type = 'Planta Recauchaje' AND company_id = $2`,
            [supplier_branch_id, companyId]
        );
        if (branchRes.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: 'Planta de recauchaje inválida o no encontrada' });
        }

        // Obtener estado anterior
        const oldStatesQuery = await pool.query(
            `SELECT fire_mark_id, state FROM tires WHERE fire_mark_id = ANY($1::text[]) AND company_id = $2`,
            [rfids, companyId]
        );

        // Actualizar estado de neumáticos a 'Planta Recauchaje' y ubicación
        const updateRes = await pool.query(
            `UPDATE tires SET state = 'Planta Recauchaje', branch_id = $1 
             WHERE fire_mark_id = ANY($2::text[]) AND company_id = $3
             RETURNING fire_mark_id`,
            [supplier_branch_id, rfids, companyId]
        );

        // Crear logs de estado
        for (const row of oldStatesQuery.rows) {
            await pool.query(
                `INSERT INTO tire_state_logs (company_id, tire_fire_mark, previous_state, new_state, branch_id, reason, operator_id)
                 VALUES ($1, $2, $3, 'Planta Recauchaje', $4, 'Envío a recauchaje', $5)`,
                [companyId, row.fire_mark_id, row.state, supplier_branch_id, operator_id]
            );
        }

        // Crear documento de control
        const insertDoc = await pool.query(
            `INSERT INTO control_documents (company_id, document_number, action_type, operator_id, affected_tires)
             VALUES ($1, $2, 'RECAUCHAJE_ENVIO', $3, $4) RETURNING *`,
            [companyId, document_number, operator_id, JSON.stringify(rfids)]
        );

        await pool.query('COMMIT');
        res.json({
            message: `Enviados ${updateRes.rowCount} neumáticos a recauchaje`,
            document: insertDoc.rows[0]
        });
    } catch (error: any) {
        await pool.query('ROLLBACK');
        console.error('Error sending tires to retread:', error);
        res.status(500).json({ error: error.message });
    }
};

export const receiveTiresFromRetread = async (req: AuthRequest, res: Response) => {
    const companyId = req.companyId;
    const { branch_id, tires } = req.body; // tires = array of { rfid, status: 'OK' | 'REJECTED' }
    const document_number = `REC-REC-${Date.now()}`;
    const operator_id = null;

    try {
        await pool.query('BEGIN');

        const affectedRfids: string[] = [];

        for (const t of tires) {
            const { rfid, status } = t;
            affectedRfids.push(rfid);

            const oldStateQuery = await pool.query(
                `SELECT state FROM tires WHERE fire_mark_id = $1 AND company_id = $2`,
                [rfid, companyId]
            );
            if (oldStateQuery.rows.length === 0) continue;
            const previous_state = oldStateQuery.rows[0].state;

            if (status === 'OK') {
                // Exitoso: se incrementa retread_count y vuelve a bodega usado
                await pool.query(
                    `UPDATE tires 
                     SET state = 'Bodega Usado', branch_id = $1, retread_count = retread_count + 1 
                     WHERE fire_mark_id = $2 AND company_id = $3`,
                    [branch_id, rfid, companyId]
                );
                
                await pool.query(
                    `INSERT INTO tire_state_logs (company_id, tire_fire_mark, previous_state, new_state, branch_id, reason, operator_id)
                     VALUES ($1, $2, $3, 'Bodega Usado', $4, 'Retornado de recauchaje (Exitoso)', $5)`,
                    [companyId, rfid, previous_state, branch_id, operator_id]
                );
            } else {
                // Rechazado: pasa a desecho
                await pool.query(
                    `UPDATE tires 
                     SET state = 'Desecho', branch_id = $1 
                     WHERE fire_mark_id = $2 AND company_id = $3`,
                    [branch_id, rfid, companyId]
                );
                
                await pool.query(
                    `INSERT INTO tire_state_logs (company_id, tire_fire_mark, previous_state, new_state, branch_id, reason, operator_id)
                     VALUES ($1, $2, $3, 'Desecho', $4, 'Retornado de recauchaje (Rechazado - Desecho)', $5)`,
                    [companyId, rfid, previous_state, branch_id, operator_id]
                );
            }
        }

        // Crear documento de control
        const insertDoc = await pool.query(
            `INSERT INTO control_documents (company_id, document_number, action_type, operator_id, affected_tires)
             VALUES ($1, $2, 'RECAUCHAJE_RECEPCION', $3, $4) RETURNING *`,
            [companyId, document_number, operator_id, JSON.stringify(tires)]
        );

        await pool.query('COMMIT');
        res.json({
            message: `Recibidos ${tires.length} neumáticos de recauchaje`,
            document: insertDoc.rows[0]
        });
    } catch (error: any) {
        await pool.query('ROLLBACK');
        console.error('Error receiving tires from retread:', error);
        res.status(500).json({ error: error.message });
    }
};

export const disposeTires = async (req: AuthRequest, res: Response) => {
    const companyId = req.companyId;
    const { rfids, branch_id } = req.body; // rfids = array of fire_mark_id
    const document_number = `DES-FIN-${Date.now()}`;
    const operator_id = null;

    try {
        await pool.query('BEGIN');

        // Obtener estados anteriores
        const oldStatesQuery = await pool.query(
            `SELECT fire_mark_id, state FROM tires WHERE fire_mark_id = ANY($1::text[]) AND company_id = $2`,
            [rfids, companyId]
        );

        // Cambiar estado a 'Desecho'
        const updateRes = await pool.query(
            `UPDATE tires SET state = 'Desecho', branch_id = COALESCE($1, branch_id) 
             WHERE fire_mark_id = ANY($2::text[]) AND company_id = $3
             RETURNING fire_mark_id`,
            [branch_id, rfids, companyId]
        );

        // Crear logs
        for (const row of oldStatesQuery.rows) {
            await pool.query(
                `INSERT INTO tire_state_logs (company_id, tire_fire_mark, previous_state, new_state, branch_id, reason, operator_id)
                 VALUES ($1, $2, $3, 'Desecho', $4, 'Disposición Final / Desecho', $5)`,
                [companyId, row.fire_mark_id, row.state, branch_id, operator_id]
            );
        }

        // Liberar sensores TPMS si estuvieran asignados a estos neumáticos
        await pool.query(
            `UPDATE sensors SET state = 'Libre' 
             WHERE company_id = $1 AND mac_address IN (
                 SELECT sensor_mac FROM tire_assignments 
                 WHERE tire_fire_mark = ANY($2::text[]) AND is_active = TRUE AND company_id = $1
             )`,
            [companyId, rfids]
        );

        // Desactivar asignaciones activas de estos neumáticos
        await pool.query(
            `UPDATE tire_assignments SET is_active = FALSE, unassigned_at = NOW() 
             WHERE tire_fire_mark = ANY($1::text[]) AND is_active = TRUE AND company_id = $2`,
            [rfids, companyId]
        );

        // Crear documento de control
        const insertDoc = await pool.query(
            `INSERT INTO control_documents (company_id, document_number, action_type, operator_id, affected_tires)
             VALUES ($1, $2, 'DISPOSICION_FINAL', $3, $4) RETURNING *`,
            [companyId, document_number, operator_id, JSON.stringify(rfids)]
        );

        await pool.query('COMMIT');
        res.json({
            message: `Desechados ${updateRes.rowCount} neumáticos`,
            document: insertDoc.rows[0]
        });
    } catch (error: any) {
        await pool.query('ROLLBACK');
        console.error('Error disposing tires:', error);
        res.status(500).json({ error: error.message });
    }
};

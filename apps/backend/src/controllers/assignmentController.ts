import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import pool from '../db';

export const createAssignment = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  const { vehicle_id, tire_fire_mark, sensor_mac, axle_position, start_odometer } = req.body;

  try {
    // Validar plan de la empresa (si es RFID_ONLY, no puede asignar sensores)
    const companyRes = await pool.query('SELECT subscription_plan FROM companies WHERE id = $1', [companyId]);
    if (companyRes.rows[0].subscription_plan === 'RFID_ONLY' && sensor_mac) {
      return res.status(403).json({ error: 'Sensor assignment not allowed on RFID_ONLY plan' });
    }

    await pool.query('BEGIN');

    // 1. Desactivar previa de la misma empresa
    await pool.query(
      `UPDATE assignments SET is_active = FALSE, unassigned_at = NOW() 
       WHERE company_id = $1 AND (tire_fire_mark = $2 OR (sensor_mac = $3 AND sensor_mac IS NOT NULL)) 
       AND is_active = TRUE`,
      [companyId, tire_fire_mark, sensor_mac]
    );

    // 2. Crear nueva
    const result = await pool.query(
      `INSERT INTO assignments (company_id, vehicle_id, tire_fire_mark, sensor_mac, axle_position, start_odometer) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [companyId, vehicle_id, tire_fire_mark, sensor_mac, axle_position, start_odometer]
    );

    if (sensor_mac) {
      await pool.query(`UPDATE sensors SET state = 'Asignado' WHERE mac_address = $1 AND company_id = $2`, [sensor_mac, companyId]);
    }

    await pool.query(`UPDATE tires SET state = 'Operativo' WHERE fire_mark_id = $1 AND company_id = $2`, [tire_fire_mark, companyId]);

    await pool.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
};

export const endAssignment = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  const { assignment_id } = req.params;
  const { end_odometer, new_tire_state, reason, operator_id } = req.body;

  try {
    await pool.query('BEGIN');

    const assignRes = await pool.query('SELECT * FROM assignments WHERE id = $1 AND company_id = $2 AND is_active = TRUE', [assignment_id, companyId]);
    if (assignRes.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Active assignment not found' });
    }
    const assignment = assignRes.rows[0];

    const mileage = end_odometer - assignment.start_odometer;

    const result = await pool.query(
      `UPDATE assignments SET is_active = FALSE, unassigned_at = NOW(), end_odometer = $1 
       WHERE id = $2 RETURNING *`,
      [end_odometer, assignment_id]
    );

    await pool.query(
      `UPDATE tires SET accumulated_mileage = accumulated_mileage + $1, state = $2 WHERE fire_mark_id = $3 AND company_id = $4`,
      [mileage, new_tire_state, assignment.tire_fire_mark, companyId]
    );

    await pool.query(
      `INSERT INTO tire_state_logs (company_id, tire_fire_mark, previous_state, new_state, reason, operator_id)
       VALUES ($1, $2, 'Operativo', $3, $4, $5)`,
      [companyId, assignment.tire_fire_mark, new_tire_state, reason, operator_id]
    );

    if (assignment.sensor_mac) {
      await pool.query(`UPDATE sensors SET state = 'Libre' WHERE mac_address = $1 AND company_id = $2`, [assignment.sensor_mac, companyId]);
    }

    await pool.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error: any) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
};

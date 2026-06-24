import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import pool from '../db';

export const createTireAssignment = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  const { vehicle_id, tire_fire_mark, sensor_mac, axle_position, start_odometer } = req.body;

  try {
    const companyRes = await pool.query('SELECT subscription_plan FROM companies WHERE id = $1', [companyId]);
    if (companyRes.rows[0].subscription_plan === 'RFID_ONLY' && sensor_mac) {
      return res.status(403).json({ error: 'Sensor assignment not allowed on RFID_ONLY plan' });
    }

    await pool.query('BEGIN');

    // 1. Obtener la bodega/sucursal base actual del vehículo
    const vehicleQuery = await pool.query(
      `SELECT branch_id FROM vehicles WHERE id = $1 AND company_id = $2`,
      [vehicle_id, companyId]
    );
    if (vehicleQuery.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    const vehicleBranch = vehicleQuery.rows[0].branch_id;

    // 2. Desactivar previa de la misma empresa para el mismo neumático o sensor en cualquier otro lugar
    await pool.query(
      `UPDATE tire_assignments SET is_active = FALSE, unassigned_at = NOW() 
       WHERE company_id = $1 AND (tire_fire_mark = $2 OR (sensor_mac = $3 AND sensor_mac IS NOT NULL)) 
       AND is_active = TRUE`,
      [companyId, tire_fire_mark, sensor_mac]
    );

    // 3. EFECTO REEMPLAZO: Desactivar el neumático que ocupaba la misma posición en el mismo vehículo
    const oldAssignQuery = await pool.query(
      `SELECT * FROM tire_assignments 
       WHERE vehicle_id = $1 AND axle_position = $2 AND is_active = TRUE AND company_id = $3`,
      [vehicle_id, axle_position, companyId]
    );
    
    if (oldAssignQuery.rows.length > 0) {
      const oldAssign = oldAssignQuery.rows[0];
      const deltaMileage = Math.max(0, start_odometer - oldAssign.start_odometer);
      
      // Cerrar la asignación anterior
      await pool.query(
        `UPDATE tire_assignments SET is_active = FALSE, unassigned_at = NOW(), end_odometer = $1 
         WHERE id = $2`,
        [start_odometer, oldAssign.id]
      );
      
      // Actualizar neumático viejo: volver a Bodega Usado y asignarle la bodega base actual del vehículo
      await pool.query(
        `UPDATE tires 
         SET state = 'Bodega Usado', branch_id = COALESCE($1, branch_id), accumulated_mileage = accumulated_mileage + $2 
         WHERE fire_mark_id = $3 AND company_id = $4`,
        [vehicleBranch, deltaMileage, oldAssign.tire_fire_mark, companyId]
      );
      
      // Loggear el cambio de estado del neumático viejo
      await pool.query(
        `INSERT INTO tire_state_logs (company_id, tire_fire_mark, previous_state, new_state, branch_id, reason, operator_id)
         VALUES ($1, $2, 'Operativo', 'Bodega Usado', $3, $4, $5)`,
        [companyId, oldAssign.tire_fire_mark, vehicleBranch, 'Reemplazado por otro neumático en la misma posición', null]
      );
      
      // Si el neumático viejo tenía sensor mac asignado, liberarlo
      if (oldAssign.sensor_mac) {
        await pool.query(
          `UPDATE sensors SET state = 'Libre' WHERE mac_address = $1 AND company_id = $2`,
          [oldAssign.sensor_mac, companyId]
        );
      }
    }

    // 4. Registrar la nueva asignación
    const result = await pool.query(
      `INSERT INTO tire_assignments (company_id, vehicle_id, tire_fire_mark, sensor_mac, axle_position, start_odometer) 
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

export const endTireAssignment = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  const { assignment_id } = req.params;
  const { end_odometer, new_tire_state, branch_id, reason, operator_id } = req.body;

  try {
    await pool.query('BEGIN');

    const assignRes = await pool.query('SELECT * FROM tire_assignments WHERE id = $1 AND company_id = $2 AND is_active = TRUE', [assignment_id, companyId]);
    if (assignRes.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Active assignment not found' });
    }
    const assignment = assignRes.rows[0];

    const mileage = end_odometer - assignment.start_odometer;

    const result = await pool.query(
      `UPDATE tire_assignments SET is_active = FALSE, unassigned_at = NOW(), end_odometer = $1 
       WHERE id = $2 RETURNING *`,
      [end_odometer, assignment_id]
    );

    await pool.query(
      `UPDATE tires SET accumulated_mileage = accumulated_mileage + $1, state = $2, branch_id = $3 WHERE fire_mark_id = $4 AND company_id = $5`,
      [mileage, new_tire_state, branch_id, assignment.tire_fire_mark, companyId]
    );

    await pool.query(
      `INSERT INTO tire_state_logs (company_id, tire_fire_mark, previous_state, new_state, branch_id, reason, operator_id)
       VALUES ($1, $2, 'Operativo', $3, $4, $5, $6)`,
      [companyId, assignment.tire_fire_mark, new_tire_state, branch_id, reason, operator_id]
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

export const createAssetAssignment = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  const { vehicle_id, asset_id, start_odometer } = req.body;

  try {
    await pool.query('BEGIN');

    // 1. Obtener la bodega base del vehículo
    const vehicleQuery = await pool.query(
      `SELECT branch_id FROM vehicles WHERE id = $1 AND company_id = $2`,
      [vehicle_id, companyId]
    );
    if (vehicleQuery.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    const vehicleBranch = vehicleQuery.rows[0].branch_id;

    // 2. Obtener tipo de activo del nuevo activo
    const newAssetQuery = await pool.query(
      `SELECT asset_type FROM assets WHERE id = $1 AND company_id = $2`,
      [asset_id, companyId]
    );
    if (newAssetQuery.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Asset not found' });
    }
    const newAssetType = newAssetQuery.rows[0].asset_type;

    // 3. Desactivar previa de la misma empresa para el mismo activo
    await pool.query(
      `UPDATE asset_assignments SET is_active = FALSE, unassigned_at = NOW() 
       WHERE company_id = $1 AND asset_id = $2 AND is_active = TRUE`,
      [companyId, asset_id]
    );

    // 4. EFECTO REEMPLAZO: Buscar si el vehículo ya tiene asignado un activo del mismo tipo
    const oldAssetAssignQuery = await pool.query(
      `SELECT aa.id, aa.asset_id 
       FROM asset_assignments aa 
       JOIN assets a ON aa.asset_id = a.id 
       WHERE aa.vehicle_id = $1 AND aa.is_active = TRUE AND a.asset_type = $2 AND aa.company_id = $3`,
      [vehicle_id, newAssetType, companyId]
    );

    if (oldAssetAssignQuery.rows.length > 0) {
      const oldAssign = oldAssetAssignQuery.rows[0];
      
      // Cerrar la asignación anterior
      await pool.query(
        `UPDATE asset_assignments SET is_active = FALSE, unassigned_at = NOW(), end_odometer = $1 
         WHERE id = $2`,
        [start_odometer, oldAssign.id]
      );

      // Regresar el activo viejo a la bodega base del vehículo en estado 'Bodega'
      await pool.query(
        `UPDATE assets SET state = 'Bodega', branch_id = COALESCE($1, branch_id) 
         WHERE id = $2 AND company_id = $3`,
        [vehicleBranch, oldAssign.asset_id, companyId]
      );

      // Registrar log de cambio de estado
      await pool.query(
        `INSERT INTO asset_state_logs (company_id, asset_id, previous_state, new_state, branch_id, reason, operator_id)
         VALUES ($1, $2, 'En Vehículo', 'Bodega', $3, $4, $5)`,
        [companyId, oldAssign.asset_id, vehicleBranch, 'Reemplazado por otro activo del mismo tipo en el vehículo', null]
      );
    }

    // 5. Registrar nueva asignación
    const result = await pool.query(
      `INSERT INTO asset_assignments (company_id, vehicle_id, asset_id, start_odometer) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [companyId, vehicle_id, asset_id, start_odometer]
    );

    await pool.query(`UPDATE assets SET state = 'En Vehículo' WHERE id = $1 AND company_id = $2`, [asset_id, companyId]);

    await pool.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
};

export const endAssetAssignment = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  const { assignment_id } = req.params;
  const { end_odometer, new_state, branch_id, reason, operator_id } = req.body;

  try {
    await pool.query('BEGIN');

    const assignRes = await pool.query('SELECT * FROM asset_assignments WHERE id = $1 AND company_id = $2 AND is_active = TRUE', [assignment_id, companyId]);
    if (assignRes.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Active assignment not found' });
    }
    const assignment = assignRes.rows[0];

    const mileage = end_odometer - assignment.start_odometer;

    const result = await pool.query(
      `UPDATE asset_assignments SET is_active = FALSE, unassigned_at = NOW(), end_odometer = $1 
       WHERE id = $2 RETURNING *`,
      [end_odometer, assignment_id]
    );

    await pool.query(
      `UPDATE assets SET accumulated_mileage = accumulated_mileage + $1, state = $2, branch_id = $3 WHERE id = $4 AND company_id = $5`,
      [mileage, new_state, branch_id, assignment.asset_id, companyId]
    );

    await pool.query(
      `INSERT INTO asset_state_logs (company_id, asset_id, previous_state, new_state, branch_id, reason, operator_id)
       VALUES ($1, $2, 'En Vehículo', $3, $4, $5, $6)`,
      [companyId, assignment.asset_id, new_state, branch_id, reason, operator_id]
    );

    await pool.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error: any) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
};

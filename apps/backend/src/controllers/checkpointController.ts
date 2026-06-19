import { Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../middleware/authMiddleware';

export const createCheckpoint = async (req: AuthRequest, res: Response) => {
  const company_id = req.companyId;
  const operator_id = null; // until we add real auth
  const { vehicle_id, branch_id, event_type, scanned_rfids } = req.body;

  try {
    // 1. Get vehicle assigned tires and assets
    const vehicleRes = await pool.query(
      `SELECT t.fire_mark_id as rfid, ta.axle_position 
       FROM tires t 
       JOIN tire_assignments ta ON t.fire_mark_id = ta.tire_fire_mark 
       WHERE ta.vehicle_id = $1 AND ta.is_active = TRUE AND ta.unassigned_at IS NULL AND t.company_id = $2`,
      [vehicle_id, company_id]
    );
    const assignedTires = vehicleRes.rows;

    const assetsRes = await pool.query(
      `SELECT a.rfid_id as rfid 
       FROM assets a 
       JOIN asset_assignments aa ON a.id = aa.asset_id 
       WHERE aa.vehicle_id = $1 AND aa.is_active = TRUE AND aa.unassigned_at IS NULL AND a.company_id = $2`,
      [vehicle_id, company_id]
    );
    const assignedAssets = assetsRes.rows;

    const assignedRfids = [
      ...assignedTires.map((t:any) => t.rfid),
      ...assignedAssets.map((a:any) => a.rfid)
    ].filter(Boolean);

    // 2. Compare scanned vs assigned
    const scannedSet = new Set(scanned_rfids);
    const assignedSet = new Set(assignedRfids);

    const missingRfids = assignedRfids.filter((r:string) => !scannedSet.has(r));
    const unknownRfids = scanned_rfids.filter((r:string) => !assignedSet.has(r));

    const status = (missingRfids.length === 0 && unknownRfids.length === 0) ? 'OK' : 'DIVERGENTE';
    
    // notes to describe the divergence
    let notes = '';
    if (status === 'DIVERGENTE') {
        notes = `Faltan: ${missingRfids.length}. Desconocidos: ${unknownRfids.length}.`;
    }

    // 3. Create checkpoint event
    const insertRes = await pool.query(
      `INSERT INTO checkpoint_events 
        (company_id, branch_id, vehicle_id, event_type, status, operator_id, unknown_rfids, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [company_id, branch_id, vehicle_id, event_type, status, operator_id, JSON.stringify(unknownRfids), notes]
    );

    // 4. Update Vehicle Status
    let newVehicleStatus = 'EN_BASE';
    if (event_type === 'SALIDA_A_RUTA') {
        newVehicleStatus = 'EN_RUTA';
    } else if (event_type === 'LLEGADA_A_BASE') {
        newVehicleStatus = 'EN_BASE';
    }

    // Always update the branch_id to the one where the event happened (especially useful for LLEGADA_A_BASE)
    await pool.query(
        `UPDATE vehicles SET status = $1, branch_id = $2 WHERE id = $3 AND company_id = $4`,
        [newVehicleStatus, branch_id, vehicle_id, company_id]
    );

    res.status(201).json({
        message: 'Checkpoint registrado',
        checkpoint: insertRes.rows[0],
        analysis: {
            missing_rfids: missingRfids,
            unknown_rfids: unknownRfids,
            status
        }
    });
  } catch (error) {
    console.error('Error creating checkpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getVehicleCheckpoints = async (req: AuthRequest, res: Response) => {
    const company_id = req.companyId;
    const { vehicle_id } = req.params;
    try {
        const result = await pool.query(
            `SELECT c.*, u.email as operator_email, b.name as branch_name
             FROM checkpoint_events c
             LEFT JOIN users u ON c.operator_id = u.id
             LEFT JOIN branches b ON c.branch_id = b.id
             WHERE c.vehicle_id = $1 AND c.company_id = $2
             ORDER BY c.event_timestamp DESC`,
            [vehicle_id, company_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting checkpoints:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

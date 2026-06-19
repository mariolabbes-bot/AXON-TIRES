import { Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../middleware/authMiddleware';

export const createInventoryAudit = async (req: AuthRequest, res: Response) => {
    const company_id = req.companyId;
    const operator_id = null; // until we add real auth
    const { branch_id, scanned_rfids } = req.body;
  
    try {
      // 1. Get branch assigned tires and assets
      const tiresRes = await pool.query(
        `SELECT t.fire_mark_id as rfid 
         FROM tires t 
         WHERE t.branch_id = $1 AND t.company_id = $2 AND t.state != 'Desecho'
         AND NOT EXISTS (
             SELECT 1 FROM tire_assignments ta 
             WHERE ta.tire_fire_mark = t.fire_mark_id AND ta.unassigned_at IS NULL AND ta.is_active = TRUE
         )`,
        [branch_id, company_id]
      );
      const branchTires = tiresRes.rows;
  
      const assetsRes = await pool.query(
        `SELECT a.rfid_id as rfid 
         FROM assets a 
         WHERE a.branch_id = $1 AND a.company_id = $2 AND a.state != 'Desecho'
         AND NOT EXISTS (
             SELECT 1 FROM asset_assignments aa 
             WHERE aa.asset_id = a.id AND aa.unassigned_at IS NULL AND aa.is_active = TRUE
         )`,
        [branch_id, company_id]
      );
      const branchAssets = assetsRes.rows;
  
      const expectedRfids = [
        ...branchTires.map((t:any) => t.rfid),
        ...branchAssets.map((a:any) => a.rfid)
      ].filter(Boolean);
  
      // 2. Compare scanned vs expected
      const scannedSet = new Set(scanned_rfids);
      const expectedSet = new Set(expectedRfids);
  
      const missingRfids = expectedRfids.filter((r:string) => !scannedSet.has(r));
      const extraRfids = scanned_rfids.filter((r:string) => !expectedSet.has(r));
  
      const status = (missingRfids.length === 0 && extraRfids.length === 0) ? 'COMPLETED' : 'WITH_DISCREPANCIES';
      
      // 3. Create inventory audit
      const insertRes = await pool.query(
        `INSERT INTO inventory_audits 
          (company_id, branch_id, operator_id, total_scanned, missing_assets, extra_assets, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [company_id, branch_id, operator_id, scanned_rfids.length, JSON.stringify(missingRfids), JSON.stringify(extraRfids), status]
      );
  
      res.status(201).json({
          message: 'Auditoría registrada',
          audit: insertRes.rows[0]
      });
    } catch (error) {
      console.error('Error creating inventory audit:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};

export const getInventoryBreakdown = async (req: AuthRequest, res: Response) => {
    const company_id = req.companyId;
    const { branch_id } = req.params;

    try {
        const tiresRes = await pool.query(
            `SELECT t.state, COUNT(*) as count 
             FROM tires t
             WHERE t.branch_id = $1 AND t.company_id = $2 AND t.state != 'Desecho'
             AND NOT EXISTS (
                 SELECT 1 FROM tire_assignments ta 
                 WHERE ta.tire_fire_mark = t.fire_mark_id AND ta.unassigned_at IS NULL AND ta.is_active = TRUE
             )
             GROUP BY t.state`,
            [branch_id, company_id]
        );
        
        const assetsRes = await pool.query(
            `SELECT a.asset_type as category, COUNT(*) as count 
             FROM assets a
             WHERE a.branch_id = $1 AND a.company_id = $2 AND a.state != 'Desecho'
             AND NOT EXISTS (
                 SELECT 1 FROM asset_assignments aa 
                 WHERE aa.asset_id = a.id AND aa.unassigned_at IS NULL AND aa.is_active = TRUE
             )
             GROUP BY a.asset_type`,
            [branch_id, company_id]
        );

        // Fetch full list for frontend simulation mapping
        const tiresListRes = await pool.query(`
            SELECT t.fire_mark_id as rfid, t.state 
            FROM tires t 
            WHERE t.branch_id = $1 AND t.company_id = $2 AND t.state != 'Desecho'
            AND NOT EXISTS (
                 SELECT 1 FROM tire_assignments ta 
                 WHERE ta.tire_fire_mark = t.fire_mark_id AND ta.unassigned_at IS NULL AND ta.is_active = TRUE
            )`, [branch_id, company_id]);
            
        const assetsListRes = await pool.query(`
            SELECT a.rfid_id as rfid, a.asset_type as state 
            FROM assets a 
            WHERE a.branch_id = $1 AND a.company_id = $2 AND a.state != 'Desecho'
            AND NOT EXISTS (
                 SELECT 1 FROM asset_assignments aa 
                 WHERE aa.asset_id = a.id AND aa.unassigned_at IS NULL AND aa.is_active = TRUE
            )`, [branch_id, company_id]);

        res.json({
            tires: tiresRes.rows.map(r => ({ ...r, count: parseInt(r.count) })),
            assets: assetsRes.rows.map(r => ({ ...r, count: parseInt(r.count) })),
            tires_list: tiresListRes.rows,
            assets_list: assetsListRes.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import pool from '../db';

export const getPurchases = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  try {
    const result = await pool.query('SELECT * FROM purchase_documents WHERE company_id = $1 ORDER BY document_date DESC', [companyId]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createPurchase = async (req: AuthRequest, res: Response) => {
  const companyId = req.companyId;
  const { branch_id, document_number, supplier, document_date, assets, tires } = req.body;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Create Purchase Document
    const purchaseRes = await client.query(
      `INSERT INTO purchase_documents (company_id, branch_id, document_number, supplier, document_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [companyId, branch_id, document_number, supplier, document_date]
    );
    const purchaseId = purchaseRes.rows[0].id;

    // 2. Insert Assets (General)
    if (assets && assets.length > 0) {
      for (const asset of assets) {
        await client.query(
          `INSERT INTO assets (company_id, branch_id, purchase_id, rfid_id, asset_type, serial_number, state)
           VALUES ($1, $2, $3, $4, $5, $6, 'Bodega')`,
          [companyId, branch_id, purchaseId, asset.rfid_id, asset.asset_type, asset.serial_number]
        );
      }
    }

    // 3. Insert Tires
    if (tires && tires.length > 0) {
      for (const tire of tires) {
        await client.query(
          `INSERT INTO tires (fire_mark_id, company_id, branch_id, purchase_id, rfid_id, brand, model, size, initial_depth, state)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Bodega Nuevo')`,
          [tire.fire_mark_id, companyId, branch_id, purchaseId, tire.rfid_id, tire.brand, tire.model, tire.size, tire.initial_depth]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(purchaseRes.rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

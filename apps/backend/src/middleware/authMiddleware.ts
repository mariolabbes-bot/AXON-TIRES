import { Request, Response, NextFunction } from 'express';
import pool from '../db';

// Extendemos Request para incluir la empresa
export interface AuthRequest extends Request {
  companyId?: string;
  userRole?: string;
}

export const requireCompany = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let companyId = req.headers['x-company-id'] as string;

  if (!companyId) {
    return res.status(401).json({ error: 'Missing x-company-id header. Authentication required.' });
  }

  // MOCK AUTH PARA DESARROLLO (Fase 3)
  if (companyId === 'TEST') {
    try {
      const companyRes = await pool.query('SELECT id FROM companies LIMIT 1');
      if (companyRes.rows.length > 0) {
        companyId = companyRes.rows[0].id;
      } else {
        return res.status(404).json({ error: 'No companies found for test auth.' });
      }
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  req.companyId = companyId;
  next();
};

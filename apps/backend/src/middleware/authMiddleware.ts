import { Request, Response, NextFunction } from 'express';

// Extendemos Request para incluir la empresa
export interface AuthRequest extends Request {
  companyId?: string;
  userRole?: string;
}

export const requireCompany = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Simularemos la extracción del company_id desde los headers.
  // En producción, esto vendría de decodificar el token JWT.
  const companyId = req.headers['x-company-id'] as string;

  if (!companyId) {
    return res.status(401).json({ error: 'Missing x-company-id header. Authentication required.' });
  }

  req.companyId = companyId;
  next();
};

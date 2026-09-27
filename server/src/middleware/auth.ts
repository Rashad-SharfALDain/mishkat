import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config';

export const JWT_SECRET = CONFIG.JWT_SECRET;

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'غير مصرح: يجب تسجيل الدخول للوصول إلى لوحة التحكم' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'انتهت صلاحية الجلسة أو الرمز غير صالح، يرجى إعادة تسجيل الدخول' });
  }
}

export function requireStrictAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'غير مصرح: هذه العملية مخصصة للإدارة العليا للمؤسسة فقط (Admin)' });
      return;
    }
    next();
  });
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'supervisor') {
      res.status(403).json({ error: 'غير مصرح: هذه العملية مخصصة لإدارة المؤسسة فقط' });
      return;
    }
    next();
  });
}

export function requireStudent(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'student') {
      res.status(403).json({ error: 'غير مصرح: هذا القسم مخصص للطلاب المقبولين فقط' });
      return;
    }
    next();
  });
}

export function requireParent(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'parent') {
      res.status(403).json({ error: 'غير مصرح: هذا القسم مخصص لأولياء الأمور فقط' });
      return;
    }
    next();
  });
}


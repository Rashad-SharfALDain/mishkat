import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipMap = new Map<string, RateLimitRecord>();

export function rateLimiter(limit: number = 30, windowMs: number = 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const record = ipMap.get(ip);
    if (!record || now > record.resetTime) {
      ipMap.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    record.count++;
    if (record.count > limit) {
      res.status(429).json({
        error: 'تم تجاوز الحد المسموح من الطلبات، يرجى الانتظار قليلاً ثم المحاولة مجددًا.',
      });
      return;
    }

    next();
  };
}

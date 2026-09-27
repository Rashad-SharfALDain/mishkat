import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { seedDatabase } from './db/seed';
import authRouter from './routes/auth';
import settingsRouter from './routes/settings';
import programsRouter from './routes/programs';
import faqRouter from './routes/faq';
import applicantsRouter from './routes/applicants';
import contactRouter from './routes/contact';
import adminStudentsRouter from './routes/adminStudents';
import studentRouter from './routes/student';
import parentRouter from './routes/parent';
import adminParentsRouter from './routes/adminParents';
import attendanceRouter from './routes/attendance';
import evaluationsRouter from './routes/evaluations';
import notificationsRouter from './routes/notifications';
import adminUsersRouter from './routes/adminUsers';
import documentsRouter from './routes/documents';
import { CONFIG } from './config';

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Custom basic security headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Serve static assets from public directory
app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/programs', programsRouter);
app.use('/api/faq', faqRouter);
app.use('/api/admin', adminStudentsRouter);
app.use('/api/admin', adminParentsRouter);
app.use('/api/admin', adminUsersRouter);
app.use('/api/student', studentRouter);
app.use('/api/parent', parentRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/evaluations', evaluationsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api', documentsRouter);
app.use('/api', applicantsRouter);
app.use('/api', contactRouter);


// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    institution: 'مؤسسة مِشكاة التربوية والتعليمية',
    version: '1.0.0',
    env: CONFIG.NODE_ENV || process.env.NODE_ENV || 'development',
    frontend_configured: Boolean(CONFIG.FRONTEND_BASE_URL || process.env.FRONTEND_BASE_URL),
    timestamp: new Date().toISOString(),
  });
});

// Block direct access to internal storage paths or direct document URLs
app.use(['/data', '/documents', '/secure_documents'], (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Production: serve built client
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.json({
        status: 'ok',
        institution: 'مؤسسة مِشكاة التربوية والتعليمية',
        message: 'خادم الواجهة الخلفية يعمل بنجاح',
        apiHealth: '/api/health',
      });
    }
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'حدث خطأ داخلي في الخادم' });
});

async function start() {
  try {
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`✨ خادم مؤسسة مِشكاة التعليمية يعمل بنجاح على المنفذ: ${PORT}`);
      console.log(`📡 واجهة برمجة التطبيقات (API): http://localhost:${PORT}/api/health`);
      console.log(`🔒 مصادقة الإدارة: مسجلة ومؤمنة عبر المتغيرات البيئية.`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

start();

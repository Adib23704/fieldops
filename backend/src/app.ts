import cors from 'cors';
import express, { type Application, type Request, type Response } from 'express';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import userRoutes from './routes/userRoutes';
import workOrderRoutes from './routes/workOrderRoutes';
import { NotFoundError } from './utils/errors';

export const createApp = (): Application => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'operational',
      service: 'fieldops-backend',
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/work-orders', workOrderRoutes);
  app.use('/api/v1/customers', customerRoutes);
  app.use('/api/v1/users', userRoutes);

  app.use((_req: Request, _res: Response, next) => {
    next(new NotFoundError('The requested API endpoint does not exist'));
  });

  app.use(errorHandler);

  return app;
};

export const app = createApp();
export default app;

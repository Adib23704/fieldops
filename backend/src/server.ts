import app from './app';
import { config } from './config';
import { logger } from './utils/logger';

const server = app.listen(config.PORT, () => {
  logger.info(`FieldOps API server running on port ${config.PORT} [${config.NODE_ENV}]`);
});

const gracefulShutdown = () => {
  logger.info('Received termination signal. Closing HTTP server gracefully...');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default server;

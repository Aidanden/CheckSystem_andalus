import morgan from 'morgan';
import { Request, Response } from 'express';

/**
 * Custom Morgan token to skip logging sensitive data
 */
morgan.token('sanitized-url', (req: Request) => {
  const url = req.originalUrl || req.url;
  // Remove query parameters that might contain sensitive data
  return url.split('?')[0];
});

/**
 * Skip logging for health check endpoints
 */
export const morganSkip = (req: Request, res: Response) => {
  // Skip logging for health checks and static assets
  return req.url === '/health' || req.url === '/api/health';
};

/**
 * Production logging format - secure and compliant
 * Excludes sensitive information and query parameters
 */
export const productionFormat = ':remote-addr - :remote-user [:date[clf]] ":method :sanitized-url HTTP/:http-version" :status :res[content-length] - :response-time ms';

/**
 * Development logging format - detailed for debugging
 */
export const developmentFormat = 'dev';

/**
 * Get appropriate Morgan configuration based on environment
 */
export const getMorganConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    format: isProduction ? productionFormat : developmentFormat,
    options: {
      skip: morganSkip,
      // In production, you might want to stream logs to a file or service
      // stream: isProduction ? productionLogStream : undefined
    }
  };
};

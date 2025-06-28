import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      // Add a special prefix to backend logs to prevent feedback loop
      return JSON.stringify({
        timestamp,
        level,
        message,
        source: 'observo-backend', // This tag helps identify backend logs
        service: 'observo-server'
      });
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Backend logs go to the same file as external logs, but with source tag
    new winston.transports.File({ 
      filename: path.join(logDir, 'output.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, source, service }) => {
          // For file output, include the source tag
          return JSON.stringify({
            timestamp,
            level,
            message,
            source,
            service
          });
        })
      )
    })
  ]
});

// Override console.log and console.error
console.log = (...args) => logger.info(args.join(' '));
console.error = (...args) => logger.error(args.join(' '));

export default logger; 
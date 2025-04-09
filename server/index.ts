import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { EventEmitter } from 'events';
import net from 'net';

// Increase the max listeners limit to prevent warnings
EventEmitter.defaultMaxListeners = 20;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Function to check if a port is available
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err: NodeJS.ErrnoException) => {
      server.close();
      if (err.code === 'EADDRINUSE' || err.code === 'ENOTSUP') {
        resolve(false);
      } else {
        // For other errors, consider the port as unavailable
        console.error(`Error checking port ${port}:`, err.message);
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port, '0.0.0.0');
  });
}

// Function to find an available port
async function findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
  console.log(`Attempting to find an available port starting from ${startPort}...`);
  
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const available = await isPortAvailable(port);
    
    if (available) {
      console.log(`Found available port: ${port}`);
      return port;
    }
    
    console.log(`Port ${port} is unavailable, trying next port...`);
  }
  
  throw new Error(`Could not find an available port after ${maxAttempts} attempts`);
}

(async () => {
  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Try to find an available port, starting from 5000
    // For Replit, we only try port 5000, for local development we try others
    const isReplit = process.env.REPL_ID !== undefined;
    const startPort = 5000;
    const maxAttempts = isReplit ? 1 : 10;
    
    const port = await findAvailablePort(startPort, maxAttempts);
    
    server.listen(port, '0.0.0.0', () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
})();

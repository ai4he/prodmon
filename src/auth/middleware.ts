import { Request, Response, NextFunction } from 'express';
import { GoogleOAuthService } from './google-oauth';

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

/**
 * Middleware to verify JWT token from Authorization header or cookies
 */
export function authMiddleware(oauthService: GoogleOAuthService) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check Authorization header first
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.auth_token) {
      // Fallback to cookie
      token = req.cookies.auth_token;
    }

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    const decoded = oauthService.verifyJWT(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
  };
}

/**
 * Optional auth middleware - doesn't fail if no token provided
 */
export function optionalAuthMiddleware(oauthService: GoogleOAuthService) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (token) {
      const decoded = oauthService.verifyJWT(token);
      if (decoded) {
        req.user = decoded;
      }
    }

    next();
  };
}

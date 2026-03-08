import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/express';
import { verifyToken } from '@clerk/backend';

// Extend Express Request type to include auth
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
      };
    }
  }
}

/**
 * Middleware to verify Clerk session token
 * Extracts token from Authorization header and verifies it
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the session token with Clerk
    try {
      const secretKey = process.env.CLERK_SECRET_KEY;
      
      if (!secretKey) {
        console.error('CLERK_SECRET_KEY is not set');
        return res.status(500).json({
          error: 'Server configuration error',
        });
      }

      // Verify the token using Clerk's verifyToken
      const { sub: userId, sid: sessionId } = await verifyToken(token, {
        secretKey: secretKey,
      });

      if (!userId || !sessionId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token payload',
        });
      }

      // Attach user info to request
      req.auth = {
        userId: userId,
        sessionId: sessionId,
      };

      next();
    } catch (tokenError: any) {
      console.error('Token verification error:', tokenError);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Failed to verify session token',
    });
  }
};


import express from 'express';
import { clerkClient } from '@clerk/express';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/users/set-role
 * Sets the user role in Clerk public metadata
 * Requires authentication via Clerk session token
 */
router.post('/set-role', requireAuth, async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - User ID not found' });
    }

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    if (role !== 'owner' && role !== 'student') {
      return res.status(400).json({ error: 'Invalid role. Must be "owner" or "student"' });
    }

    // Update user's public metadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: role,
      },
    });

    console.log(`✅ User ${userId} role set to: ${role}`);

    return res.status(200).json({
      success: true,
      message: `User role set to ${role}`,
      userId,
      role,
    });
  } catch (error: any) {
    console.error('Error setting user role:', error);
    
    // Handle Clerk-specific errors
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: 'Failed to update user metadata',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/users/me
 * Get current user's role and information
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user from Clerk
    const user = await clerkClient.users.getUser(userId);

    return res.status(200).json({
      userId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      role: user.publicMetadata?.role || null,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export { router as usersRouter };



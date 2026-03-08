import express from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/student/bookings
 * Get all bookings for the authenticated student
 */
router.get('/bookings', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock bookings data - in production, this would come from database
    const mockBookings = [
      {
        id: '1',
        propertyId: 'prop_1',
        propertyName: 'Sunshine PG for Boys',
        propertyType: 'PG',
        address: '123 Main Street, Koramangala',
        city: 'Bangalore',
        area: 'Koramangala',
        monthlyRent: 8500,
        securityDeposit: 17000,
        status: 'confirmed',
        bookingDate: '2024-11-15',
        moveInDate: '2024-12-01',
        duration: '6 months',
        ownerName: 'Rajesh Kumar',
        ownerEmail: 'rajesh@example.com',
        photos: ['/photos/placeholder.jpg'],
      },
      {
        id: '2',
        propertyId: 'prop_2',
        propertyName: 'Green Valley Hostel',
        propertyType: 'Hostel',
        address: '456 Park Avenue, HSR Layout',
        city: 'Bangalore',
        area: 'HSR Layout',
        monthlyRent: 12000,
        securityDeposit: 24000,
        status: 'pending',
        bookingDate: '2024-11-20',
        moveInDate: '2025-01-01',
        duration: '12 months',
        ownerName: 'Priya Sharma',
        ownerEmail: 'priya@example.com',
        photos: ['/photos/placeholder.jpg'],
      },
      {
        id: '3',
        propertyId: 'prop_3',
        propertyName: 'Comfort Zone Flat',
        propertyType: 'Flat',
        address: '789 MG Road, Indiranagar',
        city: 'Bangalore',
        area: 'Indiranagar',
        monthlyRent: 15000,
        securityDeposit: 30000,
        status: 'cancelled',
        bookingDate: '2024-10-10',
        moveInDate: '2024-11-01',
        duration: '3 months',
        ownerName: 'Amit Patel',
        ownerEmail: 'amit@example.com',
        photos: ['/photos/placeholder.jpg'],
      },
    ];

    return res.status(200).json({
      success: true,
      bookings: mockBookings,
      count: mockBookings.length,
    });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({
      error: 'Failed to fetch bookings',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/student/wishlist
 * Get wishlist for the authenticated student
 */
router.get('/wishlist', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock wishlist data - in production, this would come from database
    const mockWishlist: any[] = [];

    return res.status(200).json({
      success: true,
      wishlist: mockWishlist,
      count: mockWishlist.length,
    });
  } catch (error: any) {
    console.error('Error fetching wishlist:', error);
    return res.status(500).json({
      error: 'Failed to fetch wishlist',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/student/complaints
 * Get complaints for the authenticated student
 */
router.get('/complaints', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock complaints data - in production, this would come from database
    const mockComplaints = [
      {
        id: '1',
        title: 'WiFi Connection Issue',
        description: 'WiFi keeps disconnecting in Room 101. Need urgent fix.',
        category: 'maintenance',
        property: 'Sunshine PG',
        status: 'active',
        date: '2024-11-20',
        priority: 'high',
      },
      {
        id: '2',
        title: 'Cleaning Request',
        description: 'Common area needs cleaning. Trash not being collected regularly.',
        category: 'cleanliness',
        property: 'Sunshine PG',
        status: 'in-progress',
        date: '2024-11-18',
        priority: 'medium',
      },
      {
        id: '3',
        title: 'Water Leakage',
        description: 'Water leakage from ceiling in bathroom. Reported last week.',
        category: 'maintenance',
        property: 'Sunshine PG',
        status: 'resolved',
        date: '2024-11-10',
        priority: 'high',
      },
    ];

    return res.status(200).json({
      success: true,
      complaints: mockComplaints,
      count: mockComplaints.length,
    });
  } catch (error: any) {
    console.error('Error fetching complaints:', error);
    return res.status(500).json({
      error: 'Failed to fetch complaints',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/student/rewards
 * Get reward points and history for the authenticated student
 */
router.get('/rewards', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Mock rewards data - in production, this would come from database
    const mockRewards = {
      totalPoints: 1250,
      availablePoints: 1250,
      monthlyPoints: 100,
      history: [
        { id: '1', action: 'On-time rent payment', points: 100, date: '2024-11-01', type: 'earned' },
        { id: '2', action: 'Referred a friend', points: 500, date: '2024-10-15', type: 'earned' },
        { id: '3', action: 'Redeemed discount voucher', points: -200, date: '2024-10-10', type: 'redeemed' },
        { id: '4', action: '6 months stay bonus', points: 300, date: '2024-09-01', type: 'earned' },
        { id: '5', action: 'On-time rent payment', points: 100, date: '2024-08-01', type: 'earned' },
        { id: '6', action: 'Redeemed free WiFi upgrade', points: -150, date: '2024-07-15', type: 'redeemed' },
      ],
    };

    return res.status(200).json({
      success: true,
      rewards: mockRewards,
    });
  } catch (error: any) {
    console.error('Error fetching rewards:', error);
    return res.status(500).json({
      error: 'Failed to fetch rewards',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export { router as studentRouter };



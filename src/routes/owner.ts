import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getDashboardStats,
  getPropertiesByOwner,
  getTenantsByOwner,
  getPaymentsByOwner,
  getPendingPaymentsByOwner,
  getActivitiesByOwner,
  formatTimeAgo,
  getDaysUntilDue,
  addActivity,
  addProperty,
} from '../data/store.js';

const router = express.Router();

/**
 * GET /api/owner/dashboard
 * Get dashboard statistics and data for the owner
 */
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get dashboard stats
    const stats = await getDashboardStats(userId);

    // Get recent activity
    const activitiesData = await getActivitiesByOwner(userId, 10);
    const activities = activitiesData.map(activity => ({
      id: activity.id,
      type: activity.type,
      message: activity.message,
      amount: activity.amount,
      time: formatTimeAgo(activity.createdAt),
    }));

    // Get pending payments
    const pendingPaymentsData = await getPendingPaymentsByOwner(userId);
    const pendingPayments = pendingPaymentsData.map(payment => ({
      id: payment.id,
      name: payment.tenantName,
      property: payment.propertyName,
      amount: `₹${payment.amount.toLocaleString('en-IN')}`,
      dueIn: getDaysUntilDue(payment.dueDate),
    }));

    return res.status(200).json({
      success: true,
      stats: {
        totalProperties: {
          label: 'Total Properties',
          value: stats.totalProperties.value.toString(),
          change: stats.totalProperties.change,
          trend: 'up',
        },
        activeTenants: {
          label: 'Active Tenants',
          value: stats.activeTenants.value.toString(),
          change: stats.activeTenants.change,
          trend: 'up',
        },
        monthlyRevenue: {
          label: 'Monthly Revenue',
          value: stats.monthlyRevenue.formatted,
          change: stats.monthlyRevenue.change,
          trend: 'up',
        },
        occupancyRate: {
          label: 'Occupancy Rate',
          value: stats.occupancyRate.formatted,
          change: stats.occupancyRate.change,
          trend: 'up',
        },
      },
      recentActivity: activities,
      pendingPayments,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    return res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/owner/properties
 * Get all properties owned by the authenticated user
 */
router.get('/properties', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const properties = await getPropertiesByOwner(userId);

    return res.status(200).json({
      success: true,
      properties,
      count: properties.length,
    });
  } catch (error: any) {
    console.error('Error fetching properties:', error);
    return res.status(500).json({
      error: 'Failed to fetch properties',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/owner/tenants
 * Get all tenants for the authenticated owner
 */
router.get('/tenants', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tenants = await getTenantsByOwner(userId);

    return res.status(200).json({
      success: true,
      tenants,
      count: tenants.length,
    });
  } catch (error: any) {
    console.error('Error fetching tenants:', error);
    return res.status(500).json({
      error: 'Failed to fetch tenants',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/owner/payments
 * Get all payments for the authenticated owner
 */
router.get('/payments', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { status } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let payments = await getPaymentsByOwner(userId);
    
    if (status) {
      payments = payments.filter(p => p.status === status);
    }

    return res.status(200).json({
      success: true,
      payments,
      count: payments.length,
    });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({
      error: 'Failed to fetch payments',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/owner/activity
 * Get recent activity for the authenticated owner
 */
router.get('/activity', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const activitiesData = await getActivitiesByOwner(userId, limit);
    const activities = activitiesData.map(activity => ({
      id: activity.id,
      type: activity.type,
      message: activity.message,
      amount: activity.amount,
      time: formatTimeAgo(activity.createdAt),
      createdAt: activity.createdAt,
    }));

    return res.status(200).json({
      success: true,
      activities,
      count: activities.length,
    });
  } catch (error: any) {
    console.error('Error fetching activity:', error);
    return res.status(500).json({
      error: 'Failed to fetch activity',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export { router as ownerRouter };


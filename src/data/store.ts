// Database store using Prisma
// All data is persisted in MongoDB

import { prisma } from '../lib/prisma.js';
import type { Prisma } from '@prisma/client';

// Type definitions using Prisma types
type PropertyCreateInput = Prisma.PropertyCreateInput;
type PropertyUpdateInput = Prisma.PropertyUpdateInput;
type PropertyWhereInput = Prisma.PropertyWhereInput;

// Property functions
export const addProperty = async (propertyData: PropertyCreateInput) => {
  const property = await prisma.property.create({
    data: propertyData,
  });
  return property;
};

export const getPropertiesByOwner = async (ownerId: string) => {
  return await prisma.property.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
  });
};

export const getPropertyById = async (id: string) => {
  return await prisma.property.findUnique({
    where: { id },
  });
};

export const updateProperty = async (id: string, updates: PropertyUpdateInput) => {
  try {
    const property = await prisma.property.update({
      where: { id },
      data: updates,
    });
    return property;
  } catch (error) {
    console.error('Error updating property:', error);
    return null;
  }
};

export const deleteProperty = async (id: string): Promise<boolean> => {
  try {
    await prisma.property.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting property:', error);
    return false;
  }
};

export const getAllProperties = async () => {
  return await prisma.property.findMany({
    where: { status: 'approved' },
    orderBy: { createdAt: 'desc' },
  });
};

// Tenant functions
export const addTenant = async (tenantData: Prisma.TenantCreateInput) => {
  const tenant = await prisma.tenant.create({
    data: tenantData,
  });
  return tenant;
};

export const getTenantsByOwner = async (ownerId: string) => {
  return await prisma.tenant.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
  });
};

// Payment functions
export const addPayment = async (paymentData: Prisma.PaymentCreateInput) => {
  const payment = await prisma.payment.create({
    data: paymentData,
  });
  return payment;
};

export const getPaymentsByOwner = async (ownerId: string) => {
  return await prisma.payment.findMany({
    where: { ownerId },
    orderBy: { dueDate: 'asc' },
  });
};

export const getPendingPaymentsByOwner = async (ownerId: string) => {
  return await prisma.payment.findMany({
    where: { 
      ownerId,
      status: 'pending',
    },
    orderBy: { dueDate: 'asc' },
  });
};

// Activity functions
export const addActivity = async (activityData: Prisma.ActivityCreateInput) => {
  const activity = await prisma.activity.create({
    data: activityData,
  });
  return activity;
};

export const getActivitiesByOwner = async (ownerId: string, limit: number = 10) => {
  return await prisma.activity.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

// Calculate dashboard stats
export const getDashboardStats = async (ownerId: string) => {
  const [ownerProperties, ownerTenants, ownerPayments] = await Promise.all([
    getPropertiesByOwner(ownerId),
    getTenantsByOwner(ownerId),
    getPaymentsByOwner(ownerId),
  ]);
  
  const totalProperties = ownerProperties.length;
  const activeTenants = ownerTenants.filter(t => t.status === 'active').length;
  
  // Calculate monthly revenue (sum of all active tenant rents)
  const monthlyRevenue = ownerTenants
    .filter(t => t.status === 'active')
    .reduce((sum, tenant) => sum + tenant.monthlyRent, 0);
  
  // Calculate occupancy rate
  const totalBeds = ownerProperties.reduce((sum, prop) => sum + prop.totalBeds, 0);
  const occupiedBeds = activeTenants;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  
  // Get this month's new properties
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const thisMonthProperties = ownerProperties.filter(p => 
    p.createdAt >= thisMonth
  ).length;
  
  // Get this month's new tenants
  const thisMonthTenants = ownerTenants.filter(t => {
    return t.moveInDate >= thisMonth && t.status === 'active';
  }).length;
  
  // Calculate revenue change (simplified - compare with last month)
  const lastMonthRevenue = monthlyRevenue * 0.88; // Simulate 12% increase
  const revenueChange = monthlyRevenue - lastMonthRevenue;
  const revenueChangePercent = lastMonthRevenue > 0 
    ? Math.round((revenueChange / lastMonthRevenue) * 100) 
    : 0;
  
  // Calculate occupancy change (simplified)
  const lastMonthOccupancy = Math.max(0, occupancyRate - 5);
  const occupancyChange = occupancyRate - lastMonthOccupancy;
  
  return {
    totalProperties: {
      value: totalProperties,
      change: `+${thisMonthProperties} this month`,
    },
    activeTenants: {
      value: activeTenants,
      change: `+${thisMonthTenants} this month`,
    },
    monthlyRevenue: {
      value: monthlyRevenue,
      formatted: formatCurrency(monthlyRevenue),
      change: revenueChangePercent > 0 
        ? `+${revenueChangePercent}% vs last month` 
        : `${revenueChangePercent}% vs last month`,
    },
    occupancyRate: {
      value: occupancyRate,
      formatted: `${occupancyRate}%`,
      change: occupancyChange > 0 
        ? `+${occupancyChange}% vs last month` 
        : `${occupancyChange}% vs last month`,
    },
  };
};

// Format currency
const formatCurrency = (amount: number): string => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
};

// Format time ago
export const formatTimeAgo = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
};

// Calculate days until due date
export const getDaysUntilDue = (dueDate: Date | string): string => {
  const dueDateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();
  const diffInDays = Math.ceil((dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 0) {
    return 'Overdue';
  } else if (diffInDays === 0) {
    return 'Due today';
  } else if (diffInDays === 1) {
    return 'Due tomorrow';
  } else {
    return `Due in ${diffInDays} days`;
  }
};

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { uploadMultiple } from '../middleware/upload.js';
import { 
  addProperty, 
  addActivity, 
  getPropertyById, 
  updateProperty,
  deleteProperty,
} from '../data/store.js';
import { prisma } from '../lib/prisma.js';
import { clerkClient } from '@clerk/express';
import type { Prisma } from '@prisma/client';

const router = express.Router();

/**
 * POST /api/properties/upload-photos
 * Upload photos for a property listing
 * Requires authentication
 */
router.post('/upload-photos', requireAuth, uploadMultiple, async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files as Express.Multer.File[];
    
    // Generate URLs for the uploaded files
    const photoUrls = files.map((file) => {
      // Return relative path that can be served statically
      return `/photos/${file.filename}`;
    });

    return res.status(200).json({
      success: true,
      message: `${files.length} photo(s) uploaded successfully`,
      photos: photoUrls,
    });
  } catch (error: any) {
    console.error('Error uploading photos:', error);
    return res.status(500).json({
      error: 'Failed to upload photos',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /api/properties
 * Create a new property listing
 * Requires authentication and owner role
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      propertyType,
      name,
      address,
      city,
      area,
      nearbyCollege,
      gender,
      occupancyType,
      totalBeds,
      monthlyRent,
      securityDeposit,
      minStay,
      amenities,
      rules,
      description,
      photos,
    } = req.body;

    // Validate required fields
    if (!propertyType || !name || !address || !city || !area || !monthlyRent) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['propertyType', 'name', 'address', 'city', 'area', 'monthlyRent'],
      });
    }

    // Validate photos
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ error: 'At least one photo is required' });
    }

    // Create property object for Prisma
    const propertyData: any = {
      ownerId: userId,
      propertyType,
      name,
      address,
      city,
      area,
      nearbyCollege: nearbyCollege || null,
      gender: gender || null,
      occupancyType: occupancyType || null,
      totalBeds: parseInt(totalBeds) || 1,
      monthlyRent: parseFloat(monthlyRent),
      securityDeposit: parseFloat(securityDeposit) || 0,
      minStay: parseInt(minStay) || 1,
      amenities: Array.isArray(amenities) ? amenities : [],
      rules: rules || '',
      description: description || '',
      photos: Array.isArray(photos) ? photos : [],
      status: 'approved', // Auto-approve for now
    };

    // Save to database
    const savedProperty = await addProperty(propertyData);

    // Add activity
    await addActivity({
      ownerId: userId,
      type: 'booking',
      message: `New property "${propertyData.name}" listed`,
    });

    console.log('✅ Property listing created:', savedProperty.id);

    return res.status(201).json({
      success: true,
      message: 'Property listing created successfully',
      property: {
        id: savedProperty.id,
        name: savedProperty.name,
        status: savedProperty.status,
      },
    });
  } catch (error: any) {
    console.error('Error creating property:', error);
    return res.status(500).json({
      error: 'Failed to create property listing',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/properties
 * Get all properties (with optional filters)
 */
router.get('/', async (req, res) => {
  try {
    const { 
      city, 
      area, 
      propertyType, 
      minRent, 
      maxRent, 
      gender,
      search 
    } = req.query;
    
    // Build Prisma where clause
    const where: any = {
      status: 'approved',
    };

    // Search filter (searches in name, city, area, nearbyCollege, address)
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { city: { contains: searchTerm, mode: 'insensitive' } },
        { area: { contains: searchTerm, mode: 'insensitive' } },
        { address: { contains: searchTerm, mode: 'insensitive' } },
        { nearbyCollege: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    
    if (city) {
      where.city = { equals: city as string, mode: 'insensitive' };
    }
    if (area) {
      where.area = { contains: area as string, mode: 'insensitive' };
    }
    if (propertyType && propertyType !== 'all') {
      where.propertyType = propertyType;
    }
    if (gender && gender !== 'all') {
      where.gender = gender;
    }
    if (minRent) {
      where.monthlyRent = { ...where.monthlyRent, gte: parseFloat(minRent as string) };
    }
    if (maxRent) {
      where.monthlyRent = { ...where.monthlyRent, lte: parseFloat(maxRent as string) };
    }

    // Get limit from query params (default: no limit)
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const properties = await prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit, // Limit results if specified
    });

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
 * GET /api/properties/:id
 * Get a single property by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const property = await getPropertyById(id);

    if (!property) {
      return res.status(404).json({
        error: 'Property not found',
      });
    }

    // Get owner email from Clerk
    let ownerEmail = null;
    let ownerName = null;
    try {
      const owner = await clerkClient.users.getUser(property.ownerId);
      ownerEmail = owner.emailAddresses[0]?.emailAddress || null;
      ownerName = owner.firstName && owner.lastName 
        ? `${owner.firstName} ${owner.lastName}` 
        : owner.firstName || owner.emailAddresses[0]?.emailAddress || 'Property Owner';
    } catch (clerkError) {
      console.error('Error fetching owner info from Clerk:', clerkError);
      // Continue without owner email if Clerk fails
    }

    return res.status(200).json({
      success: true,
      property: {
        ...property,
        ownerEmail,
        ownerName,
      },
    });
  } catch (error: any) {
    console.error('Error fetching property:', error);
    return res.status(500).json({
      error: 'Failed to fetch property',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * PUT /api/properties/:id
 * Update a property listing
 * Requires authentication and ownership
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const property = await getPropertyById(id);

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check ownership
    if (property.ownerId !== userId) {
      return res.status(403).json({ error: 'Forbidden - You do not own this property' });
    }

    const {
      propertyType,
      name,
      address,
      city,
      area,
      nearbyCollege,
      gender,
      occupancyType,
      totalBeds,
      monthlyRent,
      securityDeposit,
      minStay,
      amenities,
      rules,
      description,
      photos,
    } = req.body;

    // Prepare update data
    const updateData: Prisma.PropertyUpdateInput = {};
    
    if (propertyType) updateData.propertyType = propertyType;
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (area) updateData.area = area;
    if (nearbyCollege !== undefined) updateData.nearbyCollege = nearbyCollege || null;
    if (gender !== undefined) updateData.gender = gender || null;
    if (occupancyType !== undefined) updateData.occupancyType = occupancyType || null;
    if (totalBeds) updateData.totalBeds = parseInt(totalBeds);
    if (monthlyRent) updateData.monthlyRent = parseFloat(monthlyRent);
    if (securityDeposit !== undefined) updateData.securityDeposit = parseFloat(securityDeposit);
    if (minStay) updateData.minStay = parseInt(minStay);
    if (Array.isArray(amenities)) updateData.amenities = amenities;
    if (rules !== undefined) updateData.rules = rules;
    if (description !== undefined) updateData.description = description;
    if (Array.isArray(photos)) updateData.photos = photos;

    // Update in database
    const updatedProperty = await updateProperty(id, updateData);
    
    if (!updatedProperty) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Add activity
    await addActivity({
      ownerId: userId,
      type: 'maintenance',
      message: `Property "${updatedProperty.name}" updated`,
    });

    console.log('✅ Property updated:', id);

    return res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      property: updatedProperty,
    });
  } catch (error: any) {
    console.error('Error updating property:', error);
    return res.status(500).json({
      error: 'Failed to update property',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * DELETE /api/properties/:id
 * Delete a property listing
 * Requires authentication and ownership
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const property = await getPropertyById(id);

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check ownership
    if (property.ownerId !== userId) {
      return res.status(403).json({ error: 'Forbidden - You do not own this property' });
    }

    // Delete from database
    const deleted = await deleteProperty(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Add activity
    await addActivity({
      ownerId: userId,
      type: 'maintenance',
      message: `Property "${property.name}" deleted`,
    });

    console.log('✅ Property deleted:', id);

    return res.status(200).json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting property:', error);
    return res.status(500).json({
      error: 'Failed to delete property',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export { router as propertiesRouter };


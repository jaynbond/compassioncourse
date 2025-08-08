const express = require('express');
const { body, validationResult } = require('express-validator');
const Content = require('../models/Content');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin requirement to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard statistics
router.get('/stats/users', async (req, res) => {
    try {
        const total = await User.countDocuments({ isActive: true });
        const recent = await User.countDocuments({
            isActive: true,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        res.json({ total, recent });
    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({ error: 'Failed to get user statistics' });
    }
});

router.get('/stats/content', async (req, res) => {
    try {
        const total = await Content.countDocuments({ isPublished: true });
        res.json({ total });
    } catch (error) {
        console.error('Error getting content stats:', error);
        res.status(500).json({ error: 'Failed to get content statistics' });
    }
});

// Content management routes
router.get('/content', async (req, res) => {
    try {
        const { section, published } = req.query;
        
        const filter = {};
        if (section) filter.section = section;
        if (published !== undefined) filter.isPublished = published === 'true';

        const content = await Content.find(filter)
            .populate('metadata.lastModifiedBy', 'name email')
            .sort({ section: 1, order: 1, createdAt: -1 });

        res.json({ content });
    } catch (error) {
        console.error('Error getting content:', error);
        res.status(500).json({ error: 'Failed to get content' });
    }
});

router.get('/content/:id', async (req, res) => {
    try {
        const content = await Content.findById(req.params.id)
            .populate('metadata.lastModifiedBy', 'name email');

        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }

        res.json({ content });
    } catch (error) {
        console.error('Error getting content by ID:', error);
        res.status(500).json({ error: 'Failed to get content' });
    }
});

router.post('/content', [
    body('key')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Key must be between 1 and 100 characters')
        .matches(/^[a-z0-9-_]+$/)
        .withMessage('Key can only contain lowercase letters, numbers, hyphens, and underscores'),
    body('title')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters'),
    body('content')
        .trim()
        .isLength({ min: 1 })
        .withMessage('Content is required'),
    body('section')
        .isIn(['hero', 'about', 'programs', 'testimonials', 'cta', 'footer', 'navigation', 'statistics', 'general'])
        .withMessage('Invalid section'),
    body('order')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Order must be a non-negative integer')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { key, title, content, section, order = 0, type = 'text' } = req.body;

        // Check if key already exists
        const existingContent = await Content.findOne({ key });
        if (existingContent) {
            return res.status(409).json({ error: 'Content with this key already exists' });
        }

        const newContent = new Content({
            key,
            title,
            content,
            section,
            order,
            type,
            metadata: {
                lastModifiedBy: req.user._id
            }
        });

        await newContent.save();

        const populatedContent = await Content.findById(newContent._id)
            .populate('metadata.lastModifiedBy', 'name email');

        res.status(201).json({
            message: 'Content created successfully',
            content: populatedContent
        });
    } catch (error) {
        console.error('Error creating content:', error);
        res.status(500).json({ error: 'Failed to create content' });
    }
});

router.put('/content/:id', [
    body('key')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Key must be between 1 and 100 characters')
        .matches(/^[a-z0-9-_]+$/)
        .withMessage('Key can only contain lowercase letters, numbers, hyphens, and underscores'),
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters'),
    body('content')
        .optional()
        .trim()
        .isLength({ min: 1 })
        .withMessage('Content cannot be empty'),
    body('section')
        .optional()
        .isIn(['hero', 'about', 'programs', 'testimonials', 'cta', 'footer', 'navigation', 'statistics', 'general'])
        .withMessage('Invalid section'),
    body('order')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Order must be a non-negative integer'),
    body('isPublished')
        .optional()
        .isBoolean()
        .withMessage('isPublished must be a boolean')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const content = await Content.findById(req.params.id);
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }

        // Store original content for history
        content._original_content = content.content;

        // Update allowed fields
        const allowedUpdates = ['key', 'title', 'content', 'section', 'order', 'isPublished', 'type'];
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                content[field] = req.body[field];
            }
        });

        // Update metadata
        content.metadata.lastModifiedBy = req.user._id;

        await content.save();

        const populatedContent = await Content.findById(content._id)
            .populate('metadata.lastModifiedBy', 'name email');

        res.json({
            message: 'Content updated successfully',
            content: populatedContent
        });
    } catch (error) {
        console.error('Error updating content:', error);
        res.status(500).json({ error: 'Failed to update content' });
    }
});

router.delete('/content/:id', async (req, res) => {
    try {
        const content = await Content.findById(req.params.id);
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }

        await Content.findByIdAndDelete(req.params.id);

        res.json({ message: 'Content deleted successfully' });
    } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({ error: 'Failed to delete content' });
    }
});

// Content history
router.get('/content/:id/history', async (req, res) => {
    try {
        const content = await Content.findById(req.params.id)
            .populate('history.modifiedBy', 'name email')
            .select('history');

        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }

        res.json({ history: content.history });
    } catch (error) {
        console.error('Error getting content history:', error);
        res.status(500).json({ error: 'Failed to get content history' });
    }
});

// Restore content from history
router.post('/content/:id/restore/:versionIndex', async (req, res) => {
    try {
        const content = await Content.findById(req.params.id);
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }

        const versionIndex = parseInt(req.params.versionIndex);
        await content.restoreFromHistory(versionIndex, req.user._id);

        const populatedContent = await Content.findById(content._id)
            .populate('metadata.lastModifiedBy', 'name email');

        res.json({
            message: 'Content restored successfully',
            content: populatedContent
        });
    } catch (error) {
        console.error('Error restoring content:', error);
        res.status(500).json({ error: error.message || 'Failed to restore content' });
    }
});

// User management routes
router.get('/users', async (req, res) => {
    try {
        const { role, active, page = 1, limit = 50 } = req.query;
        
        const filter = {};
        if (role) filter.role = role;
        if (active !== undefined) filter.isActive = active === 'true';

        const users = await User.find(filter)
            .select('-password -loginAttempts -lockUntil')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await User.countDocuments(filter);

        res.json({
            users,
            pagination: {
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -loginAttempts -lockUntil');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

router.put('/users/:id/toggle-status', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent deactivating super-admin
        if (user.role === 'super-admin') {
            return res.status(403).json({ error: 'Cannot modify super-admin status' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            user: user.toSafeObject()
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

router.put('/users/:id/role', [
    body('role')
        .isIn(['user', 'admin', 'super-admin'])
        .withMessage('Invalid role')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        // Only super-admin can change roles
        if (req.user.role !== 'super-admin') {
            return res.status(403).json({ error: 'Only super-admin can change user roles' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.role = req.body.role;
        await user.save();

        res.json({
            message: 'User role updated successfully',
            user: user.toSafeObject()
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

module.exports = router;

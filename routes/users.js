const express = require('express');
const User = require('../models/User');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get public user profile (limited info)
router.get('/profile/:id', optionalAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('name bio avatar createdAt');

        if (!user || !user.isActive) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({ error: 'Failed to get user profile' });
    }
});

// Get current user's full profile
router.get('/me/profile', authenticateToken, async (req, res) => {
    try {
        res.json({ user: req.user.toSafeObject() });
    } catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).json({ error: 'Failed to get user profile' });
    }
});

// Update current user's profile
router.put('/me/profile', authenticateToken, async (req, res) => {
    try {
        const allowedUpdates = ['name', 'bio', 'preferences'];
        const updates = {};

        // Only include allowed fields
        Object.keys(req.body).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({
            message: 'Profile updated successfully',
            user: user.toSafeObject()
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

module.exports = router;

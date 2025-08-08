const express = require('express');
const Content = require('../models/Content');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get published content by section
router.get('/section/:section', optionalAuth, async (req, res) => {
    try {
        const { section } = req.params;
        
        const content = await Content.getPublishedBySection(section);
        
        res.json({ content });
    } catch (error) {
        console.error('Error getting content by section:', error);
        res.status(500).json({ error: 'Failed to get content' });
    }
});

// Get published content by key
router.get('/key/:key', optionalAuth, async (req, res) => {
    try {
        const { key } = req.params;
        
        const content = await Content.getByKey(key);
        
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }
        
        res.json({ content });
    } catch (error) {
        console.error('Error getting content by key:', error);
        res.status(500).json({ error: 'Failed to get content' });
    }
});

// Get all published content
router.get('/', optionalAuth, async (req, res) => {
    try {
        const content = await Content.find({ isPublished: true })
            .sort({ section: 1, order: 1 })
            .select('-history -metadata.lastModifiedBy');
        
        // Group content by section
        const groupedContent = content.reduce((acc, item) => {
            if (!acc[item.section]) {
                acc[item.section] = [];
            }
            acc[item.section].push(item);
            return acc;
        }, {});
        
        res.json({ content: groupedContent });
    } catch (error) {
        console.error('Error getting all content:', error);
        res.status(500).json({ error: 'Failed to get content' });
    }
});

module.exports = router;

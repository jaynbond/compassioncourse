const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: [100, 'Content key cannot exceed 100 characters']
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
        type: String,
        required: [true, 'Content is required']
    },
    type: {
        type: String,
        enum: ['text', 'html', 'markdown', 'json'],
        default: 'text'
    },
    section: {
        type: String,
        required: true,
        enum: [
            'hero',
            'about',
            'programs',
            'testimonials',
            'cta',
            'footer',
            'navigation',
            'statistics',
            'general'
        ]
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    metadata: {
        description: String,
        keywords: [String],
        author: String,
        lastModifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    version: {
        type: Number,
        default: 1
    },
    history: [{
        content: String,
        modifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        modifiedAt: {
            type: Date,
            default: Date.now
        },
        version: Number,
        note: String
    }]
}, {
    timestamps: true
});

// Indexes for performance
contentSchema.index({ key: 1 });
contentSchema.index({ section: 1 });
contentSchema.index({ isPublished: 1 });
contentSchema.index({ order: 1 });

// Pre-save middleware to handle versioning
contentSchema.pre('save', function(next) {
    // If content is being modified, save to history
    if (this.isModified('content') && !this.isNew) {
        this.history.push({
            content: this._original_content || this.content,
            version: this.version,
            modifiedBy: this.metadata.lastModifiedBy,
            modifiedAt: this.updatedAt || new Date(),
            note: 'Auto-saved version'
        });
        this.version += 1;
    }
    next();
});

// Static method to get published content by section
contentSchema.statics.getPublishedBySection = function(section) {
    return this.find({ 
        section, 
        isPublished: true 
    }).sort({ order: 1 });
};

// Static method to get content by key
contentSchema.statics.getByKey = function(key) {
    return this.findOne({ key, isPublished: true });
};

// Method to create a backup before updating
contentSchema.methods.createBackup = function(userId, note = '') {
    this.history.push({
        content: this.content,
        version: this.version,
        modifiedBy: userId,
        modifiedAt: new Date(),
        note: note || 'Manual backup'
    });
    return this.save();
};

// Method to restore from history
contentSchema.methods.restoreFromHistory = function(versionIndex, userId) {
    if (versionIndex >= 0 && versionIndex < this.history.length) {
        const historicalVersion = this.history[versionIndex];
        
        // Create backup of current version
        this.history.push({
            content: this.content,
            version: this.version,
            modifiedBy: userId,
            modifiedAt: new Date(),
            note: `Backup before restoring to version ${historicalVersion.version}`
        });
        
        // Restore content
        this.content = historicalVersion.content;
        this.version += 1;
        this.metadata.lastModifiedBy = userId;
        
        return this.save();
    }
    throw new Error('Invalid version index');
};

module.exports = mongoose.model('Content', contentSchema);

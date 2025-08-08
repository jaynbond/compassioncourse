const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        const token = req.cookies.token || 
                     (req.headers.authorization && req.headers.authorization.split(' ')[1]);

        if (!token) {
            return res.status(401).json({ 
                error: 'Access denied. No token provided.' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid token. User not found.' 
            });
        }

        if (!user.isActive) {
            return res.status(401).json({ 
                error: 'Account is deactivated.' 
            });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Invalid token.' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expired.' 
            });
        }
        
        console.error('Auth middleware error:', error);
        res.status(500).json({ 
            error: 'Internal server error.' 
        });
    }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Authentication required.' 
        });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'super-admin') {
        return res.status(403).json({ 
            error: 'Admin access required.' 
        });
    }

    next();
};

// Middleware to check if user is super admin
const requireSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            error: 'Authentication required.' 
        });
    }

    if (req.user.role !== 'super-admin') {
        return res.status(403).json({ 
            error: 'Super admin access required.' 
        });
    }

    next();
};

// Middleware for role-based access
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required.' 
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Access denied. Required roles: ${roles.join(', ')}` 
            });
        }

        next();
    };
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token || 
                     (req.headers.authorization && req.headers.authorization.split(' ')[1]);

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-password');
            
            if (user && user.isActive) {
                req.user = user;
            }
        }
    } catch (error) {
        // Silently fail for optional auth
        console.log('Optional auth failed:', error.message);
    }
    
    next();
};

// Generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId }, 
        process.env.JWT_SECRET, 
        { 
            expiresIn: '24h',
            issuer: 'compassion-course',
            audience: 'compassion-course-users'
        }
    );
};

// Set JWT cookie
const setTokenCookie = (res, token) => {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
    };

    res.cookie('token', token, cookieOptions);
};

// Clear JWT cookie
const clearTokenCookie = (res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
    });
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireSuperAdmin,
    requireRole,
    optionalAuth,
    generateToken,
    setTokenCookie,
    clearTokenCookie
};

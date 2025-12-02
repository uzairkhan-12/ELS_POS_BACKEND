const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const routes = require('./routes');

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - Allow all origins
app.use(cors({
    origin: '*',
    credentials: false
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Welcome route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to ELS_POS API',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        documentation: '/api/health',
        endpoints: {
            health: '/api/health',
            auth: {
                register: '/api/auth/register',
                login: '/api/auth/login'
            }
        }
    });
});

// API routes
app.use('/api', routes);

// 404 handler - MUST be after all other routes
app.use((req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
});

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    console.error(`[${new Date().toISOString()}] ${statusCode} - ${message} - ${req.originalUrl} - ${req.ip}`);
    
    res.status(statusCode).json({
        success: false,
        message: message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = app;
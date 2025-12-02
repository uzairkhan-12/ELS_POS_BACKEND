const mongoose = require('mongoose');
const logger = require('../utils/logger');

const healthCheck = async (req, res) => {
    try {
        const dbState = mongoose.connection.readyState;
        const dbStates = {
            0: 'Disconnected',
            1: 'Connected',
            2: 'Connecting',
            3: 'Disconnecting'
        };

        const healthCheck = {
            status: 'UP',
            timestamp: new Date().toISOString(),
            service: process.env.APP_NAME,
            version: process.env.APP_VERSION,
            environment: process.env.NODE_ENV,
            database: {
                status: dbStates[dbState],
                connection: dbState === 1 ? 'Healthy' : 'Unhealthy',
                host: mongoose.connection.host,
                name: mongoose.connection.name,
                readyState: dbState
            },
            system: {
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                nodeVersion: process.version,
                platform: process.platform
            }
        };

        logger.info(`Health check performed - DB Status: ${dbStates[dbState]}`);
        
        res.status(200).json({
            success: true,
            message: 'Server is running smoothly 🚀',
            data: healthCheck
        });
    } catch (error) {
        logger.error(`Health check failed: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Health check failed',
            error: error.message
        });
    }
};

module.exports = {
    healthCheck
};
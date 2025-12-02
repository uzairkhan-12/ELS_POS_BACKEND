require('dotenv').config({ path: '.env' });

const mongoose = require('mongoose');
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    console.error('Please check your .env file');
    process.exit(1);
}

// MongoDB Connection Options
const mongooseOptions = {
    serverSelectionTimeoutMS: 10000, // 10 seconds
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    retryWrites: true,
    w: 'majority'
};

// MongoDB Connection
const connectWithRetry = async () => {
    console.log('🔗 Attempting MongoDB connection...');
    
    try {
        await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
        
        console.log('✅ MongoDB Connected Successfully!');
        console.log(`📊 Database: ${mongoose.connection.name}`);
        console.log(`🌐 Host: ${mongoose.connection.host}`);
        
        // Start the server after successful connection
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🕐 Started at: ${new Date().toLocaleString()}`);
            console.log(`🔗 Local: http://localhost:${PORT}`);
            console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
        });
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        console.log('🔄 Retrying in 5 seconds...');
        setTimeout(connectWithRetry, 5000);
    }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
    console.log('📈 MongoDB event: Connected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB event: Error -', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB event: Disconnected');
    console.log('🔄 Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB event: Reconnected');
});

// Start the connection
connectWithRetry();

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    try {
        // Close server
        await new Promise((resolve) => {
            if (app.listening) {
                app.close(() => {
                    console.log('✅ Express server closed');
                    resolve();
                });
            } else {
                resolve();
            }
        });
        
        // Close MongoDB connection
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('✅ MongoDB connection closed');
        }
        
        console.log('👋 Graceful shutdown complete');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
    }
};

// Handle termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('🔥 Uncaught Exception:', err);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});
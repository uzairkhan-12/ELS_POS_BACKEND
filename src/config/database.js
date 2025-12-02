const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database Name: ${conn.connection.name}`);
        console.log(`🎯 Ready State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
        
        return conn;
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.error('Please check:');
        console.error('1. MongoDB Atlas IP whitelist');
        console.error('2. Database credentials');
        console.error('3. Network connectivity');
        process.exit(1);
    }
};

module.exports = connectDB;
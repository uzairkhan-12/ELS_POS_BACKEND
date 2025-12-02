require('dotenv').config({ path: '.env' });

const mongoose = require('mongoose');
const User = require('./src/models/User');

const seedAdmin = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log('✅ Connected to MongoDB');

        // Check if admin user already exists
        const adminExists = await User.findOne({ username: 'admin' });

        if (adminExists) {
            console.log('⚠️  Admin user already exists');
            await mongoose.connection.close();
            process.exit(0);
        }

        // Create admin user
        const adminUser = new User({
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            status: 'active'
        });

        await adminUser.save();

        console.log('✅ Admin user created successfully!');
        console.log('📝 Username: admin');
        console.log('🔐 Password: admin123');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        process.exit(1);
    }
};

seedAdmin();

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://laundry_admin:laundry_secret@localhost:27017/laundry_orders?authSource=admin';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI, {
            // These options are no longer needed in Mongoose 6+
            // but keeping for backward compatibility
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err);
});

module.exports = { connectDB, mongoose };

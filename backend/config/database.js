import mongoose from 'mongoose';

// Create a connection to the inkstall database (primary)
const connectDB = async () => {
    try {
        // Connect to the inkstall database
        const options = {
            dbName: 'inkstall'
        };
        
        await mongoose.connect(process.env.MONGODB_URI, options);
        console.log('Connected to primary MongoDB database: inkstall');
        
        // Also create a connection to the backupdata database (backup)
        const backupConnection = await mongoose.createConnection(process.env.MONGODB_URI, {
            dbName: 'backupdata'
        });
        
        // console.log('Connected to backup MongoDB database: backupdata');
        
        // Store the backup connection on the mongoose object for global access
        mongoose.backupConnection = backupConnection;
        
        return { mainConnection: mongoose.connection, backupConnection };
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

export default connectDB;
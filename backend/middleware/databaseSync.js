import mongoose from 'mongoose';

// Function to sync data between databases
export const syncToBackupDB = async (model, operation, data) => {
    try {
        // Get the backup connection
        const backupConnection = mongoose.backupConnection;
        if (!backupConnection) {
            console.error('Backup connection not available');
            return;
        }

        // Get the collection name from the model
        const collectionName = model.collection.name;
        
        // Get the backup collection
        const backupCollection = backupConnection.db.collection(collectionName);
        
        // Perform the operation on the backup database
        switch (operation) {
            case 'create':
                await backupCollection.insertOne(data);
                console.log(`Document synced to backup database (backupdata): ${collectionName}`);
                break;
            case 'update':
                await backupCollection.updateOne({ _id: data._id }, { $set: data });
                console.log(`Document updated in backup database (backupdata): ${collectionName}`);
                break;
            case 'delete':
                await backupCollection.deleteOne({ _id: data._id });
                console.log(`Document deleted from backup database (backupdata): ${collectionName}`);
                break;
            default:
                console.error('Unknown operation:', operation);
        }
    } catch (error) {
        console.error('Error syncing to backup database (backupdata):', error);
    }
};

// Middleware to automatically sync models
export const setupModelSync = () => {
    // Get all registered models
    const models = mongoose.models;
    
    // For each model, add post hooks for save, update, and remove
    Object.keys(models).forEach(modelName => {
        const model = models[modelName];
        
        // After save hook
        model.schema.post('save', async function(doc) {
            await syncToBackupDB(model, 'create', doc.toObject());
        });
        
        // After update hook
        model.schema.post('findOneAndUpdate', async function(doc) {
            if (doc) {
                await syncToBackupDB(model, 'update', doc.toObject());
            }
        });
        
        // After delete hook
        model.schema.post('findOneAndDelete', async function(doc) {
            if (doc) {
                await syncToBackupDB(model, 'delete', doc.toObject());
            }
        });
        
        // console.log(`Sync hooks set up for model: ${modelName} (primary: inkstall, backup: backupdata)`);
    });
};
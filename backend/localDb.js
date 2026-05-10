const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs-extra');
const path = require('path');

const BACKUP_FILE = path.join(__dirname, 'local_db_backup.json');
let isLocalMemoryDB = false;
let mongod = null;

async function dumpLocalData() {
  if (!isLocalMemoryDB || mongoose.connection.readyState !== 1) return;
  try {
    const data = {};
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      const name = collection.collectionName;
      const docs = await collection.find({}).toArray();
      data[name] = docs;
    }
    await fs.writeJson(BACKUP_FILE, data, { spaces: 2 });
    console.log(`💾 Local database successfully backed up to ${BACKUP_FILE}`);
  } catch (err) {
    console.error('❌ Error dumping local data:', err.message);
  }
}

async function restoreLocalData() {
  try {
    if (!await fs.pathExists(BACKUP_FILE)) {
      console.log('ℹ️ No local backup found. Starting fresh database.');
      return;
    }
    const data = await fs.readJson(BACKUP_FILE);
    const collections = Object.keys(data);
    let restoredCount = 0;
    for (const collName of collections) {
      if (data[collName] && data[collName].length > 0) {
        const collection = mongoose.connection.db.collection(collName);
        await collection.insertMany(data[collName]);
        restoredCount += data[collName].length;
      }
    }
    console.log(`📂 Restored ${restoredCount} documents from local backup.`);
  } catch (err) {
    console.error('❌ Error restoring local data:', err.message);
  }
}

async function startLocalMemoryDB() {
  console.log('⚠️  Switching to Built-in Local Fallback Database...');
  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    await mongoose.connect(uri, {
      bufferCommands: false,
    });
    
    isLocalMemoryDB = true;
    console.log('✅ Local Built-in Database started and connected successfully!');
    
    await restoreLocalData();

    // Auto-save every 5 minutes
    setInterval(dumpLocalData, 5 * 60 * 1000);
    
    // Save on exit
    const exitHandler = async () => {
      await dumpLocalData();
      if (mongod) await mongod.stop();
      process.exit();
    };
    
    process.on('SIGINT', exitHandler);
    process.on('SIGTERM', exitHandler);
    
  } catch (err) {
    console.error('❌ Failed to start local database:', err.message);
  }
}

async function connectDB() {
  console.log('🔄 Attempting to connect to MongoDB Atlas...');
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Short timeout to fail fast if blocked
      socketTimeoutMS: 15000,
      connectTimeoutMS: 5000,
      bufferCommands: false,
    });
    console.log('✅ Connected to MongoDB Atlas successfully!');
  } catch (err) {
    console.error(`❌ Atlas connection failed: ${err.message}`);
    // Trigger fallback
    await startLocalMemoryDB();
  }
}

module.exports = { connectDB, dumpLocalData };

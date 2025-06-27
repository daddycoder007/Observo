import { MongoClient } from 'mongodb';

let client = null;
let db = null;
let collection = null;

export async function connectToMongoDB() {
  try {
    let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const databaseName = process.env.MONGODB_DATABASE || 'observo';
    const collectionName = process.env.MONGODB_COLLECTION || 'logs';
    
    // Handle authentication if credentials are provided
    const username = process.env.MONGODB_USERNAME;
    const password = process.env.MONGODB_PASSWORD;
    
    if (username && password) {
      // If URI already contains authentication, use it as is
      if (uri.includes('@')) {
        console.log('Using provided MongoDB URI with authentication');
      } else {
        // Add authentication to URI
        const protocol = uri.startsWith('mongodb://') ? 'mongodb://' : 'mongodb+srv://';
        const hostPart = uri.replace(protocol, '');
        uri = `${protocol}${username}:${password}@${hostPart}`;
        console.log('Added authentication to MongoDB URI');
      }
    } else {
      // For local development without authentication
      console.log('Connecting to MongoDB without authentication');
    }

    // Create MongoDB client
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    // Connect to MongoDB
    await client.connect();
    
    // Get database and collection
    db = client.db(databaseName);
    collection = db.collection(collectionName);

    // Create indexes for better query performance
    await createIndexes();

    console.log(`Connected to MongoDB: ${databaseName}.${collectionName}`);
    
    return { client, db, collection };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

async function createIndexes() {
  try {
    // Create indexes for common query patterns
    await collection.createIndex({ timestamp: -1 });
    await collection.createIndex({ level: 1 });
    await collection.createIndex({ service: 1 });
    await collection.createIndex({ "metadata.host": 1 });
    
    console.log('✅ MongoDB indexes created successfully');
  } catch (error) {
    console.warn('⚠️ Failed to create indexes:', error.message);
  }
}

export function getCollection() {
  if (!collection) {
    throw new Error('MongoDB not connected. Call connectToMongoDB() first.');
  }
  return collection;
}

export function getDatabase() {
  if (!db) {
    throw new Error('MongoDB not connected. Call connectToMongoDB() first.');
  }
  return db;
}

export async function closeMongoConnection() {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await closeMongoConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeMongoConnection();
  process.exit(0);
}); 
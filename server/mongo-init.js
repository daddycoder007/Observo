// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to admin database to create user
db = db.getSiblingDB('admin');

// Create user for the observo database
db.createUser({
  user: 'admin',
  pwd: 'password',
  roles: [
    { role: 'readWrite', db: 'observo' },
    { role: 'dbAdmin', db: 'observo' }
  ]
});

// Switch to observo database
db = db.getSiblingDB('observo');

// Create the logs collection
db.createCollection('logs');

// Create indexes for better query performance
db.logs.createIndex({ "timestamp": -1 });
db.logs.createIndex({ "level": 1 });
db.logs.createIndex({ "service": 1 });
db.logs.createIndex({ "metadata.host": 1 });
db.logs.createIndex({ "message": "text" });

// Create a TTL index to automatically delete old logs (optional)
// Uncomment the line below if you want logs to be automatically deleted after 30 days
// db.logs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

print('✅ MongoDB initialized successfully');
print('👤 User created: admin');
print('📊 Database: observo');
print('📝 Collection: logs');
print('🔍 Indexes created for optimal query performance'); 
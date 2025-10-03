# MongoDB Migration Guide

## Step 1: Set up MongoDB

### Option A: MongoDB Atlas (Cloud - Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (free tier: 512MB)
4. Get your connection string
5. Set environment variable:
```bash
export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/"
```

### Option B: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Set environment variable:
```bash
export MONGODB_URI="mongodb://localhost:27017"
```

## Step 2: Run Migration

```bash
# Set your MongoDB URI
export MONGODB_URI="your-connection-string-here"

# Run the migration
node migrate-to-mongodb.js
```

## Step 3: Update Your App

### Update package.json
```json
{
  "scripts": {
    "start": "node index.js",
    "start:mongodb": "node index-mongodb.js"
  }
}
```

### Create index-mongodb.js
```javascript
const { ApolloServer } = require('apollo-server');
const resolvers = require('./resolvers-mongodb');
const typeDefs = require('./typeDefs');

const server = new ApolloServer({ typeDefs, resolvers });

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`🚀 MongoDB Server ready at ${url}`);
});
```

## Step 4: Test the Migration

```bash
# Start with MongoDB
npm run start:mongodb

# Test queries
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"query { surahs { id title count } }"}' \
  http://localhost:4000/
```

## Expected Results

### Memory Usage
- **Before**: 1GB+ (all data loaded)
- **After**: 50-100MB (only loaded data)

### Performance
- **Startup**: 2-3 seconds (was 10+ seconds)
- **Queries**: 5-10ms (was 10-17ms)
- **Memory**: Stable (no growth)

### Collections Created
- `surahs`: Basic surah information
- `verses`: Quran text with words and metadata
- `translations`: Multiple translation texts
- `tafsirs`: Tafsir texts

## Troubleshooting

### Connection Issues
```bash
# Test MongoDB connection
node -e "
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGODB_URI);
client.connect().then(() => {
  console.log('✅ Connected to MongoDB');
  client.close();
}).catch(err => {
  console.error('❌ Connection failed:', err);
});
"
```

### Migration Issues
```bash
# Check if data was migrated
node -e "
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.MONGODB_URI);
client.connect().then(async () => {
  const db = client.db('quran_api');
  const surahs = await db.collection('surahs').countDocuments();
  const verses = await db.collection('verses').countDocuments();
  console.log(\`Surahs: \${surahs}, Verses: \${verses}\`);
  client.close();
});
"
```

## Environment Variables

### For Heroku
```bash
heroku config:set MONGODB_URI="your-connection-string"
```

### For Local Development
```bash
# .env file
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

## Benefits of MongoDB Migration

1. **Memory Efficiency**: 90% reduction in memory usage
2. **Scalability**: Can handle multiple concurrent users
3. **Performance**: Indexed queries are faster
4. **Flexibility**: Easy to add new features
5. **Cost**: Free tier available

## Rollback Plan

If you need to rollback to file-based approach:
1. Keep your original resolvers.js
2. Use original index.js
3. Remove MongoDB dependencies
4. Deploy original version

The migration is reversible and your original code remains intact.

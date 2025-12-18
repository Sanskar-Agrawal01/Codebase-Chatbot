import weaviate from 'weaviate-client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const weaviateUrl = process.env.WEAVIATE_URL;
const weaviateApiKey = process.env.WEAVIATE_API_KEY;
const jinaaiApiKey = process.env.JINA_API_KEY;

async function setupWeaviate() {
  console.log('🚀 Setting up Weaviate...\n');

  // 1. Validate environment variables
  console.log('1️⃣ Checking environment variables...');
  if (!weaviateUrl) {
    console.error('❌ WEAVIATE_URL is missing');
    return;
  }
  if (!weaviateApiKey) {
    console.error('❌ WEAVIATE_API_KEY is missing');
    return;
  }
  if (!jinaaiApiKey) {
    console.error('❌ JINA_API_KEY is missing');
    return;
  }
  console.log('✅ All environment variables present\n');

  // 2. Test connection
  console.log('2️⃣ Testing Weaviate connection...');
  console.log('   URL:', weaviateUrl);
  
  let client;
  try {
    client = await weaviate.connectToWeaviateCloud(
      weaviateUrl,
      {
        authCredentials: new weaviate.ApiKey(weaviateApiKey),
        headers: {
          'X-JinaAI-Api-Key': jinaaiApiKey,
        }
      }
    );
    console.log('✅ Successfully connected to Weaviate\n');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\n📋 Please check:');
    console.error('   - Is your Weaviate cluster running?');
    console.error('   - Is the URL correct? (should be https://your-cluster.weaviate.network)');
    console.error('   - Are your API keys valid?\n');
    return;
  }

  // 3. Check if collection exists
  console.log('3️⃣ Checking for RepoCodeChunk collection...');
  try {
    const collections = await client.collections.listAll();
    const hasCollection = collections.some(c => c.name === 'RepoCodeChunk');
    
    if (hasCollection) {
      console.log('✅ RepoCodeChunk collection exists\n');
    } else {
      console.log('⚠️  RepoCodeChunk collection does not exist');
      console.log('   Creating collection...\n');
      
      // Create the collection
      await client.collections.create({
        name: 'RepoCodeChunk',
        vectorizer: 'text2vec-jinaai',
        moduleConfig: {
          'text2vec-jinaai': {
            model: 'jina-embeddings-v2-base-en'
          }
        },
        properties: [
          {
            name: 'text',
            dataType: ['text'],
            description: 'The code chunk content'
          },
          {
            name: 'repourl',
            dataType: ['text'],
            description: 'Repository URL'
          },
          {
            name: 'userid',
            dataType: ['text'],
            description: 'User email'
          }
        ]
      });
      
      console.log('✅ Collection created successfully\n');
    }
  } catch (error) {
    console.error('❌ Error checking/creating collection:', error.message);
    return;
  }

  // 4. Test query
  console.log('4️⃣ Testing query functionality...');
  try {
    const collection = client.collections.get('RepoCodeChunk');
    const result = await collection.query.fetchObjects({ limit: 1 });
    console.log('✅ Query successful');
    console.log(`   Found ${result.objects.length} objects in collection\n`);
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    return;
  }

  console.log('🎉 Weaviate setup complete!\n');
  
  // Close connection
  client.close();
}

setupWeaviate().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});


import { MongoClient, ObjectId } from "mongodb";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface RequestBody {
  collection: string;
  operation: 'find' | 'findOne' | 'insertOne' | 'insertMany' | 'updateOne' | 'updateMany' | 'deleteOne' | 'deleteMany' | 'aggregate';
  filter?: Record<string, unknown>;
  document?: Record<string, unknown>;
  documents?: Record<string, unknown>[];
  update?: Record<string, unknown>;
  pipeline?: Record<string, unknown>[];
  options?: Record<string, unknown>;
  userId?: string;
}

let cachedClient: MongoClient | null = null;

async function getClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }
  
  const uri = Deno.env.get('MONGODB_URI');
  if (!uri) {
    throw new Error('MONGODB_URI is not configured');
  }
  
  cachedClient = new MongoClient(uri);
  await cachedClient.connect();
  console.log('Connected to MongoDB');
  return cachedClient;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract auth header for user identification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No valid token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JWT to get user ID (Clerk tokens)
    const token = authHeader.replace('Bearer ', '');
    let userId: string;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
      if (!userId) {
        throw new Error('No user ID in token');
      }
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RequestBody = await req.json();
    const { collection, operation, filter = {}, document, documents, update, pipeline, options = {} } = body;

    if (!collection || !operation) {
      return new Response(
        JSON.stringify({ error: 'Missing collection or operation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[MongoDB] User ${userId} - ${operation} on ${collection}`);

    const client = await getClient();
    const db = client.db('devos');
    const coll = db.collection(collection);

    // Always scope queries to the authenticated user
    const userFilter: Record<string, unknown> = { ...filter, userId };
    
    let result: unknown;

    switch (operation) {
      case 'find': {
        const cursor = coll.find(userFilter, options);
        result = await cursor.toArray();
        break;
      }
      case 'findOne': {
        result = await coll.findOne(userFilter, options);
        break;
      }
      case 'insertOne': {
        if (!document) {
          throw new Error('Document required for insertOne');
        }
        const docWithUser = { 
          ...document, 
          userId, 
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        result = await coll.insertOne(docWithUser);
        break;
      }
      case 'insertMany': {
        if (!documents || !Array.isArray(documents)) {
          throw new Error('Documents array required for insertMany');
        }
        const docsWithUser = documents.map(doc => ({
          ...doc,
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        result = await coll.insertMany(docsWithUser);
        break;
      }
      case 'updateOne': {
        if (!update) {
          throw new Error('Update required for updateOne');
        }
        // Convert _id string to ObjectId if present
        if (userFilter._id && typeof userFilter._id === 'string') {
          userFilter._id = new ObjectId(userFilter._id as string);
        }
        const updateWithTimestamp = {
          ...update,
          $set: { ...(update.$set as Record<string, unknown> || {}), updatedAt: new Date().toISOString() }
        };
        result = await coll.updateOne(userFilter, updateWithTimestamp);
        break;
      }
      case 'updateMany': {
        if (!update) {
          throw new Error('Update required for updateMany');
        }
        const updateWithTimestamp = {
          ...update,
          $set: { ...(update.$set as Record<string, unknown> || {}), updatedAt: new Date().toISOString() }
        };
        result = await coll.updateMany(userFilter, updateWithTimestamp);
        break;
      }
      case 'deleteOne': {
        if (userFilter._id && typeof userFilter._id === 'string') {
          userFilter._id = new ObjectId(userFilter._id as string);
        }
        result = await coll.deleteOne(userFilter);
        break;
      }
      case 'deleteMany': {
        result = await coll.deleteMany(userFilter);
        break;
      }
      case 'aggregate': {
        if (!pipeline || !Array.isArray(pipeline)) {
          throw new Error('Pipeline array required for aggregate');
        }
        // Prepend match stage for user isolation
        const userPipeline = [{ $match: { userId } }, ...pipeline];
        const cursor = coll.aggregate(userPipeline, options);
        result = await cursor.toArray();
        break;
      }
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    return new Response(
      JSON.stringify({ data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[MongoDB] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

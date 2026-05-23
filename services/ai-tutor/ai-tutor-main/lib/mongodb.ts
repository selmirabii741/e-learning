import { MongoClient, Db, Collection } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;
let documentsCollection: Collection | null = null;

export async function connectToMongoDB(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI!;
  client = new MongoClient(uri);
  await client.connect();
  
  db = client.db(process.env.MONGODB_DB || 'ai-tutor');
  documentsCollection = db.collection('documents');
  
  // Ensure index on content for text search if needed
  // await documentsCollection.createIndex({ content: 'text' });
  
  return db;
}

export async function getDocumentsCollection(): Promise<Collection> {
  if (!documentsCollection) {
    await connectToMongoDB();
  }
  return documentsCollection!;
}

export async function clearDocuments(): Promise<void> {
  const collection = await getDocumentsCollection();
  await collection.deleteMany({});
}

export async function insertDocument(content: string, embedding: number[]): Promise<void> {
  const collection = await getDocumentsCollection();
  await collection.insertOne({ content, embedding, createdAt: new Date() });
}

export async function closeMongoDBConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    documentsCollection = null;
  }
}
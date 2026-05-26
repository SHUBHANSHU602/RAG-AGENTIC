require('dotenv').config();
const { QdrantClient } = require('@qdrant/js-client-rest');

const client = new QdrantClient({ url: 'http://localhost:6333' });

const COLLECTION_NAME = 'docs';
const VECTOR_SIZE = 384; // all-MiniLM-L6-v2 output size

async function createCollection() {
  const collections = await client.getCollections();
  const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

  if (exists) {
    console.log('Collection already exists — skipping creation');
    return;
  }

  await client.createCollection(COLLECTION_NAME, {
    vectors: { size: VECTOR_SIZE, distance: 'Cosine' }
  });
  console.log('Collection created:', COLLECTION_NAME);
}

async function storeVector(id, text, vector) {
  await client.upsert(COLLECTION_NAME, {
    points: [{ id, vector, payload: { text } }]
  });
}

async function searchVectors(queryVector, topK = 3) {
  return client.search(COLLECTION_NAME, {
    vector: queryVector,
    limit: topK,
    with_payload: true
  });
}

module.exports = { createCollection, storeVector, searchVectors };
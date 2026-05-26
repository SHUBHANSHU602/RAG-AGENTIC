const { pipeline } = require('@xenova/transformers');

let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    console.log('Loading embedding model... (first time only)');
    embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }
  return embedder;
}

async function embed(text) {
  const embedderPipeline = await getEmbedder();
  const output = await embedderPipeline(text, {
    pooling: 'mean',
    normalize: true
  });
  return Array.from(output.data);
}

function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((s, a) => s + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((s, b) => s + b * b, 0));
  return dot / (magA * magB);
}

module.exports = { embed, cosineSimilarity };
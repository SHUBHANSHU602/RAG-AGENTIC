require('dotenv').config();
const { OpenAI } = require('openai');

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function embed(text) {
    const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text
    });
    return response.data[0].embedding;
}

function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((s, a) => s + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((s, b) => s + b * b, 0));
  return dot / (magA * magB);
}

module.exports = { embed, cosineSimilarity };

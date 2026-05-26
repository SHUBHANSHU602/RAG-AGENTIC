const { embed, cosineSimilarity } = require('./embedder');
const { createCollection, storeVector, searchVectors } = require('./vectorStore');

const sentences = [
  { id: 1, text: 'Dogs are loyal and friendly animals' },
  { id: 2, text: 'Puppies love to play and learn tricks' },
  { id: 3, text: 'Quantum physics studies subatomic particles' },
  { id: 4, text: 'Machine learning is a subset of AI' },
  { id: 5, text: 'Neural networks are inspired by the human brain' },
];

async function run() {
  console.log('--- Setting up Qdrant collection ---\n');
  await createCollection();

  console.log('--- Embedding and storing 5 sentences ---\n');
  for (const s of sentences) {
    const vector = await embed(s.text);
    await storeVector(s.id, s.text, vector);
    console.log(`Stored: "${s.text}"`);
  }

  console.log('\n--- Searching for: "animals and pets" ---\n');
  const queryVec = await embed('animals and pets');
  const results = await searchVectors(queryVec, 3);

  results.forEach((r, i) => {
    console.log(`${i + 1}. Score: ${r.score.toFixed(4)} → "${r.payload.text}"`);
  });
}

run().catch(console.error);
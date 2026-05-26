const { embed, cosineSimilarity } = require('./embedder');
const { chat } = require('./llm');

async function run() {
  console.log('--- Testing Embeddings ---\n');

  const vec1 = await embed('I love dogs');
  const vec2 = await embed('Puppies are adorable');
  const vec3 = await embed('Quantum physics is complex');

  console.log('Vector length:', vec1.length);

  const sim12 = cosineSimilarity(vec1, vec2);
  const sim13 = cosineSimilarity(vec1, vec3);

  console.log(`\n"I love dogs" vs "Puppies are adorable" → ${sim12.toFixed(4)}`);
  console.log(`"I love dogs" vs "Quantum physics"       → ${sim13.toFixed(4)}`);
  console.log('\nExpected: sim12 >> sim13');

  console.log('\n--- Testing Groq LLM ---\n');

 const answer = await chat([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'What is RAG in AI? Answer in 2 sentences.' }
]);
  console.log('Groq answer:', answer);
}

run().catch(console.error);
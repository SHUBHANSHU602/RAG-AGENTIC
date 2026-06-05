const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');

async function chunkDocuments(docs, chunkSize = 500, chunkOverlap = 50) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap
  });

  const chunks = await splitter.splitDocuments(docs);
  console.log(`Split into ${chunks.length} chunks`);
  return chunks;
}

module.exports = { chunkDocuments };
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');

// Original naive chunker — kept for reference, no longer used in ingest
async function chunkDocuments(docs, chunkSize = 500, chunkOverlap = 50) {
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap });
  const chunks = await splitter.splitDocuments(docs);
  console.log(`[chunker] naive split: ${chunks.length} chunks`);
  return chunks;
}

// Parent-child chunker — Phase 2 default
// Parent: large chunk (full context for LLM)
// Child: small chunk (precise retrieval unit)
// Each child carries its parent's text in metadata
async function parentChildChunk(docs, parentSize = 500, childSize = 150, overlap = 20) {
  const parentSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: parentSize,
    chunkOverlap: overlap
  });

  const childSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: childSize,
    chunkOverlap: overlap
  });

  const parentChunks = await parentSplitter.splitDocuments(docs);
  console.log(`[chunker] ${parentChunks.length} parent chunks`);

  const childChunks = [];

  for (let i = 0; i < parentChunks.length; i++) {
    const parent = parentChunks[i];
    const children = await childSplitter.splitDocuments([parent]);

    for (const child of children) {
      childChunks.push({
        pageContent: child.pageContent,
        metadata: {
          ...child.metadata,
          parentText: parent.pageContent,  // full context stored here
          parentIndex: i
        }
      });
    }
  }

  console.log(`[chunker] ${childChunks.length} child chunks (each carries parent context)`);
  return childChunks;
}

module.exports = { chunkDocuments, parentChildChunk };
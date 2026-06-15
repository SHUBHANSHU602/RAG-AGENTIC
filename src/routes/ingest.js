const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { loadPDF } = require('../ingestion/pdfParser');
const { parentChildChunk } = require('../ingestion/chunker');
const { embedBatch } = require('../embedder');
const { storeBatch } = require('../vectorStore');
const { buildVocabulary, computeSparseVector } = require('../bm25');

router.post('/', async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) return res.status(400).json({ error: 'Send { filePath: "path/to/file.pdf" }' });

    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) return res.status(400).json({ error: `File not found: ${resolvedPath}` });
    if (!resolvedPath.endsWith('.pdf')) return res.status(400).json({ error: 'Only PDF files are supported' });

    const docs = await loadPDF(resolvedPath);
    const chunks = await parentChildChunk(docs);
    if (chunks.length === 0) return res.status(400).json({ error: 'PDF produced no chunks' });

    const texts = chunks.map(c => c.pageContent);

    // Build vocabulary from all chunks so sparse vectors share the same term space
    const vocabulary = buildVocabulary(texts);

    // Dense embeddings — semantic meaning
    const denseVectors = await embedBatch(texts);

    const baseId = Math.floor(Math.random() * 1_000_000_000);
    const points = chunks.map((chunk, i) => ({
      id: baseId + i,
      vector: {
        dense: denseVectors[i],
        sparse: computeSparseVector(chunk.pageContent, vocabulary)
      },
      payload: {
        text: chunk.pageContent,
        parentText: chunk.metadata.parentText,
        parentIndex: chunk.metadata.parentIndex,
        source: resolvedPath,
        chunkIndex: i
      }
    }));

    await storeBatch(points);

    res.json({ status: 'ok', pages: docs.length, chunks: chunks.length, pointsStored: points.length });

  } catch (err) {
    console.error('[ingest error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
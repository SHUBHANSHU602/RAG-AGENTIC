const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { loadPDF } = require('../ingestion/pdfParser');
const { parentChildChunk } = require('../ingestion/chunker');
const { embedBatch } = require('../embedder');
const { storeBatch } = require('../vectorStore');

router.post('/', async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'Send { filePath: "path/to/file.pdf" }' });
    }

    const resolvedPath = path.resolve(filePath);

    if (!fs.existsSync(resolvedPath)) {
      return res.status(400).json({ error: `File not found: ${resolvedPath}` });
    }

    if (!resolvedPath.endsWith('.pdf')) {
      return res.status(400).json({ error: 'Only PDF files are supported' });
    }

    const docs = await loadPDF(resolvedPath);
    const chunks = await parentChildChunk(docs);

    if (chunks.length === 0) {
      return res.status(400).json({ error: 'PDF produced no chunks — file may be empty' });
    }

    const texts = chunks.map(c => c.pageContent);
    const vectors = await embedBatch(texts);

    const baseId = Math.floor(Math.random() * 1_000_000_000);
    const points = chunks.map((chunk, i) => ({
      id: baseId + i,
      vector: vectors[i],
      payload: {
        text: chunk.pageContent,           // child text — what was embedded
        parentText: chunk.metadata.parentText,  // full parent context — what LLM reads
        parentIndex: chunk.metadata.parentIndex,
        source: resolvedPath,
        chunkIndex: i
      }
    }));

    await storeBatch(points);

    res.json({
      status: 'ok',
      pages: docs.length,
      chunks: chunks.length,
      pointsStored: points.length
    });

  } catch (err) {
    console.error('[ingest error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
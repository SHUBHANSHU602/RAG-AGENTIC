const express = require('express');
const router = express.Router();
const path = require('path');
const { loadPDF } = require('../ingestion/pdfParser');
const { chunkDocuments } = require('../ingestion/chunker');
const { embed } = require('../embedder');
const { storeVector } = require('../vectorStore');

router.post('/', async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'Send { filePath: "path/to/file.pdf" }' });
    }

    // Step 1 — Load PDF
    const docs = await loadPDF(path.resolve(filePath));

    // Step 2 — Chunk it
    const chunks = await chunkDocuments(docs);

    // Step 3 — Embed and store each chunk
    let stored = 0;
    for (const chunk of chunks) {
      const vector = await embed(chunk.pageContent);
      const id = Date.now() + stored; // unique id per chunk
      await storeVector(id, chunk.pageContent, vector);
      stored++;
    }

    res.json({
      status: 'ok',
      pages: docs.length,
      chunks: stored
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
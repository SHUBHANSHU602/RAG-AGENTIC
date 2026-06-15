const express = require('express');
const router = express.Router();
const { embed } = require('../embedder');
const { searchDense, searchSparse } = require('../vectorStore');
const { chat } = require('../llm');
const { buildVocabulary, computeSparseVector, tokenize } = require('../bm25');

router.post('/', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string') return res.status(400).json({ error: 'question must be a non-empty string' });

    const trimmed = question.trim();
    if (trimmed.length < 3) return res.status(400).json({ error: 'question must be at least 3 characters' });
    if (trimmed.length > 1000) return res.status(400).json({ error: 'question too long — max 1000 characters' });

    // Dense search — semantic meaning
    const queryVec = await embed(trimmed);
    const denseResults = await searchDense(queryVec, 8);

    // Sparse search — keyword matching
    // Build vocab from query tokens only (approximate — good enough for retrieval)
    const queryVocab = buildVocabulary([trimmed]);
    const sparseVec = computeSparseVector(trimmed, queryVocab);
    const sparseResults = await searchSparse(sparseVec, 8);

    // Merge: combine both result sets, deduplicate by id, keep highest score
    const merged = new Map();
    for (const r of [...denseResults, ...sparseResults]) {
      if (!merged.has(r.id) || r.score > merged.get(r.id).score) {
        merged.set(r.id, r);
      }
    }

    const filteredResults = Array.from(merged.values())
      .filter(r => r.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    if (filteredResults.length === 0) {
      return res.status(200).json({
        answer: 'I could not find relevant information to answer your question.',
        sources: [], retrieved: 0
      });
    }

    // Deduplicate by parentIndex
    const seenParents = new Map();
    for (const result of filteredResults) {
      const pIdx = result.payload.parentIndex ?? result.payload.chunkIndex;
      if (!seenParents.has(pIdx) || result.score > seenParents.get(pIdx).score) {
        seenParents.set(pIdx, result);
      }
    }
    const dedupedResults = Array.from(seenParents.values());

    const context = dedupedResults
      .map(r => r.payload.parentText || r.payload.text)
      .join('\n\n');

    const answer = await chat([
      { role: 'system', content: 'You are a helpful assistant. Answer the question using only the provided context. If the answer is not in the context, say you do not know.' },
      { role: 'user', content: `Context:\n${context}\n\nQuestion: ${trimmed}` }
    ]);

    return res.status(200).json({
      answer,
      retrieved: dedupedResults.length,
      sources: dedupedResults.map(r => ({
        childText: r.payload.text,
        parentText: r.payload.parentText?.slice(0, 200) ?? null,
        score: parseFloat(r.score.toFixed(4)),
        parentIndex: r.payload.parentIndex ?? null,
        source: r.payload.source ?? null
      }))
    });

  } catch (err) {
    console.error('[query error]', err.message);
    return res.status(500).json({ error: 'Internal server error. Check server logs.' });
  }
});

module.exports = router;
// Computes a sparse vector representation of text for BM25 keyword search.
// Sparse vectors have indices (term IDs) and values (TF-IDF-like weights).
// Only non-zero terms are stored — that's what makes them "sparse."

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

function computeSparseVector(text, vocabulary) {
  const tokens = tokenize(text);
  const termFreq = {};

  for (const token of tokens) {
    termFreq[token] = (termFreq[token] || 0) + 1;
  }

  const indices = [];
  const values = [];

  for (const [term, freq] of Object.entries(termFreq)) {
    if (vocabulary.has(term)) {
      indices.push(vocabulary.get(term));
      // TF normalized by document length
      values.push(freq / tokens.length);
    }
  }

  return { indices, values };
}

function buildVocabulary(texts) {
  const vocab = new Map();
  let idx = 0;
  for (const text of texts) {
    for (const token of tokenize(text)) {
      if (!vocab.has(token)) {
        vocab.set(token, idx++);
      }
    }
  }
  return vocab;
}

module.exports = { tokenize, computeSparseVector, buildVocabulary };
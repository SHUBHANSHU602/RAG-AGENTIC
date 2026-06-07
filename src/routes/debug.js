const express = require('express');
const router = express.Router();
const { QdrantClient } = require('@qdrant/js-client-rest');

const client = new QdrantClient({ url: 'http://localhost:6333' });
const COLLECTION_NAME = 'docs';

router.get('/', async (req, res) => {
  try {
    const info = await client.getCollection(COLLECTION_NAME);
    const { points } = await client.scroll(COLLECTION_NAME, {
      limit: 5,
      with_payload: true,
      with_vector: false
    });

    res.json({
      totalPoints: info.points_count,
      vectorSize: info.config.params.vectors.size,
      sampleChunks: points.map(p => ({
        id: p.id,
        preview: p.payload?.text?.slice(0, 120)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
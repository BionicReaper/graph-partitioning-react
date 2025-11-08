import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Graph Partitioning Backend Server' });
});

// Placeholder for future graph partitioning algorithms
app.post('/api/partition', (req, res) => {
  const { graph, algorithm } = req.body;
  res.json({ message: 'Partitioning endpoint - to be implemented' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

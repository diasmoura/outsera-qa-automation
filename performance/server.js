
const express = require('express');

const app = express();
const PORT = 3000;

app.use(express.json());

const users = [
  { id: 1, name: 'Lucas', email: 'lucas@example.com' },
  { id: 2, name: 'Maria', email: 'maria@example.com' },
  { id: 3, name: 'João', email: 'joao@example.com' },
];

app.get('/users', (req, res) => {
  res.status(200).json({
    success: true,
    total: users.length,
    data: users,
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API de teste executando na porta ${PORT}`);
});

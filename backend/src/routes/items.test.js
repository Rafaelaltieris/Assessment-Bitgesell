const request = require('supertest');
const express = require('express');
const itemsRouter = require('./items');

const app = express();
app.use('/api', itemsRouter);

describe('Items API Routes', () => {
  // Teste para o "caminho feliz" da rota de items
  it('GET /api/items should return a list of items', async () => {
    const res = await request(app).get('/api/items');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('items'); // Verifica se a resposta tem a propriedade 'items'
    expect(Array.isArray(res.body.items)).toBe(true); // Verifica se 'items' é um array
  });

  // Teste para a paginação
  it('GET /api/items should handle pagination correctly', async () => {
    const res = await request(app).get('/api/items?page=1&limit=5');
    expect(res.statusCode).toEqual(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(5);
    expect(res.body.items.length).toBeLessThanOrEqual(5);
  });

  // Teste para a busca
   it('GET /api/items should handle search query correctly', async () => {
    const res = await request(app).get('/api/items?q=item'); // Assumindo que 'item' existe nos dados
    expect(res.statusCode).toEqual(200);
    // Todos os itens retornados devem conter "item" no nome
    res.body.items.forEach(item => {
        expect(item.name.toLowerCase()).toContain('item');
    });
  });

  // Teste para a rota de stats
  it('GET /api/stats should return stats', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('totalItems');
    expect(res.body).toHaveProperty('averagePrice');
  });
});""
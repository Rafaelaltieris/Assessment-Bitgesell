const express = require('express');
const fs = require('fs').promises; // Importa a versão de 'promises' para usar async/await
const path = require('path');

const router = express.Router();
const DATA_PATH = path.join(__dirname, '..', 'data', 'items.json');

// Variável para o cache da rota /stats
let statsCache = null;

/**
 * ROTA PRINCIPAL: GET /api/items
 * - Leitura assíncrona do arquivo.
 * - Implementa busca com o parâmetro 'q'.
 * - Implementa paginação com os parâmetros 'page' e 'limit'.
 */
router.get('/items', async (req, res, next) => {
  try {
    const fileContent = await fs.readFile(DATA_PATH, 'utf-8');
    let items = JSON.parse(fileContent);

    // 1. Lógica de Busca (Search)
    const { q } = req.query;
    if (q) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(q.toLowerCase())
      );
    }

    // 2. Lógica de Paginação (Pagination)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    // 3. Envia a resposta completa com metadados de paginação
    res.json({
      page,
      limit,
      totalPages: Math.ceil(items.length / limit),
      totalItems: items.length,
      items: paginatedItems,
    });
  } catch (err) {
    // Passa o erro para o próximo middleware de tratamento de erros do Express
    next(err);
  }
});

/**
 * ROTA DE ESTATÍSTICAS: GET /api/stats
 * - Implementa cache em memória para evitar recálculos.
 * - O cache é invalidado quando o arquivo de dados muda (ver fs.watchFile no final).
 */
router.get('/stats', async (req, res, next) => {
    // Se o cache existir, retorna ele imediatamente
    if (statsCache) {
      console.log('Serving stats from cache');
      return res.json(statsCache);
    }

    try {
        console.log('Calculating stats...');
        const fileContent = await fs.readFile(DATA_PATH, 'utf-8');
        const items = JSON.parse(fileContent);
    
        const totalItems = items.length;
        const averagePrice = items.reduce((sum, item) => sum + item.price, 0) / totalItems;
        
        const stats = {
          totalItems,
          averagePrice: parseFloat(averagePrice.toFixed(2)),
        };
    
        // Guarda o resultado no cache para as próximas requisições
        statsCache = stats;
        res.json(stats);
    } catch (err) {
        next(err);
    }
});


/**
 * ROTA PARA ITEM ÚNICO: GET /api/items/:id
 * - Leitura assíncrona.
 */
router.get('/items/:id', async (req, res, next) => {
  try {
    const fileContent = await fs.readFile(DATA_PATH, 'utf-8');
    const items = JSON.parse(fileContent);
    const item = items.find(i => i.id === parseInt(req.params.id));

    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      return next(err); // Usa return para garantir que a execução pare aqui
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

/**
 * ROTA DE CRIAÇÃO: POST /api/items
 * - Leitura e escrita assíncronas.
 */
router.post('/items', async (req, res, next) => {
  try {
    // TODO: Adicionar validação do corpo da requisição (payload)
    const newItem = req.body;
    
    const fileContent = await fs.readFile(DATA_PATH, 'utf-8');
    const items = JSON.parse(fileContent);
    
    newItem.id = Date.now(); // Simples gerador de ID
    items.push(newItem);
    
    // Escreve no arquivo de forma assíncrona
    await fs.writeFile(DATA_PATH, JSON.stringify(items, null, 2));
    
    res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
});

// Observador para limpar o cache da rota /stats se o arquivo de dados for alterado
fs.watchFile(DATA_PATH, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
        console.log('Data file changed, clearing stats cache.');
        statsCache = null;
    }
});

module.exports = router;
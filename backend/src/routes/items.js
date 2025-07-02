const express = require('express');
const fs = require('fs'); // MUDANÇA 1: Importa o módulo fs principal
const path = require('path');

const router = express.Router();
const DATA_PATH = path.join(__dirname, '..', 'data', 'items.json');

// Variável para o cache da rota /stats
let statsCache = null;

/**
 * ROTA PRINCIPAL: GET /api/items
 */
router.get('/items', async (req, res, next) => {
  try {
    // MUDANÇA 2: Usa fs.promises.readFile
    const fileContent = await fs.promises.readFile(DATA_PATH, 'utf-8');
    let items = JSON.parse(fileContent);

    // Lógica de Busca (Search)
    const { q } = req.query;
    if (q) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(q.toLowerCase())
      );
    }

    // Lógica de Paginação (Pagination)
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    res.json({
      page,
      limit,
      totalPages: Math.ceil(items.length / limit),
      totalItems: items.length,
      items: paginatedItems,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * ROTA DE ESTATÍSTICAS: GET /api/stats
 */
router.get('/stats', async (req, res, next) => {
    if (statsCache) {
      console.log('Serving stats from cache');
      return res.json(statsCache);
    }

    try {
        console.log('Calculating stats...');
        // MUDANÇA 2: Usa fs.promises.readFile
        const fileContent = await fs.promises.readFile(DATA_PATH, 'utf-8');
        const items = JSON.parse(fileContent);
    
        const totalItems = items.length;
        const averagePrice = items.reduce((sum, item) => sum + item.price, 0) / totalItems;
        
        const stats = {
          totalItems,
          averagePrice: parseFloat(averagePrice.toFixed(2)),
        };
    
        statsCache = stats;
        res.json(stats);
    } catch (err) {
        next(err);
    }
});


/**
 * ROTA PARA ITEM ÚNICO: GET /api/items/:id
 */
router.get('/items/:id', async (req, res, next) => {
  try {
    // MUDANÇA 2: Usa fs.promises.readFile
    const fileContent = await fs.promises.readFile(DATA_PATH, 'utf-8');
    const items = JSON.parse(fileContent);
    const item = items.find(i => i.id === parseInt(req.params.id));

    if (!item) {
      const err = new Error('Item not found');
      err.status = 404;
      return next(err);
    }
    res.json(item);
  } catch (err) {
    next(err);
  }
});

/**
 * ROTA DE CRIAÇÃO: POST /api/items
 */
router.post('/items', async (req, res, next) => {
  try {
    const newItem = req.body;
    
    // MUDANÇA 2: Usa fs.promises.readFile
    const fileContent = await fs.promises.readFile(DATA_PATH, 'utf-8');
    const items = JSON.parse(fileContent);
    
    newItem.id = Date.now();
    items.push(newItem);
    
    // MUDANÇA 2: Usa fs.promises.writeFile
    await fs.promises.writeFile(DATA_PATH, JSON.stringify(items, null, 2));
    
    res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
});

if (process.env.NODE_ENV !== 'test') {
  fs.watchFile(DATA_PATH, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      console.log('Data file changed, clearing stats cache.');
      statsCache = null;
    }
  });
}

module.exports = router;
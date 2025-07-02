import React, { createContext, useState, useEffect, useContext } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    fetch('/api/items?limit=10000', { signal }) // Pega todos os itens
      .then(res => res.ok ? res.json() : Promise.reject(new Error('Falha ao carregar dados')))
      .then(data => {
        setItems(data.items || []);
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error("Erro no DataContext:", err);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const value = {
    items,
    isLoading,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
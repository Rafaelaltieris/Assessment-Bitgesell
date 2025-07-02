import React from 'react';
import { Routes, Route } from 'react-router-dom';
import '../App.css'; 
import Items from './Items';
import ItemDetail from './ItemDetail';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Desafio Take-Home</h1>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Items />} />
          
          <Route path="/items/:id" element={<ItemDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
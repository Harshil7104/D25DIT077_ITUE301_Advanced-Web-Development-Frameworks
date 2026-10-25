import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppUnoptimized from './AppUnoptimized';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppUnoptimized />
    </BrowserRouter>
  </React.StrictMode>
);

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { GameProvider } from './GameContext.jsx'; // ★追加
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ▼▼▼ GameProviderで全体を囲む ▼▼▼ */}
    <GameProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GameProvider>
    {/* ▲▲▲ GameProviderで全体を囲む ▲▲▲ */}
  </React.StrictMode>,
)
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { GameProvider } from './GameContext.jsx';
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameProvider>
      {/* ↓↓↓ この行が重要です ↓↓↓ */}
      <BrowserRouter basename="/wiki-quiz">
        <App />
      </BrowserRouter>
    </GameProvider>
  </React.StrictMode>,
)
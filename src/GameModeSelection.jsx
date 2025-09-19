import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './App.css';

function GameModeSelection() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <h1>モード選択</h1>
      <div className="title-menu">
        <Link to="/prepare/normal" className="menu-button">
          ノーマル
        </Link>
        <Link to="/prepare/timeattack" className="menu-button">
          タイムアタック
        </Link>
        <Link to="/prepare/survival" className="menu-button">
          サバイバル
        </Link>
        <Link to="/prepare/practice" className="menu-button">
        練習
        </Link>
      </div>
      <button className="menu-button back-button" onClick={() => navigate('/')}>戻る</button>
    </div>
  );
}

export default GameModeSelection;
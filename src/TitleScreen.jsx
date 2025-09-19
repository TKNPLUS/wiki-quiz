import React from 'react';
import { Link } from 'react-router-dom';
import './App.css'; // スタイルは共用

function TitleScreen() {
  return (
    <div className="title-container">
      <h1>Wikipedia記事当てクイズ</h1>
      <div className="title-menu">
            <Link to="/select-mode" className="menu-button">
                ゲーム開始
            </Link>
            <Link to="/how-to-play" className="menu-button">
                遊び方
            </Link>
            <Link to="/index" className="menu-button">
                インデックス
            </Link>
             <Link to="/settings" className="menu-button">
                設定
             </Link>
        </div>
    </div>
  );
}

export default TitleScreen;
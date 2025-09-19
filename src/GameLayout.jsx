import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

function GameLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 現在のページをリロードしてゲームを最初からやり直す
  const handleRestart = () => {
    // useNavigate(0) はページ全体をリロードするため、今回は使わない
    window.location.reload();
  };

  const handleGiveUp = () => {
    // モード選択画面に戻る
    navigate('/select-mode');
  };

  return (
    <>
      <button className="menu-toggle-button" onClick={() => setIsMenuOpen(true)}>
        ☰
      </button>

      {isMenuOpen && (
        <div className="menu-overlay">
          <div className="menu-panel">
            <h2>メニュー</h2>
            <ul>
              <li><button onClick={() => setIsMenuOpen(false)}>メニューを閉じる</button></li>
              <li><button onClick={handleRestart}>最初からやり直す</button></li>
              <li><button onClick={handleGiveUp}>あきらめる（モード選択へ）</button></li>
              <li><button onClick={() => navigate('/index')}>インデックス</button></li>
              <li><button onClick={() => navigate('/')}>ホームへ戻る</button></li>
            </ul>
          </div>
        </div>
      )}
      
      {/* このOutlet部分に、各ゲームモードの画面が描画される */}
      <Outlet />
    </>
  );
}

export default GameLayout;
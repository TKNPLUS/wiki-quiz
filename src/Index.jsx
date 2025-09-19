import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArticleModal from './ArticleModal';
import './App.css';

function Index() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('wikiGameHistory') || '[]');
    setHistory(savedHistory);
  }, []);

  return (
    <div className="page-container">
      <h1>インデックス</h1>
      <p>過去に出題された記事の履歴です。（最大30件）</p>
      <div className="results-container">
        <ul className="results-list">
          {history.length > 0 ? (
            history.map((article, index) => (
              <li key={index} onClick={() => setSelectedArticle(article)}>
                {article.title}
              </li>
            ))
          ) : (
            <li>履歴はありません。</li>
          )}
        </ul>
      </div>
      <button onClick={() => navigate(-1)} className="menu-button back-button">戻る</button>

      {/* ポップアップ表示用のコンポーネント */}
      {selectedArticle && (
        <ArticleModal 
          article={selectedArticle} 
          onClose={() => setSelectedArticle(null)} 
        />
      )}
    </div>
  );
}

export default Index;
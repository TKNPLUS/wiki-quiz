import React from 'react';
import './App.css';

function ArticleModal({ article, onClose }) {
  if (!article) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{article.title}</h2>
        {article.thumbnail && (
          <div className="modal-thumbnail">
            <img src={article.thumbnail} alt={article.title} />
          </div>
        )}
        <p className="modal-extract">
          {article.extract.replace(/<[^>]+>/g, '').substring(0, 400)}...
        </p>
        <div className="modal-buttons">
          <a
            href={`https://ja.wikipedia.org/wiki/${encodeURIComponent(article.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="wiki-link-button"
          >
            Wikipediaで見る
          </a>
          <button onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  );
}

export default ArticleModal;
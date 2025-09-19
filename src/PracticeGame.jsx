import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ArticleModal from './ArticleModal';
import { normalizeText, maskText, fetchRandomArticle as fetchRandomArticleFromUtils } from './utils';
import { useGameSettings } from './GameContext'; // ★追加

function PracticeGame() {
  const { globalSettings } = useGameSettings(); // ★追加
  const [article, setArticle] = useState(null);
  const [maskedExtract, setMaskedExtract] = useState('');
  const [guess, setGuess] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [unmaskableWords, setUnmaskableWords] = useState([]);
  const [revealedWords, setRevealedWords] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [visibleChars, setVisibleChars] = useState(200);

  const fetchAndSetArticle = async () => {
    setGuess('');
    setResultMessage('記事を探しています...');
    setArticle(null);
    setIsAnswered(false);
    setVisibleChars(200);
    setUnmaskableWords([]);
    setRevealedWords([]);

    const articleData = await fetchRandomArticleFromUtils(globalSettings);
    if (articleData) {
      setArticle(articleData.article);
      setMaskedExtract(articleData.maskedText);
      setUnmaskableWords(articleData.unmaskableWords);
      setResultMessage('');
    } else {
      setResultMessage("記事の取得に失敗しました。");
    }
  };

  useEffect(() => {
    fetchAndSetArticle();
  }, []);

  const handleGuess = () => {
    if (isAnswered || !guess || !article) return;
    const isCorrect = normalizeText(guess.toLowerCase()) === normalizeText(article.title.toLowerCase()) || normalizeText(guess.toLowerCase()) === normalizeText(article.title.split('(')[0].trim().toLowerCase());
    if (isCorrect) {
      setResultMessage(`正解！答えは「${article.title}」でした！`);
      showAnswer();
    } else {
      setResultMessage('不正解…！');
    }
  };

  const handleUnmaskHint = () => {
    if (isAnswered || unmaskableWords.length === 0) return;
    const randomIndex = Math.floor(Math.random() * unmaskableWords.length);
    const wordToReveal = unmaskableWords[randomIndex];
    setRevealedWords([...revealedWords, wordToReveal]);
    setUnmaskableWords(unmaskableWords.filter((_, index) => index !== randomIndex));
  };

  const handleRevealHint = () => {
    if (isAnswered || visibleChars >= maskedExtract.length) return;
    setVisibleChars(prev => prev + 150);
  };

  const showAnswer = () => {
    if (!article) return;
    setMaskedExtract(article.extract.replace(/<[^>]+>/g, ''));
    setIsAnswered(true);
    setResultMessage(`正解は「${article.title}」でした。`);
  };
  
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleGuess(); };

  return (
    <div className="App">
      <div className="game-info">
        <Link to="/select-mode" className="back-link">モード選択へ戻る</Link>
        <span>練習モード</span>
      </div>
      <h1>Wikipedia記事当てクイズ</h1>
      {!article ? (<p>読み込み中...</p>) : (
        <div className="game-container">
          <p className="article-text">
            {maskedExtract.substring(0, visibleChars)}
            {visibleChars < maskedExtract.length && !isAnswered && '...'}
          </p>
          {revealedWords.length > 0 && (
            <div className="revealed-words-area">
              <strong>ヒント単語:</strong>
              <ul>{revealedWords.map((word, i) => <li key={i}>{word}</li>)}</ul>
            </div>
          )}
          <div className="practice-buttons">
            <button onClick={handleUnmaskHint} disabled={isAnswered || unmaskableWords.length === 0}>伏せ字削減</button>
            <button onClick={handleRevealHint} disabled={isAnswered || visibleChars >= maskedExtract.length}>ヒント</button>
            <button onClick={fetchAndSetArticle} disabled={isAnswered}>リロール</button>
            <button onClick={showAnswer} disabled={isAnswered}>答えを見る</button>
          </div>
          <div className="guess-area">
            <input type="text" value={guess} onChange={(e) => setGuess(e.target.value)} onKeyPress={handleKeyPress} placeholder="答えを入力" disabled={isAnswered}/>
            <button onClick={handleGuess} disabled={isAnswered}>回答</button>
          </div>
          <p className="result-message">{resultMessage}</p>
          {isAnswered && (
            <div className="practice-after-answer">
              <button className="next-button" onClick={fetchAndSetArticle}>次の問題へ</button>
              <button className="menu-button" onClick={() => setSelectedArticle(article)}>記事詳細</button>
            </div>
          )}
        </div>
      )}
      {selectedArticle && <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />}
    </div>
  );
}

export default PracticeGame;
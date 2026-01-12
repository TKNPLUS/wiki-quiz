import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ArticleModal from './ArticleModal';
import { normalizeText, fetchRandomArticle as fetchRandomArticleFromUtils } from './utils';
import { calculateDifficulty } from './calculateDifficulty';
import { useGameSettings } from './GameContext'; // ★追加

function PracticeGame() {
  const { globalSettings, modeSettings } = useGameSettings(); // ★修正: modeSettingsを追加
  const [article, setArticle] = useState(null);
  const [maskedExtract, setMaskedExtract] = useState('');
  const [guess, setGuess] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [unmaskableWords, setUnmaskableWords] = useState([]);
  const [revealedWords, setRevealedWords] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [visibleChars, setVisibleChars] = useState(200);
  // ▼▼▼ この一行を追加 ▼▼▼
  const [difficulty, setDifficulty] = useState(0);

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
      setDifficulty(calculateDifficulty(articleData.article.pageviews)); // ★難易度を計算
      setResultMessage('');
      // 取得した記事情報をコンソールに出力
      console.log(
        `--- 新しい問題 ---\n` +
        `タイトル: ${articleData.article.title}\n` +
        `閲覧数: ${articleData.article.pageviews ?? '不明'}\n` +
        `カテゴリ: ${(articleData.article.categories ? articleData.article.categories.join(', ') : '不明')}`
      );
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
        <span>難易度: {difficulty.toFixed(1)}</span>
      </div>
      <h1>Wikipedia記事当てクイズ</h1>
      {!article ? (<p>読み込み中...</p>) : (
        <div className="game-container">
          {modeSettings.isReverse ? (
            // 逆問題モード: サムネイルを表示
            <div className="reverse-mode">
              {article.thumbnail ? (
                <img src={article.thumbnail} alt="記事のサムネイル" className="article-thumbnail" />
              ) : (
                <p className="no-thumbnail">この記事にはサムネイルがありません</p>
              )}
            </div>
          ) : (
            // 通常モード: テキストを表示
            <p className="article-text">
              {maskedExtract.substring(0, visibleChars)}
              {visibleChars < maskedExtract.length && !isAnswered && '...'}
            </p>
          )}
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
            <>
              {article.thumbnail && (
                <div className="answer-thumbnail">
                  <img src={article.thumbnail} alt={article.title} />
                  <p className="thumbnail-caption">正解: {article.title}</p>
                </div>
              )}
              <div className="practice-after-answer">
                <button className="next-button" onClick={fetchAndSetArticle}>次の問題へ</button>
                <button className="menu-button" onClick={() => setSelectedArticle(article)}>記事詳細</button>
              </div>
            </>
          )}
        </div>
      )}
      {selectedArticle && <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />}
    </div>
  );
}

export default PracticeGame;
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameSettings } from './GameContext';
import { normalizeText, maskText } from './utils';
import ArticleModal from './ArticleModal';

function SurvivalGame() {
  const { settings } = useGameSettings();
  const navigate = useNavigate();
  const [animationClass, setAnimationClass] = useState(''); // ★アニメーションクラス

  // Game State
  const [article, setArticle] = useState(null);
  const [maskedExtract, setMaskedExtract] = useState('');
  const [guess, setGuess] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [currentQuestionScore, setCurrentQuestionScore] = useState(settings.baseScore);
  const [isGameActive, setIsGameActive] = useState(true);
  const [questionsCleared, setQuestionsCleared] = useState(0);

  // Survival State
  const [timeLeft, setTimeLeft] = useState(settings.maxTime);
  const timerRef = useRef(null);

  // Hint and Reroll State
  const [rerolls, setRerolls] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [unmaskableWords, setUnmaskableWords] = useState([]);
  const [revealedWords, setRevealedWords] = useState([]);
  const [visibleChars, setVisibleChars] = useState(200);

  // History and Modal
  const [history, setHistory] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // --- Main Timer ---
  useEffect(() => {
    if (isGameActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsGameActive(false); // Game Over
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isGameActive]);

  // --- Article Fetching ---
  const fetchRandomArticle = async (newScore = settings.baseScore) => {
    setGuess('');
    setResultMessage('');
    setArticle(null);
    setIsAnswered(false);
    setCurrentQuestionScore(newScore);
    setRerolls(0);
    setHintUsed(false);
    setUnmaskableWords([]);
    setRevealedWords([]);
    setVisibleChars(200);
    
    const url = "https://ja.wikipedia.org/w/api.php";
    const commonParams = "&format=json&origin=*";
    try {
      const randomParams = `?action=query&list=random&rnnamespace=0&rnlimit=1${commonParams}`;
      const randomResponse = await fetch(url + randomParams);
      const randomData = await randomResponse.json();
      const randomTitle = randomData.query.random[0].title;
      const extractParams = `?action=query&prop=extracts&titles=${encodeURIComponent(randomTitle)}${commonParams}`;
      const extractResponse = await fetch(url + extractParams);
      const extractData = await extractResponse.json();
      const page = Object.values(extractData.query.pages)[0];
      setArticle({ title: page.title, extract: page.extract });
      const { maskedText, unmaskableWords } = maskText(page.extract, page.title);
      setMaskedExtract(maskedText);
      setUnmaskableWords(unmaskableWords);
      setHistory(prevHistory => [...prevHistory, { title: page.title, extract: page.extract }]);
    } catch (error) {
      console.error("APIリクエスト中にエラー:", error);
      setResultMessage("記事の取得に失敗しました。");
    }
  };

  useEffect(() => { fetchRandomArticle(); }, []);

  // --- Game Logic ---
  const applyCost = (cost) => {
    const newScore = currentQuestionScore - cost;
    setCurrentQuestionScore(newScore);

    if (newScore < 0) {
      setIsAnswered(true); // 操作をロック
      setResultMessage(`ライフ切れ！正解は「${article.title}」。${Math.abs(newScore)}秒のペナルティ！`);
      setTimeLeft(prev => Math.max(0, prev + newScore));
      setTimeout(() => fetchRandomArticle(), 1500); // 1.5秒後に次の問題へ
    }
  };

  const handleGuess = () => {
    if (isAnswered || !guess || !article) return;
    const isCorrect = normalizeText(guess.toLowerCase()) === normalizeText(article.title.toLowerCase()) || normalizeText(guess.toLowerCase()) === normalizeText(article.title.split('(')[0].trim().toLowerCase());

    if (isCorrect) {
      setAnimationClass('correct-answer'); // ★正解クラス
      let bonusScore = 0;
      if (!hintUsed) bonusScore += settings.noHintBonus;
      if (rerolls === 0) bonusScore += settings.noRerollBonus;
      const timeToAdd = Math.max(0, currentQuestionScore) + bonusScore;
      setTimeLeft(prev => Math.min(settings.timeCap, prev + timeToAdd));
      setQuestionsCleared(prev => prev + 1);
      setResultMessage(`正解！「${article.title}」 ${timeToAdd}秒獲得！`);
      setIsAnswered(true);
      setTimeout(fetchRandomArticle, 800);
    } else {
      setAnimationClass('incorrect-answer'); // ★不正解クラス
      setResultMessage(`不正解... -${settings.incorrectCost}ライフ`);
      applyCost(settings.incorrectCost);
    }
    setTimeout(() => setAnimationClass(''), 500); // ★0.5秒後リセット
  };
  
  const handleRevealHint = () => {
    if (isAnswered) return;
    setHintUsed(true);
    setVisibleChars(prev => prev + 150);
    applyCost(settings.hintCost);
  };
  
  const handleUnmaskHint = () => {
    if (isAnswered || unmaskableWords.length === 0) return;
    setHintUsed(true);
    const randomIndex = Math.floor(Math.random() * unmaskableWords.length);
    const wordToReveal = unmaskableWords[randomIndex];
    setRevealedWords([...revealedWords, wordToReveal]);
    setUnmaskableWords(unmaskableWords.filter((_, index) => index !== randomIndex));
    applyCost(settings.unmaskHintCost);
  };

  const handleReroll = () => {
    const cost = settings.rerollCostBase * (rerolls + 1);
    const remainingScore = currentQuestionScore - cost;
    setRerolls(rerolls + 1);
    fetchRandomArticle(remainingScore); // ★修正：残ったライフを引き継いでリロール
    applyCost(cost);
  };
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleGuess(); };

  // --- UI Rendering ---
  if (!isGameActive) {
    return (
      <div className="App">
        <h1>ゲームオーバー！</h1>
        <h2>最終スコア: {questionsCleared}問正解</h2>
        <div className="results-container">
            <h3>出題された記事一覧</h3>
            <ul className="results-list">
              {history.map((article, index) => (
                <li key={index} onClick={() => setSelectedArticle(article)}>
                  {article.title}
                </li>
              ))}
            </ul>
        </div>
        <div className="results-buttons">
          <button className="menu-button" onClick={startNewGame}>もう一度プレイする</button>
          <button className="menu-button back-button" onClick={() => navigate('/')}>ホームへ戻る</button>
        </div>
        {selectedArticle && <ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />}
      </div>
    );
    }
    
  return (
    <div className="App">
      <div className="game-info">
        <span>ライフ: {Math.max(0, currentQuestionScore)}</span>
        <span className="timer">残り時間: {timeLeft}秒</span>
        <span>正解数: {questionsCleared}</span>
      </div>
      <h1>サバイバルモード</h1>
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
          <div className="button-area">
            <button className="reroll-button" onClick={handleReroll} disabled={isAnswered}>
              リロール (-{settings.rerollCostBase * (rerolls + 1)}点)
            </button>
            <button className="hint-unmask-button" onClick={handleUnmaskHint} disabled={isAnswered || unmaskableWords.length === 0}>
              伏せ字削減 (-{settings.unmaskHintCost}点)
            </button>
            <button className="hint-button" onClick={handleRevealHint} disabled={isAnswered || visibleChars >= maskedExtract.length}>
              ヒント (-{settings.hintCost}点)
            </button>
          </div>
          <div className="guess-area">
            <input type="text" value={guess} onChange={(e) => setGuess(e.target.value)} onKeyPress={handleKeyPress} placeholder="答えを入力" disabled={isAnswered} />
            <button onClick={handleGuess} disabled={isAnswered}>回答</button>
          </div>
          <p className="result-message">{resultMessage}</p>
        </div>
      )}
    </div>
  );
}

export default SurvivalGame;
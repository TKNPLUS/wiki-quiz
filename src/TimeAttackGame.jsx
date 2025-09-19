import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameSettings } from './GameContext';
import { normalizeText, maskText } from './utils';
import ArticleModal from './ArticleModal';

function TimeAttackGame() {
  const { settings } = useGameSettings();
  const navigate = useNavigate();
  const [animationClass, setAnimationClass] = useState('');

  // Game State
  const [article, setArticle] = useState(null);
  const [maskedExtract, setMaskedExtract] = useState('');
  const [guess, setGuess] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [currentQuestionScore, setCurrentQuestionScore] = useState(settings.baseScore);
  const [isGameActive, setIsGameActive] = useState(true);
  const [correctAnswers, setCorrectAnswers] = useState(0); // ★「問題番号」から「正解数」に変更

  // Time Attack State
  const [totalTime, setTotalTime] = useState(0);
  const [isFrozen, setIsFrozen] = useState(false);
  const timerRef = useRef(null);

  // Hint and Reroll State
  const [rerolls, setRerolls] = useState(0);
  const [unmaskableWords, setUnmaskableWords] = useState([]);
  const [revealedWords, setRevealedWords] = useState([]);

  // History and Modal
  const [history, setHistory] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);

  // --- Total Time Stopwatch ---
  useEffect(() => {
    if (isGameActive && !isFrozen) {
      timerRef.current = setInterval(() => {
        setTotalTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isGameActive, isFrozen]);

  // --- Article Fetching ---
  const fetchRandomArticle = async (newScore = settings.baseScore) => { // ★修正：スコアを引き継げるように
    setGuess('');
    setResultMessage('');
    setArticle(null);
    setIsAnswered(false);
    setCurrentQuestionScore(newScore); // ★修正：引数で受け取ったスコアを設定
    setUnmaskableWords([]);
    setRevealedWords([]);
    
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

  useEffect(() => { 
    fetchRandomArticle(); 
  }, []);

  // --- Game Logic ---
  const triggerPenalty = () => {
    // `setResultMessage('ライフが0になりました！ 5秒間のペナルティ...');` の行を以下に置き換え
    setResultMessage(`ライフが0に！正解は「${article.title}」でした。5秒間のペナルティ...`);
    setIsFrozen(true);
    setIsAnswered(true);
    setTimeout(() => {
      setIsFrozen(false);
      setRerolls(0); // 次の問題に行くのでリロール回数をリセット
      fetchRandomArticle(); // 新しい問題を取得
    }, 5000);
  };

  const applyCost = (cost) => {
    const newScore = Math.max(0, currentQuestionScore - cost);
    setCurrentQuestionScore(newScore);
    if (newScore === 0) {
      triggerPenalty();
      return false; // コストを支払った結果0になった
    }
    return true; // コストを支払えた
  };

  const handleGuess = () => {
    if (isAnswered || isFrozen || !guess || !article) return;
    const isCorrect = normalizeText(guess.toLowerCase()) === normalizeText(article.title.toLowerCase()) || normalizeText(guess.toLowerCase()) === normalizeText(article.title.split('(')[0].trim().toLowerCase());

    if (isCorrect) {
      setAnimationClass('correct-answer');
      const newCorrectCount = correctAnswers + 1;
      setCorrectAnswers(newCorrectCount);
      setResultMessage(`正解！答えは「${article.title}」でした。`);
      setIsAnswered(true);

      if (newCorrectCount >= settings.questionCount) {
        setIsGameActive(false); // ★5問正解でゲーム終了
      } else {
        setTimeout(() => {
          setRerolls(0); // 次の問題に行くのでリロール回数をリセット
          fetchRandomArticle();
        }, 800);
      }
    } else {
      setAnimationClass('incorrect-answer');
      setResultMessage(`不正解...`);
      applyCost(settings.incorrectCost);
    }
    setTimeout(() => setAnimationClass(''), 500);
  };
  
  const handleUnmaskHint = () => {
    if (isAnswered || isFrozen || unmaskableWords.length === 0) return;
    applyCost(settings.unmaskHintCost);
  };

  const handleReroll = () => {
    if (isAnswered || isFrozen) return;
    const cost = settings.rerollCostBase * (rerolls + 1);
    if (currentQuestionScore > cost) { // ★修正：コストを支払えるかチェック
        const remainingScore = currentQuestionScore - cost;
        setRerolls(rerolls + 1);
        fetchRandomArticle(remainingScore); // ★修正：残ったライフを引き継いでリロール
    } else {
        setResultMessage("ライフが足りず、リロールできません！");
    }
  };
  
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleGuess(); };

  // --- UI Rendering ---
  if (!isGameActive) {
    return (
      <div className="App">
        <h1>タイムアタック終了！</h1>
        <h2>クリアタイム: {Math.floor(totalTime / 60)}分 {totalTime % 60}秒</h2>
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
      {isFrozen && <div className="frozen-overlay">ペナルティ</div>}
      <div className="game-info">
        <span>ライフ: {currentQuestionScore}</span>
        <span className="timer">経過時間: {totalTime}秒</span>
        {/* ★修正：「問題番号」から「正解数」表示に */}
        <span>正解数: {correctAnswers} / {settings.questionCount}</span>
      </div>
      <h1>タイムアタックモード</h1>
      {!article ? (<p>読み込み中...</p>) : (
        <div className={`game-container ${animationClass}`}>
          <p className="article-text">{maskedExtract}</p>
          {revealedWords.length > 0 && (
            <div className="revealed-words-area">
              <strong>ヒント単語:</strong>
              <ul>{revealedWords.map((word, i) => <li key={i}>{word}</li>)}</ul>
            </div>
          )}
          <div className="button-area">
            <button className="reroll-button" onClick={handleReroll} disabled={isAnswered || isFrozen}>
              リロール (-{settings.rerollCostBase * (rerolls + 1)}点)
            </button>
            <button className="hint-unmask-button" onClick={handleUnmaskHint} disabled={isAnswered || isFrozen || unmaskableWords.length === 0}>
              伏せ字削減 (-{settings.unmaskHintCost}点)
            </button>
          </div>
          <div className="guess-area">
            <input type="text" value={guess} onChange={(e) => setGuess(e.target.value)} onKeyPress={handleKeyPress} placeholder="答えを入力" disabled={isAnswered || isFrozen} />
            <button onClick={handleGuess} disabled={isAnswered || isFrozen}>回答</button>
          </div>
          <p className="result-message">{resultMessage}</p>
        </div>
      )}
    </div>
  );
}

export default TimeAttackGame;
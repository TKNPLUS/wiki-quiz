import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameSettings } from './GameContext';
import { normalizeText, maskText, fetchRandomArticle as fetchRandomArticleFromUtils } from './utils';
import { calculateDifficulty } from './calculateDifficulty';
import ArticleModal from './ArticleModal';

function SurvivalGame() {
  const { modeSettings, globalSettings } = useGameSettings();
  const navigate = useNavigate();
  const [animationClass, setAnimationClass] = useState(''); // ★アニメーションクラス

  // Game State
  const [article, setArticle] = useState(null);
  const [maskedExtract, setMaskedExtract] = useState('');
  const [guess, setGuess] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [currentQuestionScore, setCurrentQuestionScore] = useState(modeSettings.baseScore);
  const [isGameActive, setIsGameActive] = useState(true);
  const [questionsCleared, setQuestionsCleared] = useState(0);

  // Survival State
  const [timeLeft, setTimeLeft] = useState(modeSettings.maxTime);
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
  // ▼▼▼ この一行を追加 ▼▼▼
  const [difficulty, setDifficulty] = useState(0);

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
// ▼▼▼ 新しい fetchAndSetArticle 関数を追加 ▼▼▼
const fetchAndSetArticle = async (newScore = modeSettings.baseScore, newMaxTime = modeSettings.maxTime) => {
  setGuess('');
  setResultMessage('記事を探しています...');
  setArticle(null);
  setIsAnswered(false);
  setCurrentQuestionScore(newScore);
  if (typeof setMaxTime === 'function') setMaxTime(newMaxTime);
  if (typeof setTimeLeft === 'function') setTimeLeft(newMaxTime);
  if (typeof setVisibleChars === 'function') setVisibleChars(200);
  setHintUsed(false);
  setUnmaskableWords([]);
  setRevealedWords([]);

  const articleData = await fetchRandomArticleFromUtils(globalSettings);
  if (articleData) {
    setArticle(articleData.article);
    setMaskedExtract(articleData.maskedText);
    setUnmaskableWords(articleData.unmaskableWords);
    setHistory(prevHistory => [...prevHistory, articleData.article]);
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
    setResultMessage("記事の取得に失敗しました。リロードしてみてください。");
  }
};
// ▲▲▲ ここまで置き換え ▲▲▲

  useEffect(() => { fetchAndSetArticle(); }, []);

  // --- Game Logic ---
  const applyCost = (cost) => {
    const newScore = currentQuestionScore - cost;
    setCurrentQuestionScore(newScore);

    if (newScore < 0) {
      setIsAnswered(true); // 操作をロック
      setResultMessage(`ライフ切れ！正解は「${article.title}」。${Math.abs(newScore)}秒のペナルティ！`);
      setTimeLeft(prev => Math.max(0, prev + newScore));
  setTimeout(() => fetchAndSetArticle(), 1500); // 1.5秒後に次の問題へ
    }
  };

  const handleGuess = () => {
    if (isAnswered || !guess || !article) return;
    const isCorrect = normalizeText(guess.toLowerCase()) === normalizeText(article.title.toLowerCase()) || normalizeText(guess.toLowerCase()) === normalizeText(article.title.split('(')[0].trim().toLowerCase());

    if (isCorrect) {
      const timeBonus = Math.max(0, Math.floor(timeLeft / 3));
      let bonusScore = 0;
      const bonusMessages = [];

      if (!hintUsed) {
        bonusScore += modeSettings.noHintBonus;
        bonusMessages.push(`ノーヒント ${modeSettings.noHintBonus}点`);
      }
      if (rerolls === 0) {
        bonusScore += modeSettings.noRerollBonus;
        bonusMessages.push(`ノーリロール ${modeSettings.noRerollBonus}点`);
      }

      const newConsecutiveWins = questionsCleared + 1;
      // SurvivalGameでは連続正解ボーナスをquestionsClearedで代用
      if (newConsecutiveWins > 1) {
        const comboBonus = newConsecutiveWins * modeSettings.comboBonusMultiplier;
        bonusScore += comboBonus;
        bonusMessages.push(`連続正解 ${comboBonus}点`);
      }

      const totalPoints = currentQuestionScore + timeBonus + bonusScore;
      setTimeLeft(prev => Math.min(modeSettings.timeCap, prev + totalPoints));
      setQuestionsCleared(newConsecutiveWins);
      let resultMsg = `正解！ ${currentQuestionScore}点 + タイムボーナス ${timeBonus}点`;
      if (bonusMessages.length > 0) {
        resultMsg += ` + ${bonusMessages.join(' + ')}`;
      }
      resultMsg += ` 獲得！`;
      setResultMessage(resultMsg);
      setIsAnswered(true);
      setTimeout(fetchAndSetArticle, 800);
    } else {
      setAnimationClass('incorrect-answer'); // ★不正解クラス
      setResultMessage(`不正解... -${modeSettings.incorrectCost}ライフ`);
      applyCost(modeSettings.incorrectCost);
    }
    setTimeout(() => setAnimationClass(''), 500); // ★0.5秒後リセット
  };
  
  const handleRevealHint = () => {
    if (isAnswered) return;
    setHintUsed(true);
    setVisibleChars(prev => prev + 150);
    applyCost(modeSettings.hintCost);
  };
  
  const handleUnmaskHint = () => {
    if (isAnswered || unmaskableWords.length === 0) return;
    setHintUsed(true);
    const randomIndex = Math.floor(Math.random() * unmaskableWords.length);
    const wordToReveal = unmaskableWords[randomIndex];
    setRevealedWords([...revealedWords, wordToReveal]);
    setUnmaskableWords(unmaskableWords.filter((_, index) => index !== randomIndex));
    applyCost(modeSettings.unmaskHintCost);
  };

  const handleReroll = () => {
    const cost = modeSettings.rerollCostBase * (rerolls + 1);
    const remainingScore = currentQuestionScore - cost;
    setRerolls(rerolls + 1);
  fetchAndSetArticle(remainingScore); // ★修正：残ったライフを引き継いでリロール
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
        <span>難易度: {difficulty.toFixed(1)}</span>
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
              リロール (-{modeSettings.rerollCostBase * (rerolls + 1)}点)
            </button>
            <button className="hint-unmask-button" onClick={handleUnmaskHint} disabled={isAnswered || unmaskableWords.length === 0}>
              伏せ字削減 (-{modeSettings.unmaskHintCost}点)
            </button>
            <button className="hint-button" onClick={handleRevealHint} disabled={isAnswered || visibleChars >= maskedExtract.length}>
              ヒント (-{modeSettings.hintCost}点)
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
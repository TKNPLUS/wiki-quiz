import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArticleModal from './ArticleModal';
import './App.css';
import { useGameSettings } from './GameContext.jsx';
import { normalizeText, maskText, fetchRandomArticle as fetchRandomArticleFromUtils } from './utils';
// 定数（ゲームバランスの調整用）
const INITIAL_CHARS = 200;
const HINT_CHARS = 150;
// ゲームバランス用定数（Contextで管理しないもののみ）
// HINT_COST, INCORRECT_COST, REROLL_COST_BASE, NO_HINT_BONUS, NO_REROLL_BONUS, COMBO_BONUS_MULTIPLIER, UNMASK_HINT_COST は modeSettings から参照

function NormalGame() {
  const { modeSettings, globalSettings } = useGameSettings();
  const [animationClass, setAnimationClass] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [maskedExtract, setMaskedExtract] = useState('');
  const [guess, setGuess] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [score, setScore] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [currentQuestionScore, setCurrentQuestionScore] = useState(modeSettings.baseScore);
  const [isGameActive, setIsGameActive] = useState(true);
  const [isAnswered, setIsAnswered] = useState(false);
  const [visibleChars, setVisibleChars] = useState(INITIAL_CHARS);
  const [timeLeft, setTimeLeft] = useState(modeSettings.maxTime);
  const [maxTime, setMaxTime] = useState(modeSettings.maxTime);
  const [hintUsed, setHintUsed] = useState(false);
  const [rerolls, setRerolls] = useState(0);
  const [consecutiveWins, setConsecutiveWins] = useState(0);
  const [unmaskableWords, setUnmaskableWords] = useState([]);
  const [revealedWords, setRevealedWords] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
  // ゲームが終了した瞬間に履歴をlocalStorageに保存
  if (!isGameActive) {
    const savedHistory = JSON.parse(localStorage.getItem('wikiGameHistory') || '[]');
    // 新しい履歴と古い履歴を合わせて、最新30件だけ残す
    const newHistory = [...history, ...savedHistory];
    const uniqueHistory = Array.from(new Set(newHistory.map(a => a.title)))
      .map(title => newHistory.find(a => a.title === title));
    localStorage.setItem('wikiGameHistory', JSON.stringify(uniqueHistory.slice(0, 30)));
  }
}, [isGameActive, history]);
    

  useEffect(() => {
    if (!isGameActive || isAnswered || !article) { return; }
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 1;
        if (newTime < 0 && (newTime % 30 === 0)) {
          const newCurrentScore = Math.max(0, currentQuestionScore - 10);
          setCurrentQuestionScore(newCurrentScore);
          if (newCurrentScore === 0) {
            setResultMessage(`基礎スコアが0になりました。正解は「${article.title}」でした。`);
            setMaskedExtract(article.extract.replace(/<[^>]+>/g, ''));
            setIsAnswered(true);
          }
        }
        return newTime;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameActive, isAnswered, article, currentQuestionScore]);

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
    setResultMessage('');

    // ▼▼▼ ここから追加 ▼▼▼
    // 取得した記事情報をコンソールに出力
    console.log(
      `--- 新しい問題 ---\n` +
      `タイトル: ${articleData.article.title}\n` +
      `閲覧数: ${articleData.article.pageviews ?? '不明'}\n` +
      `カテゴリ: ${(articleData.article.categories ? articleData.article.categories.join(', ') : '不明')}`
    );
    // ▲▲▲ ここまで追加 ▲▲▲
  } else {
    setResultMessage("記事の取得に失敗しました。リロードしてみてください。");
  }
};
// ▲▲▲ ここまで置き換え ▲▲▲

  useEffect(() => { startNewGame(); }, []);

  const startNewGame = () => {
    setScore(0);
    setQuestionNumber(1);
    setConsecutiveWins(0);
    setRerolls(0);
    setHistory([]);
    setIsGameActive(true);
  fetchAndSetArticle(modeSettings.baseScore, modeSettings.maxTime);
  };

  const handleGuess = () => {
    if (isAnswered || !guess || !article) return;
    const normalizedGuess = normalizeText(guess.toLowerCase());
    const normalizedTitle = normalizeText(article.title.toLowerCase());
    const mainTitle = article.title.split('(')[0].trim();
    const normalizedMainTitle = normalizeText(mainTitle.toLowerCase());
    const isCorrect = (normalizedGuess === normalizedTitle || normalizedGuess === normalizedMainTitle);
    if (isCorrect) {
      const timeBonus = Math.max(0, Math.floor(timeLeft / 3));
      let bonusScore = 0;
      const bonusMessages = [];

      // ★修正: 古い定数名から modeSettings を使うように変更
      if (!hintUsed) {
        bonusScore += modeSettings.noHintBonus;
        bonusMessages.push(`ノーヒント ${modeSettings.noHintBonus}点`);
      }
      if (rerolls === 0) {
        bonusScore += modeSettings.noRerollBonus;
        bonusMessages.push(`ノーリロール ${modeSettings.noRerollBonus}点`);
      }

      const newConsecutiveWins = consecutiveWins + 1;
      setConsecutiveWins(newConsecutiveWins);

      // ★修正: 古い定数名から modeSettings を使うように変更
      if (newConsecutiveWins > 1) {
        const comboBonus = newConsecutiveWins * modeSettings.comboBonusMultiplier;
        bonusScore += comboBonus;
        bonusMessages.push(`連続正解 ${comboBonus}点`);
      }

      const totalPoints = currentQuestionScore + timeBonus + bonusScore;
      setScore(score + totalPoints);

      let resultMsg = `正解！ ${currentQuestionScore}点 + タイムボーナス ${timeBonus}点`;
      if (bonusMessages.length > 0) {
        resultMsg += ` + ${bonusMessages.join(' + ')}`;
      }
      resultMsg += " 獲得！";
      
      setResultMessage(resultMsg);
      setMaskedExtract(article.extract.replace(/<[^>]+>/g, ''));
      setIsAnswered(true);
    } else {
      // --- 不正解の処理 ---
      setAnimationClass('incorrect-answer'); // ★不正解クラスをセット
      setConsecutiveWins(0);
      const newCurrentScore = Math.max(0, currentQuestionScore - modeSettings.incorrectCost);
      setCurrentQuestionScore(newCurrentScore);
      if (newCurrentScore === 0) {
        setResultMessage(`基礎スコアが0になりました。正解は「${article.title}」でした。`);
        setMaskedExtract(article.extract.replace(/<[^>]+>/g, ''));
        setIsAnswered(true);
      } else {
  setResultMessage(`不正解！ -${modeSettings.incorrectCost}点 (残り${newCurrentScore}点)`);
      }
    }
    // ★アニメーション終了後にクラス名をリセットする
    setTimeout(() => setAnimationClass(''), 500);
  };

  const handleHint = () => {
    setHintUsed(true);
    if (isAnswered || visibleChars >= maskedExtract.length) return;
  const newCurrentScore = Math.max(0, currentQuestionScore - modeSettings.hintCost);
    setCurrentQuestionScore(newCurrentScore);
    setVisibleChars(visibleChars + HINT_CHARS);
    if (newCurrentScore === 0) {
      setResultMessage(`基礎スコアが0になりました。正解は「${article.title}」でした。`);
      setMaskedExtract(article.extract.replace(/<[^>]+>/g, ''));
      setIsAnswered(true);
    }
  };
  
  const handleUnmaskHint = () => {
    if (isAnswered || unmaskableWords.length === 0) return;
  const cost = modeSettings.unmaskHintCost;
    if (currentQuestionScore > cost) {
      setHintUsed(true);
      setCurrentQuestionScore(currentQuestionScore - cost);
      const randomIndex = Math.floor(Math.random() * unmaskableWords.length);
      const wordToReveal = unmaskableWords[randomIndex];
      setRevealedWords([...revealedWords, wordToReveal]);
      const newUnmaskableWords = unmaskableWords.filter((_, index) => index !== randomIndex);
      setUnmaskableWords(newUnmaskableWords);
    } else {
      setResultMessage("スコアが足りません！");
    }
  };

  const handleReroll = () => {
    if (isAnswered) return;
  const cost = modeSettings.rerollCostBase * (rerolls + 1);
    if (currentQuestionScore > cost) {
      const remainingScore = currentQuestionScore - cost;
      const newMaxTime = Math.max(20, maxTime - 20);
      setRerolls(rerolls + 1);
  fetchAndSetArticle(remainingScore, newMaxTime);
    } else {
      setResultMessage("この問題のスコアが足りず、リロールできません！");
    }
  };

  const handleNextQuestion = () => {
  if (questionNumber >= modeSettings.questionCount) {
      setIsGameActive(false);
    } else {
      setQuestionNumber(questionNumber + 1);
  setRerolls(0);
  fetchAndSetArticle(modeSettings.baseScore, modeSettings.maxTime);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') { handleGuess(); }
  };
  const handleGiveUp = () => {
    setIsMenuOpen(false);
    setIsGameActive(false);
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
            <li><button onClick={startNewGame}>最初からやり直す</button></li>
            <li><button onClick={handleGiveUp}>あきらめる</button></li>
            <li><button onClick={() => navigate('/index')}>インデックス</button></li>
             <li><button onClick={() => navigate('/')}>ホームへ戻る</button></li>
          </ul>
        </div>
      </div>
    )}
    <div className="App">
      {/* isGameActive の状態に応じてゲーム画面かリザルト画面を切り替える */}
      {isGameActive ? (
        // ゲーム画面
        <>
          <div className="game-info">
            <span>スコア: {score}</span>
            <span className="combo-display">{consecutiveWins > 1 && `${consecutiveWins}連続正解中！`}</span>
            <span className="timer">
              {timeLeft >= 0
                ? `残り時間: ${timeLeft}秒`
                : `次のペナルティまで: ${30 - (Math.abs(timeLeft) % 30)}秒`
              }
            </span>
            <span>第 {questionNumber} / {modeSettings.questionCount} 問</span>
          </div>
          <h1>Wikipedia記事当てクイズ</h1>
          {!article ? (<p>読み込み中...</p>) : (
            <div className={`game-container ${animationClass}`}>
              <h2>問題 (この問題の得点: {currentQuestionScore}点)</h2>
              <p className="article-text">
                {maskedExtract.substring(0, visibleChars)}
                {visibleChars < maskedExtract.length && !isAnswered && '...'}
              </p>
              {revealedWords.length > 0 && (
                <div className="revealed-words-area">
                  <strong>ヒント単語:</strong>
                  <ul>
                    {revealedWords.map((word, index) => <li key={index}>{word}</li>)}
                  </ul>
                </div>
              )}
              <div className="button-area">
                <button
                  className="reroll-button"
                  onClick={handleReroll}
                  disabled={isAnswered}
                >
                  リロール (-{modeSettings.rerollCostBase * (rerolls + 1)}点)
                </button>
                <button
                  className="hint-unmask-button"
                  onClick={handleUnmaskHint}
                  disabled={isAnswered || unmaskableWords.length === 0}
                >
                  伏せ字削減 (-{modeSettings.unmaskHintCost}点)
                </button>
                <button
                  className="hint-button"
                  onClick={handleHint}
                  disabled={isAnswered || visibleChars >= maskedExtract.length}
                >
                  ヒント (-{modeSettings.hintCost}点)
                </button>
              </div>
              <div className="guess-area">
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="答えを入力"
                  disabled={isAnswered}
                />
                <button onClick={handleGuess} disabled={isAnswered}>回答</button>
              </div>
              <p className="result-message">{resultMessage}</p>
              {isAnswered && (
                <button className="next-button" onClick={handleNextQuestion}>
                  {questionNumber >= 5 ? '結果を見る' : '次の問題へ'}
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        // リザルト画面
        <>
          <h1>ゲーム終了！</h1>
          <h2>最終スコア: {score}点</h2>
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
        </>
      )}

      {/* ★修正点：モーダルをここに移動し、常に描画ツリーに含める */}
      {selectedArticle && (
  <ArticleModal 
    article={selectedArticle} 
    onClose={() => setSelectedArticle(null)} 
  />
)}
    </div>
    </>
  );
}

export default NormalGame;
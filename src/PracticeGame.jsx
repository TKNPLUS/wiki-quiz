import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ArticleModal from './ArticleModal';
import { normalizeText, maskText } from './utils'; // 後ほど作成する共通ファイルからインポート

function PracticeGame() {
  const { modeSettings, globalSettings } = useGameSettings();
  const [article, setArticle] = useState(null);
  const [maskedExtract, setMaskedExtract] = useState('');
  const [guess, setGuess] = useState('');
  const [resultMessage, setResultMessage] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [unmaskableWords, setUnmaskableWords] = useState([]);
  const [revealedWords, setRevealedWords] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [visibleChars, setVisibleChars] = useState(200);

 // ▼▼▼ 既存の fetchRandomArticle 関数をこれに置き換える ▼▼▼
const fetchRandomArticle = async (newScore = modeSettings.baseScore, newMaxTime = modeSettings.maxTime) => {
  setGuess('');
  setResultMessage('条件に合う記事を探しています...'); // メッセージを分かりやすく変更
  setArticle(null);
  setIsAnswered(false);
  setCurrentQuestionScore(newScore);
  
  // 各モードに存在するStateのみ更新を試みる
  if (typeof setMaxTime === 'function') setMaxTime(newMaxTime);
  if (typeof setTimeLeft === 'function') setTimeLeft(newMaxTime);
  if (typeof setVisibleChars === 'function') setVisibleChars(200);

  setHintUsed(false);
  setUnmaskableWords([]);
  setRevealedWords([]);
  
  const url = "https://ja.wikipedia.org/w/api.php";
  const commonParams = "&format=json&origin=*";
  const MAX_ATTEMPTS = 10;

  const properNounKeywords = ["人名", "俳優", "タレント", "ミュージシャン", "モデル", "声優", "アナウンサー", "スポーツ選手", "政治家", "歴史上の人物", "架空の人物", "地理", "都市", "国", "駅", "企業", "大学", "シングル", "アルバム", "テレビドラマ", "映画作品", "漫画作品", "アニメ作品", "ゲーム作品"];

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const randomParams = `?action=query&list=random&rnnamespace=0&rnlimit=1${commonParams}`;
      const randomResponse = await fetch(url + randomParams);
      const randomData = await randomResponse.json();
      const randomTitle = randomData.query.random[0].title;

      const detailsParams = `?action=query&prop=extracts|categories|pageviews&titles=${encodeURIComponent(randomTitle)}${commonParams}`;
      const detailsResponse = await fetch(url + detailsParams);
      const detailsData = await detailsResponse.json();
      const page = Object.values(detailsData.query.pages)[0];
      
      if (globalSettings.excludeProperNouns) {
        const categories = page.categories?.map(cat => cat.title) || [];
        const isProperNoun = categories.some(cat => properNounKeywords.some(key => cat.includes(key)));
        if (isProperNoun) {
          console.log(`フィルタ: 固有名詞記事「${page.title}」をスキップ`);
          continue;
        }
      }

      const pageviews = page.pageviews ? Object.values(page.pageviews).reduce((a, b) => a + b, 0) : 0;
      if (pageviews < globalSettings.minPageviews) {
        console.log(`フィルタ: 低閲覧数記事「${page.title}」（${pageviews} views）をスキップ`);
        continue;
      }

      setArticle({ title: page.title, extract: page.extract });
      const { maskedText, unmaskableWords } = maskText(page.extract, page.title);
      setMaskedExtract(maskedText);
      setUnmaskableWords(unmaskableWords);
      setHistory(prevHistory => [...prevHistory, { title: page.title, extract: page.extract }]);
      setResultMessage('');
      return;

    } catch (error) {
      console.error("APIリクエスト中にエラー:", error);
      continue;
    }
  }

  setResultMessage("条件に合う記事が見つかりませんでした。設定を緩めてみてください。");
};
// ▲▲▲ ここまで置き換え ▲▲▲

  useEffect(() => {
    fetchRandomArticle();
  }, []);

  const handleGuess = () => {
    if (isAnswered || !guess || !article) return;
    const normalizedGuess = normalizeText(guess.toLowerCase());
    const normalizedTitle = normalizeText(article.title.toLowerCase());
    const mainTitle = article.title.split('(')[0].trim();
    const normalizedMainTitle = normalizeText(mainTitle.toLowerCase());
    if (normalizedGuess === normalizedTitle || normalizedGuess === normalizedMainTitle) {
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
  if (isAnswered) return;
  // 表示文字数を150文字増やす
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
            <button 
              onClick={handleRevealHint} 
              disabled={isAnswered || visibleChars >= maskedExtract.length}
            >
              ヒント
            </button>
            <button onClick={fetchRandomArticle} disabled={isAnswered}>リロール</button>
            <button onClick={showAnswer} disabled={isAnswered}>答えを見る</button>
          </div>
          <div className="guess-area">
            <input type="text" value={guess} onChange={(e) => setGuess(e.target.value)} onKeyPress={handleKeyPress} placeholder="答えを入力" disabled={isAnswered}/>
            <button onClick={handleGuess} disabled={isAnswered}>回答</button>
          </div>
          <p className="result-message">{resultMessage}</p>
          {isAnswered && (
            <div className="practice-after-answer">
              <button className="next-button" onClick={fetchRandomArticle}>次の問題へ</button>
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
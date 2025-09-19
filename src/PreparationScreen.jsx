import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameSettings } from './GameContext';
import './App.css';

function PreparationScreen() {
  const { mode } = useParams();
  const navigate = useNavigate();
  const { setSettings, gameModes } = useGameSettings();
  
  const selectedMode = gameModes[mode] || { name: '不明', description: '', path: null, settings: {} };
  
  const [localSettings, setLocalSettings] = useState(selectedMode.settings);

  // URLのモードが変わったら、表示する設定も更新する
  useEffect(() => {
    setLocalSettings(gameModes[mode]?.settings || {});
  }, [mode, gameModes]);

  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setLocalSettings(prev => ({ ...prev, [name]: Number(value) }));
  };
  
  const handleGameStart = () => {
    setSettings(localSettings); // グローバルな設定を更新
    navigate(selectedMode.path);
  };

  return (
    <div className="page-container">
      <h1>{selectedMode.name}モード</h1>
      <p className="mode-description">{selectedMode.description}</p>
      <div className="options-container">
        <h2>オプション</h2>
        <div className="option-item">
          <label htmlFor="questionCount">問題数</label>
          <input id="questionCount" name="questionCount" type="number" value={localSettings.questionCount} onChange={handleSettingChange} />
        </div>
        <div className="option-item">
          <label htmlFor="baseScore">基礎スコア</label>
          <input id="baseScore" name="baseScore" type="number" value={localSettings.questionCount} onChange={handleSettingChange} />
        </div>
        <div className="option-item">
          <label htmlFor="maxTime">タイム</label>
          <input id="maxTime" name="maxTime" type="number" value={localSettings.questionCount} onChange={handleSettingChange} />
        </div>
        <div className="option-item">
          <label htmlFor="incorrectCost">不正解ペナルティ</label>
          <input id="incorrectCost" name="incorrectCost" type="number" value={localSettings.questionCount} onChange={handleSettingChange} />
        </div>
        <div className="option-item">
          <label htmlFor="hintCost">ヒントコスト</label>
          <input id="hintCost" name="hintCost" type="number" value={localSettings.questionCount} onChange={handleSettingChange} />
        </div>
        <div className="option-item">
          <label htmlFor="unmaskHintCost">アンマスクコスト</label>
          <input id="unmaskHintCost" name="unmaskHintCost" type="number" value={localSettings.questionCount} onChange={handleSettingChange} />
        </div>
        <div className="option-item">
          <label htmlFor="rerollCostBase">リロールコスト</label>
          <input id="rerollCostBase" name="rerollCostBase" type="number" value={localSettings.questionCount} onChange={handleSettingChange} />
        </div>
        <button className="menu-button" onClick={() => setLocalSettings(selectedMode.settings)}>デフォルトに戻す</button>
      </div>
      <div className="preparation-buttons">
        {selectedMode.path ? (
          <button onClick={handleGameStart} className="menu-button">ゲーム開始</button>
        ) : (
          <button className="menu-button" disabled>準備中</button>
        )}
        <button onClick={() => navigate(-1)} className="menu-button back-button">戻る</button>
      </div>
    </div>
  );
}

export default PreparationScreen;
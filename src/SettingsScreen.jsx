import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameSettings } from './GameContext';
import './App.css';

function SettingsScreen() {
  const navigate = useNavigate();
  const { globalSettings, setGlobalSettings, defaultGlobalSettings } = useGameSettings();

  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setGlobalSettings(prev => ({ ...prev, [name]: Number(value) }));
  };

  return (
    <div className="page-container">
      <h1>共通設定</h1>
      <p className="mode-description">ここでの設定は、すべてのゲームモードに適用されます。</p>
      <div className="options-container">
        <h2>記事の取得設定</h2>
        <div className="option-item">
          <label htmlFor="fetchBatchSize">一度に調べる記事数</label>
          <input id="fetchBatchSize" name="fetchBatchSize" type="number" step="5" value={globalSettings.fetchBatchSize} onChange={handleSettingChange} />
        </div>
        <div className="option-item">
          <label htmlFor="fetchAttempts">最大試行回数</label>
          <input id="fetchAttempts" name="fetchAttempts" type="number" step="1" value={globalSettings.fetchAttempts} onChange={handleSettingChange} />
        </div>
        <button className="menu-button" onClick={() => setGlobalSettings(defaultGlobalSettings)}>デフォルトに戻す</button>
      </div>
      <button onClick={() => navigate(-1)} className="menu-button back-button">戻る</button>
    </div>
  );
}

export default SettingsScreen;
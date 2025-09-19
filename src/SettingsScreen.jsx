import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameSettings } from './GameContext';
import './App.css';

function SettingsScreen() {
  const navigate = useNavigate();
  const { globalSettings, setGlobalSettings, defaultGlobalSettings } = useGameSettings();

  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGlobalSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : Number(value)
    }));
  };

  return (
    <div className="page-container">
      <h1>共通設定</h1>
      <p className="mode-description">ここでの設定は、すべてのゲームモードに適用されます。</p>

      <div className="options-container">
        <h2>記事フィルター</h2>
        <div className="option-item">
          <label htmlFor="minPageviews">最低閲覧数</label>
          <input id="minPageviews" name="minPageviews" type="number" step="100" value={globalSettings.minPageviews} onChange={handleSettingChange} />
        </div>
        <div className="option-item checkbox-item">
          <label htmlFor="excludeProperNouns">固有名詞を除外</label>
          <input id="excludeProperNouns" name="excludeProperNouns" type="checkbox" checked={globalSettings.excludeProperNouns} onChange={handleSettingChange} />
        </div>
        <button className="menu-button" onClick={() => setGlobalSettings(defaultGlobalSettings)}>デフォルトに戻す</button>
      </div>
      
      <button onClick={() => navigate(-1)} className="menu-button back-button">戻る</button>
    </div>
  );
}

export default SettingsScreen;
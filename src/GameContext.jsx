import React, { createContext, useContext, useState, useEffect } from 'react';

// モードごとの設定値を定義
export const gameModes = {
  normal: {
    name: 'ノーマル',
    description: '総合スコアを競う、基本的なモードです。',
    path: '/game/normal',
    settings: {
      questionCount: 5, baseScore: 100, maxTime: 60, incorrectCost: 20, hintCost: 5, unmaskHintCost: 10, rerollCostBase: 10, noHintBonus: 20, noRerollBonus: 10, comboBonusMultiplier: 5,
    }
  },
  timeattack: {
    name: 'タイムアタック',
    description: '問題をどれだけ早くクリアできるかを競うモードです。',
    path: '/game/timeattack',
    settings: {
      questionCount: 5, baseScore: 100, maxTime: 999, incorrectCost: 20, hintCost: 5, unmaskHintCost: 10, rerollCostBase: 10,
    }
  },
  survival: {
    name: 'サバイバル',
    description: '持ち時間60秒からスタートし、どれだけ長く生き延びられるかを競うモードです。',
    path: '/game/survival',
    settings: {
      questionCount: 999, baseScore: 50, maxTime: 60, timeCap: 80, incorrectCost: 20, hintCost: 5, unmaskHintCost: 10, rerollCostBase: 10, noHintBonus: 10, noRerollBonus: 5,
    }
  },
  practice: {
    name: '練習',
    description: 'スコアや時間を気にせず、心ゆくまで練習できるモードです。',
    path: '/game/practice',
    // ★修正点：練習モード用のダミー設定を正しく定義
    settings: {
      questionCount: 999, baseScore: 0, maxTime: 999, incorrectCost: 0, hintCost: 0, unmaskHintCost: 0, rerollCostBase: 0,
    }
  }
};

const defaultGlobalSettings = {
  fetchBatchSize: 20, // 一度に取得する記事の数
  fetchAttempts: 3,   // バッチ取得を試行する回数
};

const GameContext = createContext();

export function GameProvider({ children }) {
  const [modeSettings, setModeSettings] = useState(gameModes.normal.settings);
  const [globalSettings, setGlobalSettings] = useState(() => {
    const saved = localStorage.getItem('wikiGameGlobalSettings');
    const initialSettings = saved ? JSON.parse(saved) : {};
    return { ...defaultGlobalSettings, ...initialSettings };
  });

  useEffect(() => {
    localStorage.setItem('wikiGameGlobalSettings', JSON.stringify(globalSettings));
  }, [globalSettings]);

  return (
    <GameContext.Provider value={{
      modeSettings, setModeSettings,
      globalSettings, setGlobalSettings,
      gameModes, defaultGlobalSettings
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameSettings() {
  return useContext(GameContext);
}
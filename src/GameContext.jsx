import React, { createContext, useContext, useState } from 'react';

// モードごとの設定値を定義
export const gameModes = {
  normal: {
    name: 'ノーマル',
    description: '総合スコアを競う、基本的なモードです。',
    path: '/game/normal', // ★パスを変更
    settings: {
      questionCount: 5,
      baseScore: 100,
      maxTime: 60,
      incorrectCost: 20,
      hintCost: 5,
      unmaskHintCost: 10,
      rerollCostBase: 10,
    }
  },
  timeattack: {
    name: 'タイムアタック',
    description: '問題をどれだけ早くクリアできるかを競うモードです。',
    path: '/game/timeattack', // ★パスを変更
    settings: {
      questionCount: 3,
      baseScore: 100, // ライフとして使用
      maxTime: 999, // このモードでは使用しない
      incorrectCost: 20,
      hintCost: 5,
      unmaskHintCost: 10,
      rerollCostBase: 10,
    }
  },
  survival: {
    name: 'サバイバル',
    description: '持ち時間60秒からスタートし、どれだけ長く生き延びられるかを競うモードです。', // (準備中)を削除
    path: '/game/survival', // nullから変更
    settings: {
      questionCount: 999, // このモードでは問題数制限なし
      baseScore: 50,      // ライフの初期値
      maxTime: 60,        // 持ち時間の初期値
      timeCap: 80,        // 持ち時間の上限
      incorrectCost: 20,
      hintCost: 5,
      unmaskHintCost: 10,
      rerollCostBase: 10,
      noHintBonus: 10,    // サバイバルではボーナスを少し調整
      noRerollBonus: 5,
      comboBonusMultiplier: 5,
    }
  },
  practice: {
    name: '練習',
    description: 'スコアや時間を気にせず、心ゆくまで練習できるモードです。',
    path: '/game/practice', // ★パスを変更
    settings: { /* ... */ }
  }
};

const GameContext = createContext();

export function GameProvider({ children }) {
  const [settings, setSettings] = useState(gameModes.normal.settings);

  return (
    <GameContext.Provider value={{ settings, setSettings, gameModes }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameSettings() {
  return useContext(GameContext);
}
import { Routes, Route } from 'react-router-dom';
import TitleScreen from './TitleScreen';
import NormalGame from './NormalGame';
import './App.css';
import HowToPlay from './HowToPlay';
import Index from './Index';
import GameModeSelection from './GameModeSelection';
import PreparationScreen from './PreparationScreen';
import PracticeGame from './PracticeGame';
import TimeAttackGame from './TimeAttackGame';
import GameLayout from './GameLayout';
import SurvivalGame from './SurvivalGame';
import SettingsScreen from './SettingsScreen';

function App() {
  return (
    <div className="App">
     <Routes>
      <Route path="/" element={<TitleScreen />} />
      <Route path="/select-mode" element={<GameModeSelection />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="/prepare/:mode" element={<PreparationScreen />} />
      <Route path="/how-to-play" element={<HowToPlay />} />
      <Route path="/index" element={<Index />} />
      

      {/* ゲーム画面用のルートをまとめる */}
      <Route path="/game" element={<GameLayout />}>
        <Route path="normal" element={<NormalGame />} />
        <Route path="timeattack" element={<TimeAttackGame />} />
        <Route path="practice" element={<PracticeGame />} />
        <Route path="survival" element={<SurvivalGame />} />
      </Route>
    </Routes>
    </div>
  );
}

export default App;
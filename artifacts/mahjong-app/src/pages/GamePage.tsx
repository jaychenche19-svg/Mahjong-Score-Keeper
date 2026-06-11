import { useRef, type ReactNode } from 'react';
import { Header } from '../components/layout/Header';
import { TabBar } from '../components/layout/TabBar';
import { ScoreTab } from '../components/tabs/ScoreTab';
import { StatusTab } from '../components/tabs/StatusTab';
import { ResultTab } from '../components/tabs/ResultTab';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import type { ConfirmConfig, HistoryRecord, StatEntry } from '../types';

interface Props {
  customNames: string[];
  myRole: number;
  roomId: string;
  isSinglePlayer: boolean;
  base: number;
  taiValue: number;
  dealerIdx: number;
  renZhuang: number;
  winnerIdx: number;
  loserIdx: number;
  huTai: number | '';
  history: HistoryRecord[];
  activeTab: string;
  totalScores: number[];
  loserKing: StatEntry | null;
  selfDrawKing: StatEntry | null;
  confirmConfig: ConfirmConfig;
  onDealerChange: (val: number) => void;
  onRenZhuangChange: (val: number) => void;
  onWinnerChange: (val: number) => void;
  onLoserChange: (val: number) => void;
  onHuTaiChange: (val: number | '') => void;
  onSaveRecord: (scores: number[], winnerIdx: number, dealerIdx: number, renZhuang: number) => void;
  onDraw: () => void;
  onUndoLast: () => void;
  onReset: () => void;
  onBackToHome: () => void;
  onTabChange: (id: string) => void;
  hapticClick: () => void;
  hapticSlide: () => void;
  triggerConfirm: (title: string, onConfirm: () => void, description?: ReactNode) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const TABS = ['score', 'status', 'result'] as const;

export function GamePage({
  customNames, myRole, roomId, isSinglePlayer,
  base, taiValue, dealerIdx, renZhuang, winnerIdx, loserIdx, huTai,
  history, activeTab, totalScores, loserKing, selfDrawKing, confirmConfig,
  onDealerChange, onRenZhuangChange, onWinnerChange, onLoserChange, onHuTaiChange,
  onSaveRecord, onDraw, onUndoLast, onReset, onBackToHome, onTabChange,
  hapticClick, hapticSlide, triggerConfirm, onConfirm, onCancel,
}: Props) {
  const swipeTouchStartX = useRef<number | null>(null);

  const handleSwipeEnd = (endX: number) => {
    if (swipeTouchStartX.current === null) return;
    const diff = swipeTouchStartX.current - endX;
    const currentIdx = TABS.indexOf(activeTab as typeof TABS[number]);
    if (diff > 60 && currentIdx < TABS.length - 1) { hapticClick(); onTabChange(TABS[currentIdx + 1]); }
    if (diff < -60 && currentIdx > 0) { hapticClick(); onTabChange(TABS[currentIdx - 1]); }
    swipeTouchStartX.current = null;
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-44">
      <ConfirmModal config={confirmConfig} onConfirm={onConfirm} onCancel={onCancel} />

      <Header
        customNames={customNames}
        myRole={myRole}
        roomId={roomId}
        isSinglePlayer={isSinglePlayer}
        onLogoClick={onBackToHome}
      />

      <div
        className="p-5"
        onTouchStart={e => { swipeTouchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={e => handleSwipeEnd(e.changedTouches[0].clientX)}
      >
        {activeTab === 'score' && (
          <ScoreTab
            base={base} taiValue={taiValue}
            dealerIdx={dealerIdx} renZhuang={renZhuang}
            winnerIdx={winnerIdx} loserIdx={loserIdx} huTai={huTai}
            customNames={customNames}
            onDealerChange={onDealerChange}
            onRenZhuangChange={onRenZhuangChange}
            onWinnerChange={onWinnerChange}
            onLoserChange={onLoserChange}
            onHuTaiChange={onHuTaiChange}
            onSaveRecord={onSaveRecord}
            onDraw={onDraw}
            triggerConfirm={triggerConfirm}
            hapticSlide={hapticSlide}
          />
        )}
        {activeTab === 'status' && (
          <StatusTab
            customNames={customNames}
            myRole={myRole}
            dealerIdx={dealerIdx}
            totalScores={totalScores}
            historyEmpty={history.length === 0}
            history={history}
            onUndoLast={onUndoLast}
            hapticClick={hapticClick}
          />
        )}
        {activeTab === 'result' && (
          <ResultTab
            loserKing={loserKing}
            selfDrawKing={selfDrawKing}
            onReset={onReset}
            onBackToHome={onBackToHome}
            hapticClick={hapticClick}
          />
        )}
      </div>

      <TabBar activeTab={activeTab} onTabChange={onTabChange} hapticClick={hapticClick} />
    </div>
  );
}

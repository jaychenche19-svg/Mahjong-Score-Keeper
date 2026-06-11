import { useState } from 'react';
import { Crown, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { BASE_ROLES } from '../../utils/constants';
import type { HistoryRecord } from '../../types';

interface Props {
  customNames: string[];
  myRole: number;
  dealerIdx: number;
  totalScores: number[];
  historyEmpty: boolean;
  history: HistoryRecord[];
  onUndoLast: () => void;
  hapticClick: () => void;
}

export function StatusTab({ customNames, myRole, dealerIdx, totalScores, historyEmpty, history, onUndoLast, hapticClick }: Props) {
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
      {customNames.map((name, i) => {
        const isMe = i === myRole;
        const isDealer = i === dealerIdx;
        return (
          <div
            key={i}
            className={`p-8 rounded-[3.5rem] flex justify-between items-center border-2
              ${isMe ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent shadow-sm'}
              ${isDealer ? 'ring-4 ring-yellow-400/30' : ''}`}
          >
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center font-black
                ${isDealer ? 'bg-yellow-400 text-gray-900 scale-110 shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                {isDealer && <Crown size={18} className="mb-1 animate-bounce" />}
                <span className="text-3xl">{BASE_ROLES[i][0]}</span>
              </div>
              <div className="flex flex-col">
                <span className={`font-black text-3xl ${isMe ? 'text-blue-600' : 'text-gray-900'}`}>
                  {name}
                  {isMe && <span className="text-sm ml-2 font-bold opacity-60">(我)</span>}
                </span>
                {isDealer && <span className="text-xs font-black text-yellow-600 tracking-widest">莊家連莊中</span>}
              </div>
            </div>
            <div className={`text-5xl font-black ${totalScores[i] >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
              {totalScores[i] >= 0 ? `+${totalScores[i]}` : totalScores[i]}
            </div>
          </div>
        );
      })}

      {/* 歷史記錄收合區塊 */}
      {history.length > 0 && (
        <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-6 py-5 active:bg-gray-50 transition-colors"
            onClick={() => { hapticClick(); setHistoryOpen(o => !o); }}
          >
            <div className="flex items-center gap-3">
              <span className="text-base font-black text-gray-900">對局紀錄</span>
              <span className="text-xs font-black text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {history.length} 局
              </span>
            </div>
            {historyOpen
              ? <ChevronUp size={20} className="text-gray-400" />
              : <ChevronDown size={20} className="text-gray-400" />}
          </button>

          {historyOpen && (
            <div className="px-6 pb-4 space-y-1 border-t border-gray-50">
              {history.map((rec, idx) => {
                const roundNum = history.length - idx;
                const recDealerIdx = rec.dealerIdx ?? -1;
                const dealerName = recDealerIdx >= 0 ? customNames[recDealerIdx] : null;

                if (rec.isDraw) {
                  return (
                    <div key={rec.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-gray-300 w-8">#{roundNum}</span>
                        <span className="text-xl">🌊</span>
                        <div>
                          <p className="font-black text-gray-400 text-sm">流局</p>
                          {dealerName && (
                            <p className="text-xs text-yellow-500 font-bold">👑 {dealerName} 連莊</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-300">不計分</span>
                    </div>
                  );
                }

                const winnerName = rec.winner >= 0 ? customNames[rec.winner] : '-';
                const isSelfDraw = rec.loser === -1;
                const loserName = isSelfDraw ? null : (rec.loser >= 0 ? customNames[rec.loser] : '-');
                const winnerIsDealer = rec.winner === recDealerIdx;

                return (
                  <div key={rec.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-gray-300 w-8">#{roundNum}</span>
                      <span className="text-xl">{isSelfDraw ? '✨' : '🔫'}</span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-black text-gray-900 text-sm">{winnerName}</p>
                          {winnerIsDealer && <span className="text-xs bg-yellow-100 text-yellow-600 font-black px-1.5 py-0.5 rounded-full">莊</span>}
                        </div>
                        <p className="text-xs font-bold text-gray-400">
                          {isSelfDraw ? '自摸' : `${loserName} 放槍`}
                          {dealerName && !winnerIsDealer && (
                            <span className="text-yellow-500 ml-1">・{dealerName}莊</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#34C759] text-base">+${rec.amount}</p>
                      <div className="flex gap-0.5 mt-1 justify-end">
                        {rec.scores.map((s, i) => (
                          <span key={i} className={`text-xs font-bold px-1.5 py-0.5 rounded-full flex flex-col items-center leading-tight ${
                            s > 0 ? 'bg-green-100 text-green-600' : s < 0 ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <span className="text-[9px] opacity-60">{BASE_ROLES[i][0]}</span>
                            <span>{s > 0 ? `+${s}` : s}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <button
        className={`w-full h-16 text-gray-300 border-none text-base font-bold flex items-center justify-center gap-2 transition-opacity ${historyEmpty ? 'opacity-30' : ''}`}
        onClick={() => { hapticClick(); onUndoLast(); }}
        disabled={historyEmpty}
      >
        <RotateCcw size={20} /> 撤銷上一筆
      </button>
    </div>
  );
}

import { Crown, RotateCcw } from 'lucide-react';
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

      <button
        className={`w-full h-20 text-gray-300 border-none mt-4 text-lg font-bold flex items-center justify-center gap-2 ${historyEmpty ? 'opacity-30' : ''}`}
        onClick={() => { hapticClick(); onUndoLast(); }}
        disabled={historyEmpty}
      >
        <RotateCcw size={24} /> 撤銷上一筆
      </button>

      {/* 歷史記錄列表 */}
      {history.length > 0 && (
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">對局紀錄</h3>
          {history.map((rec, idx) => {
            const roundNum = history.length - idx;
            if (rec.isDraw) {
              return (
                <div key={rec.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-gray-300 w-8">#{roundNum}</span>
                    <span className="text-2xl">🌊</span>
                    <span className="font-black text-gray-400">流局</span>
                  </div>
                  <span className="text-sm font-bold text-gray-300">莊家連莊</span>
                </div>
              );
            }
            const winnerName = rec.winner >= 0 ? customNames[rec.winner] : '-';
            const isSelfDraw = rec.loser === -1;
            const loserName = isSelfDraw ? '自摸' : (rec.loser >= 0 ? customNames[rec.loser] : '-');
            return (
              <div key={rec.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-gray-300 w-8">#{roundNum}</span>
                  <span className="text-2xl">{isSelfDraw ? '✨' : '🔫'}</span>
                  <div>
                    <p className="font-black text-gray-900 text-base">{winnerName}</p>
                    <p className="text-xs font-bold text-gray-400">{isSelfDraw ? '自摸' : `${loserName} 放槍`}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-[#34C759] text-xl">+${rec.amount}</p>
                  <div className="flex gap-1 mt-1">
                    {rec.scores.map((s, i) => (
                      <span key={i} className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                        s > 0 ? 'bg-green-100 text-green-600' : s < 0 ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {s > 0 ? `+${s}` : s}
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
  );
}

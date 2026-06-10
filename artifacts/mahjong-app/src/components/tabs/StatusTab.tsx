import { Crown, RotateCcw } from 'lucide-react';
import { BASE_ROLES } from '../../utils/constants';

interface Props {
  customNames: string[];
  myRole: number;
  dealerIdx: number;
  totalScores: number[];
  historyEmpty: boolean;
  onUndoLast: () => void;
  hapticClick: () => void;
}

export function StatusTab({ customNames, myRole, dealerIdx, totalScores, historyEmpty, onUndoLast, hapticClick }: Props) {
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
    </div>
  );
}

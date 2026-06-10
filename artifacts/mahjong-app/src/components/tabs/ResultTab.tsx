import { Trophy, RefreshCw, Home } from 'lucide-react';
import type { StatEntry } from '../../types';

interface Props {
  loserKing: StatEntry | null;
  selfDrawKing: StatEntry | null;
  onReset: () => void;
  onBackToHome: () => void;
  hapticClick: () => void;
}

export function ResultTab({ loserKing, selfDrawKing, onReset, onBackToHome, hapticClick }: Props) {
  return (
    <div className="space-y-6 pb-32 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-[#3C3C3E] p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10"><Trophy size={120} /></div>
        <p className="font-black text-sm uppercase opacity-40 tracking-[0.4em]">🏆 自摸王</p>
        <h3 className="text-8xl font-black mt-6 tracking-tighter">
          {selfDrawKing && selfDrawKing.selfDrawCount > 0 ? selfDrawKing.name : '--'}
        </h3>
        <p className="text-3xl font-bold mt-2 text-yellow-400">
          {selfDrawKing?.selfDrawCount ?? 0} 次自摸
        </p>
      </div>

      <div className="bg-white p-12 rounded-[4rem] text-gray-900 border-4 border-gray-100 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Trophy size={120} /></div>
        <p className="font-black text-sm uppercase opacity-30 tracking-[0.4em]">🔫 放槍王</p>
        <h3 className="text-8xl font-black mt-6 tracking-tighter">
          {loserKing && loserKing.loseCount > 0 ? loserKing.name : '--'}
        </h3>
        <p className="text-3xl font-bold mt-2 text-red-500">
          {loserKing?.loseCount ?? 0} 次被胡
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-4">
        <button
          className="w-full h-24 bg-white text-red-500 text-2xl font-black rounded-[3rem] border-none btn-spring shadow-lg flex items-center justify-center gap-3"
          onClick={() => { hapticClick(); onReset(); }}
        >
          <RefreshCw size={28} /> 重新一將
        </button>
        <button
          className="w-full h-24 bg-[#D1D1D6] text-gray-900 rounded-[3rem] font-black text-2xl border-none btn-spring shadow-lg flex items-center justify-center gap-3"
          onClick={() => { hapticClick(); onBackToHome(); }}
        >
          <Home size={28} /> 返回主畫面
        </button>
      </div>
    </div>
  );
}

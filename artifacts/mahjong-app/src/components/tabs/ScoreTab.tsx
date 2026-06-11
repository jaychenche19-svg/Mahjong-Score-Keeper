import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { calcPayment } from '../../utils/calcPayment';

const MAX_TAI = 30;

interface Props {
  base: number;
  taiValue: number;
  dealerIdx: number;
  renZhuang: number;
  winnerIdx: number;
  loserIdx: number;
  huTai: number | '';
  customNames: string[];
  onDealerChange: (val: number) => void;
  onRenZhuangChange: (val: number) => void;
  onWinnerChange: (val: number) => void;
  onLoserChange: (val: number) => void;
  onHuTaiChange: (val: number | '') => void;
  onSaveRecord: (scores: number[], winnerIdx: number, dealerIdx: number, renZhuang: number) => void;
  onDraw: () => void;
  triggerConfirm: (title: string, onConfirm: () => void, description?: ReactNode) => void;
  hapticSlide: () => void;
}

export function ScoreTab({
  base, taiValue, dealerIdx, renZhuang, winnerIdx, loserIdx, huTai, customNames,
  onDealerChange, onRenZhuangChange, onWinnerChange, onLoserChange, onHuTaiChange,
  onSaveRecord, onDraw, triggerConfirm, hapticSlide,
}: Props) {
  const taiNum = Number(huTai) || 0;
  const taiError = taiNum > MAX_TAI ? `台數上限 ${MAX_TAI} 台` : '';

  const handleRecord = () => {
    if (taiError) return;
    const isSelfDraw = loserIdx === -1;
    const { scores, displayTotal, perPlayerAmounts } = calcPayment({
      base: Number(base) || 0,
      taiValue: Number(taiValue) || 0,
      huTai: taiNum,
      winnerIdx, loserIdx, dealerIdx, renZhuang,
    });

    const desc = (
      <div className="space-y-3 py-2 text-left bg-gray-50 p-5 rounded-3xl">
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-400">贏家</span>
          <span className="text-2xl font-black text-green-600">{customNames[winnerIdx]}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-400">方式</span>
          <span className="text-2xl font-black">
            {isSelfDraw ? '✨ 自摸' : `🔫 放槍 (${customNames[loserIdx]})`}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-400">胡台數</span>
          <span className="text-2xl font-black">{taiNum} 台</span>
        </div>
        {isSelfDraw ? (
          <div className="space-y-1 border-t border-dashed border-gray-200 pt-3">
            <p className="text-xs font-black text-gray-400 mb-2">各家付款明細</p>
            {perPlayerAmounts.map(({ idx, amount }) => {
              const dealerInvolved = winnerIdx === dealerIdx || idx === dealerIdx;
              return (
                <div key={idx} className="flex justify-between items-center">
                  <span className="font-bold text-gray-500 text-sm">
                    {customNames[idx]}{idx === dealerIdx ? ' 👑' : ''}
                  </span>
                  <span className="font-black text-red-500">
                    -${amount}
                    {dealerInvolved && (
                      <span className="text-xs text-gray-400 ml-1">
                        (含莊{renZhuang > 0 ? `+連${renZhuang}` : ''})
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (() => {
          const dealerInvolved = winnerIdx === dealerIdx || loserIdx === dealerIdx;
          const bonus = dealerInvolved ? 1 + renZhuang * 2 : 0;
          return bonus > 0 ? (
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-400">莊加成</span>
              <span className="text-lg font-black text-red-500">+{bonus} 台</span>
            </div>
          ) : null;
        })()}
        <hr className="border-dashed border-gray-200" />
        <div className="flex justify-between items-end">
          <span className="font-bold text-gray-900">{isSelfDraw ? '贏家總收' : '總金額'}</span>
          <span className="text-4xl font-black text-blue-600">${displayTotal}</span>
        </div>
        <p className="text-xs text-gray-400 text-center pt-1">確認後莊家將自動輪換</p>
      </div>
    );

    triggerConfirm('確認新增這筆紀錄？', () => onSaveRecord(scores, winnerIdx, dealerIdx, renZhuang), desc);
  };

  return (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white rounded-[2.5rem] p-3 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          {[{ label: '底', value: base }, { label: '台', value: taiValue }].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-[2rem] p-5 text-center relative">
              <p className="text-xs font-black text-gray-400 uppercase mb-1 tracking-widest">{label}</p>
              <div className="text-4xl font-black text-gray-400">{value}</div>
              <Lock className="absolute top-3 right-3 text-gray-400" size={18} strokeWidth={2.5} />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-6 space-y-5 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-base font-black text-gray-900 ml-3 block">莊家</label>
            <select
              className="w-full h-14 bg-gray-100 rounded-2xl px-4 font-black text-xl border-none outline-none appearance-none"
              value={dealerIdx}
              onChange={e => { hapticSlide(); onDealerChange(Number(e.target.value)); }}
            >
              {customNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-base font-black text-gray-900 ml-3 block">連莊</label>
            <select
              className="w-full h-14 bg-gray-100 rounded-2xl px-4 font-black text-xl border-none outline-none appearance-none"
              value={renZhuang}
              onChange={e => { hapticSlide(); onRenZhuangChange(Number(e.target.value)); }}
            >
              {[...Array(19).keys()].map(n => (
                <option key={n} value={n}>{n === 0 ? '0' : `連 ${n} 拉 ${n}`}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t pt-5 border-gray-50">
          <div className="space-y-2">
            <label className="text-base font-black text-gray-900 ml-3 block">贏家</label>
            <select
              className="w-full h-14 bg-gray-100 rounded-2xl px-4 font-black text-xl border-none outline-none appearance-none"
              value={winnerIdx}
              onChange={e => { hapticSlide(); onWinnerChange(Number(e.target.value)); }}
            >
              {customNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-base font-black text-gray-900 ml-3 block">方式</label>
            <select
              className="w-full h-14 bg-gray-100 rounded-2xl px-4 font-black text-xl border-none outline-none appearance-none"
              value={loserIdx}
              onChange={e => { hapticSlide(); onLoserChange(Number(e.target.value)); }}
            >
              <option value={-1}>自摸 ✨</option>
              {customNames.map((name, i) => i !== winnerIdx
                ? <option key={i} value={i}>{name} 🔫</option>
                : null
              )}
            </select>
          </div>
        </div>

        <div className="space-y-2 text-center">
          <label className="text-sm font-black text-gray-400 uppercase tracking-widest block">
            胡牌台數
            {loserIdx === -1 && <span className="text-blue-400 text-xs ml-2">(自摸 +1台)</span>}
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="0"
            value={huTai}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '');
              const num = val === '' ? '' : parseInt(val, 10);
              onHuTaiChange(num);
            }}
            className={`w-full h-20 border-none rounded-[2rem] text-center text-5xl font-black focus:outline-none transition-colors ${
              taiError ? 'bg-red-50 text-red-500' : 'bg-gray-50'
            }`}
          />
          {taiError && <p className="text-red-500 font-black text-sm">{taiError}</p>}
        </div>

        <button
          className={`w-full h-16 text-gray-900 text-xl font-black rounded-[2rem] btn-spring shadow-xl transition-opacity ${
            taiError ? 'opacity-40 bg-gray-200 cursor-not-allowed' : 'bg-[#C7C7CC]'
          }`}
          onClick={handleRecord}
          disabled={!!taiError}
        >
          確認紀錄
        </button>
      </div>
    </div>
  );
}

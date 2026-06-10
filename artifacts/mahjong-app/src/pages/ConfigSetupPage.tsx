import { Calculator, Copy, Check } from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import type { ConfirmConfig, Player } from '../types';

interface Props {
  roomId: string;
  base: number;
  taiValue: number;
  isSinglePlayer: boolean;
  players: (Player | null)[];
  loading: boolean;
  copied: boolean;
  confirmConfig: ConfirmConfig;
  onBaseChange: (val: number) => void;
  onTaiChange: (val: number) => void;
  onCopyRoomId: () => void;
  onStart: () => void;
  onBack: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfigSetupPage({
  roomId, base, taiValue, isSinglePlayer, players, loading, copied, confirmConfig,
  onBaseChange, onTaiChange, onCopyRoomId, onStart, onBack, onConfirm, onCancel,
}: Props) {
  const isJoiner = !isSinglePlayer && players.some(p => p !== null);

  return (
    <div className="min-h-screen bg-[#F2F2F7] p-6 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white rounded-[3rem] p-10 space-y-8 shadow-sm">
        <div className="text-center mb-4">
          <Calculator className="mx-auto text-gray-300" size={40} />
        </div>
        <h2 className="text-4xl font-black text-center">底台設定</h2>

        {!isSinglePlayer && roomId && (
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-black">房號</p>
              <p className="text-2xl font-black tracking-widest">{roomId}</p>
            </div>
            <button
              className="flex items-center gap-2 bg-gray-200 rounded-xl px-4 py-2 font-black text-sm"
              onClick={onCopyRoomId}
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              {copied ? '已複製' : '複製房號'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: '底', value: base, onChange: onBaseChange },
            { label: '台', value: taiValue, onChange: onTaiChange },
          ].map(({ label, value, onChange }) => (
            <div key={label} className="space-y-2 text-center">
              <label className="text-gray-400 font-black text-sm uppercase">{label}</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={value}
                onChange={e => {
                  if (!isJoiner) {
                    const val = e.target.value.replace(/\D/g, '');
                    onChange(val === '' ? 0 : Number(val));
                  }
                }}
                readOnly={isJoiner}
                className={`w-full h-20 border-none rounded-2xl text-center font-black text-4xl focus:outline-none ${isJoiner ? 'bg-gray-100 text-gray-400' : 'bg-gray-50'}`}
              />
            </div>
          ))}
        </div>

        {isJoiner && (
          <p className="text-center text-xs text-gray-400 font-black">底台由房主設定，無法更改</p>
        )}

        <button
          className="w-full h-20 bg-[#C7C7CC] text-gray-900 rounded-[2rem] font-black text-xl border-none btn-spring"
          onClick={onStart}
          disabled={loading}
        >
          {loading ? '進入中...' : '開打！'}
        </button>
        <button onClick={onBack} className="w-full text-gray-400 font-bold border-none">返回</button>
      </div>
      <ConfirmModal config={confirmConfig} onConfirm={onConfirm} onCancel={onCancel} />
    </div>
  );
}

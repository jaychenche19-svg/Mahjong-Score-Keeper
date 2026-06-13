import { Calculator, Copy, Check, Lock } from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import type { ConfirmConfig, Player } from '../types';

interface Props {
  roomId: string;
  base: number;
  taiValue: number;
  isSinglePlayer: boolean;
  isJoiner: boolean;
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

const getFontSize = (val: number | string) => {
  const len = String(val).length;
  if (len <= 4) return '2.5rem';
  if (len <= 6) return '1.8rem';
  if (len <= 8) return '1.3rem';
  if (len <= 10) return '1rem';
  return '0.75rem';
};

export function ConfigSetupPage({
  roomId, base, taiValue, isSinglePlayer, isJoiner, players, loading, copied, confirmConfig,
  onBaseChange, onTaiChange, onCopyRoomId, onStart, onBack, onConfirm, onCancel,
}: Props) {
  return (
    <div className="min-h-screen bg-[#F2F2F7] p-6 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white rounded-[3rem] p-10 space-y-8 shadow-sm">

        <div className="relative flex items-center justify-center">
          <Calculator className="text-gray-300" size={40} />
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
              <label className="text-base text-gray-400 font-black uppercase">{label}</label>
              <div className="relative w-full h-24 rounded-2xl overflow-hidden flex items-center justify-center"
                style={{ background: isJoiner ? '#f3f4f6' : '#f9fafb' }}
              >
                {isJoiner ? (
                  <span
                    className="font-black text-gray-400 px-2 w-full text-center"
                    style={{ fontSize: getFontSize(value) }}
                  >
                    {value}
                  </span>
                ) : (
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={value}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      onChange(val === '' ? 0 : Number(val));
                    }}
                    className="absolute inset-0 w-full h-full border-none bg-transparent text-center font-black focus:outline-none px-2"
                    style={{ fontSize: getFontSize(value) }}
                  />
                )}
                {isJoiner && (
                  <div className="absolute top-2 right-2">
                    <Lock size={20} className="text-gray-400" strokeWidth={2.5} />
                  </div>
                )}
              </div>
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

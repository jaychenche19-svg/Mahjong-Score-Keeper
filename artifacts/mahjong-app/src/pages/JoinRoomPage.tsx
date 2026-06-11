import { ConfirmModal } from '../components/ui/ConfirmModal';
import type { ConfirmConfig } from '../types';

interface Props {
  joinInput: string;
  joinError: string;
  loading: boolean;
  confirmConfig: ConfirmConfig;
  onJoinInputChange: (val: string) => void;
  onJoinRoom: () => void;
  onBack: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function JoinRoomPage({
  joinInput, joinError, loading, confirmConfig,
  onJoinInputChange, onJoinRoom, onBack, onConfirm, onCancel,
}: Props) {
  return (
    <div className="min-h-screen bg-[#F2F2F7] p-6 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-500">
      <div className="space-y-6">
        <h2 className="text-4xl font-black text-center mb-8">加入房間</h2>
        <div className="bg-white rounded-[2.5rem] p-10 space-y-6 shadow-sm">
          <input
            className="w-full border-none bg-gray-100 text-center font-black text-4xl h-14 rounded-2xl focus:outline-none tracking-widest"
            value={joinInput}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '');
              if (val.length === 1 && val === '0') return;
              onJoinInputChange(val);
            }}
            maxLength={5}
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="• • • • •"
          />
          {joinError && <p className="text-red-500 font-black text-center text-lg">{joinError}</p>}
        </div>
        <button
          className="w-full h-16 bg-[#C7C7CC] text-gray-900 btn-spring rounded-[2.5rem] font-black text-lg"
          onClick={onJoinRoom}
          disabled={loading || joinInput.length === 0}
        >
          {loading ? '查詢中...' : '確認進入'}
        </button>
        <button onClick={onBack} className="w-full text-gray-400 font-bold mt-2">返回</button>
      </div>
      <ConfirmModal config={confirmConfig} onConfirm={onConfirm} onCancel={onCancel} />
    </div>
  );
}

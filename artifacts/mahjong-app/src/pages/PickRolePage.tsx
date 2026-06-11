import { ConfirmModal } from '../components/ui/ConfirmModal';
import type { ConfirmConfig, Player } from '../types';
import { BASE_ROLES } from '../utils/constants';

interface Props {
  myRole: number;
  isSinglePlayer: boolean;
  roomId: string;
  players: (Player | null)[];
  confirmConfig: ConfirmConfig;
  onSelectRole: (i: number) => void;
  onConfirmRole: () => void;
  onBack: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PickRolePage({
  myRole, isSinglePlayer, roomId, players, confirmConfig,
  onSelectRole, onConfirmRole, onBack, onConfirm, onCancel,
}: Props) {
  const takenRoles = players.map((p, i) => (p ? i : -1)).filter(i => i >= 0);

  return (
    <div className="min-h-screen bg-[#F2F2F7] p-6 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-500">
      <div className="space-y-8">
        {!isSinglePlayer && roomId && (
          <div className="bg-white rounded-[2rem] p-6 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs text-gray-400 font-black uppercase tracking-widest">房號</p>
              <p className="text-4xl font-black tracking-widest text-gray-900">{roomId}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-black mb-1">人數</p>
              <p className={`text-2xl font-black ${takenRoles.length >= 4 ? 'text-red-500' : 'text-green-500'}`}>
                {takenRoles.length}/4 {takenRoles.length >= 4 ? '已滿' : ''}
              </p>
            </div>
          </div>
        )}

        <h2 className="text-4xl font-black text-center text-gray-900 tracking-tighter">你是哪一位？</h2>

        <div className="grid grid-cols-2 gap-4">
          {BASE_ROLES.map((role, i) => {
            const taken = !isSinglePlayer && takenRoles.includes(i);
            const selected = myRole === i;
            return (
              <button
                key={i}
                disabled={taken && !selected}
                onClick={() => !taken && onSelectRole(i)}
                className={`h-40 rounded-[3rem] flex flex-col items-center justify-center transition-all border-none outline-none
                  ${selected
                    ? 'bg-[#3C3C3E] text-white scale-95 ring-4 ring-gray-200'
                    : taken
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : 'bg-white text-gray-400'}`}
              >
                <span className="text-5xl font-black mb-1">{role[0]}</span>
                <span className="text-xs font-black">{role}</span>
                {taken && !selected && <span className="text-xs text-gray-400 mt-1">已被選</span>}
              </button>
            );
          })}
        </div>

        <button
          disabled={myRole === -1}
          className={`w-full h-16 ${myRole === -1 ? 'bg-gray-200 text-gray-400' : 'bg-[#C7C7CC] text-gray-900'} rounded-[2.5rem] font-black text-lg border-none btn-spring`}
          onClick={onConfirmRole}
        >
          確認選擇
        </button>
        <button onClick={onBack} className="w-full text-gray-400 font-bold border-none mt-2">返回</button>
      </div>
      <ConfirmModal config={confirmConfig} onConfirm={onConfirm} onCancel={onCancel} />
    </div>
  );
}

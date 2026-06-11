import { AlertCircle } from 'lucide-react';
import type { ConfirmConfig } from '../../types';

interface Props {
  config: ConfirmConfig;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ config, onConfirm, onCancel }: Props) {
  if (!config.show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 space-y-8 shadow-2xl animate-in zoom-in-90 duration-300">
        <div className="text-center">
          <AlertCircle className="mx-auto text-blue-500 mb-4" size={48} />
          <p className="text-4xl font-black text-gray-900 mb-4 leading-tight">{config.title}</p>
          {config.description}
        </div>
        <div className="flex flex-col gap-4">
          <button
            onClick={onConfirm}
            className="w-full py-6 bg-[#34C759] text-white rounded-[2.2rem] text-3xl font-black active:scale-95 transition-transform duration-100"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            YES
          </button>
          <button
            onClick={onCancel}
            className="w-full py-6 bg-[#FF3B30] text-white rounded-[2.2rem] text-3xl font-black active:scale-95 transition-transform duration-100"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            NO
          </button>
        </div>
      </div>
    </div>
  );
}

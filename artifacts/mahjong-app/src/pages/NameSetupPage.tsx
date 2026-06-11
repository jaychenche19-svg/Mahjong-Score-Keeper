import { useState } from 'react';
import { Edit3 } from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import type { ConfirmConfig } from '../types';
import { BASE_ROLES } from '../utils/constants';

interface Props {
  myRole: number;
  myName: string;
  isSinglePlayer: boolean;
  customNames: string[];
  confirmConfig: ConfirmConfig;
  onMyNameChange: (val: string) => void;
  onOtherNameChange: (idx: number, val: string) => void;
  onNext: () => void;
  onBack: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const validateName = (val: string): string => {
  return val.replace(/[^a-zA-Z\u4e00-\u9fa5]/g, '');
};

export function NameSetupPage({
  myRole, myName, isSinglePlayer, customNames, confirmConfig,
  onMyNameChange, onOtherNameChange, onNext, onBack, onConfirm, onCancel,
}: Props) {
  const [nameError, setNameError] = useState('');
  const [otherErrors, setOtherErrors] = useState<string[]>(['', '', '', '']);

  const handleMyNameChange = (val: string) => {
    const filtered = validateName(val);
    if (val !== filtered) {
      if (/[0-9]/.test(val)) setNameError('不可以輸入數字');
      else setNameError('不可以輸入符號');
    } else {
      setNameError('');
    }
    if (filtered.length <= 5) onMyNameChange(filtered);
  };

  const handleOtherNameChange = (idx: number, val: string) => {
    const filtered = validateName(val);
    const newErrors = [...otherErrors];
    if (val !== filtered) {
      if (/[0-9]/.test(val)) newErrors[idx] = '不可以輸入數字';
      else newErrors[idx] = '不可以輸入符號';
    } else {
      newErrors[idx] = '';
    }
    setOtherErrors(newErrors);
    if (filtered.length <= 5) onOtherNameChange(idx, filtered || BASE_ROLES[idx]);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] p-6 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white rounded-[3rem] p-10 space-y-6 shadow-sm">
        <div className="text-center mb-4">
          <Edit3 className="mx-auto text-gray-300" size={40} />
        </div>
        <h2 className="text-4xl font-black text-center">你的稱呼</h2>

        <div className="space-y-1">
          <label className="ml-2 text-xs font-black text-blue-500">{BASE_ROLES[myRole]} (你)</label>
          <input
            placeholder={BASE_ROLES[myRole]}
            className="w-full h-16 border-none bg-blue-50 rounded-2xl text-center font-black text-2xl focus:outline-none ring-2 ring-blue-100"
            value={myName}
            onChange={e => handleMyNameChange(e.target.value)}
            maxLength={5}
          />
          {nameError && <p className="text-red-500 text-xs font-black text-center mt-1">{nameError}</p>}
        </div>

        {isSinglePlayer && (
          <div className="space-y-3 border-t pt-4">
            <p className="text-xs text-gray-400 font-black text-center">其他玩家稱呼</p>
            {BASE_ROLES.map((role, i) => i !== myRole && (
              <div key={i} className="space-y-1">
                <label className="ml-2 text-xs font-black text-gray-400">{role}</label>
                <input
                  placeholder={role}
                  className="w-full h-14 border-none bg-gray-50 rounded-2xl text-center font-black text-xl focus:outline-none"
                  defaultValue={customNames[i]}
                  onChange={e => handleOtherNameChange(i, e.target.value)}
                  maxLength={5}
                />
                {otherErrors[i] && <p className="text-red-500 text-xs font-black text-center mt-1">{otherErrors[i]}</p>}
              </div>
            ))}
          </div>
        )}

        <button
          className="w-full h-20 bg-[#C7C7CC] text-gray-900 rounded-[2rem] font-black text-xl border-none btn-spring"
          onClick={onNext}
        >
          下一步
        </button>
        <button onClick={onBack} className="w-full text-gray-400 font-bold border-none mt-2">返回</button>
      </div>
      <ConfirmModal config={confirmConfig} onConfirm={onConfirm} onCancel={onCancel} />
    </div>
  );
}

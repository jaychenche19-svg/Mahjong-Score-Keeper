import { useState, useRef } from 'react';
import { Edit3 } from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import type { ConfirmConfig } from '../types';
import { BASE_ROLES } from '../utils/constants';
import { dbCheckUsernameAll, dbRegisterTempUsername, getDeviceId } from '../lib/supabase';

interface Props {
  myRole: number;
  myName: string;
  isSinglePlayer: boolean;
  customNames: string[];
  confirmConfig: ConfirmConfig;
  defaultNameSetting: string;
  onMyNameChange: (val: string) => void;
  onOtherNameChange: (idx: number, val: string) => void;
  onNext: () => void;
  onBack: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const checkNameError = (val: string): string => {
  if (!val) return '';
  const hasOther = /[^a-zA-Z\u4e00-\u9fa5]/.test(val);
  if (hasOther) {
    if (/[0-9]/.test(val)) return '不可以輸入數字';
    return '不可以輸入符號';
  }
  const chineseCount = (val.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishCount = (val.match(/[a-zA-Z]/g) || []).length;
  if (chineseCount > 5) return '中文名稱不可超過五個字';
  if (englishCount > 7) return '英文名稱不可超過七個字母';
  return '';
};

function getDeviceId(): string {
  let id = localStorage.getItem('mj_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('mj_device_id', id);
  }
  return id;
}

export function NameSetupPage({
  myRole, myName, isSinglePlayer, customNames, confirmConfig, defaultNameSetting,
  onMyNameChange, onOtherNameChange, onNext, onBack, onConfirm, onCancel,
}: Props) {
  const [nameError, setNameError] = useState('');
  const [otherErrors, setOtherErrors] = useState<string[]>(['', '', '', '']);
  const [checking, setChecking] = useState(false);
  const composing = useRef(false);

  const handleMyNameChange = (val: string) => {
    onMyNameChange(val);
    if (!composing.current) setNameError(checkNameError(val));
  };

  const handleMyNameCompositionEnd = (val: string) => {
    composing.current = false;
    setNameError(checkNameError(val));
  };

  const handleOtherNameChange = (idx: number, val: string, isComposing: boolean) => {
    const newErrors = [...otherErrors];
    if (!isComposing) newErrors[idx] = checkNameError(val);
    setOtherErrors(newErrors);
    onOtherNameChange(idx, val || BASE_ROLES[idx]);
  };

  const handleNext = async () => {
    const err = checkNameError(myName);
    if (err) { setNameError(err); return; }

    if (myName && myName !== defaultNameSetting) {
      // 只有跟預設名字不同才檢查和存入臨時名字
      setChecking(true);
      const deviceId = getDeviceId();
      const isTaken = await dbCheckUsernameAll(myName, deviceId);
      setChecking(false);
      if (isTaken) {
        setNameError('用戶名稱已被使用');
        return;
      }
      await dbRegisterTempUsername(myName, deviceId);
    }

    onNext();
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
            onCompositionStart={() => { composing.current = true; setNameError(''); }}
            onCompositionEnd={e => handleMyNameCompositionEnd((e.target as HTMLInputElement).value)}
          />
          {nameError && (
            <p className="text-red-500 text-xs font-black text-center mt-1">{nameError}</p>
          )}
        </div>

        {isSinglePlayer && (
          <div className="space-y-3 border-t pt-4">
            <p className="text-xs text-gray-400 font-black text-center">其他玩家稱呼</p>
            {BASE_ROLES.map((role, i) => {
              const isComposingRef = { current: false };
              return i !== myRole && (
                <div key={i} className="space-y-1">
                  <label className="ml-2 text-xs font-black text-gray-400">{role}</label>
                  <input
                    placeholder={role}
                    className="w-full h-14 border-none bg-gray-50 rounded-2xl text-center font-black text-xl focus:outline-none"
                    defaultValue={customNames[i]}
                    onChange={e => handleOtherNameChange(i, e.target.value, isComposingRef.current)}
                    onCompositionStart={() => { isComposingRef.current = true; }}
                    onCompositionEnd={e => {
                      isComposingRef.current = false;
                      handleOtherNameChange(i, (e.target as HTMLInputElement).value, false);
                    }}
                  />
                  {otherErrors[i] && (
                    <p className="text-red-500 text-xs font-black text-center mt-1">{otherErrors[i]}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button
          className="w-full h-20 bg-[#C7C7CC] text-gray-900 rounded-[2rem] font-black text-xl border-none btn-spring"
          onClick={handleNext}
          disabled={checking}
        >
          {checking ? '檢查中...' : '下一步'}
        </button>
        <button onClick={onBack} className="w-full text-gray-400 font-bold border-none mt-2">返回</button>
      </div>
      <ConfirmModal config={confirmConfig} onConfirm={onConfirm} onCancel={onCancel} />
    </div>
  );
}

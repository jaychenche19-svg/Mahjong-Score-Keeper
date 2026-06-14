import { useState, useRef } from 'react';
import { PlusCircle, Users, User, Settings } from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import type { ConfirmConfig } from '../types';
import { dbCheckUsername, dbRegisterUsername } from '../lib/supabase';

const BTN_GRAY = 'bg-[#D1D1D6] text-gray-900 border-none shadow-none';

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

// 取得或產生裝置ID
function getDeviceId(): string {
  let id = localStorage.getItem('mj_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('mj_device_id', id);
  }
  return id;
}

interface Props {
  loading: boolean;
  confirmConfig: ConfirmConfig;
  settingsOpen: boolean;
  tempName: string;
  defaultNameSetting: string;
  vibrationEnabled: boolean;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onSinglePlayer: () => void;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
  onSaveSettings: () => void;
  onTempNameChange: (val: string) => void;
  onVibrationToggle: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LandingPage({
  loading, confirmConfig, settingsOpen, tempName, vibrationEnabled,
  onCreateRoom, onJoinRoom, onSinglePlayer, onOpenSettings, onCloseSettings,
  onSaveSettings, onTempNameChange, onVibrationToggle, onConfirm, onCancel,
}: Props) {
  const [nameError, setNameError] = useState('');
  const [checking, setChecking] = useState(false);
  const composing = useRef(false);

  const handleNameChange = (val: string) => {
    onTempNameChange(val);
    if (!composing.current) setNameError(checkNameError(val));
  };

  const handleSave = async () => {
    const err = checkNameError(tempName);
    if (err) { setNameError(err); return; }

    if (tempName) {
      setChecking(true);
      const deviceId = getDeviceId();
      const isTaken = await dbCheckUsername(tempName, deviceId);
      setChecking(false);
      if (isTaken) {
        setNameError('用戶名稱已被使用');
        return;
      }
      await dbRegisterUsername(tempName, deviceId);
    }

    setNameError('');
    onSaveSettings();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2F2F7] p-8 relative">
      <button
        onClick={onOpenSettings}
        className="absolute top-8 right-8 p-4 bg-white rounded-full shadow-sm text-gray-600 active:scale-95 transition-transform"
      >
        <Settings size={24} />
      </button>

      <div className="text-7xl mb-12 animate-bounce">🐶</div>
      <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-16">MJ Dog</h1>

      <div className="w-full max-w-xs space-y-4">
        <button
          className={`w-full h-16 ${BTN_GRAY} btn-spring rounded-[2.2rem] font-black text-lg flex justify-between items-center px-8`}
          onClick={onCreateRoom}
          disabled={loading}
        >
          {loading ? '建立中...' : '創建房間'} <PlusCircle size={20} />
        </button>
        <button
          className={`w-full h-16 ${BTN_GRAY} btn-spring rounded-[2.2rem] font-black text-lg flex justify-between items-center px-8`}
          onClick={onJoinRoom}
        >
          加入房間 <Users size={20} />
        </button>
        <button
          className={`w-full h-16 ${BTN_GRAY} btn-spring rounded-[2.2rem] font-black text-lg flex justify-between items-center px-8`}
          onClick={onSinglePlayer}
        >
          單人模式 <User size={20} />
        </button>
      </div>

      <ConfirmModal config={confirmConfig} onConfirm={onConfirm} onCancel={onCancel} />

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-8 space-y-6 shadow-2xl">
            <h2 className="text-3xl font-black text-gray-900 text-center">系統設定</h2>

            <div className="space-y-2">
              <label className="text-sm font-black text-gray-400 block ml-1">預設玩家名稱</label>
              <input
                placeholder="未設定"
                className="w-full h-14 border-none bg-gray-100 rounded-2xl text-center font-black text-xl focus:outline-none"
                value={tempName}
                onChange={e => handleNameChange(e.target.value)}
                onCompositionStart={() => { composing.current = true; setNameError(''); }}
                onCompositionEnd={e => {
                  composing.current = false;
                  setNameError(checkNameError((e.target as HTMLInputElement).value));
                }}
              />
              {nameError && (
                <p className="text-red-500 text-xs font-black text-center">{nameError}</p>
              )}
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
              <span className="font-black text-gray-700">按鍵震動回饋</span>
              <button
                type="button"
                onClick={onVibrationToggle}
                className={`w-16 h-8 rounded-full relative transition-colors duration-200 ${vibrationEnabled ? 'bg-[#34C759]' : 'bg-gray-300'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all duration-200 ${vibrationEnabled ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={checking}
                className="w-full py-4 bg-[#C7C7CC] text-gray-900 rounded-[1.8rem] text-xl font-black btn-spring"
              >
                {checking ? '檢查中...' : '儲存並關閉'}
              </button>
              <button
                type="button"
                onClick={onCloseSettings}
                className="w-full text-gray-400 font-bold py-2 text-center"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

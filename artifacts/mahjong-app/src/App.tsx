import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Calculator, Trophy, Users, User, PlusCircle, RotateCcw, Crown, RefreshCw, Home, Lock, Edit3, AlertCircle, Copy, Check, Settings } from 'lucide-react';

const SUPABASE_URL = 'https://xwueydousixrclhzrtrc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3dWV5ZG91c2l4cmNsaHpydHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzkyODMsImV4cCI6MjA5MzgxNTI4M30.eaA5cfkzIwU3JeTIYTFZvngk4uOByYL0D7UOHy_6Yuw';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const baseRoles = ['東風', '南風', '西風', '北風'];
const baseRoleShort = ['東', '南', '西', '北'];

function generateRoomId(): string {
  const chars = '0123456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

interface ConfirmConfig {
  show: boolean;
  title: string;
  description?: ReactNode;
  onConfirm: () => void;
}

interface Player {
  id: string;
  room_id: string;
  role_idx: number;
  name: string;
}

interface HistoryRecord {
  id: number;
  room_id?: string;
  winner: number;
  loser: number;
  amount: number;
  scores: number[];
}

function calcPayment({
  base, taiValue, huTai, winnerIdx, loserIdx, dealerIdx, renZhuang, numPlayers = 4,
}: {
  base: number; taiValue: number; huTai: number;
  winnerIdx: number; loserIdx: number; dealerIdx: number; renZhuang: number; numPlayers?: number;
}): { scores: number[]; displayTotal: number; perPlayerAmounts: { idx: number; amount: number }[] } {
  const isSelfDraw = loserIdx === -1;
  const scores = new Array(numPlayers).fill(0);
  const perPlayerAmounts: { idx: number; amount: number }[] = [];

  if (!isSelfDraw) {
    const winnerIsDealer = winnerIdx === dealerIdx;
    const loserIsDealer = loserIdx === dealerIdx;
    const dealerInvolved = winnerIsDealer || loserIsDealer;
    const dealerTai = dealerInvolved ? 1 : 0;
    const streakTai = dealerInvolved ? renZhuang * 2 : 0;
    const totalTai = huTai + dealerTai + streakTai;
    const amount = base + totalTai * taiValue;
    scores[winnerIdx] = amount;
    scores[loserIdx] = -amount;
    perPlayerAmounts.push({ idx: loserIdx, amount });
    return { scores, displayTotal: amount, perPlayerAmounts };
  } else {
    const winnerIsDealer = winnerIdx === dealerIdx;
    const selfDrawTai = 1;
    let totalWin = 0;
    for (let i = 0; i < numPlayers; i++) {
      if (i === winnerIdx) continue;
      const thisIsDealer = i === dealerIdx;
      const dealerInvolved = winnerIsDealer || thisIsDealer;
      const dealerTai = dealerInvolved ? 1 : 0;
      const streakTai = dealerInvolved ? renZhuang * 2 : 0;
      const totalTai = huTai + selfDrawTai + dealerTai + streakTai;
      const amount = base + totalTai * taiValue;
      scores[i] = -amount;
      totalWin += amount;
      perPlayerAmounts.push({ idx: i, amount });
    }
    scores[winnerIdx] = totalWin;
    return { scores, displayTotal: totalWin, perPlayerAmounts };
  }
}

export default function MahjongApp() {
  const [view, setView] = useState('landing');
  const [myRole, setMyRole] = useState(-1);
  const [isSinglePlayer, setIsSinglePlayer] = useState(false);
  const [customNames, setCustomNames] = useState<string[]>(['東風', '南風', '西風', '北風']);
  const [base, setBase] = useState(100);
  const [taiValue, setTaiValue] = useState(50);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [dealerIdx, setDealerIdx] = useState(0);
  const [renZhuang, setRenZhuang] = useState(0);
  const [winnerIdx, setWinnerIdx] = useState(0);
  const [loserIdx, setLoserIdx] = useState(-1);
  const [huTai, setHuTai] = useState<number | ''>('');
  const [roomId, setRoomId] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [players, setPlayers] = useState<(Player | null)[]>([null, null, null, null]);
  const [copied, setCopied] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>({ show: false, title: '', onConfirm: () => {} });
  const [myName, setMyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('score');
  const subsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [defaultNameSetting, setDefaultNameSetting] = useState('');
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [tempName, setTempName] = useState('');

  const hapticClick = () => {
    if (vibrationEnabled && typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const hapticSlide = () => {
    if (vibrationEnabled && typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  const triggerConfirm = (title: string, onConfirm: () => void, description?: ReactNode) => {
    hapticClick();
    setConfirmConfig({ show: true, title, onConfirm, description });
  };

  const deleteRoomIfUnstarted = async () => {
    setRoomId('');
  };

  const handleBackFromSetup = async () => {
    hapticClick();
    await deleteRoomIfUnstarted();
    setMyRole(-1);
    setMyName('');
    setView('landing');
  };

  const clearSubs = () => {
    subsRef.current.forEach(s => supabase.removeChannel(s));
    subsRef.current = [];
  };

  const subscribeRoom = (rid: string) => {
    clearSubs();
    const playersCh = supabase.channel(`players-${rid}`)
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${rid}` }, () => {
        fetchPlayers(rid);
      }).subscribe();
    const historyCh = supabase.channel(`history-${rid}`)
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'game_records', filter: `room_id=eq.${rid}` }, () => {
        fetchHistory(rid);
      }).subscribe();
    const roomCh = supabase.channel(`rooms-${rid}`)
      .on('postgres_changes' as any, { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${rid}` }, (payload: any) => {
        const r = payload.new;
        setRenZhuang(r.ren_zhuang);
      }).subscribe();
    subsRef.current = [playersCh, historyCh, roomCh];
  };

  const fetchPlayers = async (rid: string) => {
    const { data } = await supabase.from('players').select('*').eq('room_id', rid).order('role_idx');
    if (data) {
      const arr: (Player | null)[] = [null, null, null, null];
      (data as Player[]).forEach(p => { arr[p.role_idx] = p; });
      setPlayers(arr);
      const names = [...baseRoles];
      (data as Player[]).forEach(p => { names[p.role_idx] = p.name; });
      setCustomNames(names);
    }
  };

  const fetchHistory = async (rid: string) => {
    const { data } = await supabase.from('game_records').select('*').eq('room_id', rid).order('confirmed_at', { ascending: false });
    if (data) {
      setHistory(data.map((r: any) => ({
        id: r.id,
        room_id: r.room_id,
        winner: ['東', '南', '西', '北'].indexOf(r.winner) !== -1 ? ['東', '南', '西', '北'].indexOf(r.winner) : 0,
        loser: r.loser === '自摸' ? -1 : ['東', '南', '西', '北'].indexOf(r.loser),
        amount: r.total_win,
        scores: [r.east_change, r.south_change, r.west_change, r.north_change],
      })));
    }
  };

  const handleCreateRoom = () => {
    hapticClick();
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    setBase(100);
    setTaiValue(50);
    setView('pickRole');
  };

  const handleJoinRoom = async () => {
    hapticClick();
    setLoading(true);
    setJoinError('');
    const rid = joinInput.trim();

    if (rid.length < 5) {
      setJoinError('查無此房間');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from('rooms').select('*').eq('id', rid).single();
    if (error || !data) {
      setJoinError('查無此房間');
      setLoading(false);
      return;
    }

    const { data: ps } = await supabase.from('players').select('*').eq('room_id', rid);
    if (ps && ps.length >= 4) {
      setJoinError('此房間人數已滿');
      setLoading(false);
      return;
    }

    setRoomId(rid);
    setBase(data.bottom);
    setTaiValue(data.units);
    setRenZhuang(data.ren_zhuang);
    const arr: (Player | null)[] = [null, null, null, null];
    if (ps) (ps as Player[]).forEach(p => { arr[p.role_idx] = p; });
    setPlayers(arr);
    setLoading(false);
    setView('pickRole');
  };

  const handleJoinWithRole = async () => {
    setLoading(true);
    const name = myName || baseRoleShort[myRole];
    const { error: playerError } = await supabase.from('players').insert({ room_id: roomId, role_idx: myRole, name });
    console.log('players insert error:', JSON.stringify(playerError));
    subscribeRoom(roomId);
    await fetchPlayers(roomId);
    await fetchHistory(roomId);
    setLoading(false);
    setView('app');
  };

  const updateRoomState = async (dealer: number, ren: number) => {
    const dealerName = customNames[dealer] !== baseRoles[dealer]
      ? customNames[dealer]
      : baseRoleShort[dealer];
    await supabase.from('rooms').update({ dealer: dealerName, ren_zhuang: ren }).eq('id', roomId);
  };

  const handleAddRecord = () => {
    hapticClick();
    const currentBase = Number(base) || 0;
    const currentTaiValue = Number(taiValue) || 0;
    const currentHuTai = Number(huTai) || 0;
    const isSelfDraw = loserIdx === -1;

    const { scores, displayTotal, perPlayerAmounts } = calcPayment({
      base: currentBase,
      taiValue: currentTaiValue,
      huTai: currentHuTai,
      winnerIdx,
      loserIdx,
      dealerIdx,
      renZhuang,
    });

    const desc = (
      <div className="space-y-3 py-2 text-left bg-gray-50 p-5 rounded-3xl">
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-400">贏家</span>
          <span className="text-2xl font-black text-green-600">{customNames[winnerIdx]}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-400">方式</span>
          <span className="text-2xl font-black">{isSelfDraw ? '✨ 自摸' : `🔫 放槍 (${customNames[loserIdx]})`}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-400">胡台數</span>
          <span className="text-2xl font-black">{currentHuTai} 台</span>
        </div>
        {isSelfDraw ? (
          <div className="space-y-1 border-t border-dashed border-gray-200 pt-3">
            <p className="text-xs font-black text-gray-400 mb-2">各家付款明細</p>
            {perPlayerAmounts.map(({ idx, amount }) => {
              const thisIsDealer = idx === dealerIdx;
              const winnerIsDealer = winnerIdx === dealerIdx;
              const dealerInvolved = winnerIsDealer || thisIsDealer;
              return (
                <div key={idx} className="flex justify-between items-center">
                  <span className="font-bold text-gray-500 text-sm">
                    {customNames[idx]}{thisIsDealer ? ' 👑' : ''}
                  </span>
                  <span className="font-black text-red-500">
                    -${amount}
                    {dealerInvolved && <span className="text-xs text-gray-400 ml-1">(含莊{renZhuang > 0 ? `+連${renZhuang}` : ''})</span>}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          (() => {
            const winnerIsDealer = winnerIdx === dealerIdx;
            const loserIsDealer = loserIdx === dealerIdx;
            const dealerInvolved = winnerIsDealer || loserIsDealer;
            const dealerTai = dealerInvolved ? 1 : 0;
            const streakTai = dealerInvolved ? renZhuang * 2 : 0;
            return dealerTai + streakTai > 0 ? (
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-400">莊加成</span>
                <span className="text-lg font-black text-red-500">+{dealerTai + streakTai} 台</span>
              </div>
            ) : null;
          })()
        )}
        <hr className="border-dashed border-gray-200" />
        <div className="flex justify-between items-end">
          <span className="font-bold text-gray-900">{isSelfDraw ? '贏家總收' : '總金額'}</span>
          <span className="text-4xl font-black text-blue-600">${displayTotal}</span>
        </div>
      </div>
    );

    triggerConfirm("確認新增這筆紀錄？", async () => {
      const winnerAmount = scores[winnerIdx];
      if (isSinglePlayer) {
        setHistory([{ id: Date.now(), winner: winnerIdx, loser: loserIdx, amount: winnerAmount, scores }, ...history]);
      } else {
        const winnerName = customNames[winnerIdx] !== baseRoles[winnerIdx]
          ? customNames[winnerIdx]
          : baseRoleShort[winnerIdx];
        const loserName = loserIdx === -1
          ? '自摸'
          : (customNames[loserIdx] !== baseRoles[loserIdx] ? customNames[loserIdx] : baseRoleShort[loserIdx]);

        await supabase.from('game_records').insert({
          room_id: roomId,
          winner: winnerName,
          loser: loserName,
          total_win: winnerAmount,
          east_change: scores[0],
          south_change: scores[1],
          west_change: scores[2],
          north_change: scores[3],
        });
        await fetchHistory(roomId);
      }
      setHuTai('');
    }, desc);
  };

  const handleUndoLast = () => {
    if (history.length === 0) return;
    triggerConfirm("撤銷上一筆？", async () => {
      if (isSinglePlayer) {
        setHistory(history.slice(1));
      } else {
        const last = history[0];
        const { error } = await supabase.from('game_records').delete().eq('id', last.id);
        console.log('delete error:', JSON.stringify(error));
        await fetchHistory(roomId);
      }
    });
  };

  const handleDealerChange = async (val: number) => {
    setDealerIdx(val);
    if (!isSinglePlayer) await updateRoomState(val, renZhuang);
  };

  const handleRenZhuangChange = async (val: number) => {
    setRenZhuang(val);
    if (!isSinglePlayer) await updateRoomState(dealerIdx, val);
  };

  const handleReset = () => {
    triggerConfirm("重啟一將？", async () => {
      if (isSinglePlayer) { setHistory([]); return; }
      await supabase.from('game_records').delete().eq('room_id', roomId);
      await updateRoomState(0, 0);
    });
  };

  const handleBackToHome = () => {
    triggerConfirm("確定要返回主畫面嗎？", () => {
      clearSubs();
      setHistory([]); setView('landing'); setMyRole(-1);
      setHuTai(''); setRenZhuang(0); setDealerIdx(0);
      setWinnerIdx(0); setLoserIdx(-1);
      setCustomNames(['東風', '南風', '西風', '北風']);
      setBase(100); setTaiValue(50); setRoomId('');
      setJoinInput(''); setJoinError(''); setPlayers([null, null, null, null]);
      setIsSinglePlayer(false); setMyName(''); setActiveTab('score');
    }, <p className="text-gray-500">目前的對局紀錄將會被清空。</p>);
  };

  const totalScores = customNames.map((_, i) => history.reduce((sum, rec) => sum + (rec.scores[i] || 0), 0));
  const stats = customNames.map((p, i) => ({
    name: p,
    loseCount: history.filter(rec => rec.loser === i).length,
    selfDrawCount: history.filter(rec => rec.winner === i && rec.loser === -1).length,
  }));
  const loserKing = history.length > 0 ? [...stats].sort((a, b) => b.loseCount - a.loseCount)[0] : null;
  const selfDrawKing = history.length > 0 ? [...stats].sort((a, b) => b.selfDrawCount - a.selfDrawCount)[0] : null;

  const [pressedBtn, setPressedBtn] = useState<string | null>(null);
  const swipeTouchStartX = useRef<number | null>(null);
  const tabs = ['score', 'status', 'result'];
  const btnActive = "btn-spring";
  const btnGray = "bg-[#D1D1D6] text-gray-900 border-none shadow-none";
  const btnDark = "bg-[#C7C7CC] text-gray-900";
  const iosSpring = "animate-in fade-in zoom-in-95 duration-500";

  const CustomConfirmModal = () => {
    if (!confirmConfig.show) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
        <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 space-y-8 shadow-2xl">
          <div className="text-center">
            <AlertCircle className="mx-auto text-blue-500 mb-4" size={48} />
            <p className="text-4xl font-black text-gray-900 mb-4 leading-tight">{confirmConfig.title}</p>
            {confirmConfig.description}
          </div>
          <div className="flex flex-col gap-4">
            <button onClick={() => { hapticClick(); confirmConfig.onConfirm(); setConfirmConfig(prev => ({ ...prev, show: false })); }}
              className={`w-full py-6 bg-[#34C759] text-white rounded-[2.2rem] text-3xl font-black ${btnActive}`}>YES</button>
            <button onClick={() => { hapticClick(); setConfirmConfig(prev => ({ ...prev, show: false })); }}
              className={`w-full py-6 bg-[#FF3B30] text-white rounded-[2.2rem] text-3xl font-black ${btnActive}`}>NO</button>
          </div>
        </div>
      </div>
    );
  };

  if (view === 'landing') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2F2F7] p-8 relative">
      <button
        onClick={() => { hapticClick(); setTempName(defaultNameSetting); setSettingsOpen(true); }}
        className="absolute top-8 right-8 p-4 bg-white rounded-full shadow-sm text-gray-600 active:scale-95 transition-transform"
      >
        <Settings size={24} />
      </button>

      <div className="text-7xl mb-12 animate-bounce">🐶</div>
      <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-16">麻將狗</h1>
      <div className="w-full max-w-xs space-y-4">
        <button className={`w-full h-16 ${btnGray} ${btnActive} rounded-[2.2rem] font-black text-lg flex justify-between items-center px-8`} onClick={handleCreateRoom} disabled={loading}>
          {loading ? '建立中...' : '創建房間'} <PlusCircle size={20} />
        </button>
        <button className={`w-full h-16 ${btnGray} ${btnActive} rounded-[2.2rem] font-black text-lg flex justify-between items-center px-8`} onClick={() => { hapticClick(); setView('joinRoom'); }}>
          加入房間 <Users size={20} />
        </button>
        <button className={`w-full h-16 ${btnGray} ${btnActive} rounded-[2.2rem] font-black text-lg flex justify-between items-center px-8`} onClick={() => { hapticClick(); setIsSinglePlayer(true); setView('pickRole'); }}>
          單人模式 <User size={20} />
        </button>
      </div>

      <CustomConfirmModal />

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-8 space-y-6 shadow-2xl">
            <h2 className="text-3xl font-black text-gray-900 text-center">系統設定</h2>

            <div className="space-y-2">
              <label className="text-sm font-black text-gray-400 block ml-1">預設玩家名稱</label>
              <input
                placeholder="未設定 (使用風向作名稱)"
                className="w-full h-14 border-none bg-gray-100 rounded-2xl text-center font-black text-xl focus:outline-none"
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                maxLength={8}
              />
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
              <span className="font-black text-gray-700">按鍵震動回饋</span>
              <button
                type="button"
                onClick={() => {
                  const nextState = !vibrationEnabled;
                  setVibrationEnabled(nextState);
                  if (nextState && typeof window !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(50);
                  }
                }}
                className={`w-16 h-8 rounded-full relative transition-colors duration-200 ${vibrationEnabled ? 'bg-[#34C759]' : 'bg-gray-300'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all duration-200 ${vibrationEnabled ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  hapticClick();
                  if (tempName !== defaultNameSetting) {
                    triggerConfirm("確認修改預設名稱嗎？", () => {
                      setDefaultNameSetting(tempName);
                      setSettingsOpen(false);
                    });
                  } else {
                    setSettingsOpen(false);
                  }
                }}
                className={`w-full py-4 bg-[#C7C7CC] text-gray-900 rounded-[1.8rem] text-xl font-black ${btnActive}`}
              >
                儲存並關閉
              </button>
              <button
                type="button"
                onClick={() => { hapticClick(); setSettingsOpen(false); }}
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

  if (view === 'joinRoom') return (
    <div className={`min-h-screen bg-[#F2F2F7] p-6 flex flex-col justify-center ${iosSpring}`}>
      <div className="space-y-6">
        <h2 className="text-4xl font-black text-center mb-8">加入房間</h2>
        <div className="bg-white rounded-[2.5rem] p-10 space-y-4 shadow-sm">
          <input
            placeholder="輸入5位數字房號"
            className="w-full border-none bg-gray-100 text-center font-black text-4xl h-20 rounded-2xl focus:outline-none tracking-widest"
            value={joinInput}
            onChange={e => { setJoinInput(e.target.value.replace(/\D/g, '')); setJoinError(''); }}
            maxLength={5}
            inputMode="numeric"
            pattern="[0-9]*"
          />
          {joinError && <p className="text-red-500 font-black text-center text-lg">{joinError}</p>}
        </div>
        <button className={`w-full h-16 bg-[#C7C7CC] text-gray-900 ${btnActive} rounded-[2.5rem] font-black text-lg`}
          onClick={handleJoinRoom} disabled={loading || joinInput.length === 0}>
          {loading ? '查詢中...' : '確認進入'}
        </button>
        <button onClick={() => { hapticClick(); setJoinError(''); setView('landing'); }} className="w-full text-gray-400 font-bold mt-2">返回</button>
      </div>
      <CustomConfirmModal />
    </div>
  );

  if (view === 'pickRole') {
    const takenRoles = players.map((p, i) => (p ? i : -1)).filter(i => i >= 0);
    return (
      <div className={`min-h-screen bg-[#F2F2F7] p-6 flex flex-col justify-center ${iosSpring}`}>
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
            {baseRoles.map((role, i) => {
              const taken = !isSinglePlayer && takenRoles.includes(i);
              const selected = myRole === i;
              return (
                <button key={i} disabled={taken} onClick={() => { if (!taken) { hapticClick(); setMyRole(i); } }}
                  className={`h-40 rounded-[3rem] flex flex-col items-center justify-center transition-all border-none outline-none
                    ${selected ? 'bg-[#C7C7CC] text-gray-900 scale-95 ring-4 ring-gray-200' : taken ? 'bg-gray-100 text-gray-300' : 'bg-white text-gray-400'}`}>
                  <span className="text-5xl font-black mb-1">{role[0]}</span>
                  <span className="text-xs font-black">{role}</span>
                  {taken && <span className="text-xs text-gray-400 mt-1">已被選</span>}
                </button>
              );
            })}
          </div>
          <button disabled={myRole === -1}
            className={`w-full h-16 ${myRole === -1 ? 'bg-gray-200 text-gray-400' : 'bg-[#C7C7CC] text-gray-900'} rounded-[2.5rem] font-black text-lg border-none ${btnActive}`}
            onClick={() => {
              hapticClick();
              setMyName(defaultNameSetting);
              setView('nameSetup');
            }}>確認選擇</button>
          <button onClick={() => {
            hapticClick();
            if (isSinglePlayer) { setView('landing'); return; }
            if (players.some(p => p !== null)) { setView('joinRoom'); }
            else { handleBackFromSetup(); }
          }} className="w-full text-gray-400 font-bold border-none mt-2">返回</button>
        </div>
        <CustomConfirmModal />
      </div>
    );
  }

  if (view === 'nameSetup') return (
    <div className={`min-h-screen bg-[#F2F2F7] p-6 flex flex-col justify-center ${iosSpring}`}>
      <div className="bg-white rounded-[3rem] p-10 space-y-6 shadow-sm">
        <div className="text-center mb-4"><Edit3 className="mx-auto text-gray-300" size={40} /></div>
        <h2 className="text-4xl font-black text-center">你的稱呼</h2>
        <div className="space-y-1">
          <label className="ml-2 text-xs font-black text-blue-500">{baseRoles[myRole]} (你)</label>
          <input placeholder={baseRoles[myRole]}
            className="w-full h-16 border-none bg-blue-50 rounded-2xl text-center font-black text-2xl focus:outline-none ring-2 ring-blue-100"
            value={myName} onChange={e => setMyName(e.target.value)} maxLength={8} />
        </div>
        {isSinglePlayer && (
          <div className="space-y-3 border-t pt-4">
            <p className="text-xs text-gray-400 font-black text-center">其他玩家稱呼</p>
            {baseRoles.map((role, i) => i !== myRole && (
              <div key={i} className="space-y-1">
                <label className="ml-2 text-xs font-black text-gray-400">{role}</label>
                <input placeholder={role} className="w-full h-14 border-none bg-gray-50 rounded-2xl text-center font-black text-xl focus:outline-none"
                  defaultValue={customNames[i]}
                  onChange={e => { const n = [...customNames]; n[i] = e.target.value || baseRoles[i]; setCustomNames(n); }} />
              </div>
            ))}
          </div>
        )}
        <button className={`w-full h-20 bg-[#C7C7CC] text-gray-900 rounded-[2rem] font-black text-xl border-none ${btnActive}`}
          onClick={() => {
            hapticClick();
            const n = [...customNames];
            n[myRole] = myName || baseRoles[myRole];
            setCustomNames(n);
            setView('configSetup');
          }}>
          下一步
        </button>
        <button onClick={() => { hapticClick(); setView('pickRole'); }} className="w-full text-gray-400 font-bold border-none mt-2">返回</button>
      </div>
      <CustomConfirmModal />
    </div>
  );

  if (view === 'configSetup') {
    const isJoiner = !isSinglePlayer && players.some(p => p !== null);
    return (
      <div className={`min-h-screen bg-[#F2F2F7] p-6 flex flex-col justify-center ${iosSpring}`}>
        <div className="bg-white rounded-[3rem] p-10 space-y-8 shadow-sm">
          <div className="text-center mb-4"><Calculator className="mx-auto text-gray-300" size={40} /></div>
          <h2 className="text-4xl font-black text-center">底台設定</h2>
          {!isSinglePlayer && roomId && (
            <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-black">房號</p>
                <p className="text-2xl font-black tracking-widest">{roomId}</p>
              </div>
              <button className="flex items-center gap-2 bg-gray-200 rounded-xl px-4 py-2 font-black text-sm"
                onClick={() => { hapticClick(); navigator.clipboard?.writeText(roomId); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                {copied ? '已複製' : '複製房號'}
              </button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-center">
              <label className="text-gray-400 font-black text-sm uppercase">底</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={base}
                onChange={e => {
                  if (!isJoiner) {
                    const val = e.target.value.replace(/\D/g, '');
                    setBase(val === '' ? 0 : Number(val));
                  }
                }}
                readOnly={isJoiner}
                className={`w-full h-20 border-none rounded-2xl text-center font-black text-4xl focus:outline-none ${isJoiner ? 'bg-gray-100 text-gray-400' : 'bg-gray-50'}`} />
            </div>
            <div className="space-y-2 text-center">
              <label className="text-gray-400 font-black text-sm uppercase">台</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={taiValue}
                onChange={e => {
                  if (!isJoiner) {
                    const val = e.target.value.replace(/\D/g, '');
                    setTaiValue(val === '' ? 0 : Number(val));
                  }
                }}
                readOnly={isJoiner}
                className={`w-full h-20 border-none rounded-2xl text-center font-black text-4xl focus:outline-none ${isJoiner ? 'bg-gray-100 text-gray-400' : 'bg-gray-50'}`} />
            </div>
          </div>
          {isJoiner && <p className="text-center text-xs text-gray-400 font-black">底台由房主設定，無法更改</p>}
          <button className={`w-full h-20 bg-[#C7C7CC] text-gray-900 rounded-[2rem] font-black text-xl border-none ${btnActive}`}
            onClick={() => {
              hapticClick();
              if (isSinglePlayer) {
                const n = [...customNames]; n[myRole] = myName || baseRoles[myRole]; setCustomNames(n);
                setView('app');
              } else {
                triggerConfirm("確定開始遊戲嗎？", async () => {
                  if (!isJoiner) {
                    const nameMap = {
                      east_name: customNames[0] !== baseRoles[0] ? customNames[0] : '東',
                      south_name: customNames[1] !== baseRoles[1] ? customNames[1] : '南',
                      west_name: customNames[2] !== baseRoles[2] ? customNames[2] : '西',
                      north_name: customNames[3] !== baseRoles[3] ? customNames[3] : '北',
                    };
                    const { error } = await supabase.from('rooms').insert({
                      id: roomId,
                      bottom: base,
                      units: taiValue,
                      is_confirmed: true,
                      dealer: customNames[dealerIdx] !== baseRoles[dealerIdx]
                        ? customNames[dealerIdx]
                        : baseRoleShort[dealerIdx],
                      ren_zhuang: renZhuang,
                      ...nameMap,
                    });
                    if (error) { console.log('insert error:', JSON.stringify(error)); return; }
                  }
                  await handleJoinWithRole();
                }, <p className="text-xs text-red-500 font-bold">⚠️ 確認後進入遊戲將無法更改底台</p>);
              }
            }} disabled={loading}>
            {loading ? '進入中...' : '開打！'}
          </button>
          <button onClick={() => { hapticClick(); setView('nameSetup'); }} className="w-full text-gray-400 font-bold border-none">返回</button>
        </div>
        <CustomConfirmModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-44">
      <CustomConfirmModal />
      <header className="bg-white/70 backdrop-blur-2xl sticky top-0 z-40 px-5 py-4 flex justify-between items-center border-b border-gray-100">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { hapticClick(); handleBackToHome(); }}>
          <span className="text-2xl">🐶</span>
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter">麻將狗</h2>
        </div>
        <div className="flex items-center gap-2">
          {!isSinglePlayer && <span className="text-xs font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{roomId}</span>}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#C7C7CC] rounded-full text-gray-900">
            <span className="text-xs font-black">{customNames[myRole]}</span>
          </div>
        </div>
      </header>

      <div
        className="p-5"
        onTouchStart={e => { swipeTouchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (swipeTouchStartX.current === null) return;
          const diff = swipeTouchStartX.current - e.changedTouches[0].clientX;
          const currentIdx = tabs.indexOf(activeTab);
          if (diff > 60 && currentIdx < tabs.length - 1) { hapticClick(); setActiveTab(tabs[currentIdx + 1]); }
          if (diff < -60 && currentIdx > 0) { hapticClick(); setActiveTab(tabs[currentIdx - 1]); }
          swipeTouchStartX.current = null;
        }}
      >
        {activeTab === 'score' && (
          <div className={`space-y-4 ${iosSpring}`}>
            <div className="bg-white rounded-[2.5rem] p-3 shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-[2rem] p-5 text-center relative">
                  <p className="text-xs font-black text-gray-400 uppercase mb-1 tracking-widest">底</p>
                  <div className="text-4xl font-black text-gray-400">{base}</div>
                  <Lock className="absolute top-3 right-3 text-gray-200" size={12} />
                </div>
                <div className="bg-gray-50 rounded-[2rem] p-5 text-center relative">
                  <p className="text-xs font-black text-gray-400 uppercase mb-1 tracking-widest">台</p>
                  <div className="text-4xl font-black text-gray-400">{taiValue}</div>
                  <Lock className="absolute top-3 right-3 text-gray-200" size={12} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-[2.5rem] p-6 space-y-5 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-base font-black text-gray-900 ml-3 block">莊家</label>
                  <select className="w-full h-14 bg-gray-100 rounded-2xl px-4 font-black text-xl border-none outline-none appearance-none"
                    value={dealerIdx} onChange={e => { hapticSlide(); handleDealerChange(Number(e.target.value)); }}>
                    {customNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-base font-black text-gray-900 ml-3 block">連莊</label>
                  <select className="w-full h-14 bg-gray-100 rounded-2xl px-4 font-black text-xl border-none outline-none appearance-none"
                    value={renZhuang} onChange={e => { hapticSlide(); handleRenZhuangChange(Number(e.target.value)); }}>
                    {[...Array(19).keys()].map(n => <option key={n} value={n}>{n === 0 ? '0' : `連 ${n} 拉 ${n}`}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t pt-5 border-gray-50">
                <div className="space-y-2">
                  <label className="text-base font-black text-gray-900 ml-3 block">贏家</label>
                  <select className="w-full h-14 bg-gray-100 rounded-2xl px-4 font-black text-xl border-none outline-none appearance-none"
                    value={winnerIdx} onChange={e => { hapticSlide(); setWinnerIdx(Number(e.target.value)); }}>
                    {customNames.map((name, i) => <option key={i} value={i}>{name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-base font-black text-gray-900 ml-3 block">方式</label>
                  <select className="w-full h-14 bg-gray-100 rounded-2xl px-4 font-black text-xl border-none outline-none appearance-none"
                    value={loserIdx} onChange={e => { hapticSlide(); setLoserIdx(Number(e.target.value)); }}>
                    <option value={-1}>自摸 ✨</option>
                    {customNames.map((name, i) => i !== winnerIdx ? <option key={i} value={i}>{name} 🔫</option> : null)}
                  </select>
                </div>
              </div>
              <div className="space-y-2 text-center">
                <label className="text-sm font-black text-gray-400 uppercase tracking-widest block">
                  胡牌台數{loserIdx === -1 && <span className="text-blue-400 text-xs ml-2">(自摸 +1台)</span>}
                </label>
                <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="0" value={huTai}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setHuTai(val === '' ? '' : parseInt(val, 10));
                  }}
                  className="w-full h-20 bg-gray-50 border-none rounded-[2rem] text-center text-5xl font-black focus:outline-none" />
              </div>
              <button className={`w-full h-16 bg-[#C7C7CC] text-gray-900 text-xl font-black rounded-[2rem] ${btnActive} shadow-xl`} onClick={handleAddRecord}>
                確認紀錄
              </button>
            </div>
          </div>
        )}

        {activeTab === 'status' && (
          <div className={`space-y-4 ${iosSpring}`}>
            {customNames.map((name, i) => {
              const isMe = i === myRole;
              const isDealer = i === dealerIdx;
              return (
                <div key={i} className={`p-8 rounded-[3.5rem] flex justify-between items-center border-2 ${isMe ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent shadow-sm'} ${isDealer ? 'ring-4 ring-yellow-400/30' : ''}`}>
                  <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center font-black ${isDealer ? 'bg-yellow-400 text-gray-900 scale-110 shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                      {isDealer && <Crown size={18} className="mb-1 animate-bounce" />}
                      <span className="text-3xl">{baseRoles[i][0]}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className={`font-black text-3xl ${isMe ? 'text-blue-600' : 'text-gray-900'}`}>{name}{isMe && <span className="text-sm ml-2 font-bold opacity-60">(我)</span>}</span>
                      {isDealer && <span className="text-xs font-black text-yellow-600 tracking-widest">莊家連莊中</span>}
                    </div>
                  </div>
                  <div className={`text-5xl font-black ${totalScores[i] >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    {totalScores[i] >= 0 ? `+${totalScores[i]}` : totalScores[i]}
                  </div>
                </div>
              );
            })}
            <button className={`w-full h-20 text-gray-300 border-none mt-4 text-lg font-bold flex items-center justify-center gap-2 ${history.length === 0 ? 'opacity-30' : ''}`}
              onClick={() => { hapticClick(); handleUndoLast(); }} disabled={history.length === 0}>
              <RotateCcw size={24} /> 撤銷上一筆
            </button>
          </div>
        )}

        {activeTab === 'result' && (
          <div className={`space-y-6 pb-32 ${iosSpring}`}>
            <div className="bg-[#3C3C3E] p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Trophy size={120} /></div>
              <p className="font-black text-sm uppercase opacity-40 tracking-[0.4em]">🏆 自摸王</p>
              <h3 className="text-8xl font-black mt-6 tracking-tighter">{selfDrawKing && selfDrawKing.selfDrawCount > 0 ? selfDrawKing.name : '--'}</h3>
              <p className="text-3xl font-bold mt-2 text-yellow-400">{selfDrawKing ? selfDrawKing.selfDrawCount : 0} 次自摸</p>
            </div>
            <div className="bg-white p-12 rounded-[4rem] text-gray-900 border-4 border-gray-100 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 p-8 opacity-5"><Trophy size={120} /></div>
              <p className="font-black text-sm uppercase opacity-30 tracking-[0.4em]">🔫 放槍王</p>
              <h3 className="text-8xl font-black mt-6 tracking-tighter">{loserKing && loserKing.loseCount > 0 ? loserKing.name : '--'}</h3>
              <p className="text-3xl font-bold mt-2 text-red-500">{loserKing ? loserKing.loseCount : 0} 次被胡</p>
            </div>
            <div className="grid grid-cols-1 gap-4 pt-4">
              <button className={`w-full h-24 bg-white text-red-500 text-2xl font-black rounded-[3rem] border-none ${btnActive} shadow-lg flex items-center justify-center gap-3`} onClick={() => { hapticClick(); handleReset(); }}>
                <RefreshCw size={28} /> 重新一將
              </button>
              <button className={`w-full h-24 ${btnGray} rounded-[3rem] font-black text-2xl border-none ${btnActive} shadow-lg flex items-center justify-center gap-3`} onClick={() => { hapticClick(); handleBackToHome(); }}>
                <Home size={28} /> 返回主畫面
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[82%] max-w-xs z-50 rounded-[2.2rem] ios-glass-bar p-2 flex gap-2">
        {[
          { id: 'score',  icon: <Calculator size={22} />, label: '記分' },
          { id: 'status', icon: <Trophy size={22} />,     label: '狀態' },
          { id: 'result', icon: <Crown size={22} />,      label: '結果' },
        ].map(t => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onTouchStart={() => setPressedBtn(t.id)}
              onTouchEnd={() => { setPressedBtn(null); hapticClick(); setActiveTab(t.id); }}
              onClick={() => { hapticClick(); setActiveTab(t.id); }}
              className={`ios-glass-tab flex-1 h-16 rounded-[1.6rem] flex flex-col items-center justify-center gap-1
                ${isActive ? 'ios-glass-tab-active text-gray-900' : 'text-gray-400'}`}
            >
              <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                {t.icon}
              </span>
              <span className={`text-[10px] font-black tracking-wide transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

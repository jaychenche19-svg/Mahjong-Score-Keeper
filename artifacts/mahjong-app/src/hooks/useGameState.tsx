import { useState, useRef, type ReactNode } from 'react';
import {
  supabase, dbFetchPlayers, dbFetchHistory, dbJoinRoom, dbSubscribeRoom,
  dbInsertPlayer, dbInsertRecord, dbDeleteRecord,
  dbDeleteRoomRecords, dbUpdateRoomState, dbSelectSeat, dbReleaseSeat,
  dbReleaseUsername, getDeviceId,
} from '../lib/supabase';
import { generateRoomId } from '../utils/calcPayment';
import { BASE_ROLES, BASE_ROLE_SHORT, DEFAULT_BASE, DEFAULT_TAI } from '../utils/constants';
import { useHaptic } from './useHaptic';
import type { ConfirmConfig, Player, HistoryRecord } from '../types';

const INIT_NAMES = ['東', '南', '西', '北'];
const INIT_PLAYERS: (Player | null)[] = [null, null, null, null];

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxXA1S33zgMWtPHnt2XCG9v9aI9gbUUK8ucCnr7pLb38tRSnf1yeyBc42OYiqjgt-yJ/exec';

const sheetsAdd = async (data: {
  room_id: string;
  winner: string;
  loser: string;
  total_win: number;
  east_change: number;
  south_change: number;
  west_change: number;
  north_change: number;
  record_id: string | number;
}) => {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', ...data }),
    });
  } catch (e) {
    console.error('sheetsAdd error', e);
  }
};

const sheetsDelete = async (record_id: string | number) => {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', record_id }),
    });
  } catch (e) {
    console.error('sheetsDelete error', e);
  }
};

export function useGameState() {
  const [view, setView] = useState('landing');
  const [myRole, setMyRole] = useState(-1);
  const [isSinglePlayer, setIsSinglePlayer] = useState(false);
  const [isJoiner, setIsJoiner] = useState(false);
  const [myName, setMyName] = useState('');
  const [customNames, setCustomNames] = useState<string[]>([...INIT_NAMES]);

  const [roomId, setRoomId] = useState('');
  const [players, setPlayers] = useState<(Player | null)[]>([...INIT_PLAYERS]);
  const [loading, setLoading] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [copied, setCopied] = useState(false);
  const subsRef = useRef<ReturnType<typeof supabase.channel>[]>([]);

  const [base, setBase] = useState(DEFAULT_BASE);
  const [taiValue, setTaiValue] = useState(DEFAULT_TAI);

  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [dealerIdx, setDealerIdx] = useState(0);
  const [renZhuang, setRenZhuang] = useState(0);

  const [winnerIdx, setWinnerIdx] = useState(0);
  const [loserIdx, setLoserIdx] = useState(-1);
  const [huTai, setHuTai] = useState<number | ''>('');

  const [activeTab, setActiveTab] = useState('score');
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>({
    show: false, title: '', onConfirm: () => {},
  });

  const [defaultNameSetting, setDefaultNameSettingState] = useState(() => {
    return localStorage.getItem('mj_default_name') || '';
  });
  const setDefaultNameSetting = (name: string) => {
    localStorage.setItem('mj_default_name', name);
    setDefaultNameSettingState(name);
  };
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempName, setTempName] = useState('');

  const { vibrationEnabled, setVibrationEnabled, hapticClick, hapticSlide } = useHaptic();

  const triggerConfirm = (title: string, onConfirm: () => void, description?: ReactNode) => {
    hapticClick();
    setConfirmConfig({ show: true, title, onConfirm, description });
  };
  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, show: false }));

  const clearSubs = () => {
    subsRef.current.forEach(s => supabase.removeChannel(s));
    subsRef.current = [];
  };

  const fetchRoomPlayers = async (rid: string) => {
    const { data } = await supabase.from('players').select('*').eq('room_id', rid);
    const arr: (Player | null)[] = [null, null, null, null];
    (data ?? []).forEach((p: any) => {
      arr[p.role_idx] = { role_idx: p.role_idx, name: p.name } as Player;
    });
    setPlayers(arr);
  };

  const fetchPlayers = async (rid: string) => {
    const data = await dbFetchPlayers(rid);
    const arr: (Player | null)[] = [null, null, null, null];
    data.forEach(p => { arr[p.role_idx] = p; });
    setPlayers(arr);
    const names = [...INIT_NAMES];
    data.forEach(p => { names[p.role_idx] = p.name; });
    setCustomNames(names);
  };

  const fetchHistory = async (rid: string) => {
    const records = await dbFetchHistory(rid);
    setHistory(records);
  };

  const subscribeRoom = (rid: string) => {
    clearSubs();
    const channels = dbSubscribeRoom(rid, {
      onPlayersChange: () => fetchRoomPlayers(rid),
      onHistoryChange: () => fetchHistory(rid),
      onRoomUpdate: (roomData) => {
        setRenZhuang(roomData.ren_zhuang);
        setBase(roomData.bottom);
        setTaiValue(roomData.units);
      },
    });
    subsRef.current = channels;
  };

  const updateRoomState = async (dealer: number, ren: number) => {
    const dealerName = customNames[dealer] !== BASE_ROLES[dealer]
      ? customNames[dealer]
      : BASE_ROLE_SHORT[dealer];
    await dbUpdateRoomState(roomId, dealerName, ren);
  };

  const handleBackFromSetup = async () => {
    hapticClick();
    clearSubs();
    if (roomId && myRole !== -1) {
      await supabase.from('players').delete().eq('room_id', roomId).eq('role_idx', myRole);
    }
    if (roomId && !isJoiner) {
      await supabase.from('rooms').delete().eq('id', roomId).eq('is_confirmed', false);
    }
    // ✅ 只有用「你的稱呼」輸入的名字才刪，預設名字不刪
    if (myName && myName !== defaultNameSetting) {
      await dbReleaseUsername(getDeviceId());
    }
    setRoomId('');
    setMyRole(-1);
    setMyName('');
    setIsJoiner(false);
    setPlayers([...INIT_PLAYERS]);
    setView('landing');
  };

  const handleBackToHome = () => {
    triggerConfirm(
      '確定要返回主畫面嗎？',
      async () => {
        clearSubs();
        if (roomId && myRole !== -1) {
          await supabase.from('players').delete().eq('room_id', roomId).eq('role_idx', myRole);
        }
        // ✅ 只有用「你的稱呼」輸入的名字才刪，預設名字不刪
        if (myName && myName !== defaultNameSetting) {
          await dbReleaseUsername(getDeviceId());
        }
        setHistory([]); setView('landing'); setMyRole(-1);
        setHuTai(''); setRenZhuang(0); setDealerIdx(0);
        setWinnerIdx(0); setLoserIdx(-1);
        setCustomNames([...INIT_NAMES]);
        setBase(DEFAULT_BASE); setTaiValue(DEFAULT_TAI); setRoomId('');
        setJoinInput(''); setJoinError(''); setPlayers([...INIT_PLAYERS]);
        setIsSinglePlayer(false); setIsJoiner(false); setMyName(''); setActiveTab('score');
      },
      <p className="text-gray-500">目前的對局紀錄將會被清空。</p>
    );
  };

  const handleCreateRoom = async () => {
    hapticClick();
    let id = generateRoomId();
    while (id.startsWith('0')) id = generateRoomId();
    setLoading(true);
    await supabase.from('rooms').insert({
      id,
      bottom: DEFAULT_BASE,
      units: DEFAULT_TAI,
      dealer: '東',
      ren_zhuang: 0,
      east_name: '東',
      south_name: '南',
      west_name: '西',
      north_name: '北',
      is_confirmed: false,
    });
    setRoomId(id);
    setBase(DEFAULT_BASE);
    setTaiValue(DEFAULT_TAI);
    setIsSinglePlayer(false);
    setIsJoiner(false);
    setPlayers([...INIT_PLAYERS]);
    setMyRole(-1);
    subscribeRoom(id);
    setLoading(false);
    setView('pickRole');
  };

  const handleSelectSeat = async (i: number) => {
    hapticClick();
    if (isSinglePlayer) { setMyRole(i); return; }
    if (players[i] !== null) return;
    if (myRole !== -1 && myRole !== i) {
      await supabase.from('players').delete().eq('room_id', roomId).eq('role_idx', myRole);
    }
    if (myRole !== i) {
      await supabase.from('players').upsert({
        room_id: roomId, role_idx: i, name: '__pending__',
      }, { onConflict: 'room_id,role_idx' });
    }
    setMyRole(i);
    await fetchRoomPlayers(roomId);
  };

  const handleJoinRoom = async () => {
    hapticClick();
    setLoading(true);
    setJoinError('');
    const rid = joinInput.trim();
    if (rid.length < 5) { setJoinError('查無此房間'); setLoading(false); return; }
    const { data: room, error } = await supabase.from('rooms').select('*').eq('id', rid).single();
    if (error || !room) { setJoinError('查無此房間'); setLoading(false); return; }
    const { data: existingPlayers } = await supabase.from('players').select('*').eq('room_id', rid);
    const arr: (Player | null)[] = [null, null, null, null];
    (existingPlayers ?? []).forEach((p: any) => {
      arr[p.role_idx] = { role_idx: p.role_idx, name: p.name } as Player;
    });
    const takenCount = arr.filter(p => p !== null).length;
    if (takenCount >= 4) { setJoinError('此房間人數已滿'); setLoading(false); return; }
    setRoomId(rid);
    setBase(room.bottom);
    setTaiValue(room.units);
    setRenZhuang(room.ren_zhuang);
    setPlayers(arr);
    setIsJoiner(true);
    setLoading(false);
    subscribeRoom(rid);
    setView('pickRole');
  };

  const handleJoinWithRole = async () => {
    setLoading(true);
    try {
      const name = myName || BASE_ROLE_SHORT[myRole];
      await supabase.from('players').delete().eq('room_id', roomId).eq('role_idx', myRole).eq('name', '__pending__');
      await dbInsertPlayer(roomId, myRole, name);
      await fetchPlayers(roomId);
      await fetchHistory(roomId);
      setView('app');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async (isJoinerParam: boolean) => {
    if (!isJoinerParam) {
      const resolveName = (i: number) =>
        customNames[i] !== BASE_ROLES[i] ? customNames[i] : BASE_ROLE_SHORT[i];
      const { error } = await supabase.from('rooms').update({
        bottom: base, units: taiValue,
        dealer: resolveName(dealerIdx), ren_zhuang: renZhuang,
        east_name: resolveName(0), south_name: resolveName(1),
        west_name: resolveName(2), north_name: resolveName(3),
        is_confirmed: true,
      }).eq('id', roomId);
      if (error) return;
    }
    await handleJoinWithRole();
  };

  const handleDealerChange = async (val: number) => {
    setDealerIdx(val);
    if (!isSinglePlayer) await updateRoomState(val, renZhuang);
  };

  const handleRenZhuangChange = async (val: number) => {
    setRenZhuang(val);
    if (!isSinglePlayer) await updateRoomState(dealerIdx, val);
  };

  const saveRecord = async (scores: number[]) => {
    const winnerAmount = scores[winnerIdx];
    if (isSinglePlayer) {
      setHistory(prev => [{ id: Date.now(), winner: winnerIdx, loser: loserIdx, amount: winnerAmount, scores }, ...prev]);
    } else {
      const resolve = (idx: number) =>
        customNames[idx] !== BASE_ROLES[idx] ? customNames[idx] : BASE_ROLE_SHORT[idx];
      const record = {
        room_id: roomId,
        winner: resolve(winnerIdx),
        loser: loserIdx === -1 ? '自摸' : resolve(loserIdx),
        total_win: winnerAmount,
        east_change: scores[0], south_change: scores[1],
        west_change: scores[2], north_change: scores[3],
      };
      const inserted = await dbInsertRecord(record);
      await fetchHistory(roomId);

      // ✅ 新增時同步寫入試算表
      const recordId = inserted?.id ?? Date.now();
      await sheetsAdd({ ...record, record_id: recordId });
    }
    setHuTai('');
  };

  const handleUndoLast = () => {
    if (history.length === 0) return;
    triggerConfirm('撤銷上一筆？', async () => {
      if (isSinglePlayer) {
        setHistory(prev => prev.slice(1));
      } else {
        const recordId = history[0].id;
        await dbDeleteRecord(recordId);
        await fetchHistory(roomId);
        // ✅ 撤回時同步刪除試算表那筆
        await sheetsDelete(recordId);
      }
    });
  };

  const handleReset = () => {
    triggerConfirm('重啟一將？', async () => {
      if (isSinglePlayer) { setHistory([]); return; }
      await dbDeleteRoomRecords(roomId);
      await updateRoomState(0, 0);
    });
  };

  const totalScores = customNames.map((_, i) =>
    history.reduce((sum, rec) => sum + (rec.scores[i] || 0), 0)
  );
  const stats = customNames.map((name, i) => ({
    name,
    loseCount: history.filter(rec => rec.loser === i).length,
    selfDrawCount: history.filter(rec => rec.winner === i && rec.loser === -1).length,
  }));
  const loserKing = history.length > 0 ? [...stats].sort((a, b) => b.loseCount - a.loseCount)[0] : null;
  const selfDrawKing = history.length > 0 ? [...stats].sort((a, b) => b.selfDrawCount - a.selfDrawCount)[0] : null;

  return {
    view, myRole, isSinglePlayer, isJoiner, customNames, myName, roomId, players,
    loading, joinInput, joinError, copied, base, taiValue, history,
    dealerIdx, renZhuang, winnerIdx, loserIdx, huTai, activeTab,
    confirmConfig, defaultNameSetting, settingsOpen, tempName, vibrationEnabled,
    totalScores, stats, loserKing, selfDrawKing,
    setView, setMyRole, setIsSinglePlayer, setCustomNames, setMyName,
    setRoomId, setPlayers, setJoinInput, setJoinError, setCopied,
    setBase, setTaiValue, setActiveTab, closeConfirm,
    setDefaultNameSetting, setSettingsOpen, setTempName, setVibrationEnabled,
    setWinnerIdx, setLoserIdx, setHuTai, setDealerIdx, setRenZhuang,
    hapticClick, hapticSlide, triggerConfirm,
    fetchPlayers, fetchHistory, fetchRoomPlayers,
    handleCreateRoom, handleJoinRoom, handleJoinWithRole,
    handleStartGame, handleBackFromSetup, handleBackToHome,
    handleDealerChange, handleRenZhuangChange, handleSelectSeat,
    saveRecord, handleUndoLast, handleReset,
  };
}

      import { useState, useRef, type ReactNode } from 'react';
      import {
        supabase, dbFetchPlayers, dbFetchHistory, dbJoinRoom, dbSubscribeRoom,
        dbInsertRoom, dbInsertPlayer, dbInsertRecord, dbDeleteRecord,
        dbDeleteRoomRecords, dbUpdateRoomState,
      } from '../lib/supabase';
      import { generateRoomId } from '../utils/calcPayment';
      import { BASE_ROLES, BASE_ROLE_SHORT, DEFAULT_BASE, DEFAULT_TAI } from '../utils/constants';
      import { useHaptic } from './useHaptic';
      import type { ConfirmConfig, Player, HistoryRecord } from '../types';

      const INIT_NAMES = ['東風', '南風', '西風', '北風'];
      const INIT_PLAYERS: (Player | null)[] = [null, null, null, null];

      export function useGameState() {
        const [view, setView] = useState('landing');

        const [myRole, setMyRole] = useState(-1);
        const [isSinglePlayer, setIsSinglePlayer] = useState(false);
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

        const [defaultNameSetting, setDefaultNameSetting] = useState('');
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
            onPlayersChange: () => fetchPlayers(rid),
            onHistoryChange: () => fetchHistory(rid),
            onRoomUpdate: (ren) => setRenZhuang(ren),
          });
          subsRef.current = channels;
        };

        const updateRoomState = async (dealer: number, ren: number) => {
          const dealerName = customNames[dealer] !== BASE_ROLES[dealer]
            ? customNames[dealer]
            : BASE_ROLE_SHORT[dealer];
          await dbUpdateRoomState(roomId, dealerName, ren);
        };

        const handleBackFromSetup = () => {
          hapticClick();
          clearSubs();
          setRoomId('');
          setMyRole(-1);
          setMyName('');
          setPlayers([...INIT_PLAYERS]);
          setView('landing');
        };

        const handleBackToHome = () => {
          triggerConfirm(
            '確定要返回主畫面嗎？',
            () => {
              clearSubs();
              setHistory([]); setView('landing'); setMyRole(-1);
              setHuTai(''); setRenZhuang(0); setDealerIdx(0);
              setWinnerIdx(0); setLoserIdx(-1);
              setCustomNames([...INIT_NAMES]);
              setBase(DEFAULT_BASE); setTaiValue(DEFAULT_TAI); setRoomId('');
              setJoinInput(''); setJoinError(''); setPlayers([...INIT_PLAYERS]);
              setIsSinglePlayer(false); setMyName(''); setActiveTab('score');
            },
            <p className="text-gray-500">目前的對局紀錄將會被清空。</p>
          );
        };

        const handleCreateRoom = () => {
          hapticClick();
          let id = generateRoomId();
          // 確保不以0開頭
          while (id.startsWith('0')) id = generateRoomId();
          setRoomId(id);
          setBase(DEFAULT_BASE);
          setTaiValue(DEFAULT_TAI);
          setIsSinglePlayer(false);
          setPlayers([...INIT_PLAYERS]);
          setMyRole(-1);
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
          const result = await dbJoinRoom(rid);
          if (!result) { setJoinError('查無此房間'); setLoading(false); return; }
          if (result.players.length >= 4) { setJoinError('此房間人數已滿'); setLoading(false); return; }

          const { room, players: ps } = result;
          setRoomId(rid);
          setBase(room.bottom);
          setTaiValue(room.units);
          setRenZhuang(room.ren_zhuang);
          const arr: (Player | null)[] = [null, null, null, null];
          ps.forEach(p => { arr[p.role_idx] = p; });
          setPlayers(arr);
          setLoading(false);
          subscribeRoom(rid); // 即時訂閱，讓加入者看到其他人選座位
          setView('pickRole');
        };

        const handleJoinWithRole = async () => {
          setLoading(true);
          try {
            const name = myName || BASE_ROLE_SHORT[myRole];
            await dbInsertPlayer(roomId, myRole, name);
            subscribeRoom(roomId);
            await fetchPlayers(roomId);
            await fetchHistory(roomId);
            setView('app');
          } catch (e) {
            console.error(e);
          } finally {
            setLoading(false);
          }
        };

        const handleStartGame = async (isJoiner: boolean) => {
          if (!isJoiner) {
            const resolveName = (i: number) =>
              customNames[i] !== BASE_ROLES[i] ? customNames[i] : BASE_ROLE_SHORT[i];
            const { error } = await dbInsertRoom({
              id: roomId, bottom: base, units: taiValue,
              dealer: resolveName(dealerIdx),
              ren_zhuang: renZhuang,
              east_name: resolveName(0), south_name: resolveName(1),
              west_name: resolveName(2), north_name: resolveName(3),
            });
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
            await dbInsertRecord({
              room_id: roomId,
              winner: resolve(winnerIdx),
              loser: loserIdx === -1 ? '自摸' : resolve(loserIdx),
              total_win: winnerAmount,
              east_change: scores[0], south_change: scores[1],
              west_change: scores[2], north_change: scores[3],
            });
            await fetchHistory(roomId);
          }
          setHuTai('');
        };

        const handleUndoLast = () => {
          if (history.length === 0) return;
          triggerConfirm('撤銷上一筆？', async () => {
            if (isSinglePlayer) {
              setHistory(prev => prev.slice(1));
            } else {
              await dbDeleteRecord(history[0].id);
              await fetchHistory(roomId);
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
          view, myRole, isSinglePlayer, customNames, myName, roomId, players,
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
          fetchPlayers, fetchHistory,
          handleCreateRoom, handleJoinRoom, handleJoinWithRole,
          handleStartGame, handleBackFromSetup, handleBackToHome,
          handleDealerChange, handleRenZhuangChange,
          saveRecord, handleUndoLast, handleReset,
        };
      }

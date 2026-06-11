import { createClient } from '@supabase/supabase-js';
import type { Player, HistoryRecord } from '../types';

const SUPABASE_URL = 'https://xwueydousixrclhzrtrc.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3dWV5ZG91c2l4cmNsaHpydHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzkyODMsImV4cCI6MjA5MzgxNTI4M30.eaA5cfkzIwU3JeTIYTFZvngk4uOByYL0D7UOHy_6Yuw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 把 rooms 表的 east/south/west/north_name 轉成 players 陣列
function roomToPlayers(room: any): (Player | null)[] {
  const arr: (Player | null)[] = [null, null, null, null];
  const names = [room.east_name, room.south_name, room.west_name, room.north_name];
  const defaults = ['東', '南', '西', '北'];
  names.forEach((name, i) => {
    if (name && name !== defaults[i]) {
      arr[i] = { role_idx: i, name } as Player;
    }
  });
  return arr;
}

export async function dbFetchPlayers(rid: string): Promise<Player[]> {
  const { data } = await supabase.from('players').select('*').eq('room_id', rid).order('role_idx');
  return (data as Player[]) ?? [];
}

export async function dbFetchRoom(rid: string) {
  const { data } = await supabase.from('rooms').select('*').eq('id', rid).single();
  return data;
}

export async function dbFetchHistory(rid: string): Promise<HistoryRecord[]> {
  const { data } = await supabase
    .from('game_records')
    .select('*')
    .eq('room_id', rid)
    .order('confirmed_at', { ascending: false });
  if (!data) return [];
  return data.map((r: any) => ({
    id: r.id,
    room_id: r.room_id,
    winner: ['東', '南', '西', '北'].indexOf(r.winner) >= 0 ? ['東', '南', '西', '北'].indexOf(r.winner) : 0,
    loser: r.loser === '自摸' ? -1 : ['東', '南', '西', '北'].indexOf(r.loser),
    amount: r.total_win,
    scores: [r.east_change, r.south_change, r.west_change, r.north_change],
  }));
}

export interface RoomData {
  bottom: number;
  units: number;
  ren_zhuang: number;
  east_name: string;
  south_name: string;
  west_name: string;
  north_name: string;
  is_confirmed: boolean;
}

export async function dbJoinRoom(rid: string): Promise<{ room: RoomData; players: Player[] } | null> {
  const { data: room, error } = await supabase.from('rooms').select('*').eq('id', rid).single();
  if (error || !room) return null;
  const { data: players } = await supabase.from('players').select('*').eq('room_id', rid);
  return { room: room as RoomData, players: (players as Player[]) ?? [] };
}

export interface SubscriptionCallbacks {
  onPlayersChange: () => void;
  onHistoryChange: () => void;
  onRoomUpdate: (payload: any) => void;
}

export function dbSubscribeRoom(rid: string, callbacks: SubscriptionCallbacks) {
  const playersCh = supabase
    .channel(`players-${rid}`)
    .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${rid}` }, callbacks.onPlayersChange)
    .subscribe();
  const historyCh = supabase
    .channel(`history-${rid}`)
    .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'game_records', filter: `room_id=eq.${rid}` }, callbacks.onHistoryChange)
    .subscribe();
  const roomCh = supabase
    .channel(`rooms-${rid}`)
    .on('postgres_changes' as any, { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${rid}` }, (payload: any) => {
      callbacks.onRoomUpdate(payload.new);
    })
    .subscribe();
  return [playersCh, historyCh, roomCh];
}

export async function dbInsertRoom(params: {
  id: string; bottom: number; units: number; dealer: string; ren_zhuang: number;
  east_name: string; south_name: string; west_name: string; north_name: string;
  is_confirmed: boolean;
}) {
  return supabase.from('rooms').insert({ ...params });
}

export async function dbUpdateRoom(roomId: string, params: Partial<{
  bottom: number; units: number; dealer: string; ren_zhuang: number;
  east_name: string; south_name: string; west_name: string; north_name: string;
  is_confirmed: boolean;
}>) {
  return supabase.from('rooms').update(params).eq('id', roomId);
}

export async function dbInsertPlayer(room_id: string, role_idx: number, name: string) {
  return supabase.from('players').insert({ room_id, role_idx, name });
}

export async function dbInsertRecord(params: {
  room_id: string; winner: string; loser: string; total_win: number;
  east_change: number; south_change: number; west_change: number; north_change: number;
}) {
  return supabase.from('game_records').insert(params);
}

export async function dbDeleteRecord(id: number) {
  return supabase.from('game_records').delete().eq('id', id);
}

export async function dbDeleteRoomRecords(roomId: string) {
  return supabase.from('game_records').delete().eq('room_id', roomId);
}

export async function dbUpdateRoomState(roomId: string, dealer: string, ren_zhuang: number) {
  return supabase.from('rooms').update({ dealer, ren_zhuang }).eq('id', roomId);
}

// 選座位：把 rooms 表的對應 name 欄位改成 __taken__ 表示已被選
export async function dbSelectSeat(roomId: string, roleIdx: number, tempName: string) {
  const colMap = ['east_name', 'south_name', 'west_name', 'north_name'];
  return supabase.from('rooms').update({ [colMap[roleIdx]]: tempName }).eq('id', roomId);
}

// 釋放座位：把 rooms 表的對應 name 欄位改回預設
export async function dbReleaseSeat(roomId: string, roleIdx: number) {
  const colMap = ['east_name', 'south_name', 'west_name', 'north_name'];
  const defaults = ['東', '南', '西', '北'];
  return supabase.from('rooms').update({ [colMap[roleIdx]]: defaults[roleIdx] }).eq('id', roomId);
}

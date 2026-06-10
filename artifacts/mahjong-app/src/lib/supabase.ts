import { createClient } from '@supabase/supabase-js';
import type { Player, HistoryRecord } from '../types';

const SUPABASE_URL = 'https://xwueydousixrclhzrtrc.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3dWV5ZG91c2l4cmNsaHpydHJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzkyODMsImV4cCI6MjA5MzgxNTI4M30.eaA5cfkzIwU3JeTIYTFZvngk4uOByYL0D7UOHy_6Yuw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function dbFetchPlayers(rid: string): Promise<Player[]> {
  const { data } = await supabase.from('players').select('*').eq('room_id', rid).order('role_idx');
  return (data as Player[]) ?? [];
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
  onRoomUpdate: (ren_zhuang: number) => void;
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
      callbacks.onRoomUpdate(payload.new.ren_zhuang);
    })
    .subscribe();
  return [playersCh, historyCh, roomCh];
}

export async function dbInsertRoom(params: {
  id: string; bottom: number; units: number; dealer: string; ren_zhuang: number;
  east_name: string; south_name: string; west_name: string; north_name: string;
}) {
  return supabase.from('rooms').insert({ ...params, is_confirmed: true });
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

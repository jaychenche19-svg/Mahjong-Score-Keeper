import type { ReactNode } from 'react';

export interface ConfirmConfig {
  show: boolean;
  title: string;
  description?: ReactNode;
  onConfirm: () => void;
}

export interface Player {
  id: string;
  room_id: string;
  role_idx: number;
  name: string;
}

export interface HistoryRecord {
  id: number;
  room_id?: string;
  winner: number;
  loser: number;
  amount: number;
  scores: number[];
  isDraw?: boolean;
}

export interface StatEntry {
  name: string;
  loseCount: number;
  selfDrawCount: number;
}

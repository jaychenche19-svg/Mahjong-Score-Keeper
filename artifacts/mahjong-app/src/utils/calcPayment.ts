export function generateRoomId(): string {
  return Array.from({ length: 5 }, () => Math.floor(Math.random() * 10)).join('');
}

export interface PaymentParams {
  base: number;
  taiValue: number;
  huTai: number;
  winnerIdx: number;
  loserIdx: number;
  dealerIdx: number;
  renZhuang: number;
  numPlayers?: number;
}

export interface PaymentResult {
  scores: number[];
  displayTotal: number;
  perPlayerAmounts: { idx: number; amount: number }[];
}

export function calcPayment({
  base, taiValue, huTai, winnerIdx, loserIdx, dealerIdx, renZhuang, numPlayers = 4,
}: PaymentParams): PaymentResult {
  const isSelfDraw = loserIdx === -1;
  const scores = new Array(numPlayers).fill(0);
  const perPlayerAmounts: { idx: number; amount: number }[] = [];

  if (!isSelfDraw) {
    const dealerInvolved = winnerIdx === dealerIdx || loserIdx === dealerIdx;
    const dealerTai = dealerInvolved ? 1 : 0;
    const streakTai = dealerInvolved ? renZhuang * 2 : 0;
    const amount = base + (huTai + dealerTai + streakTai) * taiValue;
    scores[winnerIdx] = amount;
    scores[loserIdx] = -amount;
    perPlayerAmounts.push({ idx: loserIdx, amount });
    return { scores, displayTotal: amount, perPlayerAmounts };
  }

  let totalWin = 0;
  for (let i = 0; i < numPlayers; i++) {
    if (i === winnerIdx) continue;
    const dealerInvolved = winnerIdx === dealerIdx || i === dealerIdx;
    const dealerTai = dealerInvolved ? 1 : 0;
    const streakTai = dealerInvolved ? renZhuang * 2 : 0;
    const amount = base + (huTai + 1 + dealerTai + streakTai) * taiValue;
    scores[i] = -amount;
    totalWin += amount;
    perPlayerAmounts.push({ idx: i, amount });
  }
  scores[winnerIdx] = totalWin;
  return { scores, displayTotal: totalWin, perPlayerAmounts };
}

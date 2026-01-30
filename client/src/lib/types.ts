export interface Participant {
  id: string;
  name: string;
  department?: string;
  isWinner: boolean;
}

export interface Prize {
  id: string;
  name: string;
  count: number;
  image?: string;
  remaining: number;
}

export interface Winner {
  id: string;
  participantId: string;
  participantName: string;
  prizeId: string;
  prizeName: string;
  timestamp: number;
}

export interface LotteryState {
  participants: Participant[];
  prizes: Prize[];
  winners: Winner[];
  isDrawing: boolean;
  currentPrizeId: string | null;
}

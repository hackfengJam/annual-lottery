import { openDB, DBSchema } from 'idb';
import { Prize, Participant, Winner } from './types';

interface LotteryDB extends DBSchema {
  prizes: {
    key: string;
    value: Prize;
  };
  participants: {
    key: string;
    value: Participant;
  };
  winners: {
    key: string;
    value: Winner;
  };
}

const DB_NAME = 'annual-lottery-db';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB<LotteryDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('prizes')) {
        db.createObjectStore('prizes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('participants')) {
        db.createObjectStore('participants', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('winners')) {
        db.createObjectStore('winners', { keyPath: 'id' });
      }
    },
  });
};

export const db = {
  async getAllPrizes() {
    const db = await initDB();
    return db.getAll('prizes');
  },
  
  async addPrize(prize: Prize) {
    const db = await initDB();
    return db.put('prizes', prize);
  },
  
  async deletePrize(id: string) {
    const db = await initDB();
    return db.delete('prizes', id);
  },
  
  async clearPrizes() {
    const db = await initDB();
    return db.clear('prizes');
  },

  async getAllParticipants() {
    const db = await initDB();
    return db.getAll('participants');
  },
  
  async addParticipant(participant: Participant) {
    const db = await initDB();
    return db.put('participants', participant);
  },
  
  async clearParticipants() {
    const db = await initDB();
    return db.clear('participants');
  },

  async getAllWinners() {
    const db = await initDB();
    return db.getAll('winners');
  },
  
  async addWinner(winner: Winner) {
    const db = await initDB();
    return db.put('winners', winner);
  },
  
  async clearWinners() {
    const db = await initDB();
    return db.clear('winners');
  }
};

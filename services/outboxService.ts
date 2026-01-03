
import { openDB, IDBPDatabase } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm';

export enum OutboxItemType {
  VOICE = 'voice',
  SOS = 'sos'
}

export enum OutboxStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  ERROR = 'error'
}

export interface OutboxItem {
  id?: number;
  type: OutboxItemType;
  payload: any;
  status: OutboxStatus;
  createdAt: number;
  attempts: number;
}

const DB_NAME = 'TacticalRadioOutbox';
const STORE_NAME = 'queue';

class OutboxService {
  private db: Promise<IDBPDatabase>;

  constructor() {
    this.db = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('status', 'status');
          store.createIndex('type', 'type');
        }
      },
    });
  }

  async enqueue(type: OutboxItemType, payload: any) {
    const db = await this.db;
    const item: OutboxItem = {
      type,
      payload,
      status: OutboxStatus.PENDING,
      createdAt: Date.now(),
      attempts: 0
    };
    return db.add(STORE_NAME, item);
  }

  async getPendingItems(): Promise<OutboxItem[]> {
    const db = await this.db;
    const items = await db.getAllFromIndex(STORE_NAME, 'status', OutboxStatus.PENDING);
    return items.sort((a, b) => a.createdAt - b.createdAt);
  }

  async updateStatus(id: number, status: OutboxStatus, attemptsInc: boolean = false) {
    const db = await this.db;
    const item = await db.get(STORE_NAME, id);
    if (item) {
      item.status = status;
      if (attemptsInc) item.attempts += 1;
      await db.put(STORE_NAME, item);
    }
  }

  async deleteSentItems() {
    const db = await this.db;
    const items = await db.getAllFromIndex(STORE_NAME, 'status', OutboxStatus.SENT);
    for (const item of items) {
      await db.delete(STORE_NAME, item.id!);
    }
  }
}

export const outbox = new OutboxService();

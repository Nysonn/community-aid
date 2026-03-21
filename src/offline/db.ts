import { openDB, type IDBPDatabase } from "idb";
import type { EmergencyRequest, Offer, User } from "../types";

const DB_NAME = "communityaid-db";
const DB_VERSION = 2;

export interface PendingAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
}

interface CommunityAidDB {
  requests: {
    key: string;
    value: EmergencyRequest;
    indexes: { status: string; type: string };
  };
  offers: {
    key: string;
    value: Offer;
  };
  pendingActions: {
    key: string;
    value: PendingAction;
    indexes: { timestamp: number };
  };
  profile: {
    key: string;
    value: User;
  };
}

let dbInstance: IDBPDatabase<CommunityAidDB> | null = null;

export async function openDatabase(): Promise<IDBPDatabase<CommunityAidDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<CommunityAidDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const requestsStore = db.createObjectStore("requests", { keyPath: "id" });
        requestsStore.createIndex("status", "status");
        requestsStore.createIndex("type", "type");

        db.createObjectStore("offers", { keyPath: "id" });

        const pendingActionsStore = db.createObjectStore("pendingActions", {
          keyPath: "id",
        });
        pendingActionsStore.createIndex("timestamp", "timestamp");
      }

      if (oldVersion < 2) {
        db.createObjectStore("profile", { keyPath: "id" });
      }
    },
  });

  return dbInstance;
}

// Requests store

export async function getRequest(id: string): Promise<EmergencyRequest | undefined> {
  const db = await openDatabase();
  return db.get("requests", id);
}

export async function setRequest(request: EmergencyRequest): Promise<void> {
  const db = await openDatabase();
  await db.put("requests", request);
}

export async function saveRequestsToCache(requests: EmergencyRequest[]): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction("requests", "readwrite");
  await Promise.all([...requests.map((r) => tx.store.put(r)), tx.done]);
}

export async function getCachedRequests(): Promise<EmergencyRequest[]> {
  const db = await openDatabase();
  return db.getAll("requests");
}

// Offers store

export async function getOffer(id: string): Promise<Offer | undefined> {
  const db = await openDatabase();
  return db.get("offers", id);
}

export async function setOffer(offer: Offer): Promise<void> {
  const db = await openDatabase();
  await db.put("offers", offer);
}

export async function getAllCachedOffers(): Promise<Offer[]> {
  const db = await openDatabase();
  return db.getAll("offers");
}

// Pending actions store

export async function savePendingAction(action: PendingAction): Promise<void> {
  const db = await openDatabase();
  await db.put("pendingActions", action);
}

export async function getPendingAction(id: string): Promise<PendingAction | undefined> {
  const db = await openDatabase();
  return db.get("pendingActions", id);
}

export async function getAllPendingActions(): Promise<PendingAction[]> {
  const db = await openDatabase();
  return db.getAll("pendingActions");
}

export async function deletePendingAction(id: string): Promise<void> {
  const db = await openDatabase();
  await db.delete("pendingActions", id);
}

// Profile store

export async function saveProfileToCache(user: User): Promise<void> {
  const db = await openDatabase();
  await db.put("profile", user);
}

export async function getCachedProfile(): Promise<User | undefined> {
  const db = await openDatabase();
  const all = await db.getAll("profile");
  return all[0];
}

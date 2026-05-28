import type { ActorSubclass } from '@dfinity/agent';

export interface BackendService {
  saveSession: (gestures: string[]) => Promise<void>;
  getSessions: () => Promise<string[][]>;
  getSessionCount: () => Promise<bigint>;
  clearSessions: () => Promise<void>;
}

export declare const backend: ActorSubclass<BackendService>;
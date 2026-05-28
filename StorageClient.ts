import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../declarations/backend.did.js';

const canisterId = process.env.CANISTER_ID_BACKEND || 'rrkah-fqaaa-aaaaa-aaaaq-cai';

let actor: any = null;

async function getActor() {
  if (actor) return actor;

  const agent = new HttpAgent({
    host: process.env.DFX_NETWORK === 'ic' ? 'https://ic0.app' : 'http://127.0.0.1:4943',
  });

  if (process.env.DFX_NETWORK !== 'ic') {
    await agent.fetchRootKey();
  }

  actor = Actor.createActor(idlFactory, { agent, canisterId });
  return actor;
}

export async function saveSession(gestures: string[]): Promise<void> {
  try {
    const a = await getActor();
    await a.saveSession(gestures);
  } catch (err) {
    console.error('Failed to save session:', err);
  }
}

export async function getSessions(): Promise<string[][]> {
  try {
    const a = await getActor();
    return await a.getSessions();
  } catch (err) {
    console.error('Failed to get sessions:', err);
    return [];
  }
}
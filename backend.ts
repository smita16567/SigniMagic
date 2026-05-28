import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from './declarations/backend.did.js';

const canisterId = process.env.CANISTER_ID_BACKEND || 'rrkah-fqaaa-aaaaa-aaaaq-cai';

const agent = new HttpAgent({
  host:
    process.env.DFX_NETWORK === 'ic'
      ? 'https://ic0.app'
      : 'http://127.0.0.1:4943',
});

if (process.env.DFX_NETWORK !== 'ic') {
  agent.fetchRootKey().catch(console.error);
}

export const backend = Actor.createActor(idlFactory, {
  agent,
  canisterId,
});
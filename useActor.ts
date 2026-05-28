import { useState, useEffect } from 'react';
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../declarations/backend.did.js';

const canisterId = process.env.CANISTER_ID_BACKEND || 'rrkah-fqaaa-aaaaa-aaaaq-cai';

export function useActor() {
  const [actor, setActor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initActor() {
      try {
        const agent = new HttpAgent({
          host:
            process.env.DFX_NETWORK === 'ic'
              ? 'https://ic0.app'
              : 'http://127.0.0.1:4943',
        });

        if (process.env.DFX_NETWORK !== 'ic') {
          await agent.fetchRootKey();
        }

        const a = Actor.createActor(idlFactory, { agent, canisterId });
        setActor(a);
      } catch (err: any) {
        setError('Failed to connect to backend.');
      } finally {
        setIsLoading(false);
      }
    }

    initActor();
  }, []);

  return { actor, isLoading, error };
}
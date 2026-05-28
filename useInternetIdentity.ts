import { useState } from 'react';
import { AuthClient } from '@dfinity/auth-client';

export function useInternetIdentity() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async () => {
    setIsLoading(true);
    try {
      const authClient = await AuthClient.create();
      await authClient.login({
        identityProvider:
          process.env.DFX_NETWORK === 'ic'
            ? 'https://identity.ic0.app'
            : `http://127.0.0.1:4943/?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai`,
        onSuccess: () => {
          const identity = authClient.getIdentity();
          setPrincipal(identity.getPrincipal().toString());
          setIsAuthenticated(true);
          setIsLoading(false);
        },
        onError: () => {
          setIsLoading(false);
        },
      });
    } catch (err) {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const authClient = await AuthClient.create();
    await authClient.logout();
    setIsAuthenticated(false);
    setPrincipal(null);
  };

  return { isAuthenticated, principal, isLoading, login, logout };
}
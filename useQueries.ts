import { useState, useEffect } from 'react';
import { useActor } from './useActor';

export function useSessionHistory() {
  const { actor, isLoading: actorLoading } = useActor();
  const [sessions, setSessions] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!actor) return;
    setIsLoading(true);
    try {
      const result = await actor.getSessions();
      setSessions(result);
    } catch (err) {
      setError('Failed to load session history.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSession = async (gestures: string[]) => {
    if (!actor || gestures.length === 0) return;
    try {
      await actor.saveSession(gestures);
      await fetchSessions();
    } catch (err) {
      setError('Failed to save session.');
    }
  };

  useEffect(() => {
    if (!actorLoading && actor) {
      fetchSessions();
    }
  }, [actor, actorLoading]);

  return { sessions, isLoading, error, saveSession, fetchSessions };
}
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { loadData, saveData } from '../utils/storage';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState(null);
  const loadingRef = useRef(false);

  const refresh = useCallback(async () => {
    const fresh = await loadData();
    if (fresh) {
      setData(fresh);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!loadingRef.current) {
      loadingRef.current = true;
      refresh().then(() => { loadingRef.current = false; });
    }
  }, [refresh]);

  // Listen for data changes
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('toto-data-changed', handler);
    return () => window.removeEventListener('toto-data-changed', handler);
  }, [refresh]);

  const updateData = useCallback(async (newData) => {
    // Deep clone to ensure React detects state change
    const cloned = JSON.parse(JSON.stringify(newData));
    setData(cloned);
    await saveData(cloned);
  }, []);

  // Settings
  const getSetting = useCallback((key) => {
    return data?.app?.settings?.[key] ?? false;
  }, [data]);

  const updateSettings = useCallback(async (newSettings) => {
    if (!data) return;
    data.app.settings = { ...data.app.settings, ...newSettings };
    await updateData(data);
  }, [data, updateData]);

  // Scoring config
  const getScoringConfig = useCallback(() => {
    const defaults = {
      matchOutcome: 3, goalDifference: 3, teamGoals: 1,
      offByOne: 1, exactScore: 1,
      groupFinalist: 1, finalist: 15, champion: 25, thirdPlace: 10,
    };
    return { ...defaults, ...(data?.app?.scoring || {}) };
  }, [data]);

  const updateScoring = useCallback(async (newScoring) => {
    if (!data) return;
    data.app.scoring = { ...data.app.scoring, ...newScoring };
    await updateData(data);
  }, [data, updateData]);

  // Matches
  const deleteMatch = useCallback(async (matchId) => {
    if (!data) return;
    // Remove match
    data.matches = data.matches.filter(m => m.id !== matchId);
    // Clean up predictions for this match across all users
    for (const userId of Object.keys(data.predictions)) {
      if (data.predictions[userId][matchId]) {
        delete data.predictions[userId][matchId];
      }
    }
    await updateData(data);
  }, [data, updateData]);

  const updateMatchScore = useCallback(async (matchId, score1, score2) => {
    if (!data) return;
    const match = data.matches.find(m => m.id === matchId);
    if (match) {
      match.score1 = score1;
      match.score2 = score2;
      match.played = score1 !== null && score2 !== null;
      await updateData(data);
    }
  }, [data, updateData]);

  const addMatch = useCallback(async (matchData) => {
    if (!data) return null;
    if (!data.matches) data.matches = [];
    const maxOrder = data.matches.reduce((max, m) => Math.max(max, m.matchOrder || 0), 0);
    const newMatch = {
      id: `M${maxOrder + 1}`,
      score1: null,
      score2: null,
      played: false,
      stage: 'playoff',
      matchOrder: maxOrder + 1,
      ...matchData,
    };
    data.matches.push(newMatch);
    await updateData(data);
    return newMatch;
  }, [data, updateData]);

  // Predictions
  const savePrediction = useCallback(async (userId, matchId, score1, score2) => {
    if (!data) return;
    if (!data.predictions[userId]) {
      data.predictions[userId] = {};
    }
    data.predictions[userId][matchId] = { score1: Number(score1), score2: Number(score2) };
    await updateData(data);
  }, [data, updateData]);

  const getUserPredictions = useCallback((userId) => {
    return data?.predictions[userId] || {};
  }, [data]);

  // Finals
  const saveFinals = useCallback(async (userId, finalsData) => {
    if (!data) return;
    data.finals[userId] = finalsData;
    await updateData(data);
  }, [data, updateData]);

  const getUserFinals = useCallback((userId) => {
    return data?.finals[userId] || {};
  }, [data]);

  // Winners
  const saveWinner = useCallback(async (userId, winnerData) => {
    if (!data) return;
    data.winners[userId] = winnerData;
    await updateData(data);
  }, [data, updateData]);

  const getUserWinner = useCallback((userId) => {
    return data?.winners[userId] || {};
  }, [data]);

  // Users (admin)
  const approveUser = useCallback(async (userId) => {
    if (!data) return;
    const user = data.users.find(u => u.id === userId);
    if (user) {
      user.status = 'approved';
      await updateData(data);
      window.dispatchEvent(new Event('toto-data-changed'));
    }
  }, [data, updateData]);

  const rejectUser = useCallback(async (userId) => {
    if (!data) return;
    data.users = data.users.filter(u => u.id !== userId);
    await updateData(data);
    window.dispatchEvent(new Event('toto-data-changed'));
  }, [data, updateData]);

  const deleteUser = useCallback(async (userId) => {
    if (!data) return;
    data.users = data.users.filter(u => u.id !== userId);
    delete data.predictions[userId];
    delete data.finals[userId];
    delete data.winners[userId];
    await updateData(data);
  }, [data, updateData]);

  // Actual results (admin)
  const setActualFinals = useCallback(async (finalsData) => {
    if (!data) return;
    data.actualFinals = finalsData;
    await updateData(data);
  }, [data, updateData]);

  const setActualWinners = useCallback(async (winnersData) => {
    if (!data) return;
    data.actualWinners = winnersData;
    await updateData(data);
  }, [data, updateData]);

  // Sort matches by date
  const getSortedMatches = useCallback(() => {
    return [...(data?.matches || [])].sort((a, b) => {
      const dateA = a.dateTime ? new Date(a.dateTime).getTime() : 0;
      const dateB = b.dateTime ? new Date(b.dateTime).getTime() : 0;
      return dateA - dateB;
    });
  }, [data]);

  if (!data) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    );
  }

  return (
    <DataContext.Provider value={{
      data, refresh,
      getSetting, updateSettings,
      getScoringConfig, updateScoring,
      updateMatchScore, deleteMatch, addMatch,
      savePrediction, getUserPredictions,
      saveFinals, getUserFinals,
      saveWinner, getUserWinner,
      approveUser, rejectUser, deleteUser,
      setActualFinals, setActualWinners,
      getSortedMatches,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

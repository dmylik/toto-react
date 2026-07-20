import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function WinnerPage() {
  const { data, saveWinner, getUserWinner } = useData();
  const { user } = useAuth();
  const existingWinner = getUserWinner(user?.id);
  const isLocked = data.app?.settings?.lockWinnerSelection;

  const [winners, setWinners] = useState({
    first: existingWinner.first || '',
    second: existingWinner.second || '',
    third: existingWinner.third || '',
  });
  const [saved, setSaved] = useState(false);

  // Read-only locked view — показываем выбранное, но не даём редактировать
  if (isLocked) {
    return (
      <div className="winner-page">
        <div className="lock-notice">
          <span role="img" aria-label="lock">🔒</span> Выбор призёров заблокирован администратором
        </div>
        <h1 className="page-title">🏆 Призёры турнира</h1>
        <p className="page-subtitle">Ваш выбор (изменение недоступно)</p>

        <div className="winners-selector winners-readonly">
          <div className="winner-row">
            <span className="winner-label">🥇 1-е место</span>
            <span className="winner-value">{winners.first || '—'}</span>
          </div>
          <div className="winner-row">
            <span className="winner-label">🥈 2-е место</span>
            <span className="winner-value">{winners.second || '—'}</span>
          </div>
          <div className="winner-row">
            <span className="winner-label">🥉 3-е место</span>
            <span className="winner-value">{winners.third || '—'}</span>
          </div>
        </div>
      </div>
    );
  }

  // Collect all unique teams
  const allTeams = [];
  Object.values(data.groups).forEach(group => {
    group.teams.forEach(team => {
      if (!allTeams.includes(team)) allTeams.push(team);
    });
  });
  allTeams.sort();

  const updateWinner = (position, value) => {
    setWinners(prev => ({ ...prev, [position]: value }));
  };

  const handleSave = () => {
    if (!winners.first) return;
    saveWinner(user.id, winners);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isTeamSelected = (team) => {
    return winners.first === team || winners.second === team || winners.third === team;
  };

  return (
    <div className="winner-page">
      <h1 className="page-title">🏆 Выбор призёров турнира</h1>
      <p className="page-subtitle">Кто займёт 1-е, 2-е и 3-е место на Чемпионате мира 2026?</p>

      <div className="winners-selector">
        <div className="winner-row">
          <span className="winner-label">🥇 1-е место</span>
          <select
            value={winners.first}
            onChange={e => updateWinner('first', e.target.value)}
            className="winner-select"
          >
            <option value="">-- Выберите чемпиона --</option>
            {allTeams.map(team => (
              <option key={team} value={team} disabled={team !== winners.first && isTeamSelected(team)}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <div className="winner-row">
          <span className="winner-label">🥈 2-е место</span>
          <select
            value={winners.second}
            onChange={e => updateWinner('second', e.target.value)}
            className="winner-select"
          >
            <option value="">-- Выберите 2-е место --</option>
            {allTeams.map(team => (
              <option key={team} value={team} disabled={team !== winners.second && isTeamSelected(team)}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <div className="winner-row">
          <span className="winner-label">🥉 3-е место</span>
          <select
            value={winners.third}
            onChange={e => updateWinner('third', e.target.value)}
            className="winner-select"
          >
            <option value="">-- Выберите 3-е место --</option>
            {allTeams.map(team => (
              <option key={team} value={team} disabled={team !== winners.third && isTeamSelected(team)}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn-primary btn-save-winner"
          onClick={handleSave}
          disabled={!winners.first}
        >
          {saved ? '✓ Сохранено' : 'Сохранить выбор'}
        </button>
      </div>

      {winners.first && (
        <div className="winners-preview">
          <p>🥇 {winners.first}</p>
          {winners.second && <p>🥈 {winners.second}</p>}
          {winners.third && <p>🥉 {winners.third}</p>}
        </div>
      )}
    </div>
  );
}

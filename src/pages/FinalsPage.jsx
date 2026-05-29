import { useState, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function FinalsPage() {
  const { data, saveFinals, getUserFinals } = useData();
  const { user } = useAuth();
  const existingFinals = getUserFinals(user?.id);
  const isLocked = data.app?.settings?.lockFinalsSelection;

  const [savedGroup, setSavedGroup] = useState(null);

  if (isLocked) {
    return (
      <div className="page-message">
        <h2>🔒 Выбор финалистов заблокирован</h2>
        <p>Администратор временно отключил возможность выбора финалистов.</p>
      </div>
    );
  }

  // Per-group selection
  const GroupFinals = ({ groupKey }) => {
    const group = data.groups[groupKey];
    const [selected, setSelected] = useState(() => existingFinals[groupKey] || []);

    const toggleTeam = (team) => {
      setSelected(prev => {
        const idx = prev.indexOf(team);
        if (idx >= 0) return prev.filter(t => t !== team);
        if (prev.length < 2) return [...prev, team];
        return prev;
      });
    };

    const handleSave = () => {
      const allFinals = { ...existingFinals, [groupKey]: selected };
      saveFinals(user.id, allFinals);
      setSavedGroup(groupKey);
      setTimeout(() => setSavedGroup(null), 2000);
    };

    return (
      <div className="finals-group-card">
        <h3>{group.name}</h3>
        <div className="finals-teams">
          {group.teams.map(team => {
            const isSelected = selected.includes(team);
            return (
              <button key={team}
                className={`finals-team-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleTeam(team)}>
                {team}
                {isSelected && <span className="check-mark">✓</span>}
              </button>
            );
          })}
        </div>
        <div className="finals-group-actions">
          <span className="finals-count">Выбрано: {selected.length}/2</span>
          <button className="btn-small btn-save-group"
            onClick={handleSave}
            disabled={selected.length !== 2}>
            {savedGroup === groupKey ? '✓' : 'Сохранить'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="finals-page">
      <h1 className="page-title">🎯 Выбор финалистов групп</h1>
      <p className="page-subtitle">Выберите по 2 команды из каждой группы, которые пройдут в плей-офф</p>

      <div className="finals-grid">
        {Object.keys(data.groups).map(key => (
          <GroupFinals key={key} groupKey={key} />
        ))}
      </div>
    </div>
  );
}

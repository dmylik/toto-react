import { useState, useEffect, useRef } from 'react';

export default function GroupFinals({ groupKey, group, existingFinals, onSave }) {
  const [selected, setSelected] = useState(() => existingFinals[groupKey] || []);
  const prevSavedRef = useRef(null);

  // Sync local state when saved data changes (e.g. after saving another group)
  useEffect(() => {
    const saved = existingFinals[groupKey] || [];
    const savedKey = JSON.stringify(saved);
    // Only sync if saved data actually changed (avoids cascading re-renders)
    if (prevSavedRef.current !== savedKey) {
      prevSavedRef.current = savedKey;
      setSelected(saved);
    }
  }, [existingFinals[groupKey]]);

  const toggleTeam = (team) => {
    setSelected(prev => {
      const idx = prev.indexOf(team);
      if (idx >= 0) return prev.filter(t => t !== team);
      if (prev.length < 2) return [...prev, team];
      return prev;
    });
  };

  const handleSave = () => {
    onSave(groupKey, selected);
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
          Сохранить
        </button>
      </div>
    </div>
  );
}

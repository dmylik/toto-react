export default function GroupFinalsReadOnly({ groupKey, group, existingFinals }) {
  const selected = existingFinals[groupKey] || [];

  return (
    <div className="finals-group-card read-only">
      <h3>{group.name}</h3>
      <div className="finals-teams">
        {group.teams.map(team => {
          const isSelected = selected.includes(team);
          return (
            <div
              key={team}
              className={`finals-team-display ${isSelected ? 'selected' : 'not-selected'}`}
            >
              <span>{team}</span>
              {isSelected && <span className="check-mark">✓</span>}
            </div>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div className="finals-group-actions">
          <span className="finals-count" style={{ color: '#22c55e' }}>
            Выбрано: {selected.join(', ')}
          </span>
        </div>
      )}
      {selected.length === 0 && (
        <div className="finals-group-actions">
          <span className="finals-count" style={{ color: '#ef4444' }}>
            Не выбраны
          </span>
        </div>
      )}
    </div>
  );
}

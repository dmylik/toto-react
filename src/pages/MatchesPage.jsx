import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import MatchCard from '../components/MatchCard';

export default function MatchesPage() {
  const { data, getSortedMatches, deleteMatch } = useData();
  const { user } = useAuth();
  const [filter, setFilter] = useState('upcoming');
  const [groupFilter, setGroupFilter] = useState('all');
  const [showPlayoff, setShowPlayoff] = useState(false);

  const isLocked = data.app?.settings?.lockPredictions;
  const playoffLocked = data.app?.settings?.lockPlayoffSection;
  const groupKeys = Object.keys(data.groups);

  const sortedMatches = useMemo(() => getSortedMatches(), [getSortedMatches]);

  const groupMatches = useMemo(() => sortedMatches.filter(m => m.stage === 'group'), [sortedMatches]);
  const playoffMatches = useMemo(() => sortedMatches.filter(m => m.stage !== 'group'), [sortedMatches]);

  const filteredMatches = useMemo(() => {
    const now = Date.now();
    let matches = showPlayoff ? playoffMatches : groupMatches;

    if (filter === 'upcoming') {
      matches = matches.filter(m => !m.played && new Date(m.dateTime).getTime() > now);
    } else if (filter === 'today') {
      const today = new Date().toISOString().slice(0, 10);
      matches = matches.filter(m => m.dateTime && m.dateTime.startsWith(today));
    } else if (filter === 'played') {
      matches = matches.filter(m => m.played);
    }

    if (!showPlayoff && groupFilter !== 'all') {
      matches = matches.filter(m => m.group === groupFilter);
    }

    return matches;
  }, [groupMatches, playoffMatches, filter, groupFilter, showPlayoff]);

  const handleDelete = (matchId) => {
    if (window.confirm('Удалить этот матч?')) {
      deleteMatch(matchId);
    }
  };

  return (
    <div className="matches-page">
      <h1 className="page-title">📊 Матчи и прогнозы</h1>

      {isLocked && user?.role === 'admin' && (
        <div className="warning-banner">⚠️ Прогнозы заблокированы для пользователей</div>
      )}

      <div className="matches-filters-bar">
        <div className="matches-filter">
          <button className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}>🕐 Ближайшие</button>
          <button className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
            onClick={() => setFilter('today')}>📅 Сегодня</button>
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}>📋 Все</button>
          <button className={`filter-btn ${filter === 'played' ? 'active' : ''}`}
            onClick={() => setFilter('played')}>✅ Завершённые</button>
        </div>

        {!showPlayoff && (
          <select className="group-filter-select" value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}>
            <option value="all">🏆 Все группы</option>
            {groupKeys.map(key => (
              <option key={key} value={key}>Группа {key}</option>
            ))}
          </select>
        )}

        <button className={`filter-btn playoff-toggle ${showPlayoff ? 'active' : ''} ${playoffLocked ? 'locked' : ''}`}
          onClick={() => setShowPlayoff(playoffLocked && user?.role !== 'admin' ? false : !showPlayoff)}>
          {playoffLocked && user?.role !== 'admin' ? '🔒 Плей-офф' : '🏆 Плей-офф'}
        </button>
        {showPlayoff && playoffMatches.length > 0 && (
          <span className="playoff-count">{playoffMatches.length} матч(ей)</span>
        )}
      </div>

      {showPlayoff && playoffLocked && user?.role !== 'admin' ? (
        <div className="page-message">
          <h2>🔒 Плей-офф ещё не начался</h2>
        </div>
      ) : filteredMatches.length === 0 ? (
        <p className="empty-state">Нет матчей по выбранным фильтрам</p>
      ) : (
        <div className="matches-grid">
          {filteredMatches.map(m => (
            <MatchCard key={m.id} match={m}
              onDelete={user?.role === 'admin' ? handleDelete : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}

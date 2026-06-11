import { useState } from 'react';
import { useData } from '../../context/DataContext';

export default function AdminMatches() {
  const { data, updateMatchScore, addMatch, setActualFinals, setActualWinners, deleteMatch, savePrediction } = useData();
  const [scores, setScores] = useState({});
  const [finals, setFinals] = useState({});
  const [winners, setWinners] = useState({
    first: data.actualWinners?.first || '',
    second: data.actualWinners?.second || '',
    third: data.actualWinners?.third || '',
  });
  const [finalsSaved, setFinalsSaved] = useState(false);
  const [winnersSaved, setWinnersSaved] = useState(false);
  const [autoFillMsg, setAutoFillMsg] = useState(null);
  const [autoFillGlobalMsg, setAutoFillGlobalMsg] = useState(null);

  // New match form
  const [newMatch, setNewMatch] = useState({
    team1: '', team2: '', group: '', dateTime: '', stage: 'playoff'
  });

  const groupKeys = Object.keys(data.groups);
  const sortedMatches = [...(data.matches || [])].sort((a, b) => (a.matchOrder || 0) - (b.matchOrder || 0));
  const approvedUsers = data.users.filter(u => u.role === 'user' && u.status === 'approved');

  const handleScoreChange = (matchId, field, value) => {
    setScores(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [field]: value === '' ? null : Number(value) }
    }));
  };

  const handleSaveScore = (match) => {
    const s = scores[match.id] || {};
    const score1 = s.score1 !== undefined ? s.score1 : match.score1;
    const score2 = s.score2 !== undefined ? s.score2 : match.score2;
    updateMatchScore(match.id, score1, score2);
  };

  const getMissingUsers = (matchId) => {
    return approvedUsers.filter(u => !data.predictions[u.id]?.[matchId]);
  };

  const handleAutoFillMatch = (matchId) => {
    const missing = getMissingUsers(matchId);
    missing.forEach(u => {
      savePrediction(u.id, matchId, 0, 0);
    });
    setAutoFillMsg({ matchId, count: missing.length });
    setTimeout(() => setAutoFillMsg(null), 3000);
  };

  const handleAutoFillAllPlayed = () => {
    let total = 0;
    sortedMatches.filter(m => m.played).forEach(match => {
      const missing = getMissingUsers(match.id);
      missing.forEach(u => {
        savePrediction(u.id, match.id, 0, 0);
      });
      total += missing.length;
    });
    setAutoFillGlobalMsg(total);
    setTimeout(() => setAutoFillGlobalMsg(null), 3000);
  };

  // Group matches
  const groupMatches = sortedMatches.filter(m => m.stage === 'group');
  const playoffMatches = sortedMatches.filter(m => m.stage !== 'group');

  // All teams for finals/playoff creation
  const allTeams = [];
  Object.values(data.groups).forEach(g => {
    g.teams.forEach(t => {
      if (!allTeams.includes(t)) allTeams.push(t);
    });
  });
  allTeams.sort();

  const handleFinalsChange = (groupKey, position, team) => {
    setFinals(prev => ({
      ...prev,
      [groupKey]: { ...prev[groupKey], [position]: team }
    }));
  };

  const handleSaveFinals = () => {
    const actualFinals = {};
    Object.keys(data.groups).forEach(key => {
      const f = finals[key] || {};
      actualFinals[key] = [f.team1, f.team2].filter(Boolean);
    });
    setActualFinals(actualFinals);
    setFinalsSaved(true);
    setTimeout(() => setFinalsSaved(false), 2000);
  };

  const handleSaveWinners = () => {
    setActualWinners(winners);
    setWinnersSaved(true);
    setTimeout(() => setWinnersSaved(false), 2000);
  };

  const handleAddMatch = () => {
    if (!newMatch.team1 || !newMatch.team2 || !newMatch.dateTime) return;
    addMatch({
      team1: newMatch.team1,
      team2: newMatch.team2,
      group: newMatch.group || 'PO',
      dateTime: newMatch.dateTime,
      stage: newMatch.stage || 'playoff',
    });
    setNewMatch({ team1: '', team2: '', group: '', dateTime: '', stage: 'playoff' });
  };

  const handleDeleteMatch = (matchId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот матч? Это также удалит все прогнозы для этого матча.')) {
      deleteMatch(matchId);
    }
  };

  return (
    <div className="admin-matches">
      <h1 className="page-title">⚽ Управление матчами</h1>

      {/* Group matches */}
      <h2 className="page-subtitle">Групповой этап</h2>
      {groupKeys.map(key => (
        <div key={key} className="admin-group-section">
          <h3 className="group-title">{data.groups[key].name}</h3>
          <div className="admin-matches-list">
            {groupMatches.filter(m => m.group === key).map(match => (
              <div key={match.id} className="admin-match-row">
                <div className="match-teams-label">
                  <span>{match.team1} — {match.team2}</span>
                  {match.dateTime && <span className="match-date-small">{match.dateTime.replace('T', ' ')}</span>}
                </div>
                <div className="admin-score-inputs">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    className="score-input score-input-large"
                    placeholder={match.score1 !== null ? String(match.score1) : '?'}
                    value={scores[match.id]?.score1 ?? ''}
                    onChange={e => handleScoreChange(match.id, 'score1', e.target.value)}
                  />
                  <span className="score-sep">:</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    className="score-input score-input-large"
                    placeholder={match.score2 !== null ? String(match.score2) : '?'}
                    value={scores[match.id]?.score2 ?? ''}
                    onChange={e => handleScoreChange(match.id, 'score2', e.target.value)}
                  />
                  <button className="btn-small" onClick={() => handleSaveScore(match)}>
                    {match.played ? 'Обн.' : 'OK'}
                  </button>
                  <button className="btn-small btn-auto-fill"
                    onClick={() => handleAutoFillMatch(match.id)}
                    title="Заполнить прогнозы 0:0 для тех, кто не поставил">
                    0:0
                  </button>
                  <button className="btn-delete-match" onClick={() => handleDeleteMatch(match.id)} title="Удалить матч">
                    ✕
                  </button>
                </div>
                {autoFillMsg?.matchId === match.id && (
                  <div className="auto-fill-toast">
                    Заполнено {autoFillMsg.count} прогнозов 0:0
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {autoFillGlobalMsg !== null && (
        <div className="auto-fill-toast global">
          Заполнено {autoFillGlobalMsg} пропущенных прогнозов 0:0
        </div>
      )}

      <hr className="section-divider" />

      {/* Playoff matches */}
      <h2 className="page-subtitle">Плей-офф</h2>
      {playoffMatches.length > 0 && (
        <div className="admin-matches-list">
          {playoffMatches.map(match => (
            <div key={match.id} className="admin-match-row">
              <div className="match-teams-label">
                <span>{match.team1} — {match.team2}</span>
                <span className="match-stage-label">{match.stage}</span>
              </div>
              <div className="admin-score-inputs">
                <input type="number" min="0" max="20" className="score-input score-input-large"
                  placeholder={match.score1 !== null ? String(match.score1) : '?'}
                  value={scores[match.id]?.score1 ?? ''}
                  onChange={e => handleScoreChange(match.id, 'score1', e.target.value)} />
                <span className="score-sep">:</span>
                <input type="number" min="0" max="20" className="score-input score-input-large"
                  placeholder={match.score2 !== null ? String(match.score2) : '?'}
                  value={scores[match.id]?.score2 ?? ''}
                  onChange={e => handleScoreChange(match.id, 'score2', e.target.value)} />
                <button className="btn-small" onClick={() => handleSaveScore(match)}>
                  {match.played ? 'Обн.' : 'OK'}
                </button>
                <button className="btn-small btn-auto-fill"
                  onClick={() => handleAutoFillMatch(match.id)}
                  title="Заполнить прогнозы 0:0 для тех, кто не поставил">
                  0:0
                </button>
                <button className="btn-delete-match" onClick={() => handleDeleteMatch(match.id)} title="Удалить матч">
                  ✕
                </button>
              </div>
              {autoFillMsg?.matchId === match.id && (
                <div className="auto-fill-toast">
                  Заполнено {autoFillMsg.count} прогнозов 0:0
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Auto-fill all played matches */}
      {sortedMatches.some(m => m.played) && (
        <div style={{ marginBottom: '1rem' }}>
          <button className="btn-small btn-auto-fill-all" onClick={handleAutoFillAllPlayed}>
            🔄 Заполнить все пропущенные прогнозы (0:0) для сыгранных матчей
          </button>
        </div>
      )}

      {/* Add new playoff match */}
      <div className="admin-add-match">
        <h3>➕ Создать новый матч</h3>
        <div className="add-match-form">
          <div className="add-match-row">
            <select value={newMatch.team1} onChange={e => setNewMatch({...newMatch, team1: e.target.value})}>
              <option value="">Команда 1</option>
              {allTeams.map(t => (
                <option key={t} value={t} disabled={t === newMatch.team2}>{t}</option>
              ))}
            </select>
            <span className="score-sep">vs</span>
            <select value={newMatch.team2} onChange={e => setNewMatch({...newMatch, team2: e.target.value})}>
              <option value="">Команда 2</option>
              {allTeams.map(t => (
                <option key={t} value={t} disabled={t === newMatch.team1}>{t}</option>
              ))}
            </select>
          </div>
          <div className="add-match-row">
            <input
              type="datetime-local"
              value={newMatch.dateTime}
              onChange={e => setNewMatch({...newMatch, dateTime: e.target.value})}
              className="datetime-input"
            />
            <select value={newMatch.stage} onChange={e => setNewMatch({...newMatch, stage: e.target.value})}>
              <option value="roundOf32">1/32 финала</option>
              <option value="roundOf16">1/16 финала</option>
              <option value="quarterFinal">1/4 финала</option>
              <option value="semiFinal">1/2 финала</option>
              <option value="final">Финал</option>
            </select>
            <button className="btn-primary btn-add-match" onClick={handleAddMatch}>
              Создать матч
            </button>
          </div>
        </div>
      </div>

      <hr className="section-divider" />

      {/* Finals results */}
      <h2 className="page-subtitle">Финалисты групп</h2>
      {groupKeys.map(key => (
        <div key={key} className="admin-finals-row">
          <h3>Финалисты {data.groups[key].name}</h3>
          <div className="admin-finals-inputs">
            <select value={finals[key]?.team1 || ''} onChange={e => handleFinalsChange(key, 'team1', e.target.value)}>
              <option value="">1-е место</option>
              {data.groups[key].teams.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select value={finals[key]?.team2 || ''} onChange={e => handleFinalsChange(key, 'team2', e.target.value)}>
              <option value="">2-е место</option>
              {data.groups[key].teams.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      ))}
      <button className="btn-primary" onClick={handleSaveFinals}>
        {finalsSaved ? '✓ Сохранено' : 'Сохранить финалистов'}
      </button>

      <hr className="section-divider" />

      {/* Winners */}
      <h2 className="page-subtitle">🥇 Призёры турнира</h2>
      <div className="admin-winners">
        <div className="winner-row">
          <span>🥇 1-е место</span>
          <select value={winners.first} onChange={e => setWinners({...winners, first: e.target.value})} className="winner-select">
            <option value="">-- Выберите --</option>
            {allTeams.map(t => (<option key={t} value={t}>{t}</option>))}
          </select>
        </div>
        <div className="winner-row">
          <span>🥈 2-е место</span>
          <select value={winners.second} onChange={e => setWinners({...winners, second: e.target.value})} className="winner-select">
            <option value="">-- Выберите --</option>
            {allTeams.map(t => (<option key={t} value={t}>{t}</option>))}
          </select>
        </div>
        <div className="winner-row">
          <span>🥉 3-е место</span>
          <select value={winners.third} onChange={e => setWinners({...winners, third: e.target.value})} className="winner-select">
            <option value="">-- Выберите --</option>
            {allTeams.map(t => (<option key={t} value={t}>{t}</option>))}
          </select>
        </div>
        <button className="btn-primary" onClick={handleSaveWinners}>
          {winnersSaved ? '✓ Сохранено' : 'Сохранить призёров'}
        </button>
      </div>
    </div>
  );
}

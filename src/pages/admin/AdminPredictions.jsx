import { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { calculateMatchScore } from '../../utils/scoring';

export default function AdminPredictions() {
  const { data, savePrediction, saveFinals, saveWinner } = useData();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [editFinals, setEditFinals] = useState(null);
  const [editWinner, setEditWinner] = useState(null);
  const [editPredictions, setEditPredictions] = useState({});
  const [finalsSaved, setFinalsSaved] = useState(false);
  const [winnerSaved, setWinnerSaved] = useState(false);
  const [predictionSaved, setPredictionSaved] = useState(null);
  const [showFinalsEditor, setShowFinalsEditor] = useState(false);
  const [showWinnerEditor, setShowWinnerEditor] = useState(false);
  const [activeTab, setActiveTab] = useState('predictions');

  const approvedUsers = useMemo(() =>
    data.users.filter(u => u.role === 'user' && u.status === 'approved'),
    [data.users]
  );

  const selectedUser = useMemo(() =>
    approvedUsers.find(u => u.id === selectedUserId),
    [selectedUserId, approvedUsers]
  );

  const userPredictions = useMemo(() => {
    if (!selectedUserId) return [];
    const preds = data.predictions[selectedUserId] || {};
    const allMatches = data.matches || [];
    return allMatches
      .map(match => ({
        matchId: match.id,
        pred: preds[match.id] || null,
        match,
      }))
      .sort((a, b) => (a.match.matchOrder || 0) - (b.match.matchOrder || 0));
  }, [selectedUserId, data]);

  const userFinals = useMemo(() => {
    if (!selectedUserId) return {};
    return data.finals[selectedUserId] || {};
  }, [selectedUserId, data]);

  const userWinner = useMemo(() => {
    if (!selectedUserId) return {};
    return data.winners[selectedUserId] || {};
  }, [selectedUserId, data]);

  const cfg = useMemo(() => {
    const defaults = {
      matchOutcome: 3, goalDifference: 3, teamGoals: 1,
      offByOne: 1, exactScore: 1,
      groupFinalist: 1, finalist: 15, champion: 25, thirdPlace: 10,
    };
    return { ...defaults, ...(data?.app?.scoring || {}) };
  }, [data]);

  const allTeams = useMemo(() => {
    const teams = [];
    Object.values(data.groups).forEach(g => {
      g.teams.forEach(t => {
        if (!teams.includes(t)) teams.push(t);
      });
    });
    teams.sort();
    return teams;
  }, [data.groups]);

  const handlePredictionChange = (matchId, field, value) => {
    setEditPredictions(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [field]: value === '' ? '' : Number(value) }
    }));
  };

  const handleSavePrediction = (matchId) => {
    const p = editPredictions[matchId] || {};
    const score1 = p.score1 !== undefined ? p.score1 : null;
    const score2 = p.score2 !== undefined ? p.score2 : null;
    if (score1 === '' || score2 === '' || score1 === null || score2 === null) return;
    savePrediction(selectedUserId, matchId, score1, score2);
    setPredictionSaved(matchId);
    setTimeout(() => setPredictionSaved(null), 2000);
  };

  const handleFinalsChange = (groupKey, team, index) => {
    setEditFinals(prev => {
      const group = prev[groupKey] ? [...prev[groupKey]] : [];
      group[index] = team;
      return { ...prev, [groupKey]: group };
    });
  };

  const handleSaveFinals = () => {
    saveFinals(selectedUserId, editFinals);
    setFinalsSaved(true);
    setTimeout(() => setFinalsSaved(false), 2000);
    setShowFinalsEditor(false);
  };

  const openFinalsEditor = () => {
    setEditFinals(JSON.parse(JSON.stringify(userFinals)));
    setShowFinalsEditor(true);
  };

  const handleWinnerChange = (position, value) => {
    setEditWinner(prev => ({ ...prev, [position]: value }));
  };

  const handleSaveWinner = () => {
    if (!editWinner.first) return;
    saveWinner(selectedUserId, editWinner);
    setWinnerSaved(true);
    setTimeout(() => setWinnerSaved(false), 2000);
    setShowWinnerEditor(false);
  };

  const openWinnerEditor = () => {
    setEditWinner(JSON.parse(JSON.stringify(userWinner)));
    setShowWinnerEditor(true);
  };

  return (
    <div className="admin-predictions">
      <h1 className="page-title">📊 Прогнозы пользователей</h1>

      {/* User selector */}
      <div className="admin-pred-user-select">
        <label>Выберите пользователя:</label>
        <select
          value={selectedUserId}
          onChange={e => {
            setSelectedUserId(e.target.value);
            setEditPredictions({});
            setShowFinalsEditor(false);
            setShowWinnerEditor(false);
          }}
          className="admin-pred-select"
        >
          <option value="">-- Выберите --</option>
          {approvedUsers.map(u => (
            <option key={u.id} value={u.id}>
              {u.fullname || u.username} (@{u.username})
            </option>
          ))}
        </select>
      </div>

      {!selectedUser && (
        <p className="empty-state">Выберите пользователя для просмотра его прогнозов</p>
      )}

      {selectedUser && (
        <>
          <div className="admin-pred-user-header">
            <h2>{selectedUser.fullname || selectedUser.username}</h2>
            <span className="user-badge">{selectedUser.username}</span>
          </div>

          {/* Tabs */}
          <div className="admin-pred-tabs">
            <button
              className={`admin-pred-tab ${activeTab === 'predictions' ? 'active' : ''}`}
              onClick={() => setActiveTab('predictions')}
            >
              ⚽ Прогнозы на матчи
            </button>
            <button
              className={`admin-pred-tab ${activeTab === 'finals' ? 'active' : ''}`}
              onClick={() => setActiveTab('finals')}
            >
              🏅 Финалисты групп
            </button>
            <button
              className={`admin-pred-tab ${activeTab === 'winner' ? 'active' : ''}`}
              onClick={() => setActiveTab('winner')}
            >
              🏆 Победитель
            </button>
          </div>

          {/* Predictions Tab */}
          {activeTab === 'predictions' && (
            <div className="admin-pred-section">
              {userPredictions.length === 0 ? (
                <p className="empty-state">Нет матчей</p>
              ) : (
                <div className="admin-pred-matches-list">
                  {userPredictions.map(({ matchId, pred, match }) => {
                    const hasPred = pred !== null;
                    const score = hasPred ? calculateMatchScore(pred, match, cfg) : null;
                    const editPred = editPredictions[matchId] || {};
                    return (
                      <div key={matchId} className={`admin-pred-match-row ${match.played ? 'settled' : ''} ${!hasPred ? 'no-pred' : ''}`}>
                        <div className="admin-pred-match-info">
                          <span className="match-group-badge">{match.group}</span>
                          <span className="match-order">Матч #{match.matchOrder}</span>
                          <span className="admin-pred-teams">{match.team1} — {match.team2}</span>
                        </div>
                        <div className="admin-pred-scores">
                          <div className="admin-pred-user-score">
                            <span className="admin-pred-label">Прогноз:</span>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              className="score-input"
                              value={editPred.score1 !== undefined ? editPred.score1 : (hasPred ? pred.score1 : '')}
                              onChange={e => handlePredictionChange(matchId, 'score1', e.target.value)}
                            />
                            <span className="score-sep">:</span>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              className="score-input"
                              value={editPred.score2 !== undefined ? editPred.score2 : (hasPred ? pred.score2 : '')}
                              onChange={e => handlePredictionChange(matchId, 'score2', e.target.value)}
                            />
                            <button
                              className="btn-small btn-save-pred"
                              onClick={() => handleSavePrediction(matchId)}
                            >
                              {predictionSaved === matchId ? '✓' : 'Сохранить'}
                            </button>
                          </div>
                          {!hasPred && (
                            <span className="admin-pred-pending no-pred-msg">❌ Нет прогноза</span>
                          )}
                          {hasPred && match.played && (
                            <div className="admin-pred-result">
                              <span className="admin-pred-actual">Результат: {match.score1}:{match.score2}</span>
                              <span className={`score-points ${score.total > 0 ? 'points-earned' : ''}`}>
                                {score.total > 0 ? `+${score.total} баллов` : '0 баллов'}
                              </span>
                            </div>
                          )}
                          {hasPred && !match.played && (
                            <span className="admin-pred-pending">⏳ Ожидает результата</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Finals Tab */}
          {activeTab === 'finals' && (
            <div className="admin-pred-section">
              {!showFinalsEditor ? (
                <>
                  {Object.keys(userFinals).length === 0 ? (
                    <p className="empty-state">Пользователь ещё не выбрал финалистов</p>
                  ) : (
                    <div className="admin-pred-finals-grid">
                      {Object.entries(data.groups).map(([key, group]) => {
                        const selectedTeams = userFinals[key] || [];
                        return (
                          <div key={key} className="admin-pred-finals-card">
                            <h3>{group.name}</h3>
                            <div className="admin-pred-finals-teams">
                              {group.teams.map(team => {
                                const isSelected = selectedTeams.includes(team);
                                return (
                                  <span
                                    key={team}
                                    className={`admin-pred-finals-team ${isSelected ? 'selected' : ''}`}
                                  >
                                    {team}
                                    {isSelected && <span className="check-mark"> ✓</span>}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <button className="btn-primary admin-pred-edit-btn" onClick={openFinalsEditor}>
                    ✏️ Редактировать финалистов
                  </button>
                </>
              ) : (
                <div className="admin-pred-edit-finals-section">
                  <div className="admin-pred-finals-grid">
                    {Object.entries(data.groups).map(([key, group]) => {
                      const selected = editFinals[key] || [];
                      return (
                        <div key={key} className="admin-pred-finals-card">
                          <h3>{group.name}</h3>
                          <div className="admin-pred-finals-selects">
                            <select
                              value={selected[0] || ''}
                              onChange={e => handleFinalsChange(key, e.target.value, 0)}
                              className="admin-pred-select"
                            >
                              <option value="">1-е место</option>
                              {group.teams.map(t => (
                                <option key={t} value={t} disabled={t === selected[1]}>{t}</option>
                              ))}
                            </select>
                            <select
                              value={selected[1] || ''}
                              onChange={e => handleFinalsChange(key, e.target.value, 1)}
                              className="admin-pred-select"
                            >
                              <option value="">2-е место</option>
                              {group.teams.map(t => (
                                <option key={t} value={t} disabled={t === selected[0]}>{t}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="admin-pred-edit-actions">
                    <button className="btn-primary" onClick={handleSaveFinals}>
                      {finalsSaved ? '✓ Сохранено' : '💾 Сохранить финалистов'}
                    </button>
                    <button className="btn-small btn-cancel" onClick={() => setShowFinalsEditor(false)}>
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Winner Tab */}
          {activeTab === 'winner' && (
            <div className="admin-pred-section">
              {!showWinnerEditor ? (
                <>
                  {!userWinner.first ? (
                    <p className="empty-state">Пользователь ещё не выбрал победителя</p>
                  ) : (
                    <div className="admin-pred-winner-display">
                      <p>🥇 {userWinner.first}</p>
                      {userWinner.second && <p>🥈 {userWinner.second}</p>}
                      {userWinner.third && <p>🥉 {userWinner.third}</p>}
                    </div>
                  )}
                  <button className="btn-primary admin-pred-edit-btn" onClick={openWinnerEditor}>
                    ✏️ Редактировать победителя
                  </button>
                </>
              ) : (
                <div className="admin-pred-edit-winner">
                  <div className="winner-row">
                    <span className="winner-label">🥇 1-е место</span>
                    <select
                      value={editWinner.first || ''}
                      onChange={e => handleWinnerChange('first', e.target.value)}
                      className="winner-select"
                    >
                      <option value="">-- Выберите чемпиона --</option>
                      {allTeams.map(team => {
                        const isUsed = (editWinner.first !== team) && (editWinner.second === team || editWinner.third === team);
                        return (
                          <option key={team} value={team} disabled={isUsed}>
                            {team}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="winner-row">
                    <span className="winner-label">🥈 2-е место</span>
                    <select
                      value={editWinner.second || ''}
                      onChange={e => handleWinnerChange('second', e.target.value)}
                      className="winner-select"
                    >
                      <option value="">-- Выберите 2-е место --</option>
                      {allTeams.map(team => {
                        const isUsed = (editWinner.second !== team) && (editWinner.first === team || editWinner.third === team);
                        return (
                          <option key={team} value={team} disabled={isUsed}>
                            {team}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="winner-row">
                    <span className="winner-label">🥉 3-е место</span>
                    <select
                      value={editWinner.third || ''}
                      onChange={e => handleWinnerChange('third', e.target.value)}
                      className="winner-select"
                    >
                      <option value="">-- Выберите 3-е место --</option>
                      {allTeams.map(team => {
                        const isUsed = (editWinner.third !== team) && (editWinner.first === team || editWinner.second === team);
                        return (
                          <option key={team} value={team} disabled={isUsed}>
                            {team}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="admin-pred-edit-actions">
                    <button
                      className="btn-primary"
                      onClick={handleSaveWinner}
                      disabled={!editWinner.first}
                    >
                      {winnerSaved ? '✓ Сохранено' : '💾 Сохранить'}
                    </button>
                    <button className="btn-small btn-cancel" onClick={() => setShowWinnerEditor(false)}>
                      Отмена
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

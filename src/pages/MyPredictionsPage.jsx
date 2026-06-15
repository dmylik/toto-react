import { useState, useMemo, useRef, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { calculateMatchScore, getScoringConfig, isPredicationBlocked, formatMatchDateTime } from '../utils/scoring';

export default function MyPredictionsPage() {
  const { data } = useData();
  const { user } = useAuth();
  const userPredictions = data.predictions[user?.id] || {};
  const cfg = getScoringConfig(data);
  const [filter, setFilter] = useState('all');
  const pendingRef = useRef(null);

  // Build a map of matchId → all user predictions for that match
  const matchAllPredictions = useMemo(() => {
    const map = {};
    if (!data.predictions) return map;

    for (const userId of Object.keys(data.predictions)) {
      if (userId === user?.id) continue; // skip current user
      const userPreds = data.predictions[userId] || {};
      for (const matchId of Object.keys(userPreds)) {
        if (!map[matchId]) map[matchId] = [];
        const u = data.users.find(u => u.id === userId);
        map[matchId].push({
          userId,
          displayName: u?.fullname || u?.username || userId,
          prediction: userPreds[matchId],
        });
      }
    }
    return map;
  }, [data, user?.id]);

  const predictionsList = Object.entries(userPredictions).map(([matchId, pred]) => {
    const match = data.matches.find(m => m.id === matchId);
    return { matchId, pred, match };
  }).filter(item => item.match);

  predictionsList.sort((a, b) => (a.match.matchOrder || 0) - (b.match.matchOrder || 0));

  const filteredList = useMemo(() => {
    const now = Date.now();
    if (filter === 'all') return predictionsList;
    return predictionsList.filter(({ match }) => {
      if (filter === 'played') return match.played;
      if (filter === 'pending') {
        // Матч ещё не начался (dateTime > now)
        return !match.played && new Date(match.dateTime).getTime() > now;
      }
      if (filter === 'live') {
        // Матч уже начался по времени, но результат не выставлен
        return !match.played && new Date(match.dateTime).getTime() <= now;
      }
      return true;
    });
  }, [predictionsList, filter]);

  const scrollToPending = useCallback(() => {
    if (pendingRef.current) {
      pendingRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Determine if a non-played match is "live" (match time has passed) or "pending" (upcoming)
  const getMatchStatus = useCallback((match) => {
    if (match.played) return 'played';
    const matchTime = new Date(match.dateTime).getTime();
    return matchTime <= Date.now() ? 'live' : 'pending';
  }, []);

  return (
    <div className="my-predictions-page">
      <h1 className="page-title">📋 Мои прогнозы</h1>

      {predictionsList.length > 0 && (
        <div className="matches-filters-bar">
          <div className="matches-filter">
            <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}>📋 Все</button>
            <button className={`filter-btn ${filter === 'played' ? 'active' : ''}`}
              onClick={() => setFilter('played')}>✅ Завершённые</button>
            <button className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}>⏳ Ожидает результата</button>
            <button className={`filter-btn ${filter === 'live' ? 'active' : ''}`}
              onClick={() => setFilter('live')}>🔴 Игра</button>
          </div>

          {filter === 'all' && predictionsList.some(({ match }) => !match.played) && (
            <button className="filter-btn scroll-to-pending-btn"
              onClick={scrollToPending} title="Прокрутить к ожидающим результата">
              ↓ К ожидающим
            </button>
          )}
        </div>
      )}

      {predictionsList.length === 0 ? (
        <p className="empty-state">Вы ещё не сделали ни одного прогноза.</p>
      ) : filteredList.length === 0 ? (
        <p className="empty-state">Нет прогнозов по выбранному фильтру.</p>
      ) : (
        <div className="predictions-list">
          {filteredList.map(({ matchId, pred, match }, idx) => {
            const score = calculateMatchScore(pred, match, cfg);
            const otherPreds = matchAllPredictions[matchId] || [];
            const status = getMatchStatus(match);
            const isPending = status === 'pending';
            // First pending item gets the ref for scroll-to
            const isFirstPending = isPending && filteredList.slice(0, idx).every(item => item.match.played || getMatchStatus(item.match) === 'live');

            return (
              <div key={matchId}
                ref={isFirstPending ? pendingRef : null}
                className={`prediction-card ${match.played ? 'prediction-settled' : ''}`}>
                <div className="prediction-header">
                  <span className="match-group-badge">{match.group}</span>
                  <span className="match-date-time">{formatMatchDateTime(match.dateTime)}</span>
                  <span className="match-order">Матч #{match.matchOrder}</span>
                </div>
                <div className="prediction-teams">
                  <span>{match.team1}</span>
                  <span className="prediction-score">
                    {pred.score1} : {pred.score2}
                  </span>
                  <span>{match.team2}</span>
                </div>
                {match.played ? (
                  <>
                    <div className="prediction-result">
                      <span>Результат: <strong>{match.score1}:{match.score2}</strong></span>
                      <span className={`score-points ${score.total > 0 ? 'points-earned' : ''}`}>
                        {score.total > 0 ? `+${score.total} баллов` : '0 баллов'}
                      </span>
                    </div>
                    {otherPreds.length > 0 && (
                      <div className="other-predictions">
                        <div className="other-predictions-title">Прогнозы участников:</div>
                        <div className="other-predictions-list">
                          {otherPreds.map(op => {
                            const opScore = calculateMatchScore(op.prediction, match, cfg);
                            return (
                              <span key={op.userId} className="other-prediction-item" title={`${op.displayName}: ${op.prediction.score1}:${op.prediction.score2} — ${opScore.total > 0 ? `+${opScore.total}` : '0'} баллов`}>
                                {op.displayName}: {op.prediction.score1}:{op.prediction.score2}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : status === 'live' ? (
                  <>
                    <div className="prediction-pending prediction-live">🔴 Идёт игра</div>
                    {isPredicationBlocked(match) && otherPreds.length > 0 && (
                      <div className="other-predictions">
                        <div className="other-predictions-title">Прогнозы участников:</div>
                        <div className="other-predictions-list">
                          {otherPreds.map(op => (
                            <span key={op.userId} className="other-prediction-item" title={`${op.displayName}: ${op.prediction.score1}:${op.prediction.score2}`}>
                              {op.displayName}: {op.prediction.score1}:{op.prediction.score2}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="prediction-pending">⏳ Ожидает результата</div>
                    {isPredicationBlocked(match) && otherPreds.length > 0 && (
                      <div className="other-predictions">
                        <div className="other-predictions-title">Прогнозы участников:</div>
                        <div className="other-predictions-list">
                          {otherPreds.map(op => (
                            <span key={op.userId} className="other-prediction-item" title={`${op.displayName}: ${op.prediction.score1}:${op.prediction.score2}`}>
                              {op.displayName}: {op.prediction.score1}:{op.prediction.score2}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { calculateMatchScore, getScoringConfig, isPredicationBlocked } from '../utils/scoring';

export default function MyPredictionsPage() {
  const { data } = useData();
  const { user } = useAuth();
  const userPredictions = data.predictions[user?.id] || {};
  const cfg = getScoringConfig(data);

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

  return (
    <div className="my-predictions-page">
      <h1 className="page-title">📋 Мои прогнозы</h1>
      {predictionsList.length === 0 ? (
        <p className="empty-state">Вы ещё не сделали ни одного прогноза.</p>
      ) : (
        <div className="predictions-list">
          {predictionsList.map(({ matchId, pred, match }) => {
            const score = calculateMatchScore(pred, match, cfg);
            const otherPreds = matchAllPredictions[matchId] || [];
            return (
              <div key={matchId} className={`prediction-card ${match.played ? 'prediction-settled' : ''}`}>
                <div className="prediction-header">
                  <span className="match-group-badge">{match.group}</span>
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

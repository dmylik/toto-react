import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { calculateMatchScore, getScoringConfig } from '../utils/scoring';

export default function MyPredictionsPage() {
  const { data } = useData();
  const { user } = useAuth();
  const userPredictions = data.predictions[user?.id] || {};
  const cfg = getScoringConfig(data);

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
                  <div className="prediction-result">
                    <span>Результат: <strong>{match.score1}:{match.score2}</strong></span>
                    <span className={`score-points ${score.total > 0 ? 'points-earned' : ''}`}>
                      {score.total > 0 ? `+${score.total} баллов` : '0 баллов'}
                    </span>
                  </div>
                ) : (
                  <div className="prediction-pending">⏳ Ожидает результата</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

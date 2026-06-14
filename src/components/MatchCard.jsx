import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { isPredicationBlocked, formatMatchDateTime } from '../utils/scoring';

export default function MatchCard({ match, onDelete }) {
  const { data, savePrediction, getUserPredictions } = useData();
  const { user } = useAuth();

  const existingPrediction = getUserPredictions(user?.id)[match.id];
  const blocked = isPredicationBlocked(match);
  const isAdmin = user?.role === 'admin';
  const hasPrediction = !!existingPrediction;

  const [score1, setScore1] = useState(existingPrediction?.score1?.toString() ?? '');
  const [score2, setScore2] = useState(existingPrediction?.score2?.toString() ?? '');
  const [saved, setSaved] = useState(false);

  const canPredict = !match.played && !blocked && !isAdmin;

  // All users' predictions for this match (shown when blocked or played)
  const allPredictions = useMemo(() => {
    const result = [];
    const users = data?.users || [];
    const predictions = data?.predictions || {};
    for (const u of users) {
      if (u.role === 'admin' || u.status !== 'approved') continue;
      const pred = predictions[u.id]?.[match.id];
      if (pred) {
        result.push({
          username: u.fullname || u.username,
          score1: pred.score1,
          score2: pred.score2,
          isMine: u.id === user?.id,
        });
      }
    }
    return result;
  }, [data, match.id, user?.id]);

  const handleSave = () => {
    if (score1 === '' || score2 === '') return;
    savePrediction(user.id, match.id, score1, score2);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={`match-card ${match.played ? 'match-played' : blocked ? 'match-blocked' : ''}`}>
      <span className="match-date-time">{formatMatchDateTime(match.dateTime)}</span>
      <span className="match-group-badge">
        {match.group}{match.stage !== 'group' ? ` · ${match.stage}` : ''}
      </span>
      <span className="match-teams-inline">
        <strong>{match.team1}</strong> vs <strong>{match.team2}</strong>
      </span>

      {match.played ? (
        <div className="match-result">
          <strong className="match-score-large">{match.score1} : {match.score2}</strong>
          {existingPrediction && (
            <span className="your-prediction">Ваш: {existingPrediction.score1}:{existingPrediction.score2}</span>
          )}
        </div>
      ) : blocked && !isAdmin ? (
        hasPrediction ? (
          <div className="match-prediction match-prediction-saved">
            <span className="your-prediction">Ваш прогноз: <strong>{existingPrediction.score1}:{existingPrediction.score2}</strong></span>
          </div>
        ) : (
          <div className="match-blocked-msg">🔒</div>
        )
      ) : canPredict ? (
        <div className="match-prediction">
          <input type="number" min="0" max="20" className="score-input score-input-large"
            value={score1} onChange={e => setScore1(e.target.value)} />
          <span className="score-sep">:</span>
          <input type="number" min="0" max="20" className="score-input score-input-large"
            value={score2} onChange={e => setScore2(e.target.value)} />
          <button onClick={handleSave} className="btn-save-prediction">
            {saved ? '✓' : hasPrediction ? '✎' : 'OK'}
          </button>
        </div>
      ) : null}

      {/* Show all predictions when match is blocked or played */}
      {(blocked || match.played) && allPredictions.length > 0 && (
        <div className="match-all-predictions">
          <span className="all-predictions-label">Прогнозы участников:</span>
          <div className="all-predictions-list">
            {allPredictions.map((p, i) => (
              <span key={i} className={`prediction-chip ${p.isMine ? 'mine' : ''}`}>
                {p.username}: {p.score1}:{p.score2}
              </span>
            ))}
          </div>
        </div>
      )}

      {onDelete && (
        <button className="btn-delete-match" onClick={() => onDelete(match.id)}
          title="Удалить матч">×</button>
      )}
    </div>
  );
}

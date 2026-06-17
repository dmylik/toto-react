import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  getAllUsersScores,
  getDetailedScoreHistory,
  getScoringConfig,
  SCORING_LABELS,
} from '../utils/scoring';
import ScoreDistributionChart from '../components/ScoreDistributionChart';

export default function StatisticsPage() {
  const { data } = useData();
  const cfg = getScoringConfig(data);
  const scores = getAllUsersScores(data);
  const [detailUserId, setDetailUserId] = useState(null);
  const [showScoringDetails, setShowScoringDetails] = useState(false);

  const detailHistory = useMemo(() => {
    if (!detailUserId) return null;
    return getDetailedScoreHistory(detailUserId, data);
  }, [detailUserId, data]);

  if (scores.length === 0) {
    return (
      <div className="statistics-page">
        <h1 className="page-title">📊 Таблица лидеров</h1>
        <p className="empty-state">Пока нет участников. Пригласите друзей!</p>
      </div>
    );
  }

  const detailUser = detailUserId
    ? data.users.find(u => u.id === detailUserId)
    : null;

  const leaderScore = scores.length > 0 ? scores[0].score : 0;

  return (
    <div className="statistics-page">
      <h1 className="page-title">📊 Таблица лидеров</h1>

      {!detailUserId ? (
        <div className="statistics-layout">
          <ScoreDistributionChart data={data} />

          <div className="leaderboard-table-wrapper">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Участник</th>
                <th>Баллы</th>
                <th><span className="gap-label-desktop">Отставание</span><span className="gap-label-mobile">-</span></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, i) => {
                const gap = leaderScore - s.score;
                return (
                  <tr key={s.userId} className={i === 0 ? 'leader' : ''}>
                    <td className="rank-cell">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                    </td>
                    <td>
                      <span className="stat-player-name">{s.fullname || s.username}</span>
                      {s.fullname && s.fullname !== s.username && (
                        <span className="stat-player-login"> ({s.username})</span>
                      )}
                    </td>
                    <td className="score-cell">{s.score}</td>
                    <td className="gap-cell">
                      <span className="gap-value-desktop">{i === 0 ? '—' : `-${gap}`}</span>
                      <span className="gap-value-mobile">-</span>
                    </td>
                    <td>
                      <button
                        className="btn-detail"
                        onClick={() => setDetailUserId(s.userId)}
                      >
                        Подробно
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

          <div className="scoring-rules-box">
            <div className="scoring-rules-header">
              <h3>📐 Правила начисления очков</h3>
              <button
                className="btn-detail scoring-toggle-btn"
                onClick={() => setShowScoringDetails(v => !v)}
              >
                {showScoringDetails ? '▲ Свернуть' : '▼ Подробнее'}
              </button>
            </div>
            <div className="scoring-rules-grid">
              <div className="scoring-rules-col">
                <h4>За матчи</h4>
                <ul>
                  <li>{SCORING_LABELS.matchOutcome}: <strong>+{cfg.matchOutcome}</strong></li>
                  <li>{SCORING_LABELS.goalDifference}: <strong>+{cfg.goalDifference}</strong></li>
                  <li>{SCORING_LABELS.teamGoals}: <strong>+{cfg.teamGoals}</strong></li>
                  <li>{SCORING_LABELS.offByOne}: <strong>+{cfg.offByOne}</strong></li>
                  <li>{SCORING_LABELS.exactScore}: <strong>+{cfg.exactScore}</strong></li>
                </ul>
              </div>
              <div className="scoring-rules-col">
                <h4>За финалистов групп</h4>
                <ul>
                  <li>{SCORING_LABELS.groupFinalist}: <strong>+{cfg.groupFinalist}</strong></li>
                </ul>
                <h4 style={{ marginTop: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>За победителей турнира</h4>
                <ul>
                  <li>{SCORING_LABELS.champion}: <strong>+{cfg.champion}</strong></li>
                  <li>{SCORING_LABELS.secondPlace}: <strong>+{cfg.secondPlace}</strong></li>
                  <li>{SCORING_LABELS.thirdPlace}: <strong>+{cfg.thirdPlace}</strong></li>
                  <li>{SCORING_LABELS.allThree}: <strong>+{cfg.allThree}</strong> (бонус)</li>
                </ul>
              </div>
            </div>

            {showScoringDetails && (
              <div className="scoring-details">
                <h4>📌 Примеры расчёта очков за матч</h4>
                <div className="scoring-examples">
                  <div className="scoring-example">
                    <strong>Исход матча (+{cfg.matchOutcome}):</strong>
                    <span>Счёт 2:1 → прогноз 3:0 — угадан исход (победа первой команды)</span>
                  </div>
                  <div className="scoring-example">
                    <strong>Разница голов (+{cfg.goalDifference}):</strong>
                    <span>Счёт 3:1 → прогноз 4:2 — разница 2 гола совпала</span>
                  </div>
                  <div className="scoring-example">
                    <strong>Голы одной команды (+{cfg.teamGoals} за каждую):</strong>
                    <span>Счёт 2:1 → прогноз 2:3 — угадано 2 гола первой команды = +{cfg.teamGoals}</span>
                  </div>
                  <div className="scoring-example">
                    <strong>Отличие на 1 гол (+{cfg.offByOne}):</strong>
                    <span>Счёт 2:1 → прогноз 2:2 — одна команда угадана, вторая отличается на 1 гол</span>
                  </div>
                  <div className="scoring-example">
                    <strong>Точный счёт (+{cfg.exactScore}):</strong>
                    <span>Счёт 2:1 → прогноз 2:1 — полное совпадение = +{cfg.matchOutcome + cfg.goalDifference + cfg.teamGoals * 2 + cfg.offByOne + cfg.exactScore} очков (сумма всех правил)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="stat-detail">
          <button className="btn-back" onClick={() => setDetailUserId(null)}>
            ← Назад к таблице
          </button>
          <h2 className="stat-detail-name">
            {detailUser?.fullname || detailUser?.username || detailUserId}
          </h2>
          <p className="stat-detail-total">
            Всего баллов: <strong>{detailHistory?.total || 0}</strong>
          </p>

          {detailHistory && detailHistory.matchScores.length > 0 && (
            <div className="stat-section">
              <h3>⚽ Прогнозы на матчи</h3>
              <div className="stat-matches-list">
                {detailHistory.matchScores.map((ms) => (
                  <div key={ms.matchId} className="stat-match-card">
                    <div className="stat-match-header">
                      <span className="stat-match-badge">{ms.group || ms.stage}</span>
                      <span className="stat-match-teams">
                        {ms.team1} {ms.prediction.score1}:{ms.prediction.score2} {ms.team2}
                      </span>
                      <span className={`stat-match-points ${ms.total > 0 ? 'points-earned' : ''}`}>
                        {ms.total > 0 ? `+${ms.total}` : '0'}
                      </span>
                    </div>
                    <div className="stat-match-result">
                      Результат: <strong>{ms.actual.score1}:{ms.actual.score2}</strong>
                    </div>
                    {ms.details.length > 0 && (
                      <div className="stat-details-list">
                        {ms.details.map((d, di) => (
                          <span key={di} className="stat-detail-badge">
                            {SCORING_LABELS[d.rule] || d.rule}: +{d.points}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {detailHistory?.finalsScore && (
            <div className="stat-section">
              <h3>🏆 Финалисты групп</h3>
              <p className="stat-section-total">Всего: +{detailHistory.finalsScore.total}</p>
              <div className="stat-details-list">
                {detailHistory.finalsScore.details.map((d, di) => (
                  <span key={di} className="stat-detail-badge">
                    {d.group}: {d.team} +{d.points}
                  </span>
                ))}
              </div>
            </div>
          )}

          {detailHistory?.winnersScore && (
            <div className="stat-section">
              <h3>👑 Победители турнира</h3>
              <p className="stat-section-total">Всего: +{detailHistory.winnersScore.total}</p>
              <div className="stat-details-list">
                {detailHistory.winnersScore.details.map((d, di) => (
                  <span key={di} className="stat-detail-badge">
                    {SCORING_LABELS[d.rule] || d.rule}: {d.team || ''} +{d.points}
                  </span>
                ))}
              </div>
            </div>
          )}

          {detailHistory &&
            detailHistory.matchScores.length === 0 &&
            !detailHistory.finalsScore &&
            !detailHistory.winnersScore && (
              <p className="empty-state">Нет сыгранных прогнозов</p>
          )}
        </div>
      )}
    </div>
  );
}

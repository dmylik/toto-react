import { getAllUsersScores } from '../utils/scoring';
import { useData } from '../context/DataContext';

export default function StatisticsPage() {
  const { data } = useData();
  const scores = getAllUsersScores(data);

  if (scores.length === 0) {
    return (
      <div className="statistics-page">
        <h1 className="page-title">📊 Таблица лидеров</h1>
        <p className="empty-state">Пока нет участников. Пригласите друзей!</p>
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <h1 className="page-title">📊 Таблица лидеров</h1>

      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Участник</th>
            <th>Баллы</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s, i) => (
            <tr key={s.userId} className={i === 0 ? 'leader' : ''}>
              <td className="rank-cell">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
              </td>
              <td>{s.username}</td>
              <td className="score-cell">{s.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export default function GroupTable({ groupKey }) {
  const { data } = useData();
  const { user } = useAuth();
  const group = data.groups[groupKey];

  if (!group) return null;

  const teams = group.teams.map(team => {
    const matches = data.matches.filter(
      m => m.group === groupKey && (m.team1 === team || m.team2 === team)
    );
    let played = 0, wins = 0, draws = 0, losses = 0;
    let goalsFor = 0, goalsAgainst = 0;

    matches.forEach(m => {
      if (m.played) {
        played++;
        let gf, ga;
        if (m.team1 === team) {
          gf = m.score1;
          ga = m.score2;
        } else {
          gf = m.score2;
          ga = m.score1;
        }
        goalsFor += gf;
        goalsAgainst += ga;
        if (gf > ga) wins++;
        else if (gf === ga) draws++;
        else losses++;
      }
    });

    const points = wins * 3 + draws;
    const gd = goalsFor - goalsAgainst;

    return { name: team, played, wins, draws, losses, goalsFor, goalsAgainst, gd, points };
  });

  teams.sort((a, b) => b.points - a.points || b.gd - a.gd || b.goalsFor - a.goalsFor);

  return (
    <div className="group-table-wrapper">
      <h3 className="group-title">{group.name}</h3>
      <table className="group-table">
        <thead>
          <tr>
            <th>#</th>
            <th className="col-team">Команда</th>
            <th>И</th>
            <th>В</th>
            <th>Н</th>
            <th>П</th>
            <th>Г</th>
            <th>РГ</th>
            <th>О</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => (
            <tr key={t.name} className={i < 2 ? 'qualifying' : ''}>
              <td>{i + 1}</td>
              <td className="col-team">{t.name}</td>
              <td>{t.played}</td>
              <td>{t.wins}</td>
              <td>{t.draws}</td>
              <td>{t.losses}</td>
              <td>{t.goalsFor}:{t.goalsAgainst}</td>
              <td>{t.gd > 0 ? '+' : ''}{t.gd}</td>
              <td className="col-points">{t.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

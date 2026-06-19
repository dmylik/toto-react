import { useMemo } from 'react';
import { useData } from '../context/DataContext';

/**
 * Вычисляет H2H-статистику команды против указанного набора соперников
 */
function computeHeadToHead(teamName, opponentNames, groupKey, data) {
  let points = 0, goalsFor = 0, goalsAgainst = 0;

  const matches = data.matches.filter(m =>
    m.group === groupKey &&
    m.played &&
    (m.team1 === teamName || m.team2 === teamName) &&
    opponentNames.includes(m.team1 === teamName ? m.team2 : m.team1)
  );

  matches.forEach(m => {
    if (m.team1 === teamName) {
      goalsFor += m.score1;
      goalsAgainst += m.score2;
      if (m.score1 > m.score2) points += 3;
      else if (m.score1 === m.score2) points += 1;
    } else {
      goalsFor += m.score2;
      goalsAgainst += m.score1;
      if (m.score2 > m.score1) points += 3;
      else if (m.score2 === m.score1) points += 1;
    }
  });

  return { points, gd: goalsFor - goalsAgainst, goalsFor };
}

/**
 * Рекурсивно разрешает равенство среди группы команд по критериям ФИФА:
 * 1. Очки в личных встречах
 * 2. Разница мячей в личных встречах
 * 3. Забитые голы в личных встречах
 * 4. Общая разница мячей
 * 5. Общее количество забитых мячей
 */
function resolveTiedGroup(tiedTeams, groupKey, data) {
  if (tiedTeams.length <= 1) return tiedTeams;

  const teamNames = tiedTeams.map(t => t.name);

  // Шаг 1: H2H среди всех tied-команд
  tiedTeams.forEach(team => {
    const h2h = computeHeadToHead(team.name, teamNames, groupKey, data);
    team.h2hPoints = h2h.points;
    team.h2hGD = h2h.gd;
    team.h2hGF = h2h.goalsFor;
  });

  tiedTeams.sort((a, b) => {
    // 1a. Очки в личных встречах
    if (a.h2hPoints !== b.h2hPoints) return b.h2hPoints - a.h2hPoints;
    // 1b. Разница мячей в личных встречах
    if (a.h2hGD !== b.h2hGD) return b.h2hGD - a.h2hGD;
    // 1c. Забитые голы в личных встречах
    if (a.h2hGF !== b.h2hGF) return b.h2hGF - a.h2hGF;
    // 2a. Общая разница мячей
    if (a.gd !== b.gd) return b.gd - a.gd;
    // 2b. Общее количество забитых мячей
    if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
    return 0;
  });

  // Рекурсивно разрешаем подгруппы, которые всё ещё равны
  let i = 0;
  while (i < tiedTeams.length) {
    let j = i;
    while (j < tiedTeams.length &&
           tiedTeams[j].h2hPoints === tiedTeams[i].h2hPoints &&
           tiedTeams[j].h2hGD === tiedTeams[i].h2hGD &&
           tiedTeams[j].h2hGF === tiedTeams[i].h2hGF &&
           tiedTeams[j].gd === tiedTeams[i].gd &&
           tiedTeams[j].goalsFor === tiedTeams[i].goalsFor) {
      j++;
    }
    if (j - i >= 2) {
      const subTied = resolveTiedGroup(tiedTeams.slice(i, j), groupKey, data);
      tiedTeams.splice(i, j - i, ...subTied);
    }
    i = j;
  }

  return tiedTeams;
}

export default function GroupTable({ groupKey }) {
  const { data } = useData();
  const group = data.groups[groupKey];

  const teams = useMemo(() => {
    if (!group) return [];

    // Собираем базовую статистику для каждой команды
    const stats = group.teams.map(team => {
      const matches = data.matches.filter(
        m => m.group === groupKey && (m.team1 === team || m.team2 === team)
      );
      let played = 0, wins = 0, draws = 0, losses = 0;
      let goalsFor = 0, goalsAgainst = 0;

      matches.forEach(m => {
        if (m.played) {
          played++;
          const [gf, ga] = m.team1 === team ? [m.score1, m.score2] : [m.score2, m.score1];
          goalsFor += gf;
          goalsAgainst += ga;
          if (gf > ga) wins++;
          else if (gf === ga) draws++;
          else losses++;
        }
      });

      return {
        name: team,
        played, wins, draws, losses,
        goalsFor, goalsAgainst,
        gd: goalsFor - goalsAgainst,
        points: wins * 3 + draws,
      };
    });

    // Первичная сортировка по очкам
    stats.sort((a, b) => b.points - a.points);

    // Разрешаем равенство по группам очков
    let i = 0;
    while (i < stats.length) {
      let j = i;
      while (j < stats.length && stats[j].points === stats[i].points) j++;
      if (j - i >= 2) {
        const resolved = resolveTiedGroup(stats.slice(i, j), groupKey, data);
        stats.splice(i, j - i, ...resolved);
      }
      i = j;
    }

    return stats;
  }, [group, data, groupKey]);

  if (!group) return null;

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

// ===== Default scoring config =====
export const DEFAULT_SCORING = {
  matchOutcome: 3,      // Угадан исход матча
  goalDifference: 3,    // Угадана разница голов
  teamGoals: 1,         // Угадано кол-во голов одной команды
  offByOne: 1,           // Прогноз отличается на 1 гол
  exactScore: 1,         // Полностью угадан счёт
  groupFinalist: 1,      // Угадан финалист группы
  finalist: 15,          // Угадана команда-финалист
  champion: 15,          // Угадан победитель турнира (+15 дополнительно к +15 за финалиста)
  thirdPlace: 10,        // Угадано 3 место
};

// ===== Helpers =====

export function isPredicationBlocked(match) {
  if (!match || !match.dateTime) return false;
  const matchTime = new Date(match.dateTime).getTime();
  const now = Date.now();
  return (matchTime - now) < 30 * 60 * 1000;
}

export function getScoringConfig(data) {
  return { ...DEFAULT_SCORING, ...(data?.app?.scoring || {}) };
}

// ===== Match Score Calculation =====

/**
 * Returns { total, details[] } where details is an array of { rule, points }.
 */
export function calculateMatchScore(prediction, actual, scoringConfig) {
  const cfg = scoringConfig || DEFAULT_SCORING;

  if (!prediction || !actual) return { total: 0, details: [] };
  if (actual.score1 === null || actual.score2 === null) return { total: 0, details: [] };

  const predScore1 = Number(prediction.score1);
  const predScore2 = Number(prediction.score2);
  const actScore1 = Number(actual.score1);
  const actScore2 = Number(actual.score2);

  if (isNaN(predScore1) || isNaN(predScore2)) return { total: 0, details: [] };

  const details = [];

  // 1. Correct outcome (win/loss/draw)
  const predDiff = predScore1 - predScore2;
  const actDiff = actScore1 - actScore2;
  const outcomeMatch =
    (predDiff > 0 && actDiff > 0) ||
    (predDiff < 0 && actDiff < 0) ||
    (predDiff === 0 && actDiff === 0);

  if (outcomeMatch) {
    details.push({ rule: 'matchOutcome', points: cfg.matchOutcome });
  }

  // 2. Correct goal difference
  if (predDiff === actDiff) {
    details.push({ rule: 'goalDifference', points: cfg.goalDifference });
  }

  // 3. Correct goals by one team
  if (predScore1 === actScore1) {
    details.push({ rule: 'teamGoals', points: cfg.teamGoals });
  }
  if (predScore2 === actScore2) {
    details.push({ rule: 'teamGoals', points: cfg.teamGoals });
  }

  // 4. Total goals off by 1
  const predTotal = predScore1 + predScore2;
  const actTotal = actScore1 + actScore2;
  if (Math.abs(predTotal - actTotal) === 1) {
    details.push({ rule: 'offByOne', points: cfg.offByOne });
  }

  // 5. Exact score
  if (predScore1 === actScore1 && predScore2 === actScore2) {
    details.push({ rule: 'exactScore', points: cfg.exactScore });
  }

  const total = details.reduce((sum, d) => sum + d.points, 0);
  return { total, details };
}

// ===== Finals Score Calculation =====

export function calculateFinalsScore(userFinals, actualFinals, scoringConfig) {
  const cfg = scoringConfig || DEFAULT_SCORING;
  if (!userFinals || !actualFinals) return { total: 0, details: [] };

  const details = [];
  const groups = Object.keys(actualFinals);

  for (const group of groups) {
    const actualWinners = actualFinals[group] || [];
    const userWinners = userFinals[group] || [];

    for (const team of userWinners) {
      if (actualWinners.includes(team)) {
        details.push({
          rule: 'groupFinalist',
          points: cfg.groupFinalist,
          group,
          team,
        });
      }
    }
  }

  const total = details.reduce((sum, d) => sum + d.points, 0);
  return { total, details };
}

// ===== Winners Score Calculation =====

export function calculateWinnersScore(userWinners, actualWinners, scoringConfig) {
  const cfg = scoringConfig || DEFAULT_SCORING;
  if (!userWinners || !actualWinners) return { total: 0, details: [] };

  const details = [];

  // Финалисты (1-е и 2-е место) — +15 за каждую угаданную команду в финале,
  // независимо от того, на каком именно месте (1-м или 2-м) она оказалась
  const userFinalists = [userWinners.first, userWinners.second].filter(Boolean);
  const actualFinalists = [actualWinners.first, actualWinners.second].filter(Boolean);

  for (const userTeam of userFinalists) {
    if (actualFinalists.includes(userTeam)) {
      details.push({ rule: 'finalist', points: cfg.finalist, team: userTeam });
    }
  }

  // Победитель турнира (1-е место) — дополнительно +15 сверху (+15 за финалиста +15 за чемпиона = +30)
  if (userWinners.first && userWinners.first === actualWinners.first) {
    details.push({ rule: 'champion', points: cfg.champion, team: userWinners.first });
  }

  // 3-е место — +10
  if (userWinners.third && userWinners.third === actualWinners.third) {
    details.push({ rule: 'thirdPlace', points: cfg.thirdPlace, team: userWinners.third });
  }

  const total = details.reduce((sum, d) => sum + d.points, 0);
  return { total, details };
}

// ===== Helper: check if all group stage matches are played =====

export function areAllGroupMatchesPlayed(data) {
  const groupMatches = (data.matches || []).filter(m => m.stage === 'group');
  if (groupMatches.length === 0) return false;
  return groupMatches.every(m => m.played);
}

// ===== Total Score =====

export function calculateTotalScore(userId, data) {
  const cfg = getScoringConfig(data);
  let total = 0;
  const allGroupPlayed = areAllGroupMatchesPlayed(data);

  // Match predictions
  const userPredictions = data.predictions[userId] || {};
  for (const matchId of Object.keys(userPredictions)) {
    const match = data.matches.find(m => m.id === matchId);
    if (match && match.played) {
      total += calculateMatchScore(userPredictions[matchId], match, cfg).total;
    }
  }

  // Finals predictions — начисляются только после завершения всех матчей группового этапа
  if (allGroupPlayed) {
    const actualFinals = data.actualFinals || {};
    const userFinals = data.finals[userId] || {};
    total += calculateFinalsScore(userFinals, actualFinals, cfg).total;
  }

  // Winners prediction — начисляются только после завершения всех матчей группового этапа
  if (allGroupPlayed) {
    const actualWinners = data.actualWinners || {};
    const userWinners = data.winners[userId] || {};
    total += calculateWinnersScore(userWinners, actualWinners, cfg).total;
  }

  return total;
}

// ===== Score History (detailed breakdown) =====

export function getDetailedScoreHistory(userId, data) {
  const cfg = getScoringConfig(data);
  const allGroupPlayed = areAllGroupMatchesPlayed(data);
  const history = {
    userId,
    matchScores: [],
    finalsScore: null,
    winnersScore: null,
    total: 0,
  };

  // Match scores
  const userPredictions = data.predictions[userId] || {};
  for (const matchId of Object.keys(userPredictions)) {
    const match = data.matches.find(m => m.id === matchId);
    if (match && match.played) {
      const result = calculateMatchScore(userPredictions[matchId], match, cfg);
      history.matchScores.push({
        matchId,
        team1: match.team1,
        team2: match.team2,
        group: match.group,
        stage: match.stage,
        prediction: userPredictions[matchId],
        actual: { score1: match.score1, score2: match.score2 },
        total: result.total,
        details: result.details,
      });
    }
  }

  // Finals — начисляются только после завершения всех матчей группового этапа
  if (allGroupPlayed) {
    const actualFinals = data.actualFinals || {};
    const userFinals = data.finals[userId] || {};
    const finalsResult = calculateFinalsScore(userFinals, actualFinals, cfg);
    if (finalsResult.details.length > 0) {
      history.finalsScore = { total: finalsResult.total, details: finalsResult.details };
    }
  }

  // Winners — начисляются только после завершения всех матчей группового этапа
  if (allGroupPlayed) {
    const actualWinners = data.actualWinners || {};
    const userWinners = data.winners[userId] || {};
    const winnersResult = calculateWinnersScore(userWinners, actualWinners, cfg);
    if (winnersResult.details.length > 0) {
      history.winnersScore = { total: winnersResult.total, details: winnersResult.details };
    }
  }

  history.total =
    history.matchScores.reduce((sum, s) => sum + s.total, 0) +
    (history.finalsScore?.total || 0) +
    (history.winnersScore?.total || 0);

  return history;
}

// ===== Leaderboard =====

export function getAllUsersScores(data) {
  const scores = [];

  for (const user of data.users) {
    if (user.role === 'admin') continue;
    if (user.status !== 'approved') continue;
    const totalScore = calculateTotalScore(user.id, data);
    scores.push({
      userId: user.id,
      username: user.username,
      fullname: user.fullname || user.username,
      score: totalScore,
    });
  }

  scores.sort((a, b) => b.score - a.score);
  return scores;
}

// ===== Date Formatting =====

export function formatMatchDateTime(dateTimeStr) {
  if (!dateTimeStr) return '';
  const d = new Date(dateTimeStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}. ${hours}:${mins}`;
}

// ===== Scoring Labels (for UI) =====

export const SCORING_LABELS = {
  matchOutcome: 'Исход матча',
  goalDifference: 'Разница голов',
  teamGoals: 'Голы одной команды',
  offByOne: 'Отличие на 1 гол',
  exactScore: 'Точный счёт',
  groupFinalist: 'Финалист группы',
  finalist: 'Финалист турнира (любая позиция 1-2)',
  champion: 'Победитель турнира (дополнительно к финалисту)',
  thirdPlace: '3-е место',
};

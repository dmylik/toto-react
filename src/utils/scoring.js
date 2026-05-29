export function isPredicationBlocked(match) {
  if (!match || !match.dateTime) return false;
  const matchTime = new Date(match.dateTime).getTime();
  const now = Date.now();
  return (matchTime - now) < 30 * 60 * 1000; // less than 30 min until match
}

export function calculateMatchScore(prediction, actual) {
  if (!prediction || !actual) return 0;
  if (actual.score1 === null || actual.score2 === null) return 0;

  const predScore1 = Number(prediction.score1);
  const predScore2 = Number(prediction.score2);
  const actScore1 = Number(actual.score1);
  const actScore2 = Number(actual.score2);

  if (isNaN(predScore1) || isNaN(predScore2)) return 0;

  // Exact score = 3 points
  if (predScore1 === actScore1 && predScore2 === actScore2) {
    return 3;
  }

  // Correct outcome (win/loss/draw) = 1 point
  const predDiff = predScore1 - predScore2;
  const actDiff = actScore1 - actScore2;

  if ((predDiff > 0 && actDiff > 0) ||
      (predDiff < 0 && actDiff < 0) ||
      (predDiff === 0 && actDiff === 0)) {
    return 1;
  }

  return 0;
}

export function calculateFinalsScore(userFinals, actualFinals) {
  if (!userFinals || !actualFinals) return 0;

  let score = 0;
  const groups = Object.keys(actualFinals);

  for (const group of groups) {
    const actualWinners = actualFinals[group] || [];
    const userWinners = userFinals[group] || [];

    for (const team of userWinners) {
      if (actualWinners.includes(team)) {
        score += 2; // 2 points per correctly predicted finalist
      }
    }
  }

  return score;
}

export function calculateWinnersScore(userWinners, actualWinners) {
  if (!userWinners || !actualWinners) return 0;
  let score = 0;

  // 1st place = 5 points
  if (userWinners.first && userWinners.first === actualWinners.first) {
    score += 5;
  }
  // 2nd place = 3 points
  if (userWinners.second && userWinners.second === actualWinners.second) {
    score += 3;
  }
  // 3rd place = 2 points
  if (userWinners.third && userWinners.third === actualWinners.third) {
    score += 2;
  }

  return score;
}

export function calculateTotalScore(userId, data) {
  let score = 0;

  // Match predictions
  const userPredictions = data.predictions[userId] || {};
  for (const matchId of Object.keys(userPredictions)) {
    const match = data.matches.find(m => m.id === matchId);
    if (match && match.played) {
      score += calculateMatchScore(userPredictions[matchId], match);
    }
  }

  // Finals predictions
  const actualFinals = data.actualFinals || {};
  const userFinals = data.finals[userId] || {};
  score += calculateFinalsScore(userFinals, actualFinals);

  // Winners prediction
  const actualWinners = data.actualWinners || {};
  const userWinners = data.winners[userId] || {};
  score += calculateWinnersScore(userWinners, actualWinners);

  return score;
}

export function getAllUsersScores(data) {
  const scores = [];

  for (const user of data.users) {
    if (user.role === 'admin') continue;
    if (user.status !== 'approved') continue;
    const totalScore = calculateTotalScore(user.id, data);
    scores.push({
      userId: user.id,
      username: user.username,
      score: totalScore,
    });
  }

  scores.sort((a, b) => b.score - a.score);
  return scores;
}

export function formatMatchDateTime(dateTimeStr) {
  if (!dateTimeStr) return '';
  const d = new Date(dateTimeStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}. ${hours}:${mins}`;
}

/**
 * Cron script for auto-fetching World Cup match results from API-Football.
 * Run separately: node server/cron-fetch.cjs
 * Or via PM2: pm2 start server/cron-fetch.cjs --name toto-cron
 *
 * Requires: npm install node-cron
 * Requires: API key from https://www.api-football.com/
 */

const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

// ===== CONFIGURATION =====
const API_KEY = process.env.API_FOOTBALL_KEY || 'ВАШ_API_KEY';
const WORLD_CUP_ID = 1;
const SEASON = 2026;
const DATA_FILE = path.join(__dirname, 'data.json');
const POLL_INTERVAL_MINUTES = 10;

// ===== Fetch match results from API =====
async function fetchMatchesByDate(dateStr) {
  const url = `https://v3.football.api-sports.io/fixtures?league=${WORLD_CUP_ID}&season=${SEASON}&date=${dateStr}`;
  
  const response = await fetch(url, {
    headers: {
      'x-rapidapi-host': 'v3.football.api-sports.io',
      'x-rapidapi-key': API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`API responded with ${response.status}`);
  }

  const data = await response.json();
  return data.response || [];
}

// ===== Sync results with local data.json =====
async function syncResults() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`[${new Date().toLocaleString()}] Checking results for ${today}...`);

  try {
    const fixtures = await fetchMatchesByDate(today);

    if (fixtures.length === 0) {
      console.log('  No matches scheduled for today.');
      return;
    }

    // Read current data
    if (!fs.existsSync(DATA_FILE)) {
      console.log('  data.json not found, skipping.');
      return;
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    let updated = false;

    for (const item of fixtures) {
      const status = item.fixture.status.short; // 'NS', '1H', '2H', 'FT', 'AET', 'PEN'
      const homeTeam = item.teams.home.name;
      const awayTeam = item.teams.away.name;
      const goalsHome = item.goals.home;
      const goalsAway = item.goals.away;

      // Only sync finished matches
      if (!['FT', 'AET', 'PEN'].includes(status)) continue;
      if (goalsHome === null || goalsAway === null) continue;

      // Find matching match in our data by team names + date
      const match = data.matches?.find(m => {
        if (m.played) return false; // already synced
        if (!m.dateTime || !m.dateTime.startsWith(today)) return false;
        // Fuzzy team name match
        const t1match = normalizeTeam(m.team1) === normalizeTeam(homeTeam) ||
                        normalizeTeam(m.team1).includes(normalizeTeam(homeTeam)) ||
                        normalizeTeam(homeTeam).includes(normalizeTeam(m.team1));
        const t2match = normalizeTeam(m.team2) === normalizeTeam(awayTeam) ||
                        normalizeTeam(m.team2).includes(normalizeTeam(awayTeam)) ||
                        normalizeTeam(awayTeam).includes(normalizeTeam(m.team2));
        return t1match && t2match;
      });

      if (match) {
        console.log(`  ✅ ${homeTeam} ${goalsHome}:${goalsAway} ${awayTeam} → synced to match #${match.id}`);
        match.score1 = goalsHome;
        match.score2 = goalsAway;
        match.played = true;
        updated = true;
      } else {
        console.log(`  ⚠️ No match found for: ${homeTeam} ${goalsHome}:${goalsAway} ${awayTeam}`);
      }
    }

    if (updated) {
      // Backup before writing
      const backupFile = DATA_FILE.replace('.json', `.backup-${today}.json`);
      fs.copyFileSync(DATA_FILE, backupFile);

      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
      console.log('  💾 Data saved. Backup:', backupFile);
    }
  } catch (error) {
    console.error('  ❌ Error:', error.message);
  }
}

function normalizeTeam(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]/g, '')
    .trim();
}

// ===== Schedule: every N minutes =====
const cronExpression = `*/${POLL_INTERVAL_MINUTES} * * * *`;

cron.schedule(cronExpression, () => {
  syncResults();
});

console.log(`🕐 Cron started: checking every ${POLL_INTERVAL_MINUTES} minutes`);
console.log(`   API: api-sports.io | League: World Cup ${SEASON}`);
console.log(`   Data file: ${DATA_FILE}`);

// Run once on start
syncResults();

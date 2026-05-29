const fs = require('fs');
const path = require('path');

// Read games.html
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'games.html'), 'utf-8');

// Read current db.json
const dbPath = path.join(__dirname, '..', 'src', 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

// Parse rounds
const rounds = html.match(/<div class="event__round[^"]*"[^>]*>(.*?)<\/div>/g);
const roundsText = rounds ? rounds.map(r => r.replace(/<[^>]+>/g, '').trim()) : [];

// Parse matches
const matchPattern = /<div id="g_1_[^"]*"[^>]*>[^]*?<div class="event__time">([\d.]+)\s+([\d:]+)<\/div>[^]*?<span[^>]*>([^<]+)<\/span>[^]*?<span[^>]*>([^<]+)<\/span>/g;

let match;
let matches = [];
let roundIndex = 0;
let matchOrder = 1;

// Split by round sections
const roundSections = html.split(/<div class="event__round[^>]*>/);
roundSections.shift(); // Remove content before first round

for (let ri = 0; ri < roundSections.length; ri++) {
  const section = roundSections[ri];
  const roundText = section.match(/class="event__round[^"]*"[^>]*>([^<]+)</);
  const roundName = roundText ? roundText[1].trim() : `Тур ${ri + 1}`;
  
  const sectionMatches = [...section.matchAll(matchPattern)];
  
  for (const m of sectionMatches) {
    const dateStr = m[1]; // "11.06"
    const timeStr = m[2]; // "22:00"
    const homeTeam = m[3].trim();
    const awayTeam = m[4].trim();
    
    // Find which group this match belongs to
    let groupKey = null;
    for (const [key, group] of Object.entries(db.groups)) {
      if (group.teams.includes(homeTeam) && group.teams.includes(awayTeam)) {
        groupKey = key;
        break;
      }
    }
    
    if (!groupKey) {
      console.log(`Could not find group for: ${homeTeam} vs ${awayTeam}`);
      continue;
    }
    
    // Convert date to ISO: assume year 2026
    const [day, month] = dateStr.split('.');
    const dateTime = `2026-${month}-${day.padStart(2, '0')}T${timeStr}:00`;
    
    matches.push({
      id: `${groupKey}_${matchOrder}`,
      group: groupKey,
      team1: homeTeam,
      team2: awayTeam,
      score1: null,
      score2: null,
      played: false,
      stage: 'group',
      matchOrder: matchOrder++,
      dateTime: dateTime,
      round: roundName,
    });
  }
}

// Update db.json
db.matches = matches;

// Save
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
console.log(`Parsed ${matches.length} matches and updated db.json`);

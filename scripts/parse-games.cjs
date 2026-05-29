const fs = require('fs');
const path = require('path');

// Read games.html from parent folder (d:\Work\Toto\games.html)
const gamesHtmlPath = path.join(__dirname, '..', '..', 'games.html');
console.log('Reading:', gamesHtmlPath);
const html = fs.readFileSync(gamesHtmlPath, 'utf-8');

// Read current db.json
const dbPath = path.join(__dirname, '..', 'src', 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

// Parse matches
const matchPattern = /<div class="event__time">([\d.]+)\s+([\d:]+)<\/div>[\s\S]*?<span[^>]*class="[^"]*wcl-name[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<span[^>]*class="[^"]*wcl-name[^"]*"[^>]*>([^<]+)<\/span>/g;

let matches = [];
let matchOrder = 1;

// Split by round sections
const roundSections = html.split(/<div class="event__round[^>]*>/);
roundSections.shift(); // Remove content before first round

for (let ri = 0; ri < roundSections.length; ri++) {
  const section = roundSections[ri];
  
  // Reset regex for this section
  const sectionMatchPattern = /<div class="event__time">([\d.]+)\s+([\d:]+)<\/div>[\s\S]*?<span[^>]*class="[^"]*wcl-name[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<span[^>]*class="[^"]*wcl-name[^"]*"[^>]*>([^<]+)<\/span>/g;
  
  let m;
  while ((m = sectionMatchPattern.exec(section)) !== null) {
    const dateStr = m[1]; // "11.06"
    const timeStr = m[2]; // "22:00"
    const team1 = m[3].trim();
    const team2 = m[4].trim();
    
    // Find which group this match belongs to
    let groupKey = null;
    for (const [key, group] of Object.entries(db.groups)) {
      if (group.teams.includes(team1) && group.teams.includes(team2)) {
        groupKey = key;
        break;
      }
    }
    
    if (!groupKey) {
      // Try swapped
      for (const [key, group] of Object.entries(db.groups)) {
        if (group.teams.includes(team2) && group.teams.includes(team1)) {
          groupKey = key;
          break;
        }
      }
    }
    
    if (!groupKey) {
      console.log(`Could not find group for: ${team1} vs ${team2}`);
      continue;
    }
    
    // Convert date to ISO: assume year 2026
    const [day, month] = dateStr.split('.');
    const dateTime = `2026-${month}-${day.padStart(2, '0')}T${timeStr}:00`;
    
    matches.push({
      id: `M${matchOrder}`,
      group: groupKey,
      team1: team1,
      team2: team2,
      score1: null,
      score2: null,
      played: false,
      stage: 'group',
      matchOrder: matchOrder++,
      dateTime: dateTime,
    });
  }
}

// Update db.json
db.matches = matches;

// Save
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
console.log(`Parsed ${matches.length} matches and updated db.json`);

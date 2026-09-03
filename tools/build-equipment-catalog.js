const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const DIR = path.join(__dirname, '..');
const DB = process.env.MASTERS_DB || '/Users/mrzacarias/LET IT DIE-extracted/LET IT DIE/BrgGame/Content/masters.db';

// name map: text id -> English (lang='int') display name
const tq = "SELECT id, txt FROM master_text WHERE lang='int';";
const tout = cp.execFileSync('sqlite3', [DB, tq], { encoding: 'utf8' });
const nameMap = {};
tout.split('\n').forEach(l => {
  const i = l.indexOf('|');
  if (i < 0) return;
  nameMap[l.slice(0, i)] = l.slice(i + 1);
});

// parts: id, name (text key ref), type
const pq = 'SELECT id, name, type FROM master_part;';
const pout = cp.execFileSync('sqlite3', [DB, pq], { encoding: 'utf8' });
const cat = {};
pout.trim().split('\n').filter(Boolean).forEach(l => {
  const [id, name, type] = l.split('|');
  const key = (name || '').split('.').pop();
  cat[id] = { name: nameMap[key] || nameMap['TXT_' + id] || null, type: type || null };
});

fs.writeFileSync(path.join(DIR, 'data', 'equipment-catalog.json'), JSON.stringify(cat));
const js = 'window.PT_CATALOG=' + JSON.stringify(cat) + ';\n';
fs.writeFileSync(path.join(DIR, 'equipment-catalog.js'), js);

const named = Object.values(cat).filter(c => c.name).length;
console.log('equipment catalog entries:', Object.keys(cat).length, '(named:', named + ')');

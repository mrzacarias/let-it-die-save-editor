const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const DIR = path.join(__dirname, '..');
const DB = process.env.MASTERS_DB || '/Users/mrzacarias/LET IT DIE-extracted/LET IT DIE/BrgGame/Content/masters.db';

// name map: text id -> English display name
const tq = "SELECT id, txt FROM master_text WHERE lang='int';";
const tout = cp.execFileSync('sqlite3', [DB, tq], { encoding: 'utf8' });
const nameMap = {};
tout.split('\n').forEach(l => { const i = l.indexOf('|'); if (i >= 0) nameMap[l.slice(0, i)] = l.slice(i + 1); });

// ptarmtp -> name key (WEAPON_CTGRY.TXT_PT_ARM_WP000_001)
const q = "SELECT id, name FROM master_ptarm_type;";
const out = cp.execFileSync('sqlite3', [DB, q], { encoding: 'utf8' });
const map = {};
out.trim().split('\n').filter(Boolean).forEach(l => {
  const [id, name] = l.split('|');
  const key = (name || '').split('.').pop();
  map[id] = nameMap[key] || null;
});

fs.writeFileSync(path.join(DIR, 'data', 'mastery-catalog.json'), JSON.stringify(map, null, 1));
const js = 'window.MASTERY_CATALOG=' + JSON.stringify(map) + ';\n';
fs.writeFileSync(path.join(DIR, 'mastery-catalog.js'), js);
console.log('mastery catalog entries:', Object.keys(map).length);

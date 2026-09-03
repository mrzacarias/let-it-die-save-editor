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

// ptarmtp -> name key
const q = "SELECT id, name FROM master_ptarm_type;";
const out = cp.execFileSync('sqlite3', [DB, q], { encoding: 'utf8' });
const names = {};
out.trim().split('\n').filter(Boolean).forEach(l => {
  const [id, name] = l.split('|');
  names[id] = nameMap[(name || '').split('.').pop()] || null;
});

// ptarmtp -> { lvl: cumulative abp } (full mastery curve)
const aq = "SELECT ptarmtp, lvl, abp FROM master_expert_lvl_reward ORDER BY ptarmtp, lvl;";
const aout = cp.execFileSync('sqlite3', [DB, aq], { encoding: 'utf8' });
const abp = {};
aout.trim().split('\n').filter(Boolean).forEach(l => {
  const [id, lvl, a] = l.split('|');
  (abp[id] = abp[id] || {})[lvl] = Number(a);
});

fs.writeFileSync(path.join(DIR, 'data', 'mastery-catalog.json'), JSON.stringify({ names, abp }, null, 1));
const js = 'window.MASTERY_CATALOG=' + JSON.stringify(names) + ';\nwindow.MASTERY_ABP=' + JSON.stringify(abp) + ';\n';
fs.writeFileSync(path.join(DIR, 'mastery-catalog.js'), js);

console.log('mastery catalog:', Object.keys(names).length, 'weapons,', Object.keys(abp).length, 'with mastery curve');

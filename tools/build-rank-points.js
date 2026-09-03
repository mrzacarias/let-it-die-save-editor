const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const DIR = path.join(__dirname, '..');
const DB = process.env.MASTERS_DB || '/Users/mrzacarias/LET IT DIE-extracted/LET IT DIE/BrgGame/Content/masters.db';

const q = 'SELECT rank, rank_point FROM master_rank_point ORDER BY rank;';
const out = cp.execFileSync('sqlite3', [DB, q], { encoding: 'utf8' });
const map = {};
out.trim().split('\n').filter(Boolean).forEach(l => {
  const [rank, rp] = l.split('|');
  map[rank] = Number(rp);
});

fs.writeFileSync(path.join(DIR, 'data', 'rank-points.json'), JSON.stringify(map, null, 1));
const js = 'window.RANK_POINTS=' + JSON.stringify(map) + ';\n';
fs.writeFileSync(path.join(DIR, 'rank-points.js'), js);
console.log('rank points:', Object.keys(map).length, '(max rank ' + Object.keys(map).length + ')');

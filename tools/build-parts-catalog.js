const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const DIR = path.join(__dirname, '..');
const DB = process.env.MASTERS_DB || '/Users/mrzacarias/LET IT DIE-extracted/LET IT DIE/BrgGame/Content/masters.db';

// full part list with tier chain + tier kind (normal / uncap / tengoku)
const q = 'SELECT mp.id, mp.type, mp.nextptid, mp.is_limitbreak, mp.is_drop FROM master_part mp JOIN master_part_research mpr ON mp.id=mpr.ptid AND mpr.is_open=1;';
const out = cp.execFileSync('sqlite3', [DB, q], { encoding: 'utf8' });

const cat = JSON.parse(fs.readFileSync(path.join(DIR, 'data', 'equipment-catalog.json'), 'utf8'));
const tname = { PTTP_ARM: 'Weapon', PTTP_BODY: 'Body', PTTP_HEAD: 'Head', PTTP_LEGS: 'Legs' };

const outMap = {};
out.trim().split('\n').filter(Boolean).forEach(l => {
  const [id, type, next, lb, isDrop] = l.split('|');
  const lbN = +lb, dropN = +isDrop;
  // uncap = normal limit-break continuation tier (is_limitbreak=5)
  // tengoku = single-tier legendary weapon (e.g. Mad Police) going straight to +24
  const kind = lbN === 5 ? 'uncap' : (dropN === 2 && !next && type === 'PTTP_ARM' ? 'tengoku' : 'normal');
  outMap[id] = {
    name: (cat[id] && cat[id].name) || id,
    type: tname[type] || type,
    next: next || '',
    kind,
  };
});

fs.writeFileSync(path.join(DIR, 'data', 'parts.json'), JSON.stringify(outMap, null, 1));
const js = 'window.PARTS_CATALOG=' + JSON.stringify(outMap) + ';\n';
fs.writeFileSync(path.join(DIR, 'parts-catalog.js'), js);

console.log('parts:', Object.keys(outMap).length);

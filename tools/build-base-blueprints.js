const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const DIR = path.join(__dirname, '..');
const DB = process.env.MASTERS_DB || '/Users/mrzacarias/LET IT DIE-extracted/LET IT DIE/BrgGame/Content/masters.db';

// full researchable part list with chain + acquisition info
const q = 'SELECT mp.id, mp.type, mp.nextptid, mp.is_drop FROM master_part mp JOIN master_part_research mpr ON mp.id=mpr.ptid AND mpr.is_open=1;';
const out = cp.execFileSync('sqlite3', [DB, q], { encoding: 'utf8' });
const parts = out.trim().split('\n').filter(Boolean).map(l => {
  const [id, type, nextptid, is_drop] = l.split('|');
  return { id, type, nextptid, is_drop: +is_drop };
});

// family roots = parts not referenced by any nextptid
const pointedTo = new Set(parts.map(p => p.nextptid).filter(Boolean));
const roots = parts.filter(p => !pointedTo.has(p.id));

// names/types from the existing equipment catalog
const cat = JSON.parse(fs.readFileSync(path.join(DIR, 'data', 'equipment-catalog.json'), 'utf8'));
const tname = { PTTP_ARM: 'Weapon', PTTP_BODY: 'Body', PTTP_HEAD: 'Head', PTTP_LEGS: 'Legs' };

const outMap = {};
roots.forEach(p => {
  outMap[p.id] = {
    name: (cat[p.id] && cat[p.id].name) || p.id,
    type: tname[p.type] || p.type,
    acquired: p.is_drop === 1 ? 'tower' : (p.is_drop === 2 ? 'uncap' : 'collab'),
  };
});

fs.writeFileSync(path.join(DIR, 'data', 'base-blueprints.json'), JSON.stringify(outMap, null, 1));
const js = 'window.BASE_BLUEPRINTS=' + JSON.stringify(outMap) + ';\n';
fs.writeFileSync(path.join(DIR, 'base-blueprints.js'), js);

console.log('base blueprints (family roots):', Object.keys(outMap).length);

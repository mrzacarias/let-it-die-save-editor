const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const DIR = path.join(__dirname, '..');
const DB = process.env.MASTERS_DB || '/Users/mrzacarias/LET IT DIE-extracted/LET IT DIE/BrgGame/Content/masters.db';

const q = 'SELECT type, grade, limit_break, param_lv_max, bag_capacity, skill_slots, rage_capacity FROM master_body_detail;';
const out = cp.execFileSync('sqlite3', [DB, q], { encoding: 'utf8' });

const rows = out.trim().split('\n').filter(Boolean).map(l => {
  const [type, grade, lb, param, bag, skill, rage] = l.split('|');
  return {
    type, grade: +grade, lb: +lb,
    stat: +param || 0,
    bag: +bag || 0,
    skill: skill ? skill.split(',').filter(Boolean).length : 0,
    rage: +rage || 0,
  };
});

// baseline (limit_break 0) per (type, grade) to derive "extra" caps
const base = {};
rows.forEach(r => {
  if (r.lb === 0) base[r.type + '|' + r.grade] = r;
});

const outMap = {};
rows.forEach(r => {
  const b = base[r.type + '|' + r.grade] || r;
  outMap[r.type + '|' + r.grade + '|' + r.lb] = {
    stat: r.stat,
    bag: r.bag,
    skill: r.skill,
    rage: r.rage,
    skillExtra: Math.max(0, r.skill - b.skill),
    bagExtra: Math.max(0, r.bag - b.bag),
    rageExtra: Math.max(0, r.rage - b.rage),
  };
});

fs.writeFileSync(path.join(DIR, 'data', 'class-limits.json'), JSON.stringify(outMap, null, 1));
const js = 'window.CLASS_LIMITS=' + JSON.stringify(outMap) + ';\n';
fs.writeFileSync(path.join(DIR, 'class-limits.js'), js);

console.log('class limits entries:', Object.keys(outMap).length);

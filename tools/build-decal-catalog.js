const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const DIR = path.join(__dirname, '..');
const DB = process.env.MASTERS_DB || '/Users/mrzacarias/LET IT DIE-extracted/LET IT DIE/BrgGame/Content/masters.db';

// master_skill: id, name key, rarity, premium (authoritative full decal list)
const q = 'SELECT id, name, rarity, premium FROM master_skill ORDER BY no;';
const out = cp.execFileSync('sqlite3', [DB, q], { encoding: 'utf8' });

// display names from the wiki locdat SKILL_NAME section
const wikiLocRaw = require(process.env.WIKI_LOCDAT || '/tmp/lid-wiki-locdat.json');
let w = wikiLocRaw.parse.wikitext['*'].replace(/<[^>]*>/g, '');
const j = JSON.parse(w);
const sn = j.loc.scts.find(x => x.id === 'SKILL_NAME');
const nameMap = {};
if (sn) sn.txts.forEach(t => (nameMap[t.id] = t.txt));

const cat = {};
const known = {
  SKL_E_BURST_P: 'Magic Fencer',
  SKL_SEASONING_M_P: 'Sci. Seasoning M',
  SKL_QOH_P: 'Queen of Hearts',
  SKL_TOHEAVEN_P: 'To Heaven',
};
out.trim().split('\n').filter(Boolean).forEach(l => {
  const [id, nameKey, rarity, premium] = l.split('|');
  const txtId = nameKey.split('.').pop();
  let name = nameMap[txtId];
  if (!name) name = nameMap[txtId.replace(/_P$/, '')];
  if (!name) name = known[id];
  cat[id] = {
    name: name || id,
    stars: +rarity,
    premium: +premium === 1,
  };
});

fs.writeFileSync(path.join(DIR, 'data', 'decals-catalog.json'), JSON.stringify(cat));
fs.writeFileSync(path.join(DIR, 'decals-catalog.js'), 'window.DECAL_CATALOG=' + JSON.stringify(cat) + ';\n');
fs.writeFileSync(path.join(DIR, 'all-decals.js'), 'window.ALL_DECALS=' + JSON.stringify(Object.keys(cat)) + ';\n');

console.log('decal catalog entries:', Object.keys(cat).length);

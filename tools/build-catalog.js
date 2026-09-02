const fs = require('fs');
const z = require('zlib');
const path = require('path');

const DIR = path.join(__dirname, '..');
const SAVE = process.argv[2];

// Game data dumps (not included in this repo). Sources:
//   apiparams.json  -> community datamine / LID_Offline "Data/Params/apiparams.json"
//   locdat.json     -> community datamine / LID_Offline "Data/Locdat/locdat.json"
//   wiki locdat     -> letitdie.wiki.gg "Data:Locdat.json" (via MediaWiki API)
const p = require(process.env.APIPARAMS || '/tmp/lid-apiparams.json');
const oldLoc = require(process.env.LOCDAT || '/tmp/lid-locdat.json');
const wikiLocRaw = require(process.env.WIKI_LOCDAT || '/tmp/lid-wiki-locdat.json');
let w = wikiLocRaw.parse.wikitext['*'].replace(/<[^>]*>/g, '');
const newLoc = JSON.parse(w);

function nameMap(loc) {
  const m = {};
  const sn = loc.loc.scts.find(x => x.id === 'SKILL_NAME');
  if (sn) sn.txts.forEach(t => (m[t.id] = t.txt));
  return m;
}
const nmNew = nameMap(newLoc);
const nmOld = nameMap(oldLoc);

const cat = {};
p.skls.forEach(s => {
  const txtId = s.name.replace('SKILL_NAME.', '');
  cat[s.id] = {
    name: nmNew[txtId] || nmOld[txtId] || txtId,
    stars: s.rarity,
    premium: s.premium ? true : false,
  };
});

// explicit newer premium 5* decals (derived id + wiki-verified name)
const newer = {
  SKL_CRIUP_ATKUP_01_P: ['Below the Belt', 5, true],
  SKL_EXPLODE_DRAIN_P: ['Vampire Queen', 5, true],
  SKL_NTHEAL_ATDFUPHPMAX_P: ['Final Hero', 5, true],
  SKL_RESUP_DECDOWN_P: ['Rich Family', 5, true],
  SKL_STUP_FEAT_HPCUREUP_P: ['Ultimate Food Fighter', 5, true],
  SKL_ATKUP_CRIUP_DEFDWN_P: ['Special Unit Captain', 5, true],
  SKL_ATK_CRIATK_MONEYUP_P: ['Dog Day Afternoon', 5, true],
  SKL_MIL_UP_02_P: ['Hellish Drill Sergeant', 5, true],
  SKL_SYLVIA_NMH_02_P: ['Queen of Spades', 5, true],
  SKL_E_BURST_P: ['Magic Fencer', 5, true],
  SKL_SEASONING_M_P: ['Sci. Seasoning M', 5, true],
};
for (const [id, [name, stars, premium]] of Object.entries(newer)) {
  if (!cat[id]) cat[id] = { name, stars, premium };
}

// name lookup for any id: strip SKL_ and _P, look up TXT_SKL_<base>
function lookup(id) {
  const base = id.replace(/^SKL_/, '').replace(/_P$/, '');
  const txtId = 'TXT_SKL_' + base;
  return nmNew[txtId] || nmOld[txtId] || null;
}

// ensure every decal present in the save has a name (optional)
let patched = 0;
let unnamed = [];
if (SAVE) {
  const raw = fs.readFileSync(SAVE);
  let off = 16, ch = [];
  while (off < raw.length - 4) {
    const u = raw.readUInt32LE(off), c = raw.readUInt32LE(off + 4);
    off += 8; ch.push(z.inflateSync(raw.subarray(off, off + c))); off += c;
  }
  const j = JSON.parse(Buffer.concat(ch).toString('utf8'));
  const saveIds = j.soul.skl.psskl.map(r => r.sklid);

  saveIds.forEach(id => {
    if (!cat[id]) {
      const name = lookup(id);
      cat[id] = { name: name || id, stars: null, premium: id.endsWith('_P') };
      patched++;
    }
  });
  unnamed = saveIds.filter(id => !cat[id] || !cat[id].name || cat[id].name === id);
}

fs.writeFileSync(DIR + '/data/decals-catalog.json', JSON.stringify(cat));
console.log('catalog entries:', Object.keys(cat).length);
console.log('patched save decals:', patched);
console.log('still unnamed in save:', unnamed.length, unnamed);

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..');

// Game data dumps (not included in this repo). Sources:
//   apiparams.json  -> community datamine / LID_Offline "Data/Params/apiparams.json"
//   wiki locdat     -> letitdie.wiki.gg "Data:Locdat.json" (via MediaWiki API)
const p = require(process.env.APIPARAMS || '/tmp/lid-apiparams.json');
const wikiLocRaw = require(process.env.WIKI_LOCDAT || '/tmp/lid-wiki-locdat.json');
let w = wikiLocRaw.parse.wikitext['*'].replace(/<[^>]*>/g, '');
const j = JSON.parse(w);

// name map: TXT_PT_* -> display name
const nameMap = {};
['PT_ARM', 'PT_HEAD', 'PT_BODY', 'PT_LEG', 'PT_ARM_INT', 'PT_HEAD_INT', 'PT_BODY_INT', 'PT_LEG_INT']
  .forEach(sec => {
    const s = j.loc.scts.find(x => x.id === sec);
    if (s) s.txts.forEach(t => (nameMap[t.id] = t.txt));
  });

const cat = {};
p.pts.forEach(pt => {
  // name field like "PT_ARM.TXT_PT_ARM_WP000_001"
  const key = (pt.name || '').split('.').pop();
  cat[pt.id] = {
    name: nameMap[key] || null,
    type: pt.type || null,
  };
});

// fill any missing names directly from nameMap (key = TXT_ + ptid)
Object.keys(nameMap).forEach(key => {
  const id = key.replace(/^TXT_/, '');
  if (!cat[id]) cat[id] = { name: nameMap[key], type: null };
});

fs.writeFileSync(path.join(DIR, 'data', 'equipment-catalog.json'), JSON.stringify(cat));
const js = 'window.PT_CATALOG=' + JSON.stringify(cat) + ';\n';
fs.writeFileSync(path.join(DIR, 'equipment-catalog.js'), js);

console.log('equipment catalog entries:', Object.keys(cat).length);

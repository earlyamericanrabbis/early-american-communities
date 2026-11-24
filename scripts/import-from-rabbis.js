#!/usr/bin/env node
/*
  Creates a community page for every city named in the "Communities served"
  lists on Early American Rabbis, and puts it on the map.

    node scripts/import-from-rabbis.js            (reads the live rabbis.json)
    node scripts/import-from-rabbis.js file.json  (reads a saved copy)

  - New cities get a new file in _communities/ with their map position.
  - Existing community files are never rewritten, except to add a new spelling
    to "rabbi_places" so that rabbis written differently still match.
  - Places it cannot work out (shul names, organizations, unclear cities)
    are listed in scripts/import-report.md for checking by hand.
*/
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const cities = require('all-the-cities').filter(c => c.country === 'US');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, '_communities');
const RABBIS_URL = 'https://earlyamericanrabbis.github.io/early-american-seforim/rabbis.json';

const STATES = 'AL AK AZ AR CA CO CT DC DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
const STATE_NAMES = { alabama:'AL',alaska:'AK',arizona:'AZ',arkansas:'AR',california:'CA',colorado:'CO',connecticut:'CT',delaware:'DE',florida:'FL',georgia:'GA',hawaii:'HI',idaho:'ID',illinois:'IL',indiana:'IN',iowa:'IA',kansas:'KS',kentucky:'KY',louisiana:'LA',maine:'ME',maryland:'MD',massachusetts:'MA',michigan:'MI',minnesota:'MN',mississippi:'MS',missouri:'MO',montana:'MT',nebraska:'NE',nevada:'NV','new hampshire':'NH','new jersey':'NJ','new mexico':'NM','new york':'NY','north carolina':'NC','north dakota':'ND',ohio:'OH',oklahoma:'OK',oregon:'OR',pennsylvania:'PA','rhode island':'RI','south carolina':'SC','south dakota':'SD',tennessee:'TN',texas:'TX',utah:'UT',vermont:'VT',virginia:'VA',washington:'WA','west virginia':'WV',wisconsin:'WI',wyoming:'WY' };

// Spellings and neighborhoods that should count as a particular city.
const ALIASES = {
  'nyc': 'New York, NY', 'ny': 'New York, NY', 'new york': 'New York, NY', 'new york city': 'New York, NY',
  'nyc community': 'New York, NY', 'new york city community': 'New York, NY', 'new york city rav': 'New York, NY',
  'manhattan': 'Manhattan, NY', 'lower east side': 'Manhattan, NY', 'harlem': 'Manhattan, NY', 'east harlem': 'Manhattan, NY', 'washington heights': 'Manhattan, NY',
  'brooklyn': 'Brooklyn, NY', 'bklyn': 'Brooklyn, NY', 'williamsburg': 'Brooklyn, NY', 'bensonhurst': 'Brooklyn, NY',
  'boro park': 'Brooklyn, NY', 'borough park': 'Brooklyn, NY', 'crown heights': 'Brooklyn, NY', 'brownsville': 'Brooklyn, NY',
  'east ny': 'Brooklyn, NY', 'east new york': 'Brooklyn, NY', 'flatbush': 'Brooklyn, NY', 'coney island': 'Brooklyn, NY',
  'bronx': 'Bronx, NY', 'the bronx': 'Bronx, NY', 'queens': 'Queens, NY', 'staten island': 'Staten Island, NY',
  'washington dc': 'Washington, DC', 'washington d c': 'Washington, DC', 'washington, dc': 'Washington, DC',
  'dorchester': 'Boston, MA', 'roxbury': 'Boston, MA', 'san fransisco': 'San Francisco, CA'
};
// Neighborhoods written with their state ("Dorchester, MA") resolve through ALIASES only within that state.
// Map positions for places the city list knows by another name or lacks.
const FIXED = {
  'New York, NY': { name: 'New York City' }, 'Bronx, NY': { name: 'The Bronx' },
  'Washington, DC': { lat: 38.9072, lon: -77.0369 }
};
const PREFIX = /^(served\s+(as\s+(a|an)?\s*\w*\s+)?in|served as \w+ in|the cities? of|rav in|rabbi in|in)\s+/i;

const norm = s => String(s || '').toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim();
const slug = s => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');
const fixSaint = s => s.replace(/^St\.? /i, 'Saint ').replace(/^Mt\.? /i, 'Mount ').replace(/^Ft\.? /i, 'Fort ');
function lev(a, b) { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1)); return d[a.length][b.length]; }

// Find a city in a state. Exact name first, then a close spelling ("Cincinatti" -> Cincinnati).
function findCity(name, st) {
  const want = [name, fixSaint(name)].map(x => x.toLowerCase());
  const inState = cities.filter(c => c.adminCode === st);
  const exact = inState.filter(c => want.includes(c.name.toLowerCase()) || want.includes(String(c.altName).toLowerCase()));
  if (exact.length) return { hit: exact.sort((a, b) => b.population - a.population)[0], fuzzy: false };
  if (name.length < 5) return null;
  const near = inState.filter(c => c.population >= 5000).map(c => ({ c, d: lev(want[0], c.name.toLowerCase()) })).filter(x => x.d <= 2).sort((a, b) => a.d - b.d || b.c.population - a.c.population);
  if (near.length && (near.length === 1 || near[0].d < near[1].d || near[0].c.population > near[1].c.population * 5)) return { hit: near[0].c, fuzzy: true };
  return null;
}
// A city named without a state: accept only a clear, large match (e.g. "Philadelphia").
function findBareCity(name) {
  const hits = cities.filter(c => c.name.toLowerCase() === name.toLowerCase()).sort((a, b) => b.population - a.population);
  if (!hits.length || hits[0].population < 150000) return null;
  if (hits[1] && hits[1].population * 3 > hits[0].population) return null;
  return hits[0];
}
function stateOf(x) { x = x.trim(); if (/^[A-Za-z]{2}$/.test(x) && STATES.includes(x.toUpperCase())) return x.toUpperCase(); return STATE_NAMES[x.toLowerCase()] || null; }

// Turn one written place into "City, ST" (or null if it can't be placed with confidence).
function canonical(raw) {
  let s = String(raw).trim().replace(/\s+/g, ' ').replace(/\s+-\s*(?=,|$)/g, '').replace(PREFIX, '').replace(/^the\s+(?=[a-z ]+$)/i, '');
  if (!s) return null;
  if (ALIASES[norm(s)]) return ALIASES[norm(s)];
  let m = s.match(/^(.+?)(?:,\s*|\s+)([A-Za-z]{2}|[A-Za-z]+ [A-Za-z]+|[A-Za-z]+)$/);
  const st = m && stateOf(m[2]);
  if (m && st && !/[()&;]/.test(m[1])) {
    const parts = m[1].split(',').map(x => x.trim()).filter(Boolean);
    let city = parts[parts.length - 1];
    if (parts.length > 1 && !(ALIASES[norm(city)] || '').endsWith(', ' + st)) return null; // several places in one line
    const al = ALIASES[norm(city)];
    if (al && al.endsWith(', ' + st)) return al;
    const key = `${city}, ${st}`;
    if (FIXED[key]) return key;
    if (!/^[A-Za-z][A-Za-z .'-]*$/.test(city) || city.split(' ').length > 4) return null;
    const f = findCity(city, st);
    if (!f) return null;
    return f.fuzzy ? `${f.hit.name}, ${st}` : `${city.replace(/^\w/, c => c.toUpperCase())}, ${st}`;
  }
  m = s.match(/\(([^()]+)\)\s*$/); // "Anshei Tiktin (Chicago)"
  if (m && !/^(pulpit|member|rosh yeshiva|dean|rav|or )/i.test(m[1])) { const inner = canonical(m[1]); if (inner) return inner; }
  if (/^[A-Za-z .'-]+$/.test(s) && s.split(' ').length <= 3) {
    const c = findBareCity(s);
    if (c) return `${c.name}, ${c.adminCode}`;
  }
  return null;
}
function position(key) {
  const fx = FIXED[key];
  if (fx && fx.lat) return { lat: fx.lat, lon: fx.lon };
  const [city, st] = key.split(/,\s*(?=[A-Z]{2}$)/);
  const f = findCity(fx && fx.name || city, st);
  return f ? { lat: +f.hit.loc.coordinates[1].toFixed(4), lon: +f.hit.loc.coordinates[0].toFixed(4) } : null;
}

async function main() {
  const src = process.argv[2];
  const rabbis = src ? JSON.parse(fs.readFileSync(src, 'utf8')) : await (await fetch(RABBIS_URL)).json();

  // 1. Every written place, with the rabbis who list it.
  const groups = new Map(), leftovers = new Map();
  for (const r of rabbis) {
    for (const raw of String(r.places || '').split(';').map(x => x.trim()).filter(Boolean)) {
      const key = canonical(raw);
      if (!key) { leftovers.set(raw, (leftovers.get(raw) || []).concat(r.name)); continue; }
      if (!groups.has(key)) groups.set(key, { spellings: new Set(), rabbis: new Set() });
      const g = groups.get(key); g.spellings.add(raw); g.rabbis.add(r.name);
    }
  }

  // 1b. A city written without its state ("South Bend") joins a community of that name,
  //     when there is exactly one.
  const known = new Map();
  const addKnown = key => { const c = norm(key.split(/,\s*(?=[A-Z]{2}$)/)[0]); known.set(c, (known.get(c) || new Set()).add(key)); };
  [...groups.keys()].forEach(addKnown);
  for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.md'))) {
    const m = fs.readFileSync(path.join(DIR, f), 'utf8').match(/^---\n([\s\S]*?)\n---/);
    const fm = m && yaml.load(m[1]); if (fm && fm.name && fm.state) addKnown(`${fm.name}, ${fm.state}`);
  }
  for (const [raw, rs] of [...leftovers]) {
    const c = norm(raw.replace(/^the\s+/i, ''));
    const keys = known.get(c);
    if (/^[a-z .'-]+$/.test(c) && keys && keys.size === 1) {
      const key = [...keys][0];
      if (!groups.has(key)) groups.set(key, { spellings: new Set(), rabbis: new Set() });
      const g = groups.get(key); g.spellings.add(raw); rs.forEach(r => g.rabbis.add(r));
      leftovers.delete(raw);
    }
  }

  // 2. Existing community files, by "City, ST".
  const existing = new Map();
  for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.md'))) {
    const text = fs.readFileSync(path.join(DIR, f), 'utf8');
    const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m) continue;
    const fm = yaml.load(m[1]) || {};
    existing.set(norm(`${fm.name}, ${fm.state}`), { file: f, fm, body: m[2] });
  }

  const created = [], updated = [], noPin = [];
  for (const [key, g] of [...groups].sort()) {
    const [city, st] = key.split(/,\s*(?=[A-Z]{2}$)/);
    const extra = [...g.spellings].filter(s => norm(s) !== norm(key));
    const have = existing.get(norm(key));
    if (have) {
      const cur = (have.fm.rabbi_places || []).map(String);
      const add = extra.filter(s => !cur.map(norm).includes(norm(s)));
      if (add.length) {
        have.fm.rabbi_places = cur.concat(add);
        fs.writeFileSync(path.join(DIR, have.file), '---\n' + yaml.dump(have.fm, { lineWidth: -1 }) + '---\n' + have.body);
        updated.push(`${key} (added spellings: ${add.join('; ')})`);
      }
      continue;
    }
    const hit = position(key);
    if (!hit) noPin.push(key);
    const fm = {
      name: city, state: st, hebrew_name: null,
      lat: hit ? hit.lat : null,
      lon: hit ? hit.lon : null,
      era: null, cover: null, cover_caption: null, published: true,
      rabbanim: [], shuls: [], mikvaos: [], chinuch: [], news: [],
      rabbi_places: extra, sources: []
    };
    let file = slug(`${city}-${st}`) + '.md', n = 2;
    while (fs.existsSync(path.join(DIR, file))) file = slug(`${city}-${st}`) + `-${n++}.md`;
    fs.writeFileSync(path.join(DIR, file), '---\n' + yaml.dump(fm, { lineWidth: -1 }) + '---\n');
    existing.set(norm(key), { file, fm, body: '' });
    created.push(`${key} — ${g.rabbis.size} rabbi${g.rabbis.size === 1 ? '' : 's'}${hit ? '' : ' (NO MAP POSITION)'}`);
  }

  // 3. Report.
  const lines = ['# Import from Early American Rabbis', '', `Run: ${new Date().toISOString().slice(0, 10)} · ${rabbis.length} rabbis read`, ''];
  lines.push(`## New communities (${created.length})`, '', ...(created.length ? created.map(x => '- ' + x) : ['None this time.']), '');
  if (updated.length) lines.push(`## Existing communities given new spellings (${updated.length})`, '', ...updated.map(x => '- ' + x), '');
  if (noPin.length) lines.push(`## Need a map position (${noPin.length})`, '', 'Open these in the editor and fill in Latitude and Longitude:', '', ...noPin.map(x => '- ' + x), '');
  lines.push(`## Places that could not be matched to a city (${leftovers.size})`, '',
    'These are written on Early American Rabbis in a way the import cannot place: a shul or organization name, a city with no state, or several cities in one line. To fix one, change it on the rabbi\'s page there to "City, ST" (one city per line), or add it under "Other spellings for matching rabbis" on the right community here.', '',
    '| As written | Rabbi(s) |', '|---|---|',
    ...[...leftovers].sort((a, b) => a[0].localeCompare(b[0])).map(([p, rs]) => `| ${p.replace(/\|/g, '/')} | ${[...new Set(rs)].join(', ').replace(/\|/g, '/')} |`), '');
  fs.writeFileSync(path.join(__dirname, 'import-report.md'), lines.join('\n'));
  console.log(`created ${created.length}, updated ${updated.length}, need position ${noPin.length}, unmatched ${leftovers.size}`);
}
main().catch(e => { console.error(e); process.exit(1); });

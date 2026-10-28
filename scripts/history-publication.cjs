// Build-time projection only. No network, scheduler or deployment authority.
const fs = require('node:fs');
const path = require('node:path');
const {projectArchive} = require('./export-historian-archive.cjs');
const target = path.join(__dirname, '../src/lib/historianArchive.json');
const root = process.env.DELTA_HISTORY_AGENT_ROOT;
if (root) {
  if (!path.isAbsolute(root)) throw Error('absolute_history_agent_root_required');
  fs.writeFileSync(target, JSON.stringify(projectArchive(root), null, 2) + '\n');
}
const archive = JSON.parse(fs.readFileSync(target, 'utf8'));
if (archive.version !== 1 || archive.growthArchive?.version !== 1 || !archive.growthArchive.comparisons.length) throw Error('missing_growth_publication');
console.log(`History publication: ${archive.growthArchive.checkpoints.length} checkpoints; ${archive.sourceCommit}`);

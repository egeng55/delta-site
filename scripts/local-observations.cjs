/* eslint-disable @typescript-eslint/no-require-imports */
// Fixed, read-only collector used only by the explicitly configured local HQ server.
const path = require('node:path');
const [kind, workspace] = process.argv.slice(2);
if (!path.isAbsolute(workspace || '')) throw Error('absolute_workspace_required');
if (kind === 'engineering') process.stdout.write(JSON.stringify(require('./engineering-export.cjs').projectEngineering(workspace)));
else if (kind === 'source') process.stdout.write(JSON.stringify(require('./observatory-export.cjs').project({workspace})));
else throw Error('unknown_observation');

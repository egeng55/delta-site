import 'server-only';
import { createRequire } from 'node:module';
import path from 'node:path';
import type { ObservatoryReport } from './observatory';
// Development-only, fixed workspace projection. No caller-selected paths or shell commands.
export function localArchitecturePreview(): ObservatoryReport | null {
  if (process.env.NODE_ENV !== 'development') return null;
  try {
    const require = createRequire(path.join(process.cwd(), 'package.json'));
    const { project } = require('./scripts/observatory-export.cjs');
    return project({ workspace: path.resolve(process.cwd(), '..') });
  } catch { return null; }
}

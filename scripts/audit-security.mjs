// Compatibility entry point: the former vulnerability demonstration is now a regression suite.
import { spawnSync } from 'node:child_process';
const result = spawnSync(process.execPath,['node_modules/tsx/dist/cli.mjs','--test','tests/security.test.ts'],{stdio:'inherit'});
process.exit(result.status ?? 1);

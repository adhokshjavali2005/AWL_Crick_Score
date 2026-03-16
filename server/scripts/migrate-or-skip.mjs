import { spawn } from 'node:child_process';

function runMigration() {
  return new Promise((resolve) => {
    const child = spawn('npx', ['prisma', 'migrate', 'deploy'], {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });

    child.on('close', (code) => resolve(code ?? 1));
    child.on('error', () => resolve(1));
  });
}

async function main() {
  const skipAutoMigrate = String(process.env.SKIP_AUTO_MIGRATE || '').toLowerCase() === 'true';
  const requireMigrate = String(process.env.REQUIRE_MIGRATION_ON_START || '').toLowerCase() === 'true';

  if (skipAutoMigrate) {
    console.log('[CricLive] Skipping automatic migration (SKIP_AUTO_MIGRATE=true).');
    process.exit(0);
  }

  console.log('[CricLive] Running startup migration: prisma migrate deploy');
  const code = await runMigration();

  if (code === 0) {
    console.log('[CricLive] Startup migration completed successfully.');
    process.exit(0);
  }

  if (requireMigrate) {
    console.error('[CricLive] Startup migration failed and REQUIRE_MIGRATION_ON_START=true. Aborting startup.');
    process.exit(code);
  }

  console.warn('[CricLive] Startup migration failed. Continuing app startup (set REQUIRE_MIGRATION_ON_START=true to enforce).');
  process.exit(0);
}

main();

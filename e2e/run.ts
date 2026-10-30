// e2e/run.ts
// `npm run test:e2e`: the browser tests, start to finish.
//   1. Builds a throwaway SQLite database in the system temp folder from the
//      fixture (e2e/fixture.ts), with the test passwords in it only.
//   2. Builds the app into .next-e2e (so a dev server using .next is left
//      alone) and starts it on port 3210 against that database.
//   3. Runs the Playwright tests (e2e/*.spec.ts) at 360px and 430px.
//   4. Stops the app and deletes the database, also when a step fails.
//
// It never touches the local, dev or production databases: the app gets only
// the throwaway file, and the Turso variables are removed from its
// environment. Not part of the Vercel build.
//
//   npm run test:e2e                     everything
//   npm run test:e2e -- --no-build       reuse the last .next-e2e build
//   npm run test:e2e -- nav              only tests whose file or title matches "nav"

import { spawn, spawnSync, type ChildProcess } from "child_process";
import { randomBytes } from "crypto";
import { mkdtempSync, realpathSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";

import { buildFixture } from "./fixture";

const PORT = 3210;
const DIST_DIR = ".next-e2e";

const args = process.argv.slice(2);
const skipBuild = args.includes("--no-build");
const playwrightArgs = args.filter((a) => a !== "--no-build");

const tempRoot = realpathSync(tmpdir());
const dir = mkdtempSync(path.join(tempRoot, "rose-e2e-"));
const dbFile = path.join(dir, "e2e.db");
const url = `file:${dbFile}`;
let server: ChildProcess | null = null;

/** The environment the app and Playwright get: the throwaway database only. */
function appEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: url, NEXT_DIST_DIR: DIST_DIR, E2E_BASE_URL: `http://localhost:${PORT}` };
  delete env.TURSO_DATABASE_URL;
  delete env.TURSO_AUTH_TOKEN;
  // A fresh checkout has no .env: any secret will do for a throwaway session.
  env.SESSION_SECRET ??= randomBytes(32).toString("hex");
  return env;
}

function cleanUp() {
  if (server?.exitCode === null) server.kill("SIGTERM");
  rmSync(dir, { recursive: true, force: true });
}

function run(command: string, commandArgs: string[]) {
  const result = spawnSync(command, commandArgs, { stdio: "inherit", env: appEnv() });
  return result.status ?? 1;
}

async function waitForServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server?.exitCode !== null) throw new Error("The app stopped while starting; see its output above.");
    try {
      const res = await fetch(`http://localhost:${PORT}/login`);
      if (res.ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`The app did not answer on port ${PORT} within a minute.`);
}

async function main() {
  // The database must be the throwaway file in the temp folder, never anything else.
  if (!dbFile.startsWith(tempRoot + path.sep)) throw new Error(`Refusing to run: ${dbFile} is not in the temp folder.`);

  console.log(`Building the test database in ${dir}`);
  await buildFixture(url);

  if (!skipBuild) {
    console.log(`Building the app into ${DIST_DIR}`);
    if (run("npx", ["next", "build"]) !== 0) throw new Error("next build failed");
  }

  console.log(`Starting the app on port ${PORT}`);
  server = spawn("npx", ["next", "start", "-p", String(PORT)], { env: appEnv(), stdio: ["ignore", "inherit", "inherit"] });
  await waitForServer();

  return run("npx", ["playwright", "test", ...playwrightArgs]);
}

process.on("SIGINT", () => {
  cleanUp();
  process.exit(130);
});

main()
  .then((status) => {
    cleanUp();
    process.exit(status);
  })
  .catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    cleanUp();
    process.exit(1);
  });

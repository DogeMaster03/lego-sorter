const { spawn } = require("node:child_process");

const electronPath = require("electron");

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/run-electron.cjs <appPath> [...args]");
  process.exit(1);
}

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, args, {
  stdio: "inherit",
  env,
});

child.on("exit", (code) => process.exit(code ?? 1));


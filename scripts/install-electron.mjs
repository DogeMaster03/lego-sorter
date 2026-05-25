import { execSync, spawnSync } from "node:child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { downloadArtifact } from "@electron/get";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const electronDir = path.join(__dirname, "..", "node_modules", "electron");
const { version } = JSON.parse(
  fs.readFileSync(path.join(electronDir, "package.json"), "utf-8"),
);

function platformPath() {
  switch (process.platform) {
    case "darwin":
      return "Electron.app/Contents/MacOS/Electron";
    case "win32":
      return "electron.exe";
    default:
      return "electron";
  }
}

function resolveArch() {
  if (process.platform === "darwin" && process.arch === "x64") {
    try {
      return execSync("sysctl -in sysctl.proc_translated", {
        encoding: "utf-8",
      }).trim() === "1"
        ? "arm64"
        : "x64";
    } catch {
      return "x64";
    }
  }
  return process.arch;
}

function extractZip(zipPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });

  if (process.platform === "darwin") {
    const result = spawnSync("ditto", ["-x", "-k", zipPath, destDir], {
      stdio: "inherit",
    });
    if (result.status !== 0) {
      throw new Error(`ditto failed with code ${result.status}`);
    }
    return;
  }

  if (process.platform === "win32") {
    const result = spawnSync(
      "powershell",
      [
        "-Command",
        `Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force`,
      ],
      { stdio: "inherit" },
    );
    if (result.status !== 0) {
      throw new Error(`Expand-Archive failed with code ${result.status}`);
    }
    return;
  }

  const result = spawnSync("unzip", ["-q", "-o", zipPath, "-d", destDir], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`unzip failed with code ${result.status}`);
  }
}

async function main() {
  const relPath = platformPath();
  const dist = path.join(electronDir, "dist");
  const pathTxt = path.join(electronDir, "path.txt");
  const exe = path.join(dist, relPath);

  if (fs.existsSync(pathTxt) && fs.existsSync(exe)) {
    console.log("Electron already installed:", exe);
    return;
  }

  const arch = resolveArch();
  console.log(`Downloading Electron ${version} (${process.platform}-${arch})…`);

  const zipPath = await downloadArtifact({
    version,
    artifactName: "electron",
    platform: process.platform,
    arch,
  });

  console.log("Extracting to", dist);
  fs.rmSync(dist, { recursive: true, force: true });
  extractZip(zipPath, dist);
  fs.writeFileSync(pathTxt, relPath);

  if (!fs.existsSync(exe)) {
    console.error("Electron binary missing after extract:", exe);
    console.error("dist contents:", fs.readdirSync(dist));
    process.exit(1);
  }

  console.log("Electron ready:", exe);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

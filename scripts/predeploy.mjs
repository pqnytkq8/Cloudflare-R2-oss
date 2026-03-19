import { spawn } from "node:child_process";
import { mkdir, rm, cp, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function runWithOutput(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {
      stdio: ["inherit", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

    let out = "";
    p.stdout.on("data", (d) => {
      const s = d.toString();
      out += s;
      process.stdout.write(s);
    });
    p.stderr.on("data", (d) => {
      const s = d.toString();
      out += s;
      process.stderr.write(s);
    });

    p.on("close", (code) => {
      if (code === 0) return resolve(out);
      reject(new Error(out || `${cmd} ${args.join(" ")} failed with exit code ${code}`));
    });
  });
}

async function ensureBucket(bucketName) {
  try {
    await runWithOutput("npx", ["wrangler", "r2", "bucket", "create", bucketName]);
  } catch (error) {
    const message = String(error?.message || error);
    if (message.includes("already exists") || message.includes("409")) {
      console.log(`[predeploy] R2 bucket '${bucketName}' already exists, continue...`);
      return;
    }
    throw error;
  }
}

async function ensureKV() {
  try {
    console.log("[predeploy] Setting up KV namespaces...");
    await runWithOutput("node", [path.join(path.dirname(fileURLToPath(import.meta.url)), "setupKV.mjs")]);
  } catch (error) {
    console.error(`[predeploy] KV setup failed: ${error.message}`);
    throw error;
  }
}

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function prepareAssets() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const root = path.resolve(__dirname, "..");
  const outDir = path.join(root, ".cf-assets");

  console.log(`[predeploy] prepare assets: ${outDir}`);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const singleFiles = ["index.html", "404.html", "robots.txt"];
  for (const file of singleFiles) {
    const src = path.join(root, file);
    const dst = path.join(outDir, file);
    if (await exists(src)) {
      await cp(src, dst, { force: true });
    }
  }

  const assetsDir = path.join(root, "assets");
  if (await exists(assetsDir)) {
    await cp(assetsDir, path.join(outDir, "assets"), { recursive: true, force: true });
  }
}

async function main() {
  const bucketName = "r2cloud";
  console.log(`[predeploy] ensure R2 bucket: ${bucketName}`);
  await ensureBucket(bucketName);
  
  console.log(`[predeploy] ensure KV namespaces...`);
  await ensureKV();
  
  console.log(`[predeploy] prepare assets...`);
  await prepareAssets();
  
  console.log(`[predeploy] ✅ All preparations completed!`);
}

main().catch((err) => {
  console.error(`[predeploy] ❌ ${err.message}`);
  process.exit(1);
});

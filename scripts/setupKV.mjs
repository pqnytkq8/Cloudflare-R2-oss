import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(__dirname, "..", ".kv-namespaces.json");

function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {
      stdio: ["inherit", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

    let out = "";
    let err = "";
    
    p.stdout.on("data", (d) => {
      out += d.toString();
      process.stdout.write(d);
    });
    
    p.stderr.on("data", (d) => {
      err += d.toString();
      process.stderr.write(d);
    });

    p.on("close", (code) => {
      if (code === 0) return resolve(out);
      reject(new Error(err || `Command failed with exit code ${code}`));
    });
  });
}

async function createKVNamespace(name, isPreview = false) {
  const env = isPreview ? "--preview" : "";
  const args = ["wrangler", "kv:namespace", "create", name];
  if (env) args.push(env);
  
  try {
    console.log(`\n[KV Setup] Creating ${isPreview ? "preview" : "production"} KV namespace: ${name}`);
    const output = await runCommand("npx", args);
    
    // 解析输出获取命名空间 ID
    // 输出格式: Created namespace with id: 12345678901234567890abcd
    const match = output.match(/id:\s*([a-f0-9]+)/i);
    if (match) {
      return match[1];
    }
    
    // 如果已存在，尝试列出命名空间
    if (output.includes("already exists") || output.includes("409")) {
      console.log(`[KV Setup] Namespace '${name}' already exists, retrieving ID...`);
      const listOutput = await runCommand("npx", ["wrangler", "kv:namespace", "list"]);
      const nsMatch = listOutput.match(new RegExp(`${name}[\\s]*([a-f0-9]{32})`));
      if (nsMatch) {
        return nsMatch[1];
      }
    }
    
    throw new Error(`Failed to create or find namespace ${name}`);
  } catch (error) {
    console.error(`[KV Setup] Error: ${error.message}`);
    throw error;
  }
}

async function setupKV() {
  try {
    console.log("[KV Setup] Starting KV namespace setup...");
    
    // 生产环境 KV
    const prodId = await createKVNamespace("r2cloud-cache", false);
    
    // 预览环境 KV
    const previewId = await createKVNamespace("r2cloud-cache-preview", true);
    
    // 保存 ID 到配置文件
    const config = { prodId, previewId, timestamp: new Date().toISOString() };
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
    
    console.log("\n[KV Setup] ✅ KV namespaces created successfully!");
    console.log(`  Production ID: ${prodId}`);
    console.log(`  Preview ID: ${previewId}`);
    console.log(`  Config saved to: ${CONFIG_FILE}`);
    
    return config;
  } catch (error) {
    console.error(`[KV Setup] ❌ Setup failed: ${error.message}`);
    process.exit(1);
  }
}

// 从配置文件读取已创建的 ID
async function getKVIds() {
  try {
    const content = await fs.readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// 更新 wrangler.toml 中的 KV ID
async function updateWranglerConfig(ids) {
  const wranglerPath = path.join(__dirname, "..", "wrangler.toml");
  let content = await fs.readFile(wranglerPath, "utf-8");
  
  // 查找 KV 配置块并更新
  const kvBlock = `# KV 命名空间绑定（缓存）
# 注：id 和 preview_id 由 predeploy.mjs 自动创建和管理
[[kv_namespaces]]
binding = "CACHE"
id = "${ids.prodId}"
preview_id = "${ids.previewId}"`;
  
  const oldBlock = /# KV 命名空间绑定.*?\[\[kv_namespaces\]\]\s*binding = "CACHE"[^\n]*/s;
  
  if (content.includes('id = "r2cloud-cache"')) {
    content = content.replace(
      /# KV 命名空间绑定.*?\[\[kv_namespaces\]\]\s*binding = "CACHE"\s*(?:id = "[^"]*"\s*)?(?:preview_id = "[^"]*"\s*)?/s,
      kvBlock
    );
  } else {
    // 如果还没有 id/preview_id，添加它们
    content = content.replace(
      /(\[\[kv_namespaces\]\]\s*binding = "CACHE")/,
      `$1\nid = "${ids.prodId}"\npreview_id = "${ids.previewId}"`
    );
  }
  
  await fs.writeFile(wranglerPath, content);
  console.log("[KV Setup] Updated wrangler.toml with KV IDs");
}

// 主函数
async function main() {
  const existing = await getKVIds();
  
  if (existing) {
    console.log("[KV Setup] Found existing KV configuration:");
    console.log(`  Production: ${existing.prodId}`);
    console.log(`  Preview: ${existing.previewId}`);
    console.log("[KV Setup] Using existing namespaces");
    await updateWranglerConfig(existing);
  } else {
    const newIds = await setupKV();
    await updateWranglerConfig(newIds);
  }
}

main();

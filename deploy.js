const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const http = require("node:http");
const https = require("node:https");

const buildIdPath = path.join(__dirname, ".next", "BUILD_ID");

if (!fs.existsSync(buildIdPath)) {
  console.error("❌ .next/BUILD_ID پیدا نشد؛ ابتدا npm run build را با موفقیت اجرا کنید.");
  process.exit(1);
}

const buildId = fs.readFileSync(buildIdPath, "utf8").trim();
if (!buildId) {
  console.error("❌ BUILD_ID خالی است.");
  process.exit(1);
}

console.log(`✅ Build آماده است (${buildId})`);

const pm2App = process.env.PM2_APP_NAME?.trim();
if (!pm2App) {
  console.log("ℹ️ PM2_APP_NAME تنظیم نشده؛ build آماده است و restart انجام نشد.");
  process.exit(0);
}

const result = spawnSync("pm2", ["reload", pm2App, "--update-env"], { stdio: "inherit" });
if (result.error || result.status !== 0) {
  console.error("❌ PM2 reload ناموفق بود.");
  process.exit(result.status || 1);
}

console.log(`✅ PM2 app "${pm2App}" با موفقیت reload شد.`);

const healthUrl = process.env.HEALTHCHECK_URL?.trim();
if (healthUrl) {
  const client = healthUrl.startsWith("https:") ? https : http;
  const timeoutMs = Number(process.env.HEALTHCHECK_TIMEOUT_MS) || 15000;
  const request = client.get(healthUrl, { timeout: timeoutMs }, (response) => {
    let body = "";
    response.setEncoding("utf8");
    response.on("data", (chunk) => { body += chunk; });
    response.on("end", () => {
      if (response.statusCode !== 200) {
        console.error(`❌ health check failed: HTTP ${response.statusCode}`);
        process.exit(1);
      }
      try {
        const parsed = JSON.parse(body);
        if (parsed.ok !== true) throw new Error("health response is not ready");
      } catch {
        console.error("❌ health check returned an invalid or not-ready response.");
        process.exit(1);
      }
      console.log("✅ health check passed.");
    });
  });
  request.on("timeout", () => request.destroy(new Error("health timeout")));
  request.on("error", (error) => {
    console.error(`❌ health check failed: ${error.message}`);
    process.exit(1);
  });
}

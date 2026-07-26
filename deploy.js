const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();
require("dotenv").config({ path: ".env.local" });

const config = {
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  host: process.env.FTP_HOST,
  port: parseInt(process.env.FTP_PORT || "21"),
  localRoot: __dirname + "/out/",
  remoteRoot: "/app.arena2battle.com/",
  include: ["*", "**/*"],
  deleteRemote: false,
  forcePasv: true,
  sftp: false,
};

console.log("اوکی دارم بیلد میگیرم");

ftpDeploy
  .deploy(config)
  .then(() => console.log("✅ فرانت با موفقیت آپلود شد!"))
  .catch((err) => console.log("❌ خطا در آپلود:", err));

ftpDeploy.on("uploading", function (data) {
  console.log(`در حال آپلود: ${data.relPath}`);
});
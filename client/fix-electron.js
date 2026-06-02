
const { downloadArtifact } = require('@electron/get');
const fs = require('fs');
const path = require('path');
const os = require('os');
const extractZip = require('extract-zip');

async function main() {
  console.log('开始下载 Electron...');
  const { version } = require('./node_modules/electron/package.json');

  // 先清理现有内容
  const distDir = path.join(__dirname, 'node_modules/electron/dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  const pathTxt = path.join(__dirname, 'node_modules/electron/path.txt');
  if (fs.existsSync(pathTxt)) {
    fs.unlinkSync(pathTxt);
  }
  const dtsFile = path.join(__dirname, 'node_modules/electron/electron.d.ts');
  if (fs.existsSync(dtsFile)) {
    fs.unlinkSync(dtsFile);
  }

  console.log(`正在下载 Electron ${version}...`);

  try {
    const zipPath = await downloadArtifact({
      version: version,
      artifactName: 'electron',
      mirrorOptions: {
        mirror: 'https://npmmirror.com/mirrors/electron/'
      },
      platform: os.platform(),
      arch: os.arch(),
      force: true
    });

    console.log(`下载完成: ${zipPath}`);
    console.log('正在解压...');

    const distDir = path.join(__dirname, 'node_modules/electron/dist');
    await extractZip(zipPath, { dir: distDir });

    // 创建 path.txt
    let platformPath;
    if (os.platform() === 'win32') {
      platformPath = 'electron.exe';
    } else if (os.platform() === 'darwin') {
      platformPath = 'Electron.app/Contents/MacOS/Electron';
    } else {
      platformPath = 'electron';
    }
    fs.writeFileSync(path.join(__dirname, 'node_modules/electron/path.txt'), platformPath);

    // 创建 version 文件
    fs.writeFileSync(path.join(distDir, 'version'), `v${version}`);

    console.log('✅ Electron 安装成功！');

    // 检查是否完整
    const checkPath = path.join(distDir, platformPath);
    if (fs.existsSync(checkPath)) {
      console.log(`✅ ${platformPath} 已找到`);
    } else {
      console.log(`❌ ${platformPath} 未找到`);
    }
  } catch (e) {
    console.error('❌ 下载失败:');
    console.error(e);
    process.exit(1);
  }
}

main();

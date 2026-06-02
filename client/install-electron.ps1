
# 1. 清理现有内容
$distDir = "d:\Code\airdrop-farm\client\node_modules\electron\dist"
$pathTxt = "d:\Code\airdrop-farm\client\node_modules\electron\path.txt"
$dtsFile = "d:\Code\airdrop-farm\client\node_modules\electron\electron.d.ts"

Write-Host "正在清理现有内容..."
if (Test-Path $distDir) {
    Remove-Item -Recurse -Force $distDir
}
if (Test-Path $pathTxt) {
    Remove-Item -Force $pathTxt
}
if (Test-Path $dtsFile) {
    Remove-Item -Force $dtsFile
}

# 2. 找到缓存的 zip 文件
Write-Host "正在查找 Electron zip..."
$cachePath = "$env:LOCALAPPDATA\electron\Cache"
$zipFile = Get-ChildItem -Path $cachePath -Filter "electron-v39.8.10-win32-x64.zip" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName

if (-not $zipFile) {
    Write-Host "未找到 zip 文件！" -ForegroundColor Red
    exit 1
}

Write-Host "找到 zip 文件: $zipFile" -ForegroundColor Green

# 3. 解压文件
Write-Host "正在解压..."
New-Item -ItemType Directory -Path $distDir | Out-Null

# 使用 PowerShell 的解压功能
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($zipFile, (Resolve-Path $distDir))

# 4. 创建必需的文件
Write-Host "正在创建配置文件..."
"electron.exe" | Out-File -FilePath $pathTxt -Encoding ASCII
"v39.8.10" | Out-File -FilePath (Join-Path $distDir "version") -Encoding ASCII

# 5. 移动 electron.d.ts（如果存在）
$srcDts = Join-Path $distDir "electron.d.ts"
if (Test-Path $srcDts) {
    Move-Item -Path $srcDts -Destination $dtsFile
}

Write-Host "✅ 完成！" -ForegroundColor Green

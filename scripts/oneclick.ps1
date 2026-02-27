$ErrorActionPreference = "Stop"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "node is required (>=18)"
  exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Error "npm is required"
  exit 1
}

npm install
npm run setup:env

Write-Output ""
if ($args.Length -gt 0 -and $args[0] -eq "telegram") {
  Write-Output "Starting Telegram mode..."
  npm run telegram
} else {
  Write-Output "Starting CLI mode..."
  npm start
}

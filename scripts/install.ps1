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
npx playwright install chromium

Write-Output "Install complete. Run: npm start"

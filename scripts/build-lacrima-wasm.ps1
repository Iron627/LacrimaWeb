param(
  [string]$LacrimaRepo = "https://github.com/iron627/lacrima",
  [string]$BuildDir = ".lacrima-build"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$sourceDir = Join-Path $root $BuildDir
$adapterSource = Join-Path $root "tools\lacrima-wasm\main.go"
$adapterTargetDir = Join-Path $sourceDir "cmd\lacrima-wasm"
$adapterTarget = Join-Path $adapterTargetDir "main.go"
$assetDir = Join-Path $root "public\engines\lacrima"

if (!(Test-Path $sourceDir)) {
  git clone $LacrimaRepo $sourceDir
} else {
  git -C $sourceDir pull --ff-only
}

New-Item -ItemType Directory -Force -Path $adapterTargetDir | Out-Null
Copy-Item -LiteralPath $adapterSource -Destination $adapterTarget -Force
New-Item -ItemType Directory -Force -Path $assetDir | Out-Null

$env:GOOS = "js"
$env:GOARCH = "wasm"
go build -C $sourceDir -o (Join-Path $assetDir "lacrima.wasm") .\cmd\lacrima-wasm

$goRoot = go env GOROOT
Copy-Item -LiteralPath (Join-Path $goRoot "lib\wasm\wasm_exec.js") -Destination (Join-Path $assetDir "wasm_exec.js") -Force

Write-Host "Built Lacrima WASM assets in $assetDir"

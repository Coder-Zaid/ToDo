$tempDir = Join-Path $env:TEMP "chrome-ss-profile"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$artifactDir = "C:\Users\asus\.gemini\antigravity\brain\90190b0c-f591-4eab-a1d3-b856a1b80d24"

# 1. Update preview-state-todo.html with same styles & verified DOM
Copy-Item "C:\Users\asus\.gemini\antigravity-ide\scratch\black-todo\scripts\preview-new-features.html" "$artifactDir\preview-inspected.html"

# Capture direct screenshot of preview-new-features.html
$out = "$artifactDir\live_preview_fixed.png"
if (Test-Path $out) { Remove-Item $out }
Start-Process -FilePath $chrome -ArgumentList @(
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--user-data-dir=$tempDir",
    "--window-size=1200,800",
    "--hide-scrollbars",
    "--screenshot=$out",
    "file:///C:/Users/asus/.gemini/antigravity-ide/scratch/black-todo/scripts/preview-new-features.html"
) -Wait

Write-Output "Live preview fixed generated: $(Test-Path $out)"
if (Test-Path $out) {
    Write-Output "Size: $((Get-Item $out).Length) bytes"
}

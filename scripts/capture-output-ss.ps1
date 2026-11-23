$tempDir = Join-Path $env:TEMP "chrome-ss-profile"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$artifactDir = "C:\Users\asus\.gemini\antigravity\brain\90190b0c-f591-4eab-a1d3-b856a1b80d24"
$out = "$artifactDir\outputs_with_screenshot_preview.png"

if (Test-Path $out) { Remove-Item $out }
Start-Process -FilePath $chrome -ArgumentList @(
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--user-data-dir=$tempDir",
    "--window-size=1200,900",
    "--hide-scrollbars",
    "--screenshot=$out",
    "file:///C:/Users/asus/.gemini/antigravity-ide/scratch/black-todo/scripts/preview-outputs-fixed.html"
) -Wait

Get-Item $out | Select-Object Name, Length

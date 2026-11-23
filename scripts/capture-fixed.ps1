$tempDir = Join-Path $env:TEMP "chrome-ss-profile"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$artifactDir = "C:\Users\asus\.gemini\antigravity\brain\90190b0c-f591-4eab-a1d3-b856a1b80d24"

$outOutputs = "$artifactDir\outputs_mode_fixed.png"
$outTodo = "$artifactDir\todo_mode_fixed.png"

if (Test-Path $outOutputs) { Remove-Item $outOutputs }
if (Test-Path $outTodo) { Remove-Item $outTodo }

Start-Process -FilePath $chrome -ArgumentList @(
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--user-data-dir=$tempDir",
    "--window-size=1200,800",
    "--hide-scrollbars",
    "--screenshot=$outOutputs",
    "file:///C:/Users/asus/.gemini/antigravity-ide/scratch/black-todo/scripts/preview-outputs-fixed.html"
) -Wait

Start-Process -FilePath $chrome -ArgumentList @(
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--user-data-dir=$tempDir",
    "--window-size=1200,800",
    "--hide-scrollbars",
    "--screenshot=$outTodo",
    "file:///C:/Users/asus/.gemini/antigravity-ide/scratch/black-todo/scripts/preview-new-features.html"
) -Wait

Get-Item "$artifactDir\*_fixed.png" | Select-Object Name, Length

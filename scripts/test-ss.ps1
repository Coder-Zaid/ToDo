$tempDir = Join-Path $env:TEMP "chrome-ss-profile"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$outPng = "C:\Users\asus\.gemini\antigravity-ide\scratch\black-todo\test.png"
$url = "file:///C:/Users/asus/.gemini/antigravity-ide/scratch/black-todo/scripts/preview-state-todo.html"

Start-Process -FilePath $chrome -ArgumentList @(
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--user-data-dir=$tempDir",
    "--window-size=1200,800",
    "--screenshot=$outPng",
    $url
) -Wait

Write-Output "Result: $(Test-Path $outPng)"
if (Test-Path $outPng) {
    Write-Output "Size: $((Get-Item $outPng).Length) bytes"
}

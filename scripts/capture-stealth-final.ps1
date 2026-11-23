$tempDir = Join-Path $env:TEMP "chrome-ss-profile"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$artifactDir = "C:\Users\asus\.gemini\antigravity\brain\90190b0c-f591-4eab-a1d3-b856a1b80d24"

$targets = @(
    @{
        Html = "file:///C:/Users/asus/.gemini/antigravity-ide/scratch/black-todo/scripts/preview-new-features.html"
        Out = "$artifactDir\stealth_todo_with_inbox_btn.png"
    },
    @{
        Html = "file:///C:/Users/asus/.gemini/antigravity-ide/scratch/black-todo/scripts/preview-snapshot-inbox.html"
        Out = "$artifactDir\inbox_triage_modal.png"
    }
)

foreach ($t in $targets) {
    if (Test-Path $t.Out) { Remove-Item $t.Out }
    Start-Process -FilePath $chrome -ArgumentList @(
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--user-data-dir=$tempDir",
        "--window-size=1200,800",
        "--hide-scrollbars",
        "--screenshot=$($t.Out)",
        $t.Html
    ) -Wait
    Write-Output "Generated $($t.Out): $(Test-Path $t.Out)"
}

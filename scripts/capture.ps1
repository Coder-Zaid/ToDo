$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$artifactDir = "C:\Users\asus\.gemini\antigravity\brain\90190b0c-f591-4eab-a1d3-b856a1b80d24"
$todoHtml = "file:///C:/Users/asus/.gemini/antigravity-ide/scratch/black-todo/scripts/preview-state-todo.html"
$modalHtml = "file:///C:/Users/asus/.gemini/antigravity-ide/scratch/black-todo/scripts/preview-state-modal.html"
$outputsHtml = "file:///C:/Users/asus/.gemini/antigravity-ide/scratch/black-todo/scripts/preview-state-outputs.html"

& $chrome --headless --screenshot="$artifactDir\todo_mode_preview.png" --window-size=1080,720 --hide-scrollbars $todoHtml
& $chrome --headless --screenshot="$artifactDir\jarvis_modal_preview.png" --window-size=1080,720 --hide-scrollbars $modalHtml
& $chrome --headless --screenshot="$artifactDir\outputs_mode_preview.png" --window-size=1080,720 --hide-scrollbars $outputsHtml

Get-Item "$artifactDir\*_preview.png" | Select-Object Name, Length

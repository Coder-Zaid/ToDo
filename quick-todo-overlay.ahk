; ==============================================================================
; BLACK TODO QUICK-ACCESS OVERLAY SCRIPT
; Hotkey: Ctrl + Alt + T
; ==============================================================================

#NoEnv
SetWorkingDir %A_ScriptDir%
CoordMode, Mouse, Screen
SendMode Input

; USER CONFIGURATION
PWA_TITLE := "Black Todo" ; Must match the <title> in Next.js
PWA_LNK := A_Desktop . "\Black Todo.lnk" ; Adjust this path to your PWA shortcut

^!t::
    ; Check if window already exists
    IfWinExist, %PWA_TITLE%
    {
        IfWinActive, %PWA_TITLE%
        {
            ; If active, hide/close it (Toggle behavior)
            WinClose, %PWA_TITLE%
        }
        else
        {
            ; If exists but not active, bring to front and center
            ActivateAndCenter()
        }
    }
    else
    {
        ; If not running, launch the PWA
        Run, "%PWA_LNK%"
        WinWait, %PWA_TITLE%,, 5
        if ErrorLevel
        {
            MsgBox, could not find window "%PWA_TITLE%". Please ensure PWA is installed and the shortcut is on Desktop.
            return
        }
        ActivateAndCenter()
    }
return

ActivateAndCenter() {
    global PWA_TITLE
    WinActivate, %PWA_TITLE%
    
    ; Recommended Size for the UI panel (Smaller and more compact)
    w := 410
    h := 450
    
    ; Center on screen
    x := (A_ScreenWidth / 2) - (w / 2)
    y := (A_ScreenHeight / 2) - (h / 2)
    
    WinMove, %PWA_TITLE%,, x, y, w, h
    
    ; Optional: Keep on top
    WinSet, AlwaysOnTop, On, %PWA_TITLE%
}

; Close with Esc when active
#IfWinActive, Black Todo
Esc::
    WinClose, A
return
#IfWinActive

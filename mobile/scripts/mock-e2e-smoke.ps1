# ponytail: adb UI smoke for MOCK_MODE clinician loop
$ErrorActionPreference = 'Stop'
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$adb = "$sdk\platform-tools\adb.exe"
$outDir = Join-Path $PSScriptRoot '..\e2e-artifacts'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Shot($name) {
  $path = Join-Path $outDir "$name.png"
  & $adb exec-out screencap -p > $path
  Write-Host "SHOT $name -> $path"
}

function DumpText() {
  $xml = Join-Path $outDir 'ui.xml'
  & $adb shell uiautomator dump /sdcard/ui.xml | Out-Null
  & $adb pull /sdcard/ui.xml $xml | Out-Null
  [xml]$doc = Get-Content $xml
  ($doc.SelectNodes('//*[@text!=""]') | ForEach-Object { $_.text }) -join ' | '
}

function TapText($text) {
  $xml = Join-Path $outDir 'ui.xml'
  & $adb shell uiautomator dump /sdcard/ui.xml | Out-Null
  & $adb pull /sdcard/ui.xml $xml | Out-Null
  [xml]$doc = Get-Content $xml
  $node = $doc.SelectSingleNode("//*[contains(@text,'$text')]")
  if (-not $node) { throw "Text not found: $text" }
  $b = $node.bounds
  if ($b -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
    $x = [int](( [int]$Matches[1] + [int]$Matches[3] ) / 2)
    $y = [int](( [int]$Matches[2] + [int]$Matches[4] ) / 2)
    & $adb shell input tap $x $y
    Write-Host "TAP $text @ $x,$y"
  } else { throw "Bad bounds for ${text}: $b" }
}

Write-Host '=== MOCK E2E SMOKE ==='
Start-Sleep -Seconds 8
Shot '01-launch'
$text = DumpText
Write-Host "UI: $text"

# Exact "Continue" only (avoid matching "Sign in to continue")
if ($text -match '(^|\|)\s*Continue\s*(\||$)') {
  try {
    $xml = Join-Path $outDir 'ui.xml'
    & $adb shell uiautomator dump /sdcard/ui.xml | Out-Null
    & $adb pull /sdcard/ui.xml $xml | Out-Null
    [xml]$doc = Get-Content $xml
    $node = $doc.SelectSingleNode("//*[@text='Continue']")
    if ($node -and $node.bounds -match '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') {
      $x = [int](( [int]$Matches[1] + [int]$Matches[3] ) / 2)
      $y = [int](( [int]$Matches[2] + [int]$Matches[4] ) / 2)
      & $adb shell input tap $x $y
      Write-Host "TAP Continue @ $x,$y"
    }
  } catch { Write-Host 'WARN Continue tap failed' }
  Start-Sleep -Seconds 1
  $text = DumpText
  Write-Host "UI after Continue: $text"
}

if ($text -match 'Sign In|Welcome Back|Email') {
  # Focus email, type (escape @ for adb), tab to password, type valid password, blur for RHF onBlur
  try { TapText 'Email' } catch { & $adb shell input tap 540 900 }
  Start-Sleep -Seconds 1
  & $adb shell input text 'mock\@healthtune.io'
  Start-Sleep -Seconds 1
  & $adb shell input keyevent 61
  Start-Sleep -Seconds 1
  & $adb shell input text 'Password123'
  Start-Sleep -Seconds 1
  & $adb shell input keyevent 66
  Start-Sleep -Seconds 1
  Shot '02-signin-filled'
  try { TapText 'Sign In' } catch { & $adb shell input tap 540 1200 }
  Start-Sleep -Seconds 6
  Shot '03-after-signin'
}

$text = DumpText
Write-Host "POST-LOGIN: $text"

$tabs = @('Home','Notes','Sessions','Profile')
foreach ($t in $tabs) {
  try {
    TapText $t
    Start-Sleep -Seconds 2
    Shot ("04-tab-" + $t.ToLower())
  } catch {
    Write-Host "WARN tab $t : $_"
  }
}

# Session center tab often has empty label — tap approximate center FAB area
& $adb shell input tap 540 2200
Start-Sleep -Seconds 2
Shot '05-session-tab'

try {
  TapText 'Ayesha'
  Start-Sleep -Seconds 2
  Shot '06-patient-or-home'
} catch { Write-Host 'WARN no Ayesha tap' }

try {
  # open floating voice / create note if visible
  TapText 'Notes'
  Start-Sleep -Seconds 2
  Shot '07-notes'
} catch {}

Write-Host '=== SMOKE DONE ==='
Get-ChildItem $outDir | Select-Object Name, Length

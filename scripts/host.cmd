@echo off
rem Host Lumenhold Academy on the local network (Windows). Double-click, or: scripts\host.cmd [PORT]
rem Runs scripts\host.ps1 without changing the system's PowerShell execution policy.
set "PORTARG="
if not "%~1"=="" set "PORTARG=-Port %~1"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0host.ps1" %PORTARG%
if errorlevel 1 pause

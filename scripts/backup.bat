@echo off
chcp 65001 >nul
cd /d "%~dp0.."

if not exist "backups" mkdir backups

set BACKUP_FILE=backups\backup-%date:~0,4%%date:~5,2%%date:~8,2%-%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%

echo 备份数据库 → %BACKUP_FILE%
pg_dump -U postgres -h localhost knowledge_platform > "%BACKUP_FILE%" 2>&1

if %errorlevel% equ 0 (
    echo 备份成功 (%BACKUP_FILE%)
    :: 保留最近 30 个备份
    for /f "skip=30" %%a in ('dir /b /o-d backups\*.sql') do del backups\%%a
) else (
    echo 备份失败！
    exit /b 1
)

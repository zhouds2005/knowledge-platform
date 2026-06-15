@echo off
chcp 65001 >nul
echo ============================================
echo  回滚：恢复上一个版本
echo ============================================

cd /d "%~dp0.."

:: 1. Git 回退到上一个 commit
echo [1/3] 回退代码...
git log --oneline -3
echo.
echo 即将回退到上一个版本，当前未提交的改动会暂存
git stash
git reset --hard HEAD~1
echo       已回退

:: 2. 重新构建
echo [2/3] 重新构建...
call npm run build >nul 2>&1
echo       构建完成

:: 3. 重启服务
echo [3/3] 重启服务...
taskkill /f /fi "WINDOWTITLE eq knowledge-*" >nul 2>&1
timeout /t 2 /nobreak >nul

if not exist "logs" mkdir logs
start "knowledge-api" /min cmd /c "npx tsx server/index.ts 2>&1 | powershell -Command "$input | Tee-Object -FilePath logs\\api.log""
start "knowledge-web" /min cmd /c "npx serve dist -l 5173 --no-clipboard 2>&1 | powershell -Command "$input | Tee-Object -FilePath logs\\web.log""

echo.
echo ============================================
echo  回滚完成
echo ============================================
echo  如需恢复到回滚前的版本: git reflog

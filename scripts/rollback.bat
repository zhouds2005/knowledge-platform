@echo off
chcp 65001 >nul
echo ============================================
echo  回滚：恢复上一个版本
echo ============================================

cd /d "%~dp0.."

if not exist "dist.prev" (
    echo 没有可回滚的版本（dist.prev 不存在）
    exit /b 1
)

echo 即将把前端恢复到上一个构建版本
choice /c YN /m "确认回滚"
if errorlevel 2 exit /b 0

:: 交换 dist 和 dist.prev
if exist "dist.old" rmdir /s /q "dist.old"
rename dist dist.old
rename dist.prev dist
rename dist.old dist.prev 2>nul

:: 重启前端
taskkill /f /fi "WINDOWTITLE eq knowledge-web" >nul 2>&1
timeout /t 1 /nobreak >nul
start "knowledge-web" /min cmd /c "npx serve dist -l 5173 --no-clipboard"

echo ============================================
echo  回滚完成
echo ============================================

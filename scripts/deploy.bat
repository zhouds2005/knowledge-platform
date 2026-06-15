@echo off
chcp 65001 >nul
echo ============================================
echo  部署：部门知识共享平台
echo ============================================

cd /d "%~dp0.."

:: 1. 检查环境
echo [1/6] 检查环境...
where node >nul 2>&1 || (echo 错误：未安装 Node.js & exit /b 1)
where npx >nul 2>&1 || (echo 错误：未安装 npx & exit /b 1)

:: 2. 跑测试
echo [2/6] 运行 135 个测试...
call npx vitest run >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：单元测试未通过，取消部署
    exit /b 1
)
call npx playwright test --project=chromium >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：E2E 测试未通过，取消部署
    exit /b 1
)
echo       全部通过

:: 3. 备份数据库
echo [3/6] 备份数据库...
if not exist "backups" mkdir backups
set BACKUP_FILE=backups\backup-%date:~0,4%%date:~5,2%%date:~8,2%-%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%
pg_dump -U postgres -h localhost knowledge_platform > "%BACKUP_FILE%" 2>nul
if %errorlevel% neq 0 (
    echo       警告：数据库备份失败，继续部署
) else (
    echo       已保存到 %BACKUP_FILE%
)

:: 4. 构建前端
echo [4/6] 构建前端...
call npm run build >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：前端构建失败
    exit /b 1
)
echo       构建完成

:: 5. 停止旧服务
echo [5/6] 停止旧服务...
taskkill /f /fi "WINDOWTITLE eq knowledge-*" >nul 2>&1
:: 按端口杀
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002.*LISTENING" 2^>nul') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173.*LISTENING" 2^>nul') do taskkill /f /pid %%a >nul 2>&1
timeout /t 2 /nobreak >nul

:: 6. 启动服务（带日志）
echo [6/6] 启动服务...
if not exist "logs" mkdir logs

:: 启动后端（日志写入文件）
start "knowledge-api" /min cmd /c "npx tsx server/index.ts 2>&1 | powershell -Command "$input | Tee-Object -FilePath logs\\api.log""

:: 启动前端（静态文件服务）
start "knowledge-web" /min cmd /c "npx serve dist -l 5173 --no-clipboard 2>&1 | powershell -Command "$input | Tee-Object -FilePath logs\\web.log""

echo.
echo ============================================
echo  部署完成
echo  前端: http://localhost:5173
echo  后端: http://localhost:3002
echo  日志: logs\\api.log  /  logs\\web.log
echo ============================================

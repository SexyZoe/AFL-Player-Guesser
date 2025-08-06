@echo off
echo 正在查找占用3002端口的进程...
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3002 ^| findstr LISTENING') do (
    echo 找到进程ID: %%i
    echo 正在关闭进程...
    taskkill /PID %%i /F
    echo 端口3002已清理完成！
)
pause
@echo off
setlocal enabledelayedexpansion

REM 设置输入和输出目录
set "INPUT_DIR=.\input_images"
set "OUTPUT_DIR=.\output_webp"

REM 创建输出目录
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

REM 批量转换PNG文件到WebP
echo 开始批量转换PNG文件到WebP格式...
echo.

for %%f in ("%INPUT_DIR%\*.png") do (
    echo 转换: %%~nf.png
    cwebp -q 80 -resize 200 200 "%%f" -o "%OUTPUT_DIR%\%%~nf.webp"
    if !errorlevel! equ 0 (
        echo   成功: %%~nf.webp
    ) else (
        echo   失败: %%~nf.png
    )
    echo.
)

echo 转换完成！
echo 输出目录: %OUTPUT_DIR%
pause 
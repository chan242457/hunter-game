@echo off
chcp 65001 > nul
title 용사 키우기: 마왕 토벌전 (Hero Slayer)
echo ===================================================
echo     용사 키우기: 마왕 토벌전 (HERO SLAYER)
echo ===================================================
echo.
echo  1. 일반 단독 플레이 (웹 브라우저 즉시 실행)
echo  2. 친구/스마트폰 공유 및 실시간 랭킹 연동 서버 실행
echo.
set /p opt="실행할 모드를 선택하세요 (1 또는 2, 기본값: 1): "

if "%opt%"=="2" (
    echo.
    echo 공유 연동 서버를 시작합니다...
    python server.py
) else (
    echo.
    echo 브라우저에서 게임을 실행합니다...
    start "" "index.html"
    echo 실행 완료! 즐거운 토벌 되십시오.
)

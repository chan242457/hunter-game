#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
용사 키우기: 마왕 토벌전 (Hero Slayer)
로컬 네트워크 공유 & 실시간 TOP 5 명예의 전당 연동 서버
"""

import http.server
import socket
import socketserver
import json
import os
import sys
import webbrowser
from urllib.parse import urlparse

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LEADERBOARD_FILE = os.path.join(BASE_DIR, 'leaderboard.json')

DEFAULT_LEADERBOARD = [
    {"rank": 1, "name": "대마법사 아린", "time": 300, "kills": 680, "level": 24, "date": "2026.09.08"},
    {"rank": 2, "name": "성기사 롤랑", "time": 240, "kills": 510, "level": 20, "date": "2026.09.08"},
    {"rank": 3, "name": "그림자 발렌", "time": 180, "kills": 375, "level": 16, "date": "2026.09.08"},
    {"rank": 4, "name": "수호자 가렌", "time": 120, "kills": 230, "level": 12, "date": "2026.09.08"},
    {"rank": 5, "name": "견습 기사", "time": 60, "kills": 85, "level": 7, "date": "2026.09.08"}
]

def load_leaderboard():
    if not os.path.exists(LEADERBOARD_FILE):
        save_leaderboard(DEFAULT_LEADERBOARD)
        return DEFAULT_LEADERBOARD
    try:
        with open(LEADERBOARD_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list) and len(data) > 0:
                return data
    except Exception as e:
        print(f"[Leaderboard Load Error]: {e}")
    return DEFAULT_LEADERBOARD

def save_leaderboard(data):
    try:
        with open(LEADERBOARD_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"[Leaderboard Save Error]: {e}")

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return "127.0.0.1"

class GameHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/leaderboard':
            leaderboard = load_leaderboard()
            response_bytes = json.dumps({"success": True, "leaderboard": leaderboard}, ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self._set_cors_headers()
            self.send_header('Content-Length', str(len(response_bytes)))
            self.end_headers()
            self.wfile.write(response_bytes)
            return

        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/leaderboard':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length).decode('utf-8')
                new_entry = json.loads(body)

                name = str(new_entry.get('name', '빛의 용사')).strip()[:12]
                time_val = int(new_entry.get('time', 0))
                kills = int(new_entry.get('kills', 0))
                level = int(new_entry.get('level', 1))
                date_str = str(new_entry.get('date', ''))

                leaderboard = load_leaderboard()

                if time_val > 0:
                    leaderboard.append({
                        "name": name,
                        "time": time_val,
                        "kills": kills,
                        "level": level,
                        "date": date_str
                    })

                    # Sort: time desc -> kills desc -> level desc
                    leaderboard.sort(key=lambda x: (x.get('time', 0), x.get('kills', 0), x.get('level', 0)), reverse=True)
                    leaderboard = leaderboard[:5]

                    for idx, item in enumerate(leaderboard):
                        item['rank'] = idx + 1

                    save_leaderboard(leaderboard)
                    print(f"⚔️ [기록 갱신 연동] {name} | 생존: {time_val}초 | 처치: {kills} | Lv.{level}")

                response_bytes = json.dumps({"success": True, "leaderboard": leaderboard}, ensure_ascii=False).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self._set_cors_headers()
                self.send_header('Content-Length', str(len(response_bytes)))
                self.end_headers()
                self.wfile.write(response_bytes)
                return
            except Exception as e:
                print(f"[API Error]: {e}")
                self.send_response(400)
                self.end_headers()
                return

        super().do_POST()

    def log_message(self, format, *args):
        # Silence standard static file GET spam
        if args and ('/api/leaderboard' in args[0] or 'POST' in args[0]):
            sys.stderr.write(f"[{self.log_date_time_string()}] {args[0]} - {args[1]}\n")

def run_server():
    local_ip = get_local_ip()
    port = PORT

    # Find available port if 8080 is in use
    server = None
    for p in [8080, 8081, 8082, 8000]:
        try:
            socketserver.TCPServer.allow_reuse_address = True
            server = socketserver.TCPServer(("", p), GameHTTPRequestHandler)
            port = p
            break
        except OSError:
            continue

    if not server:
        print("❌ 포트 바인딩에 실패했습니다.")
        sys.exit(1)

    print("=" * 72)
    print("⚔️  [용사 키우기: 마왕 토벌전] 멀티 연동 & 공유 서버 가동 완료!")
    print("=" * 72)
    print(f" 🖥️  내 컴퓨터(PC) 접속:     http://localhost:{port}")
    print(f" 📱  친구 / 스마트폰 접속 주소: http://{local_ip}:{port}")
    print("=" * 72)
    print(" 💡 [공유 방법]")
    print(f"    같은 Wi-Fi나 공유기에 연결된 스마트폰 또는 다른 PC의 브라우저에서")
    print(f"    👉  http://{local_ip}:{port}  를 입력하시면 누구나 즉시 플레이할 수 있습니다!")
    print(" 🏆 모든 플레이어의 최고 기록이 [명예의 전당 TOP 5]에 실시간으로 통합 연동됩니다.")
    print("=" * 72)
    print(" (서버를 종료하려면 이 창을 닫거나 Ctrl + C 를 누르세요)\n")

    # Automatically open local browser
    try:
        webbrowser.open(f"http://localhost:{port}")
    except Exception:
        pass

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n서버를 안전하게 종료합니다.")
        server.server_close()

if __name__ == '__main__':
    run_server()

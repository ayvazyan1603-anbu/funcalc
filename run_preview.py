import http.server
import socketserver
import socket
import os
import sys

PORT = 8080
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'www')

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def main():
    os.chdir(DIRECTORY)
    local_ip = get_ip()
    print("=" * 60)
    print("  🚀 FunPay Калькулятор Наценки и Вывода запущен!")
    print("=" * 60)
    print(f"  📱 На телефоне (в одной сети Wi-Fi): http://{local_ip}:{PORT}")
    print(f"  💻 На компьютере в браузере:         http://localhost:{PORT}")
    print("=" * 60)
    print("  Нажмите Ctrl+C для остановки сервера.")
    print("=" * 60)

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nСервер остановлен.")

if __name__ == '__main__':
    main()

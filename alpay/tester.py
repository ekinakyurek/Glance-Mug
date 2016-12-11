import socket
import sys

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

server_address = ('localhost', 10000)
print('connecting to %s port %s' % server_address)
sock.connect(server_address)

try:
    message = b'START'
    print('sending "%s"' % message)
    sock.sendall(message)
    data = sock.recv(10000)
    print('received "%s"' % data)

finally:
    print(sys.stderr, 'closing socket')
    sock.shutdown(2)
    sock.close()

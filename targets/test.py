import hashlib
from Crypto.PublicKey import RSA

h = hashlib.md5(b"password")
h2 = hashlib.sha1(b"data")
h3 = hashlib.sha256(b"data")

key = RSA.generate(1024)
key2 = RSA.generate(4096)
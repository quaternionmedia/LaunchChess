from tinydb import TinyDB

db = TinyDB('db.json')
users = db.table('users')
mcguffins = db.table('mcguffins')

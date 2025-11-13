# Test fixture: SQL Injection vulnerabilities in Python

import sqlite3

# VULNERABLE: String formatting
def get_user_by_id_vulnerable(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    return db.execute(query)

# VULNERABLE: String concatenation
def get_user_by_email_vulnerable(email):
    query = "SELECT * FROM users WHERE email = '" + email + "'"
    return db.execute(query)

# VULNERABLE: % formatting
def get_user_vulnerable_percent(username):
    query = "SELECT * FROM users WHERE username = '%s'" % username
    return db.execute(query)

# SAFE: Parameterized query
def get_user_safe(user_id):
    query = "SELECT * FROM users WHERE id = ?"
    return db.execute(query, (user_id,))

// Test fixture: SQL Injection vulnerabilities

// VULNERABLE: String concatenation
export function getUserById(id: string) {
  const query = `SELECT * FROM users WHERE id = ${id}`;
  return db.query(query);
}

// VULNERABLE: Template literal with user input
export function getUserByEmail(email: string) {
  const query = `SELECT * FROM users WHERE email = '${email}'`;
  return db.query(query);
}

// SAFE: Parameterized query
export function safeGetUser(id: string) {
  return db.query('SELECT * FROM users WHERE id = ?', [id]);
}

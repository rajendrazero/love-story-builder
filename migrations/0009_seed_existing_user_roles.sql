INSERT OR IGNORE INTO user_roles (user_id, role)
SELECT id, 'user' FROM user;

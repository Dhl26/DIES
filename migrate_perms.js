const fs = require('fs');
const path = 'c:/Users/Dev Lad/Documents/GitHub/DIES/server/index.js';
let code = fs.readFileSync(path, 'utf8');

// Replace authorize middleware definition
code = code.replace(
  /const authorize = \(\.\.\.roles\) => \(req, res, next\) => \{[\s\S]*?next\(\);\n\};\n/,
  `const checkPerms = (...requiredPerms) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Access Denied' });
    const perms = readJSON(FILES.permissions, DEFAULT_PERMISSIONS);
    const userRolePerms = perms[req.user.role] || [];
    const hasAccess = requiredPerms.some(p => userRolePerms.includes(p));
    if (!hasAccess) {
        return res.status(403).json({ error: 'Forbidden: Requires one of [' + requiredPerms.join(', ') + ']' });
    }
    next();
};\n`
);

// Replacements setup
const replacements = [
  { match: /app\.post\('\/register', authenticate, authorize\('Admin'\)/, replace: "app.post('/register', authenticate, checkPerms('User Management')" },
  { match: /app\.get\('\/users', authenticate, authorize\('Admin'\)/, replace: "app.get('/users', authenticate, checkPerms('User Management')" },
  { match: /app\.put\('\/users\/role', authenticate, authorize\('Admin'\)/, replace: "app.put('/users/role', authenticate, checkPerms('User Management')" },
  { match: /app\.put\('\/permissions', authenticate, authorize\('Admin'\)/, replace: "app.put('/permissions', authenticate, checkPerms('User Management')" },
  { match: /app\.post\('\/cases', authenticate, authorize\([^)]+\)/, replace: "app.post('/cases', authenticate, checkPerms('Create Case')" },
  { match: /app\.put\('\/cases\/:id', authenticate, authorize\([^)]+\)/, replace: "app.put('/cases/:id', authenticate, checkPerms('Update Case', 'Close Case')" },
  { match: /app\.post\('\/upload',\s*authenticate,\s*authorize\([^)]+\)/, replace: "app.post('/upload',\n    authenticate,\n    checkPerms('Upload Evidence')" },
  { match: /app\.get\('\/evidence\/:hash\/download',\s*authenticate,\s*authorize\([^)]+\)/, replace: "app.get('/evidence/:hash/download',\n    authenticate,\n    checkPerms('Download Evidence')" },
  { match: /app\.put\('\/evidence\/:hash\/status',\s*authenticate,\s*authorize\([^)]+\)/, replace: "app.put('/evidence/:hash/status',\n    authenticate,\n    checkPerms('Change Status')" },
  { match: /app\.put\('\/evidence\/:hash\/case',\s*authenticate,\s*authorize\([^)]+\)/, replace: "app.put('/evidence/:hash/case',\n    authenticate,\n    checkPerms('Update Case', 'Upload Evidence')" },
  { match: /app\.post\('\/evidence\/:hash\/custody',\s*authenticate,\s*authorize\([^)]+\)/, replace: "app.post('/evidence/:hash/custody',\n    authenticate,\n    checkPerms('Change Status', 'Upload Evidence', 'Download Evidence', 'Verify Evidence')" },
  { match: /app\.get\('\/evidence\/:hash\/verify-integrity',\s*authenticate,\s*authorize\([^)]+\)/, replace: "app.get('/evidence/:hash/verify-integrity',\n    authenticate,\n    checkPerms('Verify Evidence')" },
  { match: /app\.get\('\/evidence\/:hash\/report',\s*authenticate,\s*authorize\([^)]+\)/, replace: "app.get('/evidence/:hash/report',\n    authenticate,\n    checkPerms('View Report')" },
  { match: /app\.get\('\/audit-log', authenticate, authorize\('Admin'\)/, replace: "app.get('/audit-log', authenticate, checkPerms('View Audit Logs')" }
];

replacements.forEach(r => {
  code = code.replace(r.match, r.replace);
});

fs.writeFileSync(path, code);
console.log('Successfully updated server routes.');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'reports-realm';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'reports-api';

const client = jwksClient({
  jwksUri: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000,
});

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    console.log('decoded', decoded);
    const key = await client.getSigningKey(decoded.header.kid);
    const publicKey = key.getPublicKey();

    const verified = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      audience: KEYCLOAK_CLIENT_ID,
      issuer: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`
    });

    req.user = verified;
    next();
  } catch (error) {
    console.error('Token validation error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userRoles = req.user.realm_access?.roles || [];
    if (!userRoles.includes(role)) {
      return res.status(403).json({ error: `Role '${role}' required` });
    }

    next();
  };
};

const generateReportData = () => {
  const reports = [];
  const reportTypes = ['usage', 'performance', 'security', 'analytics'];
  const statuses = ['completed', 'processing', 'failed'];
  
  for (let i = 1; i <= 10; i++) {
    reports.push({
      id: `report-${i}`,
      name: `${reportTypes[Math.floor(Math.random() * reportTypes.length)]} Report ${i}`,
      type: reportTypes[Math.floor(Math.random() * reportTypes.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      data: {
        metrics: {
          totalUsers: Math.floor(Math.random() * 10000),
          activeUsers: Math.floor(Math.random() * 5000),
          sessions: Math.floor(Math.random() * 50000),
          conversionRate: (Math.random() * 10).toFixed(2)
        },
        summary: `This is a sample report with randomly generated data for demonstration purposes. Report ID: ${i}`
      }
    });
  }
  
  return reports;
};

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/reports', authenticateToken, requireRole('prothetic_user'), (req, res) => {
  try {
    const reports = generateReportData();
    
    res.json({
      success: true,
      data: reports,
      user: {
        username: req.user.preferred_username,
        email: req.user.email,
        roles: req.user.realm_access?.roles || []
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Reports API server running on port ${PORT}`);
  console.log(`Keycloak URL: ${KEYCLOAK_URL}`);
  console.log(`Keycloak Realm: ${KEYCLOAK_REALM}`);
}); 
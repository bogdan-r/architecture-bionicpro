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

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://keycloak:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'reports-realm';
const KEYCLOAK_REALM_VALID_ROLE = 'prothetic_user';

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

    const key = await client.getSigningKey(decoded.header.kid);
    const publicKey = key.getPublicKey();

    const validIssuers = [
      `http://localhost:8080/realms/${KEYCLOAK_REALM}`
    ];

    const verified = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: validIssuers
    });

    console.log('verified', verified);
    const allowedClients = ['reports-api', 'reports-frontend'];
    if (!allowedClients.includes(verified.azp)) {
      return res.status(401).json({ error: 'Invalid client' });
    }

    if (!verified.realm_access.roles.includes(KEYCLOAK_REALM_VALID_ROLE)) {
      return res.status(401).json({ error: 'Invalid role' });
    }

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
  const prostheticTypes = ['upper_limb', 'lower_limb', 'hand', 'foot', 'knee', 'hip'];
  const statuses = ['active', 'maintenance', 'replacement_needed'];
  const activities = ['walking', 'running', 'lifting', 'grasping', 'climbing', 'swimming'];
  
  for (let i = 1; i <= 10; i++) {
    const prostheticType = prostheticTypes[Math.floor(Math.random() * prostheticTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const dailyUsageHours = Math.floor(Math.random() * 12) + 2;
    const weeklySteps = Math.floor(Math.random() * 50000) + 5000;
    
    reports.push({
      id: `prosthetic-${i}`,
      name: `${prostheticType.charAt(0).toUpperCase() + prostheticType.slice(1)} Prosthetic Report ${i}`,
      type: prostheticType,
      status: status,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      data: {
        usage: {
          dailyHours: dailyUsageHours,
          weeklySteps: weeklySteps,
          monthlyDistance: Math.floor(Math.random() * 200) + 20,
          comfortLevel: Math.floor(Math.random() * 10) + 1,
          batteryLife: prostheticType.includes('upper') ? Math.floor(Math.random() * 24) + 8 : null,
          lastCalibration: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        activities: {
          primaryActivity: activities[Math.floor(Math.random() * activities.length)],
          activityFrequency: Math.floor(Math.random() * 100) + 20,
          maxWeightLifted: prostheticType.includes('upper') ? Math.floor(Math.random() * 50) + 5 : null,
          walkingSpeed: prostheticType.includes('lower') ? (Math.random() * 2 + 0.5).toFixed(1) : null,
          gripStrength: prostheticType.includes('hand') ? Math.floor(Math.random() * 100) + 20 : null
        },
        maintenance: {
          lastService: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          nextServiceDue: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          wearLevel: Math.floor(Math.random() * 100) + 1, 
          adjustmentNeeded: Math.random() > 0.7,
          partsReplacement: Math.random() > 0.8
        },
        userFeedback: {
          satisfaction: Math.floor(Math.random() * 5) + 1,
          painLevel: Math.floor(Math.random() * 10) + 1,
          mobilityImprovement: Math.floor(Math.random() * 50) + 20,
          independenceLevel: Math.floor(Math.random() * 40) + 60
        },
        summary: `Отчет по использованию протеза типа "${prostheticType}" для пользователя ${i}. Устройство используется ${dailyUsageHours} часов в день, ${weeklySteps} шагов в неделю. Уровень комфорта: ${Math.floor(Math.random() * 10) + 1}/10.`
      }
    });
  }
  
  return reports;
};

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

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Reports API server running on port ${PORT}`);
  console.log(`Keycloak URL: ${KEYCLOAK_URL}`);
  console.log(`Keycloak Realm: ${KEYCLOAK_REALM}`);
}); 
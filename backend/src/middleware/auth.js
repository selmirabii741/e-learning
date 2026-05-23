import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import User from '../models/User.js';

const KC_URL = process.env.KEYCLOAK_URL || 'http://localhost:8180';
const KC_REALM = process.env.KEYCLOAK_REALM || 'elearning';


const jwks = jwksClient({
  jwksUri: `${KC_URL}/realms/${KC_REALM}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxAge: 600_000,
  rateLimit: true,
});

function getSigningKey(header) {
  return new Promise((resolve, reject) => {
    jwks.getSigningKey(header.kid, (err, key) => {
      if (err) return reject(err);
      resolve(key.getPublicKey());
    });
  });
}


export const protect = async (req, res, next) => {
  try {
    const raw = req.headers.authorization;
    if (!raw?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Non autorisé – Token manquant' });
    }
    const token = raw.split(' ')[1];


    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) return res.status(401).json({ message: 'Token invalide' });


    const publicKey = await getSigningKey(decoded.header);


    const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] });


    const realmRoles = payload.realm_access?.roles || [];
    let role = 'student';
    let hasExplicitRole = false;

    if (realmRoles.includes('admin')) { role = 'admin'; hasExplicitRole = true; }
    else if (realmRoles.includes('instructor')) { role = 'instructor'; hasExplicitRole = true; }

    const attrRole = payload.role?.[0] || payload.attributes?.role?.[0];
    if (attrRole && ['admin', 'instructor', 'student'].includes(attrRole)) {
      role = attrRole;
      hasExplicitRole = true;
    }

    const keycloakId = payload.sub;
    let email = payload.email || payload.preferred_username;
    if (!email || !email.includes('@')) {
      email = `${keycloakId}@no-email.local`;
    }
    const name = [payload.given_name, payload.family_name].filter(Boolean).join(' ')
      || payload.preferred_username
      || 'Utilisateur GitHub';

    // Extract speciality from KC attributes
    const speciality = payload.speciality?.[0] || payload.attributes?.speciality?.[0] || '';

    let user = await User.findOne({ keycloakId });
    if (!user) user = await User.findOne({ email });

    if (!user) {
      const randomPwd = Math.random().toString(36).slice(-16);
      user = await User.create({
        keycloakId, name, email,
        password: randomPwd,
        role,
        status: role === 'instructor' ? 'pending' : 'approved',
        speciality: speciality || '',
        avatar: payload.picture || '',
        provider: 'keycloak',
      });
    } else {


      let changed = false;
      if (!user.keycloakId) { user.keycloakId = keycloakId; changed = true; }
      if (hasExplicitRole && user.role !== role) { user.role = role; changed = true; }
      if (speciality && !user.speciality) { user.speciality = speciality; changed = true; }
      if (changed) await user.save();
    }

    req.user = user;

    // Block professors whose account is not yet approved
    // (skip if route explicitly allows pending users, e.g. certificate upload)
    if (!req._allowPending && user.role === 'instructor' && user.status && user.status !== 'approved') {
      return res.status(403).json({
        message: user.status === 'pending'
          ? 'Votre compte professeur est en attente de validation par un administrateur.'
          : 'Votre compte professeur a été rejeté. Contactez l\'administrateur.',
        status: user.status,
        code: 'PROFESSOR_NOT_APPROVED',
        user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
      });
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

/**
 * Like protect, but allows pending/rejected professors through.
 * Use for routes that pending professors need (certificate upload, verification status).
 */
export const protectAllowPending = (req, res, next) => {
  req._allowPending = true;
  return protect(req, res, next);
};

/**
 * Middleware: require that the user's account status is 'approved'.
 * Use after `protect` on routes that need a fully approved account.
 */
export const requireApproved = (req, res, next) => {
  if (req.user?.status && req.user.status !== 'approved') {
    return res.status(403).json({
      message: 'Votre compte n\'est pas encore approuvé.',
      status: req.user.status,
      code: 'ACCOUNT_NOT_APPROVED',
    });
  }
  next();
};

export const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {

    return res.status(403).json({ message: 'Accès refusé' });
  }
  next();
};

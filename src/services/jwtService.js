/**
 * JWT Service (Browser-Compatible)
 * Handles JWT token generation, encryption, and decryption using jose library
 * Ready for API migration - just replace with backend JWT verification
 */

import * as jose from 'jose';

// Secret key for JWT (in production, this should come from environment variables)
const JWT_SECRET = new TextEncoder().encode('purecycle-secret-key-2025-change-in-production');
const JWT_EXPIRATION = '7d'; // Token expires in 7 days

/**
 * Generate JWT token from user data
 * @param {object} user - User object
 * @returns {Promise<string>} JWT token
 */
export const generateToken = async (user) => {
  try {
    const payload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      fullname: user.fullname,
      contact_number: user.contact_number,
      city_municipality: user.city_municipality,
      barangay: user.barangay,
      purok: user.purok,
      profile_path: user.profile_path,
      status: user.status,
    };

    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRATION)
      .sign(JWT_SECRET);

    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    return null;
  }
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token
 * @returns {Promise<object|null>} Decoded user data or null if invalid
 */
export const verifyToken = async (token) => {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired, false otherwise
 */
export const isTokenExpired = (token) => {
  try {
    const decoded = jose.decodeJwt(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {object|null} Decoded data or null
 */
export const decodeToken = (token) => {
  try {
    return jose.decodeJwt(token);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Refresh token (generate new token from existing one)
 * @param {string} token - Current JWT token
 * @returns {Promise<string|null>} New token or null if invalid
 */
export const refreshToken = async (token) => {
  try {
    const decoded = await verifyToken(token);
    if (!decoded) return null;

    // Generate new token with same data
    const newToken = await generateToken(decoded);
    return newToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

export default {
  generateToken,
  verifyToken,
  isTokenExpired,
  decodeToken,
  refreshToken,
};

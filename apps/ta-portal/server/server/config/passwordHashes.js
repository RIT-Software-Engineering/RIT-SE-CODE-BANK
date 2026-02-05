// server/server/auth/passwordHashes.js

const crypto = require('crypto');

/**
 * Hashes a password using PBKDF2.
 * @param {string} password - The plain-text password to hash.
 * @returns {Promise<string>} A promise that resolves to a string containing the salt and hash.
 */
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    // 1. Generate a random, unique salt for every password
    const salt = crypto.randomBytes(16).toString('hex');

    // 2. Run the key derivation function
    // The iteration count should be high to make it slow for attackers.
    const iterations = 100000;
    const keylen = 64; // Length of the derived key
    const digest = 'sha512'; // Hashing algorithm

    crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKey) => {
      if (err) reject(err);
      // 3. Store the salt and the hash, separated by a character
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

/**
 * Verifies a password against a stored salt and hash.
 * @param {string} passwordAttempt - The password from the user login attempt.
 * @param {string} storedPassword - The stored string containing the salt and hash.
 * @returns {Promise<boolean>} A promise that resolves to true if the password is correct, false otherwise.
 */
async function verifyPassword(passwordAttempt, storedPassword) {
  return new Promise((resolve, reject) => {
    // 1. Split the stored string to get the salt and the original hash
    const [salt, originalHash] = storedPassword.split(':');
    
    const iterations = 100000;
    const keylen = 64;
    const digest = 'sha512';

    // 2. Hash the new password attempt using the *exact same salt and parameters*
    crypto.pbkdf2(passwordAttempt, salt, iterations, keylen, digest, (err, derivedKey) => {
      if (err) reject(err);

      const derivedHash = derivedKey.toString('hex');
      
      // 3. Use a timing-safe comparison to prevent timing attacks
      const isMatch = crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(derivedHash, 'hex'));
      resolve(isMatch);
    });
  });
}

module.exports = {
  hashPassword,
  verifyPassword
};
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET    = process.env.SCOPED_TOKEN_SECRET ?? '';

if (!SECRET || SECRET.length < 32) {
  throw new Error('SCOPED_TOKEN_SECRET must be at least 32 characters in .env');
}

// Use first 32 bytes of the secret as the key
const KEY = Buffer.from(SECRET.slice(0, 32), 'utf8');

export const encrypt = (plaintext: string): string => {
  const iv         = crypto.randomBytes(16);
  const cipher     = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted  = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  // Store as iv:encrypted — both needed to decrypt
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (ciphertext: string): string => {
  const [ivHex, encryptedHex] = ciphertext.split(':');
  const iv        = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher  = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
};
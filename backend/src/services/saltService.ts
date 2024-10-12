import { jwtDecode } from 'jwt-decode';
import crypto from 'crypto';

const SALT_MASTER_SEED = process.env.SALT_MASTER_SEED || 'your_default_master_seed';

interface JwtPayload {
  sub: string;
  aud: string;
  iss: string;
}

export async function getSalt(jwt: string): Promise<string> {
  const decoded = jwtDecode<JwtPayload>(jwt);
  const { sub, aud, iss } = decoded;

  // Use HKDF to derive a unique salt for each user
  const salt = crypto.createHmac('sha256', SALT_MASTER_SEED)
    .update(`${iss}|${aud}|${sub}`)
    .digest('hex');

  return salt;
}

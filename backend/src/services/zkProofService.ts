import axios from 'axios';
import { PROVER_URL } from '../utils/config';

export async function generateZkProof(
  jwt: string,
  ephemeralPublicKey: string,
  maxEpoch: string,
  jwtRandomness: string,
  salt: string
) {
  try {
    const response = await axios.post(PROVER_URL, {
      jwt,
      extendedEphemeralPublicKey: ephemeralPublicKey,
      maxEpoch,
      jwtRandomness,
      salt,
      keyClaimName: 'sub',
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to generate ZK proof: ${error.response?.statusText}`);
    }
    throw error;
  }
}
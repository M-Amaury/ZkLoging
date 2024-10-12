import React, { useState, useEffect } from 'react';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { generateNonce, generateRandomness, jwtToAddress, getExtendedEphemeralPublicKey } from '@mysten/zklogin';
import { SuiClient } from '@mysten/sui/client';
import { jwtDecode } from "jwt-decode";
import axios from 'axios';
const FULLNODE_URL = 'https://fullnode.testnet.sui.io'; 
const CLIENT_ID = import.meta.env.VITE_ZK_LOGIN_CLIENT_ID || '';
const REDIRECT_URL = import.meta.env.VITE_ZK_LOGIN_REDIRECT_URL || '';
const BACKEND_URL = 'http://localhost:3000/api/zklogin';

export interface JwtPayload {
	iss?: string;
	sub?: string; //Subject ID
	aud?: string[] | string;
	exp?: number;
	nbf?: number;
	iat?: number;
	jti?: string;
}

const SuiZkLogin: React.FC = () => {
  const [ephemeralKeyPair, setEphemeralKeyPair] = useState<Ed25519Keypair | null>(null);
  const [nonce, setNonce] = useState<string>('');
  const [maxEpoch, setMaxEpoch] = useState<number>(0);
  const [zkLoginAddress, setZkLoginAddress] = useState<string>('');

  useEffect(() => {
    console.log('Environment variables:', { CLIENT_ID, REDIRECT_URL });
    const initializeZkLogin = async () => {
      const suiClient = new SuiClient({ url: FULLNODE_URL });
      const { epoch } = await suiClient.getLatestSuiSystemState();

      const newEphemeralKeyPair = new Ed25519Keypair();
      const newMaxEpoch = Number(epoch) + 2; // Active for 2 epochs
      const randomness = generateRandomness();
      const newNonce = generateNonce(newEphemeralKeyPair.getPublicKey(), newMaxEpoch, randomness);

      setEphemeralKeyPair(newEphemeralKeyPair);
      setMaxEpoch(newMaxEpoch);
      setNonce(newNonce);

      console.log('Initialized zkLogin:', { maxEpoch: newMaxEpoch, nonce: newNonce });
    };

    initializeZkLogin();

    // Check for JWT in URL fragment
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const jwt = hashParams.get('id_token');

    if (jwt) {
      handleJwtToken(jwt);
    }
  }, []);

  const handleJwtToken = async (jwt: string) => {
    try {
      const decodedJwt = jwtDecode<JwtPayload>(jwt);
      console.log('Decoded JWT:', decodedJwt);

      // Obtenir le sel du backend
      const saltResponse = await fetch(`${BACKEND_URL}/salt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jwt }),
      });
      const { salt } = await saltResponse.json();

      if (decodedJwt.sub) {
        const address = jwtToAddress(jwt, salt);
        setZkLoginAddress(address);
        console.log('zkLogin Address:', address);

        if (ephemeralKeyPair) {
          const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(ephemeralKeyPair.getPublicKey());
          const jwtRandomness = generateRandomness();

          // Générer la preuve ZK
          const zkProofResult = await axios.post(
            "https://prover-dev.mystenlabs.com/v1",
            {
              jwt: oauthParams?.id_token as string,
              extendedEphemeralPublicKey: extendedEphemeralPublicKey,
              maxEpoch: maxEpoch,
              jwtRandomness: jwtRandomness,
              salt: salt,
              keyClaimName: "sub",
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
          
          const partialZkLoginSignature = zkProofResult.data as PartialZkLoginSignature
          console.log('ZK Proof:', partialZkLoginSignature);

          // Utilisez la preuve ZK pour les transactions ultérieures
        }
      } else {
        console.error('JWT does not contain a subject (sub) claim');
      }
    } catch (error) {
      console.error('Error processing JWT:', error);
    }
  };

  const handleLoginClick = () => {
    if (!nonce || !CLIENT_ID || !REDIRECT_URL) {
      console.error('Missing required parameters for zkLogin:', { nonce, CLIENT_ID, REDIRECT_URL });
      return;
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&response_type=id_token&redirect_uri=${REDIRECT_URL}&scope=openid&nonce=${nonce}`;
    console.log('Auth URL:', authUrl);
    window.location.href = authUrl;
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Sui zkLogin</h2>
      {zkLoginAddress ? (
        <div>
          <p className="mb-2">Logged in successfully!</p>
          <p>zkLogin Address: {zkLoginAddress}</p>
        </div>
      ) : (
        <button onClick={handleLoginClick} className="btn btn-primary">
          Login with Google
        </button>
      )}
    </div>
  );
};

export default SuiZkLogin;

import express from 'express';
import { getSalt } from '../services/saltService';
import { generateZkProof } from '../services/zkProofService';

const router = express.Router();

router.post('/salt', async (req, res) => {
  const { jwt } = req.body;
  try {
    const salt = await getSalt(jwt);
    res.json({ salt });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/proof', async (req, res) => {
  const { jwt, ephemeralPublicKey, maxEpoch, jwtRandomness, salt } = req.body;
  try {
    const proof = await generateZkProof(jwt, ephemeralPublicKey, maxEpoch, jwtRandomness, salt);
    res.json(proof);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;

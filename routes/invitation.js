import express from 'express';
import { respondToInvitation } from '../controllers/invitationController.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Invitation route placeholder');
});

router.post('/respond', respondToInvitation);

export default router;

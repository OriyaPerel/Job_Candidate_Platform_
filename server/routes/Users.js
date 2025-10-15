import { Router } from 'express';
import { createUser } from '../controllers/UserController.js';
import { getUserByEmail } from '../controllers/UserController.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, scope: 'users' }));
router.get('/:email', getUserByEmail);
router.post('/register', createUser);

export default router;

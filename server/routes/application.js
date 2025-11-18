import { Router } from 'express'
import { createApplication } from '../controllers/ApplicationController.js';
import { getMyApplications } from '../controllers/ApplicationController.js';
import { auth} from '../middleware/auth.js';


const router = Router();

router.post('/applications', auth, createApplication);
router.get('/applications/my', auth, getMyApplications);

export default router;
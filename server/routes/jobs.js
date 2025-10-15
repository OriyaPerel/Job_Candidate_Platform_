import { Router } from 'express';
import { createJob } from '../controllers/JobController.js';
import { getAllJobs } from '../controllers/JobController.js';
import { getJobById } from '../controllers/JobController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/jobs', getAllJobs);
router.get('/jobs/:id', getJobById);
router.post('/jobs', auth, createJob);

export default router;

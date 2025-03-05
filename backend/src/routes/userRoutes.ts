import express from 'express';
import {
  CreateUser,
  loginUser,
  verifyTokenApi,
} from '../controllers/userController';

const router = express.Router();

router.post('/create', CreateUser);
router.post('/login', loginUser);

router.get('/verifytoken', verifyTokenApi);

export default router;

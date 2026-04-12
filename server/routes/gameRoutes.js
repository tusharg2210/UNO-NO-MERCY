import { Router } from 'express';
const router = Router();
import { getGame, getActiveGames, getGameHistory, getLeaderboard } from '../controllers/gameController.js';
import { protect } from '../middleware/auth.js';

router.get('/leaderboard', getLeaderboard);
router.get('/active', protect, getActiveGames);
router.get('/history', protect, getGameHistory);
router.get('/:roomCode', protect, getGame);

export default router;
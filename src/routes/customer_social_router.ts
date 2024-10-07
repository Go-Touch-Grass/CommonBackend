import express from "express";
import { authMiddleware } from "../middleware/auth";
import { UserRole } from '../entities/abstract/AbstractUser';
import {
    getAllFriends,
    sendFriendRequest,
    getAllFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    getLeaderboard
} from "../controllers/customer_social";

const router = express.Router();

// Routes that require authentication
router.get("/friends", authMiddleware([UserRole.CUSTOMER]), getAllFriends);
router.post("/friends/request", authMiddleware([UserRole.CUSTOMER]), sendFriendRequest);
router.get("/friends/requests", authMiddleware([UserRole.CUSTOMER]), getAllFriendRequests);
router.post("/friends/accept", authMiddleware([UserRole.CUSTOMER]), acceptFriendRequest);
router.post("/friends/reject", authMiddleware([UserRole.CUSTOMER]), rejectFriendRequest);
router.delete("/friends", authMiddleware([UserRole.CUSTOMER]), removeFriend);

// Route that doesn't require authentication
router.get("/leaderboard", getLeaderboard);

export { router as customerSocialRouter };
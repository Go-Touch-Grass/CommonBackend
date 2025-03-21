import express from "express";
import { authMiddleware } from "../middleware/auth";
import { UserRole } from '../entities/abstract/abstractUser.entity';
import {
    getAllFriends,
    sendFriendRequest,
    getAllFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    getLeaderboard
} from "../controllers/customerSocial.controller";

const router = express.Router();

// Routes that require authentication
router.get("/api/social/friends", authMiddleware([UserRole.CUSTOMER]), getAllFriends);
router.post("/api/social/friends/request", authMiddleware([UserRole.CUSTOMER]), sendFriendRequest);
router.get("/api/social/friends/requests", authMiddleware([UserRole.CUSTOMER]), getAllFriendRequests);
router.post("/api/social/friends/accept", authMiddleware([UserRole.CUSTOMER]), acceptFriendRequest);
router.post("/api/social/friends/reject", authMiddleware([UserRole.CUSTOMER]), rejectFriendRequest);
router.delete("/api/social/friends", authMiddleware([UserRole.CUSTOMER]), removeFriend);
//routes for referral module


// Route that doesn't require authentication
router.get("/api/social/leaderboard", getLeaderboard);


export { router as customerSocialRouter };
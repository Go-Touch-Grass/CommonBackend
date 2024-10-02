import express from "express";
import { authMiddleware } from "../middleware/auth";
import {
  loginAdmin,
  getAllBusinesses,
  getOneBusiness,
  getAllPendingBusinessRegistrations,
  getOnePendingBusinessRegistration,
  reviewOnePendingBusinessRegistration,
  getAllCustomers,
  getOneCustomer,
  getAllAvatarRequests,
  getOneAvatarRequest,
} from "../controllers/admin";

const router = express.Router();

router.post("/api/admin/login", loginAdmin);

router.get("/api/admin/business", authMiddleware(["admin"]), getAllBusinesses);
router.get(
  "/api/admin/business/:business_id",
  authMiddleware(["admin"]),
  getOneBusiness
);
router.get(
  "/api/admin/registration",
  authMiddleware(["admin"]),
  getAllPendingBusinessRegistrations
);
router.get(
  "/api/admin/registration/:registration_id",
  authMiddleware(["admin"]),
  getOnePendingBusinessRegistration
);
router.put(
  "/api/admin/registration/:registration_id",
  authMiddleware(["admin"]),
  reviewOnePendingBusinessRegistration
);

router.get("/api/admin/customer", authMiddleware(["admin"]), getAllCustomers);
router.get(
  "/api/admin/customer/:customer_id",
  authMiddleware(["admin"]),
  getOneCustomer
);

router.get(
  "/api/admin/avatarRequests",
  authMiddleware(["admin"]),
  getAllAvatarRequests
);
router.get(
  "/api/admin/avatarRequests/:registration_id",
  authMiddleware(["admin"]),
  getOneAvatarRequest
);

export { router as adminRouter };

import express from "express";
import { authMiddleware } from "../middleware/auth";
import {
    loginAdmin,
    getAllBusinesses,
    getOneBusiness,
    getAllPendingBusinessRegistrations,
    getPendingBusinessRegistrationByRegistrationId,
    reviewPendingBusinessRegistrationByRegistrationId,
    getAllCustomers,
    getCustomerByCustomerId,
    getBusinessTransactionsByBusinessId,
    getCustomerTransactionsByCustomerId,
} from "../controllers/admin";

const router = express.Router();

router.post("/api/admin/login", loginAdmin);

// Business-related routes below
router.get("/api/admin/business", authMiddleware(["admin"]), getAllBusinesses);
router.get("/api/admin/business/:business_id", authMiddleware(["admin"]), getOneBusiness);
router.get("/api/admin/registration", authMiddleware(["admin"]), getAllPendingBusinessRegistrations);
router.get("/api/admin/registration/:registration_id", authMiddleware(["admin"]), getPendingBusinessRegistrationByRegistrationId);
router.put("/api/admin/registration/:registration_id", authMiddleware(["admin"]), reviewPendingBusinessRegistrationByRegistrationId);
router.get("/api/admin/business/:business_id/transactions", authMiddleware(["admin"]), getBusinessTransactionsByBusinessId);

// Customer-related routes below
router.get("/api/admin/customer", authMiddleware(["admin"]), getAllCustomers);
router.get("/api/admin/customer/:customer_id", authMiddleware(["admin"]), getCustomerByCustomerId);
router.get("/api/admin/customer/:customer_id/transactions", authMiddleware(["admin"]), getCustomerTransactionsByCustomerId);

export { router as adminRouter };
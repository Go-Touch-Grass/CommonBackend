import express from "express";
import { authMiddleware } from "../middleware/auth";
import { getAllBusinesses, getAllCustomers, loginAdmin } from "../controllers/admin";

const router = express.Router();

router.post("/api/admin/login", loginAdmin);
router.get("/api/admin/business", authMiddleware(["admin"]), getAllBusinesses);
router.get("/api/admin/customer", authMiddleware(["admin"]), getAllCustomers);

export { router as adminRouter };
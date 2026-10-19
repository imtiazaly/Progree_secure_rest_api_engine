import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { taskRoutes } from "./task.routes.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

// Health check endpoint (for load balancers & monitoring)
router.get("/health", (req, res) => {
  res.status(200).json(
    new ApiResponse(
      200,
      {
        status: "UP",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      "API is healthy and operational",
    ),
  );
});

// Resource Routers
router.use("/auth", authRoutes);
router.use("/tasks", taskRoutes);

export const apiRouter = router;

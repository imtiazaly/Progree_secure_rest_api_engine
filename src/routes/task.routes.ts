import { Router } from "express";
import { TaskController } from "../controllers/task.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdParamSchema,
  queryTasksSchema,
} from "../schemas/task.schema.js";

const router = Router();

// Saare Task endpoints authenticated hone chahiye
router.use(authenticate);

router
  .route("/")
  .post(validate(createTaskSchema), TaskController.createTask)
  .get(validate(queryTasksSchema), TaskController.getTasks);

router
  .route("/:id")
  .get(validate(taskIdParamSchema), TaskController.getTaskById)
  .patch(validate(updateTaskSchema), TaskController.updateTask)
  .delete(validate(taskIdParamSchema), TaskController.deleteTask);

export const taskRoutes = router;

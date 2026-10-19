import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";

export const validate =
  (schema: ZodType) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Validated aur sanitized data assign karein
      req.body = (parsed as any).body ?? req.body;
      req.query = (parsed as any).query ?? req.query;
      req.params = (parsed as any).params ?? req.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        next(new ApiError(400, "Validation Failed", errorMessages));
      } else {
        next(error);
      }
    }
  };

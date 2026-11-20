import express, { type Express } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./docs/openapi.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { createUsersRouter } from "./routes/users.js";
import type { UserService } from "./users/userService.js";

export function createApp(userService: UserService): Express {
  const app = express();

  app.use(express.json());
  app.use("/user", createUsersRouter(userService));
  app.get("/health", (_request, response) => response.status(200).json({ status: "ok" }));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.get("/api-docs.json", (_request, response) => response.status(200).json(openApiDocument));
  app.use(errorHandler);

  return app;
}

import { Router } from "express";
import type { UserService } from "../users/userService.js";

export function createUsersRouter(userService: UserService): Router {
  const router = Router();

  router.get("/get", (request, response) => {
    const user = userService.getById(request.query.id);
    response.status(200).json(user);
  });

  return router;
}

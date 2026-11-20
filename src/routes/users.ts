import { Router } from "express";
import type { UserService } from "../users/userService.js";

export function createUsersRouter(userService: UserService): Router {
  const router = Router();

  router.get("/get", (request, response) => {
    const user = userService.getById(request.query.id);
    response.status(200).json(user);
  });

  router.get("/list", (request, response) => {
    const result = userService.list(request.query.page, request.query.limit);
    response.status(200).json(result);
  });

  router.get("/search", (request, response) => {
    const result = userService.search(request.query.q, request.query.page, request.query.limit);
    response.status(200).json(result);
  });

  router.put("/update", (request, response) => {
    const user = userService.updateById(request.query.id, request.body);
    response.status(200).json(user);
  });

  router.delete("/delete", (request, response) => {
    userService.deleteById(request.query.id);
    response.status(204).send();
  });

  return router;
}

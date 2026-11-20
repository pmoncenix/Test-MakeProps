import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import type { AuthenticatedRequest } from "../auth/authenticationMiddleware.js";
import { uploadUserPhotos } from "../middleware/uploadUserPhotos.js";
import type { UserService } from "../users/userService.js";

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_request, response) => {
    response.status(429).json({
      error: {
        code: "LOGIN_RATE_LIMITED",
        message: "Trop de tentatives de connexion. Réessayez dans 15 minutes.",
      },
    });
  },
});

export function createUsersRouter(userService: UserService): Router {
  const router = Router();

  router.post("/register", uploadUserPhotos, async (request, response) => {
    const files = Array.isArray(request.files) ? request.files : [];
    const photos = files.map((file) => ({ mimeType: file.mimetype, data: file.buffer }));
    const result = await userService.register(request.body, photos);
    response
      .status(201)
      .location(`/user/get?id=${result.user.id}`)
      .json(result);
  });

  router.post("/login", loginRateLimiter, async (request, response) => {
    const result = await userService.login(request.body);
    response.status(200).json(result);
  });

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

  router.get("/me", (request, response) => {
    const { userId } = (request as AuthenticatedRequest).auth;
    response.status(200).json(userService.getAuthenticatedUser(userId));
  });

  router.put("/me", (request, response) => {
    const { userId } = (request as AuthenticatedRequest).auth;
    const user = userService.updateAuthenticatedUser(userId, request.body);
    response.status(200).json(user);
  });

  router.put("/update", (request, response) => {
    const user = userService.updateById(request.query.id, request.body);
    response.status(200).json(user);
  });

  router.delete("/delete", async (request, response) => {
    await userService.deleteById(request.query.id);
    response.status(204).send();
  });

  return router;
}

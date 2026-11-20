import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  if (isMalformedJsonError(error)) {
    response.status(400).json({
      error: {
        code: "INVALID_JSON_BODY",
        message: "Le corps de la requête doit contenir un JSON valide.",
      },
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Une erreur interne est survenue.",
    },
  });
};

function isMalformedJsonError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "type" in error
    && error.type === "entity.parse.failed";
}

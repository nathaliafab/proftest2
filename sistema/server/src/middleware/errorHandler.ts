import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

interface HttpError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  error: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Dados invalidos",
      details: error.issues.map((issue) => issue.message)
    });
    return;
  }

  const statusCode = error.statusCode ?? 500;
  const message = statusCode >= 500 ? "Erro interno do servidor" : error.message;

  res.status(statusCode).json({ message });
};
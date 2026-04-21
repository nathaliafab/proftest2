import { Router } from "express";
import { listAssessmentMatrix, updateStudentAssessments } from "../services/assessmentService";

const assessmentRoutes = Router();

assessmentRoutes.get("/", async (_req, res, next) => {
  try {
    const matrix = await listAssessmentMatrix();
    res.status(200).json(matrix);
  } catch (error) {
    next(error);
  }
});

assessmentRoutes.put("/:studentId", async (req, res, next) => {
  try {
    const row = await updateStudentAssessments(req.params.studentId, req.body);
    res.status(200).json(row);
  } catch (error) {
    next(error);
  }
});

export default assessmentRoutes;
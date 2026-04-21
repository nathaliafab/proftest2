import { Router } from "express";
import { forceSendStudentDigests, listSentDigestsByStudent } from "../services/notificationService";

const notificationRoutes = Router();

notificationRoutes.post("/force-send/:studentId", async (req, res, next) => {
  try {
    const result = await forceSendStudentDigests(req.params.studentId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

notificationRoutes.get("/sent/:studentId", async (req, res, next) => {
  try {
    const items = await listSentDigestsByStudent(req.params.studentId);
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
});

export default notificationRoutes;

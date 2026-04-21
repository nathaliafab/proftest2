import { Router } from "express";
import {
  createClassroom,
  deleteClassroom,
  getClassroomById,
  listClassrooms,
  updateClassroom,
  updateClassroomStudentAssessments
} from "../services/classroomService";

const classroomRoutes = Router();

classroomRoutes.get("/", async (_req, res, next) => {
  try {
    const classrooms = await listClassrooms();
    res.status(200).json(classrooms);
  } catch (error) {
    next(error);
  }
});

classroomRoutes.get("/:id", async (req, res, next) => {
  try {
    const classroom = await getClassroomById(req.params.id);
    res.status(200).json(classroom);
  } catch (error) {
    next(error);
  }
});

classroomRoutes.post("/", async (req, res, next) => {
  try {
    const classroom = await createClassroom(req.body);
    res.status(201).json(classroom);
  } catch (error) {
    next(error);
  }
});

classroomRoutes.put("/:id", async (req, res, next) => {
  try {
    const classroom = await updateClassroom(req.params.id, req.body);
    res.status(200).json(classroom);
  } catch (error) {
    next(error);
  }
});

classroomRoutes.delete("/:id", async (req, res, next) => {
  try {
    await deleteClassroom(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

classroomRoutes.put("/:id/evaluations/:studentId", async (req, res, next) => {
  try {
    const classroom = await updateClassroomStudentAssessments(
      req.params.id,
      req.params.studentId,
      req.body
    );
    res.status(200).json(classroom);
  } catch (error) {
    next(error);
  }
});

export default classroomRoutes;
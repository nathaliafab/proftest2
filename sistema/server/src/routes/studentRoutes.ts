import { Router } from "express";
import {
  createStudent,
  deleteStudent,
  listStudents,
  updateStudent
} from "../services/studentService";

const studentRoutes = Router();

studentRoutes.get("/", async (_req, res, next) => {
  try {
    const students = await listStudents();
    res.status(200).json(students);
  } catch (error) {
    next(error);
  }
});

studentRoutes.post("/", async (req, res, next) => {
  try {
    const student = await createStudent(req.body);
    res.status(201).json(student);
  } catch (error) {
    next(error);
  }
});

studentRoutes.put("/:id", async (req, res, next) => {
  try {
    const student = await updateStudent(req.params.id, req.body);
    res.status(200).json(student);
  } catch (error) {
    next(error);
  }
});

studentRoutes.delete("/:id", async (req, res, next) => {
  try {
    await deleteStudent(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default studentRoutes;
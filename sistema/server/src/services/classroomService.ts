import crypto from "crypto";
import { z } from "zod";
import { readClassrooms, writeClassrooms } from "../repositories/classroomRepository";
import { readStudents } from "../repositories/studentRepository";
import { EVALUATION_CONCEPTS, EvaluationConcept, GOALS, Goal } from "../types/assessment";
import {
  Classroom,
  ClassroomInput,
  ClassroomView,
  ClassroomStudentView
} from "../types/classroom";
import { buildDefaultEvaluations, normalizeStudents } from "./studentNormalization";
import { queueStudentAssessmentDigestChanges } from "./notificationService";

const classroomInputSchema = z.object({
  topic: z.string().trim().min(3, "Topico deve ter ao menos 3 caracteres"),
  year: z.number().int().min(2000, "Ano invalido").max(2100, "Ano invalido"),
  semester: z.number().int().min(1, "Semestre deve ser 1 ou 2").max(2, "Semestre deve ser 1 ou 2"),
  studentIds: z.array(z.string()).default([])
});

const updateClassroomAssessmentSchema = z.object({
  evaluations: z
    .record(z.enum(EVALUATION_CONCEPTS))
    .refine(
      (evaluations) => Object.keys(evaluations).every((goal) => GOALS.includes(goal as Goal)),
      "Meta invalida"
    )
});

const notFoundError = (message: string): Error => {
  const err = new Error(message);
  (err as Error & { statusCode: number }).statusCode = 404;
  return err;
};

const validationError = (message: string): Error => {
  const err = new Error(message);
  (err as Error & { statusCode: number }).statusCode = 400;
  return err;
};

const normalizeClassroom = (classroom: Classroom): Classroom => {
  const uniqueIds = [...new Set(classroom.studentIds)];
  const normalizedEvaluations: Record<string, Record<Goal, EvaluationConcept>> = {};

  for (const studentId of uniqueIds) {
    const current = classroom.studentEvaluations[studentId] ?? {};
    normalizedEvaluations[studentId] = GOALS.reduce(
      (acc, goal) => ({
        ...acc,
        [goal]: EVALUATION_CONCEPTS.includes(current[goal] as EvaluationConcept)
          ? (current[goal] as EvaluationConcept)
          : buildDefaultEvaluations()[goal]
      }),
      {} as Record<Goal, EvaluationConcept>
    );
  }

  return {
    ...classroom,
    studentIds: uniqueIds,
    studentEvaluations: normalizedEvaluations
  };
};

const ensureStudentsExist = (studentIds: string[], existingStudentIds: Set<string>): void => {
  const missingId = studentIds.find((id) => !existingStudentIds.has(id));
  if (missingId) {
    throw validationError("Um ou mais alunos informados nao existem");
  }
};

const toClassroomView = (
  classroom: Classroom,
  studentNamesById: Record<string, string>
): ClassroomView => {
  const students: ClassroomStudentView[] = classroom.studentIds.map((studentId) => ({
    studentId,
    studentName: studentNamesById[studentId] ?? "Aluno removido",
    evaluations: classroom.studentEvaluations[studentId] ?? buildDefaultEvaluations()
  }));

  return {
    id: classroom.id,
    topic: classroom.topic,
    year: classroom.year,
    semester: classroom.semester,
    students,
    createdAt: classroom.createdAt,
    updatedAt: classroom.updatedAt
  };
};

const buildStudentNamesLookup = async (): Promise<Record<string, string>> => {
  const students = normalizeStudents(await readStudents());
  return students.reduce(
    (acc, student) => ({
      ...acc,
      [student.id]: student.name
    }),
    {} as Record<string, string>
  );
};

export const listClassrooms = async (): Promise<ClassroomView[]> => {
  const classrooms = (await readClassrooms()).map((classroom) => normalizeClassroom(classroom));
  const studentNamesById = await buildStudentNamesLookup();

  return classrooms
    .sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      if (a.semester !== b.semester) {
        return b.semester - a.semester;
      }
      return a.topic.localeCompare(b.topic);
    })
    .map((classroom) => toClassroomView(classroom, studentNamesById));
};

export const getClassroomById = async (id: string): Promise<ClassroomView> => {
  const classrooms = (await readClassrooms()).map((classroom) => normalizeClassroom(classroom));
  const classroom = classrooms.find((item) => item.id === id);

  if (!classroom) {
    throw notFoundError("Turma nao encontrada");
  }

  const studentNamesById = await buildStudentNamesLookup();
  return toClassroomView(classroom, studentNamesById);
};

export const createClassroom = async (payload: ClassroomInput): Promise<ClassroomView> => {
  const parsed = classroomInputSchema.parse(payload);
  const classrooms = (await readClassrooms()).map((classroom) => normalizeClassroom(classroom));
  const students = normalizeStudents(await readStudents());
  const studentIds = [...new Set(parsed.studentIds)];
  const existingStudentIds = new Set(students.map((student) => student.id));

  ensureStudentsExist(studentIds, existingStudentIds);

  const now = new Date().toISOString();
  const studentEvaluations = studentIds.reduce(
    (acc, studentId) => ({
      ...acc,
      [studentId]: buildDefaultEvaluations()
    }),
    {} as Record<string, Record<Goal, EvaluationConcept>>
  );

  const newClassroom: Classroom = {
    id: crypto.randomUUID(),
    topic: parsed.topic,
    year: parsed.year,
    semester: parsed.semester,
    studentIds,
    studentEvaluations,
    createdAt: now,
    updatedAt: now
  };

  classrooms.push(newClassroom);
  await writeClassrooms(classrooms);

  const studentNamesById = await buildStudentNamesLookup();
  return toClassroomView(newClassroom, studentNamesById);
};

export const updateClassroom = async (id: string, payload: ClassroomInput): Promise<ClassroomView> => {
  const parsed = classroomInputSchema.parse(payload);
  const classrooms = (await readClassrooms()).map((classroom) => normalizeClassroom(classroom));
  const classroomIndex = classrooms.findIndex((item) => item.id === id);

  if (classroomIndex < 0) {
    throw notFoundError("Turma nao encontrada");
  }

  const students = normalizeStudents(await readStudents());
  const existingStudentIds = new Set(students.map((student) => student.id));
  const studentIds = [...new Set(parsed.studentIds)];

  ensureStudentsExist(studentIds, existingStudentIds);

  const current = classrooms[classroomIndex];
  const mergedEvaluations = studentIds.reduce(
    (acc, studentId) => ({
      ...acc,
      [studentId]: current.studentEvaluations[studentId] ?? buildDefaultEvaluations()
    }),
    {} as Record<string, Record<Goal, EvaluationConcept>>
  );

  const updated: Classroom = {
    ...current,
    topic: parsed.topic,
    year: parsed.year,
    semester: parsed.semester,
    studentIds,
    studentEvaluations: mergedEvaluations,
    updatedAt: new Date().toISOString()
  };

  classrooms[classroomIndex] = updated;
  await writeClassrooms(classrooms);

  const studentNamesById = await buildStudentNamesLookup();
  return toClassroomView(updated, studentNamesById);
};

export const deleteClassroom = async (id: string): Promise<void> => {
  const classrooms = (await readClassrooms()).map((classroom) => normalizeClassroom(classroom));
  const filtered = classrooms.filter((item) => item.id !== id);

  if (filtered.length === classrooms.length) {
    throw notFoundError("Turma nao encontrada");
  }

  await writeClassrooms(filtered);
};

export const updateClassroomStudentAssessments = async (
  classroomId: string,
  studentId: string,
  payload: unknown
): Promise<ClassroomView> => {
  const parsed = updateClassroomAssessmentSchema.parse(payload);
  const classrooms = (await readClassrooms()).map((classroom) => normalizeClassroom(classroom));
  const classroomIndex = classrooms.findIndex((item) => item.id === classroomId);

  if (classroomIndex < 0) {
    throw notFoundError("Turma nao encontrada");
  }

  const classroom = classrooms[classroomIndex];

  if (!classroom.studentIds.includes(studentId)) {
    throw notFoundError("Aluno nao matriculado nesta turma");
  }

  const updatedEvaluations = GOALS.reduce(
    (acc, goal) => ({
      ...acc,
      [goal]: parsed.evaluations[goal] ?? classroom.studentEvaluations[studentId][goal]
    }),
    {} as Record<Goal, EvaluationConcept>
  );

  const changedGoals = GOALS.filter(
    (goal) => classroom.studentEvaluations[studentId][goal] !== updatedEvaluations[goal]
  );

  const updatedClassroom: Classroom = {
    ...classroom,
    studentEvaluations: {
      ...classroom.studentEvaluations,
      [studentId]: updatedEvaluations
    },
    updatedAt: new Date().toISOString()
  };

  classrooms[classroomIndex] = updatedClassroom;
  await writeClassrooms(classrooms);

  const students = normalizeStudents(await readStudents());
  const targetStudent = students.find((student) => student.id === studentId);
  if (targetStudent && changedGoals.length > 0) {
    await queueStudentAssessmentDigestChanges({
      studentId,
      studentName: targetStudent.name,
      studentEmail: targetStudent.email,
      classroomId: classroom.id,
      classroomName: `${classroom.topic} (${classroom.year}/${classroom.semester})`,
      changes: changedGoals.map((goal) => ({
        goal,
        previousConcept: classroom.studentEvaluations[studentId][goal],
        nextConcept: updatedEvaluations[goal]
      }))
    });
  }

  const studentNamesById = students.reduce(
    (acc, student) => ({
      ...acc,
      [student.id]: student.name
    }),
    {} as Record<string, string>
  );
  return toClassroomView(updatedClassroom, studentNamesById);
};

export const removeStudentFromAllClassrooms = async (studentId: string): Promise<void> => {
  const classrooms = (await readClassrooms()).map((classroom) => normalizeClassroom(classroom));
  let changed = false;

  const updated = classrooms.map((classroom) => {
    if (!classroom.studentIds.includes(studentId)) {
      return classroom;
    }

    changed = true;
    const nextStudentIds = classroom.studentIds.filter((id) => id !== studentId);
    const { [studentId]: _removed, ...nextEvaluations } = classroom.studentEvaluations;

    return {
      ...classroom,
      studentIds: nextStudentIds,
      studentEvaluations: nextEvaluations,
      updatedAt: new Date().toISOString()
    };
  });

  if (changed) {
    await writeClassrooms(updated);
  }
};
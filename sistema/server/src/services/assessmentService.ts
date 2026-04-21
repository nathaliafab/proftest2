import { z } from "zod";
import { readStudents, writeStudents } from "../repositories/studentRepository";
import {
  AssessmentMatrix,
  AssessmentRow,
  EVALUATION_CONCEPTS,
  EvaluationConcept,
  GOALS,
  Goal
} from "../types/assessment";
import { Student } from "../types/student";
import { buildDefaultEvaluations, normalizeStudents } from "./studentNormalization";
import { queueStudentAssessmentDigestChanges } from "./notificationService";

const updateAssessmentSchema = z.object({
  evaluations: z
    .record(z.enum(EVALUATION_CONCEPTS))
    .refine(
      (evaluations) => Object.keys(evaluations).every((goal) => GOALS.includes(goal as Goal)),
      "Meta invalida"
    )
});

const notFoundError = (): Error => {
  const err = new Error("Aluno nao encontrado");
  (err as Error & { statusCode: number }).statusCode = 404;
  return err;
};

const toAssessmentRow = (student: Student): AssessmentRow => ({
  studentId: student.id,
  studentName: student.name,
  evaluations: student.evaluations
});

const mergeEvaluations = (
  current: Record<Goal, EvaluationConcept>,
  patch: Record<string, EvaluationConcept>
): Record<Goal, EvaluationConcept> => {
  const base = { ...buildDefaultEvaluations(), ...current };

  for (const goal of GOALS) {
    const nextValue = patch[goal];
    if (nextValue) {
      base[goal] = nextValue;
    }
  }

  return base;
};

export const listAssessmentMatrix = async (): Promise<AssessmentMatrix> => {
  const students = normalizeStudents(await readStudents()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return {
    goals: [...GOALS],
    concepts: [...EVALUATION_CONCEPTS],
    rows: students.map((student) => toAssessmentRow(student))
  };
};

export const updateStudentAssessments = async (
  studentId: string,
  payload: unknown
): Promise<AssessmentRow> => {
  const parsed = updateAssessmentSchema.parse(payload);
  const students = normalizeStudents(await readStudents());
  const studentIndex = students.findIndex((student) => student.id === studentId);

  if (studentIndex < 0) {
    throw notFoundError();
  }

  const targetStudent = students[studentIndex];
  const mergedEvaluations = mergeEvaluations(targetStudent.evaluations, parsed.evaluations);
  const changedGoals = GOALS.filter((goal) => targetStudent.evaluations[goal] !== mergedEvaluations[goal]);

  const updatedStudent: Student = {
    ...targetStudent,
    evaluations: mergedEvaluations,
    updatedAt: new Date().toISOString()
  };

  students[studentIndex] = updatedStudent;
  await writeStudents(students);

  if (changedGoals.length > 0) {
    await queueStudentAssessmentDigestChanges({
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      studentEmail: targetStudent.email,
      classroomId: null,
      classroomName: "-",
      changes: changedGoals.map((goal) => ({
        goal,
        previousConcept: targetStudent.evaluations[goal],
        nextConcept: mergedEvaluations[goal]
      }))
    });
  }

  return toAssessmentRow(updatedStudent);
};
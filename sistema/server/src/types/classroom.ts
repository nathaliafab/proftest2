import { EvaluationConcept, Goal } from "./assessment";

export interface Classroom {
  id: string;
  topic: string;
  year: number;
  semester: number;
  studentIds: string[];
  studentEvaluations: Record<string, Record<Goal, EvaluationConcept>>;
  createdAt: string;
  updatedAt: string;
}

export interface ClassroomInput {
  topic: string;
  year: number;
  semester: number;
  studentIds: string[];
}

export interface ClassroomStudentView {
  studentId: string;
  studentName: string;
  evaluations: Record<Goal, EvaluationConcept>;
}

export interface ClassroomView {
  id: string;
  topic: string;
  year: number;
  semester: number;
  students: ClassroomStudentView[];
  createdAt: string;
  updatedAt: string;
}
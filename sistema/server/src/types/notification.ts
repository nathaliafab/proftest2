import { EvaluationConcept } from "./assessment";

export interface AssessmentChangeItem {
  classroomId: string | null;
  classroomName: string;
  goal: string;
  previousConcept: EvaluationConcept;
  nextConcept: EvaluationConcept;
}

export interface StudentDailyDigest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  date: string;
  items: AssessmentChangeItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SentDigestLog {
  studentId: string;
  studentEmail: string;
  date: string;
  subject: string;
  body: string;
  sentAt: string;
}

export interface Student {
  id: string;
  name: string;
  cpf: string;
  email: string;
  evaluations: Record<string, EvaluationConcept>;
  createdAt: string;
  updatedAt: string;
}

export interface StudentInput {
  name: string;
  cpf: string;
  email: string;
}

export type EvaluationConcept = "MANA" | "MPA" | "MA";

export interface AssessmentRow {
  studentId: string;
  studentName: string;
  evaluations: Record<string, EvaluationConcept>;
}

export interface AssessmentMatrix {
  goals: string[];
  concepts: EvaluationConcept[];
  rows: AssessmentRow[];
}
export const GOALS = ["Requisitos", "Testes", "Documentacao", "BoasPraticas"] as const;

export const EVALUATION_CONCEPTS = ["MANA", "MPA", "MA"] as const;

export type Goal = (typeof GOALS)[number];

export type EvaluationConcept = (typeof EVALUATION_CONCEPTS)[number];

export interface AssessmentRow {
  studentId: string;
  studentName: string;
  evaluations: Record<Goal, EvaluationConcept>;
}

export interface AssessmentMatrix {
  goals: Goal[];
  concepts: EvaluationConcept[];
  rows: AssessmentRow[];
}
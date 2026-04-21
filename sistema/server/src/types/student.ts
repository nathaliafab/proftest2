import { EvaluationConcept, Goal } from "./assessment";

export interface Student {
  id: string;
  name: string;
  cpf: string;
  email: string;
  evaluations: Record<Goal, EvaluationConcept>;
  createdAt: string;
  updatedAt: string;
}

export interface StudentInput {
  name: string;
  cpf: string;
  email: string;
}
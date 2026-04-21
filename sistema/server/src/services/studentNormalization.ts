import { EVALUATION_CONCEPTS, EvaluationConcept, GOALS, Goal } from "../types/assessment";
import { Student } from "../types/student";

type UnknownStudent = Omit<Student, "evaluations"> & {
  evaluations?: Partial<Record<Goal, EvaluationConcept>>;
};

const defaultConcept: EvaluationConcept = EVALUATION_CONCEPTS[0];

export const buildDefaultEvaluations = (): Record<Goal, EvaluationConcept> => {
  return GOALS.reduce(
    (acc, goal) => ({
      ...acc,
      [goal]: defaultConcept
    }),
    {} as Record<Goal, EvaluationConcept>
  );
};

export const normalizeStudent = (student: UnknownStudent): Student => {
  const baseEvaluations = buildDefaultEvaluations();
  const currentEvaluations = student.evaluations ?? {};

  const normalizedEvaluations = GOALS.reduce(
    (acc, goal) => ({
      ...acc,
      [goal]: EVALUATION_CONCEPTS.includes(currentEvaluations[goal] as EvaluationConcept)
        ? (currentEvaluations[goal] as EvaluationConcept)
        : baseEvaluations[goal]
    }),
    {} as Record<Goal, EvaluationConcept>
  );

  return {
    ...student,
    evaluations: normalizedEvaluations
  };
};

export const normalizeStudents = (students: UnknownStudent[]): Student[] => {
  return students.map((student) => normalizeStudent(student));
};
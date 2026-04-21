import {
  AssessmentMatrix,
  AssessmentRow,
  Classroom,
  ClassroomInput,
  EvaluationConcept,
  Student,
  StudentInput
} from "./types";

const baseUrl = process.env.REACT_APP_API_URL ?? "http://localhost:3001";

const parseError = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as { message?: string };
    return data.message ?? "Erro na requisicao";
  } catch {
    return "Erro na requisicao";
  }
};

export const getStudents = async (): Promise<Student[]> => {
  const response = await fetch(`${baseUrl}/students`);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as Student[];
};

export const createStudent = async (payload: StudentInput): Promise<Student> => {
  const response = await fetch(`${baseUrl}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as Student;
};

export const updateStudent = async (id: string, payload: StudentInput): Promise<Student> => {
  const response = await fetch(`${baseUrl}/students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as Student;
};

export const deleteStudent = async (id: string): Promise<void> => {
  const response = await fetch(`${baseUrl}/students/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }
};

export const getAssessmentMatrix = async (): Promise<AssessmentMatrix> => {
  const response = await fetch(`${baseUrl}/assessments`);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as AssessmentMatrix;
};

export const updateAssessmentRow = async (
  studentId: string,
  evaluations: Record<string, EvaluationConcept>
): Promise<AssessmentRow> => {
  const response = await fetch(`${baseUrl}/assessments/${studentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ evaluations })
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as AssessmentRow;
};

export const getClassrooms = async (): Promise<Classroom[]> => {
  const response = await fetch(`${baseUrl}/classrooms`);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as Classroom[];
};

export const getClassroomById = async (id: string): Promise<Classroom> => {
  const response = await fetch(`${baseUrl}/classrooms/${id}`);

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as Classroom;
};

export const createClassroom = async (payload: ClassroomInput): Promise<Classroom> => {
  const response = await fetch(`${baseUrl}/classrooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as Classroom;
};

export const updateClassroom = async (id: string, payload: ClassroomInput): Promise<Classroom> => {
  const response = await fetch(`${baseUrl}/classrooms/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as Classroom;
};

export const deleteClassroom = async (id: string): Promise<void> => {
  const response = await fetch(`${baseUrl}/classrooms/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }
};

export const updateClassroomStudentEvaluations = async (
  classroomId: string,
  studentId: string,
  evaluations: Record<string, EvaluationConcept>
): Promise<Classroom> => {
  const response = await fetch(`${baseUrl}/classrooms/${classroomId}/evaluations/${studentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ evaluations })
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as Classroom;
};
import { Student, StudentInput } from "./types";

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
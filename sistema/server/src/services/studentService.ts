import crypto from "crypto";
import { z } from "zod";
import { readStudents, writeStudents } from "../repositories/studentRepository";
import { Student, StudentInput } from "../types/student";

const normalizeCpf = (cpf: string): string => cpf.replace(/\D/g, "");

const studentInputSchema = z.object({
  name: z.string().trim().min(3, "Nome deve ter ao menos 3 caracteres"),
  cpf: z
    .string()
    .transform((value) => normalizeCpf(value))
    .refine((value) => /^\d{11}$/.test(value), "CPF deve conter 11 digitos"),
  email: z.string().trim().toLowerCase().email("Email invalido")
});

const duplicateError = (field: "cpf" | "email"): Error => {
  const err = new Error(`Ja existe aluno com este ${field}`);
  (err as Error & { statusCode: number }).statusCode = 409;
  return err;
};

const notFoundError = (): Error => {
  const err = new Error("Aluno nao encontrado");
  (err as Error & { statusCode: number }).statusCode = 404;
  return err;
};

export const listStudents = async (): Promise<Student[]> => {
  const students = await readStudents();
  return students.sort((a, b) => a.name.localeCompare(b.name));
};

export const createStudent = async (payload: StudentInput): Promise<Student> => {
  const parsed = studentInputSchema.parse(payload);
  const students = await readStudents();

  if (students.some((student) => student.cpf === parsed.cpf)) {
    throw duplicateError("cpf");
  }

  if (students.some((student) => student.email === parsed.email)) {
    throw duplicateError("email");
  }

  const now = new Date().toISOString();
  const newStudent: Student = {
    id: crypto.randomUUID(),
    name: parsed.name,
    cpf: parsed.cpf,
    email: parsed.email,
    createdAt: now,
    updatedAt: now
  };

  students.push(newStudent);
  await writeStudents(students);

  return newStudent;
};

export const updateStudent = async (id: string, payload: StudentInput): Promise<Student> => {
  const parsed = studentInputSchema.parse(payload);
  const students = await readStudents();
  const studentIndex = students.findIndex((student) => student.id === id);

  if (studentIndex < 0) {
    throw notFoundError();
  }

  if (students.some((student) => student.id !== id && student.cpf === parsed.cpf)) {
    throw duplicateError("cpf");
  }

  if (students.some((student) => student.id !== id && student.email === parsed.email)) {
    throw duplicateError("email");
  }

  const updated: Student = {
    ...students[studentIndex],
    name: parsed.name,
    cpf: parsed.cpf,
    email: parsed.email,
    updatedAt: new Date().toISOString()
  };

  students[studentIndex] = updated;
  await writeStudents(students);

  return updated;
};

export const deleteStudent = async (id: string): Promise<void> => {
  const students = await readStudents();
  const filteredStudents = students.filter((student) => student.id !== id);

  if (filteredStudents.length === students.length) {
    throw notFoundError();
  }

  await writeStudents(filteredStudents);
};
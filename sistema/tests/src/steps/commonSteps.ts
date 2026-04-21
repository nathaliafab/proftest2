import { Before, Given } from "@cucumber/cucumber";
import assert from "assert";
import axios, { AxiosInstance } from "axios";

export interface Student {
  id: string;
  name: string;
  cpf: string;
  email: string;
}

export interface AssessmentMatrix {
  goals: string[];
  concepts: string[];
  rows: Array<{
    studentId: string;
    studentName: string;
    evaluations: Record<string, string>;
  }>;
}

export interface Classroom {
  id: string;
  topic: string;
  year: number;
  semester: number;
  students: Array<{
    studentId: string;
    studentName: string;
    evaluations: Record<string, string>;
  }>;
}

export interface SentDigestLog {
  studentId: string;
  studentEmail: string;
  date: string;
  subject: string;
  body: string;
  sentAt: string;
}

export interface TestContext {
  api: AxiosInstance;
  students: Student[];
  createdStudent: Student | null;
  updatedStudent: Student | null;
  deleteTargetId: string | null;
  matrix: AssessmentMatrix | null;
  assessmentTargetId: string | null;
  secondStudentId: string | null;
  classroomId: string | null;
  classroom: Classroom | null;
  classrooms: Classroom[];
  lastStatusCode: number | null;
  forcedSendCount: number;
  sentDigests: SentDigestLog[];
}

export const context: TestContext = {
  api: axios.create({
    baseURL: process.env.API_URL ?? "http://server:3001",
    validateStatus: () => true
  }),
  students: [],
  createdStudent: null,
  updatedStudent: null,
  deleteTargetId: null,
  matrix: null,
  assessmentTargetId: null,
  secondStudentId: null,
  classroomId: null,
  classroom: null,
  classrooms: [],
  lastStatusCode: null,
  forcedSendCount: 0,
  sentDigests: []
};

const waitForServer = async (): Promise<void> => {
  const maxAttempts = 20;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await context.api.get("/health");
      if (response.status === 200) {
        return;
      }
    } catch {
      // Aguardando container do server iniciar.
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  }

  throw new Error("Servidor nao ficou disponivel para os testes");
};

const clearStudents = async (): Promise<void> => {
  const listResponse = await context.api.get<Student[]>("/students");
  for (const student of listResponse.data) {
    await context.api.delete(`/students/${student.id}`);
  }
};

const clearClassrooms = async (): Promise<void> => {
  const listResponse = await context.api.get<Classroom[]>("/classrooms");
  if (listResponse.status >= 400) {
    return;
  }

  for (const classroom of listResponse.data) {
    await context.api.delete(`/classrooms/${classroom.id}`);
  }
};

Before(async () => {
  await waitForServer();
  await clearClassrooms();
  await clearStudents();
  context.students = [];
  context.createdStudent = null;
  context.updatedStudent = null;
  context.deleteTargetId = null;
  context.matrix = null;
  context.assessmentTargetId = null;
  context.secondStudentId = null;
  context.classroomId = null;
  context.classroom = null;
  context.classrooms = [];
  context.lastStatusCode = null;
  context.forcedSendCount = 0;
  context.sentDigests = [];
});

Given("que nao existem alunos cadastrados", async () => {
  const response = await context.api.get<Student[]>("/students");
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.data.length, 0);
});

Given(
  "que existe um aluno com nome {string}, cpf {string} e email {string}",
  async (name: string, cpf: string, email: string) => {
    const response = await context.api.post<Student>("/students", { name, cpf, email });
    assert.strictEqual(response.status, 201);

    if (!context.createdStudent) {
      context.createdStudent = response.data;
      context.deleteTargetId = response.data.id;
      context.assessmentTargetId = response.data.id;
    } else {
      context.secondStudentId = response.data.id;
    }
  }
);

Given(
  "que existe uma turma com topico {string}, ano {int}, semestre {int} e o aluno cadastrado",
  async (topic: string, year: number, semester: number) => {
    assert.ok(context.createdStudent);

    const response = await context.api.post<Classroom>("/classrooms", {
      topic,
      year,
      semester,
      studentIds: [context.createdStudent.id]
    });

    assert.strictEqual(response.status, 201);
    context.classroomId = response.data.id;
    context.classroom = response.data;
  }
);
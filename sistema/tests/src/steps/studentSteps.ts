import { Given, When, Then, Before } from "@cucumber/cucumber";
import assert from "assert";
import axios, { AxiosInstance } from "axios";

interface Student {
  id: string;
  name: string;
  cpf: string;
  email: string;
}

interface TestContext {
  api: AxiosInstance;
  students: Student[];
  createdStudent: Student | null;
  updatedStudent: Student | null;
  deleteTargetId: string | null;
  lastStatusCode: number | null;
}

const context: TestContext = {
  api: axios.create({
    baseURL: process.env.API_URL ?? "http://server:3001",
    validateStatus: () => true
  }),
  students: [],
  createdStudent: null,
  updatedStudent: null,
  deleteTargetId: null,
  lastStatusCode: null
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

Before(async () => {
  await waitForServer();
  await clearStudents();
  context.students = [];
  context.createdStudent = null;
  context.updatedStudent = null;
  context.deleteTargetId = null;
  context.lastStatusCode = null;
});

Given("que nao existem alunos cadastrados", async () => {
  const response = await context.api.get<Student[]>("/students");
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.data.length, 0);
});

When(
  "eu cadastro um aluno com nome {string}, cpf {string} e email {string}",
  async (name: string, cpf: string, email: string) => {
    const response = await context.api.post<Student>("/students", { name, cpf, email });
    assert.strictEqual(response.status, 201);
    context.createdStudent = response.data;

    const listResponse = await context.api.get<Student[]>("/students");
    context.students = listResponse.data;
  }
);

Then("devo encontrar {int} aluno cadastrado", (count: number) => {
  assert.strictEqual(context.students.length, count);
});

Then("o aluno deve possuir nome {string}", (name: string) => {
  assert.ok(context.students.some((student) => student.name === name));
});

Given(
  "que existe um aluno com nome {string}, cpf {string} e email {string}",
  async (name: string, cpf: string, email: string) => {
    const response = await context.api.post<Student>("/students", { name, cpf, email });
    assert.strictEqual(response.status, 201);
    context.createdStudent = response.data;
    context.deleteTargetId = response.data.id;
  }
);

When(
  "eu altero esse aluno para nome {string}, cpf {string} e email {string}",
  async (name: string, cpf: string, email: string) => {
    assert.ok(context.createdStudent);
    const response = await context.api.put<Student>(`/students/${context.createdStudent.id}`, {
      name,
      cpf,
      email
    });
    assert.strictEqual(response.status, 200);
    context.updatedStudent = response.data;
  }
);

Then("o aluno alterado deve possuir nome {string}", (name: string) => {
  assert.ok(context.updatedStudent);
  assert.strictEqual(context.updatedStudent.name, name);
});

Then("o aluno alterado deve possuir email {string}", (email: string) => {
  assert.ok(context.updatedStudent);
  assert.strictEqual(context.updatedStudent.email, email);
});

When("eu removo esse aluno", async () => {
  assert.ok(context.deleteTargetId);
  const response = await context.api.delete(`/students/${context.deleteTargetId}`);
  assert.strictEqual(response.status, 204);
});

Then("nao devo encontrar o aluno removido na lista", async () => {
  const response = await context.api.get<Student[]>("/students");
  assert.strictEqual(response.status, 200);
  assert.ok(context.deleteTargetId);
  assert.ok(!response.data.some((student) => student.id === context.deleteTargetId));
});

When("eu tento cadastrar um aluno com email invalido", async () => {
  const response = await context.api.post("/students", {
    name: "Teste Invalido",
    cpf: "11222333444",
    email: "email-invalido"
  });

  if (response.status < 400) {
    throw new Error("Era esperado erro de validacao para email invalido");
  }

  context.lastStatusCode = response.status;
});

Then("devo receber erro de validacao", () => {
  assert.strictEqual(context.lastStatusCode, 400);
});
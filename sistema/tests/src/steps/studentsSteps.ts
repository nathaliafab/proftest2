import { Then, When } from "@cucumber/cucumber";
import assert from "assert";
import { Student, context } from "./commonSteps";

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

When(
  "eu tento cadastrar outro aluno com mesmo cpf {string} e email {string}",
  async (cpf: string, email: string) => {
    const response = await context.api.post("/students", {
      name: "Aluno Duplicado",
      cpf,
      email
    });

    if (response.status < 400) {
      throw new Error("Era esperado erro de conflito para CPF duplicado");
    }

    context.lastStatusCode = response.status;
  }
);

Then("devo receber erro de validacao", () => {
  assert.strictEqual(context.lastStatusCode, 400);
});

Then("devo receber erro de conflito", () => {
  assert.strictEqual(context.lastStatusCode, 409);
});
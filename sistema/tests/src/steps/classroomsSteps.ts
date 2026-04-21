import { Then, When } from "@cucumber/cucumber";
import assert from "assert";
import { Classroom, context } from "./commonSteps";

When(
  "eu cadastro uma turma com topico {string}, ano {int}, semestre {int} e os alunos cadastrados",
  async (topic: string, year: number, semester: number) => {
    assert.ok(context.createdStudent);
    assert.ok(context.secondStudentId);

    const response = await context.api.post<Classroom>("/classrooms", {
      topic,
      year,
      semester,
      studentIds: [context.createdStudent.id, context.secondStudentId]
    });

    assert.strictEqual(response.status, 201);
    context.classroomId = response.data.id;
    context.classroom = response.data;
  }
);

Then("devo encontrar a turma {string} na lista de turmas", async (topic: string) => {
  const response = await context.api.get<Classroom[]>("/classrooms");
  assert.strictEqual(response.status, 200);
  context.classrooms = response.data;
  assert.ok(response.data.some((classroom) => classroom.topic === topic));
});

Then("devo visualizar {int} alunos na turma selecionada", async (count: number) => {
  assert.ok(context.classroomId);
  const response = await context.api.get<Classroom>(`/classrooms/${context.classroomId}`);
  assert.strictEqual(response.status, 200);
  context.classroom = response.data;
  assert.strictEqual(response.data.students.length, count);
});

When(
  "eu altero a turma para topico {string}, ano {int} e semestre {int}",
  async (topic: string, year: number, semester: number) => {
    assert.ok(context.classroomId);
    assert.ok(context.createdStudent);

    const response = await context.api.put<Classroom>(`/classrooms/${context.classroomId}`, {
      topic,
      year,
      semester,
      studentIds: [context.createdStudent.id]
    });

    assert.strictEqual(response.status, 200);
    context.classroom = response.data;
  }
);

Then("a turma alterada deve possuir topico {string}", (topic: string) => {
  assert.ok(context.classroom);
  assert.strictEqual(context.classroom.topic, topic);
});

Then("a turma alterada deve possuir semestre {int}", (semester: number) => {
  assert.ok(context.classroom);
  assert.strictEqual(context.classroom.semester, semester);
});

When("eu removo a turma cadastrada", async () => {
  assert.ok(context.classroomId);
  const response = await context.api.delete(`/classrooms/${context.classroomId}`);
  assert.strictEqual(response.status, 204);
});

Then("nao devo encontrar a turma removida na lista", async () => {
  const response = await context.api.get<Classroom[]>("/classrooms");
  assert.strictEqual(response.status, 200);
  assert.ok(context.classroomId);
  assert.ok(!response.data.some((classroom) => classroom.id === context.classroomId));
});

When(
  "eu atualizo na turma a avaliacao do aluno na meta {string} para {string}",
  async (goal: string, concept: string) => {
    assert.ok(context.classroomId);
    assert.ok(context.createdStudent);

    const classroomResponse = await context.api.get<Classroom>(`/classrooms/${context.classroomId}`);
    assert.strictEqual(classroomResponse.status, 200);
    const studentRow = classroomResponse.data.students.find(
      (student) => student.studentId === context.createdStudent?.id
    );
    assert.ok(studentRow);

    const response = await context.api.put<Classroom>(
      `/classrooms/${context.classroomId}/evaluations/${context.createdStudent.id}`,
      {
        evaluations: {
          ...studentRow.evaluations,
          [goal]: concept
        }
      }
    );

    assert.strictEqual(response.status, 200);
    context.classroom = response.data;
  }
);

Then(
  "a avaliacao da turma para esse aluno na meta {string} deve ser {string}",
  async (goal: string, concept: string) => {
    assert.ok(context.classroomId);
    assert.ok(context.createdStudent);

    const response = await context.api.get<Classroom>(`/classrooms/${context.classroomId}`);
    assert.strictEqual(response.status, 200);

    const studentRow = response.data.students.find(
      (student) => student.studentId === context.createdStudent?.id
    );

    assert.ok(studentRow);
    assert.strictEqual(studentRow.evaluations[goal], concept);
  }
);

When("eu tento cadastrar turma com aluno inexistente", async () => {
  const response = await context.api.post<Classroom>("/classrooms", {
    topic: "Turma Invalida",
    year: 2026,
    semester: 1,
    studentIds: ["aluno-inexistente"]
  });

  if (response.status < 400) {
    throw new Error("Era esperado erro de validacao para aluno inexistente na turma");
  }

  context.lastStatusCode = response.status;
});

Then("devo receber erro de validacao da turma", () => {
  assert.strictEqual(context.lastStatusCode, 400);
});
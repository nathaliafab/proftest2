import { Given, Then, When } from "@cucumber/cucumber";
import assert from "assert";
import { AssessmentMatrix, Classroom, SentDigestLog, context } from "./commonSteps";

When("eu consulto a matriz de avaliacoes", async () => {
  const response = await context.api.get<AssessmentMatrix>("/assessments");
  assert.strictEqual(response.status, 200);
  context.matrix = response.data;
});

Then("devo ver a meta {string} na matriz", (goal: string) => {
  assert.ok(context.matrix);
  assert.ok(context.matrix.goals.includes(goal));
});

Then("a matriz deve conter o aluno {string}", (studentName: string) => {
  assert.ok(context.matrix);
  assert.ok(context.matrix.rows.some((row) => row.studentName === studentName));
});

When(
  "eu atualizo a avaliacao desse aluno na meta {string} para {string}",
  async (goal: string, concept: string) => {
    assert.ok(context.assessmentTargetId);

    const matrixResponse = await context.api.get<AssessmentMatrix>("/assessments");
    assert.strictEqual(matrixResponse.status, 200);
    const row = matrixResponse.data.rows.find(
      (item) => item.studentId === context.assessmentTargetId
    );
    assert.ok(row);

    const response = await context.api.put(`/assessments/${context.assessmentTargetId}`, {
      evaluations: {
        ...row.evaluations,
        [goal]: concept
      }
    });

    assert.strictEqual(response.status, 200);
  }
);

Then("a avaliacao desse aluno na meta {string} deve ser {string}", async (goal: string, concept: string) => {
  assert.ok(context.assessmentTargetId);

  const response = await context.api.get<AssessmentMatrix>("/assessments");
  assert.strictEqual(response.status, 200);
  const row = response.data.rows.find((item) => item.studentId === context.assessmentTargetId);

  assert.ok(row);
  assert.strictEqual(row.evaluations[goal], concept);
});

When(
  "eu tento atualizar a avaliacao desse aluno na meta {string} para conceito invalido",
  async (goal: string) => {
    assert.ok(context.assessmentTargetId);

    const matrixResponse = await context.api.get<AssessmentMatrix>("/assessments");
    assert.strictEqual(matrixResponse.status, 200);
    const row = matrixResponse.data.rows.find(
      (item) => item.studentId === context.assessmentTargetId
    );
    assert.ok(row);

    const response = await context.api.put(`/assessments/${context.assessmentTargetId}`, {
      evaluations: {
        ...row.evaluations,
        [goal]: "INVALIDO"
      }
    });

    if (response.status < 400) {
      throw new Error("Era esperado erro de validacao para conceito invalido");
    }

    context.lastStatusCode = response.status;
  }
);

Then("devo receber erro de validacao na avaliacao", () => {
  assert.strictEqual(context.lastStatusCode, 400);
});

Given("que existem turmas {string} e {string} para esse aluno", async (firstTopic: string, secondTopic: string) => {
  assert.ok(context.createdStudent);

  const firstResponse = await context.api.post<Classroom>("/classrooms", {
    topic: firstTopic,
    year: 2026,
    semester: 1,
    studentIds: [context.createdStudent.id]
  });

  assert.strictEqual(firstResponse.status, 201);

  const secondResponse = await context.api.post<Classroom>("/classrooms", {
    topic: secondTopic,
    year: 2026,
    semester: 2,
    studentIds: [context.createdStudent.id]
  });

  assert.strictEqual(secondResponse.status, 201);
});

When(
  "eu atualizo na turma {string} a avaliacao desse aluno na meta {string} para {string}",
  async (topic: string, goal: string, concept: string) => {
    assert.ok(context.createdStudent);

    const listResponse = await context.api.get<Classroom[]>("/classrooms");
    assert.strictEqual(listResponse.status, 200);

    const classroom = listResponse.data.find((item) => item.topic === topic);
    assert.ok(classroom);

    const studentRow = classroom.students.find(
      (student) => student.studentId === context.createdStudent?.id
    );
    assert.ok(studentRow);

    const updateResponse = await context.api.put<Classroom>(
      `/classrooms/${classroom.id}/evaluations/${context.createdStudent.id}`,
      {
        evaluations: {
          ...studentRow.evaluations,
          [goal]: concept
        }
      }
    );

    assert.strictEqual(updateResponse.status, 200);
  }
);

When("eu forco o envio do email de avaliacoes desse aluno", async () => {
  assert.ok(context.createdStudent);
  const response = await context.api.post<{ sentCount: number }>(
    `/notifications/force-send/${context.createdStudent.id}`
  );
  assert.strictEqual(response.status, 200);
  context.forcedSendCount = response.data.sentCount;

  const sentResponse = await context.api.get<SentDigestLog[]>(
    `/notifications/sent/${context.createdStudent.id}`
  );
  assert.strictEqual(sentResponse.status, 200);
  context.sentDigests = sentResponse.data;
});

Then("devo receber confirmacao de envio forcado com pelo menos 1 email", () => {
  assert.ok(context.forcedSendCount >= 1);
});

Then("deve existir {int} email enviado para esse aluno", (count: number) => {
  assert.strictEqual(context.sentDigests.length, count);
});

Then("o ultimo email enviado deve conter a meta {string}", (goal: string) => {
  assert.ok(context.sentDigests.length > 0);
  const last = context.sentDigests[context.sentDigests.length - 1];
  assert.ok(last.body.includes(goal));
});

Then("o ultimo email enviado deve conter a turma {string}", (topic: string) => {
  assert.ok(context.sentDigests.length > 0);
  const last = context.sentDigests[context.sentDigests.length - 1];
  assert.ok(last.body.includes(topic));
});

Then("devo receber confirmacao de que nao havia emails pendentes", () => {
  assert.strictEqual(context.forcedSendCount, 0);
});
import { Given, When, Then, Before } from "@cucumber/cucumber";
import assert from "assert";
import axios, { AxiosInstance } from "axios";

interface Student {
  id: string;
  name: string;
  cpf: string;
  email: string;
}

interface AssessmentMatrix {
  goals: string[];
  concepts: string[];
  rows: Array<{
    studentId: string;
    studentName: string;
    evaluations: Record<string, string>;
  }>;
}

interface Classroom {
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

interface SentDigestLog {
  studentId: string;
  studentEmail: string;
  date: string;
  subject: string;
  body: string;
  sentAt: string;
}

interface TestContext {
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
  backendClassroomId: string | null;
  frontendClassroomId: string | null;
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
  matrix: null,
  assessmentTargetId: null,
  secondStudentId: null,
  classroomId: null,
  classroom: null,
  classrooms: [],
  lastStatusCode: null,
  forcedSendCount: 0,
  sentDigests: [],
  backendClassroomId: null,
  frontendClassroomId: null
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
  context.backendClassroomId = null;
  context.frontendClassroomId = null;
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

    if (!context.createdStudent) {
      context.createdStudent = response.data;
      context.deleteTargetId = response.data.id;
      context.assessmentTargetId = response.data.id;
    } else {
      context.secondStudentId = response.data.id;
    }
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

Given("que existem turmas {string} e {string} para esse aluno", async (firstTopic: string, secondTopic: string) => {
  assert.ok(context.createdStudent);

  const firstResponse = await context.api.post<Classroom>("/classrooms", {
    topic: firstTopic,
    year: 2026,
    semester: 1,
    studentIds: [context.createdStudent.id]
  });

  assert.strictEqual(firstResponse.status, 201);
  context.backendClassroomId = firstResponse.data.id;

  const secondResponse = await context.api.post<Classroom>("/classrooms", {
    topic: secondTopic,
    year: 2026,
    semester: 2,
    studentIds: [context.createdStudent.id]
  });

  assert.strictEqual(secondResponse.status, 201);
  context.frontendClassroomId = secondResponse.data.id;
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

Then("o ultimo email enviado deve conter a turma {string}", (topic: string) => {
  assert.ok(context.sentDigests.length > 0);
  const last = context.sentDigests[context.sentDigests.length - 1];
  assert.ok(last.body.includes(topic));
});
import crypto from "crypto";
import nodemailer from "nodemailer";
import { EvaluationConcept } from "../types/assessment";
import {
  appendSentDigestLog,
  readPendingDigests,
  readSentDigests,
  writePendingDigests
} from "../repositories/notificationRepository";
import { AssessmentChangeItem, SentDigestLog, StudentDailyDigest } from "../types/notification";

interface QueueInput {
  studentId: string;
  studentName: string;
  studentEmail: string;
  classroomId: string | null;
  classroomName: string;
  goal: string;
  previousConcept: EvaluationConcept;
  nextConcept: EvaluationConcept;
}

interface BulkQueueInput {
  studentId: string;
  studentName: string;
  studentEmail: string;
  classroomId: string | null;
  classroomName: string;
  changes: Array<{
    goal: string;
    previousConcept: EvaluationConcept;
    nextConcept: EvaluationConcept;
  }>;
}

const digestDate = (date: Date): string => date.toISOString().slice(0, 10);

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

let cachedTransporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const mockMode = process.env.SMTP_MOCK === "true";

  if (mockMode) {
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true
    });
    return cachedTransporter;
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("SMTP_USER e SMTP_PASS devem ser configurados no ambiente");
  }

  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass
    }
  });

  return cachedTransporter;
};

const composeDigest = (digest: StudentDailyDigest): { subject: string; body: string } => {
  const grouped = digest.items.reduce(
    (acc, item) => {
      const key = item.classroomName;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, AssessmentChangeItem[]>
  );

  const lines: string[] = [
    `Ola, ${digest.studentName}.`,
    "",
    `Resumo diario de avaliacoes atualizadas em ${digest.date}:`,
    ""
  ];

  const classroomNames = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  if (classroomNames.length === 0) {
    lines.push("Nenhuma alteracao de avaliacao foi consolidada para este periodo.");
    lines.push("");
  }

  for (const classroomName of classroomNames) {
    lines.push(`Turma: ${classroomName}`);

    const items = grouped[classroomName].sort((a, b) => a.goal.localeCompare(b.goal));
    for (const item of items) {
      lines.push(`- ${item.goal}: ${item.previousConcept} -> ${item.nextConcept}`);
    }

    lines.push("");
  }

  lines.push("Atenciosamente,");
  lines.push("Equipe Academica");

  return {
    subject: `Resumo diario de avaliacoes - ${digest.date}`,
    body: lines.join("\n")
  };
};

const textToHtml = (text: string): string => {
  const safe = escapeHtml(text).replace(/\n/g, "<br />");
  return `<div style=\"font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;\">${safe}</div>`;
};

const sendEmail = async (to: string, subject: string, body: string): Promise<void> => {
  const mockMode = process.env.SMTP_MOCK === "true";
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? (mockMode ? "mock@sistema.local" : undefined);

  if (!from) {
    throw new Error("SMTP_FROM ou SMTP_USER deve ser configurado no ambiente");
  }

  await getTransporter().sendMail({
    from,
    to,
    subject,
    text: body,
    html: textToHtml(body)
  });
};

const upsertDigestItem = (digest: StudentDailyDigest, input: QueueInput): StudentDailyDigest => {
  const existingIndex = digest.items.findIndex(
    (item) => item.classroomId === input.classroomId && item.goal === input.goal
  );

  const nextItem: AssessmentChangeItem = {
    classroomId: input.classroomId,
    classroomName: input.classroomName,
    goal: input.goal,
    previousConcept:
      existingIndex >= 0 ? digest.items[existingIndex].previousConcept : input.previousConcept,
    nextConcept: input.nextConcept
  };

  if (existingIndex >= 0) {
    digest.items[existingIndex] = nextItem;
  } else {
    digest.items.push(nextItem);
  }

  return {
    ...digest,
    updatedAt: new Date().toISOString()
  };
};

const queueSingleChange = async (input: QueueInput): Promise<void> => {
  if (input.previousConcept === input.nextConcept) {
    return;
  }

  const currentDate = digestDate(new Date());
  const digests = await readPendingDigests();

  const digestIndex = digests.findIndex(
    (digest) => digest.studentId === input.studentId && digest.date === currentDate
  );

  if (digestIndex < 0) {
    const now = new Date().toISOString();
    digests.push(
      upsertDigestItem(
        {
          id: crypto.randomUUID(),
          studentId: input.studentId,
          studentName: input.studentName,
          studentEmail: input.studentEmail,
          date: currentDate,
          items: [],
          createdAt: now,
          updatedAt: now
        },
        input
      )
    );
  } else {
    digests[digestIndex] = upsertDigestItem(digests[digestIndex], input);
  }

  await writePendingDigests(digests);
};

export const queueStudentAssessmentDigestChanges = async (
  input: BulkQueueInput
): Promise<void> => {
  for (const change of input.changes) {
    await queueSingleChange({
      studentId: input.studentId,
      studentName: input.studentName,
      studentEmail: input.studentEmail,
      classroomId: input.classroomId,
      classroomName: input.classroomName,
      goal: change.goal,
      previousConcept: change.previousConcept,
      nextConcept: change.nextConcept
    });
  }
};

const sendDigest = async (digest: StudentDailyDigest): Promise<void> => {
  const message = composeDigest(digest);
  await sendEmail(digest.studentEmail, message.subject, message.body);

  await appendSentDigestLog({
    studentId: digest.studentId,
    studentEmail: digest.studentEmail,
    date: digest.date,
    subject: message.subject,
    body: message.body,
    sentAt: new Date().toISOString()
  });
};

export const flushDueDailyAssessmentDigests = async (): Promise<void> => {
  const today = digestDate(new Date());
  const digests = await readPendingDigests();

  const dueDigests = digests.filter((digest) => digest.date < today);
  const futureOrToday = digests.filter((digest) => digest.date >= today);

  const failedIds = new Set<string>();

  for (const digest of dueDigests) {
    try {
      await sendDigest(digest);
    } catch {
      failedIds.add(digest.id);
    }
  }

  const remainingDue = dueDigests.filter((digest) => failedIds.has(digest.id));
  await writePendingDigests([...futureOrToday, ...remainingDue]);
};

export const forceSendStudentDigests = async (
  studentId: string
): Promise<{ sentCount: number }> => {
  const digests = await readPendingDigests();
  const targetDigests = digests.filter((digest) => digest.studentId === studentId);

  if (targetDigests.length === 0) {
    return { sentCount: 0 };
  }

  const failedIds = new Set<string>();

  for (const digest of targetDigests) {
    try {
      await sendDigest(digest);
    } catch {
      failedIds.add(digest.id);
    }
  }

  const remaining = digests.filter((digest) => {
    if (digest.studentId !== studentId) {
      return true;
    }

    return failedIds.has(digest.id);
  });

  await writePendingDigests(remaining);

  return { sentCount: targetDigests.length - failedIds.size };
};

export const listSentDigestsByStudent = async (studentId: string): Promise<SentDigestLog[]> => {
  const sent = await readSentDigests();
  return sent.filter((item) => item.studentId === studentId);
};

export const startDailyDigestScheduler = (): void => {
  const intervalMs = Number(process.env.DIGEST_DISPATCH_INTERVAL_MS ?? 60000);

  void flushDueDailyAssessmentDigests();

  setInterval(() => {
    void flushDueDailyAssessmentDigests();
  }, intervalMs);
};

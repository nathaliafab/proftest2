import { promises as fs } from "fs";
import path from "path";
import { SentDigestLog, StudentDailyDigest } from "../types/notification";

const dataDirectory = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), "data");

const pendingDigestsPath = path.join(dataDirectory, "pending-digests.json");
const sentDigestsPath = path.join(dataDirectory, "sent-digests.json");

const ensureDataFile = async (filePath: string): Promise<void> => {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "[]", "utf-8");
  }
};

export const readPendingDigests = async (): Promise<StudentDailyDigest[]> => {
  await ensureDataFile(pendingDigestsPath);
  const content = await fs.readFile(pendingDigestsPath, "utf-8");
  return JSON.parse(content) as StudentDailyDigest[];
};

export const writePendingDigests = async (digests: StudentDailyDigest[]): Promise<void> => {
  await ensureDataFile(pendingDigestsPath);
  await fs.writeFile(pendingDigestsPath, JSON.stringify(digests, null, 2), "utf-8");
};

export const appendSentDigestLog = async (entry: SentDigestLog): Promise<void> => {
  await ensureDataFile(sentDigestsPath);
  const content = await fs.readFile(sentDigestsPath, "utf-8");
  const current = JSON.parse(content) as SentDigestLog[];
  current.push(entry);
  await fs.writeFile(sentDigestsPath, JSON.stringify(current, null, 2), "utf-8");
};

export const readSentDigests = async (): Promise<SentDigestLog[]> => {
  await ensureDataFile(sentDigestsPath);
  const content = await fs.readFile(sentDigestsPath, "utf-8");
  return JSON.parse(content) as SentDigestLog[];
};

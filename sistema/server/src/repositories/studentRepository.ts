import { promises as fs } from "fs";
import path from "path";
import { Student } from "../types/student";

const dataDirectory = path.resolve(process.cwd(), "data");
const dataFilePath = path.join(dataDirectory, "students.json");

const ensureDataFile = async (): Promise<void> => {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.writeFile(dataFilePath, "[]", "utf-8");
  }
};

export const readStudents = async (): Promise<Student[]> => {
  await ensureDataFile();
  const content = await fs.readFile(dataFilePath, "utf-8");
  return JSON.parse(content) as Student[];
};

export const writeStudents = async (students: Student[]): Promise<void> => {
  await ensureDataFile();
  await fs.writeFile(dataFilePath, JSON.stringify(students, null, 2), "utf-8");
};
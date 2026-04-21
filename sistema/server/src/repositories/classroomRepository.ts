import { promises as fs } from "fs";
import path from "path";
import { Classroom } from "../types/classroom";

const dataDirectory = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(process.cwd(), "data");
const dataFilePath = path.join(dataDirectory, "classes.json");

const ensureDataFile = async (): Promise<void> => {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.writeFile(dataFilePath, "[]", "utf-8");
  }
};

export const readClassrooms = async (): Promise<Classroom[]> => {
  await ensureDataFile();
  const content = await fs.readFile(dataFilePath, "utf-8");
  return JSON.parse(content) as Classroom[];
};

export const writeClassrooms = async (classrooms: Classroom[]): Promise<void> => {
  await ensureDataFile();
  await fs.writeFile(dataFilePath, JSON.stringify(classrooms, null, 2), "utf-8");
};
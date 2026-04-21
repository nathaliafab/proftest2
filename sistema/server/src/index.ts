import cors from "cors";
import express from "express";
import studentRoutes from "./routes/studentRoutes";
import assessmentRoutes from "./routes/assessmentRoutes";
import classroomRoutes from "./routes/classroomRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { startDailyDigestScheduler } from "./services/notificationService";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/students", studentRoutes);
app.use("/assessments", assessmentRoutes);
app.use("/classrooms", classroomRoutes);
app.use("/notifications", notificationRoutes);

app.use(errorHandler);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${port}`);
});

startDailyDigestScheduler();
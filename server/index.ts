import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { loadAuth } from "./middleware/auth";
import authRouter from "./routers/auth";
import departmentsRouter from "./routers/departments";
import spacesRouter from "./routers/spaces";
import knowledgeRouter from "./routers/knowledge";
import permissionsRouter from "./routers/permissions";
import reviewRouter from "./routers/review";
import nextcloudRouter from "./routers/nextcloud";
import graphRouter from "./routers/graph";
import notificationsRouter from "./routers/notifications";
import favoritesRouter from "./routers/favorites";
import historyRouter from "./routers/history";
import usersRouter from "./routers/users";

const app = express();
const PORT = 3002;

app.use(express.json());
app.use(cookieParser());
app.use(loadAuth);

app.use("/api", authRouter);
app.use("/api", departmentsRouter);
app.use("/api", spacesRouter);
app.use("/api", knowledgeRouter);
app.use("/api", permissionsRouter);
app.use("/api", reviewRouter);
app.use("/api", nextcloudRouter);
app.use("/api", graphRouter);
app.use("/api", notificationsRouter);
app.use("/api", favoritesRouter);
app.use("/api", historyRouter);
app.use("/api", usersRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "knowledge-platform" });
});

app.listen(PORT, () => {
  console.log(`[knowledge-platform] API server running on http://localhost:${PORT}`);
});

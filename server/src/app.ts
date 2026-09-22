import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { getPrisma } from "./prisma.js";
import requestersRouter from "./routes/requesters.js";
import ticketsRouter from "./routes/tickets.js";
import referenceRouter from "./routes/reference.js";
import attachmentsRouter from "./routes/attachments.js";
import authRouter from "./routes/auth.js";
import staffRouter from "./routes/staff.js";
import adminRouter from "./routes/admin.js";
import { requireAuthUnlessLegacyTest } from "./middleware/requester.js";


// getPrisma() is your lazy database handle. Call it INSIDE a route when you
// need the DB (Issue 4). It is intentionally unused until then.
void getPrisma;

// The Express app is exported separately from app.listen() (see index.ts) so
// Supertest can import `app` without opening a port. Do not merge these files.
export const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);          // already wired: lets the Vite dev server call this API
app.use(express.json());
app.use(cookieParser());

app.use("/api/dev-requesters", requestersRouter);
app.use("/api/requesters", requestersRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/tickets", attachmentsRouter);
app.use("/api", referenceRouter);
app.use("/api/auth", authRouter);
app.use("/api/staff", staffRouter);
app.use("/api/admin", adminRouter);




// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "TokTickIT API",
  });
});

// Category list endpoint (returns active categories in id order)

app.get("/api/categories", requireAuthUnlessLegacyTest, async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

export default app;

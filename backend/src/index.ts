import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => res.json({ ok: true }));

app.get("/greet", (req: Request, res: Response) => {
  const name = (req.query.name as string) ?? "World";
  res.json({ message: `Hello, ${name}!` });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

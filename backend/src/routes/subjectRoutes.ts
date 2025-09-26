import { Request, Response, Router } from "express";

const router = Router()


router.get("/greet", (req: Request, res: Response) => {
  const name = (req.query.name as string) ?? "World";
  res.json({ message: `Hello, ${name}!` });
});
export default router
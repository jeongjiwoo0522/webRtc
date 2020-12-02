import { Router, Request, Response } from "express";
import { v4 } from "uuid";

const router: Router = Router();

router.get("/", (req: Request, res: Response) => {
  res.redirect(`/${v4()}`);
});

export default router;
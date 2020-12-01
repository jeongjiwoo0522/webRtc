import express, { Request, Response, NextFunction} from "express";
import path from "path";
import morgan from "morgan";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "express-session";
import nunjucks from "nunjucks";
import * as dotenv from "dotenv";
import ColorHash from "color-hash";

import webSocket from "./socket";
import connect from "./models";
import httpError from "./httpError";
import indexRouter from "./routes";
import { BusinessLogic } from "./BusinessLogic";

const app: express.Application = express();

dotenv.config();

app.set("port", "8005");
app.set("view engine", "html");
nunjucks.configure("views", {
  express: app,
  watch: true,
});
connect();

const useColorHashMiddleware: BusinessLogic = (req, res, next) => {
  if(!req.session.color) {
    const colorHash = new ColorHash();
    req.session.color = colorHash.hex(req.sessionID);
  }
  next();
}

const sessionMiddleware: BusinessLogic = session({
  secret: process.env.COOKIE_SECRET!,
  resave: false,
  saveUninitialized: false
});

app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/gif", express.static(path.join(__dirname, "uploads")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(sessionMiddleware);
app.use(useColorHashMiddleware);

app.use("/", indexRouter);

app.use((req: Request, res: Response, next: NextFunction) => {
  const err = new httpError(404, `${req.method} ${req.url} 라우터가 없습니다`);
  next(err);
});

app.use((err: httpError, req: Request, res: Response, next: NextFunction) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status);
});

const server = app.listen(app.get("port"), () => {
  console.log("server on ", app.get("port"));
});

webSocket(server, app, sessionMiddleware);
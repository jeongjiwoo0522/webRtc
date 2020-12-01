import express from "express";
import { BusinessLogic } from "../BusinessLogic";
import errorHandler from "./errorHandler";
import * as indexRouter from "../controller";
import upload from "./gituploads";

const router: express.Router = express.Router();

const mainPageRouter: BusinessLogic = errorHandler(indexRouter.mainPage);
const viewRoomPageRouter: BusinessLogic = errorHandler(indexRouter.viewRoomPage);
const makeRoomRouter: BusinessLogic = errorHandler(indexRouter.makeRoom);
const joinRoomRouter: BusinessLogic = errorHandler(indexRouter.joinRoom);
const deleteRoomRouter: BusinessLogic = errorHandler(indexRouter.deleteRoom);
const addChatRouter: BusinessLogic = errorHandler(indexRouter.addChat);
const addGitChatRouter: BusinessLogic = errorHandler(indexRouter.addGitChat);
const webRtcRouter: BusinessLogic = errorHandler(indexRouter.webRtc);

router.get("/", mainPageRouter);
router.get("/room", viewRoomPageRouter);
router.post("/room", makeRoomRouter);
router.get("/room/:id", joinRoomRouter);
router.delete("/room/:id", deleteRoomRouter);
router.post("/room/:id/chat", addChatRouter);
router.post("/room/:id/gif", upload.single("gif"), addGitChatRouter);
router.get("/webrtc", webRtcRouter);

export default router;
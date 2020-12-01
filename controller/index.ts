import { BusinessLogic } from "../BusinessLogic";

import Room from "../models/room";
import Chat from "../models/chat";

const mainPage: BusinessLogic = async (req, res, next) => {
  const rooms = await Room.find({});
  res.render("main", { rooms, title: "GIF 채팅방" });
};

const viewRoomPage: BusinessLogic = (req, res, next) => {
  res.render("room", { title: "GIT 채팅방 생성" });
};

const makeRoom: BusinessLogic = async (req, res, next) => {
  const newRoom = await Room.create({
    title: req.body.title,
    max: req.body.max,
    owner: req.session.color,
    password: req.body.password,
  });
  const io = req.app.get("io");
  io.of("/room").emit("newRoom", newRoom);
  res.redirect(`/room/${newRoom._id}?password=${req.body.password}`);
}

const joinRoom: BusinessLogic = async (req, res, next) => {
  const room: any = await Room.findOne({ _id: req.params.id });
  const io = req.app.get("io");
  if(!room) {
    return res.redirect("/?error=존재하지 않는 방입니다.");
  } 
  if(room.password && room.password !== req.query.password) {
    return res.redirect("/?error=비밀번호가 틀렸습니다.");
  }
  const { rooms } = io.of("/chat").adapter;
  if(rooms && rooms[req.params.id] && room.max <= rooms[req.params.id].length) {
    return res.redirect("/?error=허용 인원을 초과했습니다.");
  }
  const chats = await Chat.find({ room: room._id }).sort("createdAt");
  return res.render("chat", {
    room,
    title: room.title,
    chats,
    user: req.session.color,
  });
}

const deleteRoom: BusinessLogic = async (req, res, next) => {
  await Room.remove({ _id: req.params.id });
  await Chat.remove({ room: req.params.id });
  res.send("ok");
  setTimeout(() => {
    req.app.get("io").of("/room").emit("removeRoom", req.params.id);
  }, 2000);
}

const addChat: BusinessLogic = async (req, res, next) => {
  const chat = await Chat.create({
    room: req.params.id,
    user: req.session.color,
    chat: req.body.chat,
  });
  req.app.get("io").of("/chat").to(req.params.id).emit("chat", chat);
  res.send("ok");
}

const addGitChat: BusinessLogic = async (req, res, next) => {
  console.log(req.file.filename);
  const chat = await Chat.create({
    room: req.params.id,
    user: req.session.color,
    gif: req.file.filename,
  });
  req.app.get("io").of("/chat").to(req.params.id).emit("chat", chat);
  res.send("ok");
}

const webRtc: BusinessLogic = async (req, res, next) => {
  res.render("index");
}

export {
  mainPage,
  viewRoomPage,
  makeRoom,
  joinRoom,
  deleteRoom,
  addChat,
  addGitChat,
  webRtc
}
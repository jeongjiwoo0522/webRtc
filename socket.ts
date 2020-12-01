import { Application } from "express";
import axios from "axios";
import { Server } from "http";
import SocketIO, { Socket, Room } from "socket.io";
import { BusinessLogic, NextFunction } from "./BusinessLogic";

const DOMAIN_NAME = "http://localhost:8005";

const webSocket = (server: Server, app: Application, sessionMiddleware: BusinessLogic) => {
  const io = SocketIO(server, { path: "/socket.io" });
  app.set("io", io);

  const room = io.of("/room");
  const chat = io.of("/chat");
  const rtc = io.of("/rtc");

  io.use((socket: Socket, next: NextFunction) => {
    sessionMiddleware(socket.request, socket.request.res, next);
  });

  room.on("connection", (socket: Socket) => {
    console.log("chat namespace connection");
    socket.on("disconnect", () => {
      console.log("room namespace disconnected");
    });
  });

  chat.on("connection", (socket: Socket) => {
    console.log("chat namespace connection");
    const req = socket.request;
    const { headers: { referer } } = req;
    const roomId: string = referer!
    .split("/")[referer!.split("/").length - 1]
    .replace(/\?.+/, "");
    socket.join(roomId);
    socket.to(roomId).emit("join", {
      user: "system",
      chat: `${req.session.color}님이 입장하셨습니다.`,
    });

    socket.on("disconnect", () => {
      console.log("chat namespace disconnected");
      socket.leave(roomId);
      const currentRoom: Room = socket.adapter.rooms[roomId];
      const userCount: number = currentRoom ? currentRoom.length : 0;
      if(userCount === 0) {
        axios.delete(`${DOMAIN_NAME}/room/${roomId}`)
        .then(() => {
          console.log("방 제거 성공");
        }) 
        .catch(console.error);
      } else {
        socket.to(roomId).emit("exit", {
          user: "system",
          chat: `${req.session.color}님이 퇴장하셨습니다`,
        });
      }
    });
  });

  rtc.on("connection", (socket: Socket) => {
    console.log("rtc connection");
    socket.on("message", (data: object) => {
      console.log(data);
    });
    socket.on("stream", (stream) => {
      console.log(stream);
      setTimeout(() => console.log(stream), 3000);
      socket.emit("stream", stream);
    });
  });
}

export default webSocket;
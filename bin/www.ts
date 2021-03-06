import https, { ServerOptions, Server } from "https";
import app from "../app";
import fs from "fs";
import webSocket from "../socket";

const port: string = app.get("port");

const options: ServerOptions = {
  key: fs.readFileSync("./private.pem"),
  cert: fs.readFileSync("./public.pem"),
};

const server: Server = https.createServer(options, app).listen(port, () => {
  console.log("Server on ", app.get("port"));
});

webSocket(server, app);
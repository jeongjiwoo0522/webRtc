import https from "https";
import app from "../app";
import webSocket from "../socket";

const port: string = app.get("port");

const options = {

}

const server = https.createServer(options, app)
.listen(port, () => {

})

webSocket(server, app);
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../.env") });

const { MONGO_ID, MONGO_PASSWORD, NODE_ENV, MONGO_HOST } = process.env;
const MONGO_URL = `mongodb://${MONGO_ID}:${MONGO_PASSWORD}@${MONGO_HOST}:27017`;

console.log(MONGO_URL);

const connect = () => {
  if(NODE_ENV !== "production") {
    mongoose.set("debug", true);
  }
  mongoose.connect(MONGO_URL, {
    dbName: "gitchat",
    useNewUrlParser: true,
    useCreateIndex: true,
  }, (err) => {
    if(err) {
      console.log("몽고디비 연결 에러", err);
    } else {
      console.log("몽고디비 연결 성공");
    }
  });
}

mongoose.connection.on("error", (err) => {
  console.log("몽고디비 연결 에러", err);
});
mongoose.connection.on("disconnected", () => {
  console.log("연결이 끊어졌습니다. 연결을 재시도합니다.");
  connect();
});

export default connect;
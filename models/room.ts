import mongoose from "mongoose";

const { Schema } = mongoose;

const roomShema = new Schema({
  title: {
    type: String,
    required: true,
  }, 
  max: {
    type: Number,
    required: true,
  },
  owner: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Room", roomShema);
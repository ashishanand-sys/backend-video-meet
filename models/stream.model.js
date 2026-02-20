import mongoose from "mongoose";

const streamSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,

    status: {
      type: String,
      enum: ["LIVE", "OFFLINE"],
      default: "OFFLINE"
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }

  },
  { timestamps: true }
);

const Stream = mongoose.model("Stream", streamSchema);

export default Stream;
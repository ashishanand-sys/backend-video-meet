import Stream from "../models/stream.model.js";

export const createStream = async (req, res) => {
  const stream = await Stream.create(req.body);
  res.status(201).json(stream);
};

export const getStreams = async (req, res) => {
  const streams = await Stream.find().sort({ createdAt: -1 });
  res.json(streams);
};

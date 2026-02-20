import Stream from "../models/stream.model.js";

export const createStream = async (req, res) => {
  try {
    const stream = await Stream.create({
      ...req.body,
      user: req.userId  // attach authenticated user
    });

    res.status(201).json(stream);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStreams = async (req, res) => {
  try {
    const streams = await Stream
      .find({ user: req.userId })   
      .sort({ createdAt: -1 });

    res.json(streams);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
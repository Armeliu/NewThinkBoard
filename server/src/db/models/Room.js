import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    socketId: { type: String },
    ready: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    disconnectedAt: { type: Date },
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    players: { type: [playerSchema], default: [] },
    status: {
      type: String,
      enum: ['OPEN', 'IN_MATCH', 'FINISHED'],
      default: 'OPEN',
    },
  },
  { timestamps: true }
);

const Room = mongoose.model('Room', roomSchema);

export default Room;

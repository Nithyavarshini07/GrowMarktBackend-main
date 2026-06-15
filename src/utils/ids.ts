import mongoose from "mongoose";

export function toObjectId(id: string): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(id);
}

export function isObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

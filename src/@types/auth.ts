import { Request } from "express";

export interface createUser extends Request {
  body: {
    firebaseUid: string;
    name: string;
    email: string;
    emailVerified?: boolean;
    photoURL?: string;
  };
}
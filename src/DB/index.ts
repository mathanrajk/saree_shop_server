import mongoose from "mongoose";
import { MONGO_URL } from "#/util/variable";
mongoose
  .connect(MONGO_URL)
  .then((data) => {
    console.log("DB connected...");
  })
  .catch((e) => {
    console.log("error from DB : " + e);
  });

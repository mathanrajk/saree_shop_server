import { RequestHandler } from "express";
import * as yup from "yup";
export const valiate = (Schema: any): RequestHandler => {
  return async (req, res, next) => {
    if (!req.body)
      return res.status(401).json({ error: "Empty body is not excepted !" });
    const SchemaToValidate = yup.object({
      body: Schema,
    });

    try {
      await SchemaToValidate.validate(
        {
          body: req.body,
        },
        {
          abortEarly: true,
        },
      );
      next();
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        res.status(422).json({ error: error.message });
      }
    }
  };
};

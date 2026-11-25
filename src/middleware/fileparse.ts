import { RequestHandler } from "express";
import formidable,{File} from "formidable";


export const fileParser: RequestHandler = async (req, res, next) => {
   if (!req.headers["content-type"]?.startsWith("multipart/form-data;")) {
        return res.status(403).json({ error: "Only accepts form-data!" });
    }

 req.body = {}
    const form = formidable({
        multiples: false
    })
  const [fields, files] = await form.parse(req);

  for (let key in fields) {
    const field = fields[key];
    if (field) {
      req.body[key] = field[0];
    }
  }
  for (let key in files) {
    const file = files[key];
    if (file) {
      req.body[key] = file[0];
    }
  }
  next();
};

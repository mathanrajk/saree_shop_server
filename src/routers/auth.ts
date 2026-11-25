import { Router } from "express";
import { create, logout } from "#/controller/auth";
import { isAuth } from "#/middleware/auth";
import { valiate } from "#/middleware/validator";
import { CreateUserScheme } from "#/util/validationSchema";

const router = Router();
router.post("/create", valiate(CreateUserScheme), create);
router.post("/logout", isAuth, logout);

export default router;

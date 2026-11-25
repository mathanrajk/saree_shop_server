import { create_order, getAll_order, getId_order, getUser_order, update_order } from "#/controller/order";
import { isAuth } from "#/middleware/auth";
import { Router } from "express";

const router = Router();
router.post('/create', isAuth, create_order);
router.patch('/:orderId', update_order);
router.get('/', getAll_order);
router.get('/orderHistory', isAuth, getUser_order);
router.get('/orderHistory/:userId', getUser_order);
router.get('/:orderId', getId_order);

export default router;

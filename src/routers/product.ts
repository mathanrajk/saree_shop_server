import { Router } from "express";
import { create_Product, getAll_Product,update_Product,delete_Product, getID_Product, addCart_Product, isCart_Product, getAll_Cart_Product, updateQuantity_Product, latest_Product} from "#/controller/products";
import { fileParser } from "#/middleware/fileparse";
import { isAuth } from "#/middleware/auth";

const router = Router();
router.post('/create',fileParser,create_Product);
router.patch('/:productId',fileParser,update_Product);
router.delete('/:productId',delete_Product);
router.get('/',getAll_Product);
router.get('/carts',isAuth,getAll_Cart_Product);
router.get('/latest', latest_Product);
router.get('/:productId',getID_Product);
router.post('/cart/:productId',isAuth,addCart_Product);
router.post('/iscart/:productId',isAuth,isCart_Product);
router.post('/updateCart/:productId',isAuth,updateQuantity_Product);




export default router;

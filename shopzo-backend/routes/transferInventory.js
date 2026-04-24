import express from 'express'
import { createInventoryTransferRequest, getInventoryTransferRequests , getInventoryTransferRequestById} from '../controllers/inventoryTransfer.js';

const inventoryTransferRouter = express.Router();

inventoryTransferRouter.post('/create', createInventoryTransferRequest)
inventoryTransferRouter.get('/list', getInventoryTransferRequests)
inventoryTransferRouter.get('/getById', getInventoryTransferRequestById)
export default inventoryTransferRouter  
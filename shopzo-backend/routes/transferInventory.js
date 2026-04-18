import express from 'express'
import { createInventoryTransferRequest, getInventoryTransferRequests } from '../controllers/inventoryTransfer.js';

const inventoryTransferRouter = express.Router();

inventoryTransferRouter.post('/create', createInventoryTransferRequest)
inventoryTransferRouter.get('/list', getInventoryTransferRequests)

export default inventoryTransferRouter
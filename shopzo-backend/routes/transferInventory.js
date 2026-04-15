import express from 'express'
import { createInventoryTransferRequest } from '../controllers/inventoryTransfer.js';

const inventoryTransferRouter = express.Router();

inventoryTransferRouter.post('/create', createInventoryTransferRequest)

export default inventoryTransferRouter
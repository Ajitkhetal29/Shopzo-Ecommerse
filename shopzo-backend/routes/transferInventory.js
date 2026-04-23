import express from 'express'
import {
  createInventoryTransferRequest,
  getInventoryTransferRequests,
  getInventoryTransferRequestById,
  getAllowedInventoryTransferStatuses,
  changeInventoryTransferStatus,
} from '../controllers/inventoryTransfer.js';

const inventoryTransferRouter = express.Router();

inventoryTransferRouter.post('/create', createInventoryTransferRequest)
inventoryTransferRouter.get('/list', getInventoryTransferRequests)
inventoryTransferRouter.get('/getById', getInventoryTransferRequestById)
inventoryTransferRouter.get('/allowed-statuses', getAllowedInventoryTransferStatuses)
inventoryTransferRouter.patch('/status', changeInventoryTransferStatus)
export default inventoryTransferRouter  
import express from "express";
import {
  getTransferIssues,
  getTransferIssueById,
  updateTransferIssueStatus,
  resolveTransferIssue,
} from "../controllers/transferIssue.js";

const transferIssueRouter = express.Router();

transferIssueRouter.get("/list", getTransferIssues);
transferIssueRouter.get("/getById", getTransferIssueById);
transferIssueRouter.patch("/status", updateTransferIssueStatus);
transferIssueRouter.patch("/resolve", resolveTransferIssue);

export default transferIssueRouter;

import express from "express";
import authenticate from "../middlewares/authenticate.js";
import searchController from "../controllers/search.controller.js";

const router = express.Router();

router.get("/", authenticate, searchController.searchAll);

export default router;

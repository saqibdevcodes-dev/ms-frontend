const { Router } = require("express");
const rangeController = require("../../controllers/percentage-ranges");

const rangeRouter = Router();

rangeRouter.post("/create", rangeController.create);
rangeRouter.get("/fetch", rangeController.fetch);
rangeRouter.delete("/delete", rangeController.delete_ranges);
rangeRouter.put("/update", rangeController.update_range);

module.exports = rangeRouter;

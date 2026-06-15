const { Router } = require("express");
const essentialController =  require("../../controllers/essentials");

const essentialRouter = Router();

essentialRouter.post("/create", essentialController.createEssentials);
essentialRouter.get("/fetch", essentialController.fetchEssentials);
essentialRouter.delete("/delete/:id", essentialController.deleteEssential);

module.exports = essentialRouter;

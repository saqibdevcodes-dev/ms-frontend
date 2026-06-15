const { Router } = require("express");
const responseController = require("../../controllers/responses");

const responseRouter = Router();

responseRouter.post("/create", responseController.create);
responseRouter.get("/fetch", responseController.fetch);
responseRouter.delete("/delete", responseController.delete_response);
responseRouter.post("/update", responseController.update_response);

module.exports = responseRouter;

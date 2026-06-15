const { Router } = require("express");
const clientController =  require("../../controllers/client");

const clientRouter = Router();

clientRouter.get("/fetch", clientController.fetch);
clientRouter.post("/create", clientController.create);
clientRouter.post("/update", clientController.update);
clientRouter.get("/view", clientController.view);
clientRouter.delete("/delete", clientController.delete_client);

module.exports = clientRouter;

const { Router } = require("express");
const scopeController =  require("../../controllers/scopes");
const multer = require('multer');
const scopeRouter = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage })

scopeRouter.post("/create", scopeController.createScopes);
scopeRouter.get("/download/:id", scopeController.downloadScopeTemplate);
scopeRouter.post("/regenerate-template", scopeController.regenerateScopesTemplate);
scopeRouter.get("/fetch", scopeController.fetchScopes);
scopeRouter.get("/fetch-templates", scopeController.fetchScopeTemplates);
scopeRouter.delete("/delete-template", scopeController.deleteScopeTemplate);



module.exports = scopeRouter;

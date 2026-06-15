const { Router } = require("express");
const branchController = require("../../controllers/branches");

const multer = require("multer");
const branchRouter = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for large Excel files
    fieldSize: 25 * 1024 * 1024, // 25MB for field data
    files: 1, // Only allow one file at a time
  },
});

branchRouter.get("/fetch", branchController.fetchBranches);
branchRouter.post("/create-scopes", branchController.createScopes);
branchRouter.get("/download/:id", branchController.downloadTemplate);
branchRouter.post("/regenerate-template", branchController.regenerateTemplate);
branchRouter.get("/fetch-templates", branchController.fetchTemplates);
branchRouter.delete("/delete-template", branchController.deleteTemplate);
branchRouter.post(
  "/upload",
  upload.single("file"),
  branchController.readScopesData
);
branchRouter.get("/download-data", branchController.downloadBranchData);
branchRouter.post("/add", branchController.addBranch);
branchRouter.delete("/delete", branchController.deleteBranch);
branchRouter.delete("/wipe", branchController.wipeAllBranches);
module.exports = branchRouter;

const { Router } = require("express");
const userController = require("../../controllers/users");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const userRouter = Router();

userRouter.get("/fetch", userController.fetch);
userRouter.get("/fetch-client-users", userController.fetch_client_users);
userRouter.get("/get/:id", userController.get_user);
userRouter.put("/update/:id", userController.update_user);
userRouter.delete("/delete/:id", userController.delete_user);
userRouter.post("/upload", upload.single("file"), userController.upload_users);
userRouter.post("/assign-existing", userController.assign_existing_users);
userRouter.post("/send-credentials", userController.sendCredentials);

module.exports = userRouter;

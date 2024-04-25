const express = require("express");
const apiRouter = express.Router();

const userRouter = require("./routes/userRouter");
const blogRouter = require("./routes/blogRouter");
const authRouter = require("./routes/authRouter");

apiRouter.use("/users", userRouter);
apiRouter.use("/blogs", blogRouter);
apiRouter.use("/auth", authRouter);

module.exports = apiRouter;

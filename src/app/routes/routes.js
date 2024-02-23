import { Router } from "express";
import gitrepoController from "./gitrepo/gitrepo.controller.js";

const api = Router().use(gitrepoController);

export default Router().use("/api/v1", api);

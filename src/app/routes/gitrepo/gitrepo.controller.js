import { Router } from "express";
import { getTopRepositoriesByCountJointContributors } from "./gitrepo.service.js";

const router = Router();

/**
 * Get top top project contributors
 * @route /top-project-contributors
 * @param repoUrl string
 * @returns topContributedProjects
 */
router.get("/gitrepo/top-project-contributors", async (req, res, next) => {
  try {
    const topRepositories = await getTopRepositoriesByCountJointContributors(
      req.query.repoUrl
    );
    res.json({ topRepositories });
  } catch (error) {
    next(error);
  }
});

export default router;

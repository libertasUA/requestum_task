import HttpException from "../../models/http-exception.model.js";
import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";

const MyOctokit = Octokit.plugin(throttling);

const octokit = new MyOctokit({
  auth: `token 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`,
  throttle: {
    onRateLimit: (retryAfter, options) => {
      octokit.log.warn(
        `Request quota exhausted for request ${options.method} ${options.url}`
      );

      // Retry twice after hitting a rate limit error, then give up
      if (options.request.retryCount <= 20) {
        console.log(`Retrying after ${retryAfter} seconds!`);
        return true;
      }
    },
    onSecondaryRateLimit: (retryAfter, options, octokit) => {
      // does not retry, only logs a warning
      octokit.log.warn(
        `Secondary quota detected for request ${options.method} ${options.url}`
      );
      return true;
    },
  },
  request: {
    timeout: 100,
  },
});

async function getRepositoryContributors(repoUrl) {
  try {
    const { owner, repo } = parseRepoUrl(repoUrl);

    const contributors = await octokit.paginate(
      octokit.rest.repos.listContributors,
      {
        owner,
        repo,
        per_page: 500,
      }
    );

    return contributors;
  } catch (error) {
    handleAPIError(error);
  }
}

async function getContributorRepositories(contributors) {
  try {
    const contributorPromises = contributors.map(async (contributor) => {
      const { login } = contributor;
      const repos = await octokit.paginate(octokit.rest.repos.listForUser, {
        username: login,
        per_page: 500,
      });

      return repos.map((repo) => ({ userName: login, repoName: repo.name }));
    });

    const contributorReposArrays = await Promise.all(contributorPromises);

    return contributorReposArrays.flat();
  } catch (error) {
    handleAPIError(error);
  }
}

async function getTopProjects(contributors) {
  try {
    const topProjects = [];
    for (const contributor of contributors) {
      const { login } = contributor;
      const userRepos = await octokit.paginate(octokit.rest.repos.listForUser, {
        username: login,
      });
      const contributedRepos = userRepos.filter((repo) => {
        return repo.owner.login === login;
      });
      topProjects.push(...contributedRepos);
    }
    return topProjects;
  } catch (error) {
    handleAPIError(error);
  }
}

function parseRepoUrl(repoUrl) {
  const parts = repoUrl.split("/");
  const owner = parts[3];
  const repo = parts[4];

  if (!owner || !repo) {
    throw new HttpException(400, "Invalid repository URL");
  }

  return { owner, repo };
}

function handleAPIError(error) {
  if (error.status === 404) {
    throw new HttpException(404, "Repository not found");
  } else {
    console.error("GitHub API error:", error);
    throw new HttpException(500, "Internal Server Error");
  }
}

export const getTopRepositoriesByCountJointContributors = async (
  repoUrl,
  N = 5
) => {
  try {
    const repoContributors = await getRepositoryContributors(repoUrl);
    const contributorRepositories = await getContributorRepositories(
      repoContributors
    );

    console.log(contributorRepositories);
    // const topProjects = await getTopProjects(contributorRepositories, N);

    return [];
  } catch (error) {
    console.error("GitHub API error:", error);
    throw error;
  }
};

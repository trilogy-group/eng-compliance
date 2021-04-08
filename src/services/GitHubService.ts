import {Octokit} from '@octokit/rest'
import {injectable} from 'tsyringe'

import {Repo} from '../model/Repo'

@injectable()
export class GitHubService {
  constructor(private readonly octokit: Octokit) {
    this.octokit = octokit
  }

  private handleError(e: any) {
    // main missing is handled as undefined
    if (e.status && e.status == 404) {
      return undefined
    }
    throw e
  }

  async loadRepository(): Promise<Repo> {
    const repoId = process.env.INPUT_REPOSITORY
    const defaultBranch = process.env.INPUT_DEFAULT_BRANCH
    if (!repoId || !defaultBranch)
      throw new Error(
        `INPUT_REPOSITORY and INPUT_DEFAULT_BRANCH must be specified`
      )

    const [owner, name] = repoId.split('/')
    return Promise.all([
      this.octokit.repos
        .listBranches({
          owner: owner,
          repo: name
        })
        .then(response => response.data),

      this.octokit.repos
        .getBranch({
          owner: owner,
          repo: name,
          branch: defaultBranch
        })
        .then(response => response.data)
        .catch(this.handleError),

      this.octokit.pulls
        .list({
          owner: owner,
          repo: name,
          state: 'open'
        })
        .then(response => response.data)
    ]).then(
      ([branches, mainBranch, pulls]) =>
        new Repo(owner, name, branches, defaultBranch, mainBranch, pulls)
    )
  }
}

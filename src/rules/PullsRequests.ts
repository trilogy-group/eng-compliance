import { Octokit } from "@octokit/rest";
import assert from "assert";
import { injectable } from "tsyringe";
import { check } from "../check";

import { Product } from "../model/Product";
import { Rule } from "../Rule";

@injectable()
export class PullsRequests extends Rule {
    constructor(octokit: Octokit) {
        super(octokit)
    }

    @check({ mandatory: true })
    async checkPullRequestsMustBeToDefaultBranch(product: Product) {
        const violatedPullRequest = product.repo.pulls.find(pull =>
            pull.base.ref != product.repo.defaultBranchName);
        assert(violatedPullRequest == null, `rebase pull request [${violatedPullRequest?.title}] to default branch`);
    }
}

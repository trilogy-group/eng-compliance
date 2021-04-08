import { Octokit } from "@octokit/rest";
import assert from "assert";
import { injectable } from "tsyringe";

import { check } from "../check";
import { Product } from "../model/Product";
import { Rule } from "../Rule";

@injectable()
export class Branching extends Rule {

    readonly maxBranchAge = 7*24; // hours

    constructor(octokit: Octokit) {
        super(octokit)
    }

    @check({ mandatory: true })
    async checkDefaultBranchName(product: Product) {
        const defaultBranchName = product.repo.defaultBranchName;

        assert(defaultBranchName == 'main' || defaultBranchName == 'master' , `default branch should be main or master. current is: ${defaultBranchName}`);
    }

    @check({ mandatory: true })
    async checkNoDevelopBranch(product: Product) {
        const developBranch = product.repo.branches.find(branch => branch.name == 'develop')
        assert(developBranch == null, 'remove the develop branch')
    }

    @check({ mandatory: false })
    async checkNoNonDefaultProtectedBranch(product: Product) {

        const otherProtected = product.repo.branches.find(branch =>
            branch.protected && branch.name != product.repo.defaultBranchName);
        assert(otherProtected == null, `remove or unprotect branch ${otherProtected?.name}`);
    }

    @check({ mandatory: true })
    async checkdefaultBranchIsProtected(product: Product) {
        const defaultBranch = product.repo.branches.find(branch => branch.name == product.repo.defaultBranchName)
        assert(defaultBranch && defaultBranch.protected, `set default branch as protected`);
    }

    @check({ mandatory: false })
    async checkOnlyShortLivedBranches(product: Product) {
        const unprotectedBranches = product.repo.branches.filter(branch =>
            !branch.protected && branch.name != product.repo.defaultBranchName);
        
        const earliestBranchAge = new Date();
        earliestBranchAge.setHours(earliestBranchAge.getHours() - this.maxBranchAge);

        for(const branch of unprotectedBranches) {
            assert(branch.name, 'ensure all branches are named');

            const diff = await this.octokit.repos.compareCommits({
                owner: product.repo.owner,
                repo: product.repo.name,
                base: product.repo.defaultBranchName,
                head: branch.name
            }).then(response => response.data);

            // if branch has no commits, skip it
            if (diff.commits.length == 0) {
                return;
            }

            const commitDate = diff.commits[0].commit.committer?.date;
            if (commitDate) {
                const branchCreationDate = new Date(commitDate);
                assert(branchCreationDate >= earliestBranchAge,
                    `remove branch ${branch.name} which is older than ${this.maxBranchAge} hours`);
            }
        }
    }
}

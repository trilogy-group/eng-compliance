import { components } from "@octokit/openapi-types";

export type FullRepository = components["schemas"]["full-repository"]
export type BranchShort = components["schemas"]["branch-short"];
export type BranchWithProtection = components["schemas"]["branch-with-protection"];
export type BranchProtection = components["schemas"]["branch-protection"];
export type PullRequestSimple = components["schemas"]["pull-request-simple"];

export class Repo {

    readonly id: string;

    constructor(
        readonly owner: string,
        readonly name: string,
        readonly branches: BranchShort[],
        readonly defaultBranchName:string,
        readonly defaultBranch: BranchWithProtection | undefined,
        readonly pulls: PullRequestSimple[],
    ) {
        this.id = `${owner}/${name}`;
        this.owner = owner;
        this.name = name;
        this.branches = branches;
        this.defaultBranch = defaultBranch;
        this.pulls=pulls;
    }

}
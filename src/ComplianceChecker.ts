import { RequestError } from "@octokit/request-error";
import { AssertionError } from "assert";
import { inject, injectable } from "tsyringe";

import { checks } from "./check";
import { Product } from "./model/Product";
import { ConsoleReporter } from './reporters/ConsoleReporter';
import { MultiReporter } from './reporters/MultiReporter';
import { Reporter } from "./reporters/Reporter";
import { checkHumanName as humanCheckName, ruleHumanName as humanRuleName, Rule, RuleCheck } from "./Rule";
import { GitHubService } from "./services/GitHubService";

import './rules';

export enum Result {
    PASS,
    WARN,
    FAIL,
    ERROR
}

@injectable()
export class ComplianceChecker {

    fixableResults = [ Result.FAIL, Result.WARN ]

    constructor(
        @inject('rules') private readonly rules: Rule[],
        private readonly gitHubService: GitHubService
    ) {
    }

    async main() {

        const reporters: Reporter[] = [ new ConsoleReporter() ]
        const reporter = new MultiReporter(reporters);

        const product = new Product();
        reporter.startRun(product);
        let runOutcome = Result.PASS;

        try {
            product.repo = await this.gitHubService.loadRepository()
        } catch (error) {
            const remediation = 'check repo location and grant access';
            reporter.startRule('Setup');
            reporter.startCheck('Setup', 'product is setup for compliance checks');
            reporter.reportCheck('Setup', 'product is setup for compliance checks', { mandatory: true }, Result.FAIL, remediation);
            reporter.reportRule('Setup', Result.FAIL);
            runOutcome = Result.FAIL;
        }

        if (product.repo != null) {
            for(const rule of this.rules) {
                const humanRuleNameVal = humanRuleName(rule);
                reporter.startRule(humanRuleNameVal);
                let ruleOutcome = Result.PASS;

                for(const [checkName, checkFunc] of this.listChecks(rule)) {
                    const checkOptions = checks[checkName]
                    const humanCheckNameVal = humanCheckName(checkName);
                    reporter.startCheck(humanRuleNameVal, humanCheckNameVal);

                    if (checkOptions == null) {
                        throw new Error(`Cannot find options for ${checkName} did you declare it with @check?`)
                    }

                    let checkOutcome: Result | undefined;
                    let message;
                    for(let attempt = 0; checkOutcome == null; attempt++) {
                        // check the status
                        try {
                            await checkFunc.call(rule, product);
                            checkOutcome = Result.PASS;
                        } catch (error) {
                            checkOutcome = checkOptions.mandatory ? Result.FAIL : Result.WARN;
                            if (error instanceof AssertionError) {
                                message = error.message;
                            } else {
                                message = `${humanCheckNameVal}: ${error.message}`;
                            }
                        }

                    }

                    reporter.reportCheck(humanRuleNameVal, humanCheckNameVal, checkOptions, checkOutcome, message);
                    ruleOutcome = Math.max(ruleOutcome, checkOutcome)
                }

                reporter.reportRule(humanRuleNameVal, ruleOutcome);
                runOutcome = Math.max(runOutcome, ruleOutcome)
            }
        }

        console.log('');
        process.exitCode = runOutcome < Result.FAIL ? 0 : 1;
    }

    listChecks(rule: any): Map<string,RuleCheck> {
        const pairs = Object.getOwnPropertyNames(Object.getPrototypeOf(rule))
            .filter(propName => typeof rule[propName] === 'function'
                && propName.startsWith('check') && propName != 'check'
            ).map((checkName): [string, RuleCheck] => [checkName, rule[checkName]]);
        return new Map(pairs);
    }
}

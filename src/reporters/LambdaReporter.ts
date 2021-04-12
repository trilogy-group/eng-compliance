import { HttpClient } from "@actions/http-client";
import { throws } from "assert";
import { CheckOptions } from "../check";
import { Result } from "../ComplianceChecker";
import { Product } from "../model/Product";
import { Reporter } from "./Reporter";

interface ResultRecord {
  level: string,
  rule?: string,
  check?: string,
  mandatory?: string,
  result: string,
  reason?: string
}

interface RequestBody {
  repo_owner?: string,
  repo_name?: string,
  start_time?: string,
  end_time?: string,
  result?: ResultRecord[]
}

export class LambdaReporter extends Reporter {

  private readonly uri: string;
  private readonly keyHeader: any;
  private readonly http: HttpClient;
  private body: RequestBody;

  constructor() {
    super();
    if (process.env.INPUT_ENG_COMPLIANCE_LAMBDA_URI == null) throw new Error('INPUT_ENG_COMPLIANCE_LAMBDA_URI must be specified');
    if (process.env.INPUT_ENG_COMPLIANCE_LAMBDA_KEY == null) throw new Error('INPUT_ENG_COMPLIANCE_LAMBDA_KEY must be specified');

    this.uri = process.env.INPUT_ENG_COMPLIANCE_LAMBDA_URI as string;
    this.body = {};
    this.http = new HttpClient('eng-compliance-github');

    let key = process.env.INPUT_ENG_COMPLIANCE_LAMBDA_KEY as string;
    this.keyHeader = {
      ['x-api-key']: key
    }
  }

  static enabled(): boolean {
    return process.env.INPUT_ENG_COMPLIANCE_LAMBDA_URI != null && process.env.INPUT_ENG_COMPLIANCE_LAMBDA_KEY != null;
  }

  startRun(product: Product) {
    this.body = {
      repo_owner: product.repo.owner,
      repo_name: product.repo.name,
      start_time: Date.now().toString(),
      result: []
    };
  }

  reportCheck(ruleName: string, checkName: string, checkOptions: CheckOptions, outcome: Result, message?: string) {
    let check_record: ResultRecord = {
      level: "check",
      rule: ruleName,
      check: checkName,
      mandatory: String(checkOptions.mandatory),
      result: Result[outcome],
      reason: message?.replace(/[\/]/g, '_')
    }
    this.body.result?.push(check_record);
  }

  reportRule(ruleName: string, outcome: Result) {
    let rule_record: ResultRecord = {
      level: "rule",
      rule: ruleName,
      result: Result[outcome]
    }

    this.body.result?.push(rule_record);
  }

  reportRun(product: Product, outcome: Result) {
    let run_record: ResultRecord = {
      level: "repo",
      result: Result[outcome]
    }

    this.body.result?.push(run_record);

    this.publishRecords();
  }

  async publishRecords(): Promise<void> {
    this.body.end_time = Date.now().toString();

    try {
      await this.http.postJson(this.uri, this.body, this.keyHeader);
    } catch (error) {
      console.error('Error writing to Lambda', error);
    }

  }

}

import { HttpClient } from "@actions/http-client";

import { CheckOptions } from "../check";
import { Result } from "../ComplianceChecker";
import { Config } from "../Config";
import { Product } from "../model/Product";
import { Reporter } from "./Reporter";

interface ResultRecord {
  level: string;
  rule?: string;
  check?: string;
  mandatory?: string;
  result: string;
  reason?: string;
}

interface RequestBody {
  repo_owner?: string;
  repo_name?: string;
  start_time?: string;
  end_time?: string;
  result?: ResultRecord[];
}

export class CloudNotifierReporter extends Reporter {

  private readonly uri: string;
  private readonly keyHeader: object;
  private readonly http: HttpClient;
  private body: RequestBody = {};

  constructor() {
    super();
    
    if (!Config.isCloudNotifierEnabled){
      throw new Error('Cloud notifier is not enabled');
    }

    this.uri = Config.get_cloud_notifier_uri() as string;
    this.http = new HttpClient('eng-compliance-github');
    const key = Config.get_cloud_notifier_key() as string;
    this.keyHeader = {
      ['x-api-key']: key
    }
  }

  static enabled(): boolean {
    return process.env.ENG_COMPLIANCE_CLOUD_NOTIFIER_URI != null && process.env.ENG_COMPLIANCE_CLOUD_NOTIFIER_KEY != null;
  }

  startRun(product: Product) {
    this.body = {
      start_time: Date.now().toString(),
      result: []
    };
  }

  reportCheck(ruleName: string, checkName: string, checkOptions: CheckOptions, outcome: Result, message?: string) {
    const checkRecord: ResultRecord = {
      level: "check",
      rule: ruleName,
      check: checkName,
      mandatory: String(checkOptions.mandatory),
      result: Result[outcome],
      reason: message?.replace(/[\/]/g, '_')
    }
    this.body.result?.push(checkRecord);
  }

  reportRule(ruleName: string, outcome: Result) {
    const ruleRecord: ResultRecord = {
      level: "rule",
      rule: ruleName,
      result: Result[outcome]
    }

    this.body.result?.push(ruleRecord);
  }

  reportRun(product: Product, outcome: Result) {
    const runRecord: ResultRecord = {
      level: "repo",
      result: Result[outcome]
    }

    this.body.result?.push(runRecord);

    this.publishRecords(product);
  }

  async publishRecords(product: Product): Promise<void> {
    this.body.end_time =  Date.now().toString();
    this.body.repo_name = product.repo?.name;
    this.body.repo_owner = product.repo?.owner;
 
    try {
      await this.http.postJson(this.uri, this.body, this.keyHeader);
      console.log('posting the result to cloudNotifier is completed');
    } catch (error) {
      console.error('Error writing to cloudNotifier', error);
    }

  }

}

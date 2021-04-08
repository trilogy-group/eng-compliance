import {Octokit} from '@octokit/rest'
import assert from 'assert'

import {Product} from './model/Product'

export abstract class Rule {
  constructor(protected readonly octokit: Octokit) {}
}

export interface RuleCheck {
  (product: Product): Promise<void>
}

function camelToHuman(camelStr: string) {
  return camelStr.replace(/((?=[A-Z])|(?<![0-9])(?=[0-9]))/g, ' ').trim()
}

export function ruleHumanName(rule: Rule) {
  return camelToHuman(rule.constructor.name)
}

export function checkHumanName(functionName: string) {
  return camelToHuman(functionName.replace('check', ''))
    .toLowerCase()
    .replace(/git hub/g, 'GitHub')
}

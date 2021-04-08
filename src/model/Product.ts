import assert from 'assert'

import {BranchProtection, Repo} from './Repo'

export class Product {
  readonly name
  repo!: Repo

  constructor() {
    this.name = process.env.INPUT_PRODUCT_NAME ?? 'unknown'
  }

  toString(): string {
    return this.repo.id || 'new product'
  }
}

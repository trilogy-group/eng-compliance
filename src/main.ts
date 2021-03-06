import 'reflect-metadata'
import {container} from 'tsyringe'
import './OctokitFactory'
import {ComplianceChecker} from './ComplianceChecker'
import { Config } from './Config'

Config.init();
const complianceChecker = container.resolve(ComplianceChecker)
complianceChecker.main()

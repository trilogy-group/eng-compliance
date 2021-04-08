import 'reflect-metadata';
import { container } from 'tsyringe';
import  './OctokitFactory';
import { ComplianceChecker } from './ComplianceChecker';


const complianceChecker = container.resolve(ComplianceChecker);
complianceChecker.main();
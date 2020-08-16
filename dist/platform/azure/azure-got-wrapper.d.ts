import * as azure from 'azure-devops-node-api';
import { ICoreApi } from 'azure-devops-node-api/CoreApi';
import { IGitApi } from 'azure-devops-node-api/GitApi';
import { IPolicyApi } from 'azure-devops-node-api/PolicyApi';
export declare function azureObj(): azure.WebApi;
export declare function gitApi(): Promise<IGitApi>;
export declare function coreApi(): Promise<ICoreApi>;
export declare function policyApi(): Promise<IPolicyApi>;
export declare function setEndpoint(e: string): void;

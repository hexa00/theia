/* Debug Session */
import { injectable } from "inversify";

export const IDebugSession = Symbol("IDebugSession");
export const IDebugSessionFactory = Symbol("IDebugSessionFactory");

export interface IDebugSession {
}

@injectable()
export class DebugSession implements IDebugSession {

    constructor() {

    }
}

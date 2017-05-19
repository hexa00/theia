import { injectable, inject } from "inversify";
import { DebugSession } from "./debug-session";
import { IMIDebugger } from "./mi/mi-debugger";


export interface LaunchRequestArguments {
    target: string;
    debuggerPath: string;
    debuggerArgs: string;
}

@injectable()
export class GDBDebugSession extends DebugSession {

    public constructor( @inject(IMIDebugger) private miDebugger: IMIDebugger) {
        super();
        console.log("New GDB Debug Session");
    }
    protected initialize() {
        /* FIXME this should obiously not be hardcoded */
        this.miDebugger.path = '/usr/bin/gdb';
        this.miDebugger.args = '-i=mi';
        this.miDebugger.initialize().then((result) => {

        });
    }
}

/* Launcher for the Debugger */
import { injectable, inject } from "inversify";
import * as Path from "path";
import * as Child from "child_process";
import { MIInterpreter } from "./mi-interpreter"
import { MIProtocol as MI } from "./mi-protocol"

/* This doesn't seem to be enforced by the compiler why ? */
export interface Path {
    root: string;
    dir: string;
    base: string;
    ext: string;
    name: string;
}


export const IMIDebugger = Symbol("IMIDebugger");

export interface IMIDebugger {
    args: string;
    path: string;
    initialize(): Promise<any>;
    spawn(): Promise<any>;
}


@injectable()
export class MIDebugger implements IMIDebugger {
    private _args: string[];
    private _path: Path;
    private process: Child.ChildProcess;


    constructor( @inject(MIInterpreter) private interpreter: MIInterpreter) {
    }

    set path(path: string) {
        this._path = Path.parse(path);
    }

    get path(): string {
        return Path.format(this._path);
    }

    set args(args: string) {
        this._args = args.split(' ');
    }

    spawn(): Promise<any> {
        let rejectLaunch: Function;
        let promise = new Promise((resolve, reject) => {
            rejectLaunch = reject;
            this.waitForFirstEvent().then((input) => {
                console.log(input);
                resolve('started');
            });
        });
        console.log(`Starting gdb path: ${Path.format(this._path)}, args: ${JSON.stringify(this._args)}`);
        this.process = Child.spawn(Path.format(this._path), this._args);

        this.interpreter.start(this.process.stdout, this.process.stdin);

        this.process.stderr.on('data', (data: Buffer) => { this.onProcessStdErr(data, rejectLaunch) });
        this.process.on('error', (err: Error) => { this.onProcessError(err, rejectLaunch) });
        this.process.on('exit', (code: number, signal: string) => { this.onProcessExit(code, signal) });

        return promise;
    }

    initialize(): Promise<any> {
        let p = new Promise((resolve, reject) => {
            this.spawn().then((input) => {

                /* Send command to list capabilities */
                let command = new MI.MICommand('list-features');
                this.interpreter.sendCommand(command).then((result: MI.ResultRecord) => {
                    console.log(`Initialize got GDB features ResultRecord: ${JSON.stringify(result)}`);
                    resolve(result);
                });
            });

        });

        return p;
    }

    onProcessStdErr(data: Buffer, reject: Function) {
        console.log(`GDB Error: ${data.toString()}`);
        reject(new Error(data.toString()));
    }

    onProcessExit(code: number, signal: string) {
        console.log(`Process ${Path.format(this._path)} has exited with code ${code}.`);
    }

    onProcessError(err: Error, reject: Function) {
        console.log(`Error starting: ${Path.format(this._path)}`);
        reject(err);
    }

    waitForFirstEvent() {
        return new Promise((resolve, reject) => {
            this.interpreter.once('NotifyAsyncOutput', (input: any) => {
                resolve(input);
            });
        });

    }
}

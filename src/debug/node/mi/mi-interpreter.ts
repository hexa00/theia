import { decorate, injectable, inject } from "inversify";
import * as Events from "events";
import { IMIParser } from "./mi-parser";
import { MIProtocol as MI } from "./mi-protocol";

decorate(injectable(), Events.EventEmitter);
@injectable()
export class MIInterpreter extends Events.EventEmitter {

    private data: Buffer;
    private pendingRequests: Function[] = [];
    private token: number = 0;
    private outStream: NodeJS.WritableStream;

    constructor( @inject(IMIParser) public parser: IMIParser) {
        super();
        this.data = Buffer.alloc(0);
    }
    start(inStream: NodeJS.ReadableStream, outStream: NodeJS.WritableStream) {
        inStream.on('data', (data: Buffer) => this.handleInput(data));
        this.outStream = outStream;
    }

    emitOutputEvents(output: MI.Output) {
        if (output.outOfBandRecord !== undefined) {
            output.outOfBandRecord.forEach((record, index, array) => {
                console.log(`MIInterpreter emit: ${record.type} ${JSON.stringify(record)} `);
                this.emit(record.type, record);
            });
        }

        if (output.resultRecord !== undefined
            && output.resultRecord.token !== undefined) {

            const token = output.resultRecord.token;
            console.log(`MIInterpreter: Got result record for token: ${token}`);
            if (token in this.pendingRequests) {
                console.log(`MIInterpreter: Executing resolve func`);
                this.pendingRequests[token](output.resultRecord);
                delete this.pendingRequests[token];
            }
        }
    }

    sendCommand(command: MI.MICommand): Promise<any> {

        command.token = this.token;

        /* FIXME reject because of timeout or error ? */
        let promise = new Promise((resolve, reject) => {
            this.pendingRequests[this.token] = resolve;
        });

        this.token++;
        this.sendRaw(command.toMI());

        return promise;
    }

    sendRaw(command: string) {
        this.outStream.write(command, 'utf8');
    }

    handleInput(data: Buffer): void {
        let encoding = 'utf8';
        let prompt = '(gdb) \n';
        this.data = Buffer.concat([this.data, data]);

        let promptStartOffset: number = this.data.indexOf(prompt, 0, encoding);

        while (promptStartOffset >= 0) {
            let promptEndOffset = promptStartOffset + prompt.length;
            let output: string = this.data.toString(encoding, 0, promptEndOffset);
            this.data = this.data.slice(promptEndOffset, this.data.length);
            try {
                let result: MI.Output = this.parser.parse(output);
                console.log(`MI parsed result: ${JSON.stringify(result)} `);
                this.emitOutputEvents(result)
            } catch (error) {
                console.log(`Error parsing MI: ${error.message}`);
            }

            promptStartOffset = this.data.indexOf(prompt, 0, encoding);
        }

    }
}

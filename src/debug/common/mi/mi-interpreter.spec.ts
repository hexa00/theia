/* Test MIInterpreter */
import * as chai from "chai";
import "mocha";
import * as chaiAsPromised from "chai-as-promised"
import * as Stream from "stream";

import { testContainer } from "../inversify.spec-config";
import { MIInterpreter } from "./mi-interpreter";
import { MIProtocol as MI } from "./mi-protocol";
import { MIUtils } from "./mi-spec-utils";

chai.use(chaiAsPromised);
/**
 * Globals
 */

let expect = chai.expect;

describe('MIInterpreter', function() {

    let miInterpreter: MIInterpreter;
    beforeEach(function() {
        miInterpreter = testContainer.get<MIInterpreter>(MIInterpreter);
    });

    it('should return a ConsoleStreamOutput Event', function() {
        let input = '~"this is an output string"\n(gdb) \n';

        let promise = MIUtils.waitForNamedEvent(miInterpreter, 'ConsoleStreamOutput');

        MIUtils.startWithInput(input,
            (inStream: Stream.Readable, outStream: Stream.PassThrough) => {
                miInterpreter.start(inStream, outStream);
            });

        return expect(promise).to.eventually.deep.equal(<MI.ConsoleStreamOutput>{
            type: "ConsoleStreamOutput",
            output: "this is an output string"
        });
    });

    it('should return multiple ConsoleStreamOutput Events', function() {
        let input = '~"this is an output string"\n';
        input = input.concat('~"this is an output string"\n');
        input = input.concat('(gdb) \n');

        let promise = MIUtils.waitForNamedEventCount(miInterpreter, 'ConsoleStreamOutput', 2);

        MIUtils.startWithInput(input,
            (inStream: Stream.Readable, outStream: Stream.PassThrough) => {
                miInterpreter.start(inStream, outStream);
            });

        return expect(promise).to.eventually.be.deep.equal([
            <MI.ConsoleStreamOutput>{
                type: "ConsoleStreamOutput",
                output: "this is an output string"
            },
            <MI.ConsoleStreamOutput>{
                type: "ConsoleStreamOutput",
                output: "this is an output string"
            }
        ]
        );
    });

    it('should return a ConsoleStreamOutput even if the message is split', function() {

        /* Setup in out stream for start */
        let inStream = new Stream.Readable;
        let outStream = new Stream.PassThrough();

        let firstInput = '~"this is an output';
        let secondInput = ' string"\n(gdb) \n';

        let promise = MIUtils.waitForNamedEvent(miInterpreter, 'ConsoleStreamOutput');

        inStream.push(firstInput);

        miInterpreter.start(inStream, outStream);

        inStream.push(secondInput);
        inStream.push(null);

        return expect(promise).to.eventually.deep.equal(<MI.ConsoleStreamOutput>{
            type: "ConsoleStreamOutput",
            output: "this is an output string"
        });
    });

    it('should return two ConsoleStreamOutput even if the message is split', function() {

        /* Setup in out stream for start */
        let inStream = new Stream.Readable;
        let outStream = new Stream.PassThrough();

        let firstInput = '~"this is an output';
        let secondInput = ' string"\n(gdb) \n~"this is an output';
        let thirdInput = ' string"\n(gdb) \n';
        let promise = MIUtils.waitForNamedEventCount(miInterpreter, 'ConsoleStreamOutput', 2);

        inStream.push(firstInput);

        miInterpreter.start(inStream, outStream);

        inStream.push(secondInput);
        inStream.push(thirdInput);
        inStream.push(null);

        return expect(promise).to.eventually.be.deep.equal([
            <MI.ConsoleStreamOutput>{
                type: "ConsoleStreamOutput",
                output: "this is an output string"
            },
            <MI.ConsoleStreamOutput>{
                type: "ConsoleStreamOutput",
                output: "this is an output string"
            }
        ]
        );
    });

    /* FIXME test this another way since it doesn't send an event anymore 
    it('should return a ResultRecord Event', function() {
        let input = '^done,test="test"\n(gdb) \n';

        let promise = MIUtils.waitForNamedEvent(miInterpreter, 'ResultRecord');

        MIUtils.startWithInput(input,
            (inStream: Stream.Readable, outStream: Stream.PassThrough) => {
                miInterpreter.start(inStream, outStream);
            });

        return expect(promise).to.eventually.deep.equal(<MI.ResultRecord>{
            "properties": [
                [
                    "test",
                    "test"
                ]
            ],
            "resultClass": "done",
            "type": "ResultRecord"
        });
    });
   */
});

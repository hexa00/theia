import * as chai from "chai";
import "mocha";
import * as chaiAsPromised from "chai-as-promised"

import { testContainer } from "../inversify.spec-config";
import { IMIDebugger } from "./mi-debugger";

chai.use(chaiAsPromised);

/**
 * Globals
 */

let expect = chai.expect;

const debuggerPath: string = '/usr/bin/gdb';
const debuggerArgs: string = '-i=mi';

describe('MIDebugger', function() {

    let miDebugger: IMIDebugger;
    beforeEach(function() {
        miDebugger = testContainer.get<IMIDebugger>(IMIDebugger);
        miDebugger.path = debuggerPath;
        miDebugger.args = debuggerArgs;
    });

    it('should not start GDB, invalid path', function() {
        miDebugger.path = "/non-existing-1";
        let promise = miDebugger.spawn();
        return expect(promise).to.eventually.be.rejectedWith(Error, 'spawn /non-existing-1 ENOENT');
    });

    it('should not start GDB, invalid args', function() {
        miDebugger.args = "-non-existing"
        let promise = miDebugger.spawn();
        return expect(promise).to.eventually.be.rejectedWith(Error, `${miDebugger.path}: unrecognized option \'-non-existing\'\n`);
    });

    it('should start GDB', function() {
        let promise = miDebugger.spawn();
        return expect(promise).to.eventually.equal('started');
    });

    it('should initialize GDB', function() {
        let promise = miDebugger.initialize();
        /* FIXME this should be digested by the debugger, for now return the raw mi output */
        return expect(promise).to.eventually.deep.equal(
            {
                "properties": [
                    [
                        "features",
                        [
                            "frozen-varobjs",
                            "pending-breakpoints",
                            "thread-info",
                            "data-read-memory-bytes",
                            "breakpoint-notifications",
                            "ada-task-info",
                            "language-option",
                            "info-gdb-mi-command",
                            "undefined-command-error-code",
                            "exec-run-start-option",
                            "python"
                        ]
                    ]
                ],
                "resultClass": "done",
                "token": 0,
                "type": "ResultRecord",
            }
        );
    });

});

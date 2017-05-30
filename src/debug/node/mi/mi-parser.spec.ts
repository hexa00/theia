import * as chai from "chai";
import "mocha";
import * as chaiAsPromised from "chai-as-promised"
import { testContainer } from "../inversify.spec-config";
import { IMIParser } from "./mi-parser";
import { MIProtocol as MI } from "./mi-protocol";

chai.use(chaiAsPromised);
/**
 * Globals
 */

let expect = chai.expect;

describe('MIParser', function() {

    let miParser: IMIParser;
    before(function() {
        miParser = testContainer.get<IMIParser>(IMIParser);
    });

    it('should return a ConsoleStreamOutput', function() {
        let input = '~"this is an output string"\n(gdb) \n';
        let output = miParser.parse(input);
        expect(output).to.deep.equal({
            outOfBandRecord: [<MI.ConsoleStreamOutput>{
                type: "ConsoleStreamOutput",
                output: "this is an output string"
            }]
        });
    });

    it('should return two ConsoleStreamOutput', function() {
        let input = '~"this is an output string"\n';
        input = input.concat('~"this is another output string"\n');
        input = input.concat('(gdb) \n');

        let output = miParser.parse(input);
        expect(output).to.deep.equal({
            outOfBandRecord: [<MI.ConsoleStreamOutput>{
                type: "ConsoleStreamOutput",
                output: "this is an output string"
            },
            <MI.ConsoleStreamOutput>{
                type: "ConsoleStreamOutput",
                output: "this is another output string"
            }
            ]
        });
    });

    it('should unescape propery a string in ConsoleStreamOutput', function() {
        let input = '~"this is some escapes &amp,&lt,&gt,&quot"\n(gdb) \n';
        let output = miParser.parse(input);
        expect(output).to.deep.equal({
            outOfBandRecord: [<MI.ConsoleStreamOutput>{
                type: "ConsoleStreamOutput",
                output: 'this is some escapes &,<,>,"'
            }]
        });
    });

    it('should return a TargetStreamOutput', function() {
        let input = '@"this is an output string"\n(gdb) \n';
        let output = miParser.parse(input);
        expect(output).to.deep.equal({
            outOfBandRecord: [<MI.TargetStreamOutput>{
                type: "TargetStreamOutput",
                output: "this is an output string"
            }]
        });
    });

    it('should return two TargetStreamOutput', function() {
        let input = '@"this is an output string"\n';
        input = input.concat('@"this is another output string"\n');
        input = input.concat('(gdb) \n');

        let output = miParser.parse(input);
        expect(output).to.deep.equal({
            outOfBandRecord: [
                <MI.TargetStreamOutput>{
                    type: "TargetStreamOutput",
                    output: "this is an output string"
                },
                <MI.TargetStreamOutput>{
                    type: "TargetStreamOutput",
                    output: "this is another output string"
                }
            ]
        });
    });

    it('should return a LogStreamOutput', function() {
        let input = '&"this is an output string"\n(gdb) \n';
        let output = miParser.parse(input);
        expect(output).to.deep.equal({
            outOfBandRecord: [<MI.LogStreamOutput>{
                type: "LogStreamOutput",
                output: "this is an output string"
            }]
        });
    });

    it('should return two LogStreamOutput', function() {
        let input = '&"this is an output string"\n';
        input = input.concat('&"this is another output string"\n');
        input = input.concat('(gdb) \n');
        let output = miParser.parse(input);
        expect(output).to.deep.equal({
            outOfBandRecord: [
                <MI.LogStreamOutput>{
                    type: "LogStreamOutput",
                    output: "this is an output string"
                },
                <MI.LogStreamOutput>{
                    type: "LogStreamOutput",
                    output: "this is another output string"
                }
            ]
        });
    });

    it('should return a ExecAsyncOutput', function() {
        let input = '*stopped,reason="reason",thread-id="id",stopped-threads="stopped",core="core"\n(gdb) \n';
        let output = miParser.parse(input);
        expect(output).to.deep.equal({
            outOfBandRecord: [<MI.ExecAsyncOutput>{
                "type": "ExecAsyncOutput",
                "asyncClass": "stopped",
                "properties": [
                    [
                        "reason",
                        "reason"
                    ],
                    [
                        "thread-id",
                        "id"
                    ],
                    [
                        "stopped-threads",
                        "stopped"
                    ],
                    [
                        "core",
                        "core"
                    ]
                ]
            }]
        });
    });

    it('should return two ExecAsyncOutput', function() {
        let input = '*stopped,reason="reason",thread-id="id",stopped-threads="stopped",core="core"\n';
        input = input.concat('*stopped,reason="test"\n');
        input = input.concat('(gdb) \n');

        let output = miParser.parse(input);
        expect(output).to.deep.equal({
            outOfBandRecord: [
                <MI.ExecAsyncOutput>{
                    "type": "ExecAsyncOutput",
                    "asyncClass": "stopped",
                    "properties": [
                        [
                            "reason",
                            "reason"
                        ],
                        [
                            "thread-id",
                            "id"
                        ],
                        [
                            "stopped-threads",
                            "stopped"
                        ],
                        [
                            "core",
                            "core"
                        ]
                    ]
                },
                <MI.ExecAsyncOutput>{
                    "type": "ExecAsyncOutput",
                    "asyncClass": "stopped",
                    "properties": [
                        [
                            "reason",
                            "test"
                        ]
                    ]
                }
            ]
        });
    });

    it('should return a ExecAsyncOutput with a token', function() {
        let input = '12*running,thread-id="thread"\n(gdb) \n'
        let output = miParser.parse(input);
        expect(output).to.deep.equal(<MI.Output>{
            outOfBandRecord: [<MI.ExecAsyncOutput>{
                "type": "ExecAsyncOutput",
                "asyncClass": "running",
                "properties": [
                    [
                        "thread-id",
                        "thread"
                    ]
                ],
                "token": 12
            }]
        });
    });

    it('should return a StatusAsyncOutput', function() {
        let input = '+test,thread-id="thread"\n(gdb) \n'
        let output = miParser.parse(input);
        expect(output).to.deep.equal(<MI.Output>{
            outOfBandRecord: [<MI.StatusAsyncOutput>{
                "type": "StatusAsyncOutput",
                "asyncClass": "test",
                "properties": [
                    [
                        "thread-id",
                        "thread"
                    ]
                ]
            }]
        });
    });

    it('should return two StatusAsyncOutput', function() {
        let input = '+test,thread-id="thread"\n';
        input = input.concat('+test,thread-id="another-thread"\n');
        input = input.concat('(gdb) \n');

        let output = miParser.parse(input);
        expect(output).to.deep.equal(<MI.Output>{
            outOfBandRecord: [
                <MI.StatusAsyncOutput>{
                    "type": "StatusAsyncOutput",
                    "asyncClass": "test",
                    "properties": [
                        [
                            "thread-id",
                            "thread"
                        ]
                    ]
                },
                <MI.StatusAsyncOutput>{
                    "type": "StatusAsyncOutput",
                    "asyncClass": "test",
                    "properties": [
                        [
                            "thread-id",
                            "another-thread"
                        ]
                    ]
                }
            ]
        });
    });

    it('should return a NotifyAsyncOutput', function() {
        let input = '=thread-group-added,id="id"\n(gdb) \n';
        let output = miParser.parse(input);
        expect(output).to.deep.equal(<MI.Output>{
            outOfBandRecord: [<MI.StatusAsyncOutput>{
                "type": "NotifyAsyncOutput",
                "asyncClass": "thread-group-added",
                "properties": [
                    [
                        "id",
                        "id"
                    ]
                ]
            }]
        });
    });

    it('should return two NotifyAsyncOutput', function() {
        let input = '=thread-group-added,id="id"\n';
        input = input.concat('=thread-group-added,id="another"\n');
        input = input.concat('(gdb) \n');

        let output = miParser.parse(input);
        expect(output).to.deep.equal(<MI.Output>{
            outOfBandRecord: [
                <MI.StatusAsyncOutput>{
                    "type": "NotifyAsyncOutput",
                    "asyncClass": "thread-group-added",
                    "properties": [
                        [
                            "id",
                            "id"
                        ]
                    ]
                },
                <MI.StatusAsyncOutput>{
                    "type": "NotifyAsyncOutput",
                    "asyncClass": "thread-group-added",
                    "properties": [
                        [
                            "id",
                            "another"
                        ]
                    ]
                }
            ]
        });
    });

    it('should return a ResultRecord', function() {
        let input = '^done,test="test"\n(gdb) \n'
        let output = miParser.parse(input);
        expect(output).to.deep.equal(<MI.Output>{
            resultRecord: <MI.ResultRecord>{
                "properties": [
                    [
                        "test",
                        "test"
                    ]
                ],
                "resultClass": "done",
                "type": "ResultRecord"
            }
        });
    });

    it('should return an Error ResultRecord', function() {
        let input = '^error,msg="test"\n(gdb) \n'
        let output = miParser.parse(input);
        expect(output).to.deep.equal(<MI.Output>{
            resultRecord: <MI.ErrorResultRecord>{
                "msg": "test",
                "resultClass": "error",
                "type": "ErrorResultRecord"
            }
        });
    });

    it('should return an Error ResultRecord with a code', function() {
        let input = '^error,msg="test",code="33"\n(gdb) \n'
        let output = miParser.parse(input);
        expect(output).to.deep.equal(<MI.Output>{
            resultRecord: <MI.ErrorResultRecord>{
                "msg": "test",
                "code": "33",
                "resultClass": "error",
                "type": "ErrorResultRecord"
            }
        });
    });

    it('should throw an error because of incomplete data', function() {
        let input = '~"this is an output';
        try {
            miParser.parse(input);
        } catch (error) {
            expect(error.location.start.offset).to.equal(input.length);
        }
    });

    it('should throw an error because message interleaving', function() {
        let input = '~"this is an output\n(gdb) \n~this is staring another';
        try {
            miParser.parse(input);
        } catch (error) {
            expect(error.location.start.offset).to.equal(input.length);
        }
    });

    it('should return a ResultRecord for a command an empty list result', function() {
        let input = '^done,features=[]\n(gdb) \n';
        let output = miParser.parse(input);

        expect(output).to.deep.equal(<MI.Output>{
            resultRecord: <MI.ResultRecord>{
                "properties": [
                    ["features",
                        []
                    ]
                ],
                "resultClass": "done",
                "type": "ResultRecord"
            }
        });
    });

    it('should return a ResultRecord for a command with list result', function() {
        let input = '^done,features=["frozen-varobjs","pending-breakpoints","thread-info"]\n(gdb) \n';
        let output = miParser.parse(input);

        expect(output).to.deep.equal(<MI.Output>{
            resultRecord: <MI.ResultRecord>{
                "properties": [
                    ["features",
                        [
                            "frozen-varobjs",
                            "pending-breakpoints",
                            "thread-info"
                        ]
                    ]
                ],
                "resultClass": "done",
                "type": "ResultRecord"
            }
        });
    });

    it('should return a ResultRecord for a command with list of results', function() {
        let input = '^done,features=[test="frozen-varobjs",test2="pending-breakpoints"]\n(gdb) \n';
        let output = miParser.parse(input);

        expect(output).to.deep.equal(<MI.Output>{
            resultRecord: <MI.ResultRecord>{
                "properties": [
                    ["features",
                        [
                            [
                                "test",
                                "frozen-varobjs"
                            ],
                            [
                                "test2",
                                "pending-breakpoints"
                            ]
                        ]
                    ]
                ],
                "resultClass": "done",
                "type": "ResultRecord"
            }
        });
    });

});

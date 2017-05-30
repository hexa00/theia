/* */
import * as chai from "chai";
import "mocha";
import * as chaiAsPromised from "chai-as-promised"
import { MIOutputParser } from "./mi-output-parser";
import { MIProtocol as MI } from "./mi-protocol";

chai.use(chaiAsPromised);
/**
 * Globals
 */

let expect = chai.expect;

describe('MIOutputParser', function() {

    let miParser: MIOutputParser;
    before(function() {
        miParser = new MIOutputParser();
    });

    it('should make a simple exec-continue MICommand ', function() {
        let command = new MI.MICommand('exec-continue', 1);

        let miCommand = command.toMI();
        expect(miCommand).to.equal('1-exec-continue\n');

        let parsed = miParser.parse(command.toMI());
        expect(parsed).to.deep.equal({ token: 1, operation: 'exec-continue', options: [], parameters: [] });
    });

    it('should make an exec-continue with reverse option MICommand ', function() {
        let command = new MI.MICommand('exec-continue', 1);
        command.pushOption('reverse');

        let miCommand = command.toMI();
        expect(miCommand).to.equal('1-exec-continue -reverse\n');

        let parsed = miParser.parse(miCommand);
        expect(parsed).to.deep.equal({ token: 1, operation: 'exec-continue', options: [['reverse', undefined]], parameters: [] });
    });

    it('should make an exec-continue with reverse option and thread-group MICommand ', function() {
        let command = new MI.MICommand('exec-continue', 1);
        command.pushOption('reverse');
        command.pushOptionWithParameter(['thread-group', '1']);

        let miCommand = command.toMI();
        expect(miCommand).to.equal('1-exec-continue -reverse -thread-group 1\n');

        let parsed = miParser.parse(miCommand);
        expect(parsed).to.deep.equal({ token: 1, operation: 'exec-continue', options: [['reverse', undefined], ['thread-group', '1']], parameters: [] });
    });

    it('should make a break-after with 2 parameters MICommand ', function() {
        let command = new MI.MICommand('break-after', 1);
        command.pushParameters(['1', '3']);

        let miCommand = command.toMI();
        expect(miCommand).to.equal('1-break-after 1 3\n');

        let parsed = miParser.parse(miCommand);
        expect(parsed).to.deep.equal({ token: 1, operation: 'break-after', options: [], parameters: ['1', '3'] });
    });

    it('should make a break-after one option and 2 parameters MICommand ', function() {
        let command = new MI.MICommand('break-after', 1);
        command.pushOption('test');
        command.pushParameters(['1', '3']);

        let miCommand = command.toMI();
        expect(miCommand).to.equal('1-break-after -test -- 1 3\n');

        let parsed = miParser.parse(miCommand);
        expect(parsed).to.deep.equal({ token: 1, operation: 'break-after', options: [["test", undefined]], parameters: ['1', '3'] });
    });

    it('should make a simple info breakpoints CLICommand ', function() {
        let command = new MI.CLICommand('info breakpoints', 1);

        let miCommand = command.toMI();
        expect(miCommand).to.equal('1info breakpoints\n');

        let parsed = miParser.parse(miCommand);
        expect(parsed).to.deep.equal({ token: 1, command: 'info breakpoints' });
    });

});

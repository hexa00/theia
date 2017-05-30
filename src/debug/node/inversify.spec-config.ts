/* Inversivy config file */
import { Container, interfaces } from "inversify";
import { GDBDebugSession } from "./gdb-debug-session";
import { IMIDebugger, MIDebugger } from "./mi/mi-debugger";
import { MIInterpreter } from "./mi/mi-interpreter";
import { IMIParser, MIParser } from "./mi/mi-parser";
import { IDebugSession, IDebugSessionFactory, DebugSession } from "./debug-session";

let testContainer = new Container();

testContainer.bind<interfaces.Factory<IDebugSession>>(IDebugSessionFactory)
    .toFactory<IDebugSession>((context: interfaces.Context) => {
        return (name: string) => {
            if (name === 'GDB') {
                return context.container.getNamed<IDebugSession>(IDebugSession, name);
            } else {
                return context.container.get<IDebugSession>(IDebugSession);
            }
        };
    });

testContainer.bind<IDebugSession>(IDebugSession).to(GDBDebugSession).whenTargetNamed('GDB');
testContainer.bind<IDebugSession>(IDebugSession).to(DebugSession).whenTargetIsDefault();
testContainer.bind<IMIDebugger>(IMIDebugger).to(MIDebugger);
testContainer.bind<MIInterpreter>(MIInterpreter).to(MIInterpreter);
testContainer.bind<IMIParser>(IMIParser).to(MIParser);

export { testContainer };

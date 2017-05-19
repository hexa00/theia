/* MI parser */
import { injectable } from "inversify";
import * as PEG from "pegjs"

@injectable()
export class MIOutputParser {

    private parser: PEG.Parser;

    constructor() {
        let grammar: string;
        grammar
            = `
{
function flatten(arr) {
  const f = [].concat(...arr);
  return f.some(Array.isArray) ? flatten(f) : f;
}

/* Filter out the ,  in (' ' Option)* */
function getOptions(arr) {
   return [].concat(...arr.map ((cur, index) => {
            return cur.filter ((element, index,array) => {
               return index % 2;
               });
            }));
}
}

start
   =  MICommand / CLICommand

   CLICommand = token:Token? str:CLIString NL {

      let result = { command: str.join("") };

      if (token != null) {
         result = Object.assign(result, { token: token });
      }

      return result;
    }

   CLIString = [^\\r\\n]+

   MICommand = token:Token? '-' operation:Operation options:(' ' Option)* ' --'? parameters:(' ' Parameter)* NL {

      let result = {operation: operation, parameters: getOptions(parameters) };

      if (options !== null)
      {
         result = Object.assign(result, { options: getOptions(options) } );
      } else {
         result = Object.assign(result, { options: [] } );
      }

      if (token != null) {
         result = Object.assign(result, { token: token });
      }

      return result;
   }

   Option = '-' first:Parameter second:(' ' Parameter)? {
      if (second !== null) {
         return [first, second[1]]
      } else {
         return [first, undefined];
      }
   }

   Parameter = NonBlankSequence / CString

   Operation = String

   NonBlankSequence = str:([^\\r\\n "-][^\\r\\n "]*) { return flatten(str).join(""); }

   Token = token:[0-9]+ { return parseInt(token.join(""), 10); }

   String = str:([A-Za-z_-][A-Za-z_0-9-]*) { return flatten(str).join(""); }

   CString = '"' cstring:('\\\\' . / [^"])* '"' {
      let str = flatten(cstring).join("");
      str = str.replace(/&amp/g,'&');
      str = str.replace(/&lt/g,'<');
      str = str.replace(/&gt/g,'>');
      str = str.replace(/&quot/g,'"');
      return str;
   }

   NL = '\\n' / '\\r\\n'
`
        try {
            this.parser = PEG.generate(grammar);
        } catch (error) {
            console.log(error.message);
        }
    }

    parse(input: string): any {
        try {
            return this.parser.parse(input);
        } catch (error) {
            console.log(`Error: ${error.message} while parsing string: ${input}`);
            throw error;
        }
    }

}

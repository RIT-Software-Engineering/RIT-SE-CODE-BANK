import {isRegister, isNumber, isLabel, getRegisterNumber} from "./utils.js";
import { OPCODES } from "./opcodes.js";

/**
 * Parses a single tokenized assembly line. Handles optional leading labels,
 * distinguishes between directives and instructions, and returns a structured
 * AST node. Label‑only lines are represented with type "label-only".
 * @param {string[]} tokens The tokenized components of a single source line.
 * @return {object} The parsed AST node for this line.
 */
export function parseLine(tokens) {
    let label = null;
    if(tokens[1] === ":") {
        label = tokens[0];
        if(tokens.length == 2) {
            return {
                type: "label-only",
                label: label
            }
        }
        tokens = tokens.slice(2);
    }
    
    if(tokens[0][0] === "."){
        const newArgs = tokens.slice(1).filter(token => token != ",");
        return {
            type: "directive",
            label: label,
            directive: tokens[0],
            args: newArgs
        };
    } else {
        return parseInstruction(tokens, label);
    }
}

/**
 * Parses an instruction line into its mnemonic and operand fields. Handles
 * branch instructions as a special case, since they take a single label
 * operand rather than standard addressing modes. For all other instructions,
 * delegates operand splitting to instructionLevel() and operand parsing to
 * parseOperand().
 * @param {string[]} tokens The tokenized instruction line (mnemonic + operands).
 * @param {string|null} label An optional label attached to this line.
 * @return {object} The parsed instruction AST node.
 */
function parseInstruction(tokens, label) {
    const branchMnemonic = tokens[0].toUpperCase();
    const opcodeInfo = OPCODES[branchMnemonic];

    // Special-case branch instructions
    if (opcodeInfo && opcodeInfo.type === "branch") {
        return {
            type: "instruction",
            label,
            mnemonic: branchMnemonic,
            src: null,
            dst: null,
            branchLabel: tokens[1] || null
        };
    }

    const {mnemonic, srcTokens, dstTokens} = instructionLevel(tokens);

    return {
        type: "instruction",
        label: label,
        mnemonic: mnemonic,
        src: srcTokens ? parseOperand(srcTokens) : null,
        dst: dstTokens ? parseOperand(dstTokens) : null
    };
}

/**
 * Splits an instruction’s operand tokens into source and destination groups.
 * Handles both one‑operand and two‑operand instructions by detecting the
 * presence of a comma. Returns the mnemonic along with token arrays for the
 * source and destination operands, or null where operands are absent.
 * @param {string[]} tokenArray The mnemonic followed by raw operand tokens.
 * @return {{mnemonic: string, srcTokens: string[]|null, dstTokens: string[]|null}}
 *         The separated operand token groups.
 */
function instructionLevel(tokenArray) {
    const mnemonic = tokenArray[0];
    const rest = tokenArray.slice(1);
    const srcTokens = [];
    const dstTokens = [];
    let srcCheck = true;

    //used if the tokenArray does not contain a comma
    //determines if an instruction should have a source token or not
    //returns either the destination token if included or just a mnemonic
    if(!rest.includes(',')){
        return {
            mnemonic: mnemonic,
            srcTokens: null,
            dstTokens: rest.length === 0 ? null : rest
        };
    }
    
    //This finds the comma and splits the dst and src tokens
    for(const token of rest) {
        if(token === ','){
            srcCheck = false;
            continue; //done to make sure comma isn't added to a token array
        }
        if(srcCheck) {
            srcTokens.push(token);
        } else {
            dstTokens.push(token);
        }
    }
    return {
        mnemonic: mnemonic,
        srcTokens: srcTokens.length === 0 ? null : srcTokens,
        dstTokens: dstTokens.length === 0 ? null : dstTokens
    }
}

/**
 * Parses a token sequence representing a single operand and determines its
 * addressing mode, register (if applicable), and offset value. Supports all 7
 * PDP‑11 addressing modes. Throws an error if the operand does not match any valid mode pattern.
 * @param {string[]} tokens The token sequence representing one operand.
 * @return {{mode: string, reg: number|null, offset: string|null}}
 *         The decoded operand structure.
 */
export function parseOperand(tokens) {
    //Used to return the mode and register value for a register mode
    if(tokens.length === 1 && isRegister(tokens[0])) {
        return {
            mode: "register",
            reg: getRegisterNumber(tokens[0]),
            offset: null
        };
    }
    //Used for pc specifically
    else if (tokens.length === 3 && tokens[0] === "(" && tokens[1].toUpperCase() === "PC" && tokens[2] === ")") {
        return {
            mode: "autoincrement",
            reg: 7,
            offset: null
        };
    }
    //Used to return the mode and register value for a register deferred mode
    else if((tokens.length === 2 && tokens[0] === "@" && isRegister(tokens[1])) 
        || (tokens.length === 3 && tokens[0] === "(" && isRegister(tokens[1]) && tokens[2] === ")")) {
            return {
                mode: "register_deferred",
                reg: getRegisterNumber(tokens[1]),
                offset: null
            };
    }
    //Used to return the mode and register value for an autoincrement mode
    else if(tokens.length === 4 && tokens[0] === "(" && isRegister(tokens[1]) && tokens[2] === ")" && tokens[3] === "+") {
        return {
            mode: "autoincrement",
            reg: getRegisterNumber(tokens[1]),
            offset: null
        };
    }
    //Used to return the mode and register for an autoincrement deferred mode
    else if(tokens.length === 5 && tokens[0] === "@" && tokens[1] === "(" && isRegister(tokens[2]) && tokens[3] === ")" && tokens[4] === "+") {
        return {
            mode: "autoincrement_deferred",
            reg: getRegisterNumber(tokens[2]),
            offset: null
        };
    }
    //Used to return the mode and register for an autodecrement mode
    else if(tokens.length === 4 && tokens[0] === "-" && tokens[1] === "(" && isRegister(tokens[2]) && tokens[3] === ")") {
        return {
            mode: "autodecrement",
            reg: getRegisterNumber(tokens[2]),
            offset: null
        };
    }
    //Used to return the mode and register for an autodecrement deferred mode
    else if(tokens.length === 5 && tokens[0] === "@" && tokens[1] === "-" && tokens[2] === "(" && isRegister(tokens[3]) && tokens[4] === ")") {
        return {
            mode: "autodecrement_deferred",
            reg: getRegisterNumber(tokens[3]),
            offset: null
        };
    }
    //Both versions of index need to be edited to allow for the use of variables when those are implemented
    //Used to return the mode, register, and offset from index for an indexed mode
    else if(tokens.length === 4 && (isNumber(tokens[0]) || isLabel(tokens[0])) && tokens[1] === "(" &&  isRegister(tokens[2]) && tokens[3] === ")") {
        return {
            mode: "indexed",
            reg: getRegisterNumber(tokens[2]),
            offset: tokens[0]
        };
    }
    //Used to return the mode, register, and offset from index for an indexed deferred mode
    else if(tokens.length === 5 && tokens[0] === "@" && (isNumber(tokens[1]) || isLabel(tokens[1])) && tokens[2] === "(" &&  isRegister(tokens[3]) && tokens[4] === ")") {
        return {
            mode: "indexed_deferred",
            reg: getRegisterNumber(tokens[3]),
            offset: tokens[1]
        };
    }
    //Used to return the mode and register value for an immediate mode
    else if(tokens.length === 2 && tokens[0] === "#" && (isNumber(tokens[1]) || isLabel(tokens[1]))) {
        return {
            mode: "autoincrement",
            reg: 7,
            offset: tokens[1]
        };
    }
    //Used to return the mode and register value for an absolute mode
    else if(tokens.length === 3 && tokens[0] === "@" && tokens[1] === "#" && (isNumber(tokens[2]) || isLabel(tokens[2]))) {
        return {
            mode: "autoincrement_deferred",
            reg: 7,
            offset: tokens[2]
        };
    }

    else if(tokens.length === 1 && isLabel(tokens[0])) {
        return {
            mode: "indexed",
            reg: 7,
            offset: tokens[0]
        }
    }

    //error in case if nothing matches
    else {
        throw new Error("Invalid operand: " + tokens.join(" "));
    }

}
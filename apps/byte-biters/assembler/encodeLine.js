import {encodeOperand} from "./encoder.js";
import { OPCODES } from "./opcodes.js";
import { isStringLiteral, isLabel, isNumber } from "./utils.js";

/**
 * Encodes a single annotated AST node into its machine‑code word array.
 * Dispatches to either instruction or directive encoding based on the node
 * type. Label‑only lines produce no output.
 * @param {object} parsedData The annotated AST node for this line.
 * @param {object} symbols The symbol table produced during pass one.
 * @param {number} lc The current location counter for PC‑relative encoding.
 * @return {number[]} The list of emitted bytes or words for this line.
 */
export function encodeLine(parsedData, symbols, lc) {
    if(parsedData.type === "instruction") {
        return encodeInstruction(parsedData, symbols, lc);
    }
    else if(parsedData.type === "directive") {
        return encodeDirective(parsedData, symbols);
    } else {
        return [];
    }
}

/**
 * Encodes an assembler directive into its corresponding byte or word data.
 * Resolves label references using the symbol table and enforces
 * correct argument formats for each directive.
 * @param {object} parsedData The directive AST node.
 * @param {object} symbols The symbol table from pass one.
 * @return {number[]} The emitted words for this directive.
 */
function encodeDirective(parsedData, symbols) {
    const wordArray = [];
    const directiveType = parsedData.directive.toUpperCase();
    switch(directiveType) {
        case '.WORD':
            for(const arg of parsedData.args) {
                if(isLabel(arg)) {
                    wordArray.push(symbols[arg]);
                } else {
                    wordArray.push(Number(arg));
                }
            }
            break;
        case '.BYTE':
            for(const arg of parsedData.args) {
                let value;
                if(isLabel(arg)) {
                    value = symbols[arg] & 0xFF;
                } else {
                    value = Number(arg) & 0xFF;
                }
                wordArray.push(value);
            }
            break;
        case '.ASCII':
            const string = parsedData.args[0];
            if(isStringLiteral(string)) {
                const withoutQuotes = string.slice(1, -1);
                for(const char of withoutQuotes) {
                    wordArray.push(char.charCodeAt(0));
                }
            } else {
                throw new Error(".ASCII requires a quoted string literal")
            }
            break;
        case '.ASCIZ':
            const stringz = parsedData.args[0];
            if(isStringLiteral(stringz)) {
                const withoutQuotes = stringz.slice(1, -1);
                for(const char of withoutQuotes) {
                    wordArray.push(char.charCodeAt(0));
                }
                wordArray.push(0);
            } else {
                throw new Error(".ASCIZ requires a quoted string literal");
            }
            break;
        case '.BLKW':
        case '.BLKB':
            if(parsedData.args[1] == null && isNumber(parsedData.args[0])) {
                for(let i=0; i<Number(parsedData.args[0]); i++) {
                    if(directiveType == '.BLKB') {
                        wordArray.push(0);
                    } else {
                        wordArray.push(0);
                        wordArray.push(0);
                    }
                }   
            } else {
                throw new Error(".BLKB must be given only a single number");
            }
            break;
    }
    return wordArray;
}

/**
 * Encodes a parsed instruction into one or more machine‑code words. Resolves
 * operand offsets, handles PC‑relative addressing, and dispatches to the
 * appropriate encoder based on the opcode type.
 * @param {object} parsedData The instruction AST node.
 * @param {object} symbols The symbol table from pass one.
 * @param {number} lc The current location counter for PC‑relative operands.
 * @return {number[]} The encoded instruction words.
 */
function encodeInstruction(parsedData, symbols, lc) {
    const {mnemonic, src, dst} = parsedData;
    
    const opcodeInfo = OPCODES[mnemonic.toUpperCase()];
    const resolvedSrc = src ? resolveOperand(src, symbols, lc) : null;
    const resolvedDst = dst ? resolveOperand(dst, symbols, lc) : null;

    if(opcodeInfo !== undefined) {
        switch(opcodeInfo.type) {
            case 'two':
                return twoEncoder(opcodeInfo, resolvedSrc, resolvedDst);
            case 'one':
                return oneEncoder(opcodeInfo, resolvedDst);
            case 'zero':
                return zeroEncoder(opcodeInfo);
            case 'branch':
                const {branchLabel} = parsedData;
                return branchEncoder(opcodeInfo, branchLabel, symbols, lc);
            //create case for rts and jsr
        }
    }
}

/**
 * Resolves an operand’s offset value by replacing label references with their
 * symbol‑table addresses and computing PC‑relative displacements for indexed
 * mode using R7. Returns a new operand object with the resolved offset.
 * @param {object} location The parsed operand structure.
 * @param {object} symbols The symbol table from pass one.
 * @param {number} pc The current program counter for PC‑relative addressing.
 * @return {object} The operand with its offset resolved.
 */
function resolveOperand(location, symbols, pc) {
    let offset = location.offset;

    if(offset != null && isLabel(offset)) {
        offset = symbols[offset];
    }

    if(location.mode == "indexed" && location.reg == 7) {
        offset = (offset - (pc + 2));
    }

    return{...location, offset};
}

/**
 * Encodes a two‑operand instruction into its machine‑code words. Packs the
 * opcode, source operand bits, and destination operand bits into the first
 * word, then appends extra words for any operands requiring offsets.
 * @param {object} opcodeInfo The opcode entry.
 * @param {object} src The resolved source operand.
 * @param {object} dst The resolved destination operand.
 * @return {number[]} The encoded instruction words.
 */
function twoEncoder(opcodeInfo, src, dst) {
    const wordArray = [];
    const srcEncoded = encodeOperand(src);
    const dstEncoded = encodeOperand(dst);
    const word = opcodeInfo.code | (srcEncoded << 6) | dstEncoded;
    wordArray.push(word);

    if(src.offset !== null) {
        const extraWordSrc = Number(src.offset);
        wordArray.push(extraWordSrc);
    }

    if(dst.offset !== null) {
        const extraWordDst = Number(dst.offset);
        wordArray.push(extraWordDst);
    }
    return wordArray;
}

/**
 * Encodes a single‑operand instruction. Packs the opcode and operand bits
 * into the first word and appends an extra word if the operand requires an offset.
 * @param {object} opcodeInfo The opcode entry.
 * @param {object} dst The resolved destination operand.
 * @return {number[]} The encoded instruction words.
 */
function oneEncoder(opcodeInfo, dst) {
    const wordArray = [];
    const dstEncoded = encodeOperand(dst);
    const word = opcodeInfo.code | dstEncoded;
    wordArray.push(word);

    if(dst.offset !== null) {
        const extraWord = Number(dst.offset);
        wordArray.push(extraWord);
    }
    return wordArray
}

/**
 * Encodes a zero‑operand instruction such as HALT or RESET. These instructions
 * consist of a single fixed opcode word.
 * @param {object} opcodeInfo The opcode entry.
 * @return {number[]} A single‑element array containing the opcode word.
 */
function zeroEncoder(opcodeInfo) {
    return [opcodeInfo.code];
}

/**
 * Encodes a branch instruction using an 8‑bit signed displacement. Computes
 * the PC‑relative offset to the target label, verifies that it fits within
 * the ±128‑byte branch range, and inserts the displacement into the low byte
 * of the opcode word.
 * @param {object} opcodeInfo The opcode entry.
 * @param {string} label The branch target label.
 * @param {object} symbols The symbol table from pass one.
 * @param {number} pc The current program counter.
 * @return {number[]} The encoded branch instruction word.
 */
function branchEncoder(opcodeInfo, label, symbols, pc) {
    const target = symbols[label];
    let offset = (target  - (pc + 2));

    if(offset < -128 || offset > 127) {
        throw new Error("Branch out of Range")
    }

    return [opcodeInfo.code | ((offset >> 1) & 0xFF)];
}
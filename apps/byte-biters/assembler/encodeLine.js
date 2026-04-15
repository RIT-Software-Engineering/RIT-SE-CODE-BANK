import {encodeOperand} from "./encoder.js";
import { OPCODES } from "./opcodes.js";
import { isStringLiteral, isLabel, isNumber } from "./utils.js";

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

function encodeInstruction(parsedData, symbols, lc) {
    const {mnemonic, src, dst} = parsedData;
    console.log(parsedData)
    
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

function zeroEncoder(opcodeInfo) {
    return [opcodeInfo.code];
}

function branchEncoder(opcodeInfo, label, symbols, pc) {
    const target = symbols[label];
    let offset = (target  - (pc + 2));

    if(offset < -128 || offset > 127) {
        throw new Error("Branch out of Range")
    }

    return [opcodeInfo.code | (offset & 0xFF)];
}
import {encodeOperand} from "./encoder.js";
import { OPCODES } from "./opcodes.js";

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
    switch(parsedData.directive) {
        case '.WORD':
            for(const arg of parsedData.args) {
                if(isLabel(arg)) {
                    wordArray.push(symbols[arg]);
                } else {
                    wordArray.push(Number(arg));
                }
            }
    }
    return wordArray;
}

function encodeInstruction(parsedData, symbols, lc) {
    const {mnemonic, src, dst} = parsedData;
    
    const UpperMnemonic = mnemonic.toUpperCase();
    const opcodeInfo = OPCODES[UpperMnemonic];
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
            //create case for br
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
        console.log(pc)
        console.log(offset)
        offset = (offset - (pc + 2));
        console.log(offset)
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

function isLabel(token) {
    return /^[a-zA-Z._][a-zA-Z0-9._]*$/.test(token);
}
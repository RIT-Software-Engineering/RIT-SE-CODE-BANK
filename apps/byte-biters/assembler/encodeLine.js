import {encodeOperand} from "./encoder.js";
import { OPCODES } from "./opcodes.js";

export function encodeLine(parsedData, symbols) {
    if(parsedData.type === "instruction") {
        return encodeInstruction(parsedData, symbols);
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

function encodeInstruction(parsedData, symbols) {
    const {mnemonic, src, dst} = parsedData;
    
    const UpperMnemonic = mnemonic.toUpperCase();
    const opcodeInfo = OPCODES[UpperMnemonic];
    const resolvedSrc = src ? {
        ...src,
        offset: (src.offset != null && isLabel(src.offset))
            ? symbols[src.offset]
            : src.offset
    } : null;

    const resolvedDst = dst ? {
        ...dst,
        offset: (dst.offset != null && isLabel(dst.offset))
            ? symbols[dst.offset]
            : dst.offset
    } : null;
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
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

function encodeDirective(parsedData) {

}

function encodeInstruction(parsedData, symbols) {
    const {type, label, mnemonic, src, dst} = parsedData;
    
    const UpperMnemonic = mnemonic.toUpperCase();
    const opcodeInfo = OPCODES[UpperMnemonic];
    if(src.offset != null && isLabel(src.offset)) {
        src.offset = symbols[src.offset];
    }
    if(dst.offset != null && isLabel(dst.offset)) {
        dst.offset = symbols[dst.offset];
    }
    if(opcodeInfo !== undefined) {
        switch(opcodeInfo.type) {
            case 'two':
                console.log(src);
                return twoEncoder(opcodeInfo, src, dst);
            case 'one':
                return oneEncoder(opcodeInfo, dst);
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
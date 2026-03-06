import {encodeOperand} from "./encoder.js";
import { OPCODES } from "./opcodes.js";

export function encodeInstruction(parsedData) {
    const {mnemonic, src, dst} = parsedData;
    
    const opcodeInfo = OPCODES[mnemonic];
    return twoEncoder(opcodeInfo, src, dst);
}

function twoEncoder(opcodeInfo, dst, src) {
    const wordArray = [];
    const srcEncoded = encodeOperand(src);
    const dstEncoded = encodeOperand(dst);
    const word = opcodeInfo.code | (srcEncoded << 6) | dstEncoded;
    wordArray.push(word);

    if(src.offset !== null) {
        const extraWordSrc = src.offset;
        wordArray.push(extraWordSrc);
    }

    if(dst.offset !== null) {
        const extraWordDst = dst.offset;
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
        const extraWord = dst.offset;
        wordArray.push(extraWord);
    }
    return wordArray
}

function zeroEncoder(opcodeInfo) {
    return [opcodeInfo.code];
}

//Should check if the mnenomic matches the something in the opcode array.
//If it does, it should then return the opcode and put you down the correct encoder path - two, one, branch, etc.
//It should then add the values based on what each one needs, for example, for two, it should then add the src and dst info
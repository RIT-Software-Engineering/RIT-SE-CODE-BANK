import { MODE_BITS } from "./modeBits.js";

//returns the encoded value of the mode plus register
export function encodeOperand(tokens) {
    const mode = tokens.mode;
    const reg = tokens.reg;

    const encodedValue = (MODE_BITS[mode] << 3) | reg;
    return encodedValue;
}
import { MODE_BITS } from "./modeBits.js";

/**
 * Encodes an operand’s addressing mode and register fields into the 6‑bit
 * operand specifier used by PDP‑11 instructions. Looks up the 3‑bit mode
 * value from MODE_BITS, shifts it into the high half of the operand field,
 * and ORs it with the 3‑bit register number.
 * @param {object} tokens The parsed operand structure.
 * @return {number} The 6‑bit encoded operand value.
 */
export function encodeOperand(tokens) {
    const mode = tokens.mode;
    const reg = tokens.reg;

    const encodedValue = (MODE_BITS[mode] << 3) | reg;
    return encodedValue;
}
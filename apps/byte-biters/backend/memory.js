export class Memory {
    /**
     * Creates a new memory array of the given size (default 64 KB).
     * @param {number} size The number of bytes in the memory space.
     */
    constructor(size = 0x10000) {
        this.bytes = new Uint8Array(size);
    }

    /**
     * Reads an 8‑bit value from the specified address. The address is masked
     * to 16 bits to emulate PDP‑11 wraparound behavior.
     * @param {number} addr The memory address to read from.
     * @return {number} The byte stored at the given address.
     */
    readByte(addr) {
        return this.bytes[addr & 0xFFFF];
    }

    /**
     * Writes an 8‑bit value to the specified address. The value is masked to
     * one byte and the address is masked to 16 bits for wraparound.
     * @param {number} addr The memory address to write to.
     * @param {number} value The byte value to store.
     */
    writeByte(addr, value) {
        this.bytes[addr & 0xFFFF] = value & 0xFF;
    }

    /**
     * Reads a 16‑bit little‑endian word starting at the specified address.
     * Fetches the low byte at addr and the high byte at addr+1, both with
     * 16‑bit wraparound applied.
     * @param {number} addr The starting address of the word.
     * @return {number} The 16‑bit word value.
     */
    readWord(addr) {
        addr &= 0xFFFF;
        const low = this.bytes[addr];
        const high = this.bytes[(addr + 1) & 0xFFFF];
        return (high << 8) | low;
    }

    /**
     * Writes a 16‑bit little‑endian word starting at the specified address.
     * Stores the low byte at addr and the high byte at addr+1, both masked
     * to 16 bits for wraparound.
     * @param {number} addr The starting address to write to.
     * @param {number} value The 16‑bit word value to store.
     */
    writeWord(addr, value) {
        addr &= 0xFFFF;
        this.bytes[addr] = value & 0xFF;
        this.bytes[(addr + 1) & 0xFFFF] = (value >> 8) & 0xFF;
    }
}
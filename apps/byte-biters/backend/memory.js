export class Memory {
    constructor(size = 0x10000) {
        this.bytes = new Uint8Array(size);
    }

    readByte(addr) {
        return this.bytes[addr & 0xFFFF];
    }

    writeByte(addr, value) {
        this.bytes[addr & 0xFFFF] = value & 0xFF;
    }

    readWord(addr) {
        addr &= 0xFFFF;
        const low = this.bytes[addr];
        const high = this.bytes[(addr + 1) & 0xFFFF];
        return (high << 8) | low;
    }

    writeWord(addr, value) {
        addr &= 0xFFFF;
        this.bytes[addr] = value & 0xFF;
        this.bytes[(addr + 1) & 0xFFFF] = (value >> 8) & 0xFF;
    }

}
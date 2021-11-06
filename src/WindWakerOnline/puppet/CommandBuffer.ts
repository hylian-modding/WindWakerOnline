import IMemory from 'modloader64_api/IMemory';
import { Command, ICommandBuffer } from '../api/WWOAPI';
import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI';
export const instance: number = 0x81801000;
const slotSize = 0x8;
const slotCount = 64;

export class CommandBufferSlot {
    private readonly addr_cmd: number;
    private readonly addr_result: number;
    private readonly emulator: IMemory;
    callback: Function = () => { };

    constructor(addr: number, emulator: IMemory) {
        this.addr_cmd = addr;
        this.addr_result = addr + 0x4;
        this.emulator = emulator;
    }

    get cmd(): Command {
        return this.emulator.rdramRead32(this.addr_cmd);
    }

    set cmd(command: Command) {
        this.emulator.rdramWrite32(this.addr_cmd, command);
    }

    set param(data: number) {
        this.emulator.rdramWrite32(this.addr_result, data);
    }

    halfParam(half: number, data: number) {
        this.emulator.rdramWrite16(this.addr_result + (half * 2), data);
    }

    get result(): number {
        return this.emulator.rdramRead32(this.addr_result);
    }
}

export class CommandBuffer implements ICommandBuffer {
    private readonly modloader: IModLoaderAPI;
    private readonly slots: CommandBufferSlot[] = new Array<CommandBufferSlot>(
        slotCount
    );
    private tickingSlots: number[] = new Array<number>();

    constructor(modloader: IModLoaderAPI) {
        this.modloader = modloader;
        for (let i = 0; i < slotCount; i++) {
            this.slots[i] = new CommandBufferSlot(instance + i * slotSize, modloader.emulator);
        }
    }

    runCommand(
        command: Command,
        data: Buffer,
        uuid: number,
    ): number {
        let pointer = 0;
        let currentCommands = this.modloader.emulator.rdramRead32(instance); // Number of commands to process
        let offset = 8 + (currentCommands * 0x28);
        console.log("Current Commands: " + (currentCommands + 1));

        this.modloader.emulator.rdramWrite32(instance, currentCommands + 1);
        this.modloader.emulator.rdramWrite32(instance + offset, command);
        this.modloader.emulator.rdramWrite32(instance + offset + 4, uuid);

        console.log("tried to write uuid to command: " + uuid + ", " + this.modloader.emulator.rdramRead32(instance + offset + 4) + " was written!")

        switch (command) {
            case Command.COMMAND_TYPE_PUPPET_DESPAWN:
                this.modloader.emulator.rdramWriteBuffer(instance + offset + 0xC, data)
                break;

            case Command.COMMAND_TYPE_PUPPET_SPAWN:

                break;
        }

        return pointer;
    }

    nukeBuffer() {
        if (this.tickingSlots.length > 0) {
            this.tickingSlots.splice(0, this.tickingSlots.length);
        }
        for (let i = 0; i < this.slots.length; i++) {
            this.slots[i].cmd = 0;
            this.slots[i].param = 0;
        }
    }

    onTick() {
        if (this.tickingSlots.length > 0) {
            this.tickingSlots.forEach(
                (value: number, index: number, arr: number[]) => {
                    if (this.slots[value].cmd === 0) {
                        // command is finished.
                        this.slots[value].callback(
                            this.slots[value].cmd === 0,
                            this.slots[value].result
                        );
                        this.slots[value].param = 0x00000000;
                        this.tickingSlots.splice(index, 1);
                    }
                }
            );
        }
    }
}

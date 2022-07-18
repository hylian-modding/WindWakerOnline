import { IModLoaderAPI, ModLoaderEvents } from 'modloader64_api/IModLoaderAPI';
import { bus, EventHandler } from 'modloader64_api/EventHandler';
import { IWWCore } from 'WindWaker/API/WWAPI';
import { WWOnlineStorageClient } from '../storage/WWOnlineStorageClient';
import { SmartBuffer } from 'smart-buffer';
import zlib from 'zlib';

const actor = 0x0000
const anim_data = 0x0144

export class PuppetData {
  pointer: number;
  ModLoader: IModLoaderAPI;
  core: IWWCore;
  private readonly copyFields: string[] = new Array<string>();
  private storage: WWOnlineStorageClient;
  private matrixUpdateTicks: number = 0;
  matrixUpdateRate: number = 2;

  constructor(
    pointer: number,
    ModLoader: IModLoaderAPI,
    core: IWWCore,
    storage: WWOnlineStorageClient
  ) {
    this.storage = storage;
    this.pointer = pointer;
    this.ModLoader = ModLoader;
    this.core = core;
    this.copyFields.push('pos');
    //this.copyFields.push('matrixData');
    this.copyFields.push('rot');
  }

  get pos(): Buffer {
    return this.core.link.pos;
  }

  set pos(pos: Buffer) {
    this.ModLoader.emulator.rdramWriteBuffer(this.pointer + 0x1F8, pos);
  }

  get rot(): Buffer {
    return this.core.link.rot;
  }

  set rot(rot: Buffer) {
    this.ModLoader.emulator.rdramWriteBuffer(this.pointer + 0x1DC, rot);
    this.ModLoader.emulator.rdramWriteBuffer(this.pointer + 0x1F0, rot);
    this.ModLoader.emulator.rdramWriteBuffer(this.pointer + 0x204, rot);
    this.ModLoader.emulator.rdramWriteBuffer(this.pointer + 0x20C, rot);
  }

  get matrixData(): Buffer {
    if (this.matrixUpdateTicks >= this.matrixUpdateRate) {
      let data = this.ModLoader.emulator.rdramReadPtrBuffer(this.pointer + 0x788, 0, 0x1E90);
      let b = new SmartBuffer();
      b.writeUInt8(2);
      let diff = zlib.deflateSync(data);
      b.writeBuffer(diff);
      this.matrixUpdateTicks = 0;
      return b.toBuffer();
    } else {
      let b = new SmartBuffer();
      b.writeUInt8(1);
      this.matrixUpdateTicks++;
      return b.toBuffer();
    }
  }

  set matrixData(data: Buffer) {
    if (data.readUInt8(0) === 2) {
      this.ModLoader.emulator.rdramWritePtrBuffer(this.pointer + 0x78C, 0, zlib.inflateSync(data.slice(1)));
    }
  }

  toJSON() {
    const jsonObj: any = {};

    for (let i = 0; i < this.copyFields.length; i++) {
      jsonObj[this.copyFields[i]] = (this as any)[this.copyFields[i]];
    }
    return jsonObj;
  }
}
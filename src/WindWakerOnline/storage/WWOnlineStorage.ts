import { IWWOSyncSave } from '../types/WWAliases';
import { WWOnlineStorageBase } from './WWOnlineStorageBase';
import * as API from 'WindWaker/API/imports';
import { IInventory, IQuestStatus, IShields, ISwords } from 'WindWaker/API/imports';

export class WWOnlineStorage extends WWOnlineStorageBase {
  networkPlayerInstances: any = {};
  players: any = {};
  worlds: Array<WWOnlineSave_Server> = [];
  saveGameSetup = false;
}

export interface IWWOSyncSaveServer extends IWWOSyncSave {
}

class WWOSyncSaveServer implements IWWOSyncSaveServer {
  dSv_event_c_save: Buffer = Buffer.alloc(0x100);
  dSv_event_c: Buffer = Buffer.alloc(0x100);
  dSv_memory_c_save: Buffer = Buffer.alloc(0x240);
  dSv_memory_c: Buffer = Buffer.alloc(0x24);
  dSv_zone_c_actor: Buffer = Buffer.alloc(0x40);
  dSv_zone_c_zoneBit: Buffer = Buffer.alloc(0x8);
  inventory!: IInventory;
  questStatus!: IQuestStatus;
  swords!: ISwords;
  shields!: IShields;
}

export class WWOnlineSave_Server {
  saveGameSetup = false;
  save: IWWOSyncSaveServer = new WWOSyncSaveServer();
}
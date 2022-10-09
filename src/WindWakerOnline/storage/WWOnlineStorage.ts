import { IWWOSyncSave } from '../types/WWAliases';
import { WWOnlineStorageBase } from './WWOnlineStorageBase';
import * as API from 'WindWaker/API/Imports';
import { IInventory, IQuestStatus, IShields, ISwords } from 'WindWaker/API/Imports';

export class WWOnlineStorage extends WWOnlineStorageBase {
  networkPlayerInstances: any = {};
  players: any = {};
  worlds: Array<WWOnlineSave_Server> = [];
  saveGameSetup = false;
}

export interface IWWOSyncSaveServer extends IWWOSyncSave {
}

class WWOSyncSaveServer implements IWWOSyncSaveServer {
  inventory!: IInventory;
  questStatus!: IQuestStatus;
  swords!: ISwords;
  shields!: IShields;
  eventFlags: Buffer = Buffer.alloc(0x100);
  regionFlags: Buffer = Buffer.alloc(0x240);
  liveFlags: Buffer = Buffer.alloc(0x20);
}

export class WWOnlineSave_Server {
  saveGameSetup = false;
  save: IWWOSyncSaveServer = new WWOSyncSaveServer();
}
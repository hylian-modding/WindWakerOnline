import { IWWOSyncSave } from '../types/WWAliases';
import { WWOnlineStorageBase } from './WWOnlineStorageBase';
import * as API from 'WindWaker/API/imports';
import { IInventory, IQuestStatus } from 'WindWaker/API/imports';

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
}

export class WWOnlineSave_Server {
  saveGameSetup = false;
  save: IWWOSyncSaveServer = new WWOSyncSaveServer();
}
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
  stage_Live!: API.IStageInfo;
  stage0_Sea!: API.IStageInfo;
  stage1_SeaAlt!: API.IStageInfo;
  stage2_ForsakenFortress!: API.IStageInfo;
  stage3_DRC!: API.IStageInfo;
  stage4_FW!: API.IStageInfo;
  stage5_TOTG!: API.IStageInfo;
  stage6_ET!: API.IStageInfo;
  stage7_WT!: API.IStageInfo;
  stage8_GT!: API.IStageInfo;
  stage9_Hyrule!: API.IStageInfo;
  stageA_ShipInt!: API.IStageInfo;
  stageB_HouseMisc!: API.IStageInfo;
  stageC_CaveInt!: API.IStageInfo;
  stageD_CaveShip!: API.IStageInfo;
  stageE_BlueChu!: API.IStageInfo;
  stageF_TestMaps!: API.IStageInfo;
  inventory!: IInventory;
  questStatus!: IQuestStatus;
  swords!: ISwords;
  shields!: IShields;
  eventFlags: Buffer = Buffer.alloc(0x100);
}

export class WWOnlineSave_Server {
  saveGameSetup = false;
  save: IWWOSyncSaveServer = new WWOSyncSaveServer();
}
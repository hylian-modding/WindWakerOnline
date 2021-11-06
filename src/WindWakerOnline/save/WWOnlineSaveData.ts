import { IWWOSyncSave } from "../types/WWAliases";
import { IKeyRing } from "../save/IKeyRing";
import { WWOEvents, WWOSaveDataItemSet } from "../api/WWOAPI";
import { bus } from "modloader64_api/EventHandler";
import { IModLoaderAPI } from "modloader64_api/IModLoaderAPI";
import { ProxySide } from "modloader64_api/SidedProxy/SidedProxy";
import { ISaveSyncData } from "../save/ISaveSyncData";
import { IWWCore } from 'WindWaker/API/WWAPI'
import WWSerialize from "../storage/WWSerialize";
import fs from 'fs';
import { parseFlagChanges } from "./parseFlagChanges";

export class WWOSaveData implements ISaveSyncData {

  private core: IWWCore;
  private ModLoader: IModLoaderAPI;
  hash: string = "";

  constructor(core: IWWCore, ModLoader: IModLoaderAPI) {
    this.core = core;
    this.ModLoader = ModLoader;
  }

  private generateWrapper(): IWWOSyncSave {
    let obj: any = {};
    let keys = [
      "inventory",
      "questStatus"
    ];

    obj = JSON.parse(JSON.stringify(this.core.save));
    let obj2: any = {};
    for (let i = 0; i < keys.length; i++) {
      obj2[keys[i]] = obj[keys[i]];
    }
    return obj2 as IWWOSyncSave;
  }

  createSave(): Buffer {
    let obj = this.generateWrapper();
    let buf = WWSerialize.serializeSync(obj);
    this.hash = this.ModLoader.utils.hashBuffer(buf);
    return buf;
  }

  private processBoolLoop(obj1: any, obj2: any) {
    Object.keys(obj1).forEach((key: string) => {
      if (typeof (obj1[key]) === 'boolean') {
        if (obj1[key] === true && obj2[key] === false) {
          obj2[key] = true;
          bus.emit(WWOEvents.SAVE_DATA_ITEM_SET, new WWOSaveDataItemSet(key, obj2[key]));
        }
      }
    });
  }

  private processMixedLoop(obj1: any, obj2: any, blacklist: Array<string>) {
    Object.keys(obj1).forEach((key: string) => {
      if (blacklist.indexOf(key) > -1) return;
      if (typeof (obj1[key]) === 'boolean') {
        if (obj1[key] === true && obj2[key] === false) {
          obj2[key] = obj1[key];
          bus.emit(WWOEvents.SAVE_DATA_ITEM_SET, new WWOSaveDataItemSet(key, obj2[key]));
        }
      } else if (typeof (obj1[key]) === 'number') {
        if (obj1[key] > obj2[key]) {
          obj2[key] = obj1[key];
          bus.emit(WWOEvents.SAVE_DATA_ITEM_SET, new WWOSaveDataItemSet(key, obj2[key]));
        }
      }
    });
  }

  private processBoolLoop_OVERWRITE(obj1: any, obj2: any) {
    Object.keys(obj1).forEach((key: string) => {
      if (typeof (obj1[key]) === 'boolean') {
        obj2[key] = obj1[key];
      }
    });
  }

  private processMixedLoop_OVERWRITE(obj1: any, obj2: any, blacklist: Array<string>) {
    Object.keys(obj1).forEach((key: string) => {
      if (blacklist.indexOf(key) > -1) return;
      if (typeof (obj1[key]) === 'boolean') {
        obj2[key] = obj1[key];
      } else if (typeof (obj1[key]) === 'number') {
        obj2[key] = obj1[key];
      }
    });
  }

  private isGreaterThan(obj1: number, obj2: number) {
    if (obj1 === 255) obj1 = 0;
    if (obj2 === 255) obj2 = 0;
    return (obj1 > obj2);
  }

  private isNotEqual(obj1: number, obj2: number) {
    if (obj1 === 255) obj1 = 0;
    if (obj2 === 255) obj2 = 0;
    return (obj1 !== obj2);
  }

  forceOverrideSave(save: Buffer, storage: IWWOSyncSave, side: ProxySide) {
    try {
      let obj: IWWOSyncSave = WWSerialize.deserializeSync(save);


      storage.questStatus.max_hp = obj.questStatus.max_hp;
      storage.questStatus.max_mp = obj.questStatus.max_mp;

      this.processMixedLoop_OVERWRITE(obj.inventory, storage.inventory, ["FIELD_BOTTLE1", "FIELD_BOTTLE2", "FIELD_BOTTLE3", "FIELD_BOTTLE4"]);

      //Quest Status Screen Flags
      Object.keys(storage.questStatus).forEach((key: string) => {
        if (Buffer.isBuffer(obj.questStatus[key])) {
          storage.questStatus[key] = obj.questStatus[key];
        }
      })

    } catch (err: any) {
      console.log(err.stack);
    }
  }


  mergeSave(save: Buffer, storage: IWWOSyncSave, side: ProxySide): Promise<boolean> {
    return new Promise((accept, reject) => {
      WWSerialize.deserialize(save).then((obj: IWWOSyncSave) => {

        if (obj.questStatus.max_hp > storage.questStatus.max_hp && obj.questStatus.max_hp <= 80) {
          storage.questStatus.max_hp = obj.questStatus.max_hp;
          bus.emit(WWOEvents.GAINED_PIECE_OF_HEART, {});
        }
        if (storage.questStatus.max_hp > 80) storage.questStatus.max_hp = 80;

        if (obj.questStatus.max_mp > storage.questStatus.max_mp) {
          storage.questStatus.max_mp = obj.questStatus.max_mp;
          bus.emit(WWOEvents.MAGIC_METER_INCREASED, storage.questStatus.max_mp);
        }

        this.processMixedLoop(obj.inventory, storage.inventory, ["FIELD_BOTTLE1", "FIELD_BOTTLE2", "FIELD_BOTTLE3", "FIELD_BOTTLE4"]);

        //Quest Status Screen Flags
        Object.keys(storage.questStatus).forEach((key: string) => {
          if (Buffer.isBuffer(obj.questStatus[key])) {
            this.ModLoader.utils.clearBuffer(storage.questStatus[key]);
            parseFlagChanges(obj.questStatus[key], storage.questStatus[key]);
            storage.questStatus[key] = obj.questStatus[key];
          }
        })

          //Should only update equip if incoming is not "empty"(0xFF, 0x0) or is greater than current equip
  //Hopefully prevents downgrading?
  if (storage.questStatus.swordEquip === 0xFF && obj.questStatus.swordEquip < storage.questStatus.swordEquip) storage.questStatus.swordEquip = obj.questStatus.swordEquip;
  else if (obj.questStatus.swordEquip !== 0xFF && obj.questStatus.swordEquip > storage.questStatus.swordEquip) storage.questStatus.swordEquip = obj.questStatus.swordEquip;

  if (storage.questStatus.shieldEquip === 0xFF && obj.questStatus.shieldEquip < storage.questStatus.braceletEquip) storage.questStatus.shieldEquip = obj.questStatus.shieldEquip;
  else if (obj.questStatus.shieldEquip !== 0xFF && obj.questStatus.shieldEquip > storage.questStatus.shieldEquip) storage.questStatus.shieldEquip = obj.questStatus.shieldEquip;

  if (storage.questStatus.braceletEquip === 0xFF && obj.questStatus.braceletEquip < storage.questStatus.braceletEquip) storage.questStatus.braceletEquip = obj.questStatus.braceletEquip;
  else if (obj.questStatus.braceletEquip !== 0xFF && obj.questStatus.braceletEquip > storage.questStatus.braceletEquip) storage.questStatus.braceletEquip = obj.questStatus.braceletEquip;

        accept(true);
      }).catch((err: string) => {
        console.log(err);
        reject(false);
      });
    });
  }

  applySave(save: Buffer) {
    this.mergeSave(save, this.core.save as any, ProxySide.CLIENT).then((bool: boolean) => { }).catch((bool: boolean) => { });
  }

}
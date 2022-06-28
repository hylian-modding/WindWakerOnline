import { IWWOSyncSave } from "../types/WWAliases";
import { IKeyRing } from "../save/IKeyRing";
import { WWOEvents, WWOSaveDataItemSet } from "../api/WWOAPI";
import { bus } from "modloader64_api/EventHandler";
import { IModLoaderAPI } from "modloader64_api/IModLoaderAPI";
import { ProxySide } from "modloader64_api/SidedProxy/SidedProxy";
import { ISaveSyncData } from "../save/ISaveSyncData";
import { InventoryItem, IWWCore, Shield, Sword } from 'WindWaker/API/WWAPI'
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
      "questStatus",
      "swords",
      "shields",
      "dSv_event_c_save",
      "dSv_event_c",
      "dSv_memory_c_save",
      "dSv_memory_c",
      "dSv_zone_c_actor",
      "dSv_zone_c_zoneBit"
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

      this.processMixedLoop_OVERWRITE(obj.inventory, storage.inventory, ["rupeeCount"]);

      storage.inventory.spoils_slots = obj.inventory.spoils_slots;
      storage.inventory.bait_slots = obj.inventory.bait_slots;
      storage.inventory.delivery_slots = obj.inventory.delivery_slots;
      storage.inventory.owned_delivery = obj.inventory.owned_delivery;
      storage.inventory.owned_spoils = obj.inventory.owned_spoils;
      storage.inventory.owned_bait = obj.inventory.owned_bait;
      storage.inventory.count_spoils = obj.inventory.count_spoils;
      storage.inventory.count_delivery = obj.inventory.count_delivery;
      storage.inventory.count_bait = obj.inventory.count_bait;

      this.processMixedLoop_OVERWRITE(obj.questStatus, storage.questStatus, ["max_mp", "max_hp"])

      storage.questStatus.songs = obj.questStatus.songs;
      storage.questStatus.bracelet = obj.questStatus.bracelet;
      storage.questStatus.braceletEquip = obj.questStatus.braceletEquip;
      storage.questStatus.triforce = obj.questStatus.triforce;
      storage.questStatus.pearls = obj.questStatus.pearls;
      storage.questStatus.pirate_charm = obj.questStatus.pirate_charm;
      storage.questStatus.owned_charts = obj.questStatus.owned_charts;
      storage.questStatus.opened_charts = obj.questStatus.opened_charts;
      storage.questStatus.completed_charts = obj.questStatus.completed_charts;
      storage.questStatus.sectors = obj.questStatus.sectors;
      storage.questStatus.deciphered_triforce = obj.questStatus.deciphered_triforce;

      storage.inventory.FIELD_BOTTLE1 = obj.inventory.FIELD_BOTTLE1;
      storage.inventory.FIELD_BOTTLE2 = obj.inventory.FIELD_BOTTLE2;
      storage.inventory.FIELD_BOTTLE3 = obj.inventory.FIELD_BOTTLE3;
      storage.inventory.FIELD_BOTTLE4 = obj.inventory.FIELD_BOTTLE4;

      storage.inventory.FIELD_BOW = obj.inventory.FIELD_BOW;
      storage.inventory.FIELD_PICTO_BOX = obj.inventory.FIELD_PICTO_BOX;

      storage.swords.swordLevel = obj.swords.swordLevel;
      storage.shields.shieldLevel = obj.shields.shieldLevel;

      this.processMixedLoop_OVERWRITE(obj.swords, storage.swords, []);
      this.processMixedLoop_OVERWRITE(obj.shields, storage.shields, []);


      //Flags (God Help Me)
      storage.dSv_event_c_save = obj.dSv_event_c_save;
      storage.dSv_event_c = obj.dSv_event_c;
      storage.dSv_memory_c_save = obj.dSv_memory_c_save;
      //storage.dSv_zone_c_actor = obj.dSv_zone_c_actor;
      //storage.dSv_zone_c_zoneBit = obj.dSv_zone_c_zoneBit;
      //storage.dSv_memory_c = obj.dSv_memory_c;
      //storage.eventMngrFlags = obj.eventMngrFlags;

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

        //Inventory 
        this.processMixedLoop(obj.inventory, storage.inventory, ["rupeeCount"]);

        let spoils_slots = storage.inventory.spoils_slots;
        let bait_slots = storage.inventory.bait_slots;
        let delivery_slots = storage.inventory.delivery_slots;
        let owned_delivery = storage.inventory.owned_delivery;
        let owned_spoils = storage.inventory.owned_spoils;
        let owned_bait = storage.inventory.owned_bait;
        let count_spoils = storage.inventory.count_spoils;
        let count_delivery = storage.inventory.count_delivery;
        let count_bait = storage.inventory.count_bait;
        let owned_items = storage.inventory.owned_items;

        parseFlagChanges(obj.inventory.owned_delivery, owned_delivery);
        parseFlagChanges(obj.inventory.owned_spoils, owned_spoils);
        parseFlagChanges(obj.inventory.owned_bait, owned_bait);
        parseFlagChanges(obj.inventory.owned_items, owned_items);

        storage.inventory.owned_delivery = owned_delivery;
        storage.inventory.owned_spoils = owned_spoils;
        storage.inventory.owned_bait = owned_bait;
        storage.inventory.owned_items = owned_items;

        for (let i = 0; i < spoils_slots.byteLength; i++) {
          let incomingCount = obj.inventory.spoils_slots.readUInt8(i);
          let storageCount = storage.inventory.spoils_slots.readUInt8(i);
          let buf = storage.inventory.spoils_slots
          if (incomingCount !== storageCount) storageCount = incomingCount;
          buf.writeUInt8(storageCount, i);
          storage.inventory.spoils_slots = buf;
        }
        for (let i = 0; i < bait_slots.byteLength; i++) {
          let incomingCount = obj.inventory.bait_slots.readUInt8(i);
          let storageCount = storage.inventory.bait_slots.readUInt8(i);
          let buf = storage.inventory.bait_slots
          if (incomingCount !== storageCount) storageCount = incomingCount;
          buf.writeUInt8(storageCount, i);
          storage.inventory.bait_slots = buf;
        }
        for (let i = 0; i < delivery_slots.byteLength; i++) {
          let incomingCount = obj.inventory.delivery_slots.readUInt8(i);
          let storageCount = storage.inventory.delivery_slots.readUInt8(i);
          let buf = storage.inventory.delivery_slots
          if (incomingCount !== storageCount) storageCount = incomingCount;
          buf.writeUInt8(storageCount, i);
          storage.inventory.delivery_slots = buf;
        }

        for (let i = 0; i < count_spoils.byteLength; i++) {
          let incomingCount = obj.inventory.count_spoils.readUInt8(i);
          let storageCount = storage.inventory.count_spoils.readUInt8(i);
          let buf = storage.inventory.count_spoils
          if (incomingCount !== storageCount) storageCount = incomingCount;
          buf.writeUInt8(storageCount, i);
          storage.inventory.count_spoils = buf;
        }
        for (let i = 0; i < count_delivery.byteLength; i++) {
          let incomingCount = obj.inventory.count_delivery.readUInt8(i);
          let storageCount = storage.inventory.count_delivery.readUInt8(i);
          let buf = storage.inventory.count_delivery
          if (incomingCount !== storageCount) storageCount = incomingCount;
          buf.writeUInt8(storageCount, i);
          storage.inventory.count_delivery = buf;
        }
        for (let i = 0; i < count_bait.byteLength; i++) {
          let incomingCount = obj.inventory.count_bait.readUInt8(i);
          let storageCount = storage.inventory.count_bait.readUInt8(i);
          let buf = storage.inventory.count_bait
          if (incomingCount !== storageCount) storageCount = incomingCount;
          buf.writeUInt8(storageCount, i);
          storage.inventory.count_bait = buf;
        }

        //Quest Status Screen Flags
        this.processMixedLoop(obj.questStatus, storage.questStatus, ["max_hp", "max_mp", "swordEquip", "shieldEquip"]);

        let triforce = storage.questStatus.triforce;
        let pearls = storage.questStatus.pearls;
        let songs = storage.questStatus.songs;
        let pirate_charm = storage.questStatus.pirate_charm;
        let owned_charts = storage.questStatus.owned_charts;
        let opened_charts = storage.questStatus.opened_charts;
        let completed_charts = storage.questStatus.completed_charts;
        let sectors = storage.questStatus.sectors;
        let deciphered_triforce = storage.questStatus.deciphered_triforce;
        let tingle_statues = storage.questStatus.tingle_statues;

        parseFlagChanges(obj.questStatus.songs, songs);
        parseFlagChanges(obj.questStatus.triforce, triforce);
        parseFlagChanges(obj.questStatus.pearls, pearls);
        parseFlagChanges(obj.questStatus.pirate_charm, pirate_charm);
        parseFlagChanges(obj.questStatus.owned_charts, owned_charts);
        parseFlagChanges(obj.questStatus.opened_charts, opened_charts);
        parseFlagChanges(obj.questStatus.completed_charts, completed_charts);
        parseFlagChanges(obj.questStatus.sectors, sectors);
        parseFlagChanges(obj.questStatus.deciphered_triforce, deciphered_triforce);
        parseFlagChanges(obj.questStatus.tingle_statues, tingle_statues);

        storage.questStatus.bracelet = obj.questStatus.bracelet
        storage.questStatus.triforce = triforce;
        storage.questStatus.pearls = pearls;
        storage.questStatus.songs = songs;
        storage.questStatus.pirate_charm = pirate_charm;
        storage.questStatus.owned_charts = owned_charts;
        storage.questStatus.opened_charts = opened_charts;
        storage.questStatus.completed_charts = completed_charts;
        storage.questStatus.sectors = sectors;
        storage.questStatus.deciphered_triforce = deciphered_triforce;
        storage.questStatus.tingle_statues = tingle_statues;

        this.processMixedLoop(obj.swords, storage.swords, []);
        this.processMixedLoop(obj.shields, storage.shields, []);

        if (storage.questStatus.braceletEquip === 0xFF && obj.questStatus.braceletEquip < storage.questStatus.braceletEquip) {
          storage.questStatus.braceletEquip = obj.questStatus.braceletEquip;
        }
        else if (obj.questStatus.braceletEquip !== 0xFF && obj.questStatus.braceletEquip > storage.questStatus.braceletEquip) {
          storage.questStatus.braceletEquip = obj.questStatus.braceletEquip;
        }

        //bottles
        if (obj.inventory.FIELD_BOTTLE1 !== InventoryItem.NONE && storage.inventory.FIELD_BOTTLE1 === InventoryItem.NONE) {
          storage.inventory.FIELD_BOTTLE1 = obj.inventory.FIELD_BOTTLE1;
        }

        if (obj.inventory.FIELD_BOTTLE2 !== InventoryItem.NONE && storage.inventory.FIELD_BOTTLE2 === InventoryItem.NONE) {
          storage.inventory.FIELD_BOTTLE2 = obj.inventory.FIELD_BOTTLE2;
        }

        if (obj.inventory.FIELD_BOTTLE3 !== InventoryItem.NONE && storage.inventory.FIELD_BOTTLE3 === InventoryItem.NONE) {
          storage.inventory.FIELD_BOTTLE3 = obj.inventory.FIELD_BOTTLE3;
        }

        if (obj.inventory.FIELD_BOTTLE4 !== InventoryItem.NONE && storage.inventory.FIELD_BOTTLE4 === InventoryItem.NONE) {
          storage.inventory.FIELD_BOTTLE4 = obj.inventory.FIELD_BOTTLE4;
        }

        // Different Bow versions
        if (obj.inventory.FIELD_BOW === InventoryItem.BOW || obj.inventory.FIELD_BOW === InventoryItem.FI_BOW || obj.inventory.FIELD_BOW === InventoryItem.LIGHT_BOW) {
          storage.inventory.FIELD_BOW = obj.inventory.FIELD_BOW;
        }
        //Different Picto Box versions
        if (obj.inventory.FIELD_PICTO_BOX === InventoryItem.PICTO_BOX || obj.inventory.FIELD_PICTO_BOX === InventoryItem.DELUXE_PICTO_BOX) {
          storage.inventory.FIELD_PICTO_BOX = obj.inventory.FIELD_PICTO_BOX;
        }

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
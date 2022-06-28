import { IInventoryFields, IQuestStatus, ISaveContext } from 'WindWaker/API/WWAPI';
import * as API from 'WindWaker/API/Imports';
import { WWOSaveData } from '@WindWakerOnline/save/WWOnlineSaveData';

export class WWOnlineStorageBase {
  constructor() { }
  saveManager!: WWOSaveData;
  players: any = {};
  networkPlayerInstances: any = {};
  inventoryStorage: InventoryStorageBase = new InventoryStorageBase();
  questStorage: QuestStorageBase = new QuestStorageBase();
  dSv_event_c_save: Buffer = Buffer.alloc(0x100);
  dSv_event_c: Buffer = Buffer.alloc(0x100);
  dSv_memory_c_save: Buffer = Buffer.alloc(0x240);
  dSv_memory_c: Buffer = Buffer.alloc(0x24);
  dSv_zone_c_actor: Buffer = Buffer.alloc(0x40);
  dSv_zone_c_zoneBit: Buffer = Buffer.alloc(0x8);
}
export class QuestStorageBase implements IQuestStatus {
  constructor() { }
  hasTunic: boolean = false;
  hero_charm: boolean = false;
  windsRequiem: boolean = false;
  balladGales: boolean = false;
  commandMelody: boolean = false;
  earthLyric: boolean = false;
  windAria: boolean = false;
  songPassing: boolean = false;
  current_hp: number = 0;
  current_mp: number = 0;
  max_hp: number = 0;
  max_mp: number = 0;
  bracelet: number = 0;
  heart_containers: number = 0xC;
  swordEquip: number = 0xFF;
  shieldEquip: number = 0xFF;
  braceletEquip: number = 0xFF;
  triforce: Buffer = Buffer.alloc(0x1);
  pearls: Buffer = Buffer.alloc(0x1);
  pirate_charm: Buffer = Buffer.alloc(0x1);
  owned_charts: Buffer = Buffer.alloc(0xF);
  opened_charts: Buffer = Buffer.alloc(0xF);
  completed_charts: Buffer = Buffer.alloc(0xF);
  sectors: Buffer = Buffer.alloc(0x30);
  deciphered_triforce: Buffer = Buffer.alloc(0x1);
  tingle_statues: Buffer = Buffer.alloc(0x1);
  songs: Buffer = Buffer.alloc(0x1);
}

export class InventoryStorageBase implements IInventoryFields {
  constructor() { }
  FIELD_TELESCOPE: boolean = false;
  FIELD_SAIL: boolean = false;
  FIELD_WIND_WAKER: boolean = false;
  FIELD_GRAPPLING_HOOK: boolean = false;
  FIELD_SPOILS_BAG: boolean = false;
  FIELD_BOOMERANG: boolean = false;
  FIELD_DEKU_LEAF: boolean = false;
  FIELD_TINGLE_TUNER: boolean = false;
  FIELD_PICTO_BOX: API.InventoryItem = API.InventoryItem.NONE;
  FIELD_IRON_BOOTS: boolean = false;
  FIELD_MAGIC_ARMOR: boolean = false;
  FIELD_BAIT_BAG: boolean = false;
  FIELD_BOW: API.InventoryItem = API.InventoryItem.NONE;
  FIELD_BOMBS: boolean = false;
  FIELD_BOTTLE1: API.InventoryItem = API.InventoryItem.BOTTLE_EMPTY;
  FIELD_BOTTLE2: API.InventoryItem = API.InventoryItem.BOTTLE_EMPTY;
  FIELD_BOTTLE3: API.InventoryItem = API.InventoryItem.BOTTLE_EMPTY;
  FIELD_BOTTLE4: API.InventoryItem = API.InventoryItem.BOTTLE_EMPTY;
  FIELD_DELIVERY_BAG: boolean = false;
  FIELD_HOOKSHOT: boolean = false;
  FIELD_SKULL_HAMMER: boolean = false;
  spoils_slots: Buffer = Buffer.alloc(0x8);
  bait_slots: Buffer = Buffer.alloc(0x8);
  delivery_slots: Buffer = Buffer.alloc(0x8);
  owned_delivery: Buffer = Buffer.alloc(0x4);
  owned_spoils: Buffer = Buffer.alloc(0x1);
  owned_bait: Buffer = Buffer.alloc(0x1);
  count_spoils: Buffer = Buffer.alloc(0x7);
  count_delivery: Buffer = Buffer.alloc(0x8);
  count_bait: Buffer = Buffer.alloc(0x7);
  owned_items: Buffer = Buffer.alloc(0x14);
  rupeeCap: number = 0;
  bombCap: number = 0;
  arrowCap: number = 0;
  rupeeCount: number = 0;
}
import { IInventoryFields, IQuestStatus, ISaveContext } from 'WindWaker/API/WWAPI';
import * as API from 'WindWaker/API/Imports'
import {
  InventorySave,
  QuestSave,
} from './data/WWOSaveData';

export class WWOnlineStorageBase {
  constructor() {}
  inventoryStorage: InventoryStorageBase = new InventoryStorageBase();
  questStorage: QuestStorageBase = new QuestStorageBase();
}
export class QuestStorageBase implements IQuestStatus{
  constructor() {}

  swordEquip: number = 0;
  shieldEquip: number = 0;
  braceletEquip: number = 0;
  swordLevel: Buffer = Buffer.alloc(0x1);
  shieldLevel: Buffer = Buffer.alloc(0x1);
  songs: Buffer = Buffer.alloc(0x1);
  triforce: Buffer = Buffer.alloc(0x1);
  pearls: Buffer = Buffer.alloc(0x1);
  bracelet: Buffer = Buffer.alloc(0x1);
  pirate_charm: Buffer = Buffer.alloc(0x1);
  hero_charm: Buffer = Buffer.alloc(0x1);
  owned_charts: Buffer = Buffer.alloc(0xF);
  opened_charts: Buffer = Buffer.alloc(0xF);
  completed_charts: Buffer = Buffer.alloc(0xF);
  sectors: Buffer = Buffer.alloc(0x30);
  deciphered_triforce: Buffer = Buffer.alloc(0x1);
}

export class InventoryStorageBase implements IInventoryFields{
  constructor() {}
  FIELD_TELESCOPE: boolean = false;
  FIELD_SAIL: boolean = false;
  FIELD_WIND_WAKER: boolean = false;
  FIELD_GRAPPLING_HOOK: boolean = false;
  FIELD_SPOILS_BAG: boolean = false;
  FIELD_BOOMERANG: boolean = false;
  FIELD_DEKU_LEAF: boolean = false;
  FIELD_TINGLE_TUNER: boolean = false;
  FIELD_PICTO_BOX: boolean = false;
  FIELD_IRON_BOOTS: boolean = false;
  FIELD_MAGIC_ARMOR: boolean = false;
  FIELD_BAIT_BAG: boolean = false;
  FIELD_BOW: boolean = false;
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
  rupeeCap: number = 0;
  bombCap: number = 0;
  arrowCap: number = 0;
}
import * as API from 'WindWaker/API/Imports';
import { bus, setupEventHandlers } from 'modloader64_api/EventHandler';
import { ISaveContext } from 'WindWaker/API/Imports';
import { WWOnlineClient } from '../WWOnlineClient';
import { Interface } from 'readline';
import { WWOnlineConfigCategory } from '../WindWakerOnline';
import { config } from 'process';
import { IModLoaderAPI } from 'modloader64_api/IModLoaderAPI';
import zlib from 'zlib';
import { ProxySide } from 'modloader64_api/SidedProxy/SidedProxy';
import { WWOEvents } from '@WindWakerOnline/WWOAPI/WWOAPI';

export class InventorySave implements API.IInventoryFields {
  FIELD_TELESCOPE = false;
  FIELD_SAIL = false;
  FIELD_WIND_WAKER = false;
  FIELD_GRAPPLING_HOOK = false;
  FIELD_SPOILS_BAG = false;
  FIELD_BOOMERANG = false;
  FIELD_DEKU_LEAF = false;
  FIELD_TINGLE_TUNER = false;
  FIELD_PICTO_BOX = false;
  FIELD_IRON_BOOTS = false;
  FIELD_MAGIC_ARMOR = false;
  FIELD_BAIT_BAG = false;
  FIELD_BOW = false;
  FIELD_BOMBS = false;
  FIELD_BOTTLE1: API.InventoryItem = API.InventoryItem.NONE;
  FIELD_BOTTLE2: API.InventoryItem = API.InventoryItem.NONE;
  FIELD_BOTTLE3: API.InventoryItem = API.InventoryItem.NONE;
  FIELD_BOTTLE4: API.InventoryItem = API.InventoryItem.NONE;
  FIELD_DELIVERY_BAG = false;
  FIELD_HOOKSHOT = false;
  FIELD_SKULL_HAMMER = false;
  spoils_slots!: Buffer;
  bait_slots!: Buffer;
  delivery_slots!: Buffer;
  owned_delivery!: Buffer;
  owned_spoils!: Buffer;
  owned_bait!: Buffer;
  count_spoils!: Buffer;
  count_delivery!: Buffer;
  count_bait!: Buffer;
  rupeeCap!: number;
  bombCap!: number;
  arrowCap!: number;
  rupeeCount!: number;
  max_hp!: number;
  max_mp!: number;
}

export function createInventoryFromContext(save: API.ISaveContext): InventorySave {
  let data = new InventorySave();

  data.FIELD_TELESCOPE = save.inventory.FIELD_TELESCOPE;
  data.FIELD_SAIL = save.inventory.FIELD_SAIL;
  data.FIELD_WIND_WAKER = save.inventory.FIELD_WIND_WAKER;
  data.FIELD_GRAPPLING_HOOK = save.inventory.FIELD_GRAPPLING_HOOK;
  data.FIELD_SPOILS_BAG = save.inventory.FIELD_SPOILS_BAG;
  data.FIELD_BOOMERANG = save.inventory.FIELD_BOOMERANG;
  data.FIELD_DEKU_LEAF = save.inventory.FIELD_DEKU_LEAF;
  data.FIELD_TINGLE_TUNER = save.inventory.FIELD_TINGLE_TUNER;
  data.FIELD_PICTO_BOX = save.inventory.FIELD_PICTO_BOX;
  data.FIELD_IRON_BOOTS = save.inventory.FIELD_IRON_BOOTS;
  data.FIELD_MAGIC_ARMOR = save.inventory.FIELD_MAGIC_ARMOR;
  data.FIELD_BAIT_BAG = save.inventory.FIELD_BAIT_BAG;
  data.FIELD_BOW = save.inventory.FIELD_BOW;
  data.FIELD_BOMBS = save.inventory.FIELD_BOMBS;
  data.FIELD_DELIVERY_BAG = save.inventory.FIELD_DELIVERY_BAG;
  data.FIELD_HOOKSHOT = save.inventory.FIELD_HOOKSHOT;
  data.FIELD_SKULL_HAMMER = save.inventory.FIELD_SKULL_HAMMER;

  data.FIELD_BOTTLE1 = save.inventory.FIELD_BOTTLE1;
  data.FIELD_BOTTLE2 = save.inventory.FIELD_BOTTLE2;
  data.FIELD_BOTTLE3 = save.inventory.FIELD_BOTTLE3;
  data.FIELD_BOTTLE4 = save.inventory.FIELD_BOTTLE4;

  data.spoils_slots = save.inventory.spoils_slots;
  data.bait_slots = save.inventory.bait_slots;
  data.delivery_slots = save.inventory.delivery_slots;
  data.owned_delivery = save.inventory.owned_delivery;
  data.owned_spoils = save.inventory.owned_spoils;
  data.owned_bait = save.inventory.owned_bait;
  data.count_spoils = save.inventory.count_spoils;
  data.count_delivery = save.inventory.count_delivery;
  data.count_bait = save.inventory.count_bait;
  data.rupeeCap = save.inventory.rupeeCap;
  data.bombCap = save.inventory.bombCap;
  data.arrowCap = save.inventory.arrowCap;
  data.rupeeCount = save.inventory.rupeeCount;
  data.max_hp = save.max_hp;
  data.max_mp = save.max_mp;

  return data;
}

export function mergeInventoryData(
  save: InventorySave,
  incoming: InventorySave,
) {
  if (incoming.FIELD_TELESCOPE > save.FIELD_TELESCOPE) {
    save.FIELD_TELESCOPE = incoming.FIELD_TELESCOPE;
  }
  if (incoming.FIELD_SAIL > save.FIELD_SAIL) {
    save.FIELD_SAIL = incoming.FIELD_SAIL;
  }
  if (incoming.FIELD_WIND_WAKER > save.FIELD_WIND_WAKER) {
    save.FIELD_WIND_WAKER = incoming.FIELD_WIND_WAKER;
  }
  if (incoming.FIELD_GRAPPLING_HOOK > save.FIELD_GRAPPLING_HOOK) {
    save.FIELD_GRAPPLING_HOOK = incoming.FIELD_GRAPPLING_HOOK;
  }
  if (incoming.FIELD_SPOILS_BAG > save.FIELD_SPOILS_BAG) {
    save.FIELD_SPOILS_BAG = incoming.FIELD_SPOILS_BAG;
  }
  if (incoming.FIELD_BOOMERANG > save.FIELD_BOOMERANG) {
    save.FIELD_BOOMERANG = incoming.FIELD_BOOMERANG;
  }
  if (incoming.FIELD_DEKU_LEAF > save.FIELD_DEKU_LEAF) {
    save.FIELD_DEKU_LEAF = incoming.FIELD_DEKU_LEAF;
  }
  if (incoming.FIELD_TINGLE_TUNER > save.FIELD_TINGLE_TUNER) {
    save.FIELD_TINGLE_TUNER = incoming.FIELD_TINGLE_TUNER;
  }
  if (incoming.FIELD_PICTO_BOX > save.FIELD_PICTO_BOX) {
    save.FIELD_PICTO_BOX = incoming.FIELD_PICTO_BOX;
  }
  if (incoming.FIELD_IRON_BOOTS > save.FIELD_IRON_BOOTS) {
    save.FIELD_IRON_BOOTS = incoming.FIELD_IRON_BOOTS;
  }
  if (incoming.FIELD_MAGIC_ARMOR > save.FIELD_MAGIC_ARMOR) {
    save.FIELD_MAGIC_ARMOR = incoming.FIELD_MAGIC_ARMOR;
  }
  if (incoming.FIELD_BAIT_BAG > save.FIELD_BAIT_BAG) {
    save.FIELD_BAIT_BAG = incoming.FIELD_BAIT_BAG;
  }
  if (incoming.FIELD_BOW > save.FIELD_BOW) {
    save.FIELD_BOW = incoming.FIELD_BOW;
  }
  if (incoming.FIELD_BOMBS > save.FIELD_BOMBS) {
    save.FIELD_BOMBS = incoming.FIELD_BOMBS;
  }
  if (incoming.FIELD_BOTTLE1 > save.FIELD_BOTTLE1) {
    save.FIELD_BOTTLE1 = incoming.FIELD_BOTTLE1;
  }
  if (incoming.FIELD_BOTTLE2 > save.FIELD_BOTTLE2) {
    save.FIELD_BOTTLE2 = incoming.FIELD_BOTTLE2;
  }
  if (incoming.FIELD_BOTTLE3 > save.FIELD_BOTTLE3) {
    save.FIELD_BOTTLE3 = incoming.FIELD_BOTTLE3;
  }
  if (incoming.FIELD_BOTTLE4 > save.FIELD_BOTTLE4) {
    save.FIELD_BOTTLE4 = incoming.FIELD_BOTTLE4;
  }
  if (incoming.FIELD_DELIVERY_BAG > save.FIELD_DELIVERY_BAG) {
    save.FIELD_DELIVERY_BAG = incoming.FIELD_DELIVERY_BAG;
  }
  if (incoming.FIELD_HOOKSHOT > save.FIELD_HOOKSHOT) {
    save.FIELD_HOOKSHOT = incoming.FIELD_HOOKSHOT;
  }
  if (incoming.FIELD_SKULL_HAMMER > save.FIELD_SKULL_HAMMER) {
    save.FIELD_SKULL_HAMMER = incoming.FIELD_SKULL_HAMMER;
  }
  if (incoming.spoils_slots !== save.spoils_slots) {
    save.spoils_slots = incoming.spoils_slots;
  }
  if (incoming.bait_slots !== save.bait_slots) {
    save.bait_slots = incoming.bait_slots;
  }
  if (incoming.delivery_slots !== save.delivery_slots) {
    save.delivery_slots = incoming.delivery_slots;
  }
  if (incoming.owned_delivery !== save.owned_delivery) {
    save.owned_delivery = incoming.owned_delivery;
  }
  if (incoming.owned_spoils !== save.owned_spoils) {
    save.owned_spoils = incoming.owned_spoils;
  }
  if (incoming.owned_bait !== save.owned_bait) {
    save.owned_bait = incoming.owned_bait;
  }
  if (incoming.count_spoils !== save.count_spoils) {
    save.count_spoils = incoming.count_spoils;
  }
  if (incoming.count_delivery !== save.count_delivery) {
    save.count_delivery = incoming.count_delivery;
  }
  if (incoming.count_bait !== save.count_bait) {
    save.count_bait = incoming.count_bait;
  }
  if (incoming.rupeeCap !== save.rupeeCap) {
    save.rupeeCap = incoming.rupeeCap;
  }
  if (incoming.bombCap !== save.bombCap) {
    save.bombCap = incoming.bombCap;
  }
  if (incoming.arrowCap !== save.arrowCap) {
    save.arrowCap = incoming.arrowCap;
  }
  if (incoming.rupeeCount !== save.rupeeCount) {
    save.rupeeCount = incoming.rupeeCount;
  }
  if (incoming.max_hp > save.max_hp)
  {
    save.max_hp = incoming.max_hp;
  }
  if (incoming.max_mp > save.max_mp)
  {
    save.max_mp = incoming.max_mp;
  }
}

export function applyInventoryToContext(
  data: InventorySave,
  save: API.ISaveContext,
) {

  save.inventory.FIELD_TELESCOPE = data.FIELD_TELESCOPE;
  save.inventory.FIELD_SAIL = data.FIELD_SAIL;
  save.inventory.FIELD_WIND_WAKER = data.FIELD_WIND_WAKER;
  save.inventory.FIELD_GRAPPLING_HOOK = data.FIELD_GRAPPLING_HOOK;
  save.inventory.FIELD_SPOILS_BAG = data.FIELD_SPOILS_BAG;
  save.inventory.FIELD_BOOMERANG = data.FIELD_BOOMERANG;
  save.inventory.FIELD_DEKU_LEAF = data.FIELD_DEKU_LEAF;
  save.inventory.FIELD_TINGLE_TUNER = data.FIELD_TINGLE_TUNER;
  save.inventory.FIELD_PICTO_BOX = data.FIELD_PICTO_BOX;
  save.inventory.FIELD_IRON_BOOTS = data.FIELD_IRON_BOOTS;
  save.inventory.FIELD_MAGIC_ARMOR = data.FIELD_MAGIC_ARMOR;
  save.inventory.FIELD_BAIT_BAG = data.FIELD_BAIT_BAG;
  save.inventory.FIELD_BOW = data.FIELD_BOW;
  save.inventory.FIELD_BOMBS = data.FIELD_BOMBS;
  save.inventory.FIELD_DELIVERY_BAG = data.FIELD_DELIVERY_BAG;
  save.inventory.FIELD_HOOKSHOT = data.FIELD_HOOKSHOT;
  save.inventory.FIELD_SKULL_HAMMER = data.FIELD_SKULL_HAMMER;

  save.inventory.FIELD_BOTTLE1 = data.FIELD_BOTTLE1;
  save.inventory.FIELD_BOTTLE2 = data.FIELD_BOTTLE2;
  save.inventory.FIELD_BOTTLE3 = data.FIELD_BOTTLE3;
  save.inventory.FIELD_BOTTLE4 = data.FIELD_BOTTLE4;

  save.inventory.spoils_slots = data.spoils_slots;
  save.inventory.bait_slots = data.bait_slots;
  save.inventory.delivery_slots = data.delivery_slots;
  save.inventory.owned_delivery = data.owned_delivery;
  save.inventory.owned_spoils = data.owned_spoils;
  save.inventory.owned_bait = data.owned_bait;
  save.inventory.count_spoils = data.count_spoils;
  save.inventory.count_delivery = data.count_delivery;
  save.inventory.count_bait = data.count_bait;
  save.inventory.rupeeCap = data.rupeeCap;
  save.inventory.bombCap = data.bombCap;
  save.inventory.arrowCap = data.arrowCap;
  save.inventory.rupeeCount = data.rupeeCount;
  save.max_hp = data.max_hp;
  save.max_mp = data.max_mp;
}

export class QuestSave implements API.IQuestStatus {
  hasTunic!: boolean;
  swordEquip!: number;
  shieldEquip!: number;
  braceletEquip!: number;
  bracelet!: Buffer;
  swordLevel!: Buffer;
  shieldLevel!: Buffer;
  pirate_charm!: Buffer;
  hero_charm!: Buffer;
  songs!: Buffer;
  pearls!: Buffer;
  triforce!: Buffer;
  owned_charts!: Buffer;
  opened_charts!: Buffer;
  completed_charts!: Buffer;
  sectors!: Buffer;
  deciphered_triforce!: Buffer;
}

export function createQuestFromContext(save: API.IQuestStatus): QuestSave {
  let data = new QuestSave();
  data.hasTunic = save.hasTunic;
  data.swordLevel = save.swordLevel;
  data.shieldLevel = save.shieldLevel;
  data.bracelet = save.bracelet;
  data.pirate_charm = save.pirate_charm;
  data.hero_charm = save.hero_charm;
  data.owned_charts = save.owned_charts;
  data.opened_charts = save.opened_charts;
  data.completed_charts = save.completed_charts;
  data.sectors = save.sectors;
  data.deciphered_triforce = save.deciphered_triforce;
  data.songs = save.songs;
  data.pearls = save.pearls;
  data.triforce = save.triforce;
  data.braceletEquip = save.braceletEquip;
  data.swordEquip = save.swordEquip;
  data.shieldEquip = save.shieldEquip;

  return data;
}

export function mergeQuestData(
  save: QuestSave,
  incoming: QuestSave,
) {
  if (incoming.hasTunic > save.hasTunic) {
    save.hasTunic = incoming.hasTunic;
  }
  if (incoming.pearls !== save.pearls) {
    save.pearls = incoming.pearls;
  }
  if (incoming.bracelet !== save.bracelet) {
    save.bracelet = incoming.bracelet;
  }
  if (incoming.pirate_charm !== save.pirate_charm) {
    save.pirate_charm = incoming.pirate_charm;
  }
  if (incoming.hero_charm !== save.hero_charm) {
    save.hero_charm = incoming.hero_charm;
  }
  if (incoming.owned_charts !== save.owned_charts) {
    save.owned_charts = incoming.owned_charts;
  }
  if (incoming.opened_charts !== save.opened_charts) {
    save.opened_charts !== incoming.opened_charts;
  }
  if (incoming.completed_charts !== save.completed_charts) {
    save.completed_charts = incoming.completed_charts;
  }
  if (incoming.sectors !== save.sectors) {
    save.sectors = incoming.sectors;
  }
  if (incoming.deciphered_triforce !== save.deciphered_triforce) {
    save.deciphered_triforce = incoming.deciphered_triforce;
  }
  if (incoming.songs !== save.songs) {
    save.songs = incoming.songs;
  }
  if (incoming.triforce !== save.triforce) {
    save.triforce = incoming.triforce;
  }
  //Should only update equip if incoming is not "empty"(0xFF, 0x0) or is greater than current equip
  //Hopefully prevents downgrading?
  if (save.swordEquip === 0xFF && incoming.swordEquip < save.swordEquip) save.swordEquip = incoming.swordEquip;
  else if (incoming.swordEquip !== 0xFF && incoming.swordEquip > save.swordEquip) save.swordEquip = incoming.swordEquip;

  if (save.shieldEquip === 0xFF && incoming.shieldEquip < save.shieldEquip) save.shieldEquip = incoming.shieldEquip;
  else if (incoming.shieldEquip !== 0xFF && incoming.shieldEquip > save.shieldEquip) save.shieldEquip = incoming.shieldEquip;

  if (save.braceletEquip === 0xFF && incoming.braceletEquip < save.braceletEquip) save.braceletEquip = incoming.braceletEquip;
  else if (incoming.braceletEquip !== 0xFF && incoming.braceletEquip > save.braceletEquip) save.braceletEquip = incoming.braceletEquip;

  if (incoming.swordLevel > save.swordLevel) {
    save.swordLevel = incoming.swordLevel;
  }
  if (incoming.shieldLevel > save.shieldLevel) {
    save.shieldLevel = incoming.shieldLevel;
  }
}

export function applyQuestSaveToContext(data: QuestSave, save: API.ISaveContext) {
  save.questStatus.hasTunic = data.hasTunic;
  save.questStatus.swordLevel = data.swordLevel;
  save.questStatus.shieldLevel = data.shieldLevel;
  save.questStatus.swordEquip = data.swordEquip;
  save.questStatus.shieldEquip = data.shieldEquip;
  save.questStatus.braceletEquip = data.braceletEquip;
  save.questStatus.pearls = data.pearls;
  save.questStatus.bracelet = data.bracelet;
  save.questStatus.pirate_charm = data.pirate_charm;
  save.questStatus.hero_charm = data.hero_charm;
  save.questStatus.owned_charts = data.owned_charts;
  save.questStatus.opened_charts = data.opened_charts;
  save.questStatus.completed_charts = data.completed_charts;
  save.questStatus.sectors = data.sectors;
  save.questStatus.deciphered_triforce = data.deciphered_triforce;
  save.questStatus.songs = data.songs;
  save.questStatus.triforce = data.triforce;
}
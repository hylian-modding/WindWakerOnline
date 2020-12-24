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

/*export interface IDungeonItemSave extends API.IDungeonItemManager { }

export class WWODungeonItemContainer implements API.IDungeonItemContainer {
  bossKey = false;
  compass = false;
  map = false;
}

export class WWODungeonItemContext implements IDungeonItemSave {
  WOODFALL_TEMPLE: API.IDungeonItemContainer = new WWODungeonItemContainer();
  SNOWHEAD_TEMPLE: API.IDungeonItemContainer = new WWODungeonItemContainer();
  GREAT_BAY_TEMPLE: API.IDungeonItemContainer = new WWODungeonItemContainer();
  STONE_TOWER_TEMPLE: API.IDungeonItemContainer = new WWODungeonItemContainer();
}

export function createDungeonItemDataFromContext(
  context: API.IDungeonItemManager
): IDungeonItemSave {
  let m: IDungeonItemSave = new WWODungeonItemContext();
  m.WOODFALL_TEMPLE.bossKey = context.WOODFALL_TEMPLE.bossKey;
  m.WOODFALL_TEMPLE.compass = context.WOODFALL_TEMPLE.compass;
  m.WOODFALL_TEMPLE.map = context.WOODFALL_TEMPLE.map;

  m.SNOWHEAD_TEMPLE.bossKey = context.SNOWHEAD_TEMPLE.bossKey;
  m.SNOWHEAD_TEMPLE.compass = context.SNOWHEAD_TEMPLE.compass;
  m.SNOWHEAD_TEMPLE.map = context.SNOWHEAD_TEMPLE.map;

  m.GREAT_BAY_TEMPLE.bossKey = context.GREAT_BAY_TEMPLE.bossKey;
  m.GREAT_BAY_TEMPLE.compass = context.GREAT_BAY_TEMPLE.compass;
  m.GREAT_BAY_TEMPLE.map = context.GREAT_BAY_TEMPLE.map;

  m.STONE_TOWER_TEMPLE.bossKey = context.STONE_TOWER_TEMPLE.bossKey;
  m.STONE_TOWER_TEMPLE.compass = context.STONE_TOWER_TEMPLE.compass;
  m.STONE_TOWER_TEMPLE.map = context.STONE_TOWER_TEMPLE.map;

  return m;
}

export function mergeDungeonItemData(
  ModLoader: IModLoaderAPI,
  storage: API.IDungeonItemManager,
  incoming: IDungeonItemSave,
  side: ProxySide,
  lobby: string
) {

  if (incoming.WOODFALL_TEMPLE.bossKey && !storage.WOODFALL_TEMPLE.bossKey) {
    if (true && side === ProxySide.SERVER) {
      //ModLoader.serverSide.sendPacket(new WWO_ItemGetMessagePacket("You obtained the Boss Key (Woodfall Temple)", lobby, "tile283.png"));
    }
    storage.WOODFALL_TEMPLE.bossKey = incoming.WOODFALL_TEMPLE.bossKey;
  }
  if (incoming.WOODFALL_TEMPLE.compass && !storage.WOODFALL_TEMPLE.compass) {
    storage.WOODFALL_TEMPLE.compass = incoming.WOODFALL_TEMPLE.compass;
  }
  if (incoming.WOODFALL_TEMPLE.map && !storage.WOODFALL_TEMPLE.map) {
    storage.WOODFALL_TEMPLE.map = incoming.WOODFALL_TEMPLE.map;
  }

  if (incoming.SNOWHEAD_TEMPLE.bossKey && !storage.SNOWHEAD_TEMPLE.bossKey) {
    if (true && side === ProxySide.SERVER) {
      //ModLoader.serverSide.sendPacket(new WWO_ItemGetMessagePacket("You obtained the Boss Key (Snowhead Temple)", lobby, "tile283.png"));
    }
    storage.SNOWHEAD_TEMPLE.bossKey = incoming.SNOWHEAD_TEMPLE.bossKey;
  }
  if (incoming.SNOWHEAD_TEMPLE.compass && !storage.SNOWHEAD_TEMPLE.compass) {
    storage.SNOWHEAD_TEMPLE.compass = incoming.SNOWHEAD_TEMPLE.compass;
  }
  if (incoming.SNOWHEAD_TEMPLE.map && !storage.SNOWHEAD_TEMPLE.map) {
    storage.SNOWHEAD_TEMPLE.map = incoming.SNOWHEAD_TEMPLE.map;
  }

  if (incoming.GREAT_BAY_TEMPLE.bossKey && !storage.GREAT_BAY_TEMPLE.bossKey) {
    if (true && side === ProxySide.SERVER) {
      //ModLoader.serverSide.sendPacket(new WWO_ItemGetMessagePacket("You obtained the Boss Key (Great Bay Temple)", lobby, "tile283.png"));
    }
    storage.GREAT_BAY_TEMPLE.bossKey = incoming.GREAT_BAY_TEMPLE.bossKey;
  }
  if (incoming.GREAT_BAY_TEMPLE.compass && !storage.GREAT_BAY_TEMPLE.compass) {
    storage.GREAT_BAY_TEMPLE.compass = incoming.GREAT_BAY_TEMPLE.compass;
  }
  if (incoming.GREAT_BAY_TEMPLE.map && !storage.GREAT_BAY_TEMPLE.map) {
    storage.GREAT_BAY_TEMPLE.map = incoming.GREAT_BAY_TEMPLE.map;
  }

  if (incoming.STONE_TOWER_TEMPLE.bossKey && !storage.STONE_TOWER_TEMPLE.bossKey) {
    if (true && side === ProxySide.SERVER) {
      //ModLoader.serverSide.sendPacket(new WWO_ItemGetMessagePacket("You obtained the Boss Key (Stone Tower Temple)", lobby, "tile283.png"));
    }
    storage.STONE_TOWER_TEMPLE.bossKey = incoming.STONE_TOWER_TEMPLE.bossKey;
  }
  if (incoming.STONE_TOWER_TEMPLE.compass && !storage.STONE_TOWER_TEMPLE.compass) {
    storage.STONE_TOWER_TEMPLE.compass = incoming.STONE_TOWER_TEMPLE.compass;
  }
  if (incoming.STONE_TOWER_TEMPLE.map && !storage.STONE_TOWER_TEMPLE.map) {
    storage.STONE_TOWER_TEMPLE.map = incoming.STONE_TOWER_TEMPLE.map;
  }
}

export function applyDungeonItemDataToContext(
  incoming: IDungeonItemSave,
  context: API.IDungeonItemManager
) {
  context.WOODFALL_TEMPLE.bossKey = incoming.WOODFALL_TEMPLE.bossKey;
  context.WOODFALL_TEMPLE.compass = incoming.WOODFALL_TEMPLE.compass;
  context.WOODFALL_TEMPLE.map = incoming.WOODFALL_TEMPLE.map;

  context.SNOWHEAD_TEMPLE.bossKey = incoming.SNOWHEAD_TEMPLE.bossKey;
  context.SNOWHEAD_TEMPLE.compass = incoming.SNOWHEAD_TEMPLE.compass;
  context.SNOWHEAD_TEMPLE.map = incoming.SNOWHEAD_TEMPLE.map;

  context.GREAT_BAY_TEMPLE.bossKey = incoming.GREAT_BAY_TEMPLE.bossKey;
  context.GREAT_BAY_TEMPLE.compass = incoming.GREAT_BAY_TEMPLE.compass;
  context.GREAT_BAY_TEMPLE.map = incoming.GREAT_BAY_TEMPLE.map;

  context.STONE_TOWER_TEMPLE.bossKey = incoming.STONE_TOWER_TEMPLE.bossKey;
  context.STONE_TOWER_TEMPLE.compass = incoming.STONE_TOWER_TEMPLE.compass;
  context.STONE_TOWER_TEMPLE.map = incoming.STONE_TOWER_TEMPLE.map;
}*/

export class InventorySave implements API.IInventoryFields {
  FIELD_TELESCOPE = 0;
  FIELD_SAIL = 0;
  FIELD_WIND_WAKER = 0;
  FIELD_GRAPPLING_HOOK = 0;
  FIELD_SPOILS_BAG = 0;
  FIELD_BOOMERANG = 0;
  FIELD_DEKU_LEAF = 0;
  FIELD_TINGLE_TUNER = 0;
  FIELD_PICTO_BOX = 0;
  FIELD_IRON_BOOTS = 0;
  FIELD_MAGIC_ARMOR = 0;
  FIELD_BAIT_BAG = 0;
  FIELD_BOW = 0;
  FIELD_BOMBS = 0;
  FIELD_BOTTLE1 = 0;
  FIELD_BOTTLE2 = 0;
  FIELD_BOTTLE3 = 0;
  FIELD_BOTTLE4 = 0;
  FIELD_DELIVERY_BAG = 0;
  FIELD_HOOKSHOT = 0;
  FIELD_SKULL_HAMMER = 0;
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
}

export interface IQuestSave extends API.IQuestStatus {

}

export class QuestSave implements IQuestSave {
  bracelet!: Buffer;
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

  return data;
}

export function mergeQuestData(
  save: QuestSave,
  incoming: QuestSave,
) {
  if (incoming.bracelet !== save.bracelet) {
    save.bracelet = incoming.bracelet;
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
    save.opened_charts = incoming.opened_charts;
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
}

export function applyQuestSaveToContext(data: IQuestSave, save: API.ISaveContext) {
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
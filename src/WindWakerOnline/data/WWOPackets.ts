import {
  Packet,
  packetHelper,
  UDPPacket,
} from 'modloader64_api/ModLoaderDefaultImpls';
import { InventorySave, QuestSave } from './WWOSaveData';
import * as API from 'WindWaker/API/Imports';
import { INetworkPlayer } from 'modloader64_api/NetworkHandler';


export class WWO_SubscreenSyncPacket extends Packet {
  inventory: InventorySave;
  quest: QuestSave;
  constructor(
    save: InventorySave,
    quest: QuestSave,
    lobby: string
  ) {
    super('WWO_SubscreenSyncPacket', 'WWOnline', lobby, false);
    this.inventory = save;
    this.quest = quest;
  }
}


export class WWO_DownloadResponsePacket extends Packet {
  subscreen: WWO_SubscreenSyncPacket;
  questData: WWO_ServerFlagUpdate;
  constructor(
    subscreen: WWO_SubscreenSyncPacket,
    questData: WWO_ServerFlagUpdate,
    lobby: string
  ) {
    super('WWO_DownloadResponsePacket', 'WWOnline', lobby, false);
    this.subscreen = subscreen;
    this.questData = questData;
  }
}

export class WWO_ScenePacket extends Packet {
  scene: string;
  constructor(lobby: string, scene: string) {
    super('WWO_ScenePacket', 'WWOnline', lobby, true);
    this.scene = scene;
  }
}

export class WWO_SceneRequestPacket extends Packet {
  constructor(lobby: string) {
    super('WWO_SceneRequestPacket', 'WWOnline', lobby, true);
  }
}

export class WWO_DownloadResponsePacket2 extends Packet {
  constructor(lobby: string) {
    super('WWO_DownloadResponsePacket2', 'WWOnline', lobby, false);
  }
}

export class WWO_DownloadRequestPacket extends Packet {
  constructor(lobby: string) {
    super('WWO_DownloadRequestPacket', 'WWOnline', lobby, false);
  }
}


export class WWO_ClientFlagUpdate extends Packet {
  swordLevel: any;
  shieldLevel: any;
  bracelet: any;
  pirate_charm: any;
  hero_charm: any;
  sectors: any;
  dec_tri: any;
  pearls: any;
  song: any;
  triforce: any;
  compChart: any;
  openChart: any;
  ownChart: any;
  spoils_slots: any;
  bait_slots: any;
  delivery_slots: any;
  owned_delivery: any;
  owned_spoils: any;
  owned_bait: any;
  count_spoils: any;
  count_delivery: any;
  count_bait: any;

  constructor(
    swordLevel: any,
    shieldLevel: any,
    bracelet: any,
    pirate_charm: any,
    hero_charm: any,
    sectors: any,
    dec_tri: any,
    pearls: any,
    song: any,
    triforce: any,
    compChart: any,
    openChart: any,
    ownChart: any,
    spoils_slots: any,
    bait_slots: any,
    delivery_slots: any,
    owned_delivery: any,
    owned_spoils: any,
    owned_bait: any,
    count_spoils: any,
    count_delivery: any,
    count_bait: any,
    lobby: string
  ) {
    super('WWO_ClientFlagUpdate', 'WWOnline', lobby, false);
    this.swordLevel = swordLevel;
    this.shieldLevel = shieldLevel;
    this.bracelet = bracelet;
    this.pirate_charm = pirate_charm;
    this.hero_charm = hero_charm;
    this.sectors = sectors;
    this.dec_tri = dec_tri;
    this.pearls = pearls;
    this.song = song;
    this.triforce = triforce;
    this.compChart = compChart;
    this.openChart = openChart;
    this.ownChart = ownChart;
    this.spoils_slots = spoils_slots;
    this.bait_slots = bait_slots;
    this.delivery_slots = delivery_slots;
    this.owned_delivery = owned_delivery;
    this.owned_spoils = owned_spoils;
    this.owned_bait = owned_bait;
    this.count_spoils = count_spoils;
    this.count_delivery = count_delivery;
    this.count_bait = count_bait;
  }
}

export class WWO_ServerFlagUpdate extends Packet {
  swordLevel: any;
  shieldLevel: any;
  bracelet: any;
  pirate_charm: any;
  hero_charm: any;
  sectors: any;
  dec_tri: any;
  pearls: any;
  song: any;
  triforce: any;
  compChart: any;
  openChart: any;
  ownChart: any;
  spoils_slots: any;
  bait_slots: any;
  delivery_slots: any;
  owned_delivery: any;
  owned_spoils: any;
  owned_bait: any;
  count_spoils: any;
  count_delivery: any;
  count_bait: any;
  constructor(
    swordLevel: any,
    shieldLevel: any,
    bracelet: any,
    pirate_charm: any,
    hero_charm: any,
    sectors: any,
    dec_tri: any,
    pearls: any,
    song: any,
    triforce: any,
    compChart: any,
    openChart: any,
    ownChart: any,
    spoils_slots: any,
    bait_slots: any,
    delivery_slots: any,
    owned_delivery: any,
    owned_spoils: any,
    owned_bait: any,
    count_spoils: any,
    count_delivery: any,
    count_bait: any,
    lobby: string
  ) {
    super('WWO_ServerFlagUpdate', 'WWOnline', lobby, false);
    this.swordLevel = swordLevel;
    this.shieldLevel = shieldLevel;
    this.bracelet = bracelet;
    this.pirate_charm = pirate_charm;
    this.hero_charm = hero_charm;
    this.sectors = sectors;
    this.dec_tri = dec_tri;
    this.pearls = pearls;
    this.song = song;
    this.triforce = triforce;
    this.compChart = compChart;
    this.openChart = openChart;
    this.ownChart = ownChart;
    this.spoils_slots = spoils_slots;
    this.bait_slots = bait_slots;
    this.delivery_slots = delivery_slots;
    this.owned_delivery = owned_delivery;
    this.owned_spoils = owned_spoils;
    this.owned_bait = owned_bait;
    this.count_spoils = count_spoils;
    this.count_delivery = count_delivery;
    this.count_bait = count_bait;
  }
}
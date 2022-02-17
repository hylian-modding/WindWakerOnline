import { PuppetData } from '@WindWakerOnline/puppet/PuppetData';
import {
  Packet, UDPPacket
} from 'modloader64_api/ModLoaderDefaultImpls';
import { INetworkPlayer } from 'modloader64_api/NetworkHandler';

export class PacketWithTimeStamp extends Packet{
  timestamp: number = Date.now();
}

export class WWO_BottleUpdatePacket extends Packet {
  slot: number;
  contents: number;

  constructor(slot: number, contents: number, lobby: string) {
    super('WWO_BottleUpdatePacket', 'WWOnline', lobby, true);
    this.slot = slot;
    this.contents = contents;
  }
}

export class WWO_RupeePacket extends PacketWithTimeStamp {
  delta: number;

  constructor(delta: number, lobby: string){
    super('WWO_RingPacket', 'WWOnline', lobby, true);
    this.delta = delta;
  }
}

export class WWO_ScenePacket extends Packet {
  scene: string;

  constructor(lobby: string, scene: string) {
    super('WWO_ScenePacket', 'WWOnline', lobby, true);
    this.scene = scene;
  }
}

export class WWO_RoomPacket extends Packet {
  scene: string;
  room: number;

  constructor(lobby: string, scene: string, room: number) {
    super('WWO_RoomPacket', 'WWOnline', lobby, true);
    this.scene = scene;
    this.room = room;
  }
}

export class WWO_SceneRequestPacket extends Packet {
  constructor(lobby: string) {
    super('WWO_SceneRequestPacket', 'WWOnline', lobby, true);
  }
}

export class WWO_DownloadResponsePacket extends Packet {

  save?: Buffer;
  host: boolean;

  constructor(lobby: string, host: boolean) {
    super('WWO_DownloadResponsePacket', 'WWOnline', lobby, false);
    this.host = host;
  }
}

export class WWO_DownloadRequestPacket extends Packet {

  save: Buffer;

  constructor(lobby: string, save: Buffer) {
    super('WWO_DownloadRequestPacket', 'WWOnline', lobby, false);
    this.save = save;
  }
}

export class WWO_UpdateSaveDataPacket extends Packet {

  save: Buffer;
  world: number;

  constructor(lobby: string, save: Buffer, world: number) {
    super('WWO_UpdateSaveDataPacket', 'WWOnline', lobby, false);
    this.save = save;
    this.world = world;
  }
}

export class WWO_ErrorPacket extends Packet{

  message: string;

  constructor(msg: string, lobby: string){
    super('WWO_ErrorPacket', 'WWO', lobby, false);
    this.message = msg;
  }

}

export class WWO_ClientFlagUpdate extends Packet {
  swordLevel: Buffer;
  shieldLevel: Buffer;
  bracelet: Buffer;
  pirate_charm: Buffer;
  hero_charm: Buffer;
  sectors: Buffer;
  dec_tri: Buffer;
  pearls: Buffer;
  song: Buffer;
  triforce: Buffer;
  compChart: Buffer;
  openChart: Buffer;
  ownChart: Buffer;
  spoils_slots: Buffer;
  bait_slots: Buffer;
  delivery_slots: Buffer;
  owned_delivery: Buffer;
  owned_spoils: Buffer;
  owned_bait: Buffer;
  count_spoils: Buffer;
  count_delivery: Buffer;
  count_bait: Buffer;

  constructor(
    swordLevel: Buffer,
    shieldLevel: Buffer,
    bracelet: Buffer,
    pirate_charm: Buffer,
    hero_charm: Buffer,
    sectors: Buffer,
    dec_tri: Buffer,
    pearls: Buffer,
    song: Buffer,
    triforce: Buffer,
    compChart: Buffer,
    openChart: Buffer,
    ownChart: Buffer,
    spoils_slots: Buffer,
    bait_slots: Buffer,
    delivery_slots: Buffer,
    owned_delivery: Buffer,
    owned_spoils: Buffer,
    owned_bait: Buffer,
    count_spoils: Buffer,
    count_delivery: Buffer,
    count_bait: Buffer,
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

export class WWO_PuppetPacket {
  data: PuppetData;

  constructor(puppetData: PuppetData, lobby: string) {
    this.data = puppetData;
  }
}

export class WWO_PuppetWrapperPacket extends UDPPacket {

  data: string;

  constructor(packet: WWO_PuppetPacket, lobby: string) {
    super('WWO_PuppetPacket', 'WWO', lobby, false);
    this.data = JSON.stringify(packet);
  }
}
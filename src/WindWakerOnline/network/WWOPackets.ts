import { PuppetData } from '@WindWakerOnline/puppet/PuppetData';
import {
  Packet, UDPPacket
} from 'modloader64_api/ModLoaderDefaultImpls';
import { INetworkPlayer } from 'modloader64_api/NetworkHandler';

export class PacketWithTimeStamp extends Packet {
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
  constructor(delta: number, lobby: string) {
    super('WWO_RupeePacket', 'WWOnline', lobby, false);
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

export class WWO_ErrorPacket extends Packet {

  message: string;

  constructor(msg: string, lobby: string) {
    super('WWO_ErrorPacket', 'WWO', lobby, false);
    this.message = msg;
  }

}

export class WWO_FlagUpdate extends Packet {
  dSv_event_c_save?: Buffer;
  dSv_event_c?: Buffer;
  dSv_memory_c_save?: Buffer;
  dSv_memory_c?: Buffer;
  dSv_zone_c_actor?: Buffer;
  dSv_zone_c_zoneBit?: Buffer;

  constructor(
    lobby: string,
    dSv_event_c_save?: Buffer,
    dSv_event_c?: Buffer,
    dSv_memory_c_save?: Buffer,
    dSv_memory_c?: Buffer,
    dSv_zone_c_actor?: Buffer,
    dSv_zone_c_zoneBit?: Buffer,
  ) {
    super('WWO_FlagUpdate', 'WWOnline', lobby, false);
    this.dSv_event_c_save = dSv_event_c_save;
    this.dSv_event_c = dSv_event_c;
    this.dSv_memory_c_save = dSv_memory_c_save;
    this.dSv_memory_c = dSv_memory_c;
    this.dSv_zone_c_actor = dSv_zone_c_actor;
    this.dSv_zone_c_zoneBit = dSv_zone_c_zoneBit;
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

export class WWO_ClientSceneContextUpdate extends Packet {
  chests: Buffer;
  switches: Buffer;
  collect: Buffer;
  scene: string;
  world: number;

  constructor(
    chests: Buffer,
    switches: Buffer,
    collect: Buffer,
    lobby: string,
    scene: string,
    world: number
  ) {
    super('WWO_ClientSceneContextUpdate', 'WWOnline', lobby, false);
    this.chests = chests;
    this.switches = switches;
    this.collect = collect;
    this.scene = scene;
    this.world = world;
  }
}
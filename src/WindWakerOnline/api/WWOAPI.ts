import { IPacketHeader, INetworkPlayer } from 'modloader64_api/NetworkHandler';
import { bus } from 'modloader64_api/EventHandler';
import { Packet } from 'modloader64_api/ModLoaderDefaultImpls';
import { WWOnlineStorageClient } from '../storage/WWOnlineStorageClient';
import { Puppet } from '../puppet/Puppet';

export enum WWOEvents {
  SERVER_PLAYER_CHANGED_SCENES = 'WWOnline:onServerPlayerChangedScenes',
  SERVER_PLAYER_CHANGED_ROOMS = 'WWOnline:onServerPlayerChangedRooms',
  CLIENT_REMOTE_PLAYER_CHANGED_SCENES = 'WWOnline:onRemotePlayerChangedScenes',
  ON_INVENTORY_UPDATE = 'WWOnline:OnInventoryUpdate',
  SAVE_DATA_ITEM_SET = 'WWOnline:SAVE_DATA_ITEM_SET',
  PLAYER_PUPPET_PRESPAWN = 'WWOnline:onPlayerPuppetPreSpawned',
  PLAYER_PUPPET_SPAWNED = 'WWOnline:onPlayerPuppetSpawned',
  PLAYER_PUPPET_DESPAWNED = 'WWOnline:onPlayerPuppetDespawned',
  PLAYER_PUPPET_QUERY = "WWOnline:PlayerPuppetQuery",
  GAINED_HEART_CONTAINER = 'WWOnline:GainedHeartContainer',
  GAINED_PIECE_OF_HEART = 'WWOnline:GainedPieceOfHeart',
  MAGIC_METER_INCREASED = 'WWOnline:GainedMagicMeter',
  ON_REMOTE_PLAY_SOUND = "WWOnline:OnRemotePlaySound",
  ON_LOADING_ZONE = "WWOnline:OnLoadingZone"
}

export class WWOPlayerScene {
  player: INetworkPlayer;
  lobby: string;
  scene: string;

  constructor(player: INetworkPlayer, lobby: string, scene: string) {
    this.player = player;
    this.scene = scene;
    this.lobby = lobby;
  }
}

export class WWOPlayerRoom {
  player: INetworkPlayer;
  lobby: string;
  room: number;

  constructor(player: INetworkPlayer, lobby: string, room: number) {
    this.player = player;
    this.room = room;
    this.lobby = lobby;
  }
}

export class WWOSaveDataItemSet {
  key: string;
  value: boolean | number | Buffer;

  constructor(key: string, value: boolean | number | Buffer) {
    this.key = key;
    this.value = value;
  }
}

export interface IWWOnlineHelpers {
  sendPacketToPlayersInScene(packet: IPacketHeader): void;
  getClientStorage(): WWOnlineStorageClient | null;
}

export interface PuppetQuery {
  puppet: Puppet | undefined;
  player: INetworkPlayer;
}

export function WWOnlineAPI_QueryPuppet(player: INetworkPlayer): PuppetQuery {
  let evt: PuppetQuery = { puppet: undefined, player } as PuppetQuery;
  bus.emit(WWOEvents.PLAYER_PUPPET_QUERY, evt);
  return evt;
}

export class RemoteSoundPlayRequest {

  player: INetworkPlayer;
  puppet: any;
  sound_id: number;
  isCanceled: boolean = false;

  constructor(player: INetworkPlayer, puppet: any, sound_id: number) {
    this.player = player;
    this.puppet = puppet;
    this.sound_id = sound_id;
  }

}

export const enum Command{
  COMMAND_TYPE_NONE,
  COMMAND_TYPE_PUPPET_SPAWN,
  COMMAND_TYPE_PUPPET_DESPAWN,
  COMMAND_TYPE_COUNT
}

export interface ICommandBuffer {
  runCommand(command: Command, data: Buffer, uuid?: number): number;
}

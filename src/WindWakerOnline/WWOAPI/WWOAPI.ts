import { IPacketHeader, INetworkPlayer } from 'modloader64_api/NetworkHandler';
import { bus } from 'modloader64_api/EventHandler';
import { Packet } from 'modloader64_api/ModLoaderDefaultImpls';
import { WWOnlineStorageClient } from '../WWOnlineStorageClient';

export enum WWOEvents {
  SERVER_PLAYER_CHANGED_SCENES = 'WWOnline:onServerPlayerChangedScenes',
  CLIENT_REMOTE_PLAYER_CHANGED_SCENES = 'WWOnline:onRemotePlayerChangedScenes',
  GAINED_HEART_CONTAINER = 'WWOnline:GainedHeartContainer',
  GAINED_PIECE_OF_HEART = 'WWOnline:GainedPieceOfHeart',
  MAGIC_METER_INCREASED = 'WWOnline:GainedMagicMeter',
  ON_INVENTORY_UPDATE = 'WWOnline:OnInventoryUpdate',
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

export interface IWWOnlineHelpers {
  sendPacketToPlayersInScene(packet: IPacketHeader): void;
  getClientStorage(): WWOnlineStorageClient | null;
}
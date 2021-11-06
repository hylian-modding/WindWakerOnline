import { PuppetData } from './PuppetData';
import { INetworkPlayer } from 'modloader64_api/NetworkHandler';
import { bus, EventHandler } from 'modloader64_api/EventHandler';
import { IModLoaderAPI, ModLoaderEvents } from 'modloader64_api/IModLoaderAPI';
import Vector3 from 'modloader64_api/math/Vector3';
import fs from 'fs';
import path from 'path';

import { IWWCore, WWEvents } from 'WindWaker/API/WWAPI';
import WWOnline from '../../WindWakerOnline';
import { Command, ICommandBuffer, IWWOnlineHelpers, RemoteSoundPlayRequest, WWOEvents } from '../api/WWOAPI';
import { CommandBuffer, instance } from './CommandBuffer';

export class Puppet {
  player: INetworkPlayer;
  id: string;
  data: PuppetData;
  commandBuffer: ICommandBuffer;
  isSpawned = false;
  isSpawning = false;
  isShoveled = false;
  scene: string;
  core: IWWCore;
  void!: Vector3;
  ModLoader: IModLoaderAPI;
  parent: IWWOnlineHelpers;
  tunic_color!: number;
  spawnHandle: any = undefined;
  tossedPackets: number = -1;
  uniqueID: number = -1;

  constructor(
    player: INetworkPlayer,
    core: IWWCore,
    pointer: number,
    ModLoader: IModLoaderAPI,
    parent: IWWOnlineHelpers,

  ) {
    this.player = player;
    this.data = new PuppetData(pointer, ModLoader, core, parent.getClientStorage()!);
    this.commandBuffer = new CommandBuffer(ModLoader);
    this.scene = "sea_T";
    this.ModLoader = ModLoader;
    this.core = core;
    this.id = this.ModLoader.utils.getUUID();
    this.parent = parent;
  }


  debug_movePuppetToPlayer() {
    let t = JSON.stringify(this.data);
    let copy = JSON.parse(t);
    Object.keys(copy).forEach((key: string) => {
      (this.data as any)[key] = copy[key];
    });
  }

  doNotDespawnMe(p: number) {
  }

  prevLastEntityPtr: number = 0x0;

  spawn(spawnIndex: number) {
    if (this.isShoveled) {
      this.isShoveled = false;
      this.ModLoader.logger.debug('Puppet resurrected.');
      return;
    }
    if (this.core.helper.isLinkControllable() && !this.isSpawned && !this.isSpawning && this.spawnHandle === undefined) {
      bus.emit(WWOEvents.PLAYER_PUPPET_PRESPAWN, this);

      this.isSpawning = true;

      console.log("Attempting to spawn puppet with spawnIndex unique id " + spawnIndex);
      this.commandBuffer.runCommand(Command.COMMAND_TYPE_PUPPET_SPAWN, Buffer.alloc(0), spawnIndex)
    }
  }

  processIncomingPuppetData(data: PuppetData, remote: RemoteSoundPlayRequest) {
    if (this.isSpawned && !this.isShoveled && this.tossedPackets > 100) {
      Object.keys(data).forEach((key: string) => {
        if (key === "sound") {
          if (!remote.isCanceled) {
            (this.data as any)[key] = (data as any)[key];
          }
        } else {
          (this.data as any)[key] = (data as any)[key];
        }
      });
    }
    if (this.tossedPackets <= 100) {
      this.tossedPackets++;
    }
  }

  shovel() {
    if (this.isSpawned) {
      if (this.data.pointer > 0) {
        this.ModLoader.math.rdramWriteV3(this.data.pointer + 0x1F8, this.void);
        this.ModLoader.logger.debug('Puppet ' + this.id + ' shoveled.');
        this.isShoveled = true;
      }
    }
  }

  despawn() {
    if (this.isSpawned) {
      if (this.data.pointer > 0) {
        let pointer = Buffer.alloc(8);
        pointer.writeUInt32BE(this.data.pointer, 0);
        this.commandBuffer.runCommand(Command.COMMAND_TYPE_PUPPET_DESPAWN, pointer, 0)
        this.data.pointer = 0;
      }
      this.isSpawned = false;
      this.isShoveled = false;
      this.ModLoader.logger.debug('Puppet ' + this.id + ' despawned.');
      bus.emit(WWOEvents.PLAYER_PUPPET_DESPAWNED, this);
    }
  }
}

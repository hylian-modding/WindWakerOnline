import { PuppetData } from './PuppetData';
import { INetworkPlayer } from 'modloader64_api/NetworkHandler';
import { Command } from 'modloader64_api/OOT/ICommandBuffer';
import { bus, EventHandler } from 'modloader64_api/EventHandler';
import { IModLoaderAPI, ModLoaderEvents } from 'modloader64_api/IModLoaderAPI';
import Vector3 from 'modloader64_api/math/Vector3';
import fs from 'fs';
import path from 'path';

import { IWWCore, WWEvents } from 'WindWaker/API/WWAPI';
import WWOnline from '../../WindWakerOnline';
import { IWWOnlineHelpers, RemoteSoundPlayRequest, WWOEvents } from '../../WWOAPI/WWOAPI';

export class Puppet {
  player: INetworkPlayer;
  id: string;
  data: PuppetData;
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
  fakeData: PuppetData;

  constructor(
    player: INetworkPlayer,
    core: IWWCore,
    pointer: number,
    ModLoader: IModLoaderAPI,
    parent: IWWOnlineHelpers,

  ) {
    this.player = player;
    this.data = new PuppetData(pointer, ModLoader, core, parent.getClientStorage()!);
    this.fakeData = new PuppetData(pointer, ModLoader, core, parent.getClientStorage()!);
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

  isLastEntityPuppet(): boolean {
    let entityPtr = this.ModLoader.emulator.rdramRead32(0x8037202C);

    entityPtr -= 0xC4;

    if (this.prevLastEntityPtr == entityPtr) {
      return false;
    }

    let entityID = this.ModLoader.emulator.rdramRead16(entityPtr + 0x08);
    this.prevLastEntityPtr = entityPtr;

    return entityID === 0x00B5;
  }

  getLastEntityPtr() {
    let entityPtr = this.ModLoader.emulator.rdramRead32(0x8037202C);
    entityPtr -= 0xC4;
    return entityPtr;
  }

  spawn() {
    if (this.isShoveled) {
      this.isShoveled = false;
      this.ModLoader.logger.debug('Puppet resurrected.');
      return;
    }
    if (this.core.helper.isLinkControllable() && !this.isSpawned && !this.isSpawning && this.spawnHandle === undefined) {
      bus.emit(WWOEvents.PLAYER_PUPPET_PRESPAWN, this);

      this.isSpawning = true;
      this.data.pointer = 0x0;
      this.ModLoader.emulator.rdramWrite16(0x81801000, 0x00B5);
      let currentScene = this.core.global.current_scene_name;

      this.spawnHandle = this.ModLoader.utils.setIntervalFrames(() => {
        if (this.isLastEntityPuppet() && currentScene === this.core.global.current_scene_name) {
          this.data.pointer = this.getLastEntityPtr();
          console.log("this.data.pointer: " + this.data.pointer.toString(16));

          this.doNotDespawnMe(this.data.pointer);

          this.void = this.ModLoader.math.rdramReadV3(this.data.pointer + 0x1F8);

          this.ModLoader.utils.clearIntervalFrames(this.spawnHandle);
          this.spawnHandle = undefined;

          this.isSpawned = true;
          this.isSpawning = false;
          bus.emit(WWOEvents.PLAYER_PUPPET_SPAWNED, this);
        }
      }, 100);
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
        this.data.pointer = 0;
      }
      this.isSpawned = false;
      this.isShoveled = false;
      this.ModLoader.logger.debug('Puppet ' + this.id + ' despawned.');
      bus.emit(WWOEvents.PLAYER_PUPPET_DESPAWNED, this);
    }
  }
}

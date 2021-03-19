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
  puppetArray: Buffer = Buffer.alloc(0x58);

  constructor(
    player: INetworkPlayer,
    core: IWWCore,
    pointer: number,
    ModLoader: IModLoaderAPI,
    parent: IWWOnlineHelpers,

  ) {
    this.player = player;
    this.data = new PuppetData(pointer, ModLoader, core, parent.getClientStorage()!);
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

  getLastEntityPtr() {
    let entityPtr = this.ModLoader.emulator.rdramRead32(0x8037202C);
    entityPtr -= 0xC4;
    return entityPtr;
  }

  @EventHandler(WWEvents.ON_SCENE_CHANGE)
  spawnUtility() {
    this.ModLoader.emulator.rdramWrite16(0x81801000, 0x004C); //Utility Actor used to handle all in-game needs
  }

  spawnPuppet() {
    if (this.isShoveled) {
      this.isShoveled = false;
      this.ModLoader.logger.debug('Puppet resurrected.');
      return;
    }
    if (this.core.helper.isLinkControllable() && !this.isSpawned && !this.isSpawning && this.spawnHandle === undefined) {
      bus.emit(WWOEvents.PLAYER_PUPPET_PRESPAWN, this);

      this.isSpawning = true;
      this.data.pointer = 0x0;
      this.ModLoader.emulator.rdramWrite32(0x81801004, 0x01); //Utility Actor: Spawn Puppet
      let currentScene = this.core.global.current_scene_name;

      this.spawnHandle = this.ModLoader.utils.setIntervalFrames(() => {
        if (currentScene === this.core.global.current_scene_name) {
          this.data.pointer = this.ModLoader.emulator.rdramRead32(0x81801008); //Immediate Puppet Pointer
          console.log("this.data.pointer: " + this.data.pointer.toString(16));

          let nextIndex = this.puppetArray.indexOf(0x00000000, 0);
          this.puppetArray[nextIndex] = this.data.pointer; //Set the puppet pointer into the next available index of `puppetArray: Buffer = Buffer.alloc(0x58);`

          this.doNotDespawnMe(this.data.pointer);

          this.void = this.ModLoader.math.rdramReadV3(this.data.pointer + 0x1F8);

          this.ModLoader.utils.clearIntervalFrames(this.spawnHandle);
          this.spawnHandle = undefined;

          this.isSpawned = true;
          this.isSpawning = false;
          
          this.ModLoader.emulator.rdramWrite32(0x81801004, 0);
          this.ModLoader.emulator.rdramWrite32(0x81801008, 0);
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
      this.ModLoader.emulator.rdramWrite32(0x81801004,3); //Utility Actor: Despawn Individual Puppet
      this.ModLoader.emulator.rdramWrite32(0x8180100C,this.data.pointer); //Utility Actor: Despawn Individual Puppet
      if (this.data.pointer > 0) {
        this.data.pointer = 0;
      }
      this.isSpawned = false;
      this.isShoveled = false;
      this.ModLoader.logger.debug('Puppet ' + this.id + ' despawned.');
      bus.emit(WWOEvents.PLAYER_PUPPET_DESPAWNED, this);
    }
  }
  
  @EventHandler(WWEvents.ON_LOADING_ZONE)
  despawn2(){
    this.ModLoader.emulator.rdramWrite32(0x81801004,2); //Utility Actor: Despawn All Puppet
    this.ModLoader.emulator.rdramWrite32(0x81801004,4); //Utility Actor: Despawn Utility Actor
    bus.emit(WWOEvents.PLAYER_PUPPET_DESPAWNED, this);
  }
}

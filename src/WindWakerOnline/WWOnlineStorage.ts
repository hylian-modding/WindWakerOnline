import { WWOnlineStorageBase } from './WWOnlineStorageBase';

export class WWOnlineStorage extends WWOnlineStorageBase {
  networkPlayerInstances: any = {};
  players: any = {};
  saveGameSetup = false;
}
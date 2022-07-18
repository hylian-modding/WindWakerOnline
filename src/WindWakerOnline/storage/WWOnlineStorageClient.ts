import { WWOnlineStorageBase } from './WWOnlineStorageBase';
import * as API from 'WindWaker/API/WWAPI'
export class WWOnlineStorageClient extends WWOnlineStorageBase {
  world: number = 0;
  first_time_sync = false;
  lastPushHash = "!";
  localization: any = {};
  localization_island: any = {};
  scene_keys: any = {};
  bottleCache: API.InventoryItem[] = [
    API.InventoryItem.NONE,
    API.InventoryItem.NONE,
    API.InventoryItem.NONE,
    API.InventoryItem.NONE,
  ];
  room_keys: any = {};
  flagHash: string = "";
  //scaledDistances: Map<string, number> = new Map<string, number>();
}

import { WWOnlineStorageBase } from './WWOnlineStorageBase';
import { Texture } from 'modloader64_api/Sylvain/Gfx';
import { vec2, xy } from 'modloader64_api/Sylvain/vec';
import * as API from 'WindWaker/API/Imports';

export class WWOnlineStorageClient extends WWOnlineStorageBase {
  autoSaveHash = '!';
  needs_update = false;
  lastKnownSkullCount = -1;
  bottleCache: API.InventoryItem[] = [
    API.InventoryItem.NONE,
    API.InventoryItem.NONE,
    API.InventoryItem.NONE,
    API.InventoryItem.NONE,
  ];
  localization: any = {};
  scene_keys: any = {};
  room_keys: any = {};
  first_time_sync = false;
  flagHash: string = "";
}
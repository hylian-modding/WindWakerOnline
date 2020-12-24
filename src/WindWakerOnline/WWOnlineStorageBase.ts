import {
  InventorySave,
  QuestSave,
} from './data/WWOSaveData';

export class WWOnlineStorageBase {
  constructor() {}
  inventoryStorage: InventorySave = new InventorySave();
  questStorage: QuestSave = new QuestSave();
}
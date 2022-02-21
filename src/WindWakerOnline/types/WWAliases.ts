import { IInventoryFields, ISaveContext } from "WindWaker/API/WWAPI";

export interface IWWOSyncSave extends Pick<ISaveContext, 'inventory' | 'questStatus' | 'swords' | 'shields'> {

}
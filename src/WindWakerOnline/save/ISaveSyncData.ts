import { ProxySide } from "modloader64_api/SidedProxy/SidedProxy";
import { IWWOSyncSave } from "../types/WWAliases";

export interface ISaveSyncData {
    hash: string;
    createSave(): Buffer;
    forceOverrideSave(save: Buffer, storage: IWWOSyncSave, side: ProxySide): void;
    mergeSave(save: Buffer, storage: IWWOSyncSave, side: ProxySide): Promise<boolean>;
    applySave(save: Buffer): void;
}

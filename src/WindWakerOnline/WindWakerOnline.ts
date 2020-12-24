import { IPlugin, IModLoaderAPI, IPluginServerConfig } from 'modloader64_api/IModLoaderAPI';
import { InjectCore } from 'modloader64_api/CoreInjection';
import * as API from 'WindWaker/API/Imports'
import { bus } from 'modloader64_api/EventHandler';
import fs from 'fs';
import path from 'path';
import { ProxySide, SidedProxy } from 'modloader64_api/SidedProxy/SidedProxy';
import { WWOnlineClient } from './WWOnlineClient';
import { WWOnlineServer } from './WWOnlineServer';
import { IPacketHeader } from 'modloader64_api/NetworkHandler';
import { WWOnlineStorageClient } from './WWOnlineStorageClient';
import { IWWOnlineHelpers } from './WWOAPI/WWOAPI';

export interface IWWOnlineLobbyConfig {
    data_syncing: boolean;
}

export class WWOnlineConfigCategory {

}

class WindWakerOnline implements IPlugin, IWWOnlineHelpers, IPluginServerConfig {

    ModLoader!: IModLoaderAPI;
    pluginName?: string | undefined;
    @InjectCore()
    core!: API.IWWCore;
    @SidedProxy(ProxySide.CLIENT, WWOnlineClient)
    client!: WWOnlineClient;
    @SidedProxy(ProxySide.SERVER, WWOnlineServer)
    server!: WWOnlineServer;
    
    // Storage
    LobbyConfig: IWWOnlineLobbyConfig = {} as IWWOnlineLobbyConfig;
    clientStorage: WWOnlineStorageClient = new WWOnlineStorageClient();

    sendPacketToPlayersInScene(packet: IPacketHeader): void {
        if (this.server !== undefined) {
            this.server.sendPacketToPlayersInScene(packet);
        }
    }

    getClientStorage(): WWOnlineStorageClient | null {
        return this.client !== undefined ? this.client.clientStorage : null;
    }

    canWriteDataSafely(): boolean {
        return !(!this.core.helper.isLinkControllable() || !this.core.helper.isLinkExists() ||
            this.core.helper.isTitleScreen() || !this.core.helper.isSceneNameValid() ||
            this.core.helper.isPaused());
    }

    preinit(): void {
        if (this.client !== undefined) this.client.clientStorage = this.clientStorage;
    }
    init(): void {
    }
    postinit(): void {
    }
    onTick(frame?: number | undefined): void {
        if (!this.canWriteDataSafely()) return;
        
    }

    getServerURL(): string {
        return "192.99.70.23:8010";
    }
}

module.exports = WindWakerOnline;

export default WindWakerOnline;
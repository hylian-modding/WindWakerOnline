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
        this.ModLoader.emulator.rdramWrite32(0x80234BF8, 0x495CB408);

        const customCode1 = Buffer.from(

            [0x3E, 0xA0, 0x81, 0x80, 0x3A, 0xB5, 0x10, 0x00, 0xA0, 0x75, 0x00, 0x00,
                0x2C, 0x03, 0x00, 0x00, 0x41, 0x82, 0x00, 0x3C, 0x38, 0x80, 0x00, 0x00, 0x3C,
                0xA0, 0x80, 0x3E, 0x38, 0xA5, 0x44, 0x0C, 0x3C, 0xC0, 0x80, 0x3F, 0x38, 0xC6,
                0x6A, 0x78, 0x88, 0xC6, 0x00, 0x00, 0x38, 0xE0, 0x00, 0x00, 0x39, 0x00, 0x00,
                0x00, 0x39, 0x20, 0x00, 0x00, 0x39, 0x40, 0x00, 0x00, 0x3E, 0x80, 0x80, 0x02,
                0x3A, 0x94, 0x45, 0x1C, 0x7E, 0x89, 0x03, 0xA6, 0x4E, 0x80, 0x04, 0x21, 0x3A,
                0xC0, 0x00, 0x00, 0xB2, 0xD5, 0x00, 0x00, 0xA8, 0x1B, 0x00, 0x08, 0x3C, 0x60,
                0x80, 0x23, 0x38, 0x63, 0x4B, 0xFC, 0x7C, 0x69, 0x03, 0xA6, 0x4E, 0x80, 0x04,
                0x21]

        );

        this.ModLoader.emulator.rdramWriteBuffer(0x81800000, customCode1);
        //this.ModLoader.emulator.rdramWriteBuffer(0x81802000, customCode2);

        if (!this.canWriteDataSafely()) return;
    }

    getServerURL(): string {
        return "192.99.70.23:8010";
    }
}

module.exports = WindWakerOnline;

export default WindWakerOnline;
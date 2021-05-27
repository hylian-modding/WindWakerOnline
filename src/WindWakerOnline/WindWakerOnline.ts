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
    ItemCountSync: boolean = true;
    EnablePuppets: boolean = true;
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
        if (this.ModLoader.isServer) {
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

        const CommandBufferHook = Buffer.from("495CB408", 'hex');
        const CommandBufferFunc = Buffer.from("9421FFE07C0802A6900100249381001093A1001493C1001893E1001C3BC00000480000803BFF0001281F003F418100501D3F00183D408180394A10007D2A4A1481490C1081290C147D494B794082FFD83D208180392910001D5F00187D495214910A0C081D1E00307D2942148109001081290014910A0C10912A0C14281F0040408200781D5E00303D208180392910007D29521439400000914900083BDE00013D208180812910007C09F040408100A81D3E00303D408180394A10007D2A4A148109000828080001418200282808000240A2FFB41D3E00303D408180394A10007D2A4A148069001C480244794BFFFF983BE000004BFFFF343D20803F61296A7880C900001CBE003038A500103FA081803BBD10007CA5EA143B8000009381000839400000392000003900000038E5001838A5000C38800000386000B5480246151FFF00187FFDFA14939F0C18907F0C1C4BFFFF343D2081803940000091491000800100247C0803A68381001083A1001483C1001883E1001C382100204E800020011B033B0000001000000001FFFFFE80000000280000001000000000017A5200047C41011B0C01000000002800000018FFFFFE500000018000410E204611417F9C049D039E029F010253064145DFDEDDDC0E0000000246140002447881801000", 'hex');
        const SceneChangeHook = Buffer.from([0x49, 0x7A, 0xC9, 0x6C]);
        const SceneChangeFunc = Buffer.from([0x3E, 0x40, 0x81, 0x80, 0x3A, 0x52, 0x20, 0x00, 0x3A, 0x60, 0x00, 0x01,
            0x9A, 0x72, 0x00, 0x00, 0x39, 0x61, 0x00, 0x18, 0x3D, 0xE0, 0x80, 0x05, 0x39,
            0xEF, 0x38, 0x78, 0x7D, 0xE9, 0x03, 0xA6, 0x4E, 0x80, 0x04, 0x21]);
        this.ModLoader.emulator.rdramWriteBuffer(0x80234BF8, CommandBufferHook);
        this.ModLoader.emulator.rdramWriteBuffer(0x81800000, CommandBufferFunc);
        this.ModLoader.emulator.rdramWriteBuffer(0x80053874, SceneChangeHook);
        this.ModLoader.emulator.rdramWriteBuffer(0x818001E0, SceneChangeFunc);

        if (!this.canWriteDataSafely()) return;
    }

    getServerURL(): string {
        return "192.99.70.23:8010";
    }
}

module.exports = WindWakerOnline;

export default WindWakerOnline;
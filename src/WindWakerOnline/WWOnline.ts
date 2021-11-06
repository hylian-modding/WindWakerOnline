import { IPlugin, IModLoaderAPI, IPluginServerConfig } from 'modloader64_api/IModLoaderAPI';
import { InjectCore } from 'modloader64_api/CoreInjection';
import * as API from 'WindWaker/API/Imports'
import { bus } from 'modloader64_api/EventHandler';
import fs from 'fs';
import path from 'path';
import { ProxySide, SidedProxy } from 'modloader64_api/SidedProxy/SidedProxy';
import WWOnlineClient from './WWOnlineClient';
import WWOnlineServer from './WWOnlineServer';
import { IPacketHeader } from 'modloader64_api/NetworkHandler';
import { WWOnlineStorageClient } from './storage/WWOnlineStorageClient';
import { IWWOnlineHelpers } from './api/WWOAPI';

export interface IWWOnlineLobbyConfig {
    data_syncing: boolean;
}

export class WWOnlineConfigCategory {
    itemCountSync: boolean = false;
    enablePuppets: boolean = true;
    syncBottleContents: boolean = true;
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

        const CommandBufferHook = Buffer.from([0x49, 0x5C, 0xB4, 0x3D]);
        const CommandBufferFunc = Buffer.from("9421FFD07C0802A69001003493A1002493C1002893E1002C39200000912100084A8AE7FD3BC000003BE00000480000381FC800283BDE0A007FDE52143BDE000828080040408200A01D5F00283D208180392910007D29521439400000914900083BFF00013D208180812910007C09F8404081012C1D3F00283D408180394A10007D2A4A148129000828090001418200282809000240A2FFB41D3F00283D408180394A10007D2A4A14806900104A8243CD4BFFFF98390000002808003F41A1FF841D2800283D408180394A10007D2A4A1481290A0C2C09000041A2FF58390800014BFFFFD83920FFFF3900000038E0000038C000003D40803F614A6A7888AA00003C80803E6084440C386000004A8242157C7D1B784A83D8597FA7EB7838C0000038A00000388000B54A8407452C0300004182004C39200000913E0008913E000C913E0014907E00181D5F00283D008180390810007D485214814A000C915E001C913E00203940FFFF915E002439400003915E0000913E00044BFFFED03920FFFF913E00083D20DEAD6129DEAD913E000C39200000913E00144BFFFEB03D20818039400000914910003BE00000480000601D3F00283D408180394A10007D2A4A143881000880690A204A823FF9810100082C080000418200A81D3F00283D408180394A10007D2A4A1481490A2491490A0C3940000191490A0891090A103D40BEEF614ABEEF91490A143BFF0001281F003F4181008C1D3F00283D408180394A10007D2A4A1481290A08280900034082FFDC1D3F00283D408180394A10007D2A4A1481490A28394A000191490A28A0690A224A83E1612C03000041A2FF581D3F00283D408180394A10007D2A4A143D40DEAD614ABEEF91490A1C4BFFFF901D3F00283D408180394A10007D2A4A143D4000BA614ADBAD91490A1C4BFFFF7038600000800100347C0803A683A1002483C1002883E1002C382100304E80002000000000", 'hex');
        const SceneChangeHook = Buffer.from([0x49, 0x7A, 0xCC, 0x8C]);
        const SceneChangeFunc = Buffer.from([0x3E, 0x40, 0x81, 0x80, 0x3A, 0x52, 0x30, 0x00, 0x3A, 0x60, 0x00, 0x01,
            0x9A, 0x72, 0x00, 0x00, 0x39, 0x61, 0x00, 0x18, 0x3D, 0xE0, 0x80, 0x05, 0x39,
            0xEF, 0x38, 0x78, 0x7D, 0xE9, 0x03, 0xA6, 0x4E, 0x80, 0x04, 0x21]);
        this.ModLoader.emulator.rdramWriteBuffer(0x80234BC4, CommandBufferHook);
        this.ModLoader.emulator.rdramWriteBuffer(0x81800000, CommandBufferFunc);
        this.ModLoader.emulator.rdramWriteBuffer(0x80053874, SceneChangeHook);
        this.ModLoader.emulator.rdramWriteBuffer(0x81800500, SceneChangeFunc);

        if (!this.canWriteDataSafely()) return;
    }

    getServerURL(): string {
        return "192.99.70.23:8010";
    }
}

module.exports = WindWakerOnline;

export default WindWakerOnline;
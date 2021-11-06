import { WWOEvents, WWOPlayerScene, } from "./api/WWOAPI";
import path from "path";
import { InjectCore } from "modloader64_api/CoreInjection";
import { DiscordStatus } from "modloader64_api/Discord";
import { EventHandler, PrivateEventHandler, EventsClient, bus } from "modloader64_api/EventHandler";
import { IModLoaderAPI, IPlugin, ModLoaderEvents } from "modloader64_api/IModLoaderAPI";
import { ModLoaderAPIInject } from "modloader64_api/ModLoaderAPIInjector";
import { INetworkPlayer, LobbyData, NetworkHandler } from "modloader64_api/NetworkHandler";
import { Preinit, Init, Postinit, onTick } from "modloader64_api/PluginLifecycle";
import { ParentReference, SidedProxy, ProxySide } from "modloader64_api/SidedProxy/SidedProxy";
import { WWO_UpdateSaveDataPacket, WWO_DownloadRequestPacket, WWO_ScenePacket, WWO_SceneRequestPacket, WWO_DownloadResponsePacket, WWO_BottleUpdatePacket, WWO_ErrorPacket, WWO_ClientFlagUpdate, WWO_ServerFlagUpdate } from "./network/WWOPackets";
import { IWWOnlineLobbyConfig, WWOnlineConfigCategory } from "./WWOnline";
import { WWOSaveData } from "./save/WWOnlineSaveData";
import { WWOnlineStorage } from "./storage/WWOnlineStorage";
import { WWOnlineStorageClient } from "./storage/WWOnlineStorageClient";
import fs from 'fs';
import { WWO_PRIVATE_EVENTS } from "./api/InternalAPI";
import WWSerialize from "./storage/WWSerialize";
import { InventoryItem, IWWCore, WWEvents } from "WindWaker/API/WWAPI";
import { parseFlagChanges } from "./save/parseFlagChanges";
import * as API from "WindWaker/API/WWAPI";
import { PuppetOverlord } from "./puppet/PuppetOverlord";

export default class WWOnlineClient {
    @InjectCore()
    core!: IWWCore;

    @ModLoaderAPIInject()
    ModLoader!: IModLoaderAPI;

    @ParentReference()
    parent!: IPlugin;

    //@SidedProxy(ProxySide.CLIENT, PuppetOverlord)
    //puppets!: PuppetOverlord;

    LobbyConfig: IWWOnlineLobbyConfig = {} as IWWOnlineLobbyConfig;
    clientStorage: WWOnlineStorageClient = new WWOnlineStorageClient();
    config!: WWOnlineConfigCategory;

    syncContext: number = -1;
    syncTimer: number = 0;
    synctimerMax: number = 60 * 20;
    syncPending: boolean = false;

    lastMagicValue: number = 0xFF;

    @EventHandler(EventsClient.ON_PLAYER_JOIN)
    onPlayerJoined(player: INetworkPlayer) {
        this.clientStorage.players[player.uuid] = "-1";
        this.clientStorage.networkPlayerInstances[player.uuid] = player;
    }

    @EventHandler(EventsClient.ON_PLAYER_LEAVE)
    onPlayerLeave(player: INetworkPlayer) {
        delete this.clientStorage.players[player.uuid];
        delete this.clientStorage.networkPlayerInstances[player.uuid];
    }

    @Preinit()
    preinit() {
        this.config = this.ModLoader.config.registerConfigCategory("WWOnline") as WWOnlineConfigCategory;
        //if (this.puppets !== undefined) {
        //    this.puppets.clientStorage = this.clientStorage;
        //}
    }

    @Init()
    init(): void {
    }

    @Postinit()
    postinit() {
        //this.clientStorage.scene_keys = JSON.parse(fs.readFileSync(__dirname + '/localization/Scene_numbers.json').toString());
        //this.clientStorage.localization = JSON.parse(fs.readFileSync(__dirname + '/localization/en_US.json').toString());
        let status: DiscordStatus = new DiscordStatus('Playing WWOnline', 'On the title screen');
        status.smallImageKey = 'WWO';
        status.partyId = this.ModLoader.clientLobby;
        status.partyMax = 30;
        status.partySize = 1;
        this.ModLoader.gui.setDiscordStatus(status);
        this.clientStorage.saveManager = new WWOSaveData(this.core, this.ModLoader);
        this.ModLoader.utils.setIntervalFrames(() => {
            this.inventoryUpdateTick();
        }, 20);
    }

    updateInventory() {
        if (this.core.helper.isTitleScreen() || !this.core.helper.isSceneNameValid() || this.core.helper.isPaused() || !this.clientStorage.first_time_sync) return;
        if (this.syncTimer > this.synctimerMax) {
            this.clientStorage.lastPushHash = this.ModLoader.utils.hashBuffer(Buffer.from("RESET"));
            this.ModLoader.logger.debug("Forcing resync due to timeout.");
        }
        let save = this.clientStorage.saveManager.createSave();
        if (this.clientStorage.lastPushHash !== this.clientStorage.saveManager.hash) {
            this.ModLoader.privateBus.emit(WWO_PRIVATE_EVENTS.DOING_SYNC_CHECK, {});
            //this.ModLoader.privateBus.emit(WWO_PRIVATE_EVENTS.LOCK_ITEM_NOTIFICATIONS, {});
            this.ModLoader.clientSide.sendPacket(new WWO_UpdateSaveDataPacket(this.ModLoader.clientLobby, save, this.clientStorage.world));
            this.clientStorage.lastPushHash = this.clientStorage.saveManager.hash;
            this.syncTimer = 0;
        }
    }

    updateFlags() {

        Object.keys(this.core.save.questStatus).forEach((key: string) => {
            if (Buffer.isBuffer(this.core.save.questStatus[key])) {
                parseFlagChanges(this.core.save.questStatus[key], this.clientStorage.questStorage[key]);
            }
        })

        this.ModLoader.clientSide.sendPacket(new WWO_ClientFlagUpdate(
            this.clientStorage.questStorage.swordLevel,
            this.clientStorage.questStorage.shieldLevel,
            this.clientStorage.questStorage.bracelet,
            this.clientStorage.questStorage.pirate_charm,
            this.clientStorage.questStorage.hero_charm,
            this.clientStorage.questStorage.sectors,
            this.clientStorage.questStorage.deciphered_triforce,
            this.clientStorage.questStorage.pearls,
            this.clientStorage.questStorage.songs,
            this.clientStorage.questStorage.triforce,
            this.clientStorage.questStorage.completed_charts,
            this.clientStorage.questStorage.opened_charts,
            this.clientStorage.questStorage.owned_charts,
            this.clientStorage.inventoryStorage.spoils_slots,
            this.clientStorage.inventoryStorage.bait_slots,
            this.clientStorage.inventoryStorage.delivery_slots,
            this.clientStorage.inventoryStorage.owned_delivery,
            this.clientStorage.inventoryStorage.owned_spoils,
            this.clientStorage.inventoryStorage.owned_bait,
            this.clientStorage.inventoryStorage.count_spoils,
            this.clientStorage.inventoryStorage.count_delivery,
            this.clientStorage.inventoryStorage.count_bait,
            this.ModLoader.clientLobby));
    }

    updateBottles(onlyfillCache = false) {
        let bottles: InventoryItem[] = [
            this.core.save.inventory.FIELD_BOTTLE1,
            this.core.save.inventory.FIELD_BOTTLE2,
            this.core.save.inventory.FIELD_BOTTLE3,
            this.core.save.inventory.FIELD_BOTTLE4,
        ];
        for (let i = 0; i < bottles.length; i++) {
            if (bottles[i] !== this.clientStorage.bottleCache[i]) {
                this.clientStorage.bottleCache[i] = bottles[i];
                this.ModLoader.logger.info('Bottle update.');
                if (!onlyfillCache) {
                    this.ModLoader.clientSide.sendPacket(new WWO_BottleUpdatePacket(i, bottles[i], this.ModLoader.clientLobby));
                }
            }
        }
    }

    //------------------------------
    // Lobby Setup
    //------------------------------

    @EventHandler(EventsClient.ON_SERVER_CONNECTION)
    onConnect() {
        this.ModLoader.logger.debug("Connected to server.");
        this.clientStorage.first_time_sync = false;
    }

    @EventHandler(EventsClient.CONFIGURE_LOBBY)
    onLobbySetup(lobby: LobbyData): void {
        lobby.data['WWOnline:data_syncing'] = true;
    }

    @EventHandler(EventsClient.ON_LOBBY_JOIN)
    onJoinedLobby(lobby: LobbyData): void {
        this.clientStorage.first_time_sync = false;
        this.LobbyConfig.data_syncing = lobby.data['WWOnline:data_syncing'];
        this.ModLoader.logger.info('WWOnline settings inherited from lobby.');
    }

    //------------------------------
    // Scene handling
    //------------------------------

    @EventHandler(WWEvents.ON_SAVE_LOADED)
    onSaveLoad(Scene: number) {
        if (!this.clientStorage.first_time_sync && !this.syncPending) {

            this.ModLoader.utils.setTimeoutFrames(() => {
                if (this.LobbyConfig.data_syncing) {
                    this.ModLoader.me.data["world"] = this.clientStorage.world;
                    this.ModLoader.clientSide.sendPacket(new WWO_DownloadRequestPacket(this.ModLoader.clientLobby, new WWOSaveData(this.core, this.ModLoader).createSave()));
                }
            }, 50);
            this.syncPending = true;
        }
    }

    @EventHandler(WWEvents.ON_SCENE_CHANGE)
    onSceneChange(scene: string) {
        if (!this.clientStorage.first_time_sync && !this.syncPending) {
            this.ModLoader.utils.setTimeoutFrames(() => {
                if (this.LobbyConfig.data_syncing) {
                    this.ModLoader.me.data["world"] = this.clientStorage.world;
                    this.ModLoader.clientSide.sendPacket(new WWO_DownloadRequestPacket(this.ModLoader.clientLobby, new WWOSaveData(this.core, this.ModLoader).createSave()));
                    //this.ModLoader.clientSide.sendPacket(new WWO_RomFlagsPacket(this.ModLoader.clientLobby, RomFlags.isWWR, RomFlags.isVanilla));
                }
            }, 300);
            this.syncPending = true;
        }
        this.ModLoader.clientSide.sendPacket(
            new WWO_ScenePacket(
                this.ModLoader.clientLobby,
                scene
            )
        );
        this.ModLoader.logger.info('client: I moved to scene ' + scene + '.');
        if (this.core.helper.isSceneNameValid()) {
            this.ModLoader.gui.setDiscordStatus(
                new DiscordStatus(
                    'Playing MMOnline',
                    'In ' +
                    this.clientStorage.localization[
                    this.clientStorage.scene_keys[scene]
                    ]
                )
            );
        }
    }

    @NetworkHandler('WWO_ScenePacket')
    onSceneChange_client(packet: WWO_ScenePacket) {
        this.ModLoader.logger.info(
            'client receive: Player ' +
            packet.player.nickname +
            ' moved to scene ' +
            this.clientStorage.localization[
            this.clientStorage.scene_keys[packet.scene]
            ] +
            '.'
        );
        bus.emit(
            WWOEvents.CLIENT_REMOTE_PLAYER_CHANGED_SCENES,
            new WWOPlayerScene(packet.player, packet.lobby, packet.scene)
        );
    }

    // This packet is basically 'where the hell are you?' if a player has a puppet on file but doesn't know what scene its suppose to be in.
    @NetworkHandler('WWO_SceneRequestPacket')
    onSceneRequest_client(packet: WWO_SceneRequestPacket) {
        if (this.core.save !== undefined) {
            this.ModLoader.clientSide.sendPacketToSpecificPlayer(
                new WWO_ScenePacket(
                    this.ModLoader.clientLobby,
                    this.core.global.current_scene_name
                ),
                packet.player
            );
        }
    }

    @NetworkHandler('WWO_BottleUpdatePacket')
    onBottle_client(packet: WWO_BottleUpdatePacket) {
        if (
            this.core.helper.isTitleScreen() ||
            !this.core.helper.isSceneNameValid()
        ) {
            return;
        }
        if (packet.player.data.world !== this.clientStorage.world) return;
        if (!this.config.syncBottleContents) return;
        let inventory = this.core.save.inventory;
        if (packet.contents === InventoryItem.NONE) return;
        this.clientStorage.bottleCache[packet.slot] = packet.contents;
        switch (packet.slot) {
            case 0:
                inventory.FIELD_BOTTLE1 = packet.contents;
                break;
            case 1:
                inventory.FIELD_BOTTLE2 = packet.contents;
                break;
            case 2:
                inventory.FIELD_BOTTLE3 = packet.contents;
                break;
            case 3:
                inventory.FIELD_BOTTLE4 = packet.contents;
                break;
        }
        bus.emit(WWOEvents.ON_INVENTORY_UPDATE, this.core.save.inventory);
        // Update hash.
        this.clientStorage.saveManager.createSave();
        this.clientStorage.lastPushHash = this.clientStorage.saveManager.hash;
    }

    private isBottle(item: InventoryItem) {
        return (item >= InventoryItem.BOTTLE_EMPTY && item <= InventoryItem.BOTTLE_FOREST_WATER)
    }

    healPlayer() {
        if (this.core.helper.isTitleScreen() || !this.core.helper.isSceneNameValid()) return;
        this.core.ModLoader.emulator.rdramWriteF32(0x803CA764, 80);
    }

    refreshMagic() {
        if (this.core.helper.isTitleScreen() || !this.core.helper.isSceneNameValid()) return;

        this.lastMagicValue = this.core.save.questStatus.current_mp;

        if (this.core.save.questStatus.current_mp === 0x20 || this.core.save.questStatus.current_mp === 0x10) {
            this.core.save.questStatus.current_mp -= 1;
        }
        else {
            this.core.save.questStatus.current_mp += 1;
        }
    }

    @EventHandler(WWOEvents.GAINED_PIECE_OF_HEART)
    onNeedsHeal(evt: any) {
        this.healPlayer();
        this.refreshMagic();
    }

    @EventHandler(WWOEvents.MAGIC_METER_INCREASED)
    onNeedsMagic(size: API.Magic) {
        switch (size) {
            case API.Magic.NONE:
                this.core.save.questStatus.current_mp = API.MagicQuantities.NONE;
                break;
            case API.Magic.NORMAL:
                this.core.save.questStatus.current_mp = API.MagicQuantities.NORMAL;
                break;
            case API.Magic.EXTENDED:
                this.core.save.questStatus.current_mp = API.MagicQuantities.EXTENDED;
                break;
        }
        this.refreshMagic();
    }

    // The server is giving me data.
    @NetworkHandler('WWO_DownloadResponsePacket')
    onDownloadPacket_client(packet: WWO_DownloadResponsePacket) {
        this.syncPending = false;
        if (
            this.core.helper.isTitleScreen() ||
            !this.core.helper.isSceneNameValid()
        ) {
            return;
        }
        if (!packet.host) {
            if (packet.save) {
                this.clientStorage.saveManager.forceOverrideSave(packet.save!, this.core.save as any, ProxySide.CLIENT);
                //this.clientStorage.saveManager.processKeyRing_OVERWRITE(packet.keys!, this.clientStorage.saveManager.createKeyRing(), ProxySide.CLIENT);
                // Update hash.
                this.clientStorage.saveManager.createSave();
                this.clientStorage.lastPushHash = this.clientStorage.saveManager.hash;
            }
        } else {
            this.ModLoader.logger.info("The lobby is mine!");
        }
        this.ModLoader.utils.setTimeoutFrames(() => {
            this.clientStorage.first_time_sync = true;
            this.updateBottles(true);
        }, 20);
    }

    @NetworkHandler('WWO_UpdateSaveDataPacket')
    onSaveUpdate(packet: WWO_UpdateSaveDataPacket) {
        if (
            this.core.helper.isTitleScreen() ||
            !this.core.helper.isSceneNameValid()
        ) {
            //console.log("onSaveUpdate Failure 0")
            return;
        }
        if (packet.world !== this.clientStorage.world) {
            //console.log("onSaveUpdate Failure 1")
            return;
        }

        this.clientStorage.saveManager.applySave(packet.save);
        // Update hash.
        this.clientStorage.saveManager.createSave();
        this.clientStorage.lastPushHash = this.clientStorage.saveManager.hash;
    }
    
    @NetworkHandler('WWO_ErrorPacket')
    onError(packet: WWO_ErrorPacket) {
        this.ModLoader.logger.error(packet.message);
    }

    @onTick()
    onTick() {
        if (
            !this.core.helper.isTitleScreen() &&
            this.core.helper.isSceneNameValid()
        ) {
            if (!this.core.helper.isPaused()) {
                this.ModLoader.me.data["world"] = this.clientStorage.world;
                if (!this.clientStorage.first_time_sync) {
                    return;
                }
                if (this.LobbyConfig.data_syncing) {
                    this.updateBottles();
                    this.syncTimer++;
                }
                if (this.lastMagicValue != 0xFF) {
                    this.core.save.questStatus.current_mp = this.lastMagicValue;
                    this.lastMagicValue = 0xFF;
                }
            }
        }
    }

    inventoryUpdateTick() {
        this.updateInventory();
        this.updateFlags();
    }
}

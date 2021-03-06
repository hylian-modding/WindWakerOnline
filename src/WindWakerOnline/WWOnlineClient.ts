import { InjectCore } from 'modloader64_api/CoreInjection';
import { bus, EventHandler, EventsClient } from 'modloader64_api/EventHandler';
import { INetworkPlayer, LobbyData, NetworkHandler, IPacketHeader } from 'modloader64_api/NetworkHandler';
import * as API from 'WindWaker/API/Imports';
import { createInventoryFromContext, createQuestFromContext, mergeInventoryData, mergeQuestData, InventorySave, applyInventoryToContext, applyQuestSaveToContext, QuestSave } from './data/WWOSaveData';
import { WWO_DownloadRequestPacket, WWO_SubscreenSyncPacket, WWO_ScenePacket, WWO_SceneRequestPacket, WWO_DownloadResponsePacket, WWO_DownloadResponsePacket2, WWO_ClientFlagUpdate, WWO_ServerFlagUpdate, } from './data/WWOPackets';
import path from 'path';
import { GUITunnelPacket } from 'modloader64_api/GUITunnel';
import fs from 'fs';
import { WWOnlineStorageClient } from './WWOnlineStorageClient';
import { DiscordStatus } from 'modloader64_api/Discord';
import { ModLoaderAPIInject } from 'modloader64_api/ModLoaderAPIInjector';
import { Init, Preinit, Postinit, onTick, onViUpdate, onCreateResources } from 'modloader64_api/PluginLifecycle';
import { IWWOnlineLobbyConfig, WWOnlineConfigCategory } from './WindWakerOnline';
import { IModLoaderAPI, ModLoaderEvents } from 'modloader64_api/IModLoaderAPI';
import { SidedProxy, ProxySide } from 'modloader64_api/SidedProxy/SidedProxy';
import { WWOnlineStorage } from './WWOnlineStorage';
import { WWOEvents } from './WWOAPI/WWOAPI';
import { parseFlagChanges } from './parseFlagChanges';
import { PuppetOverlord } from './data/customActors/PuppetOverlord';
import { WWEvents } from 'WindWaker/API/Imports';


export class WWOnlineClient {
    @InjectCore()
    core!: API.IWWCore;

    @ModLoaderAPIInject()
    ModLoader!: IModLoaderAPI;

    @SidedProxy(ProxySide.CLIENT, PuppetOverlord)
    puppets!: PuppetOverlord;

    LobbyConfig: IWWOnlineLobbyConfig = {} as IWWOnlineLobbyConfig;
    clientStorage!: WWOnlineStorageClient;
    config!: WWOnlineConfigCategory;
    counter = 0;
    lastMagicValue: number = 0xFF;

    sendPacketToPlayersInScene(packet: IPacketHeader) {
        try {
            Object.keys(this.clientStorage.players).forEach((key: string) => {
                //if (storage.players[key] === storage.players[packet.player.uuid]) {
                if (this.clientStorage.networkPlayerInstances[key].uuid !== packet.player.uuid) {
                    this.ModLoader.serverSide.sendPacketToSpecificPlayer(
                        packet,
                        this.clientStorage.networkPlayerInstances[key]
                    );
                }
                //}
            });
        } catch (err) { }
    }

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
        if (this.puppets !== undefined) {
            this.puppets.clientStorage = this.clientStorage;
        }
    }

    @Init()
    init(): void {

    }

    @Postinit()
    postinit() {
        //this.clientStorage.scene_keys = JSON.parse(fs.readFileSync(__dirname + '/data/scene_names.json').toString());
        //this.clientStorage.room_keys = JSON.parse(fs.readFileSync(__dirname + '/data/room_names.json').toString());
        let status: DiscordStatus = new DiscordStatus('Playing WWOnline', 'On the title screen');
        status.smallImageKey = 'WWO';
        status.partyId = this.ModLoader.clientLobby;
        status.partyMax = 30;
        status.partySize = 1;
        this.ModLoader.gui.setDiscordStatus(status);
    }

    updateInventory() {
        let inventory = createInventoryFromContext(this.core.save);
        let quest = createQuestFromContext(this.core.save.questStatus);

        mergeInventoryData(this.clientStorage.inventoryStorage, inventory);
        mergeQuestData(this.clientStorage.questStorage, quest);

        this.ModLoader.clientSide.sendPacket(
            new WWO_SubscreenSyncPacket(this.clientStorage.inventoryStorage,
                this.clientStorage.questStorage,
                this.ModLoader.clientLobby
            ));
        this.clientStorage.needs_update = false;
    }

    updateFlags() {

        let swordLevel: any = parseFlagChanges(this.core.save.questStatus.swordLevel, this.clientStorage.questStorage.swordLevel);
        let shieldLevel: any = parseFlagChanges(this.core.save.questStatus.shieldLevel, this.clientStorage.questStorage.shieldLevel);
        let bracelet: any = parseFlagChanges(this.core.save.questStatus.bracelet, this.clientStorage.questStorage.bracelet);
        let pirate_charm: any = parseFlagChanges(this.core.save.questStatus.pirate_charm, this.clientStorage.questStorage.pirate_charm);
        let hero_charm: any = parseFlagChanges(this.core.save.questStatus.hero_charm, this.clientStorage.questStorage.hero_charm);
        let sectors: any = parseFlagChanges(this.core.save.questStatus.sectors, this.clientStorage.questStorage.sectors);
        let dec_tri: any = parseFlagChanges(this.core.save.questStatus.deciphered_triforce, this.clientStorage.questStorage.deciphered_triforce);
        let pearls: any = parseFlagChanges(this.core.save.questStatus.pearls, this.clientStorage.questStorage.pearls);
        let song: any = parseFlagChanges(this.core.save.questStatus.songs, this.clientStorage.questStorage.songs);
        let triforce: any = parseFlagChanges(this.core.save.questStatus.triforce, this.clientStorage.questStorage.triforce);
        let compChart: any = parseFlagChanges(this.core.save.questStatus.completed_charts, this.clientStorage.questStorage.completed_charts);
        let openChart: any = parseFlagChanges(this.core.save.questStatus.opened_charts, this.clientStorage.questStorage.opened_charts);
        let ownChart: any = parseFlagChanges(this.core.save.questStatus.owned_charts, this.clientStorage.questStorage.owned_charts);

        let spoils_slots: any = parseFlagChanges(this.core.save.inventory.spoils_slots, this.clientStorage.inventoryStorage.spoils_slots);
        let bait_slots: any = parseFlagChanges(this.core.save.inventory.bait_slots, this.clientStorage.inventoryStorage.bait_slots);
        let delivery_slots: any = parseFlagChanges(this.core.save.inventory.delivery_slots, this.clientStorage.inventoryStorage.delivery_slots);
        let owned_delivery: any = parseFlagChanges(this.core.save.inventory.owned_delivery, this.clientStorage.inventoryStorage.owned_delivery);
        let owned_spoils: any = parseFlagChanges(this.core.save.inventory.owned_spoils, this.clientStorage.inventoryStorage.owned_spoils);
        let owned_bait: any = parseFlagChanges(this.core.save.inventory.owned_bait, this.clientStorage.inventoryStorage.owned_bait);
        let count_spoils: any = parseFlagChanges(this.core.save.inventory.count_spoils, this.clientStorage.inventoryStorage.count_spoils);
        let count_delivery: any = parseFlagChanges(this.core.save.inventory.count_delivery, this.clientStorage.inventoryStorage.count_delivery);
        let count_bait: any = parseFlagChanges(this.core.save.inventory.count_bait, this.clientStorage.inventoryStorage.count_bait);

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
    @EventHandler(API.WWEvents.ON_SAVE_LOADED)
    onSaveLoaded(evt: any) {
        this.ModLoader.logger.debug("On_Save_Loaded");
        setTimeout(() => {
            if (this.LobbyConfig.data_syncing) {
                this.ModLoader.clientSide.sendPacket(new WWO_DownloadRequestPacket(this.ModLoader.clientLobby));
            }
        }, 100);
    }

    //------------------------------
    // Lobby Setup
    //------------------------------
    @EventHandler(EventsClient.CONFIGURE_LOBBY)
    onLobbySetup(lobby: LobbyData): void {
        lobby.data['WWOnline:data_syncing'] = true;
    }

    @EventHandler(EventsClient.ON_LOBBY_JOIN)
    onJoinedLobby(lobby: LobbyData): void {
        this.LobbyConfig.data_syncing = lobby.data['WWOnline:data_syncing'];
        this.ModLoader.logger.info('WWOnline settings inherited from lobby.');
    }

    @EventHandler(API.WWEvents.ON_LOADING_ZONE)
    onLoadingZone(evt: any) {
        this.ModLoader.logger.debug("I've touched a loading zone.");
    }

    @EventHandler(EventsClient.ON_PLAYER_LEAVE)
    onPlayerLeft(player: INetworkPlayer) {

    }

    //------------------------------
    // Scene handling
    //------------------------------

    @EventHandler(API.WWEvents.ON_SCENE_CHANGE)
    onSceneChange(scene: string) {
        this.ModLoader.clientSide.sendPacket(
            new WWO_ScenePacket(
                this.ModLoader.clientLobby,
                scene
            )
        );
        //this.ModLoader.logger.info('client: I moved to scene ' + this.core.global.current_scene_name.toString().replace(/\0.*$/g, '') + '.');
        this.ModLoader.logger.info('client: I moved to scene: ' + this.core.global.current_scene_name + '.');

        if (this.core.helper.isSceneNameValid()) {
            this.ModLoader.gui.setDiscordStatus(
                new DiscordStatus(
                    'Playing WWOnline',
                    'In ' +
                    this.core.global.current_scene_name + '.')
            );
        }
    }

    @NetworkHandler('WWO_ScenePacket')
    onSceneChange_client(packet: WWO_ScenePacket) {
        this.ModLoader.logger.info(
            'client receive: Player ' +
            packet.player.nickname +
            ' moved to scene: ' + this.core.global.current_scene_name +
            '.'
        );
        this.clientStorage.players[packet.player.uuid] = packet.scene;
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

    // The server is giving me data.
    @NetworkHandler('WWO_DownloadResponsePacket')
    onDownloadPacket_client(packet: WWO_DownloadResponsePacket) {
        this.ModLoader.logger.info('Retrieving savegame from server...');

        applyInventoryToContext(packet.subscreen.inventory, this.core.save);

        applyQuestSaveToContext(packet.subscreen.quest, this.core.save);

        this.clientStorage.first_time_sync = true;
    }

    // I am giving the server data.
    @NetworkHandler('WWO_DownloadResponsePacket2')
    onDownPacket2_client(packet: WWO_DownloadResponsePacket2) {
        this.clientStorage.first_time_sync = true;
        this.ModLoader.logger.info('The lobby is mine!');

        this.clientStorage.needs_update = true;
    }

    @NetworkHandler('WWO_SubscreenSyncPacket')
    onItemSync_client(packet: WWO_SubscreenSyncPacket) {
        if (
            this.core.helper.isTitleScreen() ||
            !this.core.helper.isSceneNameValid()
        ) {
            return;
        }
        let inventory: InventorySave = createInventoryFromContext(
            this.core.save
        ) as InventorySave;
        let quest: QuestSave = createQuestFromContext(
            this.core.save.questStatus
        ) as QuestSave;

        mergeInventoryData(this.clientStorage.inventoryStorage, inventory);
        mergeQuestData(this.clientStorage.questStorage, quest);

        //Packets
        mergeInventoryData(this.clientStorage.inventoryStorage, packet.inventory);
        mergeQuestData(this.clientStorage.questStorage, packet.quest);

        applyInventoryToContext(this.clientStorage.inventoryStorage, this.core.save);
        applyQuestSaveToContext(this.clientStorage.questStorage, this.core.save);
    }

    healPlayer() {
        if (this.core.helper.isTitleScreen() || !this.core.helper.isSceneNameValid()) return;
        this.core.ModLoader.emulator.rdramWriteF32(0x803CA764, 0x50);
    }

    refreshMagic() {
        if (this.core.helper.isTitleScreen() || !this.core.helper.isSceneNameValid()) return;

        this.lastMagicValue = this.core.save.current_mp;

        if (this.core.save.current_mp === 0x20 || this.core.save.current_mp === 0x10) {
            this.core.save.current_mp -= 1;
        }
        else {
            this.core.save.current_mp += 1;
        }
    }

    @EventHandler(WWOEvents.GAINED_PIECE_OF_HEART)
    onNeedsHeal(evt: any) {
        this.refreshMagic();
        this.healPlayer();
    }

    @EventHandler(WWOEvents.MAGIC_METER_INCREASED)
    onNeedsMagic(size: API.Magic) {
        switch (size) {
            case API.Magic.NONE:
                this.core.save.current_mp = API.MagicQuantities.NONE;
                break;
            case API.Magic.NORMAL:
                this.core.save.current_mp = API.MagicQuantities.NORMAL;
                break;
            case API.Magic.EXTENDED:
                this.core.save.current_mp = API.MagicQuantities.EXTENDED;
                break;
        }
    }

    @EventHandler(ModLoaderEvents.ON_SOFT_RESET_PRE)
    onReset(evt: any) {
        this.clientStorage.first_time_sync = false;
    }

    @NetworkHandler('MMO_ServerFlagUpdate')
    onSceneFlagSync_client(packet: WWO_ServerFlagUpdate) {

        this.ModLoader.utils.clearBuffer(this.clientStorage.questStorage.bracelet);
        this.ModLoader.utils.clearBuffer(this.clientStorage.questStorage.pirate_charm);
        this.ModLoader.utils.clearBuffer(this.clientStorage.questStorage.hero_charm);
        this.ModLoader.utils.clearBuffer(this.clientStorage.questStorage.sectors);
        this.ModLoader.utils.clearBuffer(this.clientStorage.questStorage.deciphered_triforce);
        this.ModLoader.utils.clearBuffer(this.clientStorage.questStorage.pearls);
        this.ModLoader.utils.clearBuffer(this.clientStorage.questStorage.songs);
        this.ModLoader.utils.clearBuffer(this.clientStorage.questStorage.triforce);
        this.ModLoader.utils.clearBuffer(this.clientStorage.questStorage.completed_charts);
        this.ModLoader.utils.clearBuffer(this.clientStorage.questStorage.opened_charts);
        this.ModLoader.utils.clearBuffer(this.clientStorage.questStorage.owned_charts);


        let bracelet = this.core.save.questStatus.bracelet;
        let pirate_charm = this.core.save.questStatus.pirate_charm;
        let hero_charm = this.core.save.questStatus.hero_charm;
        let sectors = this.core.save.questStatus.sectors;
        let dec_tri = this.core.save.questStatus.deciphered_triforce;
        let pearls = this.core.save.questStatus.pearls;
        let song = this.core.save.questStatus.songs;
        let triforce = this.core.save.questStatus.triforce;
        let compChart = this.core.save.questStatus.completed_charts;
        let openChart = this.core.save.questStatus.opened_charts;
        let ownChart = this.core.save.questStatus.owned_charts;
        let spoils_slots = this.core.save.inventory.spoils_slots;
        let bait_slots = this.core.save.inventory.bait_slots;
        let delivery_slots = this.core.save.inventory.delivery_slots;
        let owned_delivery = this.core.save.inventory.owned_delivery;
        let owned_spoils = this.core.save.inventory.owned_spoils;
        let owned_bait = this.core.save.inventory.owned_bait;
        let count_spoils = this.core.save.inventory.count_spoils;
        let count_delivery = this.core.save.inventory.count_delivery;
        let count_bait = this.core.save.inventory.count_bait;

        parseFlagChanges(
            bracelet,
            this.clientStorage.questStorage.bracelet
        );
        parseFlagChanges(
            pirate_charm,
            this.clientStorage.questStorage.pirate_charm
        );
        parseFlagChanges(
            hero_charm,
            this.clientStorage.questStorage.hero_charm
        );
        parseFlagChanges(
            sectors,
            this.clientStorage.questStorage.sectors
        );
        parseFlagChanges(
            dec_tri,
            this.clientStorage.questStorage.deciphered_triforce
        );
        parseFlagChanges(
            pearls,
            this.clientStorage.questStorage.pearls
        );
        parseFlagChanges(
            song,
            this.clientStorage.questStorage.songs
        );
        parseFlagChanges(
            triforce,
            this.clientStorage.questStorage.triforce
        );
        parseFlagChanges(
            compChart,
            this.clientStorage.questStorage.completed_charts
        );
        parseFlagChanges(
            openChart,
            this.clientStorage.questStorage.opened_charts
        );
        parseFlagChanges(
            ownChart,
            this.clientStorage.questStorage.owned_charts
        );

        for (let i = 0; i < packet.bracelet.byteLength; i++) {
            let value = packet.bracelet[i];
            if (this.clientStorage.questStorage.bracelet[i] !== value) {
                this.clientStorage.questStorage.bracelet[i] |= value;
            }
        }
        for (let i = 0; i < packet.pirate_charm.byteLength; i++) {
            let value = packet.pirate_charm[i];
            if (this.clientStorage.questStorage.pirate_charm[i] !== value) {
                this.clientStorage.questStorage.pirate_charm[i] |= value;
            }
        }
        for (let i = 0; i < packet.hero_charm.byteLength; i++) {
            let value = packet.hero_charm[i];
            if (this.clientStorage.questStorage.hero_charm[i] !== value) {
                this.clientStorage.questStorage.hero_charm[i] |= value;
            }
        }
        for (let i = 0; i < packet.sectors.byteLength; i++) {
            let value = packet.sectors[i];
            if (this.clientStorage.questStorage.sectors[i] !== value) {
                this.clientStorage.questStorage.sectors[i] |= value;
            }
        }
        for (let i = 0; i < packet.dec_tri.byteLength; i++) {
            let value = packet.dec_tri[i];
            if (this.clientStorage.questStorage.deciphered_triforce[i] !== value) {
                this.clientStorage.questStorage.deciphered_triforce[i] |= value;
            }
        }
        for (let i = 0; i < packet.pearls.byteLength; i++) {
            let value = packet.pearls[i];
            if (this.clientStorage.questStorage.pearls[i] !== value) {
                this.clientStorage.questStorage.pearls[i] |= value;
            }
        }
        for (let i = 0; i < packet.song.byteLength; i++) {
            let value = packet.song[i];
            if (this.clientStorage.questStorage.songs[i] !== value) {
                this.clientStorage.questStorage.songs[i] |= value;
            }
        }
        for (let i = 0; i < packet.triforce.byteLength; i++) {
            let value = packet.triforce[i];
            if (this.clientStorage.questStorage.triforce[i] !== value) {
                this.clientStorage.questStorage.triforce[i] |= value;
            }
        }
        for (let i = 0; i < packet.compChart.byteLength; i++) {
            let value = packet.compChart[i];
            if (this.clientStorage.questStorage.completed_charts[i] !== value) {
                this.clientStorage.questStorage.completed_charts[i] |= value;
            }
        }
        for (let i = 0; i < packet.openChart.byteLength; i++) {
            let value = packet.openChart[i];
            if (this.clientStorage.questStorage.opened_charts[i] !== value) {
                this.clientStorage.questStorage.opened_charts[i] |= value;
            }
        }
        for (let i = 0; i < packet.ownChart.byteLength; i++) {
            let value = packet.ownChart[i];
            if (this.clientStorage.questStorage.owned_charts[i] !== value) {
                this.clientStorage.questStorage.owned_charts[i] |= value;
            }
        }

        this.core.save.questStatus.bracelet = this.clientStorage.questStorage.bracelet;
        this.core.save.questStatus.pirate_charm = this.clientStorage.questStorage.pirate_charm;
        this.core.save.questStatus.hero_charm = this.clientStorage.questStorage.hero_charm;
        this.core.save.questStatus.sectors = this.clientStorage.questStorage.sectors;
        this.core.save.questStatus.deciphered_triforce = this.clientStorage.questStorage.deciphered_triforce;
        this.core.save.questStatus.pearls = this.clientStorage.questStorage.pearls;
        this.core.save.questStatus.songs = this.clientStorage.questStorage.songs;
        this.core.save.questStatus.triforce = this.clientStorage.questStorage.triforce;
        this.core.save.questStatus.completed_charts = this.clientStorage.questStorage.completed_charts;
        this.core.save.questStatus.opened_charts = this.clientStorage.questStorage.opened_charts;
        this.core.save.questStatus.owned_charts = this.clientStorage.questStorage.owned_charts;
    }

    @onTick()
    onTick() {
        if (
            !this.core.helper.isTitleScreen() &&
            this.core.helper.isLinkExists() &&
            this.core.helper.isSceneNameValid()
        ) {
            if (!this.core.helper.isPaused()) {
                if (!this.clientStorage.first_time_sync) {
                    return;
                }
                if (this.LobbyConfig.data_syncing) {
                    if (this.counter >= 300) {
                        this.clientStorage.needs_update = true;
                        this.counter = 0;
                    }
                    if (!this.core.helper.isLinkControllable()) this.clientStorage.needs_update = true;
                    if (this.core.helper.isLinkControllable() && this.clientStorage.needs_update && this.LobbyConfig.data_syncing) {
                        this.updateInventory();
                        this.updateFlags();
                        this.clientStorage.needs_update = false;
                    }
                }
            }

            if (this.lastMagicValue != 0xFF) {
                this.core.save.current_mp = this.lastMagicValue;
                this.lastMagicValue = 0xFF;
            }

            if (this.LobbyConfig.data_syncing && this.core.helper.isPaused()) {
                if (!this.clientStorage.first_time_sync) {
                    return;
                }
                this.clientStorage.needs_update = true;
            }
            this.counter += 1;
        }
    }

    @EventHandler(ModLoaderEvents.ON_ROM_PATCHED)
    onRomPatched(evt: any) {
        let iso: Buffer = evt.rom;
        iso.writeUInt16BE(0x0400, 0x444);
    }
}
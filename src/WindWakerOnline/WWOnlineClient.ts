import { WWOEvents, WWOPlayerRoom, WWOPlayerScene, } from "./api/WWOAPI";
import path from "path";
import { InjectCore } from "modloader64_api/CoreInjection";
import { DiscordStatus } from "modloader64_api/Discord";
import { EventHandler, PrivateEventHandler, EventsClient, bus } from "modloader64_api/EventHandler";
import { IModLoaderAPI, IPlugin, ModLoaderEvents } from "modloader64_api/IModLoaderAPI";
import { ModLoaderAPIInject } from "modloader64_api/ModLoaderAPIInjector";
import { INetworkPlayer, LobbyData, NetworkHandler } from "modloader64_api/NetworkHandler";
import { Preinit, Init, Postinit, onTick } from "modloader64_api/PluginLifecycle";
import { ParentReference, SidedProxy, ProxySide } from "modloader64_api/SidedProxy/SidedProxy";
import { WWO_UpdateSaveDataPacket, WWO_DownloadRequestPacket, WWO_ScenePacket, WWO_SceneRequestPacket, WWO_DownloadResponsePacket, WWO_BottleUpdatePacket, WWO_ErrorPacket, WWO_RoomPacket, WWO_RupeePacket, WWO_FlagUpdate, WWO_ClientSceneContextUpdate } from "./network/WWOPackets";
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
import bitwise from 'bitwise';

export default class WWOnlineClient {
    @InjectCore()
    core!: IWWCore;

    @ModLoaderAPIInject()
    ModLoader!: IModLoaderAPI;

    @ParentReference()
    parent!: IPlugin;

    @SidedProxy(ProxySide.CLIENT, PuppetOverlord)
    puppets!: PuppetOverlord;

    LobbyConfig: IWWOnlineLobbyConfig = {} as IWWOnlineLobbyConfig;
    clientStorage: WWOnlineStorageClient = new WWOnlineStorageClient();
    config!: WWOnlineConfigCategory;

    syncContext: number = -1;
    syncTimer: number = 0;
    synctimerMax: number = 60 * 20;
    syncPending: boolean = false;

    lastRupees: number = 0;
    sentRupees: boolean = false;

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
        //this.clientStorage.scene_keys = JSON.parse(fs.readFileSync(__dirname + '/localization/scene_names.json').toString());
        this.clientStorage.localization = JSON.parse(fs.readFileSync(__dirname + '/localization/scene_names.json').toString());
        this.clientStorage.localization_island = JSON.parse(fs.readFileSync(__dirname + '/localization/island_names.json').toString());
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

    autosaveSceneData() {
        if (!this.core.helper.isLoadingZone() && this.core.global.current_scene_frame > 60 && this.clientStorage.first_time_sync) {

            let live_scene_chests: Buffer = this.core.save.dSv_memory_c.slice(0x0, 0x3);
            let live_scene_switches: Buffer = this.core.save.dSv_memory_c.slice(0x4, 0x13);
            let live_scene_collect: Buffer = this.core.save.dSv_memory_c.slice(0x14, 0x17);

            this.ModLoader.clientSide.sendPacket(new WWO_ClientSceneContextUpdate(live_scene_chests, live_scene_switches, live_scene_collect, this.ModLoader.clientLobby, this.core.global.current_scene_name, this.clientStorage.world));
        }
    }

    updateInventory() {
        if (this.core.helper.isTitleScreen() || !this.core.helper.isSceneNameValid() || this.core.helper.isPaused() || !this.clientStorage.first_time_sync) return;
        if (this.syncTimer > this.synctimerMax) {
            this.clientStorage.lastPushHash = this.ModLoader.utils.hashBuffer(Buffer.from("RESET"));
            //this.ModLoader.logger.debug("Forcing resync due to timeout.");
            //this.core.save.swords.swordLevel = API.Sword.Master;
            //this.core.save.shields.shieldLevel = API.Shield.MIRROR;
            //console.log(`save: ${this.core.save.swords.swordLevel}, ${this.core.save.shields.shieldLevel}`);
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

    /* updateRupees() {
        let rupees = this.core.save.inventory.rupeeCount;
        if (rupees !== this.lastRupees && !this.sentRupees) {
            this.ModLoader.logger.info(`Rupees changed with delta ` + (rupees - this.lastRupees).toString());
            this.ModLoader.clientSide.sendPacket(new WWO_RupeePacket(rupees - this.lastRupees, this.ModLoader.clientLobby))
            this.sentRupees = true;
        }
        this.lastRupees = rupees;
    } */

    updateFlags(storage: Buffer, save: Buffer, blacklist: number[], flagID: number): boolean {
        if (this.core.helper.isTitleScreen() || !this.core.helper.isSceneNameValid() || this.core.helper.isPaused() || !this.clientStorage.first_time_sync) return false;
        let flagStorage = this.ModLoader.utils.cloneBuffer(storage);
        let flagSave = this.ModLoader.utils.cloneBuffer(save);
        for (let i = 0; i < storage.byteLength; i++) {
            let byteStorage = flagStorage.readUInt8(i);
            let byteIncoming = flagSave.readUInt8(i);
            let bitsIncoming = bitwise.byte.read(byteIncoming as any);
            if (!blacklist.includes(i) && byteStorage !== byteIncoming) {
                console.log(`Client: Parsing flag: 0x${i.toString(16)}, byteIncoming: 0x${byteIncoming.toString(16)}, bitsIncoming: 0x${bitsIncoming} `);
                parseFlagChanges(flagSave, flagStorage);
            }
            else if (blacklist.includes(i) && byteStorage !== byteIncoming) {
                switch (flagID) {
                    case 0: //dSv_event_c_save_id = 0;
                        this.dSv_event_c_save_parse(flagStorage, byteStorage, byteIncoming, i);
                        break;
                    case 1: //dSv_event_c_id = 1;
                        break;
                    case 2: //dSv_memory_c_save_id = 2;
                        break;
                    case 3: //dSv_memory_c_id = 3;
                        break;
                    case 4:  //dSv_zone_c_id = 4;
                        break;
                }
            }
        }
        if (!flagStorage.equals(storage)) {
            console.log(`update flags: ${flagID}`);
            storage = flagStorage;
            return true;
        }
        else {
            return false;
        }
    }

    dSv_event_c_save_parse(storageBuf: Buffer, byteStorage: number, byteIncoming: number, index: number) {
        let bitsStorage = bitwise.byte.read(byteStorage as any);
        let bitsIncoming = bitwise.byte.read(byteIncoming as any);
        for (let j = 0; j <= 7; j++) {
            switch (index) {
                case 0x0: //FOREST_OF_FAIRIES_BOKOBLINS_SPAWNED
                    if (j !== 5) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Client: Blacklisted event: 0x${index}, bit: ${j}`)
                    break;
                case 0x1: //RESCUED_TETRA
                    if (j !== 7) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Client: Blacklisted event: 0x${index}, bit: ${j}`)
                    break;
                case 0x2: //SAW_TETRA_IN_FOREST_OF_FAIRIES
                    if (j !== 0) bitsStorage[j] = bitsIncoming[j]; //set the bits that aren't blacklisted
                    //else console.log(`Client: Blacklisted event: 0x${index}, bit: ${j}`)
                    break;
                case 0x3: //KILLED_ONE_FOREST_OF_FAIRIES_BOKOBLIN
                    if (j !== 7) bitsStorage[j] = bitsIncoming[j]; //set the bits that aren't blacklisted
                    //else console.log(`Client: Blacklisted event: 0x${index}, bit: ${j}`)
                    break;
                case 0x4: //KILLED_BOTH_FOREST_OF_FAIRIES_BOKOBLINS
                    if (j !== 0) bitsStorage[j] = bitsIncoming[j]; //set the bits that aren't blacklisted
                    //else console.log(`Client: Blacklisted event: 0x${index}, bit: ${j}`)
                    break;
                case 0x5: //GOSSIP_STONE_AT_FF1
                    if (j !== 2) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Client: Blacklisted event: 0x${index}, bit: ${j}`)
                    break;
                case 0x7: //SAW_PIRATE_SHIP_MINIGAME_INTRO | COMPLETED_PIRATE_SHIP_MINIGAME
                    if (j !== 2 && j !== 3) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Client: Blacklisted event: 0x${index}, bit: ${j}`)
                    break;
                case 0x8: //LONG_TETRA_TEXT_ON_OUTSET | COMPLETED_PIRATE_SHIP_MINIGAME_AND_SPAWN_ON_PIRATE_SHIP | GOT_CATAPULTED_TO_FF1_AND_SPAWN_THERE | TETRA_TOLD_YOU_TO_CLIMB_UP_THE_LADDER
                    if (j !== 6 && j !== 7 && j !== 0 && j !== 3 && j !== 1) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Client: Blacklisted event: 0x${index}, bit: ${j}`)
                    break;
                case 0x9: //After Aryll or Talk w/ Tetra
                    if (j !== 3) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Client: Blacklisted event: 0x${index}, bit: ${j}`)
                    break;
                case 0xE: //exited forest of fairies with tetra?
                    if (j !== 2) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Client: Blacklisted event: 0x${index}, bit: ${j}`)
                    break;
                case 0xF: //KORL_UNLOCKED_AND_SPAWN_ON_WINDFALL
                    if (j !== 0) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Client: Blacklisted event: 0x${index}, bit: ${j}`)
                    break;
                case 0x24: //WATCHED_DEPARTURE_CUTSCENE_AND_SPAWN_ON_PIRATE_SHIP
                    if (j !== 7) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Client: Blacklisted event: 0x${index}, bit: ${j}`)
                    break;
                case 0x25: //WATCHED_FIND_SISTER_IN_FF1_CUTSCENE
                    if (j !== 0) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Client: Blacklisted event: 0x${index}, bit: ${j}`)
                    break;
                case 0x2D: //tetra and her gang free mila maggie and aryll from the prison
                    if (j !== 3) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Client: Blacklisted event: 0x${index}, bit: ${j}`)
                    break;
                case 0x2E: //WATCHED_MEETING_KORL_CUTSCENE
                    if (j !== 3) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Client: Blacklisted event: 0x${index}, bit: ${j}`)
                    break;
                case 0x34: //Medli/Makar has been kidnapped by a Floormaster
                    if (j !== 1 && j !== 0) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Client: Blacklisted event: 0x${index}, bit: ${j}`)
                    break;
            }
        }
        let newByteStorage = bitwise.byte.write(bitsStorage); //write our updated bits into a byte
        if (newByteStorage !== byteStorage) {  //make sure the updated byte is different than the original
            byteStorage = newByteStorage;
            storageBuf.writeUInt8(byteStorage, index); //write new byte into the event flag at index i
            //console.log(`Server: Parsing flag: 0x${i.toString(16)}, byteStorage: 0x${byteStorage.toString(16)}, newByteStorage: 0x${newByteStorage.toString(16)} `);
        }
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
        this.ModLoader.logger.info('client: I moved to scene ' + (this.clientStorage.localization[scene] || scene) + '.');
        if (this.core.helper.isSceneNameValid()) {
            this.ModLoader.gui.setDiscordStatus(
                new DiscordStatus(
                    'Playing WWOnline',
                    'In ' +
                    this.clientStorage.localization[
                    scene
                    ]
                )
            );
        }
    }

    @EventHandler(WWEvents.ON_ROOM_CHANGE)
    onRoomChange(scene: string, room: number) {
        //Log when the player changes to a different island
        if (scene === "sea") {
            if (room !== 0 && room !== 0xFF) {
                this.ModLoader.clientSide.sendPacket(
                    new WWO_RoomPacket(
                        this.ModLoader.clientLobby,
                        scene,
                        room
                    )
                );
                this.ModLoader.logger.info('client: I moved to ' + (this.clientStorage.localization_island[room] || room) + '.');
            }
        }
    }

    @NetworkHandler('WWO_ScenePacket')
    onSceneChange_client(packet: WWO_ScenePacket) {
        this.ModLoader.logger.info(
            'client receive: Player ' +
            packet.player.nickname +
            ' moved to scene ' +
            this.clientStorage.localization[
            packet.scene
            ] +
            '.'
        );
        bus.emit(
            WWOEvents.CLIENT_REMOTE_PLAYER_CHANGED_SCENES,
            new WWOPlayerScene(packet.player, packet.lobby, packet.scene)
        );
    }

    @NetworkHandler('WWO_RoomPacket')
    onRoomChange_client(packet: WWO_RoomPacket) {
        if (packet.scene === "sea" && packet.room !== 0) {
            this.ModLoader.logger.info(
                'client receive: Player ' +
                packet.player.nickname +
                ' moved to ' +
                this.clientStorage.localization_island[
                packet.room
                ] +
                '.'
            );
        }
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

    @NetworkHandler('WWO_ClientSceneContextUpdate')
    onSceneContextSync_client(packet: WWO_ClientSceneContextUpdate) {
        if (
            this.core.helper.isTitleScreen() ||
            !this.core.helper.isSceneNameValid() ||
            this.core.helper.isLoadingZone()
        ) {
            return;
        }
        if (this.core.global.current_scene_name !== packet.scene) {
            return;
        }
        if (packet.world !== this.clientStorage.world) return;
        let tempCopy = this.ModLoader.utils.cloneBuffer(this.core.save.dSv_memory_c);
        let buf1: Buffer = this.core.save.dSv_memory_c.slice(0x0, 0x3);
        if (parseFlagChanges(packet.chests, buf1) > 0) {
            buf1.copy(tempCopy, 0, 0);
        }
        let buf2: Buffer = this.core.save.dSv_memory_c.slice(0x4, 0x13);
        if (parseFlagChanges(packet.switches, buf2) > 0) {
            buf2.copy(tempCopy, 0x4, 0x4);
        }
        let buf3: Buffer = this.core.save.dSv_memory_c.slice(0x14, 0x17);
        if (parseFlagChanges(packet.switches, buf3) > 0) {
            buf3.copy(tempCopy, 0x14, 0x14);
        }
        if (!tempCopy.equals(this.core.save.dSv_memory_c)) {
            console.log(`sceneContextSync: ${tempCopy.toString('hex')}`);
            this.core.save.dSv_memory_c = tempCopy;
        }
        // Update hash.
        this.clientStorage.saveManager.createSave();
        this.clientStorage.lastPushHash = this.clientStorage.saveManager.hash;
    }

    healPlayer() {
        if (this.core.helper.isTitleScreen() || !this.core.helper.isSceneNameValid()) return;
        this.core.ModLoader.emulator.rdramWriteF32(0x803CA764, 80); //Number of quarter hearts to add to the player's HP this frame. Can be negative to damage the player.
    }

    @EventHandler(WWOEvents.GAINED_PIECE_OF_HEART)
    onNeedsHeal(evt: any) {
        this.healPlayer();
    }

    @EventHandler(WWOEvents.MAGIC_METER_INCREASED)
    onNeedsMagic(size: API.MagicQuantities) {
        switch (size) {
            case API.MagicQuantities.NONE:
                console.log("Magic Meter NONE")
                this.core.save.questStatus.current_mp += API.MagicQuantities.NONE;
                break;
            case API.MagicQuantities.NORMAL:
                console.log("Magic Meter NORMAL")
                this.core.save.questStatus.current_mp += API.MagicQuantities.NORMAL;
                break;
            case API.MagicQuantities.EXTENDED:
                console.log("Magic Meter Extended")
                this.core.save.questStatus.current_mp += API.MagicQuantities.EXTENDED;
                break;
        }
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

    @NetworkHandler('WWO_FlagUpdate')
    onFlagUpdate(packet: WWO_FlagUpdate) {
        if (this.core.helper.isTitleScreen() || !this.core.helper.isSceneNameValid()) return;
        console.log("onFlagUpdate Client");

        for (let i = 0; i < packet.dSv_event_c_save!.byteLength; i++) {
            let tempByteIncoming = packet.dSv_event_c_save!.readUInt8(i);
            let tempByte = this.clientStorage.dSv_event_c_save!.readUInt8(i);
            if (tempByteIncoming !== tempByte && tempByteIncoming !== 0) console.log(`dSv_event_c_save: Writing flag: 0x${i.toString(16)}, tempByte: 0x${tempByte.toString(16)}, tempByteIncoming: 0x${tempByteIncoming.toString(16)} `);
        }
        for (let i = 0; i < packet.dSv_event_c!.byteLength; i++) {
            let tempByteIncoming = packet.dSv_event_c!.readUInt8(i);
            let tempByte = this.clientStorage.dSv_event_c!.readUInt8(i);
            if (tempByteIncoming !== tempByte && tempByteIncoming !== 0) console.log(`dSv_event_c: Writing flag: 0x${i.toString(16)}, tempByte: 0x${tempByte.toString(16)}, tempByteIncoming: 0x${tempByteIncoming.toString(16)} `);
        }
        for (let i = 0; i < packet.dSv_memory_c_save!.byteLength; i++) {
            let tempByteIncoming = packet.dSv_memory_c_save!.readUInt8(i);
            let tempByte = this.clientStorage.dSv_memory_c_save!.readUInt8(i);
            if (tempByteIncoming !== tempByte && tempByteIncoming !== 0) console.log(`dSv_memory_c_save: Writing flag: 0x${i.toString(16)}, tempByte: 0x${tempByte.toString(16)}, tempByteIncoming: 0x${tempByteIncoming.toString(16)} `);
        }

        parseFlagChanges(packet.dSv_event_c_save!, this.clientStorage.dSv_event_c_save);
        this.core.save.dSv_event_c_save = this.clientStorage.dSv_event_c_save;

        parseFlagChanges(packet.dSv_event_c!, this.clientStorage.dSv_event_c);
        this.core.save.dSv_event_c = this.clientStorage.dSv_event_c;

        parseFlagChanges(packet.dSv_memory_c_save!, this.clientStorage.dSv_memory_c_save);
        this.core.save.dSv_memory_c_save = this.clientStorage.dSv_memory_c_save;

        // if (packet.dSv_memory_c !== undefined) {
        //     parseFlagChanges(packet.dSv_memory_c!, this.clientStorage.dSv_memory_c);
        //     this.core.save.dSv_memory_c = this.clientStorage.dSv_memory_c;
        // }
        // if (!packet.dSv_zone_c_actor !== undefined) {
        //     parseFlagChanges(packet.dSv_zone_c_actor!, this.clientStorage.dSv_zone_c_actor);
        //     this.core.save.dSv_zone_c_actor = this.clientStorage.dSv_zone_c_actor;
        // }
        // if (!packet.dSv_zone_c_zoneBit !== undefined) {
        //     parseFlagChanges(packet.dSv_zone_c_zoneBit!, this.clientStorage.dSv_zone_c_zoneBit);
        //     this.core.save.dSv_zone_c_zoneBit = this.clientStorage.dSv_zone_c_zoneBit;
        // }

    }

    /* @NetworkHandler('WWO_RupeePacket')
    onRupees(packet: WWO_RupeePacket) {
        if (!this.sentRupees) {
            this.core.save.inventory.rupeeCount += packet.delta;
            console.log(`onRupees: ${packet.delta}, rupeeCount: ${this.core.save.inventory.rupeeCount}`)
        }
        else { 
            console.log(`I sent these! Refusing...`);
            this.sentRupees = false;
        }
        this.lastRupees = this.core.save.inventory.rupeeCount;
    } */

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
                    this.autosaveSceneData();
                    this.syncTimer++;
                }
            }
        }
    }

    inventoryUpdateTick() {
        this.updateInventory();
        const dSv_event_c_save_blacklist = [0x1, 0x2, 0x5, 0x7, 0x8, 0xE, 0xF, 0x24, 0x25, 0x2D, 0x2E, 0x34];
        let flagUpdateBool = false;
        flagUpdateBool = this.updateFlags(this.clientStorage.dSv_event_c_save, this.core.save.dSv_event_c_save, dSv_event_c_save_blacklist, 0) || flagUpdateBool;
        flagUpdateBool = this.updateFlags(this.clientStorage.dSv_event_c, this.core.save.dSv_event_c, dSv_event_c_save_blacklist, 0) || flagUpdateBool;
        flagUpdateBool = this.updateFlags(this.clientStorage.dSv_memory_c_save, this.core.save.dSv_memory_c_save, [], 2) || flagUpdateBool;
        //flagUpdateBool = this.updateFlags(this.clientStorage.dSv_memory_c, this.core.save.dSv_memory_c, [], 3) || flagUpdateBool;
        //flagUpdateBool = this.updateFlags(this.clientStorage.dSv_zone_c_actor, this.core.save.dSv_zone_c_actor, [], 4) || flagUpdateBool;
        //flagUpdateBool = this.updateFlags(this.clientStorage.dSv_zone_c_zoneBit, this.core.save.dSv_zone_c_zoneBit, [], 5) || flagUpdateBool;
        if (flagUpdateBool) {
            this.ModLoader.clientSide.sendPacket(new WWO_FlagUpdate(this.ModLoader.clientLobby, this.clientStorage.dSv_event_c_save, this.clientStorage.dSv_event_c, this.clientStorage.dSv_memory_c_save, this.clientStorage.dSv_memory_c, this.clientStorage.dSv_zone_c_actor, this.clientStorage.dSv_zone_c_zoneBit));
            //this.clientStorage.dSv_zone_c_actor = this.core.save.dSv_zone_c_actor;
            //this.clientStorage.dSv_zone_c_zoneBit = this.core.save.dSv_zone_c_zoneBit;
            this.clientStorage.dSv_event_c_save = this.ModLoader.utils.cloneBuffer(this.core.save.dSv_event_c_save);
            this.clientStorage.dSv_memory_c_save = this.ModLoader.utils.cloneBuffer(this.core.save.dSv_memory_c_save);
            //this.clientStorage.dSv_memory_c = this.core.save.dSv_memory_c;
            this.clientStorage.dSv_event_c = this.ModLoader.utils.cloneBuffer(this.core.save.dSv_event_c);
        }
    }
}

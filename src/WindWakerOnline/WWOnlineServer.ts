import { WWO_PRIVATE_EVENTS } from "./api/InternalAPI";
import { WWOEvents, WWOPlayerScene } from "./api/WWOAPI";
import { InjectCore } from "modloader64_api/CoreInjection";
import { EventHandler, EventsServer, EventServerJoined, EventServerLeft, bus } from "modloader64_api/EventHandler";
import { IModLoaderAPI, IPlugin } from "modloader64_api/IModLoaderAPI";
import { ModLoaderAPIInject } from "modloader64_api/ModLoaderAPIInjector";
import { IPacketHeader, LobbyData, ServerNetworkHandler } from "modloader64_api/NetworkHandler";
import { Preinit } from "modloader64_api/PluginLifecycle";
import { ParentReference, SidedProxy, ProxySide } from "modloader64_api/SidedProxy/SidedProxy";
import { WWO_ScenePacket, WWO_DownloadRequestPacket, WWO_DownloadResponsePacket, WWO_UpdateSaveDataPacket, WWO_ErrorPacket, WWO_RoomPacket, WWO_BottleUpdatePacket, WWO_RupeePacket, WWO_FlagUpdate, WWO_LiveFlagUpdate, WWO_RegionFlagUpdate, WWO_ClientSceneContextUpdate } from "./network/WWOPackets";
import { WWOSaveData } from "./save/WWOnlineSaveData";
import { WWOnlineStorage, WWOnlineSave_Server } from "./storage/WWOnlineStorage";
import WWSerialize from "./storage/WWSerialize";
import { InventoryItem, IWWCore } from "WindWaker/API/WWAPI";
import { parseFlagChanges } from "./save/parseFlagChanges";
import bitwise from 'bitwise';
import { PuppetOverlord } from "./puppet/PuppetOverlord";

export default class WWOnlineServer {

    @InjectCore()
    core!: IWWCore;
    @ModLoaderAPIInject()
    ModLoader!: IModLoaderAPI;
    @ParentReference()
    parent!: IPlugin;
    //@SidedProxy(ProxySide.SERVER, PuppetOverlord)
    //puppets!: PuppetOverlord;

    sendPacketToPlayersInScene(packet: IPacketHeader) {
        try {
            let storage: WWOnlineStorage = this.ModLoader.lobbyManager.getLobbyStorage(
                packet.lobby,
                this.parent
            ) as WWOnlineStorage;
            if (storage === null) {
                return;
            }
            Object.keys(storage.players).forEach((key: string) => {
                if (storage.players[key] === storage.players[packet.player.uuid]) {
                    if (storage.networkPlayerInstances[key].uuid !== packet.player.uuid) {
                        this.ModLoader.serverSide.sendPacketToSpecificPlayer(
                            packet,
                            storage.networkPlayerInstances[key]
                        );
                    }
                }
            });
        } catch (err: any) { }
    }

    @EventHandler(EventsServer.ON_LOBBY_CREATE)
    onLobbyCreated(lobby: string) {
        try {
            this.ModLoader.lobbyManager.createLobbyStorage(lobby, this.parent, new WWOnlineStorage());
            let storage: WWOnlineStorage = this.ModLoader.lobbyManager.getLobbyStorage(
                lobby,
                this.parent
            ) as WWOnlineStorage;
            if (storage === null) {
                return;
            }
            storage.saveManager = new WWOSaveData(this.core, this.ModLoader);
        }
        catch (err: any) {
            this.ModLoader.logger.error(err);
        }
    }

    @Preinit()
    preinit() {

    }

    @EventHandler(EventsServer.ON_LOBBY_DATA)
    onLobbyData(ld: LobbyData) {
    }

    @EventHandler(EventsServer.ON_LOBBY_JOIN)
    onPlayerJoin_server(evt: EventServerJoined) {
        let storage: WWOnlineStorage = this.ModLoader.lobbyManager.getLobbyStorage(
            evt.lobby,
            this.parent
        ) as WWOnlineStorage;
        if (storage === null) {
            return;
        }
        storage.players[evt.player.uuid] = -1;
        storage.networkPlayerInstances[evt.player.uuid] = evt.player;
    }

    @EventHandler(EventsServer.ON_LOBBY_LEAVE)
    onPlayerLeft_server(evt: EventServerLeft) {
        let storage: WWOnlineStorage = this.ModLoader.lobbyManager.getLobbyStorage(
            evt.lobby,
            this.parent
        ) as WWOnlineStorage;
        if (storage === null) {
            return;
        }
        delete storage.players[evt.player.uuid];
        delete storage.networkPlayerInstances[evt.player.uuid];
    }

    @ServerNetworkHandler('WWO_ScenePacket')
    onSceneChange_server(packet: WWO_ScenePacket) {
        try {
            let storage: WWOnlineStorage = this.ModLoader.lobbyManager.getLobbyStorage(
                packet.lobby,
                this.parent
            ) as WWOnlineStorage;
            if (storage === null) {
                return;
            }
            storage.players[packet.player.uuid] = packet.scene;
            this.ModLoader.logger.info(
                'Server: Player ' +
                packet.player.nickname +
                ' moved to scene ' +
                packet.scene +
                '.'
            );
            bus.emit(WWOEvents.SERVER_PLAYER_CHANGED_SCENES, new WWO_ScenePacket(packet.lobby, packet.scene));
        } catch (err: any) {
        }
    }

    @ServerNetworkHandler('WWO_RoomPacket')
    onRoomChange_server(packet: WWO_RoomPacket) {
        try {
            let storage: WWOnlineStorage = this.ModLoader.lobbyManager.getLobbyStorage(
                packet.lobby,
                this.parent
            ) as WWOnlineStorage;
            if (storage === null) {
                return;
            }
            storage.players[packet.player.uuid] = packet.room;
            this.ModLoader.logger.info(
                'Server: Player ' +
                packet.player.nickname +
                ' moved to room ' +
                packet.room +
                '.'
            );
            bus.emit(WWOEvents.SERVER_PLAYER_CHANGED_ROOMS, new WWO_RoomPacket(packet.lobby, packet.scene, packet.room));
        } catch (err: any) {
        }
    }

    // Client is logging in and wants to know how to proceed.
    @ServerNetworkHandler('WWO_DownloadRequestPacket')
    onDownloadPacket_server(packet: WWO_DownloadRequestPacket) {
        let storage: WWOnlineStorage = this.ModLoader.lobbyManager.getLobbyStorage(
            packet.lobby,
            this.parent
        ) as WWOnlineStorage;
        if (storage === null) {
            return;
        }
        if (typeof storage.worlds[packet.player.data.world] === 'undefined') {
            this.ModLoader.logger.info(`Creating world ${packet.player.data.world} for lobby ${packet.lobby}.`);
            storage.worlds[packet.player.data.world] = new WWOnlineSave_Server();
        }
        let world = storage.worlds[packet.player.data.world];
        if (world.saveGameSetup) {
            // Game is running, get data.
            let resp = new WWO_DownloadResponsePacket(packet.lobby, false);
            WWSerialize.serialize(world.save).then((buf: Buffer) => {
                resp.save = buf;
                this.ModLoader.serverSide.sendPacketToSpecificPlayer(resp, packet.player);
            }).catch((err: string) => { });
        } else {
            // Game is not running, give me your data.
            WWSerialize.deserialize(packet.save).then((data: any) => {
                Object.keys(data).forEach((key: string) => {
                    let obj = data[key];
                    world.save[key] = obj;
                });
                world.saveGameSetup = true;
                let resp = new WWO_DownloadResponsePacket(packet.lobby, true);
                this.ModLoader.serverSide.sendPacketToSpecificPlayer(resp, packet.player);
            });
        }
    }

    @ServerNetworkHandler('WWO_BottleUpdatePacket')
    onBottle_server(packet: WWO_BottleUpdatePacket) {
        let storage: WWOnlineStorage = this.ModLoader.lobbyManager.getLobbyStorage(
            packet.lobby,
            this.parent
        ) as WWOnlineStorage;
        if (storage === null) {
            return;
        }
        let world = storage.worlds[packet.player.data.world];
        if (packet.contents === InventoryItem.NONE) return;
        switch (packet.slot) {
            case 0:
                world.save.inventory.FIELD_BOTTLE1 = packet.contents;
                break;
            case 1:
                world.save.inventory.FIELD_BOTTLE2 = packet.contents;
                break;
            case 2:
                world.save.inventory.FIELD_BOTTLE3 = packet.contents;
                break;
            case 3:
                world.save.inventory.FIELD_BOTTLE4 = packet.contents;
                break;
        }
    }

    @ServerNetworkHandler('WWO_ClientSceneContextUpdate')
    onSceneContextSync_server(packet: WWO_ClientSceneContextUpdate) {
        this.ModLoader.serverSide.sendPacket(packet);
    }

    /* @ServerNetworkHandler('WWO_RupeePacket')
    onRupees(packet: WWO_RupeePacket) {
        let storage: WWOnlineStorage = this.ModLoader.lobbyManager.getLobbyStorage(
            packet.lobby,
            this.parent
        ) as WWOnlineStorage;
        if (storage === null) {
            return;
        }

        this.ModLoader.logger.info(`Server: Got Rupees with Delta ${packet.delta}`);

        let lastRupees = storage.inventoryStorage.rupeeCount;

        storage.inventoryStorage.rupeeCount += packet.delta;

        if (storage.inventoryStorage.rupeeCount < 0) storage.inventoryStorage.rupeeCount = 0;
        if (storage.inventoryStorage.rupeeCount > 5000) storage.inventoryStorage.rupeeCount = 5000;
        
        if (storage.inventoryStorage.rupeeCount - lastRupees !== 0) this.ModLoader.serverSide.sendPacket(new WWO_RupeePacket(packet.delta, packet.lobby));

    } */
    //------------------------------
    // Flag Syncing
    //------------------------------

    @ServerNetworkHandler('WWO_FlagUpdate')
    onFlagUpdate(packet: WWO_FlagUpdate) {
        let storage: WWOnlineStorage = this.ModLoader.lobbyManager.getLobbyStorage(
            packet.lobby,
            this.parent
        ) as WWOnlineStorage;
        if (storage === null) {
            return;
        }

        //console.log("onFlagUpdate Server");

        let eventFlags = storage.eventFlags;
        parseFlagChanges(packet.eventFlags, eventFlags);

        eventFlags[0x0] &= 0xEF; //FOREST_OF_FAIRIES_BOKOBLINS_SPAWNED
        eventFlags[0x1] &= 0x7F; //RESCUED_TETRA
        eventFlags[0x2] &= 0xFE; //SAW_TETRA_IN_FOREST_OF_FAIRIES
        eventFlags[0x3] &= 0x7F; //KILLED_ONE_FOREST_OF_FAIRIES_BOKOBLIN
        eventFlags[0x4] &= 0xFE; //KILLED_BOTH_FOREST_OF_FAIRIES_BOKOBLINS
        eventFlags[0x5] &= 0xFB; //GOSSIP_STONE_AT_FF1
        eventFlags[0x7] &= 0xF3; //SAW_PIRATE_SHIP_MINIGAME_INTRO | COMPLETED_PIRATE_SHIP_MINIGAME
        eventFlags[0x8] &= 0x34; //LONG_TETRA_TEXT_ON_OUTSET | COMPLETED_PIRATE_SHIP_MINIGAME_AND_SPAWN_ON_PIRATE_SHIP | GOT_CATAPULTED_TO_FF1_AND_SPAWN_THERE | TETRA_TOLD_YOU_TO_CLIMB_UP_THE_LADDER
        eventFlags[0x9] &= 0xF5; //After Aryll or Talk w/ Tetra | Entered Dragon Roost Island 
        eventFlags[0xE] &= 0xFB; //exited forest of fairies with tetra?
        eventFlags[0xF] &= 0xFE; //KORL_UNLOCKED_AND_SPAWN_ON_WINDFALL
        eventFlags[0x24] &= 0x7F; //WATCHED_DEPARTURE_CUTSCENE_AND_SPAWN_ON_PIRATE_SHIP
        eventFlags[0x25] &= 0xFE; //WATCHED_FIND_SISTER_IN_FF1_CUTSCENE
        eventFlags[0x2D] &= 0xF7; //tetra and her gang free mila maggie and aryll from the prison
        eventFlags[0x2E] &= 0xF7; //WATCHED_MEETING_KORL_CUTSCENE
        eventFlags[0x34] &= 0xFC; //Medli/Makar has been kidnapped by a Floormaster
        eventFlags[0x9D] &= 0xFC; //Grandma Healed / Letter
        eventFlags[0xac] &= 0xFC; //Letter to Mom
        eventFlags[0xc9] &= 0xFC; //Goron Trade Counter

        storage.eventFlags = eventFlags;
        this.ModLoader.serverSide.sendPacket(new WWO_FlagUpdate(storage.eventFlags, packet.lobby));
    }

    @ServerNetworkHandler('WWO_RegionFlagUpdate')
    onRegionFlagUpdate(packet: WWO_RegionFlagUpdate) {
        let storage: WWOnlineStorage = this.ModLoader.lobbyManager.getLobbyStorage(
            packet.lobby,
            this.parent
        ) as WWOnlineStorage;
        if (storage === null) {
            return;
        }

        console.log("onRegionFlagUpdate Server")

        let regionFlagsStorage = storage.regionFlags;
        parseFlagChanges(packet.regionFlags, regionFlagsStorage);
        storage.regionFlags = regionFlagsStorage;

        this.ModLoader.serverSide.sendPacket(new WWO_RegionFlagUpdate(storage.regionFlags, packet.lobby));
    }

    @ServerNetworkHandler('WWO_UpdateSaveDataPacket')
    onSceneFlagSync_server(packet: WWO_UpdateSaveDataPacket) {
        let storage: WWOnlineStorage = this.ModLoader.lobbyManager.getLobbyStorage(
            packet.lobby,
            this.parent
        ) as WWOnlineStorage;
        if (storage === null) {
            return;
        }
        if (typeof storage.worlds[packet.player.data.world] === 'undefined') {
            if (packet.player.data.world === undefined) {
                this.ModLoader.serverSide.sendPacket(new WWO_ErrorPacket("The server has encountered an error with your world. (world id is undefined)", packet.lobby));
                return;
            } else {
                storage.worlds[packet.player.data.world] = new WWOnlineSave_Server();
            }
        }
        let world = storage.worlds[packet.player.data.world];
        storage.saveManager.mergeSave(packet.save, world.save, ProxySide.SERVER).then((bool: boolean) => {
            if (bool) {
                WWSerialize.serialize(world.save).then((buf: Buffer) => {
                    this.ModLoader.serverSide.sendPacket(new WWO_UpdateSaveDataPacket(packet.lobby, buf, packet.player.data.world));
                }).catch((err: string) => { });
            }
        });
    }
}
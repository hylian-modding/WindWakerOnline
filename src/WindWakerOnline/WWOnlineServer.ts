import { WWO_PRIVATE_EVENTS } from "./api/InternalAPI";
import { WWOEvents, WWOPlayerScene } from "./api/WWOAPI";
import { InjectCore } from "modloader64_api/CoreInjection";
import { EventHandler, EventsServer, EventServerJoined, EventServerLeft, bus } from "modloader64_api/EventHandler";
import { IModLoaderAPI, IPlugin } from "modloader64_api/IModLoaderAPI";
import { ModLoaderAPIInject } from "modloader64_api/ModLoaderAPIInjector";
import { IPacketHeader, LobbyData, ServerNetworkHandler } from "modloader64_api/NetworkHandler";
import { Preinit } from "modloader64_api/PluginLifecycle";
import { ParentReference, SidedProxy, ProxySide } from "modloader64_api/SidedProxy/SidedProxy";
import { WWO_ScenePacket, WWO_DownloadRequestPacket, WWO_DownloadResponsePacket, WWO_UpdateSaveDataPacket, WWO_ErrorPacket, WWO_RoomPacket, WWO_BottleUpdatePacket, WWO_RupeePacket, WWO_FlagUpdate, WWO_ClientSceneContextUpdate } from "./network/WWOPackets";
import { WWOSaveData } from "./save/WWOnlineSaveData";
import { WWOnlineStorage, WWOnlineSave_Server } from "./storage/WWOnlineStorage";
import WWSerialize from "./storage/WWSerialize";
import { InventoryItem, IWWCore } from "WindWaker/API/WWAPI";
import { parseFlagChanges } from "./save/parseFlagChanges";
import bitwise from 'bitwise';

export default class WWOnlineServer {

    @InjectCore()
    core!: IWWCore;
    @ModLoaderAPIInject()
    ModLoader!: IModLoaderAPI;
    @ParentReference()
    parent!: IPlugin;

    chao_data() { return 0 }

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
        try {
            let storage: WWOnlineStorage = this.ModLoader.lobbyManager.getLobbyStorage(
                packet.lobby,
                this.parent
            ) as WWOnlineStorage;
            if (storage === null) {
                return;
            }

            console.log("onFlagUpdate Server");

            // IDs for updateFlag blacklists
            let dSv_event_c_save_id = 0;
            let dSv_event_c_id = 1;
            let dSv_memory_c_save_id = 2;
            let dSv_memory_c_id = 3;
            let dSv_zone_c_actor_id = 4;
            let dSv_zone_c_zoneBit_id = 5;
            const dSv_event_c_save_blacklist = [0x1, 0x2, 0x5, 0x7, 0x8, 0xE, 0xF, 0x24, 0x25, 0x2D, 0x2E, 0x34];
            
            let temp_dSv_event_c_save = this.ModLoader.utils.cloneBuffer(storage.dSv_event_c_save);
            let temp_dSv_event_c = this.ModLoader.utils.cloneBuffer(storage.dSv_event_c);
            let temp_dSv_memory_c_save = this.ModLoader.utils.cloneBuffer(storage.dSv_memory_c_save);

            storage.dSv_event_c_save = this.updateFlags(storage.dSv_event_c_save, packet.dSv_event_c_save!, dSv_event_c_save_blacklist, dSv_event_c_save_id);
            storage.dSv_event_c = this.updateFlags(storage.dSv_event_c, packet.dSv_event_c!, dSv_event_c_save_blacklist, dSv_event_c_save_id);
            //this.updateFlags(storage.dSv_memory_c, packet.dSv_memory_c!, [], dSv_memory_c_id);
            storage.dSv_memory_c_save = this.updateFlags(storage.dSv_memory_c_save, packet.dSv_memory_c_save!, [], dSv_memory_c_save_id);
            //this.updateFlags(storage.dSv_zone_c_actor, packet.dSv_zone_c_actor!, [], dSv_zone_c_actor_id);
            //this.updateFlags(storage.dSv_zone_c_zoneBit, packet.dSv_zone_c_zoneBit!, [], dSv_zone_c_zoneBit_id);

            this.ModLoader.serverSide.sendPacket(new WWO_FlagUpdate(packet.lobby, storage.dSv_event_c_save, storage.dSv_event_c, storage.dSv_memory_c_save, storage.dSv_memory_c, storage.dSv_zone_c_actor));
        } catch (err: any) {
            console.log(err);
        };
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

    updateFlags(storage: Buffer, incoming: Buffer, blacklist: number[], flagID: number) {
        let flagStorage = this.ModLoader.utils.cloneBuffer(storage);
        let flagIncoming = this.ModLoader.utils.cloneBuffer(incoming);
        for (let i = 0; i < storage.byteLength; i++) {
            let byteStorage = flagStorage.readUInt8(i);
            let byteIncoming = flagIncoming.readUInt8(i);

            if (!blacklist.includes(i) && byteStorage !== byteIncoming) {
                console.log(`Server: Parsing flag ${flagID}: 0x${i.toString(16)}, byteIncoming: 0x${byteIncoming.toString(16)}, byteStorage: 0x${byteStorage} `);
                parseFlagChanges(flagIncoming, flagStorage);
            }
            else if (blacklist.includes(i) && byteStorage !== byteIncoming) {
                switch (flagID) {
                    case 0: //dSv_event_c_save_id = 0;
                        this.dSv_event_c_parse(flagStorage, byteStorage, byteIncoming, i);
                        break;
                    case 1: //dSv_event_c_id = 1;                       
                        break;
                    case 2: //dSv_memory_c_save_id = 2;
                        break;
                    case 3: //dSv_memory_c_id = 3;
                        break;
                    case 4:  //dSv_zone_c_actor_id = 4;
                        break;
                    case 5:  //dSv_zone_c_zoneBit_id = 5;
                        break;
                }
            }
        }
        storage = flagStorage;
        return storage;
    }

    dSv_event_c_parse(storageBuf: Buffer, byteStorage: number, byteIncoming: number, index: number) {
        let bitsStorage = bitwise.byte.read(byteStorage as any);
        let bitsIncoming = bitwise.byte.read(byteIncoming as any);
        for (let j = 0; j <= 7; j++) {
            switch (index) {
                case 0x0: //FOREST_OF_FAIRIES_BOKOBLINS_SPAWNED
                    if (j !== 5) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Server: Blacklisted event: 0x${i}, bit: ${j}`)
                    break;
                case 0x1: //RESCUED_TETRA
                    if (j !== 7) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Server: Blacklisted event: 0x${i}, bit: ${j}`)
                    break;
                case 0x2: //SAW_TETRA_IN_FOREST_OF_FAIRIES
                    if (j !== 0) bitsStorage[j] = bitsIncoming[j]; //set the bits that aren't blacklisted
                    //else console.log(`Server:Blacklisted event: 0x${i}, bit: ${j}`)
                    break;
                case 0x3: //KILLED_ONE_FOREST_OF_FAIRIES_BOKOBLIN
                    if (j !== 7) bitsStorage[j] = bitsIncoming[j]; //set the bits that aren't blacklisted
                    //else console.log(`Server:Blacklisted event: 0x${i}, bit: ${j}`)
                    break;
                case 0x4: //KILLED_BOTH_FOREST_OF_FAIRIES_BOKOBLINS
                    if (j !== 0) bitsStorage[j] = bitsIncoming[j]; //set the bits that aren't blacklisted
                    //else console.log(`Server:Blacklisted event: 0x${i}, bit: ${j}`)
                    break;
                case 0x5: //GOSSIP_STONE_AT_FF1
                    if (j !== 2) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Server: Blacklisted event: 0x${i}, bit: ${j}`)
                    break;
                case 0x7: //SAW_PIRATE_SHIP_MINIGAME_INTRO | COMPLETED_PIRATE_SHIP_MINIGAME
                    if (j !== 2 && j !== 3) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Server: Blacklisted event: 0x${i}, bit: ${j}`)
                    break;
                case 0x8: //LONG_TETRA_TEXT_ON_OUTSET | COMPLETED_PIRATE_SHIP_MINIGAME_AND_SPAWN_ON_PIRATE_SHIP | GOT_CATAPULTED_TO_FF1_AND_SPAWN_THERE | TETRA_TOLD_YOU_TO_CLIMB_UP_THE_LADDER
                    if (j !== 6 && j !== 7 && j !== 0 && j !== 3 && j !== 1) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Server: Blacklisted event: 0x${i}, bit: ${j}`)
                    break;
                case 0x9: //After Aryll or Talk w/ Tetra
                    if (j !== 3) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Server: Blacklisted event: 0x${i}, bit: ${j}`)
                    break;
                case 0xE: //exited forest of fairies with tetra?
                    if (j !== 2) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Server: Blacklisted event: 0x${i}, bit: ${j}`)
                    break;
                case 0xF: //KORL_UNLOCKED_AND_SPAWN_ON_WINDFALL
                    if (j !== 0) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Server: Blacklisted event: 0x${i}, bit: ${j}`)
                    break;
                case 0x24: //WATCHED_DEPARTURE_CUTSCENE_AND_SPAWN_ON_PIRATE_SHIP
                    if (j !== 7) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Server: Blacklisted event: 0x${i}, bit: ${j}`)
                    break;
                case 0x25: //WATCHED_FIND_SISTER_IN_FF1_CUTSCENE
                    if (j !== 0) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Server: Blacklisted event: 0x${i}, bit: ${j}`)
                    break;
                case 0x2D: //tetra and her gang free mila maggie and aryll from the prison
                    if (j !== 3) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Server: Blacklisted event: 0x${i}, bit: ${j}`)
                    break;
                case 0x2E: //WATCHED_MEETING_KORL_CUTSCENE
                    if (j !== 3) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Server: Blacklisted event: 0x${i}, bit: ${j}`)
                    break;
                case 0x34: //Medli/Makar has been kidnapped by a Floormaster
                    if (j !== 1 && j !== 0) bitsStorage[j] = bitsIncoming[j];
                    //else console.log(`Server: Blacklisted event: 0x${i}, bit: ${j}`)
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

    @ServerNetworkHandler('WWO_ClientSceneContextUpdate')
    onSceneContextSync_server(packet: WWO_ClientSceneContextUpdate) {
        this.sendPacketToPlayersInScene(packet);
    }
}
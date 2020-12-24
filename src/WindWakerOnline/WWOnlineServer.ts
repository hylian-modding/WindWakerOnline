import { EventHandler, EventsServer, EventServerJoined, EventServerLeft, bus } from 'modloader64_api/EventHandler';
import { WWOnlineStorage } from './WWOnlineStorage';
import { ParentReference, ProxySide, SidedProxy } from 'modloader64_api/SidedProxy/SidedProxy';
import { ModLoaderAPIInject } from 'modloader64_api/ModLoaderAPIInjector';
import { IModLoaderAPI, ModLoaderEvents } from 'modloader64_api/IModLoaderAPI';
import { ServerNetworkHandler, IPacketHeader } from 'modloader64_api/NetworkHandler';
import { WWO_ScenePacket, WWO_DownloadRequestPacket, WWO_DownloadResponsePacket, WWO_SubscreenSyncPacket, WWO_DownloadResponsePacket2, WWO_ServerFlagUpdate, WWO_ClientFlagUpdate } from './data/WWOPackets';
import { mergeInventoryData, mergeQuestData } from './data/WWOSaveData';
import { InjectCore } from 'modloader64_api/CoreInjection';
import * as API from 'WindWaker/API/Imports';
import { WWOnlineStorageClient } from './WWOnlineStorageClient';
import { WWOEvents, WWOPlayerScene } from './WWOAPI/WWOAPI';
import WindWakerOnline from './WindWakerOnline';

export class WWOnlineServer {
    @ModLoaderAPIInject()
    ModLoader!: IModLoaderAPI;
    @InjectCore()
    core!: API.IWWCore;
    @ParentReference()
    parent!: WindWakerOnline;
    clientStorage: WWOnlineStorageClient = new WWOnlineStorageClient();

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
                //if (storage.players[key] === storage.players[packet.player.uuid]) {
                if (storage.networkPlayerInstances[key].uuid !== packet.player.uuid) {
                    this.ModLoader.serverSide.sendPacketToSpecificPlayer(
                        packet,
                        storage.networkPlayerInstances[key]
                    );
                }
                //}
            });
        } catch (err) { }
    }

    @EventHandler(EventsServer.ON_LOBBY_CREATE)
    onLobbyCreated(lobby: string) {
        try {
            this.ModLoader.lobbyManager.createLobbyStorage(lobby, this.parent, new WWOnlineStorage());
        }
        catch (err) {
            this.ModLoader.logger.error(err);
        }
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
                'client receive: Player ' +
                packet.player.nickname +
                ' moved to scene: ' +
                packet.scene +
                '.'
            );
            
            bus.emit(WWOEvents.SERVER_PLAYER_CHANGED_SCENES, new WWOPlayerScene(packet.player, packet.lobby, packet.scene));
        } catch (err) {
        }
    }

    //------------------------------
    // Subscreen Syncing
    //------------------------------

    // Client is logging in and wants to know how to proceed.
    @ServerNetworkHandler('WWO_DownloadRequestPacket')
    onDownloadPacket_server(packet: WWO_DownloadRequestPacket) {
        this.ModLoader.logger.debug("WWO_DownloadRequestPacket Recieved");
        let storage: WWOnlineStorage = this.ModLoader.lobbyManager.getLobbyStorage(
            packet.lobby,
            this.parent
        ) as WWOnlineStorage;
        if (storage === null) {
            return;
        }
        if (storage.saveGameSetup) {
            // Game is running, get data.
            this.ModLoader.serverSide.sendPacketToSpecificPlayer(
                new WWO_DownloadResponsePacket(
                    new WWO_SubscreenSyncPacket(
                        storage.inventoryStorage,
                        storage.questStorage,
                        packet.lobby
                    ),
                    new WWO_ServerFlagUpdate(
                        storage.questStorage.bracelet,
                        storage.questStorage.pirate_charm,
                        storage.questStorage.hero_charm,
                        storage.questStorage.sectors,
                        storage.questStorage.deciphered_triforce,
                        storage.questStorage.pearls,
                        storage.questStorage.songs,
                        storage.questStorage.triforce,
                        storage.questStorage.completed_charts,
                        storage.questStorage.opened_charts,
                        storage.questStorage.owned_charts,
                        packet.lobby
                    ),
                    packet.lobby
                ),
                packet.player
            );
        } else {
            // Game is not running, give me your data.
            this.ModLoader.serverSide.sendPacketToSpecificPlayer(
                new WWO_DownloadResponsePacket2(packet.lobby),
                packet.player
            );
        }
    }

    @ServerNetworkHandler('WWO_SubscreenSyncPacket')
    onItemSync_server(packet: WWO_SubscreenSyncPacket) {
        let storage: WWOnlineStorage = this.ModLoader.lobbyManager.getLobbyStorage(
            packet.lobby,
            this.parent
        ) as WWOnlineStorage;
        if (storage === null) {
            return;
        }
        mergeInventoryData(storage.inventoryStorage, packet.inventory);
        mergeQuestData(storage.questStorage, packet.quest);

        this.ModLoader.serverSide.sendPacket(
            new WWO_SubscreenSyncPacket(
                storage.inventoryStorage,
                storage.questStorage,
                packet.lobby
            )
        );
        storage.saveGameSetup = true;
    }

    @ServerNetworkHandler('WWO_ClientFlagUpdate')
    onSceneFlagSync_server(packet: WWO_ClientFlagUpdate) {
        let storage: WWOnlineStorage = this.ModLoader.lobbyManager.getLobbyStorage(
            packet.lobby,
            this.parent
        ) as WWOnlineStorage;
        if (storage === null) {
            return;
        }

        for (let i = 0; i < packet.bracelet.byteLength; i++) {
            let value = packet.bracelet[i];
            if (storage.questStorage.bracelet[i] !== value) {
                storage.questStorage.bracelet[i] |= value;
            }
        }
        for (let i = 0; i < packet.pirate_charm.byteLength; i++) {
            let value = packet.pirate_charm[i];
            if (storage.questStorage.pirate_charm[i] !== value) {
                storage.questStorage.pirate_charm[i] |= value;
            }
        }
        for (let i = 0; i < packet.hero_charm.byteLength; i++) {
            let value = packet.hero_charm[i];
            if (storage.questStorage.hero_charm[i] !== value) {
                storage.questStorage.hero_charm[i] |= value;
            }
        }
        for (let i = 0; i < packet.sectors.byteLength; i++) {
            let value = packet.sectors[i];
            if (storage.questStorage.sectors[i] !== value) {
                storage.questStorage.sectors[i] |= value;
            }
        }
        for (let i = 0; i < packet.dec_tri.byteLength; i++) {
            let value = packet.dec_tri[i];
            if (storage.questStorage.deciphered_triforce[i] !== value) {
                storage.questStorage.deciphered_triforce[i] |= value;
            }
        }
        for (let i = 0; i < packet.pearls.byteLength; i++) {
            let value = packet.pearls[i];
            if (storage.questStorage.pearls[i] !== value) {
                storage.questStorage.pearls[i] |= value;
            }
        }
        for (let i = 0; i < packet.song.byteLength; i++) {
            let value = packet.song[i];
            if (storage.questStorage.songs[i] !== value) {
                storage.questStorage.songs[i] |= value;
            }
        }
        for (let i = 0; i < packet.triforce.byteLength; i++) {
            let value = packet.triforce[i];
            if (storage.questStorage.triforce[i] !== value) {
                storage.questStorage.triforce[i] |= value;
            }
        }
        for (let i = 0; i < packet.compChart.byteLength; i++) {
            let value = packet.compChart[i];
            if (storage.questStorage.completed_charts[i] !== value) {
                storage.questStorage.completed_charts[i] |= value;
            }
        }
        for (let i = 0; i < packet.openChart.byteLength; i++) {
            let value = packet.openChart[i];
            if (storage.questStorage.opened_charts[i] !== value) {
                storage.questStorage.opened_charts[i] |= value;
            }
        }
        for (let i = 0; i < packet.ownChart.byteLength; i++) {
            let value = packet.ownChart[i];
            if (storage.questStorage.owned_charts[i] !== value) {
                storage.questStorage.owned_charts[i] |= value;
            }
        }
        this.ModLoader.serverSide.sendPacket(
            new WWO_ServerFlagUpdate(
                storage.questStorage.bracelet,
                storage.questStorage.pirate_charm,
                storage.questStorage.hero_charm,
                storage.questStorage.sectors,
                storage.questStorage.deciphered_triforce,
                storage.questStorage.pearls,
                storage.questStorage.songs,
                storage.questStorage.triforce,
                storage.questStorage.completed_charts,
                storage.questStorage.opened_charts,
                storage.questStorage.owned_charts,
                packet.lobby
            )
        );
    }

}
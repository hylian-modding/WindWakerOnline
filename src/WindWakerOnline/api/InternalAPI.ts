import { INetworkPlayer, IPacketHeader } from "modloader64_api/NetworkHandler";
export const enum WWO_PRIVATE_EVENTS {
    DOING_SYNC_CHECK = "DOING_SYNC_CHECK",
}

export class SendToPlayer{
    packet: IPacketHeader;
    player: INetworkPlayer;

    constructor(player: INetworkPlayer, packet: IPacketHeader){
        this.packet = packet;
        this.player = player;
    }
}
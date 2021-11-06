
export interface IWWClientStorage{
    world: number;
    localization: any;
}

export interface IWWClientside {
    getClientStorage(): IWWClientStorage;
}
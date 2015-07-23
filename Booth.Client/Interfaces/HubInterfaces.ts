interface SignalR {
    boothHub: BoothHubProxy;
}
interface BoothHubProxy {
    client: BoothClient;
    server: BoothServer;
}
interface BoothClient {
    onJoinedBooth: (userName: string) => void;
    onLeftBooth: (userName: string) => void;
    onSignallingInfoRecieved: (userName: string, signallingInfo: string) => void;
}
interface BoothServer {
    joinBooth(boothName: string): JQueryPromise<void>;
    leaveBooth(boothName: string): JQueryPromise<void>;
    sendSignallingInfo(signallingInfo: string): JQueryPromise<void>;
} 
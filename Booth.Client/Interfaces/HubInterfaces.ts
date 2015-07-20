interface SignalR {
    boothHub: BoothHubProxy;
}
interface BoothHubProxy {
    client: BoothClient;
    server: BoothServer;
}
interface BoothClient {
    onJoinedBooth: (userName: string) => void;
}
interface BoothServer {
    joinBooth(boothName: string): JQueryPromise<void>;
    leaveBooth(boothName: string): JQueryPromise<void>;
} 
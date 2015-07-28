/// <reference path="./scripts/typings/jquery/jquery.d.ts" />
/// <reference path="./scripts/typings/signalr/signalr.d.ts" />

module booth {

    var _client: Client;
    var _logger: Logger = new Logger();
    
    export function onLog(logHandler: (message: string) => void) {
        _logger.logHandler = logHandler;
    }

    export function onMessage(messageHandler: (message: string) => void) {

        if (_client) {
            _client.onmessage = messageHandler;
        }
    }

    export function join(boothName: string, connection: SignalR) {

        _client = new Client(boothName, connection);

        _client.logger = _logger;

        _client.join();
    }

    export function sendMessage(message: string) {

        if (_client) {
            _client.send(message);
        }
    }
}  
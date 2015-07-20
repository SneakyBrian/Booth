/// <reference path="../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../scripts/typings/signalr/signalr.d.ts" />

module booth {

    export class Client {

        private boothName: string;
        private boothHub: BoothHubProxy;

        constructor(boothName: string) {
            this.boothName = boothName;
        }

        join() {

            this.boothHub = $.connection.boothHub;

            this.boothHub.client.onJoinedBooth = (userName) => {
                console.log(userName + " joined Booth " + this.boothName);
            };

            $.connection.hub.start().done(() => {
                this.boothHub.server.joinBooth(this.boothName);
            });
        }


        leave() {
            this.boothHub.server.leaveBooth(this.boothName);
        }
    }
} 
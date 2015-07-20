/// <reference path="../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../scripts/typings/signalr/signalr.d.ts" />
var booth;
(function (booth) {
    var Client = (function () {
        function Client(boothName) {
            this.boothName = boothName;
        }
        Client.prototype.join = function () {
            var _this = this;
            this.boothHub = $.connection.boothHub;
            this.boothHub.client.onJoinedBooth = function (userName) {
                console.log(userName + " joined Booth " + _this.boothName);
            };
            $.connection.hub.start().done(function () {
                _this.boothHub.server.joinBooth(_this.boothName);
            });
        };
        Client.prototype.leave = function () {
            this.boothHub.server.leaveBooth(this.boothName);
        };
        return Client;
    })();
    booth.Client = Client;
})(booth || (booth = {}));
var booth;
(function (booth) {
    var client;
    function init(boothName) {
        client = new booth.Client(boothName);
    }
    booth.init = init;
    function join() {
        client.join();
    }
    booth.join = join;
})(booth || (booth = {}));
//# sourceMappingURL=Booth.Client.js.map
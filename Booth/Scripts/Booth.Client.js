/// <reference path="../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../scripts/typings/signalr/signalr.d.ts" />
/// <reference path="../scripts/typings/webrtc/rtcpeerconnection.d.ts" />
var booth;
(function (booth) {
    //https://github.com/samdutton/simpl/blob/master/rtcdatachannel/js/main.js
    var Client = (function () {
        function Client(boothName, connection) {
            this._boothName = boothName;
            this._connection = connection;
            //simple polyfill for getUserMedia
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        }
        Object.defineProperty(Client.prototype, "logger", {
            get: function () {
                return this._logger;
            },
            set: function (logger) {
                this._logger = logger;
            },
            enumerable: true,
            configurable: true
        });
        Client.prototype.join = function () {
            var _this = this;
            this._boothHub = this._connection.boothHub;
            this._boothHub.client.onJoinedBooth = function (userName) {
                _this.log(userName + " joined Booth " + _this._boothName);
                _this.start(true);
            };
            this._boothHub.client.onLeftBooth = function (userName) {
                _this.log(userName + " left Booth " + _this._boothName);
                _this._peerConnection.close();
            };
            this._boothHub.client.onSignallingInfoRecieved = function (userName, signallingInfo) {
                _this.log(userName + " sent signalling info: " + signallingInfo);
                if (!_this._peerConnection) {
                    _this.start(false);
                }
                var signal = JSON.parse(signallingInfo);
                if (signal.sdp) {
                    _this._peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                }
                else if (signal.candidate) {
                    _this._peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate), function () {
                        _this.log("addIceCandidate success");
                    }, function () {
                        _this.log("addIceCandidate fail");
                    });
                }
            };
            this._connection.hub.start().done(function () {
                _this._boothHub.server.joinBooth(_this._boothName);
            });
        };
        Client.prototype.leave = function () {
            this._boothHub.server.leaveBooth(this._boothName);
            this._peerConnection.close();
        };
        Client.prototype.log = function (message) {
            if (this.logger) {
                this.logger.log(message);
            }
        };
        Client.prototype.start = function (caller) {
            var _this = this;
            var config = { iceServers: [] };
            this._peerConnection = new webkitRTCPeerConnection(config);
            this._peerConnection.onicecandidate = function (evt) {
                _this.log("onicecandidate " + evt.candidate);
                _this._boothHub.server.sendSignallingInfo(JSON.stringify({ "candidate": evt.candidate }));
            };
            // once remote stream arrives, show it in the remote video element
            this._peerConnection.onaddstream = function (evt) {
                _this.log("onaddstream");
                var remoteView = document.getElementById("remoteView");
                remoteView.src = URL.createObjectURL(evt.stream);
            };
            // get the local stream, show it in the local video element and send it
            var mediaStreamConstraints = { video: true, audio: true };
            navigator.getUserMedia(mediaStreamConstraints, function (stream) {
                var localView = document.getElementById("localView");
                localView.src = URL.createObjectURL(stream);
                _this._peerConnection.addStream(stream);
                var gotDescription = function (desc) {
                    _this.log("gotDescription");
                    _this._peerConnection.setLocalDescription(desc);
                    _this._boothHub.server.sendSignallingInfo(JSON.stringify({ "sdp": desc }));
                };
                if (caller) {
                    _this._peerConnection.createOffer(gotDescription);
                }
                else {
                    _this._peerConnection.createAnswer(gotDescription);
                }
            }, function (error) {
                _this.log(error.name + " - " + error.message);
            });
        };
        return Client;
    })();
    booth.Client = Client;
})(booth || (booth = {}));
var booth;
(function (booth) {
    var Logger = (function () {
        function Logger() {
        }
        Object.defineProperty(Logger.prototype, "logHandler", {
            get: function () {
                return this._logHandler;
            },
            set: function (logHandler) {
                this._logHandler = logHandler;
            },
            enumerable: true,
            configurable: true
        });
        Logger.prototype.log = function (message) {
            if (this._logHandler) {
                this._logHandler(message);
            }
            console.log(message);
        };
        return Logger;
    })();
    booth.Logger = Logger;
})(booth || (booth = {}));
/// <reference path="./scripts/typings/jquery/jquery.d.ts" />
/// <reference path="./scripts/typings/signalr/signalr.d.ts" />
var booth;
(function (booth) {
    var _client;
    var _logger = new booth.Logger();
    function onLog(logHandler) {
        _logger.logHandler = logHandler;
    }
    booth.onLog = onLog;
    function join(boothName, connection) {
        _client = new booth.Client(boothName, connection);
        _client.logger = _logger;
        _client.join();
    }
    booth.join = join;
})(booth || (booth = {}));
//# sourceMappingURL=Booth.Client.js.map
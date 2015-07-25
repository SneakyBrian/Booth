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
                if (!_this._peerConnection) {
                    _this.start(true);
                }
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
                if (signal && signal.sdp) {
                    _this._peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
                }
                else if (signal && signal.candidate) {
                    _this._peerConnection.addIceCandidate(new RTCIceCandidate(signal), function () {
                        _this.log("addIceCandidate success");
                    }, function (error) {
                        _this.log("addIceCandidate fail: " + error.toString());
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
        Client.prototype.logError = function (error) {
            this.log(error.name + " - " + error.message);
        };
        Client.prototype.start = function (caller) {
            var _this = this;
            var config = {
                'iceServers': [
                    {
                        'url': 'stun:stun.l.google.com:19302'
                    },
                    {
                        'url': 'stun:global.stun.twilio.com:3478?transport=udp'
                    },
                    {
                        'url': 'turn:192.158.29.39:3478?transport=udp',
                        'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                        'username': '28224511:1379330808'
                    },
                    {
                        'url': 'turn:192.158.29.39:3478?transport=tcp',
                        'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                        'username': '28224511:1379330808'
                    }
                ]
            };
            this._peerConnection = new webkitRTCPeerConnection(config);
            this._peerConnection.onicecandidate = function (evt) { return _this.onicecandidate(evt); };
            this._peerConnection.onaddstream = function (evt) { return _this.onaddstream(evt); };
            var mediaStreamConstraints = { video: true, audio: true };
            navigator.getUserMedia(mediaStreamConstraints, function (stream) { return _this.ongetUserMediaSuccess(stream, caller); }, this.logError);
        };
        Client.prototype.onicecandidate = function (evt) {
            if (evt && evt.candidate) {
                var candidateInfo = JSON.stringify(evt.candidate);
                this.log("onicecandidate " + candidateInfo);
                this._boothHub.server.sendSignallingInfo(candidateInfo);
            }
            else {
                this.log("onicecandidate - no ice candidate info!");
            }
        };
        Client.prototype.onaddstream = function (evt) {
            // once remote stream arrives, show it in the remote video element
            this.log("onaddstream");
            var remoteView = document.getElementById("remoteView");
            remoteView.src = URL.createObjectURL(evt.stream);
        };
        Client.prototype.ongetUserMediaSuccess = function (stream, caller) {
            // get the local stream, show it in the local video element and send it
            var _this = this;
            var localView = document.getElementById("localView");
            localView.src = URL.createObjectURL(stream);
            this._peerConnection.addStream(stream);
            if (caller) {
                this._peerConnection.createOffer(function (desc) { return _this.gotDescription(desc); });
            }
            else {
                this._peerConnection.createAnswer(function (desc) { return _this.gotDescription(desc); });
            }
        };
        Client.prototype.gotDescription = function (desc) {
            var descInfo = JSON.stringify(desc);
            this.log("gotDescription " + descInfo);
            this._peerConnection.setLocalDescription(desc);
            this._boothHub.server.sendSignallingInfo(descInfo);
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
/// <reference path="../scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../scripts/typings/signalr/signalr.d.ts" />
/// <reference path="../scripts/typings/webrtc/rtcpeerconnection.d.ts" />

module booth {

    //https://github.com/samdutton/simpl/blob/master/rtcdatachannel/js/main.js

    export class Client {

        private _boothName: string;
        private _boothHub: BoothHubProxy;
        private _logger: Logger;
        private _connection: SignalR;
        private _peerConnection: RTCPeerConnection;

        constructor(boothName: string, connection: SignalR) {
            this._boothName = boothName;
            this._connection = connection;

            //simple polyfill for getUserMedia
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        }

        public set logger(logger: Logger) {
            this._logger = logger; 
        }

        public get logger() {
            return this._logger;
        }

        public join() {

            this._boothHub = this._connection.boothHub;

            this._boothHub.client.onJoinedBooth = (userName) => {
                this.log(userName + " joined Booth " + this._boothName);
                this.start(true);
            };

            this._boothHub.client.onLeftBooth = (userName) => {
                this.log(userName + " left Booth " + this._boothName);
                this._peerConnection.close();
            };

            this._boothHub.client.onSignallingInfoRecieved = (userName, signallingInfo) => {
                
                this.log(userName + " sent signalling info: " + signallingInfo);

                if (!this._peerConnection) {
                    this.start(false);
                }

                var signal = JSON.parse(signallingInfo);
                if (signal.sdp) {
                    this._peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                } else if (signal.candidate) {
                    this._peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate),
                        () => {
                            this.log("addIceCandidate success");
                        },
                        () => {
                            this.log("addIceCandidate fail");
                        });
                }
            };

            this._connection.hub.start().done(() => {
                this._boothHub.server.joinBooth(this._boothName);
            });
        }


        public leave() {
            this._boothHub.server.leaveBooth(this._boothName);
            this._peerConnection.close();
        }

        private log(message: string) {
            if (this.logger) {
                this.logger.log(message);
            }
        }

        private start(caller: boolean) {

            var config: RTCPeerConnectionConfig = {
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

            this._peerConnection.onicecandidate = (evt) => {

                var candidateInfo = JSON.stringify({ "candidate": evt.candidate });

                this.log("onicecandidate " + candidateInfo);

                this._boothHub.server.sendSignallingInfo(candidateInfo);
            };

            // once remote stream arrives, show it in the remote video element
            this._peerConnection.onaddstream = (evt) => {
                this.log("onaddstream");

                var remoteView: HTMLVideoElement = <HTMLVideoElement>document.getElementById("remoteView");
                remoteView.src = URL.createObjectURL(evt.stream);
            };

            // get the local stream, show it in the local video element and send it

            var mediaStreamConstraints: MediaStreamConstraints = { video: true, audio: true };

            navigator.getUserMedia(mediaStreamConstraints,(stream) => {

                var localView: HTMLVideoElement = <HTMLVideoElement>document.getElementById("localView");
                localView.src = URL.createObjectURL(stream);

                this._peerConnection.addStream(stream);

                var gotDescription = (desc: any) => {

                    var descInfo = JSON.stringify({ "sdp": desc });

                    this.log("gotDescription " + descInfo);

                    this._peerConnection.setLocalDescription(desc);

                    this._boothHub.server.sendSignallingInfo(descInfo);
                }

                if (caller) {
                    this._peerConnection.createOffer(gotDescription);
                } else {
                    this._peerConnection.createAnswer(gotDescription);
                }

            },
            (error) => {
                this.log(error.name + " - " + error.message);
            });

        }
    }
} 
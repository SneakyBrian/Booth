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
        private _sendChannel: RTCDataChannel;
        private _receiveChannel: RTCDataChannel;

        
        private static _peerConnectionConfig: RTCPeerConnectionConfig = {
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

        public onmessage: (message: string) => void;

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
                if (!this._peerConnection) {
                    this.start(true);
                }
            };

            this._boothHub.client.onLeftBooth = (userName) => {
                this.log(userName + " left Booth " + this._boothName);
                this._peerConnection.close();
            };

            this._boothHub.client.onSignallingInfoRecieved = (userName, signallingInfo) => {
                
                //this.log(userName + " sent signalling info: " + signallingInfo);
                this.log(userName + " sent signalling info");

                var caller = true;

                if (!this._peerConnection) {
                    caller = false;
                    this.start(caller);
                }

                var signal = JSON.parse(signallingInfo);
                if (signal && signal.sdp) {

                    this.log(userName + " sent remote description");
                    this._peerConnection.setRemoteDescription(new RTCSessionDescription(signal),
                        () => {
                            this.log("setRemoteDescription success");

                            if (!caller) {
                                this._peerConnection.createAnswer((desc) => this.gotAnswer(desc),
                                    (error: DOMError) => this.log("peerConnection createAnswer error: " + error.toString()));
                            }

                        },
                        (error: DOMError) => {
                            this.log("setRemoteDescription fail: " + error.toString());
                        });

                } else if (signal && signal.candidate) {

                    this.log(userName + " sent ice candidate");
                    this._peerConnection.addIceCandidate(new RTCIceCandidate(signal),
                        () => {
                            this.log("addIceCandidate success");
                        },
                        (error: DOMError) => {
                            this.log("addIceCandidate fail: " + error.toString());
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


        public send(message: string) {
            this._sendChannel.send(message);
            this.log("sent message: " + message);
        }

        public sendVideo() {
            var mediaStreamConstraints: MediaStreamConstraints = { video: true, audio: true };

            navigator.getUserMedia(mediaStreamConstraints,
                (stream) => this.ongetUserMediaSuccess(stream),
                this.logError);
        }

        //PRIVATE 

        private log(message: string) {
            if (this.logger) {
                this.logger.log(message);
            }
        }

        private logError(error: Error) {
            this.log(error.name + " - " + error.message);
        }

        private start(caller: boolean) {

            this.log("booth client starting - caller: " + caller);

            var peerConnection = this._peerConnection = new webkitRTCPeerConnection(Client._peerConnectionConfig, {
                optional: [{
                    RtpDataChannels: true
                }]
            });

            peerConnection.onicecandidate = (evt) => this.onicecandidate(evt);
            peerConnection.ondatachannel = (evt) => this.ondatachannel(<RTCDataChannelEvent>evt);

            var sendChannel = this._sendChannel = peerConnection.createDataChannel('sendDataChannel', {
                reliable: true
            });


            //TODO
            sendChannel.onopen = (evt) => this.onChannelStateChange(evt, sendChannel);
            sendChannel.onclose = (evt) => this.onChannelStateChange(evt, sendChannel);
            sendChannel.onerror = (evt) => this.log("send channel error: " + evt.type);

            peerConnection.onaddstream = (evt) => this.onaddstream(evt);

            if (caller) {
                peerConnection.createOffer((desc) => this.gotOffer(desc),
                    (error: DOMError) => this.log("peerConnection createOffer error: " + error.toString()));
            }
        }

        private ondatachannel(evt: RTCDataChannelEvent) {

            this.log("got receive data channel");

            var receiveChannel = this._receiveChannel = evt.channel;
            receiveChannel.onmessage = (evt) => this.onReceiveMessage(event.data);
            receiveChannel.onopen = (evt) => this.onChannelStateChange(evt, receiveChannel);
            receiveChannel.onclose = (evt) => this.onChannelStateChange(evt, receiveChannel);
            receiveChannel.onerror = (evt) => this.log("receive channel error: " + evt.type);
        }

        private onChannelStateChange(evt: Event, channel: RTCDataChannel) {

            var channelName = channel === this._sendChannel ? "send" : "receive";

            this.log(channelName + " channel state is " + channel.readyState);

        }

        private onReceiveMessage(message: string) {
            if (this.onmessage) {
                this.onmessage(message);
            }

            this.log("got message: " + message);
        }

        private onicecandidate(evt: RTCIceCandidateEvent) {

            //this.log("onicecandidate");

            if (evt && evt.candidate) {

                var candidateInfo = JSON.stringify(evt.candidate);

                //this.log("onicecandidate " + candidateInfo);

                this.log("sending ice candidate info");
                
                this._boothHub.server.sendSignallingInfo(candidateInfo);
            } else {
                this.log("no ice candidate info to send");
            }

        }

        private onaddstream(evt: RTCMediaStreamEvent) {

            // once remote stream arrives, show it in the remote video element

            this.log("onaddstream");

            var remoteView: HTMLVideoElement = <HTMLVideoElement>document.getElementById("remoteView");
            remoteView.src = URL.createObjectURL(evt.stream);

        }

        private ongetUserMediaSuccess(stream: any) {

            // get the local stream, show it in the local video element and send it

            this.log("ongetUserMediaSuccess");

            var localView: HTMLVideoElement = <HTMLVideoElement>document.getElementById("localView");
            localView.src = URL.createObjectURL(stream);

            this._peerConnection.addStream(stream);

            this._peerConnection.createOffer((desc) => this.gotOffer(desc),
                (error: DOMError) => this.log("peerConnection createOffer error: " + error.toString()));
        }

        private gotOffer(desc: any) {

            var descInfo = JSON.stringify(desc);

            //this.log("gotDescription " + descInfo);

            this._peerConnection.setLocalDescription(desc,
                () => this.log("setLocalDescription success"),
                (error: DOMError) => this.log("setLocalDescription error: " + error.toString()));

            this.log("gotOffer - sending description info");

            this._boothHub.server.sendSignallingInfo(descInfo);

        }

        private gotAnswer(desc: any) {

            var descInfo = JSON.stringify(desc);

            //this.log("gotDescription " + descInfo);

            this._peerConnection.setLocalDescription(desc,
                () => this.log("setLocalDescription success"),
                (error: DOMError) => this.log("setLocalDescription error: " + error.toString()));

            this.log("gotAnswer - sending description info");

            this._boothHub.server.sendSignallingInfo(descInfo);

        }
    }
} 
const WebSocket = require('ws');
const wrtc = require('wrtc'); // 引入 wrtc 模块

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
    console.log('Connected to server');

    // 创建 WebRTC PeerConnection 示例，使用 wrtc
    const peerConnection = new wrtc.RTCPeerConnection();

    // 获取本地视频流并添加到连接
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
            
            // 在本地创建视频元素显示流
            const videoElement = document.createElement('video');
            document.body.appendChild(videoElement);
            videoElement.srcObject = stream;
            videoElement.play();
        })
        .catch(error => {
            console.error('Error accessing media devices:', error);
        });

    // 处理 ICE 候选
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('Sending ICE candidate');
            ws.send(JSON.stringify({ type: 'ice-candidate', candidate: event.candidate }));
        }
    };

    // 创建一个 SDP offer 示例
    peerConnection.createOffer().then(offer => {
        return peerConnection.setLocalDescription(offer);
    }).then(() => {
        console.log('Sending SDP offer');
        ws.send(JSON.stringify({ type: 'offer', sdp: peerConnection.localDescription }));
    });
});

ws.on('message', (data) => {
    const message = JSON.parse(data);

    if (message.type === 'offer') {
        // 处理来自服务器的 SDP offer
        console.log('Received SDP offer:', message.sdp);
        peerConnection.setRemoteDescription(new wrtc.RTCSessionDescription(message.sdp)).then(() => {
            // 创建答复并发送
            peerConnection.createAnswer().then(answer => {
                return peerConnection.setLocalDescription(answer);
            }).then(() => {
                console.log('Sending SDP answer');
                ws.send(JSON.stringify({ type: 'answer', sdp: peerConnection.localDescription }));
            });
        });
    } else if (message.type === 'answer') {
        // 处理 SDP answer
        console.log('Received SDP answer:', message.sdp);
        peerConnection.setRemoteDescription(new wrtc.RTCSessionDescription(message.sdp));
    } else if (message.type === 'ice-candidate') {
        // 处理 ICE 候选
        console.log('Received ICE candidate:', message.candidate);
        peerConnection.addIceCandidate(new wrtc.RTCIceCandidate(message.candidate));
    }
});

ws.on('close', () => {
    console.log('Disconnected from server');
});

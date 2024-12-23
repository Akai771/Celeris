import { useRef, useState } from "react";

export function useWebRTC(signalingUrl: string) {
    const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
    const [remoteConnectionId, setRemoteConnectionId] = useState<string | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const signaling = useRef<WebSocket | null>(null);
    const isConnectionActive = useRef(false); // Track active connections

    const createConnection = async () => {
        if (isConnectionActive.current) {
            console.warn("Connection already active.");
            return; // Prevent multiple connections
        }

        signaling.current = new WebSocket(signalingUrl);

        const peerConnection = new RTCPeerConnection();
        peerConnectionRef.current = peerConnection;
        isConnectionActive.current = true; // Mark connection as active

        const channel = peerConnection.createDataChannel("fileTransfer");
        setDataChannel(channel);

        channel.onopen = () => {
            console.log("Data channel is open.");
        };

        signaling.current.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "offer" && remoteConnectionId === data.connectionId) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                signaling.current?.send(JSON.stringify({ type: "answer", answer, connectionId: remoteConnectionId }));
            }

            if (data.type === "answer" && remoteConnectionId === data.connectionId) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            }

            if (data.type === "candidate" && remoteConnectionId === data.connectionId) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                signaling.current?.send(JSON.stringify({
                    type: "candidate",
                    candidate: event.candidate,
                    connectionId: remoteConnectionId,
                }));
            }
        };

        const createOffer = async () => {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            signaling.current?.send(JSON.stringify({
                type: "offer",
                offer,
                connectionId: remoteConnectionId,
            }));
        };

        await createOffer();
    };

    const closeConnection = () => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
            isConnectionActive.current = false; // Reset active state
        }
        if (signaling.current) {
            signaling.current.close();
            signaling.current = null;
        }
    };

    return {
        createConnection,
        closeConnection,
        dataChannel,
        setRemoteConnectionId,
    };
}

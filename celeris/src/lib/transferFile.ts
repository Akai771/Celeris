

export function transferFile(channel: RTCDataChannel, file: File) {
    const reader = new FileReader();
    reader.onload = (event) => {
        channel.send(event.target?.result as ArrayBuffer);
    };

    const chunkSize = 16 * 1024; // 16 KB
    let offset = 0;

    const sendNextChunk = () => {
        if (offset < file.size) {
            reader.readAsArrayBuffer(file.slice(offset, offset + chunkSize));
            offset += chunkSize;
        }
    };

    channel.onopen = sendNextChunk;
    channel.onbufferedamountlow = sendNextChunk;
}

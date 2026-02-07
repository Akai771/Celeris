/**
 * Utility for transferring files via WebRTC data channel
 */

interface FileMetadata {
    type: 'file-info' | 'file-complete';
    name: string;
    mimeType: string;
    size: number;
  }
  
  /**
   * Transfer a file through a WebRTC data channel
   * 
   * @param channel - The RTCDataChannel to send through
   * @param file - The file to transfer
   * @param progressCallback - Optional callback to report progress (0-100)
   * @returns Promise that resolves when transfer is complete or rejects on error
   */
  export function transferFile(
    channel: RTCDataChannel, 
    file: File,
    progressCallback?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No file provided"));
        return;
      }
  
      if (!channel || channel.readyState !== 'open') {
        reject(new Error("Data channel not open"));
        return;
      }
  
      try {
        // Define chunk size based on file size (larger chunks for bigger files)
        const chunkSize = 256 * 1024; // 256 KB chunks
        let offset = 0;
        let lastProgressReport = 0;
        
        // First send file metadata
        const fileInfo: FileMetadata = {
          type: 'file-info',
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size
        };
        
        channel.send(JSON.stringify(fileInfo));
        
        // Set up the file reader
        const reader = new FileReader();
        
        // Handle errors
        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };
        
        // Handle successful chunk reads
        reader.onload = (e) => {
          if (!e.target?.result) {
            reject(new Error("Failed to read chunk"));
            return;
          }
          
          // Check if channel is still open
          if (channel.readyState !== 'open') {
            reject(new Error("Channel closed during transfer"));
            return;
          }
          
          // Send the chunk
          channel.send(e.target.result as ArrayBuffer);
          
          // Update offset for next chunk
          offset += chunkSize;
          
          // Calculate and report progress
          const progress = Math.min(100, Math.round((offset / file.size) * 100));
          if (progressCallback && progress > lastProgressReport) {
            progressCallback(progress);
            lastProgressReport = progress;
          }
          
          // If there's more to read, continue with the next chunk
          if (offset < file.size) {
            // Use setTimeout to prevent blocking the UI thread
            setTimeout(readNextChunk, 0);
          } else {
            // All done, send completion message
            channel.send(JSON.stringify({ type: 'file-complete' }));
            resolve();
          }
        };
        
        // Function to read the next chunk
        const readNextChunk = () => {
          const slice = file.slice(offset, offset + chunkSize);
          reader.readAsArrayBuffer(slice);
        };
        
        // Start the reading process
        readNextChunk();
        
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Unknown error during file transfer"));
      }
    });
  }
  
  /**
   * Utility to handle receiving files through WebRTC
   */
  export class FileReceiver {
    public fileInfo: FileMetadata | null = null;
    private chunks: Uint8Array[] = [];
    private bytesReceived = 0;
    private onProgressCallback?: (progress: number) => void;
    private onCompleteCallback?: (file: File) => void;
    
    constructor(
      onProgress?: (progress: number) => void,
      onComplete?: (file: File) => void
    ) {
      this.onProgressCallback = onProgress;
      this.onCompleteCallback = onComplete;
    }
    
    /**
     * Process an incoming message from the data channel
     */
    processMessage(data: string | ArrayBuffer | Blob): void {
      // Handle string messages (metadata)
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          
          if (parsed.type === 'file-info') {
            // New file incoming, reset state
            this.fileInfo = parsed;
            this.chunks = [];
            this.bytesReceived = 0;
          } 
          else if (parsed.type === 'file-complete') {
            // File transfer complete, assemble file
            this.finalizeFile();
          }
        } catch (e) {
          console.error('FileReceiver: Error processing file metadata:', e);
        }
      } 
      // Handle binary data (file chunks)
      else if ((data instanceof ArrayBuffer || data instanceof Blob) && this.fileInfo) {
        let arrayBuffer: ArrayBuffer;
        
        // Convert Blob to ArrayBuffer if needed
        if (data instanceof Blob) {
          // Create a Promise to read the blob as ArrayBuffer
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result instanceof ArrayBuffer) {
              this.processArrayBuffer(e.target.result);
            }
          };
          reader.readAsArrayBuffer(data);
          return;
        } else {
          // Process directly if it's already an ArrayBuffer
          this.processArrayBuffer(data);
        }
      } else {
        console.error("FileReceiver: Received unsupported data type or no file info available");
      }
    }
    
    /**
     * Process an ArrayBuffer chunk
     */
    private processArrayBuffer(buffer: ArrayBuffer): void {
      const chunk = new Uint8Array(buffer);
      this.chunks.push(chunk);
      this.bytesReceived += chunk.length;
      
      // Report progress
      if (this.onProgressCallback && this.fileInfo) {
        const progress = Math.min(100, Math.round((this.bytesReceived / this.fileInfo.size) * 100));
        this.onProgressCallback(progress);
      }
    }
    
    /**
     * Assemble received chunks into a file
     */
    private finalizeFile(): void {
      if (!this.fileInfo || this.chunks.length === 0) {
        console.error('No file data to finalize');
        return;
      }
      
      try {
        // Calculate total bytes and create buffer
        const totalBytes = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const fileData = new Uint8Array(totalBytes);
        
        // Copy all chunks into the file data
        let offset = 0;
        for (const chunk of this.chunks) {
          fileData.set(chunk, offset);
          offset += chunk.length;
        }
        
        // Create the File object
        const file = new File(
          [fileData.buffer], 
          this.fileInfo.name, 
          { type: this.fileInfo.mimeType }
        );
                
        // Invoke the callback with the assembled file
        if (this.onCompleteCallback) {
          this.onCompleteCallback(file);
        }
        
        // Reset state
        this.chunks = [];
        this.fileInfo = null;
        this.bytesReceived = 0;
      } catch (e) {
        console.error('Error finalizing file:', e);
      }
    }
    
    /**
     * Reset the receiver state
     */
    reset(): void {
      this.chunks = [];
      this.fileInfo = null;
      this.bytesReceived = 0;
    }
  }
"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
	Download,
	RefreshCw,
	CheckCircle,
	AlertTriangle,
	X,
	Upload,
	FileIcon,
	LinkIcon,
	Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BlurFade from "@/components/ui/blur-fade";
import {
	Table,
	TableBody,
	TableCell,
	TableHeader,
	TableHead,
	TableRow,
} from "@/components/ui/table";
import { BorderBeam } from "@/components/ui/border-beam";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FileReceiver } from "@/lib/transferFile";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Badge } from "@/components/ui/badge";

// Define connection states for UI feedback
enum ConnectionUIState {
	IDLE = "idle",
	JOINING = "joining",
	WAITING = "waiting",
	CONNECTED = "connected",
	RECEIVING = "receiving",
	COMPLETE = "complete",
	ERROR = "error",
}

// Format file size for display
function formatFileSize(size: number): string {
	if (size < 1024) return size + " B";
	if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
	if (size < 1024 * 1024 * 1024)
		return (size / (1024 * 1024)).toFixed(1) + " MB";
	return (size / (1024 * 1024 * 1024)).toFixed(1) + " GB";
}

function ReceiveContent() {
	// Router and navigation
	const router = useRouter();
	const searchParams = useSearchParams();

	// Client-side only flag to prevent hydration issues
	const [isMounted, setIsMounted] = useState(false);

	// Connection state
	const [uiState, setUIState] = useState<ConnectionUIState>(
		ConnectionUIState.IDLE,
	);
	const [connectionIdInput, setConnectionIdInput] = useState<string>("");
	const [connectionId, setConnectionId] = useState<string>("");
	const [error, setError] = useState<string | null>(null);

	// File state
	const [receivedFiles, setReceivedFiles] = useState<File[]>([]);
	const [downloadProgress, setDownloadProgress] = useState<{
		[key: string]: number;
	}>({});
	const fileReceiverRef = useRef<FileReceiver | null>(null);

	// Dialog state
	const [isConnectDialogOpen, setConnectDialogOpen] = useState<boolean>(false);
	const [isStatusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);

	// Ref to prevent multiple connection attempts
	const hasInitialized = useRef<boolean>(false);

	// WebRTC hook
	const {
		connectionState,
		dataChannel,
		error: webRTCError,
		setConnectionId: setWebRTCConnectionId,
		joinConnection,
		closeConnection,
	} = useWebRTC(process.env.NEXT_PUBLIC_SIGNALING_URL || "ws://localhost:8080");

	// Set mounted flag on client side only
	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Initialize from URL parameter - only run once
	useEffect(() => {
		// Prevent multiple initializations
		if (hasInitialized.current) {
			console.log("Already initialized, skipping");
			return;
		}

		const id = searchParams.get("id");
		console.log("URL connection ID:", id);

		if (id && id.trim() !== "") {
			hasInitialized.current = true;
			console.log("Setting connection ID from URL:", id);
			setConnectionId(id);
			setConnectionIdInput(id);
			setWebRTCConnectionId(id);
			setUIState(ConnectionUIState.JOINING);

			// Use a longer delay to ensure everything is set up
			setTimeout(async () => {
				console.log("Connecting with ID from URL:", id);
				try {
					const success = await joinConnection();
					if (success) {
						console.log("Join connection succeeded");
						setUIState(ConnectionUIState.WAITING);
					} else {
						console.log("Join connection returned false");
						setError("Failed to join connection");
						setUIState(ConnectionUIState.ERROR);
					}
				} catch (err) {
					console.error("Error joining connection:", err);
					setError(err instanceof Error ? err.message : "Unknown error");
					setUIState(ConnectionUIState.ERROR);
				}
			}, 100);
		}
	}, [searchParams, setWebRTCConnectionId, joinConnection]);

	// Watch for WebRTC errors - but only show error if it's a real problem
	useEffect(() => {
		if (webRTCError) {
			console.log(
				"WebRTC error received:",
				webRTCError,
				"Current UI state:",
				uiState,
			);

			// Only show error if we're not in the middle of connecting or already connected
			// Some "errors" during connection establishment are transient
			if (
				uiState === ConnectionUIState.CONNECTED ||
				uiState === ConnectionUIState.RECEIVING
			) {
				setError(webRTCError);
				setUIState(ConnectionUIState.ERROR);

				toast({
					variant: "destructive",
					title: "Connection Error",
					description: webRTCError,
				});
			} else {
				// Log the error but don't show it to user during connection establishment
				console.warn("WebRTC error during connection:", webRTCError);
			}
		}
	}, [webRTCError]);

	// Initialize the file receiver when data channel is ready
	useEffect(() => {
		if (dataChannel) {
			console.log("Data channel available, setting up file receiver");

			// Always create a fresh file receiver when data channel changes
			fileReceiverRef.current = new FileReceiver(
				// Progress callback
				(progress) => {
					const fileInfo = fileReceiverRef.current?.fileInfo;
					if (fileInfo?.name) {
						setDownloadProgress((prev: Record<string, number>) => ({
							...prev,
							[fileInfo.name]: progress,
						}));
					}
				},
				// File complete callback
				(file: File) => {
					console.log("File complete callback triggered:", file.name);
					// Add to received files
					setReceivedFiles((prev: File[]) => [...prev, file]);

					toast({
						title: "File Received",
						description: `Successfully received ${file.name}`,
					});
				},
			);

			// Set up data channel message handler
			dataChannel.onmessage = (event: MessageEvent) => {
				console.log("Data channel message received, type:", typeof event.data);
				// Set UI state to receiving when data starts coming in
				setUIState(ConnectionUIState.RECEIVING);

				// Process the message
				if (fileReceiverRef.current) {
					fileReceiverRef.current.processMessage(event.data);
				}
			};

			// Also handle data channel state changes
			dataChannel.onopen = () => {
				console.log("Data channel opened on receive page");
				setUIState(ConnectionUIState.CONNECTED);
			};

			dataChannel.onclose = () => {
				console.log("Data channel closed on receive page");
				if (receivedFiles.length > 0) {
					setUIState(ConnectionUIState.COMPLETE);
				}
			};
		}

		return () => {
			// Cleanup when dataChannel changes or component unmounts
			if (fileReceiverRef.current) {
				fileReceiverRef.current.reset();
			}
		};
	}, [dataChannel]);

	// Update UI based on connection state changes
	useEffect(() => {
		console.log("Connection state changed to:", connectionState);

		switch (connectionState) {
			case "new":
				// Don't reset to IDLE if we're already in a more advanced state
				if (uiState === ConnectionUIState.IDLE) {
					// Stay in IDLE
				}
				break;
			case "connecting":
				setUIState(ConnectionUIState.JOINING);
				break;
			case "connected":
				setUIState(ConnectionUIState.CONNECTED);
				setStatusDialogOpen(true);
				setError(null); // Clear any previous errors

				toast({
					title: "Connection Established",
					description: "Ready to receive files.",
				});
				break;
			case "disconnected":
				// Only show error if we were previously connected or receiving
				if (
					uiState === ConnectionUIState.CONNECTED ||
					uiState === ConnectionUIState.RECEIVING
				) {
					if (receivedFiles.length > 0) {
						setUIState(ConnectionUIState.COMPLETE);
					} else {
						// Peer disconnected before sending files
						console.log("Disconnected, but no files received yet");
					}
				}
				break;
			case "failed":
				// Only show error if we were actively connected or had gone past initial joining
				// During initial connection, 'failed' might be temporary
				console.log("Connection state failed, current UI state:", uiState);
				if (
					uiState === ConnectionUIState.CONNECTED ||
					uiState === ConnectionUIState.RECEIVING
				) {
					setUIState(ConnectionUIState.ERROR);
					toast({
						variant: "destructive",
						title: "Connection Failed",
						description: "Lost connection with peer.",
					});
				}
				break;
		}
	}, [connectionState]); // Remove uiState from dependencies to prevent cascading updates

	// Handle connecting to a peer (manual button click)
	const handleConnect = async (id?: string) => {
		const connId = id || connectionIdInput;

		if (!connId.trim()) {
			toast({
				variant: "destructive",
				title: "No Connection ID",
				description: "Please enter a connection ID or use a valid link.",
			});
			return;
		}

		// Prevent double connection attempts
		if (
			hasInitialized.current &&
			uiState !== ConnectionUIState.ERROR &&
			uiState !== ConnectionUIState.IDLE
		) {
			console.log("Connection already in progress, skipping");
			return;
		}

		hasInitialized.current = true;

		try {
			setUIState(ConnectionUIState.JOINING);
			setConnectionId(connId);
			setWebRTCConnectionId(connId);
			setConnectDialogOpen(false);

			// Join the WebRTC connection
			const success = await joinConnection();

			if (success) {
				setUIState(ConnectionUIState.WAITING);
			} else {
				throw new Error("Failed to join connection");
			}
		} catch (err) {
			setUIState(ConnectionUIState.ERROR);
			setError(err instanceof Error ? err.message : "Unknown error");
			hasInitialized.current = false; // Allow retry

			toast({
				variant: "destructive",
				title: "Connection Error",
				description:
					"Failed to connect. Please check the connection ID and try again.",
			});
		}
	};

	// Disconnect from current session
	const handleDisconnect = () => {
		closeConnection();
		fileReceiverRef.current?.reset();
		setStatusDialogOpen(false);

		// If no files were received, reset completely
		if (receivedFiles.length === 0) {
			setUIState(ConnectionUIState.IDLE);
			setConnectionId("");
			setConnectionIdInput("");
			router.push("/share/receive");
		} else {
			setUIState(ConnectionUIState.COMPLETE);
		}
	};

	// Save a received file to disk
	const saveFile = (file: File) => {
		// Create a URL for the file
		const url = URL.createObjectURL(file);

		// Create a download link
		const a = document.createElement("a");
		a.href = url;
		a.download = file.name;

		// Trigger the download
		document.body.appendChild(a);
		a.click();

		// Clean up
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		toast({
			title: "Download Started",
			description: `Saving ${file.name} to your device`,
		});
	};

	// Save all received files
	const saveAllFiles = () => {
		if (receivedFiles.length === 0) {
			toast({
				variant: "destructive",
				title: "No Files",
				description: "No files have been received yet.",
			});
			return;
		}

		// Save each file
		receivedFiles.forEach((file: File) => saveFile(file));
	};

	// Start a new session
	const startNewSession = () => {
		closeConnection();
		fileReceiverRef.current?.reset();
		setUIState(ConnectionUIState.IDLE);
		setConnectionId("");
		setConnectionIdInput("");
		setReceivedFiles([]);
		setDownloadProgress({});
		setError(null);
		router.push("/share/receive");
	};

	// Render connection status indicator
	const renderConnectionStatus = () => {
		switch (uiState) {
			case ConnectionUIState.IDLE:
				return <span className="text-red-500">Not connected</span>;
			case ConnectionUIState.JOINING:
			case ConnectionUIState.WAITING:
				return (
					<span className="text-yellow-400 flex items-center">
						<RefreshCw className="animate-spin h-4 w-4 mr-2" />
						{uiState === ConnectionUIState.JOINING
							? "Joining connection..."
							: "Waiting for files..."}
					</span>
				);
			case ConnectionUIState.CONNECTED:
				return (
					<span className="text-green-500 flex items-center">
						<CheckCircle className="h-4 w-4 mr-2" />
						Connected
					</span>
				);
			case ConnectionUIState.RECEIVING:
				return <span className="text-blue-400">Receiving files...</span>;
			case ConnectionUIState.COMPLETE:
				return (
					<span className="text-green-500 flex items-center">
						<CheckCircle className="h-4 w-4 mr-2" />
						Transfer complete
					</span>
				);
			case ConnectionUIState.ERROR:
				return (
					<span className="text-red-400 flex items-center">
						<AlertTriangle className="h-4 w-4 mr-2" />
						Connection error
					</span>
				);
		}
	};

	// Prevent hydration errors by not rendering until mounted on client
	if (!isMounted) {
		return null;
	}

	return (
		<>
			<div className="min-h-screen lg:h-screen flex flex-col pt-20 pb-4 sm:pt-24 sm:pb-6 lg:pt-32 lg:pb-8 px-3 sm:px-4 md:px-0">
				<div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
					<BlurFade
						delay={0}
						className="items-center flex flex-col mb-4 sm:mb-5 lg:mb-6">
						<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold text-center tracking-tighter leading-tight">
							Receive Files with <span className="text-primary">Ease</span>
						</h1>
					</BlurFade>
					<BlurFade
						delay={0.5}
						className="items-center flex flex-col mb-5 sm:mb-6 lg:mb-8">
						<span className="text-xs sm:text-sm lg:text-sm text-muted-foreground text-center px-2 leading-relaxed">
							Enter a connection ID or paste a link to start receiving files.
						</span>
					</BlurFade>

					<div className="w-full flex flex-col items-center justify-center flex-1">
						{/* Connection status indicator */}
						<div className="flex w-full items-center justify-end gap-2 mb-3 sm:mb-4">
							<Badge
								className={`rounded-xl text-xs sm:text-sm backdrop-blur-sm transition-all duration-300 ${uiState === ConnectionUIState.ERROR || uiState === ConnectionUIState.IDLE ? "bg-red-500/10 border-red-500/50" : "bg-green-500/10 border-green-500/50"}`}>
								<div
									className={`w-2 h-2 rounded-full mr-2 ${uiState === ConnectionUIState.ERROR || uiState === ConnectionUIState.IDLE ? "bg-red-500" : "bg-green-500"} animate-pulse`}
								/>
								{renderConnectionStatus()}
							</Badge>
						</div>
						<div className="relative flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 rounded-xl sm:rounded-2xl w-full h-[50vh] sm:h-[55vh] lg:flex-1 lg:max-h-[calc(100vh-28rem)] bg-card border border-border hover:border-border/80 transition-all duration-500 overflow-hidden">
							{receivedFiles.length > 0 ? (
								<ScrollArea className="w-full h-[40dvh] sm:h-[50dvh] lg:h-full lg:max-h-[calc(100vh-30rem)]">
									<Table className="w-full">
										<TableHeader>
											<TableRow className="hover:bg-transparent">
												<TableHead className="w-[50%] sm:w-[60%] text-xs sm:text-sm">
													File Name
												</TableHead>
												<TableHead className="hidden sm:table-cell w-[20%] text-xs sm:text-sm">
													Size
												</TableHead>
												<TableHead className="w-[50%] sm:w-[20%] text-right text-xs sm:text-sm">
													Action
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{receivedFiles.map((file: File, index: number) => (
												<TableRow key={index} className="hover:bg-[#303030]">
													<TableCell className="font-medium text-primary">
														<div className="flex flex-col">
															<span className="truncate max-w-[100px] sm:max-w-[150px] md:max-w-none text-xs sm:text-sm">
																{file.name}
															</span>
															<span className="text-[10px] sm:text-xs text-muted-foreground sm:hidden">
																{formatFileSize(file.size)}
															</span>
														</div>
													</TableCell>
													<TableCell className="hidden sm:table-cell text-[10px] sm:text-xs text-muted-foreground">
														{formatFileSize(file.size)}
													</TableCell>
													<TableCell className="text-right">
														<Button
															size="sm"
															variant="ghost"
															className="flex items-center gap-1 text-muted-foreground transition-all ease-in-out duration-300 hover:bg-transparent hover:text-primary hover:scale-105 h-8 sm:h-9 px-2 sm:px-3"
															onClick={() => saveFile(file)}>
															<Download className="h-3 w-3 sm:h-4 sm:w-4" />
															<span className="text-xs sm:text-sm hidden sm:inline font-medium">
																Save
															</span>
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</ScrollArea>
							) : (
								<div className="flex flex-col items-center justify-center h-full">
									{uiState === ConnectionUIState.IDLE ? (
										<div className="text-center px-3 sm:px-4">
											<FileIcon className="w-12 h-12 sm:w-14 md:w-16 lg:w-20 text-muted-foreground mx-auto mb-4 sm:mb-5 lg:mb-6" />
											<p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-8 lg:mb-10 leading-relaxed">
												No files received yet. Connect to start receiving files.
											</p>
											<Button
												className="font-bold bg-primary hover:bg-primary/80 transition-all ease-in-out duration-300 hover:scale-[1.02] w-full sm:w-auto h-11 sm:h-12 lg:h-14 px-6 sm:px-8 text-sm sm:text-base"
												onClick={() => setConnectDialogOpen(true)}>
												<LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
												Enter Connection ID
											</Button>
										</div>
									) : uiState === ConnectionUIState.JOINING ||
									  uiState === ConnectionUIState.WAITING ? (
										<div className="text-center px-3 sm:px-4">
											<RefreshCw className="w-12 h-12 sm:w-14 md:w-16 lg:w-20 text-primary mx-auto mb-4 sm:mb-5 lg:mb-6 animate-spin" />
											<p className="text-base sm:text-lg lg:text-xl text-primary mb-3 sm:mb-4 font-semibold">
												{uiState === ConnectionUIState.JOINING
													? "Joining connection..."
													: "Waiting for sender..."}
											</p>
											<p className="text-muted-foreground text-sm sm:text-base break-all leading-relaxed">
												Connection ID: {connectionId}
											</p>
										</div>
									) : uiState === ConnectionUIState.ERROR ? (
										<div className="text-center px-3 sm:px-4">
											<AlertTriangle className="w-12 h-12 sm:w-14 md:w-16 lg:w-20 text-red-500 mx-auto mb-4 sm:mb-5 lg:mb-6" />
											<p className="text-base sm:text-lg lg:text-xl text-red-400 mb-2 sm:mb-3 font-semibold">
												Connection Error
											</p>
											<p className="text-muted-foreground text-sm sm:text-base mb-6 sm:mb-8 lg:mb-10 leading-relaxed">
												{error ||
													"Failed to establish connection. Please try again."}
											</p>
											<Button
												className="font-bold bg-primary hover:bg-primary/80 transition-all ease-in-out duration-300 hover:scale-[1.02] w-full sm:w-auto h-11 sm:h-12 lg:h-14 px-6 sm:px-8 text-sm sm:text-base"
												onClick={startNewSession}>
												<RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
												Try Again
											</Button>
										</div>
									) : (
										<div className="text-center px-3 sm:px-4">
											<Upload className="w-12 h-12 sm:w-14 md:w-16 lg:w-20 text-primary mx-auto mb-4 sm:mb-5 lg:mb-6" />
											<p className="text-base sm:text-lg lg:text-xl text-foreground mb-3 sm:mb-4 font-semibold">
												Ready to receive files
											</p>
											<p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
												Waiting for sender to transfer files...
											</p>
										</div>
									)}
								</div>
							)}
							<BorderBeam
								size={150}
								duration={10}
								className="z-40"
								colorFrom="#ff7b00"
								colorTo="#fcbb7e"
							/>
						</div>
					</div>
				</div>

				{/* Footer - Sticky to bottom */}
				<div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mt-4 sm:mt-5 lg:mt-6 w-full max-w-4xl mx-auto">
					{receivedFiles.length > 0 && (
						<Button
							className="font-bold bg-primary hover:bg-primary/80 transition-all ease-in-out duration-300 hover:scale-[1.02] w-full sm:w-auto flex items-center justify-center h-11 sm:h-12 lg:h-14 px-6 sm:px-8 text-sm sm:text-base"
							onClick={saveAllFiles}>
							<Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
							Download All
						</Button>
					)}

					{(uiState === ConnectionUIState.CONNECTED ||
						uiState === ConnectionUIState.RECEIVING ||
						uiState === ConnectionUIState.COMPLETE) && (
						<Button
							variant="outline"
							className="font-bold border-border hover:bg-secondary/50 transition-all ease-in-out duration-300 hover:scale-[1.02] w-full sm:w-auto h-11 sm:h-12 lg:h-14 px-6 sm:px-8 text-sm sm:text-base"
							onClick={startNewSession}>
							<RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
							New Session
						</Button>
					)}

					{(uiState === ConnectionUIState.IDLE ||
						uiState === ConnectionUIState.ERROR) && (
						<Button
							className="font-bold bg-primary hover:bg-primary/80 transition-all ease-in-out duration-300 hover:scale-[1.02] w-full sm:w-auto h-11 sm:h-12 lg:h-14 px-6 sm:px-8 text-sm sm:text-base"
							onClick={() => setConnectDialogOpen(true)}>
							<LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
							Connect
						</Button>
					)}
				</div>
			</div>

			{/* Connection dialog */}
			<Dialog open={isConnectDialogOpen} onOpenChange={setConnectDialogOpen}>
				<DialogContent className="sm:max-w-xl w-[95vw] bg-background text-foreground border-none p-3 sm:p-6">
					<DialogHeader>
						<DialogTitle className="text-foreground">
							<span className="text-lg font-bold">Enter Connection ID</span>
						</DialogTitle>
						<DialogDescription className="text-muted-foreground text-sm mt-2">
							Enter the connection ID or paste the link provided by the sender.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 my-2">
						<Input
							placeholder="Connection ID or full link"
							className="bg-muted/20 border-muted text-foreground focus-visible:ring-primary"
							value={connectionIdInput}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
								const value = e.target.value;
								// Extract ID if it's a URL
								if (value.includes("?id=")) {
									try {
										const url = new URL(value);
										const id = url.searchParams.get("id");
										if (id) {
											setConnectionIdInput(id);
											return;
										}
									} catch {}
								}
								setConnectionIdInput(value);
							}}
						/>
					</div>

					<DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
						<Button
							variant="ghost"
							onClick={() => setConnectDialogOpen(false)}
							className="w-full sm:w-auto h-10 sm:h-11 transition-all ease-in-out duration-300">
							Cancel
						</Button>
						<Button
							className="font-bold bg-primary hover:bg-primary/80 text-white transition-all ease-in-out duration-300 hover:scale-[1.02] w-full sm:w-auto h-10 sm:h-11"
							onClick={() => handleConnect()}
							disabled={!connectionIdInput.trim()}>
							Connect
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Connection status dialog */}
			<Dialog open={isStatusDialogOpen} onOpenChange={setStatusDialogOpen}>
				<DialogContent className="sm:max-w-xl w-[95vw] bg-background text-foreground border-none p-3 sm:p-6">
					<DialogHeader>
						<DialogTitle className="text-foreground">
							<span className="text-lg font-bold">
								Connection <span className="text-primary">Established</span>
							</span>
						</DialogTitle>
						<DialogDescription className="text-muted-foreground text-sm mt-2">
							You are now connected to the sender. Waiting for files...
						</DialogDescription>
					</DialogHeader>

					<div className="bg-border rounded-md p-3 mb-4">
						<h3 className="font-medium text-sm mb-2">Connection Info</h3>
						<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
							<div className="text-xs sm:text-sm flex items-center gap-2 flex-wrap">
								<span className="text-muted-foreground">ID:</span>
								<code className="bg-foreground/20 px-2 py-1 rounded text-primary break-all">
									{connectionId}
								</code>
								<button
									className="text-muted-foreground hover:text-foreground"
									onClick={() => navigator.clipboard.writeText(connectionId)}>
									<Copy className="h-3 w-3" />
								</button>
							</div>
							<div className="text-green-500 flex items-center text-sm">
								<CheckCircle className="h-4 w-4 mr-1" />
								Connected
							</div>
						</div>
					</div>

					<DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
						<Button
							variant="destructive"
							onClick={handleDisconnect}
							className="w-full sm:w-auto h-10 sm:h-11 transition-all ease-in-out duration-300 hover:scale-[1.02]">
							<X className="h-4 w-4 mr-2" />
							Disconnect
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

// Export with Suspense boundary to prevent hydration errors
export default function Receive() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-black flex items-center justify-center">
					<div className="text-white">Loading...</div>
				</div>
			}>
			<ReceiveContent />
		</Suspense>
	);
}

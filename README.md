# Celeris - P2P File Transfer Application

Celeris is a peer-to-peer (P2P) file transfer application that allows users to transfer files directly between devices without storing them on any server. The application leverages WebRTC for seamless real-time data transfer and supports file sharing through direct links or QR code scanning.

## Features

- **P2P File Transfer**: Transfer files directly between devices without using a server for storage.
- **Link-Based Sharing**: Share files by generating a unique URL that the recipient can use to access the files.
- **QR Code Scanning**: Use QR codes to initiate file transfers between devices.
- **Simple UI**: The user interface is built with Magic UI and Shadcn, ensuring a clean and responsive design.
- **Built with Modern Technologies**: Utilizes Next.js, TailwindCSS, TypeScript, JavaScript, and WebRTC for real-time communication.

## Tech Stack

- **Frontend**: 
  - Next.js (React Framework)
  - Plain CSS & Tailwind CSS
  - TypeScript & JavaScript
  - Magic UI
  - Shadcn

- **P2P Communication**: WebRTC (Web Real-Time Communication)

## Installation

To run the application locally, follow these steps:

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/celeris.git
    cd celeris
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Start the development server:
    ```bash
    npm run dev
    ```

4. Open the app in your browser at `http://localhost:3000`.

## Usage

### Transferring Files Using a Link

1. Visit the app and choose the file you want to transfer.
2. The app will generate a unique link and a QR code to share with the recipient.
3. The recipient can access the file by opening the link or scanning the QR code on their device.

## Contributing

Feel free to fork this repository and contribute to improving it. To contribute:

1. Fork the repository.
2. Create a new branch for your changes.
3. Make your changes and commit them.
4. Push your changes to your fork.
5. Open a pull request to the `main` branch.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Magic UI](https://magicui.design/)
- [Shadcn](https://ui.shadcn.com/)
- [WebRTC](https://webrtc.org/)
- [Tailwind CSS](https://tailwindcss.com/)

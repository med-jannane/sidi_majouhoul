type ControllerMessage = {
    type: 'input';
    key: 'ArrowLeft' | 'ArrowRight' | 'Space' | 'KeyX' | 'KeyE';
    isDown: boolean;
};

export class WifiController {
    private socket: WebSocket | null = null;
    private onInput: (key: ControllerMessage['key'], isDown: boolean) => void;

    constructor(onInput: WifiController['onInput']) {
        this.onInput = onInput;
    }

    public connect() {
        if (this.socket) return;

        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        this.socket = new WebSocket(`${protocol}://${window.location.host}/ws`);
        this.socket.addEventListener('open', () => {
            this.socket?.send(JSON.stringify({ type: 'register', role: 'game' }));
        });
        this.socket.addEventListener('message', (event) => {
            try {
                const message = JSON.parse(event.data) as ControllerMessage;
                if (message.type === 'input') this.onInput(message.key, message.isDown);
            } catch {
                // Ignore malformed messages from other local clients.
            }
        });
        this.socket.addEventListener('close', () => {
            this.socket = null;
            window.setTimeout(() => this.connect(), 1500);
        });
        this.socket.addEventListener('error', () => this.socket?.close());
    }

    public dispose() {
        this.socket?.close();
        this.socket = null;
    }
}
import { Engine } from './core/Engine';
import { WifiController } from './core/WifiController';
import './style.css';

const engine = Engine.instance;

const wifiController = new WifiController((key, isDown) => {
    window.dispatchEvent(new KeyboardEvent(isDown ? 'keydown' : 'keyup', { code: key }));
});
wifiController.connect();

engine.init().catch((err) => {
    console.error('Failed to initialize engine:', err);
});

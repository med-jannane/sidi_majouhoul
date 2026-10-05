import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Engine } from './Engine';
import { MenuScene } from '../scenes/MenuScene';
import { AudioManager } from './AudioManager';
import type { SoundType } from './AudioManager';

export class PauseMenu extends Container {
    private panel: Container;
    private onResume: () => void;

    constructor(onResume: () => void) {
        super();
        this.onResume = onResume;

        const overlay = new Graphics();
        overlay.rect(0, 0, 1280, 720);
        overlay.fill({ color: 0x050b16, alpha: 0.82 });
        this.addChild(overlay);

        this.panel = new Container();
        const bg = new Graphics();
        bg.roundRect(320, 45, 640, 630, 18);
        bg.fill({ color: 0x101d2d });
        bg.stroke({ color: 0xe6b866, width: 3 });
        this.panel.addChild(bg);

        const style = new TextStyle({ fontFamily: '"Press Start 2P", "Courier New", monospace', fontSize: 28, fill: '#ffe2a6', letterSpacing: 2 });
        const title = new Text({ text: 'PAUSE', style: style });
        title.anchor.set(0.5);
        title.x = 640; title.y = 100;
        this.panel.addChild(title);

        this.createButton('RESUME', 180, () => this.onResume());
        
        // Sliders
        this.createSlider('MUSIC', 260, 'bgm');
        this.createSlider('SOUND EFFECTS', 340, 'sfx');
        this.createSlider('VOICE', 420, 'voice');

        const mapStyle = new TextStyle({ fontFamily: '"Press Start 2P", "Courier New", monospace', fontSize: 14, fill: '#ffe2a6', letterSpacing: 1 });
        const mapTxt = new Text({ text: 'REGION SELECT', style: mapStyle });
        mapTxt.anchor.set(0.5);
        mapTxt.x = 640; mapTxt.y = 500;
        this.panel.addChild(mapTxt);

        this.createSmallButton('MARRAKECH', 540, 440, () => console.log('Marrakech'));
        this.createSmallButton('CASABLANCA', 640, 540, () => console.log('Casablanca'));
        this.createSmallButton('CHEFCHAOUEN', 740, 440, () => console.log('Chefchaouen'));

        this.createButton('QUIT TO TITLE', 620, () => {
            Engine.instance.setScene(new MenuScene());
        });

        this.addChild(this.panel);
        this.interactive = true;
    }

    private createButton(label: string, y: number, callback: () => void) {
        const btn = new Container();
        const txt = new Text({ text: label, style: new TextStyle({ fontFamily: '"Press Start 2P", "Courier New", monospace', fontSize: 17, fill: '#fff8e7', letterSpacing: 1 }) });
        txt.anchor.set(0.5);
        const bg = new Graphics();
        bg.roundRect(-190, -23, 380, 46, 8);
        bg.fill({ color: label === 'QUIT TO TITLE' ? 0x9e3f3d : 0x182b43 });
        bg.stroke({ color: label === 'QUIT TO TITLE' ? 0xffd48a : 0x75b6c9, width: 2 });
        btn.addChild(bg);
        btn.addChild(txt);
        btn.x = 640; btn.y = y;
        btn.interactive = true;
        btn.cursor = 'pointer';
        btn.on('pointerover', () => { txt.style.fill = '#ffcf70'; btn.scale.set(1.04); });
        btn.on('pointerout', () => { txt.style.fill = '#fff8e7'; btn.scale.set(1); });
        btn.on('pointerdown', callback);
        this.panel.addChild(btn);
    }

    private createSmallButton(label: string, x: number, y: number, callback: () => void) {
        const btn = new Container();
        const txt = new Text({ text: label, style: new TextStyle({ fontFamily: '"Press Start 2P", "Courier New", monospace', fontSize: 9, fill: '#fff8e7' }) });
        txt.anchor.set(0.5);
        const bg = new Graphics();
        bg.roundRect(-68, -17, 136, 34, 7);
        bg.fill({ color: 0x182b43 });
        bg.stroke({ color: 0x75b6c9, width: 1 });
        btn.addChild(bg);
        btn.addChild(txt);
        btn.x = x; btn.y = y;
        btn.interactive = true;
        btn.cursor = 'pointer';
        btn.on('pointerover', () => { txt.style.fill = '#ffcf70'; btn.scale.set(1.06); });
        btn.on('pointerout', () => { txt.style.fill = '#fff8e7'; btn.scale.set(1); });
        btn.on('pointerdown', callback);
        this.panel.addChild(btn);
    }

    private createSlider(label: string, y: number, type: SoundType) {
        const style = new TextStyle({ fontFamily: '"Press Start 2P", "Courier New", monospace', fontSize: 14, fill: '#fff8e7', letterSpacing: 1 });
        const txt = new Text({ text: label, style: style });
        txt.x = 380; txt.y = y;
        this.panel.addChild(txt);

        const track = new Graphics();
        track.roundRect(380, y + 25, 520, 10, 5);
        track.fill({ color: 0x07111f });
        track.stroke({ color: 0x41657c, width: 2 });
        this.panel.addChild(track);

        const handle = new Graphics();
        handle.roundRect(0, -10, 20, 30, 6);
        handle.fill({ color: 0xe6b866 });
        handle.stroke({ color: 0xfff1c7, width: 2 });
        handle.x = 380 + (AudioManager.getVolume(type) * 520);
        handle.y = y + 25;
        handle.interactive = true;
        handle.cursor = 'pointer';

        let dragging = false;
        handle.on('pointerdown', () => dragging = true);
        window.addEventListener('pointerup', () => dragging = false);
        window.addEventListener('pointermove', (e) => {
            if (dragging) {
                let rect = Engine.instance.app.canvas.getBoundingClientRect();
                let x = (e.clientX - rect.left) * (1280 / rect.width);
                let val = Math.max(0, Math.min(1, (x - 380) / 520));
                handle.x = 380 + (val * 520);
                AudioManager.setVolume(type, val);
            }
        });
        this.panel.addChild(handle);
    }
}

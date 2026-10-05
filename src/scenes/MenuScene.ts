import { Container, Graphics, Rectangle, Text, TextStyle, Sprite, Assets } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Engine } from '../core/Engine';
import { FightScene } from './FightScene';
import { AudioManager } from '../core/AudioManager';
import type { SoundType } from '../core/AudioManager';

export class MenuScene extends BaseScene {
    private settingsPanel: Container | null = null;
    private background: Sprite | null = null;

    constructor() {
        super();
        this.init();
    }

    private async init() {
        try {
            const bgTexture = await Assets.load('assets/backgrounds/image.png');
            this.background = new Sprite(bgTexture);
            this.background.width = 1280;
            this.background.height = 720;
            this.addChild(this.background);
        } catch (e) {
            console.error("Menu background failed to load:", e);
            const fallback = new Graphics();
            fallback.rect(0, 0, 1280, 720);
            fallback.fill({ color: 0x1a1a1a });
            this.addChild(fallback);
        }

        const overlay = new Graphics();
        overlay.rect(0, 0, 1280, 720);
        overlay.fill({ color: 0x071018, alpha: 0.08 });
        this.addChild(overlay);

        const tagline = new Text({
            text: 'A JOURNEY THROUGH THE HAUNTED CITY',
            style: new TextStyle({ fontFamily: '"Press Start 2P", "Courier New", monospace', fontSize: 12, fill: '#ffe2a6', letterSpacing: 2 })
        });
        tagline.anchor.set(0.5);
        tagline.x = 1035;
        tagline.y = 515;
        this.addChild(tagline);

        this.createButton('CONTINUE', 555, () => {
            Engine.instance.setScene(new FightScene());
        });

        this.createButton('NEW GAME', 615, () => {
            Engine.instance.setScene(new FightScene());
        });

        this.createButton('SETTINGS', 675, () => {
            this.showSettings();
        });
    }

    private createButton(label: string, y: number, callback: () => void) {
        const btnStyle = new TextStyle({
            fontFamily: '"Press Start 2P", "Courier New", monospace',
            fontSize: label === 'NEW GAME' ? 26 : 23,
            fill: '#fff8e7',
            letterSpacing: 1,
        });

        const btn = new Container();
        const txt = new Text({ text: label, style: btnStyle });
        txt.anchor.set(0.5);
        
        btn.addChild(txt);
        btn.x = 985;
        btn.y = y;
        btn.interactive = true;
        btn.hitArea = new Rectangle(-220, -32, 440, 64);
        btn.cursor = 'pointer';

        btn.on('pointerover', () => { txt.style.fill = '#ffcf70'; btn.scale.set(1.06); });
        btn.on('pointerout', () => { txt.style.fill = '#fff8e7'; btn.scale.set(1); });
        btn.on('pointerdown', callback);

        this.addChild(btn);
    }

    private showSettings() {
        if (this.settingsPanel) return;

        this.settingsPanel = new Container();
        const overlay = new Graphics();
        overlay.rect(0, 0, 1280, 720);
        overlay.fill({ color: 0x050b16, alpha: 0.82 });
        this.settingsPanel.addChild(overlay);

        const panel = new Graphics();
        panel.roundRect(320, 90, 640, 540, 18);
        panel.fill({ color: 0x101d2d });
        panel.stroke({ color: 0xe6b866, width: 3 });
        this.settingsPanel.addChild(panel);

        const style = new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 'bold', fill: '#ffe2a6', letterSpacing: 2 });
        const title = new Text({ text: 'SETTINGS', style: style });
        title.anchor.set(0.5);
        title.x = 640; title.y = 145;
        this.settingsPanel.addChild(title);

        this.createSlider('MUSIC', 245, 'bgm');
        this.createSlider('SOUND EFFECTS', 345, 'sfx');
        this.createSlider('VOICE', 445, 'voice');

        const closeBtn = new Container();
        const closeTxt = new Text({ text: 'BACK', style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 'bold', fill: '#fff8e7', letterSpacing: 2 }) });
        closeTxt.anchor.set(0.5);
        const closeBg = new Graphics();
        closeBg.roundRect(-115, -22, 230, 44, 8);
        closeBg.fill({ color: 0x9e3f3d });
        closeBg.stroke({ color: 0xffd48a, width: 2 });
        closeBtn.addChild(closeBg);
        closeBtn.addChild(closeTxt);
        closeBtn.x = 640; closeBtn.y = 570;
        closeBtn.interactive = true;
        closeBtn.cursor = 'pointer';
        closeBtn.on('pointerover', () => closeBtn.scale.set(1.04));
        closeBtn.on('pointerout', () => closeBtn.scale.set(1));
        closeBtn.on('pointerdown', () => {
            this.removeChild(this.settingsPanel!);
            this.settingsPanel = null;
        });
        this.settingsPanel.addChild(closeBtn);

        this.addChild(this.settingsPanel);
    }

    private createSlider(label: string, y: number, type: SoundType) {
        const style = new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 'bold', fill: '#fff8e7', letterSpacing: 1 });
        const txt = new Text({ text: label, style: style });
        txt.x = 380; txt.y = y;
        this.settingsPanel!.addChild(txt);

        const track = new Graphics();
        track.roundRect(380, y + 31, 520, 12, 6);
        track.fill({ color: 0x07111f });
        track.stroke({ color: 0x41657c, width: 2 });
        this.settingsPanel!.addChild(track);

        const handle = new Graphics();
        handle.roundRect(0, -12, 22, 36, 7);
        handle.fill({ color: 0xe6b866 });
        handle.stroke({ color: 0xfff1c7, width: 2 });
        handle.x = 380 + (AudioManager.getVolume(type) * 520);
        handle.y = y + 30;
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

        this.settingsPanel!.addChild(handle);
    }

    public update(_delta: number) {}
}

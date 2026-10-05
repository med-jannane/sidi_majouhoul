import { Container, Graphics, Text } from 'pixi.js';

export class MobileControls extends Container {
    private onInput: (key: string, isDown: boolean) => void;

    constructor(onInput: (key: string, isDown: boolean) => void) {
        super();
        this.onInput = onInput;

        // On ne l'affiche que si on détecte un écran tactile
        const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (!isMobile) {
            this.visible = false;
        }

        this.createDirButton('ArrowUp', 120, 510, '▲');
        this.createDirButton('ArrowLeft', 55, 575, '◀');
        this.createDirButton('ArrowDown', 120, 640, '▼');
        this.createDirButton('ArrowRight', 185, 575, '▶');
        this.createActionButton('KeyY', 1100, 510, 'Y', 0x55C878);
        this.createActionButton('KeyX', 1030, 590, 'X', 0xFF0000);
        this.createActionButton('KeyE', 1170, 590, 'B', 0x4DA3FF);
        this.createActionButton('Space', 1100, 670, 'A', 0xFFD700);
    }

    public setInput(key: string, isDown: boolean) {
        this.onInput(key, isDown);
    }

    private createDirButton(key: string, x: number, y: number, label: string) {
        const btn = new Graphics();
        btn.circle(0, 0, 34);
        btn.fill({ color: 0xFFFFFF, alpha: 0.2 });
        btn.stroke({ color: 0xFFFFFF, width: 2 });
        
        const txt = new Text({ 
            text: label, 
            style: { fill: 0xFFFFFF, fontSize: 28 } 
        });
        txt.anchor.set(0.5);

        const container = new Container();
        container.addChild(btn, txt);
        container.x = x;
        container.y = y;
        container.interactive = true;

        container.on('pointerdown', () => {
            btn.alpha = 0.5;
            this.onInput(key, true);
        });
        container.on('pointerup', () => {
            btn.alpha = 1;
            this.onInput(key, false);
        });
        container.on('pointerupoutside', () => {
            btn.alpha = 1;
            this.onInput(key, false);
        });

        this.addChild(container);
    }

    private createActionButton(key: string, x: number, y: number, label: string, color: number) {
        const btn = new Graphics();
        btn.circle(0, 0, 42);
        btn.fill({ color: color, alpha: 0.3 });
        btn.stroke({ color: color, width: 3 });
        
        const txt = new Text({ 
            text: label, 
            style: { fill: 0xFFFFFF, fontSize: 22, fontWeight: 'bold' } 
        });
        txt.anchor.set(0.5);

        const container = new Container();
        container.addChild(btn, txt);
        container.x = x;
        container.y = y;
        container.interactive = true;

        container.on('pointerdown', () => {
            btn.alpha = 0.8;
            this.onInput(key, true);
        });
        container.on('pointerup', () => {
            btn.alpha = 1;
            this.onInput(key, false);
        });
        container.on('pointerupoutside', () => {
            btn.alpha = 1;
            this.onInput(key, false);
        });

        this.addChild(container);
    }
}

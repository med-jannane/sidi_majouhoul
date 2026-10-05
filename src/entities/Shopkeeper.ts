import { Assets, Sprite } from 'pixi.js';
import { Entity } from './Entity';

export class Shopkeeper extends Entity {
    private sprite: Sprite | null = null;
    private isLoaded = false;

    constructor() {
        super();
        this.loadSprite();
    }

    private async loadSprite() {
        try {
            const texture = await Assets.load('assets/deco/WhatsApp_Image_2026-09-30_at_13.36.41-removebg-preview.png');
            this.sprite = new Sprite(texture);
            this.sprite.anchor.set(0.5, 1);
            this.sprite.scale.set(0.28);
            this.sprite.y = 8;
            this.addChild(this.sprite);
            this.isLoaded = true;
        } catch (error) {
            console.error('Unable to load the elder:', error);
        }
    }

    public update(_delta: number) {
        if (!this.isLoaded) return;
        this.sprite!.y = Math.sin(Date.now() * 0.003) * 1.5;
    }
}
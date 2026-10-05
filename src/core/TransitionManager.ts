import { Container, Graphics, Text, TextStyle, Sprite, Assets } from 'pixi.js';

export class TransitionManager extends Container {
    private overlay: Graphics;
    private transitionSprite: Sprite | null = null;
    private messageText: Text;

    constructor() {
        super();
        
        // Overlay noir
        this.overlay = new Graphics();
        this.overlay.rect(0, 0, 1280, 720);
        this.overlay.fill({ color: 0x000000, alpha: 1 });
        this.overlay.visible = false;
        this.addChild(this.overlay);

        this.transitionSprite = new Sprite();
        this.transitionSprite.width = 1280;
        this.transitionSprite.height = 720;
        this.transitionSprite.visible = false;
        this.addChild(this.transitionSprite);

        // Texte Doré Pixel Art
        const style = new TextStyle({
            fontFamily: '"Press Start 2P", Arial',
            fontSize: 32,
            fill: '#FFD700',
            dropShadow: { color: '#000000', blur: 4, distance: 6 },
            align: 'center',
        });

        this.messageText = new Text({ text: '', style: style });
        this.messageText.anchor.set(0.5);
        this.messageText.x = 640;
        this.messageText.y = 360;
        this.messageText.visible = false;
        this.addChild(this.messageText);
    }

    public async fadeInOut(message: string, duration: number = 3000, imagePath: string | null = null): Promise<void> {
        if (imagePath) {
            const tex = await Assets.load(imagePath);
            this.transitionSprite!.texture = tex;
            this.transitionSprite!.visible = true;
        }

        return new Promise((resolve) => {
            this.overlay.visible = true;
            this.overlay.alpha = 0;
            this.messageText.text = message;
            this.messageText.visible = message !== '';
            this.messageText.alpha = 0;
            if (this.transitionSprite) this.transitionSprite.alpha = 0;

            let startTime = Date.now();
            
            const animate = () => {
                let elapsed = Date.now() - startTime;
                let progress = elapsed / duration;

                if (progress < 0.3) {
                    this.overlay.alpha = progress / 0.3;
                    this.messageText.alpha = progress / 0.3;
                    if (this.transitionSprite) this.transitionSprite.alpha = progress / 0.3;
                } else if (progress < 0.7) {
                    this.overlay.alpha = 1;
                    this.messageText.alpha = 1;
                    if (this.transitionSprite) this.transitionSprite.alpha = 1;
                } else if (progress < 1) {
                    this.overlay.alpha = 1 - (progress - 0.7) / 0.3;
                    this.messageText.alpha = 1 - (progress - 0.7) / 0.3;
                    if (this.transitionSprite) this.transitionSprite.alpha = 1 - (progress - 0.7) / 0.3;
                } else {
                    this.overlay.visible = false;
                    this.messageText.visible = false;
                    if (this.transitionSprite) this.transitionSprite.visible = false;
                    resolve();
                    return;
                }
                requestAnimationFrame(animate);
            };

            animate();
        });
    }
}

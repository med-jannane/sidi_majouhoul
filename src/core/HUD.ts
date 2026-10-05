import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export class HUD extends Container {
    private playerHealthBar: Graphics;
    private enemyHealthBar: Graphics;
    private playerHP = 1;
    private enemyHP = 1;

    constructor() {
        super();

        // Style pour les noms
        const textStyle = new TextStyle({
            fontFamily: '"Press Start 2P", Arial',
            fontSize: 18,
            fill: '#FFFFFF',
            stroke: { color: '#000000', width: 4 }
        });

        // Hassan HUD
        const hassanName = new Text({ text: 'HASSAN', style: textStyle });
        hassanName.x = 50;
        hassanName.y = 30;
        this.addChild(hassanName);

        const playerBg = this.createBarFrame(50, 60, 400, 0x8c6a24);
        this.addChild(playerBg);

        this.playerHealthBar = new Graphics();
        this.updateHealthBar(this.playerHealthBar, 400, 0xf2c14e);
        this.playerHealthBar.x = 50;
        this.playerHealthBar.y = 60;
        this.addChild(this.playerHealthBar);

        // Chamharouch HUD
        const enemyName = new Text({ text: 'CHAMHAROUCH', style: textStyle });
        enemyName.anchor.x = 1;
        enemyName.x = 1230;
        enemyName.y = 30;
        this.addChild(enemyName);

        const enemyBg = this.createBarFrame(830, 60, 400, 0x7d2b27);
        this.addChild(enemyBg);

        this.enemyHealthBar = new Graphics();
        this.updateHealthBar(this.enemyHealthBar, 400, 0xd94f4f);
        this.enemyHealthBar.x = 830;
        this.enemyHealthBar.y = 60;
        this.addChild(this.enemyHealthBar);

        this.addChild(this.createBadge(30, 75, 'H', 0xd49a36));
        this.addChild(this.createBadge(1250, 75, 'C', 0x9e302c));
    }

    private createBarFrame(x: number, y: number, width: number, color: number) {
        const frame = new Graphics();
        frame.rect(x, y, width, 30);
        frame.fill({ color: 0x17151a });
        frame.stroke({ color, width: 3 });
        frame.rect(x + 4, y + 4, width - 8, 3);
        frame.fill({ color: 0xffffff, alpha: 0.2 });
        return frame;
    }

    private createBadge(x: number, y: number, label: string, color: number) {
        const badge = new Graphics();
        badge.circle(x, y, 24);
        badge.fill({ color: 0x17151a });
        badge.stroke({ color, width: 3 });
        const text = new Text({ text: label, style: { fontFamily: 'Arial', fontSize: 20, fontWeight: 'bold', fill: 0xffffff } });
        text.anchor.set(0.5);
        text.x = x;
        text.y = y;
        const container = new Container();
        container.addChild(badge, text);
        return container;
    }

    private updateHealthBar(bar: Graphics, width: number, color: number) {
        bar.clear();
        if (width <= 0) return;
        bar.rect(0, 0, width, 30);
        bar.fill({ color: 0x5b1f26 });
        bar.rect(3, 3, Math.max(0, width - 6), 24);
        bar.fill({ color });
        bar.rect(3, 3, Math.max(0, width - 6), 5);
        bar.fill({ color: 0xffffff, alpha: 0.28 });
        for (let x = 12; x < width - 3; x += 24) {
            bar.rect(x, 23, 12, 2);
            bar.fill({ color: 0x000000, alpha: 0.16 });
        }
    }

    public update(playerHP: number, enemyHP: number) {
        // Smooth transition (Lerp)
        this.playerHP += (playerHP / 100 - this.playerHP) * 0.1;
        this.enemyHP += (enemyHP / 100 - this.enemyHP) * 0.1;

        this.updateHealthBar(this.playerHealthBar, Math.max(0, this.playerHP * 400), 0xffff00);
        this.updateHealthBar(this.enemyHealthBar, Math.max(0, this.enemyHP * 400), 0xff0000);
    }
}

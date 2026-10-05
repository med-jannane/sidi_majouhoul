import { Graphics, Sprite, Assets, Container, Text, TextStyle } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Player } from '../entities/Player';
import { Chamharouch, Enemy } from '../entities/Enemy';
import { TransitionManager } from '../core/TransitionManager';
import { AudioManager } from '../core/AudioManager';
import { CollisionManager } from '../physics/CollisionManager';
import { HUD } from '../core/HUD';
import { PauseMenu } from '../core/PauseMenu';
import { MobileControls } from '../core/MobileControls';
import { DialogueBox } from '../core/DialogueBox';
import { Shopkeeper } from '../entities/Shopkeeper';
import { GambriChallenge } from '../core/GambriChallenge';

export class FightScene extends BaseScene {
    private player!: Player;
    private worldContainer: Container;
    private uiContainer: Container;
    private transition: TransitionManager;
    private hud: HUD;
    private pauseMenu: PauseMenu | null = null;
    private mobileControls: MobileControls | null = null;
    private background: Sprite | null = null;
    private totalWorldWidth: number = 1280;
    private enemies: Enemy[] = [];
    private isPaused = false;
    private currentLevel = 1;
    private screenShake = 0;
    private shakeStrength = 0;
    private impactEffects: Array<{ graphic: Graphics; life: number }> = [];
    private resultOverlay: Container | null = null;
    private levelTransitioning = false;
    private shopkeeper: Shopkeeper | null = null;
    private dialogueBox: DialogueBox;
    private talkHint: Text;
    private ritualSheet: Sprite | null = null;
    private groundGambri: Sprite | null = null;
    private gambriChallenge: GambriChallenge;
    private ritualHint: Text;
    private ritualStarted = false;
    private playerCombo = 0;
    private lastPlayerHitAt = 0;
    private levelChangeStarted = false;
    private hasSword = false;
    // private colorFilter: ColorMatrixFilter;

    constructor() {
        super();
        this.worldContainer = new Container();
        
        // Commenté pour conserver les couleurs d'origine (trop clair/foncé ou contrasté sinon)
        // this.colorFilter = new ColorMatrixFilter();
        // this.worldContainer.filters = [this.colorFilter];
        // this.colorFilter.brightness(1.1, false);
        // this.colorFilter.contrast(1.2, false);
        
        this.addChild(this.worldContainer);
        
        this.uiContainer = new Container();
        this.addChild(this.uiContainer);

        this.hud = new HUD();
        this.uiContainer.addChild(this.hud);

        this.dialogueBox = new DialogueBox(() => {
            this.isPaused = false;
        }, () => {
            this.hasSword = true;
            this.player.hasSword = true;
        });
        this.uiContainer.addChild(this.dialogueBox);

        this.talkHint = new Text({
            text: 'PRESS E OR TALK TO SPEAK',
            style: new TextStyle({ fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: '#ffffff', stroke: { color: 0x17121a, width: 5 } })
        });
        this.talkHint.anchor.set(0.5);
        this.talkHint.x = 640;
        this.talkHint.y = 450;
        this.talkHint.visible = false;
        this.uiContainer.addChild(this.talkHint);

        this.ritualHint = new Text({
            text: 'PRESS E TO PICK UP THE LEAF',
            style: new TextStyle({ fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: '#ffffff', stroke: { color: 0x17121a, width: 5 } })
        });
        this.ritualHint.anchor.set(0.5);
        this.ritualHint.x = 640;
        this.ritualHint.y = 450;
        this.ritualHint.visible = false;
        this.uiContainer.addChild(this.ritualHint);

        this.gambriChallenge = new GambriChallenge(() => this.revealChamharouch());
        this.uiContainer.addChild(this.gambriChallenge);
        
        this.transition = new TransitionManager();
        this.uiContainer.addChild(this.transition); 
        
        this.createPauseButton();
        this.init();

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') this.togglePause();
            if (e.code === 'KeyE' && !e.repeat) this.handleDialogueInput();
            if (!e.repeat && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
                this.dialogueBox.answerQuestion(Number(e.code.slice(-1)) - 1);
            }
            if (this.gambriChallenge.visible && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                this.gambriChallenge.handleInput(e.code);
            }
        });
    }

    private createPauseButton() {
        const btn = new Container();
        const bg = new Graphics();
        bg.circle(0, 0, 25);
        bg.fill({ color: 0x333333, alpha: 0.8 });
        bg.stroke({ color: 0xFFD700, width: 2 });
        
        const line1 = new Graphics();
        line1.rect(-8, -10, 5, 20);
        line1.fill(0xFFD700);
        const line2 = new Graphics();
        line2.rect(3, -10, 5, 20);
        line2.fill(0xFFD700);

        btn.addChild(bg, line1, line2);
        btn.x = 1230; btn.y = 120;
        btn.interactive = true;
        btn.cursor = 'pointer';
        btn.on('pointerdown', () => this.togglePause());
        this.uiContainer.addChild(btn);
    }

    private togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.pauseMenu = new PauseMenu(() => this.togglePause());
            this.addChild(this.pauseMenu);
            if (this.mobileControls) this.mobileControls.visible = false;
        } else if (this.pauseMenu) {
            this.removeChild(this.pauseMenu);
            this.pauseMenu = null;
            if (this.mobileControls) this.mobileControls.visible = true;
        }
    }

    private async init() {
        AudioManager.loadSound('marrakech_bgm', 'assets/sounds/ambient/Arabian Music - The Sahara Desert [GxpxKOmRkAA].mp3', 'bgm', true);
        AudioManager.loadSound('sword_slash', 'assets/sounds/fx/dragger.mp3', 'sfx');
        AudioManager.loadSound('hassan_hit', 'assets/sounds/fx/hasssan_hit.mp3', 'sfx');
        AudioManager.loadSound('boss_attack', 'assets/sounds/fx/chamharouch_attack.mp3', 'sfx');
        AudioManager.loadSound('boss_hit', 'assets/sounds/fx/damagebydragger.mp3', 'sfx');
        AudioManager.loadSound('elder_dialogue', 'assets/sounds/dialoge/Screen Recording 2026-09-30 123416.mp3', 'voice');

        AudioManager.play('marrakech_bgm');
        await this.loadLevel(1);

        // Ajout des contrôles mobiles
        this.mobileControls = new MobileControls((key, isDown) => {
            if (this.player) {
                this.player.keys[key] = isDown;
                if (key === 'KeyX' && isDown) {
                    this.player.requestAttack();
                }
            }
        });
        this.uiContainer.addChild(this.mobileControls);
    }

    private async loadLevel(num: number) {
        this.currentLevel = num;
        this.levelTransitioning = num === 2;
        if (num === 1) this.levelChangeStarted = false;
        if (this.player) this.player.keys = {};
        if (num === 2) {
            this.isPaused = true;
            await this.transition.fadeInOut("THE AIR GROWS HEAVY...\nTHE PALACE IS NEAR", 4000, 'assets/backgrounds/trasnition d du premierdecor ou deuxieme.png');
            await new Promise(r => setTimeout(r, 1000));
        }

        this.worldContainer.removeChildren();
        this.worldContainer.position.set(0, 0);
        this.enemies = [];
        this.impactEffects = [];
        this.shopkeeper = null;
        this.ritualSheet = null;
        this.groundGambri = null;
        this.ritualStarted = false;
        this.playerCombo = 0;
        this.lastPlayerHitAt = 0;
        this.dialogueBox.close();
        this.talkHint.visible = false;
        this.ritualHint.visible = false;
        this.gambriChallenge.finish();

        const bgPath = num === 1
            ? 'assets/backgrounds/ChatGPT Image Sep 29, 2026, 09_10_52 PM.png'
            : 'assets/backgrounds/marrkech2.png';
        try {
            const bgTexture = await Assets.load(bgPath);
            this.background = new Sprite(bgTexture);
            const scale = Math.max(1280 / bgTexture.width, 720 / bgTexture.height) * 1.5;
            this.background.scale.set(scale);
            this.background.y = 720 - this.background.height + 50;
            this.worldContainer.addChild(this.background);
            this.totalWorldWidth = this.background.width;
        } catch (e) { console.error(e); }

        const groundY = num === 1 ? 585 : 670;
        const ground = new Graphics();
        ground.rect(-1000, groundY, this.totalWorldWidth + 2000, 100);
        ground.fill({ color: 0x000000, alpha: 0 });
        this.worldContainer.addChild(ground);

        this.player = new Player();
        this.player.hasSword = this.hasSword;
        this.player.x = 200;
        this.player.y = groundY;
        this.player.groundY = groundY;
        this.player.isGrounded = true;
        this.worldContainer.addChild(this.player);

        if (num === 1) {
            this.shopkeeper = new Shopkeeper();
            this.shopkeeper.x = 650;
            this.shopkeeper.y = groundY;
            this.worldContainer.addChild(this.shopkeeper);
        }

        if (num === 2) {
            this.createRitualObjects(groundY);
            this.isPaused = false;
        } else {
            await this.transition.fadeInOut("WELCOME TO MARRAKECH", 3000);
        }
        this.levelTransitioning = false;
    }

    private showCombatResult(victory: boolean) {
        if (this.resultOverlay) return;
        this.isPaused = true;
        AudioManager.stop('gambri_music');

        const overlay = new Container();
        const backdrop = new Graphics();
        backdrop.rect(0, 0, 1280, 720);
        backdrop.fill({ color: 0x080609, alpha: 0.78 });
        overlay.addChild(backdrop);

        const panel = new Graphics();
        panel.rect(300, 190, 680, 300);
        panel.fill({ color: 0x1d1820 });
        panel.stroke({ color: victory ? 0xffd166 : 0xd94f4f, width: 4 });
        overlay.addChild(panel);

        const title = new Text({
            text: victory ? 'CHAMHAROUCH DEFEATED' : 'HASSAN HAS FALLEN',
            style: new TextStyle({
                fontFamily: '"Press Start 2P", Arial',
                fontSize: 26,
                fill: victory ? '#FFD166' : '#E66A6A',
                align: 'center'
            })
        });
        title.anchor.set(0.5);
        title.x = 640;
        title.y = 270;
        overlay.addChild(title);

        const subtitle = new Text({
            text: victory ? 'THE PALACE IS FREE' : 'THE FIGHT BEGINS AGAIN',
            style: { fontFamily: 'Arial', fontSize: 22, fill: 0xffffff }
        });
        subtitle.anchor.set(0.5);
        subtitle.x = 640;
        subtitle.y = 325;
        overlay.addChild(subtitle);

        const restart = new Container();
        const restartBg = new Graphics();
        restartBg.rect(-150, -25, 300, 50);
        restartBg.fill({ color: victory ? 0x9b6b25 : 0x8f302f });
        restartBg.stroke({ color: 0xffffff, width: 2 });
        const restartText = new Text({ text: 'RESTART', style: { fontFamily: 'Arial', fontSize: 20, fill: 0xffffff, fontWeight: 'bold' } });
        restartText.anchor.set(0.5);
        restart.addChild(restartBg, restartText);
        restart.x = 640;
        restart.y = 410;
        restart.interactive = true;
        restart.cursor = 'pointer';
        restart.on('pointerdown', () => this.restartFight());
        overlay.addChild(restart);

        this.resultOverlay = overlay;
        this.uiContainer.addChild(overlay);
    }

    private restartFight() {
        if (this.resultOverlay) {
            this.uiContainer.removeChild(this.resultOverlay);
            this.resultOverlay = null;
        }
        this.loadLevel(2);
    }

    private triggerImpact(x: number, y: number, color: number) {
        this.screenShake = Math.max(this.screenShake, 8);
        this.shakeStrength = Math.max(this.shakeStrength, 5);

        const effect = new Graphics();
        effect.circle(0, 0, 12);
        effect.fill({ color, alpha: 0.85 });
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            effect.moveTo(Math.cos(angle) * 14, Math.sin(angle) * 14);
            effect.lineTo(Math.cos(angle) * 30, Math.sin(angle) * 30);
            effect.stroke({ color, width: 3, alpha: 0.9 });
        }
        effect.x = x;
        effect.y = y - 55;
        this.worldContainer.addChild(effect);
        this.impactEffects.push({ graphic: effect, life: 14 });
    }

    public update(delta: number) {
        if (this.gambriChallenge.visible) {
            this.gambriChallenge.update(delta);
            return;
        }
        if (this.isPaused) return;

        for (let i = this.impactEffects.length - 1; i >= 0; i--) {
            const effect = this.impactEffects[i];
            effect.life -= delta;
            effect.graphic.alpha = Math.max(0, effect.life / 14);
            effect.graphic.scale.set(1 + (14 - effect.life) * 0.025);
            if (effect.life <= 0) {
                this.worldContainer.removeChild(effect.graphic);
                this.impactEffects.splice(i, 1);
            }
        }

        this.screenShake = Math.max(0, this.screenShake - delta);
        if (this.player) {
            this.player.update(delta);
            this.shopkeeper?.update(delta);
            const nearRitual = this.currentLevel === 2 && this.ritualSheet !== null && Math.abs(this.player.x - this.ritualSheet.x) < 170;
            this.ritualHint.visible = Boolean(nearRitual) && !this.ritualStarted;
            const nearShopkeeper = this.shopkeeper !== null && Math.abs(this.player.x - this.shopkeeper.x) < 190;
            this.talkHint.visible = nearShopkeeper && !this.dialogueBox.isOpen && !this.levelTransitioning;
            const levelMargin = 70;
            const levelMaxX = Math.max(levelMargin, this.totalWorldWidth - levelMargin);
            this.player.x = Math.max(levelMargin, Math.min(this.player.x, levelMaxX));
            for (const enemy of this.enemies) {
                enemy.update(delta);
                if (this.player.attackHitbox.visible && CollisionManager.checkCollision(this.player.attackHitbox, enemy.hurtbox)) {
                    if (!enemy.isHurt) {
                        const now = Date.now();
                        this.playerCombo = now - this.lastPlayerHitAt < 900 ? this.playerCombo + 1 : 1;
                        this.lastPlayerHitAt = now;
                        const comboDamage = this.playerCombo >= 3 ? 25 : 10;
                        enemy.takeDamage(comboDamage);
                        AudioManager.play('boss_hit');
                        this.triggerImpact(enemy.x, enemy.y, this.playerCombo >= 3 ? 0xff5a36 : 0xffd166);
                        if (this.playerCombo >= 3) this.playerCombo = 0;
                    }
                }
                if (enemy.attackHitbox.visible && CollisionManager.checkCollision(enemy.attackHitbox, this.player.hurtbox)) {
                    if (!this.player.isHurt) {
                        this.player.takeDamage(enemy.attackDamage, enemy.x);
                        AudioManager.play('boss_attack');
                        this.triggerImpact(this.player.x, this.player.y, 0xff5a36);
                    }
                }
                if (!this.player.attacking && !enemy.isAttacking && CollisionManager.checkCollision(enemy.contactHitbox, this.player.hurtbox)) {
                    if (!this.player.isHurt) {
                        this.player.takeDamage(enemy.attackDamage, enemy.x);
                        AudioManager.play('boss_attack');
                        this.triggerImpact(this.player.x, this.player.y, 0xff8c42);
                    }
                }
            }
            this.hud.update(this.player.health, this.enemies[0]?.health || 0);
            const targetX = 640 - this.player.x;
            this.worldContainer.x += (targetX - this.worldContainer.x) * 0.1 * delta;
            const minX = 1280 - this.totalWorldWidth;
            const maxX = 0;
            if (this.worldContainer.x < minX) this.worldContainer.x = minX;
            if (this.worldContainer.x > maxX) this.worldContainer.x = maxX;
            if (this.screenShake > 0) {
                this.worldContainer.x += (Math.random() - 0.5) * this.shakeStrength;
                this.worldContainer.y = (Math.random() - 0.5) * this.shakeStrength * 0.45;
            } else {
                this.worldContainer.y = 0;
            }

            if (this.currentLevel === 1 && !this.levelTransitioning && !this.levelChangeStarted && this.player.x >= this.totalWorldWidth - 150) {
                this.levelChangeStarted = true;
                this.loadLevel(2);
            }

            if (this.currentLevel === 2) {
                if (this.player.health <= 0) {
                    this.showCombatResult(false);
                } else if (this.enemies.length > 0 && this.enemies.every(enemy => enemy.health <= 0)) {
                    this.showCombatResult(true);
                }
            }
        }
    }

    private handleDialogueInput() {
        if (this.currentLevel === 2 && !this.ritualStarted && this.ritualSheet && this.player && Math.abs(this.player.x - this.ritualSheet.x) < 170) {
            this.startRitual();
            return;
        }
        if (this.dialogueBox.isOpen) {
            this.dialogueBox.advance();
            if (!this.dialogueBox.isOpen) this.isPaused = false;
            return;
        }

        if (this.shopkeeper && this.player && Math.abs(this.player.x - this.shopkeeper.x) < 190) {
            this.dialogueBox.open();
            this.talkHint.visible = false;
            this.isPaused = true;
        }
    }

    private createRitualObjects(groundY: number) {
        this.ritualSheet = new Sprite();
        this.ritualSheet.anchor.set(0.5, 1);
        this.ritualSheet.scale.set(0.42);
        this.ritualSheet.position.set(700, groundY);
        this.worldContainer.addChild(this.ritualSheet);
        Assets.load('assets/deco/la feuille.png').then((texture) => {
            if (this.ritualSheet) this.ritualSheet.texture = texture;
        });

        this.groundGambri = new Sprite();
        this.groundGambri.anchor.set(0.5, 1);
        this.groundGambri.scale.set(0.22);
        this.groundGambri.position.set(790, groundY);
        this.worldContainer.addChild(this.groundGambri);
        Assets.load('assets/deco/gumbri.png').then((texture) => {
            if (this.groundGambri) this.groundGambri.texture = texture;
        });
    }

    private startRitual() {
        this.ritualStarted = true;
        this.isPaused = true;
        this.ritualHint.visible = false;
        if (this.ritualSheet) this.worldContainer.removeChild(this.ritualSheet);
        if (this.groundGambri) this.worldContainer.removeChild(this.groundGambri);
        this.ritualSheet = null;
        this.groundGambri = null;
        AudioManager.pause('marrakech_bgm');
        AudioManager.loadSound('gambri_music', 'assets/sounds/gambri/Guembri Solo - Baba Mimoun by ADIL SOUMMAR.mp3', 'voice', true);
        AudioManager.play('gambri_music');
        this.gambriChallenge.open();
    }

    private revealChamharouch() {
        this.gambriChallenge.finish();
        this.isPaused = false;
        const boss = new Chamharouch(this.player);
        boss.x = 1200;
        boss.y = 670;
        boss.groundY = 670;
        this.enemies.push(boss);
        this.worldContainer.addChild(boss);
        this.isPaused = false;
    }
}

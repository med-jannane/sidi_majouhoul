import { AnimatedSprite, Assets, Texture, Graphics } from 'pixi.js';
import { Entity } from './Entity';
import { AudioManager } from '../core/AudioManager';

export class Player extends Entity {
    private animations: Record<string, AnimatedSprite> = {};
    private currentAnimation: AnimatedSprite | null = null;
    private moveSpeed = 4.2;
    private horizontalAcceleration = 0.75;
    private jumpForce = -12;
    public keys: Record<string, boolean> = {};
    private isAttacking = false;
    private attackCooldown = 0;
    private readonly ATTACK_DELAY = 40;
    private readonly footOffsets: Record<string, number[]> = {
        idle: [52, 52, 52],
        walk: [34, 40, 32, 34],
        attack: [41, 49, 52],
        hit: [17, 40, 50]
    };

    public attackHitbox: Graphics;
    private facingRight = true;
    private isLoaded = false;
    
    public health = 100;
    public isHurt = false;
    private invulnerabilityTimer = 0;
    public hurtbox: Graphics;

    public hasSword = false;

    public get attacking(): boolean {
        return this.isAttacking;
    }

    private alignAnimationFrame(name: string, frame: number) {
        const offset = this.footOffsets[name]?.[frame];
        if (offset !== undefined && this.currentAnimation) {
            this.currentAnimation.position.y = offset - 55;
        }
    }

    constructor() {
        super();
        
        this.attackHitbox = new Graphics();
        this.attackHitbox.rect(0, -40, 80, 50);
        this.attackHitbox.fill({ color: 0xff0000, alpha: 0.3 });
        this.attackHitbox.visible = false;
        this.addChild(this.attackHitbox);

        this.hurtbox = new Graphics();
        this.hurtbox.rect(-25, -80, 50, 80);
        this.hurtbox.fill({ color: 0x0000ff, alpha: 0 }); 
        this.addChild(this.hurtbox);

        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code] && e.code === 'KeyX') {
                this.requestAttack();
            }
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        this.init();
    }

    private async init() {
        const animConfig = { idle: 3, walk: 5, jump: 3, attack: 3, hit: 3 };
        for (const [name, frameCount] of Object.entries(animConfig)) {
            const textures: Texture[] = [];
            for (let i = 1; i <= frameCount; i++) {
                const path = `assets/hassan/${name}/${i}.png`;
                try {
                    const texture = await Assets.load(path);
                    textures.push(texture);
                } catch (e) { if (i < 5) console.error(e); }
            }
            if (textures.length > 0) {
                const anim = new AnimatedSprite(textures);
                anim.anchor.set(0.5, 1);
                anim.animationSpeed = name === 'walk' ? 0.26 : 0.2;
                anim.position.y = (this.footOffsets[name]?.[0] ?? 0) - 55;
                anim.visible = false;
                anim.onFrameChange = (frame) => this.alignAnimationFrame(name, frame);
                if (name === 'attack') {
                    anim.loop = false;
                    anim.onFrameChange = (frame) => {
                        this.alignAnimationFrame(name, frame);
                        this.attackHitbox.visible = (frame === 1);
                    };
                    anim.onComplete = () => {
                        this.isAttacking = false;
                        this.attackHitbox.visible = false;
                        this.playAnimation('idle');
                    };
                }
                if (name === 'hit') {
                    anim.loop = false;
                    anim.onComplete = () => { this.playAnimation('idle'); };
                }
                if (name === 'jump') anim.loop = false;
                this.animations[name] = anim;
                this.addChild(anim);
            }
        }
        this.isLoaded = true;
        this.playAnimation('idle');
    }

    public requestAttack() {
        if (!this.isLoaded || this.isHurt || this.isAttacking || this.attackCooldown > 0 || this.health <= 0 || !this.hasSword) return;
        this.isAttacking = true;
        this.attackCooldown = this.ATTACK_DELAY;
        this.velocity.x = 0;
        this.playAnimation('attack');
        AudioManager.play('sword_slash');
    }

    public takeDamage(amount: number, fromX: number) {
        if (this.invulnerabilityTimer > 0 || this.health <= 0) return;
        this.health -= amount;
        this.isHurt = true;
        this.isAttacking = false;
        this.invulnerabilityTimer = 60; 
        this.playAnimation('hit');
        AudioManager.play('hassan_hit');
        this.velocity.x = (this.x > fromX) ? 10 : -10;
        this.velocity.y = -5;
    }

    public playAnimation(name: string) {
        if (!this.animations[name]) return;
        if (this.currentAnimation === this.animations['hit'] && this.currentAnimation.playing && name !== 'hit') return;
        if (this.currentAnimation === this.animations[name] && this.currentAnimation.playing && name !== 'attack') return;
        if (this.currentAnimation) {
            this.currentAnimation.stop();
            this.currentAnimation.visible = false;
        }
        this.currentAnimation = this.animations[name];
        this.currentAnimation.visible = true;
        this.currentAnimation.gotoAndPlay(0);
    }

    public update(delta: number) {
        if (!this.isLoaded || !this.currentAnimation) return;
        if (this.attackCooldown > 0) this.attackCooldown -= delta;
        if (this.invulnerabilityTimer > 0) {
            this.invulnerabilityTimer -= delta;
            if (this.currentAnimation !== this.animations['hit'] || !this.currentAnimation.playing) {
                this.alpha = (Math.floor(this.invulnerabilityTimer) % 6 < 3) ? 0.3 : 1;
            } else { this.alpha = 1; }
            if (this.invulnerabilityTimer <= 0) { this.isHurt = false; this.alpha = 1; }
        }

        this.attackHitbox.x = this.facingRight ? 10 : -90;
        this.attackHitbox.y = -60;

        const playingHit = this.currentAnimation === this.animations['hit'] && this.currentAnimation.playing;
        if (!playingHit && !this.isAttacking && this.health > 0) {
            let moving = false;
            if (this.keys['ArrowLeft']) {
                this.velocity.x = Math.max(this.velocity.x - this.horizontalAcceleration, -this.moveSpeed);
                this.facingRight = false; moving = true;
            } else if (this.keys['ArrowRight']) {
                this.velocity.x = Math.min(this.velocity.x + this.horizontalAcceleration, this.moveSpeed);
                this.facingRight = true; moving = true;
            } else {
                this.velocity.x *= 0.78;
                if (Math.abs(this.velocity.x) < 0.08) this.velocity.x = 0;
            }

            if (this.keys['Space'] && this.isGrounded) {
                this.velocity.y = this.jumpForce;
                this.isGrounded = false;
                this.playAnimation('jump');
            }

            if (this.isGrounded) {
                if (moving) {
                    this.playAnimation('walk');
                } else if (Math.abs(this.velocity.x) < 0.2) {
                    this.playAnimation('idle');
                }
            } else {
                this.playAnimation('jump');
            }
        }

        if (this.currentAnimation) {
            this.currentAnimation.scale.set(this.facingRight ? 0.6 : -0.6, 0.6);
        }

        this.velocity.y += this.gravity * delta;
        this.x += this.velocity.x * delta;
        this.y += this.velocity.y * delta;

        if (this.y > this.groundY) {
            this.y = this.groundY;
            this.velocity.y = 0;
            this.isGrounded = true;
        }
    }
}

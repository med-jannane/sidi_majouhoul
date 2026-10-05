import { Graphics, AnimatedSprite, Assets, Texture } from 'pixi.js';
import { Entity } from './Entity';
import { Player } from './Player';

export class Enemy extends Entity {
    public health = 100;
    protected animations: Record<string, AnimatedSprite> = {};
    protected currentAnimation: AnimatedSprite | null = null;
    protected target: Player | null = null;
    protected isDead = false;
    public isHurt = false;
    public isAttacking = false;
    public attackDamage = 10;
    protected lastAttackTime = 0;
    protected attackCooldown = 2000;
    public hurtbox: Graphics;
    public attackHitbox: Graphics;
    public contactHitbox: Graphics;
    protected facingRight = false;
    protected isLoaded = false;
    private attackPattern = 0;
    private readonly footOffsets: Record<string, number[]> = {
        idle: [21],
        walk: [21, 21, 21],
        attack: [31, 16, 18],
        hit: [5, 13, 21]
    };

    constructor(target: Player) {
        super();
        this.target = target;
        
        this.hurtbox = new Graphics();
        this.hurtbox.rect(-40, -100, 80, 100);
        this.hurtbox.fill({ color: 0x00ff00, alpha: 0 });
        this.addChild(this.hurtbox);

        this.contactHitbox = new Graphics();
        this.contactHitbox.rect(-52, -104, 104, 104);
        this.contactHitbox.fill({ color: 0xff8800, alpha: 0 });
        this.addChild(this.contactHitbox);

        this.attackHitbox = new Graphics();
        this.attackHitbox.rect(-100, -60, 100, 60);
        this.attackHitbox.fill({ color: 0xff0000, alpha: 0.5 });
        this.attackHitbox.visible = false;
        this.addChild(this.attackHitbox);
    }

    private alignAnimationFrame(name: string, frame: number) {
        const offset = this.footOffsets[name]?.[frame];
        if (offset !== undefined && this.currentAnimation) {
            this.currentAnimation.position.y = offset - 30;
        }
    }

    protected async loadAnimations(folder: string, config: Record<string, number>) {
        for (const [name, frameCount] of Object.entries(config)) {
            const textures: Texture[] = [];
            for (let i = 1; i <= frameCount; i++) {
                // Support .png and .jpeg for frame 2 of attack
                let ext = 'png';
                if (folder === 'chamharouch' && name === 'attack' && i === 2) ext = 'jpeg';
                
                const path = `assets/${folder}/${name}/${i}.${ext}`;
                try {
                    const texture = await Assets.load(path);
                    textures.push(texture);
                } catch (e) {
                    console.error(`Failed to load: ${path}`, e);
                }
            }
            
            if (textures.length > 0) {
                const anim = new AnimatedSprite(textures);
                anim.anchor.set(0.5, 1);
                anim.animationSpeed = name === 'walk' ? 0.2 : 0.15;
                anim.position.y = (this.footOffsets[name]?.[0] ?? 0) - 30;
                anim.visible = false;
                anim.onFrameChange = (frame) => this.alignAnimationFrame(name, frame);
                
                if (name === 'attack') {
                    anim.loop = false;
                    anim.onFrameChange = (frame) => {
                        this.alignAnimationFrame(name, frame);
                        this.attackHitbox.visible = (frame === 1); // Frame d'impact
                    };
                    anim.onComplete = () => {
                        this.isAttacking = false;
                        this.attackHitbox.visible = false;
                        this.playAnimation('idle');
                    };
                }

                if (name === 'hit') {
                    anim.loop = false;
                    anim.onComplete = () => {
                        this.isHurt = false;
                        this.playAnimation('idle');
                    };
                }

                this.animations[name] = anim;
                this.addChild(anim);
            }
        }
        this.isLoaded = true;
        this.playAnimation('idle');
    }

    public playAnimation(name: string) {
        if (!this.animations[name]) return;
        if (this.currentAnimation === this.animations[name] && this.currentAnimation.playing && name !== 'attack' && name !== 'hit') return;
        
        if (this.currentAnimation) {
            this.currentAnimation.stop();
            this.currentAnimation.visible = false;
        }

        this.currentAnimation = this.animations[name];
        this.currentAnimation.visible = true;
        this.currentAnimation.gotoAndPlay(0);
    }

    public takeDamage(amount: number) {
        if (this.isDead || this.isHurt) return;
        
        this.health -= amount;
        this.isHurt = true;
        this.isAttacking = false;
        this.playAnimation('hit');
        
        this.velocity.x = (this.x > this.target!.x) ? 5 : -5;
        
        if (this.health <= 0) this.die();
    }

    protected die() {
        this.isDead = true;
        this.visible = false;
    }

    public update(delta: number) {
        if (this.isDead || !this.target || !this.isLoaded) return;

        const dist = this.target.x - this.x;
        this.facingRight = dist > 0;

        if (!this.isHurt && !this.isAttacking) {
            if (Math.abs(dist) > 100) {
                const desiredSpeed = Math.sign(dist) * 1.6;
                this.velocity.x += (desiredSpeed - this.velocity.x) * 0.12;
                this.playAnimation('walk');
            } else {
                this.velocity.x *= 0.78;
                const now = Date.now();
                if (now - this.lastAttackTime > this.attackCooldown) {
                    this.attack();
                    this.lastAttackTime = now;
                } else {
                    this.playAnimation('idle');
                }
            }
        }

        if (this.currentAnimation) {
            this.currentAnimation.scale.x = this.facingRight ? 1 : -1;
        }
        
        this.velocity.y += this.gravity * delta;
        this.x += this.velocity.x * delta;
        this.y += this.velocity.y * delta;

        if (this.y > this.groundY) {
            this.y = this.groundY;
            this.velocity.y = 0;
        }
    }

    protected attack() {
        this.isAttacking = true;
        this.attackPattern = (this.attackPattern + 1) % 3;

        if (this.attackPattern === 1) {
            this.attackHitbox.clear();
            this.attackHitbox.rect(0, -115, 300, 95);
            this.attackHitbox.fill({ color: 0xff5a36, alpha: 0 });
            this.attackHitbox.x = this.facingRight ? 20 : -320;
        } else {
            this.attackHitbox.clear();
            this.attackHitbox.rect(0, -70, 120, 70);
            this.attackHitbox.fill({ color: 0xff0000, alpha: 0 });
            this.attackHitbox.x = this.facingRight ? 20 : -140;
        }

        if (this.attackPattern === 2 && Math.abs(this.target!.x - this.x) > 280) {
            this.x = this.target!.x + (this.target!.x < this.x ? 180 : -180);
        }
        this.playAnimation('attack');
    }
}

export class Chamharouch extends Enemy {
    constructor(target: Player) {
        super(target);
        this.health = 140;
        this.attackDamage = 18;
        this.attackCooldown = 1400;
        this.loadAnimations('chamharouch', {
            idle: 1,
            walk: 3,
            attack: 3,
            hit: 3
        });
    }
}

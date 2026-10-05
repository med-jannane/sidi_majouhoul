import { Container } from 'pixi.js';

export abstract class Entity extends Container {
    public velocity = { x: 0, y: 0 };
    public acceleration = { x: 0, y: 0 };
    public friction = 0.8;
    public gravity = 0.5;
    public isGrounded = false;
    public groundY = 640;

    constructor() {
        super();
    }

    public abstract update(delta: number): void;
}

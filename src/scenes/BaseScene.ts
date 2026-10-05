import { Container } from 'pixi.js';

export abstract class BaseScene extends Container {
    constructor() {
        super();
    }

    public abstract update(delta: number): void;
}

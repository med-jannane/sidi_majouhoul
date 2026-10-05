import { Container } from 'pixi.js';

export interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class CollisionManager {
    public static checkAABB(a: Box, b: Box): boolean {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    public static checkCollision(objA: Container, objB: Container): boolean {
        const boundsA = objA.getBounds();
        const boundsB = objB.getBounds();

        return boundsA.x < boundsB.x + boundsB.width &&
               boundsA.x + boundsA.width > boundsB.x &&
               boundsA.y < boundsB.y + boundsB.height &&
               boundsA.y + boundsA.height > boundsB.y;
    }
}

import { Application } from 'pixi.js';
import { BaseScene } from '../scenes/BaseScene';
import { MenuScene } from '../scenes/MenuScene';

export class Engine {
    public app: Application;
    private static _instance: Engine;
    private currentScene: BaseScene | null = null;

    constructor() {
        this.app = new Application();
    }

    public static get instance(): Engine {
        if (!Engine._instance) {
            Engine._instance = new Engine();
        }
        return Engine._instance;
    }

    public async init() {
        await this.app.init({
            width: 1280,
            height: 720,
            backgroundColor: 0x1099bb,
            resolution: window.devicePixelRatio || 1,
            antialias: true,
        });

        document.body.appendChild(this.app.canvas);
        
        // Initial Scene : Menu Principal
        this.setScene(new MenuScene());

        // Game Loop
        this.app.ticker.add((ticker) => {
            this.update(ticker.deltaTime);
        });

        console.log('Sidi El Majhoul Engine Initialized');
    }

    public setScene(scene: BaseScene) {
        if (this.currentScene) {
            this.app.stage.removeChild(this.currentScene);
        }
        this.currentScene = scene;
        this.app.stage.addChild(this.currentScene);
    }

    private update(delta: number) {
        if (this.currentScene) {
            this.currentScene.update(delta);
        }
    }
}

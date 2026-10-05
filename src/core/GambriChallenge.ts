import { Assets, Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';

const NOTES = ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
const LABELS: Record<string, string> = {
    ArrowUp: 'UP',
    ArrowLeft: 'LEFT',
    ArrowRight: 'RIGHT',
    ArrowDown: 'DOWN'
};

export class GambriChallenge extends Container {
    private readonly onSuccess: () => void;
    private readonly status: Text;
    private readonly timerText: Text;
    private readonly noteText: Text;
    private readonly gambriImage: Sprite;
    private progress = 0;
    private remaining = 20;
    private elapsed = 0;
    private complete = false;

    constructor(onSuccess: () => void) {
        super();
        this.onSuccess = onSuccess;
        this.visible = false;

        const backdrop = new Graphics();
        backdrop.rect(0, 0, 1280, 720);
        backdrop.fill({ color: 0x09070a, alpha: 0.94 });
        this.addChild(backdrop);

        const panel = new Graphics();
        panel.roundRect(250, 55, 780, 610, 18);
        panel.fill({ color: 0x211923 });
        panel.stroke({ color: 0xffd166, width: 4 });
        this.addChild(panel);

        const title = new Text({ text: 'THE GUEMBRI RITUAL', style: new TextStyle({ fontFamily: 'Arial', fontSize: 30, fontWeight: 'bold', fill: '#ffd166' }) });
        title.anchor.set(0.5);
        title.x = 640;
        title.y = 95;
        this.addChild(title);

        this.gambriImage = new Sprite();
        this.gambriImage.anchor.set(0.5);
        this.gambriImage.position.set(640, 245);
        this.gambriImage.scale.set(1.2);
        this.addChild(this.gambriImage);
        Assets.load('assets/deco/Gemini_Generated_Image_v6ld6cv6ld6cv6ld__1_-removebg-preview.png').then((texture) => {
            this.gambriImage.texture = texture;
        });

        this.status = new Text({ text: 'Follow the arrow sequence without mistakes', style: new TextStyle({ fontFamily: 'Arial', fontSize: 20, fill: '#ffffff' }) });
        this.status.anchor.set(0.5);
        this.status.x = 640;
        this.status.y = 385;
        this.addChild(this.status);

        this.noteText = new Text({ text: '', style: new TextStyle({ fontFamily: 'Arial', fontSize: 28, fontWeight: 'bold', fill: '#ffffff' }) });
        this.noteText.anchor.set(0.5);
        this.noteText.x = 640;
        this.noteText.y = 435;
        this.addChild(this.noteText);

        this.timerText = new Text({ text: '', style: new TextStyle({ fontFamily: 'Arial', fontSize: 22, fill: '#ffcf70' }) });
        this.timerText.anchor.set(0.5);
        this.timerText.x = 640;
        this.timerText.y = 475;
        this.addChild(this.timerText);

        this.createButton('ArrowLeft', 330, 575, 'LEFT');
        this.createButton('ArrowUp', 485, 575, 'UP');
        this.createButton('ArrowRight', 640, 575, 'RIGHT');
        this.createButton('ArrowDown', 795, 575, 'DOWN');
        this.createButton('ArrowLeft', 950, 575, 'LEFT');
    }

    public open() {
        this.visible = true;
        this.progress = 0;
        this.remaining = 20;
        this.elapsed = 0;
        this.complete = false;
        this.status.text = 'Follow the arrow sequence without mistakes';
        this.refresh();
    }

    public handleInput(key: string) {
        if (!this.visible || this.complete || !LABELS[key]) return;
        if (key !== NOTES[this.progress]) {
            this.progress = 0;
            this.elapsed = 0;
            this.remaining = 20;
            this.status.text = 'Wrong arrow! Start again from zero.';
            this.refresh();
            return;
        }
        this.progress += 1;
        if (this.progress >= NOTES.length) {
            this.complete = true;
            this.status.text = 'Ritual complete! Chamharouch is coming...';
            this.noteText.text = 'MELODY COMPLETE';
            this.onSuccess();
            return;
        }
        this.status.text = 'Good note! Keep going.';
        this.refresh();
    }

    public update(delta: number) {
        if (!this.visible) return;
        this.elapsed += delta / 60;
        this.remaining = Math.max(0, 20 - this.elapsed);
        this.timerText.text = `Time left: ${Math.ceil(this.remaining)} s`;
        if (this.complete) {
            if (this.remaining <= 0) this.onSuccess();
            return;
        }
        if (this.remaining <= 0) {
            this.progress = 0;
            this.elapsed = 0;
            this.remaining = 20;
            this.status.text = 'Time is up! Start the sequence again.';
            this.refresh();
        }
    }

    public finish() {
        this.visible = false;
    }

    public get isComplete() {
        return this.complete;
    }

    private refresh() {
        this.noteText.text = `Note ${this.progress + 1}/${NOTES.length} : ${LABELS[NOTES[this.progress]]}`;
        this.timerText.text = `Time left: ${Math.ceil(this.remaining)} s`;
    }

    private createButton(key: string, x: number, y: number, label: string) {
        const button = new Container();
        const background = new Graphics();
        background.roundRect(-58, -30, 116, 60, 10);
        background.fill({ color: 0x60435d });
        background.stroke({ color: 0xffd166, width: 2 });
        const text = new Text({ text: label, style: new TextStyle({ fontFamily: 'Arial', fontSize: 13, fontWeight: 'bold', fill: '#ffffff' }) });
        text.anchor.set(0.5);
        button.addChild(background, text);
        button.position.set(x, y);
        button.interactive = true;
        button.cursor = 'pointer';
        button.on('pointerdown', () => this.handleInput(key));
        this.addChild(button);
    }
}
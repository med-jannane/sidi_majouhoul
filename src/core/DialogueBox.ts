import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { AudioManager } from './AudioManager';

const STORY_LINES = [
    'Long ago, Chamharouch was not a monster. He was the guardian of the palace. But darkness entered his heart and turned his power against the people.',
    'You seek the palace, but you are not ready. A sword will not help someone who does not understand the truth.',
    'Answer my questions, Hassan. If your answers are true, I will give you what you need.'
];

const QUESTIONS = [
    {
        text: 'Which Moroccan tradition welcomes guests with sweet mint tea?',
        choices: ['Hospitality', 'Silence', 'Solitude'],
        correct: 0
    },
    {
        text: 'What is the traditional Moroccan market called?',
        choices: ['A dojo', 'A souk', 'A station'],
        correct: 1
    },
    {
        text: 'Which instrument carries the Gnawa spirit in this journey?',
        choices: ['The piano', 'The violin', 'The guembri'],
        correct: 2
    }
];

export class DialogueBox extends Container {
    private readonly panel: Graphics;
    private readonly speaker: Text;
    private readonly line: Text;
    private readonly hint: Text;
    private readonly questionButtons: Container[] = [];
    private currentLine = 0;
    private currentQuestion = 0;
    private showingQuestions = false;
    private active = false;
    private voicePlaying = false;
    private dialogueTimer: ReturnType<typeof setTimeout> | null = null;
    private onClose: () => void;
    private onSwordEarned: () => void;

    constructor(onClose: () => void, onSwordEarned: () => void) {
        super();
        this.onClose = onClose;
        this.onSwordEarned = onSwordEarned;
        this.visible = false;

        this.panel = new Graphics();
        this.panel.roundRect(150, 385, 980, 315, 18);
        this.panel.fill({ color: 0x17121a, alpha: 0.96 });
        this.panel.stroke({ color: 0xffd166, width: 4 });
        this.addChild(this.panel);

        this.speaker = new Text({
            text: '',
            style: new TextStyle({ fontFamily: 'Arial', fontSize: 22, fontWeight: 'bold', fill: '#ffd166' })
        });
        this.speaker.x = 225;
        this.speaker.y = 405;
        this.addChild(this.speaker);

        this.line = new Text({
            text: '',
            style: new TextStyle({ fontFamily: 'Arial', fontSize: 24, fill: '#ffffff', wordWrap: true, wordWrapWidth: 820, lineHeight: 34 })
        });
        this.line.x = 225;
        this.line.y = 445;
        this.addChild(this.line);

        this.hint = new Text({
            text: 'E / TALK to continue',
            style: new TextStyle({ fontFamily: 'Arial', fontSize: 16, fill: '#cbbfd0' })
        });
        this.hint.anchor.set(1, 0);
        this.hint.x = 1095;
        this.hint.y = 665;
        this.addChild(this.hint);
    }

    public open() {
        if (this.active) return;
        this.active = true;
        this.currentLine = 0;
        this.currentQuestion = 0;
        this.showingQuestions = false;
        this.visible = true;
        this.showCurrentLine();
        this.scheduleNextLine(6500);
        AudioManager.pause('marrakech_bgm');
        AudioManager.stop('elder_dialogue');
        this.voicePlaying = true;
        AudioManager.play('elder_dialogue');
    }

    public advance() {
        if (!this.active) return;
        if (this.showingQuestions) return;
        this.clearDialogueTimer();
        if (this.currentLine >= STORY_LINES.length - 1) {
            if (!this.showingQuestions) this.close();
            return;
        }
        this.currentLine += 1;
        this.showCurrentLine();
        this.scheduleNextLine(5500);
    }

    public answerQuestion(choice: number) {
        if (!this.active || !this.showingQuestions) return;
        const question = QUESTIONS[this.currentQuestion];
        if (choice !== question.correct) {
            this.currentQuestion = 0;
            this.showQuestion('Wrong answer. Think carefully and start again.');
            return;
        }
        this.currentQuestion += 1;
        if (this.currentQuestion >= QUESTIONS.length) {
            this.onSwordEarned();
            this.line.text = 'You have understood the lesson. Take this sword, Hassan. Let courage guide your hand.';
            this.speaker.text = 'THE ELDER';
            this.showingQuestions = false;
            this.clearQuestionButtons();
            this.hint.text = 'E / TALK to continue';
            return;
        }
        this.showQuestion('Correct. Continue your answer.');
    }

    public close() {
        if (!this.active) return;
        this.clearDialogueTimer();
        this.active = false;
        this.visible = false;
        AudioManager.stop('elder_dialogue');
        this.voicePlaying = false;
        this.clearQuestionButtons();
        if (!this.voicePlaying) AudioManager.resume('marrakech_bgm');
        this.onClose();
    }

    public get isOpen() {
        return this.active;
    }

    private showCurrentLine() {
        this.speaker.text = 'THE ELDER';
        this.line.text = STORY_LINES[this.currentLine];
        if (this.currentLine === STORY_LINES.length - 1) {
            this.speaker.text = 'THE ELDER';
            this.hint.text = 'E / TALK to answer';
            this.showingQuestions = true;
            this.showQuestion('Answer the elder to earn your sword.');
        }
    }

    private scheduleNextLine(delay: number) {
        this.clearDialogueTimer();
        this.dialogueTimer = setTimeout(() => this.advance(), delay);
    }

    private clearDialogueTimer() {
        if (this.dialogueTimer !== null) {
            clearTimeout(this.dialogueTimer);
            this.dialogueTimer = null;
        }
    }

    private showQuestion(status: string) {
        const question = QUESTIONS[this.currentQuestion];
        this.line.text = `${status}\n\n${question.text}`;
        this.hint.text = 'Choose 1, 2 or 3';
        this.clearQuestionButtons();
        question.choices.forEach((choice, index) => {
            const button = new Container();
            const background = new Graphics();
            background.roundRect(-135, -18, 270, 36, 7);
            background.fill({ color: 0x182b43 });
            background.stroke({ color: 0x75b6c9, width: 1 });
            const text = new Text({ text: `${index + 1}. ${choice}`, style: { fontFamily: 'Arial', fontSize: 16, fill: 0xffffff } });
            text.anchor.set(0.5);
            button.addChild(background, text);
            button.position.set(320 + index * 320, 625);
            button.interactive = true;
            button.cursor = 'pointer';
            button.on('pointerdown', () => this.answerQuestion(index));
            this.questionButtons.push(button);
            this.addChild(button);
        });
    }

    private clearQuestionButtons() {
        for (const button of this.questionButtons) this.removeChild(button);
        this.questionButtons.length = 0;
    }
}
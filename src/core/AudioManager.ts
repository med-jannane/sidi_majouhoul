import { Howl } from 'howler';

export type SoundType = 'bgm' | 'sfx' | 'voice';

export class AudioManager {
    private static sounds: Record<string, { howl: Howl, type: SoundType }> = {};
    private static volumes: Record<SoundType, number> = {
        bgm: 0.5,
        sfx: 0.7,
        voice: 1.0
    };

    public static loadSound(name: string, path: string, type: SoundType, loop: boolean = false) {
        // Supprimer l'ancien son s'il existe pour éviter les doublons
        if (this.sounds[name]) {
            this.sounds[name].howl.unload();
        }

        this.sounds[name] = {
            howl: new Howl({
                src: [path],
                loop: loop,
                volume: this.volumes[type],
                html5: type === 'bgm', // Utiliser HTML5 Audio pour la musique longue
                preload: true
            }),
            type: type
        };
    }

    public static play(name: string) {
        const sound = this.sounds[name];
        if (sound) {
            // Pour les effets sonores (sfx), on arrête l'instance précédente 
            // pour éviter le chevauchement cacophonique si on spam
            if (sound.type === 'sfx') {
                sound.howl.stop(); 
            }
            sound.howl.play();
        }
    }

    public static stop(name: string) {
        if (this.sounds[name]) {
            this.sounds[name].howl.stop();
        }
    }

    public static pause(name: string) {
        if (this.sounds[name]) {
            this.sounds[name].howl.pause();
        }
    }

    public static resume(name: string) {
        if (this.sounds[name]) {
            this.sounds[name].howl.play();
        }
    }

    public static onceEnd(name: string, callback: () => void) {
        this.sounds[name]?.howl.once('end', callback);
    }

    public static isPlaying(name: string): boolean {
        return this.sounds[name]?.howl.playing() ?? false;
    }

    public static setLoop(name: string, loop: boolean) {
        this.sounds[name]?.howl.loop(loop);
    }

    public static setVolume(type: SoundType, volume: number) {
        this.volumes[type] = volume;
        for (const key in this.sounds) {
            if (this.sounds[key].type === type) {
                this.sounds[key].howl.volume(volume);
            }
        }
    }

    public static getVolume(type: SoundType): number {
        return this.volumes[type];
    }
}

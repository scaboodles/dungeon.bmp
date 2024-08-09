export class Mutex{
    private lock: Promise<void>;
    constructor(){
        this.lock = Promise.resolve();
    }

    async acquire(){
        let unlockNext: (value?:void) => void;
        const willLock = new Promise<void>((resolve) => unlockNext = resolve);
        const willUnlock = this.lock.then(() => unlockNext);
        this.lock = willLock;
        return willUnlock;
    }
}
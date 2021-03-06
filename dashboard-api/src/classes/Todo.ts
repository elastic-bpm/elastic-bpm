export class Todo {
    order: number;
    name: string;
    status: string;
    errorCode: string;
    startTime: Date;
    endTime: Date;

    constructor(name: string, order: number) {
        this.name = name;
        this.order = order;
        this.status = 'todo';
        this.startTime = null;
        this.endTime = null;
    }

    setBusy() {
        this.status = 'busy';
        this.startTime = new Date();
    }

    setDone() {
        this.status = 'done';
        this.endTime = new Date();
    }

    setError(errorCode: string) {
        this.status = 'error';
        this.errorCode = errorCode;
        this.endTime = new Date();
    }
}

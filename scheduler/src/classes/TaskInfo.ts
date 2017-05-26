export class TaskInfo {
    ready_to_start: string;
    constructor(public node: string, public created: string, public started: string, public finished: string) { }
}

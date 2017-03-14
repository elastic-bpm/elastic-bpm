import fetch from 'node-fetch';

class Workflow {
    nodes: string;
    edges: string;
    owner: string;
    name: string;
    id: string;
    created: string;
    status: string;
    todo_nodes: string[];
    busy_nodes: string[];
    done_nodes: string[];
}

class Task {
    constructor(public task_id: string, public task_status: string, public workflow_id: string) { }
}

function filterTaskIsHuman(task: Task): boolean {
    const taskInfo = task.task_id.split(':');
    return (taskInfo.length === 3 && (taskInfo[1] === 'HE' || taskInfo[1] === 'HH'));
}

function filterTaskIsWorker(task: Task): boolean {
    return !filterTaskIsHuman(task);
}

function filterTaskIsTodo(task: Task): boolean {
    return task.task_status === 'todo';
}

function filterTaskIsBusy(task: Task): boolean {
    return task.task_status === 'busy';
}

function filterTaskIsDone(task: Task): boolean {
    return task.task_status === 'done';
}

function getPreviousTaskIds(task: Task, edges_string: string): string[] {
    const previous_tasks: string[] = [];

    const edge_words = edges_string.split(',').map(w => w.trim());
    edge_words.forEach((word) => {
        const elements = word.split('->').map(w => w.trim());
        if (task.task_id === elements[1]) {
            previous_tasks.push(elements[0]);
        }
    });

    return previous_tasks;
};

function filterTaskIsFree(task: Task, workflow: Workflow): boolean {
    const previous_tasks: string[] = getPreviousTaskIds(task, workflow.edges);
    let taskIsFree = true;

    previous_tasks.forEach((t) => {
        if (workflow.done_nodes.indexOf(t) === -1) {
            taskIsFree = false;
        }
    });

    return taskIsFree;
}

export class TaskRepository {
    host = process.env.API || 'localhost';

    constructor() { }

    getTaskCount(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            this.getAllTasks()
                .then(tasks => resolve(tasks.length))
                .catch(error => reject(error));
        });
    }

    getAllWorkerTasks(): Promise<Task[]> {
        return new Promise<Task[]>((resolve, reject) => {
            this.getAllTasks()
                .then(tasks => resolve(tasks.filter(filterTaskIsWorker)))
                .catch(error => reject(error));
        });
    }

    getAllHumanTasks(): Promise<Task[]> {
        return new Promise<Task[]>((resolve, reject) => {
            this.getAllTasks()
                .then(tasks => resolve(tasks.filter(filterTaskIsHuman)))
                .catch(error => reject(error));
        });
    }

    getAllFreeWorkerTasks(): Promise<Task[]> {
        return new Promise<Task[]>((resolve, reject) => {
            this.getAllTasks(filterTaskIsFree)
                .then(tasks => resolve(tasks.filter(filterTaskIsWorker)))
                .catch(error => reject(error));
        });
    }

    getAllFreeHumanTasks(): Promise<Task[]> {
        return new Promise<Task[]>((resolve, reject) => {
            this.getAllTasks(filterTaskIsFree)
                .then(tasks => resolve(tasks.filter(filterTaskIsHuman)))
                .catch(error => reject(error));
        });
    }

    async flagTaskBusy(task: Task): Promise<Task> {
        try {
            return new Promise<Task>((resolve, reject) => {
                fetch('http://' + this.host + ':3000/workflows/' + task.workflow_id)
                    .then(res => res.json<Workflow>())
                    .then(workflow => {
                        workflow.todo_nodes = this.removeFromArray(workflow.todo_nodes, task.task_id);
                        workflow.busy_nodes.push(task.task_id);
                        task.task_status = 'busy';
                        console.log(JSON.stringify(workflow));
                        fetch('http://' + this.host + ':3000/workflows/' + task.workflow_id, {
                            method: 'patch',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(workflow)
                        })
                            .then(res => resolve(task))
                            .catch(err => reject(err));
                    })
                    .catch(err => reject(err));
            });
        } catch (err) {
            return new Promise<Task>((resolve, reject) => reject(err));
        }
    }

    getAndFlagFreeHumanTask(): Promise<Task> {
        return new Promise<Task>((resolve, reject) => {
            this.getAllTasks(filterTaskIsFree)
                .then(tasks => tasks.filter(filterTaskIsHuman))
                .then(tasks => tasks.filter(filterTaskIsTodo))
                .then(tasks => {
                    if (tasks.length === 0) {
                        reject('No task found');
                    } else {
                        return tasks;
                    }
                })
                .then(tasks => tasks[Math.floor(Math.random() * tasks.length)])
                .then(task => resolve(this.flagTaskBusy(task)))
                .catch(error => reject(error));
        });
    }

    getAndFlagFreeWorkerTask(): Promise<Task> {
        return new Promise<Task>((resolve, reject) => {
            this.getAllTasks(filterTaskIsFree)
                .then(tasks => tasks.filter(filterTaskIsWorker))
                .then(tasks => tasks.filter(filterTaskIsTodo))
                .then(tasks => {
                    if (tasks.length === 0) {
                        reject('No task found');
                    } else {
                        return tasks;
                    }
                })
                .then(tasks => tasks[Math.floor(Math.random() * tasks.length)])
                .then(task => resolve(this.flagTaskBusy(task)))
                .catch(error => reject(error));
        });
    }

    private removeFromArray(array: any[], item: any) {
        const index = array.indexOf(item);
        if (index > -1) {
            array.splice(index, 1);
        }
        return array;
    };

    private async getAllTasks(filter?: (t: Task, w: Workflow) => boolean): Promise<Task[]> {
        try {
            const tasks: Task[] = [];
            const workflows: Workflow[] = await this.getAllWorkflows();

            workflows.forEach((workflow) => {
                workflow.todo_nodes.forEach((node) => {
                    const newTask = new Task(node, 'todo', workflow.id);
                    if (filter === undefined || filter(newTask, workflow)) {
                        tasks.push(newTask);
                    }
                });
                workflow.busy_nodes.forEach((node) => {
                    const newTask = new Task(node, 'busy', workflow.id);
                    if (filter === undefined || filter(newTask, workflow)) {
                        tasks.push(newTask);
                    }
                });
                workflow.done_nodes.forEach((node) => {
                    const newTask = new Task(node, 'done', workflow.id);
                    if (filter === undefined || filter(newTask, workflow)) {
                        tasks.push(newTask);
                    }
                });
            });

            return new Promise<Task[]>(resolve => resolve(tasks));
        } catch (error) {
            return new Promise<Task[]>((resolve, reject) => reject(error));
        }
    }

    private getAllWorkflows(): Promise<Workflow[]> {
        return new Promise<Workflow[]>((resolve, reject) => {
            fetch('http://' + this.host + ':3000/workflows')
                .then(res => resolve(res.json<Workflow[]>()))
                .catch(err => reject(err));
        });
    }
}

import { Task } from '../../classes/Task';
import { Workflow } from '../../classes/Workflow';

export function filterTaskIsHuman(task: Task): boolean {
    const taskInfo = task.task_id.split(':');
    return (taskInfo.length === 3 && (taskInfo[1] === 'HE' || taskInfo[1] === 'HH'));
}

export function filterTaskIsWorker(task: Task): boolean {
    return !filterTaskIsHuman(task);
}

export function filterTaskIsTodo(task: Task): boolean {
    return task.task_status === 'todo';
}

export function filterTaskIsBusy(task: Task): boolean {
    return task.task_status === 'busy';
}

export function filterTaskIsDone(task: Task): boolean {
    return task.task_status === 'done';
}

export function getPreviousTaskIds(task: Task, edges_string: string): string[] {
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

export function filterTaskIsFree(task: Task, workflow: Workflow): boolean {
    if (task.task_status !== 'todo') {
        return false;
    }

    const previous_tasks: string[] = getPreviousTaskIds(task, workflow.edges);
    let taskIsFree = true;

    previous_tasks.forEach((t) => {
        if (workflow.done_nodes.indexOf(t) === -1) {
            taskIsFree = false;
        }
    });

    return taskIsFree;
}

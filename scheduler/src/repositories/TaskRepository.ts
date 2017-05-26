import fetch from 'node-fetch';
import * as moment from 'moment';

import { Task } from '../classes/Task';
import { Workflow } from '../classes/Workflow';
import {
    filterTaskIsHuman,
    filterTaskIsBusy,
    filterTaskIsDone,
    filterTaskIsFree,
    filterTaskIsTodo,
    filterTaskIsWorker
} from './filters/FilterFunctions';

export class TaskRepository {
    host = process.env.WORKFLOWS || 'localhost';

    constructor() { }

    getTaskCount(): Promise<number> {
        return new Promise<number>((resolve, reject) => {
            this.getAllTasks()
                .then(tasks => resolve(tasks.length))
                .catch(error => reject(error));
        });
    }

    getAllFreeTasks(): Promise<Task[]> {
        return new Promise<Task[]>((resolve, reject) => {
            this.getAllTasks(filterTaskIsFree)
                .then(tasks => resolve(tasks))
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
                        if (workflow.start_time === undefined) {
                            workflow.start_time = moment().toJSON();
                        }
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

    async flagTaskDone(task: Task): Promise<Task> {
        try {
            return new Promise<Task>((resolve, reject) => {
                fetch('http://' + this.host + ':3000/workflows/' + task.workflow_id)
                    .then(res => res.json<Workflow>())
                    .then(workflow => {
                        workflow.busy_nodes = this.removeFromArray(workflow.busy_nodes, task.task_id);
                        workflow.done_nodes.push(task.task_id);
                        task.task_status = 'done';
                        workflow.finish_time = moment().toJSON();
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

    async getAllTasks(filter?: (t: Task, w: Workflow) => boolean): Promise<Task[]> {
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

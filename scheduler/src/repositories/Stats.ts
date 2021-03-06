import * as moment from 'moment';

import { Task } from '../classes/Task';
import { TaskInfo } from '../classes/TaskInfo';
import { Workflow } from '../classes/Workflow';
import { TaskRepository } from './TaskRepository';

export class Stats {
    private startTimes: [string, string, string][] = [];
    private endTimes: [string, string, string][] = [];
    private defaultTimeout = 1000 * 60 * 5; // 5 minutes

    constructor() { }

    markTaskBusy(task: Task, workflow: Workflow, taskRepository: TaskRepository): Workflow {
        const now = moment().toJSON();
        if (workflow.started === undefined) {
            workflow.started = now;
        }
        this.startTimes.push([task.task_id, workflow.id, now]);
        console.log('stats:debug - task started ' + task.task_id + ' wf: ' + workflow.id + ' now: ' + now);

        setTimeout(() => this.checkTaskDone(task, workflow, taskRepository), this.defaultTimeout);
        return workflow;
    }

    markTaskDone(task: Task, workflow: Workflow): Workflow {
        const now = moment().toJSON();
        this.endTimes.push([task.task_id, workflow.id, now]);
        console.log('stats:debug - task finished ' + task.task_id + ' wf: ' + workflow.id + ' now: ' + now);

        if (workflow.todo_nodes.length === 0 && workflow.busy_nodes.length === 0) {
            workflow.finished = now;
            const filledWorkflow = this.fillStatsForWorkflow(workflow);
            console.log('stats:debug - workflow finished ' + JSON.stringify(filledWorkflow));
            return filledWorkflow;
        } else {
            return workflow;
        }
    }

    fillStatsForWorkflow(workflow: Workflow): Workflow {
        console.log('stats:debug - caclucating stats for workflow with ID ' + workflow.id);

        // All stats are in milliseconds
        workflow.makespan = moment(workflow.finished).diff(moment(workflow.started));
        workflow.wait_time = moment(workflow.started).diff(moment(workflow.created));
        workflow.response_time = workflow.makespan + workflow.wait_time;
        workflow.human_delay_time = this.getHumanDelay(workflow);
        workflow.human_time = this.getHumanTime(workflow);
        workflow.system_delay_time = this.getSystemDelay(workflow);
        workflow.system_time = this.getSystemTime(workflow);

        return workflow;
    };

    private checkTaskDone(task: Task, workflow: Workflow, taskRepository: TaskRepository): void {
        console.log('stats:debug - checking if task ' + task.task_id + ' is finished.');
        const finishTime = this.getFinishTime(task.task_id, workflow.id);
        if (finishTime === '') {
            console.log('stats:debug - NO! Setting task ' + task.task_id + ' back.');
            taskRepository.flagTaskTodo(task);
        } else {
            console.log('stats:debug - Yes! Task ' + task.task_id + ' is done.');
        }
    }

    private getInfoForWorkflow(workflow: Workflow): TaskInfo[] {
        const nodes_info: TaskInfo[] = [];
        const nodes = workflow.nodes.split(',').map((str) => str.trim());

        nodes.forEach((node) => {
            nodes_info.push(
                new TaskInfo(
                    node,
                    workflow.created,
                    this.getStartTime(node, workflow.id),
                    this.getFinishTime(node, workflow.id)
                )
            );
        });

        // Need to first fill the rest, before we can calculate the ready-time
        return this.fillReadyTime(nodes_info, workflow);
    };

    private getStartTime(node: string, workflowId: string): string {
        let startTime = '';
        this.startTimes.forEach(tuple => {
            if (tuple[0] === node && tuple[1] === workflowId) {
                startTime = tuple[2];
            }
        });

        if (startTime === '') {
            console.log('stats:debug - ERROR: startTime for ' + node + ' in wf ' + workflowId + ' not found!');
        }
        return startTime;
    }

    private getFinishTime(node: string, workflowId: string): string {
        let endTime = '';
        this.endTimes.forEach(tuple => {
            if (tuple[0] === node && tuple[1] === workflowId) {
                endTime = tuple[2];
            }
        });

        if (endTime === '') {
            console.log('stats:debug - ERROR: endTime for ' + node + ' in wf ' + workflowId + ' not found!');
        }
        return endTime;
    }

    private getPreviousTasks(node: string, edges_string: string): string[] {
        const previous_tasks: string[] = [];
        const edge_words = edges_string.split(',').map(w => w.trim());
        edge_words.forEach((word) => {
            const elements = word.split('->').map(w => w.trim());
            if (node === elements[1]) {
                previous_tasks.push(elements[0]);
            }
        });

        console.log('stats:debug - previous tasks for ' + node + ' are: ' + JSON.stringify(previous_tasks));
        return previous_tasks;
    }

    private fillReadyTime(nodes_info: TaskInfo[], workflow: Workflow) {
        nodes_info.forEach(node_info => {
            node_info.ready_to_start = workflow.created;
            const previous_tasks = this.getPreviousTasks(node_info.node, workflow.edges);
            previous_tasks.forEach(previous_task => {
                const prev_time = this.getFinishTime(previous_task, workflow.id);
                if (moment(prev_time).isAfter(moment(node_info.ready_to_start))) {
                    node_info.ready_to_start = prev_time;
                }
            });
        });

        return nodes_info;
    };

    private getHumanTime(workflow: Workflow): number {
        const nodes_info = this.getInfoForWorkflow(workflow);

        const human_nodes = nodes_info.filter(nodeInfo => this.isHumanNode(nodeInfo));
        let human_time = 0;
        human_nodes.forEach(nodeInfo => {
            human_time += moment(nodeInfo.finished).diff(nodeInfo.started);
        });

        return human_time;
    }

    private getSystemTime(workflow: Workflow): number {
        const nodes_info = this.getInfoForWorkflow(workflow);

        const system_nodes = nodes_info.filter(nodeInfo => !this.isHumanNode(nodeInfo));
        let system_time = 0;
        system_nodes.forEach(nodeInfo => {
            system_time += moment(nodeInfo.finished).diff(nodeInfo.started);
        });

        return system_time;
    }

    private getHumanDelay(workflow: Workflow): number {
        // This one is complex, we need a deep copy of nodes_info
        const nodes_info_orig = this.getInfoForWorkflow(workflow);
        let nodes_info: TaskInfo[] = JSON.parse(JSON.stringify(nodes_info_orig));

        // Now to correct all the wrongs... N-iterations should do it (probably only need LOG(N) if smart? - this works for me!)
        const times = nodes_info.length;
        for (let i = 0; i < times; i++) {
            nodes_info = this.fixTimingForCalculationHuman(nodes_info, workflow.edges);
        }

        // Then calculate the makespan for this scenario
        const first_task_started = this.getFirstTaskStarted(nodes_info);
        const last_task_finished = this.getLastTaskFinished(nodes_info);
        const new_makespan = moment(last_task_finished).diff(moment(first_task_started));
        console.log('stats:debug - getTimeHumansWaited = ' + (workflow.makespan - new_makespan)
            + ' makespan: ' + workflow.makespan + ', new makespan: ' + new_makespan);

        // Finally substract this new makespan from the real makespan and tada! human time
        return workflow.makespan - new_makespan;
    }

    private getSystemDelay(workflow: Workflow): number {
        // This one is complex, we need a deep copy of nodes_info
        const nodes_info_orig = this.getInfoForWorkflow(workflow);
        let nodes_info: TaskInfo[] = JSON.parse(JSON.stringify(nodes_info_orig));

        // Now to correct all the wrongs... N-iterations should do it (probably only need LOG(N) if smart? - this works for me!)
        const times = nodes_info.length;
        for (let i = 0; i < times; i++) {
            nodes_info = this.fixTimingForCalculationSystem(nodes_info, workflow.edges);
        }

        // Then calculate the makespan for this scenario
        const first_task_started = this.getFirstTaskStarted(nodes_info);
        const last_task_finished = this.getLastTaskFinished(nodes_info);
        const new_makespan = moment(last_task_finished).diff(moment(first_task_started));
        console.log('stats:debug - getTimeHumansWaited = ' + (workflow.makespan - new_makespan)
            + ' makespan: ' + workflow.makespan + ', new makespan: ' + new_makespan);

        // Finally substract this new makespan from the real makespan and tada! human time
        return workflow.makespan - new_makespan;
    }

    // Can be rewritten with LINQ-like firstOrDefault
    private getFinishedTimeFromList(task: string, nodes_info: TaskInfo[]) {
        let time = '';
        nodes_info.forEach(node => {
            if (node.node === task) {
                time = node.finished;
            }
        });

        console.log('stats:debug - finishedtimefromlist: ' + time);
        return moment(time);
    };

    private isHumanNode(taskInfo: TaskInfo): boolean {
        const elements = taskInfo.node.split(':');
        if (elements[1] === 'HH' || elements[1] === 'HE') {
            return true;
        } else {
            return false;
        }
    }

    private fixTimingForCalculationHuman(nodes_info: TaskInfo[], edges_string: string): TaskInfo[] {
        for (let i = 0; i < nodes_info.length; i++) {
            if (this.isHumanNode(nodes_info[i])) {
                const prev_tasks = this.getPreviousTasks(nodes_info[i].node, edges_string);
                const prev_finished_times = prev_tasks.map((task) => this.getFinishedTimeFromList(task, nodes_info));
                const last_prev_finished_time = moment.max(prev_finished_times);
                if (last_prev_finished_time.isBefore(moment(nodes_info[i].started))) {
                    const timeDiff = moment(nodes_info[i].started).diff(last_prev_finished_time);

                    nodes_info[i].started = last_prev_finished_time.toJSON();
                    nodes_info[i].finished = moment(nodes_info[i].finished).subtract(timeDiff, 'milliseconds').toJSON();
                }
            }
        };

        return nodes_info;
    }

    private fixTimingForCalculationSystem(nodes_info: TaskInfo[], edges_string: string): TaskInfo[] {
        for (let i = 0; i < nodes_info.length; i++) {
            if (!this.isHumanNode(nodes_info[i])) {
                const prev_tasks = this.getPreviousTasks(nodes_info[i].node, edges_string);
                const prev_finished_times = prev_tasks.map((task) => this.getFinishedTimeFromList(task, nodes_info));
                const last_prev_finished_time = moment.max(prev_finished_times);
                if (last_prev_finished_time.isBefore(moment(nodes_info[i].started))) {
                    const timeDiff = moment(nodes_info[i].started).diff(last_prev_finished_time);

                    nodes_info[i].started = last_prev_finished_time.toJSON();
                    nodes_info[i].finished = moment(nodes_info[i].finished).subtract(timeDiff, 'milliseconds').toJSON();
                }
            }
        };

        return nodes_info;
    }

    private getFirstTaskStarted(nodes_info: TaskInfo[]) {
        const start_moments = nodes_info.map((node) => moment(node.started));
        return moment.min(start_moments).toJSON();
    }

    private getLastTaskFinished(nodes_info: TaskInfo[]) {
        const end_moments = nodes_info.map((node) => moment(node.finished));
        return moment.max(end_moments).toJSON();
    }
}

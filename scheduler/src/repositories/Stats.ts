import * as moment from 'moment';

import { Task } from '../classes/Task';
import { TaskInfo } from '../classes/TaskInfo';
import { Workflow } from '../classes/Workflow';

export class Stats {
    private startTimes: [string, string, string][] = [];
    private endTimes: [string, string, string][] = [];

    constructor() { }

    markTaskBusy(task: Task, workflow: Workflow): Workflow {
        const now = moment().toJSON();
        if (workflow.started === undefined) {
            workflow.started = now;
        }
        this.startTimes.push([task.task_id, workflow.id, now]);
        return workflow;
    }

    markTaskDone(task: Task, workflow: Workflow): Workflow {
        const now = moment().toJSON();
        workflow.finished = now;
        this.endTimes.push([task.task_id, workflow.id, now]);
        return this.fillStatsForWorkflow(workflow);
    }

    fillStatsForWorkflow(workflow: Workflow): Workflow {
        // All stats are in milliseconds
        workflow.makespan = moment(workflow.finished).diff(moment(workflow.started));
        workflow.wait_time = moment(workflow.started).diff(moment(workflow.created));
        workflow.response_time = workflow.makespan + workflow.wait_time;
        workflow.human_time = this.getTimeHumansWaited(workflow);
        workflow.system_time = workflow.response_time - workflow.human_time;

        return workflow;
    };


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
                startTime = tuple[3];
            }
        });
        return startTime;
    }

    private getFinishTime(node: string, workflowId: string): string {
        let endTime = '';
        this.endTimes.forEach(tuple => {
            if (tuple[0] === node && tuple[1] === workflowId) {
                endTime = tuple[3];
            }
        });
        return endTime;
    }

    // STUB
    private getPreviousTasks(node: string, nodes: string): string[] {
        return [];
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

    private getTimeHumansWaited(workflow: Workflow): number {
        const nodes_info_orig = this.getInfoForWorkflow(workflow);

        // This one is complex, we need a deep copy of nodes_info
        const nodes_info: TaskInfo[] = JSON.parse(JSON.stringify(nodes_info_orig));

        // First - find the human tasks and set them all to 0 time!
        nodes_info.forEach(node => {
            const elements = node.node.split(':');
            if (elements[1] === 'HH' || elements[1] === 'HE') {
                node.started = node.ready_to_start;
                node.finished = node.ready_to_start;
            }
        });

        // Now to correct all the wrongs... N-iterations should do it (probably only need LOG(N) if smart? - this works for me!)
        for (let i = 0; i < nodes_info.length; i++) {
            this.fixTimingForCalculation(nodes_info, workflow.edges);
        }

        // Then calculate the makespan for this scenario
        const first_task_started = this.getFirstTaskStarted(nodes_info);
        const last_task_finished = this.getLastTaskFinished(nodes_info);
        const new_makespan = moment(last_task_finished).diff(moment(first_task_started));

        // Finally substract this new makespan from the real makespan and tada! human time
        return workflow.makespan - new_makespan;
    }

    // STUB
    private fixTimingForCalculation(nodes_info: TaskInfo[], edges: string) {
        return;
    }

    // STUB
    private getFirstTaskStarted(nodes_info: TaskInfo[]) {
        return '';
    }

    // STUB
    private getLastTaskFinished(nodes_info: TaskInfo[]) {
        return '';
    }
}

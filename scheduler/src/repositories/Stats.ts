import * as moment from 'moment';

import { Task } from '../classes/Task';
import { TaskInfo } from '../classes/TaskInfo';
import { Workflow } from '../classes/Workflow';

export class Stats {
    constructor() { }

    markTaskBusy(task: Task, workflow: Workflow): Workflow {
        if (workflow.started === undefined) {
            workflow.started = moment().toJSON();
        }
        return workflow;
    }

    markTaskDone(task: Task, workflow: Workflow): Workflow {
        workflow.finished = moment().toJSON();
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

    // STUB
    private getStartTime(node: string, workflowId: string): string {
        return moment().toJSON();
    }

    // STUB
    private getFinishTime(node: string, workflowId: string): string {
        return moment().toJSON();
    }

    // STUB
    private fillReadyTime(taskInfo: TaskInfo[], workflow: Workflow): TaskInfo[] {
        return taskInfo;
    }

    // STUB
    private getTimeHumansWaited(workflow: Workflow): number {
        const nodes_info = this.getInfoForWorkflow(workflow);

        return 0;
    }
}

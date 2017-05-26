import * as moment from 'moment';

import { Task } from '../classes/Task';
import { Workflow } from '../classes/Workflow';

export class Stats {
    constructor() { }

    markTaskBusy(task: Task, workflow: Workflow): Workflow {
        if (workflow.start_time === undefined) {
            workflow.start_time = moment().toJSON();
        }
        return workflow;
    }

    markTaskDone(task: Task, workflow: Workflow): Workflow {
        workflow.finish_time = moment().toJSON();
        return workflow;
    }
}

export class Workflow {
    nodes: string;
    edges: string;
    owner: string;
    name: string;
    id: string;
    created: string;
    status: string;
    started: string;
    finished: string;

    makespan: number;
    wait_time: number;
    response_time: number;
    human_time: number;
    human_delay_time: number;
    system_time: number;
    system_delay_time: number;

    todo_nodes: string[];
    busy_nodes: string[];
    done_nodes: string[];
}

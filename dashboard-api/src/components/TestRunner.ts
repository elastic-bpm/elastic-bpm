import { Scheduler } from '../components/scheduler';
import { Docker } from '../components/docker';
import { Todo } from '../classes/Todo';

export class TestRunner {
    private running: Todo[];
    constructor(
        private scheduler: Scheduler,
        private docker: Docker) { }

    getRunning(): Promise<Todo[]> {
        return new Promise<Todo[]>(resolve => resolve(this.running));
    }

    private resetRunning(policy: string, target: number) {
        this.running = [
            new Todo('Set policy to ' + policy, 0),
            new Todo('Wait for machines to scale to ' + target, 1),
            new Todo('Wait for ' + target + ' nodes to be ready', 2),
            new Todo('Reset workers', 3),
            new Todo('Scale workers', 4),
            new Todo('Start humans', 5),
            new Todo('Upload workflow', 6),
            new Todo('Wait for humans finished', 7),
            new Todo('Reset workers', 8),
            new Todo('Delete all workflows', 9),
            new Todo('Set policy to Off', 10),
        ];
    }

    private async waitForMachines(amount: number): Promise<number> {
        const info = await this.scheduler.get_info();
        const activeMachines = info.machines.active;
        if (activeMachines === amount) {
            return new Promise<number>(resolve => resolve(activeMachines));
        } else {
            return new Promise<number>(resolve => {
                setTimeout(() => {
                    resolve(this.waitForMachines(amount));
                }, 5000);
            });
        }
    }

    private async waitForNodes(amount: number): Promise<number> {
        const info = await this.scheduler.get_info();
        const activeNodes = info.machines.nodes;
        if (activeNodes === amount) {
            return new Promise<number>(resolve => resolve(activeNodes));
        } else {
            return new Promise<number>(resolve => {
                setTimeout(() => {
                    resolve(this.waitForNodes(amount));
                }, 5000);
            });
        }
    }

    private async resetWorkers(): Promise<boolean> {
        try {
            await this.docker.delete_workers();
            await this.docker.create_workers();
            return new Promise<boolean>(resolve => resolve(true));
        } catch (error) {
            return new Promise<boolean>((resolve, reject) => reject(error));
        }
    }

    private async startExecution(policy: string, target: number) {
        try {
            // Set Policy
            this.running[0].setBusy();
            const newPolicy = await this.scheduler.set_policy({ policy: policy });
            if (newPolicy !== policy) {
                this.running[0].setError();
                throw new Error('Policy mismatch!');
            }
            this.running[0].setDone();

            // Wait for machines
            this.running[1].setBusy();
            const amountOfMachines = await this.waitForMachines(target);
            if (amountOfMachines !== target) {
                this.running[1].setError();
                throw new Error('Amount of machines mismatch!');
            }
            this.running[1].setDone();

            // Wait for nodes
            this.running[2].setBusy();
            const amountOfNodes = await this.waitForNodes(target);
            if (amountOfNodes !== target) {
                this.running[2].setError();
                throw new Error('Amount of nodes mismatch!');
            }
            this.running[2].setDone();

            // Reset workers
            this.running[3].setBusy();
            const workersReset = await this.resetWorkers();
            if (!workersReset) {
                this.running[3].setError();
                throw new Error('Workers not reset!');
            }
            this.running[3].setDone();


        } catch (error) {
            console.log(error);
        }
    }

    async runTest(body: any): Promise<any> {
        const policy = body.policy;
        const info = await this.scheduler.get_info();
        const target = info.amount[policy];
        this.resetRunning(policy, target);
        setTimeout(() => this.startExecution(policy, target), 2000);

        return new Promise<any>(resolve => resolve(body));
    }
}

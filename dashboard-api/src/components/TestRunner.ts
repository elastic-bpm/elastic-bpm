import { Scheduler } from '../components/scheduler';
import { Docker } from '../components/docker';
import { Human } from '../components/human';
import { Workflows } from '../components/workflows';

import { Todo } from '../classes/Todo';
import { DelayedWorkflow } from '../classes/DelayedWorkflow';

export class TestRunner {
    private running: Todo[];
    constructor(
        private scheduler: Scheduler,
        private docker: Docker,
        private human: Human,
        private workflows: Workflows) { }

    getRunning(): Promise<Todo[]> {
        return new Promise<Todo[]>(resolve => resolve(this.running));
    }

    testDone(): Promise<string> {
        if (this.running.length > 0 &&
            this.running.filter(todo => todo.order === 8)[0].endTime != null) {
            return new Promise<string>(resolve => resolve('Ok'));
        } else {
            return new Promise<string>((resolve, reject) => reject('Not done yet'));
        }
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
            new Todo('Set policy to Off', 8),
        ];
    }

    private async sleep(seconds: number): Promise<number> {
        return new Promise<number>(resolve => {
            setTimeout(() => { resolve(seconds); }, seconds * 1000);
        });
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

    private async waitForHumans(): Promise<boolean> {
        const info = await this.human.get_info();
        console.log(info);
        return new Promise<boolean>(resolve => {
            setTimeout(() => {
                resolve(true);
            }, info.totalTime); // TODO: Can improve this to take startTime into account
        });
    }

    private async startExecution(policy: string) {
        const policyParams = {
            Static: 15,
            OnDemand: 15,
            Learning: 15
        };
        await this.scheduler.set_amount({ policy: 'Static', amount: policyParams.Static });
        await this.scheduler.set_amount({ policy: 'Learning', amount: policyParams.Learning });
        await this.scheduler.set_amount({ policy: 'OnDemand', amount: policyParams.OnDemand });

        await this.sleep(5);
        const policyInfo = await this.scheduler.get_info();
        const target = policyInfo.amount[policy];
        this.resetRunning(policy, target);

        const humanParams = {
            on: 2,
            off: 2,
            init: 1,
            total: 5,
            amount: 5
        };

        // const delayedWorkflows = [
        //     {
        //         'nodes': 'A:CC:S, B:CN:M, C:CI:M, D:CC:L',
        //         'edges': 'A:CC:S -> B:CN:M, A:CC:S -> C:CI:M, B:CN:M -> D:CC:L, C:CI:M -> D:CC:L',
        //         'name': 'TestFlow1',
        //         'owner': 'johannes',
        //         'delay': 0
        //     },
        //     {
        //         'nodes': 'A:CC:S, B:CN:M, C:CI:M, D:CC:L',
        //         'edges': 'A:CC:S -> B:CN:M, A:CC:S -> C:CI:M, B:CN:M -> D:CC:L, C:CI:M -> D:CC:L',
        //         'name': 'TestFlow2',
        //         'owner': 'johannes',
        //         'delay': 10000
        //     }
        // ];
        const delayedWorkflows = require('../workflows/wf1.json');

        try {
            // Set Policy
            this.running[0].setBusy();
            const newPolicy = await this.scheduler.set_policy({ policy: policy });
            if (newPolicy !== policy) {
                this.running[0].setError('Policy mismatch!');
                throw new Error('Policy mismatch!');
            }
            await this.sleep(5);
            this.running[0].setDone();

            // Wait for machines
            this.running[1].setBusy();
            const amountOfMachines = await this.waitForMachines(target);
            if (amountOfMachines !== target) {
                this.running[1].setError('Amount of machines mismatch!');
                throw new Error('Amount of machines mismatch!');
            }
            await this.sleep(5);
            this.running[1].setDone();

            // Wait for nodes
            this.running[2].setBusy();
            const amountOfNodes = await this.waitForNodes(target);
            if (amountOfNodes !== target) {
                this.running[2].setError('Amount of nodes mismatch!');
                throw new Error('Amount of nodes mismatch!');
            }
            await this.sleep(5);
            this.running[2].setDone();

            // Reset workers
            this.running[3].setBusy();
            try {
                await this.docker.delete_workers();
            } catch (workersDeleteError) {
                // Not deleting the workers is not an error
            }

            try {
                await this.docker.create_workers();
            } catch (workersResetError) {
                this.running[3].setError('Workers not created!');
                throw new Error('Workers not created!');
            }
            await this.sleep(5);
            this.running[3].setDone();

            // TODO: Scale workers
            this.running[4].setBusy();
            await this.sleep(5);
            this.running[4].setDone();

            // Start humans
            this.running[5].setBusy();
            try {
                const info = await this.human.start_humans(humanParams);
                if (info !== 'ok') {
                    this.running[5].setError('Humans not started! Error: ' + info);
                    throw new Error('Humans not started! Error: ' + info);
                }
            } catch (startHumanError) {
                this.running[5].setError('Humans not started!');
                throw new Error('Humans not started!');
            }
            await this.sleep(5);
            this.running[5].setDone();

            // TODO: Upload workflow file
            this.running[6].setBusy();
            try {
                const uploadWorkflowResult = await this.workflows.post_multiple_workflows(delayedWorkflows);
                if (uploadWorkflowResult !== 'ok') {
                    this.running[6].setError('Workflows not created! ' + uploadWorkflowResult);
                    throw new Error('Workflows not created!' + uploadWorkflowResult);
                }
            } catch (uploadWorkflowError) {
                this.running[6].setError('Workflows not created! ' + uploadWorkflowError);
                throw new Error('Workflows not created!' + uploadWorkflowError);
            }
            await this.sleep(5);
            this.running[6].setDone();

            // Wait for humans finished
            this.running[7].setBusy();
            const humansFinished = await this.waitForHumans();
            if (!humansFinished) {
                this.running[7].setError('Humans not finished!');
                throw new Error('Humans not finished!');
            }
            await this.sleep(5);
            this.running[7].setDone();

            // Set policy to Off
            this.running[8].setBusy();
            const offPolicy = await this.scheduler.set_policy({ policy: 'Off' });
            if (offPolicy !== 'Off') {
                this.running[8].setError('Policy not set to Off!');
                throw new Error('Policy not set to Off!');
            }
            await this.sleep(5);
            this.running[8].setDone();

        } catch (error) {
            console.log(error);
        }
    }

    async runTest(body: any): Promise<any> {
        const policy = body.policy;
        setTimeout(() => this.startExecution(policy), 2000);

        return new Promise<any>(resolve => resolve(body));
    }
}

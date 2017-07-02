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

    private async startExecution(
        policy: string,
        humanParams: any,
        policyParams: any,
        workers: number = 4,
        lowerBound: number = 0.3,
        upperBound: number = 0.8,
        workload: string = '../workflows/50wfs.json') {

        await this.scheduler.set_amount({ policy: 'Static', amount: policyParams.Static });
        await this.scheduler.set_amount({ policy: 'Learning', amount: policyParams.Learning });
        await this.scheduler.set_amount({ policy: 'OnDemand', amount: policyParams.OnDemand });

        console.log('scheduler:debug lowerBound: ' + lowerBound + ' upperBound: ' + upperBound);
        await this.scheduler.set_bounds({ lowerBound: lowerBound, upperBound: upperBound });

        await this.sleep(5);
        const policyInfo = await this.scheduler.get_info();
        const target = policyInfo.amount[policy];
        this.resetRunning(policy, target);

        const delayedWorkflows = require(workload);

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
            // const amountOfMachines = await this.waitForMachines(target);
            // if (amountOfMachines !== target) {
            //     this.running[1].setError('Amount of machines mismatch!');
            //     throw new Error('Amount of machines mismatch!');
            // }
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
                await this.docker.create_workers(workers);
            } catch (workersResetError) {
                this.running[3].setError('Workers not created!');
                throw new Error('Workers not created!');
            }
            await this.sleep(5);
            this.running[3].setDone();

            // Done during previous step
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
        const run = body.run || 'test';

        // Quick test
        // const humanParams = {
        //     on: 2,
        //     off: 2,
        //     init: 1,
        //     total: 5,
        //     amount: 5
        // };

        const schedule_i = {
            on: 41,
            off: 0,
            init: 0,
            total: 41,
            amount: 2
        };

        const schedule_ii = {
            on: 9,
            off: 15,
            init: 8,
            total: 41,
            amount: 6
        };

        switch (run) {
            case 'a':
                {
                    // For test 'a', we have 10 nodes
                    const policyParams = {
                        Static: 10,
                        OnDemand: 10,
                        Learning: 10
                    };

                    // Static policy
                    const policy = 'Static';

                    // Variable workers [1 through 8]
                    const workers = body.workers;
                    setTimeout(() => this.startExecution(policy, schedule_i, policyParams, workers), 2000);
                    break;
                }
            case 'b':
                {
                    // For test 'b', we have a variable amount of nodes
                    const policyParams = {
                        Static: body.nodes,
                        OnDemand: 10,
                        Learning: 10
                    };

                    // Static policy
                    const policy = 'Static';

                    const workers = body.workers;
                    setTimeout(() => this.startExecution(policy, schedule_i, policyParams, workers), 2000);
                    break;
                }
            case 'c':
                {
                    // only the workload is variable for test 'c'
                    const policyParams = {
                        Static: body.nodes,
                        OnDemand: 10,
                        Learning: 10
                    };

                    // Static policy
                    const policy = 'Static';

                    let workload = '../workflows/50wfs.json';
                    if (body.workload === 2) {
                        workload = '../workflows/100wfs.json';
                    }

                    const workers = body.workers;
                    setTimeout(() => this.startExecution(policy, schedule_i, policyParams, workers, 0, 0, workload), 2000);
                    break;
                }
            case 'd':
            case 'e':
                {
                    const policyParams = {
                        Static: 10,
                        OnDemand: body.nodes,
                        Learning: body.nodes
                    };

                    // Policy is either OnDemand or Learning
                    const policy = body.policy;

                    const workers = body.workers;
                    const lowerBound = body.lowerBound;
                    const upperBound = body.upperBound;

                    setTimeout(() => this.startExecution(policy, schedule_i, policyParams, workers, lowerBound, upperBound), 2000);
                    break;
                }
            case 'f':
                {
                    const policyParams = {
                        Static: 10,
                        OnDemand: body.nodes,
                        Learning: body.nodes
                    };

                    const policy = body.policy;
                    const workers = body.workers;

                    const lowerBound = body.lowerBound;
                    const upperBound = body.upperBound;

                    schedule_i.amount = body.humans;

                    setTimeout(() => this.startExecution(policy, schedule_i, policyParams, workers, lowerBound, upperBound), 2000);
                    break;
                }
            case 'g':
                {
                    const policyParams = {
                        Static: 10,
                        OnDemand: 2,
                        Learning: 2
                    };

                    const policy = body.policy;
                    const workers = body.workers;

                    const lowerBound = body.lowerBound;
                    const upperBound = body.upperBound;

                    schedule_i.amount = body.humans / 3;
                    schedule_ii.amount = body.humans;

                    if (body.schedule === 1) {
                        setTimeout(() => this.startExecution(policy, schedule_i, policyParams, workers, lowerBound, upperBound), 2000);
                    } else {
                        setTimeout(() => this.startExecution(policy, schedule_ii, policyParams, workers, lowerBound, upperBound), 2000);
                    }
                    break;
                }
            default:
                {
                    const policyParams = {
                        Static: 15,
                        OnDemand: 15,
                        Learning: 15
                    };
                    const policy = body.policy;
                    setTimeout(() => this.startExecution(policy, schedule_ii, policyParams), 2000);
                    break;
                }
        }

        return new Promise<any>(resolve => resolve(body));
    }
}

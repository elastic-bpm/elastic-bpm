import * as moment from 'moment';

import { VirtualMachine } from '../classes/VirtualMachine';
import { Node } from '../classes/Node';
import { Todo } from '../classes/Todo';

import { MachineManager } from './machines/MachineManager';
import { NodeManager } from './nodes/NodeManager';
import { TaskRepository } from '../repositories/TaskRepository';

export class ResourceManager {
    private amount: any = {};
    private history: any = { Target: [], Active: [], Nodes: [] };
    private machineManager: MachineManager;
    private nodeManager: NodeManager;
    private taskRepository: TaskRepository;
    private justStarted: Map<string, string> = new Map<string, string>();
    private addedNewMachines = false;
    private upperBound = 1;
    private lowerBound = 0.5;


    constructor(private policy: string,
        staticAmount: number,
        onDemandAmount: number,
        learningAmount: number,
        private intervalAmount: number
    ) {
        this.amount['Off'] = 0;
        this.amount['Static'] = staticAmount;
        this.amount['OnDemand'] = onDemandAmount;
        this.amount['Learning'] = learningAmount;
        this.machineManager = new MachineManager();
        this.nodeManager = new NodeManager();
        this.taskRepository = new TaskRepository();

        this.checkResources(intervalAmount);
    }

    getPolicy(): Promise<string> {
        return new Promise<string>(resolve => resolve(this.policy));
    }

    setPolicy(newPolicy: string): Promise<string> {
        this.policy = newPolicy;
        return this.getPolicy();
    }

    setBounds(upperBound: number, lowerBound: number): Promise<string> {
        this.upperBound = upperBound;
        this.lowerBound = lowerBound;
        return new Promise<string>(resolve => resolve('ok'));
    }

    getAmount(): Promise<any> {
        return new Promise<any>(resolve => resolve({
            static: this.amount['Static'],
            on_demand: this.amount['OnDemand'],
            learning: this.amount['Learning']
        }));
    }

    setAmount(policy: string, amount: number): Promise<any> {
        this.amount[policy] = amount;
        return this.getAmount();
    }

    async getInfo(): Promise<any> {
        const activeMachines = await this.machineManager.getActiveMachineCount();
        const activeNodes = await this.nodeManager.getActiveNodeCount();
        return new Promise<any>(resolve => resolve({
            amount: {
                Off: 0,
                Static: this.amount['Static'],
                OnDemand: this.amount['OnDemand'],
                Learning: this.amount['Learning']
            },
            machines: {
                active: activeMachines,
                nodes: activeNodes
            },
            policy: this.policy,
            history: [
                {
                    name: 'Target',
                    series: this.history.Target
                },
                {
                    name: 'Active',
                    series: this.history.Active
                },
                {
                    name: 'Nodes',
                    series: this.history.Nodes
                }
            ]
        }));
    }

    private addToHistory(target: number, amount: any) {
        let newItem = false;
        if (this.history.Target.length === 0) {
            newItem = true;
        } else {
            const lastTarget = this.history.Target[this.history['Target'].length - 1];
            const lastActive = this.history.Active[this.history['Active'].length - 1];
            const lastNodes = this.history.Nodes[this.history['Nodes'].length - 1];
            if (lastTarget.value !== target ||
                lastActive.value !== amount['active'] ||
                lastNodes.value !== amount['nodes'] ||
                moment(lastTarget.name).isBefore(moment().subtract(1, 'minute'))) {
                newItem = true;
            }
        }

        if (newItem) {
            const theDate = new Date();
            this.history.Target.push({ name: theDate, value: target });
            this.history.Active.push({ name: theDate, value: amount['active'] });
            this.history.Nodes.push({ name: theDate, value: amount['nodes'] });
            console.log('New history');
        }
    }

    private async checkResources(interval: number) {
        // Lets check amount of running machines
        try {
            const activeMachineCount = await this.machineManager.getActiveMachineCount();
            const activeNodeCount = await this.nodeManager.getActiveNodeCount();
            let desiredAmount = 0;

            switch (this.policy) {
                case 'Static':
                    {
                        desiredAmount = this.amount[this.policy];
                        if (activeNodeCount !== desiredAmount) {
                            console.log(`Setting active nodes to ${desiredAmount}, currently ${activeNodeCount}`);
                            await this.nodeManager.setNodeAmount(desiredAmount);
                        }
                    }
                    break;
                case 'OnDemand':
                    {
                        const virtualMachines = await this.machineManager.getMachines();
                        const activeNodes = (await this.nodeManager.getNodes())
                            .filter(node => node.availability === 'active' && node.status === 'ready')
                            .map(node => node.hostname);
                        const activeMachines = virtualMachines.filter(machine => {
                            return machine.powerState === 'VM running' && activeNodes.indexOf(machine.name) > -1;
                        });
                        console.log('Current active machines: ' + JSON.stringify(activeMachines.map(machine => machine.name)));


                        if (activeMachines.length < this.amount[this.policy]) {
                            // Start out with 0 machines
                            const difference = this.amount[this.policy] - activeMachines.length;
                            for (let i = 0; i < difference; i++) {
                                const addedNode = await this.nodeManager.addNode();

                                console.log('scheduler:debug Adding node ' + addedNode + ' for start');
                                this.justStarted.set('start' + i, addedNode);

                                setTimeout(() => { this.justStarted.delete('start' + i); }, 5 * 60 * 1000);
                            }
                        } else {

                            const toActivateFor: string[] = [];
                            const toDeactivate: string[] = [];

                            // After check machine load
                            for (let i = 0; i < activeMachines.length; i++) {
                                console.log('scheduler:debug Node ' + activeMachines[i].name + ' has load: ' + activeMachines[i].load5);
                                if (activeMachines[i].load5 >= this.upperBound && !this.justStarted.has(activeMachines[i].name)) {
                                    // Add new machine for this one
                                    toActivateFor.push(activeMachines[i].name);
                                } else if (activeMachines[i].load5 > this.lowerBound) {
                                    // Do nothing, it can live
                                } else if (activeMachines.length) {
                                    // Only scale down if machines able to scale down

                                    // Check if started by other load
                                    console.log('scheduler:debug Checking if node ' + activeMachines[i].name + ' is started recently');
                                    let isStarted = false;
                                    this.justStarted.forEach((v, k) => {
                                        if (v === activeMachines[i].name) {
                                            isStarted = true;
                                        }
                                    });

                                    if (!isStarted) {
                                        console.log('scheduler:debug Node ' + activeMachines[i].name + ' is NOT started, shutting down');
                                        toDeactivate.push(activeMachines[i].name);
                                    } else {
                                        console.log('scheduler:debug Node ' + activeMachines[i].name + ' is started recently, ignoring');
                                    }
                                }
                            };

                            const amountToActivate = toActivateFor.length - toDeactivate.length;
                            if (amountToActivate > 0) {
                                for (let i = 0; i < amountToActivate; i++) {
                                    const addedNode = await this.nodeManager.addNode();
                                    console.log('scheduler:debug Adding node ' + addedNode + ' for node ' + toActivateFor[i]);
                                    this.justStarted.set(toActivateFor[i], addedNode);

                                    // Calling setTimeout in for-loops: https://stackoverflow.com/a/5226335/1086634
                                    (function (justStarted, index) {
                                        setTimeout(() => { justStarted.delete(toActivateFor[index]); }, 5 * 60 * 1000);
                                    })(this.justStarted, i);
                                }
                            } else if (amountToActivate < 0) {
                                let amountToDeactivate = toDeactivate.length - toActivateFor.length;
                                if (activeMachines.length - amountToDeactivate < this.amount[this.policy]) {
                                    amountToDeactivate = activeMachines.length - this.amount[this.policy];
                                }

                                for (let i = 0; i < amountToDeactivate; i++) {
                                    this.nodeManager.shutdownNode(toDeactivate[i]);
                                }
                            }

                        }
                    }
                    break;
                case 'Learning':
                    {
                        const virtualMachines = await this.machineManager.getMachines();
                        const activeNodes = (await this.nodeManager.getNodes())
                            .filter(node => node.availability === 'active' && node.status === 'ready')
                            .map(node => node.hostname);
                        const activeMachines = virtualMachines.filter(machine => {
                            return machine.powerState === 'VM running' && activeNodes.indexOf(machine.name) > -1;
                        });
                        console.log('Current active machines: ' + JSON.stringify(activeMachines.map(machine => machine.name)));

                        if (activeMachines.length < this.amount[this.policy]) {
                            // Start out with 0 machines
                            const difference = this.amount[this.policy] - activeMachines.length;
                            for (let i = 0; i < difference; i++) {
                                const addedNode = await this.nodeManager.addNode();

                                console.log('scheduler:debug Adding node ' + addedNode + ' for start');
                                this.justStarted.set('start' + i, addedNode);

                                setTimeout(() => { this.justStarted.delete('start' + i); }, 5 * 60 * 1000);
                            }
                        } else {
                            // Get all tasks
                            const todoWorkerTasks = await this.taskRepository.getAllTodoWorkerTasks();
                            const todoWorkerTasksCount = todoWorkerTasks.length;

                            const busyWorkerTasks = await this.taskRepository.getAllFreeWorkerTasks();
                            const busyWorkerTasksCount = busyWorkerTasks.length;

                            // Find out what fraction can be started
                            const fraction: number = busyWorkerTasksCount / todoWorkerTasksCount;
                            console.log('scheduler:debug ' +
                                ' Tasks todo: ' + todoWorkerTasksCount +
                                ', busy: ' + busyWorkerTasksCount +
                                ', fraction: ' + fraction);

                            // Only scale if nothing has been started recently
                            if (!this.justStarted.has('start')) {

                                // Scale up if amount of tasks to start > fraction
                                if (fraction > this.upperBound) {
                                    const addedNode = await this.nodeManager.addNode();

                                    console.log('scheduler:debug Adding node ' + addedNode + ' because fraction is too high');
                                    this.justStarted.set('start', addedNode);

                                    setTimeout(() => { this.justStarted.delete('start'); }, 5 * 60 * 1000);
                                }

                                // Scale down if fraction is too low and we above the minimum threshold
                                if (fraction < this.lowerBound && activeMachines.length > this.amount[this.policy]) {
                                    // Scale down the least busy machine
                                    let minLoad = 100;
                                    let hostname = '';
                                    for (let i = 0; i < activeMachines.length; i++) {
                                        console.log('scheduler:debug ' +
                                            'Node ' + activeMachines[i].name +
                                            ', has load: ' + activeMachines[i].load5);

                                        if (activeMachines[i].load5 < minLoad) {
                                            minLoad = activeMachines[i].load5;
                                            hostname = activeMachines[i].name;
                                        }
                                    }

                                    // Found it
                                    console.log('scheduler:debug'
                                        + ' Shutting down machine ' + hostname
                                        + ' fraction: ' + fraction
                                        + ' running machines: ' + activeMachines.length);
                                    this.nodeManager.shutdownNode(hostname);
                                }
                            }
                        }
                    }
                    break;
                default:
                case 'Off':
                    {
                        // No changes to desiredAmount
                        if (activeNodeCount !== desiredAmount) {
                            console.log(`Setting active nodes to ${desiredAmount}, currently ${activeNodeCount}`);
                            await this.nodeManager.setNodeAmount(desiredAmount);
                        }
                    }
                    break;
            }

            this.addToHistory(desiredAmount, { active: activeMachineCount, nodes: activeNodeCount });
            console.log(`Policy set to ${this.policy}. (${activeMachineCount} of ${desiredAmount} machines active)`);
            console.log('scheduler:info ' + JSON.stringify({
                active_machines: activeMachineCount,
                active_nodes: activeNodeCount,
                target_nodes: desiredAmount
            }));


        } catch (err) {
            console.log('Error in checkResources: ' + err);
        } finally {
            setTimeout(() => this.checkResources(interval), interval);
        }
    }
}

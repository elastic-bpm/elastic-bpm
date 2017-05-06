import fetch from 'node-fetch';
import * as moment from 'moment';
import { VirtualMachine } from '../classes/VirtualMachine';
import { Node } from '../classes/Node';
import { Todo } from '../classes/Todo';
import { MachineManager } from './machines/MachineManager';
import { NodeManager } from './nodes/NodeManager';

export class ResourceManager {
    private amount: any = {};
    private history: any = { Target: [], Active: [], Nodes: [] };
    private machineManager: MachineManager;
    private nodeManager: NodeManager;

    constructor(private policy: string,
        staticAmount: number,
        onDemandAmount: number,
        learningAmount: number,
        private intervalAmount: number) {
        this.amount['Off'] = 0;
        this.amount['Static'] = staticAmount;
        this.amount['OnDemand'] = onDemandAmount;
        this.amount['Learning'] = learningAmount;
        this.machineManager = new MachineManager();
        this.nodeManager = new NodeManager();

        this.checkResources(intervalAmount);
    }

    getPolicy(): Promise<string> {
        return new Promise<string>(resolve => resolve(this.policy));
    }

    setPolicy(newPolicy: string): Promise<string> {
        this.policy = newPolicy;
        return this.getPolicy();
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
            const activeNodes = await this.nodeManager.getActiveNodeCount();
            const desiredAmount = this.amount[this.policy];
            this.addToHistory(desiredAmount, { active: activeMachineCount, nodes: activeNodes });

            console.log(`Policy set to ${this.policy}. (${activeMachineCount} of ${desiredAmount} machines active)`);
            
            // if (activeMachineCount !== desiredAmount) {
            //     this.machineManager.scaleTo(desiredAmount);
            // } 

            // TODO: Scale amount of nodes, or do this in the policy??

            switch (this.policy) {
                case 'Static':
                    break;
                case 'OnDemand':
                    break;
                case 'Learning':
                    break;
                default:
                case 'Off':
                    break;
            }

        } catch (err) {
            console.log('Error in checkResources: ' + err);
        } finally {
            setTimeout(() => this.checkResources(interval), interval);
        }
    }
}

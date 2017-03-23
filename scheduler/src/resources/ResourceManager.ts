import fetch from 'node-fetch';
import * as moment from 'moment';
import { VirtualMachine } from '../classes/VirtualMachine';
import { Node } from '../classes/Node';
import { Todo } from '../classes/Todo';

export class ResourceManager {
    private scaling_host: number = process.env.SCALING || 'localhost';
    private docker_host: number = process.env.DOCKER || 'localhost';
    private amount: any = {};
    private history: any = { Target: [], Active: [], Nodes: [] };

    constructor(private policy: string,
        staticAmount: number,
        onDemandAmount: number,
        learningAmount: number,
        private intervalAmount: number) {
        this.amount['Off'] = 0;
        this.amount['Static'] = staticAmount;
        this.amount['OnDemand'] = onDemandAmount;
        this.amount['Learning'] = learningAmount;
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
        const activeMachines = await this.getActiveMachineCount();
        const activeNodes = await this.getActiveNodeCount();
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

    private async scaleTo(desiredAmount: number) {
        const allMachines = await this.getMachines();
        if (desiredAmount === 0) {

            console.log('Shutting down all running machines.');
            allMachines.forEach(machine => {
                this.shutdownMachine(machine);
            });

        } else {

            const machinesToActivate = allMachines.slice(0, desiredAmount);
            machinesToActivate.forEach(machine => {
                this.startMachine(machine);
            });

            const machinesToShutdown = allMachines.slice(desiredAmount);
            machinesToShutdown.forEach(machine => {
                this.shutdownMachine(machine);
            });

        }
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
            const activeMachineCount = await this.getActiveMachineCount();
            const activeNodes = await this.getActiveNodeCount();
            const desiredAmount = this.amount[this.policy];
            this.addToHistory(desiredAmount, { active: activeMachineCount, nodes: activeNodes });

            console.log(`Policy set to ${this.policy}. (${activeMachineCount} of ${desiredAmount} machines active)`);
            const diff = desiredAmount - activeMachineCount;
            if (diff !== 0) {
                this.scaleTo(desiredAmount);
            } else {

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
            }

        } catch (err) {
            console.log('Error in checkResources: ' + err);
        } finally {
            setTimeout(() => this.checkResources(interval), interval);
        }
    }

    async getActiveNodeCount(): Promise<number> {
        try {
            const nodes = await this.getNodes();
            const activeNodes = nodes.filter(node => node.availability === 'active' && node.status === 'ready');
            const length = activeNodes.length;
            return new Promise<number>(resolve => resolve(length));
        } catch (err) {
            console.log(err);
            return new Promise<number>((resolve, reject) => reject(err));
        }
    }

    async getActiveMachineCount(): Promise<number> {
        try {
            const virtualMachines = await this.getMachines();
            const activeMachines = virtualMachines.filter(machine => machine.powerState === 'VM running');
            const length = activeMachines.length;
            return new Promise<number>(resolve => resolve(length));
        } catch (err) {
            return new Promise<number>((resolve, reject) => reject(err));
        }
    }

    private startMachine(machine: VirtualMachine): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            fetch('http://' + this.scaling_host + ':8888/virtualmachines/' + machine.resourceGroupName + '/' + machine.name,
                { method: 'post' })
                .then(res => res.text())
                .then(res => res === '"ok"') // YES, need the quotes
                .then(res => resolve(res))
                .catch(err => reject(err));
        });
    };

    private shutdownMachine(machine: VirtualMachine): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            fetch('http://' + this.scaling_host + ':8888/virtualmachines/' + machine.resourceGroupName + '/' + machine.name,
                { method: 'delete' })
                .then(res => res.text())
                .then(res => res === '"ok"') // YES, need the quotes
                .then(res => resolve(res))
                .catch(err => reject(err));
        });
    };

    private getMachines(): Promise<VirtualMachine[]> {
        return new Promise<VirtualMachine[]>((resolve, reject) => {
            fetch('http://' + this.scaling_host + ':8888/virtualmachines')
                .then(res => res.json<VirtualMachine[]>())
                // .then(machines => {
                //     machines.forEach(machine => console.log(machine.name));
                //     return machines;
                // })
                .then(machines => resolve(machines.filter(machine => machine.name !== 'master-01')))
                .catch(err => reject(err));
        });
    }

    private getNodes(): Promise<Node[]> {
        return new Promise<Node[]>((resolve, reject) => {
            fetch('http://' + this.docker_host + ':4444/nodes')
                .then(res => res.json<Node[]>())
                .then(nodes => resolve(nodes))
                .catch(err => reject(err));
        });
    }
}

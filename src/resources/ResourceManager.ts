import fetch from 'node-fetch';
import { VirtualMachine } from '../classes/VirtualMachine';

export class ResourceManager {
    private scaling_host: number = process.env.SCALING || 'localhost';
    private docker_host: number = process.env.DOCKER || 'localhost';
    private amount: any = {};

    constructor(
        private policy: string,
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
        const active = await this.getActiveMachineCount();
        return new Promise<any>(resolve => resolve({
            static: this.amount['Static'],
            on_demand: this.amount['OnDemand'],
            learning: this.amount['Learning'],
            policy: this.policy,
            active: active,
            up: 0,
            down: 0
        }));
    }

    private async scaleTo(desiredAmount: number) {
        const allMachines = await this.getMachines();
        if (desiredAmount === 0) {

            // Shut down all running machines
            console.log('Shutting down all running machines.');
            allMachines.forEach(machine => {
                // console.log(`Shutting down machine ${machine.name}.`);
                this.shutdownMachine(machine);
            });

        } else {

            // Scale to correct amount
            const machinesToActivate = allMachines.slice(0, desiredAmount);
            machinesToActivate.forEach(machine => {
                // console.log(`Starting machine: ${machine.name}.`);
                this.startMachine(machine);
            });

            const machinesToShutdown = allMachines.slice(desiredAmount);
            machinesToShutdown.forEach(machine => {
                // console.log(`Shutting down machine: ${machine.name}.`);
                this.shutdownMachine(machine);
            });

        }
    }

    private async checkResources(interval: number) {
        // Lets check amount of running machines
        try {
            const activeMachineCount = await this.getActiveMachineCount();
            const desiredAmount = this.amount[this.policy];
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
}

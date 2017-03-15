import fetch from 'node-fetch';
import { VirtualMachine } from '../classes/VirtualMachine';

export class ResourceManager {
    private scaling_host: number = process.env.SCALING || 'localhost';
    private docker_host: number = process.env.DOCKER || 'localhost';
    private amount: any = {};
    private shuttingDown: VirtualMachine[] = [];
    private startingUp: VirtualMachine[] = [];

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
            at_start: this.amount['Static'],
            on_demand: this.amount['OnDemand'],
            learning: this.amount['Learning']
        }));
    }

    setAmount(policy: string, amount: number): Promise<any> {
        if (policy === 'AtStart') {
            policy = 'Static';
        }
        this.amount[policy] = amount;

        return this.getAmount();
    }

    getInfo(): Promise<any> {
        const active = this.getActiveMachineCount();
        const up = this.startingUp.length;
        const down = this.shuttingDown.length;
        return new Promise<any>(resolve => resolve({
            at_start: this.amount['Static'],
            on_demand: this.amount['OnDemand'],
            learning: this.amount['Learning'],
            policy: this.policy,
            active: active,
            up: up,
            down: down
        }));
    }

    private async checkMachine(machine: VirtualMachine) {
        console.log(`Checking machine: ${machine.name} `);
        const allMachines = await this.getMachines();
        const updatedMachine = allMachines.find(m => m.id === machine.id);
        if (updatedMachine === undefined) {
            console.log(`Error checking machine: ${machine}, not found.`);
        } else if (updatedMachine.powerState === 'VM running') {
            this.startingUp = this.startingUp.filter(m => m.id !== updatedMachine.id);
        } else if (updatedMachine.powerState === 'VM deallocated') {
            this.shuttingDown = this.shuttingDown.filter(m => m.id !== updatedMachine.id);
        } else {
            console.log(`Powerstate of machine ${machine.name}: ${machine.powerState}`);
            setTimeout(() => this.checkMachine(updatedMachine), this.intervalAmount * 10);
        }
    }

    private async scaleTo(desiredAmount: number) {
        const allMachines = await this.getMachines();
        if (desiredAmount === 0) {

            // Shut down all running machines
            console.log('Shutting down all running machines.');
            const machinesToShutdown = allMachines
                .filter(machine => machine.powerState !== 'VM deallocated')
                .filter(machine => this.shuttingDown.indexOf(machine) === -1);
            machinesToShutdown.forEach(machine => {
                // console.log(`Shutting down machine ${machine.name}.`);
                this.shutdownMachine(machine);
            });

        } else {

            // Scale to correct amount
            const activeMachineCount = await this.getActiveMachineCount();
            const diff = desiredAmount - activeMachineCount;

            if (diff > 0) {

                // Scale up diff machines
                const machinesToActivate = allMachines
                    .filter(machine => machine.powerState !== 'VM running')
                    .slice(0, diff);
                machinesToActivate.forEach(machine => {
                    // console.log(`Starting machine: ${machine.name}.`);
                    this.startMachine(machine);
                });

            } else {

                // Scale down diff machines
                const machinesToShutdown = allMachines
                    .filter(machine => machine.powerState !== 'VM deallocated')
                    .slice(0, 0 - diff);
                machinesToShutdown.forEach(machine => {
                    // console.log(`Shutting down machine: ${machine.name}.`);
                    this.shutdownMachine(machine);
                });

            }

        }
    }

    private async checkResources(interval: number) {
        // Lets check amount of running machines
        try {
            const activeMachineCount = await this.getActiveMachineCount();
            const desiredAmount = this.amount[this.policy];
            console.log(`Policy set to ${this.policy}. (${activeMachineCount} of ${desiredAmount} machines active)`);
            if (activeMachineCount !== desiredAmount) {
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
        if (this.startingUp.map(m => m.id).indexOf(machine.id) !== -1) {
            // Working on it
            // console.log(`Already starting up machine: ${machine.name}`);
            return new Promise<boolean>(resolve => resolve(true));
        } else {

            this.startingUp.push(machine);
            setTimeout(() => this.checkMachine(machine), this.intervalAmount * 10);

            return new Promise<boolean>((resolve, reject) => {
                fetch('http://' + this.scaling_host + ':8888/virtualmachines/' + machine.resourceGroupName + '/' + machine.name,
                    { method: 'post' })
                    .then(res => res.text())
                    .then(res => res === '"ok"') // YES, need the quotes
                    .then(res => resolve(res))
                    .catch(err => reject(err));
            });
        }
    };

    private shutdownMachine(machine: VirtualMachine): Promise<boolean> {
        if (this.shuttingDown.map(m => m.id).indexOf(machine.id) !== -1) {
            // Working on it
            // console.log(`Already shutting down machine: ${machine.name}`);
            return new Promise<boolean>(resolve => resolve(true));
        } else {

            this.shuttingDown.push(machine);
            setTimeout(() => this.checkMachine(machine), this.intervalAmount * 10);

            return new Promise<boolean>((resolve, reject) => {
                fetch('http://' + this.scaling_host + ':8888/virtualmachines/' + machine.resourceGroupName + '/' + machine.name,
                    { method: 'delete' })
                    .then(res => res.text())
                    .then(res => res === '"ok"') // YES, need the quotes
                    .then(res => resolve(res))
                    .catch(err => reject(err));
            });

        }
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

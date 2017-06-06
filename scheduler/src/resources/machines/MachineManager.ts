import { VirtualMachine } from '../../classes/VirtualMachine';
import fetch from 'node-fetch';

export class MachineManager {
    private scaling_host = process.env.SCALING || 'localhost';

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

    public getMachines(): Promise<VirtualMachine[]> {
        // TODO: add load
        const machineLoads: Map<string, number> = new Map([
            ['node01', 2.5],
            ['node02', 2.5],
            ['node03', 2],
            ['node04', 2],
            ['node05', 1.5],
            ['node06', 1.5],
            ['node07', 1],
            ['node08', 1],
            ['node09', 0.5],
            ['node10', 0.5],
            ['node11', 0],
            ['node12', 0],
            ['node13', 0],
            ['node14', 0],
            ['node15', 0]
        ]);

        return new Promise<VirtualMachine[]>((resolve, reject) => {
            fetch('http://' + this.scaling_host + ':8888/virtualmachines')
                .then(res => res.json<VirtualMachine[]>())
                .then(machines => {
                    machines.forEach(machine => machine.load5 = machineLoads.get(machine.name));
                    return machines;
                })
                .then(machines => resolve(machines.filter(machine => machine.name !== 'master')))
                .catch(err => reject(err));
        });
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
}

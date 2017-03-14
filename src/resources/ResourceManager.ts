import fetch from 'node-fetch';

class VirtualMachine {
    id: string;
    name: string;
    powerState: string;
    resourceGroupName: string;
    hardwareProfile: { vmSize: string };
}

export class ResourceManager {
    private scaling_host: number = process.env.SCALING || 'localhost';
    private docker_host: number = process.env.DOCKER || 'localhost';

    constructor(
        private policy: string,
        private staticAmount: number,
        private onDemandAmount: number,
        private learningAmount: number,
        private intervalAmount: number) {


        this.checkResources(intervalAmount);
    }

    private async checkResources(interval: number) {
        // Lets check amount of running machines
        try {
            const machineCount = await this.getActiveMachineCount();
            console.log(machineCount + ' machines active.');

            switch (this.policy) {
                case 'Off':
                    console.log('Policy set to off, no action.');
                    break;
                case 'Static':
                    console.log('Policy set to static.');
                    break;
                case 'OnDemand':
                    console.log('Policy set to on demand.');
                    break;
                case 'Learning':
                    console.log('Policy set to learning.');
                    break;
                default:
                    break;
            }

        } catch (err) {
            console.log('Error in checkResources: ' + err);
        } finally {
            setTimeout(() => this.checkResources(interval), interval);
        }
    }

    private async getActiveMachineCount(): Promise<number> {
        try {
            const virtualMachines = await this.getMachines();
            const activeMachines = virtualMachines.filter(machine => machine.powerState === 'VM running');
            const length = activeMachines.length;
            return new Promise<number>(resolve => resolve(length));
        } catch (err) {
            return new Promise<number>((resolve, reject) => reject(err));
        }
    }

    private getMachines(): Promise<VirtualMachine[]> {
        return new Promise<VirtualMachine[]>((resolve, reject) => {
            fetch('http://' + this.scaling_host + ':8888/virtualmachines')
                .then(res => resolve(res.json<VirtualMachine[]>()))
                .catch(err => reject(err));
        });
    }
}

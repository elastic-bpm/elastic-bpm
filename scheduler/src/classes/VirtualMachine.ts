export class VirtualMachine {
    id: string;
    name: string;
    powerState: string;
    resourceGroupName: string;
    hardwareProfile: { vmSize: string };
    load5: number;
}

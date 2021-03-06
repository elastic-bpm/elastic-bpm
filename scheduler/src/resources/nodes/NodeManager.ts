import { VirtualMachine } from '../../classes/VirtualMachine';
import { Node } from '../../classes/Node';
import fetch from 'node-fetch';

export class NodeManager {
    private docker_host = process.env.DOCKER || 'localhost';

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

    async addNode(): Promise<string> {
        try {
            const nodes = await this.getNodes();
            const active_nodes = nodes.filter(node => node.status === 'ready');

            for (let i = 0; i < active_nodes.length; i++) {
                if (nodes[i].availability !== 'active') {
                    await this.setNodeAvailability(nodes[i].hostname, 'active');
                    return new Promise<string>(resolve => resolve(nodes[i].hostname));

                }
            }

            throw new Error('No nodes available');
        } catch (err) {
            return new Promise<string>((resolve, reject) => reject(err));
        }
    }

    async shutdownNode(nodeName: string): Promise<void> {
        try {
            await this.setNodeAvailability(nodeName, 'drain');
            return new Promise<void>(resolve => resolve());
        } catch (err) {
            return new Promise<void>((resolve, reject) => reject(err));
        }
    }

    async setNodes(availableNodes: string[], drainNodes: string[]): Promise<void> {
        try {
            const nodes = await this.getNodes();
            const active_nodes = nodes.filter(node => node.status === 'ready');

            for (let i = 0; i < active_nodes.length; i++) {
                if (availableNodes.indexOf(nodes[i].hostname) !== -1) {
                    await this.setNodeAvailability(nodes[i].hostname, 'active');
                }

                if (drainNodes.indexOf(nodes[i].hostname) !== -1) {
                    await this.setNodeAvailability(nodes[i].hostname, 'drain');
                }
            }

            return new Promise<void>(resolve => resolve());
        } catch (err) {
            console.log(err);
            return new Promise<void>((resolve, reject) => reject(err));
        }
    }

    async setNodeAmount(amount: number): Promise<string[]> {
        try {
            const startedMachines: string[] = [];
            const nodes = await this.getNodes();
            const active_nodes = nodes.filter(node => node.status === 'ready').sort(function (a, b) {
                if (a.hostname < b.hostname) { return -1; };
                if (a.hostname > b.hostname) { return 1; };
                return 0;
            });

            for (let i = 0; i < active_nodes.length; i++) {
                if (i < amount) {
                    if (nodes[i].availability !== 'active') {
                        await this.setNodeAvailability(nodes[i].hostname, 'active');
                        startedMachines.push(nodes[i].hostname);
                    }
                } else {
                    await this.setNodeAvailability(nodes[i].hostname, 'drain');
                }
            }
            const down_nodes = nodes.filter(node => node.status !== 'ready');
            for (let i = 0; i < down_nodes.length; i++) {
                await this.setNodeAvailability(down_nodes[i].hostname, 'drain');
            };

            return new Promise<string[]>(resolve => resolve(startedMachines));
        } catch (err) {
            console.log(err);
            return new Promise<string[]>((resolve, reject) => reject(err));
        }
    }

    async getNodes(): Promise<Node[]> {
        return new Promise<Node[]>((resolve, reject) => {
            fetch('http://' + this.docker_host + ':4444/nodes')
                .then(res => res.json<Node[]>())
                .then(nodes => resolve(nodes))
                .catch(err => reject(err));
        });
    }

    private setNodeAvailability(hostname: string, availability: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fetch('http://' + this.docker_host + ':4444/node/' + hostname + '/' + availability, { method: 'POST' })
                .then(nodes => resolve())
                .catch(err => reject(err));
        });
    }
}

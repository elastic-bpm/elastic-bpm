import { VirtualMachine } from '../../classes/VirtualMachine';
import { Node } from '../../classes/Node';
import fetch from 'node-fetch';
import { Elastic } from './elastic';

export class NodeManager {
    private docker_host = process.env.DOCKER || 'localhost';
    private elastic = new Elastic(1000); // Update each second

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

    async setNodeAmount(amount: number): Promise<void> {
        try {
            const nodes = await this.getNodes();
            const active_nodes = nodes.filter(node => node.status === 'ready').sort(function (a, b) {
                if (a.hostname < b.hostname) { return -1; };
                if (a.hostname > b.hostname) { return 1; };
                return 0;
            });

            for (let i = 0; i < active_nodes.length; i++) {
                if (i < amount) {
                    await this.setNodeAvailability(nodes[i].hostname, 'active');
                } else {
                    await this.setNodeAvailability(nodes[i].hostname, 'drain');
                }
            }
            const down_nodes = nodes.filter(node => node.status !== 'ready');
            for (let i = 0; i < down_nodes.length; i++) {
                await this.setNodeAvailability(down_nodes[i].hostname, 'drain');
            };

            return new Promise<void>(resolve => resolve());
        } catch (err) {
            console.log(err);
            return new Promise<void>((resolve, reject) => reject(err));
        }
    }

    async getNodes(): Promise<Node[]> {
        const loads: any[] = await this.elastic.get_load();
        console.log('Loads: ' + JSON.stringify(loads));

        return new Promise<Node[]>((resolve, reject) => {
            fetch('http://' + this.docker_host + ':4444/nodes')
                .then(res => res.json<Node[]>())
                .then(nodes => {
                    nodes.forEach(node => {
                        node.load5 = (loads[node.hostname])['load5'].pop();
                    });
                    console.log('NOdes: ' + JSON.stringify(nodes));
                    return nodes;
                }).then(nodes => resolve(nodes))
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

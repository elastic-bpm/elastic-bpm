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

    async setNodeAmount(amount: number): Promise<void> {
        try {
            const nodes = await this.getNodes();
            for (let i = 0; i < nodes.length; i++) {
                if (i < amount) {
                    await this.setNodeAvailability(nodes[i].hostname, 'active');
                } else {
                    await this.setNodeAvailability(nodes[i].hostname, 'drain');
                }
            }

            return new Promise<void>(resolve => resolve());
        } catch (err) {
            console.log(err);
            return new Promise<void>((resolve, reject) => reject(err));
        }
    }

    private getNodes(): Promise<Node[]> {
        return new Promise<Node[]>((resolve, reject) => {
            fetch('http://' + this.docker_host + ':4444/nodes')
                .then(res => res.json<Node[]>())
                .then(nodes => resolve(nodes))
                .catch(err => reject(err));
        });
    }

    private setNodeAvailability(hostname: string, availability: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fetch('http://' + this.docker_host + ':4444/node/' + hostname + '/' + availability, { method: 'POST'})
                .then(nodes => resolve())
                .catch(err => reject(err));
        });
    }
}

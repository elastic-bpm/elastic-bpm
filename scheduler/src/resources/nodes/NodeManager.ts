import { VirtualMachine } from '../../classes/VirtualMachine';
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


    private getNodes(): Promise<Node[]> {
        return new Promise<Node[]>((resolve, reject) => {
            fetch('http://' + this.docker_host + ':4444/nodes')
                .then(res => res.json<Node[]>())
                .then(nodes => resolve(nodes))
                .catch(err => reject(err));
        });
    }
}

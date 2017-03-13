import fetch from 'node-fetch';

class Lorem {
    type: string;
    amount: number;
    text_out: string;
}

export class TaskRepository {
    host = process.env.API || 'localhost';

    constructor() { }

    getAllWorkflows(): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            fetch('http://' + this.host + ':3000/workflows')
                .then(res => res.json<any[]>())
                .then(json => resolve(json))
                .catch(err => reject(err));
        });
    }
}

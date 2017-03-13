import fetch from 'node-fetch';

class Lorem {
    type: string;
    amount: number;
    text_out: string;
}

export class TaskRepository {
    constructor() { }

    asyncFetch(url: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            fetch(url)
                .then(res => res.json<Lorem>())
                .then(json => resolve(json.text_out))
                .catch(err => reject(err));
        });
    }

    async getTasks() {
        try {
            const result = await this.asyncFetch('http://www.randomtext.me/api/lorem/ul-5/5-15');
            return result;
        } catch (e) {
            return e;
        }
    }
}

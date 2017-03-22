class NameValueTuple {
    name: Date;
    value: number;
}

class HistoryItem {
    name: string;
    series: NameValueTuple[];
}

export class Info {
    amount: {
        Off: number,
        Static: number,
        OnDemand: number,
        Learning: number
    };
    machines: {
        active: number,
        nodes: number
    };
    policy: string;
    history: HistoryItem[];
}

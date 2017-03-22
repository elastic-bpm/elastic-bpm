export class Status {
  name: string;
  message: string;
  statusCode: number;

  constructor() {
    this.name = '';
    this.message = '';
    this.statusCode = 0;
  }
}

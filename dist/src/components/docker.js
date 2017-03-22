/*jshint esversion: 6 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Docker {
    constructor() {
        this.Client = require('node-rest-client').Client;
        this.client = new this.Client();
        this.docker_host = process.env.DOCKER_HOST || 'localhost';
        this.status = { message: 'not updated yet', statusCode: 500 };
        this.info = {};
        this.containers = [];
        this.services = [];
        this.nodes = [];
        this.workers = ['abc'];
        this.get_nodes = function () {
            return this.nodes;
        };
        this.get_workers = function () {
            return this.workers;
        };
        this.set_node_availability = function (hostname, availability, cb) {
            const req = this.client.post('http://' + this.docker_host + ':4444/node/' + hostname + '/' + availability, (data, response) => {
                if (response.statusCode === 200) {
                    cb(null, data);
                }
                else {
                    cb('Error: ' + data, null);
                }
            });
            req.on('error', (error) => {
                cb('error: ' + error, null);
            });
        };
        this.delete_workers = function (_, cb) {
            const req = this.client.delete('http://' + this.docker_host + ':4444/services/workers', (data, response) => {
                if (response.statusCode === 200) {
                    cb(null, data);
                }
                else {
                    cb('Error: ' + data, null);
                }
            });
            req.on('error', (error) => {
                cb('error: ' + error, null);
            });
        };
        this.create_workers = function (_, cb) {
            const req = this.client.post('http://' + this.docker_host + ':4444/services/workers', (data, response) => {
                if (response.statusCode === 200) {
                    cb(null, data);
                }
                else {
                    cb('Error: ' + data, null);
                }
            });
            req.on('error', (error) => {
                cb('error: ' + error, null);
            });
        };
    }
    start_updates(interval) {
        this.update_status(interval);
        this.update_info(interval);
        this.update_containers(interval);
        this.update_services(interval);
        this.update_nodes(interval);
        this.update_workers(interval);
    }
    ;
    update_status(interval) {
        const req = this.client.get('http://' + this.docker_host + ':4444/status', (data, response) => {
            this.status.statusCode = response.statusCode;
            this.status.message = response.statusMessage;
            setTimeout(() => this.update_status(interval), interval);
        });
        req.on('error', (error) => {
            this.status.statusCode = 500;
            this.status.message = error.code;
            setTimeout(() => this.update_status(interval), interval);
        });
    }
    ;
    update_info(interval) {
        const req = this.client.get('http://' + this.docker_host + ':4444/info/remote', (data, response) => {
            this.info = data;
            setTimeout(() => this.update_info(interval), interval);
        });
        req.on('error', (error) => {
            setTimeout(() => this.update_info(interval), interval);
        });
    }
    ;
    update_containers(interval) {
        const req = this.client.get('http://' + this.docker_host + ':4444/containers/remote', (data, response) => {
            this.containers = data;
            setTimeout(() => this.update_containers(interval), interval);
        });
        req.on('error', (error) => {
            setTimeout(() => this.update_containers(interval), interval);
        });
    }
    ;
    update_services(interval) {
        const req = this.client.get('http://' + this.docker_host + ':4444/services', (data, response) => {
            this.services = data;
            setTimeout(() => this.update_services(interval), interval);
        });
        req.on('error', (error) => {
            setTimeout(() => this.update_services(interval), interval);
        });
    }
    ;
    update_nodes(interval) {
        const req = this.client.get('http://' + this.docker_host + ':4444/nodes', (data, response) => {
            this.nodes = data;
            setTimeout(() => this.update_nodes(interval), interval);
        });
        req.on('error', (error) => {
            setTimeout(() => this.update_nodes(interval), interval);
        });
    }
    ;
    update_workers(interval) {
        const req = this.client.get('http://' + this.docker_host + ':4444/workers', (data, response) => {
            this.workers = data;
            setTimeout(() => this.update_workers(interval), interval);
        });
        req.on('error', (error) => {
            setTimeout(() => this.update_workers(interval), interval);
        });
    }
    ;
    check_status() {
        return this.status;
    }
    ;
    get_remote_info() {
        return this.info;
    }
    ;
    get_remote_containers() {
        return this.containers;
    }
    ;
    get_remote_services() {
        return this.services;
    }
    ;
}
exports.Docker = Docker;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21wb25lbnRzL2RvY2tlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSx3QkFBd0I7OztBQUV4QjtJQUFBO1FBQ0ksV0FBTSxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUM1QyxXQUFNLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDM0IsZ0JBQVcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxXQUFXLENBQUM7UUFDckQsV0FBTSxHQUFHLEVBQUUsT0FBTyxFQUFFLGlCQUFpQixFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUN6RCxTQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ1YsZUFBVSxHQUFVLEVBQUUsQ0FBQztRQUN2QixhQUFRLEdBQVUsRUFBRSxDQUFDO1FBQ3JCLFVBQUssR0FBVSxFQUFFLENBQUM7UUFDbEIsWUFBTyxHQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7UUFrR3pCLGNBQVMsR0FBRztZQUNSLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ3RCLENBQUMsQ0FBQztRQUVGLGdCQUFXLEdBQUc7WUFDVixNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN4QixDQUFDLENBQUM7UUFFRiwwQkFBcUIsR0FBRyxVQUFVLFFBQWEsRUFBRSxZQUFpQixFQUFFLEVBQU87WUFDdkUsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxXQUFXLEdBQUcsYUFBYSxHQUFHLFFBQVEsR0FBRyxHQUFHLEdBQUcsWUFBWSxFQUNyRyxDQUFDLElBQVMsRUFBRSxRQUFhO2dCQUNyQixFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQzlCLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ25C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QSxDQUFDO0NBc0RMO0FBL0pELHdCQStKQyIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9kb2NrZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKmpzaGludCBlc3ZlcnNpb246IDYgKi9cclxuXHJcbmV4cG9ydCBjbGFzcyBEb2NrZXIge1xyXG4gICAgQ2xpZW50ID0gcmVxdWlyZSgnbm9kZS1yZXN0LWNsaWVudCcpLkNsaWVudDtcclxuICAgIGNsaWVudCA9IG5ldyB0aGlzLkNsaWVudCgpO1xyXG4gICAgZG9ja2VyX2hvc3QgPSBwcm9jZXNzLmVudi5ET0NLRVJfSE9TVCB8fCAnbG9jYWxob3N0JztcclxuICAgIHN0YXR1cyA9IHsgbWVzc2FnZTogJ25vdCB1cGRhdGVkIHlldCcsIHN0YXR1c0NvZGU6IDUwMCB9O1xyXG4gICAgaW5mbyA9IHt9O1xyXG4gICAgY29udGFpbmVyczogYW55W10gPSBbXTtcclxuICAgIHNlcnZpY2VzOiBhbnlbXSA9IFtdO1xyXG4gICAgbm9kZXM6IGFueVtdID0gW107XHJcbiAgICB3b3JrZXJzOiBhbnlbXSA9IFsnYWJjJ107XHJcblxyXG4gICAgc3RhcnRfdXBkYXRlcyhpbnRlcnZhbDogbnVtYmVyKSB7XHJcbiAgICAgICAgdGhpcy51cGRhdGVfc3RhdHVzKGludGVydmFsKTtcclxuICAgICAgICB0aGlzLnVwZGF0ZV9pbmZvKGludGVydmFsKTtcclxuICAgICAgICB0aGlzLnVwZGF0ZV9jb250YWluZXJzKGludGVydmFsKTtcclxuICAgICAgICB0aGlzLnVwZGF0ZV9zZXJ2aWNlcyhpbnRlcnZhbCk7XHJcbiAgICAgICAgdGhpcy51cGRhdGVfbm9kZXMoaW50ZXJ2YWwpO1xyXG4gICAgICAgIHRoaXMudXBkYXRlX3dvcmtlcnMoaW50ZXJ2YWwpO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZV9zdGF0dXMoaW50ZXJ2YWw6IG51bWJlcikge1xyXG4gICAgICAgIGNvbnN0IHJlcSA9IHRoaXMuY2xpZW50LmdldCgnaHR0cDovLycgKyB0aGlzLmRvY2tlcl9ob3N0ICsgJzo0NDQ0L3N0YXR1cycsIChkYXRhOiBhbnksIHJlc3BvbnNlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5zdGF0dXMuc3RhdHVzQ29kZSA9IHJlc3BvbnNlLnN0YXR1c0NvZGU7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzLm1lc3NhZ2UgPSByZXNwb25zZS5zdGF0dXNNZXNzYWdlO1xyXG5cclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnVwZGF0ZV9zdGF0dXMoaW50ZXJ2YWwpLCBpbnRlcnZhbCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJlcS5vbignZXJyb3InLCAoZXJyb3I6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXR1cy5zdGF0dXNDb2RlID0gNTAwO1xyXG4gICAgICAgICAgICB0aGlzLnN0YXR1cy5tZXNzYWdlID0gZXJyb3IuY29kZTtcclxuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy51cGRhdGVfc3RhdHVzKGludGVydmFsKSwgaW50ZXJ2YWwpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZV9pbmZvKGludGVydmFsOiBudW1iZXIpIHtcclxuICAgICAgICBjb25zdCByZXEgPSB0aGlzLmNsaWVudC5nZXQoJ2h0dHA6Ly8nICsgdGhpcy5kb2NrZXJfaG9zdCArICc6NDQ0NC9pbmZvL3JlbW90ZScsIChkYXRhOiBhbnksIHJlc3BvbnNlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5pbmZvID0gZGF0YTtcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnVwZGF0ZV9pbmZvKGludGVydmFsKSwgaW50ZXJ2YWwpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXEub24oJ2Vycm9yJywgKGVycm9yOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnVwZGF0ZV9pbmZvKGludGVydmFsKSwgaW50ZXJ2YWwpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZV9jb250YWluZXJzKGludGVydmFsOiBhbnkpIHtcclxuICAgICAgICBjb25zdCByZXEgPSB0aGlzLmNsaWVudC5nZXQoJ2h0dHA6Ly8nICsgdGhpcy5kb2NrZXJfaG9zdCArICc6NDQ0NC9jb250YWluZXJzL3JlbW90ZScsIChkYXRhOiBhbnksIHJlc3BvbnNlOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5jb250YWluZXJzID0gZGF0YTtcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnVwZGF0ZV9jb250YWluZXJzKGludGVydmFsKSwgaW50ZXJ2YWwpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXEub24oJ2Vycm9yJywgKGVycm9yOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnVwZGF0ZV9jb250YWluZXJzKGludGVydmFsKSwgaW50ZXJ2YWwpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIHVwZGF0ZV9zZXJ2aWNlcyhpbnRlcnZhbDogYW55KSB7XHJcbiAgICAgICAgY29uc3QgcmVxID0gdGhpcy5jbGllbnQuZ2V0KCdodHRwOi8vJyArIHRoaXMuZG9ja2VyX2hvc3QgKyAnOjQ0NDQvc2VydmljZXMnLCAoZGF0YTogYW55LCByZXNwb25zZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VydmljZXMgPSBkYXRhO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMudXBkYXRlX3NlcnZpY2VzKGludGVydmFsKSwgaW50ZXJ2YWwpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXEub24oJ2Vycm9yJywgKGVycm9yOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnVwZGF0ZV9zZXJ2aWNlcyhpbnRlcnZhbCksIGludGVydmFsKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSB1cGRhdGVfbm9kZXMoaW50ZXJ2YWw6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IHJlcSA9IHRoaXMuY2xpZW50LmdldCgnaHR0cDovLycgKyB0aGlzLmRvY2tlcl9ob3N0ICsgJzo0NDQ0L25vZGVzJywgKGRhdGE6IGFueSwgcmVzcG9uc2U6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLm5vZGVzID0gZGF0YTtcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnVwZGF0ZV9ub2RlcyhpbnRlcnZhbCksIGludGVydmFsKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmVxLm9uKCdlcnJvcicsIChlcnJvcjogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy51cGRhdGVfbm9kZXMoaW50ZXJ2YWwpLCBpbnRlcnZhbCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgdXBkYXRlX3dvcmtlcnMoaW50ZXJ2YWw6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IHJlcSA9IHRoaXMuY2xpZW50LmdldCgnaHR0cDovLycgKyB0aGlzLmRvY2tlcl9ob3N0ICsgJzo0NDQ0L3dvcmtlcnMnLCAoZGF0YTogYW55LCByZXNwb25zZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMud29ya2VycyA9IGRhdGE7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy51cGRhdGVfd29ya2VycyhpbnRlcnZhbCksIGludGVydmFsKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmVxLm9uKCdlcnJvcicsIChlcnJvcjogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy51cGRhdGVfd29ya2VycyhpbnRlcnZhbCksIGludGVydmFsKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgY2hlY2tfc3RhdHVzKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN0YXR1cztcclxuICAgIH07XHJcblxyXG4gICAgZ2V0X3JlbW90ZV9pbmZvKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmluZm87XHJcbiAgICB9O1xyXG5cclxuICAgIGdldF9yZW1vdGVfY29udGFpbmVycygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb250YWluZXJzO1xyXG4gICAgfTtcclxuXHJcbiAgICBnZXRfcmVtb3RlX3NlcnZpY2VzKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNlcnZpY2VzO1xyXG4gICAgfTtcclxuXHJcbiAgICBnZXRfbm9kZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZXM7XHJcbiAgICB9O1xyXG5cclxuICAgIGdldF93b3JrZXJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLndvcmtlcnM7XHJcbiAgICB9O1xyXG5cclxuICAgIHNldF9ub2RlX2F2YWlsYWJpbGl0eSA9IGZ1bmN0aW9uIChob3N0bmFtZTogYW55LCBhdmFpbGFiaWxpdHk6IGFueSwgY2I6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IHJlcSA9IHRoaXMuY2xpZW50LnBvc3QoJ2h0dHA6Ly8nICsgdGhpcy5kb2NrZXJfaG9zdCArICc6NDQ0NC9ub2RlLycgKyBob3N0bmFtZSArICcvJyArIGF2YWlsYWJpbGl0eSxcclxuICAgICAgICAgICAgKGRhdGE6IGFueSwgcmVzcG9uc2U6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1c0NvZGUgPT09IDIwMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNiKG51bGwsIGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjYignRXJyb3I6ICcgKyBkYXRhLCBudWxsKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJlcS5vbignZXJyb3InLCAoZXJyb3I6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICBjYignZXJyb3I6ICcgKyBlcnJvciwgbnVsbCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIGRlbGV0ZV93b3JrZXJzID0gZnVuY3Rpb24gKF86IGFueSwgY2I6IGFueSkge1xyXG4gICAgICAgIGNvbnN0IHJlcSA9IHRoaXMuY2xpZW50LmRlbGV0ZSgnaHR0cDovLycgKyB0aGlzLmRvY2tlcl9ob3N0ICsgJzo0NDQ0L3NlcnZpY2VzL3dvcmtlcnMnLFxyXG4gICAgICAgICAgICAoZGF0YTogYW55LCByZXNwb25zZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzQ29kZSA9PT0gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2IobnVsbCwgZGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNiKCdFcnJvcjogJyArIGRhdGEsIG51bGwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmVxLm9uKCdlcnJvcicsIChlcnJvcjogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIGNiKCdlcnJvcjogJyArIGVycm9yLCBudWxsKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgY3JlYXRlX3dvcmtlcnMgPSBmdW5jdGlvbiAoXzogYW55LCBjYjogYW55KSB7XHJcbiAgICAgICAgY29uc3QgcmVxID0gdGhpcy5jbGllbnQucG9zdCgnaHR0cDovLycgKyB0aGlzLmRvY2tlcl9ob3N0ICsgJzo0NDQ0L3NlcnZpY2VzL3dvcmtlcnMnLFxyXG4gICAgICAgICAgICAoZGF0YTogYW55LCByZXNwb25zZTogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzQ29kZSA9PT0gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2IobnVsbCwgZGF0YSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNiKCdFcnJvcjogJyArIGRhdGEsIG51bGwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmVxLm9uKCdlcnJvcicsIChlcnJvcjogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIGNiKCdlcnJvcjogJyArIGVycm9yLCBudWxsKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbn1cclxuIl19

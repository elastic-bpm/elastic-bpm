/*jshint esversion: 6 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Redis {
    constructor() {
        this.redis = require('redis');
        this.client = {};
        this.status = {
            message: 'not updated yet',
            statusCode: 500
        };
    }
    update_status(interval) {
        this.client = this.redis.createClient(6379, process.env.REDIS_HOST);
        this.client.on('error', () => {
            this.status = {
                message: 'error',
                statusCode: 500
            };
        });
        this.client.on('ready', () => {
            this.status = {
                message: 'ok',
                statusCode: 200
            };
        });
    }
    check_status() {
        return this.status;
    }
    ;
}
exports.Redis = Redis;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21wb25lbnRzL3JlZGlzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHdCQUF3Qjs7O0FBRXhCO0lBQUE7UUFDSSxVQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3pCLFdBQU0sR0FBUSxFQUFFLENBQUM7UUFDakIsV0FBTSxHQUFHO1lBQ0wsT0FBTyxFQUFFLGlCQUFpQjtZQUMxQixVQUFVLEVBQUUsR0FBRztTQUNsQixDQUFDO0lBdUJOLENBQUM7SUFyQkcsYUFBYSxDQUFDLFFBQWE7UUFDdkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUVwRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUU7WUFDcEIsSUFBSSxDQUFDLE1BQU0sR0FBRztnQkFDVixPQUFPLEVBQUUsT0FBTztnQkFDaEIsVUFBVSxFQUFFLEdBQUc7YUFDbEIsQ0FBQztRQUNOLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFO1lBQ3BCLElBQUksQ0FBQyxNQUFNLEdBQUc7Z0JBQ1YsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsVUFBVSxFQUFFLEdBQUc7YUFDbEIsQ0FBQztRQUNOLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELFlBQVk7UUFDUixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUN2QixDQUFDO0lBQUEsQ0FBQztDQUNMO0FBN0JELHNCQTZCQyIsImZpbGUiOiJzcmMvY29tcG9uZW50cy9yZWRpcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qanNoaW50IGVzdmVyc2lvbjogNiAqL1xyXG5cclxuZXhwb3J0IGNsYXNzIFJlZGlzIHtcclxuICAgIHJlZGlzID0gcmVxdWlyZSgncmVkaXMnKTtcclxuICAgIGNsaWVudDogYW55ID0ge307XHJcbiAgICBzdGF0dXMgPSB7XHJcbiAgICAgICAgbWVzc2FnZTogJ25vdCB1cGRhdGVkIHlldCcsXHJcbiAgICAgICAgc3RhdHVzQ29kZTogNTAwXHJcbiAgICB9O1xyXG5cclxuICAgIHVwZGF0ZV9zdGF0dXMoaW50ZXJ2YWw6IGFueSkge1xyXG4gICAgICAgIHRoaXMuY2xpZW50ID0gdGhpcy5yZWRpcy5jcmVhdGVDbGllbnQoNjM3OSwgcHJvY2Vzcy5lbnYuUkVESVNfSE9TVCk7XHJcblxyXG4gICAgICAgIHRoaXMuY2xpZW50Lm9uKCdlcnJvcicsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5zdGF0dXMgPSB7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnZXJyb3InLFxyXG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNTAwXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuY2xpZW50Lm9uKCdyZWFkeScsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5zdGF0dXMgPSB7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnb2snLFxyXG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAwXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY2hlY2tfc3RhdHVzKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnN0YXR1cztcclxuICAgIH07XHJcbn1cclxuIl19

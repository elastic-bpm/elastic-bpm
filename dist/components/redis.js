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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21wb25lbnRzL3JlZGlzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLHdCQUF3Qjs7O0FBRXhCO0lBQUE7UUFDSSxVQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3pCLFdBQU0sR0FBUSxFQUFFLENBQUM7UUFDakIsV0FBTSxHQUFHO1lBQ0wsT0FBTyxFQUFFLGlCQUFpQjtZQUMxQixVQUFVLEVBQUUsR0FBRztTQUNsQixDQUFDO0lBdUJOLENBQUM7SUFyQkcsYUFBYSxDQUFDLFFBQWE7UUFDdkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUVwRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUU7WUFDcEIsSUFBSSxDQUFDLE1BQU0sR0FBRztnQkFDVixPQUFPLEVBQUUsT0FBTztnQkFDaEIsVUFBVSxFQUFFLEdBQUc7YUFDbEIsQ0FBQztRQUNOLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFO1lBQ3BCLElBQUksQ0FBQyxNQUFNLEdBQUc7Z0JBQ1YsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsVUFBVSxFQUFFLEdBQUc7YUFDbEIsQ0FBQztRQUNOLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVELFlBQVk7UUFDUixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUN2QixDQUFDO0lBQUEsQ0FBQztDQUNMO0FBN0JELHNCQTZCQyIsImZpbGUiOiJjb21wb25lbnRzL3JlZGlzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypqc2hpbnQgZXN2ZXJzaW9uOiA2ICovXHJcblxyXG5leHBvcnQgY2xhc3MgUmVkaXMge1xyXG4gICAgcmVkaXMgPSByZXF1aXJlKCdyZWRpcycpO1xyXG4gICAgY2xpZW50OiBhbnkgPSB7fTtcclxuICAgIHN0YXR1cyA9IHtcclxuICAgICAgICBtZXNzYWdlOiAnbm90IHVwZGF0ZWQgeWV0JyxcclxuICAgICAgICBzdGF0dXNDb2RlOiA1MDBcclxuICAgIH07XHJcblxyXG4gICAgdXBkYXRlX3N0YXR1cyhpbnRlcnZhbDogYW55KSB7XHJcbiAgICAgICAgdGhpcy5jbGllbnQgPSB0aGlzLnJlZGlzLmNyZWF0ZUNsaWVudCg2Mzc5LCBwcm9jZXNzLmVudi5SRURJU19IT1NUKTtcclxuXHJcbiAgICAgICAgdGhpcy5jbGllbnQub24oJ2Vycm9yJywgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXR1cyA9IHtcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdlcnJvcicsXHJcbiAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiA1MDBcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5jbGllbnQub24oJ3JlYWR5JywgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXR1cyA9IHtcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdvaycsXHJcbiAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDBcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBjaGVja19zdGF0dXMoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdHVzO1xyXG4gICAgfTtcclxufVxyXG4iXX0=

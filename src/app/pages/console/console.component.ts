import { Component, OnInit } from '@angular/core';
import { ElasticService } from '../../services/elastic.service';

@Component({
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.css']
})
export class ConsoleComponent implements OnInit {
  title = 'Console';
  logMessages = [];

  constructor(private elasticService: ElasticService) { }

  ngOnInit() {
    this.elasticService.logMessages.subscribe(logMessages => this.logMessages = logMessages);
  }

}

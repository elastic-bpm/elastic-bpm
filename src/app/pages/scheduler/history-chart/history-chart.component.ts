import { Component, OnInit, Input } from '@angular/core';
import { curveStepAfter } from '../../../../../node_modules/d3/build/d3';
@Component({
  selector: 'app-history-chart',
  templateUrl: './history-chart.component.html',
  styleUrls: ['./history-chart.component.css']
})
export class HistoryChartComponent implements OnInit {
  @Input()
  history = {};

  curveStepAfter;
  colorScheme = {
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };

  constructor() {
    Object.assign(this, { curveStepAfter });
  }

  ngOnInit() {
  }

}

import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-bs-panel',
  templateUrl: './bs-panel.component.html',
  styleUrls: ['./bs-panel.component.css']
})
export class BsPanelComponent implements OnInit {
  @Input()
  title: string;

  constructor() { }

  ngOnInit() {
  }

}

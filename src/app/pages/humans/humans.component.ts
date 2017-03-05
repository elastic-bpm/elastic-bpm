import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-humans',
  templateUrl: './humans.component.html',
  styleUrls: ['./humans.component.css']
})
export class HumansComponent implements OnInit {
  title = 'Humans';

  constructor() { }

  ngOnInit() {
  }

}

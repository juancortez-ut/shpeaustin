import { Component, Input, Output } from '@angular/core';

@Component({
  selector: 'small-card',
  template: require("./templates/small-card.component.html")
  
})


export class SmallCardComponent {
	@Input() header: string = 'Header';   
}

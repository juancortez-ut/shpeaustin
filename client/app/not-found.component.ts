import { Component, OnInit } from "@angular/core";
import "./styles/not-found.component.less";

@Component({
  selector: "not-found",
  template: require("./templates/not-found.component.html")
})


export class NotFoundComponent implements OnInit{
	keys:any = {
		'37': 1, 
		'38': 1, 
		'39': 1, 
		'40': 1
	};

	ngOnInit(){
		this.disableScroll();
	}

	private disableScroll() {
	  if (window.addEventListener) // older FF
	      window.addEventListener('DOMMouseScroll', this.preventDefault, false);
	  window.onwheel = this.preventDefault; // modern standard
	  window.onmousewheel = (document as any).onmousewheel = this.preventDefault; // older browsers, IE
	  window.ontouchmove  = this.preventDefault; // mobile
	  document.onkeydown  = this.preventDefaultForScrollKeys;
	}

	private preventDefault(e:any) {
	  e = e || window.event;
	  if (e.preventDefault)
	      e.preventDefault();
	  e.returnValue = false;  
	}

	private preventDefaultForScrollKeys(e:any) {
	    if (this.keys && this.keys.hasOwnProperty(e.keyCode) && this.keys[e.keyCode]) {
	        this.preventDefault(e);
	        return false;
	    }
	}
}

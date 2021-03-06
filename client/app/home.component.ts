import { Component, OnInit } 		from '@angular/core';
import { NewsletterService } 		from './services/newsletter.service';
import { CalendarService } 			from './services/calendar.service';
import "./styles/home.component.less";

declare var $: any;

@Component({
  selector: 'home',
  template: require("./templates/home.component.html")
  
})


export class HomeComponent implements OnInit{
	newsletter: string;
	calendar: any;
	numEntries: number;
	calendarItem: number;
    entriesExist: boolean = false;

	constructor(private newsletterService: NewsletterService, private calendarService: CalendarService){}

	ngOnInit(){
		this.newsletterService.getNewsletterLink().subscribe(data => {
			this.newsletter = data.link;
		}, err => {
			console.error(err);
		});

		this.calendarService.getCalendarEntries().subscribe(entries => {
			this.calendar = entries;
			this.numEntries = this.calendar.length;
            this.entriesExist = (this.numEntries === 0) ? false : true;
            this.calendarItem = 0;
            this._createCalendarEntries();
		}, err => {
			console.error(err);
		});
	}

	changeCalendarEntry(event: any){
		let rightArrow = $(event.target).hasClass('fa-angle-double-right');

		if(rightArrow){
			this.calendarItem = (this.calendarItem + 1) % this.numEntries;
		} else{
            this.calendarItem--;
            if(this.calendarItem < 0) this.calendarItem = this.numEntries - 1;
		}
        $('.fa-calendar').toggleClass('dark-shpe-blue mid-blue');
        let calendarHtml:any = this.calendar[this.calendarItem];
        const { eventTitle = "No event title" } = calendarHtml;

        $("#event-title").html("<b>Event: </b>" + eventTitle);
        $("span.title").text(eventTitle);
        let time:any = this._parseCalendarTime(calendarHtml.time);
        let dateFormat;
         if(time.startTime){
            $("#event-date").html("<b>Date: </b>" + time.month + " " + time.day + ", " + time.year + " at " +  time.startTime);
            dateFormat = this._convertToDateFormat(time.month, time.day, time.year, time.startTime);
            $("span.start").text(dateFormat);
            $("span.end").text(dateFormat); //TODO: add ending time support
        } else{
             $("#event-date").html("<b>Date: </b>" + time.month + " " + time.day + ", " + time.year);
             dateFormat = this._convertToDateFormat(time.month, time.day, time.year, time.startTime);
             $("span.start").text(dateFormat);
             $("span.end").text(dateFormat); //TODO: add ending time support
        }
        if(calendarHtml.location){
            $("#event-location").html("<b>Location: </b>" + calendarHtml.location);
            $("span.location").text(calendarHtml.location);
        } else{
            $("#event-location").html("");
            $("span.location").text("");
        }
        $("#event-link").attr('href', calendarHtml.link);
        $("span.description").text(calendarHtml.link);
	}

	private _createCalendarEntries(){
		// Filters out the old calendar entries
    	let dateNow: Date = new Date();
    	let dateTime: number = dateNow.getTime();

    	this.calendar = this.calendar.filter(function(item: any){
    		let startTime:number = new Date(item.time).getTime();
    		if(startTime >= dateTime){
    			return true;
    		} else{
    			return false;
    		}
    	});

        let dateFormat;
        setTimeout(() => {
            this.calendar.forEach((calendar: any) => {
                const { event = "No event title" } = calendar;
            	$("#event-title").html("<b>Event: </b>" + event);
            	$("span.title").text(event);
            	var time = this._parseCalendarTime(calendar.time);
                if(time['startTime']){
                    $("#event-date").html("<b>Date: </b>" + time['month'] + " " + time['day'] + ", " + time['year'] + " at " +  time['startTime']);
                    dateFormat = this._convertToDateFormat(time['month'], time['day'], time['year'], time['startTime']);
                    $("span.start").text(dateFormat);
                    $("span.end").text(dateFormat); //TODO: add ending time support
                } else{
                    $("#event-date").html("<b>Date: </b>" + time['month'] + " " + time['day'] + ", " + time['year']);
                    dateFormat = this._convertToDateFormat(time['month'], time['day'], time['year'], "");
                    $("span.start").text(dateFormat);
                    $("span.end").text(dateFormat); //TODO: add ending time support
                }
                if(calendar.location){
                    $("#event-location").html("<b>Location: </b>" + calendar.location);
                    $("span.location").text(calendar.location);
                } else{
                    $("span.location").text("");
                }
                $("#event-link").attr('href', calendar.link);
                $("span.description").text(calendar.link);
            });
            $("#calendar-loader").hide();
        }, 500);
	}

	// convert to MM/DD/YYYY HH:SS format
    // example: 04/03/2016 08:00 AM
	private _convertToDateFormat(month:string, day:number, year:number, time:string): string{
		const _months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        if(time === ""){
            time = "12:00 PM"; // set default time of 12:00 PM
        } 
        let convertedMonth:number = _months.indexOf(month) + 1;
        if((convertedMonth / 10) < 1){
            convertedMonth = this._pad(2, convertedMonth); // add a zero in front
        }
        // if((day / 10) < 1){
        //     day = day.pad(2); // add a zero in front
        // }
        return convertedMonth + "/" + day + "/" + year + " " + time;
    }

    private _parseCalendarTime(time: string): any{
        let date = {};
        let year:string = time.substring(0,time.indexOf('-'));
        time = time.substring(time.indexOf('-')+1, time.length);
        let month:string = time.substring(0, time.indexOf('-'));
        month = this._getMonthString(month);
        time = time.substring(time.indexOf('-')+1, time.length);
        let day:string = time.substring(0, 2);

        if(time.length > 2){
            let hour:string = time.substring(3, time.length);
            let startTime:string = hour.substring(0, 5);
            let convertedTimeOfDay: string = "";
            //var timeOfDay = parseInt(startTime.replace(/^0+/, ''));
            let timeOfDay:number = parseInt(startTime);
            if(timeOfDay >= 12){
                if(timeOfDay > 12){
                    let restOfTime:string = startTime.substring(2, startTime.length);
                    let militaryConvert:number = parseInt(startTime.substring(0,2)) - 12;
                    if((militaryConvert / 10) < 1){
                        militaryConvert = this._pad(2, militaryConvert);
                    }
                    startTime = militaryConvert + restOfTime;
                }
                convertedTimeOfDay = "PM";
            } else{
                convertedTimeOfDay = "AM";
            }
            //startTime = startTime.replace(/^0+/, '');
            date['startTime'] = startTime + " " + convertedTimeOfDay;
        } else{
            date['startTime'] = "";
        } 
        date['month'] = month;
        date['day'] = day;
        date['year'] = year;
        return date;
    }

    private _pad(num: number, value: number): any{
	    return new Array(num).join('0').slice((num || 2) * -1) + value;
	    
    }

    private _getMonthString(month: string): string{
        let num: number = parseInt(month.replace(/^0+/, '')); // strip leading 0's
        switch(num){
            case 1:
                return "January";
            case 2:
                return "February";
            case 3:
                return "March";
            case 4:
                return "April";
            case 5:
                return "May";
            case 6:
                return "June";
            case 7:
                return "July";
            case 8:
                return "August";
            case 9:
                return "September";
            case 10:
                return "October";
            case 11:
                return "November";
            case 12:
                return "December";
            default:
                return "Invalid Month";
        }
    }
}

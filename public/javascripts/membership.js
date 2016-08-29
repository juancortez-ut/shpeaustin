$(document).ready(function(){
    $("#owl-example").owlCarousel();
     
    $.ajax({
        method: "GET",
        url: "/data/calendar"
    }).done(function(calendar) {
        var cal = Calendar();
        cal.init(null, calendar);
    }).fail(function(error){
        console.error("Error in fetching calendar data");
        console.error(error);
    });  

    var descriptions = {  
       "mentoring":[  
          "Our chapter has partnered with both The University of Texas at Austin Chapter and SHPE Jr. Chapters to create a mentorship program. Professionals in",
          " the SHPE Austin chapter are matched with college students with similar career choices and provide mentorship and career advice."
       ],
       "community_outreach":[  
          "Our chapter prides itself with community outreach and hosts various activities with The University of Texas at Austin chapter.",
          "Some of the annual events that SHPE Austin hosts are Noche de Ciencias and Introduce a Girl to Engineering Day. Each month, our ",
          "Community Service Director hosts a community service event, ranging from mentoring children, cleaning parks, and participating in toy drives."
       ],
       "leadership_development":[  
          "Throughout the year, officer positions become available and members are encouraged to apply for these positions. If you are interested in learning more about",
          " how the officer board functions or want to enhance your leadership skills as a professional, come around to our events so we can meet you!"
       ],
       "professional_development":[  
          "As a professional, it is important to continue developing your skills so the SHPE Austin chapter provides members with workshops where members can ",
          "become better public speakers, find ways to enhance their brands, and teach how to mentor students."
       ],
       "chapter_development":[  
          "When becoming a professional, it can be daunting to move to a new city. The SHPE Austin chapter makes the transition a little easier by ",
          " hosting socials and events around Austin. Check out our calendar and join us at some of our events to learn more about what Austin, TX has to offer."
       ],
       "sports":[  
          "Austin, TX is well known for being an outdoors city and there are various leagues that SHPE Austin participates in. In past years, our chapter has been part of ",
          "many leagues, including soccer, volleyball, softball, and football."
       ],
       "national_conferences":[  
          "The <a href='http://www.shpe.org/'>Society of Hispanic Professional Engineers National</a> Organization hosts a yearly natinal conference and brings together all ",
          "the chapters across the world, including SHPE Jr. Chapters, University Chapters, and Professional Chapters. The National Conference is usually held in November and ",
          "offers networking opportunities and professional workshops for all members of any age."
       ],
       "regional_conferences":[  
          "Every year, one University chapter from each region is chosen to host a Regional conference. The Regional Conference offers many of the same benefits and opportunities ",
          "as the national conference, but at a smaller level. The Regional Conference is usually held during the month of March and includes activities and events available for all ",
          "levels, including SHPE Jr, University, and Professional."
       ]
    };

    /**********************************************************************************************************************************
    * Modal Code for More Information
    *
    **********************************************************************************************************************************/
    var $overlay = $('<div id="overlay"></div>'),
        $modal = $('<div id="modal"></div>'),
        $close = $('<a id="close" href="#">close</a>'),
        $content = $('<div id="modal-content"></div>');
    $modal.hide();
    $overlay.hide();
    $modal.append($content, $close);

    $('.membership-container').append($overlay, $modal);

    modal.initialize({
        $overlay: $("#overlay"),
        $modal: $("#modal"),
        $close: $("#close"),
        $content: $("#modal-content")
    });

    $('.fa-info-circle').click(function(){
        var pillar = this.getAttribute('data');
        var height = 400;
        var width = 500;
        var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if(isMobile){
            height = 400;
        }
        window_height = $(window).height();
        window_width = $(window).width();

        // make sure that it fits within the frame
        height = window_height < height ? window_height - 50: height;
        width = window_width < width ? window_width - 50 : width;
        if(isMobile){
            width = 345;
            $("#modal").css({'margin-left': '8px'});
        }

        var formattedPillar = pillar.replace(/ /g,"_").toLowerCase(); // replace spaces with an underscore
        var title = "<h2 class ='dark-shpe-blue modal-title'>" + pillar + "</h2>";
        var imageSrc = "assets/photos/" + formattedPillar + ".jpg";
        var image = "<img class='modal-images' src='" + imageSrc + "'></img>";
        var descriptionText;
        for (var obj in descriptions){
            if(obj === formattedPillar){
                descriptionText = descriptions[obj];
                descriptionText = descriptionText.join(" ");
                break;
            }
        }
        var description = "<p class='modal-description'>" + descriptionText + "</p>";
        var furtherQuestions = "<p class='more-info'>For any questions or inquiries, please e-mail us in the <a href='/contact'>Contact Page.</a></p>";


        modal.open({content: $(title + image + description + furtherQuestions), width: width+"px", height: height+"px", align: "center"});
    });

    $close.click(function(e){
        e.preventDefault();
         modal.close();
    });
});






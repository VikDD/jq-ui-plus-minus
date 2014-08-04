(function( $ ) {
     $.fn.buttonsPlusMinus = function(options) {
		 var settings = $.extend({
            minValue: -1000,
            maxValue: 1000,
			decreaseText:'-1',
			increaseText:'+1'
        }, options );
        return this.each(function() {
			if(!$(this).hasClass("ui-plus-minused"))
			{
				var minus_span=$("<span>"+settings.decreaseText+"</span>");
				var plus_span=$("<span>"+settings.increaseText+"</span>");
				var inpt=$(this);
					inpt.wrap('<div class="ui-buttonset" />');				
				var val_span=$("<span />");
				var max_val=(inpt.attr("max")!==undefined)?parseInt(inpt.attr("max")):settings.maxValue;
					max_val=isNaN(max_val)?settings.maxValue:max_val;
				var min_val=(inpt.attr("min")!==undefined)?parseInt(inpt.attr("min")):settings.minValue;
					min_val=isNaN(min_val)?settings.minValue:min_val;
				minus_span.insertBefore(inpt);
				val_span.insertBefore(inpt);
				plus_span.insertAfter(inpt);
				minus_span.button({icons:{primary: "ui-icon-circle-minus"},text: false}).click(function(e){
					var inpt_val=parseInt(inpt.val());
						if(isNaN(inpt_val))
						{
							inpt_val=min_val>0?min_val:0;
						}
					if(inpt_val>min_val)
					{--inpt_val;}
					if(inpt_val>max_val)
					{inpt_val=max_val;}
					inpt.val(inpt_val);
					val_span.find(".ui-button-text").text(inpt_val);
				}).tooltip({track:true});
				minus_span.removeClass("ui-corner-all");
				minus_span.addClass("ui-corner-left");
				plus_span.button({icons:{primary: "ui-icon-circle-plus"},text: false}).click(function(e){
					var inpt_val=parseInt(inpt.val());
						if(isNaN(inpt_val))
						{
							inpt_val=max_val<0?max_val:0;
						}
					if(inpt_val<max_val)
					{++inpt_val;}
					if(inpt_val<min_val)
					{inpt_val=min_val;}
					inpt.val(inpt_val);
					val_span.find(".ui-button-text").text(inpt_val);
				}).tooltip({track:true});
				plus_span.removeClass("ui-corner-all");
				plus_span.addClass("ui-corner-right");
				inpt.prop("readonly",true);
				inpt.addClass("ui-plus-minused");			
				inpt.css("display","none");
				val_span.text(!isNaN(parseInt(inpt.val()))?inpt.val():"0");
				val_span.button({"disabled":true}).removeClass("ui-corner-all").removeClass("ui-state-disabled");
			}
		}); 
        return this;
    };
}( jQuery ));

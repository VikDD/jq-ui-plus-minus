(function( $ ) {
    $.fn.buttonsPlusMinus = function f (options, param, val) {
		if (this.length==0) return this;
		if (options=="refresh"){
			this.each(function(){refresh($(this));}) 
			return this;
		}
		if (options=="disable" || options=="enable"){
			val=(options=="disable") ? true : false;
			options="option";
			param="disabled";
		}		
		if (options=="option"){
			if (param==undefined) return this[0].settings;
			if (typeof(param)=='object') {
				this[0].settings=$.extend(true, this[0].settings, param);
				return this;
			}
			if (val==undefined) return this[0].settings[param]; 
			this.each(function(){
				if (typeof(this.settings[param])=='object') {
					if (typeof(val)=='object') this.settings[param]=$.extend(true, this.settings[param], val);
				} else {
					this.settings[param]=val;
				}
				normalize_settings($(this),this.settings);
				refresh($(this));
			});
			return this;
		}
		var global_settings = $.extend(true,{
			nowrap:false, /* makes all buttonset white-space:nowrap resulting in all 3 buttons stay on one line */
            minValue: '', /* if empty - takes from input attributes */
            maxValue: '',
			showInfinity:false, 
			maxLength: 0, /* if -1 then maxLength calculates from minValue and maxValue (whichever is longer); maxlength also works
								0 means length is taken from input attribute  */
			valueWidth:'maxlength', /* 0 - auto width (depends on input value), 'maxlength' ('maxLength')- generate width from maxLength
										('maxlength') works only if input is appended to body and visible when creating widget !!!) 
										you can call ("options", "refresh") to recalculate width on widget show */
			decreaseText:'', /* if none - generates tooltip from values of changeStep and changeStep*shiftStepMultiplier */
			increaseText:'',
			decreaseIcon:"ui-icon-circle-minus",
			increaseIcon:"ui-icon-circle-plus",
			changeStep:1,
			shiftStepMultiplier:5,
			disabled:false,
			tooltip: {
				plusminus:true,
				valspan: true,
				mobile:false, /* used only if any tooltip is true */
				track:false
			},
			title: {
				plusminus:true,
				valspan:true
			},
			input: {
				width:0, /* 0 - = value span width*/
				position:{my:"left top", at:"left top", collision: "flip"}, /* of value span */
				noBlurUpdate:false, /* do not update value when input+scroller blured (document.click) 
									you can use enter or click value buttons to update */
				readonly:false, /* true false or 'mobile' - readonly only on mobile devices*/
				selectOnFocus:true, /* used only when input.readonly=false */ 
				focusMobile:false, /* don't focus on helper input on mobile devices after click on value span 	
										(and hence don't show mobile keyboard) used only when input.readonly=false */
				activeClass:'ui-state-active', /* '' - no aditional class will be added */
			},
			scroller: {
				show:true,
				position:{my:"left center", at:"right center", collision: "flip"},  /* of helper input */
				showRange:4, /* number of elements shown, not including current value and scrollerShowBeyond values */
				range:20,
				valueStep:'change',  /* 'change' 'shift' 'increment' or number */
				upDown:true,
				upDownHideDisabled:true,
				current:true,
				elementPadding:'css', /* 'css' or 'auto' or any other string or undefined - to leave padding untouched */
				padding:0, /* same as above but for scroller container*/
				currentAlign: 'center', /* 'center' (default), 'top', 'bottom' */
				showBeyond:0.6, /*  how much of element height to show beyond scrollerShowRange, divided in 2 - above and below 
														(e.g. 0.6 means 0.3 height of one value element is shown above and 0.3 - below */
				overlay:true, /* true - appends to body and moves above everything else on z-index (apply .ui-fron class), 
										false - appends to value span */
				noDocumentScroll:false, /* prevents document scrolling when scroller has reached it's end (don't work on mobile)
											(also removes scrollbars when mouse over scroller - can cause trouble on centered designs) */
			},
			delayPlusMinus: { /* hold mousedown (touch) settings */
				init:600, /* initial delay to start autoclick plus/minus button  */
				end:200, /* final delay */
				mod:40, /* modificator, represents how fast the delay will come from init to end (if mod=init-end then it will take 1 step) */
				step:'shift' /* 'change' or 'shift' (default) */
			},
			changedFunction:function(inpObj,changeResult){}
        }, options );
		
	/* -----------------------FUNCTIONS---------------------- */
		function document_selection_clear() {
			var r;
			if 		(window.getSelection)  {r=window.getSelection(); r.removeAllRanges(); }
			else if (document.getSelection)  { r=document.getSelection(); r.removeAllRanges(); }
			else if (document.selection) { r=document.selection; r.empty(); }
		};
		
		function is_mobile(){
			return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
		}
		
		function update_val(_inpt, inpt_val){
			var settings=get_settings(_inpt);
			var 
				old_inpt_val=parseInt(_inpt.val()) || 0,
				max_val=settings.maxValue,
				min_val=settings.minValue
			;
			inpt_val=parseInt(inpt_val) || 0;
			if(inpt_val>max_val) inpt_val=max_val;
			if(inpt_val<min_val) inpt_val=min_val;
			_inpt.val(inpt_val);
			settings.changedFunction(_inpt,old_inpt_val!=inpt_val);
			var btext=_inpt.closest('.ui-buttonsPlusMinus').find('.ui-buttonsPlusMinus-text');
			btext.text(inpt_val);	
		}
		
		function change_val(obj,sign,shift){
			var settings=get_settings(obj);
			var _inpt=obj.closest('.ui-buttonsPlusMinus').find('.ui-plus-minused');
			
			if (shift) document_selection_clear();
			var shift_k=(shift)?settings.shiftStepMultiplier:1;
			var inpt_val=parseInt(_inpt.val()) ||0;
			inpt_val=inpt_val + sign*settings.changeStep*shift_k;
			update_val(_inpt,inpt_val);
		}
		
		function flash(_i,immediate){
			var ii=_i.closest('.ui-button');
			ii.addClass('ui-state-active');
			ii.find('.ui-buttonsPlusMinus-text').removeClass('ui-state-active');
			var flash_interval=(immediate)?1:100;
			setTimeout(function(){
				ii.removeClass('ui-state-active');
				ii.removeClass('ui-state-hover');
			},flash_interval)
		}				
		
		function scroller_move(obj, dir){
			var new_el;
			var vals=obj.closest('.ui-buttonsPlusMinus-scroller').find('.ui-buttonsPlusMinus-value');
			var _val_span=find_my_buttons(obj).find('.ui-buttonsPlusMinus-valspan')
			if (dir==1) {
				new_el=vals.first();
			} else {
				new_el=vals.last();
			}
			new_el.click();
			_val_span.click();
		}
		
		function scroller_value_click(e){  
			var settings=get_settings($(this));
			e.stopPropagation();
			var _i=find_my_buttons($(this)).find('.ui-buttonsPlusMinus-input'); 
			var inpt_val=parseInt($(this).find('.ui-button-text').text())
			_i.val(inpt_val);
			if (settings.input.noBlurUpdate) {
				var _inpt=find_my_buttons($(this)).find('.ui-plus-minused');
				update_val(_inpt,inpt_val);
			}
			$(document).click();
		}		
		
		function check_css(obj, settings){
			var sep=parseInt(settings.scroller.elementPadding);
			var w='95%';
			if (!isNaN(sep))  obj.find('.ui-button-text').css('padding-top',sep).css('padding-bottom',sep);
			obj.find('.ui-button-text').css('white-space','nowrap'); 
			obj.css('margin-right',0).css('width',w);
		}		

		function find_my_buttons(obj){
			var id=obj.closest('.ui-buttonsPlusMinus-scroller').attr('id');
			return $(document).find('.ui-buttonsPlusMinus[aria-describedby='+id+']');
		}
		
		function refresh(bpm){
			var settings=get_settings(bpm);
			var q=bpm.closest('.ui-buttonsPlusMinus').find('.ui-buttonsPlusMinus-valspan .ui-button-text');
			var inpt=bpm.closest('.ui-buttonsPlusMinus').find('.ui-plus-minused');
			q.width('');
			if (settings.valueWidth.toString().toLowerCase()=='maxlength' && settings._maxLength>0) {
				var ph='';
				for (var jj=1; jj<=settings._maxLength; jj++) ph+='9';
				q.text(ph);
				
				q.width(q.width());
			} else if (parseInt(settings.valueWidth)>0) {
				q.width(parseInt(settings.valueWidth));
			}			
			update_val(inpt, inpt.val());
			var buttons=bpm.closest('.ui-buttonsPlusMinus').find('.ui-button');
			if (settings.disabled) {
				buttons.button("disable");
				inpt.addClass('ui-state-disabled');
			} else {
				buttons.button("enable");
				inpt.removeClass('ui-state-disabled');
			}
		}
		
		function mouseup_emulator(e){
			$(this).removeClass('ui-state-hover');
			$(this).mouseup();
		}		
		
		function get_settings(obj){
			if (obj.closest('.ui-buttonsPlusMinus-scroller').length>0) obj=find_my_buttons(obj);
			var i=obj.closest('.ui-buttonsPlusMinus').find('.ui-plus-minused');
			return i[0].settings;
		}
		
		function normalize_settings(inpt, settings){
			if (settings.input.readonly=='mobile') {
				if (is_mobile()){
					settings.input.readonly=true;
					settings.input.focusMobile=false;
				} else {
					settings.input.readonly=false;
				}
			}
			if (settings.input.readonly) settings.input.selectOnFocus=false;
			if (settings.changeStep<=0) settings.changeStep=1;
			if (settings.shiftStepMultiplier<=0) settings.shiftStepMultiplier=1;
			if (settings.scroller.showRange<=0) settings.scroller.showRange=1;
			if (settings.scroller.range<settings.scroller.showRange+2) {
				settings.scroller.range=settings.scroller.showRange+2;
			}
			if (!settings.decreaseText) settings.decreaseText="-"+settings.changeStep
				+ " (shift -"+settings.changeStep*settings.shiftStepMultiplier+")";
			if (!settings.increaseText) settings.increaseText="+"+settings.changeStep
				+ " (shift +"+settings.changeStep*settings.shiftStepMultiplier+")";
			
			if (settings.minValue=='' || settings.minValue==-Infinity) {
				if (inpt.attr("min")!=undefined)  {
					settings.minValue=parseInt(inpt.attr("min"))||0 ;
				} else {
					settings.minValue=-Infinity;
				}
			} else {
				settings.minValue=parseInt(settings.minValue)||0;
			}
			if (settings.maxValue=='' || settings.maxValue==Infinity) {
				if (inpt.attr("max")!=undefined)  {
					settings.maxValue=parseInt(inpt.attr("max"))||0 ;
				} else {
					settings.maxValue=Infinity;
				}
			} else {
				settings.maxValue=parseInt(settings.maxValue)||0;
			}
			if (settings.maxValue<settings.minValue) {
				var temp=settings.maxValue;
				settings.maxValue=settings.minValue;
				settings.minValue=temp;
			}
			
			if (settings.maxlength) settings.maxLength=settings.maxlength;
			settings.maxLength=parseInt(settings.maxLength)||0;
			settings._maxLength=settings.maxLength;
			if (settings._maxLength==0 && inpt.attr('maxlength')!=undefined) settings._maxLength=parseInt(inpt.attr('maxlength'))||0;
			if (settings._maxLength==-1) {
				settings._maxLength=Math.max(settings.maxValue.toString().length,settings.minValue.toString().length);
			}
			if (settings._maxLength<0) settings._maxLength=0;	
		}
		
		if (!f.called) { /* prevent duplicate event binding  */
			f.called=true;
			
			$(document).click(function(){ 
				var _sc=$(this).find('.ui-buttonsPlusMinus-scroller');
				var _i=$(this).find('.ui-buttonsPlusMinus-input');
				if ((_sc.length>0 || _i.length>0)) {
					_i.trigger('userclose');
					_sc.remove();
					_i.remove();
				}
			});

			$(document).on('mouseup', function(e){
				if (typeof(touch_shift_init)!=='undefined') clearInterval(touch_shift_init);
				if (typeof(touch_shift_step)!=='undefined') {
					clearInterval(touch_shift_step);
					touch_shift_step=undefined;
				}
			});			
			
		}
		
			
	/* ---------------------MAIN-------------------- */
        this.each(function () {
			if($(this).hasClass("ui-plus-minused")) return;
			f.gc=++f.gc||0; /* counter for unique data-ui-bpmid f is global function (look above)*/			
			this.settings=$.extend(true,{},global_settings);
			normalize_settings($(this),this.settings);
			
			var 
				minus_span=$("<span>"+this.settings.decreaseText+"</span>"),
				plus_span=$("<span>"+this.settings.increaseText+"</span>"),
				inpt=$(this),
				inpt_title=inpt.attr('title') ? 'title="'+inpt.attr('title')+'"' : '',
				val_span=$('<span class="ui-buttonsPlusMinus-valspan" '+inpt_title+'+ />')
			;
			inpt.wrap('<span class="ui-buttonset ui-buttonsPlusMinus" aria-describedby=ui-buttonsPlusMinus-scroller-'+f.gc+' />');	
			minus_span.insertBefore(inpt);
			val_span.insertBefore(inpt);
			plus_span.insertAfter(inpt);			
			inpt.closest('.ui-buttonsPlusMinus').css('white-space','nowrap');
			
			minus_span.button({icons:{primary: this.settings.decreaseIcon},text: false});
			plus_span.button({icons:{primary: this.settings.increaseIcon},text: false});
			
			$().add(minus_span).add(plus_span).on('mousedown', function(){
				if ($(this).hasClass('ui-state-disabled')) return;
				var settings=get_settings($(this));
				var 
					dir=($(this).is(plus_span)) ? 1 : -1, 
					that=$(this), 
					init=parseInt(settings.delayPlusMinus.init) || 1,  
					end=parseInt(settings.delayPlusMinus.end) || 1,
					mod=parseInt(settings.delayPlusMinus.mod) || 1,
					is_shift=(settings.delayPlusMinus.step=='shift')
				;
				if (init<=end) init=end+1;
				touch_shift_init=setTimeout(function(){
					var timeout_int=init;
					that.attr('data-ui-buttonsPlusMinus-longtap',1);
					touch_shift_step=setTimeout(function timer_func(){
						that.addClass('ui-state-active');
						change_val(that,dir,is_shift);
						clearTimeout(touch_shift_step);
						if ((timeout_int-end)>0) timeout_int-=((init-end)/(timeout_int-end))*mod; /* exponential-like increase*/
						if (timeout_int<200) timeout_int=200;
						touch_shift_step=setTimeout(timer_func,timeout_int)
					},1);
				},init);
			}).on('click', function(e){
				if ($(this).attr('data-ui-buttonsPlusMinus-longtap')==1) {
					$(this).attr('data-ui-buttonsPlusMinus-longtap',0);
				} else {
					var dir=($(this).is(plus_span)) ? 1 : -1;
					change_val($(this),dir,e.shiftKey);
				}
			}).on('touchend touchcancel', function(e){
				$(this).attr('data-ui-buttonsPlusMinus-longtap',0);
			}).on('contextmenu', function(e){
				$(this).removeClass('ui-state-active');
				$('.test_num').val($('.test_num').val()+1);
			});
			
			if ($().tooltip && (this.settings.tooltip.mobile || !is_mobile()) && this.settings.tooltip.plusminus) {
				minus_span.tooltip({track:this.settings.tooltip.track});
				plus_span.tooltip({track:this.settings.tooltip.track});
			} else if (!this.settings.title.plusminus) {
				minus_span.attr('title','');
				plus_span.attr('title','');
			}

			if ($().tooltip && (this.settings.tooltip.mobile || !is_mobile()) && this.settings.tooltip.valspan) {
				val_span.tooltip({track:this.settings.tooltip.track});
			} else if (!this.settings.title.valspan) {
				val_span.attr('title','');
			}		
			
			minus_span.removeClass("ui-corner-all").addClass("ui-corner-left");				
			plus_span.removeClass("ui-corner-all").addClass("ui-corner-right");
			inpt.css("text-align","right").prop("readonly",true).addClass("ui-plus-minused").css("display","none");
			val_span.button();
			val_span.removeClass("ui-corner-all").css('position','relative');
			var q=val_span.find('.ui-button-text');
			q.addClass('ui-buttonsPlusMinus-text').css('overflow','hidden').css('white-space','nowrap');
			refresh($(this)); /* assign q.width() and update_val */
			
			val_span.click(function (e){
				var settings=get_settings($(this));
				e.preventDefault();
				e.stopPropagation();
				$(document).click();
				
				if ($(this).find('.ui-buttonsPlusMinus-input').length>0) return false;
				var 
					bt=parseInt(q.css('borderTopWidth')) || 0,
					bl=parseInt(q.css('borderLeftWidth')) || 0,
					i=$('<input style="position: absolute; z-index:1;" class="ui-buttonsPlusMinus-input" />'),
					_inpt=$(this).closest('.ui-buttonsPlusMinus').find('.ui-plus-minused');
				;
				if (is_mobile()) i.attr('type', 'number');
				if (settings.input.readonly) i.prop('readonly',1);
				i.addClass('ui-button-text').addClass('ui-state-default');
				if (settings.input.activeClass) i.addClass(settings.input.activeClass);
				i.css('text-align', q.css('text-align')).css('border',val_span.css('border'));
				if (settings.input.width) {
					i.width(settings.input.width);
				} else {
					i.width(q.width());
				}
				
				if (settings._maxLength)	i.attr('maxlength',settings._maxLength);
				$(this).append(i);
				i.position($.extend(settings.input.position,{of: val_span}));
				i.val(_inpt.val());
				q.addClass('ui-state-active').css('border','none');
				i.keydown(function(e){
					e.stopPropagation();
					var settings=get_settings($(this));
					var 
						_inpt=$(this).closest('.ui-buttonsPlusMinus').find('.ui-plus-minused'),
						mod=0, 
						ss=settings.shiftStepMultiplier*settings.changeStep
					;
					if (e.which==13) {
						e.stopPropagation();
						if (settings.input.noBlurUpdate) {
							var inpt_val=parseInt($(this).val())||0;
							update_val(_inpt,inpt_val);
						}
						$(document).click();
					} else if (e.which==27) {
						flash($(this), true);
						$(this).remove();
						$(document).click();
					} else if (e.which==38){ 
						e.preventDefault();
						mod=(e.shiftKey) ? +ss : +1;
					} else if (e.which==40){ 
						e.preventDefault();
						mod=(e.shiftKey) ? -ss : -1;
					} else if (e.which==33  && !e.shiftKey){ 
						e.preventDefault();
						mod=+ss;
					} else if (e.which==34  && !e.shiftKey){ 
						e.preventDefault();
						mod=-ss;
					} else if ((e.which==36 && e.ctrlKey) || (e.which==33 && e.shiftKey)){ 
						e.preventDefault();
						if (settings.maxValue!=Infinity || settings.showInfinity) $(this).val(settings.maxValue); 
					} else if ((e.which==35 && e.ctrlKey) || (e.which==34 && e.shiftKey)){ 
						e.preventDefault();
						if (settings.minValue!=-Infinity || settings.showInfinity) $(this).val(settings.minValue); 
					} 
					if (mod) $(this).val((parseInt($(this).val())||0)+mod);					
				}).click(function(e){
					e.stopPropagation();
				}).focus(function(e){
					var settings=get_settings($(this));
					if (settings.input.selectOnFocus) i.select();
				}).change(function(e){
					if ($(this).is(':not(:focus)')) {
						$(document).click();					
					}
				});
				i.on('userclose', function(){ 
					var settings=get_settings($(this));
					if (!settings.input.noBlurUpdate) {
						var inpt_val=parseInt($(this).val())||0;
						var _inpt=$(this).closest('.ui-buttonsPlusMinus').find('.ui-plus-minused');
						update_val(_inpt,inpt_val);
					}
					flash($(this), settings.input.noBlurUpdate);					
				});
				if (!settings.input.readonly && (!is_mobile() || settings.input.focusMobile)) i.focus(); 
				
				if (settings.scroller.show) {
					var 
						bpmid=$(this).closest('.ui-buttonsPlusMinus').attr('aria-describedby'),
						val,
						sc=$('<div style="position:absolute; white-space:normal; " id='+bpmid+'\
							class="ui-buttonsPlusMinus-scroller ui-state-default ui-button-text ui-corner-all" />')
							.append( $("<div class='ui-buttonsPlusMinus-wrapper' style='margin:0px; padding:0px; position: relative; z-index:1;' />") 
								.append( $("<div class='ui-buttonsPlusMinus-frame' style='margin:0px; padding:0px; position: relative; z-index:1;' />")
									.append("<div class='ui-buttonsPlusMinus-container' style='margin:0px; padding:0px; position: relative; z-index:1;' />")
								)
							),
						j=0, k=1,
						v=parseInt(inpt.val()),
						cur_step=settings.scroller.valueStep,
						oplus=v,
						ominus=v,
						shift_step=settings.changeStep*settings.shiftStepMultiplier,
						sc_up=$('<div class="ui-buttonsPlusMinus-up">&nbsp</div>')
							.button({text:false, icons:{primary:'ui-icon-triangle-1-n'}}).attr('title','')
							.click(function(e){ scroller_move($(this),1); e.stopPropagation();}),
						sc_down=$('<div class="ui-buttonsPlusMinus-down">&nbsp</div>')
							.button({text:false, icons:{primary:'ui-icon-triangle-1-s'}}).attr('title','')
							.click(function(e){ scroller_move($(this),-1); e.stopPropagation();})
					;
					if  (isNaN(parseInt(cur_step))) {
						cur_step=(cur_step=='shift') ? shift_step : settings.changeStep;
					}
					val_span.append(sc);
					var sp=parseInt(settings.scroller.padding);
					if (!isNaN(sp))  sc.css('padding',sp);
					var _sc=sc.find('.ui-buttonsPlusMinus-container');
					var out=false, maxed=false, mined=false;
					while (k<=settings.scroller.range) {
						var 
							nplus=$('<div class="ui-buttonsPlusMinus-value" />').button()
								.click(scroller_value_click),
							vplus=undefined,
							vminus=undefined
							oldk=k;
						;
						if (k>settings.scroller.showRange && !out)  {
							var frame=_sc.closest('.ui-buttonsPlusMinus-frame');
							frame.height(frame.height()+frame.find('.ui-button').first().height()*settings.scroller.showBeyond)
								.css('overflow-y','scroll').css('overflow-x','hidden');
							out=true;
						}
						if (j==0 && settings.scroller.current) {
							vplus=v;
							nplus.find('.ui-button-text').addClass('ui-state-active').addClass('ui-corner-all');
							nplus.addClass('ui-buttonsPlusMinus-current');
						} else {
							if (oplus<=settings.maxValue && !maxed) {
								vplus=oplus+cur_step;
								if (vplus>=settings.maxValue) {
									vplus=settings.maxValue;
									sc_up.button("disable");
									if (settings.scroller.upDownHideDisabled) sc_up.hide();
									maxed=true;
									if (oplus==vplus) vplus=undefined;
								}
								oplus=vplus;
							}
							if (ominus>=settings.minValue && !mined) {
								vminus=ominus-cur_step;
								if (vminus<=settings.minValue) {
									vminus=settings.minValue;
									sc_down.button("disable");
									if (settings.scroller.upDownHideDisabled) sc_down.hide();
									mined=true;
									if (ominus==vminus) vminus=undefined;
								}
								ominus=vminus;
							}
						}
						if (settings.scroller.valueStep=='increment' && cur_step<shift_step) cur_step++;
						if (vplus!==undefined) {
							nplus.find('.ui-button-text').text(vplus);
							nplus.attr('data-j',j);
							check_css(nplus, settings);
							_sc.prepend(nplus);	
							k++;
						}
						if (vminus!==undefined) {
							var nminus=$('<div class="ui-buttonsPlusMinus-value" />').button()
								.click(scroller_value_click);
							nminus.find('.ui-button-text').text(vminus);
							nminus.attr('data-j',-j);
							check_css(nminus, settings);
							_sc.append(nminus);	
							k++;
						}
						j++; 
						if (maxed && mined) break; /* exit cycle when all possible values printed (protection from infinite cycle) */
					}
					check_css(sc_up, settings);
					check_css(sc_down, settings);
					if (settings.scroller.upDown) {
						_sc.prepend(sc_up);
						_sc.append(sc_down);
					}
					var 
						frame=sc.find('.ui-buttonsPlusMinus-frame'),
						container=sc.find('.ui-buttonsPlusMinus-container')
					;

					container.width(container.outerWidth());
					frame.width(frame.width());
					sc.find('.ui-buttonsPlusMinus-wrapper').css('overflow-x','hidden').width( frame[0].scrollWidth );
					var 
						dm1=sc.find('[data-j=-1]'),
						dp1=sc.find('[data-j=1]'),
						vt=0,
						cur=sc.find('.ui-buttonsPlusMinus-current')
						cur_top=(cur.length>0) ? cur.position().top : 0;
						cur_bot=(cur.length>0) ? cur.position().top + cur.outerHeight(true): 0;
						_bot=(dm1.length>0) ? dm1.position().top : cur_bot,
						_top=(dp1.length>0) ? dp1.position().top + dp1.outerHeight(true) : cur_top
					;
					if (dm1.length==0) dm1=sc.find('[data-j=0]');
					if (dp1.length==0) dp1=sc.find('[data-j=0]');
					if (dm1.length==0 && dp1.length>0) dm1=dp1;
					if (dp1.length==0 && dm1.length>0) dp1=dm1;
					if (dp1.length!=0 && dm1.length!=0) {
						var center;
						if (settings.scroller.currentAlign=='top') {
							center=0;
						} else if (settings.scroller.currentAlign=='bottom') {
							center=2;
						} else {
							center=1;
						}						
						var 
							down=(center==2) ? sc.find('.ui-button').first().outerHeight(true) : 0;
							cur_h=(cur.length>0 && center!=1) ? cur.outerHeight(true) : 0
						;
						vt=(_bot + _top) / 2 
							- container.position().top - center*frame.outerHeight(true)/2 - cur_h/2 +  down;
					} 
					$('body').prepend(sc); /* not append - protection from sc rescroll due to ui-dialog changes it's position in DOM tree */
					frame.scrollTop( vt );
					sc.addClass('ui-front').zIndex(sc.zIndex()+1).removeClass('ui-front'); /*  no overflow by Jquery dialogs etc. */
					sc.position($.extend(settings.scroller.position,{ of: i})); 
					sc.click(function(e){
						e.preventDefault();
						e.stopPropagation();
					});
					if (settings.scroller.noDocumentScroll && !is_mobile()) {
						sc.mouseenter(function(e){
							$('body').css('overflow','hidden');
							$('body').on('mouseover', function body_mo(){
								$('body').css('overflow','');
								$(this).off('mouseover', body_mo);
							});
						}).mouseover(function(e){
							e.stopPropagation();
						});
					}
					sc.find('.ui-button').on('touchstart', function(){
						$(this).addClass('ui-state-hover');
					}).on('touchend touchmove touchcancel', function(){
						$(this).removeClass('ui-state-hover');
					});
					sc.on('touchend touchcancel', '*', mouseup_emulator);					
				}				
			});
			inpt.closest('.ui-buttonsPlusMinus').children('.ui-button').css('margin-right','0px');
			
			inpt.closest('.ui-buttonsPlusMinus').on('touchend touchcancel', '*', mouseup_emulator);
		}); 
        return this;

	}
}( jQuery ));

/**************************************************************************
 * Sliding Tabs jQuery Plugin
 * @info: http://www.codegrape.com/item/sliding-tabs-jquery-plugin/1774
 * @version: 1.0 (27/12/2016)
 * @requires: jQuery v1.7 or later (tested on 1.12.4)
 * @author: flashblue - http://www.codegrape.com/user/flashblue
**************************************************************************/

(function ($) {
	
	$.fn.slidingTabs = function(options) {
		
		//Default values
		var defaults = {
			responsive:false,
			totalWidth:"",
			totalHeight:"",
			externalLinking:false,
			touchSupport:false,
			urlLinking:false,
			useWebKit:true,
			viewportOffset:2560,
			
			//Orientation
			orientation:"horizontal",
			
			//Buttons function
			buttonsFunction:"slide",
			
			//Offset
			offsetBR:0,
			offsetTL:0,	
			
			//Tabs
			tabsAnimSpeed:300,
			tabsEasing:"",
			tabsLoop:false,
			tabsSaveState:false,
			tabsScroll:true,
			tabsShowHash:false,
			tabsSlideLength:0,
			tabsToSlide:1,
			
			//Ajax
			ajaxCache:true,
			ajaxError:"Failed to load content.",
			ajaxSpinner:false,
			
			//Auto play
			autoplay:false,
			autoplayClickStop:false,
			autoplayInterval:5000,
			
			//Auto height
			autoHeight:false,
			autoHeightSpeed:0,
			
			//CSS class names
			classAutoplayCont:"st_autoplay",
			classBtnDisabled:"st_btn_disabled",
			classBtnNext:"st_next",
			classBtnPrev:"st_prev",
			classExtLink:"st_ext",
			classNoTouch:"st_no_touch",
			classTab:"st_tab",
			classTabActive:"st_tab_active",
			classTabActiveParent:"st_li_active",
			classTabSlidingEnabled:"st_sliding_active",
			classTabsContainer:"st_tabs",
			classTabsList:"st_tabs_ul",
			classView:"st_view",
			classViewActive:"st_view_active",
			classViewInner:"st_view_inner",
			classViewsContainer:"st_views",
			classViewsInner:"st_views_wrap",
			
			//Content animation
			contentAnim:"slideH",
			contentAnimSpeed:600,
			contentEasing:"easeInOutExpo",
			
			//Event handlers
			onAjaxComplete:null,
			onContentVisible:null,
			onTabClick:null,
			onTabNextSlide:null,
			onTabPrevSlide:null
		};
		
		//Options
		var options = $.extend(true, {}, defaults, options);
		
		//Create tabs
		var tabs;
		var arr = new Array;
		
		this.each(function() {
			tabs = this;
			if (!tabs.slidingTabs) {
				tabs.slidingTabs = new SlidingTabs($(tabs), options);
			}
			arr.push(tabs.slidingTabs);
		});
		
		return arr.length>1 ? arr: arr[0];
	};
	
	if (!$.stExtend) {
		$.stExtend = {};
	}
	
	/********************
	    - Tab class -
	********************/	
	function SlidingTabs($obj, options) {
		
		//Variables
		this.$container = $obj;
		this.opt = options;		
		this.$tabsCont = this.$container.find("."+this.opt.classTabsContainer).first();
		this.$tabsInnerCont = this.$tabsCont.children("div");
		this.$tabs = this.$tabsInnerCont.children("ul").addClass(this.opt.classTabsList);
		this.$lis = this.$tabs.children("li");		
		this.$a = this.$lis.find("a").addClass(this.opt.classTab);
		if (!this.$a.length) {return false;}		
		this.$contentCont = this.$container.find("."+this.opt.classViewsContainer).first();
		this.$content = this.$contentCont;
		this.$views = this.$content.children("."+this.opt.classView);
		this.$prev = this.$tabsCont.find("."+this.opt.classBtnPrev);
		this.$next = this.$tabsCont.find("."+this.opt.classBtnNext);
		this.$doc = $(document);
		this.$tab;
		this.$tabActive = [];
		this.$li;
		this.$liLast;
		this.$view;
		this.$viewActive;
		this.val = {};
		this.e;
		this.margin = 0;		
		this.tabs = {};
		this.content = {};
		this.$container.addClass("sliding-tabs");
		this.isParent = this.$views.find(".sliding-tabs").length ? true : false;
		this.$parentViews = this.$container.parents("."+this.opt.classView);
		this.isChild = this.$parentViews.length > 0 ? true : false;
		this.tabs.total = this.$lis.length;
		this.content.animIsSlide = (this.opt.contentAnim=="slideH" || this.opt.contentAnim=="slideV") ? true : false;
		
		var that = this;
		var href, hrefBase, baseEl, slug;
		var fragmentId = /^#.+/;		
		
		//Links
		this.$a.each(function(i, a) {
			href = $(a).attr('href');
			hrefBase = href.split('#')[0];
			
			if (hrefBase && (hrefBase===location.toString().split("#")[0] || (baseEl = $("base")[0]) && hrefBase===baseEl.href)) {
				href = a.hash;
				a.href = href;
			}
			
			if (href && !fragmentId.test(href) && href!=="#") {
				$.data(a, "load.tabs", href.replace(/#.*$/, ""));
				slug = that.getTabSlug(this);
				a.href = "#"+slug;
				that.$view = that.$content.children("."+slug);
				
				if (!that.$view.length) {
					that.$view = $("<div />").addClass(slug+" "+this.opt.classView);
					that.$content.append(e.$view);
					that.$views = that.$views.add(that.$view);
				}
			} else {
				slug = $(a).attr("data-target");
								
				if (slug) {
					a.href = "#"+slug;
				}
			}
		});
		
		//Add CSS class
		this.$lis.first().addClass("st_li_first");
		this.$lis.last().addClass("st_li_last");
		this.$a.first().addClass("st_tab_first");
		this.$a.last().addClass("st_tab_last");
		this.$views.first().addClass("st_view_first");
		
		//Next
		if (!this.$next.length) {
			this.$next = $('<a href="#" class="'+this.opt.classBtnNext+'" />');
			this.$tabsCont.prepend(this.$next);
		}
		
		//Previous
		if (!this.$prev.length) {
			this.$prev = $('<a href="#" class="'+this.opt.classBtnPrev+'" />');
			this.$tabsCont.prepend(this.$prev);
		}
		
		//Touch enabled
		var touch = ("ontouchstart" in window);
		
		if (this.opt.touchSupport && touch) {
			this.val.isTouch = true;
		}
		
		//Browser
		var uaMatch = function(ua) {
			ua = ua.toLowerCase();
			var match = /(chrome)[ \/]([\w.]+)/.exec(ua) || 
					/(webkit)[ \/]([\w.]+)/.exec(ua) || 
					/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) || 
					/(msie) ([\w.]+)/.exec(ua) || 
					ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || 
					[];
			return {
				browser:match[1] || "",
				version:match[2] || "0"
			}
		};
		
		var matched = uaMatch(navigator.userAgent);		
		var browser = {};
		
		if (matched.browser) {
			browser[matched.browser] = true;
			browser.version = matched.version;
		}
		
		if (browser.chrome) {
			browser.webkit = true;
		} else if (browser.webkit) {
			browser.safari = true;
		}
		
		//Use webkit
		if (this.opt.useWebKit) {
			if (touch || browser.safari) {
				if (("WebKitCSSMatrix" in window) && ("m11" in new WebKitCSSMatrix())) {
					this.$container.addClass('st_webkit');
					this.val.useWebKit = true;
					
					if (!this.opt.tabsAnimSpeed) {
						this.opt.tabsAnimSpeed = 1;
					}
					
					if (!this.opt.contentAnimSpeed) {
						this.opt.contentAnimSpeed = 1;
					}
				}
			}
		}
		
		//Orientation
		if (this.opt.orientation=="horizontal") {
			this.$tabsInnerCont.css("overflow", "hidden");
			this.val.topleft = "left";
			this.val.outerWH = "outerWidth";
			this.val.WH = "width";
			this.val.clientXY = "clientX";
			this.val.arrPos = 4;
			
			if (this.val.useWebKit) {
				this.val.css = "-webkit-transform";
				this.val.pre = "translate3d(";
				this.val.px = "px,0px,0px)";
			} else {
				this.val.css = "marginLeft";
				this.val.pre = "";
				this.val.px = "px";
			}
		} else {
			this.val.topleft = "top";
			this.val.outerWH = "outerHeight";
			this.val.WH = "height";
			this.val.clientXY = "clientY";
			this.val.arrPos = 5;
			
			if (this.val.useWebKit) {
				this.val.css = "-webkit-transform";
				this.val.pre = "translate3d(0px,";
				this.val.px = "px,0px)";
			} else {
				this.val.css = "marginTop";
				this.val.pre = "";
				this.val.px = "px";
			}
			
			var prevBtnH = this.$prev.outerHeight(true);
			var nextBtnH = this.$next.outerHeight(true);
			
			this.val.buttonsH = (prevBtnH>=nextBtnH) ? prevBtnH : nextBtnH;
		}
		
		//Wait for images to load
		var that = this;
		
		this.$container.waitForImages(function() {
			//Resize width
			if (that.opt.totalWidth.length>0) {
				that.resizeWidth();
			}
			
			//Resize height
			if (that.opt.totalHeight.length>0) {
				that.resizeHeight();
			}
			
			//Init tabs
			that.initTabs();
			
			//Autoplay
			if (that.opt.autoplay && !that.xhr) {
				that.initAutoPlay();
			}
			
			$.each($.stExtend, function(i, tabs) {
				tabs.call(that);
			});
		});
	};
	
	SlidingTabs.prototype = {
		
		//Resize width
		resizeWidth:function() {
			if (this.opt.totalWidth=="auto") {
				this.$container.css("width", "100%");
			} else {
				this.$container.css("width", this.opt.totalWidth+"px");
			}
		},
		
		//Resize height
		resizeHeight:function() {
			var contentContOH = this.$contentCont.outerHeight(true)-this.$contentCont.height();
			var newContentHeight;
			
			if (this.opt.orientation=="vertical") {
				var tabsContOH = this.$tabsCont.outerHeight(false)-this.$tabsCont.height();
				newContentHeight = this.opt.totalHeight-contentContOH;
				this.$tabsCont.css("height", (this.opt.totalHeight-tabsContOH)+"px");
				this.$contentCont.css("height", newContentHeight+"px");
			} else {
				newContentHeight = this.opt.totalHeight-(this.$tabsCont.outerHeight(true)+contentContOH);
				this.$contentCont.css("height", newContentHeight+"px");
			}
			
			this.content.orgHeight = newContentHeight;
		},
		
		/***************
		    - Tabs -
		***************/
		
		//Init tabs
		initTabs:function() {
			var tabs = this.tabs;
			
			tabs.animated = "#"+this.$container.attr("id")+" ."+this.opt.classTabsList+":animated";
			tabs.loop = false;
			tabs.slugCount = this.$tabs.length;
			tabs.tabsContWH = this.$tabsCont[this.val.outerWH](false);
			tabs.tabsOH = this.$tabs.outerHeight(true);
			tabs.tabsOrgWidth = this.getTotalTabsLength();
			tabs.buttonsVisible = (this.$prev.is(":visible") || this.$next.is(":visible")) ? true : false;
			
			this.setTabSlideLength();
			this.posActiveTab();
			this.bindTabs();
		},
		
		//Get tab slug
		getTabSlug:function(a) {
			var slug = $(a).attr("data-target");
			return slug && slug.replace(/\s/g, "_").replace(/[^\w\u00c0-\uFFFF-]/g, "") || "tab-"+(this.total++);
		},
		
		//Set unique tab slug
		setUniqueTabSlug:function(slug) {
			var that = this;
			
			that.$a.each(function() {
				if ($(this).attr("href")=="#"+slug) {
					that.slugCount++;
					that.slug = "tab-"+that.slugCount;
					that.setUniqueTabSlug(that.slug);
					return;
				}
			})
		},
		
		//Get total tabs length
		getTotalTabsLength:function() {
			var that = this;
			var tabsTotWH = 0;
			
			that.$tabs.children("li").each(function() {
				tabsTotWH += parseInt($(this).css(that.val.WH));
			});
			
			return tabsTotWH;
		},
		
		//Set tab slide length
		setTabSlideLength:function() {
			if (!this.opt.tabsSlideLength) {
				if (this.opt.orientation=="horizontal") {
					this.val.tabsSlideLength = this.$tabsInnerCont.outerWidth(false);
				} else {
					var pos = this.$tabsInnerCont.position().top;
					
					if (this.$container.hasClass(this.opt.classTabSlidingEnabled)) {
						pos = !pos ? this.val.buttonsH : pos;
					}
					
					this.val.tabsSlideLength = parseInt(this.$tabsCont.css('height'))-pos;
				}
			} else {
				this.val.tabsSlideLength = this.opt.tabsSlideLength;
			}
		},
		
		//Bind tabs
		bindTabs:function() {
			var that = this;
			var hash;
			
			if (this.opt.responsive) {
				var timer = null;
				var limitXY;
				
				$(window).resize(function() {
					if (timer) {
						clearTimeout(timer);
					}
					
					timer = setTimeout(function() {
						if (that.$container.is(":hidden")) {
							return false;
						}
						
						if (that.opt.orientation=="horizontal") {
							that.setTabAutoWidth();
						} else {
							that.setTabAutoHeight();
						}
						
						if (that.opt.autoHeight && !that.isParent) {
							that.setContentHeight(true);
						}
					}, 100);
				})
			}
			
			this.$prev.click(function() {
				if (that.tabs.isAnim) {
					return false;
				}
				that[that.opt.buttonsFunction+"PrevTab"]();
				return false;
			}),
				
			this.$next.click(function() {
				if (that.tabs.isAnim) {
					return false;
				}
				that[that.opt.buttonsFunction+"NextTab"]();
				return false;
			}),
			
			this.$tabs.delegate("li a."+that.opt.classTab, "click", function() {
				if (that.tabs.isAnim) {
					return false;
				}
				that.clickTab(this, true);
				if (!that.opt.tabsShowHash) {
					return false;
				}
			});
			
			if ($.fn.mousewheel && that.opt.tabsScroll) {
				that.$tabs.mousewheel(function(e, delta) {
					if (that.tabs.isAnim) {
						return false;
					} (delta>0) ? that.slidePrevTab() : that.slideNextTab();
					return false;
				})
			}
			
			if (that.opt.externalLinking) {
				$("."+that.opt.classExtLink).each(function() {
					if ($(this).attr("rel")==that.$container.attr("id")) {
						$(this).click(function() {
							if (that.tabs.isAnim) {
								return false;
							}
							
							hash = that.getTabHash($(this));
							that.$tab = that.findTabByRel(hash);
							that.clickTab(that.$tab);
							
							if (!that.opt.tabsShowHash) {
								return false;
							}
						})
					}
				});
			}
		},
		
		//Set tab auto width
		setTabAutoWidth:function() {
			this.setTabSlideLength();
			var totalTabsW = this.getTotalTabsLength();
			var tabsContW = this.buttonsVisible ? parseInt(this.$tabsInnerCont.css("width")) : parseInt(this.$tabsCont.css("width"));
			
			if (this.$container.hasClass(this.opt.classTabSlidingEnabled)) {
				if (typeof(this.tabsDiff)=="undefined") {
					this.tabsDiff = this.tabs.tabsOrgWidth-totalTabsW;
				} else {
					if (this.tabsDiff<5) {
						totalTabsW += this.tabsDiff;
					}
				}
			}
			
			if (totalTabsW<=tabsContW) {
				this.margin = this.opt.offsetBR;
				this.hideTabButtons();
				this.$tabs.css(this.val.css, this.val.pre-this.margin+this.val.px);
			} else {
				var offset = parseInt(this.$tabsInnerCont.css("width"))-(this.$liLast.position().left+this.$liLast.outerWidth(false));
				
				if (offset>this.opt.offsetBR) {
					this.margin -= offset;
					this.posTabs();
					this.disableTabButton(this.$next);
					this.enableTabButton(this.$prev);
				} else {
					this.initTabButtons();
				}
				
				this.$container.addClass(this.opt.classTabSlidingEnabled);
				this.showTabButtons();
			}
			
			this.setTabSlideLength();
			
			if (this.val.isTouch) {
				this.setTabSwipeLength();
			}
		},
		
		//Set tab auto height
		setTabAutoHeight:function() {
			if (this.resizeTimer) {
				clearTimeout(this.resizeTimer);
			}
			
			var that = this;
			
			this.resizeTimer = setTimeout(function() {
				that.setTabSlideLength();
				
				if (that.$tabs.outerHeight(false) < that.$tabsCont.outerHeight(true)) {
					that.margin = (0 + that.opt.offsetBR);
					that.hideTabButtons();
					that.$tabs.css(that.val.css, that.val.pre-that.margin+that.val.px);
				} else {
					var li;
					var $liLast = that.$lis.last();
					var $unalignedLi;
					var gap = that.val.tabsSlideLength-($liLast.position().top+$liLast.outerHeight(false));
					var alignedTop = false;
					var alignedBottom = false;
					
					if (gap>that.opt.offsetBR) {
						that.margin -= gap;
						that.posTabs();
						that.disableTabButton(that.$next);
						that.enableTabButton(that.$prev)
					} else {
						that.$lis.each(function() {
							li = $(this);
							gap = li.position().top;
							
							if (gap==that.opt.offsetTL) {
								alignedTop = true;
							} else if ((gap+li.children('li').outerHeight(false))==(that.val.tabsSlideLength-that.opt.offsetBR)) {
								alignedBottom = true;
								return false;
							} else if (gap<0) {
								$unalignedLi = li;
							}
						});
						if (!alignedTop && !alignedBottom) {
							that.margin = (that.margin - Math.abs($unalignedLi.position().top));
							that.posTabs();
						}
						that.initTabButtons();
					}
					that.$container.addClass(that.opt.classTabSlidingEnabled);
					that.showTabButtons();
				}
				
				that.setTabSlideLength();
				
				if (that.val.isTouch) {
					that.setTabSwipeLength();
				}
			}, 200);
		},
		
		//Active tab position
		posActiveTab:function() {
			this.getActiveTab();
			this.initContent(true);
			this.$liLast = this.$tabs.children("li:last");
			this.$tab = this.$tabActive;
			this.$tabActive = this.$tabActive.parents("li");
			
			if ((this.$liLast[this.val.outerWH](false)+this.$liLast.position()[this.val.topleft])>this.val.tabsSlideLength) {
				this.$container.addClass(this.opt.classTabSlidingEnabled);
				this.showTabButtons();
				this.setTabSlideLength();
				this.setActiveTabPos(this.$tab[this.val.outerWH](false), this.$tabActive.position()[this.val.topleft]);
				
				if (!this.opt.tabsLoop) {
					this.initTabButtons();
				}
			}
		},
		
		//Set active tab position
		setActiveTabPos:function(width, pos) {
			this.val.elemD = width;
			this.val.elemP = pos;
			
			if (this.val.elemP>this.val.tabsSlideLength) {
				this.margin = (this.val.elemD+(this.val.elemP-this.val.tabsSlideLength))+this.opt.offsetBR;
			} else if ((this.val.elemP + this.val.elemD) > this.val.tabsSlideLength) {
				this.margin = (this.val.elemD-(this.val.tabsSlideLength-this.val.elemP))+this.opt.offsetBR;
			} else {
				this.margin -= this.opt.offsetTL;
			}
			
			this.posTabs();
		},
		
		//Tabs position
		posTabs:function() {
			if (this.val.useWebKit) {
				this.$tabs.css("-webkit-transition-duration", "0ms");
			}
			this.$tabs.css(this.val.css, this.val.pre-this.margin+this.val.px);
		},
		
		//Show appended tab
		showAppendedTab:function(show) {
			var len = this.getTotalTabsLength();
			
			if (len>(this.val.tabsSlideLength-this.opt.offsetBR)) {
				this.$container.addClass(this.opt.classTabSlidingEnabled);
				this.showTabButtons();
				this.setTabButtonState();
				this.setTabSlideLength();
				
				if (show) {
					len = this.getTotalTabsLength();
					this.margin = (len-this.val.tabsSlideLength)+this.opt.offsetBR;
					this.animateTab(300);
				}
			}
		},
		
		//Init tab buttons
		initTabButtons:function() {
			if (this.opt.buttonsFunction=="slide" && !this.opt.tabsLoop) {
				if (this.$lis.first().position()[this.val.topleft]==this.opt.offsetTL) {
					this.disableTabButton(this.$prev);
				} else {
					this.enableTabButton(this.$prev);
				}
				
				if ((this.$liLast.position()[this.val.topleft]+this.$liLast[this.val.outerWH](false))<=(this.val.tabsSlideLength-this.opt.offsetBR)) {
					this.disableTabButton(this.$next);
				} else {
					this.enableTabButton(this.$next);
				}
			} else {
				this.setTabButtonState();
			}
		},
		
		//Enable tab button
		enableTabButton:function(btn) {
			btn.removeClass(this.opt.classBtnDisabled);
		},
		
		//Disable tab button
		disableTabButton:function(btn) {
			btn.addClass(this.opt.classBtnDisabled);
		},
		
		//Show tab buttons
		showTabButtons:function() {
			this.$prev.css("display", "block");
			this.$next.css("display", "block");
			
			if (typeof(this.tabsDiff)=="undefined") {
				var totalTabsW = this.getTotalTabsLength();
				this.tabsDiff = Math.abs(this.tabs.tabsOrgWidth-totalTabsW);
			}
		},
		
		//Hide tab buttons
		hideTabButtons:function() {
			this.$container.removeClass(this.opt.classTabSlidingEnabled);
			this.$prev.hide();
			this.$next.hide();
		},
		
		//Click tab
		clickTab:function(tab, play, speed, loop) {
			if (this.content.isAnim || this.proccessing) {
				return false;
			}
			
			this.$tab = $(tab);
			
			if (this.$tab.hasClass(this.opt.classTabActive)) {
				return false;
			}
			
			if (typeof(this.opt.onTabClick)=="function") {
				this.opt.onTabClick.call(this, this.$tab);
			}
			
			var url = $.data(this.$tab[0], "load.tabs");
			
			this.$li = this.$tab.parents("li");
			this.setActiveTab();
			this.val.elemP = this.$li.position();
			this.val.activeElemP = this.$tabActive.parent("li").position();
			this.isSwipe = speed ? true : false;
			this.slideClickedTab();
			
			if (this.opt.autoplay) {
				if (play) {
					if (this.opt.autoplayClickStop) {
						this.opt.autoplay = false;
						this.clearAutoPlayInterval();
					} else {
						this.val.index = this.$tab.parents("li").index();
						
						if (!this.isPause) {
							this.setAutoPlayInterval();
						}
					}
				}
			}
			
			this.tabs.loop = loop ? loop : false;
			
			if (url) {
				this.loadTab(this.$tab, url, speed, true);
			} else {
				this.showTab(this.$tab, speed);
			}
		},
		
		//Load tab
		loadTab:function(tab, url, speed, show) {
			this.proccessing = true;
			
			if (this.xhr) {
				this.xhr.abort();
				delete this.xhr;
			}
			
			if (this.opt.autoplay) {
				this.clearAutoPlayInterval();
			}
			
			if (this.opt.ajaxSpinner) {
				this.$container.append('<span id="st_spinner"></span>');
			}
			
			var that = this;
			
			this.xhr = $.ajax({
				url:url,
				dataType:"html",
				success:function(data) {
					$(that.$views[tab.parent("li").index()]).html('<div class="'+that.opt.classViewInner+'">'+data+'</div>');
					
					if (that.opt.ajaxCache) {
						tab.removeData("load.tabs");
					}
					
					if (typeof(that.opt.onAjaxComplete)=="function") {
						that.opt.onAjaxComplete.call(that, tab);
					}
				},
				error:function() {
					$(that.$views[tab.parent("li").index()]).html('<div class="'+that.opt.classViewInner+'">'+that.opt.ajaxError+'</div>');
				},
				complete:function() {
					if (show) {
						that.showTab(tab, speed);
					} else {
						if (that.opt.autoHeight) {
							that.setContentHeight(false);
						}
					}
					
					that.proccessing = false;
					that.xhr = false;
					$("#st_spinner").remove();
					
					if (that.opt.autoplay) {
						that.val.index = tab.parents("li").index();
						that.setAutoPlayInterval();
					}
				}
			});
		},
		
		//Show tab
		showTab:function(tab, speed) {
			this.setContentIsAnim(true, "pause");
			this.val.hash = this.getTabHash(tab);
			this.$viewActive = this.$content.children("."+this.opt.classViewActive).removeClass(this.opt.classViewActive);
			this.$view = this.$content.children("."+this.val.hash).addClass(this.opt.classViewActive);
			this.$currentView = this.$view;
			
			if (this.opt.autoHeight) {
				this.setContentHeight(true);
			}
			
			if (this.val.useWebKit && this.content.animIsSlide) {
				this.bindContentWebKitCallback();
			}
			
			if (speed>0 && this.content.isTouch) {
				this[this.opt.contentAnim+"Content"](speed);
			} else {
				if (this.opt.contentAnim.length > 0) {
					this[this.opt.contentAnim+"Content"](speed);
				} else {
					this.$viewActive.css({position:"absolute", visibility:"hidden"});
					this.$view.css({position:"static", visibility:"visible"});
					this.content.isAnim = false;
				}
			}
		},
		
		//Click previous tab
		clickPrevTab:function() {
			if (this.tabs.isAnim || $(this.content.animated).length) {
				return false;
			}
			
			this.val.$prevTab = this.findTab("prev");
			
			if (this.val.$prevTab.length) {
				this.clickTab(this.val.$prevTab, true);
			} else {
				if (this.opt.tabsLoop) {
					this.clickTab(this.$tabs.children("li").find("a").last(), true, 0, "prev");
				}
			}
		},
		
		//Click next tab
		clickNextTab:function() {
			if (this.tabs.isAnim || $(this.content.animated).length) {
				return false;
			}
			
			this.val.$nextTab = this.findTab("next");
			
			if (this.val.$nextTab.length) {
				this.clickTab(this.val.$nextTab, true);
			} else {
				if (this.opt.tabsLoop) {
					this.clickTab(this.$tabs.children("li").find("a").first(), true, 0, "next");
				}
			}
		},
		
		//Find tab
		findTab:function(tab) {
			return this.$tab.parents("li")[tab]().find("a."+this.opt.classTab);
		},
		
		//Find tab by rel
		findTabByRel:function(tab) {
			return this.$tabs.find('[rel='+tab+']');
		},
		
		//Get tab hash
		getTabHash:function(tab) {
			this.val.hash = tab.attr('href');
			return this.val.hash.substring((this.val.hash.indexOf('#')+1));
		},
		
		//Get active tab
		getActiveTab:function() {
			if (this.opt.urlLinking && location.hash) {
				this.$tabActive = this.findTabByRel(location.hash.slice(1));
			}
			
			if (!this.$tabActive.length) {
				var cookie = (this.opt.tabsSaveState && $.cookie) ? $.cookie(this.$container.attr('id')) : false;
				
				if (cookie) {
					this.removeActiveTab();
					this.$tabActive = this.$a.eq(cookie).addClass(this.opt.classTabActive);
					if (!this.$tabActive.length) {
						this.setFirstActiveTab();
					}
				} else {
					this.$tabActive = this.$tabs.children("li").find("."+this.opt.classTabActive);
					if (!this.$tabActive.length) {
						this.setFirstActiveTab();
					}
				}
				this.$tabActive.parent("li").addClass(this.opt.classTabActiveParent);
			} else {
				this.removeActiveTab();
				this.$tabActive.addClass(this.opt.classTabActive).parent("li").addClass(this.opt.classTabActiveParent);
			}
			
			this.saveActiveTab(this.$tabActive);
		},
		
		//Set first active tab
		setFirstActiveTab:function() {
			this.$tabActive = this.$tabs.find("a:first").addClass(this.opt.classTabActive);
		},
		
		//Remove active tab
		removeActiveTab:function() {
			this.$tabs.children("li").find("."+this.opt.classTabActive).removeClass(this.opt.classTabActive).parent("li").removeClass(this.opt.classTabActiveParent);
		},
		
		//Set active tab
		setActiveTab:function() {
			this.$tabActive = this.$tabs.children("li").find("a."+this.opt.classTabActive).removeClass(this.opt.classTabActive);
			this.$tabActive.parent("li").removeClass(this.opt.classTabActiveParent);
			this.$tab.addClass(this.opt.classTabActive).parent("li").addClass(this.opt.classTabActiveParent);
			this.saveActiveTab(this.$tab);
		},
		
		//Save active tab to cookie
		saveActiveTab:function(tab) {
			if ($.cookie) {
				$.cookie(this.$container.attr('id'), tab.parents('li').index());
			}
		},
		
		//Slide clicked tab
		slideClickedTab:function() {
			if (this.tabs.isAnim) {
				return false;
			}
			
			this.val.elemP = this.val.elemP[this.val.topleft];
			this.val.elemD = this.$li[this.val.outerWH](false);
			this.val.aD = this.$li.children('a')[this.val.outerWH](false);
			this.val.nextElemPos = this.$li.next().length==1 ? this.$li.next().position()[this.val.topleft] : 0;
			
			if (this.val.elemP<this.opt.offsetTL) {
				this.tabs.isAnim = true;
				this.val.elemHidden = this.val.elemD-this.val.nextElemPos;
				this.margin -= (this.val.elemHidden + this.opt.offsetTL);
				this.enableTabButton(this.$next);
				this.animateTab();
			} else if ((this.val.aD+this.val.elemP)>(this.val.tabsSlideLength-this.opt.offsetBR)) {
				this.tabs.isAnim = true;
				this.margin += (this.val.aD-(this.val.tabsSlideLength-(this.val.elemP+this.opt.offsetBR)));
				this.enableTabButton(this.$prev);
				this.animateTab();
			}
			
			this.setTabButtonState();
		},
		
		//Slide previous tab
		slidePrevTab:function(tab) {
			if ($(this.tabs.animated).length || !this.$container.hasClass(this.opt.classTabSlidingEnabled)) {
				return false;
			}
			
			this.tabs.isAnim = true;
			
			if (typeof(this.opt.onTabPrevSlide)=="function") {
				this.opt.onTabPrevSlide.call(this, this.$tab);
			}
			
			var that = this;
			var $lis = this.$tabs.children("li");
			
			$lis.each(function() {
				that.$li = $(this);
				that.val.elemP = that.$li.position()[that.val.topleft];
				
				if (that.val.elemP>=(that.opt.offsetTL-1)) {
					if (that.opt.tabsToSlide>1) {
						var ind = that.$li.index(),
						index = ((ind - that.opt.tabsToSlide)),
						isFirst = (ind > 0) ? 1 : 0;
						index = (index < 0) ? isFirst: (index + 1);
						that.$li = $lis.eq(index);
						that.val.elemP = that.$li.position()[that.val.topleft];
					}
					
					that.$li = that.$li.prev();
					
					if (!that.$li.length) {
						if (that.opt.tabsLoop && typeof(tab)=="undefined") {
							that.$liLast = $lis.last();
							that.val.elemP = that.$liLast.position()[that.val.topleft];
							that.margin = ((((that.val.elemP+that.$liLast[that.val.outerWH](false))-that.opt.offsetTL)-that.val.tabsSlideLength)+that.opt.offsetBR);
							that.$li = that.$liLast;
						} else {
							that.tabs.isAnim = false;
						}
					} else {
						that.val.elemHidden = (that.$li[that.val.outerWH](true)-that.val.elemP);
						that.margin = ((that.margin - that.val.elemHidden)-that.opt.offsetTL);
					}
					
					if (that.$li.length) {
						that.animateTab(tab);
					}
					
					if (that.opt.buttonsFunction=="slide") {
						that.setTabButtonState(that.$next);
					}
					
					return false;
				}
			});
		},
		
		//Slide next tab
		slideNextTab:function(tab) {
			if ($(this.tabs.animated).length || !this.$container.hasClass(this.opt.classTabSlidingEnabled)) {
				return false
			}
			this.tabs.isAnim = true;
			if (typeof(this.opt.onTabNextSlide)=="function") {
				this.opt.onTabNextSlide.call(this, this.$tab);
			}
			
			var that = this;
			var $lis = this.$tabs.children("li");
			var $thisA;
			
			$lis.each(function() {
				that.$li = $(this);
				$thisA = that.$li.children("a");
				that.val.elemD = $thisA[that.val.outerWH](false);
				that.val.elemP = that.$li.position()[that.val.topleft];
				
				if (Math.round(that.val.elemD+that.val.elemP)>(that.val.tabsSlideLength+Math.abs(that.opt.offsetBR))) {
					if (that.opt.tabsToSlide > 1) {
						that.$li = $lis.eq((that.$li.index()+that.opt.tabsToSlide)-1);
						
						if (!that.$li.length) {
							that.$li = $lis.last();
						}
						
						$thisA = that.$li.children("a");
						that.val.elemD = $thisA[that.val.outerWH](false);
						that.val.elemP = that.$li.position()[that.val.topleft]
					}
					
					that.val.elemHidden = (that.val.tabsSlideLength-that.val.elemP);
					that.margin += ((that.val.elemD-that.val.elemHidden)+that.opt.offsetBR);
					that.animateTab(tab);
					
					if (that.opt.buttonsFunction=="slide") {
						that.setTabButtonState(that.$prev);
					}
					
					return false;
				} else if (that.$li.index()+1==that.$a.length) {
					if (that.opt.tabsLoop && typeof(tab)=="undefined") {
						that.margin = -that.opt.offsetTL;
						that.animateTab(tab);
						
						if (that.opt.buttonsFunction=="slide") {
							that.setTabButtonState(that.$prev);
						}
					} else {
						that.tabs.isAnim = false;
					}
				}
			});
		},
		
		//Animate tab
		animateTab:function(speed) {
			var that = this;
			var animSpeed = (speed>0) ? speed: this.opt.tabsAnimSpeed;
			
			if (this.val.useWebKit) {
				this.bindTabWebKitCallback();
				this.$tabs.css({
					"-webkit-transition-duration": animSpeed+"ms",
					"-webkit-transition-timing-function":"ease-out",
					"-webkit-transform":this.val.pre+(-this.margin)+this.val.px
				})
			} else {
				if (this.opt.orientation=="horizontal") {
					this.$tabs.animate({"marginLeft":-this.margin+"px"}, animSpeed, this.opt.tabsEasing, function() {
						that.setTabIsAnim(false, "resume");
					});
				} else {
					this.$tabs.animate({"marginTop":-this.margin+"px"}, animSpeed, this.opt.tabsEasing, function() {
						that.setTabIsAnim(false, "resume");
					});
				}
			}
		},
		
		//Set tab button state
		setTabButtonState:function(btn) {
			if (!this.opt.tabsLoop) {
				if (this.opt.buttonsFunction=="click") {
					this.$li = this.$tab.parents("li");
				}
				
				if (this.$li.is(":first-child")) {
					this.disableTabButton(this.$prev);
					this.enableTabButton(this.$next);
				} else if (this.$li.is(":last-child")) {
					this.disableTabButton(this.$next);
					this.enableTabButton(this.$prev);
				} else {
					if (btn) {
						this.enableTabButton(btn);
					} else if (this.opt.buttonsFunction=="click") {
						this.enableTabButton(this.$prev);
						this.enableTabButton(this.$next);
					}
				}
			}
		},
		
		//Fix IE
		tabFixE:function(e) {
			if (typeof e=="undefined") e = window.event;
			if (typeof e.layerX=="undefined") e.layerX = e.offsetX;
			if (typeof e.layerY=="undefined") e.layerY = e.offsetY;
			return e;
		},
		
		//Tab webkit position
		tabWebKitPosition:function(tab, arrPos) {
			var cls = window.getComputedStyle(tab.get(0), null).getPropertyValue('-webkit-transform');
			var wkValArray = cls.replace(/^matrix\(/i, '').split(/, |\)$/g);
			var val = parseInt(wkValArray[arrPos], 10);
			return isNaN(val) ? 0 : val;
		},
		
		//Bind tab webkit callback
		bindTabWebKitCallback:function() {
			var that = this;
			
			this.$tabs.unbind("webkitTransitionEnd").bind("webkitTransitionEnd", function() {
				that.setTabIsAnim(false, "resume");
			})
		},
		
		//Set tab is anim
		setTabIsAnim:function(anim, func) {
			this.tabs.isAnim = anim;
			
			if (this.opt.autoplay) {
				this[func+"AutoPlay"](false, true);
			}
		},
		
		/******************
		    - Content -
		******************/
		initContent:function(animate) {
			var content = this.content;
			
			if (this.opt.contentAnim=="slideV") {
				content.owh = "outerHeight";
				content.wh = "height";
				content.clientXY = "clientY";
				content.arrPos = 5;
				
				if (this.val.useWebKit) {
					content.css = "-webkit-transform";
					content.pre = "translate3d(0px,";
					content.px = "px,0px)";
				} else {
					content.css = "top";
					content.pre = "";
					content.px = "px";
				}
			} else {
				content.owh = "outerWidth";
				content.wh = "width";
				content.clientXY = "clientX";
				content.arrPos = 4;
				
				if (this.val.useWebKit) {
					content.css = "-webkit-transform";
					content.pre = "translate3d(";
					content.px = "px,0px,0px)";
				} else {
					content.css = "left";
					content.pre = "";
					content.px = "px";
				}
			}
			
			content.isAnim = false;
			content.dist = 0;
			
			if (animate) {
				content.animated = "#"+this.$container.attr("id")+" ."+this.opt.classViewsContainer+" :animated";
				content.orgHeight = 0;
				content.height = 0;
				
				
				this.showActiveContent();
				
				var url = $.data(this.$tabActive[0], "load.tabs");
				
				if (url) {
					this.loadTab(this.$tabActive, url);
				}
			}
		},
		
		//Re-init content
		reInitContent:function() {
			this.content.oldCSS = this.content.css;
			this.initContent(false);
			
			if (this.val.useWebKit) {
				this.$views.css("-webkit-transition-duration", "");
			}
			
			this.$views.css(this.content.oldCSS, "").css("visibility", "");
			
			this.positionContent();
		},
		
		//Show active content
		showActiveContent:function() {
			var hash = this.getTabHash(this.$tabActive);
			this.$view = this.$content.children("."+hash).addClass(this.opt.classViewActive);
			this.$currentView = this.$view;
			
			if (this.opt.autoHeight) {
				var $viewInner = this.$view.children("."+this.opt.classViewInner).css("height", "auto");
				
				if ($viewInner.length) {
					this.content.height = $viewInner.outerHeight(true);
				} else {
					this.$views.css("height", "auto");
					this.content.height = this.$view.outerHeight(true);
				}
				
				this.content.orgHeight = this.content.height;
				this.$content.css('height', this.content.height+"px");
			}
			
			this.positionContent();
		},
		
		//Position content
		positionContent:function() {
			if (this.opt.contentAnim) {
				if (this.val.useWebKit) {
					this.$views.css("-webkit-transition-duration", "0ms");
					this.$view.css(this.content.css, this.content.pre+"0"+this.content.px);
				}
				
				this.$content.children("div").css("position", "absolute").not("div."+this.opt.classViewActive)
											 .css(this.content.css, this.content.pre+this.opt.viewportOffset+this.content.px);
			} else {
				this.$views.not("div."+this.opt.classViewActive).css({position:"absolute", visibility:"hidden"});
			}
		},
		
		//Re-position content view
		rePositionContentView:function() {
			if (this.val.useWebKit) {
				this.$views.css("-webkit-transition-duration", "0ms");
			}
			
			this.$viewActive.css(this.content.css, this.content.pre+this.opt.viewportOffset+this.content.px).show();
			
			if (this.isSwipe) {
				var view = (this.$currentView.index()>this.$viewActive.index()) ? this.$viewActive.prev() : this.$viewActive.next();
				view.css(this.content.css, this.content.pre+this.opt.viewportOffset+this.content.px).show();
			}
		},
		
		//Set content parents height
		setContentParentsHeight:function(animate) {
			var that = this,
			$this, $content, $viewInner, total = that.$parentViews.length,
			isLast, height;
			
			this.$parentViews.each(function(i) {
				$this = $(this);
				$content = $this.parent();
				isLast = ((i+1)==total) ? true : false;
				
				if (isLast) {
					if (!$this.hasClass(that.opt.classViewActive)) {
						return false;
					}
				}
				
				$viewInner = $content.children("."+that.opt.classViewActive).children("."+that.opt.classViewInner).css("height", "auto");
				height = that.getContentHeight($viewInner, $this);
				
				if (isLast && that.opt.autoHeightSpeed>0 && animate) {
					$content.animate({"height":height+"px"}, that.opt.autoHeightSpeed);
				} else {
					$content.css("height", height+"px");
				}
			});
		},
		
		//Set content height
		setContentHeight:function(animate) {
			this.$view.css("height", "auto");
			var $viewInner = this.$view.children("."+this.opt.classViewInner).css("height", "auto");
			this.content.height = this.getContentHeight($viewInner, this.$view);
			
			if (!this.isChild && this.opt.autoHeightSpeed>0 && animate) {
				this.$content.animate({"height":this.content.height+"px"}, this.opt.autoHeightSpeed);
			} else {
				this.$content.css("height", this.content.height+"px");
				
				if (this.isChild) {
					this.setContentParentsHeight(animate);
				}
			}
		},
		
		//Get content height
		getContentHeight:function($viewInner, view) {
			var height = $viewInner.outerHeight(true);
			
			if (!height || height==null) {
				height = view.outerHeight(true);
				
				if (!height) {
					height = this.content.orgHeight;
				}
			}
			
			return height;
		},
		
		//Reset content auto height
		resetContentAutoHeight:function() {
			this.$contentCont.removeAttr("style");
			this.$content.removeAttr("style");
			this.$view.children("."+this.opt.classViewInner).removeAttr("style");
		},
		
		//Fade content
		fadeContent:function() {
			var that = this;
			
			this.$view.hide().css(this.content.css, this.content.pre+0+this.content.px).fadeIn(this.opt.contentAnimSpeed, function() {
				that.setContentIsAnim(false, "resume");
				if (typeof(that.opt.onContentVisible)=="function") {
					that.opt.onContentVisible.call(that, that.$tab);
				}
			});
			
			this.$viewActive.fadeOut(this.opt.contentAnimSpeed, function() {
				that.rePositionContentView();
			});
		},
		
		//Fade out-in content
		fadeOutInContent:function() {
			var that = this;
			
			this.$view.hide().css(that.content.css, that.content.pre+0+that.content.px);
			
			this.$viewActive.fadeOut(this.opt.contentAnimSpeed, function() {
				that.$view.fadeIn(that.opt.contentAnimSpeed, function() {
					that.rePositionContentView();
					that.setContentIsAnim(false, "resume");
				});
				
				if (typeof(that.opt.onContentVisible)=="function") {
					that.opt.onContentVisible.call(that, that.$tab);
				}
			});
		},
		
		//Webkit slide content
		webKitSlideContent:function(speed, ease) {
			this.$viewActive.css({
				"-webkit-transition-duration":speed+"ms",
				"-webkit-transition-timing-function":ease,
				"-webkit-transform":this.content.pre+this.val.animVal+this.content.px
			});
			
			this.$view.css({
				"-webkit-transition-duration":speed+"ms",
				"-webkit-transition-timing-function":ease,
				"-webkit-transform":"translate3d(0px,0px,0px)"
			});
		},
		
		//Bind content webkit callback
		bindContentWebKitCallback:function(slide) {
			var that = this;
			
			this.$currentView.bind("webkitTransitionEnd", function() {
				that.$currentView.unbind("webkitTransitionEnd");
				
				if (slide) {
					that.slideContentBackRePos();
				} else {
					that.rePositionContentView();
				}
				
				that.setContentIsAnim(false, "resume");
				
				if (typeof(that.opt.onContentVisible)=="function") {
					that.opt.onContentVisible.call(that, that.$tab);
				}
			});
		},
		
		//Slide horizontal content
		slideHContent:function(speed) {
			var that = this;
			this.val.wh = this.$contentCont.width();
			this.setContentSlideValues();
			
			if (this.val.useWebKit) {
				if (speed>0) {
					this.webKitSlideContent(speed, "ease-out");
				} else {
					this.$view.css({
						"-webkit-transition-duration":"0ms",
						"-webkit-transform":"translate3d("+this.val.cssVal+"px,0px,0px)"
					});
					
					setTimeout(function() {
						that.webKitSlideContent(that.opt.contentAnimSpeed, "ease-in-out");
					}, 30);
				}
			} else {
				if (speed>0) {
					this.val.easing = "easeOutSine";
				} else {
					this.$view.css("left", that.val.cssVal);
					speed = that.opt.contentAnimSpeed;
					that.val.easing = that.opt.contentEasing;
				}
				
				this.$viewActive.animate({"left":this.val.animVal}, speed, this.val.easing);
				
				this.$view.animate({"left":"0px"}, speed, this.val.easing, function() {
					that.rePositionContentView();
					that.setContentIsAnim(false, "resume");
					
					if (typeof(that.opt.onContentVisible)=="function") {
						that.opt.onContentVisible.call(that, that.$tab);
					}
				});
			}
		},
		
		//Slide vertical content
		slideVContent:function(speed) {
			var that = this;
			this.val.wh = this.$contentCont.height();
			
			if (this.content.height>this.val.wh) {
				this.val.wh = this.content.height;
			}
			
			this.setContentSlideValues();
			
			if (this.val.useWebKit) {
				if (speed>0) {
					this.webKitSlideContent(speed, "ease-out");
				} else {
					this.$view.css({
						"-webkit-transition-duration": "0ms",
						"-webkit-transform":"translate3d(0px,"+that.val.cssVal+"px,0px)"
					});
					
					setTimeout(function() {
						that.webKitSlideContent(that.opt.contentAnimSpeed, "ease-in-out");
					}, 30);
				}
			} else {
				if (speed>0) {
					this.val.easing = "easeOutSine";
				} else {
					this.$view.css("top", that.val.cssVal);
					speed = that.opt.contentAnimSpeed;
					this.val.easing = this.opt.contentEasing;
				}
				
				this.$viewActive.animate({"top":that.val.animVal}, speed, this.val.easing);
				
				this.$view.animate({"top":"0px"}, speed, this.val.easing, function() {
					that.rePositionContentView();
					that.setContentIsAnim(false, "resume");
					if (typeof(that.opt.onContentVisible)=="function") {
						that.opt.onContentVisible.call(that, that.$tab);
					}
				});
			}
		},
		
		//Set content slide values
		setContentSlideValues:function() {
			if (this.tabs.loop!=false) {
				this.content.isNext = (this.tabs.loop=="next") ? true : false;
			} else {
				this.content.isNext = (this.$viewActive.index()<this.$view.index()) ? true : false;
			}
			
			if (this.content.isNext) {
				this.val.animVal = -this.val.wh;
				this.val.cssVal = this.val.wh;
			} else {
				this.val.animVal = this.val.wh;
				this.val.cssVal = -this.val.wh;
			}
		},
		
		//Set content is anim
		setContentIsAnim:function(anim, func) {
			this.content.isAnim = anim;
			
			if (this.opt.autoplay) {
				this[func+"AutoPlay"](false, true);
			}
		},
		
		/*******************
		    - Autoplay -
		*******************/
		
		//Init autoplay
		initAutoPlay:function() {
			this.val.index = (this.$tabActive.index()>=0) ? this.$tabActive.index() : 0;
			this.isPause = false;
			this.setAutoPlayInterval();
		},
		
		//Set autoplay interval
		setAutoPlayInterval:function() {
			var that = this;
			
			this.clearAutoPlayInterval();
			
			this.intervalId = setInterval(function() {
				that.nextAutoPlayTab();
			}, this.opt.autoplayInterval);
		},
		
		//Clear autoplay interval
		clearAutoPlayInterval:function() {
			clearInterval(this.intervalId);
		},
		
		//Next autoplay tab
		nextAutoPlayTab:function() {
			if (!this.$container.is(":visible")) {
				this.clearAutoPlayInterval();
				return false;
			}
			
			this.val.index++;
			
			if (this.val.index==this.$a.length) {
				this.val.index = 0;
			}
			
			if (this.opt.tabsLoop) {
				this.clickTab($(this.$a[this.val.index]), false, 0, "next");
			} else {
				this.clickTab($(this.$a[this.val.index]));
			}
		},
		
		//Pause autoplay
		pauseAutoPlay:function(pause) {
			if (pause) {
				this.opt.autoplay = false;
			}
			
			this.isPause = true;
			
			this.clearAutoPlayInterval();
		},
		
		//Resume autoplay
		resumeAutoPlay:function(resume) {
			if (resume) {
				this.opt.autoplay = true;
			}
			
			this.isPause = false;
			
			this.setAutoPlayInterval();
		},
		
		/************************
		    - API functions -
		************************/
		
		//Add tab
		addTab:function(tab, content, show) {
			var tabs = this.tabs;
			
			if ($(tabs.animated).length) {
				return false;
			}
			
			tabs.total++;
			tabs.slug = "tab-"+tabs.total;
			
			this.setUniqueTabSlug(tabs.slug);
			this.$a.last().removeClass("st_tab_last").parents("li").removeClass("st_li_last");
			this.$tabs.append('<li><a href="#'+tabs.slug+'" rel="'+tabs.slug+'" class="'+this.opt.classTab+' st_tab_'+tabs.total+'">'+tab+'</a></li>');
			this.$content.append('<div class="'+tabs.slug+' '+this.opt.classView+'"><div class="'+this.opt.classViewInner+'">'+content+'</div></div>');
			this.$lis = this.$tabs.children("li");
			this.$li = this.$lis.last();
			this.$liLast = this.$li;
			this.$a = this.$lis.find("a");
			this.$views = this.$content.children("."+this.opt.classView);
			
			if (tabs.total==1) {
				this.$content.children("div").addClass(this.opt.classViewActive).css("position", "absolute").css(this.content.css, this.content.pre+"0"+this.content.px);
				this.$a.addClass("st_tab_first "+this.opt.classTabActive).parent("li").addClass("st_li_first "+this.opt.classTabActiveParent);
			} else {
				var cls = {};
				cls["position"] = "absolute";
				
				if (this.opt.contentAnim) {
					cls[this.content.css] = this.content.pre+this.opt.viewportOffset+this.content.px;
				} else {
					cls["visibility"] = "hidden";
				}
				
				this.$content.children("div").last().css(cls);
				this.$a.last().addClass("st_tab_last").parent("li").addClass("st_li_last");
			}
			
			tabs.tabsOrgWidth = this.getTotalTabsLength();
			this.showAppendedTab(show);
			
			if (this.val.isTouch) {
				this.setTabSwipeLength();
				if (this.content.animIsSlide) {
					this.bindContentTouch();
				}
			}
		},
		
		//Remove tab
		removeTab:function(i) {
			if ($(this.content.animated).length) {
				return false;
			}
			
			var len = this.$tabs.children("li").length;
			i = i>=1 ? i-1 : len-1;
			this.$li = this.$tabs.children("li").eq(i);
			
			if (this.$li.children("a").hasClass(this.opt.classTabActive)) {
				var tab;
				
				if (!i) {
					tab = this.$li.next().addClass("st_li_first");
					tab = tab.length>0 ? tab.children("a").addClass("st_tab_first") : this.$li.children("a");
				} else {
					tab = this.$li.prev().children("a");
				}
				
				this.val.hash = this.getTabHash(tab);
				tab.parents("li").addClass(this.opt.classTabActiveParent);
				tab.addClass(this.opt.classTabActive);
				this.$view = this.$content.children("."+this.val.hash).show().css(this.content.css, this.content.pre+"0"+this.content.px).addClass(this.opt.classViewActive);
				this.$currentView = this.$view;
				
				if (this.opt.autoHeight) {
					this.setContentHeight(true);
				}
				
				this.$tab = this.$li.prev().children("a."+this.opt.classTab);
			}
			
			if (this.$li.hasClass("st_li_last")) {
				this.$li.prev().addClass("st_li_last").children("a").addClass("st_tab_last");
			}
			
			this.$li.remove();
			this.$content.children("div").eq(i).remove();
			var totalTabsW = this.getTotalTabsLength();
			
			if (totalTabsW>this.$tabsCont[this.val.outerWH](false)-this.opt.offsetBR) {
				this.margin = totalTabsW - this.val.tabsSlideLength+this.opt.offsetBR;
				
				if (this.opt.buttonsFunction=="slide") {
					this.enableTabButton(this.$prev);
					this.disableTabButton(this.$next)
				} else {
					if ((len-2)==this.$tab.parents("li").index()) {
						this.disableTabButton(this.$next);
					}
				}
			} else {
				this.margin = 0;
				this.$prev.hide();
				this.$next.hide();
				this.$container.removeClass(this.opt.classTabSlidingEnabled);
				this.tabs.tabsOrgWidth = this.getTotalTabsLength();
				this.setTabSlideLength();
			}
			
			this.animateTab(300);
			this.$lis = this.$tabs.children("li");
			this.$liLast = this.$lis.last();
			this.$a = this.$lis.find("a");
			this.$views = this.$content.children("."+this.opt.classView);
			this.tabs.total = this.$a.length;
			
			if (this.val.isTouch) {
				this.setTabSwipeLength();
			}
		},
		
		//Go to tab
		goTo:function(i) {
			var tab = this.$a.eq(i-1);
			if (tab.length) {
				this.clickTab(tab);
			}
		},
		
		//Go to previous tab
		goToPrev:function() {
			this.clickPrevTab();
		},
		
		//Go to next tab
		goToNext:function() {
			this.clickNextTab();
		},
		
		//Slide previous tab
		slidePrev:function() {
			this.slidePrevTab();
		},
		
		//Slide next tab
		slideNext:function() {
			this.slideNextTab();
		},
		
		//Set options
		setOptions:function(opts) {
			$.each(opts, function(name, val) {
				if (val=="true") {
					opts[name] = true;
				} else if (val=="false") {
					opts[name] = false;
				}
			});
			
			var contentAnim = (opts.contentAnim!=this.opt.contentAnim) ? true : false;
			this.opt = $.extend(true, {}, this.opt, opts);
			this.content.animIsSlide = (opts.contentAnim=="slideH" || opts.contentAnim=="slideV") ? true : false;
			
			if (opts.tabsSlideLength>0) {
				this.setTabSlideLength();
				if (this.val.isTouch) {
					this.setTabSwipeLength();
				}
			}
			if (opts.buttonsFunction=="click") {
				this.setTabButtonState()
			} else if (opts.buttonsFunction=="slide") {
				this.$liLast = this.$tabs.children("li:last");
				this.initTabButtons();
			}
			
			if (opts.tabsLoop) {
				this.enableTabButton(this.$prev);
				this.enableTabButton(this.$next);
			} else if (!opts.tabsLoop) {
				this.initTabButtons();
			}
			
			if (this.opt.tabsScroll) {
				var that = this;
				this.$tabs.mousewheel(function(name, val) { 
					(val>0) ? that.slidePrevTab() : that.slideNextTab();
					return false;
				})
			} else if (!this.opt.tabsScroll) {
				this.$tabs.unmousewheel();
			}
			
			if (opts.autoHeight) {
				this.setContentHeight();
			} else if (!opts.autoHeight) {
				this.resetContentAutoHeight();
			}
			
			if (contentAnim) {
				this.reInitContent();
			}
			
			if (this.val.isTouch) {
				if (this.content.animIsSlide) {
					this.bindContentTouch();
				} else {
					this.unbindContentTouch();
				}
			} else {
				if (opts.touchSupport) {
					if ("ontouchstart" in window) {
						this.val.isTouch = true;
						this.bindTabTouch();
						this.bindContentTouch();
					}
				} else if (!opts.touchSupport) {
					this.unbindTabTouch();
					this.unbindContentTouch();
				}
			}
		},
		
		//Get options
		getOptions:function() {
			return this.opt;
		},
		
		//Set content height
		setHeight:function() {
			this.setContentHeight(true);
		},
		
		//Pause auto play
		pauseAutoplay:function() {
			this.pauseAutoPlay(true);
		},
		
		//Resume auto play
		resumeAutoplay:function() {
			this.resumeAutoPlay(true);
		},
		
		//Destroy
		destroy:function() {
			this.clearAutoPlayInterval();
			this.$tabs.undelegate("li a."+this.opt.classTab, "click").css(this.val.css, this.val.pre+"0"+this.val.px);
			this.$prev.unbind("click");
			this.$next.unbind("click");
			this.hideTabButtons();
			
			if ($.fn.unmousewheel) {
				this.$tabs.unmousewheel();
			}
			
			if (this.val.isTouch) {
				this.unbindTabTouch();
				this.unbindContentTouch();
			}
			
			$("a."+this.opt.classExtLink).each(function() {
				$(this).unbind("click");
			})
		}
		
	};
	
	$.stCore = SlidingTabs.prototype;
	
})(jQuery);
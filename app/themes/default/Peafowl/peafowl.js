/**
 * Peafowl JS
 * Copyright 2014 Rodolfo Berrios <www.rodolfoberrios.com>
 * http://peafowl.co
 */

/**
 * Peafowl DOM functions and event listeners
 */
$(function(){
	
	$.ajaxSetup({url: PF.obj.config.json_api, cache: false, dataType: "json"});
	
	/**
	 * WINDOW LISTENERS
	 * -------------------------------------------------------------------------------------------------
	 */
	$(window).bind("beforeunload",function(){
		if($(PF.obj.modal.selectors.root).is(":visible") && PF.fn.form_modal_has_changed()) {
			return PF.fn.get_lang_string("changes_will_be_lost");
		}
	});
	
	$(window).bind("hashchange", function(){
		// Call edit modal on #edit
		if(window.location.hash=="#edit" && !$(PF.obj.modal.selectors.root).exists()) $("[data-modal=edit]").first().click();
	});
	
	// Blind the tipTips on load
	PF.fn.bindtipTip();
	
	// Fluid width on resize
	$(window).on("resize", function(){
		if($("body").is_fluid()){
			PF.fn.list_fluid_width();
			if(PF.obj.listing.columns_number !== PF.obj.listing.content_listing_ratio){
				PF.fn.list_columnizer(true);
			}
			$(PF.obj.listing.selectors.list_item).show();
		}
		//PF.fn.fullscreen.size();
	});
	
	// Close the opened pop-boxes on HTML click
	$(document).on("click", "body, html", function(e){
		PF.fn.close_pops();
	});
	
		
	/**
	 * SMALL HELPERS AND THINGS
	 * -------------------------------------------------------------------------------------------------
	 */
	
	// Attemp to replace .svg with .png for browsers that doesn't support it
	if($("html").hasClass("no-svg")){
		$("img.replace-svg").replace_svg();
	}
	
	// Keydown numeric input (prevents non numeric keys)
	$(document).on("keydown", ".numeric-input", function(e){
		e.keydown_numeric();
	});
	
	// The handly data-scrollto. IT will scroll the elements to the target
	$(document).on("click", "[data-scrollto]", function(e) {
		var target = $(this).data("scrollto"),
			$target = $(!target.match(/^\#|\./) ? "#"+target : target);
		
		if($target.exists()) {
			PF.fn.scroll($target);
		} else {
			console.log("PF scrollto error: target doesn't exists", $target);
		}
	});
	
	// The handly data-trigger. It will trigger click for elements with data-trigger
	$(document).on("click", "[data-trigger]", function(e) {
		var trigger = $(this).data("trigger"),
			$target = $(!trigger.match(/^\#|\./) ? "#"+trigger : trigger);
			
		if($target.exists()) {
			e.stopPropagation();
			e.preventDefault();
			
			if(!$target.closest(PF.obj.modal.selectors.root).length) {
				PF.fn.modal.close();
			}
			
			$target.click();
		} else {
			console.log("PF trigger error: target doesn't exists", $target);
		}
	});
	
	
	// Clear form like magic
	$(document).on("click", ".clear-form", function(){
		$(this).closest("form")[0].reset();
	});
	
	$(document).on("submit", "form[data-action=validate]", function() {
		
		var type = $(this).data("type"),
			errors = false,
			$validate = $(this).find("[required], [data-validate]");
		
		$validate.each(function() {
			
			var input_type = $(this).attr("type"),
				pattern = $(this).attr("pattern"),
				errorFn = function(el) {
					$(el).highlight();
					errors = true;
				};
			
			if($(this).is("[required]") && $(this).val() == "") {
				if($(this).is(":hidden")) {
					var $hidden_target = $($($(this).data("highlight")).exists() ? $(this).data("highlight") : "#" + $(this).data("highlight"));
					$($hidden_target).highlight();
				}
				errorFn(this);
			}
			
			if(typeof pattern == "undefined" && /mail|url/.test(input_type) == false) {
				return true;
			}
			
			if(pattern) {
				pattern = new RegExp(pattern);
				if(!pattern.test($(this).val())) {
					errorFn(this);
				}
			}
			
			if(input_type == "email" && !$(this).val().isEmail()) {
				errorFn(this);
			}
			
		});

		if(errors) {
			PF.fn.growl.expirable("Check the errors in the form to continue");
			return false;
		}
	});
	
	// Co-combo breaker
	$(document).on("change", "select[data-combo]", function(){
		if($("#"+$(this).data("combo")).exists()){
			$(".switch-combo", $("#"+$(this).data("combo"))).hide();
		}

		var $combo_container = $("#" + $(this).closest("select").data("combo")),
			$combo_target = $("[data-combo-value=" + $("option:selected", this).attr("value") + "]", $combo_container);
		
		if($combo_target.exists()){
			$combo_target.show();
			$combo_target.find("input").first().focus();
		}
	});
	
	// Input events
	$(document).on("change", ":input", function(e){
		PF.fn.growl.close();
	});
	$(document).on("keyup", ":input", function(e){
		$(".input-warning", $(this).closest(".input-label")).html("");
	});
	$(document).on("blur", ":input", function(){
		var this_val = $.trim($(this).prop("value"));
		$(this).prop("value", this_val);
	});
	
	// Select all on an input type
	$(document).on("click", ":input[data-focus=select-all]", function() {
		 this.select();
	})
	
	// Input password strenght
	$(document).on("keyup change blur", ":input[type=password]", function(){
		var password = testPassword($(this).val()),
			$parent = $(this).closest("div");
		
		if($(this).val() == "") {
			password.percent = 0;
			password.verdict = "";
		}
		
		$("[data-content=password-meter-bar]", $parent).width(password.percent);
		$("[data-text=password-meter-message]", $parent).removeClass("red-warning").text(password.verdict);
		
	});
	
	// Popup links
	$(document).on("click", "[rel=popup-link], .popup-link", function(e){
		e.preventDefault();
		PF.fn.popup({href: $(this).attr("href")});
	});
	
	/**
	 * FOWLLOW SCROLL
	 * -------------------------------------------------------------------------------------------------
	 */
	$(window).scroll(function(){
		PF.fn.follow_scroll();
	});
	
	
	/**
	 * MODAL
	 * -------------------------------------------------------------------------------------------------
	 */
	 
	// Call plain simple HTML modal
	$(document).on("click", "[data-modal=simple],[data-modal=html]", function(){
		var $target = $("[data-modal=" + $(this).data("target") + "], #"+$(this).data("target")).first();
		PF.fn.modal.call({template: $target.html(), buttons: false});
	});
	
	// Prevent modal submit form since we only use the form in the modal to trigger HTML5 validation
	$(document).on("submit", PF.obj.modal.selectors.root + " form", function(){
		if($(this).data("prevent") == "false") return true;
		return false;
	});
	
	// Form/editable/confirm modal
	$(document).on("click", "[data-modal=edit],[data-modal=form],[data-confirm]", function(){
		
		var $this = $(this),
			$target, submit_function, cancel_function, submit_done_msg;
		
		if($this.is("[data-confirm]")) {
			$target = $this;
			PF.obj.modal.type = "confirm";
		} else {
			
			$target = $("[data-modal=" + $this.data("target") + "], #"+$this.data("target")).first();
			
			if($target.length == 0) {
				$target = $("[data-modal=form-modal], #form-modal").first();
			}

			if($target.length == 0) {
				console.log("PF Error: Modal target doesn't exists.");
			}

			PF.obj.modal.type = $this.data("modal");
		}
		
		var args = $this.data("args");
		
		var submit_function = window[$target.data("submit-fn")],
			cancel_function = window[$target.data("cancel-fn")],
			submit_done_msg = $target.data("submit-done"),
			ajax = {
				url: $target.data("ajax-url"),
				deferred: window[$target.data("ajax-deferred")]
			};
		
		// Window functions failed? Maybe is an anonymous fn...
		if(typeof submit_function !== "function" && $target.data("submit-fn")) {
			var submit_fn_split = $target.data("submit-fn").split(".");
			submit_function = window;
			for(var i=0; i<submit_fn_split.length; i++) {
				submit_function = submit_function[submit_fn_split[i]];
			}
		}
		if(typeof cancel_function !== "function" && $target.data("cancel-fn")) {
			var cancel_fn_split = $target.data("cancel-fn").split(".");
			cancel_function = window;
			for(var i=0; i<cancel_fn_split.length; i++) {
				cancel_function = cancel_function[cancel_fn_split[i]];
			}
		}

		// deferred was not a window object? Maybe is an anonymous fn...
		if(typeof ajax.deferred !== "object" && $target.data("ajax-deferred")) {
			var deferred_obj_split = $target.data("ajax-deferred").split(".");
			ajax.deferred = window;
			for(var i=0; i<deferred_obj_split.length; i++) {
				ajax.deferred = ajax.deferred[deferred_obj_split[i]];
			}
		}
		
		// Confirm modal
		if($this.is("[data-confirm]")) {		
			PF.fn.modal.confirm({
				message: $this.data("confirm"),
				confirm: typeof submit_function == "function" ? submit_function(args) : "",
				cancel: typeof cancel_function == "function" ? cancel_function(args) : "",
				ajax: ajax
			});
		// Form/editable
		} else {
			
			var fn_before = window[$target.data("before-fn")];
			
			if(typeof fn_before !== "function" && $target.data("before-fn")) {
				var before_obj_split = $target.data("before-fn").split(".");
				fn_before = window;
				for(var i=0; i<before_obj_split.length; i++) {
					fn_before = fn_before[before_obj_split[i]];
				}
			}
			
			if(typeof fn_before == "function") {
				fn_before();
			}
			
			PF.fn.modal.call({
				template: $target.html(),
				button_submit: $(this).is("[data-modal=edit]") ? PF.fn.get_lang_string("save_changes") : PF.fn.get_lang_string("submit_button"),
				confirm: function() {
					
					if(PF.fn.is_validity_supported()){
					}// aca
					
					if(typeof submit_function == "function") submit_fn = submit_function();
					if(typeof submit_fn !== "undefined" && submit_fn == false) {
						return false;
					}
					
					// Run the full function only when the form changes
					if(!PF.fn.form_modal_has_changed()){
						PF.fn.modal.close();
						return;
					}
					
					$(":input", PF.obj.modal.selectors.root).each(function(){
						$(this).val($.trim($(this).val()));
					});
					
					if($this.is("[data-modal=edit]")) {
						// Set the input values before cloning the html
						$target.html($(PF.obj.modal.selectors.body, $(PF.obj.modal.selectors.root).bindFormData()).html().replace(/rel=[\'"]tooltip[\'"]/g, 'rel="template-tooltip"'));
					}
					
					if(typeof ajax.url !== "undefined") {
						return true;
					} else {
						PF.fn.modal.close(
							function(){
								if(typeof submit_done_msg !== "undefined"){
									PF.fn.growl.expirable(submit_done_msg !== "" ? submit_done_msg : PF.fn.get_lang_string("changes_saved_successfully"))
								}
							}
						);
					}

					
				},
				cancel: function() {
					if(typeof cancel_fn == "function") cancel_fn = cancel_fn();
					if(typeof cancel_fn !== "undefined" && cancel_fn == false) {
						return false;
					}
					// nota: falta template aca
					if(PF.fn.form_modal_has_changed()) {
						if($(PF.obj.modal.selectors.changes_confirm).exists()) return;
						$(PF.obj.modal.selectors.box, PF.obj.modal.selectors.root).fadeOut("fast");
						$(PF.obj.modal.selectors.root).append('<div id="'+PF.obj.modal.selectors.changes_confirm.replace("#", "")+'"><div class="content-width"><h2>'+PF.fn.get_lang_string("changes_will_be_lost")+'</h2><div class="'+ PF.obj.modal.selectors.btn_container.replace(".", "") +' margin-bottom-0"><button class="btn btn-input default" data-action="cancel">'+PF.fn.get_lang_string("back_to_form")+'</button> <span class="btn-alt">'+PF.fn.get_lang_string("or")+' <a data-action="submit">'+PF.fn.get_lang_string("continue_anyway")+'</a></span></div></div>');
						$(PF.obj.modal.selectors.changes_confirm).css("margin-top", -$(PF.obj.modal.selectors.changes_confirm).outerHeight(true)/2).hide().fadeIn();
					} else {
						PF.fn.modal.close();
						if(window.location.hash=="#edit") window.location.hash = "";
					}
				},
				callback: function(){},
				ajax: ajax
			})
		}
		
	});
	
	// Check user login modal -> Must be login to continue
	if(!PF.fn.is_user_logged()){
		$("[data-login-needed]:input, [data-user-logged=must]:input").each(function(){
			$(this).attr("readonly", true);
		});
	}
	// nota: update junkstr
	$(document).on("click focus", "[data-login-needed], [data-user-logged=must]", function(e) {
		if(!PF.fn.is_user_logged()){
			e.preventDefault();
			e.stopPropagation();
			if($(this).is(":input")) $(this).attr("readonly", true).blur();
			PF.fn.modal.call({type: "login"});
		}
	});
	
	// Modal form keydown listener
	$(document).on("keydown", PF.obj.modal.selectors.root + " input", function(e){ // nota: solia ser keyup
		var $this = $(e.target),
			key = e.charCode || e.keyCode;
		if(key !== 13){
			PF.fn.growl.close();
			return;
		}
		if(key==13 && $("[data-action=submit]", PF.obj.modal.selectors.root).exists() && !$this.is(".prevent-submit")){ // 13 == enter key
			$("[data-action=submit]", PF.obj.modal.selectors.root).click();
		}
	});
	
	
	// Trigger modal edit on hash #edit
	// It must be placed after the event listener
	if(window.location.hash && window.location.hash=="#edit"){
		$("[data-modal=edit]").first().click();
	}
	
	
	/**
	 * SEARCH INPUT
	 * -------------------------------------------------------------------------------------------------
	 */
	
	// Top-search feature
	$(document).on("click", "#top-bar-search", function(){
		$("#top-bar-search-input", ".top-bar").removeClass("hidden").show();
		$("#top-bar-search-input input", ".top-bar").focus();
		$("#top-bar-search", ".top-bar").hide();
	});
	
	// Search icon click -> focus input
	$(document).on("click", ".input-search .icon-search", function(e){
		$("input", e.currentTarget.offsetParent).focus();
	});
	
	// Clean search input
	$(document).on("click", ".input-search .icon-close, .input-search [data-action=clear-search]", function(e){
		var $input = $("input", e.currentTarget.offsetParent);
		
		if($input.val()==""){
			if($(this).closest("#top-bar-search-input").exists()){
				$("#top-bar-search-input", ".top-bar").hide();
				$("li#top-bar-search", ".top-bar").removeClass("opened").show();
			}
		} else {
			if(!$(this).closest("#top-bar-search-input").exists()){
				$(this).hide();
			}
			$input.val("").change();
		}
	});
	
	// Input search clear search toggle
	$(document).on("keyup change", "input.search", function(e){
		var $input = $(this),
			$div = $(this).closest(".input-search");
		
		if(!$(this).closest("#top-bar-search-input").exists()) {
			$(".icon-close, [data-action=clear-search]", $div)[$input.val() == "" ? "hide" : "show"]();
		}
	});
	
	/*
	// Peafowl predictive search
	$("input.search").keyup(function(e){
		var $top_search_input = $(this).closest("#top-bar-search-input"),
			key = e.charCode || e.keyCode,
			$current_focus, $li_target;
		
		if(key==27){ // esc
			$(".icon-close", $(this).closest(".input-search")).click();
		}
		if($top_search_input && (key==40 || key==38)){
			$current_focus = $("#top-predictive-search li a.focus", $top_search_input);
			
			if($current_focus.length>0){
				$current_focus.removeClass("focus");
				if(key==40){ // up
					$li_target = $current_focus.parent("li").next();
				}
				if(key==38){ // down
					$li_target = $current_focus.parent("li").prev();
				}
				if($li_target.text()==""){
					$li_target = $current_focus.closest("ul").find("li");
					if(key==40){
						$li_target = $li_target.first();
					}
					if(key==38){
						$li_target = $li_target.last();
					}
				}
				$li_target.find("a").addClass("focus");
			} else {
				$li_target = $top_search_input.find("#top-predictive-search li a");
				if(key==40){
					$li_target = $li_target.first();
				}
				if(key==38){
					$li_target = $li_target.last();
				}
				$li_target.addClass("focus");
			}
			if($("#top-predictive-search li a.focus", $top_search_input).text()){
				$("input", $top_search_input).val($("#top-predictive-search li a.focus", $top_search_input).text());
			}
			
		}
		$(this).change();	
	});
	
	// Predictions to input val()
	$("#top-predictive-search li a", "#top-bar-search-input").mouseover(function(){
		$("input", "#top-bar-search-input").val($(this).text());
	});
	
	// Top search changed
	$("input.search", "#top-bar-search-input").change(function(){
		$("#top-predictive-search").toggle($(this).val()!=="" ? true : false);
		if($(this).val()!==$("#top-predictive-search").find(".focus").text()){
			$("#top-predictive-search").find(".focus").removeClass("focus");
		}
	});
	*/
	
	/**
	 * POP BOXES (MENUS)
	 * -------------------------------------------------------------------------------------------------
	 */
	$(document).on("click mouseenter", ".pop-btn", function(e) {
				
		var $this_click = $(e.target),
			$pop_btn, $pop_box;
		
		if(e.type=="mouseenter" && !$(this).hasClass("pop-btn-auto")) return;
		if($(this).hasClass("disabled") || $this_click.closest("li.current").exists()) return;
		
		PF.fn.growl.close();
		
		e.stopPropagation();
		
		$pop_btn = $(this);		
		$pop_box = $(".pop-box", $pop_btn);
		$pop_btn.addClass("opened");
		
		if($pop_box.hasClass("anchor-center")){
			$pop_box.css("margin-left", -($pop_box.width()/2));
		}
		
		// Pop button changer
		if($this_click.is("[data-change]")){
			$("li", $pop_box).removeClass("current");
			$this_click.closest("li").addClass("current");
			$("[data-text-change]", $pop_btn).text($("li.current a", $pop_box).text());
			//PF.fn.growl.call($pop_btn.closest(".header").find(".content-tabs .current a").data("ajax")+" | Con-> "+$this_click.data("change"));
			e.preventDefault();
		}
		
		// Click inside the bubble only for .pop-keep-click
		if($pop_box.is(":visible") && $(e.target).closest(".pop-box-inner").length > 0 && $(this).is(".pop-keep-click")){
			return; 
		}

		$(".pop-box:visible").not($pop_box).hide().closest(".pop-btn").removeClass("opened");
		
		$pop_box.toggle();
		
		if(!$pop_box.is(":visible")){
			$pop_box.closest(".pop-btn").removeClass("opened");
		} else {
			$(".antiscroll-wrap:not(.jsly):visible", $pop_box).addClass("jsly").antiscroll();
		}
		
	}).on("mouseleave", ".pop-btn", function(){
		var $pop_btn, $pop_box;
		$pop_btn = $(this);		
		$pop_box = $(".pop-box", $pop_btn);
		
		if(!$(this).hasClass("pop-btn-auto")) return;
		$pop_box.hide().closest(".pop-btn").removeClass("opened");
	});
	
	/**
	 * TABS
	 * -------------------------------------------------------------------------------------------------
	 */
	
	// Hash on load (static tabs) changer
	if(window.location.hash){
		
		var $hash_node = $("[href="+ window.location.hash +"]");
		
		if($hash_node.exists()) {
			$.each($("[href="+ window.location.hash +"]")[0].attributes, function(){
				PF.obj.tabs.hashdata[this.name] = this.value;
			});
			PF.obj.tabs.hashdata.pushed = "tabs";
			
			History.replaceState({
				href: window.location.hash,
				"data-tab": $("[href="+ window.location.hash +"]").data("tab"),
				pushed: "tabs",
				statenum: 0
			}, null, null);
		}
		
	}
	
	// Stock tab onload data
	if($(".content-tabs").exists() && !window.location.hash) {
		var $tab = $("a", ".content-tabs .current");
		History.replaceState({
			href: $tab.attr("href"),
			"data-tab": $tab.data("tab"),
			pushed: "tabs",
			statenum: 0
		}, null, null);
	}
	
	// Keep scroll position (history.js)
	var State = History.getState();
	if(typeof State.data == "undefined") {
		History.replaceState({scrollTop: 0}, document.title, window.location.href); // Stock initial scroll
	}
	History.Adapter.bind(window,"popstate", function(){
		var State = History.getState();
		if(State.data && typeof State.data.scrollTop !== "undefined") {
			if($(window).scrollTop() !== State.data.scrollTop) {
				$(window).scrollTop(State.data.scrollTop);
			}
		}
		return;
	});
	
	// Toggle tab display
	$("a", ".content-tabs").click(function(e) {

		if($(this).data("link") == true) {
			$(this).data("tab", false);
		}

		if($(this).closest(".current,.disabled").exists()){
			e.preventDefault();
			return;
		}	
		if(typeof $(this).data("tab") == "undefined") return;
		
		var dataTab = {};
		$.each(this.attributes, function(){
			dataTab[this.name] = this.value;
		});
		dataTab.pushed = "tabs";
		
		// This helps to avoid issues on ?same and ?same#else
		dataTab.statenum = 0;
		if(History.getState().data && typeof History.getState().data.statenum !== "undefined") {
			dataTab.statenum = History.getState().data.statenum + 1
		}
		
		if($(this).attr("href") && $(this).attr("href").indexOf("#") === 0) {  // to ->#Hash
			PF.obj.tabs.hashdata = dataTab;
			if(typeof e.originalEvent == "undefined") {
				window.location.hash = PF.obj.tabs.hashdata.href.substring(1);
			}
		} else { // to ->?anything
			History.pushState(dataTab, document.title, $(this).attr("href"));
			e.preventDefault();
		}
		
	});
	
	// On state change bind tab changes
	$(window).bind("statechange hashchange", function(e) {
		
		PF.fn.growl.close();
		
		var dataTab;

		if(e.type == "statechange"){

			dataTab = History.getState().data;
		
		} else if(e.type == "hashchange"){

			if(typeof PF.obj.tabs.hashdata !== "undefined" && typeof PF.obj.tabs.hashdata.href !== "undefined" && PF.obj.tabs.hashdata.href !== window.location.hash) {
				PF.obj.tabs.hashdata = null;
			}
			
			if(PF.obj.tabs.hashdata == null) {
				var $target = $("[href="+ window.location.hash +"]", ".content-tabs");
				
				if(!$target.exists()) $target = $(window.location.hash);
				if(!$target.exists()) $target = $("a", ".content-tabs").first();
				
				if(typeof $target.data("tab") !== "undefined") {
					PF.obj.tabs.hashdata = {};
					$.each($target[0].attributes, function(){
						PF.obj.tabs.hashdata[this.name] = this.value;
					});
					PF.obj.tabs.hashdata.pushed = "tabs";
				}
			}
			
			dataTab = (typeof PF.obj.tabs.hashdata !== "undefined") ? PF.obj.tabs.hashdata : null;
			
		}
		
		if(dataTab && dataTab.pushed == "tabs"){
			PF.fn.show_tab(dataTab["data-tab"]);
		}
		
	});
	
	/**
	 * LISTING
	 * -------------------------------------------------------------------------------------------------
	 */
	
	// Stock the scroll position on list element click
	$(document).on("click", ".list-item a", function(e) {
		if($(this).attr("src") == "") return;
		History.replaceState({scrollTop: $(window).scrollTop()}, document.title, window.location.href);
	});
	
	// Load more (listing +1 page)
	$(document).on("click", "[data-action=load-more]", function(e){
		
		if(!PF.fn.is_listing() || $(this).closest(PF.obj.listing.selectors.content_listing).is(":hidden") || $(this).closest("#content-listing-template").exists() || PF.obj.listing.calling) return;
		
		PF.fn.listing_querystring.stock_new();
		
		// Page hack
		PF.obj.listing.query_string.page = $(PF.obj.listing.selectors.content_listing_visible).data("page");
		PF.obj.listing.query_string.page++;
		
		// Offset hack
		var offset = $(PF.obj.listing.selectors.content_listing_visible).data("offset");
		
		if(typeof offset !== "undefined") {
			PF.obj.listing.query_string.offset = offset;
			if(typeof PF.obj.listing.hidden_params == "undefined") {
				PF.obj.listing.hidden_params = {};
			}
			PF.obj.listing.hidden_params.offset = offset;
		} else {
			if(typeof PF.obj.listing.query_string.offset !== "undefined") {
				delete PF.obj.listing.query_string.offset;
			}
			if(PF.obj.listing.hidden_params && typeof PF.obj.listing.hidden_params.offset !== "undefined") {
				delete PF.obj.listing.hidden_params.offset;
			}
		}
		
		PF.fn.listing_ajax();
		e.preventDefault();

	});
	
	// List found on load html -> Do the columns!
	if($(PF.obj.listing.selectors.list_item).length > 0){
		$content_listing = $("#content-listing-tabs").exists() ? $(PF.obj.listing.selectors.content_listing_visible, "#content-listing-tabs") : $(PF.obj.listing.selectors.content_listing);
		
		PF.fn.loading.inline(PF.obj.listing.selectors.content_listing_loading);
		
		$(PF.obj.listing.selectors.list_item+":not(.jsly)", $content_listing).imagesLoaded(function(){
			PF.fn.list_columnizer();
			$(PF.obj.listing.selectors.list_item, $content_listing).fadeIn();
			
			// Remove loader and pagination for small listings
			$(PF.obj.listing.selectors.content_listing_visible).each(function(){
				if($(PF.obj.listing.selectors.list_item, this).length < PF.obj.config.listing.items_per_page) {
					$(PF.obj.listing.selectors.content_listing_loading+", "+PF.obj.listing.selectors.content_listing_pagination+":not([data-visibility=visible])", this).remove();
				}
				if($(PF.obj.listing.selectors.content_listing_pagination, this).is("[data-type=classic]") || !$("[data-action=load-more]", this).exists()) {
					$(PF.obj.listing.selectors.content_listing_loading, this).remove();
				}
			});
			
			var State = History.getState();
			if(State.data && typeof State.data.scrollTop !== "undefined") {
				if($(window).scrollTop() !== State.data.scrollTop) {
					$(window).scrollTop(State.data.scrollTop);
				}
			}
			
		});
		
		// Bind the infinte scroll
		$(window).scroll(function() {
            if(($(window).scrollTop() + $(window).height() > $(document).height() - 200) && PF.obj.listing.calling == false) {
				$(PF.obj.listing.selectors.content_listing_visible).find(PF.obj.listing.selectors.content_listing_pagination).find("[data-action=load-more]").click();
            }
        });
		
	}
	
	// Multi-selection tools
	$(document).on("click", PF.obj.modal.selectors.root+ " [data-switch]", function(){
		var $this_modal = $(this).closest(PF.obj.modal.selectors.root);
		$("[data-view=switchable]", $this_modal).hide();
		$("#"+$(this).attr("data-switch"), $this_modal).show();
	});
	
});

/**
 * PEAFOWL OBJECT
 * -------------------------------------------------------------------------------------------------
 */
var PF = {fn: {}, str: {}, obj: {}};

/**
 * PEAFOWL CONFIG
 * -------------------------------------------------------------------------------------------------
 */
PF.obj.config = {
	base_url: "",
	json_api: "/json/",
	listing: {
		items_per_page: 24
	}
};

/**
 * WINDOW VARS
 * -------------------------------------------------------------------------------------------------
 */

/**
 * LANGUAGE FUNCTIONS
 * -------------------------------------------------------------------------------------------------
 */
PF.obj.lang_strings = {
	es: {
		"select" : "seleccionar",
		"unselect" : "Deseleecionar",
		"submit_button" : "Enviar",
		"save_changes" : "Guardar cambios",
		"confirm_button" : "Confirmar",
		"cancel_button" : "cancelar",
		"or": "o",
		"confirm_action" : "Confirmar acción",
		"changes_saved_successfully" : "Cambios guardados exitosamente.",
		"changes_will_be_lost" : "Se perderan todos los cambios que has realizado si decides continuar.",
		"back_to_form" : "Volver al formulario",
		"continue_anyway": "continuar de todos modos",
		"check_form_errors_to_continue": "Revisa los errores en el formulario antes de continuar."
	},
	en: {
		"select" : "Select",
		"unselect" : "Unselect",
		"submit_button" : "Submit",
		"save_changes" : "Save changes",
		"confirm_button" : "Confirm",
		"cancel_button" : "cancel",
		"or": "or",
		"confirm_action" : "Confirm action",
		"changes_saved_successfully" : "Changes saved successfully.",
		"changes_will_be_lost" : "All the changes that you have made will be lost if you continue.",
		"back_to_form" : "Go back to form",
		"continue_anyway": "continue anyway",
		"check_form_errors_to_continue": "Check the errors in the form before continue."
	}
}

PF.str.lang = typeof PF.obj.lang_strings[$("html").attr("lang")] == "undefined" ? PF.obj.lang_strings.en : PF.obj.lang_strings[$("html").attr("lang")];

/**
 * Get lang string by key
 * @argument string (lang key string)
 */
// pf: get_pf_lang
PF.fn.get_lang_string = function(string){
	if(typeof PF.obj.lang_strings.en[string] == "undefined") PF.obj.lang_strings.en[string] = string;
	return typeof PF.str.lang[string] !== "undefined" ? PF.str.lang[string] : PF.obj.lang_strings.en[string];
};

/**
 * Extend Peafowl lang
 * Useful to add or replace strings
 * @argument strings obj
 */
// pf: extend_pf_lang
PF.fn.extend_lang = function(strings){
	$.each(PF.obj.lang_strings, function(i,v){
		if(typeof strings[i] !== "undefined") {
			$.extend(PF.obj.lang_strings[i], strings[i]);
		}
	});
};



/**
 * HELPER FUNCTIONS
 * -------------------------------------------------------------------------------------------------
 */

PF.fn.get_url_vars = function(){
	var match,
		pl     = /\+/g,  // Regex for replacing addition symbol with a space
		search = /([^&=]+)=?([^&]*)/g,
		decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
		query  = window.location.search.substring(1),
		urlParams = {};
		
	while(match = search.exec(query)){
		urlParams[decode(match[1])] = decode(match[2]);
	}
	
	return urlParams;
	
};

PF.fn.get_url_var = function(name){
	return PF.fn.get_url_vars()[name];
};

PF.fn.is_user_logged = function() {
	return $("#top-bar-user").is(":visible"); // nota: default version
	// It should use backend conditional
};

PF.fn.generate_random_string = function(len){
	if(typeof len == "undefined") len = 5;
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i=0; i < len; i++){
        text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
    return text;
};

PF.fn.htmlEncode = function(value) {
  return $('<div/>').text($.trim(value)).html();
}

PF.fn.htmlDecode = function(value) {
  return $('<div/>').html($.trim(value)).text();
}

PF.fn.clean_facebook_hash = function() {
	if(window.location.hash == "#_=_") {
		window.location.hash = "";
	}
}
PF.fn.clean_facebook_hash();

/**
 * Get the min and max value from 1D array
 */
Array.min = function(array){
    return Math.min.apply(Math, array);
};
Array.max = function(array){
    return Math.max.apply(Math, array);
};

/**
 * Return the sum of all the values in a 1D array
 */
Array.sum = function(array){
	return array.reduce(function(pv, cv){ return cv + pv});
}

/**
 * Return the size of an object
 */
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

/**
 * Flatten an object
 */
Object.flatten = function(obj, prefix) {
	
	if(typeof prefix == "undefined") var prefix = "";
	
    var result = {};
	
	$.each(obj, function(key, value) {
		if(!value) return;
		if(typeof value == "object") {
			result = $.extend({}, result, Object.flatten(value, prefix + key + '_'));
		} else {
			result[prefix + key] = value;
		}
	});
    
	return result;
}

/**
 * Tells if the string is a number or not
 */
String.prototype.isNumeric = function(){
	return !isNaN(parseFloat(this)) && isFinite(this);
};

/**
 * Repeats an string
 */
String.prototype.repeat = function(num){
	return new Array(num + 1).join(this);
};

/**
 * Tells if the string is a email or not
 */
String.prototype.isEmail = function(){
	var regex = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
	return regex.test(this);
};

/**
 * Return bytes from Size + Suffix like "10 MB"
 */
String.prototype.getBytes = function(){
	switch(this.toLowerCase().substr(-2)){
		case "kb": return parseFloat(this) * 1024;
		case "mb": return parseFloat(this) * 1048576;
		case "gb": return parseFloat(this) * 1073741824;
		default: return this;
	}
};

/**
 * Return size formatted from size bytes
 */
String.prototype.formatBytes = function() {
	var bytes = parseInt(this),
		kilobyte = 1024,
		megabyte = kilobyte * 1024,
		gigabyte = megabyte * 1024,
		terabyte = gigabyte * 1024;
		
	if(bytes < kilobyte) {
		return bytes + " B";
	}
	if(bytes < megabyte) {
		return Math.round(bytes / kilobyte) + " KB";
	}
	if(bytes < gigabyte) {
		return Math.round(bytes / megabyte) + " MB";
	}
	if(bytes < terabyte) {
		return Math.round(bytes / gigabyte) + " GB";
	}
	
	return bytes + " B";
};

/**
 * Returns the image url.matches (multiple)
 */
String.prototype.match_image_urls = function() {
	return this.match(/\b(?:ftp|https?):\/\/(\w+:\w+@)?([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(:[0-9]{1,4}){0,1}|(?:[\w\-]+\.)+[a-z]{2,6})(?:\/[^\/#\?]+)+\.(?:jpe?g|gif|png|bmp)\b/gim);
};

String.prototype.match_urls = function() {
	return this.match(/\b(?:ftp|https?):\/\/(\w+:\w+@)?([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(:[0-9]{1,4}){0,1}|(?:[\w\-]+\.)+[a-z]{2,6})(?:\/[^\/#\?]+)?\b/gim);
};


// Add ECMA262-5 Array methods if not supported natively
if (!("indexOf" in Array.prototype)) {
    Array.prototype.indexOf= function(find, i /*opt*/) {
        if(i===undefined) i = 0;
        if(i<0) i+= this.length;
        if(i<0) i = 0;
        for(var n = this.length; i<n; i++) {
            if(i in this && this[i]===find) {
                return i;
			}
		}
        return -1;
    };
}

/**
 * Removes all the array duplicates without loosing the array order.
 */
Array.prototype.array_unique = function(){
	var result = [];
    $.each(this, function(i, e) {
        if ($.inArray(e, result) == -1) result.push(e);
    });
    return result;
}

PF.fn.deparam = function(querystring) {
	if(typeof querystring == "undefined" || !querystring) return;
	var obj = {},
		pairs = querystring.replace(/^[\?|&]*/, "").replace(/[&|\?]*$/, "").split("&");
	for(var i=0; i<pairs.length; i++) {
		var split = pairs[i].split('=');
		obj[decodeURIComponent(split[0])] = decodeURIComponent(split[1]);
	}
	return obj;
}

// http://stackoverflow.com/a/1634841/1145912
String.prototype.removeURLParameter = function(key) {
	var url = "",
		deparam = PF.fn.deparam(this);
	if(typeof deparam[key] !== "undefined") {
		delete deparam[key];
	}
	return decodeURIComponent($.param(deparam));
}

/**
 * Truncate the middle of the URL just like Firebug
 * From http://stackoverflow.com/questions/10903002/shorten-url-for-display-with-beginning-and-end-preserved-firebug-net-panel-st
 */
String.prototype.truncate_middle = function(l) {
	var l = typeof(l) != "undefined" ? l : 40,
		chunk_l = (l/2),
		url = this.replace(/https?:\/\//g,"");
	
	if(url.length <= l) {
		return url;
	}
	
	function shortString(s, l, reverse) {
		var stop_chars = [' ','/', '&'],
			acceptable_shortness = l * 0.80, // When to start looking for stop characters
			reverse = typeof(reverse) != "undefined" ? reverse : false,
			s = reverse ? s.split("").reverse().join("") : s,
			short_s = "";
		
		for(var i=0; i < l-1; i++){
			short_s += s[i];
			if(i >= acceptable_shortness && stop_chars.indexOf(s[i]) >= 0) {
				break;
			}
		};
		if(reverse){ return short_s.split("").reverse().join(""); }
		return short_s;
	};

	return shortString(url, chunk_l, false) + "..." + shortString(url, chunk_l, true);
};


/**
 * Compare 2 arrays/objects
 * http://stackoverflow.com/questions/1773069/using-jquery-to-compare-two-arrays
 */
jQuery.extend({
    compare: function (a,b) {
        var obj_str = '[object Object]',
            arr_str = '[object Array]',
            a_type  = Object.prototype.toString.apply(a),
            b_type  = Object.prototype.toString.apply(b);
            if(a_type !== b_type){
				return false;
			} else if(a_type === obj_str){
                return $.compareObject(a,b);
            } else if(a_type === arr_str){
                return $.compareArray(a,b);
            }
            return (a === b);
    },
	compareArray: function (arrayA, arrayB) {
        var a,b,i,a_type,b_type;
        if (arrayA === arrayB) { return true;}
        if (arrayA.length != arrayB.length) { return false; }
        a = jQuery.extend(true, [], arrayA);
        b = jQuery.extend(true, [], arrayB);
        a.sort(); 
        b.sort();
        for (i = 0, l = a.length; i < l; i+=1) {
            a_type = Object.prototype.toString.apply(a[i]);
            b_type = Object.prototype.toString.apply(b[i]);
            if(a_type !== b_type){
                return false;
            }
            if($.compare(a[i],b[i]) === false){
                return false;
            }
        }
        return true;
    },
	compareObject: function(objA,objB){
        var i,a_type,b_type;
        // Compare if they are references to each other 
        if (objA === objB) { return true;}
        if (Object.keys(objA).length !== Object.keys(objB).length) { return false;}
        for (i in objA) {
            if (objA.hasOwnProperty(i)) {
                if(typeof objB[i] === 'undefined'){
                    return false;
                } else {
                    a_type = Object.prototype.toString.apply(objA[i]);
                    b_type = Object.prototype.toString.apply(objB[i]);
                    if (a_type !== b_type) {
                        return false; 
                    }
                }
            }
            if($.compare(objA[i],objB[i]) === false){
                return false;
            }
        }
        return true;
    }
});

/**
 * Tells if a selector exits in the dom
 */
jQuery.fn.exists = function(){
	return this.length > 0;
};

/**
 * Replace .svg for .png
 */
jQuery.fn.replace_svg = function(){
	if(!this.attr("src")) return;
	$(this).each(function(){
		$(this).attr("src", $(this).attr("src").replace(".svg", ".png"));
	});
};

/**
 * Detect fluid layout
 * nota: deberia ir en PF
 */
jQuery.fn.is_fluid = function(){
	return(this.hasClass("fluid") || this.css("width")=="100%");
};

/**
 * jQueryfy the form data
 * Bind the attributes and values of form data to be manipulated by DOM fn
 */
jQuery.fn.bindFormData = function() {
	$(":input", this).each(function() {
		var safeVal = PF.fn.htmlEncode($(this).val());
		
		if($(this).is("input")){
			this.setAttribute("value", this.value);
			if(this.checked) {
				this.setAttribute("checked", "checked");
			} else {
				this.removeAttribute("checked");
			}
		}
		if($(this).is("textarea")){
			$(this).html(safeVal);
		}
		if($(this).is("select")){
			var index = this.selectedIndex,
				i = 0;
			$(this).children("option").each(function() {
				if (i++ != index) {
					this.removeAttribute("selected");
				} else {
					this.setAttribute("selected","selected");
				}
			});
		}
	});
	return this;
};

/** jQuery.formValues: get or set all of the name/value pairs from child input controls   
 * @argument data {array} If included, will populate all child controls.
 * @returns element if data was provided, or array of values if not
 * http://stackoverflow.com/questions/1489486/jquery-plugin-to-serialize-a-form-and-also-restore-populate-the-form
 */
/*jQuery.fn.formValues = function(data) {
    var els = $(":input", this);
	
    if(typeof data != "object"){
        data = {};
        $.each(els, function(){
			var is_checkbox = $(this).is(":checkbox");
            if(this.name && !this.disabled && /select|textarea|input/i.test(this.nodeName)){
				if(this.name.match(/^.*\[\]$/)) {//this.checked
					if(!data[this.name] || typeof data[this.name] == "undefined") {
						data[this.name] = [];
					}
					data[this.name].push($(this).val());
				} else {
					data[this.name] = is_checkbox ? $(this).prop("checked") : $(this).val();
				}
            }
        });
        return data;
    } else {
        $.each(els, function() {
			console.log(this);
			if(this.name.match(/^.*\[\]$/) && typeof data[this.name] == "object") {
				
				$(this).prop("checked", data[this.name].indexOf($(this).val()) !== -1);
			} else  {
				if(this.name && data[this.name]){
					if(/checkbox|radio/i.test(this.type)) {
						$(this).prop("checked", (data[this.name] == $(this).val()));
					} else {
						$(this).val(data[this.name]);
					}
				} else if(/checkbox|radio/i.test(this.type)){
					$(this).removeProp("checked");
				}
			
			}
        });
        return $(this);
    }
};*/
jQuery.fn.formValues = function(data) {
    var els = $(":input", this);
    if(typeof data != "object"){
        data = {};
        $.each(els, function(){
            if(this.name && !this.disabled && (this.checked || /select|textarea/i.test(this.nodeName) || /text|hidden|password/i.test(this.type))){
				if(this.name.match(/^.*\[\]$/) && this.checked) {
					if(typeof data[this.name] == "undefined") {
						data[this.name] = [];
					}
					data[this.name].push($(this).val());
				} else {
					data[this.name] = $(this).val();
				}
            }
        });
        return data;
    } else {
		
        $.each(els, function() {
			if(this.name.match(/^.*\[\]$/) && typeof data[this.name] == "object") {
				$(this).prop("checked", data[this.name].indexOf($(this).val()) !== -1);
			} else  {
				if(this.name && data[this.name]){
					if(/checkbox|radio/i.test(this.type)) {
						$(this).prop("checked", (data[this.name] == $(this).val()));
					} else {
						$(this).val(data[this.name]);
					}
				} else if(/checkbox|radio/i.test(this.type)){
					$(this).removeProp("checked");
				}
			}
        });
        return $(this);
    }
};

jQuery.fn.storeformData = function(dataname){
	if(typeof dataname == "undefined" && typeof $(this).attr("id") !== "undefined"){
		dataname = $(this).attr("id"); 
	}
	if(typeof dataname !== "undefined") $(this).data(dataname, $(this).formValues());
	return this;
};

/**
 * Compare the $.data values against the current DOM values
 * It relies in using $.data to store the previous value
 * Data must be stored using $.formValues()
 *
 * @argument dataname string name for the data key
 */
jQuery.fn.is_sameformData = function(dataname){
	var $this = $(this);
	if(typeof dataname == "undefined") dataname = $this.attr("id");
	return jQuery.compare($this.formValues(), $this.data(dataname));
};

/**
 * Prevent non-numeric keydown
 * Allows only numeric keys to be entered on the target event
 */
jQuery.Event.prototype.keydown_numeric = function(){
	var e = this;
	
	if(e.shiftKey) {
		e.preventDefault();
		return false;
	}
	
	var key = e.charCode || e.keyCode,
		target = e.target,
		value = ($(target).val()=="") ? 0 : parseInt($(target).val());
	
	if(key == 13) { // Allow enter key
		return true;
	}
	
	if(key == 46 || key == 8 || key == 9 || key == 27 ||
		// Allow: Ctrl+A
		(key == 65 && e.ctrlKey === true) ||
		// Allow: home, end, left, right
		(key >= 35 && key <= 40)){
		// let it happen, don't do anything
		return true;
	} else {
		// Ensure that it is a number and stop the keypress
		if ((key < 48 || key > 57) && (key < 96 || key > 105 )){
			e.preventDefault();
		}
	}
};

/**
 * Detect canvas support
 */
PF.fn.is_canvas_supported = function(){
	var elem = document.createElement("canvas");
	return !!(elem.getContext && elem.getContext("2d"));
};

/**
 * Detect validity support
 */
PF.fn.is_validity_supported = function(){
	var i = document.createElement("input");
	return typeof i.validity === "object";
}

/**
 * Updates the notifications button
 */
PF.fn.top_notifications_viewed = function(){     
	var $top_bar_notifications = $("#top-bar-notifications"),
		$notifications_lists = $(".top-bar-notifications-list", $top_bar_notifications),
		$notifications_count = $(".top-btn-number", $top_bar_notifications);
	
	if($(".persistent", $top_bar_notifications).exists()){
		$notifications_count.text($(".persistent", $top_bar_notifications).length).addClass("on");
	} else {
		$notifications_count.removeClass("on");
	}
};

/**
 * bind tipTip for the $target with options
 * @argument $target selector or jQuery obj
 * @argument options obj
 */
PF.fn.bindtipTip = function($target, options) {
	if(typeof $target == "undefined") $target = $("body");
	if($target instanceof jQuery == false) $target = $($target);
	var bindtipTipoptions = {
			delay: 0,
			content: false
		}
	if(typeof options !== "undefined"){
		if(typeof options.delay !== "undefined") bindtipTipoptions.delay = options.delay;
		if(typeof options.content !== "undefined") bindtipTipoptions.content = options.content;
	}
	if($target.attr("rel") !== "tooltip") $target = $("[rel=tooltip]", $target);
	
	$target.each(function(){
		$(this).tipTip({delay: bindtipTipoptions.delay, defaultPosition: typeof $(this).data("tiptip") == "undefined" ? "bottom" : $(this).data("tiptip"), content: bindtipTipoptions.content});
	});
};

/**
 * form modal changed
 * Detects if the form modal (fullscreen) has changed or not
 * Note: It relies in that you save a serialized data to the 
 */
PF.fn.form_modal_has_changed = function() {
	if($(PF.obj.modal.selectors.root).is(":hidden")) return;
	if(typeof $("html").data("modal-form-values") == "undefined") return;
	return $("html").data("modal-form-values") !== $(":input", PF.obj.modal.selectors.root).serialize();
}



/**
 * PEAFOWL CONDITIONALS
 * -------------------------------------------------------------------------------------------------
 */

PF.fn.is_listing = function(){
	return $(PF.obj.listing.selectors.content_listing).exists();
}

PF.fn.is_tabs = function(){
	return $(".content-tabs").exists();
}

/**
 * PEAFOWL EFFECTS
 * -------------------------------------------------------------------------------------------------
 */

/**
 * Shake effect
 * Shakes the element using CSS animations.
 * @argument callback fn
 */
jQuery.fn.shake = function(callback){
	this.each(function(init){
        var jqNode = $(this),
			jqNode_position = jqNode.css("position");
			
		if(!jqNode_position.match("relative|absolute|fixed")) jqNode.css({position: "relative"});
		
		var jqNode_left = parseInt(jqNode.css("left"));
		
		if(!jqNode_left.toString().isNumeric()) jqNode_left = 0;
		
		if(!jqNode.is(":animated")){
			for(var x = 1; x <= 2; x++){
				jqNode.animate({
					left: jqNode_left-10
				}, 0).animate({
					left: jqNode_left
				}, 30).animate({
					left: jqNode_left+10
				}, 30).animate({
					left: jqNode_left
				}, 30);
			};
			if(jqNode_position!=="static") jqNode.css({position: jqNode_position});
		};
    });
	if(typeof callback == "function") callback();
	return this;
};

/**
 * Highlight effect
 * Changes the background of the element to a highlight color and revert to original
 * @argument string (yellow|red|hex-color)
 */
jQuery.fn.highlight = function(color){
	if(this.is(":animated") || !this.exists()) return this;
	if(typeof color == "undefined") color = "yellow";
	
	var fadecolor = color;
	
	switch(color){
		case "yellow":
			fadecolor = "#FFFBA2";
		break;
		case "red":
			fadecolor = "#FF7F7F";
		break;
		default:
			fadecolor = color;
		break;
	};
	var base_background_color = $(this).css("background-color"),
		base_background = $(this).css("background");
		
	$(this).css({background: "", backgroundColor: fadecolor}).animate({backgroundColor: base_background_color }, 800, function(){
		$(this).css("background", "");
	});
	return this;
};

/**
 * Peafowl slidedown effect
 * Bring the element using slideDown-type effect
 * @argument speed (fast|normal|slow|int)
 * @argument callback fn
 */
jQuery.fn.pf_slideDown = function(speed, callback){
	
	var default_speed = "normal",
		this_length = $(this).length,
		css_prechanges, css_animation, animation_speed;
	
	if(typeof speed == "function"){
		callback = speed;
		speed = default_speed;		
	}
	if(typeof speed == "undefined"){
		speed = default_speed;
	}
	
	$(this).each(function(index){
		var this_css_top = parseInt($(this).css("top")),
			to_top = this_css_top > 0 ? this_css_top : 0;
		
		if(speed == 0){
			css_prechanges = {display: "block", opacity: 0},
			css_animation = {opacity: 1},
			animation_speed = jQuery.speed("fast").duration;
		} else {
			css_prechanges = {top: -$(this).outerHeight(true), opacity: 1, display: "block"};
			css_animation = {top: to_top};
			animation_speed = jQuery.speed(speed).duration;
		}
		
		$(this).data("originalTop", $(this).css("top"));
		$(this).css(css_prechanges).animate(css_animation, animation_speed, function(){
			if (index == this_length - 1){
				if(typeof callback == "function"){
					callback();
				}
			}
		});
	});
	
	return this;
};

/**
 * Peafowl slideUp effect
 * Move the element using slideUp-type effect
 * @argument speed (fast|normal|slow|int)
 * @argument callback fn
 */				
jQuery.fn.pf_slideUp = function(speed, callback){
	
	var default_speed = "normal",
		this_length = $(this).length;
	
	if(typeof speed == "function"){
		callback = speed;
		speed = default_speed;		
	}
	if(typeof speed == "undefined"){
		speed = default_speed;
	}
		
	$(this).each(function(index){
		$(this).animate({top: -$(this).outerHeight(true)}, jQuery.speed(speed).duration, function(){
			$(this).css({display: "none", top: $(this).data("originalTop")});
			if(index == this_length - 1){
				if(typeof callback == "function"){
					callback();
				}
			}
		});
	});
	
	return this;
};

/**
 * Peafowl visible on viewport
 */
jQuery.fn.is_in_viewport = function(){
	var rect = $(this)[0].getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document. documentElement.clientHeight) && /*or $(window).height() */
        rect.right <= (window.innerWidth || document. documentElement.clientWidth) /*or $(window).width() */
    );
}

/**
 * Scroll the window to the target.
 * @argument target selector
 * @argument callback fn
 */
PF.fn.scroll = function(target, callback){
	if(typeof target == "function") {
		var callback = target,
			target = "";
	}
	
	var pxtop = parseInt($("body").css("margin-top"));
	if(pxtop==0 && $(".top-bar-placeholder").exists()) {
		pxtop = $(".top-bar-placeholder").height();
	}
	
	if(!$(target).exists()) target = "html";
	$("body,html").animate({scrollTop: $(target).offset().top - pxtop},"normal", function(){
		if(typeof callback == "function") callback();
	});
};

PF.fn.close_pops = function(){
	$(".pop-box:visible").each(function(){
		$(this).closest(".pop-btn").click();
	});
};

/**
 * Bring up a nice growl-like alert
 */
PF.fn.growl = {

	str: {
		growl_timeout: ""
	},
	
	/**
	 * Fires the growl
	 * @argument options object
	 */
	call:
		function(options){
			if(typeof options == "undefined") return
			if(typeof options == "string"){
				options = {message: options};
			}
			if(typeof options.message == "undefined") return;
			
			var growl_options, $growl_template, growl_class, growl_color;
			
			growl_options = {
				message: options.message,
				insertTo: "body",
				where: "before",
				color: "default",
				css: {},
				classes: "",
				expires: 0,
				callback: function(){}
			};
			
			for(key in growl_options) {
				if(typeof options[key] !== "undefined") {
					if(key.match("/^(callback)$/")) {
						if(typeof options[key] == "function") {
							growl_options[key] = options[key];
						}
					} else {
						growl_options[key] = options[key];
					}
					
				}
			}

			if(!$(growl_options.insertTo).exists()){
				growl_options.insertTo = "body";
			}

			if($("#growl").exists()){
				if($("#growl").text() == growl_options.message){
					$("#growl").shake();
					return;
				}
				$("#growl").remove();
			}
			
			console.log(growl_options.message);
			
			$growl_template = $('<div id="growl" class="growl">'+growl_options.message+'<span class="icon icon-close" data-action="close"></span></div>').css(growl_options.css).addClass(growl_options.classes);

			growl_class = growl_options.insertTo !== "body" ? "static" : "";

			switch(growl_options.color){
				case "dark":
					growl_color = "dark";
				break;
				default:
					growl_color = "";
				break;
			}

			$growl_template.addClass(growl_class+" "+growl_color);

			if(growl_options.where == "before"){
				$(growl_options.insertTo).prepend($growl_template.hide());
			} else {
				$(growl_options.insertTo).append($growl_template.hide());
			}

			if($(".fullscreen").is(":visible")){
				$growl_template.css({"z-index": parseInt($(".fullscreen").css("z-index"))+1});
			}
			if($(PF.obj.modal.selectors.root).is(":visible")){
				$modal_box = $(PF.obj.modal.selectors.box, PF.obj.modal.selectors.root);
				$growl_template.show();
				$growl_template.css("top", ($modal_box.position().top + parseInt($modal_box.css("margin-top")) - $growl_template.outerHeight(true))/2);
				$growl_template.hide();
			}

			$growl_template.pf_slideDown(growl_class == "static" ? 0 : "normal", function(){
				if(typeof growl_options.callback == "function"){
					growl_options.callback();
				}
			});

			$(document).on("click", ".growl [data-action=close]", function(){
				PF.fn.growl.close();
			});

			if(growl_options.expires > 0){
				if(this.str.growl_timeout !== ""){
					clearTimeout(this.str.growl_timeout);
				}
				this.str.growl_timeout = setTimeout(function(){
					PF.fn.growl.close();
				}, growl_options.expires);
			}

		},
	
	/**
	 * Fires an expirable growl (will close after time)
	 * @argument msg string
	 * @argument time int (ms)
	 */
	expirable:
		function(msg,time){
			if(typeof msg == "undefined") return;
			if(typeof time == "undefined") time = 10000;
			PF.fn.growl.call({message: msg, expires: time});
		},
		
	/**
	 * Closes the growl
	 * @argument callback fn
	 */
	close:
		function(callback){
			$growl = $("#growl");
			if(!$growl.exists()) return;
			$("#growl").fadeOut("fast", function(){
				$(this).remove();
				if(typeof callback == "function"){
					callback();
				}
			});
		}
	
};

/**
 * Bring up a nice fullscreen modal
 */
PF.obj.modal = {
	type: "",
	selectors: {
		root: "#fullscreen-modal",
		box: "#fullscreen-modal-box",
		body: "#fullscreen-modal-body",
		login: "[data-modal=login]",
		changes_confirm: "#fullscreen-changes-confirm",
		btn_container: ".btn-container",
		close_buttons: ".close-modal,.cancel-modal,[data-action=cancel],[data-action-close]",
		submit_button: "[data-action=submit]"
	},
	ajax: {
		url: "",
		deferred: {}
	},
	locked: false,
	form_data: {},
	XHR: {}
};
PF.obj.modal.$close_buttons = $(PF.obj.modal.selectors.close_buttons, PF.obj.modal.selectors.root);
PF.obj.modal.$submit_button = $(PF.obj.modal.selectors.submit_button, PF.obj.modal.selectors.root);

PF.fn.modal = {
	
	/**
	 * Fires the modal
	 * @argument options object
	 */
	call:
		function(options){
			var modal_options, modal_base_template, modal_message;
			
			if(typeof options == "undefined") return;
			if(typeof options.template !== "undefined") options.type = "html";	
			if((typeof options.title == "undefined" || typeof options.message == "undefined") && (options.type !== "login" && options.type !== "html")) return;
			
			PF.fn.growl.close();

			modal_options = {
				type: "confirm",
				title: options.title,
				message: options.message,
				html: false,
				template: options.template,
				buttons: true,
				button_submit: PF.fn.get_lang_string("submit_button"),
				txt_or: PF.fn.get_lang_string("or"),
				button_cancel: PF.fn.get_lang_string("cancel_button"),
				ajax: {url: null, data: null, deferred: {}},
				confirm: function(){},
				cancel: function(){
					PF.fn.modal.close();
				},
				callback: function() {}
			};
			
			for(key in modal_options) {
				if(typeof options[key] !== "undefined") {
					if((/^cancel|confirm|callback$/).test(key)) {
						if(typeof options[key] == "function") {
							modal_options[key] = options[key];
						}
					} else {
						modal_options[key] = options[key];
					}
					
				}
			}
			
			if(typeof options.ajax !== "undefined" && !options.ajax.url && options.ajax.deferred) {
				modal_options.ajax.url = PF.obj.config.json_api;
			}
			
			if(modal_options.type == "login"){
				modal_options.buttons = false;
			}
			
			if(modal_options.type == "confirm") {
				modal_options.button_submit = PF.fn.get_lang_string("confirm_button");
			}
			
			modal_base_template = ['<div id="', PF.obj.modal.selectors.root.replace("#", ""), '"class="fullscreen white"><div id="', PF.obj.modal.selectors.box.replace("#", ""), '"class="clickable"><div id="', PF.obj.modal.selectors.body.replace("#", ""), '">%MODAL_BODY%</div> %MODAL_BUTTONS%<span class="close-modal icon-close" data-action="close-modal"></span></div></div>'].join("");

			modal_buttons = modal_options.buttons ? ['<div class="', PF.obj.modal.selectors.btn_container.replace(".", ""), '"><button class="btn btn-input default" data-action="submit" type="submit">', modal_options.button_submit, '</button> <span class="btn-alt">', modal_options.txt_or, '<a class="cancel" data-action="cancel">', modal_options.button_cancel, '</a></span></div>'].join("") : "";
			
			if(modal_options.type == "login"){
				modal_options.template = typeof modal_options.template == "undefined" ? $(PF.obj.modal.selectors.login).html() : modal_options.template;
			}
			
			var modalBodyHTML;
			
			switch(modal_options.type){
				case "html":
				case "login":
					modalBodyHTML = modal_options.template;
				break;
				case "confirm": default:
					modal_message = modal_options.message;
					if(!modal_options.html){
						modal_message = '<p>'+modal_message+'</p>';
					}
					modalBodyHTML = '<h1>'+modal_options.title+'</h1>'+modal_message;
				break;
			}
			
			if(typeof modalBodyHTML == "undefined") {
				console.log("PF Error: Modal content is empty");
				return;
			}
			
			modal_base_template = modal_base_template.replace("%MODAL_BODY%", modalBodyHTML).replace("%MODAL_BUTTONS%", modal_buttons).replace(/template-tooltip/g, "tooltip");
			
			$(PF.obj.modal.selectors.root).remove();
			$("body").prepend(modal_base_template);
			
			$("[rel=tooltip]", PF.obj.modal.selectors.root).each(function(){
				PF.fn.bindtipTip(this, {content:$(this).data("title")});
			});
		
			
			$(PF.obj.modal.selectors.root).fadeIn(function(){

				if($(":button, input[type=submit], input[type=reset]", PF.obj.modal.selectors.root).length > 0) {
					$(PF.obj.modal.selectors.box, PF.obj.modal.selectors.root).wrapInner('<form />');
				}
				
				$("html").data("modal-form-values", $(":input", PF.obj.modal.selectors.root).serialize());
				modal_options.callback();
				
			});

			// Bind the modal events
			$(PF.obj.modal.selectors.root).click(function(e){
				
				var $this = $(e.target);
				
				if(PF.obj.modal.locked) {
					return;
				}
				
				// Changes confirm?
				if($this.closest(PF.obj.modal.selectors.changes_confirm).exists() && ($this.is(PF.obj.modal.selectors.close_buttons) || $this.is(PF.obj.modal.selectors.submit_button))) {
					
					$(PF.obj.modal.selectors.changes_confirm).fadeOut("fast", function() { $(this).remove() });

					if($this.is(PF.obj.modal.selectors.close_buttons)) {
						$(PF.obj.modal.selectors.box, $(this)).fadeIn("fast");
					} else {
						PF.fn.modal.close();
					}
				
				// Modal
				} else {
					if(!$this.closest(".clickable").exists() || $this.is(PF.obj.modal.selectors.close_buttons)){
						PF.fn.growl.close();
						modal_options.cancel();
					}
					if($this.is(PF.obj.modal.selectors.submit_button)){
						
						if(modal_options.confirm() === false) {
							return;
						}
						
						var modal_submit_continue = true;
						
						if($("input, textarea, select", PF.obj.modal.selectors.root).not(":input[type=button], :input[type=submit], :input[type=reset]").length > 0 && !PF.fn.form_modal_has_changed()) {
							modal_submit_continue = false;
						}
						
						if(modal_submit_continue) {
							
							if(modal_options.ajax.url) {
								var $btn_container = $(PF.obj.modal.selectors.btn_container, PF.obj.modal.selectors.root);
								PF.obj.modal.locked = true;
								
								$btn_container.first().clone().height($btn_container.height()).html("").addClass("loading").appendTo(PF.obj.modal.selectors.root + " form");
								$btn_container.hide();
								
								PF.obj.modal.$close_buttons.hide();
								
								var modal_loading_msg;
								
								switch(PF.obj.modal.type) {
									case "edit":
										modal_loading_msg = "Guardando";
									break;
									case "confirm":
									case "form":
									default:
										modal_loading_msg = "Enviando";
									break;
								}
								
								PF.fn.loading.inline($(PF.obj.modal.selectors.btn_container+".loading", PF.obj.modal.selectors.root), {size: "small", message: modal_loading_msg, valign: "center"});
									
								$(PF.obj.modal.selectors.root).disableForm();
								
								
								
								if(typeof options.ajax !== "undefined" && typeof options.ajax.data == "undefined") {
									modal_options.ajax.data = PF.obj.modal.form_data;
								}
								
								PF.obj.modal.XHR = $.ajax({
									url: modal_options.ajax.url,
									type: "POST",
									data: modal_options.ajax.data //PF.obj.modal.form_data // $.param ?
								}).complete(function(XHR){
									
									PF.obj.modal.locked = false;
									
									if(XHR.status == 200) {
										
										var success_fn = typeof modal_options.ajax.deferred !== "undefined" && typeof modal_options.ajax.deferred.success !== "undefined" ? modal_options.ajax.deferred.success : null;
										
										if(typeof success_fn == "function") {
											PF.fn.modal.close(function() {
												if(typeof success_fn == "function") {
													success_fn(XHR);
												}
											});
										} else if(typeof success_fn == "object") {

											if(typeof success_fn.before == "function") {
												success_fn.before(XHR);
											}
											if(typeof success_fn.done == "function") {
												success_fn.done(XHR);
											}
										}	
										
									} else {
										
										$(PF.obj.modal.selectors.root).enableForm()
										$(PF.obj.modal.selectors.btn_container+".loading", PF.obj.modal.selectors.root).remove();
										$btn_container.css("display", "");
										
										if(typeof modal_options.ajax.deferred !== "undefined" && typeof modal_options.ajax.deferred.error == "function") {
											modal_options.ajax.deferred.error(XHR);
										} else {
											PF.fn.growl.call("Ocurrio un error. Intentalo más tarde");
										}

									}
								});
							
							} else {
								// No ajax behaviour
								
							}
							
						}
					}
				}
			});
		},
	
	/**
	 * Fires a confirm modal
	 * @argument options object
	 */
	confirm:
		function(options){
			options.type = "confirm";
			if(typeof options.title == "undefined"){
				options.title = PF.fn.get_lang_string("confirm_action");
			}
			PF.fn.modal.call(options);
		},
	
	/**
	 * Fires a simple info modal
	 */
	simple:
		function(options){
			if(typeof options == "string") options = {message: options};
			if(typeof options.buttons == "undefined") options.buttons = false;
			if(typeof options.title == "undefined") options.title = PF.fn.get_lang_string("information");
			PF.fn.modal.call(options);
		},
	
	/**
	 * Closes the modal
	 * @argument callback fn
	 */
	close:
		function(callback){
			PF.fn.growl.close();
			$("[rel=tooltip]", PF.obj.modal.selectors.root).tipTip("hide");
			$(PF.obj.modal.selectors.root).fadeOut("fast", function(){
				$(this).remove();
				if(typeof callback == "function") callback();
			});
		}
};

/**
 * Peafowlesque popups
 */
PF.fn.popup = function(options){
	
	var settings = {
			height: options.height || 500,
			width: options.width || 650,
			scrollTo: 0,
			resizable: 0,
			scrollbars: 0,
			location: 0
		};

	settings.top = (screen.height/2) - (settings.height/2);
	settings.left = (screen.width/2) - (settings.width/2);
	
	var settings_ = "";
	for(var key in settings){
		settings_ += key + "=" + settings[key] + ",";
	}
	settings_ = settings_.slice(0, -1); // remove the last comma
		
	window.open(options.href, "Popup", settings_);
	return;
}


/**
 * PEAFOWL FLUID WIDTH FIXER
 * -------------------------------------------------------------------------------------------------
 */
PF.fn.list_fluid_width = function(){
	if(!$("body").is_fluid()) return;
	
	var $content_listing = $(PF.obj.listing.selectors.content_listing_visible),
		$pad_content_listing = $(PF.obj.listing.selectors.pad_content, $content_listing),
		$list_item = $(PF.obj.listing.selectors.list_item, $content_listing),
		list_item_width = $list_item.outerWidth(true),
		list_item_gutter = $list_item.outerWidth(true) - $list_item.width();

	PF.obj.listing.content_listing_ratio = parseInt(($content_listing.width()+list_item_gutter) / list_item_width);

	if($list_item.length < PF.obj.listing.content_listing_ratio) {
		$pad_content_listing.css("width", "100%");
		return;
	}
	
	$pad_content_listing.width((PF.obj.listing.content_listing_ratio * list_item_width) - list_item_gutter);
	
	if(PF.obj.follow_scroll.$node.hasClass("fixed")) {
		PF.obj.follow_scroll.$node.width($(".content-width").first().width());
	}

}

/**
 * PEAFOWL TABS
 * -------------------------------------------------------------------------------------------------
 */

PF.obj.tabs = {
	hashdata: {}
};

PF.fn.show_tab = function(tab){
	
	if(typeof tab == "undefined") return;
	var $this = $("a[data-tab=" + tab + "]", ".content-tabs");
	
	$("li", $this.closest("ul")).removeClass("current");
	$this.closest("li").addClass("current");
	
	var $tab_content_group = $("#"+$this.closest("ul").data("tabs"));
	$target = $("#"+$this.data("tab"));
	
	$(".tabbed-content", $tab_content_group).removeClass("visible").hide();
	$($target, $tab_content_group).addClass("visible").show();
	
	// Show/hide the listing sorting
	$("[data-content=list-selection]").removeClass("visible").addClass("hidden");
	$("[data-content=list-selection][data-tab="+$this.data("tab")+"]").removeClass("hidden").addClass("visible")

	if($tab_content_group.exists()){
	
		var $list_item_target = $(PF.obj.listing.selectors.list_item+":not(.jsly)", $target),
			target_fade = !$target.hasClass("jsly");
		
		if($target.data("load") == "ajax" && $target.data("empty") !== "true" && !$(PF.obj.listing.selectors.list_item, $target).exists()){
			PF.fn.listing_querystring.stock_load();
			$target.html(PF.obj.listing.template.fill);
			PF.fn.loading.inline($(PF.obj.listing.selectors.content_listing_loading, $target));
			PF.fn.listing_querystring.stock_new();
			PF.fn.listing_ajax();
		} else {
			PF.fn.listing_querystring.stock_current();
			$list_item_target.imagesLoaded(function(){
				PF.fn.list_columnizer();
				$list_item_target[target_fade ? "fadeIn" : "show"]();
			});
		}
		
		PF.fn.list_columnizer(true); // nota
		
	}
	
	if($(PF.obj.listing.selectors.content_listing_visible).data("queued") == true) {
		PF.fn.list_refresh();
	}
	
}

/**
 * PEAFOWL LISTINGS
 * -------------------------------------------------------------------------------------------------
 */
PF.obj.listing = {
	columns: "",
	columns_number: 1,
	current_column: "",
	current_column: "",
	XHR: {},
	query_string: PF.fn.get_url_vars(),
	calling: false,
	content_listing_ratio: 1,
	selectors: {
		sort: ".sort-listing .current [data-sort]",
		content_listing: ".content-listing",
		content_listing_visible: ".content-listing:visible",
		content_listing_loading: ".content-listing-loading",
		content_listing_pagination: ".content-listing-pagination",
		empty_icon: ".icon icon-drawer",
		pad_content: ".pad-content-listing",
		list_item: ".list-item"
	},
	template: {
		fill: $("[data-template=content-listing]").html(),
		empty: $("[data-template=content-listing-empty]").html(),
		loading: $("[data-template=content-listing-loading]").html()
	}	
};

PF.fn.listing_querystring = {
	
	// Stock the querystring values from initial load
	stock_load: function() {
		
		var $content_listing = $(PF.obj.listing.selectors.content_listing_visible),
			params = PF.fn.deparam($content_listing.data("params"));
		
		PF.obj.listing.hidden_params = typeof $content_listing.data("params-hidden") !== "undefined" ?  PF.fn.deparam($content_listing.data("params-hidden")) : null;
		
		if(typeof PF.obj.listing.query_string.action == "undefined") {
			PF.obj.listing.query_string.action = $content_listing.data("action") || "list";
		}
		if(typeof PF.obj.listing.query_string.list == "undefined") {
			PF.obj.listing.query_string.list = $content_listing.data("list");
		}
		if(typeof PF.obj.listing.query_string.sort == "undefined") {
			if(typeof params !== "undefined" && typeof params.sort !== "undefined") {
				PF.obj.listing.query_string.sort = params.sort;
			} else {
				PF.obj.listing.query_string.sort = $(":visible"+PF.obj.listing.selectors.sort).data("sort");
			}
		}
		if(typeof PF.obj.listing.query_string.page == "undefined") {
			PF.obj.listing.query_string.page = 1;
		}
		$content_listing.data("page", PF.obj.listing.query_string.page);
		
		// Stock the real ajaxed hrefs for ajax loads
		$(PF.obj.listing.selectors.content_listing+"[data-load=ajax]").each(function(){

		var $sortable_switch = $("[data-tab="+$(this).attr("id")+"]"+PF.obj.listing.selectors.sort);
		var dataParams = PF.fn.deparam($(this).data("params")),
			dataParamsHidden = PF.fn.deparam($(this).data("params-hidden")),
			params = {
				   q: dataParams && dataParams.q ? dataParams.q : null,
				list: $(this).data("list"),
				sort: $sortable_switch.exists() ? $sortable_switch.data("sort") : (dataParams && dataParams.sort ? dataParams.sort: null),
				page: dataParams && dataParams.page ? dataParams.page : 1
			}
				
			if(dataParamsHidden && dataParamsHidden.list) {
				delete params.list;
			}
			
			for(var k in params) {
				if(!params[k]) delete params[k];
			}
			
			//$("a[data-tab="+$(this).attr("id")+"]").attr("href", window.location.href.split("?")[0].replace(/\/$/, "") + "/?" + $.param(params))
			
		});
		
		// The additional params setted in data-params=""
		for(var k in params) {
			if(/action|list|sort|page/.test(k) == false) {
				PF.obj.listing.query_string[k] = params[k];
			}
		}
		// The additional params setted in data-hidden-params=""
		for(var k in PF.obj.listing.hidden_params) {
			if(/action|list|sort|page/.test(k) == false) {
				PF.obj.listing.query_string[k] = PF.obj.listing.hidden_params[k];
			}
		}

	},
	
	// Stock new querystring values for initial ajax call
	stock_new: function(){
		var $content_listing = $(PF.obj.listing.selectors.content_listing_visible),
			params = PF.fn.deparam($content_listing.data("params"));
		
		if($content_listing.data("offset")) {
			PF.obj.listing.query_string.offset = $content_listing.data("offset");
		} else {
			delete PF.obj.listing.query_string.offset;
		}
		
		PF.obj.listing.query_string.action = $content_listing.data("action") || "list";
		PF.obj.listing.query_string.list = $content_listing.data("list");
		
		if(typeof params !== "undefined" && typeof params.sort !== "undefined") {
			PF.obj.listing.query_string.sort = params.sort;
		} else {
			PF.obj.listing.query_string.sort = $(":visible"+PF.obj.listing.selectors.sort).data("sort");
		}

		PF.obj.listing.query_string.page = 1;
	},
	
	// Stock querystring values for static tab change
	stock_current: function(){
		this.stock_new();
		PF.obj.listing.query_string.page = $(PF.obj.listing.selectors.content_listing_visible).data("page");
	}
}

// Initial load -> Stock the current querystring
PF.fn.listing_querystring.stock_load();

PF.fn.listing_ajax = function(){

	if(PF.obj.listing.calling == true) {
		return;
	}
	
	PF.obj.listing.calling = true;
	
	var $content_listing = $(PF.obj.listing.selectors.content_listing_visible),
		$pad_content_listing = $(PF.obj.listing.selectors.pad_content, $content_listing);
	
	console.log($content_listing);
	
	PF.obj.listing.XHR = $.ajax({
		type: "GET",
		data: $.param(PF.obj.listing.query_string)
	}).complete(function(XHR) {
		
		var response = XHR.responseJSON;
		var removePagination = function() {
				$(PF.obj.listing.selectors.content_listing_loading+","+PF.obj.listing.selectors.content_listing_pagination+":not([data-visibility=visible])", $content_listing).remove();
			},
			setEmptyTemplate = function() {
				$content_listing.data("empty", "true").html(PF.obj.listing.template.empty);
				$("[data-content=list-selection][data-tab="+$content_listing.attr("id")+"]").addClass("disabled");
			}
		
		if(XHR.readyState == 4 && typeof response !== "undefined") {
			
			$("[data-content=list-selection][data-tab="+$content_listing.attr("id")+"]").removeClass("disabled");
			
			// Bad Request Bad Request what you gonna do when they come for ya?
			if(XHR.status !== 200) {
				// This is here to inherit the emptys
				var response_output = typeof response.error !== "undefined" && typeof response.error.message !== "undefined" ? response.error.message : "Bad request";
				PF.fn.growl.call("Error: "+response_output);
				$content_listing.data("load", ""); 
			}
			// Empty HTML
			if((typeof response.html == "undefined" || response.html == "") && $(PF.obj.listing.selectors.list_item, $content_listing).length == 0) {
				setEmptyTemplate();
			}
			// End of the line
			if(typeof response.html == "undefined" || response.html == "") {
				removePagination();
				PF.obj.listing.calling = false;
				if(typeof PF.fn.listing_end == "function") {
					PF.fn.listing_end();
				}
				return;
			}
			
			// Listing stuff
			$content_listing.data({
				"load": "",
				"page": PF.obj.listing.query_string.page
			});
			
			var url_object = $.extend({}, PF.obj.listing.query_string);
			for(var k in PF.obj.listing.hidden_params) {
				if(typeof url_object[k] !== "undefined") {
					delete url_object[k];
				}
			}

			delete url_object["action"];
			
			for(var k in url_object) {
				if(!url_object[k]) delete url_object[k];
			}
			
			// get the fancy URL with scrollTop attached
			if(document.URL.indexOf("?" + $.param(url_object)) == -1) {
				History.pushState({pushed: "pagination", scrollTop: $(window).scrollTop()}, document.title, window.location.href.split("?")[0].replace(/\/$/, "") + "/?" + $.param(url_object));
			}
			
			$("a[data-tab="+$content_listing.attr("id")+"]").attr("href", document.URL);
			
			$pad_content_listing.append(response.html);
			$(PF.obj.listing.selectors.list_item+":not(.jsly)", $content_listing).imagesLoaded(function(){
				
				// Remove loader and pagination for small listings or near to end
				if($(response.html).length < PF.obj.config.listing.items_per_page || $(PF.obj.listing.selectors.list_item, $content_listing).length < PF.obj.config.listing.items_per_page) {
					$(PF.obj.listing.selectors.content_listing_loading+", "+PF.obj.listing.selectors.content_listing_pagination+":not([data-visibility=visible])", $content_listing).remove();
				}
				
				PF.fn.list_columnizer(PF.obj.listing.recolumnize);
				PF.obj.listing.recolumnize = false;
				$(PF.obj.listing.selectors.list_item+":hidden").fadeIn();
				PF.obj.listing.calling = false;
			});

		} else {
			// Network error, abort or something similar
			PF.obj.listing.calling = false;
			$content_listing.data("load", "");
			removePagination();
			if($(PF.obj.listing.selectors.list_item, $content_listing).length == 0) {
				setEmptyTemplate();
			}
			if(XHR.readyState !== 0) {
				PF.fn.growl.call("An error occurred. Please try again later.");
			}
		}

	});

}

PF.fn.list_columnizer_queue = function() {
	$(PF.obj.listing.selectors.content_listing+":hidden").data("queued", true);
};

PF.fn.list_refresh = function() {
	$(PF.obj.listing.selectors.content_listing_visible).data("queued", false);
	PF.fn.list_columnizer(true);
	$(".list-item").show();
};

// Peafowl's mansory approach... Just because godlike.
PF.fn.list_columnizer = function(forced) {
	
	if(typeof forced !== "boolean") forced = false;
			
	var $container = $("#content-listing-tabs").exists() ? $(PF.obj.listing.selectors.content_listing_visible, "#content-listing-tabs") : $(PF.obj.listing.selectors.content_listing),
		$pad_content_listing = $(PF.obj.listing.selectors.pad_content, $container),
		$list_item = $(forced ? PF.obj.listing.selectors.list_item : PF.obj.listing.selectors.list_item+":not(.jsly)", $container);
	
	if(!$list_item.exists()) return;

	$container.addClass("jsly");
	
	if(typeof $container.data("columns") !== "undefined" && !forced){
		PF.obj.listing.columns = $container.data("columns");
		PF.obj.listing.columns_number = $container.data("columns").length - 1;
		PF.obj.listing.current_column = $container.data("current_column");
	} else {
		PF.obj.listing.columns = new Array(),
		PF.obj.listing.columns_number = parseInt(($container.width() + parseInt($list_item.css("margin-right"))) / $list_item.outerWidth(true));
		for(i = 0; i < PF.obj.listing.columns_number; i++){
			PF.obj.listing.columns[i+1] = 0;
		}
		PF.obj.listing.current_column = 1;
	}
	
	$list_item.each(function(index){
		
		$(this).addClass("jsly");
		
		if(PF.obj.listing.current_column > PF.obj.listing.columns_number){
			PF.obj.listing.current_column = 1
		}
		
		$(this).attr("data-col", PF.obj.listing.current_column);
		
		var $list_item_img = $(".list-item-image", this),
			$list_item_src = $(".list-item-image img", this);
		
		if(!$list_item_src.exists()){
			console.log("aa");
			$list_item_src = $(".image-container .empty", this);
		}
					
		// Meet the minHeight?
		if($(".list-item-image", this).css("min-height") && !$list_item_src.hasClass("jsly")){
			
			$list_item.show();
			
			var imageratio = $list_item_src.width()/$list_item_src.height();
			
			if(imageratio > 1 || imageratio==1){ // Landscape
				$list_item_img.css("max-height", $list_item_img.width());
			} 
			
			var list_item_img_min_height = parseInt($(".list-item-image", this).css("height"));
			
			if(imageratio > 1 || imageratio==1){ // Landscape
				if($list_item_src.height() > list_item_img_min_height){ // Bigger than the minHeight
					$list_item_src.height(list_item_img_min_height);
				}
			}
			if(imageratio < 1 || imageratio==1){ // Portrait
				$list_item_src.width("100%");
			}
			
			if($list_item_img.hasClass("fixed-size")){
				$list_item_img.css({"max-height": "", "height": $list_item_img.width()});
			}
			
			if($list_item_src.height() != 0 && ($list_item_src.height() !== "0" && $list_item_img.height() > $list_item_src.height() || $list_item_img.hasClass("fixed-size"))){
				$list_item_src.parent().css({
					"marginTop": ($list_item_img.outerHeight() - $list_item_src.height())/2
				});
			}
			
			if($list_item_img.width() < $list_item_src.width()){
				$list_item_src.parent().css({
					"marginLeft": -(($list_item_src.outerWidth()-$list_item_img.width())/2)
				});
			}
			
			var list_item_src_pitfall_x = Math.max($list_item_src.position().left * 2, 0),
				list_item_src_pitfall_y = Math.max($list_item_src.position().top * 2, 0);
			
			// Do we need upscale and is safe to upscale the image?
			if(list_item_src_pitfall_x > 0 || list_item_src_pitfall_y > 0){
			
				var pitfall_ratio_x = list_item_src_pitfall_x/$list_item_img.width(),
					pitfall_ratio_y = list_item_src_pitfall_y/$list_item_img.height();
				
				if(pitfall_ratio_x <= .25 && pitfall_ratio_y <= .25){
					if(pitfall_ratio_x > pitfall_ratio_y){
						$list_item_src.width(list_item_src_pitfall_x + $list_item_img.width()).height("auto");
					} else {
						$list_item_src.height(list_item_src_pitfall_y + $list_item_src.height()).width("auto");
					}
					$list_item_src.parent().css({
						"marginLeft": -(($list_item_src.width()-$list_item_img.width())/2),
						"marginTop": 0
					});
				}
				
			}
			
			$list_item.hide();
		}
		
		$pad_content_listing.css("visibility", "visible");
		
		$(this).addClass("position-absolute").animate({
			height: $(this).height(),
			left: $(this).outerWidth(true)*(PF.obj.listing.current_column - 1)
		}, 350);
		
		PF.obj.listing.columns[PF.obj.listing.current_column] += $(this).outerHeight(true);
		$(this).animate({
			top: PF.obj.listing.columns[PF.obj.listing.current_column] - $(this).outerHeight(true)
		}, 350);
		
		$list_item_src.addClass("jsly");
		
		PF.obj.listing.current_column++
		
	});
	
	$container.data({"columns": PF.obj.listing.columns, "current_column": PF.obj.listing.current_column});
	
	var content_listing_height = 0;
	$.each(PF.obj.listing.columns, function(i, v){
		if(v>content_listing_height) {
			content_listing_height = v;
		}
	});
	
	$pad_content_listing.height(content_listing_height);
	
	PF.fn.list_fluid_width();
}

/**
 * PEAFOWL LOADERS
 * -------------------------------------------------------------------------------------------------
 */
PF.fn.loading = {
	spin: {
		small: {lines: 11, length: 0, width: 3, radius: 7, speed: 1, trail: 45, blocksize: 20}, // 20x20
		normal: {lines: 11, length: 0, width: 5, radius: 10, speed: 1, trail: 45, blocksize: 30}, // 30x30
		big: {lines: 11, length: 0, width: 7, radius: 13, speed: 1, trail: 45, blocksize: 40}, // 40x40
		huge: {lines: 11, length: 0, width: 9, radius: 16, speed: 1, trail: 45, blocksize: 50} // 50x50
	},
	inline: function($target, options){

		if(typeof $target == "undefined") return;
		
		if($target instanceof jQuery == false) {
			var $target = $($target);
		}
		
		var defaultoptions = {
				size: "normal",
				color: "#333",
				center: false,
				position: "absolute",
				shadow: false,
				valign: "top"
			};
		
		if(typeof options == "undefined"){
			options = defaultoptions;
		} else {
			for(var k in defaultoptions) {
				if(typeof options[k] == "undefined") {
					options[k] = defaultoptions[k];
				}
			}
		}
		
		var size = PF.fn.loading.spin[options.size];
		
		PF.fn.loading.spin[options.size].color = options.color;
		PF.fn.loading.spin[options.size].shadow = options.shadow;
		
		$target.html('<span class="loading-indicator"></span>' + (typeof options.message !== "undefined" ? '<span class="loading-text">'+ options.message +'</span>' : '')).css({"line-height": PF.fn.loading.spin[options.size].blocksize + "px"});
		
		$(".loading-indicator", $target).css({width: PF.fn.loading.spin[options.size].blocksize, height: PF.fn.loading.spin[options.size].blocksize}).spin(PF.fn.loading.spin[options.size]);
		
		if(options.center){
			$(".loading-indicator", $target.css("textAlign", "center")).css({
				position: options.position,
				top: "50%",
				left: "50%",
				marginTop: -(PF.fn.loading.spin[options.size].blocksize/2),
				marginLeft: -(PF.fn.loading.spin[options.size].blocksize/2)
			});
		}
		if(options.valign == "center") {
			$(".loading-indicator,.loading-text", $target).css("marginTop", ($target.height()-PF.fn.loading.spin[options.size].blocksize)/2 + "px");
		}
		
		$(".spinner", $target).css({top: PF.fn.loading.spin[options.size].blocksize/2 + "px", left: PF.fn.loading.spin[options.size].blocksize/2 + "px"});
		
	},
	fullscreen: function(){
		$("body").append('<div class="fullscreen" id="pf-fullscreen-loader"><div class="fullscreen-loader black-bkg"><span class="loading-txt">Cargando</span></div></div>');
		$(".fullscreen-loader", "#pf-fullscreen-loader").spin(PF.fn.loading.spin.huge);
	},
	destroy : function($target){
		var $loader_fs = $("#pf-fullscreen-loader"),
			$loader_os = $("#pf-onscreen-loader");
		
		if($target == "fullscreen") $target = $loader_fs;
		if($target == "onscreen") $target = $loader_os;
		
		if(typeof $target !== "undefined"){
			$target.remove();
		} else {
			$("#" + [$loader_fs.attr("id"), $loader_os.attr("id")].join(",#")).remove();
		}
	}
}

/**
 * PEAFOWL FORM HELPERS
 * -------------------------------------------------------------------------------------------------
 */
jQuery.fn.disableForm = function(){
	$(this).data("disabled", true);
	$(":input", this).each(function(){
		$(this).attr("disabled", true);
	});
	return this;
}
jQuery.fn.enableForm = function(){
	$(this).data("disabled", false);
	$(":input", this).removeAttr("disabled");
	return this;
}

/**
 * PEAFOWL FOLLOW SCROLL
 * -------------------------------------------------------------------------------------------------
 */
PF.obj.follow_scroll = {
	y: "",
	$node: $(".follow-scroll")
};
PF.obj.follow_scroll.y = PF.obj.follow_scroll.$node.exists() ? PF.obj.follow_scroll.$node.offset().top : null;

PF.fn.follow_scroll = function(){
	if(is_ios()) return; // Go home iOS... You're drunk.
	if(!PF.obj.follow_scroll.$node.exists()) return; // Nothing to do here
	
	var $parent = PF.obj.follow_scroll.$node.closest("[data-content=follow-scroll-parent]");
	if(!$parent.exists()) {
		$parent = PF.obj.follow_scroll.$node.closest(".content-width");
	}
	
	if($(window).scrollTop() > PF.obj.follow_scroll.y - PF.obj.follow_scroll.$node.height() - parseInt($("#top-bar").css("top"))){		
		follow_scroll_width = ($("body").is_fluid() ? $parent.width() : PF.obj.follow_scroll.$node.width());
		PF.obj.follow_scroll.$node.width(follow_scroll_width);
		PF.obj.follow_scroll.$node.addClass("fixed");
		if(!PF.obj.follow_scroll.$node.next().is(".scroll-placeholder")){
			PF.obj.follow_scroll.$node.after($('<div class="scroll-placeholder" />').height(PF.obj.follow_scroll.$node.outerHeight(true)));
		} else {
			PF.obj.follow_scroll.$node.parent().find(".scroll-placeholder").show();
		}
	} else {
		PF.obj.follow_scroll.$node.removeClass("fixed").width("");
		PF.obj.follow_scroll.$node.parent().find(".scroll-placeholder").hide();
	}
	
};

 
/**
 * PEAFOWL FULL SCREEN VIEWER
 * -------------------------------------------------------------------------------------------------
 */
// nota: incompleto
/*$("img", ".list-item-image").click(function(e){
	if(!$(this).closest(".fullscreen-enable").exists()) return;
	e.preventDefault();
	$(this).closest(PF.obj.listing.selectors.content_listing).find(".navigation-pointer").removeClass("navigation-pointer");
	$(this).closest(".list-item").addClass("navigation-pointer");
	PF.fn.fullscreen.content($(this).attr("src").replace("_e",""));
	PF.fn.fullscreen.call();
});

$("a", ".fullscreen-viewer-navigation").click(function(){
	if($(this).hasClass("disabled")) return;
	$current_navigation_pointer = $(".navigation-pointer", PF.obj.listing.selectors.content_listing);

	switch($(this).attr("data-action")){
		case "prev":
			if(!$current_navigation_pointer.prev().exists()) return;
			$target = $current_navigation_pointer.prev();
		break;
		case "next":
			if(!$current_navigation_pointer.next().exists()) return;
			$target = $current_navigation_pointer.next();
		break;
		case "close":
			$(this).closest(".fullscreen").hide().find(".fullscreen-viewer-content img").attr("src", "");
			$("body").removeClass("overflow-hidden");
			return;
		break;
	}
	
	$current_navigation_pointer.removeClass("navigation-pointer");
	$target.addClass("navigation-pointer");
	
	$new_navigation_pointer = $(".navigation-pointer", PF.obj.listing.selectors.content_listing);
	
	PF.fn.fullscreen.content($new_navigation_pointer.find(".list-item-image img").attr("src").replace("_e",""));
			
	PF.fn.fullscreen.call();
	
});*/
/*
PF.fn.fullscreen = {
	selectors: {
		fullscreen: ".fullscreen",
		container: "#fullscreen-viewer",
		content: ".fullscreen-viewer-content",
		top: ".fullscreen-viewer-top",
		nav: ".fullscreen-viewer-navigation"
	},
	call: function(){
		PF.fn.fullscreen.update_nav();
		if(!$(this.str.fullscreen).is(":visible")){
			$(this.str.fullscreen).show();
			$("body").addClass("overflow-hidden");
			PF.fn.fullscreen.size();
		}
		
		$(this.str.content).hide().imagesLoaded(function(){
			PF.fn.fullscreen.size();
			$(this).show();
		});
	},
	
	// Fix the fullscreen size
	size: function(){
		if(!$(this.str.container).is(":visible")) return;
		$("img", this.str.content).css("margin-top", 0);
		
		var window_height = $(window).height();
		$(this.str.fullscreen).height(window_height);
		var fullscreen_content_height = window_height - ($(this.str.top).length > 0 ? $(this.str.top).height() : 0);
		
		$(this.str.content).height(fullscreen_content_height).show();
		
		var $fullscreen_content_img = $("img", this.str.content),
			fullscreen_content_img_height = $("img", this.str.content).height();
		
		$("img", this.str.content).css("margin-top", (fullscreen_content_height - fullscreen_content_img_height)/2);
	},
	update_nav: function(){
		var $navigation_pointer = $(".navigation-pointer"),
			$next_button_nav = $(this.str.nav).find('[data-action="next"]'),
			$prev_button_nav = $(this.str.nav).find('[data-action="prev"]');
			
		$next_button_nav.toggleClass("disabled", !$navigation_pointer.next().exists());
		$prev_button_nav.toggleClass("disabled", !$navigation_pointer.prev().exists());	
	},
	content: function(src){
		$("img", this.str.content).remove();
		$(".img-src-parent", this.str.content).append('<img src="js/'+src+'" alt="">');
	},
	next: function(){
	},
	prev: function(){
	}
};
*/
/**
 * JQUERY PLUGINS (strictly needed plugins)
 * -------------------------------------------------------------------------------------------------
 */

/**
 * jQuery imagesLoaded plugin v1.1.0
 * http://github.com/desandro/imagesloaded
 * MIT License. by Paul Irish et al.
 */
jQuery.fn.imagesLoaded=function(e){function o(){e.call(t,n)}function u(e){var t=e.target;if(t.src!==i&&$.inArray(t,s)===-1){s.push(t);if(--r<=0){setTimeout(o);n.unbind(".imagesLoaded",u)}}}var t=this,n=t.find("img").add(t.filter("img")),r=n.length,i="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",s=[];if(!r)o();n.bind("load.imagesLoaded error.imagesLoaded",u).each(function(){var e=this.src;this.src=i;this.src=e});return t};

/**
 * TipTip
 * Copyright 2010 Drew Wilson
 * code.drewwilson.com/entry/tiptip-jquery-plugin
 *
 * Version 1.3(modified) - Updated: Jun. 23, 2011
 * http://drew.tenderapp.com/discussions/tiptip/70-updated-tiptip-with-new-features
 *
 * This TipTip jQuery plug-in is dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
(function($){$.fn.tipTip=function(options){var defaults={activation:"hover",keepAlive:false,maxWidth:"200px",edgeOffset:6,defaultPosition:"bottom",delay:400,fadeIn:200,fadeOut:200,attribute:"title",content:false,enter:function(){},afterEnter:function(){},exit:function(){},afterExit:function(){},cssClass:""};if($("#tiptip_holder").length<=0){var tiptip_holder=$('<div id="tiptip_holder"></div>');var tiptip_content=$('<div id="tiptip_content"></div>');var tiptip_arrow=$('<div id="tiptip_arrow"></div>');$("body").append(tiptip_holder.html(tiptip_content).prepend(tiptip_arrow.html('<div id="tiptip_arrow_inner"></div>')))}else{var tiptip_holder=$("#tiptip_holder");var tiptip_content=$("#tiptip_content");var tiptip_arrow=$("#tiptip_arrow")}return this.each(function(){var org_elem=$(this),data=org_elem.data("tipTip"),opts=data&&data.options||$.extend(defaults,options),callback_data={holder:tiptip_holder,content:tiptip_content,arrow:tiptip_arrow,options:opts};if(data){switch(options){case"show":active_tiptip();break;case"hide":deactive_tiptip();break;case"destroy":org_elem.unbind(".tipTip").removeData("tipTip");break}}else{var timeout=false;org_elem.data("tipTip",{options:opts});if(opts.activation=="hover"){org_elem.bind("mouseenter.tipTip",function(){active_tiptip()}).bind("mouseleave.tipTip",function(){if(!opts.keepAlive){deactive_tiptip()}else{tiptip_holder.one("mouseleave.tipTip",function(){deactive_tiptip()})}})}else{if(opts.activation=="focus"){org_elem.bind("focus.tipTip",function(){active_tiptip()}).bind("blur.tipTip",function(){deactive_tiptip()})}else{if(opts.activation=="click"){org_elem.bind("click.tipTip",function(e){e.preventDefault();active_tiptip();return false}).bind("mouseleave.tipTip",function(){if(!opts.keepAlive){deactive_tiptip()}else{tiptip_holder.one("mouseleave.tipTip",function(){deactive_tiptip()})}})}else{if(opts.activation=="manual"){}}}}}function active_tiptip(){if(opts.enter.call(org_elem,callback_data)===false){return}var org_title;if(opts.content){org_title=$.isFunction(opts.content)?opts.content.call(org_elem,callback_data):opts.content}else{org_title=opts.content=org_elem.attr(opts.attribute);org_elem.removeAttr(opts.attribute)}if(!org_title){return}tiptip_content.html(org_title);tiptip_holder.hide().removeAttr("class").css({margin:"0px","max-width":opts.maxWidth});if(opts.cssClass){tiptip_holder.addClass(opts.cssClass)}tiptip_arrow.removeAttr("style");var top=parseInt(org_elem.offset()["top"]),left=parseInt(org_elem.offset()["left"]),org_width=parseInt(org_elem.outerWidth()),org_height=parseInt(org_elem.outerHeight()),tip_w=tiptip_holder.outerWidth(),tip_h=tiptip_holder.outerHeight(),w_compare=Math.round((org_width-tip_w)/2),h_compare=Math.round((org_height-tip_h)/2),marg_left=Math.round(left+w_compare),marg_top=Math.round(top+org_height+opts.edgeOffset),t_class="",arrow_top="",arrow_left=Math.round(tip_w-12)/2;if(opts.defaultPosition=="bottom"){t_class="_bottom"}else{if(opts.defaultPosition=="top"){t_class="_top"}else{if(opts.defaultPosition=="left"){t_class="_left"}else{if(opts.defaultPosition=="right"){t_class="_right"}}}}var right_compare=(w_compare+left)<parseInt($(window).scrollLeft()),left_compare=(tip_w+left)>parseInt($(window).width());if((right_compare&&w_compare<0)||(t_class=="_right"&&!left_compare)||(t_class=="_left"&&left<(tip_w+opts.edgeOffset+5))){t_class="_right";arrow_top=Math.round(tip_h-13)/2;arrow_left=-12;marg_left=Math.round(left+org_width+opts.edgeOffset);marg_top=Math.round(top+h_compare)}else{if((left_compare&&w_compare<0)||(t_class=="_left"&&!right_compare)){t_class="_left";arrow_top=Math.round(tip_h-13)/2;arrow_left=Math.round(tip_w);marg_left=Math.round(left-(tip_w+opts.edgeOffset+5));marg_top=Math.round(top+h_compare)}}var top_compare=(top+org_height+opts.edgeOffset+tip_h+8)>parseInt($(window).height()+$(window).scrollTop()),bottom_compare=((top+org_height)-(opts.edgeOffset+tip_h+8))<0;if(top_compare||(t_class=="_bottom"&&top_compare)||(t_class=="_top"&&!bottom_compare)){if(t_class=="_top"||t_class=="_bottom"){t_class="_top"}else{t_class=t_class+"_top"}arrow_top=tip_h;marg_top=Math.round(top-(tip_h+5+opts.edgeOffset))}else{if(bottom_compare|(t_class=="_top"&&bottom_compare)||(t_class=="_bottom"&&!top_compare)){if(t_class=="_top"||t_class=="_bottom"){t_class="_bottom"}else{t_class=t_class+"_bottom"}arrow_top=-12;marg_top=Math.round(top+org_height+opts.edgeOffset)}}if(t_class=="_right_top"||t_class=="_left_top"){marg_top=marg_top+5}else{if(t_class=="_right_bottom"||t_class=="_left_bottom"){marg_top=marg_top-5}}if(t_class=="_left_top"||t_class=="_left_bottom"){marg_left=marg_left+5}tiptip_arrow.css({"margin-left":arrow_left+"px","margin-top":arrow_top+"px"});tiptip_holder.css({"margin-left":marg_left+"px","margin-top":marg_top+"px"}).addClass("tip"+t_class);if(timeout){clearTimeout(timeout)}timeout=setTimeout(function(){tiptip_holder.stop(true,true).fadeIn(opts.fadeIn)},opts.delay);opts.afterEnter.call(org_elem,callback_data)}function deactive_tiptip(){if(opts.exit.call(org_elem,callback_data)===false){return}if(timeout){clearTimeout(timeout)}tiptip_holder.fadeOut(opts.fadeOut);opts.afterExit.call(org_elem,callback_data)}})}})(jQuery);

/**
 * jQuery UI Touch Punch 0.2.2
 * Copyright 2011, Dave Furfero
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * Depends: jquery.ui.widget jquery.ui.mouse
 */
(function(b){b.support.touch="ontouchend" in document;if(!b.support.touch){return;}var c=b.ui.mouse.prototype,e=c._mouseInit,a;function d(g,h){if(g.originalEvent.touches.length>1){return;}g.preventDefault();var i=g.originalEvent.changedTouches[0],f=document.createEvent("MouseEvents");f.initMouseEvent(h,true,true,window,1,i.screenX,i.screenY,i.clientX,i.clientY,false,false,false,false,0,null);g.target.dispatchEvent(f);}c._touchStart=function(g){var f=this;if(a||!f._mouseCapture(g.originalEvent.changedTouches[0])){return;}a=true;f._touchMoved=false;d(g,"mouseover");d(g,"mousemove");d(g,"mousedown");};c._touchMove=function(f){if(!a){return;}this._touchMoved=true;d(f,"mousemove");};c._touchEnd=function(f){if(!a){return;}d(f,"mouseup");d(f,"mouseout");if(!this._touchMoved){d(f,"click");}a=false;};c._mouseInit=function(){var f=this;f.element.bind("touchstart",b.proxy(f,"_touchStart")).bind("touchmove",b.proxy(f,"_touchMove")).bind("touchend",b.proxy(f,"_touchEnd"));e.call(f);};})(jQuery);

/**
 * JavaScript Load Image 1.9.0
 * https://github.com/blueimp/JavaScript-Load-Image
 * Copyright 2011, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */
(function(e){"use strict";var t=function(e,i,a){var n,r,o=document.createElement("img");if(o.onerror=i,o.onload=function(){!r||a&&a.noRevoke||t.revokeObjectURL(r),i&&i(t.scale(o,a))},t.isInstanceOf("Blob",e)||t.isInstanceOf("File",e))n=r=t.createObjectURL(e),o._type=e.type;else{if("string"!=typeof e)return!1;n=e,a&&a.crossOrigin&&(o.crossOrigin=a.crossOrigin)}return n?(o.src=n,o):t.readFile(e,function(e){var t=e.target;t&&t.result?o.src=t.result:i&&i(e)})},i=window.createObjectURL&&window||window.URL&&URL.revokeObjectURL&&URL||window.webkitURL&&webkitURL;t.isInstanceOf=function(e,t){return Object.prototype.toString.call(t)==="[object "+e+"]"},t.transformCoordinates=function(){},t.getTransformedOptions=function(e){return e},t.renderImageToCanvas=function(e,t,i,a,n,r,o,s,d,l){return e.getContext("2d").drawImage(t,i,a,n,r,o,s,d,l),e},t.hasCanvasOption=function(e){return e.canvas||e.crop},t.scale=function(e,i){i=i||{};var a,n,r,o,s,d,l,c,u,g=document.createElement("canvas"),f=e.getContext||t.hasCanvasOption(i)&&g.getContext,h=e.naturalWidth||e.width,m=e.naturalHeight||e.height,p=h,S=m,b=function(){var e=Math.max((r||p)/p,(o||S)/S);e>1&&(p=Math.ceil(p*e),S=Math.ceil(S*e))},v=function(){var e=Math.min((a||p)/p,(n||S)/S);1>e&&(p=Math.ceil(p*e),S=Math.ceil(S*e))};return f&&(i=t.getTransformedOptions(i),l=i.left||0,c=i.top||0,i.sourceWidth?(s=i.sourceWidth,void 0!==i.right&&void 0===i.left&&(l=h-s-i.right)):s=h-l-(i.right||0),i.sourceHeight?(d=i.sourceHeight,void 0!==i.bottom&&void 0===i.top&&(c=m-d-i.bottom)):d=m-c-(i.bottom||0),p=s,S=d),a=i.maxWidth,n=i.maxHeight,r=i.minWidth,o=i.minHeight,f&&a&&n&&i.crop?(p=a,S=n,u=s/d-a/n,0>u?(d=n*s/a,void 0===i.top&&void 0===i.bottom&&(c=(m-d)/2)):u>0&&(s=a*d/n,void 0===i.left&&void 0===i.right&&(l=(h-s)/2))):((i.contain||i.cover)&&(r=a=a||r,o=n=n||o),i.cover?(v(),b()):(b(),v())),f?(g.width=p,g.height=S,t.transformCoordinates(g,i),t.renderImageToCanvas(g,e,l,c,s,d,0,0,p,S)):(e.width=p,e.height=S,e)},t.createObjectURL=function(e){return i?i.createObjectURL(e):!1},t.revokeObjectURL=function(e){return i?i.revokeObjectURL(e):!1},t.readFile=function(e,t,i){if(window.FileReader){var a=new FileReader;if(a.onload=a.onerror=t,i=i||"readAsDataURL",a[i])return a[i](e),a}return!1},"function"==typeof define&&define.amd?define(function(){return t}):e.loadImage=t})(this),function(e){"use strict";"function"==typeof define&&define.amd?define(["load-image"],e):e(window.loadImage)}(function(e){"use strict";if(window.navigator&&window.navigator.platform&&/iP(hone|od|ad)/.test(window.navigator.platform)){var t=e.renderImageToCanvas;e.detectSubsampling=function(e){var t,i;return e.width*e.height>1048576?(t=document.createElement("canvas"),t.width=t.height=1,i=t.getContext("2d"),i.drawImage(e,-e.width+1,0),0===i.getImageData(0,0,1,1).data[3]):!1},e.detectVerticalSquash=function(e,t){var i,a,n,r,o,s=e.naturalHeight||e.height,d=document.createElement("canvas"),l=d.getContext("2d");for(t&&(s/=2),d.width=1,d.height=s,l.drawImage(e,0,0),i=l.getImageData(0,0,1,s).data,a=0,n=s,r=s;r>a;)o=i[4*(r-1)+3],0===o?n=r:a=r,r=n+a>>1;return r/s||1},e.renderImageToCanvas=function(i,a,n,r,o,s,d,l,c,u){if("image/jpeg"===a._type){var g,f,h,m,p=i.getContext("2d"),S=document.createElement("canvas"),b=1024,v=S.getContext("2d");if(S.width=b,S.height=b,p.save(),g=e.detectSubsampling(a),g&&(n/=2,r/=2,o/=2,s/=2),f=e.detectVerticalSquash(a,g),g||1!==f){for(r*=f,c=Math.ceil(b*c/o),u=Math.ceil(b*u/s/f),l=0,m=0;s>m;){for(d=0,h=0;o>h;)v.clearRect(0,0,b,b),v.drawImage(a,n,r,o,s,-h,-m,o,s),p.drawImage(S,0,0,b,b,d,l,c,u),h+=b,d+=c;m+=b,l+=u}return p.restore(),i}}return t(i,a,n,r,o,s,d,l,c,u)}}}),function(e){"use strict";"function"==typeof define&&define.amd?define(["load-image"],e):e(window.loadImage)}(function(e){"use strict";var t=e.hasCanvasOption;e.hasCanvasOption=function(e){return t(e)||e.orientation},e.transformCoordinates=function(e,t){var i=e.getContext("2d"),a=e.width,n=e.height,r=t.orientation;if(r)switch(r>4&&(e.width=n,e.height=a),r){case 2:i.translate(a,0),i.scale(-1,1);break;case 3:i.translate(a,n),i.rotate(Math.PI);break;case 4:i.translate(0,n),i.scale(1,-1);break;case 5:i.rotate(.5*Math.PI),i.scale(1,-1);break;case 6:i.rotate(.5*Math.PI),i.translate(0,-n);break;case 7:i.rotate(.5*Math.PI),i.translate(a,-n),i.scale(-1,1);break;case 8:i.rotate(-.5*Math.PI),i.translate(-a,0)}},e.getTransformedOptions=function(e){if(!e.orientation||1===e.orientation)return e;var t,i={};for(t in e)e.hasOwnProperty(t)&&(i[t]=e[t]);switch(e.orientation){case 2:i.left=e.right,i.right=e.left;break;case 3:i.left=e.right,i.top=e.bottom,i.right=e.left,i.bottom=e.top;break;case 4:i.top=e.bottom,i.bottom=e.top;break;case 5:i.left=e.top,i.top=e.left,i.right=e.bottom,i.bottom=e.right;break;case 6:i.left=e.top,i.top=e.right,i.right=e.bottom,i.bottom=e.left;break;case 7:i.left=e.bottom,i.top=e.right,i.right=e.top,i.bottom=e.left;break;case 8:i.left=e.bottom,i.top=e.left,i.right=e.top,i.bottom=e.right}return e.orientation>4&&(i.maxWidth=e.maxHeight,i.maxHeight=e.maxWidth,i.minWidth=e.minHeight,i.minHeight=e.minWidth,i.sourceWidth=e.sourceHeight,i.sourceHeight=e.sourceWidth),i}}),function(e){"use strict";"function"==typeof define&&define.amd?define(["load-image"],e):e(window.loadImage)}(function(e){"use strict";var t=window.Blob&&(Blob.prototype.slice||Blob.prototype.webkitSlice||Blob.prototype.mozSlice);e.blobSlice=t&&function(){var e=this.slice||this.webkitSlice||this.mozSlice;return e.apply(this,arguments)},e.metaDataParsers={jpeg:{65505:[]}},e.parseMetaData=function(t,i,a){a=a||{};var n=this,r=a.maxMetaDataSize||262144,o={},s=!(window.DataView&&t&&t.size>=12&&"image/jpeg"===t.type&&e.blobSlice);(s||!e.readFile(e.blobSlice.call(t,0,r),function(t){var r,s,d,l,c=t.target.result,u=new DataView(c),g=2,f=u.byteLength-4,h=g;if(65496===u.getUint16(0)){for(;f>g&&(r=u.getUint16(g),r>=65504&&65519>=r||65534===r);){if(s=u.getUint16(g+2)+2,g+s>u.byteLength){console.log("Invalid meta data: Invalid segment size.");break}if(d=e.metaDataParsers.jpeg[r])for(l=0;d.length>l;l+=1)d[l].call(n,u,g,s,o,a);g+=s,h=g}!a.disableImageHead&&h>6&&(o.imageHead=c.slice?c.slice(0,h):new Uint8Array(c).subarray(0,h))}else console.log("Invalid JPEG file: Missing JPEG marker.");i(o)},"readAsArrayBuffer"))&&i(o)}}),function(e){"use strict";"function"==typeof define&&define.amd?define(["load-image","load-image-meta"],e):e(window.loadImage)}(function(e){"use strict";e.ExifMap=function(){return this},e.ExifMap.prototype.map={Orientation:274},e.ExifMap.prototype.get=function(e){return this[e]||this[this.map[e]]},e.getExifThumbnail=function(e,t,i){var a,n,r;if(!i||t+i>e.byteLength)return console.log("Invalid Exif data: Invalid thumbnail data."),void 0;for(a=[],n=0;i>n;n+=1)r=e.getUint8(t+n),a.push((16>r?"0":"")+r.toString(16));return"data:image/jpeg,%"+a.join("%")},e.exifTagTypes={1:{getValue:function(e,t){return e.getUint8(t)},size:1},2:{getValue:function(e,t){return String.fromCharCode(e.getUint8(t))},size:1,ascii:!0},3:{getValue:function(e,t,i){return e.getUint16(t,i)},size:2},4:{getValue:function(e,t,i){return e.getUint32(t,i)},size:4},5:{getValue:function(e,t,i){return e.getUint32(t,i)/e.getUint32(t+4,i)},size:8},9:{getValue:function(e,t,i){return e.getInt32(t,i)},size:4},10:{getValue:function(e,t,i){return e.getInt32(t,i)/e.getInt32(t+4,i)},size:8}},e.exifTagTypes[7]=e.exifTagTypes[1],e.getExifValue=function(t,i,a,n,r,o){var s,d,l,c,u,g,f=e.exifTagTypes[n];if(!f)return console.log("Invalid Exif data: Invalid tag type."),void 0;if(s=f.size*r,d=s>4?i+t.getUint32(a+8,o):a+8,d+s>t.byteLength)return console.log("Invalid Exif data: Invalid data offset."),void 0;if(1===r)return f.getValue(t,d,o);for(l=[],c=0;r>c;c+=1)l[c]=f.getValue(t,d+c*f.size,o);if(f.ascii){for(u="",c=0;l.length>c&&(g=l[c],"\0"!==g);c+=1)u+=g;return u}return l},e.parseExifTag=function(t,i,a,n,r){var o=t.getUint16(a,n);r.exif[o]=e.getExifValue(t,i,a,t.getUint16(a+2,n),t.getUint32(a+4,n),n)},e.parseExifTags=function(e,t,i,a,n){var r,o,s;if(i+6>e.byteLength)return console.log("Invalid Exif data: Invalid directory offset."),void 0;if(r=e.getUint16(i,a),o=i+2+12*r,o+4>e.byteLength)return console.log("Invalid Exif data: Invalid directory size."),void 0;for(s=0;r>s;s+=1)this.parseExifTag(e,t,i+2+12*s,a,n);return e.getUint32(o,a)},e.parseExifData=function(t,i,a,n,r){if(!r.disableExif){var o,s,d,l=i+10;if(1165519206===t.getUint32(i+4)){if(l+8>t.byteLength)return console.log("Invalid Exif data: Invalid segment size."),void 0;if(0!==t.getUint16(i+8))return console.log("Invalid Exif data: Missing byte alignment offset."),void 0;switch(t.getUint16(l)){case 18761:o=!0;break;case 19789:o=!1;break;default:return console.log("Invalid Exif data: Invalid byte alignment marker."),void 0}if(42!==t.getUint16(l+2,o))return console.log("Invalid Exif data: Missing TIFF marker."),void 0;s=t.getUint32(l+4,o),n.exif=new e.ExifMap,s=e.parseExifTags(t,l,l+s,o,n),s&&!r.disableExifThumbnail&&(d={exif:{}},s=e.parseExifTags(t,l,l+s,o,d),d.exif[513]&&(n.exif.Thumbnail=e.getExifThumbnail(t,l+d.exif[513],d.exif[514]))),n.exif[34665]&&!r.disableExifSub&&e.parseExifTags(t,l,l+n.exif[34665],o,n),n.exif[34853]&&!r.disableExifGps&&e.parseExifTags(t,l,l+n.exif[34853],o,n)}}},e.metaDataParsers.jpeg[65505].push(e.parseExifData)}),function(e){"use strict";"function"==typeof define&&define.amd?define(["load-image","load-image-exif"],e):e(window.loadImage)}(function(e){"use strict";var t,i,a;e.ExifMap.prototype.tags={256:"ImageWidth",257:"ImageHeight",34665:"ExifIFDPointer",34853:"GPSInfoIFDPointer",40965:"InteroperabilityIFDPointer",258:"BitsPerSample",259:"Compression",262:"PhotometricInterpretation",274:"Orientation",277:"SamplesPerPixel",284:"PlanarConfiguration",530:"YCbCrSubSampling",531:"YCbCrPositioning",282:"XResolution",283:"YResolution",296:"ResolutionUnit",273:"StripOffsets",278:"RowsPerStrip",279:"StripByteCounts",513:"JPEGInterchangeFormat",514:"JPEGInterchangeFormatLength",301:"TransferFunction",318:"WhitePoint",319:"PrimaryChromaticities",529:"YCbCrCoefficients",532:"ReferenceBlackWhite",306:"DateTime",270:"ImageDescription",271:"Make",272:"Model",305:"Software",315:"Artist",33432:"Copyright",36864:"ExifVersion",40960:"FlashpixVersion",40961:"ColorSpace",40962:"PixelXDimension",40963:"PixelYDimension",42240:"Gamma",37121:"ComponentsConfiguration",37122:"CompressedBitsPerPixel",37500:"MakerNote",37510:"UserComment",40964:"RelatedSoundFile",36867:"DateTimeOriginal",36868:"DateTimeDigitized",37520:"SubSecTime",37521:"SubSecTimeOriginal",37522:"SubSecTimeDigitized",33434:"ExposureTime",33437:"FNumber",34850:"ExposureProgram",34852:"SpectralSensitivity",34855:"PhotographicSensitivity",34856:"OECF",34864:"SensitivityType",34865:"StandardOutputSensitivity",34866:"RecommendedExposureIndex",34867:"ISOSpeed",34868:"ISOSpeedLatitudeyyy",34869:"ISOSpeedLatitudezzz",37377:"ShutterSpeedValue",37378:"ApertureValue",37379:"BrightnessValue",37380:"ExposureBias",37381:"MaxApertureValue",37382:"SubjectDistance",37383:"MeteringMode",37384:"LightSource",37385:"Flash",37396:"SubjectArea",37386:"FocalLength",41483:"FlashEnergy",41484:"SpatialFrequencyResponse",41486:"FocalPlaneXResolution",41487:"FocalPlaneYResolution",41488:"FocalPlaneResolutionUnit",41492:"SubjectLocation",41493:"ExposureIndex",41495:"SensingMethod",41728:"FileSource",41729:"SceneType",41730:"CFAPattern",41985:"CustomRendered",41986:"ExposureMode",41987:"WhiteBalance",41988:"DigitalZoomRatio",41989:"FocalLengthIn35mmFilm",41990:"SceneCaptureType",41991:"GainControl",41992:"Contrast",41993:"Saturation",41994:"Sharpness",41995:"DeviceSettingDescription",41996:"SubjectDistanceRange",42016:"ImageUniqueID",42032:"CameraOwnerName",42033:"BodySerialNumber",42034:"LensSpecification",42035:"LensMake",42036:"LensModel",42037:"LensSerialNumber",0:"GPSVersionID",1:"GPSLatitudeRef",2:"GPSLatitude",3:"GPSLongitudeRef",4:"GPSLongitude",5:"GPSAltitudeRef",6:"GPSAltitude",7:"GPSTimeStamp",8:"GPSSatellites",9:"GPSStatus",10:"GPSMeasureMode",11:"GPSDOP",12:"GPSSpeedRef",13:"GPSSpeed",14:"GPSTrackRef",15:"GPSTrack",16:"GPSImgDirectionRef",17:"GPSImgDirection",18:"GPSMapDatum",19:"GPSDestLatitudeRef",20:"GPSDestLatitude",21:"GPSDestLongitudeRef",22:"GPSDestLongitude",23:"GPSDestBearingRef",24:"GPSDestBearing",25:"GPSDestDistanceRef",26:"GPSDestDistance",27:"GPSProcessingMethod",28:"GPSAreaInformation",29:"GPSDateStamp",30:"GPSDifferential",31:"GPSHPositioningError"},e.ExifMap.prototype.stringValues={ExposureProgram:{0:"Undefined",1:"Manual",2:"Normal program",3:"Aperture priority",4:"Shutter priority",5:"Creative program",6:"Action program",7:"Portrait mode",8:"Landscape mode"},MeteringMode:{0:"Unknown",1:"Average",2:"CenterWeightedAverage",3:"Spot",4:"MultiSpot",5:"Pattern",6:"Partial",255:"Other"},LightSource:{0:"Unknown",1:"Daylight",2:"Fluorescent",3:"Tungsten (incandescent light)",4:"Flash",9:"Fine weather",10:"Cloudy weather",11:"Shade",12:"Daylight fluorescent (D 5700 - 7100K)",13:"Day white fluorescent (N 4600 - 5400K)",14:"Cool white fluorescent (W 3900 - 4500K)",15:"White fluorescent (WW 3200 - 3700K)",17:"Standard light A",18:"Standard light B",19:"Standard light C",20:"D55",21:"D65",22:"D75",23:"D50",24:"ISO studio tungsten",255:"Other"},Flash:{0:"Flash did not fire",1:"Flash fired",5:"Strobe return light not detected",7:"Strobe return light detected",9:"Flash fired, compulsory flash mode",13:"Flash fired, compulsory flash mode, return light not detected",15:"Flash fired, compulsory flash mode, return light detected",16:"Flash did not fire, compulsory flash mode",24:"Flash did not fire, auto mode",25:"Flash fired, auto mode",29:"Flash fired, auto mode, return light not detected",31:"Flash fired, auto mode, return light detected",32:"No flash function",65:"Flash fired, red-eye reduction mode",69:"Flash fired, red-eye reduction mode, return light not detected",71:"Flash fired, red-eye reduction mode, return light detected",73:"Flash fired, compulsory flash mode, red-eye reduction mode",77:"Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected",79:"Flash fired, compulsory flash mode, red-eye reduction mode, return light detected",89:"Flash fired, auto mode, red-eye reduction mode",93:"Flash fired, auto mode, return light not detected, red-eye reduction mode",95:"Flash fired, auto mode, return light detected, red-eye reduction mode"},SensingMethod:{1:"Undefined",2:"One-chip color area sensor",3:"Two-chip color area sensor",4:"Three-chip color area sensor",5:"Color sequential area sensor",7:"Trilinear sensor",8:"Color sequential linear sensor"},SceneCaptureType:{0:"Standard",1:"Landscape",2:"Portrait",3:"Night scene"},SceneType:{1:"Directly photographed"},CustomRendered:{0:"Normal process",1:"Custom process"},WhiteBalance:{0:"Auto white balance",1:"Manual white balance"},GainControl:{0:"None",1:"Low gain up",2:"High gain up",3:"Low gain down",4:"High gain down"},Contrast:{0:"Normal",1:"Soft",2:"Hard"},Saturation:{0:"Normal",1:"Low saturation",2:"High saturation"},Sharpness:{0:"Normal",1:"Soft",2:"Hard"},SubjectDistanceRange:{0:"Unknown",1:"Macro",2:"Close view",3:"Distant view"},FileSource:{3:"DSC"},ComponentsConfiguration:{0:"",1:"Y",2:"Cb",3:"Cr",4:"R",5:"G",6:"B"},Orientation:{1:"top-left",2:"top-right",3:"bottom-right",4:"bottom-left",5:"left-top",6:"right-top",7:"right-bottom",8:"left-bottom"}},e.ExifMap.prototype.getText=function(e){var t=this.get(e);switch(e){case"LightSource":case"Flash":case"MeteringMode":case"ExposureProgram":case"SensingMethod":case"SceneCaptureType":case"SceneType":case"CustomRendered":case"WhiteBalance":case"GainControl":case"Contrast":case"Saturation":case"Sharpness":case"SubjectDistanceRange":case"FileSource":case"Orientation":return this.stringValues[e][t];case"ExifVersion":case"FlashpixVersion":return String.fromCharCode(t[0],t[1],t[2],t[3]);case"ComponentsConfiguration":return this.stringValues[e][t[0]]+this.stringValues[e][t[1]]+this.stringValues[e][t[2]]+this.stringValues[e][t[3]];case"GPSVersionID":return t[0]+"."+t[1]+"."+t[2]+"."+t[3]}return t+""},t=e.ExifMap.prototype.tags,i=e.ExifMap.prototype.map;for(a in t)t.hasOwnProperty(a)&&(i[t[a]]=a);e.ExifMap.prototype.getAll=function(){var e,i,a={};for(e in this)this.hasOwnProperty(e)&&(i=t[e],i&&(a[i]=this.getText(i)));return a}});

/**
 * History.js Core
 * @author Benjamin Arthur Lupton <contact@balupton.com>
 * @copyright 2010-2011 Benjamin Arthur Lupton <contact@balupton.com>
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */
typeof JSON!="object"&&(JSON={}),function(){"use strict";function f(e){return e<10?"0"+e:e}function quote(e){return escapable.lastIndex=0,escapable.test(e)?'"'+e.replace(escapable,function(e){var t=meta[e];return typeof t=="string"?t:"\\u"+("0000"+e.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+e+'"'}function str(e,t){var n,r,i,s,o=gap,u,a=t[e];a&&typeof a=="object"&&typeof a.toJSON=="function"&&(a=a.toJSON(e)),typeof rep=="function"&&(a=rep.call(t,e,a));switch(typeof a){case"string":return quote(a);case"number":return isFinite(a)?String(a):"null";case"boolean":case"null":return String(a);case"object":if(!a)return"null";gap+=indent,u=[];if(Object.prototype.toString.apply(a)==="[object Array]"){s=a.length;for(n=0;n<s;n+=1)u[n]=str(n,a)||"null";return i=u.length===0?"[]":gap?"[\n"+gap+u.join(",\n"+gap)+"\n"+o+"]":"["+u.join(",")+"]",gap=o,i}if(rep&&typeof rep=="object"){s=rep.length;for(n=0;n<s;n+=1)typeof rep[n]=="string"&&(r=rep[n],i=str(r,a),i&&u.push(quote(r)+(gap?": ":":")+i))}else for(r in a)Object.prototype.hasOwnProperty.call(a,r)&&(i=str(r,a),i&&u.push(quote(r)+(gap?": ":":")+i));return i=u.length===0?"{}":gap?"{\n"+gap+u.join(",\n"+gap)+"\n"+o+"}":"{"+u.join(",")+"}",gap=o,i}}typeof Date.prototype.toJSON!="function"&&(Date.prototype.toJSON=function(e){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(e){return this.valueOf()});var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","	":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;typeof JSON.stringify!="function"&&(JSON.stringify=function(e,t,n){var r;gap="",indent="";if(typeof n=="number")for(r=0;r<n;r+=1)indent+=" ";else typeof n=="string"&&(indent=n);rep=t;if(!t||typeof t=="function"||typeof t=="object"&&typeof t.length=="number")return str("",{"":e});throw new Error("JSON.stringify")}),typeof JSON.parse!="function"&&(JSON.parse=function(text,reviver){function walk(e,t){var n,r,i=e[t];if(i&&typeof i=="object")for(n in i)Object.prototype.hasOwnProperty.call(i,n)&&(r=walk(i,n),r!==undefined?i[n]=r:delete i[n]);return reviver.call(e,t,i)}var j;text=String(text),cx.lastIndex=0,cx.test(text)&&(text=text.replace(cx,function(e){return"\\u"+("0000"+e.charCodeAt(0).toString(16)).slice(-4)}));if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return j=eval("("+text+")"),typeof reviver=="function"?walk({"":j},""):j;throw new SyntaxError("JSON.parse")})}(),function(e,t){"use strict";var n=e.History=e.History||{},r=e.jQuery;if(typeof n.Adapter!="undefined")throw new Error("History.js Adapter has already been loaded...");n.Adapter={bind:function(e,t,n){r(e).bind(t,n)},trigger:function(e,t,n){r(e).trigger(t,n)},extractEventData:function(e,n,r){var i=n&&n.originalEvent&&n.originalEvent[e]||r&&r[e]||t;return i},onDomLoad:function(e){r(e)}},typeof n.init!="undefined"&&n.init()}(window),function(e,t){"use strict";var n=e.document,r=e.setTimeout||r,i=e.clearTimeout||i,s=e.setInterval||s,o=e.History=e.History||{};if(typeof o.initHtml4!="undefined")throw new Error("History.js HTML4 Support has already been loaded...");o.initHtml4=function(){if(typeof o.initHtml4.initialized!="undefined")return!1;o.initHtml4.initialized=!0,o.enabled=!0,o.savedHashes=[],o.isLastHash=function(e){var t=o.getHashByIndex(),n;return n=e===t,n},o.isHashEqual=function(e,t){return e=encodeURIComponent(e).replace(/%25/g,"%"),t=encodeURIComponent(t).replace(/%25/g,"%"),e===t},o.saveHash=function(e){return o.isLastHash(e)?!1:(o.savedHashes.push(e),!0)},o.getHashByIndex=function(e){var t=null;return typeof e=="undefined"?t=o.savedHashes[o.savedHashes.length-1]:e<0?t=o.savedHashes[o.savedHashes.length+e]:t=o.savedHashes[e],t},o.discardedHashes={},o.discardedStates={},o.discardState=function(e,t,n){var r=o.getHashByState(e),i;return i={discardedState:e,backState:n,forwardState:t},o.discardedStates[r]=i,!0},o.discardHash=function(e,t,n){var r={discardedHash:e,backState:n,forwardState:t};return o.discardedHashes[e]=r,!0},o.discardedState=function(e){var t=o.getHashByState(e),n;return n=o.discardedStates[t]||!1,n},o.discardedHash=function(e){var t=o.discardedHashes[e]||!1;return t},o.recycleState=function(e){var t=o.getHashByState(e);return o.discardedState(e)&&delete o.discardedStates[t],!0},o.emulated.hashChange&&(o.hashChangeInit=function(){o.checkerFunction=null;var t="",r,i,u,a,f=Boolean(o.getHash());return o.isInternetExplorer()?(r="historyjs-iframe",i=n.createElement("iframe"),i.setAttribute("id",r),i.setAttribute("src","#"),i.style.display="none",n.body.appendChild(i),i.contentWindow.document.open(),i.contentWindow.document.close(),u="",a=!1,o.checkerFunction=function(){if(a)return!1;a=!0;var n=o.getHash(),r=o.getHash(i.contentWindow.document);return n!==t?(t=n,r!==n&&(u=r=n,i.contentWindow.document.open(),i.contentWindow.document.close(),i.contentWindow.document.location.hash=o.escapeHash(n)),o.Adapter.trigger(e,"hashchange")):r!==u&&(u=r,f&&r===""?o.back():o.setHash(r,!1)),a=!1,!0}):o.checkerFunction=function(){var n=o.getHash()||"";return n!==t&&(t=n,o.Adapter.trigger(e,"hashchange")),!0},o.intervalList.push(s(o.checkerFunction,o.options.hashChangeInterval)),!0},o.Adapter.onDomLoad(o.hashChangeInit)),o.emulated.pushState&&(o.onHashChange=function(t){var n=t&&t.newURL||o.getLocationHref(),r=o.getHashByUrl(n),i=null,s=null,u=null,a;return o.isLastHash(r)?(o.busy(!1),!1):(o.doubleCheckComplete(),o.saveHash(r),r&&o.isTraditionalAnchor(r)?(o.Adapter.trigger(e,"anchorchange"),o.busy(!1),!1):(i=o.extractState(o.getFullUrl(r||o.getLocationHref()),!0),o.isLastSavedState(i)?(o.busy(!1),!1):(s=o.getHashByState(i),a=o.discardedState(i),a?(o.getHashByIndex(-2)===o.getHashByState(a.forwardState)?o.back(!1):o.forward(!1),!1):(o.pushState(i.data,i.title,encodeURI(i.url),!1),!0))))},o.Adapter.bind(e,"hashchange",o.onHashChange),o.pushState=function(t,n,r,i){r=encodeURI(r).replace(/%25/g,"%");if(o.getHashByUrl(r))throw new Error("History.js does not support states with fragment-identifiers (hashes/anchors).");if(i!==!1&&o.busy())return o.pushQueue({scope:o,callback:o.pushState,args:arguments,queue:i}),!1;o.busy(!0);var s=o.createStateObject(t,n,r),u=o.getHashByState(s),a=o.getState(!1),f=o.getHashByState(a),l=o.getHash(),c=o.expectedStateId==s.id;return o.storeState(s),o.expectedStateId=s.id,o.recycleState(s),o.setTitle(s),u===f?(o.busy(!1),!1):(o.saveState(s),c||o.Adapter.trigger(e,"statechange"),!o.isHashEqual(u,l)&&!o.isHashEqual(u,o.getShortUrl(o.getLocationHref()))&&o.setHash(u,!1),o.busy(!1),!0)},o.replaceState=function(t,n,r,i){r=encodeURI(r).replace(/%25/g,"%");if(o.getHashByUrl(r))throw new Error("History.js does not support states with fragment-identifiers (hashes/anchors).");if(i!==!1&&o.busy())return o.pushQueue({scope:o,callback:o.replaceState,args:arguments,queue:i}),!1;o.busy(!0);var s=o.createStateObject(t,n,r),u=o.getHashByState(s),a=o.getState(!1),f=o.getHashByState(a),l=o.getStateByIndex(-2);return o.discardState(a,s,l),u===f?(o.storeState(s),o.expectedStateId=s.id,o.recycleState(s),o.setTitle(s),o.saveState(s),o.Adapter.trigger(e,"statechange"),o.busy(!1)):o.pushState(s.data,s.title,s.url,!1),!0}),o.emulated.pushState&&o.getHash()&&!o.emulated.hashChange&&o.Adapter.onDomLoad(function(){o.Adapter.trigger(e,"hashchange")})},typeof o.init!="undefined"&&o.init()}(window),function(e,t){"use strict";var n=e.console||t,r=e.document,i=e.navigator,s=!1,o=e.setTimeout,u=e.clearTimeout,a=e.setInterval,f=e.clearInterval,l=e.JSON,c=e.alert,h=e.History=e.History||{},p=e.history;try{s=e.sessionStorage,s.setItem("TEST","1"),s.removeItem("TEST")}catch(d){s=!1}l.stringify=l.stringify||l.encode,l.parse=l.parse||l.decode;if(typeof h.init!="undefined")throw new Error("History.js Core has already been loaded...");h.init=function(e){return typeof h.Adapter=="undefined"?!1:(typeof h.initCore!="undefined"&&h.initCore(),typeof h.initHtml4!="undefined"&&h.initHtml4(),!0)},h.initCore=function(d){if(typeof h.initCore.initialized!="undefined")return!1;h.initCore.initialized=!0,h.options=h.options||{},h.options.hashChangeInterval=h.options.hashChangeInterval||100,h.options.safariPollInterval=h.options.safariPollInterval||500,h.options.doubleCheckInterval=h.options.doubleCheckInterval||500,h.options.disableSuid=h.options.disableSuid||!1,h.options.storeInterval=h.options.storeInterval||1e3,h.options.busyDelay=h.options.busyDelay||250,h.options.debug=h.options.debug||!1,h.options.initialTitle=h.options.initialTitle||r.title,h.options.html4Mode=h.options.html4Mode||!1,h.options.delayInit=h.options.delayInit||!1,h.intervalList=[],h.clearAllIntervals=function(){var e,t=h.intervalList;if(typeof t!="undefined"&&t!==null){for(e=0;e<t.length;e++)f(t[e]);h.intervalList=null}},h.debug=function(){(h.options.debug||!1)&&h.log.apply(h,arguments)},h.log=function(){var e=typeof n!="undefined"&&typeof n.log!="undefined"&&typeof n.log.apply!="undefined",t=r.getElementById("log"),i,s,o,u,a;e?(u=Array.prototype.slice.call(arguments),i=u.shift(),typeof n.debug!="undefined"?n.debug.apply(n,[i,u]):n.log.apply(n,[i,u])):i="\n"+arguments[0]+"\n";for(s=1,o=arguments.length;s<o;++s){a=arguments[s];if(typeof a=="object"&&typeof l!="undefined")try{a=l.stringify(a)}catch(f){}i+="\n"+a+"\n"}return t?(t.value+=i+"\n-----\n",t.scrollTop=t.scrollHeight-t.clientHeight):e||c(i),!0},h.getInternetExplorerMajorVersion=function(){var e=h.getInternetExplorerMajorVersion.cached=typeof h.getInternetExplorerMajorVersion.cached!="undefined"?h.getInternetExplorerMajorVersion.cached:function(){var e=3,t=r.createElement("div"),n=t.getElementsByTagName("i");while((t.innerHTML="<!--[if gt IE "+ ++e+"]><i></i><![endif]-->")&&n[0]);return e>4?e:!1}();return e},h.isInternetExplorer=function(){var e=h.isInternetExplorer.cached=typeof h.isInternetExplorer.cached!="undefined"?h.isInternetExplorer.cached:Boolean(h.getInternetExplorerMajorVersion());return e},h.options.html4Mode?h.emulated={pushState:!0,hashChange:!0}:h.emulated={pushState:!Boolean(e.history&&e.history.pushState&&e.history.replaceState&&!/ Mobile\/([1-7][a-z]|(8([abcde]|f(1[0-8]))))/i.test(i.userAgent)&&!/AppleWebKit\/5([0-2]|3[0-2])/i.test(i.userAgent)),hashChange:Boolean(!("onhashchange"in e||"onhashchange"in r)||h.isInternetExplorer()&&h.getInternetExplorerMajorVersion()<8)},h.enabled=!h.emulated.pushState,h.bugs={setHash:Boolean(!h.emulated.pushState&&i.vendor==="Apple Computer, Inc."&&/AppleWebKit\/5([0-2]|3[0-3])/.test(i.userAgent)),safariPoll:Boolean(!h.emulated.pushState&&i.vendor==="Apple Computer, Inc."&&/AppleWebKit\/5([0-2]|3[0-3])/.test(i.userAgent)),ieDoubleCheck:Boolean(h.isInternetExplorer()&&h.getInternetExplorerMajorVersion()<8),hashEscape:Boolean(h.isInternetExplorer()&&h.getInternetExplorerMajorVersion()<7)},h.isEmptyObject=function(e){for(var t in e)if(e.hasOwnProperty(t))return!1;return!0},h.cloneObject=function(e){var t,n;return e?(t=l.stringify(e),n=l.parse(t)):n={},n},h.getRootUrl=function(){var e=r.location.protocol+"//"+(r.location.hostname||r.location.host);if(r.location.port||!1)e+=":"+r.location.port;return e+="/",e},h.getBaseHref=function(){var e=r.getElementsByTagName("base"),t=null,n="";return e.length===1&&(t=e[0],n=t.href.replace(/[^\/]+$/,"")),n=n.replace(/\/+$/,""),n&&(n+="/"),n},h.getBaseUrl=function(){var e=h.getBaseHref()||h.getBasePageUrl()||h.getRootUrl();return e},h.getPageUrl=function(){var e=h.getState(!1,!1),t=(e||{}).url||h.getLocationHref(),n;return n=t.replace(/\/+$/,"").replace(/[^\/]+$/,function(e,t,n){return/\./.test(e)?e:e+"/"}),n},h.getBasePageUrl=function(){var e=h.getLocationHref().replace(/[#\?].*/,"").replace(/[^\/]+$/,function(e,t,n){return/[^\/]$/.test(e)?"":e}).replace(/\/+$/,"")+"/";return e},h.getFullUrl=function(e,t){var n=e,r=e.substring(0,1);return t=typeof t=="undefined"?!0:t,/[a-z]+\:\/\//.test(e)||(r==="/"?n=h.getRootUrl()+e.replace(/^\/+/,""):r==="#"?n=h.getPageUrl().replace(/#.*/,"")+e:r==="?"?n=h.getPageUrl().replace(/[\?#].*/,"")+e:t?n=h.getBaseUrl()+e.replace(/^(\.\/)+/,""):n=h.getBasePageUrl()+e.replace(/^(\.\/)+/,"")),n.replace(/\#$/,"")},h.getShortUrl=function(e){var t=e,n=h.getBaseUrl(),r=h.getRootUrl();return h.emulated.pushState&&(t=t.replace(n,"")),t=t.replace(r,"/"),h.isTraditionalAnchor(t)&&(t="./"+t),t=t.replace(/^(\.\/)+/g,"./").replace(/\#$/,""),t},h.getLocationHref=function(e){return e=e||r,e.URL===e.location.href?e.location.href:e.location.href===decodeURIComponent(e.URL)?e.URL:e.location.hash&&decodeURIComponent(e.location.href.replace(/^[^#]+/,""))===e.location.hash?e.location.href:e.URL.indexOf("#")==-1&&e.location.href.indexOf("#")!=-1?e.location.href:e.URL||e.location.href},h.store={},h.idToState=h.idToState||{},h.stateToId=h.stateToId||{},h.urlToId=h.urlToId||{},h.storedStates=h.storedStates||[],h.savedStates=h.savedStates||[],h.normalizeStore=function(){h.store.idToState=h.store.idToState||{},h.store.urlToId=h.store.urlToId||{},h.store.stateToId=h.store.stateToId||{}},h.getState=function(e,t){typeof e=="undefined"&&(e=!0),typeof t=="undefined"&&(t=!0);var n=h.getLastSavedState();return!n&&t&&(n=h.createStateObject()),e&&(n=h.cloneObject(n),n.url=n.cleanUrl||n.url),n},h.getIdByState=function(e){var t=h.extractId(e.url),n;if(!t){n=h.getStateString(e);if(typeof h.stateToId[n]!="undefined")t=h.stateToId[n];else if(typeof h.store.stateToId[n]!="undefined")t=h.store.stateToId[n];else{for(;;){t=(new Date).getTime()+String(Math.random()).replace(/\D/g,"");if(typeof h.idToState[t]=="undefined"&&typeof h.store.idToState[t]=="undefined")break}h.stateToId[n]=t,h.idToState[t]=e}}return t},h.normalizeState=function(e){var t,n;if(!e||typeof e!="object")e={};if(typeof e.normalized!="undefined")return e;if(!e.data||typeof e.data!="object")e.data={};return t={},t.normalized=!0,t.title=e.title||"",t.url=h.getFullUrl(e.url?e.url:h.getLocationHref()),t.hash=h.getShortUrl(t.url),t.data=h.cloneObject(e.data),t.id=h.getIdByState(t),t.cleanUrl=t.url.replace(/\??\&_suid.*/,""),t.url=t.cleanUrl,n=!h.isEmptyObject(t.data),(t.title||n)&&h.options.disableSuid!==!0&&(t.hash=h.getShortUrl(t.url).replace(/\??\&_suid.*/,""),/\?/.test(t.hash)||(t.hash+="?"),t.hash+="&_suid="+t.id),t.hashedUrl=h.getFullUrl(t.hash),(h.emulated.pushState||h.bugs.safariPoll)&&h.hasUrlDuplicate(t)&&(t.url=t.hashedUrl),t},h.createStateObject=function(e,t,n){var r={data:e,title:t,url:n};return r=h.normalizeState(r),r},h.getStateById=function(e){e=String(e);var n=h.idToState[e]||h.store.idToState[e]||t;return n},h.getStateString=function(e){var t,n,r;return t=h.normalizeState(e),n={data:t.data,title:e.title,url:e.url},r=l.stringify(n),r},h.getStateId=function(e){var t,n;return t=h.normalizeState(e),n=t.id,n},h.getHashByState=function(e){var t,n;return t=h.normalizeState(e),n=t.hash,n},h.extractId=function(e){var t,n,r,i;return e.indexOf("#")!=-1?i=e.split("#")[0]:i=e,n=/(.*)\&_suid=([0-9]+)$/.exec(i),r=n?n[1]||e:e,t=n?String(n[2]||""):"",t||!1},h.isTraditionalAnchor=function(e){var t=!/[\/\?\.]/.test(e);return t},h.extractState=function(e,t){var n=null,r,i;return t=t||!1,r=h.extractId(e),r&&(n=h.getStateById(r)),n||(i=h.getFullUrl(e),r=h.getIdByUrl(i)||!1,r&&(n=h.getStateById(r)),!n&&t&&!h.isTraditionalAnchor(e)&&(n=h.createStateObject(null,null,i))),n},h.getIdByUrl=function(e){var n=h.urlToId[e]||h.store.urlToId[e]||t;return n},h.getLastSavedState=function(){return h.savedStates[h.savedStates.length-1]||t},h.getLastStoredState=function(){return h.storedStates[h.storedStates.length-1]||t},h.hasUrlDuplicate=function(e){var t=!1,n;return n=h.extractState(e.url),t=n&&n.id!==e.id,t},h.storeState=function(e){return h.urlToId[e.url]=e.id,h.storedStates.push(h.cloneObject(e)),e},h.isLastSavedState=function(e){var t=!1,n,r,i;return h.savedStates.length&&(n=e.id,r=h.getLastSavedState(),i=r.id,t=n===i),t},h.saveState=function(e){return h.isLastSavedState(e)?!1:(h.savedStates.push(h.cloneObject(e)),!0)},h.getStateByIndex=function(e){var t=null;return typeof e=="undefined"?t=h.savedStates[h.savedStates.length-1]:e<0?t=h.savedStates[h.savedStates.length+e]:t=h.savedStates[e],t},h.getCurrentIndex=function(){var e=null;return h.savedStates.length<1?e=0:e=h.savedStates.length-1,e},h.getHash=function(e){var t=h.getLocationHref(e),n;return n=h.getHashByUrl(t),n},h.unescapeHash=function(e){var t=h.normalizeHash(e);return t=decodeURIComponent(t),t},h.normalizeHash=function(e){var t=e.replace(/[^#]*#/,"").replace(/#.*/,"");return t},h.setHash=function(e,t){var n,i;return t!==!1&&h.busy()?(h.pushQueue({scope:h,callback:h.setHash,args:arguments,queue:t}),!1):(h.busy(!0),n=h.extractState(e,!0),n&&!h.emulated.pushState?h.pushState(n.data,n.title,n.url,!1):h.getHash()!==e&&(h.bugs.setHash?(i=h.getPageUrl(),h.pushState(null,null,i+"#"+e,!1)):r.location.hash=e),h)},h.escapeHash=function(t){var n=h.normalizeHash(t);return n=e.encodeURIComponent(n),h.bugs.hashEscape||(n=n.replace(/\%21/g,"!").replace(/\%26/g,"&").replace(/\%3D/g,"=").replace(/\%3F/g,"?")),n},h.getHashByUrl=function(e){var t=String(e).replace(/([^#]*)#?([^#]*)#?(.*)/,"$2");return t=h.unescapeHash(t),t},h.setTitle=function(e){var t=e.title,n;t||(n=h.getStateByIndex(0),n&&n.url===e.url&&(t=n.title||h.options.initialTitle));try{r.getElementsByTagName("title")[0].innerHTML=t.replace("<","&lt;").replace(">","&gt;").replace(" & "," &amp; ")}catch(i){}return r.title=t,h},h.queues=[],h.busy=function(e){typeof e!="undefined"?h.busy.flag=e:typeof h.busy.flag=="undefined"&&(h.busy.flag=!1);if(!h.busy.flag){u(h.busy.timeout);var t=function(){var e,n,r;if(h.busy.flag)return;for(e=h.queues.length-1;e>=0;--e){n=h.queues[e];if(n.length===0)continue;r=n.shift(),h.fireQueueItem(r),h.busy.timeout=o(t,h.options.busyDelay)}};h.busy.timeout=o(t,h.options.busyDelay)}return h.busy.flag},h.busy.flag=!1,h.fireQueueItem=function(e){return e.callback.apply(e.scope||h,e.args||[])},h.pushQueue=function(e){return h.queues[e.queue||0]=h.queues[e.queue||0]||[],h.queues[e.queue||0].push(e),h},h.queue=function(e,t){return typeof e=="function"&&(e={callback:e}),typeof t!="undefined"&&(e.queue=t),h.busy()?h.pushQueue(e):h.fireQueueItem(e),h},h.clearQueue=function(){return h.busy.flag=!1,h.queues=[],h},h.stateChanged=!1,h.doubleChecker=!1,h.doubleCheckComplete=function(){return h.stateChanged=!0,h.doubleCheckClear(),h},h.doubleCheckClear=function(){return h.doubleChecker&&(u(h.doubleChecker),h.doubleChecker=!1),h},h.doubleCheck=function(e){return h.stateChanged=!1,h.doubleCheckClear(),h.bugs.ieDoubleCheck&&(h.doubleChecker=o(function(){return h.doubleCheckClear(),h.stateChanged||e(),!0},h.options.doubleCheckInterval)),h},h.safariStatePoll=function(){var t=h.extractState(h.getLocationHref()),n;if(!h.isLastSavedState(t))return n=t,n||(n=h.createStateObject()),h.Adapter.trigger(e,"popstate"),h;return},h.back=function(e){return e!==!1&&h.busy()?(h.pushQueue({scope:h,callback:h.back,args:arguments,queue:e}),!1):(h.busy(!0),h.doubleCheck(function(){h.back(!1)}),p.go(-1),!0)},h.forward=function(e){return e!==!1&&h.busy()?(h.pushQueue({scope:h,callback:h.forward,args:arguments,queue:e}),!1):(h.busy(!0),h.doubleCheck(function(){h.forward(!1)}),p.go(1),!0)},h.go=function(e,t){var n;if(e>0)for(n=1;n<=e;++n)h.forward(t);else{if(!(e<0))throw new Error("History.go: History.go requires a positive or negative integer passed.");for(n=-1;n>=e;--n)h.back(t)}return h};if(h.emulated.pushState){var v=function(){};h.pushState=h.pushState||v,h.replaceState=h.replaceState||v}else h.onPopState=function(t,n){var r=!1,i=!1,s,o;return h.doubleCheckComplete(),s=h.getHash(),s?(o=h.extractState(s||h.getLocationHref(),!0),o?h.replaceState(o.data,o.title,o.url,!1):(h.Adapter.trigger(e,"anchorchange"),h.busy(!1)),h.expectedStateId=!1,!1):(r=h.Adapter.extractEventData("state",t,n)||!1,r?i=h.getStateById(r):h.expectedStateId?i=h.getStateById(h.expectedStateId):i=h.extractState(h.getLocationHref()),i||(i=h.createStateObject(null,null,h.getLocationHref())),h.expectedStateId=!1,h.isLastSavedState(i)?(h.busy(!1),!1):(h.storeState(i),h.saveState(i),h.setTitle(i),h.Adapter.trigger(e,"statechange"),h.busy(!1),!0))},h.Adapter.bind(e,"popstate",h.onPopState),h.pushState=function(t,n,r,i){if(h.getHashByUrl(r)&&h.emulated.pushState)throw new Error("History.js does not support states with fragement-identifiers (hashes/anchors).");if(i!==!1&&h.busy())return h.pushQueue({scope:h,callback:h.pushState,args:arguments,queue:i}),!1;h.busy(!0);var s=h.createStateObject(t,n,r);return h.isLastSavedState(s)?h.busy(!1):(h.storeState(s),h.expectedStateId=s.id,p.pushState(s.id,s.title,s.url),h.Adapter.trigger(e,"popstate")),!0},h.replaceState=function(t,n,r,i){if(h.getHashByUrl(r)&&h.emulated.pushState)throw new Error("History.js does not support states with fragement-identifiers (hashes/anchors).");if(i!==!1&&h.busy())return h.pushQueue({scope:h,callback:h.replaceState,args:arguments,queue:i}),!1;h.busy(!0);var s=h.createStateObject(t,n,r);return h.isLastSavedState(s)?h.busy(!1):(h.storeState(s),h.expectedStateId=s.id,p.replaceState(s.id,s.title,s.url),h.Adapter.trigger(e,"popstate")),!0};if(s){try{h.store=l.parse(s.getItem("History.store"))||{}}catch(m){h.store={}}h.normalizeStore()}else h.store={},h.normalizeStore();h.Adapter.bind(e,"unload",h.clearAllIntervals),h.saveState(h.storeState(h.extractState(h.getLocationHref(),!0))),s&&(h.onUnload=function(){var e,t,n;try{e=l.parse(s.getItem("History.store"))||{}}catch(r){e={}}e.idToState=e.idToState||{},e.urlToId=e.urlToId||{},e.stateToId=e.stateToId||{};for(t in h.idToState){if(!h.idToState.hasOwnProperty(t))continue;e.idToState[t]=h.idToState[t]}for(t in h.urlToId){if(!h.urlToId.hasOwnProperty(t))continue;e.urlToId[t]=h.urlToId[t]}for(t in h.stateToId){if(!h.stateToId.hasOwnProperty(t))continue;e.stateToId[t]=h.stateToId[t]}h.store=e,h.normalizeStore(),n=l.stringify(e);try{s.setItem("History.store",n)}catch(i){if(i.code!==DOMException.QUOTA_EXCEEDED_ERR)throw i;s.length&&(s.removeItem("History.store"),s.setItem("History.store",n))}},h.intervalList.push(a(h.onUnload,h.options.storeInterval)),h.Adapter.bind(e,"beforeunload",h.onUnload),h.Adapter.bind(e,"unload",h.onUnload));if(!h.emulated.pushState){h.bugs.safariPoll&&h.intervalList.push(a(h.safariStatePoll,h.options.safariPollInterval));if(i.vendor==="Apple Computer, Inc."||(i.appCodeName||"")==="Mozilla")h.Adapter.bind(e,"hashchange",function(){h.Adapter.trigger(e,"popstate")}),h.getHash()&&h.Adapter.onDomLoad(function(){h.Adapter.trigger(e,"hashchange")})}},(!h.options||!h.options.delayInit)&&h.init()}(window);

/*
 * jQuery Iframe Transport Plugin 1.7
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2011, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/*jslint unparam: true, nomen: true */
/*global define, window, document */

(function(factory){if(typeof define==="function"&&define.amd){define(["jquery"],factory)}else{factory(window.jQuery)}}(function($){var counter=0;$.ajaxTransport("iframe",function(options){if(options.async){var form,iframe,addParamChar;return{send:function(_,completeCallback){form=$('<form style="display:none;"></form>');form.attr("accept-charset",options.formAcceptCharset);addParamChar=/\?/.test(options.url)?"&":"?";if(options.type==="DELETE"){options.url=options.url+addParamChar+"_method=DELETE";options.type="POST"}else{if(options.type==="PUT"){options.url=options.url+addParamChar+"_method=PUT";options.type="POST"}else{if(options.type==="PATCH"){options.url=options.url+addParamChar+"_method=PATCH";options.type="POST"}}}counter+=1;iframe=$('<iframe src="javascript:false;" name="iframe-transport-'+counter+'"></iframe>').bind("load",function(){var fileInputClones,paramNames=$.isArray(options.paramName)?options.paramName:[options.paramName];iframe.unbind("load").bind("load",function(){var response;try{response=iframe.contents();if(!response.length||!response[0].firstChild){throw new Error()}}catch(e){response=undefined}completeCallback(200,"success",{iframe:response});$('<iframe src="javascript:false;"></iframe>').appendTo(form);window.setTimeout(function(){form.remove()},0)});form.prop("target",iframe.prop("name")).prop("action",options.url).prop("method",options.type);if(options.formData){$.each(options.formData,function(index,field){$('<input type="hidden"/>').prop("name",field.name).val(field.value).appendTo(form)})}if(options.fileInput&&options.fileInput.length&&options.type==="POST"){fileInputClones=options.fileInput.clone();options.fileInput.after(function(index){return fileInputClones[index]});if(options.paramName){options.fileInput.each(function(index){$(this).prop("name",paramNames[index]||options.paramName)})}form.append(options.fileInput).prop("enctype","multipart/form-data").prop("encoding","multipart/form-data")}form.submit();if(fileInputClones&&fileInputClones.length){options.fileInput.each(function(index,input){var clone=$(fileInputClones[index]);$(input).prop("name",clone.prop("name"));clone.replaceWith(input)})}});form.append(iframe).appendTo(document.body)},abort:function(){if(iframe){iframe.unbind("load").prop("src","javascript".concat(":false;"))}if(form){form.remove()}}}}});$.ajaxSetup({converters:{"iframe text":function(iframe){return iframe&&$(iframe[0].body).text()},"iframe json":function(iframe){return iframe&&$.parseJSON($(iframe[0].body).text())},"iframe html":function(iframe){return iframe&&$(iframe[0].body).html()},"iframe xml":function(iframe){var xmlDoc=iframe&&iframe[0];return xmlDoc&&$.isXMLDoc(xmlDoc)?xmlDoc:$.parseXML((xmlDoc.XMLDocument&&xmlDoc.XMLDocument.xml)||$(xmlDoc.body).html())},"iframe script":function(iframe){return iframe&&$.globalEval($(iframe[0].body).text())}}})}));

/**
 * Copyright (c) 2011-2013 Felix Gnass
 * Licensed under the MIT license
 */
//fgnass.github.com/spin.js#v1.3.2
(function(root,factory){if(typeof exports=="object"){module.exports=factory()}else{if(typeof define=="function"&&define.amd){define(factory)}else{root.Spinner=factory()}}}(this,function(){var prefixes=["webkit","Moz","ms","O"],animations={},useCssAnimations;function createEl(tag,prop){var el=document.createElement(tag||"div"),n;for(n in prop){el[n]=prop[n]}return el}function ins(parent){for(var i=1,n=arguments.length;i<n;i++){parent.appendChild(arguments[i])}return parent}var sheet=(function(){var el=createEl("style",{type:"text/css"});ins(document.getElementsByTagName("head")[0],el);return el.sheet||el.styleSheet}());function addAnimation(alpha,trail,i,lines){var name=["opacity",trail,~~(alpha*100),i,lines].join("-"),start=0.01+i/lines*100,z=Math.max(1-(1-alpha)/trail*(100-start),alpha),prefix=useCssAnimations.substring(0,useCssAnimations.indexOf("Animation")).toLowerCase(),pre=prefix&&"-"+prefix+"-"||"";if(!animations[name]){sheet.insertRule("@"+pre+"keyframes "+name+"{0%{opacity:"+z+"}"+start+"%{opacity:"+alpha+"}"+(start+0.01)+"%{opacity:1}"+(start+trail)%100+"%{opacity:"+alpha+"}100%{opacity:"+z+"}}",sheet.cssRules.length);animations[name]=1}return name}function vendor(el,prop){var s=el.style,pp,i;prop=prop.charAt(0).toUpperCase()+prop.slice(1);for(i=0;i<prefixes.length;i++){pp=prefixes[i]+prop;if(s[pp]!==undefined){return pp}}if(s[prop]!==undefined){return prop}}function css(el,prop){for(var n in prop){el.style[vendor(el,n)||n]=prop[n]}return el}function merge(obj){for(var i=1;i<arguments.length;i++){var def=arguments[i];for(var n in def){if(obj[n]===undefined){obj[n]=def[n]}}}return obj}function pos(el){var o={x:el.offsetLeft,y:el.offsetTop};while((el=el.offsetParent)){o.x+=el.offsetLeft,o.y+=el.offsetTop}return o}function getColor(color,idx){return typeof color=="string"?color:color[idx%color.length]}var defaults={lines:12,length:7,width:5,radius:10,rotate:0,corners:1,color:"#000",direction:1,speed:1,trail:100,opacity:1/4,fps:20,zIndex:"auto",className:"spinner",top:"auto",left:"auto",position:"relative"};function Spinner(o){if(typeof this=="undefined"){return new Spinner(o)}this.opts=merge(o||{},Spinner.defaults,defaults)}Spinner.defaults={};merge(Spinner.prototype,{spin:function(target){this.stop();var self=this,o=self.opts,el=self.el=css(createEl(0,{className:o.className}),{position:o.position,width:0,zIndex:o.zIndex}),mid=o.radius+o.length+o.width,ep,tp;if(target){target.insertBefore(el,target.firstChild||null);tp=pos(target);ep=pos(el);css(el,{left:(o.left=="auto"?tp.x-ep.x+(target.offsetWidth>>1):parseInt(o.left,10)+mid)+"px",top:(o.top=="auto"?tp.y-ep.y+(target.offsetHeight>>1):parseInt(o.top,10)+mid)+"px"})}el.setAttribute("role","progressbar");self.lines(el,self.opts);if(!useCssAnimations){var i=0,start=(o.lines-1)*(1-o.direction)/2,alpha,fps=o.fps,f=fps/o.speed,ostep=(1-o.opacity)/(f*o.trail/100),astep=f/o.lines;(function anim(){i++;for(var j=0;j<o.lines;j++){alpha=Math.max(1-(i+(o.lines-j)*astep)%f*ostep,o.opacity);self.opacity(el,j*o.direction+start,alpha,o)}self.timeout=self.el&&setTimeout(anim,~~(1000/fps))})()}return self},stop:function(){var el=this.el;if(el){clearTimeout(this.timeout);if(el.parentNode){el.parentNode.removeChild(el)}this.el=undefined}return this},lines:function(el,o){var i=0,start=(o.lines-1)*(1-o.direction)/2,seg;function fill(color,shadow){return css(createEl(),{position:"absolute",width:(o.length+o.width)+"px",height:o.width+"px",background:color,boxShadow:shadow,transformOrigin:"left",transform:"rotate("+~~(360/o.lines*i+o.rotate)+"deg) translate("+o.radius+"px,0)",borderRadius:(o.corners*o.width>>1)+"px"})}for(;i<o.lines;i++){seg=css(createEl(),{position:"absolute",top:1+~(o.width/2)+"px",transform:o.hwaccel?"translate3d(0,0,0)":"",opacity:o.opacity,animation:useCssAnimations&&addAnimation(o.opacity,o.trail,start+i*o.direction,o.lines)+" "+1/o.speed+"s linear infinite"});if(o.shadow){ins(seg,css(fill("rgba(0,0,0,.25)","0 0 4px rgba(0,0,0,.5)"),{top:2+"px"}))}ins(el,ins(seg,fill(getColor(o.color,i),"0 0 1px rgba(0,0,0,.1)")))}return el},opacity:function(el,i,val){if(i<el.childNodes.length){el.childNodes[i].style.opacity=val}}});function initVML(){function vml(tag,attr){return createEl("<"+tag+' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">',attr)}sheet.addRule(".spin-vml","behavior:url(#default#VML)");Spinner.prototype.lines=function(el,o){var r=o.length+o.width,s=2*r;function grp(){return css(vml("group",{coordsize:s+" "+s,coordorigin:-r+" "+-r}),{width:s,height:s})}var margin=-(o.width+o.length)*2+"px",g=css(grp(),{position:"absolute",top:margin,left:margin}),i;function seg(i,dx,filter){ins(g,ins(css(grp(),{rotation:360/o.lines*i+"deg",left:~~dx}),ins(css(vml("roundrect",{arcsize:o.corners}),{width:r,height:o.width,left:o.radius,top:-o.width>>1,filter:filter}),vml("fill",{color:getColor(o.color,i),opacity:o.opacity}),vml("stroke",{opacity:0}))))}if(o.shadow){for(i=1;i<=o.lines;i++){seg(i,-2,"progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)")}}for(i=1;i<=o.lines;i++){seg(i)}return ins(el,g)};Spinner.prototype.opacity=function(el,i,val,o){var c=el.firstChild;o=o.shadow&&o.lines||0;if(c&&i+o<c.childNodes.length){c=c.childNodes[i+o];c=c&&c.firstChild;c=c&&c.firstChild;if(c){c.opacity=val}}}}var probe=css(createEl("group"),{behavior:"url(#default#VML)"});if(!vendor(probe,"transform")&&probe.adj){initVML()}else{useCssAnimations=vendor(probe,"animation")}return Spinner}));
(function(e){if(typeof exports=="object"){e(require("jquery"),require("spin"))}else if(typeof define=="function"&&define.amd){define(["jquery","spin"],e)}else{if(!window.Spinner)throw new Error("Spin.js not present");e(window.jQuery,window.Spinner)}})(function(e,t){e.fn.spin=function(n,r){return this.each(function(){var i=e(this),s=i.data();if(s.spinner){s.spinner.stop();delete s.spinner}if(n!==false){n=e.extend({color:r||i.css("color")},e.fn.spin.presets[n]||n);s.spinner=(new t(n)).spin(this)}})};e.fn.spin.presets={tiny:{lines:8,length:2,width:2,radius:3},small:{lines:8,length:4,width:3,radius:5},large:{lines:10,length:8,width:4,radius:8}}});


/**
 * Antiscroll
 * https://github.com/LearnBoost/antiscroll
 */
(function($){$.fn.antiscroll=function(options){return this.each(function(){if($(this).data("antiscroll"))$(this).data("antiscroll").destroy();$(this).data("antiscroll",new $.Antiscroll(this,options))})};$.Antiscroll=Antiscroll;function Antiscroll(el,opts){this.el=$(el);this.options=opts||{};this.x=false!==this.options.x||this.options.forceHorizontal;this.y=false!==this.options.y||this.options.forceVertical;this.autoHide=false!==this.options.autoHide;this.padding=undefined==this.options.padding?2:
this.options.padding;this.inner=this.el.find(".antiscroll-inner");this.inner.css({"width":"+="+(this.y?scrollbarSize():0),"height":"+="+(this.x?scrollbarSize():0)});this.refresh()}Antiscroll.prototype.refresh=function(){var needHScroll=this.inner.get(0).scrollWidth>this.el.width()+(this.y?scrollbarSize():0),needVScroll=this.inner.get(0).scrollHeight>this.el.height()+(this.x?scrollbarSize():0);if(this.x)if(!this.horizontal&&needHScroll)this.horizontal=new Scrollbar.Horizontal(this);else if(this.horizontal&&
!needHScroll){this.horizontal.destroy();this.horizontal=null}else if(this.horizontal)this.horizontal.update();if(this.y)if(!this.vertical&&needVScroll)this.vertical=new Scrollbar.Vertical(this);else if(this.vertical&&!needVScroll){this.vertical.destroy();this.vertical=null}else if(this.vertical)this.vertical.update()};Antiscroll.prototype.destroy=function(){if(this.horizontal){this.horizontal.destroy();this.horizontal=null}if(this.vertical){this.vertical.destroy();this.vertical=null}return this};
Antiscroll.prototype.rebuild=function(){this.destroy();this.inner.attr("style","");Antiscroll.call(this,this.el,this.options);return this};function Scrollbar(pane){this.pane=pane;this.pane.el.append(this.el);this.innerEl=this.pane.inner.get(0);this.dragging=false;this.enter=false;this.shown=false;this.pane.el.mouseenter($.proxy(this,"mouseenter"));this.pane.el.mouseleave($.proxy(this,"mouseleave"));this.el.mousedown($.proxy(this,"mousedown"));this.innerPaneScrollListener=$.proxy(this,"scroll");this.pane.inner.scroll(this.innerPaneScrollListener);
this.innerPaneMouseWheelListener=$.proxy(this,"mousewheel");this.pane.inner.bind("mousewheel",this.innerPaneMouseWheelListener);var initialDisplay=this.pane.options.initialDisplay;if(initialDisplay!==false){this.show();if(this.pane.autoHide)this.hiding=setTimeout($.proxy(this,"hide"),parseInt(initialDisplay,10)||3E3)}}Scrollbar.prototype.destroy=function(){this.el.remove();this.pane.inner.unbind("scroll",this.innerPaneScrollListener);this.pane.inner.unbind("mousewheel",this.innerPaneMouseWheelListener);
return this};Scrollbar.prototype.mouseenter=function(){this.enter=true;this.show()};Scrollbar.prototype.mouseleave=function(){this.enter=false;if(!this.dragging)if(this.pane.autoHide)this.hide()};Scrollbar.prototype.scroll=function(){if(!this.shown){this.show();if(!this.enter&&!this.dragging)if(this.pane.autoHide)this.hiding=setTimeout($.proxy(this,"hide"),1500)}this.update()};Scrollbar.prototype.mousedown=function(ev){ev.preventDefault();this.dragging=true;this.startPageY=ev.pageY-parseInt(this.el.css("top"),
10);this.startPageX=ev.pageX-parseInt(this.el.css("left"),10);this.el[0].ownerDocument.onselectstart=function(){return false};var pane=this.pane,move=$.proxy(this,"mousemove"),self=this;$(this.el[0].ownerDocument).mousemove(move).mouseup(function(){self.dragging=false;this.onselectstart=null;$(this).unbind("mousemove",move);if(!self.enter)self.hide()})};Scrollbar.prototype.show=function(duration){if(!this.shown&&this.update()){this.el.addClass("antiscroll-scrollbar-shown");if(this.hiding){clearTimeout(this.hiding);
this.hiding=null}this.shown=true}};Scrollbar.prototype.hide=function(){if(this.pane.autoHide!==false&&this.shown){this.el.removeClass("antiscroll-scrollbar-shown");this.shown=false}};Scrollbar.Horizontal=function(pane){this.el=$('<div class="antiscroll-scrollbar antiscroll-scrollbar-horizontal">',pane.el);Scrollbar.call(this,pane)};inherits(Scrollbar.Horizontal,Scrollbar);Scrollbar.Horizontal.prototype.update=function(){var paneWidth=this.pane.el.width(),trackWidth=paneWidth-this.pane.padding*2,innerEl=
this.pane.inner.get(0);this.el.css("width",trackWidth*paneWidth/innerEl.scrollWidth).css("left",trackWidth*innerEl.scrollLeft/innerEl.scrollWidth);return paneWidth<innerEl.scrollWidth};Scrollbar.Horizontal.prototype.mousemove=function(ev){var trackWidth=this.pane.el.width()-this.pane.padding*2,pos=ev.pageX-this.startPageX,barWidth=this.el.width(),innerEl=this.pane.inner.get(0);var y=Math.min(Math.max(pos,0),trackWidth-barWidth);innerEl.scrollLeft=(innerEl.scrollWidth-this.pane.el.width())*y/(trackWidth-
barWidth)};Scrollbar.Horizontal.prototype.mousewheel=function(ev,delta,x,y){if(x<0&&0==this.pane.inner.get(0).scrollLeft||x>0&&this.innerEl.scrollLeft+Math.ceil(this.pane.el.width())==this.innerEl.scrollWidth){ev.preventDefault();return false}};Scrollbar.Vertical=function(pane){this.el=$('<div class="antiscroll-scrollbar antiscroll-scrollbar-vertical">',pane.el);Scrollbar.call(this,pane)};inherits(Scrollbar.Vertical,Scrollbar);Scrollbar.Vertical.prototype.update=function(){var paneHeight=this.pane.el.height(),
trackHeight=paneHeight-this.pane.padding*2,innerEl=this.innerEl;var scrollbarHeight=trackHeight*paneHeight/innerEl.scrollHeight;scrollbarHeight=scrollbarHeight<20?20:scrollbarHeight;var topPos=trackHeight*innerEl.scrollTop/innerEl.scrollHeight;if(topPos+scrollbarHeight>trackHeight){var diff=topPos+scrollbarHeight-trackHeight;topPos=topPos-diff-3}this.el.css("height",scrollbarHeight).css("top",topPos);return paneHeight<innerEl.scrollHeight};Scrollbar.Vertical.prototype.mousemove=function(ev){var paneHeight=
this.pane.el.height(),trackHeight=paneHeight-this.pane.padding*2,pos=ev.pageY-this.startPageY,barHeight=this.el.height(),innerEl=this.innerEl;var y=Math.min(Math.max(pos,0),trackHeight-barHeight);innerEl.scrollTop=(innerEl.scrollHeight-paneHeight)*y/(trackHeight-barHeight)};Scrollbar.Vertical.prototype.mousewheel=function(ev,delta,x,y){if(y>0&&0==this.innerEl.scrollTop||y<0&&this.innerEl.scrollTop+Math.ceil(this.pane.el.height())==this.innerEl.scrollHeight){ev.preventDefault();return false}};function inherits(ctorA,
ctorB){function f(){}f.prototype=ctorB.prototype;ctorA.prototype=new f}var size;function scrollbarSize(){if(size===undefined){var div=$('<div class="antiscroll-inner" style="width:50px;height:50px;overflow-y:scroll;'+'position:absolute;top:-200px;left:-200px;"><div style="height:100px;width:100%">'+"</div>");$("body").append(div);var w1=$(div).innerWidth();var w2=$("div",div).innerWidth();$(div).remove();size=w1-w2}return size}})(jQuery);


/**
 * jQuery Mousewheel
 * ! Copyright (c) 2013 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.1.3
 *
 * Requires: 1.2.2+
 */
(function(factory){if(typeof define==="function"&&define.amd)define(["jquery"],factory);else if(typeof exports==="object")module.exports=factory;else factory(jQuery)})(function($){var toFix=["wheel","mousewheel","DOMMouseScroll","MozMousePixelScroll"];var toBind="onwheel"in document||document.documentMode>=9?["wheel"]:["mousewheel","DomMouseScroll","MozMousePixelScroll"];var lowestDelta,lowestDeltaXY;if($.event.fixHooks)for(var i=toFix.length;i;)$.event.fixHooks[toFix[--i]]=$.event.mouseHooks;$.event.special.mousewheel=
{setup:function(){if(this.addEventListener)for(var i=toBind.length;i;)this.addEventListener(toBind[--i],handler,false);else this.onmousewheel=handler},teardown:function(){if(this.removeEventListener)for(var i=toBind.length;i;)this.removeEventListener(toBind[--i],handler,false);else this.onmousewheel=null}};$.fn.extend({mousewheel:function(fn){return fn?this.bind("mousewheel",fn):this.trigger("mousewheel")},unmousewheel:function(fn){return this.unbind("mousewheel",fn)}});function handler(event){var orgEvent=
event||window.event,args=[].slice.call(arguments,1),delta=0,deltaX=0,deltaY=0,absDelta=0,absDeltaXY=0,fn;event=$.event.fix(orgEvent);event.type="mousewheel";if(orgEvent.wheelDelta)delta=orgEvent.wheelDelta;if(orgEvent.detail)delta=orgEvent.detail*-1;if(orgEvent.deltaY){deltaY=orgEvent.deltaY*-1;delta=deltaY}if(orgEvent.deltaX){deltaX=orgEvent.deltaX;delta=deltaX*-1}if(orgEvent.wheelDeltaY!==undefined)deltaY=orgEvent.wheelDeltaY;if(orgEvent.wheelDeltaX!==undefined)deltaX=orgEvent.wheelDeltaX*-1;absDelta=
Math.abs(delta);if(!lowestDelta||absDelta<lowestDelta)lowestDelta=absDelta;absDeltaXY=Math.max(Math.abs(deltaY),Math.abs(deltaX));if(!lowestDeltaXY||absDeltaXY<lowestDeltaXY)lowestDeltaXY=absDeltaXY;fn=delta>0?"floor":"ceil";delta=Math[fn](delta/lowestDelta);deltaX=Math[fn](deltaX/lowestDeltaXY);deltaY=Math[fn](deltaY/lowestDeltaXY);args.unshift(event,delta,deltaX,deltaY);return($.event.dispatch||$.event.handle).apply(this,args)}});

/**
Created: 20060120
Author:  Steve Moitozo <god at zilla dot us> -- geekwisdom.com
License: MIT License (see below)
Copyright (c) 2006 Steve Moitozo <god at zilla dot us>

Permission is hereby granted, free of charge, to any person 
obtaining a copy of this software and associated documentation 
files (the "Software"), to deal in the Software without 
restriction, including without limitation the rights to use, 
copy, modify, merge, publish, distribute, sublicense, and/or 
sell copies of the Software, and to permit persons to whom the 
Software is furnished to do so, subject to the following 
conditions:

The above copyright notice and this permission notice shall 
be included in all copies or substantial portions of the 
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY 
KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE 
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE 
AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT 
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE 
OR OTHER DEALINGS IN THE SOFTWARE.

Slightly modified for peafowl.co

*/
function testPassword(e){var t=0,n="weak",r="",i=0;if(e.length<5){t=t+3;r=r+"3 points for length ("+e.length+")\n"}else if(e.length>4&&e.length<8){t=t+6;r=r+"6 points for length ("+e.length+")\n"}else if(e.length>7&&e.length<16){t=t+12;r=r+"12 points for length ("+e.length+")\n"}else if(e.length>15){t=t+18;r=r+"18 point for length ("+e.length+")\n"}if(e.match(/[a-z]/)){t=t+1;r=r+"1 point for at least one lower case char\n"}if(e.match(/[A-Z]/)){t=t+5;r=r+"5 points for at least one upper case char\n"}if(e.match(/\d+/)){t=t+5;r=r+"5 points for at least one number\n"}if(e.match(/(.*[0-9].*[0-9].*[0-9])/)){t=t+5;r=r+"5 points for at least three numbers\n"}if(e.match(/.[!,@,#,$,%,^,&,*,?,_,~]/)){t=t+5;r=r+"5 points for at least one special char\n"}if(e.match(/(.*[!,@,#,$,%,^,&,*,?,_,~].*[!,@,#,$,%,^,&,*,?,_,~])/)){t=t+5;r=r+"5 points for at least two special chars\n"}if(e.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)){t=t+2;r=r+"2 combo points for upper and lower letters\n"}if(e.match(/([a-zA-Z])/)&&e.match(/([0-9])/)){t=t+2;r=r+"2 combo points for letters and numbers\n"}if(e.match(/([a-zA-Z0-9].*[!,@,#,$,%,^,&,*,?,_,~])|([!,@,#,$,%,^,&,*,?,_,~].*[a-zA-Z0-9])/)){t=t+2;r=r+"2 combo points for letters, numbers and special chars\n"}if(e.length==0){t=0}if(t<16){n="very weak"}else if(t>15&&t<25){n="weak"}else if(t>24&&t<35){n="average"}else if(t>34&&t<45){n="strong"}else{n="stronger"}i=Math.round(Math.min(100,100*t/45))/100;return{score:t,ratio:i,percent:i*100+"%",verdict:n,log:r}}
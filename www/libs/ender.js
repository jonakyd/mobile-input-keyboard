/*!
  * =============================================================
  * Ender: open module JavaScript framework (https://ender.no.de)
  * Build: ender build iscroll htmlparser location navigator xmlhttprequest bindings contextify cssom mime async delayed-stream combined-stream form-data request jsdom jquery underscore
  * =============================================================
  */

/*!
  * Ender: open module JavaScript framework (client-lib)
  * copyright Dustin Diaz & Jacob Thornton 2011-2012 (@ded @fat)
  * http://ender.jit.su
  * License MIT
  */
(function (context) {

  // a global object for node.js module compatiblity
  // ============================================

  context['global'] = context

  // Implements simple module system
  // losely based on CommonJS Modules spec v1.1.1
  // ============================================

  var modules = {}
    , old = context['$']
    , oldEnder = context['ender']
    , oldRequire = context['require']
    , oldProvide = context['provide']

  function require (identifier) {
    // modules can be required from ender's build system, or found on the window
    var module = modules['$' + identifier] || window[identifier]
    if (!module) throw new Error("Ender Error: Requested module '" + identifier + "' has not been defined.")
    return module
  }

  function provide (name, what) {
    return (modules['$' + name] = what)
  }

  context['provide'] = provide
  context['require'] = require

  function aug(o, o2) {
    for (var k in o2) k != 'noConflict' && k != '_VERSION' && (o[k] = o2[k])
    return o
  }

  /**
   * main Ender return object
   * @constructor
   * @param {Array|Node|string} s a CSS selector or DOM node(s)
   * @param {Array.|Node} r a root node(s)
   */
  function Ender(s, r) {
    var elements
      , i

    this.selector = s
    // string || node || nodelist || window
    if (typeof s == 'undefined') {
      elements = []
      this.selector = ''
    } else if (typeof s == 'string' || s.nodeName || (s.length && 'item' in s) || s == window) {
      elements = ender._select(s, r)
    } else {
      elements = isFinite(s.length) ? s : [s]
    }
    this.length = elements.length
    for (i = this.length; i--;) this[i] = elements[i]
  }

  /**
   * @param {function(el, i, inst)} fn
   * @param {Object} opt_scope
   * @returns {Ender}
   */
  Ender.prototype['forEach'] = function (fn, opt_scope) {
    var i, l
    // opt out of native forEach so we can intentionally call our own scope
    // defaulting to the current item and be able to return self
    for (i = 0, l = this.length; i < l; ++i) i in this && fn.call(opt_scope || this[i], this[i], i, this)
    // return self for chaining
    return this
  }

  Ender.prototype.$ = ender // handy reference to self


  function ender(s, r) {
    return new Ender(s, r)
  }

  ender['_VERSION'] = '0.4.3-dev'

  ender.fn = Ender.prototype // for easy compat to jQuery plugins

  ender.ender = function (o, chain) {
    aug(chain ? Ender.prototype : ender, o)
  }

  ender._select = function (s, r) {
    if (typeof s == 'string') return (r || document).querySelectorAll(s)
    if (s.nodeName) return [s]
    return s
  }


  // use callback to receive Ender's require & provide and remove them from global
  ender.noConflict = function (callback) {
    context['$'] = old
    if (callback) {
      context['provide'] = oldProvide
      context['require'] = oldRequire
      context['ender'] = oldEnder
      if (typeof callback == 'function') callback(require, provide, this)
    }
    return this
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = ender
  // use subscript notation as extern for Closure compilation
  context['ender'] = context['$'] = ender

}(this));

(function () {

  var module = { exports: {} }, exports = module.exports;

  /*!
   * iScroll v4.2.5 ~ Copyright (c) 2012 Matteo Spinelli, http://cubiq.org
   * Released under MIT license, http://cubiq.org/license
   */
  (function(window, doc){
  var m = Math,
  	dummyStyle = doc.createElement('div').style,
  	vendor = (function () {
  		var vendors = 't,webkitT,MozT,msT,OT'.split(','),
  			t,
  			i = 0,
  			l = vendors.length;
  
  		for ( ; i < l; i++ ) {
  			t = vendors[i] + 'ransform';
  			if ( t in dummyStyle ) {
  				return vendors[i].substr(0, vendors[i].length - 1);
  			}
  		}
  
  		return false;
  	})(),
  	cssVendor = vendor ? '-' + vendor.toLowerCase() + '-' : '',
  
  	// Style properties
  	transform = prefixStyle('transform'),
  	transitionProperty = prefixStyle('transitionProperty'),
  	transitionDuration = prefixStyle('transitionDuration'),
  	transformOrigin = prefixStyle('transformOrigin'),
  	transitionTimingFunction = prefixStyle('transitionTimingFunction'),
  	transitionDelay = prefixStyle('transitionDelay'),
  
      // Browser capabilities
  	isAndroid = (/android/gi).test(navigator.appVersion),
  	isIDevice = (/iphone|ipad/gi).test(navigator.appVersion),
  	isTouchPad = (/hp-tablet/gi).test(navigator.appVersion),
  
      has3d = prefixStyle('perspective') in dummyStyle,
      hasTouch = 'ontouchstart' in window && !isTouchPad,
      hasTransform = vendor !== false,
      hasTransitionEnd = prefixStyle('transition') in dummyStyle,
  
  	RESIZE_EV = 'onorientationchange' in window ? 'orientationchange' : 'resize',
  	START_EV = hasTouch ? 'touchstart' : 'mousedown',
  	MOVE_EV = hasTouch ? 'touchmove' : 'mousemove',
  	END_EV = hasTouch ? 'touchend' : 'mouseup',
  	CANCEL_EV = hasTouch ? 'touchcancel' : 'mouseup',
  	TRNEND_EV = (function () {
  		if ( vendor === false ) return false;
  
  		var transitionEnd = {
  				''			: 'transitionend',
  				'webkit'	: 'webkitTransitionEnd',
  				'Moz'		: 'transitionend',
  				'O'			: 'otransitionend',
  				'ms'		: 'MSTransitionEnd'
  			};
  
  		return transitionEnd[vendor];
  	})(),
  
  	nextFrame = (function() {
  		return window.requestAnimationFrame ||
  			window.webkitRequestAnimationFrame ||
  			window.mozRequestAnimationFrame ||
  			window.oRequestAnimationFrame ||
  			window.msRequestAnimationFrame ||
  			function(callback) { return setTimeout(callback, 1); };
  	})(),
  	cancelFrame = (function () {
  		return window.cancelRequestAnimationFrame ||
  			window.webkitCancelAnimationFrame ||
  			window.webkitCancelRequestAnimationFrame ||
  			window.mozCancelRequestAnimationFrame ||
  			window.oCancelRequestAnimationFrame ||
  			window.msCancelRequestAnimationFrame ||
  			clearTimeout;
  	})(),
  
  	// Helpers
  	translateZ = has3d ? ' translateZ(0)' : '',
  
  	// Constructor
  	iScroll = function (el, options) {
  		var that = this,
  			i;
  
  		that.wrapper = typeof el == 'object' ? el : doc.getElementById(el);
  		that.wrapper.style.overflow = 'hidden';
  		that.scroller = that.wrapper.children[0];
  
  		// Default options
  		that.options = {
  			hScroll: true,
  			vScroll: true,
  			x: 0,
  			y: 0,
  			bounce: true,
  			bounceLock: false,
  			momentum: true,
  			lockDirection: true,
  			useTransform: true,
  			useTransition: false,
  			topOffset: 0,
  			checkDOMChanges: false,		// Experimental
  			handleClick: true,
  
  			// Scrollbar
  			hScrollbar: true,
  			vScrollbar: true,
  			fixedScrollbar: isAndroid,
  			hideScrollbar: isIDevice,
  			fadeScrollbar: isIDevice && has3d,
  			scrollbarClass: '',
  
  			// Zoom
  			zoom: false,
  			zoomMin: 1,
  			zoomMax: 4,
  			doubleTapZoom: 2,
  			wheelAction: 'scroll',
  
  			// Snap
  			snap: false,
  			snapThreshold: 1,
  
  			// Events
  			onRefresh: null,
  			onBeforeScrollStart: function (e) { e.preventDefault(); },
  			onScrollStart: null,
  			onBeforeScrollMove: null,
  			onScrollMove: null,
  			onBeforeScrollEnd: null,
  			onScrollEnd: null,
  			onTouchEnd: null,
  			onDestroy: null,
  			onZoomStart: null,
  			onZoom: null,
  			onZoomEnd: null
  		};
  
  		// User defined options
  		for (i in options) that.options[i] = options[i];
  		
  		// Set starting position
  		that.x = that.options.x;
  		that.y = that.options.y;
  
  		// Normalize options
  		that.options.useTransform = hasTransform && that.options.useTransform;
  		that.options.hScrollbar = that.options.hScroll && that.options.hScrollbar;
  		that.options.vScrollbar = that.options.vScroll && that.options.vScrollbar;
  		that.options.zoom = that.options.useTransform && that.options.zoom;
  		that.options.useTransition = hasTransitionEnd && that.options.useTransition;
  
  		// Helpers FIX ANDROID BUG!
  		// translate3d and scale doesn't work together!
  		// Ignoring 3d ONLY WHEN YOU SET that.options.zoom
  		if ( that.options.zoom && isAndroid ){
  			translateZ = '';
  		}
  		
  		// Set some default styles
  		that.scroller.style[transitionProperty] = that.options.useTransform ? cssVendor + 'transform' : 'top left';
  		that.scroller.style[transitionDuration] = '0';
  		that.scroller.style[transformOrigin] = '0 0';
  		if (that.options.useTransition) that.scroller.style[transitionTimingFunction] = 'cubic-bezier(0.33,0.66,0.66,1)';
  		
  		if (that.options.useTransform) that.scroller.style[transform] = 'translate(' + that.x + 'px,' + that.y + 'px)' + translateZ;
  		else that.scroller.style.cssText += ';position:absolute;top:' + that.y + 'px;left:' + that.x + 'px';
  
  		if (that.options.useTransition) that.options.fixedScrollbar = true;
  
  		that.refresh();
  
  		that._bind(RESIZE_EV, window);
  		that._bind(START_EV);
  		if (!hasTouch) {
  			if (that.options.wheelAction != 'none') {
  				that._bind('DOMMouseScroll');
  				that._bind('mousewheel');
  			}
  		}
  
  		if (that.options.checkDOMChanges) that.checkDOMTime = setInterval(function () {
  			that._checkDOMChanges();
  		}, 500);
  	};
  
  // Prototype
  iScroll.prototype = {
  	enabled: true,
  	x: 0,
  	y: 0,
  	steps: [],
  	scale: 1,
  	currPageX: 0, currPageY: 0,
  	pagesX: [], pagesY: [],
  	aniTime: null,
  	wheelZoomCount: 0,
  	
  	handleEvent: function (e) {
  		var that = this;
  		switch(e.type) {
  			case START_EV:
  				if (!hasTouch && e.button !== 0) return;
  				that._start(e);
  				break;
  			case MOVE_EV: that._move(e); break;
  			case END_EV:
  			case CANCEL_EV: that._end(e); break;
  			case RESIZE_EV: that._resize(); break;
  			case 'DOMMouseScroll': case 'mousewheel': that._wheel(e); break;
  			case TRNEND_EV: that._transitionEnd(e); break;
  		}
  	},
  	
  	_checkDOMChanges: function () {
  		if (this.moved || this.zoomed || this.animating ||
  			(this.scrollerW == this.scroller.offsetWidth * this.scale && this.scrollerH == this.scroller.offsetHeight * this.scale)) return;
  
  		this.refresh();
  	},
  	
  	_scrollbar: function (dir) {
  		var that = this,
  			bar;
  
  		if (!that[dir + 'Scrollbar']) {
  			if (that[dir + 'ScrollbarWrapper']) {
  				if (hasTransform) that[dir + 'ScrollbarIndicator'].style[transform] = '';
  				that[dir + 'ScrollbarWrapper'].parentNode.removeChild(that[dir + 'ScrollbarWrapper']);
  				that[dir + 'ScrollbarWrapper'] = null;
  				that[dir + 'ScrollbarIndicator'] = null;
  			}
  
  			return;
  		}
  
  		if (!that[dir + 'ScrollbarWrapper']) {
  			// Create the scrollbar wrapper
  			bar = doc.createElement('div');
  
  			if (that.options.scrollbarClass) bar.className = that.options.scrollbarClass + dir.toUpperCase();
  			else bar.style.cssText = 'position:absolute;z-index:100;' + (dir == 'h' ? 'height:7px;bottom:1px;left:2px;right:' + (that.vScrollbar ? '7' : '2') + 'px' : 'width:7px;bottom:' + (that.hScrollbar ? '7' : '2') + 'px;top:2px;right:1px');
  
  			bar.style.cssText += ';pointer-events:none;' + cssVendor + 'transition-property:opacity;' + cssVendor + 'transition-duration:' + (that.options.fadeScrollbar ? '350ms' : '0') + ';overflow:hidden;opacity:' + (that.options.hideScrollbar ? '0' : '1');
  
  			that.wrapper.appendChild(bar);
  			that[dir + 'ScrollbarWrapper'] = bar;
  
  			// Create the scrollbar indicator
  			bar = doc.createElement('div');
  			if (!that.options.scrollbarClass) {
  				bar.style.cssText = 'position:absolute;z-index:100;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.9);' + cssVendor + 'background-clip:padding-box;' + cssVendor + 'box-sizing:border-box;' + (dir == 'h' ? 'height:100%' : 'width:100%') + ';' + cssVendor + 'border-radius:3px;border-radius:3px';
  			}
  			bar.style.cssText += ';pointer-events:none;' + cssVendor + 'transition-property:' + cssVendor + 'transform;' + cssVendor + 'transition-timing-function:cubic-bezier(0.33,0.66,0.66,1);' + cssVendor + 'transition-duration:0;' + cssVendor + 'transform: translate(0,0)' + translateZ;
  			if (that.options.useTransition) bar.style.cssText += ';' + cssVendor + 'transition-timing-function:cubic-bezier(0.33,0.66,0.66,1)';
  
  			that[dir + 'ScrollbarWrapper'].appendChild(bar);
  			that[dir + 'ScrollbarIndicator'] = bar;
  		}
  
  		if (dir == 'h') {
  			that.hScrollbarSize = that.hScrollbarWrapper.clientWidth;
  			that.hScrollbarIndicatorSize = m.max(m.round(that.hScrollbarSize * that.hScrollbarSize / that.scrollerW), 8);
  			that.hScrollbarIndicator.style.width = that.hScrollbarIndicatorSize + 'px';
  			that.hScrollbarMaxScroll = that.hScrollbarSize - that.hScrollbarIndicatorSize;
  			that.hScrollbarProp = that.hScrollbarMaxScroll / that.maxScrollX;
  		} else {
  			that.vScrollbarSize = that.vScrollbarWrapper.clientHeight;
  			that.vScrollbarIndicatorSize = m.max(m.round(that.vScrollbarSize * that.vScrollbarSize / that.scrollerH), 8);
  			that.vScrollbarIndicator.style.height = that.vScrollbarIndicatorSize + 'px';
  			that.vScrollbarMaxScroll = that.vScrollbarSize - that.vScrollbarIndicatorSize;
  			that.vScrollbarProp = that.vScrollbarMaxScroll / that.maxScrollY;
  		}
  
  		// Reset position
  		that._scrollbarPos(dir, true);
  	},
  	
  	_resize: function () {
  		var that = this;
  		setTimeout(function () { that.refresh(); }, isAndroid ? 200 : 0);
  	},
  	
  	_pos: function (x, y) {
  		if (this.zoomed) return;
  
  		x = this.hScroll ? x : 0;
  		y = this.vScroll ? y : 0;
  
  		if (this.options.useTransform) {
  			this.scroller.style[transform] = 'translate(' + x + 'px,' + y + 'px) scale(' + this.scale + ')' + translateZ;
  		} else {
  			x = m.round(x);
  			y = m.round(y);
  			this.scroller.style.left = x + 'px';
  			this.scroller.style.top = y + 'px';
  		}
  
  		this.x = x;
  		this.y = y;
  
  		this._scrollbarPos('h');
  		this._scrollbarPos('v');
  	},
  
  	_scrollbarPos: function (dir, hidden) {
  		var that = this,
  			pos = dir == 'h' ? that.x : that.y,
  			size;
  
  		if (!that[dir + 'Scrollbar']) return;
  
  		pos = that[dir + 'ScrollbarProp'] * pos;
  
  		if (pos < 0) {
  			if (!that.options.fixedScrollbar) {
  				size = that[dir + 'ScrollbarIndicatorSize'] + m.round(pos * 3);
  				if (size < 8) size = 8;
  				that[dir + 'ScrollbarIndicator'].style[dir == 'h' ? 'width' : 'height'] = size + 'px';
  			}
  			pos = 0;
  		} else if (pos > that[dir + 'ScrollbarMaxScroll']) {
  			if (!that.options.fixedScrollbar) {
  				size = that[dir + 'ScrollbarIndicatorSize'] - m.round((pos - that[dir + 'ScrollbarMaxScroll']) * 3);
  				if (size < 8) size = 8;
  				that[dir + 'ScrollbarIndicator'].style[dir == 'h' ? 'width' : 'height'] = size + 'px';
  				pos = that[dir + 'ScrollbarMaxScroll'] + (that[dir + 'ScrollbarIndicatorSize'] - size);
  			} else {
  				pos = that[dir + 'ScrollbarMaxScroll'];
  			}
  		}
  
  		that[dir + 'ScrollbarWrapper'].style[transitionDelay] = '0';
  		that[dir + 'ScrollbarWrapper'].style.opacity = hidden && that.options.hideScrollbar ? '0' : '1';
  		that[dir + 'ScrollbarIndicator'].style[transform] = 'translate(' + (dir == 'h' ? pos + 'px,0)' : '0,' + pos + 'px)') + translateZ;
  	},
  	
  	_start: function (e) {
  		var that = this,
  			point = hasTouch ? e.touches[0] : e,
  			matrix, x, y,
  			c1, c2;
  
  		if (!that.enabled) return;
  
  		if (that.options.onBeforeScrollStart) that.options.onBeforeScrollStart.call(that, e);
  
  		if (that.options.useTransition || that.options.zoom) that._transitionTime(0);
  
  		that.moved = false;
  		that.animating = false;
  		that.zoomed = false;
  		that.distX = 0;
  		that.distY = 0;
  		that.absDistX = 0;
  		that.absDistY = 0;
  		that.dirX = 0;
  		that.dirY = 0;
  
  		// Gesture start
  		if (that.options.zoom && hasTouch && e.touches.length > 1) {
  			c1 = m.abs(e.touches[0].pageX-e.touches[1].pageX);
  			c2 = m.abs(e.touches[0].pageY-e.touches[1].pageY);
  			that.touchesDistStart = m.sqrt(c1 * c1 + c2 * c2);
  
  			that.originX = m.abs(e.touches[0].pageX + e.touches[1].pageX - that.wrapperOffsetLeft * 2) / 2 - that.x;
  			that.originY = m.abs(e.touches[0].pageY + e.touches[1].pageY - that.wrapperOffsetTop * 2) / 2 - that.y;
  
  			if (that.options.onZoomStart) that.options.onZoomStart.call(that, e);
  		}
  
  		if (that.options.momentum) {
  			if (that.options.useTransform) {
  				// Very lame general purpose alternative to CSSMatrix
  				matrix = getComputedStyle(that.scroller, null)[transform].replace(/[^0-9\-.,]/g, '').split(',');
  				x = +(matrix[12] || matrix[4]);
  				y = +(matrix[13] || matrix[5]);
  			} else {
  				x = +getComputedStyle(that.scroller, null).left.replace(/[^0-9-]/g, '');
  				y = +getComputedStyle(that.scroller, null).top.replace(/[^0-9-]/g, '');
  			}
  			
  			if (x != that.x || y != that.y) {
  				if (that.options.useTransition) that._unbind(TRNEND_EV);
  				else cancelFrame(that.aniTime);
  				that.steps = [];
  				that._pos(x, y);
  				if (that.options.onScrollEnd) that.options.onScrollEnd.call(that);
  			}
  		}
  
  		that.absStartX = that.x;	// Needed by snap threshold
  		that.absStartY = that.y;
  
  		that.startX = that.x;
  		that.startY = that.y;
  		that.pointX = point.pageX;
  		that.pointY = point.pageY;
  
  		that.startTime = e.timeStamp || Date.now();
  
  		if (that.options.onScrollStart) that.options.onScrollStart.call(that, e);
  
  		that._bind(MOVE_EV, window);
  		that._bind(END_EV, window);
  		that._bind(CANCEL_EV, window);
  	},
  	
  	_move: function (e) {
  		var that = this,
  			point = hasTouch ? e.touches[0] : e,
  			deltaX = point.pageX - that.pointX,
  			deltaY = point.pageY - that.pointY,
  			newX = that.x + deltaX,
  			newY = that.y + deltaY,
  			c1, c2, scale,
  			timestamp = e.timeStamp || Date.now();
  
  		if (that.options.onBeforeScrollMove) that.options.onBeforeScrollMove.call(that, e);
  
  		// Zoom
  		if (that.options.zoom && hasTouch && e.touches.length > 1) {
  			c1 = m.abs(e.touches[0].pageX - e.touches[1].pageX);
  			c2 = m.abs(e.touches[0].pageY - e.touches[1].pageY);
  			that.touchesDist = m.sqrt(c1*c1+c2*c2);
  
  			that.zoomed = true;
  
  			scale = 1 / that.touchesDistStart * that.touchesDist * this.scale;
  
  			if (scale < that.options.zoomMin) scale = 0.5 * that.options.zoomMin * Math.pow(2.0, scale / that.options.zoomMin);
  			else if (scale > that.options.zoomMax) scale = 2.0 * that.options.zoomMax * Math.pow(0.5, that.options.zoomMax / scale);
  
  			that.lastScale = scale / this.scale;
  
  			newX = this.originX - this.originX * that.lastScale + this.x,
  			newY = this.originY - this.originY * that.lastScale + this.y;
  
  			this.scroller.style[transform] = 'translate(' + newX + 'px,' + newY + 'px) scale(' + scale + ')' + translateZ;
  
  			if (that.options.onZoom) that.options.onZoom.call(that, e);
  			return;
  		}
  
  		that.pointX = point.pageX;
  		that.pointY = point.pageY;
  
  		// Slow down if outside of the boundaries
  		if (newX > 0 || newX < that.maxScrollX) {
  			newX = that.options.bounce ? that.x + (deltaX / 2) : newX >= 0 || that.maxScrollX >= 0 ? 0 : that.maxScrollX;
  		}
  		if (newY > that.minScrollY || newY < that.maxScrollY) {
  			newY = that.options.bounce ? that.y + (deltaY / 2) : newY >= that.minScrollY || that.maxScrollY >= 0 ? that.minScrollY : that.maxScrollY;
  		}
  
  		that.distX += deltaX;
  		that.distY += deltaY;
  		that.absDistX = m.abs(that.distX);
  		that.absDistY = m.abs(that.distY);
  
  		if (that.absDistX < 6 && that.absDistY < 6) {
  			return;
  		}
  
  		// Lock direction
  		if (that.options.lockDirection) {
  			if (that.absDistX > that.absDistY + 5) {
  				newY = that.y;
  				deltaY = 0;
  			} else if (that.absDistY > that.absDistX + 5) {
  				newX = that.x;
  				deltaX = 0;
  			}
  		}
  
  		that.moved = true;
  		that._pos(newX, newY);
  		that.dirX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
  		that.dirY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;
  
  		if (timestamp - that.startTime > 300) {
  			that.startTime = timestamp;
  			that.startX = that.x;
  			that.startY = that.y;
  		}
  		
  		if (that.options.onScrollMove) that.options.onScrollMove.call(that, e);
  	},
  	
  	_end: function (e) {
  		if (hasTouch && e.touches.length !== 0) return;
  
  		var that = this,
  			point = hasTouch ? e.changedTouches[0] : e,
  			target, ev,
  			momentumX = { dist:0, time:0 },
  			momentumY = { dist:0, time:0 },
  			duration = (e.timeStamp || Date.now()) - that.startTime,
  			newPosX = that.x,
  			newPosY = that.y,
  			distX, distY,
  			newDuration,
  			snap,
  			scale;
  
  		that._unbind(MOVE_EV, window);
  		that._unbind(END_EV, window);
  		that._unbind(CANCEL_EV, window);
  
  		if (that.options.onBeforeScrollEnd) that.options.onBeforeScrollEnd.call(that, e);
  
  		if (that.zoomed) {
  			scale = that.scale * that.lastScale;
  			scale = Math.max(that.options.zoomMin, scale);
  			scale = Math.min(that.options.zoomMax, scale);
  			that.lastScale = scale / that.scale;
  			that.scale = scale;
  
  			that.x = that.originX - that.originX * that.lastScale + that.x;
  			that.y = that.originY - that.originY * that.lastScale + that.y;
  			
  			that.scroller.style[transitionDuration] = '200ms';
  			that.scroller.style[transform] = 'translate(' + that.x + 'px,' + that.y + 'px) scale(' + that.scale + ')' + translateZ;
  			
  			that.zoomed = false;
  			that.refresh();
  
  			if (that.options.onZoomEnd) that.options.onZoomEnd.call(that, e);
  			return;
  		}
  
  		if (!that.moved) {
  			if (hasTouch) {
  				if (that.doubleTapTimer && that.options.zoom) {
  					// Double tapped
  					clearTimeout(that.doubleTapTimer);
  					that.doubleTapTimer = null;
  					if (that.options.onZoomStart) that.options.onZoomStart.call(that, e);
  					that.zoom(that.pointX, that.pointY, that.scale == 1 ? that.options.doubleTapZoom : 1);
  					if (that.options.onZoomEnd) {
  						setTimeout(function() {
  							that.options.onZoomEnd.call(that, e);
  						}, 200); // 200 is default zoom duration
  					}
  				} else if (this.options.handleClick) {
  					that.doubleTapTimer = setTimeout(function () {
  						that.doubleTapTimer = null;
  
  						// Find the last touched element
  						target = point.target;
  						while (target.nodeType != 1) target = target.parentNode;
  
  						if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA') {
  							ev = doc.createEvent('MouseEvents');
  							ev.initMouseEvent('click', true, true, e.view, 1,
  								point.screenX, point.screenY, point.clientX, point.clientY,
  								e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
  								0, null);
  							ev._fake = true;
  							target.dispatchEvent(ev);
  						}
  					}, that.options.zoom ? 250 : 0);
  				}
  			}
  
  			that._resetPos(400);
  
  			if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
  			return;
  		}
  
  		if (duration < 300 && that.options.momentum) {
  			momentumX = newPosX ? that._momentum(newPosX - that.startX, duration, -that.x, that.scrollerW - that.wrapperW + that.x, that.options.bounce ? that.wrapperW : 0) : momentumX;
  			momentumY = newPosY ? that._momentum(newPosY - that.startY, duration, -that.y, (that.maxScrollY < 0 ? that.scrollerH - that.wrapperH + that.y - that.minScrollY : 0), that.options.bounce ? that.wrapperH : 0) : momentumY;
  
  			newPosX = that.x + momentumX.dist;
  			newPosY = that.y + momentumY.dist;
  
  			if ((that.x > 0 && newPosX > 0) || (that.x < that.maxScrollX && newPosX < that.maxScrollX)) momentumX = { dist:0, time:0 };
  			if ((that.y > that.minScrollY && newPosY > that.minScrollY) || (that.y < that.maxScrollY && newPosY < that.maxScrollY)) momentumY = { dist:0, time:0 };
  		}
  
  		if (momentumX.dist || momentumY.dist) {
  			newDuration = m.max(m.max(momentumX.time, momentumY.time), 10);
  
  			// Do we need to snap?
  			if (that.options.snap) {
  				distX = newPosX - that.absStartX;
  				distY = newPosY - that.absStartY;
  				if (m.abs(distX) < that.options.snapThreshold && m.abs(distY) < that.options.snapThreshold) { that.scrollTo(that.absStartX, that.absStartY, 200); }
  				else {
  					snap = that._snap(newPosX, newPosY);
  					newPosX = snap.x;
  					newPosY = snap.y;
  					newDuration = m.max(snap.time, newDuration);
  				}
  			}
  
  			that.scrollTo(m.round(newPosX), m.round(newPosY), newDuration);
  
  			if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
  			return;
  		}
  
  		// Do we need to snap?
  		if (that.options.snap) {
  			distX = newPosX - that.absStartX;
  			distY = newPosY - that.absStartY;
  			if (m.abs(distX) < that.options.snapThreshold && m.abs(distY) < that.options.snapThreshold) that.scrollTo(that.absStartX, that.absStartY, 200);
  			else {
  				snap = that._snap(that.x, that.y);
  				if (snap.x != that.x || snap.y != that.y) that.scrollTo(snap.x, snap.y, snap.time);
  			}
  
  			if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
  			return;
  		}
  
  		that._resetPos(200);
  		if (that.options.onTouchEnd) that.options.onTouchEnd.call(that, e);
  	},
  	
  	_resetPos: function (time) {
  		var that = this,
  			resetX = that.x >= 0 ? 0 : that.x < that.maxScrollX ? that.maxScrollX : that.x,
  			resetY = that.y >= that.minScrollY || that.maxScrollY > 0 ? that.minScrollY : that.y < that.maxScrollY ? that.maxScrollY : that.y;
  
  		if (resetX == that.x && resetY == that.y) {
  			if (that.moved) {
  				that.moved = false;
  				if (that.options.onScrollEnd) that.options.onScrollEnd.call(that);		// Execute custom code on scroll end
  			}
  
  			if (that.hScrollbar && that.options.hideScrollbar) {
  				if (vendor == 'webkit') that.hScrollbarWrapper.style[transitionDelay] = '300ms';
  				that.hScrollbarWrapper.style.opacity = '0';
  			}
  			if (that.vScrollbar && that.options.hideScrollbar) {
  				if (vendor == 'webkit') that.vScrollbarWrapper.style[transitionDelay] = '300ms';
  				that.vScrollbarWrapper.style.opacity = '0';
  			}
  
  			return;
  		}
  
  		that.scrollTo(resetX, resetY, time || 0);
  	},
  
  	_wheel: function (e) {
  		var that = this,
  			wheelDeltaX, wheelDeltaY,
  			deltaX, deltaY,
  			deltaScale;
  
  		if ('wheelDeltaX' in e) {
  			wheelDeltaX = e.wheelDeltaX / 12;
  			wheelDeltaY = e.wheelDeltaY / 12;
  		} else if('wheelDelta' in e) {
  			wheelDeltaX = wheelDeltaY = e.wheelDelta / 12;
  		} else if ('detail' in e) {
  			wheelDeltaX = wheelDeltaY = -e.detail * 3;
  		} else {
  			return;
  		}
  		
  		if (that.options.wheelAction == 'zoom') {
  			deltaScale = that.scale * Math.pow(2, 1/3 * (wheelDeltaY ? wheelDeltaY / Math.abs(wheelDeltaY) : 0));
  			if (deltaScale < that.options.zoomMin) deltaScale = that.options.zoomMin;
  			if (deltaScale > that.options.zoomMax) deltaScale = that.options.zoomMax;
  			
  			if (deltaScale != that.scale) {
  				if (!that.wheelZoomCount && that.options.onZoomStart) that.options.onZoomStart.call(that, e);
  				that.wheelZoomCount++;
  				
  				that.zoom(e.pageX, e.pageY, deltaScale, 400);
  				
  				setTimeout(function() {
  					that.wheelZoomCount--;
  					if (!that.wheelZoomCount && that.options.onZoomEnd) that.options.onZoomEnd.call(that, e);
  				}, 400);
  			}
  			
  			return;
  		}
  		
  		deltaX = that.x + wheelDeltaX;
  		deltaY = that.y + wheelDeltaY;
  
  		if (deltaX > 0) deltaX = 0;
  		else if (deltaX < that.maxScrollX) deltaX = that.maxScrollX;
  
  		if (deltaY > that.minScrollY) deltaY = that.minScrollY;
  		else if (deltaY < that.maxScrollY) deltaY = that.maxScrollY;
      
  		if (that.maxScrollY < 0) {
  			that.scrollTo(deltaX, deltaY, 0);
  		}
  	},
  	
  	_transitionEnd: function (e) {
  		var that = this;
  
  		if (e.target != that.scroller) return;
  
  		that._unbind(TRNEND_EV);
  		
  		that._startAni();
  	},
  
  
  	/**
  	*
  	* Utilities
  	*
  	*/
  	_startAni: function () {
  		var that = this,
  			startX = that.x, startY = that.y,
  			startTime = Date.now(),
  			step, easeOut,
  			animate;
  
  		if (that.animating) return;
  		
  		if (!that.steps.length) {
  			that._resetPos(400);
  			return;
  		}
  		
  		step = that.steps.shift();
  		
  		if (step.x == startX && step.y == startY) step.time = 0;
  
  		that.animating = true;
  		that.moved = true;
  		
  		if (that.options.useTransition) {
  			that._transitionTime(step.time);
  			that._pos(step.x, step.y);
  			that.animating = false;
  			if (step.time) that._bind(TRNEND_EV);
  			else that._resetPos(0);
  			return;
  		}
  
  		animate = function () {
  			var now = Date.now(),
  				newX, newY;
  
  			if (now >= startTime + step.time) {
  				that._pos(step.x, step.y);
  				that.animating = false;
  				if (that.options.onAnimationEnd) that.options.onAnimationEnd.call(that);			// Execute custom code on animation end
  				that._startAni();
  				return;
  			}
  
  			now = (now - startTime) / step.time - 1;
  			easeOut = m.sqrt(1 - now * now);
  			newX = (step.x - startX) * easeOut + startX;
  			newY = (step.y - startY) * easeOut + startY;
  			that._pos(newX, newY);
  			if (that.animating) that.aniTime = nextFrame(animate);
  		};
  
  		animate();
  	},
  
  	_transitionTime: function (time) {
  		time += 'ms';
  		this.scroller.style[transitionDuration] = time;
  		if (this.hScrollbar) this.hScrollbarIndicator.style[transitionDuration] = time;
  		if (this.vScrollbar) this.vScrollbarIndicator.style[transitionDuration] = time;
  	},
  
  	_momentum: function (dist, time, maxDistUpper, maxDistLower, size) {
  		var deceleration = 0.0006,
  			speed = m.abs(dist) / time,
  			newDist = (speed * speed) / (2 * deceleration),
  			newTime = 0, outsideDist = 0;
  
  		// Proportinally reduce speed if we are outside of the boundaries
  		if (dist > 0 && newDist > maxDistUpper) {
  			outsideDist = size / (6 / (newDist / speed * deceleration));
  			maxDistUpper = maxDistUpper + outsideDist;
  			speed = speed * maxDistUpper / newDist;
  			newDist = maxDistUpper;
  		} else if (dist < 0 && newDist > maxDistLower) {
  			outsideDist = size / (6 / (newDist / speed * deceleration));
  			maxDistLower = maxDistLower + outsideDist;
  			speed = speed * maxDistLower / newDist;
  			newDist = maxDistLower;
  		}
  
  		newDist = newDist * (dist < 0 ? -1 : 1);
  		newTime = speed / deceleration;
  
  		return { dist: newDist, time: m.round(newTime) };
  	},
  
  	_offset: function (el) {
  		var left = -el.offsetLeft,
  			top = -el.offsetTop;
  			
  		while (el = el.offsetParent) {
  			left -= el.offsetLeft;
  			top -= el.offsetTop;
  		}
  		
  		if (el != this.wrapper) {
  			left *= this.scale;
  			top *= this.scale;
  		}
  
  		return { left: left, top: top };
  	},
  
  	_snap: function (x, y) {
  		var that = this,
  			i, l,
  			page, time,
  			sizeX, sizeY;
  
  		// Check page X
  		page = that.pagesX.length - 1;
  		for (i=0, l=that.pagesX.length; i<l; i++) {
  			if (x >= that.pagesX[i]) {
  				page = i;
  				break;
  			}
  		}
  		if (page == that.currPageX && page > 0 && that.dirX < 0) page--;
  		x = that.pagesX[page];
  		sizeX = m.abs(x - that.pagesX[that.currPageX]);
  		sizeX = sizeX ? m.abs(that.x - x) / sizeX * 500 : 0;
  		that.currPageX = page;
  
  		// Check page Y
  		page = that.pagesY.length-1;
  		for (i=0; i<page; i++) {
  			if (y >= that.pagesY[i]) {
  				page = i;
  				break;
  			}
  		}
  		if (page == that.currPageY && page > 0 && that.dirY < 0) page--;
  		y = that.pagesY[page];
  		sizeY = m.abs(y - that.pagesY[that.currPageY]);
  		sizeY = sizeY ? m.abs(that.y - y) / sizeY * 500 : 0;
  		that.currPageY = page;
  
  		// Snap with constant speed (proportional duration)
  		time = m.round(m.max(sizeX, sizeY)) || 200;
  
  		return { x: x, y: y, time: time };
  	},
  
  	_bind: function (type, el, bubble) {
  		(el || this.scroller).addEventListener(type, this, !!bubble);
  	},
  
  	_unbind: function (type, el, bubble) {
  		(el || this.scroller).removeEventListener(type, this, !!bubble);
  	},
  
  
  	/**
  	*
  	* Public methods
  	*
  	*/
  	destroy: function () {
  		var that = this;
  
  		that.scroller.style[transform] = '';
  
  		// Remove the scrollbars
  		that.hScrollbar = false;
  		that.vScrollbar = false;
  		that._scrollbar('h');
  		that._scrollbar('v');
  
  		// Remove the event listeners
  		that._unbind(RESIZE_EV, window);
  		that._unbind(START_EV);
  		that._unbind(MOVE_EV, window);
  		that._unbind(END_EV, window);
  		that._unbind(CANCEL_EV, window);
  		
  		if (!that.options.hasTouch) {
  			that._unbind('DOMMouseScroll');
  			that._unbind('mousewheel');
  		}
  		
  		if (that.options.useTransition) that._unbind(TRNEND_EV);
  		
  		if (that.options.checkDOMChanges) clearInterval(that.checkDOMTime);
  		
  		if (that.options.onDestroy) that.options.onDestroy.call(that);
  	},
  
  	refresh: function () {
  		var that = this,
  			offset,
  			i, l,
  			els,
  			pos = 0,
  			page = 0;
  
  		if (that.scale < that.options.zoomMin) that.scale = that.options.zoomMin;
  		that.wrapperW = that.wrapper.clientWidth || 1;
  		that.wrapperH = that.wrapper.clientHeight || 1;
  
  		that.minScrollY = -that.options.topOffset || 0;
  		that.scrollerW = m.round(that.scroller.offsetWidth * that.scale);
  		that.scrollerH = m.round((that.scroller.offsetHeight + that.minScrollY) * that.scale);
  		that.maxScrollX = that.wrapperW - that.scrollerW;
  		that.maxScrollY = that.wrapperH - that.scrollerH + that.minScrollY;
  		that.dirX = 0;
  		that.dirY = 0;
  
  		if (that.options.onRefresh) that.options.onRefresh.call(that);
  
  		that.hScroll = that.options.hScroll && that.maxScrollX < 0;
  		that.vScroll = that.options.vScroll && (!that.options.bounceLock && !that.hScroll || that.scrollerH > that.wrapperH);
  
  		that.hScrollbar = that.hScroll && that.options.hScrollbar;
  		that.vScrollbar = that.vScroll && that.options.vScrollbar && that.scrollerH > that.wrapperH;
  
  		offset = that._offset(that.wrapper);
  		that.wrapperOffsetLeft = -offset.left;
  		that.wrapperOffsetTop = -offset.top;
  
  		// Prepare snap
  		if (typeof that.options.snap == 'string') {
  			that.pagesX = [];
  			that.pagesY = [];
  			els = that.scroller.querySelectorAll(that.options.snap);
  			for (i=0, l=els.length; i<l; i++) {
  				pos = that._offset(els[i]);
  				pos.left += that.wrapperOffsetLeft;
  				pos.top += that.wrapperOffsetTop;
  				that.pagesX[i] = pos.left < that.maxScrollX ? that.maxScrollX : pos.left * that.scale;
  				that.pagesY[i] = pos.top < that.maxScrollY ? that.maxScrollY : pos.top * that.scale;
  			}
  		} else if (that.options.snap) {
  			that.pagesX = [];
  			while (pos >= that.maxScrollX) {
  				that.pagesX[page] = pos;
  				pos = pos - that.wrapperW;
  				page++;
  			}
  			if (that.maxScrollX%that.wrapperW) that.pagesX[that.pagesX.length] = that.maxScrollX - that.pagesX[that.pagesX.length-1] + that.pagesX[that.pagesX.length-1];
  
  			pos = 0;
  			page = 0;
  			that.pagesY = [];
  			while (pos >= that.maxScrollY) {
  				that.pagesY[page] = pos;
  				pos = pos - that.wrapperH;
  				page++;
  			}
  			if (that.maxScrollY%that.wrapperH) that.pagesY[that.pagesY.length] = that.maxScrollY - that.pagesY[that.pagesY.length-1] + that.pagesY[that.pagesY.length-1];
  		}
  
  		// Prepare the scrollbars
  		that._scrollbar('h');
  		that._scrollbar('v');
  
  		if (!that.zoomed) {
  			that.scroller.style[transitionDuration] = '0';
  			that._resetPos(400);
  		}
  	},
  
  	scrollTo: function (x, y, time, relative) {
  		var that = this,
  			step = x,
  			i, l;
  
  		that.stop();
  
  		if (!step.length) step = [{ x: x, y: y, time: time, relative: relative }];
  		
  		for (i=0, l=step.length; i<l; i++) {
  			if (step[i].relative) { step[i].x = that.x - step[i].x; step[i].y = that.y - step[i].y; }
  			that.steps.push({ x: step[i].x, y: step[i].y, time: step[i].time || 0 });
  		}
  
  		that._startAni();
  	},
  
  	scrollToElement: function (el, time) {
  		var that = this, pos;
  		el = el.nodeType ? el : that.scroller.querySelector(el);
  		if (!el) return;
  
  		pos = that._offset(el);
  		pos.left += that.wrapperOffsetLeft;
  		pos.top += that.wrapperOffsetTop;
  
  		pos.left = pos.left > 0 ? 0 : pos.left < that.maxScrollX ? that.maxScrollX : pos.left;
  		pos.top = pos.top > that.minScrollY ? that.minScrollY : pos.top < that.maxScrollY ? that.maxScrollY : pos.top;
  		time = time === undefined ? m.max(m.abs(pos.left)*2, m.abs(pos.top)*2) : time;
  
  		that.scrollTo(pos.left, pos.top, time);
  	},
  
  	scrollToPage: function (pageX, pageY, time) {
  		var that = this, x, y;
  		
  		time = time === undefined ? 400 : time;
  
  		if (that.options.onScrollStart) that.options.onScrollStart.call(that);
  
  		if (that.options.snap) {
  			pageX = pageX == 'next' ? that.currPageX+1 : pageX == 'prev' ? that.currPageX-1 : pageX;
  			pageY = pageY == 'next' ? that.currPageY+1 : pageY == 'prev' ? that.currPageY-1 : pageY;
  
  			pageX = pageX < 0 ? 0 : pageX > that.pagesX.length-1 ? that.pagesX.length-1 : pageX;
  			pageY = pageY < 0 ? 0 : pageY > that.pagesY.length-1 ? that.pagesY.length-1 : pageY;
  
  			that.currPageX = pageX;
  			that.currPageY = pageY;
  			x = that.pagesX[pageX];
  			y = that.pagesY[pageY];
  		} else {
  			x = -that.wrapperW * pageX;
  			y = -that.wrapperH * pageY;
  			if (x < that.maxScrollX) x = that.maxScrollX;
  			if (y < that.maxScrollY) y = that.maxScrollY;
  		}
  
  		that.scrollTo(x, y, time);
  	},
  
  	disable: function () {
  		this.stop();
  		this._resetPos(0);
  		this.enabled = false;
  
  		// If disabled after touchstart we make sure that there are no left over events
  		this._unbind(MOVE_EV, window);
  		this._unbind(END_EV, window);
  		this._unbind(CANCEL_EV, window);
  	},
  	
  	enable: function () {
  		this.enabled = true;
  	},
  	
  	stop: function () {
  		if (this.options.useTransition) this._unbind(TRNEND_EV);
  		else cancelFrame(this.aniTime);
  		this.steps = [];
  		this.moved = false;
  		this.animating = false;
  	},
  	
  	zoom: function (x, y, scale, time) {
  		var that = this,
  			relScale = scale / that.scale;
  
  		if (!that.options.useTransform) return;
  
  		that.zoomed = true;
  		time = time === undefined ? 200 : time;
  		x = x - that.wrapperOffsetLeft - that.x;
  		y = y - that.wrapperOffsetTop - that.y;
  		that.x = x - x * relScale + that.x;
  		that.y = y - y * relScale + that.y;
  
  		that.scale = scale;
  		that.refresh();
  
  		that.x = that.x > 0 ? 0 : that.x < that.maxScrollX ? that.maxScrollX : that.x;
  		that.y = that.y > that.minScrollY ? that.minScrollY : that.y < that.maxScrollY ? that.maxScrollY : that.y;
  
  		that.scroller.style[transitionDuration] = time + 'ms';
  		that.scroller.style[transform] = 'translate(' + that.x + 'px,' + that.y + 'px) scale(' + scale + ')' + translateZ;
  		that.zoomed = false;
  	},
  	
  	isReady: function () {
  		return !this.moved && !this.zoomed && !this.animating;
  	}
  };
  
  function prefixStyle (style) {
  	if ( vendor === '' ) return style;
  
  	style = style.charAt(0).toUpperCase() + style.substr(1);
  	return vendor + style;
  }
  
  dummyStyle = null;	// for the sake of it
  
  if (typeof exports !== 'undefined') exports.iScroll = iScroll;
  else window.iScroll = iScroll;
  
  })(window, document);
  

  provide("iscroll", module.exports);

  !function ($, iScroll) {
    $.ender({
      iScroll: function (options) {
        return new iScroll(this[0], options)
      }
    }, true)
  }(ender, require('iscroll').iScroll)

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  //     Underscore.js 1.4.2
  //     http://underscorejs.org
  //     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
  //     Underscore may be freely distributed under the MIT license.
  
  (function() {
  
    // Baseline setup
    // --------------
  
    // Establish the root object, `window` in the browser, or `global` on the server.
    var root = this;
  
    // Save the previous value of the `_` variable.
    var previousUnderscore = root._;
  
    // Establish the object that gets returned to break out of a loop iteration.
    var breaker = {};
  
    // Save bytes in the minified (but not gzipped) version:
    var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;
  
    // Create quick reference variables for speed access to core prototypes.
    var push             = ArrayProto.push,
        slice            = ArrayProto.slice,
        concat           = ArrayProto.concat,
        unshift          = ArrayProto.unshift,
        toString         = ObjProto.toString,
        hasOwnProperty   = ObjProto.hasOwnProperty;
  
    // All **ECMAScript 5** native function implementations that we hope to use
    // are declared here.
    var
      nativeForEach      = ArrayProto.forEach,
      nativeMap          = ArrayProto.map,
      nativeReduce       = ArrayProto.reduce,
      nativeReduceRight  = ArrayProto.reduceRight,
      nativeFilter       = ArrayProto.filter,
      nativeEvery        = ArrayProto.every,
      nativeSome         = ArrayProto.some,
      nativeIndexOf      = ArrayProto.indexOf,
      nativeLastIndexOf  = ArrayProto.lastIndexOf,
      nativeIsArray      = Array.isArray,
      nativeKeys         = Object.keys,
      nativeBind         = FuncProto.bind;
  
    // Create a safe reference to the Underscore object for use below.
    var _ = function(obj) {
      if (obj instanceof _) return obj;
      if (!(this instanceof _)) return new _(obj);
      this._wrapped = obj;
    };
  
    // Export the Underscore object for **Node.js**, with
    // backwards-compatibility for the old `require()` API. If we're in
    // the browser, add `_` as a global object via a string identifier,
    // for Closure Compiler "advanced" mode.
    if (typeof exports !== 'undefined') {
      if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = _;
      }
      exports._ = _;
    } else {
      root['_'] = _;
    }
  
    // Current version.
    _.VERSION = '1.4.2';
  
    // Collection Functions
    // --------------------
  
    // The cornerstone, an `each` implementation, aka `forEach`.
    // Handles objects with the built-in `forEach`, arrays, and raw objects.
    // Delegates to **ECMAScript 5**'s native `forEach` if available.
    var each = _.each = _.forEach = function(obj, iterator, context) {
      if (obj == null) return;
      if (nativeForEach && obj.forEach === nativeForEach) {
        obj.forEach(iterator, context);
      } else if (obj.length === +obj.length) {
        for (var i = 0, l = obj.length; i < l; i++) {
          if (iterator.call(context, obj[i], i, obj) === breaker) return;
        }
      } else {
        for (var key in obj) {
          if (_.has(obj, key)) {
            if (iterator.call(context, obj[key], key, obj) === breaker) return;
          }
        }
      }
    };
  
    // Return the results of applying the iterator to each element.
    // Delegates to **ECMAScript 5**'s native `map` if available.
    _.map = _.collect = function(obj, iterator, context) {
      var results = [];
      if (obj == null) return results;
      if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
      each(obj, function(value, index, list) {
        results[results.length] = iterator.call(context, value, index, list);
      });
      return results;
    };
  
    // **Reduce** builds up a single result from a list of values, aka `inject`,
    // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
    _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
      var initial = arguments.length > 2;
      if (obj == null) obj = [];
      if (nativeReduce && obj.reduce === nativeReduce) {
        if (context) iterator = _.bind(iterator, context);
        return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
      }
      each(obj, function(value, index, list) {
        if (!initial) {
          memo = value;
          initial = true;
        } else {
          memo = iterator.call(context, memo, value, index, list);
        }
      });
      if (!initial) throw new TypeError('Reduce of empty array with no initial value');
      return memo;
    };
  
    // The right-associative version of reduce, also known as `foldr`.
    // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
    _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
      var initial = arguments.length > 2;
      if (obj == null) obj = [];
      if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
        if (context) iterator = _.bind(iterator, context);
        return arguments.length > 2 ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
      }
      var length = obj.length;
      if (length !== +length) {
        var keys = _.keys(obj);
        length = keys.length;
      }
      each(obj, function(value, index, list) {
        index = keys ? keys[--length] : --length;
        if (!initial) {
          memo = obj[index];
          initial = true;
        } else {
          memo = iterator.call(context, memo, obj[index], index, list);
        }
      });
      if (!initial) throw new TypeError('Reduce of empty array with no initial value');
      return memo;
    };
  
    // Return the first value which passes a truth test. Aliased as `detect`.
    _.find = _.detect = function(obj, iterator, context) {
      var result;
      any(obj, function(value, index, list) {
        if (iterator.call(context, value, index, list)) {
          result = value;
          return true;
        }
      });
      return result;
    };
  
    // Return all the elements that pass a truth test.
    // Delegates to **ECMAScript 5**'s native `filter` if available.
    // Aliased as `select`.
    _.filter = _.select = function(obj, iterator, context) {
      var results = [];
      if (obj == null) return results;
      if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
      each(obj, function(value, index, list) {
        if (iterator.call(context, value, index, list)) results[results.length] = value;
      });
      return results;
    };
  
    // Return all the elements for which a truth test fails.
    _.reject = function(obj, iterator, context) {
      var results = [];
      if (obj == null) return results;
      each(obj, function(value, index, list) {
        if (!iterator.call(context, value, index, list)) results[results.length] = value;
      });
      return results;
    };
  
    // Determine whether all of the elements match a truth test.
    // Delegates to **ECMAScript 5**'s native `every` if available.
    // Aliased as `all`.
    _.every = _.all = function(obj, iterator, context) {
      iterator || (iterator = _.identity);
      var result = true;
      if (obj == null) return result;
      if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
      each(obj, function(value, index, list) {
        if (!(result = result && iterator.call(context, value, index, list))) return breaker;
      });
      return !!result;
    };
  
    // Determine if at least one element in the object matches a truth test.
    // Delegates to **ECMAScript 5**'s native `some` if available.
    // Aliased as `any`.
    var any = _.some = _.any = function(obj, iterator, context) {
      iterator || (iterator = _.identity);
      var result = false;
      if (obj == null) return result;
      if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
      each(obj, function(value, index, list) {
        if (result || (result = iterator.call(context, value, index, list))) return breaker;
      });
      return !!result;
    };
  
    // Determine if the array or object contains a given value (using `===`).
    // Aliased as `include`.
    _.contains = _.include = function(obj, target) {
      var found = false;
      if (obj == null) return found;
      if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
      found = any(obj, function(value) {
        return value === target;
      });
      return found;
    };
  
    // Invoke a method (with arguments) on every item in a collection.
    _.invoke = function(obj, method) {
      var args = slice.call(arguments, 2);
      return _.map(obj, function(value) {
        return (_.isFunction(method) ? method : value[method]).apply(value, args);
      });
    };
  
    // Convenience version of a common use case of `map`: fetching a property.
    _.pluck = function(obj, key) {
      return _.map(obj, function(value){ return value[key]; });
    };
  
    // Convenience version of a common use case of `filter`: selecting only objects
    // with specific `key:value` pairs.
    _.where = function(obj, attrs) {
      if (_.isEmpty(attrs)) return [];
      return _.filter(obj, function(value) {
        for (var key in attrs) {
          if (attrs[key] !== value[key]) return false;
        }
        return true;
      });
    };
  
    // Return the maximum element or (element-based computation).
    // Can't optimize arrays of integers longer than 65,535 elements.
    // See: https://bugs.webkit.org/show_bug.cgi?id=80797
    _.max = function(obj, iterator, context) {
      if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
        return Math.max.apply(Math, obj);
      }
      if (!iterator && _.isEmpty(obj)) return -Infinity;
      var result = {computed : -Infinity};
      each(obj, function(value, index, list) {
        var computed = iterator ? iterator.call(context, value, index, list) : value;
        computed >= result.computed && (result = {value : value, computed : computed});
      });
      return result.value;
    };
  
    // Return the minimum element (or element-based computation).
    _.min = function(obj, iterator, context) {
      if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
        return Math.min.apply(Math, obj);
      }
      if (!iterator && _.isEmpty(obj)) return Infinity;
      var result = {computed : Infinity};
      each(obj, function(value, index, list) {
        var computed = iterator ? iterator.call(context, value, index, list) : value;
        computed < result.computed && (result = {value : value, computed : computed});
      });
      return result.value;
    };
  
    // Shuffle an array.
    _.shuffle = function(obj) {
      var rand;
      var index = 0;
      var shuffled = [];
      each(obj, function(value) {
        rand = _.random(index++);
        shuffled[index - 1] = shuffled[rand];
        shuffled[rand] = value;
      });
      return shuffled;
    };
  
    // An internal function to generate lookup iterators.
    var lookupIterator = function(value) {
      return _.isFunction(value) ? value : function(obj){ return obj[value]; };
    };
  
    // Sort the object's values by a criterion produced by an iterator.
    _.sortBy = function(obj, value, context) {
      var iterator = lookupIterator(value);
      return _.pluck(_.map(obj, function(value, index, list) {
        return {
          value : value,
          index : index,
          criteria : iterator.call(context, value, index, list)
        };
      }).sort(function(left, right) {
        var a = left.criteria;
        var b = right.criteria;
        if (a !== b) {
          if (a > b || a === void 0) return 1;
          if (a < b || b === void 0) return -1;
        }
        return left.index < right.index ? -1 : 1;
      }), 'value');
    };
  
    // An internal function used for aggregate "group by" operations.
    var group = function(obj, value, context, behavior) {
      var result = {};
      var iterator = lookupIterator(value);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  
    // Groups the object's values by a criterion. Pass either a string attribute
    // to group by, or a function that returns the criterion.
    _.groupBy = function(obj, value, context) {
      return group(obj, value, context, function(result, key, value) {
        (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
      });
    };
  
    // Counts instances of an object that group by a certain criterion. Pass
    // either a string attribute to count by, or a function that returns the
    // criterion.
    _.countBy = function(obj, value, context) {
      return group(obj, value, context, function(result, key, value) {
        if (!_.has(result, key)) result[key] = 0;
        result[key]++;
      });
    };
  
    // Use a comparator function to figure out the smallest index at which
    // an object should be inserted so as to maintain order. Uses binary search.
    _.sortedIndex = function(array, obj, iterator, context) {
      iterator = iterator == null ? _.identity : lookupIterator(iterator);
      var value = iterator.call(context, obj);
      var low = 0, high = array.length;
      while (low < high) {
        var mid = (low + high) >>> 1;
        iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
      }
      return low;
    };
  
    // Safely convert anything iterable into a real, live array.
    _.toArray = function(obj) {
      if (!obj) return [];
      if (obj.length === +obj.length) return slice.call(obj);
      return _.values(obj);
    };
  
    // Return the number of elements in an object.
    _.size = function(obj) {
      return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
    };
  
    // Array Functions
    // ---------------
  
    // Get the first element of an array. Passing **n** will return the first N
    // values in the array. Aliased as `head` and `take`. The **guard** check
    // allows it to work with `_.map`.
    _.first = _.head = _.take = function(array, n, guard) {
      return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
    };
  
    // Returns everything but the last entry of the array. Especially useful on
    // the arguments object. Passing **n** will return all the values in
    // the array, excluding the last N. The **guard** check allows it to work with
    // `_.map`.
    _.initial = function(array, n, guard) {
      return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
    };
  
    // Get the last element of an array. Passing **n** will return the last N
    // values in the array. The **guard** check allows it to work with `_.map`.
    _.last = function(array, n, guard) {
      if ((n != null) && !guard) {
        return slice.call(array, Math.max(array.length - n, 0));
      } else {
        return array[array.length - 1];
      }
    };
  
    // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
    // Especially useful on the arguments object. Passing an **n** will return
    // the rest N values in the array. The **guard**
    // check allows it to work with `_.map`.
    _.rest = _.tail = _.drop = function(array, n, guard) {
      return slice.call(array, (n == null) || guard ? 1 : n);
    };
  
    // Trim out all falsy values from an array.
    _.compact = function(array) {
      return _.filter(array, function(value){ return !!value; });
    };
  
    // Internal implementation of a recursive `flatten` function.
    var flatten = function(input, shallow, output) {
      each(input, function(value) {
        if (_.isArray(value)) {
          shallow ? push.apply(output, value) : flatten(value, shallow, output);
        } else {
          output.push(value);
        }
      });
      return output;
    };
  
    // Return a completely flattened version of an array.
    _.flatten = function(array, shallow) {
      return flatten(array, shallow, []);
    };
  
    // Return a version of the array that does not contain the specified value(s).
    _.without = function(array) {
      return _.difference(array, slice.call(arguments, 1));
    };
  
    // Produce a duplicate-free version of the array. If the array has already
    // been sorted, you have the option of using a faster algorithm.
    // Aliased as `unique`.
    _.uniq = _.unique = function(array, isSorted, iterator, context) {
      var initial = iterator ? _.map(array, iterator, context) : array;
      var results = [];
      var seen = [];
      each(initial, function(value, index) {
        if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
          seen.push(value);
          results.push(array[index]);
        }
      });
      return results;
    };
  
    // Produce an array that contains the union: each distinct element from all of
    // the passed-in arrays.
    _.union = function() {
      return _.uniq(concat.apply(ArrayProto, arguments));
    };
  
    // Produce an array that contains every item shared between all the
    // passed-in arrays.
    _.intersection = function(array) {
      var rest = slice.call(arguments, 1);
      return _.filter(_.uniq(array), function(item) {
        return _.every(rest, function(other) {
          return _.indexOf(other, item) >= 0;
        });
      });
    };
  
    // Take the difference between one array and a number of other arrays.
    // Only the elements present in just the first array will remain.
    _.difference = function(array) {
      var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
      return _.filter(array, function(value){ return !_.contains(rest, value); });
    };
  
    // Zip together multiple lists into a single array -- elements that share
    // an index go together.
    _.zip = function() {
      var args = slice.call(arguments);
      var length = _.max(_.pluck(args, 'length'));
      var results = new Array(length);
      for (var i = 0; i < length; i++) {
        results[i] = _.pluck(args, "" + i);
      }
      return results;
    };
  
    // Converts lists into objects. Pass either a single array of `[key, value]`
    // pairs, or two parallel arrays of the same length -- one of keys, and one of
    // the corresponding values.
    _.object = function(list, values) {
      var result = {};
      for (var i = 0, l = list.length; i < l; i++) {
        if (values) {
          result[list[i]] = values[i];
        } else {
          result[list[i][0]] = list[i][1];
        }
      }
      return result;
    };
  
    // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
    // we need this function. Return the position of the first occurrence of an
    // item in an array, or -1 if the item is not included in the array.
    // Delegates to **ECMAScript 5**'s native `indexOf` if available.
    // If the array is large and already in sort order, pass `true`
    // for **isSorted** to use binary search.
    _.indexOf = function(array, item, isSorted) {
      if (array == null) return -1;
      var i = 0, l = array.length;
      if (isSorted) {
        if (typeof isSorted == 'number') {
          i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
        } else {
          i = _.sortedIndex(array, item);
          return array[i] === item ? i : -1;
        }
      }
      if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
      for (; i < l; i++) if (array[i] === item) return i;
      return -1;
    };
  
    // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
    _.lastIndexOf = function(array, item, from) {
      if (array == null) return -1;
      var hasIndex = from != null;
      if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
        return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
      }
      var i = (hasIndex ? from : array.length);
      while (i--) if (array[i] === item) return i;
      return -1;
    };
  
    // Generate an integer Array containing an arithmetic progression. A port of
    // the native Python `range()` function. See
    // [the Python documentation](http://docs.python.org/library/functions.html#range).
    _.range = function(start, stop, step) {
      if (arguments.length <= 1) {
        stop = start || 0;
        start = 0;
      }
      step = arguments[2] || 1;
  
      var len = Math.max(Math.ceil((stop - start) / step), 0);
      var idx = 0;
      var range = new Array(len);
  
      while(idx < len) {
        range[idx++] = start;
        start += step;
      }
  
      return range;
    };
  
    // Function (ahem) Functions
    // ------------------
  
    // Reusable constructor function for prototype setting.
    var ctor = function(){};
  
    // Create a function bound to a given object (assigning `this`, and arguments,
    // optionally). Binding with arguments is also known as `curry`.
    // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
    // We check for `func.bind` first, to fail fast when `func` is undefined.
    _.bind = function bind(func, context) {
      var bound, args;
      if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
      if (!_.isFunction(func)) throw new TypeError;
      args = slice.call(arguments, 2);
      return bound = function() {
        if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
        ctor.prototype = func.prototype;
        var self = new ctor;
        var result = func.apply(self, args.concat(slice.call(arguments)));
        if (Object(result) === result) return result;
        return self;
      };
    };
  
    // Bind all of an object's methods to that object. Useful for ensuring that
    // all callbacks defined on an object belong to it.
    _.bindAll = function(obj) {
      var funcs = slice.call(arguments, 1);
      if (funcs.length == 0) funcs = _.functions(obj);
      each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
      return obj;
    };
  
    // Memoize an expensive function by storing its results.
    _.memoize = function(func, hasher) {
      var memo = {};
      hasher || (hasher = _.identity);
      return function() {
        var key = hasher.apply(this, arguments);
        return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
      };
    };
  
    // Delays a function for the given number of milliseconds, and then calls
    // it with the arguments supplied.
    _.delay = function(func, wait) {
      var args = slice.call(arguments, 2);
      return setTimeout(function(){ return func.apply(null, args); }, wait);
    };
  
    // Defers a function, scheduling it to run after the current call stack has
    // cleared.
    _.defer = function(func) {
      return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
    };
  
    // Returns a function, that, when invoked, will only be triggered at most once
    // during a given window of time.
    _.throttle = function(func, wait) {
      var context, args, timeout, throttling, more, result;
      var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
      return function() {
        context = this; args = arguments;
        var later = function() {
          timeout = null;
          if (more) {
            result = func.apply(context, args);
          }
          whenDone();
        };
        if (!timeout) timeout = setTimeout(later, wait);
        if (throttling) {
          more = true;
        } else {
          throttling = true;
          result = func.apply(context, args);
        }
        whenDone();
        return result;
      };
    };
  
    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    _.debounce = function(func, wait, immediate) {
      var timeout, result;
      return function() {
        var context = this, args = arguments;
        var later = function() {
          timeout = null;
          if (!immediate) result = func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) result = func.apply(context, args);
        return result;
      };
    };
  
    // Returns a function that will be executed at most one time, no matter how
    // often you call it. Useful for lazy initialization.
    _.once = function(func) {
      var ran = false, memo;
      return function() {
        if (ran) return memo;
        ran = true;
        memo = func.apply(this, arguments);
        func = null;
        return memo;
      };
    };
  
    // Returns the first function passed as an argument to the second,
    // allowing you to adjust arguments, run code before and after, and
    // conditionally execute the original function.
    _.wrap = function(func, wrapper) {
      return function() {
        var args = [func];
        push.apply(args, arguments);
        return wrapper.apply(this, args);
      };
    };
  
    // Returns a function that is the composition of a list of functions, each
    // consuming the return value of the function that follows.
    _.compose = function() {
      var funcs = arguments;
      return function() {
        var args = arguments;
        for (var i = funcs.length - 1; i >= 0; i--) {
          args = [funcs[i].apply(this, args)];
        }
        return args[0];
      };
    };
  
    // Returns a function that will only be executed after being called N times.
    _.after = function(times, func) {
      if (times <= 0) return func();
      return function() {
        if (--times < 1) {
          return func.apply(this, arguments);
        }
      };
    };
  
    // Object Functions
    // ----------------
  
    // Retrieve the names of an object's properties.
    // Delegates to **ECMAScript 5**'s native `Object.keys`
    _.keys = nativeKeys || function(obj) {
      if (obj !== Object(obj)) throw new TypeError('Invalid object');
      var keys = [];
      for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
      return keys;
    };
  
    // Retrieve the values of an object's properties.
    _.values = function(obj) {
      var values = [];
      for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
      return values;
    };
  
    // Convert an object into a list of `[key, value]` pairs.
    _.pairs = function(obj) {
      var pairs = [];
      for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
      return pairs;
    };
  
    // Invert the keys and values of an object. The values must be serializable.
    _.invert = function(obj) {
      var result = {};
      for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
      return result;
    };
  
    // Return a sorted list of the function names available on the object.
    // Aliased as `methods`
    _.functions = _.methods = function(obj) {
      var names = [];
      for (var key in obj) {
        if (_.isFunction(obj[key])) names.push(key);
      }
      return names.sort();
    };
  
    // Extend a given object with all the properties in passed-in object(s).
    _.extend = function(obj) {
      each(slice.call(arguments, 1), function(source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      });
      return obj;
    };
  
    // Return a copy of the object only containing the whitelisted properties.
    _.pick = function(obj) {
      var copy = {};
      var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
      each(keys, function(key) {
        if (key in obj) copy[key] = obj[key];
      });
      return copy;
    };
  
     // Return a copy of the object without the blacklisted properties.
    _.omit = function(obj) {
      var copy = {};
      var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
      for (var key in obj) {
        if (!_.contains(keys, key)) copy[key] = obj[key];
      }
      return copy;
    };
  
    // Fill in a given object with default properties.
    _.defaults = function(obj) {
      each(slice.call(arguments, 1), function(source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      });
      return obj;
    };
  
    // Create a (shallow-cloned) duplicate of an object.
    _.clone = function(obj) {
      if (!_.isObject(obj)) return obj;
      return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
    };
  
    // Invokes interceptor with the obj, and then returns obj.
    // The primary purpose of this method is to "tap into" a method chain, in
    // order to perform operations on intermediate results within the chain.
    _.tap = function(obj, interceptor) {
      interceptor(obj);
      return obj;
    };
  
    // Internal recursive comparison function for `isEqual`.
    var eq = function(a, b, aStack, bStack) {
      // Identical objects are equal. `0 === -0`, but they aren't identical.
      // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
      if (a === b) return a !== 0 || 1 / a == 1 / b;
      // A strict comparison is necessary because `null == undefined`.
      if (a == null || b == null) return a === b;
      // Unwrap any wrapped objects.
      if (a instanceof _) a = a._wrapped;
      if (b instanceof _) b = b._wrapped;
      // Compare `[[Class]]` names.
      var className = toString.call(a);
      if (className != toString.call(b)) return false;
      switch (className) {
        // Strings, numbers, dates, and booleans are compared by value.
        case '[object String]':
          // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
          // equivalent to `new String("5")`.
          return a == String(b);
        case '[object Number]':
          // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
          // other numeric values.
          return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
        case '[object Date]':
        case '[object Boolean]':
          // Coerce dates and booleans to numeric primitive values. Dates are compared by their
          // millisecond representations. Note that invalid dates with millisecond representations
          // of `NaN` are not equivalent.
          return +a == +b;
        // RegExps are compared by their source patterns and flags.
        case '[object RegExp]':
          return a.source == b.source &&
                 a.global == b.global &&
                 a.multiline == b.multiline &&
                 a.ignoreCase == b.ignoreCase;
      }
      if (typeof a != 'object' || typeof b != 'object') return false;
      // Assume equality for cyclic structures. The algorithm for detecting cyclic
      // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
      var length = aStack.length;
      while (length--) {
        // Linear search. Performance is inversely proportional to the number of
        // unique nested structures.
        if (aStack[length] == a) return bStack[length] == b;
      }
      // Add the first object to the stack of traversed objects.
      aStack.push(a);
      bStack.push(b);
      var size = 0, result = true;
      // Recursively compare objects and arrays.
      if (className == '[object Array]') {
        // Compare array lengths to determine if a deep comparison is necessary.
        size = a.length;
        result = size == b.length;
        if (result) {
          // Deep compare the contents, ignoring non-numeric properties.
          while (size--) {
            if (!(result = eq(a[size], b[size], aStack, bStack))) break;
          }
        }
      } else {
        // Objects with different constructors are not equivalent, but `Object`s
        // from different frames are.
        var aCtor = a.constructor, bCtor = b.constructor;
        if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                                 _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
          return false;
        }
        // Deep compare objects.
        for (var key in a) {
          if (_.has(a, key)) {
            // Count the expected number of properties.
            size++;
            // Deep compare each member.
            if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
          }
        }
        // Ensure that both objects contain the same number of properties.
        if (result) {
          for (key in b) {
            if (_.has(b, key) && !(size--)) break;
          }
          result = !size;
        }
      }
      // Remove the first object from the stack of traversed objects.
      aStack.pop();
      bStack.pop();
      return result;
    };
  
    // Perform a deep comparison to check if two objects are equal.
    _.isEqual = function(a, b) {
      return eq(a, b, [], []);
    };
  
    // Is a given array, string, or object empty?
    // An "empty" object has no enumerable own-properties.
    _.isEmpty = function(obj) {
      if (obj == null) return true;
      if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
      for (var key in obj) if (_.has(obj, key)) return false;
      return true;
    };
  
    // Is a given value a DOM element?
    _.isElement = function(obj) {
      return !!(obj && obj.nodeType === 1);
    };
  
    // Is a given value an array?
    // Delegates to ECMA5's native Array.isArray
    _.isArray = nativeIsArray || function(obj) {
      return toString.call(obj) == '[object Array]';
    };
  
    // Is a given variable an object?
    _.isObject = function(obj) {
      return obj === Object(obj);
    };
  
    // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
    each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
      _['is' + name] = function(obj) {
        return toString.call(obj) == '[object ' + name + ']';
      };
    });
  
    // Define a fallback version of the method in browsers (ahem, IE), where
    // there isn't any inspectable "Arguments" type.
    if (!_.isArguments(arguments)) {
      _.isArguments = function(obj) {
        return !!(obj && _.has(obj, 'callee'));
      };
    }
  
    // Optimize `isFunction` if appropriate.
    if (typeof (/./) !== 'function') {
      _.isFunction = function(obj) {
        return typeof obj === 'function';
      };
    }
  
    // Is a given object a finite number?
    _.isFinite = function(obj) {
      return _.isNumber(obj) && isFinite(obj);
    };
  
    // Is the given value `NaN`? (NaN is the only number which does not equal itself).
    _.isNaN = function(obj) {
      return _.isNumber(obj) && obj != +obj;
    };
  
    // Is a given value a boolean?
    _.isBoolean = function(obj) {
      return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
    };
  
    // Is a given value equal to null?
    _.isNull = function(obj) {
      return obj === null;
    };
  
    // Is a given variable undefined?
    _.isUndefined = function(obj) {
      return obj === void 0;
    };
  
    // Shortcut function for checking if an object has a given property directly
    // on itself (in other words, not on a prototype).
    _.has = function(obj, key) {
      return hasOwnProperty.call(obj, key);
    };
  
    // Utility Functions
    // -----------------
  
    // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
    // previous owner. Returns a reference to the Underscore object.
    _.noConflict = function() {
      root._ = previousUnderscore;
      return this;
    };
  
    // Keep the identity function around for default iterators.
    _.identity = function(value) {
      return value;
    };
  
    // Run a function **n** times.
    _.times = function(n, iterator, context) {
      for (var i = 0; i < n; i++) iterator.call(context, i);
    };
  
    // Return a random integer between min and max (inclusive).
    _.random = function(min, max) {
      if (max == null) {
        max = min;
        min = 0;
      }
      return min + (0 | Math.random() * (max - min + 1));
    };
  
    // List of HTML entities for escaping.
    var entityMap = {
      escape: {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
      }
    };
    entityMap.unescape = _.invert(entityMap.escape);
  
    // Regexes containing the keys and values listed immediately above.
    var entityRegexes = {
      escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
      unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
    };
  
    // Functions for escaping and unescaping strings to/from HTML interpolation.
    _.each(['escape', 'unescape'], function(method) {
      _[method] = function(string) {
        if (string == null) return '';
        return ('' + string).replace(entityRegexes[method], function(match) {
          return entityMap[method][match];
        });
      };
    });
  
    // If the value of the named property is a function then invoke it;
    // otherwise, return it.
    _.result = function(object, property) {
      if (object == null) return null;
      var value = object[property];
      return _.isFunction(value) ? value.call(object) : value;
    };
  
    // Add your own custom functions to the Underscore object.
    _.mixin = function(obj) {
      each(_.functions(obj), function(name){
        var func = _[name] = obj[name];
        _.prototype[name] = function() {
          var args = [this._wrapped];
          push.apply(args, arguments);
          return result.call(this, func.apply(_, args));
        };
      });
    };
  
    // Generate a unique integer id (unique within the entire client session).
    // Useful for temporary DOM ids.
    var idCounter = 0;
    _.uniqueId = function(prefix) {
      var id = idCounter++;
      return prefix ? prefix + id : id;
    };
  
    // By default, Underscore uses ERB-style template delimiters, change the
    // following template settings to use alternative delimiters.
    _.templateSettings = {
      evaluate    : /<%([\s\S]+?)%>/g,
      interpolate : /<%=([\s\S]+?)%>/g,
      escape      : /<%-([\s\S]+?)%>/g
    };
  
    // When customizing `templateSettings`, if you don't want to define an
    // interpolation, evaluation or escaping regex, we need one that is
    // guaranteed not to match.
    var noMatch = /(.)^/;
  
    // Certain characters need to be escaped so that they can be put into a
    // string literal.
    var escapes = {
      "'":      "'",
      '\\':     '\\',
      '\r':     'r',
      '\n':     'n',
      '\t':     't',
      '\u2028': 'u2028',
      '\u2029': 'u2029'
    };
  
    var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
  
    // JavaScript micro-templating, similar to John Resig's implementation.
    // Underscore templating handles arbitrary delimiters, preserves whitespace,
    // and correctly escapes quotes within interpolated code.
    _.template = function(text, data, settings) {
      settings = _.defaults({}, settings, _.templateSettings);
  
      // Combine delimiters into one regular expression via alternation.
      var matcher = new RegExp([
        (settings.escape || noMatch).source,
        (settings.interpolate || noMatch).source,
        (settings.evaluate || noMatch).source
      ].join('|') + '|$', 'g');
  
      // Compile the template source, escaping string literals appropriately.
      var index = 0;
      var source = "__p+='";
      text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
        source += text.slice(index, offset)
          .replace(escaper, function(match) { return '\\' + escapes[match]; });
        source +=
          escape ? "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'" :
          interpolate ? "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'" :
          evaluate ? "';\n" + evaluate + "\n__p+='" : '';
        index = offset + match.length;
      });
      source += "';\n";
  
      // If a variable is not specified, place data values in local scope.
      if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';
  
      source = "var __t,__p='',__j=Array.prototype.join," +
        "print=function(){__p+=__j.call(arguments,'');};\n" +
        source + "return __p;\n";
  
      try {
        var render = new Function(settings.variable || 'obj', '_', source);
      } catch (e) {
        e.source = source;
        throw e;
      }
  
      if (data) return render(data, _);
      var template = function(data) {
        return render.call(this, data, _);
      };
  
      // Provide the compiled function source as a convenience for precompilation.
      template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';
  
      return template;
    };
  
    // Add a "chain" function, which will delegate to the wrapper.
    _.chain = function(obj) {
      return _(obj).chain();
    };
  
    // OOP
    // ---------------
    // If Underscore is called as a function, it returns a wrapped object that
    // can be used OO-style. This wrapper holds altered versions of all the
    // underscore functions. Wrapped objects may be chained.
  
    // Helper function to continue chaining intermediate results.
    var result = function(obj) {
      return this._chain ? _(obj).chain() : obj;
    };
  
    // Add all of the Underscore functions to the wrapper object.
    _.mixin(_);
  
    // Add all mutator Array functions to the wrapper.
    each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
      var method = ArrayProto[name];
      _.prototype[name] = function() {
        var obj = this._wrapped;
        method.apply(obj, arguments);
        if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
        return result.call(this, obj);
      };
    });
  
    // Add all accessor Array functions to the wrapper.
    each(['concat', 'join', 'slice'], function(name) {
      var method = ArrayProto[name];
      _.prototype[name] = function() {
        return result.call(this, method.apply(this._wrapped, arguments));
      };
    });
  
    _.extend(_.prototype, {
  
      // Start chaining a wrapped Underscore object.
      chain: function() {
        this._chain = true;
        return this;
      },
  
      // Extracts the result from a wrapped and chained object.
      value: function() {
        return this._wrapped;
      }
  
    });
  
  }).call(this);
  

  provide("underscore", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /***********************************************
  Copyright 2010, 2011, Chris Winberry <chris@winberry.net>. All rights reserved.
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to
  deal in the Software without restriction, including without limitation the
  rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
  sell copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
  IN THE SOFTWARE.
  ***********************************************/
  /* v1.7.6 */
  
  (function () {
  
  function runningInNode () {
  	return(
  		(typeof require) == "function"
  		&&
  		(typeof exports) == "object"
  		&&
  		(typeof module) == "object"
  		&&
  		(typeof __filename) == "string"
  		&&
  		(typeof __dirname) == "string"
  		);
  }
  
  if (!runningInNode()) {
  	if (!this.Tautologistics)
  		this.Tautologistics = {};
  	else if (this.Tautologistics.NodeHtmlParser)
  		return; //NodeHtmlParser already defined!
  	this.Tautologistics.NodeHtmlParser = {};
  	exports = this.Tautologistics.NodeHtmlParser;
  }
  
  //Types of elements found in the DOM
  var ElementType = {
  	  Text: "text" //Plain text
  	, Directive: "directive" //Special tag <!...>
  	, Comment: "comment" //Special tag <!--...-->
  	, Script: "script" //Special tag <script>...</script>
  	, Style: "style" //Special tag <style>...</style>
  	, Tag: "tag" //Any tag that isn't special
  }
  
  function Parser (handler, options) {
  	this._options = options ? options : { };
  	if (this._options.includeLocation == undefined) {
  		this._options.includeLocation = false; //Do not track element position in document by default
  	}
  
  	this.validateHandler(handler);
  	this._handler = handler;
  	this.reset();
  }
  
  	//**"Static"**//
  	//Regular expressions used for cleaning up and parsing (stateless)
  	Parser._reTrim = /(^\s+|\s+$)/g; //Trim leading/trailing whitespace
  	Parser._reTrimComment = /(^\!--|--$)/g; //Remove comment tag markup from comment contents
  	Parser._reWhitespace = /\s/g; //Used to find any whitespace to split on
  	Parser._reTagName = /^\s*(\/?)\s*([^\s\/]+)/; //Used to find the tag name for an element
  
  	//Regular expressions used for parsing (stateful)
  	Parser._reAttrib = //Find attributes in a tag
  		/([^=<>\"\'\s]+)\s*=\s*"([^"]*)"|([^=<>\"\'\s]+)\s*=\s*'([^']*)'|([^=<>\"\'\s]+)\s*=\s*([^'"\s]+)|([^=<>\"\'\s\/]+)/g;
  	Parser._reTags = /[\<\>]/g; //Find tag markers
  
  	//**Public**//
  	//Methods//
  	//Parses a complete HTML and pushes it to the handler
  	Parser.prototype.parseComplete = function Parser$parseComplete (data) {
  		this.reset();
  		this.parseChunk(data);
  		this.done();
  	}
  
  	//Parses a piece of an HTML document
  	Parser.prototype.parseChunk = function Parser$parseChunk (data) {
  		if (this._done)
  			this.handleError(new Error("Attempted to parse chunk after parsing already done"));
  		this._buffer += data; //FIXME: this can be a bottleneck
  		this.parseTags();
  	}
  
  	//Tells the parser that the HTML being parsed is complete
  	Parser.prototype.done = function Parser$done () {
  		if (this._done)
  			return;
  		this._done = true;
  	
  		//Push any unparsed text into a final element in the element list
  		if (this._buffer.length) {
  			var rawData = this._buffer;
  			this._buffer = "";
  			var element = {
  				  raw: rawData
  				, data: (this._parseState == ElementType.Text) ? rawData : rawData.replace(Parser._reTrim, "")
  				, type: this._parseState
  				};
  			if (this._parseState == ElementType.Tag || this._parseState == ElementType.Script || this._parseState == ElementType.Style)
  				element.name = this.parseTagName(element.data);
  			this.parseAttribs(element);
  			this._elements.push(element);
  		}
  	
  		this.writeHandler();
  		this._handler.done();
  	}
  
  	//Resets the parser to a blank state, ready to parse a new HTML document
  	Parser.prototype.reset = function Parser$reset () {
  		this._buffer = "";
  		this._done = false;
  		this._elements = [];
  		this._elementsCurrent = 0;
  		this._current = 0;
  		this._next = 0;
  		this._location = {
  			  row: 0
  			, col: 0
  			, charOffset: 0
  			, inBuffer: 0
  		};
  		this._parseState = ElementType.Text;
  		this._prevTagSep = '';
  		this._tagStack = [];
  		this._handler.reset();
  	}
  	
  	//**Private**//
  	//Properties//
  	Parser.prototype._options = null; //Parser options for how to behave
  	Parser.prototype._handler = null; //Handler for parsed elements
  	Parser.prototype._buffer = null; //Buffer of unparsed data
  	Parser.prototype._done = false; //Flag indicating whether parsing is done
  	Parser.prototype._elements =  null; //Array of parsed elements
  	Parser.prototype._elementsCurrent = 0; //Pointer to last element in _elements that has been processed
  	Parser.prototype._current = 0; //Position in data that has already been parsed
  	Parser.prototype._next = 0; //Position in data of the next tag marker (<>)
  	Parser.prototype._location = null; //Position tracking for elements in a stream
  	Parser.prototype._parseState = ElementType.Text; //Current type of element being parsed
  	Parser.prototype._prevTagSep = ''; //Previous tag marker found
  	//Stack of element types previously encountered; keeps track of when
  	//parsing occurs inside a script/comment/style tag
  	Parser.prototype._tagStack = null;
  
  	//Methods//
  	//Takes an array of elements and parses any found attributes
  	Parser.prototype.parseTagAttribs = function Parser$parseTagAttribs (elements) {
  		var idxEnd = elements.length;
  		var idx = 0;
  	
  		while (idx < idxEnd) {
  			var element = elements[idx++];
  			if (element.type == ElementType.Tag || element.type == ElementType.Script || element.type == ElementType.style)
  				this.parseAttribs(element);
  		}
  	
  		return(elements);
  	}
  
  	//Takes an element and adds an "attribs" property for any element attributes found 
  	Parser.prototype.parseAttribs = function Parser$parseAttribs (element) {
  		//Only parse attributes for tags
  		if (element.type != ElementType.Script && element.type != ElementType.Style && element.type != ElementType.Tag)
  			return;
  	
  		var tagName = element.data.split(Parser._reWhitespace, 1)[0];
  		var attribRaw = element.data.substring(tagName.length);
  		if (attribRaw.length < 1)
  			return;
  	
  		var match;
  		Parser._reAttrib.lastIndex = 0;
  		while (match = Parser._reAttrib.exec(attribRaw)) {
  			if (element.attribs == undefined)
  				element.attribs = {};
  	
  			if (typeof match[1] == "string" && match[1].length) {
  				element.attribs[match[1]] = match[2];
  			} else if (typeof match[3] == "string" && match[3].length) {
  				element.attribs[match[3].toString()] = match[4].toString();
  			} else if (typeof match[5] == "string" && match[5].length) {
  				element.attribs[match[5]] = match[6];
  			} else if (typeof match[7] == "string" && match[7].length) {
  				element.attribs[match[7]] = match[7];
  			}
  		}
  	}
  
  	//Extracts the base tag name from the data value of an element
  	Parser.prototype.parseTagName = function Parser$parseTagName (data) {
  		if (data == null || data == "")
  			return("");
  		var match = Parser._reTagName.exec(data);
  		if (!match)
  			return("");
  		return((match[1] ? "/" : "") + match[2]);
  	}
  
  	//Parses through HTML text and returns an array of found elements
  	//I admit, this function is rather large but splitting up had an noticeable impact on speed
  	Parser.prototype.parseTags = function Parser$parseTags () {
  		var bufferEnd = this._buffer.length - 1;
  		while (Parser._reTags.test(this._buffer)) {
  			this._next = Parser._reTags.lastIndex - 1;
  			var tagSep = this._buffer.charAt(this._next); //The currently found tag marker
  			var rawData = this._buffer.substring(this._current, this._next); //The next chunk of data to parse
  	
  			//A new element to eventually be appended to the element list
  			var element = {
  				  raw: rawData
  				, data: (this._parseState == ElementType.Text) ? rawData : rawData.replace(Parser._reTrim, "")
  				, type: this._parseState
  			};
  	
  			var elementName = this.parseTagName(element.data);
  	
  			//This section inspects the current tag stack and modifies the current
  			//element if we're actually parsing a special area (script/comment/style tag)
  			if (this._tagStack.length) { //We're parsing inside a script/comment/style tag
  				if (this._tagStack[this._tagStack.length - 1] == ElementType.Script) { //We're currently in a script tag
  					if (elementName.toLowerCase() == "/script") //Actually, we're no longer in a script tag, so pop it off the stack
  						this._tagStack.pop();
  					else { //Not a closing script tag
  						if (element.raw.indexOf("!--") != 0) { //Make sure we're not in a comment
  							//All data from here to script close is now a text element
  							element.type = ElementType.Text;
  							//If the previous element is text, append the current text to it
  							if (this._elements.length && this._elements[this._elements.length - 1].type == ElementType.Text) {
  								var prevElement = this._elements[this._elements.length - 1];
  								prevElement.raw = prevElement.data = prevElement.raw + this._prevTagSep + element.raw;
  								element.raw = element.data = ""; //This causes the current element to not be added to the element list
  							}
  						}
  					}
  				}
  				else if (this._tagStack[this._tagStack.length - 1] == ElementType.Style) { //We're currently in a style tag
  					if (elementName.toLowerCase() == "/style") //Actually, we're no longer in a style tag, so pop it off the stack
  						this._tagStack.pop();
  					else {
  						if (element.raw.indexOf("!--") != 0) { //Make sure we're not in a comment
  							//All data from here to style close is now a text element
  							element.type = ElementType.Text;
  							//If the previous element is text, append the current text to it
  							if (this._elements.length && this._elements[this._elements.length - 1].type == ElementType.Text) {
  								var prevElement = this._elements[this._elements.length - 1];
  								if (element.raw != "") {
  									prevElement.raw = prevElement.data = prevElement.raw + this._prevTagSep + element.raw;
  									element.raw = element.data = ""; //This causes the current element to not be added to the element list
  								} else { //Element is empty, so just append the last tag marker found
  									prevElement.raw = prevElement.data = prevElement.raw + this._prevTagSep;
  								}
  							} else { //The previous element was not text
  								if (element.raw != "") {
  									element.raw = element.data = element.raw;
  								}
  							}
  						}
  					}
  				}
  				else if (this._tagStack[this._tagStack.length - 1] == ElementType.Comment) { //We're currently in a comment tag
  					var rawLen = element.raw.length;
  					if (element.raw.charAt(rawLen - 2) == "-" && element.raw.charAt(rawLen - 1) == "-" && tagSep == ">") {
  						//Actually, we're no longer in a style tag, so pop it off the stack
  						this._tagStack.pop();
  						//If the previous element is a comment, append the current text to it
  						if (this._elements.length && this._elements[this._elements.length - 1].type == ElementType.Comment) {
  							var prevElement = this._elements[this._elements.length - 1];
  							prevElement.raw = prevElement.data = (prevElement.raw + element.raw).replace(Parser._reTrimComment, "");
  							element.raw = element.data = ""; //This causes the current element to not be added to the element list
  							element.type = ElementType.Text;
  						}
  						else //Previous element not a comment
  							element.type = ElementType.Comment; //Change the current element's type to a comment
  					}
  					else { //Still in a comment tag
  						element.type = ElementType.Comment;
  						//If the previous element is a comment, append the current text to it
  						if (this._elements.length && this._elements[this._elements.length - 1].type == ElementType.Comment) {
  							var prevElement = this._elements[this._elements.length - 1];
  							prevElement.raw = prevElement.data = prevElement.raw + element.raw + tagSep;
  							element.raw = element.data = ""; //This causes the current element to not be added to the element list
  							element.type = ElementType.Text;
  						}
  						else
  							element.raw = element.data = element.raw + tagSep;
  					}
  				}
  			}
  	
  			//Processing of non-special tags
  			if (element.type == ElementType.Tag) {
  				element.name = elementName;
  				var elementNameCI = elementName.toLowerCase();
  				
  				if (element.raw.indexOf("!--") == 0) { //This tag is really comment
  					element.type = ElementType.Comment;
  					delete element["name"];
  					var rawLen = element.raw.length;
  					//Check if the comment is terminated in the current element
  					if (element.raw.charAt(rawLen - 1) == "-" && element.raw.charAt(rawLen - 2) == "-" && tagSep == ">")
  						element.raw = element.data = element.raw.replace(Parser._reTrimComment, "");
  					else { //It's not so push the comment onto the tag stack
  						element.raw += tagSep;
  						this._tagStack.push(ElementType.Comment);
  					}
  				}
  				else if (element.raw.indexOf("!") == 0 || element.raw.indexOf("?") == 0) {
  					element.type = ElementType.Directive;
  					//TODO: what about CDATA?
  				}
  				else if (elementNameCI == "script") {
  					element.type = ElementType.Script;
  					//Special tag, push onto the tag stack if not terminated
  					if (element.data.charAt(element.data.length - 1) != "/")
  						this._tagStack.push(ElementType.Script);
  				}
  				else if (elementNameCI == "/script")
  					element.type = ElementType.Script;
  				else if (elementNameCI == "style") {
  					element.type = ElementType.Style;
  					//Special tag, push onto the tag stack if not terminated
  					if (element.data.charAt(element.data.length - 1) != "/")
  						this._tagStack.push(ElementType.Style);
  				}
  				else if (elementNameCI == "/style")
  					element.type = ElementType.Style;
  				if (element.name && element.name.charAt(0) == "/")
  					element.data = element.name;
  			}
  	
  			//Add all tags and non-empty text elements to the element list
  			if (element.raw != "" || element.type != ElementType.Text) {
  				if (this._options.includeLocation && !element.location) {
  					element.location = this.getLocation(element.type == ElementType.Tag);
  				}
  				this.parseAttribs(element);
  				this._elements.push(element);
  				//If tag self-terminates, add an explicit, separate closing tag
  				if (
  					element.type != ElementType.Text
  					&&
  					element.type != ElementType.Comment
  					&&
  					element.type != ElementType.Directive
  					&&
  					element.data.charAt(element.data.length - 1) == "/"
  					)
  					this._elements.push({
  						  raw: "/" + element.name
  						, data: "/" + element.name
  						, name: "/" + element.name
  						, type: element.type
  					});
  			}
  			this._parseState = (tagSep == "<") ? ElementType.Tag : ElementType.Text;
  			this._current = this._next + 1;
  			this._prevTagSep = tagSep;
  		}
  
  		if (this._options.includeLocation) {
  			this.getLocation();
  			this._location.row += this._location.inBuffer;
  			this._location.inBuffer = 0;
  			this._location.charOffset = 0;
  		}
  		this._buffer = (this._current <= bufferEnd) ? this._buffer.substring(this._current) : "";
  		this._current = 0;
  	
  		this.writeHandler();
  	}
  
  	Parser.prototype.getLocation = function Parser$getLocation (startTag) {
  		var c,
  			l = this._location,
  			end = this._current - (startTag ? 1 : 0),
  			chunk = startTag && l.charOffset == 0 && this._current == 0;
  		
  		for (; l.charOffset < end; l.charOffset++) {
  			c = this._buffer.charAt(l.charOffset);
  			if (c == '\n') {
  				l.inBuffer++;
  				l.col = 0;
  			} else if (c != '\r') {
  				l.col++;
  			}
  		}
  		return {
  			  line: l.row + l.inBuffer + 1
  			, col: l.col + (chunk ? 0: 1)
  		};
  	}
  
  	//Checks the handler to make it is an object with the right "interface"
  	Parser.prototype.validateHandler = function Parser$validateHandler (handler) {
  		if ((typeof handler) != "object")
  			throw new Error("Handler is not an object");
  		if ((typeof handler.reset) != "function")
  			throw new Error("Handler method 'reset' is invalid");
  		if ((typeof handler.done) != "function")
  			throw new Error("Handler method 'done' is invalid");
  		if ((typeof handler.writeTag) != "function")
  			throw new Error("Handler method 'writeTag' is invalid");
  		if ((typeof handler.writeText) != "function")
  			throw new Error("Handler method 'writeText' is invalid");
  		if ((typeof handler.writeComment) != "function")
  			throw new Error("Handler method 'writeComment' is invalid");
  		if ((typeof handler.writeDirective) != "function")
  			throw new Error("Handler method 'writeDirective' is invalid");
  	}
  
  	//Writes parsed elements out to the handler
  	Parser.prototype.writeHandler = function Parser$writeHandler (forceFlush) {
  		forceFlush = !!forceFlush;
  		if (this._tagStack.length && !forceFlush)
  			return;
  		while (this._elements.length) {
  			var element = this._elements.shift();
  			switch (element.type) {
  				case ElementType.Comment:
  					this._handler.writeComment(element);
  					break;
  				case ElementType.Directive:
  					this._handler.writeDirective(element);
  					break;
  				case ElementType.Text:
  					this._handler.writeText(element);
  					break;
  				default:
  					this._handler.writeTag(element);
  					break;
  			}
  		}
  	}
  
  	Parser.prototype.handleError = function Parser$handleError (error) {
  		if ((typeof this._handler.error) == "function")
  			this._handler.error(error);
  		else
  			throw error;
  	}
  
  //TODO: make this a trully streamable handler
  function RssHandler (callback) {
  	RssHandler.super_.call(this, callback, { ignoreWhitespace: true, verbose: false, enforceEmptyTags: false });
  }
  inherits(RssHandler, DefaultHandler);
  
  	RssHandler.prototype.done = function RssHandler$done () {
  		var feed = { };
  		var feedRoot;
  
  		var found = DomUtils.getElementsByTagName(function (value) { return(value == "rss" || value == "feed"); }, this.dom, false);
  		if (found.length) {
  			feedRoot = found[0];
  		}
  		if (feedRoot) {
  			if (feedRoot.name == "rss") {
  				feed.type = "rss";
  				feedRoot = feedRoot.children[0]; //<channel/>
  				feed.id = "";
  				try {
  					feed.title = DomUtils.getElementsByTagName("title", feedRoot.children, false)[0].children[0].data;
  				} catch (ex) { }
  				try {
  					feed.link = DomUtils.getElementsByTagName("link", feedRoot.children, false)[0].children[0].data;
  				} catch (ex) { }
  				try {
  					feed.description = DomUtils.getElementsByTagName("description", feedRoot.children, false)[0].children[0].data;
  				} catch (ex) { }
  				try {
  					feed.updated = new Date(DomUtils.getElementsByTagName("lastBuildDate", feedRoot.children, false)[0].children[0].data);
  				} catch (ex) { }
  				try {
  					feed.author = DomUtils.getElementsByTagName("managingEditor", feedRoot.children, false)[0].children[0].data;
  				} catch (ex) { }
  				feed.items = [];
  				DomUtils.getElementsByTagName("item", feedRoot.children).forEach(function (item, index, list) {
  					var entry = {};
  					try {
  						entry.id = DomUtils.getElementsByTagName("guid", item.children, false)[0].children[0].data;
  					} catch (ex) { }
  					try {
  						entry.title = DomUtils.getElementsByTagName("title", item.children, false)[0].children[0].data;
  					} catch (ex) { }
  					try {
  						entry.link = DomUtils.getElementsByTagName("link", item.children, false)[0].children[0].data;
  					} catch (ex) { }
  					try {
  						entry.description = DomUtils.getElementsByTagName("description", item.children, false)[0].children[0].data;
  					} catch (ex) { }
  					try {
  						entry.pubDate = new Date(DomUtils.getElementsByTagName("pubDate", item.children, false)[0].children[0].data);
  					} catch (ex) { }
  					feed.items.push(entry);
  				});
  			} else {
  				feed.type = "atom";
  				try {
  					feed.id = DomUtils.getElementsByTagName("id", feedRoot.children, false)[0].children[0].data;
  				} catch (ex) { }
  				try {
  					feed.title = DomUtils.getElementsByTagName("title", feedRoot.children, false)[0].children[0].data;
  				} catch (ex) { }
  				try {
  					feed.link = DomUtils.getElementsByTagName("link", feedRoot.children, false)[0].attribs.href;
  				} catch (ex) { }
  				try {
  					feed.description = DomUtils.getElementsByTagName("subtitle", feedRoot.children, false)[0].children[0].data;
  				} catch (ex) { }
  				try {
  					feed.updated = new Date(DomUtils.getElementsByTagName("updated", feedRoot.children, false)[0].children[0].data);
  				} catch (ex) { }
  				try {
  					feed.author = DomUtils.getElementsByTagName("email", feedRoot.children, true)[0].children[0].data;
  				} catch (ex) { }
  				feed.items = [];
  				DomUtils.getElementsByTagName("entry", feedRoot.children).forEach(function (item, index, list) {
  					var entry = {};
  					try {
  						entry.id = DomUtils.getElementsByTagName("id", item.children, false)[0].children[0].data;
  					} catch (ex) { }
  					try {
  						entry.title = DomUtils.getElementsByTagName("title", item.children, false)[0].children[0].data;
  					} catch (ex) { }
  					try {
  						entry.link = DomUtils.getElementsByTagName("link", item.children, false)[0].attribs.href;
  					} catch (ex) { }
  					try {
  						entry.description = DomUtils.getElementsByTagName("summary", item.children, false)[0].children[0].data;
  					} catch (ex) { }
  					try {
  						entry.pubDate = new Date(DomUtils.getElementsByTagName("updated", item.children, false)[0].children[0].data);
  					} catch (ex) { }
  					feed.items.push(entry);
  				});
  			}
  
  			this.dom = feed;
  		}
  		RssHandler.super_.prototype.done.call(this);
  	}
  
  ///////////////////////////////////////////////////
  
  function DefaultHandler (callback, options) {
  	this.reset();
  	this._options = options ? options : { };
  	if (this._options.ignoreWhitespace == undefined)
  		this._options.ignoreWhitespace = false; //Keep whitespace-only text nodes
  	if (this._options.verbose == undefined)
  		this._options.verbose = true; //Keep data property for tags and raw property for all
  	if (this._options.enforceEmptyTags == undefined)
  		this._options.enforceEmptyTags = true; //Don't allow children for HTML tags defined as empty in spec
  	if ((typeof callback) == "function")
  		this._callback = callback;
  }
  
  	//**"Static"**//
  	//HTML Tags that shouldn't contain child nodes
  	DefaultHandler._emptyTags = {
  		  area: 1
  		, base: 1
  		, basefont: 1
  		, br: 1
  		, col: 1
  		, frame: 1
  		, hr: 1
  		, img: 1
  		, input: 1
  		, isindex: 1
  		, link: 1
  		, meta: 1
  		, param: 1
  		, embed: 1
  	}
  	//Regex to detect whitespace only text nodes
  	DefaultHandler.reWhitespace = /^\s*$/;
  
  	//**Public**//
  	//Properties//
  	DefaultHandler.prototype.dom = null; //The hierarchical object containing the parsed HTML
  	//Methods//
  	//Resets the handler back to starting state
  	DefaultHandler.prototype.reset = function DefaultHandler$reset() {
  		this.dom = [];
  		this._done = false;
  		this._tagStack = [];
  		this._tagStack.last = function DefaultHandler$_tagStack$last () {
  			return(this.length ? this[this.length - 1] : null);
  		}
  	}
  	//Signals the handler that parsing is done
  	DefaultHandler.prototype.done = function DefaultHandler$done () {
  		this._done = true;
  		this.handleCallback(null);
  	}
  	DefaultHandler.prototype.writeTag = function DefaultHandler$writeTag (element) {
  		this.handleElement(element);
  	} 
  	DefaultHandler.prototype.writeText = function DefaultHandler$writeText (element) {
  		if (this._options.ignoreWhitespace)
  			if (DefaultHandler.reWhitespace.test(element.data))
  				return;
  		this.handleElement(element);
  	} 
  	DefaultHandler.prototype.writeComment = function DefaultHandler$writeComment (element) {
  		this.handleElement(element);
  	} 
  	DefaultHandler.prototype.writeDirective = function DefaultHandler$writeDirective (element) {
  		this.handleElement(element);
  	}
  	DefaultHandler.prototype.error = function DefaultHandler$error (error) {
  		this.handleCallback(error);
  	}
  
  	//**Private**//
  	//Properties//
  	DefaultHandler.prototype._options = null; //Handler options for how to behave
  	DefaultHandler.prototype._callback = null; //Callback to respond to when parsing done
  	DefaultHandler.prototype._done = false; //Flag indicating whether handler has been notified of parsing completed
  	DefaultHandler.prototype._tagStack = null; //List of parents to the currently element being processed
  	//Methods//
  	DefaultHandler.prototype.handleCallback = function DefaultHandler$handleCallback (error) {
  			if ((typeof this._callback) != "function")
  				if (error)
  					throw error;
  				else
  					return;
  			this._callback(error, this.dom);
  	}
  	
  	DefaultHandler.prototype.isEmptyTag = function(element) {
  		var name = element.name.toLowerCase();
  		if (name.charAt(0) == '/') {
  			name = name.substring(1);
  		}
  		return this._options.enforceEmptyTags && !!DefaultHandler._emptyTags[name];
  	};
  	
  	DefaultHandler.prototype.handleElement = function DefaultHandler$handleElement (element) {
  		if (this._done)
  			this.handleCallback(new Error("Writing to the handler after done() called is not allowed without a reset()"));
  		if (!this._options.verbose) {
  //			element.raw = null; //FIXME: Not clean
  			//FIXME: Serious performance problem using delete
  			delete element.raw;
  			if (element.type == "tag" || element.type == "script" || element.type == "style")
  				delete element.data;
  		}
  		if (!this._tagStack.last()) { //There are no parent elements
  			//If the element can be a container, add it to the tag stack and the top level list
  			if (element.type != ElementType.Text && element.type != ElementType.Comment && element.type != ElementType.Directive) {
  				if (element.name.charAt(0) != "/") { //Ignore closing tags that obviously don't have an opening tag
  					this.dom.push(element);
  					if (!this.isEmptyTag(element)) { //Don't add tags to the tag stack that can't have children
  						this._tagStack.push(element);
  					}
  				}
  			}
  			else //Otherwise just add to the top level list
  				this.dom.push(element);
  		}
  		else { //There are parent elements
  			//If the element can be a container, add it as a child of the element
  			//on top of the tag stack and then add it to the tag stack
  			if (element.type != ElementType.Text && element.type != ElementType.Comment && element.type != ElementType.Directive) {
  				if (element.name.charAt(0) == "/") {
  					//This is a closing tag, scan the tagStack to find the matching opening tag
  					//and pop the stack up to the opening tag's parent
  					var baseName = element.name.substring(1);
  					if (!this.isEmptyTag(element)) {
  						var pos = this._tagStack.length - 1;
  						while (pos > -1 && this._tagStack[pos--].name != baseName) { }
  						if (pos > -1 || this._tagStack[0].name == baseName)
  							while (pos < this._tagStack.length - 1)
  								this._tagStack.pop();
  					}
  				}
  				else { //This is not a closing tag
  					if (!this._tagStack.last().children)
  						this._tagStack.last().children = [];
  					this._tagStack.last().children.push(element);
  					if (!this.isEmptyTag(element)) //Don't add tags to the tag stack that can't have children
  						this._tagStack.push(element);
  				}
  			}
  			else { //This is not a container element
  				if (!this._tagStack.last().children)
  					this._tagStack.last().children = [];
  				this._tagStack.last().children.push(element);
  			}
  		}
  	}
  
  	var DomUtils = {
  		  testElement: function DomUtils$testElement (options, element) {
  			if (!element) {
  				return false;
  			}
  	
  			for (var key in options) {
  				if (key == "tag_name") {
  					if (element.type != "tag" && element.type != "script" && element.type != "style") {
  						return false;
  					}
  					if (!options["tag_name"](element.name)) {
  						return false;
  					}
  				} else if (key == "tag_type") {
  					if (!options["tag_type"](element.type)) {
  						return false;
  					}
  				} else if (key == "tag_contains") {
  					if (element.type != "text" && element.type != "comment" && element.type != "directive") {
  						return false;
  					}
  					if (!options["tag_contains"](element.data)) {
  						return false;
  					}
  				} else {
  					if (!element.attribs || !options[key](element.attribs[key])) {
  						return false;
  					}
  				}
  			}
  		
  			return true;
  		}
  	
  		, getElements: function DomUtils$getElements (options, currentElement, recurse, limit) {
  			recurse = (recurse === undefined || recurse === null) || !!recurse;
  			limit = isNaN(parseInt(limit)) ? -1 : parseInt(limit);
  
  			if (!currentElement) {
  				return([]);
  			}
  	
  			var found = [];
  			var elementList;
  
  			function getTest (checkVal) {
  				return(function (value) { return(value == checkVal); });
  			}
  			for (var key in options) {
  				if ((typeof options[key]) != "function") {
  					options[key] = getTest(options[key]);
  				}
  			}
  	
  			if (DomUtils.testElement(options, currentElement)) {
  				found.push(currentElement);
  			}
  
  			if (limit >= 0 && found.length >= limit) {
  				return(found);
  			}
  
  			if (recurse && currentElement.children) {
  				elementList = currentElement.children;
  			} else if (currentElement instanceof Array) {
  				elementList = currentElement;
  			} else {
  				return(found);
  			}
  	
  			for (var i = 0; i < elementList.length; i++) {
  				found = found.concat(DomUtils.getElements(options, elementList[i], recurse, limit));
  				if (limit >= 0 && found.length >= limit) {
  					break;
  				}
  			}
  	
  			return(found);
  		}
  		
  		, getElementById: function DomUtils$getElementById (id, currentElement, recurse) {
  			var result = DomUtils.getElements({ id: id }, currentElement, recurse, 1);
  			return(result.length ? result[0] : null);
  		}
  		
  		, getElementsByTagName: function DomUtils$getElementsByTagName (name, currentElement, recurse, limit) {
  			return(DomUtils.getElements({ tag_name: name }, currentElement, recurse, limit));
  		}
  		
  		, getElementsByTagType: function DomUtils$getElementsByTagType (type, currentElement, recurse, limit) {
  			return(DomUtils.getElements({ tag_type: type }, currentElement, recurse, limit));
  		}
  	}
  
  	function inherits (ctor, superCtor) {
  		var tempCtor = function(){};
  		tempCtor.prototype = superCtor.prototype;
  		ctor.super_ = superCtor;
  		ctor.prototype = new tempCtor();
  		ctor.prototype.constructor = ctor;
  	}
  
  exports.Parser = Parser;
  
  exports.DefaultHandler = DefaultHandler;
  
  exports.RssHandler = RssHandler;
  
  exports.ElementType = ElementType;
  
  exports.DomUtils = DomUtils;
  
  })();
  

  provide("htmlparser", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  (function () {
    "use strict";
  
    var fs = require('fs')
      , location
      , defaultLocation
      ;
  
    defaultLocation = {
      "origin": "http://localhost:3000",
      "pathname": "/",
      "host": "localhost:3000",
      "hostname": "localhost",
      "port": "3000",
      "search": "",
      "hash": "#home",
      "href": "http://localhost:3000/#home",
      "protocol": "http:"
    };
  
    try {
      location = fs.readFileSync('./location.config.js');
    } catch(e) {
      location = defaultLocation;
    }
  
    module.exports = location;
  }());
  

  provide("location", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  (function () {
    "use strict";
  
    var machine = "Macintosh"
      , arch = "Intel Mac OS X 10_6_7"
      , engine = "AppleWebKit/534.36 (KHTML, like Gecko) NodeJS/v0.4.7 Chrome/13.0.767.0 Safari/534.36";
  
    module.exports = {
        appCodeName: "Mozilla"
      , appName: "Netscape"
      , appVersion: "5.0 (" + machine + "; " + arch + ") " + engine
      , cookieEnabled: true
      , geolocation: undefined
        /*
          clearWatch
          getCurrentPosition
          watchPosition
        */
      , mimeTypes: []
        /*
        */
      , onLine: true
      , platform: "MacIntel"
      , plugins: []
        /*
        */
      , product: "Gecko"
      , productSub: "20030107"
      , userAgent: "Mozilla/5.0 (" + machine + "; " + arch + ") " + engine
      , vendor: "Joyent"
      , vendorSub: ""
    }
  }());
  

  provide("navigator", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  /**
   * Wrapper for built-in http.js to emulate the browser XMLHttpRequest object.
   *
   * This can be used with JS designed for browsers to improve reuse of code and
   * allow the use of existing libraries.
   *
   * Usage: include("XMLHttpRequest.js") and use XMLHttpRequest per W3C specs.
   *
   * @author Dan DeFelippi <dan@driverdan.com>
   * @contributor David Ellis <d.f.ellis@ieee.org>
   * @license MIT
   */
  
  var Url = require("url")
    , spawn = require("child_process").spawn
    , fs = require('fs');
  
  exports.XMLHttpRequest = function() {
    /**
     * Private variables
     */
    var self = this;
    var http = require('http');
    var https = require('https');
  
    // Holds http.js objects
    var client;
    var request;
    var response;
  
    // Request settings
    var settings = {};
  
    // Set some default headers
    var defaultHeaders = {
      "User-Agent": "node-XMLHttpRequest",
      "Accept": "*/*",
    };
  
    var headers = defaultHeaders;
  
    // These headers are not user setable.
    // The following are allowed but banned in the spec:
    // * user-agent
    var forbiddenRequestHeaders = [
      "accept-charset",
      "accept-encoding",
      "access-control-request-headers",
      "access-control-request-method",
      "connection",
      "content-length",
      "content-transfer-encoding",
      "cookie",
      "cookie2",
      "date",
      "expect",
      "host",
      "keep-alive",
      "origin",
      "referer",
      "te",
      "trailer",
      "transfer-encoding",
      "upgrade",
      "via"
    ];
  
    // These request methods are not allowed
    var forbiddenRequestMethods = [
      "TRACE",
      "TRACK",
      "CONNECT"
    ];
  
    // Send flag
    var sendFlag = false;
    // Error flag, used when errors occur or abort is called
    var errorFlag = false;
  
    // Event listeners
    var listeners = {};
  
    /**
     * Constants
     */
  
    this.UNSENT = 0;
    this.OPENED = 1;
    this.HEADERS_RECEIVED = 2;
    this.LOADING = 3;
    this.DONE = 4;
  
    /**
     * Public vars
     */
  
    // Current state
    this.readyState = this.UNSENT;
  
    // default ready state change handler in case one is not set or is set late
    this.onreadystatechange = null;
  
    // Result & response
    this.responseText = "";
    this.responseXML = "";
    this.status = null;
    this.statusText = null;
  
    /**
     * Private methods
     */
  
    /**
     * Check if the specified header is allowed.
     *
     * @param string header Header to validate
     * @return boolean False if not allowed, otherwise true
     */
    var isAllowedHttpHeader = function(header) {
      return (header && forbiddenRequestHeaders.indexOf(header.toLowerCase()) === -1);
    };
  
    /**
     * Check if the specified method is allowed.
     *
     * @param string method Request method to validate
     * @return boolean False if not allowed, otherwise true
     */
    var isAllowedHttpMethod = function(method) {
      return (method && forbiddenRequestMethods.indexOf(method) === -1);
    };
  
    /**
     * Public methods
     */
  
    /**
     * Open the connection. Currently supports local server requests.
     *
     * @param string method Connection method (eg GET, POST)
     * @param string url URL for the connection.
     * @param boolean async Asynchronous connection. Default is true.
     * @param string user Username for basic authentication (optional)
     * @param string password Password for basic authentication (optional)
     */
    this.open = function(method, url, async, user, password) {
      this.abort();
      errorFlag = false;
  
      // Check for valid request method
      if (!isAllowedHttpMethod(method)) {
        throw "SecurityError: Request method not allowed";
        return;
      }
  
      settings = {
        "method": method,
        "url": url.toString(),
        "async": (typeof async !== "boolean" ? true : async),
        "user": user || null,
        "password": password || null
      };
  
      setState(this.OPENED);
    };
  
    /**
     * Sets a header for the request.
     *
     * @param string header Header name
     * @param string value Header value
     */
    this.setRequestHeader = function(header, value) {
      if (this.readyState != this.OPENED) {
        throw "INVALID_STATE_ERR: setRequestHeader can only be called when state is OPEN";
      }
      if (!isAllowedHttpHeader(header)) {
        console.warn('Refused to set unsafe header "' + header + '"');
        return;
      }
      if (sendFlag) {
        throw "INVALID_STATE_ERR: send flag is true";
      }
      headers[header] = value;
    };
  
    /**
     * Gets a header from the server response.
     *
     * @param string header Name of header to get.
     * @return string Text of the header or null if it doesn't exist.
     */
    this.getResponseHeader = function(header) {
      if (typeof header === "string"
        && this.readyState > this.OPENED
        && response.headers[header.toLowerCase()]
        && !errorFlag
      ) {
        return response.headers[header.toLowerCase()];
      }
  
      return null;
    };
  
    /**
     * Gets all the response headers.
     *
     * @return string A string with all response headers separated by CR+LF
     */
    this.getAllResponseHeaders = function() {
      if (this.readyState < this.HEADERS_RECEIVED || errorFlag) {
        return "";
      }
      var result = "";
  
      for (var i in response.headers) {
        // Cookie headers are excluded
        if (i !== "set-cookie" && i !== "set-cookie2") {
          result += i + ": " + response.headers[i] + "\r\n";
        }
      }
      return result.substr(0, result.length - 2);
    };
  
    /**
     * Gets a request header
     *
     * @param string name Name of header to get
     * @return string Returns the request header or empty string if not set
     */
    this.getRequestHeader = function(name) {
      // @TODO Make this case insensitive
      if (typeof name === "string" && headers[name]) {
        return headers[name];
      }
  
      return "";
    }
  
    /**
     * Sends the request to the server.
     *
     * @param string data Optional data to send as request body.
     */
    this.send = function(data) {
      if (this.readyState != this.OPENED) {
        throw "INVALID_STATE_ERR: connection must be opened before send() is called";
      }
  
      if (sendFlag) {
        throw "INVALID_STATE_ERR: send has already been called";
      }
  
      var ssl = false, local = false;
      var url = Url.parse(settings.url);
  
      // Determine the server
      switch (url.protocol) {
        case 'https:':
          ssl = true;
          // SSL & non-SSL both need host, no break here.
        case 'http:':
          var host = url.hostname;
          break;
  
        case 'file:':
          local = true;
          break;
  
        case undefined:
        case '':
          var host = "localhost";
          break;
  
        default:
          throw "Protocol not supported.";
      }
  
      // Load files off the local filesystem (file://)
      if (local) {
        if (settings.method !== "GET") {
          throw "XMLHttpRequest: Only GET method is supported";
        }
  
        if (settings.async) {
          fs.readFile(url.pathname, 'utf8', function(error, data) {
            if (error) {
              self.handleError(error);
            } else {
              self.status = 200;
              self.responseText = data;
              setState(self.DONE);
            }
          });
        } else {
          try {
            this.responseText = fs.readFileSync(url.pathname, 'utf8');
            this.status = 200;
            setState(self.DONE);
          } catch(e) {
            this.handleError(e);
          }
        }
  
        return;
      }
  
      // Default to port 80. If accessing localhost on another port be sure
      // to use http://localhost:port/path
      var port = url.port || (ssl ? 443 : 80);
      // Add query string if one is used
      var uri = url.pathname + (url.search ? url.search : '');
  
      // Set the Host header or the server may reject the request
      headers["Host"] = host;
      if (!((ssl && port === 443) || port === 80)) {
        headers["Host"] += ':' + url.port;
      }
  
      // Set Basic Auth if necessary
      if (settings.user) {
        if (typeof settings.password == "undefined") {
          settings.password = "";
        }
        var authBuf = new Buffer(settings.user + ":" + settings.password);
        headers["Authorization"] = "Basic " + authBuf.toString("base64");
      }
  
      // Set content length header
      if (settings.method === "GET" || settings.method === "HEAD") {
        data = null;
      } else if (data) {
        headers["Content-Length"] = Buffer.byteLength(data);
  
        if (!headers["Content-Type"]) {
          headers["Content-Type"] = "text/plain;charset=UTF-8";
        }
      } else if (settings.method === "POST") {
        // For a post with no data set Content-Length: 0.
        // This is required by buggy servers that don't meet the specs.
        headers["Content-Length"] = 0;
      }
  
      var options = {
        host: host,
        port: port,
        path: uri,
        method: settings.method,
        headers: headers
      };
  
      // Reset error flag
      errorFlag = false;
  
      // Handle async requests
      if (settings.async) {
        // Use the proper protocol
        var doRequest = ssl ? https.request : http.request;
  
        // Request is being sent, set send flag
        sendFlag = true;
  
        // As per spec, this is called here for historical reasons.
        self.dispatchEvent("readystatechange");
  
        // Create the request
        request = doRequest(options, function(resp) {
          response = resp;
          response.setEncoding("utf8");
  
          setState(self.HEADERS_RECEIVED);
          self.status = response.statusCode;
  
          response.on('data', function(chunk) {
            // Make sure there's some data
            if (chunk) {
              self.responseText += chunk;
            }
            // Don't emit state changes if the connection has been aborted.
            if (sendFlag) {
              setState(self.LOADING);
            }
          });
  
          response.on('end', function() {
            if (sendFlag) {
              // Discard the 'end' event if the connection has been aborted
              setState(self.DONE);
              sendFlag = false;
            }
          });
  
          response.on('error', function(error) {
            self.handleError(error);
          });
        }).on('error', function(error) {
          self.handleError(error);
        });
  
        // Node 0.4 and later won't accept empty data. Make sure it's needed.
        if (data) {
          request.write(data);
        }
  
        request.end();
  
        self.dispatchEvent("loadstart");
      } else { // Synchronous
        // Create a temporary file for communication with the other Node process
        var syncFile = ".node-xmlhttprequest-sync-" + process.pid;
        fs.writeFileSync(syncFile, "", "utf8");
        // The async request the other Node process executes
        var execString = "var http = require('http'), https = require('https'), fs = require('fs');"
          + "var doRequest = http" + (ssl ? "s" : "") + ".request;"
          + "var options = " + JSON.stringify(options) + ";"
          + "var responseText = '';"
          + "var req = doRequest(options, function(response) {"
          + "response.setEncoding('utf8');"
          + "response.on('data', function(chunk) {"
          + "responseText += chunk;"
          + "});"
          + "response.on('end', function() {"
          + "fs.writeFileSync('" + syncFile + "', 'NODE-XMLHTTPREQUEST-STATUS:' + response.statusCode + ',' + responseText, 'utf8');"
          + "});"
          + "response.on('error', function(error) {"
          + "fs.writeFileSync('" + syncFile + "', 'NODE-XMLHTTPREQUEST-ERROR:' + JSON.stringify(error), 'utf8');"
          + "});"
          + "}).on('error', function(error) {"
          + "fs.writeFileSync('" + syncFile + "', 'NODE-XMLHTTPREQUEST-ERROR:' + JSON.stringify(error), 'utf8');"
          + "});"
          + (data ? "req.write('" + data.replace(/'/g, "\\'") + "');":"")
          + "req.end();";
        // Start the other Node Process, executing this string
        syncProc = spawn(process.argv[0], ["-e", execString]);
        while((self.responseText = fs.readFileSync(syncFile, 'utf8')) == "") {
          // Wait while the file is empty
        }
        // Kill the child process once the file has data
        syncProc.stdin.end();
        // Remove the temporary file
        fs.unlinkSync(syncFile);
        if (self.responseText.match(/^NODE-XMLHTTPREQUEST-ERROR:/)) {
          // If the file returned an error, handle it
          var errorObj = self.responseText.replace(/^NODE-XMLHTTPREQUEST-ERROR:/, "");
          self.handleError(errorObj);
        } else {
          // If the file returned okay, parse its data and move to the DONE state
          self.status = self.responseText.replace(/^NODE-XMLHTTPREQUEST-STATUS:([0-9]*),.*/, "$1");
          self.responseText = self.responseText.replace(/^NODE-XMLHTTPREQUEST-STATUS:[0-9]*,(.*)/, "$1");
          setState(self.DONE);
        }
      }
    };
  
    /**
     * Called when an error is encountered to deal with it.
     */
    this.handleError = function(error) {
      this.status = 503;
      this.statusText = error;
      this.responseText = error.stack;
      errorFlag = true;
      setState(this.DONE);
    };
  
    /**
     * Aborts a request.
     */
    this.abort = function() {
      if (request) {
        request.abort();
        request = null;
      }
  
      headers = defaultHeaders;
      this.responseText = "";
      this.responseXML = "";
  
      errorFlag = true;
  
      if (this.readyState !== this.UNSENT
          && (this.readyState !== this.OPENED || sendFlag)
          && this.readyState !== this.DONE) {
        sendFlag = false;
        setState(this.DONE);
      }
      this.readyState = this.UNSENT;
    };
  
    /**
     * Adds an event listener. Preferred method of binding to events.
     */
    this.addEventListener = function(event, callback) {
      if (!(event in listeners)) {
        listeners[event] = [];
      }
      // Currently allows duplicate callbacks. Should it?
      listeners[event].push(callback);
    };
  
    /**
     * Remove an event callback that has already been bound.
     * Only works on the matching funciton, cannot be a copy.
     */
    this.removeEventListener = function(event, callback) {
      if (event in listeners) {
        // Filter will return a new array with the callback removed
        listeners[event] = listeners[event].filter(function(ev) {
          return ev !== callback;
        });
      }
    };
  
    /**
     * Dispatch any events, including both "on" methods and events attached using addEventListener.
     */
    this.dispatchEvent = function(event) {
      if (typeof self["on" + event] === "function") {
        self["on" + event]();
      }
      if (event in listeners) {
        for (var i = 0, len = listeners[event].length; i < len; i++) {
          listeners[event][i].call(self);
        }
      }
    };
  
    /**
     * Changes readyState and calls onreadystatechange.
     *
     * @param int state New state
     */
    var setState = function(state) {
      if (self.readyState !== state) {
        self.readyState = state;
  
        if (settings.async || self.readyState < self.OPENED || self.readyState === self.DONE) {
          self.dispatchEvent("readystatechange");
        }
  
        if (self.readyState === self.DONE && !errorFlag) {
          self.dispatchEvent("load");
          // @TODO figure out InspectorInstrumentation::didLoadXHR(cookie)
          self.dispatchEvent("loadend");
        }
      }
    };
  };
  

  provide("xmlhttprequest", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  
  /**
   * Module dependencies.
   */
  
  var fs = require('fs')
    , path = require('path')
    , join = path.join
    , dirname = path.dirname
    , exists = fs.existsSync || path.existsSync
    , defaults = {
          arrow: process.env.NODE_BINDINGS_ARROW || ' → '
        , compiled: process.env.NODE_BINDINGS_COMPILED_DIR || 'compiled'
        , platform: process.platform
        , arch: process.arch
        , version: process.versions.node
        , bindings: 'bindings.node'
        , try: [
            // node-gyp's linked version in the "build" dir
            [ 'module_root', 'build', 'bindings' ]
            // node-waf and gyp_addon (a.k.a node-gyp)
          , [ 'module_root', 'build', 'Debug', 'bindings' ]
          , [ 'module_root', 'build', 'Release', 'bindings' ]
            // Debug files, for development (legacy behavior, remove for node v0.9)
          , [ 'module_root', 'out', 'Debug', 'bindings' ]
          , [ 'module_root', 'Debug', 'bindings' ]
            // Release files, but manually compiled (legacy behavior, remove for node v0.9)
          , [ 'module_root', 'out', 'Release', 'bindings' ]
          , [ 'module_root', 'Release', 'bindings' ]
            // Legacy from node-waf, node <= 0.4.x
          , [ 'module_root', 'build', 'default', 'bindings' ]
            // Production "Release" buildtype binary (meh...)
          , [ 'module_root', 'compiled', 'version', 'platform', 'arch', 'bindings' ]
          ]
      }
  
  /**
   * The main `bindings()` function loads the compiled bindings for a given module.
   * It uses V8's Error API to determine the parent filename that this function is
   * being invoked from, which is then used to find the root directory.
   */
  
  function bindings (opts) {
  
    // Argument surgery
    if (typeof opts == 'string') {
      opts = { bindings: opts }
    } else if (!opts) {
      opts = {}
    }
    opts.__proto__ = defaults
  
    // Get the module root
    if (!opts.module_root) {
      opts.module_root = exports.getRoot(exports.getFileName())
    }
  
    // Ensure the given bindings name ends with .node
    if (path.extname(opts.bindings) != '.node') {
      opts.bindings += '.node'
    }
  
    var tries = []
      , i = 0
      , l = opts.try.length
      , n
  
    for (; i<l; i++) {
      n = join.apply(null, opts.try[i].map(function (p) {
        return opts[p] || p
      }))
      tries.push(n)
      try {
        var b = require(n)
        b.path = n
        return b
      } catch (e) {
        if (!/not find/i.test(e.message)) {
          throw e
        }
      }
    }
  
    var err = new Error('Could not load the bindings file. Tried:\n'
      + tries.map(function (a) { return opts.arrow + a }).join('\n'))
    err.tries = tries
    throw err
  }
  module.exports = exports = bindings
  
  
  /**
   * Gets the filename of the JavaScript file that invokes this function.
   * Used to help find the root directory of a module.
   */
  
  exports.getFileName = function getFileName () {
    var origPST = Error.prepareStackTrace
      , dummy = {}
      , fileName
  
    Error.prepareStackTrace = function (e, st) {
      for (var i=0, l=st.length; i<l; i++) {
        fileName = st[i].getFileName()
        if (fileName !== __filename) {
          return
        }
      }
    }
  
    // run the 'prepareStackTrace' function above
    Error.captureStackTrace(dummy)
    dummy.stack
  
    // cleanup
    Error.prepareStackTrace = origPST
  
    return fileName
  }
  
  /**
   * Gets the root directory of a module, given an arbitrary filename
   * somewhere in the module tree. The "root directory" is the directory
   * containing the `package.json` file.
   *
   *   In:  /home/nate/node-native-module/lib/index.js
   *   Out: /home/nate/node-native-module
   */
  
  exports.getRoot = function getRoot (file) {
    var dir = dirname(file)
      , prev
    while (true) {
      if (dir === '.') {
        // Avoids an infinite loop in rare cases, like the REPL
        dir = process.cwd()
      }
      if (exists(join(dir, 'package.json')) || exists(join(dir, 'node_modules'))) {
        // Found the 'package.json' file or 'node_modules' dir; we're done
        return dir
      }
      if (prev === dir) {
        // Got to the top
        throw new Error('Could not find module root given file: "' + file
                      + '". Do you have a `package.json` file? ')
      }
      // Try the parent dir next
      prev = dir
      dir = join(dir, '..')
    }
  }
  

  provide("bindings", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  var ContextifyContext = require('bindings')('contextify').ContextifyContext;
  
  module.exports = function Contextify (sandbox) {
      if (typeof sandbox != 'object') {
          sandbox = {};
      }
      var ctx = new ContextifyContext(sandbox);
  
      sandbox.run = function () {
          return ctx.run.apply(ctx, arguments);
      };
  
      sandbox.getGlobal = function () {
          return ctx.getGlobal();
      }
  
      sandbox.dispose = function () {
          sandbox.run = function () {
              throw new Error("Called run() after dispose().");
          };
          sandbox.getGlobal = function () {
              throw new Error("Called getGlobal() after dispose().");
          };
          sandbox.dispose = function () {
              throw new Error("Called dispose() after dispose().");
          };
          ctx = null;
      }
      return sandbox;
  }
  

  provide("contextify", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  'use strict';
  
  exports.CSSStyleDeclaration = require('./CSSStyleDeclaration').CSSStyleDeclaration;
  exports.CSSRule = require('./CSSRule').CSSRule;
  exports.CSSStyleRule = require('./CSSStyleRule').CSSStyleRule;
  exports.MediaList = require('./MediaList').MediaList;
  exports.CSSMediaRule = require('./CSSMediaRule').CSSMediaRule;
  exports.CSSImportRule = require('./CSSImportRule').CSSImportRule;
  exports.CSSFontFaceRule = require('./CSSFontFaceRule').CSSFontFaceRule;
  exports.StyleSheet = require('./StyleSheet').StyleSheet;
  exports.CSSStyleSheet = require('./CSSStyleSheet').CSSStyleSheet;
  exports.CSSKeyframesRule = require('./CSSKeyframesRule').CSSKeyframesRule;
  exports.CSSKeyframeRule = require('./CSSKeyframeRule').CSSKeyframeRule;
  exports.parse = require('./parse').parse;
  exports.clone = require('./clone').clone;
  

  provide("cssom", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  var path = require('path');
  var fs = require('fs');
  
  function Mime() {
    // Map of extension -> mime type
    this.types = Object.create(null);
  
    // Map of mime type -> extension
    this.extensions = Object.create(null);
  }
  
  /**
   * Define mimetype -> extension mappings.  Each key is a mime-type that maps
   * to an array of extensions associated with the type.  The first extension is
   * used as the default extension for the type.
   *
   * e.g. mime.define({'audio/ogg', ['oga', 'ogg', 'spx']});
   *
   * @param map (Object) type definitions
   */
  Mime.prototype.define = function (map) {
    for (var type in map) {
      var exts = map[type];
  
      for (var i = 0; i < exts.length; i++) {
        this.types[exts[i]] = type;
      }
  
      // Default extension is the first one we encounter
      if (!this.extensions[type]) {
        this.extensions[type] = exts[0];
      }
    }
  };
  
  /**
   * Load an Apache2-style ".types" file
   *
   * This may be called multiple times (it's expected).  Where files declare
   * overlapping types/extensions, the last file wins.
   *
   * @param file (String) path of file to load.
   */
  Mime.prototype.load = function(file) {
    // Read file and split into lines
    var map = {},
        content = fs.readFileSync(file, 'ascii'),
        lines = content.split(/[\r\n]+/);
  
    lines.forEach(function(line) {
      // Clean up whitespace/comments, and split into fields
      var fields = line.replace(/\s*#.*|^\s*|\s*$/g, '').split(/\s+/);
      map[fields.shift()] = fields;
    });
  
    this.define(map);
  };
  
  /**
   * Lookup a mime type based on extension
   */
  Mime.prototype.lookup = function(path, fallback) {
    var ext = path.replace(/.*[\.\/]/, '').toLowerCase();
  
    return this.types[ext] || fallback || this.default_type;
  };
  
  /**
   * Return file extension associated with a mime type
   */
  Mime.prototype.extension = function(mimeType) {
    return this.extensions[mimeType];
  };
  
  // Default instance
  var mime = new Mime();
  
  // Load local copy of
  // http://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types
  mime.load(path.join(__dirname, 'types/mime.types'));
  
  // Load additional types from node.js community
  mime.load(path.join(__dirname, 'types/node.types'));
  
  // Default type
  mime.default_type = mime.lookup('bin');
  
  //
  // Additional API specific to the default instance
  //
  
  mime.Mime = Mime;
  
  /**
   * Lookup a charset based on mime type.
   */
  mime.charsets = {
    lookup: function(mimeType, fallback) {
      // Assume text types are utf8
      return (/^text\//).test(mimeType) ? 'UTF-8' : fallback;
    }
  }
  
  module.exports = mime;
  

  provide("mime", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  // This file is just added for convenience so this repository can be
  // directly checked out into a project's deps folder
  module.exports = require('./lib/async');
  

  provide("async", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  var Stream = require('stream').Stream;
  var util = require('util');
  
  module.exports = DelayedStream;
  function DelayedStream() {
    this.source = null;
    this.dataSize = 0;
    this.maxDataSize = 1024 * 1024;
    this.pauseStream = true;
  
    this._maxDataSizeExceeded = false;
    this._released = false;
    this._bufferedEvents = [];
  }
  util.inherits(DelayedStream, Stream);
  
  DelayedStream.create = function(source, options) {
    var delayedStream = new this();
  
    options = options || {};
    for (var option in options) {
      delayedStream[option] = options[option];
    }
  
    delayedStream.source = source;
  
    var realEmit = source.emit;
    source.emit = function() {
      delayedStream._handleEmit(arguments);
      return realEmit.apply(source, arguments);
    };
  
    source.on('error', function() {});
    if (delayedStream.pauseStream) {
      source.pause();
    }
  
    return delayedStream;
  };
  
  DelayedStream.prototype.__defineGetter__('readable', function() {
    return this.source.readable;
  });
  
  DelayedStream.prototype.resume = function() {
    if (!this._released) {
      this.release();
    }
  
    this.source.resume();
  };
  
  DelayedStream.prototype.pause = function() {
    this.source.pause();
  };
  
  DelayedStream.prototype.release = function() {
    this._released = true;
  
    this._bufferedEvents.forEach(function(args) {
      this.emit.apply(this, args);
    }.bind(this));
    this._bufferedEvents = [];
  };
  
  DelayedStream.prototype.pipe = function() {
    var r = Stream.prototype.pipe.apply(this, arguments);
    this.resume();
    return r;
  };
  
  DelayedStream.prototype._handleEmit = function(args) {
    if (this._released) {
      this.emit.apply(this, args);
      return;
    }
  
    if (args[0] === 'data') {
      this.dataSize += args[1].length;
      this._checkIfMaxDataSizeExceeded();
    }
  
    this._bufferedEvents.push(args);
  };
  
  DelayedStream.prototype._checkIfMaxDataSizeExceeded = function() {
    if (this._maxDataSizeExceeded) {
      return;
    }
  
    if (this.dataSize <= this.maxDataSize) {
      return;
    }
  
    this._maxDataSizeExceeded = true;
    var message =
      'DelayedStream#maxDataSize of ' + this.maxDataSize + ' bytes exceeded.'
    this.emit('error', new Error(message));
  };
  

  provide("delayed-stream", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  var util = require('util');
  var Stream = require('stream').Stream;
  var DelayedStream = require('delayed-stream');
  
  module.exports = CombinedStream;
  function CombinedStream() {
    this.writable = false;
    this.readable = true;
    this.dataSize = 0;
    this.maxDataSize = 2 * 1024 * 1024;
    this.pauseStreams = true;
  
    this._released = false;
    this._streams = [];
    this._currentStream = null;
  }
  util.inherits(CombinedStream, Stream);
  
  CombinedStream.create = function(options) {
    var combinedStream = new this();
  
    options = options || {};
    for (var option in options) {
      combinedStream[option] = options[option];
    }
  
    return combinedStream;
  };
  
  CombinedStream.isStreamLike = function(stream) {
    return (typeof stream !== 'function')
      && (typeof stream !== 'string')
      && (!Buffer.isBuffer(stream));
  };
  
  CombinedStream.prototype.append = function(stream) {
    var isStreamLike = CombinedStream.isStreamLike(stream);
  
    if (isStreamLike) {
      if (!(stream instanceof DelayedStream)) {
        stream.on('data', this._checkDataSize.bind(this));
  
        stream = DelayedStream.create(stream, {
          maxDataSize: Infinity,
          pauseStream: this.pauseStreams,
        });
      }
  
      this._handleErrors(stream);
  
      if (this.pauseStreams) {
        stream.pause();
      }
    }
  
    this._streams.push(stream);
    return this;
  };
  
  CombinedStream.prototype.pipe = function(dest, options) {
    Stream.prototype.pipe.call(this, dest, options);
    this.resume();
  };
  
  CombinedStream.prototype._getNext = function() {
    this._currentStream = null;
    var stream = this._streams.shift();
  
  
    if (!stream) {
      this.end();
      return;
    }
  
    if (typeof stream !== 'function') {
      this._pipeNext(stream);
      return;
    }
  
    var getStream = stream;
    getStream(function(stream) {
      var isStreamLike = CombinedStream.isStreamLike(stream);
      if (isStreamLike) {
        stream.on('data', this._checkDataSize.bind(this));
        this._handleErrors(stream);
      }
  
      this._pipeNext(stream);
    }.bind(this));
  };
  
  CombinedStream.prototype._pipeNext = function(stream) {
    this._currentStream = stream;
  
    var isStreamLike = CombinedStream.isStreamLike(stream);
    if (isStreamLike) {
      stream.on('end', this._getNext.bind(this))
      stream.pipe(this, {end: false});
      return;
    }
  
    var value = stream;
    this.write(value);
    this._getNext();
  };
  
  CombinedStream.prototype._handleErrors = function(stream) {
    var self = this;
    stream.on('error', function(err) {
      self._emitError(err);
    });
  };
  
  CombinedStream.prototype.write = function(data) {
    this.emit('data', data);
  };
  
  CombinedStream.prototype.pause = function() {
    if (!this.pauseStreams) {
      return;
    }
  
    this.emit('pause');
  };
  
  CombinedStream.prototype.resume = function() {
    if (!this._released) {
      this._released = true;
      this.writable = true;
      this._getNext();
    }
  
    this.emit('resume');
  };
  
  CombinedStream.prototype.end = function() {
    this._reset();
    this.emit('end');
  };
  
  CombinedStream.prototype.destroy = function() {
    this._reset();
    this.emit('close');
  };
  
  CombinedStream.prototype._reset = function() {
    this.writable = false;
    this._streams = [];
    this._currentStream = null;
  };
  
  CombinedStream.prototype._checkDataSize = function() {
    this._updateDataSize();
    if (this.dataSize <= this.maxDataSize) {
      return;
    }
  
    var message =
      'DelayedStream#maxDataSize of ' + this.maxDataSize + ' bytes exceeded.'
    this._emitError(new Error(message));
  };
  
  CombinedStream.prototype._updateDataSize = function() {
    this.dataSize = 0;
  
    var self = this;
    this._streams.forEach(function(stream) {
      if (!stream.dataSize) {
        return;
      }
  
      self.dataSize += stream.dataSize;
    });
  
    if (this._currentStream && this._currentStream.dataSize) {
      this.dataSize += this._currentStream.dataSize;
    }
  };
  
  CombinedStream.prototype._emitError = function(err) {
    this._reset();
    this.emit('error', err);
  };
  

  provide("combined-stream", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  var CombinedStream = require('combined-stream');
  var util = require('util');
  var path = require('path');
  var http = require('http');
  var https = require('https');
  var parseUrl = require('url').parse;
  var fs = require('fs');
  var mime = require('mime');
  var async = require('async');
  
  module.exports = FormData;
  function FormData() {
    this._overheadLength = 0;
    this._valueLength = 0;
    this._lengthRetrievers = [];
  
    CombinedStream.call(this);
  }
  util.inherits(FormData, CombinedStream);
  
  FormData.LINE_BREAK = '\r\n';
  
  FormData.prototype.append = function(field, value) {
    var append = CombinedStream.prototype.append.bind(this);
  
    // all that streamy business can't handle numbers
    if (typeof value == 'number') value = ''+value;
  
    var header = this._multiPartHeader(field, value);
    var footer = this._multiPartFooter(field, value);
  
    append(header);
    append(value);
    append(footer);
  
    this._trackLength(header, value)
  };
  
  FormData.prototype._trackLength = function(header, value) {
    var valueLength = 0;
    if (Buffer.isBuffer(value)) {
      valueLength = value.length;
    } else if (typeof value === 'string') {
      valueLength = Buffer.byteLength(value);
    }
  
    this._valueLength += valueLength;
    this._overheadLength +=
      Buffer.byteLength(header) +
      + FormData.LINE_BREAK.length;
  
    // empty or ethier doesn't have path or not an http response
    if (!value || ( !value.path && !(value.readable && value.hasOwnProperty('httpVersion')) )) {
      return;
    }
  
    this._lengthRetrievers.push(function(next) {
  
      // check if it's local file
      if (value.hasOwnProperty('fd')) {
        fs.stat(value.path, function(err, stat) {
          if (err) {
            next(err);
            return;
          }
  
          next(null, stat.size);
        });
  
      // or http response
      } else if (value.hasOwnProperty('httpVersion')) {
        next(null, +value.headers['content-length']);
  
      // or request stream http://github.com/mikeal/request
      } else if (value.hasOwnProperty('httpModule')) {
        // wait till response come back
        value.on('response', function(response) {
          value.pause();
          next(null, +response.headers['content-length']);
        });
        value.resume();
  
      // something else
      } else {
        next('Unknown stream');
      }
    });
  };
  
  FormData.prototype._multiPartHeader = function(field, value) {
    var boundary = this.getBoundary();
    var header =
      '--' + boundary + FormData.LINE_BREAK +
      'Content-Disposition: form-data; name="' + field + '"';
  
    // fs- and request- streams have path property
    // TODO: Use request's response mime-type
    if (value.path) {
      header +=
        '; filename="' + path.basename(value.path) + '"' + FormData.LINE_BREAK +
        'Content-Type: ' + mime.lookup(value.path);
  
    // http response has not
    } else if (value.readable && value.hasOwnProperty('httpVersion')) {
      header +=
        '; filename="' + path.basename(value.client._httpMessage.path) + '"' + FormData.LINE_BREAK +
        'Content-Type: ' + value.headers['content-type'];
    }
  
    header += FormData.LINE_BREAK + FormData.LINE_BREAK;
    return header;
  };
  
  FormData.prototype._multiPartFooter = function(field, value) {
    return function(next) {
      var footer = FormData.LINE_BREAK;
  
      var lastPart = (this._streams.length === 0);
      if (lastPart) {
        footer += this._lastBoundary();
      }
  
      next(footer);
    }.bind(this);
  };
  
  FormData.prototype._lastBoundary = function() {
    return '--' + this.getBoundary() + '--';
  };
  
  FormData.prototype.getHeaders = function(userHeaders) {
    var formHeaders = {
      'content-type': 'multipart/form-data; boundary=' + this.getBoundary()
    };
  
    for (var header in userHeaders) {
      formHeaders[header.toLowerCase()] = userHeaders[header];
    }
  
    return formHeaders;
  }
  
  FormData.prototype.getCustomHeaders = function(contentType) {
      contentType = contentType ? contentType : 'multipart/form-data';
  
      var formHeaders = {
          'content-type': contentType + '; boundary=' + this.getBoundary(),
          'content-length': this.getLengthSync()
      };
  
      return formHeaders;
  }
  
  FormData.prototype.getBoundary = function() {
    if (!this._boundary) {
      this._generateBoundary();
    }
  
    return this._boundary;
  };
  
  FormData.prototype._generateBoundary = function() {
    // This generates a 50 character boundary similar to those used by Firefox.
    // They are optimized for boyer-moore parsing.
    var boundary = '--------------------------';
    for (var i = 0; i < 24; i++) {
      boundary += Math.floor(Math.random() * 10).toString(16);
    }
  
    this._boundary = boundary;
  };
  
  FormData.prototype.getLengthSync = function() {
      var knownLength = this._overheadLength + this._valueLength;
  
      if (this._streams.length) {
          knownLength += this._lastBoundary().length;
      }
  
      return knownLength;
  };
  
  FormData.prototype.getLength = function(cb) {
    var knownLength = this._overheadLength + this._valueLength;
  
    if (this._streams.length) {
      knownLength += this._lastBoundary().length;
    }
  
    if (!this._lengthRetrievers.length) {
      process.nextTick(cb.bind(this, null, knownLength));
      return;
    }
  
    async.parallel(this._lengthRetrievers, function(err, values) {
      if (err) {
        cb(err);
        return;
      }
  
      values.forEach(function(length) {
        knownLength += length;
      });
  
      cb(null, knownLength);
    });
  };
  
  FormData.prototype.submit = function(url, cb) {
    this.getLength(function(err, length) {
      var request
        , parsedUrl = parseUrl(url)
        , options = {
            method: 'post',
            port: parsedUrl.port || 80,
            path: parsedUrl.pathname,
            headers: this.getHeaders({'Content-Length': length}),
            host: parsedUrl.hostname
          };
  
      if (parsedUrl.protocol == 'https:') {
        // override default port
        if (!parsedUrl.port) options.port = 443;
        request = https.request(options);
      } else {
        request = http.request(options);
      }
  
      this.pipe(request);
      if (cb) {
        request.on('error', cb);
        request.on('response', cb.bind(this, null));
      }
  
      return request;
    }.bind(this));
  };
  

  provide("form-data", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  // Copyright 2010-2012 Mikeal Rogers
  //
  //    Licensed under the Apache License, Version 2.0 (the "License");
  //    you may not use this file except in compliance with the License.
  //    You may obtain a copy of the License at
  //
  //        http://www.apache.org/licenses/LICENSE-2.0
  //
  //    Unless required by applicable law or agreed to in writing, software
  //    distributed under the License is distributed on an "AS IS" BASIS,
  //    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  //    See the License for the specific language governing permissions and
  //    limitations under the License.
  
  var http = require('http')
    , https = false
    , tls = false
    , url = require('url')
    , util = require('util')
    , stream = require('stream')
    , qs = require('querystring')
    , oauth = require('./oauth')
    , uuid = require('./uuid')
    , ForeverAgent = require('./forever')
    , Cookie = require('./vendor/cookie')
    , CookieJar = require('./vendor/cookie/jar')
    , cookieJar = new CookieJar
    , tunnel = require('./tunnel')
    , aws = require('./aws')
    
    , mime = require('mime')
    , FormData = require('form-data')
    ;
    
  if (process.logging) {
    var log = process.logging('request')
  }
  
  try {
    https = require('https')
  } catch (e) {}
  
  try {
    tls = require('tls')
  } catch (e) {}
  
  function toBase64 (str) {
    return (new Buffer(str || "", "ascii")).toString("base64")
  }
  
  // Hacky fix for pre-0.4.4 https
  if (https && !https.Agent) {
    https.Agent = function (options) {
      http.Agent.call(this, options)
    }
    util.inherits(https.Agent, http.Agent)
    https.Agent.prototype._getConnection = function (host, port, cb) {
      var s = tls.connect(port, host, this.options, function () {
        // do other checks here?
        if (cb) cb()
      })
      return s
    }
  }
  
  function isReadStream (rs) {
    if (rs.readable && rs.path && rs.mode) {
      return true
    }
  }
  
  function copy (obj) {
    var o = {}
    Object.keys(obj).forEach(function (i) {
      o[i] = obj[i]
    })
    return o
  }
  
  var isUrl = /^https?:/
  
  var globalPool = {}
  
  function Request (options) {
    stream.Stream.call(this)
    this.readable = true
    this.writable = true
  
    if (typeof options === 'string') {
      options = {uri:options}
    }
    
    var reserved = Object.keys(Request.prototype)
    for (var i in options) {
      if (reserved.indexOf(i) === -1) {
        this[i] = options[i]
      } else {
        if (typeof options[i] === 'function') {
          delete options[i]
        }
      }
    }
    options = copy(options)
    
    this.init(options)
  }
  util.inherits(Request, stream.Stream)
  Request.prototype.init = function (options) {
    var self = this
    
    if (!options) options = {}
    if (process.env.NODE_DEBUG && /request/.test(process.env.NODE_DEBUG)) console.error('REQUEST', options)
    if (!self.pool && self.pool !== false) self.pool = globalPool
    self.dests = []
    self.__isRequestRequest = true
    
    // Protect against double callback
    if (!self._callback && self.callback) {
      self._callback = self.callback
      self.callback = function () {
        if (self._callbackCalled) return // Print a warning maybe?
        self._callback.apply(self, arguments)
        self._callbackCalled = true
      }
      self.on('error', self.callback.bind())
      self.on('complete', self.callback.bind(self, null))
    }
  
    if (self.url) {
      // People use this property instead all the time so why not just support it.
      self.uri = self.url
      delete self.url
    }
  
    if (!self.uri) {
      // this will throw if unhandled but is handleable when in a redirect
      return self.emit('error', new Error("options.uri is a required argument"))
    } else {
      if (typeof self.uri == "string") self.uri = url.parse(self.uri)
    }
    if (self.proxy) {
      if (typeof self.proxy == 'string') self.proxy = url.parse(self.proxy)
  
      // do the HTTP CONNECT dance using koichik/node-tunnel
      if (http.globalAgent && self.uri.protocol === "https:") {
        var tunnelFn = self.proxy.protocol === "http:"
                     ? tunnel.httpsOverHttp : tunnel.httpsOverHttps
  
        var tunnelOptions = { proxy: { host: self.proxy.hostname
                                     , port: +self.proxy.port
                                     , proxyAuth: self.proxy.auth }
                            , ca: this.ca }
  
        self.agent = tunnelFn(tunnelOptions)
        self.tunnel = true
      }
    }
  
    if (!self.uri.host || !self.uri.pathname) {
      // Invalid URI: it may generate lot of bad errors, like "TypeError: Cannot call method 'indexOf' of undefined" in CookieJar
      // Detect and reject it as soon as possible
      var faultyUri = url.format(self.uri)
      var message = 'Invalid URI "' + faultyUri + '"'
      if (Object.keys(options).length === 0) {
        // No option ? This can be the sign of a redirect
        // As this is a case where the user cannot do anything (he didn't call request directly with this URL)
        // he should be warned that it can be caused by a redirection (can save some hair)
        message += '. This can be caused by a crappy redirection.'
      }
      self.emit('error', new Error(message))
      return // This error was fatal
    }
  
    self._redirectsFollowed = self._redirectsFollowed || 0
    self.maxRedirects = (self.maxRedirects !== undefined) ? self.maxRedirects : 10
    self.followRedirect = (self.followRedirect !== undefined) ? self.followRedirect : true
    self.followAllRedirects = (self.followAllRedirects !== undefined) ? self.followAllRedirects : false
    if (self.followRedirect || self.followAllRedirects)
      self.redirects = self.redirects || []
  
    self.headers = self.headers ? copy(self.headers) : {}
  
    self.setHost = false
    if (!self.headers.host) {
      self.headers.host = self.uri.hostname
      if (self.uri.port) {
        if ( !(self.uri.port === 80 && self.uri.protocol === 'http:') &&
             !(self.uri.port === 443 && self.uri.protocol === 'https:') )
        self.headers.host += (':'+self.uri.port)
      }
      self.setHost = true
    }
    
    self.jar(self._jar || options.jar)
  
    if (!self.uri.pathname) {self.uri.pathname = '/'}
    if (!self.uri.port) {
      if (self.uri.protocol == 'http:') {self.uri.port = 80}
      else if (self.uri.protocol == 'https:') {self.uri.port = 443}
    }
  
    if (self.proxy && !self.tunnel) {
      self.port = self.proxy.port
      self.host = self.proxy.hostname
    } else {
      self.port = self.uri.port
      self.host = self.uri.hostname
    }
  
    self.clientErrorHandler = function (error) {
      if (self._aborted) return
      
      if (self.setHost) delete self.headers.host
      if (self.req._reusedSocket && error.code === 'ECONNRESET'
          && self.agent.addRequestNoreuse) {
        self.agent = { addRequest: self.agent.addRequestNoreuse.bind(self.agent) }
        self.start()
        self.req.end()
        return
      }
      if (self.timeout && self.timeoutTimer) {
        clearTimeout(self.timeoutTimer)
        self.timeoutTimer = null
      }
      self.emit('error', error)
    }
  
    self._parserErrorHandler = function (error) {
      if (this.res) {
        if (this.res.request) {
          this.res.request.emit('error', error)
        } else {
          this.res.emit('error', error)
        }
      } else {
        this._httpMessage.emit('error', error)
      }
    }
  
    if (options.form) {
      self.form(options.form)
    }
  
    if (options.oauth) {
      self.oauth(options.oauth)
    }
    
    if (options.aws) {
      self.aws(options.aws)
    }
  
    if (self.uri.auth && !self.headers.authorization) {
      self.headers.authorization = "Basic " + toBase64(self.uri.auth.split(':').map(function(item){ return qs.unescape(item)}).join(':'))
    }
    if (self.proxy && self.proxy.auth && !self.headers['proxy-authorization'] && !self.tunnel) {
      self.headers['proxy-authorization'] = "Basic " + toBase64(self.proxy.auth.split(':').map(function(item){ return qs.unescape(item)}).join(':'))
    }
  
    if (options.qs) self.qs(options.qs)
  
    if (self.uri.path) {
      self.path = self.uri.path
    } else {
      self.path = self.uri.pathname + (self.uri.search || "")
    }
  
    if (self.path.length === 0) self.path = '/'
  
    if (self.proxy && !self.tunnel) self.path = (self.uri.protocol + '//' + self.uri.host + self.path)
  
    if (options.json) {
      self.json(options.json)
    } else if (options.multipart) {
      self.boundary = uuid()
      self.multipart(options.multipart)
    }
  
    if (self.body) {
      var length = 0
      if (!Buffer.isBuffer(self.body)) {
        if (Array.isArray(self.body)) {
          for (var i = 0; i < self.body.length; i++) {
            length += self.body[i].length
          }
        } else {
          self.body = new Buffer(self.body)
          length = self.body.length
        }
      } else {
        length = self.body.length
      }
      if (length) {
        if(!self.headers['content-length'] && !self.headers['Content-Length'])
        self.headers['content-length'] = length
      } else {
        throw new Error('Argument error, options.body.')
      }
    }
  
    var protocol = self.proxy && !self.tunnel ? self.proxy.protocol : self.uri.protocol
      , defaultModules = {'http:':http, 'https:':https}
      , httpModules = self.httpModules || {}
      ;
    self.httpModule = httpModules[protocol] || defaultModules[protocol]
  
    if (!self.httpModule) return this.emit('error', new Error("Invalid protocol"))
  
    if (options.ca) self.ca = options.ca
  
    if (!self.agent) {
      if (options.agentOptions) self.agentOptions = options.agentOptions
  
      if (options.agentClass) {
        self.agentClass = options.agentClass
      } else if (options.forever) {
        self.agentClass = protocol === 'http:' ? ForeverAgent : ForeverAgent.SSL
      } else {
        self.agentClass = self.httpModule.Agent
      }
    }
  
    if (self.pool === false) {
      self.agent = false
    } else {
      self.agent = self.agent || self.getAgent()
      if (self.maxSockets) {
        // Don't use our pooling if node has the refactored client
        self.agent.maxSockets = self.maxSockets
      }
      if (self.pool.maxSockets) {
        // Don't use our pooling if node has the refactored client
        self.agent.maxSockets = self.pool.maxSockets
      }
    }
  
    self.once('pipe', function (src) {
      if (self.ntick && self._started) throw new Error("You cannot pipe to this stream after the outbound request has started.")
      self.src = src
      if (isReadStream(src)) {
        if (!self.headers['content-type'] && !self.headers['Content-Type'])
          self.headers['content-type'] = mime.lookup(src.path)
      } else {
        if (src.headers) {
          for (var i in src.headers) {
            if (!self.headers[i]) {
              self.headers[i] = src.headers[i]
            }
          }
        }
        if (self._json && !self.headers['content-type'] && !self.headers['Content-Type'])
          self.headers['content-type'] = 'application/json'
        if (src.method && !self.method) {
          self.method = src.method
        }
      }
  
      self.on('pipe', function () {
        console.error("You have already piped to this stream. Pipeing twice is likely to break the request.")
      })
    })
  
    process.nextTick(function () {
      if (self._aborted) return
      
      if (self._form) {
        self.setHeaders(self._form.getHeaders())
        self._form.pipe(self)
      }
      if (self.body) {
        if (Array.isArray(self.body)) {
          self.body.forEach(function (part) {
            self.write(part)
          })
        } else {
          self.write(self.body)
        }
        self.end()
      } else if (self.requestBodyStream) {
        console.warn("options.requestBodyStream is deprecated, please pass the request object to stream.pipe.")
        self.requestBodyStream.pipe(self)
      } else if (!self.src) {
        if (self.method !== 'GET' && typeof self.method !== 'undefined') {
          self.headers['content-length'] = 0
        }
        self.end()
      }
      self.ntick = true
    })
  }
  
  // Must call this when following a redirect from https to http or vice versa
  // Attempts to keep everything as identical as possible, but update the
  // httpModule, Tunneling agent, and/or Forever Agent in use.
  Request.prototype._updateProtocol = function () {
    var self = this
    var protocol = self.uri.protocol
  
    if (protocol === 'https:') {
      // previously was doing http, now doing https
      // if it's https, then we might need to tunnel now.
      if (self.proxy) {
        self.tunnel = true
        var tunnelFn = self.proxy.protocol === 'http:'
                     ? tunnel.httpsOverHttp : tunnel.httpsOverHttps
        var tunnelOptions = { proxy: { host: self.proxy.hostname
                                     , post: +self.proxy.port
                                     , proxyAuth: self.proxy.auth }
                            , ca: self.ca }
        self.agent = tunnelFn(tunnelOptions)
        return
      }
  
      self.httpModule = https
      switch (self.agentClass) {
        case ForeverAgent:
          self.agentClass = ForeverAgent.SSL
          break
        case http.Agent:
          self.agentClass = https.Agent
          break
        default:
          // nothing we can do.  Just hope for the best.
          return
      }
  
      // if there's an agent, we need to get a new one.
      if (self.agent) self.agent = self.getAgent()
  
    } else {
      if (log) log('previously https, now http')
      // previously was doing https, now doing http
      // stop any tunneling.
      if (self.tunnel) self.tunnel = false
      self.httpModule = http
      switch (self.agentClass) {
        case ForeverAgent.SSL:
          self.agentClass = ForeverAgent
          break
        case https.Agent:
          self.agentClass = http.Agent
          break
        default:
          // nothing we can do.  just hope for the best
          return
      }
  
      // if there's an agent, then get a new one.
      if (self.agent) {
        self.agent = null
        self.agent = self.getAgent()
      }
    }
  }
  
  Request.prototype.getAgent = function () {
    var Agent = this.agentClass
    var options = {}
    if (this.agentOptions) {
      for (var i in this.agentOptions) {
        options[i] = this.agentOptions[i]
      }
    }
    if (this.ca) options.ca = this.ca
  
    var poolKey = ''
  
    // different types of agents are in different pools
    if (Agent !== this.httpModule.Agent) {
      poolKey += Agent.name
    }
  
    if (!this.httpModule.globalAgent) {
      // node 0.4.x
      options.host = this.host
      options.port = this.port
      if (poolKey) poolKey += ':'
      poolKey += this.host + ':' + this.port
    }
  
    // ca option is only relevant if proxy or destination are https
    var proxy = this.proxy
    if (typeof proxy === 'string') proxy = url.parse(proxy)
    var caRelevant = (proxy && proxy.protocol === 'https:') || this.uri.protocol === 'https:'
    if (options.ca && caRelevant) {
      if (poolKey) poolKey += ':'
      poolKey += options.ca
    }
  
    if (!poolKey && Agent === this.httpModule.Agent && this.httpModule.globalAgent) {
      // not doing anything special.  Use the globalAgent
      return this.httpModule.globalAgent
    }
  
    // we're using a stored agent.  Make sure it's protocol-specific
    poolKey = this.uri.protocol + poolKey
  
    // already generated an agent for this setting
    if (this.pool[poolKey]) return this.pool[poolKey]
  
    return this.pool[poolKey] = new Agent(options)
  }
  
  Request.prototype.start = function () {
    var self = this
  
    if (self._aborted) return
  
    self._started = true
    self.method = self.method || 'GET'
    self.href = self.uri.href
    if (log) log('%method %href', self)
  
    if (self.src && self.src.stat && self.src.stat.size && !self.headers['content-length'] && !self.headers['Content-Length']) {
      self.headers['content-length'] = self.src.stat.size
    }
    if (self._aws) {
      self.aws(self._aws, true)
    }
    self.req = self.httpModule.request(self, function (response) {
      if (response.connection.listeners('error').indexOf(self._parserErrorHandler) === -1) {
        response.connection.once('error', self._parserErrorHandler)
      }
      if (self._aborted) return
      if (self._paused) response.pause()
  
      self.response = response
      response.request = self
      response.toJSON = toJSON
  
      if (self.httpModule === https &&
          self.strictSSL &&
          !response.client.authorized) {
        var sslErr = response.client.authorizationError
        self.emit('error', new Error('SSL Error: '+ sslErr))
        return
      }
  
      if (self.setHost) delete self.headers.host
      if (self.timeout && self.timeoutTimer) {
        clearTimeout(self.timeoutTimer)
        self.timeoutTimer = null
      }  
  
      var addCookie = function (cookie) {
        if (self._jar) self._jar.add(new Cookie(cookie))
        else cookieJar.add(new Cookie(cookie))
      }
  
      if (response.headers['set-cookie'] && (!self._disableCookies)) {
        if (Array.isArray(response.headers['set-cookie'])) response.headers['set-cookie'].forEach(addCookie)
        else addCookie(response.headers['set-cookie'])
      }
  
      if (response.statusCode >= 300 && response.statusCode < 400  &&
          (self.followAllRedirects ||
           (self.followRedirect && (self.method !== 'PUT' && self.method !== 'POST' && self.method !== 'DELETE'))) &&
          response.headers.location) {
        if (self._redirectsFollowed >= self.maxRedirects) {
          self.emit('error', new Error("Exceeded maxRedirects. Probably stuck in a redirect loop "+self.uri.href))
          return
        }
        self._redirectsFollowed += 1
  
        if (!isUrl.test(response.headers.location)) {
          response.headers.location = url.resolve(self.uri.href, response.headers.location)
        }
  
        var uriPrev = self.uri
        self.uri = url.parse(response.headers.location)
  
        // handle the case where we change protocol from https to http or vice versa
        if (self.uri.protocol !== uriPrev.protocol) {
          self._updateProtocol()
        }
  
        self.redirects.push(
          { statusCode : response.statusCode
          , redirectUri: response.headers.location 
          }
        )
        if (self.followAllRedirects) self.method = 'GET'
        // self.method = 'GET' // Force all redirects to use GET || commented out fixes #215
        delete self.src
        delete self.req
        delete self.agent
        delete self._started
        delete self.body
        delete self._form
        if (self.headers) {
          delete self.headers.host
          delete self.headers['content-type']
          delete self.headers['content-length']
        }
        if (log) log('Redirect to %uri', self)
        self.init()
        return // Ignore the rest of the response
      } else {
        self._redirectsFollowed = self._redirectsFollowed || 0
        // Be a good stream and emit end when the response is finished.
        // Hack to emit end on close because of a core bug that never fires end
        response.on('close', function () {
          if (!self._ended) self.response.emit('end')
        })
  
        if (self.encoding) {
          if (self.dests.length !== 0) {
            console.error("Ingoring encoding parameter as this stream is being piped to another stream which makes the encoding option invalid.")
          } else {
            response.setEncoding(self.encoding)
          }
        }
  
        self.dests.forEach(function (dest) {
          self.pipeDest(dest)
        })
  
        response.on("data", function (chunk) {
          self._destdata = true
          self.emit("data", chunk)
        })
        response.on("end", function (chunk) {
          self._ended = true
          self.emit("end", chunk)
        })
        response.on("close", function () {self.emit("close")})
  
        self.emit('response', response)
  
        if (self.callback) {
          var buffer = []
          var bodyLen = 0
          self.on("data", function (chunk) {
            buffer.push(chunk)
            bodyLen += chunk.length
          })
          self.on("end", function () {
            if (self._aborted) return
            
            if (buffer.length && Buffer.isBuffer(buffer[0])) {
              var body = new Buffer(bodyLen)
              var i = 0
              buffer.forEach(function (chunk) {
                chunk.copy(body, i, 0, chunk.length)
                i += chunk.length
              })
              if (self.encoding === null) {
                response.body = body
              } else {
                response.body = body.toString(self.encoding)
              }
            } else if (buffer.length) {
              response.body = buffer.join('')
            }
  
            if (self._json) {
              try {
                response.body = JSON.parse(response.body)
              } catch (e) {}
            }
            
            self.emit('complete', response, response.body)
          })
        }
      }
    })
  
    if (self.timeout && !self.timeoutTimer) {
      self.timeoutTimer = setTimeout(function () {
        self.req.abort()
        var e = new Error("ETIMEDOUT")
        e.code = "ETIMEDOUT"
        self.emit("error", e)
      }, self.timeout)
      
      // Set additional timeout on socket - in case if remote
      // server freeze after sending headers
      if (self.req.setTimeout) { // only works on node 0.6+
        self.req.setTimeout(self.timeout, function () {
          if (self.req) {
            self.req.abort()
            var e = new Error("ESOCKETTIMEDOUT")
            e.code = "ESOCKETTIMEDOUT"
            self.emit("error", e)
          }
        })
      }
    }
    
    self.req.on('error', self.clientErrorHandler)
    self.req.on('drain', function() {
      self.emit('drain')
    })
    self.on('end', function() {
      if ( self.req.connection ) self.req.connection.removeListener('error', self._parserErrorHandler)
    })
    self.emit('request', self.req)
  }
  
  Request.prototype.abort = function () {
    this._aborted = true
    
    if (this.req) {
      this.req.abort()
    }
    else if (this.response) {
      this.response.abort()
    }
    
    this.emit("abort")
  }
  
  Request.prototype.pipeDest = function (dest) {
    var response = this.response
    // Called after the response is received
    if (dest.headers) {
      dest.headers['content-type'] = response.headers['content-type']
      if (response.headers['content-length']) {
        dest.headers['content-length'] = response.headers['content-length']
      }
    }
    if (dest.setHeader) {
      for (var i in response.headers) {
        dest.setHeader(i, response.headers[i])
      }
      dest.statusCode = response.statusCode
    }
    if (this.pipefilter) this.pipefilter(response, dest)
  }
  
  // Composable API
  Request.prototype.setHeader = function (name, value, clobber) {
    if (clobber === undefined) clobber = true
    if (clobber || !this.headers.hasOwnProperty(name)) this.headers[name] = value
    else this.headers[name] += ',' + value
    return this
  }
  Request.prototype.setHeaders = function (headers) {
    for (var i in headers) {this.setHeader(i, headers[i])}
    return this
  }
  Request.prototype.qs = function (q, clobber) {
    var base
    if (!clobber && this.uri.query) base = qs.parse(this.uri.query)
    else base = {}
    
    for (var i in q) {
      base[i] = q[i]
    }
    
    this.uri = url.parse(this.uri.href.split('?')[0] + '?' + qs.stringify(base))
    this.url = this.uri
    
    return this
  }
  Request.prototype.form = function (form) {
    if (form) {
      this.headers['content-type'] = 'application/x-www-form-urlencoded; charset=utf-8'
      this.body = qs.stringify(form).toString('utf8')
      return this
    } 
    // create form-data object
    this._form = new FormData()
    return this._form
  }
  Request.prototype.multipart = function (multipart) {
    var self = this
    self.body = []
  
    if (!self.headers['content-type']) {
      self.headers['content-type'] = 'multipart/related; boundary=' + self.boundary
    } else {
      self.headers['content-type'] = self.headers['content-type'].split(';')[0] + '; boundary=' + self.boundary
    }
  
    if (!multipart.forEach) throw new Error('Argument error, options.multipart.')
  
    if (self.preambleCRLF) {
      self.body.push(new Buffer('\r\n'))
    }
    
    multipart.forEach(function (part) {
      var body = part.body
      if(body == null) throw Error('Body attribute missing in multipart.')
      delete part.body
      var preamble = '--' + self.boundary + '\r\n'
      Object.keys(part).forEach(function (key) {
        preamble += key + ': ' + part[key] + '\r\n'
      })
      preamble += '\r\n'
      self.body.push(new Buffer(preamble))
      self.body.push(new Buffer(body))
      self.body.push(new Buffer('\r\n'))
    })
    self.body.push(new Buffer('--' + self.boundary + '--'))
    return self
  }
  Request.prototype.json = function (val) {
    this.setHeader('accept', 'application/json')
    this._json = true
    if (typeof val === 'boolean') {
      if (typeof this.body === 'object') {
        this.setHeader('content-type', 'application/json')
        this.body = JSON.stringify(this.body)
      }
    } else {
      this.setHeader('content-type', 'application/json')
      this.body = JSON.stringify(val)
    }
    return this
  }
  function getHeader(name, headers) {
      var result, re, match
      Object.keys(headers).forEach(function (key) {
          re = new RegExp(name, 'i')
          match = key.match(re)
          if (match) result = headers[key]
      })
      return result
  }
  Request.prototype.aws = function (opts, now) {
    if (!now) {
      this._aws = opts
      return this
    }
    var date = new Date()
    this.setHeader('date', date.toUTCString())
    var auth =
      { key: opts.key
      , secret: opts.secret
      , verb: this.method.toUpperCase()
      , date: date
      , contentType: getHeader('content-type', this.headers) || ''
      , md5: getHeader('content-md5', this.headers) || ''
      , amazonHeaders: aws.canonicalizeHeaders(this.headers)
      }
    if (opts.bucket && this.path) {
      auth.resource = '/' + opts.bucket + this.path
    } else if (opts.bucket && !this.path) {
      auth.resource = '/' + opts.bucket
    } else if (!opts.bucket && this.path) {
      auth.resource = this.path
    } else if (!opts.bucket && !this.path) {
      auth.resource = '/'
    }
    auth.resource = aws.canonicalizeResource(auth.resource)
    this.setHeader('authorization', aws.authorization(auth))
    
    return this
  }
  
  Request.prototype.oauth = function (_oauth) {
    var form
    if (this.headers['content-type'] && 
        this.headers['content-type'].slice(0, 'application/x-www-form-urlencoded'.length) ===
          'application/x-www-form-urlencoded' 
       ) {
      form = qs.parse(this.body)
    }
    if (this.uri.query) {
      form = qs.parse(this.uri.query)
    } 
    if (!form) form = {}
    var oa = {}
    for (var i in form) oa[i] = form[i]
    for (var i in _oauth) oa['oauth_'+i] = _oauth[i]
    if (!oa.oauth_version) oa.oauth_version = '1.0'
    if (!oa.oauth_timestamp) oa.oauth_timestamp = Math.floor( (new Date()).getTime() / 1000 ).toString()
    if (!oa.oauth_nonce) oa.oauth_nonce = uuid().replace(/-/g, '')
    
    oa.oauth_signature_method = 'HMAC-SHA1'
    
    var consumer_secret = oa.oauth_consumer_secret
    delete oa.oauth_consumer_secret
    var token_secret = oa.oauth_token_secret
    delete oa.oauth_token_secret
    
    var baseurl = this.uri.protocol + '//' + this.uri.host + this.uri.pathname
    var signature = oauth.hmacsign(this.method, baseurl, oa, consumer_secret, token_secret)
    
    // oa.oauth_signature = signature
    for (var i in form) {
      if ( i.slice(0, 'oauth_') in _oauth) {
        // skip 
      } else {
        delete oa['oauth_'+i]
        if (i !== 'x_auth_mode') delete oa[i]
      }
    }
    this.headers.Authorization = 
      'OAuth '+Object.keys(oa).sort().map(function (i) {return i+'="'+oauth.rfc3986(oa[i])+'"'}).join(',')
    this.headers.Authorization += ',oauth_signature="' + oauth.rfc3986(signature) + '"'
    return this
  }
  Request.prototype.jar = function (jar) {
    var cookies
    
    if (this._redirectsFollowed === 0) {
      this.originalCookieHeader = this.headers.cookie
    }
    
    if (jar === false) {
      // disable cookies
      cookies = false
      this._disableCookies = true
    } else if (jar) {
      // fetch cookie from the user defined cookie jar
      cookies = jar.get({ url: this.uri.href })
    } else {
      // fetch cookie from the global cookie jar
      cookies = cookieJar.get({ url: this.uri.href })
    }
    
    if (cookies && cookies.length) {
      var cookieString = cookies.map(function (c) {
        return c.name + "=" + c.value
      }).join("; ")
  
      if (this.originalCookieHeader) {
        // Don't overwrite existing Cookie header
        this.headers.cookie = this.originalCookieHeader + '; ' + cookieString
      } else {
        this.headers.cookie = cookieString
      }
    }
    this._jar = jar
    return this
  }
  
  
  // Stream API
  Request.prototype.pipe = function (dest, opts) {
    if (this.response) {
      if (this._destdata) {
        throw new Error("You cannot pipe after data has been emitted from the response.")
      } else if (this._ended) {
        throw new Error("You cannot pipe after the response has been ended.")
      } else {
        stream.Stream.prototype.pipe.call(this, dest, opts)
        this.pipeDest(dest)
        return dest
      }
    } else {
      this.dests.push(dest)
      stream.Stream.prototype.pipe.call(this, dest, opts)
      return dest
    }
  }
  Request.prototype.write = function () {
    if (!this._started) this.start()
    return this.req.write.apply(this.req, arguments)
  }
  Request.prototype.end = function (chunk) {
    if (chunk) this.write(chunk)
    if (!this._started) this.start()
    this.req.end()
  }
  Request.prototype.pause = function () {
    if (!this.response) this._paused = true
    else this.response.pause.apply(this.response, arguments)
  }
  Request.prototype.resume = function () {
    if (!this.response) this._paused = false
    else this.response.resume.apply(this.response, arguments)
  }
  Request.prototype.destroy = function () {
    if (!this._ended) this.end()
  }
  
  // organize params for post, put, head, del
  function initParams(uri, options, callback) {
    if ((typeof options === 'function') && !callback) callback = options
    if (options && typeof options === 'object') {
      options.uri = uri
    } else if (typeof uri === 'string') {
      options = {uri:uri}
    } else {
      options = uri
      uri = options.uri
    }
    return { uri: uri, options: options, callback: callback }
  }
  
  function request (uri, options, callback) {
    if (typeof uri === 'undefined') throw new Error('undefined is not a valid uri or options object.')
    if ((typeof options === 'function') && !callback) callback = options
    if (options && typeof options === 'object') {
      options.uri = uri
    } else if (typeof uri === 'string') {
      options = {uri:uri}
    } else {
      options = uri
    }
  
    if (callback) options.callback = callback
    var r = new Request(options)
    return r
  }
  
  module.exports = request
  
  request.initParams = initParams
  
  request.defaults = function (options, requester) {
    var def = function (method) {
      var d = function (uri, opts, callback) {
        var params = initParams(uri, opts, callback)
        for (var i in options) {
          if (params.options[i] === undefined) params.options[i] = options[i]
        }
        if(typeof requester === 'function') {
          if(method === request) {
            method = requester
          } else {
            params.options._requester = requester
          }
        }
        return method(params.options, params.callback)
      }
      return d
    }
    var de = def(request)
    de.get = def(request.get)
    de.post = def(request.post)
    de.put = def(request.put)
    de.head = def(request.head)
    de.del = def(request.del)
    de.cookie = def(request.cookie)
    de.jar = request.jar
    return de
  }
  
  request.forever = function (agentOptions, optionsArg) {
    var options = {}
    if (optionsArg) {
      for (option in optionsArg) {
        options[option] = optionsArg[option]
      }
    }
    if (agentOptions) options.agentOptions = agentOptions
    options.forever = true
    return request.defaults(options)
  }
  
  request.get = request
  request.post = function (uri, options, callback) {
    var params = initParams(uri, options, callback)
    params.options.method = 'POST'
    return request(params.uri || null, params.options, params.callback)
  }
  request.put = function (uri, options, callback) {
    var params = initParams(uri, options, callback)
    params.options.method = 'PUT'
    return request(params.uri || null, params.options, params.callback)
  }
  request.head = function (uri, options, callback) {
    var params = initParams(uri, options, callback)
    params.options.method = 'HEAD'
    if (params.options.body || 
        params.options.requestBodyStream || 
        (params.options.json && typeof params.options.json !== 'boolean') || 
        params.options.multipart) {
      throw new Error("HTTP HEAD requests MUST NOT include a request body.")
    }
    return request(params.uri || null, params.options, params.callback)
  }
  request.del = function (uri, options, callback) {
    var params = initParams(uri, options, callback)
    params.options.method = 'DELETE'
    if(typeof params.options._requester === 'function') {
      request = params.options._requester
    }
    return request(params.uri || null, params.options, params.callback)
  }
  request.jar = function () {
    return new CookieJar
  }
  request.cookie = function (str) {
    if (str && str.uri) str = str.uri
    if (typeof str !== 'string') throw new Error("The cookie function only accepts STRING as param")
    return new Cookie(str)
  }
  
  // Safe toJSON
  
  function getSafe (self, uuid) {  
    if (typeof self === 'object' || typeof self === 'function') var safe = {}
    if (Array.isArray(self)) var safe = []
  
    var recurse = []
    
    Object.defineProperty(self, uuid, {})
    
    var attrs = Object.keys(self).filter(function (i) {
      if (i === uuid) return false 
      if ( (typeof self[i] !== 'object' && typeof self[i] !== 'function') || self[i] === null) return true
      return !(Object.getOwnPropertyDescriptor(self[i], uuid))
    })
    
    
    for (var i=0;i<attrs.length;i++) {
      if ( (typeof self[attrs[i]] !== 'object' && typeof self[attrs[i]] !== 'function') || 
            self[attrs[i]] === null
          ) {
        safe[attrs[i]] = self[attrs[i]]
      } else {
        recurse.push(attrs[i])
        Object.defineProperty(self[attrs[i]], uuid, {})
      }
    }
  
    for (var i=0;i<recurse.length;i++) {
      safe[recurse[i]] = getSafe(self[recurse[i]], uuid)
    }
    
    return safe
  }
  
  function toJSON () {
    return getSafe(this, (((1+Math.random())*0x10000)|0).toString(16))
  }
  
  Request.prototype.toJSON = toJSON
  
  

  provide("request", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  var dom      = exports.dom = require("./jsdom/level3/index").dom,
      features = require('./jsdom/browser/documentfeatures'),
      fs       = require("fs"),
      pkg      = JSON.parse(fs.readFileSync(__dirname + "/../package.json")),
      request  = require('request'),
      URL      = require('url');
  
  var style = require('./jsdom/level2/style');
  exports.defaultLevel = dom.level3.html;
  exports.browserAugmentation = require("./jsdom/browser/index").browserAugmentation;
  exports.windowAugmentation = require("./jsdom/browser/index").windowAugmentation;
  
  // Proxy feature functions to features module.
  ['availableDocumentFeatures',
   'defaultDocumentFeatures',
   'applyDocumentFeatures'].forEach(function (propName) {
    exports.__defineGetter__(propName, function () {
      return features[propName];
    });
    exports.__defineSetter__(propName, function (val) {
      return features[propName] = val;
    });
  });
  
  exports.debugMode = false;
  
  var createWindow = exports.createWindow = require("./jsdom/browser/index").createWindow;
  
  exports.__defineGetter__('version', function() {
    return pkg.version;
  });
  
  exports.level = function (level, feature) {
  	if(!feature) feature = 'core'
  	return require('./jsdom/level' + level + '/' + feature).dom['level' + level][feature]
  }
  
  exports.jsdom = function (html, level, options) {
  
    options = options || {};
    if(typeof level == "string") {
      level = exports.level(level, 'html')
    } else {
      level   = level || exports.defaultLevel;
    }
  
    if (!options.url) {
      options.url = (module.parent.id === 'jsdom') ?
                    module.parent.parent.filename  :
                    module.parent.filename;
    }
  
    var browser = exports.browserAugmentation(level, options),
        doc     = (browser.HTMLDocument)             ?
                   new browser.HTMLDocument(options) :
                   new browser.Document(options);
  
    if (options.features && options.features.QuerySelector) {
      require("./jsdom/selectors/index").applyQuerySelector(doc, level);
    }
  
    features.applyDocumentFeatures(doc, options.features);
  
    if (typeof html === 'undefined' || html === null) {
      doc.write('<html><head></head><body></body></html>');
    } else {
      doc.write(html + '');
    }
  
    if (doc.close && !options.deferClose) {
      doc.close();
    }
  
    // Kept for backwards-compatibility. The window is lazily created when
    // document.parentWindow or document.defaultView is accessed.
    doc.createWindow = function() {
      // Remove ourself
      if (doc.createWindow) {
        delete doc.createWindow;
      }
      return doc.parentWindow;
    };
  
    return doc;
  };
  
  exports.html = function(html, level, options) {
    html += '';
  
    // TODO: cache a regex and use it here instead
    //       or make the parser handle it
    var htmlLowered = html.toLowerCase();
  
    // body
    if (!~htmlLowered.indexOf('<body')) {
      html = '<body>' + html + '</body>';
    }
  
    // html
    if (!~htmlLowered.indexOf('<html')) {
      html = '<html>' + html + '</html>';
    }
    return exports.jsdom(html, level, options);
  };
  
  exports.jQueryify = exports.jsdom.jQueryify = function (window /* path [optional], callback */) {
  
    if (!window || !window.document) { return; }
  
    var args = Array.prototype.slice.call(arguments),
        callback = (typeof(args[args.length - 1]) === 'function') && args.pop(),
        path,
        jQueryTag = window.document.createElement("script");
        jQueryTag.className = "jsdom";
  
    if (args.length > 1 && typeof(args[1] === 'string')) {
      path = args[1];
    }
  
    var features = window.document.implementation._features;
  
    window.document.implementation.addFeature('FetchExternalResources', ['script']);
    window.document.implementation.addFeature('ProcessExternalResources', ['script']);
    window.document.implementation.addFeature('MutationEvents', ["1.0"]);
    jQueryTag.src = path || 'http://code.jquery.com/jquery-latest.js';
    window.document.body.appendChild(jQueryTag);
  
    jQueryTag.onload = function() {
      if (callback) {
        callback(window, window.jQuery);
      }
  
      window.document.implementation._features = features;
    };
  
    return window;
  };
  
  
  exports.env = exports.jsdom.env = function() {
    var
    args        = Array.prototype.slice.call(arguments),
    config      = exports.env.processArguments(args),
    callback    = config.done,
    processHTML = function(err, html) {
  
      html += '';
      if(err) {
        return callback(err);
      }
  
      config.scripts = config.scripts || [];
      if (typeof config.scripts === 'string') {
        config.scripts = [config.scripts];
      }
  
      config.src = config.src || [];
      if (typeof config.src === 'string') {
        config.src = [config.src];
      }
  
      var
      options    = {
        features: config.features || {
          'FetchExternalResources' : false,
          'ProcessExternalResources' : false
        },
        url: config.url
      },
      window     = exports.html(html, null, options).createWindow(),
      features   = JSON.parse(JSON.stringify(window.document.implementation._features)),
      docsLoaded = 0,
      totalDocs  = config.scripts.length + config.src.length,
      readyState = null,
      errors     = null;
  
      if (!window || !window.document) {
        return callback(new Error('JSDOM: a window object could not be created.'));
      }
  
      if( config.document ) {
        window.document._referrer = config.document.referrer;
        window.document._cookie = config.document.cookie;
      }
  
      window.document.implementation.addFeature('FetchExternalResources', ['script']);
      window.document.implementation.addFeature('ProcessExternalResources', ['script']);
      window.document.implementation.addFeature('MutationEvents', ['1.0']);
  
      var scriptComplete = function() {
        docsLoaded++;
        if (docsLoaded >= totalDocs) {
          window.document.implementation._features = features;
  
          if (errors) {
            errors = errors.concat(window.document.errors || []);
          }
  
          process.nextTick(function() { callback(errors, window); });
        }
      }
  
      if (config.scripts.length > 0 || config.src.length > 0) {
        config.scripts.forEach(function(src) {
          var script = window.document.createElement('script');
          script.className = "jsdom";
          script.onload = function() {
            scriptComplete()
          };
  
          script.onerror = function(e) {
            if (!errors) {
              errors = [];
            }
            errors.push(e.error);
            scriptComplete();
          };
  
          script.src = src;
          try {
            // project against invalid dom
            // ex: http://www.google.com/foo#bar
            window.document.documentElement.appendChild(script);
          } catch(e) {
            if(!errors) {
              errors=[];
            }
            errors.push(e.error || e.message);
            scriptComplete();
          }
        });
  
        config.src.forEach(function(src) {
          var script = window.document.createElement('script');
          script.onload = function() {
            process.nextTick(scriptComplete);
          };
  
          script.onerror = function(e) {
            if (!errors) {
              errors = [];
            }
            errors.push(e.error || e.message);
            // nextTick so that an exception within scriptComplete won't cause
            // another script onerror (which would be an infinite loop)
            process.nextTick(scriptComplete);
          };
  
          script.text = src;
          window.document.documentElement.appendChild(script);
          window.document.documentElement.removeChild(script);
        });
      } else {
        scriptComplete();
      }
    };
  
    config.html += '';
  
    // Handle markup
    if (config.html.indexOf("\n") > 0 || config.html.match(/^\W*</)) {
      processHTML(null, config.html);
  
    // Handle url/file
    } else {
      var url = URL.parse(config.html);
      config.url = config.url || url.href;
      if (url.hostname) {
        request({
          uri      : url,
          encoding : config.encoding || 'utf8',
          headers  : config.headers || {},
          proxy    : config.proxy || null
        },
        function(err, request, body) {
          processHTML(err, body);
        });
      } else {
        fs.readFile(config.html, processHTML);
      }
    }
  };
  
  /*
    Since jsdom.env() is a helper for quickly and easily setting up a
    window with scripts and such already loaded into it, the arguments
    should be fairly flexible.  Here are the requirements
  
    1) collect `html` (url, string, or file on disk)  (STRING)
    2) load `code` into the window (array of scripts) (ARRAY)
    3) callback when resources are `done`             (FUNCTION)
    4) configuration                                  (OBJECT)
  
    Rules:
    + if there is one argument it had better be an object with atleast
      a `html` and `done` property (other properties are gravy)
  
    + arguments above are pulled out of the arguments and put into the
      config object that is returned
  */
  exports.env.processArguments = function(args) {
    if (!args || !args.length || args.length < 1) {
      throw new Error('No arguments passed to jsdom.env().');
    }
  
    var
    props = {
      'html'    : true,
      'done'    : true,
      'scripts' : false,
      'config'  : false,
      'url'     : false,  // the URL for location.href if different from html
      'document': false   // HTMLDocument properties
    },
    propKeys = Object.keys(props),
    config = {
      code : []
    },
    l    = args.length
    ;
    if (l === 1) {
      config = args[0];
    } else {
      args.forEach(function(v) {
        var type = typeof v;
        if (!v) {
          return;
        }
        if (type === 'string' || v + '' === v) {
          config.html = v;
        } else if (type === 'object') {
          // Array
          if (v.length && v[0]) {
            config.scripts = v;
          } else {
            // apply missing required properties if appropriate
            propKeys.forEach(function(req) {
  
              if (typeof v[req] !== 'undefined' &&
                  typeof config[req] === 'undefined') {
  
                config[req] = v[req];
                delete v[req];
              }
            });
            config.config = v;
          }
        } else if (type === 'function') {
          config.done = v;
        }
      });
    }
  
    propKeys.forEach(function(req) {
      var required = props[req];
      if (required && typeof config[req] === 'undefined') {
        throw new Error("jsdom.env requires a '" + req + "' argument");
      }
    });
    return config;
  };
  

  provide("jsdom", module.exports);

  $.ender(module.exports);

}());

(function () {

  var module = { exports: {} }, exports = module.exports;

  (function () {
  function create(window) {
  
    if(window == null ) {
      window = require('jsdom').jsdom().createWindow();
      // assume window is a jsdom instance...
      // jsdom includes an incomplete version of XMLHttpRequest
      window.XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
      // trick jQuery into thinking CORS is supported (should be in node-XMLHttpRequest)
      window.XMLHttpRequest.prototype.withCredentials = false;
      
      if(window.location == null) {
        window.location = require('location');  
      }
  
      if(window.navigator == null) {
        window.navigator = require('navigator');
      }
    }
    
  
    var location = window.location,
        navigator = window.navigator,
        XMLHttpRequest = window.XMLHttpRequest;
  
    /*!
   * jQuery JavaScript Library v1.8.3
   * http://jquery.com/
   *
   * Includes Sizzle.js
   * http://sizzlejs.com/
   *
   * Copyright 2012 jQuery Foundation and other contributors
   * Released under the MIT license
   * http://jquery.org/license
   *
   * Date: Tue Nov 13 2012 08:20:33 GMT-0500 (Eastern Standard Time)
   */
  (function( window, undefined ) {
  var
  	// A central reference to the root jQuery(document)
  	rootjQuery,
  
  	// The deferred used on DOM ready
  	readyList,
  
  	// Use the correct document accordingly with window argument (sandbox)
  	document = window.document,
  	location = window.location,
  	navigator = window.navigator,
  
  	// Map over jQuery in case of overwrite
  	_jQuery = window.jQuery,
  
  	// Map over the $ in case of overwrite
  	_$ = window.$,
  
  	// Save a reference to some core methods
  	core_push = Array.prototype.push,
  	core_slice = Array.prototype.slice,
  	core_indexOf = Array.prototype.indexOf,
  	core_toString = Object.prototype.toString,
  	core_hasOwn = Object.prototype.hasOwnProperty,
  	core_trim = String.prototype.trim,
  
  	// Define a local copy of jQuery
  	jQuery = function( selector, context ) {
  		// The jQuery object is actually just the init constructor 'enhanced'
  		return new jQuery.fn.init( selector, context, rootjQuery );
  	},
  
  	// Used for matching numbers
  	core_pnum = /[\-+]?(?:\d*\.|)\d+(?:[eE][\-+]?\d+|)/.source,
  
  	// Used for detecting and trimming whitespace
  	core_rnotwhite = /\S/,
  	core_rspace = /\s+/,
  
  	// Make sure we trim BOM and NBSP (here's looking at you, Safari 5.0 and IE)
  	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
  
  	// A simple way to check for HTML strings
  	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
  	rquickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,
  
  	// Match a standalone tag
  	rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
  
  	// JSON RegExp
  	rvalidchars = /^[\],:{}\s]*$/,
  	rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
  	rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
  	rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d\d*\.|)\d+(?:[eE][\-+]?\d+|)/g,
  
  	// Matches dashed string for camelizing
  	rmsPrefix = /^-ms-/,
  	rdashAlpha = /-([\da-z])/gi,
  
  	// Used by jQuery.camelCase as callback to replace()
  	fcamelCase = function( all, letter ) {
  		return ( letter + "" ).toUpperCase();
  	},
  
  	// The ready event handler and self cleanup method
  	DOMContentLoaded = function() {
  		if ( document.addEventListener ) {
  			document.removeEventListener( "DOMContentLoaded", DOMContentLoaded, false );
  			jQuery.ready();
  		} else if ( document.readyState === "complete" ) {
  			// we're here because readyState === "complete" in oldIE
  			// which is good enough for us to call the dom ready!
  			document.detachEvent( "onreadystatechange", DOMContentLoaded );
  			jQuery.ready();
  		}
  	},
  
  	// [[Class]] -> type pairs
  	class2type = {};
  
  jQuery.fn = jQuery.prototype = {
  	constructor: jQuery,
  	init: function( selector, context, rootjQuery ) {
  		var match, elem, ret, doc;
  
  		// Handle $(""), $(null), $(undefined), $(false)
  		if ( !selector ) {
  			return this;
  		}
  
  		// Handle $(DOMElement)
  		if ( selector.nodeType ) {
  			this.context = this[0] = selector;
  			this.length = 1;
  			return this;
  		}
  
  		// Handle HTML strings
  		if ( typeof selector === "string" ) {
  			if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
  				// Assume that strings that start and end with <> are HTML and skip the regex check
  				match = [ null, selector, null ];
  
  			} else {
  				match = rquickExpr.exec( selector );
  			}
  
  			// Match html or make sure no context is specified for #id
  			if ( match && (match[1] || !context) ) {
  
  				// HANDLE: $(html) -> $(array)
  				if ( match[1] ) {
  					context = context instanceof jQuery ? context[0] : context;
  					doc = ( context && context.nodeType ? context.ownerDocument || context : document );
  
  					// scripts is true for back-compat
  					selector = jQuery.parseHTML( match[1], doc, true );
  					if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
  						this.attr.call( selector, context, true );
  					}
  
  					return jQuery.merge( this, selector );
  
  				// HANDLE: $(#id)
  				} else {
  					elem = document.getElementById( match[2] );
  
  					// Check parentNode to catch when Blackberry 4.6 returns
  					// nodes that are no longer in the document #6963
  					if ( elem && elem.parentNode ) {
  						// Handle the case where IE and Opera return items
  						// by name instead of ID
  						if ( elem.id !== match[2] ) {
  							return rootjQuery.find( selector );
  						}
  
  						// Otherwise, we inject the element directly into the jQuery object
  						this.length = 1;
  						this[0] = elem;
  					}
  
  					this.context = document;
  					this.selector = selector;
  					return this;
  				}
  
  			// HANDLE: $(expr, $(...))
  			} else if ( !context || context.jquery ) {
  				return ( context || rootjQuery ).find( selector );
  
  			// HANDLE: $(expr, context)
  			// (which is just equivalent to: $(context).find(expr)
  			} else {
  				return this.constructor( context ).find( selector );
  			}
  
  		// HANDLE: $(function)
  		// Shortcut for document ready
  		} else if ( jQuery.isFunction( selector ) ) {
  			return rootjQuery.ready( selector );
  		}
  
  		if ( selector.selector !== undefined ) {
  			this.selector = selector.selector;
  			this.context = selector.context;
  		}
  
  		return jQuery.makeArray( selector, this );
  	},
  
  	// Start with an empty selector
  	selector: "",
  
  	// The current version of jQuery being used
  	jquery: "1.8.3",
  
  	// The default length of a jQuery object is 0
  	length: 0,
  
  	// The number of elements contained in the matched element set
  	size: function() {
  		return this.length;
  	},
  
  	toArray: function() {
  		return core_slice.call( this );
  	},
  
  	// Get the Nth element in the matched element set OR
  	// Get the whole matched element set as a clean array
  	get: function( num ) {
  		return num == null ?
  
  			// Return a 'clean' array
  			this.toArray() :
  
  			// Return just the object
  			( num < 0 ? this[ this.length + num ] : this[ num ] );
  	},
  
  	// Take an array of elements and push it onto the stack
  	// (returning the new matched element set)
  	pushStack: function( elems, name, selector ) {
  
  		// Build a new jQuery matched element set
  		var ret = jQuery.merge( this.constructor(), elems );
  
  		// Add the old object onto the stack (as a reference)
  		ret.prevObject = this;
  
  		ret.context = this.context;
  
  		if ( name === "find" ) {
  			ret.selector = this.selector + ( this.selector ? " " : "" ) + selector;
  		} else if ( name ) {
  			ret.selector = this.selector + "." + name + "(" + selector + ")";
  		}
  
  		// Return the newly-formed element set
  		return ret;
  	},
  
  	// Execute a callback for every element in the matched set.
  	// (You can seed the arguments with an array of args, but this is
  	// only used internally.)
  	each: function( callback, args ) {
  		return jQuery.each( this, callback, args );
  	},
  
  	ready: function( fn ) {
  		// Add the callback
  		jQuery.ready.promise().done( fn );
  
  		return this;
  	},
  
  	eq: function( i ) {
  		i = +i;
  		return i === -1 ?
  			this.slice( i ) :
  			this.slice( i, i + 1 );
  	},
  
  	first: function() {
  		return this.eq( 0 );
  	},
  
  	last: function() {
  		return this.eq( -1 );
  	},
  
  	slice: function() {
  		return this.pushStack( core_slice.apply( this, arguments ),
  			"slice", core_slice.call(arguments).join(",") );
  	},
  
  	map: function( callback ) {
  		return this.pushStack( jQuery.map(this, function( elem, i ) {
  			return callback.call( elem, i, elem );
  		}));
  	},
  
  	end: function() {
  		return this.prevObject || this.constructor(null);
  	},
  
  	// For internal use only.
  	// Behaves like an Array's method, not like a jQuery method.
  	push: core_push,
  	sort: [].sort,
  	splice: [].splice
  };
  
  // Give the init function the jQuery prototype for later instantiation
  jQuery.fn.init.prototype = jQuery.fn;
  
  jQuery.extend = jQuery.fn.extend = function() {
  	var options, name, src, copy, copyIsArray, clone,
  		target = arguments[0] || {},
  		i = 1,
  		length = arguments.length,
  		deep = false;
  
  	// Handle a deep copy situation
  	if ( typeof target === "boolean" ) {
  		deep = target;
  		target = arguments[1] || {};
  		// skip the boolean and the target
  		i = 2;
  	}
  
  	// Handle case when target is a string or something (possible in deep copy)
  	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
  		target = {};
  	}
  
  	// extend jQuery itself if only one argument is passed
  	if ( length === i ) {
  		target = this;
  		--i;
  	}
  
  	for ( ; i < length; i++ ) {
  		// Only deal with non-null/undefined values
  		if ( (options = arguments[ i ]) != null ) {
  			// Extend the base object
  			for ( name in options ) {
  				src = target[ name ];
  				copy = options[ name ];
  
  				// Prevent never-ending loop
  				if ( target === copy ) {
  					continue;
  				}
  
  				// Recurse if we're merging plain objects or arrays
  				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
  					if ( copyIsArray ) {
  						copyIsArray = false;
  						clone = src && jQuery.isArray(src) ? src : [];
  
  					} else {
  						clone = src && jQuery.isPlainObject(src) ? src : {};
  					}
  
  					// Never move original objects, clone them
  					target[ name ] = jQuery.extend( deep, clone, copy );
  
  				// Don't bring in undefined values
  				} else if ( copy !== undefined ) {
  					target[ name ] = copy;
  				}
  			}
  		}
  	}
  
  	// Return the modified object
  	return target;
  };
  
  jQuery.extend({
  	noConflict: function( deep ) {
  		if ( window.$ === jQuery ) {
  			window.$ = _$;
  		}
  
  		if ( deep && window.jQuery === jQuery ) {
  			window.jQuery = _jQuery;
  		}
  
  		return jQuery;
  	},
  
  	// Is the DOM ready to be used? Set to true once it occurs.
  	isReady: false,
  
  	// A counter to track how many items to wait for before
  	// the ready event fires. See #6781
  	readyWait: 1,
  
  	// Hold (or release) the ready event
  	holdReady: function( hold ) {
  		if ( hold ) {
  			jQuery.readyWait++;
  		} else {
  			jQuery.ready( true );
  		}
  	},
  
  	// Handle when the DOM is ready
  	ready: function( wait ) {
  
  		// Abort if there are pending holds or we're already ready
  		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
  			return;
  		}
  
  		// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
  		if ( !document.body ) {
  			return setTimeout( jQuery.ready, 1 );
  		}
  
  		// Remember that the DOM is ready
  		jQuery.isReady = true;
  
  		// If a normal DOM Ready event fired, decrement, and wait if need be
  		if ( wait !== true && --jQuery.readyWait > 0 ) {
  			return;
  		}
  
  		// If there are functions bound, to execute
  		readyList.resolveWith( document, [ jQuery ] );
  
  		// Trigger any bound ready events
  		if ( jQuery.fn.trigger ) {
  			jQuery( document ).trigger("ready").off("ready");
  		}
  	},
  
  	// See test/unit/core.js for details concerning isFunction.
  	// Since version 1.3, DOM methods and functions like alert
  	// aren't supported. They return false on IE (#2968).
  	isFunction: function( obj ) {
  		return jQuery.type(obj) === "function";
  	},
  
  	isArray: Array.isArray || function( obj ) {
  		return jQuery.type(obj) === "array";
  	},
  
  	isWindow: function( obj ) {
  		return obj != null && obj == obj.window;
  	},
  
  	isNumeric: function( obj ) {
  		return !isNaN( parseFloat(obj) ) && isFinite( obj );
  	},
  
  	type: function( obj ) {
  		return obj == null ?
  			String( obj ) :
  			class2type[ core_toString.call(obj) ] || "object";
  	},
  
  	isPlainObject: function( obj ) {
  		// Must be an Object.
  		// Because of IE, we also have to check the presence of the constructor property.
  		// Make sure that DOM nodes and window objects don't pass through, as well
  		if ( !obj || jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
  			return false;
  		}
  
  		try {
  			// Not own constructor property must be Object
  			if ( obj.constructor &&
  				!core_hasOwn.call(obj, "constructor") &&
  				!core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
  				return false;
  			}
  		} catch ( e ) {
  			// IE8,9 Will throw exceptions on certain host objects #9897
  			return false;
  		}
  
  		// Own properties are enumerated firstly, so to speed up,
  		// if last one is own, then all properties are own.
  
  		var key;
  		for ( key in obj ) {}
  
  		return key === undefined || core_hasOwn.call( obj, key );
  	},
  
  	isEmptyObject: function( obj ) {
  		var name;
  		for ( name in obj ) {
  			return false;
  		}
  		return true;
  	},
  
  	error: function( msg ) {
  		throw new Error( msg );
  	},
  
  	// data: string of html
  	// context (optional): If specified, the fragment will be created in this context, defaults to document
  	// scripts (optional): If true, will include scripts passed in the html string
  	parseHTML: function( data, context, scripts ) {
  		var parsed;
  		if ( !data || typeof data !== "string" ) {
  			return null;
  		}
  		if ( typeof context === "boolean" ) {
  			scripts = context;
  			context = 0;
  		}
  		context = context || document;
  
  		// Single tag
  		if ( (parsed = rsingleTag.exec( data )) ) {
  			return [ context.createElement( parsed[1] ) ];
  		}
  
  		parsed = jQuery.buildFragment( [ data ], context, scripts ? null : [] );
  		return jQuery.merge( [],
  			(parsed.cacheable ? jQuery.clone( parsed.fragment ) : parsed.fragment).childNodes );
  	},
  
  	parseJSON: function( data ) {
  		if ( !data || typeof data !== "string") {
  			return null;
  		}
  
  		// Make sure leading/trailing whitespace is removed (IE can't handle it)
  		data = jQuery.trim( data );
  
  		// Attempt to parse using the native JSON parser first
  		if ( window.JSON && window.JSON.parse ) {
  			return window.JSON.parse( data );
  		}
  
  		// Make sure the incoming data is actual JSON
  		// Logic borrowed from http://json.org/json2.js
  		if ( rvalidchars.test( data.replace( rvalidescape, "@" )
  			.replace( rvalidtokens, "]" )
  			.replace( rvalidbraces, "")) ) {
  
  			return ( new Function( "return " + data ) )();
  
  		}
  		jQuery.error( "Invalid JSON: " + data );
  	},
  
  	// Cross-browser xml parsing
  	parseXML: function( data ) {
  		var xml, tmp;
  		if ( !data || typeof data !== "string" ) {
  			return null;
  		}
  		try {
  			if ( window.DOMParser ) { // Standard
  				tmp = new DOMParser();
  				xml = tmp.parseFromString( data , "text/xml" );
  			} else { // IE
  				xml = new ActiveXObject( "Microsoft.XMLDOM" );
  				xml.async = "false";
  				xml.loadXML( data );
  			}
  		} catch( e ) {
  			xml = undefined;
  		}
  		if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
  			jQuery.error( "Invalid XML: " + data );
  		}
  		return xml;
  	},
  
  	noop: function() {},
  
  	// Evaluates a script in a global context
  	// Workarounds based on findings by Jim Driscoll
  	// http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
  	globalEval: function( data ) {
  		if ( data && core_rnotwhite.test( data ) ) {
  			// We use execScript on Internet Explorer
  			// We use an anonymous function so that context is window
  			// rather than jQuery in Firefox
  			( window.execScript || function( data ) {
  				window[ "eval" ].call( window, data );
  			} )( data );
  		}
  	},
  
  	// Convert dashed to camelCase; used by the css and data modules
  	// Microsoft forgot to hump their vendor prefix (#9572)
  	camelCase: function( string ) {
  		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
  	},
  
  	nodeName: function( elem, name ) {
  		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
  	},
  
  	// args is for internal usage only
  	each: function( obj, callback, args ) {
  		var name,
  			i = 0,
  			length = obj.length,
  			isObj = length === undefined || jQuery.isFunction( obj );
  
  		if ( args ) {
  			if ( isObj ) {
  				for ( name in obj ) {
  					if ( callback.apply( obj[ name ], args ) === false ) {
  						break;
  					}
  				}
  			} else {
  				for ( ; i < length; ) {
  					if ( callback.apply( obj[ i++ ], args ) === false ) {
  						break;
  					}
  				}
  			}
  
  		// A special, fast, case for the most common use of each
  		} else {
  			if ( isObj ) {
  				for ( name in obj ) {
  					if ( callback.call( obj[ name ], name, obj[ name ] ) === false ) {
  						break;
  					}
  				}
  			} else {
  				for ( ; i < length; ) {
  					if ( callback.call( obj[ i ], i, obj[ i++ ] ) === false ) {
  						break;
  					}
  				}
  			}
  		}
  
  		return obj;
  	},
  
  	// Use native String.trim function wherever possible
  	trim: core_trim && !core_trim.call("\uFEFF\xA0") ?
  		function( text ) {
  			return text == null ?
  				"" :
  				core_trim.call( text );
  		} :
  
  		// Otherwise use our own trimming functionality
  		function( text ) {
  			return text == null ?
  				"" :
  				( text + "" ).replace( rtrim, "" );
  		},
  
  	// results is for internal usage only
  	makeArray: function( arr, results ) {
  		var type,
  			ret = results || [];
  
  		if ( arr != null ) {
  			// The window, strings (and functions) also have 'length'
  			// Tweaked logic slightly to handle Blackberry 4.7 RegExp issues #6930
  			type = jQuery.type( arr );
  
  			if ( arr.length == null || type === "string" || type === "function" || type === "regexp" || jQuery.isWindow( arr ) ) {
  				core_push.call( ret, arr );
  			} else {
  				jQuery.merge( ret, arr );
  			}
  		}
  
  		return ret;
  	},
  
  	inArray: function( elem, arr, i ) {
  		var len;
  
  		if ( arr ) {
  			if ( core_indexOf ) {
  				return core_indexOf.call( arr, elem, i );
  			}
  
  			len = arr.length;
  			i = i ? i < 0 ? Math.max( 0, len + i ) : i : 0;
  
  			for ( ; i < len; i++ ) {
  				// Skip accessing in sparse arrays
  				if ( i in arr && arr[ i ] === elem ) {
  					return i;
  				}
  			}
  		}
  
  		return -1;
  	},
  
  	merge: function( first, second ) {
  		var l = second.length,
  			i = first.length,
  			j = 0;
  
  		if ( typeof l === "number" ) {
  			for ( ; j < l; j++ ) {
  				first[ i++ ] = second[ j ];
  			}
  
  		} else {
  			while ( second[j] !== undefined ) {
  				first[ i++ ] = second[ j++ ];
  			}
  		}
  
  		first.length = i;
  
  		return first;
  	},
  
  	grep: function( elems, callback, inv ) {
  		var retVal,
  			ret = [],
  			i = 0,
  			length = elems.length;
  		inv = !!inv;
  
  		// Go through the array, only saving the items
  		// that pass the validator function
  		for ( ; i < length; i++ ) {
  			retVal = !!callback( elems[ i ], i );
  			if ( inv !== retVal ) {
  				ret.push( elems[ i ] );
  			}
  		}
  
  		return ret;
  	},
  
  	// arg is for internal usage only
  	map: function( elems, callback, arg ) {
  		var value, key,
  			ret = [],
  			i = 0,
  			length = elems.length,
  			// jquery objects are treated as arrays
  			isArray = elems instanceof jQuery || length !== undefined && typeof length === "number" && ( ( length > 0 && elems[ 0 ] && elems[ length -1 ] ) || length === 0 || jQuery.isArray( elems ) ) ;
  
  		// Go through the array, translating each of the items to their
  		if ( isArray ) {
  			for ( ; i < length; i++ ) {
  				value = callback( elems[ i ], i, arg );
  
  				if ( value != null ) {
  					ret[ ret.length ] = value;
  				}
  			}
  
  		// Go through every key on the object,
  		} else {
  			for ( key in elems ) {
  				value = callback( elems[ key ], key, arg );
  
  				if ( value != null ) {
  					ret[ ret.length ] = value;
  				}
  			}
  		}
  
  		// Flatten any nested arrays
  		return ret.concat.apply( [], ret );
  	},
  
  	// A global GUID counter for objects
  	guid: 1,
  
  	// Bind a function to a context, optionally partially applying any
  	// arguments.
  	proxy: function( fn, context ) {
  		var tmp, args, proxy;
  
  		if ( typeof context === "string" ) {
  			tmp = fn[ context ];
  			context = fn;
  			fn = tmp;
  		}
  
  		// Quick check to determine if target is callable, in the spec
  		// this throws a TypeError, but we will just return undefined.
  		if ( !jQuery.isFunction( fn ) ) {
  			return undefined;
  		}
  
  		// Simulated bind
  		args = core_slice.call( arguments, 2 );
  		proxy = function() {
  			return fn.apply( context, args.concat( core_slice.call( arguments ) ) );
  		};
  
  		// Set the guid of unique handler to the same of original handler, so it can be removed
  		proxy.guid = fn.guid = fn.guid || jQuery.guid++;
  
  		return proxy;
  	},
  
  	// Multifunctional method to get and set values of a collection
  	// The value/s can optionally be executed if it's a function
  	access: function( elems, fn, key, value, chainable, emptyGet, pass ) {
  		var exec,
  			bulk = key == null,
  			i = 0,
  			length = elems.length;
  
  		// Sets many values
  		if ( key && typeof key === "object" ) {
  			for ( i in key ) {
  				jQuery.access( elems, fn, i, key[i], 1, emptyGet, value );
  			}
  			chainable = 1;
  
  		// Sets one value
  		} else if ( value !== undefined ) {
  			// Optionally, function values get executed if exec is true
  			exec = pass === undefined && jQuery.isFunction( value );
  
  			if ( bulk ) {
  				// Bulk operations only iterate when executing function values
  				if ( exec ) {
  					exec = fn;
  					fn = function( elem, key, value ) {
  						return exec.call( jQuery( elem ), value );
  					};
  
  				// Otherwise they run against the entire set
  				} else {
  					fn.call( elems, value );
  					fn = null;
  				}
  			}
  
  			if ( fn ) {
  				for (; i < length; i++ ) {
  					fn( elems[i], key, exec ? value.call( elems[i], i, fn( elems[i], key ) ) : value, pass );
  				}
  			}
  
  			chainable = 1;
  		}
  
  		return chainable ?
  			elems :
  
  			// Gets
  			bulk ?
  				fn.call( elems ) :
  				length ? fn( elems[0], key ) : emptyGet;
  	},
  
  	now: function() {
  		return ( new Date() ).getTime();
  	}
  });
  
  jQuery.ready.promise = function( obj ) {
  	if ( !readyList ) {
  
  		readyList = jQuery.Deferred();
  
  		// Catch cases where $(document).ready() is called after the browser event has already occurred.
  		// we once tried to use readyState "interactive" here, but it caused issues like the one
  		// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
  		if ( document.readyState === "complete" ) {
  			// Handle it asynchronously to allow scripts the opportunity to delay ready
  			setTimeout( jQuery.ready, 1 );
  
  		// Standards-based browsers support DOMContentLoaded
  		} else if ( document.addEventListener ) {
  			// Use the handy event callback
  			document.addEventListener( "DOMContentLoaded", DOMContentLoaded, false );
  
  			// A fallback to window.onload, that will always work
  			window.addEventListener( "load", jQuery.ready, false );
  
  		// If IE event model is used
  		} else {
  			// Ensure firing before onload, maybe late but safe also for iframes
  			document.attachEvent( "onreadystatechange", DOMContentLoaded );
  
  			// A fallback to window.onload, that will always work
  			window.attachEvent( "onload", jQuery.ready );
  
  			// If IE and not a frame
  			// continually check to see if the document is ready
  			var top = false;
  
  			try {
  				top = window.frameElement == null && document.documentElement;
  			} catch(e) {}
  
  			if ( top && top.doScroll ) {
  				(function doScrollCheck() {
  					if ( !jQuery.isReady ) {
  
  						try {
  							// Use the trick by Diego Perini
  							// http://javascript.nwbox.com/IEContentLoaded/
  							top.doScroll("left");
  						} catch(e) {
  							return setTimeout( doScrollCheck, 50 );
  						}
  
  						// and execute any waiting functions
  						jQuery.ready();
  					}
  				})();
  			}
  		}
  	}
  	return readyList.promise( obj );
  };
  
  // Populate the class2type map
  jQuery.each("Boolean Number String Function Array Date RegExp Object".split(" "), function(i, name) {
  	class2type[ "[object " + name + "]" ] = name.toLowerCase();
  });
  
  // All jQuery objects should point back to these
  rootjQuery = jQuery(document);
  // String to Object options format cache
  var optionsCache = {};
  
  // Convert String-formatted options into Object-formatted ones and store in cache
  function createOptions( options ) {
  	var object = optionsCache[ options ] = {};
  	jQuery.each( options.split( core_rspace ), function( _, flag ) {
  		object[ flag ] = true;
  	});
  	return object;
  }
  
  /*
   * Create a callback list using the following parameters:
   *
   *	options: an optional list of space-separated options that will change how
   *			the callback list behaves or a more traditional option object
   *
   * By default a callback list will act like an event callback list and can be
   * "fired" multiple times.
   *
   * Possible options:
   *
   *	once:			will ensure the callback list can only be fired once (like a Deferred)
   *
   *	memory:			will keep track of previous values and will call any callback added
   *					after the list has been fired right away with the latest "memorized"
   *					values (like a Deferred)
   *
   *	unique:			will ensure a callback can only be added once (no duplicate in the list)
   *
   *	stopOnFalse:	interrupt callings when a callback returns false
   *
   */
  jQuery.Callbacks = function( options ) {
  
  	// Convert options from String-formatted to Object-formatted if needed
  	// (we check in cache first)
  	options = typeof options === "string" ?
  		( optionsCache[ options ] || createOptions( options ) ) :
  		jQuery.extend( {}, options );
  
  	var // Last fire value (for non-forgettable lists)
  		memory,
  		// Flag to know if list was already fired
  		fired,
  		// Flag to know if list is currently firing
  		firing,
  		// First callback to fire (used internally by add and fireWith)
  		firingStart,
  		// End of the loop when firing
  		firingLength,
  		// Index of currently firing callback (modified by remove if needed)
  		firingIndex,
  		// Actual callback list
  		list = [],
  		// Stack of fire calls for repeatable lists
  		stack = !options.once && [],
  		// Fire callbacks
  		fire = function( data ) {
  			memory = options.memory && data;
  			fired = true;
  			firingIndex = firingStart || 0;
  			firingStart = 0;
  			firingLength = list.length;
  			firing = true;
  			for ( ; list && firingIndex < firingLength; firingIndex++ ) {
  				if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
  					memory = false; // To prevent further calls using add
  					break;
  				}
  			}
  			firing = false;
  			if ( list ) {
  				if ( stack ) {
  					if ( stack.length ) {
  						fire( stack.shift() );
  					}
  				} else if ( memory ) {
  					list = [];
  				} else {
  					self.disable();
  				}
  			}
  		},
  		// Actual Callbacks object
  		self = {
  			// Add a callback or a collection of callbacks to the list
  			add: function() {
  				if ( list ) {
  					// First, we save the current length
  					var start = list.length;
  					(function add( args ) {
  						jQuery.each( args, function( _, arg ) {
  							var type = jQuery.type( arg );
  							if ( type === "function" ) {
  								if ( !options.unique || !self.has( arg ) ) {
  									list.push( arg );
  								}
  							} else if ( arg && arg.length && type !== "string" ) {
  								// Inspect recursively
  								add( arg );
  							}
  						});
  					})( arguments );
  					// Do we need to add the callbacks to the
  					// current firing batch?
  					if ( firing ) {
  						firingLength = list.length;
  					// With memory, if we're not firing then
  					// we should call right away
  					} else if ( memory ) {
  						firingStart = start;
  						fire( memory );
  					}
  				}
  				return this;
  			},
  			// Remove a callback from the list
  			remove: function() {
  				if ( list ) {
  					jQuery.each( arguments, function( _, arg ) {
  						var index;
  						while( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
  							list.splice( index, 1 );
  							// Handle firing indexes
  							if ( firing ) {
  								if ( index <= firingLength ) {
  									firingLength--;
  								}
  								if ( index <= firingIndex ) {
  									firingIndex--;
  								}
  							}
  						}
  					});
  				}
  				return this;
  			},
  			// Control if a given callback is in the list
  			has: function( fn ) {
  				return jQuery.inArray( fn, list ) > -1;
  			},
  			// Remove all callbacks from the list
  			empty: function() {
  				list = [];
  				return this;
  			},
  			// Have the list do nothing anymore
  			disable: function() {
  				list = stack = memory = undefined;
  				return this;
  			},
  			// Is it disabled?
  			disabled: function() {
  				return !list;
  			},
  			// Lock the list in its current state
  			lock: function() {
  				stack = undefined;
  				if ( !memory ) {
  					self.disable();
  				}
  				return this;
  			},
  			// Is it locked?
  			locked: function() {
  				return !stack;
  			},
  			// Call all callbacks with the given context and arguments
  			fireWith: function( context, args ) {
  				args = args || [];
  				args = [ context, args.slice ? args.slice() : args ];
  				if ( list && ( !fired || stack ) ) {
  					if ( firing ) {
  						stack.push( args );
  					} else {
  						fire( args );
  					}
  				}
  				return this;
  			},
  			// Call all the callbacks with the given arguments
  			fire: function() {
  				self.fireWith( this, arguments );
  				return this;
  			},
  			// To know if the callbacks have already been called at least once
  			fired: function() {
  				return !!fired;
  			}
  		};
  
  	return self;
  };
  jQuery.extend({
  
  	Deferred: function( func ) {
  		var tuples = [
  				// action, add listener, listener list, final state
  				[ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
  				[ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
  				[ "notify", "progress", jQuery.Callbacks("memory") ]
  			],
  			state = "pending",
  			promise = {
  				state: function() {
  					return state;
  				},
  				always: function() {
  					deferred.done( arguments ).fail( arguments );
  					return this;
  				},
  				then: function( /* fnDone, fnFail, fnProgress */ ) {
  					var fns = arguments;
  					return jQuery.Deferred(function( newDefer ) {
  						jQuery.each( tuples, function( i, tuple ) {
  							var action = tuple[ 0 ],
  								fn = fns[ i ];
  							// deferred[ done | fail | progress ] for forwarding actions to newDefer
  							deferred[ tuple[1] ]( jQuery.isFunction( fn ) ?
  								function() {
  									var returned = fn.apply( this, arguments );
  									if ( returned && jQuery.isFunction( returned.promise ) ) {
  										returned.promise()
  											.done( newDefer.resolve )
  											.fail( newDefer.reject )
  											.progress( newDefer.notify );
  									} else {
  										newDefer[ action + "With" ]( this === deferred ? newDefer : this, [ returned ] );
  									}
  								} :
  								newDefer[ action ]
  							);
  						});
  						fns = null;
  					}).promise();
  				},
  				// Get a promise for this deferred
  				// If obj is provided, the promise aspect is added to the object
  				promise: function( obj ) {
  					return obj != null ? jQuery.extend( obj, promise ) : promise;
  				}
  			},
  			deferred = {};
  
  		// Keep pipe for back-compat
  		promise.pipe = promise.then;
  
  		// Add list-specific methods
  		jQuery.each( tuples, function( i, tuple ) {
  			var list = tuple[ 2 ],
  				stateString = tuple[ 3 ];
  
  			// promise[ done | fail | progress ] = list.add
  			promise[ tuple[1] ] = list.add;
  
  			// Handle state
  			if ( stateString ) {
  				list.add(function() {
  					// state = [ resolved | rejected ]
  					state = stateString;
  
  				// [ reject_list | resolve_list ].disable; progress_list.lock
  				}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
  			}
  
  			// deferred[ resolve | reject | notify ] = list.fire
  			deferred[ tuple[0] ] = list.fire;
  			deferred[ tuple[0] + "With" ] = list.fireWith;
  		});
  
  		// Make the deferred a promise
  		promise.promise( deferred );
  
  		// Call given func if any
  		if ( func ) {
  			func.call( deferred, deferred );
  		}
  
  		// All done!
  		return deferred;
  	},
  
  	// Deferred helper
  	when: function( subordinate /* , ..., subordinateN */ ) {
  		var i = 0,
  			resolveValues = core_slice.call( arguments ),
  			length = resolveValues.length,
  
  			// the count of uncompleted subordinates
  			remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,
  
  			// the master Deferred. If resolveValues consist of only a single Deferred, just use that.
  			deferred = remaining === 1 ? subordinate : jQuery.Deferred(),
  
  			// Update function for both resolve and progress values
  			updateFunc = function( i, contexts, values ) {
  				return function( value ) {
  					contexts[ i ] = this;
  					values[ i ] = arguments.length > 1 ? core_slice.call( arguments ) : value;
  					if( values === progressValues ) {
  						deferred.notifyWith( contexts, values );
  					} else if ( !( --remaining ) ) {
  						deferred.resolveWith( contexts, values );
  					}
  				};
  			},
  
  			progressValues, progressContexts, resolveContexts;
  
  		// add listeners to Deferred subordinates; treat others as resolved
  		if ( length > 1 ) {
  			progressValues = new Array( length );
  			progressContexts = new Array( length );
  			resolveContexts = new Array( length );
  			for ( ; i < length; i++ ) {
  				if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
  					resolveValues[ i ].promise()
  						.done( updateFunc( i, resolveContexts, resolveValues ) )
  						.fail( deferred.reject )
  						.progress( updateFunc( i, progressContexts, progressValues ) );
  				} else {
  					--remaining;
  				}
  			}
  		}
  
  		// if we're not waiting on anything, resolve the master
  		if ( !remaining ) {
  			deferred.resolveWith( resolveContexts, resolveValues );
  		}
  
  		return deferred.promise();
  	}
  });
  jQuery.support = (function() {
  
  	var support,
  		all,
  		a,
  		select,
  		opt,
  		input,
  		fragment,
  		eventName,
  		i,
  		isSupported,
  		clickFn,
  		div = document.createElement("div");
  
  	// Setup
  	div.setAttribute( "className", "t" );
  	div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";
  
  	// Support tests won't run in some limited or non-browser environments
  	all = div.getElementsByTagName("*");
  	a = div.getElementsByTagName("a")[ 0 ];
  	if ( !all || !a || !all.length ) {
  		return {};
  	}
  
  	// First batch of tests
  	select = document.createElement("select");
  	opt = select.appendChild( document.createElement("option") );
  	input = div.getElementsByTagName("input")[ 0 ];
  
  	a.style.cssText = "top:1px;float:left;opacity:.5";
  	support = {
  		// IE strips leading whitespace when .innerHTML is used
  		leadingWhitespace: ( div.firstChild.nodeType === 3 ),
  
  		// Make sure that tbody elements aren't automatically inserted
  		// IE will insert them into empty tables
  		tbody: !div.getElementsByTagName("tbody").length,
  
  		// Make sure that link elements get serialized correctly by innerHTML
  		// This requires a wrapper element in IE
  		htmlSerialize: !!div.getElementsByTagName("link").length,
  
  		// Get the style information from getAttribute
  		// (IE uses .cssText instead)
  		style: /top/.test( a.getAttribute("style") ),
  
  		// Make sure that URLs aren't manipulated
  		// (IE normalizes it by default)
  		hrefNormalized: ( a.getAttribute("href") === "/a" ),
  
  		// Make sure that element opacity exists
  		// (IE uses filter instead)
  		// Use a regex to work around a WebKit issue. See #5145
  		opacity: /^0.5/.test( a.style.opacity ),
  
  		// Verify style float existence
  		// (IE uses styleFloat instead of cssFloat)
  		cssFloat: !!a.style.cssFloat,
  
  		// Make sure that if no value is specified for a checkbox
  		// that it defaults to "on".
  		// (WebKit defaults to "" instead)
  		checkOn: ( input.value === "on" ),
  
  		// Make sure that a selected-by-default option has a working selected property.
  		// (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
  		optSelected: opt.selected,
  
  		// Test setAttribute on camelCase class. If it works, we need attrFixes when doing get/setAttribute (ie6/7)
  		getSetAttribute: div.className !== "t",
  
  		// Tests for enctype support on a form (#6743)
  		enctype: !!document.createElement("form").enctype,
  
  		// Makes sure cloning an html5 element does not cause problems
  		// Where outerHTML is undefined, this still works
  		html5Clone: document.createElement("nav").cloneNode( true ).outerHTML !== "<:nav></:nav>",
  
  		// jQuery.support.boxModel DEPRECATED in 1.8 since we don't support Quirks Mode
  		boxModel: ( document.compatMode === "CSS1Compat" ),
  
  		// Will be defined later
  		submitBubbles: true,
  		changeBubbles: true,
  		focusinBubbles: false,
  		deleteExpando: true,
  		noCloneEvent: true,
  		inlineBlockNeedsLayout: false,
  		shrinkWrapBlocks: false,
  		reliableMarginRight: true,
  		boxSizingReliable: true,
  		pixelPosition: false
  	};
  
  	// Make sure checked status is properly cloned
  	input.checked = true;
  	support.noCloneChecked = input.cloneNode( true ).checked;
  
  	// Make sure that the options inside disabled selects aren't marked as disabled
  	// (WebKit marks them as disabled)
  	select.disabled = true;
  	support.optDisabled = !opt.disabled;
  
  	// Test to see if it's possible to delete an expando from an element
  	// Fails in Internet Explorer
  	try {
  		delete div.test;
  	} catch( e ) {
  		support.deleteExpando = false;
  	}
  
  	if ( !div.addEventListener && div.attachEvent && div.fireEvent ) {
  		div.attachEvent( "onclick", clickFn = function() {
  			// Cloning a node shouldn't copy over any
  			// bound event handlers (IE does this)
  			support.noCloneEvent = false;
  		});
  		div.cloneNode( true ).fireEvent("onclick");
  		div.detachEvent( "onclick", clickFn );
  	}
  
  	// Check if a radio maintains its value
  	// after being appended to the DOM
  	input = document.createElement("input");
  	input.value = "t";
  	input.setAttribute( "type", "radio" );
  	support.radioValue = input.value === "t";
  
  	input.setAttribute( "checked", "checked" );
  
  	// #11217 - WebKit loses check when the name is after the checked attribute
  	input.setAttribute( "name", "t" );
  
  	div.appendChild( input );
  	fragment = document.createDocumentFragment();
  	fragment.appendChild( div.lastChild );
  
  	// WebKit doesn't clone checked state correctly in fragments
  	support.checkClone = fragment.cloneNode( true ).cloneNode( true ).lastChild.checked;
  
  	// Check if a disconnected checkbox will retain its checked
  	// value of true after appended to the DOM (IE6/7)
  	support.appendChecked = input.checked;
  
  	fragment.removeChild( input );
  	fragment.appendChild( div );
  
  	// Technique from Juriy Zaytsev
  	// http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
  	// We only care about the case where non-standard event systems
  	// are used, namely in IE. Short-circuiting here helps us to
  	// avoid an eval call (in setAttribute) which can cause CSP
  	// to go haywire. See: https://developer.mozilla.org/en/Security/CSP
  	if ( div.attachEvent ) {
  		for ( i in {
  			submit: true,
  			change: true,
  			focusin: true
  		}) {
  			eventName = "on" + i;
  			isSupported = ( eventName in div );
  			if ( !isSupported ) {
  				div.setAttribute( eventName, "return;" );
  				isSupported = ( typeof div[ eventName ] === "function" );
  			}
  			support[ i + "Bubbles" ] = isSupported;
  		}
  	}
  
  	// Run tests that need a body at doc ready
  	jQuery(function() {
  		var container, div, tds, marginDiv,
  			divReset = "padding:0;margin:0;border:0;display:block;overflow:hidden;",
  			body = document.getElementsByTagName("body")[0];
  
  		if ( !body ) {
  			// Return for frameset docs that don't have a body
  			return;
  		}
  
  		container = document.createElement("div");
  		container.style.cssText = "visibility:hidden;border:0;width:0;height:0;position:static;top:0;margin-top:1px";
  		body.insertBefore( container, body.firstChild );
  
  		// Construct the test element
  		div = document.createElement("div");
  		container.appendChild( div );
  
  		// Check if table cells still have offsetWidth/Height when they are set
  		// to display:none and there are still other visible table cells in a
  		// table row; if so, offsetWidth/Height are not reliable for use when
  		// determining if an element has been hidden directly using
  		// display:none (it is still safe to use offsets if a parent element is
  		// hidden; don safety goggles and see bug #4512 for more information).
  		// (only IE 8 fails this test)
  		div.innerHTML = "<table><tr><td></td><td>t</td></tr></table>";
  		tds = div.getElementsByTagName("td");
  		tds[ 0 ].style.cssText = "padding:0;margin:0;border:0;display:none";
  		isSupported = ( tds[ 0 ].offsetHeight === 0 );
  
  		tds[ 0 ].style.display = "";
  		tds[ 1 ].style.display = "none";
  
  		// Check if empty table cells still have offsetWidth/Height
  		// (IE <= 8 fail this test)
  		support.reliableHiddenOffsets = isSupported && ( tds[ 0 ].offsetHeight === 0 );
  
  		// Check box-sizing and margin behavior
  		div.innerHTML = "";
  		div.style.cssText = "box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;";
  		support.boxSizing = ( div.offsetWidth === 4 );
  		support.doesNotIncludeMarginInBodyOffset = ( body.offsetTop !== 1 );
  
  		// NOTE: To any future maintainer, we've window.getComputedStyle
  		// because jsdom on node.js will break without it.
  		if ( window.getComputedStyle ) {
  			support.pixelPosition = ( window.getComputedStyle( div, null ) || {} ).top !== "1%";
  			support.boxSizingReliable = ( window.getComputedStyle( div, null ) || { width: "4px" } ).width === "4px";
  
  			// Check if div with explicit width and no margin-right incorrectly
  			// gets computed margin-right based on width of container. For more
  			// info see bug #3333
  			// Fails in WebKit before Feb 2011 nightlies
  			// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
  			marginDiv = document.createElement("div");
  			marginDiv.style.cssText = div.style.cssText = divReset;
  			marginDiv.style.marginRight = marginDiv.style.width = "0";
  			div.style.width = "1px";
  			div.appendChild( marginDiv );
  			support.reliableMarginRight =
  				!parseFloat( ( window.getComputedStyle( marginDiv, null ) || {} ).marginRight );
  		}
  
  		if ( typeof div.style.zoom !== "undefined" ) {
  			// Check if natively block-level elements act like inline-block
  			// elements when setting their display to 'inline' and giving
  			// them layout
  			// (IE < 8 does this)
  			div.innerHTML = "";
  			div.style.cssText = divReset + "width:1px;padding:1px;display:inline;zoom:1";
  			support.inlineBlockNeedsLayout = ( div.offsetWidth === 3 );
  
  			// Check if elements with layout shrink-wrap their children
  			// (IE 6 does this)
  			div.style.display = "block";
  			div.style.overflow = "visible";
  			div.innerHTML = "<div></div>";
  			div.firstChild.style.width = "5px";
  			support.shrinkWrapBlocks = ( div.offsetWidth !== 3 );
  
  			container.style.zoom = 1;
  		}
  
  		// Null elements to avoid leaks in IE
  		body.removeChild( container );
  		container = div = tds = marginDiv = null;
  	});
  
  	// Null elements to avoid leaks in IE
  	fragment.removeChild( div );
  	all = a = select = opt = input = fragment = div = null;
  
  	return support;
  })();
  var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
  	rmultiDash = /([A-Z])/g;
  
  jQuery.extend({
  	cache: {},
  
  	deletedIds: [],
  
  	// Remove at next major release (1.9/2.0)
  	uuid: 0,
  
  	// Unique for each copy of jQuery on the page
  	// Non-digits removed to match rinlinejQuery
  	expando: "jQuery" + ( jQuery.fn.jquery + Math.random() ).replace( /\D/g, "" ),
  
  	// The following elements throw uncatchable exceptions if you
  	// attempt to add expando properties to them.
  	noData: {
  		"embed": true,
  		// Ban all objects except for Flash (which handle expandos)
  		"object": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
  		"applet": true
  	},
  
  	hasData: function( elem ) {
  		elem = elem.nodeType ? jQuery.cache[ elem[jQuery.expando] ] : elem[ jQuery.expando ];
  		return !!elem && !isEmptyDataObject( elem );
  	},
  
  	data: function( elem, name, data, pvt /* Internal Use Only */ ) {
  		if ( !jQuery.acceptData( elem ) ) {
  			return;
  		}
  
  		var thisCache, ret,
  			internalKey = jQuery.expando,
  			getByName = typeof name === "string",
  
  			// We have to handle DOM nodes and JS objects differently because IE6-7
  			// can't GC object references properly across the DOM-JS boundary
  			isNode = elem.nodeType,
  
  			// Only DOM nodes need the global jQuery cache; JS object data is
  			// attached directly to the object so GC can occur automatically
  			cache = isNode ? jQuery.cache : elem,
  
  			// Only defining an ID for JS objects if its cache already exists allows
  			// the code to shortcut on the same path as a DOM node with no cache
  			id = isNode ? elem[ internalKey ] : elem[ internalKey ] && internalKey;
  
  		// Avoid doing any more work than we need to when trying to get data on an
  		// object that has no data at all
  		if ( (!id || !cache[id] || (!pvt && !cache[id].data)) && getByName && data === undefined ) {
  			return;
  		}
  
  		if ( !id ) {
  			// Only DOM nodes need a new unique ID for each element since their data
  			// ends up in the global cache
  			if ( isNode ) {
  				elem[ internalKey ] = id = jQuery.deletedIds.pop() || jQuery.guid++;
  			} else {
  				id = internalKey;
  			}
  		}
  
  		if ( !cache[ id ] ) {
  			cache[ id ] = {};
  
  			// Avoids exposing jQuery metadata on plain JS objects when the object
  			// is serialized using JSON.stringify
  			if ( !isNode ) {
  				cache[ id ].toJSON = jQuery.noop;
  			}
  		}
  
  		// An object can be passed to jQuery.data instead of a key/value pair; this gets
  		// shallow copied over onto the existing cache
  		if ( typeof name === "object" || typeof name === "function" ) {
  			if ( pvt ) {
  				cache[ id ] = jQuery.extend( cache[ id ], name );
  			} else {
  				cache[ id ].data = jQuery.extend( cache[ id ].data, name );
  			}
  		}
  
  		thisCache = cache[ id ];
  
  		// jQuery data() is stored in a separate object inside the object's internal data
  		// cache in order to avoid key collisions between internal data and user-defined
  		// data.
  		if ( !pvt ) {
  			if ( !thisCache.data ) {
  				thisCache.data = {};
  			}
  
  			thisCache = thisCache.data;
  		}
  
  		if ( data !== undefined ) {
  			thisCache[ jQuery.camelCase( name ) ] = data;
  		}
  
  		// Check for both converted-to-camel and non-converted data property names
  		// If a data property was specified
  		if ( getByName ) {
  
  			// First Try to find as-is property data
  			ret = thisCache[ name ];
  
  			// Test for null|undefined property data
  			if ( ret == null ) {
  
  				// Try to find the camelCased property
  				ret = thisCache[ jQuery.camelCase( name ) ];
  			}
  		} else {
  			ret = thisCache;
  		}
  
  		return ret;
  	},
  
  	removeData: function( elem, name, pvt /* Internal Use Only */ ) {
  		if ( !jQuery.acceptData( elem ) ) {
  			return;
  		}
  
  		var thisCache, i, l,
  
  			isNode = elem.nodeType,
  
  			// See jQuery.data for more information
  			cache = isNode ? jQuery.cache : elem,
  			id = isNode ? elem[ jQuery.expando ] : jQuery.expando;
  
  		// If there is already no cache entry for this object, there is no
  		// purpose in continuing
  		if ( !cache[ id ] ) {
  			return;
  		}
  
  		if ( name ) {
  
  			thisCache = pvt ? cache[ id ] : cache[ id ].data;
  
  			if ( thisCache ) {
  
  				// Support array or space separated string names for data keys
  				if ( !jQuery.isArray( name ) ) {
  
  					// try the string as a key before any manipulation
  					if ( name in thisCache ) {
  						name = [ name ];
  					} else {
  
  						// split the camel cased version by spaces unless a key with the spaces exists
  						name = jQuery.camelCase( name );
  						if ( name in thisCache ) {
  							name = [ name ];
  						} else {
  							name = name.split(" ");
  						}
  					}
  				}
  
  				for ( i = 0, l = name.length; i < l; i++ ) {
  					delete thisCache[ name[i] ];
  				}
  
  				// If there is no data left in the cache, we want to continue
  				// and let the cache object itself get destroyed
  				if ( !( pvt ? isEmptyDataObject : jQuery.isEmptyObject )( thisCache ) ) {
  					return;
  				}
  			}
  		}
  
  		// See jQuery.data for more information
  		if ( !pvt ) {
  			delete cache[ id ].data;
  
  			// Don't destroy the parent cache unless the internal data object
  			// had been the only thing left in it
  			if ( !isEmptyDataObject( cache[ id ] ) ) {
  				return;
  			}
  		}
  
  		// Destroy the cache
  		if ( isNode ) {
  			jQuery.cleanData( [ elem ], true );
  
  		// Use delete when supported for expandos or `cache` is not a window per isWindow (#10080)
  		} else if ( jQuery.support.deleteExpando || cache != cache.window ) {
  			delete cache[ id ];
  
  		// When all else fails, null
  		} else {
  			cache[ id ] = null;
  		}
  	},
  
  	// For internal use only.
  	_data: function( elem, name, data ) {
  		return jQuery.data( elem, name, data, true );
  	},
  
  	// A method for determining if a DOM node can handle the data expando
  	acceptData: function( elem ) {
  		var noData = elem.nodeName && jQuery.noData[ elem.nodeName.toLowerCase() ];
  
  		// nodes accept data unless otherwise specified; rejection can be conditional
  		return !noData || noData !== true && elem.getAttribute("classid") === noData;
  	}
  });
  
  jQuery.fn.extend({
  	data: function( key, value ) {
  		var parts, part, attr, name, l,
  			elem = this[0],
  			i = 0,
  			data = null;
  
  		// Gets all values
  		if ( key === undefined ) {
  			if ( this.length ) {
  				data = jQuery.data( elem );
  
  				if ( elem.nodeType === 1 && !jQuery._data( elem, "parsedAttrs" ) ) {
  					attr = elem.attributes;
  					for ( l = attr.length; i < l; i++ ) {
  						name = attr[i].name;
  
  						if ( !name.indexOf( "data-" ) ) {
  							name = jQuery.camelCase( name.substring(5) );
  
  							dataAttr( elem, name, data[ name ] );
  						}
  					}
  					jQuery._data( elem, "parsedAttrs", true );
  				}
  			}
  
  			return data;
  		}
  
  		// Sets multiple values
  		if ( typeof key === "object" ) {
  			return this.each(function() {
  				jQuery.data( this, key );
  			});
  		}
  
  		parts = key.split( ".", 2 );
  		parts[1] = parts[1] ? "." + parts[1] : "";
  		part = parts[1] + "!";
  
  		return jQuery.access( this, function( value ) {
  
  			if ( value === undefined ) {
  				data = this.triggerHandler( "getData" + part, [ parts[0] ] );
  
  				// Try to fetch any internally stored data first
  				if ( data === undefined && elem ) {
  					data = jQuery.data( elem, key );
  					data = dataAttr( elem, key, data );
  				}
  
  				return data === undefined && parts[1] ?
  					this.data( parts[0] ) :
  					data;
  			}
  
  			parts[1] = value;
  			this.each(function() {
  				var self = jQuery( this );
  
  				self.triggerHandler( "setData" + part, parts );
  				jQuery.data( this, key, value );
  				self.triggerHandler( "changeData" + part, parts );
  			});
  		}, null, value, arguments.length > 1, null, false );
  	},
  
  	removeData: function( key ) {
  		return this.each(function() {
  			jQuery.removeData( this, key );
  		});
  	}
  });
  
  function dataAttr( elem, key, data ) {
  	// If nothing was found internally, try to fetch any
  	// data from the HTML5 data-* attribute
  	if ( data === undefined && elem.nodeType === 1 ) {
  
  		var name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();
  
  		data = elem.getAttribute( name );
  
  		if ( typeof data === "string" ) {
  			try {
  				data = data === "true" ? true :
  				data === "false" ? false :
  				data === "null" ? null :
  				// Only convert to a number if it doesn't change the string
  				+data + "" === data ? +data :
  				rbrace.test( data ) ? jQuery.parseJSON( data ) :
  					data;
  			} catch( e ) {}
  
  			// Make sure we set the data so it isn't changed later
  			jQuery.data( elem, key, data );
  
  		} else {
  			data = undefined;
  		}
  	}
  
  	return data;
  }
  
  // checks a cache object for emptiness
  function isEmptyDataObject( obj ) {
  	var name;
  	for ( name in obj ) {
  
  		// if the public data object is empty, the private is still empty
  		if ( name === "data" && jQuery.isEmptyObject( obj[name] ) ) {
  			continue;
  		}
  		if ( name !== "toJSON" ) {
  			return false;
  		}
  	}
  
  	return true;
  }
  jQuery.extend({
  	queue: function( elem, type, data ) {
  		var queue;
  
  		if ( elem ) {
  			type = ( type || "fx" ) + "queue";
  			queue = jQuery._data( elem, type );
  
  			// Speed up dequeue by getting out quickly if this is just a lookup
  			if ( data ) {
  				if ( !queue || jQuery.isArray(data) ) {
  					queue = jQuery._data( elem, type, jQuery.makeArray(data) );
  				} else {
  					queue.push( data );
  				}
  			}
  			return queue || [];
  		}
  	},
  
  	dequeue: function( elem, type ) {
  		type = type || "fx";
  
  		var queue = jQuery.queue( elem, type ),
  			startLength = queue.length,
  			fn = queue.shift(),
  			hooks = jQuery._queueHooks( elem, type ),
  			next = function() {
  				jQuery.dequeue( elem, type );
  			};
  
  		// If the fx queue is dequeued, always remove the progress sentinel
  		if ( fn === "inprogress" ) {
  			fn = queue.shift();
  			startLength--;
  		}
  
  		if ( fn ) {
  
  			// Add a progress sentinel to prevent the fx queue from being
  			// automatically dequeued
  			if ( type === "fx" ) {
  				queue.unshift( "inprogress" );
  			}
  
  			// clear up the last queue stop function
  			delete hooks.stop;
  			fn.call( elem, next, hooks );
  		}
  
  		if ( !startLength && hooks ) {
  			hooks.empty.fire();
  		}
  	},
  
  	// not intended for public consumption - generates a queueHooks object, or returns the current one
  	_queueHooks: function( elem, type ) {
  		var key = type + "queueHooks";
  		return jQuery._data( elem, key ) || jQuery._data( elem, key, {
  			empty: jQuery.Callbacks("once memory").add(function() {
  				jQuery.removeData( elem, type + "queue", true );
  				jQuery.removeData( elem, key, true );
  			})
  		});
  	}
  });
  
  jQuery.fn.extend({
  	queue: function( type, data ) {
  		var setter = 2;
  
  		if ( typeof type !== "string" ) {
  			data = type;
  			type = "fx";
  			setter--;
  		}
  
  		if ( arguments.length < setter ) {
  			return jQuery.queue( this[0], type );
  		}
  
  		return data === undefined ?
  			this :
  			this.each(function() {
  				var queue = jQuery.queue( this, type, data );
  
  				// ensure a hooks for this queue
  				jQuery._queueHooks( this, type );
  
  				if ( type === "fx" && queue[0] !== "inprogress" ) {
  					jQuery.dequeue( this, type );
  				}
  			});
  	},
  	dequeue: function( type ) {
  		return this.each(function() {
  			jQuery.dequeue( this, type );
  		});
  	},
  	// Based off of the plugin by Clint Helfers, with permission.
  	// http://blindsignals.com/index.php/2009/07/jquery-delay/
  	delay: function( time, type ) {
  		time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
  		type = type || "fx";
  
  		return this.queue( type, function( next, hooks ) {
  			var timeout = setTimeout( next, time );
  			hooks.stop = function() {
  				clearTimeout( timeout );
  			};
  		});
  	},
  	clearQueue: function( type ) {
  		return this.queue( type || "fx", [] );
  	},
  	// Get a promise resolved when queues of a certain type
  	// are emptied (fx is the type by default)
  	promise: function( type, obj ) {
  		var tmp,
  			count = 1,
  			defer = jQuery.Deferred(),
  			elements = this,
  			i = this.length,
  			resolve = function() {
  				if ( !( --count ) ) {
  					defer.resolveWith( elements, [ elements ] );
  				}
  			};
  
  		if ( typeof type !== "string" ) {
  			obj = type;
  			type = undefined;
  		}
  		type = type || "fx";
  
  		while( i-- ) {
  			tmp = jQuery._data( elements[ i ], type + "queueHooks" );
  			if ( tmp && tmp.empty ) {
  				count++;
  				tmp.empty.add( resolve );
  			}
  		}
  		resolve();
  		return defer.promise( obj );
  	}
  });
  var nodeHook, boolHook, fixSpecified,
  	rclass = /[\t\r\n]/g,
  	rreturn = /\r/g,
  	rtype = /^(?:button|input)$/i,
  	rfocusable = /^(?:button|input|object|select|textarea)$/i,
  	rclickable = /^a(?:rea|)$/i,
  	rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,
  	getSetAttribute = jQuery.support.getSetAttribute;
  
  jQuery.fn.extend({
  	attr: function( name, value ) {
  		return jQuery.access( this, jQuery.attr, name, value, arguments.length > 1 );
  	},
  
  	removeAttr: function( name ) {
  		return this.each(function() {
  			jQuery.removeAttr( this, name );
  		});
  	},
  
  	prop: function( name, value ) {
  		return jQuery.access( this, jQuery.prop, name, value, arguments.length > 1 );
  	},
  
  	removeProp: function( name ) {
  		name = jQuery.propFix[ name ] || name;
  		return this.each(function() {
  			// try/catch handles cases where IE balks (such as removing a property on window)
  			try {
  				this[ name ] = undefined;
  				delete this[ name ];
  			} catch( e ) {}
  		});
  	},
  
  	addClass: function( value ) {
  		var classNames, i, l, elem,
  			setClass, c, cl;
  
  		if ( jQuery.isFunction( value ) ) {
  			return this.each(function( j ) {
  				jQuery( this ).addClass( value.call(this, j, this.className) );
  			});
  		}
  
  		if ( value && typeof value === "string" ) {
  			classNames = value.split( core_rspace );
  
  			for ( i = 0, l = this.length; i < l; i++ ) {
  				elem = this[ i ];
  
  				if ( elem.nodeType === 1 ) {
  					if ( !elem.className && classNames.length === 1 ) {
  						elem.className = value;
  
  					} else {
  						setClass = " " + elem.className + " ";
  
  						for ( c = 0, cl = classNames.length; c < cl; c++ ) {
  							if ( setClass.indexOf( " " + classNames[ c ] + " " ) < 0 ) {
  								setClass += classNames[ c ] + " ";
  							}
  						}
  						elem.className = jQuery.trim( setClass );
  					}
  				}
  			}
  		}
  
  		return this;
  	},
  
  	removeClass: function( value ) {
  		var removes, className, elem, c, cl, i, l;
  
  		if ( jQuery.isFunction( value ) ) {
  			return this.each(function( j ) {
  				jQuery( this ).removeClass( value.call(this, j, this.className) );
  			});
  		}
  		if ( (value && typeof value === "string") || value === undefined ) {
  			removes = ( value || "" ).split( core_rspace );
  
  			for ( i = 0, l = this.length; i < l; i++ ) {
  				elem = this[ i ];
  				if ( elem.nodeType === 1 && elem.className ) {
  
  					className = (" " + elem.className + " ").replace( rclass, " " );
  
  					// loop over each item in the removal list
  					for ( c = 0, cl = removes.length; c < cl; c++ ) {
  						// Remove until there is nothing to remove,
  						while ( className.indexOf(" " + removes[ c ] + " ") >= 0 ) {
  							className = className.replace( " " + removes[ c ] + " " , " " );
  						}
  					}
  					elem.className = value ? jQuery.trim( className ) : "";
  				}
  			}
  		}
  
  		return this;
  	},
  
  	toggleClass: function( value, stateVal ) {
  		var type = typeof value,
  			isBool = typeof stateVal === "boolean";
  
  		if ( jQuery.isFunction( value ) ) {
  			return this.each(function( i ) {
  				jQuery( this ).toggleClass( value.call(this, i, this.className, stateVal), stateVal );
  			});
  		}
  
  		return this.each(function() {
  			if ( type === "string" ) {
  				// toggle individual class names
  				var className,
  					i = 0,
  					self = jQuery( this ),
  					state = stateVal,
  					classNames = value.split( core_rspace );
  
  				while ( (className = classNames[ i++ ]) ) {
  					// check each className given, space separated list
  					state = isBool ? state : !self.hasClass( className );
  					self[ state ? "addClass" : "removeClass" ]( className );
  				}
  
  			} else if ( type === "undefined" || type === "boolean" ) {
  				if ( this.className ) {
  					// store className if set
  					jQuery._data( this, "__className__", this.className );
  				}
  
  				// toggle whole className
  				this.className = this.className || value === false ? "" : jQuery._data( this, "__className__" ) || "";
  			}
  		});
  	},
  
  	hasClass: function( selector ) {
  		var className = " " + selector + " ",
  			i = 0,
  			l = this.length;
  		for ( ; i < l; i++ ) {
  			if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) >= 0 ) {
  				return true;
  			}
  		}
  
  		return false;
  	},
  
  	val: function( value ) {
  		var hooks, ret, isFunction,
  			elem = this[0];
  
  		if ( !arguments.length ) {
  			if ( elem ) {
  				hooks = jQuery.valHooks[ elem.type ] || jQuery.valHooks[ elem.nodeName.toLowerCase() ];
  
  				if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
  					return ret;
  				}
  
  				ret = elem.value;
  
  				return typeof ret === "string" ?
  					// handle most common string cases
  					ret.replace(rreturn, "") :
  					// handle cases where value is null/undef or number
  					ret == null ? "" : ret;
  			}
  
  			return;
  		}
  
  		isFunction = jQuery.isFunction( value );
  
  		return this.each(function( i ) {
  			var val,
  				self = jQuery(this);
  
  			if ( this.nodeType !== 1 ) {
  				return;
  			}
  
  			if ( isFunction ) {
  				val = value.call( this, i, self.val() );
  			} else {
  				val = value;
  			}
  
  			// Treat null/undefined as ""; convert numbers to string
  			if ( val == null ) {
  				val = "";
  			} else if ( typeof val === "number" ) {
  				val += "";
  			} else if ( jQuery.isArray( val ) ) {
  				val = jQuery.map(val, function ( value ) {
  					return value == null ? "" : value + "";
  				});
  			}
  
  			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];
  
  			// If set returns undefined, fall back to normal setting
  			if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ) {
  				this.value = val;
  			}
  		});
  	}
  });
  
  jQuery.extend({
  	valHooks: {
  		option: {
  			get: function( elem ) {
  				// attributes.value is undefined in Blackberry 4.7 but
  				// uses .value. See #6932
  				var val = elem.attributes.value;
  				return !val || val.specified ? elem.value : elem.text;
  			}
  		},
  		select: {
  			get: function( elem ) {
  				var value, option,
  					options = elem.options,
  					index = elem.selectedIndex,
  					one = elem.type === "select-one" || index < 0,
  					values = one ? null : [],
  					max = one ? index + 1 : options.length,
  					i = index < 0 ?
  						max :
  						one ? index : 0;
  
  				// Loop through all the selected options
  				for ( ; i < max; i++ ) {
  					option = options[ i ];
  
  					// oldIE doesn't update selected after form reset (#2551)
  					if ( ( option.selected || i === index ) &&
  							// Don't return options that are disabled or in a disabled optgroup
  							( jQuery.support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null ) &&
  							( !option.parentNode.disabled || !jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {
  
  						// Get the specific value for the option
  						value = jQuery( option ).val();
  
  						// We don't need an array for one selects
  						if ( one ) {
  							return value;
  						}
  
  						// Multi-Selects return an array
  						values.push( value );
  					}
  				}
  
  				return values;
  			},
  
  			set: function( elem, value ) {
  				var values = jQuery.makeArray( value );
  
  				jQuery(elem).find("option").each(function() {
  					this.selected = jQuery.inArray( jQuery(this).val(), values ) >= 0;
  				});
  
  				if ( !values.length ) {
  					elem.selectedIndex = -1;
  				}
  				return values;
  			}
  		}
  	},
  
  	// Unused in 1.8, left in so attrFn-stabbers won't die; remove in 1.9
  	attrFn: {},
  
  	attr: function( elem, name, value, pass ) {
  		var ret, hooks, notxml,
  			nType = elem.nodeType;
  
  		// don't get/set attributes on text, comment and attribute nodes
  		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
  			return;
  		}
  
  		if ( pass && jQuery.isFunction( jQuery.fn[ name ] ) ) {
  			return jQuery( elem )[ name ]( value );
  		}
  
  		// Fallback to prop when attributes are not supported
  		if ( typeof elem.getAttribute === "undefined" ) {
  			return jQuery.prop( elem, name, value );
  		}
  
  		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );
  
  		// All attributes are lowercase
  		// Grab necessary hook if one is defined
  		if ( notxml ) {
  			name = name.toLowerCase();
  			hooks = jQuery.attrHooks[ name ] || ( rboolean.test( name ) ? boolHook : nodeHook );
  		}
  
  		if ( value !== undefined ) {
  
  			if ( value === null ) {
  				jQuery.removeAttr( elem, name );
  				return;
  
  			} else if ( hooks && "set" in hooks && notxml && (ret = hooks.set( elem, value, name )) !== undefined ) {
  				return ret;
  
  			} else {
  				elem.setAttribute( name, value + "" );
  				return value;
  			}
  
  		} else if ( hooks && "get" in hooks && notxml && (ret = hooks.get( elem, name )) !== null ) {
  			return ret;
  
  		} else {
  
  			ret = elem.getAttribute( name );
  
  			// Non-existent attributes return null, we normalize to undefined
  			return ret === null ?
  				undefined :
  				ret;
  		}
  	},
  
  	removeAttr: function( elem, value ) {
  		var propName, attrNames, name, isBool,
  			i = 0;
  
  		if ( value && elem.nodeType === 1 ) {
  
  			attrNames = value.split( core_rspace );
  
  			for ( ; i < attrNames.length; i++ ) {
  				name = attrNames[ i ];
  
  				if ( name ) {
  					propName = jQuery.propFix[ name ] || name;
  					isBool = rboolean.test( name );
  
  					// See #9699 for explanation of this approach (setting first, then removal)
  					// Do not do this for boolean attributes (see #10870)
  					if ( !isBool ) {
  						jQuery.attr( elem, name, "" );
  					}
  					elem.removeAttribute( getSetAttribute ? name : propName );
  
  					// Set corresponding property to false for boolean attributes
  					if ( isBool && propName in elem ) {
  						elem[ propName ] = false;
  					}
  				}
  			}
  		}
  	},
  
  	attrHooks: {
  		type: {
  			set: function( elem, value ) {
  				// We can't allow the type property to be changed (since it causes problems in IE)
  				if ( rtype.test( elem.nodeName ) && elem.parentNode ) {
  					jQuery.error( "type property can't be changed" );
  				} else if ( !jQuery.support.radioValue && value === "radio" && jQuery.nodeName(elem, "input") ) {
  					// Setting the type on a radio button after the value resets the value in IE6-9
  					// Reset value to it's default in case type is set after value
  					// This is for element creation
  					var val = elem.value;
  					elem.setAttribute( "type", value );
  					if ( val ) {
  						elem.value = val;
  					}
  					return value;
  				}
  			}
  		},
  		// Use the value property for back compat
  		// Use the nodeHook for button elements in IE6/7 (#1954)
  		value: {
  			get: function( elem, name ) {
  				if ( nodeHook && jQuery.nodeName( elem, "button" ) ) {
  					return nodeHook.get( elem, name );
  				}
  				return name in elem ?
  					elem.value :
  					null;
  			},
  			set: function( elem, value, name ) {
  				if ( nodeHook && jQuery.nodeName( elem, "button" ) ) {
  					return nodeHook.set( elem, value, name );
  				}
  				// Does not return so that setAttribute is also used
  				elem.value = value;
  			}
  		}
  	},
  
  	propFix: {
  		tabindex: "tabIndex",
  		readonly: "readOnly",
  		"for": "htmlFor",
  		"class": "className",
  		maxlength: "maxLength",
  		cellspacing: "cellSpacing",
  		cellpadding: "cellPadding",
  		rowspan: "rowSpan",
  		colspan: "colSpan",
  		usemap: "useMap",
  		frameborder: "frameBorder",
  		contenteditable: "contentEditable"
  	},
  
  	prop: function( elem, name, value ) {
  		var ret, hooks, notxml,
  			nType = elem.nodeType;
  
  		// don't get/set properties on text, comment and attribute nodes
  		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
  			return;
  		}
  
  		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );
  
  		if ( notxml ) {
  			// Fix name and attach hooks
  			name = jQuery.propFix[ name ] || name;
  			hooks = jQuery.propHooks[ name ];
  		}
  
  		if ( value !== undefined ) {
  			if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
  				return ret;
  
  			} else {
  				return ( elem[ name ] = value );
  			}
  
  		} else {
  			if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
  				return ret;
  
  			} else {
  				return elem[ name ];
  			}
  		}
  	},
  
  	propHooks: {
  		tabIndex: {
  			get: function( elem ) {
  				// elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
  				// http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
  				var attributeNode = elem.getAttributeNode("tabindex");
  
  				return attributeNode && attributeNode.specified ?
  					parseInt( attributeNode.value, 10 ) :
  					rfocusable.test( elem.nodeName ) || rclickable.test( elem.nodeName ) && elem.href ?
  						0 :
  						undefined;
  			}
  		}
  	}
  });
  
  // Hook for boolean attributes
  boolHook = {
  	get: function( elem, name ) {
  		// Align boolean attributes with corresponding properties
  		// Fall back to attribute presence where some booleans are not supported
  		var attrNode,
  			property = jQuery.prop( elem, name );
  		return property === true || typeof property !== "boolean" && ( attrNode = elem.getAttributeNode(name) ) && attrNode.nodeValue !== false ?
  			name.toLowerCase() :
  			undefined;
  	},
  	set: function( elem, value, name ) {
  		var propName;
  		if ( value === false ) {
  			// Remove boolean attributes when set to false
  			jQuery.removeAttr( elem, name );
  		} else {
  			// value is true since we know at this point it's type boolean and not false
  			// Set boolean attributes to the same name and set the DOM property
  			propName = jQuery.propFix[ name ] || name;
  			if ( propName in elem ) {
  				// Only set the IDL specifically if it already exists on the element
  				elem[ propName ] = true;
  			}
  
  			elem.setAttribute( name, name.toLowerCase() );
  		}
  		return name;
  	}
  };
  
  // IE6/7 do not support getting/setting some attributes with get/setAttribute
  if ( !getSetAttribute ) {
  
  	fixSpecified = {
  		name: true,
  		id: true,
  		coords: true
  	};
  
  	// Use this for any attribute in IE6/7
  	// This fixes almost every IE6/7 issue
  	nodeHook = jQuery.valHooks.button = {
  		get: function( elem, name ) {
  			var ret;
  			ret = elem.getAttributeNode( name );
  			return ret && ( fixSpecified[ name ] ? ret.value !== "" : ret.specified ) ?
  				ret.value :
  				undefined;
  		},
  		set: function( elem, value, name ) {
  			// Set the existing or create a new attribute node
  			var ret = elem.getAttributeNode( name );
  			if ( !ret ) {
  				ret = document.createAttribute( name );
  				elem.setAttributeNode( ret );
  			}
  			return ( ret.value = value + "" );
  		}
  	};
  
  	// Set width and height to auto instead of 0 on empty string( Bug #8150 )
  	// This is for removals
  	jQuery.each([ "width", "height" ], function( i, name ) {
  		jQuery.attrHooks[ name ] = jQuery.extend( jQuery.attrHooks[ name ], {
  			set: function( elem, value ) {
  				if ( value === "" ) {
  					elem.setAttribute( name, "auto" );
  					return value;
  				}
  			}
  		});
  	});
  
  	// Set contenteditable to false on removals(#10429)
  	// Setting to empty string throws an error as an invalid value
  	jQuery.attrHooks.contenteditable = {
  		get: nodeHook.get,
  		set: function( elem, value, name ) {
  			if ( value === "" ) {
  				value = "false";
  			}
  			nodeHook.set( elem, value, name );
  		}
  	};
  }
  
  
  // Some attributes require a special call on IE
  if ( !jQuery.support.hrefNormalized ) {
  	jQuery.each([ "href", "src", "width", "height" ], function( i, name ) {
  		jQuery.attrHooks[ name ] = jQuery.extend( jQuery.attrHooks[ name ], {
  			get: function( elem ) {
  				var ret = elem.getAttribute( name, 2 );
  				return ret === null ? undefined : ret;
  			}
  		});
  	});
  }
  
  if ( !jQuery.support.style ) {
  	jQuery.attrHooks.style = {
  		get: function( elem ) {
  			// Return undefined in the case of empty string
  			// Normalize to lowercase since IE uppercases css property names
  			return elem.style.cssText.toLowerCase() || undefined;
  		},
  		set: function( elem, value ) {
  			return ( elem.style.cssText = value + "" );
  		}
  	};
  }
  
  // Safari mis-reports the default selected property of an option
  // Accessing the parent's selectedIndex property fixes it
  if ( !jQuery.support.optSelected ) {
  	jQuery.propHooks.selected = jQuery.extend( jQuery.propHooks.selected, {
  		get: function( elem ) {
  			var parent = elem.parentNode;
  
  			if ( parent ) {
  				parent.selectedIndex;
  
  				// Make sure that it also works with optgroups, see #5701
  				if ( parent.parentNode ) {
  					parent.parentNode.selectedIndex;
  				}
  			}
  			return null;
  		}
  	});
  }
  
  // IE6/7 call enctype encoding
  if ( !jQuery.support.enctype ) {
  	jQuery.propFix.enctype = "encoding";
  }
  
  // Radios and checkboxes getter/setter
  if ( !jQuery.support.checkOn ) {
  	jQuery.each([ "radio", "checkbox" ], function() {
  		jQuery.valHooks[ this ] = {
  			get: function( elem ) {
  				// Handle the case where in Webkit "" is returned instead of "on" if a value isn't specified
  				return elem.getAttribute("value") === null ? "on" : elem.value;
  			}
  		};
  	});
  }
  jQuery.each([ "radio", "checkbox" ], function() {
  	jQuery.valHooks[ this ] = jQuery.extend( jQuery.valHooks[ this ], {
  		set: function( elem, value ) {
  			if ( jQuery.isArray( value ) ) {
  				return ( elem.checked = jQuery.inArray( jQuery(elem).val(), value ) >= 0 );
  			}
  		}
  	});
  });
  var rformElems = /^(?:textarea|input|select)$/i,
  	rtypenamespace = /^([^\.]*|)(?:\.(.+)|)$/,
  	rhoverHack = /(?:^|\s)hover(\.\S+|)\b/,
  	rkeyEvent = /^key/,
  	rmouseEvent = /^(?:mouse|contextmenu)|click/,
  	rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
  	hoverHack = function( events ) {
  		return jQuery.event.special.hover ? events : events.replace( rhoverHack, "mouseenter$1 mouseleave$1" );
  	};
  
  /*
   * Helper functions for managing events -- not part of the public interface.
   * Props to Dean Edwards' addEvent library for many of the ideas.
   */
  jQuery.event = {
  
  	add: function( elem, types, handler, data, selector ) {
  
  		var elemData, eventHandle, events,
  			t, tns, type, namespaces, handleObj,
  			handleObjIn, handlers, special;
  
  		// Don't attach events to noData or text/comment nodes (allow plain objects tho)
  		if ( elem.nodeType === 3 || elem.nodeType === 8 || !types || !handler || !(elemData = jQuery._data( elem )) ) {
  			return;
  		}
  
  		// Caller can pass in an object of custom data in lieu of the handler
  		if ( handler.handler ) {
  			handleObjIn = handler;
  			handler = handleObjIn.handler;
  			selector = handleObjIn.selector;
  		}
  
  		// Make sure that the handler has a unique ID, used to find/remove it later
  		if ( !handler.guid ) {
  			handler.guid = jQuery.guid++;
  		}
  
  		// Init the element's event structure and main handler, if this is the first
  		events = elemData.events;
  		if ( !events ) {
  			elemData.events = events = {};
  		}
  		eventHandle = elemData.handle;
  		if ( !eventHandle ) {
  			elemData.handle = eventHandle = function( e ) {
  				// Discard the second event of a jQuery.event.trigger() and
  				// when an event is called after a page has unloaded
  				return typeof jQuery !== "undefined" && (!e || jQuery.event.triggered !== e.type) ?
  					jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
  					undefined;
  			};
  			// Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
  			eventHandle.elem = elem;
  		}
  
  		// Handle multiple events separated by a space
  		// jQuery(...).bind("mouseover mouseout", fn);
  		types = jQuery.trim( hoverHack(types) ).split( " " );
  		for ( t = 0; t < types.length; t++ ) {
  
  			tns = rtypenamespace.exec( types[t] ) || [];
  			type = tns[1];
  			namespaces = ( tns[2] || "" ).split( "." ).sort();
  
  			// If event changes its type, use the special event handlers for the changed type
  			special = jQuery.event.special[ type ] || {};
  
  			// If selector defined, determine special event api type, otherwise given type
  			type = ( selector ? special.delegateType : special.bindType ) || type;
  
  			// Update special based on newly reset type
  			special = jQuery.event.special[ type ] || {};
  
  			// handleObj is passed to all event handlers
  			handleObj = jQuery.extend({
  				type: type,
  				origType: tns[1],
  				data: data,
  				handler: handler,
  				guid: handler.guid,
  				selector: selector,
  				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
  				namespace: namespaces.join(".")
  			}, handleObjIn );
  
  			// Init the event handler queue if we're the first
  			handlers = events[ type ];
  			if ( !handlers ) {
  				handlers = events[ type ] = [];
  				handlers.delegateCount = 0;
  
  				// Only use addEventListener/attachEvent if the special events handler returns false
  				if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
  					// Bind the global event handler to the element
  					if ( elem.addEventListener ) {
  						elem.addEventListener( type, eventHandle, false );
  
  					} else if ( elem.attachEvent ) {
  						elem.attachEvent( "on" + type, eventHandle );
  					}
  				}
  			}
  
  			if ( special.add ) {
  				special.add.call( elem, handleObj );
  
  				if ( !handleObj.handler.guid ) {
  					handleObj.handler.guid = handler.guid;
  				}
  			}
  
  			// Add to the element's handler list, delegates in front
  			if ( selector ) {
  				handlers.splice( handlers.delegateCount++, 0, handleObj );
  			} else {
  				handlers.push( handleObj );
  			}
  
  			// Keep track of which events have ever been used, for event optimization
  			jQuery.event.global[ type ] = true;
  		}
  
  		// Nullify elem to prevent memory leaks in IE
  		elem = null;
  	},
  
  	global: {},
  
  	// Detach an event or set of events from an element
  	remove: function( elem, types, handler, selector, mappedTypes ) {
  
  		var t, tns, type, origType, namespaces, origCount,
  			j, events, special, eventType, handleObj,
  			elemData = jQuery.hasData( elem ) && jQuery._data( elem );
  
  		if ( !elemData || !(events = elemData.events) ) {
  			return;
  		}
  
  		// Once for each type.namespace in types; type may be omitted
  		types = jQuery.trim( hoverHack( types || "" ) ).split(" ");
  		for ( t = 0; t < types.length; t++ ) {
  			tns = rtypenamespace.exec( types[t] ) || [];
  			type = origType = tns[1];
  			namespaces = tns[2];
  
  			// Unbind all events (on this namespace, if provided) for the element
  			if ( !type ) {
  				for ( type in events ) {
  					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
  				}
  				continue;
  			}
  
  			special = jQuery.event.special[ type ] || {};
  			type = ( selector? special.delegateType : special.bindType ) || type;
  			eventType = events[ type ] || [];
  			origCount = eventType.length;
  			namespaces = namespaces ? new RegExp("(^|\\.)" + namespaces.split(".").sort().join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
  
  			// Remove matching events
  			for ( j = 0; j < eventType.length; j++ ) {
  				handleObj = eventType[ j ];
  
  				if ( ( mappedTypes || origType === handleObj.origType ) &&
  					 ( !handler || handler.guid === handleObj.guid ) &&
  					 ( !namespaces || namespaces.test( handleObj.namespace ) ) &&
  					 ( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
  					eventType.splice( j--, 1 );
  
  					if ( handleObj.selector ) {
  						eventType.delegateCount--;
  					}
  					if ( special.remove ) {
  						special.remove.call( elem, handleObj );
  					}
  				}
  			}
  
  			// Remove generic event handler if we removed something and no more handlers exist
  			// (avoids potential for endless recursion during removal of special event handlers)
  			if ( eventType.length === 0 && origCount !== eventType.length ) {
  				if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
  					jQuery.removeEvent( elem, type, elemData.handle );
  				}
  
  				delete events[ type ];
  			}
  		}
  
  		// Remove the expando if it's no longer used
  		if ( jQuery.isEmptyObject( events ) ) {
  			delete elemData.handle;
  
  			// removeData also checks for emptiness and clears the expando if empty
  			// so use it instead of delete
  			jQuery.removeData( elem, "events", true );
  		}
  	},
  
  	// Events that are safe to short-circuit if no handlers are attached.
  	// Native DOM events should not be added, they may have inline handlers.
  	customEvent: {
  		"getData": true,
  		"setData": true,
  		"changeData": true
  	},
  
  	trigger: function( event, data, elem, onlyHandlers ) {
  		// Don't do events on text and comment nodes
  		if ( elem && (elem.nodeType === 3 || elem.nodeType === 8) ) {
  			return;
  		}
  
  		// Event object or event type
  		var cache, exclusive, i, cur, old, ontype, special, handle, eventPath, bubbleType,
  			type = event.type || event,
  			namespaces = [];
  
  		// focus/blur morphs to focusin/out; ensure we're not firing them right now
  		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
  			return;
  		}
  
  		if ( type.indexOf( "!" ) >= 0 ) {
  			// Exclusive events trigger only for the exact event (no namespaces)
  			type = type.slice(0, -1);
  			exclusive = true;
  		}
  
  		if ( type.indexOf( "." ) >= 0 ) {
  			// Namespaced trigger; create a regexp to match event type in handle()
  			namespaces = type.split(".");
  			type = namespaces.shift();
  			namespaces.sort();
  		}
  
  		if ( (!elem || jQuery.event.customEvent[ type ]) && !jQuery.event.global[ type ] ) {
  			// No jQuery handlers for this event type, and it can't have inline handlers
  			return;
  		}
  
  		// Caller can pass in an Event, Object, or just an event type string
  		event = typeof event === "object" ?
  			// jQuery.Event object
  			event[ jQuery.expando ] ? event :
  			// Object literal
  			new jQuery.Event( type, event ) :
  			// Just the event type (string)
  			new jQuery.Event( type );
  
  		event.type = type;
  		event.isTrigger = true;
  		event.exclusive = exclusive;
  		event.namespace = namespaces.join( "." );
  		event.namespace_re = event.namespace? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
  		ontype = type.indexOf( ":" ) < 0 ? "on" + type : "";
  
  		// Handle a global trigger
  		if ( !elem ) {
  
  			// TODO: Stop taunting the data cache; remove global events and always attach to document
  			cache = jQuery.cache;
  			for ( i in cache ) {
  				if ( cache[ i ].events && cache[ i ].events[ type ] ) {
  					jQuery.event.trigger( event, data, cache[ i ].handle.elem, true );
  				}
  			}
  			return;
  		}
  
  		// Clean up the event in case it is being reused
  		event.result = undefined;
  		if ( !event.target ) {
  			event.target = elem;
  		}
  
  		// Clone any incoming data and prepend the event, creating the handler arg list
  		data = data != null ? jQuery.makeArray( data ) : [];
  		data.unshift( event );
  
  		// Allow special events to draw outside the lines
  		special = jQuery.event.special[ type ] || {};
  		if ( special.trigger && special.trigger.apply( elem, data ) === false ) {
  			return;
  		}
  
  		// Determine event propagation path in advance, per W3C events spec (#9951)
  		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
  		eventPath = [[ elem, special.bindType || type ]];
  		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {
  
  			bubbleType = special.delegateType || type;
  			cur = rfocusMorph.test( bubbleType + type ) ? elem : elem.parentNode;
  			for ( old = elem; cur; cur = cur.parentNode ) {
  				eventPath.push([ cur, bubbleType ]);
  				old = cur;
  			}
  
  			// Only add window if we got to document (e.g., not plain obj or detached DOM)
  			if ( old === (elem.ownerDocument || document) ) {
  				eventPath.push([ old.defaultView || old.parentWindow || window, bubbleType ]);
  			}
  		}
  
  		// Fire handlers on the event path
  		for ( i = 0; i < eventPath.length && !event.isPropagationStopped(); i++ ) {
  
  			cur = eventPath[i][0];
  			event.type = eventPath[i][1];
  
  			handle = ( jQuery._data( cur, "events" ) || {} )[ event.type ] && jQuery._data( cur, "handle" );
  			if ( handle ) {
  				handle.apply( cur, data );
  			}
  			// Note that this is a bare JS function and not a jQuery handler
  			handle = ontype && cur[ ontype ];
  			if ( handle && jQuery.acceptData( cur ) && handle.apply && handle.apply( cur, data ) === false ) {
  				event.preventDefault();
  			}
  		}
  		event.type = type;
  
  		// If nobody prevented the default action, do it now
  		if ( !onlyHandlers && !event.isDefaultPrevented() ) {
  
  			if ( (!special._default || special._default.apply( elem.ownerDocument, data ) === false) &&
  				!(type === "click" && jQuery.nodeName( elem, "a" )) && jQuery.acceptData( elem ) ) {
  
  				// Call a native DOM method on the target with the same name name as the event.
  				// Can't use an .isFunction() check here because IE6/7 fails that test.
  				// Don't do default actions on window, that's where global variables be (#6170)
  				// IE<9 dies on focus/blur to hidden element (#1486)
  				if ( ontype && elem[ type ] && ((type !== "focus" && type !== "blur") || event.target.offsetWidth !== 0) && !jQuery.isWindow( elem ) ) {
  
  					// Don't re-trigger an onFOO event when we call its FOO() method
  					old = elem[ ontype ];
  
  					if ( old ) {
  						elem[ ontype ] = null;
  					}
  
  					// Prevent re-triggering of the same event, since we already bubbled it above
  					jQuery.event.triggered = type;
  					elem[ type ]();
  					jQuery.event.triggered = undefined;
  
  					if ( old ) {
  						elem[ ontype ] = old;
  					}
  				}
  			}
  		}
  
  		return event.result;
  	},
  
  	dispatch: function( event ) {
  
  		// Make a writable jQuery.Event from the native event object
  		event = jQuery.event.fix( event || window.event );
  
  		var i, j, cur, ret, selMatch, matched, matches, handleObj, sel, related,
  			handlers = ( (jQuery._data( this, "events" ) || {} )[ event.type ] || []),
  			delegateCount = handlers.delegateCount,
  			args = core_slice.call( arguments ),
  			run_all = !event.exclusive && !event.namespace,
  			special = jQuery.event.special[ event.type ] || {},
  			handlerQueue = [];
  
  		// Use the fix-ed jQuery.Event rather than the (read-only) native event
  		args[0] = event;
  		event.delegateTarget = this;
  
  		// Call the preDispatch hook for the mapped type, and let it bail if desired
  		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
  			return;
  		}
  
  		// Determine handlers that should run if there are delegated events
  		// Avoid non-left-click bubbling in Firefox (#3861)
  		if ( delegateCount && !(event.button && event.type === "click") ) {
  
  			for ( cur = event.target; cur != this; cur = cur.parentNode || this ) {
  
  				// Don't process clicks (ONLY) on disabled elements (#6911, #8165, #11382, #11764)
  				if ( cur.disabled !== true || event.type !== "click" ) {
  					selMatch = {};
  					matches = [];
  					for ( i = 0; i < delegateCount; i++ ) {
  						handleObj = handlers[ i ];
  						sel = handleObj.selector;
  
  						if ( selMatch[ sel ] === undefined ) {
  							selMatch[ sel ] = handleObj.needsContext ?
  								jQuery( sel, this ).index( cur ) >= 0 :
  								jQuery.find( sel, this, null, [ cur ] ).length;
  						}
  						if ( selMatch[ sel ] ) {
  							matches.push( handleObj );
  						}
  					}
  					if ( matches.length ) {
  						handlerQueue.push({ elem: cur, matches: matches });
  					}
  				}
  			}
  		}
  
  		// Add the remaining (directly-bound) handlers
  		if ( handlers.length > delegateCount ) {
  			handlerQueue.push({ elem: this, matches: handlers.slice( delegateCount ) });
  		}
  
  		// Run delegates first; they may want to stop propagation beneath us
  		for ( i = 0; i < handlerQueue.length && !event.isPropagationStopped(); i++ ) {
  			matched = handlerQueue[ i ];
  			event.currentTarget = matched.elem;
  
  			for ( j = 0; j < matched.matches.length && !event.isImmediatePropagationStopped(); j++ ) {
  				handleObj = matched.matches[ j ];
  
  				// Triggered event must either 1) be non-exclusive and have no namespace, or
  				// 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
  				if ( run_all || (!event.namespace && !handleObj.namespace) || event.namespace_re && event.namespace_re.test( handleObj.namespace ) ) {
  
  					event.data = handleObj.data;
  					event.handleObj = handleObj;
  
  					ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
  							.apply( matched.elem, args );
  
  					if ( ret !== undefined ) {
  						event.result = ret;
  						if ( ret === false ) {
  							event.preventDefault();
  							event.stopPropagation();
  						}
  					}
  				}
  			}
  		}
  
  		// Call the postDispatch hook for the mapped type
  		if ( special.postDispatch ) {
  			special.postDispatch.call( this, event );
  		}
  
  		return event.result;
  	},
  
  	// Includes some event props shared by KeyEvent and MouseEvent
  	// *** attrChange attrName relatedNode srcElement  are not normalized, non-W3C, deprecated, will be removed in 1.8 ***
  	props: "attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),
  
  	fixHooks: {},
  
  	keyHooks: {
  		props: "char charCode key keyCode".split(" "),
  		filter: function( event, original ) {
  
  			// Add which for key events
  			if ( event.which == null ) {
  				event.which = original.charCode != null ? original.charCode : original.keyCode;
  			}
  
  			return event;
  		}
  	},
  
  	mouseHooks: {
  		props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
  		filter: function( event, original ) {
  			var eventDoc, doc, body,
  				button = original.button,
  				fromElement = original.fromElement;
  
  			// Calculate pageX/Y if missing and clientX/Y available
  			if ( event.pageX == null && original.clientX != null ) {
  				eventDoc = event.target.ownerDocument || document;
  				doc = eventDoc.documentElement;
  				body = eventDoc.body;
  
  				event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
  				event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
  			}
  
  			// Add relatedTarget, if necessary
  			if ( !event.relatedTarget && fromElement ) {
  				event.relatedTarget = fromElement === event.target ? original.toElement : fromElement;
  			}
  
  			// Add which for click: 1 === left; 2 === middle; 3 === right
  			// Note: button is not normalized, so don't use it
  			if ( !event.which && button !== undefined ) {
  				event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
  			}
  
  			return event;
  		}
  	},
  
  	fix: function( event ) {
  		if ( event[ jQuery.expando ] ) {
  			return event;
  		}
  
  		// Create a writable copy of the event object and normalize some properties
  		var i, prop,
  			originalEvent = event,
  			fixHook = jQuery.event.fixHooks[ event.type ] || {},
  			copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;
  
  		event = jQuery.Event( originalEvent );
  
  		for ( i = copy.length; i; ) {
  			prop = copy[ --i ];
  			event[ prop ] = originalEvent[ prop ];
  		}
  
  		// Fix target property, if necessary (#1925, IE 6/7/8 & Safari2)
  		if ( !event.target ) {
  			event.target = originalEvent.srcElement || document;
  		}
  
  		// Target should not be a text node (#504, Safari)
  		if ( event.target.nodeType === 3 ) {
  			event.target = event.target.parentNode;
  		}
  
  		// For mouse/key events, metaKey==false if it's undefined (#3368, #11328; IE6/7/8)
  		event.metaKey = !!event.metaKey;
  
  		return fixHook.filter? fixHook.filter( event, originalEvent ) : event;
  	},
  
  	special: {
  		load: {
  			// Prevent triggered image.load events from bubbling to window.load
  			noBubble: true
  		},
  
  		focus: {
  			delegateType: "focusin"
  		},
  		blur: {
  			delegateType: "focusout"
  		},
  
  		beforeunload: {
  			setup: function( data, namespaces, eventHandle ) {
  				// We only want to do this special case on windows
  				if ( jQuery.isWindow( this ) ) {
  					this.onbeforeunload = eventHandle;
  				}
  			},
  
  			teardown: function( namespaces, eventHandle ) {
  				if ( this.onbeforeunload === eventHandle ) {
  					this.onbeforeunload = null;
  				}
  			}
  		}
  	},
  
  	simulate: function( type, elem, event, bubble ) {
  		// Piggyback on a donor event to simulate a different one.
  		// Fake originalEvent to avoid donor's stopPropagation, but if the
  		// simulated event prevents default then we do the same on the donor.
  		var e = jQuery.extend(
  			new jQuery.Event(),
  			event,
  			{ type: type,
  				isSimulated: true,
  				originalEvent: {}
  			}
  		);
  		if ( bubble ) {
  			jQuery.event.trigger( e, null, elem );
  		} else {
  			jQuery.event.dispatch.call( elem, e );
  		}
  		if ( e.isDefaultPrevented() ) {
  			event.preventDefault();
  		}
  	}
  };
  
  // Some plugins are using, but it's undocumented/deprecated and will be removed.
  // The 1.7 special event interface should provide all the hooks needed now.
  jQuery.event.handle = jQuery.event.dispatch;
  
  jQuery.removeEvent = document.removeEventListener ?
  	function( elem, type, handle ) {
  		if ( elem.removeEventListener ) {
  			elem.removeEventListener( type, handle, false );
  		}
  	} :
  	function( elem, type, handle ) {
  		var name = "on" + type;
  
  		if ( elem.detachEvent ) {
  
  			// #8545, #7054, preventing memory leaks for custom events in IE6-8
  			// detachEvent needed property on element, by name of that event, to properly expose it to GC
  			if ( typeof elem[ name ] === "undefined" ) {
  				elem[ name ] = null;
  			}
  
  			elem.detachEvent( name, handle );
  		}
  	};
  
  jQuery.Event = function( src, props ) {
  	// Allow instantiation without the 'new' keyword
  	if ( !(this instanceof jQuery.Event) ) {
  		return new jQuery.Event( src, props );
  	}
  
  	// Event object
  	if ( src && src.type ) {
  		this.originalEvent = src;
  		this.type = src.type;
  
  		// Events bubbling up the document may have been marked as prevented
  		// by a handler lower down the tree; reflect the correct value.
  		this.isDefaultPrevented = ( src.defaultPrevented || src.returnValue === false ||
  			src.getPreventDefault && src.getPreventDefault() ) ? returnTrue : returnFalse;
  
  	// Event type
  	} else {
  		this.type = src;
  	}
  
  	// Put explicitly provided properties onto the event object
  	if ( props ) {
  		jQuery.extend( this, props );
  	}
  
  	// Create a timestamp if incoming event doesn't have one
  	this.timeStamp = src && src.timeStamp || jQuery.now();
  
  	// Mark it as fixed
  	this[ jQuery.expando ] = true;
  };
  
  function returnFalse() {
  	return false;
  }
  function returnTrue() {
  	return true;
  }
  
  // jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
  // http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
  jQuery.Event.prototype = {
  	preventDefault: function() {
  		this.isDefaultPrevented = returnTrue;
  
  		var e = this.originalEvent;
  		if ( !e ) {
  			return;
  		}
  
  		// if preventDefault exists run it on the original event
  		if ( e.preventDefault ) {
  			e.preventDefault();
  
  		// otherwise set the returnValue property of the original event to false (IE)
  		} else {
  			e.returnValue = false;
  		}
  	},
  	stopPropagation: function() {
  		this.isPropagationStopped = returnTrue;
  
  		var e = this.originalEvent;
  		if ( !e ) {
  			return;
  		}
  		// if stopPropagation exists run it on the original event
  		if ( e.stopPropagation ) {
  			e.stopPropagation();
  		}
  		// otherwise set the cancelBubble property of the original event to true (IE)
  		e.cancelBubble = true;
  	},
  	stopImmediatePropagation: function() {
  		this.isImmediatePropagationStopped = returnTrue;
  		this.stopPropagation();
  	},
  	isDefaultPrevented: returnFalse,
  	isPropagationStopped: returnFalse,
  	isImmediatePropagationStopped: returnFalse
  };
  
  // Create mouseenter/leave events using mouseover/out and event-time checks
  jQuery.each({
  	mouseenter: "mouseover",
  	mouseleave: "mouseout"
  }, function( orig, fix ) {
  	jQuery.event.special[ orig ] = {
  		delegateType: fix,
  		bindType: fix,
  
  		handle: function( event ) {
  			var ret,
  				target = this,
  				related = event.relatedTarget,
  				handleObj = event.handleObj,
  				selector = handleObj.selector;
  
  			// For mousenter/leave call the handler if related is outside the target.
  			// NB: No relatedTarget if the mouse left/entered the browser window
  			if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
  				event.type = handleObj.origType;
  				ret = handleObj.handler.apply( this, arguments );
  				event.type = fix;
  			}
  			return ret;
  		}
  	};
  });
  
  // IE submit delegation
  if ( !jQuery.support.submitBubbles ) {
  
  	jQuery.event.special.submit = {
  		setup: function() {
  			// Only need this for delegated form submit events
  			if ( jQuery.nodeName( this, "form" ) ) {
  				return false;
  			}
  
  			// Lazy-add a submit handler when a descendant form may potentially be submitted
  			jQuery.event.add( this, "click._submit keypress._submit", function( e ) {
  				// Node name check avoids a VML-related crash in IE (#9807)
  				var elem = e.target,
  					form = jQuery.nodeName( elem, "input" ) || jQuery.nodeName( elem, "button" ) ? elem.form : undefined;
  				if ( form && !jQuery._data( form, "_submit_attached" ) ) {
  					jQuery.event.add( form, "submit._submit", function( event ) {
  						event._submit_bubble = true;
  					});
  					jQuery._data( form, "_submit_attached", true );
  				}
  			});
  			// return undefined since we don't need an event listener
  		},
  
  		postDispatch: function( event ) {
  			// If form was submitted by the user, bubble the event up the tree
  			if ( event._submit_bubble ) {
  				delete event._submit_bubble;
  				if ( this.parentNode && !event.isTrigger ) {
  					jQuery.event.simulate( "submit", this.parentNode, event, true );
  				}
  			}
  		},
  
  		teardown: function() {
  			// Only need this for delegated form submit events
  			if ( jQuery.nodeName( this, "form" ) ) {
  				return false;
  			}
  
  			// Remove delegated handlers; cleanData eventually reaps submit handlers attached above
  			jQuery.event.remove( this, "._submit" );
  		}
  	};
  }
  
  // IE change delegation and checkbox/radio fix
  if ( !jQuery.support.changeBubbles ) {
  
  	jQuery.event.special.change = {
  
  		setup: function() {
  
  			if ( rformElems.test( this.nodeName ) ) {
  				// IE doesn't fire change on a check/radio until blur; trigger it on click
  				// after a propertychange. Eat the blur-change in special.change.handle.
  				// This still fires onchange a second time for check/radio after blur.
  				if ( this.type === "checkbox" || this.type === "radio" ) {
  					jQuery.event.add( this, "propertychange._change", function( event ) {
  						if ( event.originalEvent.propertyName === "checked" ) {
  							this._just_changed = true;
  						}
  					});
  					jQuery.event.add( this, "click._change", function( event ) {
  						if ( this._just_changed && !event.isTrigger ) {
  							this._just_changed = false;
  						}
  						// Allow triggered, simulated change events (#11500)
  						jQuery.event.simulate( "change", this, event, true );
  					});
  				}
  				return false;
  			}
  			// Delegated event; lazy-add a change handler on descendant inputs
  			jQuery.event.add( this, "beforeactivate._change", function( e ) {
  				var elem = e.target;
  
  				if ( rformElems.test( elem.nodeName ) && !jQuery._data( elem, "_change_attached" ) ) {
  					jQuery.event.add( elem, "change._change", function( event ) {
  						if ( this.parentNode && !event.isSimulated && !event.isTrigger ) {
  							jQuery.event.simulate( "change", this.parentNode, event, true );
  						}
  					});
  					jQuery._data( elem, "_change_attached", true );
  				}
  			});
  		},
  
  		handle: function( event ) {
  			var elem = event.target;
  
  			// Swallow native change events from checkbox/radio, we already triggered them above
  			if ( this !== elem || event.isSimulated || event.isTrigger || (elem.type !== "radio" && elem.type !== "checkbox") ) {
  				return event.handleObj.handler.apply( this, arguments );
  			}
  		},
  
  		teardown: function() {
  			jQuery.event.remove( this, "._change" );
  
  			return !rformElems.test( this.nodeName );
  		}
  	};
  }
  
  // Create "bubbling" focus and blur events
  if ( !jQuery.support.focusinBubbles ) {
  	jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {
  
  		// Attach a single capturing handler while someone wants focusin/focusout
  		var attaches = 0,
  			handler = function( event ) {
  				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
  			};
  
  		jQuery.event.special[ fix ] = {
  			setup: function() {
  				if ( attaches++ === 0 ) {
  					document.addEventListener( orig, handler, true );
  				}
  			},
  			teardown: function() {
  				if ( --attaches === 0 ) {
  					document.removeEventListener( orig, handler, true );
  				}
  			}
  		};
  	});
  }
  
  jQuery.fn.extend({
  
  	on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
  		var origFn, type;
  
  		// Types can be a map of types/handlers
  		if ( typeof types === "object" ) {
  			// ( types-Object, selector, data )
  			if ( typeof selector !== "string" ) { // && selector != null
  				// ( types-Object, data )
  				data = data || selector;
  				selector = undefined;
  			}
  			for ( type in types ) {
  				this.on( type, selector, data, types[ type ], one );
  			}
  			return this;
  		}
  
  		if ( data == null && fn == null ) {
  			// ( types, fn )
  			fn = selector;
  			data = selector = undefined;
  		} else if ( fn == null ) {
  			if ( typeof selector === "string" ) {
  				// ( types, selector, fn )
  				fn = data;
  				data = undefined;
  			} else {
  				// ( types, data, fn )
  				fn = data;
  				data = selector;
  				selector = undefined;
  			}
  		}
  		if ( fn === false ) {
  			fn = returnFalse;
  		} else if ( !fn ) {
  			return this;
  		}
  
  		if ( one === 1 ) {
  			origFn = fn;
  			fn = function( event ) {
  				// Can use an empty set, since event contains the info
  				jQuery().off( event );
  				return origFn.apply( this, arguments );
  			};
  			// Use same guid so caller can remove using origFn
  			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
  		}
  		return this.each( function() {
  			jQuery.event.add( this, types, fn, data, selector );
  		});
  	},
  	one: function( types, selector, data, fn ) {
  		return this.on( types, selector, data, fn, 1 );
  	},
  	off: function( types, selector, fn ) {
  		var handleObj, type;
  		if ( types && types.preventDefault && types.handleObj ) {
  			// ( event )  dispatched jQuery.Event
  			handleObj = types.handleObj;
  			jQuery( types.delegateTarget ).off(
  				handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
  				handleObj.selector,
  				handleObj.handler
  			);
  			return this;
  		}
  		if ( typeof types === "object" ) {
  			// ( types-object [, selector] )
  			for ( type in types ) {
  				this.off( type, selector, types[ type ] );
  			}
  			return this;
  		}
  		if ( selector === false || typeof selector === "function" ) {
  			// ( types [, fn] )
  			fn = selector;
  			selector = undefined;
  		}
  		if ( fn === false ) {
  			fn = returnFalse;
  		}
  		return this.each(function() {
  			jQuery.event.remove( this, types, fn, selector );
  		});
  	},
  
  	bind: function( types, data, fn ) {
  		return this.on( types, null, data, fn );
  	},
  	unbind: function( types, fn ) {
  		return this.off( types, null, fn );
  	},
  
  	live: function( types, data, fn ) {
  		jQuery( this.context ).on( types, this.selector, data, fn );
  		return this;
  	},
  	die: function( types, fn ) {
  		jQuery( this.context ).off( types, this.selector || "**", fn );
  		return this;
  	},
  
  	delegate: function( selector, types, data, fn ) {
  		return this.on( types, selector, data, fn );
  	},
  	undelegate: function( selector, types, fn ) {
  		// ( namespace ) or ( selector, types [, fn] )
  		return arguments.length === 1 ? this.off( selector, "**" ) : this.off( types, selector || "**", fn );
  	},
  
  	trigger: function( type, data ) {
  		return this.each(function() {
  			jQuery.event.trigger( type, data, this );
  		});
  	},
  	triggerHandler: function( type, data ) {
  		if ( this[0] ) {
  			return jQuery.event.trigger( type, data, this[0], true );
  		}
  	},
  
  	toggle: function( fn ) {
  		// Save reference to arguments for access in closure
  		var args = arguments,
  			guid = fn.guid || jQuery.guid++,
  			i = 0,
  			toggler = function( event ) {
  				// Figure out which function to execute
  				var lastToggle = ( jQuery._data( this, "lastToggle" + fn.guid ) || 0 ) % i;
  				jQuery._data( this, "lastToggle" + fn.guid, lastToggle + 1 );
  
  				// Make sure that clicks stop
  				event.preventDefault();
  
  				// and execute the function
  				return args[ lastToggle ].apply( this, arguments ) || false;
  			};
  
  		// link all the functions, so any of them can unbind this click handler
  		toggler.guid = guid;
  		while ( i < args.length ) {
  			args[ i++ ].guid = guid;
  		}
  
  		return this.click( toggler );
  	},
  
  	hover: function( fnOver, fnOut ) {
  		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
  	}
  });
  
  jQuery.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
  	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
  	"change select submit keydown keypress keyup error contextmenu").split(" "), function( i, name ) {
  
  	// Handle event binding
  	jQuery.fn[ name ] = function( data, fn ) {
  		if ( fn == null ) {
  			fn = data;
  			data = null;
  		}
  
  		return arguments.length > 0 ?
  			this.on( name, null, data, fn ) :
  			this.trigger( name );
  	};
  
  	if ( rkeyEvent.test( name ) ) {
  		jQuery.event.fixHooks[ name ] = jQuery.event.keyHooks;
  	}
  
  	if ( rmouseEvent.test( name ) ) {
  		jQuery.event.fixHooks[ name ] = jQuery.event.mouseHooks;
  	}
  });
  /*!
   * Sizzle CSS Selector Engine
   * Copyright 2012 jQuery Foundation and other contributors
   * Released under the MIT license
   * http://sizzlejs.com/
   */
  (function( window, undefined ) {
  
  var cachedruns,
  	assertGetIdNotName,
  	Expr,
  	getText,
  	isXML,
  	contains,
  	compile,
  	sortOrder,
  	hasDuplicate,
  	outermostContext,
  
  	baseHasDuplicate = true,
  	strundefined = "undefined",
  
  	expando = ( "sizcache" + Math.random() ).replace( ".", "" ),
  
  	Token = String,
  	document = window.document,
  	docElem = document.documentElement,
  	dirruns = 0,
  	done = 0,
  	pop = [].pop,
  	push = [].push,
  	slice = [].slice,
  	// Use a stripped-down indexOf if a native one is unavailable
  	indexOf = [].indexOf || function( elem ) {
  		var i = 0,
  			len = this.length;
  		for ( ; i < len; i++ ) {
  			if ( this[i] === elem ) {
  				return i;
  			}
  		}
  		return -1;
  	},
  
  	// Augment a function for special use by Sizzle
  	markFunction = function( fn, value ) {
  		fn[ expando ] = value == null || value;
  		return fn;
  	},
  
  	createCache = function() {
  		var cache = {},
  			keys = [];
  
  		return markFunction(function( key, value ) {
  			// Only keep the most recent entries
  			if ( keys.push( key ) > Expr.cacheLength ) {
  				delete cache[ keys.shift() ];
  			}
  
  			// Retrieve with (key + " ") to avoid collision with native Object.prototype properties (see Issue #157)
  			return (cache[ key + " " ] = value);
  		}, cache );
  	},
  
  	classCache = createCache(),
  	tokenCache = createCache(),
  	compilerCache = createCache(),
  
  	// Regex
  
  	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
  	whitespace = "[\\x20\\t\\r\\n\\f]",
  	// http://www.w3.org/TR/css3-syntax/#characters
  	characterEncoding = "(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+",
  
  	// Loosely modeled on CSS identifier characters
  	// An unquoted value should be a CSS identifier (http://www.w3.org/TR/css3-selectors/#attribute-selectors)
  	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
  	identifier = characterEncoding.replace( "w", "w#" ),
  
  	// Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
  	operators = "([*^$|!~]?=)",
  	attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace +
  		"*(?:" + operators + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",
  
  	// Prefer arguments not in parens/brackets,
  	//   then attribute selectors and non-pseudos (denoted by :),
  	//   then anything else
  	// These preferences are here to reduce the number of selectors
  	//   needing tokenize in the PSEUDO preFilter
  	pseudos = ":(" + characterEncoding + ")(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|([^()[\\]]*|(?:(?:" + attributes + ")|[^:]|\\\\.)*|.*))\\)|)",
  
  	// For matchExpr.POS and matchExpr.needsContext
  	pos = ":(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace +
  		"*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)",
  
  	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
  	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),
  
  	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
  	rcombinators = new RegExp( "^" + whitespace + "*([\\x20\\t\\r\\n\\f>+~])" + whitespace + "*" ),
  	rpseudo = new RegExp( pseudos ),
  
  	// Easily-parseable/retrievable ID or TAG or CLASS selectors
  	rquickExpr = /^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/,
  
  	rnot = /^:not/,
  	rsibling = /[\x20\t\r\n\f]*[+~]/,
  	rendsWithNot = /:not\($/,
  
  	rheader = /h\d/i,
  	rinputs = /input|select|textarea|button/i,
  
  	rbackslash = /\\(?!\\)/g,
  
  	matchExpr = {
  		"ID": new RegExp( "^#(" + characterEncoding + ")" ),
  		"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
  		"NAME": new RegExp( "^\\[name=['\"]?(" + characterEncoding + ")['\"]?\\]" ),
  		"TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
  		"ATTR": new RegExp( "^" + attributes ),
  		"PSEUDO": new RegExp( "^" + pseudos ),
  		"POS": new RegExp( pos, "i" ),
  		"CHILD": new RegExp( "^:(only|nth|first|last)-child(?:\\(" + whitespace +
  			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
  			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
  		// For use in libraries implementing .is()
  		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|" + pos, "i" )
  	},
  
  	// Support
  
  	// Used for testing something on an element
  	assert = function( fn ) {
  		var div = document.createElement("div");
  
  		try {
  			return fn( div );
  		} catch (e) {
  			return false;
  		} finally {
  			// release memory in IE
  			div = null;
  		}
  	},
  
  	// Check if getElementsByTagName("*") returns only elements
  	assertTagNameNoComments = assert(function( div ) {
  		div.appendChild( document.createComment("") );
  		return !div.getElementsByTagName("*").length;
  	}),
  
  	// Check if getAttribute returns normalized href attributes
  	assertHrefNotNormalized = assert(function( div ) {
  		div.innerHTML = "<a href='#'></a>";
  		return div.firstChild && typeof div.firstChild.getAttribute !== strundefined &&
  			div.firstChild.getAttribute("href") === "#";
  	}),
  
  	// Check if attributes should be retrieved by attribute nodes
  	assertAttributes = assert(function( div ) {
  		div.innerHTML = "<select></select>";
  		var type = typeof div.lastChild.getAttribute("multiple");
  		// IE8 returns a string for some attributes even when not present
  		return type !== "boolean" && type !== "string";
  	}),
  
  	// Check if getElementsByClassName can be trusted
  	assertUsableClassName = assert(function( div ) {
  		// Opera can't find a second classname (in 9.6)
  		div.innerHTML = "<div class='hidden e'></div><div class='hidden'></div>";
  		if ( !div.getElementsByClassName || !div.getElementsByClassName("e").length ) {
  			return false;
  		}
  
  		// Safari 3.2 caches class attributes and doesn't catch changes
  		div.lastChild.className = "e";
  		return div.getElementsByClassName("e").length === 2;
  	}),
  
  	// Check if getElementById returns elements by name
  	// Check if getElementsByName privileges form controls or returns elements by ID
  	assertUsableName = assert(function( div ) {
  		// Inject content
  		div.id = expando + 0;
  		div.innerHTML = "<a name='" + expando + "'></a><div name='" + expando + "'></div>";
  		docElem.insertBefore( div, docElem.firstChild );
  
  		// Test
  		var pass = document.getElementsByName &&
  			// buggy browsers will return fewer than the correct 2
  			document.getElementsByName( expando ).length === 2 +
  			// buggy browsers will return more than the correct 0
  			document.getElementsByName( expando + 0 ).length;
  		assertGetIdNotName = !document.getElementById( expando );
  
  		// Cleanup
  		docElem.removeChild( div );
  
  		return pass;
  	});
  
  // If slice is not available, provide a backup
  try {
  	slice.call( docElem.childNodes, 0 )[0].nodeType;
  } catch ( e ) {
  	slice = function( i ) {
  		var elem,
  			results = [];
  		for ( ; (elem = this[i]); i++ ) {
  			results.push( elem );
  		}
  		return results;
  	};
  }
  
  function Sizzle( selector, context, results, seed ) {
  	results = results || [];
  	context = context || document;
  	var match, elem, xml, m,
  		nodeType = context.nodeType;
  
  	if ( !selector || typeof selector !== "string" ) {
  		return results;
  	}
  
  	if ( nodeType !== 1 && nodeType !== 9 ) {
  		return [];
  	}
  
  	xml = isXML( context );
  
  	if ( !xml && !seed ) {
  		if ( (match = rquickExpr.exec( selector )) ) {
  			// Speed-up: Sizzle("#ID")
  			if ( (m = match[1]) ) {
  				if ( nodeType === 9 ) {
  					elem = context.getElementById( m );
  					// Check parentNode to catch when Blackberry 4.6 returns
  					// nodes that are no longer in the document #6963
  					if ( elem && elem.parentNode ) {
  						// Handle the case where IE, Opera, and Webkit return items
  						// by name instead of ID
  						if ( elem.id === m ) {
  							results.push( elem );
  							return results;
  						}
  					} else {
  						return results;
  					}
  				} else {
  					// Context is not a document
  					if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
  						contains( context, elem ) && elem.id === m ) {
  						results.push( elem );
  						return results;
  					}
  				}
  
  			// Speed-up: Sizzle("TAG")
  			} else if ( match[2] ) {
  				push.apply( results, slice.call(context.getElementsByTagName( selector ), 0) );
  				return results;
  
  			// Speed-up: Sizzle(".CLASS")
  			} else if ( (m = match[3]) && assertUsableClassName && context.getElementsByClassName ) {
  				push.apply( results, slice.call(context.getElementsByClassName( m ), 0) );
  				return results;
  			}
  		}
  	}
  
  	// All others
  	return select( selector.replace( rtrim, "$1" ), context, results, seed, xml );
  }
  
  Sizzle.matches = function( expr, elements ) {
  	return Sizzle( expr, null, null, elements );
  };
  
  Sizzle.matchesSelector = function( elem, expr ) {
  	return Sizzle( expr, null, null, [ elem ] ).length > 0;
  };
  
  // Returns a function to use in pseudos for input types
  function createInputPseudo( type ) {
  	return function( elem ) {
  		var name = elem.nodeName.toLowerCase();
  		return name === "input" && elem.type === type;
  	};
  }
  
  // Returns a function to use in pseudos for buttons
  function createButtonPseudo( type ) {
  	return function( elem ) {
  		var name = elem.nodeName.toLowerCase();
  		return (name === "input" || name === "button") && elem.type === type;
  	};
  }
  
  // Returns a function to use in pseudos for positionals
  function createPositionalPseudo( fn ) {
  	return markFunction(function( argument ) {
  		argument = +argument;
  		return markFunction(function( seed, matches ) {
  			var j,
  				matchIndexes = fn( [], seed.length, argument ),
  				i = matchIndexes.length;
  
  			// Match elements found at the specified indexes
  			while ( i-- ) {
  				if ( seed[ (j = matchIndexes[i]) ] ) {
  					seed[j] = !(matches[j] = seed[j]);
  				}
  			}
  		});
  	});
  }
  
  /**
   * Utility function for retrieving the text value of an array of DOM nodes
   * @param {Array|Element} elem
   */
  getText = Sizzle.getText = function( elem ) {
  	var node,
  		ret = "",
  		i = 0,
  		nodeType = elem.nodeType;
  
  	if ( nodeType ) {
  		if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
  			// Use textContent for elements
  			// innerText usage removed for consistency of new lines (see #11153)
  			if ( typeof elem.textContent === "string" ) {
  				return elem.textContent;
  			} else {
  				// Traverse its children
  				for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
  					ret += getText( elem );
  				}
  			}
  		} else if ( nodeType === 3 || nodeType === 4 ) {
  			return elem.nodeValue;
  		}
  		// Do not include comment or processing instruction nodes
  	} else {
  
  		// If no nodeType, this is expected to be an array
  		for ( ; (node = elem[i]); i++ ) {
  			// Do not traverse comment nodes
  			ret += getText( node );
  		}
  	}
  	return ret;
  };
  
  isXML = Sizzle.isXML = function( elem ) {
  	// documentElement is verified for cases where it doesn't yet exist
  	// (such as loading iframes in IE - #4833)
  	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
  	return documentElement ? documentElement.nodeName !== "HTML" : false;
  };
  
  // Element contains another
  contains = Sizzle.contains = docElem.contains ?
  	function( a, b ) {
  		var adown = a.nodeType === 9 ? a.documentElement : a,
  			bup = b && b.parentNode;
  		return a === bup || !!( bup && bup.nodeType === 1 && adown.contains && adown.contains(bup) );
  	} :
  	docElem.compareDocumentPosition ?
  	function( a, b ) {
  		return b && !!( a.compareDocumentPosition( b ) & 16 );
  	} :
  	function( a, b ) {
  		while ( (b = b.parentNode) ) {
  			if ( b === a ) {
  				return true;
  			}
  		}
  		return false;
  	};
  
  Sizzle.attr = function( elem, name ) {
  	var val,
  		xml = isXML( elem );
  
  	if ( !xml ) {
  		name = name.toLowerCase();
  	}
  	if ( (val = Expr.attrHandle[ name ]) ) {
  		return val( elem );
  	}
  	if ( xml || assertAttributes ) {
  		return elem.getAttribute( name );
  	}
  	val = elem.getAttributeNode( name );
  	return val ?
  		typeof elem[ name ] === "boolean" ?
  			elem[ name ] ? name : null :
  			val.specified ? val.value : null :
  		null;
  };
  
  Expr = Sizzle.selectors = {
  
  	// Can be adjusted by the user
  	cacheLength: 50,
  
  	createPseudo: markFunction,
  
  	match: matchExpr,
  
  	// IE6/7 return a modified href
  	attrHandle: assertHrefNotNormalized ?
  		{} :
  		{
  			"href": function( elem ) {
  				return elem.getAttribute( "href", 2 );
  			},
  			"type": function( elem ) {
  				return elem.getAttribute("type");
  			}
  		},
  
  	find: {
  		"ID": assertGetIdNotName ?
  			function( id, context, xml ) {
  				if ( typeof context.getElementById !== strundefined && !xml ) {
  					var m = context.getElementById( id );
  					// Check parentNode to catch when Blackberry 4.6 returns
  					// nodes that are no longer in the document #6963
  					return m && m.parentNode ? [m] : [];
  				}
  			} :
  			function( id, context, xml ) {
  				if ( typeof context.getElementById !== strundefined && !xml ) {
  					var m = context.getElementById( id );
  
  					return m ?
  						m.id === id || typeof m.getAttributeNode !== strundefined && m.getAttributeNode("id").value === id ?
  							[m] :
  							undefined :
  						[];
  				}
  			},
  
  		"TAG": assertTagNameNoComments ?
  			function( tag, context ) {
  				if ( typeof context.getElementsByTagName !== strundefined ) {
  					return context.getElementsByTagName( tag );
  				}
  			} :
  			function( tag, context ) {
  				var results = context.getElementsByTagName( tag );
  
  				// Filter out possible comments
  				if ( tag === "*" ) {
  					var elem,
  						tmp = [],
  						i = 0;
  
  					for ( ; (elem = results[i]); i++ ) {
  						if ( elem.nodeType === 1 ) {
  							tmp.push( elem );
  						}
  					}
  
  					return tmp;
  				}
  				return results;
  			},
  
  		"NAME": assertUsableName && function( tag, context ) {
  			if ( typeof context.getElementsByName !== strundefined ) {
  				return context.getElementsByName( name );
  			}
  		},
  
  		"CLASS": assertUsableClassName && function( className, context, xml ) {
  			if ( typeof context.getElementsByClassName !== strundefined && !xml ) {
  				return context.getElementsByClassName( className );
  			}
  		}
  	},
  
  	relative: {
  		">": { dir: "parentNode", first: true },
  		" ": { dir: "parentNode" },
  		"+": { dir: "previousSibling", first: true },
  		"~": { dir: "previousSibling" }
  	},
  
  	preFilter: {
  		"ATTR": function( match ) {
  			match[1] = match[1].replace( rbackslash, "" );
  
  			// Move the given value to match[3] whether quoted or unquoted
  			match[3] = ( match[4] || match[5] || "" ).replace( rbackslash, "" );
  
  			if ( match[2] === "~=" ) {
  				match[3] = " " + match[3] + " ";
  			}
  
  			return match.slice( 0, 4 );
  		},
  
  		"CHILD": function( match ) {
  			/* matches from matchExpr["CHILD"]
  				1 type (only|nth|...)
  				2 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
  				3 xn-component of xn+y argument ([+-]?\d*n|)
  				4 sign of xn-component
  				5 x of xn-component
  				6 sign of y-component
  				7 y of y-component
  			*/
  			match[1] = match[1].toLowerCase();
  
  			if ( match[1] === "nth" ) {
  				// nth-child requires argument
  				if ( !match[2] ) {
  					Sizzle.error( match[0] );
  				}
  
  				// numeric x and y parameters for Expr.filter.CHILD
  				// remember that false/true cast respectively to 0/1
  				match[3] = +( match[3] ? match[4] + (match[5] || 1) : 2 * ( match[2] === "even" || match[2] === "odd" ) );
  				match[4] = +( ( match[6] + match[7] ) || match[2] === "odd" );
  
  			// other types prohibit arguments
  			} else if ( match[2] ) {
  				Sizzle.error( match[0] );
  			}
  
  			return match;
  		},
  
  		"PSEUDO": function( match ) {
  			var unquoted, excess;
  			if ( matchExpr["CHILD"].test( match[0] ) ) {
  				return null;
  			}
  
  			if ( match[3] ) {
  				match[2] = match[3];
  			} else if ( (unquoted = match[4]) ) {
  				// Only check arguments that contain a pseudo
  				if ( rpseudo.test(unquoted) &&
  					// Get excess from tokenize (recursively)
  					(excess = tokenize( unquoted, true )) &&
  					// advance to the next closing parenthesis
  					(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {
  
  					// excess is a negative index
  					unquoted = unquoted.slice( 0, excess );
  					match[0] = match[0].slice( 0, excess );
  				}
  				match[2] = unquoted;
  			}
  
  			// Return only captures needed by the pseudo filter method (type and argument)
  			return match.slice( 0, 3 );
  		}
  	},
  
  	filter: {
  		"ID": assertGetIdNotName ?
  			function( id ) {
  				id = id.replace( rbackslash, "" );
  				return function( elem ) {
  					return elem.getAttribute("id") === id;
  				};
  			} :
  			function( id ) {
  				id = id.replace( rbackslash, "" );
  				return function( elem ) {
  					var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
  					return node && node.value === id;
  				};
  			},
  
  		"TAG": function( nodeName ) {
  			if ( nodeName === "*" ) {
  				return function() { return true; };
  			}
  			nodeName = nodeName.replace( rbackslash, "" ).toLowerCase();
  
  			return function( elem ) {
  				return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
  			};
  		},
  
  		"CLASS": function( className ) {
  			var pattern = classCache[ expando ][ className + " " ];
  
  			return pattern ||
  				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
  				classCache( className, function( elem ) {
  					return pattern.test( elem.className || (typeof elem.getAttribute !== strundefined && elem.getAttribute("class")) || "" );
  				});
  		},
  
  		"ATTR": function( name, operator, check ) {
  			return function( elem, context ) {
  				var result = Sizzle.attr( elem, name );
  
  				if ( result == null ) {
  					return operator === "!=";
  				}
  				if ( !operator ) {
  					return true;
  				}
  
  				result += "";
  
  				return operator === "=" ? result === check :
  					operator === "!=" ? result !== check :
  					operator === "^=" ? check && result.indexOf( check ) === 0 :
  					operator === "*=" ? check && result.indexOf( check ) > -1 :
  					operator === "$=" ? check && result.substr( result.length - check.length ) === check :
  					operator === "~=" ? ( " " + result + " " ).indexOf( check ) > -1 :
  					operator === "|=" ? result === check || result.substr( 0, check.length + 1 ) === check + "-" :
  					false;
  			};
  		},
  
  		"CHILD": function( type, argument, first, last ) {
  
  			if ( type === "nth" ) {
  				return function( elem ) {
  					var node, diff,
  						parent = elem.parentNode;
  
  					if ( first === 1 && last === 0 ) {
  						return true;
  					}
  
  					if ( parent ) {
  						diff = 0;
  						for ( node = parent.firstChild; node; node = node.nextSibling ) {
  							if ( node.nodeType === 1 ) {
  								diff++;
  								if ( elem === node ) {
  									break;
  								}
  							}
  						}
  					}
  
  					// Incorporate the offset (or cast to NaN), then check against cycle size
  					diff -= last;
  					return diff === first || ( diff % first === 0 && diff / first >= 0 );
  				};
  			}
  
  			return function( elem ) {
  				var node = elem;
  
  				switch ( type ) {
  					case "only":
  					case "first":
  						while ( (node = node.previousSibling) ) {
  							if ( node.nodeType === 1 ) {
  								return false;
  							}
  						}
  
  						if ( type === "first" ) {
  							return true;
  						}
  
  						node = elem;
  
  						/* falls through */
  					case "last":
  						while ( (node = node.nextSibling) ) {
  							if ( node.nodeType === 1 ) {
  								return false;
  							}
  						}
  
  						return true;
  				}
  			};
  		},
  
  		"PSEUDO": function( pseudo, argument ) {
  			// pseudo-class names are case-insensitive
  			// http://www.w3.org/TR/selectors/#pseudo-classes
  			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
  			// Remember that setFilters inherits from pseudos
  			var args,
  				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
  					Sizzle.error( "unsupported pseudo: " + pseudo );
  
  			// The user may use createPseudo to indicate that
  			// arguments are needed to create the filter function
  			// just as Sizzle does
  			if ( fn[ expando ] ) {
  				return fn( argument );
  			}
  
  			// But maintain support for old signatures
  			if ( fn.length > 1 ) {
  				args = [ pseudo, pseudo, "", argument ];
  				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
  					markFunction(function( seed, matches ) {
  						var idx,
  							matched = fn( seed, argument ),
  							i = matched.length;
  						while ( i-- ) {
  							idx = indexOf.call( seed, matched[i] );
  							seed[ idx ] = !( matches[ idx ] = matched[i] );
  						}
  					}) :
  					function( elem ) {
  						return fn( elem, 0, args );
  					};
  			}
  
  			return fn;
  		}
  	},
  
  	pseudos: {
  		"not": markFunction(function( selector ) {
  			// Trim the selector passed to compile
  			// to avoid treating leading and trailing
  			// spaces as combinators
  			var input = [],
  				results = [],
  				matcher = compile( selector.replace( rtrim, "$1" ) );
  
  			return matcher[ expando ] ?
  				markFunction(function( seed, matches, context, xml ) {
  					var elem,
  						unmatched = matcher( seed, null, xml, [] ),
  						i = seed.length;
  
  					// Match elements unmatched by `matcher`
  					while ( i-- ) {
  						if ( (elem = unmatched[i]) ) {
  							seed[i] = !(matches[i] = elem);
  						}
  					}
  				}) :
  				function( elem, context, xml ) {
  					input[0] = elem;
  					matcher( input, null, xml, results );
  					return !results.pop();
  				};
  		}),
  
  		"has": markFunction(function( selector ) {
  			return function( elem ) {
  				return Sizzle( selector, elem ).length > 0;
  			};
  		}),
  
  		"contains": markFunction(function( text ) {
  			return function( elem ) {
  				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
  			};
  		}),
  
  		"enabled": function( elem ) {
  			return elem.disabled === false;
  		},
  
  		"disabled": function( elem ) {
  			return elem.disabled === true;
  		},
  
  		"checked": function( elem ) {
  			// In CSS3, :checked should return both checked and selected elements
  			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
  			var nodeName = elem.nodeName.toLowerCase();
  			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
  		},
  
  		"selected": function( elem ) {
  			// Accessing this property makes selected-by-default
  			// options in Safari work properly
  			if ( elem.parentNode ) {
  				elem.parentNode.selectedIndex;
  			}
  
  			return elem.selected === true;
  		},
  
  		"parent": function( elem ) {
  			return !Expr.pseudos["empty"]( elem );
  		},
  
  		"empty": function( elem ) {
  			// http://www.w3.org/TR/selectors/#empty-pseudo
  			// :empty is only affected by element nodes and content nodes(including text(3), cdata(4)),
  			//   not comment, processing instructions, or others
  			// Thanks to Diego Perini for the nodeName shortcut
  			//   Greater than "@" means alpha characters (specifically not starting with "#" or "?")
  			var nodeType;
  			elem = elem.firstChild;
  			while ( elem ) {
  				if ( elem.nodeName > "@" || (nodeType = elem.nodeType) === 3 || nodeType === 4 ) {
  					return false;
  				}
  				elem = elem.nextSibling;
  			}
  			return true;
  		},
  
  		"header": function( elem ) {
  			return rheader.test( elem.nodeName );
  		},
  
  		"text": function( elem ) {
  			var type, attr;
  			// IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
  			// use getAttribute instead to test this case
  			return elem.nodeName.toLowerCase() === "input" &&
  				(type = elem.type) === "text" &&
  				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === type );
  		},
  
  		// Input types
  		"radio": createInputPseudo("radio"),
  		"checkbox": createInputPseudo("checkbox"),
  		"file": createInputPseudo("file"),
  		"password": createInputPseudo("password"),
  		"image": createInputPseudo("image"),
  
  		"submit": createButtonPseudo("submit"),
  		"reset": createButtonPseudo("reset"),
  
  		"button": function( elem ) {
  			var name = elem.nodeName.toLowerCase();
  			return name === "input" && elem.type === "button" || name === "button";
  		},
  
  		"input": function( elem ) {
  			return rinputs.test( elem.nodeName );
  		},
  
  		"focus": function( elem ) {
  			var doc = elem.ownerDocument;
  			return elem === doc.activeElement && (!doc.hasFocus || doc.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
  		},
  
  		"active": function( elem ) {
  			return elem === elem.ownerDocument.activeElement;
  		},
  
  		// Positional types
  		"first": createPositionalPseudo(function() {
  			return [ 0 ];
  		}),
  
  		"last": createPositionalPseudo(function( matchIndexes, length ) {
  			return [ length - 1 ];
  		}),
  
  		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
  			return [ argument < 0 ? argument + length : argument ];
  		}),
  
  		"even": createPositionalPseudo(function( matchIndexes, length ) {
  			for ( var i = 0; i < length; i += 2 ) {
  				matchIndexes.push( i );
  			}
  			return matchIndexes;
  		}),
  
  		"odd": createPositionalPseudo(function( matchIndexes, length ) {
  			for ( var i = 1; i < length; i += 2 ) {
  				matchIndexes.push( i );
  			}
  			return matchIndexes;
  		}),
  
  		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
  			for ( var i = argument < 0 ? argument + length : argument; --i >= 0; ) {
  				matchIndexes.push( i );
  			}
  			return matchIndexes;
  		}),
  
  		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
  			for ( var i = argument < 0 ? argument + length : argument; ++i < length; ) {
  				matchIndexes.push( i );
  			}
  			return matchIndexes;
  		})
  	}
  };
  
  function siblingCheck( a, b, ret ) {
  	if ( a === b ) {
  		return ret;
  	}
  
  	var cur = a.nextSibling;
  
  	while ( cur ) {
  		if ( cur === b ) {
  			return -1;
  		}
  
  		cur = cur.nextSibling;
  	}
  
  	return 1;
  }
  
  sortOrder = docElem.compareDocumentPosition ?
  	function( a, b ) {
  		if ( a === b ) {
  			hasDuplicate = true;
  			return 0;
  		}
  
  		return ( !a.compareDocumentPosition || !b.compareDocumentPosition ?
  			a.compareDocumentPosition :
  			a.compareDocumentPosition(b) & 4
  		) ? -1 : 1;
  	} :
  	function( a, b ) {
  		// The nodes are identical, we can exit early
  		if ( a === b ) {
  			hasDuplicate = true;
  			return 0;
  
  		// Fallback to using sourceIndex (in IE) if it's available on both nodes
  		} else if ( a.sourceIndex && b.sourceIndex ) {
  			return a.sourceIndex - b.sourceIndex;
  		}
  
  		var al, bl,
  			ap = [],
  			bp = [],
  			aup = a.parentNode,
  			bup = b.parentNode,
  			cur = aup;
  
  		// If the nodes are siblings (or identical) we can do a quick check
  		if ( aup === bup ) {
  			return siblingCheck( a, b );
  
  		// If no parents were found then the nodes are disconnected
  		} else if ( !aup ) {
  			return -1;
  
  		} else if ( !bup ) {
  			return 1;
  		}
  
  		// Otherwise they're somewhere else in the tree so we need
  		// to build up a full list of the parentNodes for comparison
  		while ( cur ) {
  			ap.unshift( cur );
  			cur = cur.parentNode;
  		}
  
  		cur = bup;
  
  		while ( cur ) {
  			bp.unshift( cur );
  			cur = cur.parentNode;
  		}
  
  		al = ap.length;
  		bl = bp.length;
  
  		// Start walking down the tree looking for a discrepancy
  		for ( var i = 0; i < al && i < bl; i++ ) {
  			if ( ap[i] !== bp[i] ) {
  				return siblingCheck( ap[i], bp[i] );
  			}
  		}
  
  		// We ended someplace up the tree so do a sibling check
  		return i === al ?
  			siblingCheck( a, bp[i], -1 ) :
  			siblingCheck( ap[i], b, 1 );
  	};
  
  // Always assume the presence of duplicates if sort doesn't
  // pass them to our comparison function (as in Google Chrome).
  [0, 0].sort( sortOrder );
  baseHasDuplicate = !hasDuplicate;
  
  // Document sorting and removing duplicates
  Sizzle.uniqueSort = function( results ) {
  	var elem,
  		duplicates = [],
  		i = 1,
  		j = 0;
  
  	hasDuplicate = baseHasDuplicate;
  	results.sort( sortOrder );
  
  	if ( hasDuplicate ) {
  		for ( ; (elem = results[i]); i++ ) {
  			if ( elem === results[ i - 1 ] ) {
  				j = duplicates.push( i );
  			}
  		}
  		while ( j-- ) {
  			results.splice( duplicates[ j ], 1 );
  		}
  	}
  
  	return results;
  };
  
  Sizzle.error = function( msg ) {
  	throw new Error( "Syntax error, unrecognized expression: " + msg );
  };
  
  function tokenize( selector, parseOnly ) {
  	var matched, match, tokens, type,
  		soFar, groups, preFilters,
  		cached = tokenCache[ expando ][ selector + " " ];
  
  	if ( cached ) {
  		return parseOnly ? 0 : cached.slice( 0 );
  	}
  
  	soFar = selector;
  	groups = [];
  	preFilters = Expr.preFilter;
  
  	while ( soFar ) {
  
  		// Comma and first run
  		if ( !matched || (match = rcomma.exec( soFar )) ) {
  			if ( match ) {
  				// Don't consume trailing commas as valid
  				soFar = soFar.slice( match[0].length ) || soFar;
  			}
  			groups.push( tokens = [] );
  		}
  
  		matched = false;
  
  		// Combinators
  		if ( (match = rcombinators.exec( soFar )) ) {
  			tokens.push( matched = new Token( match.shift() ) );
  			soFar = soFar.slice( matched.length );
  
  			// Cast descendant combinators to space
  			matched.type = match[0].replace( rtrim, " " );
  		}
  
  		// Filters
  		for ( type in Expr.filter ) {
  			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
  				(match = preFilters[ type ]( match ))) ) {
  
  				tokens.push( matched = new Token( match.shift() ) );
  				soFar = soFar.slice( matched.length );
  				matched.type = type;
  				matched.matches = match;
  			}
  		}
  
  		if ( !matched ) {
  			break;
  		}
  	}
  
  	// Return the length of the invalid excess
  	// if we're just parsing
  	// Otherwise, throw an error or return tokens
  	return parseOnly ?
  		soFar.length :
  		soFar ?
  			Sizzle.error( selector ) :
  			// Cache the tokens
  			tokenCache( selector, groups ).slice( 0 );
  }
  
  function addCombinator( matcher, combinator, base ) {
  	var dir = combinator.dir,
  		checkNonElements = base && combinator.dir === "parentNode",
  		doneName = done++;
  
  	return combinator.first ?
  		// Check against closest ancestor/preceding element
  		function( elem, context, xml ) {
  			while ( (elem = elem[ dir ]) ) {
  				if ( checkNonElements || elem.nodeType === 1  ) {
  					return matcher( elem, context, xml );
  				}
  			}
  		} :
  
  		// Check against all ancestor/preceding elements
  		function( elem, context, xml ) {
  			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
  			if ( !xml ) {
  				var cache,
  					dirkey = dirruns + " " + doneName + " ",
  					cachedkey = dirkey + cachedruns;
  				while ( (elem = elem[ dir ]) ) {
  					if ( checkNonElements || elem.nodeType === 1 ) {
  						if ( (cache = elem[ expando ]) === cachedkey ) {
  							return elem.sizset;
  						} else if ( typeof cache === "string" && cache.indexOf(dirkey) === 0 ) {
  							if ( elem.sizset ) {
  								return elem;
  							}
  						} else {
  							elem[ expando ] = cachedkey;
  							if ( matcher( elem, context, xml ) ) {
  								elem.sizset = true;
  								return elem;
  							}
  							elem.sizset = false;
  						}
  					}
  				}
  			} else {
  				while ( (elem = elem[ dir ]) ) {
  					if ( checkNonElements || elem.nodeType === 1 ) {
  						if ( matcher( elem, context, xml ) ) {
  							return elem;
  						}
  					}
  				}
  			}
  		};
  }
  
  function elementMatcher( matchers ) {
  	return matchers.length > 1 ?
  		function( elem, context, xml ) {
  			var i = matchers.length;
  			while ( i-- ) {
  				if ( !matchers[i]( elem, context, xml ) ) {
  					return false;
  				}
  			}
  			return true;
  		} :
  		matchers[0];
  }
  
  function condense( unmatched, map, filter, context, xml ) {
  	var elem,
  		newUnmatched = [],
  		i = 0,
  		len = unmatched.length,
  		mapped = map != null;
  
  	for ( ; i < len; i++ ) {
  		if ( (elem = unmatched[i]) ) {
  			if ( !filter || filter( elem, context, xml ) ) {
  				newUnmatched.push( elem );
  				if ( mapped ) {
  					map.push( i );
  				}
  			}
  		}
  	}
  
  	return newUnmatched;
  }
  
  function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
  	if ( postFilter && !postFilter[ expando ] ) {
  		postFilter = setMatcher( postFilter );
  	}
  	if ( postFinder && !postFinder[ expando ] ) {
  		postFinder = setMatcher( postFinder, postSelector );
  	}
  	return markFunction(function( seed, results, context, xml ) {
  		var temp, i, elem,
  			preMap = [],
  			postMap = [],
  			preexisting = results.length,
  
  			// Get initial elements from seed or context
  			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),
  
  			// Prefilter to get matcher input, preserving a map for seed-results synchronization
  			matcherIn = preFilter && ( seed || !selector ) ?
  				condense( elems, preMap, preFilter, context, xml ) :
  				elems,
  
  			matcherOut = matcher ?
  				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
  				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?
  
  					// ...intermediate processing is necessary
  					[] :
  
  					// ...otherwise use results directly
  					results :
  				matcherIn;
  
  		// Find primary matches
  		if ( matcher ) {
  			matcher( matcherIn, matcherOut, context, xml );
  		}
  
  		// Apply postFilter
  		if ( postFilter ) {
  			temp = condense( matcherOut, postMap );
  			postFilter( temp, [], context, xml );
  
  			// Un-match failing elements by moving them back to matcherIn
  			i = temp.length;
  			while ( i-- ) {
  				if ( (elem = temp[i]) ) {
  					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
  				}
  			}
  		}
  
  		if ( seed ) {
  			if ( postFinder || preFilter ) {
  				if ( postFinder ) {
  					// Get the final matcherOut by condensing this intermediate into postFinder contexts
  					temp = [];
  					i = matcherOut.length;
  					while ( i-- ) {
  						if ( (elem = matcherOut[i]) ) {
  							// Restore matcherIn since elem is not yet a final match
  							temp.push( (matcherIn[i] = elem) );
  						}
  					}
  					postFinder( null, (matcherOut = []), temp, xml );
  				}
  
  				// Move matched elements from seed to results to keep them synchronized
  				i = matcherOut.length;
  				while ( i-- ) {
  					if ( (elem = matcherOut[i]) &&
  						(temp = postFinder ? indexOf.call( seed, elem ) : preMap[i]) > -1 ) {
  
  						seed[temp] = !(results[temp] = elem);
  					}
  				}
  			}
  
  		// Add elements to results, through postFinder if defined
  		} else {
  			matcherOut = condense(
  				matcherOut === results ?
  					matcherOut.splice( preexisting, matcherOut.length ) :
  					matcherOut
  			);
  			if ( postFinder ) {
  				postFinder( null, results, matcherOut, xml );
  			} else {
  				push.apply( results, matcherOut );
  			}
  		}
  	});
  }
  
  function matcherFromTokens( tokens ) {
  	var checkContext, matcher, j,
  		len = tokens.length,
  		leadingRelative = Expr.relative[ tokens[0].type ],
  		implicitRelative = leadingRelative || Expr.relative[" "],
  		i = leadingRelative ? 1 : 0,
  
  		// The foundational matcher ensures that elements are reachable from top-level context(s)
  		matchContext = addCombinator( function( elem ) {
  			return elem === checkContext;
  		}, implicitRelative, true ),
  		matchAnyContext = addCombinator( function( elem ) {
  			return indexOf.call( checkContext, elem ) > -1;
  		}, implicitRelative, true ),
  		matchers = [ function( elem, context, xml ) {
  			return ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
  				(checkContext = context).nodeType ?
  					matchContext( elem, context, xml ) :
  					matchAnyContext( elem, context, xml ) );
  		} ];
  
  	for ( ; i < len; i++ ) {
  		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
  			matchers = [ addCombinator( elementMatcher( matchers ), matcher ) ];
  		} else {
  			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );
  
  			// Return special upon seeing a positional matcher
  			if ( matcher[ expando ] ) {
  				// Find the next relative operator (if any) for proper handling
  				j = ++i;
  				for ( ; j < len; j++ ) {
  					if ( Expr.relative[ tokens[j].type ] ) {
  						break;
  					}
  				}
  				return setMatcher(
  					i > 1 && elementMatcher( matchers ),
  					i > 1 && tokens.slice( 0, i - 1 ).join("").replace( rtrim, "$1" ),
  					matcher,
  					i < j && matcherFromTokens( tokens.slice( i, j ) ),
  					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
  					j < len && tokens.join("")
  				);
  			}
  			matchers.push( matcher );
  		}
  	}
  
  	return elementMatcher( matchers );
  }
  
  function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
  	var bySet = setMatchers.length > 0,
  		byElement = elementMatchers.length > 0,
  		superMatcher = function( seed, context, xml, results, expandContext ) {
  			var elem, j, matcher,
  				setMatched = [],
  				matchedCount = 0,
  				i = "0",
  				unmatched = seed && [],
  				outermost = expandContext != null,
  				contextBackup = outermostContext,
  				// We must always have either seed elements or context
  				elems = seed || byElement && Expr.find["TAG"]( "*", expandContext && context.parentNode || context ),
  				// Nested matchers should use non-integer dirruns
  				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.E);
  
  			if ( outermost ) {
  				outermostContext = context !== document && context;
  				cachedruns = superMatcher.el;
  			}
  
  			// Add elements passing elementMatchers directly to results
  			for ( ; (elem = elems[i]) != null; i++ ) {
  				if ( byElement && elem ) {
  					for ( j = 0; (matcher = elementMatchers[j]); j++ ) {
  						if ( matcher( elem, context, xml ) ) {
  							results.push( elem );
  							break;
  						}
  					}
  					if ( outermost ) {
  						dirruns = dirrunsUnique;
  						cachedruns = ++superMatcher.el;
  					}
  				}
  
  				// Track unmatched elements for set filters
  				if ( bySet ) {
  					// They will have gone through all possible matchers
  					if ( (elem = !matcher && elem) ) {
  						matchedCount--;
  					}
  
  					// Lengthen the array for every element, matched or not
  					if ( seed ) {
  						unmatched.push( elem );
  					}
  				}
  			}
  
  			// Apply set filters to unmatched elements
  			matchedCount += i;
  			if ( bySet && i !== matchedCount ) {
  				for ( j = 0; (matcher = setMatchers[j]); j++ ) {
  					matcher( unmatched, setMatched, context, xml );
  				}
  
  				if ( seed ) {
  					// Reintegrate element matches to eliminate the need for sorting
  					if ( matchedCount > 0 ) {
  						while ( i-- ) {
  							if ( !(unmatched[i] || setMatched[i]) ) {
  								setMatched[i] = pop.call( results );
  							}
  						}
  					}
  
  					// Discard index placeholder values to get only actual matches
  					setMatched = condense( setMatched );
  				}
  
  				// Add matches to results
  				push.apply( results, setMatched );
  
  				// Seedless set matches succeeding multiple successful matchers stipulate sorting
  				if ( outermost && !seed && setMatched.length > 0 &&
  					( matchedCount + setMatchers.length ) > 1 ) {
  
  					Sizzle.uniqueSort( results );
  				}
  			}
  
  			// Override manipulation of globals by nested matchers
  			if ( outermost ) {
  				dirruns = dirrunsUnique;
  				outermostContext = contextBackup;
  			}
  
  			return unmatched;
  		};
  
  	superMatcher.el = 0;
  	return bySet ?
  		markFunction( superMatcher ) :
  		superMatcher;
  }
  
  compile = Sizzle.compile = function( selector, group /* Internal Use Only */ ) {
  	var i,
  		setMatchers = [],
  		elementMatchers = [],
  		cached = compilerCache[ expando ][ selector + " " ];
  
  	if ( !cached ) {
  		// Generate a function of recursive functions that can be used to check each element
  		if ( !group ) {
  			group = tokenize( selector );
  		}
  		i = group.length;
  		while ( i-- ) {
  			cached = matcherFromTokens( group[i] );
  			if ( cached[ expando ] ) {
  				setMatchers.push( cached );
  			} else {
  				elementMatchers.push( cached );
  			}
  		}
  
  		// Cache the compiled function
  		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );
  	}
  	return cached;
  };
  
  function multipleContexts( selector, contexts, results ) {
  	var i = 0,
  		len = contexts.length;
  	for ( ; i < len; i++ ) {
  		Sizzle( selector, contexts[i], results );
  	}
  	return results;
  }
  
  function select( selector, context, results, seed, xml ) {
  	var i, tokens, token, type, find,
  		match = tokenize( selector ),
  		j = match.length;
  
  	if ( !seed ) {
  		// Try to minimize operations if there is only one group
  		if ( match.length === 1 ) {
  
  			// Take a shortcut and set the context if the root selector is an ID
  			tokens = match[0] = match[0].slice( 0 );
  			if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
  					context.nodeType === 9 && !xml &&
  					Expr.relative[ tokens[1].type ] ) {
  
  				context = Expr.find["ID"]( token.matches[0].replace( rbackslash, "" ), context, xml )[0];
  				if ( !context ) {
  					return results;
  				}
  
  				selector = selector.slice( tokens.shift().length );
  			}
  
  			// Fetch a seed set for right-to-left matching
  			for ( i = matchExpr["POS"].test( selector ) ? -1 : tokens.length - 1; i >= 0; i-- ) {
  				token = tokens[i];
  
  				// Abort if we hit a combinator
  				if ( Expr.relative[ (type = token.type) ] ) {
  					break;
  				}
  				if ( (find = Expr.find[ type ]) ) {
  					// Search, expanding context for leading sibling combinators
  					if ( (seed = find(
  						token.matches[0].replace( rbackslash, "" ),
  						rsibling.test( tokens[0].type ) && context.parentNode || context,
  						xml
  					)) ) {
  
  						// If seed is empty or no tokens remain, we can return early
  						tokens.splice( i, 1 );
  						selector = seed.length && tokens.join("");
  						if ( !selector ) {
  							push.apply( results, slice.call( seed, 0 ) );
  							return results;
  						}
  
  						break;
  					}
  				}
  			}
  		}
  	}
  
  	// Compile and execute a filtering function
  	// Provide `match` to avoid retokenization if we modified the selector above
  	compile( selector, match )(
  		seed,
  		context,
  		xml,
  		results,
  		rsibling.test( selector )
  	);
  	return results;
  }
  
  if ( document.querySelectorAll ) {
  	(function() {
  		var disconnectedMatch,
  			oldSelect = select,
  			rescape = /'|\\/g,
  			rattributeQuotes = /\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,
  
  			// qSa(:focus) reports false when true (Chrome 21), no need to also add to buggyMatches since matches checks buggyQSA
  			// A support test would require too much code (would include document ready)
  			rbuggyQSA = [ ":focus" ],
  
  			// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
  			// A support test would require too much code (would include document ready)
  			// just skip matchesSelector for :active
  			rbuggyMatches = [ ":active" ],
  			matches = docElem.matchesSelector ||
  				docElem.mozMatchesSelector ||
  				docElem.webkitMatchesSelector ||
  				docElem.oMatchesSelector ||
  				docElem.msMatchesSelector;
  
  		// Build QSA regex
  		// Regex strategy adopted from Diego Perini
  		assert(function( div ) {
  			// Select is set to empty string on purpose
  			// This is to test IE's treatment of not explictly
  			// setting a boolean content attribute,
  			// since its presence should be enough
  			// http://bugs.jquery.com/ticket/12359
  			div.innerHTML = "<select><option selected=''></option></select>";
  
  			// IE8 - Some boolean attributes are not treated correctly
  			if ( !div.querySelectorAll("[selected]").length ) {
  				rbuggyQSA.push( "\\[" + whitespace + "*(?:checked|disabled|ismap|multiple|readonly|selected|value)" );
  			}
  
  			// Webkit/Opera - :checked should return selected option elements
  			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
  			// IE8 throws error here (do not put tests after this one)
  			if ( !div.querySelectorAll(":checked").length ) {
  				rbuggyQSA.push(":checked");
  			}
  		});
  
  		assert(function( div ) {
  
  			// Opera 10-12/IE9 - ^= $= *= and empty values
  			// Should not select anything
  			div.innerHTML = "<p test=''></p>";
  			if ( div.querySelectorAll("[test^='']").length ) {
  				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:\"\"|'')" );
  			}
  
  			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
  			// IE8 throws error here (do not put tests after this one)
  			div.innerHTML = "<input type='hidden'/>";
  			if ( !div.querySelectorAll(":enabled").length ) {
  				rbuggyQSA.push(":enabled", ":disabled");
  			}
  		});
  
  		// rbuggyQSA always contains :focus, so no need for a length check
  		rbuggyQSA = /* rbuggyQSA.length && */ new RegExp( rbuggyQSA.join("|") );
  
  		select = function( selector, context, results, seed, xml ) {
  			// Only use querySelectorAll when not filtering,
  			// when this is not xml,
  			// and when no QSA bugs apply
  			if ( !seed && !xml && !rbuggyQSA.test( selector ) ) {
  				var groups, i,
  					old = true,
  					nid = expando,
  					newContext = context,
  					newSelector = context.nodeType === 9 && selector;
  
  				// qSA works strangely on Element-rooted queries
  				// We can work around this by specifying an extra ID on the root
  				// and working up from there (Thanks to Andrew Dupont for the technique)
  				// IE 8 doesn't work on object elements
  				if ( context.nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
  					groups = tokenize( selector );
  
  					if ( (old = context.getAttribute("id")) ) {
  						nid = old.replace( rescape, "\\//JQUERY_SOURCE" );
  					} else {
  						context.setAttribute( "id", nid );
  					}
  					nid = "[id='" + nid + "'] ";
  
  					i = groups.length;
  					while ( i-- ) {
  						groups[i] = nid + groups[i].join("");
  					}
  					newContext = rsibling.test( selector ) && context.parentNode || context;
  					newSelector = groups.join(",");
  				}
  
  				if ( newSelector ) {
  					try {
  						push.apply( results, slice.call( newContext.querySelectorAll(
  							newSelector
  						), 0 ) );
  						return results;
  					} catch(qsaError) {
  					} finally {
  						if ( !old ) {
  							context.removeAttribute("id");
  						}
  					}
  				}
  			}
  
  			return oldSelect( selector, context, results, seed, xml );
  		};
  
  		if ( matches ) {
  			assert(function( div ) {
  				// Check to see if it's possible to do matchesSelector
  				// on a disconnected node (IE 9)
  				disconnectedMatch = matches.call( div, "div" );
  
  				// This should fail with an exception
  				// Gecko does not error, returns false instead
  				try {
  					matches.call( div, "[test!='']:sizzle" );
  					rbuggyMatches.push( "!=", pseudos );
  				} catch ( e ) {}
  			});
  
  			// rbuggyMatches always contains :active and :focus, so no need for a length check
  			rbuggyMatches = /* rbuggyMatches.length && */ new RegExp( rbuggyMatches.join("|") );
  
  			Sizzle.matchesSelector = function( elem, expr ) {
  				// Make sure that attribute selectors are quoted
  				expr = expr.replace( rattributeQuotes, "='$1']" );
  
  				// rbuggyMatches always contains :active, so no need for an existence check
  				if ( !isXML( elem ) && !rbuggyMatches.test( expr ) && !rbuggyQSA.test( expr ) ) {
  					try {
  						var ret = matches.call( elem, expr );
  
  						// IE 9's matchesSelector returns false on disconnected nodes
  						if ( ret || disconnectedMatch ||
  								// As well, disconnected nodes are said to be in a document
  								// fragment in IE 9
  								elem.document && elem.document.nodeType !== 11 ) {
  							return ret;
  						}
  					} catch(e) {}
  				}
  
  				return Sizzle( expr, null, null, [ elem ] ).length > 0;
  			};
  		}
  	})();
  }
  
  // Deprecated
  Expr.pseudos["nth"] = Expr.pseudos["eq"];
  
  // Back-compat
  function setFilters() {}
  Expr.filters = setFilters.prototype = Expr.pseudos;
  Expr.setFilters = new setFilters();
  
  // Override sizzle attribute retrieval
  Sizzle.attr = jQuery.attr;
  jQuery.find = Sizzle;
  jQuery.expr = Sizzle.selectors;
  jQuery.expr[":"] = jQuery.expr.pseudos;
  jQuery.unique = Sizzle.uniqueSort;
  jQuery.text = Sizzle.getText;
  jQuery.isXMLDoc = Sizzle.isXML;
  jQuery.contains = Sizzle.contains;
  
  
  })( window );
  var runtil = /Until$/,
  	rparentsprev = /^(?:parents|prev(?:Until|All))/,
  	isSimple = /^.[^:#\[\.,]*$/,
  	rneedsContext = jQuery.expr.match.needsContext,
  	// methods guaranteed to produce a unique set when starting from a unique set
  	guaranteedUnique = {
  		children: true,
  		contents: true,
  		next: true,
  		prev: true
  	};
  
  jQuery.fn.extend({
  	find: function( selector ) {
  		var i, l, length, n, r, ret,
  			self = this;
  
  		if ( typeof selector !== "string" ) {
  			return jQuery( selector ).filter(function() {
  				for ( i = 0, l = self.length; i < l; i++ ) {
  					if ( jQuery.contains( self[ i ], this ) ) {
  						return true;
  					}
  				}
  			});
  		}
  
  		ret = this.pushStack( "", "find", selector );
  
  		for ( i = 0, l = this.length; i < l; i++ ) {
  			length = ret.length;
  			jQuery.find( selector, this[i], ret );
  
  			if ( i > 0 ) {
  				// Make sure that the results are unique
  				for ( n = length; n < ret.length; n++ ) {
  					for ( r = 0; r < length; r++ ) {
  						if ( ret[r] === ret[n] ) {
  							ret.splice(n--, 1);
  							break;
  						}
  					}
  				}
  			}
  		}
  
  		return ret;
  	},
  
  	has: function( target ) {
  		var i,
  			targets = jQuery( target, this ),
  			len = targets.length;
  
  		return this.filter(function() {
  			for ( i = 0; i < len; i++ ) {
  				if ( jQuery.contains( this, targets[i] ) ) {
  					return true;
  				}
  			}
  		});
  	},
  
  	not: function( selector ) {
  		return this.pushStack( winnow(this, selector, false), "not", selector);
  	},
  
  	filter: function( selector ) {
  		return this.pushStack( winnow(this, selector, true), "filter", selector );
  	},
  
  	is: function( selector ) {
  		return !!selector && (
  			typeof selector === "string" ?
  				// If this is a positional/relative selector, check membership in the returned set
  				// so $("p:first").is("p:last") won't return true for a doc with two "p".
  				rneedsContext.test( selector ) ?
  					jQuery( selector, this.context ).index( this[0] ) >= 0 :
  					jQuery.filter( selector, this ).length > 0 :
  				this.filter( selector ).length > 0 );
  	},
  
  	closest: function( selectors, context ) {
  		var cur,
  			i = 0,
  			l = this.length,
  			ret = [],
  			pos = rneedsContext.test( selectors ) || typeof selectors !== "string" ?
  				jQuery( selectors, context || this.context ) :
  				0;
  
  		for ( ; i < l; i++ ) {
  			cur = this[i];
  
  			while ( cur && cur.ownerDocument && cur !== context && cur.nodeType !== 11 ) {
  				if ( pos ? pos.index(cur) > -1 : jQuery.find.matchesSelector(cur, selectors) ) {
  					ret.push( cur );
  					break;
  				}
  				cur = cur.parentNode;
  			}
  		}
  
  		ret = ret.length > 1 ? jQuery.unique( ret ) : ret;
  
  		return this.pushStack( ret, "closest", selectors );
  	},
  
  	// Determine the position of an element within
  	// the matched set of elements
  	index: function( elem ) {
  
  		// No argument, return index in parent
  		if ( !elem ) {
  			return ( this[0] && this[0].parentNode ) ? this.prevAll().length : -1;
  		}
  
  		// index in selector
  		if ( typeof elem === "string" ) {
  			return jQuery.inArray( this[0], jQuery( elem ) );
  		}
  
  		// Locate the position of the desired element
  		return jQuery.inArray(
  			// If it receives a jQuery object, the first element is used
  			elem.jquery ? elem[0] : elem, this );
  	},
  
  	add: function( selector, context ) {
  		var set = typeof selector === "string" ?
  				jQuery( selector, context ) :
  				jQuery.makeArray( selector && selector.nodeType ? [ selector ] : selector ),
  			all = jQuery.merge( this.get(), set );
  
  		return this.pushStack( isDisconnected( set[0] ) || isDisconnected( all[0] ) ?
  			all :
  			jQuery.unique( all ) );
  	},
  
  	addBack: function( selector ) {
  		return this.add( selector == null ?
  			this.prevObject : this.prevObject.filter(selector)
  		);
  	}
  });
  
  jQuery.fn.andSelf = jQuery.fn.addBack;
  
  // A painfully simple check to see if an element is disconnected
  // from a document (should be improved, where feasible).
  function isDisconnected( node ) {
  	return !node || !node.parentNode || node.parentNode.nodeType === 11;
  }
  
  function sibling( cur, dir ) {
  	do {
  		cur = cur[ dir ];
  	} while ( cur && cur.nodeType !== 1 );
  
  	return cur;
  }
  
  jQuery.each({
  	parent: function( elem ) {
  		var parent = elem.parentNode;
  		return parent && parent.nodeType !== 11 ? parent : null;
  	},
  	parents: function( elem ) {
  		return jQuery.dir( elem, "parentNode" );
  	},
  	parentsUntil: function( elem, i, until ) {
  		return jQuery.dir( elem, "parentNode", until );
  	},
  	next: function( elem ) {
  		return sibling( elem, "nextSibling" );
  	},
  	prev: function( elem ) {
  		return sibling( elem, "previousSibling" );
  	},
  	nextAll: function( elem ) {
  		return jQuery.dir( elem, "nextSibling" );
  	},
  	prevAll: function( elem ) {
  		return jQuery.dir( elem, "previousSibling" );
  	},
  	nextUntil: function( elem, i, until ) {
  		return jQuery.dir( elem, "nextSibling", until );
  	},
  	prevUntil: function( elem, i, until ) {
  		return jQuery.dir( elem, "previousSibling", until );
  	},
  	siblings: function( elem ) {
  		return jQuery.sibling( ( elem.parentNode || {} ).firstChild, elem );
  	},
  	children: function( elem ) {
  		return jQuery.sibling( elem.firstChild );
  	},
  	contents: function( elem ) {
  		return jQuery.nodeName( elem, "iframe" ) ?
  			elem.contentDocument || elem.contentWindow.document :
  			jQuery.merge( [], elem.childNodes );
  	}
  }, function( name, fn ) {
  	jQuery.fn[ name ] = function( until, selector ) {
  		var ret = jQuery.map( this, fn, until );
  
  		if ( !runtil.test( name ) ) {
  			selector = until;
  		}
  
  		if ( selector && typeof selector === "string" ) {
  			ret = jQuery.filter( selector, ret );
  		}
  
  		ret = this.length > 1 && !guaranteedUnique[ name ] ? jQuery.unique( ret ) : ret;
  
  		if ( this.length > 1 && rparentsprev.test( name ) ) {
  			ret = ret.reverse();
  		}
  
  		return this.pushStack( ret, name, core_slice.call( arguments ).join(",") );
  	};
  });
  
  jQuery.extend({
  	filter: function( expr, elems, not ) {
  		if ( not ) {
  			expr = ":not(" + expr + ")";
  		}
  
  		return elems.length === 1 ?
  			jQuery.find.matchesSelector(elems[0], expr) ? [ elems[0] ] : [] :
  			jQuery.find.matches(expr, elems);
  	},
  
  	dir: function( elem, dir, until ) {
  		var matched = [],
  			cur = elem[ dir ];
  
  		while ( cur && cur.nodeType !== 9 && (until === undefined || cur.nodeType !== 1 || !jQuery( cur ).is( until )) ) {
  			if ( cur.nodeType === 1 ) {
  				matched.push( cur );
  			}
  			cur = cur[dir];
  		}
  		return matched;
  	},
  
  	sibling: function( n, elem ) {
  		var r = [];
  
  		for ( ; n; n = n.nextSibling ) {
  			if ( n.nodeType === 1 && n !== elem ) {
  				r.push( n );
  			}
  		}
  
  		return r;
  	}
  });
  
  // Implement the identical functionality for filter and not
  function winnow( elements, qualifier, keep ) {
  
  	// Can't pass null or undefined to indexOf in Firefox 4
  	// Set to 0 to skip string check
  	qualifier = qualifier || 0;
  
  	if ( jQuery.isFunction( qualifier ) ) {
  		return jQuery.grep(elements, function( elem, i ) {
  			var retVal = !!qualifier.call( elem, i, elem );
  			return retVal === keep;
  		});
  
  	} else if ( qualifier.nodeType ) {
  		return jQuery.grep(elements, function( elem, i ) {
  			return ( elem === qualifier ) === keep;
  		});
  
  	} else if ( typeof qualifier === "string" ) {
  		var filtered = jQuery.grep(elements, function( elem ) {
  			return elem.nodeType === 1;
  		});
  
  		if ( isSimple.test( qualifier ) ) {
  			return jQuery.filter(qualifier, filtered, !keep);
  		} else {
  			qualifier = jQuery.filter( qualifier, filtered );
  		}
  	}
  
  	return jQuery.grep(elements, function( elem, i ) {
  		return ( jQuery.inArray( elem, qualifier ) >= 0 ) === keep;
  	});
  }
  function createSafeFragment( document ) {
  	var list = nodeNames.split( "|" ),
  	safeFrag = document.createDocumentFragment();
  
  	if ( safeFrag.createElement ) {
  		while ( list.length ) {
  			safeFrag.createElement(
  				list.pop()
  			);
  		}
  	}
  	return safeFrag;
  }
  
  var nodeNames = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|" +
  		"header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",
  	rinlinejQuery = / jQuery\d+="(?:null|\d+)"/g,
  	rleadingWhitespace = /^\s+/,
  	rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
  	rtagName = /<([\w:]+)/,
  	rtbody = /<tbody/i,
  	rhtml = /<|&#?\w+;/,
  	rnoInnerhtml = /<(?:script|style|link)/i,
  	rnocache = /<(?:script|object|embed|option|style)/i,
  	rnoshimcache = new RegExp("<(?:" + nodeNames + ")[\\s/>]", "i"),
  	rcheckableType = /^(?:checkbox|radio)$/,
  	// checked="checked" or checked
  	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
  	rscriptType = /\/(java|ecma)script/i,
  	rcleanScript = /^\s*<!(?:\[CDATA\[|\-\-)|[\]\-]{2}>\s*$/g,
  	wrapMap = {
  		option: [ 1, "<select multiple='multiple'>", "</select>" ],
  		legend: [ 1, "<fieldset>", "</fieldset>" ],
  		thead: [ 1, "<table>", "</table>" ],
  		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
  		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
  		col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
  		area: [ 1, "<map>", "</map>" ],
  		_default: [ 0, "", "" ]
  	},
  	safeFragment = createSafeFragment( document ),
  	fragmentDiv = safeFragment.appendChild( document.createElement("div") );
  
  wrapMap.optgroup = wrapMap.option;
  wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
  wrapMap.th = wrapMap.td;
  
  // IE6-8 can't serialize link, script, style, or any html5 (NoScope) tags,
  // unless wrapped in a div with non-breaking characters in front of it.
  if ( !jQuery.support.htmlSerialize ) {
  	wrapMap._default = [ 1, "X<div>", "</div>" ];
  }
  
  jQuery.fn.extend({
  	text: function( value ) {
  		return jQuery.access( this, function( value ) {
  			return value === undefined ?
  				jQuery.text( this ) :
  				this.empty().append( ( this[0] && this[0].ownerDocument || document ).createTextNode( value ) );
  		}, null, value, arguments.length );
  	},
  
  	wrapAll: function( html ) {
  		if ( jQuery.isFunction( html ) ) {
  			return this.each(function(i) {
  				jQuery(this).wrapAll( html.call(this, i) );
  			});
  		}
  
  		if ( this[0] ) {
  			// The elements to wrap the target around
  			var wrap = jQuery( html, this[0].ownerDocument ).eq(0).clone(true);
  
  			if ( this[0].parentNode ) {
  				wrap.insertBefore( this[0] );
  			}
  
  			wrap.map(function() {
  				var elem = this;
  
  				while ( elem.firstChild && elem.firstChild.nodeType === 1 ) {
  					elem = elem.firstChild;
  				}
  
  				return elem;
  			}).append( this );
  		}
  
  		return this;
  	},
  
  	wrapInner: function( html ) {
  		if ( jQuery.isFunction( html ) ) {
  			return this.each(function(i) {
  				jQuery(this).wrapInner( html.call(this, i) );
  			});
  		}
  
  		return this.each(function() {
  			var self = jQuery( this ),
  				contents = self.contents();
  
  			if ( contents.length ) {
  				contents.wrapAll( html );
  
  			} else {
  				self.append( html );
  			}
  		});
  	},
  
  	wrap: function( html ) {
  		var isFunction = jQuery.isFunction( html );
  
  		return this.each(function(i) {
  			jQuery( this ).wrapAll( isFunction ? html.call(this, i) : html );
  		});
  	},
  
  	unwrap: function() {
  		return this.parent().each(function() {
  			if ( !jQuery.nodeName( this, "body" ) ) {
  				jQuery( this ).replaceWith( this.childNodes );
  			}
  		}).end();
  	},
  
  	append: function() {
  		return this.domManip(arguments, true, function( elem ) {
  			if ( this.nodeType === 1 || this.nodeType === 11 ) {
  				this.appendChild( elem );
  			}
  		});
  	},
  
  	prepend: function() {
  		return this.domManip(arguments, true, function( elem ) {
  			if ( this.nodeType === 1 || this.nodeType === 11 ) {
  				this.insertBefore( elem, this.firstChild );
  			}
  		});
  	},
  
  	before: function() {
  		if ( !isDisconnected( this[0] ) ) {
  			return this.domManip(arguments, false, function( elem ) {
  				this.parentNode.insertBefore( elem, this );
  			});
  		}
  
  		if ( arguments.length ) {
  			var set = jQuery.clean( arguments );
  			return this.pushStack( jQuery.merge( set, this ), "before", this.selector );
  		}
  	},
  
  	after: function() {
  		if ( !isDisconnected( this[0] ) ) {
  			return this.domManip(arguments, false, function( elem ) {
  				this.parentNode.insertBefore( elem, this.nextSibling );
  			});
  		}
  
  		if ( arguments.length ) {
  			var set = jQuery.clean( arguments );
  			return this.pushStack( jQuery.merge( this, set ), "after", this.selector );
  		}
  	},
  
  	// keepData is for internal use only--do not document
  	remove: function( selector, keepData ) {
  		var elem,
  			i = 0;
  
  		for ( ; (elem = this[i]) != null; i++ ) {
  			if ( !selector || jQuery.filter( selector, [ elem ] ).length ) {
  				if ( !keepData && elem.nodeType === 1 ) {
  					jQuery.cleanData( elem.getElementsByTagName("*") );
  					jQuery.cleanData( [ elem ] );
  				}
  
  				if ( elem.parentNode ) {
  					elem.parentNode.removeChild( elem );
  				}
  			}
  		}
  
  		return this;
  	},
  
  	empty: function() {
  		var elem,
  			i = 0;
  
  		for ( ; (elem = this[i]) != null; i++ ) {
  			// Remove element nodes and prevent memory leaks
  			if ( elem.nodeType === 1 ) {
  				jQuery.cleanData( elem.getElementsByTagName("*") );
  			}
  
  			// Remove any remaining nodes
  			while ( elem.firstChild ) {
  				elem.removeChild( elem.firstChild );
  			}
  		}
  
  		return this;
  	},
  
  	clone: function( dataAndEvents, deepDataAndEvents ) {
  		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
  		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
  
  		return this.map( function () {
  			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
  		});
  	},
  
  	html: function( value ) {
  		return jQuery.access( this, function( value ) {
  			var elem = this[0] || {},
  				i = 0,
  				l = this.length;
  
  			if ( value === undefined ) {
  				return elem.nodeType === 1 ?
  					elem.innerHTML.replace( rinlinejQuery, "" ) :
  					undefined;
  			}
  
  			// See if we can take a shortcut and just use innerHTML
  			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
  				( jQuery.support.htmlSerialize || !rnoshimcache.test( value )  ) &&
  				( jQuery.support.leadingWhitespace || !rleadingWhitespace.test( value ) ) &&
  				!wrapMap[ ( rtagName.exec( value ) || ["", ""] )[1].toLowerCase() ] ) {
  
  				value = value.replace( rxhtmlTag, "<$1></$2>" );
  
  				try {
  					for (; i < l; i++ ) {
  						// Remove element nodes and prevent memory leaks
  						elem = this[i] || {};
  						if ( elem.nodeType === 1 ) {
  							jQuery.cleanData( elem.getElementsByTagName( "*" ) );
  							elem.innerHTML = value;
  						}
  					}
  
  					elem = 0;
  
  				// If using innerHTML throws an exception, use the fallback method
  				} catch(e) {}
  			}
  
  			if ( elem ) {
  				this.empty().append( value );
  			}
  		}, null, value, arguments.length );
  	},
  
  	replaceWith: function( value ) {
  		if ( !isDisconnected( this[0] ) ) {
  			// Make sure that the elements are removed from the DOM before they are inserted
  			// this can help fix replacing a parent with child elements
  			if ( jQuery.isFunction( value ) ) {
  				return this.each(function(i) {
  					var self = jQuery(this), old = self.html();
  					self.replaceWith( value.call( this, i, old ) );
  				});
  			}
  
  			if ( typeof value !== "string" ) {
  				value = jQuery( value ).detach();
  			}
  
  			return this.each(function() {
  				var next = this.nextSibling,
  					parent = this.parentNode;
  
  				jQuery( this ).remove();
  
  				if ( next ) {
  					jQuery(next).before( value );
  				} else {
  					jQuery(parent).append( value );
  				}
  			});
  		}
  
  		return this.length ?
  			this.pushStack( jQuery(jQuery.isFunction(value) ? value() : value), "replaceWith", value ) :
  			this;
  	},
  
  	detach: function( selector ) {
  		return this.remove( selector, true );
  	},
  
  	domManip: function( args, table, callback ) {
  
  		// Flatten any nested arrays
  		args = [].concat.apply( [], args );
  
  		var results, first, fragment, iNoClone,
  			i = 0,
  			value = args[0],
  			scripts = [],
  			l = this.length;
  
  		// We can't cloneNode fragments that contain checked, in WebKit
  		if ( !jQuery.support.checkClone && l > 1 && typeof value === "string" && rchecked.test( value ) ) {
  			return this.each(function() {
  				jQuery(this).domManip( args, table, callback );
  			});
  		}
  
  		if ( jQuery.isFunction(value) ) {
  			return this.each(function(i) {
  				var self = jQuery(this);
  				args[0] = value.call( this, i, table ? self.html() : undefined );
  				self.domManip( args, table, callback );
  			});
  		}
  
  		if ( this[0] ) {
  			results = jQuery.buildFragment( args, this, scripts );
  			fragment = results.fragment;
  			first = fragment.firstChild;
  
  			if ( fragment.childNodes.length === 1 ) {
  				fragment = first;
  			}
  
  			if ( first ) {
  				table = table && jQuery.nodeName( first, "tr" );
  
  				// Use the original fragment for the last item instead of the first because it can end up
  				// being emptied incorrectly in certain situations (#8070).
  				// Fragments from the fragment cache must always be cloned and never used in place.
  				for ( iNoClone = results.cacheable || l - 1; i < l; i++ ) {
  					callback.call(
  						table && jQuery.nodeName( this[i], "table" ) ?
  							findOrAppend( this[i], "tbody" ) :
  							this[i],
  						i === iNoClone ?
  							fragment :
  							jQuery.clone( fragment, true, true )
  					);
  				}
  			}
  
  			// Fix #11809: Avoid leaking memory
  			fragment = first = null;
  
  			if ( scripts.length ) {
  				jQuery.each( scripts, function( i, elem ) {
  					if ( elem.src ) {
  						if ( jQuery.ajax ) {
  							jQuery.ajax({
  								url: elem.src,
  								type: "GET",
  								dataType: "script",
  								async: false,
  								global: false,
  								"throws": true
  							});
  						} else {
  							jQuery.error("no ajax");
  						}
  					} else {
  						jQuery.globalEval( ( elem.text || elem.textContent || elem.innerHTML || "" ).replace( rcleanScript, "" ) );
  					}
  
  					if ( elem.parentNode ) {
  						elem.parentNode.removeChild( elem );
  					}
  				});
  			}
  		}
  
  		return this;
  	}
  });
  
  function findOrAppend( elem, tag ) {
  	return elem.getElementsByTagName( tag )[0] || elem.appendChild( elem.ownerDocument.createElement( tag ) );
  }
  
  function cloneCopyEvent( src, dest ) {
  
  	if ( dest.nodeType !== 1 || !jQuery.hasData( src ) ) {
  		return;
  	}
  
  	var type, i, l,
  		oldData = jQuery._data( src ),
  		curData = jQuery._data( dest, oldData ),
  		events = oldData.events;
  
  	if ( events ) {
  		delete curData.handle;
  		curData.events = {};
  
  		for ( type in events ) {
  			for ( i = 0, l = events[ type ].length; i < l; i++ ) {
  				jQuery.event.add( dest, type, events[ type ][ i ] );
  			}
  		}
  	}
  
  	// make the cloned public data object a copy from the original
  	if ( curData.data ) {
  		curData.data = jQuery.extend( {}, curData.data );
  	}
  }
  
  function cloneFixAttributes( src, dest ) {
  	var nodeName;
  
  	// We do not need to do anything for non-Elements
  	if ( dest.nodeType !== 1 ) {
  		return;
  	}
  
  	// clearAttributes removes the attributes, which we don't want,
  	// but also removes the attachEvent events, which we *do* want
  	if ( dest.clearAttributes ) {
  		dest.clearAttributes();
  	}
  
  	// mergeAttributes, in contrast, only merges back on the
  	// original attributes, not the events
  	if ( dest.mergeAttributes ) {
  		dest.mergeAttributes( src );
  	}
  
  	nodeName = dest.nodeName.toLowerCase();
  
  	if ( nodeName === "object" ) {
  		// IE6-10 improperly clones children of object elements using classid.
  		// IE10 throws NoModificationAllowedError if parent is null, #12132.
  		if ( dest.parentNode ) {
  			dest.outerHTML = src.outerHTML;
  		}
  
  		// This path appears unavoidable for IE9. When cloning an object
  		// element in IE9, the outerHTML strategy above is not sufficient.
  		// If the src has innerHTML and the destination does not,
  		// copy the src.innerHTML into the dest.innerHTML. #10324
  		if ( jQuery.support.html5Clone && (src.innerHTML && !jQuery.trim(dest.innerHTML)) ) {
  			dest.innerHTML = src.innerHTML;
  		}
  
  	} else if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
  		// IE6-8 fails to persist the checked state of a cloned checkbox
  		// or radio button. Worse, IE6-7 fail to give the cloned element
  		// a checked appearance if the defaultChecked value isn't also set
  
  		dest.defaultChecked = dest.checked = src.checked;
  
  		// IE6-7 get confused and end up setting the value of a cloned
  		// checkbox/radio button to an empty string instead of "on"
  		if ( dest.value !== src.value ) {
  			dest.value = src.value;
  		}
  
  	// IE6-8 fails to return the selected option to the default selected
  	// state when cloning options
  	} else if ( nodeName === "option" ) {
  		dest.selected = src.defaultSelected;
  
  	// IE6-8 fails to set the defaultValue to the correct value when
  	// cloning other types of input fields
  	} else if ( nodeName === "input" || nodeName === "textarea" ) {
  		dest.defaultValue = src.defaultValue;
  
  	// IE blanks contents when cloning scripts
  	} else if ( nodeName === "script" && dest.text !== src.text ) {
  		dest.text = src.text;
  	}
  
  	// Event data gets referenced instead of copied if the expando
  	// gets copied too
  	dest.removeAttribute( jQuery.expando );
  }
  
  jQuery.buildFragment = function( args, context, scripts ) {
  	var fragment, cacheable, cachehit,
  		first = args[ 0 ];
  
  	// Set context from what may come in as undefined or a jQuery collection or a node
  	// Updated to fix #12266 where accessing context[0] could throw an exception in IE9/10 &
  	// also doubles as fix for #8950 where plain objects caused createDocumentFragment exception
  	context = context || document;
  	context = !context.nodeType && context[0] || context;
  	context = context.ownerDocument || context;
  
  	// Only cache "small" (1/2 KB) HTML strings that are associated with the main document
  	// Cloning options loses the selected state, so don't cache them
  	// IE 6 doesn't like it when you put <object> or <embed> elements in a fragment
  	// Also, WebKit does not clone 'checked' attributes on cloneNode, so don't cache
  	// Lastly, IE6,7,8 will not correctly reuse cached fragments that were created from unknown elems #10501
  	if ( args.length === 1 && typeof first === "string" && first.length < 512 && context === document &&
  		first.charAt(0) === "<" && !rnocache.test( first ) &&
  		(jQuery.support.checkClone || !rchecked.test( first )) &&
  		(jQuery.support.html5Clone || !rnoshimcache.test( first )) ) {
  
  		// Mark cacheable and look for a hit
  		cacheable = true;
  		fragment = jQuery.fragments[ first ];
  		cachehit = fragment !== undefined;
  	}
  
  	if ( !fragment ) {
  		fragment = context.createDocumentFragment();
  		jQuery.clean( args, context, fragment, scripts );
  
  		// Update the cache, but only store false
  		// unless this is a second parsing of the same content
  		if ( cacheable ) {
  			jQuery.fragments[ first ] = cachehit && fragment;
  		}
  	}
  
  	return { fragment: fragment, cacheable: cacheable };
  };
  
  jQuery.fragments = {};
  
  jQuery.each({
  	appendTo: "append",
  	prependTo: "prepend",
  	insertBefore: "before",
  	insertAfter: "after",
  	replaceAll: "replaceWith"
  }, function( name, original ) {
  	jQuery.fn[ name ] = function( selector ) {
  		var elems,
  			i = 0,
  			ret = [],
  			insert = jQuery( selector ),
  			l = insert.length,
  			parent = this.length === 1 && this[0].parentNode;
  
  		if ( (parent == null || parent && parent.nodeType === 11 && parent.childNodes.length === 1) && l === 1 ) {
  			insert[ original ]( this[0] );
  			return this;
  		} else {
  			for ( ; i < l; i++ ) {
  				elems = ( i > 0 ? this.clone(true) : this ).get();
  				jQuery( insert[i] )[ original ]( elems );
  				ret = ret.concat( elems );
  			}
  
  			return this.pushStack( ret, name, insert.selector );
  		}
  	};
  });
  
  function getAll( elem ) {
  	if ( typeof elem.getElementsByTagName !== "undefined" ) {
  		return elem.getElementsByTagName( "*" );
  
  	} else if ( typeof elem.querySelectorAll !== "undefined" ) {
  		return elem.querySelectorAll( "*" );
  
  	} else {
  		return [];
  	}
  }
  
  // Used in clean, fixes the defaultChecked property
  function fixDefaultChecked( elem ) {
  	if ( rcheckableType.test( elem.type ) ) {
  		elem.defaultChecked = elem.checked;
  	}
  }
  
  jQuery.extend({
  	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
  		var srcElements,
  			destElements,
  			i,
  			clone;
  
  		if ( jQuery.support.html5Clone || jQuery.isXMLDoc(elem) || !rnoshimcache.test( "<" + elem.nodeName + ">" ) ) {
  			clone = elem.cloneNode( true );
  
  		// IE<=8 does not properly clone detached, unknown element nodes
  		} else {
  			fragmentDiv.innerHTML = elem.outerHTML;
  			fragmentDiv.removeChild( clone = fragmentDiv.firstChild );
  		}
  
  		if ( (!jQuery.support.noCloneEvent || !jQuery.support.noCloneChecked) &&
  				(elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem) ) {
  			// IE copies events bound via attachEvent when using cloneNode.
  			// Calling detachEvent on the clone will also remove the events
  			// from the original. In order to get around this, we use some
  			// proprietary methods to clear the events. Thanks to MooTools
  			// guys for this hotness.
  
  			cloneFixAttributes( elem, clone );
  
  			// Using Sizzle here is crazy slow, so we use getElementsByTagName instead
  			srcElements = getAll( elem );
  			destElements = getAll( clone );
  
  			// Weird iteration because IE will replace the length property
  			// with an element if you are cloning the body and one of the
  			// elements on the page has a name or id of "length"
  			for ( i = 0; srcElements[i]; ++i ) {
  				// Ensure that the destination node is not null; Fixes #9587
  				if ( destElements[i] ) {
  					cloneFixAttributes( srcElements[i], destElements[i] );
  				}
  			}
  		}
  
  		// Copy the events from the original to the clone
  		if ( dataAndEvents ) {
  			cloneCopyEvent( elem, clone );
  
  			if ( deepDataAndEvents ) {
  				srcElements = getAll( elem );
  				destElements = getAll( clone );
  
  				for ( i = 0; srcElements[i]; ++i ) {
  					cloneCopyEvent( srcElements[i], destElements[i] );
  				}
  			}
  		}
  
  		srcElements = destElements = null;
  
  		// Return the cloned set
  		return clone;
  	},
  
  	clean: function( elems, context, fragment, scripts ) {
  		var i, j, elem, tag, wrap, depth, div, hasBody, tbody, len, handleScript, jsTags,
  			safe = context === document && safeFragment,
  			ret = [];
  
  		// Ensure that context is a document
  		if ( !context || typeof context.createDocumentFragment === "undefined" ) {
  			context = document;
  		}
  
  		// Use the already-created safe fragment if context permits
  		for ( i = 0; (elem = elems[i]) != null; i++ ) {
  			if ( typeof elem === "number" ) {
  				elem += "";
  			}
  
  			if ( !elem ) {
  				continue;
  			}
  
  			// Convert html string into DOM nodes
  			if ( typeof elem === "string" ) {
  				if ( !rhtml.test( elem ) ) {
  					elem = context.createTextNode( elem );
  				} else {
  					// Ensure a safe container in which to render the html
  					safe = safe || createSafeFragment( context );
  					div = context.createElement("div");
  					safe.appendChild( div );
  
  					// Fix "XHTML"-style tags in all browsers
  					elem = elem.replace(rxhtmlTag, "<$1></$2>");
  
  					// Go to html and back, then peel off extra wrappers
  					tag = ( rtagName.exec( elem ) || ["", ""] )[1].toLowerCase();
  					wrap = wrapMap[ tag ] || wrapMap._default;
  					depth = wrap[0];
  					div.innerHTML = wrap[1] + elem + wrap[2];
  
  					// Move to the right depth
  					while ( depth-- ) {
  						div = div.lastChild;
  					}
  
  					// Remove IE's autoinserted <tbody> from table fragments
  					if ( !jQuery.support.tbody ) {
  
  						// String was a <table>, *may* have spurious <tbody>
  						hasBody = rtbody.test(elem);
  							tbody = tag === "table" && !hasBody ?
  								div.firstChild && div.firstChild.childNodes :
  
  								// String was a bare <thead> or <tfoot>
  								wrap[1] === "<table>" && !hasBody ?
  									div.childNodes :
  									[];
  
  						for ( j = tbody.length - 1; j >= 0 ; --j ) {
  							if ( jQuery.nodeName( tbody[ j ], "tbody" ) && !tbody[ j ].childNodes.length ) {
  								tbody[ j ].parentNode.removeChild( tbody[ j ] );
  							}
  						}
  					}
  
  					// IE completely kills leading whitespace when innerHTML is used
  					if ( !jQuery.support.leadingWhitespace && rleadingWhitespace.test( elem ) ) {
  						div.insertBefore( context.createTextNode( rleadingWhitespace.exec(elem)[0] ), div.firstChild );
  					}
  
  					elem = div.childNodes;
  
  					// Take out of fragment container (we need a fresh div each time)
  					div.parentNode.removeChild( div );
  				}
  			}
  
  			if ( elem.nodeType ) {
  				ret.push( elem );
  			} else {
  				jQuery.merge( ret, elem );
  			}
  		}
  
  		// Fix #11356: Clear elements from safeFragment
  		if ( div ) {
  			elem = div = safe = null;
  		}
  
  		// Reset defaultChecked for any radios and checkboxes
  		// about to be appended to the DOM in IE 6/7 (#8060)
  		if ( !jQuery.support.appendChecked ) {
  			for ( i = 0; (elem = ret[i]) != null; i++ ) {
  				if ( jQuery.nodeName( elem, "input" ) ) {
  					fixDefaultChecked( elem );
  				} else if ( typeof elem.getElementsByTagName !== "undefined" ) {
  					jQuery.grep( elem.getElementsByTagName("input"), fixDefaultChecked );
  				}
  			}
  		}
  
  		// Append elements to a provided document fragment
  		if ( fragment ) {
  			// Special handling of each script element
  			handleScript = function( elem ) {
  				// Check if we consider it executable
  				if ( !elem.type || rscriptType.test( elem.type ) ) {
  					// Detach the script and store it in the scripts array (if provided) or the fragment
  					// Return truthy to indicate that it has been handled
  					return scripts ?
  						scripts.push( elem.parentNode ? elem.parentNode.removeChild( elem ) : elem ) :
  						fragment.appendChild( elem );
  				}
  			};
  
  			for ( i = 0; (elem = ret[i]) != null; i++ ) {
  				// Check if we're done after handling an executable script
  				if ( !( jQuery.nodeName( elem, "script" ) && handleScript( elem ) ) ) {
  					// Append to fragment and handle embedded scripts
  					fragment.appendChild( elem );
  					if ( typeof elem.getElementsByTagName !== "undefined" ) {
  						// handleScript alters the DOM, so use jQuery.merge to ensure snapshot iteration
  						jsTags = jQuery.grep( jQuery.merge( [], elem.getElementsByTagName("script") ), handleScript );
  
  						// Splice the scripts into ret after their former ancestor and advance our index beyond them
  						ret.splice.apply( ret, [i + 1, 0].concat( jsTags ) );
  						i += jsTags.length;
  					}
  				}
  			}
  		}
  
  		return ret;
  	},
  
  	cleanData: function( elems, /* internal */ acceptData ) {
  		var data, id, elem, type,
  			i = 0,
  			internalKey = jQuery.expando,
  			cache = jQuery.cache,
  			deleteExpando = jQuery.support.deleteExpando,
  			special = jQuery.event.special;
  
  		for ( ; (elem = elems[i]) != null; i++ ) {
  
  			if ( acceptData || jQuery.acceptData( elem ) ) {
  
  				id = elem[ internalKey ];
  				data = id && cache[ id ];
  
  				if ( data ) {
  					if ( data.events ) {
  						for ( type in data.events ) {
  							if ( special[ type ] ) {
  								jQuery.event.remove( elem, type );
  
  							// This is a shortcut to avoid jQuery.event.remove's overhead
  							} else {
  								jQuery.removeEvent( elem, type, data.handle );
  							}
  						}
  					}
  
  					// Remove cache only if it was not already removed by jQuery.event.remove
  					if ( cache[ id ] ) {
  
  						delete cache[ id ];
  
  						// IE does not allow us to delete expando properties from nodes,
  						// nor does it have a removeAttribute function on Document nodes;
  						// we must handle all of these cases
  						if ( deleteExpando ) {
  							delete elem[ internalKey ];
  
  						} else if ( elem.removeAttribute ) {
  							elem.removeAttribute( internalKey );
  
  						} else {
  							elem[ internalKey ] = null;
  						}
  
  						jQuery.deletedIds.push( id );
  					}
  				}
  			}
  		}
  	}
  });
  // Limit scope pollution from any deprecated API
  (function() {
  
  var matched, browser;
  
  // Use of jQuery.browser is frowned upon.
  // More details: http://api.jquery.com/jQuery.browser
  // jQuery.uaMatch maintained for back-compat
  jQuery.uaMatch = function( ua ) {
  	ua = ua.toLowerCase();
  
  	var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
  		/(webkit)[ \/]([\w.]+)/.exec( ua ) ||
  		/(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
  		/(msie) ([\w.]+)/.exec( ua ) ||
  		ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
  		[];
  
  	return {
  		browser: match[ 1 ] || "",
  		version: match[ 2 ] || "0"
  	};
  };
  
  matched = jQuery.uaMatch( navigator.userAgent );
  browser = {};
  
  if ( matched.browser ) {
  	browser[ matched.browser ] = true;
  	browser.version = matched.version;
  }
  
  // Chrome is Webkit, but Webkit is also Safari.
  if ( browser.chrome ) {
  	browser.webkit = true;
  } else if ( browser.webkit ) {
  	browser.safari = true;
  }
  
  jQuery.browser = browser;
  
  jQuery.sub = function() {
  	function jQuerySub( selector, context ) {
  		return new jQuerySub.fn.init( selector, context );
  	}
  	jQuery.extend( true, jQuerySub, this );
  	jQuerySub.superclass = this;
  	jQuerySub.fn = jQuerySub.prototype = this();
  	jQuerySub.fn.constructor = jQuerySub;
  	jQuerySub.sub = this.sub;
  	jQuerySub.fn.init = function init( selector, context ) {
  		if ( context && context instanceof jQuery && !(context instanceof jQuerySub) ) {
  			context = jQuerySub( context );
  		}
  
  		return jQuery.fn.init.call( this, selector, context, rootjQuerySub );
  	};
  	jQuerySub.fn.init.prototype = jQuerySub.fn;
  	var rootjQuerySub = jQuerySub(document);
  	return jQuerySub;
  };
  
  })();
  var curCSS, iframe, iframeDoc,
  	ralpha = /alpha\([^)]*\)/i,
  	ropacity = /opacity=([^)]*)/,
  	rposition = /^(top|right|bottom|left)$/,
  	// swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
  	// see here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
  	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
  	rmargin = /^margin/,
  	rnumsplit = new RegExp( "^(" + core_pnum + ")(.*)$", "i" ),
  	rnumnonpx = new RegExp( "^(" + core_pnum + ")(?!px)[a-z%]+$", "i" ),
  	rrelNum = new RegExp( "^([-+])=(" + core_pnum + ")", "i" ),
  	elemdisplay = { BODY: "block" },
  
  	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
  	cssNormalTransform = {
  		letterSpacing: 0,
  		fontWeight: 400
  	},
  
  	cssExpand = [ "Top", "Right", "Bottom", "Left" ],
  	cssPrefixes = [ "Webkit", "O", "Moz", "ms" ],
  
  	eventsToggle = jQuery.fn.toggle;
  
  // return a css property mapped to a potentially vendor prefixed property
  function vendorPropName( style, name ) {
  
  	// shortcut for names that are not vendor prefixed
  	if ( name in style ) {
  		return name;
  	}
  
  	// check for vendor prefixed names
  	var capName = name.charAt(0).toUpperCase() + name.slice(1),
  		origName = name,
  		i = cssPrefixes.length;
  
  	while ( i-- ) {
  		name = cssPrefixes[ i ] + capName;
  		if ( name in style ) {
  			return name;
  		}
  	}
  
  	return origName;
  }
  
  function isHidden( elem, el ) {
  	elem = el || elem;
  	return jQuery.css( elem, "display" ) === "none" || !jQuery.contains( elem.ownerDocument, elem );
  }
  
  function showHide( elements, show ) {
  	var elem, display,
  		values = [],
  		index = 0,
  		length = elements.length;
  
  	for ( ; index < length; index++ ) {
  		elem = elements[ index ];
  		if ( !elem.style ) {
  			continue;
  		}
  		values[ index ] = jQuery._data( elem, "olddisplay" );
  		if ( show ) {
  			// Reset the inline display of this element to learn if it is
  			// being hidden by cascaded rules or not
  			if ( !values[ index ] && elem.style.display === "none" ) {
  				elem.style.display = "";
  			}
  
  			// Set elements which have been overridden with display: none
  			// in a stylesheet to whatever the default browser style is
  			// for such an element
  			if ( elem.style.display === "" && isHidden( elem ) ) {
  				values[ index ] = jQuery._data( elem, "olddisplay", css_defaultDisplay(elem.nodeName) );
  			}
  		} else {
  			display = curCSS( elem, "display" );
  
  			if ( !values[ index ] && display !== "none" ) {
  				jQuery._data( elem, "olddisplay", display );
  			}
  		}
  	}
  
  	// Set the display of most of the elements in a second loop
  	// to avoid the constant reflow
  	for ( index = 0; index < length; index++ ) {
  		elem = elements[ index ];
  		if ( !elem.style ) {
  			continue;
  		}
  		if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
  			elem.style.display = show ? values[ index ] || "" : "none";
  		}
  	}
  
  	return elements;
  }
  
  jQuery.fn.extend({
  	css: function( name, value ) {
  		return jQuery.access( this, function( elem, name, value ) {
  			return value !== undefined ?
  				jQuery.style( elem, name, value ) :
  				jQuery.css( elem, name );
  		}, name, value, arguments.length > 1 );
  	},
  	show: function() {
  		return showHide( this, true );
  	},
  	hide: function() {
  		return showHide( this );
  	},
  	toggle: function( state, fn2 ) {
  		var bool = typeof state === "boolean";
  
  		if ( jQuery.isFunction( state ) && jQuery.isFunction( fn2 ) ) {
  			return eventsToggle.apply( this, arguments );
  		}
  
  		return this.each(function() {
  			if ( bool ? state : isHidden( this ) ) {
  				jQuery( this ).show();
  			} else {
  				jQuery( this ).hide();
  			}
  		});
  	}
  });
  
  jQuery.extend({
  	// Add in style property hooks for overriding the default
  	// behavior of getting and setting a style property
  	cssHooks: {
  		opacity: {
  			get: function( elem, computed ) {
  				if ( computed ) {
  					// We should always get a number back from opacity
  					var ret = curCSS( elem, "opacity" );
  					return ret === "" ? "1" : ret;
  
  				}
  			}
  		}
  	},
  
  	// Exclude the following css properties to add px
  	cssNumber: {
  		"fillOpacity": true,
  		"fontWeight": true,
  		"lineHeight": true,
  		"opacity": true,
  		"orphans": true,
  		"widows": true,
  		"zIndex": true,
  		"zoom": true
  	},
  
  	// Add in properties whose names you wish to fix before
  	// setting or getting the value
  	cssProps: {
  		// normalize float css property
  		"float": jQuery.support.cssFloat ? "cssFloat" : "styleFloat"
  	},
  
  	// Get and set the style property on a DOM Node
  	style: function( elem, name, value, extra ) {
  		// Don't set styles on text and comment nodes
  		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
  			return;
  		}
  
  		// Make sure that we're working with the right name
  		var ret, type, hooks,
  			origName = jQuery.camelCase( name ),
  			style = elem.style;
  
  		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( style, origName ) );
  
  		// gets hook for the prefixed version
  		// followed by the unprefixed version
  		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];
  
  		// Check if we're setting a value
  		if ( value !== undefined ) {
  			type = typeof value;
  
  			// convert relative number strings (+= or -=) to relative numbers. #7345
  			if ( type === "string" && (ret = rrelNum.exec( value )) ) {
  				value = ( ret[1] + 1 ) * ret[2] + parseFloat( jQuery.css( elem, name ) );
  				// Fixes bug #9237
  				type = "number";
  			}
  
  			// Make sure that NaN and null values aren't set. See: #7116
  			if ( value == null || type === "number" && isNaN( value ) ) {
  				return;
  			}
  
  			// If a number was passed in, add 'px' to the (except for certain CSS properties)
  			if ( type === "number" && !jQuery.cssNumber[ origName ] ) {
  				value += "px";
  			}
  
  			// If a hook was provided, use that value, otherwise just set the specified value
  			if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value, extra )) !== undefined ) {
  				// Wrapped to prevent IE from throwing errors when 'invalid' values are provided
  				// Fixes bug #5509
  				try {
  					style[ name ] = value;
  				} catch(e) {}
  			}
  
  		} else {
  			// If a hook was provided get the non-computed value from there
  			if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
  				return ret;
  			}
  
  			// Otherwise just get the value from the style object
  			return style[ name ];
  		}
  	},
  
  	css: function( elem, name, numeric, extra ) {
  		var val, num, hooks,
  			origName = jQuery.camelCase( name );
  
  		// Make sure that we're working with the right name
  		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( elem.style, origName ) );
  
  		// gets hook for the prefixed version
  		// followed by the unprefixed version
  		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];
  
  		// If a hook was provided get the computed value from there
  		if ( hooks && "get" in hooks ) {
  			val = hooks.get( elem, true, extra );
  		}
  
  		// Otherwise, if a way to get the computed value exists, use that
  		if ( val === undefined ) {
  			val = curCSS( elem, name );
  		}
  
  		//convert "normal" to computed value
  		if ( val === "normal" && name in cssNormalTransform ) {
  			val = cssNormalTransform[ name ];
  		}
  
  		// Return, converting to number if forced or a qualifier was provided and val looks numeric
  		if ( numeric || extra !== undefined ) {
  			num = parseFloat( val );
  			return numeric || jQuery.isNumeric( num ) ? num || 0 : val;
  		}
  		return val;
  	},
  
  	// A method for quickly swapping in/out CSS properties to get correct calculations
  	swap: function( elem, options, callback ) {
  		var ret, name,
  			old = {};
  
  		// Remember the old values, and insert the new ones
  		for ( name in options ) {
  			old[ name ] = elem.style[ name ];
  			elem.style[ name ] = options[ name ];
  		}
  
  		ret = callback.call( elem );
  
  		// Revert the old values
  		for ( name in options ) {
  			elem.style[ name ] = old[ name ];
  		}
  
  		return ret;
  	}
  });
  
  // NOTE: To any future maintainer, we've window.getComputedStyle
  // because jsdom on node.js will break without it.
  if ( window.getComputedStyle ) {
  	curCSS = function( elem, name ) {
  		var ret, width, minWidth, maxWidth,
  			computed = window.getComputedStyle( elem, null ),
  			style = elem.style;
  
  		if ( computed ) {
  
  			// getPropertyValue is only needed for .css('filter') in IE9, see #12537
  			ret = computed.getPropertyValue( name ) || computed[ name ];
  
  			if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
  				ret = jQuery.style( elem, name );
  			}
  
  			// A tribute to the "awesome hack by Dean Edwards"
  			// Chrome < 17 and Safari 5.0 uses "computed value" instead of "used value" for margin-right
  			// Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
  			// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
  			if ( rnumnonpx.test( ret ) && rmargin.test( name ) ) {
  				width = style.width;
  				minWidth = style.minWidth;
  				maxWidth = style.maxWidth;
  
  				style.minWidth = style.maxWidth = style.width = ret;
  				ret = computed.width;
  
  				style.width = width;
  				style.minWidth = minWidth;
  				style.maxWidth = maxWidth;
  			}
  		}
  
  		return ret;
  	};
  } else if ( document.documentElement.currentStyle ) {
  	curCSS = function( elem, name ) {
  		var left, rsLeft,
  			ret = elem.currentStyle && elem.currentStyle[ name ],
  			style = elem.style;
  
  		// Avoid setting ret to empty string here
  		// so we don't default to auto
  		if ( ret == null && style && style[ name ] ) {
  			ret = style[ name ];
  		}
  
  		// From the awesome hack by Dean Edwards
  		// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291
  
  		// If we're not dealing with a regular pixel number
  		// but a number that has a weird ending, we need to convert it to pixels
  		// but not position css attributes, as those are proportional to the parent element instead
  		// and we can't measure the parent instead because it might trigger a "stacking dolls" problem
  		if ( rnumnonpx.test( ret ) && !rposition.test( name ) ) {
  
  			// Remember the original values
  			left = style.left;
  			rsLeft = elem.runtimeStyle && elem.runtimeStyle.left;
  
  			// Put in the new values to get a computed value out
  			if ( rsLeft ) {
  				elem.runtimeStyle.left = elem.currentStyle.left;
  			}
  			style.left = name === "fontSize" ? "1em" : ret;
  			ret = style.pixelLeft + "px";
  
  			// Revert the changed values
  			style.left = left;
  			if ( rsLeft ) {
  				elem.runtimeStyle.left = rsLeft;
  			}
  		}
  
  		return ret === "" ? "auto" : ret;
  	};
  }
  
  function setPositiveNumber( elem, value, subtract ) {
  	var matches = rnumsplit.exec( value );
  	return matches ?
  			Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" ) :
  			value;
  }
  
  function augmentWidthOrHeight( elem, name, extra, isBorderBox ) {
  	var i = extra === ( isBorderBox ? "border" : "content" ) ?
  		// If we already have the right measurement, avoid augmentation
  		4 :
  		// Otherwise initialize for horizontal or vertical properties
  		name === "width" ? 1 : 0,
  
  		val = 0;
  
  	for ( ; i < 4; i += 2 ) {
  		// both box models exclude margin, so add it if we want it
  		if ( extra === "margin" ) {
  			// we use jQuery.css instead of curCSS here
  			// because of the reliableMarginRight CSS hook!
  			val += jQuery.css( elem, extra + cssExpand[ i ], true );
  		}
  
  		// From this point on we use curCSS for maximum performance (relevant in animations)
  		if ( isBorderBox ) {
  			// border-box includes padding, so remove it if we want content
  			if ( extra === "content" ) {
  				val -= parseFloat( curCSS( elem, "padding" + cssExpand[ i ] ) ) || 0;
  			}
  
  			// at this point, extra isn't border nor margin, so remove border
  			if ( extra !== "margin" ) {
  				val -= parseFloat( curCSS( elem, "border" + cssExpand[ i ] + "Width" ) ) || 0;
  			}
  		} else {
  			// at this point, extra isn't content, so add padding
  			val += parseFloat( curCSS( elem, "padding" + cssExpand[ i ] ) ) || 0;
  
  			// at this point, extra isn't content nor padding, so add border
  			if ( extra !== "padding" ) {
  				val += parseFloat( curCSS( elem, "border" + cssExpand[ i ] + "Width" ) ) || 0;
  			}
  		}
  	}
  
  	return val;
  }
  
  function getWidthOrHeight( elem, name, extra ) {
  
  	// Start with offset property, which is equivalent to the border-box value
  	var val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
  		valueIsBorderBox = true,
  		isBorderBox = jQuery.support.boxSizing && jQuery.css( elem, "boxSizing" ) === "border-box";
  
  	// some non-html elements return undefined for offsetWidth, so check for null/undefined
  	// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
  	// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
  	if ( val <= 0 || val == null ) {
  		// Fall back to computed then uncomputed css if necessary
  		val = curCSS( elem, name );
  		if ( val < 0 || val == null ) {
  			val = elem.style[ name ];
  		}
  
  		// Computed unit is not pixels. Stop here and return.
  		if ( rnumnonpx.test(val) ) {
  			return val;
  		}
  
  		// we need the check for style in case a browser which returns unreliable values
  		// for getComputedStyle silently falls back to the reliable elem.style
  		valueIsBorderBox = isBorderBox && ( jQuery.support.boxSizingReliable || val === elem.style[ name ] );
  
  		// Normalize "", auto, and prepare for extra
  		val = parseFloat( val ) || 0;
  	}
  
  	// use the active box-sizing model to add/subtract irrelevant styles
  	return ( val +
  		augmentWidthOrHeight(
  			elem,
  			name,
  			extra || ( isBorderBox ? "border" : "content" ),
  			valueIsBorderBox
  		)
  	) + "px";
  }
  
  
  // Try to determine the default display value of an element
  function css_defaultDisplay( nodeName ) {
  	if ( elemdisplay[ nodeName ] ) {
  		return elemdisplay[ nodeName ];
  	}
  
  	var elem = jQuery( "<" + nodeName + ">" ).appendTo( document.body ),
  		display = elem.css("display");
  	elem.remove();
  
  	// If the simple way fails,
  	// get element's real default display by attaching it to a temp iframe
  	if ( display === "none" || display === "" ) {
  		// Use the already-created iframe if possible
  		iframe = document.body.appendChild(
  			iframe || jQuery.extend( document.createElement("iframe"), {
  				frameBorder: 0,
  				width: 0,
  				height: 0
  			})
  		);
  
  		// Create a cacheable copy of the iframe document on first call.
  		// IE and Opera will allow us to reuse the iframeDoc without re-writing the fake HTML
  		// document to it; WebKit & Firefox won't allow reusing the iframe document.
  		if ( !iframeDoc || !iframe.createElement ) {
  			iframeDoc = ( iframe.contentWindow || iframe.contentDocument ).document;
  			iframeDoc.write("<!doctype html><html><body>");
  			iframeDoc.close();
  		}
  
  		elem = iframeDoc.body.appendChild( iframeDoc.createElement(nodeName) );
  
  		display = curCSS( elem, "display" );
  		document.body.removeChild( iframe );
  	}
  
  	// Store the correct default display
  	elemdisplay[ nodeName ] = display;
  
  	return display;
  }
  
  jQuery.each([ "height", "width" ], function( i, name ) {
  	jQuery.cssHooks[ name ] = {
  		get: function( elem, computed, extra ) {
  			if ( computed ) {
  				// certain elements can have dimension info if we invisibly show them
  				// however, it must have a current display style that would benefit from this
  				if ( elem.offsetWidth === 0 && rdisplayswap.test( curCSS( elem, "display" ) ) ) {
  					return jQuery.swap( elem, cssShow, function() {
  						return getWidthOrHeight( elem, name, extra );
  					});
  				} else {
  					return getWidthOrHeight( elem, name, extra );
  				}
  			}
  		},
  
  		set: function( elem, value, extra ) {
  			return setPositiveNumber( elem, value, extra ?
  				augmentWidthOrHeight(
  					elem,
  					name,
  					extra,
  					jQuery.support.boxSizing && jQuery.css( elem, "boxSizing" ) === "border-box"
  				) : 0
  			);
  		}
  	};
  });
  
  if ( !jQuery.support.opacity ) {
  	jQuery.cssHooks.opacity = {
  		get: function( elem, computed ) {
  			// IE uses filters for opacity
  			return ropacity.test( (computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "" ) ?
  				( 0.01 * parseFloat( RegExp.$1 ) ) + "" :
  				computed ? "1" : "";
  		},
  
  		set: function( elem, value ) {
  			var style = elem.style,
  				currentStyle = elem.currentStyle,
  				opacity = jQuery.isNumeric( value ) ? "alpha(opacity=" + value * 100 + ")" : "",
  				filter = currentStyle && currentStyle.filter || style.filter || "";
  
  			// IE has trouble with opacity if it does not have layout
  			// Force it by setting the zoom level
  			style.zoom = 1;
  
  			// if setting opacity to 1, and no other filters exist - attempt to remove filter attribute #6652
  			if ( value >= 1 && jQuery.trim( filter.replace( ralpha, "" ) ) === "" &&
  				style.removeAttribute ) {
  
  				// Setting style.filter to null, "" & " " still leave "filter:" in the cssText
  				// if "filter:" is present at all, clearType is disabled, we want to avoid this
  				// style.removeAttribute is IE Only, but so apparently is this code path...
  				style.removeAttribute( "filter" );
  
  				// if there there is no filter style applied in a css rule, we are done
  				if ( currentStyle && !currentStyle.filter ) {
  					return;
  				}
  			}
  
  			// otherwise, set new filter values
  			style.filter = ralpha.test( filter ) ?
  				filter.replace( ralpha, opacity ) :
  				filter + " " + opacity;
  		}
  	};
  }
  
  // These hooks cannot be added until DOM ready because the support test
  // for it is not run until after DOM ready
  jQuery(function() {
  	if ( !jQuery.support.reliableMarginRight ) {
  		jQuery.cssHooks.marginRight = {
  			get: function( elem, computed ) {
  				// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
  				// Work around by temporarily setting element display to inline-block
  				return jQuery.swap( elem, { "display": "inline-block" }, function() {
  					if ( computed ) {
  						return curCSS( elem, "marginRight" );
  					}
  				});
  			}
  		};
  	}
  
  	// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
  	// getComputedStyle returns percent when specified for top/left/bottom/right
  	// rather than make the css module depend on the offset module, we just check for it here
  	if ( !jQuery.support.pixelPosition && jQuery.fn.position ) {
  		jQuery.each( [ "top", "left" ], function( i, prop ) {
  			jQuery.cssHooks[ prop ] = {
  				get: function( elem, computed ) {
  					if ( computed ) {
  						var ret = curCSS( elem, prop );
  						// if curCSS returns percentage, fallback to offset
  						return rnumnonpx.test( ret ) ? jQuery( elem ).position()[ prop ] + "px" : ret;
  					}
  				}
  			};
  		});
  	}
  
  });
  
  if ( jQuery.expr && jQuery.expr.filters ) {
  	jQuery.expr.filters.hidden = function( elem ) {
  		return ( elem.offsetWidth === 0 && elem.offsetHeight === 0 ) || (!jQuery.support.reliableHiddenOffsets && ((elem.style && elem.style.display) || curCSS( elem, "display" )) === "none");
  	};
  
  	jQuery.expr.filters.visible = function( elem ) {
  		return !jQuery.expr.filters.hidden( elem );
  	};
  }
  
  // These hooks are used by animate to expand properties
  jQuery.each({
  	margin: "",
  	padding: "",
  	border: "Width"
  }, function( prefix, suffix ) {
  	jQuery.cssHooks[ prefix + suffix ] = {
  		expand: function( value ) {
  			var i,
  
  				// assumes a single number if not a string
  				parts = typeof value === "string" ? value.split(" ") : [ value ],
  				expanded = {};
  
  			for ( i = 0; i < 4; i++ ) {
  				expanded[ prefix + cssExpand[ i ] + suffix ] =
  					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
  			}
  
  			return expanded;
  		}
  	};
  
  	if ( !rmargin.test( prefix ) ) {
  		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
  	}
  });
  var r20 = /%20/g,
  	rbracket = /\[\]$/,
  	rCRLF = /\r?\n/g,
  	rinput = /^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,
  	rselectTextarea = /^(?:select|textarea)/i;
  
  jQuery.fn.extend({
  	serialize: function() {
  		return jQuery.param( this.serializeArray() );
  	},
  	serializeArray: function() {
  		return this.map(function(){
  			return this.elements ? jQuery.makeArray( this.elements ) : this;
  		})
  		.filter(function(){
  			return this.name && !this.disabled &&
  				( this.checked || rselectTextarea.test( this.nodeName ) ||
  					rinput.test( this.type ) );
  		})
  		.map(function( i, elem ){
  			var val = jQuery( this ).val();
  
  			return val == null ?
  				null :
  				jQuery.isArray( val ) ?
  					jQuery.map( val, function( val, i ){
  						return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
  					}) :
  					{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
  		}).get();
  	}
  });
  
  //Serialize an array of form elements or a set of
  //key/values into a query string
  jQuery.param = function( a, traditional ) {
  	var prefix,
  		s = [],
  		add = function( key, value ) {
  			// If value is a function, invoke it and return its value
  			value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
  			s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
  		};
  
  	// Set traditional to true for jQuery <= 1.3.2 behavior.
  	if ( traditional === undefined ) {
  		traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
  	}
  
  	// If an array was passed in, assume that it is an array of form elements.
  	if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
  		// Serialize the form elements
  		jQuery.each( a, function() {
  			add( this.name, this.value );
  		});
  
  	} else {
  		// If traditional, encode the "old" way (the way 1.3.2 or older
  		// did it), otherwise encode params recursively.
  		for ( prefix in a ) {
  			buildParams( prefix, a[ prefix ], traditional, add );
  		}
  	}
  
  	// Return the resulting serialization
  	return s.join( "&" ).replace( r20, "+" );
  };
  
  function buildParams( prefix, obj, traditional, add ) {
  	var name;
  
  	if ( jQuery.isArray( obj ) ) {
  		// Serialize array item.
  		jQuery.each( obj, function( i, v ) {
  			if ( traditional || rbracket.test( prefix ) ) {
  				// Treat each array item as a scalar.
  				add( prefix, v );
  
  			} else {
  				// If array item is non-scalar (array or object), encode its
  				// numeric index to resolve deserialization ambiguity issues.
  				// Note that rack (as of 1.0.0) can't currently deserialize
  				// nested arrays properly, and attempting to do so may cause
  				// a server error. Possible fixes are to modify rack's
  				// deserialization algorithm or to provide an option or flag
  				// to force array serialization to be shallow.
  				buildParams( prefix + "[" + ( typeof v === "object" ? i : "" ) + "]", v, traditional, add );
  			}
  		});
  
  	} else if ( !traditional && jQuery.type( obj ) === "object" ) {
  		// Serialize object item.
  		for ( name in obj ) {
  			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
  		}
  
  	} else {
  		// Serialize scalar item.
  		add( prefix, obj );
  	}
  }
  var
  	// Document location
  	ajaxLocParts,
  	ajaxLocation,
  
  	rhash = /#.*$/,
  	rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg, // IE leaves an \r character at EOL
  	// #7653, #8125, #8152: local protocol detection
  	rlocalProtocol = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,
  	rnoContent = /^(?:GET|HEAD)$/,
  	rprotocol = /^\/\//,
  	rquery = /\?/,
  	rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  	rts = /([?&])_=[^&]*/,
  	rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,
  
  	// Keep a copy of the old load method
  	_load = jQuery.fn.load,
  
  	/* Prefilters
  	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
  	 * 2) These are called:
  	 *    - BEFORE asking for a transport
  	 *    - AFTER param serialization (s.data is a string if s.processData is true)
  	 * 3) key is the dataType
  	 * 4) the catchall symbol "*" can be used
  	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
  	 */
  	prefilters = {},
  
  	/* Transports bindings
  	 * 1) key is the dataType
  	 * 2) the catchall symbol "*" can be used
  	 * 3) selection will start with transport dataType and THEN go to "*" if needed
  	 */
  	transports = {},
  
  	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
  	allTypes = ["*/"] + ["*"];
  
  // #8138, IE may throw an exception when accessing
  // a field from window.location if document.domain has been set
  try {
  	ajaxLocation = location.href;
  } catch( e ) {
  	// Use the href attribute of an A element
  	// since IE will modify it given document.location
  	ajaxLocation = document.createElement( "a" );
  	ajaxLocation.href = "";
  	ajaxLocation = ajaxLocation.href;
  }
  
  // Segment location into parts
  ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];
  
  // Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
  function addToPrefiltersOrTransports( structure ) {
  
  	// dataTypeExpression is optional and defaults to "*"
  	return function( dataTypeExpression, func ) {
  
  		if ( typeof dataTypeExpression !== "string" ) {
  			func = dataTypeExpression;
  			dataTypeExpression = "*";
  		}
  
  		var dataType, list, placeBefore,
  			dataTypes = dataTypeExpression.toLowerCase().split( core_rspace ),
  			i = 0,
  			length = dataTypes.length;
  
  		if ( jQuery.isFunction( func ) ) {
  			// For each dataType in the dataTypeExpression
  			for ( ; i < length; i++ ) {
  				dataType = dataTypes[ i ];
  				// We control if we're asked to add before
  				// any existing element
  				placeBefore = /^\+/.test( dataType );
  				if ( placeBefore ) {
  					dataType = dataType.substr( 1 ) || "*";
  				}
  				list = structure[ dataType ] = structure[ dataType ] || [];
  				// then we add to the structure accordingly
  				list[ placeBefore ? "unshift" : "push" ]( func );
  			}
  		}
  	};
  }
  
  // Base inspection function for prefilters and transports
  function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR,
  		dataType /* internal */, inspected /* internal */ ) {
  
  	dataType = dataType || options.dataTypes[ 0 ];
  	inspected = inspected || {};
  
  	inspected[ dataType ] = true;
  
  	var selection,
  		list = structure[ dataType ],
  		i = 0,
  		length = list ? list.length : 0,
  		executeOnly = ( structure === prefilters );
  
  	for ( ; i < length && ( executeOnly || !selection ); i++ ) {
  		selection = list[ i ]( options, originalOptions, jqXHR );
  		// If we got redirected to another dataType
  		// we try there if executing only and not done already
  		if ( typeof selection === "string" ) {
  			if ( !executeOnly || inspected[ selection ] ) {
  				selection = undefined;
  			} else {
  				options.dataTypes.unshift( selection );
  				selection = inspectPrefiltersOrTransports(
  						structure, options, originalOptions, jqXHR, selection, inspected );
  			}
  		}
  	}
  	// If we're only executing or nothing was selected
  	// we try the catchall dataType if not done already
  	if ( ( executeOnly || !selection ) && !inspected[ "*" ] ) {
  		selection = inspectPrefiltersOrTransports(
  				structure, options, originalOptions, jqXHR, "*", inspected );
  	}
  	// unnecessary when only executing (prefilters)
  	// but it'll be ignored by the caller in that case
  	return selection;
  }
  
  // A special extend for ajax options
  // that takes "flat" options (not to be deep extended)
  // Fixes #9887
  function ajaxExtend( target, src ) {
  	var key, deep,
  		flatOptions = jQuery.ajaxSettings.flatOptions || {};
  	for ( key in src ) {
  		if ( src[ key ] !== undefined ) {
  			( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
  		}
  	}
  	if ( deep ) {
  		jQuery.extend( true, target, deep );
  	}
  }
  
  jQuery.fn.load = function( url, params, callback ) {
  	if ( typeof url !== "string" && _load ) {
  		return _load.apply( this, arguments );
  	}
  
  	// Don't do a request if no elements are being requested
  	if ( !this.length ) {
  		return this;
  	}
  
  	var selector, type, response,
  		self = this,
  		off = url.indexOf(" ");
  
  	if ( off >= 0 ) {
  		selector = url.slice( off, url.length );
  		url = url.slice( 0, off );
  	}
  
  	// If it's a function
  	if ( jQuery.isFunction( params ) ) {
  
  		// We assume that it's the callback
  		callback = params;
  		params = undefined;
  
  	// Otherwise, build a param string
  	} else if ( params && typeof params === "object" ) {
  		type = "POST";
  	}
  
  	// Request the remote document
  	jQuery.ajax({
  		url: url,
  
  		// if "type" variable is undefined, then "GET" method will be used
  		type: type,
  		dataType: "html",
  		data: params,
  		complete: function( jqXHR, status ) {
  			if ( callback ) {
  				self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
  			}
  		}
  	}).done(function( responseText ) {
  
  		// Save response for use in complete callback
  		response = arguments;
  
  		// See if a selector was specified
  		self.html( selector ?
  
  			// Create a dummy div to hold the results
  			jQuery("<div>")
  
  				// inject the contents of the document in, removing the scripts
  				// to avoid any 'Permission Denied' errors in IE
  				.append( responseText.replace( rscript, "" ) )
  
  				// Locate the specified elements
  				.find( selector ) :
  
  			// If not, just inject the full result
  			responseText );
  
  	});
  
  	return this;
  };
  
  // Attach a bunch of functions for handling common AJAX events
  jQuery.each( "ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split( " " ), function( i, o ){
  	jQuery.fn[ o ] = function( f ){
  		return this.on( o, f );
  	};
  });
  
  jQuery.each( [ "get", "post" ], function( i, method ) {
  	jQuery[ method ] = function( url, data, callback, type ) {
  		// shift arguments if data argument was omitted
  		if ( jQuery.isFunction( data ) ) {
  			type = type || callback;
  			callback = data;
  			data = undefined;
  		}
  
  		return jQuery.ajax({
  			type: method,
  			url: url,
  			data: data,
  			success: callback,
  			dataType: type
  		});
  	};
  });
  
  jQuery.extend({
  
  	getScript: function( url, callback ) {
  		return jQuery.get( url, undefined, callback, "script" );
  	},
  
  	getJSON: function( url, data, callback ) {
  		return jQuery.get( url, data, callback, "json" );
  	},
  
  	// Creates a full fledged settings object into target
  	// with both ajaxSettings and settings fields.
  	// If target is omitted, writes into ajaxSettings.
  	ajaxSetup: function( target, settings ) {
  		if ( settings ) {
  			// Building a settings object
  			ajaxExtend( target, jQuery.ajaxSettings );
  		} else {
  			// Extending ajaxSettings
  			settings = target;
  			target = jQuery.ajaxSettings;
  		}
  		ajaxExtend( target, settings );
  		return target;
  	},
  
  	ajaxSettings: {
  		url: ajaxLocation,
  		isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
  		global: true,
  		type: "GET",
  		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
  		processData: true,
  		async: true,
  		/*
  		timeout: 0,
  		data: null,
  		dataType: null,
  		username: null,
  		password: null,
  		cache: null,
  		throws: false,
  		traditional: false,
  		headers: {},
  		*/
  
  		accepts: {
  			xml: "application/xml, text/xml",
  			html: "text/html",
  			text: "text/plain",
  			json: "application/json, text/javascript",
  			"*": allTypes
  		},
  
  		contents: {
  			xml: /xml/,
  			html: /html/,
  			json: /json/
  		},
  
  		responseFields: {
  			xml: "responseXML",
  			text: "responseText"
  		},
  
  		// List of data converters
  		// 1) key format is "source_type destination_type" (a single space in-between)
  		// 2) the catchall symbol "*" can be used for source_type
  		converters: {
  
  			// Convert anything to text
  			"* text": window.String,
  
  			// Text to html (true = no transformation)
  			"text html": true,
  
  			// Evaluate text as a json expression
  			"text json": jQuery.parseJSON,
  
  			// Parse text as xml
  			"text xml": jQuery.parseXML
  		},
  
  		// For options that shouldn't be deep extended:
  		// you can add your own custom options here if
  		// and when you create one that shouldn't be
  		// deep extended (see ajaxExtend)
  		flatOptions: {
  			context: true,
  			url: true
  		}
  	},
  
  	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
  	ajaxTransport: addToPrefiltersOrTransports( transports ),
  
  	// Main method
  	ajax: function( url, options ) {
  
  		// If url is an object, simulate pre-1.5 signature
  		if ( typeof url === "object" ) {
  			options = url;
  			url = undefined;
  		}
  
  		// Force options to be an object
  		options = options || {};
  
  		var // ifModified key
  			ifModifiedKey,
  			// Response headers
  			responseHeadersString,
  			responseHeaders,
  			// transport
  			transport,
  			// timeout handle
  			timeoutTimer,
  			// Cross-domain detection vars
  			parts,
  			// To know if global events are to be dispatched
  			fireGlobals,
  			// Loop variable
  			i,
  			// Create the final options object
  			s = jQuery.ajaxSetup( {}, options ),
  			// Callbacks context
  			callbackContext = s.context || s,
  			// Context for global events
  			// It's the callbackContext if one was provided in the options
  			// and if it's a DOM node or a jQuery collection
  			globalEventContext = callbackContext !== s &&
  				( callbackContext.nodeType || callbackContext instanceof jQuery ) ?
  						jQuery( callbackContext ) : jQuery.event,
  			// Deferreds
  			deferred = jQuery.Deferred(),
  			completeDeferred = jQuery.Callbacks( "once memory" ),
  			// Status-dependent callbacks
  			statusCode = s.statusCode || {},
  			// Headers (they are sent all at once)
  			requestHeaders = {},
  			requestHeadersNames = {},
  			// The jqXHR state
  			state = 0,
  			// Default abort message
  			strAbort = "canceled",
  			// Fake xhr
  			jqXHR = {
  
  				readyState: 0,
  
  				// Caches the header
  				setRequestHeader: function( name, value ) {
  					if ( !state ) {
  						var lname = name.toLowerCase();
  						name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
  						requestHeaders[ name ] = value;
  					}
  					return this;
  				},
  
  				// Raw string
  				getAllResponseHeaders: function() {
  					return state === 2 ? responseHeadersString : null;
  				},
  
  				// Builds headers hashtable if needed
  				getResponseHeader: function( key ) {
  					var match;
  					if ( state === 2 ) {
  						if ( !responseHeaders ) {
  							responseHeaders = {};
  							while( ( match = rheaders.exec( responseHeadersString ) ) ) {
  								responseHeaders[ match[1].toLowerCase() ] = match[ 2 ];
  							}
  						}
  						match = responseHeaders[ key.toLowerCase() ];
  					}
  					return match === undefined ? null : match;
  				},
  
  				// Overrides response content-type header
  				overrideMimeType: function( type ) {
  					if ( !state ) {
  						s.mimeType = type;
  					}
  					return this;
  				},
  
  				// Cancel the request
  				abort: function( statusText ) {
  					statusText = statusText || strAbort;
  					if ( transport ) {
  						transport.abort( statusText );
  					}
  					done( 0, statusText );
  					return this;
  				}
  			};
  
  		// Callback for when everything is done
  		// It is defined here because jslint complains if it is declared
  		// at the end of the function (which would be more logical and readable)
  		function done( status, nativeStatusText, responses, headers ) {
  			var isSuccess, success, error, response, modified,
  				statusText = nativeStatusText;
  
  			// Called once
  			if ( state === 2 ) {
  				return;
  			}
  
  			// State is "done" now
  			state = 2;
  
  			// Clear timeout if it exists
  			if ( timeoutTimer ) {
  				clearTimeout( timeoutTimer );
  			}
  
  			// Dereference transport for early garbage collection
  			// (no matter how long the jqXHR object will be used)
  			transport = undefined;
  
  			// Cache response headers
  			responseHeadersString = headers || "";
  
  			// Set readyState
  			jqXHR.readyState = status > 0 ? 4 : 0;
  
  			// Get response data
  			if ( responses ) {
  				response = ajaxHandleResponses( s, jqXHR, responses );
  			}
  
  			// If successful, handle type chaining
  			if ( status >= 200 && status < 300 || status === 304 ) {
  
  				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
  				if ( s.ifModified ) {
  
  					modified = jqXHR.getResponseHeader("Last-Modified");
  					if ( modified ) {
  						jQuery.lastModified[ ifModifiedKey ] = modified;
  					}
  					modified = jqXHR.getResponseHeader("Etag");
  					if ( modified ) {
  						jQuery.etag[ ifModifiedKey ] = modified;
  					}
  				}
  
  				// If not modified
  				if ( status === 304 ) {
  
  					statusText = "notmodified";
  					isSuccess = true;
  
  				// If we have data
  				} else {
  
  					isSuccess = ajaxConvert( s, response );
  					statusText = isSuccess.state;
  					success = isSuccess.data;
  					error = isSuccess.error;
  					isSuccess = !error;
  				}
  			} else {
  				// We extract error from statusText
  				// then normalize statusText and status for non-aborts
  				error = statusText;
  				if ( !statusText || status ) {
  					statusText = "error";
  					if ( status < 0 ) {
  						status = 0;
  					}
  				}
  			}
  
  			// Set data for the fake xhr object
  			jqXHR.status = status;
  			jqXHR.statusText = ( nativeStatusText || statusText ) + "";
  
  			// Success/Error
  			if ( isSuccess ) {
  				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
  			} else {
  				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
  			}
  
  			// Status-dependent callbacks
  			jqXHR.statusCode( statusCode );
  			statusCode = undefined;
  
  			if ( fireGlobals ) {
  				globalEventContext.trigger( "ajax" + ( isSuccess ? "Success" : "Error" ),
  						[ jqXHR, s, isSuccess ? success : error ] );
  			}
  
  			// Complete
  			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );
  
  			if ( fireGlobals ) {
  				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
  				// Handle the global AJAX counter
  				if ( !( --jQuery.active ) ) {
  					jQuery.event.trigger( "ajaxStop" );
  				}
  			}
  		}
  
  		// Attach deferreds
  		deferred.promise( jqXHR );
  		jqXHR.success = jqXHR.done;
  		jqXHR.error = jqXHR.fail;
  		jqXHR.complete = completeDeferred.add;
  
  		// Status-dependent callbacks
  		jqXHR.statusCode = function( map ) {
  			if ( map ) {
  				var tmp;
  				if ( state < 2 ) {
  					for ( tmp in map ) {
  						statusCode[ tmp ] = [ statusCode[tmp], map[tmp] ];
  					}
  				} else {
  					tmp = map[ jqXHR.status ];
  					jqXHR.always( tmp );
  				}
  			}
  			return this;
  		};
  
  		// Remove hash character (#7531: and string promotion)
  		// Add protocol if not provided (#5866: IE7 issue with protocol-less urls)
  		// We also use the url parameter if available
  		s.url = ( ( url || s.url ) + "" ).replace( rhash, "" ).replace( rprotocol, ajaxLocParts[ 1 ] + "//" );
  
  		// Extract dataTypes list
  		s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().split( core_rspace );
  
  		// A cross-domain request is in order when we have a protocol:host:port mismatch
  		if ( s.crossDomain == null ) {
  			parts = rurl.exec( s.url.toLowerCase() );
  			s.crossDomain = !!( parts &&
  				( parts[ 1 ] !== ajaxLocParts[ 1 ] || parts[ 2 ] !== ajaxLocParts[ 2 ] ||
  					( parts[ 3 ] || ( parts[ 1 ] === "http:" ? 80 : 443 ) ) !=
  						( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? 80 : 443 ) ) )
  			);
  		}
  
  		// Convert data if not already a string
  		if ( s.data && s.processData && typeof s.data !== "string" ) {
  			s.data = jQuery.param( s.data, s.traditional );
  		}
  
  		// Apply prefilters
  		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );
  
  		// If request was aborted inside a prefilter, stop there
  		if ( state === 2 ) {
  			return jqXHR;
  		}
  
  		// We can fire global events as of now if asked to
  		fireGlobals = s.global;
  
  		// Uppercase the type
  		s.type = s.type.toUpperCase();
  
  		// Determine if request has content
  		s.hasContent = !rnoContent.test( s.type );
  
  		// Watch for a new set of requests
  		if ( fireGlobals && jQuery.active++ === 0 ) {
  			jQuery.event.trigger( "ajaxStart" );
  		}
  
  		// More options handling for requests with no content
  		if ( !s.hasContent ) {
  
  			// If data is available, append data to url
  			if ( s.data ) {
  				s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.data;
  				// #9682: remove data so that it's not used in an eventual retry
  				delete s.data;
  			}
  
  			// Get ifModifiedKey before adding the anti-cache parameter
  			ifModifiedKey = s.url;
  
  			// Add anti-cache in url if needed
  			if ( s.cache === false ) {
  
  				var ts = jQuery.now(),
  					// try replacing _= if it is there
  					ret = s.url.replace( rts, "$1_=" + ts );
  
  				// if nothing was replaced, add timestamp to the end
  				s.url = ret + ( ( ret === s.url ) ? ( rquery.test( s.url ) ? "&" : "?" ) + "_=" + ts : "" );
  			}
  		}
  
  		// Set the correct header, if data is being sent
  		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
  			jqXHR.setRequestHeader( "Content-Type", s.contentType );
  		}
  
  		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
  		if ( s.ifModified ) {
  			ifModifiedKey = ifModifiedKey || s.url;
  			if ( jQuery.lastModified[ ifModifiedKey ] ) {
  				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ ifModifiedKey ] );
  			}
  			if ( jQuery.etag[ ifModifiedKey ] ) {
  				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ ifModifiedKey ] );
  			}
  		}
  
  		// Set the Accepts header for the server, depending on the dataType
  		jqXHR.setRequestHeader(
  			"Accept",
  			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[0] ] ?
  				s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
  				s.accepts[ "*" ]
  		);
  
  		// Check for headers option
  		for ( i in s.headers ) {
  			jqXHR.setRequestHeader( i, s.headers[ i ] );
  		}
  
  		// Allow custom headers/mimetypes and early abort
  		if ( s.beforeSend && ( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
  				// Abort if not done already and return
  				return jqXHR.abort();
  
  		}
  
  		// aborting is no longer a cancellation
  		strAbort = "abort";
  
  		// Install callbacks on deferreds
  		for ( i in { success: 1, error: 1, complete: 1 } ) {
  			jqXHR[ i ]( s[ i ] );
  		}
  
  		// Get transport
  		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );
  
  		// If no transport, we auto-abort
  		if ( !transport ) {
  			done( -1, "No Transport" );
  		} else {
  			jqXHR.readyState = 1;
  			// Send global event
  			if ( fireGlobals ) {
  				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
  			}
  			// Timeout
  			if ( s.async && s.timeout > 0 ) {
  				timeoutTimer = setTimeout( function(){
  					jqXHR.abort( "timeout" );
  				}, s.timeout );
  			}
  
  			try {
  				state = 1;
  				transport.send( requestHeaders, done );
  			} catch (e) {
  				// Propagate exception as error if not done
  				if ( state < 2 ) {
  					done( -1, e );
  				// Simply rethrow otherwise
  				} else {
  					throw e;
  				}
  			}
  		}
  
  		return jqXHR;
  	},
  
  	// Counter for holding the number of active queries
  	active: 0,
  
  	// Last-Modified header cache for next request
  	lastModified: {},
  	etag: {}
  
  });
  
  /* Handles responses to an ajax request:
   * - sets all responseXXX fields accordingly
   * - finds the right dataType (mediates between content-type and expected dataType)
   * - returns the corresponding response
   */
  function ajaxHandleResponses( s, jqXHR, responses ) {
  
  	var ct, type, finalDataType, firstDataType,
  		contents = s.contents,
  		dataTypes = s.dataTypes,
  		responseFields = s.responseFields;
  
  	// Fill responseXXX fields
  	for ( type in responseFields ) {
  		if ( type in responses ) {
  			jqXHR[ responseFields[type] ] = responses[ type ];
  		}
  	}
  
  	// Remove auto dataType and get content-type in the process
  	while( dataTypes[ 0 ] === "*" ) {
  		dataTypes.shift();
  		if ( ct === undefined ) {
  			ct = s.mimeType || jqXHR.getResponseHeader( "content-type" );
  		}
  	}
  
  	// Check if we're dealing with a known content-type
  	if ( ct ) {
  		for ( type in contents ) {
  			if ( contents[ type ] && contents[ type ].test( ct ) ) {
  				dataTypes.unshift( type );
  				break;
  			}
  		}
  	}
  
  	// Check to see if we have a response for the expected dataType
  	if ( dataTypes[ 0 ] in responses ) {
  		finalDataType = dataTypes[ 0 ];
  	} else {
  		// Try convertible dataTypes
  		for ( type in responses ) {
  			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
  				finalDataType = type;
  				break;
  			}
  			if ( !firstDataType ) {
  				firstDataType = type;
  			}
  		}
  		// Or just use first one
  		finalDataType = finalDataType || firstDataType;
  	}
  
  	// If we found a dataType
  	// We add the dataType to the list if needed
  	// and return the corresponding response
  	if ( finalDataType ) {
  		if ( finalDataType !== dataTypes[ 0 ] ) {
  			dataTypes.unshift( finalDataType );
  		}
  		return responses[ finalDataType ];
  	}
  }
  
  // Chain conversions given the request and the original response
  function ajaxConvert( s, response ) {
  
  	var conv, conv2, current, tmp,
  		// Work with a copy of dataTypes in case we need to modify it for conversion
  		dataTypes = s.dataTypes.slice(),
  		prev = dataTypes[ 0 ],
  		converters = {},
  		i = 0;
  
  	// Apply the dataFilter if provided
  	if ( s.dataFilter ) {
  		response = s.dataFilter( response, s.dataType );
  	}
  
  	// Create converters map with lowercased keys
  	if ( dataTypes[ 1 ] ) {
  		for ( conv in s.converters ) {
  			converters[ conv.toLowerCase() ] = s.converters[ conv ];
  		}
  	}
  
  	// Convert to each sequential dataType, tolerating list modification
  	for ( ; (current = dataTypes[++i]); ) {
  
  		// There's only work to do if current dataType is non-auto
  		if ( current !== "*" ) {
  
  			// Convert response if prev dataType is non-auto and differs from current
  			if ( prev !== "*" && prev !== current ) {
  
  				// Seek a direct converter
  				conv = converters[ prev + " " + current ] || converters[ "* " + current ];
  
  				// If none found, seek a pair
  				if ( !conv ) {
  					for ( conv2 in converters ) {
  
  						// If conv2 outputs current
  						tmp = conv2.split(" ");
  						if ( tmp[ 1 ] === current ) {
  
  							// If prev can be converted to accepted input
  							conv = converters[ prev + " " + tmp[ 0 ] ] ||
  								converters[ "* " + tmp[ 0 ] ];
  							if ( conv ) {
  								// Condense equivalence converters
  								if ( conv === true ) {
  									conv = converters[ conv2 ];
  
  								// Otherwise, insert the intermediate dataType
  								} else if ( converters[ conv2 ] !== true ) {
  									current = tmp[ 0 ];
  									dataTypes.splice( i--, 0, current );
  								}
  
  								break;
  							}
  						}
  					}
  				}
  
  				// Apply converter (if not an equivalence)
  				if ( conv !== true ) {
  
  					// Unless errors are allowed to bubble, catch and return them
  					if ( conv && s["throws"] ) {
  						response = conv( response );
  					} else {
  						try {
  							response = conv( response );
  						} catch ( e ) {
  							return { state: "parsererror", error: conv ? e : "No conversion from " + prev + " to " + current };
  						}
  					}
  				}
  			}
  
  			// Update prev for next iteration
  			prev = current;
  		}
  	}
  
  	return { state: "success", data: response };
  }
  var oldCallbacks = [],
  	rquestion = /\?/,
  	rjsonp = /(=)\?(?=&|$)|\?\?/,
  	nonce = jQuery.now();
  
  // Default jsonp settings
  jQuery.ajaxSetup({
  	jsonp: "callback",
  	jsonpCallback: function() {
  		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce++ ) );
  		this[ callback ] = true;
  		return callback;
  	}
  });
  
  // Detect, normalize options and install callbacks for jsonp requests
  jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {
  
  	var callbackName, overwritten, responseContainer,
  		data = s.data,
  		url = s.url,
  		hasCallback = s.jsonp !== false,
  		replaceInUrl = hasCallback && rjsonp.test( url ),
  		replaceInData = hasCallback && !replaceInUrl && typeof data === "string" &&
  			!( s.contentType || "" ).indexOf("application/x-www-form-urlencoded") &&
  			rjsonp.test( data );
  
  	// Handle iff the expected data type is "jsonp" or we have a parameter to set
  	if ( s.dataTypes[ 0 ] === "jsonp" || replaceInUrl || replaceInData ) {
  
  		// Get callback name, remembering preexisting value associated with it
  		callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
  			s.jsonpCallback() :
  			s.jsonpCallback;
  		overwritten = window[ callbackName ];
  
  		// Insert callback into url or form data
  		if ( replaceInUrl ) {
  			s.url = url.replace( rjsonp, "$1" + callbackName );
  		} else if ( replaceInData ) {
  			s.data = data.replace( rjsonp, "$1" + callbackName );
  		} else if ( hasCallback ) {
  			s.url += ( rquestion.test( url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
  		}
  
  		// Use data converter to retrieve json after script execution
  		s.converters["script json"] = function() {
  			if ( !responseContainer ) {
  				jQuery.error( callbackName + " was not called" );
  			}
  			return responseContainer[ 0 ];
  		};
  
  		// force json dataType
  		s.dataTypes[ 0 ] = "json";
  
  		// Install callback
  		window[ callbackName ] = function() {
  			responseContainer = arguments;
  		};
  
  		// Clean-up function (fires after converters)
  		jqXHR.always(function() {
  			// Restore preexisting value
  			window[ callbackName ] = overwritten;
  
  			// Save back as free
  			if ( s[ callbackName ] ) {
  				// make sure that re-using the options doesn't screw things around
  				s.jsonpCallback = originalSettings.jsonpCallback;
  
  				// save the callback name for future use
  				oldCallbacks.push( callbackName );
  			}
  
  			// Call if it was a function and we have a response
  			if ( responseContainer && jQuery.isFunction( overwritten ) ) {
  				overwritten( responseContainer[ 0 ] );
  			}
  
  			responseContainer = overwritten = undefined;
  		});
  
  		// Delegate to script
  		return "script";
  	}
  });
  // Install script dataType
  jQuery.ajaxSetup({
  	accepts: {
  		script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
  	},
  	contents: {
  		script: /javascript|ecmascript/
  	},
  	converters: {
  		"text script": function( text ) {
  			jQuery.globalEval( text );
  			return text;
  		}
  	}
  });
  
  // Handle cache's special case and global
  jQuery.ajaxPrefilter( "script", function( s ) {
  	if ( s.cache === undefined ) {
  		s.cache = false;
  	}
  	if ( s.crossDomain ) {
  		s.type = "GET";
  		s.global = false;
  	}
  });
  
  // Bind script tag hack transport
  jQuery.ajaxTransport( "script", function(s) {
  
  	// This transport only deals with cross domain requests
  	if ( s.crossDomain ) {
  
  		var script,
  			head = document.head || document.getElementsByTagName( "head" )[0] || document.documentElement;
  
  		return {
  
  			send: function( _, callback ) {
  
  				script = document.createElement( "script" );
  
  				script.async = "async";
  
  				if ( s.scriptCharset ) {
  					script.charset = s.scriptCharset;
  				}
  
  				script.src = s.url;
  
  				// Attach handlers for all browsers
  				script.onload = script.onreadystatechange = function( _, isAbort ) {
  
  					if ( isAbort || !script.readyState || /loaded|complete/.test( script.readyState ) ) {
  
  						// Handle memory leak in IE
  						script.onload = script.onreadystatechange = null;
  
  						// Remove the script
  						if ( head && script.parentNode ) {
  							head.removeChild( script );
  						}
  
  						// Dereference the script
  						script = undefined;
  
  						// Callback if not abort
  						if ( !isAbort ) {
  							callback( 200, "success" );
  						}
  					}
  				};
  				// Use insertBefore instead of appendChild  to circumvent an IE6 bug.
  				// This arises when a base node is used (#2709 and #4378).
  				head.insertBefore( script, head.firstChild );
  			},
  
  			abort: function() {
  				if ( script ) {
  					script.onload( 0, 1 );
  				}
  			}
  		};
  	}
  });
  var xhrCallbacks,
  	// #5280: Internet Explorer will keep connections alive if we don't abort on unload
  	xhrOnUnloadAbort = window.ActiveXObject ? function() {
  		// Abort all pending requests
  		for ( var key in xhrCallbacks ) {
  			xhrCallbacks[ key ]( 0, 1 );
  		}
  	} : false,
  	xhrId = 0;
  
  // Functions to create xhrs
  function createStandardXHR() {
  	try {
  		return new window.XMLHttpRequest();
  	} catch( e ) {}
  }
  
  function createActiveXHR() {
  	try {
  		return new window.ActiveXObject( "Microsoft.XMLHTTP" );
  	} catch( e ) {}
  }
  
  // Create the request object
  // (This is still attached to ajaxSettings for backward compatibility)
  jQuery.ajaxSettings.xhr = window.ActiveXObject ?
  	/* Microsoft failed to properly
  	 * implement the XMLHttpRequest in IE7 (can't request local files),
  	 * so we use the ActiveXObject when it is available
  	 * Additionally XMLHttpRequest can be disabled in IE7/IE8 so
  	 * we need a fallback.
  	 */
  	function() {
  		return !this.isLocal && createStandardXHR() || createActiveXHR();
  	} :
  	// For all other browsers, use the standard XMLHttpRequest object
  	createStandardXHR;
  
  // Determine support properties
  (function( xhr ) {
  	jQuery.extend( jQuery.support, {
  		ajax: !!xhr,
  		cors: !!xhr && ( "withCredentials" in xhr )
  	});
  })( jQuery.ajaxSettings.xhr() );
  
  // Create transport if the browser can provide an xhr
  if ( jQuery.support.ajax ) {
  
  	jQuery.ajaxTransport(function( s ) {
  		// Cross domain only allowed if supported through XMLHttpRequest
  		if ( !s.crossDomain || jQuery.support.cors ) {
  
  			var callback;
  
  			return {
  				send: function( headers, complete ) {
  
  					// Get a new xhr
  					var handle, i,
  						xhr = s.xhr();
  
  					// Open the socket
  					// Passing null username, generates a login popup on Opera (#2865)
  					if ( s.username ) {
  						xhr.open( s.type, s.url, s.async, s.username, s.password );
  					} else {
  						xhr.open( s.type, s.url, s.async );
  					}
  
  					// Apply custom fields if provided
  					if ( s.xhrFields ) {
  						for ( i in s.xhrFields ) {
  							xhr[ i ] = s.xhrFields[ i ];
  						}
  					}
  
  					// Override mime type if needed
  					if ( s.mimeType && xhr.overrideMimeType ) {
  						xhr.overrideMimeType( s.mimeType );
  					}
  
  					// X-Requested-With header
  					// For cross-domain requests, seeing as conditions for a preflight are
  					// akin to a jigsaw puzzle, we simply never set it to be sure.
  					// (it can always be set on a per-request basis or even using ajaxSetup)
  					// For same-domain requests, won't change header if already provided.
  					if ( !s.crossDomain && !headers["X-Requested-With"] ) {
  						headers[ "X-Requested-With" ] = "XMLHttpRequest";
  					}
  
  					// Need an extra try/catch for cross domain requests in Firefox 3
  					try {
  						for ( i in headers ) {
  							xhr.setRequestHeader( i, headers[ i ] );
  						}
  					} catch( _ ) {}
  
  					// Do send the request
  					// This may raise an exception which is actually
  					// handled in jQuery.ajax (so no try/catch here)
  					xhr.send( ( s.hasContent && s.data ) || null );
  
  					// Listener
  					callback = function( _, isAbort ) {
  
  						var status,
  							statusText,
  							responseHeaders,
  							responses,
  							xml;
  
  						// Firefox throws exceptions when accessing properties
  						// of an xhr when a network error occurred
  						// http://helpful.knobs-dials.com/index.php/Component_returned_failure_code:_0x80040111_(NS_ERROR_NOT_AVAILABLE)
  						try {
  
  							// Was never called and is aborted or complete
  							if ( callback && ( isAbort || xhr.readyState === 4 ) ) {
  
  								// Only called once
  								callback = undefined;
  
  								// Do not keep as active anymore
  								if ( handle ) {
  									xhr.onreadystatechange = jQuery.noop;
  									if ( xhrOnUnloadAbort ) {
  										delete xhrCallbacks[ handle ];
  									}
  								}
  
  								// If it's an abort
  								if ( isAbort ) {
  									// Abort it manually if needed
  									if ( xhr.readyState !== 4 ) {
  										xhr.abort();
  									}
  								} else {
  									status = xhr.status;
  									responseHeaders = xhr.getAllResponseHeaders();
  									responses = {};
  									xml = xhr.responseXML;
  
  									// Construct response list
  									if ( xml && xml.documentElement /* #4958 */ ) {
  										responses.xml = xml;
  									}
  
  									// When requesting binary data, IE6-9 will throw an exception
  									// on any attempt to access responseText (#11426)
  									try {
  										responses.text = xhr.responseText;
  									} catch( e ) {
  									}
  
  									// Firefox throws an exception when accessing
  									// statusText for faulty cross-domain requests
  									try {
  										statusText = xhr.statusText;
  									} catch( e ) {
  										// We normalize with Webkit giving an empty statusText
  										statusText = "";
  									}
  
  									// Filter status for non standard behaviors
  
  									// If the request is local and we have data: assume a success
  									// (success with no data won't get notified, that's the best we
  									// can do given current implementations)
  									if ( !status && s.isLocal && !s.crossDomain ) {
  										status = responses.text ? 200 : 404;
  									// IE - #1450: sometimes returns 1223 when it should be 204
  									} else if ( status === 1223 ) {
  										status = 204;
  									}
  								}
  							}
  						} catch( firefoxAccessException ) {
  							if ( !isAbort ) {
  								complete( -1, firefoxAccessException );
  							}
  						}
  
  						// Call complete if needed
  						if ( responses ) {
  							complete( status, statusText, responses, responseHeaders );
  						}
  					};
  
  					if ( !s.async ) {
  						// if we're in sync mode we fire the callback
  						callback();
  					} else if ( xhr.readyState === 4 ) {
  						// (IE6 & IE7) if it's in cache and has been
  						// retrieved directly we need to fire the callback
  						setTimeout( callback, 0 );
  					} else {
  						handle = ++xhrId;
  						if ( xhrOnUnloadAbort ) {
  							// Create the active xhrs callbacks list if needed
  							// and attach the unload handler
  							if ( !xhrCallbacks ) {
  								xhrCallbacks = {};
  								jQuery( window ).unload( xhrOnUnloadAbort );
  							}
  							// Add to list of active xhrs callbacks
  							xhrCallbacks[ handle ] = callback;
  						}
  						xhr.onreadystatechange = callback;
  					}
  				},
  
  				abort: function() {
  					if ( callback ) {
  						callback(0,1);
  					}
  				}
  			};
  		}
  	});
  }
  var fxNow, timerId,
  	rfxtypes = /^(?:toggle|show|hide)$/,
  	rfxnum = new RegExp( "^(?:([-+])=|)(" + core_pnum + ")([a-z%]*)$", "i" ),
  	rrun = /queueHooks$/,
  	animationPrefilters = [ defaultPrefilter ],
  	tweeners = {
  		"*": [function( prop, value ) {
  			var end, unit,
  				tween = this.createTween( prop, value ),
  				parts = rfxnum.exec( value ),
  				target = tween.cur(),
  				start = +target || 0,
  				scale = 1,
  				maxIterations = 20;
  
  			if ( parts ) {
  				end = +parts[2];
  				unit = parts[3] || ( jQuery.cssNumber[ prop ] ? "" : "px" );
  
  				// We need to compute starting value
  				if ( unit !== "px" && start ) {
  					// Iteratively approximate from a nonzero starting point
  					// Prefer the current property, because this process will be trivial if it uses the same units
  					// Fallback to end or a simple constant
  					start = jQuery.css( tween.elem, prop, true ) || end || 1;
  
  					do {
  						// If previous iteration zeroed out, double until we get *something*
  						// Use a string for doubling factor so we don't accidentally see scale as unchanged below
  						scale = scale || ".5";
  
  						// Adjust and apply
  						start = start / scale;
  						jQuery.style( tween.elem, prop, start + unit );
  
  					// Update scale, tolerating zero or NaN from tween.cur()
  					// And breaking the loop if scale is unchanged or perfect, or if we've just had enough
  					} while ( scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations );
  				}
  
  				tween.unit = unit;
  				tween.start = start;
  				// If a +=/-= token was provided, we're doing a relative animation
  				tween.end = parts[1] ? start + ( parts[1] + 1 ) * end : end;
  			}
  			return tween;
  		}]
  	};
  
  // Animations created synchronously will run synchronously
  function createFxNow() {
  	setTimeout(function() {
  		fxNow = undefined;
  	}, 0 );
  	return ( fxNow = jQuery.now() );
  }
  
  function createTweens( animation, props ) {
  	jQuery.each( props, function( prop, value ) {
  		var collection = ( tweeners[ prop ] || [] ).concat( tweeners[ "*" ] ),
  			index = 0,
  			length = collection.length;
  		for ( ; index < length; index++ ) {
  			if ( collection[ index ].call( animation, prop, value ) ) {
  
  				// we're done with this property
  				return;
  			}
  		}
  	});
  }
  
  function Animation( elem, properties, options ) {
  	var result,
  		index = 0,
  		tweenerIndex = 0,
  		length = animationPrefilters.length,
  		deferred = jQuery.Deferred().always( function() {
  			// don't match elem in the :animated selector
  			delete tick.elem;
  		}),
  		tick = function() {
  			var currentTime = fxNow || createFxNow(),
  				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),
  				// archaic crash bug won't allow us to use 1 - ( 0.5 || 0 ) (#12497)
  				temp = remaining / animation.duration || 0,
  				percent = 1 - temp,
  				index = 0,
  				length = animation.tweens.length;
  
  			for ( ; index < length ; index++ ) {
  				animation.tweens[ index ].run( percent );
  			}
  
  			deferred.notifyWith( elem, [ animation, percent, remaining ]);
  
  			if ( percent < 1 && length ) {
  				return remaining;
  			} else {
  				deferred.resolveWith( elem, [ animation ] );
  				return false;
  			}
  		},
  		animation = deferred.promise({
  			elem: elem,
  			props: jQuery.extend( {}, properties ),
  			opts: jQuery.extend( true, { specialEasing: {} }, options ),
  			originalProperties: properties,
  			originalOptions: options,
  			startTime: fxNow || createFxNow(),
  			duration: options.duration,
  			tweens: [],
  			createTween: function( prop, end, easing ) {
  				var tween = jQuery.Tween( elem, animation.opts, prop, end,
  						animation.opts.specialEasing[ prop ] || animation.opts.easing );
  				animation.tweens.push( tween );
  				return tween;
  			},
  			stop: function( gotoEnd ) {
  				var index = 0,
  					// if we are going to the end, we want to run all the tweens
  					// otherwise we skip this part
  					length = gotoEnd ? animation.tweens.length : 0;
  
  				for ( ; index < length ; index++ ) {
  					animation.tweens[ index ].run( 1 );
  				}
  
  				// resolve when we played the last frame
  				// otherwise, reject
  				if ( gotoEnd ) {
  					deferred.resolveWith( elem, [ animation, gotoEnd ] );
  				} else {
  					deferred.rejectWith( elem, [ animation, gotoEnd ] );
  				}
  				return this;
  			}
  		}),
  		props = animation.props;
  
  	propFilter( props, animation.opts.specialEasing );
  
  	for ( ; index < length ; index++ ) {
  		result = animationPrefilters[ index ].call( animation, elem, props, animation.opts );
  		if ( result ) {
  			return result;
  		}
  	}
  
  	createTweens( animation, props );
  
  	if ( jQuery.isFunction( animation.opts.start ) ) {
  		animation.opts.start.call( elem, animation );
  	}
  
  	jQuery.fx.timer(
  		jQuery.extend( tick, {
  			anim: animation,
  			queue: animation.opts.queue,
  			elem: elem
  		})
  	);
  
  	// attach callbacks from options
  	return animation.progress( animation.opts.progress )
  		.done( animation.opts.done, animation.opts.complete )
  		.fail( animation.opts.fail )
  		.always( animation.opts.always );
  }
  
  function propFilter( props, specialEasing ) {
  	var index, name, easing, value, hooks;
  
  	// camelCase, specialEasing and expand cssHook pass
  	for ( index in props ) {
  		name = jQuery.camelCase( index );
  		easing = specialEasing[ name ];
  		value = props[ index ];
  		if ( jQuery.isArray( value ) ) {
  			easing = value[ 1 ];
  			value = props[ index ] = value[ 0 ];
  		}
  
  		if ( index !== name ) {
  			props[ name ] = value;
  			delete props[ index ];
  		}
  
  		hooks = jQuery.cssHooks[ name ];
  		if ( hooks && "expand" in hooks ) {
  			value = hooks.expand( value );
  			delete props[ name ];
  
  			// not quite $.extend, this wont overwrite keys already present.
  			// also - reusing 'index' from above because we have the correct "name"
  			for ( index in value ) {
  				if ( !( index in props ) ) {
  					props[ index ] = value[ index ];
  					specialEasing[ index ] = easing;
  				}
  			}
  		} else {
  			specialEasing[ name ] = easing;
  		}
  	}
  }
  
  jQuery.Animation = jQuery.extend( Animation, {
  
  	tweener: function( props, callback ) {
  		if ( jQuery.isFunction( props ) ) {
  			callback = props;
  			props = [ "*" ];
  		} else {
  			props = props.split(" ");
  		}
  
  		var prop,
  			index = 0,
  			length = props.length;
  
  		for ( ; index < length ; index++ ) {
  			prop = props[ index ];
  			tweeners[ prop ] = tweeners[ prop ] || [];
  			tweeners[ prop ].unshift( callback );
  		}
  	},
  
  	prefilter: function( callback, prepend ) {
  		if ( prepend ) {
  			animationPrefilters.unshift( callback );
  		} else {
  			animationPrefilters.push( callback );
  		}
  	}
  });
  
  function defaultPrefilter( elem, props, opts ) {
  	var index, prop, value, length, dataShow, toggle, tween, hooks, oldfire,
  		anim = this,
  		style = elem.style,
  		orig = {},
  		handled = [],
  		hidden = elem.nodeType && isHidden( elem );
  
  	// handle queue: false promises
  	if ( !opts.queue ) {
  		hooks = jQuery._queueHooks( elem, "fx" );
  		if ( hooks.unqueued == null ) {
  			hooks.unqueued = 0;
  			oldfire = hooks.empty.fire;
  			hooks.empty.fire = function() {
  				if ( !hooks.unqueued ) {
  					oldfire();
  				}
  			};
  		}
  		hooks.unqueued++;
  
  		anim.always(function() {
  			// doing this makes sure that the complete handler will be called
  			// before this completes
  			anim.always(function() {
  				hooks.unqueued--;
  				if ( !jQuery.queue( elem, "fx" ).length ) {
  					hooks.empty.fire();
  				}
  			});
  		});
  	}
  
  	// height/width overflow pass
  	if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {
  		// Make sure that nothing sneaks out
  		// Record all 3 overflow attributes because IE does not
  		// change the overflow attribute when overflowX and
  		// overflowY are set to the same value
  		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];
  
  		// Set display property to inline-block for height/width
  		// animations on inline elements that are having width/height animated
  		if ( jQuery.css( elem, "display" ) === "inline" &&
  				jQuery.css( elem, "float" ) === "none" ) {
  
  			// inline-level elements accept inline-block;
  			// block-level elements need to be inline with layout
  			if ( !jQuery.support.inlineBlockNeedsLayout || css_defaultDisplay( elem.nodeName ) === "inline" ) {
  				style.display = "inline-block";
  
  			} else {
  				style.zoom = 1;
  			}
  		}
  	}
  
  	if ( opts.overflow ) {
  		style.overflow = "hidden";
  		if ( !jQuery.support.shrinkWrapBlocks ) {
  			anim.done(function() {
  				style.overflow = opts.overflow[ 0 ];
  				style.overflowX = opts.overflow[ 1 ];
  				style.overflowY = opts.overflow[ 2 ];
  			});
  		}
  	}
  
  
  	// show/hide pass
  	for ( index in props ) {
  		value = props[ index ];
  		if ( rfxtypes.exec( value ) ) {
  			delete props[ index ];
  			toggle = toggle || value === "toggle";
  			if ( value === ( hidden ? "hide" : "show" ) ) {
  				continue;
  			}
  			handled.push( index );
  		}
  	}
  
  	length = handled.length;
  	if ( length ) {
  		dataShow = jQuery._data( elem, "fxshow" ) || jQuery._data( elem, "fxshow", {} );
  		if ( "hidden" in dataShow ) {
  			hidden = dataShow.hidden;
  		}
  
  		// store state if its toggle - enables .stop().toggle() to "reverse"
  		if ( toggle ) {
  			dataShow.hidden = !hidden;
  		}
  		if ( hidden ) {
  			jQuery( elem ).show();
  		} else {
  			anim.done(function() {
  				jQuery( elem ).hide();
  			});
  		}
  		anim.done(function() {
  			var prop;
  			jQuery.removeData( elem, "fxshow", true );
  			for ( prop in orig ) {
  				jQuery.style( elem, prop, orig[ prop ] );
  			}
  		});
  		for ( index = 0 ; index < length ; index++ ) {
  			prop = handled[ index ];
  			tween = anim.createTween( prop, hidden ? dataShow[ prop ] : 0 );
  			orig[ prop ] = dataShow[ prop ] || jQuery.style( elem, prop );
  
  			if ( !( prop in dataShow ) ) {
  				dataShow[ prop ] = tween.start;
  				if ( hidden ) {
  					tween.end = tween.start;
  					tween.start = prop === "width" || prop === "height" ? 1 : 0;
  				}
  			}
  		}
  	}
  }
  
  function Tween( elem, options, prop, end, easing ) {
  	return new Tween.prototype.init( elem, options, prop, end, easing );
  }
  jQuery.Tween = Tween;
  
  Tween.prototype = {
  	constructor: Tween,
  	init: function( elem, options, prop, end, easing, unit ) {
  		this.elem = elem;
  		this.prop = prop;
  		this.easing = easing || "swing";
  		this.options = options;
  		this.start = this.now = this.cur();
  		this.end = end;
  		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
  	},
  	cur: function() {
  		var hooks = Tween.propHooks[ this.prop ];
  
  		return hooks && hooks.get ?
  			hooks.get( this ) :
  			Tween.propHooks._default.get( this );
  	},
  	run: function( percent ) {
  		var eased,
  			hooks = Tween.propHooks[ this.prop ];
  
  		if ( this.options.duration ) {
  			this.pos = eased = jQuery.easing[ this.easing ](
  				percent, this.options.duration * percent, 0, 1, this.options.duration
  			);
  		} else {
  			this.pos = eased = percent;
  		}
  		this.now = ( this.end - this.start ) * eased + this.start;
  
  		if ( this.options.step ) {
  			this.options.step.call( this.elem, this.now, this );
  		}
  
  		if ( hooks && hooks.set ) {
  			hooks.set( this );
  		} else {
  			Tween.propHooks._default.set( this );
  		}
  		return this;
  	}
  };
  
  Tween.prototype.init.prototype = Tween.prototype;
  
  Tween.propHooks = {
  	_default: {
  		get: function( tween ) {
  			var result;
  
  			if ( tween.elem[ tween.prop ] != null &&
  				(!tween.elem.style || tween.elem.style[ tween.prop ] == null) ) {
  				return tween.elem[ tween.prop ];
  			}
  
  			// passing any value as a 4th parameter to .css will automatically
  			// attempt a parseFloat and fallback to a string if the parse fails
  			// so, simple values such as "10px" are parsed to Float.
  			// complex values such as "rotate(1rad)" are returned as is.
  			result = jQuery.css( tween.elem, tween.prop, false, "" );
  			// Empty strings, null, undefined and "auto" are converted to 0.
  			return !result || result === "auto" ? 0 : result;
  		},
  		set: function( tween ) {
  			// use step hook for back compat - use cssHook if its there - use .style if its
  			// available and use plain properties where available
  			if ( jQuery.fx.step[ tween.prop ] ) {
  				jQuery.fx.step[ tween.prop ]( tween );
  			} else if ( tween.elem.style && ( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null || jQuery.cssHooks[ tween.prop ] ) ) {
  				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
  			} else {
  				tween.elem[ tween.prop ] = tween.now;
  			}
  		}
  	}
  };
  
  // Remove in 2.0 - this supports IE8's panic based approach
  // to setting things on disconnected nodes
  
  Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
  	set: function( tween ) {
  		if ( tween.elem.nodeType && tween.elem.parentNode ) {
  			tween.elem[ tween.prop ] = tween.now;
  		}
  	}
  };
  
  jQuery.each([ "toggle", "show", "hide" ], function( i, name ) {
  	var cssFn = jQuery.fn[ name ];
  	jQuery.fn[ name ] = function( speed, easing, callback ) {
  		return speed == null || typeof speed === "boolean" ||
  			// special check for .toggle( handler, handler, ... )
  			( !i && jQuery.isFunction( speed ) && jQuery.isFunction( easing ) ) ?
  			cssFn.apply( this, arguments ) :
  			this.animate( genFx( name, true ), speed, easing, callback );
  	};
  });
  
  jQuery.fn.extend({
  	fadeTo: function( speed, to, easing, callback ) {
  
  		// show any hidden elements after setting opacity to 0
  		return this.filter( isHidden ).css( "opacity", 0 ).show()
  
  			// animate to the value specified
  			.end().animate({ opacity: to }, speed, easing, callback );
  	},
  	animate: function( prop, speed, easing, callback ) {
  		var empty = jQuery.isEmptyObject( prop ),
  			optall = jQuery.speed( speed, easing, callback ),
  			doAnimation = function() {
  				// Operate on a copy of prop so per-property easing won't be lost
  				var anim = Animation( this, jQuery.extend( {}, prop ), optall );
  
  				// Empty animations resolve immediately
  				if ( empty ) {
  					anim.stop( true );
  				}
  			};
  
  		return empty || optall.queue === false ?
  			this.each( doAnimation ) :
  			this.queue( optall.queue, doAnimation );
  	},
  	stop: function( type, clearQueue, gotoEnd ) {
  		var stopQueue = function( hooks ) {
  			var stop = hooks.stop;
  			delete hooks.stop;
  			stop( gotoEnd );
  		};
  
  		if ( typeof type !== "string" ) {
  			gotoEnd = clearQueue;
  			clearQueue = type;
  			type = undefined;
  		}
  		if ( clearQueue && type !== false ) {
  			this.queue( type || "fx", [] );
  		}
  
  		return this.each(function() {
  			var dequeue = true,
  				index = type != null && type + "queueHooks",
  				timers = jQuery.timers,
  				data = jQuery._data( this );
  
  			if ( index ) {
  				if ( data[ index ] && data[ index ].stop ) {
  					stopQueue( data[ index ] );
  				}
  			} else {
  				for ( index in data ) {
  					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
  						stopQueue( data[ index ] );
  					}
  				}
  			}
  
  			for ( index = timers.length; index--; ) {
  				if ( timers[ index ].elem === this && (type == null || timers[ index ].queue === type) ) {
  					timers[ index ].anim.stop( gotoEnd );
  					dequeue = false;
  					timers.splice( index, 1 );
  				}
  			}
  
  			// start the next in the queue if the last step wasn't forced
  			// timers currently will call their complete callbacks, which will dequeue
  			// but only if they were gotoEnd
  			if ( dequeue || !gotoEnd ) {
  				jQuery.dequeue( this, type );
  			}
  		});
  	}
  });
  
  // Generate parameters to create a standard animation
  function genFx( type, includeWidth ) {
  	var which,
  		attrs = { height: type },
  		i = 0;
  
  	// if we include width, step value is 1 to do all cssExpand values,
  	// if we don't include width, step value is 2 to skip over Left and Right
  	includeWidth = includeWidth? 1 : 0;
  	for( ; i < 4 ; i += 2 - includeWidth ) {
  		which = cssExpand[ i ];
  		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
  	}
  
  	if ( includeWidth ) {
  		attrs.opacity = attrs.width = type;
  	}
  
  	return attrs;
  }
  
  // Generate shortcuts for custom animations
  jQuery.each({
  	slideDown: genFx("show"),
  	slideUp: genFx("hide"),
  	slideToggle: genFx("toggle"),
  	fadeIn: { opacity: "show" },
  	fadeOut: { opacity: "hide" },
  	fadeToggle: { opacity: "toggle" }
  }, function( name, props ) {
  	jQuery.fn[ name ] = function( speed, easing, callback ) {
  		return this.animate( props, speed, easing, callback );
  	};
  });
  
  jQuery.speed = function( speed, easing, fn ) {
  	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
  		complete: fn || !fn && easing ||
  			jQuery.isFunction( speed ) && speed,
  		duration: speed,
  		easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
  	};
  
  	opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
  		opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;
  
  	// normalize opt.queue - true/undefined/null -> "fx"
  	if ( opt.queue == null || opt.queue === true ) {
  		opt.queue = "fx";
  	}
  
  	// Queueing
  	opt.old = opt.complete;
  
  	opt.complete = function() {
  		if ( jQuery.isFunction( opt.old ) ) {
  			opt.old.call( this );
  		}
  
  		if ( opt.queue ) {
  			jQuery.dequeue( this, opt.queue );
  		}
  	};
  
  	return opt;
  };
  
  jQuery.easing = {
  	linear: function( p ) {
  		return p;
  	},
  	swing: function( p ) {
  		return 0.5 - Math.cos( p*Math.PI ) / 2;
  	}
  };
  
  jQuery.timers = [];
  jQuery.fx = Tween.prototype.init;
  jQuery.fx.tick = function() {
  	var timer,
  		timers = jQuery.timers,
  		i = 0;
  
  	fxNow = jQuery.now();
  
  	for ( ; i < timers.length; i++ ) {
  		timer = timers[ i ];
  		// Checks the timer has not already been removed
  		if ( !timer() && timers[ i ] === timer ) {
  			timers.splice( i--, 1 );
  		}
  	}
  
  	if ( !timers.length ) {
  		jQuery.fx.stop();
  	}
  	fxNow = undefined;
  };
  
  jQuery.fx.timer = function( timer ) {
  	if ( timer() && jQuery.timers.push( timer ) && !timerId ) {
  		timerId = setInterval( jQuery.fx.tick, jQuery.fx.interval );
  	}
  };
  
  jQuery.fx.interval = 13;
  
  jQuery.fx.stop = function() {
  	clearInterval( timerId );
  	timerId = null;
  };
  
  jQuery.fx.speeds = {
  	slow: 600,
  	fast: 200,
  	// Default speed
  	_default: 400
  };
  
  // Back Compat <1.8 extension point
  jQuery.fx.step = {};
  
  if ( jQuery.expr && jQuery.expr.filters ) {
  	jQuery.expr.filters.animated = function( elem ) {
  		return jQuery.grep(jQuery.timers, function( fn ) {
  			return elem === fn.elem;
  		}).length;
  	};
  }
  var rroot = /^(?:body|html)$/i;
  
  jQuery.fn.offset = function( options ) {
  	if ( arguments.length ) {
  		return options === undefined ?
  			this :
  			this.each(function( i ) {
  				jQuery.offset.setOffset( this, options, i );
  			});
  	}
  
  	var docElem, body, win, clientTop, clientLeft, scrollTop, scrollLeft,
  		box = { top: 0, left: 0 },
  		elem = this[ 0 ],
  		doc = elem && elem.ownerDocument;
  
  	if ( !doc ) {
  		return;
  	}
  
  	if ( (body = doc.body) === elem ) {
  		return jQuery.offset.bodyOffset( elem );
  	}
  
  	docElem = doc.documentElement;
  
  	// Make sure it's not a disconnected DOM node
  	if ( !jQuery.contains( docElem, elem ) ) {
  		return box;
  	}
  
  	// If we don't have gBCR, just use 0,0 rather than error
  	// BlackBerry 5, iOS 3 (original iPhone)
  	if ( typeof elem.getBoundingClientRect !== "undefined" ) {
  		box = elem.getBoundingClientRect();
  	}
  	win = getWindow( doc );
  	clientTop  = docElem.clientTop  || body.clientTop  || 0;
  	clientLeft = docElem.clientLeft || body.clientLeft || 0;
  	scrollTop  = win.pageYOffset || docElem.scrollTop;
  	scrollLeft = win.pageXOffset || docElem.scrollLeft;
  	return {
  		top: box.top  + scrollTop  - clientTop,
  		left: box.left + scrollLeft - clientLeft
  	};
  };
  
  jQuery.offset = {
  
  	bodyOffset: function( body ) {
  		var top = body.offsetTop,
  			left = body.offsetLeft;
  
  		if ( jQuery.support.doesNotIncludeMarginInBodyOffset ) {
  			top  += parseFloat( jQuery.css(body, "marginTop") ) || 0;
  			left += parseFloat( jQuery.css(body, "marginLeft") ) || 0;
  		}
  
  		return { top: top, left: left };
  	},
  
  	setOffset: function( elem, options, i ) {
  		var position = jQuery.css( elem, "position" );
  
  		// set position first, in-case top/left are set even on static elem
  		if ( position === "static" ) {
  			elem.style.position = "relative";
  		}
  
  		var curElem = jQuery( elem ),
  			curOffset = curElem.offset(),
  			curCSSTop = jQuery.css( elem, "top" ),
  			curCSSLeft = jQuery.css( elem, "left" ),
  			calculatePosition = ( position === "absolute" || position === "fixed" ) && jQuery.inArray("auto", [curCSSTop, curCSSLeft]) > -1,
  			props = {}, curPosition = {}, curTop, curLeft;
  
  		// need to be able to calculate position if either top or left is auto and position is either absolute or fixed
  		if ( calculatePosition ) {
  			curPosition = curElem.position();
  			curTop = curPosition.top;
  			curLeft = curPosition.left;
  		} else {
  			curTop = parseFloat( curCSSTop ) || 0;
  			curLeft = parseFloat( curCSSLeft ) || 0;
  		}
  
  		if ( jQuery.isFunction( options ) ) {
  			options = options.call( elem, i, curOffset );
  		}
  
  		if ( options.top != null ) {
  			props.top = ( options.top - curOffset.top ) + curTop;
  		}
  		if ( options.left != null ) {
  			props.left = ( options.left - curOffset.left ) + curLeft;
  		}
  
  		if ( "using" in options ) {
  			options.using.call( elem, props );
  		} else {
  			curElem.css( props );
  		}
  	}
  };
  
  
  jQuery.fn.extend({
  
  	position: function() {
  		if ( !this[0] ) {
  			return;
  		}
  
  		var elem = this[0],
  
  		// Get *real* offsetParent
  		offsetParent = this.offsetParent(),
  
  		// Get correct offsets
  		offset       = this.offset(),
  		parentOffset = rroot.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset();
  
  		// Subtract element margins
  		// note: when an element has margin: auto the offsetLeft and marginLeft
  		// are the same in Safari causing offset.left to incorrectly be 0
  		offset.top  -= parseFloat( jQuery.css(elem, "marginTop") ) || 0;
  		offset.left -= parseFloat( jQuery.css(elem, "marginLeft") ) || 0;
  
  		// Add offsetParent borders
  		parentOffset.top  += parseFloat( jQuery.css(offsetParent[0], "borderTopWidth") ) || 0;
  		parentOffset.left += parseFloat( jQuery.css(offsetParent[0], "borderLeftWidth") ) || 0;
  
  		// Subtract the two offsets
  		return {
  			top:  offset.top  - parentOffset.top,
  			left: offset.left - parentOffset.left
  		};
  	},
  
  	offsetParent: function() {
  		return this.map(function() {
  			var offsetParent = this.offsetParent || document.body;
  			while ( offsetParent && (!rroot.test(offsetParent.nodeName) && jQuery.css(offsetParent, "position") === "static") ) {
  				offsetParent = offsetParent.offsetParent;
  			}
  			return offsetParent || document.body;
  		});
  	}
  });
  
  
  // Create scrollLeft and scrollTop methods
  jQuery.each( {scrollLeft: "pageXOffset", scrollTop: "pageYOffset"}, function( method, prop ) {
  	var top = /Y/.test( prop );
  
  	jQuery.fn[ method ] = function( val ) {
  		return jQuery.access( this, function( elem, method, val ) {
  			var win = getWindow( elem );
  
  			if ( val === undefined ) {
  				return win ? (prop in win) ? win[ prop ] :
  					win.document.documentElement[ method ] :
  					elem[ method ];
  			}
  
  			if ( win ) {
  				win.scrollTo(
  					!top ? val : jQuery( win ).scrollLeft(),
  					 top ? val : jQuery( win ).scrollTop()
  				);
  
  			} else {
  				elem[ method ] = val;
  			}
  		}, method, val, arguments.length, null );
  	};
  });
  
  function getWindow( elem ) {
  	return jQuery.isWindow( elem ) ?
  		elem :
  		elem.nodeType === 9 ?
  			elem.defaultView || elem.parentWindow :
  			false;
  }
  // Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
  jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
  	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name }, function( defaultExtra, funcName ) {
  		// margin is only for outerHeight, outerWidth
  		jQuery.fn[ funcName ] = function( margin, value ) {
  			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
  				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );
  
  			return jQuery.access( this, function( elem, type, value ) {
  				var doc;
  
  				if ( jQuery.isWindow( elem ) ) {
  					// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
  					// isn't a whole lot we can do. See pull request at this URL for discussion:
  					// https://github.com/jquery/jquery/pull/764
  					return elem.document.documentElement[ "client" + name ];
  				}
  
  				// Get document width or height
  				if ( elem.nodeType === 9 ) {
  					doc = elem.documentElement;
  
  					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height], whichever is greatest
  					// unfortunately, this causes bug #3838 in IE6/8 only, but there is currently no good, small way to fix it.
  					return Math.max(
  						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
  						elem.body[ "offset" + name ], doc[ "offset" + name ],
  						doc[ "client" + name ]
  					);
  				}
  
  				return value === undefined ?
  					// Get width or height on the element, requesting but not forcing parseFloat
  					jQuery.css( elem, type, value, extra ) :
  
  					// Set width or height on the element
  					jQuery.style( elem, type, value, extra );
  			}, type, chainable ? margin : undefined, chainable, null );
  		};
  	});
  });
  // Expose jQuery to the global object
  window.jQuery = window.$ = jQuery;
  
  // Expose jQuery as an AMD module, but only for AMD loaders that
  // understand the issues with loading multiple versions of jQuery
  // in a page that all might call define(). The loader will indicate
  // they have special allowances for multiple jQuery versions by
  // specifying define.amd.jQuery = true. Register as a named module,
  // since jQuery can be concatenated with other files that may use define,
  // but not use a proper concatenation script that understands anonymous
  // AMD modules. A named AMD is safest and most robust way to register.
  // Lowercase jquery is used because AMD module names are derived from
  // file names, and jQuery is normally delivered in a lowercase file name.
  // Do this after creating the global so that if an AMD module wants to call
  // noConflict to hide this version of jQuery, it will work.
  if ( typeof define === "function" && define.amd && define.amd.jQuery ) {
  	define( "jquery", [], function () { return jQuery; } );
  }
  
  })( window );
  
  
    window.jQuery.noConflict();
    return window.jQuery;
  }
  module.exports = create('undefined' === typeof window ? undefined : window);
  module.exports.create = create;
  }());
  

  provide("jquery", module.exports);

  $.ender(module.exports);

}());
/**
 * Cinder v0.4.1
 * A lightweight masonry plugin with serious flexibility
 * http://cinder.aleph-1.com/
 *
 * Licensed under the MIT license
 * Copyright 2013-2019 Daniel Barber
 */

( function(){

	"use strict";

	// to store Cinder instances
	var instances = [];
	var requiresRepaint;
	var timeout;
	var defaults = {
			columns: 3, // (int) total number of columns or (string: #px) maximum column width
			gap: 4, // (int) number of pixels between columns
			ratio: null, // (number) width to height ratio, only to be used if each element is a consistent ratio
			filter: '*', // (string) selector in terms of which elements to show/hide
			animation: 'css', // (string) css or (function) RAF callback to apply styles manually
			onFirstLayout: null, // (function) callback after first layout of instance
			onLayout: null, // (function) callback after layout of instance
			onDestroy: null, // (function) callback when instance is destroyed
			layout: 'default', // (string) layout name or (object) { name: (string), opts: (object) },
			resize: true
		};
	var props = keys( defaults ); // array of acceptable prop names
	var assign = Object.assign || shallowCopyObjProps;
	var transform = 'transform';
	var transforms = ',-o-,-moz-,-ms-,-webkit-'.split( ',' );
	var div = document.createElement( 'div' );
	var hasClassList = 'classList' in div;
	var has3D;
	var layouts = {};
	
	// Create a safe reference to the lib object for use below.
	function Cinder( element, options )
	{
		//console.log( 'Cinder()' );
		if( element.length )
		{
			element = element[ 0 ];
			if( element.length > 1 ) return false;
		}
		var instance = new CinderInstance( element, options );
		instances.push( instance );
		return instance;
	};

	// Current version
	Cinder.VERSION = '0.4.1';

	Cinder.registerLayout = function( name, fn, options )
	{
		layouts[ name ] = {
			fn: fn,
			options: options
		}
	}

	Cinder.registerLayout( 'default', function( instance, containerWidth, containerHeight, options )
		{
			//console.log( 'defaultLayout()' );
			//console.log( instance );
			//console.log( containerWidth );
			//console.log( containerHeight );
			//console.log( options );
			var fixedRatio = /^\d+\.?\d+?$/.test( instance.ratio ) ? instance.ratio - 0 : null;
			var columnXs = [];
			var columnYs = [];
			var columnWidths = [];
			var columnItems = [];
			var gapTotal;
			var remainder = 0;
			var columnInfo = /^(\d+\.?\d*?)(px|%)?$/.exec( instance.columns );
			var columnValue = columnInfo[ 1 ] - 0;
			var columnUnit = columnInfo[ 2 ];
			var columnWidth = 1;

			// if column has unit (px for now, *** maybe support %)

			if( columnUnit )
			{
				while( columnWidth * columnValue + ( gap * ( columnWidth - 1 ) ) < containerHeight )
				{
					columnWidth++;
				}
				columnValue = columnWidth;
			}
			
			columnWidth = ( containerWidth - gap * ( columnValue - 1 ) ) / columnValue;

			// *** deal with rounding
			// *** deal with remainders

			// fill column info (x, y, items)
			var columnCount = 0;
			var xPos = 0;
			while( columnCount < columnValue )
			{
				columnXs[ columnCount ] = xPos;
				columnYs[ columnCount ] = 0;
				columnItems[ columnCount ] = [];
				columnWidths[ columnCount ] = columnWidth + ( columns - columnCount < remainder ? 1 : 0 );
				xPos += columnWidths[ columnCount ] + instance.gap;
				columnCount++;
			}

			addClass( instance.element, 'cinder-static' );

			// sort children into columns
			for( var i = 0; i < instance.element.children.length; i++ )
			{
				var element = instance.element.children[ i ],
					ratio = element.getAttribute( 'data-cinder-ratio' );
				if( !ratio )
				{
					if( element.clientWidth && element.clientHeight )
					{
						ratio = element.clientWidth / element.clientHeight;
						element.setAttribute( 'data-cinder-ratio', ratio );
					}
					else
					{
						ratio = fixedRatio;
					}
				}

				var column = columnYs.indexOf( Math.min.apply( Math, columnYs ) ),
					currentStyle = window.getComputedStyle( element ),
					newWidth = ( columnWidths[ column ] - parseInt( currentStyle.paddingLeft ) - parseInt( currentStyle.paddingRight ) ) + 'px',
					newHeight = ratio ? Math.round( columnWidth * 1 / ratio ) + 'px' : null,
					//tH = nH,
					style = {
						width: newWidth,
						height: newHeight || 'auto'
					};
				columnItems[ column ].push( element );
				// if a new height isn't available, do the expensive calculation...
				if( !newHeight )
				{
					// get the old style
					var oStyle = shallowCopyObjProps( {}, style );

					// *** make element static, do we need this?
					//addClass( element, 'cinder-static' );
					// apply temporaty style
					applyStyle( element, style );

					// get height with new style
					style.height = window.getComputedStyle( element ).height;
					
					// get element's height (including padding and border)
					newHeight = parseInt( element.offsetHeight );
					
					// only revert the style if we aren't using CSS animations
					applyStyle( element, oStyle );
				}

				setData( element, {
					left: columnXs[ column ] + 'px',
					top: columnYs[ column ] + 'px',
					width: style.width,
					height: style.height,
					column: column
				}, 'cinder-' );

				///console.log( '----------' );
				columnYs[ column ] += parseFloat( newHeight ) + instance.gap;
			}

			removeClass( instance.element, 'cinder-static' );
			return {
				height: Math.max.apply( Math, columnYs ),
				width: containerWidth
			};
		},
		{
			balance: true
		}
	);

	// CinderInstance class
	function CinderInstance( element, options )
	{
		copySpecificProps( props, this, defaults, options );
		this.element = element;
		addClass( element, 'cinder-active' );
		element.style.position = 'relative';
		this.redraw( true );
	}

	// ----------------------------------------
	// begin extend Cinder prototype
	// ----------------------------------------

	shallowCopyObjProps( CinderInstance.prototype, {

		redraw: function( force )
		{

			var currentWidth = this.element.clientWidth;
			var currentHeight = this.element.clientHeight;

			// avoid repaint if the container size has not changed
			if( force || currentWidth != this.width )// || $children.not( '.cinder-item' ).length ){
			{
				var layout = layouts[ this.layout.name || this.layout ];
				var layoutOptions = this.layout.options || layout.options;
				var dimensions = layout.fn( this, currentWidth, currentHeight, layoutOptions );
				// store content dimensions
				this.width = dimensions.width;
				this.height = dimensions.height;
				if( this.resize ) this.element.style.height = dimensions.height + 'px';
				if( !this.ready )
				{
					var instance = this;
					setTimeout( function(){
						instance.ready = true;
						addClass( instance.element, 'cinder-ready' );
						if( instance.afterFirstLayout )
						{
							instance.afterFirstLayout( instance );
							instance.afterFirstLayout = null;		
						}
					}, 1 );
				}
				requiresRepaint = true;
			}
		},
		pause: function()
		{
			addClass( this.element, 'cinder-paused' );
			//for( var i in this.element.children )
			//{
//
			//}
		},
		unpause: function()
		{
			removeClass( this.element, 'cinder-paused' );
		},
		sort: function( fn, pause )
		{
			if( pause ) this.pause();
			for( var i in this.element.children )
			{
				//console.log( i );
				//if ( items[ i ].nodeType == 1 )
				//{ // get rid of the whitespace text nodes
					//    itemsArr.push( items[ i ] );
					//}
			}
			if( pause ) this.unpause();
			this.redraw( true );
		},
		destroy: function()
		{
			removeClass( this.element, 'cinder-active' );
			if( typeof this.onDestroy == 'function' ) this.onDestroy( this.element );
			instances.splice( instances.indexOf( this ), 1 );
		},
		//reflowColumn: function( column )
		//{
		//	
		//}
		set: function( key, value )
		{
			changed = false;
			if ( key.toString() == '[object String]' )
			{
				if( props.indexOf( key ) > -1 )
				{
					if( this[ key ] != value )
					{
						this[ key ] = value;
						changed = true;	
					}
				}
			}
			else
			{
				changed = copySpecificProps( props, this, key );
			}
			if( changed ) this.redraw( true );
		}
	} );

	// ----------------------------------------
	// end extend Cinder prototype
	// ----------------------------------------

	// assume object.keys function doesn't exist and save a few bytes by not checking
	function keys( o )
	{
		var keys = [];
		for( var prop in o )
		{
			keys.push( prop );
		}
		return keys;
	}

	function shallowCopyObjProps( target )
	{
		for( var i = 1; i < arguments.length; i++ )
		{
			var from = arguments[ i ];
			for( var prop in from )
			{
				target[ prop ] = from[ prop ];
			}
		}
		return target;
	}

	function copySpecificProps( keys, target )
	{
		var changed = false;
		for( var i = 2; i < arguments.length; i++ )
		{
			var from = arguments[ i ];
			for( var prop in from )
			{
				if( keys.indexOf( prop ) >= 0 && target[ prop ] != from[ prop ] )
				{
					target[ prop ] = from[ prop ];
					changed = true;
				}
			}
		}
		return changed;
	}

	function applyStyle( element, style )
	{
		var styleToApply = {
			width: style.width,
			height: style.height,
			position: 'absolute'
		};
		if( style.top && style.left )
		{
			if( has3D ) styleToApply[ has3D + transform ] = 'translate3d(' + style.left + ',' + style.top + ',0px)';
			else
			{
				styleToApply.left = style.left;
				styleToApply.top = style.top;
			}
		}
		assign( element.style, styleToApply );
	}

	function redraw()
	{
		if( timeout )
		{
			clearTimeout( timeout );
			timeout = null;
		}
		timeout = setTimeout( function(){
			for( var i = 0; i < instances.length; i++ )
			{
				instances[ i ].redraw();
			}
			timeout = null;
		}, 100 );
	}

	// ----------------------------------------
	// begin only required if no jQuery
	// ----------------------------------------

	//if ( VANILLA == true )
	//{
		function unique( value, index, self )
		{
			return self.indexOf( value ) === index;
		}

		function addClass( element, className )
		{
			var classes = className.split( ' ' );
			if( hasClassList )
			{
				while( className = classes.pop() )
				{
					element.classList.add( className );
				}
			}
			else
			{
				element.setAttribute( 'class', element.getAttribute( 'class' ).split( ' ' ).concat( classes ).filter( unique ) );
			}
		}

		function removeClass( element, className )
		{
			var classes = className.split( ' ' );
			if( hasClassList )
			{
				while( className = classes.pop() )
				{
					element.classList.remove( className );
				}
			}
			else
			{
				var elementClasses = element.getAttribute( 'class' ).split( ' ' );
				while( className = classes.pop() )
				{
					var classIndex = elementClasses.indexOf( className );
					if( classIndex != -1 ) elementClasses.splice( classIndex, 1 );
				}
				element.setAttribute( 'class', elementClasses.join( ' ' ) );
			}
		}

		function setAttributes( element, attrs, prefix )
		{
			for( var prop in attrs )
			{
				element.setAttribute( prefix + prop, attrs[ prop ] );
			}
		}

		function setData( element, data, prefix )
		{
			setAttributes( element, data, 'data-' + ( prefix || '' ) );
		}

		function getData( element, data, prefix )
		{
			for( var prop in data )
			{
				data[ prop ] = element.getAttribute( 'data-' + ( prefix || '' ) + data[ prop ] );
			}
			return data;
		}

	//}

	// ----------------------------------------
	// end only required if no jQuery
	// ----------------------------------------

	// ----------------------------------------
	// begin test for GPU support
	// ----------------------------------------

	// append div to perform 3d test
	document.body.append( div );

	// experimental test for translate 2D or 3D support
	while( has3D = transforms.pop() )
	{
		//console.log( has3D + transform );
		div.style[ has3D + transform ] = 'translateZ(9px)';
		if( window.getComputedStyle( div ).getPropertyValue( has3D + transform ) ) break;
	}

	div.remove();

	// ----------------------------------------
	// end test for GPU support
	// ----------------------------------------

	window.addEventListener( 'resize', function(){
		redraw();
	} );

	function raf()
	{
		//console.log( 'Cinder.doRepaint()' );
		if( !timeout && requiresRepaint )
		{
			for( var i = 0; i < instances.length; i++ )
			{
				var instance = instances[ i ];
				var elements = instance.element.children;
				if( instance.animation == 'css' )
				{
					for( var j = 0; j < elements.length; j++ )
					{
						var element = elements[ j ];
						applyStyle( element, getData( element, {
							width: 'width',
							height: 'height',
							left: 'left',
							top: 'top',
						}, 'cinder-' ) );
					}
				}
			}
			requiresRepaint = false;
		}
		window.requestAnimationFrame( raf );
	}

	window.requestAnimationFrame( raf );
	
	// Export the lib object for **Node.js**, with
	// backwards-compatibility for the old `require()` API. If we're in
	// the browser, add `lib` as a global object.
	if( typeof exports !== 'undefined')
	{
		if ( typeof module !== 'undefined' && module.exports )
		{
			exports = module.exports = Cinder;
		}
		exports.Cinder = Cinder;
	} else {
		( this || window ).Cinder = Cinder;
	}

	// AMD registration happens at the end for compatibility with AMD loaders
	// that may not enforce next-turn semantics on modules. Even though general
	// practice for AMD registration is to be anonymous, lib registers
	// as a named module because, like jQuery, it is a base library that is
	// popular enough to be bundled in a third party lib, but not be part of
	// an AMD load request. Those cases could generate an error when an
	// anonymous define() is called outside of a loader request.
	if ( typeof define === 'function' && define.amd )
	{
		define( 'Cinder', [], function(){
			return Cinder;
		} );
	}
} )();
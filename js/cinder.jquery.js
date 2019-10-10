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
			layout: 'default' // (string) layout name or (object) { name: (string), opts: (object) }
		};
	var props = keys( defaults ); // array of acceptable prop names
	// don’t need this for jQuery as we can just use extend
	//var assign = Object.assign;
	var transform = 'transform';
	var transforms = ',-o-,-moz-,-ms-,-webkit-'.split( ',' );
	var div = $( '<div/>' )[ 0 ];
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

			instance.$element.addClass( 'cinder-static' ).children().each( function(){
				var $this = $( this ),
					ratio = $this.data( 'cinder-ratio' );
				if( !ratio )
				{
					var elementWidth = $this.innerWidth();
					var elementHeight = $this.innerHeight();
					if( elementWidth && elementHeight )
					{
						ratio = elementWidth / elementHeight;
						$this.data( 'cinder-ratio', ratio );
					}
					else
					{
						ratio = fixedRatio;
					}
				}

				var column = columnYs.indexOf( Math.min.apply( Math, columnYs ) ),
					currentStyle = $this.css( [ 'padding-left', 'padding-right' ] ),
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
					var oStyle = $.extend( {}, style );

					// apply temporaty style
					$this.css( style );

					// get height with new style
					style.height = $this.css( 'height' );
					
					// store element's new height
					newHeight = parseInt( element.offsetHeight );
					
					// revert to the previous style
					$this.css( oStyle );
				}

				$this.data( 'cinder-style', style );

				///console.log( '----------' );
				columnYs[ column ] += parseFloat( newHeight ) + instance.gap;
			} ).end().removeClass( 'cinder-static' );
		},
		{
			resize: true,
			balance: true
		}
	);

	// CinderInstance class
	function CinderInstance( element, options )
	{
		copySpecificProps( props, this, defaults, options );
		this.$element = $( element ).addClass( 'cinder-active' ).css( 'position', 'relative' );
		this.redraw( true );
	}

	// ----------------------------------------
	// begin extend Cinder prototype
	// ----------------------------------------

	$.extend( CinderInstance.prototype, {

		redraw: function( force )
		{

			var currentWidth = this.$element.innerWidth();
			var currentHeight = this.element.innerHeight();

			// avoid repaint if the container size has not changed
			if( force || currentWidth != this.width )// || $children.not( '.cinder-item' ).length ){
			{
				var layout = layouts[ this.layout.name || this.layout ];
				var layoutOptions = this.layout.options || layout.options;
				var dimensions = layout.fn( this, currentWidth, currentHeight, layoutOptions );
				this.width = currentWidth;
				this.height = currentHeight;
				//if( this.resize ) $element.height( dimensions.height );
				if( !this.ready )
				{
					var instance = this;
					setTimeout( function(){
						instance.ready = true;
						instance.$element.addClass( 'cinder-ready' );
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
			this.$element.addClass( 'cinder-paused' );
			//for( var i in this.element.children )
			//{
//
			//}
		},
		unpause: function()
		{
			this.$element.removeClass( 'cinder-paused' );
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
			this.$element.removeClass( 'cinder-active' );
			if( typeof this.onDestroy == 'function' ) this.onDestroy( this.$element[ 0 ] );
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
		$.each( o, function( key ){ keys.push( key ) } );
		return keys;
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

	function applyStyle( $element, style )
	{
		var styleToApply = copySpecificProps( [ 'width', 'height' ], {}, style );
		styleToApply.position = 'absolute';

		if( style.top && style.left )
		{
			if( has3D ) styleToApply[ has3D + transform ] = 'translate3d(' + style.left + ',' + style.top + ',0px)';
			else
			{
				styleToApply.left = style.left;
				styleToApply.top = style.top;
			}
		}
		$element.css( styleToApply );
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
	// begin jQuery only
	// ----------------------------------------

	$.fn.Cinder = function( options )
	{
		var plugin;
		if ( typeof options == 'object' || !options )
		{
			return this.each( function(){
				plugin = new CinderInstance( this, options );
				$( this ).data( 'cinder', plugin );
				instances.push( plugin );
			} );
		}
	};

	// ----------------------------------------
	// end jQuery only
	// ----------------------------------------

	// ----------------------------------------
	// begin test for GPU support
	// ----------------------------------------

	// append div to perform 3d test
	$( 'body' ).append( $div );

	// experimental test for translate 2D or 3D support
	while( has3D = transforms.pop() )
	{
		//console.log( has3D + transform );
		if( $div.css( has3D + transform, 'translateZ(9px)' ).css( has3D + transform ) ) break;
	}

	$div.remove();

	// ----------------------------------------
	// end test for GPU support
	// ----------------------------------------

	$( window ).resize( function(){
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
				if( instance.animation == 'css' )
				{
					instance.$element.children().each( function(){
						applyStyle( $( this ), $( this ).data( 'cinder-style' ) )
					} );
				}
			}
			requiresRepaint = false;
		}
		window.requestAnimationFrame( raf );
	}

	window.requestAnimationFrame( raf );
	
} )( $ );
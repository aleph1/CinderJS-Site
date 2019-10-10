var words = 'lorem ipsum dolor nabet sit amet consectetur adipiscing elit ad quorum et cognitionem et usum iam corroborati natura ipsa praeeunte deducimur ratio quidem vestra sic cogit cur nisi quod turpis oratio est atqui reperies inquit in hoc quidem pertinacem si quicquam extra virtutem habeatur in bonis iam id ipsum absurdum maximum malum neglegi quamquam te quidem video minime esse deterritum duo reges constructio interrete'.split( ' ' ),
	colors = '#F2ACC9,#9AAFE4,#BB98F6,#C3D38C,#E1B79E,#90E2DC'.split( ',' ),
	columns = 3,//'400px',//'400px',
	gap = 6;

// ------------------------------
// HELPER FUNCTIONS
// ------------------------------

// assign events to HTML elements or collections
function on( elements, events ){
	if( !elements.length ) elements = [ elements ];
	for( var i = 0; i < elements.length; i++ )
	{
		var element = elements[ i ];
		for( var prop in events )
		{
			element.addEventListener( prop, events[ prop ] );
		}
	}
}

function off( elements, events ){
	if( !elements.length ) elements = [ elements ];
	for( var i = 0; i < elements.length; i++ )
	{
		var element = elements[ i ];
		for( var prop in events )
		{
			element.removeEventListener( prop, events[ prop ] );
		}
	}
}

// get multiple attributes from elements
function getAttributes( element, attributes )
{
	var output = {};
	for( var i = 0; i < attributes.length; i++ )
	{
		var attribute = attributes[ i ];
		output[ attribute ] = element.getAttribute( attribute );
	}
	return output;
}

function shallowCopy( to, from )
{
	for( var prop in from )
	{
		to[ prop ] = from[ prop ];
	}
	return to;
}

// ------------------------------
// LOGO ANIMATION
// ------------------------------

var rects = document.getElementsByTagName( 'rect' ),
	rectInfo = [],
	rectAttributes = 'x,y,width,height,fill'.split( ',' ),
	logo = document.getElementsByTagName( 'svg' );

for( var i = 0; i < rects.length; i++ )
{	
	rectInfo[ i ] = getAttributes( rects[ i ], rectAttributes );
}

function rearrangeLogo()
{
	console.log( 'rearrangeLogo' );

	var tempInfo = [];
	//var tempRects = rects.slice();

	// copy the rectDimensions array
	for( var i = 0; i < rectInfo.length; i++ )
	{
		tempInfo[ i ] = shallowCopy( {}, rectInfo[ i ] );
	}
	
	//while( tempInfo.length )
	//{
	//	var rectProps = tempInfo[ Math.floor( Math.random() * tempInfo.length ) ];
//
	//}

	off( logo, {
		mouseover: rearrangeLogo
	} )

	setTimeout( function(){
		on( logo, {
			mouseover: rearrangeLogo
		} );
	}, 1000 );
}

on( logo, {
	mouseover: rearrangeLogo
} );

// ------------------------------
// TINT BUTTONS A RANDOM COLOR
// ------------------------------

on( document.getElementsByClassName( 'btn' ), {
	mouseover: function( e )
	{
		this.style.backgroundColor = colors[ Math.floor( Math.random() * colors.length ) ];
	},
	mouseout: function( e )
	{
		this.style.backgroundColor = null;
	}
} );

/*
	$cinderDemo = $( '.cinder-demo' ),
	$cinderContent = $cinderDemo.html(),
	cinderAnimated = true,
	randomStr = function( minLength, maxLength )
	{
		var length = Math.floor( minLength + Math.random() * ( maxLength - minLength ) ),
			str = [];
		while( length )
		{
			str[ str.length ] = words[ Math.floor( Math.random() * words.length ) ];
			length--;
		}
		return str.join( ' ' );
	},
	cinderMake = function(){
		$cinderDemo.Cinder( {
			columns: columns,
			gap: gap,
		} ).Cinder( 'redraw' );
	};

cinderMake();

$( '#cinder-content' ).change( function(){
	var val = $( this ).val();
	$cinderDemo.Cinder( 'destroy' );
	$cinderDemo.empty();
	if( val == 'i' )
	{
		$cinderDemo.html( $cinderContent );
		cinderMake();
	}
	else if( val == 't' )
	{
		var content = '';

		for( var i = 0; i < 30; i++ )
		{
			content += '<div class="cinder-text"><p>' + randomStr( 25, 50 ) + '</p></div>';
		}
		$cinderDemo.html( content );
	}
	else
	{
		$cinderDemo.html( $cinderContent ).children().each( function(){
			$( this ).wrap( '<div class="cinder-text"></div>' ).after( '<p>' + randomStr( 25, 50 ) + '</p>' );
		} );
	}
	cinderMake();
} );

$( '#cinder-columns' ).change( function(){
	columns = $( this ).val();
	$cinderDemo.Cinder( 'set', 'columns', columns );
} );

$( '#cinder-animated' ).change( function(){
	cinderAnimated = $( this ).prop( 'checked' );
	if( cinderAnimated ) $cinderDemo.children().removeClass( 'anim-none' );
	else $cinderDemo.children().addClass( 'anim-none' );
} );
*/

Cinder( document.getElementsByClassName( 'cinder' ), {
	columns: columns,
	gap: gap
} );
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

// ------------------------------
// LOGO ANIMATION
// ------------------------------

var rects = document.getElementsByTagName( 'rect' ),
	rectDimensions = [],
	rectAttributes = 'x,y,width,height'.split( ',' );

for( var i = 0; i < rects.length; i++ )
{	
	rectDimensions[ i ] = getAttributes( rects[ i ], rectAttributes );
}

on( document.getElementsByTagName( 'svg' ), {
	mouseover: function( e )
	{
		console.log( 'logo mouseover' );
		//for( var i = 0; i)
	}
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
var Sylvester={precision:1e-6};function Vector(){}Vector.prototype={e:function(a){return(a<1||a>this.elements.length)?null:this.elements[a-1]},dimensions:function(){return this.elements.length},modulus:function(){return Math.sqrt(this.dot(this))},eql:function(a){var b=this.elements.length;var c=a.elements||a;if(b!=c.length){return false}while(b--){if(Math.abs(this.elements[b]-c[b])>Sylvester.precision){return false}}return true},dup:function(){return Vector.create(this.elements)},map:function(c){var d=[];this.each(function(a,b){d.push(c(a,b))});return Vector.create(d)},each:function(a){var b=this.elements.length;for(var c=0;c<b;c++){a(this.elements[c],c+1)}},toUnitVector:function(){var b=this.modulus();if(b===0){return this.dup()}return this.map(function(a){return a/b})},angleFrom:function(c){var d=c.elements||c;var e=this.elements.length,f=e,g;if(e!=d.length){return null}var j=0,i=0,h=0;this.each(function(a,b){j+=a*d[b-1];i+=a*a;h+=d[b-1]*d[b-1]});i=Math.sqrt(i);h=Math.sqrt(h);if(i*h===0){return null}var k=j/(i*h);if(k<-1){k=-1}if(k>1){k=1}return Math.acos(k)},isParallelTo:function(a){var b=this.angleFrom(a);return(b===null)?null:(b<=Sylvester.precision)},isAntiparallelTo:function(a){var b=this.angleFrom(a);return(b===null)?null:(Math.abs(b-Math.PI)<=Sylvester.precision)},isPerpendicularTo:function(a){var b=this.dot(a);return(b===null)?null:(Math.abs(b)<=Sylvester.precision)},add:function(c){var d=c.elements||c;if(this.elements.length!=d.length){return null}return this.map(function(a,b){return a+d[b-1]})},subtract:function(c){var d=c.elements||c;if(this.elements.length!=d.length){return null}return this.map(function(a,b){return a-d[b-1]})},multiply:function(b){return this.map(function(a){return a*b})},x:function(a){return this.multiply(a)},dot:function(a){var b=a.elements||a;var c,d=0,e=this.elements.length;if(e!=b.length){return null}while(e--){d+=this.elements[e]*b[e]}return d},cross:function(a){var b=a.elements||a;if(this.elements.length!=3||b.length!=3){return null}var c=this.elements;return Vector.create([(c[1]*b[2])-(c[2]*b[1]),(c[2]*b[0])-(c[0]*b[2]),(c[0]*b[1])-(c[1]*b[0])])},max:function(){var a=0,b=this.elements.length;while(b--){if(Math.abs(this.elements[b])>Math.abs(a)){a=this.elements[b]}}return a},indexOf:function(a){var b=null,c=this.elements.length;for(var d=0;d<c;d++){if(b===null&&this.elements[d]==a){b=d+1}}return b},toDiagonalMatrix:function(){return Matrix.Diagonal(this.elements)},round:function(){return this.map(function(a){return Math.round(a)})},snapTo:function(b){return this.map(function(a){return(Math.abs(a-b)<=Sylvester.precision)?b:a})},distanceFrom:function(c){if(c.anchor||(c.start&&c.end)){return c.distanceFrom(this)}var d=c.elements||c;if(d.length!=this.elements.length){return null}var e=0,f;this.each(function(a,b){f=a-d[b-1];e+=f*f});return Math.sqrt(e)},liesOn:function(a){return a.contains(this)},liesIn:function(a){return a.contains(this)},rotate:function(a,b){var c,d=null,e,f,g;if(a.determinant){d=a.elements}switch(this.elements.length){case 2:c=b.elements||b;if(c.length!=2){return null}if(!d){d=Matrix.Rotation(a).elements}e=this.elements[0]-c[0];f=this.elements[1]-c[1];return Vector.create([c[0]+d[0][0]*e+d[0][1]*f,c[1]+d[1][0]*e+d[1][1]*f]);break;case 3:if(!b.direction){return null}var j=b.pointClosestTo(this).elements;if(!d){d=Matrix.Rotation(a,b.direction).elements}e=this.elements[0]-j[0];f=this.elements[1]-j[1];g=this.elements[2]-j[2];return Vector.create([j[0]+d[0][0]*e+d[0][1]*f+d[0][2]*g,j[1]+d[1][0]*e+d[1][1]*f+d[1][2]*g,j[2]+d[2][0]*e+d[2][1]*f+d[2][2]*g]);break;default:return null}},reflectionIn:function(c){if(c.anchor){var d=this.elements.slice();var e=c.pointClosestTo(d).elements;return Vector.create([e[0]+(e[0]-d[0]),e[1]+(e[1]-d[1]),e[2]+(e[2]-(d[2]||0))])}else{var f=c.elements||c;if(this.elements.length!=f.length){return null}return this.map(function(a,b){return f[b-1]+(f[b-1]-a)})}},to3D:function(){var a=this.dup();switch(a.elements.length){case 3:break;case 2:a.elements.push(0);break;default:return null}return a},inspect:function(){return'['+this.elements.join(', ')+']'},setElements:function(a){this.elements=(a.elements||a).slice();return this}};Vector.create=function(a){var b=new Vector();return b.setElements(a)};var $V=Vector.create;Vector.i=Vector.create([1,0,0]);Vector.j=Vector.create([0,1,0]);Vector.k=Vector.create([0,0,1]);Vector.Random=function(a){var b=[];while(a--){b.push(Math.random())}return Vector.create(b)};Vector.Zero=function(a){var b=[];while(a--){b.push(0)}return Vector.create(b)};function Matrix(){}Matrix.prototype={e:function(a,b){if(a<1||a>this.elements.length||b<1||b>this.elements[0].length){return null}return this.elements[a-1][b-1]},row:function(a){if(a>this.elements.length){return null}return Vector.create(this.elements[a-1])},col:function(a){if(a>this.elements[0].length){return null}var b=[],c=this.elements.length;for(var d=0;d<c;d++){b.push(this.elements[d][a-1])}return Vector.create(b)},dimensions:function(){return{rows:this.elements.length,cols:this.elements[0].length}},rows:function(){return this.elements.length},cols:function(){return this.elements[0].length},eql:function(a){var b=a.elements||a;if(typeof(b[0][0])=='undefined'){b=Matrix.create(b).elements}if(this.elements.length!=b.length||this.elements[0].length!=b[0].length){return false}var c=this.elements.length,d=this.elements[0].length,e;while(c--){e=d;while(e--){if(Math.abs(this.elements[c][e]-b[c][e])>Sylvester.precision){return false}}}return true},dup:function(){return Matrix.create(this.elements)},map:function(a){var b=[],c=this.elements.length,d=this.elements[0].length,e;while(c--){e=d;b[c]=[];while(e--){b[c][e]=a(this.elements[c][e],c+1,e+1)}}return Matrix.create(b)},isSameSizeAs:function(a){var b=a.elements||a;if(typeof(b[0][0])=='undefined'){b=Matrix.create(b).elements}return(this.elements.length==b.length&&this.elements[0].length==b[0].length)},add:function(d){var e=d.elements||d;if(typeof(e[0][0])=='undefined'){e=Matrix.create(e).elements}if(!this.isSameSizeAs(e)){return null}return this.map(function(a,b,c){return a+e[b-1][c-1]})},subtract:function(d){var e=d.elements||d;if(typeof(e[0][0])=='undefined'){e=Matrix.create(e).elements}if(!this.isSameSizeAs(e)){return null}return this.map(function(a,b,c){return a-e[b-1][c-1]})},canMultiplyFromLeft:function(a){var b=a.elements||a;if(typeof(b[0][0])=='undefined'){b=Matrix.create(b).elements}return(this.elements[0].length==b.length)},multiply:function(b){if(!b.elements){return this.map(function(a){return a*b})}var c=b.modulus?true:false;var d=b.elements||b;if(typeof(d[0][0])=='undefined'){d=Matrix.create(d).elements}if(!this.canMultiplyFromLeft(d)){return null}var e=this.elements.length,f=d[0].length,g;var j=this.elements[0].length,i,h=[],k;while(e--){g=f;h[e]=[];while(g--){i=j;k=0;while(i--){k+=this.elements[e][i]*d[i][g]}h[e][g]=k}}var d=Matrix.create(h);return c?d.col(1):d},x:function(a){return this.multiply(a)},minor:function(a,b,c,d){var e=[],f=c,g,j,i;var h=this.elements.length,k=this.elements[0].length;while(f--){g=c-f-1;e[g]=[];j=d;while(j--){i=d-j-1;e[g][i]=this.elements[(a+g-1)%h][(b+i-1)%k]}}return Matrix.create(e)},transpose:function(){var a=this.elements.length,b,c=this.elements[0].length,d;var e=[],b=c;while(b--){d=a;e[b]=[];while(d--){e[b][d]=this.elements[d][b]}}return Matrix.create(e)},isSquare:function(){return(this.elements.length==this.elements[0].length)},max:function(){var a=0,b=this.elements.length,c=this.elements[0].length,d;while(b--){d=c;while(d--){if(Math.abs(this.elements[b][d])>Math.abs(a)){a=this.elements[b][d]}}}return a},indexOf:function(a){var b=null,c=this.elements.length,d,e=this.elements[0].length,f;for(d=0;d<c;d++){for(f=0;f<e;f++){if(this.elements[d][f]==a){return{i:d+1,j:f+1}}}}return null},diagonal:function(){if(!this.isSquare){return null}var a=[],b=this.elements.length;for(var c=0;c<b;c++){a.push(this.elements[c][c])}return Vector.create(a)},toRightTriangular:function(){var a=this.dup(),b;var c=this.elements.length,d,e,f=this.elements[0].length,g;for(d=0;d<c;d++){if(a.elements[d][d]==0){for(e=d+1;e<c;e++){if(a.elements[e][d]!=0){b=[];for(g=0;g<f;g++){b.push(a.elements[d][g]+a.elements[e][g])}a.elements[d]=b;break}}}if(a.elements[d][d]!=0){for(e=d+1;e<c;e++){var j=a.elements[e][d]/a.elements[d][d];b=[];for(g=0;g<f;g++){b.push(g<=d?0:a.elements[e][g]-a.elements[d][g]*j)}a.elements[e]=b}}}return a},toUpperTriangular:function(){return this.toRightTriangular()},determinant:function(){if(!this.isSquare()){return null}var a=this.toRightTriangular();var b=a.elements[0][0],c=a.elements.length;for(var d=1;d<c;d++){b=b*a.elements[d][d]}return b},det:function(){return this.determinant()},isSingular:function(){return(this.isSquare()&&this.determinant()===0)},trace:function(){if(!this.isSquare()){return null}var a=this.elements[0][0],b=this.elements.length;for(var c=1;c<b;c++){a+=this.elements[c][c]}return a},tr:function(){return this.trace()},rank:function(){var a=this.toRightTriangular(),b=0;var c=this.elements.length,d=this.elements[0].length,e;while(c--){e=d;while(e--){if(Math.abs(a.elements[c][e])>Sylvester.precision){b++;break}}}return b},rk:function(){return this.rank()},augment:function(a){var b=a.elements||a;if(typeof(b[0][0])=='undefined'){b=Matrix.create(b).elements}var c=this.dup(),d=c.elements[0].length;var e=c.elements.length,f=b[0].length,g;if(e!=b.length){return null}while(e--){g=f;while(g--){c.elements[e][d+g]=b[e][g]}}return c},inverse:function(){if(!this.isSquare()||this.isSingular()){return null}var a=this.elements.length,b=a,c;var d=this.augment(Matrix.I(a)).toRightTriangular();var e=d.elements[0].length,f,g,j;var i=[],h;while(b--){g=[];i[b]=[];j=d.elements[b][b];for(f=0;f<e;f++){h=d.elements[b][f]/j;g.push(h);if(f>=a){i[b].push(h)}}d.elements[b]=g;c=b;while(c--){g=[];for(f=0;f<e;f++){g.push(d.elements[c][f]-d.elements[b][f]*d.elements[c][b])}d.elements[c]=g}}return Matrix.create(i)},inv:function(){return this.inverse()},round:function(){return this.map(function(a){return Math.round(a)})},snapTo:function(b){return this.map(function(a){return(Math.abs(a-b)<=Sylvester.precision)?b:a})},inspect:function(){var a=[];var b=this.elements.length;for(var c=0;c<b;c++){a.push(Vector.create(this.elements[c]).inspect())}return a.join('\n')},setElements:function(a){var b,c,d=a.elements||a;if(typeof(d[0][0])!='undefined'){b=d.length;this.elements=[];while(b--){c=d[b].length;this.elements[b]=[];while(c--){this.elements[b][c]=d[b][c]}}return this}var e=d.length;this.elements=[];for(b=0;b<e;b++){this.elements.push([d[b]])}return this}};Matrix.create=function(a){var b=new Matrix();return b.setElements(a)};var $M=Matrix.create;Matrix.I=function(a){var b=[],c=a,d;while(c--){d=a;b[c]=[];while(d--){b[c][d]=(c==d)?1:0}}return Matrix.create(b)};Matrix.Diagonal=function(a){var b=a.length;var c=Matrix.I(b);while(b--){c.elements[b][b]=a[b]}return c};Matrix.Rotation=function(a,b){if(!b){return Matrix.create([[Math.cos(a),-Math.sin(a)],[Math.sin(a),Math.cos(a)]])}var c=b.dup();if(c.elements.length!=3){return null}var d=c.modulus();var e=c.elements[0]/d,f=c.elements[1]/d,g=c.elements[2]/d;var j=Math.sin(a),i=Math.cos(a),h=1-i;return Matrix.create([[h*e*e+i,h*e*f-j*g,h*e*g+j*f],[h*e*f+j*g,h*f*f+i,h*f*g-j*e],[h*e*g-j*f,h*f*g+j*e,h*g*g+i]])};Matrix.RotationX=function(a){var b=Math.cos(a),c=Math.sin(a);return Matrix.create([[1,0,0],[0,b,-c],[0,c,b]])};Matrix.RotationY=function(a){var b=Math.cos(a),c=Math.sin(a);return Matrix.create([[b,0,c],[0,1,0],[-c,0,b]])};Matrix.RotationZ=function(a){var b=Math.cos(a),c=Math.sin(a);return Matrix.create([[b,-c,0],[c,b,0],[0,0,1]])};Matrix.Random=function(a,b){return Matrix.Zero(a,b).map(function(){return Math.random()})};Matrix.Zero=function(a,b){var c=[],d=a,e;while(d--){e=b;c[d]=[];while(e--){c[d][e]=0}}return Matrix.create(c)};function Line(){}Line.prototype={eql:function(a){return(this.isParallelTo(a)&&this.contains(a.anchor))},dup:function(){return Line.create(this.anchor,this.direction)},translate:function(a){var b=a.elements||a;return Line.create([this.anchor.elements[0]+b[0],this.anchor.elements[1]+b[1],this.anchor.elements[2]+(b[2]||0)],this.direction)},isParallelTo:function(a){if(a.normal||(a.start&&a.end)){return a.isParallelTo(this)}var b=this.direction.angleFrom(a.direction);return(Math.abs(b)<=Sylvester.precision||Math.abs(b-Math.PI)<=Sylvester.precision)},distanceFrom:function(a){if(a.normal||(a.start&&a.end)){return a.distanceFrom(this)}if(a.direction){if(this.isParallelTo(a)){return this.distanceFrom(a.anchor)}var b=this.direction.cross(a.direction).toUnitVector().elements;var c=this.anchor.elements,d=a.anchor.elements;return Math.abs((c[0]-d[0])*b[0]+(c[1]-d[1])*b[1]+(c[2]-d[2])*b[2])}else{var e=a.elements||a;var c=this.anchor.elements,f=this.direction.elements;var g=e[0]-c[0],j=e[1]-c[1],i=(e[2]||0)-c[2];var h=Math.sqrt(g*g+j*j+i*i);if(h===0)return 0;var k=(g*f[0]+j*f[1]+i*f[2])/h;var m=1-k*k;return Math.abs(h*Math.sqrt(m<0?0:m))}},contains:function(a){if(a.start&&a.end){return this.contains(a.start)&&this.contains(a.end)}var b=this.distanceFrom(a);return(b!==null&&b<=Sylvester.precision)},positionOf:function(a){if(!this.contains(a)){return null}var b=a.elements||a;var c=this.anchor.elements,d=this.direction.elements;return(b[0]-c[0])*d[0]+(b[1]-c[1])*d[1]+((b[2]||0)-c[2])*d[2]},liesIn:function(a){return a.contains(this)},intersects:function(a){if(a.normal){return a.intersects(this)}return(!this.isParallelTo(a)&&this.distanceFrom(a)<=Sylvester.precision)},intersectionWith:function(a){if(a.normal||(a.start&&a.end)){return a.intersectionWith(this)}if(!this.intersects(a)){return null}var b=this.anchor.elements,c=this.direction.elements,d=a.anchor.elements,e=a.direction.elements;var f=c[0],g=c[1],j=c[2],i=e[0],h=e[1],k=e[2];var m=b[0]-d[0],n=b[1]-d[1],l=b[2]-d[2];var o=-f*m-g*n-j*l;var p=i*m+h*n+k*l;var q=f*f+g*g+j*j;var t=i*i+h*h+k*k;var r=f*i+g*h+j*k;var s=(o*t/q+r*p)/(t-r*r);return Vector.create([b[0]+s*f,b[1]+s*g,b[2]+s*j])},pointClosestTo:function(a){if(a.start&&a.end){var b=a.pointClosestTo(this);return(b===null)?null:this.pointClosestTo(b)}else if(a.direction){if(this.intersects(a)){return this.intersectionWith(a)}if(this.isParallelTo(a)){return null}var c=this.direction.elements,d=a.direction.elements;var e=c[0],f=c[1],g=c[2],j=d[0],i=d[1],h=d[2];var k=(g*j-e*h),m=(e*i-f*j),n=(f*h-g*i);var l=[k*h-m*i,m*j-n*h,n*i-k*j];var b=Plane.create(a.anchor,l);return b.intersectionWith(this)}else{var b=a.elements||a;if(this.contains(b)){return Vector.create(b)}var o=this.anchor.elements,c=this.direction.elements;var e=c[0],f=c[1],g=c[2],p=o[0],q=o[1],t=o[2];var k=e*(b[1]-q)-f*(b[0]-p),m=f*((b[2]||0)-t)-g*(b[1]-q),n=g*(b[0]-p)-e*((b[2]||0)-t);var r=Vector.create([f*k-g*n,g*m-e*k,e*n-f*m]);var s=this.distanceFrom(b)/r.modulus();return Vector.create([b[0]+r.elements[0]*s,b[1]+r.elements[1]*s,(b[2]||0)+r.elements[2]*s])}},rotate:function(a,b){if(typeof(b.direction)=='undefined'){b=Line.create(b.to3D(),Vector.k)}var c=Matrix.Rotation(a,b.direction).elements;var d=b.pointClosestTo(this.anchor).elements;var e=this.anchor.elements,f=this.direction.elements;var g=d[0],j=d[1],i=d[2],h=e[0],k=e[1],m=e[2];var n=h-g,l=k-j,o=m-i;return Line.create([g+c[0][0]*n+c[0][1]*l+c[0][2]*o,j+c[1][0]*n+c[1][1]*l+c[1][2]*o,i+c[2][0]*n+c[2][1]*l+c[2][2]*o],[c[0][0]*f[0]+c[0][1]*f[1]+c[0][2]*f[2],c[1][0]*f[0]+c[1][1]*f[1]+c[1][2]*f[2],c[2][0]*f[0]+c[2][1]*f[1]+c[2][2]*f[2]])},reverse:function(){return Line.create(this.anchor,this.direction.x(-1))},reflectionIn:function(a){if(a.normal){var b=this.anchor.elements,c=this.direction.elements;var d=b[0],e=b[1],f=b[2],g=c[0],j=c[1],i=c[2];var h=this.anchor.reflectionIn(a).elements;var k=d+g,m=e+j,n=f+i;var l=a.pointClosestTo([k,m,n]).elements;var o=[l[0]+(l[0]-k)-h[0],l[1]+(l[1]-m)-h[1],l[2]+(l[2]-n)-h[2]];return Line.create(h,o)}else if(a.direction){return this.rotate(Math.PI,a)}else{var p=a.elements||a;return Line.create(this.anchor.reflectionIn([p[0],p[1],(p[2]||0)]),this.direction)}},setVectors:function(a,b){a=Vector.create(a);b=Vector.create(b);if(a.elements.length==2){a.elements.push(0)}if(b.elements.length==2){b.elements.push(0)}if(a.elements.length>3||b.elements.length>3){return null}var c=b.modulus();if(c===0){return null}this.anchor=a;this.direction=Vector.create([b.elements[0]/c,b.elements[1]/c,b.elements[2]/c]);return this}};Line.create=function(a,b){var c=new Line();return c.setVectors(a,b)};var $L=Line.create;Line.X=Line.create(Vector.Zero(3),Vector.i);Line.Y=Line.create(Vector.Zero(3),Vector.j);Line.Z=Line.create(Vector.Zero(3),Vector.k);Line.Segment=function(){};Line.Segment.prototype={eql:function(a){return(this.start.eql(a.start)&&this.end.eql(a.end))||(this.start.eql(a.end)&&this.end.eql(a.start))},dup:function(){return Line.Segment.create(this.start,this.end)},length:function(){var a=this.start.elements,b=this.end.elements;var c=b[0]-a[0],d=b[1]-a[1],e=b[2]-a[2];return Math.sqrt(c*c+d*d+e*e)},toVector:function(){var a=this.start.elements,b=this.end.elements;return Vector.create([b[0]-a[0],b[1]-a[1],b[2]-a[2]])},midpoint:function(){var a=this.start.elements,b=this.end.elements;return Vector.create([(b[0]+a[0])/2,(b[1]+a[1])/2,(b[2]+a[2])/2])},bisectingPlane:function(){return Plane.create(this.midpoint(),this.toVector())},translate:function(a){var b=a.elements||a;var c=this.start.elements,d=this.end.elements;return Line.Segment.create([c[0]+b[0],c[1]+b[1],c[2]+(b[2]||0)],[d[0]+b[0],d[1]+b[1],d[2]+(b[2]||0)])},isParallelTo:function(a){return this.line.isParallelTo(a)},distanceFrom:function(a){var b=this.pointClosestTo(a);return(b===null)?null:b.distanceFrom(a)},contains:function(a){if(a.start&&a.end){return this.contains(a.start)&&this.contains(a.end)}var b=(a.elements||a).slice();if(b.length==2){b.push(0)}if(this.start.eql(b)){return true}var c=this.start.elements;var d=Vector.create([c[0]-b[0],c[1]-b[1],c[2]-(b[2]||0)]);var e=this.toVector();return d.isAntiparallelTo(e)&&d.modulus()<=e.modulus()},intersects:function(a){return(this.intersectionWith(a)!==null)},intersectionWith:function(a){if(!this.line.intersects(a)){return null}var b=this.line.intersectionWith(a);return(this.contains(b)?b:null)},pointClosestTo:function(a){if(a.normal){var b=this.line.intersectionWith(a);if(b===null){return null}return this.pointClosestTo(b)}else{var c=this.line.pointClosestTo(a);if(c===null){return null}if(this.contains(c)){return c}return(this.line.positionOf(c)<0?this.start:this.end).dup()}},setPoints:function(a,b){a=Vector.create(a).to3D();b=Vector.create(b).to3D();if(a===null||b===null){return null}this.line=Line.create(a,b.subtract(a));this.start=a;this.end=b;return this}};Line.Segment.create=function(a,b){var c=new Line.Segment();return c.setPoints(a,b)};function Plane(){}Plane.prototype={eql:function(a){return(this.contains(a.anchor)&&this.isParallelTo(a))},dup:function(){return Plane.create(this.anchor,this.normal)},translate:function(a){var b=a.elements||a;return Plane.create([this.anchor.elements[0]+b[0],this.anchor.elements[1]+b[1],this.anchor.elements[2]+(b[2]||0)],this.normal)},isParallelTo:function(a){var b;if(a.normal){b=this.normal.angleFrom(a.normal);return(Math.abs(b)<=Sylvester.precision||Math.abs(Math.PI-b)<=Sylvester.precision)}else if(a.direction){return this.normal.isPerpendicularTo(a.direction)}return null},isPerpendicularTo:function(a){var b=this.normal.angleFrom(a.normal);return(Math.abs(Math.PI/2-b)<=Sylvester.precision)},distanceFrom:function(a){if(this.intersects(a)||this.contains(a)){return 0}if(a.anchor){var b=this.anchor.elements,c=a.anchor.elements,d=this.normal.elements;return Math.abs((b[0]-c[0])*d[0]+(b[1]-c[1])*d[1]+(b[2]-c[2])*d[2])}else{var e=a.elements||a;var b=this.anchor.elements,d=this.normal.elements;return Math.abs((b[0]-e[0])*d[0]+(b[1]-e[1])*d[1]+(b[2]-(e[2]||0))*d[2])}},contains:function(a){if(a.normal){return null}if(a.direction){return(this.contains(a.anchor)&&this.contains(a.anchor.add(a.direction)))}else{var b=a.elements||a;var c=this.anchor.elements,d=this.normal.elements;var e=Math.abs(d[0]*(c[0]-b[0])+d[1]*(c[1]-b[1])+d[2]*(c[2]-(b[2]||0)));return(e<=Sylvester.precision)}},intersects:function(a){if(typeof(a.direction)=='undefined'&&typeof(a.normal)=='undefined'){return null}return!this.isParallelTo(a)},intersectionWith:function(a){if(!this.intersects(a)){return null}if(a.direction){var b=a.anchor.elements,c=a.direction.elements,d=this.anchor.elements,e=this.normal.elements;var f=(e[0]*(d[0]-b[0])+e[1]*(d[1]-b[1])+e[2]*(d[2]-b[2]))/(e[0]*c[0]+e[1]*c[1]+e[2]*c[2]);return Vector.create([b[0]+c[0]*f,b[1]+c[1]*f,b[2]+c[2]*f])}else if(a.normal){var g=this.normal.cross(a.normal).toUnitVector();var e=this.normal.elements,b=this.anchor.elements,j=a.normal.elements,i=a.anchor.elements;var h=Matrix.Zero(2,2),k=0;while(h.isSingular()){k++;h=Matrix.create([[e[k%3],e[(k+1)%3]],[j[k%3],j[(k+1)%3]]])}var m=h.inverse().elements;var n=e[0]*b[0]+e[1]*b[1]+e[2]*b[2];var l=j[0]*i[0]+j[1]*i[1]+j[2]*i[2];var o=[m[0][0]*n+m[0][1]*l,m[1][0]*n+m[1][1]*l];var p=[];for(var q=1;q<=3;q++){p.push((k==q)?0:o[(q+(5-k)%3)%3])}return Line.create(p,g)}},pointClosestTo:function(a){var b=a.elements||a;var c=this.anchor.elements,d=this.normal.elements;var e=(c[0]-b[0])*d[0]+(c[1]-b[1])*d[1]+(c[2]-(b[2]||0))*d[2];return Vector.create([b[0]+d[0]*e,b[1]+d[1]*e,(b[2]||0)+d[2]*e])},rotate:function(a,b){var c=a.determinant?a.elements:Matrix.Rotation(a,b.direction).elements;var d=b.pointClosestTo(this.anchor).elements;var e=this.anchor.elements,f=this.normal.elements;var g=d[0],j=d[1],i=d[2],h=e[0],k=e[1],m=e[2];var n=h-g,l=k-j,o=m-i;return Plane.create([g+c[0][0]*n+c[0][1]*l+c[0][2]*o,j+c[1][0]*n+c[1][1]*l+c[1][2]*o,i+c[2][0]*n+c[2][1]*l+c[2][2]*o],[c[0][0]*f[0]+c[0][1]*f[1]+c[0][2]*f[2],c[1][0]*f[0]+c[1][1]*f[1]+c[1][2]*f[2],c[2][0]*f[0]+c[2][1]*f[1]+c[2][2]*f[2]])},reflectionIn:function(a){if(a.normal){var b=this.anchor.elements,c=this.normal.elements;var d=b[0],e=b[1],f=b[2],g=c[0],j=c[1],i=c[2];var h=this.anchor.reflectionIn(a).elements;var k=d+g,m=e+j,n=f+i;var l=a.pointClosestTo([k,m,n]).elements;var o=[l[0]+(l[0]-k)-h[0],l[1]+(l[1]-m)-h[1],l[2]+(l[2]-n)-h[2]];return Plane.create(h,o)}else if(a.direction){return this.rotate(Math.PI,a)}else{var p=a.elements||a;return Plane.create(this.anchor.reflectionIn([p[0],p[1],(p[2]||0)]),this.normal)}},setVectors:function(a,b,c){a=Vector.create(a);a=a.to3D();if(a===null){return null}b=Vector.create(b);b=b.to3D();if(b===null){return null}if(typeof(c)=='undefined'){c=null}else{c=Vector.create(c);c=c.to3D();if(c===null){return null}}var d=a.elements[0],e=a.elements[1],f=a.elements[2];var g=b.elements[0],j=b.elements[1],i=b.elements[2];var h,k;if(c!==null){var m=c.elements[0],n=c.elements[1],l=c.elements[2];h=Vector.create([(j-e)*(l-f)-(i-f)*(n-e),(i-f)*(m-d)-(g-d)*(l-f),(g-d)*(n-e)-(j-e)*(m-d)]);k=h.modulus();if(k===0){return null}h=Vector.create([h.elements[0]/k,h.elements[1]/k,h.elements[2]/k])}else{k=Math.sqrt(g*g+j*j+i*i);if(k===0){return null}h=Vector.create([b.elements[0]/k,b.elements[1]/k,b.elements[2]/k])}this.anchor=a;this.normal=h;return this}};Plane.create=function(a,b,c){var d=new Plane();return d.setVectors(a,b,c)};var $P=Plane.create;Plane.XY=Plane.create(Vector.Zero(3),Vector.k);Plane.YZ=Plane.create(Vector.Zero(3),Vector.i);Plane.ZX=Plane.create(Vector.Zero(3),Vector.j);Plane.YX=Plane.XY;Plane.ZY=Plane.YZ;Plane.XZ=Plane.ZX;Plane.fromPoints=function(a){var b=a.length,c=[],d,e,f,g,j,i,h,k,m,n,l=Vector.Zero(3);for(d=0;d<b;d++){e=Vector.create(a[d]).to3D();if(e===null){return null}c.push(e);f=c.length;if(f>2){j=c[f-1].elements;i=c[f-2].elements;h=c[f-3].elements;g=Vector.create([(j[1]-i[1])*(h[2]-i[2])-(j[2]-i[2])*(h[1]-i[1]),(j[2]-i[2])*(h[0]-i[0])-(j[0]-i[0])*(h[2]-i[2]),(j[0]-i[0])*(h[1]-i[1])-(j[1]-i[1])*(h[0]-i[0])]).toUnitVector();if(f>3){m=g.angleFrom(n);if(m!==null){if(!(Math.abs(m)<=Sylvester.precision||Math.abs(m-Math.PI)<=Sylvester.precision)){return null}}}l=l.add(g);n=g}}j=c[1].elements;i=c[0].elements;h=c[f-1].elements;k=c[f-2].elements;l=l.add(Vector.create([(j[1]-i[1])*(h[2]-i[2])-(j[2]-i[2])*(h[1]-i[1]),(j[2]-i[2])*(h[0]-i[0])-(j[0]-i[0])*(h[2]-i[2]),(j[0]-i[0])*(h[1]-i[1])-(j[1]-i[1])*(h[0]-i[0])]).toUnitVector()).add(Vector.create([(i[1]-h[1])*(k[2]-h[2])-(i[2]-h[2])*(k[1]-h[1]),(i[2]-h[2])*(k[0]-h[0])-(i[0]-h[0])*(k[2]-h[2]),(i[0]-h[0])*(k[1]-h[1])-(i[1]-h[1])*(k[0]-h[0])]).toUnitVector());return Plane.create(c[0],l)};function Polygon(){}Polygon.prototype={v:function(a){return this.vertices.at(a-1).data},nodeFor:function(a){return this.vertices.withData(a)},dup:function(){return Polygon.create(this.vertices,this.plane)},translate:function(c){var d=c.elements||c;this.vertices.each(function(a){var b=a.data.elements;a.data.setElements([b[0]+d[0],b[1]+d[1],b[2]+(d[2]||0)])});this.plane=this.plane.translate(c);this.updateTrianglePlanes(function(a){return a.translate(c)});return this},rotate:function(b,c){var d=Matrix.Rotation(b,c.direction);this.vertices.each(function(a){a.data.setElements(a.data.rotate(d,c).elements)});this.plane=this.plane.rotate(d,c);this.updateTrianglePlanes(function(a){return a.rotate(d,c)});return this},scale:function(c,d){var e=d.elements||d;this.vertices.each(function(a){var b=a.data.elements;a.data.setElements([e[0]+c*(b[0]-e[0]),e[1]+c*(b[1]-e[1]),(e[2]||0)+c*(b[2]-(e[2]||0))])});var f=this.vertices.first.data;this.plane.anchor.setElements(f);this.updateTrianglePlanes(function(a){return Plane.create(f,a.normal)});return this},updateTrianglePlanes:function(a){var b;if(this.cached.triangles!==null){b=this.cached.triangles.length;while(b--){this.cached.triangles[b].plane=a(this.cached.triangles[b].plane)}}if(this.cached.surfaceIntegralElements!==null){b=this.cached.surfaceIntegralElements.length;while(b--){this.cached.surfaceIntegralElements[b].plane=a(this.cached.surfaceIntegralElements[b].plane)}}},isTriangle:function(){return this.vertices.length==3},trianglesForSurfaceIntegral:function(){if(this.cached.surfaceIntegralElements!==null){return this.cached.surfaceIntegralElements}var d=[];var e=this.vertices.first.data;var f=this.plane;this.vertices.each(function(a,b){if(b<2){return}var c=[e,a.prev.data,a.data];d.push(Polygon.create(c,Plane.fromPoints(c)||f))});return this.setCache('surfaceIntegralElements',d)},area:function(){if(this.isTriangle()){var a=this.vertices.first,b=a.next,c=b.next;a=a.data.elements;b=b.data.elements;c=c.data.elements;return 0.5*Vector.create([(a[1]-b[1])*(c[2]-b[2])-(a[2]-b[2])*(c[1]-b[1]),(a[2]-b[2])*(c[0]-b[0])-(a[0]-b[0])*(c[2]-b[2]),(a[0]-b[0])*(c[1]-b[1])-(a[1]-b[1])*(c[0]-b[0])]).modulus()}else{var d=this.trianglesForSurfaceIntegral(),e=0;var f=d.length;while(f--){e+=d[f].area()*d[f].plane.normal.dot(this.plane.normal)}return e}},centroid:function(){if(this.isTriangle()){var a=this.v(1).elements,b=this.v(2).elements,c=this.v(3).elements;return Vector.create([(a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3,(a[2]+b[2]+c[2])/3])}else{var a,d=0,e=Vector.Zero(3),f,c,g=this.trianglesForSurfaceIntegral();var j=g.length;while(j--){a=g[j].area()*g[j].plane.normal.dot(this.plane.normal);d+=a;f=e.elements;c=g[j].centroid().elements;e.setElements([f[0]+c[0]*a,f[1]+c[1]*a,f[2]+c[2]*a])}return e.x(1/d)}},projectionOn:function(b){var c=[];this.vertices.each(function(a){c.push(b.pointClosestTo(a.data))});return Polygon.create(c)},removeVertex:function(a){if(this.isTriangle()){return}var b=this.nodeFor(a);if(b===null){return null}this.clearCache();var c=b.prev,d=b.next;var e=c.data.isConvex(this);var f=d.data.isConvex(this);if(b.data.isConvex(this)){this.convexVertices.remove(this.convexVertices.withData(b.data))}else{this.reflexVertices.remove(this.reflexVertices.withData(b.data))}this.vertices.remove(b);if(e!=c.data.isConvex(this)){if(e){this.convexVertices.remove(this.convexVertices.withData(c.data));this.reflexVertices.append(new LinkedList.Node(c.data))}else{this.reflexVertices.remove(this.reflexVertices.withData(c.data));this.convexVertices.append(new LinkedList.Node(c.data))}}if(f!=d.data.isConvex(this)){if(f){this.convexVertices.remove(this.convexVertices.withData(d.data));this.reflexVertices.append(new LinkedList.Node(d.data))}else{this.reflexVertices.remove(this.reflexVertices.withData(d.data));this.convexVertices.append(new LinkedList.Node(d.data))}}return this},contains:function(a){return this.containsByWindingNumber(a)},containsByWindingNumber:function(b){var c=b.elements||b;if(!this.plane.contains(c)){return false}if(this.hasEdgeContaining(c)){return false}var d,e,f,g,j=0,i,h=0,k=this;this.vertices.each(function(a){d=a.data.elements;e=a.next.data.elements;f=Vector.create([d[0]-c[0],d[1]-c[1],d[2]-(c[2]||0)]);g=Vector.create([e[0]-c[0],e[1]-c[1],e[2]-(c[2]||0)]);i=f.angleFrom(g);if(i===null||i===0){return}j+=(f.cross(g).isParallelTo(k.plane.normal)?1:-1)*i;if(j>=2*Math.PI-Sylvester.precision){h++;j-=2*Math.PI}if(j<=-2*Math.PI+Sylvester.precision){h--;j+=2*Math.PI}});return h!=0},hasEdgeContaining:function(b){var c=(b.elements||b);var d=false;this.vertices.each(function(a){if(Line.Segment.create(a.data,a.next.data).contains(c)){d=true}});return d},toTriangles:function(){if(this.cached.triangles!==null){return this.cached.triangles}return this.setCache('triangles',this.triangulateByEarClipping())},triangulateByEarClipping:function(){var b=this.dup(),c=[],d,e,f,g;while(!b.isTriangle()){d=false;while(!d){d=true;e=b.convexVertices.randomNode();f=b.vertices.withData(e.data);g=Polygon.create([f.data,f.next.data,f.prev.data],this.plane);b.reflexVertices.each(function(a){if(a.data!=f.prev.data&&a.data!=f.next.data){if(g.contains(a.data)||g.hasEdgeContaining(a.data)){d=false}}})}c.push(g);b.removeVertex(f.data)}c.push(Polygon.create(b.vertices,this.plane));return c},setVertices:function(a,b){var c=a.toArray?a.toArray():a;this.plane=(b&&b.normal)?b.dup():Plane.fromPoints(c);if(this.plane===null){return null}this.vertices=new LinkedList.Circular();var d=c.length,e;while(d--){e=c[d].isConvex?c[d]:new Polygon.Vertex(c[d]);this.vertices.prepend(new LinkedList.Node(e))}this.clearCache();this.populateVertexTypeLists();return this},populateVertexTypeLists:function(){this.convexVertices=new LinkedList.Circular();this.reflexVertices=new LinkedList.Circular();var b=this;this.vertices.each(function(a){b[a.data.type(b)+'Vertices'].append(new LinkedList.Node(a.data))})},copyVertices:function(){this.clearCache();this.vertices.each(function(a){a.data=new Polygon.Vertex(a.data)});this.populateVertexTypeLists()},clearCache:function(){this.cached={triangles:null,surfaceIntegralElements:null}},setCache:function(a,b){this.cached[a]=b;return b},inspect:function(){var b=[];this.vertices.each(function(a){b.push(a.data.inspect())});return b.join(' -> ')}};Polygon.create=function(a,b){var c=new Polygon();return c.setVertices(a,b)};Polygon.Vertex=function(a){this.setElements(a);if(this.elements.length==2){this.elements.push(0)}if(this.elements.length!=3){return null}};Polygon.Vertex.prototype=new Vector;Polygon.Vertex.prototype.isConvex=function(a){var b=a.nodeFor(this);if(b===null){return null}var c=b.prev.data,d=b.next.data;var e=d.subtract(this);var f=c.subtract(this);var g=e.angleFrom(f);if(g<=Sylvester.precision){return true}if(Math.abs(g-Math.PI)<=Sylvester.precision){return false}return(e.cross(f).dot(a.plane.normal)>0)};Polygon.Vertex.prototype.isReflex=function(a){var b=this.isConvex(a);return(b===null)?null:!b};Polygon.Vertex.prototype.type=function(a){var b=this.isConvex(a);return(b===null)?null:(b?'convex':'reflex')};Polygon.Vertex.convert=function(a){var b=a.toArray?a.toArray():a;var c=[],d=b.length;for(var e=0;e<d;e++){c.push(new Polygon.Vertex(b[e]))}return c};function LinkedList(){}LinkedList.prototype={length:0,first:null,last:null,each:function(a){var b=this.first,c=this.length;for(var d=0;d<c;d++){a(b,d);b=b.next}},at:function(a){if(!(a>=0&&a<this.length)){return null}var b=this.first;while(a--){b=b.next}return b},randomNode:function(){var a=Math.floor(Math.random()*this.length);return this.at(a)},toArray:function(){var a=[],b=this.first,c=this.length;while(c--){a.push(b.data||b);b=b.next}return a}};LinkedList.Node=function(a){this.prev=null;this.next=null;this.data=a};LinkedList.Circular=function(){};LinkedList.Circular.Methods={append:function(a){if(this.first===null){a.prev=a;a.next=a;this.first=a;this.last=a}else{a.prev=this.last;a.next=this.first;this.first.prev=a;this.last.next=a;this.last=a}this.length++},prepend:function(a){if(this.first===null){this.append(a);return}else{a.prev=this.last;a.next=this.first;this.first.prev=a;this.last.next=a;this.first=a}this.length++},insertAfter:function(a,b){b.prev=a;b.next=a.next;a.next.prev=b;a.next=b;if(b.prev==this.last){this.last=b}this.length++},insertBefore:function(a,b){b.prev=a.prev;b.next=a;a.prev.next=b;a.prev=b;if(b.next==this.first){this.first=b}this.length++},remove:function(a){if(this.length>1){a.prev.next=a.next;a.next.prev=a.prev;if(a==this.first){this.first=a.next}if(a==this.last){this.last=a.prev}}else{this.first=null;this.last=null}a.prev=null;a.next=null;this.length--},withData:function(a){var b=this.first,c=this.last,d=Math.ceil(this.length/2);while(d--){if(b.data==a){return b}if(c.data==a){return c}b=b.next;c=c.prev}return null}};LinkedList.Circular.prototype=new LinkedList;for(var method in LinkedList.Circular.Methods){LinkedList.Circular.prototype[method]=LinkedList.Circular.Methods[method]}LinkedList.Circular.fromArray=function(a,b){var c=new LinkedList.Circular();var d=a.length;while(d--){c.prepend(b?new LinkedList.Node(a[d]):a[d])}return c};module.exports={$V:$V,$M:$M,$L:$L,$P:$P};
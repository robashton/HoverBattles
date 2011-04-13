
(function(/*! Stitch !*/) {
  if (!this.require) {
    var modules = {}, cache = {}, require = function(name, root) {
      var module = cache[name], path = expand(root, name), fn;
      if (module) {
        return module;
      } else if (fn = modules[path] || modules[path = expand(path, './index')]) {
        module = {id: name, exports: {}};
        try {
          cache[name] = module.exports;
          fn(module.exports, function(name) {
            return require(name, dirname(path));
          }, module);
          return cache[name] = module.exports;
        } catch (err) {
          delete cache[name];
          throw err;
        }
      } else {
        throw 'module \'' + name + '\' not found';
      }
    }, expand = function(root, name) {
      var results = [], parts, part;
      if (/^\.\.?(\/|$)/.test(name)) {
        parts = [root, name].join('/').split('/');
      } else {
        parts = name.split('/');
      }
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part == '..') {
          results.pop();
        } else if (part != '.' && part != '') {
          results.push(part);
        }
      }
      return results.join('/');
    }, dirname = function(path) {
      return path.split('/').slice(0, -1).join('/');
    };
    this.require = function(name) {
      return require(name, '');
    }
    this.require.define = function(bundle) {
      for (var key in bundle)
        modules[key] = bundle[key];
    };
  }
  return this.require.define;
}).call(this)({"camera": function(exports, require, module) {var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;


var Camera = function(location){
    this.location = location || vec3.create();
    this.lookAt = vec3.create();
    this.up = vec3.create([0,1,0]);
};


Camera.prototype.setLocation = function(location){
	this.location = location;
};

Camera.prototype.getProjectionMatrix = function(gl) {
	var projectionMatrix = mat4.create();
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 1024.0, projectionMatrix);
	return projectionMatrix;
};

Camera.prototype.getViewMatrix = function(){ 	
    var viewMatrix = mat4.create();
    mat4.lookAt(this.location, this.lookAt, this.up, viewMatrix);
	return viewMatrix;	
};

exports.Camera = Camera;}, "chasecamera": function(exports, require, module) {var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;

var ChaseCamera = {
  doLogic: function(){      
      var terrain = this._scene.getEntity("terrain");
      
     this._scene.camera.lookAt = this.position;
     
     var cameraTrail = vec3.create(this._velocity);
     cameraTrail[1] = 0;
     vec3.normalize(cameraTrail);
     vec3.scale(cameraTrail, 50);
     vec3.subtract(this.position, cameraTrail, cameraTrail);
     this._scene.camera.location = cameraTrail;
     
     var terrainHeightAtCameraLocation = terrain.getHeightAt(this._scene.camera.location[0], 
                                                             this._scene.camera.location[2]);
                            
     var cameraHeight = Math.max(terrainHeightAtCameraLocation + 15, this.position[1] + 15);
     
     this._scene.camera.location[1] =  cameraHeight;
  }    
};

exports.ChaseCamera = ChaseCamera;}, "clipping": function(exports, require, module) {var Clipping = {
  setBounds: function(min, max){
    this._min = min;
    this._max = max;
  },
  
  doLogic: function(){
    for(var i = 0 ; i < 3 ; i++){
        if(this.position[i] < this._min[i]) {
            this.position[i] = this._min[i];
            this._velocity[i] = 0; //-this._velocity[i];
        }
        else if(this.position[i] > this._max[i]) {
            this.position[i] = this._max[i];
            this._velocity[i] = 0; //-this._velocity[i];    
        }
    }
  }
    
};

exports.Clipping = Clipping;}, "controller": function(exports, require, module) {var Controller = function(scene) {
  this.scene = scene;
  this._timeAtLastFrame = new Date().getTime();
  this._idealTimePerFrame = 1000 / 30;
  this._leftover = 0.0;
  this._first = true;
};

Controller.prototype.tick = function(){
    var timeAtThisFrame = new Date().getTime();
    var timeSinceLastDoLogic = (timeAtThisFrame - this._timeAtLastFrame) + this._leftover;
	var catchUpFrameCount = Math.floor(timeSinceLastDoLogic / this._idealTimePerFrame);
	
    if(this._first) { catchUpFrameCount = 1; timeSinceLastDoLogic = this._idealTimePerFrame; this._first = false; }
	for(var i = 0 ; i < catchUpFrameCount; i++){
		this.scene.doLogic();
	}
	
	this._leftover = timeSinceLastDoLogic - (catchUpFrameCount * this._idealTimePerFrame);
	this._timeAtLastFrame = timeAtThisFrame;  
};

exports.Controller = Controller;}, "defaultmodelloader": function(exports, require, module) {var DefaultModelLoader = function(resources){
    this._resources = resources;
};

DefaultModelLoader.prototype.handles = function(path){
  return path.indexOf('.js') > -1;  
};

DefaultModelLoader.prototype.load = function(path, callback) {
    var model = new Model();
    var name = path.substr(0, path.length - 3);
    var loader = this;
    LazyLoad.js('/models/' + path, function () {
        model.setData({
             vertices: BlenderExport[name].vertices,
             indices: BlenderExport[name].indices,
             texCoords: BlenderExport[name].texCoords,
             normals: BlenderExport[name].normals,
             texture: loader._resources.getTexture("/textures/" + name + ".jpg")
         });
         callback();
    });
    
    return model;
};

exports.DefaultModelLoader = DefaultModelLoader;}, "defaulttextureloader": function(exports, require, module) {var DefaultTextureLoader = function(app){
    this._app = app;  
};

DefaultTextureLoader.prototype.load = function(path, callback) {

  var image = new Image();
  image.onload = function(){
    callback();  
  };
  
  image.src = path;
  var texture = new Texture(path, image);
  return texture; 
};

exports.DefaultTextureLoader = DefaultTextureLoader;}, "entity": function(exports, require, module) {var vec3 = require('../glmatrix').vec3;
var mat4 = require('../glmatrix').mat4;
var mat3 = require('./glmatrix').mat4;

var Entity = function(id){
    this._model = null;
	this._id = id;
	this.position = vec3.create();
    this.rotationY = 0;
	this._scene = null;
};

Entity.prototype.getId = function(){
	return this._id;
};

Entity.prototype.setModel = function(model) {
   this._model = model;  
};

Entity.prototype.getModel = function(){
	return this._model;
};

Entity.prototype.attach = function(component) {
    for(i in component){
        if(i == "doLogic"){
            var newLogic = component[i];
            var oldLogic = this.doLogic;
            this.doLogic = function(){
              oldLogic.call(this);
              newLogic.call(this);
            };
        }
        else {
            this[i] = component[i]; 
        }
    }
};

Entity.prototype.doLogic = function() { };

Entity.prototype.setScene = function(scene) {
	this._scene = scene;
};

Entity.prototype.render = function(context){
    if(!this._model) { return; }
	var gl = context.gl;

	var viewMatrix = this._scene.camera.getViewMatrix();
	var projectionMatrix = this._scene.camera.getProjectionMatrix(gl);
    
	var worldMatrix = mat4.create();
    mat4.identity(worldMatrix);
    mat4.translate(worldMatrix, this.position);
    mat4.rotateY(worldMatrix, this.rotationY);
    
    var modelViewMatrix = mat4.create();
    mat4.multiply(worldMatrix,viewMatrix, modelViewMatrix);
    
    var normalMatrix = mat3.create();
    mat4.toInverseMat3(worldMatrix, normalMatrix);
    mat3.transpose(normalMatrix);

	var program = context.setActiveProgram(this._model.getProgram());
    
	this._model.upload(context);

	gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), false, projectionMatrix);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "uView"), false, viewMatrix);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "uWorld"), false, worldMatrix);
    gl.uniformMatrix3fv(gl.getUniformLocation(program, "uNormal"), false, normalMatrix);

	this._model.render(context);
};

exports.Entity = Entity;
}, "glmatrix": function(exports, require, module) {// glMatrix v0.9.5
glMatrixArrayType=typeof Float32Array!="undefined"?Float32Array:typeof WebGLFloatArray!="undefined"?WebGLFloatArray:Array;var vec3={};vec3.create=function(a){var b=new glMatrixArrayType(3);if(a){b[0]=a[0];b[1]=a[1];b[2]=a[2]}return b};vec3.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];return b};vec3.add=function(a,b,c){if(!c||a==c){a[0]+=b[0];a[1]+=b[1];a[2]+=b[2];return a}c[0]=a[0]+b[0];c[1]=a[1]+b[1];c[2]=a[2]+b[2];return c};
vec3.subtract=function(a,b,c){if(!c||a==c){a[0]-=b[0];a[1]-=b[1];a[2]-=b[2];return a}c[0]=a[0]-b[0];c[1]=a[1]-b[1];c[2]=a[2]-b[2];return c};vec3.negate=function(a,b){b||(b=a);b[0]=-a[0];b[1]=-a[1];b[2]=-a[2];return b};vec3.scale=function(a,b,c){if(!c||a==c){a[0]*=b;a[1]*=b;a[2]*=b;return a}c[0]=a[0]*b;c[1]=a[1]*b;c[2]=a[2]*b;return c};
vec3.normalize=function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=Math.sqrt(c*c+d*d+e*e);if(g){if(g==1){b[0]=c;b[1]=d;b[2]=e;return b}}else{b[0]=0;b[1]=0;b[2]=0;return b}g=1/g;b[0]=c*g;b[1]=d*g;b[2]=e*g;return b};vec3.cross=function(a,b,c){c||(c=a);var d=a[0],e=a[1];a=a[2];var g=b[0],f=b[1];b=b[2];c[0]=e*b-a*f;c[1]=a*g-d*b;c[2]=d*f-e*g;return c};vec3.length=function(a){var b=a[0],c=a[1];a=a[2];return Math.sqrt(b*b+c*c+a*a)};vec3.dot=function(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]};
vec3.direction=function(a,b,c){c||(c=a);var d=a[0]-b[0],e=a[1]-b[1];a=a[2]-b[2];b=Math.sqrt(d*d+e*e+a*a);if(!b){c[0]=0;c[1]=0;c[2]=0;return c}b=1/b;c[0]=d*b;c[1]=e*b;c[2]=a*b;return c};vec3.lerp=function(a,b,c,d){d||(d=a);d[0]=a[0]+c*(b[0]-a[0]);d[1]=a[1]+c*(b[1]-a[1]);d[2]=a[2]+c*(b[2]-a[2]);return d};vec3.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+"]"};var mat3={};
mat3.create=function(a){var b=new glMatrixArrayType(9);if(a){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9]}return b};mat3.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];return b};mat3.identity=function(a){a[0]=1;a[1]=0;a[2]=0;a[3]=0;a[4]=1;a[5]=0;a[6]=0;a[7]=0;a[8]=1;return a};
mat3.transpose=function(a,b){if(!b||a==b){var c=a[1],d=a[2],e=a[5];a[1]=a[3];a[2]=a[6];a[3]=c;a[5]=a[7];a[6]=d;a[7]=e;return a}b[0]=a[0];b[1]=a[3];b[2]=a[6];b[3]=a[1];b[4]=a[4];b[5]=a[7];b[6]=a[2];b[7]=a[5];b[8]=a[8];return b};mat3.toMat4=function(a,b){b||(b=mat4.create());b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=0;b[4]=a[3];b[5]=a[4];b[6]=a[5];b[7]=0;b[8]=a[6];b[9]=a[7];b[10]=a[8];b[11]=0;b[12]=0;b[13]=0;b[14]=0;b[15]=1;return b};
mat3.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+", "+a[4]+", "+a[5]+", "+a[6]+", "+a[7]+", "+a[8]+"]"};var mat4={};mat4.create=function(a){var b=new glMatrixArrayType(16);if(a){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=a[12];b[13]=a[13];b[14]=a[14];b[15]=a[15]}return b};
mat4.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=a[12];b[13]=a[13];b[14]=a[14];b[15]=a[15];return b};mat4.identity=function(a){a[0]=1;a[1]=0;a[2]=0;a[3]=0;a[4]=0;a[5]=1;a[6]=0;a[7]=0;a[8]=0;a[9]=0;a[10]=1;a[11]=0;a[12]=0;a[13]=0;a[14]=0;a[15]=1;return a};
mat4.transpose=function(a,b){if(!b||a==b){var c=a[1],d=a[2],e=a[3],g=a[6],f=a[7],h=a[11];a[1]=a[4];a[2]=a[8];a[3]=a[12];a[4]=c;a[6]=a[9];a[7]=a[13];a[8]=d;a[9]=g;a[11]=a[14];a[12]=e;a[13]=f;a[14]=h;return a}b[0]=a[0];b[1]=a[4];b[2]=a[8];b[3]=a[12];b[4]=a[1];b[5]=a[5];b[6]=a[9];b[7]=a[13];b[8]=a[2];b[9]=a[6];b[10]=a[10];b[11]=a[14];b[12]=a[3];b[13]=a[7];b[14]=a[11];b[15]=a[15];return b};
mat4.determinant=function(a){var b=a[0],c=a[1],d=a[2],e=a[3],g=a[4],f=a[5],h=a[6],i=a[7],j=a[8],k=a[9],l=a[10],o=a[11],m=a[12],n=a[13],p=a[14];a=a[15];return m*k*h*e-j*n*h*e-m*f*l*e+g*n*l*e+j*f*p*e-g*k*p*e-m*k*d*i+j*n*d*i+m*c*l*i-b*n*l*i-j*c*p*i+b*k*p*i+m*f*d*o-g*n*d*o-m*c*h*o+b*n*h*o+g*c*p*o-b*f*p*o-j*f*d*a+g*k*d*a+j*c*h*a-b*k*h*a-g*c*l*a+b*f*l*a};
mat4.inverse=function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=a[3],f=a[4],h=a[5],i=a[6],j=a[7],k=a[8],l=a[9],o=a[10],m=a[11],n=a[12],p=a[13],r=a[14],s=a[15],A=c*h-d*f,B=c*i-e*f,t=c*j-g*f,u=d*i-e*h,v=d*j-g*h,w=e*j-g*i,x=k*p-l*n,y=k*r-o*n,z=k*s-m*n,C=l*r-o*p,D=l*s-m*p,E=o*s-m*r,q=1/(A*E-B*D+t*C+u*z-v*y+w*x);b[0]=(h*E-i*D+j*C)*q;b[1]=(-d*E+e*D-g*C)*q;b[2]=(p*w-r*v+s*u)*q;b[3]=(-l*w+o*v-m*u)*q;b[4]=(-f*E+i*z-j*y)*q;b[5]=(c*E-e*z+g*y)*q;b[6]=(-n*w+r*t-s*B)*q;b[7]=(k*w-o*t+m*B)*q;b[8]=(f*D-h*z+j*x)*q;
b[9]=(-c*D+d*z-g*x)*q;b[10]=(n*v-p*t+s*A)*q;b[11]=(-k*v+l*t-m*A)*q;b[12]=(-f*C+h*y-i*x)*q;b[13]=(c*C-d*y+e*x)*q;b[14]=(-n*u+p*B-r*A)*q;b[15]=(k*u-l*B+o*A)*q;return b};mat4.toRotationMat=function(a,b){b||(b=mat4.create());b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];b[4]=a[4];b[5]=a[5];b[6]=a[6];b[7]=a[7];b[8]=a[8];b[9]=a[9];b[10]=a[10];b[11]=a[11];b[12]=0;b[13]=0;b[14]=0;b[15]=1;return b};
mat4.toMat3=function(a,b){b||(b=mat3.create());b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[4];b[4]=a[5];b[5]=a[6];b[6]=a[8];b[7]=a[9];b[8]=a[10];return b};mat4.toInverseMat3=function(a,b){var c=a[0],d=a[1],e=a[2],g=a[4],f=a[5],h=a[6],i=a[8],j=a[9],k=a[10],l=k*f-h*j,o=-k*g+h*i,m=j*g-f*i,n=c*l+d*o+e*m;if(!n)return null;n=1/n;b||(b=mat3.create());b[0]=l*n;b[1]=(-k*d+e*j)*n;b[2]=(h*d-e*f)*n;b[3]=o*n;b[4]=(k*c-e*i)*n;b[5]=(-h*c+e*g)*n;b[6]=m*n;b[7]=(-j*c+d*i)*n;b[8]=(f*c-d*g)*n;return b};
mat4.multiply=function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2],f=a[3],h=a[4],i=a[5],j=a[6],k=a[7],l=a[8],o=a[9],m=a[10],n=a[11],p=a[12],r=a[13],s=a[14];a=a[15];var A=b[0],B=b[1],t=b[2],u=b[3],v=b[4],w=b[5],x=b[6],y=b[7],z=b[8],C=b[9],D=b[10],E=b[11],q=b[12],F=b[13],G=b[14];b=b[15];c[0]=A*d+B*h+t*l+u*p;c[1]=A*e+B*i+t*o+u*r;c[2]=A*g+B*j+t*m+u*s;c[3]=A*f+B*k+t*n+u*a;c[4]=v*d+w*h+x*l+y*p;c[5]=v*e+w*i+x*o+y*r;c[6]=v*g+w*j+x*m+y*s;c[7]=v*f+w*k+x*n+y*a;c[8]=z*d+C*h+D*l+E*p;c[9]=z*e+C*i+D*o+E*r;c[10]=z*
g+C*j+D*m+E*s;c[11]=z*f+C*k+D*n+E*a;c[12]=q*d+F*h+G*l+b*p;c[13]=q*e+F*i+G*o+b*r;c[14]=q*g+F*j+G*m+b*s;c[15]=q*f+F*k+G*n+b*a;return c};mat4.multiplyVec3=function(a,b,c){c||(c=b);var d=b[0],e=b[1];b=b[2];c[0]=a[0]*d+a[4]*e+a[8]*b+a[12];c[1]=a[1]*d+a[5]*e+a[9]*b+a[13];c[2]=a[2]*d+a[6]*e+a[10]*b+a[14];return c};
mat4.multiplyVec4=function(a,b,c){c||(c=b);var d=b[0],e=b[1],g=b[2];b=b[3];c[0]=a[0]*d+a[4]*e+a[8]*g+a[12]*b;c[1]=a[1]*d+a[5]*e+a[9]*g+a[13]*b;c[2]=a[2]*d+a[6]*e+a[10]*g+a[14]*b;c[3]=a[3]*d+a[7]*e+a[11]*g+a[15]*b;return c};
mat4.translate=function(a,b,c){var d=b[0],e=b[1];b=b[2];if(!c||a==c){a[12]=a[0]*d+a[4]*e+a[8]*b+a[12];a[13]=a[1]*d+a[5]*e+a[9]*b+a[13];a[14]=a[2]*d+a[6]*e+a[10]*b+a[14];a[15]=a[3]*d+a[7]*e+a[11]*b+a[15];return a}var g=a[0],f=a[1],h=a[2],i=a[3],j=a[4],k=a[5],l=a[6],o=a[7],m=a[8],n=a[9],p=a[10],r=a[11];c[0]=g;c[1]=f;c[2]=h;c[3]=i;c[4]=j;c[5]=k;c[6]=l;c[7]=o;c[8]=m;c[9]=n;c[10]=p;c[11]=r;c[12]=g*d+j*e+m*b+a[12];c[13]=f*d+k*e+n*b+a[13];c[14]=h*d+l*e+p*b+a[14];c[15]=i*d+o*e+r*b+a[15];return c};
mat4.scale=function(a,b,c){var d=b[0],e=b[1];b=b[2];if(!c||a==c){a[0]*=d;a[1]*=d;a[2]*=d;a[3]*=d;a[4]*=e;a[5]*=e;a[6]*=e;a[7]*=e;a[8]*=b;a[9]*=b;a[10]*=b;a[11]*=b;return a}c[0]=a[0]*d;c[1]=a[1]*d;c[2]=a[2]*d;c[3]=a[3]*d;c[4]=a[4]*e;c[5]=a[5]*e;c[6]=a[6]*e;c[7]=a[7]*e;c[8]=a[8]*b;c[9]=a[9]*b;c[10]=a[10]*b;c[11]=a[11]*b;c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15];return c};
mat4.rotate=function(a,b,c,d){var e=c[0],g=c[1];c=c[2];var f=Math.sqrt(e*e+g*g+c*c);if(!f)return null;if(f!=1){f=1/f;e*=f;g*=f;c*=f}var h=Math.sin(b),i=Math.cos(b),j=1-i;b=a[0];f=a[1];var k=a[2],l=a[3],o=a[4],m=a[5],n=a[6],p=a[7],r=a[8],s=a[9],A=a[10],B=a[11],t=e*e*j+i,u=g*e*j+c*h,v=c*e*j-g*h,w=e*g*j-c*h,x=g*g*j+i,y=c*g*j+e*h,z=e*c*j+g*h;e=g*c*j-e*h;g=c*c*j+i;if(d){if(a!=d){d[12]=a[12];d[13]=a[13];d[14]=a[14];d[15]=a[15]}}else d=a;d[0]=b*t+o*u+r*v;d[1]=f*t+m*u+s*v;d[2]=k*t+n*u+A*v;d[3]=l*t+p*u+B*
v;d[4]=b*w+o*x+r*y;d[5]=f*w+m*x+s*y;d[6]=k*w+n*x+A*y;d[7]=l*w+p*x+B*y;d[8]=b*z+o*e+r*g;d[9]=f*z+m*e+s*g;d[10]=k*z+n*e+A*g;d[11]=l*z+p*e+B*g;return d};mat4.rotateX=function(a,b,c){var d=Math.sin(b);b=Math.cos(b);var e=a[4],g=a[5],f=a[6],h=a[7],i=a[8],j=a[9],k=a[10],l=a[11];if(c){if(a!=c){c[0]=a[0];c[1]=a[1];c[2]=a[2];c[3]=a[3];c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15]}}else c=a;c[4]=e*b+i*d;c[5]=g*b+j*d;c[6]=f*b+k*d;c[7]=h*b+l*d;c[8]=e*-d+i*b;c[9]=g*-d+j*b;c[10]=f*-d+k*b;c[11]=h*-d+l*b;return c};
mat4.rotateY=function(a,b,c){var d=Math.sin(b);b=Math.cos(b);var e=a[0],g=a[1],f=a[2],h=a[3],i=a[8],j=a[9],k=a[10],l=a[11];if(c){if(a!=c){c[4]=a[4];c[5]=a[5];c[6]=a[6];c[7]=a[7];c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15]}}else c=a;c[0]=e*b+i*-d;c[1]=g*b+j*-d;c[2]=f*b+k*-d;c[3]=h*b+l*-d;c[8]=e*d+i*b;c[9]=g*d+j*b;c[10]=f*d+k*b;c[11]=h*d+l*b;return c};
mat4.rotateZ=function(a,b,c){var d=Math.sin(b);b=Math.cos(b);var e=a[0],g=a[1],f=a[2],h=a[3],i=a[4],j=a[5],k=a[6],l=a[7];if(c){if(a!=c){c[8]=a[8];c[9]=a[9];c[10]=a[10];c[11]=a[11];c[12]=a[12];c[13]=a[13];c[14]=a[14];c[15]=a[15]}}else c=a;c[0]=e*b+i*d;c[1]=g*b+j*d;c[2]=f*b+k*d;c[3]=h*b+l*d;c[4]=e*-d+i*b;c[5]=g*-d+j*b;c[6]=f*-d+k*b;c[7]=h*-d+l*b;return c};
mat4.frustum=function(a,b,c,d,e,g,f){f||(f=mat4.create());var h=b-a,i=d-c,j=g-e;f[0]=e*2/h;f[1]=0;f[2]=0;f[3]=0;f[4]=0;f[5]=e*2/i;f[6]=0;f[7]=0;f[8]=(b+a)/h;f[9]=(d+c)/i;f[10]=-(g+e)/j;f[11]=-1;f[12]=0;f[13]=0;f[14]=-(g*e*2)/j;f[15]=0;return f};mat4.perspective=function(a,b,c,d,e){a=c*Math.tan(a*Math.PI/360);b=a*b;return mat4.frustum(-b,b,-a,a,c,d,e)};
mat4.ortho=function(a,b,c,d,e,g,f){f||(f=mat4.create());var h=b-a,i=d-c,j=g-e;f[0]=2/h;f[1]=0;f[2]=0;f[3]=0;f[4]=0;f[5]=2/i;f[6]=0;f[7]=0;f[8]=0;f[9]=0;f[10]=-2/j;f[11]=0;f[12]=-(a+b)/h;f[13]=-(d+c)/i;f[14]=-(g+e)/j;f[15]=1;return f};
mat4.lookAt=function(a,b,c,d){d||(d=mat4.create());var e=a[0],g=a[1];a=a[2];var f=c[0],h=c[1],i=c[2];c=b[1];var j=b[2];if(e==b[0]&&g==c&&a==j)return mat4.identity(d);var k,l,o,m;c=e-b[0];j=g-b[1];b=a-b[2];m=1/Math.sqrt(c*c+j*j+b*b);c*=m;j*=m;b*=m;k=h*b-i*j;i=i*c-f*b;f=f*j-h*c;if(m=Math.sqrt(k*k+i*i+f*f)){m=1/m;k*=m;i*=m;f*=m}else f=i=k=0;h=j*f-b*i;l=b*k-c*f;o=c*i-j*k;if(m=Math.sqrt(h*h+l*l+o*o)){m=1/m;h*=m;l*=m;o*=m}else o=l=h=0;d[0]=k;d[1]=h;d[2]=c;d[3]=0;d[4]=i;d[5]=l;d[6]=j;d[7]=0;d[8]=f;d[9]=
o;d[10]=b;d[11]=0;d[12]=-(k*e+i*g+f*a);d[13]=-(h*e+l*g+o*a);d[14]=-(c*e+j*g+b*a);d[15]=1;return d};mat4.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+", "+a[4]+", "+a[5]+", "+a[6]+", "+a[7]+", "+a[8]+", "+a[9]+", "+a[10]+", "+a[11]+", "+a[12]+", "+a[13]+", "+a[14]+", "+a[15]+"]"};quat4={};quat4.create=function(a){var b=new glMatrixArrayType(4);if(a){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3]}return b};quat4.set=function(a,b){b[0]=a[0];b[1]=a[1];b[2]=a[2];b[3]=a[3];return b};
quat4.calculateW=function(a,b){var c=a[0],d=a[1],e=a[2];if(!b||a==b){a[3]=-Math.sqrt(Math.abs(1-c*c-d*d-e*e));return a}b[0]=c;b[1]=d;b[2]=e;b[3]=-Math.sqrt(Math.abs(1-c*c-d*d-e*e));return b};quat4.inverse=function(a,b){if(!b||a==b){a[0]*=1;a[1]*=1;a[2]*=1;return a}b[0]=-a[0];b[1]=-a[1];b[2]=-a[2];b[3]=a[3];return b};quat4.length=function(a){var b=a[0],c=a[1],d=a[2];a=a[3];return Math.sqrt(b*b+c*c+d*d+a*a)};
quat4.normalize=function(a,b){b||(b=a);var c=a[0],d=a[1],e=a[2],g=a[3],f=Math.sqrt(c*c+d*d+e*e+g*g);if(f==0){b[0]=0;b[1]=0;b[2]=0;b[3]=0;return b}f=1/f;b[0]=c*f;b[1]=d*f;b[2]=e*f;b[3]=g*f;return b};quat4.multiply=function(a,b,c){c||(c=a);var d=a[0],e=a[1],g=a[2];a=a[3];var f=b[0],h=b[1],i=b[2];b=b[3];c[0]=d*b+a*f+e*i-g*h;c[1]=e*b+a*h+g*f-d*i;c[2]=g*b+a*i+d*h-e*f;c[3]=a*b-d*f-e*h-g*i;return c};
quat4.multiplyVec3=function(a,b,c){c||(c=b);var d=b[0],e=b[1],g=b[2];b=a[0];var f=a[1],h=a[2];a=a[3];var i=a*d+f*g-h*e,j=a*e+h*d-b*g,k=a*g+b*e-f*d;d=-b*d-f*e-h*g;c[0]=i*a+d*-b+j*-h-k*-f;c[1]=j*a+d*-f+k*-b-i*-h;c[2]=k*a+d*-h+i*-f-j*-b;return c};quat4.toMat3=function(a,b){b||(b=mat3.create());var c=a[0],d=a[1],e=a[2],g=a[3],f=c+c,h=d+d,i=e+e,j=c*f,k=c*h;c=c*i;var l=d*h;d=d*i;e=e*i;f=g*f;h=g*h;g=g*i;b[0]=1-(l+e);b[1]=k-g;b[2]=c+h;b[3]=k+g;b[4]=1-(j+e);b[5]=d-f;b[6]=c-h;b[7]=d+f;b[8]=1-(j+l);return b};
quat4.toMat4=function(a,b){b||(b=mat4.create());var c=a[0],d=a[1],e=a[2],g=a[3],f=c+c,h=d+d,i=e+e,j=c*f,k=c*h;c=c*i;var l=d*h;d=d*i;e=e*i;f=g*f;h=g*h;g=g*i;b[0]=1-(l+e);b[1]=k-g;b[2]=c+h;b[3]=0;b[4]=k+g;b[5]=1-(j+e);b[6]=d-f;b[7]=0;b[8]=c-h;b[9]=d+f;b[10]=1-(j+l);b[11]=0;b[12]=0;b[13]=0;b[14]=0;b[15]=1;return b};quat4.slerp=function(a,b,c,d){d||(d=a);var e=c;if(a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3]<0)e=-1*c;d[0]=1-c*a[0]+e*b[0];d[1]=1-c*a[1]+e*b[1];d[2]=1-c*a[2]+e*b[2];d[3]=1-c*a[3]+e*b[3];return d};
quat4.str=function(a){return"["+a[0]+", "+a[1]+", "+a[2]+", "+a[3]+"]"};

exports.glMatrixArrayType = glMatrixArrayType;
exports.vec3 = vec3;
exports.quat4 = quat4;
exports.mat4 = mat4;
exports.mat3 = mat3;
}, "hovercraft": function(exports, require, module) {var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;

var Hovercraft = {
    _velocity: vec3.create([0.01,0,0.01]),
    _decay: 0.97,
    impulseForward: function(amount) {
        var accelerationZ = (-amount) * Math.cos(this.rotationY);
        var accelerationX = (-amount) * Math.sin(this.rotationY);
        var acceleration = vec3.create([accelerationX, 0, accelerationZ]);
        vec3.add(this._velocity, acceleration);
    },
    impulseBackward: function(amount) {
        var accelerationZ = (amount) * Math.cos(this.rotationY);
        var accelerationX = (amount) * Math.sin(this.rotationY);
        var acceleration = vec3.create([accelerationX, 0, accelerationZ]);
        vec3.add(this._velocity, acceleration);
    },
    impulseLeft: function(amount) {
        this.rotationY += amount;
    },
    impulseRight: function(amount) {
        this.rotationY -= amount;
    },
    impulseUp: function(amount) {
        var terrain = this._scene.getEntity("terrain");
        
        var terrainHeight = terrain.getHeightAt(this.position[0], this.position[2]);
        var heightDelta = this.position[1] - terrainHeight;
        
        if(heightDelta < 20.0) {
            this._velocity[1] += amount;
        }
    },
    doLogic: function() {
        var terrain = this._scene.getEntity("terrain");
        vec3.add(this.position, this._velocity);
                     
        var terrainHeight =  terrain.getHeightAt(this.position[0], this.position[2]);  
        var heightDelta = this.position[1] - terrainHeight;
        
        if(heightDelta < 0) {
            this.position[1] = terrainHeight;   
        }
         
         if(heightDelta < 10.0){
               this._velocity[1] += (10.0 - heightDelta) * 0.08;
         }
         this._velocity[1] -= 0.07;              
         vec3.scale(this._velocity, this._decay);    
         
    }
}
         
exports.Hovercraft = Hovercraft;
         

}, "hovercraftcontroller": function(exports, require, module) {var KeyCodes = {S:83,X:88, W: 87, D: 68, A: 65, Space: 32};

var HovercraftController = {
    doLogic: function(){        
        if(KeyboardStates[KeyCodes.W]) {
		    this.impulseForward(0.2);
    	} 
        else if(KeyboardStates[KeyCodes.S]) {
        	this.impulseBackward(0.1);
    	}    
    	if(KeyboardStates[KeyCodes.D]) {
        	this.impulseRight(0.05);
    	}
        else if(KeyboardStates[KeyCodes.A]) {
            this.impulseLeft(0.05);
    	}
        if(KeyboardStates[KeyCodes.Space]) {
            this.impulseUp(1.0);
        }
    }
};

exports.HovercraftControllre = HovercraftController;
exports.KeyCodes = KeyCodes;}, "hovercraftfactory": function(exports, require, module) {var Entity = require('./entity').Entity;

var HovercraftFactory = function(app){
  this._app = app;  
};

HovercraftFactory.prototype.create = function(id) {
  var model = this._app.resources.getModel("Hovercraft.js");
  var entity = new Entity(id);
  entity.setModel(model);
  //entity.attach(Clipping);
  entity.attach(Hovercraft);
  
  //entity.setBounds([-1000,-1000, -1000], [1000,1000,1000]);
  return entity;
};

exports.HovercraftFactory = HovercraftFactory;}, "keyboard": function(exports, require, module) {var KeyboardStates = {};

document.onkeydown = function(event) { 
    KeyboardStates[event.keyCode] = true;   

};
document.onkeyup = function(event) { 
    KeyboardStates[event.keyCode] = false;
};

exports.KeyboardStates = KeyboardStates;}, "landchunk": function(exports, require, module) {var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;

var LandChunk = function(width, height, maxHeight, scale,x,y){
    this._maxHeight = maxHeight;
	this._width = width;
	this._height = height;
	this._x = x;
	this._y = y;
    this._scale = scale;

	this._vertexBuffer = null;
	this._indexBuffer = null;
	this._indexCount = 0;
	this._colourBuffer = null;
	this._texturecoordsBuffer = null;
	
	this._texture = null;
    this._detailtexture = null;
    this._hovertexture = null;
    this._data = null;
    
    this._frame = 0.0;
    this._playerPosition = vec3.create();
};

LandChunk.prototype.getProgram = function(){
    return "landscape";
};

LandChunk.prototype.loadTextures = function(resources) {
    this._texture = resources.getTexture("/textures/gridlow.jpg");
    this._detailtexture = resources.getTexture("/textures/gridhigh.jpg");
    this._hovertexture = resources.getTexture("/textures/bars.jpg");
};

LandChunk.prototype.setData = function(data) {
    this._data = data;
};

LandChunk.prototype.activate = function(context) {
    var gl = context.gl;
  	 
	this._vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._data.vertices), gl.STATIC_DRAW)

	this._colourBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._data.colours), gl.STATIC_DRAW)
	
	this._texturecoordsBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this._texturecoordsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._data.texturecoords), gl.STATIC_DRAW)

	this._indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._data.indices), gl.STATIC_DRAW);

	this._indexCount = this._data.indices.length;    	
};

LandChunk.prototype.upload = function(context) {
    var gl = context.gl;
	var program = context.program;

	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));

	gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexColour'), 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexColour'));
			
	gl.bindBuffer(gl.ARRAY_BUFFER, this._texturecoordsBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aTextureCoords'), 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aTextureCoords'));

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
	
    gl.uniform1f(gl.getUniformLocation(program, 'time'), this._frame);         
    gl.uniform3f(gl.getUniformLocation(program, 'uPlayerPosition'), this._playerPosition[0], this._playerPosition[1], this._playerPosition[2]);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this._texture.get());
	gl.uniform1i(gl.getUniformLocation(program, 'uDiffuseSampler'), 0); 
	
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._detailtexture.get());
    gl.uniform1i(gl.getUniformLocation(program, 'uDetailSampler'), 1); 
    
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this._hovertexture.get());
    gl.uniform1i(gl.getUniformLocation(program, 'uHoverSampler'), 2); 

};

LandChunk.prototype.render = function(context) {
    this._frame++;
	var gl = context.gl;
	gl.drawElements(gl.TRIANGLE_STRIP, this._indexCount, gl.UNSIGNED_SHORT, 0);
};

LandChunk.prototype.getHeightAt = function(x, z) {
    if(!this._data) {
        return 6;
    }
    
    var heightmap = this._data.heights;
    
    // Transform to values we can (almost) index our array with
    var transformedX = x - this._x;
    var transformedZ = z - this._y;
    
    var baseX = Math.floor(transformedX);
    var baseZ = Math.floor(transformedZ);

    var horizontalWeight = transformedX - baseX;
    var verticalWeight = transformedZ - baseZ; 
    
    var leftX = baseX;
    var rightX = baseX + 1;
    var topX = baseZ; 
    var bottomX = baseZ + 1;
        
    var topLeft = heightmap[leftX + topX * this._width];
    var topRight = heightmap[rightX + topX * this._width];
    var bottomLeft = heightmap[leftX + bottomX * this._width];
    var bottomRight = heightmap[rightX + bottomX * this._width];
    
    var top = (horizontalWeight*topRight)+(1.0-horizontalWeight)*topLeft;
    var bottom = (horizontalWeight*bottomRight)+(1.0-horizontalWeight)*bottomLeft;
    
    return (verticalWeight*bottom)+(1.0-verticalWeight)*top;
};

exports.LandChunk = LandChunk;
}, "landchunkloader": function(exports, require, module) {var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;

var LandChunkModelLoader = function(resources){
    this._resources = resources;
};

LandChunkModelLoader.prototype.handles = function(path){
  return path.indexOf('chunk_') > -1;
};

LandChunkModelLoader.prototype.load = function(id, callback) {
    var data = JSON.parse(id.substr(6, id.length - 6));
    
    var url = '/Landscape&height=' + (data.height) +
	'&width=' + (data.width) + 
	'&maxheight=' + data.maxHeight + 
	'&scale=' + data.scale +
	'&startx=' + data.x + 
	'&starty=' + data.y;
    
    var model = new LandChunk(data.height, data.width, data.maxHeight, data.scale, data.x, data.y);
    model.loadTextures(this._resources);
    
    var loader = this;
    LazyLoad.js(url, function () {
        var data = blah.Land[url];
        model.setData(data);
        callback();
    });
    
    return model;
};

exports.LandChunkModelLoader = LandChunkModelLoader;}, "landscapecontroller": function(exports, require, module) {var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;

var LandscapeController = function(app){
  app.resources.addModelLoader(
        new LandChunkModelLoader(app.resources)
        );
  app.scene.addEntity(this);
  
  this.app = app;
  this._chunks = {};
  this._counter = 0;
  this._chunkWidth = 128;
  this._scale = 5;
};

LandscapeController.prototype.getId = function() {
  return "terrain";  
};

LandscapeController.prototype.getHeightAt = function(x, z) {
    x /= this._scale;
    z /= this._scale;        
    
    var currentChunkX = parseInt(x / this._chunkWidth) * this._chunkWidth;
    var currentChunkZ = parseInt(z / this._chunkWidth) * this._chunkWidth;
    
    if(x < 0) { currentChunkX -= this._chunkWidth; }
    if(z < 0) { currentChunkZ -= this._chunkWidth; }
    
    var key = currentChunkX + '_' + currentChunkZ
    
    var chunk = this._chunks[key];
    if(chunk)
    {
        return chunk.getHeightAt(x, z);
    }
    else
    {
        return 20; // FTW
    }    
};

LandscapeController.prototype.doLogic = function(){
    if(this._counter++ % 10 != 0) { return ; }
    
    var app = this.app,
    scene = this.app.scene;
    
    var player = scene.getEntity("player");
        
    var currentx = scene.camera.location[0] / this._scale;
	var currentz = scene.camera.location[2] / this._scale;

	var currentChunkX = Math.floor(currentx / this._chunkWidth) * this._chunkWidth;
	var currentChunkZ = Math.floor(currentz / this._chunkWidth) * this._chunkWidth;

	// Remove dead chunks
	var minX = currentChunkX - (this._chunkWidth);
	var minZ = currentChunkZ - (this._chunkWidth);
	var maxX = currentChunkX + (this._chunkWidth);
	var maxZ = currentChunkZ + (this._chunkWidth);

	for(i in this._chunks){
		var chunk = this._chunks[i];
    	
        // chunk._model._playerPosition = player.position;

		if(chunk.x < minX || chunk.z < minZ || chunk.x > maxX || chunk.z > maxZ) {
			//this._scene.removeEntity(chunk);
            //delete this._chunks[i];		
		}    	
	}

	for(var x = minX; x <= maxX ; x += this._chunkWidth) {
		for(var z = minZ; z <= maxZ ; z += this._chunkWidth) {
			var key = x + '_' + z;
			if(this._chunks[key]) { continue; }
            
            var data = 'chunk_' + JSON.stringify({
               height: this._chunkWidth + 1,
               width: this._chunkWidth + 1,
               maxHeight: 100,
               scale: this._scale,
               x: x,
               y: z               
            })

            var model = app.resources.getModel(data);
			var chunkEntity = new Entity('Chunk_' + key);
            chunkEntity.setModel(model);
            chunkEntity.attach(LandChunkEntity);
			chunkEntity.x = x;
			chunkEntity.z = z;

			this._chunks[key] = chunkEntity;
			this.app.scene.addEntity(chunkEntity);			
		}
	}
};

LandChunkEntity = {
  getHeightAt: function(x,z){
   return this._model.getHeightAt(x,z);   
  }
};

// Interface segregation, I rather suspect I should do something about this in scene
LandscapeController.prototype.setScene = function(scene){};
LandscapeController.prototype.render = function(context){};

exports.LandscapeController = LandscapeController;
}, "model": function(exports, require, module) {var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;

var Model = function(data){
    this._programName = "default";
        
    if(data) { this.setData(data); }
	this._vertexBuffer = null;
	this._indexBuffer = null;
	this._colourBuffer = null;
    this._textureBuffer = null;
    this._normalBuffer = null;

    this._hasData = false;
};

Model.prototype.setData = function(data) {
    this._vertices = data.vertices;
    this._colours = data.colours;
	this._indices = data.indices;
    this._texCoords = data.texCoords;
    this._normals = data.normals;
    this._texture = data.texture;
    this._hasData = true;
    if(this._texCoords) { this._programName = "texture"; }
    else if( this._colours ) { this._programName = "colour"; }
};

Model.prototype.getProgram = function() {
	return this._programName;
};

Model.prototype.activate = function(context) {
	var gl = context.gl;

	this._vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._vertices), gl.STATIC_DRAW)

	if(this._colours) {
		this._colourBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._colours), gl.STATIC_DRAW)
	}
    if(this._texCoords) {
        this._textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._texCoords), gl.STATIC_DRAW)
    }
    
    if(this._normals) {
        this._normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._normals), gl.STATIC_DRAW)
    }

	this._indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._indices), gl.STATIC_DRAW);

};

Model.prototype.destroyBuffers = function(context) {
	var gl = context.gl;
	gl.deleteBuffer(this._vertexBuffer);
	gl.deleteBuffer(this._indexBuffer);

	if(this._colourBuffer) {
		gl.deleteBuffer(this._colourBuffer);
	}    
    if(this._textureBuffer) {
    	gl.deleteBuffer(this._textureBuffer);
    }  
    if(this._texture) {
        gl.deleteTexture(this._texture);
    }
    if(this._normalBuffer) {
        gl.deleteBuffer(this._normalBuffer);
    }

	this._vertexBuffer = null;
	this._indexBuffer = null;
	this._colourBuffer = null;
    this._textureBuffer = null;
    this._normalBuffer = null;
};


Model.prototype.getProgram = function() {
	return this._programName;
};

Model.prototype.upload = function(context) {
	var gl = context.gl;
	var program = context.program;

	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));

	if(this._colourBuffer) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
		gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexColour'), 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexColour'));
	}
    
    if(this._textureBuffer) {
    	gl.bindBuffer(gl.ARRAY_BUFFER, this._textureBuffer);
    	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aTextureCoords'), 2, gl.FLOAT, false, 0, 0);
    	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aTextureCoords'));
    }    
    
    if(this._normalBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
        gl.vertexAttribPointer(gl.getAttribLocation(program, 'aNormals'), 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aNormals'));
    }
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    
    if(this._texture){
       gl.activeTexture(gl.TEXTURE0);
       gl.bindTexture(gl.TEXTURE_2D, this._texture.get());
       gl.uniform1i(gl.getUniformLocation(program, 'uSampler'), 0);      
    }
};

Model.prototype.render = function(context) {
	var gl = context.gl;
	gl.drawElements(gl.TRIANGLES, this._indices.length , gl.UNSIGNED_SHORT, 0);
};

Model.Quad = function()
{
	return new Model({
				vertices: [			
				0.0, 0.0, 0, 
				1.0, 0.0, 0, 
				1.0, 1.0, 0, 
				0.0, 1.0, 0
				],
    			texCoords: [
        		    0.0, 0.0,
            	    1.0, 0.0,
                    1.0, 1.0,
                    0.0, 1.0
            	 ],
				indices: [0, 1, 2, 0, 2, 3]
			},
			"default"
		);
};

exports.Model = Model;

}, "rendercontext": function(exports, require, module) {var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;


var RenderContext = function(resourceLoader){
    this.gl = null;
	this.programs = {};
};

RenderContext.prototype.init = function(selector) {
  var canvas =  document.getElementById(selector);

  this.gl = canvas.getContext("experimental-webgl");

  this.gl.viewportWidth = canvas.width;
  this.gl.viewportHeight = canvas.height;  

  this.gl.clearColor(0.0, 0.5, 0.5, 1.0);
  this.gl.enable(this.gl.DEPTH_TEST);  
};

RenderContext.prototype.createProgram = function(programName) {
	
	var fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
	var vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
	
   this.gl.shaderSource(fragmentShader, blah.Shaders[programName].Fragment);
   this.gl.compileShader(fragmentShader);

   this.gl.shaderSource(vertexShader, blah.Shaders[programName].Shader);
   this.gl.compileShader(vertexShader);

	if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
		 throw this.gl.getShaderInfoLog(vertexShader);
	}
	if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
		 throw this.gl.getShaderInfoLog(fragmentShader);
	}

   var program = this.gl.createProgram();
	this.gl.attachShader(program, vertexShader);
   this.gl.attachShader(program, fragmentShader);
   this.gl.linkProgram(program);	

	if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
		throw "Couldn't create program";
	}	

	this.programs[programName] = program;
};


RenderContext.prototype.setActiveProgram = function(programName) {
	if(!this.programs[programName]) { this.createProgram(programName); }
	var program = this.programs[programName];

	this.gl.useProgram(program);
	this.program = program;
	return program;
}; 

exports.RenderContext = RenderContext;

}, "resources": function(exports, require, module) {var DefaultModelLoader = require('defaultmodelloader').DefaultModelLoader;
var DefaultTextureLoader = require('defaulttextureloader').DefaultTextureLoader;


var ResourceManager = function(app){
    this._app = app;
    this._modelLoaders = [];
    
    this._textureLoader = new DefaultTextureLoader(app);
    this._modelLoaders.push( new DefaultModelLoader(this) );
    
    this._textures = {};
    this._models = {};
    
    this._pendingTextureCount = 0;
    this._pendingModelCount = 0;
};

ResourceManager.prototype.getTexture = function(path){
    if(this._textures[path]) return this._textures[path];   
    
    var resources = this;
    resources._pendingTextureCount++;
    var texture = this._textureLoader.load(path, function(){
            resources._pendingTextureCount--;
            resources.registerForActivation(texture);
        });

    this._textures[path] = texture;
    return texture;    
};

ResourceManager.prototype.onAllAssetsLoaded = function(callback){
    var resources = this;
    var intervalId = setInterval(function(){      
      if( resources._pendingTextureCount == 0 &&
          resources._pendingModelCount == 0)
      {          
        clearInterval(intervalId);
        callback();
      }      
  }, 100);
    
};

ResourceManager.prototype.addModelLoader = function(loader) {
  this._modelLoaders.push(loader);  
};

ResourceManager.prototype.registerForActivation = function(resource) {
  resource.activate(this._app.context);
};

ResourceManager.prototype.getModel = function(path) {
    if(this._models[path]) return this._models[path];
    var resources = this;
    for(i in this._modelLoaders){
        var loader = this._modelLoaders[i];
        if(loader.handles(path)){
            resources._pendingModelCount++;
            var model = loader.load(path, function() {
                  resources._pendingModelCount--;
                  resources.registerForActivation(model);  
                });
            this._models[path] = model;
            return model;
        }
    }
};

exports.ResourceManager = ResourceManager;}, "scene": function(exports, require, module) {var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;

var Camera = require('./camera').Camera;

var Scene = function(){
    this._entities = {};
    this.camera = new Camera();
};

Scene.prototype.getEntity = function(id) {
  return this._entities[id];  
};

Scene.prototype.addEntity = function(entity){
    this._entities[entity.getId()] = entity;
	entity.setScene(this);
};

Scene.prototype.removeEntity = function(entity) {
	entity.setScene(undefined);
	delete this._entities[entity.getId()];
};

Scene.prototype.doLogic = function() {
    for(i in this._entities){
        this._entities[i].doLogic();
    }
};

Scene.prototype.render = function(context){
    var gl = context.gl;

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
 	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	for(var i in this._entities) {
		var entity = this._entities[i];
		entity.render(context);
	}  
};

exports.Scene = Scene;}, "texture": function(exports, require, module) {var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;

var Texture = function(name, image){
    this._data = null;
    this._image = image;
    this._name = name;
};

Texture.prototype.get = function(){
    return this._data;
};

Texture.prototype.activate = function(context) {
    var gl = context.gl;
    var data = gl.createTexture();
    this._data = data;
    
    data.image = this._image;
    gl.bindTexture(gl.TEXTURE_2D, data);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.GL_LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
};

exports.Texture = Texture;}});

/**
 * Bundled by jsDelivr using Rollup v4.62.2 and esbuild v0.28.1.
 * Original file: /npm/mesh-gradient.js@0.0.5/lib/index.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
var _={},y={},x={},D;function O(){if(D)return x;D=1;var S=x&&x.__spreadArray||function(l,b,u){if(u||arguments.length===2)for(var i=0,s=b.length,o;i<s;i++)(o||!(i in b))&&(o||(o=Array.prototype.slice.call(b,0,i)),o[i]=b[i]);return l.concat(o||Array.prototype.slice.call(b))};Object.defineProperty(x,"__esModule",{value:!0}),x.MiniGl=x.normalizeColor=void 0;function U(l){return[(l>>16&255)/255,(l>>8&255)/255,(255&l)/255]}x.normalizeColor=U,["SCREEN","LINEAR_LIGHT"].reduce(function(l,b,u){var i;return Object.assign(l,(i={},i[b]=u,i))},{});var L=(function(){function l(b,u,i,s){s===void 0&&(s=!1);var o=this,h=document.location.search.toLowerCase().indexOf("debug=webgl")!==-1;o.canvas=b,o.gl=o.canvas.getContext("webgl",{antialias:!0,preserveDrawingBuffer:!0}),o.meshes=[];var n=o.gl;u&&i&&this.setSize(u,i),o.lastDebugMsg,o.debug=s&&h?function(c){var a=new Date;a-o.lastDebugMsg>1e3&&console.log("---"),console.log.apply(console,S([a.toLocaleTimeString()+Array(Math.max(0,32-c.length)).join(" ")+c+": "],Array.from(arguments).slice(1),!1)),o.lastDebugMsg=a}:function(){},Object.defineProperties(o,{Material:{enumerable:!1,value:(function(){function c(a,r,e){e===void 0&&(e={});var t=this;function d(w,p){var g=n.createShader(w);return n.shaderSource(g,p),n.compileShader(g),n.getShaderParameter(g,n.COMPILE_STATUS)||console.error(n.getShaderInfoLog(g)),o.debug("Material.compileShaderSource",{source:p}),g}function v(w,p){return Object.entries(w).map(function(g){var C=g[0],z=g[1];return z.getDeclaration(C,p)}).join(`
`)}t.uniforms=e,t.uniformInstances=[];var f=`
              precision highp float;
            `;t.vertexSource=`
              `.concat(f,`
              attribute vec4 position;
              attribute vec2 uv;
              attribute vec2 uvNorm;
              `).concat(v(o.commonUniforms,"vertex"),`
              `).concat(v(e,"vertex"),`
              `).concat(a,`
            `),t.Source=`
              `.concat(f,`
              `).concat(v(o.commonUniforms,"fragment"),`
              `).concat(v(e,"fragment"),`
              `).concat(r,`
            `),t.vertexShader=d(n.VERTEX_SHADER,t.vertexSource),t.fragmentShader=d(n.FRAGMENT_SHADER,t.Source),t.program=n.createProgram(),n.attachShader(t.program,t.vertexShader),n.attachShader(t.program,t.fragmentShader),n.linkProgram(t.program),n.getProgramParameter(t.program,n.LINK_STATUS)||console.error(n.getProgramInfoLog(t.program)),n.useProgram(t.program),t.attachUniforms(void 0,o.commonUniforms),t.attachUniforms(void 0,t.uniforms)}return c.prototype.attachUniforms=function(a,r){var e=this;a===void 0?Object.entries(r).forEach(function(t){var d=t[0],v=t[1];e.attachUniforms(d,v)}):r.type=="array"?r.value.forEach(function(t,d){return e.attachUniforms("".concat(a,"[").concat(d,"]"),t)}):r.type=="struct"?Object.entries(r.value).forEach(function(t){var d=t[0],v=t[1];return e.attachUniforms("".concat(a,".").concat(d),v)}):(o.debug("Material.attachUniforms",{name:a,uniform:r}),e.uniformInstances.push({uniform:r,location:n.getUniformLocation(e.program,a)}))},c})()},Uniform:{enumerable:!1,value:(function(){function c(a){this.type="float",Object.assign(this,a),this.typeFn={float:"1f",int:"1i",vec2:"2fv",vec3:"3fv",vec4:"4fv",mat4:"Matrix4fv"}[this.type]||"1f",this.update()}return c.prototype.update=function(a){this.value!==void 0&&n["uniform".concat(this.typeFn)](a,this.typeFn.indexOf("Matrix")===0?this.transpose:this.value,this.typeFn.indexOf("Matrix")===0?this.value:null)},c.prototype.getDeclaration=function(a,r,e){var t=this;if(t.excludeFrom!==r){if(t.type==="array")return t.value[0].getDeclaration(a,r,t.value.length)+`
const int `.concat(a,"_length = ").concat(t.value.length,";");if(t.type==="struct"){var d=a.replace("u_","");return d=d.charAt(0).toUpperCase()+d.slice(1),"uniform struct ".concat(d,` 
                                  {
`)+Object.entries(t.value).map(function(v){var f=v[0],w=v[1];return w.getDeclaration(f,r).replace(/^uniform/,"")}).join("")+`
} `.concat(a).concat(e>0?"[".concat(e,"]"):"",";")}return"uniform ".concat(t.type," ").concat(a).concat(e>0?"[".concat(e,"]"):"",";")}},c})()},PlaneGeometry:{enumerable:!1,value:(function(){function c(a,r,e,t,d){n.createBuffer(),this.attributes={position:new o.Attribute({target:n.ARRAY_BUFFER,size:3}),uv:new o.Attribute({target:n.ARRAY_BUFFER,size:2}),uvNorm:new o.Attribute({target:n.ARRAY_BUFFER,size:2}),index:new o.Attribute({target:n.ELEMENT_ARRAY_BUFFER,size:3,type:n.UNSIGNED_SHORT})},this.setTopology(e,t),this.setSize(a,r,d)}return c.prototype.setTopology=function(a,r){a===void 0&&(a=1),r===void 0&&(r=1);var e=this;e.xSegCount=a,e.ySegCount=r,e.vertexCount=(e.xSegCount+1)*(e.ySegCount+1),e.quadCount=e.xSegCount*e.ySegCount*2,e.attributes.uv.values=new Float32Array(2*e.vertexCount),e.attributes.uvNorm.values=new Float32Array(2*e.vertexCount),e.attributes.index.values=new Uint16Array(3*e.quadCount);for(var t=0;t<=e.ySegCount;t++)for(var d=0;d<=e.xSegCount;d++){var v=t*(e.xSegCount+1)+d;if(e.attributes.uv.values[2*v]=d/e.xSegCount,e.attributes.uv.values[2*v+1]=1-t/e.ySegCount,e.attributes.uvNorm.values[2*v]=d/e.xSegCount*2-1,e.attributes.uvNorm.values[2*v+1]=1-t/e.ySegCount*2,d<e.xSegCount&&t<e.ySegCount){var f=t*e.xSegCount+d;e.attributes.index.values[6*f]=v,e.attributes.index.values[6*f+1]=v+1+e.xSegCount,e.attributes.index.values[6*f+2]=v+1,e.attributes.index.values[6*f+3]=v+1,e.attributes.index.values[6*f+4]=v+1+e.xSegCount,e.attributes.index.values[6*f+5]=v+2+e.xSegCount}}e.attributes.uv.update(),e.attributes.uvNorm.update(),e.attributes.index.update(),o.debug("Geometry.setTopology",{uv:e.attributes.uv,uvNorm:e.attributes.uvNorm,index:e.attributes.index})},c.prototype.setSize=function(a,r,e){a===void 0&&(a=1),r===void 0&&(r=1),e===void 0&&(e="xz");var t=this;t.width=a,t.height=r,t.orientation=e,t.attributes.position.values&&t.attributes.position.values.length===3*t.vertexCount||(t.attributes.position.values=new Float32Array(3*t.vertexCount));for(var d=a/-2,v=r/-2,f=a/t.xSegCount,w=r/t.ySegCount,p=0;p<=t.ySegCount;p++)for(var g=v+p*w,C=0;C<=t.xSegCount;C++){var z=d+C*f,A=p*(t.xSegCount+1)+C;t.attributes.position.values[3*A+"xyz".indexOf(e[0])]=z,t.attributes.position.values[3*A+"xyz".indexOf(e[1])]=-g}t.attributes.position.update(),o.debug("Geometry.setSize",{position:t.attributes.position})},c})()},Mesh:{enumerable:!1,value:(function(){function c(a,r){var e=this;e.geometry=a,e.material=r,e.wireframe=!1,e.attributeInstances=[],Object.entries(e.geometry.attributes).forEach(function(t){var d=t[0],v=t[1];e.attributeInstances.push({attribute:v,location:v.attach(d,e.material.program)})}),o.meshes.push(e),o.debug("Mesh.constructor",{mesh:e})}return c.prototype.draw=function(){n.useProgram(this.material.program),this.material.uniformInstances.forEach(function(a){var r=a.uniform,e=a.location;return r.update(e)}),this.attributeInstances.forEach(function(a){var r=a.attribute,e=a.location;return r.use(e)}),n.drawElements(this.wireframe?n.LINES:n.TRIANGLES,this.geometry.attributes.index.values.length,n.UNSIGNED_SHORT,0)},c.prototype.remove=function(){var a=this;o.meshes=o.meshes.filter(function(r){return r!=a})},c})()},Attribute:{enumerable:!1,value:(function(){function c(a){this.type=n.FLOAT,this.normalized=!1,this.buffer=n.createBuffer(),Object.assign(this,a),this.update()}return c.prototype.update=function(){this.values!==void 0&&(n.bindBuffer(this.target,this.buffer),n.bufferData(this.target,this.values,n.STATIC_DRAW))},c.prototype.attach=function(a,r){var e=n.getAttribLocation(r,a);return this.target===n.ARRAY_BUFFER&&(n.enableVertexAttribArray(e),n.vertexAttribPointer(e,this.size,this.type,this.normalized,0,0)),e},c.prototype.use=function(a){n.bindBuffer(this.target,this.buffer),this.target===n.ARRAY_BUFFER&&(n.enableVertexAttribArray(a),n.vertexAttribPointer(a,this.size,this.type,this.normalized,0,0))},c})()}});var m=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];o.commonUniforms={projectionMatrix:new o.Uniform({type:"mat4",value:m}),modelViewMatrix:new o.Uniform({type:"mat4",value:m}),resolution:new o.Uniform({type:"vec2",value:[1,1]}),aspectRatio:new o.Uniform({type:"float",value:1})}}return l.prototype.setSize=function(b,u,i,s){b===void 0&&(b=640),u===void 0&&(u=480),i===void 0&&(i=640),s===void 0&&(s=480),this.width=b,this.height=u,this.canvas.width=i,this.canvas.height=s,this.gl.viewport(0,0,i,s),this.commonUniforms.resolution.value=[i,s],this.commonUniforms.aspectRatio.value=i/s,this.debug("MiniGL.setSize",{width:b,height:u})},l.prototype.setOrthographicCamera=function(b,u,i,s,o){b===void 0&&(b=0),u===void 0&&(u=0),i===void 0&&(i=0),s===void 0&&(s=-2e3),o===void 0&&(o=2e3),this.commonUniforms.projectionMatrix.value=[2/this.width,0,0,0,0,2/this.height,0,0,0,0,2/(s-o),0,b,u,i,1],this.debug("setOrthographicCamera",this.commonUniforms.projectionMatrix.value)},l.prototype.render=function(){this.gl.clearColor(0,0,0,0),this.gl.clearDepth(1),this.meshes.forEach(function(b){return b.draw()})},l})();return x.MiniGl=L,x}var M;function G(){if(M)return y;M=1;var S=y&&y.__awaiter||function(u,i,s,o){function h(n){return n instanceof s?n:new s(function(m){m(n)})}return new(s||(s=Promise))(function(n,m){function c(e){try{r(o.next(e))}catch(t){m(t)}}function a(e){try{r(o.throw(e))}catch(t){m(t)}}function r(e){e.done?n(e.value):h(e.value).then(c,a)}r((o=o.apply(u,i||[])).next())})},U=y&&y.__generator||function(u,i){var s={label:0,sent:function(){if(n[0]&1)throw n[1];return n[1]},trys:[],ops:[]},o,h,n,m;return m={next:c(0),throw:c(1),return:c(2)},typeof Symbol=="function"&&(m[Symbol.iterator]=function(){return this}),m;function c(r){return function(e){return a([r,e])}}function a(r){if(o)throw new TypeError("Generator is already executing.");for(;s;)try{if(o=1,h&&(n=r[0]&2?h.return:r[0]?h.throw||((n=h.return)&&n.call(h),0):h.next)&&!(n=n.call(h,r[1])).done)return n;switch(h=0,n&&(r=[r[0]&2,n.value]),r[0]){case 0:case 1:n=r;break;case 4:return s.label++,{value:r[1],done:!1};case 5:s.label++,h=r[1],r=[0];continue;case 7:r=s.ops.pop(),s.trys.pop();continue;default:if(n=s.trys,!(n=n.length>0&&n[n.length-1])&&(r[0]===6||r[0]===2)){s=0;continue}if(r[0]===3&&(!n||r[1]>n[0]&&r[1]<n[3])){s.label=r[1];break}if(r[0]===6&&s.label<n[1]){s.label=n[1],n=r;break}if(n&&s.label<n[2]){s.label=n[2],s.ops.push(r);break}n[2]&&s.ops.pop(),s.trys.pop();continue}r=i.call(u,s)}catch(e){r=[6,e],h=0}finally{o=n=0}if(r[0]&5)throw r[1];return{value:r[0]?r[1]:void 0,done:!0}}};Object.defineProperty(y,"__esModule",{value:!0}),y.Gradient=void 0;var L=O();function l(u,i,s){return i in u?Object.defineProperty(u,i,{value:s,enumerable:!0,configurable:!0,writable:!0}):u[i]=s,u}var b=(function(){function u(){var i=this;l(this,"el",void 0),l(this,"cssVarRetries",0),l(this,"maxCssVarRetries",200),l(this,"angle",0),l(this,"inputColors",[]),l(this,"isLoadedClass",!1),l(this,"scrollingTimeout",void 0),l(this,"isIntersecting",!1),l(this,"shaderFiles",void 0),l(this,"vertexShader",void 0),l(this,"sectionColors",void 0),l(this,"computedCanvasStyle",void 0),l(this,"conf",void 0),l(this,"uniforms",void 0),l(this,"t",1253106),l(this,"last",0),l(this,"width",void 0),l(this,"minWidth",1111),l(this,"height",600),l(this,"xSegCount",void 0),l(this,"ySegCount",void 0),l(this,"mesh",void 0),l(this,"material",void 0),l(this,"geometry",void 0),l(this,"minigl",void 0),l(this,"amp",320),l(this,"seed",4),l(this,"freqX",14e-5),l(this,"freqY",29e-5),l(this,"freqDelta",1e-5),l(this,"activeColors",[1,1,1,1]),l(this,"isMetaKey",!1),l(this,"isGradientLegendVisible",!1),l(this,"resize",function(){}),l(this,"addIsLoadedClass",function(){!i.isLoadedClass&&(i.isLoadedClass=!0,i.el.classList.add("isLoaded"),setTimeout(function(){i.el.parentElement.classList.add("isLoaded")},3e3))}),l(this,"initGradient",function(s,o){return i.el=document.querySelector(s),i.inputColors=o,i.connect(),i})}return u.prototype.connect=function(){return S(this,void 0,void 0,function(){return U(this,function(i){return this.shaderFiles={vertex:`varying vec3 v_color;

void main() {
  float time = u_time * u_global.noiseSpeed;

  vec2 noiseCoord = resolution * uvNorm * u_global.noiseFreq;

  vec2 st = 1. - uvNorm.xy;

  //
  // Tilting the plane
  //

  // Front-to-back tilt
  float tilt = resolution.y / 2.0 * uvNorm.y;

  // Left-to-right angle
  float incline = resolution.x * uvNorm.x / 2.0 * u_vertDeform.incline;

  // Up-down shift to offset incline
  float offset = resolution.x / 2.0 * u_vertDeform.incline * mix(u_vertDeform.offsetBottom, u_vertDeform.offsetTop, uv.y);

  //
  // Vertex noise
  //

  float noise = snoise(vec3(
    noiseCoord.x * u_vertDeform.noiseFreq.x + time * u_vertDeform.noiseFlow,
    noiseCoord.y * u_vertDeform.noiseFreq.y,
    time * u_vertDeform.noiseSpeed + u_vertDeform.noiseSeed
  )) * u_vertDeform.noiseAmp;

  // Fade noise to zero at edges
  noise *= 1.0 - pow(abs(uvNorm.y), 2.0);

  // Clamp to 0
  noise = max(0.0, noise);

  vec3 pos = vec3(
    position.x,
    position.y + tilt + incline + noise - offset,
    position.z
  );

  //
  // Vertex color, to be passed to fragment shader
  //

  if (u_active_colors[0] == 1.) {
    v_color = u_baseColor;
  }

  for (int i = 0; i < u_waveLayers_length; i++) {
    if (u_active_colors[i + 1] == 1.) {
      WaveLayers layer = u_waveLayers[i];

      float noise = smoothstep(
        layer.noiseFloor,
        layer.noiseCeil,
        snoise(vec3(
          noiseCoord.x * layer.noiseFreq.x + time * layer.noiseFlow,
          noiseCoord.y * layer.noiseFreq.y,
          time * layer.noiseSpeed + layer.noiseSeed
        )) / 2.0 + 0.5
      );

      v_color = blendNormal(v_color, layer.color, pow(noise, 4.));
    }
  }

  //
  // Finish
  //

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`,noise:`//
// Description : Array and textureless GLSL 2D/3D/4D simplex
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
//

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
{
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i);
  vec4 p = permute( permute( permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}`,blend:`//
// https://github.com/jamieowen/glsl-blend
//

// Normal

vec3 blendNormal(vec3 base, vec3 blend) {
	return blend;
}

vec3 blendNormal(vec3 base, vec3 blend, float opacity) {
	return (blendNormal(base, blend) * opacity + base * (1.0 - opacity));
}

// Screen

float blendScreen(float base, float blend) {
	return 1.0-((1.0-base)*(1.0-blend));
}

vec3 blendScreen(vec3 base, vec3 blend) {
	return vec3(blendScreen(base.r,blend.r),blendScreen(base.g,blend.g),blendScreen(base.b,blend.b));
}

vec3 blendScreen(vec3 base, vec3 blend, float opacity) {
	return (blendScreen(base, blend) * opacity + base * (1.0 - opacity));
}

// Multiply

vec3 blendMultiply(vec3 base, vec3 blend) {
	return base*blend;
}

vec3 blendMultiply(vec3 base, vec3 blend, float opacity) {
	return (blendMultiply(base, blend) * opacity + base * (1.0 - opacity));
}

// Overlay

float blendOverlay(float base, float blend) {
	return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
}

vec3 blendOverlay(vec3 base, vec3 blend) {
	return vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));
}

vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
	return (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));
}

// Hard light

vec3 blendHardLight(vec3 base, vec3 blend) {
	return blendOverlay(blend,base);
}

vec3 blendHardLight(vec3 base, vec3 blend, float opacity) {
	return (blendHardLight(base, blend) * opacity + base * (1.0 - opacity));
}

// Soft light

float blendSoftLight(float base, float blend) {
	return (blend<0.5)?(2.0*base*blend+base*base*(1.0-2.0*blend)):(sqrt(base)*(2.0*blend-1.0)+2.0*base*(1.0-blend));
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
	return vec3(blendSoftLight(base.r,blend.r),blendSoftLight(base.g,blend.g),blendSoftLight(base.b,blend.b));
}

vec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {
	return (blendSoftLight(base, blend) * opacity + base * (1.0 - opacity));
}

// Color dodge

float blendColorDodge(float base, float blend) {
	return (blend==1.0)?blend:min(base/(1.0-blend),1.0);
}

vec3 blendColorDodge(vec3 base, vec3 blend) {
	return vec3(blendColorDodge(base.r,blend.r),blendColorDodge(base.g,blend.g),blendColorDodge(base.b,blend.b));
}

vec3 blendColorDodge(vec3 base, vec3 blend, float opacity) {
	return (blendColorDodge(base, blend) * opacity + base * (1.0 - opacity));
}

// Color burn

float blendColorBurn(float base, float blend) {
	return (blend==0.0)?blend:max((1.0-((1.0-base)/blend)),0.0);
}

vec3 blendColorBurn(vec3 base, vec3 blend) {
	return vec3(blendColorBurn(base.r,blend.r),blendColorBurn(base.g,blend.g),blendColorBurn(base.b,blend.b));
}

vec3 blendColorBurn(vec3 base, vec3 blend, float opacity) {
	return (blendColorBurn(base, blend) * opacity + base * (1.0 - opacity));
}

// Vivid Light

float blendVividLight(float base, float blend) {
	return (blend<0.5)?blendColorBurn(base,(2.0*blend)):blendColorDodge(base,(2.0*(blend-0.5)));
}

vec3 blendVividLight(vec3 base, vec3 blend) {
	return vec3(blendVividLight(base.r,blend.r),blendVividLight(base.g,blend.g),blendVividLight(base.b,blend.b));
}

vec3 blendVividLight(vec3 base, vec3 blend, float opacity) {
	return (blendVividLight(base, blend) * opacity + base * (1.0 - opacity));
}

// Lighten

float blendLighten(float base, float blend) {
	return max(blend,base);
}

vec3 blendLighten(vec3 base, vec3 blend) {
	return vec3(blendLighten(base.r,blend.r),blendLighten(base.g,blend.g),blendLighten(base.b,blend.b));
}

vec3 blendLighten(vec3 base, vec3 blend, float opacity) {
	return (blendLighten(base, blend) * opacity + base * (1.0 - opacity));
}

// Linear burn

float blendLinearBurn(float base, float blend) {
	// Note : Same implementation as BlendSubtractf
	return max(base+blend-1.0,0.0);
}

vec3 blendLinearBurn(vec3 base, vec3 blend) {
	// Note : Same implementation as BlendSubtract
	return max(base+blend-vec3(1.0),vec3(0.0));
}

vec3 blendLinearBurn(vec3 base, vec3 blend, float opacity) {
	return (blendLinearBurn(base, blend) * opacity + base * (1.0 - opacity));
}

// Linear dodge

float blendLinearDodge(float base, float blend) {
	// Note : Same implementation as BlendAddf
	return min(base+blend,1.0);
}

vec3 blendLinearDodge(vec3 base, vec3 blend) {
	// Note : Same implementation as BlendAdd
	return min(base+blend,vec3(1.0));
}

vec3 blendLinearDodge(vec3 base, vec3 blend, float opacity) {
	return (blendLinearDodge(base, blend) * opacity + base * (1.0 - opacity));
}

// Linear light

float blendLinearLight(float base, float blend) {
	return blend<0.5?blendLinearBurn(base,(2.0*blend)):blendLinearDodge(base,(2.0*(blend-0.5)));
}

vec3 blendLinearLight(vec3 base, vec3 blend) {
	return vec3(blendLinearLight(base.r,blend.r),blendLinearLight(base.g,blend.g),blendLinearLight(base.b,blend.b));
}

vec3 blendLinearLight(vec3 base, vec3 blend, float opacity) {
	return (blendLinearLight(base, blend) * opacity + base * (1.0 - opacity));
}`,fragment:`varying vec3 v_color;

void main() {
  vec3 color = v_color;
  if (u_darken_top == 1.0) {
    vec2 st = gl_FragCoord.xy/resolution.xy;
    color.g -= pow(st.y + sin(-12.0) * st.x, u_shadow_power) * 0.4;
  }
  gl_FragColor = vec4(color, 1.0);
}`},this.conf={presetName:"",wireframe:!1,density:[.06,.16],zoom:1,rotation:0,playing:!0},document.querySelectorAll("canvas").length<1?console.warn("DID NOT LOAD HERO STRIPE CANVAS"):(this.minigl=new L.MiniGl(this.el,null,null,!0),this.el&&this.init()),[2]})})},u.prototype.disconnect=function(){this.scrollObserver&&(window.removeEventListener("scroll",this.handleScroll),window.removeEventListener("mousedown",this.handleMouseDown),window.removeEventListener("mouseup",this.handleMouseUp),window.removeEventListener("keydown",this.handleKeyDown),this.scrollObserver.disconnect()),window.removeEventListener("resize",this.resize)},u.prototype.setCanvasSize=function(i,s,o){o===void 0&&(o=!0),this.width=i,this.height=s,this.minigl.setSize(Math.min(1024,this.width),Math.min(this.height,600),this.width,this.height),this.minigl.setOrthographicCamera(),o&&(this.xSegCount=Math.ceil(this.width*this.conf.density[0])),o&&(this.ySegCount=Math.ceil(this.height*this.conf.density[1])),o&&this.mesh.geometry.setTopology(this.xSegCount,this.ySegCount),this.mesh.geometry.setSize(this.width,this.height),this.mesh.material.uniforms.u_shadow_power.value=this.width<600?5:6},u.prototype.initMaterial=function(){this.uniforms={u_time:new this.minigl.Uniform({value:0}),u_shadow_power:new this.minigl.Uniform({value:5}),u_darken_top:new this.minigl.Uniform({value:this.el.dataset.jsDarkenTop===""?1:0}),u_active_colors:new this.minigl.Uniform({value:this.activeColors,type:"vec4"}),u_global:new this.minigl.Uniform({value:{noiseFreq:new this.minigl.Uniform({value:[this.freqX,this.freqY],type:"vec2"}),noiseSpeed:new this.minigl.Uniform({value:5e-6})},type:"struct"}),u_vertDeform:new this.minigl.Uniform({value:{incline:new this.minigl.Uniform({value:Math.sin(this.angle)/Math.cos(this.angle)}),offsetTop:new this.minigl.Uniform({value:-.5}),offsetBottom:new this.minigl.Uniform({value:-.5}),noiseFreq:new this.minigl.Uniform({value:[3,4],type:"vec2"}),noiseAmp:new this.minigl.Uniform({value:this.amp}),noiseSpeed:new this.minigl.Uniform({value:10}),noiseFlow:new this.minigl.Uniform({value:3}),noiseSeed:new this.minigl.Uniform({value:this.seed})},type:"struct",excludeFrom:"fragment"}),u_baseColor:new this.minigl.Uniform({value:this.sectionColors[0],type:"vec3",excludeFrom:"fragment"}),u_waveLayers:new this.minigl.Uniform({value:[],excludeFrom:"fragment",type:"array"})};for(var i=1;i<this.sectionColors.length;i+=1)this.uniforms.u_waveLayers.value.push(new this.minigl.Uniform({value:{color:new this.minigl.Uniform({value:this.sectionColors[i],type:"vec3"}),noiseFreq:new this.minigl.Uniform({value:[2+i/this.sectionColors.length,3+i/this.sectionColors.length],type:"vec2"}),noiseSpeed:new this.minigl.Uniform({value:11+.3*i}),noiseFlow:new this.minigl.Uniform({value:6.5+.3*i}),noiseSeed:new this.minigl.Uniform({value:this.seed+10*i}),noiseFloor:new this.minigl.Uniform({value:.1}),noiseCeil:new this.minigl.Uniform({value:.63+.07*i})},type:"struct"}));return this.vertexShader=[this.shaderFiles.noise,this.shaderFiles.blend,this.shaderFiles.vertex].join(`

`),new this.minigl.Material(this.vertexShader,this.shaderFiles.fragment,this.uniforms)},u.prototype.initMesh=function(){this.material=this.initMaterial(),this.geometry=new this.minigl.PlaneGeometry,this.mesh=new this.minigl.Mesh(this.geometry,this.material)},u.prototype.shouldSkipFrame=function(i){return!!window.document.hidden||!this.conf.playing||parseInt(i,10)%2==0||void 0},u.prototype.updateFrequency=function(i){this.freqX+=i,this.freqY+=i},u.prototype.toggleColor=function(i){this.activeColors[i]=this.activeColors[i]===0?1:0},u.prototype.showGradientLegend=function(){this.width>this.minWidth&&(this.isGradientLegendVisible=!0,document.body.classList.add("isGradientLegendVisible"))},u.prototype.hideGradientLegend=function(){this.isGradientLegendVisible=!1,document.body.classList.remove("isGradientLegendVisible")},u.prototype.changePosition=function(i){var s=i;this.t=1253106+s*1e3,this.mesh.material.uniforms.u_time.value=this.t,this.minigl.render()},u.prototype.init=function(){this.initGradientColors(),this.initMesh(),this.setCanvasSize(1024,600),this.minigl.render(),window.addEventListener("resize",this.resize)},u.prototype.initGradientColors=function(){this.sectionColors=this.inputColors.map(function(i){var s=i;if(s.length===4){var o=s.substr(1).split("").map(function(h){return h+h}).join("");s="#".concat(o)}return s&&"0x".concat(s.slice(1))}).filter(Boolean).map(L.normalizeColor)},u.prototype.changeGradientColors=function(i){i&&(this.inputColors=i,this.init())},u.prototype.reGenerateCanvas=function(){this.minigl.render()},u.prototype.getGradientColors=function(){return this.inputColors},u})();return y.Gradient=b,y}var F;function N(){if(F)return _;F=1,Object.defineProperty(_,"__esModule",{value:!0});var S=G().Gradient;return _.default=S,_}var E=N(),R=E.__esModule;export{R as __esModule,E as default};
//# sourceMappingURL=/sm/b61da523864b4450ddc1cdc3d286ecb24f7caa6f8384a42ecbfa122a7c2cedb0.map
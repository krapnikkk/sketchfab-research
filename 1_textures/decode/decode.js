let data = {
    "format": "RGB",
    "quality": 80,
    "decodeAsync": true,
    "pk": 198773,
    "crossOrigin": "anonymous"
};
async function main(){
    let img = await loadImage("./assets/texture.png");
    let canvas = document.querySelector("#canvas");
    let ctx = canvas.getContext("webgl2");
    canvas.width = img.width;
    canvas.height = img.height;
    let texture = bindTexture(ctx, img);
    decodeTexture(ctx,data.pk,[ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, img],false,texture,true);
}

function loadImage(url){
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        img.onload = () => {
            resolve(img);
        }
    });
}

function bindTexture(gl, img){
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    return texture;

}
const decodeTexture = function (gl, factor, originTexture, _isCompressed = false, webGLTexture, _flipY) {
    var o = gl.getParameter(gl.ARRAY_BUFFER_BINDING)
        , CURRENT_PROGRAM = gl.getParameter(gl.CURRENT_PROGRAM)
        , FRAMEBUFFER_BINDING = gl.getParameter(gl.FRAMEBUFFER_BINDING)
        , BLEND = gl.isEnabled(gl.BLEND)
        , DEPTH_TEST = gl.isEnabled(gl.DEPTH_TEST)
        , VIEWPORT = gl.getParameter(gl.VIEWPORT)
        , SCISSOR_TEST = gl.isEnabled(gl.SCISSOR_TEST)
        , SCISSOR_BOX = SCISSOR_TEST ? gl.getParameter(gl.SCISSOR_BOX) : void 0
        , ACTIVE_TEXTURE = gl.getParameter(gl.ACTIVE_TEXTURE)
        , VERTEX_ARRAY_BINDING = 0;
    gl.bindVertexArray && (VERTEX_ARRAY_BINDING = gl.getParameter(gl.VERTEX_ARRAY_BINDING));
    var DEPTH_WRITEMASK = gl.getParameter(gl.DEPTH_WRITEMASK)
        , COLOR_WRITEMASK = gl.getParameter(gl.COLOR_WRITEMASK)
        , img = originTexture[5]
        , width = img.width
        , height = img.height;
    gl.bindTexture(originTexture[0], webGLTexture),
        gl.texImage2D(originTexture[0], originTexture[1], gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    var tempTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tempTexture),
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, !1),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE),
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE),
        _isCompressed ? gl.compressedTexImage2D.apply(gl, originTexture) : gl.texImage2D.apply(gl, originTexture);
    var decoder = f(gl);
    factor *= 64,
        factor %= width * height,
        decoder.prepare(-factor, tempTexture, _flipY, false, ACTIVE_TEXTURE),
        decoder.renderInto(webGLTexture, width, height),
        gl.deleteTexture(tempTexture),
        gl.bindFramebuffer(gl.FRAMEBUFFER, FRAMEBUFFER_BINDING),
        gl.bindBuffer(gl.ARRAY_BUFFER, o),
        gl.useProgram(CURRENT_PROGRAM),
        VIEWPORT && gl.viewport(VIEWPORT[0], VIEWPORT[1], VIEWPORT[2], VIEWPORT[3]),
        SCISSOR_TEST && (gl.enable(gl.SCISSOR_TEST),
            gl.scissor(SCISSOR_BOX[0], SCISSOR_BOX[1], SCISSOR_BOX[2], SCISSOR_BOX[3])),
        BLEND && gl.enable(gl.BLEND),
        DEPTH_TEST && gl.enable(gl.DEPTH_TEST),
        VERTEX_ARRAY_BINDING ? gl.bindVertexArray(VERTEX_ARRAY_BINDING) : gl.bindVertexArray(null),
        gl.depthMask(DEPTH_WRITEMASK),
        gl.colorMask(COLOR_WRITEMASK[0], COLOR_WRITEMASK[1], COLOR_WRITEMASK[2], COLOR_WRITEMASK[3]),
        gl.activeTexture(ACTIVE_TEXTURE),
        gl.bindTexture(originTexture[0], webGLTexture)
};

var Decoder = null;
function f(gl) {
    if (Decoder)
        return Decoder;
    Decoder = {};
    var t = 0;
    gl.createVertexArray && (t = gl.createVertexArray(),
        gl.bindVertexArray(t));
    var i = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, i),
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
    var n = gl.createProgram()
        , r = I(gl, gl.VERTEX_SHADER, "attribute vec2 aVertex;\nvarying highp vec2 vTextureCoord;\n\nvoid main(void) {\n\tgl_Position = vec4(aVertex,0.0,1.0);\n\tvTextureCoord = aVertex*0.5+0.5;\n}\n")
        , a = I(gl, gl.FRAGMENT_SHADER, "varying highp vec2 vTextureCoord;precision highp int;uniform sampler2D uT;uniform highp ivec2 uS;uniform bool uY;uniform int uO;int f(int i,int u){int y=i/u;return i-y*u;}int i(int i,int t){if(i<t)return i;return t;}int u(int i,int u){if(i<u)return u;return i;}int f(int y,int t,int f){int x=i(y,t),n=u(y,t);if(f<x)return f*(f+1)/2;if(f<n)return x*(x+1)/2+x*(f-x);int r=f-n;return x*(x+1)/2+x*(n-x)+(x-1)*r-(r-1)*r/2;}int i(int y,int t,ivec2 x){int r=i(y,t),n=u(y,t),v=x.x+x.y;bool h=f(v,2)==0;if(v<r){if(h)return f(y,t,v)+v-x.y;return f(y,t,v)+x.y;}if(v<n){int s=t-x.y-1;if(y<t)s=r-(y-x.x);if(h)return f(y,t,v)+s;return f(y,t,v)+r-s-1;}int s=t-x.y-1,e=r+n-v-1;if(h)return f(y,t,v)+s;return f(y,t,v)+e-s-1;}ivec2 u(int y,int t,int x){int v=i(y,t),r=u(y,t);if(x<v*(v+1)/2){int n=(-1+int(1e-6+sqrt(float(8*x+1))))/2,h=x-f(y,t,n);bool s=f(n,2)==0;if(s)return ivec2(h,n-h);return ivec2(n-h,h);}if(x<v*(v+1)/2+v*(r-v)){x=x-v*(v+1)/2;int n=v+x/v,s=f(x,v);bool h=f(n,2)==0;int g=n-v+s+1,e=v-s-1,S=n-s,T=s;if(y>t){if(h)return ivec2(g,e);return ivec2(S,T);}if(h)return ivec2(T,S);return ivec2(e,g);}int n=v*(v-1)/2-(x-(v*(v+1)/2+v*(r-v)))-1,s=(-1+int(sqrt(float(8*n+1))))/2;n=r+v-s-2;int h=x-f(y,t,n);bool g=f(n,2)==0;int e=v+r-n-1;if(g)h=e-h-1;int S=n+h-y+1;return ivec2(n-S,S);}int f(ivec2 v){int y=uS.x/8,t=uS.y/8,x=i(y,t,ivec2(v.x/8,v.y/8)),n=f(x,4);v.x=f(v.x,8);v.y=f(v.y,8);ivec2 r=v;if(n==1)r.x=7-v.x;if(n==2)r.x=v.y,r.y=v.x;if(n==3)r.x=7-v.y,r.y=v.x;return x*64+r.x+r.y*8;}ivec2 i(int i){int x=uS.x,t=uS.y,v=x*t;if(i<0)i+=v;i=f(i,v);int y=x/8,n=t/8,h=i/64,r=i-h*64,s=r/8,S=r-s*8,e=f(h,4);ivec2 g=u(y,n,h),T=g*8;if(e==0)T.x+=S,T.y+=s;if(e==1)T.x+=7-S,T.y+=s;if(e==2)T.x+=s,T.y+=S;if(e==3)T.x+=s,T.y+=7-S;return T;}int t(ivec2 y,int i){int v=uS.x*uS.y,n=f(y)+i;if(n>v)n-=v;if(n<0)n+=v;if(n>v)return-1;if(n<0)return-2;return n;}void main(){ivec2 y=ivec2(gl_FragCoord);if(uY)y.y=uS.y-y.y-1;if(uO==-1){gl_FragColor=texture2D(uT,vec2(y)/vec2(uS));return;}int n=t(y,uO);if(n>=0)y=i(n),gl_FragColor=texture2D(uT,(vec2(y)+.5)/vec2(uS));else gl_FragColor=vec4(1.,0.,0.,1.);}");
    if (gl.attachShader(n, r),
        gl.attachShader(n, a),
        gl.linkProgram(n),
        !gl.getProgramParameter(n, gl.LINK_STATUS))
        return null;
    gl.useProgram(n);
    var o = {
        attribLocations: {
            vertex: gl.getAttribLocation(n, "aVertex")
        },
        uniformLocations: {
            uSampler: gl.getUniformLocation(n, "uT"),
            uSize: gl.getUniformLocation(n, "uS"),
            uOffset: gl.getUniformLocation(n, "uO"),
            uYFlipped: gl.getUniformLocation(n, "uY")
        }
    };
    if (t) {
        var s = gl.FLOAT;
        gl.vertexAttribPointer(o.attribLocations.vertex, 2, s, !1, 0, 0),
            gl.enableVertexAttribArray(o.attribLocations.vertex)
    }
    var A = gl.createFramebuffer();
    return Decoder.prepare = function (r, a, s, A, g) {
        if (gl.useProgram(n),
            gl.uniform1i(o.uniformLocations.uOffset, A ? -1 : r),
            g || (g = gl.TEXTURE0),
            gl.uniform1i(o.uniformLocations.uSampler, g - gl.TEXTURE0),
            gl.uniform1i(o.uniformLocations.uYFlipped, s),
            gl.activeTexture(g),
            gl.bindTexture(gl.TEXTURE_2D, a),
            t)
            gl.bindVertexArray(t);
        else {
            var h = gl.FLOAT;
            gl.bindBuffer(gl.ARRAY_BUFFER, i),
                gl.vertexAttribPointer(o.attribLocations.vertex, 2, h, !1, 0, 0),
                gl.enableVertexAttribArray(o.attribLocations.vertex)
        }
        gl.disable(gl.BLEND),
            gl.disable(gl.DEPTH_TEST),
            gl.disable(gl.SCISSOR_TEST),
            gl.depthMask(!1),
            gl.colorMask(!0, !0, !0, !0)
    }
        ,
        Decoder.renderInto = function (t, i, n) {
            gl.uniform2i(o.uniformLocations.uSize, i, n),
                gl.bindFramebuffer(gl.FRAMEBUFFER, A),
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0),
                gl.viewport(0, 0, i, n),
                gl.drawArrays(gl.TRIANGLES, 0, 6)
        }
        ,
        Decoder
}

function I(t, e, i) {
    var r = t.createShader(e);
    return delete t.shaderSource,
    t.shaderSource(r, i),
    delete t.compileShader,
    t.compileShader(r),
    t.getShaderParameter(r, t.COMPILE_STATUS) ? r : (console.log("ERROR TP: " + t.getShaderInfoLog(r)),
    null)
}

class Texture {
    applyTexImage2D(gl) {
        var t = Array.prototype.slice.call(arguments, 1)
            , i = 0;
        if (this._textureObject._texture._textureTarget === gl.TEXTURE_2D && 7 === t.length && (i = t.pop()),
            gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, this._colorSpaceConversion),
            i) {
            var n = this._textureObject._id;
            decodeTexture(e, i, t, this._isCompressed, n, this._flipY)
        } else
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this._flipY),
                this._isCompressed ? gl.compressedTexImage2D.apply(e, t) : gl.texImage2D.apply(e, t);
        var r = this._applyTexImage2DCallbacks.length;
        if (r > 0)
            for (var a = 0, o = r; a < o; a++)
                this._applyTexImage2DCallbacks[a].call(this)
    }
}
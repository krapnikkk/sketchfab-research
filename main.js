// ==UserScript==
// @name        SketchfabTextureDump
// @namespace   Violentmonkey Scripts
// @match       *://*.sketchfab.com/*
// @grant       none
// @version     0.0.1
// @author      krapnik
// @description 2022/9/ 12:02:46
// @license     MIT
// @run-at      document-start
// ==/UserScript==
(function () {
    const MIN_TEXTURE_WIDTH = 256,
      MIN_TEXTURE_HEIGHT = 256;
    let _log = console.log;
    _log("webgl texture dump");
  
    let webGLTextureIdx = 0;
    let webGLTextureMap = {};
    let targetRenderingCtx = WebGLRenderingContext || WebGL2RenderingContext; // todo auto choose context
  
    //createTexture
    let _GLCreateTexture = targetRenderingCtx.prototype.createTexture;
    targetRenderingCtx.prototype.createTexture = function (...args) {
      let texture = _GLCreateTexture.apply(this, args);
      texture.name = webGLTextureIdx;
      texture.gl = this;
      webGLTextureMap[`${webGLTextureIdx}`] = texture;
      webGLTextureIdx++;
      return texture;
    };
  
    //bindTexture
    let _GBBindTexture = targetRenderingCtx.prototype.bindTexture;
    targetRenderingCtx.prototype.bindTexture = function (...args) {
      let target = args[0],texture = args[1];
      if (texture) {
          texture.target = target;
      }
      _GBBindTexture.apply(this, args);
    };
  
    //texImage
    let _GLTexImage2D = WebGLRenderingContext.prototype.texImage2D;
    WebGLRenderingContext.prototype.texImage2D = function (...args) {
        let texture = this.getParameter(this.TEXTURE_BINDING_2D) || this.getParameter(this.TEXTURE_BINDING_CUBE_MAP);
        let argments = parseTexImage2dArgs(args);
        if(texture.target == argments.target){
          texture.args = argments
        }
      _GLTexImage2D.apply(this, args);
    };
  
    function parseTexImage2dArgs(args) {
      let argments = {};
      if (args.length == 6) {
        let [target, level, internalformat, format, type, source] = args;
        let { width, height } = source;
        argments = { target, level, width, height, format, type };
      } else if (args.length == 9) {
        let [
          target,
          level,
          internalformat,
          width,
          height,
          border,
          format,
          type,
          pixels,
        ] = args;
        argments = { target, level, width, height, format, type };
      }else{
          let [target] = args;
          argments= {target};
      }
      return argments;
    }
  
    function readWebTextureData(texture) {
      let { target,gl,args } = texture;
      if(!args){ // todo maybe other func bind
          return
      }
      let { level, width, height, format, type } = args;
      if (
        width > MIN_TEXTURE_WIDTH &&
        height > MIN_TEXTURE_HEIGHT &&
        width % 2 === 0 &&
        height % 2 === 0 &&
        target === gl.TEXTURE_2D
      ) {
        var fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          texture,
          level
        );
        let framebufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (
          framebufferStatus == gl.FRAMEBUFFER_COMPLETE
        ) {
          var pixels = new Uint8Array(width * height * 4);
          gl.readPixels(0, 0, width, height, format, type, pixels);
          var canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          var context = canvas.getContext("2d");
  
          var imageData = context.createImageData(width, height);
  
          imageData.data.set(flipY(pixels, width, height));
          context.putImageData(imageData, 0, 0);
          downFile(canvas.toDataURL());
        }
      }
    }
  
    function flipY(arr, width, height) {
      const length = width * height * 4;
      const row = width * 4;
      const end = (height - 1) * row;
      const pixels = new Uint8Array(length);
  
      for (let i = 0; i < length; i += row) {
        pixels.set(arr.subarray(i, i + row), end - i);
      }
  
      return pixels;
    }
  
    function dumpWebGLTextureData() {
      for (let key in webGLTextureMap) {
        readWebTextureData(webGLTextureMap[key]);
      }
    }
  
    function downFile(url) {
      var newWin = window.open("", "_blank");
      var anchor = document.createElement("a");
      var fileName = `${Date.now()}.png`;
      anchor.href = url;
      anchor.setAttribute("download", fileName);
      newWin.document.body.appendChild(anchor);
      anchor.click();
      newWin.close();
    }
  
    window.webGLTextureMap = webGLTextureMap;
    window.dumpWebGLTextureData = dumpWebGLTextureData;
  })();
  
// ==UserScript==
// @name        SketchfabTextureDump
// @namespace   Violentmonkey Scripts
// @match       *://*.sketchfab.com/3d-models/**
// @match       *://*.sketchfab.com/models/**
// @grant       none
// @version     0.0.5
// @author      krapnik
// @description 2022/9/29 12:02:46
// @license     MIT
// @run-at      document-start
// ==/UserScript==
(function () {
  console.log("=======SketchfabTextureDump=======");
  const MIN_TEXTURE_WIDTH = 256,
    MIN_TEXTURE_HEIGHT = 256;
  let _log = console.log;
  let _warn = console.warn;
  let model_name = location.pathname.split("/")[2];
  let model_name_arr = model_name.split("-");
  let model_id = model_name_arr[model_name_arr.length - 1];
  let downloadCnt = 0;
  let originTextureMap = [];
  if (!model_id) {
    _warn("can't find model_id!");
    return;
  } else {
    _log("model_id:", model_id);
  }
  window.onload = () => {
    originTextureMap = window.prefetchedData[`/i/models/${model_id}/textures?optimized=1`].results || [];
    addDownloadBtn();
  }

  function addDownloadBtn() {
    let btn = document.createElement("button");
    btn.innerHTML = "download";
    btn.style.position = "absolute"
    btn.style.top = "0"
    btn.style.left = "0"
    document.body.appendChild(btn);
    btn.onclick = dumpWebGLTextureData;
  }

  let webGLTextureIdx = 0;
  let webGLTextureMap = {};
  let targetRenderingCtx = WebGLRenderingContext; // todo auto choose context


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
    let target = args[0], texture = args[1];
    if (texture) {
      texture.target = target;
    }
    _GBBindTexture.apply(this, args);
  };

  //texImage
  let lstTexture;
  let _GLTexImage2D = targetRenderingCtx.prototype.texImage2D;
  let hasCoverTex = 0;
  targetRenderingCtx.prototype.texImage2D = function (...args) {
    let texture = this.getParameter(this.TEXTURE_BINDING_2D) || this.getParameter(this.TEXTURE_BINDING_CUBE_MAP);
    let argments = parseTexImage2dArgs(args);
    if (texture.target == argments.target) {
      texture.args = argments;
      let { width, height, src } = argments;
      if (
        width > MIN_TEXTURE_WIDTH &&
        height > MIN_TEXTURE_HEIGHT &&
        (width & width - 1) === 0 &&
        (height & height - 1) === 0 &&
        texture.target === this.TEXTURE_2D
      ) {
        if (src) {
          texture.src = argments.src;
          lstTexture.lst = texture.name;
          hasCoverTex++;
          _log(`origin texture cover count:${hasCoverTex}`);
        }
        lstTexture = texture;
      }
    }
    _GLTexImage2D.apply(this, args);
  };

  function parseTexImage2dArgs(args) {
    let argments = {};
    if (args.length == 6) {
      let [target, level, internalformat, format, type, source] = args;
      let { width, height, src } = source;
      argments = { target, level, width, height, format, type, src };
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
    } else {
      let [target] = args;
      argments = { target };
    }
    return argments;
  }

  function readWebTextureData(texture) {
    let { target, gl, args, src, lst } = texture;
    if (!args) { // todo maybe other func bind
      return
    }
    let { level, width, height, format, type } = args;
    if (
      width > MIN_TEXTURE_WIDTH &&
      height > MIN_TEXTURE_HEIGHT &&
      (width & width - 1) === 0 &&
      (height & height - 1) === 0 &&
      target === gl.TEXTURE_2D && !src
    ) {
      let fb = gl.createFramebuffer();
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
        let fileName = `${Date.now()}.png`;
        let originName = fileName;
        let originTex = webGLTextureMap[lst];
        if (originTex) {
          if (originTex.src) {
            let path = originTex.src.split("/");
            let uid = path[path.length - 2];
            originName = getNameById(uid);
          }
          if (fileName == originName || !originName) { return }
          let pixels = new Uint8Array(width * height * 4);
          gl.readPixels(0, 0, width, height, gl.RGBA, type, pixels);
          let canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          let context = canvas.getContext("2d");
          let imageData = context.createImageData(width, height);
          imageData.data.set(flipY(pixels, width, height));
          context.putImageData(imageData, 0, 0);
          downloadCnt++;
          downLoadByLink(canvas.toDataURL(), originName); // todo format
        }
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
    downloadCnt = 0;
    for (let key in webGLTextureMap) {
      readWebTextureData(webGLTextureMap[key]);
    }
    if (downloadCnt == originTextureMap.length) {
      _log(`【dump texture:${downloadCnt}/${originTextureMap.length}】 success！`);
    } else {
      _log(`【dump texture:${downloadCnt}/${originTextureMap.length}】some texture doesn't cover,plz move the camera or open the [Model-Inspector] and view the textures!`);
    }
  }

  function getNameById(uid) {
    let name;
    let texture = originTextureMap.find((t) => {
      return t.uid == uid;
    });
    if (texture) {
      name = texture.name;
    }
    return name;
  }


  function downLoadByLink(url, filename) {
    let link, evt;
    link = document.createElement('a');
    link.href = url;
    filename && link.setAttribute('download', filename);
    if (document.fireEvent) {
      window.open(link.href);
    } else {
      evt = document.createEvent('MouseEvents');
      evt.initEvent('click', true, true);
      link.dispatchEvent(evt);
    }
  };

  window.dumpWebGLTextureData = dumpWebGLTextureData;
})();

if(!self.define){let e,n={};const c=(c,d)=>(c=new URL(c+".js",d).href,n[c]||new Promise((n=>{if("document"in self){const e=document.createElement("script");e.src=c,e.onload=n,document.head.appendChild(e)}else e=c,importScripts(c),n()})).then((()=>{let e=n[c];if(!e)throw new Error(`Module ${c} didn’t register its module`);return e})));self.define=(d,u)=>{const b=e||("document"in self?document.currentScript.src:"")||location.href;if(n[b])return;let i={};const s=e=>c(e,b),r={module:{uri:b},exports:i,require:s};n[b]=Promise.all(d.map((e=>r[e]||s(e)))).then((e=>(u(...e),i)))}}define(["./workbox-6da860f9"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"116.chunk-bundle.js",revision:"f2c20c09335977985ef288b58aeb20d1"},{url:"125.chunk-bundle.js",revision:"eaf5fac5a5909c83cb9266dfb885b6ae"},{url:"237.chunk-bundle.js",revision:"c09f8f052c4352e775e29a5ed459bef3"},{url:"245.chunk-bundle.js",revision:"9ac39cccad32b55d385f0b288e7e7649"},{url:"250.chunk-bundle.js",revision:"4f069db159f47f3dd40666d7046ea31e"},{url:"258.chunk-bundle.js",revision:"7537902b033e129634af937fc08e109c"},{url:"271.chunk-bundle.js",revision:"65daa29e2a44fcb1294f42560c25b671"},{url:"285.chunk-bundle.js",revision:"7a99294eaefd1e6a4b11fb9624f1051a"},{url:"297.chunk-bundle.js",revision:"4a913150213c19bd3d5cc4cad74d29bf"},{url:"304.chunk-bundle.js",revision:"46983e07dde4b880480be3014c8e8136"},{url:"42.chunk-bundle.js",revision:"c48915f8678beb7ddf0fcf9aa25bb703"},{url:"44.chunk-bundle.js",revision:"7cd2d7bc9c2e9fbc3c612c3d6f5ca8ff"},{url:"473.chunk-bundle.js",revision:"36916b9e8a5a33c855ee6171d0afa0ac"},{url:"495.chunk-bundle.js",revision:"1e5f48430b0352541377f6208845a6da"},{url:"544.chunk-bundle.js",revision:"8e67ddaa244d35eaa4a73f531d7e9c96"},{url:"589.chunk-bundle.js",revision:"47a4d43170372142fe2c2ff4b047a8b5"},{url:"622.chunk-bundle.js",revision:"ce14f9e1971db49fdd9c062e5d1722fd"},{url:"656.chunk-bundle.js",revision:"cd1f02fe315543863173639b25bd89c5"},{url:"694.chunk-bundle.js",revision:"b89c08c27a664c29d37d3d732a571f4b"},{url:"713.chunk-bundle.js",revision:"45b5708837ec1ca679281a52e46814f7"},{url:"726.chunk-bundle.js",revision:"ec1b4d273915e8f2b3492f5f896d0a8b"},{url:"826.chunk-bundle.js",revision:"5e9114c16c2dc021e086dd438a7b5223"},{url:"830.chunk-bundle.js",revision:"3c9b248019e9683e7ff51b220d7939ce"},{url:"863.chunk-bundle.js",revision:"90b7b8fda267645c60f6ad4ac80bbbde"},{url:"883.chunk-bundle.js",revision:"50b7f374e3397017f76adb5a22d68dc2"},{url:"904.chunk-bundle.js",revision:"8790f3edf1f11b0a4cc3a88b71005e1b"},{url:"app.webmanifest",revision:"993c2cd7b00137885564b308f7a846bf"},{url:"index.html",revision:"5b1668a96335562bc9edefa6cd33927c"},{url:"main.bundle.js",revision:"63efa0591fc3c2c6f0bb1a2baeea45ae"},{url:"main.bundle.js.LICENSE.txt",revision:"15b07506049fb98da101702aa72f9177"},{url:"pwa_icon.svg",revision:"832d72e2835979b511d67a9ecaa93868"}],{})}));
//# sourceMappingURL=service-worker.js.map

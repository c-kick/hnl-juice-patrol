/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=globalThis,e=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),s=new WeakMap;let n=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const i=this.t;if(e&&void 0===t){const e=void 0!==i&&1===i.length;e&&(t=s.get(i)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&s.set(i,t))}return t}toString(){return this.cssText}};const o=e?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new n("string"==typeof t?t:t+"",void 0,i))(e)})(t):t,{is:a,defineProperty:r,getOwnPropertyDescriptor:l,getOwnPropertyNames:c,getOwnPropertySymbols:h,getPrototypeOf:d}=Object,p=globalThis,u=p.trustedTypes,g=u?u.emptyScript:"",f=p.reactiveElementPolyfillSupport,m=(t,e)=>t,b={toAttribute(t,e){switch(e){case Boolean:t=t?g:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},x=(t,e)=>!a(t,e),y={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:x};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),p.litPropertyMetadata??=new WeakMap;let v=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=y){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&r(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=l(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const o=s?.call(this);n?.call(this,e),this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y}static _$Ei(){if(this.hasOwnProperty(m("elementProperties")))return;const t=d(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(m("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(m("properties"))){const t=this.properties,e=[...c(t),...h(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(o(t))}else void 0!==t&&e.push(o(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const i=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((i,s)=>{if(e)i.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const e of s){const s=document.createElement("style"),n=t.litNonce;void 0!==n&&s.setAttribute("nonce",n),s.textContent=e.cssText,i.appendChild(s)}})(i,this.constructor.elementStyles),i}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(e,i.type);this._$Em=t,null==n?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:b;this._$Em=s;const o=n.fromAttribute(e,t.type);this[s]=o??this._$Ej?.get(s)??o,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(void 0!==t){const o=this.constructor;if(!1===s&&(n=this[t]),i??=o.getPropertyOptions(t),!((i.hasChanged??x)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},o){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),!0!==n||void 0!==o)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};v.elementStyles=[],v.shadowRootOptions={mode:"open"},v[m("elementProperties")]=new Map,v[m("finalized")]=new Map,f?.({ReactiveElement:v}),(p.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const _=globalThis,w=t=>t,k=_.trustedTypes,S=k?k.createPolicy("lit-html",{createHTML:t=>t}):void 0,$="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+M,A=`<${C}>`,T=document,D=()=>T.createComment(""),E=t=>null===t||"object"!=typeof t&&"function"!=typeof t,P=Array.isArray,L="[ \t\n\f\r]",O=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,z=/>/g,j=RegExp(`>|${L}(?:([^\\s"'>=/]+)(${L}*=${L}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),I=/'/g,H=/"/g,F=/^(?:script|style|textarea|title)$/i,B=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),V=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),N=new WeakMap,U=T.createTreeWalker(T,129);function q(t,e){if(!P(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const Y=(t,e)=>{const i=t.length-1,s=[];let n,o=2===e?"<svg>":3===e?"<math>":"",a=O;for(let e=0;e<i;e++){const i=t[e];let r,l,c=-1,h=0;for(;h<i.length&&(a.lastIndex=h,l=a.exec(i),null!==l);)h=a.lastIndex,a===O?"!--"===l[1]?a=R:void 0!==l[1]?a=z:void 0!==l[2]?(F.test(l[2])&&(n=RegExp("</"+l[2],"g")),a=j):void 0!==l[3]&&(a=j):a===j?">"===l[0]?(a=n??O,c=-1):void 0===l[1]?c=-2:(c=a.lastIndex-l[2].length,r=l[1],a=void 0===l[3]?j:'"'===l[3]?H:I):a===H||a===I?a=j:a===R||a===z?a=O:(a=j,n=void 0);const d=a===j&&t[e+1].startsWith("/>")?" ":"";o+=a===O?i+A:c>=0?(s.push(r),i.slice(0,c)+$+i.slice(c)+M+d):i+M+(-2===c?e:d)}return[q(t,o+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class X{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,o=0;const a=t.length-1,r=this.parts,[l,c]=Y(t,e);if(this.el=X.createElement(l,i),U.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=U.nextNode())&&r.length<a;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith($)){const e=c[o++],i=s.getAttribute(t).split(M),a=/([.?@])?(.*)/.exec(e);r.push({type:1,index:n,name:a[2],strings:i,ctor:"."===a[1]?Q:"?"===a[1]?tt:"@"===a[1]?et:Z}),s.removeAttribute(t)}else t.startsWith(M)&&(r.push({type:6,index:n}),s.removeAttribute(t));if(F.test(s.tagName)){const t=s.textContent.split(M),e=t.length-1;if(e>0){s.textContent=k?k.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],D()),U.nextNode(),r.push({type:2,index:++n});s.append(t[e],D())}}}else if(8===s.nodeType)if(s.data===C)r.push({type:2,index:n});else{let t=-1;for(;-1!==(t=s.data.indexOf(M,t+1));)r.push({type:7,index:n}),t+=M.length-1}n++}}static createElement(t,e){const i=T.createElement("template");return i.innerHTML=t,i}}function K(t,e,i=t,s){if(e===V)return e;let n=void 0!==s?i._$Co?.[s]:i._$Cl;const o=E(e)?void 0:e._$litDirective$;return n?.constructor!==o&&(n?._$AO?.(!1),void 0===o?n=void 0:(n=new o(t),n._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=n:i._$Cl=n),void 0!==n&&(e=K(t,n._$AS(t,e.values),n,s)),e}class G{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??T).importNode(e,!0);U.currentNode=s;let n=U.nextNode(),o=0,a=0,r=i[0];for(;void 0!==r;){if(o===r.index){let e;2===r.type?e=new J(n,n.nextSibling,this,t):1===r.type?e=new r.ctor(n,r.name,r.strings,this,t):6===r.type&&(e=new it(n,this,t)),this._$AV.push(e),r=i[++a]}o!==r?.index&&(n=U.nextNode(),o++)}return U.currentNode=T,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class J{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=K(this,t,e),E(t)?t===W||null==t||""===t?(this._$AH!==W&&this._$AR(),this._$AH=W):t!==this._$AH&&t!==V&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>P(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==W&&E(this._$AH)?this._$AA.nextSibling.data=t:this.T(T.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=X.createElement(q(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new G(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=N.get(t.strings);return void 0===e&&N.set(t.strings,e=new X(t)),e}k(t){P(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new J(this.O(D()),this.O(D()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=w(t).nextSibling;w(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class Z{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=W,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=W}_$AI(t,e=this,i,s){const n=this.strings;let o=!1;if(void 0===n)t=K(this,t,e,0),o=!E(t)||t!==this._$AH&&t!==V,o&&(this._$AH=t);else{const s=t;let a,r;for(t=n[0],a=0;a<n.length-1;a++)r=K(this,s[i+a],e,a),r===V&&(r=this._$AH[a]),o||=!E(r)||r!==this._$AH[a],r===W?t=W:t!==W&&(t+=(r??"")+n[a+1]),this._$AH[a]=r}o&&!s&&this.j(t)}j(t){t===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class Q extends Z{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===W?void 0:t}}class tt extends Z{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==W)}}class et extends Z{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=K(this,t,e,0)??W)===V)return;const i=this._$AH,s=t===W&&i!==W||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==W&&(i===W||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class it{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){K(this,t)}}const st=_.litHtmlPolyfillSupport;st?.(X,J),(_.litHtmlVersions??=[]).push("3.3.2");const nt=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class ot extends v{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let n=s._$litPart$;if(void 0===n){const t=i?.renderBefore??null;s._$litPart$=n=new J(e.insertBefore(D(),t),t,void 0,i??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return V}}ot._$litElement$=!0,ot.finalized=!0,nt.litElementHydrateSupport?.({LitElement:ot});const at=nt.litElementPolyfillSupport;at?.({LitElement:ot}),(nt.litElementVersions??=[]).push("4.2.2");const rt="--info-color",lt="#039be5",ct=.8,ht=[.25,.8],dt={var:"--success-color",fallback:"#43a047",opacity:.8},pt={var:"--warning-color",fallback:"#ffa726",opacity:.8},ut={var:"--error-color",fallback:"#db4437",opacity:.8},gt="--disabled-text-color",ft="#999",mt="--secondary-text-color",bt="#999",xt="--primary-text-color",yt="#212121",vt="--ha-card-background",_t="#fff",wt=`var(${"--primary-color"}, ${"#03a9f4"})`,kt=`var(${rt}, ${lt})`,St=`var(${dt.var}, ${dt.fallback})`,$t=`var(${pt.var}, ${pt.fallback})`,Mt=`var(${ut.var}, ${ut.fallback})`,Ct=`var(${gt}, ${ft})`,At=`var(${mt}, ${bt})`,Tt="#F44336",Dt="#FF9800",Et="#4CAF50";function Pt(t){const e=Lt(t);return null!==e?e+"%":"—"}function Lt(t){return null===t?null:Math.ceil(t)}function Ot(t,e,i=20){if(null===t)return Ct;const s=e??i;return t<=s/2?Mt:t<=1.25*s?$t:St}function Rt(t){if(!t)return{count:0,type:""};const e=t.match(/^(\d+)\s*[×x]\s*(.+)$/i);return e?{count:parseInt(e[1]),type:e[2].trim()}:{count:1,type:t.trim()}}function zt(t,e=!1){if(!t)return"—";try{const i=new Date(t);if(i.getTime()-Date.now()>31536e7)return"—";const s=new Date,n=i.getFullYear()===s.getFullYear();if(e){const t=n?{month:"short",day:"numeric"}:{month:"short",day:"numeric",year:"numeric"};return i.toLocaleDateString(void 0,t)+" "+i.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}return i.toLocaleDateString(void 0,{month:"short",day:"numeric",year:n?void 0:"numeric"})}catch{return"—"}}function jt(t){const e=[],i=(t.name||"").toLowerCase();t.manufacturer&&!i.includes(t.manufacturer.toLowerCase())&&e.push(t.manufacturer),t.model&&!i.includes(t.model.toLowerCase())&&e.push(t.model);let s=e.join(" ");return s&&t.platform?s+=` · ${t.platform}`:!s&&t.platform&&(s=t.platform),s||null}function It(t,e,i){const s={message:e};i&&(s.action=i,s.duration=8e3),t.dispatchEvent(new CustomEvent("hass-notification",{bubbles:!0,composed:!0,detail:s}))}const Ht=((t,...e)=>{const s=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new n(s,t,i)})`
  :host {
    display: block;
    font-family: var(--primary-font-family, Roboto, sans-serif);
    color: var(--primary-text-color);
    background: var(--primary-background-color);
    --card-bg: var(--ha-card-background, var(--card-background-color, #fff));
    --border: var(--divider-color, rgba(0, 0, 0, 0.12));
    height: 100%;
    overflow: hidden;
  }
  /* Toolbar is provided by hass-tabs-subpage */
  ha-icon-button[slot="toolbar-icon"] {
    color: var(--sidebar-icon-color);
  }
  #jp-content,
  .jp-padded {
    padding: 16px;
  }
  /* Hero card */
  .hero-row { display: flex; align-items: stretch; }
  .hero-left {
    flex-shrink: 0; padding: 20px 24px; text-align: center;
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-width: 130px;
  }
  .hero-big { font-size: 42px; font-weight: 800; line-height: 1; letter-spacing: -1.5px; }
  .hero-unit { font-size: 12px; color: var(--secondary-text-color); margin-top: 3px; font-weight: 500; }
  .hero-right {
    flex: 1; padding: 16px; display: flex; flex-direction: column;
    justify-content: center; min-width: 0;
  }
  .hero-name-row { display: flex; align-items: center; gap: 4px; }
  .hero-name { font-size: 17px; font-weight: 600; line-height: 1.3; }
  .hero-sub { font-size: 12px; color: var(--secondary-text-color); margin-top: 2px; }
  .hero-bar-row { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
  .hero-bar {
    flex: 1; height: 8px;
    background: var(--secondary-background-color);
    border-radius: 4px; overflow: hidden;
  }
  .hero-bar-fill { height: 100%; border-radius: 4px; }
  .hero-bar-pct { font-size: 13px; font-weight: 600; min-width: 36px; }
  .hero-stats { display: flex; border-top: 1px solid var(--border); }
  .hero-stat { flex: 1; padding: 10px 12px; text-align: center; }
  .hero-stat + .hero-stat { border-left: 1px solid var(--border); }
  .hero-stat-label {
    font-size: 11px; color: var(--secondary-text-color);
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .hero-stat-val { font-size: 14px; font-weight: 500; margin-top: 2px; }

  /* Hero responsive */
  @container hero (max-width: 480px) {
    .hero-row { flex-direction: column; }
    .hero-left {
      border-right: none; border-bottom: 1px solid var(--border);
      padding: 14px 16px; flex-direction: row; gap: 8px;
      min-width: unset; justify-content: flex-start; align-items: baseline;
    }
    .hero-big { font-size: 32px; }
    .hero-unit { margin-top: 0; }
    .hero-right { padding: 12px 16px; }
    .hero-name { font-size: 15px; }
    .hero-bar-row { margin-top: 8px; }
    .hero-stats { flex-wrap: wrap; }
    .hero-stat { flex: 1 1 calc(50% - 1px); padding: 8px 10px; }
    .hero-stat:nth-child(odd):not(:first-child) { border-left: none; }
    .hero-stat:nth-child(1), .hero-stat:nth-child(2) {
      border-bottom: 1px solid var(--border);
    }
  }

  /* Chart card header */
  .chart-card-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px;
  }
  .chart-card-title { font-size: 14px; font-weight: 500; }

  /* Prediction details grid (inside expansion panel) */
  /* Replacement history table inside expansion panel */
  .expansion-content {
    padding: 8px 8px 16px;
  }
  .summary-card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 16px 20px;
    min-width: 120px;
    border: 1px solid var(--border);
  }
  .summary-card .value {
    font-size: 28px;
    font-weight: 500;
  }
  .summary-card .label {
    font-size: 13px;
    color: var(--secondary-text-color);
    margin-top: 2px;
  }
  .settings-card {
    margin-bottom: 20px;
  }
  .settings-card ha-textfield {
    --text-field-padding: 0 8px;
  }
  hass-tabs-subpage-data-table {
    --data-table-row-height: 60px;
    --ha-dropdown-font-size: 14px;
  }
  .jp-filter-list {
    display: flex;
    flex-direction: column;
    padding: 4px 0;
  }
  .jp-filter-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 16px;
    cursor: pointer;
    font-size: 14px;
  }
  .jp-filter-item:hover {
    background: var(--secondary-background-color);
  }
  .jp-level-range {
    padding: 4px 0;
  }
  .jp-level-slider-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 16px;
  }
  .jp-level-label {
    font-size: 13px;
    color: var(--secondary-text-color);
    width: 28px;
    flex-shrink: 0;
  }
  .jp-level-slider-row ha-slider {
    flex: 1;
  }
  .jp-level-value {
    font-size: 12px;
    font-weight: 500;
    width: 36px;
    text-align: right;
    flex-shrink: 0;
  }
  .devices {
    background: var(--card-bg);
    border-radius: 12px;
    border: 1px solid var(--border);
    overflow: hidden;
  }
  .confidence-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 4px;
    vertical-align: middle;
  }
  .confidence-dot.high { background: var(--success-color); }
  .confidence-dot.medium { background: var(--warning-color); }
  .confidence-dot.low { background: var(--error-color); }
  .confidence-dot.insufficient_data { background: var(--disabled-text-color, #999); }
  .confidence-dot.history-based { background: var(--disabled-text-color, #999); }
  .empty-state {
    padding: 40px;
    text-align: center;
    color: var(--secondary-text-color);
  }
  .loading-state {
    padding: 32px;
    text-align: center;
    color: var(--secondary-text-color);
  }
  .loading-state ha-spinner {
    margin-bottom: 8px;
  }
  .jp-dialog-desc {
    font-size: 13px;
    color: var(--secondary-text-color);
    flex: 1;
  }
  .jp-overflow-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    z-index: 20;
    min-width: 160px;
    background: var(--card-background-color, #fff);
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }
  .jp-overflow-menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 14px;
    border: none;
    background: transparent;
    color: var(--primary-text-color);
    font-size: 14px;
    cursor: pointer;
    outline: none;
    text-align: left;
    font-family: inherit;
    transition: background-color 0.1s;
  }
  .jp-overflow-menu-item:hover {
    background: var(--secondary-background-color);
  }
  .jp-rechargeable-section {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 8px 0;
    cursor: pointer;
  }
  .jp-rechargeable-section ha-switch {
    flex-shrink: 0;
    margin-top: 2px;
  }
  .jp-rechargeable-labels {
    flex: 1;
  }
  .jp-batteries-heading {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 4px;
  }
  .jp-count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    box-sizing: border-box;
    margin-left: 8px;
  }
  .jp-batteries-section {
    transition: opacity 0.25s;
  }
  .jp-batteries-section.jp-disabled-overlay {
    opacity: 0.3;
    pointer-events: none;
    position: relative;
  }
  .jp-unknown-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 16px;
    border: 1px dashed var(--disabled-text-color, #999);
    color: var(--disabled-text-color, #999);
    font-size: 13px;
    font-weight: 500;
    font-style: italic;
    cursor: default;
  }
  .jp-unknown-chip ha-icon {
    color: var(--disabled-text-color, #999);
  }
  .jp-custom-trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 14px;
    border-radius: 16px;
    border: 1px dashed color-mix(in srgb, var(--primary-color) 55%, transparent);
    background: transparent;
    color: var(--primary-color);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }
  .jp-custom-trigger:hover:not([disabled]) {
    border-color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  }
  .jp-custom-trigger.active {
    border-style: solid;
    border-color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 15%, transparent);
  }
  .jp-custom-trigger.disabled {
    opacity: 0.35;
    cursor: default;
  }
  .jp-custom-popover {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    z-index: 10;
    width: 240px;
    background: var(--card-background-color, #fff);
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }
  .jp-custom-popover-input {
    padding: 8px 12px;
    border-bottom: 1px solid var(--divider-color);
  }
  .jp-custom-input {
    width: 100%;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--primary-text-color);
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
  }
  .jp-custom-suggestion {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    border: none;
    background: transparent;
    color: var(--primary-text-color);
    font-size: 14px;
    cursor: pointer;
    outline: none;
    text-align: left;
    font-family: inherit;
    transition: background-color 0.1s;
  }
  .jp-custom-suggestion:hover {
    background: var(--secondary-background-color);
  }
  .jp-autodetect-btn {
    flex-shrink: 0;
    color: var(--primary-color);
    --mdc-icon-button-size: 32px;
    --mdc-icon-size: 20px;
  }
  .jp-dialog-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
    align-items: center;
  }
  .jp-preset {
    padding: 4px 10px;
    border: 1px solid var(--border);
    border-radius: 16px;
    background: var(--secondary-background-color);
    color: var(--primary-text-color);
    font-size: 12px;
    cursor: pointer;
    font-family: inherit;
  }
  .jp-preset:hover:not([disabled]) {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
  .jp-preset.active {
    border-color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 15%, transparent);
    color: var(--primary-color);
  }
  .jp-preset.disabled {
    opacity: 0.35;
    cursor: default;
  }
  .jp-badge-field {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--secondary-background-color);
    margin-bottom: 10px;
  }
  .jp-badge-field-chips {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  .jp-badge-chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 4px 10px;
    border-radius: 16px;
    font-size: 13px;
    font-weight: 500;
    background: color-mix(in srgb, var(--primary-color) 15%, transparent);
    color: var(--primary-color);
    cursor: pointer;
    user-select: none;
    border: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
  }
  .jp-badge-chip:hover {
    background: color-mix(in srgb, var(--error-color) 15%, transparent);
    color: var(--error-color);
    border-color: color-mix(in srgb, var(--error-color) 30%, transparent);
  }
  .jp-badge-placeholder {
    color: var(--secondary-text-color);
    font-size: 13px;
    font-style: italic;
  }
  .jp-dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 20px;
  }
  @keyframes jp-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  ha-icon-button.spinning ha-icon {
    animation: jp-spin 1s linear infinite;
  }
  .shopping-summary {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }
  .shopping-groups {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .shopping-type {
    font-size: 16px;
    font-weight: 500;
  }
  .shopping-devices-inner {
    padding: 0 8px;
  }
  .shopping-device {
    display: grid;
    grid-template-columns: 1fr 60px 60px;
    padding: 8px 0;
    border-top: 1px solid var(--border);
    font-size: 13px;
    align-items: center;
  }
  .shopping-device.needs-replacement {
    color: var(--error-color);
  }
  .shopping-device-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .shopping-device-level {
    text-align: right;
    font-weight: 500;
  }
  .shopping-device-days {
    text-align: right;
    color: var(--secondary-text-color);
  }
  .shopping-need-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 24px;
    padding: 0 6px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    background: color-mix(
      in srgb,
      var(--error-color, #db4437) 15%,
      transparent
    );
    color: var(--error-color, #db4437);
  }
  .shopping-need-card {
    min-width: 80px;
    text-align: center;
  }
  .shopping-need-card .value {
    font-size: 22px;
  }
  .shopping-need-card .label {
    font-size: 11px;
  }
  .shopping-hint {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 12px 16px;
    background: color-mix(in srgb, var(--info-color, #039be5) 10%, transparent);
    border-radius: 8px;
    font-size: 13px;
    color: var(--secondary-text-color);
  }
  .detail-reason {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin-top: 12px;
    padding: 12px 14px;
    background: color-mix(in srgb, var(--info-color, #039be5) 8%, transparent);
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.5;
  }
  .detail-reason strong {
    display: block;
    margin-bottom: 2px;
  }
  .detail-reason-text {
    color: var(--secondary-text-color);
  }
  .chart-range-bar {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .range-pill {
    border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
    background: transparent;
    color: var(--primary-text-color);
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: inherit;
    line-height: 1.4;
  }
  .range-pill:hover {
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
    border-color: var(--primary-color);
  }
  .range-pill.active {
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
    border-color: var(--primary-color);
  }
  .chart-stale-notice {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    margin-bottom: 8px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
    color: var(--primary-color);
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .chart-stale-notice:hover {
    background: color-mix(in srgb, var(--primary-color) 18%, transparent);
  }
  .detail-chart {
    background: var(--card-bg);
    border-radius: 12px;
    border: 1px solid var(--border);
    padding: 8px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .detail-chart ha-chart-base {
    width: 100%;
  }
  .replacement-table {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0;
    font-size: 0.9em;
  }
  .replacement-table-header {
    display: contents;
  }
  .replacement-table-header > span {
    padding: 6px 12px 6px 0;
    font-size: 0.8em;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--secondary-text-color);
    border-bottom: 1px solid var(--divider-color, rgba(0,0,0,0.12));
  }
  .replacement-table-row {
    display: contents;
  }
  .replacement-table-row > span {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px 8px 0;
    border-bottom: 1px solid var(--divider-color, rgba(0,0,0,0.06));
  }
  .replacement-table-row.suspected > span {
    background: rgba(255, 152, 0, 0.05);
  }
  /* ══════════════════════════════
     DASHBOARD
     ══════════════════════════════ */
  .jp-dashboard {
    max-width: 1240px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ── Status badges ── */
  .jp-badge {
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 8px;
  }
  .jp-badge.error {
    background: color-mix(in srgb, var(--error-color) 15%, transparent);
    color: var(--error-color);
  }
  .jp-badge.warning {
    background: color-mix(in srgb, var(--warning-color) 15%, transparent);
    color: var(--warning-color);
  }
  .jp-badge.success {
    background: color-mix(in srgb, var(--success-color) 15%, transparent);
    color: var(--success-color);
  }
  .jp-badge.info {
    background: color-mix(in srgb, var(--info-color) 15%, transparent);
    color: var(--info-color);
  }
  .jp-badge.primary {
    background: color-mix(in srgb, var(--primary-color) 15%, transparent);
    color: var(--primary-color);
  }
  .jp-badge.neutral {
    background: color-mix(in srgb, var(--secondary-text-color) 12%, transparent);
    color: var(--secondary-text-color);
  }

  /* ── Dashboard shared card header ── */
  .db-card-header {
    padding: 14px 16px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
  }
  .db-card-title {
    font-size: 16px;
    font-weight: 500;
  }

  /* ── Dashboard layout grids ── */
  .db-top-row {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .db-mid-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .db-bottom-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  /* ── Attention table ── */
  .att-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .att-table th {
    font-size: 11px;
    color: var(--disabled-text-color);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: left;
    padding: 4px 8px 8px;
    font-weight: 400;
  }
  .att-table td {
    padding: 8px;
    border-top: 1px solid var(--border);
    vertical-align: middle;
  }
  .att-table .name-cell {
    font-weight: 500;
  }
  .att-table .dim {
    font-size: 12px;
    color: var(--secondary-text-color);
  }
  .att-row {
    cursor: pointer;
  }
  .att-row:hover {
    background: var(--secondary-background-color);
  }
  .level-indicator {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .level-bar {
    width: 40px;
    height: 5px;
    background: var(--border);
    border-radius: 3px;
    overflow: hidden;
  }
  .level-bar-fill {
    height: 100%;
    border-radius: 3px;
  }

  /* ── Most Wanted cards ── */
  .wanted-card {
    cursor: pointer;
    display: flex;
    flex-direction: column;
  }
  .wanted-card:hover {
    opacity: 0.92;
  }
  .wanted-top {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid var(--border);
  }
  .wanted-identity {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .wanted-name {
    font-size: 15px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .wanted-sub {
    font-size: 12px;
    color: var(--secondary-text-color);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .wanted-level {
    font-size: 28px;
    font-weight: 500;
    line-height: 1;
    flex-shrink: 0;
    margin-left: 12px;
  }
  .wanted-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border-bottom: 1px solid var(--border);
  }
  .ws {
    padding: 10px 14px;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .ws:nth-child(2n) { border-right: none; }
  .ws:nth-last-child(-n+2) { border-bottom: none; }
  .ws-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--disabled-text-color);
    margin-bottom: 2px;
  }
  .ws-value {
    font-size: 14px;
    font-weight: 500;
  }
  .wanted-gauge {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
  }
  .gauge-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--disabled-text-color);
    margin-bottom: 6px;
  }
  .gauge-track {
    height: 8px;
    background: var(--secondary-background-color);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }
  .gauge-fill {
    height: 100%;
    border-radius: 4px;
  }
  .gauge-threshold {
    position: absolute;
    top: -2px;
    height: 12px;
    width: 2px;
    border-radius: 1px;
    background: var(--primary-text-color);
    opacity: 0.3;
  }
  .gauge-axis {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: var(--disabled-text-color);
    margin-top: 3px;
  }
  .wanted-badges {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    padding: 10px 16px 12px;
  }
  .wanted-verdict {
    padding: 12px 16px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--secondary-text-color);
    flex: 1;
  }
  .wanted-verdict strong {
    color: var(--primary-text-color);
    font-weight: 500;
  }

  /* ── Overview stats (inside Overview card) ── */
  .db-overview-stats {
    display: flex;
    border-top: 1px solid var(--border);
  }
  .db-stat {
    flex: 1;
    padding: 12px 16px;
    text-align: center;
  }
  .db-stat + .db-stat {
    border-left: 1px solid var(--border);
  }
  .db-stat-value {
    font-size: 28px;
    font-weight: 500;
    line-height: 1;
    display: block;
  }
  .db-stat-label {
    font-size: 12px;
    color: var(--secondary-text-color);
    display: block;
    margin-top: 4px;
  }
  .db-stat-sub {
    font-size: 10px;
    color: var(--disabled-text-color);
    display: block;
    margin-top: 2px;
  }

  /* ── Health by Battery Type ── */
  .type-health-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .type-health-row {
    display: grid;
    grid-template-columns: 80px 1fr 36px;
    gap: 8px;
    align-items: center;
  }
  .th-type {
    font-size: 13px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .th-chart-container {
    height: 32px;
    min-width: 0;
  }
  .th-count {
    font-size: 12px;
    color: var(--secondary-text-color);
    text-align: right;
  }

  @media (max-width: 1060px) {
    .db-bottom-row { grid-template-columns: 1fr; }
    .db-mid-row { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .db-card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }
  }
  @media (max-width: 500px) {
    #jp-content,
    .jp-padded {
      padding: 10px;
    }
    .shopping-summary {
      flex-wrap: wrap;
      gap: 8px;
    }
    .shopping-summary .summary-card {
      min-width: 60px;
    }
    .detail-chart {
      padding: 4px;
    }
    .range-pill {
      padding: 3px 9px;
      font-size: 11px;
    }
  }
`;function Ft(t){const e=t._settingsValues?.low_threshold??20;return{icon:{title:"",type:"icon",moveable:!1,showNarrow:!0,template:t=>B`
        <ha-icon
          icon=${function(t){if(t.isRechargeable)return null===t.level?"mdi:battery-unknown":t.level<=10?"mdi:battery-charging-10":t.level<=30?"mdi:battery-charging-30":t.level<=60?"mdi:battery-charging-60":t.level<=90?"mdi:battery-charging-90":"mdi:battery-charging-100";const e=t.level;return null===e?"mdi:battery-unknown":e<=5?"mdi:battery-outline":e<=15?"mdi:battery-10":e<=25?"mdi:battery-20":e<=35?"mdi:battery-30":e<=45?"mdi:battery-40":e<=55?"mdi:battery-50":e<=65?"mdi:battery-60":e<=75?"mdi:battery-70":e<=85?"mdi:battery-80":e<=95?"mdi:battery-90":"mdi:battery"}(t)}
          style="color:${Ot(t.level,t.threshold,e)}"
        ></ha-icon>
      `},name:{title:"Device",main:!0,sortable:!0,filterable:!0,filterKey:"_searchText",direction:"asc",flex:3,showNarrow:!0,template:e=>{const i=function(t,e){const i=[],s=e._settingsValues?.low_threshold??20;if(t.isLow){const e=t.threshold??s;i.push({label_id:"low",name:"LOW",color:Tt,description:`Battery is at ${Lt(t.level)}%, below the ${e}% threshold`})}t.isStale&&i.push({label_id:"stale",name:"STALE",color:Dt,description:"No battery reading received within the stale timeout period"});t.isRechargeable&&function(t){return t.isRechargeable&&"charging"===t.chargingState}(t)&&i.push({label_id:"charging",name:"Charging",icon:"mdi:battery-charging",color:Et,description:"Currently charging"});return i}(e,t),s=jt(e);return B`
          <div style="overflow:hidden">
            <span>${e.name||e.sourceEntity}</span>
            ${s?B`<div style=${"font-size:11px;color:var(--secondary-text-color);opacity:0.7;margin-top:1px"}>${s}</div>`:W}
            ${i.length?B`<div style=${"display:flex;flex-wrap:wrap;gap:4px;margin-top:4px"}>${i.map(t=>function(t){return B`
    <span title=${t.description||""} style="display:inline-flex;align-items:center;gap:2px;font-size:11px;font-weight:500;padding:1px 8px;border-radius:10px;white-space:nowrap;background:color-mix(in srgb, ${t.color} 20%, transparent);color:${t.color}">
      ${t.icon?B`<ha-icon icon=${t.icon} style="--mdc-icon-size:14px"></ha-icon>`:W}
      ${t.name}
    </span>
  `}(t))}</div>`:W}
          </div>
        `}},level:{title:"Level",sortable:!0,type:"numeric",valueColumn:"_levelSort",minWidth:"70px",maxWidth:"90px",showNarrow:!0,template:t=>{const i=Ot(t.level,t.threshold,e);return B`<span style="color:${i};font-weight:500">${Pt(t.level)}</span>`}},batteryType:{title:"Type",sortable:!0,minWidth:"60px",maxWidth:"90px",template:t=>B`<span
        style="font-size:12px;color:var(--secondary-text-color)"
        title=${t.batteryTypeSource?`Source: ${t.batteryTypeSource}`:""}
      >${t.batteryType||"—"}</span>`},actions:{title:"",type:"overflow-menu",showNarrow:!0,template:e=>B`
        <ha-dropdown
          @wa-select=${i=>{i.stopPropagation(),t._handleMenuSelect(i,e.sourceEntity)}}
          @click=${t=>t.stopPropagation()}
        >
          <ha-icon-button
            slot="trigger"
            @click=${t=>{t.stopPropagation();const e=t.currentTarget.closest("ha-dropdown");e&&(e.open?e.hideMenu():e.showMenu())}}
          >
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </ha-icon-button>
          ${function(t){return B`
    <ha-dropdown-item value="detail">
      <ha-icon slot="icon" icon="mdi:information-outline"></ha-icon>
      More info
    </ha-dropdown-item>
    <wa-divider></wa-divider>
    <ha-dropdown-item value="replace">
      <ha-icon slot="icon" icon="mdi:battery-sync"></ha-icon>
      Mark as replaced
    </ha-dropdown-item>
    <ha-dropdown-item value="type">
      <ha-icon slot="icon" icon="mdi:battery-heart-variant"></ha-icon>
      Set battery type${t?.batteryType?` (${t.batteryType})`:""}
    </ha-dropdown-item>
    <wa-divider></wa-divider>
    <ha-dropdown-item value="ignore">
      <ha-icon slot="icon" icon="mdi:eye-off"></ha-icon>
      Ignore device
    </ha-dropdown-item>
  `}
/*!
 * @kurkle/color v0.3.4
 * https://github.com/kurkle/color#readme
 * (c) 2024 Jukka Kurkela
 * Released under the MIT License
 */(e)}
        </ha-dropdown>
      `}}}function Bt(t){return t+.5|0}const Vt=(t,e,i)=>Math.max(Math.min(t,i),e);function Wt(t){return Vt(Bt(2.55*t),0,255)}function Nt(t){return Vt(Bt(255*t),0,255)}function Ut(t){return Vt(Bt(t/2.55)/100,0,1)}function qt(t){return Vt(Bt(100*t),0,100)}const Yt={0:0,1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,A:10,B:11,C:12,D:13,E:14,F:15,a:10,b:11,c:12,d:13,e:14,f:15},Xt=[..."0123456789ABCDEF"],Kt=t=>Xt[15&t],Gt=t=>Xt[(240&t)>>4]+Xt[15&t],Jt=t=>(240&t)>>4==(15&t);function Zt(t){var e=(t=>Jt(t.r)&&Jt(t.g)&&Jt(t.b)&&Jt(t.a))(t)?Kt:Gt;return t?"#"+e(t.r)+e(t.g)+e(t.b)+((t,e)=>t<255?e(t):"")(t.a,e):void 0}const Qt=/^(hsla?|hwb|hsv)\(\s*([-+.e\d]+)(?:deg)?[\s,]+([-+.e\d]+)%[\s,]+([-+.e\d]+)%(?:[\s,]+([-+.e\d]+)(%)?)?\s*\)$/;function te(t,e,i){const s=e*Math.min(i,1-i),n=(e,n=(e+t/30)%12)=>i-s*Math.max(Math.min(n-3,9-n,1),-1);return[n(0),n(8),n(4)]}function ee(t,e,i){const s=(s,n=(s+t/60)%6)=>i-i*e*Math.max(Math.min(n,4-n,1),0);return[s(5),s(3),s(1)]}function ie(t,e,i){const s=te(t,1,.5);let n;for(e+i>1&&(n=1/(e+i),e*=n,i*=n),n=0;n<3;n++)s[n]*=1-e-i,s[n]+=e;return s}function se(t){const e=t.r/255,i=t.g/255,s=t.b/255,n=Math.max(e,i,s),o=Math.min(e,i,s),a=(n+o)/2;let r,l,c;return n!==o&&(c=n-o,l=a>.5?c/(2-n-o):c/(n+o),r=function(t,e,i,s,n){return t===n?(e-i)/s+(e<i?6:0):e===n?(i-t)/s+2:(t-e)/s+4}(e,i,s,c,n),r=60*r+.5),[0|r,l||0,a]}function ne(t,e,i,s){return(Array.isArray(e)?t(e[0],e[1],e[2]):t(e,i,s)).map(Nt)}function oe(t,e,i){return ne(te,t,e,i)}function ae(t){return(t%360+360)%360}function re(t){const e=Qt.exec(t);let i,s=255;if(!e)return;e[5]!==i&&(s=e[6]?Wt(+e[5]):Nt(+e[5]));const n=ae(+e[2]),o=+e[3]/100,a=+e[4]/100;return i="hwb"===e[1]?function(t,e,i){return ne(ie,t,e,i)}(n,o,a):"hsv"===e[1]?function(t,e,i){return ne(ee,t,e,i)}(n,o,a):oe(n,o,a),{r:i[0],g:i[1],b:i[2],a:s}}const le={x:"dark",Z:"light",Y:"re",X:"blu",W:"gr",V:"medium",U:"slate",A:"ee",T:"ol",S:"or",B:"ra",C:"lateg",D:"ights",R:"in",Q:"turquois",E:"hi",P:"ro",O:"al",N:"le",M:"de",L:"yello",F:"en",K:"ch",G:"arks",H:"ea",I:"ightg",J:"wh"},ce={OiceXe:"f0f8ff",antiquewEte:"faebd7",aqua:"ffff",aquamarRe:"7fffd4",azuY:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"0",blanKedOmond:"ffebcd",Xe:"ff",XeviTet:"8a2be2",bPwn:"a52a2a",burlywood:"deb887",caMtXe:"5f9ea0",KartYuse:"7fff00",KocTate:"d2691e",cSO:"ff7f50",cSnflowerXe:"6495ed",cSnsilk:"fff8dc",crimson:"dc143c",cyan:"ffff",xXe:"8b",xcyan:"8b8b",xgTMnPd:"b8860b",xWay:"a9a9a9",xgYF:"6400",xgYy:"a9a9a9",xkhaki:"bdb76b",xmagFta:"8b008b",xTivegYF:"556b2f",xSange:"ff8c00",xScEd:"9932cc",xYd:"8b0000",xsOmon:"e9967a",xsHgYF:"8fbc8f",xUXe:"483d8b",xUWay:"2f4f4f",xUgYy:"2f4f4f",xQe:"ced1",xviTet:"9400d3",dAppRk:"ff1493",dApskyXe:"bfff",dimWay:"696969",dimgYy:"696969",dodgerXe:"1e90ff",fiYbrick:"b22222",flSOwEte:"fffaf0",foYstWAn:"228b22",fuKsia:"ff00ff",gaRsbSo:"dcdcdc",ghostwEte:"f8f8ff",gTd:"ffd700",gTMnPd:"daa520",Way:"808080",gYF:"8000",gYFLw:"adff2f",gYy:"808080",honeyMw:"f0fff0",hotpRk:"ff69b4",RdianYd:"cd5c5c",Rdigo:"4b0082",ivSy:"fffff0",khaki:"f0e68c",lavFMr:"e6e6fa",lavFMrXsh:"fff0f5",lawngYF:"7cfc00",NmoncEffon:"fffacd",ZXe:"add8e6",ZcSO:"f08080",Zcyan:"e0ffff",ZgTMnPdLw:"fafad2",ZWay:"d3d3d3",ZgYF:"90ee90",ZgYy:"d3d3d3",ZpRk:"ffb6c1",ZsOmon:"ffa07a",ZsHgYF:"20b2aa",ZskyXe:"87cefa",ZUWay:"778899",ZUgYy:"778899",ZstAlXe:"b0c4de",ZLw:"ffffe0",lime:"ff00",limegYF:"32cd32",lRF:"faf0e6",magFta:"ff00ff",maPon:"800000",VaquamarRe:"66cdaa",VXe:"cd",VScEd:"ba55d3",VpurpN:"9370db",VsHgYF:"3cb371",VUXe:"7b68ee",VsprRggYF:"fa9a",VQe:"48d1cc",VviTetYd:"c71585",midnightXe:"191970",mRtcYam:"f5fffa",mistyPse:"ffe4e1",moccasR:"ffe4b5",navajowEte:"ffdead",navy:"80",Tdlace:"fdf5e6",Tive:"808000",TivedBb:"6b8e23",Sange:"ffa500",SangeYd:"ff4500",ScEd:"da70d6",pOegTMnPd:"eee8aa",pOegYF:"98fb98",pOeQe:"afeeee",pOeviTetYd:"db7093",papayawEp:"ffefd5",pHKpuff:"ffdab9",peru:"cd853f",pRk:"ffc0cb",plum:"dda0dd",powMrXe:"b0e0e6",purpN:"800080",YbeccapurpN:"663399",Yd:"ff0000",Psybrown:"bc8f8f",PyOXe:"4169e1",saddNbPwn:"8b4513",sOmon:"fa8072",sandybPwn:"f4a460",sHgYF:"2e8b57",sHshell:"fff5ee",siFna:"a0522d",silver:"c0c0c0",skyXe:"87ceeb",UXe:"6a5acd",UWay:"708090",UgYy:"708090",snow:"fffafa",sprRggYF:"ff7f",stAlXe:"4682b4",tan:"d2b48c",teO:"8080",tEstN:"d8bfd8",tomato:"ff6347",Qe:"40e0d0",viTet:"ee82ee",JHt:"f5deb3",wEte:"ffffff",wEtesmoke:"f5f5f5",Lw:"ffff00",LwgYF:"9acd32"};let he;function de(t){he||(he=function(){const t={},e=Object.keys(ce),i=Object.keys(le);let s,n,o,a,r;for(s=0;s<e.length;s++){for(a=r=e[s],n=0;n<i.length;n++)o=i[n],r=r.replace(o,le[o]);o=parseInt(ce[a],16),t[r]=[o>>16&255,o>>8&255,255&o]}return t}(),he.transparent=[0,0,0,0]);const e=he[t.toLowerCase()];return e&&{r:e[0],g:e[1],b:e[2],a:4===e.length?e[3]:255}}const pe=/^rgba?\(\s*([-+.\d]+)(%)?[\s,]+([-+.e\d]+)(%)?[\s,]+([-+.e\d]+)(%)?(?:[\s,/]+([-+.e\d]+)(%)?)?\s*\)$/;const ue=t=>t<=.0031308?12.92*t:1.055*Math.pow(t,1/2.4)-.055,ge=t=>t<=.04045?t/12.92:Math.pow((t+.055)/1.055,2.4);function fe(t,e,i){if(t){let s=se(t);s[e]=Math.max(0,Math.min(s[e]+s[e]*i,0===e?360:1)),s=oe(s),t.r=s[0],t.g=s[1],t.b=s[2]}}function me(t,e){return t?Object.assign(e||{},t):t}function be(t){var e={r:0,g:0,b:0,a:255};return Array.isArray(t)?t.length>=3&&(e={r:t[0],g:t[1],b:t[2],a:255},t.length>3&&(e.a=Nt(t[3]))):(e=me(t,{r:0,g:0,b:0,a:1})).a=Nt(e.a),e}function xe(t){return"r"===t.charAt(0)?function(t){const e=pe.exec(t);let i,s,n,o=255;if(e){if(e[7]!==i){const t=+e[7];o=e[8]?Wt(t):Vt(255*t,0,255)}return i=+e[1],s=+e[3],n=+e[5],i=255&(e[2]?Wt(i):Vt(i,0,255)),s=255&(e[4]?Wt(s):Vt(s,0,255)),n=255&(e[6]?Wt(n):Vt(n,0,255)),{r:i,g:s,b:n,a:o}}}(t):re(t)}class ye{constructor(t){if(t instanceof ye)return t;const e=typeof t;let i;var s,n,o;"object"===e?i=be(t):"string"===e&&(o=(s=t).length,"#"===s[0]&&(4===o||5===o?n={r:255&17*Yt[s[1]],g:255&17*Yt[s[2]],b:255&17*Yt[s[3]],a:5===o?17*Yt[s[4]]:255}:7!==o&&9!==o||(n={r:Yt[s[1]]<<4|Yt[s[2]],g:Yt[s[3]]<<4|Yt[s[4]],b:Yt[s[5]]<<4|Yt[s[6]],a:9===o?Yt[s[7]]<<4|Yt[s[8]]:255})),i=n||de(t)||xe(t)),this._rgb=i,this._valid=!!i}get valid(){return this._valid}get rgb(){var t=me(this._rgb);return t&&(t.a=Ut(t.a)),t}set rgb(t){this._rgb=be(t)}rgbString(){return this._valid?function(t){return t&&(t.a<255?`rgba(${t.r}, ${t.g}, ${t.b}, ${Ut(t.a)})`:`rgb(${t.r}, ${t.g}, ${t.b})`)}(this._rgb):void 0}hexString(){return this._valid?Zt(this._rgb):void 0}hslString(){return this._valid?function(t){if(!t)return;const e=se(t),i=e[0],s=qt(e[1]),n=qt(e[2]);return t.a<255?`hsla(${i}, ${s}%, ${n}%, ${Ut(t.a)})`:`hsl(${i}, ${s}%, ${n}%)`}(this._rgb):void 0}mix(t,e){if(t){const i=this.rgb,s=t.rgb;let n;const o=e===n?.5:e,a=2*o-1,r=i.a-s.a,l=((a*r===-1?a:(a+r)/(1+a*r))+1)/2;n=1-l,i.r=255&l*i.r+n*s.r+.5,i.g=255&l*i.g+n*s.g+.5,i.b=255&l*i.b+n*s.b+.5,i.a=o*i.a+(1-o)*s.a,this.rgb=i}return this}interpolate(t,e){return t&&(this._rgb=function(t,e,i){const s=ge(Ut(t.r)),n=ge(Ut(t.g)),o=ge(Ut(t.b));return{r:Nt(ue(s+i*(ge(Ut(e.r))-s))),g:Nt(ue(n+i*(ge(Ut(e.g))-n))),b:Nt(ue(o+i*(ge(Ut(e.b))-o))),a:t.a+i*(e.a-t.a)}}(this._rgb,t._rgb,e)),this}clone(){return new ye(this.rgb)}alpha(t){return this._rgb.a=Nt(t),this}clearer(t){return this._rgb.a*=1-t,this}greyscale(){const t=this._rgb,e=Bt(.3*t.r+.59*t.g+.11*t.b);return t.r=t.g=t.b=e,this}opaquer(t){return this._rgb.a*=1+t,this}negate(){const t=this._rgb;return t.r=255-t.r,t.g=255-t.g,t.b=255-t.b,this}lighten(t){return fe(this._rgb,2,t),this}darken(t){return fe(this._rgb,2,-t),this}saturate(t){return fe(this._rgb,1,t),this}desaturate(t){return fe(this._rgb,1,-t),this}rotate(t){return function(t,e){var i=se(t);i[0]=ae(i[0]+e),i=oe(i),t.r=i[0],t.g=i[1],t.b=i[2]}(this._rgb,t),this}}
/*!
 * Chart.js v4.5.1
 * https://www.chartjs.org
 * (c) 2025 Chart.js Contributors
 * Released under the MIT License
 */function ve(){}const _e=(()=>{let t=0;return()=>t++})();function we(t){return null==t}function ke(t){if(Array.isArray&&Array.isArray(t))return!0;const e=Object.prototype.toString.call(t);return"[object"===e.slice(0,7)&&"Array]"===e.slice(-6)}function Se(t){return null!==t&&"[object Object]"===Object.prototype.toString.call(t)}function $e(t){return("number"==typeof t||t instanceof Number)&&isFinite(+t)}function Me(t,e){return $e(t)?t:e}function Ce(t,e){return void 0===t?e:t}function Ae(t,e,i){if(t&&"function"==typeof t.call)return t.apply(i,e)}function Te(t,e,i,s){let n,o,a;if(ke(t))for(o=t.length,n=0;n<o;n++)e.call(i,t[n],n);else if(Se(t))for(a=Object.keys(t),o=a.length,n=0;n<o;n++)e.call(i,t[a[n]],a[n])}function De(t,e){let i,s,n,o;if(!t||!e||t.length!==e.length)return!1;for(i=0,s=t.length;i<s;++i)if(n=t[i],o=e[i],n.datasetIndex!==o.datasetIndex||n.index!==o.index)return!1;return!0}function Ee(t){if(ke(t))return t.map(Ee);if(Se(t)){const e=Object.create(null),i=Object.keys(t),s=i.length;let n=0;for(;n<s;++n)e[i[n]]=Ee(t[i[n]]);return e}return t}function Pe(t){return-1===["__proto__","prototype","constructor"].indexOf(t)}function Le(t,e,i,s){if(!Pe(t))return;const n=e[t],o=i[t];Se(n)&&Se(o)?Oe(n,o,s):e[t]=Ee(o)}function Oe(t,e,i){const s=ke(e)?e:[e],n=s.length;if(!Se(t))return t;const o=(i=i||{}).merger||Le;let a;for(let e=0;e<n;++e){if(a=s[e],!Se(a))continue;const n=Object.keys(a);for(let e=0,s=n.length;e<s;++e)o(n[e],t,a,i)}return t}function Re(t,e){return Oe(t,e,{merger:ze})}function ze(t,e,i){if(!Pe(t))return;const s=e[t],n=i[t];Se(s)&&Se(n)?Re(s,n):Object.prototype.hasOwnProperty.call(e,t)||(e[t]=Ee(n))}const je={"":t=>t,x:t=>t.x,y:t=>t.y};function Ie(t,e){const i=je[e]||(je[e]=function(t){const e=function(t){const e=t.split("."),i=[];let s="";for(const t of e)s+=t,s.endsWith("\\")?s=s.slice(0,-1)+".":(i.push(s),s="");return i}(t);return t=>{for(const i of e){if(""===i)break;t=t&&t[i]}return t}}(e));return i(t)}function He(t){return t.charAt(0).toUpperCase()+t.slice(1)}const Fe=t=>void 0!==t,Be=t=>"function"==typeof t,Ve=(t,e)=>{if(t.size!==e.size)return!1;for(const i of t)if(!e.has(i))return!1;return!0};const We=Math.PI,Ne=2*We,Ue=Ne+We,qe=Number.POSITIVE_INFINITY,Ye=We/180,Xe=We/2,Ke=We/4,Ge=2*We/3,Je=Math.log10,Ze=Math.sign;function Qe(t,e,i){return Math.abs(t-e)<i}function ti(t){const e=Math.round(t);t=Qe(t,e,t/1e3)?e:t;const i=Math.pow(10,Math.floor(Je(t))),s=t/i;return(s<=1?1:s<=2?2:s<=5?5:10)*i}function ei(t){return!function(t){return"symbol"==typeof t||"object"==typeof t&&null!==t&&!(Symbol.toPrimitive in t||"toString"in t||"valueOf"in t)}(t)&&!isNaN(parseFloat(t))&&isFinite(t)}function ii(t){return t*(We/180)}function si(t){if(!$e(t))return;let e=1,i=0;for(;Math.round(t*e)/e!==t;)e*=10,i++;return i}function ni(t,e){return Math.sqrt(Math.pow(e.x-t.x,2)+Math.pow(e.y-t.y,2))}function oi(t,e){return(t-e+Ue)%Ne-We}function ai(t){return(t%Ne+Ne)%Ne}function ri(t,e,i,s){const n=ai(t),o=ai(e),a=ai(i),r=ai(o-n),l=ai(a-n),c=ai(n-o),h=ai(n-a);return n===o||n===a||s&&o===a||r>l&&c<h}function li(t,e,i){return Math.max(e,Math.min(i,t))}function ci(t,e,i,s=1e-6){return t>=Math.min(e,i)-s&&t<=Math.max(e,i)+s}function hi(t,e,i){i=i||(i=>t[i]<e);let s,n=t.length-1,o=0;for(;n-o>1;)s=o+n>>1,i(s)?o=s:n=s;return{lo:o,hi:n}}const di=(t,e,i,s)=>hi(t,i,s?s=>{const n=t[s][e];return n<i||n===i&&t[s+1][e]===i}:s=>t[s][e]<i),pi=(t,e,i)=>hi(t,i,s=>t[s][e]>=i);const ui=["push","pop","shift","splice","unshift"];function gi(t,e){const i=t._chartjs;if(!i)return;const s=i.listeners,n=s.indexOf(e);-1!==n&&s.splice(n,1),s.length>0||(ui.forEach(e=>{delete t[e]}),delete t._chartjs)}const fi="undefined"==typeof window?function(t){return t()}:window.requestAnimationFrame;function mi(t,e){let i=[],s=!1;return function(...n){i=n,s||(s=!0,fi.call(window,()=>{s=!1,t.apply(e,i)}))}}const bi=t=>"start"===t?"left":"end"===t?"right":"center",xi=(t,e,i)=>"start"===t?e:"end"===t?i:(e+i)/2;const yi=t=>0===t||1===t,vi=(t,e,i)=>-Math.pow(2,10*(t-=1))*Math.sin((t-e)*Ne/i),_i=(t,e,i)=>Math.pow(2,-10*t)*Math.sin((t-e)*Ne/i)+1,wi={linear:t=>t,easeInQuad:t=>t*t,easeOutQuad:t=>-t*(t-2),easeInOutQuad:t=>(t/=.5)<1?.5*t*t:-.5*(--t*(t-2)-1),easeInCubic:t=>t*t*t,easeOutCubic:t=>(t-=1)*t*t+1,easeInOutCubic:t=>(t/=.5)<1?.5*t*t*t:.5*((t-=2)*t*t+2),easeInQuart:t=>t*t*t*t,easeOutQuart:t=>-((t-=1)*t*t*t-1),easeInOutQuart:t=>(t/=.5)<1?.5*t*t*t*t:-.5*((t-=2)*t*t*t-2),easeInQuint:t=>t*t*t*t*t,easeOutQuint:t=>(t-=1)*t*t*t*t+1,easeInOutQuint:t=>(t/=.5)<1?.5*t*t*t*t*t:.5*((t-=2)*t*t*t*t+2),easeInSine:t=>1-Math.cos(t*Xe),easeOutSine:t=>Math.sin(t*Xe),easeInOutSine:t=>-.5*(Math.cos(We*t)-1),easeInExpo:t=>0===t?0:Math.pow(2,10*(t-1)),easeOutExpo:t=>1===t?1:1-Math.pow(2,-10*t),easeInOutExpo:t=>yi(t)?t:t<.5?.5*Math.pow(2,10*(2*t-1)):.5*(2-Math.pow(2,-10*(2*t-1))),easeInCirc:t=>t>=1?t:-(Math.sqrt(1-t*t)-1),easeOutCirc:t=>Math.sqrt(1-(t-=1)*t),easeInOutCirc:t=>(t/=.5)<1?-.5*(Math.sqrt(1-t*t)-1):.5*(Math.sqrt(1-(t-=2)*t)+1),easeInElastic:t=>yi(t)?t:vi(t,.075,.3),easeOutElastic:t=>yi(t)?t:_i(t,.075,.3),easeInOutElastic(t){const e=.1125;return yi(t)?t:t<.5?.5*vi(2*t,e,.45):.5+.5*_i(2*t-1,e,.45)},easeInBack(t){const e=1.70158;return t*t*((e+1)*t-e)},easeOutBack(t){const e=1.70158;return(t-=1)*t*((e+1)*t+e)+1},easeInOutBack(t){let e=1.70158;return(t/=.5)<1?t*t*((1+(e*=1.525))*t-e)*.5:.5*((t-=2)*t*((1+(e*=1.525))*t+e)+2)},easeInBounce:t=>1-wi.easeOutBounce(1-t),easeOutBounce(t){const e=7.5625,i=2.75;return t<1/i?e*t*t:t<2/i?e*(t-=1.5/i)*t+.75:t<2.5/i?e*(t-=2.25/i)*t+.9375:e*(t-=2.625/i)*t+.984375},easeInOutBounce:t=>t<.5?.5*wi.easeInBounce(2*t):.5*wi.easeOutBounce(2*t-1)+.5};function ki(t){if(t&&"object"==typeof t){const e=t.toString();return"[object CanvasPattern]"===e||"[object CanvasGradient]"===e}return!1}function Si(t){return ki(t)?t:new ye(t)}function $i(t){return ki(t)?t:new ye(t).saturate(.5).darken(.1).hexString()}const Mi=["x","y","borderWidth","radius","tension"],Ci=["color","borderColor","backgroundColor"];const Ai=new Map;function Ti(t,e,i){return function(t,e){e=e||{};const i=t+JSON.stringify(e);let s=Ai.get(i);return s||(s=new Intl.NumberFormat(t,e),Ai.set(i,s)),s}(e,i).format(t)}var Di={formatters:{values:t=>ke(t)?t:""+t,numeric(t,e,i){if(0===t)return"0";const s=this.chart.options.locale;let n,o=t;if(i.length>1){const e=Math.max(Math.abs(i[0].value),Math.abs(i[i.length-1].value));(e<1e-4||e>1e15)&&(n="scientific"),o=function(t,e){let i=e.length>3?e[2].value-e[1].value:e[1].value-e[0].value;Math.abs(i)>=1&&t!==Math.floor(t)&&(i=t-Math.floor(t));return i}(t,i)}const a=Je(Math.abs(o)),r=isNaN(a)?1:Math.max(Math.min(-1*Math.floor(a),20),0),l={notation:n,minimumFractionDigits:r,maximumFractionDigits:r};return Object.assign(l,this.options.ticks.format),Ti(t,s,l)}}};const Ei=Object.create(null),Pi=Object.create(null);function Li(t,e){if(!e)return t;const i=e.split(".");for(let e=0,s=i.length;e<s;++e){const s=i[e];t=t[s]||(t[s]=Object.create(null))}return t}function Oi(t,e,i){return"string"==typeof e?Oe(Li(t,e),i):Oe(Li(t,""),e)}class Ri{constructor(t,e){this.animation=void 0,this.backgroundColor="rgba(0,0,0,0.1)",this.borderColor="rgba(0,0,0,0.1)",this.color="#666",this.datasets={},this.devicePixelRatio=t=>t.chart.platform.getDevicePixelRatio(),this.elements={},this.events=["mousemove","mouseout","click","touchstart","touchmove"],this.font={family:"'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",size:12,style:"normal",lineHeight:1.2,weight:null},this.hover={},this.hoverBackgroundColor=(t,e)=>$i(e.backgroundColor),this.hoverBorderColor=(t,e)=>$i(e.borderColor),this.hoverColor=(t,e)=>$i(e.color),this.indexAxis="x",this.interaction={mode:"nearest",intersect:!0,includeInvisible:!1},this.maintainAspectRatio=!0,this.onHover=null,this.onClick=null,this.parsing=!0,this.plugins={},this.responsive=!0,this.scale=void 0,this.scales={},this.showLine=!0,this.drawActiveElementsOnTop=!0,this.describe(t),this.apply(e)}set(t,e){return Oi(this,t,e)}get(t){return Li(this,t)}describe(t,e){return Oi(Pi,t,e)}override(t,e){return Oi(Ei,t,e)}route(t,e,i,s){const n=Li(this,t),o=Li(this,i),a="_"+e;Object.defineProperties(n,{[a]:{value:n[e],writable:!0},[e]:{enumerable:!0,get(){const t=this[a],e=o[s];return Se(t)?Object.assign({},e,t):Ce(t,e)},set(t){this[a]=t}}})}apply(t){t.forEach(t=>t(this))}}var zi=new Ri({_scriptable:t=>!t.startsWith("on"),_indexable:t=>"events"!==t,hover:{_fallback:"interaction"},interaction:{_scriptable:!1,_indexable:!1}},[function(t){t.set("animation",{delay:void 0,duration:1e3,easing:"easeOutQuart",fn:void 0,from:void 0,loop:void 0,to:void 0,type:void 0}),t.describe("animation",{_fallback:!1,_indexable:!1,_scriptable:t=>"onProgress"!==t&&"onComplete"!==t&&"fn"!==t}),t.set("animations",{colors:{type:"color",properties:Ci},numbers:{type:"number",properties:Mi}}),t.describe("animations",{_fallback:"animation"}),t.set("transitions",{active:{animation:{duration:400}},resize:{animation:{duration:0}},show:{animations:{colors:{from:"transparent"},visible:{type:"boolean",duration:0}}},hide:{animations:{colors:{to:"transparent"},visible:{type:"boolean",easing:"linear",fn:t=>0|t}}}})},function(t){t.set("layout",{autoPadding:!0,padding:{top:0,right:0,bottom:0,left:0}})},function(t){t.set("scale",{display:!0,offset:!1,reverse:!1,beginAtZero:!1,bounds:"ticks",clip:!0,grace:0,grid:{display:!0,lineWidth:1,drawOnChartArea:!0,drawTicks:!0,tickLength:8,tickWidth:(t,e)=>e.lineWidth,tickColor:(t,e)=>e.color,offset:!1},border:{display:!0,dash:[],dashOffset:0,width:1},title:{display:!1,text:"",padding:{top:4,bottom:4}},ticks:{minRotation:0,maxRotation:50,mirror:!1,textStrokeWidth:0,textStrokeColor:"",padding:3,display:!0,autoSkip:!0,autoSkipPadding:3,labelOffset:0,callback:Di.formatters.values,minor:{},major:{},align:"center",crossAlign:"near",showLabelBackdrop:!1,backdropColor:"rgba(255, 255, 255, 0.75)",backdropPadding:2}}),t.route("scale.ticks","color","","color"),t.route("scale.grid","color","","borderColor"),t.route("scale.border","color","","borderColor"),t.route("scale.title","color","","color"),t.describe("scale",{_fallback:!1,_scriptable:t=>!t.startsWith("before")&&!t.startsWith("after")&&"callback"!==t&&"parser"!==t,_indexable:t=>"borderDash"!==t&&"tickBorderDash"!==t&&"dash"!==t}),t.describe("scales",{_fallback:"scale"}),t.describe("scale.ticks",{_scriptable:t=>"backdropPadding"!==t&&"callback"!==t,_indexable:t=>"backdropPadding"!==t})}]);function ji(t,e,i,s,n){let o=e[n];return o||(o=e[n]=t.measureText(n).width,i.push(n)),o>s&&(s=o),s}function Ii(t,e,i){const s=t.currentDevicePixelRatio,n=0!==i?Math.max(i/2,.5):0;return Math.round((e-n)*s)/s+n}function Hi(t,e){(e||t)&&((e=e||t.getContext("2d")).save(),e.resetTransform(),e.clearRect(0,0,t.width,t.height),e.restore())}function Fi(t,e,i,s){Bi(t,e,i,s,null)}function Bi(t,e,i,s,n){let o,a,r,l,c,h,d,p;const u=e.pointStyle,g=e.rotation,f=e.radius;let m=(g||0)*Ye;if(u&&"object"==typeof u&&(o=u.toString(),"[object HTMLImageElement]"===o||"[object HTMLCanvasElement]"===o))return t.save(),t.translate(i,s),t.rotate(m),t.drawImage(u,-u.width/2,-u.height/2,u.width,u.height),void t.restore();if(!(isNaN(f)||f<=0)){switch(t.beginPath(),u){default:n?t.ellipse(i,s,n/2,f,0,0,Ne):t.arc(i,s,f,0,Ne),t.closePath();break;case"triangle":h=n?n/2:f,t.moveTo(i+Math.sin(m)*h,s-Math.cos(m)*f),m+=Ge,t.lineTo(i+Math.sin(m)*h,s-Math.cos(m)*f),m+=Ge,t.lineTo(i+Math.sin(m)*h,s-Math.cos(m)*f),t.closePath();break;case"rectRounded":c=.516*f,l=f-c,a=Math.cos(m+Ke)*l,d=Math.cos(m+Ke)*(n?n/2-c:l),r=Math.sin(m+Ke)*l,p=Math.sin(m+Ke)*(n?n/2-c:l),t.arc(i-d,s-r,c,m-We,m-Xe),t.arc(i+p,s-a,c,m-Xe,m),t.arc(i+d,s+r,c,m,m+Xe),t.arc(i-p,s+a,c,m+Xe,m+We),t.closePath();break;case"rect":if(!g){l=Math.SQRT1_2*f,h=n?n/2:l,t.rect(i-h,s-l,2*h,2*l);break}m+=Ke;case"rectRot":d=Math.cos(m)*(n?n/2:f),a=Math.cos(m)*f,r=Math.sin(m)*f,p=Math.sin(m)*(n?n/2:f),t.moveTo(i-d,s-r),t.lineTo(i+p,s-a),t.lineTo(i+d,s+r),t.lineTo(i-p,s+a),t.closePath();break;case"crossRot":m+=Ke;case"cross":d=Math.cos(m)*(n?n/2:f),a=Math.cos(m)*f,r=Math.sin(m)*f,p=Math.sin(m)*(n?n/2:f),t.moveTo(i-d,s-r),t.lineTo(i+d,s+r),t.moveTo(i+p,s-a),t.lineTo(i-p,s+a);break;case"star":d=Math.cos(m)*(n?n/2:f),a=Math.cos(m)*f,r=Math.sin(m)*f,p=Math.sin(m)*(n?n/2:f),t.moveTo(i-d,s-r),t.lineTo(i+d,s+r),t.moveTo(i+p,s-a),t.lineTo(i-p,s+a),m+=Ke,d=Math.cos(m)*(n?n/2:f),a=Math.cos(m)*f,r=Math.sin(m)*f,p=Math.sin(m)*(n?n/2:f),t.moveTo(i-d,s-r),t.lineTo(i+d,s+r),t.moveTo(i+p,s-a),t.lineTo(i-p,s+a);break;case"line":a=n?n/2:Math.cos(m)*f,r=Math.sin(m)*f,t.moveTo(i-a,s-r),t.lineTo(i+a,s+r);break;case"dash":t.moveTo(i,s),t.lineTo(i+Math.cos(m)*(n?n/2:f),s+Math.sin(m)*f);break;case!1:t.closePath()}t.fill(),e.borderWidth>0&&t.stroke()}}function Vi(t,e,i){return i=i||.5,!e||t&&t.x>e.left-i&&t.x<e.right+i&&t.y>e.top-i&&t.y<e.bottom+i}function Wi(t,e){t.save(),t.beginPath(),t.rect(e.left,e.top,e.right-e.left,e.bottom-e.top),t.clip()}function Ni(t){t.restore()}function Ui(t,e,i,s,n){if(!e)return t.lineTo(i.x,i.y);if("middle"===n){const s=(e.x+i.x)/2;t.lineTo(s,e.y),t.lineTo(s,i.y)}else"after"===n!=!!s?t.lineTo(e.x,i.y):t.lineTo(i.x,e.y);t.lineTo(i.x,i.y)}function qi(t,e,i,s){if(!e)return t.lineTo(i.x,i.y);t.bezierCurveTo(s?e.cp1x:e.cp2x,s?e.cp1y:e.cp2y,s?i.cp2x:i.cp1x,s?i.cp2y:i.cp1y,i.x,i.y)}function Yi(t,e,i,s,n){if(n.strikethrough||n.underline){const o=t.measureText(s),a=e-o.actualBoundingBoxLeft,r=e+o.actualBoundingBoxRight,l=i-o.actualBoundingBoxAscent,c=i+o.actualBoundingBoxDescent,h=n.strikethrough?(l+c)/2:c;t.strokeStyle=t.fillStyle,t.beginPath(),t.lineWidth=n.decorationWidth||2,t.moveTo(a,h),t.lineTo(r,h),t.stroke()}}function Xi(t,e){const i=t.fillStyle;t.fillStyle=e.color,t.fillRect(e.left,e.top,e.width,e.height),t.fillStyle=i}function Ki(t,e,i,s,n,o={}){const a=ke(e)?e:[e],r=o.strokeWidth>0&&""!==o.strokeColor;let l,c;for(t.save(),t.font=n.string,function(t,e){e.translation&&t.translate(e.translation[0],e.translation[1]),we(e.rotation)||t.rotate(e.rotation),e.color&&(t.fillStyle=e.color),e.textAlign&&(t.textAlign=e.textAlign),e.textBaseline&&(t.textBaseline=e.textBaseline)}(t,o),l=0;l<a.length;++l)c=a[l],o.backdrop&&Xi(t,o.backdrop),r&&(o.strokeColor&&(t.strokeStyle=o.strokeColor),we(o.strokeWidth)||(t.lineWidth=o.strokeWidth),t.strokeText(c,i,s,o.maxWidth)),t.fillText(c,i,s,o.maxWidth),Yi(t,i,s,c,o),s+=Number(n.lineHeight);t.restore()}function Gi(t,e){const{x:i,y:s,w:n,h:o,radius:a}=e;t.arc(i+a.topLeft,s+a.topLeft,a.topLeft,1.5*We,We,!0),t.lineTo(i,s+o-a.bottomLeft),t.arc(i+a.bottomLeft,s+o-a.bottomLeft,a.bottomLeft,We,Xe,!0),t.lineTo(i+n-a.bottomRight,s+o),t.arc(i+n-a.bottomRight,s+o-a.bottomRight,a.bottomRight,Xe,0,!0),t.lineTo(i+n,s+a.topRight),t.arc(i+n-a.topRight,s+a.topRight,a.topRight,0,-Xe,!0),t.lineTo(i+a.topLeft,s)}const Ji=/^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/,Zi=/^(normal|italic|initial|inherit|unset|(oblique( -?[0-9]?[0-9]deg)?))$/;function Qi(t,e){const i=(""+t).match(Ji);if(!i||"normal"===i[1])return 1.2*e;switch(t=+i[2],i[3]){case"px":return t;case"%":t/=100}return e*t}const ts=t=>+t||0;function es(t,e){const i={},s=Se(e),n=s?Object.keys(e):e,o=Se(t)?s?i=>Ce(t[i],t[e[i]]):e=>t[e]:()=>t;for(const t of n)i[t]=ts(o(t));return i}function is(t){return es(t,["topLeft","topRight","bottomLeft","bottomRight"])}function ss(t){const e=function(t){return es(t,{top:"y",right:"x",bottom:"y",left:"x"})}(t);return e.width=e.left+e.right,e.height=e.top+e.bottom,e}function ns(t,e){t=t||{},e=e||zi.font;let i=Ce(t.size,e.size);"string"==typeof i&&(i=parseInt(i,10));let s=Ce(t.style,e.style);s&&!(""+s).match(Zi)&&(console.warn('Invalid font style specified: "'+s+'"'),s=void 0);const n={family:Ce(t.family,e.family),lineHeight:Qi(Ce(t.lineHeight,e.lineHeight),i),size:i,style:s,weight:Ce(t.weight,e.weight),string:""};return n.string=function(t){return!t||we(t.size)||we(t.family)?null:(t.style?t.style+" ":"")+(t.weight?t.weight+" ":"")+t.size+"px "+t.family}(n),n}function os(t,e,i,s){let n,o,a;for(n=0,o=t.length;n<o;++n)if(a=t[n],void 0!==a&&void 0!==a)return a}function as(t,e,i){const{min:s,max:n}=t,o=(r=(n-s)/2,"string"==typeof(a=e)&&a.endsWith("%")?parseFloat(a)/100*r:+a);var a,r;const l=(t,e)=>i&&0===t?0:t+e;return{min:l(s,-Math.abs(o)),max:l(n,o)}}function rs(t,e){return Object.assign(Object.create(t),e)}function ls(t,e=[""],i,s,n=()=>t[0]){const o=i||t;void 0===s&&(s=ys("_fallback",t));const a={[Symbol.toStringTag]:"Object",_cacheable:!0,_scopes:t,_rootScopes:o,_fallback:s,_getTarget:n,override:i=>ls([i,...t],e,o,s)};return new Proxy(a,{deleteProperty:(e,i)=>(delete e[i],delete e._keys,delete t[0][i],!0),get:(i,s)=>us(i,s,()=>function(t,e,i,s){let n;for(const o of e)if(n=ys(ds(o,t),i),void 0!==n)return ps(t,n)?bs(i,s,t,n):n}(s,e,t,i)),getOwnPropertyDescriptor:(t,e)=>Reflect.getOwnPropertyDescriptor(t._scopes[0],e),getPrototypeOf:()=>Reflect.getPrototypeOf(t[0]),has:(t,e)=>vs(t).includes(e),ownKeys:t=>vs(t),set(t,e,i){const s=t._storage||(t._storage=n());return t[e]=s[e]=i,delete t._keys,!0}})}function cs(t,e,i,s){const n={_cacheable:!1,_proxy:t,_context:e,_subProxy:i,_stack:new Set,_descriptors:hs(t,s),setContext:e=>cs(t,e,i,s),override:n=>cs(t.override(n),e,i,s)};return new Proxy(n,{deleteProperty:(e,i)=>(delete e[i],delete t[i],!0),get:(t,e,i)=>us(t,e,()=>function(t,e,i){const{_proxy:s,_context:n,_subProxy:o,_descriptors:a}=t;let r=s[e];Be(r)&&a.isScriptable(e)&&(r=function(t,e,i,s){const{_proxy:n,_context:o,_subProxy:a,_stack:r}=i;if(r.has(t))throw new Error("Recursion detected: "+Array.from(r).join("->")+"->"+t);r.add(t);let l=e(o,a||s);r.delete(t),ps(t,l)&&(l=bs(n._scopes,n,t,l));return l}(e,r,t,i));ke(r)&&r.length&&(r=function(t,e,i,s){const{_proxy:n,_context:o,_subProxy:a,_descriptors:r}=i;if(void 0!==o.index&&s(t))return e[o.index%e.length];if(Se(e[0])){const i=e,s=n._scopes.filter(t=>t!==i);e=[];for(const l of i){const i=bs(s,n,t,l);e.push(cs(i,o,a&&a[t],r))}}return e}(e,r,t,a.isIndexable));ps(e,r)&&(r=cs(r,n,o&&o[e],a));return r}(t,e,i)),getOwnPropertyDescriptor:(e,i)=>e._descriptors.allKeys?Reflect.has(t,i)?{enumerable:!0,configurable:!0}:void 0:Reflect.getOwnPropertyDescriptor(t,i),getPrototypeOf:()=>Reflect.getPrototypeOf(t),has:(e,i)=>Reflect.has(t,i),ownKeys:()=>Reflect.ownKeys(t),set:(e,i,s)=>(t[i]=s,delete e[i],!0)})}function hs(t,e={scriptable:!0,indexable:!0}){const{_scriptable:i=e.scriptable,_indexable:s=e.indexable,_allKeys:n=e.allKeys}=t;return{allKeys:n,scriptable:i,indexable:s,isScriptable:Be(i)?i:()=>i,isIndexable:Be(s)?s:()=>s}}const ds=(t,e)=>t?t+He(e):e,ps=(t,e)=>Se(e)&&"adapters"!==t&&(null===Object.getPrototypeOf(e)||e.constructor===Object);function us(t,e,i){if(Object.prototype.hasOwnProperty.call(t,e)||"constructor"===e)return t[e];const s=i();return t[e]=s,s}function gs(t,e,i){return Be(t)?t(e,i):t}const fs=(t,e)=>!0===t?e:"string"==typeof t?Ie(e,t):void 0;function ms(t,e,i,s,n){for(const o of e){const e=fs(i,o);if(e){t.add(e);const o=gs(e._fallback,i,n);if(void 0!==o&&o!==i&&o!==s)return o}else if(!1===e&&void 0!==s&&i!==s)return null}return!1}function bs(t,e,i,s){const n=e._rootScopes,o=gs(e._fallback,i,s),a=[...t,...n],r=new Set;r.add(s);let l=xs(r,a,i,o||i,s);return null!==l&&((void 0===o||o===i||(l=xs(r,a,o,l,s),null!==l))&&ls(Array.from(r),[""],n,o,()=>function(t,e,i){const s=t._getTarget();e in s||(s[e]={});const n=s[e];if(ke(n)&&Se(i))return i;return n||{}}(e,i,s)))}function xs(t,e,i,s,n){for(;i;)i=ms(t,e,i,s,n);return i}function ys(t,e){for(const i of e){if(!i)continue;const e=i[t];if(void 0!==e)return e}}function vs(t){let e=t._keys;return e||(e=t._keys=function(t){const e=new Set;for(const i of t)for(const t of Object.keys(i).filter(t=>!t.startsWith("_")))e.add(t);return Array.from(e)}(t._scopes)),e}const _s=Number.EPSILON||1e-14,ws=(t,e)=>e<t.length&&!t[e].skip&&t[e],ks=t=>"x"===t?"y":"x";function Ss(t,e,i,s){const n=t.skip?e:t,o=e,a=i.skip?e:i,r=ni(o,n),l=ni(a,o);let c=r/(r+l),h=l/(r+l);c=isNaN(c)?0:c,h=isNaN(h)?0:h;const d=s*c,p=s*h;return{previous:{x:o.x-d*(a.x-n.x),y:o.y-d*(a.y-n.y)},next:{x:o.x+p*(a.x-n.x),y:o.y+p*(a.y-n.y)}}}function $s(t,e="x"){const i=ks(e),s=t.length,n=Array(s).fill(0),o=Array(s);let a,r,l,c=ws(t,0);for(a=0;a<s;++a)if(r=l,l=c,c=ws(t,a+1),l){if(c){const t=c[e]-l[e];n[a]=0!==t?(c[i]-l[i])/t:0}o[a]=r?c?Ze(n[a-1])!==Ze(n[a])?0:(n[a-1]+n[a])/2:n[a-1]:n[a]}!function(t,e,i){const s=t.length;let n,o,a,r,l,c=ws(t,0);for(let h=0;h<s-1;++h)l=c,c=ws(t,h+1),l&&c&&(Qe(e[h],0,_s)?i[h]=i[h+1]=0:(n=i[h]/e[h],o=i[h+1]/e[h],r=Math.pow(n,2)+Math.pow(o,2),r<=9||(a=3/Math.sqrt(r),i[h]=n*a*e[h],i[h+1]=o*a*e[h])))}(t,n,o),function(t,e,i="x"){const s=ks(i),n=t.length;let o,a,r,l=ws(t,0);for(let c=0;c<n;++c){if(a=r,r=l,l=ws(t,c+1),!r)continue;const n=r[i],h=r[s];a&&(o=(n-a[i])/3,r[`cp1${i}`]=n-o,r[`cp1${s}`]=h-o*e[c]),l&&(o=(l[i]-n)/3,r[`cp2${i}`]=n+o,r[`cp2${s}`]=h+o*e[c])}}(t,o,e)}function Ms(t,e,i){return Math.max(Math.min(t,i),e)}function Cs(t,e,i,s,n){let o,a,r,l;if(e.spanGaps&&(t=t.filter(t=>!t.skip)),"monotone"===e.cubicInterpolationMode)$s(t,n);else{let i=s?t[t.length-1]:t[0];for(o=0,a=t.length;o<a;++o)r=t[o],l=Ss(i,r,t[Math.min(o+1,a-(s?0:1))%a],e.tension),r.cp1x=l.previous.x,r.cp1y=l.previous.y,r.cp2x=l.next.x,r.cp2y=l.next.y,i=r}e.capBezierPoints&&function(t,e){let i,s,n,o,a,r=Vi(t[0],e);for(i=0,s=t.length;i<s;++i)a=o,o=r,r=i<s-1&&Vi(t[i+1],e),o&&(n=t[i],a&&(n.cp1x=Ms(n.cp1x,e.left,e.right),n.cp1y=Ms(n.cp1y,e.top,e.bottom)),r&&(n.cp2x=Ms(n.cp2x,e.left,e.right),n.cp2y=Ms(n.cp2y,e.top,e.bottom)))}(t,i)}function As(){return"undefined"!=typeof window&&"undefined"!=typeof document}function Ts(t){let e=t.parentNode;return e&&"[object ShadowRoot]"===e.toString()&&(e=e.host),e}function Ds(t,e,i){let s;return"string"==typeof t?(s=parseInt(t,10),-1!==t.indexOf("%")&&(s=s/100*e.parentNode[i])):s=t,s}const Es=t=>t.ownerDocument.defaultView.getComputedStyle(t,null);const Ps=["top","right","bottom","left"];function Ls(t,e,i){const s={};i=i?"-"+i:"";for(let n=0;n<4;n++){const o=Ps[n];s[o]=parseFloat(t[e+"-"+o+i])||0}return s.width=s.left+s.right,s.height=s.top+s.bottom,s}function Os(t,e){if("native"in t)return t;const{canvas:i,currentDevicePixelRatio:s}=e,n=Es(i),o="border-box"===n.boxSizing,a=Ls(n,"padding"),r=Ls(n,"border","width"),{x:l,y:c,box:h}=function(t,e){const i=t.touches,s=i&&i.length?i[0]:t,{offsetX:n,offsetY:o}=s;let a,r,l=!1;if(((t,e,i)=>(t>0||e>0)&&(!i||!i.shadowRoot))(n,o,t.target))a=n,r=o;else{const t=e.getBoundingClientRect();a=s.clientX-t.left,r=s.clientY-t.top,l=!0}return{x:a,y:r,box:l}}(t,i),d=a.left+(h&&r.left),p=a.top+(h&&r.top);let{width:u,height:g}=e;return o&&(u-=a.width+r.width,g-=a.height+r.height),{x:Math.round((l-d)/u*i.width/s),y:Math.round((c-p)/g*i.height/s)}}const Rs=t=>Math.round(10*t)/10;function zs(t,e,i,s){const n=Es(t),o=Ls(n,"margin"),a=Ds(n.maxWidth,t,"clientWidth")||qe,r=Ds(n.maxHeight,t,"clientHeight")||qe,l=function(t,e,i){let s,n;if(void 0===e||void 0===i){const o=t&&Ts(t);if(o){const t=o.getBoundingClientRect(),a=Es(o),r=Ls(a,"border","width"),l=Ls(a,"padding");e=t.width-l.width-r.width,i=t.height-l.height-r.height,s=Ds(a.maxWidth,o,"clientWidth"),n=Ds(a.maxHeight,o,"clientHeight")}else e=t.clientWidth,i=t.clientHeight}return{width:e,height:i,maxWidth:s||qe,maxHeight:n||qe}}(t,e,i);let{width:c,height:h}=l;if("content-box"===n.boxSizing){const t=Ls(n,"border","width"),e=Ls(n,"padding");c-=e.width+t.width,h-=e.height+t.height}c=Math.max(0,c-o.width),h=Math.max(0,s?c/s:h-o.height),c=Rs(Math.min(c,a,l.maxWidth)),h=Rs(Math.min(h,r,l.maxHeight)),c&&!h&&(h=Rs(c/2));return(void 0!==e||void 0!==i)&&s&&l.height&&h>l.height&&(h=l.height,c=Rs(Math.floor(h*s))),{width:c,height:h}}function js(t,e,i){const s=e||1,n=Rs(t.height*s),o=Rs(t.width*s);t.height=Rs(t.height),t.width=Rs(t.width);const a=t.canvas;return a.style&&(i||!a.style.height&&!a.style.width)&&(a.style.height=`${t.height}px`,a.style.width=`${t.width}px`),(t.currentDevicePixelRatio!==s||a.height!==n||a.width!==o)&&(t.currentDevicePixelRatio=s,a.height=n,a.width=o,t.ctx.setTransform(s,0,0,s,0,0),!0)}const Is=function(){let t=!1;try{const e={get passive(){return t=!0,!1}};As()&&(window.addEventListener("test",null,e),window.removeEventListener("test",null,e))}catch(t){}return t}();function Hs(t,e){const i=function(t,e){return Es(t).getPropertyValue(e)}(t,e),s=i&&i.match(/^(\d+)(\.\d+)?px$/);return s?+s[1]:void 0}function Fs(t,e,i,s){return{x:t.x+i*(e.x-t.x),y:t.y+i*(e.y-t.y)}}function Bs(t,e,i,s){return{x:t.x+i*(e.x-t.x),y:"middle"===s?i<.5?t.y:e.y:"after"===s?i<1?t.y:e.y:i>0?e.y:t.y}}function Vs(t,e,i,s){const n={x:t.cp2x,y:t.cp2y},o={x:e.cp1x,y:e.cp1y},a=Fs(t,n,i),r=Fs(n,o,i),l=Fs(o,e,i),c=Fs(a,r,i),h=Fs(r,l,i);return Fs(c,h,i)}function Ws(t,e,i){return t?function(t,e){return{x:i=>t+t+e-i,setWidth(t){e=t},textAlign:t=>"center"===t?t:"right"===t?"left":"right",xPlus:(t,e)=>t-e,leftForLtr:(t,e)=>t-e}}(e,i):{x:t=>t,setWidth(t){},textAlign:t=>t,xPlus:(t,e)=>t+e,leftForLtr:(t,e)=>t}}function Ns(t,e){let i,s;"ltr"!==e&&"rtl"!==e||(i=t.canvas.style,s=[i.getPropertyValue("direction"),i.getPropertyPriority("direction")],i.setProperty("direction",e,"important"),t.prevTextDirection=s)}function Us(t,e){void 0!==e&&(delete t.prevTextDirection,t.canvas.style.setProperty("direction",e[0],e[1]))}function qs(t){return"angle"===t?{between:ri,compare:oi,normalize:ai}:{between:ci,compare:(t,e)=>t-e,normalize:t=>t}}function Ys({start:t,end:e,count:i,loop:s,style:n}){return{start:t%i,end:e%i,loop:s&&(e-t+1)%i==0,style:n}}function Xs(t,e,i){if(!i)return[t];const{property:s,start:n,end:o}=i,a=e.length,{compare:r,between:l,normalize:c}=qs(s),{start:h,end:d,loop:p,style:u}=function(t,e,i){const{property:s,start:n,end:o}=i,{between:a,normalize:r}=qs(s),l=e.length;let c,h,{start:d,end:p,loop:u}=t;if(u){for(d+=l,p+=l,c=0,h=l;c<h&&a(r(e[d%l][s]),n,o);++c)d--,p--;d%=l,p%=l}return p<d&&(p+=l),{start:d,end:p,loop:u,style:t.style}}(t,e,i),g=[];let f,m,b,x=!1,y=null;const v=()=>x||l(n,b,f)&&0!==r(n,b),_=()=>!x||0===r(o,f)||l(o,b,f);for(let t=h,i=h;t<=d;++t)m=e[t%a],m.skip||(f=c(m[s]),f!==b&&(x=l(f,n,o),null===y&&v()&&(y=0===r(f,n)?t:i),null!==y&&_()&&(g.push(Ys({start:y,end:t,loop:p,count:a,style:u})),y=null),i=t,b=f));return null!==y&&g.push(Ys({start:y,end:d,loop:p,count:a,style:u})),g}function Ks(t,e){const i=[],s=t.segments;for(let n=0;n<s.length;n++){const o=Xs(s[n],t.points,e);o.length&&i.push(...o)}return i}function Gs(t,e,i,s){return s&&s.setContext&&i?function(t,e,i,s){const n=t._chart.getContext(),o=Js(t.options),{_datasetIndex:a,options:{spanGaps:r}}=t,l=i.length,c=[];let h=o,d=e[0].start,p=d;function u(t,e,s,n){const o=r?-1:1;if(t!==e){for(t+=l;i[t%l].skip;)t-=o;for(;i[e%l].skip;)e+=o;t%l!==e%l&&(c.push({start:t%l,end:e%l,loop:s,style:n}),h=n,d=e%l)}}for(const t of e){d=r?d:t.start;let e,o=i[d%l];for(p=d+1;p<=t.end;p++){const r=i[p%l];e=Js(s.setContext(rs(n,{type:"segment",p0:o,p1:r,p0DataIndex:(p-1)%l,p1DataIndex:p%l,datasetIndex:a}))),Zs(e,h)&&u(d,p-1,t.loop,h),o=r,h=e}d<p-1&&u(d,p-1,t.loop,h)}return c}(t,e,i,s):e}function Js(t){return{backgroundColor:t.backgroundColor,borderCapStyle:t.borderCapStyle,borderDash:t.borderDash,borderDashOffset:t.borderDashOffset,borderJoinStyle:t.borderJoinStyle,borderWidth:t.borderWidth,borderColor:t.borderColor}}function Zs(t,e){if(!e)return!1;const i=[],s=function(t,e){return ki(e)?(i.includes(e)||i.push(e),i.indexOf(e)):e};return JSON.stringify(t,s)!==JSON.stringify(e,s)}function Qs(t,e,i){return t.options.clip?t[i]:e[i]}function tn(t,e){const i=e._clip;if(i.disabled)return!1;const s=function(t,e){const{xScale:i,yScale:s}=t;return i&&s?{left:Qs(i,e,"left"),right:Qs(i,e,"right"),top:Qs(s,e,"top"),bottom:Qs(s,e,"bottom")}:e}(e,t.chartArea);return{left:!1===i.left?0:s.left-(!0===i.left?0:i.left),right:!1===i.right?t.width:s.right+(!0===i.right?0:i.right),top:!1===i.top?0:s.top-(!0===i.top?0:i.top),bottom:!1===i.bottom?t.height:s.bottom+(!0===i.bottom?0:i.bottom)}}
/*!
 * Chart.js v4.5.1
 * https://www.chartjs.org
 * (c) 2025 Chart.js Contributors
 * Released under the MIT License
 */class en{constructor(){this._request=null,this._charts=new Map,this._running=!1,this._lastDate=void 0}_notify(t,e,i,s){const n=e.listeners[s],o=e.duration;n.forEach(s=>s({chart:t,initial:e.initial,numSteps:o,currentStep:Math.min(i-e.start,o)}))}_refresh(){this._request||(this._running=!0,this._request=fi.call(window,()=>{this._update(),this._request=null,this._running&&this._refresh()}))}_update(t=Date.now()){let e=0;this._charts.forEach((i,s)=>{if(!i.running||!i.items.length)return;const n=i.items;let o,a=n.length-1,r=!1;for(;a>=0;--a)o=n[a],o._active?(o._total>i.duration&&(i.duration=o._total),o.tick(t),r=!0):(n[a]=n[n.length-1],n.pop());r&&(s.draw(),this._notify(s,i,t,"progress")),n.length||(i.running=!1,this._notify(s,i,t,"complete"),i.initial=!1),e+=n.length}),this._lastDate=t,0===e&&(this._running=!1)}_getAnims(t){const e=this._charts;let i=e.get(t);return i||(i={running:!1,initial:!0,items:[],listeners:{complete:[],progress:[]}},e.set(t,i)),i}listen(t,e,i){this._getAnims(t).listeners[e].push(i)}add(t,e){e&&e.length&&this._getAnims(t).items.push(...e)}has(t){return this._getAnims(t).items.length>0}start(t){const e=this._charts.get(t);e&&(e.running=!0,e.start=Date.now(),e.duration=e.items.reduce((t,e)=>Math.max(t,e._duration),0),this._refresh())}running(t){if(!this._running)return!1;const e=this._charts.get(t);return!!(e&&e.running&&e.items.length)}stop(t){const e=this._charts.get(t);if(!e||!e.items.length)return;const i=e.items;let s=i.length-1;for(;s>=0;--s)i[s].cancel();e.items=[],this._notify(t,e,Date.now(),"complete")}remove(t){return this._charts.delete(t)}}var sn=new en;const nn="transparent",on={boolean:(t,e,i)=>i>.5?e:t,color(t,e,i){const s=Si(t||nn),n=s.valid&&Si(e||nn);return n&&n.valid?n.mix(s,i).hexString():e},number:(t,e,i)=>t+(e-t)*i};class an{constructor(t,e,i,s){const n=e[i];s=os([t.to,s,n,t.from]);const o=os([t.from,n,s]);this._active=!0,this._fn=t.fn||on[t.type||typeof o],this._easing=wi[t.easing]||wi.linear,this._start=Math.floor(Date.now()+(t.delay||0)),this._duration=this._total=Math.floor(t.duration),this._loop=!!t.loop,this._target=e,this._prop=i,this._from=o,this._to=s,this._promises=void 0}active(){return this._active}update(t,e,i){if(this._active){this._notify(!1);const s=this._target[this._prop],n=i-this._start,o=this._duration-n;this._start=i,this._duration=Math.floor(Math.max(o,t.duration)),this._total+=n,this._loop=!!t.loop,this._to=os([t.to,e,s,t.from]),this._from=os([t.from,s,e])}}cancel(){this._active&&(this.tick(Date.now()),this._active=!1,this._notify(!1))}tick(t){const e=t-this._start,i=this._duration,s=this._prop,n=this._from,o=this._loop,a=this._to;let r;if(this._active=n!==a&&(o||e<i),!this._active)return this._target[s]=a,void this._notify(!0);e<0?this._target[s]=n:(r=e/i%2,r=o&&r>1?2-r:r,r=this._easing(Math.min(1,Math.max(0,r))),this._target[s]=this._fn(n,a,r))}wait(){const t=this._promises||(this._promises=[]);return new Promise((e,i)=>{t.push({res:e,rej:i})})}_notify(t){const e=t?"res":"rej",i=this._promises||[];for(let t=0;t<i.length;t++)i[t][e]()}}class rn{constructor(t,e){this._chart=t,this._properties=new Map,this.configure(e)}configure(t){if(!Se(t))return;const e=Object.keys(zi.animation),i=this._properties;Object.getOwnPropertyNames(t).forEach(s=>{const n=t[s];if(!Se(n))return;const o={};for(const t of e)o[t]=n[t];(ke(n.properties)&&n.properties||[s]).forEach(t=>{t!==s&&i.has(t)||i.set(t,o)})})}_animateOptions(t,e){const i=e.options,s=function(t,e){if(!e)return;let i=t.options;if(!i)return void(t.options=e);i.$shared&&(t.options=i=Object.assign({},i,{$shared:!1,$animations:{}}));return i}(t,i);if(!s)return[];const n=this._createAnimations(s,i);return i.$shared&&function(t,e){const i=[],s=Object.keys(e);for(let e=0;e<s.length;e++){const n=t[s[e]];n&&n.active()&&i.push(n.wait())}return Promise.all(i)}(t.options.$animations,i).then(()=>{t.options=i},()=>{}),n}_createAnimations(t,e){const i=this._properties,s=[],n=t.$animations||(t.$animations={}),o=Object.keys(e),a=Date.now();let r;for(r=o.length-1;r>=0;--r){const l=o[r];if("$"===l.charAt(0))continue;if("options"===l){s.push(...this._animateOptions(t,e));continue}const c=e[l];let h=n[l];const d=i.get(l);if(h){if(d&&h.active()){h.update(d,c,a);continue}h.cancel()}d&&d.duration?(n[l]=h=new an(d,t,l,c),s.push(h)):t[l]=c}return s}update(t,e){if(0===this._properties.size)return void Object.assign(t,e);const i=this._createAnimations(t,e);return i.length?(sn.add(this._chart,i),!0):void 0}}function ln(t,e){const i=t&&t.options||{},s=i.reverse,n=void 0===i.min?e:0,o=void 0===i.max?e:0;return{start:s?o:n,end:s?n:o}}function cn(t,e){const i=[],s=t._getSortedDatasetMetas(e);let n,o;for(n=0,o=s.length;n<o;++n)i.push(s[n].index);return i}function hn(t,e,i,s={}){const n=t.keys,o="single"===s.mode;let a,r,l,c;if(null===e)return;let h=!1;for(a=0,r=n.length;a<r;++a){if(l=+n[a],l===i){if(h=!0,s.all)continue;break}c=t.values[l],$e(c)&&(o||0===e||Ze(e)===Ze(c))&&(e+=c)}return h||s.all?e:0}function dn(t,e){const i=t&&t.options.stacked;return i||void 0===i&&void 0!==e.stack}function pn(t,e,i){const s=t[e]||(t[e]={});return s[i]||(s[i]={})}function un(t,e,i,s){for(const n of e.getMatchingVisibleMetas(s).reverse()){const e=t[n.index];if(i&&e>0||!i&&e<0)return n.index}return null}function gn(t,e){const{chart:i,_cachedMeta:s}=t,n=i._stacks||(i._stacks={}),{iScale:o,vScale:a,index:r}=s,l=o.axis,c=a.axis,h=function(t,e,i){return`${t.id}.${e.id}.${i.stack||i.type}`}(o,a,s),d=e.length;let p;for(let t=0;t<d;++t){const i=e[t],{[l]:o,[c]:d}=i;p=(i._stacks||(i._stacks={}))[c]=pn(n,h,o),p[r]=d,p._top=un(p,a,!0,s.type),p._bottom=un(p,a,!1,s.type);(p._visualValues||(p._visualValues={}))[r]=d}}function fn(t,e){const i=t.scales;return Object.keys(i).filter(t=>i[t].axis===e).shift()}function mn(t,e){const i=t.controller.index,s=t.vScale&&t.vScale.axis;if(s){e=e||t._parsed;for(const t of e){const e=t._stacks;if(!e||void 0===e[s]||void 0===e[s][i])return;delete e[s][i],void 0!==e[s]._visualValues&&void 0!==e[s]._visualValues[i]&&delete e[s]._visualValues[i]}}}const bn=t=>"reset"===t||"none"===t,xn=(t,e)=>e?t:Object.assign({},t);class yn{static defaults={};static datasetElementType=null;static dataElementType=null;constructor(t,e){this.chart=t,this._ctx=t.ctx,this.index=e,this._cachedDataOpts={},this._cachedMeta=this.getMeta(),this._type=this._cachedMeta.type,this.options=void 0,this._parsing=!1,this._data=void 0,this._objectData=void 0,this._sharedOptions=void 0,this._drawStart=void 0,this._drawCount=void 0,this.enableOptionSharing=!1,this.supportsDecimation=!1,this.$context=void 0,this._syncList=[],this.datasetElementType=new.target.datasetElementType,this.dataElementType=new.target.dataElementType,this.initialize()}initialize(){const t=this._cachedMeta;this.configure(),this.linkScales(),t._stacked=dn(t.vScale,t),this.addElements(),this.options.fill&&!this.chart.isPluginEnabled("filler")&&console.warn("Tried to use the 'fill' option without the 'Filler' plugin enabled. Please import and register the 'Filler' plugin and make sure it is not disabled in the options")}updateIndex(t){this.index!==t&&mn(this._cachedMeta),this.index=t}linkScales(){const t=this.chart,e=this._cachedMeta,i=this.getDataset(),s=(t,e,i,s)=>"x"===t?e:"r"===t?s:i,n=e.xAxisID=Ce(i.xAxisID,fn(t,"x")),o=e.yAxisID=Ce(i.yAxisID,fn(t,"y")),a=e.rAxisID=Ce(i.rAxisID,fn(t,"r")),r=e.indexAxis,l=e.iAxisID=s(r,n,o,a),c=e.vAxisID=s(r,o,n,a);e.xScale=this.getScaleForId(n),e.yScale=this.getScaleForId(o),e.rScale=this.getScaleForId(a),e.iScale=this.getScaleForId(l),e.vScale=this.getScaleForId(c)}getDataset(){return this.chart.data.datasets[this.index]}getMeta(){return this.chart.getDatasetMeta(this.index)}getScaleForId(t){return this.chart.scales[t]}_getOtherScale(t){const e=this._cachedMeta;return t===e.iScale?e.vScale:e.iScale}reset(){this._update("reset")}_destroy(){const t=this._cachedMeta;this._data&&gi(this._data,this),t._stacked&&mn(t)}_dataCheck(){const t=this.getDataset(),e=t.data||(t.data=[]),i=this._data;if(Se(e)){const t=this._cachedMeta;this._data=function(t,e){const{iScale:i,vScale:s}=e,n="x"===i.axis?"x":"y",o="x"===s.axis?"x":"y",a=Object.keys(t),r=new Array(a.length);let l,c,h;for(l=0,c=a.length;l<c;++l)h=a[l],r[l]={[n]:h,[o]:t[h]};return r}(e,t)}else if(i!==e){if(i){gi(i,this);const t=this._cachedMeta;mn(t),t._parsed=[]}e&&Object.isExtensible(e)&&(n=this,(s=e)._chartjs?s._chartjs.listeners.push(n):(Object.defineProperty(s,"_chartjs",{configurable:!0,enumerable:!1,value:{listeners:[n]}}),ui.forEach(t=>{const e="_onData"+He(t),i=s[t];Object.defineProperty(s,t,{configurable:!0,enumerable:!1,value(...t){const n=i.apply(this,t);return s._chartjs.listeners.forEach(i=>{"function"==typeof i[e]&&i[e](...t)}),n}})}))),this._syncList=[],this._data=e}var s,n}addElements(){const t=this._cachedMeta;this._dataCheck(),this.datasetElementType&&(t.dataset=new this.datasetElementType)}buildOrUpdateElements(t){const e=this._cachedMeta,i=this.getDataset();let s=!1;this._dataCheck();const n=e._stacked;e._stacked=dn(e.vScale,e),e.stack!==i.stack&&(s=!0,mn(e),e.stack=i.stack),this._resyncElements(t),(s||n!==e._stacked)&&(gn(this,e._parsed),e._stacked=dn(e.vScale,e))}configure(){const t=this.chart.config,e=t.datasetScopeKeys(this._type),i=t.getOptionScopes(this.getDataset(),e,!0);this.options=t.createResolver(i,this.getContext()),this._parsing=this.options.parsing,this._cachedDataOpts={}}parse(t,e){const{_cachedMeta:i,_data:s}=this,{iScale:n,_stacked:o}=i,a=n.axis;let r,l,c,h=0===t&&e===s.length||i._sorted,d=t>0&&i._parsed[t-1];if(!1===this._parsing)i._parsed=s,i._sorted=!0,c=s;else{c=ke(s[t])?this.parseArrayData(i,s,t,e):Se(s[t])?this.parseObjectData(i,s,t,e):this.parsePrimitiveData(i,s,t,e);const n=()=>null===l[a]||d&&l[a]<d[a];for(r=0;r<e;++r)i._parsed[r+t]=l=c[r],h&&(n()&&(h=!1),d=l);i._sorted=h}o&&gn(this,c)}parsePrimitiveData(t,e,i,s){const{iScale:n,vScale:o}=t,a=n.axis,r=o.axis,l=n.getLabels(),c=n===o,h=new Array(s);let d,p,u;for(d=0,p=s;d<p;++d)u=d+i,h[d]={[a]:c||n.parse(l[u],u),[r]:o.parse(e[u],u)};return h}parseArrayData(t,e,i,s){const{xScale:n,yScale:o}=t,a=new Array(s);let r,l,c,h;for(r=0,l=s;r<l;++r)c=r+i,h=e[c],a[r]={x:n.parse(h[0],c),y:o.parse(h[1],c)};return a}parseObjectData(t,e,i,s){const{xScale:n,yScale:o}=t,{xAxisKey:a="x",yAxisKey:r="y"}=this._parsing,l=new Array(s);let c,h,d,p;for(c=0,h=s;c<h;++c)d=c+i,p=e[d],l[c]={x:n.parse(Ie(p,a),d),y:o.parse(Ie(p,r),d)};return l}getParsed(t){return this._cachedMeta._parsed[t]}getDataElement(t){return this._cachedMeta.data[t]}applyStack(t,e,i){const s=this.chart,n=this._cachedMeta,o=e[t.axis];return hn({keys:cn(s,!0),values:e._stacks[t.axis]._visualValues},o,n.index,{mode:i})}updateRangeFromParsed(t,e,i,s){const n=i[e.axis];let o=null===n?NaN:n;const a=s&&i._stacks[e.axis];s&&a&&(s.values=a,o=hn(s,n,this._cachedMeta.index)),t.min=Math.min(t.min,o),t.max=Math.max(t.max,o)}getMinMax(t,e){const i=this._cachedMeta,s=i._parsed,n=i._sorted&&t===i.iScale,o=s.length,a=this._getOtherScale(t),r=((t,e,i)=>t&&!e.hidden&&e._stacked&&{keys:cn(i,!0),values:null})(e,i,this.chart),l={min:Number.POSITIVE_INFINITY,max:Number.NEGATIVE_INFINITY},{min:c,max:h}=function(t){const{min:e,max:i,minDefined:s,maxDefined:n}=t.getUserBounds();return{min:s?e:Number.NEGATIVE_INFINITY,max:n?i:Number.POSITIVE_INFINITY}}(a);let d,p;function u(){p=s[d];const e=p[a.axis];return!$e(p[t.axis])||c>e||h<e}for(d=0;d<o&&(u()||(this.updateRangeFromParsed(l,t,p,r),!n));++d);if(n)for(d=o-1;d>=0;--d)if(!u()){this.updateRangeFromParsed(l,t,p,r);break}return l}getAllParsedValues(t){const e=this._cachedMeta._parsed,i=[];let s,n,o;for(s=0,n=e.length;s<n;++s)o=e[s][t.axis],$e(o)&&i.push(o);return i}getMaxOverflow(){return!1}getLabelAndValue(t){const e=this._cachedMeta,i=e.iScale,s=e.vScale,n=this.getParsed(t);return{label:i?""+i.getLabelForValue(n[i.axis]):"",value:s?""+s.getLabelForValue(n[s.axis]):""}}_update(t){const e=this._cachedMeta;this.update(t||"default"),e._clip=function(t){let e,i,s,n;return Se(t)?(e=t.top,i=t.right,s=t.bottom,n=t.left):e=i=s=n=t,{top:e,right:i,bottom:s,left:n,disabled:!1===t}}(Ce(this.options.clip,function(t,e,i){if(!1===i)return!1;const s=ln(t,i),n=ln(e,i);return{top:n.end,right:s.end,bottom:n.start,left:s.start}}(e.xScale,e.yScale,this.getMaxOverflow())))}update(t){}draw(){const t=this._ctx,e=this.chart,i=this._cachedMeta,s=i.data||[],n=e.chartArea,o=[],a=this._drawStart||0,r=this._drawCount||s.length-a,l=this.options.drawActiveElementsOnTop;let c;for(i.dataset&&i.dataset.draw(t,n,a,r),c=a;c<a+r;++c){const e=s[c];e.hidden||(e.active&&l?o.push(e):e.draw(t,n))}for(c=0;c<o.length;++c)o[c].draw(t,n)}getStyle(t,e){const i=e?"active":"default";return void 0===t&&this._cachedMeta.dataset?this.resolveDatasetElementOptions(i):this.resolveDataElementOptions(t||0,i)}getContext(t,e,i){const s=this.getDataset();let n;if(t>=0&&t<this._cachedMeta.data.length){const e=this._cachedMeta.data[t];n=e.$context||(e.$context=function(t,e,i){return rs(t,{active:!1,dataIndex:e,parsed:void 0,raw:void 0,element:i,index:e,mode:"default",type:"data"})}(this.getContext(),t,e)),n.parsed=this.getParsed(t),n.raw=s.data[t],n.index=n.dataIndex=t}else n=this.$context||(this.$context=function(t,e){return rs(t,{active:!1,dataset:void 0,datasetIndex:e,index:e,mode:"default",type:"dataset"})}(this.chart.getContext(),this.index)),n.dataset=s,n.index=n.datasetIndex=this.index;return n.active=!!e,n.mode=i,n}resolveDatasetElementOptions(t){return this._resolveElementOptions(this.datasetElementType.id,t)}resolveDataElementOptions(t,e){return this._resolveElementOptions(this.dataElementType.id,e,t)}_resolveElementOptions(t,e="default",i){const s="active"===e,n=this._cachedDataOpts,o=t+"-"+e,a=n[o],r=this.enableOptionSharing&&Fe(i);if(a)return xn(a,r);const l=this.chart.config,c=l.datasetElementScopeKeys(this._type,t),h=s?[`${t}Hover`,"hover",t,""]:[t,""],d=l.getOptionScopes(this.getDataset(),c),p=Object.keys(zi.elements[t]),u=l.resolveNamedOptions(d,p,()=>this.getContext(i,s,e),h);return u.$shared&&(u.$shared=r,n[o]=Object.freeze(xn(u,r))),u}_resolveAnimations(t,e,i){const s=this.chart,n=this._cachedDataOpts,o=`animation-${e}`,a=n[o];if(a)return a;let r;if(!1!==s.options.animation){const s=this.chart.config,n=s.datasetAnimationScopeKeys(this._type,e),o=s.getOptionScopes(this.getDataset(),n);r=s.createResolver(o,this.getContext(t,i,e))}const l=new rn(s,r&&r.animations);return r&&r._cacheable&&(n[o]=Object.freeze(l)),l}getSharedOptions(t){if(t.$shared)return this._sharedOptions||(this._sharedOptions=Object.assign({},t))}includeOptions(t,e){return!e||bn(t)||this.chart._animationsDisabled}_getSharedOptions(t,e){const i=this.resolveDataElementOptions(t,e),s=this._sharedOptions,n=this.getSharedOptions(i),o=this.includeOptions(e,n)||n!==s;return this.updateSharedOptions(n,e,i),{sharedOptions:n,includeOptions:o}}updateElement(t,e,i,s){bn(s)?Object.assign(t,i):this._resolveAnimations(e,s).update(t,i)}updateSharedOptions(t,e,i){t&&!bn(e)&&this._resolveAnimations(void 0,e).update(t,i)}_setStyle(t,e,i,s){t.active=s;const n=this.getStyle(e,s);this._resolveAnimations(e,i,s).update(t,{options:!s&&this.getSharedOptions(n)||n})}removeHoverStyle(t,e,i){this._setStyle(t,i,"active",!1)}setHoverStyle(t,e,i){this._setStyle(t,i,"active",!0)}_removeDatasetHoverStyle(){const t=this._cachedMeta.dataset;t&&this._setStyle(t,void 0,"active",!1)}_setDatasetHoverStyle(){const t=this._cachedMeta.dataset;t&&this._setStyle(t,void 0,"active",!0)}_resyncElements(t){const e=this._data,i=this._cachedMeta.data;for(const[t,e,i]of this._syncList)this[t](e,i);this._syncList=[];const s=i.length,n=e.length,o=Math.min(n,s);o&&this.parse(0,o),n>s?this._insertElements(s,n-s,t):n<s&&this._removeElements(n,s-n)}_insertElements(t,e,i=!0){const s=this._cachedMeta,n=s.data,o=t+e;let a;const r=t=>{for(t.length+=e,a=t.length-1;a>=o;a--)t[a]=t[a-e]};for(r(n),a=t;a<o;++a)n[a]=new this.dataElementType;this._parsing&&r(s._parsed),this.parse(t,e),i&&this.updateElements(n,t,e,"reset")}updateElements(t,e,i,s){}_removeElements(t,e){const i=this._cachedMeta;if(this._parsing){const s=i._parsed.splice(t,e);i._stacked&&mn(i,s)}i.data.splice(t,e)}_sync(t){if(this._parsing)this._syncList.push(t);else{const[e,i,s]=t;this[e](i,s)}this.chart._dataChanges.push([this.index,...t])}_onDataPush(){const t=arguments.length;this._sync(["_insertElements",this.getDataset().data.length-t,t])}_onDataPop(){this._sync(["_removeElements",this._cachedMeta.data.length-1,1])}_onDataShift(){this._sync(["_removeElements",0,1])}_onDataSplice(t,e){e&&this._sync(["_removeElements",t,e]);const i=arguments.length-2;i&&this._sync(["_insertElements",t,i])}_onDataUnshift(){this._sync(["_insertElements",0,arguments.length])}}function vn(t,e,i,s){const{controller:n,data:o,_sorted:a}=t,r=n._cachedMeta.iScale,l=t.dataset&&t.dataset.options?t.dataset.options.spanGaps:null;if(r&&e===r.axis&&"r"!==e&&a&&o.length){const a=r._reversePixels?pi:di;if(!s){const s=a(o,e,i);if(l){const{vScale:e}=n._cachedMeta,{_parsed:i}=t,o=i.slice(0,s.lo+1).reverse().findIndex(t=>!we(t[e.axis]));s.lo-=Math.max(0,o);const a=i.slice(s.hi).findIndex(t=>!we(t[e.axis]));s.hi+=Math.max(0,a)}return s}if(n._sharedOptions){const t=o[0],s="function"==typeof t.getRange&&t.getRange(e);if(s){const t=a(o,e,i-s),n=a(o,e,i+s);return{lo:t.lo,hi:n.hi}}}}return{lo:0,hi:o.length-1}}function _n(t,e,i,s,n){const o=t.getSortedVisibleDatasetMetas(),a=i[e];for(let t=0,i=o.length;t<i;++t){const{index:i,data:r}=o[t],{lo:l,hi:c}=vn(o[t],e,a,n);for(let t=l;t<=c;++t){const e=r[t];e.skip||s(e,i,t)}}}function wn(t,e,i,s,n){const o=[];if(!n&&!t.isPointInArea(e))return o;return _n(t,i,e,function(i,a,r){(n||Vi(i,t.chartArea,0))&&i.inRange(e.x,e.y,s)&&o.push({element:i,datasetIndex:a,index:r})},!0),o}function kn(t,e,i,s){let n=[];return _n(t,i,e,function(t,i,o){const{startAngle:a,endAngle:r}=t.getProps(["startAngle","endAngle"],s),{angle:l}=function(t,e){const i=e.x-t.x,s=e.y-t.y,n=Math.sqrt(i*i+s*s);let o=Math.atan2(s,i);return o<-.5*We&&(o+=Ne),{angle:o,distance:n}}(t,{x:e.x,y:e.y});ri(l,a,r)&&n.push({element:t,datasetIndex:i,index:o})}),n}function Sn(t,e,i,s,n,o){let a=[];const r=function(t){const e=-1!==t.indexOf("x"),i=-1!==t.indexOf("y");return function(t,s){const n=e?Math.abs(t.x-s.x):0,o=i?Math.abs(t.y-s.y):0;return Math.sqrt(Math.pow(n,2)+Math.pow(o,2))}}(i);let l=Number.POSITIVE_INFINITY;return _n(t,i,e,function(i,c,h){const d=i.inRange(e.x,e.y,n);if(s&&!d)return;const p=i.getCenterPoint(n);if(!(!!o||t.isPointInArea(p))&&!d)return;const u=r(e,p);u<l?(a=[{element:i,datasetIndex:c,index:h}],l=u):u===l&&a.push({element:i,datasetIndex:c,index:h})}),a}function $n(t,e,i,s,n,o){return o||t.isPointInArea(e)?"r"!==i||s?Sn(t,e,i,s,n,o):kn(t,e,i,n):[]}function Mn(t,e,i,s,n){const o=[],a="x"===i?"inXRange":"inYRange";let r=!1;return _n(t,i,e,(t,s,l)=>{t[a]&&t[a](e[i],n)&&(o.push({element:t,datasetIndex:s,index:l}),r=r||t.inRange(e.x,e.y,n))}),s&&!r?[]:o}var Cn={modes:{index(t,e,i,s){const n=Os(e,t),o=i.axis||"x",a=i.includeInvisible||!1,r=i.intersect?wn(t,n,o,s,a):$n(t,n,o,!1,s,a),l=[];return r.length?(t.getSortedVisibleDatasetMetas().forEach(t=>{const e=r[0].index,i=t.data[e];i&&!i.skip&&l.push({element:i,datasetIndex:t.index,index:e})}),l):[]},dataset(t,e,i,s){const n=Os(e,t),o=i.axis||"xy",a=i.includeInvisible||!1;let r=i.intersect?wn(t,n,o,s,a):$n(t,n,o,!1,s,a);if(r.length>0){const e=r[0].datasetIndex,i=t.getDatasetMeta(e).data;r=[];for(let t=0;t<i.length;++t)r.push({element:i[t],datasetIndex:e,index:t})}return r},point:(t,e,i,s)=>wn(t,Os(e,t),i.axis||"xy",s,i.includeInvisible||!1),nearest(t,e,i,s){const n=Os(e,t),o=i.axis||"xy",a=i.includeInvisible||!1;return $n(t,n,o,i.intersect,s,a)},x:(t,e,i,s)=>Mn(t,Os(e,t),"x",i.intersect,s),y:(t,e,i,s)=>Mn(t,Os(e,t),"y",i.intersect,s)}};const An=["left","top","right","bottom"];function Tn(t,e){return t.filter(t=>t.pos===e)}function Dn(t,e){return t.filter(t=>-1===An.indexOf(t.pos)&&t.box.axis===e)}function En(t,e){return t.sort((t,i)=>{const s=e?i:t,n=e?t:i;return s.weight===n.weight?s.index-n.index:s.weight-n.weight})}function Pn(t,e){const i=function(t){const e={};for(const i of t){const{stack:t,pos:s,stackWeight:n}=i;if(!t||!An.includes(s))continue;const o=e[t]||(e[t]={count:0,placed:0,weight:0,size:0});o.count++,o.weight+=n}return e}(t),{vBoxMaxWidth:s,hBoxMaxHeight:n}=e;let o,a,r;for(o=0,a=t.length;o<a;++o){r=t[o];const{fullSize:a}=r.box,l=i[r.stack],c=l&&r.stackWeight/l.weight;r.horizontal?(r.width=c?c*s:a&&e.availableWidth,r.height=n):(r.width=s,r.height=c?c*n:a&&e.availableHeight)}return i}function Ln(t,e,i,s){return Math.max(t[i],e[i])+Math.max(t[s],e[s])}function On(t,e){t.top=Math.max(t.top,e.top),t.left=Math.max(t.left,e.left),t.bottom=Math.max(t.bottom,e.bottom),t.right=Math.max(t.right,e.right)}function Rn(t,e,i,s){const{pos:n,box:o}=i,a=t.maxPadding;if(!Se(n)){i.size&&(t[n]-=i.size);const e=s[i.stack]||{size:0,count:1};e.size=Math.max(e.size,i.horizontal?o.height:o.width),i.size=e.size/e.count,t[n]+=i.size}o.getPadding&&On(a,o.getPadding());const r=Math.max(0,e.outerWidth-Ln(a,t,"left","right")),l=Math.max(0,e.outerHeight-Ln(a,t,"top","bottom")),c=r!==t.w,h=l!==t.h;return t.w=r,t.h=l,i.horizontal?{same:c,other:h}:{same:h,other:c}}function zn(t,e){const i=e.maxPadding;function s(t){const s={left:0,top:0,right:0,bottom:0};return t.forEach(t=>{s[t]=Math.max(e[t],i[t])}),s}return s(t?["left","right"]:["top","bottom"])}function jn(t,e,i,s){const n=[];let o,a,r,l,c,h;for(o=0,a=t.length,c=0;o<a;++o){r=t[o],l=r.box,l.update(r.width||e.w,r.height||e.h,zn(r.horizontal,e));const{same:a,other:d}=Rn(e,i,r,s);c|=a&&n.length,h=h||d,l.fullSize||n.push(r)}return c&&jn(n,e,i,s)||h}function In(t,e,i,s,n){t.top=i,t.left=e,t.right=e+s,t.bottom=i+n,t.width=s,t.height=n}function Hn(t,e,i,s){const n=i.padding;let{x:o,y:a}=e;for(const r of t){const t=r.box,l=s[r.stack]||{placed:0,weight:1},c=r.stackWeight/l.weight||1;if(r.horizontal){const s=e.w*c,o=l.size||t.height;Fe(l.start)&&(a=l.start),t.fullSize?In(t,n.left,a,i.outerWidth-n.right-n.left,o):In(t,e.left+l.placed,a,s,o),l.start=a,l.placed+=s,a=t.bottom}else{const s=e.h*c,a=l.size||t.width;Fe(l.start)&&(o=l.start),t.fullSize?In(t,o,n.top,a,i.outerHeight-n.bottom-n.top):In(t,o,e.top+l.placed,a,s),l.start=o,l.placed+=s,o=t.right}}e.x=o,e.y=a}var Fn={addBox(t,e){t.boxes||(t.boxes=[]),e.fullSize=e.fullSize||!1,e.position=e.position||"top",e.weight=e.weight||0,e._layers=e._layers||function(){return[{z:0,draw(t){e.draw(t)}}]},t.boxes.push(e)},removeBox(t,e){const i=t.boxes?t.boxes.indexOf(e):-1;-1!==i&&t.boxes.splice(i,1)},configure(t,e,i){e.fullSize=i.fullSize,e.position=i.position,e.weight=i.weight},update(t,e,i,s){if(!t)return;const n=ss(t.options.layout.padding),o=Math.max(e-n.width,0),a=Math.max(i-n.height,0),r=function(t){const e=function(t){const e=[];let i,s,n,o,a,r;for(i=0,s=(t||[]).length;i<s;++i)n=t[i],({position:o,options:{stack:a,stackWeight:r=1}}=n),e.push({index:i,box:n,pos:o,horizontal:n.isHorizontal(),weight:n.weight,stack:a&&o+a,stackWeight:r});return e}(t),i=En(e.filter(t=>t.box.fullSize),!0),s=En(Tn(e,"left"),!0),n=En(Tn(e,"right")),o=En(Tn(e,"top"),!0),a=En(Tn(e,"bottom")),r=Dn(e,"x"),l=Dn(e,"y");return{fullSize:i,leftAndTop:s.concat(o),rightAndBottom:n.concat(l).concat(a).concat(r),chartArea:Tn(e,"chartArea"),vertical:s.concat(n).concat(l),horizontal:o.concat(a).concat(r)}}(t.boxes),l=r.vertical,c=r.horizontal;Te(t.boxes,t=>{"function"==typeof t.beforeLayout&&t.beforeLayout()});const h=l.reduce((t,e)=>e.box.options&&!1===e.box.options.display?t:t+1,0)||1,d=Object.freeze({outerWidth:e,outerHeight:i,padding:n,availableWidth:o,availableHeight:a,vBoxMaxWidth:o/2/h,hBoxMaxHeight:a/2}),p=Object.assign({},n);On(p,ss(s));const u=Object.assign({maxPadding:p,w:o,h:a,x:n.left,y:n.top},n),g=Pn(l.concat(c),d);jn(r.fullSize,u,d,g),jn(l,u,d,g),jn(c,u,d,g)&&jn(l,u,d,g),function(t){const e=t.maxPadding;function i(i){const s=Math.max(e[i]-t[i],0);return t[i]+=s,s}t.y+=i("top"),t.x+=i("left"),i("right"),i("bottom")}(u),Hn(r.leftAndTop,u,d,g),u.x+=u.w,u.y+=u.h,Hn(r.rightAndBottom,u,d,g),t.chartArea={left:u.left,top:u.top,right:u.left+u.w,bottom:u.top+u.h,height:u.h,width:u.w},Te(r.chartArea,e=>{const i=e.box;Object.assign(i,t.chartArea),i.update(u.w,u.h,{left:0,top:0,right:0,bottom:0})})}};class Bn{acquireContext(t,e){}releaseContext(t){return!1}addEventListener(t,e,i){}removeEventListener(t,e,i){}getDevicePixelRatio(){return 1}getMaximumSize(t,e,i,s){return e=Math.max(0,e||t.width),i=i||t.height,{width:e,height:Math.max(0,s?Math.floor(e/s):i)}}isAttached(t){return!0}updateConfig(t){}}class Vn extends Bn{acquireContext(t){return t&&t.getContext&&t.getContext("2d")||null}updateConfig(t){t.options.animation=!1}}const Wn="$chartjs",Nn={touchstart:"mousedown",touchmove:"mousemove",touchend:"mouseup",pointerenter:"mouseenter",pointerdown:"mousedown",pointermove:"mousemove",pointerup:"mouseup",pointerleave:"mouseout",pointerout:"mouseout"},Un=t=>null===t||""===t;const qn=!!Is&&{passive:!0};function Yn(t,e,i){t&&t.canvas&&t.canvas.removeEventListener(e,i,qn)}function Xn(t,e){for(const i of t)if(i===e||i.contains(e))return!0}function Kn(t,e,i){const s=t.canvas,n=new MutationObserver(t=>{let e=!1;for(const i of t)e=e||Xn(i.addedNodes,s),e=e&&!Xn(i.removedNodes,s);e&&i()});return n.observe(document,{childList:!0,subtree:!0}),n}function Gn(t,e,i){const s=t.canvas,n=new MutationObserver(t=>{let e=!1;for(const i of t)e=e||Xn(i.removedNodes,s),e=e&&!Xn(i.addedNodes,s);e&&i()});return n.observe(document,{childList:!0,subtree:!0}),n}const Jn=new Map;let Zn=0;function Qn(){const t=window.devicePixelRatio;t!==Zn&&(Zn=t,Jn.forEach((e,i)=>{i.currentDevicePixelRatio!==t&&e()}))}function to(t,e,i){const s=t.canvas,n=s&&Ts(s);if(!n)return;const o=mi((t,e)=>{const s=n.clientWidth;i(t,e),s<n.clientWidth&&i()},window),a=new ResizeObserver(t=>{const e=t[0],i=e.contentRect.width,s=e.contentRect.height;0===i&&0===s||o(i,s)});return a.observe(n),function(t,e){Jn.size||window.addEventListener("resize",Qn),Jn.set(t,e)}(t,o),a}function eo(t,e,i){i&&i.disconnect(),"resize"===e&&function(t){Jn.delete(t),Jn.size||window.removeEventListener("resize",Qn)}(t)}function io(t,e,i){const s=t.canvas,n=mi(e=>{null!==t.ctx&&i(function(t,e){const i=Nn[t.type]||t.type,{x:s,y:n}=Os(t,e);return{type:i,chart:e,native:t,x:void 0!==s?s:null,y:void 0!==n?n:null}}(e,t))},t);return function(t,e,i){t&&t.addEventListener(e,i,qn)}(s,e,n),n}class so extends Bn{acquireContext(t,e){const i=t&&t.getContext&&t.getContext("2d");return i&&i.canvas===t?(function(t,e){const i=t.style,s=t.getAttribute("height"),n=t.getAttribute("width");if(t[Wn]={initial:{height:s,width:n,style:{display:i.display,height:i.height,width:i.width}}},i.display=i.display||"block",i.boxSizing=i.boxSizing||"border-box",Un(n)){const e=Hs(t,"width");void 0!==e&&(t.width=e)}if(Un(s))if(""===t.style.height)t.height=t.width/(e||2);else{const e=Hs(t,"height");void 0!==e&&(t.height=e)}}(t,e),i):null}releaseContext(t){const e=t.canvas;if(!e[Wn])return!1;const i=e[Wn].initial;["height","width"].forEach(t=>{const s=i[t];we(s)?e.removeAttribute(t):e.setAttribute(t,s)});const s=i.style||{};return Object.keys(s).forEach(t=>{e.style[t]=s[t]}),e.width=e.width,delete e[Wn],!0}addEventListener(t,e,i){this.removeEventListener(t,e);const s=t.$proxies||(t.$proxies={}),n={attach:Kn,detach:Gn,resize:to}[e]||io;s[e]=n(t,e,i)}removeEventListener(t,e){const i=t.$proxies||(t.$proxies={}),s=i[e];if(!s)return;({attach:eo,detach:eo,resize:eo}[e]||Yn)(t,e,s),i[e]=void 0}getDevicePixelRatio(){return window.devicePixelRatio}getMaximumSize(t,e,i,s){return zs(t,e,i,s)}isAttached(t){const e=t&&Ts(t);return!(!e||!e.isConnected)}}class no{static defaults={};static defaultRoutes=void 0;x;y;active=!1;options;$animations;tooltipPosition(t){const{x:e,y:i}=this.getProps(["x","y"],t);return{x:e,y:i}}hasValue(){return ei(this.x)&&ei(this.y)}getProps(t,e){const i=this.$animations;if(!e||!i)return this;const s={};return t.forEach(t=>{s[t]=i[t]&&i[t].active()?i[t]._to:this[t]}),s}}function oo(t,e){const i=t.options.ticks,s=function(t){const e=t.options.offset,i=t._tickSize(),s=t._length/i+(e?0:1),n=t._maxLength/i;return Math.floor(Math.min(s,n))}(t),n=Math.min(i.maxTicksLimit||s,s),o=i.major.enabled?function(t){const e=[];let i,s;for(i=0,s=t.length;i<s;i++)t[i].major&&e.push(i);return e}(e):[],a=o.length,r=o[0],l=o[a-1],c=[];if(a>n)return function(t,e,i,s){let n,o=0,a=i[0];for(s=Math.ceil(s),n=0;n<t.length;n++)n===a&&(e.push(t[n]),o++,a=i[o*s])}(e,c,o,a/n),c;const h=function(t,e,i){const s=function(t){const e=t.length;let i,s;if(e<2)return!1;for(s=t[0],i=1;i<e;++i)if(t[i]-t[i-1]!==s)return!1;return s}(t),n=e.length/i;if(!s)return Math.max(n,1);const o=function(t){const e=[],i=Math.sqrt(t);let s;for(s=1;s<i;s++)t%s===0&&(e.push(s),e.push(t/s));return i===(0|i)&&e.push(i),e.sort((t,e)=>t-e).pop(),e}(s);for(let t=0,e=o.length-1;t<e;t++){const e=o[t];if(e>n)return e}return Math.max(n,1)}(o,e,n);if(a>0){let t,i;const s=a>1?Math.round((l-r)/(a-1)):null;for(ao(e,c,h,we(s)?0:r-s,r),t=0,i=a-1;t<i;t++)ao(e,c,h,o[t],o[t+1]);return ao(e,c,h,l,we(s)?e.length:l+s),c}return ao(e,c,h),c}function ao(t,e,i,s,n){const o=Ce(s,0),a=Math.min(Ce(n,t.length),t.length);let r,l,c,h=0;for(i=Math.ceil(i),n&&(r=n-s,i=r/Math.floor(r/i)),c=o;c<0;)h++,c=Math.round(o+h*i);for(l=Math.max(o,0);l<a;l++)l===c&&(e.push(t[l]),h++,c=Math.round(o+h*i))}const ro=(t,e,i)=>"top"===e||"left"===e?t[e]+i:t[e]-i,lo=(t,e)=>Math.min(e||t,t);function co(t,e){const i=[],s=t.length/e,n=t.length;let o=0;for(;o<n;o+=s)i.push(t[Math.floor(o)]);return i}function ho(t,e,i){const s=t.ticks.length,n=Math.min(e,s-1),o=t._startPixel,a=t._endPixel,r=1e-6;let l,c=t.getPixelForTick(n);if(!(i&&(l=1===s?Math.max(c-o,a-c):0===e?(t.getPixelForTick(1)-c)/2:(c-t.getPixelForTick(n-1))/2,c+=n<e?l:-l,c<o-r||c>a+r)))return c}function po(t){return t.drawTicks?t.tickLength:0}function uo(t,e){if(!t.display)return 0;const i=ns(t.font,e),s=ss(t.padding);return(ke(t.text)?t.text.length:1)*i.lineHeight+s.height}function go(t,e,i){let s=bi(t);return(i&&"right"!==e||!i&&"right"===e)&&(s=(t=>"left"===t?"right":"right"===t?"left":t)(s)),s}class fo extends no{constructor(t){super(),this.id=t.id,this.type=t.type,this.options=void 0,this.ctx=t.ctx,this.chart=t.chart,this.top=void 0,this.bottom=void 0,this.left=void 0,this.right=void 0,this.width=void 0,this.height=void 0,this._margins={left:0,right:0,top:0,bottom:0},this.maxWidth=void 0,this.maxHeight=void 0,this.paddingTop=void 0,this.paddingBottom=void 0,this.paddingLeft=void 0,this.paddingRight=void 0,this.axis=void 0,this.labelRotation=void 0,this.min=void 0,this.max=void 0,this._range=void 0,this.ticks=[],this._gridLineItems=null,this._labelItems=null,this._labelSizes=null,this._length=0,this._maxLength=0,this._longestTextCache={},this._startPixel=void 0,this._endPixel=void 0,this._reversePixels=!1,this._userMax=void 0,this._userMin=void 0,this._suggestedMax=void 0,this._suggestedMin=void 0,this._ticksLength=0,this._borderValue=0,this._cache={},this._dataLimitsCached=!1,this.$context=void 0}init(t){this.options=t.setContext(this.getContext()),this.axis=t.axis,this._userMin=this.parse(t.min),this._userMax=this.parse(t.max),this._suggestedMin=this.parse(t.suggestedMin),this._suggestedMax=this.parse(t.suggestedMax)}parse(t,e){return t}getUserBounds(){let{_userMin:t,_userMax:e,_suggestedMin:i,_suggestedMax:s}=this;return t=Me(t,Number.POSITIVE_INFINITY),e=Me(e,Number.NEGATIVE_INFINITY),i=Me(i,Number.POSITIVE_INFINITY),s=Me(s,Number.NEGATIVE_INFINITY),{min:Me(t,i),max:Me(e,s),minDefined:$e(t),maxDefined:$e(e)}}getMinMax(t){let e,{min:i,max:s,minDefined:n,maxDefined:o}=this.getUserBounds();if(n&&o)return{min:i,max:s};const a=this.getMatchingVisibleMetas();for(let r=0,l=a.length;r<l;++r)e=a[r].controller.getMinMax(this,t),n||(i=Math.min(i,e.min)),o||(s=Math.max(s,e.max));return i=o&&i>s?s:i,s=n&&i>s?i:s,{min:Me(i,Me(s,i)),max:Me(s,Me(i,s))}}getPadding(){return{left:this.paddingLeft||0,top:this.paddingTop||0,right:this.paddingRight||0,bottom:this.paddingBottom||0}}getTicks(){return this.ticks}getLabels(){const t=this.chart.data;return this.options.labels||(this.isHorizontal()?t.xLabels:t.yLabels)||t.labels||[]}getLabelItems(t=this.chart.chartArea){return this._labelItems||(this._labelItems=this._computeLabelItems(t))}beforeLayout(){this._cache={},this._dataLimitsCached=!1}beforeUpdate(){Ae(this.options.beforeUpdate,[this])}update(t,e,i){const{beginAtZero:s,grace:n,ticks:o}=this.options,a=o.sampleSize;this.beforeUpdate(),this.maxWidth=t,this.maxHeight=e,this._margins=i=Object.assign({left:0,right:0,top:0,bottom:0},i),this.ticks=null,this._labelSizes=null,this._gridLineItems=null,this._labelItems=null,this.beforeSetDimensions(),this.setDimensions(),this.afterSetDimensions(),this._maxLength=this.isHorizontal()?this.width+i.left+i.right:this.height+i.top+i.bottom,this._dataLimitsCached||(this.beforeDataLimits(),this.determineDataLimits(),this.afterDataLimits(),this._range=as(this,n,s),this._dataLimitsCached=!0),this.beforeBuildTicks(),this.ticks=this.buildTicks()||[],this.afterBuildTicks();const r=a<this.ticks.length;this._convertTicksToLabels(r?co(this.ticks,a):this.ticks),this.configure(),this.beforeCalculateLabelRotation(),this.calculateLabelRotation(),this.afterCalculateLabelRotation(),o.display&&(o.autoSkip||"auto"===o.source)&&(this.ticks=oo(this,this.ticks),this._labelSizes=null,this.afterAutoSkip()),r&&this._convertTicksToLabels(this.ticks),this.beforeFit(),this.fit(),this.afterFit(),this.afterUpdate()}configure(){let t,e,i=this.options.reverse;this.isHorizontal()?(t=this.left,e=this.right):(t=this.top,e=this.bottom,i=!i),this._startPixel=t,this._endPixel=e,this._reversePixels=i,this._length=e-t,this._alignToPixels=this.options.alignToPixels}afterUpdate(){Ae(this.options.afterUpdate,[this])}beforeSetDimensions(){Ae(this.options.beforeSetDimensions,[this])}setDimensions(){this.isHorizontal()?(this.width=this.maxWidth,this.left=0,this.right=this.width):(this.height=this.maxHeight,this.top=0,this.bottom=this.height),this.paddingLeft=0,this.paddingTop=0,this.paddingRight=0,this.paddingBottom=0}afterSetDimensions(){Ae(this.options.afterSetDimensions,[this])}_callHooks(t){this.chart.notifyPlugins(t,this.getContext()),Ae(this.options[t],[this])}beforeDataLimits(){this._callHooks("beforeDataLimits")}determineDataLimits(){}afterDataLimits(){this._callHooks("afterDataLimits")}beforeBuildTicks(){this._callHooks("beforeBuildTicks")}buildTicks(){return[]}afterBuildTicks(){this._callHooks("afterBuildTicks")}beforeTickToLabelConversion(){Ae(this.options.beforeTickToLabelConversion,[this])}generateTickLabels(t){const e=this.options.ticks;let i,s,n;for(i=0,s=t.length;i<s;i++)n=t[i],n.label=Ae(e.callback,[n.value,i,t],this)}afterTickToLabelConversion(){Ae(this.options.afterTickToLabelConversion,[this])}beforeCalculateLabelRotation(){Ae(this.options.beforeCalculateLabelRotation,[this])}calculateLabelRotation(){const t=this.options,e=t.ticks,i=lo(this.ticks.length,t.ticks.maxTicksLimit),s=e.minRotation||0,n=e.maxRotation;let o,a,r,l=s;if(!this._isVisible()||!e.display||s>=n||i<=1||!this.isHorizontal())return void(this.labelRotation=s);const c=this._getLabelSizes(),h=c.widest.width,d=c.highest.height,p=li(this.chart.width-h,0,this.maxWidth);o=t.offset?this.maxWidth/i:p/(i-1),h+6>o&&(o=p/(i-(t.offset?.5:1)),a=this.maxHeight-po(t.grid)-e.padding-uo(t.title,this.chart.options.font),r=Math.sqrt(h*h+d*d),l=Math.min(Math.asin(li((c.highest.height+6)/o,-1,1)),Math.asin(li(a/r,-1,1))-Math.asin(li(d/r,-1,1)))*(180/We),l=Math.max(s,Math.min(n,l))),this.labelRotation=l}afterCalculateLabelRotation(){Ae(this.options.afterCalculateLabelRotation,[this])}afterAutoSkip(){}beforeFit(){Ae(this.options.beforeFit,[this])}fit(){const t={width:0,height:0},{chart:e,options:{ticks:i,title:s,grid:n}}=this,o=this._isVisible(),a=this.isHorizontal();if(o){const o=uo(s,e.options.font);if(a?(t.width=this.maxWidth,t.height=po(n)+o):(t.height=this.maxHeight,t.width=po(n)+o),i.display&&this.ticks.length){const{first:e,last:s,widest:n,highest:o}=this._getLabelSizes(),r=2*i.padding,l=ii(this.labelRotation),c=Math.cos(l),h=Math.sin(l);if(a){const e=i.mirror?0:h*n.width+c*o.height;t.height=Math.min(this.maxHeight,t.height+e+r)}else{const e=i.mirror?0:c*n.width+h*o.height;t.width=Math.min(this.maxWidth,t.width+e+r)}this._calculatePadding(e,s,h,c)}}this._handleMargins(),a?(this.width=this._length=e.width-this._margins.left-this._margins.right,this.height=t.height):(this.width=t.width,this.height=this._length=e.height-this._margins.top-this._margins.bottom)}_calculatePadding(t,e,i,s){const{ticks:{align:n,padding:o},position:a}=this.options,r=0!==this.labelRotation,l="top"!==a&&"x"===this.axis;if(this.isHorizontal()){const a=this.getPixelForTick(0)-this.left,c=this.right-this.getPixelForTick(this.ticks.length-1);let h=0,d=0;r?l?(h=s*t.width,d=i*e.height):(h=i*t.height,d=s*e.width):"start"===n?d=e.width:"end"===n?h=t.width:"inner"!==n&&(h=t.width/2,d=e.width/2),this.paddingLeft=Math.max((h-a+o)*this.width/(this.width-a),0),this.paddingRight=Math.max((d-c+o)*this.width/(this.width-c),0)}else{let i=e.height/2,s=t.height/2;"start"===n?(i=0,s=t.height):"end"===n&&(i=e.height,s=0),this.paddingTop=i+o,this.paddingBottom=s+o}}_handleMargins(){this._margins&&(this._margins.left=Math.max(this.paddingLeft,this._margins.left),this._margins.top=Math.max(this.paddingTop,this._margins.top),this._margins.right=Math.max(this.paddingRight,this._margins.right),this._margins.bottom=Math.max(this.paddingBottom,this._margins.bottom))}afterFit(){Ae(this.options.afterFit,[this])}isHorizontal(){const{axis:t,position:e}=this.options;return"top"===e||"bottom"===e||"x"===t}isFullSize(){return this.options.fullSize}_convertTicksToLabels(t){let e,i;for(this.beforeTickToLabelConversion(),this.generateTickLabels(t),e=0,i=t.length;e<i;e++)we(t[e].label)&&(t.splice(e,1),i--,e--);this.afterTickToLabelConversion()}_getLabelSizes(){let t=this._labelSizes;if(!t){const e=this.options.ticks.sampleSize;let i=this.ticks;e<i.length&&(i=co(i,e)),this._labelSizes=t=this._computeLabelSizes(i,i.length,this.options.ticks.maxTicksLimit)}return t}_computeLabelSizes(t,e,i){const{ctx:s,_longestTextCache:n}=this,o=[],a=[],r=Math.floor(e/lo(e,i));let l,c,h,d,p,u,g,f,m,b,x,y=0,v=0;for(l=0;l<e;l+=r){if(d=t[l].label,p=this._resolveTickFontOptions(l),s.font=u=p.string,g=n[u]=n[u]||{data:{},gc:[]},f=p.lineHeight,m=b=0,we(d)||ke(d)){if(ke(d))for(c=0,h=d.length;c<h;++c)x=d[c],we(x)||ke(x)||(m=ji(s,g.data,g.gc,m,x),b+=f)}else m=ji(s,g.data,g.gc,m,d),b=f;o.push(m),a.push(b),y=Math.max(m,y),v=Math.max(b,v)}!function(t,e){Te(t,t=>{const i=t.gc,s=i.length/2;let n;if(s>e){for(n=0;n<s;++n)delete t.data[i[n]];i.splice(0,s)}})}(n,e);const _=o.indexOf(y),w=a.indexOf(v),k=t=>({width:o[t]||0,height:a[t]||0});return{first:k(0),last:k(e-1),widest:k(_),highest:k(w),widths:o,heights:a}}getLabelForValue(t){return t}getPixelForValue(t,e){return NaN}getValueForPixel(t){}getPixelForTick(t){const e=this.ticks;return t<0||t>e.length-1?null:this.getPixelForValue(e[t].value)}getPixelForDecimal(t){this._reversePixels&&(t=1-t);const e=this._startPixel+t*this._length;return li(this._alignToPixels?Ii(this.chart,e,0):e,-32768,32767)}getDecimalForPixel(t){const e=(t-this._startPixel)/this._length;return this._reversePixels?1-e:e}getBasePixel(){return this.getPixelForValue(this.getBaseValue())}getBaseValue(){const{min:t,max:e}=this;return t<0&&e<0?e:t>0&&e>0?t:0}getContext(t){const e=this.ticks||[];if(t>=0&&t<e.length){const i=e[t];return i.$context||(i.$context=function(t,e,i){return rs(t,{tick:i,index:e,type:"tick"})}(this.getContext(),t,i))}return this.$context||(this.$context=rs(this.chart.getContext(),{scale:this,type:"scale"}))}_tickSize(){const t=this.options.ticks,e=ii(this.labelRotation),i=Math.abs(Math.cos(e)),s=Math.abs(Math.sin(e)),n=this._getLabelSizes(),o=t.autoSkipPadding||0,a=n?n.widest.width+o:0,r=n?n.highest.height+o:0;return this.isHorizontal()?r*i>a*s?a/i:r/s:r*s<a*i?r/i:a/s}_isVisible(){const t=this.options.display;return"auto"!==t?!!t:this.getMatchingVisibleMetas().length>0}_computeGridLineItems(t){const e=this.axis,i=this.chart,s=this.options,{grid:n,position:o,border:a}=s,r=n.offset,l=this.isHorizontal(),c=this.ticks.length+(r?1:0),h=po(n),d=[],p=a.setContext(this.getContext()),u=p.display?p.width:0,g=u/2,f=function(t){return Ii(i,t,u)};let m,b,x,y,v,_,w,k,S,$,M,C;if("top"===o)m=f(this.bottom),_=this.bottom-h,k=m-g,$=f(t.top)+g,C=t.bottom;else if("bottom"===o)m=f(this.top),$=t.top,C=f(t.bottom)-g,_=m+g,k=this.top+h;else if("left"===o)m=f(this.right),v=this.right-h,w=m-g,S=f(t.left)+g,M=t.right;else if("right"===o)m=f(this.left),S=t.left,M=f(t.right)-g,v=m+g,w=this.left+h;else if("x"===e){if("center"===o)m=f((t.top+t.bottom)/2+.5);else if(Se(o)){const t=Object.keys(o)[0],e=o[t];m=f(this.chart.scales[t].getPixelForValue(e))}$=t.top,C=t.bottom,_=m+g,k=_+h}else if("y"===e){if("center"===o)m=f((t.left+t.right)/2);else if(Se(o)){const t=Object.keys(o)[0],e=o[t];m=f(this.chart.scales[t].getPixelForValue(e))}v=m-g,w=v-h,S=t.left,M=t.right}const A=Ce(s.ticks.maxTicksLimit,c),T=Math.max(1,Math.ceil(c/A));for(b=0;b<c;b+=T){const t=this.getContext(b),e=n.setContext(t),s=a.setContext(t),o=e.lineWidth,c=e.color,h=s.dash||[],p=s.dashOffset,u=e.tickWidth,g=e.tickColor,f=e.tickBorderDash||[],m=e.tickBorderDashOffset;x=ho(this,b,r),void 0!==x&&(y=Ii(i,x,o),l?v=w=S=M=y:_=k=$=C=y,d.push({tx1:v,ty1:_,tx2:w,ty2:k,x1:S,y1:$,x2:M,y2:C,width:o,color:c,borderDash:h,borderDashOffset:p,tickWidth:u,tickColor:g,tickBorderDash:f,tickBorderDashOffset:m}))}return this._ticksLength=c,this._borderValue=m,d}_computeLabelItems(t){const e=this.axis,i=this.options,{position:s,ticks:n}=i,o=this.isHorizontal(),a=this.ticks,{align:r,crossAlign:l,padding:c,mirror:h}=n,d=po(i.grid),p=d+c,u=h?-c:p,g=-ii(this.labelRotation),f=[];let m,b,x,y,v,_,w,k,S,$,M,C,A="middle";if("top"===s)_=this.bottom-u,w=this._getXAxisLabelAlignment();else if("bottom"===s)_=this.top+u,w=this._getXAxisLabelAlignment();else if("left"===s){const t=this._getYAxisLabelAlignment(d);w=t.textAlign,v=t.x}else if("right"===s){const t=this._getYAxisLabelAlignment(d);w=t.textAlign,v=t.x}else if("x"===e){if("center"===s)_=(t.top+t.bottom)/2+p;else if(Se(s)){const t=Object.keys(s)[0],e=s[t];_=this.chart.scales[t].getPixelForValue(e)+p}w=this._getXAxisLabelAlignment()}else if("y"===e){if("center"===s)v=(t.left+t.right)/2-p;else if(Se(s)){const t=Object.keys(s)[0],e=s[t];v=this.chart.scales[t].getPixelForValue(e)}w=this._getYAxisLabelAlignment(d).textAlign}"y"===e&&("start"===r?A="top":"end"===r&&(A="bottom"));const T=this._getLabelSizes();for(m=0,b=a.length;m<b;++m){x=a[m],y=x.label;const t=n.setContext(this.getContext(m));k=this.getPixelForTick(m)+n.labelOffset,S=this._resolveTickFontOptions(m),$=S.lineHeight,M=ke(y)?y.length:1;const e=M/2,i=t.color,r=t.textStrokeColor,c=t.textStrokeWidth;let d,p=w;if(o?(v=k,"inner"===w&&(p=m===b-1?this.options.reverse?"left":"right":0===m?this.options.reverse?"right":"left":"center"),C="top"===s?"near"===l||0!==g?-M*$+$/2:"center"===l?-T.highest.height/2-e*$+$:-T.highest.height+$/2:"near"===l||0!==g?$/2:"center"===l?T.highest.height/2-e*$:T.highest.height-M*$,h&&(C*=-1),0===g||t.showLabelBackdrop||(v+=$/2*Math.sin(g))):(_=k,C=(1-M)*$/2),t.showLabelBackdrop){const e=ss(t.backdropPadding),i=T.heights[m],s=T.widths[m];let n=C-e.top,o=0-e.left;switch(A){case"middle":n-=i/2;break;case"bottom":n-=i}switch(w){case"center":o-=s/2;break;case"right":o-=s;break;case"inner":m===b-1?o-=s:m>0&&(o-=s/2)}d={left:o,top:n,width:s+e.width,height:i+e.height,color:t.backdropColor}}f.push({label:y,font:S,textOffset:C,options:{rotation:g,color:i,strokeColor:r,strokeWidth:c,textAlign:p,textBaseline:A,translation:[v,_],backdrop:d}})}return f}_getXAxisLabelAlignment(){const{position:t,ticks:e}=this.options;if(-ii(this.labelRotation))return"top"===t?"left":"right";let i="center";return"start"===e.align?i="left":"end"===e.align?i="right":"inner"===e.align&&(i="inner"),i}_getYAxisLabelAlignment(t){const{position:e,ticks:{crossAlign:i,mirror:s,padding:n}}=this.options,o=t+n,a=this._getLabelSizes().widest.width;let r,l;return"left"===e?s?(l=this.right+n,"near"===i?r="left":"center"===i?(r="center",l+=a/2):(r="right",l+=a)):(l=this.right-o,"near"===i?r="right":"center"===i?(r="center",l-=a/2):(r="left",l=this.left)):"right"===e?s?(l=this.left+n,"near"===i?r="right":"center"===i?(r="center",l-=a/2):(r="left",l-=a)):(l=this.left+o,"near"===i?r="left":"center"===i?(r="center",l+=a/2):(r="right",l=this.right)):r="right",{textAlign:r,x:l}}_computeLabelArea(){if(this.options.ticks.mirror)return;const t=this.chart,e=this.options.position;return"left"===e||"right"===e?{top:0,left:this.left,bottom:t.height,right:this.right}:"top"===e||"bottom"===e?{top:this.top,left:0,bottom:this.bottom,right:t.width}:void 0}drawBackground(){const{ctx:t,options:{backgroundColor:e},left:i,top:s,width:n,height:o}=this;e&&(t.save(),t.fillStyle=e,t.fillRect(i,s,n,o),t.restore())}getLineWidthForValue(t){const e=this.options.grid;if(!this._isVisible()||!e.display)return 0;const i=this.ticks.findIndex(e=>e.value===t);if(i>=0){return e.setContext(this.getContext(i)).lineWidth}return 0}drawGrid(t){const e=this.options.grid,i=this.ctx,s=this._gridLineItems||(this._gridLineItems=this._computeGridLineItems(t));let n,o;const a=(t,e,s)=>{s.width&&s.color&&(i.save(),i.lineWidth=s.width,i.strokeStyle=s.color,i.setLineDash(s.borderDash||[]),i.lineDashOffset=s.borderDashOffset,i.beginPath(),i.moveTo(t.x,t.y),i.lineTo(e.x,e.y),i.stroke(),i.restore())};if(e.display)for(n=0,o=s.length;n<o;++n){const t=s[n];e.drawOnChartArea&&a({x:t.x1,y:t.y1},{x:t.x2,y:t.y2},t),e.drawTicks&&a({x:t.tx1,y:t.ty1},{x:t.tx2,y:t.ty2},{color:t.tickColor,width:t.tickWidth,borderDash:t.tickBorderDash,borderDashOffset:t.tickBorderDashOffset})}}drawBorder(){const{chart:t,ctx:e,options:{border:i,grid:s}}=this,n=i.setContext(this.getContext()),o=i.display?n.width:0;if(!o)return;const a=s.setContext(this.getContext(0)).lineWidth,r=this._borderValue;let l,c,h,d;this.isHorizontal()?(l=Ii(t,this.left,o)-o/2,c=Ii(t,this.right,a)+a/2,h=d=r):(h=Ii(t,this.top,o)-o/2,d=Ii(t,this.bottom,a)+a/2,l=c=r),e.save(),e.lineWidth=n.width,e.strokeStyle=n.color,e.beginPath(),e.moveTo(l,h),e.lineTo(c,d),e.stroke(),e.restore()}drawLabels(t){if(!this.options.ticks.display)return;const e=this.ctx,i=this._computeLabelArea();i&&Wi(e,i);const s=this.getLabelItems(t);for(const t of s){const i=t.options,s=t.font;Ki(e,t.label,0,t.textOffset,s,i)}i&&Ni(e)}drawTitle(){const{ctx:t,options:{position:e,title:i,reverse:s}}=this;if(!i.display)return;const n=ns(i.font),o=ss(i.padding),a=i.align;let r=n.lineHeight/2;"bottom"===e||"center"===e||Se(e)?(r+=o.bottom,ke(i.text)&&(r+=n.lineHeight*(i.text.length-1))):r+=o.top;const{titleX:l,titleY:c,maxWidth:h,rotation:d}=function(t,e,i,s){const{top:n,left:o,bottom:a,right:r,chart:l}=t,{chartArea:c,scales:h}=l;let d,p,u,g=0;const f=a-n,m=r-o;if(t.isHorizontal()){if(p=xi(s,o,r),Se(i)){const t=Object.keys(i)[0],s=i[t];u=h[t].getPixelForValue(s)+f-e}else u="center"===i?(c.bottom+c.top)/2+f-e:ro(t,i,e);d=r-o}else{if(Se(i)){const t=Object.keys(i)[0],s=i[t];p=h[t].getPixelForValue(s)-m+e}else p="center"===i?(c.left+c.right)/2-m+e:ro(t,i,e);u=xi(s,a,n),g="left"===i?-Xe:Xe}return{titleX:p,titleY:u,maxWidth:d,rotation:g}}(this,r,e,a);Ki(t,i.text,0,0,n,{color:i.color,maxWidth:h,rotation:d,textAlign:go(a,e,s),textBaseline:"middle",translation:[l,c]})}draw(t){this._isVisible()&&(this.drawBackground(),this.drawGrid(t),this.drawBorder(),this.drawTitle(),this.drawLabels(t))}_layers(){const t=this.options,e=t.ticks&&t.ticks.z||0,i=Ce(t.grid&&t.grid.z,-1),s=Ce(t.border&&t.border.z,0);return this._isVisible()&&this.draw===fo.prototype.draw?[{z:i,draw:t=>{this.drawBackground(),this.drawGrid(t),this.drawTitle()}},{z:s,draw:()=>{this.drawBorder()}},{z:e,draw:t=>{this.drawLabels(t)}}]:[{z:e,draw:t=>{this.draw(t)}}]}getMatchingVisibleMetas(t){const e=this.chart.getSortedVisibleDatasetMetas(),i=this.axis+"AxisID",s=[];let n,o;for(n=0,o=e.length;n<o;++n){const o=e[n];o[i]!==this.id||t&&o.type!==t||s.push(o)}return s}_resolveTickFontOptions(t){return ns(this.options.ticks.setContext(this.getContext(t)).font)}_maxDigits(){const t=this._resolveTickFontOptions(0).lineHeight;return(this.isHorizontal()?this.width:this.height)/t}}class mo{constructor(t,e,i){this.type=t,this.scope=e,this.override=i,this.items=Object.create(null)}isForType(t){return Object.prototype.isPrototypeOf.call(this.type.prototype,t.prototype)}register(t){const e=Object.getPrototypeOf(t);let i;(function(t){return"id"in t&&"defaults"in t})(e)&&(i=this.register(e));const s=this.items,n=t.id,o=this.scope+"."+n;if(!n)throw new Error("class does not have id: "+t);return n in s||(s[n]=t,function(t,e,i){const s=Oe(Object.create(null),[i?zi.get(i):{},zi.get(e),t.defaults]);zi.set(e,s),t.defaultRoutes&&function(t,e){Object.keys(e).forEach(i=>{const s=i.split("."),n=s.pop(),o=[t].concat(s).join("."),a=e[i].split("."),r=a.pop(),l=a.join(".");zi.route(o,n,l,r)})}(e,t.defaultRoutes);t.descriptors&&zi.describe(e,t.descriptors)}(t,o,i),this.override&&zi.override(t.id,t.overrides)),o}get(t){return this.items[t]}unregister(t){const e=this.items,i=t.id,s=this.scope;i in e&&delete e[i],s&&i in zi[s]&&(delete zi[s][i],this.override&&delete Ei[i])}}class bo{constructor(){this.controllers=new mo(yn,"datasets",!0),this.elements=new mo(no,"elements"),this.plugins=new mo(Object,"plugins"),this.scales=new mo(fo,"scales"),this._typedRegistries=[this.controllers,this.scales,this.elements]}add(...t){this._each("register",t)}remove(...t){this._each("unregister",t)}addControllers(...t){this._each("register",t,this.controllers)}addElements(...t){this._each("register",t,this.elements)}addPlugins(...t){this._each("register",t,this.plugins)}addScales(...t){this._each("register",t,this.scales)}getController(t){return this._get(t,this.controllers,"controller")}getElement(t){return this._get(t,this.elements,"element")}getPlugin(t){return this._get(t,this.plugins,"plugin")}getScale(t){return this._get(t,this.scales,"scale")}removeControllers(...t){this._each("unregister",t,this.controllers)}removeElements(...t){this._each("unregister",t,this.elements)}removePlugins(...t){this._each("unregister",t,this.plugins)}removeScales(...t){this._each("unregister",t,this.scales)}_each(t,e,i){[...e].forEach(e=>{const s=i||this._getRegistryForType(e);i||s.isForType(e)||s===this.plugins&&e.id?this._exec(t,s,e):Te(e,e=>{const s=i||this._getRegistryForType(e);this._exec(t,s,e)})})}_exec(t,e,i){const s=He(t);Ae(i["before"+s],[],i),e[t](i),Ae(i["after"+s],[],i)}_getRegistryForType(t){for(let e=0;e<this._typedRegistries.length;e++){const i=this._typedRegistries[e];if(i.isForType(t))return i}return this.plugins}_get(t,e,i){const s=e.get(t);if(void 0===s)throw new Error('"'+t+'" is not a registered '+i+".");return s}}var xo=new bo;class yo{constructor(){this._init=void 0}notify(t,e,i,s){if("beforeInit"===e&&(this._init=this._createDescriptors(t,!0),this._notify(this._init,t,"install")),void 0===this._init)return;const n=s?this._descriptors(t).filter(s):this._descriptors(t),o=this._notify(n,t,e,i);return"afterDestroy"===e&&(this._notify(n,t,"stop"),this._notify(this._init,t,"uninstall"),this._init=void 0),o}_notify(t,e,i,s){s=s||{};for(const n of t){const t=n.plugin;if(!1===Ae(t[i],[e,s,n.options],t)&&s.cancelable)return!1}return!0}invalidate(){we(this._cache)||(this._oldCache=this._cache,this._cache=void 0)}_descriptors(t){if(this._cache)return this._cache;const e=this._cache=this._createDescriptors(t);return this._notifyStateChanges(t),e}_createDescriptors(t,e){const i=t&&t.config,s=Ce(i.options&&i.options.plugins,{}),n=function(t){const e={},i=[],s=Object.keys(xo.plugins.items);for(let t=0;t<s.length;t++)i.push(xo.getPlugin(s[t]));const n=t.plugins||[];for(let t=0;t<n.length;t++){const s=n[t];-1===i.indexOf(s)&&(i.push(s),e[s.id]=!0)}return{plugins:i,localIds:e}}(i);return!1!==s||e?function(t,{plugins:e,localIds:i},s,n){const o=[],a=t.getContext();for(const r of e){const e=r.id,l=vo(s[e],n);null!==l&&o.push({plugin:r,options:_o(t.config,{plugin:r,local:i[e]},l,a)})}return o}(t,n,s,e):[]}_notifyStateChanges(t){const e=this._oldCache||[],i=this._cache,s=(t,e)=>t.filter(t=>!e.some(e=>t.plugin.id===e.plugin.id));this._notify(s(e,i),t,"stop"),this._notify(s(i,e),t,"start")}}function vo(t,e){return e||!1!==t?!0===t?{}:t:null}function _o(t,{plugin:e,local:i},s,n){const o=t.pluginScopeKeys(e),a=t.getOptionScopes(s,o);return i&&e.defaults&&a.push(e.defaults),t.createResolver(a,n,[""],{scriptable:!1,indexable:!1,allKeys:!0})}function wo(t,e){const i=zi.datasets[t]||{};return((e.datasets||{})[t]||{}).indexAxis||e.indexAxis||i.indexAxis||"x"}function ko(t){if("x"===t||"y"===t||"r"===t)return t}function So(t){return"top"===t||"bottom"===t?"x":"left"===t||"right"===t?"y":void 0}function $o(t,...e){if(ko(t))return t;for(const i of e){const e=i.axis||So(i.position)||t.length>1&&ko(t[0].toLowerCase());if(e)return e}throw new Error(`Cannot determine type of '${t}' axis. Please provide 'axis' or 'position' option.`)}function Mo(t,e,i){if(i[e+"AxisID"]===t)return{axis:e}}function Co(t,e){const i=Ei[t.type]||{scales:{}},s=e.scales||{},n=wo(t.type,e),o=Object.create(null);return Object.keys(s).forEach(e=>{const a=s[e];if(!Se(a))return console.error(`Invalid scale configuration for scale: ${e}`);if(a._proxy)return console.warn(`Ignoring resolver passed as options for scale: ${e}`);const r=$o(e,a,function(t,e){if(e.data&&e.data.datasets){const i=e.data.datasets.filter(e=>e.xAxisID===t||e.yAxisID===t);if(i.length)return Mo(t,"x",i[0])||Mo(t,"y",i[0])}return{}}(e,t),zi.scales[a.type]),l=function(t,e){return t===e?"_index_":"_value_"}(r,n),c=i.scales||{};o[e]=Re(Object.create(null),[{axis:r},a,c[r],c[l]])}),t.data.datasets.forEach(i=>{const n=i.type||t.type,a=i.indexAxis||wo(n,e),r=(Ei[n]||{}).scales||{};Object.keys(r).forEach(t=>{const e=function(t,e){let i=t;return"_index_"===t?i=e:"_value_"===t&&(i="x"===e?"y":"x"),i}(t,a),n=i[e+"AxisID"]||e;o[n]=o[n]||Object.create(null),Re(o[n],[{axis:e},s[n],r[t]])})}),Object.keys(o).forEach(t=>{const e=o[t];Re(e,[zi.scales[e.type],zi.scale])}),o}function Ao(t){const e=t.options||(t.options={});e.plugins=Ce(e.plugins,{}),e.scales=Co(t,e)}function To(t){return(t=t||{}).datasets=t.datasets||[],t.labels=t.labels||[],t}const Do=new Map,Eo=new Set;function Po(t,e){let i=Do.get(t);return i||(i=e(),Do.set(t,i),Eo.add(i)),i}const Lo=(t,e,i)=>{const s=Ie(e,i);void 0!==s&&t.add(s)};class Oo{constructor(t){this._config=function(t){return(t=t||{}).data=To(t.data),Ao(t),t}(t),this._scopeCache=new Map,this._resolverCache=new Map}get platform(){return this._config.platform}get type(){return this._config.type}set type(t){this._config.type=t}get data(){return this._config.data}set data(t){this._config.data=To(t)}get options(){return this._config.options}set options(t){this._config.options=t}get plugins(){return this._config.plugins}update(){const t=this._config;this.clearCache(),Ao(t)}clearCache(){this._scopeCache.clear(),this._resolverCache.clear()}datasetScopeKeys(t){return Po(t,()=>[[`datasets.${t}`,""]])}datasetAnimationScopeKeys(t,e){return Po(`${t}.transition.${e}`,()=>[[`datasets.${t}.transitions.${e}`,`transitions.${e}`],[`datasets.${t}`,""]])}datasetElementScopeKeys(t,e){return Po(`${t}-${e}`,()=>[[`datasets.${t}.elements.${e}`,`datasets.${t}`,`elements.${e}`,""]])}pluginScopeKeys(t){const e=t.id;return Po(`${this.type}-plugin-${e}`,()=>[[`plugins.${e}`,...t.additionalOptionScopes||[]]])}_cachedScopes(t,e){const i=this._scopeCache;let s=i.get(t);return s&&!e||(s=new Map,i.set(t,s)),s}getOptionScopes(t,e,i){const{options:s,type:n}=this,o=this._cachedScopes(t,i),a=o.get(e);if(a)return a;const r=new Set;e.forEach(e=>{t&&(r.add(t),e.forEach(e=>Lo(r,t,e))),e.forEach(t=>Lo(r,s,t)),e.forEach(t=>Lo(r,Ei[n]||{},t)),e.forEach(t=>Lo(r,zi,t)),e.forEach(t=>Lo(r,Pi,t))});const l=Array.from(r);return 0===l.length&&l.push(Object.create(null)),Eo.has(e)&&o.set(e,l),l}chartOptionScopes(){const{options:t,type:e}=this;return[t,Ei[e]||{},zi.datasets[e]||{},{type:e},zi,Pi]}resolveNamedOptions(t,e,i,s=[""]){const n={$shared:!0},{resolver:o,subPrefixes:a}=Ro(this._resolverCache,t,s);let r=o;if(function(t,e){const{isScriptable:i,isIndexable:s}=hs(t);for(const n of e){const e=i(n),o=s(n),a=(o||e)&&t[n];if(e&&(Be(a)||zo(a))||o&&ke(a))return!0}return!1}(o,e)){n.$shared=!1;r=cs(o,i=Be(i)?i():i,this.createResolver(t,i,a))}for(const t of e)n[t]=r[t];return n}createResolver(t,e,i=[""],s){const{resolver:n}=Ro(this._resolverCache,t,i);return Se(e)?cs(n,e,void 0,s):n}}function Ro(t,e,i){let s=t.get(e);s||(s=new Map,t.set(e,s));const n=i.join();let o=s.get(n);if(!o){o={resolver:ls(e,i),subPrefixes:i.filter(t=>!t.toLowerCase().includes("hover"))},s.set(n,o)}return o}const zo=t=>Se(t)&&Object.getOwnPropertyNames(t).some(e=>Be(t[e]));const jo=["top","bottom","left","right","chartArea"];function Io(t,e){return"top"===t||"bottom"===t||-1===jo.indexOf(t)&&"x"===e}function Ho(t,e){return function(i,s){return i[t]===s[t]?i[e]-s[e]:i[t]-s[t]}}function Fo(t){const e=t.chart,i=e.options.animation;e.notifyPlugins("afterRender"),Ae(i&&i.onComplete,[t],e)}function Bo(t){const e=t.chart,i=e.options.animation;Ae(i&&i.onProgress,[t],e)}function Vo(t){return As()&&"string"==typeof t?t=document.getElementById(t):t&&t.length&&(t=t[0]),t&&t.canvas&&(t=t.canvas),t}const Wo={},No=t=>{const e=Vo(t);return Object.values(Wo).filter(t=>t.canvas===e).pop()};function Uo(t,e,i){const s=Object.keys(t);for(const n of s){const s=+n;if(s>=e){const o=t[n];delete t[n],(i>0||s>e)&&(t[s+i]=o)}}}class qo{static defaults=zi;static instances=Wo;static overrides=Ei;static registry=xo;static version="4.5.1";static getChart=No;static register(...t){xo.add(...t),Yo()}static unregister(...t){xo.remove(...t),Yo()}constructor(t,e){const i=this.config=new Oo(e),s=Vo(t),n=No(s);if(n)throw new Error("Canvas is already in use. Chart with ID '"+n.id+"' must be destroyed before the canvas with ID '"+n.canvas.id+"' can be reused.");const o=i.createResolver(i.chartOptionScopes(),this.getContext());this.platform=new(i.platform||function(t){return!As()||"undefined"!=typeof OffscreenCanvas&&t instanceof OffscreenCanvas?Vn:so}(s)),this.platform.updateConfig(i);const a=this.platform.acquireContext(s,o.aspectRatio),r=a&&a.canvas,l=r&&r.height,c=r&&r.width;this.id=_e(),this.ctx=a,this.canvas=r,this.width=c,this.height=l,this._options=o,this._aspectRatio=this.aspectRatio,this._layers=[],this._metasets=[],this._stacks=void 0,this.boxes=[],this.currentDevicePixelRatio=void 0,this.chartArea=void 0,this._active=[],this._lastEvent=void 0,this._listeners={},this._responsiveListeners=void 0,this._sortedMetasets=[],this.scales={},this._plugins=new yo,this.$proxies={},this._hiddenIndices={},this.attached=!1,this._animationsDisabled=void 0,this.$context=void 0,this._doResize=function(t,e){let i;return function(...s){return e?(clearTimeout(i),i=setTimeout(t,e,s)):t.apply(this,s),e}}(t=>this.update(t),o.resizeDelay||0),this._dataChanges=[],Wo[this.id]=this,a&&r?(sn.listen(this,"complete",Fo),sn.listen(this,"progress",Bo),this._initialize(),this.attached&&this.update()):console.error("Failed to create chart: can't acquire context from the given item")}get aspectRatio(){const{options:{aspectRatio:t,maintainAspectRatio:e},width:i,height:s,_aspectRatio:n}=this;return we(t)?e&&n?n:s?i/s:null:t}get data(){return this.config.data}set data(t){this.config.data=t}get options(){return this._options}set options(t){this.config.options=t}get registry(){return xo}_initialize(){return this.notifyPlugins("beforeInit"),this.options.responsive?this.resize():js(this,this.options.devicePixelRatio),this.bindEvents(),this.notifyPlugins("afterInit"),this}clear(){return Hi(this.canvas,this.ctx),this}stop(){return sn.stop(this),this}resize(t,e){sn.running(this)?this._resizeBeforeDraw={width:t,height:e}:this._resize(t,e)}_resize(t,e){const i=this.options,s=this.canvas,n=i.maintainAspectRatio&&this.aspectRatio,o=this.platform.getMaximumSize(s,t,e,n),a=i.devicePixelRatio||this.platform.getDevicePixelRatio(),r=this.width?"resize":"attach";this.width=o.width,this.height=o.height,this._aspectRatio=this.aspectRatio,js(this,a,!0)&&(this.notifyPlugins("resize",{size:o}),Ae(i.onResize,[this,o],this),this.attached&&this._doResize(r)&&this.render())}ensureScalesHaveIDs(){Te(this.options.scales||{},(t,e)=>{t.id=e})}buildOrUpdateScales(){const t=this.options,e=t.scales,i=this.scales,s=Object.keys(i).reduce((t,e)=>(t[e]=!1,t),{});let n=[];e&&(n=n.concat(Object.keys(e).map(t=>{const i=e[t],s=$o(t,i),n="r"===s,o="x"===s;return{options:i,dposition:n?"chartArea":o?"bottom":"left",dtype:n?"radialLinear":o?"category":"linear"}}))),Te(n,e=>{const n=e.options,o=n.id,a=$o(o,n),r=Ce(n.type,e.dtype);void 0!==n.position&&Io(n.position,a)===Io(e.dposition)||(n.position=e.dposition),s[o]=!0;let l=null;if(o in i&&i[o].type===r)l=i[o];else{l=new(xo.getScale(r))({id:o,type:r,ctx:this.ctx,chart:this}),i[l.id]=l}l.init(n,t)}),Te(s,(t,e)=>{t||delete i[e]}),Te(i,t=>{Fn.configure(this,t,t.options),Fn.addBox(this,t)})}_updateMetasets(){const t=this._metasets,e=this.data.datasets.length,i=t.length;if(t.sort((t,e)=>t.index-e.index),i>e){for(let t=e;t<i;++t)this._destroyDatasetMeta(t);t.splice(e,i-e)}this._sortedMetasets=t.slice(0).sort(Ho("order","index"))}_removeUnreferencedMetasets(){const{_metasets:t,data:{datasets:e}}=this;t.length>e.length&&delete this._stacks,t.forEach((t,i)=>{0===e.filter(e=>e===t._dataset).length&&this._destroyDatasetMeta(i)})}buildOrUpdateControllers(){const t=[],e=this.data.datasets;let i,s;for(this._removeUnreferencedMetasets(),i=0,s=e.length;i<s;i++){const s=e[i];let n=this.getDatasetMeta(i);const o=s.type||this.config.type;if(n.type&&n.type!==o&&(this._destroyDatasetMeta(i),n=this.getDatasetMeta(i)),n.type=o,n.indexAxis=s.indexAxis||wo(o,this.options),n.order=s.order||0,n.index=i,n.label=""+s.label,n.visible=this.isDatasetVisible(i),n.controller)n.controller.updateIndex(i),n.controller.linkScales();else{const e=xo.getController(o),{datasetElementType:s,dataElementType:a}=zi.datasets[o];Object.assign(e,{dataElementType:xo.getElement(a),datasetElementType:s&&xo.getElement(s)}),n.controller=new e(this,i),t.push(n.controller)}}return this._updateMetasets(),t}_resetElements(){Te(this.data.datasets,(t,e)=>{this.getDatasetMeta(e).controller.reset()},this)}reset(){this._resetElements(),this.notifyPlugins("reset")}update(t){const e=this.config;e.update();const i=this._options=e.createResolver(e.chartOptionScopes(),this.getContext()),s=this._animationsDisabled=!i.animation;if(this._updateScales(),this._checkEventBindings(),this._updateHiddenIndices(),this._plugins.invalidate(),!1===this.notifyPlugins("beforeUpdate",{mode:t,cancelable:!0}))return;const n=this.buildOrUpdateControllers();this.notifyPlugins("beforeElementsUpdate");let o=0;for(let t=0,e=this.data.datasets.length;t<e;t++){const{controller:e}=this.getDatasetMeta(t),i=!s&&-1===n.indexOf(e);e.buildOrUpdateElements(i),o=Math.max(+e.getMaxOverflow(),o)}o=this._minPadding=i.layout.autoPadding?o:0,this._updateLayout(o),s||Te(n,t=>{t.reset()}),this._updateDatasets(t),this.notifyPlugins("afterUpdate",{mode:t}),this._layers.sort(Ho("z","_idx"));const{_active:a,_lastEvent:r}=this;r?this._eventHandler(r,!0):a.length&&this._updateHoverStyles(a,a,!0),this.render()}_updateScales(){Te(this.scales,t=>{Fn.removeBox(this,t)}),this.ensureScalesHaveIDs(),this.buildOrUpdateScales()}_checkEventBindings(){const t=this.options,e=new Set(Object.keys(this._listeners)),i=new Set(t.events);Ve(e,i)&&!!this._responsiveListeners===t.responsive||(this.unbindEvents(),this.bindEvents())}_updateHiddenIndices(){const{_hiddenIndices:t}=this,e=this._getUniformDataChanges()||[];for(const{method:i,start:s,count:n}of e){Uo(t,s,"_removeElements"===i?-n:n)}}_getUniformDataChanges(){const t=this._dataChanges;if(!t||!t.length)return;this._dataChanges=[];const e=this.data.datasets.length,i=e=>new Set(t.filter(t=>t[0]===e).map((t,e)=>e+","+t.splice(1).join(","))),s=i(0);for(let t=1;t<e;t++)if(!Ve(s,i(t)))return;return Array.from(s).map(t=>t.split(",")).map(t=>({method:t[1],start:+t[2],count:+t[3]}))}_updateLayout(t){if(!1===this.notifyPlugins("beforeLayout",{cancelable:!0}))return;Fn.update(this,this.width,this.height,t);const e=this.chartArea,i=e.width<=0||e.height<=0;this._layers=[],Te(this.boxes,t=>{i&&"chartArea"===t.position||(t.configure&&t.configure(),this._layers.push(...t._layers()))},this),this._layers.forEach((t,e)=>{t._idx=e}),this.notifyPlugins("afterLayout")}_updateDatasets(t){if(!1!==this.notifyPlugins("beforeDatasetsUpdate",{mode:t,cancelable:!0})){for(let t=0,e=this.data.datasets.length;t<e;++t)this.getDatasetMeta(t).controller.configure();for(let e=0,i=this.data.datasets.length;e<i;++e)this._updateDataset(e,Be(t)?t({datasetIndex:e}):t);this.notifyPlugins("afterDatasetsUpdate",{mode:t})}}_updateDataset(t,e){const i=this.getDatasetMeta(t),s={meta:i,index:t,mode:e,cancelable:!0};!1!==this.notifyPlugins("beforeDatasetUpdate",s)&&(i.controller._update(e),s.cancelable=!1,this.notifyPlugins("afterDatasetUpdate",s))}render(){!1!==this.notifyPlugins("beforeRender",{cancelable:!0})&&(sn.has(this)?this.attached&&!sn.running(this)&&sn.start(this):(this.draw(),Fo({chart:this})))}draw(){let t;if(this._resizeBeforeDraw){const{width:t,height:e}=this._resizeBeforeDraw;this._resizeBeforeDraw=null,this._resize(t,e)}if(this.clear(),this.width<=0||this.height<=0)return;if(!1===this.notifyPlugins("beforeDraw",{cancelable:!0}))return;const e=this._layers;for(t=0;t<e.length&&e[t].z<=0;++t)e[t].draw(this.chartArea);for(this._drawDatasets();t<e.length;++t)e[t].draw(this.chartArea);this.notifyPlugins("afterDraw")}_getSortedDatasetMetas(t){const e=this._sortedMetasets,i=[];let s,n;for(s=0,n=e.length;s<n;++s){const n=e[s];t&&!n.visible||i.push(n)}return i}getSortedVisibleDatasetMetas(){return this._getSortedDatasetMetas(!0)}_drawDatasets(){if(!1===this.notifyPlugins("beforeDatasetsDraw",{cancelable:!0}))return;const t=this.getSortedVisibleDatasetMetas();for(let e=t.length-1;e>=0;--e)this._drawDataset(t[e]);this.notifyPlugins("afterDatasetsDraw")}_drawDataset(t){const e=this.ctx,i={meta:t,index:t.index,cancelable:!0},s=tn(this,t);!1!==this.notifyPlugins("beforeDatasetDraw",i)&&(s&&Wi(e,s),t.controller.draw(),s&&Ni(e),i.cancelable=!1,this.notifyPlugins("afterDatasetDraw",i))}isPointInArea(t){return Vi(t,this.chartArea,this._minPadding)}getElementsAtEventForMode(t,e,i,s){const n=Cn.modes[e];return"function"==typeof n?n(this,t,i,s):[]}getDatasetMeta(t){const e=this.data.datasets[t],i=this._metasets;let s=i.filter(t=>t&&t._dataset===e).pop();return s||(s={type:null,data:[],dataset:null,controller:null,hidden:null,xAxisID:null,yAxisID:null,order:e&&e.order||0,index:t,_dataset:e,_parsed:[],_sorted:!1},i.push(s)),s}getContext(){return this.$context||(this.$context=rs(null,{chart:this,type:"chart"}))}getVisibleDatasetCount(){return this.getSortedVisibleDatasetMetas().length}isDatasetVisible(t){const e=this.data.datasets[t];if(!e)return!1;const i=this.getDatasetMeta(t);return"boolean"==typeof i.hidden?!i.hidden:!e.hidden}setDatasetVisibility(t,e){this.getDatasetMeta(t).hidden=!e}toggleDataVisibility(t){this._hiddenIndices[t]=!this._hiddenIndices[t]}getDataVisibility(t){return!this._hiddenIndices[t]}_updateVisibility(t,e,i){const s=i?"show":"hide",n=this.getDatasetMeta(t),o=n.controller._resolveAnimations(void 0,s);Fe(e)?(n.data[e].hidden=!i,this.update()):(this.setDatasetVisibility(t,i),o.update(n,{visible:i}),this.update(e=>e.datasetIndex===t?s:void 0))}hide(t,e){this._updateVisibility(t,e,!1)}show(t,e){this._updateVisibility(t,e,!0)}_destroyDatasetMeta(t){const e=this._metasets[t];e&&e.controller&&e.controller._destroy(),delete this._metasets[t]}_stop(){let t,e;for(this.stop(),sn.remove(this),t=0,e=this.data.datasets.length;t<e;++t)this._destroyDatasetMeta(t)}destroy(){this.notifyPlugins("beforeDestroy");const{canvas:t,ctx:e}=this;this._stop(),this.config.clearCache(),t&&(this.unbindEvents(),Hi(t,e),this.platform.releaseContext(e),this.canvas=null,this.ctx=null),delete Wo[this.id],this.notifyPlugins("afterDestroy")}toBase64Image(...t){return this.canvas.toDataURL(...t)}bindEvents(){this.bindUserEvents(),this.options.responsive?this.bindResponsiveEvents():this.attached=!0}bindUserEvents(){const t=this._listeners,e=this.platform,i=(i,s)=>{e.addEventListener(this,i,s),t[i]=s},s=(t,e,i)=>{t.offsetX=e,t.offsetY=i,this._eventHandler(t)};Te(this.options.events,t=>i(t,s))}bindResponsiveEvents(){this._responsiveListeners||(this._responsiveListeners={});const t=this._responsiveListeners,e=this.platform,i=(i,s)=>{e.addEventListener(this,i,s),t[i]=s},s=(i,s)=>{t[i]&&(e.removeEventListener(this,i,s),delete t[i])},n=(t,e)=>{this.canvas&&this.resize(t,e)};let o;const a=()=>{s("attach",a),this.attached=!0,this.resize(),i("resize",n),i("detach",o)};o=()=>{this.attached=!1,s("resize",n),this._stop(),this._resize(0,0),i("attach",a)},e.isAttached(this.canvas)?a():o()}unbindEvents(){Te(this._listeners,(t,e)=>{this.platform.removeEventListener(this,e,t)}),this._listeners={},Te(this._responsiveListeners,(t,e)=>{this.platform.removeEventListener(this,e,t)}),this._responsiveListeners=void 0}updateHoverStyle(t,e,i){const s=i?"set":"remove";let n,o,a,r;for("dataset"===e&&(n=this.getDatasetMeta(t[0].datasetIndex),n.controller["_"+s+"DatasetHoverStyle"]()),a=0,r=t.length;a<r;++a){o=t[a];const e=o&&this.getDatasetMeta(o.datasetIndex).controller;e&&e[s+"HoverStyle"](o.element,o.datasetIndex,o.index)}}getActiveElements(){return this._active||[]}setActiveElements(t){const e=this._active||[],i=t.map(({datasetIndex:t,index:e})=>{const i=this.getDatasetMeta(t);if(!i)throw new Error("No dataset found at index "+t);return{datasetIndex:t,element:i.data[e],index:e}});!De(i,e)&&(this._active=i,this._lastEvent=null,this._updateHoverStyles(i,e))}notifyPlugins(t,e,i){return this._plugins.notify(this,t,e,i)}isPluginEnabled(t){return 1===this._plugins._cache.filter(e=>e.plugin.id===t).length}_updateHoverStyles(t,e,i){const s=this.options.hover,n=(t,e)=>t.filter(t=>!e.some(e=>t.datasetIndex===e.datasetIndex&&t.index===e.index)),o=n(e,t),a=i?t:n(t,e);o.length&&this.updateHoverStyle(o,s.mode,!1),a.length&&s.mode&&this.updateHoverStyle(a,s.mode,!0)}_eventHandler(t,e){const i={event:t,replay:e,cancelable:!0,inChartArea:this.isPointInArea(t)},s=e=>(e.options.events||this.options.events).includes(t.native.type);if(!1===this.notifyPlugins("beforeEvent",i,s))return;const n=this._handleEvent(t,e,i.inChartArea);return i.cancelable=!1,this.notifyPlugins("afterEvent",i,s),(n||i.changed)&&this.render(),this}_handleEvent(t,e,i){const{_active:s=[],options:n}=this,o=e,a=this._getActiveElements(t,s,i,o),r=function(t){return"mouseup"===t.type||"click"===t.type||"contextmenu"===t.type}(t),l=function(t,e,i,s){return i&&"mouseout"!==t.type?s?e:t:null}(t,this._lastEvent,i,r);i&&(this._lastEvent=null,Ae(n.onHover,[t,a,this],this),r&&Ae(n.onClick,[t,a,this],this));const c=!De(a,s);return(c||e)&&(this._active=a,this._updateHoverStyles(a,s,e)),this._lastEvent=l,c}_getActiveElements(t,e,i,s){if("mouseout"===t.type)return[];if(!i)return e;const n=this.options.hover;return this.getElementsAtEventForMode(t,n.mode,n,s)}}function Yo(){return Te(qo.instances,t=>t._plugins.invalidate())}function Xo(t,e,i=e){t.lineCap=Ce(i.borderCapStyle,e.borderCapStyle),t.setLineDash(Ce(i.borderDash,e.borderDash)),t.lineDashOffset=Ce(i.borderDashOffset,e.borderDashOffset),t.lineJoin=Ce(i.borderJoinStyle,e.borderJoinStyle),t.lineWidth=Ce(i.borderWidth,e.borderWidth),t.strokeStyle=Ce(i.borderColor,e.borderColor)}function Ko(t,e,i){t.lineTo(i.x,i.y)}function Go(t,e,i={}){const s=t.length,{start:n=0,end:o=s-1}=i,{start:a,end:r}=e,l=Math.max(n,a),c=Math.min(o,r),h=n<a&&o<a||n>r&&o>r;return{count:s,start:l,loop:e.loop,ilen:c<l&&!h?s+c-l:c-l}}function Jo(t,e,i,s){const{points:n,options:o}=e,{count:a,start:r,loop:l,ilen:c}=Go(n,i,s),h=function(t){return t.stepped?Ui:t.tension||"monotone"===t.cubicInterpolationMode?qi:Ko}(o);let d,p,u,{move:g=!0,reverse:f}=s||{};for(d=0;d<=c;++d)p=n[(r+(f?c-d:d))%a],p.skip||(g?(t.moveTo(p.x,p.y),g=!1):h(t,u,p,f,o.stepped),u=p);return l&&(p=n[(r+(f?c:0))%a],h(t,u,p,f,o.stepped)),!!l}function Zo(t,e,i,s){const n=e.points,{count:o,start:a,ilen:r}=Go(n,i,s),{move:l=!0,reverse:c}=s||{};let h,d,p,u,g,f,m=0,b=0;const x=t=>(a+(c?r-t:t))%o,y=()=>{u!==g&&(t.lineTo(m,g),t.lineTo(m,u),t.lineTo(m,f))};for(l&&(d=n[x(0)],t.moveTo(d.x,d.y)),h=0;h<=r;++h){if(d=n[x(h)],d.skip)continue;const e=d.x,i=d.y,s=0|e;s===p?(i<u?u=i:i>g&&(g=i),m=(b*m+e)/++b):(y(),t.lineTo(e,i),p=s,b=0,u=g=i),f=i}y()}function Qo(t){const e=t.options,i=e.borderDash&&e.borderDash.length;return!(t._decimated||t._loop||e.tension||"monotone"===e.cubicInterpolationMode||e.stepped||i)?Zo:Jo}const ta="function"==typeof Path2D;function ea(t,e,i,s){ta&&!e.options.segment?function(t,e,i,s){let n=e._path;n||(n=e._path=new Path2D,e.path(n,i,s)&&n.closePath()),Xo(t,e.options),t.stroke(n)}(t,e,i,s):function(t,e,i,s){const{segments:n,options:o}=e,a=Qo(e);for(const r of n)Xo(t,o,r.style),t.beginPath(),a(t,e,r,{start:i,end:i+s-1})&&t.closePath(),t.stroke()}(t,e,i,s)}class ia extends no{static id="line";static defaults={borderCapStyle:"butt",borderDash:[],borderDashOffset:0,borderJoinStyle:"miter",borderWidth:3,capBezierPoints:!0,cubicInterpolationMode:"default",fill:!1,spanGaps:!1,stepped:!1,tension:0};static defaultRoutes={backgroundColor:"backgroundColor",borderColor:"borderColor"};static descriptors={_scriptable:!0,_indexable:t=>"borderDash"!==t&&"fill"!==t};constructor(t){super(),this.animated=!0,this.options=void 0,this._chart=void 0,this._loop=void 0,this._fullLoop=void 0,this._path=void 0,this._points=void 0,this._segments=void 0,this._decimated=!1,this._pointsUpdated=!1,this._datasetIndex=void 0,t&&Object.assign(this,t)}updateControlPoints(t,e){const i=this.options;if((i.tension||"monotone"===i.cubicInterpolationMode)&&!i.stepped&&!this._pointsUpdated){const s=i.spanGaps?this._loop:this._fullLoop;Cs(this._points,i,t,s,e),this._pointsUpdated=!0}}set points(t){this._points=t,delete this._segments,delete this._path,this._pointsUpdated=!1}get points(){return this._points}get segments(){return this._segments||(this._segments=function(t,e){const i=t.points,s=t.options.spanGaps,n=i.length;if(!n)return[];const o=!!t._loop,{start:a,end:r}=function(t,e,i,s){let n=0,o=e-1;if(i&&!s)for(;n<e&&!t[n].skip;)n++;for(;n<e&&t[n].skip;)n++;for(n%=e,i&&(o+=n);o>n&&t[o%e].skip;)o--;return o%=e,{start:n,end:o}}(i,n,o,s);return Gs(t,!0===s?[{start:a,end:r,loop:o}]:function(t,e,i,s){const n=t.length,o=[];let a,r=e,l=t[e];for(a=e+1;a<=i;++a){const i=t[a%n];i.skip||i.stop?l.skip||(s=!1,o.push({start:e%n,end:(a-1)%n,loop:s}),e=r=i.stop?a:null):(r=a,l.skip&&(e=a)),l=i}return null!==r&&o.push({start:e%n,end:r%n,loop:s}),o}(i,a,r<a?r+n:r,!!t._fullLoop&&0===a&&r===n-1),i,e)}(this,this.options.segment))}first(){const t=this.segments,e=this.points;return t.length&&e[t[0].start]}last(){const t=this.segments,e=this.points,i=t.length;return i&&e[t[i-1].end]}interpolate(t,e){const i=this.options,s=t[e],n=this.points,o=Ks(this,{property:e,start:s,end:s});if(!o.length)return;const a=[],r=function(t){return t.stepped?Bs:t.tension||"monotone"===t.cubicInterpolationMode?Vs:Fs}(i);let l,c;for(l=0,c=o.length;l<c;++l){const{start:c,end:h}=o[l],d=n[c],p=n[h];if(d===p){a.push(d);continue}const u=r(d,p,Math.abs((s-d[e])/(p[e]-d[e])),i.stepped);u[e]=t[e],a.push(u)}return 1===a.length?a[0]:a}pathSegment(t,e,i){return Qo(this)(t,this,e,i)}path(t,e,i){const s=this.segments,n=Qo(this);let o=this._loop;e=e||0,i=i||this.points.length-e;for(const a of s)o&=n(t,this,a,{start:e,end:e+i-1});return!!o}draw(t,e,i,s){const n=this.options||{};(this.points||[]).length&&n.borderWidth&&(t.save(),ea(t,this,i,s),t.restore()),this.animated&&(this._pointsUpdated=!1,this._path=void 0)}}function sa(t,e,i,s){const n=t.options,{[i]:o}=t.getProps([i],s);return Math.abs(e-o)<n.radius+n.hitRadius}function na(t,e,i,s){if(s)return;let n=e[t],o=i[t];return"angle"===t&&(n=ai(n),o=ai(o)),{property:t,start:n,end:o}}function oa(t,e,i){for(;e>t;e--){const t=i[e];if(!isNaN(t.x)&&!isNaN(t.y))break}return e}function aa(t,e,i,s){return t&&e?s(t[i],e[i]):t?t[i]:e?e[i]:0}function ra(t,e){let i=[],s=!1;return ke(t)?(s=!0,i=t):i=function(t,e){const{x:i=null,y:s=null}=t||{},n=e.points,o=[];return e.segments.forEach(({start:t,end:e})=>{e=oa(t,e,n);const a=n[t],r=n[e];null!==s?(o.push({x:a.x,y:s}),o.push({x:r.x,y:s})):null!==i&&(o.push({x:i,y:a.y}),o.push({x:i,y:r.y}))}),o}(t,e),i.length?new ia({points:i,options:{tension:0},_loop:s,_fullLoop:s}):null}function la(t){return t&&!1!==t.fill}function ca(t,e,i){let s=t[e].fill;const n=[e];let o;if(!i)return s;for(;!1!==s&&-1===n.indexOf(s);){if(!$e(s))return s;if(o=t[s],!o)return!1;if(o.visible)return s;n.push(s),s=o.fill}return!1}function ha(t,e,i){const s=function(t){const e=t.options,i=e.fill;let s=Ce(i&&i.target,i);void 0===s&&(s=!!e.backgroundColor);if(!1===s||null===s)return!1;if(!0===s)return"origin";return s}(t);if(Se(s))return!isNaN(s.value)&&s;let n=parseFloat(s);return $e(n)&&Math.floor(n)===n?function(t,e,i,s){"-"!==t&&"+"!==t||(i=e+i);if(i===e||i<0||i>=s)return!1;return i}(s[0],e,n,i):["origin","start","end","stack","shape"].indexOf(s)>=0&&s}function da(t,e,i){const s=[];for(let n=0;n<i.length;n++){const o=i[n],{first:a,last:r,point:l}=pa(o,e,"x");if(!(!l||a&&r))if(a)s.unshift(l);else if(t.push(l),!r)break}t.push(...s)}function pa(t,e,i){const s=t.interpolate(e,i);if(!s)return{};const n=s[i],o=t.segments,a=t.points;let r=!1,l=!1;for(let t=0;t<o.length;t++){const e=o[t],s=a[e.start][i],c=a[e.end][i];if(ci(n,s,c)){r=n===s,l=n===c;break}}return{first:r,last:l,point:s}}class ua{constructor(t){this.x=t.x,this.y=t.y,this.radius=t.radius}pathSegment(t,e,i){const{x:s,y:n,radius:o}=this;return e=e||{start:0,end:Ne},t.arc(s,n,o,e.end,e.start,!0),!i.bounds}interpolate(t){const{x:e,y:i,radius:s}=this,n=t.angle;return{x:e+Math.cos(n)*s,y:i+Math.sin(n)*s,angle:n}}}function ga(t){const{chart:e,fill:i,line:s}=t;if($e(i))return function(t,e){const i=t.getDatasetMeta(e),s=i&&t.isDatasetVisible(e);return s?i.dataset:null}(e,i);if("stack"===i)return function(t){const{scale:e,index:i,line:s}=t,n=[],o=s.segments,a=s.points,r=function(t,e){const i=[],s=t.getMatchingVisibleMetas("line");for(let t=0;t<s.length;t++){const n=s[t];if(n.index===e)break;n.hidden||i.unshift(n.dataset)}return i}(e,i);r.push(ra({x:null,y:e.bottom},s));for(let t=0;t<o.length;t++){const e=o[t];for(let t=e.start;t<=e.end;t++)da(n,a[t],r)}return new ia({points:n,options:{}})}(t);if("shape"===i)return!0;const n=function(t){const e=t.scale||{};if(e.getPointPositionForValue)return function(t){const{scale:e,fill:i}=t,s=e.options,n=e.getLabels().length,o=s.reverse?e.max:e.min,a=function(t,e,i){let s;return s="start"===t?i:"end"===t?e.options.reverse?e.min:e.max:Se(t)?t.value:e.getBaseValue(),s}(i,e,o),r=[];if(s.grid.circular){const t=e.getPointPositionForValue(0,o);return new ua({x:t.x,y:t.y,radius:e.getDistanceFromCenterForValue(a)})}for(let t=0;t<n;++t)r.push(e.getPointPositionForValue(t,a));return r}(t);return function(t){const{scale:e={},fill:i}=t,s=function(t,e){let i=null;return"start"===t?i=e.bottom:"end"===t?i=e.top:Se(t)?i=e.getPixelForValue(t.value):e.getBasePixel&&(i=e.getBasePixel()),i}(i,e);if($e(s)){const t=e.isHorizontal();return{x:t?s:null,y:t?null:s}}return null}(t)}(t);return n instanceof ua?n:ra(n,s)}function fa(t,e,i){const s=ga(e),{chart:n,index:o,line:a,scale:r,axis:l}=e,c=a.options,h=c.fill,d=c.backgroundColor,{above:p=d,below:u=d}=h||{},g=n.getDatasetMeta(o),f=tn(n,g);s&&a.points.length&&(Wi(t,i),function(t,e){const{line:i,target:s,above:n,below:o,area:a,scale:r,clip:l}=e,c=i._loop?"angle":e.axis;t.save();let h=o;o!==n&&("x"===c?(ma(t,s,a.top),xa(t,{line:i,target:s,color:n,scale:r,property:c,clip:l}),t.restore(),t.save(),ma(t,s,a.bottom)):"y"===c&&(ba(t,s,a.left),xa(t,{line:i,target:s,color:o,scale:r,property:c,clip:l}),t.restore(),t.save(),ba(t,s,a.right),h=n));xa(t,{line:i,target:s,color:h,scale:r,property:c,clip:l}),t.restore()}(t,{line:a,target:s,above:p,below:u,area:i,scale:r,axis:l,clip:f}),Ni(t))}function ma(t,e,i){const{segments:s,points:n}=e;let o=!0,a=!1;t.beginPath();for(const r of s){const{start:s,end:l}=r,c=n[s],h=n[oa(s,l,n)];o?(t.moveTo(c.x,c.y),o=!1):(t.lineTo(c.x,i),t.lineTo(c.x,c.y)),a=!!e.pathSegment(t,r,{move:a}),a?t.closePath():t.lineTo(h.x,i)}t.lineTo(e.first().x,i),t.closePath(),t.clip()}function ba(t,e,i){const{segments:s,points:n}=e;let o=!0,a=!1;t.beginPath();for(const r of s){const{start:s,end:l}=r,c=n[s],h=n[oa(s,l,n)];o?(t.moveTo(c.x,c.y),o=!1):(t.lineTo(i,c.y),t.lineTo(c.x,c.y)),a=!!e.pathSegment(t,r,{move:a}),a?t.closePath():t.lineTo(i,h.y)}t.lineTo(i,e.first().y),t.closePath(),t.clip()}function xa(t,e){const{line:i,target:s,property:n,color:o,scale:a,clip:r}=e,l=function(t,e,i){const s=t.segments,n=t.points,o=e.points,a=[];for(const t of s){let{start:s,end:r}=t;r=oa(s,r,n);const l=na(i,n[s],n[r],t.loop);if(!e.segments){a.push({source:t,target:l,start:n[s],end:n[r]});continue}const c=Ks(e,l);for(const e of c){const s=na(i,o[e.start],o[e.end],e.loop),r=Xs(t,n,s);for(const t of r)a.push({source:t,target:e,start:{[i]:aa(l,s,"start",Math.max)},end:{[i]:aa(l,s,"end",Math.min)}})}}return a}(i,s,n);for(const{source:e,target:c,start:h,end:d}of l){const{style:{backgroundColor:l=o}={}}=e,p=!0!==s;t.save(),t.fillStyle=l,ya(t,a,r,p&&na(n,h,d)),t.beginPath();const u=!!i.pathSegment(t,e);let g;if(p){u?t.closePath():va(t,s,d,n);const e=!!s.pathSegment(t,c,{move:u,reverse:!0});g=u&&e,g||va(t,s,h,n)}t.closePath(),t.fill(g?"evenodd":"nonzero"),t.restore()}}function ya(t,e,i,s){const n=e.chart.chartArea,{property:o,start:a,end:r}=s||{};if("x"===o||"y"===o){let e,s,l,c;"x"===o?(e=a,s=n.top,l=r,c=n.bottom):(e=n.left,s=a,l=n.right,c=r),t.beginPath(),i&&(e=Math.max(e,i.left),l=Math.min(l,i.right),s=Math.max(s,i.top),c=Math.min(c,i.bottom)),t.rect(e,s,l-e,c-s),t.clip()}}function va(t,e,i,s){const n=e.interpolate(i,s);n&&t.lineTo(n.x,n.y)}var _a={id:"filler",afterDatasetsUpdate(t,e,i){const s=(t.data.datasets||[]).length,n=[];let o,a,r,l;for(a=0;a<s;++a)o=t.getDatasetMeta(a),r=o.dataset,l=null,r&&r.options&&r instanceof ia&&(l={visible:t.isDatasetVisible(a),index:a,fill:ha(r,a,s),chart:t,axis:o.controller.options.indexAxis,scale:o.vScale,line:r}),o.$filler=l,n.push(l);for(a=0;a<s;++a)l=n[a],l&&!1!==l.fill&&(l.fill=ca(n,a,i.propagate))},beforeDraw(t,e,i){const s="beforeDraw"===i.drawTime,n=t.getSortedVisibleDatasetMetas(),o=t.chartArea;for(let e=n.length-1;e>=0;--e){const i=n[e].$filler;i&&(i.line.updateControlPoints(o,i.axis),s&&i.fill&&fa(t.ctx,i,o))}},beforeDatasetsDraw(t,e,i){if("beforeDatasetsDraw"!==i.drawTime)return;const s=t.getSortedVisibleDatasetMetas();for(let e=s.length-1;e>=0;--e){const i=s[e].$filler;la(i)&&fa(t.ctx,i,t.chartArea)}},beforeDatasetDraw(t,e,i){const s=e.meta.$filler;la(s)&&"beforeDatasetDraw"===i.drawTime&&fa(t.ctx,s,t.chartArea)},defaults:{propagate:!0,drawTime:"beforeDatasetDraw"}};const wa=(t,e)=>{let{boxHeight:i=e,boxWidth:s=e}=t;return t.usePointStyle&&(i=Math.min(i,e),s=t.pointStyleWidth||Math.min(s,e)),{boxWidth:s,boxHeight:i,itemHeight:Math.max(e,i)}};class ka extends no{constructor(t){super(),this._added=!1,this.legendHitBoxes=[],this._hoveredItem=null,this.doughnutMode=!1,this.chart=t.chart,this.options=t.options,this.ctx=t.ctx,this.legendItems=void 0,this.columnSizes=void 0,this.lineWidths=void 0,this.maxHeight=void 0,this.maxWidth=void 0,this.top=void 0,this.bottom=void 0,this.left=void 0,this.right=void 0,this.height=void 0,this.width=void 0,this._margins=void 0,this.position=void 0,this.weight=void 0,this.fullSize=void 0}update(t,e,i){this.maxWidth=t,this.maxHeight=e,this._margins=i,this.setDimensions(),this.buildLabels(),this.fit()}setDimensions(){this.isHorizontal()?(this.width=this.maxWidth,this.left=this._margins.left,this.right=this.width):(this.height=this.maxHeight,this.top=this._margins.top,this.bottom=this.height)}buildLabels(){const t=this.options.labels||{};let e=Ae(t.generateLabels,[this.chart],this)||[];t.filter&&(e=e.filter(e=>t.filter(e,this.chart.data))),t.sort&&(e=e.sort((e,i)=>t.sort(e,i,this.chart.data))),this.options.reverse&&e.reverse(),this.legendItems=e}fit(){const{options:t,ctx:e}=this;if(!t.display)return void(this.width=this.height=0);const i=t.labels,s=ns(i.font),n=s.size,o=this._computeTitleHeight(),{boxWidth:a,itemHeight:r}=wa(i,n);let l,c;e.font=s.string,this.isHorizontal()?(l=this.maxWidth,c=this._fitRows(o,n,a,r)+10):(c=this.maxHeight,l=this._fitCols(o,s,a,r)+10),this.width=Math.min(l,t.maxWidth||this.maxWidth),this.height=Math.min(c,t.maxHeight||this.maxHeight)}_fitRows(t,e,i,s){const{ctx:n,maxWidth:o,options:{labels:{padding:a}}}=this,r=this.legendHitBoxes=[],l=this.lineWidths=[0],c=s+a;let h=t;n.textAlign="left",n.textBaseline="middle";let d=-1,p=-c;return this.legendItems.forEach((t,u)=>{const g=i+e/2+n.measureText(t.text).width;(0===u||l[l.length-1]+g+2*a>o)&&(h+=c,l[l.length-(u>0?0:1)]=0,p+=c,d++),r[u]={left:0,top:p,row:d,width:g,height:s},l[l.length-1]+=g+a}),h}_fitCols(t,e,i,s){const{ctx:n,maxHeight:o,options:{labels:{padding:a}}}=this,r=this.legendHitBoxes=[],l=this.columnSizes=[],c=o-t;let h=a,d=0,p=0,u=0,g=0;return this.legendItems.forEach((t,o)=>{const{itemWidth:f,itemHeight:m}=function(t,e,i,s,n){const o=function(t,e,i,s){let n=t.text;n&&"string"!=typeof n&&(n=n.reduce((t,e)=>t.length>e.length?t:e));return e+i.size/2+s.measureText(n).width}(s,t,e,i),a=function(t,e,i){let s=t;"string"!=typeof e.text&&(s=Sa(e,i));return s}(n,s,e.lineHeight);return{itemWidth:o,itemHeight:a}}(i,e,n,t,s);o>0&&p+m+2*a>c&&(h+=d+a,l.push({width:d,height:p}),u+=d+a,g++,d=p=0),r[o]={left:u,top:p,col:g,width:f,height:m},d=Math.max(d,f),p+=m+a}),h+=d,l.push({width:d,height:p}),h}adjustHitBoxes(){if(!this.options.display)return;const t=this._computeTitleHeight(),{legendHitBoxes:e,options:{align:i,labels:{padding:s},rtl:n}}=this,o=Ws(n,this.left,this.width);if(this.isHorizontal()){let n=0,a=xi(i,this.left+s,this.right-this.lineWidths[n]);for(const r of e)n!==r.row&&(n=r.row,a=xi(i,this.left+s,this.right-this.lineWidths[n])),r.top+=this.top+t+s,r.left=o.leftForLtr(o.x(a),r.width),a+=r.width+s}else{let n=0,a=xi(i,this.top+t+s,this.bottom-this.columnSizes[n].height);for(const r of e)r.col!==n&&(n=r.col,a=xi(i,this.top+t+s,this.bottom-this.columnSizes[n].height)),r.top=a,r.left+=this.left+s,r.left=o.leftForLtr(o.x(r.left),r.width),a+=r.height+s}}isHorizontal(){return"top"===this.options.position||"bottom"===this.options.position}draw(){if(this.options.display){const t=this.ctx;Wi(t,this),this._draw(),Ni(t)}}_draw(){const{options:t,columnSizes:e,lineWidths:i,ctx:s}=this,{align:n,labels:o}=t,a=zi.color,r=Ws(t.rtl,this.left,this.width),l=ns(o.font),{padding:c}=o,h=l.size,d=h/2;let p;this.drawTitle(),s.textAlign=r.textAlign("left"),s.textBaseline="middle",s.lineWidth=.5,s.font=l.string;const{boxWidth:u,boxHeight:g,itemHeight:f}=wa(o,h),m=this.isHorizontal(),b=this._computeTitleHeight();p=m?{x:xi(n,this.left+c,this.right-i[0]),y:this.top+c+b,line:0}:{x:this.left+c,y:xi(n,this.top+b+c,this.bottom-e[0].height),line:0},Ns(this.ctx,t.textDirection);const x=f+c;this.legendItems.forEach((y,v)=>{s.strokeStyle=y.fontColor,s.fillStyle=y.fontColor;const _=s.measureText(y.text).width,w=r.textAlign(y.textAlign||(y.textAlign=o.textAlign)),k=u+d+_;let S=p.x,$=p.y;r.setWidth(this.width),m?v>0&&S+k+c>this.right&&($=p.y+=x,p.line++,S=p.x=xi(n,this.left+c,this.right-i[p.line])):v>0&&$+x>this.bottom&&(S=p.x=S+e[p.line].width+c,p.line++,$=p.y=xi(n,this.top+b+c,this.bottom-e[p.line].height));if(function(t,e,i){if(isNaN(u)||u<=0||isNaN(g)||g<0)return;s.save();const n=Ce(i.lineWidth,1);if(s.fillStyle=Ce(i.fillStyle,a),s.lineCap=Ce(i.lineCap,"butt"),s.lineDashOffset=Ce(i.lineDashOffset,0),s.lineJoin=Ce(i.lineJoin,"miter"),s.lineWidth=n,s.strokeStyle=Ce(i.strokeStyle,a),s.setLineDash(Ce(i.lineDash,[])),o.usePointStyle){const a={radius:g*Math.SQRT2/2,pointStyle:i.pointStyle,rotation:i.rotation,borderWidth:n},l=r.xPlus(t,u/2);Bi(s,a,l,e+d,o.pointStyleWidth&&u)}else{const o=e+Math.max((h-g)/2,0),a=r.leftForLtr(t,u),l=is(i.borderRadius);s.beginPath(),Object.values(l).some(t=>0!==t)?Gi(s,{x:a,y:o,w:u,h:g,radius:l}):s.rect(a,o,u,g),s.fill(),0!==n&&s.stroke()}s.restore()}(r.x(S),$,y),S=((t,e,i,s)=>t===(s?"left":"right")?i:"center"===t?(e+i)/2:e)(w,S+u+d,m?S+k:this.right,t.rtl),function(t,e,i){Ki(s,i.text,t,e+f/2,l,{strikethrough:i.hidden,textAlign:r.textAlign(i.textAlign)})}(r.x(S),$,y),m)p.x+=k+c;else if("string"!=typeof y.text){const t=l.lineHeight;p.y+=Sa(y,t)+c}else p.y+=x}),Us(this.ctx,t.textDirection)}drawTitle(){const t=this.options,e=t.title,i=ns(e.font),s=ss(e.padding);if(!e.display)return;const n=Ws(t.rtl,this.left,this.width),o=this.ctx,a=e.position,r=i.size/2,l=s.top+r;let c,h=this.left,d=this.width;if(this.isHorizontal())d=Math.max(...this.lineWidths),c=this.top+l,h=xi(t.align,h,this.right-d);else{const e=this.columnSizes.reduce((t,e)=>Math.max(t,e.height),0);c=l+xi(t.align,this.top,this.bottom-e-t.labels.padding-this._computeTitleHeight())}const p=xi(a,h,h+d);o.textAlign=n.textAlign(bi(a)),o.textBaseline="middle",o.strokeStyle=e.color,o.fillStyle=e.color,o.font=i.string,Ki(o,e.text,p,c,i)}_computeTitleHeight(){const t=this.options.title,e=ns(t.font),i=ss(t.padding);return t.display?e.lineHeight+i.height:0}_getLegendItemAt(t,e){let i,s,n;if(ci(t,this.left,this.right)&&ci(e,this.top,this.bottom))for(n=this.legendHitBoxes,i=0;i<n.length;++i)if(s=n[i],ci(t,s.left,s.left+s.width)&&ci(e,s.top,s.top+s.height))return this.legendItems[i];return null}handleEvent(t){const e=this.options;if(!function(t,e){if(("mousemove"===t||"mouseout"===t)&&(e.onHover||e.onLeave))return!0;if(e.onClick&&("click"===t||"mouseup"===t))return!0;return!1}(t.type,e))return;const i=this._getLegendItemAt(t.x,t.y);if("mousemove"===t.type||"mouseout"===t.type){const s=this._hoveredItem,n=((t,e)=>null!==t&&null!==e&&t.datasetIndex===e.datasetIndex&&t.index===e.index)(s,i);s&&!n&&Ae(e.onLeave,[t,s,this],this),this._hoveredItem=i,i&&!n&&Ae(e.onHover,[t,i,this],this)}else i&&Ae(e.onClick,[t,i,this],this)}}function Sa(t,e){return e*(t.text?t.text.length:0)}var $a={id:"legend",_element:ka,start(t,e,i){const s=t.legend=new ka({ctx:t.ctx,options:i,chart:t});Fn.configure(t,s,i),Fn.addBox(t,s)},stop(t){Fn.removeBox(t,t.legend),delete t.legend},beforeUpdate(t,e,i){const s=t.legend;Fn.configure(t,s,i),s.options=i},afterUpdate(t){const e=t.legend;e.buildLabels(),e.adjustHitBoxes()},afterEvent(t,e){e.replay||t.legend.handleEvent(e.event)},defaults:{display:!0,position:"top",align:"center",fullSize:!0,reverse:!1,weight:1e3,onClick(t,e,i){const s=e.datasetIndex,n=i.chart;n.isDatasetVisible(s)?(n.hide(s),e.hidden=!0):(n.show(s),e.hidden=!1)},onHover:null,onLeave:null,labels:{color:t=>t.chart.options.color,boxWidth:40,padding:10,generateLabels(t){const e=t.data.datasets,{labels:{usePointStyle:i,pointStyle:s,textAlign:n,color:o,useBorderRadius:a,borderRadius:r}}=t.legend.options;return t._getSortedDatasetMetas().map(t=>{const l=t.controller.getStyle(i?0:void 0),c=ss(l.borderWidth);return{text:e[t.index].label,fillStyle:l.backgroundColor,fontColor:o,hidden:!t.visible,lineCap:l.borderCapStyle,lineDash:l.borderDash,lineDashOffset:l.borderDashOffset,lineJoin:l.borderJoinStyle,lineWidth:(c.width+c.height)/4,strokeStyle:l.borderColor,pointStyle:s||l.pointStyle,rotation:l.rotation,textAlign:n||l.textAlign,borderRadius:a&&(r||l.borderRadius),datasetIndex:t.index}},this)}},title:{color:t=>t.chart.options.color,display:!1,position:"center",text:""}},descriptors:{_scriptable:t=>!t.startsWith("on"),labels:{_scriptable:t=>!["generateLabels","filter","sort"].includes(t)}}};const Ma={average(t){if(!t.length)return!1;let e,i,s=new Set,n=0,o=0;for(e=0,i=t.length;e<i;++e){const i=t[e].element;if(i&&i.hasValue()){const t=i.tooltipPosition();s.add(t.x),n+=t.y,++o}}if(0===o||0===s.size)return!1;const a=[...s].reduce((t,e)=>t+e)/s.size;return{x:a,y:n/o}},nearest(t,e){if(!t.length)return!1;let i,s,n,o=e.x,a=e.y,r=Number.POSITIVE_INFINITY;for(i=0,s=t.length;i<s;++i){const s=t[i].element;if(s&&s.hasValue()){const t=ni(e,s.getCenterPoint());t<r&&(r=t,n=s)}}if(n){const t=n.tooltipPosition();o=t.x,a=t.y}return{x:o,y:a}}};function Ca(t,e){return e&&(ke(e)?Array.prototype.push.apply(t,e):t.push(e)),t}function Aa(t){return("string"==typeof t||t instanceof String)&&t.indexOf("\n")>-1?t.split("\n"):t}function Ta(t,e){const{element:i,datasetIndex:s,index:n}=e,o=t.getDatasetMeta(s).controller,{label:a,value:r}=o.getLabelAndValue(n);return{chart:t,label:a,parsed:o.getParsed(n),raw:t.data.datasets[s].data[n],formattedValue:r,dataset:o.getDataset(),dataIndex:n,datasetIndex:s,element:i}}function Da(t,e){const i=t.chart.ctx,{body:s,footer:n,title:o}=t,{boxWidth:a,boxHeight:r}=e,l=ns(e.bodyFont),c=ns(e.titleFont),h=ns(e.footerFont),d=o.length,p=n.length,u=s.length,g=ss(e.padding);let f=g.height,m=0,b=s.reduce((t,e)=>t+e.before.length+e.lines.length+e.after.length,0);if(b+=t.beforeBody.length+t.afterBody.length,d&&(f+=d*c.lineHeight+(d-1)*e.titleSpacing+e.titleMarginBottom),b){f+=u*(e.displayColors?Math.max(r,l.lineHeight):l.lineHeight)+(b-u)*l.lineHeight+(b-1)*e.bodySpacing}p&&(f+=e.footerMarginTop+p*h.lineHeight+(p-1)*e.footerSpacing);let x=0;const y=function(t){m=Math.max(m,i.measureText(t).width+x)};return i.save(),i.font=c.string,Te(t.title,y),i.font=l.string,Te(t.beforeBody.concat(t.afterBody),y),x=e.displayColors?a+2+e.boxPadding:0,Te(s,t=>{Te(t.before,y),Te(t.lines,y),Te(t.after,y)}),x=0,i.font=h.string,Te(t.footer,y),i.restore(),m+=g.width,{width:m,height:f}}function Ea(t,e,i,s){const{x:n,width:o}=i,{width:a,chartArea:{left:r,right:l}}=t;let c="center";return"center"===s?c=n<=(r+l)/2?"left":"right":n<=o/2?c="left":n>=a-o/2&&(c="right"),function(t,e,i,s){const{x:n,width:o}=s,a=i.caretSize+i.caretPadding;return"left"===t&&n+o+a>e.width||"right"===t&&n-o-a<0||void 0}(c,t,e,i)&&(c="center"),c}function Pa(t,e,i){const s=i.yAlign||e.yAlign||function(t,e){const{y:i,height:s}=e;return i<s/2?"top":i>t.height-s/2?"bottom":"center"}(t,i);return{xAlign:i.xAlign||e.xAlign||Ea(t,e,i,s),yAlign:s}}function La(t,e,i,s){const{caretSize:n,caretPadding:o,cornerRadius:a}=t,{xAlign:r,yAlign:l}=i,c=n+o,{topLeft:h,topRight:d,bottomLeft:p,bottomRight:u}=is(a);let g=function(t,e){let{x:i,width:s}=t;return"right"===e?i-=s:"center"===e&&(i-=s/2),i}(e,r);const f=function(t,e,i){let{y:s,height:n}=t;return"top"===e?s+=i:s-="bottom"===e?n+i:n/2,s}(e,l,c);return"center"===l?"left"===r?g+=c:"right"===r&&(g-=c):"left"===r?g-=Math.max(h,p)+n:"right"===r&&(g+=Math.max(d,u)+n),{x:li(g,0,s.width-e.width),y:li(f,0,s.height-e.height)}}function Oa(t,e,i){const s=ss(i.padding);return"center"===e?t.x+t.width/2:"right"===e?t.x+t.width-s.right:t.x+s.left}function Ra(t){return Ca([],Aa(t))}function za(t,e){const i=e&&e.dataset&&e.dataset.tooltip&&e.dataset.tooltip.callbacks;return i?t.override(i):t}const ja={beforeTitle:ve,title(t){if(t.length>0){const e=t[0],i=e.chart.data.labels,s=i?i.length:0;if(this&&this.options&&"dataset"===this.options.mode)return e.dataset.label||"";if(e.label)return e.label;if(s>0&&e.dataIndex<s)return i[e.dataIndex]}return""},afterTitle:ve,beforeBody:ve,beforeLabel:ve,label(t){if(this&&this.options&&"dataset"===this.options.mode)return t.label+": "+t.formattedValue||t.formattedValue;let e=t.dataset.label||"";e&&(e+=": ");const i=t.formattedValue;return we(i)||(e+=i),e},labelColor(t){const e=t.chart.getDatasetMeta(t.datasetIndex).controller.getStyle(t.dataIndex);return{borderColor:e.borderColor,backgroundColor:e.backgroundColor,borderWidth:e.borderWidth,borderDash:e.borderDash,borderDashOffset:e.borderDashOffset,borderRadius:0}},labelTextColor(){return this.options.bodyColor},labelPointStyle(t){const e=t.chart.getDatasetMeta(t.datasetIndex).controller.getStyle(t.dataIndex);return{pointStyle:e.pointStyle,rotation:e.rotation}},afterLabel:ve,afterBody:ve,beforeFooter:ve,footer:ve,afterFooter:ve};function Ia(t,e,i,s){const n=t[e].call(i,s);return void 0===n?ja[e].call(i,s):n}class Ha extends no{static positioners=Ma;constructor(t){super(),this.opacity=0,this._active=[],this._eventPosition=void 0,this._size=void 0,this._cachedAnimations=void 0,this._tooltipItems=[],this.$animations=void 0,this.$context=void 0,this.chart=t.chart,this.options=t.options,this.dataPoints=void 0,this.title=void 0,this.beforeBody=void 0,this.body=void 0,this.afterBody=void 0,this.footer=void 0,this.xAlign=void 0,this.yAlign=void 0,this.x=void 0,this.y=void 0,this.height=void 0,this.width=void 0,this.caretX=void 0,this.caretY=void 0,this.labelColors=void 0,this.labelPointStyles=void 0,this.labelTextColors=void 0}initialize(t){this.options=t,this._cachedAnimations=void 0,this.$context=void 0}_resolveAnimations(){const t=this._cachedAnimations;if(t)return t;const e=this.chart,i=this.options.setContext(this.getContext()),s=i.enabled&&e.options.animation&&i.animations,n=new rn(this.chart,s);return s._cacheable&&(this._cachedAnimations=Object.freeze(n)),n}getContext(){return this.$context||(this.$context=(t=this.chart.getContext(),e=this,i=this._tooltipItems,rs(t,{tooltip:e,tooltipItems:i,type:"tooltip"})));var t,e,i}getTitle(t,e){const{callbacks:i}=e,s=Ia(i,"beforeTitle",this,t),n=Ia(i,"title",this,t),o=Ia(i,"afterTitle",this,t);let a=[];return a=Ca(a,Aa(s)),a=Ca(a,Aa(n)),a=Ca(a,Aa(o)),a}getBeforeBody(t,e){return Ra(Ia(e.callbacks,"beforeBody",this,t))}getBody(t,e){const{callbacks:i}=e,s=[];return Te(t,t=>{const e={before:[],lines:[],after:[]},n=za(i,t);Ca(e.before,Aa(Ia(n,"beforeLabel",this,t))),Ca(e.lines,Ia(n,"label",this,t)),Ca(e.after,Aa(Ia(n,"afterLabel",this,t))),s.push(e)}),s}getAfterBody(t,e){return Ra(Ia(e.callbacks,"afterBody",this,t))}getFooter(t,e){const{callbacks:i}=e,s=Ia(i,"beforeFooter",this,t),n=Ia(i,"footer",this,t),o=Ia(i,"afterFooter",this,t);let a=[];return a=Ca(a,Aa(s)),a=Ca(a,Aa(n)),a=Ca(a,Aa(o)),a}_createItems(t){const e=this._active,i=this.chart.data,s=[],n=[],o=[];let a,r,l=[];for(a=0,r=e.length;a<r;++a)l.push(Ta(this.chart,e[a]));return t.filter&&(l=l.filter((e,s,n)=>t.filter(e,s,n,i))),t.itemSort&&(l=l.sort((e,s)=>t.itemSort(e,s,i))),Te(l,e=>{const i=za(t.callbacks,e);s.push(Ia(i,"labelColor",this,e)),n.push(Ia(i,"labelPointStyle",this,e)),o.push(Ia(i,"labelTextColor",this,e))}),this.labelColors=s,this.labelPointStyles=n,this.labelTextColors=o,this.dataPoints=l,l}update(t,e){const i=this.options.setContext(this.getContext()),s=this._active;let n,o=[];if(s.length){const t=Ma[i.position].call(this,s,this._eventPosition);o=this._createItems(i),this.title=this.getTitle(o,i),this.beforeBody=this.getBeforeBody(o,i),this.body=this.getBody(o,i),this.afterBody=this.getAfterBody(o,i),this.footer=this.getFooter(o,i);const e=this._size=Da(this,i),a=Object.assign({},t,e),r=Pa(this.chart,i,a),l=La(i,a,r,this.chart);this.xAlign=r.xAlign,this.yAlign=r.yAlign,n={opacity:1,x:l.x,y:l.y,width:e.width,height:e.height,caretX:t.x,caretY:t.y}}else 0!==this.opacity&&(n={opacity:0});this._tooltipItems=o,this.$context=void 0,n&&this._resolveAnimations().update(this,n),t&&i.external&&i.external.call(this,{chart:this.chart,tooltip:this,replay:e})}drawCaret(t,e,i,s){const n=this.getCaretPosition(t,i,s);e.lineTo(n.x1,n.y1),e.lineTo(n.x2,n.y2),e.lineTo(n.x3,n.y3)}getCaretPosition(t,e,i){const{xAlign:s,yAlign:n}=this,{caretSize:o,cornerRadius:a}=i,{topLeft:r,topRight:l,bottomLeft:c,bottomRight:h}=is(a),{x:d,y:p}=t,{width:u,height:g}=e;let f,m,b,x,y,v;return"center"===n?(y=p+g/2,"left"===s?(f=d,m=f-o,x=y+o,v=y-o):(f=d+u,m=f+o,x=y-o,v=y+o),b=f):(m="left"===s?d+Math.max(r,c)+o:"right"===s?d+u-Math.max(l,h)-o:this.caretX,"top"===n?(x=p,y=x-o,f=m-o,b=m+o):(x=p+g,y=x+o,f=m+o,b=m-o),v=x),{x1:f,x2:m,x3:b,y1:x,y2:y,y3:v}}drawTitle(t,e,i){const s=this.title,n=s.length;let o,a,r;if(n){const l=Ws(i.rtl,this.x,this.width);for(t.x=Oa(this,i.titleAlign,i),e.textAlign=l.textAlign(i.titleAlign),e.textBaseline="middle",o=ns(i.titleFont),a=i.titleSpacing,e.fillStyle=i.titleColor,e.font=o.string,r=0;r<n;++r)e.fillText(s[r],l.x(t.x),t.y+o.lineHeight/2),t.y+=o.lineHeight+a,r+1===n&&(t.y+=i.titleMarginBottom-a)}}_drawColorBox(t,e,i,s,n){const o=this.labelColors[i],a=this.labelPointStyles[i],{boxHeight:r,boxWidth:l}=n,c=ns(n.bodyFont),h=Oa(this,"left",n),d=s.x(h),p=r<c.lineHeight?(c.lineHeight-r)/2:0,u=e.y+p;if(n.usePointStyle){const e={radius:Math.min(l,r)/2,pointStyle:a.pointStyle,rotation:a.rotation,borderWidth:1},i=s.leftForLtr(d,l)+l/2,c=u+r/2;t.strokeStyle=n.multiKeyBackground,t.fillStyle=n.multiKeyBackground,Fi(t,e,i,c),t.strokeStyle=o.borderColor,t.fillStyle=o.backgroundColor,Fi(t,e,i,c)}else{t.lineWidth=Se(o.borderWidth)?Math.max(...Object.values(o.borderWidth)):o.borderWidth||1,t.strokeStyle=o.borderColor,t.setLineDash(o.borderDash||[]),t.lineDashOffset=o.borderDashOffset||0;const e=s.leftForLtr(d,l),i=s.leftForLtr(s.xPlus(d,1),l-2),a=is(o.borderRadius);Object.values(a).some(t=>0!==t)?(t.beginPath(),t.fillStyle=n.multiKeyBackground,Gi(t,{x:e,y:u,w:l,h:r,radius:a}),t.fill(),t.stroke(),t.fillStyle=o.backgroundColor,t.beginPath(),Gi(t,{x:i,y:u+1,w:l-2,h:r-2,radius:a}),t.fill()):(t.fillStyle=n.multiKeyBackground,t.fillRect(e,u,l,r),t.strokeRect(e,u,l,r),t.fillStyle=o.backgroundColor,t.fillRect(i,u+1,l-2,r-2))}t.fillStyle=this.labelTextColors[i]}drawBody(t,e,i){const{body:s}=this,{bodySpacing:n,bodyAlign:o,displayColors:a,boxHeight:r,boxWidth:l,boxPadding:c}=i,h=ns(i.bodyFont);let d=h.lineHeight,p=0;const u=Ws(i.rtl,this.x,this.width),g=function(i){e.fillText(i,u.x(t.x+p),t.y+d/2),t.y+=d+n},f=u.textAlign(o);let m,b,x,y,v,_,w;for(e.textAlign=o,e.textBaseline="middle",e.font=h.string,t.x=Oa(this,f,i),e.fillStyle=i.bodyColor,Te(this.beforeBody,g),p=a&&"right"!==f?"center"===o?l/2+c:l+2+c:0,y=0,_=s.length;y<_;++y){for(m=s[y],b=this.labelTextColors[y],e.fillStyle=b,Te(m.before,g),x=m.lines,a&&x.length&&(this._drawColorBox(e,t,y,u,i),d=Math.max(h.lineHeight,r)),v=0,w=x.length;v<w;++v)g(x[v]),d=h.lineHeight;Te(m.after,g)}p=0,d=h.lineHeight,Te(this.afterBody,g),t.y-=n}drawFooter(t,e,i){const s=this.footer,n=s.length;let o,a;if(n){const r=Ws(i.rtl,this.x,this.width);for(t.x=Oa(this,i.footerAlign,i),t.y+=i.footerMarginTop,e.textAlign=r.textAlign(i.footerAlign),e.textBaseline="middle",o=ns(i.footerFont),e.fillStyle=i.footerColor,e.font=o.string,a=0;a<n;++a)e.fillText(s[a],r.x(t.x),t.y+o.lineHeight/2),t.y+=o.lineHeight+i.footerSpacing}}drawBackground(t,e,i,s){const{xAlign:n,yAlign:o}=this,{x:a,y:r}=t,{width:l,height:c}=i,{topLeft:h,topRight:d,bottomLeft:p,bottomRight:u}=is(s.cornerRadius);e.fillStyle=s.backgroundColor,e.strokeStyle=s.borderColor,e.lineWidth=s.borderWidth,e.beginPath(),e.moveTo(a+h,r),"top"===o&&this.drawCaret(t,e,i,s),e.lineTo(a+l-d,r),e.quadraticCurveTo(a+l,r,a+l,r+d),"center"===o&&"right"===n&&this.drawCaret(t,e,i,s),e.lineTo(a+l,r+c-u),e.quadraticCurveTo(a+l,r+c,a+l-u,r+c),"bottom"===o&&this.drawCaret(t,e,i,s),e.lineTo(a+p,r+c),e.quadraticCurveTo(a,r+c,a,r+c-p),"center"===o&&"left"===n&&this.drawCaret(t,e,i,s),e.lineTo(a,r+h),e.quadraticCurveTo(a,r,a+h,r),e.closePath(),e.fill(),s.borderWidth>0&&e.stroke()}_updateAnimationTarget(t){const e=this.chart,i=this.$animations,s=i&&i.x,n=i&&i.y;if(s||n){const i=Ma[t.position].call(this,this._active,this._eventPosition);if(!i)return;const o=this._size=Da(this,t),a=Object.assign({},i,this._size),r=Pa(e,t,a),l=La(t,a,r,e);s._to===l.x&&n._to===l.y||(this.xAlign=r.xAlign,this.yAlign=r.yAlign,this.width=o.width,this.height=o.height,this.caretX=i.x,this.caretY=i.y,this._resolveAnimations().update(this,l))}}_willRender(){return!!this.opacity}draw(t){const e=this.options.setContext(this.getContext());let i=this.opacity;if(!i)return;this._updateAnimationTarget(e);const s={width:this.width,height:this.height},n={x:this.x,y:this.y};i=Math.abs(i)<.001?0:i;const o=ss(e.padding),a=this.title.length||this.beforeBody.length||this.body.length||this.afterBody.length||this.footer.length;e.enabled&&a&&(t.save(),t.globalAlpha=i,this.drawBackground(n,t,s,e),Ns(t,e.textDirection),n.y+=o.top,this.drawTitle(n,t,e),this.drawBody(n,t,e),this.drawFooter(n,t,e),Us(t,e.textDirection),t.restore())}getActiveElements(){return this._active||[]}setActiveElements(t,e){const i=this._active,s=t.map(({datasetIndex:t,index:e})=>{const i=this.chart.getDatasetMeta(t);if(!i)throw new Error("Cannot find a dataset at index "+t);return{datasetIndex:t,element:i.data[e],index:e}}),n=!De(i,s),o=this._positionChanged(s,e);(n||o)&&(this._active=s,this._eventPosition=e,this._ignoreReplayEvents=!0,this.update(!0))}handleEvent(t,e,i=!0){if(e&&this._ignoreReplayEvents)return!1;this._ignoreReplayEvents=!1;const s=this.options,n=this._active||[],o=this._getActiveElements(t,n,e,i),a=this._positionChanged(o,t),r=e||!De(o,n)||a;return r&&(this._active=o,(s.enabled||s.external)&&(this._eventPosition={x:t.x,y:t.y},this.update(!0,e))),r}_getActiveElements(t,e,i,s){const n=this.options;if("mouseout"===t.type)return[];if(!s)return e.filter(t=>this.chart.data.datasets[t.datasetIndex]&&void 0!==this.chart.getDatasetMeta(t.datasetIndex).controller.getParsed(t.index));const o=this.chart.getElementsAtEventForMode(t,n.mode,n,i);return n.reverse&&o.reverse(),o}_positionChanged(t,e){const{caretX:i,caretY:s,options:n}=this,o=Ma[n.position].call(this,t,e);return!1!==o&&(i!==o.x||s!==o.y)}}var Fa={id:"tooltip",_element:Ha,positioners:Ma,afterInit(t,e,i){i&&(t.tooltip=new Ha({chart:t,options:i}))},beforeUpdate(t,e,i){t.tooltip&&t.tooltip.initialize(i)},reset(t,e,i){t.tooltip&&t.tooltip.initialize(i)},afterDraw(t){const e=t.tooltip;if(e&&e._willRender()){const i={tooltip:e};if(!1===t.notifyPlugins("beforeTooltipDraw",{...i,cancelable:!0}))return;e.draw(t.ctx),t.notifyPlugins("afterTooltipDraw",i)}},afterEvent(t,e){if(t.tooltip){const i=e.replay;t.tooltip.handleEvent(e.event,i,e.inChartArea)&&(e.changed=!0)}},defaults:{enabled:!0,external:null,position:"average",backgroundColor:"rgba(0,0,0,0.8)",titleColor:"#fff",titleFont:{weight:"bold"},titleSpacing:2,titleMarginBottom:6,titleAlign:"left",bodyColor:"#fff",bodySpacing:2,bodyFont:{},bodyAlign:"left",footerColor:"#fff",footerSpacing:2,footerMarginTop:6,footerFont:{weight:"bold"},footerAlign:"left",padding:6,caretPadding:2,caretSize:5,cornerRadius:6,boxHeight:(t,e)=>e.bodyFont.size,boxWidth:(t,e)=>e.bodyFont.size,multiKeyBackground:"#fff",displayColors:!0,boxPadding:0,borderColor:"rgba(0,0,0,0)",borderWidth:0,animation:{duration:400,easing:"easeOutQuart"},animations:{numbers:{type:"number",properties:["x","y","width","height","caretX","caretY"]},opacity:{easing:"linear",duration:200}},callbacks:ja},defaultRoutes:{bodyFont:"font",footerFont:"font",titleFont:"font"},descriptors:{_scriptable:t=>"filter"!==t&&"itemSort"!==t&&"external"!==t,_indexable:!1,callbacks:{_scriptable:!1,_indexable:!1},animation:{_fallback:!1},animations:{_fallback:"animation"}},additionalOptionScopes:["interaction"]};function Ba(t,e){const i=[],{bounds:s,step:n,min:o,max:a,precision:r,count:l,maxTicks:c,maxDigits:h,includeBounds:d}=t,p=n||1,u=c-1,{min:g,max:f}=e,m=!we(o),b=!we(a),x=!we(l),y=(f-g)/(h+1);let v,_,w,k,S=ti((f-g)/u/p)*p;if(S<1e-14&&!m&&!b)return[{value:g},{value:f}];k=Math.ceil(f/S)-Math.floor(g/S),k>u&&(S=ti(k*S/u/p)*p),we(r)||(v=Math.pow(10,r),S=Math.ceil(S*v)/v),"ticks"===s?(_=Math.floor(g/S)*S,w=Math.ceil(f/S)*S):(_=g,w=f),m&&b&&n&&function(t,e){const i=Math.round(t);return i-e<=t&&i+e>=t}((a-o)/n,S/1e3)?(k=Math.round(Math.min((a-o)/S,c)),S=(a-o)/k,_=o,w=a):x?(_=m?o:_,w=b?a:w,k=l-1,S=(w-_)/k):(k=(w-_)/S,k=Qe(k,Math.round(k),S/1e3)?Math.round(k):Math.ceil(k));const $=Math.max(si(S),si(_));v=Math.pow(10,we(r)?$:r),_=Math.round(_*v)/v,w=Math.round(w*v)/v;let M=0;for(m&&(d&&_!==o?(i.push({value:o}),_<o&&M++,Qe(Math.round((_+M*S)*v)/v,o,Va(o,y,t))&&M++):_<o&&M++);M<k;++M){const t=Math.round((_+M*S)*v)/v;if(b&&t>a)break;i.push({value:t})}return b&&d&&w!==a?i.length&&Qe(i[i.length-1].value,a,Va(a,y,t))?i[i.length-1].value=a:i.push({value:a}):b&&w!==a||i.push({value:w}),i}function Va(t,e,{horizontal:i,minRotation:s}){const n=ii(s),o=(i?Math.sin(n):Math.cos(n))||.001,a=.75*e*(""+t).length;return Math.min(e/o,a)}class Wa extends fo{constructor(t){super(t),this.start=void 0,this.end=void 0,this._startValue=void 0,this._endValue=void 0,this._valueRange=0}parse(t,e){return we(t)||("number"==typeof t||t instanceof Number)&&!isFinite(+t)?null:+t}handleTickRangeOptions(){const{beginAtZero:t}=this.options,{minDefined:e,maxDefined:i}=this.getUserBounds();let{min:s,max:n}=this;const o=t=>s=e?s:t,a=t=>n=i?n:t;if(t){const t=Ze(s),e=Ze(n);t<0&&e<0?a(0):t>0&&e>0&&o(0)}if(s===n){let e=0===n?1:Math.abs(.05*n);a(n+e),t||o(s-e)}this.min=s,this.max=n}getTickLimit(){const t=this.options.ticks;let e,{maxTicksLimit:i,stepSize:s}=t;return s?(e=Math.ceil(this.max/s)-Math.floor(this.min/s)+1,e>1e3&&(console.warn(`scales.${this.id}.ticks.stepSize: ${s} would result generating up to ${e} ticks. Limiting to 1000.`),e=1e3)):(e=this.computeTickLimit(),i=i||11),i&&(e=Math.min(i,e)),e}computeTickLimit(){return Number.POSITIVE_INFINITY}buildTicks(){const t=this.options,e=t.ticks;let i=this.getTickLimit();i=Math.max(2,i);const s=Ba({maxTicks:i,bounds:t.bounds,min:t.min,max:t.max,precision:e.precision,step:e.stepSize,count:e.count,maxDigits:this._maxDigits(),horizontal:this.isHorizontal(),minRotation:e.minRotation||0,includeBounds:!1!==e.includeBounds},this._range||this);return"ticks"===t.bounds&&function(t,e,i){let s,n,o;for(s=0,n=t.length;s<n;s++)o=t[s][i],isNaN(o)||(e.min=Math.min(e.min,o),e.max=Math.max(e.max,o))}(s,this,"value"),t.reverse?(s.reverse(),this.start=this.max,this.end=this.min):(this.start=this.min,this.end=this.max),s}configure(){const t=this.ticks;let e=this.min,i=this.max;if(super.configure(),this.options.offset&&t.length){const s=(i-e)/Math.max(t.length-1,1)/2;e-=s,i+=s}this._startValue=e,this._endValue=i,this._valueRange=i-e}getLabelForValue(t){return Ti(t,this.chart.options.locale,this.options.ticks.format)}}class Na extends Wa{static id="linear";static defaults={ticks:{callback:Di.formatters.numeric}};determineDataLimits(){const{min:t,max:e}=this.getMinMax(!0);this.min=$e(t)?t:0,this.max=$e(e)?e:1,this.handleTickRangeOptions()}computeTickLimit(){const t=this.isHorizontal(),e=t?this.width:this.height,i=ii(this.options.ticks.minRotation),s=(t?Math.sin(i):Math.cos(i))||.001,n=this._resolveTickFontOptions(0);return Math.ceil(e/Math.min(40,n.lineHeight/s))}getPixelForValue(t){return null===t?NaN:this.getPixelForDecimal((t-this._startValue)/this._valueRange)}getValueForPixel(t){return this._startValue+this.getDecimalForPixel(t)*this._valueRange}}qo.register($a,class extends yn{static id="line";static defaults={datasetElementType:"line",dataElementType:"point",showLine:!0,spanGaps:!1};static overrides={scales:{_index_:{type:"category"},_value_:{type:"linear"}}};initialize(){this.enableOptionSharing=!0,this.supportsDecimation=!0,super.initialize()}update(t){const e=this._cachedMeta,{dataset:i,data:s=[],_dataset:n}=e,o=this.chart._animationsDisabled;let{start:a,count:r}=function(t,e,i){const s=e.length;let n=0,o=s;if(t._sorted){const{iScale:a,vScale:r,_parsed:l}=t,c=t.dataset&&t.dataset.options?t.dataset.options.spanGaps:null,h=a.axis,{min:d,max:p,minDefined:u,maxDefined:g}=a.getUserBounds();if(u){if(n=Math.min(di(l,h,d).lo,i?s:di(e,h,a.getPixelForValue(d)).lo),c){const t=l.slice(0,n+1).reverse().findIndex(t=>!we(t[r.axis]));n-=Math.max(0,t)}n=li(n,0,s-1)}if(g){let t=Math.max(di(l,a.axis,p,!0).hi+1,i?0:di(e,h,a.getPixelForValue(p),!0).hi+1);if(c){const e=l.slice(t-1).findIndex(t=>!we(t[r.axis]));t+=Math.max(0,e)}o=li(t,n,s)-n}else o=s-n}return{start:n,count:o}}(e,s,o);this._drawStart=a,this._drawCount=r,function(t){const{xScale:e,yScale:i,_scaleRanges:s}=t,n={xmin:e.min,xmax:e.max,ymin:i.min,ymax:i.max};if(!s)return t._scaleRanges=n,!0;const o=s.xmin!==e.min||s.xmax!==e.max||s.ymin!==i.min||s.ymax!==i.max;return Object.assign(s,n),o}(e)&&(a=0,r=s.length),i._chart=this.chart,i._datasetIndex=this.index,i._decimated=!!n._decimated,i.points=s;const l=this.resolveDatasetElementOptions(t);this.options.showLine||(l.borderWidth=0),l.segment=this.options.segment,this.updateElement(i,void 0,{animated:!o,options:l},t),this.updateElements(s,a,r,t)}updateElements(t,e,i,s){const n="reset"===s,{iScale:o,vScale:a,_stacked:r,_dataset:l}=this._cachedMeta,{sharedOptions:c,includeOptions:h}=this._getSharedOptions(e,s),d=o.axis,p=a.axis,{spanGaps:u,segment:g}=this.options,f=ei(u)?u:Number.POSITIVE_INFINITY,m=this.chart._animationsDisabled||n||"none"===s,b=e+i,x=t.length;let y=e>0&&this.getParsed(e-1);for(let i=0;i<x;++i){const u=t[i],x=m?u:{};if(i<e||i>=b){x.skip=!0;continue}const v=this.getParsed(i),_=we(v[p]),w=x[d]=o.getPixelForValue(v[d],i),k=x[p]=n||_?a.getBasePixel():a.getPixelForValue(r?this.applyStack(a,v,r):v[p],i);x.skip=isNaN(w)||isNaN(k)||_,x.stop=i>0&&Math.abs(v[d]-y[d])>f,g&&(x.parsed=v,x.raw=l.data[i]),h&&(x.options=c||this.resolveDataElementOptions(i,u.active?"active":s)),m||this.updateElement(u,i,x,s),y=v}}getMaxOverflow(){const t=this._cachedMeta,e=t.dataset,i=e.options&&e.options.borderWidth||0,s=t.data||[];if(!s.length)return i;const n=s[0].size(this.resolveDataElementOptions(0)),o=s[s.length-1].size(this.resolveDataElementOptions(s.length-1));return Math.max(i,n,o)/2}draw(){const t=this._cachedMeta;t.dataset.updateControlPoints(this.chart.chartArea,t.iScale.axis),super.draw()}},ia,class extends no{static id="point";parsed;skip;stop;static defaults={borderWidth:1,hitRadius:1,hoverBorderWidth:1,hoverRadius:4,pointStyle:"circle",radius:3,rotation:0};static defaultRoutes={backgroundColor:"backgroundColor",borderColor:"borderColor"};constructor(t){super(),this.options=void 0,this.parsed=void 0,this.skip=void 0,this.stop=void 0,t&&Object.assign(this,t)}inRange(t,e,i){const s=this.options,{x:n,y:o}=this.getProps(["x","y"],i);return Math.pow(t-n,2)+Math.pow(e-o,2)<Math.pow(s.hitRadius+s.radius,2)}inXRange(t,e){return sa(this,t,"x",e)}inYRange(t,e){return sa(this,t,"y",e)}getCenterPoint(t){const{x:e,y:i}=this.getProps(["x","y"],t);return{x:e,y:i}}size(t){let e=(t=t||this.options||{}).radius||0;e=Math.max(e,e&&t.hoverRadius||0);return 2*(e+(e&&t.borderWidth||0))}draw(t,e){const i=this.options;this.skip||i.radius<.1||!Vi(this,e,this.size(i)/2)||(t.strokeStyle=i.borderColor,t.lineWidth=i.borderWidth,t.fillStyle=i.backgroundColor,Fi(t,i,this.x,this.y))}getRange(){const t=this.options||{};return t.radius+t.hitRadius}},Na,_a,Fa);const Ua=.15,qa={decimationEnabled:!0,algorithm:"lttb",samples:25,tension:.5,borderWidth:3,primaryOpacity:1,rawOpacity:.25};function Ya(t){const e=t.shadowRoot?.getElementById("jp-detail-chart-canvas");if(!e)return;const i=t._chartData;if(!i||0===i.length)return void Ka(t);const s=t._getDevice(t._detailEntity),n=s?.threshold??t._settingsValues?.low_threshold??20,o=t._chartDevSettings??qa,a=(e,i)=>function(t,e,i){const s=getComputedStyle(t).getPropertyValue(e).trim();return s||i}(t,e,i),r=a(dt.var,dt.fallback),l=a(pt.var,pt.fallback),c=a(ut.var,ut.fallback),h=a("--divider-color","rgba(0,0,0,0.12)"),d=a("--secondary-text-color","#888");Ga(d,o.rawOpacity);const p=o.decimationEnabled?function(t,e){const i=t.length;if(e>=i||e<=2)return t;const s=new Array(e),n=(i-2)/(e-2);let o=0;s[0]=t[0];for(let a=0;a<e-2;a++){const e=Math.floor((a+1)*n)+1,r=Math.min(Math.floor((a+2)*n)+1,i);let l=0,c=0;for(let i=e;i<r;i++)l+=t[i].x,c+=t[i].y;const h=r-e;l/=h,c/=h;const d=Math.floor(a*n)+1,p=Math.floor((a+1)*n)+1,{x:u,y:g}=t[o];let f=-1,m=d;for(let e=d;e<p;e++){const i=.5*Math.abs((u-l)*(t[e].y-g)-(u-t[e].x)*(c-g));i>f&&(f=i,m=e)}s[a+1]=t[m],o=m}return s[e-1]=t[i-1],s}(i,o.samples):i,u=(t,e,i)=>function(t,e,i,s,n,o,a){const{top:r,bottom:l}=e,c=t.createLinearGradient(0,r,0,l),h=i+(100-i)/3,d=(100-h)/100,p=(100-i)/100,u=Ga(s,a),g=Ga(n,a),f=Ga(o,a);return c.addColorStop(0,u),c.addColorStop(d,u),c.addColorStop(d,g),c.addColorStop(p,g),c.addColorStop(p,f),c.addColorStop(1,f),c}(t,e,n,r,l,c,i),g={datasets:[{label:"Raw",data:i,parsing:!1,borderWidth:1,borderColor:()=>Ga(d,o.rawOpacity),borderDash:[4,4],backgroundColor:"transparent",pointRadius:0,pointHoverRadius:0,fill:!1,tension:0,order:2},{label:"Decimated",data:p,parsing:!1,borderWidth:o.borderWidth,pointRadius:0,pointHoverRadius:4,fill:!0,tension:o.tension,order:1,borderColor:({chart:t})=>t.chartArea?u(t.ctx,t.chartArea,o.primaryOpacity):r,backgroundColor:({chart:t})=>t.chartArea?u(t.ctx,t.chartArea,Ua*o.primaryOpacity):Ga(r,Ua*o.primaryOpacity)}]},f={animation:!1,responsive:!0,maintainAspectRatio:!1,parsing:!1,scales:{x:{type:"linear",min:i[0].x,max:i[i.length-1].x,grid:{color:h},ticks:{color:d,maxTicksLimit:8,callback:Ja},border:{display:!1}},y:{type:"linear",min:0,max:100,grid:{color:h},ticks:{color:d,stepSize:25,callback:t=>t+"%"},border:{display:!1}}},plugins:{legend:{display:!0,labels:{color:d,boxWidth:24,boxHeight:2,padding:12}},tooltip:{callbacks:{title:t=>function(t){const e=new Date(t);return e.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}(t[0].parsed.x),label:t=>`${Math.round(t.parsed.y)}%`}}}};if(t._detailChart){const e=t._detailChart.data.datasets;e[0].data=i,e[0].borderColor=Ga(d,o.rawOpacity),e[0].borderDash=[4,4],e[1].data=p,e[1].borderColor=({chart:t})=>t.chartArea?u(t.ctx,t.chartArea,o.primaryOpacity):r,e[1].backgroundColor=({chart:t})=>t.chartArea?u(t.ctx,t.chartArea,Ua*o.primaryOpacity):Ga(r,Ua*o.primaryOpacity),e[1].tension=o.tension,e[1].borderWidth=o.borderWidth,t._detailChart.options=f,t._detailChart.update()}else t._detailChart=new qo(e,{type:"line",data:g,options:f})}function Xa(t){Ka(t)}function Ka(t){t._detailChart&&(t._detailChart.destroy(),t._detailChart=null)}function Ga(t,e){if(t.startsWith("rgba("))return t.replace(/,\s*[\d.]+\)$/,`, ${e})`);if(t.startsWith("rgb("))return t.replace("rgb(","rgba(").replace(")",`, ${e})`);if(t.startsWith("#")){let i=t.slice(1);if(3===i.length&&(i=i[0]+i[0]+i[1]+i[1]+i[2]+i[2]),6===i.length){return`rgba(${parseInt(i.slice(0,2),16)}, ${parseInt(i.slice(2,4),16)}, ${parseInt(i.slice(4,6),16)}, ${e})`}}return t}function Ja(t){return new Date(t).toLocaleDateString(void 0,{month:"short",day:"numeric"})}const Za="jp-detail-chart-canvas";function Qa(t){const e=t._detailEntity,i=t._getDevice(e);return i?B`
    ${function(t,e){const i=t._detailEntity,s=Ot(e.level,e.threshold),n=jt(e),o=Pt(e.level),a="battery level",r=null!=e.level?Math.max(0,Math.min(100,Math.ceil(e.level))):0,l=Pt(e.level),c=s;return B`
    <ha-card style="container-type:inline-size;container-name:hero;margin-bottom:16px">
      <div class="hero-row">
        <div class="hero-left">
          <div class="hero-big" style="color:${s}">${o}</div>
          <div class="hero-unit">${a}</div>
        </div>
        <div class="hero-right">
          <div class="hero-name-row">
            <div class="hero-name">${e.name||e.sourceEntity}</div>
            <ha-icon-button
              .path=${"M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"}
              style="--mdc-icon-button-size:32px;--mdc-icon-size:20px;color:${At}"
              title="More info"
              @click=${()=>{t.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:i}}))}}
            ></ha-icon-button>
          </div>
          ${n?B`<div class="hero-sub">${n}</div>`:W}
          <div class="hero-bar-row">
            <div class="hero-bar">
              <div class="hero-bar-fill" style="width:${r}%;background:${s}"></div>
            </div>
            <div class="hero-bar-pct" style="color:${c}">${l}</div>
          </div>
        </div>
      </div>
      <div class="hero-stats">
        <div class="hero-stat">
          <div class="hero-stat-label">Battery Type</div>
          <div class="hero-stat-val">${e.batteryType||"—"}</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-label">Status</div>
          <div class="hero-stat-val">${e.isStale?"Stale":e.isLow?"Low":e.isRechargeable&&e.chargingState?"charging"===e.chargingState?"Charging":"discharging"===e.chargingState||"not_charging"===e.chargingState?"Discharging":"full"===e.chargingState?"Full":"OK":"OK"}</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-label">Rechargeable</div>
          <div class="hero-stat-val">${e.isRechargeable?"Yes":"No"}</div>
        </div>
        ${e.lastReplaced?B`
        <div class="hero-stat">
          <div class="hero-stat-label">Last Replaced</div>
          <div class="hero-stat-val">${zt(1e3*e.lastReplaced,!0)}</div>
        </div>
        `:W}
      </div>
    </ha-card>
  `}(t,i)}
    ${function(t){return B`
    <ha-card style="margin-bottom:16px">
      ${t._chartLoading?B`
        <div class="loading-state">
          <ha-spinner></ha-spinner>
        </div>
      `:t._chartData&&t._chartData.length>0?B`
        <div style="padding:16px 16px 8px">
          <div style="height:30vh;position:relative">
            <canvas id="${Za}"></canvas>
          </div>
        </div>
      `:B`
        <div class="empty-state">No history available</div>
      `}
    </ha-card>
  `}(t)}
    ${function(t){const e=t._chartDevSettings??qa,i=t._chartData?.length??0,s=e.decimationEnabled?Math.min(e.samples,i):i,n=(e,i)=>t._updateChartDev(e,i);return B`
    <ha-card style="margin-bottom:16px;border:2px dashed var(--warning-color,#ffa726)">
      <ha-expansion-panel>
        <div slot="header" style="display:flex;align-items:center;gap:8px">
          <ha-icon icon="mdi:tune" style="--mdc-icon-size:18px;color:var(--warning-color,#ffa726)"></ha-icon>
          <span style="font-weight:500;color:var(--warning-color,#ffa726)">Dev: Chart Settings</span>
          <span style="margin-left:auto;font-size:12px;color:var(--secondary-text-color)">
            ${i.toLocaleString()} pts → ${s.toLocaleString()}
          </span>
        </div>
        <div style="padding:12px 16px;display:flex;flex-direction:column;gap:12px">

          <div style="display:flex;align-items:center;gap:12px">
            <label style="min-width:120px;font-size:13px">Decimation</label>
            <ha-switch
              .checked=${e.decimationEnabled}
              @change=${t=>n("decimationEnabled",t.target.checked)}
            ></ha-switch>
            <span style="font-size:12px;color:var(--secondary-text-color)">
              ${e.decimationEnabled?"on":"off"}
            </span>
          </div>

          <div style="display:flex;align-items:center;gap:12px">
            <label style="min-width:120px;font-size:13px">Samples</label>
            <input type="range" min="1" max="500" step="1"
              .value=${String(e.samples)}
              @input=${t=>n("samples",Number(t.target.value))}
              ?disabled=${!e.decimationEnabled}
              style="flex:1"
            />
            <span style="min-width:36px;font-size:12px;color:var(--secondary-text-color);text-align:right">
              ${e.samples}
            </span>
          </div>

          <div style="display:flex;align-items:center;gap:12px">
            <label style="min-width:120px;font-size:13px">Tension</label>
            <input type="range" min="0" max="1" step="0.05"
              .value=${String(e.tension)}
              @input=${t=>n("tension",Number(t.target.value))}
              style="flex:1"
            />
            <span style="min-width:36px;font-size:12px;color:var(--secondary-text-color);text-align:right">
              ${e.tension.toFixed(2)}
            </span>
          </div>

          <div style="display:flex;align-items:center;gap:12px">
            <label style="min-width:120px;font-size:13px">Primary opacity</label>
            <input type="range" min="0" max="1" step="0.05"
              .value=${String(e.primaryOpacity)}
              @input=${t=>n("primaryOpacity",Number(t.target.value))}
              style="flex:1"
            />
            <span style="min-width:36px;font-size:12px;color:var(--secondary-text-color);text-align:right">
              ${e.primaryOpacity.toFixed(2)}
            </span>
          </div>

          <div style="display:flex;align-items:center;gap:12px">
            <label style="min-width:120px;font-size:13px">Raw opacity</label>
            <input type="range" min="0" max="1" step="0.05"
              .value=${String(e.rawOpacity)}
              @input=${t=>n("rawOpacity",Number(t.target.value))}
              style="flex:1"
            />
            <span style="min-width:36px;font-size:12px;color:var(--secondary-text-color);text-align:right">
              ${e.rawOpacity.toFixed(2)}
            </span>
          </div>

          <div style="display:flex;align-items:center;gap:12px">
            <label style="min-width:120px;font-size:13px">Border width</label>
            <input type="range" min="0.5" max="5" step="0.5"
              .value=${String(e.borderWidth)}
              @input=${t=>n("borderWidth",Number(t.target.value))}
              style="flex:1"
            />
            <span style="min-width:36px;font-size:12px;color:var(--secondary-text-color);text-align:right">
              ${e.borderWidth}
            </span>
          </div>

        </div>
      </ha-expansion-panel>
    </ha-card>
  `}(t)}
    ${function(t,e){const i=t._detailEntity;if(!i)return W;const s=t._getDevice(i);return s&&s.lastReplaced?B`
    <ha-card style="margin-bottom:16px">
      <ha-expansion-panel>
        <div slot="header" style="display:flex;align-items:center;gap:8px;width:100%">
          <ha-icon icon="mdi:history" style="--mdc-icon-size:20px;color:${At}"></ha-icon>
          <span style="flex:1;font-weight:500">Battery Replacement</span>
        </div>
        <div class="expansion-content" style="padding:16px">
          <p style="margin:0;color:var(--secondary-text-color)">
            Last replaced: ${zt(1e3*e.lastReplaced,!0)}
          </p>
        </div>
      </ha-expansion-panel>
    </ha-card>
  `:W}(t,i)}
  `:B`<div class="empty-state">Device not found</div>`}function tr(t){if(t._shoppingLoading)return B`<div class="devices">
      <div class="empty-state">Loading shopping list...</div>
    </div>`;if(!t._shoppingData||!t._shoppingData.groups)return B`<div class="devices">
      <div class="empty-state">
        No shopping data available. Click refresh to load.
      </div>
    </div>`;const{groups:e,total_needed:i}=t._shoppingData;return 0===e.length?B`<div class="devices">
      <div class="empty-state">No battery devices found.</div>
    </div>`:B`
    <div class="shopping-summary">
      <div class="summary-card">
        <div
          class="value"
          style="color:${i>0?"var(--warning-color)":"var(--success-color)"}"
        >
          ${i}
        </div>
        <div class="label">Batteries needed</div>
      </div>
      ${e.filter(t=>t.needs_replacement>0&&"Unknown"!==t.battery_type).map(t=>B`
            <div class="summary-card shopping-need-card">
              <div class="value">${t.needs_replacement}</div>
              <div class="label">${t.battery_type}</div>
            </div>
          `)}
    </div>
    <div class="shopping-groups">
      ${e.map(e=>function(t,e){const i="Unknown"===e.battery_type,s=i?"mdi:help-circle-outline":"mdi:battery",n=!!t._expandedGroups[e.battery_type],o=`${e.battery_count} batter${1!==e.battery_count?"ies":"y"} in ${e.device_count} device${1!==e.device_count?"s":""}${e.needs_replacement>0?` — ${e.needs_replacement} need${1!==e.needs_replacement?"":"s"} replacement`:""}`;return B`
    <ha-expansion-panel
      outlined
      .expanded=${n}
      @expanded-changed=${i=>{const s={...t._expandedGroups};i.detail.expanded?s[e.battery_type]=!0:delete s[e.battery_type],t._expandedGroups=s}}
    >
      <ha-icon slot="leading-icon" icon=${s} style="--mdc-icon-size:20px"></ha-icon>
      <span slot="header" class="shopping-type">${e.battery_type}</span>
      <span slot="secondary">
        ${e.needs_replacement>0?B`<span class="shopping-need-badge">${e.needs_replacement}\u00d7</span> `:W}
        ${o}
      </span>
      <div class="shopping-devices-inner">
        ${e.devices.map(t=>{const e=Ot(t.level,null),i=t.is_low,s=t.battery_count>1?` (${t.battery_count}×)`:"";return B`
            <div class="shopping-device ${i?"needs-replacement":""}">
              <span class="shopping-device-name"
                >${t.device_name}${s}</span
              >
              <span class="shopping-device-level" style="color:${e}">
                ${Pt(t.level)}
              </span>
            </div>
          `})}
      </div>
    </ha-expansion-panel>
  `}(t,e))}
    </div>
    ${e.some(t=>"Unknown"===t.battery_type)?B`<div class="shopping-hint">
          <ha-icon
            icon="mdi:information-outline"
            style="--mdc-icon-size:16px"
          ></ha-icon>
          Devices with unknown battery type can be configured from the Devices tab.
        </div>`:W}
  `}const er=[{key:"critical",min:0,max:10,label:"0–10%",color:ut},{key:"warning",min:11,max:50,label:"10–50%",color:pt},{key:"healthy",min:51,max:100,label:"50–100%",color:dt}];function ir(t){const e=t._entities||[],i=function(t){const e={};for(const t of er)e[t.key]=0;let i=0,s=0,n=0,o=0;for(const a of t){if(o++,null==a.level){n++;continue}if(a.isStale){s++;continue}if(a.isRechargeable){i++;continue}const t=Math.ceil(a.level);for(const i of er)if(t>=i.min&&t<=i.max){e[i.key]++;break}}return{buckets:e,rechargeable:i,stale:s,unavailable:n,total:o}}(e);t._fleetData=i;const s=function(t){return t.filter(t=>null!=t.level&&!t.isRechargeable&&!t.isStale).sort((t,e)=>t.level-e.level).slice(0,5)}(e),n=function(t){const e={};for(const i of t){if(null==i.level)continue;let t;if(i.isRechargeable)t="Rechargeable";else{const e=i.batteryType?.match(/^(?:\d+\s*[×x]\s*)?(.+)$/i);t=e?e[1].trim():i.batteryType||"Unknown"}e[t]||(e[t]={type:t,devices:[],isRechargeable:"Rechargeable"===t}),e[t].devices.push(i)}const i=Object.values(e).sort((t,e)=>e.devices.length-t.devices.length);for(const t of i){t.buckets={};for(const e of er)t.buckets[e.key]=0;for(const e of t.devices){const i=Math.ceil(e.level);for(const e of er)if(i>=e.min&&i<=e.max){t.buckets[e.key]++;break}}}return i}(e);t._healthByTypeData=n;const o=function(t){let e=0,i=0,s=0,n=0;for(const o of t)null!=o.level&&(o.isRechargeable||(i++,s+=o.level,n++,o.isLow||e++));return{readiness:i>0?Math.round(e/i*100):100,aboveThreshold:e,totalDisposable:i,avgLevel:n>0?Math.round(s/n):0}}(e);return B`
    <div class="jp-dashboard">
      ${function(t,e){const i=e.readiness>=80?St:e.readiness>=50?$t:Mt;return B`
    <ha-card>
      <div class="db-card-header">
        <span class="db-card-title">Overview</span>
        <span class="jp-badge neutral">${t.total} devices</span>
      </div>
      <div id="jp-fleet-chart" style="padding:4px 8px"></div>
      <div class="db-overview-stats">
        <div class="db-stat">
          <span class="db-stat-value" style="color:${i}">${e.readiness}%</span>
          <span class="db-stat-label">Fleet Readiness</span>
          <span class="db-stat-sub">${e.aboveThreshold} of ${e.totalDisposable} disposable above threshold</span>
        </div>
        <div class="db-stat">
          <span class="db-stat-value" style="color:${e.avgLevel<=10?Mt:e.avgLevel<=50?$t:St}">${e.avgLevel}%</span>
          <span class="db-stat-label">Average Level</span>
          <span class="db-stat-sub">Across all disposable devices</span>
        </div>
      </div>
    </ha-card>
  `}(i,o)}
      <div class="db-bottom-row">
        ${function(t,e){if(!e.length)return B`
      <ha-card>
        <div class="db-card-header">
          <span class="db-card-title">Lowest Battery</span>
          <span class="jp-badge neutral">No devices</span>
        </div>
        <div class="empty-state" style="padding:24px">No battery devices found.</div>
      </ha-card>
    `;return B`
    <ha-card>
      <div class="db-card-header">
        <span class="db-card-title">Lowest Battery</span>
      </div>
      <div class="card-content" style="padding-top:0">
        <table class="att-table">
          <thead><tr><th>Device</th><th>Level</th><th>Type</th></tr></thead>
          <tbody>
            ${e.map(e=>{const i=Lt(e.level),s=Ot(e.level,e.threshold??20);return B`
                <tr class="att-row" @click=${()=>t._openDetail(e.sourceEntity)}>
                  <td class="name-cell">${e.name}</td>
                  <td>
                    <div class="level-indicator">
                      <span style="color:${s};font-weight:500">${i}%</span>
                      <div class="level-bar">
                        <div class="level-bar-fill" style="width:${i}%;background:${s}"></div>
                      </div>
                    </div>
                  </td>
                  <td class="dim">${e.batteryType||"—"}</td>
                </tr>
              `})}
          </tbody>
        </table>
      </div>
    </ha-card>
  `}(t,s)}
        ${a=n,B`
    <ha-card>
      <div class="db-card-header">
        <span class="db-card-title">Health by Battery Type</span>
        <span class="jp-badge primary">${a.length} type${1!==a.length?"s":""}</span>
      </div>
      <div class="card-content">
        <div class="type-health-list">
          ${a.map(t=>B`
            <div class="type-health-row">
              <span class="th-type" style="color:${t.isRechargeable?kt:wt}">${t.type}</span>
              <div id="jp-type-chart-${sr(t.type)}" class="th-chart-container"></div>
              <span class="th-count">${t.devices.length}</span>
            </div>
          `)}
        </div>
      </div>
    </ha-card>
  `}
      </div>
    </div>
  `;var a}function sr(t){return t.replace(/[^a-z0-9]/gi,"_").toLowerCase()}function nr(t,e,i){return getComputedStyle(t).getPropertyValue(e).trim()||i}function or(t,e,{categories:i,series:s,total:n,xMax:o,clickHandler:a},r,l){const c=t.shadowRoot?.getElementById(e);if(!c)return;const h=(e,i)=>nr(t,e,i),d=h(mt,bt),p=h(vt,h("--card-background-color",_t)),u=h(xt,yt),g={xAxis:{type:"value",show:!1,max:o||"dataMax"},yAxis:{type:"category",show:!1,data:[""]},legend:l?{show:!0,bottom:0,left:"center",textStyle:{color:d,fontSize:11},itemWidth:10,itemHeight:10,itemGap:14,icon:"roundRect",selectedMode:!0}:{show:!1},tooltip:{trigger:"item",backgroundColor:p,borderColor:h("--divider-color","rgba(0,0,0,0.12)"),textStyle:{color:u,fontSize:12},formatter:t=>`${t.seriesName}: ${t.value} device${1!==t.value?"s":""}`},grid:{left:8,right:8,top:6,bottom:l?40:6,containLabel:!1}};let f=t[r];f&&c.contains(f)||(f=document.createElement("ha-chart-base"),c.innerHTML="",c.appendChild(f),t[r]=f),f.hass=t._hass;const m=l?"90px":"32px";f.height=m,f.style.height=m,f.style.display="block",f.style.cursor="pointer",!f._jpClickBound&&a&&(f.addEventListener("chart-click",t=>{const e=t.detail?.seriesName;if(!e)return;const s=i.find(t=>t.name===e);s&&a(s)}),f._jpClickBound=!0),requestAnimationFrame(()=>{f.data=s,f.options=g})}function ar(t,e,i){const s=(e,i)=>nr(t,e,i),n=s(xt,yt),o=er.length,a=er.map((t,i)=>{const n=e.buckets[t.key],a=e.isRechargeable?s(rt,lt):s(t.color.var,t.color.fallback),[r,l]=ht,c=e.isRechargeable?r+i/(o-1)*(l-r):t.color.opacity;return{name:t.label,value:n,color:a,opacity:c,levelMin:t.min,levelMax:t.max}}).filter(t=>t.value>0),r=a.map(t=>({name:t.name,type:"bar",stack:"type",data:[t.value],itemStyle:{color:t.color,opacity:t.opacity,borderRadius:0},barWidth:"80%",label:{show:t.value>0,position:"inside",formatter:`${t.value}`,fontSize:10,fontWeight:500,color:n},emphasis:{focus:"series"}}));return{categories:a,series:r,total:e.devices.length,xMax:i,clickHandler:i=>{t._navigateToDevicesWithLevelFilter(i.levelMin,i.levelMax,{batteryType:{value:[e.type]}})}}}const rr=async function(t){if(!customElements.get("ha-chart-base"))try{await(window.loadCardHelpers?.()),await new Promise(t=>setTimeout(t,100))}catch(t){}if(!customElements.get("ha-chart-base"))return;t._fleetData&&or(t,"jp-fleet-chart",function(t){const e=t._fleetData,i=(e,i)=>nr(t,e,i),s=i(xt,yt),n=[...er.map(t=>({name:t.label,value:e.buckets[t.key],color:i(t.color.var,t.color.fallback),opacity:t.color.opacity,levelMin:t.min,levelMax:t.max})),{name:"Rechargeable",value:e.rechargeable,color:i(rt,lt),opacity:ct,filter:"rechargeable"},{name:"Stale",value:e.stale,color:i(gt,ft),opacity:.5,filter:"stale"},{name:"Unavailable",value:e.unavailable,color:i(gt,ft),opacity:.3,filter:"unavailable"}],o=n.map(t=>({name:t.name,type:"bar",stack:"fleet",data:[t.value],itemStyle:{color:t.color,opacity:t.opacity,borderRadius:0},barWidth:"60%",label:{show:t.value>0,position:"inside",formatter:`${t.value}`,fontSize:11,fontWeight:500,color:s},emphasis:{focus:"series"}})),a=e=>{null!=e.levelMin?t._navigateToDevicesWithLevelFilter(e.levelMin,e.levelMax):"rechargeable"===e.filter?t._navigateToDevicesWithLevelFilter(null,null,{battery:{value:["rechargeable"]}}):"stale"===e.filter?t._navigateToDevicesWithLevelFilter(null,null,{status:{value:["stale"]}}):"unavailable"===e.filter&&t._navigateToDevicesWithLevelFilter(null,null,{status:{value:["unavailable"]}})};return{categories:n,series:o,total:e.total,clickHandler:a}}(t),"_fleetChartEl",!0);const e=t._healthByTypeData;if(e&&e.length){const i=Math.max(...e.map(t=>t.devices.length));for(const s of e)or(t,`jp-type-chart-${sr(s.type)}`,ar(t,s,i),`_typeChart_${sr(s.type)}`,!1)}};const lr="1970-01-01T00:00:00Z";const cr=t=>Math.min(100,Math.max(0,t));function hr(t,e,{title:i,preamble:s}){const n=document.createElement("ha-dialog");n.open=!0,n.headerTitle=i,t.shadowRoot.appendChild(n);const o=()=>{n.open=!1,n.remove()},a=document.createElement("div");a.innerHTML=`\n    ${s}\n    <ha-expansion-panel outlined style="margin: 8px 0">\n      <span slot="header">Advanced: set custom date</span>\n      <div style="padding: 8px 0">\n        <p style="margin-top:0; color:var(--secondary-text-color); font-size:0.9em">\n          Register a past battery replacement by selecting the date and time it occurred.</p>\n        <input type="datetime-local" class="jp-datetime-input"\n          style="width:100%; padding:8px; border:1px solid var(--divider-color, #ddd);\n                 border-radius:4px; background:var(--card-background-color, #fff);\n                 color:var(--primary-text-color); font-size:14px; box-sizing:border-box" />\n      </div>\n    </ha-expansion-panel>\n    <div class="jp-dialog-actions">\n      <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>\n      <ha-button class="jp-dialog-confirm">Mark as replaced</ha-button>\n    </div>\n  `,n.appendChild(a),a.querySelector(".jp-dialog-cancel").addEventListener("click",o),a.querySelector(".jp-dialog-confirm").addEventListener("click",()=>{const i=a.querySelector(".jp-datetime-input");let s;i&&i.value&&(s=new Date(i.value).getTime()/1e3),o(),t._doMarkReplaced(e,s)})}function dr(t,{title:e,bodyHtml:i,onConfirm:s,confirmLabel:n,confirmVariant:o}){const a=document.createElement("ha-dialog");a.open=!0,a.headerTitle=e,t.shadowRoot.appendChild(a);const r=()=>{a.open=!1,a.remove()},l=document.createElement("div");l.innerHTML=`\n    ${i}\n    <div class="jp-dialog-actions">\n      <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>\n      <ha-button class="jp-dialog-confirm" ${o?`variant="${o}"`:""}>${n||"Confirm"}</ha-button>\n    </div>\n  `,a.appendChild(l),l.querySelector(".jp-dialog-cancel").addEventListener("click",r),l.querySelector(".jp-dialog-confirm").addEventListener("click",()=>{r(),s()})}customElements.define("juice-patrol-panel",class extends ot{static get properties(){return{narrow:{type:Boolean},_entities:{state:!0},_activeView:{state:!0},_settingsOpen:{state:!0},_settingsValues:{state:!0},_settingsDirty:{state:!0},_shoppingData:{state:!0},_shoppingLoading:{state:!0},_detailEntity:{state:!0},_flashGeneration:{state:!0},_refreshing:{state:!0},_ignoredEntities:{state:!0},_filters:{state:!0},_dashboardLoading:{state:!0},_chartData:{state:!0},_chartLoading:{state:!0},_chartDevSettings:{state:!0}}}constructor(){super(),this._hass=null,this._panel=null,this._hassInitialized=!1,this._entities=[],this._entityList=[],this._entityHash="",this._activeView="devices",this._settingsOpen=!1,this._settingsValues={},this._settingsDirty=!1,this._shoppingData=null,this._shoppingLoading=!1,this._detailEntity=null,this._flashGeneration=0,this._ignoredEntities=null,this._filters={status:{value:["active","low"]}},this._dashboardLoading=!1,this._chartData=null,this._chartLoading=!1,this._chartDevSettings={...qa},this._detailChart=null,this._sorting={column:"level",direction:"asc"},this._flashCleanupTimer=null,this._refreshTimer=null,this._entityMap=new Map,this._prevLevels=new Map,this._recentlyChanged=new Map,this._cachedColumns=null,this._refreshing=!1,this._expandedGroups={}}set hass(t){const e=this._hass?.connection;this._hass=t;const i=!this._hassInitialized,s=!i&&t?.connection&&t.connection!==e;this._processHassUpdate(i||s),this._hassInitialized=!0}get hass(){return this._hass}set panel(t){this._panel=t}get panel(){return this._panel}get _basePath(){return`/${this._panel?.url_path||"juice-patrol"}`}connectedCallback(){super.connectedCallback(),this.requestUpdate(),this._escapeHandler=t=>{"Escape"===t.key&&this._closeOverlays()},window.addEventListener("keydown",this._escapeHandler),this._popstateHandler=()=>{this._syncViewFromUrl()},window.addEventListener("popstate",this._popstateHandler),this._locationChangedHandler=()=>{this._syncViewFromUrl()},window.addEventListener("location-changed",this._locationChangedHandler),this._visibilityHandler=()=>{"visible"===document.visibilityState&&this._hass&&(this._processHassUpdate(!1),"shopping"===this._activeView&&this._loadShoppingList(),"dashboard"===this._activeView&&(this._shoppingData||this._loadShoppingList()))},document.addEventListener("visibilitychange",this._visibilityHandler)}disconnectedCallback(){super.disconnectedCallback();for(const t of["_flashCleanupTimer","_refreshTimer"])this[t]&&(clearTimeout(this[t]),this[t]=null);this._escapeHandler&&(window.removeEventListener("keydown",this._escapeHandler),this._escapeHandler=null),this._popstateHandler&&(window.removeEventListener("popstate",this._popstateHandler),this._popstateHandler=null),this._locationChangedHandler&&(window.removeEventListener("location-changed",this._locationChangedHandler),this._locationChangedHandler=null),this._visibilityHandler&&(document.removeEventListener("visibilitychange",this._visibilityHandler),this._visibilityHandler=null),this._detachScrollTracker()}firstUpdated(){this._syncViewFromUrl();const t=new URLSearchParams(window.location.search).get("entity");t&&(this._highlightEntity=t)}_syncViewFromUrl(){const t=window.location.pathname,e=`${this._basePath}/detail/`;if(t.startsWith(e)){const i=decodeURIComponent(t.slice(e.length));return i&&i!==this._detailEntity&&(this._detailEntity=i),void(this._activeView="detail")}return t===this._basePath||t===`${this._basePath}/`||t===`${this._basePath}/dashboard`||t===`${this._basePath}/dashboard/`?("detail"===this._activeView&&(this._detailEntity=null),"dashboard"!==this._activeView&&(this._activeView="dashboard",this._shoppingData||this._loadShoppingList()),void(this._entities=this._entityList)):t===`${this._basePath}/shopping`||t===`${this._basePath}/shopping/`?("detail"===this._activeView&&(this._detailEntity=null),"shopping"!==this._activeView&&(this._activeView="shopping",this._loadShoppingList()),void(this._entities=this._entityList)):("detail"===this._activeView&&(this._detailEntity=null),this._activeView="devices",void(this._entities=this._entityList))}updated(t){if("detail"===this._activeView&&!this._chartLoading&&this._chartData&&t.has("_chartData")&&requestAnimationFrame(()=>Ya(this)),"dashboard"===this._activeView&&this._fleetData&&(t.has("_entities")||t.has("_activeView"))){const e=t.has("_activeView"),i=JSON.stringify(this._fleetData)+JSON.stringify((this._healthByTypeData||[]).map(t=>({type:t.type,n:t.devices.length,b:t.buckets})));(e||i!==this._lastFleetHash)&&(this._lastFleetHash=i,requestAnimationFrame(()=>rr(this)))}t.has("_entities")&&(!this._highlightApplied&&this._highlightEntity&&this._applyDeepLinkHighlight(),"detail"===this._activeView&&this._detailEntity&&!this._entityMap.get(this._detailEntity)&&this._closeDetail()),t.has("_activeView")&&("devices"===this._activeView?this._attachScrollTracker():this._detachScrollTracker())}_processHassUpdate(t){if(!this._hass)return;const e=this._entityHash;this._updateEntities();this._entityHash!==e&&(this._entityMap=new Map(this._entityList.map(t=>[t.sourceEntity,t])),"detail"!==this._activeView&&(this._entities=this._entityList)),"detail"===this._activeView&&this._detailEntity&&null===this._chartData&&!this._chartLoading&&this._entityMap.get(this._detailEntity)&&this._loadDetailHistory(this._detailEntity),t&&(this._loadConfig(),this._loadIgnored())}_updateEntities(){if(!this._hass)return;const t=this._hass.states,e=new Map;for(const[i,s]of Object.entries(t)){const t=s.attributes||{},n=t.source_entity;if(!n)continue;if(i.includes("lowest_battery")||i.includes("attention_needed"))continue;const o=i.split(".")[0],a=t.device_class,r="sensor"===o&&"battery"===a,l="binary_sensor"===o&&"battery"===a,c="binary_sensor"===o&&"problem"===a;if(!r&&!l&&!c)continue;e.has(n)||e.set(n,{sourceEntity:n,name:t.source_name||n,level:null,isLow:!1,isStale:!1,batteryType:null,batteryTypeSource:null,threshold:null,lastReplaced:null,isRechargeable:!1,rechargeableReason:null,chargingState:null,manufacturer:null,model:null,platform:null,_searchText:"",_statusFilter:"active"});const h=e.get(n);if(r){const e=parseFloat(s.state);h.level=isNaN(e)?null:e,h.batteryType=t.battery_type||null,h.batteryTypeSource=t.battery_type_source||null,h.threshold=null!=t.threshold?parseFloat(t.threshold):null,h.lastReplaced=t.last_replaced??null,h.isRechargeable=t.is_rechargeable??!1,h.rechargeableReason=t.rechargeable_reason??null,h.chargingState=t.charging_state?t.charging_state.toLowerCase():null,h.manufacturer=t.manufacturer??null,h.model=t.model??null,h.platform=t.platform??null}else l?h.isLow="on"===s.state:c&&(h.isStale="on"===s.state)}const i=this._ignoredEntities?new Set(this._ignoredEntities):null,s=[];let n=!1;for(const[o,a]of e){if(i&&i.has(o))continue;const e=[a.name,o,a.batteryType,a.manufacturer,a.model,a.platform];a._searchText=e.filter(Boolean).join(" ").toLowerCase(),a._levelSort=null!==a.level?a.level:999,null===a.level||"unavailable"===t[o]?.state?a._statusFilter="unavailable":a.isStale?a._statusFilter="stale":a.isLow?a._statusFilter="low":a._statusFilter="active";const r=this._prevLevels.get(o);void 0!==r&&null!==a.level&&a.level!==r&&(this._recentlyChanged.set(o,Date.now()),n=!0),null!==a.level&&this._prevLevels.set(o,a.level),s.push(a)}n&&(this._flashGeneration++,this._flashCleanupTimer&&clearTimeout(this._flashCleanupTimer),this._flashCleanupTimer=setTimeout(()=>{this._recentlyChanged.clear(),this._flashGeneration++,this._flashCleanupTimer=null},3e3)),this._entityList=s,this._entityHash=s.map(t=>`${t.sourceEntity}:${t.level}:${t.isLow}:${t.isStale}:${t.chargingState}:${t.batteryType}`).join("|")}_getFilteredEntities(){const t=this._filters.status?.value||[],e=this._filters.battery?.value||[],i=this._filters.batteryType?.value||[],s=this._filters.levelRange?.value,n=s&&(null!=s.min||null!=s.max);return 0!==t.length||0!==e.length||0!==i.length||n?this._entities.filter(o=>{if(t.length>0&&!t.includes(o._statusFilter))return!1;if(e.length>0){const t=o.isRechargeable?"rechargeable":"disposable";if(!e.includes(t))return!1}if(i.length>0){const t=o.isRechargeable?"Rechargeable":(()=>{const t=o.batteryType?.match(/^(?:\d+\s*[×x]\s*)?(.+)$/i);return t?t[1].trim():o.batteryType||"Unknown"})();if(!i.includes(t))return!1}if(n){if(null==o.level)return!1;const t=Math.ceil(o.level);if(null!=s.min&&t<s.min)return!1;if(null!=s.max&&t>s.max)return!1}return!0}):this._entities}_navigateToDevicesWithTypeFilter(t){this._filters={batteryType:{value:[t]}},window.history.pushState(null,"",`${this._basePath}/devices`),this._syncViewFromUrl()}_navigateToDevicesWithLevelFilter(t,e,i){const s={levelRange:{value:{min:t,max:e}},...i};this._filters=s,window.history.pushState(null,"",`${this._basePath}/devices`),this._syncViewFromUrl()}_getDevice(t){return this._entityMap.get(t)}_formatLevel(t){return Pt(t)}_showToast(t,e){It(this,t,e)}_applyDeepLinkHighlight(){this._highlightEntity&&!this._highlightApplied&&(this._highlightApplied=!0,this._openDetail(this._highlightEntity))}async _loadConfig(){if(this._hass)try{const t=await this._hass.callWS({type:"juice_patrol/get_settings"});this._configEntry={entry_id:t.entry_id},this._settingsValues={low_threshold:t.low_threshold,stale_timeout:t.stale_timeout}}catch(t){console.warn("Juice Patrol: failed to load config",t)}}async _saveSettings(){if(this._hass&&this._configEntry)try{await this._hass.callWS({type:"juice_patrol/update_settings",...this._settingsValues}),this._settingsDirty=!1,this._settingsOpen=!1,this._invalidateColumns(),this._showToast("Settings saved")}catch(t){this._showToast("Failed to save settings")}}async _markReplaced(t){const e=this._getDevice(t);e?.isRechargeable?function(t,e){hr(t,e,{title:"Replace rechargeable battery?",preamble:'\n      <p style="margin-top:0">This device is marked as <strong>rechargeable</strong>, which means\n      Juice Patrol expects its battery level to gradually rise and fall as it\n      charges and discharges. Charging is detected automatically — you don\'t\n      need to do anything when you plug it in.</p>\n      <p><strong>"Mark as replaced"</strong> is for when you physically swap the\n      battery pack itself (e.g. a worn-out cell that no longer holds charge).</p>\n      <p>If you just recharged the device, you can ignore this — Juice Patrol\n      already handles that.</p>'})}(this,t):function(t,e){hr(t,e,{title:"Mark battery as replaced?",preamble:'\n      <p style="margin-top:0">This tells Juice Patrol that you swapped the batteries.\n      A replacement marker will be added to the timeline. All history is preserved\n      for life expectancy tracking.</p>\n      <p style="color:var(--secondary-text-color); font-size:0.9em; margin-bottom:0">\n      This can be undone later if needed.</p>'})}(this,t)}async _doMarkReplaced(t,e){try{const i={type:"juice_patrol/mark_replaced",entity_id:t};null!=e&&(i.timestamp=e),await this._hass.callWS(i),this._showToast("Battery marked as replaced")}catch(t){this._showToast("Failed to mark as replaced")}}_undoReplacement(t){dr(this,{title:"Undo battery replacement?",bodyHtml:'\n        <p style="margin-top:0">This will remove the most recent replacement marker\n        from the timeline. Battery history is never deleted.</p>\n        <p style="color:var(--secondary-text-color); font-size:0.9em; margin-bottom:0">\n        You can always re-add it later if needed.</p>',confirmLabel:"Undo replacement",confirmVariant:"danger",onConfirm:()=>this._doUndoReplacement(t)})}async _doUndoReplacement(t){try{await this._hass.callWS({type:"juice_patrol/undo_replacement",entity_id:t}),this._showToast("Replacement undone")}catch(t){this._showToast("Failed to undo replacement")}}_undoReplacementAt(t,e){dr(this,{title:"Remove replacement?",bodyHtml:`<p style="margin-top:0">Remove the replacement marker from <strong>${new Date(1e3*e).toLocaleDateString()}</strong>? Battery history is never deleted.</p>`,confirmLabel:"Remove",confirmVariant:"danger",onConfirm:async()=>{try{await this._hass.callWS({type:"juice_patrol/undo_replacement",entity_id:t,timestamp:e}),this._showToast("Replacement removed")}catch(t){this._showToast("Failed to remove replacement")}}})}_confirmRefresh(){dr(this,{title:"Force refresh",bodyHtml:'\n        <p>Juice Patrol automatically updates whenever a battery level changes and runs a full scan every hour.</p>\n        <p>A manual refresh clears all cached data and re-evaluates every device from scratch. This is only needed if:</p>\n        <ul style="margin:8px 0;padding-left:20px">\n          <li>You changed a battery type or threshold and want immediate results</li>\n          <li>Data seems stale or incorrect after a HA restart</li>\n          <li>You imported historical recorder data</li>\n        </ul>\n        <p style="color:var(--secondary-text-color);font-size:13px">This may take a moment depending on the number of devices.</p>\n      ',confirmLabel:"Refresh now",onConfirm:()=>this._refresh()})}async _refresh(){if(!this._refreshing){this._refreshing=!0;try{await this._hass.callWS({type:"juice_patrol/refresh"}),this._showToast("Data refreshed"),("shopping"===this._activeView||"dashboard"===this._activeView)&&setTimeout(()=>this._loadShoppingList(),500)}catch(t){this._showToast("Refresh failed")}this._refreshTimer=setTimeout(()=>{this._refreshTimer=null,this._refreshing=!1},2e3)}}async _loadIgnored(){if(this._hass)try{const t=await this._hass.callWS({type:"juice_patrol/get_ignored"});this._ignoredEntities=t.ignored||[]}catch(t){console.warn("Juice Patrol: failed to load ignored",t)}}async _ignoreDevice(t){try{await this._hass.callWS({type:"juice_patrol/set_ignored",entity_id:t,ignored:!0}),this._showToast("Device ignored"),this._loadIgnored()}catch(t){this._showToast("Failed to ignore device")}}async _unignoreDevice(t){try{await this._hass.callWS({type:"juice_patrol/set_ignored",entity_id:t,ignored:!1}),this._showToast("Device restored"),this._loadIgnored()}catch(t){this._showToast("Failed to unignore device")}}async _loadShoppingList(){if(this._hass){this._shoppingLoading=!0;try{this._shoppingData=await this._hass.callWS({type:"juice_patrol/get_shopping_list"})}catch(t){if(!this._shoppingRetried)return this._shoppingRetried=!0,this._shoppingLoading=!1,void setTimeout(()=>{this._shoppingRetried=!1,this._loadShoppingList()},1e3);this._shoppingRetried=!1,console.error("Juice Patrol: failed to load shopping list",t),this._shoppingData=null}this._shoppingLoading=!1}}async _saveBatteryType(t,e){try{await this._hass.callWS({type:"juice_patrol/set_battery_type",entity_id:t,battery_type:e||""}),this._showToast(e?`Battery type set to ${e}`:"Battery type cleared")}catch(t){this._showToast("Failed to set battery type")}}_openDetail(t){this._saveScrollPosition(),Xa(this),this._chartData=null,this._detailEntity=t,this._activeView="detail";const e=`${this._basePath}/detail/${encodeURIComponent(t)}`;history.pushState({view:"detail",entityId:t},"",e),this._loadDetailHistory(t)}_closeDetail(){Xa(this),this._chartData=null,history.back()}_updateChartDev(t,e){this._chartDevSettings={...this._chartDevSettings,[t]:e},Ya(this)}async _loadDetailHistory(t){const e=this._getDevice(t);if(e?.sourceEntity){this._chartLoading=!0;try{this._chartData=await async function(t,e){const i=await t.callWS({type:"recorder/statistics_during_period",start_time:lr,statistic_ids:[e],period:"hour",types:["mean"]}),s=i?.[e];if(Array.isArray(s)&&s.length>0)return s.filter(t=>null!=t.mean).map(t=>({x:t.start,y:cr(t.mean)}));const n=await t.callWS({type:"history/history_during_period",start_time:lr,entity_ids:[e],significant_changes_only:!0,no_attributes:!0,minimal_response:!0}),o=n?.[e];return Array.isArray(o)&&0!==o.length?o.filter(t=>"unavailable"!==t.s&&"unknown"!==t.s&&null!=t.s).map(t=>{const e=parseFloat(t.s);return isNaN(e)?null:{x:Math.round(1e3*t.lu),y:cr(e)}}).filter(Boolean):[]}(this._hass,e.sourceEntity)}catch(t){this._chartData=[]}finally{this._chartLoading=!1}}}_getScroller(){const t=this.shadowRoot?.querySelector("hass-tabs-subpage-data-table"),e=t?.shadowRoot?.querySelector("ha-data-table");return e?.shadowRoot?.querySelector(".scroller")||null}_saveScrollPosition(){const t=this._getScroller();if(t){const e={...history.state||{},scrollPosition:t.scrollTop};history.replaceState(e,"")}}_attachScrollTracker(){if(this._scrollTracker)return;let t=0;const e=()=>{const i=this._getScroller();if(!i)return void(++t<20&&requestAnimationFrame(e));if(this._scrollTracker)return;let s=!1;this._scrollTracker=()=>{s||(s=!0,requestAnimationFrame(()=>{this._saveScrollPosition(),s=!1}))},i.addEventListener("scroll",this._scrollTracker,{passive:!0}),this._scrollTrackerTarget=i;const n=history.state?.scrollPosition;if(n>0){let t=0;const e=()=>{i.scrollHeight>i.clientHeight+n?i.scrollTop=n:++t<30&&requestAnimationFrame(e)};requestAnimationFrame(e)}};requestAnimationFrame(e)}_detachScrollTracker(){this._scrollTracker&&this._scrollTrackerTarget&&(this._scrollTrackerTarget.removeEventListener("scroll",this._scrollTracker),this._scrollTracker=null,this._scrollTrackerTarget=null)}_toggleSettings(){this._settingsOpen=!this._settingsOpen,this._settingsOpen&&(this._settingsDirty=!1,this._loadConfig())}_handleSettingInput(t){const e=t.target.dataset.key;this._settingsValues={...this._settingsValues,[e]:parseFloat(t.target.value)},this._settingsDirty=!0}_cancelSettings(){this._settingsOpen=!1,this._loadConfig()}_handleMenuSelect(t,e){const i=t.detail?.item?.value;if(!i||!e)return;const s=this._getDevice(e);"detail"===i?this._openDetail(e):"replace"===i?this._markReplaced(e):"type"===i?this._setBatteryType(e,s?.batteryType):"undo-replace"===i?this._undoReplacement(e):"ignore"===i&&this._ignoreDevice(e)}_closeOverlays(){this.shadowRoot.querySelectorAll("ha-dialog").forEach(t=>{t.open=!1,t.remove()})}_handleRowClick(t){const e=t.detail?.id;e&&this._openDetail(e)}_handleSortingChanged(t){this._sorting=t.detail}_setBatteryType(t,e){!function(t,e,i){t.shadowRoot.querySelectorAll("ha-dialog").forEach(t=>{t.open=!1,t.remove()});const s=t._getDevice(e),n=i||s?.batteryType||"",o=Rt(n),a=["CR2032","CR2450","CR123A","AA","AAA"],r=["18650","LR44","CR1632","CR1616","CR2025","9V"];let l=[],c=null;const h=n&&!a.includes(o.type)&&o.type;if(n&&a.includes(o.type)){for(let t=0;t<o.count;t++)l.push(o.type);c=o.type}else if(h){for(let t=0;t<o.count;t++)l.push(o.type);c=o.type}let d=s?.isRechargeable||!1,p=!1,u=null,g=null,f=!1,m="",b=!1;const x=document.createElement("ha-dialog");x.open=!0,x.headerTitle="Set battery type",t.shadowRoot.appendChild(x);const y=document.createElement("div");y.slot="headerActionItems",y.style.position="relative";const v=document.createElement("ha-icon-button"),_=document.createElement("ha-icon");_.icon="mdi:dots-vertical",v.appendChild(_),y.appendChild(v);let w=!1;const k=document.createElement("div");k.className="jp-overflow-menu",k.style.display="none",k.innerHTML='\n    <button class="jp-overflow-menu-item">\n      <ha-icon icon="mdi:information-outline" style="--mdc-icon-size:18px; color:var(--secondary-text-color)"></ha-icon>\n      Information\n    </button>\n  ',y.appendChild(k),x.appendChild(y),v.addEventListener("click",t=>{t.stopPropagation(),w=!w,k.style.display=w?"block":"none"}),k.querySelector(".jp-overflow-menu-item").addEventListener("click",()=>{w=!1,k.style.display="none",S(),t.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:e}}))}),document.addEventListener("mousedown",t=>{const e=t.composedPath();!w||e.includes(k)||e.includes(v)||(w=!1,k.style.display="none")});const S=()=>{document.removeEventListener("mousedown",A),x.open=!1,x.remove()},$=t=>{if(!t)return"";const e=document.createElement("div");return e.textContent=t,e.innerHTML},M=()=>null!==c&&a.includes(c),C=document.createElement("div");x.appendChild(C);const A=t=>{if(!f)return;const e=C.querySelector(".jp-custom-popover"),i=C.querySelector(".jp-custom-trigger"),s=t.composedPath();e&&!s.includes(e)&&i&&!s.includes(i)&&(f=!1,T())};document.addEventListener("mousedown",A);const T=()=>{const t=l.length>0&&!a.includes(l[0]);l.length;const i=l.length>0?l.map((t,e)=>`<span class="jp-badge-chip" data-idx="${e}" title="Click to remove">${$(t)} ✕</span>`).join(""):'<span class="jp-unknown-chip">\n           <ha-icon icon="mdi:battery" style="--mdc-icon-size:14px"></ha-icon>\n           Unknown\n         </span>',n=l.length>0?`<span class="jp-count-badge">${l.length}</span>`:"",o=f?`<div class="jp-custom-popover">\n           <div class="jp-custom-popover-input">\n             <div style="color:var(--primary-color); font-size:11px; font-weight:500; margin-bottom:4px">Custom type</div>\n             <input type="text" class="jp-custom-input" placeholder="e.g. 18650, LR44…"\n                    value="${$(m)}">\n             <div style="height:2px; background:var(--primary-color); border-radius:1px; margin-top:4px"></div>\n           </div>\n           ${r.map(t=>`<button class="jp-custom-suggestion" data-suggestion="${$(t)}">\n                <ha-icon icon="mdi:battery" style="--mdc-icon-size:16px; color:var(--secondary-text-color)"></ha-icon>\n                ${$(t)}\n              </button>`).join("")}\n         </div>`:"";C.innerHTML=`\n      <div class="jp-dialog-desc">${$(s?.name||e)}</div>\n\n      <div class="jp-rechargeable-section">\n        <ha-switch class="jp-rechargeable-sw" ${d?"checked":""}></ha-switch>\n        <div class="jp-rechargeable-labels">\n          <div style="font-size:14px; font-weight:500">Rechargeable device</div>\n          <div style="font-size:12px; color:var(--secondary-text-color); margin-top:2px">\n            Device with an internal, non-removable rechargeable battery</div>\n        </div>\n      </div>\n\n      <hr style="border:none; border-top:1px solid var(--divider-color); margin:12px 0">\n\n      <div class="jp-batteries-section${d?" jp-disabled-overlay":""}">\n        <div class="jp-batteries-heading">\n          <span style="font-size:14px; font-weight:500">Batteries</span>\n          ${n}\n        </div>\n        <div style="font-size:12px; color:var(--secondary-text-color); margin-bottom:10px; line-height:16px">\n          Select the type of battery used by this device. Click the type again to add more &mdash; one click per battery in the device.\n        </div>\n\n        <div class="jp-badge-field">\n          <div class="jp-badge-field-chips">${i}</div>\n          <ha-icon-button class="jp-autodetect-btn${b?" spinning":""}"\n            title="Autodetect battery type" ${b?"disabled":""}>\n            <ha-icon icon="mdi:auto-fix"></ha-icon>\n          </ha-icon-button>\n        </div>\n\n        <div class="jp-dialog-presets" style="position:relative">\n          ${a.map(e=>{const i=null!==c&&e!==c||t;return`<button class="jp-preset${i?" disabled":""}${e===c?" active":""}"\n              data-type="${e}" ${i?"disabled":""}>${e}</button>`}).join("")}\n          <button class="jp-custom-trigger${M()?" disabled":""}${f?" active":""}"\n            ${M()?"disabled":""}>\n            <span style="font-size:15px; line-height:1">+</span> Custom type…\n          </button>\n          ${o}\n        </div>\n      </div>\n\n      <div class="jp-dialog-actions">\n        <ha-button variant="neutral" class="jp-dialog-clear">Clear</ha-button>\n        <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>\n        <ha-button class="jp-dialog-save">Save</ha-button>\n      </div>\n    `,D()},D=()=>{C.querySelectorAll(".jp-badge-chip").forEach(t=>{t.addEventListener("click",()=>{d||(l.splice(parseInt(t.dataset.idx),1),0===l.length&&(c=null),T())})}),C.querySelectorAll(".jp-preset[data-type]:not([disabled])").forEach(t=>{t.addEventListener("click",()=>{if(d)return;const e=t.dataset.type;c=e,l.push(e),T()})});const i=C.querySelector(".jp-rechargeable-sw");i&&i.addEventListener("change",()=>{d=i.checked,p=!0,d?(u=[...l],g=c,f=!1,m=""):u&&(l=u,c=g,u=null,g=null),T()}),C.querySelector(".jp-autodetect-btn")?.addEventListener("click",async()=>{if(!b&&!d){b=!0,T();try{const i=await t._hass.callWS({type:"juice_patrol/detect_battery_type",entity_id:e});if(i.battery_type){const e=Rt(i.battery_type);if(l=[],c=null,a.includes(e.type)){for(let t=0;t<e.count;t++)l.push(e.type);c=e.type}else{for(let t=0;t<e.count;t++)l.push(e.type);c=e.type}It(t,`Detected: ${i.battery_type} (${i.source})`)}else It(t,"Could not auto-detect battery type")}catch(e){console.warn("Juice Patrol: auto-detect failed",e),It(t,function(t,e){return t?.message?.includes("unknown command")?`Restart Home Assistant to enable ${e}`:`${e} failed`}(e,"auto-detection"))}b=!1,T()}}),C.querySelector(".jp-custom-trigger:not([disabled])")?.addEventListener("click",()=>{d||(f=!f,T(),f&&requestAnimationFrame(()=>{C.querySelector(".jp-custom-input")?.focus()}))});const s=C.querySelector(".jp-custom-input");s&&(s.addEventListener("input",t=>{m=t.target.value}),s.addEventListener("keydown",t=>{"Enter"===t.key&&m.trim()&&(l=[m.trim()],c=m.trim(),f=!1,m="",T()),"Escape"===t.key&&(f=!1,T())})),C.querySelectorAll(".jp-custom-suggestion").forEach(t=>{t.addEventListener("click",()=>{const e=t.dataset.suggestion;l=[e],c=e,f=!1,m="",T()})}),x.addEventListener("closed",S),C.querySelector(".jp-dialog-cancel")?.addEventListener("click",S),C.querySelector(".jp-dialog-clear")?.addEventListener("click",()=>{l=[],c=null,f=!1,m="",T()}),C.querySelector(".jp-dialog-save")?.addEventListener("click",async()=>{let i;var s,o;l.length>0?(s=c,o=l.length,i=s?o>1?`${o}× ${s}`:s:""):i=null,S();const a=i!==(n||null);if(p)try{await t._hass.callWS({type:"juice_patrol/set_rechargeable",entity_id:e,is_rechargeable:d})}catch(e){It(t,"Failed to update rechargeable state")}a&&await t._saveBatteryType(e,i)})};T()}(this,t,e)}_invalidateColumns(){this._cachedColumns=null}get _tabs(){const t=this._basePath;return[{path:`${t}/dashboard`,name:"Dashboard",iconPath:"M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z"},{path:`${t}/devices`,name:"Devices",iconPath:"M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z"},{path:`${t}/shopping`,name:"Shopping List",iconPath:"M17,18A2,2 0 0,1 19,20A2,2 0 0,1 17,22C15.89,22 15,21.1 15,20C15,18.89 15.89,18 17,18M1,2H4.27L5.21,4H20A1,1 0 0,1 21,5C21,5.17 20.95,5.34 20.88,5.5L17.3,11.97C16.96,12.58 16.3,13 15.55,13H8.1L7.2,14.63L7.17,14.75A0.25,0.25 0 0,0 7.42,15H19V17H7C5.89,17 5,16.1 5,15C5,14.65 5.09,14.32 5.24,14.04L6.6,11.59L3,4H1V2M7,18A2,2 0 0,1 9,20A2,2 0 0,1 7,22C5.89,22 5,21.1 5,20C5,18.89 5.89,18 7,18M16,11L18.78,6H6.14L8.5,11H16Z"}]}get _route(){return{path:`/${"detail"===this._activeView?"devices":this._activeView}`,prefix:this._basePath}}_renderToolbarIcons(){return"detail"===this._activeView?this._renderDetailToolbarIcons():B`
      <div slot="toolbar-icon" style="display:flex">
        <ha-icon-button
          id="refreshBtn"
          class=${this._refreshing?"spinning":""}
          title="Force refresh"
          .disabled=${this._refreshing}
          @click=${this._confirmRefresh}
        >
          <ha-icon icon="mdi:refresh"></ha-icon>
        </ha-icon-button>
      </div>
    `}_renderDetailToolbarIcons(){const t=this._detailEntity,e=this._getDevice(t);return B`
      <div slot="toolbar-icon" style="display:flex">
        <ha-dropdown
          @wa-select=${i=>{const s=i.detail?.item?.value;s&&t&&("replace"===s?this._markReplaced(t):"type"===s?this._setBatteryType(t,e?.batteryType):"ignore"===s&&this._ignoreDevice(t))}}
        >
          <ha-icon-button slot="trigger">
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </ha-icon-button>
          <ha-dropdown-item value="replace">
            <ha-icon slot="icon" icon="mdi:battery-sync"></ha-icon>
            Mark as replaced
          </ha-dropdown-item>
          <ha-dropdown-item value="type">
            <ha-icon slot="icon" icon="mdi:battery-heart-variant"></ha-icon>
            Set battery type
          </ha-dropdown-item>
          <wa-divider></wa-divider>
          <ha-dropdown-item value="ignore">
            <ha-icon slot="icon" icon="mdi:eye-off"></ha-icon>
            Ignore device
          </ha-dropdown-item>
        </ha-dropdown>
      </div>
    `}get _activeFilterCount(){const t=["active","low"];return Object.entries(this._filters).filter(([e,i])=>"levelRange"===e?i.value&&(null!=i.value.min||null!=i.value.max):!(!Array.isArray(i.value)||!i.value.length)&&("status"!==e||i.value.length!==t.length||!i.value.every(e=>t.includes(e)))).length}get _columns(){return this._cachedColumns||(this._cachedColumns=Ft(this)),this._cachedColumns}render(){if(!this._hass)return B`<div class="loading">Loading...</div>`;if("devices"===this._activeView)return this._renderDevicesView();const t="detail"===this._activeView,e="dashboard"===this._activeView;return B`
      <hass-tabs-subpage
        .hass=${this._hass}
        .narrow=${this.narrow}
        .tabs=${this._tabs}
        .route=${this._route}
        ?main-page=${!t}
        .backCallback=${t?()=>this._closeDetail():void 0}
      >
        ${this._renderToolbarIcons()}
        ${t?B`<div id="jp-content">${Qa(this)}</div>`:e?B`<div class="jp-padded">${ir(this)}</div>`:B`<div class="jp-padded">${tr(this)}</div>`}
      </hass-tabs-subpage>
    `}_renderDevicesView(){const t=this._getFilteredEntities();return B`
      <hass-tabs-subpage-data-table
        .hass=${this._hass}
        .narrow=${this.narrow}
        .tabs=${this._tabs}
        .route=${this._route}
        main-page
        .columns=${this._columns}
        .data=${t}
        .id=${"sourceEntity"}
        .searchLabel=${"Search "+t.length+" devices"}
        .noDataText=${"No devices match the current filter."}
        clickable
        .initialSorting=${this._sorting}
        has-filters
        .filters=${this._activeFilterCount}
        @row-click=${this._handleRowClick}
        @sorting-changed=${this._handleSortingChanged}
        @clear-filter=${this._clearFilters}
      >
        ${this._renderToolbarIcons()}
        ${this._renderFilterPane()}
      </hass-tabs-subpage-data-table>
    `}_renderFilterPane(){const t=this._filters.status?.value||[];return B`
      <ha-expansion-panel slot="filter-pane" outlined expanded header="Status">
        <ha-icon slot="leading-icon" icon="mdi:list-status" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-filter-list">
          ${[{value:"active",label:"Active",icon:"mdi:check-circle"},{value:"low",label:"Low battery",icon:"mdi:battery-alert"},{value:"stale",label:"Stale",icon:"mdi:clock-alert-outline"},{value:"unavailable",label:"Unavailable",icon:"mdi:help-circle-outline"}].map(e=>B`
            <label class="jp-filter-item">
              <ha-checkbox
                .checked=${t.includes(e.value)}
                @change=${t=>this._toggleFilter("status",e.value,t.target.checked)}
              ></ha-checkbox>
              <ha-icon icon=${e.icon} style="--mdc-icon-size:18px"></ha-icon>
              <span>${e.label}</span>
            </label>
          `)}
        </div>
      </ha-expansion-panel>
      <ha-expansion-panel slot="filter-pane" outlined header="Battery">
        <ha-icon slot="leading-icon" icon="mdi:battery" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-filter-list">
          ${[{value:"disposable",label:"Disposable",icon:"mdi:battery"},{value:"rechargeable",label:"Rechargeable",icon:"mdi:battery-charging"}].map(t=>B`
            <label class="jp-filter-item">
              <ha-checkbox
                .checked=${(this._filters.battery?.value||[]).includes(t.value)}
                @change=${e=>this._toggleFilter("battery",t.value,e.target.checked)}
              ></ha-checkbox>
              <ha-icon icon=${t.icon} style="--mdc-icon-size:18px"></ha-icon>
              <span>${t.label}</span>
            </label>
          `)}
        </div>
      </ha-expansion-panel>
      ${this._renderBatteryTypeFilterPane()}
      ${this._renderLevelRangeFilterPane()}
    `}_renderBatteryTypeFilterPane(){const t=new Map;for(const e of this._entities||[]){if(null==e.level)continue;let i;if(e.isRechargeable)i="Rechargeable";else{const t=e.batteryType?.match(/^(?:\d+\s*[×x]\s*)?(.+)$/i);i=t?t[1].trim():e.batteryType||"Unknown"}t.set(i,(t.get(i)||0)+1)}const e=[...t.entries()].sort((t,e)=>e[1]-t[1]).map(([t,e])=>({value:t,label:`${t} (${e})`}));if(0===e.length)return W;const i=this._filters.batteryType?.value||[];return B`
      <ha-expansion-panel slot="filter-pane" outlined
        .expanded=${i.length>0}
        header="Battery Type">
        <ha-icon slot="leading-icon" icon="mdi:battery-heart-variant" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-filter-list">
          ${e.map(t=>B`
            <label class="jp-filter-item">
              <ha-checkbox
                .checked=${i.includes(t.value)}
                @change=${e=>this._toggleFilter("batteryType",t.value,e.target.checked)}
              ></ha-checkbox>
              <span>${t.label}</span>
            </label>
          `)}
        </div>
      </ha-expansion-panel>
    `}_renderLevelRangeFilterPane(){const t=this._filters.levelRange?.value,e=t&&(null!=t.min||null!=t.max),i=t?.min??0,s=t?.max??100;return B`
      <ha-expansion-panel slot="filter-pane" outlined
        .expanded=${e}
        header="Battery Level">
        <ha-icon slot="leading-icon" icon="mdi:gauge" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-level-range">
          <div class="jp-level-slider-row">
            <span class="jp-level-label">Min</span>
            <ha-slider
              .min=${0} .max=${100} .step=${1}
              .value=${i}
              pin
              @change=${e=>{const i=parseInt(e.target.value,10);this._setLevelRange(0===i?null:i,t?.max??null)}}
            ></ha-slider>
            <span class="jp-level-value">${i}%</span>
          </div>
          <div class="jp-level-slider-row">
            <span class="jp-level-label">Max</span>
            <ha-slider
              .min=${0} .max=${100} .step=${1}
              .value=${s}
              pin
              @change=${e=>{const i=parseInt(e.target.value,10);this._setLevelRange(t?.min??null,100===i?null:i)}}
            ></ha-slider>
            <span class="jp-level-value">${s}%</span>
          </div>
          ${e?B`
            <div style="padding:0 16px 8px;text-align:right">
              <ha-button @click=${()=>this._setLevelRange(null,null)}>
                Clear
              </ha-button>
            </div>
          `:W}
        </div>
      </ha-expansion-panel>
    `}_setLevelRange(t,e){if(null==t&&null==e){const{levelRange:t,...e}=this._filters;this._filters={...e}}else this._filters={...this._filters,levelRange:{value:{min:t,max:e}}}}_toggleFilter(t,e,i){const s=this._filters[t]?.value||[],n=i?[...s,e]:s.filter(t=>t!==e);this._filters={...this._filters,[t]:{value:n}}}_clearFilters(){this._filters={}}_renderSettings(){const t=this._settingsValues;return B`
      <ha-card header="Settings" class="settings-card">
        <div class="card-content">
          ${this._renderSettingRow("Low battery threshold","Devices below this level trigger a juice_patrol_battery_low event.","low_threshold",t.low_threshold??20,1,99,"%")}
          ${this._renderSettingRow("Stale device timeout","Devices not reporting within this period are marked stale.","stale_timeout",t.stale_timeout??48,1,720,"hrs")}
        </div>
        <div class="card-actions">
          <ha-button variant="neutral" @click=${this._cancelSettings}>Cancel</ha-button>
          <ha-button
            .disabled=${!this._settingsDirty}
            @click=${this._saveSettings}
          >
            Save
          </ha-button>
        </div>
      </ha-card>
    `}_renderSettingRow(t,e,i,s,n,o,a){return B`
      <ha-settings-row narrow>
        <span slot="heading">${t}</span>
        <span slot="description">${e}</span>
        <ha-textfield
          type="number"
          .value=${String(s)}
          min=${n}
          max=${o}
          suffix=${a}
          data-key=${i}
          @input=${this._handleSettingInput}
        ></ha-textfield>
      </ha-settings-row>
    `}static get styles(){return Ht}});

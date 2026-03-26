/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,t=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),a=new WeakMap;let r=class{constructor(e,t,a){if(this._$cssResult$=!0,a!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const i=this.t;if(t&&void 0===e){const t=void 0!==i&&1===i.length;t&&(e=a.get(i)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&a.set(i,e))}return e}toString(){return this.cssText}};const s=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new r("string"==typeof e?e:e+"",void 0,i))(t)})(e):e,{is:n,defineProperty:o,getOwnPropertyDescriptor:l,getOwnPropertyNames:c,getOwnPropertySymbols:d,getPrototypeOf:p}=Object,h=globalThis,u=h.trustedTypes,g=u?u.emptyScript:"",v=h.reactiveElementPolyfillSupport,m=(e,t)=>e,b={toAttribute(e,t){switch(t){case Boolean:e=e?g:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},y=(e,t)=>!n(e,t),f={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:y};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),h.litPropertyMetadata??=new WeakMap;let _=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=f){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),a=this.getPropertyDescriptor(e,i,t);void 0!==a&&o(this.prototype,e,a)}}static getPropertyDescriptor(e,t,i){const{get:a,set:r}=l(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:a,set(t){const s=a?.call(this);r?.call(this,t),this.requestUpdate(e,s,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??f}static _$Ei(){if(this.hasOwnProperty(m("elementProperties")))return;const e=p(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(m("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(m("properties"))){const e=this.properties,t=[...c(e),...d(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(s(e))}else void 0!==e&&t.push(s(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const i=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((i,a)=>{if(t)i.adoptedStyleSheets=a.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const t of a){const a=document.createElement("style"),r=e.litNonce;void 0!==r&&a.setAttribute("nonce",r),a.textContent=t.cssText,i.appendChild(a)}})(i,this.constructor.elementStyles),i}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),a=this.constructor._$Eu(e,i);if(void 0!==a&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(t,i.type);this._$Em=e,null==r?this.removeAttribute(a):this.setAttribute(a,r),this._$Em=null}}_$AK(e,t){const i=this.constructor,a=i._$Eh.get(e);if(void 0!==a&&this._$Em!==a){const e=i.getPropertyOptions(a),r="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:b;this._$Em=a;const s=r.fromAttribute(t,e.type);this[a]=s??this._$Ej?.get(a)??s,this._$Em=null}}requestUpdate(e,t,i,a=!1,r){if(void 0!==e){const s=this.constructor;if(!1===a&&(r=this[e]),i??=s.getPropertyOptions(e),!((i.hasChanged??y)(r,t)||i.useDefault&&i.reflect&&r===this._$Ej?.get(e)&&!this.hasAttribute(s._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:a,wrapped:r},s){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,s??t??this[e]),!0!==r||void 0!==s)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===a&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,a=this[t];!0!==e||this._$AL.has(t)||void 0===a||this.C(t,void 0,i,a)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};_.elementStyles=[],_.shadowRootOptions={mode:"open"},_[m("elementProperties")]=new Map,_[m("finalized")]=new Map,v?.({ReactiveElement:_}),(h.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const x=globalThis,w=e=>e,$=x.trustedTypes,k=$?$.createPolicy("lit-html",{createHTML:e=>e}):void 0,S="$lit$",A=`lit$${Math.random().toFixed(9).slice(2)}$`,j="?"+A,E=`<${j}>`,T=document,C=()=>T.createComment(""),L=e=>null===e||"object"!=typeof e&&"function"!=typeof e,R=Array.isArray,D="[ \t\n\f\r]",z=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,H=/-->/g,M=/>/g,P=RegExp(`>|${D}(?:([^\\s"'>=/]+)(${D}*=${D}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),V=/'/g,U=/"/g,F=/^(?:script|style|textarea|title)$/i,O=(e=>(t,...i)=>({_$litType$:e,strings:t,values:i}))(1),N=Symbol.for("lit-noChange"),B=Symbol.for("lit-nothing"),I=new WeakMap,W=T.createTreeWalker(T,129);function q(e,t){if(!R(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==k?k.createHTML(t):t}const J=(e,t)=>{const i=e.length-1,a=[];let r,s=2===t?"<svg>":3===t?"<math>":"",n=z;for(let t=0;t<i;t++){const i=e[t];let o,l,c=-1,d=0;for(;d<i.length&&(n.lastIndex=d,l=n.exec(i),null!==l);)d=n.lastIndex,n===z?"!--"===l[1]?n=H:void 0!==l[1]?n=M:void 0!==l[2]?(F.test(l[2])&&(r=RegExp("</"+l[2],"g")),n=P):void 0!==l[3]&&(n=P):n===P?">"===l[0]?(n=r??z,c=-1):void 0===l[1]?c=-2:(c=n.lastIndex-l[2].length,o=l[1],n=void 0===l[3]?P:'"'===l[3]?U:V):n===U||n===V?n=P:n===H||n===M?n=z:(n=P,r=void 0);const p=n===P&&e[t+1].startsWith("/>")?" ":"";s+=n===z?i+E:c>=0?(a.push(o),i.slice(0,c)+S+i.slice(c)+A+p):i+A+(-2===c?t:p)}return[q(e,s+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),a]};class G{constructor({strings:e,_$litType$:t},i){let a;this.parts=[];let r=0,s=0;const n=e.length-1,o=this.parts,[l,c]=J(e,t);if(this.el=G.createElement(l,i),W.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(a=W.nextNode())&&o.length<n;){if(1===a.nodeType){if(a.hasAttributes())for(const e of a.getAttributeNames())if(e.endsWith(S)){const t=c[s++],i=a.getAttribute(e).split(A),n=/([.?@])?(.*)/.exec(t);o.push({type:1,index:r,name:n[2],strings:i,ctor:"."===n[1]?X:"?"===n[1]?ee:"@"===n[1]?te:Q}),a.removeAttribute(e)}else e.startsWith(A)&&(o.push({type:6,index:r}),a.removeAttribute(e));if(F.test(a.tagName)){const e=a.textContent.split(A),t=e.length-1;if(t>0){a.textContent=$?$.emptyScript:"";for(let i=0;i<t;i++)a.append(e[i],C()),W.nextNode(),o.push({type:2,index:++r});a.append(e[t],C())}}}else if(8===a.nodeType)if(a.data===j)o.push({type:2,index:r});else{let e=-1;for(;-1!==(e=a.data.indexOf(A,e+1));)o.push({type:7,index:r}),e+=A.length-1}r++}}static createElement(e,t){const i=T.createElement("template");return i.innerHTML=e,i}}function Y(e,t,i=e,a){if(t===N)return t;let r=void 0!==a?i._$Co?.[a]:i._$Cl;const s=L(t)?void 0:t._$litDirective$;return r?.constructor!==s&&(r?._$AO?.(!1),void 0===s?r=void 0:(r=new s(e),r._$AT(e,i,a)),void 0!==a?(i._$Co??=[])[a]=r:i._$Cl=r),void 0!==r&&(t=Y(e,r._$AS(e,t.values),r,a)),t}class Z{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,a=(e?.creationScope??T).importNode(t,!0);W.currentNode=a;let r=W.nextNode(),s=0,n=0,o=i[0];for(;void 0!==o;){if(s===o.index){let t;2===o.type?t=new K(r,r.nextSibling,this,e):1===o.type?t=new o.ctor(r,o.name,o.strings,this,e):6===o.type&&(t=new ie(r,this,e)),this._$AV.push(t),o=i[++n]}s!==o?.index&&(r=W.nextNode(),s++)}return W.currentNode=T,a}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class K{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,a){this.type=2,this._$AH=B,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=a,this._$Cv=a?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Y(this,e,t),L(e)?e===B||null==e||""===e?(this._$AH!==B&&this._$AR(),this._$AH=B):e!==this._$AH&&e!==N&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>R(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==B&&L(this._$AH)?this._$AA.nextSibling.data=e:this.T(T.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,a="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=G.createElement(q(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===a)this._$AH.p(t);else{const e=new Z(a,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=I.get(e.strings);return void 0===t&&I.set(e.strings,t=new G(e)),t}k(e){R(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,a=0;for(const r of e)a===t.length?t.push(i=new K(this.O(C()),this.O(C()),this,this.options)):i=t[a],i._$AI(r),a++;a<t.length&&(this._$AR(i&&i._$AB.nextSibling,a),t.length=a)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=w(e).nextSibling;w(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class Q{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,a,r){this.type=1,this._$AH=B,this._$AN=void 0,this.element=e,this.name=t,this._$AM=a,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=B}_$AI(e,t=this,i,a){const r=this.strings;let s=!1;if(void 0===r)e=Y(this,e,t,0),s=!L(e)||e!==this._$AH&&e!==N,s&&(this._$AH=e);else{const a=e;let n,o;for(e=r[0],n=0;n<r.length-1;n++)o=Y(this,a[i+n],t,n),o===N&&(o=this._$AH[n]),s||=!L(o)||o!==this._$AH[n],o===B?e=B:e!==B&&(e+=(o??"")+r[n+1]),this._$AH[n]=o}s&&!a&&this.j(e)}j(e){e===B?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class X extends Q{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===B?void 0:e}}class ee extends Q{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==B)}}class te extends Q{constructor(e,t,i,a,r){super(e,t,i,a,r),this.type=5}_$AI(e,t=this){if((e=Y(this,e,t,0)??B)===N)return;const i=this._$AH,a=e===B&&i!==B||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,r=e!==B&&(i===B||a);a&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class ie{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){Y(this,e)}}const ae=x.litHtmlPolyfillSupport;ae?.(G,K),(x.litHtmlVersions??=[]).push("3.3.2");const re=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class se extends _{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const a=i?.renderBefore??t;let r=a._$litPart$;if(void 0===r){const e=i?.renderBefore??null;a._$litPart$=r=new K(t.insertBefore(C(),e),e,void 0,i??{})}return r._$AI(e),r})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return N}}se._$litElement$=!0,se.finalized=!0,re.litElementHydrateSupport?.({LitElement:se});const ne=re.litElementPolyfillSupport;ne?.({LitElement:se}),(re.litElementVersions??=[]).push("4.2.2");const oe="--info-color",le="#039be5",ce=.8,de=[.25,.8],pe={var:"--success-color",fallback:"#43a047",opacity:.8},he={var:"--warning-color",fallback:"#ffa726",opacity:.8},ue={var:"--error-color",fallback:"#db4437",opacity:.8},ge="--disabled-text-color",ve="#999",me="--secondary-text-color",be="#999",ye="--primary-text-color",fe="#212121",_e="--ha-card-background",xe="#fff",we=`var(${"--primary-color"}, ${"#03a9f4"})`,$e=`var(${oe}, ${le})`,ke=`var(${pe.var}, ${pe.fallback})`,Se=`var(${he.var}, ${he.fallback})`,Ae=`var(${ue.var}, ${ue.fallback})`,je=`var(${ge}, ${ve})`,Ee=`var(${me}, ${be})`,Te="#F44336",Ce="#FF9800",Le="#4CAF50";function Re(e){const t=De(e);return null!==t?t+"%":"—"}function De(e){return null===e?null:Math.ceil(e)}function ze(e,t,i=20){if(null===e)return je;const a=t??i;return e<=a/2?Ae:e<=1.25*a?Se:ke}function He(e){if(!e)return{count:0,type:""};const t=e.match(/^(\d+)\s*[×x]\s*(.+)$/i);return t?{count:parseInt(t[1]),type:t[2].trim()}:{count:1,type:e.trim()}}function Me(e,t=!1){if(!e)return"—";try{const i=new Date(e);if(i.getTime()-Date.now()>31536e7)return"—";const a=new Date,r=i.getFullYear()===a.getFullYear();if(t){const e=r?{month:"short",day:"numeric"}:{month:"short",day:"numeric",year:"numeric"};return i.toLocaleDateString(void 0,e)+" "+i.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}return i.toLocaleDateString(void 0,{month:"short",day:"numeric",year:r?void 0:"numeric"})}catch{return"—"}}function Pe(e){const t=[],i=(e.name||"").toLowerCase();e.manufacturer&&!i.includes(e.manufacturer.toLowerCase())&&t.push(e.manufacturer),e.model&&!i.includes(e.model.toLowerCase())&&t.push(e.model);let a=t.join(" ");return a&&e.platform?a+=` · ${e.platform}`:!a&&e.platform&&(a=e.platform),a||null}function Ve(e,t,i){const a={message:t};i&&(a.action=i,a.duration=8e3),e.dispatchEvent(new CustomEvent("hass-notification",{bubbles:!0,composed:!0,detail:a}))}const Ue=((e,...t)=>{const a=1===e.length?e[0]:t.reduce((t,i,a)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[a+1],e[0]);return new r(a,e,i)})`
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
`;function Fe(e){const t=e._settingsValues?.low_threshold??20;return{icon:{title:"",type:"icon",moveable:!1,showNarrow:!0,template:e=>O`
        <ha-icon
          icon=${function(e){if(e.isRechargeable)return null===e.level?"mdi:battery-unknown":e.level<=10?"mdi:battery-charging-10":e.level<=30?"mdi:battery-charging-30":e.level<=60?"mdi:battery-charging-60":e.level<=90?"mdi:battery-charging-90":"mdi:battery-charging-100";const t=e.level;return null===t?"mdi:battery-unknown":t<=5?"mdi:battery-outline":t<=15?"mdi:battery-10":t<=25?"mdi:battery-20":t<=35?"mdi:battery-30":t<=45?"mdi:battery-40":t<=55?"mdi:battery-50":t<=65?"mdi:battery-60":t<=75?"mdi:battery-70":t<=85?"mdi:battery-80":t<=95?"mdi:battery-90":"mdi:battery"}(e)}
          style="color:${ze(e.level,e.threshold,t)}"
        ></ha-icon>
      `},name:{title:"Device",main:!0,sortable:!0,filterable:!0,filterKey:"_searchText",direction:"asc",flex:3,showNarrow:!0,template:t=>{const i=function(e,t){const i=[],a=t._settingsValues?.low_threshold??20;if(e.isLow){const t=e.threshold??a;i.push({label_id:"low",name:"LOW",color:Te,description:`Battery is at ${De(e.level)}%, below the ${t}% threshold`})}e.isStale&&i.push({label_id:"stale",name:"STALE",color:Ce,description:"No battery reading received within the stale timeout period"});e.isRechargeable&&function(e){return e.isRechargeable&&"charging"===e.chargingState}(e)&&i.push({label_id:"charging",name:"Charging",icon:"mdi:battery-charging",color:Le,description:"Currently charging"});return i}(t,e),a=Pe(t);return O`
          <div style="overflow:hidden">
            <span>${t.name||t.sourceEntity}</span>
            ${a?O`<div style=${"font-size:11px;color:var(--secondary-text-color);opacity:0.7;margin-top:1px"}>${a}</div>`:nothing}
            ${i.length?O`<div style=${"display:flex;flex-wrap:wrap;gap:4px;margin-top:4px"}>${i.map(e=>function(e){return O`
    <span title=${e.description||""} style="display:inline-flex;align-items:center;gap:2px;font-size:11px;font-weight:500;padding:1px 8px;border-radius:10px;white-space:nowrap;background:color-mix(in srgb, ${e.color} 20%, transparent);color:${e.color}">
      ${e.icon?O`<ha-icon icon=${e.icon} style="--mdc-icon-size:14px"></ha-icon>`:B}
      ${e.name}
    </span>
  `}(e))}</div>`:nothing}
          </div>
        `}},level:{title:"Level",sortable:!0,type:"numeric",valueColumn:"_levelSort",minWidth:"70px",maxWidth:"90px",showNarrow:!0,template:e=>{const i=ze(e.level,e.threshold,t);return O`<span style="color:${i};font-weight:500">${Re(e.level)}</span>`}},batteryType:{title:"Type",sortable:!0,minWidth:"60px",maxWidth:"90px",template:e=>O`<span
        style="font-size:12px;color:var(--secondary-text-color)"
        title=${e.batteryTypeSource?`Source: ${e.batteryTypeSource}`:""}
      >${e.batteryType||"—"}</span>`},actions:{title:"",type:"overflow-menu",showNarrow:!0,template:t=>O`
        <ha-dropdown
          @wa-select=${i=>{i.stopPropagation(),e._handleMenuSelect(i,t.sourceEntity)}}
          @click=${e=>e.stopPropagation()}
        >
          <ha-icon-button
            slot="trigger"
            @click=${e=>{e.stopPropagation();const t=e.currentTarget.closest("ha-dropdown");t&&(t.open?t.hideMenu():t.showMenu())}}
          >
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </ha-icon-button>
          ${function(e){return O`
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
      Set battery type${e?.batteryType?` (${e.batteryType})`:""}
    </ha-dropdown-item>
    <wa-divider></wa-divider>
    <ha-dropdown-item value="ignore">
      <ha-icon slot="icon" icon="mdi:eye-off"></ha-icon>
      Ignore device
    </ha-dropdown-item>
  `}(t)}
        </ha-dropdown>
      `}}}function Oe(e){const t=e._detailEntity,i=e._getDevice(t);return i?O`
    ${function(e,t){const i=e._detailEntity,a=ze(t.level,t.threshold),r=Pe(t),s=Re(t.level),n="battery level",o=null!=t.level?Math.max(0,Math.min(100,Math.ceil(t.level))):0,l=Re(t.level),c=a;return O`
    <ha-card style="container-type:inline-size;container-name:hero;margin-bottom:16px">
      <div class="hero-row">
        <div class="hero-left">
          <div class="hero-big" style="color:${a}">${s}</div>
          <div class="hero-unit">${n}</div>
        </div>
        <div class="hero-right">
          <div class="hero-name-row">
            <div class="hero-name">${t.name||t.sourceEntity}</div>
            <ha-icon-button
              .path=${"M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"}
              style="--mdc-icon-button-size:32px;--mdc-icon-size:20px;color:${Ee}"
              title="More info"
              @click=${()=>{e.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:i}}))}}
            ></ha-icon-button>
          </div>
          ${r?O`<div class="hero-sub">${r}</div>`:B}
          <div class="hero-bar-row">
            <div class="hero-bar">
              <div class="hero-bar-fill" style="width:${o}%;background:${a}"></div>
            </div>
            <div class="hero-bar-pct" style="color:${c}">${l}</div>
          </div>
        </div>
      </div>
      <div class="hero-stats">
        <div class="hero-stat">
          <div class="hero-stat-label">Battery Type</div>
          <div class="hero-stat-val">${t.batteryType||"—"}</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-label">Status</div>
          <div class="hero-stat-val">${t.isStale?"Stale":t.isLow?"Low":t.isRechargeable&&"charging"===t.chargingState?"Charging":"OK"}</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-label">Rechargeable</div>
          <div class="hero-stat-val">${t.isRechargeable?"Yes":"No"}</div>
        </div>
        ${t.lastReplaced?O`
        <div class="hero-stat">
          <div class="hero-stat-label">Last Replaced</div>
          <div class="hero-stat-val">${Me(1e3*t.lastReplaced,!0)}</div>
        </div>
        `:B}
      </div>
    </ha-card>
  `}(e,i)}
    ${function(e,t){const i=e._detailEntity;if(!i)return B;const a=e._getDevice(i);return a&&a.lastReplaced?O`
    <ha-card style="margin-bottom:16px">
      <ha-expansion-panel>
        <div slot="header" style="display:flex;align-items:center;gap:8px;width:100%">
          <ha-icon icon="mdi:history" style="--mdc-icon-size:20px;color:${Ee}"></ha-icon>
          <span style="flex:1;font-weight:500">Battery Replacement</span>
        </div>
        <div class="expansion-content" style="padding:16px">
          <p style="margin:0;color:var(--secondary-text-color)">
            Last replaced: ${Me(1e3*t.lastReplaced,!0)}
          </p>
        </div>
      </ha-expansion-panel>
    </ha-card>
  `:B}(e,i)}
  `:O`<div class="empty-state">Device not found</div>`}function Ne(e){if(e._shoppingLoading)return O`<div class="devices">
      <div class="empty-state">Loading shopping list...</div>
    </div>`;if(!e._shoppingData||!e._shoppingData.groups)return O`<div class="devices">
      <div class="empty-state">
        No shopping data available. Click refresh to load.
      </div>
    </div>`;const{groups:t,total_needed:i}=e._shoppingData;return 0===t.length?O`<div class="devices">
      <div class="empty-state">No battery devices found.</div>
    </div>`:O`
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
      ${t.filter(e=>e.needs_replacement>0&&"Unknown"!==e.battery_type).map(e=>O`
            <div class="summary-card shopping-need-card">
              <div class="value">${e.needs_replacement}</div>
              <div class="label">${e.battery_type}</div>
            </div>
          `)}
    </div>
    <div class="shopping-groups">
      ${t.map(t=>function(e,t){const i="Unknown"===t.battery_type,a=i?"mdi:help-circle-outline":"mdi:battery",r=!!e._expandedGroups[t.battery_type],s=`${t.battery_count} batter${1!==t.battery_count?"ies":"y"} in ${t.device_count} device${1!==t.device_count?"s":""}${t.needs_replacement>0?` — ${t.needs_replacement} need${1!==t.needs_replacement?"":"s"} replacement`:""}`;return O`
    <ha-expansion-panel
      outlined
      .expanded=${r}
      @expanded-changed=${i=>{const a={...e._expandedGroups};i.detail.expanded?a[t.battery_type]=!0:delete a[t.battery_type],e._expandedGroups=a}}
    >
      <ha-icon slot="leading-icon" icon=${a} style="--mdc-icon-size:20px"></ha-icon>
      <span slot="header" class="shopping-type">${t.battery_type}</span>
      <span slot="secondary">
        ${t.needs_replacement>0?O`<span class="shopping-need-badge">${t.needs_replacement}\u00d7</span> `:B}
        ${s}
      </span>
      <div class="shopping-devices-inner">
        ${t.devices.map(e=>{const t=ze(e.level,null),i=e.is_low,a=e.battery_count>1?` (${e.battery_count}×)`:"";return O`
            <div class="shopping-device ${i?"needs-replacement":""}">
              <span class="shopping-device-name"
                >${e.device_name}${a}</span
              >
              <span class="shopping-device-level" style="color:${t}">
                ${Re(e.level)}
              </span>
            </div>
          `})}
      </div>
    </ha-expansion-panel>
  `}(e,t))}
    </div>
    ${t.some(e=>"Unknown"===e.battery_type)?O`<div class="shopping-hint">
          <ha-icon
            icon="mdi:information-outline"
            style="--mdc-icon-size:16px"
          ></ha-icon>
          Devices with unknown battery type can be configured from the Devices tab.
        </div>`:B}
  `}const Be=[{key:"critical",min:0,max:10,label:"0–10%",color:ue},{key:"warning",min:11,max:50,label:"10–50%",color:he},{key:"healthy",min:51,max:100,label:"50–100%",color:pe}];function Ie(e){const t=e._entities||[],i=function(e){const t={};for(const e of Be)t[e.key]=0;let i=0,a=0,r=0,s=0;for(const n of e){if(s++,null==n.level){r++;continue}if(n.isStale){a++;continue}if(n.isRechargeable){i++;continue}const e=Math.ceil(n.level);for(const i of Be)if(e>=i.min&&e<=i.max){t[i.key]++;break}}return{buckets:t,rechargeable:i,stale:a,unavailable:r,total:s}}(t);e._fleetData=i;const a=function(e){return e.filter(e=>null!=e.level&&!e.isRechargeable&&!e.isStale).sort((e,t)=>e.level-t.level).slice(0,5)}(t),r=function(e){const t={};for(const i of e){if(null==i.level)continue;let e;if(i.isRechargeable)e="Rechargeable";else{const t=i.batteryType?.match(/^(?:\d+\s*[×x]\s*)?(.+)$/i);e=t?t[1].trim():i.batteryType||"Unknown"}t[e]||(t[e]={type:e,devices:[],isRechargeable:"Rechargeable"===e}),t[e].devices.push(i)}const i=Object.values(t).sort((e,t)=>t.devices.length-e.devices.length);for(const e of i){e.buckets={};for(const t of Be)e.buckets[t.key]=0;for(const t of e.devices){const i=Math.ceil(t.level);for(const t of Be)if(i>=t.min&&i<=t.max){e.buckets[t.key]++;break}}}return i}(t);e._healthByTypeData=r;const s=function(e){let t=0,i=0,a=0,r=0;for(const s of e)null!=s.level&&(s.isRechargeable||(i++,a+=s.level,r++,s.isLow||t++));return{readiness:i>0?Math.round(t/i*100):100,aboveThreshold:t,totalDisposable:i,avgLevel:r>0?Math.round(a/r):0}}(t);return O`
    <div class="jp-dashboard">
      ${function(e,t){const i=t.readiness>=80?ke:t.readiness>=50?Se:Ae;return O`
    <ha-card>
      <div class="db-card-header">
        <span class="db-card-title">Overview</span>
        <span class="jp-badge neutral">${e.total} devices</span>
      </div>
      <div id="jp-fleet-chart" style="padding:4px 8px"></div>
      <div class="db-overview-stats">
        <div class="db-stat">
          <span class="db-stat-value" style="color:${i}">${t.readiness}%</span>
          <span class="db-stat-label">Fleet Readiness</span>
          <span class="db-stat-sub">${t.aboveThreshold} of ${t.totalDisposable} disposable above threshold</span>
        </div>
        <div class="db-stat">
          <span class="db-stat-value" style="color:${t.avgLevel<=10?Ae:t.avgLevel<=50?Se:ke}">${t.avgLevel}%</span>
          <span class="db-stat-label">Average Level</span>
          <span class="db-stat-sub">Across all disposable devices</span>
        </div>
      </div>
    </ha-card>
  `}(i,s)}
      <div class="db-bottom-row">
        ${function(e,t){if(!t.length)return O`
      <ha-card>
        <div class="db-card-header">
          <span class="db-card-title">Lowest Battery</span>
          <span class="jp-badge neutral">No devices</span>
        </div>
        <div class="empty-state" style="padding:24px">No battery devices found.</div>
      </ha-card>
    `;return O`
    <ha-card>
      <div class="db-card-header">
        <span class="db-card-title">Lowest Battery</span>
      </div>
      <div class="card-content" style="padding-top:0">
        <table class="att-table">
          <thead><tr><th>Device</th><th>Level</th><th>Type</th></tr></thead>
          <tbody>
            ${t.map(t=>{const i=De(t.level),a=ze(t.level,t.threshold??20);return O`
                <tr class="att-row" @click=${()=>e._openDetail(t.sourceEntity)}>
                  <td class="name-cell">${t.name}</td>
                  <td>
                    <div class="level-indicator">
                      <span style="color:${a};font-weight:500">${i}%</span>
                      <div class="level-bar">
                        <div class="level-bar-fill" style="width:${i}%;background:${a}"></div>
                      </div>
                    </div>
                  </td>
                  <td class="dim">${t.batteryType||"—"}</td>
                </tr>
              `})}
          </tbody>
        </table>
      </div>
    </ha-card>
  `}(e,a)}
        ${n=r,O`
    <ha-card>
      <div class="db-card-header">
        <span class="db-card-title">Health by Battery Type</span>
        <span class="jp-badge primary">${n.length} type${1!==n.length?"s":""}</span>
      </div>
      <div class="card-content">
        <div class="type-health-list">
          ${n.map(e=>O`
            <div class="type-health-row">
              <span class="th-type" style="color:${e.isRechargeable?$e:we}">${e.type}</span>
              <div id="jp-type-chart-${We(e.type)}" class="th-chart-container"></div>
              <span class="th-count">${e.devices.length}</span>
            </div>
          `)}
        </div>
      </div>
    </ha-card>
  `}
      </div>
    </div>
  `;var n}function We(e){return e.replace(/[^a-z0-9]/gi,"_").toLowerCase()}function qe(e,t,i){return getComputedStyle(e).getPropertyValue(t).trim()||i}function Je(e,t,{categories:i,series:a,total:r,xMax:s,clickHandler:n},o,l){const c=e.shadowRoot?.getElementById(t);if(!c)return;const d=(t,i)=>qe(e,t,i),p=d(me,be),h=d(_e,d("--card-background-color",xe)),u=d(ye,fe),g={xAxis:{type:"value",show:!1,max:s||"dataMax"},yAxis:{type:"category",show:!1,data:[""]},legend:l?{show:!0,bottom:0,left:"center",textStyle:{color:p,fontSize:11},itemWidth:10,itemHeight:10,itemGap:14,icon:"roundRect",selectedMode:!0}:{show:!1},tooltip:{trigger:"item",backgroundColor:h,borderColor:d("--divider-color","rgba(0,0,0,0.12)"),textStyle:{color:u,fontSize:12},formatter:e=>`${e.seriesName}: ${e.value} device${1!==e.value?"s":""}`},grid:{left:8,right:8,top:6,bottom:l?40:6,containLabel:!1}};let v=e[o];v&&c.contains(v)||(v=document.createElement("ha-chart-base"),c.innerHTML="",c.appendChild(v),e[o]=v),v.hass=e._hass;const m=l?"90px":"32px";v.height=m,v.style.height=m,v.style.display="block",v.style.cursor="pointer",!v._jpClickBound&&n&&(v.addEventListener("chart-click",e=>{const t=e.detail?.seriesName;if(!t)return;const a=i.find(e=>e.name===t);a&&n(a)}),v._jpClickBound=!0),requestAnimationFrame(()=>{v.data=a,v.options=g})}function Ge(e,t,i){const a=(t,i)=>qe(e,t,i),r=a(ye,fe),s=Be.length,n=Be.map((e,i)=>{const r=t.buckets[e.key],n=t.isRechargeable?a(oe,le):a(e.color.var,e.color.fallback),[o,l]=de,c=t.isRechargeable?o+i/(s-1)*(l-o):e.color.opacity;return{name:e.label,value:r,color:n,opacity:c,levelMin:e.min,levelMax:e.max}}).filter(e=>e.value>0),o=n.map(e=>({name:e.name,type:"bar",stack:"type",data:[e.value],itemStyle:{color:e.color,opacity:e.opacity,borderRadius:0},barWidth:"80%",label:{show:e.value>0,position:"inside",formatter:`${e.value}`,fontSize:10,fontWeight:500,color:r},emphasis:{focus:"series"}}));return{categories:n,series:o,total:t.devices.length,xMax:i,clickHandler:i=>{e._navigateToDevicesWithLevelFilter(i.levelMin,i.levelMax,{batteryType:{value:[t.type]}})}}}const Ye=async function(e){if(!customElements.get("ha-chart-base"))try{await(window.loadCardHelpers?.()),await new Promise(e=>setTimeout(e,100))}catch(e){}if(!customElements.get("ha-chart-base"))return;e._fleetData&&Je(e,"jp-fleet-chart",function(e){const t=e._fleetData,i=(t,i)=>qe(e,t,i),a=i(ye,fe),r=[...Be.map(e=>({name:e.label,value:t.buckets[e.key],color:i(e.color.var,e.color.fallback),opacity:e.color.opacity,levelMin:e.min,levelMax:e.max})),{name:"Rechargeable",value:t.rechargeable,color:i(oe,le),opacity:ce,filter:"rechargeable"},{name:"Stale",value:t.stale,color:i(ge,ve),opacity:.5,filter:"stale"},{name:"Unavailable",value:t.unavailable,color:i(ge,ve),opacity:.3,filter:"unavailable"}],s=r.map(e=>({name:e.name,type:"bar",stack:"fleet",data:[e.value],itemStyle:{color:e.color,opacity:e.opacity,borderRadius:0},barWidth:"60%",label:{show:e.value>0,position:"inside",formatter:`${e.value}`,fontSize:11,fontWeight:500,color:a},emphasis:{focus:"series"}})),n=t=>{null!=t.levelMin?e._navigateToDevicesWithLevelFilter(t.levelMin,t.levelMax):"rechargeable"===t.filter?e._navigateToDevicesWithLevelFilter(null,null,{battery:{value:["rechargeable"]}}):"stale"===t.filter?e._navigateToDevicesWithLevelFilter(null,null,{status:{value:["stale"]}}):"unavailable"===t.filter&&e._navigateToDevicesWithLevelFilter(null,null,{status:{value:["unavailable"]}})};return{categories:r,series:s,total:t.total,clickHandler:n}}(e),"_fleetChartEl",!0);const t=e._healthByTypeData;if(t&&t.length){const i=Math.max(...t.map(e=>e.devices.length));for(const a of t)Je(e,`jp-type-chart-${We(a.type)}`,Ge(e,a,i),`_typeChart_${We(a.type)}`,!1)}};function Ze(e,t,{title:i,preamble:a}){const r=document.createElement("ha-dialog");r.open=!0,r.headerTitle=i,e.shadowRoot.appendChild(r);const s=()=>{r.open=!1,r.remove()},n=document.createElement("div");n.innerHTML=`\n    ${a}\n    <ha-expansion-panel outlined style="margin: 8px 0">\n      <span slot="header">Advanced: set custom date</span>\n      <div style="padding: 8px 0">\n        <p style="margin-top:0; color:var(--secondary-text-color); font-size:0.9em">\n          Register a past battery replacement by selecting the date and time it occurred.</p>\n        <input type="datetime-local" class="jp-datetime-input"\n          style="width:100%; padding:8px; border:1px solid var(--divider-color, #ddd);\n                 border-radius:4px; background:var(--card-background-color, #fff);\n                 color:var(--primary-text-color); font-size:14px; box-sizing:border-box" />\n      </div>\n    </ha-expansion-panel>\n    <div class="jp-dialog-actions">\n      <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>\n      <ha-button class="jp-dialog-confirm">Mark as replaced</ha-button>\n    </div>\n  `,r.appendChild(n),n.querySelector(".jp-dialog-cancel").addEventListener("click",s),n.querySelector(".jp-dialog-confirm").addEventListener("click",()=>{const i=n.querySelector(".jp-datetime-input");let a;i&&i.value&&(a=new Date(i.value).getTime()/1e3),s(),e._doMarkReplaced(t,a)})}function Ke(e,{title:t,bodyHtml:i,onConfirm:a,confirmLabel:r,confirmVariant:s}){const n=document.createElement("ha-dialog");n.open=!0,n.headerTitle=t,e.shadowRoot.appendChild(n);const o=()=>{n.open=!1,n.remove()},l=document.createElement("div");l.innerHTML=`\n    ${i}\n    <div class="jp-dialog-actions">\n      <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>\n      <ha-button class="jp-dialog-confirm" ${s?`variant="${s}"`:""}>${r||"Confirm"}</ha-button>\n    </div>\n  `,n.appendChild(l),l.querySelector(".jp-dialog-cancel").addEventListener("click",o),l.querySelector(".jp-dialog-confirm").addEventListener("click",()=>{o(),a()})}customElements.define("juice-patrol-panel",class extends se{static get properties(){return{narrow:{type:Boolean},_entities:{state:!0},_activeView:{state:!0},_settingsOpen:{state:!0},_settingsValues:{state:!0},_settingsDirty:{state:!0},_shoppingData:{state:!0},_shoppingLoading:{state:!0},_detailEntity:{state:!0},_flashGeneration:{state:!0},_refreshing:{state:!0},_ignoredEntities:{state:!0},_filters:{state:!0},_dashboardData:{state:!0},_dashboardLoading:{state:!0}}}constructor(){super(),this._hass=null,this._panel=null,this._hassInitialized=!1,this._entities=[],this._entityList=[],this._entityHash="",this._activeView="devices",this._settingsOpen=!1,this._settingsValues={},this._settingsDirty=!1,this._shoppingData=null,this._shoppingLoading=!1,this._detailEntity=null,this._flashGeneration=0,this._ignoredEntities=null,this._filters={status:{value:["active","low"]}},this._dashboardData=null,this._dashboardLoading=!1,this._sorting={column:"level",direction:"asc"},this._flashCleanupTimer=null,this._refreshTimer=null,this._entityMap=new Map,this._prevLevels=new Map,this._recentlyChanged=new Map,this._cachedColumns=null,this._refreshing=!1,this._expandedGroups={}}set hass(e){const t=this._hass?.connection;this._hass=e;const i=!this._hassInitialized,a=!i&&e?.connection&&e.connection!==t;this._processHassUpdate(i||a),this._hassInitialized=!0}get hass(){return this._hass}set panel(e){this._panel=e}get panel(){return this._panel}get _basePath(){return`/${this._panel?.url_path||"juice-patrol"}`}connectedCallback(){super.connectedCallback(),this.requestUpdate(),this._escapeHandler=e=>{"Escape"===e.key&&this._closeOverlays()},window.addEventListener("keydown",this._escapeHandler),this._popstateHandler=()=>{this._syncViewFromUrl()},window.addEventListener("popstate",this._popstateHandler),this._locationChangedHandler=()=>{this._syncViewFromUrl()},window.addEventListener("location-changed",this._locationChangedHandler),this._visibilityHandler=()=>{"visible"===document.visibilityState&&this._hass&&(this._processHassUpdate(!1),"shopping"===this._activeView&&this._loadShoppingList(),"dashboard"===this._activeView&&(this._shoppingData||this._loadShoppingList(),this._loadDashboardData()))},document.addEventListener("visibilitychange",this._visibilityHandler)}disconnectedCallback(){super.disconnectedCallback();for(const e of["_flashCleanupTimer","_refreshTimer"])this[e]&&(clearTimeout(this[e]),this[e]=null);this._escapeHandler&&(window.removeEventListener("keydown",this._escapeHandler),this._escapeHandler=null),this._popstateHandler&&(window.removeEventListener("popstate",this._popstateHandler),this._popstateHandler=null),this._locationChangedHandler&&(window.removeEventListener("location-changed",this._locationChangedHandler),this._locationChangedHandler=null),this._visibilityHandler&&(document.removeEventListener("visibilitychange",this._visibilityHandler),this._visibilityHandler=null),this._detachScrollTracker()}firstUpdated(){this._syncViewFromUrl();const e=new URLSearchParams(window.location.search).get("entity");e&&(this._highlightEntity=e)}_syncViewFromUrl(){const e=window.location.pathname,t=`${this._basePath}/detail/`;if(e.startsWith(t)){const i=decodeURIComponent(e.slice(t.length));return i&&i!==this._detailEntity&&(this._detailEntity=i),void(this._activeView="detail")}return e===this._basePath||e===`${this._basePath}/`||e===`${this._basePath}/dashboard`||e===`${this._basePath}/dashboard/`?("detail"===this._activeView&&(this._detailEntity=null),"dashboard"!==this._activeView&&(this._activeView="dashboard",this._shoppingData||this._loadShoppingList(),this._loadDashboardData()),void(this._entities=this._entityList)):e===`${this._basePath}/shopping`||e===`${this._basePath}/shopping/`?("detail"===this._activeView&&(this._detailEntity=null),"shopping"!==this._activeView&&(this._activeView="shopping",this._loadShoppingList()),void(this._entities=this._entityList)):("detail"===this._activeView&&(this._detailEntity=null),this._activeView="devices",void(this._entities=this._entityList))}updated(e){if("dashboard"===this._activeView&&this._fleetData&&(e.has("_entities")||e.has("_activeView"))){const t=e.has("_activeView"),i=JSON.stringify(this._fleetData)+JSON.stringify((this._healthByTypeData||[]).map(e=>({type:e.type,n:e.devices.length,b:e.buckets})));(t||i!==this._lastFleetHash)&&(this._lastFleetHash=i,requestAnimationFrame(()=>Ye(this)))}e.has("_entities")&&(!this._highlightApplied&&this._highlightEntity&&this._applyDeepLinkHighlight(),"detail"===this._activeView&&this._detailEntity&&!this._entityMap.get(this._detailEntity)&&this._closeDetail()),e.has("_activeView")&&("devices"===this._activeView?this._attachScrollTracker():this._detachScrollTracker())}_processHassUpdate(e){if(!this._hass)return;const t=this._entityHash;this._updateEntities();this._entityHash!==t&&(this._entityMap=new Map(this._entityList.map(e=>[e.sourceEntity,e])),"detail"!==this._activeView&&(this._entities=this._entityList)),e&&(this._loadConfig(),this._loadIgnored())}_updateEntities(){if(!this._hass)return;const e=this._hass.states,t=new Map;for(const[i,a]of Object.entries(e)){const e=a.attributes||{},r=e.source_entity;if(!r)continue;if(i.includes("lowest_battery")||i.includes("attention_needed"))continue;const s=i.split(".")[0],n=e.device_class,o="sensor"===s&&"battery"===n,l="binary_sensor"===s&&"battery"===n,c="binary_sensor"===s&&"problem"===n;if(!o&&!l&&!c)continue;t.has(r)||t.set(r,{sourceEntity:r,name:e.source_name||r,level:null,isLow:!1,isStale:!1,batteryType:null,batteryTypeSource:null,threshold:null,lastReplaced:null,isRechargeable:!1,rechargeableReason:null,chargingState:null,manufacturer:null,model:null,platform:null,_searchText:"",_statusFilter:"active"});const d=t.get(r);if(o){const t=parseFloat(a.state);d.level=isNaN(t)?null:t,d.batteryType=e.battery_type||null,d.batteryTypeSource=e.battery_type_source||null,d.threshold=null!=e.threshold?parseFloat(e.threshold):null,d.lastReplaced=e.last_replaced??null,d.isRechargeable=e.is_rechargeable??!1,d.rechargeableReason=e.rechargeable_reason??null,d.chargingState=e.charging_state??null,d.manufacturer=e.manufacturer??null,d.model=e.model??null,d.platform=e.platform??null}else l?d.isLow="on"===a.state:c&&(d.isStale="on"===a.state)}const i=this._ignoredEntities?new Set(this._ignoredEntities):null,a=[];let r=!1;for(const[s,n]of t){if(i&&i.has(s))continue;const t=[n.name,s,n.batteryType,n.manufacturer,n.model,n.platform];n._searchText=t.filter(Boolean).join(" ").toLowerCase(),n._levelSort=null!==n.level?n.level:999,null===n.level||"unavailable"===e[s]?.state?n._statusFilter="unavailable":n.isStale?n._statusFilter="stale":n.isLow?n._statusFilter="low":n._statusFilter="active";const o=this._prevLevels.get(s);void 0!==o&&null!==n.level&&n.level!==o&&(this._recentlyChanged.set(s,Date.now()),r=!0),null!==n.level&&this._prevLevels.set(s,n.level),a.push(n)}r&&(this._flashGeneration++,this._flashCleanupTimer&&clearTimeout(this._flashCleanupTimer),this._flashCleanupTimer=setTimeout(()=>{this._recentlyChanged.clear(),this._flashGeneration++,this._flashCleanupTimer=null},3e3)),this._entityList=a,this._entityHash=a.map(e=>`${e.sourceEntity}:${e.level}:${e.isLow}:${e.isStale}:${e.chargingState}:${e.batteryType}`).join("|")}_getFilteredEntities(){const e=this._filters.status?.value||[],t=this._filters.battery?.value||[],i=this._filters.batteryType?.value||[],a=this._filters.levelRange?.value,r=a&&(null!=a.min||null!=a.max);return 0!==e.length||0!==t.length||0!==i.length||r?this._entities.filter(s=>{if(e.length>0&&!e.includes(s._statusFilter))return!1;if(t.length>0){const e=s.isRechargeable?"rechargeable":"disposable";if(!t.includes(e))return!1}if(i.length>0){const e=s.isRechargeable?"Rechargeable":(()=>{const e=s.batteryType?.match(/^(?:\d+\s*[×x]\s*)?(.+)$/i);return e?e[1].trim():s.batteryType||"Unknown"})();if(!i.includes(e))return!1}if(r){if(null==s.level)return!1;const e=Math.ceil(s.level);if(null!=a.min&&e<a.min)return!1;if(null!=a.max&&e>a.max)return!1}return!0}):this._entities}_navigateToDevicesWithTypeFilter(e){this._filters={batteryType:{value:[e]}},window.history.pushState(null,"",`${this._basePath}/devices`),this._syncViewFromUrl()}_navigateToDevicesWithLevelFilter(e,t,i){const a={levelRange:{value:{min:e,max:t}},...i};this._filters=a,window.history.pushState(null,"",`${this._basePath}/devices`),this._syncViewFromUrl()}_getDevice(e){return this._entityMap.get(e)}_formatLevel(e){return Re(e)}_showToast(e,t){Ve(this,e,t)}_applyDeepLinkHighlight(){this._highlightEntity&&!this._highlightApplied&&(this._highlightApplied=!0,this._openDetail(this._highlightEntity))}async _loadConfig(){if(this._hass)try{const e=await this._hass.callWS({type:"juice_patrol/get_settings"});this._configEntry={entry_id:e.entry_id},this._settingsValues={low_threshold:e.low_threshold,stale_timeout:e.stale_timeout}}catch(e){console.warn("Juice Patrol: failed to load config",e)}}async _saveSettings(){if(this._hass&&this._configEntry)try{await this._hass.callWS({type:"juice_patrol/update_settings",...this._settingsValues}),this._settingsDirty=!1,this._settingsOpen=!1,this._invalidateColumns(),this._showToast("Settings saved")}catch(e){this._showToast("Failed to save settings")}}async _markReplaced(e){const t=this._getDevice(e);t?.isRechargeable?function(e,t){Ze(e,t,{title:"Replace rechargeable battery?",preamble:'\n      <p style="margin-top:0">This device is marked as <strong>rechargeable</strong>, which means\n      Juice Patrol expects its battery level to gradually rise and fall as it\n      charges and discharges. Charging is detected automatically — you don\'t\n      need to do anything when you plug it in.</p>\n      <p><strong>"Mark as replaced"</strong> is for when you physically swap the\n      battery pack itself (e.g. a worn-out cell that no longer holds charge).</p>\n      <p>If you just recharged the device, you can ignore this — Juice Patrol\n      already handles that.</p>'})}(this,e):function(e,t){Ze(e,t,{title:"Mark battery as replaced?",preamble:'\n      <p style="margin-top:0">This tells Juice Patrol that you swapped the batteries.\n      A replacement marker will be added to the timeline. All history is preserved\n      for life expectancy tracking.</p>\n      <p style="color:var(--secondary-text-color); font-size:0.9em; margin-bottom:0">\n      This can be undone later if needed.</p>'})}(this,e)}async _doMarkReplaced(e,t){try{const i={type:"juice_patrol/mark_replaced",entity_id:e};null!=t&&(i.timestamp=t),await this._hass.callWS(i),this._showToast("Battery marked as replaced")}catch(e){this._showToast("Failed to mark as replaced")}}_undoReplacement(e){Ke(this,{title:"Undo battery replacement?",bodyHtml:'\n        <p style="margin-top:0">This will remove the most recent replacement marker\n        from the timeline. Battery history is never deleted.</p>\n        <p style="color:var(--secondary-text-color); font-size:0.9em; margin-bottom:0">\n        You can always re-add it later if needed.</p>',confirmLabel:"Undo replacement",confirmVariant:"danger",onConfirm:()=>this._doUndoReplacement(e)})}async _doUndoReplacement(e){try{await this._hass.callWS({type:"juice_patrol/undo_replacement",entity_id:e}),this._showToast("Replacement undone")}catch(e){this._showToast("Failed to undo replacement")}}_undoReplacementAt(e,t){Ke(this,{title:"Remove replacement?",bodyHtml:`<p style="margin-top:0">Remove the replacement marker from <strong>${new Date(1e3*t).toLocaleDateString()}</strong>? Battery history is never deleted.</p>`,confirmLabel:"Remove",confirmVariant:"danger",onConfirm:async()=>{try{await this._hass.callWS({type:"juice_patrol/undo_replacement",entity_id:e,timestamp:t}),this._showToast("Replacement removed")}catch(e){this._showToast("Failed to remove replacement")}}})}_confirmRefresh(){Ke(this,{title:"Force refresh",bodyHtml:'\n        <p>Juice Patrol automatically updates whenever a battery level changes and runs a full scan every hour.</p>\n        <p>A manual refresh clears all cached data and re-evaluates every device from scratch. This is only needed if:</p>\n        <ul style="margin:8px 0;padding-left:20px">\n          <li>You changed a battery type or threshold and want immediate results</li>\n          <li>Data seems stale or incorrect after a HA restart</li>\n          <li>You imported historical recorder data</li>\n        </ul>\n        <p style="color:var(--secondary-text-color);font-size:13px">This may take a moment depending on the number of devices.</p>\n      ',confirmLabel:"Refresh now",onConfirm:()=>this._refresh()})}async _refresh(){if(!this._refreshing){this._refreshing=!0;try{await this._hass.callWS({type:"juice_patrol/refresh"}),this._showToast("Data refreshed"),"shopping"===this._activeView?setTimeout(()=>this._loadShoppingList(),500):"dashboard"===this._activeView&&setTimeout(()=>{this._loadShoppingList(),this._loadDashboardData()},500)}catch(e){this._showToast("Refresh failed")}this._refreshTimer=setTimeout(()=>{this._refreshTimer=null,this._refreshing=!1},2e3)}}async _loadIgnored(){if(this._hass)try{const e=await this._hass.callWS({type:"juice_patrol/get_ignored"});this._ignoredEntities=e.ignored||[]}catch(e){console.warn("Juice Patrol: failed to load ignored",e)}}async _ignoreDevice(e){try{await this._hass.callWS({type:"juice_patrol/set_ignored",entity_id:e,ignored:!0}),this._showToast("Device ignored"),this._loadIgnored()}catch(e){this._showToast("Failed to ignore device")}}async _unignoreDevice(e){try{await this._hass.callWS({type:"juice_patrol/set_ignored",entity_id:e,ignored:!1}),this._showToast("Device restored"),this._loadIgnored()}catch(e){this._showToast("Failed to unignore device")}}async _loadShoppingList(){if(this._hass){this._shoppingLoading=!0;try{this._shoppingData=await this._hass.callWS({type:"juice_patrol/get_shopping_list"})}catch(e){if(!this._shoppingRetried)return this._shoppingRetried=!0,this._shoppingLoading=!1,void setTimeout(()=>{this._shoppingRetried=!1,this._loadShoppingList()},1e3);this._shoppingRetried=!1,console.error("Juice Patrol: failed to load shopping list",e),this._shoppingData=null}this._shoppingLoading=!1}}async _loadDashboardData(){if(this._hass){this._dashboardLoading=!0;try{this._dashboardData=await this._hass.callWS({type:"juice_patrol/get_dashboard_data"})}catch(e){if(!this._dashboardRetried)return this._dashboardRetried=!0,this._dashboardLoading=!1,void setTimeout(()=>{this._dashboardRetried=!1,this._loadDashboardData()},1e3);this._dashboardRetried=!1,console.error("Juice Patrol: failed to load dashboard data",e),this._dashboardData=null}this._dashboardLoading=!1}}async _saveBatteryType(e,t){try{await this._hass.callWS({type:"juice_patrol/set_battery_type",entity_id:e,battery_type:t||""}),this._showToast(t?`Battery type set to ${t}`:"Battery type cleared")}catch(e){this._showToast("Failed to set battery type")}}_openDetail(e){this._saveScrollPosition(),this._detailEntity=e,this._activeView="detail";const t=`${this._basePath}/detail/${encodeURIComponent(e)}`;history.pushState({view:"detail",entityId:e},"",t)}_closeDetail(){history.back()}_getScroller(){const e=this.shadowRoot?.querySelector("hass-tabs-subpage-data-table"),t=e?.shadowRoot?.querySelector("ha-data-table");return t?.shadowRoot?.querySelector(".scroller")||null}_saveScrollPosition(){const e=this._getScroller();if(e){const t={...history.state||{},scrollPosition:e.scrollTop};history.replaceState(t,"")}}_attachScrollTracker(){if(this._scrollTracker)return;let e=0;const t=()=>{const i=this._getScroller();if(!i)return void(++e<20&&requestAnimationFrame(t));if(this._scrollTracker)return;let a=!1;this._scrollTracker=()=>{a||(a=!0,requestAnimationFrame(()=>{this._saveScrollPosition(),a=!1}))},i.addEventListener("scroll",this._scrollTracker,{passive:!0}),this._scrollTrackerTarget=i;const r=history.state?.scrollPosition;if(r>0){let e=0;const t=()=>{i.scrollHeight>i.clientHeight+r?i.scrollTop=r:++e<30&&requestAnimationFrame(t)};requestAnimationFrame(t)}};requestAnimationFrame(t)}_detachScrollTracker(){this._scrollTracker&&this._scrollTrackerTarget&&(this._scrollTrackerTarget.removeEventListener("scroll",this._scrollTracker),this._scrollTracker=null,this._scrollTrackerTarget=null)}_toggleSettings(){this._settingsOpen=!this._settingsOpen,this._settingsOpen&&(this._settingsDirty=!1,this._loadConfig())}_handleSettingInput(e){const t=e.target.dataset.key;this._settingsValues={...this._settingsValues,[t]:parseFloat(e.target.value)},this._settingsDirty=!0}_cancelSettings(){this._settingsOpen=!1,this._loadConfig()}_handleMenuSelect(e,t){const i=e.detail?.item?.value;if(!i||!t)return;const a=this._getDevice(t);"detail"===i?this._openDetail(t):"confirm"===i?this._confirmReplacement(t):"replace"===i?this._markReplaced(t):"type"===i?this._setBatteryType(t,a?.batteryType):"undo-replace"===i?this._undoReplacement(t):"ignore"===i&&this._ignoreDevice(t)}_closeOverlays(){this.shadowRoot.querySelectorAll("ha-dialog").forEach(e=>{e.open=!1,e.remove()})}_handleRowClick(e){const t=e.detail?.id;t&&this._openDetail(t)}_handleSortingChanged(e){this._sorting=e.detail}_setBatteryType(e,t){!function(e,t,i){e.shadowRoot.querySelectorAll("ha-dialog").forEach(e=>{e.open=!1,e.remove()});const a=e._getDevice(t),r=i||a?.batteryType||"",s=He(r),n=["CR2032","CR2450","CR123A","AA","AAA"],o=["18650","LR44","CR1632","CR1616","CR2025","9V"];let l=[],c=null;const d=r&&!n.includes(s.type)&&s.type;if(r&&n.includes(s.type)){for(let e=0;e<s.count;e++)l.push(s.type);c=s.type}else if(d){for(let e=0;e<s.count;e++)l.push(s.type);c=s.type}let p=a?.isRechargeable||!1,h=!1,u=null,g=null,v=!1,m="",b=!1;const y=document.createElement("ha-dialog");y.open=!0,y.headerTitle="Set battery type",e.shadowRoot.appendChild(y);const f=document.createElement("div");f.slot="headerActionItems",f.style.position="relative";const _=document.createElement("ha-icon-button"),x=document.createElement("ha-icon");x.icon="mdi:dots-vertical",_.appendChild(x),f.appendChild(_);let w=!1;const $=document.createElement("div");$.className="jp-overflow-menu",$.style.display="none",$.innerHTML='\n    <button class="jp-overflow-menu-item">\n      <ha-icon icon="mdi:information-outline" style="--mdc-icon-size:18px; color:var(--secondary-text-color)"></ha-icon>\n      Information\n    </button>\n  ',f.appendChild($),y.appendChild(f),_.addEventListener("click",e=>{e.stopPropagation(),w=!w,$.style.display=w?"block":"none"}),$.querySelector(".jp-overflow-menu-item").addEventListener("click",()=>{w=!1,$.style.display="none",k(),e.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}}))}),document.addEventListener("mousedown",e=>{const t=e.composedPath();!w||t.includes($)||t.includes(_)||(w=!1,$.style.display="none")});const k=()=>{document.removeEventListener("mousedown",E),y.open=!1,y.remove()},S=e=>{if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML},A=()=>null!==c&&n.includes(c),j=document.createElement("div");y.appendChild(j);const E=e=>{if(!v)return;const t=j.querySelector(".jp-custom-popover"),i=j.querySelector(".jp-custom-trigger"),a=e.composedPath();t&&!a.includes(t)&&i&&!a.includes(i)&&(v=!1,T())};document.addEventListener("mousedown",E);const T=()=>{const e=l.length>0&&!n.includes(l[0]);l.length;const i=l.length>0?l.map((e,t)=>`<span class="jp-badge-chip" data-idx="${t}" title="Click to remove">${S(e)} ✕</span>`).join(""):'<span class="jp-unknown-chip">\n           <ha-icon icon="mdi:battery" style="--mdc-icon-size:14px"></ha-icon>\n           Unknown\n         </span>',r=l.length>0?`<span class="jp-count-badge">${l.length}</span>`:"",s=v?`<div class="jp-custom-popover">\n           <div class="jp-custom-popover-input">\n             <div style="color:var(--primary-color); font-size:11px; font-weight:500; margin-bottom:4px">Custom type</div>\n             <input type="text" class="jp-custom-input" placeholder="e.g. 18650, LR44…"\n                    value="${S(m)}">\n             <div style="height:2px; background:var(--primary-color); border-radius:1px; margin-top:4px"></div>\n           </div>\n           ${o.map(e=>`<button class="jp-custom-suggestion" data-suggestion="${S(e)}">\n                <ha-icon icon="mdi:battery" style="--mdc-icon-size:16px; color:var(--secondary-text-color)"></ha-icon>\n                ${S(e)}\n              </button>`).join("")}\n         </div>`:"";j.innerHTML=`\n      <div class="jp-dialog-desc">${S(a?.name||t)}</div>\n\n      <div class="jp-rechargeable-section">\n        <ha-switch class="jp-rechargeable-sw" ${p?"checked":""}></ha-switch>\n        <div class="jp-rechargeable-labels">\n          <div style="font-size:14px; font-weight:500">Rechargeable device</div>\n          <div style="font-size:12px; color:var(--secondary-text-color); margin-top:2px">\n            Device with an internal, non-removable rechargeable battery</div>\n        </div>\n      </div>\n\n      <hr style="border:none; border-top:1px solid var(--divider-color); margin:12px 0">\n\n      <div class="jp-batteries-section${p?" jp-disabled-overlay":""}">\n        <div class="jp-batteries-heading">\n          <span style="font-size:14px; font-weight:500">Batteries</span>\n          ${r}\n        </div>\n        <div style="font-size:12px; color:var(--secondary-text-color); margin-bottom:10px; line-height:16px">\n          Select the type of battery used by this device. Click the type again to add more &mdash; one click per battery in the device.\n        </div>\n\n        <div class="jp-badge-field">\n          <div class="jp-badge-field-chips">${i}</div>\n          <ha-icon-button class="jp-autodetect-btn${b?" spinning":""}"\n            title="Autodetect battery type" ${b?"disabled":""}>\n            <ha-icon icon="mdi:auto-fix"></ha-icon>\n          </ha-icon-button>\n        </div>\n\n        <div class="jp-dialog-presets" style="position:relative">\n          ${n.map(t=>{const i=null!==c&&t!==c||e;return`<button class="jp-preset${i?" disabled":""}${t===c?" active":""}"\n              data-type="${t}" ${i?"disabled":""}>${t}</button>`}).join("")}\n          <button class="jp-custom-trigger${A()?" disabled":""}${v?" active":""}"\n            ${A()?"disabled":""}>\n            <span style="font-size:15px; line-height:1">+</span> Custom type…\n          </button>\n          ${s}\n        </div>\n      </div>\n\n      <div class="jp-dialog-actions">\n        <ha-button variant="neutral" class="jp-dialog-clear">Clear</ha-button>\n        <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>\n        <ha-button class="jp-dialog-save">Save</ha-button>\n      </div>\n    `,C()},C=()=>{j.querySelectorAll(".jp-badge-chip").forEach(e=>{e.addEventListener("click",()=>{p||(l.splice(parseInt(e.dataset.idx),1),0===l.length&&(c=null),T())})}),j.querySelectorAll(".jp-preset[data-type]:not([disabled])").forEach(e=>{e.addEventListener("click",()=>{if(p)return;const t=e.dataset.type;c=t,l.push(t),T()})});const i=j.querySelector(".jp-rechargeable-sw");i&&i.addEventListener("change",()=>{p=i.checked,h=!0,p?(u=[...l],g=c,v=!1,m=""):u&&(l=u,c=g,u=null,g=null),T()}),j.querySelector(".jp-autodetect-btn")?.addEventListener("click",async()=>{if(!b&&!p){b=!0,T();try{const i=await e._hass.callWS({type:"juice_patrol/detect_battery_type",entity_id:t});if(i.battery_type){const t=He(i.battery_type);if(l=[],c=null,n.includes(t.type)){for(let e=0;e<t.count;e++)l.push(t.type);c=t.type}else{for(let e=0;e<t.count;e++)l.push(t.type);c=t.type}Ve(e,`Detected: ${i.battery_type} (${i.source})`)}else Ve(e,"Could not auto-detect battery type")}catch(t){console.warn("Juice Patrol: auto-detect failed",t),Ve(e,function(e,t){return e?.message?.includes("unknown command")?`Restart Home Assistant to enable ${t}`:`${t} failed`}(t,"auto-detection"))}b=!1,T()}}),j.querySelector(".jp-custom-trigger:not([disabled])")?.addEventListener("click",()=>{p||(v=!v,T(),v&&requestAnimationFrame(()=>{j.querySelector(".jp-custom-input")?.focus()}))});const a=j.querySelector(".jp-custom-input");a&&(a.addEventListener("input",e=>{m=e.target.value}),a.addEventListener("keydown",e=>{"Enter"===e.key&&m.trim()&&(l=[m.trim()],c=m.trim(),v=!1,m="",T()),"Escape"===e.key&&(v=!1,T())})),j.querySelectorAll(".jp-custom-suggestion").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.suggestion;l=[t],c=t,v=!1,m="",T()})}),y.addEventListener("closed",k),j.querySelector(".jp-dialog-cancel")?.addEventListener("click",k),j.querySelector(".jp-dialog-clear")?.addEventListener("click",()=>{l=[],c=null,v=!1,m="",T()}),j.querySelector(".jp-dialog-save")?.addEventListener("click",async()=>{let i;var a,s;l.length>0?(a=c,s=l.length,i=a?s>1?`${s}× ${a}`:a:""):i=null,k();const n=i!==(r||null);if(h)try{await e._hass.callWS({type:"juice_patrol/set_rechargeable",entity_id:t,is_rechargeable:p})}catch(t){Ve(e,"Failed to update rechargeable state")}n&&await e._saveBatteryType(t,i)})};T()}(this,e,t)}_invalidateColumns(){this._cachedColumns=null}get _tabs(){const e=this._basePath;return[{path:`${e}/dashboard`,name:"Dashboard",iconPath:"M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z"},{path:`${e}/devices`,name:"Devices",iconPath:"M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z"},{path:`${e}/shopping`,name:"Shopping List",iconPath:"M17,18A2,2 0 0,1 19,20A2,2 0 0,1 17,22C15.89,22 15,21.1 15,20C15,18.89 15.89,18 17,18M1,2H4.27L5.21,4H20A1,1 0 0,1 21,5C21,5.17 20.95,5.34 20.88,5.5L17.3,11.97C16.96,12.58 16.3,13 15.55,13H8.1L7.2,14.63L7.17,14.75A0.25,0.25 0 0,0 7.42,15H19V17H7C5.89,17 5,16.1 5,15C5,14.65 5.09,14.32 5.24,14.04L6.6,11.59L3,4H1V2M7,18A2,2 0 0,1 9,20A2,2 0 0,1 7,22C5.89,22 5,21.1 5,20C5,18.89 5.89,18 7,18M16,11L18.78,6H6.14L8.5,11H16Z"}]}get _route(){return{path:`/${"detail"===this._activeView?"devices":this._activeView}`,prefix:this._basePath}}_renderToolbarIcons(){return"detail"===this._activeView?this._renderDetailToolbarIcons():O`
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
    `}_renderDetailToolbarIcons(){const e=this._detailEntity,t=this._getDevice(e);return O`
      <div slot="toolbar-icon" style="display:flex">
        <ha-dropdown
          @wa-select=${i=>{const a=i.detail?.item?.value;a&&e&&("replace"===a?this._markReplaced(e):"type"===a?this._setBatteryType(e,t?.batteryType):"ignore"===a&&this._ignoreDevice(e))}}
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
    `}get _activeFilterCount(){const e=["active","low"];return Object.entries(this._filters).filter(([t,i])=>"levelRange"===t?i.value&&(null!=i.value.min||null!=i.value.max):!(!Array.isArray(i.value)||!i.value.length)&&("status"!==t||i.value.length!==e.length||!i.value.every(t=>e.includes(t)))).length}get _columns(){return this._cachedColumns||(this._cachedColumns=Fe(this)),this._cachedColumns}render(){if(!this._hass)return O`<div class="loading">Loading...</div>`;if("devices"===this._activeView)return this._renderDevicesView();const e="detail"===this._activeView,t="dashboard"===this._activeView;return O`
      <hass-tabs-subpage
        .hass=${this._hass}
        .narrow=${this.narrow}
        .tabs=${this._tabs}
        .route=${this._route}
        ?main-page=${!e}
        .backCallback=${e?()=>this._closeDetail():void 0}
      >
        ${this._renderToolbarIcons()}
        ${e?O`<div id="jp-content">${Oe(this)}</div>`:t?O`<div class="jp-padded">${Ie(this)}</div>`:O`<div class="jp-padded">${Ne(this)}</div>`}
      </hass-tabs-subpage>
    `}_renderDevicesView(){const e=this._getFilteredEntities();return O`
      <hass-tabs-subpage-data-table
        .hass=${this._hass}
        .narrow=${this.narrow}
        .tabs=${this._tabs}
        .route=${this._route}
        main-page
        .columns=${this._columns}
        .data=${e}
        .id=${"sourceEntity"}
        .searchLabel=${"Search "+e.length+" devices"}
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
    `}_renderFilterPane(){const e=this._filters.status?.value||[];return O`
      <ha-expansion-panel slot="filter-pane" outlined expanded header="Status">
        <ha-icon slot="leading-icon" icon="mdi:list-status" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-filter-list">
          ${[{value:"active",label:"Active",icon:"mdi:check-circle"},{value:"low",label:"Low battery",icon:"mdi:battery-alert"},{value:"stale",label:"Stale",icon:"mdi:clock-alert-outline"},{value:"unavailable",label:"Unavailable",icon:"mdi:help-circle-outline"}].map(t=>O`
            <label class="jp-filter-item">
              <ha-checkbox
                .checked=${e.includes(t.value)}
                @change=${e=>this._toggleFilter("status",t.value,e.target.checked)}
              ></ha-checkbox>
              <ha-icon icon=${t.icon} style="--mdc-icon-size:18px"></ha-icon>
              <span>${t.label}</span>
            </label>
          `)}
        </div>
      </ha-expansion-panel>
      <ha-expansion-panel slot="filter-pane" outlined header="Battery">
        <ha-icon slot="leading-icon" icon="mdi:battery" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-filter-list">
          ${[{value:"disposable",label:"Disposable",icon:"mdi:battery"},{value:"rechargeable",label:"Rechargeable",icon:"mdi:battery-charging"}].map(e=>O`
            <label class="jp-filter-item">
              <ha-checkbox
                .checked=${(this._filters.battery?.value||[]).includes(e.value)}
                @change=${t=>this._toggleFilter("battery",e.value,t.target.checked)}
              ></ha-checkbox>
              <ha-icon icon=${e.icon} style="--mdc-icon-size:18px"></ha-icon>
              <span>${e.label}</span>
            </label>
          `)}
        </div>
      </ha-expansion-panel>
      ${this._renderBatteryTypeFilterPane()}
      ${this._renderLevelRangeFilterPane()}
    `}_renderBatteryTypeFilterPane(){const e=new Map;for(const t of this._entities||[]){if(null==t.level)continue;let i;if(t.isRechargeable)i="Rechargeable";else{const e=t.batteryType?.match(/^(?:\d+\s*[×x]\s*)?(.+)$/i);i=e?e[1].trim():t.batteryType||"Unknown"}e.set(i,(e.get(i)||0)+1)}const t=[...e.entries()].sort((e,t)=>t[1]-e[1]).map(([e,t])=>({value:e,label:`${e} (${t})`}));if(0===t.length)return B;const i=this._filters.batteryType?.value||[];return O`
      <ha-expansion-panel slot="filter-pane" outlined
        .expanded=${i.length>0}
        header="Battery Type">
        <ha-icon slot="leading-icon" icon="mdi:battery-heart-variant" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-filter-list">
          ${t.map(e=>O`
            <label class="jp-filter-item">
              <ha-checkbox
                .checked=${i.includes(e.value)}
                @change=${t=>this._toggleFilter("batteryType",e.value,t.target.checked)}
              ></ha-checkbox>
              <span>${e.label}</span>
            </label>
          `)}
        </div>
      </ha-expansion-panel>
    `}_renderLevelRangeFilterPane(){const e=this._filters.levelRange?.value,t=e&&(null!=e.min||null!=e.max),i=e?.min??0,a=e?.max??100;return O`
      <ha-expansion-panel slot="filter-pane" outlined
        .expanded=${t}
        header="Battery Level">
        <ha-icon slot="leading-icon" icon="mdi:gauge" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-level-range">
          <div class="jp-level-slider-row">
            <span class="jp-level-label">Min</span>
            <ha-slider
              .min=${0} .max=${100} .step=${1}
              .value=${i}
              pin
              @change=${t=>{const i=parseInt(t.target.value,10);this._setLevelRange(0===i?null:i,e?.max??null)}}
            ></ha-slider>
            <span class="jp-level-value">${i}%</span>
          </div>
          <div class="jp-level-slider-row">
            <span class="jp-level-label">Max</span>
            <ha-slider
              .min=${0} .max=${100} .step=${1}
              .value=${a}
              pin
              @change=${t=>{const i=parseInt(t.target.value,10);this._setLevelRange(e?.min??null,100===i?null:i)}}
            ></ha-slider>
            <span class="jp-level-value">${a}%</span>
          </div>
          ${t?O`
            <div style="padding:0 16px 8px;text-align:right">
              <ha-button @click=${()=>this._setLevelRange(null,null)}>
                Clear
              </ha-button>
            </div>
          `:B}
        </div>
      </ha-expansion-panel>
    `}_setLevelRange(e,t){if(null==e&&null==t){const{levelRange:e,...t}=this._filters;this._filters={...t}}else this._filters={...this._filters,levelRange:{value:{min:e,max:t}}}}_toggleFilter(e,t,i){const a=this._filters[e]?.value||[],r=i?[...a,t]:a.filter(e=>e!==t);this._filters={...this._filters,[e]:{value:r}}}_clearFilters(){this._filters={}}_renderSettings(){const e=this._settingsValues;return O`
      <ha-card header="Settings" class="settings-card">
        <div class="card-content">
          ${this._renderSettingRow("Low battery threshold","Devices below this level trigger a juice_patrol_battery_low event.","low_threshold",e.low_threshold??20,1,99,"%")}
          ${this._renderSettingRow("Stale device timeout","Devices not reporting within this period are marked stale.","stale_timeout",e.stale_timeout??48,1,720,"hrs")}
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
    `}_renderSettingRow(e,t,i,a,r,s,n){return O`
      <ha-settings-row narrow>
        <span slot="heading">${e}</span>
        <span slot="description">${t}</span>
        <ha-textfield
          type="number"
          .value=${String(a)}
          min=${r}
          max=${s}
          suffix=${n}
          data-key=${i}
          @input=${this._handleSettingInput}
        ></ha-textfield>
      </ha-settings-row>
    `}static get styles(){return Ue}});

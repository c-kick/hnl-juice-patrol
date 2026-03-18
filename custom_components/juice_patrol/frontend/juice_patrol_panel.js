/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,t=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),a=new WeakMap;let r=class{constructor(e,t,a){if(this._$cssResult$=!0,a!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const i=this.t;if(t&&void 0===e){const t=void 0!==i&&1===i.length;t&&(e=a.get(i)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&a.set(i,e))}return e}toString(){return this.cssText}};const s=(e,...t)=>{const a=1===e.length?e[0]:t.reduce((t,i,a)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[a+1],e[0]);return new r(a,e,i)},n=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new r("string"==typeof e?e:e+"",void 0,i))(t)})(e):e,{is:o,defineProperty:l,getOwnPropertyDescriptor:c,getOwnPropertyNames:d,getOwnPropertySymbols:h,getPrototypeOf:p}=Object,u=globalThis,g=u.trustedTypes,m=g?g.emptyScript:"",_=u.reactiveElementPolyfillSupport,y=(e,t)=>e,v={toAttribute(e,t){switch(t){case Boolean:e=e?m:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},b=(e,t)=>!o(e,t),f={attribute:!0,type:String,converter:v,reflect:!1,useDefault:!1,hasChanged:b};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=f){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),a=this.getPropertyDescriptor(e,i,t);void 0!==a&&l(this.prototype,e,a)}}static getPropertyDescriptor(e,t,i){const{get:a,set:r}=c(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:a,set(t){const s=a?.call(this);r?.call(this,t),this.requestUpdate(e,s,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??f}static _$Ei(){if(this.hasOwnProperty(y("elementProperties")))return;const e=p(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(y("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y("properties"))){const e=this.properties,t=[...d(e),...h(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(n(e))}else void 0!==e&&t.push(n(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const i=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((i,a)=>{if(t)i.adoptedStyleSheets=a.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const t of a){const a=document.createElement("style"),r=e.litNonce;void 0!==r&&a.setAttribute("nonce",r),a.textContent=t.cssText,i.appendChild(a)}})(i,this.constructor.elementStyles),i}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),a=this.constructor._$Eu(e,i);if(void 0!==a&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:v).toAttribute(t,i.type);this._$Em=e,null==r?this.removeAttribute(a):this.setAttribute(a,r),this._$Em=null}}_$AK(e,t){const i=this.constructor,a=i._$Eh.get(e);if(void 0!==a&&this._$Em!==a){const e=i.getPropertyOptions(a),r="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:v;this._$Em=a;const s=r.fromAttribute(t,e.type);this[a]=s??this._$Ej?.get(a)??s,this._$Em=null}}requestUpdate(e,t,i,a=!1,r){if(void 0!==e){const s=this.constructor;if(!1===a&&(r=this[e]),i??=s.getPropertyOptions(e),!((i.hasChanged??b)(r,t)||i.useDefault&&i.reflect&&r===this._$Ej?.get(e)&&!this.hasAttribute(s._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:a,wrapped:r},s){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,s??t??this[e]),!0!==r||void 0!==s)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===a&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,a=this[t];!0!==e||this._$AL.has(t)||void 0===a||this.C(t,void 0,i,a)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[y("elementProperties")]=new Map,x[y("finalized")]=new Map,_?.({ReactiveElement:x}),(u.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const w=globalThis,$=e=>e,S=w.trustedTypes,C=S?S.createPolicy("lit-html",{createHTML:e=>e}):void 0,A="$lit$",k=`lit$${Math.random().toFixed(9).slice(2)}$`,E="?"+k,L=`<${E}>`,R=document,D=()=>R.createComment(""),T=e=>null===e||"object"!=typeof e&&"function"!=typeof e,j=Array.isArray,z="[ \t\n\f\r]",H=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,M=/-->/g,P=/>/g,U=RegExp(`>|${z}(?:([^\\s"'>=/]+)(${z}*=${z}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),V=/'/g,I=/"/g,O=/^(?:script|style|textarea|title)$/i,B=(e=>(t,...i)=>({_$litType$:e,strings:t,values:i}))(1),N=Symbol.for("lit-noChange"),F=Symbol.for("lit-nothing"),q=new WeakMap,W=R.createTreeWalker(R,129);function G(e,t){if(!j(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==C?C.createHTML(t):t}const J=(e,t)=>{const i=e.length-1,a=[];let r,s=2===t?"<svg>":3===t?"<math>":"",n=H;for(let t=0;t<i;t++){const i=e[t];let o,l,c=-1,d=0;for(;d<i.length&&(n.lastIndex=d,l=n.exec(i),null!==l);)d=n.lastIndex,n===H?"!--"===l[1]?n=M:void 0!==l[1]?n=P:void 0!==l[2]?(O.test(l[2])&&(r=RegExp("</"+l[2],"g")),n=U):void 0!==l[3]&&(n=U):n===U?">"===l[0]?(n=r??H,c=-1):void 0===l[1]?c=-2:(c=n.lastIndex-l[2].length,o=l[1],n=void 0===l[3]?U:'"'===l[3]?I:V):n===I||n===V?n=U:n===M||n===P?n=H:(n=U,r=void 0);const h=n===U&&e[t+1].startsWith("/>")?" ":"";s+=n===H?i+L:c>=0?(a.push(o),i.slice(0,c)+A+i.slice(c)+k+h):i+k+(-2===c?t:h)}return[G(e,s+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),a]};class Z{constructor({strings:e,_$litType$:t},i){let a;this.parts=[];let r=0,s=0;const n=e.length-1,o=this.parts,[l,c]=J(e,t);if(this.el=Z.createElement(l,i),W.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(a=W.nextNode())&&o.length<n;){if(1===a.nodeType){if(a.hasAttributes())for(const e of a.getAttributeNames())if(e.endsWith(A)){const t=c[s++],i=a.getAttribute(e).split(k),n=/([.?@])?(.*)/.exec(t);o.push({type:1,index:r,name:n[2],strings:i,ctor:"."===n[1]?ee:"?"===n[1]?te:"@"===n[1]?ie:X}),a.removeAttribute(e)}else e.startsWith(k)&&(o.push({type:6,index:r}),a.removeAttribute(e));if(O.test(a.tagName)){const e=a.textContent.split(k),t=e.length-1;if(t>0){a.textContent=S?S.emptyScript:"";for(let i=0;i<t;i++)a.append(e[i],D()),W.nextNode(),o.push({type:2,index:++r});a.append(e[t],D())}}}else if(8===a.nodeType)if(a.data===E)o.push({type:2,index:r});else{let e=-1;for(;-1!==(e=a.data.indexOf(k,e+1));)o.push({type:7,index:r}),e+=k.length-1}r++}}static createElement(e,t){const i=R.createElement("template");return i.innerHTML=e,i}}function Y(e,t,i=e,a){if(t===N)return t;let r=void 0!==a?i._$Co?.[a]:i._$Cl;const s=T(t)?void 0:t._$litDirective$;return r?.constructor!==s&&(r?._$AO?.(!1),void 0===s?r=void 0:(r=new s(e),r._$AT(e,i,a)),void 0!==a?(i._$Co??=[])[a]=r:i._$Cl=r),void 0!==r&&(t=Y(e,r._$AS(e,t.values),r,a)),t}class K{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,a=(e?.creationScope??R).importNode(t,!0);W.currentNode=a;let r=W.nextNode(),s=0,n=0,o=i[0];for(;void 0!==o;){if(s===o.index){let t;2===o.type?t=new Q(r,r.nextSibling,this,e):1===o.type?t=new o.ctor(r,o.name,o.strings,this,e):6===o.type&&(t=new ae(r,this,e)),this._$AV.push(t),o=i[++n]}s!==o?.index&&(r=W.nextNode(),s++)}return W.currentNode=R,a}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,a){this.type=2,this._$AH=F,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=a,this._$Cv=a?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Y(this,e,t),T(e)?e===F||null==e||""===e?(this._$AH!==F&&this._$AR(),this._$AH=F):e!==this._$AH&&e!==N&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>j(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==F&&T(this._$AH)?this._$AA.nextSibling.data=e:this.T(R.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,a="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=Z.createElement(G(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===a)this._$AH.p(t);else{const e=new K(a,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=q.get(e.strings);return void 0===t&&q.set(e.strings,t=new Z(e)),t}k(e){j(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,a=0;for(const r of e)a===t.length?t.push(i=new Q(this.O(D()),this.O(D()),this,this.options)):i=t[a],i._$AI(r),a++;a<t.length&&(this._$AR(i&&i._$AB.nextSibling,a),t.length=a)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=$(e).nextSibling;$(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class X{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,a,r){this.type=1,this._$AH=F,this._$AN=void 0,this.element=e,this.name=t,this._$AM=a,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=F}_$AI(e,t=this,i,a){const r=this.strings;let s=!1;if(void 0===r)e=Y(this,e,t,0),s=!T(e)||e!==this._$AH&&e!==N,s&&(this._$AH=e);else{const a=e;let n,o;for(e=r[0],n=0;n<r.length-1;n++)o=Y(this,a[i+n],t,n),o===N&&(o=this._$AH[n]),s||=!T(o)||o!==this._$AH[n],o===F?e=F:e!==F&&(e+=(o??"")+r[n+1]),this._$AH[n]=o}s&&!a&&this.j(e)}j(e){e===F?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class ee extends X{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===F?void 0:e}}class te extends X{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==F)}}class ie extends X{constructor(e,t,i,a,r){super(e,t,i,a,r),this.type=5}_$AI(e,t=this){if((e=Y(this,e,t,0)??F)===N)return;const i=this._$AH,a=e===F&&i!==F||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,r=e!==F&&(i===F||a);a&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class ae{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){Y(this,e)}}const re={I:Q},se=w.litHtmlPolyfillSupport;se?.(Z,Q),(w.litHtmlVersions??=[]).push("3.3.2");const ne=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let oe=class extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const a=i?.renderBefore??t;let r=a._$litPart$;if(void 0===r){const e=i?.renderBefore??null;a._$litPart$=r=new Q(t.insertBefore(D(),e),e,void 0,i??{})}return r._$AI(e),r})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return N}};oe._$litElement$=!0,oe.finalized=!0,ne.litElementHydrateSupport?.({LitElement:oe});const le=ne.litElementPolyfillSupport;le?.({LitElement:oe}),(ne.litElementVersions??=[]).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ce=1,de=2,he=e=>(...t)=>({_$litDirective$:e,values:t});let pe=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};
/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ue=he(class extends pe{constructor(e){if(super(e),e.type!==ce||"class"!==e.name||e.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(e){return" "+Object.keys(e).filter(t=>e[t]).join(" ")+" "}update(e,[t]){if(void 0===this.st){this.st=new Set,void 0!==e.strings&&(this.nt=new Set(e.strings.join(" ").split(/\s/).filter(e=>""!==e)));for(const e in t)t[e]&&!this.nt?.has(e)&&this.st.add(e);return this.render(t)}const i=e.element.classList;for(const e of this.st)e in t||(i.remove(e),this.st.delete(e));for(const e in t){const a=!!t[e];a===this.st.has(e)||this.nt?.has(e)||(a?(i.add(e),this.st.add(e)):(i.remove(e),this.st.delete(e)))}return N}}),{I:ge}=re,me=e=>e,_e=()=>document.createComment(""),ye=(e,t,i)=>{const a=e._$AA.parentNode,r=void 0===t?e._$AB:t._$AA;if(void 0===i){const t=a.insertBefore(_e(),r),s=a.insertBefore(_e(),r);i=new ge(t,s,e,e.options)}else{const t=i._$AB.nextSibling,s=i._$AM,n=s!==e;if(n){let t;i._$AQ?.(e),i._$AM=e,void 0!==i._$AP&&(t=e._$AU)!==s._$AU&&i._$AP(t)}if(t!==r||n){let e=i._$AA;for(;e!==t;){const t=me(e).nextSibling;me(a).insertBefore(e,r),e=t}}}return i},ve=(e,t,i=e)=>(e._$AI(t,i),e),be={},fe=(e,t=be)=>e._$AH=t,xe=e=>{e._$AR(),e._$AA.remove()},we=(e,t,i)=>{const a=new Map;for(let r=t;r<=i;r++)a.set(e[r],r);return a},$e=he(class extends pe{constructor(e){if(super(e),e.type!==de)throw Error("repeat() can only be used in text expressions")}dt(e,t,i){let a;void 0===i?i=t:void 0!==t&&(a=t);const r=[],s=[];let n=0;for(const t of e)r[n]=a?a(t,n):n,s[n]=i(t,n),n++;return{values:s,keys:r}}render(e,t,i){return this.dt(e,t,i).values}update(e,[t,i,a]){const r=(e=>e._$AH)(e),{values:s,keys:n}=this.dt(t,i,a);if(!Array.isArray(r))return this.ut=n,s;const o=this.ut??=[],l=[];let c,d,h=0,p=r.length-1,u=0,g=s.length-1;for(;h<=p&&u<=g;)if(null===r[h])h++;else if(null===r[p])p--;else if(o[h]===n[u])l[u]=ve(r[h],s[u]),h++,u++;else if(o[p]===n[g])l[g]=ve(r[p],s[g]),p--,g--;else if(o[h]===n[g])l[g]=ve(r[h],s[g]),ye(e,l[g+1],r[h]),h++,g--;else if(o[p]===n[u])l[u]=ve(r[p],s[u]),ye(e,r[h],r[p]),p--,u++;else if(void 0===c&&(c=we(n,u,g),d=we(o,h,p)),c.has(o[h]))if(c.has(o[p])){const t=d.get(n[u]),i=void 0!==t?r[t]:null;if(null===i){const t=ye(e,r[h]);ve(t,s[u]),l[u]=t}else l[u]=ve(i,s[u]),ye(e,r[h],i),r[t]=null;u++}else xe(r[p]),p--;else xe(r[h]),h++;for(;u<=g;){const t=ye(e,l[g+1]);ve(t,s[u]),l[u++]=t}for(;h<=p;){const e=r[h++];null!==e&&xe(e)}return this.ut=n,fe(e,l),N}});
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */customElements.define("juice-patrol-panel",class extends oe{static get properties(){return{narrow:{type:Boolean},_entities:{state:!0},_activeView:{state:!0},_filterText:{state:!0},_filterCategory:{state:!0},_settingsOpen:{state:!0},_settingsDirty:{state:!0},_settingsValues:{state:!0},_configEntry:{state:!0},_sortCol:{state:!0},_sortAsc:{state:!0},_detailEntity:{state:!0},_chartData:{state:!0},_chartLoading:{state:!0},_shoppingData:{state:!0},_shoppingLoading:{state:!0},_refreshing:{state:!0},_flashGeneration:{state:!0},_expandedGroups:{state:!0},_ignoredEntities:{state:!0},_chartRange:{state:!0}}}constructor(){super(),this._hass=null,this._panel=null,this._hassInitialized=!1,this._entities=[],this._configEntry=null,this._settingsOpen=!1,this._settingsDirty=!1,this._settingsValues={},this._sortCol="level",this._sortAsc=!0,this._userSorted=!1,this._prevLevels=new Map,this._recentlyChanged=new Map,this._activeView="devices",this._shoppingData=null,this._shoppingLoading=!1,this._refreshing=!1,this._expandedGroups={},this._filterText="",this._filterCategory=null,this._highlightEntity=null,this._highlightApplied=!1,this._highlightAttempts=0,this._detailEntity=null,this._chartData=null,this._chartLoading=!1,this._chartLastLevel=null,this._flashGeneration=0,this._ignoredEntities=null,this._chartRange="auto",this._flashCleanupTimer=null,this._refreshTimer=null,this._chartDebounce=null,this._entityMap=new Map}set hass(e){const t=this._hass?.connection;this._hass=e;const i=!this._hassInitialized,a=!i&&e?.connection&&e.connection!==t;this._processHassUpdate(i||a),this._hassInitialized=!0}get hass(){return this._hass}set panel(e){this._panel=e}get panel(){return this._panel}get _basePath(){return`/${this._panel?.url_path||"juice-patrol"}`}connectedCallback(){super.connectedCallback(),this.requestUpdate(),this._escapeHandler=e=>{"Escape"===e.key&&this._closeOverlays()},window.addEventListener("keydown",this._escapeHandler),this._popstateHandler=()=>{this._syncViewFromUrl()},window.addEventListener("popstate",this._popstateHandler),this._locationChangedHandler=()=>{this._syncViewFromUrl()},window.addEventListener("location-changed",this._locationChangedHandler),this._visibilityHandler=()=>{if("visible"===document.visibilityState&&this._hass&&(this._processHassUpdate(!1),"detail"===this._activeView&&this._detailEntity)){const e=3e5,t=this._chartData?.last_calculated?Date.now()-1e3*this._chartData.last_calculated:1/0;this._chartLoading=!1,t>e&&this._loadChartData(this._detailEntity)}},document.addEventListener("visibilitychange",this._visibilityHandler)}disconnectedCallback(){super.disconnectedCallback();for(const e of["_flashCleanupTimer","_refreshTimer","_chartDebounce"])this[e]&&(clearTimeout(this[e]),this[e]=null);this._refreshing=!1,this._escapeHandler&&(window.removeEventListener("keydown",this._escapeHandler),this._escapeHandler=null),this._popstateHandler&&(window.removeEventListener("popstate",this._popstateHandler),this._popstateHandler=null),this._locationChangedHandler&&(window.removeEventListener("location-changed",this._locationChangedHandler),this._locationChangedHandler=null),this._visibilityHandler&&(document.removeEventListener("visibilitychange",this._visibilityHandler),this._visibilityHandler=null)}firstUpdated(){this._syncViewFromUrl();const e=new URLSearchParams(window.location.search).get("entity");e&&/^[a-z0-9_]+\.[a-z0-9_]+$/.test(e)&&(this._highlightEntity=e)}_syncViewFromUrl(){const e=window.location.pathname,t=`${this._basePath}/detail/`;if(e.startsWith(t)){const i=decodeURIComponent(e.slice(t.length));if(/^[a-z0-9_]+\.[a-z0-9_]+$/.test(i))return void(this._detailEntity===i&&"detail"===this._activeView||(this._detailEntity=i,this._activeView="detail",this._chartData=null,this._chartLastLevel=null,this._loadChartData(i)))}if(e===`${this._basePath}/shopping`||e===`${this._basePath}/shopping/`)return"detail"===this._activeView&&(this._detailEntity=null,this._chartData=null,this._chartEl=null),"shopping"!==this._activeView&&(this._activeView="shopping",this._loadShoppingList()),void(this._entities=this._sortEntities(this._entityList));"detail"===this._activeView&&(this._detailEntity=null,this._chartData=null,this._chartEl=null),this._activeView="devices",this._entities=this._sortEntities(this._entityList)}updated(e){(e.has("_chartData")||e.has("_chartRange"))&&this._chartData&&requestAnimationFrame(()=>this._initChart(this._chartData)),e.has("_entities")&&(!this._highlightApplied&&this._highlightEntity&&this._applyDeepLinkHighlight(),"detail"===this._activeView&&this._detailEntity&&!this._entityMap.get(this._detailEntity)&&this._closeDetail())}_processHassUpdate(e){if(!this._hass)return;const t=this._entityHash;this._updateEntities();if(this._entityHash!==t){const e=this._sortEntities(this._entityList);this._entityMap=new Map(e.map(e=>[e.sourceEntity,e])),"detail"!==this._activeView&&(this._entities=e)}if(e&&(this._loadConfig(),this._loadIgnored()),"detail"===this._activeView&&this._detailEntity&&!this._chartLoading){const e=this._getDevice(this._detailEntity);e&&e.level!==this._chartLastLevel&&(this._chartLastLevel=e.level,clearTimeout(this._chartDebounce),this._chartDebounce=setTimeout(()=>this._loadChartData(this._detailEntity),5e3))}}_updateEntities(){if(!this._hass)return;const e=this._hass.states,t=new Map;for(const[i,a]of Object.entries(e)){const r=a.attributes||{},s=r.source_entity;if(!s)continue;if(i.includes("lowest_battery")||i.includes("attention_needed"))continue;if(!(i.includes("_discharge_rate")||i.includes("_days_remaining")||i.includes("_predicted_empty")||i.includes("_battery_low")||i.includes("_stale")))continue;t.has(s)||t.set(s,{sourceEntity:s,name:null,level:null,dischargeRate:null,daysRemaining:null,predictedEmpty:null,isLow:!1,isStale:!1,confidence:null,threshold:null,stability:null,stabilityCv:null,meanLevel:null,anomaly:null,dropSize:null,isRechargeable:!1,rechargeableReason:null,replacementPending:!1,batteryType:null,batteryTypeSource:null,manufacturer:null,model:null,chargingState:null,reliability:null,predictionStatus:null,platform:null,dischargeRateHour:null,hoursRemaining:null,lastCalculated:null});const n=t.get(s),o=e[s];if(o&&"unavailable"!==o.state&&"unknown"!==o.state){const e=parseFloat(o.state);isNaN(e)||(n.level=e)}o?.attributes?.friendly_name&&(n.name=o.attributes.friendly_name),i.includes("_discharge_rate")?(n.dischargeRate="unknown"!==a.state&&"unavailable"!==a.state?parseFloat(a.state):null,n.stability=r.stability||null,n.stabilityCv=r.stability_cv??null,n.meanLevel=r.mean_level??null,n.anomaly=r.discharge_anomaly||null,n.dropSize=r.drop_size??null,n.isRechargeable=r.is_rechargeable||!1,n.rechargeableReason=r.rechargeable_reason||null,n.replacementPending=r.replacement_pending||!1,n.lastReplaced=r.last_replaced||null,n.batteryType=r.battery_type||null,n.batteryTypeSource=r.battery_type_source||null,n.platform=r.platform||null,n.manufacturer=r.manufacturer||null,n.model=r.model||null,n.chargingState=r.charging_state?r.charging_state.toLowerCase().replace(/\s/g,"_"):null,n.dischargeRateHour=r.discharge_rate_hour??null,n.lastCalculated=r.last_calculated||null):i.includes("_days_remaining")?(n.daysRemaining="unknown"!==a.state&&"unavailable"!==a.state?parseFloat(a.state):null,n.confidence=r.confidence||null,n.reliability=r.reliability??null,n.predictionStatus=r.status||null,n.hoursRemaining=r.hours_remaining??null):i.includes("_predicted_empty")?n.predictedEmpty="unknown"!==a.state&&"unavailable"!==a.state?a.state:null:i.includes("_battery_low")?(n.isLow="on"===a.state,n.threshold=r.threshold):i.includes("_stale")&&(n.isStale="on"===a.state)}const i=this._settingsValues.low_threshold??20,a=Date.now();let r=!1;for(const e of t.values()){if(null!==e.level){const t=e.threshold??i;e.isLow=e.level<=t}const t=null!==e.level?Math.ceil(e.level):null,s=this._prevLevels.get(e.sourceEntity);void 0!==s&&null!==t&&t!==s&&(this._recentlyChanged.set(e.sourceEntity,{ts:a,dir:t>s?"up":"down"}),r=!0),null!==t&&this._prevLevels.set(e.sourceEntity,t)}r&&(this._flashGeneration=(this._flashGeneration||0)+1),this._recentlyChanged.size>0&&!this._flashCleanupTimer&&(this._flashCleanupTimer=setTimeout(()=>{this._flashCleanupTimer=null,this._recentlyChanged.clear(),this._flashGeneration=(this._flashGeneration||0)+1},3e3)),this._entityList=[...t.values()];const s=this._recentlyChanged.size>0?[...this._recentlyChanged.keys()].join(","):"";this._entityHash=this._entityList.map(e=>`${e.sourceEntity}:${e.level}:${e.isLow}:${e.isStale}:${e.stability}:${e.replacementPending}:${e.batteryType}`).join("|")+"|!"+s}_sortEntities(e){const t=this._sortCol,i=this._sortAsc?1:-1;return e.sort((e,a)=>{const r=this._getSortValue(e,t),s=this._getSortValue(a,t);if(null===r&&null!==s)return 1;if(null!==r&&null===s)return-1;if(!this._userSorted){const t=e.replacementPending||e.isLow||e.isStale||e.anomaly&&"normal"!==e.anomaly;if(t!==(a.replacementPending||a.isLow||a.isStale||a.anomaly&&"normal"!==a.anomaly))return t?-1:1}return r===s?0:(r<s?-1:1)*i})}_getSortValue(e,t){switch(t){case"name":return(e.name||e.sourceEntity).toLowerCase();case"level":default:return e.level;case"type":return(e.batteryType||"").toLowerCase()||null;case"rate":return e.dischargeRate;case"days":return e.daysRemaining;case"reliability":return e.reliability;case"empty":return e.predictedEmpty}}_getFilteredEntities(){let e=this._entities;const t=this._filterCategory;"low"===t?e=e.filter(e=>e.isLow):"stale"===t?e=e.filter(e=>e.isStale):"unavailable"===t?e=e.filter(e=>null===e.level):"pending"===t?e=e.filter(e=>e.replacementPending):"anomaly"===t&&(e=e.filter(e=>e.anomaly&&"normal"!==e.anomaly));const i=this._filterText.toLowerCase().trim();return i&&(e=e.filter(e=>{const t=(e.name||e.sourceEntity).toLowerCase(),a=(e.batteryType||"").toLowerCase(),r=(e.platform||"").toLowerCase(),s=e.sourceEntity.toLowerCase(),n=(e.manufacturer||"").toLowerCase(),o=(e.model||"").toLowerCase();return t.includes(i)||a.includes(i)||r.includes(i)||s.includes(i)||n.includes(i)||o.includes(i)})),e}_getDevice(e){return this._entityMap.get(e)}_formatLevel(e){const t=this._displayLevel(e);return null!==t?t+"%":"—"}_wsErrorMessage(e,t){return e?.message?.includes("unknown command")?`Restart Home Assistant to enable ${t}`:`${t} failed`}_getBatteryIcon(e){if(e.isRechargeable)return null===e.level?"mdi:battery-unknown":e.level<=10?"mdi:battery-charging-10":e.level<=30?"mdi:battery-charging-30":e.level<=60?"mdi:battery-charging-60":e.level<=90?"mdi:battery-charging-90":"mdi:battery-charging-100";const t=e.level;return null===t?"mdi:battery-unknown":t<=5?"mdi:battery-outline":t<=15?"mdi:battery-10":t<=25?"mdi:battery-20":t<=35?"mdi:battery-30":t<=45?"mdi:battery-40":t<=55?"mdi:battery-50":t<=65?"mdi:battery-60":t<=75?"mdi:battery-70":t<=85?"mdi:battery-80":t<=95?"mdi:battery-90":"mdi:battery"}_getLevelColor(e,t){if(null===e)return"var(--disabled-text-color)";const i=t??this._settingsValues.low_threshold??20;return e<=i/2?"var(--error-color, #db4437)":e<=1.25*i?"var(--warning-color, #ffa726)":"var(--success-color, #43a047)"}_displayLevel(e){return null===e?null:Math.ceil(e)}_isActivelyCharging(e){return e.isRechargeable&&("charging"===e.chargingState||"charging"===e.predictionStatus)}_isFastDischarge(e){return null!==e.dischargeRateHour&&e.dischargeRateHour>=1}_predictionReason(e){const t=e.predictionStatus;if(!t||"normal"===t)return null;return{charging:"Charging",flat:"Flat",noisy:"Noisy data",insufficient_data:"Not enough data",single_level:"Single level",insufficient_range:"Tiny range"}[t]||null}_predictionReasonDetail(e){return{charging:"This battery is currently charging, so no discharge prediction is generated. Once it starts discharging again, a new prediction will be calculated.",flat:"The battery level has been essentially flat — no significant discharge detected. This is normal for devices with very slow drain. A prediction will appear once enough change is observed.",noisy:"The battery data is too irregular to fit a reliable trend line. This can happen with sensors that report inconsistent values. The prediction will improve as more stable readings accumulate.",insufficient_data:"There are not enough data points or the observation period is too short to calculate a prediction. Juice Patrol needs at least 3 readings spanning 24 hours.",single_level:"All recorded readings have the same battery level. This typically means the sensor reports a fixed value or hasn't changed since discovery.",insufficient_range:"The battery level has barely changed — the total variation is within one reporting step. More drain needs to occur before a trend can be detected."}[e]||null}_formatRate(e){return this._isFastDischarge(e)?null!==e.dischargeRateHour?e.dischargeRateHour+"%/h":"—":null!==e.dischargeRate?e.dischargeRate+"%/d":"—"}_formatTimeRemaining(e){return this._isFastDischarge(e)&&null!==e.hoursRemaining?e.hoursRemaining<1?Math.round(60*e.hoursRemaining)+"m":e.hoursRemaining+"h":null!==e.daysRemaining?e.daysRemaining+"d":"—"}_formatDate(e,t=!1){if(!e)return"—";try{const i=new Date(e);if(t){const e=new Date,t=i.getFullYear()===e.getFullYear()?{month:"short",day:"numeric"}:{month:"short",day:"numeric",year:"numeric"};return i.toLocaleDateString(void 0,t)+" "+i.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}return i.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}catch{return"—"}}_parseBatteryType(e){if(!e)return{count:0,type:""};const t=e.match(/^(\d+)\s*[×x]\s*(.+)$/i);return t?{count:parseInt(t[1]),type:t[2].trim()}:{count:1,type:e.trim()}}_formatBatteryType(e,t){return e?t>1?`${t}× ${e}`:e:""}_erraticTooltip(e){const t=[],i=this._displayLevel(e.level),a=this._displayLevel(e.meanLevel);return null!==a&&null!==i&&i>a+3&&!e.isRechargeable?t.push(`Level is rising (${i}%) without a charge state — not expected for a non-rechargeable battery`):null!==a&&null!==i&&Math.abs(i-a)>5&&t.push(`Current level (${i}%) differs significantly from 7-day average (${a}%)`),null!==e.stabilityCv&&e.stabilityCv>.05&&t.push(`High reading variance (CV: ${(100*e.stabilityCv).toFixed(1)}%)`),0===t.length&&t.push("Battery readings show non-monotonic or inconsistent behavior"),t.join(". ")}_showToast(e){this.dispatchEvent(new CustomEvent("hass-notification",{bubbles:!0,composed:!0,detail:{message:e}}))}_applyDeepLinkHighlight(){if(!this._highlightEntity||this._highlightApplied)return;if(this._highlightAttempts=(this._highlightAttempts||0)+1,this._highlightAttempts>10)return void(this._highlightApplied=!0);const e=this.shadowRoot.querySelector(`.device-row[data-entity="${CSS.escape(this._highlightEntity)}"]`);e&&(this._highlightApplied=!0,requestAnimationFrame(()=>{e.scrollIntoView({behavior:"smooth",block:"center"}),e.classList.add("highlighted"),setTimeout(()=>e.classList.remove("highlighted"),3e3)}))}async _loadConfig(){if(this._hass)try{const e=await this._hass.callWS({type:"juice_patrol/get_settings"});this._configEntry={entry_id:e.entry_id},this._settingsValues={low_threshold:e.low_threshold,stale_timeout:e.stale_timeout,prediction_horizon:e.prediction_horizon}}catch(e){console.error("Juice Patrol: failed to load config",e)}}async _saveSettings(){if(this._hass)try{const e=await this._hass.callWS({type:"juice_patrol/update_settings",low_threshold:parseInt(this._settingsValues.low_threshold),stale_timeout:parseInt(this._settingsValues.stale_timeout),prediction_horizon:parseInt(this._settingsValues.prediction_horizon)});this._settingsDirty=!1,this._settingsValues={low_threshold:e.low_threshold,stale_timeout:e.stale_timeout,prediction_horizon:e.prediction_horizon},this._settingsOpen=!1,this._showToast("Settings saved")}catch(e){console.error("Juice Patrol: failed to save settings",e),this._showToast("Failed to save settings")}}async _markReplaced(e){const t=this._getDevice(e);t?.isRechargeable?this._showReplaceRechargeableDialog(e):this._showReplaceDialog(e)}async _doMarkReplaced(e,t){try{const i={type:"juice_patrol/mark_replaced",entity_id:e};null!=t&&(i.timestamp=t),await this._hass.callWS(i),this._showToast("Battery marked as replaced"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to mark as replaced")}}_showReplaceRechargeableDialog(e){this._showReplaceDialogImpl(e,{title:"Replace rechargeable battery?",preamble:'\n        <p style="margin-top:0">This device is marked as <strong>rechargeable</strong>, which means\n        Juice Patrol expects its battery level to gradually rise and fall as it\n        charges and discharges. Charging is detected automatically — you don\'t\n        need to do anything when you plug it in.</p>\n        <p><strong>"Mark as replaced"</strong> is for when you physically swap the\n        battery pack itself (e.g. a worn-out cell that no longer holds charge).</p>\n        <p>If you just recharged the device, you can ignore this — Juice Patrol\n        already handles that.</p>'})}_showReplaceDialog(e){this._showReplaceDialogImpl(e,{title:"Mark battery as replaced?",preamble:'\n        <p style="margin-top:0">This tells Juice Patrol that you swapped the batteries.\n        A replacement marker will be added to the timeline. All history is preserved\n        for life expectancy tracking.</p>\n        <p style="color:var(--secondary-text-color); font-size:0.9em; margin-bottom:0">\n        This can be undone later if needed.</p>'})}_showReplaceDialogImpl(e,{title:t,preamble:i}){const a=document.createElement("ha-dialog");a.open=!0,a.headerTitle=t,this.shadowRoot.appendChild(a);const r=()=>{a.open=!1,a.remove()},s=document.createElement("div");s.innerHTML=`\n      ${i}\n      <ha-expansion-panel outlined style="margin: 8px 0">\n        <span slot="header">Advanced: set custom date</span>\n        <div style="padding: 8px 0">\n          <p style="margin-top:0; color:var(--secondary-text-color); font-size:0.9em">\n            Register a past battery replacement by selecting the date and time it occurred.</p>\n          <input type="datetime-local" class="jp-datetime-input"\n            style="width:100%; padding:8px; border:1px solid var(--divider-color, #ddd);\n                   border-radius:4px; background:var(--card-background-color, #fff);\n                   color:var(--primary-text-color); font-size:14px; box-sizing:border-box" />\n        </div>\n      </ha-expansion-panel>\n      <div class="jp-dialog-actions">\n        <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>\n        <ha-button class="jp-dialog-confirm">Mark as replaced</ha-button>\n      </div>\n    `,a.appendChild(s),s.querySelector(".jp-dialog-cancel").addEventListener("click",r),s.querySelector(".jp-dialog-confirm").addEventListener("click",()=>{const t=s.querySelector(".jp-datetime-input");let i;t&&t.value&&(i=new Date(t.value).getTime()/1e3),r(),this._doMarkReplaced(e,i)})}_showConfirmDialog({title:e,bodyHtml:t,onConfirm:i,confirmLabel:a,confirmVariant:r}){const s=document.createElement("ha-dialog");s.open=!0,s.headerTitle=e,this.shadowRoot.appendChild(s);const n=()=>{s.open=!1,s.remove()},o=document.createElement("div");o.innerHTML=`\n      ${t}\n      <div class="jp-dialog-actions">\n        <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>\n        <ha-button class="jp-dialog-confirm" ${r?`variant="${r}"`:""}>${a||"Confirm"}</ha-button>\n      </div>\n    `,s.appendChild(o),o.querySelector(".jp-dialog-cancel").addEventListener("click",n),o.querySelector(".jp-dialog-confirm").addEventListener("click",()=>{n(),i()})}_undoReplacement(e){this._showConfirmDialog({title:"Undo battery replacement?",bodyHtml:'\n        <p style="margin-top:0">This will remove the most recent replacement marker\n        from the timeline. Battery history is never deleted.</p>\n        <p style="color:var(--secondary-text-color); font-size:0.9em; margin-bottom:0">\n        You can always re-add it later if needed.</p>',confirmLabel:"Undo replacement",confirmVariant:"danger",onConfirm:()=>this._doUndoReplacement(e)})}async _doUndoReplacement(e){try{await this._hass.callWS({type:"juice_patrol/undo_replacement",entity_id:e}),this._showToast("Replacement undone"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to undo replacement")}}async _confirmReplacement(e){try{await this._hass.callWS({type:"juice_patrol/confirm_replacement",entity_id:e}),this._showToast("Replacement confirmed")}catch(e){this._showToast("Failed to confirm")}}async _confirmSuspectedReplacement(e,t){try{await this._hass.callWS({type:"juice_patrol/mark_replaced",entity_id:e,timestamp:t}),this._showToast("Replacement confirmed"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to confirm replacement")}}async _denySuspectedReplacement(e,t){try{await this._hass.callWS({type:"juice_patrol/deny_replacement",entity_id:e,timestamp:t}),this._showToast("Suggestion dismissed"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to dismiss suggestion")}}async _recalculate(e){try{await this._hass.callWS({type:"juice_patrol/recalculate",entity_id:e}),this._showToast("Prediction recalculated")}catch(e){this._showToast(this._wsErrorMessage(e,"recalculation"))}}async _refresh(){if(!this._refreshing){this._refreshing=!0;try{await this._hass.callWS({type:"juice_patrol/refresh"}),this._showToast("Predictions refreshed")}catch(e){this._showToast("Refresh failed")}this._refreshTimer=setTimeout(()=>{this._refreshTimer=null,this._refreshing=!1},2e3)}}async _loadIgnored(){if(this._hass)try{const e=await this._hass.callWS({type:"juice_patrol/get_ignored"});this._ignoredEntities=e.devices}catch(e){console.error("Juice Patrol: failed to load ignored devices",e)}}async _ignoreDevice(e){if(this._hass)try{await this._hass.callWS({type:"juice_patrol/set_ignored",entity_id:e,ignored:!0}),this._showToast("Device ignored"),this._loadIgnored()}catch(e){this._showToast("Failed to ignore device")}}async _unignoreDevice(e){if(this._hass)try{await this._hass.callWS({type:"juice_patrol/set_ignored",entity_id:e,ignored:!1}),this._showToast("Device restored"),this._loadIgnored()}catch(e){this._showToast("Failed to unignore device")}}async _loadShoppingList(){if(this._hass){this._shoppingLoading=!0;try{this._shoppingData=await this._hass.callWS({type:"juice_patrol/get_shopping_list"})}catch(e){console.error("Juice Patrol: failed to load shopping list",e),this._shoppingData=null}this._shoppingLoading=!1}}async _loadChartData(e){if(this._hass&&!this._chartLoading){this._chartLoading=!0;try{const t=await this._hass.callWS({type:"juice_patrol/get_entity_chart",entity_id:e});this._chartLastLevel=t?.level??null,this._chartData=t}catch(e){console.error("Juice Patrol: failed to load chart data",e),this._showToast(this._wsErrorMessage(e,"chart view"))}this._chartLoading=!1}}async _saveBatteryType(e,t){try{await this._hass.callWS({type:"juice_patrol/set_battery_type",entity_id:e,battery_type:t}),this._showToast(t?`Battery type set to ${t}`:"Battery type cleared")}catch(e){this._showToast("Failed to set battery type")}}_openDetail(e){this._closeOverlays(),this._detailEntity=e,this._activeView="detail",this._chartData=null,this._chartLastLevel=null,this._chartRange="auto";const t=`${this._basePath}/detail/${encodeURIComponent(e)}`;history.pushState({jpDetail:e},"",t),this._loadChartData(e)}_closeDetail(){"detail"===this._activeView&&history.back()}_toggleSort(e){this._sortCol===e?this._sortAsc=!this._sortAsc:(this._sortCol=e,this._sortAsc=!0),this._userSorted=!0,this._entities=this._sortEntities([...this._entities])}_setFilter(e){this._closeOverlays(),this._filterCategory=this._filterCategory===e?null:e,"devices"!==this._activeView&&(this._activeView="devices",this._entities=this._sortEntities(this._entityList)),"ignored"===this._filterCategory&&this._loadIgnored()}_switchTab(e){e!==this._activeView&&(this._closeOverlays(),this._activeView=e,"shopping"===e&&this._loadShoppingList())}_handleSearchInput(e){const t=e.target.value;this._filterText=t}_clearSearch(){this._filterText=""}_clearFilter(){this._filterCategory=null}_toggleSettings(){this._settingsOpen=!this._settingsOpen,this._settingsOpen&&(this._settingsDirty=!1,this._loadConfig())}_handleSettingInput(e){const t=e.target.dataset.key;this._settingsValues={...this._settingsValues,[t]:e.target.value},this._settingsDirty=!0}_cancelSettings(){this._settingsOpen=!1,this._settingsDirty=!1}_handleMenuSelect(e,t){const i=e.detail?.item?.value;if(!i||!t)return;const a=this._getDevice(t);"detail"===i?this._openDetail(t):"confirm"===i?this._confirmReplacement(t):"replace"===i?this._markReplaced(t):"recalculate"===i?this._recalculate(t):"type"===i?this._setBatteryType(t,a?.batteryType):"undo-replace"===i?this._undoReplacement(t):"ignore"===i&&this._ignoreDevice(t)}_closeOverlays(){this.shadowRoot.querySelectorAll("ha-dialog").forEach(e=>{e.open=!1,e.remove()})}_handleRowClick(e){this._openDetail(e)}_handleActionClick(e,t,i){e.stopPropagation(),"confirm"===t&&this._confirmReplacement(i)}_setBatteryType(e,t){this._closeOverlays();const i=this._getDevice(e),a=t||i?.batteryType||"",r=this._parseBatteryType(a),s=["CR2032","CR2450","CR123A","AA","AAA","Li-ion","Built-in"];let n=[],o=null;if(a&&s.includes(r.type)){for(let e=0;e<r.count;e++)n.push(r.type);o=r.type}let l=i?.isRechargeable||!1,c=!1;const d=document.createElement("ha-dialog");d.open=!0,d.headerTitle="Set battery type",this.shadowRoot.appendChild(d);const h=()=>{d.open=!1,d.remove()},p=e=>{if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML},u=document.createElement("div");d.appendChild(u);const g=()=>{const t=n.length>0?n.map((e,t)=>`<span class="jp-badge-chip" data-idx="${t}" title="Click to remove">${p(e)} ✕</span>`).join(""):'<span class="jp-badge-placeholder">Click a battery type below, or type a custom value</span>';u.innerHTML=`\n        <div class="jp-dialog-desc">${p(i?.name||e)}</div>\n        <div class="jp-badge-field">${t}</div>\n        <div class="jp-dialog-presets">\n          ${s.map(e=>{const t=null!==o&&e!==o;return`<button class="jp-preset${t?" disabled":""}${e===o?" active":""}"\n              data-type="${e}" ${t?"disabled":""}>${e}</button>`}).join("")}\n        </div>\n        <div class="jp-dialog-or">or type a custom value:</div>\n        <input type="text" class="jp-dialog-input" placeholder="e.g. 18650, LR44, custom..."\n               value="${0!==n.length||s.includes(r.type)?"":p(a)}">\n        <ha-button class="jp-autodetect" style="margin-top:8px;width:100%">\n          <ha-icon slot="start" icon="mdi:auto-fix"></ha-icon>\n          Autodetect\n        </ha-button>\n        <label class="jp-rechargeable-toggle">\n          <input type="checkbox" class="jp-rechargeable-cb" ${l?"checked":""}>\n          <ha-icon icon="mdi:power-plug-battery" style="--mdc-icon-size:16px"></ha-icon>\n          Rechargeable battery\n        </label>\n        <div class="jp-dialog-actions">\n          <ha-button variant="neutral" class="jp-dialog-clear">Clear</ha-button>\n          <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>\n          <ha-button class="jp-dialog-save">Save</ha-button>\n        </div>\n      `,m()},m=()=>{u.querySelectorAll(".jp-badge-chip").forEach(e=>{e.addEventListener("click",()=>{n.splice(parseInt(e.dataset.idx),1),0===n.length&&(o=null),g()})}),u.querySelectorAll(".jp-preset:not([disabled])").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.type;o=t,n.push(t);const i=u.querySelector(".jp-dialog-input");i&&(i.value=""),g()})}),u.querySelector(".jp-autodetect")?.addEventListener("click",async()=>{const t=u.querySelector(".jp-autodetect");t&&(t.disabled=!0,t.textContent="Detecting...");try{const i=await this._hass.callWS({type:"juice_patrol/detect_battery_type",entity_id:e});if(i.battery_type){const e=this._parseBatteryType(i.battery_type);if(n=[],o=null,s.includes(e.type)){for(let t=0;t<e.count;t++)n.push(e.type);o=e.type}if(g(),!s.includes(e.type)){const e=u.querySelector(".jp-dialog-input");e&&(e.value=i.battery_type)}this._showToast(`Detected: ${i.battery_type} (${i.source})`)}else this._showToast("Could not auto-detect battery type"),t&&(t.disabled=!1,t.textContent="Autodetect")}catch(e){console.warn("Juice Patrol: auto-detect failed",e),this._showToast(this._wsErrorMessage(e,"auto-detection")),t&&(t.disabled=!1,t.innerHTML='<ha-icon icon="mdi:auto-fix" style="--mdc-icon-size:16px;vertical-align:middle;margin-right:4px"></ha-icon> Autodetect')}}),u.querySelector(".jp-rechargeable-cb")?.addEventListener("change",e=>{l=e.target.checked,c=!0}),d.addEventListener("closed",h),u.querySelector(".jp-dialog-cancel")?.addEventListener("click",h),u.querySelector(".jp-dialog-clear")?.addEventListener("click",()=>{n=[],o=null;const e=u.querySelector(".jp-dialog-input");e&&(e.value=""),g()}),u.querySelector(".jp-dialog-save")?.addEventListener("click",async()=>{let t;const i=u.querySelector(".jp-dialog-input"),r=i?.value?.trim();t=n.length>0?this._formatBatteryType(o,n.length):r||null,h();const s=t!==(a||null);if(c)try{await this._hass.callWS({type:"juice_patrol/set_rechargeable",entity_id:e,is_rechargeable:l})}catch(e){this._showToast("Failed to update rechargeable state")}s&&await this._saveBatteryType(e,t)});const t=u.querySelector(".jp-dialog-input");t?.addEventListener("keydown",e=>{"Enter"===e.key&&u.querySelector(".jp-dialog-save")?.click(),"Escape"===e.key&&h()})};g()}_resolveColor(e,t){return getComputedStyle(this).getPropertyValue(e).trim()||t}async _initChart(e){const t=this.shadowRoot.getElementById("jp-chart");if(!t||!e||!e.readings||0===e.readings.length)return;if(!customElements.get("ha-chart-base"))try{await(window.loadCardHelpers?.()),await new Promise(e=>setTimeout(e,100))}catch(e){console.warn("Juice Patrol: loadCardHelpers failed",e)}if(!customElements.get("ha-chart-base"))return void(t.innerHTML='<div class="empty-state">Chart component not available</div>');const i=this._resolveColor("--primary-color","#03a9f4"),a=this._resolveColor("--warning-color","#ffa726"),r=this._resolveColor("--error-color","#db4437"),s=this._resolveColor("--success-color","#4caf50");this._resolveColor("--secondary-text-color","#999");const n=this._resolveColor("--secondary-text-color","#999"),o=this._resolveColor("--divider-color","rgba(0,0,0,0.12)"),l=this._resolveColor("--ha-card-background",this._resolveColor("--card-background-color","#fff")),c=this._resolveColor("--primary-text-color","#212121"),d=this._resolveColor("--primary-text-color","#212121"),h=e.readings,p=e.all_readings||h,u=e.prediction,g=e.threshold,m=u.t0??e.first_reading_timestamp,_=p.map(e=>[1e3*e.t,e.v]),y=e.charge_prediction,v="charging"===e.charging_state?.toLowerCase()||"charging"===e.prediction?.status,b=y&&y.estimated_full_timestamp,f=[];if(null!=u.slope_per_day&&null!=u.intercept&&null!=m){const e=e=>{const t=(e-m)/86400;return u.slope_per_day*t+u.intercept},t=h[0].t,i=Date.now()/1e3,a=v?i:u.estimated_empty_timestamp?Math.min(u.estimated_empty_timestamp,i+31536e3):i+2592e3;for(const r of[t,i,...v?[]:[a]])f.push([1e3*r,Math.max(0,Math.min(100,e(r)))])}const x=_[0]?.[0]||Date.now(),w=Date.now();let $;if(v&&y&&null!=y.segment_start_timestamp){const t=y.segment_start_level,i=e.level,a=b?y.slope_per_hour:i>t&&w/1e3-y.segment_start_timestamp>0?(i-t)/((w/1e3-y.segment_start_timestamp)/3600):0;if(a>0){const e=b?1e3*y.estimated_full_timestamp:w+(100-i)/a*36e5;$=e+.1*(e-x)}else $=w+.2*(w-x)}else $=v?w+.2*(w-x):f.length?f[f.length-1][0]:_[_.length-1]?.[0]||w;const S={"1w":6048e5,"1m":2592e6,"3m":7776e6,"6m":15552e6,"1y":31536e6};let C,A;const k=this._chartRange||"auto";if("auto"===k)C=x,A=$;else if("all"===k){const e=p.length?1e3*p[0].t:x,t=u.estimated_empty_timestamp?1e3*u.estimated_empty_timestamp:null,i=f.length?f[f.length-1][0]:w;C=Math.min(e,x),A=Math.max(i,t||0,$)}else{const e=S[k]||2592e6;C=w-e;const t=f.length?f[f.length-1][0]:w;A=Math.max(w+e,t)}const E=[{name:"Battery Level",type:"line",data:_,smooth:!1,symbol:_.length>50?"none":"circle",symbolSize:4,lineStyle:{width:2,color:i},itemStyle:{color:i},areaStyle:{color:i,opacity:.07}}];if(f.length>0&&E.push({name:"Discharge prediction",type:"line",data:f,smooth:!1,symbol:"none",lineStyle:{width:2,type:"dashed",color:a},itemStyle:{color:a}}),v&&y&&null!=y.segment_start_timestamp){const t=y.segment_start_timestamp,i=y.segment_start_level,a=Date.now()/1e3,r=e.level;let n=b?y.slope_per_hour:null;if((null==n||n<=0)&&r>i){const e=(a-t)/3600;e>0&&(n=(r-i)/e)}if(n>0){const e=(100-r)/n,o=b?y.estimated_full_timestamp:a+3600*e,l=e=>n*((e-t)/3600)+i,c=[t,a,o].map(e=>[1e3*e,Math.max(0,Math.min(100,l(e)))]);E.push({name:"Charge prediction",type:"line",data:c,smooth:!1,symbol:"none",lineStyle:{width:2,type:"dashed",color:s},itemStyle:{color:s}})}}const L=(e,t)=>({show:!0,formatter:e,position:"left",fontSize:10,color:t,distance:6,backgroundColor:"rgba(0,0,0,0.6)",borderRadius:3,padding:[3,6]});let R=null;if(null!=u.slope_per_day&&u.slope_per_day<0&&null!=u.intercept&&null!=m&&!v){const e=m+(g-u.intercept)/u.slope_per_day*86400;1e3*e>Date.now()&&(R=1e3*e)}if(f.length>0&&null!=u.slope_per_day&&null!=u.intercept&&null!=m){const e=e=>{const t=(e/1e3-m)/86400;return u.slope_per_day*t+u.intercept},t=u.estimated_empty_timestamp?1e3*u.estimated_empty_timestamp:null,i=f[f.length-1][0];R&&R>i-1&&R<(t||1/0)&&f.push([R,Math.max(0,Math.min(100,e(R)))]),t&&t>i+1&&f.push([t,Math.max(0,e(t))])}const D=_[0]?.[0]||C,T=Math.max(f.length?f[f.length-1][0]:A,R||0,A);if(E.push({name:"Threshold",type:"line",data:[[D,g],[T,g]],symbol:"none",lineStyle:{width:1,type:"dotted",color:r},itemStyle:{color:r}}),R){const e=new Date(R),t=(R-Date.now())/36e5<=48?e.toLocaleString(void 0,{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}):e.toLocaleDateString(void 0,{day:"numeric",month:"short",year:"numeric"});E.push({name:"Low battery",type:"line",data:[{value:[R,0],symbol:"none",symbolSize:0},{value:[R,g],symbol:"diamond",symbolSize:6,label:L(`Low ${t}`,r)}],lineStyle:{width:1,type:"dotted",color:r},itemStyle:{color:r},tooltip:{show:!1}})}const j=e.replacement_history||[];if(j.length>0){const e=this._resolveColor("--success-color","#4caf50");for(let t=0;t<j.length;t++){const i=1e3*j[t],a=new Date(i).toLocaleDateString(void 0,{day:"numeric",month:"short"});E.push({name:0===t?"Replaced":`Replaced ${t+1}`,type:"line",data:[{value:[i,0],symbol:"none",symbolSize:0},{value:[i,100],symbol:"diamond",symbolSize:6,label:L(`Replaced ${a}`,e)}],lineStyle:{width:1,type:"dashed",color:e},itemStyle:{color:e},tooltip:{show:!1}})}}const z=e.suspected_replacements||[];if(z.length>0){const e=this._resolveColor("--warning-color","#ff9800");for(let t=0;t<z.length;t++){const i=1e3*z[t].timestamp,a=new Date(i).toLocaleDateString(void 0,{day:"numeric",month:"short"});E.push({name:0===t?"Suspected":`Suspected ${t+1}`,type:"line",data:[{value:[i,0],symbol:"none",symbolSize:0},{value:[i,100],symbol:"diamond",symbolSize:6,label:L(`Replaced? ${a}`,e)}],lineStyle:{width:1,type:"dotted",color:e},itemStyle:{color:e},tooltip:{show:!1}})}}const H=t.clientWidth<500,M={xAxis:{type:"time",axisLabel:{color:n,fontSize:H?10:12},axisLine:{lineStyle:{color:o}},splitLine:{lineStyle:{color:o}}},yAxis:{type:"value",min:0,max:100,axisLabel:{formatter:"{value}%",color:n},axisLine:{lineStyle:{color:o}},splitLine:{lineStyle:{color:o}}},tooltip:{trigger:"axis",backgroundColor:l,borderColor:o,textStyle:{color:c},formatter:e=>{if(!e||0===e.length)return"";const t=new Date(e[0].value[0]);let i=`<b>${t.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})+" "+t.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}</b><br>`;for(const t of e){if(t.seriesName?.startsWith("Replaced")||"Low battery"===t.seriesName)continue;const e="number"==typeof t.value[1]?t.value[1].toFixed(1)+"%":"—";i+=`${t.marker} ${t.seriesName}: ${e}<br>`}return i}},legend:{show:!0,bottom:0,data:E.filter(e=>!e.name?.startsWith("Replaced")&&"Low battery"!==e.name).map(e=>e.name).filter((e,t,i)=>i.indexOf(e)===t),textStyle:{color:d,fontSize:H?10:11},itemWidth:H?12:16,itemHeight:H?8:10,itemGap:H?6:8,padding:[4,0,0,0],selected:{"Discharge prediction":!v,"Charge prediction":v}},dataZoom:[{type:"slider",xAxisIndex:0,filterMode:"none",startValue:C,endValue:A,bottom:H?30:24,height:H?18:22,borderColor:o,fillerColor:"rgba(100,150,200,0.15)",handleStyle:{color:i},dataBackground:{lineStyle:{color:i,opacity:.3},areaStyle:{color:i,opacity:.05}},textStyle:{color:n,fontSize:10}},{type:"inside",xAxisIndex:0,filterMode:"none"}],grid:{left:H?40:50,right:H?10:20,top:20,bottom:H?82:72,containLabel:!1}};let P=this._chartEl;P&&t.contains(P)||(P=document.createElement("ha-chart-base"),t.innerHTML="",t.appendChild(P),this._chartEl=P),P.hass=this._hass,requestAnimationFrame(()=>{P.data=E,P.options=M})}get _tabs(){const e=this._basePath;return[{path:`${e}/devices`,name:"Devices",iconPath:"M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z"},{path:`${e}/shopping`,name:"Shopping List",iconPath:"M17,18A2,2 0 0,1 19,20A2,2 0 0,1 17,22C15.89,22 15,21.1 15,20C15,18.89 15.89,18 17,18M1,2H4.27L5.21,4H20A1,1 0 0,1 21,5C21,5.17 20.95,5.34 20.88,5.5L17.3,11.97C16.96,12.58 16.3,13 15.55,13H8.1L7.2,14.63L7.17,14.75A0.25,0.25 0 0,0 7.42,15H19V17H7C5.89,17 5,16.1 5,15C5,14.65 5.09,14.32 5.24,14.04L6.6,11.59L3,4H1V2M7,18A2,2 0 0,1 9,20A2,2 0 0,1 7,22C5.89,22 5,21.1 5,20C5,18.89 5.89,18 7,18M16,11L18.78,6H6.14L8.5,11H16Z"}]}get _route(){return{path:`/${"detail"===this._activeView?"devices":this._activeView}`,prefix:this._basePath}}render(){if(!this._hass)return B`<div class="loading">Loading...</div>`;const e="detail"===this._activeView;return B`
      <hass-tabs-subpage
        .hass=${this._hass}
        .narrow=${this.narrow}
        .tabs=${this._tabs}
        .route=${this._route}
        ?main-page=${!e}
        .backCallback=${e?()=>this._closeDetail():void 0}
      >
        ${e?B`<span slot="header">${this._getDevice(this._detailEntity)?.name||this._detailEntity}</span>`:F}
        <div slot="toolbar-icon" style="display:flex">
          <ha-icon-button
            id="refreshBtn"
            class=${this._refreshing?"spinning":""}
            title="Re-fetch all battery data and recalculate predictions"
            .disabled=${this._refreshing}
            @click=${this._refresh}
          >
            <ha-icon icon="mdi:refresh"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            title="Settings"
            @click=${this._toggleSettings}
          >
            <ha-icon icon="mdi:cog"></ha-icon>
          </ha-icon-button>
        </div>
        <div id="jp-content">
          ${e?this._renderDetailView():this._renderMainView()}
        </div>
      </hass-tabs-subpage>
    `}_renderMainView(){const e=this._entities.length;let t=0,i=0,a=0,r=0,s=0;for(const e of this._entities)e.isLow&&t++,e.isStale&&i++,null===e.level&&a++,e.replacementPending&&r++,e.anomaly&&"normal"!==e.anomaly&&s++;return B`
      ${this._renderSummaryCards(e,t,i,a,r,s)}
      ${this._settingsOpen&&this._configEntry?this._renderSettings():F}
      ${this._renderFilterBar()}
      ${"shopping"===this._activeView?this._renderShoppingList():this._renderDeviceTable()}
    `}_renderSummaryCards(e,t,i,a,r,s){const n=(e,t,i,a="inherit")=>{const r={"summary-card":!0,clickable:!0,"active-filter":this._filterCategory===e};return B`
        <div class=${ue(r)} @click=${()=>this._setFilter(e)}>
          <div class="value" style="color:${t>0?a:"inherit"}">${t}</div>
          <div class="label">${i}</div>
        </div>
      `};return B`
      <div class="summary">
        <div
          class="summary-card clickable ${null===this._filterCategory?"active-filter":""}"
          @click=${()=>this._setFilter(null)}
        >
          <div class="value">${e}</div>
          <div class="label">Monitored</div>
        </div>
        ${n("low",t,"Low battery","var(--error-color)")}
        ${n("stale",i,"Stale","var(--warning-color)")}
        ${a>0?n("unavailable",a,"Unavailable","var(--disabled-text-color)"):F}
        ${r>0?n("pending",r,"Pending","var(--primary-color)"):F}
        ${s>0?n("anomaly",s,"Anomaly","var(--error-color)"):F}
        ${this._ignoredEntities?.length>0?n("ignored",this._ignoredEntities.length,"Ignored","var(--secondary-text-color)"):F}
      </div>
    `}_renderSettings(){const e=this._settingsValues;return B`
      <ha-card header="Settings" class="settings-card">
        <div class="card-content">
          ${this._renderSettingRow("Low battery threshold","Devices below this level trigger a juice_patrol_battery_low event.","low_threshold",e.low_threshold??20,1,99,"%")}
          ${this._renderSettingRow("Stale device timeout","Devices not reporting within this period are marked stale.","stale_timeout",e.stale_timeout??48,1,720,"hrs")}
          ${this._renderSettingRow("Prediction alert horizon","Alert when a device is predicted to die within this many days.","prediction_horizon",e.prediction_horizon??7,1,90,"days")}
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
    `}_renderSettingRow(e,t,i,a,r,s,n){return B`
      <ha-settings-row>
        <span slot="heading">${e}</span>
        <span slot="description">${t}</span>
        <ha-textfield
          type="number"
          .min=${String(r)}
          .max=${String(s)}
          data-key=${i}
          .value=${String(a)}
          .suffix=${n}
          style="width: 90px"
          @input=${this._handleSettingInput}
        ></ha-textfield>
      </ha-settings-row>
    `}_renderFilterBar(){const e={low:"Low battery",stale:"Stale",unavailable:"Unavailable",pending:"Pending",anomaly:"Anomaly",ignored:"Ignored"}[this._filterCategory]||this._filterCategory;return B`
      <div class="filter-bar">
        <div class="search-field">
          <ha-icon
            icon="mdi:magnify"
            style="--mdc-icon-size:20px;color:var(--secondary-text-color)"
          ></ha-icon>
          <input
            type="text"
            placeholder="Filter devices..."
            .value=${this._filterText}
            @input=${this._handleSearchInput}
          />
          ${this._filterText?B`<button
                class="search-clear"
                title="Clear search"
                @click=${this._clearSearch}
              >
                <ha-icon icon="mdi:close" style="--mdc-icon-size:16px"></ha-icon>
              </button>`:F}
        </div>
        ${this._filterCategory?B`<button class="filter-chip" @click=${this._clearFilter}>
              <ha-icon
                icon="mdi:filter-remove"
                style="--mdc-icon-size:14px"
              ></ha-icon>
              ${e}
              <ha-icon icon="mdi:close" style="--mdc-icon-size:14px"></ha-icon>
            </button>`:F}
      </div>
    `}_renderDeviceTable(){if("ignored"===this._filterCategory)return this._renderIgnoredDevices();const e=this._getFilteredEntities();return 0===e.length?0!==this._entities.length||this._configEntry?B`<div class="devices">
        <div class="empty-state">
          ${0===this._entities.length?"No battery devices discovered yet.":"No devices match the current filter."}
        </div>
      </div>`:B`<div class="devices">
          <div class="loading-state">
            <ha-spinner size="small"></ha-spinner>
            <div>Discovering battery devices\u2026</div>
          </div>
        </div>`:B`
      <div class="devices">
        ${this._renderDeviceHeader()}
        ${$e(e,e=>e.sourceEntity,e=>this._renderDeviceRow(e))}
      </div>
    `}_renderIgnoredDevices(){const e=this._ignoredEntities;return e?0===e.length?B`<div class="devices">
        <div class="empty-state">No ignored devices.</div>
      </div>`:B`
      <div class="devices">
        ${$e(e,e=>e.entity_id,e=>B`
            <div class="ignored-row">
              <ha-icon
                icon="mdi:eye-off"
                style="--mdc-icon-size:20px; color:var(--secondary-text-color)"
              ></ha-icon>
              <div class="ignored-info">
                <div class="ignored-name">${e.name}</div>
                <div class="ignored-entity">${e.entity_id}</div>
              </div>
              ${null!==e.level?B`<div class="ignored-level">${Math.round(e.level)}%</div>`:F}
              <ha-button
                @click=${()=>this._unignoreDevice(e.entity_id)}
                title="Stop ignoring this device"
              >
                <ha-icon slot="start" icon="mdi:eye"></ha-icon>
                Restore
              </ha-button>
            </div>
          `)}
      </div>
    `:B`<div class="devices">
        <div class="empty-state">Loading ignored devices\u2026</div>
      </div>`}_renderSortHeader(e,t,i={}){const a=this._sortCol===e,r=a?this._sortAsc?"▲":"▼":"";return B`
      <div
        class="sort-header ${a?"active":""}"
        style=${i.style||""}
        title=${i.title||""}
        @click=${t=>{t.stopPropagation(),this._toggleSort(e)}}
      >
        ${t}${r?B`<span class="sort-arrow">${r}</span>`:F}
      </div>
    `}_renderDeviceHeader(){return B`
      <div class="device-header">
        <div></div>
        ${this._renderSortHeader("name","Device",{style:"justify-content:flex-start"})}
        ${this._renderSortHeader("level","Level",{style:"justify-content:flex-start"})}
        ${this._renderSortHeader("type","Type",{style:"justify-content:flex-start"})}
        ${this._renderSortHeader("rate","Rate")}
        ${this._renderSortHeader("days","Left")}
        ${this._renderSortHeader("reliability","Rel",{title:"Prediction reliability score (0-100%)"})}
        ${this._renderSortHeader("empty","Empty by")}
        <div></div>
      </div>
    `}_renderDeviceRow(e){const t=this._recentlyChanged.get(e.sourceEntity),i={"device-row":!0,attention:!e.replacementPending&&(e.isLow||e.isStale||e.anomaly&&"normal"!==e.anomaly),pending:e.replacementPending,"just-updated-up":"up"===t?.dir,"just-updated-down":"down"===t?.dir};return B`
      <div
        class=${ue(i)}
        data-entity=${e.sourceEntity}
        @click=${()=>this._handleRowClick(e.sourceEntity)}
      >
        <div class="icon-cell">
          <ha-icon
            icon=${this._getBatteryIcon(e)}
            style="color:${this._getLevelColor(e.level,e.threshold)}"
          ></ha-icon>
        </div>
        <div class="name-cell">
          <div>${e.name||e.sourceEntity}${this._renderBadges(e)}</div>
          ${this._renderDeviceSub(e)}
        </div>
        ${this._renderLevelCell(e)}
        <div
          class="type-cell"
          title=${e.batteryTypeSource?`Source: ${e.batteryTypeSource}`:""}
        >
          ${e.batteryType||"—"}
        </div>
        <div class="data-cell">${this._formatRate(e)}</div>
        <div class="data-cell">${this._formatTimeRemaining(e)}</div>
        <div class="data-cell reliability-cell">${this._renderReliabilityBadge(e)}</div>
        <div class="data-cell">
          ${e.predictedEmpty?this._formatDate(e.predictedEmpty,this._isFastDischarge(e)):"—"}
        </div>
        <div class="action-cell">
          <ha-dropdown
              @wa-select=${t=>this._handleMenuSelect(t,e.sourceEntity)}
            >
              <ha-icon-button
                slot="trigger"
                @click=${e=>{e.stopPropagation();const t=e.currentTarget.closest("ha-dropdown");t&&(t.open?t.hideMenu():t.showMenu())}}
              >
                <ha-icon icon="mdi:dots-vertical"></ha-icon>
              </ha-icon-button>
              ${this._renderDropdownItems(e)}
            </ha-dropdown>
        </div>
      </div>
    `}_renderBadges(e){const t=[];if(e.replacementPending){const i=e.isRechargeable?"RECHARGED?":"REPLACED?",a=e.isRechargeable?"Battery level jumped significantly — normal recharge cycle?":"Battery level jumped significantly — was the battery replaced?";t.push(B`<span class="badge replaced" title=${a}>${i}</span>`)}if(e.isLow){const i=e.threshold??this._settingsValues.low_threshold??20;t.push(B`<span
          class="badge low"
          title="Battery is at ${this._displayLevel(e.level)}%, below the ${i}% threshold"
          >LOW</span
        >`)}e.isStale&&t.push(B`<span
          class="badge stale"
          title="No battery reading received within the stale timeout period"
          >STALE</span
        >`),"cliff"===e.anomaly?t.push(B`<span
          class="badge cliff"
          title="Sudden drop of ${e.dropSize??"?"}% in a single reading interval"
          >CLIFF DROP</span
        >`):"rapid"===e.anomaly&&t.push(B`<span
          class="badge rapid"
          title="Discharge rate significantly higher than average \u2014 ${e.dropSize??"?"}% drop"
          >RAPID</span
        >`),"erratic"===e.stability&&t.push(B`<span class="badge erratic" title=${this._erraticTooltip(e)}
          >ERRATIC</span
        >`);const i=e.isRechargeable?new Set(["flat","charging"]):new Set;if(!e.predictedEmpty&&this._predictionReason(e)&&!i.has(e.predictionStatus)){const i=this._predictionReason(e);t.push(B`<span
          class="badge prediction-reason"
          title=${this._predictionReasonDetail(e.predictionStatus)||""}
          >No prediction: ${i}</span
        >`)}if(e.isRechargeable&&(this._isActivelyCharging(e)?t.push(B`<span class="badge charging" title="Currently charging">
            <ha-icon
              icon="mdi:battery-charging"
              style="--mdc-icon-size:14px"
            ></ha-icon>
            Charging
          </span>`):t.push(B`<span
            class="badge rechargeable"
            title="Rechargeable: ${e.rechargeableReason||"detected"}"
          >
            <ha-icon
              icon="mdi:power-plug-battery"
              style="--mdc-icon-size:14px"
            ></ha-icon>
          </span>`)),null!==e.meanLevel&&e.stability&&"stable"!==e.stability&&"insufficient_data"!==e.stability){const i=this._displayLevel(e.meanLevel),a=this._displayLevel(e.level);null!==i&&Math.abs(i-(a??0))>2&&t.push(B`<span
            class="badge avg"
            title="7-day average is ${i}% while current reading is ${a??"?"}%"
            >avg ${i}%</span
          >`)}return t}_renderDeviceSub(e){const t=[],i=(e.name||"").toLowerCase();e.manufacturer&&!i.includes(e.manufacturer.toLowerCase())&&t.push(e.manufacturer),e.model&&!i.includes(e.model.toLowerCase())&&t.push(e.model);let a=t.join(" ");return a&&e.platform?a+=` · ${e.platform}`:!a&&e.platform&&(a=e.platform),a?B`<div class="name-sub">${a}</div>`:F}_renderLevelCell(e){const t=this._getLevelColor(e.level,e.threshold);return B`<div class="level-cell" style="color:${t}">${this._formatLevel(e.level)}</div>`}_renderReliabilityBadge(e){const t=e.reliability,i=null!==e.daysRemaining||null!==e.hoursRemaining;if(null==t||!i)return"—";return B`<span
      class="reliability-badge ${t>=70?"high":t>=40?"medium":"low"}"
      title="Prediction reliability: ${t}%"
      >${t}%</span
    >`}_renderDropdownItems(e){return B`
      <ha-dropdown-item value="detail">
        <ha-icon slot="icon" icon="mdi:information-outline"></ha-icon>
        More info
      </ha-dropdown-item>
      <wa-divider></wa-divider>
      ${e?.replacementPending?B`
      <ha-dropdown-item value="confirm">
        <ha-icon slot="icon" icon="mdi:check-circle-outline"></ha-icon>
        Confirm replacement
      </ha-dropdown-item>`:F}
      <ha-dropdown-item value="replace">
        <ha-icon slot="icon" icon="mdi:battery-sync"></ha-icon>
        Mark as replaced
      </ha-dropdown-item>
      ${e?.lastReplaced?B`
      <ha-dropdown-item value="undo-replace">
        <ha-icon slot="icon" icon="mdi:undo"></ha-icon>
        Undo replacement
      </ha-dropdown-item>`:F}
      <ha-dropdown-item value="recalculate">
        <ha-icon slot="icon" icon="mdi:calculator-variant"></ha-icon>
        Recalculate
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
    `}_renderShoppingList(){if(this._shoppingLoading)return B`<div class="devices">
        <div class="empty-state">Loading shopping list...</div>
      </div>`;if(!this._shoppingData||!this._shoppingData.groups)return B`<div class="devices">
        <div class="empty-state">
          No shopping data available. Click refresh to load.
        </div>
      </div>`;const{groups:e,total_needed:t}=this._shoppingData;return 0===e.length?B`<div class="devices">
        <div class="empty-state">No battery devices found.</div>
      </div>`:B`
      <div class="shopping-summary">
        <div class="summary-card">
          <div
            class="value"
            style="color:${t>0?"var(--warning-color)":"var(--success-color)"}"
          >
            ${t}
          </div>
          <div class="label">Batteries needed</div>
        </div>
        ${e.filter(e=>e.needs_replacement>0&&"Unknown"!==e.battery_type).map(e=>B`
              <div class="summary-card shopping-need-card">
                <div class="value">${e.needs_replacement}</div>
                <div class="label">${e.battery_type}</div>
              </div>
            `)}
      </div>
      <div class="shopping-groups">
        ${e.map(e=>this._renderShoppingGroup(e))}
      </div>
      ${e.some(e=>"Unknown"===e.battery_type)?B`<div class="shopping-hint">
            <ha-icon
              icon="mdi:information-outline"
              style="--mdc-icon-size:16px"
            ></ha-icon>
            Devices with unknown battery type can be configured from the Devices tab.
          </div>`:F}
    `}_renderShoppingGroup(e){const t="Unknown"===e.battery_type?"mdi:help-circle-outline":"mdi:battery",i=!!this._expandedGroups[e.battery_type],a=`${e.battery_count} batter${1!==e.battery_count?"ies":"y"} in ${e.device_count} device${1!==e.device_count?"s":""}${e.needs_replacement>0?` — ${e.needs_replacement} need${1!==e.needs_replacement?"":"s"} replacement`:""}`;return B`
      <ha-expansion-panel
        outlined
        .expanded=${i}
        @expanded-changed=${t=>{const i={...this._expandedGroups};t.detail.expanded?i[e.battery_type]=!0:delete i[e.battery_type],this._expandedGroups=i}}
      >
        <ha-icon slot="leading-icon" icon=${t} style="--mdc-icon-size:20px"></ha-icon>
        <span slot="header" class="shopping-type">${e.battery_type}</span>
        <span slot="secondary">
          ${e.needs_replacement>0?B`<span class="shopping-need-badge">${e.needs_replacement}\u00d7</span> `:F}
          ${a}
        </span>
        <div class="shopping-devices-inner">
          ${e.devices.map(e=>{const t=this._getLevelColor(e.level,null),i=e.is_low||null!==e.days_remaining&&e.days_remaining<=(this._settingsValues.prediction_horizon??7),a=e.battery_count>1?` (${e.battery_count}×)`:"";return B`
              <div class="shopping-device ${i?"needs-replacement":""}">
                <span class="shopping-device-name"
                  >${e.device_name}${a}</span
                >
                <span class="shopping-device-level" style="color:${t}">
                  ${this._formatLevel(e.level)}
                </span>
                <span class="shopping-device-days">
                  ${null!==e.days_remaining?e.days_remaining+"d":"—"}
                </span>
              </div>
            `})}
        </div>
      </ha-expansion-panel>
    `}_renderDetailView(){const e=this._detailEntity,t=this._getDevice(e);return t?B`
      ${this._renderDetailMeta(t)} ${this._renderDetailChart()}
      ${this._renderDetailActions()}
    `:B`<div class="empty-state">Device not found</div>`}_renderDetailMeta(e){const t=this._chartData,i=t?.prediction||{},a={normal:"Normal discharge",charging:"Currently charging",flat:"Flat — no significant discharge detected",noisy:"Noisy — data too irregular for prediction",insufficient_data:"Not enough data for prediction",single_level:"Single level — all readings identical",insufficient_range:"Insufficient range — readings too close together"}[i.status]||i.status||"Unknown",r=this._getLevelColor(e.level,e.threshold);return B`
      <div class="detail-meta">
        <div class="detail-meta-grid">
          <div class="detail-meta-item">
            <div class="detail-meta-label">Current Level</div>
            <div class="detail-meta-value" style="color:${r}">
              ${this._formatLevel(e.level)}
            </div>
          </div>
          <div class="detail-meta-item">
            <div class="detail-meta-label">Battery Type</div>
            <div class="detail-meta-value">${e.batteryType||"—"}</div>
          </div>
          <div class="detail-meta-item">
            <div class="detail-meta-label">Discharge Rate</div>
            <div class="detail-meta-value">${this._formatRate(e)}</div>
          </div>
          <div class="detail-meta-item">
            <div class="detail-meta-label">Time Remaining</div>
            <div class="detail-meta-value">${this._formatTimeRemaining(e)}</div>
          </div>
          <div class="detail-meta-item">
            <div class="detail-meta-label">Status</div>
            <div class="detail-meta-value">${a}</div>
          </div>
          <div class="detail-meta-item">
            <div class="detail-meta-label">Confidence</div>
            <div class="detail-meta-value">
              <span class="confidence-dot ${i.confidence||""}"></span>
              ${i.confidence||"—"}
            </div>
          </div>
          ${null!=i.r_squared?B`<div class="detail-meta-item">
                <div class="detail-meta-label" title="How well the trend line fits the data. 1.0 = perfect fit, 0.0 = no pattern. Above 0.7 is a good fit, below 0.3 means the data is too scattered for a reliable prediction.">R\u00b2</div>
                <div class="detail-meta-value">${i.r_squared.toFixed(3)}</div>
              </div>`:F}
          ${null!=i.reliability?B`<div class="detail-meta-item">
                <div class="detail-meta-label">Reliability</div>
                <div class="detail-meta-value">${this._renderReliabilityBadge(e)}</div>
              </div>`:F}
          <div class="detail-meta-item">
            <div class="detail-meta-label">Data Points</div>
            <div class="detail-meta-value">
              ${i.data_points_used??t?.readings?.length??"—"}${t?.session_count?B` <span style="color:var(--secondary-text-color); font-size:0.85em">(${t.session_count} session${1!==t.session_count?"s":""})</span>`:F}
            </div>
          </div>
          ${t?.charge_prediction?.estimated_full_timestamp?B`<div class="detail-meta-item">
                <div class="detail-meta-label">Predicted Full</div>
                <div class="detail-meta-value">
                  ${this._formatDate(1e3*t.charge_prediction.estimated_full_timestamp,!0)}
                </div>
              </div>`:e.predictedEmpty?B`<div class="detail-meta-item">
                <div class="detail-meta-label">Predicted Empty</div>
                <div class="detail-meta-value">
                  ${this._formatDate(e.predictedEmpty,this._isFastDischarge(e))}
                </div>
              </div>`:F}
          ${e.lastCalculated?B`<div class="detail-meta-item">
                <div class="detail-meta-label">Last Calculated</div>
                <div class="detail-meta-value">
                  ${this._formatDate(1e3*e.lastCalculated,!0)}
                </div>
              </div>`:F}
        </div>
        ${e.predictedEmpty||!i.status||"normal"===i.status||"charging"===i.status&&t?.charge_prediction?.estimated_full_timestamp?F:B`<div class="detail-reason">
              <ha-icon icon="mdi:information-outline" style="--mdc-icon-size:18px; color:var(--secondary-text-color); flex-shrink:0"></ha-icon>
              <div>
                <strong>Why is there no prediction?</strong>
                <div class="detail-reason-text">${this._predictionReasonDetail(i.status)||"Unknown reason."}</div>
              </div>
            </div>`}
      </div>
    `}_renderDetailChart(){if(this._chartLoading)return B`
        <div class="detail-chart" id="jp-chart">
          <div class="loading-state">
            <ha-spinner size="small"></ha-spinner>
            <div>Loading chart data\u2026</div>
          </div>
        </div>
      `;if(!(this._chartData&&this._chartData.readings&&this._chartData.readings.length>0))return B`
        <div class="detail-chart" id="jp-chart">
          <div class="empty-state">Not enough data yet to display a chart.</div>
        </div>
      `;return B`
      <div class="chart-range-bar">
        ${[{key:"auto",label:"Auto"},{key:"1w",label:"1W"},{key:"1m",label:"1M"},{key:"3m",label:"3M"},{key:"6m",label:"6M"},{key:"1y",label:"1Y"},{key:"all",label:"All"}].map(e=>B`
            <button
              class="range-pill ${this._chartRange===e.key?"active":""}"
              @click=${()=>{this._chartRange=e.key}}
            >${e.label}</button>
          `)}
      </div>
      <div class="detail-chart" id="jp-chart"></div>
    `}_renderDetailActions(){const e=this._detailEntity;if(!e)return F;const t=this._getDevice(e),i=this._chartData,a=i?.replacement_history||[],r=i?.suspected_replacements||[];return B`
      ${a.length>0||r.length>0?B`
        <div class="replacement-history">
          <div class="detail-meta-label" style="margin-bottom: 4px">Replacement History</div>
          <div class="replacement-history-list">
            ${[...a].reverse().map(e=>B`
              <div class="replacement-history-item">
                <ha-icon icon="mdi:battery-sync" style="--mdc-icon-size:16px; color:var(--secondary-text-color)"></ha-icon>
                <span>${this._formatDate(1e3*e,!0)}</span>
              </div>
            `)}
            ${r.map(t=>B`
              <div class="replacement-history-item suspected">
                <ha-icon icon="mdi:help-circle-outline" style="--mdc-icon-size:16px; color:var(--warning-color, #ff9800)"></ha-icon>
                <span style="flex:1">${this._formatDate(1e3*t.timestamp,!0)}
                  <span style="color:var(--secondary-text-color); font-size:0.85em"> — suspected (${Math.round(t.old_level)}% → ${Math.round(t.new_level)}%)</span>
                </span>
                <ha-icon-button
                  .path=${"M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"}
                  style="--mdc-icon-button-size:28px; color:var(--success-color, #4caf50)"
                  @click=${()=>this._confirmSuspectedReplacement(e,t.timestamp)}
                ></ha-icon-button>
                <ha-icon-button
                  .path=${"M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"}
                  style="--mdc-icon-button-size:28px; color:var(--error-color, #f44336)"
                  @click=${()=>this._denySuspectedReplacement(e,t.timestamp)}
                ></ha-icon-button>
              </div>
            `)}
          </div>
        </div>
      `:F}
      <div class="detail-actions">
        <ha-button
          @click=${()=>{this.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:e}}))}}
        >
          <ha-icon slot="start" icon="mdi:information-outline"></ha-icon>
          More info
        </ha-button>
        <ha-button
          @click=${()=>this._markReplaced(e)}
        >
          <ha-icon slot="start" icon="mdi:battery-sync"></ha-icon>
          Mark as replaced
        </ha-button>
        ${t?.lastReplaced?B`
        <ha-button variant="danger"
          @click=${()=>this._undoReplacement(e)}
        >
          <ha-icon slot="start" icon="mdi:undo"></ha-icon>
          Undo replacement
        </ha-button>`:F}
        <ha-button
          @click=${async()=>{await this._recalculate(e),setTimeout(()=>this._loadChartData(e),500)}}
        >
          <ha-icon slot="start" icon="mdi:calculator-variant"></ha-icon>
          Recalculate
        </ha-button>
        <ha-button
          @click=${()=>this._setBatteryType(e,t?.batteryType)}
        >
          <ha-icon slot="start" icon="mdi:battery-heart-variant"></ha-icon>
          Set battery type
        </ha-button>
        <ha-button
          @click=${()=>this._ignoreDevice(e)}
        >
          <ha-icon slot="start" icon="mdi:eye-off"></ha-icon>
          Ignore device
        </ha-button>
      </div>
    `}static get styles(){return s`
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
      #jp-content {
        padding: 16px;
      }
      .summary {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
      .summary-card {
        background: var(--card-bg);
        border-radius: 12px;
        padding: 16px 20px;
        min-width: 120px;
        border: 1px solid var(--border);
      }
      .summary-card.clickable {
        cursor: pointer;
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .summary-card.clickable:hover {
        border-color: var(--primary-color);
      }
      .summary-card.active-filter {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 1px var(--primary-color);
      }
      .filter-bar {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
      }
      .search-field {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        padding: 8px 12px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--card-bg);
      }
      .search-field:focus-within {
        border-color: var(--primary-color);
      }
      .search-field input {
        flex: 1;
        border: none;
        background: none;
        outline: none;
        font-size: 14px;
        color: var(--primary-text-color);
        font-family: inherit;
      }
      .search-field input::placeholder {
        color: var(--secondary-text-color);
      }
      .search-clear {
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        border-radius: 50%;
      }
      .search-clear:hover {
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
      }
      .filter-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 6px 10px;
        border: 1px solid var(--primary-color);
        border-radius: 16px;
        background: color-mix(in srgb, var(--primary-color) 10%, transparent);
        color: var(--primary-color);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
        font-family: inherit;
      }
      .filter-chip:hover {
        background: color-mix(in srgb, var(--primary-color) 20%, transparent);
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
      .devices {
        background: var(--card-bg);
        border-radius: 12px;
        border: 1px solid var(--border);
        overflow: hidden;
      }
      .device-row {
        display: grid;
        grid-template-columns: 44px 1fr 90px 70px 80px 90px 50px 100px 56px;
        align-items: center;
        padding: 10px 16px;
        gap: 6px;
        border-bottom: 1px solid var(--border);
        cursor: pointer;
      }
      .device-row:last-child {
        border-bottom: none;
      }
      .device-row:hover {
        background: var(--secondary-background-color);
      }
      .device-row.attention {
        background: color-mix(in srgb, var(--error-color, #db4437) 8%, transparent);
      }
      .device-row.attention:hover {
        background: color-mix(in srgb, var(--error-color, #db4437) 14%, transparent);
      }
      .device-row.pending {
        background: color-mix(in srgb, var(--primary-color) 8%, transparent);
      }
      .device-row.pending:hover {
        background: color-mix(in srgb, var(--primary-color) 14%, transparent);
      }
      .ignored-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
      }
      .ignored-row:last-child {
        border-bottom: none;
      }
      .ignored-info {
        flex: 1;
        min-width: 0;
      }
      .ignored-name {
        font-size: 14px;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ignored-entity {
        font-size: 12px;
        color: var(--secondary-text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ignored-level {
        font-size: 14px;
        color: var(--secondary-text-color);
        white-space: nowrap;
      }
      .device-header {
        display: grid;
        grid-template-columns: 44px 1fr 90px 70px 80px 90px 50px 100px 56px;
        padding: 10px 16px;
        gap: 6px;
        font-size: 12px;
        font-weight: 500;
        color: var(--secondary-text-color);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 2px solid var(--border);
      }
      .icon-cell {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .icon-cell ha-icon {
        --mdc-icon-size: 24px;
      }
      .name-cell {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
      }
      .name-sub {
        font-size: 11px;
        color: var(--secondary-text-color);
        opacity: 0.7;
        margin-top: 1px;
      }
      .badge {
        display: inline-block;
        font-size: 9px;
        padding: 1px 5px;
        border-radius: 4px;
        margin-left: 4px;
        font-weight: 500;
        vertical-align: middle;
      }
      .badge.low {
        background: color-mix(in srgb, var(--error-color) 20%, transparent);
        color: var(--error-color);
      }
      .badge.stale {
        background: color-mix(in srgb, var(--warning-color) 20%, transparent);
        color: var(--warning-color);
      }
      .badge.replaced {
        background: color-mix(in srgb, var(--primary-color) 20%, transparent);
        color: var(--primary-color);
      }
      .badge.cliff,
      .badge.rapid {
        background: color-mix(in srgb, var(--error-color) 15%, transparent);
        color: var(--error-color);
      }
      .badge.erratic {
        background: color-mix(in srgb, var(--warning-color) 15%, transparent);
        color: var(--warning-color);
      }
      .badge.noisy {
        background: color-mix(in srgb, var(--warning-color) 15%, transparent);
        color: var(--warning-color);
      }
      .badge.rechargeable {
        background: color-mix(
          in srgb,
          var(--success-color, #43a047) 15%,
          transparent
        );
        color: var(--success-color, #43a047);
        padding: 2px 5px;
        display: inline-flex;
        align-items: center;
      }
      .badge.charging {
        background: color-mix(
          in srgb,
          var(--success-color, #43a047) 20%,
          transparent
        );
        color: var(--success-color, #43a047);
        padding: 2px 5px;
        display: inline-flex;
        align-items: center;
        gap: 2px;
      }
      .badge.avg {
        background: color-mix(in srgb, var(--info-color, #039be5) 15%, transparent);
        color: var(--info-color, #039be5);
      }
      .level-cell {
        font-size: 14px;
        font-weight: 500;
        text-align: left;
      }
      .data-cell {
        font-size: 13px;
        color: var(--secondary-text-color);
        text-align: right;
      }
      .action-cell {
        display: flex;
        justify-content: center;
      }
      .action-btn {
        background: none;
        border: 1px solid var(--border);
        border-radius: 6px;
        cursor: pointer;
        padding: 4px 6px;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        font-family: inherit;
      }
      .action-btn:hover {
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
      }
      .action-btn.confirm {
        border-color: var(--primary-color);
        color: var(--primary-color);
      }
      .confidence-dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        margin-right: 4px;
        vertical-align: middle;
      }
      .confidence-dot.high {
        background: var(--success-color);
      }
      .confidence-dot.medium {
        background: var(--warning-color);
      }
      .confidence-dot.low {
        background: var(--error-color);
      }
      .sort-header {
        cursor: pointer;
        user-select: none;
        display: flex;
        align-items: center;
        gap: 2px;
        justify-content: flex-end;
      }
      .sort-header:first-of-type {
        justify-content: flex-start;
      }
      .sort-header:hover {
        color: var(--primary-text-color);
      }
      .sort-header.active {
        color: var(--primary-color);
      }
      .sort-arrow {
        font-size: 10px;
      }
      .type-cell {
        font-size: 12px;
        color: var(--secondary-text-color);
        text-align: left;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
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
      ha-dropdown {
        --ha-dropdown-font-size: 14px;
      }
      .jp-dialog-desc {
        font-size: 13px;
        color: var(--secondary-text-color);
        margin-bottom: 12px;
      }
      .jp-dialog-input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--primary-background-color);
        color: var(--primary-text-color);
        font-size: 14px;
        outline: none;
        box-sizing: border-box;
      }
      .jp-dialog-input:focus {
        border-color: var(--primary-color);
      }
      .jp-dialog-presets {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 12px;
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
        flex-wrap: wrap;
        gap: 6px;
        min-height: 40px;
        padding: 8px 10px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--primary-background-color);
        align-items: center;
        margin-bottom: 12px;
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
      .jp-dialog-or {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin: 12px 0 6px;
        text-align: center;
      }
      .jp-rechargeable-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        padding: 10px 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        user-select: none;
      }
      .jp-rechargeable-toggle:hover {
        border-color: var(--primary-color);
      }
      .jp-rechargeable-toggle ha-icon {
        color: var(--secondary-text-color);
      }
      .jp-rechargeable-toggle:has(input:checked) {
        border-color: var(--success-color, #43a047);
        background: color-mix(
          in srgb,
          var(--success-color, #43a047) 8%,
          transparent
        );
      }
      .jp-rechargeable-toggle:has(input:checked) ha-icon {
        color: var(--success-color, #43a047);
      }
      .jp-dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 20px;
      }
      @keyframes jp-flash-up {
        0% {
          background: color-mix(
            in srgb,
            var(--success-color, #43a047) 25%,
            transparent
          );
        }
        100% {
          background: transparent;
        }
      }
      @keyframes jp-flash-down {
        0% {
          background: color-mix(
            in srgb,
            var(--warning-color, #ffa726) 25%,
            transparent
          );
        }
        100% {
          background: transparent;
        }
      }
      @keyframes jp-flash-up-attention {
        0% {
          background: color-mix(
            in srgb,
            var(--success-color, #43a047) 25%,
            transparent
          );
        }
        100% {
          background: color-mix(
            in srgb,
            var(--error-color, #db4437) 8%,
            transparent
          );
        }
      }
      @keyframes jp-flash-down-attention {
        0% {
          background: color-mix(
            in srgb,
            var(--warning-color, #ffa726) 25%,
            transparent
          );
        }
        100% {
          background: color-mix(
            in srgb,
            var(--error-color, #db4437) 8%,
            transparent
          );
        }
      }
      .device-row.just-updated-up {
        animation: jp-flash-up 2.5s ease-out;
      }
      .device-row.just-updated-down {
        animation: jp-flash-down 2.5s ease-out;
      }
      .device-row.attention.just-updated-up {
        animation: jp-flash-up-attention 2.5s ease-out;
      }
      .device-row.attention.just-updated-down {
        animation: jp-flash-down-attention 2.5s ease-out;
      }
      @keyframes jp-highlight-pulse {
        0% {
          background: color-mix(in srgb, var(--primary-color) 30%, transparent);
        }
        50% {
          background: color-mix(in srgb, var(--primary-color) 10%, transparent);
        }
        100% {
          background: transparent;
        }
      }
      .device-row.highlighted {
        animation: jp-highlight-pulse 3s ease-out;
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
      .reliability-cell {
        text-align: center !important;
      }
      .reliability-badge {
        display: inline-block;
        font-size: 11px;
        font-weight: 500;
        padding: 1px 6px;
        border-radius: 8px;
      }
      .reliability-badge.high {
        background: color-mix(
          in srgb,
          var(--success-color, #43a047) 15%,
          transparent
        );
        color: var(--success-color, #43a047);
      }
      .reliability-badge.medium {
        background: color-mix(
          in srgb,
          var(--warning-color, #ffa726) 15%,
          transparent
        );
        color: var(--warning-color, #ffa726);
      }
      .reliability-badge.low {
        background: color-mix(
          in srgb,
          var(--disabled-text-color, #999) 15%,
          transparent
        );
        color: var(--disabled-text-color, #999);
      }
      /* old .tab-bar/.tab removed — tabs are now in the toolbar */
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
      .detail-meta {
        background: var(--card-bg);
        border-radius: 12px;
        border: 1px solid var(--border);
        padding: 16px;
        margin-bottom: 16px;
      }
      .detail-meta-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 16px;
      }
      .detail-meta-label {
        font-size: 12px;
        color: var(--secondary-text-color);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }
      .detail-meta-value {
        font-size: 15px;
        font-weight: 500;
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
      .prediction-reason {
        display: inline-block;
        font-size: 9px;
        padding: 1px 5px;
        border-radius: 4px;
        font-weight: 500;
        background: color-mix(in srgb, var(--secondary-text-color) 15%, transparent);
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
      .detail-chart {
        background: var(--card-bg);
        border-radius: 12px;
        border: 1px solid var(--border);
        padding: 16px;
        margin-bottom: 16px;
        min-height: 430px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .detail-chart ha-chart-base {
        width: 100%;
        height: 410px;
        display: block;
      }
      .replacement-history {
        padding: 12px 16px;
      }
      .replacement-history-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .replacement-history-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9em;
        color: var(--primary-text-color);
      }
      .replacement-history-item.suspected {
        padding: 4px 0;
        border-top: 1px dashed var(--divider-color, #e0e0e0);
      }
      .detail-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      @media (max-width: 900px) {
        .device-row,
        .device-header {
          grid-template-columns: 36px 1fr 60px 56px;
        }
        .type-cell,
        .reliability-cell,
        .device-row > :nth-child(n + 5):not(.action-cell),
        .device-header > :nth-child(n + 5):not(:last-child) {
          display: none;
        }
      }
      @media (max-width: 500px) {
        #jp-content {
          padding: 10px;
        }
        .summary {
          gap: 8px;
        }
        .summary-card {
          padding: 10px 14px;
          min-width: 70px;
        }
        .summary-card .value {
          font-size: 22px;
        }
        .summary-card .label {
          font-size: 11px;
        }
        .device-row,
        .device-header {
          grid-template-columns: 30px 1fr 48px 40px;
          padding: 8px 10px;
          gap: 4px;
        }
        .icon-cell ha-icon {
          --mdc-icon-size: 20px;
        }
        .name-cell {
          font-size: 13px;
        }
        .badge {
          font-size: 8px;
          padding: 1px 4px;
        }
        .filter-bar {
          gap: 6px;
        }
        .search-field {
          padding: 6px 10px;
        }
        /* tabs move to bottom bar on narrow via template logic */
        .shopping-summary {
          flex-wrap: wrap;
          gap: 8px;
        }
        .shopping-summary .summary-card {
          min-width: 60px;
        }
        .detail-chart {
          padding: 8px;
          min-height: 350px;
        }
        .detail-chart ha-chart-base {
          height: 330px;
        }
        .range-pill {
          padding: 3px 9px;
          font-size: 11px;
        }
        .detail-actions {
          flex-wrap: wrap;
        }
      }
    `}});

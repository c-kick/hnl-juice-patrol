/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,t=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),r=new WeakMap;let a=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const i=this.t;if(t&&void 0===e){const t=void 0!==i&&1===i.length;t&&(e=r.get(i)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&r.set(i,e))}return e}toString(){return this.cssText}};const s=(e,...t)=>{const r=1===e.length?e[0]:t.reduce((t,i,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[r+1],e[0]);return new a(r,e,i)},n=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new a("string"==typeof e?e:e+"",void 0,i))(t)})(e):e,{is:o,defineProperty:l,getOwnPropertyDescriptor:c,getOwnPropertyNames:d,getOwnPropertySymbols:h,getPrototypeOf:p}=Object,u=globalThis,g=u.trustedTypes,v=g?g.emptyScript:"",m=u.reactiveElementPolyfillSupport,y=(e,t)=>e,_={toAttribute(e,t){switch(t){case Boolean:e=e?v:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},b=(e,t)=>!o(e,t),f={attribute:!0,type:String,converter:_,reflect:!1,useDefault:!1,hasChanged:b};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=f){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),r=this.getPropertyDescriptor(e,i,t);void 0!==r&&l(this.prototype,e,r)}}static getPropertyDescriptor(e,t,i){const{get:r,set:a}=c(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){const s=r?.call(this);a?.call(this,t),this.requestUpdate(e,s,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??f}static _$Ei(){if(this.hasOwnProperty(y("elementProperties")))return;const e=p(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(y("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y("properties"))){const e=this.properties,t=[...d(e),...h(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(n(e))}else void 0!==e&&t.push(n(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const i=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((i,r)=>{if(t)i.adoptedStyleSheets=r.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const t of r){const r=document.createElement("style"),a=e.litNonce;void 0!==a&&r.setAttribute("nonce",a),r.textContent=t.cssText,i.appendChild(r)}})(i,this.constructor.elementStyles),i}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,i);if(void 0!==r&&!0===i.reflect){const a=(void 0!==i.converter?.toAttribute?i.converter:_).toAttribute(t,i.type);this._$Em=e,null==a?this.removeAttribute(r):this.setAttribute(r,a),this._$Em=null}}_$AK(e,t){const i=this.constructor,r=i._$Eh.get(e);if(void 0!==r&&this._$Em!==r){const e=i.getPropertyOptions(r),a="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:_;this._$Em=r;const s=a.fromAttribute(t,e.type);this[r]=s??this._$Ej?.get(r)??s,this._$Em=null}}requestUpdate(e,t,i,r=!1,a){if(void 0!==e){const s=this.constructor;if(!1===r&&(a=this[e]),i??=s.getPropertyOptions(e),!((i.hasChanged??b)(a,t)||i.useDefault&&i.reflect&&a===this._$Ej?.get(e)&&!this.hasAttribute(s._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:r,wrapped:a},s){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,s??t??this[e]),!0!==a||void 0!==s)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,r=this[t];!0!==e||this._$AL.has(t)||void 0===r||this.C(t,void 0,i,r)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[y("elementProperties")]=new Map,x[y("finalized")]=new Map,m?.({ReactiveElement:x}),(u.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const $=globalThis,w=e=>e,S=$.trustedTypes,A=S?S.createPolicy("lit-html",{createHTML:e=>e}):void 0,k="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,E="?"+C,L=`<${E}>`,j=document,T=()=>j.createComment(""),R=e=>null===e||"object"!=typeof e&&"function"!=typeof e,D=Array.isArray,z="[ \t\n\f\r]",P=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,H=/-->/g,M=/>/g,O=RegExp(`>|${z}(?:([^\\s"'>=/]+)(${z}*=${z}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),U=/'/g,B=/"/g,N=/^(?:script|style|textarea|title)$/i,V=(e=>(t,...i)=>({_$litType$:e,strings:t,values:i}))(1),I=Symbol.for("lit-noChange"),F=Symbol.for("lit-nothing"),q=new WeakMap,W=j.createTreeWalker(j,129);function G(e,t){if(!D(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==A?A.createHTML(t):t}const J=(e,t)=>{const i=e.length-1,r=[];let a,s=2===t?"<svg>":3===t?"<math>":"",n=P;for(let t=0;t<i;t++){const i=e[t];let o,l,c=-1,d=0;for(;d<i.length&&(n.lastIndex=d,l=n.exec(i),null!==l);)d=n.lastIndex,n===P?"!--"===l[1]?n=H:void 0!==l[1]?n=M:void 0!==l[2]?(N.test(l[2])&&(a=RegExp("</"+l[2],"g")),n=O):void 0!==l[3]&&(n=O):n===O?">"===l[0]?(n=a??P,c=-1):void 0===l[1]?c=-2:(c=n.lastIndex-l[2].length,o=l[1],n=void 0===l[3]?O:'"'===l[3]?B:U):n===B||n===U?n=O:n===H||n===M?n=P:(n=O,a=void 0);const h=n===O&&e[t+1].startsWith("/>")?" ":"";s+=n===P?i+L:c>=0?(r.push(o),i.slice(0,c)+k+i.slice(c)+C+h):i+C+(-2===c?t:h)}return[G(e,s+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),r]};class Y{constructor({strings:e,_$litType$:t},i){let r;this.parts=[];let a=0,s=0;const n=e.length-1,o=this.parts,[l,c]=J(e,t);if(this.el=Y.createElement(l,i),W.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(r=W.nextNode())&&o.length<n;){if(1===r.nodeType){if(r.hasAttributes())for(const e of r.getAttributeNames())if(e.endsWith(k)){const t=c[s++],i=r.getAttribute(e).split(C),n=/([.?@])?(.*)/.exec(t);o.push({type:1,index:a,name:n[2],strings:i,ctor:"."===n[1]?ee:"?"===n[1]?te:"@"===n[1]?ie:X}),r.removeAttribute(e)}else e.startsWith(C)&&(o.push({type:6,index:a}),r.removeAttribute(e));if(N.test(r.tagName)){const e=r.textContent.split(C),t=e.length-1;if(t>0){r.textContent=S?S.emptyScript:"";for(let i=0;i<t;i++)r.append(e[i],T()),W.nextNode(),o.push({type:2,index:++a});r.append(e[t],T())}}}else if(8===r.nodeType)if(r.data===E)o.push({type:2,index:a});else{let e=-1;for(;-1!==(e=r.data.indexOf(C,e+1));)o.push({type:7,index:a}),e+=C.length-1}a++}}static createElement(e,t){const i=j.createElement("template");return i.innerHTML=e,i}}function K(e,t,i=e,r){if(t===I)return t;let a=void 0!==r?i._$Co?.[r]:i._$Cl;const s=R(t)?void 0:t._$litDirective$;return a?.constructor!==s&&(a?._$AO?.(!1),void 0===s?a=void 0:(a=new s(e),a._$AT(e,i,r)),void 0!==r?(i._$Co??=[])[r]=a:i._$Cl=a),void 0!==a&&(t=K(e,a._$AS(e,t.values),a,r)),t}class Z{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,r=(e?.creationScope??j).importNode(t,!0);W.currentNode=r;let a=W.nextNode(),s=0,n=0,o=i[0];for(;void 0!==o;){if(s===o.index){let t;2===o.type?t=new Q(a,a.nextSibling,this,e):1===o.type?t=new o.ctor(a,o.name,o.strings,this,e):6===o.type&&(t=new re(a,this,e)),this._$AV.push(t),o=i[++n]}s!==o?.index&&(a=W.nextNode(),s++)}return W.currentNode=j,r}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,r){this.type=2,this._$AH=F,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=K(this,e,t),R(e)?e===F||null==e||""===e?(this._$AH!==F&&this._$AR(),this._$AH=F):e!==this._$AH&&e!==I&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>D(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==F&&R(this._$AH)?this._$AA.nextSibling.data=e:this.T(j.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,r="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=Y.createElement(G(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===r)this._$AH.p(t);else{const e=new Z(r,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=q.get(e.strings);return void 0===t&&q.set(e.strings,t=new Y(e)),t}k(e){D(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,r=0;for(const a of e)r===t.length?t.push(i=new Q(this.O(T()),this.O(T()),this,this.options)):i=t[r],i._$AI(a),r++;r<t.length&&(this._$AR(i&&i._$AB.nextSibling,r),t.length=r)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=w(e).nextSibling;w(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class X{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,r,a){this.type=1,this._$AH=F,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=a,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=F}_$AI(e,t=this,i,r){const a=this.strings;let s=!1;if(void 0===a)e=K(this,e,t,0),s=!R(e)||e!==this._$AH&&e!==I,s&&(this._$AH=e);else{const r=e;let n,o;for(e=a[0],n=0;n<a.length-1;n++)o=K(this,r[i+n],t,n),o===I&&(o=this._$AH[n]),s||=!R(o)||o!==this._$AH[n],o===F?e=F:e!==F&&(e+=(o??"")+a[n+1]),this._$AH[n]=o}s&&!r&&this.j(e)}j(e){e===F?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class ee extends X{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===F?void 0:e}}class te extends X{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==F)}}class ie extends X{constructor(e,t,i,r,a){super(e,t,i,r,a),this.type=5}_$AI(e,t=this){if((e=K(this,e,t,0)??F)===I)return;const i=this._$AH,r=e===F&&i!==F||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,a=e!==F&&(i===F||r);r&&this.element.removeEventListener(this.name,this,i),a&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class re{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){K(this,e)}}const ae={I:Q},se=$.litHtmlPolyfillSupport;se?.(Y,Q),($.litHtmlVersions??=[]).push("3.3.2");const ne=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */let oe=class extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const r=i?.renderBefore??t;let a=r._$litPart$;if(void 0===a){const e=i?.renderBefore??null;r._$litPart$=a=new Q(t.insertBefore(T(),e),e,void 0,i??{})}return a._$AI(e),a})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return I}};oe._$litElement$=!0,oe.finalized=!0,ne.litElementHydrateSupport?.({LitElement:oe});const le=ne.litElementPolyfillSupport;le?.({LitElement:oe}),(ne.litElementVersions??=[]).push("4.2.2");
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
 */const ue=he(class extends pe{constructor(e){if(super(e),e.type!==ce||"class"!==e.name||e.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(e){return" "+Object.keys(e).filter(t=>e[t]).join(" ")+" "}update(e,[t]){if(void 0===this.st){this.st=new Set,void 0!==e.strings&&(this.nt=new Set(e.strings.join(" ").split(/\s/).filter(e=>""!==e)));for(const e in t)t[e]&&!this.nt?.has(e)&&this.st.add(e);return this.render(t)}const i=e.element.classList;for(const e of this.st)e in t||(i.remove(e),this.st.delete(e));for(const e in t){const r=!!t[e];r===this.st.has(e)||this.nt?.has(e)||(r?(i.add(e),this.st.add(e)):(i.remove(e),this.st.delete(e)))}return I}}),{I:ge}=ae,ve=e=>e,me=()=>document.createComment(""),ye=(e,t,i)=>{const r=e._$AA.parentNode,a=void 0===t?e._$AB:t._$AA;if(void 0===i){const t=r.insertBefore(me(),a),s=r.insertBefore(me(),a);i=new ge(t,s,e,e.options)}else{const t=i._$AB.nextSibling,s=i._$AM,n=s!==e;if(n){let t;i._$AQ?.(e),i._$AM=e,void 0!==i._$AP&&(t=e._$AU)!==s._$AU&&i._$AP(t)}if(t!==a||n){let e=i._$AA;for(;e!==t;){const t=ve(e).nextSibling;ve(r).insertBefore(e,a),e=t}}}return i},_e=(e,t,i=e)=>(e._$AI(t,i),e),be={},fe=(e,t=be)=>e._$AH=t,xe=e=>{e._$AR(),e._$AA.remove()},$e=(e,t,i)=>{const r=new Map;for(let a=t;a<=i;a++)r.set(e[a],a);return r},we=he(class extends pe{constructor(e){if(super(e),e.type!==de)throw Error("repeat() can only be used in text expressions")}dt(e,t,i){let r;void 0===i?i=t:void 0!==t&&(r=t);const a=[],s=[];let n=0;for(const t of e)a[n]=r?r(t,n):n,s[n]=i(t,n),n++;return{values:s,keys:a}}render(e,t,i){return this.dt(e,t,i).values}update(e,[t,i,r]){const a=(e=>e._$AH)(e),{values:s,keys:n}=this.dt(t,i,r);if(!Array.isArray(a))return this.ut=n,s;const o=this.ut??=[],l=[];let c,d,h=0,p=a.length-1,u=0,g=s.length-1;for(;h<=p&&u<=g;)if(null===a[h])h++;else if(null===a[p])p--;else if(o[h]===n[u])l[u]=_e(a[h],s[u]),h++,u++;else if(o[p]===n[g])l[g]=_e(a[p],s[g]),p--,g--;else if(o[h]===n[g])l[g]=_e(a[h],s[g]),ye(e,l[g+1],a[h]),h++,g--;else if(o[p]===n[u])l[u]=_e(a[p],s[u]),ye(e,a[h],a[p]),p--,u++;else if(void 0===c&&(c=$e(n,u,g),d=$e(o,h,p)),c.has(o[h]))if(c.has(o[p])){const t=d.get(n[u]),i=void 0!==t?a[t]:null;if(null===i){const t=ye(e,a[h]);_e(t,s[u]),l[u]=t}else l[u]=_e(i,s[u]),ye(e,a[h],i),a[t]=null;u++}else xe(a[p]),p--;else xe(a[h]),h++;for(;u<=g;){const t=ye(e,l[g+1]);_e(t,s[u]),l[u++]=t}for(;h<=p;){const e=a[h++];null!==e&&xe(e)}return this.ut=n,fe(e,l),I}});
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */customElements.define("juice-patrol-panel",class extends oe{static get properties(){return{narrow:{type:Boolean},_entities:{state:!0},_activeView:{state:!0},_filterText:{state:!0},_filterCategory:{state:!0},_settingsOpen:{state:!0},_settingsDirty:{state:!0},_settingsValues:{state:!0},_configEntry:{state:!0},_sortCol:{state:!0},_sortAsc:{state:!0},_detailEntity:{state:!0},_chartData:{state:!0},_chartLoading:{state:!0},_shoppingData:{state:!0},_shoppingLoading:{state:!0},_refreshing:{state:!0},_menuState:{state:!0},_flashGeneration:{state:!0},_expandedGroups:{state:!0}}}constructor(){super(),this._hass=null,this._panel=null,this._hassInitialized=!1,this._entities=[],this._configEntry=null,this._settingsOpen=!1,this._settingsDirty=!1,this._settingsValues={},this._sortCol="level",this._sortAsc=!0,this._userSorted=!1,this._prevLevels=new Map,this._recentlyChanged=new Map,this._activeView="devices",this._shoppingData=null,this._shoppingLoading=!1,this._refreshing=!1,this._expandedGroups={},this._filterText="",this._filterCategory=null,this._highlightEntity=null,this._highlightApplied=!1,this._highlightAttempts=0,this._detailEntity=null,this._chartData=null,this._chartLoading=!1,this._chartLastLevel=null,this._menuState=null,this._flashGeneration=0,this._flashCleanupTimer=null,this._refreshTimer=null,this._chartDebounce=null,this._entityMap=new Map}set hass(e){this._hass=e,this._processHassUpdate(!this._hassInitialized),this._hassInitialized=!0}get hass(){return this._hass}set panel(e){this._panel=e}get panel(){return this._panel}connectedCallback(){super.connectedCallback(),this.requestUpdate(),this._escapeHandler=e=>{"Escape"===e.key&&this._closeOverlays()},window.addEventListener("keydown",this._escapeHandler),this._popstateHandler=e=>{"detail"===this._activeView&&this._closeDetailInternal()},window.addEventListener("popstate",this._popstateHandler)}disconnectedCallback(){super.disconnectedCallback();for(const e of["_flashCleanupTimer","_refreshTimer","_chartDebounce"])this[e]&&(clearTimeout(this[e]),this[e]=null);this._refreshing=!1,this._escapeHandler&&(window.removeEventListener("keydown",this._escapeHandler),this._escapeHandler=null),this._popstateHandler&&(window.removeEventListener("popstate",this._popstateHandler),this._popstateHandler=null)}firstUpdated(){const e=new URLSearchParams(window.location.search).get("entity");e&&/^[a-z0-9_]+\.[a-z0-9_]+$/.test(e)&&(this._highlightEntity=e)}updated(e){e.has("_chartData")&&this._chartData&&requestAnimationFrame(()=>this._initChart(this._chartData)),e.has("_entities")&&(!this._highlightApplied&&this._highlightEntity&&this._applyDeepLinkHighlight(),"detail"===this._activeView&&this._detailEntity&&!this._entityMap.get(this._detailEntity)&&this._closeDetail())}_processHassUpdate(e){if(!this._hass)return;const t=this._entityHash;this._updateEntities();if(this._entityHash!==t){const e=this._sortEntities(this._entityList);this._entityMap=new Map(e.map(e=>[e.sourceEntity,e])),this._entities=e}if(e&&this._loadConfig(),"detail"===this._activeView&&this._detailEntity&&!this._chartLoading){const e=this._getDevice(this._detailEntity);e&&e.level!==this._chartLastLevel&&(this._chartLastLevel=e.level,clearTimeout(this._chartDebounce),this._chartDebounce=setTimeout(()=>this._loadChartData(this._detailEntity),2e3))}}_updateEntities(){if(!this._hass)return;const e=this._hass.states,t=new Map;for(const[i,r]of Object.entries(e)){const a=r.attributes||{},s=a.source_entity;if(!s)continue;if(i.includes("lowest_battery")||i.includes("attention_needed"))continue;if(!(i.includes("_discharge_rate")||i.includes("_days_remaining")||i.includes("_predicted_empty")||i.includes("_battery_low")||i.includes("_stale")))continue;t.has(s)||t.set(s,{sourceEntity:s,name:null,level:null,dischargeRate:null,daysRemaining:null,predictedEmpty:null,isLow:!1,isStale:!1,confidence:null,threshold:null,stability:null,stabilityCv:null,meanLevel:null,anomaly:null,dropSize:null,isRechargeable:!1,rechargeableReason:null,replacementPending:!1,batteryType:null,batteryTypeSource:null,manufacturer:null,model:null,chargingState:null,reliability:null,predictionStatus:null,platform:null,dischargeRateHour:null,hoursRemaining:null});const n=t.get(s),o=e[s];if(o&&"unavailable"!==o.state&&"unknown"!==o.state){const e=parseFloat(o.state);isNaN(e)||(n.level=e)}o?.attributes?.friendly_name&&(n.name=o.attributes.friendly_name),i.includes("_discharge_rate")?(n.dischargeRate="unknown"!==r.state&&"unavailable"!==r.state?parseFloat(r.state):null,n.stability=a.stability||null,n.stabilityCv=a.stability_cv??null,n.meanLevel=a.mean_level??null,n.anomaly=a.discharge_anomaly||null,n.dropSize=a.drop_size??null,n.isRechargeable=a.is_rechargeable||!1,n.rechargeableReason=a.rechargeable_reason||null,n.replacementPending=a.replacement_pending||!1,n.batteryType=a.battery_type||null,n.batteryTypeSource=a.battery_type_source||null,n.platform=a.platform||null,n.manufacturer=a.manufacturer||null,n.model=a.model||null,n.chargingState=a.charging_state?a.charging_state.toLowerCase().replace(/\s/g,"_"):null,n.dischargeRateHour=a.discharge_rate_hour??null):i.includes("_days_remaining")?(n.daysRemaining="unknown"!==r.state&&"unavailable"!==r.state?parseFloat(r.state):null,n.confidence=a.confidence||null,n.reliability=a.reliability??null,n.predictionStatus=a.status||null,n.hoursRemaining=a.hours_remaining??null):i.includes("_predicted_empty")?n.predictedEmpty="unknown"!==r.state&&"unavailable"!==r.state?r.state:null:i.includes("_battery_low")?(n.isLow="on"===r.state,n.threshold=a.threshold):i.includes("_stale")&&(n.isStale="on"===r.state)}const i=this._settingsValues.low_threshold??20,r=Date.now();let a=!1;for(const e of t.values()){if(null!==e.level){const t=e.threshold??i;e.isLow=e.level<=t}const t=null!==e.level?Math.ceil(e.level):null,s=this._prevLevels.get(e.sourceEntity);void 0!==s&&null!==t&&t!==s&&(this._recentlyChanged.set(e.sourceEntity,{ts:r,dir:t>s?"up":"down"}),a=!0),null!==t&&this._prevLevels.set(e.sourceEntity,t)}if(this._recentlyChanged.size>0){for(const[e,t]of this._recentlyChanged)r-t.ts>3e3&&(this._recentlyChanged.delete(e),a=!0);this._flashCleanupTimer||(this._flashCleanupTimer=setTimeout(()=>{this._flashCleanupTimer=null,this._recentlyChanged.clear(),this._flashGeneration=(this._flashGeneration||0)+1},3e3))}a&&(this._flashGeneration=(this._flashGeneration||0)+1),this._entityList=[...t.values()];const s=this._recentlyChanged.size>0?[...this._recentlyChanged.keys()].join(","):"";this._entityHash=this._entityList.map(e=>`${e.sourceEntity}:${e.level}:${e.isLow}:${e.isStale}:${e.stability}:${e.replacementPending}:${e.batteryType}`).join("|")+"|!"+s}_sortEntities(e){const t=this._sortCol,i=this._sortAsc?1:-1;return e.sort((e,r)=>{const a=this._getSortValue(e,t),s=this._getSortValue(r,t);if(null===a&&null!==s)return 1;if(null!==a&&null===s)return-1;if(!this._userSorted){const t=e.replacementPending||e.isLow||e.isStale||e.anomaly&&"normal"!==e.anomaly;if(t!==(r.replacementPending||r.isLow||r.isStale||r.anomaly&&"normal"!==r.anomaly))return t?-1:1}return a===s?0:(a<s?-1:1)*i})}_getSortValue(e,t){switch(t){case"name":return(e.name||e.sourceEntity).toLowerCase();case"level":default:return e.level;case"type":return(e.batteryType||"").toLowerCase()||null;case"rate":return e.dischargeRate;case"days":return e.daysRemaining;case"reliability":return e.reliability;case"empty":return e.predictedEmpty}}_getFilteredEntities(){let e=this._entities;const t=this._filterCategory;"low"===t?e=e.filter(e=>e.isLow):"stale"===t?e=e.filter(e=>e.isStale):"unavailable"===t?e=e.filter(e=>null===e.level):"pending"===t?e=e.filter(e=>e.replacementPending):"anomaly"===t&&(e=e.filter(e=>e.anomaly&&"normal"!==e.anomaly));const i=this._filterText.toLowerCase().trim();return i&&(e=e.filter(e=>{const t=(e.name||e.sourceEntity).toLowerCase(),r=(e.batteryType||"").toLowerCase(),a=(e.platform||"").toLowerCase(),s=e.sourceEntity.toLowerCase(),n=(e.manufacturer||"").toLowerCase(),o=(e.model||"").toLowerCase();return t.includes(i)||r.includes(i)||a.includes(i)||s.includes(i)||n.includes(i)||o.includes(i)})),e}_getDevice(e){return this._entityMap.get(e)}_formatLevel(e){const t=this._displayLevel(e);return null!==t?t+"%":"—"}_wsErrorMessage(e,t){return e?.message?.includes("unknown command")?`Restart Home Assistant to enable ${t}`:`${t} failed`}_getBatteryIcon(e){if(e.isRechargeable)return null===e.level?"mdi:battery-unknown":e.level<=10?"mdi:battery-charging-10":e.level<=30?"mdi:battery-charging-30":e.level<=60?"mdi:battery-charging-60":e.level<=90?"mdi:battery-charging-90":"mdi:battery-charging-100";const t=e.level;return null===t?"mdi:battery-unknown":t<=5?"mdi:battery-outline":t<=15?"mdi:battery-10":t<=25?"mdi:battery-20":t<=35?"mdi:battery-30":t<=45?"mdi:battery-40":t<=55?"mdi:battery-50":t<=65?"mdi:battery-60":t<=75?"mdi:battery-70":t<=85?"mdi:battery-80":t<=95?"mdi:battery-90":"mdi:battery"}_getLevelColor(e,t){if(null===e)return"var(--disabled-text-color)";const i=t??this._settingsValues.low_threshold??20;return e<=i/2?"var(--error-color, #db4437)":e<=1.25*i?"var(--warning-color, #ffa726)":"var(--success-color, #43a047)"}_displayLevel(e){return null===e?null:Math.ceil(e)}_isActivelyCharging(e){return e.isRechargeable&&"charging"===e.chargingState}_isFastDischarge(e){return null!==e.dischargeRateHour&&e.dischargeRateHour>=1}_formatRate(e){return this._isFastDischarge(e)?null!==e.dischargeRateHour?e.dischargeRateHour+"%/h":"—":null!==e.dischargeRate?e.dischargeRate+"%/d":"—"}_formatTimeRemaining(e){return this._isFastDischarge(e)&&null!==e.hoursRemaining?e.hoursRemaining<1?Math.round(60*e.hoursRemaining)+"m":e.hoursRemaining+"h":null!==e.daysRemaining?e.daysRemaining+"d":"—"}_formatDate(e,t=!1){if(!e)return"—";try{const i=new Date(e);if(t){const e=new Date,t=i.getFullYear()===e.getFullYear()?{month:"short",day:"numeric"}:{month:"short",day:"numeric",year:"numeric"};return i.toLocaleDateString(void 0,t)+" "+i.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}return i.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}catch{return"—"}}_parseBatteryType(e){if(!e)return{count:0,type:""};const t=e.match(/^(\d+)\s*[×x]\s*(.+)$/i);return t?{count:parseInt(t[1]),type:t[2].trim()}:{count:1,type:e.trim()}}_formatBatteryType(e,t){return e?t>1?`${t}× ${e}`:e:""}_erraticTooltip(e){const t=[],i=this._displayLevel(e.level),r=this._displayLevel(e.meanLevel);return null!==r&&null!==i&&i>r+3&&!e.isRechargeable?t.push(`Level is rising (${i}%) without a charge state — not expected for a non-rechargeable battery`):null!==r&&null!==i&&Math.abs(i-r)>5&&t.push(`Current level (${i}%) differs significantly from 7-day average (${r}%)`),null!==e.stabilityCv&&e.stabilityCv>.05&&t.push(`High reading variance (CV: ${(100*e.stabilityCv).toFixed(1)}%)`),0===t.length&&t.push("Battery readings show non-monotonic or inconsistent behavior"),t.join(". ")}_showToast(e){this.dispatchEvent(new CustomEvent("hass-notification",{bubbles:!0,composed:!0,detail:{message:e}}))}_applyDeepLinkHighlight(){if(!this._highlightEntity||this._highlightApplied)return;if(this._highlightAttempts=(this._highlightAttempts||0)+1,this._highlightAttempts>10)return void(this._highlightApplied=!0);const e=this.shadowRoot.querySelector(`.device-row[data-entity="${CSS.escape(this._highlightEntity)}"]`);e&&(this._highlightApplied=!0,requestAnimationFrame(()=>{e.scrollIntoView({behavior:"smooth",block:"center"}),e.classList.add("highlighted"),setTimeout(()=>e.classList.remove("highlighted"),3e3)}))}async _loadConfig(){if(this._hass)try{const e=await this._hass.callWS({type:"juice_patrol/get_settings"});this._configEntry={entry_id:e.entry_id},this._settingsValues={low_threshold:e.low_threshold,stale_timeout:e.stale_timeout,prediction_horizon:e.prediction_horizon}}catch(e){console.error("Juice Patrol: failed to load config",e)}}async _saveSettings(){if(this._hass)try{const e=await this._hass.callWS({type:"juice_patrol/update_settings",low_threshold:parseInt(this._settingsValues.low_threshold),stale_timeout:parseInt(this._settingsValues.stale_timeout),prediction_horizon:parseInt(this._settingsValues.prediction_horizon)});this._settingsDirty=!1,this._settingsValues={low_threshold:e.low_threshold,stale_timeout:e.stale_timeout,prediction_horizon:e.prediction_horizon},this._settingsOpen=!1,this._showToast("Settings saved")}catch(e){console.error("Juice Patrol: failed to save settings",e),this._showToast("Failed to save settings")}}async _markReplaced(e){const t=this._getDevice(e),i=t?.isRechargeable?"recharged":"replaced";try{await this._hass.callWS({type:"juice_patrol/mark_replaced",entity_id:e}),this._showToast(`Battery marked as ${i}`)}catch(e){this._showToast(`Failed to mark as ${i}`)}}async _confirmReplacement(e){const t=this._getDevice(e),i=t?.isRechargeable?"Recharge":"Replacement";try{await this._hass.callWS({type:"juice_patrol/confirm_replacement",entity_id:e}),this._showToast(`${i} confirmed`)}catch(e){this._showToast("Failed to confirm")}}async _recalculate(e){try{await this._hass.callWS({type:"juice_patrol/recalculate",entity_id:e}),this._showToast("Prediction recalculated")}catch(e){this._showToast(this._wsErrorMessage(e,"recalculation"))}}async _refresh(){if(!this._refreshing){this._refreshing=!0;try{await this._hass.callWS({type:"juice_patrol/refresh"}),this._showToast("Predictions refreshed")}catch(e){this._showToast("Refresh failed")}this._refreshTimer=setTimeout(()=>{this._refreshTimer=null,this._refreshing=!1},2e3)}}async _loadShoppingList(){if(this._hass){this._shoppingLoading=!0;try{this._shoppingData=await this._hass.callWS({type:"juice_patrol/get_shopping_list"})}catch(e){console.error("Juice Patrol: failed to load shopping list",e),this._shoppingData=null}this._shoppingLoading=!1}}async _loadChartData(e){if(this._hass&&!this._chartLoading){this._chartLoading=!0,this._chartData=null;try{const t=await this._hass.callWS({type:"juice_patrol/get_entity_chart",entity_id:e});this._chartLastLevel=t?.level??null,this._chartData=t}catch(e){console.error("Juice Patrol: failed to load chart data",e),this._showToast(this._wsErrorMessage(e,"chart view")),this._chartData=null}this._chartLoading=!1}}async _saveBatteryType(e,t){try{await this._hass.callWS({type:"juice_patrol/set_battery_type",entity_id:e,battery_type:t}),this._showToast(t?`Battery type set to ${t}`:"Battery type cleared")}catch(e){this._showToast("Failed to set battery type")}}_openDetail(e){this._closeOverlays(),this._detailEntity=e,this._activeView="detail",this._chartData=null,this._chartLastLevel=null,history.pushState({jpDetail:e},""),this._loadChartData(e)}_closeDetail(){"detail"===this._activeView&&history.back()}_closeDetailInternal(){this._detailEntity=null,this._chartData=null,this._chartEl=null,this._activeView="devices"}_toggleSort(e){this._sortCol===e?this._sortAsc=!this._sortAsc:(this._sortCol=e,this._sortAsc=!0),this._userSorted=!0,this._entities=this._sortEntities([...this._entities])}_setFilter(e){this._closeOverlays(),this._filterCategory=this._filterCategory===e?null:e,"devices"!==this._activeView&&(this._activeView="devices")}_switchTab(e){e!==this._activeView&&(this._closeOverlays(),this._activeView=e,"shopping"===e&&this._loadShoppingList())}_handleSearchInput(e){const t=e.target.value;this._filterText=t}_clearSearch(){this._filterText=""}_clearFilter(){this._filterCategory=null}_toggleSettings(){this._settingsOpen=!this._settingsOpen,this._settingsOpen&&(this._settingsDirty=!1,this._loadConfig())}_handleSettingInput(e){const t=e.target.dataset.key;this._settingsValues={...this._settingsValues,[t]:e.target.value},this._settingsDirty=!0}_cancelSettings(){this._settingsOpen=!1,this._settingsDirty=!1}_toggleShoppingGroup(e){const t={...this._expandedGroups};t[e]?delete t[e]:t[e]=!0,this._expandedGroups=t}_showActionMenu(e,t){e.stopPropagation(),this._closeOverlays();const i=e.currentTarget.getBoundingClientRect();this._menuState={entityId:t,top:i.bottom+4,right:window.innerWidth-i.right}}_closeOverlays(){this._menuState=null,this.shadowRoot.querySelectorAll(".jp-dialog-overlay").forEach(e=>e.remove())}_handleMenuAction(e,t){this._menuState=null;const i=this._getDevice(t);"replace"===e?this._markReplaced(t):"recalculate"===e?this._recalculate(t):"type"===e&&this._setBatteryType(t,i?.batteryType)}_handleRowClick(e){this._openDetail(e)}_handleActionClick(e,t,i){e.stopPropagation(),"confirm"===t?this._confirmReplacement(i):"menu"===t&&this._showActionMenu(e,i)}_setBatteryType(e,t){this._closeOverlays();const i=this._getDevice(e),r=t||i?.batteryType||"",a=this._parseBatteryType(r),s=["CR2032","CR2450","CR123A","AA","AAA","Li-ion","Built-in"];let n=[],o=null;if(r&&s.includes(a.type)){for(let e=0;e<a.count;e++)n.push(a.type);o=a.type}let l=i?.isRechargeable||!1,c=!1;const d=document.createElement("div");d.className="jp-dialog-overlay",this.shadowRoot.appendChild(d);const h=e=>{if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML},p=()=>{const t=n.length>0?n.map((e,t)=>`<span class="jp-badge-chip" data-idx="${t}" title="Click to remove">${h(e)} ✕</span>`).join(""):'<span class="jp-badge-placeholder">Click a battery type below, or type a custom value</span>';d.innerHTML=`\n        <div class="jp-dialog">\n          <div class="jp-dialog-title">Set battery type</div>\n          <div class="jp-dialog-body">\n            <div class="jp-dialog-desc">${h(i?.name||e)}</div>\n            <div class="jp-badge-field">${t}</div>\n            <div class="jp-dialog-presets">\n              ${s.map(e=>{const t=null!==o&&e!==o;return`<button class="jp-preset${t?" disabled":""}${e===o?" active":""}"\n                  data-type="${e}" ${t?"disabled":""}>${e}</button>`}).join("")}\n            </div>\n            <div class="jp-dialog-or">or type a custom value:</div>\n            <input type="text" class="jp-dialog-input" placeholder="e.g. 18650, LR44, custom..."\n                   value="${0!==n.length||s.includes(a.type)?"":h(r)}">\n            <button class="btn btn-secondary jp-autodetect" style="margin-top:8px;width:100%">\n              <ha-icon icon="mdi:auto-fix" style="--mdc-icon-size:16px;vertical-align:middle;margin-right:4px"></ha-icon>\n              Autodetect\n            </button>\n            <label class="jp-rechargeable-toggle">\n              <input type="checkbox" class="jp-rechargeable-cb" ${l?"checked":""}>\n              <ha-icon icon="mdi:power-plug-battery" style="--mdc-icon-size:16px"></ha-icon>\n              Rechargeable battery\n            </label>\n          </div>\n          <div class="jp-dialog-actions">\n            <button class="btn btn-secondary jp-dialog-clear">Clear</button>\n            <button class="btn btn-secondary jp-dialog-cancel">Cancel</button>\n            <button class="btn btn-primary jp-dialog-save">Save</button>\n          </div>\n        </div>\n      `,u()},u=()=>{d.querySelectorAll(".jp-badge-chip").forEach(e=>{e.addEventListener("click",()=>{n.splice(parseInt(e.dataset.idx),1),0===n.length&&(o=null),p()})}),d.querySelectorAll(".jp-preset:not([disabled])").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.type;o=t,n.push(t);const i=d.querySelector(".jp-dialog-input");i&&(i.value=""),p()})}),d.querySelector(".jp-autodetect")?.addEventListener("click",async()=>{const t=d.querySelector(".jp-autodetect");t&&(t.disabled=!0,t.textContent="Detecting...");try{const i=await this._hass.callWS({type:"juice_patrol/detect_battery_type",entity_id:e});if(i.battery_type){const e=this._parseBatteryType(i.battery_type);if(n=[],o=null,s.includes(e.type)){for(let t=0;t<e.count;t++)n.push(e.type);o=e.type}if(p(),!s.includes(e.type)){const e=d.querySelector(".jp-dialog-input");e&&(e.value=i.battery_type)}this._showToast(`Detected: ${i.battery_type} (${i.source})`)}else this._showToast("Could not auto-detect battery type"),t&&(t.disabled=!1,t.textContent="Autodetect")}catch(e){console.warn("Juice Patrol: auto-detect failed",e),this._showToast(this._wsErrorMessage(e,"auto-detection")),t&&(t.disabled=!1,t.innerHTML='<ha-icon icon="mdi:auto-fix" style="--mdc-icon-size:16px;vertical-align:middle;margin-right:4px"></ha-icon> Autodetect')}}),d.querySelector(".jp-rechargeable-cb")?.addEventListener("change",e=>{l=e.target.checked,c=!0}),d.addEventListener("click",e=>{e.target===d&&d.remove()}),d.querySelector(".jp-dialog-cancel")?.addEventListener("click",()=>d.remove()),d.querySelector(".jp-dialog-clear")?.addEventListener("click",()=>{n=[],o=null;const e=d.querySelector(".jp-dialog-input");e&&(e.value=""),p()}),d.querySelector(".jp-dialog-save")?.addEventListener("click",async()=>{let t;const i=d.querySelector(".jp-dialog-input"),a=i?.value?.trim();t=n.length>0?this._formatBatteryType(o,n.length):a||null,d.remove();const s=t!==(r||null);if(c)try{await this._hass.callWS({type:"juice_patrol/set_rechargeable",entity_id:e,is_rechargeable:l})}catch(e){this._showToast("Failed to update rechargeable state")}s&&await this._saveBatteryType(e,t)});const t=d.querySelector(".jp-dialog-input");t?.addEventListener("keydown",e=>{"Enter"===e.key&&d.querySelector(".jp-dialog-save")?.click(),"Escape"===e.key&&d.remove()})};p()}_resolveColor(e,t){return getComputedStyle(this).getPropertyValue(e).trim()||t}async _initChart(e){const t=this.shadowRoot.getElementById("jp-chart");if(!t||!e||!e.readings||0===e.readings.length)return;if(!customElements.get("ha-chart-base"))try{await(window.loadCardHelpers?.()),await new Promise(e=>setTimeout(e,100))}catch(e){console.warn("Juice Patrol: loadCardHelpers failed",e)}if(!customElements.get("ha-chart-base"))return void(t.innerHTML='<div class="empty-state">Chart component not available</div>');const i=this._resolveColor("--primary-color","#03a9f4"),r=this._resolveColor("--warning-color","#ffa726"),a=this._resolveColor("--error-color","#db4437"),s=this._resolveColor("--secondary-text-color","#999"),n=this._resolveColor("--secondary-text-color","#999"),o=this._resolveColor("--divider-color","rgba(0,0,0,0.12)"),l=this._resolveColor("--ha-card-background",this._resolveColor("--card-background-color","#fff")),c=this._resolveColor("--primary-text-color","#212121"),d=this._resolveColor("--primary-text-color","#212121"),h=e.readings,p=e.prediction,u=e.first_reading_timestamp,g=e.threshold,v=h.map(e=>[1e3*e.t,e.v]),m=[];if(null!=p.slope_per_day&&null!=p.intercept&&null!=u){const e=e=>{const t=(e-u)/86400;return p.slope_per_day*t+p.intercept},t=h[0].t,i=Date.now()/1e3,r=p.estimated_empty_timestamp?Math.min(p.estimated_empty_timestamp,i+31536e3):i+2592e3;for(const a of[t,i,r])m.push([1e3*a,Math.max(0,Math.min(100,e(a)))])}const y=v[0]?.[0]||Date.now(),_=m.length?m[m.length-1][0]:v[v.length-1]?.[0]||Date.now(),b=[{name:"Battery Level",type:"line",data:v,smooth:!1,symbol:v.length>50?"none":"circle",symbolSize:4,lineStyle:{width:2,color:i},itemStyle:{color:i},areaStyle:{color:i,opacity:.07}}];m.length>0&&b.push({name:"Predicted",type:"line",data:m,smooth:!1,symbol:"none",lineStyle:{width:2,type:"dashed",color:r},itemStyle:{color:r}}),b.push({name:"Threshold",type:"line",data:[[y,g],[_,g]],symbol:"none",lineStyle:{width:1,type:"dotted",color:a},itemStyle:{color:a}}),b.push({name:"Now",type:"line",data:[],markLine:{silent:!0,symbol:"none",data:[{xAxis:Date.now()}],lineStyle:{type:"solid",width:1,color:s},label:{formatter:"Now",fontSize:11,color:s}}});const f={xAxis:{type:"time",axisLabel:{color:n},axisLine:{lineStyle:{color:o}},splitLine:{lineStyle:{color:o}}},yAxis:{type:"value",min:0,max:100,axisLabel:{formatter:"{value}%",color:n},axisLine:{lineStyle:{color:o}},splitLine:{lineStyle:{color:o}}},tooltip:{trigger:"axis",backgroundColor:l,borderColor:o,textStyle:{color:c},formatter:e=>{if(!e||0===e.length)return"";const t=new Date(e[0].value[0]);let i=`<b>${t.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})+" "+t.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}</b><br>`;for(const t of e){if("Now"===t.seriesName)continue;const e="number"==typeof t.value[1]?t.value[1].toFixed(1)+"%":"—";i+=`${t.marker} ${t.seriesName}: ${e}<br>`}return i}},legend:{show:!0,bottom:0,textStyle:{color:d}},grid:{left:50,right:20,top:20,bottom:40},series:b},x=document.createElement("ha-chart-base");x.hass=this._hass,t.innerHTML="",t.appendChild(x),requestAnimationFrame(()=>{"chartOptions"in x?x.chartOptions=f:"data"in x&&"options"in x?(x.data=b,x.options=f):x.chart_options=f})}render(){return this._hass?V`
      ${this._renderToolbar()}
      <div id="jp-content">
        ${"detail"===this._activeView?this._renderDetailView():this._renderMainView()}
      </div>
      ${this._menuState?this._renderActionMenu():F}
    `:V`<div class="loading">Loading...</div>`}_renderToolbar(){return V`
      <div class="toolbar">
        <ha-menu-button .hass=${this._hass} .narrow=${this.narrow}></ha-menu-button>
        <div class="main-title">Juice Patrol</div>
        <ha-icon-button
          id="refreshBtn"
          class=${this._refreshing?"spinning":""}
          title="Re-fetch all battery data and recalculate predictions"
          .disabled=${this._refreshing}
          @click=${this._refresh}
        >
          <ha-icon icon="mdi:refresh"></ha-icon>
        </ha-icon-button>
        <ha-icon-button title="Settings" @click=${this._toggleSettings}>
          <ha-icon icon="mdi:cog"></ha-icon>
        </ha-icon-button>
      </div>
    `}_renderMainView(){const e=this._entities.length;let t=0,i=0,r=0,a=0,s=0;for(const e of this._entities)e.isLow&&t++,e.isStale&&i++,null===e.level&&r++,e.replacementPending&&a++,e.anomaly&&"normal"!==e.anomaly&&s++;return V`
      ${this._renderSummaryCards(e,t,i,r,a,s)}
      ${this._settingsOpen&&this._configEntry?this._renderSettings():F}
      ${this._renderFilterBar()}
      ${this._renderTabBar()}
      ${"shopping"===this._activeView?this._renderShoppingList():this._renderDeviceTable()}
    `}_renderSummaryCards(e,t,i,r,a,s){const n=(e,t,i,r="inherit")=>{const a={"summary-card":!0,clickable:!0,"active-filter":this._filterCategory===e};return V`
        <div class=${ue(a)} @click=${()=>this._setFilter(e)}>
          <div class="value" style="color:${t>0?r:"inherit"}">${t}</div>
          <div class="label">${i}</div>
        </div>
      `};return V`
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
        ${r>0?n("unavailable",r,"Unavailable","var(--disabled-text-color)"):F}
        ${a>0?n("pending",a,"Pending","var(--primary-color)"):F}
        ${s>0?n("anomaly",s,"Anomaly","var(--error-color)"):F}
      </div>
    `}_renderSettings(){const e=this._settingsValues;return V`
      <div class="settings">
        <div class="settings-header">
          <ha-icon icon="mdi:cog"></ha-icon> Settings
        </div>
        <div class="settings-body">
          ${this._renderSettingRow("Low battery threshold","Devices below this level trigger a juice_patrol_battery_low event.","low_threshold",e.low_threshold??20,1,99,"%")}
          ${this._renderSettingRow("Stale device timeout","Devices not reporting within this period are marked stale.","stale_timeout",e.stale_timeout??48,1,720,"hrs")}
          ${this._renderSettingRow("Prediction alert horizon","Alert when a device is predicted to die within this many days.","prediction_horizon",e.prediction_horizon??7,1,90,"days")}
        </div>
        <div class="settings-actions">
          <button class="btn btn-secondary" @click=${this._cancelSettings}>Cancel</button>
          <button
            class="btn btn-primary"
            .disabled=${!this._settingsDirty}
            @click=${this._saveSettings}
          >
            Save
          </button>
        </div>
      </div>
    `}_renderSettingRow(e,t,i,r,a,s,n){return V`
      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-label">${e}</div>
          <div class="setting-desc">${t}</div>
        </div>
        <div class="setting-input">
          <input
            type="number"
            min=${a}
            max=${s}
            data-key=${i}
            .value=${String(r)}
            aria-label="${e}"
            @input=${this._handleSettingInput}
          />
          <span class="setting-unit">${n}</span>
        </div>
      </div>
    `}_renderFilterBar(){const e={low:"Low battery",stale:"Stale",unavailable:"Unavailable",pending:"Pending",anomaly:"Anomaly"}[this._filterCategory]||this._filterCategory;return V`
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
          ${this._filterText?V`<button
                class="search-clear"
                title="Clear search"
                @click=${this._clearSearch}
              >
                <ha-icon icon="mdi:close" style="--mdc-icon-size:16px"></ha-icon>
              </button>`:F}
        </div>
        ${this._filterCategory?V`<button class="filter-chip" @click=${this._clearFilter}>
              <ha-icon
                icon="mdi:filter-remove"
                style="--mdc-icon-size:14px"
              ></ha-icon>
              ${e}
              <ha-icon icon="mdi:close" style="--mdc-icon-size:14px"></ha-icon>
            </button>`:F}
      </div>
    `}_renderTabBar(){return V`
      <div class="tab-bar">
        <button
          class="tab ${"devices"===this._activeView?"active":""}"
          @click=${()=>this._switchTab("devices")}
        >
          <ha-icon
            icon="mdi:battery-heart-variant"
            style="--mdc-icon-size:18px"
          ></ha-icon>
          Devices
        </button>
        <button
          class="tab ${"shopping"===this._activeView?"active":""}"
          @click=${()=>this._switchTab("shopping")}
        >
          <ha-icon icon="mdi:cart-outline" style="--mdc-icon-size:18px"></ha-icon>
          Shopping List
        </button>
      </div>
    `}_renderDeviceTable(){const e=this._getFilteredEntities();return 0===e.length?0!==this._entities.length||this._configEntry?V`<div class="devices">
        <div class="empty-state">
          ${0===this._entities.length?"No battery devices discovered yet.":"No devices match the current filter."}
        </div>
      </div>`:V`<div class="devices">
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <div>Discovering battery devices\u2026</div>
          </div>
        </div>`:V`
      <div class="devices">
        ${this._renderDeviceHeader()}
        ${we(e,e=>e.sourceEntity,e=>this._renderDeviceRow(e))}
      </div>
    `}_renderSortHeader(e,t,i={}){const r=this._sortCol===e,a=r?this._sortAsc?"▲":"▼":"";return V`
      <div
        class="sort-header ${r?"active":""}"
        style=${i.style||""}
        title=${i.title||""}
        @click=${t=>{t.stopPropagation(),this._toggleSort(e)}}
      >
        ${t}${a?V`<span class="sort-arrow">${a}</span>`:F}
      </div>
    `}_renderDeviceHeader(){return V`
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
    `}_renderDeviceRow(e){const t=this._recentlyChanged.get(e.sourceEntity),i={"device-row":!0,attention:!e.replacementPending&&(e.isLow||e.isStale||e.anomaly&&"normal"!==e.anomaly),pending:e.replacementPending,"just-updated-up":"up"===t?.dir,"just-updated-down":"down"===t?.dir};return V`
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
          ${this._formatDate(e.predictedEmpty,this._isFastDischarge(e))}
        </div>
        <div class="action-cell">
          ${e.replacementPending?V`<button
                class="action-btn confirm"
                title="Confirm replacement"
                @click=${t=>this._handleActionClick(t,"confirm",e.sourceEntity)}
              >
                <ha-icon icon="mdi:check" style="--mdc-icon-size:16px"></ha-icon>
              </button>`:V`<button
                class="action-btn"
                title="Actions"
                @click=${t=>this._handleActionClick(t,"menu",e.sourceEntity)}
              >
                <ha-icon
                  icon="mdi:dots-vertical"
                  style="--mdc-icon-size:16px"
                ></ha-icon>
              </button>`}
        </div>
      </div>
    `}_renderBadges(e){const t=[];if(e.replacementPending){const i=e.isRechargeable?"RECHARGED?":"REPLACED?",r=e.isRechargeable?"Battery level jumped significantly — normal recharge cycle?":"Battery level jumped significantly — was the battery replaced?";t.push(V`<span class="badge replaced" title=${r}>${i}</span>`)}if(e.isLow){const i=e.threshold??this._settingsValues.low_threshold??20;t.push(V`<span
          class="badge low"
          title="Battery is at ${this._displayLevel(e.level)}%, below the ${i}% threshold"
          >LOW</span
        >`)}if(e.isStale&&t.push(V`<span
          class="badge stale"
          title="No battery reading received within the stale timeout period"
          >STALE</span
        >`),"cliff"===e.anomaly?t.push(V`<span
          class="badge cliff"
          title="Sudden drop of ${e.dropSize??"?"}% in a single reading interval"
          >CLIFF DROP</span
        >`):"rapid"===e.anomaly&&t.push(V`<span
          class="badge rapid"
          title="Discharge rate significantly higher than average \u2014 ${e.dropSize??"?"}% drop"
          >RAPID</span
        >`),"erratic"===e.stability&&t.push(V`<span class="badge erratic" title=${this._erraticTooltip(e)}
          >ERRATIC</span
        >`),"noisy"===e.predictionStatus&&t.push(V`<span
          class="badge noisy"
          title="Battery data is too irregular for a reliable prediction"
          >NOISY</span
        >`),e.isRechargeable&&(this._isActivelyCharging(e)?t.push(V`<span class="badge charging" title="Currently charging">
            <ha-icon
              icon="mdi:battery-charging"
              style="--mdc-icon-size:14px"
            ></ha-icon>
            Charging
          </span>`):t.push(V`<span
            class="badge rechargeable"
            title="Rechargeable: ${e.rechargeableReason||"detected"}"
          >
            <ha-icon
              icon="mdi:power-plug-battery"
              style="--mdc-icon-size:14px"
            ></ha-icon>
          </span>`)),null!==e.meanLevel&&e.stability&&"stable"!==e.stability&&"insufficient_data"!==e.stability){const i=this._displayLevel(e.meanLevel),r=this._displayLevel(e.level);null!==i&&Math.abs(i-(r??0))>2&&t.push(V`<span
            class="badge avg"
            title="7-day average is ${i}% while current reading is ${r??"?"}%"
            >avg ${i}%</span
          >`)}return t}_renderDeviceSub(e){const t=[],i=(e.name||"").toLowerCase();e.manufacturer&&!i.includes(e.manufacturer.toLowerCase())&&t.push(e.manufacturer),e.model&&!i.includes(e.model.toLowerCase())&&t.push(e.model);let r=t.join(" ");return r&&e.platform?r+=` · ${e.platform}`:!r&&e.platform&&(r=e.platform),r?V`<div class="name-sub">${r}</div>`:F}_renderLevelCell(e){const t=this._getLevelColor(e.level,e.threshold);return V`<div class="level-cell" style="color:${t}">${this._formatLevel(e.level)}</div>`}_renderReliabilityBadge(e){const t=e.reliability,i=null!==e.daysRemaining||null!==e.hoursRemaining;if(null==t||!i)return"—";return V`<span
      class="reliability-badge ${t>=70?"high":t>=40?"medium":"low"}"
      title="Prediction reliability: ${t}%"
      >${t}%</span
    >`}_renderActionMenu(){const{entityId:e,top:t,right:i}=this._menuState,r=this._getDevice(e),a=r?.isRechargeable||!1;return V`
      <div class="jp-menu-overlay" @click=${e=>{e.target.classList.contains("jp-menu-overlay")&&this._closeOverlays()}}>
        <div class="jp-menu" style="top:${t}px; right:${i}px;">
          <button
            class="jp-menu-item"
            @click=${()=>this._handleMenuAction("replace",e)}
          >
            <ha-icon
              icon=${a?"mdi:battery-charging-low":"mdi:battery-sync"}
              style="--mdc-icon-size:18px"
            ></ha-icon>
            ${a?"Needs recharge":"Mark as replaced"}
          </button>
          <button
            class="jp-menu-item"
            @click=${()=>this._handleMenuAction("recalculate",e)}
          >
            <ha-icon
              icon="mdi:calculator-variant"
              style="--mdc-icon-size:18px"
            ></ha-icon>
            Recalculate
          </button>
          <button
            class="jp-menu-item"
            @click=${()=>this._handleMenuAction("type",e)}
          >
            <ha-icon
              icon="mdi:battery-heart-variant"
              style="--mdc-icon-size:18px"
            ></ha-icon>
            Set battery type${r?.batteryType?` (${r.batteryType})`:""}
          </button>
        </div>
      </div>
    `}_renderShoppingList(){if(this._shoppingLoading)return V`<div class="devices">
        <div class="empty-state">Loading shopping list...</div>
      </div>`;if(!this._shoppingData||!this._shoppingData.groups)return V`<div class="devices">
        <div class="empty-state">
          No shopping data available. Click refresh to load.
        </div>
      </div>`;const{groups:e,total_needed:t}=this._shoppingData;return 0===e.length?V`<div class="devices">
        <div class="empty-state">No battery devices found.</div>
      </div>`:V`
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
        ${e.filter(e=>e.needs_replacement>0&&"Unknown"!==e.battery_type).map(e=>V`
              <div class="summary-card shopping-need-card">
                <div class="value">${e.needs_replacement}</div>
                <div class="label">${e.battery_type}</div>
              </div>
            `)}
      </div>
      <div class="shopping-groups">
        ${e.map(e=>this._renderShoppingGroup(e))}
      </div>
      ${e.some(e=>"Unknown"===e.battery_type)?V`<div class="shopping-hint">
            <ha-icon
              icon="mdi:information-outline"
              style="--mdc-icon-size:16px"
            ></ha-icon>
            Devices with unknown battery type can be configured from the Devices tab.
          </div>`:F}
    `}_renderShoppingGroup(e){const t="Unknown"===e.battery_type?"mdi:help-circle-outline":"mdi:battery",i=!!this._expandedGroups[e.battery_type];return V`
      <div class="shopping-group ${i?"expanded":""}">
        <div
          class="shopping-group-header"
          @click=${()=>this._toggleShoppingGroup(e.battery_type)}
        >
          <ha-icon
            icon=${t}
            style="--mdc-icon-size:20px;color:var(--secondary-text-color)"
          ></ha-icon>
          <span class="shopping-type">${e.battery_type}</span>
          ${e.needs_replacement>0?V`<span class="shopping-need-badge"
                >${e.needs_replacement}\u00d7</span
              >`:F}
          <span class="shopping-count">
            ${e.battery_count}
            batter${1!==e.battery_count?"ies":"y"} in
            ${e.device_count}
            device${1!==e.device_count?"s":""}${e.needs_replacement>0?` — ${e.needs_replacement} need${1!==e.needs_replacement?"":"s"} replacement`:""}
          </span>
          <ha-icon
            icon="mdi:chevron-down"
            class="shopping-expand-icon"
            style="--mdc-icon-size:20px;color:var(--secondary-text-color)"
          ></ha-icon>
        </div>
        <div class="shopping-devices">
          ${e.devices.map(e=>{const t=this._getLevelColor(e.level,null),i=e.is_low||null!==e.days_remaining&&e.days_remaining<=(this._settingsValues.prediction_horizon??7),r=e.battery_count>1?` (${e.battery_count}×)`:"";return V`
              <div class="shopping-device ${i?"needs-replacement":""}">
                <span class="shopping-device-name"
                  >${e.device_name}${r}</span
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
      </div>
    `}_renderDetailView(){const e=this._detailEntity,t=this._getDevice(e);if(!t)return V`<div class="empty-state">Device not found</div>`;const i=t.name||e;return V`
      <div class="detail-toolbar">
        <button class="detail-back" @click=${this._closeDetail}>
          <ha-icon icon="mdi:arrow-left"></ha-icon>
          Back
        </button>
        <div class="detail-device-name">${i}</div>
      </div>
      ${this._renderDetailMeta(t)} ${this._renderDetailChart()}
      ${this._renderDetailActions()}
    `}_renderDetailMeta(e){const t=this._chartData,i=t?.prediction||{},r={normal:"Normal discharge",charging:"Currently charging",flat:"Flat — no significant discharge detected",noisy:"Noisy — data too irregular for prediction",insufficient_data:"Not enough data for prediction",single_level:"Single level — all readings identical",insufficient_range:"Insufficient range — readings too close together"}[i.status]||i.status||"Unknown",a=this._getLevelColor(e.level,e.threshold);return V`
      <div class="detail-meta">
        <div class="detail-meta-grid">
          <div class="detail-meta-item">
            <div class="detail-meta-label">Current Level</div>
            <div class="detail-meta-value" style="color:${a}">
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
            <div class="detail-meta-value">${r}</div>
          </div>
          <div class="detail-meta-item">
            <div class="detail-meta-label">Confidence</div>
            <div class="detail-meta-value">
              <span class="confidence-dot ${i.confidence||""}"></span>
              ${i.confidence||"—"}
            </div>
          </div>
          ${null!=i.r_squared?V`<div class="detail-meta-item">
                <div class="detail-meta-label">R\u00b2</div>
                <div class="detail-meta-value">${i.r_squared.toFixed(3)}</div>
              </div>`:F}
          ${null!=i.reliability?V`<div class="detail-meta-item">
                <div class="detail-meta-label">Reliability</div>
                <div class="detail-meta-value">${this._renderReliabilityBadge(e)}</div>
              </div>`:F}
          <div class="detail-meta-item">
            <div class="detail-meta-label">Data Points</div>
            <div class="detail-meta-value">
              ${i.data_points_used??t?.readings?.length??"—"}
            </div>
          </div>
          ${e.predictedEmpty?V`<div class="detail-meta-item">
                <div class="detail-meta-label">Predicted Empty</div>
                <div class="detail-meta-value">
                  ${this._formatDate(e.predictedEmpty,this._isFastDischarge(e))}
                </div>
              </div>`:F}
        </div>
      </div>
    `}_renderDetailChart(){if(this._chartLoading)return V`
        <div class="detail-chart" id="jp-chart">
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <div>Loading chart data\u2026</div>
          </div>
        </div>
      `;return this._chartData&&this._chartData.readings&&this._chartData.readings.length>0?V`<div class="detail-chart" id="jp-chart"></div>`:V`
        <div class="detail-chart" id="jp-chart">
          <div class="empty-state">Not enough data yet to display a chart.</div>
        </div>
      `}_renderDetailActions(){return V`
      <div class="detail-actions">
        <button
          class="btn btn-secondary"
          @click=${()=>{this._detailEntity&&this.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:this._detailEntity}}))}}
        >
          <ha-icon
            icon="mdi:information-outline"
            style="--mdc-icon-size:16px;vertical-align:middle;margin-right:4px"
          ></ha-icon>
          More info
        </button>
        <button
          class="btn btn-secondary"
          @click=${async()=>{this._detailEntity&&(await this._recalculate(this._detailEntity),setTimeout(()=>this._loadChartData(this._detailEntity),500))}}
        >
          <ha-icon
            icon="mdi:calculator-variant"
            style="--mdc-icon-size:16px;vertical-align:middle;margin-right:4px"
          ></ha-icon>
          Recalculate
        </button>
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
      .toolbar {
        display: flex;
        align-items: center;
        font-size: 20px;
        height: var(--header-height, 56px);
        font-weight: 400;
        color: var(
          --sidebar-text-color,
          var(--app-header-text-color, var(--primary-text-color))
        );
        background-color: var(
          --sidebar-background-color,
          var(--app-header-background-color, var(--primary-background-color))
        );
        border-bottom: 1px solid var(--divider-color);
        box-sizing: border-box;
        padding: 8px 12px;
        position: sticky;
        top: 0;
        z-index: 5;
      }
      .toolbar ha-menu-button {
        pointer-events: auto;
        color: var(--sidebar-icon-color);
      }
      .toolbar .main-title {
        margin-inline-start: 24px;
        line-height: 1.5;
        flex-grow: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .toolbar ha-icon-button {
        color: var(--sidebar-icon-color, var(--secondary-text-color));
      }
      #jp-content {
        padding: 16px;
        height: calc(100% - var(--header-height, 56px));
        overflow-y: auto;
        box-sizing: border-box;
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
      .settings {
        background: var(--card-bg);
        border-radius: 12px;
        border: 1px solid var(--border);
        margin-bottom: 20px;
        overflow: hidden;
      }
      .settings-header {
        display: flex;
        align-items: center;
        padding: 14px 16px;
        font-size: 14px;
        font-weight: 500;
        border-bottom: 1px solid var(--border);
      }
      .settings-header ha-icon {
        --mdc-icon-size: 20px;
        margin-right: 8px;
        color: var(--secondary-text-color);
      }
      .settings-body {
        padding: 8px 0;
      }
      .setting-row {
        display: grid;
        grid-template-columns: 1fr 120px;
        align-items: center;
        padding: 12px 16px;
        gap: 16px;
      }
      .setting-info {
        display: flex;
        flex-direction: column;
      }
      .setting-label {
        font-size: 14px;
      }
      .setting-desc {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-top: 2px;
        line-height: 1.4;
      }
      .setting-input {
        display: flex;
        align-items: center;
        gap: 6px;
        justify-content: flex-end;
      }
      .setting-input input {
        width: 64px;
        padding: 6px 8px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--primary-background-color);
        color: var(--primary-text-color);
        font-size: 14px;
        text-align: right;
        outline: none;
      }
      .setting-input input:focus {
        border-color: var(--primary-color);
      }
      .setting-unit {
        font-size: 13px;
        color: var(--secondary-text-color);
        min-width: 28px;
      }
      .settings-actions {
        display: flex;
        justify-content: flex-end;
        padding: 8px 16px 14px;
        gap: 8px;
      }
      .btn {
        padding: 8px 20px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
      }
      .btn-primary {
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
      }
      .btn-primary:disabled {
        opacity: 0.5;
        cursor: default;
      }
      .btn-secondary {
        background: var(--secondary-background-color);
        color: var(--primary-text-color);
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
      .loading-state .loading-spinner {
        display: inline-block;
        width: 24px;
        height: 24px;
        border: 3px solid var(--divider-color);
        border-top-color: var(--primary-color);
        border-radius: 50%;
        animation: jp-spin 0.8s linear infinite;
        margin-bottom: 8px;
      }
      .jp-menu-overlay {
        position: fixed;
        inset: 0;
        z-index: 10;
      }
      .jp-menu {
        position: fixed;
        z-index: 11;
        background: var(--primary-background-color, #fff);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 6px 0;
        min-width: 220px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
      }
      .jp-menu-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 16px;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 14px;
        color: var(--primary-text-color);
        text-align: left;
        font-family: inherit;
      }
      .jp-menu-item:hover {
        background: var(--secondary-background-color);
      }
      .jp-menu-item ha-icon {
        color: var(--secondary-text-color);
      }
      .jp-dialog-overlay {
        position: fixed;
        inset: 0;
        z-index: 20;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .jp-dialog {
        background: var(--card-bg);
        border-radius: 16px;
        padding: 24px;
        min-width: 340px;
        max-width: 90vw;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
      }
      .jp-dialog-title {
        font-size: 18px;
        font-weight: 500;
        margin-bottom: 16px;
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
      .tab-bar {
        display: flex;
        gap: 0;
        margin-bottom: 16px;
        border-bottom: 2px solid var(--border);
      }
      .tab {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 20px;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: var(--secondary-text-color);
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        font-family: inherit;
      }
      .tab:hover {
        color: var(--primary-text-color);
      }
      .tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
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
      .shopping-group {
        background: var(--card-bg);
        border-radius: 12px;
        border: 1px solid var(--border);
        overflow: hidden;
      }
      .shopping-group-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px;
        cursor: pointer;
        user-select: none;
      }
      .shopping-group-header:hover {
        background: var(--secondary-background-color);
      }
      .shopping-type {
        font-size: 16px;
        font-weight: 500;
      }
      .shopping-count {
        flex: 1;
        font-size: 13px;
        color: var(--secondary-text-color);
      }
      .shopping-expand-icon {
        transition: transform 0.2s;
      }
      .shopping-group.expanded .shopping-expand-icon {
        transform: rotate(180deg);
      }
      .shopping-devices {
        padding: 0 16px 8px;
        display: none;
      }
      .shopping-group.expanded .shopping-devices {
        display: block;
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
      .detail-toolbar {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
      }
      .detail-back {
        display: flex;
        align-items: center;
        gap: 4px;
        background: none;
        border: 1px solid var(--border);
        border-radius: 8px;
        cursor: pointer;
        padding: 6px 12px;
        color: var(--primary-text-color);
        font-size: 14px;
        font-family: inherit;
      }
      .detail-back:hover {
        background: var(--secondary-background-color);
      }
      .detail-back ha-icon {
        --mdc-icon-size: 18px;
      }
      .detail-device-name {
        font-size: 18px;
        font-weight: 500;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
      .detail-chart {
        background: var(--card-bg);
        border-radius: 12px;
        border: 1px solid var(--border);
        padding: 16px;
        margin-bottom: 16px;
        min-height: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .detail-chart ha-chart-base {
        width: 100%;
        height: 380px;
        display: block;
      }
      .detail-actions {
        display: flex;
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
        .tab {
          padding: 8px 14px;
          font-size: 13px;
        }
        .settings .setting-row {
          grid-template-columns: 1fr;
          gap: 8px;
        }
        .setting-input {
          justify-content: flex-start;
        }
        .shopping-summary {
          flex-wrap: wrap;
          gap: 8px;
        }
        .shopping-summary .summary-card {
          min-width: 60px;
        }
      }
    `}});

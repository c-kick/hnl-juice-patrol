/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,t=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),a=new WeakMap;let s=class{constructor(e,t,a){if(this._$cssResult$=!0,a!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const i=this.t;if(t&&void 0===e){const t=void 0!==i&&1===i.length;t&&(e=a.get(i)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&a.set(i,e))}return e}toString(){return this.cssText}};const n=(e,...t)=>{const a=1===e.length?e[0]:t.reduce((t,i,a)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[a+1],e[0]);return new s(a,e,i)},r=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new s("string"==typeof e?e:e+"",void 0,i))(t)})(e):e,{is:o,defineProperty:l,getOwnPropertyDescriptor:c,getOwnPropertyNames:d,getOwnPropertySymbols:h,getPrototypeOf:p}=Object,u=globalThis,g=u.trustedTypes,m=g?g.emptyScript:"",_=u.reactiveElementPolyfillSupport,y=(e,t)=>e,v={toAttribute(e,t){switch(t){case Boolean:e=e?m:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},b=(e,t)=>!o(e,t),f={attribute:!0,type:String,converter:v,reflect:!1,useDefault:!1,hasChanged:b};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=f){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),a=this.getPropertyDescriptor(e,i,t);void 0!==a&&l(this.prototype,e,a)}}static getPropertyDescriptor(e,t,i){const{get:a,set:s}=c(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:a,set(t){const n=a?.call(this);s?.call(this,t),this.requestUpdate(e,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??f}static _$Ei(){if(this.hasOwnProperty(y("elementProperties")))return;const e=p(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(y("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y("properties"))){const e=this.properties,t=[...d(e),...h(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(r(e))}else void 0!==e&&t.push(r(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const i=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((i,a)=>{if(t)i.adoptedStyleSheets=a.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const t of a){const a=document.createElement("style"),s=e.litNonce;void 0!==s&&a.setAttribute("nonce",s),a.textContent=t.cssText,i.appendChild(a)}})(i,this.constructor.elementStyles),i}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),a=this.constructor._$Eu(e,i);if(void 0!==a&&!0===i.reflect){const s=(void 0!==i.converter?.toAttribute?i.converter:v).toAttribute(t,i.type);this._$Em=e,null==s?this.removeAttribute(a):this.setAttribute(a,s),this._$Em=null}}_$AK(e,t){const i=this.constructor,a=i._$Eh.get(e);if(void 0!==a&&this._$Em!==a){const e=i.getPropertyOptions(a),s="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:v;this._$Em=a;const n=s.fromAttribute(t,e.type);this[a]=n??this._$Ej?.get(a)??n,this._$Em=null}}requestUpdate(e,t,i,a=!1,s){if(void 0!==e){const n=this.constructor;if(!1===a&&(s=this[e]),i??=n.getPropertyOptions(e),!((i.hasChanged??b)(s,t)||i.useDefault&&i.reflect&&s===this._$Ej?.get(e)&&!this.hasAttribute(n._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:a,wrapped:s},n){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,n??t??this[e]),!0!==s||void 0!==n)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===a&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,a=this[t];!0!==e||this._$AL.has(t)||void 0===a||this.C(t,void 0,i,a)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[y("elementProperties")]=new Map,$[y("finalized")]=new Map,_?.({ReactiveElement:$}),(u.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const x=globalThis,w=e=>e,S=x.trustedTypes,C=S?S.createPolicy("lit-html",{createHTML:e=>e}):void 0,E="$lit$",A=`lit$${Math.random().toFixed(9).slice(2)}$`,L="?"+A,k=`<${L}>`,R=document,D=()=>R.createComment(""),T=e=>null===e||"object"!=typeof e&&"function"!=typeof e,j=Array.isArray,z="[ \t\n\f\r]",M=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,H=/-->/g,P=/>/g,U=RegExp(`>|${z}(?:([^\\s"'>=/]+)(${z}*=${z}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),V=/'/g,F=/"/g,O=/^(?:script|style|textarea|title)$/i,N=(e=>(t,...i)=>({_$litType$:e,strings:t,values:i}))(1),B=Symbol.for("lit-noChange"),I=Symbol.for("lit-nothing"),W=new WeakMap,q=R.createTreeWalker(R,129);function G(e,t){if(!j(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==C?C.createHTML(t):t}const J=(e,t)=>{const i=e.length-1,a=[];let s,n=2===t?"<svg>":3===t?"<math>":"",r=M;for(let t=0;t<i;t++){const i=e[t];let o,l,c=-1,d=0;for(;d<i.length&&(r.lastIndex=d,l=r.exec(i),null!==l);)d=r.lastIndex,r===M?"!--"===l[1]?r=H:void 0!==l[1]?r=P:void 0!==l[2]?(O.test(l[2])&&(s=RegExp("</"+l[2],"g")),r=U):void 0!==l[3]&&(r=U):r===U?">"===l[0]?(r=s??M,c=-1):void 0===l[1]?c=-2:(c=r.lastIndex-l[2].length,o=l[1],r=void 0===l[3]?U:'"'===l[3]?F:V):r===F||r===V?r=U:r===H||r===P?r=M:(r=U,s=void 0);const h=r===U&&e[t+1].startsWith("/>")?" ":"";n+=r===M?i+k:c>=0?(a.push(o),i.slice(0,c)+E+i.slice(c)+A+h):i+A+(-2===c?t:h)}return[G(e,n+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),a]};class Z{constructor({strings:e,_$litType$:t},i){let a;this.parts=[];let s=0,n=0;const r=e.length-1,o=this.parts,[l,c]=J(e,t);if(this.el=Z.createElement(l,i),q.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(a=q.nextNode())&&o.length<r;){if(1===a.nodeType){if(a.hasAttributes())for(const e of a.getAttributeNames())if(e.endsWith(E)){const t=c[n++],i=a.getAttribute(e).split(A),r=/([.?@])?(.*)/.exec(t);o.push({type:1,index:s,name:r[2],strings:i,ctor:"."===r[1]?ee:"?"===r[1]?te:"@"===r[1]?ie:X}),a.removeAttribute(e)}else e.startsWith(A)&&(o.push({type:6,index:s}),a.removeAttribute(e));if(O.test(a.tagName)){const e=a.textContent.split(A),t=e.length-1;if(t>0){a.textContent=S?S.emptyScript:"";for(let i=0;i<t;i++)a.append(e[i],D()),q.nextNode(),o.push({type:2,index:++s});a.append(e[t],D())}}}else if(8===a.nodeType)if(a.data===L)o.push({type:2,index:s});else{let e=-1;for(;-1!==(e=a.data.indexOf(A,e+1));)o.push({type:7,index:s}),e+=A.length-1}s++}}static createElement(e,t){const i=R.createElement("template");return i.innerHTML=e,i}}function Y(e,t,i=e,a){if(t===B)return t;let s=void 0!==a?i._$Co?.[a]:i._$Cl;const n=T(t)?void 0:t._$litDirective$;return s?.constructor!==n&&(s?._$AO?.(!1),void 0===n?s=void 0:(s=new n(e),s._$AT(e,i,a)),void 0!==a?(i._$Co??=[])[a]=s:i._$Cl=s),void 0!==s&&(t=Y(e,s._$AS(e,t.values),s,a)),t}class K{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,a=(e?.creationScope??R).importNode(t,!0);q.currentNode=a;let s=q.nextNode(),n=0,r=0,o=i[0];for(;void 0!==o;){if(n===o.index){let t;2===o.type?t=new Q(s,s.nextSibling,this,e):1===o.type?t=new o.ctor(s,o.name,o.strings,this,e):6===o.type&&(t=new ae(s,this,e)),this._$AV.push(t),o=i[++r]}n!==o?.index&&(s=q.nextNode(),n++)}return q.currentNode=R,a}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,a){this.type=2,this._$AH=I,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=a,this._$Cv=a?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Y(this,e,t),T(e)?e===I||null==e||""===e?(this._$AH!==I&&this._$AR(),this._$AH=I):e!==this._$AH&&e!==B&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>j(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==I&&T(this._$AH)?this._$AA.nextSibling.data=e:this.T(R.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,a="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=Z.createElement(G(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===a)this._$AH.p(t);else{const e=new K(a,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=W.get(e.strings);return void 0===t&&W.set(e.strings,t=new Z(e)),t}k(e){j(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,a=0;for(const s of e)a===t.length?t.push(i=new Q(this.O(D()),this.O(D()),this,this.options)):i=t[a],i._$AI(s),a++;a<t.length&&(this._$AR(i&&i._$AB.nextSibling,a),t.length=a)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=w(e).nextSibling;w(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class X{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,a,s){this.type=1,this._$AH=I,this._$AN=void 0,this.element=e,this.name=t,this._$AM=a,this.options=s,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=I}_$AI(e,t=this,i,a){const s=this.strings;let n=!1;if(void 0===s)e=Y(this,e,t,0),n=!T(e)||e!==this._$AH&&e!==B,n&&(this._$AH=e);else{const a=e;let r,o;for(e=s[0],r=0;r<s.length-1;r++)o=Y(this,a[i+r],t,r),o===B&&(o=this._$AH[r]),n||=!T(o)||o!==this._$AH[r],o===I?e=I:e!==I&&(e+=(o??"")+s[r+1]),this._$AH[r]=o}n&&!a&&this.j(e)}j(e){e===I?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class ee extends X{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===I?void 0:e}}class te extends X{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==I)}}class ie extends X{constructor(e,t,i,a,s){super(e,t,i,a,s),this.type=5}_$AI(e,t=this){if((e=Y(this,e,t,0)??I)===B)return;const i=this._$AH,a=e===I&&i!==I||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,s=e!==I&&(i===I||a);a&&this.element.removeEventListener(this.name,this,i),s&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class ae{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){Y(this,e)}}const se=x.litHtmlPolyfillSupport;se?.(Z,Q),(x.litHtmlVersions??=[]).push("3.3.2");const ne=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class re extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const a=i?.renderBefore??t;let s=a._$litPart$;if(void 0===s){const e=i?.renderBefore??null;a._$litPart$=s=new Q(t.insertBefore(D(),e),e,void 0,i??{})}return s._$AI(e),s})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return B}}re._$litElement$=!0,re.finalized=!0,ne.litElementHydrateSupport?.({LitElement:re});const oe=ne.litElementPolyfillSupport;oe?.({LitElement:re}),(ne.litElementVersions??=[]).push("4.2.2");const le="font-size:13px;color:var(--secondary-text-color)";customElements.define("juice-patrol-panel",class extends re{static get properties(){return{narrow:{type:Boolean},_entities:{state:!0},_activeView:{state:!0},_settingsOpen:{state:!0},_settingsDirty:{state:!0},_settingsValues:{state:!0},_configEntry:{state:!0},_detailEntity:{state:!0},_chartData:{state:!0},_chartLoading:{state:!0},_chartStale:{state:!0},_shoppingData:{state:!0},_shoppingLoading:{state:!0},_refreshing:{state:!0},_flashGeneration:{state:!0},_expandedGroups:{state:!0},_ignoredEntities:{state:!0},_chartRange:{state:!0},_filters:{state:!0}}}constructor(){super(),this._hass=null,this._panel=null,this._hassInitialized=!1,this._entities=[],this._configEntry=null,this._settingsOpen=!1,this._settingsDirty=!1,this._settingsValues={},this._prevLevels=new Map,this._recentlyChanged=new Map,this._activeView="devices",this._shoppingData=null,this._shoppingLoading=!1,this._refreshing=!1,this._expandedGroups={},this._highlightEntity=null,this._highlightApplied=!1,this._highlightAttempts=0,this._detailEntity=null,this._chartData=null,this._chartLoading=!1,this._chartStale=!1,this._chartLastLevel=null,this._flashGeneration=0,this._ignoredEntities=null,this._chartRange="auto",this._filters={status:{value:["active","low"]}},this._flashCleanupTimer=null,this._refreshTimer=null,this._entityMap=new Map}set hass(e){const t=this._hass?.connection;this._hass=e;const i=!this._hassInitialized,a=!i&&e?.connection&&e.connection!==t;this._processHassUpdate(i||a),this._hassInitialized=!0}get hass(){return this._hass}set panel(e){this._panel=e}get panel(){return this._panel}get _basePath(){return`/${this._panel?.url_path||"juice-patrol"}`}connectedCallback(){super.connectedCallback(),this.requestUpdate(),this._escapeHandler=e=>{"Escape"===e.key&&this._closeOverlays()},window.addEventListener("keydown",this._escapeHandler),this._popstateHandler=()=>{this._syncViewFromUrl()},window.addEventListener("popstate",this._popstateHandler),this._locationChangedHandler=()=>{this._syncViewFromUrl()},window.addEventListener("location-changed",this._locationChangedHandler),this._visibilityHandler=()=>{if("visible"===document.visibilityState&&this._hass&&(this._processHassUpdate(!1),"detail"===this._activeView&&this._detailEntity)){const e=3e5,t=this._chartData?.last_calculated?Date.now()-1e3*this._chartData.last_calculated:1/0;this._chartLoading=!1,t>e&&this._loadChartData(this._detailEntity)}},document.addEventListener("visibilitychange",this._visibilityHandler)}disconnectedCallback(){super.disconnectedCallback();for(const e of["_flashCleanupTimer","_refreshTimer"])this[e]&&(clearTimeout(this[e]),this[e]=null);this._refreshing=!1,this._escapeHandler&&(window.removeEventListener("keydown",this._escapeHandler),this._escapeHandler=null),this._popstateHandler&&(window.removeEventListener("popstate",this._popstateHandler),this._popstateHandler=null),this._locationChangedHandler&&(window.removeEventListener("location-changed",this._locationChangedHandler),this._locationChangedHandler=null),this._visibilityHandler&&(document.removeEventListener("visibilitychange",this._visibilityHandler),this._visibilityHandler=null)}firstUpdated(){this._syncViewFromUrl();const e=new URLSearchParams(window.location.search).get("entity");e&&/^[a-z0-9_]+\.[a-z0-9_]+$/.test(e)&&(this._highlightEntity=e)}_syncViewFromUrl(){const e=window.location.pathname,t=`${this._basePath}/detail/`;if(e.startsWith(t)){const i=decodeURIComponent(e.slice(t.length));if(/^[a-z0-9_]+\.[a-z0-9_]+$/.test(i))return void(this._detailEntity===i&&"detail"===this._activeView||(this._detailEntity=i,this._activeView="detail",this._chartData=null,this._chartLastLevel=null,this._loadChartData(i)))}if(e===`${this._basePath}/shopping`||e===`${this._basePath}/shopping/`)return"detail"===this._activeView&&(this._detailEntity=null,this._chartData=null,this._chartEl=null),"shopping"!==this._activeView&&(this._activeView="shopping",this._loadShoppingList()),void(this._entities=this._entityList);"detail"===this._activeView&&(this._detailEntity=null,this._chartData=null,this._chartEl=null),this._activeView="devices",this._entities=this._entityList}updated(e){(e.has("_chartData")||e.has("_chartRange"))&&this._chartData&&requestAnimationFrame(()=>this._initChart(this._chartData)),e.has("_entities")&&(!this._highlightApplied&&this._highlightEntity&&this._applyDeepLinkHighlight(),"detail"===this._activeView&&this._detailEntity&&!this._entityMap.get(this._detailEntity)&&this._closeDetail())}_processHassUpdate(e){if(!this._hass)return;const t=this._entityHash;this._updateEntities();if(this._entityHash!==t&&(this._entityMap=new Map(this._entityList.map(e=>[e.sourceEntity,e])),"detail"!==this._activeView&&(this._entities=this._entityList)),e&&(this._loadConfig(),this._loadIgnored()),"detail"===this._activeView&&this._detailEntity&&!this._chartLoading){const e=this._getDevice(this._detailEntity);e&&e.level!==this._chartLastLevel&&(this._chartStale=!0)}}_updateEntities(){if(!this._hass)return;const e=this._hass.states,t=new Map;for(const[i,a]of Object.entries(e)){const s=a.attributes||{},n=s.source_entity;if(!n)continue;if(i.includes("lowest_battery")||i.includes("attention_needed"))continue;if(!(i.includes("_discharge_rate")||i.includes("_days_remaining")||i.includes("_predicted_empty")||i.includes("_battery_low")||i.includes("_stale")))continue;t.has(n)||t.set(n,{sourceEntity:n,name:null,level:null,dischargeRate:null,daysRemaining:null,predictedEmpty:null,isLow:!1,isStale:!1,confidence:null,threshold:null,stability:null,stabilityCv:null,meanLevel:null,anomaly:null,dropSize:null,isRechargeable:!1,rechargeableReason:null,replacementPending:!1,batteryType:null,batteryTypeSource:null,manufacturer:null,model:null,chargingState:null,reliability:null,predictionStatus:null,platform:null,dischargeRateHour:null,hoursRemaining:null,lastCalculated:null});const r=t.get(n),o=e[n];if(o&&"unavailable"!==o.state&&"unknown"!==o.state){const e=parseFloat(o.state);isNaN(e)||(r.level=e)}o?.attributes?.friendly_name&&(r.name=o.attributes.friendly_name),i.includes("_discharge_rate")?(r.dischargeRate="unknown"!==a.state&&"unavailable"!==a.state?parseFloat(a.state):null,r.stability=s.stability||null,r.stabilityCv=s.stability_cv??null,r.meanLevel=s.mean_level??null,r.anomaly=s.discharge_anomaly||null,r.dropSize=s.drop_size??null,r.isRechargeable=s.is_rechargeable||!1,r.rechargeableReason=s.rechargeable_reason||null,r.replacementPending=s.replacement_pending||!1,r.lastReplaced=s.last_replaced||null,r.batteryType=s.battery_type||null,r.batteryTypeSource=s.battery_type_source||null,r.platform=s.platform||null,r.manufacturer=s.manufacturer||null,r.model=s.model||null,r.chargingState=s.charging_state?s.charging_state.toLowerCase().replace(/\s/g,"_"):null,r.dischargeRateHour=s.discharge_rate_hour??null,r.lastCalculated=s.last_calculated||null):i.includes("_days_remaining")?(r.daysRemaining="unknown"!==a.state&&"unavailable"!==a.state?parseFloat(a.state):null,r.confidence=s.confidence||null,r.reliability=s.reliability??null,r.predictionStatus=s.status||null,r.hoursRemaining=s.hours_remaining??null):i.includes("_predicted_empty")?r.predictedEmpty="unknown"!==a.state&&"unavailable"!==a.state?a.state:null:i.includes("_battery_low")?(r.isLow="on"===a.state,r.threshold=s.threshold):i.includes("_stale")&&(r.isStale="on"===a.state)}const i=this._settingsValues.low_threshold??20,a=Date.now();let s=!1;for(const e of t.values()){if(null!==e.level){const t=e.threshold??i;e.isLow=e.level<=t}const t=null!==e.level?Math.ceil(e.level):null,n=this._prevLevels.get(e.sourceEntity);void 0!==n&&null!==t&&t!==n&&(this._recentlyChanged.set(e.sourceEntity,{ts:a,dir:t>n?"up":"down"}),s=!0),null!==t&&this._prevLevels.set(e.sourceEntity,t)}s&&(this._flashGeneration=(this._flashGeneration||0)+1),this._recentlyChanged.size>0&&!this._flashCleanupTimer&&(this._flashCleanupTimer=setTimeout(()=>{this._flashCleanupTimer=null,this._recentlyChanged.clear(),this._flashGeneration=(this._flashGeneration||0)+1},3e3));for(const e of t.values())e._searchText=[e.name,e.sourceEntity,e.batteryType,e.manufacturer,e.model,e.platform].filter(Boolean).join(" ").toLowerCase(),e._status=null===e.level?"unavailable":e.isStale?"stale":e.isLow?"low":"active";this._entityList=[...t.values()];const n=this._recentlyChanged.size>0?[...this._recentlyChanged.keys()].join(","):"";this._entityHash=this._entityList.map(e=>`${e.sourceEntity}:${e.level}:${e.isLow}:${e.isStale}:${e.stability}:${e.replacementPending}:${e.batteryType}`).join("|")+"|!"+n}_getFilteredEntities(){let e=this._entities;const t=this._filters.status?.value;return t?.length&&(e=e.filter(e=>t.includes(e._status))),e}_getDevice(e){return this._entityMap.get(e)}_formatLevel(e){const t=this._displayLevel(e);return null!==t?t+"%":"—"}_wsErrorMessage(e,t){return e?.message?.includes("unknown command")?`Restart Home Assistant to enable ${t}`:`${t} failed`}_getBatteryIcon(e){if(e.isRechargeable)return null===e.level?"mdi:battery-unknown":e.level<=10?"mdi:battery-charging-10":e.level<=30?"mdi:battery-charging-30":e.level<=60?"mdi:battery-charging-60":e.level<=90?"mdi:battery-charging-90":"mdi:battery-charging-100";const t=e.level;return null===t?"mdi:battery-unknown":t<=5?"mdi:battery-outline":t<=15?"mdi:battery-10":t<=25?"mdi:battery-20":t<=35?"mdi:battery-30":t<=45?"mdi:battery-40":t<=55?"mdi:battery-50":t<=65?"mdi:battery-60":t<=75?"mdi:battery-70":t<=85?"mdi:battery-80":t<=95?"mdi:battery-90":"mdi:battery"}_getLevelColor(e,t){if(null===e)return"var(--disabled-text-color)";const i=t??this._settingsValues.low_threshold??20;return e<=i/2?"var(--error-color, #db4437)":e<=1.25*i?"var(--warning-color, #ffa726)":"var(--success-color, #43a047)"}_displayLevel(e){return null===e?null:Math.ceil(e)}_isActivelyCharging(e){return e.isRechargeable&&("charging"===e.chargingState||"charging"===e.predictionStatus)}_isFastDischarge(e){return null!==e.dischargeRateHour&&e.dischargeRateHour>=1}_predictionReason(e){const t=e.predictionStatus;if(!t||"normal"===t)return null;return{charging:"Charging",flat:"Flat",noisy:"Noisy data",insufficient_data:"Not enough data",single_level:"Single level",insufficient_range:"Tiny range"}[t]||null}_predictionReasonDetail(e){return{charging:"This battery is currently charging, so no discharge prediction is generated. Once it starts discharging again, a new prediction will be calculated.",flat:"The battery level has been essentially flat — no significant discharge detected. This is normal for devices with very slow drain. A prediction will appear once enough change is observed.",noisy:"The battery data is too irregular to fit a reliable trend line. This can happen with sensors that report inconsistent values. The prediction will improve as more stable readings accumulate.",insufficient_data:"There are not enough data points or the observation period is too short to calculate a prediction. Juice Patrol needs at least 3 readings spanning 24 hours.",single_level:"All recorded readings have the same battery level. This typically means the sensor reports a fixed value or hasn't changed since discovery.",insufficient_range:"The battery level has barely changed — the total variation is within one reporting step. More drain needs to occur before a trend can be detected."}[e]||null}_formatRate(e){return this._isFastDischarge(e)?null!==e.dischargeRateHour?e.dischargeRateHour+"%/h":"—":null!==e.dischargeRate?e.dischargeRate+"%/d":"—"}_formatTimeRemaining(e){return this._isFastDischarge(e)&&null!==e.hoursRemaining?e.hoursRemaining<1?Math.round(60*e.hoursRemaining)+"m":e.hoursRemaining+"h":null!==e.daysRemaining?e.daysRemaining+"d":"—"}_formatDate(e,t=!1){if(!e)return"—";try{const i=new Date(e);if(t){const e=new Date,t=i.getFullYear()===e.getFullYear()?{month:"short",day:"numeric"}:{month:"short",day:"numeric",year:"numeric"};return i.toLocaleDateString(void 0,t)+" "+i.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}return i.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})}catch{return"—"}}_parseBatteryType(e){if(!e)return{count:0,type:""};const t=e.match(/^(\d+)\s*[×x]\s*(.+)$/i);return t?{count:parseInt(t[1]),type:t[2].trim()}:{count:1,type:e.trim()}}_formatBatteryType(e,t){return e?t>1?`${t}× ${e}`:e:""}_erraticTooltip(e){const t=[],i=this._displayLevel(e.level),a=this._displayLevel(e.meanLevel);return null!==a&&null!==i&&i>a+3&&!e.isRechargeable?t.push(`Level is rising (${i}%) without a charge state — not expected for a non-rechargeable battery`):null!==a&&null!==i&&Math.abs(i-a)>5&&t.push(`Current level (${i}%) differs significantly from 7-day average (${a}%)`),null!==e.stabilityCv&&e.stabilityCv>.05&&t.push(`High reading variance (CV: ${(100*e.stabilityCv).toFixed(1)}%)`),0===t.length&&t.push("Battery readings show non-monotonic or inconsistent behavior"),t.join(". ")}_showToast(e){this.dispatchEvent(new CustomEvent("hass-notification",{bubbles:!0,composed:!0,detail:{message:e}}))}_applyDeepLinkHighlight(){this._highlightEntity&&!this._highlightApplied&&(this._highlightApplied=!0,this._openDetail(this._highlightEntity))}async _loadConfig(){if(this._hass)try{const e=await this._hass.callWS({type:"juice_patrol/get_settings"});this._configEntry={entry_id:e.entry_id},this._settingsValues={low_threshold:e.low_threshold,stale_timeout:e.stale_timeout,prediction_horizon:e.prediction_horizon},this._invalidateColumns()}catch(e){console.error("Juice Patrol: failed to load config",e)}}async _saveSettings(){if(this._hass)try{const e=await this._hass.callWS({type:"juice_patrol/update_settings",low_threshold:parseInt(this._settingsValues.low_threshold),stale_timeout:parseInt(this._settingsValues.stale_timeout),prediction_horizon:parseInt(this._settingsValues.prediction_horizon)});this._settingsDirty=!1,this._settingsValues={low_threshold:e.low_threshold,stale_timeout:e.stale_timeout,prediction_horizon:e.prediction_horizon},this._settingsOpen=!1,this._showToast("Settings saved")}catch(e){console.error("Juice Patrol: failed to save settings",e),this._showToast("Failed to save settings")}}async _markReplaced(e){const t=this._getDevice(e);t?.isRechargeable?this._showReplaceRechargeableDialog(e):this._showReplaceDialog(e)}async _doMarkReplaced(e,t){try{const i={type:"juice_patrol/mark_replaced",entity_id:e};null!=t&&(i.timestamp=t),await this._hass.callWS(i),this._showToast("Battery marked as replaced"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to mark as replaced")}}_showReplaceRechargeableDialog(e){this._showReplaceDialogImpl(e,{title:"Replace rechargeable battery?",preamble:'\n        <p style="margin-top:0">This device is marked as <strong>rechargeable</strong>, which means\n        Juice Patrol expects its battery level to gradually rise and fall as it\n        charges and discharges. Charging is detected automatically — you don\'t\n        need to do anything when you plug it in.</p>\n        <p><strong>"Mark as replaced"</strong> is for when you physically swap the\n        battery pack itself (e.g. a worn-out cell that no longer holds charge).</p>\n        <p>If you just recharged the device, you can ignore this — Juice Patrol\n        already handles that.</p>'})}_showReplaceDialog(e){this._showReplaceDialogImpl(e,{title:"Mark battery as replaced?",preamble:'\n        <p style="margin-top:0">This tells Juice Patrol that you swapped the batteries.\n        A replacement marker will be added to the timeline. All history is preserved\n        for life expectancy tracking.</p>\n        <p style="color:var(--secondary-text-color); font-size:0.9em; margin-bottom:0">\n        This can be undone later if needed.</p>'})}_showReplaceDialogImpl(e,{title:t,preamble:i}){const a=document.createElement("ha-dialog");a.open=!0,a.headerTitle=t,this.shadowRoot.appendChild(a);const s=()=>{a.open=!1,a.remove()},n=document.createElement("div");n.innerHTML=`\n      ${i}\n      <ha-expansion-panel outlined style="margin: 8px 0">\n        <span slot="header">Advanced: set custom date</span>\n        <div style="padding: 8px 0">\n          <p style="margin-top:0; color:var(--secondary-text-color); font-size:0.9em">\n            Register a past battery replacement by selecting the date and time it occurred.</p>\n          <input type="datetime-local" class="jp-datetime-input"\n            style="width:100%; padding:8px; border:1px solid var(--divider-color, #ddd);\n                   border-radius:4px; background:var(--card-background-color, #fff);\n                   color:var(--primary-text-color); font-size:14px; box-sizing:border-box" />\n        </div>\n      </ha-expansion-panel>\n      <div class="jp-dialog-actions">\n        <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>\n        <ha-button class="jp-dialog-confirm">Mark as replaced</ha-button>\n      </div>\n    `,a.appendChild(n),n.querySelector(".jp-dialog-cancel").addEventListener("click",s),n.querySelector(".jp-dialog-confirm").addEventListener("click",()=>{const t=n.querySelector(".jp-datetime-input");let i;t&&t.value&&(i=new Date(t.value).getTime()/1e3),s(),this._doMarkReplaced(e,i)})}_showConfirmDialog({title:e,bodyHtml:t,onConfirm:i,confirmLabel:a,confirmVariant:s}){const n=document.createElement("ha-dialog");n.open=!0,n.headerTitle=e,this.shadowRoot.appendChild(n);const r=()=>{n.open=!1,n.remove()},o=document.createElement("div");o.innerHTML=`\n      ${t}\n      <div class="jp-dialog-actions">\n        <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>\n        <ha-button class="jp-dialog-confirm" ${s?`variant="${s}"`:""}>${a||"Confirm"}</ha-button>\n      </div>\n    `,n.appendChild(o),o.querySelector(".jp-dialog-cancel").addEventListener("click",r),o.querySelector(".jp-dialog-confirm").addEventListener("click",()=>{r(),i()})}_undoReplacement(e){this._showConfirmDialog({title:"Undo battery replacement?",bodyHtml:'\n        <p style="margin-top:0">This will remove the most recent replacement marker\n        from the timeline. Battery history is never deleted.</p>\n        <p style="color:var(--secondary-text-color); font-size:0.9em; margin-bottom:0">\n        You can always re-add it later if needed.</p>',confirmLabel:"Undo replacement",confirmVariant:"danger",onConfirm:()=>this._doUndoReplacement(e)})}async _doUndoReplacement(e){try{await this._hass.callWS({type:"juice_patrol/undo_replacement",entity_id:e}),this._showToast("Replacement undone"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to undo replacement")}}async _confirmReplacement(e){try{await this._hass.callWS({type:"juice_patrol/confirm_replacement",entity_id:e}),this._showToast("Replacement confirmed")}catch(e){this._showToast("Failed to confirm")}}async _confirmSuspectedReplacement(e,t){try{await this._hass.callWS({type:"juice_patrol/mark_replaced",entity_id:e,timestamp:t}),this._showToast("Replacement confirmed"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to confirm replacement")}}async _denySuspectedReplacement(e,t){try{await this._hass.callWS({type:"juice_patrol/deny_replacement",entity_id:e,timestamp:t}),this._showToast("Suggestion dismissed"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to dismiss suggestion")}}async _recalculate(e){try{await this._hass.callWS({type:"juice_patrol/recalculate",entity_id:e}),this._showToast("Prediction recalculated")}catch(e){this._showToast(this._wsErrorMessage(e,"recalculation"))}}async _refresh(){if(!this._refreshing){this._refreshing=!0;try{await this._hass.callWS({type:"juice_patrol/refresh"}),this._showToast("Predictions refreshed")}catch(e){this._showToast("Refresh failed")}this._refreshTimer=setTimeout(()=>{this._refreshTimer=null,this._refreshing=!1},2e3)}}async _loadIgnored(){if(this._hass)try{const e=await this._hass.callWS({type:"juice_patrol/get_ignored"});this._ignoredEntities=e.devices}catch(e){console.error("Juice Patrol: failed to load ignored devices",e)}}async _ignoreDevice(e){if(this._hass)try{await this._hass.callWS({type:"juice_patrol/set_ignored",entity_id:e,ignored:!0}),this._showToast("Device ignored"),this._loadIgnored()}catch(e){this._showToast("Failed to ignore device")}}async _unignoreDevice(e){if(this._hass)try{await this._hass.callWS({type:"juice_patrol/set_ignored",entity_id:e,ignored:!1}),this._showToast("Device restored"),this._loadIgnored()}catch(e){this._showToast("Failed to unignore device")}}async _loadShoppingList(){if(this._hass){this._shoppingLoading=!0;try{this._shoppingData=await this._hass.callWS({type:"juice_patrol/get_shopping_list"})}catch(e){console.error("Juice Patrol: failed to load shopping list",e),this._shoppingData=null}this._shoppingLoading=!1}}async _loadChartData(e){if(this._hass&&!this._chartLoading){this._chartLoading=!0;try{const t=await this._hass.callWS({type:"juice_patrol/get_entity_chart",entity_id:e});this._chartLastLevel=t?.level??null,this._chartData=t,this._chartStale=!1}catch(e){console.error("Juice Patrol: failed to load chart data",e),this._showToast(this._wsErrorMessage(e,"chart view"))}this._chartLoading=!1}}async _saveBatteryType(e,t){try{await this._hass.callWS({type:"juice_patrol/set_battery_type",entity_id:e,battery_type:t}),this._showToast(t?`Battery type set to ${t}`:"Battery type cleared")}catch(e){this._showToast("Failed to set battery type")}}_openDetail(e){this._closeOverlays(),this._detailEntity=e,this._activeView="detail",this._chartData=null,this._chartStale=!1,this._chartLastLevel=null,this._chartRange="auto";const t=`${this._basePath}/detail/${encodeURIComponent(e)}`;history.pushState({jpDetail:e},"",t),this._loadChartData(e)}_closeDetail(){"detail"===this._activeView&&history.back()}_toggleSettings(){this._settingsOpen=!this._settingsOpen,this._settingsOpen&&(this._settingsDirty=!1,this._loadConfig())}_handleSettingInput(e){const t=e.target.dataset.key;this._settingsValues={...this._settingsValues,[t]:e.target.value},this._settingsDirty=!0}_cancelSettings(){this._settingsOpen=!1,this._settingsDirty=!1}_handleMenuSelect(e,t){const i=e.detail?.item?.value;if(!i||!t)return;const a=this._getDevice(t);"detail"===i?this._openDetail(t):"confirm"===i?this._confirmReplacement(t):"replace"===i?this._markReplaced(t):"recalculate"===i?this._recalculate(t):"type"===i?this._setBatteryType(t,a?.batteryType):"undo-replace"===i?this._undoReplacement(t):"ignore"===i&&this._ignoreDevice(t)}_closeOverlays(){this.shadowRoot.querySelectorAll("ha-dialog").forEach(e=>{e.open=!1,e.remove()})}_handleRowClick(e){const t=e.detail?.id;t&&this._openDetail(t)}_setBatteryType(e,t){this._closeOverlays();const i=this._getDevice(e),a=t||i?.batteryType||"",s=this._parseBatteryType(a),n=["CR2032","CR2450","CR123A","AA","AAA","Li-ion","Built-in"];let r=[],o=null;if(a&&n.includes(s.type)){for(let e=0;e<s.count;e++)r.push(s.type);o=s.type}let l=i?.isRechargeable||!1,c=!1;const d=document.createElement("ha-dialog");d.open=!0,d.headerTitle="Set battery type",this.shadowRoot.appendChild(d);const h=()=>{d.open=!1,d.remove()},p=e=>{if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML},u=document.createElement("div");d.appendChild(u);const g=()=>{const t=r.length>0?r.map((e,t)=>`<span class="jp-badge-chip" data-idx="${t}" title="Click to remove">${p(e)} ✕</span>`).join(""):'<span class="jp-badge-placeholder">Click a battery type below, or type a custom value</span>';u.innerHTML=`\n        <div class="jp-dialog-desc">${p(i?.name||e)}</div>\n        <div class="jp-badge-field">${t}</div>\n        <div class="jp-dialog-presets">\n          ${n.map(e=>{const t=null!==o&&e!==o;return`<button class="jp-preset${t?" disabled":""}${e===o?" active":""}"\n              data-type="${e}" ${t?"disabled":""}>${e}</button>`}).join("")}\n        </div>\n        <div class="jp-dialog-or">or type a custom value:</div>\n        <input type="text" class="jp-dialog-input" placeholder="e.g. 18650, LR44, custom..."\n               value="${0!==r.length||n.includes(s.type)?"":p(a)}">\n        <ha-button class="jp-autodetect" style="margin-top:8px;width:100%">\n          <ha-icon slot="start" icon="mdi:auto-fix"></ha-icon>\n          Autodetect\n        </ha-button>\n        <label class="jp-rechargeable-toggle">\n          <input type="checkbox" class="jp-rechargeable-cb" ${l?"checked":""}>\n          <ha-icon icon="mdi:power-plug-battery" style="--mdc-icon-size:16px"></ha-icon>\n          Rechargeable battery\n        </label>\n        <div class="jp-dialog-actions">\n          <ha-button variant="neutral" class="jp-dialog-clear">Clear</ha-button>\n          <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>\n          <ha-button class="jp-dialog-save">Save</ha-button>\n        </div>\n      `,m()},m=()=>{u.querySelectorAll(".jp-badge-chip").forEach(e=>{e.addEventListener("click",()=>{r.splice(parseInt(e.dataset.idx),1),0===r.length&&(o=null),g()})}),u.querySelectorAll(".jp-preset:not([disabled])").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.type;o=t,r.push(t);const i=u.querySelector(".jp-dialog-input");i&&(i.value=""),g()})}),u.querySelector(".jp-autodetect")?.addEventListener("click",async()=>{const t=u.querySelector(".jp-autodetect");t&&(t.disabled=!0,t.textContent="Detecting...");try{const i=await this._hass.callWS({type:"juice_patrol/detect_battery_type",entity_id:e});if(i.battery_type){const e=this._parseBatteryType(i.battery_type);if(r=[],o=null,n.includes(e.type)){for(let t=0;t<e.count;t++)r.push(e.type);o=e.type}if(g(),!n.includes(e.type)){const e=u.querySelector(".jp-dialog-input");e&&(e.value=i.battery_type)}this._showToast(`Detected: ${i.battery_type} (${i.source})`)}else this._showToast("Could not auto-detect battery type"),t&&(t.disabled=!1,t.textContent="Autodetect")}catch(e){console.warn("Juice Patrol: auto-detect failed",e),this._showToast(this._wsErrorMessage(e,"auto-detection")),t&&(t.disabled=!1,t.innerHTML='<ha-icon icon="mdi:auto-fix" style="--mdc-icon-size:16px;vertical-align:middle;margin-right:4px"></ha-icon> Autodetect')}}),u.querySelector(".jp-rechargeable-cb")?.addEventListener("change",e=>{l=e.target.checked,c=!0}),d.addEventListener("closed",h),u.querySelector(".jp-dialog-cancel")?.addEventListener("click",h),u.querySelector(".jp-dialog-clear")?.addEventListener("click",()=>{r=[],o=null;const e=u.querySelector(".jp-dialog-input");e&&(e.value=""),g()}),u.querySelector(".jp-dialog-save")?.addEventListener("click",async()=>{let t;const i=u.querySelector(".jp-dialog-input"),s=i?.value?.trim();t=r.length>0?this._formatBatteryType(o,r.length):s||null,h();const n=t!==(a||null);if(c)try{await this._hass.callWS({type:"juice_patrol/set_rechargeable",entity_id:e,is_rechargeable:l})}catch(e){this._showToast("Failed to update rechargeable state")}n&&await this._saveBatteryType(e,t)});const t=u.querySelector(".jp-dialog-input");t?.addEventListener("keydown",e=>{"Enter"===e.key&&u.querySelector(".jp-dialog-save")?.click(),"Escape"===e.key&&h()})};g()}_resolveColor(e,t){return getComputedStyle(this).getPropertyValue(e).trim()||t}async _initChart(e){const t=this.shadowRoot.getElementById("jp-chart");if(!t||!e||!e.readings||0===e.readings.length)return;if(!customElements.get("ha-chart-base"))try{await(window.loadCardHelpers?.()),await new Promise(e=>setTimeout(e,100))}catch(e){console.warn("Juice Patrol: loadCardHelpers failed",e)}if(!customElements.get("ha-chart-base"))return void(t.innerHTML='<div class="empty-state">Chart component not available</div>');const i=this._resolveColor("--primary-color","#03a9f4"),a=this._resolveColor("--warning-color","#ffa726"),s=this._resolveColor("--error-color","#db4437"),n=this._resolveColor("--success-color","#4caf50");this._resolveColor("--secondary-text-color","#999");const r=this._resolveColor("--secondary-text-color","#999"),o=this._resolveColor("--divider-color","rgba(0,0,0,0.12)"),l=this._resolveColor("--ha-card-background",this._resolveColor("--card-background-color","#fff")),c=this._resolveColor("--primary-text-color","#212121"),d=this._resolveColor("--primary-text-color","#212121"),h=e.readings,p=e.all_readings||h,u=e.prediction,g=e.threshold,m=u.t0??e.first_reading_timestamp,_=p.map(e=>[1e3*e.t,e.v]),y=e.charge_prediction,v="charging"===e.charging_state?.toLowerCase()||"charging"===e.prediction?.status,b=y&&y.estimated_full_timestamp,f=[];if(null!=u.slope_per_day&&null!=u.intercept&&null!=m){const e=e=>{const t=(e-m)/86400;return u.slope_per_day*t+u.intercept},t=h[0].t,i=Date.now()/1e3,a=v?i:u.estimated_empty_timestamp?Math.min(u.estimated_empty_timestamp,i+31536e3):i+2592e3;for(const s of[t,i,...v?[]:[a]])f.push([1e3*s,Math.max(0,Math.min(100,e(s)))])}const $=_[0]?.[0]||Date.now(),x=Date.now();let w;if(v&&y&&null!=y.segment_start_timestamp){const t=y.segment_start_level,i=e.level,a=b?y.slope_per_hour:i>t&&x/1e3-y.segment_start_timestamp>0?(i-t)/((x/1e3-y.segment_start_timestamp)/3600):0;if(a>0){const e=b?1e3*y.estimated_full_timestamp:x+(100-i)/a*36e5;w=e+.1*(e-$)}else w=x+.2*(x-$)}else w=v?x+.2*(x-$):f.length?f[f.length-1][0]:_[_.length-1]?.[0]||x;const S={"1d":864e5,"1w":6048e5,"1m":2592e6,"3m":7776e6,"6m":15552e6,"1y":31536e6};let C,E;const A=this._chartRange||"auto";if("auto"===A)C=$,E=w;else if("all"===A){const e=p.length?1e3*p[0].t:$,t=u.estimated_empty_timestamp?1e3*u.estimated_empty_timestamp:null,i=f.length?f[f.length-1][0]:x;C=Math.min(e,$),E=Math.max(i,t||0,w)}else{const e=S[A]||2592e6;C=x-e;const t=f.length?f[f.length-1][0]:x;E=Math.max(x+e,t)}const L=[{name:"Battery Level",type:"line",data:_,smooth:!1,symbol:_.length>50?"none":"circle",symbolSize:4,lineStyle:{width:2,color:i},itemStyle:{color:i},areaStyle:{color:i,opacity:.07}}];if(f.length>0&&L.push({name:"Discharge prediction",type:"line",data:f,smooth:!1,symbol:"none",lineStyle:{width:2,type:"dashed",color:a},itemStyle:{color:a}}),v&&y&&null!=y.segment_start_timestamp){const t=y.segment_start_timestamp,i=y.segment_start_level,a=Date.now()/1e3,s=e.level;let r=b?y.slope_per_hour:null;if((null==r||r<=0)&&s>i){const e=(a-t)/3600;e>0&&(r=(s-i)/e)}if(r>0){const e=(100-s)/r,o=b?y.estimated_full_timestamp:a+3600*e,l=e=>r*((e-t)/3600)+i,c=[t,a,o].map(e=>[1e3*e,Math.max(0,Math.min(100,l(e)))]);L.push({name:"Charge prediction",type:"line",data:c,smooth:!1,symbol:"none",lineStyle:{width:2,type:"dashed",color:n},itemStyle:{color:n}})}}const k=(e,t)=>({show:!0,formatter:e,position:"left",fontSize:10,color:t,distance:6,backgroundColor:"rgba(0,0,0,0.6)",borderRadius:3,padding:[3,6]});let R=null;if(null!=u.slope_per_day&&u.slope_per_day<0&&null!=u.intercept&&null!=m&&!v){const e=m+(g-u.intercept)/u.slope_per_day*86400;1e3*e>Date.now()&&(R=1e3*e)}if(f.length>0&&null!=u.slope_per_day&&null!=u.intercept&&null!=m){const e=e=>{const t=(e/1e3-m)/86400;return u.slope_per_day*t+u.intercept},t=u.estimated_empty_timestamp?1e3*u.estimated_empty_timestamp:null,i=f[f.length-1][0];R&&R>i-1&&R<(t||1/0)&&f.push([R,Math.max(0,Math.min(100,e(R)))]),t&&t>i+1&&f.push([t,Math.max(0,e(t))])}const D=_[0]?.[0]||C,T=Math.max(f.length?f[f.length-1][0]:E,R||0,E);if(L.push({name:"Threshold",type:"line",data:[[D,g],[T,g]],symbol:"none",lineStyle:{width:1,type:"dotted",color:s},itemStyle:{color:s}}),R){const e=new Date(R),t=(R-Date.now())/36e5<=48?e.toLocaleString(void 0,{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}):e.toLocaleDateString(void 0,{day:"numeric",month:"short",year:"numeric"});L.push({name:"Low battery",type:"line",data:[{value:[R,0],symbol:"none",symbolSize:0},{value:[R,g],symbol:"diamond",symbolSize:6,label:k(`Low ${t}`,s)}],lineStyle:{width:1,type:"dotted",color:s},itemStyle:{color:s},tooltip:{show:!1}})}const j=e.replacement_history||[];if(j.length>0){const e=this._resolveColor("--success-color","#4caf50");for(let t=0;t<j.length;t++){const i=1e3*j[t],a=new Date(i).toLocaleDateString(void 0,{day:"numeric",month:"short"});L.push({name:0===t?"Replaced":`Replaced ${t+1}`,type:"line",data:[{value:[i,0],symbol:"none",symbolSize:0},{value:[i,100],symbol:"diamond",symbolSize:6,label:k(`Replaced ${a}`,e)}],lineStyle:{width:1,type:"dashed",color:e},itemStyle:{color:e},tooltip:{show:!1}})}}const z=e.suspected_replacements||[];if(z.length>0){const e=this._resolveColor("--warning-color","#ff9800");for(let t=0;t<z.length;t++){const i=1e3*z[t].timestamp,a=new Date(i).toLocaleDateString(void 0,{day:"numeric",month:"short"});L.push({name:0===t?"Suspected":`Suspected ${t+1}`,type:"line",data:[{value:[i,0],symbol:"none",symbolSize:0},{value:[i,100],symbol:"diamond",symbolSize:6,label:k(`Replaced? ${a}`,e)}],lineStyle:{width:1,type:"dotted",color:e},itemStyle:{color:e},tooltip:{show:!1}})}}const M=t.clientWidth<500,H={xAxis:{type:"time",axisLabel:{color:r,fontSize:M?10:12},axisLine:{lineStyle:{color:o}},splitLine:{lineStyle:{color:o}}},yAxis:{type:"value",min:0,max:100,axisLabel:{formatter:"{value}%",color:r},axisLine:{lineStyle:{color:o}},splitLine:{lineStyle:{color:o}}},tooltip:{trigger:"axis",backgroundColor:l,borderColor:o,textStyle:{color:c},formatter:e=>{if(!e||0===e.length)return"";const t=new Date(e[0].value[0]);let i=`<b>${t.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})+" "+t.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}</b><br>`;for(const t of e){if(t.seriesName?.startsWith("Replaced")||"Low battery"===t.seriesName)continue;const e="number"==typeof t.value[1]?t.value[1].toFixed(1)+"%":"—";i+=`${t.marker} ${t.seriesName}: ${e}<br>`}return i}},legend:{show:!0,bottom:0,data:L.filter(e=>!e.name?.startsWith("Replaced")&&"Low battery"!==e.name).map(e=>e.name).filter((e,t,i)=>i.indexOf(e)===t),textStyle:{color:d,fontSize:M?10:11},itemWidth:M?12:16,itemHeight:M?8:10,itemGap:M?6:8,padding:[4,0,0,0],selected:{"Discharge prediction":!v,"Charge prediction":v}},dataZoom:[{type:"slider",xAxisIndex:0,filterMode:"none",startValue:C,endValue:E,bottom:M?30:24,height:M?18:22,borderColor:o,fillerColor:"rgba(100,150,200,0.15)",handleStyle:{color:i},dataBackground:{lineStyle:{color:i,opacity:.3},areaStyle:{color:i,opacity:.05}},textStyle:{color:r,fontSize:10}},{type:"inside",xAxisIndex:0,filterMode:"none"}],grid:{left:M?40:50,right:M?10:20,top:20,bottom:M?82:72,containLabel:!1}};let P=this._chartEl;P&&t.contains(P)||(P=document.createElement("ha-chart-base"),t.innerHTML="",t.appendChild(P),this._chartEl=P),P.hass=this._hass,requestAnimationFrame(()=>{P.data=L,P.options=H})}get _tabs(){const e=this._basePath;return[{path:`${e}/devices`,name:"Devices",iconPath:"M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z"},{path:`${e}/shopping`,name:"Shopping List",iconPath:"M17,18A2,2 0 0,1 19,20A2,2 0 0,1 17,22C15.89,22 15,21.1 15,20C15,18.89 15.89,18 17,18M1,2H4.27L5.21,4H20A1,1 0 0,1 21,5C21,5.17 20.95,5.34 20.88,5.5L17.3,11.97C16.96,12.58 16.3,13 15.55,13H8.1L7.2,14.63L7.17,14.75A0.25,0.25 0 0,0 7.42,15H19V17H7C5.89,17 5,16.1 5,15C5,14.65 5.09,14.32 5.24,14.04L6.6,11.59L3,4H1V2M7,18A2,2 0 0,1 9,20A2,2 0 0,1 7,22C5.89,22 5,21.1 5,20C5,18.89 5.89,18 7,18M16,11L18.78,6H6.14L8.5,11H16Z"}]}get _route(){return{path:`/${"detail"===this._activeView?"devices":this._activeView}`,prefix:this._basePath}}_renderToolbarIcons(){return N`
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
    `}get _activeFilterCount(){return Object.values(this._filters).filter(e=>Array.isArray(e.value)?e.value.length:e.value).length}render(){if(!this._hass)return N`<div class="loading">Loading...</div>`;if("devices"===this._activeView)return this._renderDevicesView();const e="detail"===this._activeView;return N`
      <hass-tabs-subpage
        .hass=${this._hass}
        .narrow=${this.narrow}
        .tabs=${this._tabs}
        .route=${this._route}
        ?main-page=${!e}
        .backCallback=${e?()=>this._closeDetail():void 0}
      >
        ${this._renderToolbarIcons()}
        ${e?N`<div id="jp-content">${this._renderDetailView()}</div>`:N`<div class="jp-padded">${this._renderShoppingList()}</div>`}
      </hass-tabs-subpage>
    `}_renderDevicesView(){const e=this._getFilteredEntities();return N`
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
        .initialSorting=${{column:"level",direction:"asc"}}
        has-filters
        .filters=${this._activeFilterCount}
        @row-click=${this._handleRowClick}
        @clear-filter=${this._clearFilters}
      >
        ${this._renderToolbarIcons()}
        ${this._renderFilterPane()}
      </hass-tabs-subpage-data-table>
    `}_renderFilterPane(){const e=this._filters.status?.value||[];return N`
      <ha-expansion-panel slot="filter-pane" outlined expanded header="Status">
        <ha-icon slot="leading-icon" icon="mdi:list-status" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-filter-list">
          ${[{value:"active",label:"Active",icon:"mdi:check-circle"},{value:"low",label:"Low battery",icon:"mdi:battery-alert"},{value:"stale",label:"Stale",icon:"mdi:clock-alert-outline"},{value:"unavailable",label:"Unavailable",icon:"mdi:help-circle-outline"}].map(t=>N`
            <label class="jp-filter-item">
              <ha-checkbox
                .checked=${e.includes(t.value)}
                @change=${e=>this._toggleStatusFilter(t.value,e.target.checked)}
              ></ha-checkbox>
              <ha-icon icon=${t.icon} style="--mdc-icon-size:18px"></ha-icon>
              <span>${t.label}</span>
            </label>
          `)}
        </div>
      </ha-expansion-panel>
    `}_toggleStatusFilter(e,t){const i=this._filters.status?.value||[],a=t?[...i,e]:i.filter(t=>t!==e);this._filters={...this._filters,status:{value:a}}}_clearFilters(){this._filters={}}_renderSettings(){const e=this._settingsValues;return N`
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
    `}_renderSettingRow(e,t,i,a,s,n,r){return N`
      <ha-settings-row>
        <span slot="heading">${e}</span>
        <span slot="description">${t}</span>
        <ha-textfield
          type="number"
          .min=${String(s)}
          .max=${String(n)}
          data-key=${i}
          .value=${String(a)}
          .suffix=${r}
          style="width: 90px"
          @input=${this._handleSettingInput}
        ></ha-textfield>
      </ha-settings-row>
    `}get _columns(){return this._cachedColumns||(this._cachedColumns={icon:{title:"",type:"icon",moveable:!1,showNarrow:!0,template:e=>N`
          <ha-icon
            icon=${this._getBatteryIcon(e)}
            style="color:${this._getLevelColor(e.level,e.threshold)}"
          ></ha-icon>
        `},name:{title:"Device",main:!0,sortable:!0,filterable:!0,filterKey:"_searchText",direction:"asc",flex:3,showNarrow:!0,template:e=>{const t=this._getBadgeLabels(e),i=this._getDeviceSubText(e);return N`
            <div style="overflow:hidden">
              <span>${e.name||e.sourceEntity}</span>
              ${i?N`<div style=${"font-size:11px;color:var(--secondary-text-color);opacity:0.7;margin-top:1px"}>${i}</div>`:I}
              ${t.length?N`<div style=${"display:flex;flex-wrap:wrap;gap:4px;margin-top:4px"}>${t.map(e=>this._renderBadgeLabel(e))}</div>`:I}
            </div>
          `}},level:{title:"Level",sortable:!0,type:"numeric",minWidth:"70px",maxWidth:"90px",showNarrow:!0,template:e=>{const t=this._getLevelColor(e.level,e.threshold);return N`<span style="color:${t};font-weight:500">${this._formatLevel(e.level)}</span>`}},batteryType:{title:"Type",sortable:!0,minWidth:"60px",maxWidth:"90px",template:e=>N`<span
          style="font-size:12px;color:var(--secondary-text-color)"
          title=${e.batteryTypeSource?`Source: ${e.batteryTypeSource}`:""}
        >${e.batteryType||"—"}</span>`},dischargeRate:{title:"Rate",sortable:!0,type:"numeric",minWidth:"70px",maxWidth:"100px",template:e=>N`<span style=${le}>${this._formatRate(e)}</span>`},daysRemaining:{title:"Left",sortable:!0,type:"numeric",minWidth:"55px",maxWidth:"80px",template:e=>N`<span style=${le}>${this._formatTimeRemaining(e)}</span>`},reliability:{title:"Rel",sortable:!0,type:"numeric",minWidth:"45px",maxWidth:"60px",template:e=>this._renderReliabilityBadge(e)},predictedEmpty:{title:"Empty by",sortable:!0,minWidth:"80px",maxWidth:"110px",template:e=>N`<span style=${le}>${e.predictedEmpty?this._formatDate(e.predictedEmpty,this._isFastDischarge(e)):"—"}</span>`},actions:{title:"",type:"overflow-menu",showNarrow:!0,template:e=>N`
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
        `}}),this._cachedColumns}_invalidateColumns(){this._cachedColumns=null}_getBadgeLabels(e){const t=[];if(e.replacementPending&&t.push({label_id:"replaced",name:e.isRechargeable?"RECHARGED?":"REPLACED?",color:"#FF9800",description:e.isRechargeable?"Battery level jumped significantly — normal recharge cycle?":"Battery level jumped significantly — was the battery replaced?"}),e.isLow){const i=e.threshold??this._settingsValues.low_threshold??20;t.push({label_id:"low",name:"LOW",color:"#F44336",description:`Battery is at ${this._displayLevel(e.level)}%, below the ${i}% threshold`})}e.isStale&&t.push({label_id:"stale",name:"STALE",color:"#FF9800",description:"No battery reading received within the stale timeout period"}),"cliff"===e.anomaly?t.push({label_id:"cliff",name:"CLIFF DROP",color:"#F44336",description:`Sudden drop of ${e.dropSize??"?"}% in a single reading interval`}):"rapid"===e.anomaly&&t.push({label_id:"rapid",name:"RAPID",color:"#F44336",description:`Discharge rate significantly higher than average — ${e.dropSize??"?"}% drop`}),"erratic"===e.stability&&t.push({label_id:"erratic",name:"ERRATIC",color:"#9C27B0",description:this._erraticTooltip(e)});const i=e.isRechargeable?new Set(["flat","charging"]):new Set;if(e.predictedEmpty||!this._predictionReason(e)||i.has(e.predictionStatus)||t.push({label_id:"no-pred",name:`No prediction: ${this._predictionReason(e)}`,color:"#9E9E9E",description:this._predictionReasonDetail(e.predictionStatus)||""}),e.isRechargeable&&(this._isActivelyCharging(e)?t.push({label_id:"charging",name:"Charging",icon:"mdi:battery-charging",color:"#4CAF50",description:"Currently charging"}):t.push({label_id:"rechargeable",name:"Rechargeable",icon:"mdi:power-plug-battery",color:"#4CAF50",description:`Rechargeable: ${e.rechargeableReason||"detected"}`})),null!==e.meanLevel&&e.stability&&"stable"!==e.stability&&"insufficient_data"!==e.stability){const i=this._displayLevel(e.meanLevel),a=this._displayLevel(e.level);null!==i&&Math.abs(i-(a??0))>2&&t.push({label_id:"avg",name:`avg ${i}%`,color:"#2196F3",description:`7-day average is ${i}% while current reading is ${a??"?"}%`})}return t}_getDeviceSubText(e){const t=[],i=(e.name||"").toLowerCase();e.manufacturer&&!i.includes(e.manufacturer.toLowerCase())&&t.push(e.manufacturer),e.model&&!i.includes(e.model.toLowerCase())&&t.push(e.model);let a=t.join(" ");return a&&e.platform?a+=` · ${e.platform}`:!a&&e.platform&&(a=e.platform),a||null}_renderBadgeLabel(e){return N`
      <span title=${e.description||""} style="display:inline-flex;align-items:center;gap:2px;font-size:11px;font-weight:500;padding:1px 8px;border-radius:10px;white-space:nowrap;background:color-mix(in srgb, ${e.color} 20%, transparent);color:${e.color}">
        ${e.icon?N`<ha-icon icon=${e.icon} style="--mdc-icon-size:14px"></ha-icon>`:I}
        ${e.name}
      </span>
    `}_renderReliabilityBadge(e){const t=e.reliability,i=null!==e.daysRemaining||null!==e.hoursRemaining;if(null==t||!i)return"—";const a=t>=70?"var(--success-color, #43a047)":t>=40?"var(--warning-color, #ffa726)":"var(--disabled-text-color, #999)";return N`<span
      style="display:inline-block;font-size:11px;font-weight:500;padding:1px 6px;border-radius:8px;background:color-mix(in srgb, ${a} 15%, transparent);color:${a}"
      title="Prediction reliability: ${t}%"
      >${t}%</span
    >`}_renderDropdownItems(e){return N`
      <ha-dropdown-item value="detail">
        <ha-icon slot="icon" icon="mdi:information-outline"></ha-icon>
        More info
      </ha-dropdown-item>
      <wa-divider></wa-divider>
      ${e?.replacementPending?N`
      <ha-dropdown-item value="confirm">
        <ha-icon slot="icon" icon="mdi:check-circle-outline"></ha-icon>
        Confirm replacement
      </ha-dropdown-item>`:I}
      <ha-dropdown-item value="replace">
        <ha-icon slot="icon" icon="mdi:battery-sync"></ha-icon>
        Mark as replaced
      </ha-dropdown-item>
      ${e?.lastReplaced?N`
      <ha-dropdown-item value="undo-replace">
        <ha-icon slot="icon" icon="mdi:undo"></ha-icon>
        Undo replacement
      </ha-dropdown-item>`:I}
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
    `}_renderShoppingList(){if(this._shoppingLoading)return N`<div class="devices">
        <div class="empty-state">Loading shopping list...</div>
      </div>`;if(!this._shoppingData||!this._shoppingData.groups)return N`<div class="devices">
        <div class="empty-state">
          No shopping data available. Click refresh to load.
        </div>
      </div>`;const{groups:e,total_needed:t}=this._shoppingData;return 0===e.length?N`<div class="devices">
        <div class="empty-state">No battery devices found.</div>
      </div>`:N`
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
        ${e.filter(e=>e.needs_replacement>0&&"Unknown"!==e.battery_type).map(e=>N`
              <div class="summary-card shopping-need-card">
                <div class="value">${e.needs_replacement}</div>
                <div class="label">${e.battery_type}</div>
              </div>
            `)}
      </div>
      <div class="shopping-groups">
        ${e.map(e=>this._renderShoppingGroup(e))}
      </div>
      ${e.some(e=>"Unknown"===e.battery_type)?N`<div class="shopping-hint">
            <ha-icon
              icon="mdi:information-outline"
              style="--mdc-icon-size:16px"
            ></ha-icon>
            Devices with unknown battery type can be configured from the Devices tab.
          </div>`:I}
    `}_renderShoppingGroup(e){const t="Unknown"===e.battery_type?"mdi:help-circle-outline":"mdi:battery",i=!!this._expandedGroups[e.battery_type],a=`${e.battery_count} batter${1!==e.battery_count?"ies":"y"} in ${e.device_count} device${1!==e.device_count?"s":""}${e.needs_replacement>0?` — ${e.needs_replacement} need${1!==e.needs_replacement?"":"s"} replacement`:""}`;return N`
      <ha-expansion-panel
        outlined
        .expanded=${i}
        @expanded-changed=${t=>{const i={...this._expandedGroups};t.detail.expanded?i[e.battery_type]=!0:delete i[e.battery_type],this._expandedGroups=i}}
      >
        <ha-icon slot="leading-icon" icon=${t} style="--mdc-icon-size:20px"></ha-icon>
        <span slot="header" class="shopping-type">${e.battery_type}</span>
        <span slot="secondary">
          ${e.needs_replacement>0?N`<span class="shopping-need-badge">${e.needs_replacement}\u00d7</span> `:I}
          ${a}
        </span>
        <div class="shopping-devices-inner">
          ${e.devices.map(e=>{const t=this._getLevelColor(e.level,null),i=e.is_low||null!==e.days_remaining&&e.days_remaining<=(this._settingsValues.prediction_horizon??7),a=e.battery_count>1?` (${e.battery_count}×)`:"";return N`
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
    `}_renderDetailView(){const e=this._detailEntity,t=this._getDevice(e);if(!t)return N`<div class="empty-state">Device not found</div>`;const i=this._getDeviceSubText(t);return N`
      <div class="detail-header">
        <ha-icon
          icon=${this._getBatteryIcon(t)}
          style="color:${this._getLevelColor(t.level,t.threshold)};--mdc-icon-size:40px"
        ></ha-icon>
        <div>
          <h1>${t.name||t.sourceEntity}</h1>
          ${i?N`<div class="detail-header-sub">${i}</div>`:I}
        </div>
      </div>
      ${this._renderDetailMeta(t)} ${this._renderDetailChart()}
      ${this._renderDetailActions()}
    `}_renderDetailMeta(e){const t=this._chartData,i=t?.prediction||{},a={normal:"Normal discharge",charging:"Currently charging",flat:"Flat — no significant discharge detected",noisy:"Noisy — data too irregular for prediction",insufficient_data:"Not enough data for prediction",single_level:"Single level — all readings identical",insufficient_range:"Insufficient range — readings too close together"}[i.status]||i.status||"Unknown",s=this._getLevelColor(e.level,e.threshold);return N`
      <div class="detail-meta">
        <div class="detail-meta-grid">
          <div class="detail-meta-item">
            <div class="detail-meta-label">Current Level</div>
            <div class="detail-meta-value" style="color:${s}">
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
          ${null!=i.r_squared?N`<div class="detail-meta-item">
                <div class="detail-meta-label" title="How well the trend line fits the data. 1.0 = perfect fit, 0.0 = no pattern. Above 0.7 is a good fit, below 0.3 means the data is too scattered for a reliable prediction.">R\u00b2</div>
                <div class="detail-meta-value">${i.r_squared.toFixed(3)}</div>
              </div>`:I}
          ${null!=i.reliability?N`<div class="detail-meta-item">
                <div class="detail-meta-label">Reliability</div>
                <div class="detail-meta-value">${this._renderReliabilityBadge(e)}</div>
              </div>`:I}
          <div class="detail-meta-item">
            <div class="detail-meta-label">Data Points</div>
            <div class="detail-meta-value">
              ${i.data_points_used??t?.readings?.length??"—"}${t?.session_count?N` <span style="color:var(--secondary-text-color); font-size:0.85em">(${t.session_count} session${1!==t.session_count?"s":""})</span>`:I}
            </div>
          </div>
          ${t?.charge_prediction?.estimated_full_timestamp?N`<div class="detail-meta-item">
                <div class="detail-meta-label">Predicted Full</div>
                <div class="detail-meta-value">
                  ${this._formatDate(1e3*t.charge_prediction.estimated_full_timestamp,!0)}
                </div>
              </div>`:e.predictedEmpty?N`<div class="detail-meta-item">
                <div class="detail-meta-label">Predicted Empty</div>
                <div class="detail-meta-value">
                  ${this._formatDate(e.predictedEmpty,this._isFastDischarge(e))}
                </div>
              </div>`:I}
          ${e.lastCalculated?N`<div class="detail-meta-item">
                <div class="detail-meta-label">Last Calculated</div>
                <div class="detail-meta-value">
                  ${this._formatDate(1e3*e.lastCalculated,!0)}
                </div>
              </div>`:I}
        </div>
        ${e.predictedEmpty||!i.status||"normal"===i.status||"charging"===i.status&&t?.charge_prediction?.estimated_full_timestamp?I:N`<div class="detail-reason">
              <ha-icon icon="mdi:information-outline" style="--mdc-icon-size:18px; color:var(--secondary-text-color); flex-shrink:0"></ha-icon>
              <div>
                <strong>Why is there no prediction?</strong>
                <div class="detail-reason-text">${this._predictionReasonDetail(i.status)||"Unknown reason."}</div>
              </div>
            </div>`}
      </div>
    `}_renderDetailChart(){if(this._chartLoading)return N`
        <div class="detail-chart" id="jp-chart">
          <div class="loading-state">
            <ha-spinner size="small"></ha-spinner>
            <div>Loading chart data\u2026</div>
          </div>
        </div>
      `;if(!(this._chartData&&this._chartData.readings&&this._chartData.readings.length>0))return N`
        <div class="detail-chart" id="jp-chart">
          <div class="empty-state">Not enough data yet to display a chart.</div>
        </div>
      `;return N`
      <div class="chart-range-bar">
        ${[{key:"auto",label:"Auto"},{key:"1d",label:"1D"},{key:"1w",label:"1W"},{key:"1m",label:"1M"},{key:"3m",label:"3M"},{key:"6m",label:"6M"},{key:"1y",label:"1Y"},{key:"all",label:"All"}].map(e=>N`
            <button
              class="range-pill ${this._chartRange===e.key?"active":""}"
              @click=${()=>{this._chartRange=e.key}}
            >${e.label}</button>
          `)}
      </div>
      ${this._chartStale?N`<div class="chart-stale-notice" @click=${()=>this._loadChartData(this._detailEntity)}>
            <ha-icon icon="mdi:refresh" style="--mdc-icon-size:16px"></ha-icon>
            Data updated \u2014 tap to refresh
          </div>`:I}
      <div class="detail-chart" id="jp-chart"></div>
    `}_renderDetailActions(){const e=this._detailEntity;if(!e)return I;const t=this._getDevice(e),i=this._chartData,a=i?.replacement_history||[],s=i?.suspected_replacements||[];return N`
      ${a.length>0||s.length>0?N`
        <div class="replacement-history">
          <div class="detail-meta-label" style="margin-bottom: 4px">Replacement History</div>
          <div class="replacement-history-list">
            ${[...a].reverse().map(e=>N`
              <div class="replacement-history-item">
                <ha-icon icon="mdi:battery-sync" style="--mdc-icon-size:16px; color:var(--secondary-text-color)"></ha-icon>
                <span>${this._formatDate(1e3*e,!0)}</span>
              </div>
            `)}
            ${s.map(t=>N`
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
      `:I}
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
        ${t?.lastReplaced?N`
        <ha-button variant="danger"
          @click=${()=>this._undoReplacement(e)}
        >
          <ha-icon slot="start" icon="mdi:undo"></ha-icon>
          Undo replacement
        </ha-button>`:I}
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
    `}static get styles(){return n`
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
      .detail-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
      }
      .detail-header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        line-height: 1.2;
      }
      .detail-header-sub {
        font-size: 14px;
        color: var(--secondary-text-color);
        margin-top: 2px;
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
      @media (max-width: 500px) {
        #jp-content,
        .jp-padded {
          padding: 10px;
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

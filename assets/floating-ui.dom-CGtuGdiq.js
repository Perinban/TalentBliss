const Bt=["top","right","bottom","left"],j=Math.min,C=Math.max,it=Math.round,nt=Math.floor,k=t=>({x:t,y:t}),Ht={left:"right",right:"left",bottom:"top",top:"bottom"},Nt={start:"end",end:"start"};function at(t,e,n){return C(t,j(e,n))}function N(t,e){return typeof t=="function"?t(e):t}function V(t){return t.split("-")[0]}function J(t){return t.split("-")[1]}function mt(t){return t==="x"?"y":"x"}function ht(t){return t==="y"?"height":"width"}function Y(t){return["top","bottom"].includes(V(t))?"y":"x"}function gt(t){return mt(Y(t))}function Vt(t,e,n){n===void 0&&(n=!1);const i=J(t),o=gt(t),s=ht(o);let r=o==="x"?i===(n?"end":"start")?"right":"left":i==="start"?"bottom":"top";return e.reference[s]>e.floating[s]&&(r=ot(r)),[r,ot(r)]}function $t(t){const e=ot(t);return[ut(t),e,ut(e)]}function ut(t){return t.replace(/start|end/g,e=>Nt[e])}function zt(t,e,n){const i=["left","right"],o=["right","left"],s=["top","bottom"],r=["bottom","top"];switch(t){case"top":case"bottom":return n?e?o:i:e?i:o;case"left":case"right":return e?s:r;default:return[]}}function _t(t,e,n,i){const o=J(t);let s=zt(V(t),n==="start",i);return o&&(s=s.map(r=>r+"-"+o),e&&(s=s.concat(s.map(ut)))),s}function ot(t){return t.replace(/left|right|bottom|top/g,e=>Ht[e])}function It(t){return{top:0,right:0,bottom:0,left:0,...t}}function Tt(t){return typeof t!="number"?It(t):{top:t,right:t,bottom:t,left:t}}function st(t){const{x:e,y:n,width:i,height:o}=t;return{width:i,height:o,top:n,left:e,right:e+i,bottom:n+o,x:e,y:n}}function vt(t,e,n){let{reference:i,floating:o}=t;const s=Y(e),r=gt(e),c=ht(r),l=V(e),f=s==="y",d=i.x+i.width/2-o.width/2,a=i.y+i.height/2-o.height/2,m=i[c]/2-o[c]/2;let u;switch(l){case"top":u={x:d,y:i.y-o.height};break;case"bottom":u={x:d,y:i.y+i.height};break;case"right":u={x:i.x+i.width,y:a};break;case"left":u={x:i.x-o.width,y:a};break;default:u={x:i.x,y:i.y}}switch(J(e)){case"start":u[r]-=m*(n&&f?-1:1);break;case"end":u[r]+=m*(n&&f?-1:1);break}return u}const jt=async(t,e,n)=>{const{placement:i="bottom",strategy:o="absolute",middleware:s=[],platform:r}=n,c=s.filter(Boolean),l=await(r.isRTL==null?void 0:r.isRTL(e));let f=await r.getElementRects({reference:t,floating:e,strategy:o}),{x:d,y:a}=vt(f,i,l),m=i,u={},h=0;for(let g=0;g<c.length;g++){const{name:p,fn:x}=c[g],{x:y,y:w,data:b,reset:v}=await x({x:d,y:a,initialPlacement:i,placement:m,strategy:o,middlewareData:u,rects:f,platform:r,elements:{reference:t,floating:e}});d=y??d,a=w??a,u={...u,[p]:{...u[p],...b}},v&&h<=50&&(h++,typeof v=="object"&&(v.placement&&(m=v.placement),v.rects&&(f=v.rects===!0?await r.getElementRects({reference:t,floating:e,strategy:o}):v.rects),{x:d,y:a}=vt(f,m,l)),g=-1)}return{x:d,y:a,placement:m,strategy:o,middlewareData:u}};async function Z(t,e){var n;e===void 0&&(e={});const{x:i,y:o,platform:s,rects:r,elements:c,strategy:l}=t,{boundary:f="clippingAncestors",rootBoundary:d="viewport",elementContext:a="floating",altBoundary:m=!1,padding:u=0}=N(e,t),h=Tt(u),p=c[m?a==="floating"?"reference":"floating":a],x=st(await s.getClippingRect({element:(n=await(s.isElement==null?void 0:s.isElement(p)))==null||n?p:p.contextElement||await(s.getDocumentElement==null?void 0:s.getDocumentElement(c.floating)),boundary:f,rootBoundary:d,strategy:l})),y=a==="floating"?{x:i,y:o,width:r.floating.width,height:r.floating.height}:r.reference,w=await(s.getOffsetParent==null?void 0:s.getOffsetParent(c.floating)),b=await(s.isElement==null?void 0:s.isElement(w))?await(s.getScale==null?void 0:s.getScale(w))||{x:1,y:1}:{x:1,y:1},v=st(s.convertOffsetParentRelativeRectToViewportRelativeRect?await s.convertOffsetParentRelativeRectToViewportRelativeRect({elements:c,rect:y,offsetParent:w,strategy:l}):y);return{top:(x.top-v.top+h.top)/b.y,bottom:(v.bottom-x.bottom+h.bottom)/b.y,left:(x.left-v.left+h.left)/b.x,right:(v.right-x.right+h.right)/b.x}}const Yt=t=>({name:"arrow",options:t,async fn(e){const{x:n,y:i,placement:o,rects:s,platform:r,elements:c,middlewareData:l}=e,{element:f,padding:d=0}=N(t,e)||{};if(f==null)return{};const a=Tt(d),m={x:n,y:i},u=gt(o),h=ht(u),g=await r.getDimensions(f),p=u==="y",x=p?"top":"left",y=p?"bottom":"right",w=p?"clientHeight":"clientWidth",b=s.reference[h]+s.reference[u]-m[u]-s.floating[h],v=m[u]-s.reference[u],R=await(r.getOffsetParent==null?void 0:r.getOffsetParent(f));let A=R?R[w]:0;(!A||!await(r.isElement==null?void 0:r.isElement(R)))&&(A=c.floating[w]||s.floating[h]);const B=b/2-v/2,D=A/2-g[h]/2-1,E=j(a[x],D),$=j(a[y],D),P=E,z=A-g[h]-$,O=A/2-g[h]/2+B,U=at(P,O,z),H=!l.arrow&&J(o)!=null&&O!==U&&s.reference[h]/2-(O<P?E:$)-g[h]/2<0,M=H?O<P?O-P:O-z:0;return{[u]:m[u]+M,data:{[u]:U,centerOffset:O-U-M,...H&&{alignmentOffset:M}},reset:H}}}),qt=function(t){return t===void 0&&(t={}),{name:"flip",options:t,async fn(e){var n,i;const{placement:o,middlewareData:s,rects:r,initialPlacement:c,platform:l,elements:f}=e,{mainAxis:d=!0,crossAxis:a=!0,fallbackPlacements:m,fallbackStrategy:u="bestFit",fallbackAxisSideDirection:h="none",flipAlignment:g=!0,...p}=N(t,e);if((n=s.arrow)!=null&&n.alignmentOffset)return{};const x=V(o),y=Y(c),w=V(c)===c,b=await(l.isRTL==null?void 0:l.isRTL(f.floating)),v=m||(w||!g?[ot(c)]:$t(c)),R=h!=="none";!m&&R&&v.push(..._t(c,g,h,b));const A=[c,...v],B=await Z(e,p),D=[];let E=((i=s.flip)==null?void 0:i.overflows)||[];if(d&&D.push(B[x]),a){const O=Vt(o,r,b);D.push(B[O[0]],B[O[1]])}if(E=[...E,{placement:o,overflows:D}],!D.every(O=>O<=0)){var $,P;const O=((($=s.flip)==null?void 0:$.index)||0)+1,U=A[O];if(U)return{data:{index:O,overflows:E},reset:{placement:U}};let H=(P=E.filter(M=>M.overflows[0]<=0).sort((M,_)=>M.overflows[1]-_.overflows[1])[0])==null?void 0:P.placement;if(!H)switch(u){case"bestFit":{var z;const M=(z=E.filter(_=>{if(R){const I=Y(_.placement);return I===y||I==="y"}return!0}).map(_=>[_.placement,_.overflows.filter(I=>I>0).reduce((I,Wt)=>I+Wt,0)]).sort((_,I)=>_[1]-I[1])[0])==null?void 0:z[0];M&&(H=M);break}case"initialPlacement":H=c;break}if(o!==H)return{reset:{placement:H}}}return{}}}};function bt(t,e){return{top:t.top-e.height,right:t.right-e.width,bottom:t.bottom-e.height,left:t.left-e.width}}function At(t){return Bt.some(e=>t[e]>=0)}const Xt=function(t){return t===void 0&&(t={}),{name:"hide",options:t,async fn(e){const{rects:n}=e,{strategy:i="referenceHidden",...o}=N(t,e);switch(i){case"referenceHidden":{const s=await Z(e,{...o,elementContext:"reference"}),r=bt(s,n.reference);return{data:{referenceHiddenOffsets:r,referenceHidden:At(r)}}}case"escaped":{const s=await Z(e,{...o,altBoundary:!0}),r=bt(s,n.floating);return{data:{escapedOffsets:r,escaped:At(r)}}}default:return{}}}}};async function Ut(t,e){const{placement:n,platform:i,elements:o}=t,s=await(i.isRTL==null?void 0:i.isRTL(o.floating)),r=V(n),c=J(n),l=Y(n)==="y",f=["left","top"].includes(r)?-1:1,d=s&&l?-1:1,a=N(e,t);let{mainAxis:m,crossAxis:u,alignmentAxis:h}=typeof a=="number"?{mainAxis:a,crossAxis:0,alignmentAxis:null}:{mainAxis:a.mainAxis||0,crossAxis:a.crossAxis||0,alignmentAxis:a.alignmentAxis};return c&&typeof h=="number"&&(u=c==="end"?h*-1:h),l?{x:u*d,y:m*f}:{x:m*f,y:u*d}}const Kt=function(t){return t===void 0&&(t=0),{name:"offset",options:t,async fn(e){var n,i;const{x:o,y:s,placement:r,middlewareData:c}=e,l=await Ut(e,t);return r===((n=c.offset)==null?void 0:n.placement)&&(i=c.arrow)!=null&&i.alignmentOffset?{}:{x:o+l.x,y:s+l.y,data:{...l,placement:r}}}}},Gt=function(t){return t===void 0&&(t={}),{name:"shift",options:t,async fn(e){const{x:n,y:i,placement:o}=e,{mainAxis:s=!0,crossAxis:r=!1,limiter:c={fn:p=>{let{x,y}=p;return{x,y}}},...l}=N(t,e),f={x:n,y:i},d=await Z(e,l),a=Y(V(o)),m=mt(a);let u=f[m],h=f[a];if(s){const p=m==="y"?"top":"left",x=m==="y"?"bottom":"right",y=u+d[p],w=u-d[x];u=at(y,u,w)}if(r){const p=a==="y"?"top":"left",x=a==="y"?"bottom":"right",y=h+d[p],w=h-d[x];h=at(y,h,w)}const g=c.fn({...e,[m]:u,[a]:h});return{...g,data:{x:g.x-n,y:g.y-i,enabled:{[m]:s,[a]:r}}}}}},Jt=function(t){return t===void 0&&(t={}),{options:t,fn(e){const{x:n,y:i,placement:o,rects:s,middlewareData:r}=e,{offset:c=0,mainAxis:l=!0,crossAxis:f=!0}=N(t,e),d={x:n,y:i},a=Y(o),m=mt(a);let u=d[m],h=d[a];const g=N(c,e),p=typeof g=="number"?{mainAxis:g,crossAxis:0}:{mainAxis:0,crossAxis:0,...g};if(l){const w=m==="y"?"height":"width",b=s.reference[m]-s.floating[w]+p.mainAxis,v=s.reference[m]+s.reference[w]-p.mainAxis;u<b?u=b:u>v&&(u=v)}if(f){var x,y;const w=m==="y"?"width":"height",b=["top","left"].includes(V(o)),v=s.reference[a]-s.floating[w]+(b&&((x=r.offset)==null?void 0:x[a])||0)+(b?0:p.crossAxis),R=s.reference[a]+s.reference[w]+(b?0:((y=r.offset)==null?void 0:y[a])||0)-(b?p.crossAxis:0);h<v?h=v:h>R&&(h=R)}return{[m]:u,[a]:h}}}},Qt=function(t){return t===void 0&&(t={}),{name:"size",options:t,async fn(e){var n,i;const{placement:o,rects:s,platform:r,elements:c}=e,{apply:l=()=>{},...f}=N(t,e),d=await Z(e,f),a=V(o),m=J(o),u=Y(o)==="y",{width:h,height:g}=s.floating;let p,x;a==="top"||a==="bottom"?(p=a,x=m===(await(r.isRTL==null?void 0:r.isRTL(c.floating))?"start":"end")?"left":"right"):(x=a,p=m==="end"?"top":"bottom");const y=g-d.top-d.bottom,w=h-d.left-d.right,b=j(g-d[p],y),v=j(h-d[x],w),R=!e.middlewareData.shift;let A=b,B=v;if((n=e.middlewareData.shift)!=null&&n.enabled.x&&(B=w),(i=e.middlewareData.shift)!=null&&i.enabled.y&&(A=y),R&&!m){const E=C(d.left,0),$=C(d.right,0),P=C(d.top,0),z=C(d.bottom,0);u?B=h-2*(E!==0||$!==0?E+$:C(d.left,d.right)):A=g-2*(P!==0||z!==0?P+z:C(d.top,d.bottom))}await l({...e,availableWidth:B,availableHeight:A});const D=await r.getDimensions(c.floating);return h!==D.width||g!==D.height?{reset:{rects:!0}}:{}}}};function rt(){return typeof window<"u"}function Q(t){return Et(t)?(t.nodeName||"").toLowerCase():"#document"}function T(t){var e;return(t==null||(e=t.ownerDocument)==null?void 0:e.defaultView)||window}function W(t){var e;return(e=(Et(t)?t.ownerDocument:t.document)||window.document)==null?void 0:e.documentElement}function Et(t){return rt()?t instanceof Node||t instanceof T(t).Node:!1}function L(t){return rt()?t instanceof Element||t instanceof T(t).Element:!1}function F(t){return rt()?t instanceof HTMLElement||t instanceof T(t).HTMLElement:!1}function Ot(t){return!rt()||typeof ShadowRoot>"u"?!1:t instanceof ShadowRoot||t instanceof T(t).ShadowRoot}function et(t){const{overflow:e,overflowX:n,overflowY:i,display:o}=S(t);return/auto|scroll|overlay|hidden|clip/.test(e+i+n)&&!["inline","contents"].includes(o)}function Zt(t){return["table","td","th"].includes(Q(t))}function ct(t){return[":popover-open",":modal"].some(e=>{try{return t.matches(e)}catch{return!1}})}function pt(t){const e=xt(),n=L(t)?S(t):t;return["transform","translate","scale","rotate","perspective"].some(i=>n[i]?n[i]!=="none":!1)||(n.containerType?n.containerType!=="normal":!1)||!e&&(n.backdropFilter?n.backdropFilter!=="none":!1)||!e&&(n.filter?n.filter!=="none":!1)||["transform","translate","scale","rotate","perspective","filter"].some(i=>(n.willChange||"").includes(i))||["paint","layout","strict","content"].some(i=>(n.contain||"").includes(i))}function te(t){let e=q(t);for(;F(e)&&!G(e);){if(pt(e))return e;if(ct(e))return null;e=q(e)}return null}function xt(){return typeof CSS>"u"||!CSS.supports?!1:CSS.supports("-webkit-backdrop-filter","none")}function G(t){return["html","body","#document"].includes(Q(t))}function S(t){return T(t).getComputedStyle(t)}function lt(t){return L(t)?{scrollLeft:t.scrollLeft,scrollTop:t.scrollTop}:{scrollLeft:t.scrollX,scrollTop:t.scrollY}}function q(t){if(Q(t)==="html")return t;const e=t.assignedSlot||t.parentNode||Ot(t)&&t.host||W(t);return Ot(e)?e.host:e}function Lt(t){const e=q(t);return G(e)?t.ownerDocument?t.ownerDocument.body:t.body:F(e)&&et(e)?e:Lt(e)}function tt(t,e,n){var i;e===void 0&&(e=[]),n===void 0&&(n=!0);const o=Lt(t),s=o===((i=t.ownerDocument)==null?void 0:i.body),r=T(o);if(s){const c=dt(r);return e.concat(r,r.visualViewport||[],et(o)?o:[],c&&n?tt(c):[])}return e.concat(o,tt(o,[],n))}function dt(t){return t.parent&&Object.getPrototypeOf(t.parent)?t.frameElement:null}function St(t){const e=S(t);let n=parseFloat(e.width)||0,i=parseFloat(e.height)||0;const o=F(t),s=o?t.offsetWidth:n,r=o?t.offsetHeight:i,c=it(n)!==s||it(i)!==r;return c&&(n=s,i=r),{width:n,height:i,$:c}}function wt(t){return L(t)?t:t.contextElement}function K(t){const e=wt(t);if(!F(e))return k(1);const n=e.getBoundingClientRect(),{width:i,height:o,$:s}=St(e);let r=(s?it(n.width):n.width)/i,c=(s?it(n.height):n.height)/o;return(!r||!Number.isFinite(r))&&(r=1),(!c||!Number.isFinite(c))&&(c=1),{x:r,y:c}}const ee=k(0);function Dt(t){const e=T(t);return!xt()||!e.visualViewport?ee:{x:e.visualViewport.offsetLeft,y:e.visualViewport.offsetTop}}function ne(t,e,n){return e===void 0&&(e=!1),!n||e&&n!==T(t)?!1:e}function X(t,e,n,i){e===void 0&&(e=!1),n===void 0&&(n=!1);const o=t.getBoundingClientRect(),s=wt(t);let r=k(1);e&&(i?L(i)&&(r=K(i)):r=K(t));const c=ne(s,n,i)?Dt(s):k(0);let l=(o.left+c.x)/r.x,f=(o.top+c.y)/r.y,d=o.width/r.x,a=o.height/r.y;if(s){const m=T(s),u=i&&L(i)?T(i):i;let h=m,g=dt(h);for(;g&&i&&u!==h;){const p=K(g),x=g.getBoundingClientRect(),y=S(g),w=x.left+(g.clientLeft+parseFloat(y.paddingLeft))*p.x,b=x.top+(g.clientTop+parseFloat(y.paddingTop))*p.y;l*=p.x,f*=p.y,d*=p.x,a*=p.y,l+=w,f+=b,h=T(g),g=dt(h)}}return st({width:d,height:a,x:l,y:f})}function yt(t,e){const n=lt(t).scrollLeft;return e?e.left+n:X(W(t)).left+n}function Pt(t,e,n){n===void 0&&(n=!1);const i=t.getBoundingClientRect(),o=i.left+e.scrollLeft-(n?0:yt(t,i)),s=i.top+e.scrollTop;return{x:o,y:s}}function ie(t){let{elements:e,rect:n,offsetParent:i,strategy:o}=t;const s=o==="fixed",r=W(i),c=e?ct(e.floating):!1;if(i===r||c&&s)return n;let l={scrollLeft:0,scrollTop:0},f=k(1);const d=k(0),a=F(i);if((a||!a&&!s)&&((Q(i)!=="body"||et(r))&&(l=lt(i)),F(i))){const u=X(i);f=K(i),d.x=u.x+i.clientLeft,d.y=u.y+i.clientTop}const m=r&&!a&&!s?Pt(r,l,!0):k(0);return{width:n.width*f.x,height:n.height*f.y,x:n.x*f.x-l.scrollLeft*f.x+d.x+m.x,y:n.y*f.y-l.scrollTop*f.y+d.y+m.y}}function oe(t){return Array.from(t.getClientRects())}function se(t){const e=W(t),n=lt(t),i=t.ownerDocument.body,o=C(e.scrollWidth,e.clientWidth,i.scrollWidth,i.clientWidth),s=C(e.scrollHeight,e.clientHeight,i.scrollHeight,i.clientHeight);let r=-n.scrollLeft+yt(t);const c=-n.scrollTop;return S(i).direction==="rtl"&&(r+=C(e.clientWidth,i.clientWidth)-o),{width:o,height:s,x:r,y:c}}function re(t,e){const n=T(t),i=W(t),o=n.visualViewport;let s=i.clientWidth,r=i.clientHeight,c=0,l=0;if(o){s=o.width,r=o.height;const f=xt();(!f||f&&e==="fixed")&&(c=o.offsetLeft,l=o.offsetTop)}return{width:s,height:r,x:c,y:l}}function ce(t,e){const n=X(t,!0,e==="fixed"),i=n.top+t.clientTop,o=n.left+t.clientLeft,s=F(t)?K(t):k(1),r=t.clientWidth*s.x,c=t.clientHeight*s.y,l=o*s.x,f=i*s.y;return{width:r,height:c,x:l,y:f}}function Rt(t,e,n){let i;if(e==="viewport")i=re(t,n);else if(e==="document")i=se(W(t));else if(L(e))i=ce(e,n);else{const o=Dt(t);i={x:e.x-o.x,y:e.y-o.y,width:e.width,height:e.height}}return st(i)}function Mt(t,e){const n=q(t);return n===e||!L(n)||G(n)?!1:S(n).position==="fixed"||Mt(n,e)}function le(t,e){const n=e.get(t);if(n)return n;let i=tt(t,[],!1).filter(c=>L(c)&&Q(c)!=="body"),o=null;const s=S(t).position==="fixed";let r=s?q(t):t;for(;L(r)&&!G(r);){const c=S(r),l=pt(r);!l&&c.position==="fixed"&&(o=null),(s?!l&&!o:!l&&c.position==="static"&&!!o&&["absolute","fixed"].includes(o.position)||et(r)&&!l&&Mt(t,r))?i=i.filter(d=>d!==r):o=c,r=q(r)}return e.set(t,i),i}function fe(t){let{element:e,boundary:n,rootBoundary:i,strategy:o}=t;const r=[...n==="clippingAncestors"?ct(e)?[]:le(e,this._c):[].concat(n),i],c=r[0],l=r.reduce((f,d)=>{const a=Rt(e,d,o);return f.top=C(a.top,f.top),f.right=j(a.right,f.right),f.bottom=j(a.bottom,f.bottom),f.left=C(a.left,f.left),f},Rt(e,c,o));return{width:l.right-l.left,height:l.bottom-l.top,x:l.left,y:l.top}}function ae(t){const{width:e,height:n}=St(t);return{width:e,height:n}}function ue(t,e,n){const i=F(e),o=W(e),s=n==="fixed",r=X(t,!0,s,e);let c={scrollLeft:0,scrollTop:0};const l=k(0);if(i||!i&&!s)if((Q(e)!=="body"||et(o))&&(c=lt(e)),i){const m=X(e,!0,s,e);l.x=m.x+e.clientLeft,l.y=m.y+e.clientTop}else o&&(l.x=yt(o));const f=o&&!i&&!s?Pt(o,c):k(0),d=r.left+c.scrollLeft-l.x-f.x,a=r.top+c.scrollTop-l.y-f.y;return{x:d,y:a,width:r.width,height:r.height}}function ft(t){return S(t).position==="static"}function Ct(t,e){if(!F(t)||S(t).position==="fixed")return null;if(e)return e(t);let n=t.offsetParent;return W(t)===n&&(n=n.ownerDocument.body),n}function kt(t,e){const n=T(t);if(ct(t))return n;if(!F(t)){let o=q(t);for(;o&&!G(o);){if(L(o)&&!ft(o))return o;o=q(o)}return n}let i=Ct(t,e);for(;i&&Zt(i)&&ft(i);)i=Ct(i,e);return i&&G(i)&&ft(i)&&!pt(i)?n:i||te(t)||n}const de=async function(t){const e=this.getOffsetParent||kt,n=this.getDimensions,i=await n(t.floating);return{reference:ue(t.reference,await e(t.floating),t.strategy),floating:{x:0,y:0,width:i.width,height:i.height}}};function me(t){return S(t).direction==="rtl"}const he={convertOffsetParentRelativeRectToViewportRelativeRect:ie,getDocumentElement:W,getClippingRect:fe,getOffsetParent:kt,getElementRects:de,getClientRects:oe,getDimensions:ae,getScale:K,isElement:L,isRTL:me};function Ft(t,e){return t.x===e.x&&t.y===e.y&&t.width===e.width&&t.height===e.height}function ge(t,e){let n=null,i;const o=W(t);function s(){var c;clearTimeout(i),(c=n)==null||c.disconnect(),n=null}function r(c,l){c===void 0&&(c=!1),l===void 0&&(l=1),s();const f=t.getBoundingClientRect(),{left:d,top:a,width:m,height:u}=f;if(c||e(),!m||!u)return;const h=nt(a),g=nt(o.clientWidth-(d+m)),p=nt(o.clientHeight-(a+u)),x=nt(d),w={rootMargin:-h+"px "+-g+"px "+-p+"px "+-x+"px",threshold:C(0,j(1,l))||1};let b=!0;function v(R){const A=R[0].intersectionRatio;if(A!==l){if(!b)return r();A?r(!1,A):i=setTimeout(()=>{r(!1,1e-7)},1e3)}A===1&&!Ft(f,t.getBoundingClientRect())&&r(),b=!1}try{n=new IntersectionObserver(v,{...w,root:o.ownerDocument})}catch{n=new IntersectionObserver(v,w)}n.observe(t)}return r(!0),s}function pe(t,e,n,i){i===void 0&&(i={});const{ancestorScroll:o=!0,ancestorResize:s=!0,elementResize:r=typeof ResizeObserver=="function",layoutShift:c=typeof IntersectionObserver=="function",animationFrame:l=!1}=i,f=wt(t),d=o||s?[...f?tt(f):[],...tt(e)]:[];d.forEach(x=>{o&&x.addEventListener("scroll",n,{passive:!0}),s&&x.addEventListener("resize",n)});const a=f&&c?ge(f,n):null;let m=-1,u=null;r&&(u=new ResizeObserver(x=>{let[y]=x;y&&y.target===f&&u&&(u.unobserve(e),cancelAnimationFrame(m),m=requestAnimationFrame(()=>{var w;(w=u)==null||w.observe(e)})),n()}),f&&!l&&u.observe(f),u.observe(e));let h,g=l?X(t):null;l&&p();function p(){const x=X(t);g&&!Ft(g,x)&&n(),g=x,h=requestAnimationFrame(p)}return n(),()=>{var x;d.forEach(y=>{o&&y.removeEventListener("scroll",n),s&&y.removeEventListener("resize",n)}),a==null||a(),(x=u)==null||x.disconnect(),u=null,l&&cancelAnimationFrame(h)}}const xe=Kt,we=Gt,ye=qt,ve=Qt,be=Xt,Ae=Yt,Oe=Jt,Re=(t,e,n)=>{const i=new Map,o={platform:he,...n},s={...o.platform,_c:i};return jt(t,e,{...o,platform:s})};export{ve as a,Ae as b,Re as c,pe as d,ye as f,be as h,Oe as l,xe as o,we as s};

/*
v2
Expose
   Win.Yup
   window.Sizzle
*/
(function() {
   var $, _$, ver='1.3'
   
   _$=window.$
   
   function Yup(method) {
      var matches=[]
      if((typeof method)=='string') matches=Sizzle(method)
      else if((typeof method)=='object') {
         if(method.yup) return(method)
         else if($.isArray(method)) matches=method
         else matches[0]=method
         }
      else if((typeof method)=='function') ready.call(matches,method)
      return(getObject(matches,method))
      }
   $=Yup

   // сокращения
   var Win=window, Doc=document, _isEvAtach=Doc.attachEvent ? 1:0, _isEvList=Doc.addEventListener ? 1:0,
      Undef=undefined

   function mergeRecursive(o1,o2) {
      var i, isO='isPlainObject'
      for(i in o2) {
         if(!o1[i]) o1[i]=o2[i]
         else {
            if($[isO](o1[i]) && $[isO](o2[i])) mergeRecursive(o1[i],o2[i])
            else o1[i]=o2[i]
            }
         }
      return o1
   }
   
   $.noconflict = function() {
      Win.$=_$
      }

   $.isPlainObject = function(a) {
      return a && a.constructor==Object
      }
   $.isString = function(a) {
      return a.constructor==String
      }
   $.isFunction = function(a) {
      return a && a.constructor==Function
      }
   $.isArray = function(a) {
      return a && a.constructor==Array
      }
   $.error = function(errText) {
      if(console) console.error(errText)
      return false
      }
   
   $.extend = function(o) {
      var arg=arguments, aL=arg.length, i,o2,j, o1
      if(o===true) {
         o1=arg[1]
         for(i=2;i<aL;i++) {
            o2=arg[i]
            o1 = mergeRecursive(o1, o2)
         }
         return o1
      } else {
         for(i=1;i<aL;i++) {
            o2=arg[i]
            for(j in o2) o[j]=o2[j]
         }
         return o
      }
   }

   $.merge = function(ar1, ar2) {
      if(ar1.push) for(i in ar2) ar1.push(ar2[i])
      return ar1
      }

   
   $.inArray = function(val,arr) {
      if(!$.isArray(arr)) return false
      if(arr.indexOf==Undef) {
         // для ослов
         for(var i=0;i<arr.length;i++)
            if(val===arr[i]) return i
         return -1
         }
      else {
         return arr.indexOf(val)
         }
      }
   
   function addClass(cn) {
      this.each(function() {
         if(!$(this).hasClass(cn)) {
            var ccn=this.className || ''
            this.className = (ccn ? ccn+' ' : '') + cn
            }
         })
      return this
      }
   function hasClass(cn) {
      var ret=false
      this.each(function() {
         var cl=' '+this.className+' '
         if(cl.indexOf(' '+cn+' ')>-1) {ret=true;return false}
         })
      return ret
      }
   function removeClass(cn) {
      this.each(function() {
         if($(this).hasClass(cn)) {
            var fCn=this.className,ar=fCn.split(' '),i,s=''
            for(i in ar) s += ar[i]!=cn ? ar[i]+' ' : ''
            if(s) s=s.substr(0,s.length-1)
            this.className=s
            }
         })
      return this
      }
   
   
function getPageSize(){
   var xScroll, yScroll, body = Doc.body, dE = Doc.documentElement, pageHeight, pageWidth

   if (Win.innerHeight && Win.scrollMaxY) {
           xScroll = body.scrollWidth;
           yScroll = window.innerHeight + window.scrollMaxY;
   } else if (body.scrollHeight > body.offsetHeight){ // all but Explorer Mac
           xScroll = body.scrollWidth;
           yScroll = body.scrollHeight;
   } else if (dE && dE.scrollHeight > dE.offsetHeight){ // Explorer 6 strict mode
           xScroll = dE.scrollWidth;
           yScroll = dE.scrollHeight;
   } else { // Explorer Mac...would also work in Mozilla and Safari
           xScroll = body.offsetWidth;
           yScroll = body.offsetHeight;
   }

   var windowWidth, windowHeight;
   if (Win.innerHeight) { // all except Explorer (тут было вместо Win self)
           windowWidth = Win.innerWidth;
           windowHeight = Win.innerHeight;
   } else if (dE && dE.clientHeight) { // Explorer 6 Strict Mode
           windowWidth = dE.clientWidth;
           windowHeight = dE.clientHeight;
   } else if (document.body) { // other Explorers
           windowWidth = body.clientWidth;
           windowHeight = body.clientHeight;
   }

   // for small pages with total height less then height of the viewport
   if(yScroll < windowHeight){
           pageHeight = windowHeight;
   } else {
           pageHeight = yScroll;
   }

   // for small pages with total width less then width of the viewport
   if(xScroll < windowWidth){
           pageWidth = windowWidth;
   } else {
           pageWidth = xScroll;
   }

   return [pageWidth,pageHeight,windowWidth,windowHeight];
}
   
   
   function html(content) {
      if(content===Undef) return(this[0] ? this[0].innerHTML : '')
      else {
         this.each(function() {
            this.innerHTML=content
            })
         return this
         }
      }
   
   var $data={next : 1, hash : {}}
   function data(key, val) {
      var i,yupAttr='yupData'
      if((typeof key)=='object') {
         for(var i in key) data.call(this,i,key[i])
         return this
         }
      else if(arguments.length<2) {
         // получение данных
         if(this[0]) {
            if(key!==Undef) {
               if(this[0][yupAttr])
                  return($data.hash[this[0][yupAttr]][key])
               }
            else return($data.hash[this[0][yupAttr]])
            }
         }
      else {
         // установка данных
         this.each(function(i) {
            if(!$data.hash[$data.next]) $data.hash[$data.next]={}
            var oc
            if(oc=this[yupAttr]) {
               $data.hash[oc][key]=val
               }
            else {
               $data.hash[$data.next][key]=val
               this[yupAttr]=$data.next
               $data.next++
               }
            })
         return this
         }
      }

   function css(key, val) {
      if((typeof key)=='object') {
         for(var i in key) this.css(i,key[i])
         return this
         }
      else {
         var toC=$css.toCamel, k=toC(key)
         if(val!==Undef) {
            // задание свойства элемента + универсализация ( aa-bb в aaBb + opacity=> и т.д.)
            
            this.each(function(i) {
               var eng=['','-moz-','-webkit-','ms-'],j,uk
               
               if('!opacity!boxShadow!borderRadius!boxSizing!transform!transition-property!transition-duration!transition-delay'.indexOf(k)>0) {
                  // новые свойства для старых браузеров
                  for(j in eng) {
                     uk=toC(eng[j]+key)
                     this.style[uk]=val
                     }
                  if(k=='opacity') {
                     // говнокод для IE
                     if(this.style.filter!==Undef) {
                        var ieV=parseInt(parseFloat(val)*100,10)
                        if(ieV==100) this.style.filter=''
                        else this.style.filter='alpha('+k+'='+ieV+')'
                        }
                     }
                  }
               else {
                  // отработка свойств, в которых должны быть ед.измерения
                  if(/^(top|right|bottom|left)$|^border(top|right|bottom|left)width$|radius$|outline$|width$|height$|backgroundPosition$|padding|margin|fontSize/i.test(k)) {
                     if($.isString(val)) {
                        var ar=val.split(' '),i,s='',ms
                        for(i in ar) {
                           if(ar[i]) {
                              ms=/(-?\d*)(\D*)/.exec(ar[i])
                              if(!ms[2]) ms[2]='px'
                              s+=ms[1]+ms[2]+' '
                              }
                           }
                        if(s) s=s.substr(0,s.length-1)
                        val=s
                        }
                     else val=val + 'px'
                     }
                  else if(k=='float') k='cssFloat'
                  else if(k=='text') k='cssText'
                  if('width,height'.indexOf(k)>-1 && parseFloat(val)<0) val = '0px'
                  try {this.style[k]=val} catch(E) {}
                  if(k=='cssFloat') this.style.styleFloat=val
                  }
               })
            return this
            }
         else {
            // получение свойства css, с учетом вычислений
            var el
            if(el=this[0]) return $css.get(el,key)
            }
         }
      }
   
// блок css  
var $css;
(function() {
   var v1,v2, gCss, core_pnum = /[\-+]?(?:\d*\.|)\d+(?:[eE][\-+]?\d+|)/.source, 
      rmargin = /^margin/, rposition = /^(top|right|bottom|left)$/,
      rnumnonpx=new RegExp( "^(" + core_pnum + ")(?!px)[a-z%]+$", "i")
   
   function toCamel(p) {
      var ret='',i,s,ar=p.split('-')
      for(i in ar) {
         s=ar[i]; ret += (i>0 ? s.substr(0,1).toUpperCase()+s.substr(1) : s)
         }
      return ret
      }
   
   if(Win.getComputedStyle)
      gCss = function(el,key) {
         var ret, W, minW, maxW, 
            compS = Win.getComputedStyle(el,null), 
            sty = el.style, cKey=toCamel(key);
         if(compS) {
            ret = compS[cKey];
            if ( rnumnonpx.test( ret ) && rmargin.test( key ) ) {
               W = sty.width; minW = sty.minWidth; maxW = sty.maxWidth
               sty.minWidth = sty.maxWidth = sty.width = ret
               ret = compS.width
               sty.width = W; sty.minWidth = minW; sty.maxWidth = maxW
               }
            }
         return ret
         }
   else if(Doc.documentElement.currentStyle)
      gCss = function(el,key) {
         var L, rsL, cKey=toCamel(key)
           ret = (v1=el.currentStyle) && v1[ cKey ],
           sty = el.style;
         if ( ret == null && sty && sty[ cKey ] ) ret = sty[ cKey ];
         if ( rnumnonpx.test( ret ) && !rposition.test( key ) ) {
            L = sty.left; rsL = (v1=el.runtimeStyle) && v1.left
            if(rsL) v1.left = el.currentStyle.left
            sty.left = cKey === "fontSize" ? "1em" : ret
            ret = sty.pixelLeft + "px"
            sty.left = L
            if(rsL) el.runtimeStyle.left = rsL
            }
         return ret === "" ? "auto" : ret;
         }
   $css = {get:gCss, toCamel:toCamel}
   }) ();


   
   var events = {next:1,handlers:{}},
   Event=(function() {
      var hattr='yupEventHandle'
      
      var commonH = function(ev) {
         // сюда направляются все события по всем элементам
         // this - элемент, ev - оригинальное событие
         var actions,i
         ev=fixEvent(ev)
         actions=events.handlers[this[hattr]][ev.type]
         for(i in actions) {
            if(actions[i].call(this,ev)===false) break
            }
         }
      
      var fixEvent = function(event) {
         var v
         event = event || Win.event
         if(event.isFixed) return event
         event.isFixed = true
         event.preventDefault = event.preventDefault || function(){this.returnValue = false}
         event.stopPropagation = event.stopPropagaton || function(){this.cancelBubble = true}
         if (!event.target) event.target = event.srcElement
         if (!(v=event.relatedTarget) && v!==null  && event.fromElement) 
            event.relatedTarget = event.fromElement == event.target ? event.toElement : event.fromElement;
         if ( event.pageX == null && event.clientX != null ) {
            var html = document.documentElement, body = document.body
            event.pageX = event.clientX + (html && html.scrollLeft || body && body.scrollLeft || 0) - (html.clientLeft || 0)
            event.pageY = event.clientY + (html && html.scrollTop || body && body.scrollTop || 0) - (html.clientTop || 0);
            }
         if ( !event.which && event.button )
            event.which = (event.button & 1 ? 1 : ( event.button & 2 ? 3 : ( event.button & 4 ? 2 : 0 ) ))
         return event
         }
       
      var add = function(el,evt,cb) {
         var evIx, evtArr,i,arr
         if(el.setInterval && (el!=Win && !el.frameElement)) el=Win
         if(!el[hattr]) {
            // еще не были добавлены какие-либо события
            el[hattr]=events.next
            events.next++
            }
         evIx=el[hattr]
         if(!events.handlers[evIx]) events.handlers[evIx]={}
         evtArr=evt.split(' ')
         arr=[]
         for(i in evtArr) {
            // цикл по видам событий
            var t=evtArr[i], j, cbArr, exists=false
            if(!events.handlers[evIx][t]) {
               events.handlers[evIx][t]=[]
               if(_isEvList)
                  el.addEventListener(t, commonH, false)
               else if(_isEvAtach) {
                  el.attachEvent("on" + t, context({obj:el,fn:commonH}).get_fn())
                  }
               }
            cbArr=events.handlers[evIx][t]
            for(j in cbArr) { // если уже есть данный обработчик в списке обработчиков по данному событию
               if(cbArr[j]===cb) { exists=true; break}
               }
            if(!exists) cbArr.push(cb)
            }
         }
      
      var remove = function(el,evt,cb) {
         var evtArr=evt.split(' '),i,type,evIx
         evIx=el[hattr]
         if(evIx) {
            for(i in evtArr) {
               // цикл по видам событий
               type=evtArr[i]
               if(cb) {
                  // поиск и удаление конкретного обработчика
                  var j,cbArr=events.handlers[evIx][type],nCbs=[]
                  for(j in cbArr) {
                     if(cbArr[j]!==cb) nCbs.push(cbArr[j])
                     }
                  events.handlers[evIx][type]=nCbs
                  }
               else {
                  // удаление всех обработчиков по виду события для элемента
                  events.handlers[evIx][type]=[]
                  }
               }
            }
         }
      
      var trigger = function(el,evt,params) {
         var evtArr=evt.split(' '),i,evIx=el[hattr]
         for(i in evtArr) {
            // цикл по типам событий
            var type=evtArr[i], evObj={
               type : type,
               isTriggered : true,
               target : el
               }
            if(params) $.extend(evObj,params)
            commonH.call(el,evObj)
            }
         }

      return({
         add : add,
         remove : remove,
         trigger : trigger
         })
      })()

   function on(evt,cb) {
      this.each(function() {
         Event.add(this,evt,cb)
         })
      return this
      }
      
   function off(evt,cb) {
      this.each(function() {
         Event.remove(this,evt,cb)
         })
      return this
      }
   function trigger(evt,params) {
      this.each(function() {
         Event.trigger(this,evt,params)
         })
      return this
      }
   

   function elSize(t,val,mb) { 
      if(val===Undef) {
         // получение по первому
         var el
         if(el=this[0]) {
               if((el==Win || el==Doc) && mb==2) {
               return (getPageSize())[t=='width' ? 2 : 3]
            }
            var prop=$css.toCamel('offset-'+t), ret=el[prop], el=$(el)
            if(mb) {
               var x1,x2
               // убираем ширину границ и паддинга
               ret -= (
                  (isNaN(x1=parseFloat(el.css('border-'+(t=='width'?'left':'top')+'-width'))) ? 0 : x1) 
                  + (isNaN(x2=parseFloat(el.css('border-'+(t=='width'?'right':'bottom')+'-width'))) ? 0 : x2)
                  )
               if(mb>1) {
                  ret -= (
                     (isNaN(x1=parseFloat(el.css('padding-'+(t=='width'?'left':'top')))) ? 0 : x1)
                     + (isNaN(x2=parseFloat(el.css('padding-'+(t=='width'?'right':'bottom')))) ? 0 : x2)
                     )
                  }
               }
            return ret
            }
         else return 0
         }
      else {
         // установка
         this.each(function(i) {
            var el=$(this), ret=parseFloat(val)
            if(mb<2) { //mb:{0:outer,1:inner,2:}
               var x1,x2
               ret -= (
                  (isNaN(x1=parseFloat(el.css('padding-'+(t=='width'?'left':'top')))) ? 0 : x1)
                  + (isNaN(x2=parseFloat(el.css('padding-'+(t=='width'?'right':'bottom')))) ? 0 : x2)
                  )
               if(!mb) ret -= (
                  (isNaN(x1=parseFloat(el.css('border-'+(t=='width'?'left':'top')+'-width'))) ? 0 : x1) 
                  + (isNaN(x2=parseFloat(el.css('border-'+(t=='width'?'right':'bottom')+'-width'))) ? 0 : x2)
                  )
               }
            $(this).css(t,ret)
            })
         return this
         }
      }
   function width(val){
      return elSize.call(this,'width',val,2)
      }
   function height(val){
      return elSize.call(this,'height',val,2)
      }
   function outerWidth(val){
      return elSize.call(this,'width',val,0)
      }
   function outerHeight(val){
      return elSize.call(this,'height',val,0)
      }
   function innerWidth(val){
      return elSize.call(this,'width',val,1)
      }
   function innerHeight(val){
      return elSize.call(this,'height',val,1)
      }

   $.fn={yup:ver}
   
   function each(cb) {
      var i, t=this, eL=t.length
      for(i=0;i<eL;i++) if(cb.call(t[i],i,t[i])===false) break
      return(t)
   }
 
   function get(i) {
      var ret
      if(i!==Undef) ret=this[i]
      else {
         ret=[]
         for(i in this) if(!isNaN(i)) ret.push(this[i])
         }
      return ret
      }
  
   function eq(i) {
      var sel=this.selector
      if(!i) i=0; else i=parseFloat(i)
      sel+='.slice('+i+','+(parseInt(i,10)+1)+')'
      return getObject(this.slice(i,i+1), sel)
      }

   function attr(k,v) {
      var k,v,i,el
      if((typeof k)=='object') {
         for(i in k) this.attr(i,k[i])
         return this
      }
      else if(v!=Undef) {
         this.each(function() {
            // установка значения
            var el=this
            if(v===false || v===null) el.removeAttribute(k)
            else {
               el.setAttribute(k,v )
            }
            if(k=='value') el.value=v
         })
         return this
      }
      else {
         // получение
         var el=this[0], ret
         if(el) {
            if(k=='value') ret=el.value
            else ret=el.getAttribute(k)
            return ret
         }
      }
   }
   
   function after(content) {
      var cont=((typeof content) == 'function' ? content.call(this) : content)
      this.each(function() {
         // для каждого элемента в селекторе
         var par=this.parentNode, nxt=this.nextSibling
         if((typeof cont)=='string') {
            var el=getEl()
            $(el).html(cont).contents().each(function() {
               if(nxt) par.insertBefore(this,nxt)
               else par.appendChild(this)
               })
            }
         else if((typeof cont)=='object') {
            if($.inArray(cont.nodeType,[1,3])>-1) {
               if(nxt) par.insertBefore(cont,nxt)
               else par.appendChild(cont)
               }
            }
         })
      return this
      }

   function before(content) {
      var cont=((typeof content) == 'function' ? content.call(this) : content)
      return this.each(function() {
         // для каждого элемента в селекторе
         var par=this.parentNode, sEl=this
         if((typeof cont)=='string') {
            var el=getEl()
            $(el).html(cont).contents().each(function() {
               par.insertBefore(this,sEl)
               })
            }
         else if((typeof cont)=='object') {
            if($.inArray(cont.nodeType,[1,3])>-1) {
               par.insertBefore(cont,sEl)
               }
            }
         })
      }

   function append(content) {
      var cont=((typeof content) == 'function' ? content.call(this) : content)
      this.each(function() {
         if((typeof cont)=='string') {
            var el=getEl(),cts=this
            $(el).html(cont).contents().each(function() {
               cts.appendChild(this)
               })
            }
         else if((typeof cont)=='object') {
            if($.inArray(cont.nodeType,[1,3])>-1) {
               this.appendChild(cont)
               }
            }
         })
      return this
      }

   function prepend(content) {
      var cont=((typeof content) == 'function' ? content.call(this) : content)
      this.each(function() {
         var cts=this, fEl=$(cts).contents().first().get(0)
         if((typeof cont)=='string') {
            var el=getEl()
            $(el).html(cont).contents().each(function(i) {
               if(!fEl && i==0) {cts.appendChild(this);fEl=this}
               else cts.insertBefore(this,fEl)
               })
            }
         else if((typeof cont)=='object') {
            if(cont.yup) {
               cont=cont.get(0)
               }
            else if($.inArray(cont.nodeType,[1,3])>-1) {
               if(!fEl) cts.appendChild(cont)
               else cts.insertBefore(cont,fEl)
               }
            }
         })
      return this
      }
   
   function text(txt) {
      if(txt===Undef) {
         var ret=''
         this.each(function() {
            ret += Sizzle.getText(this)
            })
         return(ret)
         }
      else {
         this.each(function(i) {
            var content=((typeof txt) == 'function' ? txt.call(this,i) : txt)
            if(this.innerText===Undef) this.textContent=content
            else this.innerText=content
            })
         return this
         }
      }


   function getEl(tagN) {
      return(Doc.createElement(tagN || "DIV"))
      }

   function parent() {
      var mm=[]
      this.each(function(i) {
         var el=this.parentNode
         if(el && $.inArray(el,mm)<0) mm.push(el)
         })
      return getObject(mm,this.selector+'.parent()')
      }
   
   function children(sel) {
      var ret=[] // nodeType== (3-textNode 1-DOMElement)
      this.each(function() {
         var nodes=this.childNodes,i
         for(i in nodes) if(nodes[i] && nodes[i].nodeType==1) ret.push(nodes[i])
         })
      if(sel) ret=Sizzle.matches(sel,ret)
      return getObject(ret,this.selector+'.children()')
      }

   function wrap(in1) {
      var ret=[]
      this.each(function() {
         var el=getEl(), cEl, lEl, oldEl
         $(el).html(in1)
         cEl=el; while(cEl=$(cEl).children().get(0)) lEl=cEl
         oldEl=$(this).replaceWith($(el).children().get(0)).get(0)
         lEl.appendChild(oldEl)
         })
      return this
      }

   function replaceWith(in1) {
      this.each(function() {
         var nxt=$(this).get(0).nextSibling, par=$(this).parent().get(0), ar, el=getEl()
         if((typeof in1)=='string') {
            $(el).html(in1)
            $(el).contents().each(function() {
               if(nxt) par.insertBefore(this, nxt)
               else par.appendChild(this)
               })
            }
         else if((typeof in1)=='object') {
            if(in1.nodeType==1) {
               par.insertBefore(in1, nxt || null)             
               }
            else if(in1.yup){
               in1.each(function(){
                  par.insertBefore(this, nxt || null)
                  })
               }
            }
         $(this).remove()
         })
      return this
      }
   
   function remove() {
      this.each(function() {
         $(this).parent().get(0).removeChild(this)
         })
      return this
      }
   
   function contents() {
      var ret=[]
      this.each(function() {
         var nodes=this.childNodes,i
         for(i in nodes) if(nodes[i].nodeType) ret.push(nodes[i])
         })
      return getObject(ret,this.selector+'.contents()')
      }
   
   function next() {
      return travers.call(this,'next')
      }

   function prev() {
      return travers.call(this,'prev')
      }

   function travers(dir,all) {
      var ret=[], prop
      if(dir=='prev') prop='previousSibling'
      if(dir=='next') prop='nextSibling'
      this.each(function() {
         var cEl=this[prop]
         if(!all) while(cEl && cEl.nodeType!=1) {
            cEl=cEl[prop]
            if(!cEl) break
            }
         if(cEl) ret.push(cEl)
         })
      return getObject(ret,this.selector+'.'+dir+'()')
      }

   function parentsUntil(sEl) {
      var mm=[],ret
      this.each(function(i) {
         var el=this, pars=[]
         while( (el=el.parentNode)) {
            var stop=0
            if(sEl) {
               if((typeof sEl)=='string') {
                  if(Sizzle.matches(sEl,[el]).length) stop=1
                  }
               else if(sEl===el) stop=1
               if(stop) break;
               else
                  if($.inArray(el,mm)<0) mm.push(el)
               }
            }
         })
      return getObject(mm,this.selector+'.parent()')
      }

   function wrapAll(in1) {
      var el=getEl(),cEl,lEl,fEl
      $(el).html(in1)
      cEl=el; while(cEl=$(cEl).children().get(0)) lEl=cEl
      this.each(function(i) {
         if(i==0) {var oEl=$(this).replaceWith($(el).children().get(0)).get(0); lEl.appendChild(oEl)}
         else lEl.appendChild(this)
         })
      return this
      }
   
   
   function find(sel) {
      var ret=[]
      this.each(function() {
         // this - элемент в цикле выбранных
         var cont=this,i,ar,iL
         if($.isString(sel)) {
            ar=Sizzle(sel,this); iL=ar.length
            for(i=0;i<iL;i++)
               if($.inArray(ar[i],ret)<0) ret.push(ar[i])
            }
         else if($.isPlainObject(sel)) {
            if(sel.yup) {
               sel.each(function() {
                  if($(cont).find(this)[0]) ret.push(el)
                  })
               }
            else if(sel.nodeType) {
               // sel - DOM-элемент
               var cEl=sel,found=0
               while(cEl=cEl.parentNode) {
                  if(cEl==cont){found=1;break}
                  }
               if(found) ret.push(sel)
               }
            }
         })
      return getObject(ret,this.selector+' '+sel)
      }
   
   function first() {
      return getObject(this.slice(0,1), this.selector+'.slice(0,1)')
      }
   function last() {
      return getObject(this.slice(-1), this.selector+'.slice(-1)')
      }
   
   function offset() {
      var y=0,x=0,el=this[0], bw,bh, i=0, sc, isB
      if(el) {
         while(el) {
            if(/body|html/i.test(el.tagName)) isB=1
            y+=parseInt(el.offsetTop,10) + (i ? (isNaN((bh=parseInt($(el).css('border-top-width'),10))) ? 0 : bh) : 0) - ((sc=el.scrollTop) > 0 && !isB ? sc : 0)
            x+=parseInt(el.offsetLeft,10) + (i ? (isNaN((bw=parseInt($(el).css('border-left-width'),10))) ? 0 : bw) : 0) - ((sc=el.scrollLeft) > 0 && !isB ? sc : 0)
            el = el.offsetParent; i++;
            }
         return {top: y, left: x}
         }
      else return null
      }
   
   var fx=(function($) {
      var 
         aniEls=[], // массив объектов, содержащих информацию о каждом анимированном DOM-объекте 
            /* {
               el : DOMEl,
               cb : callback 
               dur : длительность анимации
               done : 0..1, прогресс
               queue : [], очередь следующих анимаций
               props : - конечные свойства
               initP : - начальные св-ва
               }  */
                     // пока есть хотябы один элемент => идет анимация
         stepDelay=10, // задержка в ms между каждой итерацией анимации
         aniAttr = 'yupAnimation', // свойство DOM-элемента, добавляемое, чтобы видеть, что он анимирован (значение будет содержать индекс в aniEls)
         Und = undefined,
         active = 0, // работает ли анимация
         lastIt
         
      function animate(el,props,dur,cb) {
         // добавляет анимацию к элементу
         // создает элемент анимации или ставит в очередь, если уже анимация начата
         var initProps={}, prop, cssVal, aniX, sign, ao
         if(dur=='slow') dur=600
         else if(dur=='fast') dur=200
         
         if((aniX=el[aniAttr])==Und) {
            // если есть анимация у элемента, то у него свойство yupAnimation установлено в индекс объектов aniEls, но ведь при окончании
            // анимации могут удаляться элементы из середины, следовательно индексы других  анимирующихся элементов должны быть на единицу сдвинуты
            // создаем анимацию
            // начальные параметры = вычисленные
            // обработка относительных значений (+= -=)
            for(prop in props) {
               initProps[prop]=elProp(el,prop)
               sign=props[prop].toString().substr(0,2)
               if(sign=='+=') props[prop] = parseFloat(initProps[prop])+parseFloat(props[prop].substr(2))
               if(sign=='-=') props[prop] = parseFloat(initProps[prop])-parseFloat(props[prop].substr(2))
               }
            aniEls.push({
               el : el,
               cb : cb,
               dur : dur,
               done : 0,
               props : props,
               initP : initProps,
               queue : []
               })
            el[aniAttr]=aniEls.length-1
            }
         else {
            // анимация уже есть => ставим в очередь
            // начальные параметры = параметры последней анимации
            // + относительные значение
            ao = aniEls[aniX]
            ao.queue.push({
               cb : cb,
               dur : dur,
               props : props
               })
            }
         
         if(!active) {
            active=1;
            lastIt = new Date()
            Win.setTimeout(iterate,stepDelay)
            }
         }
         
      function iterate() {
         // циклическая итерация, до тех пор пока есть элементы для анимации
         // this -
         var curIt = new Date(), late = parseInt(curIt-lastIt,10)-stepDelay
         lastIt = curIt
         if(aniEls.length) {
            // есть элементы для анимации
            var i, ao, prop, v1, v2, x, eas, duration, easing
            for(i in aniEls) {
               // для каждого элемента, который анимируется
               ao=aniEls[i]
               duration = $.isPlainObject(ao.dur) ? (ao.dur.duration || 400) : ao.dur

               ao.done += (stepDelay + late) / duration
               x=ao.done
               
               eas = $.isPlainObject(ao.dur) && ao.dur.easing && ao.dur.easing=='linear' ? x : (-0.12 * Math.sin(2 * 3.141592654 * x) + x)
               
               if(x < 1) {
                  // анимация еще не закончена
                  for(prop in ao.props) {
                     // для каждого свойства
                     v1=getN(ao.initP[prop])
                     v2=getN(ao.props[prop])
                     elProp(ao.el, prop, (v2-v1)*eas+v1)
                     }
                  }
               else {
                  // закончилась текущая анимация
                  for(prop in ao.props) {
                     // для каждого свойства -> устанавливаем конечные значения
                     v2=parseFloat(ao.props[prop])
                     elProp(ao.el, prop, v2)
                     }
                  if(ao.cb) ao.cb.call(ao.el)
                  if(ao.queue.length) {
                     // есть очередь - заряжаем новую анимацию
                     var qarr=ao.queue.splice(0,1), ao2=qarr[0], prop, sign, props
                     ao.done=0
                     ao.cb=ao2.cb
                     ao.initP=ao.props
                     // отработка относительных значений
                     props = ao2.props
                     for(prop in props) {
                        sign=props[prop].toString().substr(0,2)
                        if(sign=='+=') props[prop] = parseFloat(ao.initP[prop])+parseFloat(props[prop].substr(2))
                        if(sign=='-=') props[prop] = parseFloat(ao.initP[prop])-parseFloat(props[prop].substr(2))
                        }
                     ao.props=props
                     // и еще присоединить к initP (вычислить) свойства, которых не было в предыдущих анимациях
                     for(var k in props) {
                        if(ao.initP[k]==Und) {
                           ao.initP[k] = elProp(ao.el,k)
                           }
                        }
                     ao.dur=ao2.dur
                     }
                  else {
                     // очереди нет
                     // удаляем элемент из массива анимаций и аттрибут анимированности у элемента
                     var cnt=aniEls.length, j
                     ao.el[aniAttr]=Und
                     aniEls.splice(i,1)
                     // сдвигаем индексы в оставшихся анимированных элементах
                     for(j=i; j<aniEls.length; j++) {
                        aniEls[j].el[aniAttr]--
                        }
                     }
                  }
               // конец цикла по элементам
               }
            // проверим, остались ли еще элементы для анимации
            if(aniEls.length) {
               // если остались, то повторим итерацию
               if(late >= stepDelay) {
                  iterate()
                  }
               else {
                  Win.setTimeout(iterate,stepDelay-late)
                  }
               }
            else active=0
            }
         else {
            // нет элементов для анимации
            active=0
            }
         }
      
      function elProp(el,prop,val) {
         // возвращает/задает значение свойства
         var ret
         if(prop=='scrollLeft') {
            ret=$(el).scrollLeft(val)
            }
         else if(prop=='scrollTop') {
            ret=$(el).scrollTop(val)
            }
         else {
            ret=$(el).css(prop,val)
            }
         return ret
         }
      
      return {
         animate : animate
         }
      }) ($)
   
   

      
   function animate(props,dur,cb) {
      this.each(function() {
         fx.animate(this,props,dur,cb)
         })
      return this
      }
   function fadeIn(dur,cb) {
      var dur2 = (dur===Undef ? 400 : dur)
      this.each(function() {
         var dp=''
         if($(this).css('display','').css('display')=='none') dp='block'
         $(this).css({'display':dp, opacity:0}).animate({opacity:1},dur2, cb)
         })
      return this
      }
   function fadeOut(dur,cb) {
      var dur2 = (dur===Undef ? 400 : dur)
      this.animate({opacity:0}, dur2, function(){
         $(this).css('display','none')
         if(cb) cb.call(this)
         })
      return this
      }
   function fadeTo(dur,opac,cb) {
      var dur2 = (dur==Undef ? 400 : dur)
      this.each(function() {
         var dp=''
         if($(this).css('display','').css('display')=='none') dp='block'
         $(this).css({'display':dp}).animate({opacity:opac},dur2, cb)
         })
      return this
      }



   function overlay(d,o) {
      var cali=overlay
      cali.r={}
      for(cali.k in d) {
         cali.r[cali.k] = d[cali.k];
         }
      for(cali.k in o) {
         cali.r[cali.k] = o[cali.k];
         }
      return cali.r;
      }

   function context(conf) {
      return overlay({
         obj:Win, 
         fn:function(){},
         call:function() {
            arg=[].slice.call(arguments);
            this.fn.apply(this.obj,arg);
            },
         ret_fn:function() {
            var cali=arguments.callee
            arg=[].slice.call(arguments);
            cali.conf.call.apply(cali.conf,arg);
            },
         get_fn:function() {
            this.ret_fn.conf=this;
            return this.ret_fn;
            }
         },
         conf);
      }

   
   function ready(cb) {
      if(!this[0])
         $(Win).on('load',cb)
      else this.each(function() {
         $(this).on('load',cb)
         })
      return this
      }

   function focus() {
      var el
      if(el=this[0]) {
         if($(el).css('display')!=='none' && !el.disabled) el.focus()
         }
      return this
      }

   function count() {
      return this.length
      }

   function delay(ms, cb) {
      this.animate({},ms, cb)
      return this
      }

   function scrollLT(dir,scr) {
      var sc='scroll'+dir, dEl='documentElement', el
      if(scr!==Undef) {
         // установка скролла
         scr=getN(scr)
         return this.each(function() {
            el=this
            if(el.tagName=="BODY" || el==Doc) {
               Doc.body[sc]=scr; Doc[dEl][sc]=scr
            } else el[sc]=scr
         })
      } else {
         el=this[0]
         if(el) return (el.tagName=="BODY" || el==Doc) ? Math.max(getN(Doc[dEl][sc]), getN(Doc.body[sc])) : el[sc]
         else return null
      }
   }
      
   function getN(n) {
      var v;return isNaN(v=parseFloat(n)) ? 0 : v
   }
   
   function scrollLeft(scr) {
      return scrollLT.call(this,'Left',scr)
      }
   function scrollTop(scr) {
      return scrollLT.call(this,'Top',scr)
      }
   
   function toggleClass(cls) {
      this.each(function() {
         var el=$(this)
         if(el.hasClass(cls)) el.removeClass(cls); else el.addClass(cls)
         })
      return this
      }
   
   function empty() {
      this.find('*').each(function() {
         var dh
         if(dh=this.yupData)
            $data.hash[dh] = null
         if(dh=this.yupEventHandle)
            events.handlers[dh] = null
         })
      return this.html('')
      }
   
   function filter(sel) {
      var i,ret=[] // nodeType== (3-textNode 1-DOMElement)
      this.each(function() {
         var el = this
         if($.isPlainObject(sel)) {
            if(sel.yup) {
               // другой yup-объект
               sel.each(function(j) {
                  var el2 = this
                  if(el === el2) {ret.push(el); return false}
                  })
               }
            else if(sel.nodeType==1) {
               // Dom-element
               if(el === sel) {ret.push(el); return false}
               }
            }
         else ret.push(this)
         })

      if($.isString(sel)) {
         // если селектор
         ret=Sizzle.matches(sel,ret)
         }
      return getObject(ret,this.selector+'.filter('+sel+')')
      }
   
   $.context=context

   function getObject(matches,selector) {
      // главная функция, возвращающая jQuery-подобный объект
      var i, yupObj=matches
      $.extend(yupObj,{
         'length' : matches.length,
         addClass : addClass,
         after : after,
         animate : animate,
         append : append,
         attr : attr,
         before : before,
         children : children,
         contents : contents,
         count : count,
         css : css,
         data : data,
         delay : delay,
         each : each,
         eq : eq,
         empty : empty,
         fadeIn : fadeIn,
         fadeOut : fadeOut,
         fadeTo : fadeTo,
         filter : filter,
         find : find,
         first : first,
         focus : focus,
         get : get,
         hasClass : hasClass,
         height : height,
         html : html,
         innerWidth : innerWidth,
         innerHeight : innerHeight,
         last : last,
         next : next,
         off : off,
         offset : offset,
         on : on,
         outerWidth : outerWidth,
         outerHeight : outerHeight,
         parent : parent,
         parentsUntil : parentsUntil,
         prepend : prepend,
         prev : prev,
         ready : ready,
         remove : remove,
         removeClass : removeClass,
         replaceWith : replaceWith,
         scrollLeft : scrollLeft,
         scrollTop : scrollTop,
         selector : selector,
         text : text,
         toggleClass : toggleClass,
         trigger : trigger,
         width : width,//n width
         wrap : wrap,
         wrapAll : wrapAll
         })
      $.extend(yupObj,$.fn)
      return(yupObj)
      }
   // Expose
   Win.Yup=window.$=Yup
   })();


/*
Sizzle 1.5.1 * Copyright 2011, The Dojo Foundation
*/
(function(){

var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
   expando = "sizcache" + (Math.random() + '').replace('.', ''),
   done = 0,
   toString = Object.prototype.toString,
   hasDuplicate = false,
   baseHasDuplicate = true,
   rBackslash = /\\/g,
   rReturn = /\r\n/g,
   rNonWord = /\W/;

// Here we check if the JavaScript engine is using some sort of
// optimization where it does not always call our comparision
// function. If that is the case, discard the hasDuplicate value.
//   Thus far that includes Google Chrome.
[0, 0].sort(function() {
   baseHasDuplicate = false;
   return 0;
});

var Sizzle = function( selector, context, results, seed ) {
   results = results || [];
   context = context || document;

   var origContext = context;

   if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
      return [];
   }

   if ( !selector || typeof selector !== "string" ) {
      return results;
   }

   var m, set, checkSet, extra, ret, cur, pop, i,
      prune = true,
      contextXML = Sizzle.isXML( context ),
      parts = [],
      soFar = selector;

   // Reset the position of the chunker regexp (start from head)
   do {
      chunker.exec( "" );
      m = chunker.exec( soFar );

      if ( m ) {
         soFar = m[3];

         parts.push( m[1] );

         if ( m[2] ) {
            extra = m[3];
            break;
         }
      }
   } while ( m );

   if ( parts.length > 1 && origPOS.exec( selector ) ) {

      if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
         set = posProcess( parts[0] + parts[1], context, seed );

      } else {
         set = Expr.relative[ parts[0] ] ?
            [ context ] :
            Sizzle( parts.shift(), context );

         while ( parts.length ) {
            selector = parts.shift();

            if ( Expr.relative[ selector ] ) {
               selector += parts.shift();
            }

            set = posProcess( selector, set, seed );
         }
      }

   } else {
      // Take a shortcut and set the context if the root selector is an ID
      // (but not if it'll be faster if the inner selector is an ID)
      if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
            Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {

         ret = Sizzle.find( parts.shift(), context, contextXML );
         context = ret.expr ?
            Sizzle.filter( ret.expr, ret.set )[0] :
            ret.set[0];
      }

      if ( context ) {
         ret = seed ?
            { expr: parts.pop(), set: makeArray(seed) } :
            Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );

         set = ret.expr ?
            Sizzle.filter( ret.expr, ret.set ) :
            ret.set;

         if ( parts.length > 0 ) {
            checkSet = makeArray( set );

         } else {
            prune = false;
         }

         while ( parts.length ) {
            cur = parts.pop();
            pop = cur;

            if ( !Expr.relative[ cur ] ) {
               cur = "";
            } else {
               pop = parts.pop();
            }

            if ( pop == null ) {
               pop = context;
            }

            Expr.relative[ cur ]( checkSet, pop, contextXML );
         }

      } else {
         checkSet = parts = [];
      }
   }

   if ( !checkSet ) {
      checkSet = set;
   }

   if ( !checkSet ) {
      Sizzle.error( cur || selector );
   }

   if ( toString.call(checkSet) === "[object Array]" ) {
      if ( !prune ) {
         results.push.apply( results, checkSet );

      } else if ( context && context.nodeType === 1 ) {
         for ( i = 0; checkSet[i] != null; i++ ) {
            if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && Sizzle.contains(context, checkSet[i])) ) {
               results.push( set[i] );
            }
         }

      } else {
         for ( i = 0; checkSet[i] != null; i++ ) {
            if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
               results.push( set[i] );
            }
         }
      }

   } else {
      makeArray( checkSet, results );
   }

   if ( extra ) {
      Sizzle( extra, origContext, results, seed );
      Sizzle.uniqueSort( results );
   }

   return results;
};

Sizzle.uniqueSort = function( results ) {
   if ( sortOrder ) {
      hasDuplicate = baseHasDuplicate;
      results.sort( sortOrder );

      if ( hasDuplicate ) {
         for ( var i = 1; i < results.length; i++ ) {
            if ( results[i] === results[ i - 1 ] ) {
               results.splice( i--, 1 );
            }
         }
      }
   }

   return results;
};

Sizzle.matches = function( expr, set ) {
   return Sizzle( expr, null, null, set );
};

Sizzle.matchesSelector = function( node, expr ) {
   return Sizzle( expr, null, null, [node] ).length > 0;
};

Sizzle.find = function( expr, context, isXML ) {
   var set, i, len, match, type, left;

   if ( !expr ) {
      return [];
   }

   for ( i = 0, len = Expr.order.length; i < len; i++ ) {
      type = Expr.order[i];

      if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
         left = match[1];
         match.splice( 1, 1 );

         if ( left.substr( left.length - 1 ) !== "\\" ) {
            match[1] = (match[1] || "").replace( rBackslash, "" );
            set = Expr.find[ type ]( match, context, isXML );

            if ( set != null ) {
               expr = expr.replace( Expr.match[ type ], "" );
               break;
            }
         }
      }
   }

   if ( !set ) {
      set = typeof context.getElementsByTagName !== "undefined" ?
         context.getElementsByTagName( "*" ) :
         [];
   }

   return { set: set, expr: expr };
};

Sizzle.filter = function( expr, set, inplace, not ) {
   var match, anyFound,
      type, found, item, filter, left,
      i, pass,
      old = expr,
      result = [],
      curLoop = set,
      isXMLFilter = set && set[0] && Sizzle.isXML( set[0] );

   while ( expr && set.length ) {
      for ( type in Expr.filter ) {
         if ( (match = Expr.leftMatch[ type ].exec( expr )) != null && match[2] ) {
            filter = Expr.filter[ type ];
            left = match[1];

            anyFound = false;

            match.splice(1,1);

            if ( left.substr( left.length - 1 ) === "\\" ) {
               continue;
            }

            if ( curLoop === result ) {
               result = [];
            }

            if ( Expr.preFilter[ type ] ) {
               match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

               if ( !match ) {
                  anyFound = found = true;

               } else if ( match === true ) {
                  continue;
               }
            }

            if ( match ) {
               for ( i = 0; (item = curLoop[i]) != null; i++ ) {
                  if ( item ) {
                     found = filter( item, match, i, curLoop );
                     pass = not ^ found;

                     if ( inplace && found != null ) {
                        if ( pass ) {
                           anyFound = true;

                        } else {
                           curLoop[i] = false;
                        }

                     } else if ( pass ) {
                        result.push( item );
                        anyFound = true;
                     }
                  }
               }
            }

            if ( found !== undefined ) {
               if ( !inplace ) {
                  curLoop = result;
               }

               expr = expr.replace( Expr.match[ type ], "" );

               if ( !anyFound ) {
                  return [];
               }

               break;
            }
         }
      }

      // Improper expression
      if ( expr === old ) {
         if ( anyFound == null ) {
            Sizzle.error( expr );

         } else {
            break;
         }
      }

      old = expr;
   }

   return curLoop;
};

Sizzle.error = function( msg ) {
   throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Utility function for retreiving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
var getText = Sizzle.getText = function( elem ) {
    var i, node,
      nodeType = elem.nodeType,
      ret = "";

   if ( nodeType ) {
      if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
         // Use textContent || innerText for elements
         if ( typeof elem.textContent === 'string' ) {
            return elem.textContent;
         } else if ( typeof elem.innerText === 'string' ) {
            // Replace IE's carriage returns
            return elem.innerText.replace( rReturn, '' );
         } else {
            // Traverse it's children
            for ( elem = elem.firstChild; elem; elem = elem.nextSibling) {
               ret += getText( elem );
            }
         }
      } else if ( nodeType === 3 || nodeType === 4 ) {
         return elem.nodeValue;
      }
   } else {

      // If no nodeType, this is expected to be an array
      for ( i = 0; (node = elem[i]); i++ ) {
         // Do not traverse comment nodes
         if ( node.nodeType !== 8 ) {
            ret += getText( node );
         }
      }
   }
   return ret;
};

var Expr = Sizzle.selectors = {
   order: [ "ID", "NAME", "TAG" ],

   match: {
      ID: /#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
      CLASS: /\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
      NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,
      ATTR: /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,
      TAG: /^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,
      CHILD: /:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,
      POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,
      PSEUDO: /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/
   },

   leftMatch: {},

   attrMap: {
      "class": "className",
      "for": "htmlFor"
   },

   attrHandle: {
      href: function( elem ) {
         return elem.getAttribute( "href" );
      },
      type: function( elem ) {
         return elem.getAttribute( "type" );
      }
   },

   relative: {
      "+": function(checkSet, part){
         var isPartStr = typeof part === "string",
            isTag = isPartStr && !rNonWord.test( part ),
            isPartStrNotTag = isPartStr && !isTag;

         if ( isTag ) {
            part = part.toLowerCase();
         }

         for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
            if ( (elem = checkSet[i]) ) {
               while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

               checkSet[i] = isPartStrNotTag || elem && elem.nodeName.toLowerCase() === part ?
                  elem || false :
                  elem === part;
            }
         }

         if ( isPartStrNotTag ) {
            Sizzle.filter( part, checkSet, true );
         }
      },

      ">": function( checkSet, part ) {
         var elem,
            isPartStr = typeof part === "string",
            i = 0,
            l = checkSet.length;

         if ( isPartStr && !rNonWord.test( part ) ) {
            part = part.toLowerCase();

            for ( ; i < l; i++ ) {
               elem = checkSet[i];

               if ( elem ) {
                  var parent = elem.parentNode;
                  checkSet[i] = parent.nodeName.toLowerCase() === part ? parent : false;
               }
            }

         } else {
            for ( ; i < l; i++ ) {
               elem = checkSet[i];

               if ( elem ) {
                  checkSet[i] = isPartStr ?
                     elem.parentNode :
                     elem.parentNode === part;
               }
            }

            if ( isPartStr ) {
               Sizzle.filter( part, checkSet, true );
            }
         }
      },

      "": function(checkSet, part, isXML){
         var nodeCheck,
            doneName = done++,
            checkFn = dirCheck;

         if ( typeof part === "string" && !rNonWord.test( part ) ) {
            part = part.toLowerCase();
            nodeCheck = part;
            checkFn = dirNodeCheck;
         }

         checkFn( "parentNode", part, doneName, checkSet, nodeCheck, isXML );
      },

      "~": function( checkSet, part, isXML ) {
         var nodeCheck,
            doneName = done++,
            checkFn = dirCheck;

         if ( typeof part === "string" && !rNonWord.test( part ) ) {
            part = part.toLowerCase();
            nodeCheck = part;
            checkFn = dirNodeCheck;
         }

         checkFn( "previousSibling", part, doneName, checkSet, nodeCheck, isXML );
      }
   },

   find: {
      ID: function( match, context, isXML ) {
         if ( typeof context.getElementById !== "undefined" && !isXML ) {
            var m = context.getElementById(match[1]);
            // Check parentNode to catch when Blackberry 4.6 returns
            // nodes that are no longer in the document #6963
            return m && m.parentNode ? [m] : [];
         }
      },

      NAME: function( match, context ) {
         if ( typeof context.getElementsByName !== "undefined" ) {
            var ret = [],
               results = context.getElementsByName( match[1] );

            for ( var i = 0, l = results.length; i < l; i++ ) {
               if ( results[i].getAttribute("name") === match[1] ) {
                  ret.push( results[i] );
               }
            }

            return ret.length === 0 ? null : ret;
         }
      },

      TAG: function( match, context ) {
         if ( typeof context.getElementsByTagName !== "undefined" ) {
            return context.getElementsByTagName( match[1] );
         }
      }
   },
   preFilter: {
      CLASS: function( match, curLoop, inplace, result, not, isXML ) {
         match = " " + match[1].replace( rBackslash, "" ) + " ";

         if ( isXML ) {
            return match;
         }

         for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
            if ( elem ) {
               if ( not ^ (elem.className && (" " + elem.className + " ").replace(/[\t\n\r]/g, " ").indexOf(match) >= 0) ) {
                  if ( !inplace ) {
                     result.push( elem );
                  }

               } else if ( inplace ) {
                  curLoop[i] = false;
               }
            }
         }

         return false;
      },

      ID: function( match ) {
         return match[1].replace( rBackslash, "" );
      },

      TAG: function( match, curLoop ) {
         return match[1].replace( rBackslash, "" ).toLowerCase();
      },

      CHILD: function( match ) {
         if ( match[1] === "nth" ) {
            if ( !match[2] ) {
               Sizzle.error( match[0] );
            }

            match[2] = match[2].replace(/^\+|\s*/g, '');

            // parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
            var test = /(-?)(\d*)(?:n([+\-]?\d*))?/.exec(
               match[2] === "even" && "2n" || match[2] === "odd" && "2n+1" ||
               !/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

            // calculate the numbers (first)n+(last) including if they are negative
            match[2] = (test[1] + (test[2] || 1)) - 0;
            match[3] = test[3] - 0;
         }
         else if ( match[2] ) {
            Sizzle.error( match[0] );
         }

         // TODO: Move to normal caching system
         match[0] = done++;

         return match;
      },

      ATTR: function( match, curLoop, inplace, result, not, isXML ) {
         var name = match[1] = match[1].replace( rBackslash, "" );

         if ( !isXML && Expr.attrMap[name] ) {
            match[1] = Expr.attrMap[name];
         }

         // Handle if an un-quoted value was used
         match[4] = ( match[4] || match[5] || "" ).replace( rBackslash, "" );

         if ( match[2] === "~=" ) {
            match[4] = " " + match[4] + " ";
         }

         return match;
      },

      PSEUDO: function( match, curLoop, inplace, result, not ) {
         if ( match[1] === "not" ) {
            // If we're dealing with a complex expression, or a simple one
            if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
               match[3] = Sizzle(match[3], null, null, curLoop);

            } else {
               var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);

               if ( !inplace ) {
                  result.push.apply( result, ret );
               }

               return false;
            }

         } else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
            return true;
         }

         return match;
      },

      POS: function( match ) {
         match.unshift( true );

         return match;
      }
   },

   filters: {
      enabled: function( elem ) {
         return elem.disabled === false && elem.type !== "hidden";
      },

      disabled: function( elem ) {
         return elem.disabled === true;
      },

      checked: function( elem ) {
         return elem.checked === true;
      },

      selected: function( elem ) {
         // Accessing this property makes selected-by-default
         // options in Safari work properly
         if ( elem.parentNode ) {
            elem.parentNode.selectedIndex;
         }

         return elem.selected === true;
      },

      parent: function( elem ) {
         return !!elem.firstChild;
      },

      empty: function( elem ) {
         return !elem.firstChild;
      },

      has: function( elem, i, match ) {
         return !!Sizzle( match[3], elem ).length;
      },

      header: function( elem ) {
         return (/h\d/i).test( elem.nodeName );
      },

      text: function( elem ) {
         var attr = elem.getAttribute( "type" ), type = elem.type;
         // IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
         // use getAttribute instead to test this case
         return elem.nodeName.toLowerCase() === "input" && "text" === type && ( attr === type || attr === null );
      },

      radio: function( elem ) {
         return elem.nodeName.toLowerCase() === "input" && "radio" === elem.type;
      },

      checkbox: function( elem ) {
         return elem.nodeName.toLowerCase() === "input" && "checkbox" === elem.type;
      },

      file: function( elem ) {
         return elem.nodeName.toLowerCase() === "input" && "file" === elem.type;
      },

      password: function( elem ) {
         return elem.nodeName.toLowerCase() === "input" && "password" === elem.type;
      },

      submit: function( elem ) {
         var name = elem.nodeName.toLowerCase();
         return (name === "input" || name === "button") && "submit" === elem.type;
      },

      image: function( elem ) {
         return elem.nodeName.toLowerCase() === "input" && "image" === elem.type;
      },

      reset: function( elem ) {
         var name = elem.nodeName.toLowerCase();
         return (name === "input" || name === "button") && "reset" === elem.type;
      },

      button: function( elem ) {
         var name = elem.nodeName.toLowerCase();
         return name === "input" && "button" === elem.type || name === "button";
      },

      input: function( elem ) {
         return (/input|select|textarea|button/i).test( elem.nodeName );
      },

      focus: function( elem ) {
         return elem === elem.ownerDocument.activeElement;
      }
   },
   setFilters: {
      first: function( elem, i ) {
         return i === 0;
      },

      last: function( elem, i, match, array ) {
         return i === array.length - 1;
      },

      even: function( elem, i ) {
         return i % 2 === 0;
      },

      odd: function( elem, i ) {
         return i % 2 === 1;
      },

      lt: function( elem, i, match ) {
         return i < match[3] - 0;
      },

      gt: function( elem, i, match ) {
         return i > match[3] - 0;
      },

      nth: function( elem, i, match ) {
         return match[3] - 0 === i;
      },

      eq: function( elem, i, match ) {
         return match[3] - 0 === i;
      }
   },
   filter: {
      PSEUDO: function( elem, match, i, array ) {
         var name = match[1],
            filter = Expr.filters[ name ];

         if ( filter ) {
            return filter( elem, i, match, array );

         } else if ( name === "contains" ) {
            return (elem.textContent || elem.innerText || getText([ elem ]) || "").indexOf(match[3]) >= 0;

         } else if ( name === "not" ) {
            var not = match[3];

            for ( var j = 0, l = not.length; j < l; j++ ) {
               if ( not[j] === elem ) {
                  return false;
               }
            }

            return true;

         } else {
            Sizzle.error( name );
         }
      },

      CHILD: function( elem, match ) {
         var first, last,
            doneName, parent, cache,
            count, diff,
            type = match[1],
            node = elem;

         switch ( type ) {
            case "only":
            case "first":
               while ( (node = node.previousSibling) ) {
                  if ( node.nodeType === 1 ) {
                     return false;
                  }
               }

               if ( type === "first" ) {
                  return true;
               }

               node = elem;

               /* falls through */
            case "last":
               while ( (node = node.nextSibling) ) {
                  if ( node.nodeType === 1 ) {
                     return false;
                  }
               }

               return true;

            case "nth":
               first = match[2];
               last = match[3];

               if ( first === 1 && last === 0 ) {
                  return true;
               }

               doneName = match[0];
               parent = elem.parentNode;

               if ( parent && (parent[ expando ] !== doneName || !elem.nodeIndex) ) {
                  count = 0;

                  for ( node = parent.firstChild; node; node = node.nextSibling ) {
                     if ( node.nodeType === 1 ) {
                        node.nodeIndex = ++count;
                     }
                  }

                  parent[ expando ] = doneName;
               }

               diff = elem.nodeIndex - last;

               if ( first === 0 ) {
                  return diff === 0;

               } else {
                  return ( diff % first === 0 && diff / first >= 0 );
               }
         }
      },

      ID: function( elem, match ) {
         return elem.nodeType === 1 && elem.getAttribute("id") === match;
      },

      TAG: function( elem, match ) {
         return (match === "*" && elem.nodeType === 1) || !!elem.nodeName && elem.nodeName.toLowerCase() === match;
      },

      CLASS: function( elem, match ) {
         return (" " + (elem.className || elem.getAttribute("class")) + " ")
            .indexOf( match ) > -1;
      },

      ATTR: function( elem, match ) {
         var name = match[1],
            result = Sizzle.attr ?
               Sizzle.attr( elem, name ) :
               Expr.attrHandle[ name ] ?
               Expr.attrHandle[ name ]( elem ) :
               elem[ name ] != null ?
                  elem[ name ] :
                  elem.getAttribute( name ),
            value = result + "",
            type = match[2],
            check = match[4];

         return result == null ?
            type === "!=" :
            !type && Sizzle.attr ?
            result != null :
            type === "=" ?
            value === check :
            type === "*=" ?
            value.indexOf(check) >= 0 :
            type === "~=" ?
            (" " + value + " ").indexOf(check) >= 0 :
            !check ?
            value && result !== false :
            type === "!=" ?
            value !== check :
            type === "^=" ?
            value.indexOf(check) === 0 :
            type === "$=" ?
            value.substr(value.length - check.length) === check :
            type === "|=" ?
            value === check || value.substr(0, check.length + 1) === check + "-" :
            false;
      },

      POS: function( elem, match, i, array ) {
         var name = match[2],
            filter = Expr.setFilters[ name ];

         if ( filter ) {
            return filter( elem, i, match, array );
         }
      }
   }
};

var origPOS = Expr.match.POS,
   fescape = function(all, num){
      return "\\" + (num - 0 + 1);
   };

for ( var type in Expr.match ) {
   Expr.match[ type ] = new RegExp( Expr.match[ type ].source + (/(?![^\[]*\])(?![^\(]*\))/.source) );
   Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source.replace(/\\(\d+)/g, fescape) );
}
// Expose origPOS
// "global" as in regardless of relation to brackets/parens
Expr.match.globalPOS = origPOS;

var makeArray = function( array, results ) {
   array = Array.prototype.slice.call( array, 0 );

   if ( results ) {
      results.push.apply( results, array );
      return results;
   }

   return array;
};

// Perform a simple check to determine if the browser is capable of
// converting a NodeList to an array using builtin methods.
// Also verifies that the returned array holds DOM nodes
// (which is not the case in the Blackberry browser)
try {
   Array.prototype.slice.call( document.documentElement.childNodes, 0 )[0].nodeType;

// Provide a fallback method if it does not work
} catch( e ) {
   makeArray = function( array, results ) {
      var i = 0,
         ret = results || [];

      if ( toString.call(array) === "[object Array]" ) {
         Array.prototype.push.apply( ret, array );

      } else {
         if ( typeof array.length === "number" ) {
            for ( var l = array.length; i < l; i++ ) {
               ret.push( array[i] );
            }

         } else {
            for ( ; array[i]; i++ ) {
               ret.push( array[i] );
            }
         }
      }

      return ret;
   };
}

var sortOrder, siblingCheck;

if ( document.documentElement.compareDocumentPosition ) {
   sortOrder = function( a, b ) {
      if ( a === b ) {
         hasDuplicate = true;
         return 0;
      }

      if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
         return a.compareDocumentPosition ? -1 : 1;
      }

      return a.compareDocumentPosition(b) & 4 ? -1 : 1;
   };

} else {
   sortOrder = function( a, b ) {
      // The nodes are identical, we can exit early
      if ( a === b ) {
         hasDuplicate = true;
         return 0;

      // Fallback to using sourceIndex (in IE) if it's available on both nodes
      } else if ( a.sourceIndex && b.sourceIndex ) {
         return a.sourceIndex - b.sourceIndex;
      }

      var al, bl,
         ap = [],
         bp = [],
         aup = a.parentNode,
         bup = b.parentNode,
         cur = aup;

      // If the nodes are siblings (or identical) we can do a quick check
      if ( aup === bup ) {
         return siblingCheck( a, b );

      // If no parents were found then the nodes are disconnected
      } else if ( !aup ) {
         return -1;

      } else if ( !bup ) {
         return 1;
      }

      // Otherwise they're somewhere else in the tree so we need
      // to build up a full list of the parentNodes for comparison
      while ( cur ) {
         ap.unshift( cur );
         cur = cur.parentNode;
      }

      cur = bup;

      while ( cur ) {
         bp.unshift( cur );
         cur = cur.parentNode;
      }

      al = ap.length;
      bl = bp.length;

      // Start walking down the tree looking for a discrepancy
      for ( var i = 0; i < al && i < bl; i++ ) {
         if ( ap[i] !== bp[i] ) {
            return siblingCheck( ap[i], bp[i] );
         }
      }

      // We ended someplace up the tree so do a sibling check
      return i === al ?
         siblingCheck( a, bp[i], -1 ) :
         siblingCheck( ap[i], b, 1 );
   };

   siblingCheck = function( a, b, ret ) {
      if ( a === b ) {
         return ret;
      }

      var cur = a.nextSibling;

      while ( cur ) {
         if ( cur === b ) {
            return -1;
         }

         cur = cur.nextSibling;
      }

      return 1;
   };
}

// Check to see if the browser returns elements by name when
// querying by getElementById (and provide a workaround)
(function(){
   // We're going to inject a fake input element with a specified name
   var form = document.createElement("div"),
      id = "script" + (new Date()).getTime(),
      root = document.documentElement;

   form.innerHTML = "<a name='" + id + "'/>";

   // Inject it into the root element, check its status, and remove it quickly
   root.insertBefore( form, root.firstChild );

   // The workaround has to do additional checks after a getElementById
   // Which slows things down for other browsers (hence the branching)
   if ( document.getElementById( id ) ) {
      Expr.find.ID = function( match, context, isXML ) {
         if ( typeof context.getElementById !== "undefined" && !isXML ) {
            var m = context.getElementById(match[1]);

            return m ?
               m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ?
                  [m] :
                  undefined :
               [];
         }
      };

      Expr.filter.ID = function( elem, match ) {
         var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");

         return elem.nodeType === 1 && node && node.nodeValue === match;
      };
   }

   root.removeChild( form );

   // release memory in IE
   root = form = null;
})();

(function(){
   // Check to see if the browser returns only elements
   // when doing getElementsByTagName("*")

   // Create a fake element
   var div = document.createElement("div");
   div.appendChild( document.createComment("") );

   // Make sure no comments are found
   if ( div.getElementsByTagName("*").length > 0 ) {
      Expr.find.TAG = function( match, context ) {
         var results = context.getElementsByTagName( match[1] );

         // Filter out possible comments
         if ( match[1] === "*" ) {
            var tmp = [];

            for ( var i = 0; results[i]; i++ ) {
               if ( results[i].nodeType === 1 ) {
                  tmp.push( results[i] );
               }
            }

            results = tmp;
         }

         return results;
      };
   }

   // Check to see if an attribute returns normalized href attributes
   div.innerHTML = "<a href='#'></a>";

   if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
         div.firstChild.getAttribute("href") !== "#" ) {

      Expr.attrHandle.href = function( elem ) {
         return elem.getAttribute( "href", 2 );
      };
   }

   // release memory in IE
   div = null;
})();

if ( document.querySelectorAll ) {
   (function(){
      var oldSizzle = Sizzle,
         div = document.createElement("div"),
         id = "__sizzle__";

      div.innerHTML = "<p class='TEST'></p>";

      // Safari can't handle uppercase or unicode characters when
      // in quirks mode.
      if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
         return;
      }

      Sizzle = function( query, context, extra, seed ) {
         context = context || document;

         // Only use querySelectorAll on non-XML documents
         // (ID selectors don't work in non-HTML documents)
         if ( !seed && !Sizzle.isXML(context) ) {
            // See if we find a selector to speed up
            var match = /^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec( query );

            if ( match && (context.nodeType === 1 || context.nodeType === 9) ) {
               // Speed-up: Sizzle("TAG")
               if ( match[1] ) {
                  return makeArray( context.getElementsByTagName( query ), extra );

               // Speed-up: Sizzle(".CLASS")
               } else if ( match[2] && Expr.find.CLASS && context.getElementsByClassName ) {
                  return makeArray( context.getElementsByClassName( match[2] ), extra );
               }
            }

            if ( context.nodeType === 9 ) {
               // Speed-up: Sizzle("body")
               // The body element only exists once, optimize finding it
               if ( query === "body" && context.body ) {
                  return makeArray( [ context.body ], extra );

               // Speed-up: Sizzle("#ID")
               } else if ( match && match[3] ) {
                  var elem = context.getElementById( match[3] );

                  // Check parentNode to catch when Blackberry 4.6 returns
                  // nodes that are no longer in the document #6963
                  if ( elem && elem.parentNode ) {
                     // Handle the case where IE and Opera return items
                     // by name instead of ID
                     if ( elem.id === match[3] ) {
                        return makeArray( [ elem ], extra );
                     }

                  } else {
                     return makeArray( [], extra );
                  }
               }

               try {
                  return makeArray( context.querySelectorAll(query), extra );
               } catch(qsaError) {}

            // qSA works strangely on Element-rooted queries
            // We can work around this by specifying an extra ID on the root
            // and working up from there (Thanks to Andrew Dupont for the technique)
            // IE 8 doesn't work on object elements
            } else if ( context.nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
               var oldContext = context,
                  old = context.getAttribute( "id" ),
                  nid = old || id,
                  hasParent = context.parentNode,
                  relativeHierarchySelector = /^\s*[+~]/.test( query );

               if ( !old ) {
                  context.setAttribute( "id", nid );
               } else {
                  nid = nid.replace( /'/g, "\\$&" );
               }
               if ( relativeHierarchySelector && hasParent ) {
                  context = context.parentNode;
               }

               try {
                  if ( !relativeHierarchySelector || hasParent ) {
                     return makeArray( context.querySelectorAll( "[id='" + nid + "'] " + query ), extra );
                  }

               } catch(pseudoError) {
               } finally {
                  if ( !old ) {
                     oldContext.removeAttribute( "id" );
                  }
               }
            }
         }

         return oldSizzle(query, context, extra, seed);
      };

      for ( var prop in oldSizzle ) {
         Sizzle[ prop ] = oldSizzle[ prop ];
      }

      // release memory in IE
      div = null;
   })();
}

(function(){
   var html = document.documentElement,
      matches = html.matchesSelector || html.mozMatchesSelector || html.webkitMatchesSelector || html.msMatchesSelector;

   if ( matches ) {
      // Check to see if it's possible to do matchesSelector
      // on a disconnected node (IE 9 fails this)
      var disconnectedMatch = !matches.call( document.createElement( "div" ), "div" ),
         pseudoWorks = false;

      try {
         // This should fail with an exception
         // Gecko does not error, returns false instead
         matches.call( document.documentElement, "[test!='']:sizzle" );

      } catch( pseudoError ) {
         pseudoWorks = true;
      }

      Sizzle.matchesSelector = function( node, expr ) {
         // Make sure that attribute selectors are quoted
         expr = expr.replace(/\=\s*([^'"\]]*)\s*\]/g, "='$1']");

         if ( !Sizzle.isXML( node ) ) {
            try {
               if ( pseudoWorks || !Expr.match.PSEUDO.test( expr ) && !/!=/.test( expr ) ) {
                  var ret = matches.call( node, expr );

                  // IE 9's matchesSelector returns false on disconnected nodes
                  if ( ret || !disconnectedMatch ||
                        // As well, disconnected nodes are said to be in a document
                        // fragment in IE 9, so check for that
                        node.document && node.document.nodeType !== 11 ) {
                     return ret;
                  }
               }
            } catch(e) {}
         }

         return Sizzle(expr, null, null, [node]).length > 0;
      };
   }
})();

(function(){
   var div = document.createElement("div");

   div.innerHTML = "<div class='test e'></div><div class='test'></div>";

   // Opera can't find a second classname (in 9.6)
   // Also, make sure that getElementsByClassName actually exists
   if ( !div.getElementsByClassName || div.getElementsByClassName("e").length === 0 ) {
      return;
   }

   // Safari caches class attributes, doesn't catch changes (in 3.2)
   div.lastChild.className = "e";

   if ( div.getElementsByClassName("e").length === 1 ) {
      return;
   }

   Expr.order.splice(1, 0, "CLASS");
   Expr.find.CLASS = function( match, context, isXML ) {
      if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
         return context.getElementsByClassName(match[1]);
      }
   };

   // release memory in IE
   div = null;
})();

function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
   for ( var i = 0, l = checkSet.length; i < l; i++ ) {
      var elem = checkSet[i];

      if ( elem ) {
         var match = false;

         elem = elem[dir];

         while ( elem ) {
            if ( elem[ expando ] === doneName ) {
               match = checkSet[elem.sizset];
               break;
            }

            if ( elem.nodeType === 1 && !isXML ){
               elem[ expando ] = doneName;
               elem.sizset = i;
            }

            if ( elem.nodeName.toLowerCase() === cur ) {
               match = elem;
               break;
            }

            elem = elem[dir];
         }

         checkSet[i] = match;
      }
   }
}

function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
   for ( var i = 0, l = checkSet.length; i < l; i++ ) {
      var elem = checkSet[i];

      if ( elem ) {
         var match = false;

         elem = elem[dir];

         while ( elem ) {
            if ( elem[ expando ] === doneName ) {
               match = checkSet[elem.sizset];
               break;
            }

            if ( elem.nodeType === 1 ) {
               if ( !isXML ) {
                  elem[ expando ] = doneName;
                  elem.sizset = i;
               }

               if ( typeof cur !== "string" ) {
                  if ( elem === cur ) {
                     match = true;
                     break;
                  }

               } else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
                  match = elem;
                  break;
               }
            }

            elem = elem[dir];
         }

         checkSet[i] = match;
      }
   }
}

if ( document.documentElement.contains ) {
   Sizzle.contains = function( a, b ) {
      return a !== b && (a.contains ? a.contains(b) : true);
   };

} else if ( document.documentElement.compareDocumentPosition ) {
   Sizzle.contains = function( a, b ) {
      return !!(a.compareDocumentPosition(b) & 16);
   };

} else {
   Sizzle.contains = function() {
      return false;
   };
}

Sizzle.isXML = function( elem ) {
   // documentElement is verified for cases where it doesn't yet exist
   // (such as loading iframes in IE - #4833)
   var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;

   return documentElement ? documentElement.nodeName !== "HTML" : false;
};

var posProcess = function( selector, context, seed ) {
   var match,
      tmpSet = [],
      later = "",
      root = context.nodeType ? [context] : context;

   // Position selectors must be done after the filter
   // And so must :not(positional) so we move all PSEUDOs to the end
   while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
      later += match[0];
      selector = selector.replace( Expr.match.PSEUDO, "" );
   }

   selector = Expr.relative[selector] ? selector + "*" : selector;

   for ( var i = 0, l = root.length; i < l; i++ ) {
      Sizzle( selector, root[i], tmpSet, seed );
   }

   return Sizzle.filter( later, tmpSet );
};

// EXPOSE

window.Sizzle = Sizzle;

})();

(function() {
   // дополнительные псевдоселекторы для Sizzle
   var filt=Sizzle.selectors.filters
   filt.hidden = function(elem) {
      return elem.offsetWidth === 0 || elem.offsetHeight === 0;
      }
   filt.animated = function(elem) {
      return elem.yupAnimation !== undefined;
      }
   filt.visible = function(elem) {
      return elem.offsetWidth>0 && elem.offsetHeight>0;
      }
   
   }) ();





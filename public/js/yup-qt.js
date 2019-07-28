/*
$toPHP = function(obj){}

EXPOSE:
   Win.yupQuery
   Win.$toPHP
   Win.$toJSON
   Win.$clone

   Win.yupTable
EXPOSE:
   Win.yupLoad
*/
(function() {
   var Win = window, Und = undefined, Doc = document, toLC='toLowerCase'
   
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
   function context(conf){
      return overlay({
         obj:Win, 
         fn:function(){},
         call:function() {
            var arg=[].slice.call(arguments);
            this.fn.apply(this.obj,arg);
            },
         ret_fn:function() {
            var cali=arguments.callee, arg=[].slice.call(arguments);
            cali.conf.call.apply(cali.conf,arg);
            },
         get_fn:function() {
            this.ret_fn.conf=this;
            return this.ret_fn;
            }
         },
         conf);
      }

   function inArray(arr,v) {
      for(var i=0;i<arr.length;i++) if(arr[i]===v) return i
      return -1
      };
   
   (function() {
   var ahObj
   
   function copyObj(o1, r) {
      if(!r) {r=0; ahObj=[]}
      if(r && o1==null) return o1
      if((typeof o1) == 'object') {
         var cr='constructor', isD=o1[cr]==Date, isR=o1[cr]==RegExp, isA=o1[cr]==Array, cns,i,v
         if((o1.nodeType && o1.tagName) || isR) return o1
         if(inArray(ahObj, o1)<0) ahObj.push(o1)
         cns = isA ? [] : (isD ? new Date() : {})
         if(isD) cns.setTime(o1.getTime()) 
         else if(!isR) for(i in o1) {
            try {v = o1[i]} catch(e) {return}
            if((typeof v) == 'object') v = inArray(ahObj, v)<0 ? copyObj(v,r+1) : v
            cns[i] = v
            }
         return cns
         }
      else return o1
      }
   
   Win.$clone = copyObj
   }) ();

/* 
yupQuery
*/
{
(function() {

   var url, method={}, // 'POST',
      returnQO, queryName, async=true, 
      queryQ={}, // очереди запросов (если предыдущий запрос по текущему url выполняется, то текущий ставится в очередь)
                 // массив объектов {query:'имя запроса',pars:{},cb:callback}
      defaultQueryVar='__yupQueryName',
      queryVar={}, //  имя переменной, в которой отправляется имя запроса
      XHR={}, uid={}, pwd={}, busy={}, errH={}, uplCb={},
      seqF={}, // url : {s:function(s){шифрует строку s}, d:function(ss){дешифрует строку ss}}
      onRSC='onreadystatechange'
   
   function encU(s) {
      var o
      if((o=seqF[url]) && o.s) s=o.s(s)
      return encodeURIComponent(s)
   }
   
   function qo(qry,pars,cb,oUrl) {
      var v
      if((typeof qry)=='string') {
         // подача запроса или постановка в очередь запроса, либо добавление в кэш
         if(oUrl) url=oUrl
         if(!url) return(err.call(this,'Не указан URL для запросов (url)'))
         if('post,get'.indexOf(method[url][toLC]())<0) return(err.call(this,'Поддерживаются только методы GET и POST'))
         if(!queryVar[url]) return(err.call(this,'Не указана переменная для имени запроса (queryVar)'))
         if(!XHR[url]) if(!(XHR[url]=createAJAX())) return false
         queryName=qry

         if(!busy[url]) {
            // XHR не занят
            var xhr=XHR[url]
            busy[url]=true
            xhr.open(method[url],url,async,uid[url],pwd[url])
            xhr[onRSC]=ajaxChanged
            if(v=uplCb[url]) {
               xhr.upload.onprogress = v
            }
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.send(encU(queryVar[url])+'='+encU(qry)+obj2url(pars))
            xhr.cb=cb
            }
         else {
            // постановка в очередь // для каждого url своя
            if(!queryQ[url]) queryQ[url]=[]
            queryQ[url].push({
               query:qry,
               pars:pars,
               cb:cb
               })
            }
         }
      else if((typeof qry)=='object') {
         // установка конфигурации объекта
         if(qry.url) {
            url=qry.url
            if(!method[url]) method[url]='POST'
            if(!queryVar[url]) queryVar[url]=defaultQueryVar
            }
         if(qry.async!==Und) async=qry.async
         if(v=qry.method) method[url]=v.toUpperCase()
         if(v=qry.queryVar) queryVar[url]=v
         if(v=qry.uid) uid[url]=v
         if(v=qry.pwd) pwd[url]=v
         if(v=qry.errHandler) errH[url]=v
         if(v=qry.seqF) seqF[url]=v
         if(v=qry.onupload) uplCb[url]=v
         }
      return(returnQO())
      }

   function err(errText){
      for(var i in busy) busy[i]=false
      if(!errH[this.url])
         alert(errText)
      else errH[this.url].call(this,errText)
      return false
      }

   function ajaxChanged() {
      var ajx=this
      if(ajx.readyState==4) {
         setTimeout(context({obj:{xhr:ajx},fn:queryDone}).get_fn(),5)
         }
      }

   function queryDone() {
      // текущий запрос отработан
      // узнаем, к какому url относится ajx 
      var curl,i, qq,cb, ajx=this.xhr
      for(i in XHR) {
         if(XHR[i]===ajx) {curl=i; break}
         }
      busy[curl]=false
      
      // отработать callback
      cb=ajx.cb
      if(cb) {
         var props=['status','statusText','responseText','responseXML','readyState'],obj={},cbr
         for(i in props) obj[props[i]]=ajx[props[i]]
         if((cbr = cb.call(returnQO(curl),obj))===false) {
            // отмена очереди, если callback вернул false
            // console.log('отменяем очередь')
            queryQ[curl]=[]
            }
         }
      // проверить очередь
      if((qq=queryQ[curl]) && qq.length) {
         // есть еще запрос на выполнение => послать, но с задержкой небольшой
         var nq=qq[0]
         //console.log( 'нужно послать еще один запрос :' + nq.query)
         //ajx.abort()
         queryQ[curl]=queryQ[curl].slice(1)
         qo(nq.query,nq.pars,nq.cb,curl)
         }
      }

   function createAJAX() {
      if(Win.XMLHttpRequest) return new XMLHttpRequest()
      if(Win.ActiveXObject) {
         try {return new ActiveXObject("Msxml2.XMLHTTP.6.0")}
         catch(e) {}
         try {return new ActiveXObject("Msxml2.XMLHTTP.3.0")}
         catch(e) {}
         try {return new ActiveXObject("Msxml2.XMLHTTP")}
         catch(e) {}
         try {return new ActiveXObject("Microsoft.XMLHTTP")}
         catch(e) {}
         }
      return(err.call(this,"Ошибка создания объекта XMLHttpRequest"))
      }

   function obj2url(obj) {
      var i,s=""
      for(i in obj)
         s += "&"+encU(i)+"="+(obj[i]===Und?"":encU(obj[i]))
      return s
      }

   function evalJS() {
      var u=this.url, v, res=this.XHR[u].responseText, ret
      try {
         // yupQuery.__tmpEval=
         // eval('ret=' + ((v=seqF[u]) && v.d ? v.d(res) : res))
         ret = (Function('return ' + ((v=seqF[u]) && v.d ? v.d(res) : res)))()
         }
      catch(e) {
         ret=res
         return(err.call(this,'Ошибка присвоения результата запроса объекту'))
         }
      if(seqF[u]) this.XHR[u].abort() // !!! запрет повторного получения JS-данных
      return(ret)
      }


   function js2string(obj,mode,nest) { // mode = 'php|json'
   // преобразует объект Javascript в ассоциативный массив PHP или строку JSON с рекурсией и защитой от бесконечной рекурсии
      var obj,i,j=0,s1='',assoc=false,tip, isPHP, ctr='constructor', isO, isA, v, sUnd='undefined',oL
      mode = mode[toLC]()
      if(!mode) mode='json'
      isPHP = (mode=='php')
      if(obj===Und) return isPHP ? '""' : sUnd
      if(obj===null) return isPHP ? "NULL" : 'null'
      if(!nest) {qo._tmpObjs=[];nest=0}
      try{tip=typeof obj}catch(e){return '"TYPE ERROR"'}
      
      if(tip=='object') {
         s1 += (isPHP ? 'array(' : '{')
         if(obj[ctr]==Object) isO=1
         else if(obj[ctr]==Array) isA=1
         else if(obj[ctr]==Date || obj[ctr]==RegExp) return '"' + jsEscape(obj.toString(), mode) + '"'
         else return '""'
         if(isA) {
            oL = obj.length
            for(i=0; i < oL; i++) {
               v = obj[i]
               s1 += (i ? ',' : '') + js2string(v, mode, nest+1)
            }
         } else {
            
            for(i in obj) {
               v=obj[i]
               s1 += (j ? ',' : '') + ('"' + jsEscape(i, mode) + '"' + (isPHP ? '=>' : ':'))
               if((typeof v)=='object') {
                  if(inArray(v, qo._tmpObjs)<0) {
                     qo._tmpObjs.push(v)
                     s1 += js2string(v, mode, nest+1)
                  } else s1 += '"RECURSION"'
               } else s1 += js2string(v, mode, nest+1)
               j++
            }
         }
         s1 += (mode == 'php' ? ')' : '}')
      } else {
         if(tip=='string') 
            v = '"' + jsEscape(obj, mode) + '"'
         else if(tip=='number') {
            var s=obj.toString(), inf='Infinity',p
            if((p=s.indexOf(inf))>-1) s=(p ? '-' : '') + (mode == 'php' ? 'INF' : 'Infinity')
            v = s
            }
         else if(tip==Und)
            v = isPHP ? 'NULL' : sUnd
         else if(tip=='boolean')
            v = obj[i] ? 'true' : 'false'
         else v = '"'+tip+'"'
         return v
         }
      return s1
      }
   
   function toPHP(obj) {
      return js2string(obj, 'php')
      }
   function toJSON(obj) {
      return js2string(obj, 'json')
      }
   
   function jsEscape(str, type) {
      var ret=str.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\r/g,"\\r").replace(/\n/g,"\\n")
      if(type=='php') ret=ret.replace(/\$/g, '".\'' + '$$' + '\'."')
      return ret
   }

   function inArray(val,arr) {
      if(arr.constructor!=Array) return false
      if(arr.indexOf===Und) {
         // для ослов
         for(var i=0;i<arr.length;i++)
            if(val===arr[i]) return i
         return -1
         }
      else {
         return arr.indexOf(val)
         }
      }
   

(returnQO=function(oUrl) {
   qo.XHR=XHR
   qo.method=method
   qo.queryVar=queryVar
   qo.busy=busy
   qo.async=async
   qo.evalJS=evalJS
   qo.url=oUrl || url
   qo.queryQ=queryQ
   return qo
   }) ()

Win.yupQuery=qo
Win.$toPHP=toPHP
Win.$toJSON=toJSON
Win.$inArray = inArray
}) ();
}


/*
yupTable
*/
{
function yupTable(js) {
   // конвертация из старого формата при старте
   var RD='__rowData', ORF='__originalFields'
   
   function jsonConvert1to2(js) {
      var ret={},i,j,fns=js.fieldNames, numF=fns.length, fd=js.fieldData
      ret[ORF]=fns
      ret[RD]=[]
      if(js.numRows==Und) js.numRows=fd[0].length
      for(i=0; i<js.numRows; i++) {
         var row=[]
         for(j=0; j<numF; j++) {
            row.push(fd[j][i])
            }
         ret[RD].push(row)
         }
      return ret
      }
   if(js.fieldNames && js.fieldData) js=jsonConvert1to2(js)
   
   function getVal(fldn,r) {
      return _getSetVal.call(this,'g', fldn, 0, r)
      }
   function setVal(fldn,val,r) {
      _getSetVal.call(this, 's', fldn, val, r)
      return this
      }

   function _getSetVal(m,fldn, val, r) {
      var js=this.jsTable, fi=findArr(fldn, js[ORF])
      if(r===Und) r=this.__row
      r=r||0
      if(fi<0) return error('Ошибка. Поле '+fldn+' не найдено')
      if(this.numRows-1 < r) return error('Ошибка. Строка '+parseFloat(r+1)+' не найдена')
      if(m=='g') return js[RD][r][fi]
      else js[RD][r][fi] = val
      }
   
   function findArr(val,arr) {
      var val,arr,i
      if(arr.indexOf) return(arr.indexOf(val))
      for(i in arr){if(arr[i]==val){return(parseInt(i,10));break}}
      return -1
      }
   
   function jsEscape(str) {
      return(str.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/'/g,"\\'").replace(/\r/g,"\\r").replace(/\n/g,"\\n"))
      }
      
   /* контейнер агрегатных функций */
   var aggrFunc = {
      sum : function(expr){
         // expr - текстовое выражение с именами полей для расчета (всегда доступны this.__jsTable)
         // в нажем примере expr='id_task'
         if(this.__phase=='init') {
            // инициализация
            return 0
            }
         else if(this.__phase=='inline') {
            // выполнение в каждой строчке можно использовать предыдущее накопленное значение функции this.__prev 
            // и индекс текущей строчки __row
            var js=this.__jsTable, orf=js.__originalFields, fd=js.__rowData, add,fi, fVars, vVars
            if((fi=findArr(expr,orf)) > -1) {
               add=parseFloat(fd[this.__row][fi])
            } else {
               fVars=[]; vVars=[]
               for(var fi in orf) {
                  if(expr.indexOf(orf[fi])>-1) {
                     // eval('var '+orf[fi]+'='+parseFloat(fd[this.__row][fi]))
                     fVars.push(orf[fi])
                     vVars.push((Function('return ' + parseFloat(fd[this.__row][fi])))())
                  }
               }
               fVars.push('return '+expr)
               // add=eval(expr)
               add = (Function.apply(this, fVars)).apply(this, vVars)
            }
            return this.__prev + (isNaN(add) ? 0 : add)
         } else if(this.__phase=='finish') {
            // выполнение в конце (доступны this.__count, this.__prev)
            return this.__prev
            }
         },
      avg : function(expr){
         var v
         if(this.__phase=='init') {
            return {sum:0,count:0}
            }
         else if(this.__phase=='inline') {
            var js=this.__jsTable, orf=js.__originalFields, fd=js.__rowData, add, fVars, vVars
            if((fi=findArr(expr,orf)) > -1) {
               add=parseFloat(fd[this.__row][fi])
            } else {
               fVars=[]; vVars = []
               for(var fi in orf) {
                  if(expr.indexOf(orf[fi])>-1) {
                     // eval('var '+orf[fi]+'='+parseFloat(fd[this.__row][fi]))
                     fVars.push(orf[fi])
                     vVars.push((Function('return ' +parseFloat(fd[this.__row][fi])))())
                  }
               }
               fVars.push('return '+expr)
               // add=eval(expr)
               add = (Function.apply(this, fVars)).apply(this, vVars)
            }
            if(!isNaN(add)) {
               this.__prev.count++
               this.__prev.sum += add
            }
            return this.__prev
            }
         else if(this.__phase=='finish') {
            return (v=this.__prev.count) ? this.__prev.sum / v : ''
            }
         },
      group_concat : function(expr,delimiter) {
         if(this.__phase=='init') {
            return ''
            }
         else if(this.__phase=='inline') {
            if(!delimiter) delimiter=','
            var js=this.__jsTable, orf=js.__originalFields, fd=js.__rowData, add,fi, fVars, vVars
            if((fi=findArr(expr,orf)) > -1) {
               add = (this.__row ? delimiter : '') + fd[this.__row][fi]
            } else {
               fVars = []; vVars=[]
               for(var fi in orf) {
                  if(expr.indexOf(orf[fi])>-1) {
                     // eval('var '+orf[fi]+'="'+jsEscape(fd[this.__row][fi])+'"')
                     fVars.push(orf[fi])
                     vVars.push((Function('return "' + jsEscape(fd[this.__row][fi]) + '"'))())
                  }
               }
               fVars.push('return '+expr)
               // add = (this.__row ? delimiter : '') + eval(expr)
               add = (this.__row ? delimiter : '') + (Function.apply(this, fVars)).apply(this, vVars)
            }
            return this.__prev + add
         } else if(this.__phase=='finish') {
            return this.__prev
         }
      }
   }
   
   function groupBy(grFlds, aggr, it) {
      // aggr = массив агрегатов для вычисления, например [{fn:'sum',expr:'id_task',args:[]}]
      // fn : имя функции из объекта aggrFunc
      // expr : имя поля или выражение javascript с использованием имен полей (второй вариант медленнее!)
      // массив дополнительных аргументов, передаваемых агрегатной функции
      var i,ret={},r,grF,subsets={},j,rsg, orf=js.__originalFields, vcont
      if(!it) it=0
      i=it // текущая итерация (с теми же полями группировки только с разными поднаборами данных и начиная с i-го поля)
      if(grFlds!=='__last') {
         grF=grFlds[i]
         ret.__subGroups={}
         }
      ret.count=0
      if(aggr) {
         // инициирующий вызов агрегатов
         for(var ai in aggr) {
            // создаем контекст выполнения агрегирующей функции
            var agr=aggr[ai], args=[agr.expr]
            vcont={__phase:'init',__jsTable:js}
            for(j in agr.args) args.push(agr.args[j])
            ret[agr.fn+'('+agr.expr+')']=aggrFunc[agr.fn].apply(vcont,args)
            }
         vcont.__phase='inline'
         }
      rsg=ret.__subGroups
      for(r=0;r<js.__rowData.length;r++) {
         // цикл по строкам, заполнение уникальными значениями поля текущей группировки ключей поля __subGroups
         var val
         if(rsg) {
            val=this.get(grF, r)
            if(!rsg[val]) {
               // добавление новой подгруппы
               // 1.1 val='Иванов'
               rsg[val]={}
               subsets[val]={
                  __originalFields:orf,
                  __rowData:[],
                  __firstRowIndex:r}
               }
            // формируем субсеты
            subsets[val].__rowData.push(js.__rowData[r])
            }
         ret.count++
         // присоединяем значения полей для первой строки
         if(!r) {
            for(var k in orf) {
               ret[orf[k]]=js.__rowData[r][k]
               }
            }
         // вычисление аггрегатных функций для каждой группы
         if(aggr) {
            // передаем значение текущих переменных
            for(var ai in aggr) {
               // цикл по агрегатам
               var agr=aggr[ai], args=[agr.expr]
               for(j in agr.args) args.push(agr.args[j])
               vcont.__row=r
               vcont.__prev=ret[agr.fn+'('+agr.expr+')']
               ret[agr.fn+'('+agr.expr+')']=aggrFunc[agr.fn].apply(vcont,args)
               }
            }
         }
      // окончательный калбэк к агрегатам
      if(aggr) {
         vcont.__phase='finish'
         for(var ai in aggr) {
            var agr=aggr[ai], args=[agr.expr]
            for(j in agr.args) args.push(agr.args[j])
            vcont.__numRows=r
            vcont.__prev=ret[agr.fn+'('+agr.expr+')']
            ret[agr.fn+'('+agr.expr+')']=aggrFunc[agr.fn].apply(vcont,args)
            }
         }
      // в конце итерации мы сформировали субсеты данных по каждому уникальному значению текущих подгрупп
      // и передаем это рекурсии
      // в следующей итерации функция будет работать с сокращенным набором данных и по следующему полю группировки
      for(j in subsets) {
         // цикл по образовавшимся субсетам
         if(i<grFlds.length-1) { 
            // следующее поле группировки существует rsg=ret.__subGroups
            rsg[j]=yupTable(subsets[j]).groupBy(grFlds, aggr, i+1)
            }
         else {
            // следующей группировки не существует, но нам нужно прицепить агрегаты сюда
            var of=js.__originalFields, r=subsets[j].__firstRowIndex, fi, nonGrFld
            // нужно запустить рекурсию для подсчета агрегатов по служебному полю __last
            rsg[j]=yupTable(subsets[j]).groupBy('__last', aggr, i+1)
            }
         }
      return ret
      }
   
   function sortBy(flds) {
      // на входе строка с правиласи сортировки, как в SQL
      var i,ar,ar2, arF=[],v
      for(i in (ar=flds.split(/[ ]*,[ ]*/))) {
         if(v=ar[i]) {
            ar2 = v.split(/[ ]+/)
            arF.push([ar2[0], (v=ar2[1]) && /desc/i.test(v) ? 1 : 0])
            }
         }
      function sorter(a,b) {
         // определить контекст с помощью объекта this
         var r=0, i, curF, curD, meta, sF
         if(this==Win) i=0; else i=this.i
         curF = $inArray(arF[i][0], js[ORF]); curD = arF[i][1]
         meta = js[js[ORF][curF]] || {}
         if((sF=meta.sorter) && (typeof sF)=='function') r = sF.call(meta, a[curF], b[curF])
         else {
            if(a[curF] < b[curF]) r = curD ? 1 : -1
            else if(a[curF] > b[curF]) r = curD ? -1 : 1
            }
         if(!r && (i+1)<arF.length) r=sorter.call({i:i+1},a,b)
         return r
         }
      if(arF.length) js[RD].sort(sorter)
      return this
      }
   
   function seek(r) {
      this.__row=r
      return this
      }
   function first() {
      this.seek(0)
      return this
      }
   function last() {
      this.seek(this.jsTable[RD].length-1)
      return this
      }
   function _consists(val,str,strict) {
      return str.indexOf(val)>-1
      }
   function _starts(val,str,strict) {
      return str.indexOf(val)==0
      }
   
   function copyRS(rs) {
      var ret={},i;for(i in rs) ret[i]=rs[i];return ret
   }
   

   function find(crits, strict) {
      var i,j,r, rs=this, c0
      if(!crits) return rs
      if((c0=crits[0]) && (typeof c0)!='object')
         crits=[[crits[0],crits[1]]]
      for(i=0;i<crits.length;i++) {
         // для каждого критерия
         var fn=crits[i][0], val=crits[i][1], rd=[], findFn=0, ms, newJs
         if(val==Und) continue
         if(!strict) val=val.toString()[toLC]()
         if(ms = /^\*(.*)\*$/.exec(val)) {findFn=_consists; val=ms[1]}
         else if(ms = /(.*)\*$/.exec(val)) {findFn=_starts; val=ms[1]}
         rs.each(function(j) {
            // для каждой строки набота rs
            var v2=this[fn]; if(v2==Und) return false
            if(!strict) v2=v2.toString()[toLC]()
            if((findFn && findFn(val, v2)) || v2==val) {
               rd.push(rs.jsTable[RD][j])
               }
            })
         newJs=copyRS(rs.jsTable)
         newJs[RD]=rd
         rs=yupTable(newJs)
         }
      return rs
      }
      
   function merge(js2,meta,dist) {
      // присоединить к текущему jsTable(js) еще jsTable(js2)
      var i,j,val, js=this.jsTable
      if(!meta) {
         if(js2[RD]) {
            // слияние строк (в конец)
            if(!js[RD]) js[RD]=[]
            for(i in js2[RD]) if(!dist || dist && $inArray(js2[RD][i], js[RD])<0) {
               js[RD].push(js2[RD][i])
               this.numRows++
            }}
         // список полей замещаем
         if(js2[ORF]) js[ORF]=js2[ORF]
         }
      // аттрибуты по полям (добавляются новые)
      for(i in js[ORF]) {
         // цикл по исходным полям
         var fld=js[ORF][i]
         for(j in js2[fld]) {
            // цикл по аттрибутам поля в новом наборе с замещением имеющихся аттрибутов новыми
            val=js2[fld][j]
            if(val!==Und) js[fld][j]=val
            }
         }
      return this
      }
   
   function truncate() {
      this.__row=null
      this.numRows=0
      this.jsTable.__rowData=[]
      return this
      }
   function mergeMeta(js2) {
      this.merge(js2,1)
      return this
      }
   function mergeDistinct(js2) {
      this.merge(js2,0,1)
      return this
      }
   
   function moveColumn(from,to) {
      
      }
   function error(msg) {
      var cb
      if(console && (cb=console.error)) cb(msg)
      return false
      }

   function getRow(r) {
      var o={},fi,js=this.jsTable, orf=js[ORF],rd=js[RD]
      if(r==Und) r=this.__row
      if(rd[r]==Und) return error('Строка не найдена')
      for(fi in orf) o[orf[fi]]=rd[r][fi]
      return o
      }

   function each(fn) {
      // итератор по строкам, выполняется функция fn в контексте объекта строки (this[имя_поля]=значение, ... )
      // передаваемые параметры: 1 - индекс строки, 2 - ссылка на объект yupTable
      // если fn возвращает false, то цикл прерывается
      var ctx={}, rd=this.jsTable[RD],r
      for(r=0;r<rd.length;r++) {
         // для каждой строки
         if(fn.call(getRow.call(this,r), r, this)===false) break
         }
      return this
      }
   
   function _refresh() {
      // обновляет текущий объект (если могли измениться статические поля)
      }

   function insert(row) {
      // добавляет в объект строку, переданную в виде объекта
      var js=this.jsTable, cF=js[ORF].length, aRow=[]
      for(i=0; i<cF; i++) aRow[i] = row[js[ORF][i]]
      js[RD].push(aRow)
      this.numRows++
      return this
   }
   
   function clone(opts) {
      var ret={}, p, i, iL, rs=this.jsTable
      for(p in rs) {
         if(p != RD && p != ORF) ret[p] = rs[p]
      }
      ret[ORF] = rs[ORF].slice(0)
      ret[RD] = []
      if(opts && opts.empty) return yupTable(ret)
      for(i=0, iL=rs[RD].length; i<iL; i++) {
         ret[RD].push(rs[RD][i].slice(0))
      }
      return yupTable(ret)
   }
   
   // возвращает объект
   return({
      __row : 0,
      clone : clone,
      each : each,
      find : find,
      first : first,
      get : getVal,
      getRow : getRow,
      groupBy : groupBy,
      insert : insert,
      jsTable : js,
      last : last,
      merge : merge,
      mergeMeta : mergeMeta,
      mergeDistinct : mergeDistinct,
      numFields : js[ORF].length,
      numRows : js[RD].length,
      seek : seek,
      set : setVal,
      sortBy : sortBy,
      truncate : truncate
      })
   };
   
   function fromFDM(fdm) {
      // конвертер из нового формата
      var js={__originalFields:fdm.f, __rowData:fdm.d}, fo, fi
      if(fdm.m) {
         for(fi in fdm.m) {
            fo = fdm.m[fi]
            js[fdm.f[fi]] = fo
         }
      }
      return yupTable(js)
   }
   
   function toFDM(js) {
      var fdm={f:js.__originalFields, d:js.__rowData, m:{}}, fi
      for(fi in fdm.f) {
         if(fo = js[fdm.f[fi]]) fdm.m[fi] = fo
      }
      return fdm
   }
// EXPOSE
yupTable.fromFDM = fromFDM
yupTable.toFDM = toFDM
Win.yupTable = yupTable
}



/* Новая версия загрузчика файлов html, css, js
yupLoad({
   target : document.body | строка-селектор, если есть jQuery|Yup, или селектор вида #id, если нет jQuery,
   html : ['index.php',...],
   js : ['lib1.js',...],
   css : ['style1.css','style1.css@print|screen'..],
   onload : callback
   })

загрузка всех файлов производится с помощью ajax
а после загрузки всех файлов вставляются тэги style и наполняются правилами, вставляется DOM-содержимое в конец элемента target или body, если target не указан, 
и запускаются скрипты по очереди их загрузки
и после всего этого выполняется callback
Внимание! Есть ограничения
1. HTML- не должны содержать скриптов и тэгов style (ибо работает не везде и по разному, поэтому и предусмотрена загрузка css и js)
2. файлы с HTML,JS,CSS должны быть в кодировке UTF8, иначе нужно выставлять в заголовке самого файла нужную кодировку
3. все подгружаемые файлы должны быть на этом-же домене (ограничение ajax)
4. Файлы JS должны быть обвернуты в шаблон (function() {}) ();
*/
{
(function() {
   var qe={}, /*
   qe= {'url1' => {content:'',loaded:0|1,type:'css|js|html'}, ...}
   */ target, htmls, csss, jss, cb, attrs
   function main(inp) {
      var i, url, trg=inp.target;
      
      if(!inp) inp={}
      htmls = inp.html || []
      csss = inp.css || []
      jss = inp.js || []
      
      if(trg) {
         if((typeof trg)=='string') {
            if($) target=$(trg).get(0)
            else target=Doc.getElementById(trg.substr(1))
            }
         else if(trg.nodeType) target=trg
      }
      cb=inp.onload
      
      // загрузка HTML
      if(htmls.length) for(i in htmls) {
         url = htmls[i]
         qe[url] = {content:'', loaded:0, type:'html'}
         loadFile(url)
      }
      // загрузка CSS
      if(csss.length) for(i in csss) {
         url = csss[i].split('@')[0]
         qe[url] = {content:'', loaded:0, type:'css'}
         loadFile(url)
      }
      // загрузка JS
      if(jss.length) for(i in jss) {
         url = jss[i]
         if(isArray(url)) url = url[0]
         qe[url] = {content:'', loaded:0, type:'js'}
         loadFile(url)
      }
   }
   function loadFile(url) {
      // загрузка файлов происходит параллельно => требуется повесить каллбэки, удаляющие из очереди url-ки
      yupQuery({url : url, method:'GET'}) ('',{},function() {
         // загрузка файла завершена
         var o=qe[url]
         o.content = this.XHR[url].responseText
         o.loaded = 1
         checkReady()
         })
      }
   
   function checkReady() {
      // проверка, остались еще файлы для загрузки, и если нет, то применяем стили, вставляем содержимое html в таргет и запускаем скрипты
      var i,o, head=Doc.getElementsByTagName('HEAD')[0], el, url, context
      for(i in qe) {
         o = qe[i]
         if(!o.loaded) return
      }
      // все загружено
      
      // вставим тэги style и наполним правилами
      for(i in csss) {
         var arr,sh, url=csss[i].split('@'), media
         media = url[1]
         url = url[0]
         el=Doc.createElement('STYLE')
         if(media) el.media=media
         head.appendChild(el)
         arr = cssParse(qe[url].content, getPath(url))
         sh = el.sheet || el.styleSheet
         for(i=arr.length-1;i>-1; i--) {
            sel = arr[i][0]
            rule = arr[i][1]
            if(sh.insertRule)
               sh.insertRule(sel+'{'+rule+'}',0)
            else if(sh.addRule)
               sh.addRule(sel,rule,0)
            }         
         }
      
      // вставка в target содержимого html-файлов
      for(i in htmls) {
         append(target || Doc.body, qe[htmls[i]].content)
      }
      // запуск скриптов
      for(i in jss) {
         url = jss[i]
         if(isArray(url)) {
            context = url[1]
            url = url[0]
         }

         if(context) {
            (Function('context', 'return ' + qe[url].content))(context)
         } else {
            (Function('return ' + qe[url].content))()
         }
         
      }
      if(cb) cb.call(Win)
   }

   function isArray(a) {return a.constructor ==  Array}
   function append(el,content) {
      var nel=Doc.createElement('DIV'), nodes,i, node, nl
      nel.innerHTML=content
      nodes=nel.childNodes; nl=nodes.length
      for(i=0;i<nl;i++) {
         if(nodes[0].nodeType) el.appendChild(nodes[0])
         }
      }
   
   function cssParse(css,path) {
      // парсит CSS-текст и возвращает массив правил CSS, в формате [['селектор1','содержимое селетора 1'], ...]
      // опционально добавляет префикс path во все конструкции url()
      var ret,arr, re, ret2=[], i, j, sel, ret3=[]
      ret = css.replace(/\/\*.*?\*\//g, '').replace(/[\r\n]/g, '')
      re = /([^\{]*)\{([^\}]*)\}/g
      while(arr = re.exec(ret)) {
         ret2.push([arr[1],arr[2]])
         }
      for(i in ret2) {
         var sels = ret2[i][0].split(',')
         for(j in sels) {
            sel = sels[j].replace(/^[ ]*/, '').replace(/[ ]*$/, '')
            ret3.push([sel, ret2[i][1]])
            }
         }
      if(path) for(i in ret3) {
         var s = ret3[i][1], s2='', p1, lP=0
         re = /url\([\'\"]?(.*?)[\'\"]?\)/g
         while(arr = re.exec(s) ) {
            p1 = s.indexOf(arr[0],lP)
            s2 += s.substr(lP, p1-lP) + 'url("' + path + arr[1] + '")'
            lP = p1 + arr[0].length
            }
         s2 += s.substr(lP)
         ret3[i][1] = s2
         }
      return(ret3)
      }
   
   function getPath(path) {
      // получает путь к файлу, по полному пути
      // css/style.css =>css/
      // style.css => ./
      var ar = /(.*?)[\/\\]?[^\/\\]*?$/.exec(path), ret = ar ? ar[1] : ''
      if(ret=='') ret = '.'
      return ret + '/'
      }
      
   // Expose
   Win.yupLoad=main
   Win.cssParse=cssParse
   }) ();
}

}) ();

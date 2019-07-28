/*
v2

элементы формы 
* yupForm
* yupText
* yupList
* yupCheckbox
* yupButton
* yupFile
* yupCalendar
* yupDialog
* yupRadioButtons
* yupColor
* yupBorderStyle
* yupHelper

шаблонизатор
* yupLayout
классы внутри таблицы класса mForm
caption clear
*/

(function() {
var coreLib, Und=undefined, Win=window, Doc=document
if(!(coreLib = Win.Yup)) {
   if(!(coreLib = Win.jQuery)) return
   }

function copyObj(o1, r) {
   if(!r) {r=0; copyObj.ao = []}
   function inArray(v,arr) {var i,aL=arr.length; for(var i=0;i<aL;i++) if(arr[i]===v) return i;return -1}
   if(r && o1==null) return o1
   if((typeof o1) == 'object') {
      var cr='constructor', isD=o1[cr]==Date, isR=o1[cr]==RegExp, isA=o1[cr]==Array, cns,i,v
      if((o1.nodeType && o1.tagName) || isR) return o1
      if(inArray(o1, copyObj.ao)<0) copyObj.ao.push(o1)
      cns = isA ? [] : (isD ? new Date() : {})
      if(isD) cns.setTime(o1.getTime()) 
      else if(!isR) for(i in o1) {
         try {v = o1[i]} catch(e) {return}
         if((typeof v) == 'object') v = inArray(v, copyObj.ao)<0 ? copyObj(v,r+1) : v
         cns[i] = v
         }
      return cns
      }
   else return o1
   }

function copyO(o) {
   if(!o) return
   var i,r={};for(i in o) r[i]=o[i]
   return r
}

function addNativeM(el) {
   el.setValue = function(v, svOpts){$(this).yupForm('setValue', v, svOpts); return this}
   el.getValue = function() {return $(this).data('value')}
   el.focus = function(){$(this).yupForm('focus'); return this}
   el.resize = function() {}
}

/* yupForm - объект формы для прикручивания к json и автоматизации ввода-вывода также для применения общих методов для элементов формы, таких как disable / enable
*/
(function($) {
   
   var ORF='__originalFields', RD='__rowData', Plugin='yupForm', Ctls = ['yupText','yupList','yupCheckbox','yupButton','yupCalendar','yupFile']
   

   var methods = {
      
      init : function(io) {
         var v,o, i, iL, el=this, aw, sumW=0
         if(!io) io={}
         if(o=(io.flexCols || io.flexColumns)) {
            aw=[]
            iL=o.length; for(i=0; i<iL; i++) {
               aw.push(v = o[i].width)
               sumW += v
            }
            el.children().css({width:'100%',clear:'left'}).addClass(Plugin+'_row').each(function() {
               if(this.tagName!='DIV') return
               var row=$(this), chs=row.children().addClass(Plugin+'_col'), ftC
               chs.each(function(i) {
                  var col=$(this)
                  col.addClass(Plugin+'_col'+(i+1))
                  if(i>0) {
                     col.css({width:aw[i] || '500px'})
                  }
               })
               ftC=chs.css({'float':'left'}).first()
               if(ftC.hasClass('span100')) ftC.css({width:sumW})
               else {
                  ftC.addClass('caption')
                  if(!ftC[0].style.width) ftC.css({width:aw[0] || '120px'})
               }
               row.last().append('<div class="clear">')
            })
         } else {
            el.find('.'+Plugin+'>tbody>tr>td:nth-child(1)').addClass('firstCol')
         }
         return this
      }
      ,
      bindJS : function(js) {
         // принимает объект вида 
         /* 
         {
            __originalFields:['field1','field2',...],
            'field1' : {selector:'.field1',pKey:1,caption:'код',notNull:1} // если есть аттрибут name, то selector не нужен
                  // selector в контексте выделенного объекта находит элемент и хранит в нем данные
                  // notNull не должно быть пустого значения
                  // max_length - максимальная длина строки
                  // value - значение поля по-умолчанию
         */
         return this.data('json',js).each(function() {
            var orf=js[ORF], $frm=$(this), fld, $el, def='defaultValue', fo, v, i,iL
            for(i=0, iL=orf.length; i<iL; i++) {
               // для каждого поля в наборе данных
               fld=orf[i]
               fo = js[fld] || {}; if(!js[fld]) js[fld] = fo

               // если элемент нативный и в нем уже стоит какое-то значение, то записывать его в defaultValue
               if($el = getFormEl.call($frm,fld)) {
                  // элемент найден (в т.ч. и нативный)
                  $el.data(Plugin, $frm)

                  // если элемент нативный, и в нем уже есть значение, а дефолта в мета-данных еще не определено, то прописываем это значение в дефолт, иначе элемент обнулится при загрузке данных формы
                  if(!getCtlClass($el) && fo[def]==Und && (v = $el[Plugin]('getValue')) !== '') fo[def] = v
               }
            }
            if(!js[RD]) js[RD]=[]
            $frm[Plugin]('load')
         })
      }
      ,
      // загружает данные из массива из строки с индексом row, либо загружает новый рекордсет
      load : function(row) {
         if(row && $.isPlainObject(row) && row[ORF]) {
            // подмена данных
            this.each(function() {
               var el=$(this), js=el.data('json')
               js[ORF] = row[ORF]
               js[RD] = row[RD]
            })
            row=0
         }
         // переход на строку с индексом row
         if(!row) row=0
         return this.each(function() {
            // this - DOM-элемент контейнера формы
            var $frm=$(this), js=$frm.data('json'), i,iL, val, frmD, oRow={}, orf=js[ORF], fld, $el
            $frm.data(Plugin+'Data', {rowIndex : row})
            iL=orf.length; for(i=0; i<iL; i++) {
               // для каждого поля в наборе данных
               fld=orf[i]
               // присваиваем значение по-умолчанию, если указано
               val = js[RD][row] ? js[RD][row][i] : (js[fld].defaultValue || '')
               oRow[fld] = val
               if($el=getFormEl.call($frm,fld)) {
                  // элемент найден
                  $el[Plugin]('setValue',val)
               }
            }
            $frm[Plugin]('saved')
         })
      }
      ,
      isDirty : function() {
         if(this[0]) {
            var f=this, upd=f[Plugin]('getUpdated'), i
            if($.isPlainObject(upd)) {
               for(i in upd) return upd
            }
         }
         return false
      }
      ,
      reset : function() {
         return this.each(function() {
            var el=$(this), f, upd=el[Plugin]('getUpdated')
            for(f in upd) el[Plugin]('set', f, el[Plugin]('get', f, {old:1}))
         })
      },
      getUpdated : function() {
         if(this[0]) {
            var f1=this.eq(0), d=f1.data(), aFld=d.json[ORF], i,iL=aFld.length, ret={}, f
            for(i=0;i<iL;i++) {
               f=aFld[i]
               if(f1[Plugin]('isUpdated',f)) ret[f]=f1[Plugin]('get',f)
            }
            return ret
         }
      },
      isUpdated : function(fld) {
         if(this[0]) {
            var f1=this.eq(0), d=f1.data(), js=d.json, fd=d[Plugin+'Data'], v2, row
            if(js[fld] && (js[fld].ignore || js[fld].ignored)) return false
            v2=f1[Plugin]('get',fld)
            if((row=js[RD][fd.rowIndex]) && !_isEqual(v2, row[$.inArray(fld,js[ORF])])) return true
         }
         return false
      },
      // проверка правильности заполнения полей
      validate : function(cbOk,cbErr) {
         var valid=true, extVels = [], $frm = this // [ {el:DOMel, ch:0} , ...]
         
         function extVret(res) {
            // функция, которую должен вызвать внешний валидатор поля в контексте проверяемого элемента после отработки поля для того, чтобы сообщить форме, что этот элемент проверен
            var $el =  this, i, o, allOk=1, l=extVels.length
            for(i=0;i<l;i++) {
               // перебираем массив со всеми полями с внешним валидатором
               o=extVels[i]
               if(o.el === $el.get(0)) {
                  // если контекст проверяемого элемента поля совпадает с одним из них
                  if(res!==true && res!=Und) {
                     // ошибка произошла, остальные валидаторы можно не обрабатывать
                     if(cbErr) cbErr.call($el,res)
                     else alert(res)
                     $el[Plugin]('focus')
                     return
                     }
                  else o.ch = 1
                  }
               }
            // проверить, все ли элементы с внешним валидатором отработаны
            for(i=0;i<l;i++) {
               o=extVels[i]
               if(!o.ch) {allOk=0;break}
            }
            
            if(allOk && cbOk) {
               cbOk.call($frm)
            }
         }
            
         this.each(function() {
            // цикл по формам
            var $frm=$(this), js=$frm.data('json'), orf=js[ORF], i, fo, fld, $el, capt, lOrf=orf.length
            for(i=0;i<lOrf;i++) {
               // цикл по полям
               fld=orf[i]; fo=js[fld]||{}
               capt=fo.caption
               if($el=getFormEl.call($frm,fld)) {
                  // если есть элемент в форме
                  var val = $el[Plugin]('getValue'), i1, err, vcb
                     // проверка notNull
                     if(fo.notNull && !val && val !== 0) {
                        err='Не заполнено поле "'+(capt||fld)+'"'
                        valid = false
                        if(cbErr) cbErr.call($el,err); else alert(err)
                        $el.yupForm('focus'); return valid
                        }
                     // проверка длин полей
                     if((!fo.type || fo.type=='text' || fo.type=='varchar') && (val || val===0) && (i1=fo.max_length||fo.maxLength) && val.length>i1) {
                        err='Длина поля "'+(capt||fld)+ '" превышает максимально допустимую. Данные были усечены до '+ i1 + ' символ' + digitEnding(i1,'а','ов','ов')
                        valid = false
                        if(cbErr) cbErr.call($el,err); else alert(err)
                        $el.yupForm('setValue',val.substr(0,i1))
                        $el.yupForm('focus'); return valid
                        }
                     // проверка валидатором поля
                     if(vcb=fo.validator) {
                        err=vcb.call($el, val)
                        if(err!==true && err!==Und) {
                           valid = false
                           if(cbErr) cbErr.call($el,err); else alert(err)
                           $el.yupForm('focus'); return valid
                           }
                        }
                     // проверка внешним (с разрывом потока выполнения) валидатором
                     if(vcb=fo.extValidator) {
                        extVels.push({el:$el[0], ch:0, fn:vcb, val:val})
                     }
                  }
               }
            
            
            
            })
         if(valid && !extVels.length) {
            if(cbOk) cbOk.call(this)
            return true
            }
         else if(extVels.length) {
            var o,l
            if(!valid) return false
            l=extVels.length;for(i=0;i<l;i++) {
               o = extVels[i]
               // вызываем внешний валидатор, передавая ему callback для выхода
               o.fn.call($(o.el), o.val, extVret)
               }
            return
            }
         return valid
         }
      ,
      focus : function() {
         // устанавливает фокус на выделенный элемент
         var c,m
         if(c=getCtlClass(this)) {if(m=this[c].methods.focus)m.call(this)}
         else {
            try {this.get(0).focus()} catch(e) {}
            }
         }
      ,
      disable : function() {
         // запрет всех элементов-компонентов в форме
         var ctl
         if(ctl = getCtlClass(this)) this[ctl]('disable')
         else this.attr('disabled',true)
         return this
      },
      enable : function() {
         var ctl
         if(ctl = getCtlClass(this)) this[ctl]('enable')
         else this.attr('disabled',false)
         return this
      },
      on : function(evt,cb) {
         this.each(function() {
            var $el=$(this), cl
            if(cl = getCtlClass($el)) {
               if('startedit,click,change,'.indexOf(evt+',')>-1) {
                  $el[cl]('on',evt,cb)
                  }
               }
            })
         return this
         }
      ,
      setValue : function(val, svOpts) {
         // универсальный метод установки значения элементам формы в зависимости от их типа
         var $el=this, ctl=getCtlClass($el), el
         if(ctl) $el[ctl]('setValue', val, svOpts)
         else {
            if(el=$el.filter('input:checkbox')[0]) el.checked = (val && val !== '0') ? true : false
            else if($el[0]) $el[0].value = val
            }
         return $el
         }
      ,
      getObject : function() {
         var el, f1=this, dat, i, orf, ret
         if(el=this[0]) {
            dat=f1[Plugin]('getJS')
            orf=dat[ORF]
            ret = {}
            for(i=orf.length-1;i>-1;i--) {
               ret[orf[i]] = dat[RD][0][i]
            }
         }
         return ret
      },
      getValue : function() {
         var el,v
         if(el=this[0]) {
            v = $(el).data('value')
            return v!=Und ? v : ($(el).filter('input:checkbox')[0] ? (el.checked ? 1 : 0) : ((v=$(el).attr('value')) || v===0 ? v : (el.getValue ? el.getValue() : '') ))
         }
         return ''
      }
      ,
      get : function(fld, opts) {
         // получает значение поля fld (либо массива полей => в объект) из формы либо из данных при opts={old:1}
         var el,i,iL,ret,d,js
         if(this[0]) {
            el=$(this[0])
            if($.isArray(fld)) {
               iL=fld.length; ret={}
               for(i=0;i<iL;i++) ret[fld[i]] = el[Plugin]('get', fld[i])
               return ret
            } else {
               if(opts && opts.old) {
                  d=el.data(Plugin+'Data')
                  js=el.data('json')
                  return js[RD][d.rowIndex][$.inArray(fld, js[ORF])]
               } else return $(getFormEl.call($(this[0]), fld))[Plugin]('getValue')
            }
         }
         return false
      },
      saved : function() {
         // указывает форме, что она сохранена (метод isDirty будет возвращать false)
         return this.each(function() {
            var f=$(this), d=f.data(), i, fs=d.json[ORF], fL=fs.length, ri=d[Plugin+'Data'].rowIndex
            if(!d.json[RD][ri]) {
               // строки еще нет => создать
               d.json[RD][ri] = f[Plugin]('getJS')[RD][0]
            }
            for(i=0; i<fL; i++) d.json[RD][ri][i] = f[Plugin]('get',fs[i])
         })
      }
      ,
      set : function(fld,val) {
         var i,frm=this,el
         if($.isPlainObject(fld)) for(i in fld) frm[Plugin]('set',i,fld[i])
         else frm.each(function() {
            if(el=$(this)[Plugin]('element',fld)) el[Plugin]('setValue',val)
            })
         return this
         }
      ,
      element : function(fld) {
         // получает элемент формы по имени
         if(this[0]) return getFormEl.call($(this[0]), fld)
         return false
         }
      ,
      el : function (fld) {
         return this[Plugin]('element',fld)
      }
      ,
      getJS : function() {
         // получение данных текущего состояния формы в формате json2 с одной строкой
         var js=copyO(this.data('json')), orf=js.__originalFields, i,iL, v, fo, fld, $el, val
         js[RD]=[[]]
         iL=orf.length; for(i=0; i<iL; i++) {
            // цикл по полям
            fld=orf[i]
            if($el=getFormEl.call(this,fld)) {
               // если есть элемент в форме
               val = $el[Plugin]('getValue')
               if(val===Und) val=''
            } else {
               // нет элемента => получим значение по умолчанию или пустую строку
               if((fo=js[fld]) && (v=fo.defaultValue)!=Und) val=v; else val=''
            }
            js[RD][0].push(val)
         }
         return js
      }
      ,
      // часики
      wait : function(on,opacity) {
         // затеняет/отменяет выделенные компоненты полупрозрачным слоем и выводит посередине крутилку
         // wait(true) - включить, wait(false) - выключить
         this.each(function() {
            var $el=$(this), lEl, ofs=$el.offset(), cW=$el.outerWidth(), cH=$el.outerHeight(), $wb, $wi
            if(!$(this).data('waitLayer')) {
               // создаем полупрозрачный слой
               var s1='<div class="yup_waitLayer">'
                  +'<div class="waitBox"></div>'
                  +'<div class="waitImage"></div>'
               +'</div>',
               lEl=$('body').append(s1).find('.yup_waitLayer').last().get(0)
               $el.data('waitLayer',lEl)
               $(lEl).children().css({
                  'display' : 'none',
                  'position': 'absolute'
                  })
               }
            else lEl=$(this).data('waitLayer')

            $wb=$(lEl).children().css({
               'top' : ofs.top,
               'left' : ofs.left,
               'width' : cW,
               'height' : cH
               }).eq(0)
            $wi=$(lEl).find('.waitImage')
            
            if(on) {
               $wb.css({'display':'',opacity:0}).animate({'opacity':opacity || 0.6}, 100)
               $wi.fadeIn(100)
               }
            else {
               $wb.animate({'opacity':0}, 100, function(){$(this).css('display','none')})
               $wi.fadeOut(100)
               }
            })
         return this
         }
      // конец методов mForm
      }

   function getCtlClass($el) {
      var i, cl, l=Ctls.length
      for(i=l-1;i>-1;i--) {
         cl=Ctls[i]
         if($el.hasClass(cl)) return(cl)
         }
      return ''
      }

   function getFormEl(fld) {
      // ищет элемент по имени или по селектору в описании поля в js[fld].selector
      var sel,$el,js=this.data('json'),fo=js[fld] // this - $(form)
      if(fo && (sel=fo.selector)) {
         $el=$(this).find(sel)
      }
      else if(fo && (sel=fo.id)) {
         $el=$('#'+sel)
      }
      else $el=$(this).find('[name='+fld+']')
      if($el[0]) return $el.eq(0)
   }
   
   function digitEnding(num,odin,dva,mnogo) {
      // несколько? "ов" один? ""  два? "а"
      // несколько? "ей" один? "ь" два? "я"
      var odin,dva,mnogo,num,n,o1,o2,ret,ok
      if(odin==Und) odin=""
      if(dva==Und) dva="а"
      if(mnogo==Und) mnogo="ов"
      n=num.toString()
      if(n.length>0) {  
        o1=n.substr(n.length-1)
        ret=mnogo;
        if(o1=="1") ret=odin;
        if(o1>=2 && o1<=4) ret=dva;
        }
      if(n.length>1) {
        o2=n.substr(n.length-2)
        if(o2>=11 && o2<=14) ret=mnogo
        }
      return(ret);
      }

   function addComponent(ctl) {
      var er1='Компонент '+ctl
      if($.inArray(ctl, Ctls)>-1) return $.error(er1+' уже зарегистрирован')
      if(!$.fn[ctl]) return $.error(er1+' не найден в $.fn')
      Ctls[Ctls.length]=ctl
      return Ctls
      }
   
   function _isEqual(a,b) {
      return _toCompare(a) === _toCompare(b)
   }

   function _toCompare(v) {
      if(!v && v!==0) v=''
      var cpCtrs=[Array,String,Number,Date], i,iL=cpCtrs.length
      for(i=0; i<iL; i++) {
         if(v.constructor === cpCtrs[i]) {
            if(v.toString) return v.toString()
         }
      }
      return v
   }

   $.fn[Plugin]=function(method)
      {
      // главная функция (используется для запуска методов в объекте methods)
      if ( methods[method] ) {
         return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
       } else if ( typeof method === 'object' || ! method ) {
         return methods.init.apply( this, arguments );
       } else {
         $.error( 'Метод ' +  method + ' не найден в $.yupForm' );
       }
      }
   // инициализация глобальных переменных
   
   $.extend($.fn[Plugin], {
      digitEnding : digitEnding, 
      addComponent : addComponent,
      methods : methods
   })

}) (coreLib);

/* yupCheckbox плагин checkbox с возможностью тройного состояния
*/
(function($) {
   var Plugin = 'yupCheckbox'
   var methods = {
      init : function(pars) {
         // если json.tristate, то значения "0","1","NULL"
         var jq=this
         this.each(function() {
            // цикл по исходным элементам
            var $cEl=$(this), hInp, n, v, im
            if(this.tagName=='INPUT') {
               // сохраняем оригинальный input и прячем его
               $(this).wrap('<div>').css('display','none')
               $cEl=$(this).parent()
               if((n=this.name) && !$cEl.attr('name')) $cEl.attr('name',n)
               hInp=this
               if(hInp.disabled) $cEl.data('disabled',true)
               }
            $cEl.data('value','0').data('focusable',true)
            if(pars) {
               if(pars.tristate) {
                  $cEl.data('tristate',true)
                  if(pars.value===null || pars.value=="NULL") $cEl.data('value','NULL')
               }
               if(pars.checked || (pars.value && pars.value!=='0' && pars.value!="NULL")) $cEl.data('value','1')
               if(v=pars.caption) $cEl.data('caption',v)
               if(pars.focusable===false) $cEl.data('focusable',false)
               if(pars.disabled) $cEl.data('disabled',true)
               if(v=pars.images) {
                  $cEl.data('images', v)
                  if(im=v['true']) images.chk=im
                  if(im=v['false']) images.unc=im
                  if(im=(v.partial || v.tristate || v['null'])) images.tri=im
               }
            }
            
            if(!$cEl.data('caption') && (v=$cEl.attr('yup-caption'))) $cEl.data('caption', v)
            
            // рендеринг
            addNativeM($cEl.get(0))
            $cEl.addClass(Plugin)
            .append('<div class="chkbox">'+($cEl.data('focusable') ? '<button></button>' : '')
               + '<img class="chkboxImg" src="' + images.unc + '" />'
               + '<img class="chkboxImg" src="' + images.chk + '" style="display:none" />'
               + '<img class="chkboxImg" src="' + images.tri + '" style="display:none" />'
               + '</div>')
            if(hInp && hInp.checked) $cEl.data('value','1')
            $cEl[Plugin]('_refresh')
            var capt=$cEl.data('caption')
            if(capt) $cEl.append('<div class="caption">'+capt+'</div>')
            $cEl.on('click',function() {
               if($cEl.data('focusable')) $cEl.find('button').get(0).focus()
               $cEl[Plugin]('toggle',true)
               })
            })
         return this
         }
      ,
      disable : function() {
         return this.each(function() {
            $(this)[Plugin]('setOption','disabled',1)
         })
      },
      enable : function() {
         return this.each(function() {
            $(this)[Plugin]('setOption','disabled',0)
         })
      },
      // переключить
      toggle : function(byClick) {
         this.each(function() {
            var el=$(this), opts=el.data(), ts=opts.tristate, val=opts.value, inp=el.find('input[type=checkbox]').get(0), cb1, oldV=val, ret
            if(opts['disabled']) return this
            if(val=='0') {
               if(ts) val='NULL'
               else {
                  val='1'
                  if(inp) inp.checked=true
               }
            } else if(val=='1') {
               val='0'
               if(inp) inp.checked=false
            } else {
               val='1'
               if(inp) inp.checked=true
            }
            el.data('value',val)
            
            if(byClick && (cb1=$(this).data('onclick'))) {
               if((ret=cb1.call(this, val))===false) {el[Plugin]('setValue', oldV); return}
               }
            if(inp && (cb1=inp.onchange)) {
               if((ret=cb1.call(inp))===false) {el[Plugin]('setValue', oldV); return}
               }
            $(this)[Plugin]('_refresh')         
            })

         return this
         }
      ,
      // убрать фокус
      blur : function() {
         this.find('button').get(0).blur()
         }
      ,
      focus : function() {
         this.find('button').get(0).focus()
         return this
         }
      ,
      // установить значение ('1', '0' или 'NULL')
      setValue : function(val) {
         var rv,chk=this

         if(chk.data('tristate') && (!val && val!==0 && val!='0' || val.toString().toLowerCase()=='null')) rv='NULL'
         else if(val && val!=='0') rv='1'; else rv='0'
         chk.data('value',rv)[Plugin]('_refresh')
         return chk
         }
      ,
      // назначить обработчик события
      on : function(eventType, callback) {
         var et=eventType.toLowerCase(), cb=callback
         if(et=='click' || et=='startedit') {
            this.data('onclick',cb)
            }
         return this
         }
      ,
      // приатачить другой элемент к чекбоксу в качестве лэйбла
      attachLabel : function(sel) {
         this.each(function() {
            $(sel).data(Plugin,this).on('click',function() {
               $($(this).data(Plugin))[Plugin]('toggle',1)
               })
            })
         return this
         }
      ,
      setOption : function(opt,val) {
         this.each(function() {
            var $el=$(this)
            if((typeof opt)=='object') {
               for(var i in opt) {
                  $el[Plugin]('setOption',i,opt[i])
                  }
               }
            else {
               $el.data(opt, val)
               $el[Plugin]('_refresh')
               }
            })
         return this
         }
      ,
      setOptions : function(o,v) {
         return this[Plugin]('setOption',o,v)
         }
      ,
      _refresh : function() {
         this.each(function() {
            var $el=$(this), dat=$el.data(), val=dat.value, dsp='display', n='none', v, aImg=$el.find('.chkboxImg')
               
            if($el.hasClass(v='checked')) $el.removeClass(v)
            if($el.hasClass(v='partial')) $el.removeClass(v)
            if(val==1 || val===true) $el.addClass('checked')
            
            else if(val.toString().toLowerCase()=='null') $el.addClass('partial')

            if(!val || val=='0') {
               if((v=$(aImg[2])).css(dsp)!=n) v.fadeOut(100)
               if((v=$(aImg[1])).css(dsp)!=n) v.fadeOut(100)
               }
            else if(val==1 || val===true) {
               
               if((v=$(aImg[2])).css(dsp)!=n) v.fadeOut(100)
               if((v=$(aImg[1])).css(dsp)==n) v.fadeIn(100)
               }
            else if((v=$(aImg[2])).css(dsp)==n) v.fadeIn(100)
            })
         return this
         }
      }
   
   
   var images={
      unc : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAMAAABFNRROAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAACRQTFRFgICA8fHx6Ojo7+/v+vr69vb26urq/f39+Pj47e3t////9PT0p2R6JQAAADJJREFUeNpczrkRACAQgMDz//rvVzJGNyMj4rVFDVFV1BTVRB1RSVQRtUR1UVnf5RVgABy1Atetjd0eAAAAAElFTkSuQmCC',
   
      chk:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAMAAABFNRROAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAACRQTFRFgICA6Ojo////6urq/f39+vr67e3t+Pj47+/v9vb28fHx9PT0C0g/QAAAAElJREFUeNpcjlsOwCAMw7Inbbn/fWfaSdVmQRL/IKQve4OdDXa9MLBRrIG5c7yGNCc3e2VEPh2Rw8wqs2/IoKSjwbbm98tHgAEAwvkCGVO3+PEAAAAASUVORK5CYII=',
      
      tri:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAMAAABFNRROAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAKVQTFRFgICA////6Ojo/f396urq+Pj4+vr69PT08fHx9vb27+/v7e3trKysuLi4mJiYt7e3qqqqs7KysrOzsrKzo6Sjp6emq6ysnJycl5aWkpKTkJCRtLS1tbW1rq6uu7u6n56foaGhtre3r6+wpKSksbGxvb2+t7e4rq6vpKWlnZ2dwcHBpaWlu7u7wMDAoaCgu7u8xcXFqqqpnp6esbGwq6qqsLCwpqamkSyYTwAAAHNJREFUeNpczkcWgkAABFEMk4kKBkCJChIEE/c/Gr2bh7X7uzKMZSsdtNFBlGY/13+cQkohQpzPt3jbZ0IgISzPnJ5HWwiIsWtUveo0YQzi/HbfX9yg5RySsumcXW4epISUGvvBir1SKWirg9a6v8tZgAEAhowHMWzgoagAAAAASUVORK5CYII='
      }
   
   // главная функция (используется для запуска методов в объекте methods)
   $.fn[Plugin]=function(method) {
      if(!method || $.isPlainObject(method)) return methods.init.apply(this, arguments)
      else if(methods[method]) return methods[method].apply( this, Array.prototype.slice.call(arguments, 1))
      else $.error( 'Метод ' +  method + ' не найден в $.'+Plugin );
      }
   $.fn[Plugin].methods=methods
   }
) (coreLib);

/* yupButton плагин кнопки с картинкой
*/
(function($) {
   var Plugin='yupButton'
   var methods = {
      // инициализация и рисование. Опции: {disabled,image,imagePosition,caption,value}
      init : function(options) {
         this.each(function() {
            var s1, s2='', btn=$(this), opts, def
            if(!options) options={}
            else {
               if(options.disabled) btn.data('disabled',true)
               }
            btn.addClass(Plugin).data('options',copyObj(options))

            addNativeM(btn.get(0))
            btn.get(0).resize = function(x,y) {
               var el = $(this)
               if(x != Und) el.width(x)
               if(y != Und) el.height(y)
               el[Plugin]('_refresh')
               }
            opts=btn.data('options');
            
            btn
            .on('mouseover',function(){
               if(!$(this).data('disabled'))
                  $(this).addClass('hover')
               })
            .on('mouseout',function(){
               if(!$(this).data('disabled'))
                  $(this).removeClass('hover').removeClass('pressed')
               })
            .on('mousedown',function(){
               if(!$(this).data('disabled'))
                  $(this).removeClass('hover').addClass('pressed')
               })
            .on('mouseup',function(){
               if(!$(this).data('disabled'))
                  $(this).removeClass('pressed').addClass('hover')
               })
            .on('keydown',function(ev) {
               if($.inArray(ev.keyCode,[32,13])>-1)
                  $(this).trigger('mousedown')
               })
            .on('keyup',function() {
               $(this).trigger('mouseup')
               })
            .on('click',function(ev) {
               if(!$(this).data('disabled')) {
                  var cb
                  if(cb=btn.data('onclick')) cb.call(this,ev)
                  }
               })
            // начало рисования кнопки
            s1='<div style="height:100%">'
               // вставка картинки
               if(s2=opts.image) {
                  var s3='',ip
                  if(ip=opts.imagePosition) {
                     if(ip.top) s3+='padding-top:'+ip.top+';'
                     if(ip.left) s3+='padding-left:'+ip.left+';'
                     if(s3) s3=' style="'+s3+'"'
                     }
                  s1+='<img align="top" src="'+s2+'"'+s3+' />'
                  }
               // вставка подписи
               s1 +='<span>'
               if(s2=opts.caption) {s1+=s2; btn.data('value',s2)}
               s1 +='</span>'
               
            s1+='</div><button></button>'
            
            def=btn.html()
            btn.html(s1)
            
            if(def) btn.find('span').html(def)
            btn[Plugin]('_refresh')
            
            btn.find('button')
            .on('blur',function() {
               if(!btn.data('disabled'))
                  $(this).parent().removeClass('hover')
               })
            .on('focus',function() {
               if(!btn.data('disabled'))
                  $(this).parent().addClass('hover')
               })
            })
         return this
         }
      ,
      on : function(evt,cb) {
         if(evt=='click') {
            this.data('onclick',cb)
            }
         return this
         }
      ,
      click : function() {
         return this.each(function() {
            $(this).trigger('click')
            })
         }
      ,
      _refresh : function() {
         var x,h,ct='', el=this
         if(el.data('disabled')) {
            el.removeClass('hover').addClass('disabled')
            ct='default'
            x=-18
            this.css('box-shadow','none')
            }
         else {
            el.removeClass('disabled')
            h=this.innerHeight()
            if(h<3) h=17
            if(h<=17) x=h-20
            else if(h<=32) x=parseInt(h-20-(h-17)/3,10)
            else x=h-25
            this.css('box-shadow','')
            }
         this.css('backgroundPosition','0px '+x+'px')
         this.css('cursor',ct).find('div,button').css('cursor',ct)
         return this
         }
      ,
      focus : function() {
         var btn=this.find('button').get(0)
         if(btn) btn.focus()
         return this
         }
      ,
      setValue : function(val) {
         this.data('value',val).find('span').html(val)
         return this[Plugin]('_refresh')
         }
      ,
      disable : function() {
         return this.data('disabled',1)[Plugin]('_refresh')
         }
      ,
      enable : function() {
         return this.data('disabled',0)[Plugin]('_refresh')
         }
      // конец методов mButton
      }
   
   // главная функция (используется для запуска методов в объекте methods)
   $.fn[Plugin]=function(method)
      {
      if ( methods[method] ) {
         return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
       } else if ( typeof method === 'object' || ! method ) {
         return methods.init.apply( this, arguments );
       } else {
         $.error( 'Метод ' +  method + ' не найден в $.yupButton' );
       }
      }
   $.fn[Plugin].methods=methods
   // инициализация глобальных переменных
   }
) (coreLib);


/* yupFile плагин текстового поля или области с выпадающим списком
*/
(function($) {
   var Plugin = 'yupFile', txtL='yupText', btnL='yupButton', statId=1
   , methods = {
      // публичные методы плагина
      init : function(opts) {
         // поддерживаемые опции action, emptyText='укажите путь к файлу', maxSize:'1024|1M,1k,1G', name, onload, postVars, width=200px, 
         if(!opts.name) return $.error('Не указано имя элемента file')
         if(!opts.action) opts.action=''
         if(!opts.width) opts.width= opts.multiple ? '270px' : '200px'
         if(!opts.emptyText) opts.emptyText=opts.multiple ? 'выберите один или несколько файлов' : 'укажите путь к файлу'
         
         this.each(function() {
            var el=$(this), cName=opts.name, frN = Plugin+'_'+cName + statId++, btn, v1,i, frm, btn, txt, inp, isM=opts.multiple ? 1 : 0
            el.data(Plugin, {options:opts}).addClass(Plugin).append('<div class="txtPath" name="'+cName+'"></div><div class="btnBrowse"></div><iframe name="'+frN+'"></iframe>'
            +'<form method="POST" enctype="multipart/form-data" target="'+frN+'" onsubmit="return false" action="'+opts.action+'">'
               + '<input class="file" type="file" name="' + cName + (cName.substr(cName.length-2) != '[]' ? '[]' : '') + '"'+(isM ? ' multiple' : '')
               + ((v1=opts.accept) ? (' accept="'+v1+'"') : '') + '>'
            +'</form>')

            frm=el.find('form')
            if(v1=opts.postVars) {
               for(i in v1) {
                  frm.append('<input type="hidden" name="'+i+'" />')
                  frm.children().last().attr('value',v1[i])
                  }
               }
            btn=el.find('.btnBrowse').yupButton({caption:'обзор..'}).css({borderTopLeftRadius:'0px', borderBottomLeftRadius:'0px', top:'1px'})
               .on('click', function() {
                  inp.get(0).click()
                  })
            txt=el.find('.txtPath')
               [txtL]({width: (parseFloat(opts.width)-btn.outerWidth())+'px', emptyText:opts.emptyText, spellcheck:false, readonly:1})
               [txtL]('on', 'change', function() {
                  var v; inp.attr('value',v=this.data('value'))
                  el.data('value',v)
                  })
            inp = el.find('.file').css({
               position:'absolute',top:'0px',right:'0px',
               width:'1px',height:'1px',opacity:0.1
               })
               .on('change', function() {
                  var n, f=this
                  txt[txtL]('setValue', f.multiple && (n=f.files.length) > 1 ? 'Выбрано ' + n + ' файл' + $.fn.yupForm.digitEnding(n,'','а','ов') : this.value)
                  el.data('value', this.value)
                  })
            })
         return this
         }
      ,
      focus : function() {
         if(this[0]) this.eq(0).find('.btnBrowse')[btnL]('focus')
         return this
         }
      ,
      on : function(evt,cb) {
         if(',load'.indexOf(','+evt)>-1) {
            this.data('on'+evt, cb)
            }
         return this
         }
      ,
      setValue: function(v) {
         return this.each(function() {
            var el=$(this)
            if(!v) el[Plugin]('clear')
         })
      },
      send : function(postVars, oCb) {
         this.each(function() {
            var el=$(this), cb, frm, i, hel, val
            el.find('iframe').get(0).onload = (oCb && $.isFunction(oCb)) ? oCb : ((cb=el.data('onload')) && $.isFunction(cb) ? cb : null)
            frm=el.find('form')
            if(postVars && $.isPlainObject(postVars)) for(i in postVars) {
               val = postVars[i]
               hel = frm.find('input:hidden[name=' + i + ']')
               if(!hel[0]) {
                  frm.append('<input type="hidden" name="'+i+'" />')
                  hel=frm.children().last()
                  }
               hel.attr('value',val)
               }
            frm.get(0).submit()
            })
         return this
      },
      // очистка поля с типом file и визуальной части
      clear: function() {
         return this.each(function() {
            var el=$(this), opts=el.data(Plugin).options, Und
            el.data('value', Und)
            el.find('[name=' + opts.name + ']')[txtL]('setValue', '')
            el.find('input[type=file]')[0].value=null
         })
      }

      // конец методов
   }
   
   
   
   // главная функция (используется для запуска методов в объекте methods)   
   $.fn[Plugin]=function(method) {
      if(methods[method]) return methods[method].apply(this, Array.prototype.slice.call(arguments, 1))
      else if($.isPlainObject(method) || !method) return methods.init.apply(this, arguments)
      else $.error('Метод ' +  method + ' не найден в $.'+Plugin)
      }
   $.fn[Plugin].methods=methods
   // инициализация глобальных переменных
}) (coreLib);




/* yupText плагин текстового поля или области с выпадающим списком
*/
(function($) {
   var Plugin='yupText', btL='yupButton',
      filters = {
         'float' : function(s) {
            var f,s2
            if(s==Und) return ''
            if((typeof s)!='string') s=s.toString()
            f=parseFloat(s2 = s.replace(/ /g,'').replace(/р(уб)?\./,'').replace(new RegExp(',','g'), '.' ))
            if( isNaN (f) ) return ""; else {
               if(s2.substr(s2.length-1)=='%') f = f/100
               return f
            }
         },
         percent: function(s) {
            if(s && s !== 0) {
               if(s.substr(s.length-1) != '%') s += '%'
               return filters['float'](s)
            } else return ''
         }
      }
      ,
      renderers = {
         'money' : function(val, opts) {
            var ci='\u221e'
            if(val==Infinity) return '+'+ci
            if(val==-Infinity) return '-'+ci
            if(!val && val!==0) return ''
            if(!opts) opts={} // precision=2, separator=' ', decPoint='.'
            var t, v1 = isNaN(t=parseFloat(val)) ? 0 : t, v, prec, sep, n, mult, ret, f, i
            prec = (v=opts.precision) || v===0 ? v : 2
            sep = (v=opts.separator) || v==='' ? v : ' '
            mult = Math.pow(10, prec)
            t = Math.round(v1 * mult) / mult
            n = t.toString().split('.')[0]
            f = Math.round(Math.abs(v1 - n) * mult).toString()
            for(i=0; i<prec - f.length; i++) f='0'+f
            ret = n.replace(/(\d{1,3}(?=(\d{3})+(?:\.\d|\b)))/g,"\$1" + sep) + (prec ? (opts.decPoint||'.') + f : '')
            return ret
         },
         'int' : function(val) {
            return renderers.money(val, {precision:0, separator:''})
         },
         'percent' : function(val, opts) {
            if(!isNaN(val)) {
               val=val*100
               val=renderers.money(val, opts)+'%'
            }
            return val
         },
         'date' : function(sql) {
            if(!sql) return
            var d,m,Y
            d=sql.substr(8,2)
            m=sql.substr(5,2)
            Y=sql.substr(0,4)
            if(d&&m&&Y) return(d+'.'+m+'.'+Y)
         },
         'datetime' : function(s) {
            var ret=renderers.date(s), s2, ar, v
            if(ret) {
               s2 = s.split(' ')[1] || '00:00'
               ar = s2.split(':')
               if(ar.length<2) ar.push('00')
               ret += ' ' + ((v=getN(ar[0]))<10 ? '0' : '')+v + ':' + ((v=getN(ar[1]))<10 ? '0' : '')+v
               return ret
            }
         }
      }
   
   function resizeA() {
      var el=this, ff=0 // ff=!!($('body').css('MozBoxSizing')) // узнать, с какой версии устранили в FireFox глюк!!!
      $(el).data(Plugin)[Plugin]('resize', Und, el.scrollHeight - $(el).height() + $(el).innerHeight())   
      //$(el).height(el.scrollHeight - $(el).height() + $(el).innerHeight() + (ff ? 2 : 0))
   }
   function hResized() {
      var tel=this, el=tel.data(Plugin), btn, v, btW, of1,of2, tx0
      if((btn=el.find('.'+Plugin+'Btn'))[0]) {
         // если есть кнопка справа от поля и она перенеслась
         tx0=el.find('.'+Plugin+'Input')
         btn[btL]('setValue','<div style="width:1px;height:'+(v = tel.height()-15)+'px">').find('img').css({position:'relative', top:v/2})
         btW=btn.outerWidth()
         of1=tx0.offset(); of2=btn.offset()
         if(of1.top + tx0[0].scrollTop < of2.top) tx0.outerWidth(tx0.outerWidth()-btW)
      }
   }
   function getN(n){var v; return isNaN(v=parseFloat(n)) ? 0 : v}
   
   var methods = {
      init : function(options) {
         // caption, value, notNull, disabled, type:'text'|'textarea'|'password',dropdown,emptyText,width,height,ddImage,fadeTime
         // ddImagePosition:{top:,left:}, ddWidth='auto', ddAlign='left', spellcheck=true, readonly, renderer, filter
         // renderConfig : {precision:2, separator:' ', decPoint:'.'}
         // autoHeight
         this.addClass(Plugin).each(function() {
            if(this.tagName=='INPUT') return $.error('попытка вставить элементы в элемент')
            var $el=$(this), v, w1,h1
            this.selectContent = function() {
               var el; if(el=$(this).find('input')[0]) el.select()
            }
            if(options) {
               if(options.fadeTime==Und) options.fadeTime=300
               $el.data('options',copyObj(options))
               }
             else $el.data('options',{
                // опции по-умолчанию
                type : 'text',
                fadeTime : 300,
                spellcheck : true
                })
             
             var s1,opts=$el.data('options'),s2='', isDD=opts.dropdown, def

             if(isDD) $el.addClass(Plugin+'_withButton')

             // задание ширины (если задана в %, то элемент ввода шириной 100%, а контейнер в указанных %)
             if((s1=opts.spellcheck)!==Und && !s1) opts.spellcheck=false


             if(opts.width) {
                var wip=(opts.width.toString().indexOf('%')>-1)
                if(wip) $el.css('width',opts.width)
                s2+='width:'+(wip ? '100%' : opts.width)+';'
                }
             if(opts.height) {
               var hip=(opts.height.indexOf('%')>-1)
               if(hip) $el.css('height',opts.height)
               s2+='height:'+(hip ? '100%' : opts.height)+';'
               }

             if(s2) s2=' style="' + s2.substr(0,s2.length-1) + '"'
             
             s1 = ((v=opts.type)=='textarea' ? '<textarea' : (v=='div' ? '<div' + (opts.editable && !opts.readonly ? ' CONTENTEDITABLE' : '') : ('<input type="'+(v || 'text')+'"')))
                +' class="'+Plugin+'Input"'+s2
                +(opts.type=='textarea' ? '></textarea>' : (v=='div' ? '></div>' : ' />'))
                +(isDD ? '<div class="'+Plugin+'Btn"></div>' : '')
             
             if(opts.value == Und && (def=$el.html())) opts.value=def // заполнить значение из тэга, если не задано в опциях
             
             $el.html(s1)

             addNativeM($el.get(0))
             
             $el[0].resize = function(x,y) {
               var el=$(this), opts=el.data('options'), tel = el.find('.'+Plugin+'Input'), cb
               x= getN(x); y=getN(y)
               if((cb=el.data('onresize')) && $.isFunction(cb)) cb.call(el,x,y)
               if(x>0) tel.outerWidth(x)
               if(y>0) tel.outerHeight(y)
               if(x>0 || y>0) hResized.call(tel)
             }
             
             var txt, pH
             txt = $el.find('.'+Plugin+'Input').data(Plugin, $el)

             
            if(opts.autoHeight) {
               $el.addClass('yup-auto-height')
               txt.on('change keyup focus', resizeA)
               $el.on('click', function(ev) {
                  var opts=$el.data('options')
                  if(opts.disabled) resizeA.call(txt[0], ev)
               })
            }

             // подгонка высоты нативного контрола для IE<8 (т.к. не поддерживается border-box и высота textarea в %)
             if(txt.outerHeight() != (pH = txt.parent().height()) ) {
               txt.height(pH - (txt.outerHeight()-txt.height()))
               txt.width(txt.width() * 2 - txt.outerWidth())
               }
             
            if(isDD) {
                // если кнопка со списком
                var dd=$(this).find('.'+Plugin+'Btn'), ip
                dd[btL]({
                   image: opts.ddImage ? opts.ddImage : img.dropdown,
                   imagePosition: (ip=opts.ddImagePosition) ? {
                      top: ip.top || '4px',
                      left: ip.left || '0'
                      } : Und
                   }).css({
                       'border-top-left-radius':'0px'
                      ,'border-bottom-left-radius':'0px'
                      ,'-webkit-border-top-left-radius':'0px'
                      ,'-webkit-border-bottom-left-radius':'0px'
                      ,'-moz-border-top-left-radius':'0px'
                      ,'-moz-border-bottom-left-radius':'0px'
                      }) // обработка событий нажатия кнопки в поле со списком
                   [btL]('on','click',function(ev) {
                      var dat=$el.data(),ret
                      if(dat.onfocus) {
                        ret = dat.onfocus.call($el)
                      }
                      if(ret!==false) {
                         $(this).prev().focus()
                         $el[Plugin]('toggleDD')
                      }
                      
                      if(!ev.pageX && !ev.pageY) return false
               })
            }
             txt.on('focus',function() {
                   var dat=$el.data(), txt=$(this), isD=txt[0].tagName=="DIV", opts=dat.options, empt='emptyText', v
                   txt.find('.'+Plugin+'Btn').addClass('hover')
                   txt.parent().addClass('inFocus')
                   if(!(v=$el.data('value')) && v!==0) {
                      if(!isD) txt.attr('value','').removeClass(empt)
                      else if(opts.editable) {
                        if(!opts.width) txt.css({minWidth:txt.width()+'px', minHeight:txt.height()+'px'})
                        txt.html('').removeClass(empt)
                      }
                   }
                   if(dat.onfocus) dat.onfocus.call($el)
                   })
                .on('blur',function(e) {
                  var d=$el.data(),cb,opts=d.options,dds
                   $el.removeClass('inFocus').find('.'+Plugin+'Btn').removeClass('hover')
                   if((cb=d.onblur) && $.isFunction(cb)) {
                     if((dds=opts.dropdown) && $el[Plugin]('isOpened')) return
                     else cb.call($el)
                     }
                   $el[Plugin]('_refresh')
                   })
                .on('keyup',function(ev) {
                   var dat=$el.data(), oldV = dat.value, opts=dat.options
                   if(!(opts.readonly || opts.type=='div' && !opts.editable)) {
                     $el.data('value', filterValue.call($el, this.value))
                   }
                   if(dat.onkeyup) dat.onkeyup.call($el, ev)
                   if(dat.onstartedit && dat.value != oldV) dat.onstartedit.call($el)
                   })
                .on('change',function(ev) {
                   var dat=$el.data()
                   // перенести в обработчик onrealychange, даже если нету обработчика $el[Plugin]('setValue',filterValue.call($el,this.value))
                   $el.data('value', filterValue.call($el, this.value))
                   if(dat.onchange) dat.onchange.call($el,ev)
                   })
                .on('keydown',function(ev) {
                  var kk=ev.keyCode, dat=$el.data(), cb, ret
                  if(kk==13) $(this).trigger('change')
                  if(cb = dat.onkeydown) {
                     ret=cb.call($el, ev)
                     if(ret===false) {
                        ev.preventDefault()
                        return ret
                     }
                  }
                  })
                .on('click',function(ev) {
                  var dat=$el.data(), opts=dat.options
                  // открытие списка по клику, если тип div и нередактируемый
                  if(!opts.disabled && opts.dropdown && (opts.type=='div' && !opts.editable || opts.readonly)) $el[Plugin]('toggleDD')
                })
                .get(0).enter=1
             $el.data({value: v = (opts.value!==Und ? opts.value : ''), oldValue:v, oldNativeValue:txt.attr('value')||''})
             $el[Plugin]("_refresh")
             
             
             if(txt[0].tagName=='TEXTAREA') {
                w1 = txt.width(); h1 = txt.height()
                txt.css({'min-width':w1+'px', 'min-height':h1+'px'})
                this.resize(w1,h1)
             }

          })
         return this
         }
      ,
      // проверка, открыт ли список, если поле со списком
      isOpened : function() {
         if(this[0]) {
            var el=$(this).eq(0), opts=el.data('options'), dds=opts.dropdown, i, oL=$.fn[Plugin].openedDDL
            if(dds && oL[dds]) return true
            }
         return false
         }
      ,
      // разворачивает / сворачивает список
      toggleDD : function(drop, mode, cb2) { // drop='up', 'down', '' - toggle by default
         var el=this, opts=el.data('options'), dds=opts.dropdown, dd=$(dds), cb, ret=1, curP, i=0, pEl

         // но при открытии списка внутри списка нужно рекурсивно найти вверху элемент с yupText_ddParent и заблокировать его закрытие при клике вне его
         curP = el.parent()
         while(!(pEl=curP.data(Plugin+'_ddParent')) && curP[0]) {
            i++; if(i>9999) {$.error('Recursion error');break}
            curP = curP.parent()
         }
         

         if(dd[0]) {
            if(dd.css('display')=='none') {
               // список еще не развернут
               dd.css({top:0,left:0})
               if(!drop || drop=='down') {
                  
                  // список нужно перетащить в конец body, чтобы не было проблем
                  $('body').append(dd[0])

                  // пометим список, добавив ему свойство yupText_ddParent, ссылающееся на поле элемента-активатора
                  dd.data(Plugin+'_ddParent', el)

                  if(pEl) {
                     curP.data(Plugin+'_ddLock',1) // curP - список 1-го уровня
                  }

                  if(cb=el.data('ondropdown')) cb.call(el)
                  dd.fadeIn(opts.fadeTime, cb2)
                  if(cb=el.data('onvisible')) {
                     setTimeout(function() {
                        cb.call(el)
                        _ddAlign.call(el)
                     }, 2)
                  } else _ddAlign.call(el)
                  if(!$.fn[Plugin].openedDDL[dds]) $.fn[Plugin].openedDDL[dds]=dd
                  }
            } else {
               // список уже развернут
               // или уже разворачивается
               _ddAlign.call(el)
               if(!drop || drop=='up') {
                  if(mode!='bymousedown' && (cb=el.data('ondropup'))) {
                     ret = cb.call(el, {type:'dropup', by:'button'})
                  }
                  if(ret!==false) {
                     if(pEl) {
                        // убрать блокировку при закрытии вторичного списка
                        curP.data(Plugin+'_ddLock',0) // curP - список 1-го уровня
                     }
                     dd.fadeOut(opts.fadeTime, cb2)
                     $.fn[Plugin].openedDDL[dds] = Und
                  }
               }
            }
         }
         return this
      }
      ,
      setValue : function(val) {
         this.filter('.'+Plugin).each(function() {
            var $el=$(this), dat=$el.data(), oldV=dat.value
            $el.data({'value':val,'oldValue':val})[Plugin]('_refresh', {setOldNatVal:1})
            if(dat.onstartedit && dat.value != oldV) dat.onstartedit.call($el)
            })
         return this
         }
      ,
      focus : function() {
         return this.each(function() {
            var $el=$(this), opt=$el.data('options'), inp
            if(!opt.disabled) {
               inp=$el.find('.'+Plugin+'Input')[0]
               if(!inp.disabled) {
                  $el.addClass('inFocus')
                  setTimeout(function() {inp.focus()}, 50)
               }
            }
            return false
         })
      }
      ,
      forGrid : function() {return this}
      ,
      blur : function() {
         this.each(function() {
            var $el=$(this), opt=$el.data('options'), inp
            inp=$el.find('.'+Plugin+'Input').get(0)
            if(!inp.disabled) inp.blur()
            })
         return this
         }
      ,
      setOption : function(opt,val) {
         this.each(function() {
            var $el=$(this)
            if((typeof opt)=='object') {
               for(var i in opt) {
                  $el[Plugin]('setOption',i,opt[i])
                  }
               }
            else {
               $el.data('options')[opt]=val
               $el[Plugin]('_refresh')
               }
            })
         return this
         }
      ,
      setOptions : function(opt,val) {
         return this[Plugin]('setOption',opt,val)
         }
      ,
      on : function(evt,cb) {
         if('change,dropdown,dropup,keydown,keyup,startedit,focus,reallychange,resize,blur,visible,'.indexOf(evt+',')>-1) this.data('on'+evt,cb)
         return this.each(function() {
            var el=this, i
            if(evt=='reallychange' && $.isFunction(cb)) {
               if((i = inArrA0(el, $.fn[Plugin].rcElements))<0) $.fn[Plugin].rcElements.push([el, cb])
               else $.fn[Plugin].rcElements[i][1]=cb
            }
         })
      }
      ,
      disable : function() {
         this.each(function() {
            $(this).data('options').disabled=1
            })
         this[Plugin]('_refresh')
         return this
         }
      ,
      enable : function() {
         this.each(function() {
            $(this).data('options').disabled=0
            })
         this[Plugin]('_refresh')
         return this
         }
      ,
      add : function(ns,m,cb) {
         var o = (ns == 'renderer' ? renderers : (ns == 'filter' ? filters : ''))
         if(o) {
            o[m]=cb
            this[Plugin]('setOption',ns,m)
            }
         return this
         }
      ,
      realign : function() {
         return this.each(function() {
            _ddAlign.call($(this))
         })
      },
      resize : function(x,y) {
         this.each(function() {
            this.resize(x,y)
            })
         return this   
         }
      ,
      _refresh : function(cOpt) {
         this.each(function() {
            if($(this).hasClass(Plugin)) {
               var $el=$(this), dat=$el.data(), val=dat.value, opts=dat.options, $txt=$el.find('.'+Plugin+'Input'), v, tt=opts.type
               if(!val && val!==0) {
                  if(!$el.hasClass('inFocus')) {
                     $txt.addClass('emptyText')
                     v= opts.emptyText || ''
                  } else v=val
                  if(tt=='div') $txt.html(v)
                  else $txt.attr({
                     value: v,
                     spellcheck : false
                     })
               }
               else {
                  var rnd = opts.renderer, rndF = $.isFunction(rnd) ? rnd : renderers[rnd]
                  v = rndF ? rndF.call($el, dat.value, opts.renderConfig) : dat.value
                  if((dat.value || dat.value === 0) && !v && v !==0) v=dat.value
                  $txt.removeClass('emptyText')
                  if(tt=='div') $txt.html(v)
                  else $txt.attr('value', v)
                  $txt.attr('spellcheck', !!opts.spellcheck)
               }
               if(cOpt && cOpt.setOldNatVal) dat.oldNativeValue=v

               if($.inArray(opts.type,['div','textarea'])>-1 && opts.dropdown) hResized.call($txt)
               if(opts.disabled)
                  $(this).addClass('disabled')
               else
                  $(this).removeClass('disabled')
               $txt.attr('disabled',opts.disabled ? true : false)
               
               if(v=(opts.readonly||opts.readOnly)) $el.addClass('readonly')
               else $(this).removeClass('readonly')
               $txt.attr('readOnly',v ? true : false)
               
               $(this).find('.'+Plugin+'Btn').yupButton(opts.disabled ? 'disable' : 'enable')
               }
            })
         return this
         }
      
      // конец методов yupText
      }
   
   // главная функция (используется для запуска методов в объекте methods)
   $.fn[Plugin]=function(method)
      {
      if ( methods[method] ) {
         return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
       } else if ( typeof method === 'object' || ! method ) {
         return methods.init.apply( this, arguments );
       } else {
         $.error( 'Метод ' +  method + ' не найден в $.'+Plugin );
       }
      }
   $.extend($.fn[Plugin], {
      methods:methods,
      openedDDL:{},
      renderers : renderers,
      filters : filters,
      rcElements : []
      })
   var img={
      dropdown : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAHCAYAAADebrddAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAF1JREFUeNp0j0EOwCAIBMH0l/ViH4aXvlMUsjHUlDVIIgMurKoECeV6/DZ4hSg0wgmyOl2Y2LjUdKyOt1ku+KKvhwy01J2DjW2F+N4RLfhuAf40nOAfHJeVszYFGABbMJ17jO/p5AAAAABJRU5ErkJggg=="
      }
   $.fn[Plugin].images=img
   
   function inArrA0(el, arr) {
      var i
      for(i in arr) {
         if(el == arr[i][0]) return i
      }
      return -1
   }
   
   function _hasFixedParent(el) {
      while(el && el != Doc) {
         if($(el).css('position') == 'fixed') return 1
         el = el.parentNode
      }
   }
   
   function _ddAlign() {
         var opts=this.data('options'), dd = 'dropdown', dH2, v, WS = windowSize(Win), dW
         if($(opts[dd])[0]) {
            // позиционирование выпадающего списка
            var ofs=this.offset(), tiH=this.find('.'+Plugin+'Input').outerHeight(), $dd=$(opts[dd]), ddH, ofsT, ofsL, $doc=$(Doc), algn=opts.ddAlign||'', ddW
            $dd.css({position:_hasFixedParent(this[0]) ? 'fixed' : 'absolute'})
            ofsL = ofs.left
            ddW=$dd.outerWidth()
            if(opts.ddAlign && algn.indexOf('right')>-1) {
               ofsL -= (ddW - this.width())
               if(ofsL<0) ofsL=0
            }
            ofsT = parseInt(ofs.top + tiH, 10)
            ddH = $dd.outerHeight()
            if((ofsT + ddH - $doc.scrollTop() - WS.windowHeight) > 0) ofsT = ofs.top - ddH
            if((dW = ofsL + ddW - $doc.scrollLeft() - WS.windowWidth) > 0) ofsL -= dW
            $dd.data(Plugin,this).css({ // !!! удалить свойство yupText из списка
               top: (ofsT<0 ? 0 : ofsT) + 'px',
               left: ((v=parseInt(ofsL, 10))<0 ? 0 : v) + 'px'
            })
         }
      }
   
   function filterValue(val) {
      // должен запускаться в контексте yupText
      // еще этот обработчик должен уметь возвращать что-то, что говорит компоненту не менять его реальное значение
      var $el=this, opts=$el.data().options, fil=opts.filter, filF
      if(fil) filF=((typeof fil)=='string') ? filters[fil] : fil
      return(filF ? filF.call($el, val) : val)
   }
   
   // вешаем на документ событие click
   $(Win.document).on('mousedown',function(ev) {
      // проверяем массив открытых ddl и если мыша не в них и связанных с ними полях, то сворачиваем
      var i,ddl, yt, oDDL = $.fn[Plugin].openedDDL, cb, ret, $doc = $(Doc)
      for(i in oDDL) {
         ddl = oDDL[i]
         if(ddl) {
            // для каждого списка
            yt = ddl.data(Plugin+'_ddParent')
            var x=ev.pageX, y=ev.pageY, ofs=ddl.offset(), of2 = yt.offset(),
               ddW=ddl.outerWidth(), ddH=ddl.outerHeight(),
               ytW = yt.outerWidth(), ytH=yt.outerHeight()
            
            if(ddl.css('position')=='fixed') {x -= $doc.scrollLeft(); y -= $doc.scrollTop()}
            if(yt && !( x>=ofs.left && x<=(ofs.left+ddW) && y>=(ofs.top) && y<=(ofs.top+ddH)
                   || 
                  x>=of2.left && x<=(of2.left+ytW) && y>=(of2.top) && y<=(of2.top+ytH)
                  ) && !ddl.data(Plugin+'_ddLock')) {
               if((cb=yt.data('ondropup')) && $.isFunction(cb)) {
                  ret = cb.call(yt, {type:'dropup', by:'mousedown'})
                  if(ret===false) continue
               }
               yt[Plugin]('toggleDD', '', 'bymousedown')
            }
         }
      }
   })
   
   // создаем глобальный таймер для отслеживания события reallychange
   Win.setInterval(function() {
      // проверка всех элементов yupText с обработчиком reallychange на изменение значения, причем не должен срабатывать при изменении методом setValue
      var i, arEls=$.fn[Plugin].rcElements, el, cb
      for(i in arEls) {
         (function(el, cb) {
            var txt, n1, n2, inF, d, opts, v1,v2
            d = el.data(); opts=d.options
            inF=el.hasClass('inFocus')
            
            if(!d.tos) {
               txt = el.find('.'+Plugin+'Input')
               n1=d.oldNativeValue
               n2=txt[0].tagName=='DIV' ? txt.html().replace(/^<br>$/i,'') : txt.attr('value')
               if(inF && !txt.hasClass('emptyText')) {
                  d.value = filterValue.call(el, n2)
               }
               if(((v2=d.value) != (v1=d.oldValue))) { //  && inF !!! Убрал, т.к. были глюки при быстром вводе и потере фокуса, но м.б. глюки в полях со списьком
                  d.tos = 1
                  setTimeout(function() {
                     if(d.value==d.oldValue) {
                        cb.call(el, v2, {oldValue:v1, oldNativeValue:n1, nativeValue:n2})
                     }
                     d.tos = 0
                  }, opts.reallychangeTimeout||500)
                  d.oldValue=v2
                  d.oldNativeValue=n2
               }
            }
         
         }) ($(arEls[i][0]),arEls[i][1]);
      }
   }, 100)
   
   
   }
) (coreLib);

/* yupCalendar плагин календаря и полей типа date и datetime (yupDate, yupDateTime)
*/
(function($) {
   var nextId=1, Plugin="yupCalendar", txL='yupText'
   
   function refreshValue(fld, noEv) {
      // на входе $поле yupDate или yupDateTime
      var dat=fld.data(), opts=dat.options, time='', datS, oldV=dat.value
      if(opts.type!='date') {
         time = fld.find('.'+txL+'Time').data('value')
         }
      datS=fld.find('.'+txL+'Date').data('value')
      
      fld.data('value', datS ? datS.substr(6) + '-' + datS.substr(3,2) + '-' + datS.substr(0,2) + (time ? ' '+time : '') : '')
      if(!noEv) {
         if(dat.value != oldV && dat.onchange) dat.onchange.call(fld)
         if(dat.value != oldV && dat.onstartedit) dat.onstartedit.call(fld)
      }
   }
   
   var methods = {
      // отрисовка полей типа date и datetime
      init : function(options) {
         this.each(function() {
            if(/div|span|td|th/i.test(this.tagName)) {
               var dwt,opts, $el=$(this), time,date, s1='', yCal=$el, s2, ft, v
               if(!options) options={
                  type : 'date',
                  on : {}
               }
               $el.data(Plugin,{
                  on : options.on || {}
               })
               $el.data('options',options)
               opts=options
               ft = opts.firstTime
               dwt =opts.type=='datetime' ? 1 : 0
               
               $el.addClass(Plugin)
               addNativeM(this)
               this.selectContent=function() {
                  $el.find('.'+txL)[0].selectContent()
               }
               
               if(dwt) s2='<div class="'+txL+'Time"></div>'
               s1+=(dwt && ft ? s2 : '') + '<div class="'+txL+'Date"></div>' + (dwt && !ft ? s2 : '')
               time=$el.html(s1).find('.'+txL+'Time')
               date=$el.find('.'+txL+'Date')
               
               if(dwt) {
                  time[txL]({emptyText:'чч:мм',disabled:opts.disabled})[txL]('on','change',function() {
                     this[txL]('setValue',hmFilter(this.data('value')))
                     refreshValue(yCal)
                  }).find('.'+txL+'Input')
               }

               date[txL]({
                  emptyText:'ввод даты',dropdown:'#yupCalendarFor'+nextId,
                  ddImage:img.calendar, ddAlign:'right',
                  disabled:opts.disabled
                  })
               [txL]('on','change',function() {
                  this[txL]('setValue',dmyFilter(this.data('value')))
                  refreshValue(yCal)
               })
               [txL]('on','dropdown',function() {
                  var $date=this, val=$date.data('value'), cb, ret
                  if(cb = $el.data(Plugin).on.dropdown) {
                     if((ret = cb.call($el, {type:'dropdown', plugin:Plugin})) === false) return ret
                  }
                  if(val) {
                     // если значение в поле есть, то отобразим его и в календарике
                     var d=new Date(val.substr(3,2)+'/'+val.substr(0,2)+'/'+val.substr(6,4)), cal = $($date.data('options').dropdown)
                     cal.data('dmyOld',date2dmy(cal.data('date')))
                     cal.data('date',d)[Plugin]('_refresh')
                  }
               })
               [txL]('on','dropup', function(o) {
                  var cb, ret
                  if(cb = $el.data(Plugin).on.dropup) {
                     if((ret = cb.call($el, {type:'dropup', plugin:Plugin, by:o.by})) === false) return ret
                  }
               })
               if(dwt && !ft) date.find('.yupButton').css({borderRadius:'0px'})
               $('body').append('<div id="yupCalendarFor'+nextId+'"></div>')
               $('#yupCalendarFor'+nextId)[Plugin]('render').css('display','none')
               if(v=opts.value) $el[Plugin]('setValue', v)
               nextId ++
            }
         }) 
         return this
      },
      on : function(evt,cb) {
         var el=this
         if('change,startedit,'.indexOf(evt+',')>-1) {
            el.data('on'+evt, cb)
         }
         if('dropdown,'.indexOf(evt+',')>-1) {
            el.data(Plugin).on[evt] = cb
         }
         return el
      },
      forGrid : function() {return this}
      ,
      addClassFunc : function(fname, fdef) {
         this.each(function() {
            var ctl = $(this), isT
            if(ctl.hasClass('yupCalendar')) {
               ctl = $(ctl.find('.'+txL+'Date').data('options').dropdown)
               isT = 1
               }
            ctl.data(Plugin).classFunc[fname] = ((typeof fdef)=='function' ? fdef : Und)
            if(!isT) ctl[Plugin]('_refresh')
            })
         return this
         }
      ,
      setRenderer : function(fdef) {
         this.each(function() {
            var ctl = $(this), isT
            if(ctl.hasClass('yupCalendar')) {
               ctl = $(ctl.find('.'+txL+'Date').data('options').dropdown)
               isT = 1
               }
            ctl.data(Plugin).renderer = ((typeof fdef)=='function' ? fdef : Und)
            if(!isT) ctl[Plugin]('_refresh')
            })
         return this
         }
      ,
      // отрисовка календаря
      render : function(date) {
         this.each(function() {
          var s1,i,j,date,yCal=$(this), curId, calM, calY
          if(!date) date=new Date()
          yCal.data('date',date).addClass(Plugin+'_calendar').data(Plugin,{classFunc:{}})
          
          if(!(curId = yCal.attr('id'))) {
             yCal.attr('id', curId = Plugin + nextId)
             nextId++
          }
          s1='<div class="calHead"><div class="yupPeriodMonth"></div><div class="yupPeriodYear"></div></div>'
          +'<div class="calTable"><table cellpadding="0" cellspacing="0" class="yupUnselectable"><thead><tr>'
          for(i=0;i<7;i++) s1+='<th'+(i>4 ? ' class="weekend"' : '')+'>'+$.fn[Plugin].weekdays[i]+'</th>'
          s1+='</tr></thead><tbody>'
          for(i=0;i<6;i++) {
             s1+='<tr>'
             for(j=0;j<7;j++) {
                s1+='<td></td>'
             }
             s1+='</tr>'
          }
          s1+='</tbody></table><div class="calFoot"><div class="btnCalToday"></div><div class="btnCalOK"></div></div>'
          yCal.html(s1)

          // отрисовываем список месяцев, если еще нет
          if(!$('#'+curId+'_monthsList') [0]) {
             var s2='<div id="'+curId+'_monthsList" class="yupCalendarDD yupUnselectable"><table cellpadding="0" cellspacing="0">', mns=$.fn[Plugin].months
             for(i=0;i<mns.length;i++) {
                s2+='<tr><td>'+mns[i]+'</td></tr>'
             }
             s2+='</div>'
             $('body').append(s2)
             $('#'+curId+'_monthsList td')
             .on('mouseover',function() {$(this).addClass('hover')})
             .on('mouseout',function() {$(this).removeClass('hover')})
             .on('mousedown',function() {$(this).addClass('clicked').removeClass('hover')})
             .on('click',function() {
                var ddl=$(this).parentsUntil('.yupCalendarDD').last().parent(), yTxt=ddl.data(txL), mnth=$(this).html(), tH, tdH, newM, date
                ddl.find('td.clicked').removeClass('clicked')
                $(this).addClass('clicked')
                yTxt[txL]('setValue',mnth)[txL]('toggleDD')
                if( (newM=$.inArray(mnth, $.fn[Plugin].months)) >-1 ) {
                   date = yCal.data('date')
                   yCal.data('dmyOld',date2dmy(date))
                   date.setMonth(newM)
                   yCal[Plugin]('_refresh')
               }
            })
         }
          // отрисовываем список годов, если еще нет
          if(!$('#'+curId+'_yearsList')[0]) {
             var s2='<div id="'+curId+'_yearsList" class="yupCalendarDD yupUnselectable"><table cellpadding="0" cellspacing="0">', cY=(new Date()).getFullYear()
             for(i=0;i<13;i++) {
                s2+='<tr><td>'+(cY+i-6)+'</td></tr>'
             }
             s2+='</div>'
             $('body').append(s2)
             $('#'+curId+'_yearsList td')
             .on('mouseover',function() {$(this).addClass('hover')})
             .on('mouseout',function() {$(this).removeClass('hover')})
             .on('mousedown',function() {$(this).addClass('clicked').removeClass('hover')})
             .on('click',function() {
                var ddl=$(this).parentsUntil('.'+Plugin+'DD').last().parent(), yTxt=ddl.data(txL), y=$(this).html(), date
                yTxt[txL]('setValue',y)[txL]('toggleDD')
                ddl.find('td').each(function(i) {
                   $(this).html(i-6+parseFloat(y))
                   if(i==6) {
                      $(this).addClass('clicked')
                   } else $(this).removeClass('clicked')
                })
                date = yCal.data('date')
                yCal.data('dmyOld',date2dmy(date))
                date.setFullYear(y)
                yCal[Plugin]('_refresh')
             })
          }
          
          calM = yCal.find('.yupPeriodMonth')[txL]({dropdown:'#'+curId+'_monthsList',emptyText:'месяц?'})[txL]('on','dropdown', function() {
            var dd=$(this.data().options.dropdown), mi=yCal.data().date.getMonth()
            yCal.data(txL+'_ddLock',1)
            dd.find('td').each(function(i) {
               $(this)[(mi==i ? 'add' : 'remove') + 'Class'] ('clicked')
            })
          })
          $('#'+curId+'_monthsList').outerWidth(calM.outerWidth())
              
          
          calY = yCal.find('.yupPeriodYear')[txL]({dropdown: '#'+curId+'_yearsList',emptyText:'год?'}).css('float','right')
          [txL]('on','change',function() {
             var ddl=$(this.data('options').dropdown), val=this.data('value')
             if(ddl.css('display')!='none') this[txL]('toggleDD')
             if(val) {
                if(isNaN(val)) {
                   this[txL]('setValue','')[txL]('toggleDD')
                   }
                else {
                   ddl.find('td').each(function(i) {
                      $(this).html(parseInt(val,10)-6+i)
                      })
                   var date=yCal.data('date')
                   yCal.data('dmyOld',date2dmy(date))
                   date.setFullYear(val)
                   yCal[Plugin]('_refresh')
                   }
                }
             })
         [txL]('on','dropdown', function() {
            var dd=$(this.data().options.dropdown), y=yCal.data().date.getFullYear()
            yCal.data(txL+'_ddLock',1)
            dd.find('td').each(function() {
               var el=$(this)
               el[(el.html()==y ? 'add' : 'remove') + 'Class'] ('clicked')
            })
          })

          $('#'+curId+'_yearsList').outerWidth(calY.outerWidth())
          
          yCal.find('.btnCalToday').yupButton({caption:'сегодня'}).yupButton('on','click',function() {
             yCal.data('dmyOld',date2dmy(yCal.data('date')))
             yCal.data('date',(new Date()))[Plugin]('_refresh')
             })
          yCal.find('.btnCalOK').yupButton({caption:'выбрать'}).css('float','right').yupButton('on','click',function() {
             if(yCal.data(txL))
                yCal[Plugin]('_refresh').data(txL)[txL]('toggleDD')
             })
          yCal[Plugin]('_refresh')
          })
         return this
         }
      ,
      enable : function() {
         this.data('disabled',0).find('.'+txL)[txL]('enable')
         return this
         }
      ,
      disable : function() {
         this.data('disabled',1).find('.'+txL)[txL]('disable')
         return this
         }
      ,
      // отображение циферок с ссылками
      _refresh : function() {
         this.each(function() {
            var $el=$(this), dat = $el.data(), date=dat.date, y=date.getFullYear(), m=date.getMonth(), d=date.getDate(), 
               wd=date.getDay(), tM, tDate=new Date(), tWD, i, ah=0, calF, cF = dat[Plugin].classFunc, ren = dat[Plugin].renderer, dmy2, cb
            tDate.setTime(date.getTime())
            tM=tDate.getMonth(); tWD=tDate.getDay()
            $el.data(txL+'_ddLock',0)
            while((tM==m || tWD!=1) && ah<1000) {
               tDate.setDate(tDate.getDate()-1)
               tM=tDate.getMonth(); tWD=tDate.getDay()
               ah++
               }
            if(ah==1000) console.log( date )
            $el.find('.calTable>table>tbody>tr>td').each(function() {
               var s1,s2='',i, td = $(this), dd
               if(tDate.getMonth()!=m) s2=' class="otherMonth"'
               else if(tDate.getDate()==d) s2=' class="currentDate"'
               dd = tDate.getDate()
               s1='<div'+s2+'>'+ ((typeof ren) == 'function' ? ren.call($el,tDate) : dd) +'</div>'
               td.html(s1)
               td.children().data('dd',dd) 
               for(i in cF) if(cn = cF[i].call($el, tDate)) td.children().addClass(cn)
               tDate.setDate(tDate.getDate()+1)
               })
            
            if((dmy2=date2dmy(date)) != $el.data('dmyOld') && (cb=$el.data('onchange')) ) {
               cb.call($el)
               $el.data('dmyOld', dmy2)
               }

            
            
            $el.find('.calTable>table>tbody>tr>td>div')
            .on('mouseover',function() {
               $(this).addClass('hover')
               })
            .on('mouseout',function() {
               $(this).removeClass('hover')
               })
            .on('click',function() {
               var val=$(this).data('dd'), om=$(this).hasClass('otherMonth'), dm=1, date
               if(om && val>15) dm=-1
               date=$el.data('date')
               $el.data('dmyOld',date2dmy(date))
               if(om) {
                  date.setDate(1)
                  date.setMonth(date.getMonth()+dm)
                  }
               date.setDate(val)
               $el[Plugin]('_refresh')
               })
            $el.find('.yupPeriodMonth')[txL]('setValue',$.fn[Plugin].months[date.getMonth()])
            $el.find('.yupPeriodYear')[txL]('setValue',date.getFullYear())
            if(calF=$el.data(txL)) {
               calF[txL]('setValue',date2dmy(date))
               refreshValue(calF.parent())
               }
            $el.css({display:''})
            $el.width($el.find('.calTable>table').outerWidth())
            })
         return this
         }
      
      ,
      // установка значения в поле с датой
      setValue : function(val) {
         // на входе должна быть дата 'yyyy-mm-dd [hh:mm:ss.xxxx]' или объект типа Date
         var $tm,ar, inp = val, v

         if((typeof val) == 'object' && (typeof val.getDay) == 'function') {
            inp = val.getFullYear() + '-' + ((v = (val.getMonth()+1)) < 10 ? '0' : '') + v + '-' + ((v = val.getDate()) < 10 ? '0' : '') + v
               + ' ' + ((v = val.getHours()) < 10 ? '0' : '') + v + ':' + ((v = val.getMinutes()) < 10 ? '0' : '') + v + ':00'
            }
         this.find('.'+txL+'Date')[txL]('setValue', dmyFilter(inp))
         if(($tm=this.find('.'+txL+'Time')) [0]) {
            if( ar = /\b(\d{1,2})\:(\d{1,2})/.exec(inp) ) {
               $tm[txL]('setValue', hmFilter(ar[1]+':'+ar[2]) )
            } else $tm[txL]('setValue', '')
         }
         refreshValue(this, 1)
         return this
         }
      ,
      focus : function() {
         this.find('.'+txL+'Date')[txL]('focus')
         return this
         }
      // конец методов yupCalendar
      }
   
   function sql2dmy(sql) {
      var d,m,Y
      d=sql.substr(8,2)
      m=sql.substr(5,2)
      Y=sql.substr(0,4)
      if(d&&m&&Y) return(d+'.'+m+'.'+Y)
      }
   function date2dmy(date) {
      var d,m
      return ((d=date.getDate())>9 ? d : '0'+d) + '.' + ((m=date.getMonth()+1)>9 ? m : '0'+m) + '.' + date.getFullYear()
      }
   
   function date2ymd(date) {
      var d,m
      return date.getFullYear() + '-' + ((m=date.getMonth()+1)>9 ? m : '0'+m) + '-' + ((d=date.getDate())>9 ? d : '0'+d)
   }
   
   function date2dmyHM(date) {
      var H,M
      return date2dmy(date)+' ' + ((H=date.getHours())>9 ? H : '0'+H) + ':' + ((M=date.getMinutes())>9 ? M : '0'+M)
   }
   function date2dmyHMS(date) {
      var S
      return date2dmyHM(date) + ':' +((S=date.getSeconds())>9 ? S : '0'+S)
   }
   
   function _getN(n) {
      var v;return isNaN(v=parseFloat(n)) ? 0 : v
   }
   
   
   var mon, re=[], reMonth, reBound = '[\\s\\-\\.\\/]+', mnths={
         'jan': 1,'янв': 1,
         'feb': 2,'фев': 2,
         'mar': 3,'мар': 3,
         'apr': 4,'апр': 4,
         'may': 5,'май': 5,'мая': 5,
         'jun': 6,'июн': 6,
         'jul': 7,'июл': 7,
         'aug': 8,'авг': 8,
         'sep': 9,'сен': 9,
         'oct': 10,'окт': 10,
         'nov': 11,'ноя': 11,
         'dec': 12,'дек': 12
   }, dmyFilterAlgs={
      // на входе массив отработки рег.выражения, на выходе должен быть объект Date
      ansi: function(arr) {
         var ar=arr[0].split('-')
         return _newDate(ar[0], _getN(ar[1]), ar[2])
      },
      day: function(arr) {
         var ctx=this
         return _newDate(ctx.curYear, ctx.curMonth, arr[0])
      },
      year: function(arr) {
         return _newDate(arr[0], 1, 1)
      },
      month: function(arr) {
         var ctx=this
         return _newDate(ctx.curYear, _mon2monthN(arr[1]), 1)
      },
      monthYear: function(arr) {
         var ctx=this
         return _newDate(_yy2yyyy(arr[2], ctx), _mon2monthN(arr[1]), 1)
      },
      dayMonth: function(arr) {  
         var ctx=this, m=arr[2]
         return _newDate(ctx.curYear, _getN(m) ? m : _mon2monthN(m), _getN(arr[1]))
      },
      dayMonthYear: function(arr) {
         var ctx=this, m=arr[2], y=arr[3]
         return _newDate(_yy2yyyy(y, ctx), _getN(m) ? m : _mon2monthN(m), _getN(arr[1]))
      }
   }, partialDate;

   function _mon2monthN(s) {
      return mnths[s.substr(0,3).toLowerCase()] || 1
   }
   function _yy2yyyy(y, ctx) {
      var ret=y
      if(y<100) {
         if(y < ctx.centSep) ret=2000+_getN(y)
         else ret=1900+_getN(y)
      }
      return ret
   }
   function _newDate(y,m,d) {
      return new Date(y,m-1,d)
   }

   for(mon in mnths) re.push(mon + '[a-zA-Zа-яА-Я]*')
   reMonth = re.join('|')
   

   partialDate = [ // возможные шаблоны одной даты
      [/^\d{4}-\d{2}-\d{2}/, 'ansi', 0], // ANSI стандарт даты (0 означает 0 дополнительных параметров для фильтра)
      [/^\d{4}$/, 'year', 0], // год (1-го января)
      [/^\d{1,2}$/, 'day', 0], // число текущего месяца текущего года
      [new RegExp('^('+reMonth+')$','i'), 'month', 0], // мес строкой (1 число указанного месяца текущего года)
      [new RegExp('^(' + reMonth + ')' + reBound + '(\\d{2,4})$','i'), 'monthYear', 2], // месяц строкой + год
      [new RegExp('^(\\d{1,2})' + reBound + '(\\d{1,2}|' + reMonth + ')$','i'), 'dayMonth', 2], // дата и месяц(строкой или числом) текущего года
      [new RegExp('^(\\d{1,2})' + reBound + '(\\d{1,2}|' + reMonth + ')' + reBound + '(\\d{2,4})$','i'), 'dayMonthYear',3] // число, месяц и год в русском стиле
   ]

   function dmyFilter(inp,centSep) {
      // на входе дата в YYYY-mm-dd или dmy с различными разделителями и 2/4-значным годом
      // на выходе dd.mm.YYYY
      var re, mon, i, arr, ret, now=new Date(), curYear=now.getFullYear(), curMonth=now.getMonth()+1, ctx;
      
      if(!centSep) centSep=parseInt(curYear.toString().substr(2),10) + 25  
      if(centSep>99) centSep -= 100

      ctx = {
         curYear:curYear,
         curMonth:curMonth,
         mnths:mnths,
         centSep:centSep
      }

      for(i in partialDate) {
         arr=partialDate[i]
         re = arr[0]
         if(ret=re.exec(inp)) {
            return date2dmy(dmyFilterAlgs[arr[1]].call(ctx, ret))
         }
      }
      return ''
   }

   function hmFilter(inp) {
      // на входе время, на вызоде hh:mm
      var inp,ar,h,m
      ar=/^(\d{1,2})$/.exec(inp)
      if(ar) return ((h=parseInt(ar[1],10))>9?h:'0'+h)+':00'
      ar=/(\d{1,2})[\. \:\-\/]?(\d{1,2})/.exec(inp)
      if(ar) return ((h=parseInt(ar[1],10))>9?h:'0'+h)+':'+((m=parseInt(ar[2],10))>9?m:'0'+m)
      return ''
      }
         
   // главная функция (используется для запуска методов в объекте methods)   
   $.fn[Plugin]=function(method)
      {
      if(methods[method]) {
         return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
         }
      else if (typeof method === 'object' || !method) return methods.init.apply(this, arguments)
      else $.error( 'Метод ' +  method + ' не найден в $.' + Plugin)
      }
   $.fn[Plugin].methods=methods
   
   
   // инициализация глобальных переменных
   $.fn[Plugin].months=['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь']
   $.fn[Plugin].monthsG=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
   $.fn[Plugin].weekdays=['пн','вт','ср','чт','пт','сб','вс']
   $.fn[Plugin].filterDate = function(d,cs) {
      var ar = /(^.*)[ ](\d{1,2})\:(\d{2})/.exec(d), dmy=dmyFilter(ar ? ar[1] : d, cs), s=''
      if(ar) s=' '+ar[2]+':'+ar[3]
      return(new Date(dmy.substr(3,2)+'/'+dmy.substr(0,2)+'/'+dmy.substr(6,4) + s))
      }
   $.extend($.fn[Plugin], {
      dmyFilter : dmyFilter,
      date2dmy : date2dmy,
      date2dmyHM : date2dmyHM,
      date2dmyHMS : date2dmyHMS,
      date2ymd : date2ymd,
      filterTimeHM : hmFilter
   })
      
   var img={
      calendar:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAGNJREFUeNrkk0EKwCAMBLPFfyd5+ZbQpocgtlZ6qqDBYJg5rBARysvV4iCJ2UEAbHlx966BqqK+yR4O8Efkkc3Wa97Vi57as+TQ/iP5DBjFzIa17ph7RK66GZKlhGHlV+0CDADjPH1UWasfCwAAAABJRU5ErkJggg=="
      }
   $.fn[Plugin].images=img
   }
) (coreLib);

/* yupLayout
*/
(function($) {
   var Plugin = 'yupLayout',
      conts=[], // массив DOM-элементов - контейнеров со строками или столбцами
      /* к каждому из которых привязаны данные el.data(Plugin)={
         type : 'rows' | 'cols',
         els : [{},{},...]
            {
            width|height : '50%' | 'auto'
            }
         }
      */
   attached=0, nav=Win.navigator.userAgent, isIE = /MSIE/.test(nav), isFF= /Firef/.test(nav), itv, resizEls=[]
   ,
   methods = {
      init : function(inp) {
         this[Plugin]('rows',inp)
         }
      ,
      rows : function(inp) {
         // шаблон строк, на входе массив объектов {width:Proc}
         // контекст - контейнер
         if(!attached) attachEvents()
         this.addClass(Plugin).each(function() {
            // this - DOM-элемент - контейнер
            if($.inArray(this,conts)<0) {
               conts.push(this)
               $(this).data(Plugin,{type:'rows',els : inp})
               }
            })
         return this
         }
      ,
      cols : function(inp) {
         // шаблон столбцов, на входе массив объектов {height:Proc}
         if(!attached) attachEvents()
         this.addClass(Plugin).each(function() {
            // this - DOM-элемент - контейнер
            if($.inArray(this,conts)<0) {
               conts.push(this)
               $(this).data(Plugin,{type:'cols',els : inp})
               }
            })
         return this
         }
      ,
      on : function(evt,cb) {
         //
         if('resize'.indexOf(evt)>-1) {
            this.each(function() {
               var el=$(this)
               if($.inArray(this,resizEls)<0) {
                  resizEls.push(this)
                  }
               el.data(Plugin+'_onresize',cb).data(Plugin+'_width',el.width()).data(Plugin+'_height',el.height())
               })
            if(!itv) itv = Win.setInterval(checkResize, 500)
            }
         return this
         }
      // конец методов
      }
   
   // статические методы
   function outW(el,v) {
      var s1='left',s2='right',ret, $el=$(el), b1,b2,m1,m2
      if(v) {s1='top';s2='bottom'}
      ret = (isNaN(m1=parseFloat($el.css('margin-'+s1))) ? 0 : m1) 
         + (isNaN(m2=parseFloat($el.css('margin-'+s2))) ? 0 : m2)
         + parseFloat($el.css('padding-'+s1)) + parseFloat($el.css('padding-'+s2))
         + (isNaN(b1=parseFloat($el.css('border-'+s1+'-width'))) ? 0 : b1)
         + (isNaN(b2=parseFloat($el.css('border-'+s2+'-width'))) ? 0 : b2)
      return ret
      }

   function elHeight(el) {
      if(el.tagName=='BODY') {
         var dEl=Doc.documentElement,y
         return (y=dEl.clientHeight) ? y : dEl.offsetHeight  - 0 - outW(dEl,1) - outW(el,1)
         }
      else return $(el).height()
      }
   
   function checkResize() {
      checkResizable()
      checkCols()
      }
   
   function checkResizable() {
      var i,el,ch, x
      for(i in resizEls) {
         ch=0
         el=$(resizEls[i])
         if(el.data(Plugin+'_width') != (x=el.width())) {ch=1; el.data(Plugin+'_width',x)}
         if(el.data(Plugin+'_height') != (x=el.height())) {ch=1; el.data(Plugin+'_height',x)}
         if(ch) el.data(Plugin+'_onresize').call(el.get(0))
         }
      }
   
   function checkCols() {
      // console.log( 'Контроль изменения ширин столбцов без ширины' )
      var i,cont,dat
      for(i in conts) {
         cont=conts[i]
         dat=$(cont).data(Plugin)
         if(dat.type=='cols') {
            $(cont).children('.col').each(function() {
               var col=$(this), oW
               if(oW = col.data(Plugin+'_w')) {
                  // есть ширина по-умолчанию
                  if(col.width() != parseFloat(oW))
                     trgResize()
                  }
               })
            }
         }
      }
   function attachEvents() {
      // навешивает на window обработчик события resize при инициализации
      attached=1
      if(!itv) itv = Win.setInterval(checkResize, 500)
      $(Win).on('resize',function() {
         var i, cont, dat
         
         for(i in conts) {
            // цикл по контейнерам в порядке их добавления
            cont=conts[i]
            dat=$(cont).data(Plugin)
            if(dat.type=='rows') {
               // Строчный шаблон
               var hidRows=[], tH=0, tAH=0
               
               $(cont).children().each(function(j) {
                  // цикл по строкам шаблона => выявление строк с не заданной в плагине высотой
                  var row=$(this); if(row.css('display')!='block' && !row.hasClass('row')) return
                  var h, ah, rdat = dat.els[j] || {}
                  row.css('overflow',row.children('.col')[0] ? 'hidden' : 'auto')
                  h=row.height()+outW(row.get(0),1)
                  if(ah = rdat.height) {
                     hidRows.push(row)
                     row.data(Plugin+'_H',ah)
                     tAH += parseFloat(ah)
                     }
                  else tH += h
                  })
               if(hidRows.length) {
                  var rH, row, b1,b2, ofs
                  for(var j in hidRows) {
                     // автовысота строк
                     row=hidRows[j]
                     rH = (elHeight(cont)-tH) * parseFloat(row.data(Plugin+'_H')) / tAH
                     ofs = outW(row.get(0),1)
                     row.height(rH-ofs - (cont.tagName=='BODY' && j==hidRows.length-1 ? 2 : 0)) // патч для калькулятора, пока непонятки
                     row.children('.col').each(function() {
                        // для каждой ячейки внутри строки подогнать высоту
                        $(this).height(rH-ofs-outW(this,1))
                        })
                     }
                  }
               }
            else if(dat.type=='cols') {
               // Столбчатый шаблон
               var hidCols=[], tW=0, tAW=0
               $(cont).children().each(function(j) {
                  // цикл по строкам шаблона => выявление строк с незаданной высотой
                  var col=$(this); if(!(col.css('display')=='block' || row.hasClass('col'))) return
                  var w, aw
                  col.css({'float':'left',overflow:'auto'})
                  w=col.width()+outW(col.get(0),0)
                  if(dat.els[j] && (aw = dat.els[j].width)) {
                     hidCols.push(col)
                     col.data(Plugin+'_W',aw)
                     tAW += parseFloat(aw)
                     }
                  else {
                     tW += w
                     col.data(Plugin+'_w', col.width())
                     }
                  })
               if(hidCols.length) {
                  var cW, col, b1,b2, ofs
                  for(var j in hidCols) {
                     // автоширина строк
                     col=hidCols[j]
                     cW = ($(cont).width()-tW) * parseFloat(col.data(Plugin+'_W')) / tAW
                     ofs = outW(col.get(0),0)
                     col.width(Math.floor(cW - ofs - (isFF ? 2 : (isIE ? 1 : 1)))) // патч для IE9 : ofs - (isIE ? 1 : 0), но был убран из-за глюков в FF при масштабировании => ie =-1 ff=-2
                     }
                  }
               }
            // следующий контейнер
            }
         })
      }
   
   // главная функция (используется для запуска методов в объекте methods)   
   $.fn[Plugin]=function(method)
      {
      if ( methods[method] ) {
         return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
       } else if ( typeof method === 'object' || ! method ) {
         return methods.init.apply( this, arguments );
       } else {
         $.error( 'Метод ' +  method + ' не найден в $.'+Plugin );
       }
      }
   $.fn[Plugin].methods=methods
   
   // инициализация глобальных переменных
   
   function trgResize() {
         $(Win).trigger('resize')
         }
   
   $.fn[Plugin].start = function(cb) {
      setTimeout(function(){
         trgResize()
         if(cb) cb.call(this, function() {
            trgResize()
         })
         },100)
      }
      
   }
) (coreLib);

/* yupList
*/
(function($) {
   var Plugin='yupList', opt='Options', cntList=1, txtL='yupText', grL='yupGrid', reqL='Требуется библиотека ', __yupListRenderedField='__yupListRenderedField', ORF='__originalFields', fnListTextChg, 
   methods={
      init : function(opts) { 
         var v,key, field=opts.field
         if(!$.fn.yupGrid) return $.error(reqL+'yup-grid.js')
         if(!Win.yupTable) return $.error(reqL+'yup-qt.js')
         
         if(v=(opts.key || opts.pk || opts.pKey)) key = v
         if(!key) return $.error('Требуется указание поля key')
         if(!field) field = opts.field = key
         
         this.addClass(Plugin).each(function() {
            var el=$(this), id, gr, grJ= {}, grI, grW, elD, row, d, i, iL, v, txtSelCont

            el.data(Plugin, {
               options : copyObj(opts)
            })
            elD = el.data(Plugin)

            grJ[ORF] = (field==key ? [key] : [key, field])
            grJ[field] = {width:'100%'}
            grJ.__rowData = ((v=opts.fixedRows) && v.length) ? elD.fixedRows=v : (
               (v=opts.emptyRow) ? (elD.fixedRows=[['','<div style="text-align:center;color:#777">'+v+'</div>']]) : []
            )
            grI = {json:grJ}
            if(v=opts.gridConfig) grI=$.extend(true, grI, v)
            if(v=opts.callback) elD.dataCallback=v

            if(opts.fixedRows && !opts.callback) {

               elD.dataCallback = function(ph,v,cb) {
                  // для фиксированного списка обработчик по-умолчанию
                  var el=this, gr=el[Plugin]('getGrid'), js=gr[grL]('getJS'), elD=el.data(Plugin), opts=elD.options, fR=elD.fixedRows, 
                     d,f1,f2,t, ar, f3, i,iL, findFld=opts.field
                  if(ph==2) {
                     js.__rowData = fR
                     d=yupTable(js)
                     v = _leftS(v, 255)
                     if(opts.renderer) findFld=__yupListRenderedField
                     f1=d.find([[t=findFld, v+'*']]).sortBy(t)
                     f2=d.find([[t, '*'+v+'*']]).sortBy(t)
                     f1 = f1.mergeDistinct(f2.jsTable)
                     if(ar=opts.addFields) {
                        iL=ar.length; for(i=0;i<iL;i++) {
                           f3=d.find([[(t=ar[i]), '*'+v+'*']]).sortBy(t)
                        }
                        f1 = f1.mergeDistinct(f3.jsTable)
                     }
                     cb(f1.jsTable.__rowData)
                  } else {
                     cb(fR)
                  }
               }
               
               if(opts.renderer) {
                  grJ[ORF].push(__yupListRenderedField)
                  // меняем opts.fixedRows
                  d=yupTable(grJ)
                  for(i=0, iL=d.jsTable.__rowData.length; i<iL; i++) {
                     row = d.getRow(i)
                     d.set(__yupListRenderedField, opts.renderer.call(el, {
                        value: row[field],
                        pkValue: row[key],
                        row: row
                     }), i)
                  }
               }
            }
            
            id = Plugin + 'Layer' + cntList++
            
            // создание поля со списком
            el[txtL]({width:opts.width, dropdown:'#'+id, emptyText:opts.emptyText, disabled:opts.disabled, spellcheck:opts.spellcheck, ddAlign:opts.align, 
               type:opts.type, readonly:opts.readonly, editable:opts.editable,
            renderer: function(val) {
               // рендерер
               var txt=this, gr=txt[Plugin]('getGrid'), js=gr.data('json'), d=yupTable(js), cb, ret, f, v2
               f=d.find([[key, _leftS(val, 255)]])
               if(f.numRows) {
                  ret = v2 = f.get(field)
                  if((cb=opts.renderer) && $.isFunction(cb)) {
                     ret = cb.call(txt, {
                        value : ret,
                        pkValue : f.get(key),
                        grid : gr,
                        row : f.getRow()
                     })
                     if(ret == Und) ret=v2
                  }
               }
               else ret=val
               return ret
            },
            filter:function(unfV) {
               // фильтр (ищет такое значение в видимой части, и заменяет на код, если есть
               // в случае фокуса на поле, у которого есть renderer unfV - уже не чистое, и список исчезнет
               // поэтому при поиске в списке нужно отрендеривать значение каждой строки списка
               var txt=this, d,f,ret, val=txt.data('value'), elD=txt.data(Plugin), repl, renTxt, findFld, i, iL, gr=elD.grid, opts=elD.options
               
               d=yupTable(gr[grL]('getJS'))

               // дополняем набор данных отрендеренным renderer-ом поля ввода 
               findFld = field
               if(renTxt = opts.renderer) {
                  d=d.clone()
                  d.each(function(ri) {
                     var row=this
                     d.set(findFld, renTxt.call(txt, {
                        value: d.get(findFld, ri),
                        pkValue: row[key],
                        grid: gr,
                        row: row
                     }), ri)
                  })
               }

               if((f=d.find([[findFld, _leftS(unfV, 255)]])).numRows) {
                  // но заменять нужно не на первый встречный (если несколько строк, то берется код, который был. А если одна строка, то берется ее код)
                  elD.noRows = 0
                  //                   найдено>1 ключа
                  ret=f.numRows > 1 ? (unfV ? val : '') : ((repl=f.get(key)) || unfV)
               } else {
                  elD.noRows = 1
                  ret=unfV 
               }
               elD.aftR = repl ? 1 : 0
               return ret
            }})
            [txtL]('on','reallychange', fnListTextChg = function(v,o) {
               var txt=this, val=o.nativeValue, gr=txt[Plugin]('getGrid'), cb, elD=txt.data(Plugin), cbC
               if(val || val===0) {
                  // если значение было изменено и фокус еще на элементе, то поиск, иначе отмена
                  if(txt.hasClass('inFocus')) {
                     elD.aft1=0
                     // Фаза 2 должна запускаться, только если смена значения произошла не в результате замены фильтра
                     if((cb=elD.dataCallback) && !elD.aftR) cb.call(this, 2, val, function(rows) {
                        gr.data('json').__rowData = rows
                        gr[grL]('render')
                        txt[txtL]('toggleDD', rows.length ? 'down' : 'up')
                     })
                  }
               } else {
                  // но если пусто и есть fixedRows
                  if(elD.fixedRows) {
                     gr.data('json').__rowData = elD.fixedRows
                     gr[grL]('render')
                  }
               }
               if(cbC = elD.onchange) {
                  // находим в гриде в поле подстановки такое-же значение
                  _trigger(cbC, txt, [val, elD])
               }
            })
            [txtL]('on','visible', function() {
               this.data(Plugin).grid[0].resize(3)
            })
            [txtL]('on','dropdown', function() {
               var el=this, dat=el.data(Plugin), cb, gr=el[Plugin]('getGrid'), v, cbDD
               // должна запускаться только в случае, если в поле ввода ничего нет, либо значение было установлено с помощью фазы 1
               v=el.data('value')
               if((!v && v!==0 || dat.aft1) && (cb=dat.dataCallback)) { //  && !dat.fixedRows // зачем нельзя запускать 0 фазу для fixedRows? (2018-08-17)
                  // Запуск фазы 0 при открытии списка, если поле пустое либо заполнено фазой 1 (при setValue) и нет фиксированных строк
                  
                  cb.call(el, 0, el.data('value'), function(rows) {
                     // dat.fixedRows = rows
                     gr.data('json').__rowData = rows // dat.fixedRows
                     dat.aft1=0
                     gr[grL]('render')[grL]('setValue',v,1)
                     // вставить выравнивание списка
                     el[txtL]('realign')
                  })
               }
               if(cbDD=dat.ondropdown) cbDD.call(el, {type:'dropdown',scope:Plugin})
            })
            el.find('.yupTextInput').on('blur', function() {
               var lD=el.data(Plugin), cb, cb1
               if(!el[txtL]('isOpened')) {
                  // blur:yupList
                  if(lD.noRows && (cb1=lD.onnotinlist) && $.isFunction(cb1)) cb1.call(el, lD)
                  if((cb=lD.onblur) && $.isFunction(cb)) cb.call(el, lD)
               }
            })
            
            txtSelCont=el[0].selectContent
            el[0].selectContent = function() {
               // оверрайд функции выбора содержимого
               txtSelCont.call(this)
               // Теперь нужно, если запускается фаза 1 выбрать по окончании еще раз текст
               elD.selAft1=1
            }

            // создание списка для поля
            if(grI.json.__rowData.length) elD.fixedRows=grI.json.__rowData
            grW = (v=el.width()) ? v : ((v=parseInt(opts.width,10)) ? v + 20 : 100)
            gr=$('body').append('<div id="'+id+'" class="'+Plugin+'Layer"><div class="'+Plugin+'Grid"></div></div>').children().last().find('.'+Plugin+'Grid').css({
               width: grW + 'px'
            })

            // привязка к контейнеру со списком data('yupText')
            $('#'+id).data(txtL, el) // !!! задваивается эта логика при первом открытии списка в компоненте yupText
            
            gr[grL](grI)[grL]('render')

            [grL]('on','selectrow', elD.fnSelRow=function(){
               
               var gr=$(this), txt=gr.parent().data(txtL), val, cb, lD=txt.data(Plugin), tOpts=txt.data().options
               if(!(gr[grL]('isEditing') || (tOpts.readonly && !elD.options.selectable))) {
                  txt[txtL]('setValue', val = this.get(key))[txtL]('toggleDD', 'up', '', function() {
                     // сброс фильтра (должен срабатывать при выборе из списка)
                     if(elD.fixedRows) {
                        gr.data('json').__rowData = elD.fixedRows
                        gr[grL]('render')[grL]('setValue',val, 1)
                     }
                  })
                  lD.noRows = 0
                  if(lD.aft1) {
                     // выбор строки при setValue
                     lD.bySelect = 0
                  } else {
                     lD.bySelect = 1
                  }
                  if(cb = lD.onchange) {
                     _trigger(cb, txt, [val, lD])
                     elD.bySelect=0
                  }
               }
            })
            gr.parent().css({
               display:'none',
               boxShadow: '2px 2px 16px rgba(0,0,0,0.3)'
            })
            
            elD.grid = gr

            if(opts.on) for(var evt in opts.on) {
               el[Plugin]('on', evt, opts.on[evt])
            }
         })
         return this
      },
      disable : function() {
         return this.each(function() {
            $(this)[txtL]('disable')
         })
      },
      enable : function() {
         return this.each(function() {
            $(this)[txtL]('enable')
         })
      },
      error : function(err) {
         return this.each(function() {
            var el=$(this), cb
            if(cb=el.data(Plugin).onerror) cb.call(el, err)
            else {
               alert(err)
               Win.setTimeout(function(){el[txtL]('focus')},100)
               }
            })
         }
      ,
      focus : function() {
         if(this[0]) this.yupText('focus')
         return this
         }
      ,
      getGrid : function() {
         if(this[0]) {
            return $(this).data(Plugin).grid
            }
         }
      ,
      reset : function() {
         return this.each(function() {
            var el=$(this)
            el.data(Plugin).fixedRows = Und
            el[Plugin]('setValue','')
         })
      },
      setValue : function(v, svOpts) {
         return this.each(function() {
            var el=$(this), gr=el[Plugin]('getGrid'), grD=yupTable(gr.data('json')), lD=el.data(Plugin), opts=lD.options, f, cb, wasDisabled
            
            el[txtL]('setValue', v)
            
            if(svOpts && svOpts.byUser) {
               fnListTextChg.call(el, v, {nativeValue:v})
               return
            }

            if(!(f=grD.find([[opts.key, v]])).numRows) {
               // вставляемого значения нет в списке => запросить его в 1 фазе
               if((cb=lD.dataCallback) && (v || v===0)) {
                  wasDisabled=!!opts.disabled
                  el[txtL]('disable')
                  cb.call(el, 1, v, function(rows) {
                     if(!wasDisabled) el[txtL]('enable')
                     if(!rows) return
                     var k, cb1, ocCb=lD.onchange
                     gr[grL]('load', {__rowData:rows})
                     if(rows.length) {
                        // поиск значения еще раз, и если есть, то замена
                        if(grD.find([[opts.key, v]]).numRows) {
                           // найдено после выполнения загрузки по коду => замена кода на значение подстановки
                           // но если это значение установлено, то это не значит, что при открытии списка не надо запускать фазу 0
                           gr[grL]('setValue',v,1)
                           lD.aft1=1
                           lD.fnSelRow.call(gr[0])
                           if(lD.selAft1) el[0].selectContent()
                        }
                        else {
                           if(ocCb) {
                              _trigger(ocCb, el, [v, lD])
                           }
                        }
                     }
                  })
               } else if(cb) {
                  setTimeout(function() { // таймаут чтобы избежать ошибки с потерей номера строки в редактируемом гриде
                     el.data('onreallychange').call(el, '', {nativeValue:''})
                  }, 1)
               }
             
            } else {
               // найдено до выполнения загрузки по коду
               gr[grL]('setValue',v,1)
            }
         })
      }
      ,
      on : function(evt,cb) {
         if('change,error,notinlist,blur,dropdown,'.indexOf(evt+',')>-1) {
            this.each(function() {
               var oo=$(this).data(Plugin), cb0, arCb
               if(!oo['on'+evt]) oo['on'+evt] = cb
               else if($.isFunction(cb0 = oo['on'+evt]) && cb0 !== cb) {
                  oo['on'+evt] = [cb0, cb]
               } else if($.isArray(arCb = oo['on'+evt])) arCb.push(cb)
            })
         } else this.yupText('on',evt,cb)
         return this
      },
      useWithGrid: function(fo, opts) {
         return this.each(function() {
            var el=$(this), fld=opts.field, cb, origOnupdate
            
            // если обработчик уже есть, то переставляем его в конец потока
            if(fo.onupdate) origOnupdate=fo.onupdate

            $.extend(fo, {editor: el, onupdate: function(o) {
               // контроль того, чтобы значение было из списка
               var v=o.value, lD=o.meta.editor.data(Plugin), gr0=lD.grid, t, gr1=this, f1

               if(t=opts.notNull) {
                  if(!v && v!==0) {alert(t); return false}
               }
               if(t=opts.onlyFromList) {
                  if((v || v===0) && lD.noRows) {alert(t);return false}
               }
               if(t=opts.map) {
                  for(f1 in t) {
                     gr1.set(f1, lD.noRows ? (fld==f1 ? v : '') : gr0[0].get(t[f1]))
                  }
               }
               // проброс дальнейшей обработки onupdate
               if(cb=(opts.onupdate || origOnupdate)) return cb.apply(gr1, arguments)
            }}) 

            // вешаем обработчик на не выбранное, но найденное значение в списке
            el[Plugin]('on','blur', function(o) {
               if(!o.noRows) {
                  o.grid[grL]('setValue', this.data('value'))
               }
            })

         })
      }
      // конец методов yupList
   }

   function _trigger(cbC, txt, args) {
      // запускает универсальный калбэк-обработчик (функция либо массив функций)
      if($.isFunction(cbC)) cbC.apply(txt, args)
      else if($.isArray(cbC)) {
         for(var i=0, iL=cbC.length; i<iL; i++) {
            cbC[i].apply(txt, args)
         }
      }
   }
   
   
   function _leftS(s, lmt) {
      if(s && $.isString(s) && s.length>lmt) return s=s.substr(0, lmt)
      return s
   }

   // главная функция (используется для запуска методов в объекте methods)   
   $.fn[Plugin]=function(method) {
      if(methods[method]) return methods[method].apply(this, Array.prototype.slice.call(arguments, 1))
      else if($.isPlainObject(method) || !method) return methods.init.apply(this, arguments)
      else $.error('Метод ' +  method + ' не найден в $.'+Plugin)
      }
   $.fn[Plugin].methods=methods
   
   }
) (coreLib);

/* yupDialog
*/
(function($) {
   var Plugin='yupDialog', drL='yupDrag', btL='yupButton', nextId=1, Doc=document, methods = {
      init : function(opts) {
         return this.each(function() {
            var el=$(this).addClass(Plugin), btnC, pEl, i, v
            if(!opts) opts={}
            if(!opts.noClose) {
               btnC = el.append('<div class="'+Plugin+'_close">').children().last()
               btnC.attr({title:'Закрыть'}).data(Plugin, el).on('click',function() {
                  var cb=el.data(Plugin).on.close
                  if(cb && cb.call(el)!== false || !cb) el[Plugin]('close')
               })
            }
            el.data(Plugin, {on:{}, options:opts})
            if(opts.on) {
               for(i in opts.on) el[Plugin]('on', i, opts.on[i])
            }
            if(v = opts.head) {
               el.prepend('<div class="'+Plugin+'_header">' + v + '</div>')
            }
            if($.fn[drL]) {
               if(el.find(v = '.' + Plugin + '_header')[0]) {
                  el[drL]({handler:v})
               }
            }
         })
      },
      show : function(opts, cbAfterShow) {
         if(!opts) opts={} // modal easyClose|simpleClose noClose noPos|noPositioning
         return this.each(function() {
            var el=$(this), bH, bW, dW,dH, h2, win=Win, v, v2, fNP=opts.noPos || opts.noPositioning, dat=el.data(Plugin)
            dat.closed=0
            if((v=el[0].ownerDocument) && (v2=(v.defaultView || v.parentWindow))) win=v2
            if(!fNP) {
               // позиционирование
               v=windowSize(win)
               bH= v.windowHeight
               bW= v.windowWidth
               el.css({position:'absolute',opacity:0,display:'block'})
               dW=el.outerWidth()
               dH=el.outerHeight()
               h2= (bH - dH) / 2; if(h2<0) h2=0
               el.css({
                  left : (bW - dW) / 2,
                  top : h2 + $(Doc).scrollTop()
               })
            }
            if(document.body.style.borderRadius===Und) el.css({backgroundColor:'#ccc'})
            el.fadeIn(400, cbAfterShow)
            if(opts.modal) {
               var pEl
               if((pEl=el.prev())[0] && !pEl.hasClass(Plugin+'Veil')) {
                  el.before('<div class="'+Plugin+'Veil"></div>')
                  pEl=el.prev()
                  pEl.data(Plugin, el).css({position:'fixed',width:'100%',height:'100%',
                     opacity:0, backgroundColor:'#000',
                     top:0, left:0
                  }).animate({opacity:0.4},100)
                  if(opts.easyClose || opts.simpleClose) {
                     pEl.on('click', function() {
                        var el=$(this).data(Plugin), cb=el.data(Plugin).on.close
                        if(cb && cb.call(el)!== false || !cb) el[Plugin]('close')
                     })
                  }
               }
            }
            el.fadeIn().offset()
            el.css({transform:'scale(1)'})
         })
      },
      close : function() {
         return this.each(function() {
            var el=$(this),pEl, dat=el.data(Plugin)
            if(dat.closed) return
            dat.closed=1
            el.fadeOut().offset()
            el.css({transform:''})
            if((pEl=el.prev())[0] && pEl.hasClass(Plugin+'Veil')) pEl.animate({opacity:0},100, function() {
               pEl.remove()
               })
            })
      },
      on : function(evt, cb) {
         return this.each(function() {
            var el=$(this)
            if(cb && $.isFunction(cb)) el.data(Plugin).on[evt] = cb
         })
      },
      alert: function(msg, opts) {
         var id, dlg, defs={
            header: 'Сообщение системы',
            okCaption: 'OK',
            cancelCaption: 'Отмена',
            on: {}
         }, p, v
         if(!opts) opts={}
         for(p in defs) {
            if(opts[p]==Und) opts[p]=defs[p]
         }

         $('body').append('<div id="' + (id = Plugin + '_alert' + nextId) + '"><div class="'+Plugin+'_sheet">'+
            '<div class="'+Plugin+'_header">'+opts.header+'</div>'+
            '<div class="'+Plugin+'_body">' + msg + '</div>'+
            ((v=opts.footer) ? v : '<div class="'+Plugin+'_footer">'+
               '<div class="btnAlertClose"></div>'+
               (opts.confirm ? '<div class="yupForm_space"></div><div class="btnAlertCancel"></div>' : '') +
               '<div class="yupForm_clear"></div>'+
            '</div>') +
         '</div></div>')
         dlg=$('#'+id)
         dlg.find('.btnAlertClose')[btL]({caption:opts.okCaption})[btL]('on','click', function() {
            var cb
            if(!opts.confirm) dlg[Plugin]('close')
            if(cb=(opts.on.close || opts.on.confirm)) cb.call(dlg)
         })
         if(opts.confirm) {
            dlg.find('.btnAlertCancel')[btL]({caption:opts.cancelCaption})[btL]('on','click', function() {
               var cb
               dlg[Plugin]('close')
               if(cb=opts.on.cancel) cb.call(dlg)
            })
         }

         dlg[Plugin]()[Plugin]('show', {modal:1, easyClose: !opts.confirm, noPos:0})[Plugin]('on','close', function() {
            var cb;
            if(cb=(opts.on.close || opts.on.cancel)) cb.call(this)
         })

         nextId++
      }

   }
   
   function getN(n){var v; return isNaN(v=parseFloat(n)) ? 0 : v}
   
   // главная функция (используется для запуска методов в объекте methods)   
   $.fn[Plugin]=function(method) {
      if(methods[method]) return methods[method].apply(this, Array.prototype.slice.call(arguments, 1))
      else if($.isPlainObject(method) || !method) return methods.init.apply(this, arguments)
      else $.error('Метод ' +  method + ' не найден в $.'+Plugin)
      }
   $.fn[Plugin].methods=methods

}) (coreLib);

/* yupColor
*/
(function($) {
   var Plugin = 'yupColor', txL='yupText', btL='yupButton', compCnt=1, methods = {
      // методы плагина
      init : function(opts) {
         return this.each(function() {
            var el=$(this),s1,i,j=0,isL, palId=Plugin+'Pallete', opt={}, 
               $pal = $('body').append('<div id="'+palId+compCnt+'" class="'+palId+'">').children().last(),
               $col, pal;
            if(!opts) opts={}
            for(i in opts) opt[i]=opts[i]
            if(!opt.pallete) opt.pallete=pallete
            if(!opt.columns) opt.columns=columns
            if(!opt.palleteStyle) $pal.css({boxShadow:'2px 2px 16px rgba(0,0,0,0.2)',borderRadius:'10px'})
            pal=opt.pallete

            el.addClass(Plugin).data(Plugin,{options:opt})
            el[txL]({width:'51px',type:'div',emptyText:'цвет',dropdown:'#'+palId+compCnt,ddAlign:'right',renderer:function(st) {
               if(st) return '<div style="height:'+(this.height()-4)+'px; background-color:'+st+'"></div>'
            }})
            s1='<div class="palleteRow"><div class="palleteCol defColor"></div><div class="yupForm_caption" style="">цвет по-умолчанию</div></div>'
            for(i in pal) {
               isL=0
               if(!j) s1 += (s1 ? '</div>' : '')+'<div class="palleteRow">'
               j++; if(j==opt.columns) {j=0;isL=1}
               s1 += '<div class="palleteCol" id="palColIx'+i+'" style="background-color: #' + pal[i] + (isL ? ';margin-right:0' : '') + '"></div>'
            }
            s1 += '</div><div class="palleteRow"><div class="yupForm_caption">код цвета:</div><div class="colorCode"></div><div class="yupForm_space"></div><div class="btnOkColor"></div></div>'
            $pal.append(s1)
            el.find('.'+txL+'Input').css('cursor','pointer').on('click',function() {
               el[txL]('toggleDD')
            })
            $col=$pal.find('.colorCode')[txL]({width:'60px',spellcheck:false})[txL]('on','reallychange', function(v){
               el[txL]('setValue',v)
            })
            $pal.find('.btnOkColor')[btL]({caption:'OK'}).css({'float':'right'})[btL]('on','click',function() {
               el[txL]('toggleDD')
            })
            $pal.find('.palleteCol').each(function() {
               var el=$(this), st, v
               el.on('mouseover',function() {
                  el.addClass('hover')
               }).on('mouseout',function() {
                  el.removeClass('hover')
               }).on('click',function() {
                  $pal.find('.palleteCol').removeClass('clicked')
                  el.addClass('clicked')
                  st = (v=el.get(0).id) ? pal[v.substr(8)] : ''
                  $col[txL]('setValue',st ? ('#'+st) : '')
                  $($pal.data(txL))[txL]('setValue',st ? ('#'+st) : '')[txL]('toggleDD')
               })
            })
            compCnt++
         })
      },
      setValue : function (val) {
         return this.each(function () {
            var el=$(this).yupText('setValue', val)
         })
      }
      
      // конец методов
   },
   // опции по-умолчанию
   pallete=["000",930,330,"030","036","000080",339,333,800000,"f60",808000,"008000","008080","0000ff",669,808080,"f00","f90","9c0",396,"3cc","36f",800080,999,"f0f","fc0","ff0","0f0","0ff","0cf",936,"c0c0c0","f9c","fc9","ff9","cfc","cff","9cf","c9f","fff"],
   columns=8

   // главная функция
   $.fn[Plugin]=function(method) {
      if(methods[method]) return methods[method].apply(this, Array.prototype.slice.call(arguments, 1))
      else if($.isPlainObject(method) || !method) return methods.init.apply(this, arguments)
      else $.error('Метод ' +  method + ' не найден в $.'+Plugin)
      }
   $.extend($.fn[Plugin],{
      methods:methods,
      pallete:pallete,
      columns:columns
   })
   $.fn.yupForm.addComponent(Plugin)
   }) (coreLib);

/* yupRadioButtons
*/
(function($) {
   var Plugin = 'yupRadioButtons', btL='yupButton', methods = {
      // методы
      init : function(opts) {
         return this.each(function() {
            var el=$(this),aBtn,v,btn
            if(!(aBtn=opts.buttons)) return $.error('Не передан список кнопок buttons')
            el.addClass(Plugin).data(Plugin, {options:opts, on:{}})
            for(v in aBtn) {
               btn=aBtn[v]
               btn.data(Plugin,{element:el,value:v})
               btn[btL]('on','click',function(ev) {
                  var btn=$(this), bD=btn.data(Plugin), val=bD.value, el=bD.element, dat=el.data(Plugin), cb=dat.on.change, ret, opts=dat.options, bts=opts.buttons,i
                  if(!ev.isTriggered && opts.disabled) return
                  if(cb && (ret=cb.call(el, val)) !== false || !cb) {
                     btn[btL]('disable')
                     el.data('value', val)
                     for(i in bts) if(bts[i][0]!=btn[0]) bts[i][btL]('enable')
                  }
               })
            }
            if(opts.on) for(v in opts.on) {
               el[Plugin]('on',v,opts.on[v])
            }
            if((v=opts.value)!==Und) el[Plugin]('setValue',v)
         })
      },
      on : function(evt,cb) {
         return this.each(function() {
            var evts='change,', el=$(this), cbs=el.data(Plugin).on
            if(evts.indexOf(evt+',')<0) return $.error('Событие '+evt+' не поддерживается')
            cbs[evt]=cb
         })
      },
      setValue : function(val) {
         return this.each(function() {
            var el=$(this),dat=el.data(Plugin),bts=dat.options.buttons,v
            for(v in bts) {
               if(v==val){
                  bts[v][btL]('click');
                  el.data('value', val)
                  break
               }
            }
         })
      }
      // конец методов
   }
   // главная функция
   $.fn[Plugin]=function(method) {
      if(methods[method]) return methods[method].apply(this, Array.prototype.slice.call(arguments, 1))
      else if($.isPlainObject(method) || !method) return methods.init.apply(this, arguments)
      else $.error('Метод ' +  method + ' не найден в $.'+Plugin)
      }
   $.fn[Plugin].methods=methods
   $.fn.yupForm.addComponent(Plugin)
}) (coreLib);

/* yupBorderStyle
*/
(function($) {
   var Plugin = 'yupBorderStyle', txL='yupText', compId=1, methods = {
      // методы плагина
      init : function(opts) {
         return this.each(function() {
            var el=$(this).addClass(Plugin), $bs, i, fldH, opt={}, bs
            if(!opts) opts={}
            for(i in opts) opt[i]=opts[i]
            if(!opt.color) opt.color=color
            if(!opt.styles) opt.styles=bStyles
            bs=opt.styles
            
            el.data(Plugin,{options:opt})
            
            el[txL]({type:'div',width:'51px',emptyText:'стиль',dropdown:'#'+Plugin+'Styles'+compId, renderer:function(st) {
               var h2=parseInt(fldH/2,10)
               if(st) return '<div style="height:'+(h2-3)+'px; border-bottom:3px '+st+' '+opt.color+'"></div><div style="height:'+(h2-3)+'px"></div>'
            }})
            fldH = el.height()
            el.find('.'+txL+'Input').css('cursor','pointer').on('click',function() {
               el[txL]('toggleDD')
            })
            $bs = $('body').append('<div id="'+Plugin+'Styles'+compId+'" class="'+Plugin+'Styles">').children().last()
            
            if(!opt.palleteStyle) $bs.css({width:'51px',boxShadow: '2px 2px 16px rgba(0,0,0,0.2)',borderRadius:'7px'})
            for(i in bs) {
               $bs.append('<div class="bs_style_cont">' + (i>0 ? 
                  ('<div style="height:10px; border:3px '+bs[i]+' #2192BC; margin:0 4px"></div>') : 
                  ('<div class="yupForm_caption" style="text-align:center; display:block; float:none;height:16px;margin:0 2px">нет</div>')
                  ))
            }
            $bs.children().each(function() {
               var el=$(this), st
               el.on('mouseover',function() {
                  el.addClass('hover')
               }).on('mouseout',function() {
                  el.removeClass('hover')
               }).on('click',function() {
                  el.parent().children().removeClass('clicked')
                  el.addClass('clicked')
                  st = el.children().first().css('border-top-style')
                  $($bs.data(txL))[txL]('toggleDD')[txL]('setValue',st!='none' ? st : '')
               })
            })
            compId++
         })
      }
      
      // конец методов
   }, 
   bStyles=['','solid','dotted','dashed','double','groove','ridge','inset','outset'],
   color='#2192BC'
   

   // главная функция
   $.fn[Plugin]=function(method) {
      if(methods[method]) return methods[method].apply(this, Array.prototype.slice.call(arguments, 1))
      else if($.isPlainObject(method) || !method) return methods.init.apply(this, arguments)
      else $.error('Метод ' +  method + ' не найден в $.'+Plugin)
      }
   $.fn[Plugin].methods=methods
}) (coreLib);

/* yupHelper
*/
(function($) {

   var Plugin = 'yupHelper', Und, ttCnt=1, defDelay=300, defCloseDelay=300, methods = {
      // методы плагина
      init : function(opts) {
         return this.each(function() {
            var el=$(this)
            if(!opts) {
               opts={
                  delay : defDelay, // задержка в мс перед появлением хелпера
                  closeDelay : defCloseDelay,
                  content : 'Содержимое не задано',
                  plain : 0, // рендерить только текст
                  width : 300,
                  keepClass : 0,
                  position: 'bottom' // bottom|top
               }
            } else {
               if(!opts.position) opts.position='bottom'
            }

            if(!opts.keepClass) el.addClass(Plugin)
            el.data(Plugin,{options:opts})
            .on('mouseover',_hOver).on('mouseout', _hOut).on('mousemove',function(ev) {
               var d=_getD(el)
               d.elM=1
               d.coord={x:ev.pageX, y:ev.pageY}
            })
         })
      }
      
      // конец методов
   }
   
   function _hOver() {
      var el=$(this), opts=_getOpts(el), d=_getD(el), tt
      setTimeout(function(){
         // а не ушла ли мышь
         tt = d.tooltip
         if(!d.mE && (!tt || tt.css('display')=='none')) {
            _showHelper.call(el)
         }
      }, _getN(opts.delay)||defDelay)
      d.mE=0
   }

   function _getD(el) {
      return el.data(Plugin)
   }
   
   function _getTT(el) {
      var d=_getD(el)
      return d.tooltip
   }
   
   function _hOut(ev) {
      // если мышь уводится, но не на тултипе, то ждать и закрывать тултип
      var el=$(this), opts=_getOpts(el),tt,d
      if(ev.target==this) {
         d=_getD(el)
         d.mE=1; d.elM=0
         tt = _getTT(el)
         if(tt && tt.css('display')!='none') {
            setTimeout(function(){
               if(!d.elM && !d.ttM) tt.fadeOut()
            }, _getN(opts.closeDelay)||defCloseDelay)
         }
      }
   }

   
   function _showHelper() {
      var el=this, dat=_getD(el), opts=_getOpts(el), tt, content=opts.content, ofs=el.offset(), crd=el.data(Plugin).coord, ttw, ofsL, ofsT, $win=$(Win), $doc=$(Doc), dX, dY, tth, body, v
      body = (v=el.parentsUntil('body'))[0] ? v.last().parent() : $('body')
      if(!(tt = _getTT(el))) {
         tt = body.append('<div id="' + Plugin + 'TT' + ttCnt + '" class="'+Plugin+'_tooltip">').children().last() 
         ttCnt ++
         dat.tooltip = tt
         tt.css({position: 'absolute', boxShadow: '2px 2px 16px rgba(0,0,0,0.2)',borderRadius:'7px'})
         .on('mouseout',function(ev) {
            // если выходим из тултипа, то закрываем его
            if(ev.target==this) {
               dat.ttM=0
               setTimeout(function() {
                  if(!dat.elM && !dat.ttM) {
                     tt.fadeOut()
                  }
               }, _getN(opts.closeDelay)||defCloseDelay)
            }
         }).on('mousemove',function() {
            dat.ttM=1
         }).html(content)
      }
      ttw = (v=opts.width) ? _getN(v) : 350
      tt.css({width : ttw +'px', opacity:0, display:'block'})
      ofsL = crd.x - ttw/2
      if((dX = ofsL + tt.outerWidth() - ($doc.scrollLeft() + $win.width()) + 20) > 0) ofsL -= dX
      ofsT = crd.y
      if(opts.position=='bottom') {
         if( (ofsT + (tth = tt.outerHeight()) + 10 - ($doc.scrollTop() + $win.height() - 20)) > 0) ofsT -= tth + 5; else ofsT += 10
      } else if(opts.position=='top') {
         ofsT -= tt.outerHeight() + 10
      }
      tt.css({
         left : ofsL<0 ? 0 : ofsL,
         top : ofsT<0 ? 0 : ofsT
      })
      tt.fadeIn()
   }
   function _getOpts(el) {
      return _getD(el).options
   }
   function _getN(n) {
      var v;return isNaN(v=parseFloat(n)) ? 0 : v
   }
   
   // главная функция
   $.fn[Plugin]=function(method) {
      if(methods[method]) return methods[method].apply(this, Array.prototype.slice.call(arguments, 1))
      else if($.isPlainObject(method) || !method) return methods.init.apply(this, arguments)
      else $.error('Метод ' +  method + ' не найден в $.'+Plugin)
   }
   $.fn[Plugin].methods=methods

}) ($);

// общие функции

function windowSize(win){
   if(!win) win = Win
   var doc=win.document, body=doc.body, dE=doc.documentElement, xScroll, yScroll, windowWidth, windowHeight, pageWidth, pageHeight

   if (win.innerHeight && win.scrollMaxY) {
           xScroll = body.scrollWidth;
           yScroll = win.innerHeight + win.scrollMaxY;
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

   if (win.innerHeight) { // all except Explorer (тут было вместо Win self)
           windowWidth = win.innerWidth;
           windowHeight = win.innerHeight;
   } else if (dE && dE.clientHeight) { // Explorer 6 Strict Mode
           windowWidth = dE.clientWidth;
           windowHeight = dE.clientHeight;
   } else if (doc.body) { // other Explorers
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

   return {pageWidth:pageWidth, pageHeight:pageHeight, windowWidth:windowWidth, windowHeight:windowHeight}
}


// конец оболочки
}) ();
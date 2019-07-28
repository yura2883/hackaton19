(function() {
var Und=undefined, Win=window, Doc=document, coreLib = Win.jQuery ? Win.jQuery : Win.Yup, gridZ, Plugin='yupGrid';
/* gridZ on line 953
метаданные столбцов, поддерживаемые гридом
обязательные:

необязательные
   width : (если нет, то скрытый столбец) - ширина в пикселах или % если как "N%"
   hidden : 1 - скрытый столбец, 2-скрытый совсем, не отображается в settings
   minWidth : минимальная ширина столбца
   maxWidth : максимальная ширина столбца
   type : тип столбца 'text' - по-умолчанию
   typeConfig : объект со свойставми - параметрами, передаваемыми cellRenderer'u
      для type='money' : {prec:2, separator:'&nbsp;', cur:''}
   disabled : 1 - запретить редактирование
*/
(function($) {
   var grIdCnt=1, ORF='__originalFields', RD = '__rowData', TOTR='__totalRows',
      gridOptions=['allowFilter','autoEdit','accumulateChanges','allowDelete','allowInsert','buffering','ctrlC','exportXls','filters','header','head','helper','imageF','checkboxes','checkChildren','checkParents',
      'checkSource', 'tristate','tree','colGroups','frozenCols','magic','resizable','rowHeight','selectable','setupCols','style','sortBy','spanF','sortable','openChecked','openLevel', 'openNodes', 'orderBy', 
      'statusBar', 'statusText','selArea','selectionArea','summary','totals','editable','noData','noDataF','newRowPrefix','contentF','top','on','moveOnEnter','ordCols','xlsHead']
   , methods = {
      // Инициализация (то, что делается только один раз, например: установка id-элемента)
      init: function(options) {
         return this.addClass(Plugin)[Plugin]('clearOptions')[Plugin]('setOptions',options).each(function() {
            // цикл по гридам
            var $el = $(this), js = options.json, w,pp,i
            if(js) $el.data('json',js)
            $el.data(Plugin,{
               // обновление
               changes: []
            })
            // присваивание стилей в тэг напрямую, используя вычисляемые
            pp=['width','height','max-width','max-height','min-width','min-height']
            for(i=0;i<pp.length;i++) if(parseInt(w=$el.css(pp[i]),10)) $el.css(pp[i],w)
            // установка идентификатора, если отсутствует            
            if(!this.id) {
               this.id=Plugin+grIdCnt
               grIdCnt++
               }
            // обертки на внутренние методы
            $.extend(this, {
               set: function(fld, val, row, inUpdateBeforeSave) {
                  var gr=this, go=gridZ.dateU[gr.id], l, op,f,v, isM
                  if($.isPlainObject(fld)) {
                     isM=1; for(f in fld) {
                        gr.setFVal(f, fld[f], val) // val as row
                     }
                  } else gr.setFVal(fld, val, row) // недок
                  if((inUpdateBeforeSave && !isM || row && isM) && go && (l=go.length)) {
                     // буфер изменений для updateSQL, если стоит режим 
                     op = go[l-1]
                     op.data[fld] = val
                  }
                  return gr
               },
               get: function(fld, row) {
                  var gr=this, ri=gr.selectedRow, c=gr.selC, t,i,o, colIndex, dat=$(gr).data(Plugin), df, v, ret, 
                     origVal, cc='calcCache', rsv='resolving', cbF, getOrig
                  

                  if($.isArray(fld)) {
                     o={}; for(i=0;i<fld.length;i++) o[t=fld[i]]=gr.get(t, row)
                     return o
                  }

                  if(row!=Und) {
                     if($.isPlainObject(row)) {
                        if((t=row.rowIndex) != Und) ri=t
                        else if((t=gr._ypRI)!=Und) ri=t
                        if((t=row.filter)) cbF=t
                        if(row.original) getOrig=1
                     } else ri=row
                  } else if((t=gr._ypRI)!=Und) ri=t
                  
                  if(ri!=Und) {
                     colIndex =fld ? gr.nF(fld) : c
                     
                     ret = origVal = gr.dataS[ri][colIndex]
                     if(dat.meta[fld] && (df = dat.meta[fld].calc) && !getOrig) {
                        /* если запрашиваемое поле имеет depend и не вычисленный, то запускаем его depend (возможна рекурсия)
                        сохраняем значение в кэш
                        */
                        if(!dat[cc][ri]) dat[cc][ri]={}
                        if(!dat[cc][ri][colIndex]) dat[cc][ri][colIndex]={}
                        if(!dat[cc][ri][colIndex][rsv]) {
                           dat[cc][ri][colIndex][rsv]=1
                           dat[cc][ri][colIndex].value = ret = df.call(gr, {
                              value: origVal, aData:gr.dataS[ri], rowIndex:ri, colIndex:colIndex, field:fld, 'get': gr.get.bind(gr)
                           })
                           dat[cc][ri][colIndex][rsv]=0

                        }
                     }
                     return cbF ? cbF.call(gr, ret) : ret
                  }
               },
               getEditor: function(fld) {var gr=this;return gr.columns[gr.nFO(fld)].elEdit} // недок
               })
            })
         }
      ,
      // прорисовка данных переданных при инициализации или в аргументе
      render: function(json) {
         return grEach(this, function() {
            // для каждого грида
            var el=this, $el=$(el), dat=$el.data(), opts = dat[Plugin+'Options'], dsp=$el.css('display'), dspn, zo, stat={},i,f,sty, cb,v
            if(!json) json=dat.json
            if(!json) return $.error('Не передано определение таблицы данных json')
            $.extend(dat[Plugin], {
               // хранилище оперативных данных
               meta:{},
               calcCache:{} // вычисленные значения зависимых полей, от которых зависят другие поля {[rowIndex]=>{[colIndex]=>{value:}, ...}, ...}

            })
            
            for(i in json[ORF]) {
               f=json[ORF][i]
               dat[Plugin].meta[f] = json[f]
               }
            // сохранение статичных (необнуляемых в результате метода render свойств)
            $.extend(stat, {
               evFunc: el.evFunc || {},
               allowFilter: el.allowFilter,
               aFilter: el.aFilter
            })
            if(dsp=='none') {$el.css({opacity:0.01,display:''}); dspn=1}
            
            zo = yup2zGrid(json, opts, stat)

            $el.data(Plugin).pKey=zo.pKey
            $el.css('overflow','hidden')
            
            if(sty=opts.style) {for(i in sty) $el.css(i, sty[i])}


            gridZ.makeGrid(el.id, zo)
            el.pKey=zo.pKey
            
            if($.isPlainObject(v=opts.on)) for(i in v) {
               if(!dat['on'+i]) $el[Plugin]('on',i, v[i])
            }

            el.value = Und
            el.requery(opts.magic?1:0)
            dat[Plugin].oldValue = Und
            
            if(cb=$el.data('on' + 'overflow')) {
               if(el.countRec) cb.call(el, opts.top)
               }
            if(dspn) $el.css({opacity:1,display:'none'})
            })
         }
      ,
      // загрузка объекта со строками и отображение грида
      load: function(js) {
         return grEach(this, function() {
            // тут два случая
            // 1. Загрузка с заменой всех данных в гриде (причем это же действие происходит в методе render, если уже есть данные)
            // 2. Использование каллбэка дозагрузки в имеющийся грид zGrLastRowReachedH если сработал, то цепляем, если нет, то отцепляем
            var gr=$(this), dat=gr.data(), json=dat.json, d=js[TOTR], cb
            if(cb = dat[Plugin].afterTopCb) {
               // дозагрузка строк
               cb(js)
               dat[Plugin].afterTopCb = null
            } else {
               json[RD]=js[RD]
               json[TOTR]= d || Und
               gr[Plugin]('render')
            }
         })
      },
      // выбор(отметка галочками) всех строк
      checkAll: function(unc) {
         return grEach(this, function() {
            var el=this, dat=$(el).data(), js=dat.json,i
            for(i=0;i<js[RD].length;i++)el.cheked(i, unc ? 0 : 1)
         })
      }
      ,
      // отметка галочкой текущей либо указанной в аргументе строки по индексу
      checkRow: function(ri, unc) {
         return grEach(this, function() {
            var el=this
            if(ri == Und) ri = el.selectedRow
            if(ri == Und) return
            el.cheked(ri, unc ? 0 : 1)
         })
      },
      // снятие галочки с текущей либо указанной в аргументе строки по индексу
      uncheckRow: function(ri) {
         return this[Plugin]('checkRow',ri,1)
      },
      // удаление опций (одной:string или нескольких:string[])
      deleteOptions: function(aOpt) {
         return grEach(this, function() {
            var opts=$(this).data(Plugin+'Options'), i,iL
            if($.isString(aOpt)) delete opts[aOpt]
            else if($.isArray(aOpt)) {
               for(i=0, iL=aOpt.length; i<iL; i++) {
                  delete opts[aOpt[i]]
               }
            }
         })
      },
      // сброс всех фильтров колонок
      clearFilters: function() {
         return grEach(this, function() {
            var gr=this, el=$(gr), f
            for(f in gr.aFilter) {
               el.find('.gz_inpFiltr[name=' + f + ']').attr('value', '')
               delete gr.aFilter[f]
            }
         })
      },
      // сброс всех опциий gridOptions в undefined + установка дефолтов
      clearOptions: function() {
         return this.each(function() {
            $(this).data(Plugin+'Options', {
               tristate: 1,
               sortable: 1
               })
            })
         }
      ,
      each: function (cb, opts) {
         return grEach(this, function () {
            var gr=this, woF = opts && opts.filtered ? 0 : 1, $gr=$(gr), dat=$gr.data('json'), i, rows=dat[RD], iL=rows.length, j=0, row,
               orf=dat[ORF], k, kL=orf.length, arChk, chb, ret
            if(arChk = $gr[Plugin]('getChecked')) chb=1
            for(i=0; i<iL; i++) {
               if(!rows[i].d) {
                  if(woF && rows[i].f) continue
                  row = {}
                  for(k=0; k<kL; k++) {
                     row[orf[k]] = rows[i][k]
                  }
                  ret = cb.call(gr, row, i, {
                     checked : chb ? arChk[i] : 0,
                     aRow : rows[i]
                  })
                  if(ret===false) break
                  j++
               }
            }
         })
      },
      // фильтрация по полям и значениям
      filter: function(fo, opts) {
         // fo = {field:value, ...}, opts={requery:1}
         if(!opts) opts={requery:1}
         return grEach(this, function() {
            var gr=this
            gr.filterApply(fo, opts.requery)
         })
      },
      // вставка строки o={} или []
      insert: function(o) {
         return grEach(this, function() {
            var gr=this, js=$(gr).data('json'), zM='insertClick'
            if($.isArray(o)) gr[zM](o)
            else if($.isPlainObject(o)) {
               var a=[],i,f
               for(i in js[ORF]) {f=js[ORF][i]; a[i] = o[f]!==Und ? o[f] : Und}
               gr[zM](a)
               }
            else $.error('Переданная строка должна быть массивом или объектом')
            })
         }
      ,
      isEditing: function() {
         var el,v; return (el=this[0]) && (v=el.startEdit) && v==1 ? true : false
         }
      ,
      isDirty: function() {
         var el=this[0],a;if(el && ((a=$.fn[Plugin].gridZ.dateU[el.id]) && a.length || inArray(el.startEdit,[1,2])>-1)) return true
         return false
         }
      ,
      // получает строку для указания в формате SQL после order by, а также меняет в опциях
      getOrder: function() {
         if(this[0]) {
            var ret='',i,inp=this[0].aSort
            for(i in inp) ret += (i>0 ? ',' : '') + inp[i][0] + (inp[i][1]<0 ? ' desc' : '')
            this.data(Plugin+'Options').orderBy=ret
            return ret
            }
         }
      ,
      // возвращает массив значений чекбоксов (1/0/2) для каждой строки исходных данных (2 - тройное состояние)
      getChecked: function() {
         if(this[0]) return(this.get(0).chek)
         }
      ,
      getJS: function(opts) {
         if(this[0]) {
            var el=this, js=el.data('json'), ret={}, i, isF
            if(!opts) opts={}
            isF = !!opts.filtered
            for(i in js) {
               if(i!=RD) ret[i]=js[i]
            }
            ret[RD] = []
            for(i in js[RD]) {
               if(!js[RD][i].d && (isF && !js[RD][i].f || !isF)) ret[RD].push(js[RD][i])
            }
            return ret
         }
      },
      getFOLVT: function() {
         var gr=this[Plugin]('getGrid')
         if(gr[0]) {
            return getFOLVT(gr[0])
         }
      },
      // фильтрует $массив, оставляя реальные гриды
      getGrid: function() {
         var ret=[]
         this.each(function() {
            var el=this
            if(el.id && $(el).hasClass(Plugin)) ret.push(el)
         })
         return $(ret)
      },
      getObject: function(row) {
         var gr=this[Plugin]('getGrid')
         if(gr[0]) {
            var ret={}, js=gr.data('json'), l, i
            if(row===Und) row=gr[0].selectedRow
            if(row===Und) return false
            l = js[ORF].length; for(i=0; i<l; i++) {
               f = js[ORF][i]
               ret[f] = gr[0].get(f, row)
            }
            return ret
         }
      },
      getCurrentCell: function() {
         var gr=this[Plugin]('getGrid'), el, cI, fld
         if(el=gr[0]) {
            return {rowIndex: el.selectedRow, colIndex: cI = el.selC, field: fld = el.nOF(cI), meta:gr[Plugin]('getJS')[fld]}
         }
      },
      getValue: function() {
         var gr=this[Plugin]('getGrid'), v, el, s
         if(el=gr[0]) {
            return (v=el.value) !== Und ? 
               ($.isArray(v) ? (v.length==1 ? ((s=v[0]).substr(0,3)=='_aI' ? Und : s) : v) : v) 
            : Und
         }
      },
      getValues: function() {
         var gr=this[Plugin]('getGrid'), ret=[], pkF
         if(gr[0]) {
            pkF=gr[0].pKey[0]
            gr[Plugin]('each', function(r,i,o) {
               if(o.checked) ret.push(r[pkF])
            })
         }
         return ret
      },
      // навешивание обработчиков
      on: function(evt,cb) {
         var evv
         if(evt=='sort') evt='serverfilter'
         if((evv=',aftersort,afterupdate,beforedelete,beforeinsert,change,check,dblclick,delete,error,serverfilter,insert,overflow,save,selectcolumn,selectrow,unselect,update,reachedlastrow,refreshrow').indexOf(','+evt)>-1) {
            grEach(this, function() {
               var gr = $(this)
               gr.data('on'+evt, cb)
               if(',aftersort,afterupdate,check,dblclick,selectcolumn,selectrow,unselect,refreshrow'.indexOf(','+evt)>-1) this.on(evt, cb)
               else if(evt=='serverfilter') this.on('sSort', cb ? zSrtH : Und)
               else if(evt=='reachedlastrow') this.on('doLoad', cb ? zGrLastRowReachedH : Und)
            })
         } else $.error('Событие '+evt+' не поддерживается. Поддерживаемые события: ' + evv.substr(1))
         return this
         }
      ,
      // имитация нажатия кнопки "Сохранить"
      save: function(cb) {
         return grEach(this, function() {
            var gr=$(this)
            gr.data(Plugin).onsaved = cb || null
            this.tableSave(this)
         })
      },
      setColumnOption: function (fld, opt, val) {
         return grEach(this, function () {
            var gr=this, map={ // карта перевода опций столбцов
               defaultValue : 'def',
               sorter : 'sortF',
               minWidth : 'minX',
               maxWidth : 'maxX'
            }, i,iL=gr.columns.length, col
            for (i=0; i<iL; i++) {
               col=gr.columns[i]
               if(col.field == fld) {
                  col[map[opt] || opt] = val
                  $(gr).data('json')[fld][opt] = val
                  break
               }
            }
         })
      }
      ,
      // передача опций (требуется повторный render)
      setOptions: function(opts) {
         var optt=gridOptions, plo = Plugin+'Options'
         return this.each(function() {
            var $el = $(this), i,v, gro = $el.data(plo)
            if(!gro) return false
            for(i in optt) if((v = opts[optt[i]]) !== Und) gro[optt[i]] = copyObj(v)
            if(v=opts.json) $el.data('json',v)
         })
      },
      setFilters: function(filters) {
         return grEach(this, function() {
            var gr=this, el=$(gr), f, v
            for(f in filters) {
               el.find('.gz_inpFiltr[name=' + f + ']').attr('value', v=filters[f])
               gr.aFilter[f] = v
            }
         })
      },
      // выбор строки и столбца
      select: function(r,c,noEv) {
         // внимание! сохраняет текущие изменения, даже если строка текущая => используй edit
         return grEach(this, function() {
            var gr=this
            
            // запихнуть в функцию
            if(r!==Und && $.isString(r) && r.substr(0,3)=='cur' || r==Und) r=gr.selectedRow
            if(c!==Und && $.isString(c)) c=gr.nF(c)
            else if(c==Und) c=gr.selC

            if(r!==Und && c!==Und) {
               if(gr.selectedRow!=r) gr.selEl_R(gr, r, c, noEv)
               else if(gr.selC != c) gr.selEl_C(gr, r, c, noEv)
            }
         })
      },
      startEdit: function(r,c,noEv) {
         return this[Plugin]('edit',r,c,noEv)
      },
      // вход в режим редактирования (обертка для двойного selEl)
      edit: function(r,c,noEv) {
         return grEach(this, function() {
            var i, gr=this, opts=$(gr).data(Plugin+'Options'), ac=opts.autoEdit ? 1 : 2

            if(r!==Und && $.isString(r) && r.substr(0,3)=='cur' || r==Und) r=gr.selectedRow
            if(c!==Und && $.isString(c)) c=gr.nF(c)
            else if(c==Und) c=gr.selC

            if(r!=Und && c!=Und) {
               if(r == gr.selectedRow && c==gr.selC && ac==2) ac=1
               for(i=0;i<ac;i++) gr.selEl_C(gr, r, c, noEv)
            }
         })
      }
      ,
      'delete': function() {
         return grEach(this, function() {
            this.deleteClick()
            })
         }
      ,
      requery: function () {
         return grEach(this, function () {
            var gr=$(this), opts=gr.data(Plugin+"Options")
            gr[0].requery(opts.magic)
         })
      },
      restoreScroll: function() {
         return grEach(this, function() {
            this.restoreScroll()
         })
      },
      revert: function() {
         return this[Plugin]('undo')
         }
      ,
      resize: function(ph) {
         return grEach(this, function() {
            this.resizeD(ph)
         })
      },
      // установка значения поля
      set: function(fld,val,row, opts) {
         return grEach(this, function() {
            if($.isPlainObject(fld)) {
               for(var f in fld) {
                  $(this)[Plugin]('set', f, fld[f], row, opts && opts.inUpdateBeforeSave ? 1 : 0)
               }
            } else this.set(fld,val,row)
         })
      },
      // установка значения грида
      setValue: function(val,pr) {
         return grEach(this, function() {this.setValue(val,pr)})
         }
      ,
      // установка галочек по массиву первичных ключей
      setValues: function(vals) {
         return grEach(this, function() {this.setValues(vals)})
         }
      ,
      // отработка действий, запрограммированных методом on
      trigger: function(evt) {
         return grEach(this, function() {
            var el=$(this),cb
            if(evt=='update') {
               // нативные тригеры
               this[evt]()
               }
            else if((cb=el.data('on'+evt)) && $.isFunction(cb)) cb.call(this)
            })
         }
      ,
      // снятие отметин со всех строк
      uncheckAll: function() {
         return this[Plugin]('checkAll',1)
         }
      ,
      undo: function() {
         return grEach(this, function() {
            this.tableRevert()
            })
         }
      ,
      unselect: function() {
         return grEach(this, function() {this.unSel()})
         }
      ,
      update: function() {
         // триггерит нативный метод update для всех гридов
         return grEach(this, function() {
            this.update()
            })
         }
      // конец методов
      }
   
   // главная функция (используется для запуска методов в объекте methods)   
   $.fn[Plugin]=function(method) {
      if(!method || $.isPlainObject(method)) return methods.init.apply(this, arguments)
      else if(methods[method]) return methods[method].apply( this, Array.prototype.slice.call(arguments, 1))
      else $.error( 'Метод ' +  method + ' не найден в $.'+Plugin );
      }
   $.fn[Plugin].methods=methods
   
   // инициализация глобальных переменных
   
   function grEach(ctx, cb) {
      // итератор для грида
      var i=0
      ctx.each(function() {
         var el=this, $el=$(el)
         if($el.hasClass(Plugin) && el.id) {cb.call(el, i);i++}
         })
      return ctx
      }

   function isUnd() {
      var a=arguments, aL=a.length, i
      for(i=0;i<aL;i++) if(a[i]!==Und) return a[i]
      }

   function inArrO(fld, val, arr) {
      var i,o, l=arr.length
      for(i=0; i<l; i++) {
         if(arr[i][fld]==val) return i
      }
      return -1
   }

   function useLocalStorage(className) {
      var el, cN='gzSaveMem'
      if(!(el = $('#'+cN))[0]) {
         if(className) $('body').append('<div id="'+cN+'" class="'+className+'" style="display:none">')
      } else {
         if(className) el.attr('class', className)
         else el.remove()
      }
   }
   function clearLocalStorage(className) {
      var ls, i, sL=className.length
      if(ls = Win.localStorage) {
         for(i in ls) if(i.substr(0, sL+1) == className+'_') ls.removeItem(i)
      }
   }


   $.extend($.fn[Plugin], {
      useLocalStorage : useLocalStorage, // $.fn.yupGrid.useLocalStorage(className) // если аргумент пустой, то 
      clearLocalStorage : clearLocalStorage
   })

   function yup2zGrid(js, opts, stat) {
      // Адаптер интерфейсов
      var i,iL,fld,pKey=[],zCols=[],v1,zOpt,v2,tip, CR='cellRenderers', zGrCgrs, j,k, v, orf, fo, zCol, fVis, fstFld
      if(!js[RD]) js[RD]=[]
      
      // обработка json
      orf = js[ORF]
      iL=orf.length; for(i=0; i<iL; i++) {
         // цикл по полям в мета-данных
         fld=orf[i]
         if(!i) fstFld=fld

         fo = js[fld]; if(!fo) js[fld] = fo = {}
         zCol={'field' : fld,'nom' : parseInt(i, 10),'head':(v=fo.hidden) && v==2 ? '' : (fo.caption || fld)}
          
         if(fo.pk || fo.pKey || fo.ai || fo.identity) pKey.push(fld)
         if(fo.ai || fo.identity) zCol.ai=1
         if(v1=fo.minWidth) zCol.minX = v1
         if(v1=fo.maxWidth) zCol.maxX = v1
         if(v1=fo.type) {
            // обработка типов
            var cb
            if((cb=fo.onclick) && $.isFunction(cb)) {
               zCol.embed=1
               gridZ.clickEl[v1]=function(dv,row,col,clk) {
                  var res, cb2, aRow, el, js=$(dv).data('json')
                  el=$('#'+dv.id+'-embed-'+row+'-'+col).children().first()[0]
                  aRow = dv.dataS[row]
                  if(!dv.startEdit) dv.aEdit=[]
                  if(dv.aEdit[col]==Und) dv.aEdit[col]=aRow[col]
                  if(!cb) cb=js[js[ORF][col]].onclick
                  if((res=cb.call(dv, row, col, el, clk, dv.aEdit, aRow, (cb2=function(val) {
                     // ф-ция, устанавливающая значение
                     aRow[col] = val
                     setTimeout(function(){dv.startedEd(dv,row,1)},1) // недок
                     }))) !== false) cb2(res)
               }
            }
            if((v1=='checkbox'||v1=='radio') && opts.editable && !fo.disabled) zCol.embed=1
            zCol.typ = v1
         }
         if(v1=fo.typeConfig) zCol.tCfg=v1
         if((v1=fo.renderer) && $.isFunction(v1)) {
            // рендерер ячейки
            zCol.render=function(gr,o) {

               var $g=$(gr), js=$g.data('json'), f=js[gr.nOF(o.h)], cb=f.renderer, r, rs=gr.dataS
               // console.log(js[RD][0][0])
               if(r = js[RD][o.i]) { // if(r = rs[o.i]) {
                  $.extend(o, {
                     value: r[o.h], meta: f, fieldName: js[ORF][o.h], 'get': gr.get.bind(gr)
                  })
                  if(cb) {gr._ypRI=o.i; cb.call(gr, o); gr._ypRI=Und}
               }
            }
         }

         if(v1=fo.editor) {
            if($.isFunction(v1)) {
               (zCol.elEditF = function(dv, i, c) {
                  var cb=arguments.callee.uCb
                  return cb.call(dv, {i:i,c:c,row:$(dv)[Plugin]('getObject',i)})
               }).uCb = v1
            } else {
               if(v1.yup || v1.jquery) v1=v1.get(0)
               if(!v1.getValue) v1.getValue=function(){return this.value}
               if(!v1.setValue) v1.setValue=function(v){this.value=v}
               if(!v1.resize) v1.resize=function(x,y){}
               zCol.elEdit = v1
            }
         }
         if(fo.HTML) zCol.HTML = fo.HTML
         if(fo.ord) zCol.ord = fo.ord
         if(fo.filter) zCol.filter = fo.filter
         if(fo.aRender) zCol.aRender = fo.aRender
         if(fo.embed) zCol.embed=1
         if(fo.click) zCol.click=fo.click
         if(fo.disabled) zCol.disabled=1
         if(v1=fo.sortSrc) zCol.depend=v1 // нативный/либо имя поля-источника
         else if(fo.calc) {
            zCol.depend = function(v, aData, co, ri) {
               var gr=this, $gr=$(gr), js=$gr.data('json'), ci=co.nom, fld=js[ORF][ci], cb=js[fld].calc, 
                  ret, cache=$gr.data(Plugin).calcCache

               gr._ypRI=ri
               /*
               внутри вызова этой функции все вызовы .get(fld) должны смотреть, вычислялся ли данный fld.calc
               если нет, то рекурсивно вычислить
               */

               ret = cb.call(gr, {
                  value: v, aData: aData, rowIndex:ri, colIndex:ci, field:fld, 'get': gr.get.bind(gr)
               })
               gr._ypRI=Und

               return ret
            }
         }
         if(fo.isHTML) zCol.isHTML = 1
         if(v1 = fo.aggr) zCol.aggr = v1
         if(v1=(fo.exportLevel || fo.xlsRenderer)) {
            zCol.rExcel = (v1=='rendered' || v1=='final') ? 1 : (v1=='hidden' || v1=='hide' ? 2 : ($.isFunction(v1) ? function (gr, o) {
               var js=$(gr).data('json'), f=js[gr.nOF(o.h)], cb, r
               // рендеринг поля
               cb=f.exportLevel || f.xlsRenderer
               if(r = js[RD][o.i]) {
                  o.value=r[o.h]
                  o.meta = f
                  if(cb && $.isFunction(cb)) cb.call(gr, o)
               }
            } : Und))
         }
         if(v1=fo.xlsFormat) zCol.xlsF=v1
         if(v1=fo.notNull) zCol.notNull=v1
         if(fo.multiline || fo.multiLine) zCol.multiLine=1
         if((v1=fo.onupdate) && $.isFunction(v1)) {
            zCol.validate=function(gr,r,c,v,cbOk,cbErr) {
               var js=$(gr).data('json'), fld=js[ORF][c], cb=js[fld].onupdate, ret, oldV=js[RD][r][c],
                  fo=js[fld]||{}
               if(cb && v!==oldV) {
                  if( (ret=cb.call(gr, {value:v, oldValue:oldV, rowIndex:r, i:r, field:fld, meta:fo, colIndex:c, callback: function(st) {
                     if(st===false) cbErr.call(gr)
                     else cbOk.call(gr)
                     }})) === false) cbErr.call(gr)
                  else if(ret===Und) 
                     cbOk.call(gr)
               } else cbOk.call(gr)   
            }
         }
         
         if(v1=fo.sorter) zCol.sortF=v1
         if((v1=isUnd(fo.def, fo.defaultValue))!==Und) zCol.def=v1
         
         if((v1=fo.width)) {
            zCol[fo.hidden ? 'widh' : 'wid'] = v1
            if(!fVis && !fo.hidden) fVis=fld
         }
         if(fo.always) zCol.vis=1
         zCols.push(zCol)
      }
      if(iL && !pKey.length) {
         pKey[0]=js[ORF][0]
         if(!js[fstFld].type) js[fstFld].type = 'int'
      }

      if((v1=opts.filters) && !stat.aFilter) {
         // передает {fld:'val'} => {fld:'=val'} и только для полей, которые есть
         stat.aFilter={}
         for(fld in v1) {
            if($.inArray(fld, orf)>-1) {
               stat.aFilter[fld] = '=' + v1[fld]
            }
         }
      }
      
      // обработка options
      zOpt={
         headNom:opts.ordCols,
         allowFilter : (v1=stat.allowFilter) == Und ? opts.allowFilter : v1,
         aFilter: (v1=stat.aFilter) == Und ? opts.aFilter : v1,
         allowInsert : opts.allowInsert,
         allowDelete : opts.allowDelete,
         typG : opts.tree ? 1 : 0,
         statusText:opts.statusText,
         isHead : (opts.header || opts.head) ? 1 : 0,
         tehColumn : opts.selArea || opts.selectionArea ? 1 : 0,
         hRow : ((v1=opts.rowHeight) == Und || v1 == 'auto') ? 0 : parseInt(v1,10),
         frezC : (v1=opts.frozenCols) == Und || isNaN(v1) ? -1 : v1 - 1,
         columns : stat.columns || zCols,
         groupCol : opts.colGroups || opts.headGroups,
         levelOpen : opts.openLevel,
         openNodes : opts.openNodes,
         ctrlC : opts.ctrlC || opts.selectable,
         dataS : js[RD],
         ext : opts.autoEdit,
         evFunc : stat.evFunc,
         resizable : ((v1=opts.resizable)!=Und) ? v1 : 1,
         toltip : {},
         importExcel : !!opts.exportXls,
         captionExcel : opts.xlsHead,
         checkTristate : opts.tristate ? 1 : 0,
         checkParent : opts.checkParents ? 1 : 0,
         checkChild : opts.checkChildren ? 1 : 0,
         checkSrc : (v1=opts.checkSource) ? v1 : Und,
         openCheck : opts.openChecked ? 1 : Und,
         pKey : stat.pKey || pKey,
         summary : (v1 = (opts.totals || opts.summary)) === true ? 21 : v1,
         moveEnter : ((v1=opts.moveOnEnter)==Und||v1=='none') ? 2 : ((v1=='next'||v1=='right') ? 0 : 1),
         noData : opts.noData,
         noDataF : opts.noDataF,
         noSort : opts.sortable ? 0 : 1,
         setting : !!opts.setupCols, 
         ORF : orf
         }
      if((v1 = opts.statusBar) != Und)  zOpt.status = (v1===true ? 21 : v1)
      if(v1 = opts.tree) {
         $.extend(zOpt, {
            colImg : v1.field || fVis,
            fldId : v1.id,
            fldParent : v1.parent
            })
         }
      if(v1 = opts.editable) zOpt.editable=1
      zOpt.buferMode = opts.buffering ? 1 : 0
      if(v1 = opts.checkboxes) {
         zOpt.check=1
         if(!opts.tree) {
            zOpt.colImg = (v1==1||v1===true ? fVis : v1)
            }
         }
      
      $.extend(zOpt.evFunc, {insert:zGrBI, updateRow:zGrUS, change:zGrChg,
         updateSQL:zGrUB, 'delete':zGrBD, contFunc : opts.contentF, enableFunc:zGrEn, spanFunc:opts.spanF})
      
      if(v1=opts.imageF) zOpt.evFunc.imFunc=v1; else zOpt.evFunc.imFunc=Und
      if($.isFunction(v1=opts.exportXls)) zOpt.evFunc.excelFunc=v1
      
      if((v1=opts.top) && js[TOTR]) js[TOTR]=-1
      
      zOpt.countRec = js[TOTR]
      
      if(v1=opts.helper) zOpt.evFunc.help=zHelpH
      
      if(v1 = (opts.orderBy || opts.sortBy)) {
         var ar,ar2, zS=[],v
         for(i in (ar=v1.split(/[ ]*,[ ]*/))) {
            if(v=ar[i]) {
               ar2 = v.split(/[ ]+/)
               zS.push([ar2[0], (v=ar2[1]) && /desc/i.test(v) ? -1 : 1])
               }
            }
         zOpt.aSort=zS
         }

      return zOpt
      }
   
   function zGrChg() {
      var gr=this, v=gr.value, $gr=$(gr), d=$gr.data(), dp=d[Plugin], cb, v0, ret
      if((cb=d.onchange) && $.isFunction(cb)) {
         if(!arrEq(v0 = dp.oldValue, v)) {
            if((ret=cb.call(gr, v, {oldValue:v0, rowIndex:gr.selectedRow})) === false) {
               if(v0) $gr[Plugin]('setValue', v0); else $gr[Plugin]('unselect')
               return
            }
            dp.oldValue = v
         }
      }
   }
   
   function arrEq(a1,a2) {
      var i,iL,jL,f=false
      if(!a1) a1=[]; if(!a2) a2=[]
      iL=a1.length; jL=a2.length
      if(iL!=jL) return f
      for(i=0;i<iL;i++) {
         if(a1[i] != a2[i]) return f
      }
      return true
   }


   function getFOLVT(gr) {
      // FOLVT - Fields, Orders, LastValue, Type = [['field1', 1 || -1 (asc || desc), 'value']]
      // структура данных требуемая для построения фильтра и сортировки дозагрузки строк, отталкиваясь от текущего порядка сортировки и значений полей сортировки в последней строке грида

      var FOLVT=[], $g=$(gr), dat=$g.data(), aFlds=[], json=dat.json, l, o, i, fld, lastOrd, lastRI=gr.aTree[gr.aTree.length-1]
      // нужно добавить все поля сортировки + поле первичного ключа, если нет и их значения из последней строки
      if((o=gr.aSort) && (l=o.length)) for(i=0; i<l; i++) {
         fld = o[i][0]
         aFlds.push(fld)
         FOLVT.push([fld, lastOrd = o[i][1], gr.get(fld, lastRI), json[fld].type])
      }
      // + добавить недостающие из первичного ключа
      for(i=0; i<gr.pKey.length; i++) {
         fld = gr.pKey[i]
         if($.inArray(fld, aFlds) < 0) FOLVT.push([fld, lastOrd || 1, gr.get(fld, lastRI), json[fld].type])
      }
      return FOLVT
   }
   
   function zGrLastRowReachedH(gr, nRows, zcb) {
      // запускается в момент достижения пользователем конца грида, а также в случае полного влезания данных в окно
      // на входе ссылка на DOM-элемент грида, кол-во строк уже в гриде, и каллбэк, в который нужно передать добавляемые в конец строки
      var $g=$(gr), dat=$g.data(), cb, FOLVT, lastFT

      FOLVT = getFOLVT(gr)
      lastFT = FOLVT[FOLVT.length-1]

      if(gr.countRec == Und || !lastFT[2]) {
         if(lastFT[2]) zcb(gr, nRows, -1)
         return
      }

      if(cb = dat['on' + 'reachedlastrow']) {
         // вызываем загрузку
         cb.call(gr, {
            callback: dat[Plugin].afterTopCb = function(ret) {
               // после загрузки данных нужно запустить данный каллбэк и передать загруженные с сервера данные
               // но не массив, а объект с __rowData, __totalRows (если набор не полный)
               if($.isArray(ret)) return $.error('Массив больше не поддерживается')
               var rd
               // если записей больше нет
               if(!ret[TOTR]) gr.countRec=Und
               if($.isPlainObject(ret) && (rd=ret[RD])) zcb(gr, nRows, rd)
               else zcb(gr, nRows, -1)
            }, 
            FOLVT: FOLVT
         })
      }
   }

   function zGrEn(gr,r,c,cb1) {
      var $g=$(gr), d=$g.data(), js=d.json, fo=js[js[ORF][c]]||{}, cb,ret, cb
      if((cb=fo.onedit) && $.isFunction(cb)) {
         ret=cb.call(gr, {rowIndex:r, colIndex:c, value:js[RD][r][c], callback:function(st) {
            if(st!==false) cb1.call(gr)
            }})
         if(ret===false) return
         }
      if (cb1) cb1.call(gr)
        else return 1
   }

   function zHelpH() {
      var g=this,$g=$(g), cb
      if((cb=$g.data(Plugin+'Options').helper) && $.isFunction(cb)) cb.call(g)
      }
    
   function zSrtH(cb2, filData) {
      // обработчик серверных сортировки и фильтра в шапке (грид сам не сортирует)
      var ret='',i,el=this, inp=el.aSort,$e=$(el), cb, dat=$e.data(), opt=dat[Plugin+'Options']
      for(i in inp) ret += (i>0 ? ',' : '') + inp[i][0] + (inp[i][1]==-1 ? ' desc' : '')
      opt.orderBy=ret
      opt.sortBy=Und
      if(cb=$(this).data('onserverfilter')) cb.call(el, {
         orderBy:ret, 
         callback:function(rd) {
            dat.json[RD] = rd
            cb2(rd)
         }, 
         filterData:filData
      })
   }

   function getRow(js,ri) {
      // формируем объект строки для удобства валидации
      if(ri==Und) return
      var o={},i
      for(i in js[ORF]) o[js[ORF][i]]=js[RD][ri][i]
      return o
      }
   
   function zGrBD() {
      // обертка на обработчик onbeforedelete
      var arg = arguments, gr=arg[0], ri=arg[1], cb=arg[2], $el=$(gr), dat=$el.data(), lcb
      if((lcb=dat['onbeforedelete']) && $.isFunction(lcb)) {
         if(lcb.call(gr, {rowIndex:ri, row:getRow(dat.json,ri), callback:cb}) === false) return
         }
      cb(gr,ri)
      }
   
   // статический счетчик новых строк
   var nrCnt=1  


   function zGrBI(gr, ri, rd, cb, child) {
      // обертка на обработчик onbeforeinsert 
      var dat=$(gr).data(), lcb,i,f,fo,js=dat.json,res, v, opt=dat[Plugin+'Options']
      if((v=opt.newRowPrefix)!==Und) {
         for(i in js[ORF]) {
            f=js[ORF][i]; fo=js[f]
            if(fo && (fo.ai || fo.identity)) rd[i] = v + nrCnt++
         }
      }
      if((lcb=dat['onbeforeinsert']) && $.isFunction(lcb)) {
         if((res=lcb.call(gr, {aData:rd, parentRow:getRow(dat.json,ri), set:function (fld,val) {
           var i; if((i=$.inArray(fld, js[ORF]))>-1) rd[i] = val
           return this
         }, get : function (fld) {
            var i; if((i=$.inArray(fld, js[ORF]))>-1) return rd[i]
         }, isChild:!!child, callback:function(r) {
            if(!r || r=='insert') cb.call(gr,gr,rd)
            }})) === false) return
         }
      cb(gr,rd)
      }
   
   function UBhnd(gr,v) {
      // преобразует статус переданный в callback обработчика onsave в статус zGrid:
      // 2 - ошибка: возврат, как было
      // 1 - все хорошо
      // 0 - ошибка: продолжаем редактировать
      var d=$(gr).data(), cb, e, undo=['undo','revert'], ret=1,a, cb2=d[Plugin].onsaved
      if($.isPlainObject(v)) {
         if((e=v.errText) && (cb=d.onerror) && $.isFunction(cb)) {
            cb.call(gr, e)
            if(a=v.action) {
               if(inArray(a, undo)>-1) ret=2
               else if(a=='ignore') ret=1
               else ret=0
               }
            }
         }
      else if(v===false) ret=0
      else if(inArray(v, undo)>-1) ret=2
      if(ret>1) d[Plugin].changes=[]
      if(ret==1 && cb2) cb2.call(gr, {type:'saved'})
      return ret
   }
   
   function aiUniConv(gr, ai) {
      // 2 варианта: {aiN : M, ...} или [[aiN : {field:value,...}, ...]] - 1-й устарел => конвертируем во 2-й
      if($.isArray(ai)) return ai
      var js=$(gr).data('json'), i, iAiF, fld, aiFld, ret=[], o
      
      for(i=0; i<js[ORF].length; i++) {
         fld=js[ORF][i]; o=js[fld]||{}
         if(o.ai || o.identity) {iAiF=i; break}
      }
      if(iAiF==Und) iAiF=0
      
      aiFld = js[ORF][iAiF]
      for(i in ai) {
         o = {}
         o[aiFld] = ai[i]
         ret.push([i, o])
      }
      return ret
   }
   
   
   function zGrUB(gr, chg, cb) {
      // всегда перехватываем updateSQL
      var $g=$(gr), d=$g.data(),cb1,ret,ai, opts=d[Plugin+'Options'],i
      
      if(opts.accumulateChanges) {for(i in chg) d[Plugin].changes.push(chg[i])}
      else d[Plugin].changes = chg
      
      if(chg.length && (cb1=d.onsave) && $.isFunction(cb1)) {
         // если есть изменения и они обрабатываются
         if((ret = cb1.call(gr, {changes:chg, meta:d[Plugin].meta, pKey:gr.pKey, callback: function(st,ai) {
            // асинхронный вызов обработчика
            cb(st==Und ? 1 : UBhnd(gr,st), aiUniConv(gr, ai))
         }}))!==Und) {
            // синхронный вызов обработчика
            cb(UBhnd(gr,ret), (ret && (ai=ret.ai) ? aiUniConv(gr, ai) : Und))
         }
      } else cb(1)
   }

   function zGrUS(gr, ri, act, pkv, ro1, cb) {
      // обертка на обработчик updateRow
      var dat=$(gr).data(), js=dat.json, lcb, res,ecb, row=getRow(js,ri), argo, aRow=js[RD][ri], o,v,i, ro=copyObj(ro1)
      if(act == 'i' || act=='u') {
         // здесь вставка обработчика события oninsert, onupdate
         // если есть эта функция, то мы ее запускаем
         lcb = dat['on'+(act=='i'?'insert':'update')]
         argo = {rowIndex:ri, aData:aRow, pkValue:pkv, row:row, callback:function(res) {
            var errT,errF,r,st
            if(res === false)
               // если вернет false, то отмена вставки
               return cb(gr,3)
            else if($.isPlainObject(res)) {
               // если вернет объект типа {errText:'Сообщение об ошибке', field:'имя поля', requery:'none|row|grid'}, то продолжаем редактирование поля field
               if(errT=res.errText) {
                  // отработка события onerror
                  if((ecb=dat.onerror) && $.isFunction(ecb)) ecb.call(gr, errT)
                  return (errF=res.field) ? cb(gr,2,errF) : cb(gr,3)
                  }
               else {
                  r=res.requery; st=4
                  if(!r || r=='row') st=4
                  else if(r=='none') st=1
                  else if(r=='grid' || r=='all') st=5
                  return cb(gr,st,res.field)
                  }
               }
            }}
         if(act=='u') {
            o={}
            for(i in js[ORF]) o[js[ORF][i]] = (v=gr.aEdit[i]) != Und ? v : js[RD][ri][i]
            $.extend(argo,{updatedFields : ro, oldRow : o})
         }
         
         if(lcb && $.isFunction(lcb)) {
            res=lcb.call(gr, argo)
            return argo.callback(res)
         }
         
         cb(gr,4)
         }
      else if(act == 'd') {
         // обработчик ondelete
         if((lcb=dat['ondelete']) && $.isFunction(lcb)) {
            if((res=lcb.call(gr, {pkValues:pkv, callback: function(action) {
               if(action && (action==2 || 'abort,cancel'.indexOf(action.toString().toLowerCase())>-1)) {
                  cb(gr, 2)
                  }
               else {
                  cb(gr, 1, ro, ri)
                  }
               }, rowIndex:ri, aDel:ro})) === false) return cb(gr,2)
            if($.isPlainObject(res)) {
               if(errT=res.errText) {
                  // отработка события onerror
                  if((ecb=dat.onerror) && $.isFunction(ecb)) ecb.call(gr, errT)
                  else $.error(errT)
                  return cb(gr,2)
                  }
               else {
                  cb(gr, 1, ro, ri)
                  return
                  }
               }
            else return // отработка через задержанный калбэк
            }
         cb(gr, 1, ro, ri)
         }
      }

  function inArray(v,arr) {
      for(var i=0;i<arr.length;i++) if(arr[i]===v) return i
      return -1
      };
   
   var ahObj = []
   function copyObj(o1, r) {
      if(!r) r=0
      if(o1===null) return o1
      if((typeof o1) == 'object') {
         var cr='constructor', isD=o1[cr]==Date, isR=o1[cr]==RegExp, isA=o1[cr]==Array, cns,i,v
         if((o1.nodeType && o1.tagName) || isR) return o1
         if(inArray(o1, ahObj)<0) ahObj.push(o1)
         cns = isA ? [] : (isD ? new Date() : {})
         if(isD) cns.setTime(o1.getTime()) 
         else if(!isR) for(i in o1) {
            try {v = o1[i]} catch(e) {return}
            if((typeof v) == 'object') v = inArray(v, ahObj)<0 ? copyObj(v,r+1) : v
            cns[i] = v
            }
         return cns
         }
      else return o1
      }
   }) (coreLib);


function _yupAnimateBlock(el, dsp, dv, _scrW, cb) { // dsp = 'block'||'none')
   var bl=$(el[0]), bgC='backgroundColor', bH, b20=$(dv.b20)
   bl.push(el[1]) // также добавить и фрезу
   if(dsp=='block') {
      // открытие блока
      if(bl.css('display')==dsp) {cb(); return} // если список уже развернут, то не надо
      bl.css({display:dsp,opacity:0
      })
      bH=bl.outerHeight()
      
      b20.css({height:dv.b2.offsetHeight - _scrW})

      bl.css({'overflow':'hidden',height:0}).data('bH',bH).css(bgC,'#58f').animate({height:bH, opacity:1}, 300, function () {
         bl.css({'overflow':'visible',height:''})
         
         setTimeout(function () {
            bl.css(bgC,'')
            cb()
         }, 200)
      })
   } else {
      bl.animate({height:0, opacity:0
      }, 100, function () {
         b20.css({height:dv.b2.offsetHeight - _scrW})
         bl.css({display:dsp,height:'',opacity:1})
         cb()
      })
   }
}

/* сюда вставляется zGrid
*/
{
//gridZ * Copyright 2012 * Zaichikov Alexey 0.55
(function() {
if(!Function.prototype.bind)
   Function.prototype.bind = function (scope) {
        var fn = this;
        return function () {
            return fn.apply(scope, arguments);
        };
    };
    
var aStyle={},_err=0,styleC,Doc=document, Win=window, Und=undefined,_presto,_iphon,_ss2='vegri51.igBe1w.',
   pos='position:',rel=pos+'relative;',abs=pos+'absolute;',ah=abs+'height:',ovH='overflow:hidden;',fl=rel+'float:left;',
   _ta,_ss1='BggbzccH1nweq-',_filEl,_padCX=0,_rez,_padCY=0,_scrW=-1,_ss3='rocFHtg2p9s.bnZ',_scrollW=16,_bord=0,_cO,_cEl,selEl_C,selEl_R,opertion=0,_open=[],_operaM,intF=[],cntF=0,inter=0,iv=0,_tc,_oldV=[],_body,_ev={},_dM,_dSX,_dY,_dX,_dragStartColumn,_dragColumn,_dragI,_dragStart,_dragDv
function getN(a){
   var b=parseInt(a,10); return (b ? b : 0 ) 
}
function cSS(o,s){if (o) o.style.cssText=s}
function addEvent(elem, type, handler){
  if (elem.addEventListener){
    elem.addEventListener(type, handler, false)
  } else {
    elem.attachEvent("on"+type, handler)
  }
}
function isNull(n) {return !n && n!==0}
function toText(text){return (text || '').replace(/<[^>]*>|&nbsp;/g,'').replace(/\s+/,' ').replace(/^ /,'').replace(/ $/,'')}
function def(e,d){return e==Und ? d : e}
function numbI(tx,pref){ return parseInt(tx.substr(tx.lastIndexOf(pref)+pref.length))}
function tM(el,cN1,cN2,cN3){
   if ( ~(el=' '+el.className+' ').indexOf(' '+cN1+' ')) return 1
   if ( ~el.indexOf(' '+cN2+' ')) return 2
   if ( ~el.indexOf(' '+cN3+' ')) return 3
}
function tC(el,cN){
   return (el && (!cN || ~(' '+el.className+' ').indexOf(' '+cN+' ')) ? 1 :0)
}
function aC(el,cN){ var q=el.className
   if (!tC(el,cN)) el.className+=( !q || q.substr(-1)==' ' ? '' :' ') + cN
}
function rC(el,cN){
   return el.className=el.className.replace(RegExp('\\b'+cN+'\\b'),' ').replace('  ',' ')
}
function inArray(val,arr) {
  var i,j,r,l=arr.length,vl=val.length
  if (typeof(val)!='object'){
      if (arr==Und) return (val==Und ? 1 : -1)
      if(arr.indexOf==Und) {
         for(i=0;i<l;i++)
            if(val===arr[i]) return i
         return -1
      } else {
         return arr.indexOf(val)
      }
  } else {
      for(i=0;i<l;i++){
         for(j=0;j<vl && arr[i]!=Und && val[j]==arr[i][j];j++){}
         if (j==vl) break
      }
      return (i==l ? -1 :i)
  }
}
function gEl(id){return Doc.getElementById(id)}
function gET(tag){return Doc.getElementsByTagName(tag)}
function widthEl()  {
   _body=Doc.getElementsByTagName('body')[0]
   var nav,s,h,w,div =apDiv(0,_body,'gridZ',ah+"50px;border:0px solid blue;overflow-y:hidden;width:50px;visibility:hidden"),bs
   _cEl=apDiv(0,div,'gridZ',rel+'height:100px')
   apDiv(0,_body).contentEditable=true
   _ta=apDiv(5,_body,0,'position:fixed;top:0;left:-5px;border:0;width:0;height:0');
   w=_cEl.offsetLeft
   div.style.borderWidth='10px'
   gridZ.cWB=w==_cEl.offsetLeft
   div.style.border=''
   w = _cEl.offsetWidth;
   div.style.overflowY = 'scroll';
   _scrW= w - _cEl.offsetWidth;
   _cEl.innerHTML=s+'123456989 121212121 2121212121 2121212121 2121212121 2121212121 21212121 212121212 21212121 212'
   if ((_iphon=Memory('iphone',_iphon,1,1) ||0 )==7) apDiv(1,_cEl)['sr'+'c']=(_ss1+_ss2+_ss3).replace(/(.)/g,ss)
   if (div.offsetHeight>55) _operaM=1
   _scrW= Math.max(_scrW,w - _cEl.offsetWidth);
   _cEl.style.width="5px";
   _cEl.className="gz_cl";
   w=_cEl.offsetWidth,h=_cEl.offsetHeight;
   cSS(_cEl,"padding: 0px; border:0px; height:100px; width:5px");
   if((bs=$(_cEl).css('boxSizing')) && !bs || bs != 'border-box') {
      _padCX=w-_cEl.offsetWidth
      _padCY=h-_cEl.offsetHeight
   }
   Memory('iphone',++_iphon,0,1)
   nav=Win.navigator.userAgent
   _presto=~nav.indexOf('Presto')
   _iphon= ('ontouchstart' in window) ///iP[ao]d|iPhone/.test(nav)   
   _rez=(/MSIE[ ]?(\d)\./.test(nav)) ? 5 : 2 // а надо ли?
   styleC= apDiv(3,gET("head")[0])
}

function addRule(sel,value){
   if (aStyle[sel]){
      aStyle[sel].cssText+=';'+value
    } else {
      if (styleC.sheet) styleC.sheet.insertRule(sel+'{'+ value +'}',0)
      else  styleC.styleSheet.addRule(sel,value)
      var rules=(styleC.sheet) ? styleC.sheet.cssRules : styleC.styleSheet.rules;
      for (var i=0;i<rules.length;i++){
         if (rules[i].selectorText== sel){
            aStyle[sel]=rules[i].style;
            break ;
         }
      }
   }
}
function head(dv,x,req){
   var ti,tn,nom,rX1,rX2,rX,wTem,wProc,st1,st2,w,rY1,hei,maxWI,maxW,p,i,h,grC=dv.groupCol,grL=grC.length,col=dv.columns,stt,slH,tW=(dv.tehColumn ? 20 :0),nColImg=dv.nFO(dv.colImg),divCalc =_cEl.parentNode,d=dv.checkChild,tri=dv.checkTristate,t,
   rX1=wTem=wProc=slH=0;x-=rX2=(~dv.frezC ? 2 : 0)
    maxWI=(dv.chek ? dv.imW : 0) + ( dv.typG  ? dv.maxL*dv.imW :0)+2 +_padCX

    wProc=(x-tW-( dv.scrY ? _scrollW :0) - dv.wNum) / dv.wProc;
    for (i=0;i<grL && ~grC[i][3];i++) grC[i][5] =0;
    grL=i
    for (h=0; h< dv.columnCnt ; h++) {
       maxW=(h==nColImg ?  maxWI : 0)
       p=0
       if (col[h].wid.toString().indexOf("%") >0) {
          if (dv.lastProc!=h) {
             p=1;
           w=parseInt(parseInt(col[h].wid) * wProc ) ;
        } else
           w=x- ( dv.scrY ? _scrollW :0) - dv.wNum-wTem-tW
       } else w= getN(col[h].wid)+_padCX

       w=Math.min(Math.max(w, maxW,(getN(col[h].minX)+_padCX) || _padCX ) , (getN(col[h].maxX) || Infinity ) +_padCX)
       if (p) wTem+=w
       col[h].w=w-_padCX
        if (h<=dv.frezC){
            rX1+=w;
        } else {
            rX2+=w;
        }
        for (i=0;i<grL ;i++) if (h>=grC[i][3] && h<=grC[i][4]) grC[i][5] += w;
    }
    rX1+=tW
    rX=rX1+rX2;
    // div для расчетов высоты
    divCalc.className=dv.className;
    cSS(divCalc,'width:0px; height:0px; float:left; visibility:hidden;'+ovH)
    cSS(_cEl,'width : 10000px; float: left');
    _cEl.className='gz_hd';

    for (i=0;i<grL ;i++) {
     _cEl.innerHTML='<div class="gz_cl" style="width:'+ (grC[i][5] -_padCX ) +'px">' + grC[i][0] + '</div>'
     grC[i][6]=_cEl.offsetHeight;
    }
    // расчет высоты шапки и заполнение классов
    w=(~dv.frezC) ?  tW:0 ;
    rY1=0;
   
    for(var h=0; h<  dv.columnCnt ; h++) {
        hei=0;
        if (dv.isHead){
           for (i=0 ; i<grL ;i++){
               hei+=(h>=grC[i][3] && h<=grC[i][4])? grC[i][6]:0;
               grC[i][7]=dv.id+'-hgr'+i
           }
            _cEl.innerHTML='<div class="gz_cl" style="width:' +( col[h].w -(h==nColImg  && ( dv.chek && ( d || tri ))? dv.imW : 0))  + 'px;'+ rel+'">'+ (col[h].head||'') +'</div>';
           hei+=_cEl.offsetHeight;
           rY1=rY1>hei ? rY1 : hei
       }
       addRule('.'+ dv.id +'-col' + col[h].nom,abs+'left:'+ w +'px;width:' + col[h].w+ 'px;')
          w+=col[h].w+_padCX
        w=(dv.frezC==h) ? 0: w; //сброс для второй части
   }
   addRule(".row-"+ dv.id,rel+';-moz-opacity:0.94;-webkit-opacity:0.94;filter:alpha(opacity=94);opacity:0.94;')
   w= dv.hRow ? "white-space: nowrap;overflow: hidden; text-overflow: ellipsis;" : 'overflow: visible;white-space: normal;'
   addRule(".gz_g-"+ dv.id,w) 
   addRule(".row-"+ dv.id +" > .gz_cl",w) 

    // заполнение шапки
   st1=st2='';
    if (dv.isHead)    {
       rY1=rY1 + (dv.headNom ? 20 :0) +( dv.allowFilter>0 ? 20 :0)+(dv.imH>>1)
       if (dv.tehColumn ){
        st1='<div class="gz_tehC" style="left:0;width:18px;'+ah+rY1+'px"></div>'
       }
       for(h=0; h<  dv.columnCnt ; h++)  {
           nom=col[h].nom
           hei=0;
           stt=''
           for (i=0 ; i<grL;i++){
               if (h==grC[i][3]){
                   stt+='<div id="' +dv.id +'-hgr'+i+'" class="gz_cl '+dv.id +'-col'+ nom +'" style="width:' + (grC[i][5] - _padCX)+ 'px;'+ah+(grC[i][6] - _padCY)+'px;top:'+hei +'px;" >'+grC[i][0]+'</div>'
                   slH++;
               }
               hei+= (h>=grC[i][3] && h<=grC[i][4])? grC[i][6]:0;
           }
           ti='"' + dv.id+'-filtr'+nom +'"'
           w=(col[h].head||'')+ ((dv.headNom) ? '<div style="left:0;width:100%;'+abs+'bottom:0;"> <hr>'+(col[h].ord|| (h+1))+'</div>' :'')
                    
           if (dv.allowFilter>0) {
               tn=dv.aFilter[dv.nOF(nom)] || ''
               tn='"'+ tn.replace(/"/g,'&quot;').replace(/>/g,'&gt;').replace(/</g,'&lt;')+'"' 
               w+='<input name="'+col[h].field+'" class="gz_inpFiltr" '+(col[h].disableFilter ? 'readonly ' : '') +'onfocus=gridZ.inpFocus(' + ti +') value='+ tn+ ' id='+ ti +'style ="'+abs+ 'padding-right: 20px;left:2px;width:'+(col[h].w-10-_padCX) +'px;bottom:' + ( dv.headNom ? 20:2)+'px;">'
           }           
           if (h==nColImg  && dv.chek && ( d || tri ) ){
           w+='<button class="gz_chk'+ dv.chekA+ '" style="left:3px;bottom:'+(dv.allowFilter>0 ? 20 : 3)+'px;" id="chAll-'+ dv.id+'"> </button>';
           }
           if (col[h].fr){
           w+='<button class="gz_freeze" id="'+dv.id+'-fz' + nom + '" style="height:'+dv.imW +'px;top:0px;right:0;" title="' + col[h].fr + '"></button>'
           }
              stt+='<div id="'+ dv.id+'-hcol'+nom +'"class="gz_cl ' + dv.id +'-col'+ nom +'" style ="height:' +  (rY1- hei - _padCY) + 'px;top:'+ hei+'px;">' + w + '</div>';

           for (i=0 ; i<grL;i++) if (h==grC[i][4])  slH--
           if (h <= dv.frezC){
               st1+=stt
           } else {
               st2+=stt }
        }
    }
   dv.rY1=rY1;
   dv.rX=rX;
   dv.rX1=rX1
   dv.rX2=rX2
   dv.h1HTML=st1
   dv.h2HTML=st2

}
function addRow(nDataS,j){
   var dv=this,i,dL=dv.dataS.length,ndL,nColImg=dv.nF(dv.colImg),obj,std1,std1,odd,el,p1,p2,t
   for (i=0;i<nDataS.length;i++) dv.dataS.push(nDataS[i])
   std1=std2=''
   ndL=dv.dataS.length

   for (i=dL;i<ndL;i++) {
      if (dv.chek) dv.chek[i]=0
      dv.makeTree(i)
      odd=i%2
      for (t=2,el=j;dv.typG && dv.aTree[el].p!='_R_';el=dv.aTree[el].p) t++
      obj=requeryRow(dv,i,nColImg,t)
      dv.rY+=obj.hei;
      std1+='<div id="h1-'+(p=dv.id+"-"+i+'" class="' +(odd ? 'gz_o' : 'gz_n')+' row-'+ dv.id +'" style="height:' + (obj.hei  ) + 'px;">') + obj.stt1 + '</div>'
      std2+='<div id="h2-'+p+ obj.stt2 + '</div>'
      odd=!odd

   }
   if (dv.typG){
      el=gEl('h1-'+ (t=dv.id+'-'+j))
      p1=apDiv(0,el.parentNode,0,0,'gr-h1-'+ t,el.nextSibling)
      el=gEl('h2-'+ t)
      p2=apDiv(0,el.parentNode,0,0,'gr-h2-'+ t,el.nextSibling)
      gEl("iO-"+t).className='gz_minus'
      dv.aTree[j].o=true
   } else {
      p1=apDiv(0,dv.b1,0,0,0,dv.b1.lastChild)
      p2=apDiv(0,dv.b2,0,0,0,dv.b2.lastChild)   
   }
   p1.innerHTML=std1
   p2.innerHTML=std2    
   p1=p2=el=0
   dv.resize(1)
   requeryCount(dv)
}
function requeryRow(dv,i,nColImg,staLen,oldH){
   var p,t,l,m,k,d,j,hei,stt1,stt2,h,stt,wi,col=dv.columns,tW=(dv.tehColumn ? 20 :0),dat=[],hR=dv.hRow,jImg,imWd,imCell,content='',cSpan=dv.spanFunc && dv.spanFunc(i) || [],l=cSpan.length,
   c,iw=dv.imW,eI={},imw=0,imh,dS=dv.dataS, cellT
   
   if (dv.imFunc) { eI=dv.imFunc(i) ; imw=eI.w || iw }
   imh=';min-height:' + (eI.h  || iw) +'px;'
   for ( j=l;j--;){
      t=cSpan[j]
      for (k=0,m=0,(t[3]={})[t[1]]=1;k < dv.columnCnt && (p=dv.startCol[k][0])!=t[1];k++){
            if (p==t[0]) m=1
            if (m) t[3][p]=1
      }
      for (k=0,m=1; k<dv.columnCnt && m;k++){
         if (t[3][col[k].field]) {
            if (m==1) { m=2; t[4]=k}
         } else if (m==3) {
               m=0;t[5]=k-1
         }
         if (col[k].field==t[2]) { m=3 ; t[6]=k }
      }
      t[5]=def(t[5],dv.columnCnt-1)
   }
 
   for(j=0; j<  dv.columnCnt ; j++)  {
      
     for (k=0;k<l && (j<cSpan[k][4] || j>cSpan[k][5]);k++){ }
     k= k<l ? cSpan[k] : 0
     d={inner:'',css:'',className:'',other:'',cSpan:''}
     if (k)
         if(j!=k[4])  continue
         else {
            c=col[k[6]]
            for (wi=0,m=k[4];m<=k[5];m++) {wi+=col[m].w+ _padCX; d.cSpan+='_'+m}
            d.w=wi
            wi-=_padCX
            d.h=col[j].nom
            d.field=' field="'+c.field +'"'
         }
     else {
        c=col[j]
        wi=d.w=c.w 
        d.h=c.nom
     }      
     h=c.nom; d.i=i
     d.embed=c.embed; d.typ=c.typ;d.tCfg=c.tCfg,d.render=c.render;d.disabled=c.disabled,d.els=c
     if (i==-2){
        
        if (typeof(c.aggr) =='function')  c.aggr.call(dv,d)
        else d.inner= c.aggr=='sum' ? sum(dS,h,c.depend,dv,c) : c.aggr=='avgAll' ? avg(dS,h,1,c.depend,dv,c) : c.aggr=='avg' ? avg(dS,h,0,c.depend,dv,c) : typeof(c.aggr) =='string' ? c.aggr:''
     } else   d.inner=c.HTML 
         || (i!=Und ? 
               (c.depend && dv.dataS[i] ? //  && dv.dataS[i][h]!==Und
                  c.depend.call(dv, dv.dataS[i][h], dv.dataS[i], c, i)
                : 
                  dv.dataS[i][h]
               )  : '')
     dv._contFunc(d)
     if (d.inner==Und) d.inner=''
     if (d.css==Und) d.css=''
     if (c.multiLine) d.inner=d.inner.replace(/\n/g,"<br/>")
     if (hR<=0){
         if (h==nColImg){
              wi-=(( dv.typG  ? staLen*iw :0) + (dv.chek ? iw:0) + imw+ (dv.imFunc || dv.typG || dv.chek ? 2:0))
          }
         cellT= '<div class="gz_cl ' + d.className + '" style="width:' + wi + 'px;'+fl+ d.css + imh +'" ' + d.other + '>'+ d.inner + '</div>';
         if (c.aRender){
             _cEl.className=''
            _cEl.style.width='10000px'
             _cEl.innerHTML=cellT;
             c.aRender(_cEl)
             d.inner=_cEl.firstChild.innerHTML
             cellT=_cEl.innerHTML
         }
         content+=cellT
     }
        dat[j]=d
     if (h==nColImg) jImg=j
   }
   if (!oldH || !(hei=dv.aHei[i])){
      if (hR<=0){
        _cEl.className=''
        _cEl.style.width='10000px'
        _cEl.innerHTML=content;
        hei= _cEl.offsetHeight
      } else hei= hR;
   }
   stt2=stt1='';
   if (i==-2) hei=dv.summary
   if (dv.tehColumn ){
      //                                        на толщину верхнего бордера
     stt1='<div class="gz_tehC" style="'+ah+(hei-1)+'px;"><button class="'+  ( i==dv.selectedRow ? (dv.startEdit==1 || dv.startEdit==2 ? 'gz_editRow': 'gz_selRow') : 'gz_pusto') + '" id="teh-'+ dv.id+"-"+i+'"></button></div>'
   }
   for(j=0; j<  dv.columnCnt ; j++)  {
      imWd=0;imCell='';d=dat[j];
      if (!d) continue
      content=d.inner
      if (j==jImg){
         if (dv.typG  ) {
            imWd+=(staLen)*iw
            imCell+=( dv.aTree[i].c.length>0 || dv.doLoad && !dv.aTree[i].k ? '<button class="'+(dv.aTree[i].o ? 'gz_minus' : 'gz_plus') +'" style="left:'+(imWd-iw) +'px;" id="iO-'+ dv.id+"-"+i+'"></button>':'');
        }
         if (dv.chek ) {
            imCell+='<button class="gz_chk'+dv.chek[i]+'" style="left:'+(imWd) +'px;" id="ch-'+ dv.id+"-"+i+'"> </button>';
            imWd+=iw
         }
         if (eI ) {
         imCell+='<span class="gz_im '+ (eI.cl || '')+'" style="width:' + imw+'px;left:'+(imWd) +'px;'+ (eI.bi ? 'background-image:url(' + eI.bi +');':'')+ imh  +'" id="im-'+ dv.id+"-"+i+'"> </span>';
         imWd+=imw
         }
         if (imWd>0) {
             var content= '<div style="width:' + imWd + 'px;height:'+ (hei -_padCY) + 'px;float:left;">'+ imCell + '</div>' +' <span class="gz_g-'+dv.id+'" cSpan="'+ d.cSpan+'" imWd="'+imWd +'" style="'+abs+'width:' + (d.w -imWd -_rez )+ 'px">'+content+'</span>' ;//-_padCX
         }
          }
       stt='<div' +(d.embed ? ' id='+dv.id+'-embed-'+i+'-'+d.h :'')+ (d.field || '') +' class="gz_cl ' + dv.id +'-col'+ d.h +' ' + d.className + '" style="height:' +  (hei - _padCY) + 'px ;'+  (d.cSpan ? 'width:' + (d.w- _padCX) +'px;': '')  + (hR <=0 ? '' : ovH) + d.css+'"' + d.other+'>' + content + '</div>';
      if ( j<= dv.frezC){
          stt1+=stt
      } else {
          stt2+=stt}
   }
   d=dat=Und
   dv.aHei[i]=hei
   return {'hei':hei,'stt1':stt1,'stt2':stt2}
}
function requeryCount(dv){
   var i,r=dv.countRec,dS=dv.dataS,l=dS.length,d=0,n=dv.selectedRow,p=0,a=0,t,ar=[],s1='',s2=''
   if (dv.status){
      for (i=0;i<l;i++) {
         if (!dS[i].d) {a++ ; if (!dv.dataS[i].f) d++ }
      }  
      if (n!=Und){
         ar=dv.typG==1 ? (t=dv.aTree[n].p)=='_R_' ? dv.aRoot : dv.aTree[t].c : dv.aTree 
         for (i=0,l=ar.length;i<l;i++) {
            if (!dS[t=ar[i]].d && !dv.dataS[t].f) p++ 
            if (t==n) break
         }
      }
      if (a!=d) r=a
      n=gEl(dv.id +'-recCount')
      if(!dv.typG) {s1='<span style="position:relative;top:-1px">'; s2='</span>'}
       n.innerHTML=(dv.typG ?  p : '<input class="gz_curLineNum" id="' + dv.id+'-numRec" value="'+p+'" style="text-align:right;width:'+getN(n.style.width)/2+'px">')+ s1 +' из ' + d + (r==-1 ? '...' : ( r? ' (' + r + ')' : '')) + s2;
      if(!dv.typG){
        _cEl.innerHTML=dv.dataS.length.toString().replace(/\d/g,'5');
        _cEl.style.width='';
        _cEl.className='gz_statusBar'
        n=gEl(dv.id +'-numRec')
        n.style.width=_cEl.offsetWidth+2+'px'
        n.onchange=changeN.bind(dv,n)
      }
   }
}
function changeN(n){
   var j=0,i,el,l=n.value,dv=this
   for (i=0;l && i<dv.aTree.length;i++) {
      j=dv.aTree[i];el=dv.dataS[j]  
      if (!j.d && !j.f) l--
   }  
   selEl_R(dv,j,-1);
}
function requerySummary(dv){
   if (dv.summary){
      var o =requeryRow(dv,-2)
      dv.summary1.innerHTML=o.stt1
      dv.summary2.innerHTML=o.stt2
   }
}
function requeryStatus(dv){
   var s,clO,stO,i,st,r=dv.countRec,lf,sb=dv.statusBar,wi=dv.x,el,ln=dv.dataS.length +'5',q,d=dv.imW+4,h=''
   if (dv.status){
      sb.innerHTML=''
      _cEl.innerHTML=(ln+'из'+ln + (r || dv.allowFilter>0 ? 5555 + (r==-1 || r==Und ? '' : r):'')).toString().replace(/\d/g,'5');
      _cEl.style.width='';
      _cEl.className='gz_statusBar'
      
      apDiv(0,sb,0,fl+'width:' + (lf=_cEl.offsetWidth +10)+ 'px;padding:3px;text-align:right;').id= dv.id +'-recCount'
      s=fl+'cursor:pointer;margin-left:4px;margin-top:3px;'
      if (dv.allowInsert) {
         apDiv(2,sb,'gz_insRow',s,0,0,'Новая запись').onclick=insertClick.bind(dv)
         lf+=d
         if (dv.typG){
            apDiv(2,sb,'gz_insRow1',s,0,0,'Новая подчиненная запись').onclick=insertClick.bind(dv,[],1)
            apDiv(2,sb,'gz_cut',s,0,0,'Вырезать запись').onclick=cutClick.bind(dv)
            lf+=d+d
         }
       }
      if (dv.allowDelete) {
         apDiv(2,sb,'gz_delRow',s,0,0,'Удалить запись').onclick=deleteClick.bind(dv)
         lf+=d
      }
      if (dv.bufS ) {
         el=apDiv(2,sb,'gz_undo',s,0,0,'Отмена')
         el.onclick=tableRevert.bind(dv,0)
         el.ondblclick=tableRevert.bind(dv,1)
         lf+=d
         if (dv.isButSave){
            el=apDiv(2,sb,'gz_save',s,0,0,'Сохранить изменения').onclick=tableUpdate.bind(dv)
            lf+=d
         }
      }
      el=apDiv(0,sb,0,rel +ovH+'padding:3px;height:' + dv.status+'px;')
      el.id=dv.id+'-statusText'
      el.innerHTML=dv.statusText || ''
      _cEl.parentNode.style.width=0
      requeryCount(dv)
   }
}
function resize(mode){ // mode - 1 scroll, 2 - head, 3-requery
   var maxW=0,h1,w1,st1,h,w,nColImg,p,i,j,ss,scrollX,scrollY,xs,x16,y16,x=0,y,maxR,s,dv=this,tW=(dv.tehColumn ? 20 :0),scrY=dv.scrY,sty=dv.style,z=fl+ ovH +'height:',sw=dv.status+dv.summary,fZ=(~dv.frezC ? 2 : 0),disp=sty.display,col=dv.columns, cS
   if (!dv.hd) return // ИЕ window.resize
   
   if (dv.wProc>0 && mode >1 ||dv.spanFunc){
    if ( dv.hRow>0 && mode >2) mode=2
   } else mode=1
   for(s=0; s< col.length && col[s].wid; s++) {
        if (col[s].wid.toString().indexOf('%')<0 )  {
          x+=parseInt(col[s].wid)+_padCX;
        }  else maxW+=col[s].maxX+_padCX
   }
    dv.wNum =x 
    if (maxW) dv.style.maxWidth=(x+maxW + tW + _scrollW + fZ) + 'px'
   if (mode==3) {
       dv.requery(scrY,1)
       if (dv.selR1){
          dv.selR1=dv.selR2=null
          selEl(dv,dv.selectedRow,-1,1)
       }
   }else {
      if (mode==2) {
         x=( dv.wProc ? widthCont(dv): dv.rX+(dv.scrollX ? _scrollW :0))
         head(dv,x )
         dv.h1.innerHTML=dv.h1HTML;
         dv.h2.innerHTML=dv.h2HTML;
         dv.triger('headRequery')
      }
   
      sty.display='none'
      x=widthCont(dv);y=parseInt(dv.style.height)|| dv.classY ||0 
      if (_operaM) {x=0;y=0;dv.style.height='';dv.style.width=''}
    
      if (x>0 && x <dv.rX1+sw  ) x =dv.rX1+sw 
      if (y>0 && y <dv.rY1+sw  ) y =dv.rY1+sw 
      maxR=parseInt(sty.maxWidth); if(maxR && (dv.rX>maxR || x)) x= ( x ? (maxR<x ? maxR :x)  :maxR)
      maxR=parseInt(sty.maxHeight);if(maxR && (dv.rY>maxR || y)) y= ( y ? (maxR<y ? maxR :y)  :maxR)
      maxR=parseInt(sty.minWidth); if(maxR && (dv.rX<maxR || x)) x= ( x ? (maxR>x ? maxR : x)  :maxR)
      maxR=parseInt(sty.minHeight);if(maxR && (dv.rY<maxR || y)) y= ( y ? (maxR>y ? maxR : y)  :maxR)

      dv.scrollX=scrollX=!(!x || (dv.rX<=  x -_scrollW) || ((dv.rX <= x) && (dv.rY<= y || !y) && !scrY))
      x16=(scrollX ? _scrollW  :0)
      dv.scrollY=scrollY=scrY || y && !((dv.rY<= y -_scrollW)||((dv.rY <= y) && (dv.rX <= x || !x )))
      y16=(scrollY ? _scrollW  :0)  
      
      if (!x) x=(dv.rX + y16 )
      else if (dv.scrollY && !scrollY && !( dv.scrollX && scrollX) ) x-=_scrollW
      dv.x=x
      ss=dv.style.height=='' && dv.style.maxHeight!='' && (parseInt(dv.style.maxHeight)>dv.rY+x16)
      xs=(scrollY ? _scrW :0 )
      h1=y-dv.rY1-sw-x16; if(h1<0) h1=0
      w1=x- dv.rX1-fZ- y16 ; if(w1<0) w1=0 ; w1="px;width:"+w1+"px;"+ (~dv.frezC ? "border-left:2px solid #C7D4F2;" :"")
      
      cSS(dv.hd,ovH +'height:'+dv.rY1+ "px;width:" + x +'px;')
      cSS(dv.h1,z+dv.rY1+ "px;width:" + dv.rX1 + "px;")
      cSS(dv.h2,z+dv.rY1+ w1)
      cSS(dv.h3,z+(scrollY ? dv.rY1 :0)+ "px;width:" + y16+ "px;")
      cSS(dv.bd0,rel+ ovH +'height:'+(!y? '' : h1)+"px;width:" + (x - xs + 1) +"px;")
      cSS(dv.bd,rel+ ovH+(scrollY && !ss  ? 'overflow-y:scroll' : '') +';height:'+(!y? '' : h1)+"px;width:" + (x+100) +"px;")
      if (dv.rY-dv.rY1-sw) cSS(dv.empNote,'display:none')
      else {
         cSS(dv.empNote,fl+"width:" + (x - xs)+ "px;height:20px")
         dv.empNote.innerHTML = (dv.dataS.length-dv.del) ? dv.noDataF : dv.noData
      }
      cSS(dv.b1,fl+"width:" + dv.rX1+ "px;")
      cSS(dv.b20,fl+ovH +'height:'+(dv.rY-dv.rY1-sw)+w1)
      cSS(dv.b2,fl+ovH+'overflow-x:scroll;width:'+( x-dv.rX1-fZ -y16)+'px')
      cSS(dv.b3,z+ x16 + "px;width:" + (x - y16) +"px;")
      
      cSS(dv.scX,ovH+"right:0;clear:both;width:" + (scrollX ? x - dv.rX1 - y16 + 1 : 0) + "px;" +ah+ x16 + "px")
      

      cSS(dv.hover,ah+"0;width:"+ Math.min(( x- y16-tW),dv.rX)+ "px;left:"+tW+"px;")

      // cSS(dv.scY,ovH+ah+(scrollY ? y-sw-dv.rY1 - x16 + 1: 0) + "px;width:" + y16 + "px;top:"+(dv.rY1+dv.pY1) +'px;left:'+(dv.pX1+x - y16)+'px')
      cSS(dv.scY,ovH+ah+(scrollY ? ((y || dv.rY) - sw - dv.rY1 - x16) : 0) + "px;width:" + y16 + "px;top:"+(dv.rY1+dv.pY1) +'px;left:'+(dv.pX1+x - y16)+'px')
      
      dv.summaryB.width= x +'px'
      cSS(dv.summary1,z+dv.summary+ "px;width:" + dv.rX1+ "px;")
      cSS(dv.summary2,z+dv.summary+ w1)

      sty.display=sty.width ? disp : 'inline-block'
      if (sty.display=='none')  sty.display='block'
     
      if ((dv.typG || dv.chek )) { // для img столбца пересчет ширины span
         p=dv.bd.getElementsByTagName('span')
         nColImg=dv.nFO(dv.colImg)
         for (i=0,j=p.length; i<j;i++)
            if((w=p[i]).className=='gz_g-'+dv.id){
               if (h=w.getAttribute('imwd')) {
                  if (cS=w.getAttribute('cSpan'))
                     for (st1=0,s=cS.split('_'),ss=1;ss<s.length;ss++) 
                        st1+=col[s[ss]].w+ (ss==1 ? 0 : _padCX)
                   else st1=col[nColImg].w
                  w.style.width= ((st1=st1 -2-parseInt(h))>0 ? st1 : 0) +'px'
               }
            }
     }
      
   }
   y=dv.b2.offsetHeight-_scrW
   if (y>0) dv.b20.style.height=y + 'px'
   resizeScroll(dv)

   
}
function resizeScroll(dv,nX,nY){
   var b=dv.bd,h2=dv.h2,b2=dv.b2,x=dv.rX2,y=b.scrollHeight,w=h2.offsetWidth,h=b.offsetHeight,sT=b.scrollTop,sL=h2.scrollLeft
   if (!nY) {
      cSS(dv.scrYP,fl+"top:"+ Math.min(parseInt(h/ y * sT),h-10) + "px;height:" + Math.max(10,(h*h / y)>>0)+ "px;width:" + (_scrollW-3) + "px;display:"+(h==y ? 'none' : ''))
      if (sT>=y-h)  dv.triger('endRow')
   }  
   if (!nX) cSS(dv.scrXP,fl+"left:"+ parseInt(w/ x * sL) + "px;width:" + Math.max(10,(w*w / x)>>0)+ "px;height:" +(_scrollW-3) + "px;display:"+(w==x ? 'none' : ''))
}
function widthCont(dv){
   var el,OP,sty=dv.style,rX,x,stw=parseInt(sty.width),stmw=parseInt(sty.maxWidth),disp=sty.display
   rX=(dv.rX + ( dv.scrollY || dv.scrY ? _scrollW :0)) || Infinity
   if (dv.statusBar) dv.statusBar.style.display='none'
   if (!stw && !stmw ) {
         sty.display='block'
         OP=dv
         while (!x || x<4){
            while (OP.offsetWidth-dv.pX <=4 ) OP=OP.parentNode
            el=apDiv(0,OP)
            x=el.offsetWidth-(OP==dv ? 0 : dv.pX )
            OP.removeChild(el)
            OP=OP.parentNode
         }
         dv.widhCont=x
         sty.display=disp
   } else  x= stw || stmw
if (dv.statusBar)    dv.statusBar.style.display='block'
   if (!dv.wProc) {
      if ( x>rX ) { x=rX ; dv.style.width=''
      } else if (stw) x=Math.min(stw,( stmw || Infinity))
   }
   return x
}
function requery(scrY,resize,noBody){
   var x,h,i=0,del,tek,w,odd,sta,k,t4,t3,t2,t1,dv=this,nColImg=dv.nF(dv.colImg),col=dv.columns,p,scrollP=[],sty=dv.style,oldH, std1= (noBody ? dv.b1.innerHTML :''), std2= (noBody ? dv.b2.innerHTML :''), el=dv
   
   if ((el.doLoad=el.evFunc['doLoad']) && !el.typG ){
         el.evFunc['endRow']=function(){
            var dv=this
            dv.doLoad(dv,dv.dataS.length,function(dv,i,dS){
               if (dS!=-1){
                  if (dS.length) dv.addRow(dS)
                  else dv.evFunc['endRow']=0
               } 
            })
         }
      }

   if (dv.oldhRow!=dv.hRow) dv.aHei=[]
   dv.oldhRow=dv.hRow
   if (scrY!=Und) dv.scrY=scrY
    t1=t2 =0;
    dv.startEdit=0
    for(h=0; h< col.length && col[h].vis!=2; h++) {
        if (col[h].wid.toString().indexOf('%') > 0)  {
       t1+=parseInt(col[h].wid);
       dv.lastProc=h
        } else t2+=parseInt(col[h].wid)+_padCX;
        }
    dv.wProc=t1;dv.wNum=t2;
    dv.columnCnt=h;

   for(p=dv.parentNode; p && p.scrollTop!=Und;p=p.parentNode) scrollP[i++]={'el':p,'X':p.scrollLeft,'Y':p.scrollTop}

   h=sty.cssText
   sty.minWidth= sty.minHeight=sty.height=sty.width=''
   dv.innerHTML='<div></div>'
   t4=dv.firstChild
   dv.pX=t2=dv.offsetWidth-t4.offsetWidth
   sty.paddingLeft=0
   dv.pX1=t3=t2-dv.offsetWidth+t4.offsetWidth
   sty.borderLeft=0
   dv.pX1b=t3+t3+dv.offsetWidth-t4.offsetWidth-t2

   sty.height=0
   t2=dv.offsetHeight
   dv.pY=t2=dv.offsetHeight-t4.offsetHeight
   sty.paddingTop=0
   dv.pY1=t3=t2-dv.offsetHeight+t4.offsetHeight
   sty.borderTop=0
   dv.pY1b=t2-dv.offsetHeight+t4.offsetHeight

   sty.height=''
   if (t2!=dv.offsetHeight) dv.classY=dv.offsetHeight-dv.pY+ dv.pY1b

   sty.cssText=h

   dv.innerHTML=''
   x=widthCont(dv)
   //head
   head(dv,x,(resize ? 0 :1))
   if (dv.x==x ) oldH=1


    //заполнение таблы
    if (!noBody){
    dv.rY=dv.rY1
    odd=0;
    sta=[]
    if (dv.typG){
        sta[0]=[dv.aRoot,0]
        i=dv.aRoot[0]
    } else {
       i=dv.aTree[0]
       t3=0
    }
    h=1
    if (t4=dv.dataS.length)
        while (true && i!=Und) {
           t1=requeryRow(dv,i,nColImg,h,oldH)
            del=dv.dataS[i].d || dv.dataS[i].f 
            dv.rY+=del ? 0 : t1.hei;
            std1+='<div id="h1-'+(p=dv.id+"-"+i+'" class="' +(odd ? 'gz_o' : 'gz_n')+' row-'+ dv.id +'" style="height:' + (t1.hei  ) + 'px;' + (del ? 'display:none;' : '') + '">') + t1.stt1 + '</div>'
            std2+='<div id="h2-'+p+ t1.stt2 + '</div>'
            if (dv.typG ){
               tek=sta[h-1]
               if (dv.aTree[i].c.length>0) {
                   sta[h++]=[dv.aTree[i].c,0]
                   std1+='<div id="gr-h1-'+(p=dv.id+"-"+i+'" style="display:'+ (dv.aTree[i].o && !del ? 'block' : 'none') +';" >')
                   std2+='<div id="gr-h2-'+ p
                   i=dv.aTree[i].c[0];
               } else {
                   tek[1]++
                   while (tek[1]>=tek[0].length) {
                       sta.pop();h--
                       std1+='</div>';
                       std2+='</div>';
                       if (!h) break
                       tek=sta[h-1]
                       tek[1]++
                   }
                   if (!h) break;
                   i=tek[0][tek[1]]
               }
            } else {
                t3++
                i=dv.aTree[t3]
                if (t3>=t4) break          
            }
            odd=!odd
         }
   }  
   dv.onmouseout=function(){this.hover.style.height=0}      
   dv.rY+=dv.status+dv.summary
   if (_err==1) dv.typG=!dv.typG
   dv.hd=t1= apDiv(0,dv,"gz_hd")
   dv.h1=t3=apDiv(0,t1,0)
   t3.innerHTML=dv.h1HTML;
   dv.h2=t3=apDiv(0,t1,0)
   t3.innerHTML=dv.h2HTML;
   dv.h3=apDiv(0,t1,"gz_scroll")
   if (dv.setting ) apDiv(2,dv,'gz_settings','top:0;right:0;').onclick=metaGet.bind(dv)  
   if (dv.importExcel) {
      t3=apDiv(6,dv,'gz_excel','top:16px;right:0;')
      t3.download='Выгрузка.xls'
      t3.target='_blank'
      t3.onclick=dv.evFunc['excelFunc'] || function(){ excel.call(this,dv)} 
   }     
   if (dv.evFunc['help']) {
      apDiv(2,dv,'gz_help','top:' + (dv.allowFilter!=-1 ? '20px' : '0') + ';left:0;',0,0,'Помощь').onclick=dv.evFunc['help'].bind(dv)
   }
   if (dv.allowFilter!=-1){
      dv.bFilter=t2=apDiv(2,dv,(dv.allowFilter==2 ? 'gz_searh': 'gz_filter'),'top:1px;left:1px',0,0,'Применить фильтр/поиск')
      t2.onclick=function(){ var f,dv=this
         if (dv.bFilter.style.top=='1px'  ) {
            dv.allowFilter=dv.allowFilter==2 ? 0 : dv.allowFilter+1
            dv.bFilter.className=dv.allowFilter==2 ? 'gz_searh': 'gz_filter'
            dv.requery(Und)
            return
         }                  
         flush.call(dv)
         dv.filterApply(dv.aFilter,1)
      }.bind(dv)  
   }
   
   if (_err!=2) t1.onclick=sortClick.bind(dv)
   t1.onmousemove=cursorHead.bind(dv)
   //t1.onpointerdown=
   t1.onmousedown=dragStart.bind(dv)
   dv.bd0=t1= apDiv(0,dv,'gz_bd0') ;
   dv.bd=t1= apDiv(0,t1,'gz_bd') ;
   if (!_iphon) t1.onmouseover=hover.bind(dv)
   t1.onclick=selectEl.bind(dv)
   t1.ondblclick=dblC.bind(dv)
   t1.onscroll= scrollY.bind(dv);
   t1.onmousedown=function(e){e=e || window.event
      if (e.shiftKey &&  this.startEdit<2){ stopEv(e); return false }
   }.bind(dv)
   
   t1=apDiv(0,t1,'',fl+'background:#fff;clear:left;')
   dv.empNote=apDiv(0,t1,"gzEmpNote")
      
   dv.hover=apDiv(0,t1,"gz_hover")
   dv.b1=t3=apDiv(0,t1,'gz_b1',0);
   t3.innerHTML=std1 ; 
   dv.b20=t1 =apDiv(0,t1,'gz_b20');
   dv.b2=t2 =apDiv(0,t1,'gz_b2');
  
   t2.innerHTML= std2;
   t2.onscroll= scrollX.bind(dv);
  
   dv.selA1=apDiv(0,t3,"gz_selArea",abs,0,t3.firstChild)
   dv.selA2=apDiv(0,t2,"gz_selArea",abs,0,t2.firstChild)   

   dv.editE1=t1=apDiv(0,t3,"gz_editDiv")
   dv.editE2=t4=apDiv(0,t2,"gz_editDiv")
   t1.onmouseover=t4.onmouseover=function (){dv.hover.style.height='0'}
 

   dv.scY=t1=apDiv(0,dv,"gz_scr")
   t1.onclick=pgY
   dv.scrYP=t1=apDiv(0,t1,"gz_scrP")
   //t1.onpointerdown=
   t1.onmousedown=t1.ontouchstart=fsY.bind(dv)
   dv.summaryB=t1=apDiv(0,dv,"gz_summary",rel+ovH+'height:'+dv.summary+"px;clear:both;display:"+(dv.summary ? 'block;' :'none;'))
   dv.summary1=apDiv(0,t1)
   dv.summary2=apDiv(0,t1)  
  
   dv.b3=apDiv(0,dv,"gz_scroll")
   dv.scX=t1=apDiv(0,dv.b3,"gz_scr")
   t1.onclick=pgX
   dv.scrXP=t1=apDiv(0,t1,"gz_scrP")
   //t1.onpointerdown=
   t1.ontouchstart=t1.onmousedown=fsX.bind(dv)
   
   
   dv.statusBar=apDiv(0,dv,"gz_statusBar",rel+ovH+'height:'+dv.status+"px;clear:both;display:"+(dv.status ? 'block;' :'none;'))

   if (dv.resizable) {
      t1=apDiv(2,dv,'gz_resize','cursor:nw-resize;bottom:0;right:0;')
      //t1.onpointerdown= 
      t1.ontouchstart=t1.onmousedown=resF.bind(dv)
   }
   dv.ta=apDiv(2,dv,0,ah+"1px;top:0;left:0;width:1px;border:0;padding:0;margin:0;opacity:0.01;-moz-opacity:0.01;-webkit-opacity:0.01;")

//dv.ta.onpaste=function(){setTimeout(pars.bind(dv.ta),1)}
   dv.onkeydown=keyDown

  
   if (dv.status) {
      requeryStatus(dv)
   }
    if (dv.summary) {
      requerySummary(dv)
   }
   dv.resize(1,x)
   requerySort(dv,dv.aSort)
   for(p=scrollP.length; p ; p--) {
       t2=scrollP[p-1]; t1=t2.el; t1.scrollLeft=t2.X; t1.scrollTop=t2.Y
   }
   if (dv.selectedRow!=Und ) {

     selEl(dv,dv.selectedRow,-1,1)
   }
   dv.chEL = gEl('chAll-'+ dv.id)
   dv.triger('refreshHead')
   
   t1=t3=t2=std1=std2=dv.h1HTML=dv.h2HTML=Und
}
function makeTree(nStr,sOpen){ // nStr - задается если необходимо вставить один элемент
    var open=[],h,i,j,k,aComp,r,u,nId,nParent,id,pr,res,aTree,aRoot,maxL,nStr,dv=this,know=dv.know || -1,col=dv.columns,keyFields=[],dS=dv.dataS,dL=dS.length

   for (i=dv.aSort.length;i--;)
      if ((k=dv.nFC(r=dv.aSort[i][0])).isHTML) 
         for (j=0;j<dL;j++ ) dS[j]['H'+r]=toText(dS[j][k.nom]) 

    if (sOpen) for (i=0;i<dL && dv.aTree[i];i++) open[i]=dv.aTree[i].o  
    nStr=def(nStr,-1)
    if (nStr==-1 || !dv.typG){
       if (dv.editable) createEditEl(dv)
     dv.aTree=[]; dv.aRoot=[]; dv.maxL=0
    }
    aTree=dv.aTree; aRoot=dv.aRoot; maxL=dv.maxL;
    if (dv.typG){
       nParent=dv.nF(dv.fldParent);
       nId=_err ==3 ? 4 : dv.nF(dv.fldId)
       for (i=(nStr>-1 ? nStr :0); (nStr>-1 ? i==nStr : i<dL) ; i++){
           id=dS[i][nId];
           pr=dS[i][nParent];
           if (!aTree[i]) aTree[i]={}
           aTree[i]={'c':(aTree[i].c ||[]),'l':(aTree[i].l || 0),'o':open[i],k:(dS[i][know]==1 ? 1 :0)}
           for (j=0; j<dL && dS[j][nId]!=pr; j++){}
           if (j!=dL && pr ){ //если найден родитель
               aTree[i].p=j
               if (!aTree[j]) aTree[j]={}
               aTree[j].c=aTree[j].c||[]
               aComp=aTree[j].c

               u=(aTree[i].l||0)+1;
               while (u>(aTree[j].l ||0) ){
                   aTree[j].l=u;
                  maxL=(maxL>u ? maxL : u);
                  u++;

                  // контроль зацикливания
                  if ((aTree[j].p==i)){
                     aTree[i].c.splice(aTree[i].c.indexOf(j),1) 
                     aTree[j].p='_R_'
                     aRoot.push(j)
                     dv.errFunc(dv,'cycle', id)
                     break
                  }

                  if ((aTree[j].p==Und) || (aTree[j].p=='_R_')) break;
                   j=aTree[j].p;
              }
           } else{
               aComp=aRoot;
               aTree[i].p='_R_'
           }
           if (!(dS[i].d )) //|| dS[i].f)) 
           if (aComp.length==0 || nStr>-1) { aComp.push(i)}
           else {
               res=-1
               for ( k = 0; k < aComp.length && res==-1 ;k++){
                   res =sortF.call(dv,dS[aComp[k]],dS[i],aComp[k],i)
               }
               if (res==-1) {aComp.push(i)}
               else { aComp.splice(k-1,0,i)}
           }
       }
       dv.aTree=aTree;
       dv.maxL=_err ==4 ? 1 : maxL;
       dv.aRoot=aRoot
  } else {
       for (var i= 0 ; i<dL;i++) dv.aTree[i]=i ;
       if(nStr==-1 && dv.aSort &&  dv.aSort.length)  dv.aTree.sort(sortF.bind(dv))
  }
  if (nStr==-1) dv.selC=dv.selectedRow=dv.selR1=dv.selR2=Und;

}

function op(iEl,dv,ins){
   var i=numbI(iEl.id,'-'),j
    function f(dv,iEl){
      var q,iO,sE,sR,oH,oT,st
      function callB(dv,i,aData){
         if (aData!=-1) {
            dv.aTree[i].k=dv.dataS[i][dv.know]=1
            if (aData.length) dv.addRow(aData,i)
            else  dv.updRow(i,[])
         }
      }
      if (!dv.aTree[i].c.length){
         dv.doLoad(dv,i,callB)
         return
      }
      iO=!dv.aTree[i].o
      q= iEl.id.substr(2)
      sR=gEl('gr-h2'+q)
      oH=sR.offsetHeight,oT=sR.offsetTop
      iEl.className= (iO ? 'gz_minus' :'gz_plus' );
      st = iO ? 'block' :'none'
      if(!ins && typeof(_yupAnimateBlock)!='undefined') {
        _yupAnimateBlock([sR,gEl('gr-h1'+q)], st, dv, _scrW, function () {
            resizeScroll(dv,1)
        })
      } else { 
        // по старинке без анимации
        sR.style.display=st
        gEl('gr-h1'+q).style.display=st
        dv.b20.style.height=dv.b2.offsetHeight-_scrW+'px'
        resizeScroll(dv,1)
      } 
      dv.aTree[i].o= iO
      delSelA(dv)
      if ( dv.startEdit>1) endEditCell(dv) // !!! под вопросом убирала выделение ячейки без декоратора, если наживался + или -
    }
    if ((j=dv.selectedRow)!=Und && j!=i){
      for (;j!=i && j!='_R_';j=dv.aTree[j].p){ }
      if (i==j) {
         if (dv.startEdit) {
            f=decorEditCell(decorEditRow(f))
         }
         if (f(dv,iEl)!='err') dv.unSel()
         return
      }
   }
    f(dv,iEl)
}
function treeDown (dv,i,nFun,par1){
   var sta=[],aTree=dv.aTree,l=0,n=par1.length
    if (dv.typG){
      sta[l++]=[aTree[i].c,0]
      while (true){
         if (nFun==1) chekSet(dv,i,par1)
         else if (nFun==2 && inArray(i,par1)==-1) par1[n++]=i
         tek=_err ==5 ? 8 :  sta[l-1]
          if (aTree[i].c.length>0) {
              sta[l++]=[aTree[i].c,0]
              i=aTree[i].c[0];
          } else {
              tek[1]++
              while (tek[1]>=tek[0].length) {
                  sta.pop();l--
                  if (!l) break
                  tek=sta[l-1]
                  tek[1]++
              }
              if (!l) break;
              i=tek[0][tek[1]]
         }
      }
    } else {
      if (nFun==1) chekSet(dv,i,par1)
         else if (nFun==2 ) if(inArray(i,par1)==-1) par1[n++]=i
    }
}

function cheked(iEl,st){
   var n,j,i,c,l,a,iOld,dv=this,u=dv.checkParent,d=dv.checkChild,tri=dv.checkTristate,cl=dv.chek.length
   iOld=(n=iEl.id) ? numbI(iEl.id,'-') : iEl;
   if (n){
     // dv.openNode(iOld)
      c=dv.chek[iOld];
      c= def(st,( c==0 ? 1 :0))
   }  else  dv.chek[iOld]=(c=st)
      
   
   if (!dv.typG || !(u  || tri || d)) chekSet(dv,iOld,c)
   if ( u &&  !tri  && dv.typG){
      i=iOld
      while (i!='_R_'){
         chekSet(dv,i,c)
         i=dv.aTree[i].p
      }
   }
   if (dv.typG && ( d || tri)   )    {
   treeDown (dv,iOld,1,c)
   }
   if ( tri ) {
      i=iOld
      if ( dv.typG){
         while (true){
            i=dv.aTree[i].p
            if (i=='_R_') break
            if (c!=2){
               for ( j = 0,l=(a=dv.aTree[i].c).length; j<l  && dv.chek[a[j]] == c ;j++) {}
               if (j<l ) c=2
            }
            chekSet(dv,i,c)
         }
      }
   }
   if ( dv.isHead && (d || tri)){
      for (i=0; i<cl && (dv.chek[i]==c || dv.dataS[i].d || dv.dataS[i].f); i++ ){}
      c= (i==cl ? c :2)
      dv.chekA=c;
      if (n) dv.chEL.className= "gz_chk"+ c
   }
   if (n) dv.triger('check',[c,iOld]);
}
function chekSet(dv,i,st){
    var el= gEl('ch-'+ dv.id+"-"+i)
    if (el) el.className="gz_chk"+st 
    dv.chek[i]=st;
}
function chkAll(dv,el){
     var i,st
     st=(dv.chekA==0? 1 :0)
     dv.chekA=st
     el.className="gz_chk"+st ;
     for (i=dv.chek.length ; i--;) {
      chekSet(dv,i,st)
     }
     dv.triger('checkall',[st]);
     dv.triger('check',[st]);
 }
 
function nextL(dv,t,i,del,op){ // t - 1вверх -1 - вниз, del-при удалении, op - 1 если надо заходить внутрь закрытых
   var j,p,aT=dv.aTree
   function sib(dv,i,n){
      var p,j,aR=dv.aTree
        aR=aR[i].p=='_R_' ? dv.aRoot : aR[aR[i].p].c
        j=aR[inArray(i,aR)+n]
      return j 
   }
   while(1) {
   if (dv.typG){
      if (t==1){
          j=(!del && (p=aT[i]).c.length && (op || p.o)  )?  p.c[0] :Und
          for (; j===Und && i!='_R_'; i=aT[i].p)  j=sib(dv,i,t)
      } else {
          j=_err ==6 ? t :  sib(dv,i,t)
          if (j==Und) j= (j=aT[i].p) =='_R_' ? Und :j 
          else while ((op || aT[j].o)  && (p=aT[j].c.length)) j=aT[j].c[p+t]
      }
      if (j!==Und && i!=j &&  (dv.dataS[j].d || dv.dataS[j].f)) {
         i=j; continue
      }
   } else {
      for(p=inArray(i,aT)+t;(j=aT[p])!==Und && ( dv.dataS[j].d || dv.dataS[j].f) ;p+=t){}
   }
   return j
   }
}

function updRow(row,aData){
   var rObj,rEl1,rEl2,i=row,staLen =0,dv=this
   
   // сброс кэша вычисляемых полей здесь (при изменении полей, при установке через setFVal)
   $(dv).data(Plugin).calcCache[row] = null

   if ( dv.typG){
      staLen=1;
      while (dv.aTree[i].p!='_R_') {
         staLen++
         i=dv.aTree[i].p
      }
   }
   for (i=0; i<aData.length;i++) if(aData[i]!=Und) dv.dataS[row][i]=aData[i]

   rObj=requeryRow(dv,row,dv.nF(dv.colImg),staLen)
   rEl1= gEl('h1-'+dv.id+'-'+row)
   rEl2= gEl('h2-'+dv.id+'-'+row)

   dv.rY=dv.rY -(parseInt(rEl1.style.height)||0) + rObj.hei


   rEl1.innerHTML=rObj.stt1
   rEl2.innerHTML=rObj.stt2
   dv.triger('refreshRow',[i]);
   if (rEl1.style.height!= rObj.hei +'px'){
      rEl2.style.height=rEl1.style.height= rObj.hei +'px'
      dv.resize(1)
   }
   requerySummary(dv)
}
function insRow(dv,aData){
   var insGr,arr,j,i,i1,i2,nn,lastEl,el1,el2,row,appC,appEl1,appEl2,rEl1,rEl2,child,odd,t,e1,e2
   i=dv.dataS.length
   dv.dataS[i]=[];
   if (!dv.aEdit) dv.aEdit=[]

   for (j=0; j<aData.length;j++)
      if(aData[j]!=Und){
         dv.aEdit[j]=dv.dataS[i][j]=aData[j]
      }
   odd='row-'+ dv.id+ (i%2 ? ' gz_o' : ' gz_n') 
   if (dv.typG) {
      dv.makeTree(i)
      i1=dv.aTree[i].p
      appEl1=gEl('gr-h1-' + dv.id+'-'+i1);
      if (appEl1){ // если есть группа у родителя
         appEl2=gEl('gr-h2-' + dv.id+'-'+i1);
         arr=dv.aTree[i1].c
         nn=i
      } else {
         // надо вставить группу
         if (i1!='_R_') { i2= dv.aTree[i1].p ;  insGr=1}
         if (i1=='_R_' || i2=='_R_'){
            appEl1=dv.b1;  // сам элемент или группа в корне
            appEl2= _err ==7 ? dv.b1 : dv.b2;
            arr=dv.aRoot;
         } else {
            appEl1=gEl('gr-h1-' + (t=dv.id+'-'+i2)); // не в корне
            appEl2=gEl('gr-h2-' + t);
            arr=dv.aTree[i2].c
         }
         nn=(i1=='_R_' ? i :i1)
      }

      lastEl=arr[arr.length-1]
      if (lastEl==i || lastEl==i1)  {
         if (appEl1==dv.b1){
            rEl1= appEl1.lastChild //dv.summary1
            rEl2= appEl2.lastChild //dv.summary2
         } else appC=1;
      } else {
         j=arr[inArray(nn,arr)+1]
         rEl1= gEl('h1-'+(t=dv.id+'-'+j))
         rEl2= gEl('h2-'+t)
      }
      if (insGr){
         t='-'+dv.id+'-'+nn;j='display:none'
         appEl1=apDiv(0,appC ? gEl('h1'+ t).parentNode :appEl1 ,0,j,'gr-h1'+t,appC ? 0 : rEl1); 
         appEl2=apDiv(0,appC ? gEl('h2'+ t).parentNode :appEl2 ,0,j,'gr-h2'+t,appC ? 0 : rEl2); 
      
         dv.updRow(i1,[])
         appC=1
      }

   } else {
       appEl1=dv.b1
       appEl2=dv.b2
       appC=1
       dv.aTree[i]=i
   }
   if (dv.chek) dv.chek[i]=0
   if (appEl1==dv.b1){
            rEl1= appEl1.lastChild //dv.summary1
            rEl2= appEl2.lastChild //dv.summary2
            appC=0
   }
   t=dv.id+'-'+i;
   e1=apDiv(0,appEl1,odd,0,'h1-'+t,appC ? 0 : rEl1) 
   e2=apDiv(0,appEl2,odd,0,'h2-'+t,appC ? 0 : rEl2) 
   dv.updRow(i,aData)
   if(/^10*$/.test(i+1)) requeryStatus(dv)
   return i
}
function insertClick(dat,t){
   var i,cl,el,dv=this,col=dv.columns,aData=[],elPar,nCol,par,gU=gridZ.dateU,sRow=dv.selectedRow
   function callB(dv,aData){
      var i,sr=dv.selectedRow

      if (dv.typG && sr!=Und){
         if (!dv.aTree[sr].c.length && !dv.aTree[sr].k) {
            elPar=gEl('iO-'+dv.id+'-'+sr)
            if (elPar) op(elPar,dv)
         }
         i=dv.insRow(dv,aData)
         dv.aTree[sr].o=0
         elPar=gEl('iO-'+dv.id+'-'+sr)
         if (elPar) op(elPar,dv,1)
      } else i=dv.insRow(dv,aData)
      dv.bufS=dv.inserting=dv.startEdit=1
      selEl(dv,i,-3)
      requeryStatus(dv)
      if (dv.tehColumn) gEl('teh-'+ dv.id+'-'+i).className= 'gz_editRow'
   }

   if ( dv.typG){
      par=dv.nF(dv.fldParent)
      if (sRow!=Und) aData[par]=!t ? dv.dataS[sRow][par] : dv.dataS[sRow][dv.nF(dv.fldId)]   }
   if (dv.cut==Und){
      for (i=0,cl=col.length;i<cl;i++){
        if (aData[col[i].nom]==Und){
          if (col[i].ai) aData[col[i].nom]='_aI-'+(iv++)
          if ((col[i].def!=Und || col[i].fr))
              aData[col[i].nom]=def(col[i].def,col[i].fr);
          }
        }
      if (dat){
         for (i=0,cl=dat.length;i<cl;i++){
            if (dat[i]!=Und) aData[i]=dat[i]
         }
      }
      if (dv.evFunc['insert']){ dv.triger('insert',[dv,dv.selectedRow,aData,callB,t])
      } else  callB(dv,aData)    
   } else {
      if (sRow==Und) {  t=0; sRow=dv.aRoot[0]}
      if (i!=dv.cut){
         for (i=sRow;i!=dv.cut && i!='_R_';i=dv.aTree[i].p){}
         if (i==dv.cut) {alert ('Нельзя создать циклическую вставку');return}
         dv.aTree[sRow].o=0
         dv.aHei=[];
         el=gEl('iO-'+dv.id+'-'+sRow)
         if (el) op(el,dv)
         
         dv.selectedRow=dv.cut
         dv.aEdit[par]=dv.dataS[dv.cut][par]
         dv.dataS[dv.cut][par]=aData[par]
         dv.bufS=dv.startEdit=1
         //selEl(dv,dv.cut,-1)
      }
      f=decorEditRow(function(dv){
         if (sRow!=Und) dv.aTree[sRow].o=1
         restoreState(dv,1)
         selEl(dv,dv.cut,-1)
         dv.cut=Und
      })(dv)

   }
}
function deleting(dv,st,aDel,i,noEv){
   var nx=i,j ,el,se,selC,edEl,nom=dv.selC
   dv.busy=0
   if (st==2) {
     se=gridZ.dateU[dv.id];
     for(nx=se[i=se.length-1].data;~i && se[i].data==nx && se[i].act=='d'; i--) se.pop()
     if (i<0 ){
         dv.bufS=0
         requeryStatus(dv)
      }
     return
   }
   nx=def(nextL(dv,1,nx,1),nextL(dv,-1,nx))
   el=gEl('h1-' + dv.id +'-' + i)
   if (dv.typG && dv.aTree[i].c.length && !dv.aTree[i].o) op(el,dv)
   el.style.display='none';
   if (el=gEl('gr-h2-' + dv.id +'-' + i)) {
      gEl('gr-h1-' + dv.id +'-' + i).style.display=el.style.display='none'
   }
   el=gEl('h2-' + dv.id +'-' + i)
   el.style.display='none';
   if (dv.startEdit>1){
      el=(dv.frezC<dv.nOI(nom)? dv.editE2 : dv.editE1 )
      edEl=el.firstChild
      if (edEl.heiI) edEl.heiI=st=gridZ.stopI(edEl.heiI) 
      if (edEl.intervalID) edEl.intervalID=st=gridZ.stopI(edEl.intervalID)
      el.style.display="none"
      el.removeChild(edEl)
   }
   dv.startEdit=0
   selC=def(dv.selC,-1)
   dv.unSel(nx)
   for (j=aDel.length-1;~j;j--) {
      dv.dataS[aDel[j]].d=1
      if (dv.chek) dv.chek[aDel[j]]=0
      dv.del++
   }
   
   restoreState(dv,!(dv.dataS.length-dv.del))
   if (dv.typG && dv.aTree.length && (i=dv.aTree[i].p)!='_R_') dv.updRow(i,[])
   requerySummary(dv)   
   dv.resize(1)
   selEl(dv,nx,-1)

   if (!dv.buferMode) tableUpdate.call(dv)
}
function tableUpdate(f,arg,cb){
    var dv=this,i,j,t,k,dU=gridZ.dateU[dv.id],dl,dat=[],m=[],keyN=[],key={},keyOld,kl=dv.key.length,dd,col=dv.columns
    if (dv.busy) return
    if (!dU || !(dl=dU.length)) { if (f && typeof(f)=='function') f.call(dv,arg,cb) ; return }
    dv.busy=1 
    for (i=0;i<kl;i++) keyN[i]=dv.nOF(dv.key[i])
    for (i=0;i<dl;i++){
       dd={}
       if (inArray(i,m)>-1) continue
       if (dU[i].act=='d'){
        dat.push({a:'d',k:dU[i].key})
       } else {
          keyOld=dU[i].oldKey
          for (t=0,key={};t<kl;t++) key[t]= keyOld[t]
          for (k in dU[i].data){
            dd[k]=dU[i].data[k]
            for ( t=0; t< kl;t++) if (keyN[t]==k) key[t]=dd[k]
          }
          for (j=i+1;j<dl;j++){
            if (inArray(j,m)<0){
               for(t=0;t<kl && dU[j].key[t]==key[t];t++){}
               if (t==kl){
                  m.push(j)
                  if (dU[j].act=='d') break
                   for (k in dU[j].data) dd[k]=dU[j].data[k]
                  for (k=0;k<kl;k++){
                     if ((t=dU[j].data[keyN[k]]) != Und) key[k]= t
                  }
               }
            }
         }
         if (j==dl) {
            dat.push({a:dU[i].act,k:(dU[i].act=='u' ? keyOld :0),d:dd})
         } else if (dU[i].act=='u') dat.push({a:'d',k:keyOld})
      }
    }
   for (i=0,dl=dat.length;i<dl;i++){
      for (j=0,t=col.length;j<t && !(dat[i].a!='d' && col[j].notNull && isNull(dat[i].d[col[j].field]) && (dat[i].a=='i' || col[j].field in dat[i].d ) );j++){}
      if (j!=t) { dv.busy=0;dv.errFunc(dv,'notNull',getI(dv,dat[i].k),col[j].nom); if(!dv.buferMode) dv.startEdit=1;  return}
   } 
   dv.updateSQL(dv,dat,function(st,oDat){
      var o,d,k,pk,i
      dv.busy=0
      if (st==2) { // откат
         tableRevert.call(dv,1)
      } else if (st) { // сохраняемся
        gridZ.dateU[dv.id]=Und
        dv.bufS=0
        if (oDat)
         for (k=oDat.length;k--;){
            if(~(i= getI(dv,oDat[k][0]))){
               for (d in (o=oDat[k][1])){
                  dv.dataS[i][dv.nF(d)]=_err ==8 ? 8 :  o[d] 
               }
               if (i==dv.selectedRow) dv.value=dv.getValue(i) 
               dv.triger('change') 
               dv.updRow(i,[])
            }
         } 
        pusto(dv,1)
        requeryStatus(dv)
        if (dv.selR1) aC(dv.sE=selelCell(dv,dv.selC),'gz_selEl')
        try{dv.ta.focus()}catch(e){}
        if (f && typeof(f)=='function') f.apply(dv,arg,cb)
      }
   })
}
function tableRevert(all){
   var dv=this,i,dateU=gridZ.dateU[dv.id],p=1,d,el,nom,n,j,vl,t,l,req//,c=dv.selC
   if (dv.startEdit){
      keyDown.call(dv,{keyCode:27,target:dv})
   } else if (dateU && dateU.length){
      while (dateU.length && (all || p) ) {
          p=0;d=[];l=0
          d[l++]=el=dateU.pop()
          if (el.act=='d'){
              nom=el.data
              while ((vl=dateU[dateU.length-1]) && vl.data===nom){
                  d[l++]=dateU.pop()
              }
          }
          for (i=0;i<l;i++){
              el=d[i]
            if (el.act=='i') {
              deleting(dv,1,[t=getI(dv,el.key)],t,1)
            } else {
               if (el.act=='u'){
                  if (el.data[dv.fldParent]) {dv.aHei=[];req=1}
                  for (j=0;j<el.key.length;j++){
                     if ((t=el.data[dv.nOF(dv.key[j])])!=Und) el.key[j]=t
                  }
                   n=getI(dv,el.key)
                   for (j=0;j<el.oldData.length;j++){
                      if((vl=el.oldData[j])!=Und)  dv.dataS[n][j]=  vl
                   } 
                   if (dv.dataS[n].f)  n=Und 
                   if (n>=0 && !req ) updRow.call(dv,n,[])
               } else {
                   dv.dataS[n=el.i].d=dv.dataS[n=el.i].f=0
                   if (dv.chek) dv.chek[n]=0
                  
                   dv.del--
                   t=gEl('h1-'+dv.id+'-'+n)
                   if (t) t.style.display=gEl('h2-'+dv.id+'-'+n).style.display='block'
                   else req=1
                   n=d[0].i
               }
            
            }
          }
      }
      n=def(n,dv.selectedRow )
      if (!dateU.length) dv.bufS=0
      dv.unSel(1)
      dv.makeTree(-1,1)
      if (req) dv.requery(dv.scrY)
      else {dv.openNode(n); dv.resize(1)}    
      requeryStatus(dv)
      selEl(dv,n,-1)
   }
}

function cutClick(){
   var dv=this,i=dv.selectedRow,el,old=dv.cut,t,gh='gz_selCut'
   if (old!=Und){
      rC(gEl('h1-'+ (t=dv.id + '-' + old)),gh)
      rC(gEl('h2-'+ t),gh)
      el=gEl('gr-h1-'+ t)
      if (el) {
         rC(el,gh)
         rC(gEl('gr-h2-'+ t),gh)    
      }
      dv.cut=Und
   }
   if (i!=Und && i!=old ){
      dv.cut=i
      aC(gEl('h1-'+ (t=dv.id + '-' + i)),gh)
      aC(gEl('h2-'+ t),gh)
      el=gEl('gr-h1-'+ t)
      if (el) {
         aC(el,gh)
         aC(gEl('gr-h2-'+ t),gh)    
      }
   }
}
function deleteClick(){
   var dt,dv=this,i=dv.selectedRow,pk
   if (i!=Und) {
      function callB(dv,i){
         var el1,el2,se,nx,par,arr,aDel=[],j,pk,pKey=[],obj,gU=gridZ.dateU
         dv.bufS=dv.busy=1
         treeDown (dv,i,2,aDel)
         if (!( gU[dv.id]  && gU[dv.id].length) ) {
            gU[dv.id]=[]
             requeryStatus(dv)
         }
         dt=gU[dv.id]
         opertion++
         for (j=aDel.length-1;~j;j--) {
            pKey.push(pk=dv.getValue(aDel[j]))
            dt.push({act:'d',key:pk,i:aDel[j],data:opertion,oldData:dv.dataS[aDel[j]]})
         }
         dv.updateRow(dv,i,'d',pKey,aDel, deleting)
      }
      if (dv.evFunc['delete']){ dv.triger('delete',[dv,dv.selectedRow,callB])
      } else callB(dv,i)
   }
}
function createEditEl(dv){
   var i,col=dv.columns,cl
   for (i=0;i<col.length;i++){ 
      if (!(cl=col[i]).elEdit) {
         col[i].elEdit=makeElem({typ:cl.typ=='CE' ? 'CE' : 'TA',
            classN:'gz_edC',
            filter:function(dv,h){
               var f,v=this.getValue(),c=dv.nO(h)
                  f=c.filter || gridZ.filter[c.typ]
                  this.setValue ((f) ? f(v,c.tCfg) : v )
            },
            enter:!cl.multiLine
          })
      }
   }
}
function decorEditCell(f){
   return function(){
      var el,edEl,v,arg=arguments,dv=(tC(this,'gridZ') ? this : arg[0]),fnOk=function(){
          dv.busy=0
          endEditCell(dv)
          return f.apply(dv,arg)
      }
      if (dv.busy) return
      if (dv.startEdit>1){
         el=(dv.frezC<(dv.nOI(dv.selC))? dv.editE2 : dv.editE1 )
         if(!(edEl=el.firstChild)) { dv.startEdit=0;return}
         dv.busy=1
         if (edEl.filter) edEl.filter(dv,edEl.n.nom)
         if (v=edEl.n.validate){
           v(dv,dv.selectedRow,edEl.n.nom,edEl.getValue(),fnOk,function(){
            dv.busy=0
            if(edEl.focus) edEl.focus()
            if(edEl.selectContent) edEl.selectContent()
            })
          } else fnOk()
      } else {
         dv.busy=0 
         return f.apply(dv,arg)
      }
   }
}
function decorEditRow(f){
   return function(){
      var j,k,nom,pKey=[],oldKey=[],action,l,data={},arg=arguments,dv=(tC(this,'gridZ') ? this : arg[0]),gU=gridZ.dateU,
         key=dv.key,dS=dv.dataS,kl=key.length,dl=dS.length,i=dv.selectedRow,col=dv.columns,cl=col.length
      if (dv.busy) return
      if (dv.startEdit){
         for (k=0;k<dl;k++){
               if (k==i) continue
               for (j=0; j<kl && dS[k][key[j]] == dS[i][key[j]] ;j++){}
               if (j==kl && !( dS[k].d || dS[k].f)) break
            }
         if (k!=dl){ return dv.errFunc(dv,'recNotUniq',k)}
         dv.busy=1 
         action=(dv.inserting ? 'i' : 'u')
         for(j=0;j<kl;j++){
             pKey[j]=dS[i][key[j]]
             oldKey[j]= (k=dv.aEdit[l=key[j]]) == Und ? dS[i][l] : k
         }
         for (j=0; j<cl;j++){
            nom=col[j].nom
            if (dv.aEdit[nom]!=Und) {
               data[col[j].field]=dS[i][nom]
            }
         }
         if (! (gU[dv.id]  && gU[dv.id].length) ) {
            gU[dv.id]=[]
             requeryStatus(dv)
         }
         gU[dv.id].push({act:action,key:pKey,oldKey:oldKey,data:data,oldData:dv.aEdit})
         dv.updateRow(dv,dv.selectedRow,action,oldKey,data, function(dv,st,fCol){
            var nCol
            dv.busy=0
            endEditRow(dv,st)
            if (st==2) {
               nCol=(fCol ? dv.nF(fCol) :0)
               selEl(dv,dv.selectedRow,nCol)
               return
            } else {
               if (!dv.buferMode ) { tableUpdate.call(dv,f,arg); return}
            }
            return f.apply(dv,arg)})
      } else return f.apply(dv,arg)
   }
}
function endEditRow(dv,st,e27){
   var i,oldRow=dv.selectedRow,gU=gridZ.dateU[dv.id]
   if (st==1){//  всё отлично
      dv.startEdit=0
       dv.aEdit=[]
   } else if (st==2){ //продолжаем редактирование в nCol столбце
       if (!e27) gU.pop()
       return
   } else if (st==3){// откат старых значений
      dv.startEdit=0
      if (dv.inserting){
      // saveState(dv)
         dv.startEdit=0
         deleting(dv,1,[oldRow],oldRow)
      } else {
         dv.updRow(oldRow,dv.aEdit)
      }
      if (!e27) gU.pop()
      dv.aEdit=[]
      if (gU && !gU.length) dv.bufS=0
      requeryStatus(dv)
   } else if (st==4){// отлично, но требуется перерисовать строку
      dv.startEdit=0
      dv.updRow(oldRow,dv.dataS[oldRow])
      dv.aEdit=[]
   } else { // отлично , но требуется перерисовать весь грид
      dv.startEdit=0
      dv.aEdit=[]
      restoreState(dv,1)
   }
   if (st!=2) dv.inserting=0
   for (i=0; i<dv.key.length; i ++) {
      if (_oldV[i]!==dv.dataS[oldRow][dv.key[i]]) {
         
         dv.value=dv.getValue(oldRow)  
         dv.triger('change');return
      }
   }
   selEl(dv,dv.selectedRow,-1,1)
}
function endEditCell(dv){
   var el,aData=[],nom=def(dv.spanN,dv.selC),i=dv.selectedRow,edEl,value,st=gridZ.stopI
   el=(dv.frezC<dv.nOI(nom)? dv.editE2 : dv.editE1 )
   el.style.display="none"
   if (!(edEl=el.firstChild)) return
   if (dv.startEdit==3 && edEl.getValue()!=edEl.oldValue) {
      dv.startEdit=2
   }

   if (edEl.heiI) edEl.heiI=st(edEl.heiI) 
   if (edEl.intervalID) edEl.intervalID=st(edEl.intervalID)
   aData[nom]=edEl.getValue()
   dv.startEdit=(dv.startEdit==3 ? 0 : 1);
   el.removeChild(edEl)
   if (dv.aEdit[nom]==Und) dv.aEdit[nom]=dv.dataS[i][nom] || ''
   dv.updRow(i,aData)
}
function decorStartEdit(f){
   return function(){
      var arg=arguments,dv=(tC(this,'gridZ') ? this : arg[0])
         if (dv.enableFunc)
            dv.enableFunc(dv,arg[1],arg[2], function(){ return f.apply(dv,arg)})
         else {
            if (dv.nO(arg[2]).disabled || !dv.editable) return
            return f.apply(dv,arg)
         }
   }
}

function _startEdEl(el, val, byUser, cb) {
   // осуществляет цикл setValue -> timeout|promise -> cb
   var p=el.setValue(val, {byUser: byUser}), pc
   if((pc=Win.Promise) && p && p.constructor===pc) {
      p.then(cb)
   } else setTimeout(cb, 50)
}

function startEditCell(dv,i,c,key){
   var f,cell,w,h,n,el,st, nC=dv.nF(dv.colImg),imwd=0,frz=dv.frezC< dv.nOI(c), p

   _oldV=dv.getValue(i) 
   cell=gEl('h'+(frz ? 2 :1)+'-'+ dv.id+'-'+i )
   cell=cell.firstChild
   while (cell && !tC(cell,'gz_cl ' + dv.id+ '-col'+c)) {
      cell=cell.nextSibling;
   }
   if (cell==null) return
   
   if (!dv.startEdit) dv.aEdit=[]
   dv.startEdit=(dv.startEdit==1 ? 2  :3)
   st=(frz? dv.editE2 : dv.editE1 );
   imwd=+( (f=cell.lastChild) && f.getAttribute && f.getAttribute('imwd') || 0  );
   c=(f=cell.getAttribute('field')) ? dv.nF(f) : c 
   n= dv.nO(c)
   dv.spanN=f ? c : Und
   w=((parseInt(cell.style.width) || n.w ) + _padCX  -imwd  )+"px"
   h=(parseInt(cell.style.height) +  _padCY) +'px'
   
   el=st.appendChild(n.elEditF && n.elEditF(dv,i,c) ||  n.elEdit) ;
   el.n=n
   cSS(st,"display:'';top:"+(cell.parentNode.offsetTop-1) + "px;left:"+(cell.offsetLeft+imwd -1)+ "px;width:"+w+";"+ah+h)

   if (el.startEdit) el.startEdit(el);
   if (dv.startEdit==3){
       el.intervalID = gridZ.setI(function(){
         if (el.oldValue!==el.getValue()) {
            startedEd(dv,dv.selectedRow,2)
            el.intervalID=gridZ.stopI(el.intervalID)
         }
       },500)
    }
   el.resize(w,h)
   
   if(key && typeof(key)=='string' && key.length==1 && key!=' ') {
      // если быстрый вход с пропечатыванием 1-й клавиши
      _startEdEl(el, key, 1, function() {
         if(el.focus) el.focus()
      })      
   } else {
      // обычный вход
      _startEdEl(el, el.oldValue=def(dv.dataS[i][c],''), 0, function() {
         if(el.focus) el.focus()
         if(el.selectContent) el.selectContent()
      })
   }
}

function selAll(){
  var rng, sel, el=this
  if (el.select) el.select()
  else  if ( Doc.createRange ) {
    rng = Doc.createRange();
    rng.selectNodeContents( el )
    sel = Win.getSelection();
    sel.removeAllRanges();
    sel.addRange( rng );
  } else {
    rng = _body.createTextRange();
    rng.moveToElementText( el );
    rng.select();
  } 
  if (Win.edZ && (rng=Win.edZ.setOption) )  rng({target:el,type:'keyup'})
} 
function startedEd(dv,i,s){
   var te=gEl('teh-'+ dv.id+'-'+i)
   dv.startEdit=s
   if (te) te.className='gz_editRow'
   if (!dv.bufS) {
     dv.bufS=1
     requeryStatus(dv)
   }
}
function resF(e){
   var dv=this
   dv.style.cssText+=';width:'+(dv.offsetWidth-dv.pX)+'px;height:'+(dv.offsetHeight-dv.pY)+'px';
   scrollB('r',e,dv);return false
}
function fsX(e){var dv=this; if (dv.allowFilter>0) cSS(dv.bFilter,"top:1px;left:1px;");scrollB('sx',e,dv);return false}
function fsY(e){scrollB('sy',e,this);return false}
    
function scrollX(){
   var dv=this
   dv.hover.style.height=0;
   dv.summary2.scrollLeft=dv.h2.scrollLeft=dv.b2.scrollLeft
   resizeScroll(dv,0,1)
   return true
}
function scrollY(){
   var dv=this
   dv.hover.style.height=0;
   resizeScroll(dv,1)
 }

function pgY(e){
   var dv=this.parentNode
   e=e || Win.event
   if ((e.target || e.srcElement)== this){
      dv.bd.scrollTop += (((e.layerY || e.offsetY) <parseInt(dv.scrYP.style.top)) ? -1 : 1) * parseInt(dv.bd.style.height)
   }
}
function pgX(e){
   var dv=this.parentNode.parentNode
   e=e || Win.event
   if ((e.target || e.srcElement)== this){
      dv.b2.scrollLeft=dv.summary2.scrollLeft=dv.h2.scrollLeft+= (((e.layerX || e.offsetX) <parseInt(dv.scrXP.style.left)) ? -1 : 1) * parseInt(dv.b2.style.width)
   }
}
function drS(dv,v){
   _dragStart=v
   _dragDv=dv
 //  _body.style['msTouchAction']='none' 
   gridZ.onEv('move','gridZ',dragMove)
   gridZ.onEv('up','gridZ',dragEnd)
}
function scrollB(X,e,dv){
   e = e || Win.event;
   if (e.type=='touchstart') e=e.touches[0]
   drS(dv,1)
   _dM=X
   _dSX=_dX= e.pageX || e.clientX
   _dY= e.pageY || e.clientY
}
function getValue(_row) {
   var i,k=[],dv=this,dS,vl,dk=dv.key
   if (_row==Und) _row=dv.selectedRow
   dS=dv.dataS[_row]
   if (dS==Und || dS.d ) return Und//|| dS.f
   for (i=0; i<dk.length; i ++) {
      k[i]=dS[dk[i]]
   }
   return k
}
function setValue(pk,noEv,noFocus){
   var dv=this,i,aData=[]
   if (typeof(pk)=='object'){
      for (i=0;i<pk.length;i++) {
         aData[i]=[dv.nOF(dv.key[i]),pk[i]]
      }
   } else {
      aData[0]=[dv.nOF(dv.key),pk]
   }
   dv.openNode(aData,1)
   return dv.findEl(aData ,0,noEv,noFocus)
}
function pusto(dv,s){
   if (dv.tehColumn && dv.selectedRow!=Und) gEl('teh-'+ dv.id+'-'+dv.selectedRow).className=s ? 'gz_selRow' : 'gz_pusto'
}
function selEl(dv,_row,col,noEv,clk,cn,noFocus,key){ //cn - класс элемента в котром кликнули
   if (dv.busy || _row==Und) return
   var scrollP=[],nm,ell,ss,i,oW,oL,oT,oH,sT,sL,cH,cW,top,bot,p,sE,el,tehEl,row,obj,nCol,tehC, idRow,embed,typ,nO,colI,cl=dv.columns
   if (col<0 ) {if (col==-2) tehC=1; col=col==-3 ? cl[0].nom : def(dv.selC1,def(dv.selC,cl[0].nom))  }//
   delSelA(dv)
   nO=dv.nO(col)
   row=_err ==9 ? 0 :  gEl('h1-'+dv.id+'-'+_row)

    if (_row>=dv.dataS.length) return
   typ=nO.typ || '' ; embed=nO.embed || 0
    if (dv.editable && !noEv && !tehC && !nO.disabled && (' '+cn+' ').indexOf(' gz_disabled ')<0) {
      if (embed){
         decorStartEdit((gridZ.clickEl[typ] || nO.click) (dv,_row,col,clk))
      } else if (clk!=-100 && (_row==dv.selectedRow && dv.selC==col && dv.selC!=Und  || dv.ext)){
         startEditCell(dv, _row, col, key)
      }
    }
    if((col!=dv.selC  || _row!==dv.selectedRow) && !noEv ){
       dv.triger('selectcell',[_row,col])
    }
    if(col!=dv.selC ){
      dv.selC1=dv.selC=+col
      if (!noEv) dv.triger('selectcolumn',[_row,col])
    }
    if (tehC) dv.startEdit=0
    if(_row!==dv.selectedRow || tehC) {
      dv.value=dv.getValue(_row)
      if (dv.tehColumn){
       pusto(dv)
       gEl('teh-'+ dv.id+'-'+_row).className=( nCol!=Und ? 'gz_editRow' :'gz_selRow')
      }
      dv.selectedRow=+_row
      if (!noEv) {dv.triger('selectrow',[_row,col]);dv.triger('change')}
    }
   
    if (dv.selR1 && tC(dv.selR1,'gz_selR')) {
      dv.selR2.className=rC(dv.selR1,'gz_selR')
    }
   if (!row.offsetWidth) {row=gEl(row.id);clk=0}
   aC(row,'gz_selR')
   dv.selR1=row
   dv.selR2=gEl('h'+ (row.id.substr(1,1)=='1' ? 2 : 1) + row.id.substr(2))
   aC(dv.selR2,'gz_selR')
   oT= row.offsetTop;
   oH=parseInt(row.style.height);
   sT=dv.bd.scrollTop;
   sL=dv.b2.scrollLeft;
   cH=dv.bd.clientHeight;
   cW=dv.b2.clientWidth;
   top= oT - sT ;
   bot= parseInt(dv.b2.style.height)
   
   if ( (p=dv.nOI(col))>=dv.columnCnt){
      p=0;oL=0;i=0
   } else {
      p=(p>dv.frezC)
      oL=(dv.tehColumn && !p ? 20 :0 )
      for( i=(p ? dv.frezC+1 : 0);i<dv.nOI(col);i++) oL+=cl[i].w +_padCX
   }
   oW= cl[i].w+_padCX
   if (sE=dv.sE) rC(sE,'gz_selEl')
   for (;clk && !tC(clk,'gz_cl'); clk=clk.offsetParent){}
   if (!clk || !clk.parentNode){ //из клав
      clk=selelCell(dv,col)
   }
   dv.sE=clk
   if (clk) aC(dv.sE,'gz_selEl')

   dv.bd.scrollTop=(oT<sT) ?  oT : ( (oT>sT+cH-oH) ? oT-cH+oH : sT )
   if (p) sL=dv.h2.scrollLeft=dv.b2.scrollLeft= (oL<sL) ?  oL : ( (oL>sL+cW-oW+_scrollW) ? oL-cW+oW : sL )

   if (!noEv) dv.triger('click',[_row,col]);
   if(!dv.bd.style.height){
      dv.ta.style.cssText+=';left:'+ (( p ? dv.rX1 :0 ) + oL-sL) +'px;top:'+(oT+dv.rY1)+'px;'
   } else {
      dv.ta.style.cssText+=';left:0;top=0;'
   }
  requeryCount(dv)
  for(p=dv.parentNode;p && p.scrollTop!=Und;p=p.parentNode) scrollP.push({'el':p,'X':p.scrollLeft,'Y':p.scrollTop})
  if (dv.startEdit<2 && !noFocus) try{dv.ta.focus()}catch(e){} //28.5.13 
  for(p=scrollP.length; p ; p--) {
    ss=scrollP[p-1]; ell=ss.el; ell.scrollLeft=ss.X; ell.scrollTop=ss.Y
  }
  if (!dv.buferMode && tehC) tableUpdate.call(dv)
}
function selelCell(dv,nCol){
   var clk,nm=dv.id+'-col'+ (nCol<0 ? (dv.selC=dv.columns[0].nom): nCol)
   for (clk=dv.selR1.firstChild;clk && !tC(clk,nm);clk=clk.nextSibling){}
   if (!clk) for (clk=dv.selR2.firstChild;clk && !tC(clk,nm);clk=clk.nextSibling){}
   return clk
}
function sortF(a,b,i1,i2){
   var a1,b1,rez,cn,srt,col,i,dv=this,l,f
   if (!(l=dv.aSort.length)) return -1
   for (i=0;i<l;i++){
      col=dv.nFC(f=dv.aSort[i][0]);cn=col.isHTML ? 'H'+f : col.nom
      if (typeof(a)!='object'){
        a1=(a=dv.dataS[i1=a])[cn]; b1=(b=dv.dataS[i2=b])[cn];
      } else {
        a1=a[cn]; b1=b[cn];
      } //                                                                                 ?i1
      if (col.depend) { a1=col.depend.call(dv,a1,a,col,i1); b1=col.depend.call(dv,b1,b,col,i2)  }
      srt= dv.aSort[i][1];//                                                                        && !col.depend
      rez=( col.sortF!=Und ? col.sortF.call(dv,a1,b1,i1,i2) : (((col.typ=='int' || col.typ=='money')) ? gridZ.compFloat(a1,b1) : gridZ.compText(a1,b1)))
      if ((srt==1) && (rez>0) || (rez< 0) && (srt==-1)) return 1
      if ((srt==-1) && (rez > 0) || (rez < 0) && (srt==1)) return -1
   }
   return 0
}
function unSel(noEv){
   var dv=this
   delSelA(dv)
   if (dv.selR1) dv.selR1.className = rC(dv.selR2,'gz_selR')
   pusto(dv)
   dv.selR1=dv.selR2=Und
   if (dv.sE) rC(dv.sE,'gz_selEl')
   dv.value=dv.selectedRow=dv.selC=Und
   _oldV=[]
   requeryCount(dv)
   if (noEv==Und) dv.triger('unselect',[])
   dv.triger('change')
}
function requerySort(dv){
   var el,j,n,l
   function st(f){
      var nFld,j,els = dv.hd.getElementsByTagName('div')
      nFld=dv.nF(f)
      for (j=0;j<els.length;j++)
         if ( tC(els[j],'gz_cl') && els[j].id.indexOf(dv.id+'-hcol')==0) {
             if (numbI(els[j].className,'-col')==nFld) return els[j]
        }
      return 0
   }
   while (el=dv.sortEl.pop()) {if (el.parentNode) el.parentNode.removeChild(el)}
   if (!dv.aSort || !(l=dv.aSort.length)) return
   for (j=0; j < l && j<5; j++){
      el=st(dv.aSort[j][0])
      if (!el) return
      dv.sortEl.push(apDiv(4,el,(dv.aSort[j][1]>0 ? 'gz_ordAsc' :'gz_ordDesc'),'px;bottom:'+(dv.allowFilter>0 ? 12 :0 )+'px;right:3px;'))
      if (l>1) {dv.sortEl.push(n=apDiv(4,el,'gz_digit',abs+'right:0;bottom:'+ (dv.allowFilter>0 ? 20 :0 ) +'px;'));n.innerHTML=(j+1)}
   }
}
function dragMove(e){
   var sty,OL,OLY,OLX,el,h,i,col1,colN,s1,s2,w=0,dv=_dragDv,grC,gL,col,l,bg,b,t={},p={}
   if(_dragStart){
      if (e.type=='mousemove') {
         if (h=Win.getSelection) { h().removeAllRanges(); }
         else if (Doc.selection && (h=Doc.selection.empty)) h();
      }  else {
        if (e.preventDefault) e.preventDefault()
        else event.returnValue=false
      }
      if (e.type=='touchmove') e=e.touches[0]
      OLY=e.pageY || e.clientY
      OLX=e.pageX || e.clientX
      sty=(dv.resCol ? dv.resCol.style:'')
      if (_dM=='sx'){
         dv.b2.scrollLeft=dv.summary2.scrollLeft=dv.h2.scrollLeft+= (OLX- _dX) *dv.rX2/ parseInt(dv.b2.style.width)
         if (dv.b2.scrollLeft!=dv.h2.scrollLeft) resizeScroll(dv,0,1)
      } else if (_dM=='sy' ){
         h=dv.bd.scrollTop+= (OLY- _dY) * (b=dv.bd.scrollHeight) / (i=dv.bd.offsetHeight) 
      } else if (_dM=='w'){
         sty.left=parseInt(sty.left)+OLX-_dX+'px'
      } else if (_dM=='r'){
         dv.style.cssText+=';width:'+(parseInt(dv.style.width) + OLX-_dX)+'px;height:'+ (parseInt(dv.style.height) + OLY-_dY)+'px;'
        // dv.resize(1)
      } else {
         el=element(e,'gz_cl')
         if (el==null) return
         colN=numbI(el.className,'-col')
         col=dv.columns;l=col.length
         if (_dragStart==2){
            if (Math.abs(OLX-_dX)>5 ) _dragStart=1
            else return
             for (i=0;i<l && col[i].nom!=colN;i++){w+=col[i].w+_padCX}
            w+=(dv.tehColumn ? 20 :0) -(i>dv.frezC ? dv.b2.scrollLeft-2:0) +dv.pX1b
            dv.resCol=apDiv(0,dv,'gz_movC','top:'+ ((s1=parseInt(el.style.top))+dv.pY1) + 'px;left:' + w + 'px;'+ah+(parseInt(dv.bd.style.height)+parseInt(dv.hd.style.height)- s1) +'px;')
            _dragStartColumn=colN
         } else {
            if (dv.noColSwap) return
            _dragColumn=colN
            for (i=0;i<l && col[i].nom!=colN;i++){w+=col[i].w+_padCX}
            if (OLX>_dX) w+=col[i].w+_padCX
            w+=(dv.tehColumn ? 20 :0)-(i>dv.frezC ? dv.b2.scrollLeft-2:0) +dv.pX1b
            sty.left=w+'px'
            grC=dv.groupCol;gL=grC.length;
            for (h=0,el=dv.hd.getElementsByTagName('div'),l=el.length;h<l;h++) rC(el[h],'(gz_start|gz_end)')
            col1=_dragStartColumn
            s1=dv.nOI(col1)
            s2=dv.nOI(colN)
            if ( col1!=colN){
               for (h=0;h<gL ;h++){ // первая группа где ест 1 и нет 2
               if (s1>=grC[h][3] && s1 <=grC[h][4] && (s2<grC[h][3] || s2 >grC[h][4]  )) break
               }
               if (h==gL ) {el=gEl(dv.id+'-hcol'+col1)
               } else { el=gEl(grC[h][7])}
               if(el) aC(el,'gz_start')

               for (h=0;h<gL ;h++){ // первое значение в группе где ест 2 и нет 1
               if (s2>=grC[h][3] && s2 <=grC[h][4] && (s1<grC[h][3] || s1 >grC[h][4]  )) break
               }
               if (h==gL ) {el=gEl(dv.id+'-hcol'+colN)
               } else { el=gEl(grC[h][7])}
               if(el) aC(el,'gz_end')
            }
         }
      }
      _dX=OLX
      _dY=OLY
      return false
   }
}
function cursorHead(e){
   e=e || event
   var OL,dv=this,el=element(e,'');
   OL=(e.offsetX || e.layerX)
   if(!_dragStart){
       while (!tM(el,'gz_cl','gridZ')) {OL+=(el.clientWidth ? el.offsetLeft: 0);el=el.offsetParent }
       dv.hd.style.cursor=(OL<5 && !tC(el,dv.id+'-col0') || OL > el.offsetWidth-5 ? 'col-resize' : '')
   }
}
function dragStart(e){
   e=e || event
   if (e.type=='touchstart') e=e.touches[0]
   var gr,w=0,i,colN,OL,dv=this,col=dv.columns,cL=col.length,el=element(e,'') 
   if (el.tagName=='INPUT')  return
   if (dv.allowFilter>0) cSS(dv.bFilter,"top:1px;left:1px;")
   OL=e.offsetX || e.layerX
   while (el && !tC(el,'gz_cl')){OL+=(el.clientWidth ? el.offsetLeft: 0);el=el.offsetParent }
   if (!el) return;
   if ( (gr=numbI(el.id,'-hgr')) && OL > el.offsetWidth-5 ){
      colN=col[dv.groupCol[gr][1]].nom
   } else {
      colN=numbI(el.className,'-col')
   }
   for (i=0;i<cL && col[i].nom!=colN;i++){w+=col[i].w+_padCX}
   w+=(dv.tehColumn ? 20 :0)+dv.pX1b
   if (OL<5 && i || OL > el.offsetWidth-5  ){
      _dM='w'
      _dragI=(OL<5 ? i-1:i)
      drS(dv,1)
      w+=(OL<5 ? 0 : col[i].w+_padCX)-(i<dv.frezC ? 0 : dv.b2.scrollLeft-2)
      dv.resCol=apDiv(0,dv,'gz_resC','top:'+ (el.offsetTop+dv.pY1)+ 'px;left:' + w + 'px;'+ah+(dv.offsetHeight- el.offsetTop-dv.status-dv.pY) +'px;')
   } else {
     if (dv.noColSwap) return 
     _dM='z' 
     drS(dv,2)
   }
   _dSX=_dX=(e.pageX || e.clientX )
   //dv.onselectstart=function(){return false}
   return false
}
function dragEnd(e){
   var SL,col,dv=_dragDv,h,bg,l,el
   //if (_body) _body.style['msTouchAction']='' 
   if (_dragStart==1 && _dM!='sx' && _dM!='sy'){
      col=dv.columns,l=col.length
      if (_dM=='w'){
         gridZ.noSort=1
         col=col[_dragI]
         if (col.wid.indexOf && ~col.wid.indexOf('%')) col.proc=1
         col.wid=Math.max(col.w+ _dX-_dSX,1)
         SL=dv.b2.scrollLeft
         dv.x=0
         dv.requery(Und,1,dv.hRow)
         dv.h2.scrollLeft=dv.b2.scrollLeft=SL
         setTimeout(function(){gridZ.noSort=0},1000)
      } else if (_dM=='r'){
         if (!dv.wProc && _dSX<_dX ){
            for (h=0;h<l;h++){
               if (parseInt(col[h].wid) && col[h].proc) { dv.wProc+=col[h].wid; col[h].wid+='%' }
            }
         }
         dv.style.maxHeight=''
         dv.resize(3)
      } else {
         if (_dragStartColumn!=_dragColumn) {
            for (h=0,el=dv.hd.getElementsByTagName('div'),l=el.length;h<l;h++) rC(el[h],'(gz_start|gz_end)')
            zamen(dv,dv.nOI(_dragStartColumn),dv.nOI(_dragColumn))
            if (dv.spanFunc) dv.resize(3)
         }
      }
      if (dv.resCol && dv.resCol.parentNode != null) dv.removeChild(dv.resCol)
      dv.resCol=0
      dv.ta.focus()
      dv.onselectstart=function(){return true}
   }
   _dragStart=0
   dv.saveColumn()
   gridZ.clEv('move','gridZ')
   gridZ.clEv('up','gridZ')
 }

function sortClick(e){
   var nCol,j,fld,h,dv=this,el,aL=dv.aSort.length
   e =e || event;
   el=e.target || e.srcElement
   if (el.tagName=='INPUT') return 
   stopEv(e)
   if (el.tagName=='BUTTON') {
      if (el.id.substr(0,5)=='chAll'){
         chkAll(dv,el)
      } else if(el.className=='gz_freeze') {
         dv.nO(fld=numbI(el.id,'-fz')).fr=Und
         if (fld=dv.nO(fld).depend) dv.nO(fld=dv.nFO(fld)).fr=Und
         el.parentNode.removeChild(el)
      }
      return // если по картинке то на выход
    }
    if (dv.noSort) return
    el=element(e,'gz_cl')
   if (gridZ.noSort) return
    if (!el || el.id.indexOf(dv.id+'-hcol')) { dv.unSel() ;return}
    h=dv.nOI(numbI(el.className,'-col'));
    fld=dv.columns[h].field
    if (e.ctrlKey){
      gridZ.onEv('keyup','gridZ',function(e){
         e=e || event   
         if (e.keyCode==17 || e.ctrlKey){
            sortGrid(dv)
            gridZ.clEv('keyup','gridZ')  
          }
      })
      for (j=0;j<aL && dv.aSort[j][0]!=fld;j++){}
      if (j==aL) {
         dv.aSort.push([fld,1])
      } else {
         if (dv.aSort[j][1]==1) {dv.aSort[j][1]=-1} else {dv.aSort.splice(j,1)}
      }
    } else {
      if (dv.aSort[0] && dv.aSort[0][0]==fld){
         if (aL>1) {dv.aSort=[[fld,1]]}
         else if (dv.aSort[0][1]==1) {dv.aSort[0][1]=-1} else {dv.aSort.pop()}
      } else {
         dv.aSort=[[fld,1]];
      }
      sortGrid(dv)
    }
    requerySort(dv)
    Memory(dv.id+'_aSort',dv.aSort);
}
function restoreState(dv,req){
   dv.makeTree(-1,1)
   if (req) {dv.requery(Und,1)} else dv.unSel(1)
}
function getI(dv,pk){
   if (pk==Und) return Und
   var i,j,typ=typeof(pk),p,r=0,dL=dv.dataS.length,pl=pk.length
   for (i=0; i<dL && !r; i++) {
      p=dv.getValue(i)
      if (p==Und) continue
      if (typ=='object'){
         for (j=0; j <pl && pk[j]==p[j];j++){}
         if (j ==pl) r=1
      } else r=(pk==p)
   }
   return (i==dL && !r ? -1 : i-1)
}
function wait(dv,s){
   try{$(dv).yupForm('wait',s)}catch(e){}
}
function sortGrid(dv,fl){
   var row=dv.getValue(),arr
   dv.busy=1
   function callB(dS){
      if(dS) dv.dataS=dS
      restoreState(dv,1)
      dv.busy=0 
      if(row !== Und) dv.setValue(row,1)
      dv.triger('aftersort')
   }
   if (dv.evFunc['sSort'] && (dv.dataS.length<dv.countRec || dv.countRec<0 || fl)){
      arr=reFil(dv,dv.aFilter,1);dv.aHei=[]
      dv.triger('sSort',[callB,arr]) ;
   } else callB() 
}
function element(e,classN){
    var el
    e = e || Win.event;
    el=e.target || e.srcElement
    while (el && !tC(el,classN))     el=el.offsetParent
    return el
}
function hover(e){
   var dv=this,el=element(e,'row-'+dv.id)
    if (el){
       dv.hover.style.cssText+=';top:' +(el.offsetTop - dv.b2.scrollTop) +'px;height:'+ (dv.startEdit<2 ? el.style.height : 0)
    }
}
function selectEl(e){
    var pel,rowNew,tehC,dv=this,col,el,elC,noEv=0,cn,top=0,hei=0,left,t,s1,s2,y1,y2
    e =e || Win.event;
    elC=el=e.target || e.srcElement
    if ((cn=el.id.substr(0,3)) =='iO-') {op(el,this); return }
    if (cn =='ch-') {cheked.call(this,el);return}
    while (el && !tM(el,'gz_cl','gz_tehC','gz_editDiv')) el=el.offsetParent || el.parentNode
   if (el) {
    if (el.className=='gz_editDiv' || element(e,'gz_summary'))  return false
    if ((pel=numbI(el.offsetParent.id,'-'))==Und)  return
    rowNew=pel
    col=((cn=el.className)=='gz_tehC' ? -2 : numbI(cn,'-col'))
    el=el.offsetParent
    if (e.shiftKey && e.ctrlKey && dv.allowInsert){
      elC=gEl(dv.id+'-fz' + col) || apDiv(2,gEl(dv.id+'-hcol'+col),'gz_freeze','height:'+dv.imW +'px;top:0;right:0;')
      elC.title=dv.nO(col).fr= dv.dataS[rowNew][col]
      if (pel=dv.nO(col).depend) elC.title=pel.call(dv, dv.dataS[rowNew][col], dv.dataS[rowNew],this,rowNew)
      elC.id=dv.id+'-fz' + col
    } else  if (e.ctrlKey && dv.allowFilter>0  && !(cn=dv.nO(col)).disableFilter){
      elC=gEl(dv.id+'-filtr' + col)
      pel=dv.dataS[rowNew][col]
      if (cn.isHTML) pel=toText(pel)
      if (cn.depend) pel=cn.depend.call(dv,pel,dv.dataS[rowNew],cn,rowNew) 
      elC.value=dv.aFilter[cn.field]='='+pel
    } else if (e.shiftKey && dv.ctrlC && dv.selectedRow!=Und) {
      for (;elC && !tC(elC,'gz_cl'); elC=elC.offsetParent){}
      for (s1=elC;s1!=dv.b1 && s1!=dv.b2; s1=s1.offsetParent){
         top+=s1.offsetTop
      } 
      for (s1=dv.sE;s1!=dv.b1 && s1!=dv.b2; s1=s1.offsetParent){
          hei+=s1.offsetTop
      }
      
      if (top>hei) {y1=dv.selectedRow;y2=rowNew;t=top;top=hei; hei=t-hei+elC.offsetHeight} 
      else {y2=dv.selectedRow;y1=rowNew;hei=hei+dv.sE.offsetHeight-top}
      s1=dv.nOI(col);s2=dv.nOI(dv.selC)
      if (s1>s2){
         left=dv.sE.offsetLeft
         t=s1; s1=s2;s2=t
         t=elC.offsetWidth+ elC.offsetLeft
      } else {
         left=elC.offsetLeft
         t=dv.sE.offsetWidth+ dv.sE.offsetLeft
      }
      dv.selA1.style.cssText=(top=abs+"top:"+ top+ "px;height:"+ hei + "px;left:")+ (s1<dv.frezC+1 ? left : 0 ) + "px;width:" +(s1<dv.frezC+1 ? (s2<dv.frezC+1 ? t :dv.rX1) -left : 0 )  + "px;" 
      dv.selA2.style.cssText=top+ (s1<dv.frezC+1 ? 0 : left ) + "px;width:" + (s2<dv.frezC+1 ? 0 :t-(s1<dv.frezC+1 ? 0 :left) )  + "px;" 
      dv.selA=[s1,y1,s2,y2]   
    
    } else if (dv.startEdit){
       if (rowNew!==dv.selectedRow || col<0 ) {
            selEl_R(dv,rowNew,col,0,elC,cn)
       }  else  selEl_C(dv,rowNew,col,0,elC,cn)
    } else  selEl(dv,rowNew,col,0,elC,cn);
   }
}
function delSelA(dv){
   dv.selA2.style.cssText=dv.selA1.style.cssText=abs;dv.selA=0
}
function dblC(e){ e=e || Win.event
   var dv=this
   if(element(e,'row-'+dv.id)) dv.triger('dblclick',[dv.selectedRow,dv.selC]);
 }
 function excel(dv){
   var p,a,d,cnt,c2,styl='',st='<table border=1 cellspacing=1>',g=[],t,k,lev,mL,maxL=0,i,j,sA=dv.selA || crlA (dv),x1,x2,y1,y2,grC=dv.groupCol,gL=grC.length,col=dv.columns,c
   x1=sA[0],x2=sA[2],y1=sA[1],y2=sA[3]
   for (i=x1,mL=0; i<=x2;i++){
      st+='<col width=' + ((k=col[i]).w+_padCX) +'>'
      d={i:y1,tCfg:k.tCfg}
      if (t=gridZ.cellRenderers[k.typ]) t.call(dv,d)  
      styl+=' .xl' + k.nom + ' {mso-number-format:"'+ (k.f=k.xlsF || d.f || '\@')  + '"}'
      for (j=0,lev=0;j<gL;j++){
         if (!g[j]) g[j]={colspan:0}
         if(i>=(t=grC[j])[3] && i<=t[4]){
            g[j].colspan++
            lev++
            g[j].rowspan=lev
         } 
         mL=mL>lev ? mL : lev;
      }
      k.mL=lev
   }
   if (dv.captionExcel) st+='<tr><td colspan='+ (x2-x1+1) + '>'+ dv.captionExcel+'</td></tr>'
   for (k=0;k<=mL;k++){
      st+='<tr>'
      for (i=x1; i<=x2;i++){ 
         for (j=0;j<gL;j++)
            if((i==(t=grC[j])[3] || i==x1 && i>=t[3] && i<=t[4]) && g[j].rowspan==(k+1))
               st+='<td colspan=' + g[j].colspan +'><center>'+ t[0]
         if (k==col[i].mL)   st+='<td rowspan='+ (mL-k+1) + '><center>' + col[i].head  
      }
   }
   for(i=y1,t=1;1;i=nextL(dv,1,i),t++){
     p=0 
     if ( dv.typG){
      p=1;j=i
      while (dv.aTree[j].p!='_R_') {
         p++
         j=dv.aTree[j].p
      }
   }
 
      st+='<tr'+(p ? " style='mso-outline-level:" +p+"'" : '') +'>'
      for (j=x1;j<=x2;j++){
        c=col[j]  
        k=dv.dataS[i][c.nom]
        if( c.depend) k=c.depend.call(dv,k,dv.dataS[i],c,i)
        c2=dv._contFunc(cnt={env:'xls',inner:k,i:i,h:c.nom,typ:c.typ,render: (c.rExcel==1 ? c.render: c.rExcel==2 ? 0 : c.rExcel)})
        k = c.rExcel ? c2 : k 
        if (c.isHTML) k=toText(k)
        st+= '<td style="mso-pattern:auto none;' + (cnt.css || '') + '" class="xl' + c.nom + '">' + (k || '')
      }
      if (i==y2) break
   }
   if (dv.summary)
   for (st+='<tr>',j=x1;j<=x2;j++){
         for(k=j-x1,a='';~k;k=parseInt(k/26 )-1) a=String.fromCharCode(65+(k % 26))+a
         p= '('+a + (mL+2)+':'+ a+(mL+t+1)+')'
         d= col[j]
         p=  d.aggr=='sum' ? '=СУММ'+p : d.aggr=='avgAll' ? '=СУММ'+p+'/ЧСТРОК'+p : d.aggr=='avg' ? '=СРЗНАЧ'+p : typeof(d.aggr) =='string' ? d.aggr:''
         st+='<td>' +p
   } 
   st='<html><META HTTP-EQUIV="Content-type" CONTENT="text/html; charset=UTF-8"> '+ (styl ? '<style>' + styl + '</style>' : '') + st    
   if (Win.Blob) {
      st=new Blob([st],{type:'application/vnd.ms-excel'})
      if (Win.navigator.msSaveOrOpenBlob) Win.navigator.msSaveOrOpenBlob(st,'Выгрузка.xls')
      else if (Win.URL) this.href=URL.createObjectURL(st)
   } else if (Win.TextRange) Win.alert('Ваш браузер не поддерживает выгрузку в Excel')
          else this.href='data:application/vnd.ms-excel;base64,'+  btoa(escape(st)) 
}
 
function copyBuf(dv){
   var i,j,sA=dv.selA,t='',m
   if (!sA) return
   for(i=sA[1];1;i=nextL(dv,1,i)){
      for (j=sA[0];j<=sA[2];j++){
         m=(''+dv.dataS[i][dv.columns[j].nom]).replace(/[\t\r\n]/g,'')
         t+=m+ (j<sA[2] ? '\t' :'')
      }
      t+='\r\n'
      if (i==sA[3]) break
   }
   try{_ta.value=t; _ta.select(); _ta.focus()} catch(e){};
}
function crlA (dv) {
   var i,j,s1=0,s2
   for (i=nextL(dv,1,0) || nextL(dv,-1,0); i!=Und;i=nextL(dv,-1,i))  s1=i
   for (i=s1; i!=Und;i=nextL(dv,1,i)) s2=i
   for (i=0; dv.columns[i] && dv.columns[i].w;i++) j=i
   return [0,s1,j,s2]
}   
function keyDown(e){
   e = e || Win.event
   var dv=this,s1,s2,j,i=dv.selectedRow,embed,kk=e.keyCode,ctrl=e.ctrlKey,dU=gridZ.dateU[dv.id]
   if (tC(s1=e.target || e.srcElement,'gz_inpFiltr')) {
      if (kk==13) { flush.call(dv); dv.filterApply(dv.aFilter,1)} ; return
   }
   if (kk==16 || kk==17 || kk==18 || !kk  || (s1=e.target || e.srcElement).tagName=='INPUT' && ( s1.id==dv.id+'-numRec'  || kk!=13 ) ) return //&& // ctrl alt shift

   if (s1.id==dv.id +'-numRec') return
   if (kk==67 && dv.ctrlC && ctrl && dv.startEdit<2  ) {copyBuf(dv); return true}
   if (kk==65 && dv.ctrlC && ctrl && dv.startEdit<2  ) {
      cSS(dv.selA1,abs+'width:'+ dv.rX1+'px;height:' + (kk=dv.b20.offsetHeight) +'px;')
      cSS(dv.selA2,abs+'width:'+ dv.rX2+'px;height:' + kk +'px;')
      dv.selA=crlA (dv)
      stopEv(e);return false
   }
   if (kk==88 && ctrl && dv.typG && dv.startEdit<2  && dv.allowInsert) {cutClick.call(dv) ; return}
   if (kk==86 && ctrl && dv.cut!=Und) {dv.insertClick([],1) ; return}
 //   if (ctrl) dv.ta.contentEditable=true
 // if (kk==86 && ctrl  && dv.startEdit<2  ) return
   if (kk==45 && dv.startEdit<2 && dv.allowDelete) {insertClick.call(dv) ; return}
   if (kk==46 && dv.startEdit<2 && dv.allowDelete) {deleteClick.call(dv) ; return}
   if (kk==16 || kk==17 || kk==18 || !kk) return  // ctrl alt
   if (kk==69 && ctrl) {dv.setStatus('Вы включили режим '+((dv.ext=!dv.ext) ? 'автоматического'  : 'ручного') + ' входа в режим редактирования');
       Memory(dv.id+'_ext',dv.ext);
   }  
   if (kk==70 && ctrl) {
      if (e.altKey)  { 
         dv.moveEnter=(i=dv.moveEnter)==2 ? 0 : i+1 ;
        dv.setStatus('Вы включили режим '+(!i ? 'переход вниз'  : i==1 ? 'оставаться на месте' : 'переход вправо') + ' по клавише Enter')
        Memory(dv.id+'_moveEnter',dv.moveEnter)
      } else {
        dv.allowFilter=dv.allowFilter==2 ? 0 : dv.allowFilter+1
        dv.requery(Und)
      }  
   }  
   
   if (kk==13 && (!dv.startEdit || (e.target || e.srcElement).enter)) {
     kk=(dv.moveEnter==2? -100 : dv.moveEnter==1 ? 40 : 39) ; ctrl=1
   }
   if (kk==27) {
      if (dv.inserting){
         deleting(dv,1,[i],i)
         dv.inserting=0
      }  else {
         if (dv.startEdit>1) endEditCell(dv)
         if (dv.startEdit) endEditRow(dv,3,1)
      }
      if (dU==Und || !dU.length ){
         dv.bufS=0
         requeryStatus(dv)
      }
      if (dv.selR1) aC(dv.sE=selelCell(dv,dv.selC),'gz_selEl')
      try{dv.ta.focus()}catch(e){}
   } else if (kk>32 && kk<41 && !e.shiftKey){
     if (dv.startEdit>1 && !ctrl ) return
     if (dv.chek && ctrl && !dv.editable && (kk==38 || kk==40)){
        for (j= i ; j== i || j!=Und && !dv.chek[j];j=nextL(dv,(kk==38 ? -1 : 1) ,j,0,1)){}
        dv.openNode(j)
        selEl_C(dv,j,dv.selC,0,kk ,(dv.sE && dv.sE.className)) 
        return false
     }
     keyMove(dv,kk)
     setTimeout(function(){dv.ta.focus()}, 1) 
     return false
   } else if(kk==-100){
     selEl_C(dv,dv.selectedRow,dv.selC,0,kk ,(dv.sE && dv.sE.className))
   } else if (!ctrl && (kk<112 || kk>123) && kk!=91 && ((embed=dv.nO(dv.selC).embed) || dv.startEdit<2)) {
      selEl(dv, dv.selectedRow, dv.selC, 0, kk, (dv.sE && dv.sE.className), 0, e.key)
      return false
   }
}

function keyMove(dv,kk){
  var c,hei=0,newR=dv.selectedRow,sR=newR,newC=dv.nOI(dv.selC),next,cn=dv.sE && dv.sE.className
  if (newR==Und) return
   if (kk==37 || kk==39){
      if (kk==37 && newC==0){
         newC=dv.columnCnt-1;kk=38
      } else if (kk==39 && newC+1==dv.columnCnt){
         newC=0;kk=40
      } else {
         newC=newC+( kk==37 ? -1 : 1)
      }
   }
   if(kk==40 || kk==38 ){
     newR=(kk==40 ?  nextL(dv,1,newR) : nextL(dv,-1,newR))
   }
   if (kk==34 || kk==33) {
      next=newR
      while( next!=Und && hei<dv.bd.offsetHeight) {
         hei+=gEl('h1-' + dv.id +'-' + next).offsetHeight
         newR=next
         next= (kk==34 ? nextL(dv,1,next) : nextL(dv,-1,next))
      }
   }
   newC=dv.columns[newC].nom
   if ( (newR!=sR || newC!=+dv.selC)) {

   if (!dv.startEdit) selEl(dv,newR,newC,0,-100 ,cn)
   else {
      if (newR!=sR) selEl_R(dv,newR,newC,0,-100 ,cn)
       else selEl_C(dv,newR,newC)
    }
   } else if (dv.startEdit>1) selEl_C(dv,sR,dv.selC,0,-100 ,cn)
   return newR
}
function gCOld(col,grC){ // из нового формата заполнение старого 
   var i,j,t,ln=col.length,grL=grC.length
   for (j=0;j<grL && (t=grC[j]);j++){ t[3]=Und;t[4]=Und }
   for (i=0;i<ln;i++){
      if (col[i].wid && col[i].gr!=Und){
         for (j=0;j<grL && (t=grC[j]);j++)
            if (t[8]==col[i].gr){
               t[3]=def(t[3],i)
               t[4]=i
            }
      }
   }
   for (i=0;i<grL && (t=grC[i]);i++)
      while (t[9]!=Und){
         for (j=0;j<grL && t[9] !=grC[j][8] ;j++){}
         grC[j][3]=Math.min(def(grC[j][3],999),t[3])
         grC[j][4]=Math.max(def(grC[j][4],0),t[4])
         t=grC[j]          
   }
   grC.sort(function(a,b){
   return a[3]==Und || a[3]>b[3] || a[3]==b[3] && a[4]<b[4] ? 1 :-1})
}
function zamen(dv,col1,col2){
   var i,g,h,t={},p={},sg1=col1,sL =1,sg2,r=(col1<col2 ? 1 : 0), grC=dv.groupCol,grL=grC.length,col=dv.columns,frezC=dv.frezC,oL=(~frezC && dv.tehColumn ? 20 :0)

   if (frezC>=col1 && frezC<col2 || frezC>=col2 && frezC<col1) return
   delSelA(dv)
   for (i=0;i<grL;i++) p[grC[i][8]]=i
   if ((g=col[col2].gr) !=Und) t[g]=col2
   while (g!=Und) t[def(g=grC[(i=p[g])][9],'_all_')] = grC[i][(r ? 4 : 3)]
    
   for (g=col[col1].gr; g !=Und && t[g]==Und; g=grC[p[g]][9]){
      sg1=grC[p[g]][3]
      sL=grC[p[g]][4]-sg1+1
   }
   sg2=def(t[def(g,'_all_')] ,col2)
   t=col.splice(sg1,sL); p=(r ? sL :0)
   for (i=0;i<t.length;i++) col.splice(sg2+r-p+i,0,t[i]) 
   gCOld(col,grC)
    
    // первые столбцы надо поменять класс
   for (h=0;h <grL && grC[h][3]!=Und;h++){
      gEl(grC[h][7]).className='gz_cl '+dv.id+'-col'+col[grC[h][3]].nom
   }
   for(h=0 ; h< col.length  && col[h].wid; h++) {
       addRule('.'+ dv.id +'-col' + col[h].nom,'left:'+oL + 'px');
        oL+=col[h].w+_padCX
        if (frezC==h) oL=0;
   }
}
function saveMeta(){
   var e= this
   while (e.className!= 'gz_s') e=e.parentNode
   var j,i,setDiv=e.grid,aRoot=setDiv.aRoot,aTr=[],dS=setDiv.dataS,chek=setDiv.chek,dSL=dS.length, dv=e.dv, colW=[]
   for(i=0;i<aRoot.length;i++) treeDown (setDiv,aRoot[i],2,aTr)
   
   for (j=0;j<dSL;j++)  if ((chek[i=aTr[j]] || dv.columns[dS[i][6]].vis==1) && dS[i][5] ) 
      colW.push([dS[i][5],dS[i][4]])   
   dv.aHei=[]
   loadSet(dv,colW)
   dv.requery(dv.scrY)
   dv.saveColumn()
}
function metaGet(e){
   e=e|| Win.event
   var el,grid,obj,dv=this,dS=[],i,j,p,grC=dv.groupCol,gL=grC.length,grL=-1,col=dv.columns,cL=col.length,cI
    if (_cO && _cO.parentNode) return
    stopEv(e)

   el=apDiv(0,dv,'gz_s','position:absolute;box-shadow: 1px 1px 10px 1px #888 inset;padding:10px;margin:10px;width:250px;right:2px;top:2px;background-color:#FFF;border:1px solid #888')
   el.innerHTML='<h3>Отображение столбцов</h3>'
   el.onkeydown=function (e){e=e ||Win.event; stopEv(e); return true }
   _cO=el
   apDiv(0,el,'zm_close').onclick=function() {
      var e= this
      while (e.className!= 'gz_s') e=e.parentNode
      if(e.parentNode) e.parentNode.removeChild(e)
      _cO=0
   }
   makeElem({typ:'Button',sty:'height:25px',elem:el,text:'Сохранить',click:saveMeta})
   makeElem({typ:'Button',sty:'height:25px',elem:el,text:'Сброс',click:function(){Memory(dv.id+'_colW',0,2);location.reload()}})
   apDiv(0,el,0,'clear:both')
   grid=apDiv(0,el,0,'display:block;max-height:200px;border: 1px solid #aaa;box-shadow: 1px 1px 5px 1px #888 ')
   grid.id="gz_s"
   el.dv=dv
   el.grid=grid
   for ( i=0;i<gL;i++){
      dS[i]=['g'+grC[i][8], 'g' + grC[i][9], grC[i][0], 0,0, 0, grC[i][3]>=0 ? grC[i][3] :  999]
   }
   for (i=0; i<cL;i++){
      cI=col[i]
      if (cI.head) dS.push(['c'+i,'g'+cI.gr,cI.head ,cI.vis==2 ? 0 : 1,cI.wid,cI.field,i])      
   }
   obj=gridZ.makeGrid('gz_s',{
      dataS:dS,ORF:['id_cl','id_parent','name','ch','j','f','ord'],
      columns:[{wid:'100%',field:'name',head:'столбец'},{field:'ord',typ:'int'}],
      colImg:'name',typG:1,check:1,resizable:0,checkSrc:'ch',openCheck:1,aSort:[['ord',1]],noSort:1
   })
   obj.requery(1)
}
function makeElem(obj){
   var typ=obj.typ,elI,elI2,elO=obj.elem,w,col=obj.columns,i,cl,dl,el
   if (typ=='Button'){
      elI=apDiv(6,elO,'zbutton', '')
      elI2=apDiv(2,elI,obj.classN,obj.sty)
      elI.getValue=elI.setValue=function() {return}
      elI2.innerHTML=obj.text
      elI2.onclick=obj.click
   } else if (elI=gridZ.makeEl[typ]){
     elI=elI(obj)
   } else {
      if (typ=='CE'){
         elI=apDiv(0,elO,obj.classN,obj.sty)
         elI.contentEditable=true
         elI.getValue=function(){ var el=this,f ; 
            return (f=el.n.filter) ? f(el) : el.innerHTML }        
         elI.setValue=function(n){
            this.innerHTML=n; 
            if (this.n.aRender) this.n.aRender(this) 
         }      
         elI.selectContent = selAll
      } else { //для всех прочих TextArea
         elI=apDiv(5,elO,obj.classN,obj.sty)
         elI.getValue=function(){ var el=this,f ; return (f=gridZ.filter[el.n.typ]) ? f(el.value) : el.value }
         elI.setValue=function(n, svOpts){
            var el=this; if(svOpts && svOpts.byUser) el.selectionStart=el.selectionEnd=1
            el.value=editRenderer(n, el.n) 
         }
         elI.selectContent = selAll
         elI.enter=obj.enter
      }  
      elI.startEdit=function(e){
         e.heiI=gridZ.setI(function(){if (e.clientHeight!=e.scrollHeight) e.style.height=e.scrollHeight + 'px'
         },500)
      }
      elI.resize=function(x,y){ var e=this,sty=e.style
          sty.width=sty.minWidth=(parseInt(e.parentNode.style.width)-_padCX)+'px'
          sty.height=sty.minHeight=(parseInt(e.parentNode.style.height)-_padCY) +'px'
      }
   }
   elI.filter=obj.filter
   return elI
}
function editRenderer (d,col) { var n={'inner':d}
   if (col.typ=='date' || col.typ=='datetime') { gridZ.cellRenderers[col.typ](n) ; d=n.inner} 
   return d
} 
 
function stopEv(e){
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();
}
function interval(){for (var j in intF) intF[j]() }

function Memory(m,val,r,z){
   var t=gEl('gzSaveMem'),l,t=t && t.className
   try {
      if (Win.JSON && (l=Win.localStorage)  && (t  || z) && (t=(z ? '' : t)+'_'+m) )
         if (r)  
            if (r==2) l.removeItem(t)
            else return JSON.parse(l.getItem(t))
         else l.setItem(t,JSON.stringify(val))
   } catch(e) {}
}
function sum(dS,h,depend,dv,c){
   var i,s=0
   for (i=dS.length;i--;)
      if (!( dS[i].d ||  dS[i].f)) {
         s+= parseFloat(depend ? depend.call(dv,dS[i][h],dS[i],c,i): dS[i][h]) || 0 
      }
   return ''+ s || ''
}

function avg(dS,h,all,depend,dv,c){
   var i,s=0,ln=dS.length,t,n,k=0
   for (i=ln;i--;)
      if (!(dS[i].d ||  dS[i].f)){
         t= parseFloat(depend ? depend.call(dv,dS[i][h],dS[i],c,i): dS[i][h])  
         s+=t || 0 
         if (!isNaN(t) || all) k++
      }  
   return ''+ k? s/k || '':''
}
function dat(str){
  var ar,dl,dn,dR,d1,d2,d3,ds,p,d,td=new Date(),tm=(td.getMonth()+1), dt,i,v,t,y,yp,m,mp,mec='янв|фев|мар|апр|мая|июн|июл|авг|сен|окт|ноя|дек|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|май'
  str=str.toLowerCase().replace(/(mon|tue|wed|thu|fri|sat|sun) /,''); ty=td.getFullYear()   
  if (ar=/^([+-]?)(\d*)([dwmyднмг])/.exec(str)){
     dl=( ar[2] || 0 ) *(ar[1]=='-' ? -1 : 1)
     if ((dn=ar[3]=='d') || dn=='д') td.setDate(td.getDate() +dl)
     else if ((dn=ar[3]=='w') || dn=='н') td.setDate(td.getDate() +7*dl)    
     else if ((dn=ar[3]=='m') || dn=='м') td.setMonth(td.getMonth() +dl)
     else  td.setFullYear(td.getFullYear() +dl)
     d=td.getDate()
     m=td.getMonth()+1
     y=td.getFullYear()    
  } else {
    ar=str.replace(/^ +/,'').replace(/ +$/,'').split(/[, ./-]+/)
    for ( i =0 ; i< 3 && i < ar.length ; i++){
        v=ar[i]
        if (t=/^\d{4}$/.exec(v) ) { y=v;yp=i+1}
        else if ( t=RegExp(mec).exec(v)) { m=1+mec.indexOf(t[0])/4; if (m>12) m-=12; if (m>12) m=5 ; mp=i+1}
        if (!i) d1=v
        else if (i==1) d2=v 
        else d3=v
     }
     if (i==3)
       if (yp==1) 
          if (mp) d=  mp!=3 ? d3 : d2 
          else  { d= d3 ; m=d2 } 
       else if (yp==3)            
          if (mp) d= mp==2 ? d1 : d2 
          else { d=d1; m=d2} 
       else  if ( mp==2) {y=d3; d=d1}   
       else  {y=d3 ; m=d2; d=d1}
    else if (i==2)
        if (yp) { d = 1; m= m || ( yp==1 ? d2 : d1) ; p='m'}
        else if (mp==1) {y= d2 ;d=1 ;p='m'}
        else {y=ty ;m=m || d2 ; d= d1 }
    else  if (yp) { m=1;d=1;p='y'}
        else if (mp) { y=ty;d=1;p='m'}
        else { y=ty; m=tm; d=d1}   
    y=y-0    
    y+= y < 100 ?  y  < 40 ? 2000 : 1900 : 0
  } 
  m= ((''+m).length>1 ? '' :'0')+m
  d=((''+d).length>1 ? '' :'0')+d
  dt=y+'-'+m+'-'+d;
  dR=d+'.' + m+ '.' + y
  ds=new Date(y,m-1,d)
  if (p=='m') ds.setMonth(m)
  else if (p=='y') ds.setFullYear(y+1)
  else ds.setDate(d-0+1)
  y=ds.getFullYear();m=ds.getMonth()+1;i=ds.getDate()
  if (ds=='Invalid Date' || d=='0') return {dt:'',ds:''}   
  else  return {'dt':dt,'ds':y+'-'+((''+m).length >1 ? '' :'0')+m+'-'+((''+i).length>1 ? '' :'0')+i,'dR':dR}    
}
function ss(str){var b='tg:phRyxuzm7kda1/',a='gZzbBtHqoFvp5w10cj3V',i; return (i=a.indexOf(str))>-1 ? b[i] : str  }
function fParser(str,typ){
  var d,d1,d2,s1,t,ar
  function pr(d,s){ return typ=='n' && d.indexOf('%')>0 ? d=d.replace('%','')/100  : typ=='s' && s ? d+"\u9999" : d  }
  if (typ=='n') str=str.replace(/,/g,'.').replace(/[^\d.-<>=%]/g,'')   
  ar= (typ=='s' && str[0]=='=') ? [str] : str.split('..')
  t=/^(!|\*|<>|>=|>|<=|<|\^|\=)?(.*)/.exec(ar[0])
  s1= (d2=ar[1]) ? '>='  : t[1] || (typ=='s' ? '*' : '='); d1=t[2]; 
  if (typ=='c') d1= /да|вкл|1/.exec(d1) ? '1' : /нет|выкл|0/.exec(d1) ? '0' : undefined
  if (typ=='d') { d=dat(d1); d1=d.dt}
  d1=pr(d1,s1=='<=')
  if (typ== 'n') d1=parseFloat(d1)

  if (d2) {
      if ( typ=='d') d2=dat(d2).ds
      d2=pr(d2,1)
      if ( typ=='n') d2=parseFloat(d2)
  }  else if (typ=='d' && (s1=='=') ) { s1='>='; d2=d.ds }
  return {'s1':s1,'d1':d1,'d2':d2} 
} 
function flush() {
   var dv=this,nom,v,f
   if (!_filEl) return 
   nom=_filEl.id
   f = dv.nOF(nom.substr(dv.id.length+6))
   if((v=_filEl.value) || v===0) dv.aFilter[f]=v
   else delete dv.aFilter[f]
   _filEl=0
}

function loadSet(dv,colW){
   if (colW && colW.length) {
      var w,i,lN=colW.length,c,colNew=[],o={},col=dv.columns,cL=col.length,s=dv.setting
      for (i=0;i<lN; i++){
         c=dv.nFC(colW[i][0])
         if (colW[i][1]){
            colNew.push(c)
            c.vis=c.vis==1 ? 1: 0
            c.wid=colW[i][1]
            o[c.field]=colW[i][1]   
         }
      }
      for (i=0;i<cL;i++){
         if (!o[col[i].field]) {
            colNew.push(c=col[i])
            c.vis=2
         }
      } 
      dv.columns=colNew
      dv.gCOld(dv.columns,dv.groupCol) 
   }
}
function ssl(str){ if (str==Und) return Und
   var j,i,l,s='',r='ёйцукенгшщзхъфывапролджэячсмитьбю.ХЪЖЭБЮ,',a="`qwertyuiop[]asdfghjkl;'zxcvbnm,./{}:"+'"<>?'
   return (str=(''+str).toLowerCase())
   for (i=0,l=str.length;i<l;i++)  s+=~( j=a.indexOf(str[i]) ) ? r[j] : str[i]
   return s 
}
function reFil(dv,fl,srv){
   
   var i,col,t,typ,arr=[] ,ar ,j  
   for (i in fl) {
      if (!fl[i]) continue
      col=dv.nFC(i)
   // if (t=col.depend) col=dv.nFC(t)           
      typ=col.typ
      typ= (typ=='date' || typ=='datetime')  ? 'd' : typ=='checkbox' ? 'c' : (typ == 'int' || typ=='money') ? 'n' : 's'
      if (fl[i]=='пусто' || fl[i]=='null') t='null'
         else {
         t=fParser(fl[i],typ)
         if (typ=='s') { t.d1=ssl(t.d1);  t.d2=ssl(t.d2)}
      }
      if (t.s1 == '!'){
         ar=t.d1.split('!')
         for (j=0;j<ar.length;j++)
            arr.push([col.nom,col.isHTML,{s1:'!',d1:ar[j]},typ,col])

      } else if (srv) {
         arr.push([col.field,t.s1,t.d1] )
         if (t.d2!==Und )  arr.push([col.field,typ=='d' ? '<': '<=',t.d2] )
      } else arr.push([col.nom,col.isHTML,t,typ,col])
   }
   return arr
}
gridZ={
   inpFocus:function(id){
      var el,oL,sL,oT=_presto ? 1 : 4  
      _filEl=el=gEl(id)
      setTimeout(function(){ if(_filEl) _filEl.select()},100)
      for (oL=el.offsetWidth-18;!tC(el,'gridZ');el=el.offsetParent){
         oT+=el.offsetTop
         oL+=el.offsetLeft
         sL=el.scrollLeft
      }
      _filEl.onchange=flush.bind(el)
      cSS(el.bFilter,"top:"+oT+"px;left:"+ (oL>el.rX1 ? oL-sL : oL)+ "px;")
   },
   dateU:{},
   setI:function(func,tO){
      var inc='a'+iv++
      intF[inc]=func
      if(!cntF++) inter=setInterval(interval,500)
      return inc
   },
   stopI:function(inc){
      delete intF[inc]
      if(cntF--==1) clearInterval(inter)
   },
   onEv:function(vid,id,ev){(_ev[vid]=_ev[vid] || {})[id]=ev},
   clEv:function(vid,id){delete _ev[vid][id]},
   swtchCSS:function(newCSS){//"../js/zLib/grid.files/grid_2.css"
      gEl('linkGridCss').href=newCSS
   },
   compFloat:function(a,b){
      var  aF=parseFloat(a),bF=parseFloat(b)
      if (isNaN(aF)) aF=-Infinity;if (isNaN(bF)) bF=-Infinity;
      if (aF==bF) return 0;
      return  (aF  <bF  ? -1 : 1)
    },
   compText:function(a,b){
      a=a ? a.toString().toLowerCase() : ''; b=b ? b.toString().toLowerCase() : ''
      return a==b ? 0 : a>b ? 1 : -1 
    },
   filter:{
       date:function(val){
         return dat(val).dt
       },
       money:function(val){
         var v= val.toString()
         return ((~v.indexOf('%')) ? (parseFloat(val)/100).toString()  : val ).replace(/ /g,'').replace(',','.').match(/^-?\d*\.?\d*/)[0]
      }
    },
   clickEl:{
  checkbox:function(dv,i,nom,el){
           if(el && (el==32||el==13||el.tagName=='BUTTON'))  {
           var v,st,ds=dv.dataS[i],cF=function(){
               dv.busy=0
               st=(!(+ds[nom])? 1 :0)
               if (!dv.startEdit) dv.aEdit=[]
               if (dv.aEdit[nom]==Und) dv.aEdit[nom]=st ? 0 : 1
               ds[nom]=st
               el=gEl(dv.id+'-embed-'+i+'-'+nom).firstChild
                  el.className='gz_chk'+st
                  setTimeout(function(){startedEd(dv,i,1)},1)
              }
              dv.busy=1
              if (v = dv.nO(nom).validate )       
                 v(dv,i,nom,((+ds[nom]) ? 0 : 1),cF,function(){ dv.busy=0})
              else cF()
          }
      },
      button:function(dv,i,nom,el){
        var b=el
        while (b && !tC(b,'zbutton'))  b=b.parentNode
        if(el && (el==32||el==13|| b))  {
            dv.nO(nom).click(dv,i,nom,el)
        }
      }
    }, 
   cellRenderers : {
      date : function(d) {
         var ar
         if((ar = /(\d{4})-(\d{2})-(\d{2})/.exec(d.inner))) {
            d.inner = ar[3]+'.'+ar[2]+'.'+ar[1]
         }; d.f='dd\/mm\/yyyy\;\@'
      },
      datetime : function(d) {
         var ar, hh, v
         if(ar = /(\d{4})-(\d{2})-(\d{2})(?: (\d{1,2}):(\d{2}))?/g.exec(d.inner)){
            hh = (v=ar[4]) ? ((v.length==1 ? '0' : '') + v) : '00'
            d.inner = ar[3]+'.'+ar[2]+'.'+ar[1]+ ' ' + hh + ':' + (ar[5]||'00')
            d.css='text-align:right;'
         }; d.f='dd\/mm\/yy\ \h\:mm\;\@'
      },
      'int' : function(d) { d.css='text-align:right;'; d.f='0' },
      checkbox : function(d) { d.inner='<button class="gz_chk'+(!d.inner || d.inner=='0' ? 0 :1  )+'"></button>'},
      button:function(d) {var dv=this
         d.inner='<a class="zbutton '+(dv.enableFunc && dv.enableFunc(dv,d.i,d.c) ? '' : 'disabled')+'"><button style="padding:0">'+d.inner+'</button></a>'
      },
      a:function(d){d.inner='<a target=_blank href="'+d.inner  +'" >' +( d.inner||'') + '</a>' },
      money : function(d) {
         var tCfg=def(d.tCfg,{}),dv=this,sep= def(tCfg.separator,'&nbsp;'),prec=def(tCfg.prec,2),cur=def(tCfg.cur,''),t,ar,
            v=d.inner, p=parseFloat(v)
         d.f=(sep=='' ? '' : '\#\,\#\#') + '0' + (prec ? '\\.' + '0000000'.substr(0,prec) : '')+cur
         if(v==='' || v===Und || v===null) {d.inner=''; return}
         if (t=tCfg.curSrc) {
           cur =dv.dataS[d.i][t=dv.nF(t)]
           if ((t=dv.nO(t)) && t.depend) cur=t.depend(cur) 
           d.cur=cur
         }  
         t=Math.pow(10,prec)
         if (p && cur=='%' && !~d.inner.toString().indexOf('%') ) p=p*100 
         ar=(Math.round(p*t)/t).toFixed(prec).toString().split('.')
         d.inner=!isNaN(t=ar[0]) ? t.replace(/(\d{1,3}(?=(\d{3})+(?:\.\d|\b)))/g,"\$1"+sep) + ((t=ar[1]) ? '.' + t : '') +cur : '-'
         d.css='text-align:right;'
      }
   },
   apDiv:apDiv,
   treeDown:treeDown,
   makeElem:makeElem,
   makeEl:{},
   makeGrid:function(elId,obj){
      if (typeof(elId)=='string') el=gEl(elId)
          else { el=elId;elId=elId.id} 
     var grC,ln,grL,col,t,p,j,i,el,l,n,o={noColSwap:0,groupCol:[],ORF:[],noData:'нет данных',noDataF:'нет выбранных данных',importExcel:0,captionExcel:'',allowFilter:-1,summary:0,busy:0,countRec:Und,ctrlC:0,headNom:0,noSort:0,setting:0,statusText:Und,levelOpen:0,
     typG:0,isHead:1,tehColumn:0,ext:Memory(elId+'_ext',0,1),moveEnter:Memory(elId+'_moveEnter',0,1),status:0,hRow:18,
     frezC:-1,buferMode:0,dataS:[],aFilter:{},columns:[],isButSave:1,resizable:1,editable:0,allowInsert:1,
     allowDelete:1,aSort:Memory(elId+'_aSort',0,1) || [],evFunc:[],checkParent:0,checkChild:0,checkTristate:1,imW:16,imH:16}
     if (!iv++) widthEl()
      aC(el,'gridZ')
   // el.style.overflow='hidden'
      
      // очистка tableUpdate
      gridZ.dateU[el.id]=Und
      el.bufS=0 

      for (i in o) el[i]=def(obj[i],o[i]) 
             
      for (el.del=0,i=el.dataS.length;i--;){
         if (el.dataS[i].d) el.del++
      }
      el.contFunc=el.evFunc['contFunc']
      el.spanFunc=el.evFunc['spanFunc']
      el.errFunc=el.evFunc['errFunc']  || function (dv,err,i,n){
         if (err=='notNull') { Win.alert('необходимо заполнить поле <' + dv.nO(n).head +'>' )}
         else if (err=='recNotUniq'){Win.alert ('запись с таким кодом уже есть')} 
         return 'err'
      }
      
      el.enableFunc=el.evFunc['enableFunc']
      el.updateRow=el.evFunc['updateRow'] || function(dv,n,a,p,d,cb){cb(dv,1,d,n)}
      el.updateSQL=el.evFunc['updateSQL'] || function(dv,st,c){c(1)}
      el.imFunc=el.evFunc['imFunc']
      el.saveColumn=el.evFunc['saveColumn'] || function(){
         var dv=this,col=dv.columns,ln=col.length,colW=[]
         for (i=0;i<ln;i++) if (col[i].vis!=2) colW.push([col[i].field,col[i].wid])
         Memory(dv.id+'_colW',colW)
      }
      el.startEdit=0;
      el.chekA=0// состояние главного чекита
      el.sortEl=[] // для удаления картинок с сортингами
      el.selectedRow=Und;
      gridZ.dateU[el.id]==Und
      el.aTree=[];
      el.aRoot=[];
      el.aEdit=[];
      el.aHei=[]; 
      el.requery=requery
      el.addRow=addRow
      el.makeTree=makeTree
      el.resize=resize
      el.updRow=updRow
      el.gCOld=gCOld
      el.tableRevert=tableRevert.bind(el)
      el.insertClick=insertClick.bind(el)
      el.selEl_R=selEl_R.bind(el)
      el.selEl_C=selEl_C.bind(el)
      el.deleteClick=deleteClick.bind(el)
      el.insRow=insRow
      el.unSel=unSel
      el.getValue=getValue
      el.setValue=setValue
      el.cheked=cheked
      el.tableSave=tableUpdate.bind(el)
      el.startedEd=startedEd
      el.hideColumn=function(fldH,fldV){
         var dv=this,col=dv.columns,i,c
         for (i=col.length;i--;) if ((c=col[i]).vis!=1){
            if (inArray(c.field,fldH || [])>=0) c.vis=2 
            if (inArray(c.field,fldV || [])>=0) c.vis=0 
         }
         dv.saveColumn()
         loadSet(dv,Memory(elId+'_colW',0,1))
         dv.requery(dv.scrY)
      } 
      el.setFVal=function (fld,val,i){
         var dv=this,n=dv.nF(fld)
         if (i==Und) i=dv.selectedRow
         else { 
              if (i==dv.selectedRow) dv.selEl_C(dv,i,n,1)
              else dv.selEl_R(dv,i,n,1)
              dv.startEdit=dv.bufS=1
         }      
         if (dv.aEdit[n]==Und) dv.aEdit[n]= dv.dataS[i][n] || ''
         dv.dataS[i][n]=val
         dv.updRow(i,[])
         selEl(dv,i,-1,1);requeryStatus(dv)
      }
      el.next=function(){return (keyMove(this,40)!=Und)}
      el.prev=function(){return (keyMove(this,38)!=Und) }
      el.restoreScroll=function(){
         var dv=this
         dv.bd.scrollTop=dv.bd.scrollHeight*dv.scrYP.offsetTop / dv.scY.scrollHeight
         dv.b2.scrollLeft=dv.b2.scrollWidth*dv.scrXP.offsetTop / dv.scX.scrollHeight
       }
      el.on=function(evC,func){this.evFunc[evC]=func; }
      el.triger=function(evC,args){if(this.evFunc[evC]) this.evFunc[evC].apply(this,args||[]) }
      el.findEl=function(aEl,noSel,noEv,noFocus){// массив значений , не выделять элемент
         var dv=this,j,i,dS=dv.dataS,dl=dS.length,l=aEl.length,t
         for (i =0; i< l;i++) { t=aEl[i];t[2]=dv.nF(t[0]);t[3]=dv.nFC(t[0]).isHTML  }
         for (i =0; i<dl; i++){
            for ( j=0; j <l && (aEl[j][3] ? toText(dS[i][aEl[j][2]])==toText(aEl[j][1]) : dS[i][aEl[j][2]]==aEl[j][1]) ;j++){}
              if  (j ==l) break
         }
         if (i!=dl) {
            if (!noSel) selEl_R(dv,i,-1,noEv,Und,Und,noFocus);
            return i
         }
         return Und
     }
     el.filterApply= decorEditCell(decorEditRow( function(fl,req){
       var f,k,dv=this,i,j,col,t,dd,typ,dS=dv.dataS,dL=dS.length,arr,m,u
        function poisk(){
          for (i=arr.length;i--;) { 
            t=arr[i]
            dd=dS[j][t[0]]
            if (u=t[4].depend) dd=u.call(dv,dd,dS[j],t[4],j);
            if (t[1] ) dd=toText(dd)
            if (t[3]=='s') dd=ssl(dd) || ''
            if (t[3]=='c') dd= !dd || dd=='0' ? 0 :1
            if (t[3]=='n') {dd= parseFloat(dd) ; if (isNaN(dd)) dd='' }
            t=t[2]
            if (t.s1=='>' && dd <=t.d1 || t.s1=='>=' && dd <t.d1 || t.s1=='<>' && dd ==t.d1 || t.s1=='<' && dd >=t.d1 || t.s1=='<=' && dd >t.d1 || t.s1=='=' && dd !=t.d1  || t.d2!=Und && dd>=t.d2 || t.s1=='!' && ~dd.indexOf(t.d1) || t.s1=='*' && dd.indexOf(t.d1)<0 || t.s1=='^' && dd.indexOf(t.d1)!=0 || t=='null' && dd!=='' && dd!=Und ) break   
          }
          i++
        }
        
         arr =reFil(dv,fl) 
         for ( j=0;j<dL;j++)  dS[j].f=arr.length && dv.allowFilter!=2  ? 1 :0
  // поиск
         if (dv.allowFilter==2){
            k=dv.typG ? dv.aRoot[0] : dv.aTree[0]
            for (j=def(dv.selectedRow,k), m=0;m<2;m++){
               for (;j!==Und;j=nextL(dv,1,j,0,1)) {
                  poisk()
                  if (!i && dv.selectedRow!==j) {
                     dv.openNode(j,1)
                     selEl_R(dv,j,-1)
                     return
                   }           
               }
               j=k; 
               if (!m && !Win.confirm('Достигнут конец файла. Продолжить дальше? ')) return
            }         
         } else {
// filter
         if (dv.evFunc['sSort']) {
           sortGrid(dv,1)
           return
         }  
         for ( j=0;j<dL;j++){
            poisk()
            dS[j].f=dS[j].f && i
            if (dv.typG && !i) 
               for (k=j; k !='_R_'; k=dv.aTree[k].p )
                   dS[k].f=0
         }
         if (req) { dv.requery(Und,1) }   
        } 
      }))

     el.resizeD=decorEditCell(decorEditRow(resize))
     el.openNode=function(aEl,r){
       var i,k,dv=this,t
       if (dv.typG==1){
         i=(typeof(aEl)=='object') ? dv.findEl(aEl,1) :aEl
         if( i==Und) return
         for (;i!='_R_';i=dv.aTree[i].p){
            if (dv.aTree[i].c.length){
                 dv.aTree[i].o=true
               k='-'+dv.id+'-'+i
               gEl('gr-h2'+k).style.display=gEl('gr-h1'+k).style.display= 'block' ;
               if (t=gEl('iO' +k)) t.className='gz_minus'
               else dv.updRow(i,[])
            }
         }
         if (r && dv.b2.offsetHeight> _scrW){
            dv.b20.style.height=dv.b2.offsetHeight- _scrW+'px'
            resizeScroll(dv,1)
         }
       }
     }
     el.update=decorEditCell(decorEditRow(function(){
       if (el.selR1) aC(el.sE=selelCell(el,-1),'gz_selEl')
      this.triger('afterupdate')
     }))

    el.nF=function(field){ var i,col=this.columns,l=col.length; for (i =0 ; i<l && col[i].field!=field;i++){}
      return ( l==i ? -1 : col[i].nom)
    }
    el.nFO=function(field){for (var i=0, col=this.columns, l=col.length ; i<l && col[i].field!=field;i++){}
      return ( l==i ? -1 : i)
    }
    el.nFC=function(field) { return this.columns[this.nFO(field)] }
    el.nO=function(nom){ var i,col=this.columns,l=col.length; for (i =0 ; i<l && col[i].nom!=nom;i++){}
      return ( l==i ? -1 : col[i])
    }
    el.nOI=function(nom){ var i,col=this.columns,l=col.length; for (i =0 ; i<l && col[i].nom!=nom;i++){}
      return ( l==i ? -1 : i)
    }
    el.nOF=function(nom){ var i,col=this.columns,l=col.length; for (i =0 ; i<l && col[i].nom!=nom;i++){}
      return ( l==i ? -1 : col[i].field)
    }
    el._contFunc=function(d){
      var dv=this,f=gridZ.cellRenderers[d.typ]
      if (f) f.call(dv,d)
      if (d.render) d.render(dv,d)
      if (dv.contFunc) dv.contFunc(d)
      if (d.disabled) d.className+=' gz_disabled'
      return d.inner
    }
    el.setStatus=function(tex){ var el,dv=this
      dv.statusText =tex;
      el=gEl(dv.id+'-statusText')
      if (el) el.innerHTML=tex;
    }
    el.row=function(i){ var h,col=this.columns
     if (i!=Und) {
      var r ={}; for (h=0 ;h<col.length;h++ ) r[col[h].field]=this.dataS[i][col[h].nom]
      return r
     }
    }
    el.setValues=function(vals){ var dv=this,i,m=[]
      for (i=0; i<vals.length; i++) m[i]=getI(dv,vals[i])
      for (i=0; i<dv.chek.length; i++ ) dv.cheked(gEl("h2-"+ dv.id+"-"+i) ,(~inArray(i,m) ? 1 :0))
    }
    col=el.columns;ln=col.length
    el.startCol=[]
    t=[]
    for (i=0;i<ln;i++) {
      p=col[i] 
      if (p.sortSrc) p.depend=p.sortSrc
      if (typeof (j=p.depend) =='string') {
         p.dependField=j
         p.depend=function(v, aRow, col, i) {
            return aRow[inArray(col.dependField, el.ORF)]
         }
      }        
      el.startCol[i]=[p.field,p.vis==2 ? 0 :p.wid];
      if (p.ai) obj.fldId=p.field
      t[p.nom=inArray(p.field,el.ORF)]=1
    } 
    for (i=0;i<el.ORF.length;i++) if (!t[i]) col.push({'field':el.ORF[i],'nom':i})
    if (el.typG){
      el.fldId= obj.fldId || (ln ? el.nOF(0) : Und);
      el.fldParent= obj.fldParent || (ln ? el.nOF(1) : Und);
    }   
    el.key=[]
    if (obj.pKey) {
      for (i=0,l=obj.pKey.length;i<l; i++) el.key[i]=el.nF(obj.pKey[i])
    } else  el.key[0] =  el.nF(el.fldId)
    el.colImg=obj.colImg
    if (obj.fldKnowOpen) el.know=el.nF(obj.fldKnowOpen)
    el.makeTree(-1) 
    if (obj.check) {
      for (i=0,el.chek=[],l=el.dataS.length ; i<l;i++) el.chek[i]=0;
      if (o=obj.checkValue){
         for (j=0,l=o.length;j<l; j++ ){
            i=getI(el,o[j])
            if (~i) el.chek[i]=1
         }        
      } 
      if (o=obj.checkSrc){
         for (i=0,j=el.nF(o),l=el.dataS.length;i<l; i++ ) {
            t=el.dataS[i][j]
            t=!t || t=='0' ? 0 : 1
            if (t) el.cheked(i,1)
            if (obj.openCheck && t){
               o=i
               while (el.aTree[o]) {
                  el.aTree[o].o=true;
                  o=el.aTree[o].p
               }
            }
         }   
      }
    } else el.chek=0
    if (obj.openNodes){
      o=obj.openNodes
      for (j=0,l=o.length;j<l;j++){
         i=getI(el,o[j])
         while (el.aTree[i]) {
            el.aTree[i].o=true;i=el.aTree[i].p
         }
      }
    }
    if ( obj.levelOpen==2){
      for (i=0;i<el.aTree.length;i++){
         if (el.aTree[i].l) el.aTree[i].o=true
      }
    } else if ( obj.levelOpen){
      for (i=0;i<el.aRoot.length;i++){
         j=el.aTree[el.aRoot[i]]
         if (j.l) j.o=true        
      }
    }
    if ((grC=el.groupCol) && (grL=grC.length)){
      for (i=0;i<grL;i++){
         p=grC[i]
         p[3]=el.nFO(p[1])
         p[4]=el.nFO(p[2])
         p[8]=p[9]=Und
      }
      for (i=0;i<grL;i++)
        for (grC[i][8]=i,t=grC[i],j=0;j<grL && (p=grC[j]);j++)
          if (i!=j && p[3]<=t[3] && p[4]>=t[4] && ( i>j || p[3]!=t[3] || p[4]!=t[4])   && ((n=t[9])==Und ||  p[3]>=grC[n][3] && p[4]<=grC[n][4] ) )  t[9]=j
      for (i=0;i<ln;i++)
        for (j=0;j<grL;j++)
          if ((i>=(t=grC[j])[3] && i<=t[4]) && ((n=col[i].gr)==Und ||  t[3]>=grC[n][3] && t[4]<=grC[n][4] ) ) col[i].gr= j
    } 
     loadSet(el,Memory(elId+'_colW',0,1) ||  obj.colW || el.startCol)
     if (!el.evFunc['sSort'] ) el.filterApply(el.aFilter,0)
     return el
    }
};
(function(){
   startEditCell=decorStartEdit(startEditCell)
   //for (el in gridZ.clickEl)
   //gridZ.clickEl[el]=decorStartEdit(gridZ.clickEl[el])
   selEl_R=decorEditRow(selEl)
   selEl_R=decorEditCell(selEl_R)
   selEl_C=decorEditCell(selEl)
   insertClick=decorEditCell(decorEditRow(insertClick))
   deleteClick=decorEditCell(decorEditRow(deleteClick))
   tableUpdate=decorEditCell(decorEditRow(tableUpdate))
   sortClick=decorEditCell(decorEditRow(sortClick))
   zamen=decorEditCell(zamen)
   dragStart=decorEditCell(dragStart)

   var el,p,d=Win.ontouchend==Und && !(p=Win.navigator.msPointerEnabled) ? Doc :Win,t=('ontouchstart' in window) ? 0 : p ? 1 :2
   addEvent(d,t==2 ? 'mouseup' : t ? 'MSPointerUp' : 'touchend', function(e){ e=e || event; for (var i in _ev.up) _ev.up[i](e)} )
   addEvent(d,t==2 ? 'mousemove' : t ? 'MSPointerMove' : 'touchmove', function(e){ e=e || event; for (var i in _ev.move) _ev.move[i](e)})
   addEvent(d,t==2 ? 'mousedown' : t ? 'MSPointerDown' :'touchstart', function(e){ e=e || event; for (var i in _ev.down) _ev.down[i](e)} )
   addEvent(d,'keyup', function(e){ e=e || event; for (var i in _ev.keyup) _ev.keyup[i](e)} )

   if (Win.gZPlagin && (el=Win.gZPlagin.gridZ)) for (d in el) el[d]() 
   Win.gZPlagin=0
   Win.gridZ=gridZ
 })();

function apDiv(vid,par,clN,sth,id,bef,titl){
   var z=['div','img','button','style','span','textarea','a','iframe','input'],el
    el=document.createElement(z[vid]||vid);
    if (sth) cSS(el,sth)
    if (titl) el.title=titl
    if (clN) el.className=clN;
    if (par) 
      if (bef) par.insertBefore(el,bef) 
      else par.appendChild(el) 
    if (id) el.id=id;
    return el
}
}) ()
// конец вставки zGrid
}
/*
1. function widthEl() {
  var ...,bs
  ...
   if((bs=$(_cEl).css('boxSizing')) && !bs || bs != 'border-box') {
      _padCX=w-_cEl.offsetWidth
      _padCY=h-_cEl.offsetHeight
   }
  ...
2. Находим строку по kk<112 и меняем на 
} else if ((kk<112 || kk>123) && kk!=91 && ((embed=dv.nO(dv.selC).embed) || dv.startEdit<2)) {

3. if ((el.doLoad=el.evFunc['doLoad']) && !el.typG ){
   ... } переносим в начало function requery

4. function updRow(row,aData){
   var rObj,rEl1,rEl2,i=row,staLen =0,dv=this 
   ...
   // сброс кэша вычисляемых полей здесь (при изменении полей, при установке через setFVal)
   $(dv).data(Plugin).calcCache[row] = null
*/

$.extend($.fn[Plugin], {
   typeRenderers : gridZ.cellRenderers,
   typeFilters : gridZ.filter,
   gridZ : gridZ,
   sorters : {
      'float' : gridZ.compFloat,
      'text' : gridZ.compText
   }})

}) ();
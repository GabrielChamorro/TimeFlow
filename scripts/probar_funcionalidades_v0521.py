"""Regresión HTTP V0.5.21: solo servidor local con base DE PRUEBAS independiente.
Requiere TF_TEST_CONFIRM=TIMEFLOW_TEST_ONLY, TF_TEST_ADMIN_PASSWORD,
TF_TEST_USER_PASSWORD; opcionales TF_TEST_URL, TF_TEST_ADMIN_EMAIL, TF_TEST_OUTPUT.
Crea registros sintéticos con prefijo único; no elimina tablas ni accede a MySQL directo.
No registra cookies, JWT ni contraseñas.
"""
import concurrent.futures,datetime,json,os,pathlib,time,urllib.parse
import probar_sprint6 as s

def run():
    uri=urllib.parse.urlparse(s.BASE)
    if os.environ.get('TF_TEST_CONFIRM')!='TIMEFLOW_TEST_ONLY' or uri.hostname not in ('127.0.0.1','localhost'):
        raise RuntimeError('Se requiere entorno local de pruebas confirmado')
    if not s.PASSWORD:raise RuntimeError('Falta TF_TEST_USER_PASSWORD')
    a,_=s.login(os.environ.get('TF_TEST_ADMIN_EMAIL','admin@sprint6.test'),os.environ['TF_TEST_ADMIN_PASSWORD'])
    u=s.create_user(a,'funciones21');other=s.create_user(a,'funciones-ajenas21')
    w,_=s.login(u['email'],s.PASSWORD);o,_=s.login(other['email'],s.PASSWORD)
    for token in [w,o]:s.check('Check-in funcional',s.request('POST','/api/jornadas/check-in',token)[0],201)
    for missing in ['nombre','meta','fechaLimite']:
        invalid={'nombre':'Prueba','meta':'Resultado','fechaLimite':'2030-12-01T18:00'};invalid.pop(missing)
        s.check('Crear sin '+missing,s.request('POST','/api/tareas',w,data=invalid)[0],400)
    t=s.create_task(w,'Funciones21 A',bitacora='Texto inicial conservado');b=s.create_task(w,'Funciones21 B');c=s.create_task(o,'Funciones21 C')
    route=f"/api/tareas/{t['id']}";notes=route+'/registros'
    s.check('Notas sin sesión',s.request('GET',notes)[0],401)
    s.check('Ajeno no lee notas',s.request('GET',notes,o)[0],403)
    s.check('Ajeno no agrega notas',s.request('POST',notes,o,data={'contenido':'No admitida'})[0],403)
    with concurrent.futures.ThreadPoolExecutor(2) as pool:
        results=list(pool.map(lambda text:s.request('POST',notes,w,data={'contenido':text}),['Nota paralela A','Nota paralela B']))
    s.condition('Dos notas simultáneas conservadas',all(r[0]==201 for r in results))
    current=s.request('GET',notes,w)[1];s.condition('Notas con autor y hora servidor',current['totalElements']==3 and all(n['autorId']==u['id'] and n['creadoEnMs']>0 for n in current['content']))
    s.condition('Contenido paralelo aislado',{'Nota paralela A','Nota paralela B'}<={n['contenido'] for n in current['content']})
    s.condition('Notas paginadas en servidor',len(s.request('GET',notes+'?size=1',w)[1]['content'])==1)
    t=s.request('PUT',route,w,data=t|{'estado':'En Revisión'})[1]
    s.check('Revisión bloquea nuevas notas',s.request('POST',notes,w,data={'contenido':'No admitida'})[0],403)
    s.check('Rechazo sin motivo',s.request('PUT',route,a,data=t|{'estado':'En Progreso'})[0],400)
    s.check('Trabajador no rechaza',s.request('PUT',route,w,data=t|{'estado':'En Progreso','motivoRechazo':'No permitido'})[0],403)
    rejected=s.request('PUT',route,a,data=t|{'estado':'En Progreso','motivoRechazo':'Completar evidencia de prueba'})
    s.check('Rechazo válido',rejected[0],200)
    s.check('Rechazo obsoleto no duplica historial',s.request('PUT',route,a,data=t|{'estado':'En Progreso','motivoRechazo':'Obsoleto'})[0],409)
    log=s.request('GET',notes+'?tipo=RECHAZO',w)[1];s.condition('Responsable consulta motivo histórico',log['totalElements']==1 and log['content'][0]['contenido']=='Completar evidencia de prueba')
    t=rejected[1]
    for task,token in [(t,w),(b,w),(c,o)]:
        path=f"/api/tareas/{task['id']}";review=s.request('PUT',path,token,data=task|{'estado':'En Revisión'})
        s.check('Enviar a revisión',review[0],200)
        closed=s.request('PUT',path,a,data=review[1]|{'estado':'Finalizada'})
        s.check('Aprobar tarea',closed[0],200);s.condition('Cierre timestamp servidor',closed[1]['finalizadaEnMs']>0)
    query=urllib.parse.quote(s.PREFIX+' Funciones21');path='/api/tareas/historial?query='+query
    first=s.request('GET',path+'&size=1',w)[1];second=s.request('GET',path+'&size=1&page=1',w)[1]
    s.condition('Historial propietario dos páginas',first['totalElements']==2 and len(first['content'])==1 and first['content'][0]['id']!=second['content'][0]['id'])
    s.condition('Administrador incluye ambos responsables',s.request('GET',path,a)[1]['totalElements']==3)
    s.condition('Ajeno solo consulta su tarea',s.request('GET',path,o)[1]['totalElements']==1)
    s.condition('Resumen no descarga bitácoras ni evidencia','bitacora' not in first['content'][0] and 'evidencia' not in first['content'][0])
    today=datetime.datetime.now(datetime.timezone.utc).date().isoformat()
    s.condition('Filtro fecha de cierre inclusivo',s.request('GET',path+f'&desde={today}&hasta={today}',w)[1]['totalElements']==2)
    s.check('Fecha inválida',s.request('GET',path+'&desde=2026-02-30',w)[0],400)
    s.check('Detalle propio',s.request('GET',route,w)[0],200);s.check('Detalle ajeno',s.request('GET',route,o)[0],403)
    s.check('Finalizada bloquea notas',s.request('POST',notes,w,data={'contenido':'No admitida'})[0],403)
    s.check('Checkout sintético',s.request('POST','/api/jornadas/check-out',w)[0],200)
    jornada=s.request('GET','/api/jornadas/actual',w)[1]
    parse=lambda text:datetime.datetime.fromisoformat(text.replace('Z','+00:00'))
    s.condition('Duración coincide con datos de servidor',not jornada['activa'] and jornada['duracionSegundos']==int((parse(jornada['checkOutAt'])-parse(jornada['checkInAt'])).total_seconds()))

if __name__=='__main__':
    error=None
    try:run()
    except Exception as ex:error=type(ex).__name__+': '+str(ex);raise
    finally:
        pathlib.Path(os.environ.get('TF_TEST_OUTPUT','funcionalidades-v0521.json')).write_text(json.dumps({'version':'0.5.23-SNAPSHOT','tests':s.RESULTS,'error':error},indent=2,ensure_ascii=False),encoding='utf8')

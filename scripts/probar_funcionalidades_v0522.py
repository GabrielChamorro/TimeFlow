"""Pruebas V0.5.22 sobre servidor LOCAL con MySQL DE PRUEBAS ya migrado.
Requiere TF_TEST_CONFIRM=TIMEFLOW_TEST_ONLY, TF_TEST_ADMIN_PASSWORD y
TF_TEST_USER_PASSWORD. Opcionales TF_TEST_URL, TF_TEST_OUTPUT y TF_TEST_ADMIN_EMAIL.
Solo crea registros sintéticos y opera mediante HTTP; no reinicia procesos ni cambia el esquema.
"""
import concurrent.futures,json,os,pathlib,time,urllib.parse
import probar_sprint6 as s
uri=urllib.parse.urlparse(s.BASE)
if os.environ.get('TF_TEST_CONFIRM')!='TIMEFLOW_TEST_ONLY' or uri.hostname not in ('127.0.0.1','localhost'):
 raise RuntimeError('Se requiere servidor local de pruebas confirmado')
if not s.PASSWORD:raise RuntimeError('Falta TF_TEST_USER_PASSWORD')
a,_=s.login(os.environ.get('TF_TEST_ADMIN_EMAIL','admin@sprint6.test'),os.environ['TF_TEST_ADMIN_PASSWORD']);u=s.create_user(a,'cronometros22');v=s.create_user(a,'ajeno-clock22');w,_=s.login(u['email'],s.PASSWORD);w2,_=s.login(u['email'],s.PASSWORD);o,_=s.login(v['email'],s.PASSWORD)
s.check('Jornada para cronómetros',s.request('POST','/api/jornadas/check-in',w)[0],201)
route='/api/tareas/sincronizacion'
def snap(token=w):
 code,data,headers=s.request('GET',route,token);s.check('Sincronización válida',code,200);s.condition('Sincronización no almacenable en caché',headers.get('Cache-Control')=='no-store');return data
def clocks(token=w):return {t['id']:t for t in snap(token)['tasks']}
def get(t):return s.request('GET',f"/api/tareas/{t['id']}",w)[1]
def change(t,state,token=w,**extra):
 code,data,_=s.request('PUT',f"/api/tareas/{t['id']}",token,data=t|{'estado':state}|extra);s.check('Cambiar a '+state,code,200);return data
s.check('Metadatos requieren sesión',s.request('GET',route)[0],401)
tasks=[]
for label in ['A','B','C']:
 before=int(time.time()*1000);t=s.create_task(w,'Cronómetro '+label);after=int(time.time()*1000)
 s.condition('Ancla '+label+' originada por servidor',before<=t['tiempoInicioMs']<=after and t['tiempoAcumuladoMs']==0)
 tasks.append(t);time.sleep(1.1)
A,B,C=tasks;initial=clocks()
s.condition('Tres anclas diferentes y ordenadas',A['tiempoInicioMs']<B['tiempoInicioMs']<C['tiempoInicioMs'])
s.condition('Crear B y C no reinicia A',initial[A['id']]['tiempoInicioMs']==A['tiempoInicioMs'])
s.condition('Jornada propia incluida',snap()['ownJornada']==s.request('GET','/api/jornadas/actual',w)[1])
s.condition('Ajeno ve mapa pero no cronómetros privados',all(clocks(o)[t['id']]['tiempoInicioMs'] is None and clocks(o)[t['id']]['tiempoAcumuladoMs'] is None for t in tasks))
s.condition('Administrador puede supervisar cronómetros',clocks(a)[A['id']]['tiempoInicioMs']==A['tiempoInicioMs'])
code,note,_=s.request('POST',f"/api/tareas/{B['id']}/registros",w,data={'contenido':'Nota aislada cronómetro B'});s.check('Agregar nota B',code,201)
latest=clocks();s.condition('Nota detectada por metadatos sin alterar tiempos',latest[B['id']]['ultimoRegistroId']==note['id'] and all(latest[t['id']]['tiempoInicioMs']==t['tiempoInicioMs'] for t in tasks))
forged=get(A)|{'tiempoAcumuladoMs':99999999,'tiempoInicioMs':1,'metaCumplida':True}
code,A,_=s.request('PUT',f"/api/tareas/{A['id']}",w,data=forged);s.check('Edición normal con campos de reloj inyectados',code,200);s.condition('Servidor ignora reloj del cliente',A['tiempoAcumuladoMs']==0 and A['tiempoInicioMs']==tasks[0]['tiempoInicioMs'])
B=change(get(B),'En Revisión');paused=B['tiempoAcumuladoMs'];s.condition('Revisión congela segmento',paused>0 and B['tiempoInicioMs'] is None);time.sleep(1.1)
s.condition('Revisión no acumula tiempo',get(B)['tiempoAcumuladoMs']==paused and get(B)['tiempoInicioMs'] is None)
B=change(B,'En Progreso',a,motivoRechazo='Continuar prueba temporal');s.condition('Rechazo retiene acumulado y abre nuevo segmento',B['tiempoAcumuladoMs']==paused and B['tiempoInicioMs']>tasks[1]['tiempoInicioMs'])
B=change(B,'En Revisión');B=change(B,'Finalizada',a);final=B['tiempoAcumuladoMs'];time.sleep(1.1)
s.condition('Finalizada permanece detenida',get(B)['tiempoAcumuladoMs']==final and get(B)['tiempoInicioMs'] is None)
s.check('Finalizada no admite edición que reactive reloj',s.request('PUT',f"/api/tareas/{B['id']}",a,data=B|{'estado':'En Progreso'})[0],403)
oldC=get(C);s.check('Desactivar C',s.request('DELETE',f"/api/tareas/{C['id']}",w)[0],204)
s.condition('Baja oculta C en sincronización',C['id'] not in clocks())
time.sleep(1.1);code,C,_=s.request('PATCH',f"/api/tareas/{C['id']}/reactivar",a);s.check('Reactivar C',code,200);s.condition('Reactivación conserva acumulado e inicia segmento nuevo',C['tiempoAcumuladoMs']>=oldC['tiempoAcumuladoMs'] and C['tiempoInicioMs']>oldC['tiempoInicioMs'])
currentA=get(A)
with concurrent.futures.ThreadPoolExecutor(2) as pool:results=list(pool.map(lambda token:s.request('PUT',f"/api/tareas/{A['id']}",token,data=currentA|{'estado':'En Revisión'}),[w,w2]))
s.condition('Dos sesiones modifican estado: una 200 y una 409',sorted(r[0] for r in results)==[200,409]);A=next(r[1] for r in results if r[0]==200)
s.condition('Conflicto no duplica ni reinicia el segmento detenido',get(A)['tiempoAcumuladoMs']==A['tiempoAcumuladoMs'] and get(A)['tiempoInicioMs'] is None)

report={'version':'0.5.23-SNAPSHOT','scope':'HTTP real; reinicios y navegador se comprueban por separado','checks':s.RESULTS,'passed':all(x['passed'] for x in s.RESULTS)}
output=pathlib.Path(os.environ.get('TF_TEST_OUTPUT','cronometros-v0522.json'));output.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print('CHECKS',len(s.RESULTS))

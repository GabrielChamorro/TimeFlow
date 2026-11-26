"""Integración de sesiones contra entorno local desechable. Python estándar.
TF_TEST_CONFIRM=TIMEFLOW_TEST_ONLY, TF_TEST_ADMIN_PASSWORD y JWT de prueba breve.
No registra cookies/JWT/contraseñas; conserva solo resultados. No toca SQL.
"""
import concurrent.futures, http.cookiejar, json, os, pathlib, time, urllib.error, urllib.parse, urllib.request, uuid
BASE=os.environ.get('TF_TEST_URL','http://127.0.0.1:18086')
ORIGIN=os.environ.get('TF_TEST_ORIGIN','http://127.0.0.1:15176')
RESULTS=[]
def check(name,ok):
 RESULTS.append({'case':name,'passed':bool(ok)});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
 if not ok:raise AssertionError(name)
class Client:
 def __init__(self):
  self.jar=http.cookiejar.CookieJar();self.opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar));self.token=None
 def request(self,method,path,data=None,token=None,cookie=True,headers=None):
  h={'Origin':ORIGIN,'X-TimeFlow-CSRF':'1',**(headers or {})}
  if token:h['Authorization']='Bearer '+token
  raw=None
  if data is not None:raw=json.dumps(data).encode();h['Content-Type']='application/json'
  req=urllib.request.Request(BASE+path,data=raw,headers=h,method=method)
  try:
   with (self.opener.open(req,timeout=30) if cookie else urllib.request.urlopen(req,timeout=30)) as r:code,body,rh=r.status,r.read(),r.headers
  except urllib.error.HTTPError as r:code,body,rh=r.code,r.read(),r.headers
  try:body=json.loads(body) if body else None
  except ValueError:pass
  return code,body,rh
 def login(self,email,pw):
  code,b,h=self.request('POST','/api/auth/login',{'email':email,'password':pw})
  check('login correcto',code==200);self.token=b['token'];return b,h
 def refresh(self):
  code,b,h=self.request('POST','/api/auth/refresh')
  if code==200:self.token=b['token']
  return code,b,h
 def cookie(self):return next((c.value for c in self.jar if c.name=='tf_refresh'),None)
 def api(self,path='/api/usuarios',token=None):return self.request('GET',path,token=token or self.token,cookie=False)[0]

def run(restart=None):
 if os.environ.get('TF_TEST_CONFIRM')!='TIMEFLOW_TEST_ONLY':raise RuntimeError('Solo entorno confirmado desechable')
 if urllib.parse.urlparse(BASE).hostname not in ('127.0.0.1','localhost'):raise RuntimeError('Solo loopback')
 admin=Client();admin.login(os.environ.get('TF_TEST_ADMIN_EMAIL','admin@sprint6.test'),os.environ['TF_TEST_ADMIN_PASSWORD'])
 email='s19-'+uuid.uuid4().hex[:8]+'@local.test';pw=os.environ['TF_TEST_USER_PASSWORD']
 code,user,_=admin.request('POST','/api/usuarios',{'nombre':'Prueba renovación','email':email,'password':pw,'rol':'trabajador','estado':'activo'},token=admin.token,cookie=False)
 check('crear cuenta sintética',code==201);route='/api/usuarios/'+str(user['id'])
 a,b=Client(),Client();login,headers=a.login(email,pw);b.login(email,pw)
 sc=headers.get('Set-Cookie','')
 check('cookie HttpOnly, SameSite Strict, ruta limitada y persistente',all(x in sc for x in ['HttpOnly','SameSite=Strict','Path=/api/auth','Max-Age=']))
 check('respuesta login no incluye renovación ni hashes','refresh' not in login and 'passwordHash' not in login['user'])
 check('no-cache de login',headers.get('Cache-Control')=='no-store')
 old=a.cookie();a.token=None
 check('restauración tipo F5',a.refresh()[0]==200 and a.api()==200)
 check('rotación cambia cookie',old!=a.cookie())
 # Restauración desde un nuevo cliente con el almacén de cookies persistentes del navegador.
 reopened=Client()
 for cookie in a.jar:reopened.jar.set_cookie(cookie)
 check('nuevo cliente restaura cookie aún vigente',reopened.refresh()[0]==200 and reopened.api()==200)
 a=reopened
 check('cookie sola no autentica API de datos',a.request('GET','/api/usuarios')[0]==401)
 for headers in [{'Origin':'http://evil.test'},{'Origin':'null'},{'X-TimeFlow-CSRF':''},{'Origin':''}]:
  check('CSRF no autorizado se rechaza',a.request('POST','/api/auth/refresh',headers=headers)[0]==403)
 # Simultáneas con idéntico token: ganador 200, duplicada 409, familia no se invalida.
 current=a.cookie()
 def same_cookie():return Client().request('POST','/api/auth/refresh',headers={'Cookie':'tf_refresh='+current})
 with concurrent.futures.ThreadPoolExecutor(2) as pool:responses=list(pool.map(lambda _:same_cookie(),range(2)))
 check('renovación simultánea 200 y 409',sorted(r[0] for r in responses)==[200,409])
 winner=next(r for r in responses if r[0]==200)
 winnerCookie=winner[2].get('Set-Cookie').split(';')[0].split('=',1)[1]
 check('ganador conserva acceso',a.api(token=winner[1]['token'])==200)
 # Recuperar cookie ganadora sin imprimirla.
 for cookie in a.jar:
  if cookie.name=='tf_refresh':cookie.value=winnerCookie
 expiry=int(os.environ.get('TF_TEST_ACCESS_WAIT_SECONDS','5'))
 expired=a.token;time.sleep(expiry)
 check('JWT breve expira',a.api(token=expired)==401)
 check('renovación después de expirar acceso',a.refresh()[0]==200 and a.api()==200)
 # Reutilización fuera de ventana de 5 s revoca también el último acceso.
 check('reutilización vieja rechazada',Client().request('POST','/api/auth/refresh',headers={'Cookie':'tf_refresh='+current})[0]==401)
 check('reutilización revoca familia activa',a.api()==401 and a.refresh()[0]==401)
 check('otra sesión independiente sigue vigente',b.refresh()[0]==200)
 a=Client();a.login(email,pw);old_access=a.token
 check('logout confirmado',a.request('POST','/api/auth/logout')[0]==204)
 check('logout elimina cookie',a.cookie() is None)
 check('logout seguido de F5 no restaura',a.refresh()[0]==401 and a.api(token=old_access)==401)
 admin.refresh()
 check('desactivación',admin.request('DELETE',route,token=admin.token,cookie=False)[0]==204)
 check('cuenta inactiva no renueva',b.refresh()[0]==401)
 check('reactivación',admin.request('PATCH',route+'/reactivar',token=admin.token,cookie=False)[0]==200)
 check('reactivar no restaura cookie anterior',b.refresh()[0]==401)
 b=Client();b.login(email,pw)
 current=admin.request('GET',route,token=admin.token,cookie=False)[1]
 check('cambio de contraseña desde administrador',admin.request('PUT',route,current|{'password':os.environ['TF_TEST_NEW_PASSWORD']},token=admin.token,cookie=False)[0]==200)
 check('contraseña nueva invalida renovación y acceso',b.refresh()[0]==401 and b.api()==401)
 b=Client();b.login(email,os.environ['TF_TEST_NEW_PASSWORD'])
 if restart:
  revoked=old_access;active=b.token;restart()
  check('JWT activo tras reiniciar backend',b.api(token=active)==200)
  check('renovación válida tras reiniciar backend',b.refresh()[0]==200)
  check('JWT revocado sigue rechazado tras reinicio',b.api(token=revoked)==401)
 check('logout final',b.request('POST','/api/auth/logout')[0]==204)
 return {'version':'0.5.23-SNAPSHOT','checks':RESULTS,'passed':all(x['passed'] for x in RESULTS),'backendRestarted':bool(restart),'browserFullExitTested':False}
if __name__=='__main__':
 result=run();pathlib.Path(os.environ.get('TF_TEST_OUTPUT','sesiones-v0519.json')).write_text(json.dumps(result,indent=2,ensure_ascii=False),encoding='utf8')

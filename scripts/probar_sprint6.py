"""Pruebas HTTP reales, solo para un entorno local desechable. Python 3 estándar.
Requiere TF_TEST_CONFIRM=TIMEFLOW_TEST_ONLY y TF_TEST_ADMIN_PASSWORD.
No imprime JWT ni contraseñas. Conserva registros sintéticos para inspección/recarga.
"""
import concurrent.futures as futures
import hashlib
import io
import json
import os
import pathlib
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
import zipfile

BASE = os.environ.get('TF_TEST_URL', 'http://127.0.0.1:18086')
OUT = pathlib.Path(os.environ.get('TF_TEST_OUTPUT', 'resultados-sprint6.json'))
RESULTS = []
PREFIX = 'S6-' + uuid.uuid4().hex[:8]
PASSWORD = os.environ.get('TF_TEST_USER_PASSWORD')

def request(method, route, token=None, data=None, raw=None, headers=None):
    h = dict(headers or {})
    if route.startswith('/api/auth/'):
        h.setdefault('Origin', os.environ.get('TF_TEST_ORIGIN','http://127.0.0.1:15176'))
        h.setdefault('X-TimeFlow-CSRF','1')
    if token: h['Authorization'] = 'Bearer '+token
    if data is not None:
        raw = json.dumps(data, ensure_ascii=False).encode('utf8'); h['Content-Type']='application/json'
    req=urllib.request.Request(BASE+route, data=raw, method=method, headers=h)
    try:
        with urllib.request.urlopen(req,timeout=120) as res:
            code, body, response_headers = res.status, res.read(), dict(res.headers)
    except urllib.error.HTTPError as err:
        code, body, response_headers = err.code, err.read(), dict(err.headers)
    if 'application/json' in response_headers.get('Content-Type','') and body:
        body=json.loads(body)
    return code, body, response_headers

def check(name, code, expected):
    ok=code in (expected if isinstance(expected, (tuple,list)) else [expected])
    RESULTS.append(dict(case=name, passed=ok, http=code, expected=expected))
    print(('PASS' if ok else 'FAIL'),name,code,flush=True)
    if not ok: raise AssertionError(f'{name}: HTTP {code}, expected {expected}')

def condition(name, ok):
    RESULTS.append(dict(case=name,passed=bool(ok)))
    print(('PASS' if ok else 'FAIL'),name,flush=True)
    if not ok: raise AssertionError(name)

def login(email,password):
    code,b,_=request('POST','/api/auth/login',data={'email':email,'password':password})
    check('login '+email,code,200)
    condition('no exponer hash/password en login', 'passwordHash' not in b['user'] and 'password' not in b['user'])
    return b['token'],b['user']

def create_user(admin, label, role='trabajador'):
    code,u,_=request('POST','/api/usuarios',admin,data=dict(nombre=PREFIX+' '+label,email=PREFIX.lower()+'-'+label+'@sprint6.test',password=PASSWORD,rol=role,estado='activo'))
    check('crear usuario '+label,code,201); return u

def create_task(token,name,dependencies=None,**extra):
    fields=dict(meta='Entregable sintético verificable',fechaLimite='2030-12-01T18:00');fields.update(extra)
    code,t,_=request('POST','/api/tareas',token,data=dict(nombre=PREFIX+' '+name,dependenciaIds=dependencies or [],**fields))
    check('crear tarea '+name,code,201); return t

def tasks(token):
    code,t,_=request('GET','/api/tareas',token); check('recargar tareas desde API',code,200); return {x['id']:x for x in t}

def upload(token,task,filename,content):
    boundary='tf'+uuid.uuid4().hex
    raw=(f'--{boundary}\r\nContent-Disposition: form-data; name="archivo"; filename="{filename}"\r\nContent-Type: application/octet-stream\r\n\r\n'.encode()+content+f'\r\n--{boundary}--\r\n'.encode())
    return request('POST',f'/api/tareas/{task}/evidencias',token,raw=raw,headers={'Content-Type':'multipart/form-data; boundary='+boundary})

def run():
    if not PASSWORD: raise RuntimeError('Definir TF_TEST_USER_PASSWORD para las cuentas sinteticas')
    if os.environ.get('TF_TEST_CONFIRM')!='TIMEFLOW_TEST_ONLY': raise RuntimeError('Confirmar entorno desechable con TF_TEST_CONFIRM=TIMEFLOW_TEST_ONLY')
    uri=urllib.parse.urlparse(BASE)
    if uri.hostname not in ('127.0.0.1','localhost') or uri.scheme!='http': raise RuntimeError('Solo localhost de pruebas')
    admin,au=login(os.environ.get('TF_TEST_ADMIN_EMAIL','admin@sprint6.test'),os.environ['TF_TEST_ADMIN_PASSWORD'])
    code,_,_=request('GET','/api/tareas'); check('sin token',code,401)
    code,_,_=request('GET','/api/tareas',admin+'x'); check('token manipulado',code,401)
    worker=create_user(admin,'worker'); other=create_user(admin,'other'); second=create_user(admin,'admin2','admin')
    wt,_=login(worker['email'],PASSWORD); ot,_=login(other['email'],PASSWORD); at,_=login(second['email'],PASSWORD)
    for route in ['/api/usuarios/administracion','/api/tipos-tarea/administracion']:
        check('administración prohibida '+route,request('GET',route,wt)[0],403)
    check('elevación de rol bloqueada',request('PUT',f'/api/usuarios/{worker["id"]}',wt,data=worker|{'rol':'admin'})[0],403)
    for method,path,data in [('POST','/api/usuarios',{}),('DELETE',f'/api/usuarios/{other["id"]}',None),('PATCH',f'/api/usuarios/{other["id"]}/reactivar',None),('POST','/api/tipos-tarea',{}),('DELETE','/api/tipos-tarea/999999',None)]:
        check('permiso trabajador '+method+' '+path,request(method,path,wt,data=data)[0],403)
    check('crear sin Check In',request('POST','/api/tareas',wt,data={'nombre':'Sin jornada','meta':'Meta de prueba','fechaLimite':'2030-12-01T18:00'})[0],409)
    # Dos dispositivos no pueden abrir jornadas duplicadas.
    with futures.ThreadPoolExecutor(2) as pool:
        codes=list(pool.map(lambda _:request('POST','/api/jornadas/check-in',wt)[0],range(2)))
    condition('Check In concurrente 201 y 409',sorted(codes)==[201,409])
    check('Check In administrador',request('POST','/api/jornadas/check-in',admin)[0],(201,409))
    a=create_task(wt,'A',descripcion='Privado <script>alert(1)</script>',bitacora='Bitácora privada')
    b=create_task(wt,'B',[a['id']]); c=create_task(wt,'C',[a['id'],b['id']])
    all_tasks=tasks(wt)
    condition('persistencia de dependencias múltiples',set(all_tasks[c['id']]['dependenciaIds'])=={a['id'],b['id']})
    for label,deps in [('duplicadas',[a['id'],a['id']]),('inexistentes',[99999999]),('negativas',[-1]),('nulas',[None])]:
        check('rechazar dependencias '+label,request('POST','/api/tareas',wt,data={'nombre':label,'meta':'Meta de prueba','fechaLimite':'2030-12-01T18:00','dependenciaIds':deps})[0],400)
    check('rechazar ciclo',request('PUT',f'/api/tareas/{a["id"]}',wt,data=a|{'dependenciaIds':[c['id']]})[0],400)
    check('modificación de tarea ajena',request('PUT',f'/api/tareas/{a["id"]}',ot,data=a)[0],403)
    other_view=tasks(ot)[a['id']]
    condition('mapa compartido oculta contenido privado',not other_view.get('descripcion') and not other_view.get('bitacora'))
    check('trabajador no mueve nodos',request('PATCH',f'/api/tareas/{a["id"]}/posicion',wt,data={'posicionX':10,'posicionY':20,'anteriorX':None,'anteriorY':None})[0],403)
    check('trabajador no autoorganiza',request('PATCH','/api/tareas/posiciones',wt,data=[{'id':a['id'],'posicionX':1,'posicionY':2}])[0],403)
    move={'posicionX':10,'posicionY':20,'anteriorX':None,'anteriorY':None}
    check('guardar posición manual',request('PATCH',f'/api/tareas/{a["id"]}/posicion',admin,data=move)[0],200)
    check('rechazar posición obsoleta',request('PATCH',f'/api/tareas/{a["id"]}/posicion',at,data=move|{'posicionX':90})[0],409)
    check('rechazar posición incompleta',request('PATCH',f'/api/tareas/{a["id"]}/posicion',admin,data={'posicionX':3,'posicionY':4})[0],400)
    proposals=[dict(id=a['id'],posicionX=100,posicionY=200,anteriorX=10,anteriorY=20),dict(id=b['id'],posicionX=300,posicionY=200,anteriorX=None,anteriorY=None)]
    with futures.ThreadPoolExecutor(2) as pool:
        codes=list(pool.map(lambda tok:request('PATCH','/api/tareas/posiciones',tok,data=proposals)[0],[admin,at]))
    condition('autoorganización concurrente 200 y 409',sorted(codes)==[200,409])
    before=tasks(wt)
    bad=[dict(id=a['id'],posicionX=999,posicionY=999,anteriorX=100,anteriorY=200),dict(id=99999999,posicionX=30,posicionY=20,anteriorX=None,anteriorY=None)]
    check('lote con tarea inexistente',request('PATCH','/api/tareas/posiciones',admin,data=bad)[0],409)
    condition('lote rechazado no guarda parcialmente',tasks(wt)[a['id']]['posicionX']==before[a['id']]['posicionX'])
    # Cambios opuestos simultáneos en el grafo: uno solo puede confirmarse.
    x=create_task(wt,'X'); y=create_task(wt,'Y')
    with futures.ThreadPoolExecutor(2) as pool:
        calls=[(x,y,admin),(y,x,at)]
        codes=list(pool.map(lambda v:request('PUT',f'/api/tareas/{v[0]["id"]}',v[2],data=v[0]|{'dependenciaIds':[v[1]['id']]})[0],calls))
    condition('dependencias concurrentes sin ciclo',sorted(codes)==[200,400])
    # Conservar enlaces históricos de registros inactivos.
    check('desactivar requisito',request('DELETE',f'/api/tareas/{a["id"]}',wt)[0],204)
    check('no aceptar dependencia inactiva',request('POST','/api/tareas',wt,data={'nombre':'inactiva','meta':'Meta de prueba','fechaLimite':'2030-12-01T18:00','dependenciaIds':[a['id']]})[0],400)
    check('editar conservando vínculo histórico',request('PUT',f'/api/tareas/{b["id"]}',wt,data=tasks(wt)[b['id']]|{'bitacora':'historial'})[0],200)
    check('reactivar tarea',request('PATCH',f'/api/tareas/{a["id"]}/reactivar',admin)[0],200)
    # Tipos de tarea, unicidad y recuperación.
    code,template,_=request('POST','/api/tipos-tarea',admin,data={'nombre':PREFIX+' plantilla','descripcion':'Sintética'}); check('crear plantilla',code,201)
    check('plantilla duplicada',request('POST','/api/tipos-tarea',admin,data={'nombre':template['nombre']})[0],409)
    check('editar plantilla',request('PUT',f'/api/tipos-tarea/{template["id"]}',admin,data=template|{'descripcion':'Editada'})[0],200)
    check('desactivar plantilla',request('DELETE',f'/api/tipos-tarea/{template["id"]}',admin)[0],204)
    condition('catálogo oculta plantilla inactiva',all(t['id']!=template['id'] for t in request('GET','/api/tipos-tarea',wt)[1]))
    check('reactivar plantilla',request('PATCH',f'/api/tipos-tarea/{template["id"]}/reactivar',admin)[0],200)
    # Mensajes privados y anuncios.
    code,msg,_=request('POST','/api/mensajes',wt,data={'recipientId':other['id'],'text':'Mensaje sintético privado'}); check('mensaje directo',code,201)
    condition('tercero no lee mensaje directo',all(m['id']!=msg['id'] for m in request('GET','/api/mensajes',at)[1]))
    check('anuncio prohibido a trabajador',request('POST','/api/mensajes',wt,data={'chatId':'announcements','text':'No autorizado'})[0],403)
    check('anuncio administrativo',request('POST','/api/mensajes',admin,data={'chatId':'announcements','text':'Anuncio sintético Sprint6'})[0],201)
    # Archivos reales de distintos formatos y firmas inválidas.
    fixture=pathlib.Path(__file__).resolve().parents[1]/'frontend/src/assets/hero.png'
    payloads={'nota.txt':b'Evidencia sintetica UTF-8','imagen.png':fixture.read_bytes(),'documento.pdf':b'%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF'}
    buf=io.BytesIO()
    with zipfile.ZipFile(buf,'w',zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml','<Types/>'); z.writestr('_rels/.rels','<Relationships/>'); z.writestr('word/document.xml','<document/>')
    payloads['documento.docx']=buf.getvalue()
    for name,payload in payloads.items():
        code,e,_=upload(wt,b['id'],name,payload); check('subir '+name,code,201)
        code,download,headers=request('GET',f'/api/tareas/{b["id"]}/evidencias/{e["id"]}',wt); check('descargar '+name,code,200)
        condition('integridad SHA256 '+name,hashlib.sha256(payload).digest()==hashlib.sha256(download).digest())
        condition('nosniff y no-store '+name,headers.get('X-Content-Type-Options')=='nosniff' and headers.get('Cache-Control')=='no-store')
        check('archivo ajeno prohibido '+name,request('GET',f'/api/tareas/{b["id"]}/evidencias/{e["id"]}',ot)[0],403)
        check('desactivar evidencia '+name,request('DELETE',f'/api/tareas/{b["id"]}/evidencias/{e["id"]}',wt)[0],204)
        check('evidencia desactivada invisible '+name,request('GET',f'/api/tareas/{b["id"]}/evidencias/{e["id"]}',wt)[0],404)
    for name,payload in [('mal.exe',b'MZ'),('falsa.png',b'<html>ataque</html>'),('../ruta.txt',b'no'),('vacio.txt',b'')]:
        check('rechazar '+name,upload(wt,b['id'],name,payload)[0],400)
    # ZIP que expande 129 MiB, enviado comprimido. No se escribe fuera de memoria.
    bomb=io.BytesIO()
    with zipfile.ZipFile(bomb,'w',zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml','<Types/>'); z.writestr('_rels/.rels','<Relationships/>'); z.writestr('word/document.xml',b'0'*(129*1024*1024))
    check('rechazar expansión DOCX excesiva',upload(wt,b['id'],'bomba.docx',bomb.getvalue())[0],400)
    # Cinco cargas de 60 MiB conservadas completan exactamente 300 MiB.
    large=create_task(wt,'archivos grandes'); size=60*1024*1024; content=b'A'*size
    for i in range(5):
        code,e,_=upload(wt,large['id'],f'limite{i}.txt',content); check(f'60 MiB archivo {i+1}',code,201)
        if i==0:
            code,download,_=request('GET',f'/api/tareas/{large["id"]}/evidencias/{e["id"]}',wt); check('descargar 60 MiB',code,200)
            condition('SHA256 60 MiB',hashlib.sha256(download).digest()==hashlib.sha256(content).digest())
            check('desactivar archivo grande',request('DELETE',f'/api/tareas/{large["id"]}/evidencias/{e["id"]}',wt)[0],204)
    check('300 MiB incluye desactivados',upload(wt,large['id'],'extra.txt',b'1')[0],400)
    limit=create_task(wt,'límite archivo y cantidad')
    check('60 MiB más un byte',upload(wt,limit['id'],'exceso.txt',content+b'1')[0],(400,413))
    del content
    for i in range(25):
        check(f'archivo pequeño {i+1}/25',upload(wt,limit['id'],f'a{i}.txt',b'pequeno')[0],201)
    check('archivo 26 rechazado',upload(wt,limit['id'],'a26.txt',b'exceso')[0],400)
    # Respuestas de errores de límites y CORS.
    check('JSON mayor de 4 MiB',request('POST','/api/mensajes',wt,raw=b' '* (4*1024*1024+1),headers={'Content-Type':'application/json'})[0],413)
    check('CORS no autorizado',request('OPTIONS','/api/tareas',headers={'Origin':'https://intruso.invalid','Access-Control-Request-Method':'GET'})[0],403)
    check('SQL injection no autentica',request('POST','/api/auth/login',data={'email':"' OR 1=1 --",'password':'incorrecta'})[0],401)
    # Contraseñas Unicode inválidas no deben llegar como 500 de BCrypt.
    check('Unicode excesivo al crear cuenta',request('POST','/api/usuarios',admin,data={'nombre':'Unicode','email':PREFIX+'@unicode.test','password':'ñ'*40+'A1'})[0],400)
    # Contraseña cambiada revoca el JWT previo.
    check('cambiar password trabajador',request('PUT',f'/api/usuarios/{worker["id"]}',admin,data=worker|{'password':PASSWORD+'New1'})[0],200)
    check('JWT previo a cambio password inválido',request('GET','/api/tareas',wt)[0],401)
    wt,_=login(worker['email'],PASSWORD+'New1')
    check('desactivar usuario',request('DELETE',f'/api/usuarios/{worker["id"]}',admin)[0],204)
    check('usuario inactivo no usa JWT',request('GET','/api/tareas',wt)[0],401)
    check('usuario inactivo no inicia sesión',request('POST','/api/auth/login',data={'email':worker['email'],'password':PASSWORD+'New1'})[0],401)
    check('reactivar usuario',request('PATCH',f'/api/usuarios/{worker["id"]}/reactivar',admin)[0],200)
    wt,_=login(worker['email'],PASSWORD+'New1')
    check('Check Out',request('POST','/api/jornadas/check-out',wt)[0],200)
    check('Check Out repetido',request('POST','/api/jornadas/check-out',wt)[0],409)
    # Datos para segunda ronda, Postman y comprobaciones de persistencia.
    return dict(prefix=PREFIX,workerEmail=worker['email'],workerPassword=PASSWORD+'New1',workerId=worker['id'],taskA=a['id'],taskB=b['id'],taskC=c['id'],largeTask=large['id'],admin2=second['email'],template=template['id'])

if __name__=='__main__':
    start=time.time(); context={}; error=None
    try: context=run()
    except Exception as ex:
        error=str(ex); print('ERROR:',error,flush=True)
    finally:
        OUT.parent.mkdir(parents=True,exist_ok=True)
        OUT.write_text(json.dumps(dict(version='0.5.23-SNAPSHOT',base=BASE,prefix=PREFIX,elapsedSeconds=round(time.time()-start,3),tests=RESULTS,error=error),indent=2,ensure_ascii=False),encoding='utf8')
        # Contexto local contiene contraseña sintética: nunca se incluye en entregables.
        if context and os.environ.get('TF_TEST_CONTEXT'):
            pathlib.Path(os.environ['TF_TEST_CONTEXT']).write_text(json.dumps(context),encoding='utf8')
    raise SystemExit(1 if error or any(not r['passed'] for r in RESULTS) else 0)

"""Reproduce cuotas y edición/movimiento con dos solicitudes y un bloqueo MySQL.
Solo MySQL localhost en puerto alternativo; nunca 3306. Datos sintéticos conservados.
Variables: las de probar_sprint6.py y TF_TEST_DB_PASSWORD; opcionales
TF_TEST_MYSQL, TF_TEST_DB_PORT (33316), TF_TEST_DB_USER (tf_sprint6),
TF_TEST_DB_NAME (teamflow_db), TF_TEST_RACE_OUTPUT.
"""
import concurrent.futures as futures
import json
import os
import pathlib
import subprocess
import time
import probar_sprint6 as api

def sql(statement):
    port=int(os.environ.get('TF_TEST_DB_PORT','33316'))
    if port==3306: raise RuntimeError('Se rechaza el puerto de la instancia habitual')
    env=os.environ.copy(); env['MYSQL_PWD']=os.environ['TF_TEST_DB_PASSWORD']
    cmd=[os.environ.get('TF_TEST_MYSQL','mysql'),'--no-defaults','--protocol=TCP','--host=127.0.0.1',f'--port={port}',
         '--user='+os.environ.get('TF_TEST_DB_USER','tf_sprint6'),'--batch','--skip-column-names',os.environ.get('TF_TEST_DB_NAME','teamflow_db')]
    p=subprocess.run(cmd,input=statement,text=True,capture_output=True,env=env,timeout=30)
    if p.returncode: raise RuntimeError('Error SQL en instancia de prueba: '+p.stderr)
    return p.stdout.strip()

def run():
    if os.environ.get('TF_TEST_CONFIRM')!='TIMEFLOW_TEST_ONLY': raise RuntimeError('Confirmar instancia de pruebas desechable')
    if api.urllib.parse.urlparse(api.BASE).hostname not in ('localhost','127.0.0.1'): raise RuntimeError('Solo API local de prueba')
    token,_=api.login(os.environ.get('TF_TEST_ADMIN_EMAIL','admin@sprint6.test'),os.environ['TF_TEST_ADMIN_PASSWORD'])
    api.check('Check In de pruebas',api.request('POST','/api/jornadas/check-in',token)[0],(201,409))
    results=[]
    task=api.create_task(token,'cuota concurrente')
    for i in range(24): api.check('archivo inicial '+str(i),api.upload(token,task['id'],str(i)+'.txt',b'cuota')[0],201)
    with futures.ThreadPoolExecutor(3) as pool:
        hold=pool.submit(sql,f"START TRANSACTION; SELECT id FROM tareas WHERE id={int(task['id'])} FOR UPDATE; DO SLEEP(3); COMMIT;")
        time.sleep(.3)
        calls=[pool.submit(api.upload,token,task['id'],name+'.txt',b'concurrente') for name in ('uno','dos')]
        codes=[c.result()[0] for c in calls]; hold.result()
    count=int(sql(f"SELECT COUNT(*) FROM evidencias_tarea WHERE tarea_id={int(task['id'])}"))
    results.append(dict(case='cuota 25 concurrente',http=codes,count=count,passed=sorted(codes)==[201,400] and count==25))
    task=api.create_task(token,'edición simultánea con posición')
    with futures.ThreadPoolExecutor(3) as pool:
        hold=pool.submit(sql,f"START TRANSACTION; SELECT id FROM tareas WHERE id={int(task['id'])} FOR UPDATE; DO SLEEP(4); COMMIT;")
        time.sleep(.3)
        move=pool.submit(api.request,'PATCH',f'/api/tareas/{task["id"]}/posicion',token,data=dict(posicionX=555,posicionY=666,anteriorX=None,anteriorY=None))
        time.sleep(.5)
        edit=pool.submit(api.request,'PUT',f'/api/tareas/{task["id"]}',token,data=task|{'bitacora':'Edición concurrente'})
        codes=[move.result()[0],edit.result()[0]]; hold.result()
    stored=api.tasks(token)[task['id']]
    retry=api.request('PUT',f'/api/tareas/{task["id"]}',token,data=stored|{'bitacora':'Edición concurrente'})[0]
    stored=api.tasks(token)[task['id']]
    results.append(dict(case='edición obsoleta rechazada y revisada',http=codes,retryHttp=retry,posicionX=stored['posicionX'],bitacora=stored['bitacora'],passed=codes==[200,409] and retry==200 and stored['posicionX']==555 and stored['bitacora']=='Edición concurrente'))
    out=pathlib.Path(os.environ.get('TF_TEST_RACE_OUTPUT','concurrencia-mysql.json'))
    out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(dict(version='0.5.23-SNAPSHOT',tests=results),indent=2,ensure_ascii=False),encoding='utf8')
    print(json.dumps(results,ensure_ascii=False))
    return all(r['passed'] for r in results)

if __name__=='__main__': raise SystemExit(0 if run() else 1)

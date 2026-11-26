import test from 'node:test';
import assert from 'node:assert/strict';
import {createDefaultPositions,createDependencyEdges,dependencyChainIds,wouldCreateCycle,getDependencyIds} from '../src/utils/mapLayout.js';
const tasks=[{id:1,dependenciaIds:[]},{id:2,dependenciaIds:[1]},{id:3,dependenciaIds:[1,2]},{id:4,dependenciaIds:[]}];
test('genera una flecha por cada requisito previo',()=>{
 const edges=createDependencyEdges(tasks);
 assert(edges.some(e=>e.parentId==='1' && e.taskId==='2' && e.explicit));
 assert(edges.some(e=>e.parentId==='1' && e.taskId==='3' && e.explicit));
 assert(edges.some(e=>e.parentId==='2' && e.taskId==='3' && e.explicit));
 assert.equal(edges.filter(e=>e.taskId==='3' && e.explicit).length,2);
});
test('selección ilumina ramas de ancestros sin repetir nodos',()=>assert.deepEqual([...dependencyChainIds(3,tasks)].sort(),['1','2']));
test('rechaza ciclo en cualquier rama',()=>{assert.equal(wouldCreateCycle(1,[4,3],tasks),true);assert.equal(wouldCreateCycle(4,[1,2],tasks),false);});
test('organiza tareas con varios requisitos a la derecha de todos',()=>{
 const pos=createDefaultPositions(tasks);
 assert(pos['1'].x<pos['2'].x && pos['2'].x<pos['3'].x);
});
test('sin dependencias mantiene el mapa original',()=>{
 const pos=createDefaultPositions([{id:1,dependenciaIds:[]},{id:2,dependenciaIds:[]}]);
 assert.deepEqual(pos['1'],{x:110,y:110});assert.deepEqual(pos['2'],{x:338,y:110});
});
test('omite referencias fuera del mapa sin inventar conexiones',()=>{
 const edges=createDependencyEdges([{id:1,dependenciaIds:[]},{id:2,dependenciaIds:[900]}]);
 assert.equal(edges.filter(e=>e.taskId==='2').length,0);
});
test('usa datos antiguos de prueba si no existe la lista',()=>{
 const old={id:2,dependenciaId:1};
 assert.deepEqual(getDependencyIds(old),['1']);
});

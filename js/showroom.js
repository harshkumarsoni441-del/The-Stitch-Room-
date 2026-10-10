(() => {
  'use strict';

  const canvasHost = document.getElementById('avatar-wrap');
  const names = { 'senior-boy':'Senior boy', 'senior-girl':'Senior girl', 'junior-boy':'Junior boy', 'junior-girl':'Junior girl' };
  const outfits = {
    'senior-boy': [ ['shirt-trousers','Shirt + trousers'], ['shirt-shorts','Shirt + shorts'] ],
    'senior-girl': [ ['blouse-skirt','Blouse + skirt'], ['blouse-trousers','Blouse + trousers'], ['pinafore','Blouse + pinafore'] ],
    'junior-boy': [ ['shirt-shorts','Shirt + shorts'], ['shirt-trousers','Shirt + trousers'] ],
    'junior-girl': [ ['pinafore','Blouse + pinafore'], ['blouse-skirt','Blouse + skirt'], ['tunic-trousers','Tunic + trousers'] ]
  };
  const state = { model:'senior-boy', outfit:'shirt-trousers', shirt:'#f7f4eb', bottom:'#273a50', skin:'#bf8e6b', tie:true, blazer:false };
  let renderer, scene, camera, controlsGroup, avatar, shirtMaterials=[], bottomMaterials=[], skinMaterials=[];
  let radius=5.35, theta=0, phi=1.47, dragging=false, lastX=0, lastY=0, targetY=1.58;

  const THREE = window.THREE;
  if (!THREE || !canvasHost) {
    canvasHost.innerHTML='<p class="viewer-error">The 3D viewer could not start in this browser. Please open the page in a browser with WebGL enabled.</p>';
    return;
  }

  try {
    renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true, preserveDrawingBuffer:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-label','Drag to rotate the three-dimensional student model. Scroll to zoom.');
    renderer.domElement.setAttribute('role','img');
    canvasHost.appendChild(renderer.domElement);
  } catch (error) {
    canvasHost.innerHTML='<p class="viewer-error">This browser could not create a 3D graphics surface. Please try a browser with WebGL enabled.</p>';
    return;
  }

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  controlsGroup = new THREE.Group();
  scene.add(controlsGroup);
  scene.add(new THREE.HemisphereLight(0xfff7e9, 0x777260, 2.0));
  const keyLight=new THREE.DirectionalLight(0xfff3df,3.1);keyLight.position.set(-3.5,6,5);scene.add(keyLight);
  const fillLight=new THREE.DirectionalLight(0xdce8ff,1.15);fillLight.position.set(4,3,-3);scene.add(fillLight);
  const rimLight=new THREE.DirectionalLight(0xf2bd94,1.0);rimLight.position.set(1,4,3);scene.add(rimLight);

  const platform=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.12,.08,64),new THREE.MeshStandardMaterial({color:0xe4e2d7,roughness:.82}));
  platform.position.y=.04;platform.receiveShadow=true;scene.add(platform);
  const platformRing=new THREE.Mesh(new THREE.TorusGeometry(1.07,.012,8,80),new THREE.MeshStandardMaterial({color:0xb7b6a6,metalness:.25,roughness:.45}));platformRing.rotation.x=Math.PI/2;platformRing.position.y=.085;scene.add(platformRing);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:0xf2f0e8,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);

  const mat=(color,roughness=.78)=>new THREE.MeshStandardMaterial({color,roughness});
  function addMesh(parent,geometry,material,pos,scale){const mesh=new THREE.Mesh(geometry,material);mesh.position.set(pos[0],pos[1],pos[2]);if(scale)mesh.scale.set(scale[0],scale[1],scale[2]);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function cylinder(parent,rt,rb,h,material,x,y,z,segments=24){return addMesh(parent,new THREE.CylinderGeometry(rt,rb,h,segments,1),material,[x,y,z]);}
  function sphere(parent,material,x,y,z,sx,sy,sz){return addMesh(parent,new THREE.SphereGeometry(1,24,16),material,[x,y,z],[sx,sy,sz]);}
  function limb(parent,start,end,rTop,rBottom,material){
    const a=new THREE.Vector3(...start),b=new THREE.Vector3(...end),delta=b.clone().sub(a);
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(rTop,rBottom,delta.length(),16),material);
    mesh.position.copy(a.add(b).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function markMaterial(mesh,group){if(group==='shirt')shirtMaterials.push(mesh.material);if(group==='bottom')bottomMaterials.push(mesh.material);if(group==='skin')skinMaterials.push(mesh.material);}
  function roundedBox(parent,material,x,y,z,sx,sy,sz,group){
    const mesh=addMesh(parent,new THREE.BoxGeometry(sx,sy,sz),material,[x,y,z]);if(group)markMaterial(mesh,group);return mesh;
  }
  function createAvatar(){
    clearAvatar();
    const junior=state.model.startsWith('junior'),girl=state.model.endsWith('girl');
    const h=junior?{legTop:.99,legBottom:.22,torsoBottom:1.02,torsoTop:1.62,headY:2.01,headR:.285,neckY:1.70,shoulder:.285,hip:.25,armTop:1.50,handY:1.03,shoeY:.11}:{legTop:1.38,legBottom:.16,torsoBottom:1.36,torsoTop:2.22,headY:2.82,headR:.315,neckY:2.27,shoulder:.36,hip:.28,armTop:2.10,handY:1.47,shoeY:.11};
    targetY=junior?1.20:1.73;
    avatar=new THREE.Group();avatar.position.y=.08;controlsGroup.add(avatar);
    shirtMaterials=[];bottomMaterials=[];skinMaterials=[];
    const shirt=mat(state.shirt),bottom=mat(state.bottom),skin=mat(state.skin),hair=mat('#302a25'),shoe=mat('#333936'),trim=mat('#ece8da'),tieMat=mat('#b86c52'),gold=mat('#c8a565'),eye=mat('#332d29'),lip=mat('#865e52');
    const outfit=state.outfit;
    const isSkirt=outfit==='blouse-skirt'||outfit==='pinafore';
    const isShort=outfit==='shirt-shorts';
    const isTunic=outfit==='tunic-trousers';
    const isPinafore=outfit==='pinafore';
    const topY=(h.torsoTop+h.torsoBottom)/2, torsoH=h.torsoTop-h.torsoBottom;

    // legs and shoes
    const legsTop=isSkirt||isPinafore?h.torsoBottom-.02:(isShort?h.torsoBottom+.13:h.legTop);
    cylinder(avatar,.28,.27,.22,bottom,0,legsTop-.08,0,32);markMaterial({material:bottom},'bottom');
    if(!isSkirt){
      const pantsMat=bottom;
      const endY=isShort? h.legBottom+.29:h.legBottom;
      for(const side of [-1,1]){
        limb(avatar,[side*.14,legsTop-.10,0],[side*.155,endY+.08,0],.135,.105,pantsMat);markMaterial({material:pantsMat},'bottom');
        if(isShort){limb(avatar,[side*.155,endY+.1,0],[side*.155,h.legBottom,0],.075,.07,skin);markMaterial({material:skin},'skin');}
        sphere(avatar,shoe,side*.16,h.shoeY,.08,.19,.11,.31);
      }
    } else {
      const skirtTop=h.torsoBottom+.04,skirtHeight=junior?.48:.60;
      const skirt=cylinder(avatar,.245,.39,skirtHeight,bottom,0,skirtTop-skirtHeight/2,0,36);markMaterial(skirt,'bottom');
      const hem=roundedBox(avatar,bottom,0,skirtTop-skirtHeight+.035,.005,.73,.045,.12,'bottom');
      for(const side of [-1,1]){limb(avatar,[side*.14,skirtTop-skirtHeight+.06,0],[side*.15,h.legBottom,0],.075,.065,skin);markMaterial({material:skin},'skin');}
      for(const side of [-1,1])sphere(avatar,shoe,side*.16,h.shoeY,.08,.19,.11,.31);
    }

    // shirt / blouse torso and sleeves
    const shirtBottom=isTunic?h.torsoBottom-.18:h.torsoBottom;
    const torsoHeight=h.torsoTop-shirtBottom;
    const body=cylinder(avatar,h.shoulder,h.hip,torsoHeight,shirt,0,(h.torsoTop+shirtBottom)/2,0,32);markMaterial(body,'shirt');
    for(const side of [-1,1]){
      const shoulder=[side*h.shoulder*.78,h.armTop,0];
      const elbow=[side*(h.shoulder+0.17),h.armTop-.35,0];
      const wrist=[side*(h.shoulder+0.19),h.handY,0];
      limb(avatar,shoulder,elbow,.115,.095,shirt);markMaterial({material:shirt},'shirt');
      limb(avatar,elbow,wrist,.082,.066,skin);markMaterial({material:skin},'skin');
      sphere(avatar,skin,wrist[0],wrist[1]-.04,wrist[2],.075,.095,.075);
      // sleeve cuff
      cylinder(avatar,.085,.082,.07,trim,side*(h.shoulder+.19),h.handY+.055,0,18);
      if(isPinafore){limb(avatar,[side*.13,h.torsoTop-.02,.045],[side*.20,h.torsoBottom+.1,.06],.055,.055,bottom);markMaterial({material:bottom},'bottom');}
    }

    // collar, buttons, tie and school crest
    const collarLeft=addMesh(avatar,new THREE.ConeGeometry(.115,.17,4),trim,[-.095,h.torsoTop-.035,h.shoulder*1.04]);collarLeft.rotation.z=Math.PI;
    const collarRight=addMesh(avatar,new THREE.ConeGeometry(.115,.17,4),trim,[.095,h.torsoTop-.035,h.shoulder*1.04]);collarRight.rotation.z=Math.PI;
    roundedBox(avatar,trim,0,topY,.345,.075,torsoHeight*.58,.018);
    roundedBox(avatar,mat('#eeeade'),.205,h.torsoTop-.34,h.shoulder*1.01,.14,.16,.025);
    for(let i=0;i<4;i++)sphere(avatar,trim,0,h.torsoTop-.20-i*.14,h.shoulder*1.07,.018,.022,.012);
    const crest=roundedBox(avatar,gold,.22,h.torsoTop-.30,h.shoulder*1.08,.09,.115,.025);
    if(state.tie){
      const knot=addMesh(avatar,new THREE.BoxGeometry(.09,.09,.045),tieMat,[0,h.torsoTop-.13,h.shoulder*1.1]);knot.rotation.z=Math.PI/4;
      const tie=addMesh(avatar,new THREE.CylinderGeometry(.012,.055,.37,5),tieMat,[0,h.torsoTop-.37,h.shoulder*1.1]);tie.rotation.z=Math.PI;
    }

    // Optional blazer: body and two lapels sit over the shirt and respond to bottom colour.
    if(state.blazer){
      const blazerMat=mat(state.bottom);bottomMaterials.push(blazerMat);
      const jacket=cylinder(avatar,h.shoulder*1.045,h.hip*1.08,torsoHeight*.96,blazerMat,0,(h.torsoTop+shirtBottom)/2,0,32);markMaterial(jacket,'bottom');
      // keep the shirt collar visible above the jacket
      for(const side of [-1,1]){
        const lapel=addMesh(avatar,new THREE.BufferGeometry(),blazerMat,[0,0,0]);
        const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(side*.14,.16);shape.lineTo(side*.27,-.10);shape.lineTo(side*.19,-.39);shape.lineTo(side*.04,-.23);shape.closePath();
        const geo=new THREE.ShapeGeometry(shape);lapel.geometry.dispose();lapel.geometry=geo;lapel.position.set(side*.035,h.torsoTop-.08,h.shoulder*1.15);markMaterial(lapel,'bottom');
      }
    }
    if(isPinafore){
      const pinaforeMat=mat(state.bottom);bottomMaterials.push(pinaforeMat);
      const panel=cylinder(avatar,.205,.24,junior?.46:.58,pinaforeMat,0,h.torsoBottom+.24,.24,28);markMaterial(panel,'bottom');
      // smooth the bib front with a short, rounded rectangular panel
      roundedBox(avatar,pinaforeMat,0,h.torsoBottom+.45,.36,.40,.38,.09,'bottom');
      for(const side of [-1,1])limb(avatar,[side*.11,h.torsoTop-.01,.30],[side*.15,h.torsoBottom+.47,.36],.035,.035,pinaforeMat);
    }

    // neck and head; the junior model keeps a larger head-to-body ratio and shorter limbs.
    const neck=cylinder(avatar,.12,.13,junior?.22:.31,skin,0,junior?h.neckY:h.neckY+.04,0,24);markMaterial(neck,'skin');
    const head=sphere(avatar,skin,0,h.headY,0,h.headR,h.headR*1.16,h.headR*.88);markMaterial(head,'skin');
    for(const side of [-1,1]){
      sphere(avatar,skin,side*h.headR*.98,h.headY-.03,0,.07,.105,.065);
      sphere(avatar,eye,side*.105,h.headY+.018,h.headR*.82,.027,.035,.018);
      sphere(avatar,trim,side*.105,h.headY+.03,h.headR*.87,.009,.011,.006);
    }
    sphere(avatar,skin,0,h.headY-.075,h.headR*.91,.035,.055,.045);
    const smilePts=[new THREE.Vector3(-.065,h.headY-.16,h.headR*.78),new THREE.Vector3(0,h.headY-.18,h.headR*.83),new THREE.Vector3(.065,h.headY-.16,h.headR*.78)];
    const smile=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(smilePts),12,.009,6,false),lip);avatar.add(smile);
    const cap=sphere(avatar,hair,0,h.headY+h.headR*.53,-.015,h.headR*1.03,h.headR*.68,h.headR*.94);
    if(girl){
      for(const side of [-1,1]){
        const lock=sphere(avatar,hair,side*h.headR*.82,h.headY-.10,-.035,.095,junior?.33:.43,.12);
        sphere(avatar,hair,side*.17,h.headY+h.headR*1.02,.01,.10,.11,.09);
      }
    } else {
      for(let i=0;i<5;i++)sphere(avatar,hair,-.22+i*.11,h.headY+h.headR*.78,-.03,.09,.08,.09);
    }

    avatar.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    applyColours();
    setCameraTarget();
  }
  function clearAvatar(){
    if(!avatar)return;
    controlsGroup.remove(avatar);
    avatar.traverse(o=>{if(o.geometry)o.geometry.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else if(o.material)o.material.dispose();});
    avatar=null;
  }
  function applyColours(){
    shirtMaterials.forEach(m=>m.color.set(state.shirt));bottomMaterials.forEach(m=>m.color.set(state.bottom));skinMaterials.forEach(m=>m.color.set(state.skin));
  }
  function setCameraTarget(){
    camera.position.set(targetY*0+radius*Math.sin(phi)*Math.sin(theta),targetY+radius*Math.cos(phi),radius*Math.sin(phi)*Math.cos(theta));camera.lookAt(0,targetY,0);
  }
  function updateSize(){
    const rect=canvasHost.getBoundingClientRect();if(!rect.width||!rect.height)return;
    renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();setCameraTarget();
  }
  function updateOutfitChoices(){
    const select=document.getElementById('outfit-style'),choices=outfits[state.model];
    select.innerHTML=choices.map(([value,label])=>`<option value="${value}">${label}</option>`).join('');
    if(!choices.some(([value])=>value===state.outfit))state.outfit=choices[0][0];
    select.value=state.outfit;
    document.getElementById('outfit-note').textContent=state.model==='junior-girl'?'Junior school uniforms vary. Try a pinafore, skirt or trousers and confirm your school’s dress code.':'Uniform styles vary by school. Confirm the final style with your school.';
  }
  function render(){
    updateOutfitChoices();createAvatar();
    document.getElementById('model-title').textContent=names[state.model];
    document.getElementById('school-caption').textContent=(document.getElementById('school-name').value.trim()||'YOUR SCHOOL').toUpperCase();
    document.querySelector('.caption-kicker').textContent='MODEL 0'+(['senior-boy','senior-girl','junior-boy','junior-girl'].indexOf(state.model)+1);
  }
  function animate(){
    requestAnimationFrame(animate);
    renderer.render(scene,camera);
  }

  document.querySelectorAll('.model-pick').forEach(btn=>btn.addEventListener('click',()=>{
    state.model=btn.dataset.model;
    document.querySelectorAll('.model-pick').forEach(b=>{const active=b===btn;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    render();
  }));
  document.getElementById('outfit-style').addEventListener('change',e=>{state.outfit=e.target.value;createAvatar();});
  document.querySelectorAll('.swatches').forEach(group=>group.querySelectorAll('.swatch').forEach(btn=>btn.addEventListener('click',()=>{
    const key=group.dataset.target;state[key]=btn.dataset.colour;
    group.querySelectorAll('.swatch').forEach(s=>s.classList.toggle('selected',s===btn));
    document.getElementById(key+'-value').textContent=btn.dataset.name;applyColours();
  })));
  document.querySelectorAll('.custom-swatch input').forEach(input=>input.addEventListener('input',()=>{
    const group=input.closest('.swatches'),key=group.dataset.target;state[key]=input.value;
    group.querySelectorAll('.swatch').forEach(s=>s.classList.remove('selected'));
    document.getElementById(key+'-value').textContent='Custom shade';applyColours();
  }));
  document.querySelectorAll('.detail').forEach(btn=>btn.addEventListener('click',()=>{
    const key=btn.dataset.detail;state[key]=!state[key];btn.classList.toggle('active',state[key]);btn.setAttribute('aria-pressed',String(state[key]));createAvatar();
  }));
  document.getElementById('school-name').addEventListener('input',()=>{
    document.getElementById('school-caption').textContent=(document.getElementById('school-name').value.trim()||'YOUR SCHOOL').toUpperCase();
  });
  document.getElementById('reset').addEventListener('click',()=>{
    state.shirt='#f7f4eb';state.bottom='#273a50';state.skin='#bf8e6b';state.tie=true;state.blazer=false;
    document.querySelectorAll('.swatches').forEach(group=>{
      const key=group.dataset.target,chosen=group.querySelector(`[data-colour="${state[key]}"]`);
      group.querySelectorAll('.swatch').forEach(s=>s.classList.toggle('selected',s===chosen));
      const custom=group.querySelector('input[type=color]');if(custom)custom.value=state[key];
      document.getElementById(key+'-value').textContent=chosen?.dataset.name||'Custom shade';
    });
    document.querySelectorAll('.detail').forEach(btn=>{const active=btn.dataset.detail==='tie';btn.classList.toggle('active',active);btn.setAttribute('aria-pressed',String(active));});
    createAvatar();
  });
  document.getElementById('download').addEventListener('click',()=>{
    renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(!blob)return;const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='stitch-room-3d-uniform-preview.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);},'image/png');
  });
  renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;pointerMoved=false;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});
  renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;theta-=dx*.008;phi=Math.max(.42,Math.min(2.68,phi+dy*.008));lastX=e.clientX;lastY=e.clientY;setCameraTarget();});
  const endDrag=()=>{dragging=false;};renderer.domElement.addEventListener('pointerup',endDrag);renderer.domElement.addEventListener('pointercancel',endDrag);renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();radius=Math.max(3.15,Math.min(6.5,radius+e.deltaY*.004));setCameraTarget();},{passive:false});
  window.addEventListener('resize',updateSize);new ResizeObserver(updateSize).observe(canvasHost);
  updateSize();render();animate();
})();

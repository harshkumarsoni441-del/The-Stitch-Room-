(() => {
  'use strict';
  const THREE=window.THREE;
  if(!THREE)return;

  const palettes={shirt:['#f7f4eb','#d8e8e7','#e5dcbf','#e6c4bd'],bottom:['#273a50','#535d4a','#343536','#80634c']};
  const labels={shirt:['Classic white','Pale blue','Sandstone','Soft rose'],bottom:['Deep navy','Forest olive','Charcoal','Warm khaki']};
  const state={model:'boy',skin:'#e6bd9d',a:{outfit:'shirt-trousers',shirt:'#f7f4eb',bottom:'#273a50',tie:true,blazer:false},b:{outfit:'shirt-trousers',shirt:'#d8e8e7',bottom:'#535d4a',tie:false,blazer:true}};
  const viewers={};
  const outfitOptions={boy:[['shirt-trousers','Shirt + trousers'],['shirt-shorts','Shirt + shorts']],girl:[['blouse-skirt','Blouse + skirt'],['blouse-trousers','Blouse + trousers'],['pinafore','Blouse + pinafore'],['tunic-trousers','Tunic + trousers']]};

  const material=(color,roughness=.78)=>new THREE.MeshStandardMaterial({color,roughness});
  function mesh(parent,geometry,mat,pos,scale){const o=new THREE.Mesh(geometry,mat);o.position.set(...pos);if(scale)o.scale.set(...scale);parent.add(o);return o;}
  function ball(parent,mat,x,y,z,sx,sy,sz){return mesh(parent,new THREE.SphereGeometry(1,24,16),mat,[x,y,z],[sx,sy,sz]);}
  function cylinder(parent,top,bottom,height,mat,x,y,z,segments=24){return mesh(parent,new THREE.CylinderGeometry(top,bottom,height,segments),mat,[x,y,z]);}
  function limb(parent,a,b,top,bottom,mat){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),direction=end.clone().sub(start);const part=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,direction.length(),16),mat);part.position.copy(start.add(end).multiplyScalar(.5));part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());parent.add(part);return part;}
  function clearGroup(group){while(group.children.length){const child=group.children.pop();if(child.geometry)child.geometry.dispose();if(child.material){if(Array.isArray(child.material))child.material.forEach(m=>m.dispose());else child.material.dispose();}}}

  function buildFigure(view,stateForDesign){
    clearGroup(view.figure);const girl=state.model==='girl',outfit=stateForDesign.outfit;
    const skirt=outfit==='blouse-skirt'||outfit==='pinafore',shorts=outfit==='shirt-shorts',tunic=outfit==='tunic-trousers',pinafore=outfit==='pinafore';
    const skinMat=material(state.skin),shirtMat=material(stateForDesign.shirt),bottomMat=material(stateForDesign.bottom),hairMat=material('#332a25'),shoeMat=material('#363936'),accentMat=material('#eeeade'),tieMat=material('#b86c52'),trimMat=material('#c6a369');
    view.colors={skin:[],shirt:[],bottom:[]};
    const put=(parent,geometry,mat,pos,scale,kind)=>{const o=mesh(parent,geometry,mat,pos,scale);if(kind)view.colors[kind].push(mat);return o;};
    const feet=.12,waist=1.36,top=2.22,headY=2.82,headR=.315;
    const bottomTop=skirt||pinafore?waist:(shorts?waist+.12:waist+.02);
    cylinder(view.figure,.28,.27,.22,bottomMat,0,bottomTop-.08,0);view.colors.bottom.push(bottomMat);
    if(skirt||pinafore){
      const height=.60,upper=waist+.04;
      const lower=cylinder(view.figure,.245,.39,height,bottomMat,0,upper-height/2,0,36);view.colors.bottom.push(lower.material);
      for(const side of [-1,1]){const leg=limb(view.figure,[side*.14,upper-height+.05,0],[side*.15,feet+.08,0],.075,.065,skinMat);view.colors.skin.push(leg.material);ball(view.figure,shoeMat,side*.16,feet,.08,.19,.11,.31);}
    }else{
      const end=shorts?.45:feet;
      for(const side of [-1,1]){
        const leg=limb(view.figure,[side*.14,bottomTop-.10,0],[side*.155,end+.08,0],.135,.105,bottomMat);view.colors.bottom.push(leg.material);
        if(shorts){const shin=limb(view.figure,[side*.155,end+.1,0],[side*.155,feet+.08,0],.075,.07,skinMat);view.colors.skin.push(shin.material);}
        ball(view.figure,shoeMat,side*.16,feet,.08,.19,.11,.31);
      }
    }

    const shirtBottom=tunic?waist-.18:waist,torsoHeight=top-shirtBottom;
    const torso=cylinder(view.figure,.36,.28,torsoHeight,shirtMat,0,(top+shirtBottom)/2,0,32);view.colors.shirt.push(torso.material);
    for(const side of [-1,1]){
      const sleeve=limb(view.figure,[side*.28,2.10,0],[side*.53,1.75,0],.12,.095,shirtMat);view.colors.shirt.push(sleeve.material);
      const forearm=limb(view.figure,[side*.53,1.75,0],[side*.55,1.47,0],.082,.066,skinMat);view.colors.skin.push(forearm.material);
      ball(view.figure,skinMat,side*.55,1.42,0,.075,.095,.075);
      cylinder(view.figure,.085,.082,.07,accentMat,side*.55,1.52,0,18);
      if(pinafore){const strap=limb(view.figure,[side*.13,2.20,.04],[side*.20,1.48,.12],.05,.05,bottomMat);view.colors.bottom.push(strap.material);}
    }
    // Shirt front details are kept forward of the fabric so they remain visible while rotating.
    const front=.39;
    for(const side of [-1,1]){
      const collar=put(view.figure,new THREE.ConeGeometry(.115,.17,4),accentMat,[side*.095,2.185,front],null);collar.rotation.z=Math.PI;
    }
    const placket=put(view.figure,new THREE.BoxGeometry(.075,.58,.018),accentMat,[0,1.90,front+.02],null);
    for(let i=0;i<4;i++)ball(view.figure,trimMat,0,2.02-i*.14,front+.04,.013,.013,.01);
    put(view.figure,new THREE.BoxGeometry(.14,.16,.025),accentMat,[.20,1.91,front+.02],null);
    if(stateForDesign.tie){
      const knot=put(view.figure,new THREE.BoxGeometry(.09,.09,.05),tieMat,[0,2.08,front+.06],null);knot.rotation.z=Math.PI/4;
      put(view.figure,new THREE.CylinderGeometry(.012,.055,.37,5),tieMat,[0,1.79,front+.06],null);
    }
    put(view.figure,new THREE.BoxGeometry(.09,.115,.025),trimMat,[.22,1.96,front+.045],null);
    if(stateForDesign.blazer){
      const jacket=cylinder(view.figure,.375,.30,torsoHeight*.96,bottomMat,0,(top+shirtBottom)/2,0,32);view.colors.bottom.push(jacket.material);
      for(const side of [-1,1]){
        const lapel=put(view.figure,new THREE.BufferGeometry(),bottomMat,[side*.035,2.12,.43],null,'bottom');
        const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(side*.14,.16);shape.lineTo(side*.27,-.1);shape.lineTo(side*.19,-.39);shape.lineTo(side*.04,-.23);shape.closePath();
        lapel.geometry=new THREE.ShapeGeometry(shape);
      }
    }
    if(pinafore){
      const pinaforeMat=bottomMat;
      const bodice=cylinder(view.figure,.205,.24,.56,pinaforeMat,0,waist+.24,.24,28);view.colors.bottom.push(bodice.material);
      put(view.figure,new THREE.BoxGeometry(.40,.38,.09),pinaforeMat,[0,waist+.45,.36],null,'bottom');
    }

    const neck=cylinder(view.figure,.12,.13,.24,skinMat,0,2.34,0);view.colors.skin.push(neck.material);
    put(view.figure,new THREE.SphereGeometry(1,24,16),skinMat,[0,headY,0],[headR,headR*1.16,headR*.88],'skin');
    for(const side of [-1,1]){
      ball(view.figure,skinMat,side*headR*.98,headY-.03,0,.07,.105,.065);
      ball(view.figure,material('#302b29'),side*.105,headY+.018,headR*.82,.023,.03,.016);
      ball(view.figure,accentMat,side*.105,headY+.03,headR*.87,.008,.009,.006);
    }
    ball(view.figure,skinMat,0,headY-.075,headR*.91,.035,.055,.045);
    const hair=ball(view.figure,hairMat,0,headY+headR*.53,-.015,headR*1.03,headR*.68,headR*.94);
    if(girl){for(const side of [-1,1]){ball(view.figure,hairMat,side*headR*.82,headY-.10,-.035,.09,.42,.12);ball(view.figure,hairMat,side*.17,headY+headR*1.02,.01,.10,.11,.09);}}
    else for(let i=0;i<5;i++)ball(view.figure,hairMat,-.22+i*.11,headY+headR*.78,-.03,.09,.08,.09);
    view.figure.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    paint(view,stateForDesign);
  }

  function paint(view,design){
    view.colors.shirt.forEach(m=>m.color.set(design.shirt));
    view.colors.bottom.forEach(m=>m.color.set(design.bottom));
    view.colors.skin.forEach(m=>m.color.set(state.skin));
  }
  function createViewer(side){
    const host=document.getElementById('viewer-'+side),renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,100),root=new THREE.Group();scene.add(root);
    scene.add(new THREE.HemisphereLight(0xfff7e9,0x777260,2.0));
    const key=new THREE.DirectionalLight(0xfff3df,3.1);key.position.set(-3.5,6,5);scene.add(key);
    const fill=new THREE.DirectionalLight(0xdce8ff,1.15);fill.position.set(4,3,-3);scene.add(fill);
    const rim=new THREE.DirectionalLight(0xf2bd94,1);rim.position.set(1,4,3);scene.add(rim);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0xf2f0e8,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;scene.add(floor);
    const platform=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.12,.08,48),new THREE.MeshStandardMaterial({color:0xe4e2d7,roughness:.82}));platform.position.y=.04;scene.add(platform);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1.07,.012,8,64),new THREE.MeshStandardMaterial({color:0xb7b6a6,metalness:.25,roughness:.45}));ring.rotation.x=Math.PI/2;ring.position.y=.085;scene.add(ring);
    const figure=new THREE.Group();figure.position.y=.08;root.add(figure);
    const view={host,renderer,scene,camera,root,figure,colors:{skin:[],shirt:[],bottom:[]},radius:6.15,theta:0,phi:1.47,drag:false,x:0,y:0};
    function resize(){const box=host.getBoundingClientRect();if(!box.width||!box.height)return;renderer.setSize(box.width,box.height,false);camera.aspect=box.width/box.height;camera.updateProjectionMatrix();camera.position.set(view.radius*Math.sin(view.phi)*Math.sin(view.theta),1.56+view.radius*Math.cos(view.phi),view.radius*Math.sin(view.phi)*Math.cos(view.theta));camera.lookAt(0,1.56,0);}
    view.resize=resize;new ResizeObserver(resize).observe(host);resize();
    renderer.domElement.addEventListener('pointerdown',e=>{view.drag=true;view.x=e.clientX;view.y=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});
    renderer.domElement.addEventListener('pointermove',e=>{if(!view.drag)return;view.theta-=(e.clientX-view.x)*.008;view.phi=Math.max(.42,Math.min(2.68,view.phi+(e.clientY-view.y)*.008));view.x=e.clientX;view.y=e.clientY;resize();});
    const stop=()=>view.drag=false;renderer.domElement.addEventListener('pointerup',stop);renderer.domElement.addEventListener('pointercancel',stop);
    renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();view.radius=Math.max(3.5,Math.min(7,view.radius+e.deltaY*.004));resize();},{passive:false});
    return view;
  }

  function updateOutfitControls(){
    for(const side of ['a','b']){
      const select=document.getElementById('outfit-'+side),choices=outfitOptions[state.model];
      if(!choices.some(([v])=>v===state[side].outfit))state[side].outfit=choices[0][0];
      select.innerHTML=choices.map(([v,label])=>`<option value="${v}">${label}</option>`).join('');select.value=state[side].outfit;
      document.getElementById('model-label-'+side).textContent=state.model==='boy'?'SCHOOL BOY':'SCHOOL GIRL';
    }
  }
  function rebuild(side){buildFigure(viewers[side],state[side]);}
  function animate(){requestAnimationFrame(animate);for(const view of Object.values(viewers))view.renderer.render(view.scene,view.camera);}
  viewers.a=createViewer('a');viewers.b=createViewer('b');updateOutfitControls();rebuild('a');rebuild('b');animate();
  window.addEventListener('resize',()=>Object.values(viewers).forEach(v=>v.resize()));

  document.querySelectorAll('[data-model]').forEach(button=>button.addEventListener('click',()=>{
    state.model=button.dataset.model;document.querySelectorAll('[data-model]').forEach(other=>{const active=other===button;other.classList.toggle('active',active);other.setAttribute('aria-pressed',String(active));});updateOutfitControls();rebuild('a');rebuild('b');
  }));
  document.querySelectorAll('[data-tone]').forEach(button=>button.addEventListener('click',()=>{
    state.skin=button.dataset.tone;document.querySelectorAll('[data-tone]').forEach(other=>{const active=other===button;other.classList.toggle('active',active);});Object.values(viewers).forEach(v=>v.colors.skin.forEach(m=>m.color.set(state.skin)));
  }));
  document.querySelectorAll('.outfit-select').forEach(select=>select.addEventListener('change',()=>{const side=select.id.endsWith('a')?'a':'b';state[side].outfit=select.value;rebuild(side);}));
  document.querySelectorAll('.color-dot').forEach(button=>button.addEventListener('click',()=>{
    const row=button.closest('.color-row'),side=row.dataset.design,key=row.dataset.target;state[side][key]=button.dataset.colour;row.querySelectorAll('.color-dot').forEach(other=>other.classList.toggle('selected',other===button));
    document.getElementById(key==='shirt'?'shirt-name-'+side:'bottom-name-'+side).textContent=button.dataset.name;paint(viewers[side],state[side]);
  }));
  document.querySelectorAll('.custom-dot input').forEach(input=>input.addEventListener('input',()=>{
    const row=input.closest('.color-row'),side=row.dataset.design,key=row.dataset.target;state[side][key]=input.value;row.querySelectorAll('.color-dot').forEach(button=>button.classList.remove('selected'));
    document.getElementById(key==='shirt'?'shirt-name-'+side:'bottom-name-'+side).textContent='Custom shade';paint(viewers[side],state[side]);
  }));
  document.querySelectorAll('.detail-toggle').forEach(button=>button.addEventListener('click',()=>{
    const side=button.dataset.design,key=button.dataset.detail;state[side][key]=!state[side][key];button.setAttribute('aria-pressed',String(state[side][key]));rebuild(side);
  }));
  document.querySelectorAll('.design-heading input').forEach(input=>input.addEventListener('input',()=>{const side=input.id.endsWith('a')?'a':'b';document.querySelector(`.design-card[data-design="${side}"] .design-id`).textContent=(side==='a'?'DESIGN A · ':'DESIGN B · ')+(input.value.trim()||'UNTITLED').toUpperCase();}));
  document.querySelectorAll('[data-save]').forEach(button=>button.addEventListener('click',()=>{
    const side=button.dataset.save,canvas=viewers[side].renderer.domElement;canvas.toBlob(blob=>{if(!blob)return;const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`stitch-room-design-${side}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);},'image/png');
  }));
})();

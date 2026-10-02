/* Woman: 9-week tone-and-tighten plan in 3 levels (3 weeks each). Weeks count from your first session. */
(window.PROFILES = window.PROFILES || {}).woman = {
  id:'woman', name:'Woman',
  splash:{img:'img/profile/woman.jpg', text:'WOMAN', color:'#FFFFFF', shadow:'0 6px 40px rgba(120,40,70,.55)', pos:'50% 18%', theme:'#E9C9D0', thumbPos:'50% 22%'},
  goal:{weeks:9, sessions:40, weekly:'0.4–0.55 kg down'},
  wristPills:true,
  meas:[['waist','Waist'],['hips','Hips'],['arm','Upper arm']],
  cycle:['A','P','R','B','U','R'],
  days:{
    A:{name:'Lower A',short:'Lower A',sub:'Glutes + quads'},
    P:{name:'Upper Pull',short:'Pull',sub:'Back + posture'},
    B:{name:'Lower B',short:'Lower B',sub:'Glutes + hamstrings'},
    U:{name:'Upper Push',short:'Push',sub:'Chest, shoulders, triceps'},
  },
  levels:{
    1:{name:'Learn',w:[1,3],rir:'Stop with 3 reps left in the tank'},
    2:{name:'Load',w:[4,6],rir:'Stop with 2 reps left in the tank'},
    3:{name:'Build',w:[7,null],rir:'Stop with 1–2 reps left in the tank'},
  },
  levelNote:'Weeks 1–3 Learn · Weeks 4–6 Load · Weeks 7–9 Build, then keep building',
  walk:{2:10,3:15},
  warm:{title:'Warm-up',top:'Before every session',badge:'W',short:'Warm-up',mins:'8 min',note:'8 minutes. Gets the shoulders down and the glutes switched on before any weight.',items:[
    {t:'Incline walk',d:'5 min, easy pace',img:null,q:'incline treadmill walk'},
    {t:'Cat-cow',d:'10 slow reps',img:'Cat_Stretch',q:'cat cow stretch'},
    {t:'Wall slides',d:'2 × 10, shoulders down',img:null,q:'wall slides shoulder posture exercise'},
    {t:'Scapular pulldowns',d:'2 × 10, light, arms straight',img:'Scapular_Pull-Up',q:'scapular pulldown lat machine'},
    {t:'Glute bridge',d:'2 × 12, 2-sec squeeze',img:'Butt_Lift_Bridge',q:'glute bridge exercise'},
  ]},
  gates:[
    {k:'g1',t:'Every set hits the top of its rep range with good form'},
    {k:'g2',t:'Wrist pain stays at or below 2/10, during and the next day'},
    {k:'g3',t:'Shoulders stay down on pulldowns and rows'},
    {k:'g4',t:'10 incline push-ups at hip height + a 3-sec flat-back hip hinge',lv:1},
    {k:'g5',t:'3 controlled assisted pull-up lowerings + split squats without holding on',lv:2},
  ],
  finalNote:'Keep adding weight when every set hits the top of its range. Before a big event, taper for 7–10 days: half the sets, same weights, no legs in the last 3 days.',
  rules:[
    ['WRISTS','Neutral grips. Straps on every pull and RDL. Push-ups on a bar or handles, never flat palms. No dips, barbell bench, straight-bar curls. Pain above 3/10 → switch to the machine version.'],
    ['SHOULDERS','“Shoulders in back pockets” before every pull and press. No shrugs, upright rows or front raises.'],
    ['PACING','Rest 90 s on big lifts, 60 s on small ones. Sessions run 50–60 min.'],
    ['FOOD','Small calorie deficit (roughly 300–500 kcal under maintenance) · about 1.6 g protein per kg · 8–10k steps · 7 h sleep · 2.5–3 L water.'],
  ],
  restCopy:{big:'8–10k steps',cap:'Walk, stretch, sleep 7 hours.'},
  plan:{
    1:{
      A:[['glute_bridge',3,'15','2-second squeeze at the top. Rest a plate on the hips once 15 is easy.'],['leg_press',3,'12–15','Feet high on the platform. 3-second lowering.'],['box_squat',3,'10','Sit back to the bench, stand up through the heels.'],['leg_curl',3,'12–15','Slow on the way back up.'],['abduction',2,'15–20','Lean slightly forward to hit the glutes.'],['dead_bug',2,'8 / side','Lower back stays pressed into the floor.']],
      P:[['assisted_pullup',3,'8–10','Set the help so rep 10 is hard. Start every rep by pulling the shoulders down.'],['pulldown',3,'12','Neutral grip, straps on. Shoulders in back pockets.'],['cable_row',3,'12','Neutral handle. Pause 1 second at the chest.'],['face_pull',2,'15','Pull to the eyebrows, elbows high.'],['y_raise',2,'10','No weight. Thumbs up, shoulders away from ears.'],['hammer_curl',2,'12','Light. Neutral grip keeps the wrists happy.']],
      B:[['pull_through',3,'12','Teaches the hip hinge. Push the hips back, squeeze forward.'],['hip_thrust_m',3,'12','Machine or Smith, pad on the hips. Chin tucked.'],['step_up',3,'10 / leg','Low box, bodyweight. Drive through the front heel.'],['back_ext',2,'12','Round the upper back slightly so the glutes do the work.'],['abduction',2,'20','Lean slightly forward.'],['side_plank',2,'20 / side','From the knees. Hips stay high.']],
      U:[['chest_press',3,'12','Neutral handles. Shoulders down and back.'],['incline_pushup',3,'8','Smith bar at hip height. Straight wrists on the bar.'],['shoulder_press',2,'12','Stop just short of locking out.'],['lateral',2,'12–15','Lead with the elbow, no shrugging.'],['pushdown',3,'12–15','Elbows pinned to the sides.'],['wall_slides',2,'10','Posture finisher. Ribs down, shoulders down.']],
    },
    2:{
      A:[['hip_thrust',3,'10','Barbell or Smith, pad on the bar. Pause at the top.'],['leg_press',3,'10–12','Feet high.'],['reverse_lunge',3,'8 / leg','In the Smith machine. Step back, drop straight down.'],['leg_curl',3,'10–12',''],['abduction',3,'15',''],['cable_crunch',3,'12','Curl the ribs to the hips, not the head to the floor.']],
      P:[['assisted_pullup',3,'6–8','Drop the help by 2.5 kg each time you hit 8 on every set.'],['pulldown',3,'10','Straps on.'],['cs_row',3,'10','Straps on. Chest stays on the pad.'],['face_pull',3,'15',''],['y_raise',2,'12','1 kg plates.'],['hammer_curl',2,'12','']],
      B:[['db_rdl',3,'10','Straps on, 3-second lowering. Flat back, soft knees.'],['split_squat',3,'8 / leg','Smith, rear foot on the floor.'],['back_ext',3,'12','Hold a plate once 12 is easy.'],['abduction',3,'15–20',''],['dead_bug',3,'8 / side','Slow.']],
      U:[['chest_press',3,'10',''],['incline_pushup',3,'max − 2','One notch lower on the Smith bar each cycle. Stop 2 reps short.'],['shoulder_press',3,'10',''],['lateral',3,'12–15',''],['pushdown',3,'12',''],['oh_ext',2,'12','Elbows close to the head.']],
    },
    3:{
      A:[['hip_thrust',4,'8–10','Heavier now. Full lockout, 1-second squeeze.'],['leg_press',3,'10–12','Feet high.'],['reverse_lunge',3,'8–10 / leg','Smith machine.'],['leg_curl',3,'10–15',''],['cable_crunch',3,'10–15','']],
      P:[['assisted_pullup',3,'6–8','Then 3 slow 5-second lowerings on your own to finish.'],['pulldown',3,'10–12','Straps on.'],['cs_row',3,'10–12','Straps on.'],['face_pull',3,'15',''],['y_raise',2,'12',''],['hammer_curl',2,'12','']],
      B:[['db_rdl',3,'8–10','Dumbbell or Smith, straps on.'],['bulgarian',3,'8 / leg','Rear foot on the bench. Lean slightly forward for glutes.'],['back_ext',3,'12','Glute-biased.'],['abduction',3,'15–20',''],['dead_bug',3,'8 / side','Slowly.']],
      U:[['chest_press',3,'8–12',''],['incline_pushup',3,'max','Lowest incline you can manage, handles only.'],['shoulder_press',3,'10',''],['lateral',3,'12–15',''],['pushdown',3,'12–15',''],['face_pull',2,'15','Posture finisher.']],
    }
  },
};

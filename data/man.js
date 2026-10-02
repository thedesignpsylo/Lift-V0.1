/* Man: 5-day Push / Pull / Legs / Upper / Lower (PPLUL) lean-bulk plan.
   Built around a sensitive neck, a weaker shoulder on one side, and lagging
   delts, forearms, core, glutes and neck. Weeks count from your first session.
   Plan rows: [exercise, sets, reps, note, rest seconds]. '@list' rows are checklists. */
(function(){
  const PU=[ // Push
    ['@prep'],
    ['db_ohp',3,'6–8','Weaker side leads the tempo. Back supported, chin neutral.',150],
    ['incline_db',3,'8–10','Elbows about 45° from your torso.',120],
    ['chest_press',3,'8–10','Or flat dumbbell press: pick whichever feels cleanest on the shoulders.',120],
    ['lateral',4,'12–15','One arm at a time, weaker side first. Plus one extra weaker-side set.',75],
    ['cable_fly',3,'12–15','Slow stretch at the bottom.',75],
    ['oh_ext',3,'10–12','Long head of the triceps.',90],
    ['pushdown',2,'12–15','Elbows pinned.',60],
    ['pallof',2,'10 / side','Core: resist the rotation.',50],
  ];
  const PL=[ // Pull
    ['pullup',4,'6–10','Shoulders down first. No chin poke. Assisted machine if you can’t hit 6.',150],
    ['cs_row',3,'8–10','Chest stays on the pad.',120],
    ['lat_pulldown',3,'10–12','To the chest. Never behind the neck.',90],
    ['db_row',3,'8–10 / arm','Weaker side first; the other side matches its reps.',90],
    ['face_pull',3,'15–20','Elbows high, rotate the hands back.',60],
    ['rev_fly',3,'12–15','Rear delts.',60],
    ['incline_curl',3,'10–12','Long head of the biceps.',90],
    ['hammer_curl',2,'10–12','',60],
    ['reverse_curl',3,'12–15','Forearms and brachioradialis.',60],
    ['dead_hang',2,'20–40','Grip. Skip it if the shoulder complains.',60],
  ];
  const LG=[ // Legs
    ['hack_squat',4,'6–8','Keeps the bar off your neck. Leg press if there’s no hack squat.',150],
    ['rdl',3,'8–10','Neck neutral. Exhale as you stand.',150],
    ['walking_lunge',3,'10 / leg','Long stride shifts the load to the glutes.',90],
    ['leg_ext',3,'12–15','',75],
    ['leg_curl',3,'10–12','',75],
    ['calf_raise',4,'8–12','2-second pause at the stretch.',60],
    ['lateral',3,'15–20','Delt finisher. Weaker side first.',60],
    ['knee_raise',3,'10–15','Curl the pelvis up, don’t swing.',60],
  ];
  const UP=[ // Upper (heavier day)
    ['@prep'],
    ['landmine_press',3,'6–8 / arm','Weaker side first. Kind to the neck and the shoulder.',120],
    ['db_bench',4,'6–8','Heavy and controlled. Breathe out on every press.',150],
    ['pulldown',3,'6–8','Neutral grip. A weighted pull-up works too.',120],
    ['cable_row',3,'8–10','',90],
    ['lean_lateral',4,'12–20','Weaker side first. Plus one extra weaker-side set.',60],
    ['rev_fly',3,'15','',60],
    ['ez_curl',3,'8–10','',90],
    ['oh_ext_1arm',3,'10–12 / arm','',60],
    ['wrist_curl',3,'15–20','Curls then extensions, back to back.',60],
    ['farmer',3,'30–40','Heavy. Ribs down, no shrugging to the ears.',90],
  ];
  const LO=[ // Lower
    ['hip_thrust',4,'6–10','Pause 1 second at the top. Chin tucked, pad on the bar.',150],
    ['db_bulgarian',3,'8–10 / leg','Lean slightly forward for glutes.',120],
    ['leg_press',3,'10–12','Feet high and wide.',120],
    ['lying_curl',3,'8–12','',90],
    ['back_ext',3,'10–12','Round the upper back slightly.',90],
    ['abduction',3,'15–20','',60],
    ['calf_raise',3,'12–15','',60],
    ['cable_crunch',3,'10–15','Ribs to hips.',60],
    ['side_plank_full',2,'30–45 / side','',45],
  ];
  const block=neck=>({PU, PL:PL.concat([['@'+neck]]), LG, UP, LO});
  const deload=b=>{ const o={}; Object.keys(b).forEach(k=>o[k]=b[k].map(r=>r[0][0]==='@'?r:[r[0],Math.max(1,Math.ceil(r[1]/2)),r[2],'Deload: same weight as last time, half the sets.',r[4]])); return o; };
  const B1=block('neck'), B2=block('neck2');

  (window.PROFILES = window.PROFILES || {}).man = {
    id:'man', name:'Man',
    splash:{img:'img/profile/man.jpg', text:'MAN', color:'#0A0A0A', shadow:'none', pos:'50% 100%', theme:'#F4F4F4', thumbPos:'50% 28%', pickPos:'50% 75%'},
    goal:{weeks:9, sessions:45, weekly:'0.2–0.3% of body weight up'},
    meas:[['shoulders','Shoulders'],['chest','Chest'],['waist','Waist'],['neck','Neck'],['armL','Left arm'],['armR','Right arm']],
    ratio:{a:'shoulders',b:'waist',target:1.618,label:'Shoulder ÷ waist',cap:'The Greek ideal is 1.618: shoulders around the widest point of the delts, waist at the narrowest point.'},
    cycle:['PU','PL','LG','R','UP','LO','R'],
    days:{
      PU:{name:'Push',short:'Push',sub:'Shoulders first, then chest and triceps'},
      PL:{name:'Pull',short:'Pull',sub:'Lats, rear delts, biceps, forearms'},
      LG:{name:'Legs',short:'Legs',sub:'Quads, hamstrings, calves, abs'},
      UP:{name:'Upper',short:'Upper',sub:'Heavier: shoulders, chest, back, arms, grip'},
      LO:{name:'Lower',short:'Lower',sub:'Glutes and hamstrings first, then core'},
    },
    levels:{
      1:{name:'Build 1',w:[1,4],rir:'Big lifts: stop with 2–3 reps left. Small lifts: 1–2 left'},
      2:{name:'Deload',w:[5,5],rir:'Deload: same weights, half the sets',deload:1},
      3:{name:'Build 2',w:[6,8],rir:'Big lifts: stop with 1–2 reps left. Last small-lift set near failure'},
      4:{name:'Deload + test',w:[9,9],rir:'Deload: same weights, half the sets. Re-measure on the last day',deload:1},
      5:{name:'Keep going',w:[10,null],rir:'Big lifts: stop with 1–2 reps left. Rotate exercises every 8–12 weeks'},
    },
    levelNote:'Weeks 1–4 Build 1 · Week 5 Deload · Weeks 6–8 Build 2 · Week 9 Deload + checkpoint · Week 10 on: keep going',
    warm:{title:'Warm-up',top:'Before every session',badge:'W',short:'Warm-up',mins:'8 min',note:'Raise the temperature, wake up the shoulder blades, then ramp into the first lift.',items:[
      {t:'Easy cardio',d:'5 min, bike or incline walk',img:null,q:'incline treadmill walk'},
      {t:'Band pull-aparts',d:'2 × 15, arms straight',img:'Band_Pull_Apart',q:'band pull apart'},
      {t:'Wall slides',d:'2 × 10, ribs down',img:null,q:'wall slides shoulder posture exercise'},
      {t:'Chin tucks',d:'10 slow reps, standing tall',img:null,q:'chin tuck exercise posture'},
      {t:'Ramp-up sets',d:'2 light sets of your first lift',img:null,q:'warm up sets ramping'},
    ]},
    lists:{
      prep:{title:'Shoulder prep',top:'Shoulder health block',badge:'S',short:'Shoulder prep',mins:'10 min',note:'Lower traps, serratus and rotator cuff. Light and slow, both sides, weaker side first.',items:[
        {t:'Prone Y-raise',d:'2 × 10, light or no weight, thumbs up',img:'Dumbbell_Lying_Rear_Lateral_Raise',q:'prone incline Y raise'},
        {t:'Push-up plus',d:'2 × 10. At the top, push the floor away to spread the shoulder blades',img:'Pushups',q:'push up plus serratus'},
        {t:'Band external rotation',d:'2 × 15 per side, elbow pinned at your side',img:'External_Rotation_with_Band',q:'band external rotation shoulder'},
      ]},
      neck:{title:'Neck: control',top:'After training · weeks 1–4',badge:'N',short:'Neck',mins:'6 min',note:'Gentle effort, about 3 out of 10. Stop at any headache pressure, dizziness, vision change or arm tingling.',items:[
        {t:'Chin nods',d:'10 × 10 s, lying on your back. Nod as if saying yes and hold',img:null,q:'deep neck flexor chin nod exercise'},
        {t:'Isometric front + back',d:'3 × 10 s each way, palm against the head, 3/10 effort',img:'Isometric_Neck_Exercise_-_Front_And_Back',q:'isometric neck exercise front back'},
        {t:'Isometric sides',d:'2 × 10 s each side',img:'Isometric_Neck_Exercise_-_Sides',q:'isometric neck exercise sides'},
        {t:'Isometric rotation',d:'2 × 8 s each way, palm at the temple',img:null,q:'isometric neck rotation exercise'},
      ]},
      neck2:{title:'Neck: light load',top:'After training · weeks 6–8',badge:'N',short:'Neck',mins:'8 min',note:'Only if a physio or doctor cleared loaded neck work and you had no amber or red signals for 4 weeks. Otherwise repeat the control routine. Effort never above 6 out of 10.',items:[
        {t:'Chin nods',d:'10 × 10 s',img:null,q:'deep neck flexor chin nod exercise'},
        {t:'Band neck flexion',d:'2 × 15, slow, no jerking',img:null,q:'band neck flexion exercise'},
        {t:'Prone neck lifts',d:'2 × 15–20, bodyweight only, face down on a bench',img:'Lying_Face_Down_Plate_Neck_Resistance',q:'prone neck extension bodyweight'},
        {t:'Isometric sides',d:'2 × 10 s each side',img:'Isometric_Neck_Exercise_-_Sides',q:'isometric neck exercise sides'},
      ]},
    },
    gates:[
      {k:'g1',t:'Every set reached the top of its range at the planned effort'},
      {k:'g2',t:'No amber or red neck signals in the last 2 weeks'},
      {k:'g3',t:'On single-arm lifts, the stronger side matched the weaker side’s reps'},
      {k:'g4',t:'A physio or doctor has checked your neck before light neck loading',lv:2},
    ],
    finalNote:'Keep the split. Swap in new exercise variations every 8–12 weeks, re-measure each quarter, and chase the shoulder-to-waist ratio. Go to maintenance calories about 3 weeks before a big event.',
    rules:[
      ['NECK','Exhale through the hard part of every rep, never hold your breath across reps. Chin neutral, never poked forward. No barbell back squats, heavy shrugs, behind-the-neck work, upright rows or max singles.'],
      ['STOP RULES','Green: no neck tension or headache within 30 min → progress. Amber: tightness or a mild headache → cut that lift 10–20% next time, drop it if it repeats. Red: sudden or pulsing headache, vision change, dizziness, arm numbness → stop and see a doctor.'],
      ['WEAKER SIDE','Single-arm lifts start on the weaker side. The stronger side matches its reps, never more. One extra weaker-side set on the Push and Upper lateral raises.'],
      ['PACING','Lower every rep over 2–3 seconds. Rest follows the timer. Sessions run 65–80 min.'],
      ['FOOD','Lean bulk: roughly 250–350 kcal over maintenance, gaining 0.2–0.3% of body weight a week on the 7-day average. Protein 1.6–2.2 g per kg. Regular sleep, meals and water.'],
      ['DESK','Screen at eye level, stand every 45 min, and do 2 min of chin tucks, pec stretch and thoracic extension every day.'],
    ],
    restCopy:{big:'8–10k steps',cap:'Walk, then 5 min of chin nods and gentle neck isometrics, and 10 min of mobility.'},
    plan:{1:B1, 2:deload(B1), 3:B2, 4:deload(B2), 5:B2},
  };
})();

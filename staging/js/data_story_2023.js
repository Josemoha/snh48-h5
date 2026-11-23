/* ============================================================================
   data_story_2023.js — 剧情数据（2023「交棒」线，框架版）
   ----------------------------------------------------------------------------
   【同人声明】本文件全部剧情为粉丝同人虚构创作，与现实无关；真实成员/管理层
   的言行均为艺术演绎，随机事件中涉及成员的一律用「某成员」指代。
   【考据约定】2023 史实细节（人员变动、活动日期等）均待用户口径，Agent 不虚构
   ——见文末「待用户口径补充」注释。

   ----------------------------------------------------------------------------
   【进入方式】本线由 2022 线结局界面的「进入下一年」入口进入（Game.carryTo2023 接线）。
   【集团策略（用户口径）】大股东抛售股票，丝芭由子杰表妹名义全资控股——集团资金
   情况不如过去，需要开源节流；大方向延续元宇宙发展方略，今年试运行虚拟形象公演
   常态化与虚拟形象直播。
   【交棒口径（用户口径）】今年是王子杰最后一年管理一线事务——明年起一线管理交给
   王婧和陶莺；他希望「塞纳河走向全国」的计划延续（本线为 2026「革新征程」的前奏）。

   【年度活动模式（用户口径：自动追随去年）】
     · decisions.geMode21=partner → 组合模式「年度最佳拍档」继续（组队制总选，
       4月钦点5组→4月末自动组队→补配→8月月首收口、8月开榜公开前33名；
       组分口径同 bp21PairScore）；
     · decisions.geMode21=classic → 「青春盛典」（8月开榜，个人榜）＋
       《最佳拍档》第三季作为独立综艺（6月开榜，前五）。

   【五条主线】
     ① 虚拟直播、公演的构建：行动 virt23 三段——虚拟公演常态化机制(25万)→
        虚拟形象直播上线试运行(30万)→常态化运营评估(20万)；完成后 flags.virt23Done，
        此后每月收入+8万（STORY.VIRT23_INCOME，数额可调）。
     ② 成都丝芭（CGT48）筹备：1月决策事件（tag cgt23Plan）——
        · now（今年就办）→ 追加主线二：行动 cgt23 三段——立项签约(20万)→
          场馆建设(60万)→开业筹备(40万)；完成 flags.cgt23Open（成都丝芭开幕，
          此后每月收入+15万 STORY.CGT23_INCOME；融资资本，结局评分计分）。
          【2年期限（用户口径）】2023~2024 两年内必须完成开幕，作为融资的资本；
          2023 年末未完成则 2024 线继续推进（flags.cgt23Open 跨年携带）。
        · later（明年再说）→ 今年不追加主线二；flags.cgt23Deferred=true
          （2024 线待建：自动成立钩子，届时按口径接线）。
     ③ 恢复旗号（小组阁）：此前因疫情、资金问题取消队伍建制的 CKG48、BEJ48
        今年恢复旗号——行动 reorg23：分别为 BEJ48（Team B/E/J）与 CKG48
        （Team K/C）的在册成员分队（showTeamAssignPicker 默认去向，低点击量）；
        完成 flags.reorg23Done（士气+2 热度+4）。
     ④ 两大年度活动：引擎接线（era 2023 总选窗口 4~7月筹备、8月开榜，同 2022；
        模式自动沿用 geMode21）＋《最佳拍档》第三季（行动 bp23）。
        【新规（用户口径）】除玩家点将的组合外，不得出现第二届的配对
        （decisions.gePairs22）；可以出现第一届的配对（gePairs21）——
        自动组队与自动收口均避开第二届名单，玩家钦点/补配允许重复。
     ⑤ 控制失格值（开源节流）：行动 dqfine（月度行动）——对高失格值成员
        （dq≥40）罚款惩戒：资金入库（按失格值档位 5~13 万）、该成员 dq-10、
        羁绊-2、士气-1；每人每年限一次（flags.fine23List）。

   决策标签（st.decisions）：cgt23Plan（1月成都决策：now=今年就办追加主线二 /
     later=明年再说，24 年自动成立）/ gePicked23 / geAutoPairs23 / geSingles23 /
     geSupPairs23 / geB23Dropped / geAutoFill23 / gePairs23（本年度拍档名单）/
     ge2023Top1 / ge2023Top1All（开榜登记，明年连霸判定基准）/
     bp23Travel23 {members, used}（本年度第一名组合双人旅行综艺，待明年回收）/
     smy23（6月沈梦瑶解约风波：release=允许解约 / stay=挽留成功 / keepFail=挽留失败自动解约）/
     chy23（6月陈泓宇私联风波：punish=移籍 IDFT / grad=提前毕业 / dismiss=清退）/
     wxj23（5月王晓佳合约期满安置：renew=续约 / film=影视约 / grad=毕业 / staff=转岗）/
     szn23（9月孙珍妮转签影视部：film=同意转签 / stay=留女团）/
     zjw23（9月钟洁玟陈情私联恋爱风波：fire=解约追缴违约金 / idft=移籍 IDFT）/
     zjr23（10月赵佳蕊退团申请：release=允许离团 / stay=挽留并承诺重新分配队伍）/
     cgt23Dir（CGT48 成立后总监任命：player=玩家兼任 / zrl=举荐朱瑞龙 / zhouma=不推举由周马兼任）/
     cgt23Squad（CGT48 自主招募成员分队名册：Team CⅡ/GⅡ/预备生，参照 2026 成员卡口径，
       engine.applyCgt23Squad 登记）/ cgt23Draft（引援调取名册：本部与各分团各一人，羻绊不减，
       engine.applyCgt23Draft 登记）/ cgt23LateFill（持 2026 卡新成员补分队一次性标记）。
   旗标（st.flags）：zjr23ReorgGroup（10月赵佳蕊挽留线：choice stay 登记所在团体，
     组阁窗 pickMode zjr23reorg → UI.showZjrReorg23Picker；组阁落地清位）/
   旗标（st.flags）：virt23Done（主线①达成，月收入+VIRT23_INCOME）/
     cgt23Open（成都丝芭开幕——跨年携带，2024 线据以免重复建设；同时是 CGT48
     一/二期生入册的开关，见 engine.mountCgt23Join）/
     cgt23Deferred（成都明年再办——2024 线自动成立钩子）/
     reorg23Done（主线③旗号恢复完成）/ fine23List（本年已罚款成员名单）/
     layoff21Names/layoff21Choice（名单精简动态分配与待拍板名单，复用 2021/2022 机制）/
     b23Filled23 / bp23ClassicDone。
   主线状态对象（跨年：cgt23Open 线需携带 st.cgt23 进度，2024 线待建）：
     st.virt23 {stage, done} / st.cgt23 {stage, done}。
   ========================================================================== */

"use strict";

/* ---------------- 数值口径（Agent 拟定，可调） ---------------- */
STORY.VIRT23_COST = [25, 30, 20];      // 主线① 三段投入（万）
STORY.VIRT23_INCOME = 8;               // 虚拟公演/直播常态化后每月收入（万）
STORY.CGT23_COST = [20, 60, 40];       // 主线二 三段投入（万）：立项→建设→开业筹备
STORY.CGT23_INCOME = 15;               // 成都丝芭开幕后每月收入（万）
STORY.DQFINE_MIN = 40;                 // 可罚款惩戒的失格值下限
STORY.DQFINE_BASE = 5;                 // 罚款基础额（万）
STORY.DQFINE_STEP = 2;                 // 每失格值 20 追加（万）
STORY.CHY23_PENALTY = 60;              // 2023-06 陈泓宇私联风波·清退解约金（万）
STORY.ZJW23_PENALTY = 60;              // 2023-09 钟洁玟陈情私联恋爱风波·追缴违约金（万）

/* ========================================================================
   一、序章：交棒（2023 年初年度决策会议）
   ======================================================================== */
STORY.prologue23 = {
  sceneLabel: "2023年1月 · 上海 · 星梦剧院 · 年度决策会议",
  pages: st => [
    { nar: true, t: "2023年1月，上海。\n\n今年的决策会议通知比往年早了一周，落款不是行政部，是王子杰本人。你进门的时候就知道——亲自主持，意味着集团又有大事发生。\n\n而这回的大事，对你来说可能不是好消息。" },
    { s: "王子杰", cls: "speaker-wangzj", t: "（把一份股权变动公告放在桌子中央）先说底账：大股东把股票抛了。现在，丝芭由我表妹的名义全资控股——账面上干干净净，实际上，集团的钱，不如过去了。" },
    { s: "王子杰", cls: "speaker-wangzj", t: "所以今年的关键词只有四个字：开源节流。该省的省，该挣的挣。大方向不变——去年立住的元宇宙，今年要往前走一步：虚拟形象公演常态化、虚拟形象直播，今年试运行。" },
    { s: "王子杰", cls: "speaker-wangzj", t: "（翻到第二页）成都和武汉的丝芭项目，第一批分团开启的时候就在企划里。但眼下集团的资金情况——我的建议，先开成都：一来重庆可以就近支援，二来相对来说耗资较少。丑话说在前面：两年内，必须完成成都丝芭的开幕——这是融资的资本。" },
    { s: "王子杰", cls: "speaker-wangzj", t: "（停了停，声音低下来）还有一件事，我只跟你一个人说：今年，可能是我最后一年管一线的事。集团需要我把精力放在融资上，今后一线会交给王婧和陶莺。但我有一个私心——把塞纳河走向全国的计划，延续下去。因为疫情、因为资金，取消了队伍建制的 CKG48 和 BEJ48，今年要恢复旗号。" },
    { nar: true, t: "会议纪要的最后一页，印着今年的主线清单。你注意到王子杰留在这页边角上的一行小字：\n\n「河要从一条变成一片。剩下的路，拜托了。」" },
  ],

  styles: [
    { id: "open23", label: "「开源才有活路——先把新钱挣回来。」", hint: "开拓派：热度+5 资金+15", apply: st => { st.heat = Math.min(100, st.heat + 5); st.money += 15; } },
    { id: "frugal23", label: "「先把家底守住——一块钱掰成两半花。」", hint: "节流派：资金+50", apply: st => { st.money += 50; } },
    { id: "people23", label: "「人是根本——别在孩子们身上省钱。」", hint: "人事派：全员羁绊+3 士气+2", apply: st => { for (const k in st.bonds) st.bonds[k] = Math.min(100, st.bonds[k] + 3); st.morale = Math.min(100, st.morale + 2); } },
  ],

  closing: st => {
    const partner = st.decisions.geMode21 === "partner";
    return [
      { s: "叶盛", cls: "speaker-yesheng", t: "好——今年的线，我给你数一数：" },
      { s: "叶盛", cls: "speaker-yesheng", t: "①虚拟常态化：虚拟形象公演常态化机制、虚拟形象直播试运行、常态化运营评估，三步走完才算立住；②成都丝芭：一月的决策会上你要拍板——今年就办，还是明年再说（就办的话，两年内必须开幕）；③恢复旗号：CKG48、BEJ48 小组阁分队，把取消的建制重新立起来；④年度活动：" + (partner
          ? "「年度最佳拍档」——组合模式继续，四月钦点组队，八月开榜公开前三十三；"
          : "「青春盛典」八月开榜；《最佳拍档》第三季按去年的赛制单独办，六月开榜——新规矩：除了你亲自点将的，不得出现第二届的配对（第一届的老搭档可以重逢）。") },
      { s: "叶盛", cls: "speaker-yesheng", t: "⑤还有一条节流的新政：集团授权你对高失格值的成员罚款惩戒——失格值那是档案上的红字，罚一次，长一次记性。开源节流之年，每一笔账都要算得清清楚楚。" },
      { nar: true, t: "散会后，你把会议纪要收进抽屉最上层——那是去年十周年大合影的旁边。\n\n今年一月的第一份拍板文件，是成都项目的立项申请。" },
    ];
  },
};

/* ========================================================================
   二、行动剧情场景（scenes23）
   ======================================================================== */
STORY.scenes23 = {

  /* ---- 主线①：虚拟常态化 · 三段 ---- */
  virtStage: {
    label: "虚拟公演常态化 · 机制搭建",
    pages: st => [
      { nar: true, t: "去年立住的虚拟剧场，今年要长进日程表里：每周固定的虚拟公演场次、虚拟形象专属机位、线上票务与打赏通道——一套常态化运营的机制，在排练室的白板上慢慢成形。" },
      { s: "马跃", cls: "", t: "（敲定排期表）总监，虚拟公演从此不再是「特别场」，是每周都有的「正场」。真人的剧场照常开，虚拟的剧场排错峰——一个团，两个舞台，双份的票仓。（资金-" + STORY.VIRT23_COST[0] + " 万 热度+3）" },
      { nar: true, t: "（机制搭建完成。下一步：虚拟形象直播上线试运行。）" },
    ],
  },
  virtLive: {
    label: "虚拟形象直播 · 试运行",
    pages: st => [
      { nar: true, t: "虚拟形象直播间第一次开播：数字分身在镜头前打招呼、聊天、唱歌，弹幕里刷满了「分身比我本人还勤快」。首播的打赏数据不高，但在线人数的曲线，稳稳地站住了。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（盯着后台数据）总监，真人直播拼的是临场，虚拟直播拼的是「永远在线」——试运行数据立住了，这条路就通了。（资金-" + STORY.VIRT23_COST[1] + " 万 热度+4 训练+2）" },
      { nar: true, t: "（试运行上线。下一步：常态化运营评估。）" },
    ],
  },
  virtDone: {
    label: "虚拟常态化 · 运营评估",
    pages: st => [
      { nar: true, t: "首季运营评估会：虚拟公演的场均上座、虚拟直播的打赏曲线、两条线的互相导流——数据把「试运行」三个字划掉，换上了「常态化」。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（在评估报告上签字）总监，去年元宇宙立的是概念，今年立的是营生。河的第二个世界，正式挂牌营业。（★主线①达成 此后每月收入+" + STORY.VIRT23_INCOME + " 万）" },
      { nar: true, t: "（★主线①「虚拟直播、公演的构建」达成——虚拟形象公演常态化与虚拟形象直播转入常态运营。flags.virt23Done。）" },
    ],
  },

  /* ---- 主线二：成都丝芭（CGT48） · 三段 ---- */
  cgtSign: {
    label: "成都丝芭 · 立项签约",
    pages: st => [
      { nar: true, t: "成都项目的立项书签了字：选址、批文、与重庆剧场的支援动线——第一批分团企划里沉睡多年的那一条，今天醒了。" },
      { s: "王子杰", cls: "speaker-wangzj", t: "（在投资协议末页签字）资金紧，就更要花在刀刃上。成都的费用集团专项出，重庆的班子就近支援——两年之内，我要在成都看到星梦剧院的灯牌。（资金-" + STORY.CGT23_COST[0] + " 万 热度+3）" },
      { nar: true, t: "（立项签约完成。下一步：场馆建设。）" },
    ],
  },
  cgtBuild: {
    label: "成都丝芭 · 场馆建设",
    pages: st => [
      { nar: true, t: "成都的工地昼夜不停：剧场的钢结构立起来那天，重庆的运营总监发来一张照片——两地车距四个半小时，他说：「支援动线，实地踩过点了。」" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（翻着工程进度表）总监，主体封顶了。剩下的装修、声场、灯位，按重庆剧场的图纸微调——省下的每一万，都是集团账上多出来的一万。（资金-" + STORY.CGT23_COST[1] + " 万 热度+4）" },
      { nar: true, t: "（场馆建设完成。下一步：开业筹备。）" },
    ],
  },
  cgtOpen: {
    label: "成都丝芭 · 开业首演",
    pages: st => [
      { nar: true, t: "成都丝芭星梦剧院，开业首演。第一排坐着从重庆自费赶来的粉丝，举的灯牌写着「成渝双城记」。首演曲终，灯牌的海洋在成都的夜色里第一次连成片。" },
      { s: "王子杰", cls: "speaker-wangzj", t: "（坐在最后一排，散场时拍了拍你的肩）开业了——这就是我下个阶段拿去融资的东西。塞纳河走向全国的第一步，走了。（★主线二达成；资金+" + 30 + " 万 热度+8 士气+2）" },
      { nar: true, t: "（★主线二「成都丝芭开幕」达成——CGT48 剧场开业，此后每月带来额外收入 " + STORY.CGT23_INCOME + " 万。flags.cgt23Open。）" },
    ],
  },

  /* ---- 主线三：恢复旗号 · 小组阁收官 ---- */
  reorgDone: {
    label: "恢复旗号 · 小组阁收官",
    pages: st => [
      { nar: true, t: "公告栏换上了新名的队旗：BEJ48 的三面、CKG48 的两面——因疫情与资金取消的建制，今天重新立了起来。分队名单贴出来的时候，有几个名字旁边注着「回归」。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（把队旗挂正）总监，子杰临走前说，他把「走向全国」的计划托付给你了——今天这几面旗子，就是这个计划的第一步。（★主线三达成 士气+2 热度+4）" },
      { nar: true, t: "（★主线三「恢复旗号」达成——CKG48、BEJ48 重建队伍建制。flags.reorg23Done。）" },
    ],
  },
};

/* ========================================================================
   三、总选次日剧情（geAftermath23）
   ======================================================================== */
STORY.geAftermath23 = st => {
  const partner = st.decisions.geMode21 === "partner";
  return [
    { nar: true, t: partner
      ? "开榜夜，「年度最佳拍档」第三度挂上大屏。组合模式的第三年，观众投得越来越熟练——投的是搭档，也是这条河里一段并肩的旅程。"
      : "开榜夜，「青春盛典」再度亮灯。没有「总选举」的旧名，榜单的分量却一年比一年重——行业规范改掉的只是名字，改不掉的是这条河的人心。" },
    { s: "叶盛", cls: "speaker-yesheng", t: partner
      ? "总监，第三季的拍档定下来了。虚拟剧场的转播间今晚也是满的——两个世界都在看这份榜单。（年度活动结算完毕；金曲大赏 12 月见。）"
      : "总监，「青春盛典」开榜。《最佳拍档》第三季六月就收过官了——今年的两份榜单，都稳稳落了地。（金曲大赏 12 月见。）" },
  ];
};

/* ========================================================================
   四、金曲大赏叙事（rtNarrative23）
   ======================================================================== */
STORY.rtNarrative23 = {
  great: [
    { nar: true, t: "年度金曲大赏落成高分：虚拟分身与真人同台的合唱舞台第三次进入大赏串场——常态化运营一年，虚拟剧场的机位已经比真人舞台还要熟练。灯海亮起的那一刻，线上线下同时安静，又同时沸腾。" },
    { s: "叶盛", cls: "speaker-yesheng", t: "（举着手机拍台下）总监，交棒之年，账本和口碑都没丢——这一棒，接得稳。（大赏结算：评价 great）" },
  ],
  normal(st) {
    const partner = st.decisions.geMode21 === "partner";
    return [
      { nar: true, t: partner
        ? "金曲大赏平稳收官：第三季拍档的合唱曲撑起小半歌单，虚拟舞台的常态化让排期宽裕了不少——稳字当头的交棒之年，稳稳落榜。年度金曲《失忆（UNAWARE）》登顶，周诗雨、王奕把名字写上了年度榜单头名。"
        : "金曲大赏平稳收官：青春盛典之后，第三季拍档综艺的余热还挂在歌单上——交棒之年不冒进，账本上的每一笔都清清楚楚。年度金曲《失忆（UNAWARE）》登顶，周诗雨、王奕把名字写上了年度榜单头名。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（合上台本）总监，稳也是一种成绩。明年班子换血，今年账上留的余量，就是明年的底气。（大赏结算：评价 normal）" },
    ];
  },
};

/* ========================================================================
   五、结局文本（endings23）
   ======================================================================== */
STORY.endings23 = {
  S: { rank: "S", title: "交棒之年",
    text: "12月31日，跨年公演的彩带落满星梦剧院。虚拟剧场的数字烟花、成都新剧院的首月报表、恢复旗号的五面队旗、开榜夜的两份榜单——交棒之年的答卷，一页不缺。\n\n王子杰在年度酒会上举杯：「今年之后，一线交给王婧和陶莺。但你——」他指了指你，「接着当总监。河要走向全国，掌舵的人不能换。」\n\n你在工作日志的末页写下一行字：灯，从一盏变成了一片。" },
  A: { rank: "A", title: "一棒接一棒",
    text: "年末总结会上，主线大多落了地，个别几条还欠着进度。\n\n王子杰在散会前多说了一句：「融资的路我走，剧场的灯你看着——明年这个时候，成都的灯牌应该也亮了。」\n\n叶盛锁门时笑：「总监，交棒不交担子，明年接着挑。」" },
  B: { rank: "B", title: "紧平衡",
    text: "资金紧、任务重，这一年的账面勉强打平。\n\n恢复的旗号立住了，虚拟的营生开张了，但总有几条线走得不快不慢。\n\n王子杰在视频里说：「节流之年能有这个盘面，算你稳。明年，把进度追回来。」" },
  C: { rank: "C", title: "欠账",
    text: "年度计划的主线落下了好几条，账本上的红字比去年多了几行。\n\n叶盛把明年的计划表放在你面前，第一页就写着「成都」两个字：「子杰留下的期限，是两年——今年欠的，明年得加倍跑着还。」" },
  bankrupt: { rank: "D", title: "资金链断裂",
    text: "大股东抛售之后的第一次年度亏损，成了压垮董事会的最后一根稻草。\n\n王子杰在空办公室里陪你收拾东西，难得没有谈融资：「成都的项目书我带走了——换个名字，也许还能立项。这条河的下一棒，不在这间办公室里。」\n\n交棒之年，河停在了2023年的冬天。" },
};

/* ========================================================================
   六、月度脚本事件（monthly23）
   ------------------------------------------------------------------------
   【用户口径】2023 人员变动事件/史实细节待用户口径，本表不挂载（宁缺毋滥；
   用户口径批次除外——5 月王晓佳事件、6 月沈梦瑶事件、陈泓宇事件、7 月江雨航事件均按用户口径挂载）。
   1 月挂载成都决策事件（主线二拍板，tag cgt23Plan）；2 月挂载 2022 最佳拍档
   奖励回收（m2_23_travel，bp22Travel22 双人旅行特辑，同 2022·m2_22_travel 口径）；5 月挂载王晓佳合约期满安置
   （同一期生/二期生安置结构，tag wxj23）；6 月挂载沈梦瑶解约风波
   （用户口径 2026-XX 批次，tag smy23）与陈泓宇私联风波（同构 2022 陈佳莹事件，
   tag chy23）；8 月挂载通用影视资源兑现事件（filmEvent）与王晓佳毕业公演
   （m8_23_wxj_show，限 5 月安置为毕业/影视部/工作人员路线）；7 月挂载江雨航私联升格风波
   （用户口径 2026-XX 批次，tag jyh23）；9 月挂载孙珍妮转签影视部事件
   （用户口径 2026-XX 批次，tag szn23；与中秋 midAutumn 并存）与钟洁玟
   陈情私联恋爱风波（tag zjw23，GNZ48/CGT48 在籍触发）；
   10 月挂载赵佳蕊退团申请（tag zjr23；choice stay 开启所在团体组阁窗，
   STORY.zjrReorg23Pick 由 endMonth 10~12 月注入，必完成）；
   CGT48 成立（cgt23Open）后由 endMonth 注入总监任命剧情（STORY.cgt23DirectorPick，
   tag cgt23Dir：玩家兼任/举荐朱瑞龙〔需在职〕/不推举由周马兼任，三案必拍板）；
   4/8/12 月挂载预备生汇报公演（prepStageShared）；
   9 月挂载中秋事件（STORY.midAutumn）。
   ======================================================================== */
STORY.monthly23 = {
  /* ---------- 1月：交接周 + 成都决策（主线二拍板） ---------- */
  1: [
    {
      id: "m1_23_handover",
      title: "1月 · 交接周",
      pages: st => [
        { nar: true, t: "一月，交接周。去年元宇宙的年报、十周年演唱会的影像档案、青春盛典（或拍档）的筹备预案——一箱一箱搬进你的办公室。今年的计划书上，「开源节流」四个字加了粗。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把今年的主线清单钉在公告栏旁）总监，资金紧了，账要算得更细：虚拟常态化、成都决策、恢复旗号、年度活动、失格值惩戒——五条线，一条都不能松。对了，中午之前，集团战略部的会议邀约就到——成都的事，今天要拍板。" },
        { nar: true, t: "（年度活动模式自动追随去年拍板：" + (st.decisions.geMode21 === "partner" ? "组合模式「年度最佳拍档」" : "传统模式「青春盛典」＋《最佳拍档》第三季") + "；总选窗口 4~7 月筹备、8 月开榜。）" },
      ],
    },
    {
      /* 【2023·主线二拍板（用户口径）】成都丝芭项目决策：1.今年就办（追加主线二，
         行动 cgt23 三段，两年内〔2023~2024〕必须开幕） 2.明年再说（今年不追加
         主线二；flags.cgt23Deferred=true——2024 线待建，自动成立钩子）。
         【同源陷阱①】登记权归本事件选项（tag cgt23Plan）；listActionsCore/doAction
         以 decisions.cgt23Plan 判定主线二是否追加（只读不写）。 */
      id: "m1_23_cgt",
      title: "1月 · 成都，办不办？",
      gate: st => !st.decisions.cgt23Plan,
      pages: st => [
        { nar: true, t: "战略部的会议室里，成都项目的企划书和武汉的一摞并排放着——第一批分团开启时就立了项的老企划，纸页都泛了黄。" },
        { s: "王子杰", cls: "speaker-wangzj", t: "总监，资金紧，两个一起开不现实。我的建议：先开成都——重庆就近支援，耗资也相对少。但我要你给个准话：今年就办，还是明年再说？" },
        { s: "王子杰", cls: "speaker-wangzj", t: "（敲了敲桌子）就办的话，两年之内必须开幕——这是我拿去融资的资本。缓一年的话，明年集团资金缓过来，自动立项，不用你再操心。两条路，各有利弊，你拍板。" },
      ],
      choices: [
        { label: "「今年就办——成都丝芭，年内动工。」", hint: "追加主线二：行动「成都丝芭」三段推进（两年内〔2023~2024〕须开幕，结局评分计分；开幕后每月收入+15万）",
          tag: "cgt23Plan", value: "now",
          effect: st => { st.heat = Math.min(100, st.heat + 2); return "立项会当场拍板：成都丝芭项目，年内动工。王子杰在企划书扉页签了字，又加了一行手写批注：「两年为限，军令状。」\n\n重庆的运营总监当晚打来电话：「支援动线我们已经踩好点了——成都的兄弟，等你们。」\n\n（决策已登记：cgt23Plan=now。主线二「成都丝芭」追加：行动区新增「成都丝芭」三段推进——立项签约→场馆建设→开业筹备；两年内须开幕。）"; } },
        { label: "「明年再说——今年先把账守稳。」", hint: "今年不追加主线二；2024 年自动立项成立（flags.cgt23Deferred）",
          tag: "cgt23Plan", value: "later",
          effect: st => { st.flags.cgt23Deferred = true; return "你在企划书上批了四个字：「明年再议」。王子杰点点头，把成都那一摞抽出来收进了文件夹——封面上多了一行标签：「2024 · 自动立项」。\n\n「守住账面也是一种拍板。」他说，「但记住，武汉和成都的企划，还在排队。」\n\n（决策已登记：cgt23Plan=later。今年不追加主线二；2024 年自动立项成立〔cgt23Deferred 已登记，待 2024 线按口径接线〕。）"; } },
      ],
    },
  ],

  /* ---------- 2月：2022 最佳拍档奖励回收（第一名组合双人旅行特辑） ---------- */
  2: [
    {
      /* 【2022 线伏笔回收（用户口径 2026-XX 批次）】2022《最佳拍档》第一名组合的
         双人旅行综艺（tag bp22Travel22，classic 第二季 6月开榜 / partner 8月开榜
         两线登记）本年播出——2022 线注释「待明年回收」；本事件即该回收（同
         2022·m2_22_travel 回收口径：资金+30 热度+6 士气+3，当事人人气+3；可调）。
         gate：bp22Travel22 有未回收名单；used 结转防重复。
         【fast 同步（同源陷阱③）】2023 快速通道已预填 bp22Travel22（engine
         newGameFast era 2023 段，并结转 bp21Travel21=used），快速档同享本回收。
         无决策 tag（used 即防重复卫兵，同 m2_22_travel 口径）。 */
      id: "m2_23_travel",
      title: "2月 · 双人旅行特辑",
      gate: st => !!(st.decisions.bp22Travel22 && st.decisions.bp22Travel22.members && st.decisions.bp22Travel22.members.length && !st.decisions.bp22Travel22.used),
      pages: st => {
        const names = st.decisions.bp22Travel22.members.join(" & ");
        return [
          { nar: true, t: "二月，第二季开榜那晚许下的旅行兑现了：" + names + " 的双人旅行综艺上线。没有赛制、没有票箱，只有两个人、一台跟拍机——观众看着这对年度拍档把「最佳拍档」四个字，从舞台一路演到了海边。" },
          { s: "邓森林", cls: "", t: "（盯着播放曲线）总监，特辑数据比正片还硬。《最佳拍档》走到第三季，观众投的早就不只是舞台——是这对对搭档的后续。这钱花得值。（资金+30 热度+6 士气+3）" },
        ];
      },
      choices: [
        { label: "「安排上线，趁热打铁。」", hint: "特辑播出：资金+30 热度+6 士气+3；两位当事人人气+3",
          effect: st => {
            const tr = st.decisions.bp22Travel22;
            tr.used = true;
            for (const nm of (tr.members || [])) {
              const m = st.members.find(x => x.name === nm);
              if (m) m.pop = Math.min(100, (m.pop || 0) + 3);
            }
            st.money += 30;
            st.heat = Math.min(100, st.heat + 6);
            st.morale = Math.min(100, st.morale + 3);
            return "特辑上线当晚冲上热搜。镜头里，她们把第二季开榜那晚的合影重新拍了一遍——配文只有一句：「第三季见。」\n\n（2022 线伏笔回收：bp22Travel22 已结转（used=true）。资金+30 热度+6 士气+3；" + (tr.members || []).join("、") + " 人气+3。）";
          } },
      ],
    },
  ],

  /* ---------- 3月：《最佳拍档》第三季启动 ---------- */
  3: [
    {
      id: "m3_23_bp_launch",
      title: "3月 · 《最佳拍档》启动",
      gate: st => !!st.decisions.geMode21 && !st.flags.b23Filled23,
      pages: st => {
        const partner = st.decisions.geMode21 === "partner";
        return [
          { nar: true, t: "三月的最后一天，邓森林抱着第三季的组队方案表敲门——封面副标题换了年份，组队规则的措辞斟酌了又斟酌。" },
          { s: "邓森林", cls: "", t: "总监，第三季的新规矩定了：除了你亲自点将的组合，谁也不许跟第二届重复——自动组队、自动收口，系统都会避开第二届的名单。第一届的老搭档想「再续前缘」，随他们——观众的情怀票，也是票。（钦点五组、四月末公布；" + (partner ? "八月月首收口，八月底年度最佳拍档开榜。" : "五月补配，六月月首收口，六月底第三季开榜。") + "）" },
          { nar: true, t: "（引导：4月使用行动「最佳拍档 · 组队」——钦点 5 组拍档（同团两两，不可跨团；玩家点将允许重复往届组队），或全团自动组队（自动组队避开第二届名单）。）" },
        ];
      },
    },
  ],

  /* ---------- 4月：年度活动筹备启动 ---------- */
  4: [
    {
      id: "m4_23_eventprep",
      title: "4月 · 年度活动筹备启动",
      gate: st => !!st.decisions.geMode21,
      pages: st => {
        const partner = st.decisions.geMode21 === "partner";
        return [
          { nar: true, t: partner
            ? "四月，「年度最佳拍档」筹备组挂牌。虚拟剧场的转播间今年第一次并进筹备组——线上线下双机位，票仓又厚了一层。"
            : "四月，「青春盛典」筹备组挂牌。去年的双轨预案照用，唯一的变更是物料预算——开源节流之年，每张海报都要算着钱印。" },
          { s: "邓森林", cls: "", t: partner
            ? "总监，拍档加成的线还是划在羁绊70。第三季了，观众心里都有一杆秤——八月，让榜单说话。"
            : "总监，预算砍了两成，但开榜的排场不能砍。青春盛典八月开榜——钱要花在观众看得见的地方。" },
          { nar: true, t: "（" + (partner ? "年度最佳拍档" : "青春盛典") + "筹备期开启：4~7 月筹备，8 月开榜。引擎接线：era 2023 总选窗口。" + (partner ? "" : "《最佳拍档》第三季组队见行动「最佳拍档 · 组队」，6月底开榜。") + "）" },
        ];
      },
    },
  ],

  /* ---------- 5月：王晓佳合约期满安置（同一期生/二期生安置结构） ---------- */
  5: [
    {
      /* 【2023·5月（用户口径 2026-XX 批次）】王晓佳（X队四期生，2015-01 入团，
         2022 年度金曲《渊》榜首之一）合约期满到期，同一期生/二期生安置结构四项拍板
         （概率口径同 Game.applyGen1 / applyGen221）：
         ①续约（丝芭传媒签约艺人，在籍名册除名）：基础 50%；小分队在册 85%；
           历届总选前三（flags.geTop3All）65%（与小分队同时满足取 85%）
         ②影视约续约（需演技≥ACT_FILM_MIN=40，选项级 gate 未达标自动隐藏）：
           比正常续约基础概率高 5%（加成同样适用）；成功转入影视部（team HALL + film，保持在籍）
         ③毕业（荣誉毕业生 honorGrad，不再视为在籍）
         ④转任工作人员（丝芭传媒）：基础 50%；羁绊≥70 时 75%。
         续约/影视约/转岗未成功 → 自动转毕业（荣誉毕业生，同 applyGen1/applyGen221 口径）。
         gate：王晓佳在籍（active/rest，非殿堂——同 gen2Pool21 在册口径）且未拍板时触发。
         【同源陷阱①】登记权归选项（tag wxj23）；未成功自动转毕业不改写 decisions
         （成败以成员卡分类为准）；film 演技校验走选项级 gate（隐藏不可选），
         不会出现「已登记未结算」断链。
         【违规事件·判定】合约期满安置属合同到期事项、非成员违纪——不挂 violation /
         不调 violationDqHit。
         数值 Agent 拟定可调：沿用 gen1/gen2 概率口径，无新增数值。 */
      id: "m5_23_wxj",
      title: "5月 · 一份到期合约",
      gate: st => !st.decisions.wxj23
        && st.members.some(m => m.name === "王晓佳" && (m.status === "active" || m.status === "rest") && !m.hall),
      pages: st => {
        const m = st.members.find(x => x.name === "王晓佳");
        const ac = m && m.skills ? (m.skills.ac || 0) : 0;
        return [
          { nar: true, t: "五月的一个下午，王婧拿着一份到期合约清单推开了办公室的门。清单不长——只有一行名字。" },
          { s: "王婧", cls: "speaker-wangjing", t: "总监，王晓佳的合约，这个月到期。X 队四期生，2015 年初进团——去年年度金曲《渊》，她把名字写在了榜首。老章程了，一期生、二期生安置时用过的那套：续约、影视约、毕业、转岗，四条路。" },
          { s: "王婧", cls: "speaker-wangjing", t: "概率口径也照旧：续约基础五五开，进过总选前三的高些、小分队的孩子把握更大；影视约要演技达标，把握比续约再高五分；转岗看羁绊。谈不拢的，一律按合约期满毕业处理。您拍板。" },
          { nar: true, t: "（安置四项同 2020 一期生/2021 二期生口径：续约→丝芭传媒（除名）；影视约需演技≥" + Game.ACT_FILM_MIN + "（当前 " + ac + "）→影视部在籍；毕业→荣誉毕业生；转岗→工作人员（丝芭传媒）。未成功自动转毕业。）" },
        ];
      },
      choices: [
        { label: "「说服她续约——丝芭传媒签约艺人，剧场名册除名。」", hint: st => { const m = st.members.find(x => x.name === "王晓佳"); const inUnit = m && (!!Game.memberSubUnit(st, m.name) || (m.note || "").indexOf("7SENSES") >= 0); const t3 = (st.flags.geTop3All || []).indexOf("王晓佳") >= 0; const c = inUnit ? 85 : t3 ? 65 : 50; const why = inUnit ? "小分队在册" : t3 ? "历届总选前三" : "无加成"; return "续约（成功率 " + c + "%：基础 50%，加成取最高档——「当前：" + why + "」；小分队 85% / 前三 65%）；未成功自动转毕业（荣誉毕业生）"; },
          tag: "wxj23", value: "renew",
          effect: st => {
            const m = st.members.find(x => x.name === "王晓佳");
            if (!m) return "（王晓佳已不在册。）";
            const inUnit = !!Game.memberSubUnit(st, m.name) || (m.note || "").indexOf("7SENSES") >= 0;
            const t3 = (st.flags.geTop3All || []).indexOf("王晓佳") >= 0;
            const rate = inUnit ? 0.85 : t3 ? 0.65 : 0.5;
            const pct = Math.round(rate * 100);
            m.captain = false; m.vice = false; delete m.sub;
            if (Math.random() < rate) {
              m.status = "left"; m.siba = true;
              m.note = "2023-05 · 合约期满续签（丝芭传媒签约艺人，剧场在籍名册除名）";
              Game.syncTeams(st);
              return "你把新合同推过去的时候，她笑了：「十年都唱过来了，还怕谈这个？」条款看得很慢，签字很干脆——从此剧场在籍名册上少了她的名字，公司签约艺人的名单上多了她的一行。\n\n（续约成功（成功率 " + pct + "%）。王晓佳转入丝芭传媒签约艺人，剧场在籍名册除名。）";
            }
            m.status = "left"; m.honorGrad = true;
            m.note = "2023-05 · 续约未谈拢，合约期满毕业（荣誉毕业生）";
            Game.syncTeams(st);
            return "条款翻来覆去谈了几轮，最后还是没谈拢。她说：「总监，谢谢您想留我——但合约到期了，我想看看外面的日子。」毕业公演的灯牌亮起时，全队把《渊》又唱了一遍。\n\n（续约未成功（成功率 " + pct + "%），自动转毕业：王晓佳按合约期满毕业（荣誉毕业生）。）";
          } },
        { label: "「签影视约——让她往戏路上走。」", hint: st => { const m = st.members.find(x => x.name === "王晓佳"); const ac = m && m.skills ? (m.skills.ac || 0) : 0; const inUnit = m && (!!Game.memberSubUnit(st, m.name) || (m.note || "").indexOf("7SENSES") >= 0); const t3 = (st.flags.geTop3All || []).indexOf("王晓佳") >= 0; const c = Math.min(95, (inUnit ? 85 : t3 ? 65 : 50) + 5); return "影视约续约（成功率 " + c + "%：续约口径 +5%；需演技≥" + Game.ACT_FILM_MIN + "，当前 " + ac + "）；成功转入影视部（保持在籍）；未成功自动转毕业（荣誉毕业生）"; },
          gate: st => { const m = st.members.find(x => x.name === "王晓佳"); return !!(m && m.skills && m.skills.ac >= Game.ACT_FILM_MIN); },   // 演技未达标：选项隐藏（同 applyGen1 校验口径，避免登记后无法结算）
          tag: "wxj23", value: "film",
          effect: st => {
            const m = st.members.find(x => x.name === "王晓佳");
            if (!m) return "（王晓佳已不在册。）";
            const inUnit = !!Game.memberSubUnit(st, m.name) || (m.note || "").indexOf("7SENSES") >= 0;
            const t3 = (st.flags.geTop3All || []).indexOf("王晓佳") >= 0;
            const rate = Math.min(0.95, (inUnit ? 0.85 : t3 ? 0.65 : 0.5) + 0.05);
            const pct = Math.round(rate * 100);
            m.captain = false; m.vice = false; delete m.sub;
            if (Math.random() < rate) {
              m.team = "HALL"; m.film = true;
              m.note = "2023-05 · 影视约续约（转入影视部，属性页影视部分类可见）";
              Game.syncTeams(st);
              return "影视约签得比想象中顺利——去年《渊》的榜首分量摆在那里。影视部的门牌换上了她的名字：剧场还在排她的公演，片场也多了一个等着她的机位。\n\n（影视约续约成功（成功率 " + pct + "%）。王晓佳转入影视部，保持在籍；属性页影视部分类可见。）";
            }
            m.status = "left"; m.honorGrad = true;
            m.note = "2023-05 · 影视约未谈拢，合约期满毕业（荣誉毕业生）";
            Game.syncTeams(st);
            return "影视约的条款没能谈到一起——公司能给的本子，和剧组开出的价，中间隔着一段补不齐的距离。毕业公演那天，她说：「舞台上唱了这么多年，去看看镜头后面的世界了。」\n\n（影视约未成功（成功率 " + pct + "%），自动转毕业：王晓佳按合约期满毕业（荣誉毕业生）。）";
          } },
        { label: "「体面毕业——办一场谢幕公演，荣誉毕业生送行。」", hint: "合约期满毕业（荣誉毕业生分类，不再视为在籍）",
          tag: "wxj23", value: "grad",
          effect: st => {
            const m = st.members.find(x => x.name === "王晓佳");
            if (!m) return "（王晓佳已不在册。）";
            m.captain = false; m.vice = false; delete m.sub;
            m.status = "left"; m.honorGrad = true;
            m.note = "2023-05 · 合约期满毕业（荣誉毕业生）";
            Game.syncTeams(st);
            return "谢幕公演定在了八月——留给粉丝告别的时间。她把入团那年第一次公演的队服叠得整整齐齐，放在了化妆台最上层——从 X 队的新人到年度金曲的榜首，十年走完。荣誉毕业生名册上，多了一个响当当的名字。\n\n（决策已登记：wxj23=grad。王晓佳按合约期满毕业（荣誉毕业生，不再视为在籍）；毕业公演定于 8 月。）";
          } },
        { label: "「转为工作人员——留下，换个身份。」", hint: st => { const m = st.members.find(x => x.name === "王晓佳"); const b = m ? (m.bond || 0) : 0; const c = b >= 70 ? 75 : 50; return "转岗（成功率 " + c + "%：基础 50% + 羁绊加成「当前 " + b + "」，羁绊≥70 时 75%）；未成功自动转毕业（荣誉毕业生）"; },
          tag: "wxj23", value: "staff",
          effect: st => {
            const m = st.members.find(x => x.name === "王晓佳");
            if (!m) return "（王晓佳已不在册。）";
            const b = m.bond || 0;
            const rate = b >= 70 ? 0.75 : 0.5;
            const pct = Math.round(rate * 100);
            m.captain = false; m.vice = false; delete m.sub;
            if (Math.random() < rate) {
              m.status = "staff"; m.siba = true;
              m.note = "2023-05 · 合约期满转任工作人员（丝芭传媒）";
              Game.syncTeams(st);
              return "「不做台前，我做幕后。」她签得比谁都快。工牌换成了工作人员的蓝色——从站在灯海里的人，变成给灯海拉电闸的人。\n\n（转岗成功（成功率 " + pct + "%）。王晓佳转任工作人员（丝芭传媒）。）";
            }
            m.status = "left"; m.honorGrad = true;
            m.note = "2023-05 · 转岗未谈拢，合约期满毕业（荣誉毕业生）";
            Game.syncTeams(st);
            return "转岗的事谈了几轮，她最终还是摇了头：「幕后不是躲雨的地方——我想走的路，不在楼里。」毕业公演照办，荣誉毕业生的名册上，添了这个干脆的名字。\n\n（转岗未成功（成功率 " + pct + "%），自动转毕业：王晓佳按合约期满毕业（荣誉毕业生）。）";
          } },
      ],
    },
  ],

  /* ---------- 6月：沈梦瑶解约风波（两案拍板，用户口径） ---------- */
  6: [
    {
      /* 【2023·6月（用户口径 2026-XX 批次）】沈梦瑶（HII 五期生）因身体原因提出
         无法继续履行合同、请求解约。两案拍板：
         ①允许解约（协商解约：健康原因免收违约金，离团，士气-1）
         ②挽留（基础 50%；flags.geTop3All 历届总选前三 65%；高羁绊（羁绊≥70）75%
           ——加成取最高档不叠加，同 2020 一期生续约口径；成功=留队休整
           羁绊+6 士气+3，改写 decisions.smy23=stay；失败=改写 keepFail
           并自动按①落地，士气-2）。
         gate：沈梦瑶在籍（本部 active 或分团 branch 在籍，非殿堂；暂休/离团/
         IDFT 训练生池不触发）且未拍板时触发（用户口径「限沈梦瑶在籍包含分团在籍」）。
         【同源陷阱①】登记权归选项（tag smy23），挽留成败改写 decisions 的写法
         同 qj22 模式；不以 smy23 作 effect 卫兵。
         【违规事件·判定】健康原因协商解约属合同事项、非成员违纪——不挂 violation /
         不调 violationDqHit（无失格值连带），同 2022 祁静解约口径。
         数值 Agent 拟定可调：release 士气-1；keep 失败士气-2。 */
      id: "m6_23_smy",
      title: "6月 · 一份体检报告",
      gate: st => !st.decisions.smy23
        && st.members.some(m => m.name === "沈梦瑶" && (m.status === "active" || m.status === "branch") && !m.hall),
      pages: st => [
        { nar: true, t: "六月的排练间隙，叶盛拿着一份体检报告和一纸申请敲开了办公室的门，神色比往常沉。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "总监，HII 的沈梦瑶——五期生的老人了。她把体检报告和解约申请一起放在了我桌上：身体亮了红灯，医生的意见是长期高强度行程撑不下去了，她想按合同流程协商解约。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把报告轻轻推过来）她没提违约金，只说了一句「怕站不住台上的位置，耽误队伍」。健康的事拦不住，但人心的事——挽留还是放行，得您拍板。" },
      ],
      choices: [
        { label: "「身体要紧——允许解约，违约金免了，祝她早日康复。」", hint: "协商解约离团（健康原因，免收违约金）；士气-1",
          tag: "smy23", value: "release",
          effect: st => {
            const m = st.members.find(x => x.name === "沈梦瑶");
            if (m) { m.status = "left"; m.note = (m.note ? m.note + "；" : "") + "2023-06 因身体原因提出解约，协商解约离团（免收违约金）"; }
            st.morale = Math.max(0, st.morale - 1);
            return "你在解约协议上盖了章，违约金那一栏写着「豁免」两个字。临走那天，队里的孩子们把她送到剧院门口，横幅上是全队签名的四个字——「早日康复」。\n\n她朝办公楼的方向鞠了一躬。有些告别不必体面到夸张，干净、暖一点，就够了。\n\n（决策已登记：smy23=release。沈梦瑶协商解约离团；免收违约金；士气-1。）";
          } },
        { label: "「合同先放一放——我去和她谈谈，把行程减下来。」", hint: st => { const m = st.members.find(x => x.name === "沈梦瑶"); const b = m ? (m.bond || 0) : 0; const t3 = (st.flags.geTop3All || []).indexOf("沈梦瑶") >= 0; const c = b >= 70 ? 75 : t3 ? 65 : 50; const why = b >= 70 ? "高羁绊" : t3 ? "历届总选前三" : "无加成"; return "挽留（成功率 " + c + "%：基础 50%，加成取最高档——「当前：" + why + "；羁绊 " + b + "」；前三 65% / 羁绊≥70 75%）；未成功则自动按「允许解约」落地"; },
          tag: "smy23", value: "keep",
          effect: st => {
            const m = st.members.find(x => x.name === "沈梦瑶");
            if (!m) return "（沈梦瑶已不在册。）";
            const b = m.bond || 0;
            const t3 = (st.flags.geTop3All || []).indexOf("沈梦瑶") >= 0;
            const chance = b >= 70 ? 75 : t3 ? 65 : 50;
            if (Game.rnd(0, 99) < chance) {
              st.decisions.smy23 = "stay";
              m.note = (m.note ? m.note + "；" : "") + "2023-06 因身体原因提出解约，经总监挽留留队（缩减行程休整）";
              m.bond = Math.min(100, b + 6);
              st.morale = Math.min(100, st.morale + 3);
              return "你把体检报告推回她面前：「报告上写的是要休，没写要走。行程我来排——公演减半、外务全停，队伍的位置永远给你留着。」\n\n她低头看了很久，把解约申请慢慢折了起来：「……那就，再试试。」\n\n当晚的日程表上，她的名字后面第一次出现了「休整」的批注；公演排期少了她的场次，却没人觉得名单缺了一行。\n\n（挽留成功（成功率 " + chance + "%）。沈梦瑶留队休整：羁绊+6；士气+3。）";
            }
            st.decisions.smy23 = "keepFail";
            m.status = "left";
            m.note = (m.note ? m.note + "；" : "") + "2023-06 因身体原因提出解约，挽留未果，协商解约离团（免收违约金）";
            st.morale = Math.max(0, st.morale - 2);
            return "「谢谢您——但身体不等人。」她把申请又轻轻推了回来，声音很轻，态度却很稳。你最终在协议上盖了章，违约金一栏依旧写着「豁免」。\n\n送她出剧院的时候，孩子们站了一走廊。这一次，横幅上的四个字后面，多了一行小字：「常回来看看」。\n\n（挽留未成功（成功率 " + chance + "%），自动按允许解约落地：沈梦瑶协商解约离团；免收违约金；士气-2。）";
          } },
      ],
    },
    {
      /* 【2023·6月（用户口径 2026-XX 批次）】陈泓宇（GNZ48 十期生，2021-05 入团）私联
         被曝光——与粉丝私下联系实锤，营销号挂出聊天记录（同构 2022·3 陈佳莹事件
         m3_22_cjy：来电模拟 + 三案拍板）。
         三案拍板：①加重处罚移籍 IDFT（训练生池不计薪自动停薪；promoBanUntil=2024-06
         一年内不得升格——总选入榜升格登记/拍板窗/applyGe20Idft 三处过滤，同 2022
         陈佳莹口径）②提前毕业（不付解约金，「毕业」仅为体面说法，普通离团口径、
         不挂荣誉毕业生）③清退（支付解约金 STORY.CHY23_PENALTY）。
         gate：陈泓宇 GNZ48 在籍（status=branch & branchTeam=GNZ48，非殿堂）。
         【来电模拟（2026-XX 协作规范）】未兼任 GNZ48 → 周马（GNZ48 运营总监）来电；
         兼任 GNZ48（f.concur17["GNZ48"]）→ 陈文泽（GNZ48 剧场发言人）来电；
         ev.call 函数形态（同 2022 陈佳莹事件），通话内拍板（结算文本作为通话页）。
         【违规事件·失格值修正】私联属成员违纪：三案均调 violationDqHit（同队 dq+2，
         传 match {branchTeam:"GNZ48"} 消歧）；grad/dismiss 离团后 dqCalmMark
         免涨窗；punish 移籍 IDFT 非解约/暂休，不设免涨窗。
         【同源陷阱①】登记权归选项（tag chy23），effect 不得以 decisions.chy23 作卫兵。
         数值 Agent 拟定可调：punish 羁绊-6 士气-2 热度-2；grad 士气-1 热度-2；
         dismiss 士气-2 热度-2。 */
      id: "m6_23_chy",
      title: "6月 · 私联风波",
      violation: "私联",   // 【违规事件类型 tag】同队队员失格值连带（violationDqHit）；grad/dismiss 离团后 dqCalmMark 免涨窗
      call: st => ({
        mode: "phone",
        caller: (st.flags.concur17 && st.flags.concur17["GNZ48"]) ? "陈文泽" : "周马",
        sub: "广州 · GNZ48 来电",
        complaint: "（电话那头压着火）总监，可算接了——广州这边舆情组盯着热搜，人事组等着章程，就差您一句话。",
        choices: true,
      }),
      gate: st => !st.decisions.chy23
        && st.members.some(m => m.name === "陈泓宇" && m.status === "branch" && m.branchTeam === "GNZ48" && !m.hall),
      pages: st => {
        const boss = (st.flags.concur17 && st.flags.concur17["GNZ48"]) ? "陈文泽" : "周马";
        return [
          { nar: true, t: "六月的一个上午，一个广州方向的来电转进了总监办公室——屏幕上跳动着「GNZ48」。" },
          { s: boss, t: "总监，陈泓宇——GNZ48 十期生，去年五月才进团的孩子。今天中午，营销号把聊天记录挂出来了：跟一位「大粉丝」长期私下联系，见面记录、转账截图都齐了——私联，实锤了，热搜已经挂上。" },
          { s: boss, t: "私联是严重违纪。孩子进团不久，广州这边的意见分了两派：有人说十期生正是要用人的时候，处罚留籍；有人说章程就是章程，第一次就不能轻拿轻放。按规章拟了三条路——加重处罚、提前毕业、清退。怎么落章，得您拍板。" },
        ];
      },
      choices: [
        { label: "「加重处罚——停发工资一年，移籍 IDFT 训练生池。」", hint: "移籍 IDFT：训练生池不计薪（自动停发）；一年内不得升格；羁绊-6 士气-2 热度-2",
          tag: "chy23", value: "punish",
          effect: st => {
            const hitTail = Game.violationDqHit(st, "陈泓宇", { branchTeam: "GNZ48" });   // 违规事件·同队失格值连带（移籍前调用）
            const m = st.members.find(x => x.name === "陈泓宇" && x.status === "branch" && x.branchTeam === "GNZ48");
            if (m) {
              m.status = "idft"; m.team = "IDFT"; m.branchTeam = null; m.branchLabel = null;
              m.captain = false; m.vice = false; delete m.sub;
              m.bond = Math.max(1, (m.bond || 0) - 6);
              m.promoBanUntil = "2024-06";   // 禁止升格 1 年（2023-06 起算，月精度含当月——登记/拍板/落地三处过滤，同 2022 陈佳莹口径）
              m.note = (m.note ? m.note + "；" : "") + "2023-06 私联风波加重处罚：移籍 IDFT（停发工资一年·一年内不得升格）";
            }
            st.morale = Math.max(0, st.morale - 2);
            st.heat = Math.max(0, st.heat - 2);
            return "处罚公告当晚挂上了官网：「陈泓宇，在团期间私联粉丝、严重违反公司纪律——即日起调回训练生池，停发工资一年，一年内不得参与升格评定。」\n\nIDFT 训练生池不计薪——从本月起，工资册上少了一行名字；总选入榜升格的名单里，这个名字也会被划掉，直到明年年中。\n\n（决策已登记：chy23=punish。陈泓宇移籍 IDFT；羁绊-6；士气-2 热度-2。）" + (hitTail ? "\n\n" + hitTail : "");
          } },
        { label: "「安排提前毕业——办一场体面的谢幕公演，解约金不出。」", hint: "提前离团（「毕业」仅为体面说法，不挂荣誉毕业生）：不支付解约金；士气-1 热度-2",
          tag: "chy23", value: "grad",
          effect: st => {
            const m = st.members.find(x => x.name === "陈泓宇" && x.status === "branch" && x.branchTeam === "GNZ48");
            if (m) { m.status = "left"; m.note = (m.note ? m.note + "；" : "") + "2023-06 私联风波后安排「提前毕业」离团（体面说法·普通离团口径，公司不支付解约金，非荣誉毕业）"; }
            const hitTail = Game.violationDqHit(st, "陈泓宇", { branchTeam: "GNZ48" });   // 违规事件·同队失格值连带
            Game.dqCalmMark(st, "陈泓宇", { branchTeam: "GNZ48" });   // 违规离团 → 原队伍其后 2 个月失格值不自然增长
            st.morale = Math.max(0, st.morale - 1);
            st.heat = Math.max(0, st.heat - 2);
            return "毕业公演定在了下一场。公告里没有最难看的那个词，谢幕时说了一句：「对不起，也谢谢这条河。」台下的灯牌亮了一半，冷了一半——公司不用拘一分钱解约金，热搜也就在一周后凉了下去。公告末行的小字写着：按离团办理。\n\n（决策已登记：chy23=grad。陈泓宇提前离团（「毕业」仅为体面说法，普通离团口径，不挂荣誉毕业生）；不支付解约金；士气-1 热度-2。）" + (hitTail ? "\n\n" + hitTail : "");
          } },
        { label: "「按章程清退——解约金照付，划清界线。」", hint: st => "清退离团：支付解约金 " + (STORY.CHY23_PENALTY || 60) + " 万；士气-2 热度-2",
          tag: "chy23", value: "dismiss",
          effect: st => {
            const fee = STORY.CHY23_PENALTY || 60;
            const m = st.members.find(x => x.name === "陈泓宇" && x.status === "branch" && x.branchTeam === "GNZ48");
            if (m) { m.status = "left"; m.note = (m.note ? m.note + "；" : "") + "2023-06 私联风波后按章程清退离团（公司支付解约金 " + fee + " 万）"; }
            const hitTail = Game.violationDqHit(st, "陈泓宇", { branchTeam: "GNZ48" });   // 违规事件·同队失格值连带
            Game.dqCalmMark(st, "陈泓宇", { branchTeam: "GNZ48" });   // 违规离团 → 原队伍其后 2 个月失格值不自然增长
            st.money -= fee;
            st.morale = Math.max(0, st.morale - 2);
            st.heat = Math.max(0, st.heat - 2);
            return "人事函当天发出，解约金 " + fee + " 万如约打进了她的账户。没有谢幕公演，没有告别微博——章程就是章程。广州剧场的灯牌第二天照常亮起，只是后台的名单上，又少了一个名字。\n\n（决策已登记：chy23=dismiss。陈泓宇清退离团；资金-" + fee + " 万（解约金）；士气-2 热度-2。）" + (hitTail ? "\n\n" + hitTail : "");
          } },
      ],
    },
  ],

  /* ---------- 7月：江雨航私联升格风波（来电模拟，两案拍板） ---------- */
  7: [
    {
      /* 【2023·7月新增（用户口径 2026-XX）】江雨航私联升格风波：2023 年初因私自
         收受粉丝超额礼物被降格为预备生，近日被爆依靠与大粉丝私联才得以重新升格
         ——私联属成员违纪。两案拍板：①照章开除（违纪解除，不支付解约金）
         ②移籍 IDFT 观察（训练生池不计薪自动停薪；promoBanUntil=2024-06 一年内
         不得升格——总选入榜升格登记/拍板/applyGe20Idft 三处过滤，同 2022 陈佳莹口径）。
         gate：江雨航 GNZ48 在籍（branch & branchTeam=GNZ48，非殿堂）。
         【来电模拟（2026-XX 协作规范）】未兼任 GNZ48 → 周马（GNZ48 运营总监）来电；
         兼任 GNZ48（f.concur17["GNZ48"]）→ 陈文泽（GNZ48 剧场发言人）来电；
         ev.call 函数形态（同 2022 陈佳莹事件），通话内拍板（结算文本作为通话页）。
         【违规事件·失格值修正】私联属成员违纪：两案均调 violationDqHit（同队 dq+2）
         （同名双卡防护：传 match {branchTeam:"GNZ48"}）；fire 开除离团 → dqCalmMark
         免涨窗；idft 移籍非解约/暂休，不设免涨窗。
         【同源陷阱①】登记权归选项（tag jyh23），effect 不得以 decisions.jyh23 作卫兵。
         数值 Agent 拟定可调：fire 士气-2 热度-3；idft 羁绊-6 士气-2 热度-2。 */
      id: "m7_23_jyh",
      title: "7月 · 私联升格风波",
      violation: "私联",   // 【违规事件类型 tag】同队队员失格值连带（violationDqHit）；fire 离团后 dqCalmMark 免涨窗
      call: st => ({
        mode: "phone",
        caller: (st.flags.concur17 && st.flags.concur17["GNZ48"]) ? "陈文泽" : "周马",
        sub: "广州 · GNZ48 来电",
        complaint: "（电话那头压着火）总监，可算接了——广州这边舆情组盯着热搜，人事组等着章程，就差您一句话。",
        choices: true,
      }),
      gate: st => !st.decisions.jyh23
        && st.members.some(m => m.name === "江雨航" && m.status === "branch" && m.branchTeam === "GNZ48" && !m.hall),
      pages: st => {
        const boss = (st.flags.concur17 && st.flags.concur17["GNZ48"]) ? "陈文泽" : "周马";
        return [
          { nar: true, t: "七月的一个上午，一个广州方向的来电转进了总监办公室——屏幕上跳动着「GNZ48」。" },
          { s: boss, t: "总监，江雨航您还记得吧？GNZ48 九期生。今年年初刚因为私自收受粉丝超额礼物被降格成预备生——按规矩，考察期内想升回来，得凭考核成绩一层层评审。" },
          { s: boss, t: "可今天早上，营销号把聊天记录挂出来了——他这个月的「重新升格」，是靠跟一个大粉丝私联、让粉头带头打投刷考核才换来的。截图齐全，热搜已经挂上了。" },
          { s: boss, t: "私联是严重违纪，骗升格更是踩了章程的红线。广州这边按规章拟了两条路——照章开除，或者移回训练生池观察。怎么落章，得您拍板。" },
        ];
      },
      choices: [
        { label: "「按照规章——予以开除。」", hint: "开除离团（违纪解除·不支付解约金）：士气-2 热度-3",
          tag: "jyh23", value: "fire",
          effect: st => {
            const m = st.members.find(x => x.name === "江雨航" && x.status === "branch" && x.branchTeam === "GNZ48");
            if (m) { m.status = "left"; m.note = (m.note ? m.note + "；" : "") + "2023-07 私联骗取升格风波·照章开除离团（违纪解除，不支付解约金）"; }
            const hitTail = Game.violationDqHit(st, "江雨航", { branchTeam: "GNZ48" });   // 违规事件·同队失格值连带（离团后调用，保留 branchTeam 消歧）
            Game.dqCalmMark(st, "江雨航", { branchTeam: "GNZ48" });   // 违规离团 → 原队伍其后 2 个月失格值不自然增长
            st.morale = Math.max(0, st.morale - 2);
            st.heat = Math.max(0, st.heat - 3);
            return "开除通知当天挂上了官网：「江雨航，在团期间私联粉丝、以不正当手段谋取升格资格——经总部核准，予以开除，即日离团。」\n\n广州剧场的数据组连夜把他的打投明细封存备查；粉头删号跑路，热搜第二天掉出了前五十。章程就是章程——没有解约金，没有谢幕公演，名单上从此少了一个名字。\n\n（决策已登记：jyh23=fire。江雨航照章开除离团；不支付解约金；士气-2 热度-3。）" + (hitTail ? "\n\n" + hitTail : "");
          } },
        { label: "「移籍 IDFT 训练生池——观察一年，期间不得升格。」", hint: "移籍 IDFT：训练生池不计薪（自动停薪）；一年内不得升格（总选入榜升格三处过滤）；羁绊-6 士气-2 热度-2",
          tag: "jyh23", value: "idft",
          effect: st => {
            const hitTail = Game.violationDqHit(st, "江雨航", { branchTeam: "GNZ48" });   // 违规事件·同队失格值连带（移籍前调用）
            const m = st.members.find(x => x.name === "江雨航" && x.status === "branch" && x.branchTeam === "GNZ48");
            if (m) {
              m.status = "idft"; m.team = "IDFT"; m.branchTeam = null; m.branchLabel = null;
              m.captain = false; m.vice = false; delete m.sub;
              m.bond = Math.max(1, (m.bond || 0) - 6);
              m.promoBanUntil = "2024-06";   // 禁止升格 1 年（2023-07 起算，月精度含当月——登记/拍板/落地三处过滤，同 2022 陈佳莹口径）
              m.note = (m.note ? m.note + "；" : "") + "2023-07 私联骗取升格风波：移籍 IDFT 观察（停薪·一年内不得升格）";
            }
            st.morale = Math.max(0, st.morale - 2);
            st.heat = Math.max(0, st.heat - 2);
            return "处罚公告当晚挂上官网：「江雨航，私联粉丝、以不正当手段谋取升格资格——即日起移回训练生池观察，停发工资一年，一年内不得参与任何升格评定。」\n\nIDFT 训练生池不计薪——从本月起工资册上少了一行名字；总选入榜升格的名单里，他的名字也会被划掉，直到明年年中。\n\n广州剧场的灯牌照常亮着。只是排练室的孩子们都知道：那个靠「粉头」升回来的人，现在要从最底下重新爬。\n\n（决策已登记：jyh23=idft。江雨航移籍 IDFT；羁绊-6；士气-2 热度-2。）" + (hitTail ? "\n\n" + hitTail : "");
          } },
      ],
    },
  ],

  /* ---------- 8月：王晓佳毕业公演（限 5 月安置为毕业/影视部/工作人员路线） ---------- */
  8: [
    {
      /* 【2023·8月（用户口径 2026-XX 批次）】王晓佳毕业公演『New Day』：仅当 5 月安置
         （m5_23_wxj）落在 毕业（honorGrad，含续约/影视约/转岗未成功自动转毕业）/
         影视部（film，转岗前告别公演）/ 工作人员（staff）三条路线时触发；
         续约成功（丝芭传媒签约艺人，siba 除名）不触发——名册已除名，无公演。
         gate：decisions.wxj23 已拍板 且 王晓佳 honorGrad / film / staff 三态之一。
         单确认选项（无决策 tag，不占 decisions）；热度+3 士气+2（Agent 拟定可调）。
         【违规事件·判定】毕业告别非违纪，不挂 violation / 不调 violationDqHit。 */
      id: "m8_23_wxj_show",
      title: "8月 · 王晓佳毕业公演『New Day』",
      gate: st => {
        if (!st.decisions.wxj23) return false;
        const m = st.members.find(x => x.name === "王晓佳");
        return !!m && (m.honorGrad === true || m.film === true || m.status === "staff");
      },
      pages: st => {
        const wm = st.members.find(x => x.name === "王晓佳") || {};
        const route = wm.honorGrad === true ? "合约期满毕业（荣誉毕业生）" : wm.film === true ? "影视约续约（转入影视部）" : "转任工作人员（丝芭传媒）";
        return [
        { nar: true, t: "八月的最后一个周末，星梦剧院的票开售即罄——票面上那个名字，五月就挂上了官网：王晓佳毕业公演『New Day』。X 队把台本翻回了 2015 年——她入团那场公演里唱过的歌，一首一首，重新排了回来；安可曲的名字，就写在票面的角落里：New Day。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "总监，票仓不用您操心——去年年度金曲榜首的分量在那儿摆着。灯牌、花墙、应援色，粉丝把三个月的力气都花在了这一个晚上。您只要到场，坐第一排。" },
        { nar: true, t: "（王晓佳 5 月安置路线：" + route + "；本场为舞台告别公演。）" },
        ];
      },
      choices: [
        { label: "「灯亮起来吧——送她。」", hint: "毕业公演（舞台告别）：热度+3 士气+2",
          effect: st => {
            const m = st.members.find(x => x.name === "王晓佳");
            const route = !m ? "已不在册" : m.honorGrad === true ? "合约期满毕业（荣誉毕业生）" : m.film === true ? "影视约续约（转入影视部）" : "转任工作人员（丝芭传媒）";
            st.heat = Math.min(100, st.heat + 3);
            st.morale = Math.min(100, st.morale + 2);
            return "安可唱到第三遍的时候，全场的灯牌只剩了一种颜色。『New Day』的旋律落在最后一个音上，她站在台中央，朝四个方向各鞠了一躬：「这条河养了我十年——往后不管我在哪儿，都会记得水是从哪儿流过来的。」\n\n散场后，X 队的孩子们在后台把她围住，队服上签满了名字。有一块灯牌没有熄，上面写着下一场公演的日期——河还在流，歌也还会有人接着唱。\n\n（王晓佳毕业公演『New Day』落地。安置路线：" + route + "；热度+3 士气+2。）";
          } },
      ],
    },
  ],

  /* ---------- 9月：孙珍妮转签影视部（艺考上岸·外戏破圈）+ 钟洁玟陈情私联恋爱风波 ---------- */
  9: [
    {
      /* 【2023·9月（用户口径 2026-XX 批次）】孙珍妮（HII 六期生，2016-03 入团）
         成功艺考上岸，且此前自行面试参与的外戏效益不错、热度破圈——叶盛建议转签
         影视部；但提醒：转签即开先河，开辟了升堂以外的破圈道路，需慎重考虑。
         两案拍板：①同意转签影视部（team HALL + film 标记，保持在籍——同
         一期生影视约口径；热度+4 士气+1；登记先河旗标 f.szn23Film，后续线可回收）
         ②继续留在女团（HII 在籍不动；热度-2——少一条破圈线；羁绊+2，安心留队）。
         gate：孙珍妮在籍（active/rest，非殿堂）且未拍板时触发。
         【同源陷阱①】登记权归选项（tag szn23）。
         【违规事件·判定】艺考升学/转签属个人发展与公司人事事项、非违纪——
         不挂 violation / 不调 violationDqHit。
         【史实锚点】2026 线成员卡备注「影视部（2023 年起转影视发展）」——
         本事件即该口径的游戏内挂载（choice 1 落地）。
         数值 Agent 拟定可调：转签热度+4 士气+1；留团热度-2 羁绊+2。 */
      id: "m9_23_szn",
      title: "9月 · 一份艺考成绩单",
      gate: st => !st.decisions.szn23
        && st.members.some(m => m.name === "孙珍妮" && (m.status === "active" || m.status === "rest") && !m.hall),
      pages: st => [
        { nar: true, t: "九月的第一个工作日，叶盛推门进来的时候，手里拿着两样东西：一份艺考录取的公示截图，和一张外戏的票房分成结算单。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "总监，两件事，都跟孙珍妮有关。第一，她艺考上岸了——录取公示昨天挂出来的。第二，她之前自己投简历试上的那部外戏，上个月收官——效益不错，话题度也起来了，粉丝圈外都在讨论她的角色。热度这是要破圈了。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把两份材料并排放在您桌上）我的建议：把她转签影视部。她的条件、时机、热度，都到了。但我得把话说在前头——团里往上走的路，从来只有一条：总选、连霸、升堂。转签影视部，等于开了先河，开出第二条破圈的路。这条路开了，以后拦不住别人走。需不需要慎重考虑，您拍板。" },
      ],
      choices: [
        { label: "「开了就开了——同意她转签影视部。」", hint: "转签影视部（team HALL + 影视部标记，保持在籍）：热度+4 士气+1；登记先河旗标 szn23Film（后续线可回收）",
          tag: "szn23", value: "film",
          effect: st => {
            const m = st.members.find(x => x.name === "孙珍妮");
            if (m) {
              m.captain = false; m.vice = false; delete m.sub;
              m.team = "HALL"; m.film = true;
              m.note = (m.note ? m.note + "；" : "") + "2023-09 · 艺考上岸，转签影视部（2023 年起转影视发展）";
            }
            st.flags.szn23Film = true;   // 破圈先河旗标（升堂以外的第二条路——2026/2027 影视线可回收）
            st.heat = Math.min(100, st.heat + 4);
            st.morale = Math.min(100, st.morale + 1);
            Game.syncTeams(st);
            return "转签协议当天办完了。影视部的门牌上多了一个新名字，剧场里少了公演排期上的一行——但社交平台上，她的角色剪辑还在一帧一帧地涨播放。\n\n签完字她在走廊里碰见你，鞠了一躬：「剧团这边……我会常回来看公演的。」你点点头：「去吧。这条路是你自己试出来的，公司只是帮你把门推开。」\n\n先河开了。从此往后，这条河的孩子们知道：除了灯海和榜单，还有一个地方，也能让人被河外的人记住。\n\n（决策已登记：szn23=film。孙珍妮转签影视部（保持在籍）；热度+4 士气+1；先河旗标 szn23Film 已登记。）";
          } },
        { label: "「再等等——让她留在女团，把舞台站稳。」", hint: "留在女团（HII 在籍不动）：热度-2（少一条破圈线）；羁绊+2（安心留队）",
          tag: "szn23", value: "stay",
          effect: st => {
            const m = st.members.find(x => x.name === "孙珍妮");
            if (m) { m.bond = Math.min(100, (m.bond || 0) + 2); m.note = (m.note ? m.note + "；" : "") + "2023-09 · 艺考上岸，婉拒影视部转签，留队女团发展"; }
            st.heat = Math.max(0, st.heat - 2);
            return "你把转签协议收回了抽屉：「艺术类录取是好事，先把学上完。剧场的舞台，还是你的主场。」\n\n她愣了一下，随即笑了：「好。其实我也还没演够。」\n\n外戏的余热慢慢散了，热搜换了一茬又一茬。剧场的排期表上，她的名字还在——只是白板角上，叶盛用铅笔写了行小字：影视部的事，明年再议。\n\n（决策已登记：szn23=stay。孙珍妮留队女团；热度-2；羁绊+2。）";
          } },
      ],
    },
    {
      /* 【2023·9月（用户口径 2026-XX 批次）】钟洁玟（GNZ48 十三期生，2022-10 入团）
         主动陈情自己存在超额收受礼物的情况；还未等公司作出处罚，就被营销号爆料
         其私联恋爱——双罪并发（超额收礼+私联恋爱，私联恋爱属严重违纪）。
         两案拍板：①按流程解约（追缴违约金 STORY.ZJW23_PENALTY，入账；离团）
         ②移籍 IDFT（训练生池不计薪自动停薪；promoBanUntil=2024-09 一年内不得升格
         ——总选入榜升格三处过滤，同 2022 陈佳莹/2023 江雨航口径）。
         gate：钟洁玟 GNZ48 或 CGT48 在籍（status=branch & branchTeam∈{GNZ48,CGT48}，
         非殿堂——用户口径「GNZ48 或 CGT48 在籍时触发」）且未拍板时触发。
         【违规事件·失格值修正】私联恋爱属成员违纪：两案均调 violationDqHit
         （同队 dq+2；match 按其 branchTeam 动态传入，兼容 GNZ48/CGT48 双分支）；
         fire 解约离团 → dqCalmMark 免涨窗；idft 移籍非解约/暂休，不设免涨窗。
         【同源陷阱①】登记权归选项（tag zjw23），effect 不得以 decisions.zjw23 作卫兵。
         数值 Agent 拟定可调：fire 违约金 60 万入账 士气-2 热度-3；idft 羁绊-6
         士气-2 热度-2。 */
      id: "m9_23_zjw",
      title: "9月 · 陈情与爆料",
      violation: "私联",   // 【违规事件类型 tag】同队队员失格值连带（violationDqHit）；fire 离团后 dqCalmMark 免涨窗
      gate: st => !st.decisions.zjw23
        && st.members.some(m => m.name === "钟洁玟" && m.status === "branch"
          && (m.branchTeam === "GNZ48" || m.branchTeam === "CGT48") && !m.hall),
      pages: st => {
        const wm = st.members.find(x => x.name === "钟洁玟");
        const bt = wm ? wm.branchTeam : "GNZ48";
        return [
          { nar: true, t: "九月中旬的下午，叶盛拿着一封手写陈情信走进办公室，神色复杂。" },
          { s: "叶盛", cls: "speaker-yesheng", t: "总监，(" + bt + " 的)钟洁玟——十三期生，去年十月才进团。她今天上午自己找到分团运营，递交了这封陈情信：承认自己存在超额收受粉丝礼物的情况，按章程应该怎样处罚，她接受。" },
          { s: "叶盛", cls: "speaker-yesheng", t: "（把陈情信翻过去，压上一叠打印的截图）但还没等公司作出处罚——中午，营销号把另一件事爆了出来：她和一个「大粉」长期私联，聊天记录里……是恋爱关系。私信截图齐全，热搜已经挂上了。" },
          { s: "叶盛", cls: "speaker-yesheng", t: "超额收礼，她自己陈了情；私联恋爱，是严重违纪。章程拟了两条路：按流程解约、追缴违约金；或者移回训练生池观察。分团那边不敢落章，得您拍板。" },
        ];
      },
      choices: [
        { label: "「按流程办——解约，违约金追缴。」", hint: st => "解约离团（违纪解除）：追缴违约金 " + (STORY.ZJW23_PENALTY || 60) + " 万入账；士气-2 热度-3",
          tag: "zjw23", value: "fire",
          effect: st => {
            const fee = STORY.ZJW23_PENALTY || 60;
            const wm = st.members.find(x => x.name === "钟洁玟");
            const match = wm && wm.branchTeam ? { branchTeam: wm.branchTeam } : undefined;   // GNZ48/CGT48 双分支消歧
            const hitTail = Game.violationDqHit(st, "钟洁玟", match);   // 违规事件·同队失格值连带（离团前调用）
            const m = st.members.find(x => x.name === "钟洁玟" && x.status === "branch"
              && (x.branchTeam === "GNZ48" || x.branchTeam === "CGT48"));
            if (m) { m.status = "left"; m.note = (m.note ? m.note + "；" : "") + "2023-09 超额收礼陈情·私联恋爱曝光：按流程解约离团（追缴违约金 " + fee + " 万）"; }   // branchTeam 保留（失格值连带/免涨窗按分团归属判定）
            Game.dqCalmMark(st, "钟洁玟", match);   // 违纪解约 → 原队伍其后 2 个月失格值不自然增长
            st.money += fee;
            st.morale = Math.max(0, st.morale - 2);
            st.heat = Math.max(0, st.heat - 3);
            return "解约公告当晚挂上官网：「钟洁玟，在团期间超额收受粉丝礼物并私联粉丝——经总部核准，按流程解除合约，追缴违约金。"+fee+"万如数到账，手续办得干干净净。\n\n她进团还不满一年。分团剧场的灯牌照常亮起，只是名单上又少了一个还没来得及站稳的名字。\n\n（决策已登记：zjw23=fire。钟洁玟按流程解约离团；追缴违约金 "+fee+" 万入账；士气-2 热度-3。）"+(hitTail ? "\n\n"+hitTail : "");
          } },
        { label: "「移籍 IDFT 训练生池——停薪观察，一年内不得升格。」", hint: "移籍 IDFT：训练生池不计薪（自动停薪）；一年内不得升格（总选入榜升格三处过滤）；羁绊-6 士气-2 热度-2",
          tag: "zjw23", value: "idft",
          effect: st => {
            const wm = st.members.find(x => x.name === "钟洁玟");
            const match = wm && wm.branchTeam ? { branchTeam: wm.branchTeam } : undefined;   // GNZ48/CGT48 双分支消歧
            const hitTail = Game.violationDqHit(st, "钟洁玟", match);   // 违规事件·同队失格值连带（移籍前调用）
            const m = st.members.find(x => x.name === "钟洁玟" && x.status === "branch"
              && (x.branchTeam === "GNZ48" || x.branchTeam === "CGT48"));
            if (m) {
              m.status = "idft"; m.team = "IDFT"; m.branchTeam = null; m.branchLabel = null;
              m.captain = false; m.vice = false; delete m.sub;
              m.bond = Math.max(1, (m.bond || 0) - 6);
              m.promoBanUntil = "2024-09";   // 禁止升格 1 年（2023-09 起算，月精度含当月——登记/拍板/落地三处过滤）
              m.note = (m.note ? m.note + "；" : "") + "2023-09 超额收礼陈情·私联恋爱曝光：移籍 IDFT 观察（停薪·一年内不得升格）";
            }
            st.morale = Math.max(0, st.morale - 2);
            st.heat = Math.max(0, st.heat - 2);
            return "处罚公告当晚挂上官网：「钟洁玟，超额收受粉丝礼物、私联粉丝——即日起调回训练生池观察，停发工资一年，一年内不得参与升格评定。」\n\nIDFT 训练生池不计薪——从本月起，工资册上少了一行名字；总选入榜升格的名单里，这个名字也会被划掉，直到明年年中。\n\n主动陈情的人，最后还是被另一桩事拖进了更深的水。分团剧场的灯牌照常亮着——只是后台都知道，那个自己走过来认错的孩子，现在要从最底下重新爬。\n\n（决策已登记：zjw23=idft。钟洁玟移籍 IDFT；羁绊-6；士气-2 热度-2。）"+(hitTail ? "\n\n"+hitTail : "");
          } },
      ],
    },
  ],

  /* ---------- 10月：赵佳蕊退团申请（与队友刘闲矛盾，两案拍板） ---------- */
  10: [
    {
      /* 【2023·10月（用户口径 2026-XX 批次）】赵佳蕊与队友刘闲产生矛盾，赵佳蕊请求
         退团。两案拍板：
         ①允许离团（left，士气-1）
         ②挽留并承诺重新分配队伍（留队羻绊+3 士气+1；刘闲与赵佳蕊相互关系清零；
           开启赵佳蕊所在团体的组阁窗——组阁窗内刘闲与赵佳蕊不能指定在同一队伍）。
         gate：赵佳蕊与刘闲均在籍（active/branch，非殿堂）且同一队伍
         （branch 按 branchTeam、本部按 team 归属同 key——非队友不触发）且未拍板。
         所在团体：branch → branchTeam（GNZ48/BEJ48/CKG48/SHY48/CGT48 有建制——
         CGT48 建制 Team CⅡ/GⅡ/预备生，用户口径 2026-XX 批次）；
         本部 → SNH48；其余无队伍建制的团体 → 直接登记 zjr23Reorg="noTeams"
         收口，不开窗（承诺留待建制后兑现）。
         组阁时序：choice stay 落地 flags.zjr23ReorgGroup → 同月月末起 engine endMonth
         注入 STORY.zjrReorg23Pick（pickMode zjr23reorg → UI.showZjrReorg23Picker
         → Game.applyZjr23Reorg，10~12 月兜底重注入，必须完成）。
         【同源陷阱①】登记权归选项（tag zjr23）；decisions.zjr23Reorg 登记权归
         engine.applyZjr23Reorg，事件 effect 不得写（noTeams 收口除外）。
         【违规事件·判定】队友矛盾/退团请求非违纪——不挂 violation /
         不调 violationDqHit。
         数值 Agent 拟定可调：release 士气-1；stay 羻绊+3 士气+1。 */
      id: "m10_23_zjr",
      title: "10月 · 一份退团申请",
      gate: st => {
        if (st.decisions.zjr23) return false;
        const tk = m => (m.status === "branch" ? (m.branchTeam || m.team) : m.team);
        const zj = st.members.find(m => m.name === "赵佳蕊" && (m.status === "active" || m.status === "branch") && !m.hall);
        const lx = st.members.find(m => m.name === "刘闲" && (m.status === "active" || m.status === "branch") && !m.hall);
        return !!(zj && lx && tk(zj) === tk(lx));
      },
      pages: st => {
        const zj = st.members.find(m => m.name === "赵佳蕊");
        const grp = zj && zj.status === "branch" ? (zj.branchTeam || zj.team) : "本部（SNH48）";
        return [
          { nar: true, t: "十月中旬，叶盛拿着一封手写的退团申请走进办公室，身后跟着一个眼圈发红的孩子。" },
          { s: "叶盛", cls: "speaker-yesheng", t: "总监，赵佳蕊——她和同队的刘闲，这几个月处得越来越僵。排练挤兑、公演抢位，队伍的磨合度一路往下掉。今天早上，她把这份申请放在了我桌上：请求退团。" },
          { s: "叶盛", cls: "speaker-yesheng", t: "（把申请轻轻放在桌上）孩子是一时意气，还是真伤了心，得您当面看。留，就要动队伍——两个人总得分开；放，名册上又少一个人。您拍板。" },
          { nar: true, t: "（所在团体：" + grp + "。挽留将开启该团体组阁窗——窗内刘闲与赵佳蕊不能指定在同一队伍。）" },
        ];
      },
      choices: [
        { label: "「强扭的瓜不甜——允许她离团。」", hint: "赵佳蕊协商离团；士气-1",
          tag: "zjr23", value: "release",
          effect: st => {
            const m = st.members.find(x => x.name === "赵佳蕊");
            if (m) { m.status = "left"; m.note = (m.note ? m.note + "；" : "") + "2023-10 与队友刘闲产生矛盾，协商退团离团"; }
            st.morale = Math.max(0, st.morale - 1);
            return "你在申请上签了字。她鞠了一躬，转身的时候脚步比进来时轻了。队伍里的空气第二天就松了下来——只是排练室里，少了一个声音。\n\n（决策已登记：zjr23=release。赵佳蕊协商离团；士气-1。）";
          } },
        { label: "「留下——我向你保证，队伍会重新分。」", hint: "赵佳蕊留队（羻绊+3 士气+1）；刘闲与赵佳蕊相互关系清零；开启所在团体组阁窗（窗内两人不能同队）",
          tag: "zjr23", value: "stay",
          effect: st => {
            const zj = st.members.find(x => x.name === "赵佳蕊");
            const lx = st.members.find(x => x.name === "刘闲");
            if (zj) {
              zj.bond = Math.min(100, (zj.bond || 0) + 3);
              zj.note = (zj.note ? zj.note + "；" : "") + "2023-10 与刘闲矛盾后经总监挽留留队（承诺重新分配队伍）";
            }
            if (zj && lx) {
              const r = Game.relGet(st, zj.id, lx.id);   // 懒初始化后取当前关系值
              if (r != null && r > 0) Game.relAdd(st, zj.id, lx.id, -r);   // 相互关系清零（两张卡同步）
            }
            const grp = zj && zj.status === "branch" ? (zj.branchTeam || zj.team) : "SNH48";
            st.flags.zjr23ReorgGroup = grp;
            const hasTeams = ["SNH48", "GNZ48", "BEJ48", "CKG48", "SHY48", "CGT48"].indexOf(grp) >= 0;
            if (!hasTeams) st.decisions.zjr23Reorg = "noTeams";   // 无队伍建制团体：不开窗（承诺留待建制后兑现）
            st.morale = Math.min(100, st.morale + 1);
            return "你把申请推了回去：「队伍的问题，是管理层的问题。我向你保证——组阁名单出来之前，你们两个人，不会再站在同一个台上。」\n\n她看着你，很久，把申请折了起来：「……好。我等那份名单。」\n\n送她出门后，你叫住了叶盛：「把" + (grp === "SNH48" ? "本部" : grp) + "的名册整理好——组阁，现在开始。」\n\n（决策已登记：zjr23=stay。赵佳蕊留队：羻绊+3；士气+1；刘闲与赵佳蕊相互关系清零。" + (hasTeams ? "所在团体组阁窗即将开启（窗内两人不能同队）。" : grp + " 暂无队伍建制，组阁窗不开（承诺留待建制后兑现）。") + "）";
          } },
      ],
    },
  ],

  /* ---------- 11月：金曲大赏投票开启 ---------- */
  11: [
    {
      id: "m11_23_rt_vote",
      title: "金曲大赏投票开启",
      pages: st => [
        { nar: true, t: "十一月，金曲大赏投票通道开启。虚拟剧场的全年轮播曲目自动进了歌单——常态化运营一年的第二个世界，第一次有了自己的投票盘。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "总监，投票开了。打投数据照旧双备份——节流之年，账目清白这条规矩，一分钱都不能省。" },
      ],
    },
  ],

  /* ---------- 12月：年度金曲大赏 + 交棒倒计时 ---------- */
  12: [
    {
      id: "m12_23_rt",
      title: "12月30日 · 年度金曲大赏",
      pages: st => [
        { nar: true, t: "12月30日，年度金曲大赏。真人与数字分身同台的合唱舞台压轴——常态化运营了一整年的两个世界，在今晚合到了同一束追光里。年度金曲《失忆（UNAWARE）》登顶，周诗雨、王奕的声音挂上榜单顶端。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（在侧幕看着水牌）总监，交棒之年的大赏，唱满了。（金曲大赏结算——榜单随结算页展示。）" },
      ],
    },
    {
      id: "m12_23_year_end",
      title: "12月 · 交棒前夜",
      pages: st => [
        { nar: true, t: "十二月最后一周，财务把年账摊开：开源的几条新线、节流省下的每一笔、成都工地的进度（如果动了工）——账本比往年薄，也比往年清楚。走廊尽头，行政部已经在排明年的办公室分配表：王婧和陶莺的名字，第一次排进了管理层那一栏。" },
        { s: "王子杰", cls: "speaker-wangzj", t: "（年度酒会上，举杯）最后一年管一线，账没算砸，旗也立起来了。明年起，一线交给王婧和陶莺——总监，河走向全国的计划，托付给你了。（年度结算与结局：endings23。）" },
      ],
    },
  ],
};

/* ========================================================================
   七、随机事件池（randomPool23）——占位，随月度事件一并补充
   ======================================================================== */
STORY.randomPool23 = [];

/* ========================================================================
   八、通用月度事件挂载（同 2022 线口径）：
   · 8 月：影视资源兑现（STORY.filmEvent）；
   · 4/8/12 月：预备生汇报公演（STORY.prepStageShared，2018 制度逐年延续）；
   · 9 月：中秋事件（STORY.midAutumn）。
   ======================================================================== */
if (!STORY.monthly23[8]) STORY.monthly23[8] = [];
STORY.monthly23[8].push(STORY.filmEvent);
for (const _pm of [4, 8, 12]) {
  if (!STORY.monthly23[_pm]) STORY.monthly23[_pm] = [];
  STORY.monthly23[_pm].push(STORY.prepStageShared);
}
if (STORY.midAutumn) {
  if (!STORY.monthly23[9]) STORY.monthly23[9] = [];
  STORY.monthly23[9].unshift(STORY.midAutumn);
}

/* ========================================================================
   七·五、GNZ48 组阁（2023·恢复旗号小组阁次月来电，用户口径 2026-XX）
   ------------------------------------------------------------------------
   主线③恢复旗号小组阁完成（applyReorg23 落笔 flags.gnzReorg23Done）的次月，
   周马/陈文泽来电（按玩家兼任分支，call 函数形态）：恢复旗号完成得不错，但
   GNZ48 人气与编制不匹配、又恰逢多事之秋，急需组阁——挂断后起 GNZ48 组阁窗，
   必须完成（pickMode gnzreorg23 → UI.showGnzReorg23Picker → Game.applyGnzReorg23）。
   时序由 endMonth 注入（steps.push chain：Call → Pick），不占月度表——
   兜底：主线未完成、或 12 月才完成（次月不存在）→ 12 月月末开窗。
   【通话模拟协作规范】通话内页仅来电者发言与 nar；拍板窗独立成事件卡
   （含 pickMode 的事件不走来电路径，见 ui.stepVN 口径）。
   ======================================================================== */
STORY.gnzReorg23Call = {
  id: "gnzReorg23Call",
  title: "GNZ48 组阁 · 广州的来电",
  gate: st => !st.decisions.gnzReorg23,
  call: st => ({
    mode: "phone",
    caller: (st.flags.concur17 && st.flags.concur17["GNZ48"]) ? "陈文泽" : "周马",
    sub: "广州 · GNZ48 来电",
    complaint: "（电话那头透着罕见的急切）总监，可算接了——广州这边等着您定盘子，孩子们的队伍牌都先不发了。",
  }),
  pages: st => {
    const boss = (st.flags.concur17 && st.flags.concur17["GNZ48"]) ? "陈文泽" : "周马";
    return [
      { nar: true, t: "恢复旗号工作收官后的第一个工作日，一个广州方向的来电转进了总监办公室。" },
      { s: boss, t: "总监，恢复旗号这事，您办得漂亮——BEJ48、CKG48 的队伍建制都立回来了，两边的孩子有队可归、有台可上。广州这边看在眼里，也急在心里。" },
      { s: boss, t: "急的是我们自己的账：GNZ48 现下的人气，和三支队伍的编制对不上——有的队堆着人气主力，有的队冷清得能听见回声。又恰逢多事之秋，大股东那边盯着每一条河的成本，再拖下去，队里的心气就散了。" },
      { s: boss, t: "广州运营组的意见就一条：急需组阁。名单您来定——每个孩子去哪支队，请您务必亲自拍板。名册我已经整理好了，您挂了电话就过目。" },
    ];
  },
};

STORY.gnzReorg23Pick = {
  id: "gnzReorg23Pick",
  title: "GNZ48 组阁 · 名单敲定",
  gate: st => !st.decisions.gnzReorg23,
  pages: st => [
    { nar: true, t: "挂断电话，叶盛把 GNZ48 的名册摊在桌上——三支队伍、一份预备生名单，每一行都空着一个去向栏。" },
    { s: "王婧", cls: "speaker-wangjing", t: "总监，广州的意思很明白：这次组阁没有「再等等」。人气对不上编制，队伍就聚不起心气——多事之秋，散了就很难再拢回来。" },
    { nar: true, t: "（组阁窗逐人定队：Team G / Team NIII / Team Z / GNZ48 预备生；现编队已预填，只需点击需调整的成员——必须完成组阁方可继续。）" },
  ],
  choices: [
    { label: "逐人定队——GNZ48 组阁名单敲定", hint: "Team G / Team NIII / Team Z / GNZ48 预备生（现编队预填默认，只需点击需变更的成员）；每队 13~20 人（人手不足放开下限）；必须完成组阁",
      pickMode: "gnzreorg23" },
  ],
};

/* ========================================================================
   七·六、赵佳蕊挽留线·所在团体组阁（2023·10月事件次步，用户口径 2026-XX）
   ------------------------------------------------------------------------
   事件 m10_23_zjr choice stay（承诺重新分配队伍，flags.zjr23ReorgGroup=所在团体）后，
   组阁拍板窗由 endMonth 注入（10~12 月兜底重注入，必须完成；同 gnzReorg23 兜底口径）：
   pickMode zjr23reorg → UI.showZjrReorg23Picker → Game.applyZjr23Reorg。
   窗内约束：刘闲与赵佳蕊不能指定在同一队伍（showTeamAssignPicker forbidPairs
   + applyZjr23Reorg 引擎兑底校验）。无队伍建制的团体由事件 effect
   直接登记 decisions.zjr23Reorg="noTeams" 收口，本事件 gate 拦截不开窗。
   ======================================================================== */
STORY.zjrReorg23Pick = {
  id: "zjrReorg23Pick",
  title: "组阁 · 名单敲定",
  gate: st => !!(st.decisions.zjr23 === "stay" && !st.decisions.zjr23Reorg && st.flags.zjr23ReorgGroup),
  pages: st => {
    const grp = st.flags.zjr23ReorgGroup;
    return [
      { nar: true, t: "叶盛把" + (grp === "SNH48" ? "本部" : grp) + "的名册摊在桌上——每一行都空着一个去向栏。赵佳蕊站在门口，等着那份被承诺过的名单。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "总监，名册齐了。您许过的话：赵佳蕊和刘闲，从今往后不在一个队伍——分班的时候，这两张卡片得离得远远的。" },
      { nar: true, t: "（组阁窗逐人定队；⚠ 刘闲与赵佳蕊不能指定在同一队伍——违反则无法确认。必须完成组阁方可继续。）" },
    ];
  },
  choices: [
    { label: "逐人定队——组阁名单敲定", hint: "现编队预填默认（低点击量，只需点击需变更的成员）；每队 13~20 人（人手不足放开下限）；⚠ 刘闲与赵佳蕊不能指定在同一队伍；必须完成组阁",
      pickMode: "zjr23reorg" },
  ],
};

/* ========================================================================
   七·七、CGT48 总监任命（成立后人事剧情，用户口径 2026-XX 批次）
   ------------------------------------------------------------------------
   CGT48 成立（主线二落地 flags.cgt23Open）后，总监人选由 endMonth 注入本剧情
   （三案拍板，tag cgt23Dir；拍板后不再注入；cgt23Open 未落地则永不出场）。
   ①玩家兼任：兼任口径——flags.concur17["CGT48"]=true（多兼任字典，不影响
     既有兼任）；decisions.branchPost 为 2016「下一站」单席位历史口径，本事件
     不覆写（分团兼任判定一律走 concur17）。
   ②举荐朱瑞龙兼任：需朱瑞龙在职——在职判定：decisions.zrl16≠"dismiss"
     （未解聘，含调任上海总部）或 flags.zrl17Back（解聘后经 2017 邀请回归复职）；
     在职但已任 BEJ48 运营总监（liao17=zhu）则为双线兼任，北京现职不变。
   ③不推举：周马兼任（GNZ48 运营总监兼管成都）。
   ======================================================================== */
STORY.cgt23DirectorPick = {
  id: "cgt23DirectorPick",
  title: "CGT48 总监 · 人事任命",
  gate: st => !!(st.flags.cgt23Open && !st.decisions.cgt23Dir),
  zrlOnDuty: st => !!(st.decisions.zrl16 !== "dismiss" || st.flags.zrl17Back),   // 朱瑞龙在职判定（解聘且未回归 → 不在职）
  pages: st => [
    { nar: true, t: "CGT48 开业的庆功宴散场后，王子杰把你留在了会议室。桌上摊开的，是一份还没有名字的人事任命书——CGT48 总监。" },
    { s: "王子杰", cls: "speaker-wangzj", t: "剧场立起来了，牌子挂上了，接下来就是人。成都那边不能没人坐镇——总监的人选，你来定。集团的意思是：人选不拘一格，兼任也行，但必须是你信得过的人。" },
    { s: "王子杰", cls: "speaker-wangzj", t: "（把任命书推过来）你可以自己去——融资的事我已经分不出身，成都这摊子交给谁，我都不如交给你放心。当然，你要是有别的想法，也说得通。" },
  ],
  choices: [
    { label: "「我去。成都那张桌子，我来坐。」", hint: "您兼任 CGT48 总监（兼任口径 concur17.CGT48 登记，不影响既有兼任）；热度+2 负担+5",
      tag: "cgt23Dir", value: "player",
      effect: st => {
        if (!st.flags.concur17) st.flags.concur17 = {};
        st.flags.concur17["CGT48"] = true;   // 兼任口径（多兼任字典；branchPost 单席位历史口径不覆写）
        st.heat = Math.min(100, st.heat + 2);
        st.burden = Math.min(100, (st.burden || 0) + 5);
        return "任命公示当天发出：制作总监{name}兼任 CGT48 运营总监——上海、成都，两座剧场一条心。\n\n成都的孩子们在公告栏前看了很久。新开的剧场，灯是亮的，人是齐的，心是定的——因为坐在那张桌子后面的人，是把这条河从上海一路趟过来的人。\n\n（决策已登记：cgt23Dir=player。玩家兼任 CGT48 总监（concur17.CGT48 已登记，不影响既有兼任）；热度+2 负担+5。）";
      } },
    { label: "「举荐朱瑞龙——让老将去开新城。」", hint: st => STORY.cgt23DirectorPick.zrlOnDuty(st) ? "朱瑞龙兼任 CGT48 总监（北京现职不变，经验开路）；士气+1 热度+2" : "朱瑞龙已解聘且未回归复职，不在职（不可举荐）",
      gate: st => STORY.cgt23DirectorPick.zrlOnDuty(st),   // 朱瑞龙不在职：选项隐藏（同 wxj 影视约选项级 gate 口径）
      tag: "cgt23Dir", value: "zrl",
      effect: st => {
        st.morale = Math.min(100, st.morale + 1);
        st.heat = Math.min(100, st.heat + 2);
        return "人事任命第二天发出：朱瑞龙兼任 CGT48 运营总监——北京现职不变，成都双线开弓。\n\n他接到调令的电话时只问了一句：「剧场是我的本行，什么时候动身？」从 2016 年的积分案到今天，这位老将把每一家剧场都当成自己的户口本。成都的新剧场交到他手里，账本、灯位、票务，一样都不会乱。\n\n王子杰在任命书的抄件上圈了个「稳」字。\n\n（决策已登记：cgt23Dir=zrl。朱瑞龙兼任 CGT48 总监（北京现职不变）；士气+1 热度+2。）";
      } },
    { label: "「不推举了——让周马兼着吧。」", hint: "周马兼任 CGT48 总监（GNZ48/CGT48 双线）；热度+1",
      tag: "cgt23Dir", value: "zhouma",
      effect: st => {
        st.heat = Math.min(100, st.heat + 1);
        return "人事任命发出：GNZ48 运营总监周马兼任 CGT48 运营总监——广州、成都，双城一线牵。\n\n周马在电话里笑：「成都是我趟过路的地方，熟。」重庆的支援动线、广州的班底、成都的新人，三条线在他手里拧成了一股绳——只是两边飞，嗓子大概要多吨两斤胖大海。\n\n（决策已登记：cgt23Dir=zhouma。周马兼任 CGT48 总监（GNZ48/CGT48 双线）；热度+1。）";
      } },
  ],
};

/* ========================================================================
   七·八、CGT48 建制运营（总监任命后两步 + 兜底，用户口径 2026-XX 批次）
   ------------------------------------------------------------------------
   总监任命（decisions.cgt23Dir）拍板后由 endMonth 依次注入（同月末 chain 接续，
   惰性 gate；未完成项跨月重注入，同 gnzReorg23 兜底口径）：
   ①分队 STORY.cgt23SquadPick：CGT48 自主招募成员（gen 以 CGT48 开头）分队至
     Team CⅡ/GⅡ/预备生——口径「参照 2026 成员卡」：
     · 玩家兼任（cgt23Dir=player）→ 组阁窗自定（pickMode cgt23squad →
       UI.showCgt23SquadPicker，预填 2026 卡口径可调）→ Game.applyCgt23Squad；
     · 非玩家兼任 → 总监按 2026 卡口径自动分队（单确认选项，
       Game.cgt23SquadAutoAssign + applyCgt23Squad；无 2026 卡者留预备生）。
   ②引援 STORY.cgt23DraftPick：本部与各分团各调取一人入 CGT48（羁绊不减）：
     玩家兼任=自主调取；非玩家兼任=向对应总监（朱瑞龙/周马）推荐——
     pickMode cgt23draft → UI.showCgt23DraftPicker → Game.applyCgt23Draft。
   ③新批次兜底 STORY.cgt23LateFill：分队落定后仍有持 2026 卡的自主招募成员
     未分队（如 12 月二期生入册）→ 单确认事件按 2026 卡口径补分队（一次性，
     tag cgt23LateFill）。
   ======================================================================== */
STORY.cgt23SquadPick = {
  id: "cgt23SquadPick",
  title: "CGT48 · 分队",
  gate: st => !!(st.flags.cgt23Open && st.decisions.cgt23Dir && !st.decisions.cgt23Squad),
  pages: st => {
    const isPlayer = st.decisions.cgt23Dir === "player";
    return [
      { nar: true, t: "总监人选落定的第二天，叶盛把 CGT48 的自主招募名册（一期生、二期生）摊在桌上——名字后面，都空着一个队伍栏。" },
      { s: "叶盛", cls: "speaker-yesheng", t: isPlayer
        ? "总监，分队的事您亲自来。分队参考口径是成都筹备组拟的分队预案——谁进 CⅡ、谁进 GⅡ，名单上已经预填了一版，您看着调。"
        : "总监，分队的事按成都筹备组拟的预案先分一轮——谁进 CⅡ、谁进 GⅡ，名单上都对得上号；没上预案的孩子先留在预备生。" },
      { nar: true, t: "（分队口径：Team CⅡ / Team GⅡ / 预备生；按筹备组预案预填/自动分队，未上预案者留预备生；每队至多 20 人。）" },
    ];
  },
  choices: [
    { label: "逐人分队——CGT48 名单敲定", hint: "Team CⅡ / Team GⅡ / CGT48 预备生（预填按筹备组预案，可调）；每队至多 20 人；必须完成分队",
      gate: st => st.decisions.cgt23Dir === "player",
      pickMode: "cgt23squad" },
    { label: "按筹备组预案分队", hint: "总监自动分队：按筹备组预案（CⅡ/GⅡ），未上预案者留预备生；士气+1",
      gate: st => st.decisions.cgt23Dir !== "player",
      effect: st => Game.applyCgt23Squad(Game.cgt23SquadAutoAssign(st)).text },
  ],
};

STORY.cgt23DraftPick = {
  id: "cgt23DraftPick",
  title: "CGT48 · 引援调取",
  gate: st => !!(st.flags.cgt23Open && st.decisions.cgt23Dir && st.decisions.cgt23Squad && !st.decisions.cgt23Draft),
  pages: st => {
    const isPlayer = st.decisions.cgt23Dir === "player";
    const dirName = st.decisions.cgt23Dir === "zrl" ? "朱瑞龙" : "周马";
    return [
      { nar: true, t: "分队刚定，下一份名单又摆上了桌——这次是引援：本部和各个分团，各出一个名字，调进成都。" },
      { s: "叶盛", cls: "speaker-yesheng", t: isPlayer
        ? "总监，这是您兼任后的第一笔引援——从本部和各分团各挑一个人，支援成都的开局。有一条要紧的：调取不降羁绊，孩子们原封不动地过去，只是换个剧场唱。"
        : "总监，" + dirName + "那边来函要人——本部和各分团各一个。您从名单里推荐，总监那边照单全收。同样一条：调取不降羁绊。" },
      { nar: true, t: "（引援口径：本部与各在册分团各调取一人入 CGT48（预备生起步）；羁绊不减；调取成员清队长/队副任命。）" },
    ];
  },
  choices: [
    { label: "敲定引援名单", hint: st => "本部与各在册分团各调取一人（每团点选一人）；羁绊不减；调取成员预备生起步",
      pickMode: "cgt23draft" },
  ],
};

STORY.cgt23LateFill = {
  id: "cgt23LateFill",
  title: "CGT48 · 新成员分队",
  gate: st => !!(st.flags.cgt23Open && st.decisions.cgt23Dir && st.decisions.cgt23Squad
    && !st.decisions.cgt23LateFill
    && Game.cgt23Recruits(st).some(m => m.branchLabel === "预备生" && Game.cgt23CardLabel(m.name) !== "预备生")),
  pages: st => [
    { nar: true, t: "CGT48 的新一批自主招募成员入册了——名单上的几个名字，筹备组的分队预案里都写着队伍栏。" },
    { s: "叶盛", cls: "speaker-yesheng", t: "总监，新来的孩子们按筹备组预案补分队——预案上有队伍栏的进队，没上的留预备生。" },
    { nar: true, t: "（补分队口径：预案上有队伍栏者按预案入队（CⅡ/GⅡ），未上预案者留预备生；一次性。）" },
  ],
  choices: [
    { label: "按筹备组预案补分队", hint: "预案上有队伍栏者按预案入队（CⅡ/GⅡ），未上预案者留预备生；一次性（cgt23LateFill 登记）",
      tag: "cgt23LateFill", value: "done",
      effect: st => {
        let n = 0;
        for (const m of Game.cgt23Recruits(st)) {
          if (m.branchLabel !== "预备生") continue;
          const lb = Game.cgt23CardLabel(m.name);
          if (lb === "预备生") continue;   // 无卡者留预备生（分队参考口径）
          m.branchLabel = lb;
          m.note = (m.note ? m.note + "；" : "") + st.era + " CGT48分队 · 编入 " + lb;
          n++;
        }
        Game.syncTeams(st);
        return "分队公告贴上了成都剧场的新栏——" + n + " 个名字找到了自己的队伍。预备生栏里剩下的，是还没上卡的孩子们——练着，等着，都会有的。\n\n（新成员补分队 " + n + " 人；决策 cgt23LateFill 已登记。）";
      } },
  ],
};

/* ========================================================================
   【待用户口径补充（宁缺毋滥，Agent 不虚构）】
   · 2023 史实入团表（DATA.joining2023）：已按用户口径挂载（2026-XX 对话批次，
     86 人，精确到日；CGT48 一/二期生特殊处理见 engine.mountCgt23Join——成立后入册/
     未成立年末转 GNZ48 委培，2024 线建后按 note 识别移籍回收）；
   · 2023 史实离团表（DATA.leaving2023）：已按用户口径挂载（2026-XX 对话批次：通用离团
     16 人直落 + 名单精简 12 人复用 layoff21 机制——本部/兼任分团者拍板、未兼任分团者
     自动补偿；何渝欣为 CGT48 双路径卡）；查无卡 8 人（潘颖/吴学雨/高蔚然/王若诗蓝/
     谢菲菲/冉蔚/陈颒琳/付奕萱）待用户口径，规则第 6 条已询问是否补挂建卡；
   · 2023 年度金曲榜单（DATA.goldSongs["2023"]）：已按用户口径挂载（2026-XX 批次：
     荣耀队歌《远方的海》Team NII；前三锁史实《失忆（UNAWARE）》周诗雨、王奕 /
     《辛德瑞拉（CINDERELLA）》王晓佳 / 《HATE 2 LOVE（曼陀罗）》陈珂、郑丹妮；
     4~10 名按人数口径生成）；本年起规则更新——当年离团成员可参加当年金曲大赏
     （resolveGoldSongs，专项 test-gold23.js）；叙事 rtNarrative23 与 12 月事件页
     已回填新年度金曲口径；resolveRT rtNar 链已补接 2023（原漏接静默穿透
     2016 默认叙事——同源陷阱⑤）；
   · 主线①~⑤数值口径（上文标注「可调」处）；
   · 2024 线（成都自动立项 cgt23Deferred / cgt23Open 跨年、下一年主线）待建；
   · 月度随机事件与年度活动细则随口径补充。
   ======================================================================== */

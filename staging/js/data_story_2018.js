/* ============================================================================
   data_story_2018.js — 剧情数据（2018「星阵重列」线，v0.11 新增）
   ----------------------------------------------------------------------------
   【同人声明】本文件全部剧情为粉丝同人虚构创作，与现实无关；真实成员/管理层
   的言行均为艺术演绎，随机事件中涉及成员的一律用「某成员」指代。
   史实锚点考据见 data_members.js 的 history2018 / joining2018 / leaving2018
   （来源 snh48wiki.top 快照 tmp/research/，与公开报道）。

   ----------------------------------------------------------------------------
   【进入方式】本线不从标题页直接开局——由 2017 线结局界面的「进入下一年」入口
   进入（Game.carryTo2018 继承 2017 年末的全部成员卡与经营状态，含荣誉殿堂、
   SHY48/CKG48 开业状态与实力系统）。

   本文件挂载的 STORY 键（engine/ui 按 era==="2018" 消费）：
     STORY.prologue18        序章「全团组阁的宣布」（王子杰总结 2017 + 组阁提出）
     STORY.scenes18          行动场景 { reorgPlan/reorgCoord/reorgXII/reorgReady/reorgDone
                             / smStart/smRehearsal/smDebut / showCamp/showAir/albumOut }
     STORY.hallAscend18(st)  总选连霸升堂事件页（引擎结算后调用）
     STORY.monthly18         月度脚本事件（含每月「预备生汇报公演」共享事件）
     STORY.randomPool18      2018 追加随机事件（引擎与 randomPool 合并取用）
     STORY.geAftermath18(st) 总选举次日剧情
     STORY.rtNarrative18     金曲大赏叙事 { great / normal }
     STORY.endings18         结局文本 { S/A/B/C/bankrupt }

   【六条主线】
     ① 全团大重组（组阁）：序章提出 → 1月张怡请求（tag xiiKeep18: keep/dissolve，
        flags.xiiKept18）→ 行动「推进全团组阁」筹备三段（保留XII为四段，多一步编制确认）
        → 筹备完毕（reorg18.ready）后编制会定于 3 月末召开（九期生 2 月入队后全员一并编排）。
        【编制会】两阶段弹窗（UI.showReorg18Picker）：逐人定队（每队上限20/下限13/
        主力16替补4；本部预备生含九期生一并参编——可留任或直接定队升格 pop+4 bond+4；
        编入预备生≤16人——本部成员降入预备生羁绊-4、分团成员上调预备生
        依旧视为上调享红利）→ 队长队副任命（每队恰1队长/队副至多1）→ Game.applyReorg18
        落地（落编者移籍分团羁绊-8；分团上调享红利；FT 随组阁成立）。
     ② 预备生汇报公演制度：1月推行（舞台总监·马跃），每月月末汇报公演，表现优异
        的预备生（含分团预备生）由总监定队升格（可自分团上调本部，不下放）——年内
        升格 6 人达成主线。
     ③ 年度活动策划：总选举（7月「砥砺前行」）+ 金曲大赏（12月）；连霸（top1 ===
        history.ge2017Top1）→ 引擎自动触发升堂事件（hallAscend18）。
     ④ 复刻《双面偶像》（仅 2017 tag shuangmian17=plan）：行动三段，承办队伍由玩家
        选定（保留XII时可选五队），队伍平均实力影响复刻效果（热度加成 4/7/10）。
     ⑤ 备战鹅厂选秀：派遣至少 11 人点将（葛佳慧承诺 gejiahui17=promise 时自动占一席）
        → 封闭集训 → 首轮录制；有承诺 tag 时额外一步：为葛佳慧发行个人专辑（album18）。
     ⑥ 分担叶盛/分担分团：2016「下一站」兼任 tag（flags.concur17/branchPost）存在时
        为「分担分团」（巡访/事务值班），否则为「分担叶盛」（负担系统沿用）。

   【复刻路线专属（v0.11.2/v0.11.6）】
     · 红白歌会·中国预赛（仅 jpMode=replicate，4月事件链）：日方为配合选秀备战开设
       红白歌会中国预赛 → 玩家定承办地（本部/分团，tag kohaku18）→ 全团点将五人
       （pickMode="kohaku5" → UI.showKohakuPicker → engine.setKohakuSquad，
       tag kohaku18Squad 存姓名）→ 12月预赛第一名获邀赴日参加红白决赛（tag kohaku18Final）。
     · 北原里英毕业（4月事件链，2017 玛莉亚东京路线派遣的兼任成员在册才触发）：
       毕业公演地点二选一（tag kitahara18：tokyo=次月效力队伍点将五人赴日
       [pickMode="kitahara5" → UI.showKitaharaPicker → engine.kitaharaSend，
       tag kitaharaSend 存姓名，公演落幕退团] / shanghai=次月星梦剧院公演，
       tag kitahara18CN）——两分支日方均表态「今年暂不派成员兼任，年末有新企划」。
     · TEB48 提议（12月）：AKS 告知明年台湾选拔完毕后希望中方接手作为台湾分团
       TEB48 + 子杰私话警示扩张过快（成都/武汉搁置）——tag teb48Offer18，
       明年是否推进 TEB48 建设，2019 回收。
   【非复刻路线专属】AKB48 TSH 上海分团官宣（12月）——对手打上门来，
     tag tsh18：silent（不发表意见，士气+1）/ ride（蹭热度，热度+6 士气+2）。

   决策标签（st.decisions）：xiiKeep18（张怡请求）/ sm18Team / show18Squad /
     geStrategy / summerMode18 / sponsor18 / kohaku18（红白预赛承办地：hq/分团id）/
     kohaku18Squad（出征五人姓名）/ kohaku18Final（决赛派遣）/ aji18（阿吉去留：
     release/ask）/ ajiDream18（阿吉留任后《梦想演播厅》定盘：studio/draft）/
     units18（小分队选人方式：vote=粉丝打投·史实名单/pick=公司选取·玩家点将）/
     unitsHO2 / unitsBlueV（两支小分队成军名单，存姓名）/
     kitahara18（北原里英毕业公演地点：tokyo/shanghai）/ kitaharaSend（赴日五人姓名）/
     kitahara18CN（上海路线送别）/ teb48Offer18（AKS 台湾分团 TEB48 提议，2019 回收）/
     tsh18（AKB48 TSH 官宣应对：silent/ride）/ yunxi18（《芸汐传》大爆乘势）。
   旗标（st.flags）：xiiKept18 / reorg18Done / sm18Done / show18Done / album18Done /
     hall18 / reignHall18 / ajiStay18（阿吉留任，解锁演播厅定盘）/ ajiLeft18（阿吉离职）/
     dreamStage18（演播厅定盘方向，advanceShow18 首轮录制时回收）。
   ========================================================================== */

"use strict";

/* ========================================================================
   一、序章：全团组阁的宣布（2018 年初决策会议）
   ======================================================================== */
STORY.prologue18 = {
  sceneLabel: "2018年1月 · 上海 · 集团年度决策会议",
  pages: st => [
    { nar: true, t: "2018年1月，上海。\n\n去年，两座新的剧场亮了灯，原创的曲库上了台，总决选的票数又翻了一轮——这条河在第五个年头，终于流成了别人眼里「成气候」的样子。\n\n而今年的第一份议程，和往年的任何一份都不一样。它只有三个字：\n\n「重新排。」" },
    { s: "叶盛", cls: "speaker-yesheng", t: "（抱着一摞队伍名册进门，压低声音）总监，今天会议室的气氛不太一样——创始人亲自来了，各队的队长也都到了。你手里的那份名单，坐着的人比去年多了三成。" },
    { nar: true, t: "九点整，年度决策会议开始。王子杰走进来时没有坐主位——他站在长桌侧面，把一份厚厚的「各队人气与排布对照表」投影在了幕布上。\n\n五个队伍的柱状图，高低差得刺眼。" },
    { s: "王子杰", cls: "speaker-wangzj", t: "先说好消息：去年，双团落地、原创上台、总决选再破纪录——你们交出的这份答卷，比我当年画的那张图纸还要好。这条河，已经流成了气候。（他停了一下）但正因为成了气候，有些过去可以忍的问题，今年忍不了了。" },
    { s: "王子杰", cls: "speaker-wangzj", t: "第一，影响力上来了，各队之间的人气排布却越来越不平衡——有人一票难求，有人门可罗雀，队伍之间的差距在拉大。第二，这几年各家私下请老师开小灶练起来，同一支队伍里，练与不练的孩子差距肉眼可见。资历在谁身上、实力在谁身上、人气在谁身上——三张表对不上了。" },
    { s: "王子杰", cls: "speaker-wangzj", t: "所以今年，我们要做一件这条河五年来没做过的事——全团组阁。SII、NII、HII、X，全部打散重来；FT 随组阁成立；XII 去留再议。所有非殿堂成员，重新编制。这不针对任何人——针对的是「排布」两个字。" },
    { s: "王婧", cls: "speaker-wangjing", t: "（接过话）组阁的框架我已经和叶盛过了三稿：每支队伍上限二十人，主力十六、替补四；十三人是底线。队长、队副重新任命。分团的孩子们，这一年也有了上调本部的通道——相应的，本部没有编进队伍的孩子，集团也会做出安排。" },
    { s: "叶盛", cls: "speaker-yesheng", t: "（小声）组阁是主线一；预备生那边，新来的舞台总监马跃提议搞「汇报公演」制度，每月让预备生上台轮一次；年度活动照旧——七月总决选、十二月金曲大赏。再加上您手里的其他线……总监，今年这条线，比去年还要密。" },
    { s: "王子杰", cls: "speaker-wangzj", t: "（看向你）组阁这把手术刀，我不递给别人。总监——刀在你手里。新的一年，你的打法是什么？" },
  ],

  /* 序章选择：新一年方针（applyStyle 按 era 取本表） */
  styles: [
    { id: "steady18", label: "「组阁是把手术刀——先定规矩，再动刀子。」", hint: "稳进派：资金+80万", apply: st => { st.money += 80; } },
    { id: "polish18", label: "「排布可以重练，实力必须再涨。」", hint: "淬炼派：全团实力+2，训练度+6", apply: st => { Game.gainAllPwr(st, 2); st.train = Math.min(100, st.train + 6); } },
    { id: "hype18", label: "「让重组后的第一场公演，就办成全年最大的话题。」", hint: "造势派：热度+8，叶盛负担-10", apply: st => { st.heat = Math.min(100, st.heat + 8); st.burden = Math.max(0, st.burden - 10); } },
  ],

  /* 序章收尾：叶盛总结六条主线 */
  closing: st => {
    const hasPlan = st.decisions && st.decisions.shuangmian17 === "plan";
    const hasPromise = st.decisions && st.decisions.gejiahui17 === "promise";
    const dutyPost = Game.branchDutyPost(st);
    const head = [];
    head.push({ s: "叶盛", cls: "speaker-yesheng", t: "好——方针定了。今年的线，我给你数一数：" });
    head.push({ s: "叶盛", cls: "speaker-yesheng", t: "①全团大重组，组阁年内落地；②预备生汇报公演制度，马跃牵头，每月一次；③年度活动照旧，七月「砥砺前行」总决选，十二月金曲大赏——对了，去年夺冠的那位要是今年再拿第一，荣誉殿堂的升堂仪式就得办；"
      + (hasPlan ? "④《双面偶像》的复刻工程，去年你和广州约好的——今年落地；" : "")
      + "⑤鹅厂那边递话了，今年有选秀节目——我们要派人出征，至少十一个人"
      + (hasPromise ? "，葛佳慧的专辑企划也排在今年；" : "；")
      + (dutyPost ? "⑥" + dutyPost + "那边兼任的担子，你替叶盛分担一半。" : "⑥叶盛的担子，你继续分一半（说的就是我自己）。") });
    head.push({ nar: true, t: "他掰着手指头数完，把一份名单放到你桌上——扉页贴着一张便签：\n\n「队伍是人搭起来的，也是人走散的。组阁这一刀，落下去之前，先想想她们。——叶盛」\n\n散会后，走廊里遇见几个正在对公演服的孩子。她们还不知道，手里这批绣着队徽的演出服，穿不了几个月了。" });
    return head;
  },
};

/* ========================================================================
   二、行动场景（scenes18）：组阁三/四段 + 复刻三段 + 选秀三段 + 专辑
   ======================================================================== */
STORY.scenes18 = {

  /* ---------- 组阁：方案研讨（0→1，纯叙事） ---------- */
  reorgPlan: {
    label: "组阁 · 方案研讨",
    pages: st => [
      { nar: true, t: "组阁方案研讨定在休息室——没有媒体，没有队长，只有运营层。投影上是三张表：人气表、实力表、队伍黏性表。王子杰说的「对不上」，在这三张表上看得清清楚楚。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（把草稿推过来）规矩我先立好：每队上限二十人，主力十六、替补四，十三人是底线，队长队副重新选。总监，还有一条最难写的——本部编不进队伍的孩子怎么办？" },
      { nar: true, t: "（组阁方案研讨完成。下一步：分团协调会——需资金≥30万，投入30万。）" },
    ],
  },

  /* ---------- 组阁：分团协调（1→2，需资金≥30，投入30） ---------- */
  reorgCoord: {
    label: "组阁 · 分团协调会",
    pages: st => [
      { nar: true, t: "四家分团的总监被连夜请到上海。组阁不只是本部的事——有人要上调，有人要落编，预案必须每一家都点头。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（念完预案最后一页）上调本部的孩子，人气和羁绊都会上一个台阶——这是组阁年里才有的通道。落编移籍的孩子，集团负责安置与谈心，绝不做甩手掌柜。四家都签了字。" },
      { nar: true, t: (st.flags.xiiKept18
        ? "（分团协调完成。下一步：Team XII 编制确认会——张怡的请求，需要你亲口回复。）"
        : "（分团协调完成。筹备收官——编制名单进入终审，组阁编制会定于 3 月末召开。）") },
    ],
  },

  /* ---------- 组阁：XII 编制确认（保留XII的额外一步，2→3） ---------- */
  reorgXII: {
    label: "组阁 · Team XII 编制确认",
    pages: st => [
      { nar: true, t: "一月里张怡那句话，你给了她答案——XII 保留。但保留不是空话：编制、队长、定位，每一项都要落在纸面上。" },
      { s: "张怡", cls: "", t: "（把 XII 的名册双手递过来，队徽别在胸前）谢谢总监。XII 的孩子们不是舍不得一个名字——是舍不得一起从预备生熬上来的这段路。名册在这里，怎么排，您定。我们认。" },
      { nar: true, t: "（XII 编制确认完成。筹备收官——编制名单进入终审，组阁编制会定于 3 月末召开。）" },
    ],
  },

  /* ---------- 组阁：筹备收官（→ready，编制会 3 月末召开） ---------- */
  reorgReady: {
    label: "组阁 · 筹备收官",
    pages: st => [
      { nar: true, t: "三张表钉满了整面墙，红箭头画了一版又一版。终审名单锁进保险柜——运营部对外只放一句话：3 月末，编制会。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（合上笔记本）把日子定在 3 月末，是有讲究的——九期生 2 月就位，新人也一样站上这杆秤。全员一并编排，谁都不会因为是新来的就被将就着放。" },
      { s: "马跃", cls: "", t: "（在门边接了一句）那我可先说好：汇报公演照常每月开。编制会前多看一个月，名单就能少一次看走眼。" },
      { nar: true, t: "（筹备收官：组阁编制会定于 3 月末召开——届时逐人定队、任命队长队副，公布新编制名单。）" },
    ],
  },

  /* ---------- 组阁：公布会（→done） ---------- */
  reorgDone: {
    label: "组阁 · 公布会",
    pages: st => [
      { nar: true, t: "公布会定在星梦剧院正门大厅——所有队长到场，名单贴在整面墙上。念到名字的孩子从队伍区走向新的队伍区，掌声一阵接一阵。有人笑着落泪，有人沉默着整理新队服的领口。" },
      { s: "王子杰", cls: "speaker-wangzj", t: "（站在人群最后，看完整个流程，走的时候在你肩上按了一下）五年了，这条河第一次敢对自己动刀。动得成，下个五年还是头部的；动不成……不，我信你动得成。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（收着散场的椅子，轻声）总监，你知道刚才谁哭得最凶吗？不是被调走的孩子——是那些被选中当上队长、队副的。她们接过的不是名头，是几十个人的两年。" },
      { nar: true, t: "（★主线一「全团大重组」达成：新编制名单公布，全团组阁落地。士气+5 热度+5。）" },
    ],
  },

  /* ---------- 复刻《双面偶像》：立项（选定队伍后，0→1） ---------- */
  smStart: {
    label: "《双面偶像》复刻 · 立项",
    pages: st => [
      { nar: true, t: "广州寄来的包裹在排练厅拆开：道具清单三页、控台点位图两卷、还有一本写满批注的排练笔记——扉页写着「给上海的同行：这个舞台值得被更多人看到」。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（翻着点位图）台深、吊杆、升降位，上海剧场都要按广州的图纸改。这支承办队伍肩上的担子不轻——队伍的平均实力，直接决定复刻成色。总监，接下来的排练，就看她们的了。" },
      { nar: true, t: "（复刻工程立项完成。下一步：排练——需资金≥40万，投入40万。）" },
    ],
  },

  /* ---------- 复刻：排练（1→2，需资金≥40，投入40） ---------- */
  smRehearsal: {
    label: "《双面偶像》复刻 · 排练",
    pages: st => {
      const avg = Game.avgTeamPwr(st, st.sm18.team);
      return [
        { nar: true, t: "排练厅里，" + st.sm18.team + " 的姑娘们对着广州发来的录像一个八拍一个八拍地抠。控台的音响师两头连线，把广州现场的声音一段一段发过来对。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（看完一整轮连排，在笔记本上写下什么）队伍平均实力 " + avg + "——这个底子，配上《双面偶像》的编排，首演值得期待。（排练完成，月末进行首演验收。）" },
        { nar: true, t: "（排练完成。下一步：首演验收。）" },
      ];
    },
  },

  /* ---------- 复刻：首演验收（2→done） ---------- */
  smDebut: {
    label: "《双面偶像》复刻 · 首演",
    pages: st => {
      const avg = Game.avgTeamPwr(st, st.sm18.team);
      const great = avg >= 30;
      return [
        { nar: true, t: great
          ? "首演当晚，全场快门声就没停过——广州的灯光设计在上海的剧场里一分不差地亮起，最后一个定格动作落下时，台下喊的不是安可，是「GNZ48」三个字被喊了三遍。"
          : "首演落幕。舞台完整地立住了，个别衔接处还能看出青涩——但台下的广州后援会举着灯牌喊「常来」，这条河的两端，第一次同唱一首歌。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（后台，把两束花并排放在一起）一束是广州送来的，一束是今晚观众送的。总监，原创的舞台跨过了长江——这句话，值得写进年报第一页。（热度+" + (great ? 10 : avg >= 22 ? 7 : 4) + " 士气+4）" },
        { nar: true, t: "（★主线四「复刻《双面偶像》」达成。）" },
      ];
    },
  },

  /* ---------- 选秀：封闭集训（1→2，需资金≥30，投入30） ---------- */
  showCamp: {
    label: "选秀备战 · 封闭集训",
    pages: st => [
      { nar: true, t: "基地大门关上的那一刻，十几个孩子的手机统一上交。声乐、舞蹈、镜头表现三线并进——课程表贴在墙上，从六点半排到深夜十一点。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（隔着门缝看了一眼）外面的人管这叫「选秀集训」，里面的人管这叫「把五年的家底亮出来」。总监，镜头一开，她们代表的就是这条河的全部家底。" },
      { nar: true, t: "（封闭集训完成。下一步：出征录制。）" },
    ],
  },

  /* ---------- 选秀：首轮录制收官（2→done） ---------- */
  showAir: {
    label: "选秀备战 · 首轮录制",
    pages: st => [
      { nar: true, t: "首轮录制收官。节目播出当晚，「丝芭系」五个字上了热搜——观众这才发现，这支养成系团体里的孩子，开口是稳的，跳舞是齐的，镜头前是敢看镜头的。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（把手机递过来）三个品牌昨晚连夜发来合作意向——「练过五年的人，眼神不一样。」总监，这一趟出征，值了。（热度+12 商务预付+40万）" },
      { nar: true, t: "（★主线五「备战鹅厂选秀」达成：首轮录制收官。）" },
    ],
  },

  /* ---------- 葛佳慧个人专辑（album18 场景） ---------- */
  albumOut: {
    label: "葛佳慧 · 个人专辑发行",
    pages: st => [
      { nar: true, t: "录音棚的灯亮了整整一个月。《给梦想的回信》——专辑名字是她自己定的：「去年您说给我一个舞台，这张专辑就是我寄给那个约定的回信。」" },
      { s: "葛佳慧", cls: "", t: "（拿到母盘那天，眼睛有点红）总监，八期生的首秀公演迟迟没来的时候，我以为我的偶像生涯就是等。是您把「等」改成了「做」。这张专辑里有首歌叫《第十一月的信》，写给去年十一月那间办公室。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（在发行单上签了字）音乐企划，兑现。这条河欠谁的东西，就得还谁——这个规矩，从今年立住。（热度+6 士气+4，葛佳慧人气+6 羁绊+10）" },
      { nar: true, t: "（★2017「gejiahui17=promise」回收完成：个人专辑《给梦想的回信》发行。）" },
    ],
  },
};

/* ---------- 总选连霸升堂事件（引擎结算后调用；top1 动态） ---------- */
STORY.hallAscend18 = st => [
  { nar: true, t: "第五届总决选的彩带还飘在空中——连续两届第一的名字，第二次被刻在了那面墙上。\n\n荣誉殿堂的升堂仪式在子夜举行。没有喧哗的媒体，只有员工、队友，和一座属于她的奖杯复制件。" },
  { s: "叶盛", cls: "speaker-yesheng", t: "（念完授勋词，把殿堂徽标别在她胸前）连续两届总决选第一名——荣誉殿堂，迎你入堂。从今晚起，这个舞台记住了你的名字，不是一年，是永远。" },
  { s: "{name}", cls: "speaker-me", t: "「这条河会继续往前流。但殿堂会替所有人记得：有人曾在这里，连续两年，站在最高的地方。」" },
  { nar: true, t: "（★荣誉殿堂：连霸升堂完成。此后她不再参加总选举。）" },
];

/* ========================================================================
   三、月度脚本事件（monthly18）
   ======================================================================== */

/* 【主线②】预备生汇报公演（共享事件对象，定义后逐月挂载——勿写成字面量内自引用）。
   候选由 engine.prepStageCandidates 确定性生成（本部 PREP + 分团预备生，含分团上调
   通道）：pages 与 choices.effect 均取加权首位，指向同一位成员。
   总监定队升格：SII / NII / HII / X 或留任观察。 */
const prepEv18 = {
  id: "m_prep_stage18",
  title: "预备生汇报公演",
  gate: s => Game.prepStageCandidates(s).length > 0,
  pages: s => {
    const star = Game.prepStageCandidates(s)[0];
    const fromBranch = star.status === "branch";
    return [
      { nar: true, t: "每月一次的预备生汇报公演如期开演。舞台总监马跃站在侧台盯完整场，在本子上圈了一个名字——" + star.name + "（" + (fromBranch ? star.branchTeam + "预备生" : "预备生") + "）。" },
      { s: "马跃", cls: "", t: "（演出结束，拿着记录本来找你）总监，公演我盯了一个月，这个孩子的进步是断层的：站姿、走位、开口都不说了——她缺的不是能力，是一个正式的位置。按新制度，表现优异的预备生由总监定队。她怎么安排，您定。" },
      { nar: true, t: (fromBranch
        ? "（她来自" + star.branchTeam + "——上调本部是组阁年才有的通道，升格后人气与羁绊都会上一个台阶。）"
        : "（预备生升格入队后，人气与羁绊将获得提升。）") },
    ];
  },
  choices: [
    { label: "升格入 Team SII", hint: "人气与羁绊提升（分团上调加成更多）",
      tag: "prepStage18", value: "SII",
      effect: st => { const m = Game.prepStageCandidates(st)[0]; return Game.promotePrep18(m.id, "SII").text; } },
    { label: "升格入 Team NII", hint: "人气与羁绊提升",
      tag: "prepStage18", value: "NII",
      effect: st => { const m = Game.prepStageCandidates(st)[0]; return Game.promotePrep18(m.id, "NII").text; } },
    { label: "升格入 Team HII", hint: "人气与羁绊提升",
      tag: "prepStage18", value: "HII",
      effect: st => { const m = Game.prepStageCandidates(st)[0]; return Game.promotePrep18(m.id, "HII").text; } },
    { label: "升格入 Team X", hint: "人气与羁绊提升",
      tag: "prepStage18", value: "X",
      effect: st => { const m = Game.prepStageCandidates(st)[0]; return Game.promotePrep18(m.id, "X").text; } },
    { label: "升格入 Team FT", hint: "新成立的队伍正需要新鲜血液（人气与羁绊提升）",
      tag: "prepStage18", value: "FT",
      gate: st => !!st.flags.ftFormed,   // 组阁编制会后 FT 成立，预备生亦可升入
      effect: st => { const m = Game.prepStageCandidates(st)[0]; return Game.promotePrep18(m.id, "FT").text; } },
    { label: "继续留任预备生观察", hint: "暂不升格（下月再议）",
      tag: "prepStage18", value: "stay",
      effect: () => "你在汇报表上写下「继续观察」。马跃点点头：「下个月她要是还这么稳，您可就不好说了。」" },
  ],
};

STORY.monthly18 = {
  /* ---------- 1月：交接周 + 组阁专班 + 张怡的请求 + 预备生公演推行 ---------- */
  1: [
    {
      id: "m1_18_handover",
      title: "1月 · 交接周",
      pages: st => [
        { s: "叶盛", cls: "speaker-yesheng", t: "先交个底：去年双团落地、原创上台，家底比前年厚了不止一圈——但组阁这一刀下去，全团从安心期进入震荡期，士气和人心，是今年最贵的两样东西。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "还有件事得提前说：新来的舞台总监马跃，人是从选秀节目组挖来的，最懂镜头前的那套规矩。他提了个「预备生汇报公演」制度——每月让预备生上台轮一遍，表现优异的，当场定队升格。他说：「预备生不是库存，是期货。」" },
        { nar: true, t: "你把台历翻到 1 月的第一页。组阁、公演、总选、大赏——2018 年的关键词只有两个字：重排。" },
      ],
    },
    {
      /* 【主线①前情】组阁专班成立 */
      id: "m1_18_reorg_kick",
      title: "1月 · 组阁专班",
      gate: st => !st.flags.reorg18Done,
      pages: st => [
        { nar: true, t: "组阁专班成立。运营部把全团非殿堂成员的资料按「人气 / 实力 / 队伍黏性」三个维度重排了一遍——五支队伍的排布图挂在墙上，红色箭头画满了可能的流向。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "专班的第一份备忘录只有一句话：「组阁不是洗牌，是把对的人放到对的灯下。」总监，方案研讨随时可以启动——启动了，就没有回头路了。" },
      ],
    },
    {
      /* 【主线①关键抉择】张怡的请求：保留/取消 Team XII。
         gate 加 decisions.xiiKeep18 == null：快速通道补选窗已预选去留时自动跳过；
         若玩家先于 1 月月末启动组阁行动（stage≠0），编制会弹窗会兜底补问。 */
      id: "m1_18_zhangyi",
      title: "1月 · 张怡的请求",
      gate: st => st.reorg18.stage === 0 && st.decisions.xiiKeep18 == null,
      pages: st => [
        { nar: true, t: "晚上八点，张怡在办公室门口站了很久才敲门。她是 XII 的老队长——这支全部由五期生组成的队伍，从预备生时代一路并肩走到今天。" },
        { s: "张怡", cls: "", t: "总监，我知道组阁的规矩，我也不是来求情的。我只是想替 XII 的三十五个孩子问一句——能不能，留下 XII？\n\n我们知道自己的名字不响亮，知道这五年的成绩单不算好看。可是队徽是她们自己设计的，队歌是她们自己写的。别的队打散了还是「SII」「NII」，名字都在——XII 打散了，就什么都没有了。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（在旁边低声）总监，我提醒一句：保留 XII，组阁就多一步编制确认——四个队的活变成五个队。但她说得也没错，有些东西打散了，是真的找不回来。" },
      ],
      choices: [
        { label: "「XII 保留。名字我来保，成绩你们自己挣。」", hint: "保留 XII 编制：组阁多一步编制确认；士气+4",
          tag: "xiiKeep18", value: "keep",
          effect: st => { st.flags.xiiKept18 = true; st.morale = Math.min(100, st.morale + 4); return "张怡的眼泪当场就下来了。她起身鞠躬，鞠得很深：「XII 全队三十五个人，记总监这一天。」\n\n消息传回 XII 排练室的时候，据说整层楼都在尖叫。（决策已登记：xiiKeep18=keep——组阁将包含 XII 编制确认，多一步。）"; } },
        { label: "「XII 的名字停在最好的时候。孩子们，往前走。」", hint: "取消 XII 编制：组阁三步完成；资金+20",
          tag: "xiiKeep18", value: "dissolve",
          effect: st => { st.flags.xiiKept18 = false; st.money += 20; return "张怡沉默了很久，最后点了点头：「……我明白了。谢谢您没有敷衍我们，给了我一个当面听答案的机会。」\n\n她走的时候背影很直。第二天，XII 的排练室照常亮灯——只是练习结束后的闲聊，比往常安静了许多。（决策已登记：xiiKeep18=dissolve——组阁三步完成，省下的编制预算折合资金+20万。）"; } },
      ],
    },
    /* 【主线②】预备生汇报公演（1月起每月挂载） */
    prepEv18,
  ],

  /* ---------- 2月：九期生入队 + 大组阁实施月 ---------- */
  2: [
    {
      /* 【史实锚点】2018-02-03 九期生 12 人公布（与首次大组阁同日） */
      id: "m2_18_gen9",
      title: "2月 · 九期生公布",
      gate: st => true,
      pages: st => [
        { nar: true, t: "二月三号，两份公告同天发出：一份是全团大组阁的实施方案，一份是九期生十二人的名单。官博评论区有人写道：「一边打散重来，一边有新人排队进来——这个团，是真的打算干长久的。」" },
        { s: "马跃", cls: "", t: "（把九期生的资料摆成一排）十二个孩子，下个月开始进汇报公演的轮换池。总监，组阁年入团的孩子是幸运的——她们一进河，就能看见这条河敢于重排自己的样子。" },
        { nar: true, t: "（名单更新：陈盼、李美琪、李星羽、李玉倩、王溪源、王欣颜甜甜、杨令仪、杨美琪、张茜、张馨月、周诗雨、朱小丹——以预备生身份加入本部。）" },
      ],
    },
    {
      id: "m2_18_reorg_month",
      title: "2月 · 组阁实施月",
      gate: st => !st.flags.reorg18Done,
      pages: st => [
        { nar: true, t: "全团的目光都聚在组阁进度上。走廊里、排练室、剧场后 台，讨论的都只有一件事：名单什么时候出？我会去哪支队伍？" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（提醒）组阁的动作越早落地，震荡期越短。专班的流程是——方案研讨、分团协调" + (st.flags.xiiKept18 ? "、XII 编制确认" : "") + "，走完之后名单进终审；编制会定在 3 月末，九期生入队后全员一并编排。" },
      ],
    },
    {
      /* 【2018 通用·小分队】7SENSES 的成功 → 公司决定继续小分队模式：HO2（2人）+ BlueV（5人）。
         tag units18：vote（粉丝打投——热度+4，HO2/BlueV 按史实名单成军）/
                      pick（公司选取——链式解锁两个点将窗，成员由玩家指定）。
         史实名单（snh48wiki 档案考据 tmp/research/careers3.json，2018-02-02 成军）：
         HO2 = 冯薪朵、陆婷；BlueV = 李宇琪、莫寒、孙芮、万丽娜、吕一。 */
      id: "m2_18_units",
      title: "2月 · 小分队计划",
      gate: st => !st.decisions.units18,
      pages: st => [
        { nar: true, t: "《星梦学院》的招商简报里夹着一页加粗的标题：「7SENSES 模式，可复制」。去年的小分队拿下了内娱舞台与海外市场——集团尝到了甜头，决定再成两支小分队：双人组 HO2，五人组 BlueV。" },
        { s: "王婧", cls: "speaker-wangjing", t: "（把两套方案摆在桌上）选人方式，集团让你拍板。方案一，粉丝打投——粉丝全票决定名单，打投的热度正好替选秀预热；方案二，公司选取——名单由公司定，也就是由你定。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（低声补充）打投就是让粉丝替我们上热搜——选秀前夜，热度就是弹药。公司选取则稳：谁该被镜头看到，您心里有一杆秤。两支小分队，一共七个位置。" },
      ],
      choices: [
        { label: "方案一：粉丝打投定名单", hint: "热度+4 士气+2（选秀预热）；HO2/BlueV 按粉丝投票结果成军",
          tag: "units18", value: "vote",
          effect: st => {
            const HO2 = ["冯薪朵", "陆婷"];
            const BLUEV = ["李宇琪", "莫寒", "孙芮", "万丽娜", "吕一"];
            st.decisions.unitsHO2 = HO2.slice();
            st.decisions.unitsBlueV = BLUEV.slice();
            for (const n of HO2.concat(BLUEV)) {
              const m = st.members.find(x => x.name === n);
              if (m && m.status !== "left") {
                m.pop = Math.min(100, (m.pop || 0) + 3);
                m.bond = Math.min(100, (m.bond || 0) + 3);
                m.note = (m.note ? m.note + "；" : "") + (HO2.indexOf(n) >= 0 ? "SNH48小分队HO2成员（粉丝打投成军）" : "SNH48小分队BlueV成员（粉丝打投成军）");
              }
            }
            st.heat = Math.min(100, st.heat + 4);
            st.morale = Math.min(100, st.morale + 2);
            return "打投通道开启，粉圈连夜刷起了话题——七天后，HO2 与 BlueV 的名单随投票结果一并公布：HO2，冯薪朵、陆婷；BlueV，李宇琪、莫寒、孙芮、万丽娜、吕一。官宣微博转发破十万，评论区有人写道：「选秀还没开始，这条河已经热起来了。」\n\n（决策已登记：units18=vote。热度+4 士气+2，七人小分队成军——粉丝的选择，和史实写在了同一行。）";
          } },
        { label: "方案二：公司选取定名单", hint: "热度+2；两支小分队共七个位置由你亲自点将（选中者人气+5 羁绊+5）",
          tag: "units18", value: "pick",
          effect: st => { st.heat = Math.min(100, st.heat + 2);
            return "你在方案二上落了笔：「小分队的名单，公司来定。」综艺部连夜搭起评选流程——HO2 两个位置、BlueV 五个位置，名单由总监亲自圈定。（决策已登记：units18=pick。热度+2——接下来，该点将了。）"; } },
      ],
    },
    {
      /* 【小分队·公司选取①】HO2 双人点将（链式解锁：units18=pick 后触发；pickMode="ho2pick"） */
      id: "m2_18_units_ho2",
      title: "2月 · HO2 名单",
      gate: st => st.decisions.units18 === "pick" && !st.decisions.unitsHO2,
      pages: st => [
        { nar: true, t: "HO2——双人小分队，走声乐与舞台表现力的路线。两个位置，一拍即合也好，互补长短也罢，名单在你笔下。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把全团名册翻开）总监，双人组合最考验默契——谁和谁站在一起，画面就先赢了一半。" },
      ],
      choices: [
        { label: "圈定 HO2 双人名单", hint: "选中二人：人气+5 羁绊+5（小分队成军曝光）",
          pickMode: "ho2pick" },
      ],
    },
    {
      /* 【小分队·公司选取②】BlueV 五人点将（链式解锁：HO2 定盘后触发；pickMode="bluevpick"） */
      id: "m2_18_units_bv",
      title: "2月 · BlueV 名单",
      gate: st => st.decisions.units18 === "pick" && !!st.decisions.unitsHO2 && !st.decisions.unitsBlueV,
      pages: st => [
        { nar: true, t: "HO2 的名单已经敲定。接下来是五人组 BlueV——唱跳、综艺感、镜头表现，五个位置五种可能。" },
        { s: "王婧", cls: "speaker-wangjing", t: "（看名单）公司选取的好处就在这儿：每个位置都按企划需要来。总监，剩下五个名字，也由你来定。" },
      ],
      choices: [
        { label: "圈定 BlueV 五人名单", hint: "选中五人：人气+5 羁绊+5（小分队成军曝光）",
          pickMode: "bluevpick" },
      ],
    },
    prepEv18,
  ],

  /* ---------- 3月：组阁编制会 + 新体制首演季（FT 新体制锚点） ---------- */
  3: [
    {
      /* 【主线①】组阁编制会（筹备完毕 reorg18.ready 后于 3 月末召开——九期生 2 月
         入队，全员一并编排；pickMode="reorg18" 转交 UI 两阶段弹窗，落地在
         Game.applyReorg18。3 月后才走完筹备的由行动当场转交兜底。） */
      id: "m3_18_reorg_final",
      title: "3月 · 组阁编制会",
      gate: st => st.reorg18.ready && !st.reorg18.done,
      pages: st => [
        { nar: true, t: "会议室的长桌铺开了全团名册——老将、中坚、上个月刚进河的九期生，一个名字都不缺。墙上贴着组阁专班钉了两个月的红箭头图，现在，箭头该落成实线了。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把终审名单的封套放到你面前）总监，专班能做的都做完了——但名单的最后一笔，只能您来落。每队十三到二十人，主力十六；本部编不进队伍的孩子可以降入预备生，最多十六人；分团有底子的孩子，可以上调；预备生池里的孩子——包括上个月刚进河的九期生——也在这张名册上，谁都可以直接定队。" },
        { s: "马跃", cls: "", t: "（补了一句）落笔前想想清楚：降入预备生的孩子，羁绊会受伤；上调的孩子，人气和羁绊都会上台阶；预备生直接定队，是组阁年才有的快车道。这个秤，在您手里。" },
      ],
      choices: [
        { label: "开幕——进入名单编排", hint: "逐人定队（每队13~20人，预备生≤16人，九期生一并参编）→ 队长队副任命 → 公布新编制",
          pickMode: "reorg18",
          effect: () => "你在终审名单的封套上签了字。编制会正式开幕——全团名册投上幕布，预备生池也在其中，从这一刻起，2018 的队伍排布由你落笔。" },
      ],
    },
    {
      id: "m3_18_newera",
      title: "3月 · 新体制首演季",
      gate: st => !!st.flags.reorg18Done,   // 编制会落地后播放（编制会在本链先行召开）
      pages: st => [
        { nar: true, t: "组阁之后的首演季开票即热——不管名单怎么排，「新体制第一演」五个字本身就足够话题。剧场门口的黄牛第一次把「队徽」炒出了差价：有人赌新的排布会捧出新的角儿。" },
        { s: "马跃", cls: "", t: "（在侧台架了三台机位）新队伍的第一演，镜头要拍下来。这些素材将来剪进纪录片的开篇——「2018年春，她们重新学会了彼此的名字。」" },
      ],
    },
    prepEv18,
  ],

  /* ---------- 4月：鹅厂选秀启动 + 葛佳慧专辑（承诺线） ---------- */
  4: [
    {
      /* 【主线⑤】选秀官宣 */
      id: "m4_18_show_kick",
      title: "4月 · 鹅厂选秀官宣",
      gate: st => !st.show18.done,
      pages: st => [
        { nar: true, t: "腾讯视频的选秀节目正式官宣。全网都在猜各家会派谁出征——而这条河的名单，握在你手里。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把节目章程放在你桌上）至少派十一人，封闭集训一个月，首轮录制在年中。总监，这一仗打好了，「养成系」三个字就能翻面成「实力系」。点将名单，您来定。" },
      ],
    },
    {
      /* 【2017 承诺回收】葛佳慧专辑（gejiahui17=promise 专属；行动 album18 亦可随时发行） */
      id: "m4_18_album_hint",
      title: "4月 · 录音棚的灯",
      gate: st => st.decisions.gejiahui17 === "promise" && !st.show18.album && !st.show18.done,
      pages: st => [
        { nar: true, t: "路过录音棚，听见里面在改和弦。葛佳慧的demo已经写到了第四版——去年十一月那份备忘录上的承诺，她一个音一个音地记着。" },
        { s: "葛佳慧", cls: "", t: "总监，专辑的十首歌我都写完了。制作费要四十万——我知道今年预算紧，可如果您点头，这就是八期生交给这条河的第一份答卷。" },
      ],
    },
    {
      /* 【复刻路线专属①】红白歌会·中国预赛（日方联络）：定承办地。
         复刻路线（jpMode=replicate）与日方的合作情分走到 2018 的回响——
         配合 SNH48 备战选秀，今年红白歌会专设中国预赛，表现优异者赴日参加年末决赛。 */
      id: "m4_18_kohaku",
      title: "4月 · 来自东京的联络",
      gate: st => Game.isReplicate(st) && !st.decisions.kohaku18,
      pages: st => [
        { nar: true, t: "一封从东京发来的联络函在上午十点准时抵达——落款是 NHK 红白歌会制作组，抄送 AKB48 方面。函件的开头写着一行加粗的字：「致老朋友」。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（念完联络函，抬眼看您）总监，今年红白歌会专门开设了中国预赛——就是为了配合我们备战选秀的计划。预赛放在中国办，我们的成员都能报名；预赛里表现好的人，年底就能站上东京的决赛舞台。" },
        { s: "王婧", cls: "speaker-wangjing", t: "（翻着附页的承办条件）这是复刻路线走到第四年，日方给出的最大一份情分。承办地由我们自己定——本部，或者交给哪家分团。另外，出征名单五人，全团皆可点将。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（压低声音）这是全日本的镜头。承办地落在哪，哪里的灯就会亮一整年——总监，这一笔要好好掂量。" },
      ],
      choices: [
        { label: "预赛落地本部 · 上海星梦剧院", hint: "资金-30万 热度+8（最大的舞台，红白制作组亲临监场）",
          tag: "kohaku18", value: "hq",
          effect: st => { st.money -= 30; st.heat = Math.min(100, st.heat + 8);
            return "你把承办地圈在了上海。星梦剧院正门挂起红白两面旗帜——组阁年的第一个「国家级项目」，落在了这条河的心脏上。（决策已登记：kohaku18=hq。资金-30万，热度+8。）"; } },
        { label: "预赛落地分团 · 广州 GNZ48", hint: "资金-20万 热度+5；GNZ48 在册成员羁绊+3",
          tag: "kohaku18", value: "GNZ48",
          effect: st => { st.money -= 20; st.heat = Math.min(100, st.heat + 5);
            for (const m of st.members) if (m.status === "branch" && m.branchTeam === "GNZ48") m.bond = Math.min(100, (m.bond || 0) + 3);
            return "你把承办地圈在了广州。《双面偶像》的娘家再一次站上全国镜头——广州的孩子们在更衣室里把队徽擦了又擦。（决策已登记：kohaku18=GNZ48。资金-20万，热度+5，GNZ48 在册成员羁绊+3。）"; } },
        { label: "预赛落地分团 · 北京 BEJ48", hint: "资金-20万 热度+5；BEJ48 在册成员羁绊+3",
          tag: "kohaku18", value: "BEJ48",
          effect: st => { st.money -= 20; st.heat = Math.min(100, st.heat + 5);
            for (const m of st.members) if (m.status === "branch" && m.branchTeam === "BEJ48") m.bond = Math.min(100, (m.bond || 0) + 3);
            return "你把承办地圈在了北京。首都的镜头对准了这条河的北支流——BEJ48 的孩子们说，这是她们成立以来最亮的一盏灯。（决策已登记：kohaku18=BEJ48。资金-20万，热度+5，BEJ48 在册成员羁绊+3。）"; } },
        { label: "预赛落地分团 · 重庆 CKG48", hint: "资金-20万 热度+5；CKG48 在册成员羁绊+3",
          tag: "kohaku18", value: "CKG48", gate: st => !!(st.branch17 && st.branch17.ckgOpen),
          effect: st => { st.money -= 20; st.heat = Math.min(100, st.heat + 5);
            for (const m of st.members) if (m.status === "branch" && m.branchTeam === "CKG48") m.bond = Math.min(100, (m.bond || 0) + 3);
            return "你把承办地圈在了重庆。开业不过半年的新星梦剧院迎来第一个全国级项目——重庆的孩子们说，山城的灯光这次要照到东京去。（决策已登记：kohaku18=CKG48。资金-20万，热度+5，CKG48 在册成员羁绊+3。）"; } },
        { label: "预赛落地分团 · 沈阳 SHY48", hint: "资金-20万 热度+5；SHY48 在册成员羁绊+3",
          tag: "kohaku18", value: "SHY48", gate: st => !!(st.branch17 && st.branch17.shyOpen),
          effect: st => { st.money -= 20; st.heat = Math.min(100, st.heat + 5);
            for (const m of st.members) if (m.status === "branch" && m.branchTeam === "SHY48") m.bond = Math.min(100, (m.bond || 0) + 3);
            return "你把承办地圈在了沈阳。东北的孩子们把「红白」两个字写在了剧场外的雪墙上——沈阳星梦剧院的灯，这次要亮给全日本看。（决策已登记：kohaku18=SHY48。资金-20万，热度+5，SHY48 在册成员羁绊+3。）"; } },
      ],
    },
    {
      /* 【复刻路线专属②】红白预赛出征名单：全团点将五人（pickMode="kohaku5" →
         UI.showKohakuPicker → engine.setKohakuSquad；链式惰性评估——上一事件选定承办地后本事件解锁） */
      id: "m4_18_kohaku_pick",
      title: "4月 · 红白预赛 · 出征名单",
      gate: st => Game.isReplicate(st) && !!st.decisions.kohaku18 && !st.decisions.kohaku18Squad,
      pages: st => [
        { nar: true, t: "承办地敲定的当天下午，红白制作组的回函就到了——效率高得近乎迫不及待。附页是一张空白的五人名单，抬头印着两国国旗。" },
        { s: "王婧", cls: "speaker-wangjing", t: "（把名单放在你桌上）全团在册成员都可以点——本部、分团一视同仁。预赛是舞台也是考卷，表现最好的人，年底代表这条河去东京唱决赛。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（小声）和选秀的点将并不冲突——两边都是镜头，都有成长。但这五个人会提前站上「国家级」的舞台，总监，谁去，谁就先亮半年。" },
      ],
      choices: [
        { label: "从全团点将五人，出征红白中国预赛", hint: "被选中者：羁绊+8 人气+3（预赛舞台曝光；表现优异者年末赴日参加决赛）",
          pickMode: "kohaku5" },
      ],
    },
    {
      /* 【复刻路线专属②】北原里英毕业（2017 玛莉亚东京路线派遣的兼任成员，v0.11.6）。
         tag kitahara18：tokyo（回日本举办——次月她效力队伍点将五人赴日）/
                        shanghai（在上海举办——次月星梦剧院毕业公演）。
         两分支日方均表态：今年暂时不派成员兼任，年末有新企划（12月 TEB48 提议的伏笔）。
         gate 要求北原里英在册——快速通道复刻线无 2017 派遣卡，本事件不触发。 */
      id: "m4_18_kitahara_grad",
      title: "4月 · 北原里英的毕业宣布",
      gate: st => Game.isReplicate(st) && !st.decisions.kitahara18 &&
        st.members.some(m => m.name === "北原里英" && m.status === "active"),
      pages: st => {
        const k = st.members.find(m => m.name === "北原里英" && m.status === "active");
        return [
          { nar: true, t: "东京发来的公报放在你桌上：AKB48 成员北原里英宣布毕业。同一天，她把一封手写信交到了你手里——兼任这一年，她的柜子上早就摆满了孩子们送的礼物。" },
          { s: "北原里英", cls: "", t: (k && k.team ? "（信是用中文写的，字迹工整）总监，谢谢 Team " + k.team + " 的这一年。毕业公演——" : "（信是用中文写的，字迹工整）总监，谢谢这一年的照顾。毕业公演——") + "我想问问您的意思：它是回秋叶原办，还是，留在上海办？" },
          { s: "叶盛", cls: "speaker-yesheng", t: "（把日方随函附来的备忘录递过来）AKS 那边提前透了句话：北原毕业之后，今年暂时不派成员过来兼任了——「年末，有一个新企划想跟上海谈。」这话没头没尾，您先记着。" },
        ];
      },
      choices: [
        { label: "送她回东京——在 AKB48 剧场谢幕", hint: "次月：她效力队伍点将五人赴日参加毕业公演（被选中者羁绊+10 人气+3）；日方今年暂不派成员兼任",
          tag: "kitahara18", value: "tokyo",
          effect: st => "你在回函上盖了章：「她是 AKB48 的孩子，谢幕该回秋叶原——上海这边的舞台，我们出人送她。」东京很快回函确认了日期，并附了一行字：今年暂时不派成员兼任了；年末，有一个新企划想跟上海当面谈。\n\n（决策已登记：kitahara18=tokyo。次月：北原里英效力队伍点将五人，赴日参加毕业公演。）" },
        { label: "把毕业公演留在上海——星梦剧院谢幕", hint: "次月：星梦剧院毕业公演（热度+2 士气+2）；日方今年暂不派成员兼任",
          tag: "kitahara18", value: "shanghai",
          effect: st => "你批了：「她这一年站的是星梦剧院的台口——谢幕也该在这里。」东京回函表示尊重，末尾同样写着那句：今年暂时不派成员兼任了；年末，有一个新企划想跟上海当面谈。\n\n（决策已登记：kitahara18=shanghai。次月：星梦剧院毕业公演。）" },
      ],
    },
    prepEv18,
  ],

  /* ---------- 5月：总选启动 ---------- */
  5: [
    {
      id: "m5_18_ge_kick",
      title: "5月 · 总决选启动",
      pages: st => [
        { s: "叶盛", cls: "speaker-yesheng", t: "七月底，「砥砺前行」第五届总决选——组阁之后的第一届总选。去年登顶的那位" + (st.history.ge2017Top1 ? "（" + st.history.ge2017Top1 + "）" : "") + "若能连霸，荣誉殿堂就要迎来它的第二次升堂仪式。" },
        { s: "王子杰", cls: "speaker-wangzj", t: "（短信）组阁后的第一次大考。让市场看看：重新排布过的星阵，比原来更亮。" },
      ],
    },
    {
      /* 【2018 通用·阿吉】《星梦学院》第二季收官后的辞呈。
         tag aji18：release（允许辞职）/ ask（请求再留一年：基础50%留任，
         2017年1月与阿吉深聊过（ajiTalk=yes）提升至75%）。
         留任（flags.ajiStay18）→ 链式解锁《梦想演播厅》定盘事件；离开（flags.ajiLeft18）→ 卫视资源青黄不接。 */
      id: "m5_18_aji",
      title: "5月 · 阿吉的辞呈",
      gate: st => !st.decisions.aji18,
      pages: st => [
        { nar: true, t: "五月的第一个工作日，综艺部的灯亮到很晚——《星梦学院》第二季收官，收视率比第一季涨了四成。庆功宴的第二天，阿吉把一封辞职信放在了你桌上，信纸边角压得整整齐齐，像他的每一份策划案。" },
        { s: "阿吉", cls: "speaker-aji", t: "总监，两季《星梦学院》做下来，我能想到的、能做到的，都做到位了。家里那边……父母年纪大了，我想回去陪陪他们。这些年，谢谢您肯把预算划给我。\n\n（他把辞职信推过来，又轻轻按了一下）您别挽留得太用力——我怕我自己舍得下这条河，舍不得下你们。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（在你耳边，声音压得很低）总监，今年是备战选秀的关键年——各大平台的镜头半个都不会让。阿吉手里那张卫视与平台的资源图谱，是这条河最贵的隐形资产。公司说了，这个决定权，给您。" },
        { s: "王婧", cls: "speaker-wangjing", t: "（合上文件夹）人各有志，公司不强留。但你要是想留他——就把话说到他心坎里。（顿了顿）2017 年你刚来的时候，我看过你和他在会议室聊到后半夜——他那种人，认的是交情。" },
      ],
      choices: [
        { label: "人各有志——不要耽误了别人的发展，允许辞职", hint: "阿吉离职：热度-4 士气-2（卫视与平台资源青黄不接）",
          tag: "aji18", value: "release",
          effect: st => { st.flags.ajiLeft18 = true; st.heat = Math.max(0, st.heat - 4); st.morale = Math.max(0, st.morale - 2);
            return "你在辞职信上签了字，又亲手把信还给他：「星梦学院两季，做得漂亮。回去替我们看看外面的世界——这条河的门，一直开着。」\n\n阿吉走的那天，运营部把他的资源图谱复印了一份钉在公告板上。接手的同事说：图谱还在，可图谱背后那些「一个电话就能办」的人情，一时半会儿接不上。（决策已登记：aji18=release。热度-4 士气-2——卫视与平台的资源对接，青黄不接了。）"; } },
        { label: "「再留一年。选秀这一仗，我需要你。」", hint: "50%留任（2017年1月与阿吉深聊过：75%）——留任则由他主导《梦想演播厅》",
          tag: "aji18", value: "ask",
          effect: st => {
            const talked = st.decisions && st.decisions.ajiTalk === "yes";
            const p = talked ? 0.75 : 0.5;
            if (Math.random() < p) {
              st.flags.ajiStay18 = true;
              return "你把辞职信推了回去，只说了一句话：「再留一年。选秀这一仗，我需要你——这条河需要你。」\n\n阿吉沉默了很久，忽然笑了：「总监，您还记得去年那个半夜吗？行——就冲您这句话，再干一年。」\n\n（决策已登记：aji18=ask。" + (talked ? "2017年的交情起了作用——" : "") + "阿吉留任了。）";
            }
            st.flags.ajiLeft18 = true;
            st.heat = Math.max(0, st.heat - 4); st.morale = Math.max(0, st.morale - 2);
            return "你把辞职信推了回去：「再留一年。选秀这一仗，我需要你。」\n\n阿吉低着头看了那行字很久，最后还是把它轻轻推了回来：「总监，您留得住这份工作，留不住我爸妈的年纪。对不起。」\n\n（决策已登记：aji18=ask。他终究还是走了——热度-4 士气-2。）";
          } },
      ],
    },
    {
      /* 【阿吉留任追加】《梦想演播厅》定盘：接档《星梦学院》的团内竞演综艺（选秀预热）。
         链式解锁（flags.ajiStay18 由上一事件的选择落定）。
         tag ajiDream18：studio（重心演播厅）/ draft（重点选秀备战）。
         flags.dreamStage18 由引擎 advanceShow18 首轮录制时回收（studio：热度+6 / draft：出征成员羁绊+4 实力+2）。 */
      id: "m5_18_aji_dream",
      title: "5月 · 《梦想演播厅》定盘",
      gate: st => !!st.flags.ajiStay18 && !st.decisions.ajiDream18,
      pages: st => [
        { nar: true, t: "阿吉留任的第二天，综艺部的策划案就摆上了你的桌面——接档《星梦学院》的，是一档全新的团内竞演综艺：《梦想演播厅》。全程团内成员竞演，直接为鹅厂选秀预热。" },
        { s: "阿吉", cls: "speaker-aji", t: "（把策划案翻开第一页）总监，按综艺部的盘子，这档节目理论上该由我主导——两季《星梦学院》的班子都是现成的。但今年是选秀年，您的每一分资源都得花在刀刃上。所以——我的重心放哪儿，您定。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（低声）往「演播厅」押，就是往热度押——平台已经放话愿意预付；往「选秀」押，就是往那十一个孩子身上押——集训的每一个小时都金贵。总监，两条路都是好路，就看您今年最想要什么。" },
      ],
      choices: [
        { label: "把重心放在《梦想演播厅》的制作上", hint: "热度+8 资金+20 士气+2；选秀首轮录制时热度额外+6（综艺预热）",
          tag: "ajiDream18", value: "studio",
          effect: st => { st.flags.dreamStage18 = "studio"; st.heat = Math.min(100, st.heat + 8); st.money += 20; st.morale = Math.min(100, st.morale + 2);
            return "你把阿吉按回了综艺部的主控位。《梦想演播厅》官宣当天，平台把一笔预付款打了过来——「星梦学院」的原班人马，加这条河组阁后的第一档自研竞演，广告商排着队进场。（决策已登记：ajiDream18=studio。热度+8 资金+20 士气+2；节目播出的每一期，都会替选秀预热。）"; } },
        { label: "让阿吉把重点放在选秀备战上", hint: "士气+4；选秀首轮录制时出征成员羁绊+4 实力+2（资源全押集训）",
          tag: "ajiDream18", value: "draft",
          effect: st => { st.flags.dreamStage18 = "draft"; st.morale = Math.min(100, st.morale + 4);
            return "你和阿吉连夜把《梦想演播厅》的策划案改成了「选秀特辑」：节目只做一件事——把出征的孩子一个一个推到镜头前，把她们的实力磨到发光。\n\n「热度是别人给的，实力是自己的。」阿吉在策划案末页写下这句话，把它贴在了集训基地的门口。（决策已登记：ajiDream18=draft。士气+4；演播厅的全部资源，都会灌进选秀集训。）"; } },
      ],
    },
    {
      /* 【复刻路线专属②·东京路线】北原里英东京毕业公演：效力队伍点将五人赴日
         （pickMode="kitahara5" → UI.showKitaharaPicker → engine.kitaharaSend，
         五人羁绊+10 人气+3、热度+3；公演落幕北原里英毕业退团）。 */
      id: "m5_18_kitahara_send",
      title: "5月 · 来自东京的请柬·第二封",
      gate: st => Game.isReplicate(st) && st.decisions.kitahara18 === "tokyo" && !st.decisions.kitaharaSend &&
        st.members.some(m => m.name === "北原里英" && m.status === "active"),
      pages: st => {
        const k = st.members.find(m => m.name === "北原里英" && m.status === "active");
        return [
          { nar: true, t: "东京的请柬第二封送到了星梦剧院，还是那一笔一划的认真字迹：「5月中旬，我将在 AKB48 剧场举行毕业公演。这一年上海教给我的，我想在东京的舞台上，还给上海来的孩子们。」" },
          { s: "北原里英", cls: "", t: (k && k.team ? "（把请柬摆正）Team " + k.team + " 的孩子们" : "（把请柬摆正）孩子们") + "——愿意来五个吗？让东京的镜头看看，这一年我在这里，学到了什么、又被什么打动着。" },
          { s: "叶盛", cls: "speaker-yesheng", t: "（小声）和玛莉亚那次一样的规格——签证与行程日方全包。总监，这是全日本的镜头，这五个名字，值得好好挑。" },
        ];
      },
      choices: [
        { label: "从她效力队伍点将五人，赴东京送她", hint: "被选中者：羁绊+10 人气+3；热度+3（仅限其效力队伍在籍成员）",
          pickMode: "kitahara5" },
      ],
    },
    {
      /* 【复刻路线专属②·上海路线】北原里英星梦剧院毕业公演（两分支日方均在 4 月
         表态：今年暂不派成员兼任、年末有新企划） */
      id: "m5_18_kitahara_cn",
      title: "5月 · 星梦剧院的告别舞台",
      gate: st => Game.isReplicate(st) && st.decisions.kitahara18 === "shanghai" &&
        st.members.some(m => m.name === "北原里英" && m.status === "active"),
      pages: st => [
        { nar: true, t: "5月中旬，星梦剧院。北原里英的毕业公演——从她初登台时最拿手的日文歌，唱到她这一年学会的第一首中文歌，台下的灯牌一路亮到了出口。" },
        { nar: true, t: "安可之前，她把话筒架放低了一点，用中文说了很长的一段话，最后一句是：「这条河教会我的，比我的母语更快——以后，换我在东京替它应援。」\n\n次日，她启程回日本。兼任结束，合约体面终止。" },
      ],
      choices: [
        { label: "全体起立，送她谢幕", hint: "热度+2 士气+2；北原里英兼任结束离团",
          tag: "kitahara18CN", value: "farewell",
          effect: st => {
            const k = st.members.find(x => x.name === "北原里英" && x.status === "active");
            if (k) { k.status = "left"; k.note = "2018-05 AKB48毕业·兼任结束（毕业公演：上海）"; }
            st.heat = Math.min(100, st.heat + 2);
            st.morale = Math.min(100, st.morale + 2);
            return "灯牌亮到最后一秒。她朝观众席深深鞠躬，又转身朝全体成员鞠了一躬——「上海见，不，东京见。」\n\n（名单更新：北原里英 离团——兼任结束，体面毕业。热度+2 士气+2。）";
          } },
      ],
    },
    prepEv18,
  ],

  /* ---------- 6月：总选冲刺 ---------- */
  6: [
    {
      id: "m6_18_ge_strategy",
      title: "6月 · 总选冲刺会议",
      pages: st => [
        { s: "叶盛", cls: "speaker-yesheng", t: "总决选倒计时一个月。组阁后的新队籍刚刚刊印，打投组的名单要按新队伍重新核对——资源怎么分，老规矩，你说了算。" },
      ],
      choices: [
        { label: "集中火力：把资源押在人气最高者身上", hint: "冲冠概率大增，热度收益高，士气-6", tag: "geStrategy", value: "focus",
          effect: st => { st.geStrategy = "focus"; return "资源表格被重新排过：镜头、通告、物料，全部向头部倾斜。组阁后的第一次大考，有人想用第一名证明新队伍的成色。"; } },
        { label: "雨露均沾：让每个孩子都被看见", hint: "全团士气+8，羁绊提升，冲榜收益降低", tag: "geStrategy", value: "balance",
          effect: st => { st.geStrategy = "balance"; return "你把计划表摊开，给每一位参选成员都留了一页自己的方案。组阁年的总选，让所有新队伍都被看见，比一个名次更重要。"; } },
      ],
    },
    {
      /* 【2018 通用·史实锚点】《芸汐传》大爆（2018-06-25 爱奇艺独播，鞠婧祎主演）。
         文本按鞠婧祎是否荣誉殿堂在堂分叉（2017 总选夺冠=殿堂偶像 / 未升堂=成员）；
         出镜成员林思意、许佳琪、刘炅然、谢蕾蕾、邵雪聪获得加成——未升堂时鞠婧祎
         （主演）也享受加成。在册即加成（含分团在籍，如谢蕾蕾），离团跳过。 */
      id: "m6_18_yunxi",
      title: "6月 · 《芸汐传》开播",
      gate: st => !st.decisions.yunxi18 && st.members.some(m => m.name === "鞠婧祎" && m.status !== "left"),
      pages: st => {
        const jjy = st.members.find(m => m.name === "鞠婧祎" && m.status !== "left");
        const hall = !!(jjy && jjy.hall);
        return [
          { nar: true, t: (hall
            ? "六月末，由殿堂偶像鞠婧祎领衔主演的古装剧《芸汐传》在爱奇艺开播——上线三天，播放量破了十亿；上线两周，全网讨论度登顶。剧外的标签第一次盖过了「SNH48」这五个字母：这条河的孩子，扛起了自己的男主角时代。"
            : "六月末，由成员鞠婧祎领衔主演的古装剧《芸汐传》在爱奇艺开播——上线三天，播放量破了十亿；上线两周，全网讨论度登顶。剧外的标签第一次盖过了「SNH48」这五个字母：这条河的孩子，扛起了自己的女主角时代。") },
          { nar: true, t: "镜头往配角名单里数过去，全是这条河的自家人：林思意、许佳琪、刘炅然、谢蕾蕾、邵雪聪——一部戏，五张熟脸。官微连夜把剧照排成九宫格，转发在半小时内破了十万。" },
          { s: "叶盛", cls: "speaker-yesheng", t: "（把数据报表放到你桌上，语速比平时快）总监，这不是普通的热搜——是正剧出圈。影视部那边说了，趁剧还热着，五个出镜孩子的通告费都能往上报一报。怎么接这波，您定。" },
        ];
      },
      choices: [
        { label: "庆功与乘势宣传，一条龙安排上", hint: "出镜五人（林思意/许佳琪/刘炅然/谢蕾蕾/邵雪聪）人气+6 羁绊+3；热度+3；未升堂时鞠婧祎（主演）人气+8 羁绊+3",
          tag: "yunxi18", value: "hit",
          effect: st => {
            const CAST = ["林思意", "许佳琪", "刘炅然", "谢蕾蕾", "邵雪聪"];
            let n = 0;
            for (const nm of CAST) {
              const m = st.members.find(x => x.name === nm && x.status !== "left");
              if (m) {
                m.pop = Math.min(100, (m.pop || 0) + 6);
                m.bond = Math.min(100, (m.bond || 0) + 3);
                m.note = (m.note ? m.note + "；" : "") + "2018《芸汐传》出镜（剧集大爆）";
                n++;
              }
            }
            const jjy = st.members.find(x => x.name === "鞠婧祎" && x.status !== "left");
            const hall = !!(jjy && jjy.hall);
            if (jjy && !hall) {
              jjy.pop = Math.min(100, (jjy.pop || 0) + 8);
              jjy.bond = Math.min(100, (jjy.bond || 0) + 3);
              jjy.note = (jjy.note ? jjy.note + "；" : "") + "2018《芸汐传》主演（剧集大爆）";
            }
            st.heat = Math.min(100, st.heat + 3);
            return "庆功宴摆在剧组杀青的同一间酒店。灯牌、热搜、通稿三线齐发——影视部预估，剧的热度至少还能吃两个月。\n\n（决策已登记：yunxi18=hit。出镜成员 " + n + " 人在册加成（人气+6 羁绊+3）" + (hall ? "" : "，主演鞠婧祎人气+8 羁绊+3（未升堂，总选年正需要这股东风）") + "，热度+3。）";
          } },
      ],
    },
    prepEv18,
  ],

  /* ---------- 7月：总决选之夜（连霸升堂由引擎判定） ---------- */
  7: [
    {
      id: "m7_18_election",
      title: "7月末 · 第五届总决选",
      pages: st => [
        { nar: true, t: "总决选之夜，梅赛德斯奔驰文化中心。这座场馆上一次这么满，还是上一届。\n\n组阁之后的第一次总选——新队徽、新站位、新的应援色海洋。名单即将揭晓。" },
      ],
    },
  ],

  /* ---------- 8月：总选次日 + 夏日巡演 ---------- */
  8: [
    {
      id: "m8_18_summer",
      title: "8月 · 夏日巡演",
      pages: st => [
        { s: "叶盛", cls: "speaker-yesheng", t: "暑期巡演的报价来了。组阁之后这是第一次全团大规模出行——五城连跑，还是三城带集训，你定。" },
      ],
      choices: [
        { label: "连跑五城，商业收益拉满", hint: "资金+130 士气-10 热度+6", tag: "summerMode18", value: "tour",
          effect: st => { st.money += 130; st.morale = Math.max(0, st.morale - 10); st.heat = Math.min(100, st.heat + 6); return "五城巡演场场爆满，回程大巴上安静得可怕——所有人都累得睡着了。资金+130，热度+6，士气-10。"; } },
        { label: "只跑三城，巡演带集训", hint: "资金+70 训练度+10 全团实力+1", tag: "summerMode18", value: "compact",
          effect: st => { st.money += 70; st.train = Math.min(100, st.train + 10); Game.gainAllPwr(st, 1); return "三城巡演+随团集训，白天演出晚上抠动作。资金+70，训练度+10，全团实力+1。"; } },
      ],
    },
    prepEv18,
  ],

  /* ---------- 9月：大赏预算评审（预告） ---------- */
  9: [
    {
      id: "m9_18_rt_warn",
      title: "9月 · 大赏预算评审会（预告）",
      gate: st => true,
      pages: st => [
        { s: "王子杰", cls: "speaker-wangzj", t: "（把营收曲线放在你面前）年末金曲大赏的预算会下个月开。总监，今年是组阁年——大赏是新编制最好的亮相台，别让它缺席。" },
        { nar: true, t: "（提示：12月金曲大赏照常举行——10~12月是大赏筹备期，打铁趁热。）" },
      ],
      choices: [
        { label: "立军令状：大赏办成新编制的亮相台", hint: "士气+4", tag: "rtWarn18", value: "pledge",
          effect: st => { st.morale = Math.min(100, st.morale + 4); return "你在评审记录上写下军令状。全团都知道了这件事——新队伍的第一次大赏，谁都想站在最前排。士气+4。"; } },
        { label: "数据说话，先看三季度报表", hint: "无加减", tag: "rtWarn18", value: "data",
          effect: st => { return "你把三季度的收支表推了过去：「数据说话。」王子杰难得点头。一场没有硝烟的评审，散会了。"; } },
      ],
    },
    prepEv18,
  ],

  /* ---------- 10月：选秀收官 + 组阁半年考 ---------- */
  10: [
    {
      id: "m10_18_reorg_review",
      title: "10月 · 组阁半年考",
      gate: st => st.flags.reorg18Done,
      pages: st => [
        { nar: true, t: "组阁落地半年，董事会要一份「半年考」报告。数据摆上桌：新队伍的公演上座、周边销量、社媒活跃度——各项指标都在往上走。" },
        { s: "王子杰", cls: "speaker-wangzj", t: "（在报告上签了字）当时我说「动得成，下个五年还是头部的」。现在我可以把后半句删掉了。（热度+4 士气+3）" },
      ],
      choices: [
        { label: "（收下这份半年考的答卷）", effect: st => { st.heat = Math.min(100, st.heat + 4); st.morale = Math.min(100, st.morale + 3); return "散会后，你把那份贴满红色箭头的组阁排布图从墙上取了下来，折好，放进档案柜——「2018年，星阵重列」。热度+4，士气+3。"; } },
      ],
    },
    {
      id: "m10_18_sponsor",
      title: "10月 · 年度招商方向",
      pages: st => [
        { s: "叶盛", cls: "speaker-yesheng", t: "年度招商的两条路线谈到了最后一步：短单快结，还是长约绑内容。" },
      ],
      choices: [
        { label: "短单快结，落袋为安", hint: "资金+80 热度-2", tag: "sponsor18", value: "short",
          effect: st => { st.money += 80; st.heat = Math.max(0, st.heat - 2); return "三笔短单一周落定。资金+80。"; } },
        { label: "长约绑定，用内容换空间", hint: "资金+40 热度+5", tag: "sponsor18", value: "long",
          effect: st => { st.money += 40; st.heat = Math.min(100, st.heat + 5); return "两纸长约签下——「2019 的每一个月，都有这条河的位置。」资金+40，热度+5。"; } },
      ],
    },
    prepEv18,
  ],

  /* ---------- 11月：大赏投票 ---------- */
  11: [
    {
      id: "m11_18_rt_vote",
      title: "11月 · 金曲大赏投票开启",
      gate: st => true,
      pages: st => [
        { s: "叶盛", cls: "speaker-yesheng", t: "年度金曲大赏投票通道开启——BEST 50。总选举证明人气，金曲大赏证明成色。组阁年的最后一战，别松手。" },
      ],
    },
    prepEv18,
  ],

  /* ---------- 12月：倒计时（大赏由引擎判定）+ 红白决赛（复刻线专属） ---------- */
  12: [
    {
      id: "m12_18_yearend",
      title: "12月 · 倒计时",
      gate: st => true,
      pages: st => [
        { nar: true, t: "12月的上海，第一场雪落下来。剧场门口的灯墙映着一小片暖光——有粉丝在灯下拍照，拍完对着镜头哈了口气：「组阁年，值了。」\n\n一年走到最后一步了。你把西装外套搭上椅背——像这一年里的每一个月一样。" },
      ],
    },
    {
      /* 【复刻路线专属③】红白预赛结算：预赛第一名获邀赴日参加年末决赛。
         预赛名次确定性取出征五人中人气最高者（pages 与 effect 两次计算口径一致，
         且 pages 阶段不改数值）。 */
      id: "m12_18_kohaku_final",
      title: "12月 · 红白决赛 · 出发",
      gate: st => Game.isReplicate(st) && !!st.decisions.kohaku18Squad,
      pages: st => {
        const squad = (st.decisions.kohaku18Squad || [])
          .map(n => st.members.find(m => m.name === n)).filter(Boolean);
        const top = squad.slice().sort((a, b) => (b.pop || 0) - (a.pop || 0))[0];
        const loc = st.decisions.kohaku18 === "hq" ? "上海星梦剧院"
          : ((st.decisions.kohaku18 || "GNZ48") + " 星梦剧院");
        return [
          { nar: true, t: "红白歌会中国预赛在" + loc + "落幕。一个月的票，开票当天售罄；预赛舞台的直拍在国内平台播放量破亿——而东京方面盯着的，是另一样东西。\n\n预赛第一名：" + (top ? top.name : "—") + "。NHK 的加场邀请函紧跟着就到了：12月31日晚，红白歌会决赛舞台，中国预选代表——她的名字。" },
          { s: "叶盛", cls: "speaker-yesheng", t: (top ? "（把行程单放在你桌上，声音有点抖）" : "（把行程单放在你桌上）") + "从四月那封「致老朋友」的联络函，到今晚的决赛入场券——复刻路线走了四年，这是它走到最远的一次。伴舞、服装、翻译，公司全包。总监，让她去吧。" },
        ];
      },
      choices: [
        { label: "送她出发——把这条河的名字唱进红白", hint: "预赛第一名：人气+6 羁绊+6 热度+4",
          tag: "kohaku18Final", value: "send",
          effect: st => {
            const squad = (st.decisions.kohaku18Squad || [])
              .map(n => st.members.find(m => m.name === n)).filter(Boolean);
            const top = squad.slice().sort((a, b) => (b.pop || 0) - (a.pop || 0))[0];
            if (top) {
              top.pop = Math.min(100, (top.pop || 0) + 6);
              top.bond = Math.min(100, (top.bond || 0) + 6);
              top.note = (top.note ? top.note + "；" : "") + "2018红白歌会中国预选代表";
            }
            st.heat = Math.min(100, st.heat + 4);
            return "12月31日晚，东京。" + (top ? top.name : "她") + "站上红白歌会的决赛舞台，唱的是复刻路线四年来学会的第一首歌——日方字幕打出「中国预选代表・SNH48」。\n\n弹幕里有人说：「原来她们真的在往台上走。」\n\n（决策已登记：kohaku18Final=send。" + (top ? top.name : "她") + "人气+6 羁绊+6，热度+4。）";
          } },
      ],
    },
    {
      /* 【复刻路线专属③】AKB48 方面告知：台湾分团 TEB48 提议（2019 伏笔，v0.11.6）。
         4月/5月日方「年末有新企划」的话在 12 月兑现——AKS 想开拓港澳台市场，
         明年台湾选拔完毕后希望中方接手运营作为 TEB48；子杰私话警示扩张过快。
         马嘉伶（AKB48 台湾选拔招募·2017 移籍在册）是这一提议的先例注脚。 */
      id: "m12_18_teb48",
      title: "12月 · 来自东京的新企划",
      gate: st => Game.isReplicate(st) && !st.decisions.teb48Offer18,
      pages: st => [
        { nar: true, t: "红白决赛的庆功宴第二天，AKS 的正式函件到了：AKB48 方面希望开拓港澳台地区市场——明年的台湾选拔已经定档，选拔完毕之后，希望由中方接手，作为台湾分团「TEB48」运营。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把函件翻到附页）台湾选拔——马嘉伶就是上一次台湾选拔出来的。这封信的意思很直白：人他们出，盘子让我们接。TEB48 的招牌、剧场、运营，全套走我们这条河的规矩。" },
        { s: "王子杰", cls: "speaker-wangzj", t: "（下班前，他在你办公室门口站了一会儿，声音压得很低）总监，这话我只跟你说：扩张的速度，有点快了——财政已经吃不太住了。我自己原本想开的成都和武汉分团，都暂时搁置了。\n\n东京这封信，你明年要不要接、怎么接——慎重考虑。手里有粮，心里才不慌。" },
      ],
      choices: [
        { label: "（收下函件。这件事，明年再想。）", hint: "决策登记：teb48Offer18=offer——明年是否推进 TEB48 建设，2019 回收",
          tag: "teb48Offer18", value: "offer",
          effect: st => "你把函件和子杰的那段话放在了同一个抽屉里——一张是东京的蓝图，一张是上海的账本。明年开春，这两张纸总得有一个先见天日。\n\n（决策已登记：teb48Offer18=offer。是否推进 TEB48 的建设——留给明年。）" },
      ],
    },
    {
      /* 【非复刻路线专属】AKB48 TSH 上海新分团官宣（v0.11.6）——对日对抗姿态下，
         对手直接打进了上海主场。tag tsh18：silent（不发表意见）/ ride（蹭热度）。 */
      id: "m12_18_tsh",
      title: "12月 · 对手的官宣",
      gate: st => !Game.isReplicate(st) && !st.decisions.tsh18,
      pages: st => [
        { nar: true, t: "12月中旬，一纸官宣同时登上了中日两边的热搜：AKB48 方面正式宣布，新上海分团「AKB48 TSH」成立——同一个城市，同一片市场，连剧场的选址都贴着黄浦江。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把平板推到你面前，两条热搜并排挂着）总监，他们把分团开到我们家门口了。全网都在等着看这条河怎么接——官微的评论区已经有人 @我们了，一句话不说，也是一种表态。" },
      ],
      choices: [
        { label: "不发表意见——专注自家的舞台", hint: "低调应对：内部统一口径，士气+1",
          tag: "tsh18", value: "silent",
          effect: st => { st.morale = Math.min(100, st.morale + 1);
            return "你给宣传口只留了一句话：「不接招。12月的排练表不变。」当天夜里，官博安静得像什么都没发生——而排练室的灯，比平时又多亮了一个小时。（决策已登记：tsh18=silent。士气+1——军心稳住，舞台见。）"; } },
        { label: "蹭热度——借他们的官宣给自己引流", hint: "热度+6 士气+2（官微玩梗互动，话题度暴涨）",
          tag: "tsh18", value: "ride",
          effect: st => { st.heat = Math.min(100, st.heat + 6); st.morale = Math.min(100, st.morale + 2);
            return "官博在热搜底下轻飘飘回了一句：「欢迎来上海。江对面的票，我们卖三年了。」转发瞬间破十万，评论区笑倒一片——对方官宣的话题度，硬生生被这条河截流了一半。（决策已登记：tsh18=ride。热度+6 士气+2——日子久了，别人也会记得我们今天是怎么接的招。）"; } },
      ],
    },
    prepEv18,
  ],
};

/* ========================================================================
   四、2018 追加随机事件（引擎与 randomPool 合并取用）
   ======================================================================== */
STORY.randomPool18 = [
  {
    id: "r18_reorg_rumor",
    title: "组阁名单风波",
    text: st => st.flags.reorg18Done ? "一份疑似「组阁二轮名单」的截图在小群里流传——孩子们在更衣室里议论纷纷。" : null,
    gate: st => !!st.flags.reorg18Done,
    choices: [
      { label: "官方辟谣：一次讲清组阁是年度动作", effect: st => { st.morale = Math.min(100, st.morale + 3); return "官微当天发布说明：组阁是年度一次性动作，年内不会再有第二轮。更衣室安静了，练功房的门重新关上。士气+3。"; } },
      { label: "冷处理，让流言自灭", effect: st => { st.morale = Math.max(0, st.morale - 2); return "你选择不回应。流言三天就淡了，只是有几个孩子的训练量悄悄变了。士气-2。"; } },
    ],
  },
  {
    id: "r18_show_hot",
    title: "选秀热搜",
    text: st => st.show18.done ? "派遣成员在节目里的直拍被剪成合集，播放量破了千万——「原来养成系的底子是这样练的」。" : null,
    gate: st => !!st.show18.done,
    choices: [
      { label: "趁势加推团体物料", effect: st => { st.heat = Math.min(100, st.heat + 5); st.money += 20; return "团综预告、公演票务、代言洽谈三线并进——热搜的流量被接住了。热度+5，资金+20。"; } },
      { label: "让成员安心录制，不追流量", effect: st => { st.morale = Math.min(100, st.morale + 3); return "你给录制基地打了个电话：「别分心，舞台见。」孩子们把手机上交得更彻底了。士气+3。"; } },
    ],
  },
  {
    id: "r18_prep_shine",
    title: "预备生的加练",
    text: "深夜路过排练室，看见几个预备生在加练——汇报公演的轮换池，让她们第一次有了「被看见」的盼头。",
    gate: st => st.era === "2018",
    choices: [
      { label: "给排练室订夜宵", effect: st => { st.morale = Math.min(100, st.morale + 3); st.burden = Math.min(100, st.burden + 2); return "热汤面送到排练室的时候，孩子们的道谢声差点掀了房顶。马跃发来消息：「总监，明天的公演她们能跳疯。」士气+3，叶盛负担+2（夜宵单是他签的）。"; } },
      { label: "劝她们早点休息", effect: st => { st.morale = Math.min(100, st.morale + 1); return "你推门进去把灯关了一半：「养好精神，舞台才长久。」孩子们乖乖收工——但第二天，排练室里多了几张提前占好的位置。士气+1。"; } },
    ],
  },
];

/* ========================================================================
   五、总选举次日 / 金曲大赏叙事
   ======================================================================== */
STORY.geAftermath18 = st => {
  const reign = st.geResult && st.geResult.top1 === st.history.ge2017Top1;
  return [
    { s: "叶盛", cls: "speaker-yesheng", t: reign
      ? "（第二天一早冲进办公室）连霸了！组阁之后的第一届总选，去年的名字还钉在第一——荣誉殿堂的升堂仪式，董事会已经批了！"
      : "（第二天一早冲进办公室）新王登基！组阁后的第一届总选，第一名换人了——市场用选票给这次重组投了票。荣誉殿堂那边，董事会说「非连霸不升堂」，制度照旧。" },
    { s: "马跃", cls: "", t: "（短信）总监，汇报公演出来的孩子昨晚在总选现场看了全程。回来的路上她们说：「明年，站在那个台上的预备生名单里，得有我。」" },
    { nar: true, t: (reign
      ? "（连霸达成——升堂事件将在结算中触发。）"
      : "（总选举落幕。打投收入已入账，全团热度大涨。距离年末，还有一场收官硬仗。）") },
  ];
};

STORY.rtNarrative18 = {
  great: [
    { nar: true, t: "当年度第一位的旋律响起，全场打开手机灯海。叶盛在侧台轻声说：「组阁年……收在一个最亮的尾上。」" },
  ],
  normal: [
    { nar: true, t: "舞台灯光落下的瞬间，你在观演席轻轻呼出一口气——组阁、公演、总选、大赏：2018年，就这样唱到了最后。" },
  ],
};

/* ========================================================================
   六、结局文本（评级由 engine.computeGrade18 计算）
   ======================================================================== */
STORY.endings18 = {
  S: {
    rank: "S", title: "星阵重列",
    text: "跨年夜，你收到了一份特殊的礼物——五支队伍的队长联名送来的一幅画：五颗星，绕着同一个圆心。\n\n画的背面写着一行字：「谢谢您敢对我们动刀。」\n\n王子杰的邮件只有一行：「下个五年，还是头部的。」\n\n你把画挂进办公室。组阁的排布图、汇报公演的签到表、选秀出征的名单、总选的票数曲线——2018年的每一页，都在替这条河回答同一个问题：\n\n「敢于重排自己的河，才流得远。」",
  },
  A: {
    rank: "A", title: "各归其位",
    text: "年末总结会上，王子杰没有多说什么——只是在散会时把那份「各队人气与排布对照表」留在了你桌上。\n\n「明年，这张表会好看很多。」\n\n散会后叶盛陪你锁门。新队伍的公演海报贴在走廊两侧，预备生汇报公演的排期表排到了明年三月。\n\n你想起一年前那些高低差得刺眼的柱状图。现在，它们站齐了。",
  },
  B: {
    rank: "B", title: "过渡之年",
    text: "这一年，刀落下去了，伤口还在愈合。\n\n组阁的名单公布了，新队伍还在磨合；总选的名次守住了大盘；汇报公演的轮换池里，有几颗苗子冒了头。\n\n王子杰在年终评语里写：「重排是手段，不是目的。别让手段，占掉目的的位置。」\n\n你把这句话钉在办公桌对面。2019年，让星阵真正亮起来。",
  },
  C: {
    rank: "C", title: "磨合之痛",
    text: "年末，董事会的会议室里，那份「组阁半年考」报告被翻到了最后一页——数字不算难看，但也绝算不上好看。\n\n「重组不是避风港，」王子杰说，「它只是给了所有人一次重新起跑的机会。起跑之后，还是要靠自己跑。」\n\n没有人当场宣布什么。散会时，叶盛把你的旧工牌擦干净递还给你：「留着我这，随时回来。」\n\n你走出大楼。这条河还在流——只是星阵重列之后的第一个冬天，格外冷一些。",
  },
  bankrupt: {
    rank: "D", title: "资金链断裂",
    text: "连续的赤字击穿了董事会的底线。\n\n王子杰在紧急会议上行使大股东表决权：年度计划终止，组阁方案移交下任执行。王婧投了反对票——她的一票，没能改变结果。\n\n移交清单交完那天，新队伍的队长发来消息：「总监，明年的公演服，还按新队徽做吗？」\n\n你盯着那行字看了很久，回复了两个字：「做吧。」然后关掉了手机。\n\n这条河不会记得每一个摆渡人。但你记得，那面贴满红色箭头的墙，和它第一次站齐的样子。",
  },
};

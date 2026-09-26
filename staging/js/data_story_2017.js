/* ============================================================================
   data_story_2017.js — 剧情数据（2017「本部新章」线）
   ----------------------------------------------------------------------------
   【同人声明】本文件全部剧情为粉丝同人虚构创作，与现实无关；真实成员/管理层
   的言行均为艺术演绎，随机事件中涉及成员的一律用「某成员」指代。
   史实锚点考据见 data_members.js 的 history2017 / joining2017 / leaving2017
   （来源 snh48wiki.top 快照，tmp/research/）。

   ----------------------------------------------------------------------------
   【进入方式】本线不从标题页直接开局——由 2016 线结局界面的「进入下一年」入口
   进入（Game.carryTo2017 继承 2016 年末的全部成员卡与经营状态）。

   本文件挂载的 STORY 键（engine/ui 按 era==="2017" 消费）：
     STORY.prologue17        序章（结构同 prologue：sceneLabel/pages/styles/closing）
     STORY.scenes17          行动场景 { shyPrep / ckgStart / ckgTheater / ckgRecruit / orig(team) }
     STORY.openShy(st) / STORY.openCkg(st)   双团开业首演事件页（engine 月末判定后调用）
     STORY.monthly17         月度脚本事件
     STORY.randomPool17      2017 追加随机事件（引擎与 randomPool 合并取用）
     STORY.geAftermath17(st) 总选举次日剧情
     STORY.rtNarrative17     金曲大赏叙事 { great / normal }
     STORY.endings17         结局文本 { S/A/B/C/bankrupt }

   决策标签（st.decisions）：springFest17 / s7senses / geStrategy / ckgCheck17 /
     summerMode17 / fengshang17 / orig_SII·NII·HII·X（原创公演题名）。
   旗标（st.flags）：aji（结识阿吉，解锁「卫视联动」行动）/ tvCny / s7。
   ========================================================================== */

"use strict";

/* ========================================================================
   一、序章：本部新章（年初决策会议）
   ======================================================================== */
STORY.prologue17 = {
  sceneLabel: "2017年1月 · 上海 · 集团年度决策会议",
  pages: st => {
    /* 基础页面 = 本部线序章；2016「下一站」选了分团的存档（分团线序章），
       在末尾表态页之前插入对应交接内容：
       · GNZ48/CKG48：周马/孟波与总监交接工作；
       · BEJ48：赴任说明（2017.1 名册同步）；SHY48：先遣队成立后进驻说明；
       · 留守本部（branchPost=none/旧档无值）：与本部线序章完全一致。 */
    const base = [    { nar: true, t: "2017年1月，上海。\n\n2016年的稳步经营让这条河彻底出了圈：总选举的票数翻了倍，分团的灯在新的城市亮起，热搜上「SNH48」从粉丝圈子里的暗号，变成了路人也能接上几句的名字。\n\n而眼下最直白的信号是——各大卫视的春晚邀约，正一封接一封地发到星梦剧院的传真机上。" },
    { s: "叶盛", cls: "speaker-yesheng", t: "（抱着一摞请柬进来）东方的、湖南的、辽宁的……总监，去年这个时候，是我们求着上节目；今年，是节目在抢我们的档期。这就是「热度」两个字，最实在的样子。" },
    { nar: true, t: "九点整，年度决策会议开始。长桌尽头，一个许久没有在一线露面的人走了进来——创始人，王子杰。" },
    { s: "王子杰", cls: "speaker-wangzj", t: "去年这个时候我说，这条河该有支流了。你们不但听懂了，还把它变成了两座亮着灯的剧院。做得漂亮——今天我过来，就是要亲眼把下一年的担子，交给接得住的人。" },
    { s: "王婧", cls: "speaker-wangjing", t: "（翻开年度计划）《2017：双支汇流》。第一条，也是压秤的一条：重庆和沈阳，两座分团的立项文件都已经批复——今年，要让这两盏灯亮起来。沈阳快些，一月就要首演；重庆在金秋十月。" },
    { s: "王子杰", cls: "speaker-wangzj", t: "沈阳和重庆，就拜托总监了。尽快让它们落地——灯亮起来之前，一切承诺都是纸面上的。" },
    { s: "王婧", cls: "speaker-wangjing", t: "第二条，年度大活动照旧：7月的第四届总决选，年末的金曲大赏。第三条——去年一年看下来，孩子们和「内娱」的差距，主要不在人气，在实力。今年要把「实力」两个字，写进每个人的考核里。" },
    { s: "王子杰", cls: "speaker-wangzj", t: "第四条，叶盛的担子继续分一半出去。第五条，热度不能只靠总选一年烧一次——团体的影响力，要变成常态。第六条……（看向你）我们自己写的歌，该登上四支队伍的舞台了。借来的歌要还，自己的歌，才是根。" },
    { s: "叶盛", cls: "speaker-yesheng", t: "（小声）……六条主线。比去年还多三条。对了总监，第五条我记下了——散会之后你别急着走，我跟你说个人，你该去认识认识。" },
    { s: "王婧", cls: "speaker-wangjing", t: "那么，制作总监——新一年的第一份表态，说说你的打法。" },
  ];
    const post = st && st.decisions && st.decisions.branchPost;
    const rep = st && ((st.decisions && st.decisions.jpMode) || st.jpMode) === "replicate";
    if (rep) {
      /* 复刻模式专属：第六条由「四队原创公演」改为「四套新复刻公演」（子杰亲自向日方要舞台） */
      base[7] = { s: "王子杰", cls: "speaker-wangzj", t: "第四条，叶盛的担子继续分一半出去。第五条，热度不能只靠总选一年烧一次——团体的影响力，要变成常态。第六条……（看向你，又看向山本学）去年，你们把日方的舞台原汁原味地搬了过来，市场认。今年我要再进一步：四套全新的复刻公演，四支队伍一套一套排出来——让所有想「复制这条河」的人，永远只能追我们的尾巴。" };
    }
    let extra = [];
    if (rep) {
      extra = extra.concat([
        { nar: true, t: "会议进行到一半，会议室侧门开了——AKB48方经纪顾问山本学走了进来，在王子杰身边落座。复刻路线的第二个年头，日方的椅子，就摆在长桌尽头。" },
        { s: "山本学", cls: "speaker-akb", t: "（微微欠身）一年前我们说，上海是最像名古屋的地方。今年，秋叶原愿意再押一注：四套全新的复刻公演，曲目、编舞、服装图样，下月起分批送达上海。" },
        { s: "王子杰", cls: "speaker-wangzj", t: "授权费用集团来谈，舞台质量你们把关。但我也有一个条件——让孩子们把它们当成自己的舞台来排。复刻不是照抄，是把别人的歌，唱成自己的胜利。" },
        { s: "王婧", cls: "speaker-wangjing", t: "（在纪要上落笔）主线第六条据此调整：原定的四队原创公演，变更为「四套新复刻公演排练」——日方授权，我们出排练。总监，这笔账划得来。" },
      ]);
    }
    if (post === "GNZ48") {
      extra = [
        { nar: true, t: "会议的议程表上，多了一行小字：「GNZ48 工作交接」。\n\n长桌另一侧，周马把一只贴满彩色标签的文件袋推到你面前——广州一年，从首演到稳定运营，所有的家当都在里面。" },
        { s: "周马", cls: "speaker-zhouma", t: "总监，广州交给你，我放心。G队的排片、NIII建队的底稿都在袋子里——2017年1月的在册名册我逐人核对过，三十三人，签收吧。" },
        { s: "周马", cls: "speaker-zhouma", t: "至于我——董事会调我去重庆支援CKG48筹备。广州的粉，重庆的辣，都是好日子。后会有期！" },
        { nar: true, t: "你在交接清单末页签下名字。从今天起，GNZ48 的每一笔账，都记在你的桌上。\n\n（成员页 GNZ48 标签页：2017.1 在册名册已同步——Team G / Team NIII）" },
      ];
    } else if (post === "CKG48") {
      extra = [
        { nar: true, t: "会议的议程表上，多了一行小字：「CKG48 筹备交接」。\n\n孟波抱着一摞图纸和名单进来，往桌上一摊——重庆的剧场选址、改造预算、首批苗子的考察档案，摊满了半张长桌。" },
        { s: "孟波", cls: "speaker-mengbo", t: "总监！重庆的家底全在这儿——剧场定了解放碑，首批苗子也锁得差不多了，就等十月亮灯。你点将的六人先遣队，等筹备就绪就过去跟你汇合！" },
        { s: "孟波", cls: "speaker-mengbo", t: "董事会另有差事给我——新分团筹建顾问，把重庆趟出来的路子带去下一座城。开荒嘛，哪座城市辣就去哪座！后会有期！" },
        { nar: true, t: "你在交接清单末页签下名字。从今天起，CKG48 的每一笔账，都记在你的桌上；六人先遣队暂留上海随训，重庆亮灯之日，即进驻之时。\n\n（主线④将在 CKG48 成立后切换为「专注CKG48事务」）" },
      ];
    } else if (post === "SHY48") {
      extra = [
        { nar: true, t: "散会前，叶盛递给你另一份名单——你点将的六人先遣队，暂留上海随训。\n\n「沈阳剧院亮灯之日，就是他们进驻之时。」叶盛顿了顿，「总监，你在沈阳的办公桌，已经擦好了。」\n\n（主线④将在 SHY48 成立后切换为「专注SHY48事务」）" },
      ];
    } else if (post === "BEJ48") {
      extra = [
        { nar: true, t: "散会前，王婧把一份名册放到你面前——BEJ48 成军八月，Team B、Team E 两队去年九月完成队长任命，2017年1月的在册名册共三十六人。\n\n「北京的事，从今天起签你的名字。」她合上名册，「悠唐广场十楼的办公桌，已经擦好了。」\n\n（成员页 BEJ48 标签页：2017.1 在册名册已同步；主线④已切换为「专注BEJ48事务」）" },
      ];
    }
    return extra.length ? base.slice(0, base.length - 1).concat(extra, base.slice(base.length - 1)) : base;
  },
  /* 序章选择：新一年方针（applyStyle 按 era 取本表） */
  styles: [
    { id: "stable", label: "「双线并进，账上永远留足过冬的钱。」", hint: "稳进派：资金+80万", apply: st => { st.money += 80; } },
    { id: "content17", label: "「今年，让孩子们在舞台上脱胎换骨。」", hint: "淬炼派：全团实力小幅提升，训练度+6", apply: st => { Game.gainAllPwr(st, 2); st.train = Math.min(100, st.train + 6); } },
    { id: "hype", label: "「我要让全国观众都认识这条河。」", hint: "造势派：热度+8，叶盛负担-10", apply: st => { st.heat = Math.min(100, st.heat + 8); st.burden = Math.max(0, st.burden - 10); } },
  ],
  closing: [
    { s: "叶盛", cls: "speaker-yesheng", t: "好，记下了。去年的花名册你翻了一整年，今年的版本更厚了——本部五支队伍，加上北京、广州两支分团，还有月底就要首演的沈阳新军。" },
    { nar: true, t: "叶盛把新一份花名册放到你桌上，扉页贴着一张便签：\n\n「今年的关键词：实力。 ——叶盛」\n\n2017年的征程，从重庆和沈阳的两盏灯开始。" },
  ],
};

/* ========================================================================
   二、行动场景（scenes17）：双团开设四段 + 原创公演
   ======================================================================== */
STORY.scenes17 = {

  /* ---------- SHY48：筹备冲刺（0→1，需资金≥120，投入100） ---------- */
  shyPrep: {
    label: "沈阳 · SHY48 剧场筹备现场",
    pages: st => [
      { nar: true, t: "沈阳的雪下得正紧。中街的一处商业综合体顶层，SHY48 的剧场已经在打主体隔断——这是继北京、广州之后的第三座星梦剧院，也是第一座要陪东北粉丝过冬的剧场。\n\n（史实锚点：SHY48 一期生 1月7日、2月19日两批共 34 人公布，1月12日剧场首演。）" },
      { s: "叶盛", cls: "speaker-yesheng", t: "一期生两批三十四个人，已经全员到位，正跟着北京的教案练晨功。剧场改造报价单一百二十万打底——一月十二号要亮灯，时间只够烧钱抢，没有第二种活法。" },
      { s: "王婧", cls: "speaker-wangjing", t: "（电话会议）董事会给沈阳的口径是「春节前必须亮灯」。总监，这笔钱花得越果断，首演就越有底气。", },
    ],
    choices: [
      { label: "追加预算，两班倒抢工期", hint: "资金-120万 士气-3：一月十二日，灯必须亮",
        tag: "shyMode", value: "rush",
        apply: st => { st.money = Math.max(0, st.money - 20); st.morale = Math.max(0, st.morale - 3); return "你追加了两班倒的施工单。沈阳的工人在零下十几度的顶层加班到深夜，一杯杯热豆浆送上工地——一月十二日，灯如约亮起。（额外资金-20万）"; } },
      { label: "标准工期，把钱花在舞台设备上", hint: "资金-100万 训练度+3：灯晚亮几天，但地基扎实",
        tag: "shyMode", value: "steady",
        apply: st => { st.train = Math.min(100, st.train + 3); return "你把省下的工期钱换成了灯光音响。沈阳的灯比原计划晚了几天，但首演那一晚，效果拔群——东北的粉丝们说，「这剧场，敞亮！」"; } },
    ],
  },

  /* ---------- CKG48：筹备启动（0→1，纯叙事） ---------- */
  ckgStart: {
    label: "重庆 · CKG48 筹备组驻地",
    pages: st => [
      { nar: true, t: "重庆，渝中区。筹备组把办公室设在了解放碑附近一间能看到长江的老写字楼里——孟波说，这是为了让每个来面试的姑娘，第一眼就看到这条江。" },
      { s: "孟波", cls: "speaker-mengbo", t: "（拍着地图）总监，你看——重庆四十三所高校，直拍文化在短视频上已经起势了。咱们的第一批娃已经锁了苗子，剧场选址也定了，就差临门一脚的改造费和招募的士气！" },
      { s: "叶盛", cls: "speaker-yesheng", t: "孟波的筹备预案是我见过最野的一份，也是最落地的份。他缺钱、缺人、缺关注——三样，都从你手里出。" },
      { nar: true, t: "（史实锚点：CKG48 一期生 33 人于 10月27日公布，同日重庆星梦剧院首演，首批设 Team K 与 Team C 两支队伍。）" },
    ],
  },

  /* ---------- CKG48：剧场改造（1→2，需资金≥160，投入150） ---------- */
  ckgTheater: {
    label: "重庆 · CKG48 剧场改造",
    pages: st => [
      { nar: true, t: "重庆星梦剧院的改造方案摆上桌面：选址在商圈顶层，山城的夜景就在落地窗外面。孟波在方案扉页写了一行字：「灯亮起来之前，别提什么天时地利。」" },
      { s: "孟波", cls: "speaker-mengbo", t: "改造费一百五十万，我孟波拿脑袋担保——每一分都花在刀刃上。但有个选择你得做：是要一套全新的顶配设备，还是把钱省下来投给娃们的集训？" },
    ],
    choices: [
      { label: "上顶配——舞台机械全套换新", hint: "资金-150万 热度+3：首演效果一鸣惊人",
        tag: "ckgTheater", value: "full",
        apply: st => { st.heat = Math.min(100, st.heat + 3); return "全套顶配设备从水路运抵重庆。孟波在验收单上签完字，咧嘴一笑：「这个台子，站上去就想唱歌。」"; } },
      { label: "修旧利废，省钱投给集训", hint: "资金-150万 训练度+4：设备够用就行，实力才是根",
        tag: "ckgTheater", value: "save",
        apply: st => { st.train = Math.min(100, st.train + 4); return "二手市场淘来的设备被孟波擦得锃亮，省下的钱全变成了集训营的课时费。他发来一条语音：「设备是壳，娃们是魂！」"; } },
    ],
  },

  /* ---------- CKG48：招募集训（2→3，需士气≥55，纯叙事） ---------- */
  ckgRecruit: {
    label: "重庆 · CKG48 首批成员海选与集训",
    pages: st => [
      { nar: true, t: "CKG48 的海选报名人数超出预期——短视频带来的流量，让「偶像」第一次离山城的姑娘们这么近。" },
      { nar: true, t: "考核日，三十三张面孔从数千人里留了下来。有人唱川江号子的改编版，有人跳自编的街舞，还有一个姑娘在自我介绍里说：「我想成为重庆的第一批。」" },
      { s: "孟波", cls: "speaker-mengbo", t: "（看着名单，难得压低了嗓门）三十三个人，两支队伍，Team K 和 Team C。总监，十月底，咱们重庆见——首演那天，我请你吃最辣的火锅！" },
      { nar: true, t: "（CKG48 筹备就绪。按史实节奏，开业首演安排在 10 月末——灯亮之前，请把其他主线也安排妥当。）" },
    ],
  },

  /* ---------- 原创公演制作（每队一次，orig(team) 返回对应队伍的专属场景；
              复刻模式变体：日方授权四套新复刻公演，仅需排练成本40万/套） ---------- */
  origTitles: { SII: "美丽48区", NII: "以爱之名", HII: "头号新闻", X: "命运的X号" },
  repTitles: { SII: "目击者", NII: "RESET", HII: "最终钟声", X: "偶像的黎明" },
  isRep17: () => {
    const st = (typeof Game !== "undefined" && Game.st) || null;
    return !!(st && ((st.decisions && st.decisions.jpMode) || st.jpMode) === "replicate");
  },
  orig: teamName => {
    const rep = STORY.scenes17.isRep17();
    const title = (rep ? STORY.scenes17.repTitles : STORY.scenes17.origTitles)[teamName];
    return {
      label: "Team " + teamName + (rep ? " · 复刻公演排练启动" : " · 原创公演制作启动"),
      pages: st => {
        if (rep) {
          return [
            { nar: true, t: "日方的包裹按季送到了：曲谱、分声部表、编舞逐拍拆解图，还有一套叠得整整齐齐的演出服。四支队伍的新复刻公演——秋叶原的看家曲目，这次要在上海的剧场里亮出来。" },
            { s: "山本学", cls: "speaker-akb", t: "（远程视频里）这套舞台在东京演了三年，每一个换拍、每一个走位都有它的道理。请把它完整地排下来——上海的孩子唱日文的歌，东京的观众会看见诚意。" },
            { s: "叶盛", cls: "speaker-yesheng", t: "（翻着排练计划）授权日方出、排练我们出——每套四十万，主要是集训课时和舞美复刻。总监，孩子们这两个月，就耗在这套舞台上了。" },
          ];
        }
        const original = st.decisions.akbSplit === "original" || st.flags.originalSongsStarted;
        return [
          { nar: true, t: "排练室的白板上贴满了便签。四支队伍的原创公演计划——这是王子杰「自己的歌，才是根」的年度答卷，也是与日方授权断供后（或从未断供前，先行一步），这条河最重要的一次内容自救。" },
          { s: "叶盛", cls: "speaker-yesheng", t: "（摊开制作预算）一队一套公演，八十万起步：词曲、编舞、服装、舞美。" + (original ? "好消息——《源头计划》的曲库能支援几首成稿，制作费直接省下一块。（原创曲库伏笔回收：制作费-20万）" : "") },
          { s: "王子杰", cls: "speaker-wangzj", t: "（排练室后排，安静地听完汇报）歌名先别急着定商用的——让孩子们进录音棚，唱一遍，你们就知道哪首歌是对的。" },
        ];
      },
      choices: [
        rep
          ? { label: "《" + title + "》——完整复刻日方原版舞台", hint: "Team " + teamName + " 复刻公演（日方授权曲目）",
              tag: "orig_" + teamName, value: title,
              apply: st => { return STORY.scenes17.applyOrig(st, teamName, title); } }
          : { label: "《" + title + "》" + ({ SII: "——把巡演路上的故事唱成歌", NII: "——写给粉丝与彼此的信", HII: "——把团内的大事小情唱成头条", X: "——驶向未知的列车" })[teamName],
              hint: "Team " + teamName + " 原创公演（史实向题名）",
              tag: "orig_" + teamName, value: title,
              apply: st => { return STORY.scenes17.applyOrig(st, teamName, title); } },
      ],
      after: [
        rep
          ? { nar: true, t: "日文歌词一行一行地磨，换拍的位置一个一个地抠。首演之夜，台下有粉丝举着东京场次的应援棒——原汁原味，四个字，值回票价。" }
          : { nar: true, t: "录音棚的灯亮到后半夜。小样一遍遍回放，编舞在镜子前重新拆解——属于这条河自己的旋律，第一次成建制地响了起来。" },
      ],
    };
  },

  /* 原创公演选项落地（scenes17.orig 的 choices.apply 调用）；复刻模式仅需排练成本40万 */
  applyOrig: (st, team, title) => {
    const rep = STORY.scenes17.isRep17();
    const discount = st.decisions.akbSplit === "original" || st.flags.originalSongsStarted;
    const cost = rep ? 40 : (discount ? 60 : 80);
    st.money = Math.max(0, st.money - cost);
    st.train = Math.min(100, st.train + 6);
    st.morale = Math.min(100, st.morale + 3);
    st.heat = Math.min(100, st.heat + 3);
    st.orig[team] = true;
    return rep
      ? "Team " + team + " 复刻公演《" + title + "》排练完成！首演之夜，原版舞台上每一个标志性的换拍都被完整复刻，台下日粉直呼「梦回东京」。（资金-" + cost + "万 训练度+6 士气+3 热度+3）\n\n（复刻公演进度：" + Game.origCount(st) + "/4 队）"
      : "Team " + team + " 原创公演《" + title + "》制作完成！首演之夜，安可声整整持续了十分钟。（资金-" + cost + "万 训练度+6 士气+3 热度+3）\n\n（原创公演进度：" + Game.origCount(st) + "/4 队）";
  },
};

/* ========================================================================
   三·五、荣誉殿堂：开堂与首位升堂（2017 线鞠婧祎连霸后触发；未连霸则 8 月仅宣布设制度）
   ======================================================================== */
STORY.hallAscend17 = st => [
  { nar: true, t: "7月30日，梅赛德斯-奔驰文化中心。当第四届总决选的最终名次定格——鞠婧祎，蝉联。\n\n总决选历史上第一个连霸，在烟花里落定。" },
  { s: "王子杰", cls: "speaker-wangzj", t: "（罕见地亲自上台）从今天起，这条河设立「荣誉殿堂」——连续两年总选第一的成员，升入殿堂：金边成员卡、殿堂徽标，脱离队伍编制，往影视与个人方向发展。殿堂成员，不再参加总选举。" },
  { s: "王子杰", cls: "speaker-wangzj", t: "（转向你）而第一位升入殿堂的，就是她。总监，把她的卡片换了吧。" },
  { s: "鞠婧祎", cls: "", t: "谢谢每一个投我的人。一年前我说要连霸——现在我说，这不会是这条河唯一一次开堂。" },
  { s: "叶盛", cls: "speaker-yesheng", t: "（在你旁边小声）金边卡……总监，咱们的人事档案里，从今天起多了一种成员了。" },
  { nar: true, t: "（名单更新：鞠婧祎 升入荣誉殿堂——金边成员卡+殿堂徽标，脱离队伍编制，此后不再参加总选举。）" },
];

/* ========================================================================
   三·六、双团开业首演事件页（engine 月末判定后调用）
   ======================================================================== */
STORY.openShy = st => [
  { nar: true, t: "1月12日，沈阳。\n\n零下二十度的天气挡不住开门的锣鼓。SHY48 首批两支队伍——Team SIII 与 Team HIII——在崭新的星梦剧院完成了首演，三十四个东北姑娘在台上齐声喊出：「大家好，我们是SHY48！」" },
  { s: "叶盛", cls: "speaker-yesheng", t: "（往手心里呵着气）第三座剧院……总监，从上海到这里，两千公里。这条河，真的流到东北来了。" },
  { nar: true, t: "（SHY48 正式开业：此后每月为总账带来 20 万收入。下一年，也许会有她们自己的故事。）" },
];

STORY.openCkg = st => [
  { nar: true, t: "10月27日，重庆。\n\nCKG48 一期生三十三人正式亮相，Team K 与 Team C 两支队伍在重庆星梦剧院完成首演。山城的坡道上，粉丝们举着灯牌排到了街口。" },
  { s: "孟波", cls: "speaker-mengbo", t: "（在侧台，红着眼眶）总监，说了别怕慢，怕停——这一年，咱一天都没停。今晚这个灯，是给重庆的见面礼！" },
  { s: "叶盛", cls: "speaker-yesheng", t: "同一天，本部的刘炅然开启了CKG48 Team K的兼任，王露皎正式移籍重庆。老带新，一步到位。" },
  { nar: true, t: "（CKG48 正式开业：此后每月为总账带来 25 万收入。四座城市、六支院线剧院——「天下布妹」的版图，又落一子。）" },
];

/* ========================================================================
   四、月度脚本事件（monthly17）
   ======================================================================== */
STORY.monthly17 = {

  /* ---------- 1月：春晚季 + 阿吉 ---------- */
  1: [
    {
      id: "m1_17_cny",
      title: "卫视春晚季",
      pages: [
        { s: "叶盛", cls: "speaker-yesheng", t: "春晚邀约堆成山了：三台卫视正晚会的正式函，外加两台网络春晚。可是总监，沈阳那边一月十二号要首演，全团的排期已经绷成一根弦了。" },
        { s: "王婧", cls: "speaker-wangjing", t: "卫视的舞台是免费的全国广告。但人只有这么多——怎么接，你拍板。" },
      ],
      choices: [
        { label: "三台全接，排期拉满", hint: "资金+90 热度+8 士气-8 叶盛负担+6（曝光最大化）",
          tag: "springFest17", value: "all",
          effect: st => { st.money += 90; st.heat = Math.min(100, st.heat + 8); st.morale = Math.max(0, st.morale - 8); st.burden = Math.min(100, st.burden + 6); st.flags.tvCny = 3; return "三台春晚连轴录制，成员们在候机厅里过完了腊月。除夕当晚，三个台的收视率里都有这条河的名字。资金+90，热度+8，士气-8，叶盛负担+6。"; } },
        { label: "精选一台，拿出最好的舞台", hint: "资金+50 热度+5 士气-2（宁缺毋滥）",
          tag: "springFest17", value: "one",
          effect: st => { st.money += 50; st.heat = Math.min(100, st.heat + 5); st.morale = Math.max(0, st.morale - 2); st.flags.tvCny = 1; return "只登了一台，但那四分钟的舞台被剪成短视频疯转——「原来她们唱得这么好」。资金+50，热度+5，士气-2。"; } },
        { label: "全部婉拒，保住开业前的士气", hint: "士气+6 热度-2（人心比曝光贵）",
          tag: "springFest17", value: "none",
          effect: st => { st.morale = Math.min(100, st.morale + 6); st.heat = Math.max(0, st.heat - 2); return "孩子们第一次在没有通告的腊月里好好吃了顿团年饭。热度让给了别人，但排练室的笑声多了。士气+6，热度-2。"; } },
      ],
    },
    {
      /* 【主线⑤入口】叶盛提示会后和工作人员阿吉谈谈。
         见到阿吉 → flags.aji，解锁「卫视联动」行动；错过则全年无法解锁（行动列表不出现）。 */
      id: "m1_17_aji",
      title: "散会后 · 阿吉的方案",
      pages: [
        { s: "叶盛", cls: "speaker-yesheng", t: "总监，留一下。给你介绍个人——阿吉，新媒体运营部的。2016年好几档热门综艺上出现这条河的身影，背后都有他的推动。今天会上那条「团体影响力」的主线，他笔记本上画满了执行方案。" },
        { nar: true, t: "走廊尽头，一个抱着笔记本电脑的年轻人朝你挥手。他的工牌绳子上挂着一串综艺录制通行证，像挂了一串钥匙。" },
      ],
      choices: [
        { label: "和阿吉聊到深夜", hint: "解锁「卫视联动」行动：热度+4 叶盛负担+5",
          tag: "ajiTalk", value: "yes",
          effect: st => { st.flags.aji = true; st.heat = Math.min(100, st.heat + 4); st.burden = Math.min(100, st.burden + 5); return "阿吉的笔记本里是一整年的卫视资源图谱：2016年多档热门综艺里，哪几档肯给整段舞台、哪几位制片人他能直接说上话、哪段时段的露出最划算——你听完只说了一句：「下个月的宣传预算，给你划一块。」\n\n（解锁新行动：卫视联动；热度+4 叶盛负担+5）"; } },
        { label: "今天太累了，改天再约", hint: "「卫视联动」行动将无法解锁（全年）",
          tag: "ajiTalk", value: "no",
          effect: st => { return "你摆摆手先走了。第二天忙得分身乏术，这件事一搁再搁——阿吉后来在饭桌上跟叶盛感叹：「总监果然没空理我们这些搞宣发的。」"; } },
      ],
    },
  ],

  /* ---------- 2月：SHY48 战报（按开业与否分支） ---------- */
  2: [
    {
      id: "m2_17_shy_report",
      title: "SHY48 开业首月战报",
      gate: st => st.branch17 && st.branch17.shyOpen,
      pages: [
        { s: "叶盛", cls: "speaker-yesheng", t: "沈阳首月战报：场均上座率八成五，东北粉丝的应援口号喊得震天响——「老铁双击666」都变成应援词了。" },
        { s: "王婧", cls: "speaker-wangjing", t: "好。排片密度可以再谈谈——沈阳的市场值得加注，但别把孩子们的嗓子押上。" },
      ],
      choices: [
        { label: "加密排片，趁热打铁", hint: "资金+30 士气-4", tag: "shyReport", value: "more",
          effect: st => { st.money += 30; st.morale = Math.max(0, st.morale - 4); return "沈阳的排片表排到了日历边缘，票房随之水涨船高——只是队医的挂号单也多了几张。资金+30，士气-4。"; } },
        { label: "稳步排片，以质取胜", hint: "士气+3", tag: "shyReport", value: "steady",
          effect: st => { st.morale = Math.min(100, st.morale + 3); return "沈阳的公演质量稳步爬升，评论区开始出现「值得二刷」。士气+3。"; } },
      ],
    },
    {
      id: "m2_17_shy_urge",
      title: "王婧的催办函",
      gate: st => st.branch17 && !st.branch17.shyOpen && st.branch17.shy === 0,
      pages: [
        { s: "王婧", cls: "speaker-wangjing", t: "（把一份进度表放在你面前）沈阳的立项批复写的是「一月首演」。现在是二月了，总监——筹备资金到位了吗？ \"快\" 这个字，今年是你的考题。" },
        { nar: true, t: "（提示：通过「推进双团开设」行动完成 SHY48 筹备，月末即可触发首演开业。）" },
      ],
    },
  ],

  /* ---------- 3月：HII 新任队长 + 唐安琪解约抉择 ---------- */
  3: [
    {
      id: "m3_17_hii_captain",
      title: "3月3日 · Team HII 新任队长",
      pages: [
        { nar: true, t: "Team HII 队长王璐去年离团后，队长的位置空了四个月。3月3日，任命公示贴出：吴燕文出任 Team HII 队长，张昕出任副队长。" },
        { s: "吴燕文", cls: "", t: "（就职发言）王璐队长留下的东西，我会好好守着。HII 的家人们——以后请多指教！" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（在你旁边鼓掌）五支队伍，五根主心骨，都齐了。总监，队伍的「骨架」稳了，接下来该长「肉」了——实力、实力，还是实力。" },
      ],
    },
    {
      /* 【唐安琪·解约抉择】2016年3月意外烧伤（2016线 m3_tanqi_rest），本年康复；
         但身体状况已无法承受偶像活动，本人提出解约。
         合同条款：因偶像私人原因致使无法正常进行偶像活动的，公司提前解除合约
         不需要支付违约金。玩家选择：①只给予祝福（不加付解约金）②依旧给予解约金。
         tag tanqi17：blessing / severance。
         注：史实路线她自 2016 年起处于暂休（status=rest），leaving2017 的离团条目会被
         引擎跳过，故两个选项的 effect 都负责把成员卡置为离团；若旧档中她仍在籍，
         引擎会在本处理离团，本事件 gate 排除已离团情形。 */
      id: "m3_17_tanqi",
      title: "3月 · 唐安琪的决定",
      gate: st => { const m = st.members.find(x => x.name === "唐安琪"); return !!m && m.status !== "left"; },
      pages: [
        { nar: true, t: "一年过去。去年春天那场意外里的女孩，如今已经能自己走进公司大门——唐安琪约了今天，来签一份文件。复查报告就在文件袋里：烧伤恢复得很好，好到所有人都松了口气；可也正是这份报告的另一页，写清了医生的建议。" },
        { s: "唐安琪", cls: "", t: "总监，谢谢你见我。医生说，我的身体以后不能再承受剧场的连排和聚光灯了。我想了很久——与其占着位置悬在中间，不如好好地告别。我申请解约。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把合同翻到附则那页，声音有点哑）按合同，因偶像私人原因致使无法正常进行偶像活动的，公司提前解除合约，不需要支付违约金。法务的意思是……流程上，我们一分钱都不用出。" },
        { s: "{name}", cls: "speaker-me", t: "合同是底线，不是标准。这件事，按我的心意来办。" },
      ],
      choices: [
        { label: "只给予祝福，依规定不额外支付解约金", hint: "依约办理 · 士气-2",
          tag: "tanqi17", value: "blessing",
          effect: st => {
            const m = st.members.find(x => x.name === "唐安琪");
            if (m) { m.status = "left"; m.note = "2017-03 因身体原因合约解除，告别舞台"; }
            st.morale = Math.max(0, st.morale - 2);
            return "解约协议按合同条款办结：无需违约金，也无需额外补偿。你把全团签满名字的千纸鹤礼盒递给她——「这里永远是你的家，只是以后不用打卡了。」她笑着收下，鞠了一个很深的躬。\n\n（名单更新：唐安琪 离团。士气-2——个别孩子私下嘨咕，觉得少了几分人情味。）";
          } },
        { label: "依旧给予解约金，公司自愿给付", hint: "资金-30 士气+4",
          tag: "tanqi17", value: "severance",
          effect: st => {
            const m = st.members.find(x => x.name === "唐安琪");
            if (m) { m.status = "left"; m.note = "2017-03 因身体原因合约解除，获公司给付解约金"; }
            st.money = Math.max(0, st.money - 30);
            st.morale = Math.min(100, st.morale + 4);
            return "你在解约协议旁边，又签下了一张补偿金的批条——「合同说公司不用给，可没说不能给。这笔钱不是义务，是心意。」她攥着协议的手抖了一下，眼圈一下子红了。\n\n消息传开，排练室安静了几秒，然后有人小声说：「我们公司……还挺像样的。」\n\n（名单更新：唐安琪 离团。资金-30，士气+4。）";
          } },
      ],
    },
  ],

  /* ---------- 4月：7SENSES ---------- */
  4: [
    {
      id: "m4_17_7senses",
      title: "4月7日 · 小分队 7SENSES",
      pages: st => [
        { s: "叶盛", cls: "speaker-yesheng", t: "集团批了一个新企划：从本部抽七个人，成立小分队 7SENSES——走国际化路线，主攻内娱舞台和海外市场。名单里有张语格、许佳琪、戴萌、孔肖吟、赵粤、许杨玉琢、陈琳。" },
        { s: "阿吉", cls: "speaker-aji", t: st.flags && st.flags.aji ? "（把方案拍在桌上）总监，内娱的舞台我全踩过点了——小分队要是成了，「影响力」那条主线的KPI我能翻倍完成！" : "（运营部的年轻人们把策划案传阅了一圈，会议室里难得地热闹。）" },
        { nar: true, t: "（史实锚点：7SENSES 于 2017年4月7日 正式成立，是 SNH48 走向内娱与海外市场的关键一步。）" },
      ],
      choices: [
        { label: "重金打造，主推内娱舞台", hint: "资金-30 热度+10 叶盛负担+8（影响力里程碑）",
          tag: "s7senses", value: "main",
          effect: st => { st.money = Math.max(0, st.money - 30); st.heat = Math.min(100, st.heat + 10); st.burden = Math.min(100, st.burden + 8); st.flags.s7 = true; return "7SENSES 首秀登上内娱颁奖礼，一段舞台切片在热搜上挂了三天。圈内人开始重新打量这条河：「原来48系也有能打的小分队。」资金-30，热度+10，叶盛负担+8。"; } },
        { label: "稳步运营，先在剧场扎根", hint: "士气+4 热度+3", tag: "s7senses", value: "steady",
          effect: st => { st.morale = Math.min(100, st.morale + 4); st.heat = Math.min(100, st.heat + 3); st.flags.s7 = true; return "7SENSES 的首场公演放在了星梦剧院，小剧场的默契肉眼可见地长出来。热度+3，士气+4。"; } },
      ],
    },
    {
      /* 【复刻模式专属·玛莉亚毕业①】铃木玛莉亚从 AKB48 毕业，兼任随之结束。
         玩家选择毕业公演地点：①返回日本（次月触发赴日公演邀请，同宫泽佐江事件点将5人；
         日方派遣北原里英兼任+马嘉伶移籍）②留在上海（次月星梦剧院毕业公演；日方仅派马嘉伶移籍）。
         tag mariaGrad：japan / china。名单变动在 5 月事件链落地。 */
      id: "m4_17_maria_grad",
      title: "4月 · 来自秋叶原的传真",
      gate: st => ((st.decisions && st.decisions.jpMode) || st.jpMode) === "replicate" && !!st.members.find(x => x.name === "铃木玛莉亚" && x.status !== "left"),
      pages: [
        { nar: true, t: "一封来自秋叶原的传真放在你桌上：AKB48 正式发表，铃木玛莉亚将于近期毕业。兼任 SNH48 的日程，也随之进入倒计时。" },
        { s: "铃木玛莉亚", cls: "", t: "（站在你办公桌前，鞠了一躬）总监，从兼任的第一天算起，我在上海站了两年。毕业公演的地点，公司说听您的——回东京，或者留在上海，我都可以。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（低声）她是复刻路线的门面之一。公演办在哪儿，日方都看着——而且听说，派遣名单已经和毕业安排掋在一份文件里了。" },
        { s: "王婧", cls: "speaker-wangjing", t: "体面地送，别亏待她。怎么选，总监你定。" },
      ],
      choices: [
        { label: "允许她返回日本，在 AKB48 剧场开毕业公演", hint: "次月触发赴日公演邀请（Team SII 五人点将）；日方派遣北原里英兼任 + 马嘉伶移籍",
          tag: "mariaGrad", value: "japan",
          effect: st => { st.flags.mariaGrad = "japan"; return "你在回函上盖了章：「毕业公演，回东京办——她是 AKB48 的孩子，该在秋叶原谢幕。」日方很快回函致谢，并附了一页派遣名单：北原里英（兼任）、马嘉伶（移籍）。\n\n（决策已登记：mariaGrad=japan。次月：毕业公演邀请 + 派遣落地。）"; } },
        { label: "把毕业公演留在上海", hint: "次月星梦剧院毕业公演；日方仅派遣马嘉伶移籍",
          tag: "mariaGrad", value: "china",
          effect: st => { st.flags.mariaGrad = "china"; return "你批了：“公演就办在星梦剧院——她的舞台是从这里开始的，谢幕也该在这里。”日方回函表示尊重，派遣名单上只留下了一个名字：马嘉伶（移籍）。\n\n（决策已登记：mariaGrad=china。次月：毕业公演 + 派遣落地。）"; } },
      ],
    },
    {
      /* 【BEJ48 分团线】兼任 tag（flags.concur17["BEJ48"]，即 2016 下一站选 BEJ48）时触发：
         夏越自行离团（暂休）；8 月回归申请事件（m8_17_xiayue_return）接续。 */
      id: "m4_17_xiayue_rest",
      title: "4月 · 北京的一封辞呈",
      gate: st => !!(st.flags.concur17 && st.flags.concur17["BEJ48"]) && !!st.members.find(x => x.name === "夏越" && x.status !== "left"),
      pages: st => {
        return [
          { nar: true, t: "悠唐星梦剧院的例会上，北京分团转来一份申请：Team B 的夏越提出自行离团——理由写得简短：「身体和状态都需要停一停，对不起。」" },
          { s: "叶盛", cls: "speaker-yesheng", t: "（电话里问过北京那边了）队长说她这两个月排练一直不在状态，劝过两次。人各有志，总监——这封辞呈，怎么处理？" },
        ];
      },
      choices: [
        { label: "尊重她的决定，批准暂休", hint: "夏越转入暂休（8 月将提交回归申请）",
          tag: "xiayueRest", value: "rest",
          effect: st => { const m = st.members.find(x => x.name === "夏越"); if (m) { m.status = "rest"; m.note = "2017-04 自行离团（暂休）"; } return "你在申请上批了「暂休」两个字。北京那边没有多留——她收拾好柜子的那天，Team B 的孩子们把折好的千纸鹤塞进了她的包里。"; } },
      ],
    },
  ],

  /* ---------- 5月：第四届总决选启动 + 复刻模式：玛莉亚毕业公演与日方派遣 ---------- */
  5: [
    {
      id: "m5_17_ge_kickoff",
      title: "第四届总决选 · 启动",
      pages: [
        { s: "叶盛", cls: "speaker-yesheng", t: "7月29日，梅赛德斯-奔驰文化中心——「我心翱翔」，SNH48 GROUP第四届偶像年度人气总决选，正式启动。今年的分团席位扩到四支队伍，竞争只会比去年更狠。" },
        { s: "王婧", cls: "speaker-wangjing", t: "上届冠军鞠婧祎将寻求连霸——总决选历史上还没有人做到过。而李艺彤、黄婷婷们虎视眈眈。总监，2到6月是总选筹备期，打投组的预算别省。" },
      ],
    },
    {
      /* 【复刻模式专属·玛莉亚毕业②】赴日毕业公演邀请（同宫泽佐江事件：Team SII 五人点将，
         pickMode="sii5m" → UI.showMariaInvitePicker → engine.mariaInvite） */
      id: "m5_17_maria_invite",
      title: "5月 · 来自东京的请柬",
      gate: st => st.flags.mariaGrad === "japan" && !st.decisions.mariaInvite,
      pages: [
        { nar: true, t: "一份从东京寄来的请柬送到了星梦剧院，字迹一笔一划很认真，落款旁边画了一支小小的应援棒——是铃木玛莉亚的笔迹。" },
        { nar: true, t: "信里说：「5月中旬，我将在东京举行毕业公演。上海教给我的，我想在舞台上还给上海的孩子们——请 Team SII 的孩子们，来送我最后一程。」" },
        { s: "王婧", cls: "speaker-wangjing", t: "（把请柬放在你桌上）这是复刻路线的情分——去东京的门是敞开的。Team SII 出五个人，名单你来定，签证与行程由日方接待。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（小声提醒）总监，这是全日本的镜头。谁去，谁的露出和人气就会涨——这五个名字，值得好好挑。" },
      ],
      choices: [
        { label: "从 Team SII 中点将五人，赴东京送她", hint: "被选中者：羄绊+10 人气+3（仅限 Team SII 在籍成员）",
          pickMode: "sii5m" },
      ],
    },
    {
      /* 【复刻模式专属·玛莉亚毕业②·中国公演路线】星梦剧院毕业公演（纯叙事，名单变动在派遣事件落地） */
      id: "m5_17_maria_grad_cn",
      title: "5月 · 星梦剧院的告别舞台",
      gate: st => st.flags.mariaGrad === "china",
      pages: [
        { nar: true, t: "5月中旬，星梦剧院。铃木玛莉亚的毕业公演——从《剧场女神》唱到她刚来上海那年学会的第一首中文歌，台下的灯牌从第一排亮到了最后一排。" },
        { nar: true, t: "安可之前，她对着镜头用中文说了很长的一段话，最后一句是：「这条河载过我两年——以后，换我在东京替它应援。」\n\n次日，她启程回日本。兼任结束，合约体面终止。" },
      ],
    },
    {
      /* 【复刻模式专属·玛莉亚毕业③】日方派遣①：北原里英兼任（仅赴日路线），玩家为其选择队伍 */
      id: "m5_17_kitahara",
      title: "5月 · 日方派遣① · 北原里英",
      gate: st => st.flags.mariaGrad === "japan" && !!st.decisions.mariaInvite && !st.decisions.kitahara17,
      pages: [
        { nar: true, t: "东京毕业公演落幕后一周，日方的派遣函到了：AKB48 现役成员北原里英，将以兼任形式加入 SNH48，档期一整个下半年。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（翻着资料）北原里英——AKB48 的老资历，综艺感一绝， 秋叶原的门面之一。总监，她落到哪支队伍，那支队伍下半年的话题度就稳了。" },
      ],
      choices: [
        { label: "兼任 Team SII", hint: "回到玛莉亚与宫泽佐江的老地方，无缝衔接",
          tag: "kitahara17", value: "SII",
          effect: st => { if (!st.members.some(x => x.name === "北原里英")) st.members.push({ id: "kitahara17", name: "北原里英", team: "SII", gen: "AKB48派遣", pop: 52, bond: 15, status: "active", pwr: 28, note: "兼任（AKB48·毕业公演派遣）" }); st.heat = Math.min(100, st.heat + 3); return "任命公布：北原里英，兼任 Team SII。莫寒带着她把剧院上下走了一遍，走到当年玛莉亚的柜子前——两个人用日文聊了很久。热度+3。"; } },
        { label: "兼任 Team NII", hint: "本部人气最盛的队伍", 
          tag: "kitahara17", value: "NII",
          effect: st => { if (!st.members.some(x => x.name === "北原里英")) st.members.push({ id: "kitahara17", name: "北原里英", team: "NII", gen: "AKB48派遣", pop: 52, bond: 15, status: "active", pwr: 28, note: "兼任（AKB48·毕业公演派遣）" }); st.heat = Math.min(100, st.heat + 3); return "任命公布：北原里英，兼任 Team NII。冯薪朵笑着迎接：「欢迎欢迎，咱队又添一位前辈！」热度+3。"; } },
        { label: "兼任 Team HII", hint: "去年完成队长交接的队伍", 
          tag: "kitahara17", value: "HII",
          effect: st => { if (!st.members.some(x => x.name === "北原里英")) st.members.push({ id: "kitahara17", name: "北原里英", team: "HII", gen: "AKB48派遣", pop: 52, bond: 15, status: "active", pwr: 28, note: "兼任（AKB48·毕业公演派遣）" }); st.heat = Math.min(100, st.heat + 3); return "任命公布：北原里英，兼任 Team HII。吴燕文说：「HII 的家人们，又多了一位前辈！」热度+3。"; } },
        { label: "兼任 Team X", hint: "起点最低、冲劲最足的队伍", 
          tag: "kitahara17", value: "X",
          effect: st => { if (!st.members.some(x => x.name === "北原里英")) st.members.push({ id: "kitahara17", name: "北原里英", team: "X", gen: "AKB48派遣", pop: 52, bond: 15, status: "active", pwr: 28, note: "兼任（AKB48·毕业公演派遣）" }); st.heat = Math.min(100, st.heat + 3); return "任命公布：北原里英，兼任 Team X。全队连夜学了一句日文的欢迎词，在剧院门口等她。热度+3。"; } },
        { label: "兼任 Team XII", hint: "最年轻的队伍，最需要前辈带", 
          tag: "kitahara17", value: "XII",
          effect: st => { if (!st.members.some(x => x.name === "北原里英")) st.members.push({ id: "kitahara17", name: "北原里英", team: "XII", gen: "AKB48派遣", pop: 52, bond: 15, status: "active", pwr: 28, note: "兼任（AKB48·毕业公演派遣）" }); st.heat = Math.min(100, st.heat + 3); return "任命公布：北原里英，兼任 Team XII。娃娃们排成一排用刚学的日文鞠躬：「先辈、よろしくお愿いします！」热度+3。"; } },
      ],
    },
    {
      /* 【复刻模式专属·玛莉亚毕业④】日方派遣②：马嘉伶移籍（两条路线都有），玩家为其选择队伍；
         玛莉亚退团在本事件内生效（兼任结束，毕业公演已办） */
      id: "m5_17_maria_dispatch",
      title: "5月 · 日方派遣② · 马嘉伶",
      gate: st => !!st.flags.mariaGrad && st.decisions.mariaDispatch !== undefined && !st.decisions.mariaCard17 && (st.flags.mariaGrad === "china" || !!st.decisions.kitahara17),
      pages: [
        { nar: true, t: "派遣函的最后一页，是另一个名字：马嘉伶——AKB48 台湾选拔招募成员，这次将正式移籍 SNH48，成为这条河的在籍成员。" },
        { s: "马嘉伶", cls: "", t: "（用还有些生涩的中文自我介绍）大家好，我是马嘉伶。从今天起，请多指教！我想在这里，唱属于自己的歌。" },
        { s: "王婧", cls: "speaker-wangjing", t: "台湾选拔出身，国语也恢复得快，日粉基础也有——落到哪支队伍，总监你定。另外，玛莉亚的退团手续也一并办了：兼任结束，体面毕业。" },
      ],
      choices: [
        { label: "加入 Team SII", hint: "回到铃木玛莉亚待过的地方，日方情分最重",
          tag: "mariaCard17", value: "SII",
          effect: st => { if (!st.members.some(x => x.name === "马嘉伶")) st.members.push({ id: "morialin17", name: "马嘉伶", team: "SII", gen: "AKB48台湾选拔", pop: 38, bond: 15, status: "active", pwr: 17, note: "AKB48 台湾选拔招募·移籍加入" }); const m = st.members.find(x => x.name === "铃木玛莉亚"); if (m) { m.status = "left"; m.note = "2017-05 AKB48毕业·兼任结束（毕业公演：东京）"; } return "马嘉伶，Team SII。她在自我介绍里提到了玛莉亚的名字：「是她告诉我，这条河值得来。」\n\n（名单更新：马嘉伶 入队；铃木玛莉亚 离团——兼任结束，体面毕业。）"; } },
        { label: "加入 Team NII", hint: "本部人气最盛的队伍",
          tag: "mariaCard17", value: "NII",
          effect: st => { if (!st.members.some(x => x.name === "马嘉伶")) st.members.push({ id: "morialin17", name: "马嘉伶", team: "NII", gen: "AKB48台湾选拔", pop: 38, bond: 15, status: "active", pwr: 17, note: "AKB48 台湾选拔招募·移籍加入" }); const m = st.members.find(x => x.name === "铃木玛莉亚"); if (m) { m.status = "left"; m.note = "2017-05 AKB48毕业·兼任结束（毕业公演：东京/上海）"; } return "马嘉伶，Team NII。黄婷婷牵着她的手向全队介绍：“从秋叶原来的一员大将。”\n\n（名单更新：马嘉伶 入队；铃木玛莉亚 离团——兼任结束，体面毕业。）"; } },
        { label: "加入 Team HII", hint: "去年完成队长交接的队伍",
          tag: "mariaCard17", value: "HII",
          effect: st => { if (!st.members.some(x => x.name === "马嘉伶")) st.members.push({ id: "morialin17", name: "马嘉伶", team: "HII", gen: "AKB48台湾选拔", pop: 38, bond: 15, status: "active", pwr: 17, note: "AKB48 台湾选拔招募·移籍加入" }); const m = st.members.find(x => x.name === "铃木玛莉亚"); if (m) { m.status = "left"; m.note = "2017-05 AKB48毕业·兼任结束（毕业公演：东京/上海）"; } return "马嘉伶，Team HII。吴燕文把队里的规矩一条条讲给她听——她听得比谁都认真。\n\n（名单更新：马嘉伶 入队；铃木玛莉亚 离团——兼任结束，体面毕业。）"; } },
        { label: "加入 Team X", hint: "起点最低、冲劲最足的队伍",
          tag: "mariaCard17", value: "X",
          effect: st => { if (!st.members.some(x => x.name === "马嘉伶")) st.members.push({ id: "morialin17", name: "马嘉伶", team: "X", gen: "AKB48台湾选拔", pop: 38, bond: 15, status: "active", pwr: 17, note: "AKB48 台湾选拔招募·移籍加入" }); const m = st.members.find(x => x.name === "铃木玛莉亚"); if (m) { m.status = "left"; m.note = "2017-05 AKB48毕业·兼任结束（毕业公演：东京/上海）"; } return "马嘉伶，Team X。全队拉着她拍了张合照，配文：“新家人，报到！”\n\n（名单更新：马嘉伶 入队；铃木玛莉亚 离团——兼任结束，体面毕业。）"; } },
        { label: "加入 Team XII", hint: "最年轻的队伍，同龄人最多",
          tag: "mariaCard17", value: "XII",
          effect: st => { if (!st.members.some(x => x.name === "马嘉伶")) st.members.push({ id: "morialin17", name: "马嘉伶", team: "XII", gen: "AKB48台湾选拔", pop: 38, bond: 15, status: "active", pwr: 17, note: "AKB48 台湾选拔招募·移籍加入" }); const m = st.members.find(x => x.name === "铃木玛莉亚"); if (m) { m.status = "left"; m.note = "2017-05 AKB48毕业·兼任结束（毕业公演：东京/上海）"; } return "马嘉伶，Team XII。娃娃们围着她说要学日文，她笑着说先教会大家国语歌。\n\n（名单更新：马嘉伶 入队；铃木玛莉亚 离团——兼任结束，体面毕业。）"; } },
      ],
    },
  ],

  /* ---------- 6月：总选冲刺 + 重庆中期检查 ---------- */
  6: [
    {
      id: "m6_17_ge_strategy",
      title: "总选冲刺会议",
      pages: [
        { s: "叶盛", cls: "speaker-yesheng", t: "总决选倒计时一个月。资源清单在这儿——镜头、通告、物料，怎么分，老规矩，你说了算。" },
        { s: "王婧", cls: "speaker-wangjing", t: "提醒一句：今年是「我心翱翔」。想飞多高，看你把风给谁。" },
      ],
      choices: [
        { label: "集中火力：把资源押在人气最高者身上", hint: "冲冠概率大增，热度收益高，士气-6", tag: "geStrategy", value: "focus",
          effect: st => { st.geStrategy = "focus"; return "资源表格被重新排过：镜头、通告、物料，全部向头部倾斜。有人欢喜有人沉默——但这就是竞技。"; } },
        { label: "雨露均沾：让每个孩子都有舞台", hint: "全团士气+8，羁绊整体提升，冲榜收益降低", tag: "geStrategy", value: "balance",
          effect: st => { st.geStrategy = "balance"; return "你把计划表摊开，给每一个报名的孩子都留了位置。叶盛在旁边轻轻说了句：「像你这种排法，旧运营可从来不排。」"; } },
      ],
    },
    {
      id: "m6_17_ckg_check",
      title: "重庆筹备 · 中期检查",
      gate: st => st.branch17 && st.branch17.ckg >= 1 && !st.branch17.ckgOpen,
      pages: st => st.branch17.ckg >= 2
        ? [
            { s: "孟波", cls: "speaker-mengbo", t: "（视频会议）总监，重庆剧场改造过半，娃们的集训也上了正轨！再给我点时间，十月底，给你一个山城奇迹！" },
            { s: "叶盛", cls: "speaker-yesheng", t: "孟波的进度我盯过，是真扎实。缺的不是能力，是总部这边的一句话——让他知道后头有人。" },
          ]
        : [
            { s: "孟波", cls: "speaker-mengbo", t: "（视频会议，背景是毛坯状态的剧场）总监，钱到账了就开工，山城的坡再陡，也没有这条河爬不过的坎！" },
          ],
      choices: [
        { label: "追加一笔机动预算给他", hint: "资金-20 热度+3", tag: "ckgCheck17", value: "fund",
          effect: st => { st.money = Math.max(0, st.money - 20); st.heat = Math.min(100, st.heat + 3); return "二十万机动预算当天划到重庆。孟波回了一张工地照片，配文：「灯在路上了。」资金-20，热度+3。"; } },
        { label: "以鼓励为主，钱省给本部", hint: "士气+3", tag: "ckgCheck17", value: "cheer",
          effect: st => { st.morale = Math.min(100, st.morale + 3); return "你在会上公开表扬了重庆筹备组。孟波把这段录音设成了工地的起床铃。士气+3。"; } },
      ],
    },
  ],

  /* ---------- 7月：总决选之夜 ---------- */
  7: [
    {
      id: "m7_17_election",
      title: "7月29日 · 「我心翱翔」第四届总决选",
      pages: [
        { nar: true, t: "7月29日，上海梅赛德斯-奔驰文化中心。\n\n「我心翱翔」——第四届偶像年度人气总决选。四支分团的旗帜第一次与五支本部队旗同场升起，一万八千支应援棒汇成一片会呼吸的海。\n\n今晚的总决选，可能诞生这条河的第一个连霸传奇。（结果见结算画面）" },
      ],
    },
  ],

  /* ---------- 8月：夏日巡演 + 荣誉殿堂制度宣布（未连霸路线） ---------- */
  8: [
    {
      id: "m8_17_summer",
      title: "夏日巡演",
      pages: [
        { s: "叶盛", cls: "speaker-yesheng", t: "暑期巡演的报价来了。今年多了一个选项——巡演途中可以带上排练老师，白天赶路晚上集训。怎么排，你定。" },
      ],
      choices: [
        { label: "连跑五城，商业收益拉满", hint: "资金+130 士气-10 热度+6", tag: "summerMode17", value: "tour",
          effect: st => { st.money += 130; st.morale = Math.max(0, st.morale - 10); st.heat = Math.min(100, st.heat + 6); return "五城巡演场场爆满，回程大巴上安静得可怕——所有人都累得睡着了。资金+130，热度+6，士气-10。"; } },
        { label: "只跑三城，巡演带集训", hint: "资金+70 训练度+10 全团实力+1", tag: "summerMode17", value: "compact",
          effect: st => { st.money += 70; st.train = Math.min(100, st.train + 10); Game.gainAllPwr(st, 1); return "三城巡演+随团集训，白天演出晚上抠动作。演出商骂骂咧咧，但孩子们的进步骗不了人。资金+70，训练度+10，全团实力+1。"; } },
      ],
    },
    {
      /* 【荣誉殿堂·未连霸路线】鞠婧祎未夺冠：宣布设立升堂制度，鞠婧祎保持在籍、不升堂。 */
      id: "m8_17_hall_announce",
      title: "8月 · 荣誉殿堂制度设立",
      gate: st => st.flags.hall17 && !st.flags.jjyHall17,
      pages: [
        { nar: true, t: "总选举的余温还没散。八月的经营会上，王子杰拍板：正式设立「荣誉殿堂」制度——金边成员卡、殿堂徽标、脱离队伍编制往影视与个人方向发展、不再参加总选举。" },
        { s: "王子杰", cls: "speaker-wangzj", t: "殿堂的大门今年没有开——因为还没人够格。但规则先立在这儿：连续两年总选第一，升堂。明年，看你们的。" },
        { s: "鞠婧祎", cls: "", t: "（会后，在走廊里拦住你）总监，今年差了一步。明年，我想亲手把那张金边卡，从您手里接过来。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（目送她走远）好胜心一点没少。总监，制度立了，标尺也立了——明年的总选，有得看了。" },
        { nar: true, t: "（荣誉殿堂制度已宣布：暂无成员升堂。鞠婧祎保持在籍状态，继续与队伍一起冲明年的总选举。）" },
      ],
    },
    {
      /* 【BEJ48 分团线·兼任 tag】夏越回归申请（接 4 月 m4_17_xiayue_rest 暂休） */
      id: "m8_17_xiayue_return",
      title: "8月 · 夏越的回归申请",
      gate: st => !!(st.flags.concur17 && st.flags.concur17["BEJ48"]) && !!st.members.find(x => x.name === "夏越" && x.status === "rest"),
      pages: [
        { nar: true, t: "四个月过去，北京转来第二份文件——还是夏越：这次的申请抬头写的是「回归」。她在信里说，休息让她想清楚了，她想回到 Team B 的舞台上。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把申请放到你面前）分团队长那边的意见是「欢迎回来」。但按合同，自行离团期间的违约条款还挂在那里——要不要拿这个说事，看您。" },
      ],
      choices: [
        { label: "允许回归，恢复 Team B 在籍", hint: "夏越回归原队伍（士气+2 羄绊+3）",
          tag: "xiayue17", value: "return",
          effect: st => { const m = st.members.find(x => x.name === "夏越"); if (m) { m.status = "branch"; m.branchTeam = "BEJ48"; m.team = "BEJ48"; m.branchLabel = "Team B"; m.note = "2017-08 回归"; } st.morale = Math.min(100, st.morale + 2); return "回归公示贴出当天，Team B 的孩子们在剧院门口拉了横幅。夏越红着眼眶给每个人鞠了个躬——「这次，我不会再中途下车了。」（士气+2。）"; } },
        { label: "拒绝申请，按合同追讨违约金解约", hint: "资金+20；夏越移入已离团（士气-2）",
          tag: "xiayue17", value: "reject",
          effect: st => { const m = st.members.find(x => x.name === "夏越"); if (m) { m.status = "left"; m.note = "2017-08 拒绝回归申请·违约金解约"; } st.money += 20; st.morale = Math.max(0, st.morale - 2); return "法务按条款办结了手续，违约金如数到账——但北京分团的孩子私底下议论了半个月。规则立住了，人心碎了一角。（资金+20，士气-2。）"; } },
      ],
    },
    {
      /* 【GNZ48 分团线·兼任 tag 且非复刻】《双面偶像》大获好评；叶盛提议复刻到本部，
         但上海/广州剧场设备与场地差异大、道具与控台配合要求高。tag shuangmian17：plan（2018 回收）/ giveup */
      id: "m8_17_shuangmian",
      title: "8月 · 《双面偶像》的好评与难题",
      gate: st => ((st.decisions && st.decisions.jpMode) || st.jpMode) !== "replicate" && !!(st.flags.concur17 && st.flags.concur17["GNZ48"]),
      pages: [
        { nar: true, t: "广州传来捷报：GNZ48 原创公演《双面偶像》首演季大获好评——本地媒体给了「今年最完整的原创舞台」的评价，票房连续三周看涨。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把广州的复盘报告推过来）我提议把《双面偶像》复刻到本部来演。但我自己也得先泼半盆冷水——上海剧场和广州剧场的设备、台深、吊杆点位都不一样，复刻难度不小。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "更麻烦的是，这套公演的道具换景和控台配合要求极高，广州那边磨了一个月才顺。搬到上海，等于要重新磨一遍。" },
        { s: "王婧", cls: "speaker-wangjing", t: "（翻着技术清单）钱不是大问题，人手和时间才是。坚持，还是暂缓——总监你定。" },
      ],
      choices: [
        { label: "坚持复刻，明年仔细研究", hint: "留下技术预研决议（2018 线回收）；热度+2",
          tag: "shuangmian17", value: "plan",
          effect: st => { st.heat = Math.min(100, st.heat + 2); return "你在决议上签了字：立项预研，明年择机落地。广州团队听到消息，连夜把道具清单和控台点位表发来了上海。热度+2。\n\n（决策已登记：shuangmian17=plan——复刻工程留待 2018 回收。）"; } },
        { label: "暂时放弃复刻", hint: "各自安好，不作强求",
          tag: "shuangmian17", value: "giveup",
          effect: st => { return "你把报告合上：“好舞台留在它生根的地方。”广州的孩子们继续演他们的《双面偶像》，本部的排片一切照旧。"; } },
      ],
    },
  ],

  /* ---------- 9月：八期生入队 + 赵嘉敏事件（2016 zhaoMin 回收） ---------- */
  9: [
    {
      id: "m9_17_gen8",
      title: "9月 · 八期生入队",
      pages: [
        { nar: true, t: "九月，八期生的最后一批新人入队。从四月首批五人算起，这一年共有十二个名字写进了八期生的名册——郭倩芸、金莹玥、林歆源……还有一群从几千人里走出来的姑娘。\n\n她们以预备生的身份开始晨功，梦想着有一天站上正式的舞台。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（翻着新名册）总监，去年我们说「实力」是关键词——新娃娃们的实力评估表我放你桌上了。底子薄，但胜在年轻。特训安排上，别心疼预算。" },
      ],
    },
    {
      /* 【赵嘉敏·史实路线回收】2016年6月 zhaoMin=rest（含旧档未登记，默认史实）：
         赵母登门要求无责解约，公司无法接受，赵母放话起诉。
         ①违约金必须收回 → 合同冻结（史实）：维持暂休，登记 zhaoMin17=freeze；
         ②无责解约 → 放弃违约金放人，移入已离团，zhaoMin17=release。
         2016 已选解约（terminate）则她已离团，本事件不再触发。 */
      id: "m9_17_zhao_mother",
      title: "9月 · 不速之客",
      gate: st => {
        const z = st.decisions ? st.decisions.zhaoMin : undefined;
        if ((z || "rest") !== "rest") return false;
        const m = st.members.find(x => x.name === "赵嘉敏");
        return !!m && m.status !== "left";
      },
      pages: [
        { nar: true, t: "九月的一个上午，前台的电话直接打到了你桌上：一位自称赵嘉敏母亲的女士没有预约，已经在会客室坐下了。\n\n她面前的茶一口没动，膝上放着一只文件袋。" },
        { s: "赵母", cls: "", t: "总监，我今天只办一件事：我女儿和公司的合约，现在就解。无责，无条件——当初进公司的时候她还没满十八岁，这几年她给公司挣的，早就超过当初的培养了。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（在你身后压低声音）合同还有两年多才到期……她是一期生、第二届总选冠军，公司这些年的资源全是押着她砸下去的。按合同，这个节点解约，违约金一分都不能少。" },
        { s: "赵母", cls: "", t: "违约金？孩子现在连舞台都上不了，是你们把人晾了一年多！行——你们不放人，我们就法院见。到时候头条上写的，可就不只是违约金的事了。" },
        { s: "王婧", cls: "speaker-wangjing", t: "（等赵母离开后，在你对面坐下）她是铁了心要把事情闹大。官司对谁都不好看——但合同就是合同。总监，两条路，你挑。" },
      ],
      choices: [
        { label: "违约金必须收回——冻结合同，公司奉陪", hint: "史实路线：合同冻结·诉讼期间暂停一切活动（士气-2 热度+3）",
          tag: "zhaoMin17", value: "freeze",
          effect: st => {
            const m = st.members.find(x => x.name === "赵嘉敏");
            if (m) { if (m.status === "active") m.status = "rest"; m.note = "合同冻结：违约金争议诉讼中，暂停一切团体活动"; }
            st.morale = Math.max(0, st.morale - 2); st.heat = Math.min(100, st.heat + 3);
            return "你请法务把合同副本推到桌子对面：「解约可以，违约金一分不能少——这是白纸黑字的规矩。要起诉，公司奉陪。」\n\n一周后，法院的传票真的寄到了公司。诉讼期间，赵嘉敏的合同被正式冻结：不参加任何活动，也解约不了，两边就这么惯性地僵着。\n\n（决策已登记：zhaoMin17=freeze。士气-2，热度+3——这桩官司成了圈内人茶余饭后的谈资。）";
          } },
        { label: "算了——她为公司带来过收益，别耽误孩子", hint: "无责解约：放弃违约金，赵嘉敏移入已离团（士气+3 热度-2）",
          tag: "zhaoMin17", value: "release",
          effect: st => {
            const m = st.members.find(x => x.name === "赵嘉敏");
            if (m) { m.status = "left"; m.note = "协商解除合约（公司放弃违约金）"; }
            st.morale = Math.min(100, st.morale + 3); st.heat = Math.max(0, st.heat - 2);
            return "你在解约协议上签了字，又在违约金一栏亲手划了个零。\n\n「她替这条河打过江山。这笔钱，公司不要了——别耽误孩子的发展。」\n\n赵母愣了好几秒，站起来连声道谢。消息传出，排练室里安静了一会儿，有人说「公司这单亏了」，也有人小声回了一句：「跟着这样的公司，值。」\n\n（决策已登记：zhaoMin17=release。士气+3，热度-2。）";
          } },
      ],
    },
    {
      /* 【赵嘉敏·学业线回收】2016年6月 zhaoMin=study（延迟毕业）：本年学业完成，
         表示可以归队。归队后由玩家依次决定：队伍归属 → 队长/副队长 → 兼任分团 →
         是否加入小分队（空降 7SENSES 会替代一人，被替代者不满）。 */
      id: "m9_17_zhao_back",
      title: "9月 · 学成归来",
      gate: st => {
        const z = st.decisions ? st.decisions.zhaoMin : undefined;
        if (z !== "study") return false;
        const m = st.members.find(x => x.name === "赵嘉敏");
        return !!m && m.status !== "left";
      },
      pages: [
        { nar: true, t: "九月初，一份学位证明和一封亲笔信一起送到你桌上——赵嘉敏，毕业了。\n\n信不长，最后一句是：「我知道我欠舞台一整个告别，也欠它一个回归。」" },
        { s: "赵嘉敏", cls: "", t: "总监，书读完了。这一年我一天都没敢松——功课之外，功也没断过。只要公司点头，我随时可以归队。合约怎么安排、我站哪个位置，都听您的。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（翻着名册）她的名字一直留着——暂休，不是离团。不过总监，她的安排不是一句话的事：队伍、职务、兼任、小分队，一样一样来，每一样都牵动人心。" },
      ],
      choices: [
        { label: "欢迎归队，逐一安排她的位置", hint: "赵嘉敏恢复在籍（士气+3 热度+4）",
          tag: "zhaoMin17", value: "back",
          effect: st => {
            const m = st.members.find(x => x.name === "赵嘉敏");
            if (m) { m.status = "active"; m.note = "2017-09 学成归队"; }
            st.flags.zhaoBack = true;
            st.morale = Math.min(100, st.morale + 3); st.heat = Math.min(100, st.heat + 4);
            return "公告只有一句话：「赵嘉敏，归队。」\n\n那天，剧场外的应援横幅一路挂到了马路对面。离开四百多天，她的名字第一次重新出现在公演名单上——首演那晚的安可，全场喊的是她的名字。\n\n（决策已登记：zhaoMin17=back；士气+3，热度+4。接下来请依次确认：队伍归属 → 职务 → 分团兼任 → 小分队。）";
          } },
      ],
    },
    {
      /* 【学业线·后续①】队伍归属（gate：flags.zhaoBack，本事件链随前置选项惰性解锁） */
      id: "m9_17_zhao_team",
      title: "归队安排① · 队伍归属",
      gate: st => !!st.flags.zhaoBack,
      pages: [
        { s: "叶盛", cls: "speaker-yesheng", t: "总监，先定队伍。SII 是她的老家，老队友都还在——但 二届冠军落到哪支队，哪支队就是下半年的头条。五支队伍，你指哪支她去哪支。" },
      ],
      choices: [
        { label: "回归 Team SII", hint: "史实位置：与莫寒、陈观慧等老队友重聚",
          tag: "zhaoTeam17", value: "SII",
          effect: st => { const m = st.members.find(x => x.name === "赵嘉敏"); if (m) m.team = "SII"; return "归队名单上写的是 Team SII——一切像没变过，又什么都变了。莫寒在练习室门口堵住她，两个人抱在一起笑了半天。"; } },
        { label: "转入 Team NII", hint: "冯薪朵、黄婷婷的队伍，本部人气最盛",
          tag: "zhaoTeam17", value: "NII",
          effect: st => { const m = st.members.find(x => x.name === "赵嘉敏"); if (m) m.team = "NII"; return "名单贴出：赵嘉敏，Team NII。冯薪朵代表全队来接人：「欢迎，咱队添丁了。」"; } },
        { label: "转入 Team HII", hint: "去年队长离团后重组的队伍，需要一位老将压阵",
          tag: "zhaoTeam17", value: "HII",
          effect: st => { const m = st.members.find(x => x.name === "赵嘉敏"); if (m) m.team = "HII"; return "名单贴出：赵嘉敏，Team HII。吴燕文松了口气——队里终于来了一位「定心」的前辈。"; } },
        { label: "转入 Team X", hint: "吴哲晗的队伍，起点最低、冲劲最足",
          tag: "zhaoTeam17", value: "X",
          effect: st => { const m = st.members.find(x => x.name === "赵嘉敏"); if (m) m.team = "X"; return "名单贴出：赵嘉敏，Team X。全队连夜把应援色改成了双份。"; } },
        { label: "转入 Team XII", hint: "最年轻的队伍，最需要一位镇场的老将",
          tag: "zhaoTeam17", value: "XII",
          effect: st => { const m = st.members.find(x => x.name === "赵嘉敏"); if (m) m.team = "XII"; return "名单贴出：赵嘉敏，Team XII。娃娃们排成一排鞠躬：「前辈好！」她笑着摆手：「叫我名字就行。」"; } },
      ],
    },
    {
      /* 【学业线·后续②】职务任命（队长/副队长字段 captain/vice，成员卡会显示徽标） */
      id: "m9_17_zhao_role",
      title: "归队安排② · 职务任命",
      gate: st => !!st.flags.zhaoBack,
      pages: [
        { s: "叶盛", cls: "speaker-yesheng", t: "队伍定了。职务呢——她资历最老、名气最大，可「空降干部」四个字，您得掂量掂量队里老人们的想法。" },
      ],
      choices: [
        { label: "不担任职务，先当普通队员", hint: "平稳过渡（士气+1）",
          tag: "zhaoRole17", value: "none",
          effect: st => { const m = st.members.find(x => x.name === "赵嘉敏"); if (m) { m.captain = false; m.vice = false; } st.morale = Math.min(100, st.morale + 1); return "你在任职栏填了「无」。她愣了一下，随即笑了：「挺好，我想先把舞跳明白。」先当队员，再论其他——队里的老人们都看在眼里。士气+1。"; } },
        { label: "出任副队长", hint: "空降干部：队内有微词（士气-1）",
          tag: "zhaoRole17", value: "vice",
          effect: st => {
            const m = st.members.find(x => x.name === "赵嘉敏");
            if (m) {
              m.captain = false; m.vice = true;
              for (const x of st.members) if (x !== m && x.team === m.team && x.status === "active" && x.vice) x.vice = false;
            }
            st.morale = Math.max(0, st.morale - 1);
            return "任命公示：赵嘉敏出任副队长。公告栏前有人小声嘟囔「一来就是干部」，但更多的人盯着她的名字发呆——二届冠军，到底是不一样。士气-1。";
          } },
        { label: "出任队长", hint: "空降队长：现任队长卸任，队内震动（士气-3）",
          tag: "zhaoRole17", value: "captain",
          effect: st => {
            const m = st.members.find(x => x.name === "赵嘉敏");
            if (m) {
              m.vice = false; m.captain = true;
              for (const x of st.members) if (x !== m && x.team === m.team && x.status === "active" && x.captain) x.captain = false;
            }
            st.morale = Math.max(0, st.morale - 3);
            return "任命公示：赵嘉敏出任队长，原队长卸任。公示贴出的当晚，队长就收拾好了东西搬去了楼下——「我服气她的资历，但感情上，给我点时间。」士气-3。";
          } },
      ],
    },
    {
      /* 【学业线·后续③】分团兼任（保留本部在籍，与离团表「兼任」同口径；CKG48 尚在筹备不列）。
         注：分团事件的门控 tag（flags.concur17）由 2016「下一站」决定（carryTo2017 统一登记），
         与成员个人兼任无关——见 docs/STORY.md「分团事件门控约定」。 */
      id: "m9_17_zhao_concur",
      title: "归队安排③ · 分团兼任",
      gate: st => !!st.flags.zhaoBack,
      pages: [
        { s: "王婧", cls: "speaker-wangjing", t: "另外，分团那边也开了口——三座开业的城都想要「总选冠军」这块牌。兼任不影响本部在籍，好处是拉动分团票房，代价是她的精力。重庆的 CKG48 还在筹备，这次就不列入了。" },
      ],
      choices: [
        { label: "不兼任，专注本部", hint: "养精力，先站稳",
          tag: "zhaoConcur17", value: "none",
          effect: st => { return "你在兼任栏填了「无」。先本部，后分团——稳字当头。"; } },
        { label: "兼任 BEJ48（北京）", hint: "拉动北京票房：热度+2",
          tag: "zhaoConcur17", value: "BEJ48",
          effect: st => { const m = st.members.find(x => x.name === "赵嘉敏"); if (m) m.note = (m.note ? m.note + "；" : "") + "兼任 BEJ48（保留本部在籍）"; st.heat = Math.min(100, st.heat + 2); return "每月两趟北京的兼任排上了日程。悠唐星梦剧院的票，从她第一次登台那个周末开始，场场售罄。热度+2。"; } },
        { label: "兼任 GNZ48（广州）", hint: "拉动广州票房：热度+2",
          tag: "zhaoConcur17", value: "GNZ48",
          effect: st => { const m = st.members.find(x => x.name === "赵嘉敏"); if (m) m.note = (m.note ? m.note + "；" : "") + "兼任 GNZ48（保留本部在籍）"; st.heat = Math.min(100, st.heat + 2); return "每月两趟广州的兼任排上了日程。周马发来感谢函，附带一张她首次登台的全场大合影。热度+2。"; } },
        { label: "兼任 SHY48（沈阳）", hint: "需 SHY48 已开业：拉动沈阳票房 热度+2",
          tag: "zhaoConcur17", value: "SHY48",
          gate: st => st.branch17 && st.branch17.shyOpen,
          effect: st => { const m = st.members.find(x => x.name === "赵嘉敏"); if (m) m.note = (m.note ? m.note + "；" : "") + "兼任 SHY48（保留本部在籍）"; st.heat = Math.min(100, st.heat + 2); return "每月两趟沈阳的兼任排上了日程。东北的粉丝们用最亮的灯牌欢迎她：「老妹儿，可算来了！」热度+2。"; } },
      ],
    },
    {
      /* 【学业线·后续④】小分队：空降 7SENSES 会替代一位成员（取羁绊最低者，其不满） */
      id: "m9_17_zhao_squad",
      title: "归队安排④ · 小分队",
      gate: st => !!st.flags.zhaoBack,
      pages: [
        { s: "叶盛", cls: "speaker-yesheng", t: "最后一件——四月成立的小分队 7SENSES，七个位置现在是满的。让二届冠军空降进去，实力和名气都没得说；但有人就得挪位置，被顶下来那位……您想想那心思。" },
      ],
      choices: [
        { label: "不加入小分队", hint: "不动 7SENSES 的既有默契",
          tag: "zhaoSquad17", value: "stay",
          effect: st => { return "你在小分队一栏画了个圈，什么也没写。7SENSES 的七个人谁都没动——默契是攒出来的，别轻易拆。"; } },
        { label: "空降加入 7SENSES", hint: "热度+3；被替代者（羁绊最低者）不满：其羁绊-6 士气-3",
          tag: "zhaoSquad17", value: "join",
          effect: st => {
            const m = st.members.find(x => x.name === "赵嘉敏");
            if (m) m.note = (m.note ? m.note + "；" : "") + "7SENSES成员";
            const pool = ["张语格", "许佳琪", "戴萌", "孔肖吟", "赵粤", "许杨玉琢", "陈琳"]
              .map(n => st.members.find(x => x.name === n && x.status === "active"))
              .filter(Boolean);
            let out = null;
            for (const x of pool) if (!out || (x.bond || 0) < (out.bond || 0)) out = x;
            st.heat = Math.min(100, st.heat + 3);
            st.morale = Math.max(0, st.morale - 3);
            let extra = "";
            if (out) {
              out.bond = Math.max(0, (out.bond || 0) - 6);
              out.note = (out.note ? out.note + "；" : "") + "退出 7SENSES（位置被替代）";
              extra = out.name + "的位置被替代——她嘴上说「服从安排」，那天的加练却比谁都晚走。";
            }
            return "官宣当天，7SENSES 的百科词条多了一个名字：赵嘉敏。粉丝欢呼「全明星阵容」，热榜挂了一晚。" + extra + "（热度+3，士气-3。）";
          } },
      ],
    },
    {
      /* 【学业线·收尾】归队安排汇总（纯叙事，确认完四项后自动触发） */
      id: "m9_17_zhao_settle",
      title: "归队安排 · 落定",
      gate: st => !!st.flags.zhaoBack && !!(st.decisions && st.decisions.zhaoSquad17),
      pages: st => {
        const d = st.decisions;
        const m = st.members.find(x => x.name === "赵嘉敏");
        const role = d.zhaoRole17 === "captain" ? "队长" : d.zhaoRole17 === "vice" ? "副队长" : "队员";
        const concur = d.zhaoConcur17 && d.zhaoConcur17 !== "none" ? " · 兼任" + d.zhaoConcur17 : "";
        const squad = d.zhaoSquad17 === "join" ? " · 7SENSES" : "";
        return [
          { nar: true, t: "月末的干部会上，叶盛把新名册投上大屏：\n\n「赵嘉敏——Team " + (m ? m.team : d.zhaoTeam17) + " · " + role + concur + squad + "。归队手续，全部办妥。」\n\n两页纸的安排，一下午谈完。散会时她追到走廊，朝你深深鞠了一躬：「总监——这次，我会把欠舞台的，都补回来。」" },
        ];
      },
    },
  ],

  /* ---------- 10月：CKG48 首演 + 五周年 ---------- */
  10: [
    {
      id: "m10_17_ckg_debut",
      title: "10月27日 · CKG48 首演",
      gate: st => st.branch17 && st.branch17.ckgOpen,
      pages: [
        { nar: true, t: "开业首演的庆功宴上，孟波端着火锅底料味的饮料挨桌敬酒。\n\n重庆的灯亮了——这条河的支流，从此在长江上游安了家。而你在开业看板上，写下了下一年的畅想。（详见开业事件）" },
      ],
    },
    {
      id: "m10_17_anniv",
      title: "10月14日 · 五周年特别公演",
      pages: [
        { nar: true, t: "10月14日，星梦剧院五周年特别公演。\n\n大屏上，从2012年那个二十六人的排练厅，一路放到今天：五支本部队伍、四座城市、六座剧院、几万个名字。放完最后一帧，全场起立鼓掌，有人举着「五年了，幸好是你」的灯牌。" },
      ],
      choices: [
        { label: "五周年惊喜企划（花费40万）", hint: "热度+10 士气+6", tag: "annivMode17", value: "surprise",
          effect: st => { st.money = Math.max(0, st.money - 40); st.heat = Math.min(100, st.heat + 10); st.morale = Math.min(100, st.morale + 6); return "你请回了几位毕业成员录惊喜VCR，最后一句齐声的「五岁生日快乐」让台下哭倒一片。热度+10，士气+6。"; } },
        { label: "一切从简，把预算留给年底", hint: "资金+20 士气-2", tag: "annivMode17", value: "simple",
          effect: st => { st.money += 20; st.morale = Math.max(0, st.morale - 2); return "周年公演朴素而扎实。孩子们说：唱好歌，就是最好的纪念。资金+20，士气-2。"; } },
      ],
    },
  ],

  /* ---------- 11月：风尚大赏 + 大赏预热 ---------- */
  11: [
    {
      id: "m11_17_fengshang",
      title: "11月18日 · 第三届风尚大赏",
      pages: st => [
        { nar: true, t: "11月18日，SNH48 GROUP第三届年度风尚大赏。\n\n戴萌捧起了风尚大赏的奖杯——这个属于「时尚表现力」的奖项，第一次让圈内媒体认真讨论起48系女孩的可塑性。" },
        { s: "阿吉", cls: "speaker-aji", t: st.flags && st.flags.aji ? "（把剪报递给你）总监，时尚圈的门这回真的敲开了。趁热打铁？" : "（风尚大赏的通稿登上了多家时尚媒体——运营部的年轻人把剪报贴满了公告板。）" },
      ],
      choices: [
        { label: "趁热打铁，加投时尚资源", hint: "资金-20 热度+6", tag: "fengshang17", value: "push",
          effect: st => { st.money = Math.max(0, st.money - 20); st.heat = Math.min(100, st.heat + 6); return "一组时尚大片拍完，杂志封面接连上刊。「偶像团体」和「时尚资源」这两个词，第一次被写进了同一段通稿。资金-20，热度+6。"; } },
        { label: "低调庆功，见好就收", hint: "士气+2", tag: "fengshang17", value: "calm",
          effect: st => { st.morale = Math.min(100, st.morale + 2); return "庆功宴设在剧场旁的小馆子，戴萌举着奖杯挨桌碰了一圈。士气+2。"; } },
      ],
    },
    {
      id: "m11_17_rt",
      title: "金曲大赏投票开启",
      gate: st => !st.rtDone,
      pages: [
        { s: "叶盛", cls: "speaker-yesheng", t: "年度金曲大赏投票通道开启——BEST 50。总监，今年有个特别的点：如果我们的原创公演有曲目入围，那就是这条河第一次用自己的歌收官。" },
        { s: "王婧", cls: "speaker-wangjing", t: "十到十二月是大赏筹备期。总选举证明流量，金曲大赏证明实力——别松手。" },
      ],
    },
    {
      /* 【2017 通用】葛佳慧：八期生首秀公演迟迟未至，要求解约离团（招募时以音乐合作为目的；
         入团实力略高于同期，见 engine joining 特例）。tag gejiahui17：release（解约）/ promise（2018 回收） */
      id: "m11_17_gejiahui",
      title: "11月 · 葛佳慧的辞呈",
      gate: st => !!st.members.find(x => x.name === "葛佳慧" && x.status === "active") && !st.decisions.gejiahui17,
      pages: [
        { nar: true, t: "预备生名册翻到第九页，叶盛把一份辞呈轻轻放在你桌上——葛佳慧，八期生，入团刚满两个月。" },
        { s: "葛佳慧", cls: "", t: "总监，对不起。招募的时候我就说过，我最想要的其实是一次正式的音乐合作——可入团到现在，八期生的首秀公演还没有影。我不想再等了。违约金我出，我想解约。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（在你耳边，声音压得很低）总监，再想想——她的实力和履历，是这一期里最亮眼的。放走她，等于把八期生的门面拱手让人。" },
        { s: "王婧", cls: "speaker-wangjing", t: "（合上笔记本）她的诉求也不算过分：一个说得过去的音乐规划。给，还是不给——你拍板。" },
      ],
      choices: [
        { label: "允许其支付违约金解约", hint: "资金+20；葛佳慧移入已离团（士气-3）",
          tag: "gejiahui17", value: "release",
          effect: st => { const m = st.members.find(x => x.name === "葛佳慧"); if (m) { m.status = "left"; m.note = "2017-11 支付违约金解约（寻求音乐合作）"; } st.money += 20; st.morale = Math.max(0, st.morale - 3); return "解约协议签得很快，违约金如数到账。她把预备生的名牌留在桌上，鞠躬，转身。八期生的排练室安静了整整一晚——最亮眼的那个，走的时候连首秀都还没等到。（资金+20，士气-3。）"; } },
        { label: "承诺符合她的音乐规划", hint: "保留在籍；专项音乐企划立项（2018 线回收）；士气+3",
          tag: "gejiahui17", value: "promise",
          effect: st => { const m = st.members.find(x => x.name === "葛佳慧"); if (m) m.note = "2017-11 承诺音乐规划（专项企划待落地）"; st.morale = Math.min(100, st.morale + 3); return "你把辞呈推了回去，换来一份新的备忘录：八期生首秀公演限期立项，葛佳慧的个人音乐企划写进明年规划。\n\n「给我一个舞台，我还你一个惊喜。」她在备忘录末页签了名。（士气+3。决策已登记：gejiahui17=promise——音乐企划留待 2018 回收。）"; } },
      ],
    },
  ],

  /* ---------- 12月：金曲大赏 ---------- */
  12: [
    {
      id: "m12_17_rt",
      title: "12月30日 · 年度金曲大赏 BEST 50",
      gate: st => true,
      pages: st => {
        const n = Game.origCount(st);
        return [
          { nar: true, t: "12月30日，年度金曲大赏。\n\nBEST 50 的歌单一首首揭晓。" + (n >= 2 ? "当原创公演的曲目进入年度歌单时，台下响起了最久的一次欢呼——那是属于这条河自己的旋律。" : "剧场的灯光落在每一个熟悉的旋律上，这一晚没有排名的硝烟，只有「这首歌，我们一起唱过」的回声。") + "\n\n（演出质量评价见结算画面）" },
        ];
      },
    },
  ],
};

/* ========================================================================
   五、2017 追加随机事件（引擎与 randomPool 合并取用）
   ======================================================================== */
STORY.randomPool17 = [
  {
    id: "r17_shortvideo",
    title: "短视频风口",
    text: "一段成员直拍在短视频平台意外爆火，单条播放量破千万，运营部在讨论怎么接住这波流量。",
    choices: [
      { label: "全员开号，连夜铺内容", effect: st => { st.heat = Math.min(100, st.heat + 8); st.burden = Math.min(100, st.burden + 8); return "全团的直拍账号一夜之间铺满平台。流量接住了，运营部却连加了一周的班。热度+8，叶盛负担+8。"; } },
      { label: "只给本人加推，不追风", effect: st => { st.heat = Math.min(100, st.heat + 3); st.morale = Math.min(100, st.morale + 2); return "镜头留给了那位成员，涨粉飞快；其他孩子有点眼馋，但也服气。热度+3，士气+2。"; } },
    ],
  },
  {
    id: "r17_packagemanager",
    title: "粉丝后援会年会",
    text: "几大应援会联合筹备年度年会，向运营方发出邀请，希望总监到场讲两句。",
    choices: [
      { label: "到场，认真讲两句", effect: st => { st.heat = Math.min(100, st.heat + 4); st.burden = Math.min(100, st.burden + 6); st.morale = Math.min(100, st.morale + 2); return "你从运营规划讲到明年展望，台下从将信将疑听到掌声雷动。热度+4，士气+2，叶盛负担+6。"; } },
      { label: "录一段视频发过去", effect: st => { st.heat = Math.min(100, st.heat + 2); return "视频在年会上播放，弹幕刷过一排「经理辛苦」。热度+2。"; } },
    ],
  },
];

/* ========================================================================
   六、总选举次日 / 金曲大赏叙事
   ======================================================================== */
STORY.geAftermath17 = st => {
  const top1 = st.geResult ? st.geResult.top1 : null;
  if (top1 === "鞠婧祎") {
    return [
      { s: "叶盛", cls: "speaker-yesheng", t: "（第二天一早，拿着报刊的样张站在你门口）连霸了——总决选历史上第一个连霸。总监，这个纪录会写进这条河的史册里。" },
      { nar: true, t: "而你已经知道，英雄的下一站往往不止于剧场——开堂的钟声，明天就会敲响。（荣誉殿堂，见分晓。）" },
    ];
  }
  return [
    { s: "叶盛", cls: "speaker-yesheng", t: "（揉着酸胀的眼睛笑）新王登基。总监，去年的座位表，今年得重排了。" },
    { nar: true, t: "总决选落幕，热度暴涨。分团的姑娘们回到各自的城市，把「总决选」三个字讲给更多的女孩听——这条河的支流，也在往回灌水。" },
  ];
};

STORY.rtNarrative17 = {
  great: [
    { nar: true, t: "当年度第一位的旋律响起，全场打开手机灯海。叶盛在侧台轻声说：「2017年……都值了。」" },
  ],
  normal: [
    { nar: true, t: "舞台灯光落下的瞬间，你在观演席轻轻呼出一口气——2017年，就这样唱到了最后。重庆和沈阳的灯，也都亮着。" },
  ],
};

/* ========================================================================
   七、结局文本（评级由 engine.computeGrade17 计算）
   ======================================================================== */
STORY.endings17 = {
  S: {
    rank: "S", title: "双支汇流",
    text: "12月31日深夜，你收到两座城市的照片：重庆的洪崖洞与沈阳的故宫，都挂上了应援色的灯。\n\n这一年，SHY48 与 CKG48 相继亮灯；四支队伍的原创公演陆续首演；孩子们在总决选和金曲大赏的舞台上，唱出了越来越多「自己的歌」。\n\n王子杰总的新年短信只有一行：「明年，董事会会讨论第五座城市。好好休假。」\n\n你关掉手机。窗外，星梦剧院的灯还亮着——2018年，见。",
  },
  A: {
    rank: "A", title: "燎原之势",
    text: "跨年公演散场，叶盛把两座新剧院的门票销售报表递给你，上面盖着一个大大的「优」。\n\n「双团落地、大活动办成、实力报表翻了页——总监，2017年，没白干。」\n\n回望这一年：不是每一步都踩在拍子上，但每一步都朝着「更大的河」去。\n\n新年晨会的白板上已经写好了新计划的第一行。你发现，自己又知道该从哪里下笔了。",
  },
  B: {
    rank: "B", title: "静水深流",
    text: "年末总结会上，王婧翻完你的PPT，只说了一句：「稳，但明年要更快。」\n\n2017年就这样过去了。两座新剧院的灯都亮了，只是亮得慢了些；孩子们的实力涨了，只是涨得缓了些。\n\n这条河安静地流着。你合上笔记本，在2018年的第一页写下一个词：加速。",
  },
  C: {
    rank: "C", title: "任重道远",
    text: "12月31日，办公室的灯比往常熄得早。\n\n年度计划的六条主线，有的磕磕绊绊地收了尾，有的半途搁浅。散会时王子杰总没有多说什么，只在你的总结上圈了一个词：「明年。」\n\n叶盛陪你下楼，忽然说：「总监，河已经这么大了，一个人划船是划不动的——但今年，还是谢谢你划完了。」\n\n2017年欠下的，2018年接着还。",
  },
  bankrupt: {
    rank: "D", title: "资金链断裂",
    text: "连续的赤字让董事会失去了耐心。双团项目被移交他人接管，你被调任「特别顾问」——一个听起来体面、实际没有桌牌的职位。\n\n离开那天，沈阳和重庆的灯都还亮着。你站在马路对面看了一会儿，转身走进了人海。\n\n这条河不会记得每一个摆渡人。但你记得，那两盏灯，是你点的。",
  },
};

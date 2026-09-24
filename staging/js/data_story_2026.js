/* ============================================================================
   data_story_2026.js — 剧情数据（2026「革新征程」线）
   ----------------------------------------------------------------------------
   【同人声明】本文件全部剧情为粉丝同人虚构创作（用户设定的架空 2026：王子杰
   已离世、王婧任总裁、陶莺为大股东法人代表等均为虚构），与现实无关；真实成员
   的言行均为艺术演绎，随机事件中涉及成员的一律用「某成员」/「考核末位者」指代。
   名单考据见 data_members_2026.js（snh48wiki.top，2026-01-01 断面）。

   ----------------------------------------------------------------------------
   本文件挂载的 STORY 键（engine/ui 按 era 消费）：
     STORY.prologue26        序章（结构同 prologue：sceneLabel/pages/styles/closing）
     STORY.monthly26         月度脚本事件（含 3 次末位淘汰评审 + 分团总监述职）
     STORY.randomPool26      随机事件池
     STORY.geAftermath26     总选举次日剧情
     STORY.rtCancelEvent(st) 金曲大赏被取消的事件页（engine 在 9 月末判定后调用）
     STORY.rtCancelledClose(st) 大赏取消时的年末总结会页（替代 resolveRT）
     STORY.settleIntro        解散路线：首批安置前「联络各总监」剧情（engine.doAction("settle") 引用）
     STORY.scenesCgt         CGT48 重建四阶段场景 { connect/audition/theater/rehearsal/debut(st) }
                             （行动场景：选项键名为 apply，由 UI.playScene 消费；
                               月度事件选项键名为 effect，由 engine.buildEventStep 消费——勿混用）
     STORY.endings26         结局文本 { S/A/B/C/bankrupt }
   决策标签（st.decisions）：cgtPath / budget26 / elimQ1~Q3 / geStrategy / postGE26 /
     cgtRoster26 / cgtEquip26 / cgtSong26 / show23Style / jjyCase —— 供后续剧情回收（见 docs/DESIGN.md）。
   旗标（st.flags）：originalSongs / originalSongsStarted / wuhan48 / cgtPromoted / p23Promoted。
   ========================================================================== */

"use strict";

/* ========================================================================
   一、序章：临危受命
   ======================================================================== */
STORY.prologue26 = {
  sceneLabel: "2026年1月 · 上海星梦剧院 · 三楼小会议室",
  pages: [
    { nar: true, t: "2026年1月，上海，深冬。\n\n星梦剧院门口的灯牌只亮了一半——省下来的那半边电费，是这家公司过去一年的缩影。与日方分家后的第十年，选秀节目的洪水冲走了流量，短视频分走了口袋里最后的零钱，营业额一年比一年薄。\n\n而压垮人心的，是去年年末的两则新闻：创始人王子杰意外离世；公司与前成员鞠婧祎的合约纠纷仍在法庭上拉锯，热搜里没有一句好话。日暮西山——财经号的标题这样写。" },
    { s: "叶盛", cls: "speaker-yesheng", t: "（鬓角全白了，抱着一摞文件在门口等你）来了？会议室在楼上。提醒一句——今天的主角不是王总，是陶总。说话之前，先想三秒。" },
    { nar: true, t: "三楼小会议室。长桌尽头坐着陶莺——集团大股东、法人代表，分管一切的「陶总」。她右手边是新任总裁王婧，王子杰的堂妹，上任半年，很少出现在决策桌前。" },
    { s: "陶莺", cls: "speaker-tao", t: "不用拘谨。集团现在的处境，新闻里写得比你想象的还客气。各分团的总监分管自己的一亩三分地，总部给指导——但上海本部，得有人亲手抓。所以，是你。" },
    { s: "王婧", cls: "speaker-wangjing", t: "（温和地补了一句）堂哥生前说，这条河不能断在你我手里。人是你选的，陶总；但要是做不成——我也没办法再保这份计划。" },
    { s: "陶莺", cls: "speaker-tao", t: "那就直接念计划。第一条：年度活动——七月的总选举，年末的金曲大赏。丑话说在前面：如果到九月营业状况还是不好，金曲大赏就取消，钱省下来过冬。" },
    { s: "陶莺", cls: "speaker-tao", t: "第二条，叶盛扛了十年的一百多个女孩的日常沟通，你分一半走。第三条……（推过来一份文件）《末位淘汰机制》：每季度一次考核评审，末位者淘汰、缓刑、或调往分团委培。第四条——CGT48，成都分团，停摆快一年了。" },
    { s: "陶莺", cls: "speaker-tao", t: "剧场还在我们手里，人散了大半。董事会不想再背一座空剧场。年内让它重新亮灯，或者，把它从账上划掉。" },
    { s: "王婧", cls: "speaker-wangjing", t: "（轻轻合上笔）陶总说的是账。但堂哥书房里那张地图，成都旁边还圈着下一座城——他是想把「塞纳河」开遍全国的。这份心气不该断在我们手里，CGT48 的灯，也不该就这么灭。" },
    { s: "陶莺", cls: "speaker-tao", t: "（没有抬头，翻过一页报表）王总，地图不发光，账单会。收缩成本、保住基本盘，是董事会三过半数通过的基调。当然——（第一次抬眼看你）也留给总经理一点裁量空间。" },
    { s: "叶盛", cls: "speaker-yesheng", t: "（小声）……四条线，三条要钱，一条要命。总监，这就是我们2026年的全部家当。" },
    { s: "陶莺", cls: "speaker-tao", t: "最后一步——说说你的打法。这个冬天，你打算先守住什么？" },
  ],
  /* 序章选择：决定初始加成（applyStyle 按 era 取本表） */
  /* 序章选择：决定初始加成（applyStyle 按 era 取本表） */
  styles: [
    { id: "steady", label: "「先活下来。每一分钱都花在刀刃上。」", hint: "守成派：初始资金+100万", apply: st => { st.money += 100; } },
    { id: "content", label: "「用内容和舞台说话，让观众回来。」", hint: "内容派：热度+8，训练度+6", apply: st => { st.heat = Math.min(100, st.heat + 8); st.train = Math.min(100, st.train + 6); } },
    { id: "people", label: "「先把人心稳住，团队散了就全没了。」", hint: "人事派：全员羁绊+5，士气+8，叶盛负担-10", apply: st => { for (const k in st.bonds) st.bonds[k] = Math.min(100, st.bonds[k] + 5); st.morale = Math.min(100, st.morale + 8); st.burden = Math.max(0, st.burden - 10); } },
  ],
  /* ======================================================================
     会后抉择：解散 or 重建 CGT48（运营理念冲突——陶莺实权派 vs 王婧的「天下布妹」遗志）
     tag cgtPath：dissolve（解散·倾向陶莺派，主线④变为安置前成员）
                 / rebuild（重建·倾向王婧派，维持主线④，解锁王总私下嘱托·武汉48）
     ====================================================================== */
  pathChoice: {
    sceneLabel: "散会后 · 三楼走廊",
    pages: [
      { nar: true, t: "散会。走廊的声控灯一盏一盏亮起又熄灭。叶盛在楼梯口拦住你，声音压得很低。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "两位总的意思，你都听明白了吧——但我把丑话说前头：这道题躲不掉，集团明天就要拿到你的书面意见。重建，还是解散，今天就得答。" },
      { nar: true, t: "他递来两部手机：一部是王婧的语音条，一部是陶莺的短信。\n\n语音条里，王婧的声音比会议上柔和得多；短信只有一行字，冷得像报表。" },
      { s: "王婧", cls: "speaker-wangjing", t: "（语音条）「堂哥书房那张地图，成都旁边圈着武汉。他是想把这些灯一盏一盏都点亮的。你要是愿意把CGT48建回来——我以总裁的身份，给你背书到底。」" },
      { s: "陶莺", cls: "speaker-tao", t: "（短信）「CGT48每停一个月，账上多烧七位数。识大体的话——解散，安置好那三十几个孩子，我照样认你这个人才。」" },
      { nar: true, t: "走廊尽头的灯牌明明灭灭。你按灭了屏幕——答案，只能从你自己心里出。" },
    ],
    choices: [
      {
        label: "「CGT48，就到这里吧。」——站陶莺：止血优先",
        hint: "倾向实权派：主线④变为「安置CGT48前成员」；裁撤回笼资金+80万",
        tag: "cgtPath", value: "dissolve",
        apply: st => {
          st.cgt.closed = true;
          st.money += 80;
          st.morale = Math.max(0, st.morale - 2);
          return "你把书面意见交了上去：CGT48 项目终止，转入成员安置流程。当天下午，财务把裁撤回笼的八十万划进了你的预算盘子。陶莺回了两个字：「很好。」——而走廊那头，王婧办公室的灯，亮到了很晚。";
        },
      },
      {
        label: "「把它建回来。」——站王婧：完成未竟的扩张",
        hint: "倾向王婧派：维持重建主线④；获得王总全力背书与一份私下嘱托",
        tag: "cgtPath", value: "rebuild",
        apply: st => {
          st.flags.wuhan48 = true;   // 【伏笔】王子杰地图上圈着的下一站：武汉48（后续剧情回收）
          st.heat = Math.min(100, st.heat + 2);
          return "你把「重建」两个字签在了意见栏最下方。消息传得很快——那晚之后，至少有三位前CGT48成员给叶盛发来了同一句话：「等到了。」";
        },
      },
    ],
  },

  closing: st => {
    const dissolve = st.decisions && st.decisions.cgtPath === "dissolve";
    const head = dissolve
      ? [
          { s: "陶莺", cls: "speaker-tao", t: "（收到意见书，难得主动打来内线）行。安置做得体面，比什么口号都值钱。三批人，一个季度——做得好，董事会里就没人再提「撤总监」三个字。" },
          { nar: true, t: "（主线④已变更为「安置CGT48前成员」：通过「安置CGT48前成员」行动分三批完成安置。成员页的 CGT48 标签页保留为前成员名册。）" },
        ]
      : [
          { s: "陶莺", cls: "speaker-tao", t: "（收到意见书，看了很久）……重建可以。但丑话说在前面：年内亮不了灯，明年就没有这笔预算。你用自己的军令状换的这条路，走稳。" },
          { nar: true, t: "深夜，你收拾完东西正要下班，王婧敲了敲门——她一个人，手里拿着一张翻旧了的地图。" },
          { s: "王婧", cls: "speaker-wangjing", t: "（把地图摊在你桌上，指着武汉两个字，笔迹已经有些淡了）堂哥最后半年，反复说一件事：成都之后，是武汉。「天下布妹」是他起的名字，土，可他喜欢。——子杰没能看到成都的灯再亮起来。" },
          { s: "王婧", cls: "speaker-wangjing", t: "CGT48 交给你，我放心。但还有一句话，我只说给你一个人听：完成他最后的心愿。武汉48——总有一天，我想在立项书上，替他签这个字。（【伏笔已埋：武汉48 · 后续剧情回收】）" },
          { s: "{name}", cls: "speaker-me", t: "「王总。先点亮成都，再谈武汉。两张灯牌——我都会想办法让它亮起来。」" },
        ];
    return head.concat([
      { s: "叶盛", cls: "speaker-yesheng", t: "（送你出门时，把一份厚厚的名单塞进你怀里）本部还剩七十四个人。四队加预备生……有几个孩子，是从解散的分团一路辗转回来的。这份名单，比十年前轻多了，也重多了。" },
      { nar: true, t: "你翻开名单：Team SII、Team NII、Team HII、Team X、预备生——74个名字。\n\n名单最后附着一行小字：「BEJ48 / GNZ48 / CKG48 / CGT48 各分团名册见附页，由各分团总监分管，总部指导。」\n\n2026年的征程，从守住这74盏灯开始。" },
    ]);
  },
};

/* ========================================================================
   二、月度脚本事件（monthly26）
   ======================================================================== */
STORY.monthly26 = {

  /* ---------- 1月：交接与《末位淘汰机制》 ---------- */
  1: [
    {
      id: "m1_26_handover",
      title: "1月 · 交接周",
      pages: st => [
        { s: "叶盛", cls: "speaker-yesheng", t: "先给你交个底：去年集团前10个月亏损近四千万，参保人数一年少了一大截，连股东的股权都挂过牌转让。这些数字，董事会每季度都看一遍。" },
        { s: "叶盛", cls: "speaker-yesheng", t: st.cgt.closed
          ? "好的一面：本部剧场还在满负荷跑公演，预备生这批苗子不错。坏的一面……成都的收尾压在咱们身上了。解散是你拍的板，接下来把它做完、做体面——别让那三十几个孩子寒心。"
          : "好的一面：本部剧场还在满负荷跑公演，预备生这批苗子不错。坏的一面——成都那边，CGT48停摆快一年，前成员们各奔东西，只留下一座安静得能听见回声的剧场。" },
        { nar: true, t: "晚上，陶莺的秘书送来一份红头文件：《SNH48 GROUP 末位淘汰机制（试行）》。文件很短，每一行都很冷。\n\n你把它压在台灯下。2026年的第一份作业，没有一道是送分题。" },
      ],
    },
    {
      /* 双线同身份 NPC：周马（GNZ48 运营总监）/ 孟波（CKG48 运营总监） */
      id: "m1_26_directors",
      title: "1月中旬 · 分团总监述职",
      gate: st => true,
      pages: st => [
        { nar: true, t: "一月中旬，两位分团总监来沪述职。这是十年来他们第一次同时坐进总部的小会议室——上一次，还是2016年那场决定分家命运的联席会。" },
        { s: "周马", cls: "speaker-zhouma", t: "（把一册报告推到桌子中央，封皮平整得没有一道折痕）GNZ48，广州。三支队伍加预备生，53个人，粉丝基本盘是全集团最稳的——去年场均上座率还有八成。但新歌断供快一年，剧场设备是2016年的老家底，姐妹们靠老公演撑场子。" },
        { s: "周马", cls: "speaker-zhouma", t: "经验只有一句，我在广州讲了十年：账要算小，心要算大。分团不是上海的分公司——广州的事，广州决定，总部背书。这个信任给出去，人心就回来了。" },
        { s: "孟波", cls: "speaker-mengbo", t: st.cgt.closed
          ? "（嗓门照旧）重庆，CKG48！C队K队全集团最年轻，直拍出圈、文旅联动的路子是我们先趟的——负债也最重，我不遮着掩着。还有——成都那事，唉。老熟人何蔡娴她们倒也想得开，说跟着新安排走，去哪儿都是唱。你放心排名单。"
          : "（嗓门大得震杯子）重庆，CKG48！C队K队全集团最年轻，直拍出圈、文旅联动的路子是我们先趟的——负债也最重，我不遮着掩着。还有……成都那事，唉，老熟人何蔡娴她们还在等信儿呢。" },
        { s: "孟波", cls: "speaker-mengbo", t: "我的经验就一条：山城的道理是爬坡——别怕慢，怕停。给年轻人试错的机会，她们错一次，比咱讲十次都管用。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（等他们走后，替你把两份报告摞在一起）两位总监的意思，我给你翻译一下：分团要放权，总部要兜底。总监——这两句话，2026年你都用得上。" },
        { nar: true, t: st.cgt.closed
          ? "（成员页可查看 BEJ48 / GNZ48 / CKG48 三个分团的名册；CGT48 标签页为前成员名册——安置完成后，她们会有新的去处。）"
          : "（成员页可查看 BEJ48 / GNZ48 / CKG48 / CGT48 四个分团的名册；成都的灯，正等着你的重建计划。）" },
      ],
    },
  ],

  /* ---------- 2月：二十三期升格 + 新生公演策划 + 过冬预算会议 ---------- */
  2: [
    {
      /* 二十三期预备生升格：总监逐人选择队伍（pickMode="p23Promote"，
         落地在 engine.promoteTeams23；池内含 22 期应籽言一并转正） */
      id: "m2_26_p23promote",
      title: "2月 · 二十三期升格考核",
      gate: st => !!(st.flags && !st.flags.p23Promoted &&
        st.members.some(m => m.team === "PREP" && m.status === "active")),
      pages: st => {
        const n = st.members.filter(m => m.team === "PREP" && m.status === "active" && m.gen !== "CGT48移籍").length;
        return [
          { nar: true, t: "二月初，预备生考核期到点。" + n + "名预备生的训练报告摆在长桌上——二十三期这批孩子从夏天练到冬天，出勤率是全集团近三年最好看的一页。" },
          { s: "叶盛", cls: "speaker-yesheng", t: "按章程，考核合格就该升格入队。四支队伍的名单空位就这些——总监，你把人分到哪队，哪队就多一年的故事。分之前想清楚：老将带新人，还是新人冲新人？" },
        ];
      },
      choices: [
        { label: "宣布升格名单，为预备生选定队伍", hint: "逐人选择 SII / NII / HII / X（人气+3 羁绊+3）",
          pickMode: "p23Promote" },
      ],
      after: [
        { nar: true, t: "升格仪式办得很简单：念名字、换队服、合影。仪式结束后，队伍合流的第一次联合排练排在了周末。" },
      ],
    },
    {
      /* 新生公演策划：运营理念分歧第二次浮出水面（tag show23Style 供后续回收） */
      id: "m2_26_show23",
      title: "2月 · 新生公演策划会",
      gate: st => true,
      pages: st => [
        { s: "叶盛", cls: "speaker-yesheng", t: "（抱着两套企划案，欲言又止）总监，刚升格的孩子们需要一个「出道舞台」——二十三期新生公演，三月排、四月上。但是……企划会开过一轮了，两套方案，两边各有各的道理。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把声音压得更低）我多嘴一句——这两套方案背后，其实是陶总和王总对「这条河该往哪流」的两种答案。您选的不只是一台公演。" },
        { nar: true, t: "方案 A 的封面印着近几年的经典视觉：稳、熟练、数据齐全。方案 B 的封面上只有一行手写体小字——「元気，で迎えに来た。」" },
      ],
      choices: [
        { label: "参照近几年的成熟模式：经典视觉+稳妥编排", hint: "倾向陶莺：资金+20 热度+2 士气-3（公演被批同质化）",
          tag: "show23Style", value: "classic",
          effect: st => {
            st.money += 20; st.heat = Math.min(100, st.heat + 2); st.morale = Math.max(0, st.morale - 3);
            return "公演办得很「稳」：流程丝滑、零失误，评论区却刷起了「三年前是不是也这样」。财务报表漂亮，叶盛把「同质化严重」的乐评截图悄悄收进了文件夹。陶莺在周报上批了两个字：「合格。」";
          } },
        { label: "回归元气日系风：手写应援板+全开麦", hint: "倾向王婧：热度+6 士气+5 资金-15（陶莺会不满）",
          tag: "show23Style", value: "nihon",
          effect: st => {
            st.money = Math.max(0, st.money - 15); st.heat = Math.min(100, st.heat + 6); st.morale = Math.min(100, st.morale + 5);
            return "开演铃响，手写应援板一块块亮起来——像回到了这条河刚开始的那几年。谢幕时孩子们哭了一片，热搜词条挂了一夜。第二天，陶莺把超支的十五万划掉时笔顿了很久：「下次，走账。」";
          } },
      ],
    },
    {
      id: "m2_26_budget",
      title: "2月 · 过冬预算会议",
      pages: st => [
        { s: "陶莺", cls: "speaker-tao", t: "（财务总监把投影打开）去年的账，大家都看了。今年的预算，我的原则只有一条：先保现金，再谈梦想。总监，内容预算这块，你来说。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（低声）宣传和公演的预算是基本盘，动了就伤热度；但真砍掉边缘项目，能省出一大笔过冬钱……陶总在等你的方案。" },
      ],
      choices: [
        { label: "砍掉边缘项目，现金为王", hint: "资金+120万 士气-5 热度-2", tag: "budget26", value: "cut",
          effect: st => { st.money += 120; st.morale = Math.max(0, st.morale - 5); st.heat = Math.max(0, st.heat - 2); return "纪录片企划、周年周边、海外宣传……你亲手划掉了七个项目。财务总监的表情第一次像过年。省下的钱到账了，办公室的灯却灭得更早了。"; } },
        { label: "内容预算一分不砍，我去赚回来", hint: "资金-30万 士气+5 热度+4", tag: "budget26", value: "keep",
          effect: st => { st.money = Math.max(0, st.money - 30); st.morale = Math.min(100, st.morale + 5); st.heat = Math.min(100, st.heat + 4); return "你立了军令状：预算不动，缺口自己补。陶莺盯着你看了三秒：「记得你今天说的话。」全团都知道了这件事——孩子们练功比以前更狠了。"; } },
      ],
    },
  ],

  /* ---------- 3月：第一次末位淘汰评审 ---------- */
  3: [
    {
      id: "m3_26_elim1",
      title: "3月 · 末位淘汰评审（第一季度）",
      pages: st => [
        { nar: true, t: "季度考核结果放在长桌上：训练出勤、公演完成度、粉丝增长，三张表折算出的排名清清楚楚。\n\n名单末尾的三个名字被红笔圈了出来——都是进团不久、还没攒下任何声量的孩子。" },
        { s: "陶莺", cls: "speaker-tao", t: "机制是董事会定的，我是法人，你是执行人。这三个名字，你给个处理意见。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（在你身后，几乎听不见地说）她们才来半年……但你要是心软，下一次评审，难的会是你。" },
      ],
      choices: [
        { label: "按机制执行：协商解除合约", hint: "淘汰执行+1 士气-6 热度-1", tag: "elimQ1", value: "execute",
          effect: st => { st.elim.executed += 1; st.morale = Math.max(0, st.morale - 6); st.heat = Math.max(0, st.heat - 1); return "你签了字。办公室里安静得可怕。当晚，有个女孩的行李箱轮子碾过走廊的声音，很久才消失。陶莺收到执行报告，回了两个字：「按此。」"; } },
        { label: "给她们一个季度缓刑观察期", hint: "缓刑+1 士气+4（陶莺的耐心在消耗）", tag: "elimQ1", value: "stay",
          effect: st => { st.elim.defied += 1; st.morale = Math.min(100, st.morale + 4); return "你在评审表上写下「缓刑观察，季度复评」。三个女孩在门外哭成一团，转身就把练功房的灯亮到了后半夜。只是陶莺在文件上画了个问号——她的耐心，又少了一格。"; } },
        { label: "调往 CGT48 委培（武汉48成立后移籍武汉）", hint: "调往+1 士气-2：重建路线专属", tag: "elimQ1", value: "transfer", gate: st => !st.cgt.closed,
          effect: st => { st.elim.transferred += 1; st.morale = Math.max(0, st.morale - 2); return "你把三份调令换成了一份「委培生」名单：身份是 CGT48 储备，还有一个写在未来的户口——武汉48成立之日，整体移籍。不是淘汰，是开荒。"; } },
        { label: "调往其他分团（广州 / 重庆 / 北京轮替）", hint: "调往+1 士气-2：解散路线专属", tag: "elimQ1", value: "transfer", gate: st => !!st.cgt.closed,
          effect: st => {
            const dest = ["GNZ48（广州）", "CKG48（重庆）", "BEJ48（北京）"][st.elim.transferred % 3];
            st.elim.transferred += 1; st.morale = Math.max(0, st.morale - 2);
            return "你联系了三个分团的总监，按轮替把这批孩子送了过去——本批去向：" + dest + "。班底虽然散了，舞台还没散。";
          } },
      ],
    },
  ],

  /* ---------- 4月：王子杰纪念 ---------- */
  4: [
    {
      id: "m4_26_memorial",
      title: "4月 · 天台纪念",
      gate: st => true,
      pages: st => [
        { nar: true, t: "清明前后，叶盛在天台摆了一杯热茶——王子杰总生前的习惯，明前的龙井。\n\n「十年前他说，要把这条河引出去。后来河是引出去了，可上游的雪山化了。」叶盛笑了笑，「现在轮到我们来找新的水头了。」" },
        { s: "叶盛", cls: "speaker-yesheng", t: "总监，说句掏心窝的——这十来年我送走了一批又一批孩子，最难的不是没人来，是没人信。你要是能让这七十四个人重新信点什么，就够了。" },
        { nar: true, t: "（全团士气 +3。有些力量，是从一杯茶开始的。）" },
      ],
    },
    {
      /* 【理念冲突③·合约纠纷】前成员鞠婧祎新戏开播（tag jjyCase 供后续回收）。
         现实纠纷背景见 docs/DESIGN.md 考据注；剧情不虚构其本人言行，
         分歧聚焦于「公司该怎么应对」。 */
      id: "m4_26_jjy",
      title: "4月中 · 新戏开播之夜",
      gate: st => true,
      pages: [
        { nar: true, t: "四月中的一个周四，前成员鞠婧祎主演的新剧在平台开播。首日热度破万——海报角落里，「丝芭传媒」四个小字还挂在出品方名单里，可宣传物料上，和她相关的字眼一个都没有。" },
        { nar: true, t: "当晚，法务部的灯没关。那场从去年拉锯到今年的合约官司又添了新变量：剧红了，商业价值再上一个台阶——而「她到底还是不是丝芭的艺人」，判决书还没写完。" },
        { s: "陶莺", cls: "speaker-tao", t: "（紧急会上，把合约复印件拍在桌上）全约艺人四个字，白纸黑字。片方拿我们的艺人热度做宣发，一句招呼都不打？明天就让法务发函，声明必须发——这是公司的底线。" },
        { s: "王婧", cls: "speaker-wangjing", t: "（声音不高，但很稳）发声明容易，收回来难。舆论仗打赢了，法庭上未必加分——笔迹鉴定还在进行中，真正能终结这场仗的是证据，不是热搜。我建议：加聘鉴定专家团队，把钱花在证据链上。" },
        { nar: true, t: "两双眼睛同时转向你。会议室的投影还亮着新剧的热度曲线——一路飘红，刺得人眼睛疼。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（散会后，在走廊里）总监，孩子们今晚也都在刷这部剧。公司怎么对待「离开的人」，她们都看着——这个决定，会写进她们心里。" },
      ],
      choices: [
        { label: "跟随董事会：发声明、向片方施压", hint: "倾向陶莺：热度+6 士气-6（成员观感下降）",
          tag: "jjyCase", value: "pressure",
          effect: st => {
            st.heat = Math.min(100, st.heat + 6);
            st.morale = Math.max(0, st.morale - 6);
            return "声明凌晨发出，措辞强硬——「鞠婧祎仍为本司全约艺人」。热搜吵翻了天，片方连夜发来律师函对峙，话题度拉满。可第二天排练室里安静得反常：孩子们一句都没议论，只是练得更沉默了。她们在看着公司怎么对待一个「离开的人」。";
          } },
        { label: "听从王总：不打舆论仗，专注法律证据", hint: "倾向王婧：资金-50 士气+3（追加鉴定与证据链投入）",
          tag: "jjyCase", value: "legal",
          effect: st => {
            st.money = Math.max(0, st.money - 50);
            st.morale = Math.min(100, st.morale + 3);
            return "你拍板：不发声明，不碰热搜。五十万的专家鉴定与证据整理预算当晚批复——真伪交给笔迹，是非交给法庭。孩子们私下说：「公司这次挺体面的。」陶莺没有反对，只是把这份预算单独记了一页。";
          } },
      ],
      after: [
        { nar: true, t: "深夜，你在备忘录上写下今天的决定。这场官司还没有答案——但你选的路，会一直走到判决书下来那天。（决策已登记：jjyCase——后续剧情回收）" },
      ],
    },
  ],

  /* ---------- 5月：成都调研报告 ---------- */
  5: [
    {
      /* 【史实锚点】2026-05-01 二十四期生 9 人公布（snh48wiki.top 期生时间线），
         成员由 engine.monthStart 按 DATA2026.joining2026 加入名单（本部预备生）。 */
      id: "m5_26_recruit",
      title: "5月1日 · 春季招新：二十四期生",
      gate: st => true,
      pages: st => [
        { nar: true, t: "五月一号，春季招新的名单公布——二十四期生，九个人。官博的转发量比两年前任何一届都高：这条河还有人在排队进来，本身就是一种回答。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把九份资料摆成一排）都进预备生池子了。年纪最小的刚成年——「养成系」这三个字，2026年听着有点奢侈，但也只有这三个字还能打。" },
        { nar: true, t: "（名单更新：秦箐忆、臧文萱、刘钇霏、黄子珊、丁小凡、杨宝君、李沁洁、吉雅楠、何绮多——以预备生身份加入本部。成员页「预备生」标签页可查看。）" },
      ],
    },
    {
      /* 【解散路线限定】CGT48 移籍成员升格：总监为每位转入本部的预备生选择归队。
         pickMode="cgtPromote" → UI.showCgtPromotePicker；落地在 engine.promoteCgt。 */
      id: "m5_26_promote",
      title: "移籍预备生升格",
      gate: st => !!(st.cgt.closed && !st.flags.cgtPromoted &&
        st.members.some(m => m.gen === "CGT48移籍" && m.team === "PREP" && m.status === "active")),
      pages: st => {
        const n = st.members.filter(m => m.gen === "CGT48移籍" && m.team === "PREP" && m.status === "active").length;
        return [
          { nar: true, t: "安置工作稳步推进，一个新问题摆上桌面：从成都并入本部的 " + n + " 名预备生，考核期表现亮眼——排练室的老将们都说，这群孩子「不像是来避难的，像是来抢位置的」。" },
          { s: "叶盛", cls: "speaker-yesheng", t: "按制度，预备生考核合格就该升格入队。SII、NII、HII、X——四支队伍的队长都在等你的分配。分得好是雪中送炭，分不好就是埋雷。" },
          { s: "王婧", cls: "speaker-wangjing", t: "（在报告上签了字）她们不是「CGT48的遗孤」，是这条河的孩子。给她们正式的位置——这比任何公告都有说服力。" },
        ];
      },
      choices: [
        { label: "为移籍预备生选定队伍，正式升格", hint: "逐人选择 SII / NII / HII / X（升格后人气↑ 羁绊↑）",
          pickMode: "cgtPromote" },
      ],
      after: [
        { nar: true, t: "新队服没有名字的空位了。演出的报幕声里，她们的名字前面，终于不再带着「前CGT48」的前缀。（升格完成，后续剧情可回收）" },
      ],
    },
    {
      id: "m5_26_cgtreport",
      title: "5月 · 成都调研报告",
      /* 仅重建路线：解散后不再触发任何 CGT 重建相关事件 */
      gate: st => !st.cgt.closed,
      pages: st => [
        { nar: true, t: "叶盛从成都回来，带回三样东西：一叠剧场资产清单、一份欠薪调解记录，和一个U盘。\n\nU盘里是一段手机视频：空荡荡的CGT48剧场，灰尘在追光里飘。有人用成都话在镜头后面轻轻说了一句——「啥子时候再开灯嘛。」" },
        { s: "叶盛", cls: "speaker-yesheng", t: "前成员的联络网我摸到了。何蔡娴——原来的GII队长，人还在成都，听说我们可能重启，当场就说「要回来」。郭兆媛她们几个也都在等一个准信。" },
        { nar: true, t: "（CGT48 重建线已解锁进度提示。推进「CGT48重建」行动，年内让成都的剧场重新亮灯。）" },
      ],
    },
  ],

  /* ---------- 6月：总选冲刺 + 第二次评审 ---------- */
  6: [
    {
      id: "m6_26_strategy",
      title: "6月 · 总选冲刺会议",
      gate: st => !st.geDone,
      pages: st => [
        { s: "叶盛", cls: "speaker-yesheng", t: "七月底，总选举——去年在香港办，今年董事会还在拉扯回不回上海。先不管场地，说资源：打投预算就这么多，怎么排？" },
        { s: "陶莺", cls: "speaker-tao", t: "（列席，翻着手机）我只提醒一件事：总选成绩就是招商报价单。你们自己掂量。" },
      ],
      choices: [
        { label: "集中火力，保头部冲高名次", hint: "冲冠概率大增，热度收益高，士气-6", tag: "geStrategy", value: "focus",
          effect: st => { st.geStrategy = "focus"; return "资源全部向头部倾斜。有人在会议上红着眼睛问「那我们呢」，你没有回答——竞技就是这么难看又这么真实。"; } },
        { label: "雨露均沾，让每个孩子都被看见", hint: "全团士气+8，羁绊提升，冲榜收益降低", tag: "geStrategy", value: "balance",
          effect: st => { st.geStrategy = "balance"; return "你把计划表摊开：每位参选成员都有一页自己的宣传方案。叶盛看着看着就笑了——这排法，十年前某位老总监也这么排过。"; } },
      ],
    },
    {
      id: "m6_26_elim2",
      title: "6月 · 末位淘汰评审（第二季度）",
      gate: st => true,
      pages: st => [
        { nar: true, t: "第二季度评审如期而至。这一次的红圈里，有一个意想不到的名字：一位服役多年的老成员——训练分没掉，是因为她把大量时间花在了带预备生上。\n\n陶莺的批注只有四个字：「按机制办。」" },
      ],
      choices: [
        { label: "按机制执行", hint: "淘汰执行+1 士气-8 热度-2", tag: "elimQ2", value: "execute",
          effect: st => { st.elim.executed += 1; st.morale = Math.max(0, st.morale - 8); st.heat = Math.max(0, st.heat - 2); return "老成员离团那天，全队去送。她挨个抱了一遍，最后跟你握手：「机制是机制，不怪你。把她们带好。」\n\n那晚叶盛在办公室坐到天亮。"; } },
        { label: "顶着压力缓刑，上书说明特殊情况", hint: "缓刑+1 士气+6（陶莺积怨加深）", tag: "elimQ2", value: "stay",
          effect: st => { st.elim.defied += 1; st.morale = Math.min(100, st.morale + 6); return "你把预备生们联名写的感谢信钉在评审表后面，一起呈了上去。陶莺看完没说话——缓刑通过，但你听见财务总监轻轻叹了口气。"; } },
        { label: "调往 CGT48 委培，让老带新（武汉48成立后移籍武汉）", hint: "调往+1 士气-1：重建路线专属", tag: "elimQ2", value: "transfer", gate: st => !st.cgt.closed,
          effect: st => { st.elim.transferred += 1; st.morale = Math.max(0, st.morale - 1); return "「不是淘汰，是委以重任。」——调令上的这句话是你加的。她看完调令，沉默很久，最后说：「成都……好啊。等武汉立项，我再去把第二盏灯点亮。」"; } },
        { label: "调往其他分团（广州 / 重庆 / 北京轮替）", hint: "调往+1 士气-1：解散路线专属", tag: "elimQ2", value: "transfer", gate: st => !!st.cgt.closed,
          effect: st => {
            const dest = ["GNZ48（广州）", "CKG48（重庆）", "BEJ48（北京）"][st.elim.transferred % 3];
            st.elim.transferred += 1; st.morale = Math.max(0, st.morale - 1);
            return "调令上写明「集团内部平调」——本批去向：" + dest + "。她看完调令，沉默很久，最后说：「换条河，也能唱下去。」";
          } },
      ],
    },
    {
      /* 【合约纠纷·庭审】胜负为架空随机（基础 50%，4月选择「专注法律证据」+15%）。
         败诉：公告合作关系结束（纯文本）；胜诉：flags.jjyWin=true → 下一事件二选一。 */
      id: "m6_26_trial",
      title: "6月 · 合约纠纷庭审",
      gate: st => !!(st.decisions && st.decisions.jjyCase && !st.flags.jjyResolved),
      pages: [
        { nar: true, t: "六月中旬，拉锯了两年多的合约纠纷案开庭宣判。庭外挤了两排摄像——这不只是艺人和公司的官司，两个名字背后站着两条产品线、几百名员工的饭碗，和一场谁都不敢先眨眼的拉锯。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把领带整了又整）判决书上的每一个字都会上头条。总监，无论结果是什么，散庭之后的第一份公告，得由你来定调。" },
        { nar: true, t: "法槌落下。合议庭开始宣读判决主文——全场安静得能听见空调的风声。" },
      ],
      choices: [
        { label: "起身，听取宣判", hint: "胜负由天（若 4 月选择专注法律证据，胜算略高）",
          effect: st => {
            /* 公司胜诉 = 《补充协议》被认定有效（合约关系继续，公司握有主动权）；
               公司败诉 = 协议无效、合约终止（公告合作关系结束）。 */
            const p = (st.decisions && st.decisions.jjyCase === "legal") ? 0.65 : 0.5;
            if (Math.random() < p) {
              st.flags.jjyWin = true;
              return "「……本院认定，涉案《补充协议》系双方真实意思表示，依法成立；原告解除合约的主张，本院不予支持。」——公司胜诉。走廊里法务团队相拥，王婧长长呼出一口气。但这只是中场：合约束缚仍在，解约还是重新合作，主动权第一次回到了公司手里。";
            }
            st.flags.jjyWin = false;
            st.flags.jjyResolved = true;
            return "「……涉案《补充协议》有效性不足，双方合约关系于本判决生效之日终止。」——公司败诉。两个小时后，官方公告发出：「尊重判决，双方合作关系正式结束。」没有指责，没有余恨，评论区难得地安静了一晚。";
          } },
      ],
    },
    {
      /* 胜诉后续二选一：违约金解约（倾向陶莺）/ 重新协定合约·转入影视部（倾向王总）。
         选影视部时鞠婧祎以「荣誉殿堂·影视部」成员卡加入。 */
      id: "m6_26_trial_choice",
      title: "6月 · 庭审之后",
      gate: st => !!st.flags.jjyWin && !st.flags.jjyResolved,
      pages: [
        { nar: true, t: "胜诉的消息压了一整晚，第二天一早，两套方案同时放上你的桌面。" },
        { s: "陶莺", cls: "speaker-tao", t: "（第一套方案的封面写着一个数字）违约金，一次性结清，从此两清。法律赢了，商业上就该落袋为安——这笔钱够补两个季度的内容预算。" },
        { s: "王婧", cls: "speaker-wangjing", t: "（翻开第二套方案）钱是死的，人是活的。她要的从来不是「离开」，是「被当成专业演员尊重」。重新协定合约——影视部，专属团队，分成透明。堂哥当年签她的时候，看中的就是这股劲。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（两套方案各有一页附注）陶总的方案财务上稳；王总的方案……是把双刃剑，但成了，就是这条河打通影视赛道的第一个标杆。" },
      ],
      choices: [
        { label: "允许支付违约金解约，好聚好散", hint: "倾向陶莺：违约金+200万 热度-2 士气-2",
          tag: "jjyVerdict", value: "buyout",
          effect: st => {
            st.flags.jjyResolved = true;
            st.money += 200;
            st.heat = Math.max(0, st.heat - 2);
            st.morale = Math.max(0, st.morale - 2);
            return "签约、盖章、转账——三个工作日，十年的缘分画上了句号。这笔违约金入了账，像一件烫手的礼物。江湖很大，愿她前程似锦，也愿这条河不再需要用官司证明自己。";
          } },
        { label: "重新协定合约：转入影视部，共赴新赛道", hint: "倾向王总：热度+5 士气+3（鞠婧祎加入「荣誉殿堂·影视部」分类）",
          tag: "jjyVerdict", value: "cinema",
          effect: st => {
            st.flags.jjyResolved = true;
            st.heat = Math.min(100, st.heat + 5);
            st.morale = Math.min(100, st.morale + 3);
            st.members.push({
              id: "jujingyi26", name: "鞠婧祎", team: "HALL", gen: "二期生 · 影视部",
              pop: 94, bond: 25, status: "active", hall: true, note: "荣誉殿堂 · 影视部（2026 重新签约）",
            });
            return "新合约的条款谈了一夜：影视部专属团队、收益透明分成、剧场保留荣誉席位。签约照上，她站在一群预备生中间——像一座桥，把这条河的过去和将来接在了一起。孩子们奔走相告：「大师姐回家了。」";
          } },
      ],
      after: [
        { s: "陶莺", cls: "speaker-tao", t: "（在结案报告上落笔，只对你说了一句）这一页翻过去了。但总监记住——商业世界没有童话，只有下一份合同。" },
      ],
    },
  ],

  /* ---------- 7月：总选举之夜 ---------- */
  7: [
    {
      id: "m7_26_election",
      title: "7月末 · 年度人气总决选",
      gate: st => !st.geDone,
      pages: st => [
        { nar: true, t: "总决选之夜。场馆里灯光亮起的瞬间，你想起年初那个只亮一半的灯牌——原来这条河攒下的家底，从来不只是一家公司的账面。\n\n应援棒的海洋里，每一盏都是一张选票，也都是一句「我还信」。" },
        { s: "陶莺", cls: "speaker-tao", t: "（贵宾席，难得穿了正装）我很少说这种话——但今晚，让我们看看这条河还有多少水。" },
        { nar: true, t: "——排名即将揭晓。（结果见结算画面）" },
      ],
    },
  ],

  /* ---------- 8月：总选之后 ---------- */
  8: [
    {
      id: "m8_26_aftermath",
      title: "8月 · 冠军的十字路口",
      gate: st => st.geDone,
      pages: st => [
        { nar: true, t: "总选热度未散，一家头部选秀系公司递来橄榄枝——点名本届高位成员，开出的签约金是现合约的数倍。传闻在楼道里飞了一周。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把报价单复印件放在你桌上）人家不只是挖人，是挖我们的招牌。留人要留心，也要留价码——可预算，你比我熟。" },
      ],
      choices: [
        { label: "启动留人计划，匹配核心待遇（花费60万）", hint: "资金-60万 士气+6 热度+2", tag: "postGE26", value: "retain",
          gate: st => st.money >= 60,
          effect: st => { st.money = Math.max(0, st.money - 60); st.morale = Math.min(100, st.morale + 6); st.heat = Math.min(100, st.heat + 2); return "新的职业规划书和一份有诚意的合约一起递了过去。对方撤回了报价。留守的不止是招牌，是所有人心里那句「这里值得」。"; } },
        { label: "尊重个人选择，把预算投给下一代", hint: "资金+20万 士气-4 训练度+6", tag: "postGE26", value: "invest",
          effect: st => { st.money += 20; st.morale = Math.max(0, st.morale - 4); st.train = Math.min(100, st.train + 6); return "你把预算转进了预备生训练营。走的人发了一篇长文告别，评论区吵翻了天——但练功房里，新苗子们的动作整齐了半拍。"; } },
      ],
    },
  ],

  /* ---------- 9月：第三次评审（月末另有取消判定） ---------- */
  9: [
    {
      id: "m9_26_elim3",
      title: "9月 · 末位淘汰评审（第三季度）",
      gate: st => true,
      pages: st => [
        { nar: true, t: "第三次季度评审。这一次陶莺亲自到场——她把考核表推到你面前，旁边放着一份文件：《关于年终金曲大赏的预算可行性评估》。\n\n「评审照常。大赏办不办，月底给你答案。」" },
      ],
      choices: [
        { label: "按机制执行", hint: "淘汰执行+1 士气-7", tag: "elimQ3", value: "execute",
          effect: st => { st.elim.executed += 1; st.morale = Math.max(0, st.morale - 7); return "你在执行栏签下名字。走廊尽头的储物柜，今年第三次被清空。没有人再哭了——这才是最让人难受的。"; } },
        { label: "缓刑，并以 CGT48 重建进度作保", hint: "缓刑+1 士气+5（需陶莺信任）", tag: "elimQ3", value: "stay",
          gate: st => st.cgt.stage >= 2,
          effect: st => { st.elim.defied += 1; st.morale = Math.min(100, st.morale + 5); return "你指着成都的工程进度照片说：「给我一个季度，我把成都的灯点亮——到时候请她去验收人心。」陶莺难得没画问号。"; } },
        { label: "调往 CGT48 委培，注入重建先锋队（武汉48成立后移籍武汉）", hint: "调往+1 士气-1：重建路线专属", tag: "elimQ3", value: "transfer", gate: st => !st.cgt.closed,
          effect: st => { st.elim.transferred += 1; st.morale = Math.max(0, st.morale - 1); return "「成都不要被淘汰的人，要开荒的人。」——这句话后来被印在了重建营的营旗上，营旗背面，是武汉。"; } },
        { label: "调往其他分团（广州 / 重庆 / 北京轮替）", hint: "调往+1 士气-1：解散路线专属", tag: "elimQ3", value: "transfer", gate: st => !!st.cgt.closed,
          effect: st => {
            const dest = ["GNZ48（广州）", "CKG48（重庆）", "BEJ48（北京）"][st.elim.transferred % 3];
            st.elim.transferred += 1; st.morale = Math.max(0, st.morale - 1);
            return "「集团内部平调，不设试用期。」——本批去向：" + dest + "。三团轮替接收的方案，陶莺看完只改了一个标点。";
          } },
      ],
    },
  ],

  /* ---------- 10月：CGT 倒计时 / 陶莺最后通牒 ---------- */
  10: [
    {
      id: "m10_26_cgt",
      title: "10月 · 成都的灯",
      gate: st => true,
      pages: st => {
        if (st.cgt.closed) {
          const n = st.cgt.settled || 0;
          if (st.cgt.settleDone) {
            return [
              { s: "陶莺", cls: "speaker-tao", t: "（安置总结报告上画了圈）三批三十七人，全部有了去处。执行得很干净——这份报告，我会放进董事会的正面案例里。" },
              { nar: true, t: "（主线④「安置CGT48前成员」已完成。结局评分按安置圆满计。）" },
            ];
          }
          return [
            { s: "叶盛", cls: "speaker-yesheng", t: "（提醒）总监，安置工作还差 " + (3 - n) + " 批。名单上那些孩子还在等一个体面的说法——年内收不了尾，年初的决策就要被翻旧账了。" },
            { nar: true, t: "（主线④「安置CGT48前成员」进行中：通过「安置CGT48前成员」行动完成剩余批次。）" },
          ];
        }
        if (st.cgt.stage >= 3) {
          return [
            { s: "叶盛", cls: "speaker-yesheng", t: "成都剧场翻新过半，前成员的归队体检表排了一页。总监，首演日期你定——这次，我们真的能把灯点上了。" },
            { nar: true, t: "（CGT48 重建进入冲刺。完成「招募选拔→剧场翻新→彩排」后，月末将自动举行重启首演。）" },
          ];
        }
        return [
          { s: "陶莺", cls: "speaker-tao", t: "（把一份资产评估报告放在你面前）成都那座剧场，账上还挂着。年内亮不了灯，明年它就是负资产——我会把它从这条河上划掉。" },
          { nar: true, t: "（警告：CGT48 重建仍未过半。若年内无法重启首演，结局评分将大打折扣。）" },
        ];
      },
    },
  ],

  /* ---------- 11月：招商答谢与舆情 ---------- */
  11: [
    {
      id: "m11_26_thanks",
      title: "11月 · 招商答谢会",
      gate: st => true,
      pages: st => [
        { nar: true, t: "年度招商答谢会。到场的品牌比去年少了一半，但留下来的，都是陪这条河淋过雨的人。" },
        { s: "陶莺", cls: "speaker-tao", t: "（致辞，只有一句）谢谢各位还在。明年这个时候，我希望能拿出一份让各位加注的成绩单。" },
        { nar: true, t: "散场后，叶盛数着签下的续约单：不多，但每一单都签了两年起。\n\n「两年，」他说，「够我们干很多事了。」" },
      ],
    },
  ],

  /* ---------- 12月：年末氛围（大赏/总结会由引擎判定） ---------- */
  12: [
    {
      id: "m12_26_yearend",
      title: "12月 · 倒计时",
      gate: st => true,
      pages: st => [
        { nar: true, t: "12月的上海，第一场寒潮如期而至。剧场的暖气烘着玻璃，贴出一层白雾，有粉丝用手指在雾上画了个笑脸。\n\n一年走到最后一步了。无论这个12月是舞台还是会议桌——你把西装外套搭上椅背，像这一年里的每一个月一样。" },
      ],
    },
  ],
};

/* ========================================================================
   二·四·四、理念阵营计数（camp26）
   ------------------------------------------------------------------------
   理念冲突选项通过 STORY.camp26Map 映射到「陶莺实权派 / 王婧遗志派」：
   engine.recordDecision 查表累计 st.camp26 = { tao, wang }；
   12月「年末盘点」按次数多寡结算 decisions.camp26Final（tao / wang / balance），
   留待后续年份剧情回收。以下事件为后半年补植的冲突选项。 */
STORY.camp26Map = {
  cgtPath:    { dissolve: "tao", rebuild: "wang" },   // 序章·会后抉择
  show23Style:{ classic: "tao", nihon: "wang" },      // 2月·新生公演
  jjyCase:    { pressure: "tao", legal: "wang" },     // 4月·新戏开播
  jjyVerdict: { buyout: "tao", cinema: "wang" },      // 6月·庭审之后
  postGE26:   { retain: "wang", invest: "tao" },      // 8月·冠军的十字路口
  elimQ1:     { execute: "tao", stay: "wang" },       // 3/6/9月评审
  elimQ2:     { execute: "tao", stay: "wang" },       // （「调往」不计阵营）
  elimQ3:     { execute: "tao", stay: "wang" },
};

/* 7月：庆功宴筹备（总选前定规格） */
STORY.monthly26[7].push({
  id: "m7_26_campfeast",
  title: "7月 · 庆功宴筹备",
  gate: st => !st.geDone,
  pages: st => [
    { s: "叶盛", cls: "speaker-yesheng", t: "总选举无论结果如何，庆功宴都得办——现在就要定规格。两套方案，我看你最近夹在两位总中间，索性一起报给你。" },
    { s: "陶莺", cls: "speaker-tao", t: "（她那套方案的备注只有一行）工作餐+绩效奖金。钱发到每个人手里，比酒桌实在。" },
    { s: "王婧", cls: "speaker-wangjing", t: "（她那套折了角）全团宴席，家属受邀，老成员请回来坐主桌。这条河十年攒下的不是账面，是这些人彼此的年月。" },
  ],
  choices: [
    { label: "按陶总方案：工作餐加奖金，务实为主", hint: "资金+10 士气-2", tag: "camp26", value: "tao",
      effect: st => { st.money += 10; st.morale = Math.max(0, st.morale - 2); return "庆功宴定在了剧院旁的酒店宴会厅，标准表发到群里，没有一个数字刺眼。务实没有错——只是孩子们私下把「家属受邀」那一栏截图存了下来。"; } },
    { label: "按王总方案：全团宴席，家属与老成员出席", hint: "资金-25 士气+5", tag: "camp26", value: "wang",
      effect: st => { st.money -= 25; st.morale = Math.min(100, st.morale + 5); return "请柬发出去那天，好几个家长回了长语音。老成员从各地赶来，主桌摆了整整两轮——那晚的合影后来被印在了十年纪念册的第一页。"; } },
  ],
});

/* 10月：年度招商方向 */
STORY.monthly26[10].push({
  id: "m10_26_campbiz",
  title: "10月 · 年度招商方向",
  gate: st => true,
  pages: st => [
    { s: "叶盛", cls: "speaker-yesheng", t: "年度招商的两条路线谈到了最后一步：一条是签短单——现金流快，来年随时换船；一条是签长约——金额大但要求整年的内容绑定。" },
    { s: "陶莺", cls: "speaker-tao", t: "（短信）短单。过冬的季节，落袋为安。" },
    { s: "王婧", cls: "speaker-wangjing", t: "（会议记录）长约。用内容换空间——2027年的布局，从这一纸合同开始。" },
  ],
  choices: [
    { label: "短单快结，保住现金流", hint: "资金+70 热度-2", tag: "camp26", value: "tao",
      effect: st => { st.money += 70; st.heat = Math.max(0, st.heat - 2); return "三笔短单一周内全部落定，回款速度创了年内纪录。财务总监难得夸了句「健康」——只是来年的档期，又得从头再谈一遍。"; } },
    { label: "长约绑定，用内容换空间", hint: "资金+30 热度+4", tag: "camp26", value: "wang",
      effect: st => { st.money += 30; st.heat = Math.min(100, st.heat + 4); return "长约签下，品牌方要求全年的内容深度绑定——这既是束缚，也是把这条河钉进 2027 年市场的船锚。"; } },
  ],
});

/* 11月：答谢会形式（改造原叙事事件为带选项） */
(function () {
  const thanks = STORY.monthly26[11].find(e => e.id === "m11_26_thanks");
  if (thanks) {
    thanks.choices = [
      { label: "行业酒会：只请品牌与媒体", hint: "资金+40 热度+3", tag: "camp26", value: "tao",
        effect: st => { st.money += 40; st.heat = Math.min(100, st.heat + 3); return "觥筹交错，名片换了一轮又一轮。行业酒会是高效的网络——只是这一晚的剧场，没有粉丝的名字。"; } },
      { label: "粉丝专场：答谢会开进剧场", hint: "士气+5 热度+4", tag: "camp26", value: "wang",
        effect: st => { st.morale = Math.min(100, st.morale + 5); st.heat = Math.min(100, st.heat + 4); return "把答谢会搬进剧场：品牌方坐一楼，粉丝坐二楼——「让金主看看，这条河的心跳长什么样」。散场时品牌总监说：「明年，我们还来。」"; } },
    ];
  }
})();

/* 12月：年末盘点——结算理念阵营（camp26Final，留待后续年份回收） */
STORY.monthly26[12].unshift({
  id: "m12_26_camp",
  title: "12月 · 年末盘点",
  gate: st => !!(st.camp26 && st.camp26.tao + st.camp26.wang > 0),
  pages: st => {
    const c = st.camp26;
    return [
      { nar: true, t: "年末的最后一次管理层例会，桌上多了一份特别的文件——《2026 年度运营决策复盘》。上面统计的不是营收，是这一年里，你在每一个岔路口的站向。" },
      { nar: true, t: "「陶莺系 · 收缩务实」：" + c.tao + " 次　　「王婧系 · 扩张遗志」：" + c.wang + " 次" },
    ];
  },
  choices: [
    { label: "在这份复盘上，写下自己的注脚", hint: "阵营结算（留待后续年份回收）",
      effect: st => {
        const c = st.camp26 || { tao: 0, wang: 0 };
        let camp, detail;
        if (c.tao > c.wang) {
          camp = "tao";
          detail = "多数的岔路口，你站在了陶莺一边。她在你的年度考核附页写了一句难得的话：「识大体。」——而王婧合上文件时只说了一句：来年，我想看到你把她的地图，也画上一笔。";
        } else if (c.wang > c.tao) {
          camp = "wang";
          detail = "多数的岔路口，你站在了王婧一边。她把复盘收进了堂哥留下的那只抽屉——「他要是看到，会高兴的。」陶莺看完只说：来年的预算会议，我不会再让你这么好过。";
        } else {
          camp = "balance";
          detail = "两个阵营的次数竟然打平。王婧看着复盘笑出了声，陶莺难得没有皱眉——「平衡，也是一种站队。」她们罕见地达成一致：明年，还让这个人来掌舵。";
        }
        st.decisions = st.decisions || {};
        st.decisions.camp26Final = camp;   // 直接写入本地 st（buildEventStep 的 effect 收到哪个 st 就写哪个）
        st.flags.camp26Final = camp;
        return detail + "\n\n（阵营结算：" + camp + "——留待后续年份剧情回收）";
      } },
  ],
});

/* 升格事件跨月复用：安置完成后，下一个满足条件的月末即触发（5~12 月挂载同一事件对象） */
const promoteEv = STORY.monthly26[5].find(e => e.id === "m5_26_promote");
for (const mth of [6, 7, 8, 9, 10, 11, 12]) STORY.monthly26[mth].push(promoteEv);

/* 中秋事件跨线复用（2026 线 9 月） */
STORY.monthly26[9].unshift(STORY.midAutumn);

/* ========================================================================
   二·四·五、荣誉殿堂升堂仪式（STORY.hallAscension，2026 线杨冰怡连霸后触发）
   ======================================================================== */
STORY.hallAscension = st => [
  { nar: true, t: "总选举落幕七天后，一场没有直播的小仪式在剧场举行。\n\n按照集团章程：连续两届总决选第一名，升入「荣誉殿堂」——脱离队伍排班，转入影视部发展，名字从下届候选名单上移除，但永远是这条河的一部分。" },
  { s: "王婧", cls: "speaker-wangjing", t: "（把殿堂徽章别在她胸前）从今天起，你不用再和任何人竞争。但请记住殿堂的规矩——你走过的路，就是留给后来者的路标。" },
  { s: "杨冰怡", cls: "speaker-x", t: "（徽章在灯光下闪了一下，她深吸一口气）谢谢这条河没有在我最不知道去哪的时候松开手。Team X 的位置我让出来，但下一届总选举，我会坐在观众席——为她们按亮每一支应援棒。" },
  { s: "叶盛", cls: "speaker-yesheng", t: "（仪式结束后，替她把最后一个纸箱搬上车）第一个「殿堂」……十年了，这条路终于有人走到了头，又从另一头重新开始。" },
  { nar: true, t: "（杨冰怡转入「荣誉殿堂·影视部」分类；全团士气+3 热度+3。成员页新增「荣誉殿堂」标签页可查看。）" },
];

/* ========================================================================
   二·五、安置剧情（STORY.settleIntro，解散路线首批安置前播放）
   ======================================================================== */
STORY.settleIntro = {
  label: "安置启动周 · 与各分团总监的联席电话会",
  pages: [
    { nar: true, t: "安置方案启动前，你把电话会议排了一下午——三十七个名字要有着落，得先问过每一条河的当家人。" },
    { s: "周马", cls: "speaker-zhouma", t: "（电话里翻着排期表）实话说，广州这边刚完成招新，新血还没消化完——前CGT48的孩子们，最好的出路是去上海本部，跟着一线体系重新起步。只是……陶总那边，未必乐意本部扩编，这个口子她盯得紧。" },
    { s: "周马", cls: "speaker-zhouma", t: "这样，本部实在接收不了的，调来广州。我的名额不多，但每一个来的人，我都保证有舞台。" },
    { s: "孟波", cls: "speaker-mengbo", t: "（嗓门照旧）重庆同理！我们也在招新季，名额有限——但何蔡娴那批老熟人你要是送来，我起立鼓掌欢迎。总监你排名单，我照单全收。" },
    { s: "叶盛", cls: "speaker-yesheng", t: "（挂了电话，翻到最后一个号码）最后是北京……（拨号，听了半分钟，挂断）BEJ48那边说人太多，接收不了。总监——实际上你也知道怎么回事：BEJ这两年的营收不好看，没能力再消化人了。" },
    { s: "叶盛", cls: "speaker-yesheng", t: "所以名额就是这样：上海本部三个，广州两个，重庆两个。每批名单之外的，只能协商解约、发给安置补偿——这一页我来谈，你把人挑好就行。" },
    { nar: true, t: "（每批安置名额：上海 3 人 · 广州 2 人 · 重庆 2 人；未被分配的候选成员将自动协商解约离团，备注「解散安置」。调往上海者转入本部预备生，广州/重庆者进入对应分团预备生。）" },
  ],
};

/* ========================================================================
   三、随机事件池（randomPool26）
   ======================================================================== */
STORY.randomPool26 = [
  {
    id: "r26_survival_show",
    title: "选秀系挖角",
    text: "一档在播选秀节目向本部成员抛出「直通卡」——对新人来说，那是肉眼可见的捷径。",
    choices: [
      { label: "开放内部报名，愿走者送行", effect: st => { st.morale = Math.min(100, st.morale + 3); st.heat = Math.max(0, st.heat - 2); return "你把「直通卡」贴在了公告栏。走了两个人，留下的人却安了心——原来这里不拦人前程。士气+3，热度-2。"; } },
      { label: "以出道资源挽留", effect: st => { st.money = Math.max(0, st.money - 30); st.morale = Math.min(100, st.morale + 2); return "你连夜凑出一套本部出道企划。有人留下了，也有人还是走了。留人如接水，捧得住一时。资金-30，士气+2。"; } },
    ],
  },
  {
    id: "r26_live_platform",
    title: "直播平台合约",
    text: "一家直播平台提出团播独家合作，预付款可观——但条款里的排他性相当苛刻。",
    choices: [
      { label: "签，先落袋为安", effect: st => { st.money += 90; st.heat = Math.max(0, st.heat - 3); return "预付款到账，运营部连夜排班。钱是救命的，只是团播把成员们的时间切成了碎片。资金+90，热度-3。"; } },
      { label: "改条款再签，宁可少拿", effect: st => { st.money += 40; st.heat = Math.min(100, st.heat + 2); return "法务磨了两周，砍掉了最狠的排他条款。预付款薄了一半，舞台时间保住了。资金+40，热度+2。"; } },
    ],
  },
  {
    id: "r26_lawsuit_noise",
    title: "旧案舆情再起",
    text: "合约纠纷又上热搜，评论区涌进大量路人。孩子们在化妆间刷着手机，谁都没说话。",
    choices: [
      { label: "开一次全员说明会", effect: st => { st.morale = Math.min(100, st.morale + 4); st.burden = Math.min(100, st.burden + 6); return "你把案情的来龙去脉、公司的立场、能说的和不能说的，摊开讲了一个小时。「至少我们知道发生了什么」——恐慌止于坦诚。士气+4，负担+6。"; } },
      { label: "冷处理，让法务发声", effect: st => { st.morale = Math.max(0, st.morale - 3); st.heat = Math.max(0, st.heat - 2); return "声明照发了，热搜照挂了。孩子们学会了不刷手机——用沉默保护自己，也是一种职业习惯。士气-3，热度-2。"; } },
    ],
  },
  {
    id: "r26_prep_up",
    title: "预备生冒头",
    text: "一位预备生在周末公演上替补登场，一段直拍在站外意外走红。",
    choices: [
      { label: "顺势加推", effect: st => { st.heat = Math.min(100, st.heat + 5); st.train = Math.min(100, st.train + 2); return "你给她排了三场联名公演。镜头前的小孩眼里的光藏不住——热度和训练房的空气质量一起上涨。热度+5，训练度+2。"; } },
      { label: "压一压，别捧杀", effect: st => { st.train = Math.min(100, st.train + 4); st.morale = Math.max(0, st.morale - 1); return "「先补课，再营业。」她噘着嘴进了特训营，两周后出来，直拍里连呼吸都是稳的。训练度+4，士气-1。"; } },
    ],
  },
  {
    id: "r26_salary_rumor",
    title: "欠薪传闻",
    text: "论坛里流传「公司发不出工资」的帖子，配图是某个月的工资条截图。真假难辨，但人心易慌。",
    choices: [
      { label: "公开账期，承诺按时发薪", effect: st => { st.money = Math.max(0, st.money - 20); st.morale = Math.min(100, st.morale + 5); return "你协调财务提前一周发薪，并把发薪日写进全员公告。钱垫出去了，人心稳住了——这是最划算的一笔支出。士气+5。"; } },
      { label: "让法务辟谣了事", effect: st => { st.morale = Math.max(0, st.morale - 4); st.burden = Math.min(100, st.burden + 8); return "辟谣声明发得很快，办公室里的窃语却停得更慢。叶盛替你一个个谈了一遍心——负担+8，士气-4。"; } },
    ],
  },
  {
    id: "r26_sponsor_exit",
    title: "赞助商撤单",
    text: "某品牌以「品牌调性调整」为由，突然中止年度合作——预付款要求退还。",
    choices: [
      { label: "如约退款，好聚好散", effect: st => { st.money = Math.max(0, st.money - 35); st.heat = Math.max(0, st.heat - 1); return "你按合同退了款，还发了封感谢信。三个月后，这家品牌的市场总监换了人，新总监把合作谈了回来——有时候体面就是先手棋。"; } },
      { label: "走仲裁，寸土必争", effect: st => { st.money += 35; st.heat = Math.max(0, st.heat - 3); st.morale = Math.max(0, st.morale - 2); return "仲裁拖了三个月，钱要回来了大半。圈子不大，消息传得很快——之后两家洽谈，对方都会多问一句「贵司纠纷多吗」。资金+35，热度-3，士气-2。"; } },
    ],
  },
  {
    id: "r26_theater_old",
    title: "剧场管线老化",
    text: "本部剧场用了十几年，空调主机在演出中途罢工，观众席闷成蒸笼。",
    choices: [
      { label: "大修（花费45万）", effect: st => { st.money = Math.max(0, st.money - 45); st.morale = Math.min(100, st.morale + 3); return "彻夜抢修后你干脆批了大修：主机换新，管线重排。盛夏的公演从此清凉——观众没说什么，但二刷率涨了。士气+3。"; } },
      { label: "小修小补撑过夏天", effect: st => { st.money = Math.max(0, st.money - 10); st.heat = Math.max(0, st.heat - 2); st.morale = Math.max(0, st.morale - 2); return "工程师用三台风扇和四场冰块，把夏天熬了过去。成员们在后台妆花了又干，干了又花。士气-2，热度-2。"; } },
    ],
  },
  {
    id: "r26_graduation_whisper",
    title: "毕业传闻",
    text: "「XX要毕业了」的帖子悄悄爬上热榜。当事人照常出勤，只是眼眶有点红。",
    choices: [
      { label: "主动找她聊未来规划", effect: st => { st.morale = Math.min(100, st.morale + 4); st.burden = Math.max(0, st.burden - 6); return "你没有劝留，只帮她把「留下来能走到哪」画成了一张路线图。她看完说：「那再打一年工试试。」士气+4，负担-6。"; } },
      { label: "按流程谈话，一切看合约", effect: st => { st.morale = Math.max(0, st.morale - 2); return "谈话很专业，也很标准。她全程点头，全程客气。有些东西在客气里就冷了。士气-2。"; } },
    ],
  },
  {
    id: "r26_fan_meet",
    title: "十年老粉的来信",
    text: "一位2013年入坑的粉丝来信，附上一沓十年间的票根——她说，这是她第41场公演。",
    choices: [
      { label: "（无需抉择，接受这份重量）", effect: st => { st.morale = Math.min(100, st.morale + 4); st.heat = Math.min(100, st.heat + 2); return "你把信读给全团听。信的结尾写着：「河快干了我知道，可我还想看着它满回来。」那天晚上的合唱，比任何一次排练都齐。士气+4，热度+2。"; } },
    ],
  },
  {
    id: "r26_data_query",
    title: "打投数据质疑",
    text: "有博主质疑总选打投数据注水，贴出「分析长图」，转发量不小。",
    choices: [
      { label: "公开统计口径，第三方审计", effect: st => { st.money = Math.max(0, st.money - 15); st.heat = Math.min(100, st.heat + 3); return "审计报告发出来那天，质疑帖悄悄删了。透明是笨功夫，也是最硬的护城河。热度+3。"; } },
      { label: "不回应，让时间说话", effect: st => { st.heat = Math.max(0, st.heat - 3); return "你按下了回复框的叉。热度散了些，争议也散了些——只是「数据不好看」的印象留了下来。热度-3。"; } },
    ],
  },
];

/* ========================================================================
   四、总选举次日（geAftermath26）
   ======================================================================== */
STORY.geAftermath26 = [
  { s: "叶盛", cls: "speaker-yesheng", t: "（第二天一早，眼睛亮得反常）总监，招商部电话被打爆了——总选的纪录片、周边、场地巡演，全都有人问价。你看，这条河的水位，还是能涨的。" },
  { s: "陶莺", cls: "speaker-tao", t: "（短信）成绩我看到了。继续保持，年底大赏的预算评审，我会手下留情。——陶" },
  { nar: true, t: "（总选举落幕。打投收入已入账，全团热度大涨。距离年末，还有一场硬仗。）" },
];

/* ========================================================================
   五、金曲大赏取消分支（engine 在 9 月末判定后调用）
   ======================================================================== */
STORY.rtCancelEvent = st => [
  { nar: true, t: "9月末，财务评审会议室。空调开得很足，陶莺面前只放着一页纸——本年度的营收曲线。" },
  { s: "陶莺", cls: "speaker-tao", t: "曲线我不念了，都在图上。按年初的约定——本年度金曲大赏，取消。预算并入过冬资金。" },
  { s: "陶莺", cls: "speaker-tao", t: "（停顿了一下）我知道你们练了半年。但经营不是练功，总监——明年把它挣回来。" },
  { s: "叶盛", cls: "speaker-yesheng", t: "（走廊里，把排练表折起来塞回口袋）……孩子们还不知道。今晚的公演，你来讲吧。她们需要一个说法，更需要一个把明年讲清楚的人。" },
  { nar: true, t: "（主线①的金曲大赏部分，以取消收场。年度评分将受影响——但冬天还没结束。）" },
];

STORY.rtCancelledClose = st => [
  { nar: true, t: "12月末，年末总结会。没有舞台，没有灯海，只有一间会议室和一块写满数字的白板。" },
  { s: "叶盛", cls: "speaker-yesheng", t: "（念完最后一页总结，合上文件夹）今年的关键词是「活下来」。明年的是「回来」——先把大赏，还给孩子们。" },
  { s: "陶莺", cls: "speaker-tao", t: "（起身收拾文件，走到门口时停了一下）总监。今年我看过你签的每一份文件——明年，董事会给我的问题会变成「要不要加注」。\n\n别让我的答案太难做。" },
  { nar: true, t: "——2016年，这条河学会了怎么流出去；2026年，它正在学会怎么流回来。\n\n（年度结算见结局页。）" },
];

/* ========================================================================
   六、CGT48 重建场景（scenesCgt，engine.advanceCgt 消费）
   ======================================================================== */
STORY.scenesCgt = {

  /* 阶段①：赴成都对接（0→1） */
  connect: {
    label: "2026年 · 成都 · CGT48 星梦剧院旧址",
    pages: [
      { nar: true, t: "三月的成都还带着湿气。剧场卷帘门拉起一半，你弯腰钻进去——灰尘里，「CGT48」的旧队徽还挂在墙上，应援色的座椅一排一排，安静得像在等谁。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "地方公司的交接人对得很齐：剧场资产、 lease 合同、设备清单——都还在。欠薪的账，集团答应一并结清。这地方没败给谁，就是没人管了。" },
      { s: "陶莺", cls: "speaker-tao", t: "（视频接入）重建的预算，董事会只批了一次论证机会。总监，剧场资产移交协议你直接签——但记住，这笔钱批得很难，别浪费。" },
      { nar: true, t: "协议签完，你在旧队徽下面站了很久。叶盛把一份名单递过来：前CGT48成员的联络表，三十七个名字。\n\n「何蔡娴第一个回的消息，」他说，「就四个字——等这一天。」" },
    ],
  },

  /* 阶段②：志愿者选拔（1→2，选项：重建班底路线） */
  audition: {
    label: "CGT48 重建志愿者选拔",
    pages: [
      { nar: true, t: "选拔通知发下去一周，报名表从三个渠道涌来：成都本地的新人、前CGT48的旧部，还有——你没想到的——本部一群自愿报名的成员。她们在申请理由那一栏，写得最密的一句话是：「想参与一件从零开始的事。」" },
      { s: "何蔡娴", cls: "speaker-tao", t: "（考核日，前CGT48 GII队长，人晒黑了些）总监，我不怕从头再来。我就想确认一件事——这次开起来，还会不会说停就停？" },
      { s: "{name}", cls: "speaker-me", t: "「机制会不一样。分团总监分管、总部指导，账目单列。而我和这份计划——用一年担保它。」" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（考核结束，清点名单）班底怎么搭，你来定。是老CGT带新人的「原味重建」，还是本部骨干混编的「强援空降」？" },
    ],
    choices: [
      { label: "原味重建：老成员为主，传承队魂", hint: "士气+5 热度+2（老粉泪目）", tag: "cgtRoster26", value: "legacy",
        apply: st => { st.morale = Math.min(100, st.morale + 5); st.heat = Math.min(100, st.heat + 2); return "名单公布那天，何蔡娴的名字排在第一个。老粉的帖子刷了一夜：「她们回来了，一个都没少。」队魂这种东西，装不出来，也省不掉。"; } },
      { label: "强援混编：本部骨干带新苗", hint: "训练度+8 士气-2", tag: "cgtRoster26", value: "mixed",
        apply: st => { st.train = Math.min(100, st.train + 8); st.morale = Math.max(0, st.morale - 2); return "本部几位老将带着二十个新苗在成都汇合。训练强度直接对标本部——有人想家想到半夜，但整齐度三天上一个台阶。"; } },
    ],
    after: [
      { nar: true, t: "志愿者名单贴在剧场卷帘门上。有人在名字底下画了颗星星——后来你才知道，那是何蔡娴画的：每一个名字一颗，一个不多，一个不少。" },
    ],
  },

  /* 阶段③：剧场翻新（2→3，选项：设备路线） */
  theater: {
    label: "成都 · 剧场翻新工程",
    pages: [
      { nar: true, t: "翻新工程进场。十年的管线、发潮的地板、半坏的追光——清单拉了三页。预算一百六十万，一分都抠不出来多余的。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "工程队给了两套方案：A案，舞台机械全套换新，效果好但工期长；B案，修旧利废，把预算省一半下来投给内容。" },
      { s: "陶莺", cls: "speaker-tao", t: "（批阅意见只有一行）钱从你手里出，效果从你头上要。" },
    ],
    choices: [
      { label: "A案：舞台机械全套换新", hint: "资金-20万 追加热度+3", tag: "cgtEquip26", value: "new",
        apply: st => { st.money = Math.max(0, st.money - 20); st.heat = Math.min(100, st.heat + 3); return "新的升降台和全套追光进场。验收那天，何蔡娴站在舞台中央试了一整段走位，下来的时候说：「这台子，配得上重启。」"; } },
      { label: "B案：修旧利废，省钱投内容", hint: "资金+30万 训练度+4", tag: "cgtEquip26", value: "save",
        apply: st => { st.money += 30; st.train = Math.min(100, st.train + 4); return "旧追光修好七成，地板只换最费的三排。省下的钱全部投进彩排期——首演的内容密度，比灯光更亮。"; } },
    ],
    after: [
      { nar: true, t: "翻新完工那晚，全组人在空剧场吃了一顿火锅外卖。叶盛把场地大灯开了又关，关了又开：「习惯一下——这灯，以后天天亮。」" },
    ],
  },

  /* 阶段④：首演彩排（3→4，选项：出道曲路线） */
  rehearsal: {
    label: "CGT48 重启首演 · 彩排周",
    pages: [
      { nar: true, t: "彩排周。出道曲的方案摆在桌上，两个封面：一套是旧公演的改编复刻，一套是完全原创的新曲。" },
      { s: "何蔡娴", cls: "speaker-tao", t: "旧公演是老粉的青春，新歌是新河的名片。总监，你挑——我们练哪个都能练到最好。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（翻着曲库档案，忽然停住）总监，你看这个立项号——2016年的《源头计划》，原创曲库第一期的谱子，还躺在档案室里。" },
    ],
    choices: [
      { label: "改编旧公演，先接住老粉的眼泪", hint: "热度+4 士气+3", tag: "cgtSong26", value: "classic",
        apply: st => { st.heat = Math.min(100, st.heat + 4); st.morale = Math.min(100, st.morale + 3); return "前奏一响，排练厅里几个老成员就红了眼。老粉的预售票半天售罄——有些歌是钥匙，十年了还能打开同一把锁。"; } },
      { label: "唱新歌——把2016年的伏笔唱成现实", hint: "热度+6 训练度+3（原创曲库伏笔回收）", tag: "cgtSong26", value: "original",
        apply: st => { st.heat = Math.min(100, st.heat + 6); st.train = Math.min(100, st.train + 3); st.flags.originalOnStage = true; return "谱子从档案室取出来，纸都脆了。作曲人在电话里说：「十年了，终于有人要唱它。」——2016年某个傍晚埋下的种子，在成都的春天发了芽。"; } },
    ],
    after: [
      { nar: true, t: "首演海报贴出：「CGT48 重启首演 · 灯，重新亮起来」。\n\n日期空着——由你的月末来填上。" },
    ],
  },

  /* 重启首演（cgt.stage≥4 的月末自动触发，函数返回页面） */
  debut: st => [
    { nar: true, t: "首演当晚。成都的夜风都是暖的，剧场门口的队伍从街角排到了地铁口——有举着旧应援棒来的老粉，棒子上的漆都掉了一半。" },
    { nar: true, t: "开演前十分钟，何蔡娴在侧台把每位成员的衣领挨个理了一遍——像十年前某个被大家叫「大管家」的人做过的那样。\n\n大幕拉开，追光落下的瞬间，整座剧场「活」了过来。" },
    { s: "何蔡娴", cls: "speaker-tao", t: "（谢幕词）谢谢大家等了一年。CGT48，回来 了——这次，我们陪这条河走很久。" },
    { s: "陶莺", cls: "speaker-tao", t: "（她本人罕见地出现在成都的观众席，散场后只对你说了一句）……灯，是亮的。这一单，算你赢了一半。年底，我等另一半。" },
    { nar: true, t: "（CGT48 重启成功！此后每月为总账带来 25 万收入。成都的灯，重新成为这条河的一部分。）" },
  ],
};

/* ========================================================================
   七、结局文本（endings26）
   ======================================================================== */
STORY.endings26 = {
  S: {
    rank: "S", title: "星河重燃",
    text: "跨年夜，成都与本部的剧场第一次跨城连线，两块大屏里的人合唱同一首歌。\n\nCGT48的灯重新亮了，总选的掌声还在，大赏的舞台按时开幕——年初那份被财经号判了死刑的计划书，每一行都有了着落。\n\n陶莺的年终邮件只有两行：「董事会通过追加预算。另外——合同续签，代理人说，还是你。」\n\n你把邮件关掉，看了一眼窗外的烟花。十年前有人在这条河边许过的愿，2026年，你替他兑现了一半。\n\n剩下一半，明年接着打这份工。",
  },
  A: {
    rank: "A", title: "寒枝抽芽",
    text: "年末总结会上，陶莺第一次没有带财务总监来——只带了秘书，和一份不设前置条件的续任意向书。\n\n「大赏办成了，成都亮灯了，淘汰的刀你也接住了。」她收起文件，「这条河还没有满回来，但冰，是化了。」\n\n散会后叶盛陪你锁门。剧场二楼的灯还亮着——有成员在加练。\n\n你想起年初只亮一半的灯牌。现在，它是满的。",
  },
  B: {
    rank: "B", title: "守土不易",
    text: "这一年，没有奇迹，也没有塌方。\n\n大赏的舞台或简朴或取消，成都的灯亮得慢了些，淘汰评审的红圈圈住了几个名字，也圈住你几次深夜的沉默。\n\n陶莺在年终评语里写：「及格。但及格，守不住一条河。」\n\n你把这句话钉在办公桌对面。2027年，再跟她要一个「好」字。",
  },
  C: {
    rank: "C", title: "长夜未尽",
    text: "年末，董事会会议室内烟味很重——陶莺已经很久不抽烟了，今晚破例。\n\n「计划书上的四条，」她说，「你交回来两条半。」\n\n没有人当场宣布什么。散会时，叶盛把你的旧工牌擦干净递还给你：「留着我这，随时回来。」\n\n你走出大楼，回头看了一眼星梦剧院——灯牌还是只亮一半。\n\n长夜未尽。但你知道，总得有人守到天亮。",
  },
  bankrupt: {
    rank: "D", title: "资金链断裂",
    text: "连续的赤字击穿了董事会的底线。\n\n陶莺在紧急会议上行使了大股东表决权：年度计划终止，制作总监岗位撤编。你没有辩解——账本上的数字，比任何辩解都响。\n\n移交清单交完那天，成都来的消息弹出来：何蔡娴问「首演还办吗」。\n\n你盯着那行字看了很久，没有回复。\n\n——这条河干过很多次。可每一次，都有人把它重新灌满。这一次，灌水的人不是你。",
  },
};

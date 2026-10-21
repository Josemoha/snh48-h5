/* ============================================================================
   data_story_2019.js — 剧情数据（2019「双岸」线，v0.12 新增）
   ----------------------------------------------------------------------------
   【同人声明】本文件全部剧情为粉丝同人虚构创作，与现实无关；真实成员/管理层
   的言行均为艺术演绎，随机事件中涉及成员的一律用「某成员」指代。
   史实锚点（snh48wiki.top 联网调研，见 data_members.js recruit2019 / history2019）：
   · 2019-01-19 第二次全团大组阁 + IDFT（IDOLS FT）训练生池同日成立；
   · SHY48/CKG48 年初经营危机（史实：两团剧场年初停运调整、成员移籍 IDFT/其他分团）；
   · 全年 18 人入团：BEJ48 六期 1（01-03）+ 本部十二期 4（09-14）+ GNZ48 七期 3（09-15/10-26）
     + BEJ48 七期 7（09-28/10-25/11-29 三批）+ 本部十三期 3（11-17/11-29）
     仅有的新入团成员——本部全年零招新，与「招生放慢」的剧情设定互为表里；
   · 2019-01-19 第六届金曲大赏（史实李艺彤蝉联）；
   · 2019-01-19 小分队 DEMOON 于第六届金曲大赏官宣成军（选拔由粉丝投票产生，
     七人：徐子轩/吴哲晗/杨冰怡/张怡/袁一琦/张丹三/张琼予）——游戏中按 2018
     小分队事件同款处理，挂在 2 月：粉丝打投（史实名单挂载）或官方钦点（玩家点将）。

   ----------------------------------------------------------------------------
   【进入方式】本线不从标题页直接开局——由 2018 线结局界面的「进入下一年」入口
   进入（Game.carryTo2019 继承 2018 年末的全部成员卡与经营状态，含荣誉殿堂、
   FT/XII 编制、SHY48/CKG48 开业状态与实力系统）。

   本文件挂载的 STORY 键（engine/ui 按 era==="2019" 消费）：
     STORY.prologue19        序章「双岸」（两条路线分叉：复刻线=子杰主持+TEB48 提议 /
                             非复刻线=王婧主持）＋ pathChoices 两轮决策（TEB48 去留 /
                             分团撤资危机去留）
     STORY.scenes19          行动与事件场景 { tebAudition/tebTheater/tebBiz/tebOpen
                             / reorgDone19 / recruitDone19 / unitScene }
     STORY.hallAscend19(st)  总选连霸升堂事件页（引擎结算后调用）
     STORY.monthly19         月度脚本事件（含每月「预备生汇报公演」共享事件）
     STORY.randomPool19      2019 追加随机事件（引擎与 randomPool 合并取用）
     STORY.geAftermath19(st) 总选举次日剧情
     STORY.rtNarrative19     金曲大赏叙事 { great / normal }
     STORY.endings19         结局文本 { S/A/B/C/bankrupt }

   【五条主线】
     ① 筹建 TEB48（仅复刻线且序章拍板推进；tag teb19Push=go）：四步——
        参与日方台北选拔 → 剧场选址（投入200万）→ 招商（招商款+50万）→
        派遣成员移籍决定（全团点将至多5人、可一个不派；pickMode="teb19"）。
        四步落地后 TEB48 台北星梦剧院开业：一次性热度+6 资金+60，此后每月为总账
        带来 25 万收入；派遣成员移籍 TEB48 建卡（status=branch）。
     ② 二次组阁：行动单段推进 → 三档文案分叉——
        · XII 与 FT 同时在编 → 马跃：「公演排不开了」，缩减队伍；
        · FT 平均人气≥40 → 「FT 的成员们，是时候成为主力了」；
        · FT 平均人气<40 → 「FT 达不到预期」，解散队伍（FT 移出编制目标）。
        本部每队上限 20 / 下限 13，预备生队伍 ≤16；名额已满者必须发配分团或移籍
        IDFT（status="idft"，全团新设训练生池）。pickMode="reorg19" →
        UI.showReorg19Picker（逐人定队+队长队副）→ Game.applyReorg19 落地。
     ③ 年度招新：子杰定调「招生放慢」——本部 9 月招新由总监亲自把关，分团招新一并
        关注。候选池 = DATA.recruit2019（2019 全部 18 人：本部十二/十三期 7 人 + BEJ48 六/七期 8 人 + GNZ48 七期 3 人，史实
        全年仅有）；归属逐一拍板：本部预备生 / 各分团预备生 / 暂不招录，
        队伍归属均为预备生（pickMode="recruit19" → Game.applyRecruit19）。
     ④ 年度活动：第六届总决选（7月）+ 金曲大赏（12月）。本年总选特例——
        「选秀成团在即」：2018 派遣成员实力前 3 成团（限定团），暂时划入暂休
        （备注跟随限定团活动），不参加本年总选；葛佳慧默认不成团（若其暂据名额
        则顺延给下一位）；未成团的派遣成员获得总选加成（geBoost+8，6月成团事件
        统一登记，7月结算回收）。连霸判定沿用引擎通用规则（history.ge2018Top1）。
     ⑤ 借选秀余温布局外务：行动「outreach19」，需 2018 选秀首轮录制完成；
        限定团成团后收益更高（一次性资金+60~90 热度+8）。

   【分团撤资危机（序章第二轮决策，两条线共有；tag branch19Keep）】
     · 复刻线：日方表示可提供资金资助——保住 SHY48/CKG48 需扣除去年年末资金的 1/4；
     · 非复刻线：无日方资助——保住分团需扣除去年年末资金的 1/2；
     · 放弃分团：SHY48/CKG48 停运（月收入终止），两团成员全部进入二次组阁池；
       未编入本部、亦未分配到其余分团的成员，移籍 IDFT。

   决策标签（st.decisions）：teb19Push（go/hold）/ teb19Squad（派遣移籍名单，存姓名）/
     branch19Keep（keep/giveup）/ branchFlag19（孟波保旗，仅 giveup 线：单选项承载 tag，
     实际值在 apply 内按 branchPost 同 2020 年线口径落定为分团名 SHY48/CKG48——
     队伍解散、旗号保留，二次组阁时该团至多 16 人留任为旗号预备生队伍，无剧场收入）/ geStrategy / summerMode19 / recruit19（招新归属表，存id）/
     rtWarn19（9月大赏评审表态）/ demoon19（DEMOON 选人方式：vote=粉丝打投·史实名单 /
     pick=官方钦点·玩家点将）/ unitsDemoon（DEMOON 成军名单，存姓名）。
   旗标（st.flags）：teb19Open（TEB48 开业）/ branchesKept19 / branchesClosed19 /
     reorg19Done / unit19Formed / teb19Debut / outreach19Done。
   ========================================================================== */

"use strict";

/* ========================================================================
   一、序章：双岸（2019 年初决策会议；复刻线/非复刻线分叉）
   ======================================================================== */
STORY.prologue19 = {
  sceneLabel: "2019年1月 · 上海 · 集团年度决策会议",
  pages: st => {
    const rep = Game.isReplicate(st);
    const pages = [];
    if (rep) {
      /* ---------- 复刻线：子杰总结去年成绩 + 宣布 TEB48 ---------- */
      pages.push({ nar: true, t: "2019年1月，上海。\n\n复刻的舞台唱满了第四年，选秀的镜头把孩子们的脸带出了剧场，组阁后的新队伍也站稳了第一年——这条河与秋叶原之间的那道海峡，从来没像今天这么窄过。\n\n今年的第一份议程，只有两个词：「双岸」。" });
      pages.push({ s: "叶盛", cls: "speaker-yesheng", t: "（抱着一摞年报进门，压低声音）总监，今天创始人亲自主持。除了年度总结，还有两件大事等你拍板——一件在台北，一件在沈阳和重庆。" });
      pages.push({ nar: true, t: "九点整，年度决策会议开始。子杰走进来时手里没有拿讲稿——他把去年的成绩单投影在幕布上：组阁落地、选秀出圈、总选票数再破纪录。" });
      pages.push({ s: "子杰", cls: "speaker-wangzj", t: "先说去年的成绩：组阁这把手术刀，动成了。选秀那十一个孩子，替这条河挣回了「实力系」三个字。我在董事会立过的军令状——「下个五年还是头部的」——现在我可以把话说满了。（他停了一下）但成绩越好看，有些话越不好讲。今年，有两封信摆在这张桌子上。" });
      pages.push({ s: "子杰", cls: "speaker-wangzj", t: "第一封，来自东京。AKS 正式提出：他们在台北的选拔已经定档，选拔完毕之后——希望由我们接手，作为台湾分团「TEB48」运营。招牌、剧场、运营，全套走我们这条河的规矩。人，他们出；盘子，我们来接。" });
      pages.push({ s: "王婧", cls: "speaker-wangjing", t: "（把第二封信推到桌子中央，声音沉了下来）第二封不是喜报。沈阳和重庆两地的资方，同时递交了撤资意向——两家分团今年的账，他们不想再兜了。" });
      pages.push({ s: "子杰", cls: "speaker-wangzj", t: "（看向你）TEB48 接不接、分团保不保——这两笔账怎么算，总监，你来拍板。刀在你手里，账也在你手里。" });
    } else {
      /* ---------- 非复刻线：王婧主持会议 ---------- */
      pages.push({ nar: true, t: "2019年1月，上海。\n\n组阁后的新队伍站稳了第一年，选秀的镜头把孩子们的脸带出了剧场——这条河在第七个年头，第一次不需要向任何人证明什么。\n\n而今年的年度决策会议，主持人不是创始人——是王婧。" });
      pages.push({ s: "叶盛", cls: "speaker-yesheng", t: "（抱着一摞年报进门，压低声音）总监，今年王总主持。议程不多，但每一项都沉—— particularly，有一份撤资意向书，沈阳和重庆同时递上来的。" });
      pages.push({ nar: true, t: "九点整，会议开始。王婧把去年的成绩单投影在幕布上：新编制、新公演、总选的新面孔——数据一项一项翻过去，会议室里的气氛难得松快。" });
      pages.push({ s: "王婧", cls: "speaker-wangjing", t: "先说结论：2018 的答卷，董事会通过了。组阁、选秀、总选，三项全数达标——这条河的盘子，比去年稳了一截。（她话锋一转）但稳，是本部的稳。分团那边，今年开年就出了大事。" });
      pages.push({ s: "王婧", cls: "speaker-wangjing", t: "沈阳和重庆两地的资方，同时递交了撤资意向——两家分团今年的账，他们不想再兜了。没有东京方面来分摊（今年我们和日方各走各的路），这笔账，只能我们自己算。" });
      pages.push({ s: "叶盛", cls: "speaker-yesheng", t: "（低声）总监，东京那边的意思也很明确：他们走他们的台北，我们守我们的上海——TEB48 的盘子今年不谈。今年桌上只有一道题：分团，保不保。" });
      pages.push({ s: "王婧", cls: "speaker-wangjing", t: "（看向你）保，是一笔真金白银的账；放，是几十个孩子的去留。这个决定权，按规矩——在你。新的一年，你的打法是什么？" });
    }
    return pages;
  },

  /* 序章选择：新一年方针 */
  styles: [
    { id: "steady19", label: "「先把账算稳，再谈星辰大海。」", hint: "稳进派：资金+80万", apply: st => { st.money += 80; } },
    { id: "polish19", label: "「队伍可以重排，实力必须再涨。」", hint: "淬炼派：全团实力+2，训练度+6", apply: st => { Game.gainAllPwr(st, 2); st.train = Math.min(100, st.train + 6); } },
    { id: "hype19", label: "「选秀的余温还没散——让它烧一整年。」", hint: "造势派：热度+8，叶盛负担-10", apply: st => { st.heat = Math.min(100, st.heat + 8); st.burden = Math.max(0, st.burden - 10); } },
  ],

  /* 序章后的两轮路线抉择（UI.showPrologue 支持 pathChoices 数组顺序播放） */
  pathChoices: [
    /* —— 第一轮：TEB48 去留（仅复刻线；非复刻线整轮跳过） —— */
    {
      gate: st => Game.isReplicate(st),
      title: "TEB48 · 东京的提案",
      choices: [
        { label: "「接手。台北的盘子，我们来运营。」", hint: "追加主线①「筹建 TEB48」：台北选拔→剧场选址→招商→派遣移籍决定（全团至多派5人，可不派）",
          tag: "teb19Push", value: "go",
          apply: st => "你在东京的函件上签了字。子杰看着你的笔尖落纸，只说了一句：「台北的剧场灯亮起来那天，两边的海岸就真正连起来了。」\n\n（决策已登记：teb19Push=go。主线①「筹建 TEB48」开启——四步：参与日方台北选拔→剧场选址→招商→派遣成员移籍决定。）" },
        { label: "「暂缓。今年先把家里的账算清。」", hint: "不开启 TEB48 主线；日方表示理解，合作情分仍在",
          tag: "teb19Push", value: "hold",
          apply: st => "你把函件轻轻推了回去：「容我们一年。」东京方面的回函得体而克制——「门，为你们留着。」\n\n（决策已登记：teb19Push=hold。今年不开启 TEB48 主线。）" },
      ],
    },
    /* —— 第二轮：分团撤资危机（两条线共有） —— */
    {
      title: "撤资危机 · 沈阳与重庆",
      choices: [
        { label: "「保住分团。一条河不能只有主河道。」", hint: st => Game.isReplicate(st)
          ? "接受日方资助：扣除去年年末资金的 1/4；SHY48/CKG48 保留，月收入延续"
          : "无外部资助：扣除去年年末资金的 1/2；SHY48/CKG48 保留，月收入延续",
          tag: "branch19Keep", value: "keep",
          apply: st => {
            const rep = Game.isReplicate(st);
            const cost = Math.round((st.history && st.history.money2018 ? st.history.money2018 : st.money) * (rep ? 1 / 4 : 1 / 2));
            st.money = Math.max(0, st.money - cost);
            st.flags.branchesKept19 = true;
            st.morale = Math.min(100, st.morale + (rep ? 3 : 1));
            return (rep
              ? "东京方面的资助承诺当天走完了流程——复刻路线四年的合作情分，在这一刻变成了真金白银。你把去年年末资金的四分之一划进了分团维稳专户：" + cost + " 万。沈阳与重庆的资方拿到了定心丸，撤资意向书撤回。\n\n（决策已登记：branch19Keep=keep。资金-" + cost + "万（去年年末的1/4，日方资助分摊）；SHY48/CKG48 保住，月收入延续。士气+3。）"
              : "没有东京的钱，你只能动自己的账。你把去年年末资金的一半——" + cost + " 万——划进了分团维稳专户，董事会会议室安静了很久。王婧最终在纪要上补了一句：「总监担了。」\n\n（决策已登记：branch19Keep=keep。资金-" + cost + "万（去年年末的1/2，无外部资助）；SHY48/CKG48 保住，月收入延续。）");
          } },
        { label: "「放弃分团。孩子们，一个都不会被落下。」", hint: "SHY48/CKG48 停运：两团成员进入二次组阁池——未入本部/其余分团者移籍 IDFT 训练生池（签字后，孟波或有话要说）",
          tag: "branch19Keep", value: "giveup",
          apply: st => {
            let n = 0;
            for (const m of st.members) {
              if (m.status === "branch" && (m.branchTeam === "SHY48" || m.branchTeam === "CKG48")) n++;
            }
            st.flags.branchesClosed19 = true;
            if (st.branch17) { st.branch17.shyOpen = false; st.branch17.ckgOpen = false; }
            return "你在撤资意向书的回执上落了笔：「同意。条件——所有在册成员，由集团全数接收。」\n\n沈阳与重庆的剧场灯，会在今年春天次第熄灭；但两团" + n + "名在册成员一个不少地回到了上海名册上——二次组阁的编制会，会给每个人一个去处；一时给不出去处的，进入集团新设的训练生池 IDFT。\n\n（决策已登记：branch19Keep=giveup。SHY48/CKG48 停运（月收入终止）；两团成员进入二次组阁池，未编入者移籍 IDFT。资金无消耗。）";
          } },
      ],
    },
    /* —— 第三轮：孟波的请求（仅放弃分团线）：签字同意停运后，孟波请求保留他所在的
       分团的旗号（同 2020 年线 mengbo20 口径：branchPost=CKG48 → 保 SHY48；
       否则保 CKG48）。队伍解散、旗号保留，二次组阁时该团至多 16 人留任为
       旗号预备生队伍；无剧场收入，其余成员由总监安置（本部/其余分团/IDFT）。 —— */
    {
      gate: st => st.decisions.branch19Keep === "giveup",
      title: "孟波的请求 · 分团的旗号",
      choices: [
        /* 单选项：孟总亲自出资，集团没有理由拒绝——选项仅承载 tag，
           实际保留哪家旗号在 apply 内按 branchPost 同 2020 年线口径落定：
           branchPost=CKG48 → 保 SHY48，否则保 CKG48。 */
        { label: "「同意。牌子留着——十六个孩子，交给你带。」",
          hint: st => "孟波个人出资，保住 " + (st.decisions.branchPost === "CKG48" ? "SHY48" : "CKG48") + " 的旗号——队伍解散，仅留任16人（二次组阁时安排）；其余成员由你安置；无剧场收入",
          tag: "branchFlag19", value: "agree",
          apply: st => {
            const br = st.decisions.branchPost === "CKG48" ? "SHY48" : "CKG48";
            st.decisions.branchFlag19 = br;
            return "散会还没走出会议室，孟波把合同扫描件发了过来：「" + br + " 这块牌子是我看着立起来的。队伍我养不起——旗号，我出钱保。十六个孩子，留给我；其余的，拜托总监了。」\n\n你在合同上签了字——孟总亲自出资，集团没有理由拒绝。\n\n（决策已登记：branchFlag19=" + br + "。" + br + " 解散队伍、保留旗号——二次组阁时该团至多 16 人留任为旗号预备生队伍（无剧场收入）；其余成员由总监安置。）";
          } },
      ],
    },
  ],

  /* 序章收尾：叶盛总结五条主线（TEB48 视拍板结果增减） */
  closing: st => {
    const push = st.decisions && st.decisions.teb19Push === "go";
    const kept = st.decisions && st.decisions.branch19Keep === "keep";
    const head = [];
    head.push({ s: "叶盛", cls: "speaker-yesheng", t: "好——两笔账都落定了。今年的线，我给你数一数：" });
    head.push({ s: "叶盛", cls: "speaker-yesheng", t: "①" + (push ? "TEB48 筹建，四步走：台北选拔、剧场选址、招商、派遣移籍决定；" : "二次组阁，全团重排——")
      + (push ? "②" : "①") + "二次组阁：本部每队二十人编制，预备生队十六人；名额放不下的，发配分团或进 IDFT；"
      + (push ? "③" : "②") + "年度招新——子杰今年只批了十八个名额——本部十二期、十三期重启招新，九月亮名单，总监亲自把关；"
      + (push ? "④" : "③") + "年度活动：七月第六届总决选、十二月金曲大赏——今年总选有新规矩，选秀成团在即，派遣的孩子实力前三将成团出征、暂别总选一年；"
      + (push ? "⑤" : "④") + "选秀的余温还热着——外务的布局，今年要借着这股东风铺开。"
      + (kept ? "" : "另外，沈阳和重庆的交接，年内必须善始善终。") });
    head.push({ nar: true, t: "他掰着手指头数完，把一份空白的编制表放到你桌上——扉页贴着一张便签：\n\n「灯灭的地方，人不能散。——叶盛」\n\n散会后，走廊里遇见几个刚下高铁的分团孩子。她们还不知道，手里的队徽今年会换成什么样子。" });
    return head;
  },
};

/* ========================================================================
   二、行动场景（scenes19）：TEB48 四段 + 组阁公布会 + 招新收官 + 限定团
   ======================================================================== */
STORY.scenes19 = {

  /* ---------- TEB48 第①步：参与日方台北选拔（0→1） ---------- */
  tebAudition: {
    label: "TEB48 · 台北选拔",
    pages: st => [
      { nar: true, t: "台北选拔的甄选现场设在一间临海的排练室——日方的评审席上坐着秋叶原来的老面孔，侧席上，第一次坐进了上海的运营代表。这就是接手的第一步：从甄选开始，用这条河的标准看人。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（看完一整天的甄选，在名单上圈了几个名字）孩子们唱的都是这条河教出来的歌——AKS 的人听得很认真。总监，日方私下说了一句：把运营交给懂舞台的人，他们放心。（热度+4）" },
      { nar: true, t: "（台北选拔参与完成。下一步：剧场选址——需资金≥200万，投入200万。）" },
    ],
  },

  /* ---------- TEB48 第②步：剧场选址（1→2，需资金≥200，投入200） ---------- */
  tebTheater: {
    label: "TEB48 · 剧场选址",
    pages: st => [
      { nar: true, t: "选址组在台湾跑了两个星期，最后把两份方案摆上桌：一份在西门町——人流最旺，租金最贵；一份在松山——便宜三成，但要多养两年人气。你只改了一处：都按星梦剧院的图纸来。" },
      { s: "王婧", cls: "speaker-wangjing", t: "（在租约上盖章）台北星梦剧院，租赁加改造一共两百万。从今天起，这条河的第五座支流剧场，画在了海峡的另一岸。（资金-200万）" },
      { nar: true, t: "（剧场选址完成。下一步：招商。）" },
    ],
  },

  /* ---------- TEB48 第③步：招商（2→3） ---------- */
  tebBiz: {
    label: "TEB48 · 招商",
    pages: st => [
      { nar: true, t: "招商说明会开在台北 101 附近的酒店——「48系第一个跨海运营团」的名头，比任何企划书都好使。本地品牌、日系化妆品、两岸航线航空公司，招标席坐得满满当当。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（把意向金到账的短信给你看）首批三家签约，招商款 50 万入账——还没开演，台北的账先回来了。总监，「双岸」这两个字，市场认。（资金+50万 热度+4）" },
      { nar: true, t: "（招商完成。最后一步：决定是否派遣成员移籍——全团点将至多5人，可以一个不派。）" },
    ],
  },

  /* ---------- TEB48 第④步落地 + 开业首演（→done/open；马嘉伶不可用时直接用本场景） ---------- */
  tebOpen: {
    label: "TEB48 · 开业首演",
    pages: st => [
      { nar: true, t: "台北星梦剧院的首演之夜，剧场外的骑楼上挂起了两排灯——一排写着「AKB48」，一排写着「SNH48」。首演的安可曲，是两岸的孩子用两种语言合唱的同一首歌。" },
      { s: "子杰", cls: "speaker-wangzj", t: "（庆功宴上，难得喝了一杯）从复刻到接盘，四年。这条河终于流进了另一片海。总监——下一座星梦剧院的灯，比你我想象的都亮。（热度+6 资金+60）" },
      { nar: true, t: "（★主线①「筹建 TEB48」达成：台北星梦剧院开业，此后每月为总账带来 25 万收入。首批 16 名成员名单已登记入册。）" },
    ],
  },

  /* ---------- TEB48 开业 + 马嘉伶移籍请求（点将完毕、马嘉伶可用时使用本场景） ----------
     TEB48 首批成员卡已在开业落地时建好；此处追加马嘉伶的移籍请求与拍板。 */
  tebOpenMajia: {
    label: "TEB48 · 开业首演",
    pages: st => [
      { nar: true, t: "台北星梦剧院的首演之夜，剧场外的骑楼上挂起了两排灯——一排写着「AKB48」，一排写着「SNH48」。首演的安可曲，是两岸的孩子用两种语言合唱的同一首歌。" },
      { s: "子杰", cls: "speaker-wangzj", t: "（庆功宴上，难得喝了一杯）从复刻到接盘，四年。这条河终于流进了另一片海。总监——下一座星梦剧院的灯，比你我想象的都亮。（热度+6 资金+60）" },
      { nar: true, t: "（★主线①「筹建 TEB48」达成：台北星梦剧院开业，此后每月为总账带来 25 万收入。首批 16 名成员名单已登记入册：正式成员阿部玛利亚（AKB48十期生兼任）、刘晓晴、林于馨、蔡亚恩、张羽翎、林易沄（总队长）、蔡伊柔、陈诗雅、柏灵；预备生林昀希、胡詠晴、杨家宜、许淳媛、张鈊乔、吕昕恩、刘曣甯。）" },
      { nar: true, t: "庆功宴散场前，叶盛拿进了另一封信——落款不是东京总部，是一个人名：马嘉伶。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（把信递给你，声音压低）她听说了台北建团的消息，连夜写了这封申请——自愿申请移籍 TEB48，做创始成员。台湾选拔出身，国语日文都通，她说那边比谁都需要她这样的人。总监，这个字，还是您来签。" },
      { s: "马嘉伶", cls: "", t: "（信末的附言，字迹工整）我知道上海也有我的舞台。但台北的那间剧场亮灯的第一晚，应该有懂两边的人站在台上——请让我去。" },
    ],
    choices: [
      { label: "批准移籍——她与 TEB48 首批成员一起入册", hint: "马嘉伶移籍 TEB48（在册卡移籍 / 无卡新建卡）；人气+6 羁绊-4",
        tag: "teb19Majia", value: "agree",
        apply: st => Game.resolveTeb19Majia(st, true) },
      { label: "婉拒——她留在 SNH48 的舞台上", hint: "马嘉伶留在 SNH48 方面，台北首批名册上没有她",
        tag: "teb19Majia", value: "reject",
        apply: st => Game.resolveTeb19Majia(st, false) },
    ],
  },

  /* ---------- 二次组阁公布会（→done） ---------- */
  reorgDone19: {
    label: "二次组阁 · 公布会",
    pages: st => [
      { nar: true, t: "二次组阁的公布会定在上午十点——比去年安静得多。念到名字的孩子平静地走向新的队伍区。" + (st.members.some(m => m.status === "idft") ? "\n\n走进 IDFT 训练生池的孩子，胸前换上了一枚没有任何队徽的黑色徽章。「从这里重新开始」——徽章背面刻着这一行小字。" : "") },
      { s: "王婧", cls: "speaker-wangjing", t: "（散会后收着名册，轻声）去年组阁，大家哭是因为舍不得队伍。今年大家安静，是因为——她们已经知道，队伍只是形式，舞台才是家。" },
      { nar: true, t: "（★主线②「二次组阁」达成：新编制名单公布。士气+4 热度+4。）" },
    ],
  },

  /* ---------- 招新收官 ---------- */
  recruitDone19: {
    label: "年度招新 · 收官",
    pages: st => [
      { nar: true, t: "招新收官的当天傍晚，子杰在名单上签了字，签完只说了一句：「十八个，一个不多——这才叫招人。」从五年前的一年招六十个，到今天的十八个名额逐一点过——这条河终于学会了慢下来长个子。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（把名单复印了一份存档）总监，这批孩子进的是预备生池——汇报公演的轮换池会替她们把路铺好。是金子，明年编制会上见。" },
      { nar: true, t: "（★主线③「年度招新」达成：新成员以预备生身份入池，归属由总监拍板。）" },
    ],
  },

  /* ---------- 限定团成团 ---------- */
  unitScene: {
    label: "限定团 · 成团宣布",
    pages: st => [
      { nar: true, t: "成团宣布的发布会开得像一场小型毕业典礼——三个名字被写进「限定团」的合同里，期限一年。台上的人笑着，台下有人抹眼泪：总选的舞台，她们今年要缺席了。" },
      { s: "叶盛", cls: "speaker-yesheng", t: "（把合同递过去签字）总监，一年之约——团是限定的，路不是。她们带着这条河的家底出去，年底带着新的家底回来。剩下的孩子，总选的加成已经批了：今年，让留守的人也被人看见。" },
      { nar: true, t: "（限定团成立：派遣成员实力前3成团，暂休一年、不参加本年总选；未成团的派遣成员获得总选加成。）" },
    ],
  },
};

/* ---------- 总选连霸升堂事件（引擎结算后调用；top1 动态，升堂序次按殿堂在册人数动态） ---------- */
STORY.hallAscend19 = st => [
  { nar: true, t: "第六届总决选的彩带还飘在空中——连续两届第一的名字，第" + (["零","一","二","三","四","五","六"][Math.max(1, st.members.filter(m => m.hall).length)] || Math.max(1, st.members.filter(m => m.hall).length)) + "次被刻在了那面墙上。\n\n荣誉殿堂的升堂仪式在子夜举行。没有喧哗的媒体，只有员工、队友，和一座属于她的奖杯复制件。" },
  { s: "叶盛", cls: "speaker-yesheng", t: "（念完授勋词，把殿堂徽标别在她胸前）连续两届总决选第一名——荣誉殿堂，迎你入堂。从今晚起，这个舞台记住了你的名字，不是一年，是永远。" },
  { s: "{name}", cls: "speaker-me", t: "「这条河会继续往前流。但殿堂会替所有人记得：有人曾在这里，连续两年，站在最高的地方。」" },
  { nar: true, t: "（★荣誉殿堂：连霸升堂完成。此后她不再参加总选举。）" },
];

/* ========================================================================
   三、月度脚本事件（monthly19）
   ======================================================================== */

/* 【共享】预备生汇报公演（2018 制度延续，候选与升格沿用引擎 prepStageCandidates/promotePrepStage）
   每 4 个月一次（4/8/12月），每场升格 2 人，pickMode="prepStagePromote" 逐人定队。 */
const prepEv19 = {
  id: "m_prep_stage19",
  title: "预备生汇报公演",
  gate: s => s.month % 4 === 0 && Game.prepStageCandidates(s).length > 0,   // 每 4 个月一次（4/8/12月）
  pages: s => {
    const stars = Game.prepStageCandidates(s).slice(0, 2);
    const names = stars.map(m => m.name + "（" + (m.status === "branch" ? (m.branchTeam || "分团") + "预备生" : "预备生") + "）").join("、");
    const fromBranch = stars.some(m => m.status === "branch");
    return [
      { nar: true, t: "每四个月一次的预备生汇报公演如期开演——这项制度走完了它的第二年，轮换池里的孩子换了一茬又一茬。舞台总监马跃在本子上圈了两个名字——" + names + "。" },
      { s: "马跃", cls: "", t: "（演出结束，拿着记录本来找你）总监，这两个孩子的进步是断层的：站姿、走位、开口都不说了——她们缺的不是能力，是一个正式的位置。怎么安排，您定。" },
      { nar: true, t: (fromBranch
        ? "（其中有人来自分团——上调本部后，人气与羁绊都会上一个台阶。）"
        : "（预备生升格入队后，人气与羁绊将获得提升。）") },
    ];
  },
  choices: [
    { label: "宣布升格名单，为两人定队", hint: "逐人选择 SII / NII / HII / X（人气与羁绊提升，分团上调加成更多）",
      pickMode: "prepStagePromote" },
    { label: "两人均继续留任预备生观察", hint: "本场暂不升格（下次公演再议）",
      tag: "prepStage19", value: "stay",
      effect: () => "你在汇报表上写下「继续观察」。马跃点点头：「下次公演她们要是还这么稳，您可就不好说了。」" },
  ],
};

STORY.monthly19 = {
  /* ---------- 1月：交接周 + 危机后续 ---------- */
  1: [
    {
      id: "m1_19_handover",
      title: "1月 · 交接周",
      pages: st => {
        const kept = st.decisions.branch19Keep === "keep";
        return [
          { s: "叶盛", cls: "speaker-yesheng", t: "先交个底：去年组阁、选秀两场大仗都打赢了，家底是这几年最厚的一份——但" + (kept ? "分团维稳专户刚划走一大笔，今年的账要精打细算" : "分团停运的交接刚开了头，几十个孩子的安置，是今年最重的一份人心账") + "。" },
          { s: "叶盛", cls: "speaker-yesheng", t: "还有件事得提前说：IDFT 训练生池已经挂牌——以后本部编不下的孩子都有了去处，训练生满一年可参加汇报公演争取回归。总监，组阁、招新、总选、大赏——2019 年的关键词是：归位。" },
          { nar: true, t: "你把台历翻到 1 月的第一页。二次组阁的编制表还是空白的——今年这支笔，比去年更重。" },
        ];
      },
    },
    {
      /* 【2019 复刻线专属】AKB48亚洲盛典（1月）：史上第一次全亚洲团体大集结（曼谷）。
         选项为 pickMode="asiafest7"，由 UI 弹出七人点将窗（除 2018 选秀派遣成员外全团可点），
         生效逻辑在 engine.asiaFest19Squad。 */
      id: "m1_19_asiafest",
      title: "1月 · 来自东京的第二封信：亚洲盛典",
      gate: st => ((st.decisions && st.decisions.jpMode) || st.jpMode) === "replicate" && !st.flags.asiaFest19,
      pages: st => [
        { nar: true, t: "新年第一周，一封从东京寄来的加急函件送到了总监办公室——落款是 AKS。信封里除了邀请函，还有一张七团合照的预想图：曼谷、曼谷的场馆、还有每一家团体的队徽。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（念函件）「史上第一次——AKB48 Group 亚洲盛典」，亚洲所有团体大集结，三月末，泰国曼谷。这是这个牌子二十年来头一回，把整个亚洲的舞台装进同一晚。上海，在日本这边，是第一个被点名的海外团体。" },
        { s: "王婧", cls: "speaker-wangjing", t: "（把预想图钉在白板上）复刻路线走到第四年，这份情分是真的——门票、接待、合舞台顺序，日方全包。我们只需要定一件事：派谁去。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（小声提醒）选秀派遣的那批孩子动不了——封闭集训一天都不能断。但剩下的人里，七个名额，亚洲的镜头，谁去谁露脸。总监，名单你来定。" },
      ],
      choices: [
        { label: "点将七人，奔赴曼谷", hint: "除选秀派遣成员外全团可点；被选中者羁绊+8 人气+4；热度+8 士气+3 资金-20万",
          pickMode: "asiafest7" },
      ],
    },
    prepEv19,
  ],

  /* ---------- 2月：组阁专班 + DEMOON 成军 + 危机余波 ---------- */
  2: [
    {
      id: "m2_19_reorg_kick",
      title: "2月 · 组阁专班",
      gate: st => !st.flags.reorg19Done,
      pages: st => {
        const xii = st.flags.xiiKept18 && st.members.some(m => m.status === "active" && m.team === "XII");
        const ftList = st.members.filter(m => m.status === "active" && m.team === "FT");
        const ftAvg = ftList.length ? Math.round(ftList.reduce((a, m) => a + (m.pop || 0), 0) / ftList.length) : 0;
        let talk;
        if (xii && ftList.length) {
          talk = { s: "马跃", cls: "", t: "（把两份公演排期表拍在桌上）总监，我这排期真的排不开了——XII 和 FT 两支队伍的公演、巡演、番外全挤在一起，剧场就一个。要缩减队伍，就在这次组阁里一起解决。" };
        } else if (ftList.length && ftAvg >= 40) {
          talk = { s: "马跃", cls: "", t: "（把 FT 这一年的上座曲线推过来）总监，FT 这一年人气涨到了" + ftAvg + "——但多一支队就多一份排期和开销。二次组阁把 FT 收编进主力序列，她们的牌子，这次要收起来了。" };
        } else if (ftList.length) {
          talk = { s: "马跃", cls: "", t: "（把 FT 这一年的账本推过来，声音放低）总监，FT 达不到预期——平均人气只有" + ftAvg + "，剧场的灯养不起一支叫好不叫座的队伍。需要解散队伍，让孩子们重新排队。这次组阁，下手要快，也要轻。" };
        } else {
          talk = { s: "王婧", cls: "speaker-wangjing", t: "（把三张表推过来）人气、实力、编制——三张表对不上的地方，去年组阁动了一半，今年要动完。二次组阁的名单，还是您来落笔。" };
        }
        return [
          { nar: true, t: "组阁专班第二次成立。墙上又钉起了三张表——只是这一次，表上多了两支年轻队伍的去留" + (st.flags.branchesClosed19 ? "，和一沓来自沈阳、重庆的移交名册" : "") + "。" + (st.flags.branchesClosed19 ? "\n\n分团移交的名册装订成册，放在墙角——" + st.members.filter(m => m.status === "branch" && (m.branchTeam === "SHY48" || m.branchTeam === "CKG48")).length + "个名字，每一个都要在编制会上有个去处。" : "") },
          talk,
          { s: "叶盛", cls: "speaker-yesheng", t: "（提醒）本部每队上限二十人、下限十三人，预备生队伍至多十六人；名额实在放不下的——发配分团，或者进 IDFT 训练生池。行动里随时可以启动编制会。" },
        ];
      },
    },
    {
      /* 【2019 通用·小分队】金曲大赏上公布了企划「DEMOON」，2月正式成军。
         tag demoon19：vote（粉丝打投——热度+4 士气+2，按史实名单挂载成军）/
                       pick（官方钦点——链式解锁七人点将窗，成员由玩家指定）。
         史实名单（snh48wiki 档案考据，2019-01-19 第六届金曲大赏官宣，粉丝投票选出）：
         DEMOON = 徐子轩、吴哲晗、杨冰怡、张怡、袁一琦、张丹三、张琼予。
         （史实成员不在本时间线在册名单中时，名单照常公示，数值挂载自动跳过。） */
      id: "m2_19_demoon",
      title: "2月 · 小分队 DEMOON",
      gate: st => !st.decisions.demoon19,
      pages: st => [
        { nar: true, t: "年末的金曲大赏压轴环节，大屏上闪过一段暗色系的预告片——七个剪影、一枚月蚀标志，没有名字，只有一行小字：「DEMOON，即将蚀月而出」。一个月过去，企划的细节终于摆上了你的桌面：七人编制，走酷飒暗黑的舞台路线，和小分队 7SENSES 的甜美系打差异战。" },
        { s: "王婧", cls: "speaker-wangjing", t: "（把企划书推到桌中央）7SENSES 证明了小分队这条路走得通，DEMOON 是第二条腿——风格完全反过来，抢的就是另一批观众。选人方式，集团让你拍板：粉丝打投，还是官方钦定。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（低声补充）打投就是让粉丝把名字一张张顶上来——成军夜的热搜就是现成的官宣素材；官方钦定则稳，七个人选谁不选谁，这份权衡权在您手里。七个位置，请您定规矩。" },
      ],
      choices: [
        { label: "方案一：粉丝打投定名单", hint: "热度+4 士气+2；DEMOON 七人按粉丝投票结果（史实名单）成军",
          tag: "demoon19", value: "vote",
          effect: st => {
            const DEMOON = ["徐子轩", "吴哲晗", "杨冰怡", "张怡", "袁一琦", "张丹三", "张琼予"];
            st.decisions.unitsDemoon = DEMOON.slice();
            const inRoster = [];
            for (const n of DEMOON) {
              const m = st.members.find(x => x.name === n);
              if (m && m.status !== "left") {
                inRoster.push(n);
                m.pop = Math.min(100, (m.pop || 0) + 3);
                m.bond = Math.min(100, (m.bond || 0) + 3);
                m.note = (m.note ? m.note + "；" : "") + "SNH48小分队DEMOON成员（粉丝打投成军）";
              }
            }
            st.heat = Math.min(100, st.heat + 4);
            st.morale = Math.min(100, st.morale + 2);
            const missing = DEMOON.filter(n => inRoster.indexOf(n) < 0);
            return "打投通道开启，粉圈连夜刷起了话题——月蚀应援色的话题挂了一周，七天后，DEMOON 的名单随投票结果一并公布：" + DEMOON.join("、") + "。官宣微博转发破十万，评论区有人写道：「月蚀了，新天象来了。」"
              + (missing.length ? "\n\n（其中" + missing.join("、") + "不在本时间线的在册名册上——名单照史实的投票结果公示，数值挂载自动跳过。）" : "")
              + "\n\n（决策已登记：demoon19=vote。热度+4 士气+2，七人小分队成军——粉丝的选择，和史实写在了同一行。）";
          } },
        { label: "方案二：官方钦点定名单", hint: "热度+2；七个位置由你亲自点将（选中者人气+5 羁绊+5）",
          tag: "demoon19", value: "pick",
          effect: st => { st.heat = Math.min(100, st.heat + 2);
            return "你在方案二上落了笔：「DEMOON 的名单，公司来定。」企划组连夜搭起评审流程——七个位置，酷飒路线需要的是另一种镜头脸，名单由总监亲自圈定。（决策已登记：demoon19=pick。热度+2——接下来，该点将了。）"; } },
      ],
    },
    {
      /* 【小分队·官方钦点】DEMOON 七人点将（链式解锁：demoon19=pick 后触发；pickMode="demoonpick"） */
      id: "m2_19_demoon_pick",
      title: "2月 · DEMOON 名单",
      gate: st => st.decisions.demoon19 === "pick" && !st.decisions.unitsDemoon,
      pages: st => [
        { nar: true, t: "DEMOON——七人小分队，走酷飒暗黑的舞台路线：眼妆、黑色打服、电子摇滚编曲，和 7SENSES 的甜美系站在天平的两端。七个位置，七种锋利。" },
        { s: "王婧", cls: "speaker-wangjing", t: "（看名单）企划组的意见是：这个团不挑最红的，挑最「像 DEMOON」的——台风、眼神、扛得住暗色系舞台的气场。总监，名单在你笔下。" },
      ],
      choices: [
        { label: "圈定 DEMOON 七人名单", hint: "选中七人：人气+5 羁绊+5（小分队成军曝光）",
          pickMode: "demoonpick" },
      ],
    },
    prepEv19,
  ],

  /* ---------- 3月：组阁提醒 ---------- */
  3: [
    {
      id: "m3_19_reorg_urge",
      title: "3月 · 编制表的空行",
      gate: st => !st.flags.reorg19Done,
      pages: st => [
        { nar: true, t: "组阁专班的编制表在墙上贴了一个月，空行还没填完。走廊里，孩子们看你的眼神都带着一点小心——谁都明白，名单晚出一天，人心就多悬一天。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把笔放在你桌上）总监，史实的日历翻到了三月——这条河历史上的第二次大组阁，等您落笔。行动里随时可以启动编制会。" },
      ],
    },
    prepEv19,
  ],

  /* ---------- 4月：TEB48 推进 + 分团稳军心 ---------- */
  4: [
    {
      id: "m4_19_teb_progress",
      title: "4月 · 海峡对岸的进度",
      /* 【线路专属】仅复刻线且序章拍板推进才触发：显式加 isReplicate 门槛，
         避免旧档/异常路径误带 teb19Push=go 时在非复刻线漏出 */
      gate: st => Game.isReplicate(st) && st.decisions.teb19Push === "go" && !st.teb19.done,
      pages: st => [
        { nar: true, t: "台北方面的筹备周报每周一准时抵达：选拔的报名人数、剧场的改造进度、招商的问询函——「双岸」的蓝图，正在一页一页变成施工图。" },
        { s: "王婧", cls: "speaker-wangjing", t: "（把周报摞好）日方那边传话：台北选拔的甄选席，希望中方派运营代表参加——这一步，是接手的开始。行动里的 TEB48 筹备，随时可以推进。" },
      ],
    },
    {
      id: "m4_19_branch_steady",
      title: "4月 · 南北两盏灯",
      gate: st => st.decisions.branch19Keep === "keep",
      pages: st => [
        { nar: true, t: "撤资风波过去一个季度，沈阳与重庆的剧场照常亮灯。各地的后援会自发组织了「留守应援」——灯牌上写的是：「我们还在。」" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把两地的月报递给你）总监，维稳专户的钱花得值——两团的公演上座没有掉，孩子们的训练量反倒上去了。她们都知道，这条河没有放弃任何一支支流。（士气+2 热度+2）" },
      ],
      choices: [
        { label: "（收下这份月报）", effect: st => { st.morale = Math.min(100, st.morale + 2); st.heat = Math.min(100, st.heat + 2); return "你在两份月报上分别批了「辛苦」。据说批件贴出来那天，沈阳的孩子们在排练室里喊了一嗓子，重庆的孩子们多练了一个小时。士气+2，热度+2。"; } },
      ],
    },
    prepEv19,
  ],

  /* ---------- 5月：总选启动 ---------- */
  5: [
    {
      /* 【2019 通用】阿吉的一年之约到期（需 2018 挽留成功 flags.ajiStay18）：
         离行前留下两套借选秀势头的外务方案。
         tag ajiFarewell19：out（主外：超新星运动会）/ in（主内：燃烧吧团魂）。 */
      id: "m5_19_aji_farewell",
      title: "5月 · 阿吉的告别",
      gate: st => !!st.flags.ajiStay18 && !st.decisions.ajiFarewell19,
      pages: st => [
        { nar: true, t: "五月的第一个工作日，综艺部的灯又亮到了很晚——只是这次不是加班，是告别。阿吉把工牌摘下来，放进了纸箱最上面——去年的今天，他留下过一份辞呈；你留住了他一年。" },
        { s: "阿吉", cls: "speaker-aji", t: "总监，一年之约，到期了。《梦想演播厅》收官、选秀开了花、爸妈那边我也安排妥了——这次，是真的要走了。\n\n（他把一个牛皮纸袋放到你桌上）临走前，留个东西给您。选秀这股热度不能白白让它凉——我拟了两套外务方案，您挑一套。" },
        { s: "阿吉", cls: "speaker-aji", t: "方案一，主外：集团已经派了男团去参加今年度的选秀——咱们这边，就去接鹅厂的《超新星运动会》，继续把选秀的热度烧下去。方案二，主内：做一档《燃烧吧！团魂》，接档《梦想演播厅》——以队伍为核心的小圈内选秀，把去年的组阁、今年的磨合，都变成节目。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（看着纸箱）主外是往外借风——运动会赛场上的每一次冲刺都是热搜；主内是往里攒劲——队伍的默契，是拿钱买不来的。总监，阿吉的最后一案，您定。" },
      ],
      choices: [
        { label: "主外：接《超新星运动会》，继续选秀热度", hint: "资金+30万 热度+10 士气-4；人气前12名成员人气+3",
          tag: "ajiFarewell19", value: "out",
          effect: st => {
            st.heat = Math.min(100, st.heat + 10);
            st.money += 30;
            st.morale = Math.max(0, st.morale - 4);
            const reps = st.members.filter(m => m.status === "active" && !m.hall && m.team !== "HALL")
              .sort((a, b) => (b.pop || 0) - (a.pop || 0)).slice(0, 12);
            for (const m of reps) m.pop = Math.min(100, m.pop + 3);
            return "运动会的官宣连夜发出——塞纳河的女孩子们出现在了田径场和泳池边。选拔、训练、比赛，连轴转了一个月：热搜上了三回，通告费到账，就是所有人都瘦了一圈。（决策已登记：ajiFarewell19=out。资金+30万 热度+10 士气-4；人气前12名成员人气+3。）";
          } },
        { label: "主内：立项《燃烧吧！团魂》小圈选秀", hint: "全队伍磨合度+5 队友关系升温；士气+4 热度+6 训练度+4 资金+10万",
          tag: "ajiFarewell19", value: "in",
          effect: st => {
            st.morale = Math.min(100, st.morale + 4);
            st.heat = Math.min(100, st.heat + 6);
            st.train = Math.min(100, st.train + 4);
            st.money += 10;
            Game.syncTeams(st);
            for (const k in st.chem) {
              st.chem[k] = Math.min(100, st.chem[k] + 5);
              const list = Game.teamRoster(st, k).filter(m => !m.hall);
              for (const m of list) {
                const mates = list.filter(x => x.id !== m.id);
                if (mates.length) Game.relAdd(st, m.id, mates[Game.rnd(0, mates.length - 1)].id, 1);
              }
            }
            return "《燃烧吧！团魂》官宣：以队伍为单位的团内小圈选秀——舞台、票务、淘汰，全部队伍共担。排练室里第一次出现了互相抠动作到深夜的场面：队荣在此一举。节目上线当天，弹幕里刷得最多的一句话是：「原来她们队伍感情这么好。」\n\n（决策已登记：ajiFarewell19=in。全队伍磨合度+5 队友关系升温；士气+4 热度+6 训练度+4 资金+10万。）";
          } },
      ],
    },
    {
      id: "m5_19_ge_kick",
      title: "5月 · 总决选启动",
      pages: st => [
        { s: "叶盛", cls: "speaker-yesheng", t: "七月底，第六届总决选——去年的霸主" + (st.history.ge2018Top1 ? "（" + st.history.ge2018Top1 + "）" : "") + "若能连霸，荣誉殿堂就将迎来第" + (["零","一","二","三","四","五","六"][st.members.filter(m => m.hall).length + 1] || (st.members.filter(m => m.hall).length + 1)) + "次升堂仪式。今年总选有个新变量：限定团的三个名额，会把实力最强的几个孩子暂时请出这个舞台。" },
        { s: "王婧", cls: "speaker-wangjing", t: "（短信）选秀成团在即，集团的意思是：让最合适的人去最合适的地方。总选的名单少三个名字，但舞台的盘子会更大——打投照常，别自乱阵脚。" },
      ],
    },
    prepEv19,
  ],

  /* ---------- 6月：总选冲刺 + 限定团成团 ---------- */
  6: [
    {
      id: "m6_19_ge_strategy",
      title: "6月 · 总选冲刺会议",
      pages: st => [
        { s: "叶盛", cls: "speaker-yesheng", t: "总决选倒计时一个月。打投组的名单要重新核对——今年少掉的那三个名字，空出来的票仓，谁来接？资源怎么分，老规矩，你说了算。" },
      ],
      choices: [
        { label: "集中火力：把资源押在人气最高者身上", hint: "冲冠概率大增，热度收益高，士气-6", tag: "geStrategy", value: "focus",
          effect: st => { st.geStrategy = "focus"; return "资源表格被重新排过：镜头、通告、物料，全部向头部倾斜。今年有人想用蝉联证明：这条河的王座，稳得很。"; } },
        { label: "雨露均沾：让每个孩子都被看见", hint: "全团士气+8，羁绊提升，冲榜收益降低", tag: "geStrategy", value: "balance",
          effect: st => { st.geStrategy = "balance"; return "你把计划表摊开，给每一位参选成员都留了一页自己的方案。限定团带走三个名字——就让留下的每一个，都被看见。"; } },
      ],
    },
    {
      /* 【主线④】限定团成团（自动结算，无选项——pages 与 effect 走同一个确定性选择器） */
      id: "m6_19_unit",
      title: "6月 · 限定团 · 成团宣布",
      gate: st => !st.flags.unit19Formed && st.show18 && Array.isArray(st.show18.squad) && st.show18.squad.length > 0,
      pages: st => {
        const sel = Game.unit19Selection(st);
        const names = sel.debut.map(m => m.name).join("、");
        return [
          { nar: true, t: "选秀成团的官方名单在万众瞩目里公布——而这张合同上，写着三个从这条河走出去的名字：" + names + "。\n\n限定团，期限一年。这一年里，她们将随团活动、暂别剧场与总选；一年之后，随时欢迎回家。" },
          { s: "叶盛", cls: "speaker-yesheng", t: "（把三份新合同放到桌上，声音有点复杂）实力前三，集团内测的评分没跑——这是她们自己挣来的位置。总监，签了字，总选的名单就要空出三行了。（留守的派遣成员将获得总选加成）" },
        ];
      },
      choices: [
        { label: "签字——送她们成团出征", hint: "实力前3派遣成员成团（暂休一年，不参加本年总选）；葛佳慧默认不成团；未成团派遣成员总选加成",
          tag: "unit19", value: "form",
          effect: st => Game.formUnit19(st).text },
      ],
    },
    {
      /* 【2019 通用】葛佳慧的谈心：挂在限定团成团宣布之后。
         条件：成团已签字 · 葛佳慧在籍且参加过 2018 选秀派遣 · 本事件未触发过。 */
      id: "m6_19_gjm_talk",
      title: "6月 · 葛佳慧的谈心",
      gate: st => {
        if (!st.flags.unit19Formed || st.flags.gjmTalk19Done) return false;
        const g = st.members.find(x => x.name === "葛佳慧");
        if (!g || g.status !== "active") return false;
        const sq = ((st.show18 && st.show18.squad) || [])
          .map(id => { const m = st.members.find(x => x.id === id); return m ? m.name : ""; });
        return sq.indexOf("葛佳慧") >= 0;
      },
      pages: st => [
        { nar: true, t: "成团宣布会的热闹散尽之后，办公室的门被轻轻敲响——是葛佳慧。她把一封手写的信放在你桌上，信封上没有称呼。" },
        { s: "葛佳慧", cls: "speaker-gjh", t: "总监，这一年我一直在想一件事。选秀的舞台把我推到了全网的镜头前——也让我第一次看清了，自己和那些真正的实力派之间，隔着多远的距离。" },
        { s: "葛佳慧", cls: "speaker-gjh", t: "您为我发过专辑、留过位置，这条河对我够好了。可正因为这样，我不想再骗自己——我想离开一段时间，出去看看，去看看外面的舞台到底是什么样的。（她的手指在信封边缘轻轻发抖）这个决定，我想先告诉您。" },
      ],
      choices: [
        { label: "安抚并留下", hint: "羁绊+8 士气+3——「差距是留下来一场一场磨出来的」", tag: "gjmTalk19", value: "stay",
          effect: st => {
            const g = st.members.find(x => x.name === "葛佳慧");
            st.flags.gjmTalk19Done = true;
            if (g) { g.bond = Math.min(100, g.bond + 8); g.note = (g.note ? g.note + "；" : "") + "2019 · 谈心后被留下"; }
            st.morale = Math.min(100, st.morale + 3);
            return "你把信推了回去：「差距不是逃出来的，是留下来一场一场磨出来的。总选的舞台就在下个月——用成绩说话。」她怔了很久，把信撕了。走廊外，值班的叶盛悄悄松了口气。（羁绊+8 士气+3）";
          } },
        { label: "允许离开（暂休）", hint: "葛佳慧暂休（保留回归可能）；士气-2 热度-2", tag: "gjmTalk19", value: "rest",
          effect: st => {
            const g = st.members.find(x => x.name === "葛佳慧");
            st.flags.gjmTalk19Done = true;
            if (g) { g.status = "rest"; g.note = "2019-06 外出看世界（暂休，保留回归可能）"; }
            st.morale = Math.max(0, st.morale - 2);
            st.heat = Math.max(0, st.heat - 2);
            return "你在暂休申请上签了字：「去吧。灯给你留着，什么时候想回来，提前一个月说。」她深深鞠了一躬。后来粉丝在她的行李箱照片里，认出了那条河的应援色。（葛佳慧暂休 士气-2 热度-2）";
          } },
        { label: "允许离开，但按合同支付违约金", hint: "解约离团，资金+80万；士气-3 热度-2；她若在 HO2/BlueV，该小分队解散", tag: "gjmTalk19", value: "buyout",
          effect: st => {
            const g = st.members.find(x => x.name === "葛佳慧");
            st.flags.gjmTalk19Done = true;
            /* 【判定】先取小分队归属再改备注（备注会被解约信息覆盖）；她在 HO2/BlueV 则离团后小分队解散 */
            const subG = Game.memberSubUnit(st, "葛佳慧");
            if (g) { g.status = "left"; g.note = "2019-06 支付违约金解约，外出发展"; }
            st.money += 80;
            st.morale = Math.max(0, st.morale - 3);
            st.heat = Math.max(0, st.heat - 2);
            const extra = Game.dissolveSubUnit19(st, subG);
            return "「合同是合同，」你说，「违约金一分不能少。」她点头，签得很平静——钱到账那天，办公室安静得能听见空调声。孩子们私下议论了好几天：原来离开，是要付代价的。（资金+80万 士气-3 热度-2）" + extra;
          } },
      ],
    },
    prepEv19,
  ],

  /* ---------- 7月：总决选之夜（连霸升堂由引擎判定） ---------- */
  7: [
    {
      id: "m7_19_election",
      title: "7月末 · 第六届总决选",
      pages: st => [
        { nar: true, t: "总决选之夜，梅赛德斯奔驰文化中心。观众席比去年多了几块新的应援色——分团的孩子、预备生的名字，第一次有人举灯牌。\n\n名单即将揭晓。" },
      ],
    },
  ],

  /* ---------- 8月：夏日巡演 + 亚洲盛典（上海） ---------- */
  8: [
    {
      /* 【2019 非复刻线专属】AKB48亚洲盛典（8月）：对手把亚洲最大的舞台开到了家门口。
         AKB48 今年取消总选，AKB48 TSH 与亚洲各团体的盛况不输总选。 */
      id: "m8_19_asiafest_sh",
      title: "8月 · AKB48亚洲盛典 · 上海",
      gate: st => ((st.decisions && st.decisions.jpMode) || st.jpMode) !== "replicate" && !st.flags.asiaFest19,
      pages: st => [
        { nar: true, t: "八月，上海的地铁报站里多了一个新名字——AKB48亚洲盛典。这是这个牌子史上第一次全亚洲大集结，主会场就定在梅赛德斯奔驰文化中心，和总选同一个场馆。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把一手消息拍在桌上）更劲爆的是：AKB48 今年官宣取消了总选举。但您看看这阵容——AKB48 TSH 领衔，加上亚洲所有团体，两天四场，票价炒到三倍。这盛况，一点不输总选。" },
        { s: "王婧", cls: "speaker-wangjing", t: "（看着窗外）对手把亚洲最大的舞台开到了我们家门口。是接、是避、还是借——总监，这次的题不好答。" },
      ],
      choices: [
        { label: "地主加场：盛典同期连开剧场公演+周边快闪", hint: "资金+60万 热度+6 士气-5——两边的粉丝总得找地方花钱",
          tag: "asiaFest19", value: "cash",
          effect: st => { st.flags.asiaFest19 = true; st.money += 60; st.heat = Math.min(100, st.heat + 6); st.morale = Math.max(0, st.morale - 5); return "盛典那几天，星梦剧院门口的快闪摊从早排到晚，加场公演场场满座。成员们连轴转了一整周，累得说不出话——但账面上，是这条河今年最漂亮的一周之一。（资金+60万 热度+6 士气-5）"; } },
        { label: "闭门练兵：不凑热闹，照常公演+全员集训", hint: "士气+5 训练度+8 全团实力+1——热闹是别人的，本事是自己的",
          tag: "asiaFest19", value: "quiet",
          effect: st => { st.flags.asiaFest19 = true; st.morale = Math.min(100, st.morale + 5); st.train = Math.min(100, st.train + 8); Game.gainAllPwr(st, 1); return "那两天，排练室的灯亮到最晚。有成员在练习日志里写：「他们在隔壁热闹，我们在给明年攒本事。」训练度+8，全团实力+1，士气+5。"; } },
        { label: "曲线借势：组织骨干买票观摩取经", hint: "资金-15万：训练度+5 全团实力+1 热度+2——对手的舞台，也是最好的教材",
          tag: "asiaFest19", value: "study",
          effect: st => { st.flags.asiaFest19 = true; st.money -= 15; st.heat = Math.min(100, st.heat + 2); st.train = Math.min(100, st.train + 5); Game.gainAllPwr(st, 1); return "盛典没我们的席位——但买票总不用谁批准。十几个骨干混在观众席里记了两天笔记，回来当晚就开了复盘会。票房数据、编排节奏、应援组织……对手的舞台，也是最好的教材。（资金-15万 训练度+5 全团实力+1 热度+2）"; } },
      ],
    },
    {
      id: "m8_19_summer",
      title: "8月 · 夏日巡演",
      pages: st => [
        { s: "叶盛", cls: "speaker-yesheng", t: "暑期巡演的报价来了。今年有个新选项：借着选秀的余温，把巡演开进商业综合体——场租便宜、曝光更大，就是累。" },
      ],
      choices: [
        { label: "连跑五城，商业收益拉满", hint: "资金+130 士气-10 热度+6", tag: "summerMode19", value: "tour",
          effect: st => { st.money += 130; st.morale = Math.max(0, st.morale - 10); st.heat = Math.min(100, st.heat + 6); return "五城巡演场场爆满，回程大巴上安静得可怕——所有人都累得睡着了。资金+130，热度+6，士气-10。"; } },
        { label: "只跑三城，巡演带集训", hint: "资金+70 训练度+10 全团实力+1", tag: "summerMode19", value: "compact",
          effect: st => { st.money += 70; st.train = Math.min(100, st.train + 10); Game.gainAllPwr(st, 1); return "三城巡演+随团集训，白天演出晚上抠动作。资金+70，训练度+10，全团实力+1。"; } },
      ],
    },
    prepEv19,
  ],

  /* ---------- 9月：年度招新（主线③） ---------- */
  9: [
    {
      /* 【主线③】招新拍板：候选池 = DATA.recruit2019（2019 全部 18 人：本部 7 + BEJ48 8 + GNZ48 3，
         史实全年仅有的新入团成员；本部 2019 零招新为史实锚点）。
         pickMode="recruit19" → UI.showRecruit19Picker → Game.applyRecruit19。 */
      id: "m9_19_recruit",
      title: "9月 · 年度招新",
      gate: st => !st.recruit19.done,
      pages: st => [
        { nar: true, t: "九月，招新季。子杰把今年的招生名额批得极其克制——全团十八个：1 月北京六期先来了一位；9 月中，本部十二期四人与广州七期同天公布——本部招新，重启了；10 月到 11 月末，北京七期分三批进了七位，本部十三期又来三位。「前几年招得太多、太快，」他在签批件上写，「今年，一个一个看。」" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把十八份资料摆成一排）史实口径我都核过了：这十八个孩子就是今年的全部——一位不多，一位不少。归属全由您拍板——本部预备生，还是分团预备生" + (st.flags.branchesClosed19 ? "（沈阳重庆已停运，只余北京广州）" : "") + "，或者暂不招录。队伍归属一律是预备生，是金子，明年编制会上见。" },
        { s: "马跃", cls: "", t: "（补了一句）进池的孩子自动进汇报公演的轮换——总监尽管挑，剩给我的，我一样当宝贝练。" },
      ],
      choices: [
        { label: "逐人拍板归属", hint: "本部预备生 / 各分团预备生 / 暂不招录——全部由总监定",
          pickMode: "recruit19" },
      ],
    },
    prepEv19,
  ],

  /* ---------- 10月：外务布局 + 大赏预算评审 ---------- */
  10: [
    {
      /* 【2019 通用】冯薪朵的请缨（需她未参加选秀或参加选秀未成团，且本部在籍）：
         头部成员支援分团、以老带新。
         tag fengXinDuo19：bej（兼任BEJ48，重心在分团）/ hq（留任本部）。 */
      id: "m10_19_feng_xinduo",
      title: "10月 · 冯薪朵的请缨",
      gate: st => {
        if (st.flags.fengXinDuo19) return false;
        const m = st.members.find(x => x.name === "冯薪朵");
        return !!m && m.status === "active" && m.team !== "PREP" && !m.hall;
      },
      pages: st => [
        { nar: true, t: "十月的一个傍晚，冯薪朵敲开了总监办公室的门。她在本部的沙发上坐下来，开门见山——这不像她，她向来是把话悶在心里的人。" },
        { s: "冯薪朵", cls: "speaker-fxd", t: "总监，团里的账，我看得到：" + (st.flags.branchesClosed19
          ? "沈阳和重庆停运之后，剩下的分团日子更紧了——人手被抽调、班底残缺，那边的孩子们连像样的公演都快排不开了。"
          : st.flags.branchesKept19
          ? "资方撤资的风波虽然压下去了，可分团那边的日子并没有好过多少——维稳专户顶得了一时，人手抽调、班底单薄，那边的孩子们连像样的公演都快凑不齐了。"
          : "分团那边的资方撤资风波还悬着，无论最后怎么收场，人手抽调、班底单薄都是明摆着的——那边的孩子们连像样的公演都快凑不齐了。") },
        { s: "冯薪朵", cls: "speaker-fxd", t: "我是头部成员，团里待得最久的那批人之一——这种时候，不能只站在本部的舞台上。我愿意去 BEJ48 兼任，把重心放在分团的事务上，以老带新，把那边的班底带起来。您考虑一下。" },
        { s: "叶盛", cls: "speaker-yesheng", t: (st.flags.branchesClosed19
          ? "（低声）分团刚经历停运安置，这时候让头部成员下沉，对北京那边的士气是实打实的强心针——但本部这边，也会少一根定海神针。"
          : "（低声）让头部成员下沉分团，对那边的士气是实打实的强心针——但本部这边，也会少一根定海神针。") + "总监，这个字不好签，但值得签。" },
      ],
      choices: [
        { label: "同意——兼任 BEJ48，重心放在分团事务", hint: "BEJ48 全员羁绊+3 人气+2，BEJ48 磨合度+6；热度+3 士气+3；她若在 HO2/BlueV，该小分队解散",
          tag: "fengXinDuo19", value: "bej",
          effect: st => {
            const m = st.members.find(x => x.name === "冯薪朵");
            if (m) m.note = (m.note ? m.note + "；" : "") + "2019-10 兼任 BEJ48（以老带新·重心在分团事务）";
            st.flags.fengXinDuo19 = true;
            const bej = st.members.filter(x => x.status === "branch" && x.branchTeam === "BEJ48" && x.pop != null);
            for (const x of bej) {
              x.bond = Math.min(100, x.bond + 3);
              x.pop = Math.min(100, x.pop + 2);
            }
            Game.syncTeams(st);
            if (st.chem["BEJ48"] == null) { st.chem["BEJ48"] = Game.calcChem(st, "BEJ48"); }
            st.chem["BEJ48"] = Math.min(100, st.chem["BEJ48"] + 6);
            st.heat = Math.min(100, st.heat + 3);
            st.morale = Math.min(100, st.morale + 3);
            /* 【判定】她若在 2018 小分队（HO2/BlueV），重心移分团后小分队解散 */
            const extra = Game.dissolveSubUnit19(st, Game.memberSubUnit(st, "冯薪朵"));
            return "你在申请函上批了字。第二周，冯薪朵的名单出现在了 BEJ48 的公演排期上——头牌空降，北京星梦剧院的门票当晚售罄。老带新的排练每天多出两个小时，分团的孩子们说：「她都肯来，我们有什么理由不拼。」\n\n（决策已登记：fengXinDuo19=bej。BEJ48 全员羁绊+3 人气+2，BEJ48 磨合度+6；热度+3 士气+3。）" + extra;
          } },
        { label: "婉拒——本部同样需要她，继续效力", hint: "冯薪朵羁绊+4 士气+2——定海神针不动",
          tag: "fengXinDuo19", value: "hq",
          effect: st => {
            const m = st.members.find(x => x.name === "冯薪朵");
            st.flags.fengXinDuo19 = true;
            if (m) m.bond = Math.min(100, m.bond + 4);
            st.morale = Math.min(100, st.morale + 2);
            return "你握了握她的手：「心意收下了，但人留在本部——分团的事，是运营的责任，不该让你一个人扛。」她点点头，眼里的光没灭。那之后，她把分团巡访提上了自己的日程——本部的舞台上，定海神针一动不动。（决策已登记：fengXinDuo19=hq。冯薪朵羁绊+4 士气+2。）";
          } },
      ],
    },
    {
      id: "m10_19_outreach",
      title: "10月 · 借风布局",
      gate: st => !st.outreach19.done,
      pages: st => [
        { nar: true, t: "选秀落幕后第四个月，「丝芭系」三个字在品牌圈还是硬通货。外务清单堆了一尺高：综艺、代言、晚会、盛典——每一张邀约函的背后，都是那年夏天孩子们攒下的镜头信用。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（把清单推过来）总监，借着这股东风，外务要成体系地铺——挑团综的、挑代言的、挑晚会的，打包谈。这一仗打完，这条河的商业盘子能上一个台阶。（行动「布局外务」随时可启动" + (st.flags.unit19Formed ? "——限定团的三个孩子在内测评级里又涨了一截，谈价更有底气" : "") + "）" },
      ],
    },
    {
      id: "m10_19_rt_warn",
      title: "10月 · 大赏预算评审会（预告）",
      pages: st => [
        { s: "子杰", cls: "speaker-wangzj", t: "（把营收曲线放在你面前）年末金曲大赏的预算会下个月开。今年是多事之年——组阁、招新、还有" + (st.flags.branchesKept19 ? "分团维稳" : "分团善后") + "，每一笔都是钱。但大赏是全年的压舱石，别让它缺席。" },
      ],
      choices: [
        { label: "立军令状：大赏照常，办成全年的收官之战", hint: "士气+4", tag: "rtWarn19", value: "pledge",
          effect: st => { st.morale = Math.min(100, st.morale + 4); return "你在评审记录上写下军令状。全团都知道了这件事——十二月，谁都想站在最前排。士气+4。"; } },
        { label: "数据说话，先看三季度报表", hint: "无加减", tag: "rtWarn19", value: "data",
          effect: st => { return "你把三季度的收支表推了过去：「数据说话。」子杰难得点头。一场没有硝烟的评审，散会了。"; } },
      ],
    },
    prepEv19,
  ],

  /* ---------- 11月：双选秀邀约 + 大赏投票 ---------- */
  11: [
    {
      /* 【2019 通用】双选秀邀约：鹅厂选秀第三季（女团季）与爱奇艺选秀第二季同年开战，
         各给 7 个正式名额。除成团成员（2018 限定团，status="rest"）外全团可点。
         ① 两家都参加：pickMode="show19both" → 两批链式七人点将窗；
         ② 只参加其中之一：pickMode="show19one" → UI.showShow19OnePicker（平台二选一 + 七人点将）；
         ③ 今年先不参加。生效逻辑在 engine.show19Squad / engine.show19Finalize。 */
      id: "m11_19_dualshow",
      title: "11月 · 双选秀邀约",
      gate: st => !st.decisions.show19Plan,
      pages: st => [
        { nar: true, t: "十一月，两份邀约几乎同时摆上了总监的办公桌——红色的和绿色的，两家平台一左一右，像两条对吹的风口。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "鹅厂的选秀第三季官宣了——这次是女团季。官方给了我们七个正式名额，话里话外的意思是：希望我们继续参加。去年那批孩子的成色，平台记着呢。" },
        { s: "王婧", cls: "speaker-wangjing", t: "（把第二份文件放在桌上）爱奇艺那边也递了函——他们的选秀第二季，同样邀请我们，同样七个名额。两家平台同年同季对打，我们两边都成了他们想要的「牌面」。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "两家都接，就是十四个名额、两班封闭集训连轴转——热度和产能都是顶的，但团里的人手会绷得很紧。只接一家，稳；一家不接，全力守剧场。总监，怎么接，您定。" },
      ],
      choices: [
        { label: "两家都参加——分两批点将，每批七人", hint: "除成团成员外全团可点；被选中者羁绊+6 人气+4；热度+12 士气+2 资金+40万（两班集训连轴，人手紧绷）",
          pickMode: "show19both" },
        { label: "只参加其中之一——点将七人", hint: "平台由总监定；被选中者羁绊+6 人气+4；热度+7 士气+2 资金+20万",
          pickMode: "show19one" },
        { label: "今年先不参加了——让孩子们守好剧场", hint: "热度-4 士气+2；本部在籍成员羁绊+2（公演排期回归常态）",
          tag: "show19Plan", value: "skip",
          effect: st => {
            st.heat = Math.max(0, st.heat - 4);
            st.morale = Math.min(100, st.morale + 2);
            const act = st.members.filter(x => x.status === "active" && x.pop != null);
            for (const x of act) x.bond = Math.min(100, x.bond + 2);
            Game.addLog(st, st.month, "婉拒双选秀邀约：全员回防剧场，公演排期回归常态（热度-4 士气+2 本部羁绊+2）。", "normal");
            return "你在两份邀约函上都写下了「今年先不参加」。回函发出去的第二天，公演排期表重新贴满了排练室——十九点开演的场次，一个都不缺席。有粉丝在剧场门口写道：「镜头是别人的，剧场是我们的。」\n\n（决策已登记：show19Plan=skip。热度-4 士气+2；本部在籍成员羁绊+2。）";
          } },
      ],
    },
    {
      id: "m11_19_rt_vote",
      title: "11月 · 金曲大赏投票开启",
      pages: st => [
        { s: "叶盛", cls: "speaker-yesheng", t: "年度金曲大赏投票通道开启——BEST 50。总选举证明人气，金曲大赏证明成色。多事之年的最后一战，别松手。" },
      ],
    },
    prepEv19,
  ],

  /* ---------- 12月：倒计时 ---------- */
  12: [
    {
      /* 【2019 通用】黄婷婷的解约请求（需她未参加选秀或参加选秀未成团，且本部在籍）：
         二期生觉得未被公司公平对待，请求解约。
         tag htt19：agree（同意解约）/ freeze（拒绝：私自离团·合约冻结，史实）/
         promise（交流待遇问题，承诺留至合约期满）。 */
      id: "m12_19_htt",
      title: "12月 · 黄婷婷的解约请求",
      gate: st => {
        if (st.decisions.htt19) return false;
        const m = st.members.find(x => x.name === "黄婷婷");
        return !!m && m.status === "active" && m.team !== "PREP" && !m.hall;
      },
      pages: st => [
        { nar: true, t: "十二月的一个深夜，黄婷婷的经纪人替她递来了一份解约申请。第二天下午，她自己来了——没有化妆，穿着最普通的卫衣，坐在你对面，平静得像在报一道早已算完的题。" },
        { s: "黄婷婷", cls: "speaker-htt", t: "总监，从我进团那天算起，六年了。2013年跟着二期生一起站上舞台，一期一期地看人来了又走——我见过这条河最好的时候，也见过它最难的时候。可是这两年，我越来越确定一件事：这家公司，从来没有公平地对待过我。" },
        { s: "黄婷婷", cls: "speaker-htt", t: "资源、排班、外务——我不想去争哪个名字被多照顾了一点，我只是想说，我心里那杆秤，早就歪了。我想走。这份解约申请，您看了就知道，我的条件不高——剩下的合约，本来也不长了。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（低声）头部成员年底解约，粉丝那边不会平静；但强留下一个心已经不在的人，对队伍也不是好事。总监——这三条路，每一条都有代价，您定。" },
      ],
      choices: [
        { label: "同意解约", hint: "资金+15万（少量违约金，剩余合约期限不长）；士气-2 热度-2；她若在 HO2/BlueV，该小分队解散",
          tag: "htt19", value: "agree",
          effect: st => {
            const m = st.members.find(x => x.name === "黄婷婷");
            /* 【判定】先取小分队归属再改备注（备注会被解约信息覆盖）；她在 HO2/BlueV 则离团后小分队解散 */
            const subH = Game.memberSubUnit(st, "黄婷婷");
            if (m) { m.status = "left"; m.note = "2019-12 协商解约离团（支付少量违约金）"; }
            st.money += 15;
            st.morale = Math.max(0, st.morale - 2);
            st.heat = Math.max(0, st.heat - 2);
            const extra = Game.dissolveSubUnit19(st, subH);
            return "你在解约协议上签了字。违约金不多——剩下的合约期限本来就不长，她把该还的都算得清清楚楚。离团那天她发了条长长的告别微博，评论区吵翻了天，但效率却出奇地体面。（决策已登记：htt19=agree。资金+15万 士气-2 热度-2。）" + extra;
          } },
        { label: "拒绝请求（史实路线）", hint: "黄婷婷移入暂休（备注私自离团·合约冻结）；士气-3 热度-2",
          tag: "htt19", value: "freeze",
          effect: st => {
            const m = st.members.find(x => x.name === "黄婷婷");
            if (m) { m.status = "rest"; m.note = "2019-12 私自离团，合约冻结（解约请求被驳回）"; }
            st.morale = Math.max(0, st.morale - 3);
            st.heat = Math.max(0, st.heat - 2);
            return "你在解约申请上盖了「不予同意」的章。第二天起，她的名字从所有排班表上消失——没有官宣，没有解释，合约冻结，人就这么「待」了下来。公司安静了，可粉丝没有：超话里全是问号，队伍里的人看你的眼神也多了几分考究。（决策已登记：htt19=freeze。黄婷婷暂休·合约冻结 士气-3 热度-2。）";
          } },
        { label: "与她交流待遇问题，给出承诺", hint: "黄婷婷留任至2021年8月合约到期；羁绊+5 士气+3——留下tag「给黄婷婷的承诺」",
          tag: "htt19", value: "promise",
          effect: st => {
            const m = st.members.find(x => x.name === "黄婷婷");
            st.flags.httPromise19 = true;
            if (m) {
              m.bond = Math.min(100, m.bond + 5);
              m.note = (m.note ? m.note + "；" : "") + "2019-12 待遇沟通（承诺在籍至2021-08合约到期）";
            }
            st.morale = Math.min(100, st.morale + 3);
            return "你把解约申请推到一边，跟她算了一笔很细的账：过去几年她拿到过什么、被亏欠过什么——一样一样地摆到桌面上。最后你说：「合约还剩多久，我就负责到最后一天。但在这个期限内，待遇的问题，公司认账。」\n\n她沉默了很久，把申请收了回去：「行。我看着。到2021年8月之前——这笔账，我们一个月一个月地对。」\n\n（决策已登记：htt19=promise——给黄婷婷的承诺。她在籍至合约期满；羁绊+5 士气+3。）";
          } },
      ],
    },
    {
      /* 【2019 通用】12月：新冠疫情爆发（单选项纯叙事，tag covid19 登记后留待 2020 年线回收）。 */
      id: "m12_19_yearend",
      title: "12月 · 倒计时",
      pages: st => [
        { nar: true, t: "12月的上海，第一场雪落下来。剧场门口的灯墙映着一小片暖光——有粉丝在灯下拍照，拍完对着镜头哈了口气。" + (st.flags.teb19Open ? "上海、台北，两边的灯都亮着。" : st.flags.branchesKept19 ? "今年的灯，一盏都没少。" : "送走了沈阳和重庆……明年会更好吧。") },
        { s: "叶盛", cls: "speaker-yesheng", t: "（拿着手机进来，脸色不算好看）总监，看新闻了吗——武汉那边出现了不明原因的肺炎，听说会人传人，传播速度很快。好在今年的收官演出提前做完了，金曲大赏也落了幕——今年这条河，算是赶在风浪前面靠了岸。" },
        { s: "叶盛", cls: "speaker-yesheng", t: "（放下手机，声音低了几分）可今年躲得过，明年呢？剧场、公演、巡演、总选……全都是人挤人的生意。要是疫情真的压到明年——年报，我不敢想。我先让人盯着消息，明年的预算，您心里也先有个数吧。" },
      ],
      choices: [
        { label: "把疫情风险列入明年头号预案", hint: "（纯叙事 · 决策登记：covid19=warned，留待明年回收）",
          tag: "covid19", value: "warned",
          effect: st => {
            return "你在台历的新一页上写下了第一行字：「疫情监测——头号风险」。窗外雪还在下，剧场门口的灯墙亮得一如既往。只是你比任何人都清楚：这一页翻过去之后的那一年，不会像往年一样好写。";
          } },
      ],
    },
    prepEv19,
  ],
};

/* ========================================================================
   四、2019 追加随机事件（引擎与 randomPool 合并取用）
   ======================================================================== */
STORY.randomPool19 = [
  {
    id: "r19_idft_grind",
    title: "IDFT 的深夜排练室",
    text: st => st.flags.reorg19Done ? "深夜路过 IDFT 训练区，黑色的徽章在镜墙前排成一排——没有队徽的孩子，练得比谁都狠。" : null,
    gate: st => !!st.flags.reorg19Done && st.members.some(m => m.status === "idft"),
    choices: [
      { label: "给训练区加拨一笔营养与课时预算", effect: st => { st.money = Math.max(0, st.money - 10); st.morale = Math.min(100, st.morale + 3); return "预算单当天批了下来。带训教练发来一句：「孩子们说，没有队徽，也要有名字。」士气+3，资金-10。"; } },
      { label: "让教练严格把关，别练伤了", effect: st => { st.morale = Math.min(100, st.morale + 1); return "你给教练打了个电话：「进度可以慢，人不能伤。」训练区的灯十一点准时熄了。士气+1。"; } },
    ],
  },
  {
    id: "r19_unit_hot",
    title: "限定团热搜",
    text: st => st.flags.unit19Formed ? "限定团的首个团体舞台直拍冲上热搜——评论区一半在夸，一半在问「她们什么时候回总选」。" : null,
    gate: st => !!st.flags.unit19Formed,
    choices: [
      { label: "官微亲自下场玩梗：「回家名单已排到明年」", effect: st => { st.heat = Math.min(100, st.heat + 5); st.money += 15; return "官微的回复转发破了十万——限定的悬念被玩成了连续剧。热度+5，资金+15（品牌追投）。"; } },
      { label: "不回应，让舞台自己说话", effect: st => { st.morale = Math.min(100, st.morale + 2); return "你只回了一句：「舞台见。」三个孩子在下一个团体舞台上的直拍，播放量又翻了一倍。士气+2。"; } },
    ],
  },
  {
    id: "r19_reorg_rumor",
    title: "二组名单风波",
    text: st => st.flags.reorg19Done ? null : "一份疑似「二次组阁名单」的截图在小群里流传——名单里赫然出现几个没人料到的名字。",
    gate: st => !st.flags.reorg19Done,
    choices: [
      { label: "官方辟谣：名单未定，一切以编制会为准", effect: st => { st.morale = Math.min(100, st.morale + 3); return "官微当天发布说明。更衣室安静了，练功房的门重新关上。士气+3。"; } },
      { label: "冷处理，让流言自灭", effect: st => { st.morale = Math.max(0, st.morale - 2); return "你选择不回应。流言三天就淡了，只是有几个孩子的训练量悄悄变了。士气-2。"; } },
    ],
  },
];

/* ========================================================================
   五、总选举次日 / 金曲大赏叙事
   ======================================================================== */
STORY.geAftermath19 = st => {
  const reign = st.geResult && st.geResult.top1 === st.history.ge2018Top1;
  return [
    { s: "叶盛", cls: "speaker-yesheng", t: reign
      ? "（第二天一早冲进办公室）蝉联了！第六届总选，去年的名字还钉在第一——荣誉殿堂的第" + (["零","一","二","三","四","五","六"][st.members.filter(m => m.hall).length + 1] || (st.members.filter(m => m.hall).length + 1)) + "次升堂仪式，董事会已经批了！"
      : "（第二天一早冲进办公室）新王登基！第六届总选，第一名换人了——市场用选票投了票。荣誉殿堂那边，「非连霸不升堂」，制度照旧。" },
    { s: "马跃", cls: "", t: "（短信）总监，今年总选少了三个名字，可直播间的弹幕比去年密——「那个团的孩子呢？」问的人越多，惦记的人越多。明年，她们回来就是最大的牌。" },
    { nar: true, t: (reign
      ? "（连霸达成——升堂事件将在结算中触发。）"
      : "（总选举落幕。打投收入已入账，全团热度大涨。距离年末，还有一场收官硬仗。）") },
  ];
};

STORY.rtNarrative19 = {
  great: [
    { nar: true, t: "当年度第一位的旋律响起，全场打开手机灯海。叶盛在侧台轻声说：「多事之年……收在了一个最亮的尾上。」" },
  ],
  normal: [
    { nar: true, t: "舞台灯光落下的瞬间，你在观演席轻轻呼出一口气——组阁、招新、总选、大赏：2019年，就这样唱到了最后。" },
  ],
};

/* ========================================================================
   六、结局文本（评级由 engine.computeGrade19 计算）
   ======================================================================== */
STORY.endings19 = {
  S: {
    rank: "S", title: "双岸灯火",
    /* 【动态数据】礼物按实况分叉：TEB48 开业→台北票根；保住分团→沈阳重庆相册；放弃分团不出现「没有熄灭的灯」类文案 */
    text: st => {
      const gifts = [];
      if (st.flags.teb19Open) gifts.push("一份从台北寄来：星梦剧院首演的票根，背面印着「谢谢运营」");
      if (st.flags.branchesKept19) gifts.push("一份从沈阳和重庆的粉丝站寄来：两本厚厚的相册，每一页都是这一年没有熄灭的灯");
      const head = gifts.length
        ? "跨年夜，你收到了" + (gifts.length > 1 ? "两份礼物——" : "一份礼物——") + gifts.join("；") + "。"
        : "跨年夜，办公室里只亮着你这一盏灯。你把这一年的档案一页页归拢。";
      return head + "\n\n子杰的邮件只有一行：「账算清了，人心也算了清——明年，继续。」\n\n" + (gifts.length ? "你把礼物并排摆进柜子。" : "") + "编制表、招新名单、限定团的合同、总选的票数曲线——2019年的每一页，都在回答同一个问题：\n\n「灯亮的彼岸，是用人心点着的。」";
    },
  },
  A: {
    rank: "A", title: "各安其位",
    /* 【动态数据】IDFT 段落按训练生池实际人数分叉（保住分团且无人移籍时换成排练室收尾） */
    text: st => "年末总结会上，子杰没有多说什么——只是在散会时把那份「二次组阁半年报」留在了你桌上。\n\n「名册很干净。人也都各就各位——这就是本事。」\n\n散会后叶盛陪你锁门。" + (st.members.some(m => m.status === "idft")
      ? "走廊尽头，IDFT 训练区的灯还亮着——黑色徽章的孩子们，在为明年的汇报公演排队。"
      : "走廊尽头，排练室的灯还亮着——换上新队徽的孩子们，在为明年的公演排队。") + "\n\n你想起一年前那份空白的编制表。现在，每一个空行里，都站着一个有名有姓的人。",
  },
  B: {
    rank: "B", title: "过渡之年",
    text: "这一年，账算得很细，路走得很慢。\n\n组阁的名单公布了，新归属还在磨合；招新的十八个名额个个都验过货；限定团的舞台在外头热热闹闹，总选的名单里空着三行。\n\n子杰在年终评语里写：「慢，不是停。是给根须留时间。」\n\n你把这句话钉在办公桌对面。2020年，让慢下来的河，攒出下一场奔流。",
  },
  C: {
    rank: "C", title: "长夜未尽",
    text: "年末，董事会的会议室里，那份「年度经营报告」被翻到了最后一页——数字不算难看，但也绝算不上好看。\n\n「归位不是避风港，」子杰说，「它只是让每个人先站回自己的位置。站定之后，还是要往前走。」\n\n没有人当场宣布什么。散会时，叶盛把你的旧工牌擦干净递还给你：「留着我这，随时回来。」\n\n你走出大楼。这条河还在流——只是归位之后的第一个冬天，格外冷一些。",
  },
  bankrupt: {
    rank: "D", title: "资金链断裂",
    /* 【动态数据】IDFT 段落按训练生池实际人数分叉 */
    text: st => "连续的赤字击穿了董事会的底线。\n\n子杰在紧急会议上行使大股东表决权：年度计划终止，二次组阁方案移交下任执行。王婧投了反对票——她的一票，没能改变结果。\n\n" + (st.members.some(m => m.status === "idft")
      ? "移交清单交完那天，IDFT 训练区的孩子发来消息：「总监，明年汇报公演，还为我们留着名额吗？」\n\n你盯着那行字看了很久，回复了两个字：「留着。」然后关掉了手机。\n\n"
      : "移交清单交完那天，排练室的孩子发来消息：「总监，明年的公演，还为我们留着舞台吗？」\n\n你盯着那行字看了很久，回复了两个字：「留着。」然后关掉了手机。\n\n") + "这条河不会记得每一个摆渡人。但你记得，那面贴满空行的编制表，和它终于被填满的样子。",
  },
};

/* ============================================================================
   engine.js — 游戏引擎（状态 / 行动 / 月度结算 / 主线判定 / 存档）
   ----------------------------------------------------------------------------
   《塞纳河打工人生》核心循环：
     月初 monthStart()  →  行动×3（doAction / pickCity）  →  月末 endMonth()
       →  UI 依次播放 endMonth 返回的 steps（结算表 / 事件 / 大事件结果）
       →  advanceMonth() 进入下一个月
   引擎不直接操作 DOM；它只改状态并产出「步骤(steps)」描述，由 ui.js 播放。
   ----------------------------------------------------------------------------
   数值口径（0-100 的资源）：
     money  资金（万）        heat   热度（口碑/话题）
     morale 全团士气          train  训练度（影响公演收入与大赏评分）
     burden 叶盛的负担（过高触发负面事件，走访/值班可降低）
   主线三条：
     ① 分团筹备 branch.stage 1→5（会谈→选址→剧场→招商→招募），4月20日判定官宣
     ② 年度活动：7月总选举（gePlan 影响战绩）/ 12月金曲大赏（rtPlan 影响评分）
     ③ 成员沟通：bond 羁绊体系，同时决定叶盛负担的消长
============================================================================ */

"use strict";

const Game = {

  SAVE_KEY: "snh48_h5_save_v1",
  BACKUP_KEY: "snh48_h5_save_bak",   // 双 key 互备（主档被单独清理时兜底）
  SAVE_VERSION: 1,

  /* ============================ 新开局 ============================ */

  newGame(playerName, styleId, era) {
    era = era || "2016";
    const is26 = era === "2026";
    /* 2026 线初始盘面：营业额大不如前 → 资金薄、士气低、负担重 */
    const st = {
      saveVersion: this.SAVE_VERSION,
      playerName: playerName || "总监",
      era: era,
      month: 1,
      ap: 3,
      money: is26 ? 380 : 600,
      heat: is26 ? 30 : 35,
      morale: is26 ? 62 : 72,
      train: is26 ? 32 : 30,
      burden: is26 ? 65 : 55,
      debt: 0,                       // 连续/累计赤字次数（≥2 触发破产结局）
      branch: { stage: 0, city: null, announce: false, announceMonth: 0 },   // 2016：分团筹备
      cgt: { stage: 0, open: false, openMonth: 0, closed: false, settled: 0, settleDone: false },  // 2026：CGT48 重建（或解散安置，见序章 cgtPath）
      elim: { executed: 0, defied: 0, transferred: 0, warned: false },       // 2026：末位淘汰（executed 执行 / defied 缓刑 / transferred 调往CGT）
      rtCancelled: false,                                                    // 2026：营业不佳 → 金曲大赏取消
      gePlan: 0, geStrategy: null, geDone: false, geResult: null,
      rtPlan: 0, rtDone: false, rtScore: 0,
      members: [],                   // 运行时成员卡（见 buildRoster）
      log: [],                       // {month, text, tone}
      flags: {},                     // 剧情旗标（免费宣传等）
      decisions: {},                 // 【决策标签】剧情选项的登记表（tag→value），供后续剧情与 2026 线回收
    };
    this.st = st;

    // 初始化成员卡（深拷贝 DATA / DATA2026，绑定羁绊 bond）
    this.buildRoster(st);
    const baseBond = is26 ? 15 : 20;   // 2026 新总监初来乍到，羁绊更低
    for (const id in st.members) st.members[id].bond = baseBond;

    // 序章风格加成（styleId 也可为空，序章播完后由 applyStyle 补加）
    if (styleId) this.applyStyle(styleId);

    this.addLog(st, 1, is26
      ? "你正式出任 SNH48 制作总监。陶总的首份文件已经送达——四条主线，无一轻松。"
      : "你正式出任 SNH48 制作总监，三条主线任务摆在桌上。", "main");
    return st;
  },

  /* 序章选择的管理风格 → 初始加成（在序章播放中途调用；按 era 取对应序章配置） */
  applyStyle(styleId) {
    const st = this.st;
    const pro = st.era === "2027" ? STORY.prologue27
      : st.era === "2026" ? STORY.prologue26
      : st.era === "2018" ? STORY.prologue18
      : st.era === "2017" ? STORY.prologue17
      : STORY.prologue;
    const style = pro.styles.find(s => s.id === styleId);
    if (style) { style.apply(st); st.startStyle = styleId; }
  },

  /* ============================ 成员实力（pwr）============================
     【2017「本部新章」线新增】成员卡新增实力计数：
     · 初始实力在 2016→2017 交接时生成（carryTo2017）：期数基础 + 人气×0.3，
       封顶 45——即便是头部成员，放到内娱对比也决不能给高（内娱一线≈80+）；
     · 实力是影响总选成绩的第二大因素（人气第一）；
     · 全团特训使全体成员实力+1（多次训练累积提升）；
     · 新增月间行动「安排成员特训」：耗资 20 万，目标成员实力+6、羁绊+4。 */
  gainAllPwr(st, amount) {
    for (const m of st.members) {
      if (m.status === "active" && m.pwr != null) m.pwr = Math.min(90, m.pwr + amount);
    }
  },

  avgPwr(st) {
    const pool = this.activeMembers(st).filter(m => m.pwr != null);
    if (!pool.length) return 0;
    return Math.round(pool.reduce((s, m) => s + m.pwr, 0) / pool.length);
  },

  origCount(st) {
    if (!st.orig) return 0;
    return ["SII", "NII", "HII", "X"].filter(t => st.orig[t]).length;
  },

  /* ========================================================================
     2016 → 2017「本部新章」线交接（结算界面「进入下一年」入口）
     --------------------------------------------------------------------------
     在游戏状态 2016 年末成员卡的基础上变动（继承 st.members，含分团/暂休/离队
     状态与人气羁绊），并做四件事：
     ① 登记当前成员卡情况快照到 st.history.roster2016（作者可回收/对照）；
     ② 按史实装载 2017 人员变动表（DATA.joining2017 / leaving2017）；
     ③ 为全部成员生成初始实力（pwr）并记录年初均值 pwrBase；
     ④ 若 2016 选择过开拓者移籍（branchPost=SHY48/CKG48），先遣队成员转入对应分团。
     ========================================================================== */
  carryTo2017() {
    const src = this.st;
    const members = src.members;
    /* ① 登记成员卡快照（游戏状态 2016 年末实况） */
    const snapshot = members.map(m => ({
      name: m.name, team: m.team, status: m.status, branchTeam: m.branchTeam || null,
      pop: m.pop != null ? m.pop : null, bond: m.bond != null ? m.bond : null, hall: !!m.hall,
    }));
    /* ④ 开拓者先遣队：2016「下一站」选 SHY48/CKG48 时点将的六人。
       【v0.9.1】先遣队不再于交接时立即移籍——SHY48/CKG48 成立（首演亮灯）后才进驻
       （endMonth 开业判定处调用 deployPioneers）；交接时仅登记 flags.pioneerPending。 */
    const post = src.decisions && src.decisions.branchPost;
    let pioneerPending = null;
    if ((post === "SHY48" || post === "CKG48") && Array.isArray(src.decisions.pioneerList)) {
      pioneerPending = post;
    }
    /* ④' 2017.1 分团在册名册补充（DATA.branchRoster2017，考据快照 careers3.json）：
       补建缺失的分团成员卡（Team B/E、G/NIII 及六期生分团方向 47 人）；
       已在籍的移籍成员卡（含人气/羁绊）保留不动。GNZ48 Team Z 考据缺失不建卡。 */
    for (const bt of ["BEJ48", "GNZ48"]) {
      for (const r of (DATA.branchRoster2017[bt] || [])) {
        const ex = members.find(x => x.name === r.name);
        if (ex) {
          /* 已在籍的移籍成员卡：同步 2016-09/10 的队长/副队任命与队伍标注，人气羄绊保留 */
          if (ex.status === "branch") {
            if (r.captain) ex.captain = true;
            if (r.vice) ex.vice = true;
            if (!ex.branchLabel) ex.branchLabel = r.branchLabel || "";
          }
          continue;
        }
        members.push({
          id: "br17_" + r.name, name: r.name, team: bt, gen: r.gen || "",
          pop: 0, bond: 0, status: "branch", branchTeam: bt, branchLabel: r.branchLabel || "",
          captain: !!r.captain, vice: !!r.vice,
        });
      }
    }
    /* ③ 初始实力：期数基础 + 人气×0.3，封顶 45（内娱对比口径） */
    const genBase = { "一期生": 14, "二期生": 12, "三期生": 10, "四期生": 8, "五期生": 6, "六期生": 4, "七期生": 3, "留学生": 12 };
    for (const m of members) {
      if (m.pop == null) continue;
      const base = genBase[m.gen] != null ? genBase[m.gen] : 6;
      m.pwr = this.clamp(Math.round(base + m.pop * 0.3), 5, 45);
    }
    const pwrBase = this.avgPwr(src);

    const st = {
      saveVersion: this.SAVE_VERSION,
      playerName: src.playerName,
      era: "2017",
      month: 1,
      ap: 3,
      money: src.money,
      heat: src.heat,
      morale: src.morale,
      train: src.train,
      burden: src.burden,
      debt: 0,
      /* ② 继承 2016 年末成员卡实况（含 branch/rest/left/HALL 状态） */
      members: members,
      log: [],
      flags: Object.assign({}, src.flags),
      decisions: Object.assign({}, src.decisions),
      camp26: Object.assign({}, src.camp26 || { tao: 0, wang: 0 }),
      /* 2016 主线对象保留：branch.announce 决定 BEJ48/GNZ48 是否继续参选总选 */
      branch: src.branch,
      /* 2017 新主线状态 */
      branch17: { shy: 0, ckg: 0, shyOpen: false, ckgOpen: false, shyOpenMonth: 0, ckgOpenMonth: 0 },
      orig: { SII: false, NII: false, HII: false, X: false },
      pwrBase: pwrBase,
      gePlan: 0, geStrategy: null, geDone: false, geResult: null,
      rtPlan: 0, rtDone: false, rtScore: 0,
      history: {
        roster2016: snapshot,
        ge2016Top1: src.geResult ? src.geResult.top1 : null,
      },
    };
    delete st.flags.monthStarted;
    delete st.flags.freePromo;
    if (pioneerPending) st.flags.pioneerPending = pioneerPending;
    /* 【分团事件门控·兼任 tag】tag = 2016「下一站」选择的分团：
       选本部（none/旧档无值）则无 tag，选分团则设置对应 tag（st.flags.concur17[分团]=true）。
       后续分团相关事件一律以 gate: !!(st.flags.concur17 && st.flags.concur17["XX48"]) 控制可见性。 */
    st.flags.concur17 = {};
    if (post === "BEJ48" || post === "GNZ48" || post === "SHY48" || post === "CKG48") st.flags.concur17[post] = true;
    this.st = st;
    this.addLog(st, 1, "2016 年的答卷交卷，2017「本部新章」开卷：成员卡已按年末实况登记，全团初始实力均值 " + pwrBase + "。", "main");
    this.save();
    return st;
  },

  /* 【2017 分团线】分团首演亮灯后调用（endMonth 开业判定处）：
     ① 建立分团成立名单（招募一期生，考据：tmp/research/branch_gen_timeline.txt）→ 分团成员卡（一次性）；
     ② 若该分团为先遣队目的地（flags.pioneerPending 匹配），六人进驻。 */
  deployBranch(st, post) {
    if (!st.flags["founded_" + post]) {
      st.flags["founded_" + post] = true;
      let n = 0;
      for (const r of ((DATA.branchFoundingRoster && DATA.branchFoundingRoster[post]) || [])) {
        if (st.members.some(x => x.name === r.name)) continue;
        st.members.push({
          id: "bf17_" + r.name, name: r.name, team: post, gen: r.gen || "",
          pop: 0, bond: 0, status: "branch", branchTeam: post, branchLabel: r.branchLabel || "",
        });
        n++;
      }
      if (n) this.addLog(st, st.month, post + " 招募一期生 " + n + " 人建卡入册（预备生）。", "main");
    }
    if (st.flags.pioneerPending === post) {
      const list = (st.decisions && st.decisions.pioneerList) || [];
      let n = 0;
      for (const name of list) {
        const m = st.members.find(x => x.name === name);
        if (m && m.status === "active") { m.status = "branch"; m.branchTeam = post; m.note = "开拓者·先遣队"; n++; }
      }
      if (n) this.addLog(st, st.month, "开拓者先遣队 " + n + " 人随总监进驻 " + post + "。", "main");
      st.flags.pioneerPending = false;
    }
  },

  /* 【2017 分团线】主线④「分担叶盛」→「专注分团事务」的生效判定：
     BEJ48/GNZ48 路线自年初生效；SHY48/CKG48 路线待对应分团成立后生效。无路线返回 null。 */
  branchDutyPost(st) {
    const post = st.decisions && st.decisions.branchPost;
    if (!post || post === "none") return null;
    if (post === "BEJ48" || post === "GNZ48") return post;
    if (post === "SHY48") return st.branch17 && st.branch17.shyOpen ? post : null;
    if (post === "CKG48") return st.branch17 && st.branch17.ckgOpen ? post : null;
    return null;
  },

  /* ========================================================================
     2026 → 2027「大河新篇」线交接（2026 结算界面「进入下一年」入口，v0.10）
     --------------------------------------------------------------------------
     在 2026 年末成员卡与经营状态的基础上变动，并做五件事：
     ① 登记成员卡快照到 st.history.roster2026（含 HALL/影视部与阵营结算）；
     ② 为全部成员生成初始实力（pwr，口径同 carryTo2017：期数基础 + 人气×0.3，封顶 45）
        并记录年初均值 pwrBase；
     ③ 装载 2027 人员变动表（DATA2026.joining2027 / leaving2027，预挂载结构，暂为空）；
     ④ 按阵营结算（camp26Final）与序章发言确立主线一：王婧派/平衡派 → flags.wh27Main
        （WHN48 年内落地）；陶莺派 → 无主线一（在序章 speech27 选项中处理，此处仅登记）；
     ⑤ 继承 CGT48 状态（重建成功则成都每月继续为总账创收）与影视部谈话对象
        （flags.filmLead：鞠婧祎重新签约 → 其个人；否则孙珍妮/陆婷玉）。
     ========================================================================== */
  carryTo2027() {
    const src = this.st;
    const members = src.members;
    /* ① 成员卡快照（2026 年末实况，含 pwr 前状态/HALL/阵营） */
    const snapshot = members.map(m => ({
      name: m.name, team: m.team, status: m.status, branchTeam: m.branchTeam || null,
      pop: m.pop != null ? m.pop : null, bond: m.bond != null ? m.bond : null, hall: !!m.hall,
    }));
    /* ② 初始实力：期数基础 + 人气×0.3，封顶 45（内娱对比口径，同 2017）。
       期数基础随年代顺延（老期生资历深基础高）；分团期数/移籍出身给中间值。 */
    const genBase = {
      "一期生": 14, "二期生": 12, "三期生": 10, "四期生": 8, "五期生": 6, "六期生": 5,
      "七期生": 4, "八期生": 3, "九期生": 3, "十期生": 3, "十一期生": 3, "十二期生": 2,
      "十三期生": 2, "十四期生": 2, "十五期生": 2, "十六期生": 2, "十七期生": 1, "十八期生": 1,
      "十九期生": 1, "二十一期生": 1, "二十二期生": 1, "二十三期生": 1, "二十四期生": 1,
      "留学生": 12, "AKB48派遣": 10,
      "SHY48一期": 4, "SHY48三期": 4, "BEJ48七期": 3, "CKG48一期": 3,
      "CGT48移籍": 3, "CGT48移籍·升格": 3,
    };
    for (const m of members) {
      if (m.pop == null) continue;
      const g = m.gen || "";
      const base = genBase[g] != null ? genBase[g]
        : genBase[g.split(" ")[0]] != null ? genBase[g.split(" ")[0]] : 3;   // 「六期生 · 影视部」等复合 gen 取首段
      m.pwr = this.clamp(Math.round(base + m.pop * 0.3), 5, 45);
    }
    const pwrBase = this.avgPwr(src);

    /* ⑤ 影视部谈话对象：鞠婧祎重新签约（2026 庭审胜诉选影视部）→ 其个人；否则孙珍妮/陆婷玉 */
    const filmLead = members.some(m => m.name === "鞠婧祎" && m.hall) ? "鞠婧祎" : "孙珍妮、陆婷玉";

    const st = {
      saveVersion: this.SAVE_VERSION,
      playerName: src.playerName,
      era: "2027",
      month: 1,
      ap: 3,
      money: src.money,
      heat: src.heat,
      morale: src.morale,
      train: src.train,
      burden: src.burden,
      debt: 0,
      /* 继承 2026 年末成员卡实况（含 branch/rest/left/HALL 状态与人气/羁绊） */
      members: members,
      log: [],
      flags: Object.assign({}, src.flags),
      decisions: Object.assign({}, src.decisions),
      camp26: Object.assign({}, src.camp26 || { tao: 0, wang: 0 }),
      /* 2026 主线对象保留：CGT48 重建成功 → 成都每月继续为总账创收 */
      cgt: src.cgt,
      elim: src.elim,
      /* 2027 新主线状态 */
      branch27: { stage: 0, open: false, openMonth: 0 },        // 主线一：WHN48（仅王婧派/平衡派）
      film: { stage: 0, done: false, doneMonth: 0 },            // 主线二：影视部焕新
      pwrBase: pwrBase,
      gePlan: 0, geStrategy: null, geDone: false, geResult: null,
      rtPlan: 0, rtDone: false, rtScore: 0, rtCancelled: false,
      history: {
        roster2026: snapshot,
        ge2026Top1: src.geResult ? src.geResult.top1 : null,
        rtCancelled2026: !!src.rtCancelled,
      },
    };
    st.flags.filmLead = filmLead;
    delete st.flags.monthStarted;
    delete st.flags.freePromo;
    /* 2026 一次性旗标不带入 2027 的判定流（保留在 history/decisions 中可回收） */
    delete st.flags.p23Promoted;
    delete st.flags.cgtPromoted;
    this.st = st;
    this.addLog(st, 1, "2026 年的答卷交卷，2027「大河新篇」开卷：成员卡已按年末实况登记，全团初始实力均值 " + pwrBase + "。", "main");
    this.save();
    return st;
  },

  /* ========================================================================
     快速通道开局（主界面·中途年份直入，v0.11.1）
     --------------------------------------------------------------------------
     用途：作者实测与已通关前几年剧情的玩家，直接从 2017/2018/2027 开局。
     原理：伪造「前一年年末」的游戏状态（史实默认 + 玩家在开局前补选的关键决策），
           然后走真实的跨线交接函数（carryTo2017 / carryTo2018 / carryTo2027），
           保证与正常通关进入的年份状态同构。
     局限：跳过前几年剧情与经营细节，前一年经营盘面取合理中位值（资金/热度/士气），
           总选结果按史实锚定（2016/2017 鞠婧祎、2026 杨冰怡）。
     ========================================================================== */
  newGameFast(playerName, era, choices) {
    choices = choices || {};
    if (era === "2017") {
      this.fastState2016(playerName, choices);
      this.carryTo2017();
      return this.st;
    }
    if (era === "2018") {
      this.fastState2016(playerName, choices);
      this.carryTo2017();
      this.fastSim2017(choices);
      this.carryTo2018();
      /* 快速通道补选：Team XII 去留（史实=解散，未选时按默认）。登记后 1 月张怡事件
         自动跳过（gate 判决策已定），效果与张怡事件一致（keep=士气+4 / dissolve=资金+20）。 */
      const stF = this.st;
      const xk18 = choices.xiiKeep18 === "keep" ? "keep" : "dissolve";
      stF.decisions.xiiKeep18 = xk18;
      stF.flags.xiiKept18 = xk18 === "keep";
      if (xk18 === "keep") stF.morale = this.clamp(stF.morale + 4, 0, 100);
      else stF.money += 20;
      return this.st;
    }
    if (era === "2027") {
      this.fastState2026(playerName, choices);
      this.carryTo2027();
      return this.st;
    }
    return this.newGame(playerName, null, era);
  },

  /* 【快速通道·2016 年末】伪造 2016 年末实况：base 名单 + 决策补选 + 全年人员变动快进 */
  fastState2016(playerName, choices) {
    const st = this.newGame(playerName, null, "2016");
    const d = st.decisions;
    /* —— 决策补选①：下一站（branchPost）—— 先登记，开拓者六人在人员快进后点定 */
    const post = choices.branchPost || "none";
    d.branchPost = post;
    /* —— 决策补选②：赵嘉敏学业（zhaoMin）—— */
    const zjmChoice = choices.zhaoMin || "rest";
    d.zhaoMin = zjmChoice;
    const zjm = st.members.find(x => x.name === "赵嘉敏");
    if (zjmChoice === "terminate") {
      if (zjm) { zjm.status = "left"; zjm.note = "解除合约"; }
      st.money += 150;
    } else if (zjmChoice === "study") {
      if (zjm) { zjm.status = "rest"; zjm.note = "学业规划 · 延期毕业"; }
    } else if (zjm) {
      zjm.status = "rest"; zjm.note = "学业暂休（2016-07-30 发表）";
    }
    /* —— 决策补选③：对日合作模式（jpMode，影响 2017 复刻线与铃木玛莉亚）—— */
    if (choices.jpMode) d.jpMode = choices.jpMode;

    /* —— 2016 全年史实人员变动快进 + 4·20 分团成立 —— */
    this.fastSimJoinLeave(st, "2016");
    for (const name of DATA.branchMovers.BEJ.concat(DATA.branchMovers.GNZ)) {
      const m = st.members.find(x => x.name === name);
      if (m && m.status === "active") {
        m.status = "branch";
        m.branchTeam = DATA.branchMovers.BEJ.indexOf(name) >= 0 ? "BEJ48" : "GNZ48";
      }
    }
    st.branch = { stage: 6, city: "广州", announce: true, announceMonth: 4 };

    /* —— SHY/CKG 路线：开拓者六人（人员快进后点定，确保六人年内均在籍；
       低人气者优先——与「高人气成员可能不满」的原点将提示同向）—— */
    if (post === "SHY48" || post === "CKG48") {
      const six = st.members
        .filter(m => m.status === "active" && !m.hall && m.team !== "HALL")
        .sort((a, b) => (a.pop || 0) - (b.pop || 0) || (a.name < b.name ? -1 : 1))
        .slice(0, 6);
      d.pioneerList = six.map(m => m.name);   // 注意：pioneerList 存姓名（deployBranch 按名查找，与 pioneerPick 口径一致）
      for (const m of six) {
        m.bond = this.clamp((m.bond || 0) - 15, 0, 100);
        m.note = "开拓者先遣队（随总监移籍" + post + "）";
      }
    }

    /* —— 年末经营盘面（合理中位值）与 2016 总选锚点（史实：鞠婧祎夺冠） —— */
    st.money = 700; st.heat = 48; st.morale = 74; st.train = 36; st.burden = 48;
    st.geResult = { top1: "鞠婧祎", top48: [], strategy: null, bejTop7: null, gnzTop7: null };
    st.month = 12;
    return st;
  },

  /* 【快速通道·2017 全年】在 fastState2016 → carryTo2017 的状态上快进 2017 一年 */
  fastSim2017(choices) {
    const st = this.st;
    /* 双团按史实节奏开业（SHY 2 月 / CKG 10 月），先遣队随开业进驻（deployBranch） */
    st.branch17 = { shy: 1, ckg: 3, shyOpen: false, ckgOpen: false, shyOpenMonth: 0, ckgOpenMonth: 0 };
    st.month = 2;
    this.deployBranch(st, "SHY48");
    st.branch17.shyOpen = true; st.branch17.shyOpenMonth = 2;
    st.month = 10;
    this.deployBranch(st, "CKG48");
    st.branch17.ckgOpen = true; st.branch17.ckgOpenMonth = 10;
    delete st.flags.pioneerPending;
    st.month = 12;

    /* 全年史实人员变动快进 */
    this.fastSimJoinLeave(st, "2017");

    /* 原创公演四套完成（史实向题名） */
    st.orig = { SII: true, NII: true, HII: true, X: true };

    /* —— 赵嘉敏 2017-09 分叉状态落卡（补选项 zhaoState：freeze/study/release/terminate）—— */
    const zjm = st.members.find(x => x.name === "赵嘉敏");
    const zhaoState = choices.zhaoState || "freeze";
    if (zhaoState === "study") {
      st.decisions.zhaoMin = "study";
      if (zjm) { zjm.status = "active"; zjm.note = "学成归队（2017-09）"; }
    } else if (zhaoState === "terminate") {
      st.decisions.zhaoMin = "terminate";
      if (zjm) { zjm.status = "left"; zjm.note = "解除合约"; }
    } else {
      st.decisions.zhaoMin = "rest";
      st.decisions.zhaoMin17 = zhaoState;   // freeze（史实官司暂休）/ release（无责解约）
      if (zjm && zhaoState === "release") { zjm.status = "left"; zjm.note = "协商解除合约（公司放弃违约金）"; }
      else if (zjm) {
        if (zjm.status === "active") zjm.status = "rest";
        zjm.note = "合同冻结：违约金争议诉讼中，暂停一切团体活动";
      }
    }

    /* —— 葛佳慧 2017-11 分叉（promise 承诺音乐规划 / release 支付违约金解约）—— */
    const gjChoice = choices.gejiahui17 || "promise";
    st.decisions.gejiahui17 = gjChoice;
    const gj = st.members.find(x => x.name === "葛佳慧");
    if (gjChoice === "release") {
      if (gj) { gj.status = "left"; gj.note = "2017-11 支付违约金解约（寻求音乐合作）"; }
      st.money += 20;
    } else if (gj) {
      gj.note = "2017-11 承诺音乐规划（专项企划待落地）";
    }

    /* —— 阿吉（2017-01）：是否与阿吉深聊（ajiTalk）——yes 时 flags.aji（卫视资源图谱），
       并将 2018 年 5 月阿吉留任概率由 50% 提升至 75%（m5_18_aji 事件读取）—— */
    const ajiTalk = (choices.ajiTalk || "yes") === "yes" ? "yes" : "no";
    st.decisions.ajiTalk = ajiTalk;
    if (ajiTalk === "yes") st.flags.aji = true;

    /* —— 复刻《双面偶像》决策（2018 主线④的前置；仅非复刻线 2017 有此抉择）——
       复刻模式（jpMode=replicate）下 2017 主线⑥为四套复刻公演、无《双面偶像》提案，
       两线互斥：清除该 tag，2018 主线④自然不可用（红白预赛等复刻专属内容走 jpMode）。 */
    if ((choices.jpMode || st.decisions.jpMode) === "replicate") {
      delete st.decisions.shuangmian17;
    } else {
      st.decisions.shuangmian17 = choices.shuangmian17 || "plan";
    }

    /* —— 第四届总决选（2017-07）：鞠婧祎夺冠 → 荣誉殿堂开堂并升堂 —— */
    st.geResult = { top1: "鞠婧祎", top48: [], strategy: null, bejTop7: null, gnzTop7: null };
    st.flags.hall17 = true; st.flags.jjyHall17 = true;
    const jjy = st.members.find(x => x.name === "鞠婧祎");
    if (jjy && jjy.status !== "left") {
      jjy.hall = true; jjy.team = "HALL"; jjy.branchTeam = null; jjy.status = "active";
      jjy.note = "第四届总决选第一名 · 首位升入荣誉殿堂";
    }

    /* 年末经营盘面 */
    st.money = 850; st.heat = 52; st.morale = 72; st.train = 40; st.burden = 45;
  },

  /* 【快速通道·2026 年末】伪造 2026 年末实况（2026 线按玩家补选的三大决策收束） */
  fastState2026(playerName, choices) {
    const st = this.newGame(playerName, null, "2026");
    const d = st.decisions;
    /* —— 决策补选①：成都 CGT48 路线（cgtPath）—— */
    const cgt = choices.cgtPath || "rebuild";
    d.cgtPath = cgt;
    st.cgt = cgt === "dissolve"
      ? { stage: 0, open: false, openMonth: 0, closed: true, settled: 3, settleDone: true }
      : { stage: 3, open: true, openMonth: 6, closed: false, settled: 0, settleDone: false };
    /* —— 决策补选②：理念阵营（camp26Final：tao/wang/balance）—— */
    const camp = choices.camp26Final || "balance";
    st.camp26 = camp === "tao" ? { tao: 5, wang: 2 } : camp === "wang" ? { tao: 2, wang: 5 } : { tao: 3, wang: 3 };
    d.camp26Final = camp;
    st.flags.camp26Final = camp;
    /* —— 决策补选③：鞠婧祎合约官司结局（cinema 影视部 / buyout 违约金解约 / lose 败诉终止）—— */
    const jjyEnd = choices.jjyEnd || "cinema";
    d.jjyCase = jjyEnd === "lose" ? "pressure" : "legal";
    if (jjyEnd === "cinema") {
      d.jjyVerdict = "cinema";
      st.flags.jjyWin = true; st.flags.jjyResolved = true;
      st.members.push({
        id: "jujingyi26", name: "鞠婧祎", team: "HALL", gen: "二期生 · 影视部",
        pop: 94, bond: 25, status: "active", hall: true, note: "荣誉殿堂 · 影视部（2026 重新签约）",
      });
    } else if (jjyEnd === "buyout") {
      d.jjyVerdict = "buyout";
      st.flags.jjyWin = true; st.flags.jjyResolved = true;
      st.money += 200;
    } else {
      st.flags.jjyWin = false; st.flags.jjyResolved = true;
    }

    /* 全年人员变动快进（二十四期生 5 月入队；2026 退出走末位淘汰，此处按未执行处理） */
    this.fastSimJoinLeave(st, "2026");

    /* 第六届总决选（2026-07）：杨冰怡连霸 → 升入荣誉殿堂 */
    st.geResult = { top1: "杨冰怡", top48: [], strategy: null, bejTop7: null, gnzTop7: null };
    st.flags.bingyiHall = true;
    const by = st.members.find(x => x.name === "杨冰怡");
    if (by) { by.hall = true; by.team = "HALL"; by.note = "连续两届总决选第一名 · 升入荣誉殿堂"; }

    st.money = 520; st.heat = 42; st.morale = 58; st.train = 38; st.burden = 55;
    st.month = 12;
    return st;
  },

  /* 【快速通道】整年人员变动快进（与 endMonth 同口径的简化版）：
     入队建卡（pop/bond 按年代随机基数，2017+ 含 pwr；分团 branchTeam 建简卡）；
     离团按类型生效（毕业/离团/退团→left，暂休→rest，移籍→branch，兼任→仅备注）；
     跳过已离团/暂休/殿堂成员与赵嘉敏（完全由决策线驱动）。 */
  fastSimJoinLeave(st, era) {
    const joinSrc = era === "2016" ? DATA.joining2016
      : era === "2017" ? DATA.joining2017
      : era === "2026" ? DATA2026.joining2026 : [];
    const leaveSrc = era === "2016" ? DATA.leaving2016
      : era === "2017" ? DATA.leaving2017 : [];
    for (let month = 1; month <= 12; month++) {
      for (const j of joinSrc) {
        if (j.month !== month) continue;
        if (st.members.some(x => x.name === j.name)) continue;
        if (j.branchTeam) {
          st.members.push({
            id: "ft" + j.name, name: j.name, team: j.branchTeam, gen: j.gen,
            pop: 0, bond: 0, status: "branch", branchTeam: j.branchTeam, branchLabel: "预备生", note: j.note,
          });
        } else {
          st.members.push({
            id: "ft" + j.name, name: j.name, team: j.team, gen: j.gen,
            pop: era === "2016" ? this.rnd(16, 30) : era === "2017" ? this.rnd(10, 18) : this.rnd(8, 14),
            bond: era === "2016" ? 15 : era === "2017" ? 12 : 8, status: "active",
            pwr: era === "2017" ? this.rnd(5, 10) : undefined,
            note: j.note,
          });
          if (era === "2017" && j.name === "葛佳慧") {
            const gjj = st.members.find(x => x.name === "葛佳慧");
            if (gjj) gjj.pwr = this.rnd(11, 14);
          }
        }
      }
      for (const lv of leaveSrc) {
        if (lv.month !== month) continue;
        const m0 = st.members.find(x => x.name === lv.name);
        if (!m0 || m0.status === "left" || m0.status === "rest") continue;
        if (m0.hall) continue;
        if (lv.name === "赵嘉敏") continue;                                   // 决策线驱动
        if (lv.name === "铃木玛莉亚" && this.isReplicate(st)) continue;        // 复刻路线兼任延续
        /* 先遣队成员不随史实表离团（快速通道保障：开拓者六人须撑到分团开业进驻） */
        if (Array.isArray(st.decisions && st.decisions.pioneerList) && st.decisions.pioneerList.indexOf(lv.name) >= 0) continue;
        const mt = (lv.type.match(/BEJ48|GNZ48|SHY48|CKG48/) || [null])[0];
        if (lv.type.indexOf("移籍") === 0) {
          m0.status = "branch"; m0.team = mt || "BEJ48"; m0.branchTeam = mt || "BEJ48";
        } else if (lv.type.indexOf("兼任") === 0) {
          if (lv.note) m0.note = lv.note;
        } else {
          m0.status = lv.type === "暂休" ? "rest" : "left";
          if (lv.note) m0.note = lv.note;
        }
      }
    }
  },

  /* 【2027 主线二】影视部项目谈话对象（序章已登记 flags.filmLead；此处供场景取用） */
  filmLeadName(st) {
    return (st.flags && st.flags.filmLead) || "孙珍妮、陆婷玉";
  },

  /* ========================================================================
     2017 → 2018「星阵重列」线交接（2017 结算界面「进入下一年」入口，v0.11）
     --------------------------------------------------------------------------
     在 2017 年末成员卡与经营状态的基础上变动：
     ① 登记成员卡快照到 st.history.roster2017（含殿堂/分团状态与总选结果）；
     ② 实力（pwr）沿 2017 装配值继续成长（不重置），重算年初均值 pwrBase；
     ③ 继承 SHY48/CKG48 开业状态（branch17，月收入延续）与 2016 分团兼任 tag
        （concur17/branchPost——主线⑥分担分团由此判定）；
     ④ 新主线状态：reorg18（组阁）/ prep18（预备生汇报公演）/ show18（鹅厂选秀）/
       sm18（复刻双面偶像，仅 shuangmian17=plan）；
     ⑤ 2018 人员变动表装载（DATA.joining2018 / leaving2018，史实考据）。
     【组阁交互说明】主线①筹备以三/四段行动推进（方案→协调[→XII确认]），
       筹备完毕（reorg18.ready）后编制会定于 3 月末召开（九期生 2 月入队后全员一并编排），
       UI 编制会两阶段弹窗逐人定队+队长队副任命，落地在 applyReorg18()。
     ========================================================================== */
  carryTo2018() {
    const src = this.st;
    const members = src.members;
    /* ① 成员卡快照（2017 年末实况，含 pwr/殿堂/分团状态） */
    const snapshot = members.map(m => ({
      name: m.name, team: m.team, status: m.status, branchTeam: m.branchTeam || null,
      pop: m.pop != null ? m.pop : null, bond: m.bond != null ? m.bond : null, hall: !!m.hall,
    }));
    /* ② 实力沿用（2017 装配后已随特训/成长演进），重算年初均值 */
    const pwrBase = this.avgPwr(src);

    const st = {
      saveVersion: this.SAVE_VERSION,
      playerName: src.playerName,
      era: "2018",
      month: 1,
      ap: 3,
      money: src.money,
      heat: src.heat,
      morale: src.morale,
      train: src.train,
      burden: src.burden,
      debt: 0,
      /* 继承 2017 年末成员卡实况（含 branch/rest/left/HALL 状态与人气/羁绊/实力） */
      members: members,
      log: [],
      flags: Object.assign({}, src.flags),
      decisions: Object.assign({}, src.decisions),
      /* 2016/2017 主线对象保留：SHY48/CKG48 开业收入延续；分团兼任 tag 沿用（主线⑥） */
      branch: src.branch,
      branch17: src.branch17,
      orig: src.orig,
      /* 2018 新主线状态 */
      reorg18: { stage: 0, done: false },                       // 主线①：全团大重组（xiiKept 存 flags）
      prep18: { sys: false, promoted: 0 },                      // 主线②：预备生汇报公演（年内升格人数）
      show18: { stage: 0, done: false, album: false },          // 主线⑤：备战鹅厂选秀 + 葛佳慧专辑
      sm18: { stage: 0, done: false, team: null },              // 主线④：复刻《双面偶像》（仅 plan tag）
      pwrBase: pwrBase,
      gePlan: 0, geStrategy: null, geDone: false, geResult: null,
      rtPlan: 0, rtDone: false, rtScore: 0,
      history: {
        roster2017: snapshot,
        ge2017Top1: src.geResult ? src.geResult.top1 : null,    // 连霸判定（主线③升堂事件）
        origDone2017: this.origCount(src),
      },
    };
    delete st.flags.monthStarted;
    delete st.flags.freePromo;
    delete st.flags.pioneerPending;
    /* 2017 一次性旗标不带入 2018 的判定流（保留在 history/decisions 中可回收） */
    delete st.flags.ckgReadyLogged;
    this.st = st;
    this.addLog(st, 1, "2017 年的答卷交卷，2018「星阵重列」开卷：成员卡已按年末实况登记（实力沿 2017 继续成长），年初实力均值 " + pwrBase + "。", "main");
    this.save();
    return st;
  },

  /* 【2018 主线①】组阁筹备阶段门控 */
  reorg18BlockReason() {
    const st = this.st, r = st.reorg18;
    if (r.ready) return "筹备已完毕——组阁编制会定于 3 月末召开";
    if (r.stage === 1 && st.money < 30) return "资金不足（组阁筹备预算需≥30万）";
    return null;
  },

  /* 【2018 主线①】组阁推进：取消XII=三段（方案→协调→筹备完毕）；保留XII=四段（多一步「XII编制确认」）。
     筹备完毕后不立即召开编制会——r.ready=true，编制会定于 3 月末召开（3月月末事件 m3_18_reorg_final
     转交 UI 编制会，确保九期生 2 月入队后全员一并编排）；3 月及以后才走完筹备的，行动当场转交
     （tone=pickReorg18 兜底），落地同在 applyReorg18()。 */
  advanceReorg18() {
    const st = this.st, r = st.reorg18;
    const kept = !!st.flags.xiiKept18;
    if (r.stage === 0) {
      r.stage = 1;
      return { text: "组阁方案研讨启动：运营部连夜把全团的人气、实力、队伍黏性三张表钉在了墙上。", tone: "main", vn: STORY.scenes18.reorgPlan };
    }
    if (r.stage === 1) {
      st.money -= 30; r.stage = 2;
      return { text: "分团协调会开完：组阁涉及的分团上调与落编移籍预案，得到了四家分团总监的签字。（资金-30万）", tone: "main", vn: STORY.scenes18.reorgCoord };
    }
    if (r.stage === 2 && kept) {
      r.stage = 3;
      return { text: "Team XII 编制确认会结束：张怡把 XII 的名册亲手交到了你手上。", tone: "main", vn: STORY.scenes18.reorgXII };
    }
    if ((r.stage === 2 && !kept) || r.stage === 3) {
      if (st.month >= 3) return { text: "", tone: "pickReorg18" };
      r.ready = true;
      return { text: "筹备到此收官——编制名单进入终审。组阁编制会定于 3 月末召开：九期生 2 月入队，届时全员（含新人）一并编排。", tone: "main", vn: STORY.scenes18.reorgReady };
    }
    return { text: "", tone: "none" };
  },

  /* 【2018 主线①】Team XII 去留确认（编制会前兜底）：正常流程在 1 月张怡事件里选择；
     若玩家先于 1 月月末启动组阁行动（张怡事件 gate=reorg18.stage===0 不再触发），
     编制会弹窗会先补问——与张怡事件同一决策 tag（xiiKeep18）与同一效果。 */
  confirmXiiKeep18(keep) {
    const st = this.st;
    st.decisions.xiiKeep18 = keep ? "keep" : "dissolve";
    st.flags.xiiKept18 = !!keep;
    if (keep) st.morale = this.clamp(st.morale + 4, 0, 100);
    else st.money += 20;
    this.addLog(st, st.month, "Team XII 去留落定：" + (keep ? "保留编制（张怡的请求被应允，士气+4）" : "取消编制（XII 完成历史使命，资金+20）") + "。", "main");
    this.save();
    return {
      text: keep ? "Team XII 保留——编制会将包含 XII 的编组（张怡的请求被应允，士气+4）。"
                 : "Team XII 取消——XII 成员将在编制会全员重编（资金+20）。",
      tone: "main",
    };
  },

  /* 【2018 主线①】组阁编制对象：
     head = 本部在籍且队伍为 SII/NII/HII/X/XII/FT/PREP 的成员（全部重编；
       PREP=本部预备生——九期生等随编制会一并编排，可留任预备生或直接定队）；
     branch = 分团在籍且有人气的成员（pop≥20 的移籍老兵/先遣队，可上调本部享「上调红利」）。 */
  reorg18Pools(st) {
    st = st || this.st;
    const HEAD = ["SII", "NII", "HII", "X", "XII", "FT", "PREP"];   // FT 首次组阁前为空池，入列以保证重入（单元测试双跑）时口径一致
    const BR = ["BEJ48", "GNZ48", "SHY48", "CKG48"];
    return {
      head: st.members.filter(m => m.status === "active" && HEAD.indexOf(m.team) >= 0),
      branch: st.members.filter(m => m.status === "branch" && (m.pop || 0) >= 20 && BR.indexOf(m.branchTeam) >= 0),
    };
  },

  /* 【2018 主线①】组阁编制落地（UI.showReorg18Picker 确认回调）：
     assign   = { 成员id → "SII"|"NII"|"HII"|"X"|"FT"|"XII"(仅保留路线) |"prep"(编入/留任预备生) |"drop"(落编移籍) |"stay"(分团留任) }
     captains = { 队伍 → { captain: 成员id, vice: 成员id|null } }
     规则：每队下限13 / 上限20（主力16+替补4，按人气自动划档）；FT 随组阁成立；
     本部预备生（PREP 池，含九期生）一并参编——默认留任预备生（不计入编入上限），
     也可直接定队升格入队（人气+4 羁绊+4，与汇报公演升格同档）；
     编入预备生 ≤16 人——本部正式成员降入预备生（留沪不挪窝，羁绊-4，轻于落编）；
     落编者按 BEJ→GNZ→SHY→CKG 轮替移籍分团（远离本部与粉丝圈，羁绊-8）；
     分团成员上调预备生依旧视为上调（人气+8~14、羁绊+12）。 */
  applyReorg18(assign, captains) {
    const st = this.st, r = st.reorg18;
    const kept = !!st.flags.xiiKept18;
    const TEAMS = kept ? ["SII", "NII", "HII", "X", "XII", "FT"] : ["SII", "NII", "HII", "X", "FT"];
    const BR = ["BEJ48", "GNZ48", "SHY48", "CKG48"];
    const pools = this.reorg18Pools(st);
    assign = assign || {}; captains = captains || {};

    /* 第一遍：计数校验（未指定的本部成员视为留在原队；预备生默认留任、不计入
       「编入预备生」上限；XII 解散时 XII 不可作为目标；编入预备生 ≤16 人仅计
       正式成员降入与分团上调预备生） */
    const cnt = {}; TEAMS.forEach(t => { cnt[t] = 0; });
    let drops = 0, preps = 0;
    const targetOf = m => {
      const def = m.team === "PREP" ? "prep" : (m.status === "branch" ? "stay" : m.team);
      const t = assign[m.id] != null ? assign[m.id] : def;
      if (t === "drop" || t === "stay" || t === "prep") return t;
      if (TEAMS.indexOf(t) < 0) return null;
      if (t === "XII" && !kept) return null;
      return t;
    };
    for (const m of pools.head.concat(pools.branch)) {
      const t = targetOf(m);
      if (t == null) return { text: "编制表无效（含未知队伍目标）。", tone: "blocked" };
      if (t === "drop") drops++;
      else if (t === "prep") { if (m.team !== "PREP") preps++; }
      else if (t !== "stay") cnt[t]++;
    }
    if (preps > 16) {
      return { text: "编入预备生 " + preps + " 人越界——编制会至多 16 人转入预备生池。", tone: "blocked" };
    }
    for (const t of TEAMS) {
      if (cnt[t] < 13 || cnt[t] > 20) {
        return { text: "Team " + t + " 编制 " + cnt[t] + " 人越界——每队下限 13 人、上限 20 人（主力 16 + 替补 4）。", tone: "blocked" };
      }
    }

    /* 第二遍：队长任命先校验后落笔（校验失败时不得已改动任何成员卡）。
       newTeamOf：id → 编制会后的队伍（落编/留任为 null）。 */
    const byId = {};
    for (const m of pools.head.concat(pools.branch)) byId[m.id] = m;
    const newTeamOf = {};
    for (const m of pools.head.concat(pools.branch)) {
      const t = targetOf(m);
      newTeamOf[m.id] = (t === "drop" || t === "stay") ? null : t;
    }
    for (const t of TEAMS) {
      const c = captains[t] || {};
      const cap = c.captain ? byId[c.captain] : null;
      if (!cap || newTeamOf[cap.id] !== t) {
        return { text: "Team " + t + " 尚未任命队长——每个队伍都需要一名队长。", tone: "blocked" };
      }
      if (c.vice) {
        const vice = byId[c.vice];
        if (!vice || newTeamOf[vice.id] !== t) {
          return { text: "Team " + t + " 的队副人选不在该队编制内。", tone: "blocked" };
        }
      }
    }

    /* 第三遍：落编移籍 + 编入预备生 + 调队/预备生升格 + 分团上调 */
    const moved = [], upped = [], dropped = [], prepped = [], prepUp = [];
    let brIdx = 0;
    for (const m of pools.head) {
      const t = targetOf(m);
      if (t === "prep") {
        if (m.team === "PREP") continue;   // 预备生留任：无变化，不计入编入上限
        /* 本部正式成员 → 预备生：留在本部只是退出正式队序列，羁绊-4（轻于落编） */
        m.team = "PREP"; m.branchTeam = null; m.branchLabel = null;
        m.captain = false; m.vice = false; delete m.sub;
        m.bond = this.clamp((m.bond || 0) - 4, 1, 100);
        m.note = "2018组阁 · 编入预备生";
        prepped.push(m.name);
        this.addLog(st, st.month, m.name + " 组阁编入预备生（羁绊-4）。", "normal");
      } else if (t === "drop") {
        const bt = BR[brIdx++ % BR.length];
        m.status = "branch"; m.team = bt; m.branchTeam = bt; m.branchLabel = "";
        m.captain = false; m.vice = false; delete m.sub;
        m.bond = this.clamp((m.bond || 0) - 8, 1, 100);
        m.note = "2018组阁落编 · 移籍" + bt;
        dropped.push(m.name);
        this.addLog(st, st.month, m.name + " 组阁落编，移籍" + bt + "（羁绊-8）。", "normal");
      } else if (t !== m.team) {
        const fromPrep = m.team === "PREP";
        m.team = t; m.branchTeam = null;
        if (fromPrep) {
          /* 预备生 → 正式队：组阁年的直接定队通道（与汇报公演升格同档加成） */
          m.pop = this.clamp((m.pop || 0) + 4, 1, 100);
          m.bond = this.clamp((m.bond || 0) + 4, 1, 100);
          m.note = "2018组阁 · 自预备生升格入 Team " + t;
          prepUp.push(m.name);
          this.addLog(st, st.month, m.name + " 组阁自预备生升格入 Team " + t + "（人气+4 羁绊+4）。", "good");
        } else {
          moved.push(m.name);
        }
      }
    }
    for (const m of pools.branch) {
      const t = targetOf(m);
      if (t === "stay" || t === "drop") continue;
      if (t === "prep") {
        /* 分团成员 → 预备生：依旧视为上调（组阁年通道），享上调红利、不降羁绊 */
        m.status = "active"; m.team = "PREP"; m.branchTeam = null; m.branchLabel = null;
        m.pop = this.clamp((m.pop || 0) + this.rnd(8, 14), 1, 100);
        m.bond = this.clamp((m.bond || 0) + 12, 1, 100);
        m.note = "2018组阁上调预备生" + (m.note ? "（原：" + m.note + "）" : "");
        upped.push(m.name);
        this.addLog(st, st.month, m.name + " 自分团上调本部预备生（上调红利：人气与羁绊上一个台阶）。", "good");
        continue;
      }
      m.status = "active"; m.team = t; m.branchTeam = null; m.branchLabel = null;
      m.pop = this.clamp((m.pop || 0) + this.rnd(8, 14), 1, 100);
      m.bond = this.clamp((m.bond || 0) + 12, 1, 100);
      m.note = "2018组阁上调本部" + (m.note ? "（原：" + m.note + "）" : "");
      upped.push(m.name);
      this.addLog(st, st.month, m.name + " 自分团上调本部，编入 Team " + t + "（上调红利：人气与羁绊上一个台阶）。", "good");
    }

    /* 主力/替补划档：每队按人气排序，前 16 人为主力，其余为替补 */
    for (const t of TEAMS) {
      const list = st.members
        .filter(m => m.status === "active" && m.team === t)
        .sort((a, b) => (b.pop || 0) - (a.pop || 0));
      list.forEach((m, i) => { m.sub = i >= 16; });
    }

    /* 队长/队副任命：先清空现职，再按 captains 表落任（每队 1 队长、队副至多 1） */
    for (const m of st.members) { m.captain = false; m.vice = false; }
    for (const t of TEAMS) {
      const c = captains[t] || {};
      byId[c.captain].captain = true;
      if (c.vice) byId[c.vice].vice = true;
    }

    /* FT 成立 + 主线达成 */
    st.flags.ftFormed = true;
    r.stage = 4; r.done = true; r.ready = false;
    st.flags.reorg18Done = true;
    st.morale = this.clamp(st.morale + 5, 0, 100);
    st.heat = this.clamp(st.heat + 5, 0, 100);
    this.addLog(st, st.month, "★主线一「全团大重组」达成：新编制名单公布（调队 " + moved.length + " 人 · 预备生升格 " + prepUp.length + " 人 · 分团上调 " + upped.length + " 人 · 编入预备生 " + prepped.length + " 人 · 落编移籍 " + dropped.length + " 人 · Team FT 成立" + (kept ? " · XII 保留" : " · XII 谢幕") + "）。", "main");
    this.save();
    return {
      text: "组阁编制会落幕：调队 " + moved.length + " 人 · 预备生升格 " + prepUp.length + " 人 · 分团上调 " + upped.length + " 人 · 编入预备生 " + prepped.length + " 人 · 落编移籍 " + dropped.length + " 人 · Team FT 成立。",
      tone: "main",
      vn: STORY.scenes18.reorgDone,
    };
  },

  /* 【2018 主线④】复刻《双面偶像》阶段门控（仅 shuangmian17=plan；队伍平均实力影响效果） */
  sm18BlockReason() {
    const st = this.st, s = st.sm18;
    if (s.stage === 1 && st.money < 40) return "资金不足（复刻排练预算需≥40万）";
    return null;
  },
  avgTeamPwr(st, team) {
    const list = st.members.filter(m => m.status === "active" && m.team === team && m.pwr != null);
    if (!list.length) return 0;
    return Math.round(list.reduce((a, m) => a + m.pwr, 0) / list.length);
  },

  /* 【2018 主线④】复刻队伍选定（UI.pickTeam18 回调）：立项并进入排练阶段 */
  setSm18Team(team) {
    const st = this.st, s = st.sm18;
    s.team = team;
    s.stage = 1;
    return { text: "复刻工程立项：承办队伍定为 " + team + "。广州方面把《双面偶像》的道具清单、控台点位表和排练笔记整套发到了上海。", tone: "main", vn: STORY.scenes18.smStart };
  },

  /* 【2018 主线④】复刻推进：排练→首演验收（队伍均值影响效果） */
  advanceSm18() {
    const st = this.st, s = st.sm18;
    if (s.stage === 1) {
      st.money -= 40; s.stage = 2;
      const avg = this.avgTeamPwr(st, s.team);
      const bonus = avg >= 30 ? "排练厅的评价是「一次到位」" : avg >= 22 ? "排练按期推进，细节还需打磨" : "排练进度偏慢——这支队伍的实力底子还要练";
      return { text: "《双面偶像》复刻排练开启（承办：" + (s.team || "待定") + "，队伍平均实力 " + avg + "）：" + bonus + "。（资金-40万）", tone: "main", vn: STORY.scenes18.smRehearsal };
    }
    if (s.stage === 2) {
      s.stage = 3; s.done = true;
      st.flags.sm18Done = true;
      const avg = this.avgTeamPwr(st, s.team);
      const heat = avg >= 30 ? 10 : avg >= 22 ? 7 : 4;
      st.heat = this.clamp(st.heat + heat, 0, 100);
      st.morale = this.clamp(st.morale + 4, 0, 100);
      this.addLog(st, st.month, "★主线四「复刻《双面偶像》」达成：" + (s.team || "") + " 承办首演落幕（队伍均值 " + avg + "，热度+" + heat + "）。", "main");
      return { text: "《双面偶像》复刻首演落幕——广州的舞台在上海重生。", tone: "main", vn: STORY.scenes18.smDebut };
    }
    return { text: "", tone: "none" };
  },

  /* 【2018 主线⑤】备战鹅厂选秀：派遣名单落地（showMultiPick 回调；葛佳慧承诺自动占位） */
  setShow18Squad(ids) {
    const st = this.st, s = st.show18;
    s.squad = ids;
    s.stage = 1;
    const m = st.members.find(x => x.name === "葛佳慧");
    if (m && st.decisions.gejiahui17 === "promise" && ids.indexOf(m.id) < 0) ids.push(m.id);
    return { text: "选秀派遣名单敲定（共 " + ids.length + " 人）：封闭集训即刻启动。", tone: "main" };
  },
  show18BlockReason() {
    const st = this.st, s = st.show18;
    if (s.stage === 1 && st.money < 30) return "资金不足（封闭集训需≥30万）";
    return null;
  },
  advanceShow18() {
    const st = this.st, s = st.show18;
    if (s.stage === 0) return { text: "", tone: "pickSquad18" };   // 转交 UI 点将窗（UI.showShow18Picker）
    if (s.stage === 1) {
      st.money -= 30; s.stage = 2;
      return { text: "封闭集训开营：声乐、舞蹈、镜头表现，三线并进。（资金-30万）", tone: "main", vn: STORY.scenes18.showCamp };
    }
    if (s.stage === 2) {
      s.stage = 3; s.done = true;
      st.flags.show18Done = true;
      st.heat = this.clamp(st.heat + 12, 0, 100);
      st.money += 40;
      /* 【阿吉留任追加回收】《梦想演播厅》定盘方向（flags.dreamStage18，5月事件落定）：
         studio=综艺预热（热度+6）/ draft=备战特训（出征成员羁绊+4 实力+2） */
      const squad18 = (s.squad || []).map(id => st.members.find(m => m.id === id)).filter(Boolean);
      if (st.flags.dreamStage18 === "studio") {
        st.heat = this.clamp(st.heat + 6, 0, 100);
        this.addLog(st, st.month, "《梦想演播厅》选秀特辑收官：团内竞演的热度直接灌进了首轮录制（热度+6）。", "good");
      } else if (st.flags.dreamStage18 === "draft") {
        let n18 = 0;
        for (const m of squad18) {
          m.bond = this.clamp((m.bond || 0) + 4, 0, 100);
          if (m.pwr != null) m.pwr = Math.min(90, m.pwr + 2);
          n18++;
        }
        this.addLog(st, st.month, "《梦想演播厅》资源全押集训：出征成员羁绊+4 实力+2（" + n18 + " 人）。", "good");
      }
      this.addLog(st, st.month, "★主线五「备战鹅厂选秀」达成：派遣成员完成首轮录制，话题度大涨（热度+12，商务预付+40万）。", "main");
      return { text: "首轮录制收官——节目播出后，「丝芭系」的训练成果刷了屏。", tone: "main", vn: STORY.scenes18.showAir };
    }
    return { text: "", tone: "none" };
  },

  /* 【2018 主线⑤·葛佳慧企划】个人专辑发行（gejiahui17=promise 专属，2017 承诺的回收） */
  releaseAlbum18() {
    const st = this.st, s = st.show18;
    if (s.album) return { text: "专辑已发行。", tone: "blocked" };
    if (st.money < 40) return { text: "资金不足（专辑制作需≥40万）", tone: "blocked" };
    st.money -= 40;
    s.album = true;
    st.flags.album18Done = true;
    const gj = st.members.find(x => x.name === "葛佳慧");
    if (gj) { gj.pop = this.clamp(gj.pop + 6, 0, 100); gj.bond = this.clamp(gj.bond + 10, 0, 100); gj.note = "2018 个人专辑《给梦想的回信》发行（2017 音乐企划兑现）"; }
    st.heat = this.clamp(st.heat + 6, 0, 100);
    st.morale = this.clamp(st.morale + 4, 0, 100);
    this.addLog(st, st.month, "葛佳慧个人专辑《给梦想的回信》发行——去年许下的音乐企划，兑现了。（热度+6 士气+4）", "gold");
    return { text: "专辑上线当晚，评论区最高赞写着：「说过的舞台，真的给了。」", tone: "main", vn: STORY.scenes18.albumOut };
  },

  /* 【2018 主线②】预备生汇报公演：月度事件回调——表现优异者升格（含分团预备生上调本部） */
  promotePrep18(id, team) {
    const st = this.st;
    const m = st.members.find(x => x.id === id);
    if (!m) return { text: "未找到该成员。", tone: "blocked" };
    const fromBranch = m.status === "branch";
    m.team = team; m.branchTeam = null; m.branchLabel = null;
    m.status = "active";
    if (fromBranch) {
      /* 分团上调本部：羁绊与人气提升（组阁年的「上调红利」） */
      m.pop = this.clamp((m.pop || 0) + this.rnd(8, 14), 1, 100);
      m.bond = this.clamp((m.bond || 0) + 12, 1, 100);
    } else {
      m.pop = this.clamp((m.pop || 0) + 4, 0, 100);
      m.bond = this.clamp((m.bond || 0) + 4, 0, 100);
    }
    st.prep18.promoted += 1;
    this.addLog(st, st.month, "预备生汇报公演 · 升格：" + m.name + " → " + team + (fromBranch ? "（自分团上调本部）" : "") + "。", "good");
    return { text: m.name + " 升格入 " + team + (fromBranch ? "——分团上调本部，人气与羁绊都上了一级。" : "。"), tone: "main" };
  },

  /* 【2018 主线②】预备生汇报公演候选：本部 PREP + 分团预备生。
     确定性排序（pwr×2 + 人气 + 羁绊×0.5 加权）取前 3——pages 与裁决 effect 两次调用
     必须指向同一位成员，故不用随机。 */
  prepStageCandidates(st) {
    const pool = st.members.filter(m => (m.team === "PREP" || (m.status === "branch" && (m.branchLabel === "预备生" || m.branchLabel === "")))
      && m.status !== "left" && m.name);
    return pool.slice().sort((a, b) =>
      ((b.pwr || 0) * 2 + (b.pop || 0) + (b.bond || 0) * 0.5) - ((a.pwr || 0) * 2 + (a.pop || 0) + (a.bond || 0) * 0.5)
      || (a.name < b.name ? -1 : 1)).slice(0, 3);
  },

  /* 【2026 末位淘汰】真实选取评审对象（v0.10.1）：
     本部正式队员中考核末位者（人气最低，并列取羁绊更低者，再按姓名稳定排序）。
     跳过：新晋入队的预备生（PREP 池）、荣誉殿堂/影视部成员（HALL）、
     以及二十三期生（2月刚升格入队，随即被末位评审/委培不合情理）。
     无可用对象（极端情形）返回 null，事件文案与裁决自行兜底。 */
  pickElimTarget(st) {
    const pool = (st.members || []).filter(m =>
      m.status === "active" && m.team !== "PREP" && m.team !== "HALL" && !m.hall
      && m.gen !== "二十三期生" && m.pop != null);
    if (!pool.length) return null;
    return pool.slice().sort((a, b) =>
      a.pop - b.pop || a.bond - b.bond || (a.name < b.name ? -1 : 1))[0];
  },

  /* 【2027 主线一】WHN48 筹备阶段门控（同 branch17BlockReason 口径） */
  wh27BlockReason() {
    const st = this.st, b = st.branch27 || (st.branch27 = { stage: 0, open: false, openMonth: 0 });
    if (b.stage === 1 && st.money < 160) return "资金不足（武汉剧场需≥160万）";
    if (b.stage === 2 && st.morale < 55) return "士气不足（需≥55）";
    return null;
  },

  /* 【2027 主线一】WHN48 筹备推进（阶段场景见 STORY.scenes27.wh；三段：立项→剧场→招募） */
  advanceWH27() {
    const st = this.st;
    const b = st.branch27;
    if (b.stage === 0) {
      b.stage = 1;
      return { text: "WHN48 立项启动：王婧把签好字的立项书复印了三份，一份当场钉在了你的办公室墙上。", tone: "main", vn: STORY.scenes27.whStart };
    }
    if (b.stage === 1) {
      st.money -= 150; b.stage = 2;
      return { text: "武汉星梦剧院改造开工：长江边的商圈顶层，第五座支流剧院破土动工。（资金-150万）", tone: "main", vn: STORY.scenes27.whTheater };
    }
    if (b.stage === 2) {
      b.stage = 3;
      return { text: "WHN48 首批十六人集训开营——江城的姑娘们，等的就是这声锣。", tone: "main", vn: STORY.scenes27.whRecruit };
    }
    return { text: "", tone: "none" };
  },

  /* 【2027 主线一】WHN48（武汉）首演亮灯建卡（engine 在月末开业判定处调用）：
     ① 同人虚构一期生 16 人建卡（Team W / Team H，见 data_members_2026.js whFoundingRoster）；
     ② 2026 线末位淘汰「调往 CGT48 委培」时约定移籍的成员（whAgreed26 标记）
        随成立正式移籍入队——按 Team W/H 现有人数均衡编队。 */
  deployWH(st) {
    if (st.flags["founded_WHN48"]) return;
    st.flags["founded_WHN48"] = true;
    let n = 0;
    for (const r of (DATA2026.whFoundingRoster || [])) {
      if (st.members.some(x => x.name === r.name)) continue;
      st.members.push({
        id: "whn27_" + r.name, name: r.name, team: "WHN48", gen: "WHN48一期生",
        pop: this.rnd(4, 10), bond: 8, status: "branch", branchTeam: "WHN48", branchLabel: r.branchLabel || "",
        pwr: this.rnd(5, 10),
      });
      n++;
    }
    if (n) this.addLog(st, st.month, "WHN48 招募一期生 " + n + " 人建卡入册（Team W / Team H）。", "main");
    /* ② 约定移籍兑现：CGT48 委培 → WHN48（2026 末位淘汰评审埋下的约定） */
    let t = 0;
    for (const m of st.members) {
      if (!m.whAgreed26 || m.status === "left") continue;
      if (m.status === "branch" && m.branchTeam === "WHN48") continue;
      const w = st.members.filter(x => x.branchTeam === "WHN48" && x.branchLabel === "Team W").length;
      const h = st.members.filter(x => x.branchTeam === "WHN48" && x.branchLabel === "Team H").length;
      const lab = w <= h ? "Team W" : "Team H";
      m.status = "branch"; m.team = "WHN48"; m.branchTeam = "WHN48"; m.branchLabel = lab;
      m.note = "末位淘汰评审·调往CGT48委培——WHN48 成立，移籍入队（" + lab + "）";
      delete m.whAgreed26;
      t++;
      this.addLog(st, st.month, m.name + " 履行移籍约定：CGT48 委培 → WHN48（" + lab + "）。", "main");
    }
    if (t) this.addLog(st, st.month, "2026 年末位淘汰时约定「移籍武汉」的委培成员共 " + t + " 人，随 WHN48 成立正式入队。", "main");
  },

  /* 【2027 主线二】影视部专项阶段门控 */
  filmBlockReason() {
    const st = this.st, f = st.film || (st.film = { stage: 0, done: false, doneMonth: 0 });
    if (f.stage === 1 && st.money < 30) return "资金不足（项目遴选至少需30万）";
    if (f.stage === 2 && st.money < 120) return "资金不足（开机投入需≥120万）";
    return null;
  },

  /* 【2027 主线二】影视部推进（阶段场景见 STORY.scenes27.film；立项→遴选→开机，播出在月末判定） */
  advanceFilm() {
    const st = this.st;
    const f = st.film;
    if (f.stage === 0) {
      f.stage = 1;
      return { text: "影视部年度方向敲定：谈话纪要上，「影视部焕新」四个字被圈了两圈。", tone: "main", vn: STORY.scenes27.filmStart };
    }
    if (f.stage === 1) {
      f.stage = 2;
      return { text: "项目遴选落定，剧本围读排上日程——影视部今年的第一盘棋，落子了。", tone: "main", vn: STORY.scenes27.filmPick };
    }
    if (f.stage === 2) {
      st.money -= 100; f.stage = 3;
      return { text: "开机仪式礼成：摄影机架起来那一刻，影视部久违地热闹了起来。（资金-100万）", tone: "main", vn: STORY.scenes27.filmShoot };
    }
    return { text: "", tone: "none" };
  },

  /* 成员卡结构：{ id, name, team, gen, pop, bond, status: 'active'|'left'|'rest'|'branch',
                   branchTeam?, branchLabel?（2026 分团成员的完整队伍标注） } */
  buildRoster(st) {
    if (st.era === "2026") {
      /* 2026：本部各队完整建卡；分团成员为简卡（status='branch'，无人气/羁绊，
         仅在成员页对应分团标签页展示「姓名+队伍」） */
      st.members = DATA2026.members.map(m => m.team === "branch"
        ? {
            id: m.id, name: m.name, team: m.branchTeam, gen: m.gen,
            pop: 0, bond: 0, status: "branch", branchTeam: m.branchTeam, branchLabel: m.branchLabel || "",
          }
        : {
            id: m.id, name: m.name, team: m.team, gen: m.gen,
            pop: m.pop, bond: 15, status: "active",
            captain: !!m.captain, vice: !!m.vice,
            hall: !!m.hall, note: m.note,   // 荣誉殿堂·影视部（孙珍妮/陆婷玉等 HALL 卡）
          });
      return;
    }
    st.members = DATA.members.map(m => ({
      id: m.id, name: m.name, team: m.team, gen: m.gen,
      pop: m.pop, bond: 20, status: "active",
      captain: !!m.captain, vice: !!m.vice,
    }));
  },

  /* ============================ 存档 ============================ */

  save() {
    try {
      const raw = JSON.stringify(this.st);
      localStorage.setItem(this.SAVE_KEY, raw);
      /* 双 key 互备：主档被单独清理时可从备份恢复 */
      try { localStorage.setItem(this.BACKUP_KEY, raw); } catch (e2) {}
      return true;
    } catch (e) { console.error("存档失败", e); return false; }
  },

  /* 内部：字段兜底（读主档/备份档共用） */
  _normalize(st) {
    if (!st.decisions) st.decisions = {};
    if (!st.camp26) st.camp26 = { tao: 0, wang: 0 };
    if (!st.era) st.era = "2016";
    if (!st.cgt) st.cgt = { stage: 0, open: false, openMonth: 0, closed: false, settled: 0, settleDone: false };
    if (st.cgt.closed === undefined) st.cgt.closed = false;
    if (st.cgt.settled === undefined) st.cgt.settled = 0;
    if (st.cgt.settleDone === undefined) st.cgt.settleDone = false;
    if (!st.elim) st.elim = { executed: 0, defied: 0, transferred: 0, warned: false };
    if (st.rtCancelled === undefined) st.rtCancelled = false;
    /* 2017「本部新章」线字段兜底 */
    if (!st.branch17) st.branch17 = { shy: 0, ckg: 0, shyOpen: false, ckgOpen: false, shyOpenMonth: 0, ckgOpenMonth: 0 };
    if (!st.orig) st.orig = { SII: false, NII: false, HII: false, X: false };
    if (st.pwrBase === undefined) st.pwrBase = 0;
    /* 2027「大河新篇」线字段兜底 */
    if (!st.branch27) st.branch27 = { stage: 0, open: false, openMonth: 0 };
    if (!st.film) st.film = { stage: 0, done: false, doneMonth: 0 };
    if (!st.history) st.history = {};
    /* WHN48 改名迁移（v0.10 首发曾用 WH48，读档时统一到 WHN48） */
    if (st.flags && st.flags["founded_WH48"]) { st.flags["founded_WHN48"] = true; delete st.flags["founded_WH48"]; }
    for (const m of (st.members || [])) {
      if (m.team === "WH48") m.team = "WHN48";
      if (m.branchTeam === "WH48") m.branchTeam = "WHN48";
      if (m.gen === "武汉48一期生") m.gen = "WHN48一期生";
    }
    return st;
  },

  load() {
    try {
      let raw = localStorage.getItem(this.SAVE_KEY);
      if (!raw) raw = localStorage.getItem(this.BACKUP_KEY);   // 主档缺失/被清 → 备份恢复
      if (!raw) return null;
      const st = JSON.parse(raw);
      if (st.saveVersion !== this.SAVE_VERSION) return null;
      this.st = this._normalize(st);
      return this.st;
    } catch (e) { console.error("读档失败", e); return null; }
  },

  /* 【存档码】把当前存档导出为可复制的文本（base64），用于跨目录/跨浏览器/换机恢复。
     file:// 下 localStorage 按「文件完整路径」隔离（部分浏览器如 360 尤其严格），
     压缩包内直接双击还会每次解压到随机临时目录——存档码是纯前端唯一可靠的兜底。 */
  exportCode() {
    try {
      const raw = localStorage.getItem(this.SAVE_KEY) || localStorage.getItem(this.BACKUP_KEY);
      if (!raw) return null;
      return "SG48V1." + btoa(unescape(encodeURIComponent(raw)));
    } catch (e) { console.error("导出存档码失败", e); return null; }
  },

  importCode(code) {
    try {
      if (!code || code.indexOf("SG48V1.") !== 0) return { ok: false, msg: "存档码格式不正确（应以 SG48V1. 开头）。" };
      const raw = decodeURIComponent(escape(atob(code.slice(7).trim())));
      return this.importSaveText(raw, "存档码导入成功");
    } catch (e) { return { ok: false, msg: "存档码无法解析（可能复制不完整）。" }; }
  },

  /* 【存档文件】实测 360 浏览器以「本地文件」方式打开时，关闭后 localStorage 不保留
     （同路径也不保留，刷新仅会话内有效）——浏览器安全策略，代码无法强制持久化。
     因此提供「保存进度到文件 / 从文件恢复」：下载 .sg48save 文件 + FileReader 读回，
     file:// 下完全可用，与存档码并列双保险。 */
  exportSaveFile() {
    try {
      const raw = localStorage.getItem(this.SAVE_KEY) || localStorage.getItem(this.BACKUP_KEY);
      if (!raw) return null;
      const st = JSON.parse(raw);
      const name = "塞纳河打工人生_存档_" + st.era + "年" + st.month + "月.sg48save";
      return { name: name, text: raw };
    } catch (e) { return null; }
  },

  importSaveText(text, okPrefix) {
    try {
      const st = JSON.parse(text);
      if (st.saveVersion !== this.SAVE_VERSION) return { ok: false, msg: "存档文件版本与当前游戏不匹配。" };
      localStorage.setItem(this.SAVE_KEY, text);
      try { localStorage.setItem(this.BACKUP_KEY, text); } catch (e2) {}
      this.st = this._normalize(st);
      return { ok: true, msg: (okPrefix || "进度已从文件恢复") + "：" + st.era + "线 · " + st.year + "年" + st.month + "月。", st: this.st };
    } catch (e) { return { ok: false, msg: "存档文件无法解析（可能选错了文件）。" }; }
  },

  hasSave() { return !!localStorage.getItem(this.SAVE_KEY); },
  clearSave() { localStorage.removeItem(this.SAVE_KEY); },

  /* ============================ 工具 ============================ */

  clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },
  rnd(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); },

  activeMembers(st) { return st.members.filter(m => m.status === "active"); },

  /* 复刻路线判定（跨洋会议选「完全照搬日本模式」）；旧档兼容 st.jpMode 直存字段 */
  isReplicate(st) {
    st = st || this.st;
    return ((st.decisions && st.decisions.jpMode) || st.jpMode) === "replicate";
  },

  /* 【赵嘉敏·史实路线判定】是否处于「官司暂休」路线（2018-06 毕业的唯一触发前提）：
     zhaoMin17=freeze（2017 赵母事件选「冻结合同」）；旧档未登记 zhaoMin17 时，
     只要 2016 未选解约/学业线（zhaoMin 为空或 rest）即按史实默认。 */
  zjmFreezeRoute(st) {
    st = st || this.st;
    const d = st.decisions || {};
    if (d.zhaoMin17 != null) return d.zhaoMin17 === "freeze";
    return d.zhaoMin == null || d.zhaoMin === "rest";
  },

  /* 【2017 分团线伏笔】开拓者点将（下一站兼任 SHY48/CKG48 后触发）：
     六名现役成员明年随总监移籍。
     规则：BEJ48/GNZ48 成员（status='branch'）无影响；
          本部成员 pop<60 视作新机会（羁绊+2）；
          本部成员 pop≥60（高人气）不满——羁绊-15，按人气档位有概率提出离团
          （≥85:35% / ≥70:22% / ≥60:12%），离团者不计入开拓者名单。
     名单登记：decisions.pioneerList（成功）/ pioneerRefused（离团）。 */
  pioneerPick(ids) {
    const st = this.st;
    const picked = (ids || []).map(id => st.members.find(m => m.id === id)).filter(Boolean);
    if (picked.length !== 6) return { text: "名单无效（需选择六名成员）" };
    const joined = [], refused = [];
    let moraleHit = 0;
    for (const m of picked) {
      if (m.status === "branch") { joined.push(m.name); continue; }   // 分团成员：无影响
      if (m.pop >= 60) {
        m.bond = this.clamp(m.bond - 15, 0, 100);
        const chance = m.pop >= 85 ? 0.35 : m.pop >= 70 ? 0.22 : 0.12;
        if (Math.random() < chance) {
          m.status = "left";
          refused.push(m.name);
          moraleHit++;
          this.addLog(st, st.month, m.name + "（人气" + m.pop + "）得知移籍名单后提出离团，经挽留无效。（羁绊-15）", "bad");
        } else {
          joined.push(m.name);
          this.addLog(st, st.month, m.name + "（人气" + m.pop + "）对移籍名单颇有微词，最终选择同行。（羁绊-15）", "normal");
        }
      } else {
        m.bond = this.clamp(m.bond + 2, 0, 100);
        joined.push(m.name);
      }
    }
    if (moraleHit) st.morale = this.clamp(st.morale - 3 * moraleHit, 0, 100);
    this.recordDecision("pioneerList", joined);
    this.recordDecision("pioneerRefused", refused);
    this.addLog(st, st.month, "开拓者名单公布（" + st.decisions.branchPost + "）：" + joined.join("、") + (refused.length ? "。" + refused.join("、") + "最终未能同行。" : "。六人整装，一月出发。"), "main");
    this.save();
    const head = refused.length
      ? "名单公布的那一刻，后台安静了几秒——" + refused.join("、") + "红着眼提出离团，谁也没能留下她。\n\n"
      : "";
    return { text: head + "开拓者六人（" + joined.join("、") + "）：明年一月，随你一起去" + (st.decisions.branchPost === "SHY48" ? "沈阳" : "重庆") + "打头阵。" +
      (refused.length ? "（全团士气-" + 3 * moraleHit + "）" : "") };
  },

  /* 【2018 通用】小分队成军·公司选取（UI 点将回调，pickMode ho2pick/bluevpick）：
     unit="HO2"（2人）/"BlueV"（5人）；选中者小分队成军曝光（人气+5 羁绊+5，
     成员卡备注），名单存姓名（decisions.unitsHO2/unitsBlueV）供后续剧情回收。 */
  setUnit18(unit, ids) {
    const st = this.st;
    const need = unit === "HO2" ? 2 : 5;
    const members = (ids || []).map(id => st.members.find(m => m.id === id)).filter(Boolean);
    if (members.length !== need) return { text: "名单无效（" + unit + " 需 " + need + " 人）。", tone: "blocked" };
    const key = unit === "HO2" ? "unitsHO2" : "unitsBlueV";
    st.decisions[key] = members.map(m => m.name);
    for (const m of members) {
      m.pop = this.clamp((m.pop || 0) + 5, 0, 100);
      m.bond = this.clamp((m.bond || 0) + 5, 0, 100);
      m.note = (m.note ? m.note + "；" : "") + "SNH48小分队" + unit + "成员（公司指定成军）";
    }
    this.addLog(st, st.month, "小分队 " + unit + " 名单公布（公司指定）：" + members.map(m => m.name).join("、") + "。", "main");
    this.save();
    return { text: unit + " 名单敲定：" + members.map(m => m.name).join("、") + "。小分队成军曝光（每人人气+5 羁绊+5）。", tone: "main" };
  },

  /* 【2018 复刻路线专属】红白歌会·中国预赛出征名单（UI.showKohakuPicker 回调）：
     全团（本部+分团在册）五人；被选中者预赛舞台曝光（羁绊+8 人气+3），
     名单存姓名（decisions.kohaku18Squad）供 12 月决赛结算（m12_18_kohaku_final）。 */
  setKohakuSquad(ids) {
    const st = this.st;
    const squad = (ids || []).map(id => st.members.find(m => m.id === id)).filter(Boolean);
    if (squad.length !== 5) return { text: "名单无效（需五人）。", tone: "blocked" };
    st.decisions.kohaku18Squad = squad.map(m => m.name);   // 存姓名（与 pioneerList 同口径，跨事件按名查找）
    for (const m of squad) {
      m.bond = this.clamp((m.bond || 0) + 8, 0, 100);
      m.pop = this.clamp((m.pop || 0) + 3, 0, 100);
    }
    const loc = st.decisions.kohaku18 === "hq" ? "本部" : (st.decisions.kohaku18 || "分团");
    this.addLog(st, st.month, "红白歌会·中国预赛名单公布（承办：" + loc + "）：" + squad.map(m => m.name).join("、") + "。", "main");
    this.save();
    return { text: "红白预赛五人名单敲定：" + squad.map(m => m.name).join("、") + "。预赛舞台曝光（每人羁绊+8 人气+3）——表现优异者将于年末获邀赴日参加红白决赛。", tone: "main" };
  },

  /* 复刻路线限定：宫泽佐江毕业公演赴日名单（Team SII 五人点将）。
     生效：五人羁绊+10 人气+3；名单记入 decisions.miyazawaInvite 供后续剧情回收。 */
  miyazawaInvite(ids) {
    const st = this.st;
    const picked = (ids || [])
      .map(id => st.members.find(m => m.id === id))
      .filter(m => m && m.status === "active" && m.team === "SII");
    if (picked.length !== 5) return { text: "名单无效（需 Team SII 在籍成员五人）" };
    const names = picked.map(m => m.name);
    for (const m of picked) {
      m.bond = this.clamp(m.bond + 10, 0, 100);
      m.pop = this.clamp(m.pop + 3, 0, 100);
    }
    this.recordDecision("miyazawaInvite", names);
    this.addLog(st, st.month, "赴日名单公布：" + names.join("、") + " ——随宫泽佐江赴东京参加毕业公演。（羁绊+10 人气+3）", "main");
    this.save();
    return { text: "东京的镜头对准了她们：" + names.join("、") + "。毕业公演的合唱环节，两队人马唱的是同一首歌。（五人羁绊+10 人气+3）" };
  },

  /* 复刻路线限定：铃木玛莉亚东京毕业公演赴日名单（Team SII 五人点将，
     pickMode="sii5m" → UI.showMariaInvitePicker）。生效同 miyazawaInvite：
     五人羄绊+10 人气+3；名单记入 decisions.mariaInvite，并登记 mariaDispatch 供后续派遣事件。 */
  mariaInvite(ids) {
    const st = this.st;
    const picked = (ids || [])
      .map(id => st.members.find(m => m.id === id))
      .filter(m => m && m.status === "active" && m.team === "SII");
    if (picked.length !== 5) return { text: "名单无效（需 Team SII 在籍成员五人）" };
    const names = picked.map(m => m.name);
    for (const m of picked) {
      m.bond = this.clamp(m.bond + 10, 0, 100);
      m.pop = this.clamp(m.pop + 3, 0, 100);
    }
    this.recordDecision("mariaInvite", names);
    this.recordDecision("mariaDispatch", true);
    this.addLog(st, st.month, "赴日名单公布：" + names.join("、") + " ——随铃木玛莉亚赴东京参加毕业公演。（羄绊+10 人气+3）", "main");
    this.save();
    return { text: "东京的镜头对准了她们：" + names.join("、") + "。毕业公演的安可环节，玛莉亚把话筒递向了上海来的五个孩子。（五人羄绊+10 人气+3）" };
  },

  /* 复刻路线限定：北原里英东京毕业公演赴日名单（其效力队伍五人点将，
     pickMode="kitahara5" → UI.showKitaharaPicker）。生效同 mariaInvite：
     五人羁绊+10 人气+3、热度+3；名单记入 decisions.kitaharaSend；
     公演落幕北原里英毕业退团（2017 玛莉亚东京路线派遣的兼任成员）。 */
  kitaharaSend(ids) {
    const st = this.st;
    const kh = st.members.find(m => m.name === "北原里英" && m.status === "active");
    if (!kh) return { text: "未找到北原里英。" };
    const picked = (ids || [])
      .map(id => st.members.find(m => m.id === id))
      .filter(m => m && m.status === "active" && m.team === kh.team);
    if (picked.length !== 5) return { text: "名单无效（需 Team " + kh.team + " 在籍成员五人）" };
    const names = picked.map(m => m.name);
    for (const m of picked) {
      m.bond = this.clamp(m.bond + 10, 0, 100);
      m.pop = this.clamp(m.pop + 3, 0, 100);
    }
    st.heat = this.clamp(st.heat + 3, 0, 100);
    this.recordDecision("kitaharaSend", names);
    kh.status = "left";
    kh.note = "2018-05 AKB48毕业·兼任结束（毕业公演：东京）";
    this.addLog(st, st.month, "赴日名单公布：" + names.join("、") + " ——随北原里英赴东京参加毕业公演。（羁绊+10 人气+3；热度+3）", "main");
    this.save();
    return { text: "东京的镜头对准了她们：" + names.join("、") + "。毕业公演的安可，北原里英把话筒递向了上海来的五个孩子——兼任一年，就此谢幕。（五人羁绊+10 人气+3；热度+3；北原里英 离团。）" };
  },

  /* 【决策标签登记】剧情选项带 tag/value 时调用（UI 在选项生效时触发）。
     decisions 表是「玩家改写故事」的锚点：后续剧情与 2026 线按它分叉。
     例：jpMode（跨洋会议运营模式）、akbSplit（6月对AKS声明的回应）。
     另：命中 STORY.camp26Map 的选项会计入 2026 线「理念阵营」计数
     （st.camp26 = { tao, wang }），12月年末盘点结算 camp26Final。 */
  recordDecision(tag, value) {
    const st = this.st;
    if (!tag) return;
    st.decisions = st.decisions || {};
    st.decisions[tag] = value;
    const map = (typeof STORY !== "undefined" && STORY.camp26Map) ? STORY.camp26Map[tag] : null;
    if (map && map[value] !== undefined) {
      st.camp26 = st.camp26 || { tao: 0, wang: 0 };
      st.camp26[map[value]] += 1;
    }
    this.save();
  },

  addLog(st, month, text, tone) {
    if (!text) return;                       // 空文本（如待弹窗的中转结果）不入日志
    st.log.unshift({ month, text, tone: tone || "normal" });
    if (st.log.length > 120) st.log.pop();
  },

  /* 文本模板：{name} → 玩家名 */
  fmt(text, extra) {
    let out = text.replace(/\{name\}/g, this.st.playerName);
    if (extra) for (const k in extra) out = out.replace(new RegExp("\\{" + k + "\\}", "g"), extra[k]);
    return out;
  },

  /* ============================ 月初 ============================ */

  /* 返回需要 UI 播放的步骤（告别小剧场等），随后玩家开始行动。
     幂等：同一月份只处理一次（flags.monthStarted 记录），
     这样「月初处理后中途退出」的存档重进时不会重复入/离团。 */
  monthStart() {
    const st = this.st;
    if (st.month > 12) return [];
    if (st.flags.monthStarted === st.month) return [];
    st.flags.monthStarted = st.month;

    const steps = [];
    st.ap = 3;

    // ⓪ 旧存档追补：错过月度事件装载的唐安琪（v0.9.1 前建的档已过 3 月时不会再触发）
    //    · 2016 线 4 月起仍在籍 → 补为暂休（3月末意外烧伤）；
    //    · 2017 线 4 月起仍暂休 → 补为依约解约离团（默认祝福路线，无副作用）。
    const taq = st.members.find(x => x.name === "唐安琪");
    if (taq) {
      if (st.era === "2016" && st.month >= 4 && taq.status === "active") {
        taq.status = "rest"; taq.note = "3月末意外烧伤，专心治疗休养";
        this.addLog(st, st.month, "唐安琪 暂休（3月末意外烧伤，专心治疗休养）", "bad");
      } else if (st.era === "2017" && st.month >= 4 && taq.status === "rest") {
        taq.status = "left"; taq.note = "2017-03 因身体原因合约解除，告别舞台";
        this.addLog(st, st.month, "唐安琪 依约解约离团（康复后告别舞台）", "bad");
      }
    }

    // ⓪' 2018 线：赵嘉敏 2018-06 毕业仅限「史实官司暂休」路线（zhaoMin=rest/默认 + zhaoMin17=freeze；
    //    旧档未登记 zhaoMin17 时按史实默认）。学业线（study，2017-09 已归队）与其他在籍状态
    //    不随史实表离团——在籍至 2020-10（后续年份实装时再挂离团事件）。
    const zjm18 = st.era === "2018" ? st.members.find(x => x.name === "赵嘉敏") : null;
    if (zjm18 && st.month >= 6 && zjm18.status === "rest" && this.zjmFreezeRoute(st)) {
      zjm18.status = "left";
      zjm18.note = "2018-06 合约期满毕业，专注影视";
      this.addLog(st, st.month, "赵嘉敏 合约期满毕业——拉锯一年的官司暂休到此画上句号，她以演员的身份重新出发。", "main");
    }

    // ① 新成员入队（2016：六期生3月 / 七期生9、10月；2017：八期生4、5、6、9月；2018：九/十/十一期生+分团新期生；
    //    2026：二十四期生5月；2027：预挂载表）。2018 起支持 branchTeam 字段：分团新期生建分团预备生简卡。
    const joinSrc = st.era === "2016" ? DATA.joining2016
      : st.era === "2017" ? DATA.joining2017
      : st.era === "2018" ? DATA.joining2018
      : st.era === "2027" ? (DATA2026.joining2027 || [])
      : DATA2026.joining2026;
    for (const j of joinSrc) {
      if (j.month === st.month) {
        if (st.era === "2018" && j.branchTeam) {
          /* 【2018】分团新期生：分团预备生简卡（无人气/羁绊，分团标签页展示） */
          st.members.push({
            id: "j" + j.name, name: j.name, team: j.branchTeam, gen: j.gen,
            pop: 0, bond: 0, status: "branch", branchTeam: j.branchTeam, branchLabel: "预备生",
            note: j.note,
          });
          this.addLog(st, st.month, j.branchTeam + " 新成员入团：" + j.name + "（" + j.gen + " · 预备生）", "good");
          continue;
        }
        st.members.push({
          id: "j" + j.name, name: j.name, team: j.team, gen: j.gen,
          pop: st.era === "2016" ? this.rnd(16, 30) : st.era === "2017" ? this.rnd(10, 18) : this.rnd(8, 14),
          bond: st.era === "2016" ? 15 : st.era === "2017" ? 12 : 8, status: "active",
          /* 新人初始实力同样从低起步（内娱对比口径；2017/2027/2018 实装实力系统） */
          pwr: (st.era === "2017" || st.era === "2027" || st.era === "2018") ? this.rnd(5, 10) : undefined,
          note: j.note,
        });
        this.addLog(st, st.month, "新成员入队：" + j.name + "（" + j.team + " · " + j.gen + "）", "good");
        /* 【2017 通用】葛佳慧：招募时以音乐合作为目的，实力略高于同期新人平均（5~10） */
        if (st.era === "2017" && j.name === "葛佳慧") {
          const gj = st.members.find(x => x.name === "葛佳慧");
          if (gj) gj.pwr = this.rnd(11, 14);
        }
      }
    }

    // ② 离团/移籍生效（2016/2017/2018/2027 线；2026 线的人员退出走末位淘汰事件）
    //    移籍分团（type 以「移籍」开头）→ status='branch'；兼任（type 以「兼任」开头）→ 保留在籍仅备注
    const leaveSrc = st.era === "2026" ? []
      : st.era === "2027" ? (DATA2026.leaving2027 || [])
      : st.era === "2018" ? DATA.leaving2018
      : st.era === "2017" ? DATA.leaving2017 : DATA.leaving2016;
    for (const lv of leaveSrc) {
      if (lv.month !== st.month) continue;
      /* 人员表按「2016 年末游戏内实况」装载：已因玩家决策离团/暂休的成员自动跳过 */
      const m0 = st.members.find(x => x.name === lv.name);
      if (!m0 || m0.status === "left" || m0.status === "rest") continue;
      /* 荣誉殿堂成员不再走离团表（与 2026 杨冰怡口径一致） */
      if (m0.hall) continue;
      /* 复刻路线：与日方关系良好，铃木玛莉亚的兼任延续至明年（不退团） */
      if (lv.name === "铃木玛莉亚" && this.isReplicate(st)) {
        this.addLog(st, st.month, "AKB48方面确认：铃木玛莉亚的兼任将延续到明年。", "good");
        continue;
      }
      /* 赵嘉敏：2018-06 毕业仅限「史实官司暂休」路线（zhaoMin17=freeze，旧档默认史实）；
         学业线归队等其他在籍状态不随史实表离团（在籍至 2020-10） */
      if (lv.name === "赵嘉敏" && !this.zjmFreezeRoute(st)) continue;
      const m = m0;
      if (lv.type.indexOf("移籍") === 0) { m.status = "branch"; m.branchTeam = lv.branchTeam || "BEJ48"; }
      else if (lv.type.indexOf("兼任") === 0) { if (lv.note) m.note = lv.note; }
      else if (lv.type === "明星殿堂") { m.status = "left"; if (lv.note) m.note = lv.note; }
      else {
        m.status = lv.type === "暂休" ? "rest" : "left";
        if (lv.note) m.note = lv.note;   // 暂休/离团原因写入成员卡（如：唐安琪意外烧伤休养）
      }
      if (lv.type.indexOf("兼任") !== 0) {
        this.addLog(st, st.month, lv.name + " " + lv.type + (lv.type.indexOf("移籍") === 0 ? "——成为分团创始成员" : (lv.team ? "（" + lv.team + "）" : "")), lv.type.indexOf("移籍") === 0 ? "main" : "bad");
      } else {
        this.addLog(st, st.month, lv.name + " " + lv.type + "（保留本部在籍）", "main");
      }
      if (lv.story && !STORY.farewell.skip.includes(lv.name)) {
        steps.push({ type: "vn", title: "告别", pages: STORY.farewell.pages(lv) });
      }
    }

    // ③ 分团成立后的固定月收益提示（2016 线，5月起在结算体现，这里只提示首月）
    if (st.era === "2016" && st.branch.announce && st.month === st.branch.announceMonth + 1) {
      this.addLog(st, st.month, "分团进入稳定运营期，每月为总账带来 35 万收入。", "gold");
    }
    return steps;
  },

  /* ============================ 行动定义 ============================ */

  /* 返回本月可用行动（含可用性检查），UI 据此渲染按钮 */
  listActions() {
    const st = this.st;

    /* ============ 2026 线：行动①为「推进CGT48重建」或「安置CGT48前成员」（解散路线） ============ */
    if (st.era === "2026") {
      if (st.cgt.closed) {
        return [
          { id: "settle", main: true, name: "安置CGT48前成员", desc: (st.cgt.settled >= 3 ? "安置工作已全部完成，前成员们有了新的去处" : "第" + (st.cgt.settled + 1) + "批点将：名额 上海3 · 广州2 · 重庆2，其余协商离团 · 安置进度 " + st.cgt.settled + "/3"),
            disabled: st.cgt.settleDone },
          { id: "ge", main: true, name: "筹备总选举", desc: "打投组织、物料与拉票（7月总选前，筹备度+18）",
            disabled: st.month < 2 || st.month > 6 || st.geDone },
          { id: "rt", main: true, name: "筹备金曲大赏", desc: st.rtCancelled ? "金曲大赏已被取消" : "舞台编排与新歌打磨（12月大赏前，筹备度+20）",
            disabled: st.rtCancelled || st.month < 10 || st.month > 12 || st.rtDone },
          { id: "visit", main: true, name: "走访成员", desc: "与一名成员谈心：羁绊↑ 士气↑ 叶盛负担↓" },
          { id: "duty", name: "替叶盛值班", desc: "接手一轮成员事务：叶盛负担-15" },
          { id: "show", name: "剧场公演", desc: "稳定票仓：资金↑ 热度↑ 士气↓" },
          { id: "business", name: "商务合作", desc: "接代言与商演：资金↑↑ 热度↓ 叶盛负担↑" },
          { id: "train", name: "全团特训", desc: "提升训练度（影响公演收入与大赏评分）：花费15万" },
          { id: "promo", name: "宣传造势", desc: "投放物料与线下活动：热度+10（花费20万）" },
        ];
      }
      const cgtDesc = {
        0: "赴成都与地方公司、前CGT48成员对接，接管重启手续",
        1: "面向全集团招募重建志愿者并举办选拔（需士气≥55）",
        2: "剧场翻新与设备更换（需资金≥180万，投入160万）",
        3: "首演彩排与出道曲打磨（需训练度≥50）",
        4: "重建就绪，静待重启首演",
      };
      const canCgtStage = () => {
        if (st.cgt.stage === 1) return st.morale >= 55;
        if (st.cgt.stage === 2) return st.money >= 180;
        if (st.cgt.stage === 3) return st.train >= 50;
        return true;
      };
      return [
        { id: "cgt", main: true, name: "推进CGT48重建", desc: cgtDesc[st.cgt.stage],
          disabled: st.cgt.stage >= 4 || !canCgtStage(),
          disabledTip: st.cgt.stage === 1 ? "士气不足（需≥55），先安抚人心" :
                       st.cgt.stage === 2 ? "资金不足（需≥180万）" :
                       st.cgt.stage === 3 ? "训练度不足（需≥50），先全团特训" : "" },
        { id: "ge", main: true, name: "筹备总选举", desc: "打投组织、物料与拉票（7月总选前，筹备度+18）",
          disabled: st.month < 2 || st.month > 6 || st.geDone },
        { id: "rt", main: true, name: "筹备金曲大赏", desc: st.rtCancelled ? "金曲大赏已被取消" : "舞台编排与新歌打磨（12月大赏前，筹备度+20）",
          disabled: st.rtCancelled || st.month < 10 || st.month > 12 || st.rtDone },
        { id: "visit", main: true, name: "走访成员", desc: "与一名成员谈心：羁绊↑ 士气↑ 叶盛负担↓" },
        { id: "duty", name: "替叶盛值班", desc: "接手一轮成员事务：叶盛负担-15" },
        { id: "show", name: "剧场公演", desc: "稳定票仓：资金↑ 热度↑ 士气↓" },
        { id: "business", name: "商务合作", desc: "接代言与商演：资金↑↑ 热度↓ 叶盛负担↑" },
        { id: "train", name: "全团特训", desc: "提升训练度（影响公演收入与大赏评分）：花费15万" },
        { id: "promo", name: "宣传造势", desc: "投放物料与线下活动：热度+10（花费20万）" },
      ];
    }

    /* ============ 2017 线（本部新章）：六条主线 ============ */
    if (st.era === "2017") {
      const b17 = st.branch17;
      const canB17 = () => {
        if (b17.shy === 0 && !b17.shyOpen) return st.money >= 120;
        if (b17.ckg === 1) return st.money >= 160;
        if (b17.ckg === 2) return st.morale >= 55;
        return true;
      };
      const b17Desc = (() => {
        if (!b17.shyOpen && b17.shy === 0) return "SHY48（沈阳）剧场筹备冲刺：1月12日首演亮灯（需资金≥120万，投入100万）";
        if (b17.ckg === 0) return "CKG48（重庆）筹备启动：对接孟波筹备组，锁定剧场与首批苗子";
        if (b17.ckg === 1) return "CKG48 剧场改造（需资金≥160万，投入150万）";
        if (b17.ckg === 2) return "CKG48 首批成员招募集训（需士气≥55）";
        return "双团筹备全部就绪，静待开业亮灯";
      })();
      const acts = [
        { id: "branch17", main: true, name: "推进双团开设", desc: b17Desc,
          disabled: (b17.shyOpen || b17.shy >= 1) && b17.ckg >= 3 || !canB17(),
          disabledTip: (b17.shy === 0 && !b17.shyOpen) ? "资金不足（需≥120万）" :
                       b17.ckg === 1 ? "资金不足（需≥160万）" :
                       b17.ckg === 2 ? "士气不足（需≥55），多走访成员" : "" },
        { id: "ge", main: true, name: "筹备总选举", desc: "打投组织、物料与拉票（7月「我心翱翔」前，筹备度+18）",
          disabled: st.month < 2 || st.month > 6 || st.geDone },
        { id: "rt", main: true, name: "筹备金曲大赏", desc: "舞台编排与新歌打磨（12月大赏前，筹备度+20）",
          disabled: st.month < 10 || st.month > 12 || st.rtDone },
        { id: "orig", main: true, name: this.isReplicate(st) ? "复刻公演排练" : "原创公演制作", desc: this.isReplicate(st) ? "排练日方授权的四套新复刻公演（每套40万排练成本；主线⑥）" : "为本部四队各制作一套原创公演（每套80万，源头计划曲库支援则60万；主线⑥）",
          disabled: this.origCount(st) >= 4 || st.money < (this.isReplicate(st) ? 50 : (st.decisions.akbSplit === "original" || st.flags.originalSongsStarted ? 70 : 90)) },
        { id: "coach", main: true, name: "安排成员特训", desc: "一对一特训：目标成员实力+6 羁绊+4（耗资20万；主线③）" },
        { id: "visit", main: true, name: this.branchDutyPost(st) ? "分团巡访" : "走访成员", desc: this.branchDutyPost(st) ? "赴" + this.branchDutyPost(st) + "与成员谈心：羁绊↑ 士气↑ 叶盛负担↓" : "与一名成员谈心：羁绊↑ 士气↑ 叶盛负担↓" },
        { id: "duty", name: this.branchDutyPost(st) ? "分团事务值班" : "替叶盛值班", desc: this.branchDutyPost(st) ? "接手一轮" + this.branchDutyPost(st) + "日常事务：叶盛负担-15" : "接手一轮成员事务：叶盛负担-15" },
        { id: "show", name: "剧场公演", desc: "稳定票仓：资金↑ 热度↑ 士气↓" },
        { id: "business", name: "商务合作", desc: "接代言与商演：资金↑↑ 热度↓ 叶盛负担↑" },
        { id: "train", name: "全团特训", desc: "提升训练度（影响公演收入与大赏评分）：花费15万，全团实力+1" },
        { id: "promo", name: "宣传造势", desc: "投放物料与线下活动：热度+10（花费20万）" },
      ];
      if (st.flags.aji) {
        acts.splice(7, 0, { id: "tv", name: "卫视联动（阿吉）", desc: "阿吉的卫视资源图谱：综艺与晚会舞台（热度+8，花费15万）" });
      }
      return acts;
    }

    /* ============ 2018 线（星阵重列）：六条主线 ============ */
    if (st.era === "2018") {
      const r18 = st.reorg18;
      const kept = !!st.flags.xiiKept18;
      const reorgDesc = {
        0: "组阁方案研讨：人气/实力/队伍黏性三张表摆上桌（取消XII共三步，保留XII多一步编制确认）",
        1: "分团协调会：上调与落编移籍预案（需资金≥30万，投入30万）",
        2: kept ? "Team XII 编制确认会：张怡与 XII 的去留决议" : "筹备收官：编制名单进入终审，编制会定于 3 月末召开",
        3: "筹备收官：编制名单进入终审，编制会定于 3 月末召开",
        4: "组阁已完成——新体制运行中",
      };
      const sm18desc = {
        0: "复刻工程立项：与广州团队对接道具与控台（选定承办队伍）",
        1: "《双面偶像》复刻排练（需资金≥40万，投入40万；队伍平均实力影响效果）",
        2: "复刻首演验收",
        3: "复刻已完成",
      };
      const showDesc = {
        0: "选秀派遣点将：从全团（非殿堂）选 11 人出征" + (st.decisions.gejiahui17 === "promise" ? "（葛佳慧依约自动占一席）" : ""),
        1: "封闭集训（需资金≥30万，投入30万）",
        2: "出征录制：首轮舞台竞演",
        3: "首轮录制已完成",
      };
      return [
        { id: "reorg18", main: true, name: "推进全团组阁", desc: r18.ready ? "筹备完毕——编制会 3 月末召开（九期生入队后全员编排）" : reorgDesc[r18.stage],
          disabled: r18.done || r18.ready || (r18.stage === 1 && st.money < 30),
          disabledTip: r18.ready ? "筹备已完毕，等 3 月末编制会" : r18.stage === 1 ? "资金不足（需≥30万）" : "" },
        { id: "sm18", main: true, name: "复刻《双面偶像》", desc: sm18desc[st.sm18.stage],
          disabled: !st.decisions.shuangmian17 || st.decisions.shuangmian17 !== "plan" || st.sm18.done || (st.sm18.stage === 1 && st.money < 40),
          disabledTip: st.sm18.stage === 1 ? "资金不足（需≥40万）" : "" },
        { id: "show18", main: true, name: "推进选秀备战", desc: showDesc[st.show18.stage],
          disabled: st.show18.done || (st.show18.stage === 1 && st.money < 30),
          disabledTip: st.show18.stage === 1 ? "资金不足（需≥30万）" : "" },
        ...(st.decisions.gejiahui17 === "promise" && !st.show18.album ? [
          { id: "album18", main: true, name: "发行葛佳慧个人专辑", desc: "2017 年许下的音乐企划（需资金≥40万，投入40万）",
            disabled: st.money < 40, disabledTip: "资金不足（需≥40万）" }] : []),
        { id: "ge", main: true, name: "筹备总选举", desc: "打投组织、物料与拉票（7月「砥砺前行」前，筹备度+18）",
          disabled: st.month < 2 || st.month > 6 || st.geDone },
        { id: "rt", main: true, name: "筹备金曲大赏", desc: "舞台编排与新歌打磨（12月大赏前，筹备度+20）",
          disabled: st.month < 10 || st.month > 12 || st.rtDone },
        { id: "coach", main: true, name: "安排成员特训", desc: "一对一特训：目标成员实力+6 羁绊+4（耗资20万；主线③）" },
        { id: "visit", main: true, name: this.branchDutyPost(st) ? "分团巡访" : "走访成员", desc: this.branchDutyPost(st) ? "赴" + this.branchDutyPost(st) + "与成员谈心：羁绊↑ 士气↑ 叶盛负担↓" : "与一名成员谈心：羁绊↑ 士气↑ 叶盛负担↓" },
        { id: "duty", name: this.branchDutyPost(st) ? "分团事务值班" : "替叶盛值班", desc: this.branchDutyPost(st) ? "接手一轮" + this.branchDutyPost(st) + "日常事务：叶盛负担-15" : "接手一轮成员事务：叶盛负担-15" },
        { id: "show", name: "剧场公演", desc: "稳定票仓：资金↑ 热度↑ 士气↓" },
        { id: "business", name: "商务合作", desc: "接代言与商演：资金↑↑ 热度↓ 叶盛负担↑" },
        { id: "train", name: "全团特训", desc: "提升训练度（影响公演收入与大赏评分）：花费15万，全团实力+1" },
        { id: "promo", name: "宣传造势", desc: "投放物料与线下活动：热度+10（花费20万）" },
      ];
    }

    /* ============ 2027 线（大河新篇）：五条主线 ============ */
    if (st.era === "2027") {
      const b27 = st.branch27;
      const whDesc = {
        0: "WHN48 立项启动：对接武汉方面，敲定剧场与筹备组（王婧督办）",
        1: "武汉星梦剧院改造（需资金≥160万，投入150万）",
        2: "WHN48 首批成员招募集训（需士气≥55）",
        3: "筹备已全部就绪，静待首演亮灯",
      };
      const filmDesc = {
        0: "影视部立项会谈：与" + this.filmLeadName(st) + "敲定年度方向",
        1: "项目遴选：冲奖大制作（投入60万）或网剧快跑（投入30万）",
        2: "开机拍摄（需资金≥120万，投入100万）",
        3: "已杀青，待播出档期",
      };
      const canWH = () => {
        if (b27.stage === 1) return st.money >= 160;
        if (b27.stage === 2) return st.morale >= 55;
        return true;
      };
      const acts27 = [];
      if (st.flags.wh27Main) {
        acts27.push({ id: "wh27", main: true, name: "推进WHN48筹备", desc: whDesc[b27.stage],
          disabled: b27.stage >= 3 || !canWH(),
          disabledTip: b27.stage === 1 ? "资金不足（需≥160万）" :
                       b27.stage === 2 ? "士气不足（需≥55），多走访成员" : "" });
      }
      acts27.push(
        { id: "film", main: true, name: "推进影视部专项", desc: filmDesc[st.film.stage],
          disabled: st.film.stage >= 3 || (st.film.stage === 1 && st.money < 30) || (st.film.stage === 2 && st.money < 120),
          disabledTip: st.film.stage === 1 ? "资金不足（项目遴选至少需30万）" :
                       st.film.stage === 2 ? "资金不足（开机需≥120万）" : "" },
        { id: "ge", main: true, name: "筹备总选举", desc: "打投组织、物料与拉票（7月总选前，筹备度+18）",
          disabled: st.month < 2 || st.month > 6 || st.geDone },
        { id: "rt", main: true, name: "筹备金曲大赏", desc: st.rtCancelled ? "金曲大赏已被取消" : "舞台编排与新歌打磨（12月大赏前，筹备度+20）",
          disabled: st.rtCancelled || st.month < 10 || st.month > 12 || st.rtDone },
        { id: "coach", main: true, name: "安排成员特训", desc: "一对一特训：目标成员实力+6 羁绊+4（耗资20万；主线③）" },
        { id: "visit", main: true, name: "走访成员", desc: "与一名成员谈心：羁绊↑ 士气↑ 叶盛负担↓" },
        { id: "duty", name: "替叶盛值班", desc: "接手一轮成员事务：叶盛负担-15" },
        { id: "show", name: "剧场公演", desc: "稳定票仓：资金↑ 热度↑ 士气↓" },
        { id: "business", name: "商务合作", desc: "接代言与商演：资金↑↑ 热度↓ 叶盛负担↑" },
        { id: "train", name: "全团特训", desc: "提升训练度（影响公演收入与大赏评分）：花费15万，全团实力+1" },
        { id: "promo", name: "宣传造势", desc: "投放物料与线下活动：热度+10（花费20万）" },
      );
      return acts27;
    }

    /* ============ 2016 线（原版行动） ============ */
    const branchDesc = {
      0: "与AKB48方经纪顾问山本学确认协作框架，分团企划正式启动",
      1: "奔赴候选城市实地考察，拍板分团落脚点",
      2: "剧场租赁与改造（需资金≥220万，投入200万）",
      3: "带着热度与口碑谈冠名赞助（需热度≥50）",
      4: "分团成员招募与出道集训（需士气≥55）",
      5: "筹备已全部完成，静待官宣" ,
    };
    const canBranchStage = () => {
      if (st.branch.stage === 2) return st.money >= 220;
      if (st.branch.stage === 3) return st.heat >= 50;
      if (st.branch.stage === 4) return st.morale >= 55;
      return true;
    };
    return [
      { id: "branch", main: true, name: "推进分团筹备", desc: branchDesc[st.branch.stage],
        disabled: st.branch.stage >= 5 || !canBranchStage(),
        disabledTip: st.branch.stage === 2 ? "资金不足（需≥220万）" :
                     st.branch.stage === 3 ? "热度不足（需≥50），先宣传造势/公演" :
                     st.branch.stage === 4 ? "士气不足（需≥55），多走访成员" : "" },
      { id: "ge", main: true, name: "筹备总选举", desc: "打投组织、物料与拉票（7月总选前，筹备度+18）",
        disabled: st.month < 2 || st.month > 6 || st.geDone },
      { id: "rt", main: true, name: "筹备金曲大赏", desc: "舞台编排与新歌打磨（12月大赏前，筹备度+20）",
        disabled: st.month < 10 || st.month > 12 || st.rtDone },
      { id: "visit", main: true, name: "走访成员", desc: "与一名成员谈心：羁绊↑ 士气↑ 叶盛负担↓" },
      { id: "duty", name: "替叶盛值班", desc: "接手一轮成员事务：叶盛负担-15" },
      { id: "show", name: "剧场公演", desc: "稳定票仓：资金↑ 热度↑ 士气↓" },
      { id: "business", name: "商务合作", desc: "接代言与商演：资金↑↑ 热度↓ 叶盛负担↑" },
      { id: "train", name: "全团特训", desc: "提升训练度（影响公演收入与大赏评分）：花费15万" },
      { id: "promo", name: "宣传造势", desc: "投放物料与线下活动：热度+10（花费20万）" },
    ];
  },

  /* 执行行动（payload 供 visit 使用）。返回 {text, tone} 给 UI 提示与记日志 */
  doAction(id, payload) {
    const st = this.st;
    if (st.ap <= 0) return null;
    let res = { text: "", tone: "normal" };

    switch (id) {
      case "branch": {
        // 引擎层门控（与按钮 disabled 双保险；不满足时不消耗行动点）
        const blocked = this.branchBlockReason();
        if (blocked) return { text: "分团筹备暂无法推进：" + blocked, tone: "blocked" };
        res = this.advanceBranch();
        break;
      }
      case "cgt": {
        const cgtBlocked = this.cgtBlockReason();
        if (cgtBlocked) return { text: "CGT48重建暂无法推进：" + cgtBlocked, tone: "blocked" };
        res = this.advanceCgt();
        break;
      }
      case "settle": {
        /* 解散路线：分批安置 CGT48 前成员（三批，每批名额 上海3/广州2/重庆2）。
           首批先播放「联络各总监」剧情，随后由 UI 弹出分批点将窗；实际落地在 settleBatch() */
        if (!st.cgt.closed) return { text: "CGT48 未解散，无需安置。", tone: "blocked" };
        if (st.cgt.settleDone) return { text: "安置工作已全部完成。", tone: "blocked" };
        const batch = this.settleBatchList();
        if (!batch.length) { st.cgt.settleDone = true; return { text: "安置工作已全部完成。", tone: "blocked" }; }
        const pick = { text: "", tone: "settlePick", batchList: batch.map(m => m.id) };
        if (st.cgt.settled === 0) pick.vn = STORY.settleIntro;   // 首批：先播联络总监剧情
        return pick;                                             // 直接返回（不消耗 AP，落地在 settleBatch）
      }
      case "branch17": {
        const blocked17 = this.branch17BlockReason();
        if (blocked17) return { text: "双团开设暂无法推进：" + blocked17, tone: "blocked" };
        res = this.advanceBranch17();
        break;
      }
      case "reorg18": {
        const blockedR = this.reorg18BlockReason();
        if (blockedR) return { text: "组阁暂无法推进：" + blockedR, tone: "blocked" };
        res = this.advanceReorg18();
        break;
      }
      case "sm18": {
        /* 第一段为「选定复刻队伍」：tone=pickTeam18 转交 UI 队伍选择窗，落地在 setSm18Team() */
        const blockedS = this.sm18BlockReason();
        if (blockedS) return { text: "复刻暂无法推进：" + blockedS, tone: "blocked" };
        if (st.sm18.stage === 0) return { text: "", tone: "pickTeam18" };
        res = this.advanceSm18();
        break;
      }
      case "show18": {
        /* 第一段为「派遣点将」：tone=pickSquad18 转交 UI 点将窗，落地在 setShow18Squad() */
        if (st.show18.stage === 0) return { text: "", tone: "pickSquad18" };
        const blockedW = this.show18BlockReason();
        if (blockedW) return { text: "选秀备战暂无法推进：" + blockedW, tone: "blocked" };
        res = this.advanceShow18();
        break;
      }
      case "album18": {
        res = this.releaseAlbum18();
        break;
      }
      case "wh27": {
        /* 引擎层门控（与按钮 disabled 双保险；主线一未确立时不出现） */
        if (!st.flags.wh27Main) return { text: "WHN48 今年没有立项——先在年会上过掉这一关吧。", tone: "blocked" };
        const blockedWH = this.wh27BlockReason();
        if (blockedWH) return { text: "WHN48筹备暂无法推进：" + blockedWH, tone: "blocked" };
        res = this.advanceWH27();
        break;
      }
      case "film": {
        /* 引擎层门控（开机阶段需资金≥120万） */
        if (st.film.stage >= 3) return { text: "影视部今年的项目已经杀青，等播出吧。", tone: "blocked" };
        const blockedFilm = this.filmBlockReason();
        if (blockedFilm) return { text: "影视部专项暂无法推进：" + blockedFilm, tone: "blocked" };
        res = this.advanceFilm();
        break;
      }
      case "orig": {
        const repOrig = this.isReplicate(st);
        if (this.origCount(st) >= 4) return { text: repOrig ? "四支队伍的复刻公演都已排练完成。" : "四支队伍的原创公演都已制作完成。", tone: "blocked" };
        const discount = st.decisions.akbSplit === "original" || st.flags.originalSongsStarted;
        const cost = repOrig ? 40 : (discount ? 60 : 80);
        if (st.money < cost + 10) return { text: "资金不足（" + (repOrig ? "复刻公演排练" : "原创公演") + "需" + cost + "万）。", tone: "blocked" };
        return { text: "", tone: "origPick" };   // UI 弹队伍选择窗
      }
      case "coach": {
        const m = st.members.find(x => x.id === payload.memberId);
        if (!m || m.status !== "active") return null;
        st.money = Math.max(0, st.money - 20);
        m.pwr = Math.min(90, (m.pwr || 0) + 6);
        m.bond = this.clamp(m.bond + 4, 0, 100);
        res = { text: "你为" + m.name + "安排了一周特训：声乐、舞蹈、表情管理逐项打磨。（实力+6 羁绊+4 资金-20万）", tone: "main" };
        break;
      }
      case "tv": {
        if (!st.flags.aji) return { text: "还没有结识阿吉，卫视资源对接无从谈起。", tone: "blocked" };
        st.money = Math.max(0, st.money - 15);
        st.heat = this.clamp(st.heat + 8, 0, 100);
        st.burden = this.clamp(st.burden + 3, 0, 100);
        res = { text: "阿吉带着卫视资源图谱冲进办公室，一个综艺舞台位当天敲定。（热度+8 资金-15万 叶盛负担+3）", tone: "good" };
        break;
      }
      case "ge": {
        if (st.month < 2 || st.month > 6 || st.geDone)
          return { text: "当前不在总选举筹备期（2-6月）。", tone: "blocked" };
        st.gePlan = this.clamp(st.gePlan + 18, 0, 100);
        st.money -= 25;
        res = { text: "总选举筹备推进：打投组、物料组就位。筹备度+18，资金-25万。", tone: "main" };
        break;
      }
      case "rt": {
        if (st.month < 10 || st.month > 12 || st.rtDone)
          return { text: "当前不在金曲大赏筹备期（10-12月）。", tone: "blocked" };
        st.rtPlan = this.clamp(st.rtPlan + 20, 0, 100);
        st.money -= 25;
        res = { text: "金曲大赏筹备推进：舞台与新歌编排加练。筹备度+20，资金-25万。", tone: "main" };
        break;
      }
      case "visit": {
        const m = st.members.find(x => x.id === payload.memberId);
        if (!m || m.status !== "active") return null;
        m.bond = this.clamp(m.bond + 12, 0, 100);
        st.morale = this.clamp(st.morale + 3, 0, 100);
        st.burden = this.clamp(st.burden - 8, 0, 100);
        const lines = [
          "你在排练间隙和{name}聊了很久，从舞蹈细节聊到家常。",
          "你去看了一眼{name}的公演，散场后在后台递上了一瓶水。",
          "你把{name}拉进茶水间，听她把最近的委屈倒了个干净。",
        ];
        res = { text: lines[this.rnd(0, lines.length - 1)].replace("{name}", m.name) + "（羁绊+12 士气+3 负担-8）", tone: "main" };
        /* 首次走访：播放该成员的小剧场（模板通用，避免对真实成员作性格演绎） */
        if (!m.visited) {
          m.visited = true;
          const tpl = STORY.visitScenes[m.name.split("").reduce((s, c) => s + c.charCodeAt(0), 0) % STORY.visitScenes.length];
          const sub = t => t.replace(/\{name\}/g, m.name);
          res.vn = { label: sub("与{name}的一次谈话"), pages: tpl.map(p => ({ ...p, t: sub(p.t) })) };
        }
        break;
      }
      case "duty": {
        st.burden = this.clamp(st.burden - 15, 0, 100);
        res = { text: "你把今天所有成员事务的签字权抢了过来，叶盛难得准点下了班。（负担-15）", tone: "normal" };
        break;
      }
      case "show": {
        const income = Math.round(45 + st.heat * 0.3 + st.train * 0.5);
        st.money += income;
        st.heat = this.clamp(st.heat + 4, 0, 100);
        st.morale = this.clamp(st.morale - 4, 0, 100);
        res = { text: "剧场公演满座，票房 +"+income+" 万，应援声浪持续到深夜。（热度+4 士气-4）", tone: "good" };
        break;
      }
      case "business": {
        const gain = Math.round(60 + st.heat * 0.8);
        st.money += gain;
        st.heat = this.clamp(st.heat - 2, 0, 100);
        st.burden = this.clamp(st.burden + 5, 0, 100);
        res = { text: "商务合作签约落定，进账 " + gain + " 万。（热度-2 叶盛负担+5）", tone: "good" };
        break;
      }
      case "train": {
        st.money -= 15;
        st.train = this.clamp(st.train + 12, 0, 100);
        st.morale = this.clamp(st.morale - 2, 0, 100);
        let trainTail = "";
        if (st.era === "2017" || st.era === "2027") { this.gainAllPwr(st, 1); trainTail = " 全团实力+1（多次训练的累积终会显现）。"; }
        res = { text: "全团特训一天，整齐度提升明显。（训练度+12 资金-15 士气-2）" + trainTail, tone: "normal" };
        break;
      }
      case "promo": {
        st.money -= 20;
        st.heat = this.clamp(st.heat + 10, 0, 100);
        if (st.flags.freePromo) { st.money += 20; delete st.flags.freePromo; res.text += "（造势派启动资金抵扣了本次预算！）"; }
        res = { text: "宣传物料铺满三城地铁，话题度上涨。（热度+10 资金-20）" + (res.text || ""), tone: "normal" };
        break;
      }
    }

    st.ap -= 1;
    this.addLog(st, st.month, res.text, res.tone);
    this.save();
    return res;
  },

  /* 分团当前阶段的门控检查：返回null=可推进，否则返回原因文本 */
  branchBlockReason() {
    const st = this.st, s = st.branch.stage;
    if (s === 2 && st.money < 220) return "资金不足（需≥220万）";
    if (s === 3 && st.heat < 50) return "热度不足（需≥50）";
    if (s === 4 && st.morale < 55) return "士气不足（需≥55）";
    return null;
  },

  /* CGT48 重建阶段门控（2026 线） */
  cgtBlockReason() {
    const st = this.st, s = st.cgt.stage;
    if (s === 1 && st.morale < 55) return "士气不足（需≥55）";
    if (s === 2 && st.money < 180) return "资金不足（需≥180万）";
    if (s === 3 && st.train < 50) return "训练度不足（需≥50）";
    return null;
  },

  /* CGT48 重建推进（2026 线，阶段场景见 STORY.scenesCgt） */
  /* 【解散路线】待安置批次名单：尚未处理的 CGT48 成员，每批最多 13 人（37人 = 13+12+12） */
  settleBatchList() {
    const st = this.st;
    return st.members.filter(m => m.team === "CGT48" && m.status === "branch").slice(0, 13);
  },

  /* 【解散路线】落地一批安置：dest = { sh:[3], gz:[2], cq:[2] }（成员 id）。
     上海→本部预备生（PREP）；广州/重庆→对应分团预备生；未分配者自动离团（备注「解散安置」）。
     消耗 1 点行动点；三批全部完成后 settleDone=true。 */
  settleBatch(dest) {
    const st = this.st;
    if (!st.cgt.closed || st.cgt.settleDone) return { text: "当前没有需要安置的批次。", tone: "blocked" };
    const batch = this.settleBatchList();
    const pick = list => (list || []).map(id => batch.find(m => m.id === id)).filter(Boolean);
    const sh = pick(dest && dest.sh), gz = pick(dest && dest.gz), cq = pick(dest && dest.cq);
    if (sh.length !== 3 || gz.length !== 2 || cq.length !== 2)
      return { text: "名额不符：本批须分配 上海 3 人、广州 2 人、重庆 2 人。" };
    const all = sh.concat(gz, cq);
    if (new Set(all.map(m => m.id)).size !== 7) return { text: "有成员被重复分配，请检查名单。" };
    /* 上海：转入本部预备生 */
    for (const m of sh) {
      m.status = "active"; m.team = "PREP"; m.branchTeam = null; m.branchLabel = "";
      m.gen = "CGT48移籍"; if (!m.pop || m.pop < 10) m.pop = 10; if (!m.bond) m.bond = 12;
    }
    /* 广州 / 重庆：转入分团预备生（简卡；team 同步改为分团，避免下批名单重复捞回） */
    for (const m of gz) { m.team = "GNZ48"; m.branchTeam = "GNZ48"; m.branchLabel = "预备生"; }
    for (const m of cq) { m.team = "CKG48"; m.branchTeam = "CKG48"; m.branchLabel = "预备生"; }
    /* 其余：解约离团 */
    const placedIds = new Set(all.map(m => m.id));
    const leftNames = batch.filter(m => !placedIds.has(m.id)).map(m => { m.status = "left"; m.note = "解散安置"; return m.name; });
    st.cgt.settled += 1;
    st.ap = Math.max(0, st.ap - 1);
    st.money = Math.max(0, st.money - 10);
    st.morale = this.clamp(st.morale + 2, 0, 100);
    st.burden = this.clamp(st.burden + 4, 0, 100);
    let text = "第" + st.cgt.settled + "批安置完成——上海·预备生：" + sh.map(m => m.name).join("、") +
      "；广州·预备生：" + gz.map(m => m.name).join("、") +
      "；重庆·预备生：" + cq.map(m => m.name).join("、") +
      "；其余 " + leftNames.length + " 人协商解约离团（解散安置）。";
    if (st.cgt.settled >= 3) {
      st.cgt.settleDone = true;
      st.heat = this.clamp(st.heat + 4, 0, 100);
      st.morale = this.clamp(st.morale + 2, 0, 100);
      text = "第三批安置完成。三批三十七人——二十一人换上了新队服，十六人带着安置补偿体面转身。粉丝圈罕见地夸了一次运营：「有始有终。」\n\n（安置全部完成：资金-10 士气+4 热度+4 叶盛负担+4）";
    } else {
      text += "\n\n（安置进度 " + st.cgt.settled + "/3 资金-10 士气+2 叶盛负担+4）";
    }
    this.addLog(st, st.month, text, "main");
    this.save();
    return { text: text, tone: "main" };
  },

  /* 二十三期预备生升格（2026 年 2 月）：assign = { [memberId]: "SII"|"NII"|"HII"|"X" }。
     池内为二十三期 16 人 + 22 期应籽言（排除 CGT48 移籍预备生——她们走 5 月联动升格）。
     升格后预备生池只剩尚未入队的后期预备生（5 月二十四期再补入）。 */
  promoteTeams23(assign) {
    const st = this.st;
    const targets = st.members.filter(m => m.team === "PREP" && m.status === "active" && m.gen !== "CGT48移籍");
    if (!targets.length) return { text: "当前没有待升格的预备生。", tone: "blocked" };
    const TEAM = ["SII", "NII", "HII", "X"];
    for (const m of targets) {
      const t = assign ? assign[m.id] : null;
      if (!t || TEAM.indexOf(t) < 0) return { text: "还有成员未分配队伍（SII / NII / HII / X）。" };
    }
    const by = { SII: [], NII: [], HII: [], X: [] };
    for (const m of targets) {
      m.team = assign[m.id];
      m.pop = this.clamp(m.pop + 3, 0, 100);
      m.bond = this.clamp(m.bond + 3, 0, 100);
      by[m.team].push(m.name);
    }
    st.flags.p23Promoted = true;
    const text = "二十三期升格名单公布——Team SII：" + by.SII.join("、") + "；Team NII：" + by.NII.join("、") +
      "；Team HII：" + by.HII.join("、") + "；Team X：" + by.X.join("、") +
      "（22 期应籽言一并转正）。预备生池清零——五月，又会有新的一页。（人气+3 羁绊+3）";
    this.addLog(st, st.month, text, "main");
    this.save();
    return { text: text, tone: "main" };
  },

  /* 【解散路线】CGT48 移籍预备生升格：assign = { [memberId]: "SII"|"NII"|"HII"|"X" }。
     升格后转入对应正式队伍，人气+4 羁绊+4；gen 改为「CGT48移籍·升格」（升格事件不再触发）。 */
  promoteCgt(assign) {
    const st = this.st;
    const targets = st.members.filter(m => m.gen === "CGT48移籍" && m.team === "PREP" && m.status === "active");
    if (!targets.length) return { text: "当前没有待升格的移籍预备生。", tone: "blocked" };
    const TEAM = ["SII", "NII", "HII", "X"];
    for (const m of targets) {
      const t = assign ? assign[m.id] : null;
      if (!t || TEAM.indexOf(t) < 0) return { text: "还有成员未分配队伍（SII / NII / HII / X）。" };
    }
    const by = { SII: [], NII: [], HII: [], X: [] };
    for (const m of targets) {
      m.team = assign[m.id];
      m.gen = "CGT48移籍·升格";
      m.pop = this.clamp(m.pop + 4, 0, 100);
      m.bond = this.clamp(m.bond + 4, 0, 100);
      by[m.team].push(m.name);
    }
    st.flags.cgtPromoted = true;
    const text = "升格名单公布——Team SII：" + by.SII.join("、") + "；Team NII：" + by.NII.join("、") +
      "；Team HII：" + by.HII.join("、") + "；Team X：" + by.X.join("、") +
      "。从今天起，她们的介绍里不再有「前CGT48」三个字。（人气+4 羁绊+4）";
    this.addLog(st, st.month, text, "main");
    this.save();
    return { text: text, tone: "main" };
  },

  advanceCgt() {
    const st = this.st;
    const s = st.cgt.stage;
    if (s === 0) {
      st.cgt.stage = 1;
      return { text: "与成都方面完成对接：剧场资产移交协议草签，前CGT48成员的联络网交到你手上。", tone: "main", vn: STORY.scenesCgt.connect };
    }
    if (s === 1) {
      st.cgt.stage = 2;
      return { text: "重建志愿者选拔落幕：一批不甘心的姑娘拿到了新河的入场券。", tone: "main", vn: STORY.scenesCgt.audition };
    }
    if (s === 2) {
      st.money -= 160; st.cgt.stage = 3;
      return { text: "成都剧场翻新开工：舞台、灯光、地板全部更换。（资金-160万）", tone: "main", vn: STORY.scenesCgt.theater };
    }
    if (s === 3) {
      st.cgt.stage = 4;
      return { text: "首演彩排开始，出道曲敲定——CGT48 重启进入倒计时！", tone: "main", vn: STORY.scenesCgt.rehearsal };
    }
    return { text: "", tone: "none" };
  },

  /* 分团主线推进（stage1 选址走 pickCity）。
     每阶段返回 {text, tone, vn?}：vn 为该阶段的专属剧情场景，
     UI 先播放场景（含选项），结束后再提示结算文本/弹选址框。 */
  advanceBranch() {
    const st = this.st;
    const s = st.branch.stage;
    if (s === 0) {
      st.branch.stage = 1;
      /* 伏笔：王子杰在会议后单独留下总监谈「原创曲库」（2026 线回收） */
      st.flags.originalSongs = true;
      return { text: "与山本学完成首轮跨洋会谈：日方共享名古屋/大阪的筹备手册，选址考察排上下周。", tone: "main", vn: STORY.actionScenes.branchMeet };
    }
    if (s === 1) return { text: "", tone: "pickCity", vn: STORY.actionScenes.branchScout };   // UI 播完场景后弹城市选择
    if (s === 2) {
      st.money -= 200; st.branch.stage = 3;
      return { text: "剧场租约签订，改造队进场：灯光、音响、应援色墙一应俱全。（资金-200万）", tone: "main", vn: STORY.actionScenes.branchTheater };
    }
    if (s === 3) {
      st.branch.stage = 4; st.money += 40;
      return { text: "冠名与首批赞助敲定，招商款 40 万入账——热度换来真金白银。", tone: "main", vn: STORY.actionScenes.branchBiz };
    }
    if (s === 4) {
      st.branch.stage = 5;
      return { text: "分团首批成员名单敲定，出道集训开营。筹备全部完成，只待官宣！", tone: "main", vn: STORY.actionScenes.branchRecruit };
    }
    return { text: "", tone: "none" };
  },

  /* 双团开设（SHY48/CKG48）阶段门控（2017 线） */
  branch17BlockReason() {
    const st = this.st, b = st.branch17;
    if (!b.shyOpen && b.shy === 0 && st.money < 120) return "资金不足（SHY48 剧场需≥120万）";
    if (b.ckg === 1 && st.money < 160) return "资金不足（CKG48 剧场需≥160万）";
    if (b.ckg === 2 && st.morale < 55) return "士气不足（需≥55）";
    return null;
  },

  /* 双团开设推进（2017 线：先沈阳后重庆；阶段场景见 STORY.scenes17） */
  advanceBranch17() {
    const st = this.st, b = st.branch17;
    if (!b.shyOpen && b.shy === 0) {
      st.money -= 100; b.shy = 1;
      return { text: "SHY48 剧场改造全面展开，一期生集训进入冲刺。（资金-100万）", tone: "main", vn: STORY.scenes17.shyPrep };
    }
    if (b.ckg === 0) {
      b.ckg = 1;
      return { text: "重庆筹备组进驻解放碑：CKG48 立项启动，剧场选址与首批苗子锁定。", tone: "main", vn: STORY.scenes17.ckgStart };
    }
    if (b.ckg === 1) {
      st.money -= 150; b.ckg = 2;
      return { text: "重庆星梦剧院改造开工：山城的坡道上，第二座支流动工了。（资金-150万）", tone: "main", vn: STORY.scenes17.ckgTheater };
    }
    if (b.ckg === 2) {
      b.ckg = 3;
      return { text: "CKG48 首批三十三人集训开营——十月末，重庆见。", tone: "main", vn: STORY.scenes17.ckgRecruit };
    }
    return { text: "", tone: "none" };
  },

  /* 行动剧情中的选项落地：追加日志并存档（由 UI 在选项生效后调用） */
  logChoice(text) {
    this.addLog(this.st, this.st.month, text, "main");
    this.save();
  },

  /* 选址决定（UI 从 STORY.branchCities 渲染选项后回调） */
  pickCity(cityId) {
    const st = this.st;
    const c = STORY.branchCities.find(x => x.id === cityId);
    if (!c || st.branch.stage !== 1) return null;
    st.branch.city = c.name;
    st.money += c.cost + c.moneyBonus;
    st.heat = this.clamp(st.heat + c.heatBonus, 0, 100);
    st.branch.stage = 2;
    this.addLog(st, st.month, "分团选址定在「" + c.name + "」。" + c.desc, "main");
    this.save();
    return { text: "选址拍板：「" + c.name + "」！考察组连夜返沪汇报。（资金" + (c.cost + c.moneyBonus >= 0 ? "+" : "") + (c.cost + c.moneyBonus) + "万 热度" + (c.heatBonus >= 0 ? "+" : "") + c.heatBonus + "）", tone: "main" };
  },

  /* ============================ 月末结算 ============================ */

  /* 汇总本月收支（供结算表展示） */
  settle(st) {
    if (st.era === "2026") {
      const income = Math.round(40 + st.heat * 0.5 + st.train * 0.25 + (st.cgt.open ? 25 : 0));
      const expense = 52;
      return { income, expense, net: income - expense };
    }
    if (st.era === "2027") {
      /* 2027：回暖之年（收入基数回到 45）；成都（2026 重建成功）与WHN48 开业后各贡献月收入 */
      const income = Math.round(45 + st.heat * 0.5 + st.train * 0.25
        + (st.cgt && st.cgt.open ? 25 : 0) + (st.branch27 && st.branch27.open ? 25 : 0));
      const expense = 56;
      return { income, expense, net: income - expense };
    }
    if (st.era === "2017") {
      /* 2017：本部规模更大（支出60），SHY48/CKG48 开业后各自贡献月收入 */
      const income = Math.round(45 + st.heat * 0.5 + st.train * 0.25
        + (st.branch17.shyOpen ? 20 : 0) + (st.branch17.ckgOpen ? 25 : 0));
      const expense = 60;
      return { income, expense, net: income - expense };
    }
    if (st.era === "2018") {
      /* 2018：组阁年（全团资源重新排布，收入基数回到 48）；SHY48/CKG48 延续月收入 */
      const income = Math.round(48 + st.heat * 0.5 + st.train * 0.25
        + (st.branch17 && st.branch17.shyOpen ? 20 : 0) + (st.branch17 && st.branch17.ckgOpen ? 25 : 0));
      const expense = 62;
      return { income, expense, net: income - expense };
    }
    const income = Math.round(45 + st.heat * 0.5 + st.train * 0.25 + (st.branch.announce ? 35 : 0));
    const expense = 55;
    return { income, expense, net: income - expense };
  },

  /* 月末主流程：产出 UI 步骤队列（结算表→事件→大事件结果→…→结局） */
  endMonth() {
    const st = this.st;
    const steps = [];

    /* ① 收支结算 */
    const s = this.settle(st);
    st.money += s.net;
    steps.push({
      type: "settle", income: s.income, expense: s.expense, net: s.net,
      money: st.money,
    });

    /* ② 赤字检查 */
    if (st.money < 0) {
      st.money = 0;
      st.debt += 1;
      st.morale = this.clamp(st.morale - 10, 0, 100);
      this.addLog(st, st.month, "本月出现赤字，董事会震怒！（士气-10）", "bad");
      if (st.debt >= 2) {
        steps.push({ type: "ending", grade: "bankrupt" });
        return steps;   // 直接终局
      }
      steps.push({ type: "vn", title: STORY.debtWarning.title, pages: STORY.debtWarning.pages });
    }

    /* ③ 叶盛负担与士气检定 */
    st.burden = this.clamp(st.burden + 6, 0, 100);
    if (st.burden >= 80) {
      st.morale = this.clamp(st.morale - 6, 0, 100);
      steps.push({ type: "vn", title: "事务积压", pages: [
        { nar: true, t: "叶盛的桌上的待办堆积成山——有成员的投诉被拖了一周才回，排练室的怨气藏不住了。（负担≥80：士气-6）\n\n叶盛揉着太阳穴对你说了四个字：「救救孩子，也救救我。」" },
      ]});
    } else if (st.burden <= 25) {
      st.morale = this.clamp(st.morale + 2, 0, 100);
    }
    if (st.morale < 40) this.addLog(st, st.month, "全团士气低迷，成员的笑变少了……", "bad");

    /* ④ 官宣判定（2016 线：4月起，筹备完成即官宣；4月官宣有加成） */
    if (st.era === "2016" && !st.branch.announce && st.branch.stage >= 5 && st.month >= 4) {
      st.branch.announce = true;
      st.branch.announceMonth = st.month;
      const onTime = st.month === 4;
      st.money += onTime ? 120 : 100;
      st.heat = this.clamp(st.heat + (onTime ? 12 : 8), 0, 100);
      this.addLog(st, st.month, "分团正式官宣成立" + (st.branch.city ? "（" + st.branch.city + "）" : "") + "！" + (onTime ? "赶上4·20节点，热度大增。" : ""), "main");
      if (!onTime) steps.push({ type: "vn", title: "补办官宣", pages: [
        { nar: true, t: st.month + "月，分团终于官宣成立——比原计划晚了些，但两座星梦剧院的灯，到底还是亮起来了。（资金+100万 热度+8）" },
      ]});
      // 移籍生效：21 名五期生转入分团（status='branch'，成员页单独标签页展示）
      const movers = DATA.branchMovers.BEJ.concat(DATA.branchMovers.GNZ);
      for (const name of movers) {
        const m = st.members.find(x => x.name === name);
        if (m) { m.status = "branch"; m.branchTeam = DATA.branchMovers.BEJ.includes(name) ? "BEJ48" : "GNZ48"; }
      }
      this.addLog(st, st.month, movers.length + " 名成员移籍分团（BEJ48/GNZ48），成为分团创始成员。", "main");
      /* 选址为沈阳/重庆时：官宣后追加「第二座支流」宣布事件（2017 分团线伏笔，
         并登记 st.decisions.nextBranch 供后续剧情回收）。
         配对关系：沈阳=SHY48，重庆=CKG48（2026-09-18 用户修正：直接配对，不交叉） */
      if (st.branch.city === "沈阳" || st.branch.city === "重庆") {
        const nextTeam = st.branch.city === "沈阳" ? "SHY48" : "CKG48";
        this.recordDecision("nextBranch", nextTeam);
        steps.push({ type: "vn", title: "第二座支流 · " + nextTeam + "（2017）",
          pages: STORY.branchNextAnnounce[st.branch.city](st).map(p => ({ ...p, t: this.fmt(p.t) })) });
      }
    }

    /* ④·四 2017 线：双团开业判定（SHY48 就绪即开；CKG48 按史实节奏 10 月末开） */
    if (st.era === "2017") {
      const b17 = st.branch17;
      if (!b17.shyOpen && b17.shy >= 1) {
        b17.shyOpen = true;
        b17.shyOpenMonth = st.month;
        st.money += 50;
        st.heat = this.clamp(st.heat + 6, 0, 100);
        this.addLog(st, st.month, "SHY48 沈阳星梦剧院开业首演落幕！此后每月为总账带来 20 万收入。", "main");
        steps.push({ type: "vn", title: "SHY48 · 开业首演", pages: STORY.openShy(st).map(p => ({ ...p, t: this.fmt(p.t) })) });
        this.deployBranch(st, "SHY48");
      }
      if (!b17.ckgOpen && b17.ckg >= 3 && st.month >= 10) {
        b17.ckgOpen = true;
        b17.ckgOpenMonth = st.month;
        st.money += 60;
        st.heat = this.clamp(st.heat + 8, 0, 100);
        this.addLog(st, st.month, "CKG48 重庆星梦剧院开业首演落幕！此后每月为总账带来 25 万收入。", "main");
        steps.push({ type: "vn", title: "CKG48 · 开业首演", pages: STORY.openCkg(st).map(p => ({ ...p, t: this.fmt(p.t) })) });
        this.deployBranch(st, "CKG48");
      } else if (!b17.ckgOpen && b17.ckg >= 3 && st.month === 9 && !st.flags.ckgReadyLogged) {
        st.flags.ckgReadyLogged = true;
        this.addLog(st, st.month, "CKG48 筹备全部就绪——按史实节奏，开业首演安排在 10 月末。", "normal");
      }
    }

    /* ④·五 CGT48 重启首演判定（2026 线：重建完成后当月月末举行首演） */
    if (st.era === "2026" && !st.cgt.open && st.cgt.stage >= 4) {
      st.cgt.open = true;
      st.cgt.openMonth = st.month;
      st.money += 80;
      st.heat = this.clamp(st.heat + 10, 0, 100);
      this.addLog(st, st.month, "CGT48 重启首演落幕！成都的灯重新亮起，此后每月为总账带来 25 万收入。", "main");
      steps.push({ type: "vn", title: "CGT48 重启首演", pages: STORY.scenesCgt.debut(st).map(p => ({ ...p, t: this.fmt(p.t) })) });
    }

    /* ④·六 金曲大赏取消判定（2026/2027 线：9月末盘点，营业不佳则陶莺取消大赏） */
    if ((st.era === "2026" || st.era === "2027") && st.month === 9 && !st.rtCancelled && (st.money < 80 || st.heat < 30)) {
      st.rtCancelled = true;
      st.rtDone = true;   // 主线①的大赏部分按已了结处理（以取消收场）
      this.addLog(st, st.month, "陶莺宣布：因营业状况不佳，本年度金曲大赏取消。", "bad");
      const cancelNar = st.era === "2027" ? STORY.rtCancelEvent27(st) : STORY.rtCancelEvent(st);
      steps.push({ type: "vn", title: "金曲大赏 · 取消", pages: cancelNar.map(p => ({ ...p, t: this.fmt(p.t) })) });
    }

    /* ④·七 WHN48（武汉）首演亮灯判定（2027 线：筹备就绪后当月月末开业，王婧派主线一） */
    if (st.era === "2027" && st.flags.wh27Main && !st.branch27.open && st.branch27.stage >= 3) {
      st.branch27.open = true;
      st.branch27.openMonth = st.month;
      st.money += 60;
      st.heat = this.clamp(st.heat + 8, 0, 100);
      this.addLog(st, st.month, "WHN48 首演亮灯落幕！长江边的第五座支流剧院，此后每月为总账带来 25 万收入。", "main");
      steps.push({ type: "vn", title: "WHN48 · 首演亮灯", pages: STORY.scenes27.whOpen(st).map(p => ({ ...p, t: this.fmt(p.t) })) });
      this.deployWH(st);
    }

    /* ④·八 影视部项目播出判定（2027 线：杀青后当月月末首播） */
    if (st.era === "2027" && !st.film.done && st.film.stage >= 3) {
      st.film.done = true;
      st.film.doneMonth = st.month;
      st.money += 80;
      st.heat = this.clamp(st.heat + 12, 0, 100);
      st.morale = this.clamp(st.morale + 3, 0, 100);
      this.addLog(st, st.month, "影视部年度项目开播！平台版权收入 80 万入账，热度大涨。", "main");
      steps.push({ type: "vn", title: "影视部 · 开播之夜", pages: STORY.scenes27.filmAir(st).map(p => ({ ...p, t: this.fmt(p.t) })) });
    }

    /* ⑤ 月度脚本事件或随机事件（按 era 取源）。
       月度事件以 chain 惰性下发：UI 播放每个事件前才评估 gate——
       这样同一月末里「前置事件的选择」可以解锁后续事件
       （如 5月：下一站选 SHY48/CKG48 → 解锁开拓者点将）。 */
    const monthlySrc = st.era === "2027" ? STORY.monthly27
      : st.era === "2026" ? STORY.monthly26 : st.era === "2018" ? STORY.monthly18
      : st.era === "2017" ? STORY.monthly17 : STORY.monthly;
    let randomSrc;
    if (st.era === "2027") randomSrc = STORY.randomPool26.concat(STORY.randomPool27 || []);
    else if (st.era === "2026") randomSrc = STORY.randomPool26;
    else if (st.era === "2018") randomSrc = STORY.randomPool.concat(STORY.randomPool18 || []);
    else if (st.era === "2017") randomSrc = STORY.randomPool.concat(STORY.randomPool17 || []);
    else randomSrc = STORY.randomPool;
    const monthlies = monthlySrc[st.month] || [];
    if (monthlies.length) {
      steps.push({ type: "chain", events: monthlies });
    } else if (Math.random() < 0.6) {
      const pool = randomSrc.filter(ev => !ev.gate || ev.gate(st));   // 随机事件也可声明 gate（如分家后日方事件退场）
      const ev = pool[this.rnd(0, pool.length - 1)];
      if (ev) steps.push(this.buildEventStep(ev, st));
    }

    /* ⑥ 七月：总选举结算 */
    if (st.month === 7 && !st.geDone) {
      steps.push(this.resolveGE(st));
      /* 【荣誉殿堂】2026 线：杨冰怡连霸总选第一 → 依规则升堂，转入影视部 */
      if (st.era === "2026" && st.geResult && st.geResult.top1 === "杨冰怡" && !st.flags.bingyiHall) {
        st.flags.bingyiHall = true;
        const by = st.members.find(m => m.name === "杨冰怡");
        if (by) {
          by.hall = true; by.team = "HALL"; by.note = "连续两届总决选第一名 · 升入荣誉殿堂";
        }
        st.morale = this.clamp(st.morale + 3, 0, 100);
        st.heat = this.clamp(st.heat + 3, 0, 100);
        steps.push({ type: "vn", title: "荣誉殿堂 · 升堂仪式", pages: STORY.hallAscension(st).map(p => ({ ...p, t: this.fmt(p.t) })) });
      }
      /* 【荣誉殿堂】2017 线：鞠婧祎连霸总选第一 → 触发开设升堂制度事件并升堂；
         未夺冠则次月（8月）宣布设立制度（m8_17_hall_announce），鞠婧祎保持在籍、不升堂。 */
      if (st.era === "2017" && st.geResult && !st.flags.hall17) {
        st.flags.hall17 = true;
        const jjy17 = st.members.find(m => m.name === "鞠婧祎");
        if (st.geResult.top1 === "鞠婧祎" && jjy17 && jjy17.status !== "left") {
          st.flags.jjyHall17 = true;
          jjy17.hall = true; jjy17.team = "HALL"; jjy17.branchTeam = null; jjy17.status = "active";
          jjy17.note = "第四届总决选第一名 · 首位升入荣誉殿堂";
          st.morale = this.clamp(st.morale + 3, 0, 100);
          st.heat = this.clamp(st.heat + 3, 0, 100);
          steps.push({ type: "vn", title: "荣誉殿堂 · 开堂与首位升堂", pages: STORY.hallAscend17(st).map(p => ({ ...p, t: this.fmt(p.t) })) });
        }
      }
      /* 【荣誉殿堂】2018 线（主线③）：总选第一名若为 2017 年第一（连霸）→ 当场升堂；
         制度已设（2017），连霸是升堂的硬条件——非连霸不升堂、保持在籍。 */
      if (st.era === "2018" && st.geResult && !st.flags.hall18) {
        st.flags.hall18 = true;
        const top1 = st.members.find(m => m.name === st.geResult.top1);
        if (st.geResult.top1 && st.geResult.top1 === st.history.ge2017Top1 && top1 && top1.status !== "left" && !top1.hall) {
          st.flags.reignHall18 = true;
          top1.hall = true; top1.team = "HALL"; top1.branchTeam = null; top1.status = "active";
          top1.note = "第四届、第五届总决选连霸 · 升入荣誉殿堂";
          st.morale = this.clamp(st.morale + 3, 0, 100);
          st.heat = this.clamp(st.heat + 3, 0, 100);
          steps.push({ type: "vn", title: "荣誉殿堂 · 连霸升堂", pages: STORY.hallAscend18(st).map(p => ({ ...p, t: this.fmt(p.t) })) });
        }
      }
    }

    /* ⑦ 十二月：金曲大赏结算（2026/2027 线若被取消则改为年末总结会）+ 年度结局 */
    if (st.month === 12) {
      if ((st.era === "2026" || st.era === "2027") && st.rtCancelled) {
        const closeNar = st.era === "2027" ? STORY.rtCancelledClose27(st) : STORY.rtCancelledClose(st);
        steps.push({ type: "vn", title: "年末总结会", pages: closeNar.map(p => ({ ...p, t: this.fmt(p.t) })) });
      } else {
        steps.push(this.resolveRT(st));
      }
      steps.push({ type: "ending", grade: this.computeGrade(st) });
      return steps;   // 一年终局，不再 advance
    }
    return steps;
  },

  /* 把事件对象转成 UI 可播放的 step（pages 支持函数；文本做 {name} 替换） */
  buildEventStep(ev, st) {
    /* 随机事件池的简卡格式（{title, text, choices}）也兼容：无 pages 时把 text 包成单页旁白
       （v0.10 修复：此前随机事件一旦命中会因 pages 为 undefined 而报错——历代月度表
         恰好覆盖了全部月份，所以从未触发过这个潜伏 bug） */
    const pages = typeof ev.pages === "function" ? ev.pages(st) : (ev.pages || [{ nar: true, t: ev.text || "" }]);
    return {
      type: "vn", title: ev.title,
      pages: pages.map(p => ({ ...p, t: this.fmt(p.t) })),
      after: (ev.after || []).map(p => ({ ...p, t: this.fmt(p.t) })),   // 选项结算后追加的公共剧情
      choices: ev.choices ? ev.choices.map(c => ({
        label: c.label, hint: c.hint || "",
        gate: c.gate ? c.gate(st) : true,
        tag: c.tag, value: c.value,          // 决策标签透传给 UI
        pickMode: c.pickMode,                // 特殊交互模式（如 sii5：Team SII 五人选将）
        run: () => { if (c.tag) this.recordDecision(c.tag, c.value !== undefined ? c.value : c.tag); return c.effect(this.st); },
      })) : null,
    };
  },

  /* 总选举结算：生成排名 + 叙事 + 奖励 */
  resolveGE(st) {
    st.geDone = true;
    // 策略效果
    if (st.geStrategy === "focus") {
      const top = this.activeMembers(st).filter(m => m.team !== "HALL").sort((a, b) => b.pop - a.pop)[0];
      if (top) { top.geBoost = 25; st.morale = this.clamp(st.morale - 6, 0, 100); }
    } else if (st.geStrategy === "balance") {
      for (const m of this.activeMembers(st)) if (m.bond >= 40) m.geBoost = (m.geBoost || 0) + 6;
      st.morale = this.clamp(st.morale + 8, 0, 100);
    }
    // 计分排名：SNH48 在籍成员 + 分团成员（2016 官宣后参选；2017 含全部分团；2027 含WHN48 开业后成员）。
    // 2017/2018/2027 线新增：实力（pwr）为第二大影响因子（人气第一）；赵嘉敏不参选；HALL 不参选
    const pwrW = (st.era === "2017" || st.era === "2018" || st.era === "2027") ? 1.1 : 0;    // 实力权重（占比第二）
    const bondW = (st.era === "2017" || st.era === "2018" || st.era === "2027") ? 0.6 : 0.8;
    const extraPool = st.era === "2027"
      ? (st.branch27 && st.branch27.open ? st.members.filter(m => m.status === "branch" && m.branchTeam === "WHN48") : [])
      : (st.branch.announce ? st.members.filter(m => m.status === "branch") : []);
    const pool = this.activeMembers(st).concat(extraPool)
      .filter(m => m.name !== "赵嘉敏" && m.team !== "HALL");   // 荣誉殿堂/影视部成员不参选
    const ranked = pool
      .map(m => ({ m, score: m.pop * 1.5 + (m.pwr || 0) * pwrW + m.bond * bondW + st.gePlan * 0.3 + st.heat * 0.25 + (m.geBoost || 0) + this.rnd(0, 12) }))
      .sort((a, b) => b.score - a.score);
    const top48 = ranked.slice(0, 48).map((r, i) => ({
      rank: i + 1,
      name: r.m.name,
      team: r.m.status === "branch" ? r.m.branchTeam : r.m.team,   // 分团成员显示分团队徽
      votes: Math.round(r.score * 1200),                            // 展示用票数（同人设定）
    }));
    st.geResult = {
      top1: top48[0].name,
      top48,
      strategy: st.geStrategy,
      // 分团内部 TOP7（未官宣则无分团参选）
      bejTop7: st.era !== "2027" && st.branch.announce ? ranked.filter(r => r.m.status === "branch" && r.m.branchTeam === "BEJ48").slice(0, 7).map(r => r.m.name) : null,
      gnzTop7: st.era !== "2027" && st.branch.announce ? ranked.filter(r => r.m.status === "branch" && r.m.branchTeam === "GNZ48").slice(0, 7).map(r => r.m.name) : null,
    };
    for (const m of st.members) delete m.geBoost;

    const money = Math.round(120 + st.heat * 0.8);
    st.money += money;
    st.heat = this.clamp(st.heat + (st.geStrategy === "focus" ? 15 : 12), 0, 100);
    this.addLog(st, 7, "总选举落幕，第一名：" + ranked[0].m.name + "。全团话题度暴涨。", "gold");

    const narr = st.geStrategy === "balance" ? STORY.geNarrative.balance : STORY.geNarrative.good;
    const crownPages = STORY.geNarrative.crown.map(p => ({
      ...p, s: p.s === "{top1}" ? ranked[0].m.name : p.s, t: this.fmt(p.t),
    }));
    const title = st.era === "2027" ? "第十四届偶像年度人气总决选 · 结果"
      : st.era === "2026" ? "SNH48 年度人气总决选 · 结果"
      : st.era === "2018" ? "「砥砺前行」第五届总决选 · 结果"
      : st.era === "2017" ? "「我心翱翔」第四届总决选 · 结果"
      : "「比翼齐飞」第三届总决选 · 结果";
    const aftermath = st.era === "2027" ? STORY.geAftermath27(st)
      : st.era === "2026" ? STORY.geAftermath26
      : st.era === "2018" ? STORY.geAftermath18(st)
      : st.era === "2017" ? STORY.geAftermath17(st)
      : STORY.geAftermath(st);
    return {
      type: "geResult", top48: st.geResult.top48, bejTop7: st.geResult.bejTop7, gnzTop7: st.geResult.gnzTop7, money,
      title: title,
      pagesAfter: [...crownPages, ...narr.map(p => ({ ...p, t: this.fmt(p.t) })),
        ...aftermath.map(p => ({ ...p, t: this.fmt(p.t) }))],
    };
  },

  /* 金曲大赏结算 */
  resolveRT(st) {
    st.rtDone = true;
    /* 2017 线：两套以上原创公演完成时，原创曲目入选年度歌单加成评分 */
    const origBonus = st.era === "2017" && this.origCount(st) >= 2 ? 6 : 0;
    const score = Math.min(100, Math.round(st.rtPlan * 0.5 + st.train * 0.25 + st.morale * 0.25 + origBonus + this.rnd(0, 10)));
    st.rtScore = score;
    let tier, money, heat;
    if (score >= 85)      { tier = "great";  money = 150; heat = 15; }
    else if (score >= 65) { tier = "good";   money = 100; heat = 10; }
    else                  { tier = "normal"; money = 60;  heat = 4;  }
    st.money += money;
    st.heat = this.clamp(st.heat + heat, 0, 100);
    this.addLog(st, 12, "年度金曲大赏落幕（评价：" + tier + (origBonus ? "，含原创曲目加成" : "") + "）。资金+" + money + "万。", "gold");
    const rtNar = st.era === "2027" ? STORY.rtNarrative27 : st.era === "2018" ? STORY.rtNarrative18
      : st.era === "2017" ? STORY.rtNarrative17 : STORY.rtNarrative;
    const narPages = rtNar[tier === "great" ? "great" : "normal"];
    return {
      type: "rtResult", tier, score, money,
      title: "年度金曲大赏 · 收官",
      pagesAfter: (typeof narPages === "function" ? narPages(st) : narPages).map(p => ({ ...p, t: this.fmt(p.t) })),
    };
  },

  /* ============================ 年度评分与结局 ============================ */

  computeGrade(st) {
    if (st.era === "2027") return this.computeGrade27(st);
    if (st.era === "2026") return this.computeGrade26(st);
    if (st.era === "2018") return this.computeGrade18(st);
    if (st.era === "2017") return this.computeGrade17(st);
    let score = 0;
    // ① 分团（30）
    if (st.branch.announce) score += st.branch.announceMonth === 4 ? 30 : 20;
    else if (st.branch.stage >= 3) score += 8;
    else if (st.branch.stage >= 1) score += 4;
    // ② 总选举（25）
    if (st.geDone) {
      score += 20;
      const t1 = st.members.find(m => m.name === st.geResult.top1);
      if (t1 && t1.bond >= 60) score += 5;
    }
    // ③ 金曲大赏（18）
    if (st.rtScore >= 85) score += 18;
    else if (st.rtScore >= 65) score += 12;
    else if (st.rtDone) score += 6;
    // ④ 资源面
    score += Math.round(st.heat / 4);      // ≤25
    score += Math.round(st.morale / 10);   // ≤10
    score += Math.min(10, Math.floor(st.money / 60));
    if (st.debt >= 1) score -= 10;

    if (score >= 95) return "S";
    if (score >= 75) return "A";
    if (score >= 55) return "B";
    return "C";
  },

  /* 2017 线年度评分：双团(30) + 总选(20) + 大赏(12) + 原创公演(15) + 实力成长(10)
     + 热度(≤10) + 士气(≤5) + 资金(≤5) − 赤字10 → S≥95 / A≥75 / B≥55 / C */
  computeGrade17(st) {
    let score = 0;
    const b17 = st.branch17;
    // ① 双团开设（30）：SHY48 12 / CKG48 18（部分完成按阶段给分）
    if (b17.shyOpen) score += 12;
    else if (b17.shy >= 1) score += 6;
    if (b17.ckgOpen) score += 18;
    else if (b17.ckg >= 3) score += 12;
    else if (b17.ckg >= 2) score += 8;
    else if (b17.ckg >= 1) score += 4;
    // ② 总选举（20）
    if (st.geDone) {
      score += 15;
      const t1 = st.members.find(m => m.name === st.geResult.top1);
      if (t1 && t1.bond >= 60) score += 5;
    }
    // ③ 金曲大赏（12）
    if (st.rtScore >= 85) score += 12;
    else if (st.rtScore >= 65) score += 9;
    else if (st.rtDone) score += 4;
    // ④ 原创公演（15）：四队每完成一套计 15/4 分
    score += Math.round(15 * this.origCount(st) / 4);
    // ⑤ 成员实力成长（10）：年末均值相较年初的提升×2
    score += this.clamp(Math.round((this.avgPwr(st) - (st.pwrBase || 0)) * 2), 0, 10);
    // ⑥ 资源面
    score += Math.min(10, Math.round(st.heat / 4));
    score += Math.min(5, Math.round(st.morale / 10));
    score += Math.min(5, Math.floor(st.money / 60));
    if (st.debt >= 1) score -= 10;

    if (score >= 95) return "S";
    if (score >= 75) return "A";
    if (score >= 55) return "B";
    return "C";
  },

  /* 2018 线年度评分（v0.11「星阵重列」）：
     组阁(25) + 预备生汇报公演(10，年内升格人数×2封顶) + 总选(15) + 大赏(12)
     + 选秀备战(12：完成8 + 葛佳慧专辑4) + 复刻双面偶像(8，仅 plan 线) + 实力成长(10)
     + 热度/4(≤10) + 士气/10(≤5) + 资金/60(≤5) − 赤字10 → S≥90 / A≥70 / B≥55 */
  computeGrade18(st) {
    let score = 0;
    // ① 全团大重组（25）
    if (st.reorg18.done) score += 25;
    else if (st.reorg18.stage >= 2) score += 12;
    else if (st.reorg18.stage >= 1) score += 5;
    // ② 预备生汇报公演（10）：年内升格人数（含分团上调）
    score += Math.min(10, (st.prep18.promoted || 0) * 2);
    // ③ 总选举（15）
    if (st.geDone) {
      score += 12;
      const t1 = st.members.find(m => m.name === st.geResult.top1);
      if (t1 && t1.bond >= 60) score += 3;
    }
    // ④ 金曲大赏（12）
    if (st.rtScore >= 85) score += 12;
    else if (st.rtScore >= 65) score += 9;
    else if (st.rtDone) score += 4;
    // ⑤ 选秀备战（12）：首轮录制完成 8 + 葛佳慧专辑 4（2017 承诺线专属）
    if (st.show18.done) score += 8;
    if (st.show18.album) score += 4;
    // ⑥ 复刻《双面偶像》（8，仅 plan 线存在；完成满分，推进中 4）
    if (st.decisions.shuangmian17 === "plan") {
      if (st.sm18.done) score += 8;
      else if (st.sm18.stage >= 1) score += 4;
    }
    // ⑦ 成员实力成长（10）
    score += this.clamp(Math.round((this.avgPwr(st) - (st.pwrBase || 0)) * 2), 0, 10);
    // ⑧ 资源面
    score += Math.min(10, Math.round(st.heat / 4));
    score += Math.min(5, Math.round(st.morale / 10));
    score += Math.min(5, Math.floor(st.money / 60));
    if (st.debt >= 1) score -= 10;

    if (score >= 90) return "S";
    if (score >= 70) return "A";
    if (score >= 55) return "B";
    return "C";
  },

  /* 2026 线年度评分：
     CGT48(30) + 总选(20) + 大赏(15，取消则0) + 末位淘汰(15) + 热度/4(≤25)
     + 士气/10(≤10) + 资金/50(≤10) − 赤字10 − 陶莺积怨(defied 每次扣4) */
  computeGrade26(st) {
    let score = 0;
    // ① CGT48：重建路线（30）/ 解散安置路线（24）
    if (st.cgt.closed) {
      const n = st.cgt.settled || 0;
      score += n >= 3 ? 24 : n >= 1 ? 10 : 0;             // 安置 3 批全完成 → 24 分
    } else if (st.cgt.open) score += st.cgt.openMonth <= 10 ? 30 : 20;
    else if (st.cgt.stage >= 3) score += 15;
    else if (st.cgt.stage >= 1) score += 6;
    // ② 总选举（20）
    if (st.geDone) {
      score += 15;
      const t1 = st.members.find(m => m.name === st.geResult.top1);
      if (t1 && t1.bond >= 60) score += 5;
    }
    // ③ 金曲大赏（15；取消 = 0，但若取消后热度/士气仍高，玩家在别处已挣回场面）
    if (!st.rtCancelled) {
      if (st.rtScore >= 85) score += 15;
      else if (st.rtScore >= 65) score += 10;
      else score += 5;
    }
    // ④ 末位淘汰执行度（15）：3 次评审，执行/调往CGT 计满，缓刑打折，积怨扣分
    score += Math.round(15 * Math.min(3, st.elim.executed + st.elim.transferred) / 3);
    if (st.elim.defied >= 3) score -= 8;
    else score -= st.elim.defied * 4;
    // ⑤ 资源面
    score += Math.round(st.heat / 4);
    score += Math.round(st.morale / 10);
    score += Math.min(10, Math.floor(st.money / 50));
    if (st.debt >= 1) score -= 10;

    if (score >= 90) return "S";
    if (score >= 70) return "A";
    if (score >= 50) return "B";
    return "C";
  },

  /* 2027 线年度评分（v0.10）：
     影视部(20) + WHN48(20，仅王婧派/平衡派主线一存在时计分) + 总选(15) + 大赏(12，取消则0)
     + 实力成长(10) + 热度/4(≤25) + 士气/10(≤8) + 资金/60(≤8) − 赤字10
     → S≥90 / A≥70 / B≥50 / C（无主线一时满分约 98，S 仍可达但需近全优） */
  computeGrade27(st) {
    let score = 0;
    // ① 影视部焕新（20）：项目播出 20 / 杀青待播 12 / 开机 8 / 立项 4
    if (st.film.done) score += 20;
    else if (st.film.stage >= 3) score += 12;
    else if (st.film.stage >= 2) score += 8;
    else if (st.film.stage >= 1) score += 4;
    // ② WHN48（20，仅主线一存在时计分；无主线一则不计，影视部/资源面权重自然占优）
    if (st.flags.wh27Main) {
      if (st.branch27.open) score += st.branch27.openMonth <= 11 ? 20 : 14;
      else if (st.branch27.stage >= 2) score += 10;
      else if (st.branch27.stage >= 1) score += 5;
    }
    // ③ 总选举（15）
    if (st.geDone) {
      score += 12;
      const t1 = st.members.find(m => m.name === st.geResult.top1);
      if (t1 && t1.bond >= 60) score += 3;
    }
    // ④ 金曲大赏（12；取消 = 0）
    if (!st.rtCancelled) {
      if (st.rtScore >= 85) score += 12;
      else if (st.rtScore >= 65) score += 9;
      else score += 4;
    }
    // ⑤ 成员实力成长（10）：年末均值相较年初的提升×2
    score += this.clamp(Math.round((this.avgPwr(st) - (st.pwrBase || 0)) * 2), 0, 10);
    // ⑥ 资源面
    score += Math.round(st.heat / 4);
    score += Math.min(8, Math.round(st.morale / 10));
    score += Math.min(8, Math.floor(st.money / 60));
    if (st.debt >= 1) score -= 10;

    if (score >= 90) return "S";
    if (score >= 70) return "A";
    if (score >= 50) return "B";
    return "C";
  },

  /* 进入下一个月（UI 播放完月末步骤后调用） */
  advanceMonth() {
    const st = this.st;
    st.month += 1;
    st.ap = 3;
    this.save();
  },

  /* 当前月份显示 */
  dateLabel() {
    const st = this.st;
    return st.era + "年" + st.month + "月";
  },
};

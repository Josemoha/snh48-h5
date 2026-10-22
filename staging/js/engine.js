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
  /* 【已废弃用途】原「总结任期」按钮挂载年份限定（旧版只挂最新剧本年份），
     2026-10-26 翻页式改版后不再使用：任意年份结算画面均可打开总结任期。保留常量仅供参考 */
  LATEST_STORY_ERA: "2020",

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
      ap: 4,
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
    this.initRelSystem(st);   // 【v0.13.0】成员关系 & 队伍磨合度初始化

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
      : st.era === "2020" ? STORY.prologue20
      : st.era === "2019" ? STORY.prologue19
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

  /* 【XII 编制口径·用户规则 2026-10-17】保留 XII（flags.xiiKept18）且仍有在册 XII 成员时，
     XII 视同正常本部队伍：凡涉及本部队伍去向的点将/编制/安置/升格窗口与校验，
     一律经 keptXiiInRoster / headTeams 动态拼入 XII，不得硬编码「本部四队」。 */
  keptXiiInRoster(st) {
    st = st || this.st;
    return !!st.flags.xiiKept18 && st.members.some(m => m.status === "active" && m.team === "XII");
  },

  /* 本部可作去向的队伍清单（XII 保留时含 XII；FT 是否可选由调用方按成立状态追加） */
  headTeams(st) {
    st = st || this.st;
    return ["SII", "NII", "HII", "X"].concat(this.keptXiiInRoster(st) ? ["XII"] : []);
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
          /* 已在籍的移籍成员卡：同步 2016-09/10 的队长/副队任命与队伍标注，人气羁绊保留 */
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
      ap: 4,
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
      /* 总结任期：抉择记录全程继承 + 刚结束年份归档 */
      termLog: (src.termLog || []).slice(),
      termArchive: Object.assign({}, src.termArchive, src.era ? { [src.era]: this.termArchiveYear(src) } : {}),
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
    this.inheritRel(src, st);   // 【v0.13.0】磨合度/成员关系跨年继承
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
        /* 同名去重只针对非离团在册成员——如 CKG48 一期生孟玥与 2016 年已毕业的
           本部 NII 一期生孟玥重名，前者照常建卡（id 前缀 bf17_ 区分） */
        if (st.members.some(x => x.name === r.name && x.status !== "left")) continue;
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
      ap: 4,
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
      /* 总结任期：抉择记录全程继承 + 刚结束年份归档 */
      termLog: (src.termLog || []).slice(),
      termArchive: Object.assign({}, src.termArchive, src.era ? { [src.era]: this.termArchiveYear(src) } : {}),
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
    this.inheritRel(src, st);   // 【v0.13.0】磨合度/成员关系跨年继承
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
    if (era === "2019") {
      /* 快速通道 2019：伪造 2018 全年 → carryTo2019。
         补选：对日基调 jpMode（决定 2019 复刻线/TEB48 选项）、Team XII 去留、
         葛佳慧 2017 承诺（影响限定团候选与加成口径）等。 */
      this.fastState2016(playerName, choices);
      this.carryTo2017();
      this.fastSim2017(choices);
      this.carryTo2018();
      const stF = this.st;
      const xk19 = choices.xiiKeep18 === "keep" ? "keep" : "dissolve";
      stF.decisions.xiiKeep18 = xk19;
      stF.flags.xiiKept18 = xk19 === "keep";
      if (xk19 === "keep") stF.morale = this.clamp(stF.morale + 4, 0, 100);
      else stF.money += 20;
      this.fastSim2018(choices);
      this.carryTo2019();
      return this.st;
    }
    if (era === "2020") {
      /* 快速通道 2020：伪造 2019 全年 → carryTo2020。
         补选：分团兼任 branchPost、对日基调 jpMode、XII 去留、葛佳慧承诺、
         分团撤资 branch19Keep（giveup 线含孟波保旗 branchFlag19）、
         TEB48 推进 teb19Push（复刻线）、冯薪朵请缨 fengXinDuo19。 */
      this.fastState2016(playerName, choices);
      this.carryTo2017();
      this.fastSim2017(choices);
      this.carryTo2018();
      const stF = this.st;
      const xk20 = choices.xiiKeep18 === "keep" ? "keep" : "dissolve";
      stF.decisions.xiiKeep18 = xk20;
      stF.flags.xiiKept18 = xk20 === "keep";
      if (xk20 === "keep") stF.morale = this.clamp(stF.morale + 4, 0, 100);
      else stF.money += 20;
      this.fastSim2018(choices);
      this.carryTo2019();
      this.fastSim2019(choices);
      this.carryTo2020();
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
    st.decisions.ge2016Top1 = "鞠婧祎";   // 连霸基准 tag（快速通道按史实预填）
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

    /* —— 第四届总决选（2017-07）：鞠婧祎连霸（2016 史实第一 + 本届第一）→ 升入荣誉殿堂 —— */
    st.geResult = { top1: "鞠婧祎", top48: [], strategy: null, bejTop7: null, gnzTop7: null };
    st.decisions.ge2017Top1 = "鞠婧祎";   // 连霸基准 tag（快速通道按史实预填）
    st.flags.hall17 = true; st.flags.reignHall17 = true;
    const jjy = st.members.find(x => x.name === "鞠婧祎");
    if (jjy && jjy.status !== "left") {
      jjy.hall = true; jjy.hallIdol = true; jjy.team = "HALL"; jjy.branchTeam = null; jjy.status = "active";
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
        pop: 94, bond: 25, status: "active", hall: true, hallIdol: true, note: "荣誉殿堂 · 影视部（2026 重新签约）",
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

    /* 第十三届总决选（2026-07）：杨冰怡连霸（2025 史实第一 + 本届第一）→ 升入荣誉殿堂 */
    st.geResult = { top1: "杨冰怡", top48: [], strategy: null, bejTop7: null, gnzTop7: null };
    st.decisions.ge2026Top1 = "杨冰怡";   // 连霸基准 tag（快速通道按史实预填）
    st.flags.bingyiHall = true;
    const by = st.members.find(x => x.name === "杨冰怡");
    if (by) { by.hall = true; by.hallIdol = true; by.team = "HALL"; by.note = "连续两届总决选第一名 · 升入荣誉殿堂"; }

    st.money = 520; st.heat = 42; st.morale = 58; st.train = 38; st.burden = 55;
    st.month = 12;
    return st;
  },

  /* 【快速通道·2018 全年】在 fastState2016 → carryTo2017 → fastSim2017 → carryTo2018 的
     状态上快进 2018 一年（2019 快速通道专用）。
     快进内容：史实人员变动（九期生/十期生/分团新期生）→ 首次大组阁（自动编制）→
     选秀派遣（自动点将人气前11）→ 复刻《双面偶像》（若 plan）→ 第五届总选（史实李艺彤
     终结连霸）→ TEB48 提议 tag（复刻路线）→ 年末经营盘面。 */
  fastSim2018(choices) {
    const st = this.st;
    /* 全年史实人员变动快进 */
    this.fastSimJoinLeave(st, "2018");

    /* —— 首次大组阁（自动编制：保留/解散 XII 按补选，其余按人气均分入编）—— */
    st.decisions.xiiKeep18 = st.decisions.xiiKeep18 || (choices.xiiKeep18 === "keep" ? "keep" : "dissolve");
    st.flags.xiiKept18 = st.decisions.xiiKeep18 === "keep";
    this.autoReorg18();

    /* —— 选秀派遣（自动点将人气前11；葛佳慧承诺自动占位）→ 首轮录制完成 —— */
    const promise18 = st.decisions.gejiahui17 === "promise";
    const pool18 = st.members.filter(m => m.status === "active" && !m.hall && m.team !== "HALL" && m.team !== "PREP")
      .sort((a, b) => (b.pop || 0) - (a.pop || 0) || (a.name < b.name ? -1 : 1));
    const squad18 = pool18.slice(0, 11).map(m => m.id);
    if (promise18) {
      const gj18 = st.members.find(x => x.name === "葛佳慧");
      if (gj18 && gj18.status !== "left" && squad18.indexOf(gj18.id) < 0) squad18.push(gj18.id);
    }
    st.show18 = { stage: 3, done: true, squad: squad18, album: !!promise18 };
    st.flags.show18Done = true;
    if (promise18) st.flags.album18Done = true;
    st.heat = this.clamp(st.heat + 12, 0, 100);
    st.money += 10;   // 商务预付 40 - 封闭集训 30 的净额

    /* —— 复刻《双面偶像》（2017 决议 plan 且非复刻对日模式）：自动完成 —— */
    if (st.decisions.shuangmian17 === "plan" && !this.isReplicate(st)) {
      st.sm18 = { stage: 3, done: true, team: "NII" };
      st.flags.sm18Done = true;
      st.heat = this.clamp(st.heat + 7, 0, 100);
    }

    /* —— 2018.12 TEB48 提议（复刻路线专属 tag，2019 序章回收）—— */
    if (this.isReplicate(st)) st.decisions.teb48Offer18 = "offer";

    /* —— 第五届总决选（2018-07）：史实李艺彤终结连霸（鞠婧祎 2017 已升堂不参选口径）—— */
    st.geResult = { top1: "李艺彤", top48: [], strategy: null, bejTop7: null, gnzTop7: null };
    st.decisions.ge2018Top1 = "李艺彤";   // 2019 连霸判定基准（history.ge2018Top1）

    /* 年末经营盘面（合理中位值） */
    st.money = 950; st.heat = 52; st.morale = 72; st.train = 42; st.burden = 46;
    st.month = 12;
    return st;
  },

  /* 【快速通道·2019 全年】在 fastState2016 → … → fastSim2018 → carryTo2019 的
     状态上快进 2019 一年（2020 快速通道专用，v0.13.11）。
     快进内容：史实离团（leaving2019）→ 序章撤资决策（branch19Keep 补选；giveup 线
     按 branchPost 口径落孟波保旗 branchFlag19，未保旗的 SHY/CKG 分团成员移籍 IDFT）→
     TEB48（复刻线补选推进则开业并建首批卡）→ 年度招新（按考据归属自动入册，
     同 applyRecruit19 默认口径）→ 冯薪朵请缨 tag → 年末经营盘面。 */
  fastSim2019(choices) {
    const st = this.st;
    /* 全年史实离团快进（2019 无静态入团表，招新单独处理） */
    this.fastSimJoinLeave(st, "2019");

    /* —— 序章决策：分团撤资危机（branch19Keep）—— */
    const keep = choices.branch19Keep === "keep";
    st.decisions.branch19Keep = keep ? "keep" : "giveup";
    if (keep) {
      /* 保住分团：SHY48/CKG48 在册分团卡维持原状（2020 序章承载安置） */
    } else {
      /* 放弃分团：孟波保旗按 branchPost 口径（branchPost=CKG48 → 保 SHY48，否则保 CKG48）*/
      if (choices.branchFlag19 !== "refuse") {
        st.decisions.branchFlag19 = st.decisions.branchPost === "CKG48" ? "SHY48" : "CKG48";
      }
      st.flags.branchesClosed19 = true;
      if (st.branch17) { st.branch17.shyOpen = false; st.branch17.ckgOpen = false; }
      const flag19 = st.decisions.branchFlag19;
      /* 保旗分团至多留任 16 人（按人气降序，同旗号留任口径），其余移籍 IDFT */
      const flagPool = flag19 ? st.members
        .filter(m => m.status === "branch" && m.branchTeam === flag19)
        .sort((a, b) => (b.pop || 0) - (a.pop || 0) || (a.name < b.name ? -1 : 1)) : [];
      const flagStayIds = new Set(flagPool.slice(0, 16).map(m => m.id));
      for (const m of st.members) {
        if (m.status !== "branch" || (m.branchTeam !== "SHY48" && m.branchTeam !== "CKG48")) continue;
        if (flagStayIds.has(m.id)) {
          m.branchLabel = "预备生";
          m.note = (m.note ? m.note + "；" : "") + "2019撤资 · 旗号留任（" + flag19 + "）";
          continue;
        }
        m.status = "idft"; m.team = "IDFT"; m.branchTeam = null; m.branchLabel = null;
        m.captain = false; m.vice = false; delete m.sub;
        m.bond = this.clamp((m.bond || 0) - 6, 1, 100);
        m.note = (m.note ? m.note + "；" : "") + "2019撤资 · 移籍IDFT训练生池";
      }
    }

    /* —— TEB48 筹建（仅复刻线；补选推进则开业并建首批成员卡）—— */
    if (this.isReplicate(st) && choices.teb19Push === "go") {
      st.decisions.teb19Push = "go";
      st.teb19 = st.teb19 || { stage: 0, done: false, open: false, openMonth: 0 };
      st.money -= 200;   // 台北剧场（招商/首演回款不另计入，盘面取中位值兑底）
      st.teb19.stage = 4; st.teb19.done = true;
      st.teb19.open = true; st.teb19.openMonth = 9;
      st.flags.teb19Open = true;
      this.deployTeb19Roster(st);
    }

    /* —— 冯薪朵请缨（可选补选：bej=兼任 BEJ48 重心分团 / hq=留任本部 / 缺省=未请缨）—— */
    if (choices.fengXinDuo19 === "bej" || choices.fengXinDuo19 === "hq") {
      st.decisions.fengXinDuo19 = choices.fengXinDuo19;
      const fx = st.members.find(x => x.name === "冯薪朵" && x.status === "active");
      if (choices.fengXinDuo19 === "bej" && fx) {
        fx.note = (fx.note ? fx.note + "；" : "") + "2019-10 兼任 BEJ48（以老带新·重心在分团事务）";
      }
    }

    /* —— 年度招新：按考据归属自动入册（同 applyRecruit19 默认口径）—— */
    st.recruit19 = { done: true, hq: 0, br: 0 };
    for (const r of (DATA.recruit2019 || [])) {
      if (st.members.some(x => x.name === r.name)) continue;
      const a = r.branch || "PREP";
      if (a === "PREP") {
        st.members.push({
          id: "ft19_" + r.name, name: r.name, team: "PREP", gen: r.gen,
          pop: this.rnd(6, 12), bond: 8, status: "active", pwr: this.rnd(5, 10),
          note: "2019年度招新（本部预备生 · " + r.join + "）",
        });
        st.recruit19.hq++;
      } else {
        st.members.push({
          id: "ft19_" + r.name, name: r.name, team: a, gen: r.gen,
          pop: 0, bond: 6, status: "branch", branchTeam: a, branchLabel: "预备生",
          pwr: this.rnd(5, 10),
          note: "2019年度招新（" + a + "预备生 · " + r.join + "）",
        });
        st.recruit19.br++;
      }
    }

    /* 年末经营盘面（合理中位值；保分团线含维稳专户支出，盘面略低） */
    st.money = keep ? 860 : 940;
    st.heat = 55; st.morale = 70; st.train = 45; st.burden = 44;
    st.month = 12;
    return st;
  },

  /* 【快速通道·2018】首次大组阁自动编制：
     预备生留任、分团候选留任；XII 去留按补选（解散时成员默认落编）；
     其余本部正式成员按人气降序轮替填入各队（下限13、上限20，溢出落编）。
     队长 = 各队人气最高者。落地走真实 applyReorg18，保证与正常游玩同构。 */
  autoReorg18() {
    const st = this.st;
    if (st.flags.reorg18Done) return;
    const kept = !!st.flags.xiiKept18;
    const TEAMS = kept ? ["SII", "NII", "HII", "X", "XII", "FT"] : ["SII", "NII", "HII", "X", "FT"];
    const pools = this.reorg18Pools(st);
    const assign = {};
    for (const m of pools.head) {
      if (m.team === "PREP") { assign[m.id] = "prep"; continue; }
      assign[m.id] = (kept || m.team !== "XII") ? m.team : "drop";
    }
    for (const m of pools.branch) assign[m.id] = "stay";
    /* 可重编成员（非预备生；XII 解散时含 XII 成员）按人气降序，两阶段填充：
       ① 先保证每队 13 人下限（不足时可从预备生直接定队升格补足，规则同真实编制会）；
       ② 其余成员轮替均分至各队至 20 人，溢出落编移籍分团。 */
    const movable = pools.head.filter(m => m.team !== "PREP" && (kept || m.team !== "XII"))
      .sort((a, b) => (b.pop || 0) - (a.pop || 0) || (a.name < b.name ? -1 : 1));
    const preps = pools.head.filter(m => m.team === "PREP")
      .sort((a, b) => (b.pop || 0) - (a.pop || 0) || (a.name < b.name ? -1 : 1));
    const cnt = {}; TEAMS.forEach(t => { cnt[t] = 0; });
    /* 阶段①：非预备生成员轮替填充至每队 ≥13 */
    let idx = 0;
    for (const t of TEAMS) {
      while (cnt[t] < 13 && idx < movable.length) { assign[movable[idx].id] = t; cnt[t]++; idx++; }
    }
    /* 下限仍不足 → 从预备生直接定队升格补足 */
    let pi = 0;
    for (const t of TEAMS) {
      while (cnt[t] < 13 && pi < preps.length) { assign[preps[pi].id] = t; cnt[t]++; pi++; }
    }
    /* 阶段②：剩余非预备生成员轮替填至 20 人，溢出落编 */
    while (idx < movable.length) {
      const t = TEAMS.find(tt => cnt[tt] < 20);
      if (!t) { assign[movable[idx].id] = "drop"; }
      else { assign[movable[idx].id] = t; cnt[t]++; }
      idx++;
    }
    /* 剩余预备生默认留任 */
    for (; pi < preps.length; pi++) assign[preps[pi].id] = "prep";
    /* 队长：各队人气最高者 */
    const captains = {};
    for (const t of TEAMS) captains[t] = { captain: null, vice: null };
    for (const m of movable) {
      const t = assign[m.id];
      if (t && !captains[t].captain) captains[t].captain = m.id;
    }
    const res = this.applyReorg18(assign, captains);
    if (res.tone === "blocked") {
      /* 理论上不可达（按构造满足约束）；兜底：仅置完成旗标，成员维持原队 */
      st.flags.reorg18Done = true;
      st.flags.ftFormed = true;
      if (st.reorg18) { st.reorg18.done = true; st.reorg18.stage = 4; }
    }
  },

  /* 【快速通道】整年人员变动快进（与 endMonth 同口径的简化版）：
     入队建卡（pop/bond 按年代随机基数，2017+ 含 pwr；分团 branchTeam 建简卡）；
     离团按类型生效（毕业/离团/退团→left，暂休→rest，移籍→branch，兼任→仅备注）；
     跳过已离团/暂休/殿堂成员与赵嘉敏（完全由决策线驱动）。 */
  fastSimJoinLeave(st, era) {
    const joinSrc = era === "2016" ? DATA.joining2016
      : era === "2017" ? DATA.joining2017
      : era === "2018" ? DATA.joining2018
      : era === "2026" ? DATA2026.joining2026 : [];
    const leaveSrc = era === "2016" ? DATA.leaving2016
      : era === "2017" ? DATA.leaving2017
      : era === "2018" ? DATA.leaving2018
      : era === "2019" ? (DATA.leaving2019 || []) : [];
    for (let month = 1; month <= 12; month++) {
      for (const j of joinSrc) {
        if (j.month !== month) continue;
        if (st.members.some(x => x.name === j.name)) continue;
        if (j.branchTeam) {
          st.members.push({
            id: "ft" + j.name, name: j.name, team: j.branchTeam, gen: j.gen,
            pop: 0, bond: 0, status: "branch", branchTeam: j.branchTeam,
            branchLabel: j.branchLabel || "预备生", note: j.note,
          });
        } else {
          st.members.push({
            id: "ft" + j.name, name: j.name, team: j.team, gen: j.gen,
            pop: era === "2016" ? this.rnd(16, 30) : era === "2017" ? this.rnd(10, 18) : this.rnd(8, 14),
            bond: era === "2016" ? 15 : era === "2017" ? 12 : 8, status: "active",
            pwr: (era === "2017" || era === "2018") ? this.rnd(5, 10) : undefined,
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
        /* 去年点将出征选秀的成员不随史实表离团（同 2019 实跑口径：封闭集训/限定团线承载） */
        if (st.show18 && Array.isArray(st.show18.squad)) {
          const sq = st.show18.squad.map(id => (st.members.find(x => x.id === id) || {}).name);
          if (sq.indexOf(lv.name) >= 0) continue;
        }
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
      ap: 4,
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
      /* 总结任期：抉择记录全程继承 + 刚结束年份归档 */
      termLog: (src.termLog || []).slice(),
      termArchive: Object.assign({}, src.termArchive, src.era ? { [src.era]: this.termArchiveYear(src) } : {}),
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
    this.inheritRel(src, st);   // 【v0.13.0】磨合度/成员关系跨年继承
    this.addLog(st, 1, "2017 年的答卷交卷，2018「星阵重列」开卷：成员卡已按年末实况登记（实力沿 2017 继续成长），年初实力均值 " + pwrBase + "。", "main");
    this.save();
    return st;
  },

  /* ========================================================================
     2018 → 2019「双岸」线交接（2018 结算界面「进入下一年」入口，v0.12）
     --------------------------------------------------------------------------
     在 2018 年末成员卡与经营状态的基础上变动：
     ① 登记成员卡快照到 st.history.roster2018（含殿堂/分团状态与总选结果）；
     ② 实力（pwr）沿 2018 装配值继续成长（不重置），重算年初均值 pwrBase；
     ③ 登记去年年末资金 history.money2018（序章撤资危机按 1/4 或 1/2 扣减的基数）；
     ④ 继承 SHY48/CKG48 开业状态（branch17，月收入延续——序章放弃分团时关闭）与
        FT/XII 编制状态（flags）、2018 选秀派遣名单（show18.squad，主线④限定团用）、
        预备生汇报公演制度（prep18）；
     ⑤ 新主线状态：teb19（TEB48 筹建）/ reorg19（二次组阁）/ recruit19（年度招新）/
        unit19（限定团）/ outreach19（外务布局）。
     【入线声明】2019 不挂载 joining2019/leaving2019 静态表——组阁与新生加入全部由
        剧情承载（序章决策、二次组阁、9月招新事件、IDFT 移籍）。
     ========================================================================== */
  carryTo2019() {
    const src = this.st;
    const members = src.members;
    /* ① 成员卡快照（2018 年末实况，含 pwr/殿堂/分团状态） */
    const snapshot = members.map(m => ({
      name: m.name, team: m.team, status: m.status, branchTeam: m.branchTeam || null,
      pop: m.pop != null ? m.pop : null, bond: m.bond != null ? m.bond : null, hall: !!m.hall,
    }));
    /* ② 实力沿用，重算年初均值 */
    const pwrBase = this.avgPwr(src);

    const st = {
      saveVersion: this.SAVE_VERSION,
      playerName: src.playerName,
      era: "2019",
      month: 1,
      ap: 4,
      money: src.money,
      heat: src.heat,
      morale: src.morale,
      train: src.train,
      burden: src.burden,
      debt: 0,
      /* 继承 2018 年末成员卡实况（含 branch/rest/left/HALL 状态与人气/羁绊/实力） */
      members: members,
      log: [],
      flags: Object.assign({}, src.flags),
      decisions: Object.assign({}, src.decisions),
      /* 2016~2018 主线对象保留：SHY48/CKG48 开业收入延续；复刻/原创 tag 沿用；
         预备生汇报公演制度与选秀派遣名单一并继承 */
      branch: src.branch,
      branch17: src.branch17,
      orig: src.orig,
      prep18: src.prep18 || { sys: true, promoted: 0 },
      show18: src.show18,
      sm18: src.sm18,
      /* 2019 新主线状态 */
      teb19: { stage: 0, done: false, open: false, openMonth: 0 },   // 主线①：TEB48（仅复刻线拍板推进）
      reorg19: { stage: 0, done: false },                            // 主线②：二次组阁
      recruit19: { done: false, hq: 0, br: 0 },                      // 主线③：年度招新
      unit19: { formed: false, members: [] },                        // 主线④：限定团（派遣成员实力前3）
      outreach19: { done: false },                                   // 主线⑤：外务布局
      pwrBase: pwrBase,
      gePlan: 0, geStrategy: null, geDone: false, geResult: null,
      rtPlan: 0, rtDone: false, rtScore: 0,
      /* 总结任期：抉择记录全程继承 + 刚结束年份归档 */
      termLog: (src.termLog || []).slice(),
      termArchive: Object.assign({}, src.termArchive, src.era ? { [src.era]: this.termArchiveYear(src) } : {}),
      history: {
        roster2018: snapshot,
        money2018: src.money,                                   // 去年年末资金（撤资危机扣减基数）
        ge2018Top1: src.geResult ? src.geResult.top1 : null,    // 连霸判定（主线④升堂事件）
        showSquad2018: src.show18 && Array.isArray(src.show18.squad) ? src.show18.squad.slice() : [],
        ftFormed2018: !!src.flags.ftFormed,
      },
    };
    delete st.flags.monthStarted;
    delete st.flags.freePromo;
    /* 2018 一次性旗标不带入 2019 的判定流（保留在 history/decisions 中可回收） */
    delete st.flags.reorg18Done;
    this.st = st;
    this.inheritRel(src, st);   // 【v0.13.0】磨合度/成员关系跨年继承
    this.addLog(st, 1, "2018 年的答卷交卷，2019「双岸」开卷：成员卡已按年末实况登记（实力沿 2018 继续成长），年初实力均值 " + pwrBase + "。", "main");
    this.save();
    return st;
  },

  /* 【2019 主线①】TEB48 筹备阶段门控 */
  teb19BlockReason() {
    const st = this.st, t = st.teb19;
    if (t.stage === 1 && st.money < 200) return "资金不足（台北剧场需≥200万）";
    return null;
  },

  /* 【2019 主线①】TEB48 筹建四段：台北选拔→剧场选址→招商→派遣移籍决定。
     第四段转交 UI 点将窗（tone=pickTeb19，不耗行动点），落地在 setTeb19Squad()。 */
  advanceTeb19() {
    const st = this.st, t = st.teb19;
    if (t.stage === 0) {
      st.heat = this.clamp(st.heat + 4, 0, 100);
      t.stage = 1;
      return { text: "台北选拔甄选协办完成：运营代表坐进日方评审席——接手的第一步，用这条河的标准看人。（热度+4）", tone: "main", vn: STORY.scenes19.tebAudition };
    }
    if (t.stage === 1) {
      st.money -= 200; t.stage = 2;
      return { text: "台北星梦剧院租约签订，改造队进场：西门町的骑楼上，第一块中文灯箱挂了起来。（资金-200万）", tone: "main", vn: STORY.scenes19.tebTheater };
    }
    if (t.stage === 2) {
      st.money += 50; st.heat = this.clamp(st.heat + 4, 0, 100);
      t.stage = 3;
      return { text: "招商说明会落幕：首批三家签约，招商款 50 万入账——还没开演，台北的账先回来了。（资金+50万 热度+4）", tone: "main", vn: STORY.scenes19.tebBiz };
    }
    if (t.stage === 3) return { text: "", tone: "pickTeb19" };   // 转交 UI 派遣决定窗（可空选）
    return { text: "", tone: "none" };
  },

  /* 【2019 主线①】派遣移籍决定落地（UI.showTeb19Picker 确认回调；可 0~5 人）。
     选中者移籍 TEB48 建卡（status=branch）；完成后 TEB48 开业首演。 */
  setTeb19Squad(ids) {
    const st = this.st, t = st.teb19;
    if (t.done) return { text: "TEB48 已建成。", tone: "blocked" };
    /* 去年点将出征选秀的成员不可派遣移籍（封闭集训/限定团/总选加成线承载） */
    const excluded = this.show18SquadNameSet(st);
    const picked = (ids || []).map(id => st.members.find(m => m.id === id)).filter(Boolean)
      .filter(m => !excluded.has(m.name)).slice(0, 5);
    for (const m of picked) {
      m.status = "branch"; m.team = "TEB48"; m.branchTeam = "TEB48"; m.branchLabel = "";
      m.captain = false; m.vice = false; delete m.sub;
      m.bond = this.clamp((m.bond || 0) - 6, 1, 100);
      m.pop = this.clamp((m.pop || 0) + 6, 1, 100);
      m.note = "2019 派遣移籍 TEB48（创始成员）";
    }
    st.decisions.teb19Squad = picked.map(m => m.name);
    t.stage = 4; t.done = true;
    t.open = true; t.openMonth = st.month;
    st.flags.teb19Open = true;
    st.money += 60;
    st.heat = this.clamp(st.heat + 6, 0, 100);
    st.morale = this.clamp(st.morale + 3, 0, 100);
    this.deployTeb19Roster(st);   // 开业即建卡：TEB48 首批正式成员 9 人 + 预备生 7 人
    this.addLog(st, st.month, "★主线①「筹建 TEB48」达成：台北星梦剧院开业首演落幕（派遣移籍 " + picked.length + " 人），此后每月为总账带来 25 万收入。", "main");
    this.save();
    return { text: "TEB48 四步全部落地：台北星梦剧院开业！（派遣移籍 " + picked.length + " 人）", tone: "main",
      vn: this.majiaAvailable19(st) ? STORY.scenes19.tebOpenMajia : STORY.scenes19.tebOpen };
  },

  /* 【2019 主线①·追加】TEB48 首批成员建卡（开业即落地；史实 AKB48 Team TP 名单按需选录）：
     正式成员 9 人 + 预备生 7 人。新建卡人气略高于本部今年招新预备生（招新 6~12）：
     预备生 10~15、正式 15~21；阿部玛利亚（AKB48 十期生兼任）为全队最高。 */
  deployTeb19Roster(st) {
    st = st || this.st;
    if (st.flags.teb19RosterDone) return;
    st.flags.teb19RosterDone = true;
    const FORMAL = [
      { name: "阿部玛利亚", gen: "AKB48十期生", pop: 34, pwr: 15, note: "AKB48 十期生 · 兼任 TEB48 创始成员" },
      { name: "刘晓晴" }, { name: "林于馨" }, { name: "蔡亚恩" }, { name: "张羽翎" },
      { name: "林易沄", captain: true, note: "TEB48 总队长 · 创始成员" },
      { name: "蔡伊柔" }, { name: "陈诗雅" }, { name: "柏灵" },
    ];
    const PREPS = ["林昀希", "胡詠晴", "杨家宜", "许淳媛", "张鈊乔", "吕昕恩", "刘曣甯"];
    for (const f of FORMAL) {
      if (st.members.some(x => x.name === f.name)) continue;
      st.members.push({
        id: "teb_" + f.name, name: f.name, team: "TEB48", gen: f.gen || "TEB48一期生",
        pop: f.pop || this.rnd(15, 21), bond: 8, status: "branch", branchTeam: "TEB48", branchLabel: "正式成员",
        pwr: f.pwr || this.rnd(8, 12), captain: !!f.captain,
        note: f.note || "TEB48 创始成员（史实 AKB48 Team TP 选录）",
      });
    }
    for (const name of PREPS) {
      if (st.members.some(x => x.name === name)) continue;
      st.members.push({
        id: "teb_" + name, name: name, team: "TEB48", gen: "TEB48一期生",
        pop: this.rnd(10, 15), bond: 6, status: "branch", branchTeam: "TEB48", branchLabel: "预备生",
        pwr: this.rnd(5, 10), note: "TEB48 首批预备生（史实 AKB48 Team TP 选录）",
      });
    }
    this.addLog(st, st.month, "TEB48 首批成员入团：正式成员 9 人（阿部玛利亚兼任领衔 · 林易沄任总队长）+ 预备生 7 人。", "good");
  },

  /* 【2019】马嘉伶移籍请求是否可用：尚未拍板，且她不在离团/暂休状态
     （2017 复刻线在册则由在册卡移籍；不在册则随同意建卡）。 */
  majiaAvailable19(st) {
    st = st || this.st;
    if (st.decisions.teb19Majia) return false;
    const m = st.members.find(x => x.name === "马嘉伶");
    return !m || (m.status !== "left" && m.status !== "rest");
  },

  /* 【2019 主线①·追加】马嘉伶移籍 TEB48 拍板（开业场景选项回调）：
     同意 → 与 TEB48 首批建卡一起落地（在册卡移籍 / 无卡新建卡）；婉拒 → 她留在 AKB48 方面。 */
  resolveTeb19Majia(st, agree) {
    st = st || this.st;
    if (st.decisions.teb19Majia) return "马嘉伶的去留此前已有定论。";
    st.decisions.teb19Majia = agree ? "agree" : "reject";
    if (!agree) {
      this.addLog(st, st.month, "马嘉伶的移籍 TEB48 请求未被批准（留在 SNH48）。", "normal");
      return "你在申请函上批了一个「留」字：「本部的舞台也需要她。」马嘉伶的名字没有出现在台北的首批名册里——她留在 SNH48 这边，上海的舞台照常有她；台北的灯，先由日方选拔的孩子们点起来。";
    }
    const m = st.members.find(x => x.name === "马嘉伶");
    if (m) {
      m.status = "branch"; m.team = "TEB48"; m.branchTeam = "TEB48"; m.branchLabel = "正式成员";
      m.captain = false; m.vice = false; delete m.sub;
      m.pop = this.clamp((m.pop || 0) + 6, 1, 100);
      m.bond = this.clamp((m.bond || 0) - 4, 1, 100);
      m.note = (m.note ? m.note + "；" : "") + "2019 移籍 TEB48（创始成员）";
      this.addLog(st, st.month, "马嘉伶 移籍 TEB48（创始成员）。", "main");
      return "你批了这份申请：「台湾的舞台，交给她最合适。」马嘉伶把自己的名字签在首批名册的第一行，与阿部玛利亚、林易沄她们并肩站上了台北星梦剧院的舞台。（人气+6 羁绊-4）";
    }
    st.members.push({
      id: "teb_马嘉伶", name: "马嘉伶", team: "TEB48", gen: "AKB48台湾选拔",
      pop: 30, bond: 12, status: "branch", branchTeam: "TEB48", branchLabel: "正式成员",
      pwr: 14, note: "2019 移籍 TEB48 创始成员（台湾选拔出身）",
    });
    this.addLog(st, st.month, "马嘉伶 移籍 TEB48（创始成员建卡）。", "main");
    return "你批了这份申请。马嘉伶——台湾选拔出身、两岸舞台都走得通的那一个——把自己的名字签在 TEB48 首批名册的第一行，与阿部玛利亚、林易沄她们并肩站上了台北星梦剧院的舞台。";
  },

  /* 【2019 主线②】二次组阁编制对象：
     head = 本部在籍且队伍为 SII/NII/HII/X/XII/FT/PREP 的成员（全部重编）；
     dissolved = 序章放弃分团时 SHY48/CKG48 移交成员（全部进入编制池，pop 不设门槛）。 */
  /* 【2019 通用剧情】AKB48亚洲盛典（复刻线 · 曼谷远征）：七人出征名单落地。
     参赛者羁绊+8 人气+4；热度+8 士气+3 资金-20万；名单记入 decisions.asiaFest19Squad。 */
  asiaFest19Squad(ids) {
    const st = this.st;
    st.flags.asiaFest19 = true;
    const names = [];
    for (const id of ids) {
      const m = st.members.find(x => x.id === id);
      if (!m || m.status === "left" || m.status === "rest") continue;
      m.bond = this.clamp(m.bond + 8, 0, 100);
      m.pop = this.clamp(m.pop + 4, 0, 100);
      names.push(m.name);
    }
    st.money -= 20;
    st.heat = this.clamp(st.heat + 8, 0, 100);
    st.morale = this.clamp(st.morale + 3, 0, 100);
    this.recordDecision("asiaFest19Squad", names);
    this.addLog(st, st.month, "★AKB48亚洲盛典（曼谷）：" + names.join("、") + " 出征——亚洲舞台大放异彩（热度+8 士气+3 资金-20万）。", "main");
    return { text: "曼谷的舞台落幕——亚洲七团同台，这支七人小队的直拍刷屏了回国航班。（出征 " + names.length + " 人：羁绊+8 人气+4；热度+8 士气+3 资金-20万）", tone: "main" };
  },

  /* 【2019 通用剧情】11月双选秀邀约（鹅厂选秀第三季·女团 / 爱奇艺选秀第二季，各 7 名额）。
     show19Squad(key, ids)：单批派遣名单落地——key="T"鹅厂 / "I"爱奇艺；
     参赛者羁绊+6 人气+4，名单记入 decisions.show19TSquad / show19ISquad。
     成团成员（2018 限定团，status="rest"）不参与点将。 */
  show19Squad(key, ids) {
    const st = this.st;
    const label = key === "T" ? "鹅厂选秀第三季" : "爱奇艺选秀第二季";
    const names = [];
    for (const id of ids) {
      const m = st.members.find(x => x.id === id);
      if (!m || m.status === "left" || m.status === "rest") continue;
      m.bond = this.clamp(m.bond + 6, 0, 100);
      m.pop = this.clamp(m.pop + 4, 0, 100);
      m.note = (m.note ? m.note + "；" : "") + "2019-11 派遣·" + label;
      names.push(m.name);
    }
    this.recordDecision(key === "T" ? "show19TSquad" : "show19ISquad", names);
    return { label, names, ids: ids.slice() };
  },
  /* show19Finalize：全部点将完成后统一结算（mode="both"/"one"）。
     both：热度+12 士气+2 资金+40万（两班集训连轴，产能拉满）；
     one ：热度+7 士气+2 资金+20万。决策记入 decisions.show19Plan。 */
  show19Finalize(mode, a, b) {
    const st = this.st;
    if (mode === "both") {
      st.money += 40;
      st.heat = this.clamp(st.heat + 12, 0, 100);
      st.morale = this.clamp(st.morale + 2, 0, 100);
      this.recordDecision("show19Plan", "both");
      const all = (a.names || []).concat(b.names || []);
      this.addLog(st, st.month, "★双选秀同年出征（鹅厂第三季+爱奇艺第二季，共 " + all.length + " 人）：两班集训连轴转，热度与产能同时拉满（热度+12 士气+2 资金+40万）。", "main");
      return { text: "两份派遣名单同日官宣——「丝芭系」一年之内两次登上选秀头条。鹅厂：" + (a.names || []).join("、") + "；爱奇艺：" + (b.names || []).join("、") + "。\n\n两班封闭集训连轴开营，排练室的灯，凌晨三点都没熄过。（共派遣 " + all.length + " 人：羁绊+6 人气+4；热度+12 士气+2 资金+40万）", tone: "main" };
    }
    const key = a, picked = b;
    st.money += 20;
    st.heat = this.clamp(st.heat + 7, 0, 100);
    st.morale = this.clamp(st.morale + 2, 0, 100);
    this.recordDecision("show19Plan", key === "T" ? "tencent" : "iqiyi");
    this.addLog(st, st.month, "★单平台选秀出征（" + picked.label + "，共 " + picked.names.length + " 人）：集中资源押注一家（热度+7 士气+2 资金+20万）。", "main");
    return { text: "你只在一份邀约函上盖了章。" + picked.label + "的派遣名单官宣：" + picked.names.join("、") + "。\n\n集中兵力的好处立竿见影——七个人的集训，每一项都练到了极致。（共派遣 " + picked.names.length + " 人：羁绊+6 人气+4；热度+7 士气+2 资金+20万）", tone: "main" };
  },

  reorg19Pools(st) {
    st = st || this.st;
    const HEAD = ["SII", "NII", "HII", "X", "XII", "FT", "PREP"];
    const closed = st.decisions.branch19Keep === "giveup";
    return {
      head: st.members.filter(m => m.status === "active" && HEAD.indexOf(m.team) >= 0),
      dissolved: closed ? st.members.filter(m => m.status === "branch" && (m.branchTeam === "SHY48" || m.branchTeam === "CKG48")) : [],
      /* TEB48 预备生：开业后可入编制会——默认留任台北，可调往本部预备生 */
      teb: (st.teb19 && st.teb19.open)
        ? st.members.filter(m => m.status === "branch" && m.branchTeam === "TEB48" && m.branchLabel === "预备生") : [],
    };
  },

  /* 【2019 主线②】二次组阁文案分叉（马跃：排期爆了 / FT 账本 / 王婧 plain）：
     史实（2019-01-19 第二次大组阁）恒定取消 Team FT——ftKept 恒为 false，
     FT 移出编制目标，其成员默认发配分团（无分团则 IDFT）；
     XII 是否保留仅由 2018 首次组阁的 xiiKept18 决定。 */
  reorg19Narrative(st) {
    st = st || this.st;
    const xii = !!st.flags.xiiKept18 && st.members.some(m => m.status === "active" && m.team === "XII");
    const ftList = st.members.filter(m => m.status === "active" && m.team === "FT");
    const ftAvg = ftList.length ? Math.round(ftList.reduce((a, m) => a + (m.pop || 0), 0) / ftList.length) : 0;
    if (xii && ftList.length) {
      return { key: "both", ftKept: false,
        text: "马跃把两份公演排期表拍在桌上：「总监，公演排不开了——XII 和 FT 两支队伍全挤在一起，剧场就一个。FT 的牌子这次收起来，队伍缩减，就在这次组阁里一起解决。」" };
    }
    if (ftList.length) {
      return { key: "ftDown", ftKept: false,
        text: "马跃把 FT 这一年的账本推过来，声音放低：「FT 达不到预期——平均人气只有 " + ftAvg + "。需要解散队伍，让孩子们重新排队。这次组阁，下手要快，也要轻。」" };
    }
    return { key: "plain", ftKept: false,
      text: "王婧把三张表推过来：「人气、实力、编制——三张表对不上的地方，去年动了一半，今年要动完。二次组阁的名单，还是您来落笔。」" };
  },

  /* 【2019 主线②】二次组阁推进（单段行动）：返回文案 + tone=pickReorg19 转交 UI 编制会。 */
  advanceReorg19() {
    const st = this.st, r = st.reorg19;
    if (r.done) return { text: "二次组阁已经完成——新体制运行中。", tone: "blocked" };
    r.stage = 1;
    const nar = this.reorg19Narrative(st);
    r.ftKept = nar.ftKept;
    return { text: nar.text, tone: "pickReorg19" };
  },

  /* 【2019 主线②】二次组阁落地（UI.showReorg19Picker 确认回调）：
     assign   = { 成员id → "SII"|"NII"|"HII"|"X"|"XII"(保留时)|"prep"|"BEJ48"|"GNZ48"|"SHY48"(保留时)|"CKG48"(保留时)|"idft" }
     captains = { 队伍 → { captain: 成员id, vice: 成员id|null } }
     规则：本部每队下限13/上限20（主力16替补4按人气自动划档）；编入预备生≤16人；
     分团目标仅限保留的分团（BEJ48/GNZ48 常驻；SHY48/CKG48 序章保住时可选）；
     idft = 移籍 IDFT 训练生池（status="idft"，羁绊-6）；分团移交成员上调本部享红利。 */
  applyReorg19(assign, captains) {
    const st = this.st, r = st.reorg19;
    const keptXII = !!st.flags.xiiKept18 && st.members.some(m => m.status === "active" && m.team === "XII");
    const ftKept = false;   // 史实：二次组阁恒定取消 Team FT（FT 不入编制目标，成员默认发配/IDFT）
    /* 孟波保旗（仅 giveup 线）：该分团旗号保留，至多 16 人留任为旗号预备生队伍（无剧场收入） */
    const flag19 = (st.decisions.branch19Keep === "giveup" && st.decisions.branchFlag19) ? st.decisions.branchFlag19 : null;
    const TEAMS = ["SII", "NII", "HII", "X"].concat(keptXII ? ["XII"] : []).concat(ftKept ? ["FT"] : []);
    const BR = ["BEJ48", "GNZ48"].concat(st.decisions.branch19Keep === "keep" ? ["SHY48", "CKG48"] : []).concat(flag19 ? [flag19] : []);
    const pools = this.reorg19Pools(st);
    assign = assign || {}; captains = captains || {};
    const all = pools.head.concat(pools.dissolved).concat(pools.teb || []);

    /* 第一遍：计数校验（未指定的本部成员视为留在原队；预备生默认留任；
       分团移交成员默认 idft；TEB48 预备生默认留任台北；FT 解散时 FT 成员默认发配） */
    const cnt = {}; TEAMS.forEach(t => { cnt[t] = 0; });
    let preps = 0;
    const targetOf = m => {
      let t = assign[m.id] != null ? assign[m.id] : null;
      if (t == null) {
        if (m.team === "PREP") t = "prep";
        else if (m.status === "branch") t = (m.branchTeam === "TEB48") ? "TEB48" : (flag19 && m.branchTeam === flag19 ? flag19 : "idft");
        else if (m.team === "FT" && !ftKept) t = BR.length ? BR[0] : "idft";
        else t = TEAMS.indexOf(m.team) >= 0 ? m.team : "idft";
      }
      if (t === "prep" || t === "idft") return t;
      if (t === "TEB48" && st.teb19 && st.teb19.open) return t;
      if (BR.indexOf(t) >= 0) return t;
      if (TEAMS.indexOf(t) < 0) return null;
      if (t === "XII" && !keptXII) return null;
      if (t === "FT" && !ftKept) return null;
      return t;
    };
    for (const m of all) {
      const t = targetOf(m);
      if (t == null) return { text: "编制表无效（含未知队伍目标）。", tone: "blocked" };
      if (t === "prep") { if (m.team !== "PREP" || m.status === "branch") preps++; }
      else if (TEAMS.indexOf(t) >= 0) cnt[t]++;
    }
    if (preps > 16) return { text: "编入预备生 " + preps + " 人越界——预备生队伍至多 16 人。", tone: "blocked" };
    if (flag19) {
      const flagN = all.filter(m => targetOf(m) === flag19).length;
      if (flagN > 16) return { text: flag19 + " 留任 " + flagN + " 人越界——保留旗号至多留任 16 人。", tone: "blocked" };
    }
    for (const t of TEAMS) {
      if (cnt[t] < 13 || cnt[t] > 20) {
        return { text: "Team " + t + " 编制 " + cnt[t] + " 人越界——本部每队下限 13 人、上限 20 人。", tone: "blocked" };
      }
    }

    /* 第二遍：队长任命先校验后落笔 */
    const byId = {};
    for (const m of all) byId[m.id] = m;
    for (const t of TEAMS) {
      const c = captains[t] || {};
      const cap = c.captain ? byId[c.captain] : null;
      if (!cap) return { text: "Team " + t + " 尚未任命队长——每个队伍都需要一名队长。", tone: "blocked" };
      const capTarget = targetOf(cap);
      if (capTarget !== t) return { text: "Team " + t + " 的队长人选不在该队编制内。", tone: "blocked" };
      if (c.vice) {
        const vice = byId[c.vice];
        if (!vice || targetOf(vice) !== t) return { text: "Team " + t + " 的队副人选不在该队编制内。", tone: "blocked" };
      }
    }

    /* 第三遍：落地 */
    const moved = [], prepped = [], toBr = [], idft = [], upped = [], flagStay = [];
    for (const m of all) {
      const t = targetOf(m);
      if (t === "prep") {
        if (m.team === "PREP" && m.status === "active") continue;   // 预备生留任
        if (m.status === "branch") {
          if (m.branchTeam === "TEB48") {
            /* TEB48 预备生 → 本部预备生：跨海上调（轻于分团解散安置红利） */
            m.status = "active"; m.team = "PREP"; m.branchTeam = null; m.branchLabel = null;
            m.pop = this.clamp((m.pop || 0) + this.rnd(4, 8), 1, 100);
            m.bond = this.clamp((m.bond || 0) + 6, 1, 100);
            m.note = "2019二次组阁 · 自TEB48调入本部预备生";
            upped.push(m.name);
          } else {
          /* 分团移交成员 → 本部预备生：视为上调（享红利） */
          m.status = "active"; m.team = "PREP"; m.branchTeam = null; m.branchLabel = null;
          m.pop = this.clamp((m.pop || 0) + this.rnd(8, 14), 1, 100);
          m.bond = this.clamp((m.bond || 0) + 12, 1, 100);
          m.note = "2019二次组阁 · 自分团上调预备生";
          upped.push(m.name);
          }
        } else {
          m.team = "PREP"; m.branchTeam = null; m.branchLabel = null;
          m.captain = false; m.vice = false; delete m.sub;
          m.bond = this.clamp((m.bond || 0) - 4, 1, 100);
          m.prepDown = st.era;   // 降格考察年 tag：本年度不参与汇报公演升格
          m.note = "2019二次组阁 · 编入预备生";
          prepped.push(m.name);
        }
      } else if (t === "idft") {
        m.status = "idft"; m.team = "IDFT"; m.branchTeam = null; m.branchLabel = null;
        m.captain = false; m.vice = false; delete m.sub;
        m.bond = this.clamp((m.bond || 0) - 6, 1, 100);
        m.note = "2019二次组阁 · 移籍IDFT训练生池";
        idft.push(m.name);
      } else if (t === "TEB48") {
        /* TEB48 预备生留任台北：无变化（UI 仅对 TEB48 预备生提供该目标） */
        continue;
      } else if (BR.indexOf(t) >= 0) {
        if (m.status === "branch" && m.branchTeam === t) {
          if (t === flag19) {
            /* 孟波保旗：旗号留任成员转为旗号预备生队伍（无剧场收入） */
            m.branchLabel = "预备生";
            m.note = (m.note ? m.note + "；" : "") + "2019撤资 · 旗号留任（" + t + "）";
            flagStay.push(m.name);
          }
          continue;   // 留任原分团
        }
        if (m.status === "branch") {
          /* 分团移交成员 → 其余分团 */
          m.branchTeam = t; m.team = t; m.branchLabel = "";
          m.bond = this.clamp((m.bond || 0) - 4, 1, 100);
          m.prepDown = st.era;   // 发配/改派考察年 tag：本年度不参与汇报公演升格
          m.note = "2019二次组阁 · 移籍" + t;
          toBr.push(m.name);
        } else {
          /* 本部成员 → 发配分团 */
          m.status = "branch"; m.team = t; m.branchTeam = t; m.branchLabel = "";
          m.captain = false; m.vice = false; delete m.sub;
          m.bond = this.clamp((m.bond || 0) - 6, 1, 100);
          m.prepDown = st.era;   // 发配考察年 tag：本年度不参与汇报公演升格
          m.note = "2019二次组阁 · 发配" + t;
          toBr.push(m.name);
        }
      } else {
        /* 定队（含分团移交成员上调本部：享红利） */
        const fromBranch = m.status === "branch";
        const fromPrep = m.team === "PREP";
        const prevTeam = m.team;
        m.status = "active"; m.team = t; m.branchTeam = null; m.branchLabel = null;
        if (fromBranch) {
          m.pop = this.clamp((m.pop || 0) + this.rnd(8, 14), 1, 100);
          m.bond = this.clamp((m.bond || 0) + 12, 1, 100);
          m.note = "2019二次组阁上调本部 · Team " + t;
          upped.push(m.name);
        } else if (fromPrep) {
          m.pop = this.clamp((m.pop || 0) + 4, 1, 100);
          m.bond = this.clamp((m.bond || 0) + 4, 1, 100);
          m.note = "2019二次组阁 · 自预备生升格入 Team " + t;
          upped.push(m.name);
        } else if (prevTeam !== t) {
          m.note = "2019二次组阁 · 调入 Team " + t;
          moved.push(m.name);
        }
      }
    }

    /* 主力/替补划档：每队按人气排序，前 16 人为主力，其余为替补 */
    for (const t of TEAMS) {
      const list = st.members
        .filter(m => m.status === "active" && m.team === t)
        .sort((a, b) => (b.pop || 0) - (a.pop || 0));
      list.forEach((m, i) => { m.sub = i >= 16; });
    }

    /* 队长/队副任命：先清空现职（仅限参编成员），再按 captains 表落任 */
    for (const m of all) { m.captain = false; m.vice = false; }
    for (const t of TEAMS) {
      const c = captains[t] || {};
      if (c.captain && byId[c.captain]) byId[c.captain].captain = true;
      if (c.vice && byId[c.vice]) byId[c.vice].vice = true;
    }

    r.stage = 2; r.done = true;
    st.flags.reorg19Done = true;
    st.morale = this.clamp(st.morale + 4, 0, 100);
    st.heat = this.clamp(st.heat + 4, 0, 100);
    this.addLog(st, st.month, "★主线②「二次组阁」达成：新编制名单公布（调队 " + moved.length + " 人 · 预备生 " + prepped.length + " 人 · 发配分团 " + toBr.length + " 人 · 移籍IDFT " + idft.length + " 人 · 分团上调 " + upped.length + " 人" + (flagStay.length ? " · " + flag19 + " 旗号留任 " + flagStay.length + " 人" : "") + (ftKept ? " · FT 保留" : " · FT 解散") + (keptXII ? " · XII 保留" : "") + "）。", "main");
    this.save();
    return {
      text: "二次组阁编制会落幕：调队 " + moved.length + " 人 · 预备生 " + prepped.length + " 人 · 发配分团 " + toBr.length + " 人 · 移籍IDFT " + idft.length + " 人 · 分团上调 " + upped.length + " 人。",
      tone: "main",
      vn: STORY.scenes19.reorgDone19,
    };
  },

  /* 【2019 主线③】年度招新落地（UI.showRecruit19Picker 拍板回调）：
     assign = { 候选姓名 → "PREP"(本部预备生) | "BEJ48"|"GNZ48"|"SHY48"|"CKG48"(分团预备生) | "none"(暂不招录) }
     队伍归属均为预备生；未拍板者按其考据归属分团（branch 字段）入预备生。 */
  applyRecruit19(assign) {
    const st = this.st;
    if (st.recruit19.done) return { text: "今年的招新已经收官。", tone: "blocked" };
    assign = assign || {};
    const BR = ["BEJ48", "GNZ48"].concat(st.decisions.branch19Keep === "keep" ? ["SHY48", "CKG48"] : []);
    const hq = [], br = [], none = [];
    for (const r of (DATA.recruit2019 || [])) {
      if (st.members.some(x => x.name === r.name)) continue;
      const a = assign[r.name] != null ? assign[r.name] : (r.branch || "PREP");   // 本部候选（branch 为空）默认入本部预备生
      if (a === "none") {
        none.push(r.name);
        continue;
      }
      if (a === "PREP") {
        st.members.push({
          id: "r19_" + r.name, name: r.name, team: "PREP", gen: r.gen,
          pop: this.rnd(6, 12), bond: 8, status: "active",
          pwr: this.rnd(5, 10), note: "2019年度招新（本部预备生 · " + r.join + "）",
        });
        hq.push(r.name);
        this.addLog(st, st.month, "新成员入队：" + r.name + "（" + r.gen + " · 本部预备生）", "good");
      } else if (BR.indexOf(a) >= 0) {
        st.members.push({
          id: "r19_" + r.name, name: r.name, team: a, gen: r.gen,
          pop: 0, bond: 6, status: "branch", branchTeam: a, branchLabel: "预备生",
          pwr: this.rnd(5, 10), note: "2019年度招新（" + a + "预备生 · " + r.join + "）",
        });
        br.push(r.name);
        this.addLog(st, st.month, a + " 新成员入团：" + r.name + "（" + r.gen + " · 预备生）", "good");
      } else {
        none.push(r.name);
      }
    }
    st.recruit19.done = true;
    st.recruit19.hq = hq.length; st.recruit19.br = br.length;
    st.decisions.recruit19 = assign;
    st.morale = this.clamp(st.morale + 2, 0, 100);
    this.addLog(st, st.month, "★主线③「年度招新」达成：本部预备生 " + hq.length + " 人 · 分团预备生 " + br.length + " 人 · 暂不招录 " + none.length + " 人。", "main");
    this.save();
    return {
      text: "招新收官——本部预备生：" + (hq.join("、") || "无") + "；分团预备生：" + (br.join("、") || "无") + (none.length ? "；暂不招录：" + none.join("、") : "") + "。",
      tone: "main",
      vn: STORY.scenes19.recruitDone19,
    };
  },

  /* 【2019】去年点将出征鹅厂选秀的成员姓名集合（st.show18.squad 为主，
     history.showSquad2018 兑底）：她们在封闭集训/限定团/总选加成线上，
     不参与 TEB48 派遣移籍点将。 */
  show18SquadNameSet(st) {
    st = st || this.st;
    const set = new Set();
    const ids = [];
    if (st.show18 && Array.isArray(st.show18.squad)) ids.push(...st.show18.squad);
    if (st.history && Array.isArray(st.history.showSquad2018)) ids.push(...st.history.showSquad2018);
    for (const id of ids) {
      const m = st.members.find(x => x.id === id);
      if (m) set.add(m.name);
    }
    return set;
  },

  /* 【2018 主线①】1月「XII 去留」请求人：默认张怡（XII 老队长）；
     若她因玩家操作不在 XII（移籍/离队等），则由在册 XII 成员中与总监羁绊最高者代表请求。
     XII 已无在册成员时返回 null（事件跳过，编制会门口补问兜底）。 */
  xiiRequester18(st) {
    st = st || this.st;
    const xii = st.members.filter(m => m.status === "active" && m.team === "XII");
    if (!xii.length) return null;
    return xii.find(m => m.name === "张怡")
      || xii.slice().sort((a, b) => (b.bond || 0) - (a.bond || 0) || (a.name < b.name ? -1 : 1))[0];
  },

  /* 【2019 主线④】限定团人选（确定性）：2018 派遣成员按实力降序，前 3 成团；
     葛佳慧默认不成团（占名额则顺延下一位）；仅计在籍（active/branch）成员。
     pages 与 effect 两次调用口径一致，不用随机。 */
  unit19Selection(st) {
    st = st || this.st;
    const squad = ((st.show18 && st.show18.squad) || [])
      .map(id => st.members.find(m => m.id === id))
      .filter(m => m && m.status !== "left" && m.status !== "rest" && !m.hall);
    const sorted = squad.slice().sort((a, b) =>
      (b.pwr || 0) - (a.pwr || 0) || (b.pop || 0) - (a.pop || 0) || (a.name < b.name ? -1 : 1));
    const debut = [];
    for (const m of sorted) {
      if (debut.length >= 3) break;
      if (m.name === "葛佳慧") continue;   // 默认不成团：顺延给下一位
      debut.push(m);
    }
    const bonus = sorted.filter(m => debut.indexOf(m) < 0);
    return { debut: debut, bonus: bonus };
  },

  /* 【2019 主线④】限定团成团落地（6月事件）：成团者暂休一年（不参加本年总选）；
     未成团的派遣成员登记总选加成（geBoost+8，resolveGE 结算时回收）。 */
  formUnit19(st) {
    st = st || this.st;
    if (st.flags.unit19Formed) return { text: "限定团已经成团。", tone: "blocked" };
    const sel = this.unit19Selection(st);
    if (!sel.debut.length) return { text: "2018 年没有可供成团的派遣成员。", tone: "blocked" };
    for (const m of sel.debut) {
      m.status = "rest";
      m.note = "跟随限定团活动（暂休一年，不参加本年总选）";
      st.unit19.members.push(m.name);
    }
    for (const m of sel.bonus) {
      m.geBoost = (m.geBoost || 0) + 8;   // 未成团派遣成员：总选加成（resolveGE 结算回收）
      m.note = (m.note ? m.note + "；" : "") + "2019限定团落选 · 总选加成+8";
    }
    st.unit19.formed = true;
    st.flags.unit19Formed = true;
    st.heat = this.clamp(st.heat + 8, 0, 100);
    st.morale = this.clamp(st.morale + 2, 0, 100);
    this.addLog(st, st.month, "★主线④（前置）限定团成团：" + sel.debut.map(m => m.name).join("、") + "（暂休一年）；未成团派遣成员 " + sel.bonus.length + " 人获总选加成。", "main");
    this.save();
    return {
      text: "限定团成团名单公布：" + sel.debut.map(m => m.name).join("、") + "——暂休一年，随团活动。未成团的派遣成员（" + sel.bonus.length + " 人）获得总选加成+8。（热度+8 士气+2）",
      tone: "main",
      vn: STORY.scenes19.unitScene,
    };
  },

  /* 【2020·8月事件】2019 双选秀限定团人选（确定性）：鹅厂/爱奇艺各取一人出道——
     各自派遣名单（decisions.show19TSquad/show19ISquad，存姓名）按实力降序取第一名
     （同 unit19Selection 口径：pwr 降序 → pop 降序 → 姓名）；
     2020 年起允许葛佳慧成团（若她仍在籍且被派遣且是应当出道的人选，则正常出道）；
     仅计在籍（非 left/rest/idft、非殿堂）成员。只派遣了一方则只有一个出道名额。 */
  unit20Selection(st) {
    st = st || this.st;
    const eligible = names => (names || [])
      .map(n => st.members.find(m => m.name === n))
      .filter(m => m && m.status !== "left" && m.status !== "rest" && m.status !== "idft" && !m.hall)
      .sort((a, b) => (b.pwr || 0) - (a.pwr || 0) || (b.pop || 0) - (a.pop || 0) || (a.name < b.name ? -1 : 1));
    const pick = names => eligible(names)[0] || null;
    const debut = [];
    const t = pick(st.decisions && st.decisions.show19TSquad); if (t) debut.push(t);
    const i = pick(st.decisions && st.decisions.show19ISquad); if (i && debut.indexOf(i) < 0) debut.push(i);
    const all = eligible((st.decisions && st.decisions.show19TSquad || []).concat((st.decisions && st.decisions.show19ISquad) || []));
    const bonus = all.filter(m => debut.indexOf(m) < 0);
    return { debut: debut, bonus: bonus };
  },

  /* 【2020·8月事件】2019 双选秀限定团成团落地：出道者划入暂休一年（不参加本年总选）；
     未成团的派遣成员登记总选加成（geBoost+8）——本年 8 月线上总选结算时回收
     （月度链在总选结算前下发，同月生效）。 */
  formUnit20(st) {
    st = st || this.st;
    if (st.flags.unit20Formed) return { text: "限定团已经成团。", tone: "blocked" };
    const sel = this.unit20Selection(st);
    if (!sel.debut.length) return { text: "2019 年没有可供成团的派遣成员。", tone: "blocked" };
    st.unit20 = st.unit20 || { formed: false, members: [] };
    for (const m of sel.debut) {
      m.status = "rest";
      m.note = (m.note ? m.note + "；" : "") + "跟随限定团活动（暂休一年，不参加本年总选）";
      st.unit20.members.push(m.name);
    }
    for (const m of sel.bonus) {
      m.geBoost = (m.geBoost || 0) + 8;   // 本年 8 月线上总选结算回收（同月：月度链先于总选结算）
      m.note = (m.note ? m.note + "；" : "") + "2020限定团落选 · 总选加成+8（8月线上总选兑现）";
    }
    st.unit20.formed = true;
    st.flags.unit20Formed = true;
    st.heat = this.clamp(st.heat + 8, 0, 100);
    st.morale = this.clamp(st.morale + 2, 0, 100);
    this.addLog(st, st.month, "★限定团成团：" + sel.debut.map(m => m.name).join("、") + "（暂休一年）；未成团派遣成员 " + sel.bonus.length + " 人获总选加成（本月线上总选兑现）。", "main");
    this.save();
    return {
      text: "限定团成团名单公布：" + sel.debut.map(m => m.name).join("、") + "——暂休一年，随团活动。未成团的派遣成员（" + sel.bonus.length + " 人）获得总选加成+8——月底总选线上开榜，这份加成当场兑现。（热度+8 士气+2）",
      tone: "main",
    };
  },

  /* 【2019 主线⑤】借选秀余温布局外务（需 2018 选秀首轮录制完成） */
  advanceOutreach19() {
    const st = this.st, o = st.outreach19;
    if (o.done) return { text: "外务布局已经成体系落地。", tone: "blocked" };
    if (!st.show18 || !st.show18.done) return { text: "选秀首轮录制尚未完成——外务的东风还没起。", tone: "blocked" };
    o.done = true;
    st.flags.outreach19Done = true;
    const unitBonus = st.flags.unit19Formed ? 30 : 0;
    const gain = 60 + unitBonus;
    st.money += gain;
    st.heat = this.clamp(st.heat + 8, 0, 100);
    st.burden = this.clamp(st.burden + 6, 0, 100);
    this.addLog(st, st.month, "★主线⑤「借选秀余温布局外务」达成：综艺/代言/晚会打包签约，进账 " + gain + " 万。", "main");
    return { text: "外务打包签约落地：团综、代言、晚会三线并进，进账 " + gain + " 万" + (unitBonus ? "（含限定团评级加成 " + unitBonus + " 万）" : "") + "。（热度+8 叶盛负担+6）", tone: "main" };
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
        m.prepDown = st.era;   // 降格考察年 tag：本年度不参与汇报公演升格
        m.note = "2018组阁 · 编入预备生";
        prepped.push(m.name);
        this.addLog(st, st.month, m.name + " 组阁编入预备生（羁绊-4）。", "normal");
      } else if (t === "drop") {
        const bt = BR[brIdx++ % BR.length];
        m.status = "branch"; m.team = bt; m.branchTeam = bt; m.branchLabel = "";
        m.captain = false; m.vice = false; delete m.sub;
        m.bond = this.clamp((m.bond || 0) - 8, 1, 100);
        m.prepDown = st.era;   // 降格/发配考察年 tag：本年度不参与汇报公演升格
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

  /* 【2020·黄婷婷承诺线】兑现承诺（htt19=promise 专属，2019-12 待遇承诺的回收，
     同葛佳慧专辑事件处理口径）：年间须走访她至少 1 次（flags.httVisit20）、
     特训她至少 3 次（flags.httCoach20）后方可执行；需资金≥40万（资源倾斜）。
     落地旗标 flags.httPromise20Done。 */
  advanceHtt20() {
    const st = this.st;
    if (st.flags.httPromise20Done) return { text: "承诺已经兑现。", tone: "blocked" };
    const v = !!st.flags.httVisit20, c = st.flags.httCoach20 || 0;
    if (!v || c < 3) return { text: "承诺的账还没对完：走访她 " + (v ? 1 : 0) + "/1 · 特训她 " + c + "/3。", tone: "blocked" };
    if (st.money < 40) return { text: "资金不足（兑现承诺的资源倾斜需≥40万）。", tone: "blocked" };
    st.money -= 40;
    st.flags.httPromise20Done = true;
    const m = st.members.find(x => x.name === "黄婷婷");
    if (m) {
      m.pop = this.clamp(m.pop + 8, 0, 100);
      m.bond = this.clamp(m.bond + 12, 0, 100);
      m.note = (m.note ? m.note + "；" : "") + "2020 待遇承诺兑现（排班与外务透明化 · 走访1 特训3）";
    }
    st.heat = this.clamp(st.heat + 4, 0, 100);
    st.morale = this.clamp(st.morale + 5, 0, 100);
    this.addLog(st, st.month, "给黄婷婷的承诺兑现：待遇账本当面对清，排班与外务透明化公示。（热度+4 士气+5）", "gold");
    return { text: "兑现完成：资源倾斜公示后，粉圈难得地夸了一次运营。她把那本「一个月一个月地对」的账合上了——至少这一页，写满了。", tone: "main", vn: STORY.scenes20.httPromise20 };
  },

  /* ============================ 2020「共渡」线：疫情年 ============================
     由 2019 线结局「进入下一年」进入（carryTo2020）。
     经济特则（settle）：1~3 月收益停止、支出减半；4 月起支出恢复、收益减半。
     聚集类月度行动（剧场公演/队伍团建）1~3 月停办；云公演体系落地后替代公演。
     五条主线：①安置 CKG48/SHY48 成员（去年保住分团时）②防疫与返工 ③云公演
     ④与日方和平分手（仅复刻/日本模式）⑤一期生合约安置。 */
  carryTo2020() {
    const src = this.st;
    const members = src.members;
    const snapshot = members.map(m => ({
      name: m.name, team: m.team, status: m.status, branchTeam: m.branchTeam || null,
      pop: m.pop != null ? m.pop : null, bond: m.bond != null ? m.bond : null, hall: !!m.hall,
    }));
    const pwrBase = this.avgPwr(src);
    const st = {
      saveVersion: this.SAVE_VERSION,
      playerName: src.playerName,
      era: "2020",
      month: 1,
      ap: 4,
      money: src.money,
      heat: src.heat,
      morale: src.morale,
      train: src.train,
      burden: src.burden,
      debt: 0,
      members: members,
      log: [],
      flags: Object.assign({}, src.flags),
      decisions: Object.assign({}, src.decisions),
      branch: src.branch,
      branch17: src.branch17,
      orig: src.orig,
      prep18: src.prep18 || { sys: true, promoted: 0 },
      show18: src.show18,
      sm18: src.sm18,
      teb19: src.teb19,
      /* 2020 新主线状态 */
      covid20: { stage: 0, done: false },                          // 主线②：防疫与返工
      reorg20: { stage: 0, done: false },                          // 主线①：分团安置（去年保住分团时）
      cloud20: { stage: 0, done: false, held: 0 },                 // 主线③：云公演
      teb20: { done: false },                                      // 主线④：与日方和平分手（仅复刻线）
      gen1: { done: false },                                       // 主线⑤：一期生合约
      pwrBase: pwrBase,
      /* 总结任期：年初羁绊快照（算「年度喜爱成员」用）；年初资金走 history.money2019；
         termLog 本年抉择记录（UI 在选项生效时经 Game.logTermChoice 写入） */
      bondBase: members.reduce((o, m) => { o[m.name] = m.bond || 0; return o; }, {}),
      termLog: [],
      gePlan: 0, geDone: false, geResult: null,
      rtPlan: 0, rtDone: false, rtScore: 0,
      /* 总结任期：抉择记录全程继承 + 刚结束年份归档 */
      termLog: (src.termLog || []).slice(),
      termArchive: Object.assign({}, src.termArchive, src.era ? { [src.era]: this.termArchiveYear(src) } : {}),
      history: Object.assign({}, src.history, {
        roster2019: snapshot,
        money2019: src.money,
      }),
    };
    delete st.flags.monthStarted;
    delete st.flags.freePromo;
    /* 2019 一次性旗标不带入 2020 的判定流（保留在 history/decisions 中可回收） */
    delete st.flags.reorg19Done;
    delete st.flags.unit19Formed;
    delete st.flags.teb19RosterDone;
    /* 【2020·黄婷婷承诺线】年间计数旗标按年重置（htt19=promise 继承自 2019） */
    delete st.flags.httVisit20;
    delete st.flags.httCoach20;
    this.st = st;
    this.inheritRel(src, st);
    this.addLog(st, 1, "2019 年交卷，2020「共渡」开卷：疫情全国化，剧场停摆——1~3 月收益停止、支出减半；聚集类行动停办。年初实力均值 " + pwrBase + "。", "main");
    this.save();
    return st;
  },

  /* 【2020】保留旗号的分团（序章决策汇总）：孟波出资保住的旗号 + 兼任总监自费保留的旗号 */
  keptBranchFlags20(st) {
    st = st || this.st;
    const kept = [];
    if (st.decisions.mengbo20 === "CKG48" || st.decisions.mengbo20 === "SHY48") kept.push(st.decisions.mengbo20);
    if (st.decisions.self20Flag === "keep" && st.decisions.branchPost === "SHY48") kept.push("SHY48");
    return kept;
  },

  /* 【2020 主线②】防疫与返工：两段推进 */
  advanceCovid20() {
    const st = this.st, c = st.covid20;
    if (c.done) return { text: "防疫与返工体系已建成，各队伍按新制度运转中。", tone: "blocked" };
    if (c.stage === 0) {
      if (st.money < 20) return { text: "资金不足（防疫物资采购需20万）。", tone: "blocked" };
      st.money -= 20; c.stage = 1;
      st.morale = this.clamp(st.morale + 4, 0, 100);
      return { text: "防疫部署完成：物资采购到位，《疫情期运营管理办法》成文。（资金-20万 士气+4）", tone: "main", vn: STORY.scenes20.covidPlan };
    }
    if (c.stage === 1) {
      c.done = true; st.flags.covid20Done = true;
      st.morale = this.clamp(st.morale + 3, 0, 100);
      st.heat = this.clamp(st.heat + 2, 0, 100);
      st.burden = this.clamp(st.burden - 10, 0, 100);
      this.addLog(st, st.month, "★主线②「防疫与返工」达成：分批错峰返工落地，全年防疫台账建档。", "main");
      this.save();
      return { text: "防疫与返工安排全部落地：全团分三批错峰返工，零感染零事故。（士气+3 热度+2 负担-10）", tone: "main", vn: STORY.scenes20.rework };
    }
    return { text: "", tone: "none" };
  },

  /* 【2020 主线③】云公演：三段推进（策划案→技术测试→首场试播） */
  advanceCloud20() {
    const st = this.st, c = st.cloud20;
    if (c.done) { c.held += 1; return { text: "", tone: "none" }; }
    if (c.stage === 0) {
      c.stage = 1;
      return { text: "云公演策划案定稿：机位、推流、线上打投与弹幕应援体系全部立项。", tone: "main", vn: STORY.scenes20.cloudPlan };
    }
    if (c.stage === 1) {
      if (st.money < 20) return { text: "资金不足（技术与设备调试需20万）。", tone: "blocked" };
      st.money -= 20; c.stage = 2;
      return { text: "全流程彩排完成，推流稳定。（资金-20万）", tone: "main", vn: STORY.scenes20.cloudTest };
    }
    if (c.stage === 2) {
      c.done = true; c.held = 1; st.flags.cloud20Done = true;
      st.heat = this.clamp(st.heat + 6, 0, 100);
      st.morale = this.clamp(st.morale + 4, 0, 100);
      this.addLog(st, st.month, "★主线③「云公演」达成：首场试播落幕——此后「剧场公演」行动替换为「云公演」（线上开演）。", "main");
      this.save();
      return { text: "首场云公演试播成功：几十万人同时在线，弹幕像雪一样落下来。（热度+6 士气+4）", tone: "main", vn: STORY.scenes20.cloudLive };
    }
    return { text: "", tone: "none" };
  },

  /* 【2020 主线①】分团安置（CKG48/SHY48，去年保住分团时）：转交 UI 逐人定队窗。
     只能上调本部（SII/NII/HII/X，每队13~20同组阁）；保留旗号的分团可留任16人；
     其余移入 IDFT。落地在 applyReorg20。 */
  advanceReorg20() {
    const st = this.st, r = st.reorg20;
    if (r.done) return { text: "分团安置已完成，名单早已归档。", tone: "blocked" };
    if (!st.members.some(m => m.status === "branch" && (m.branchTeam === "SHY48" || m.branchTeam === "CKG48")))
      return { text: "当前没有待安置的 CKG48/SHY48 成员。", tone: "blocked" };
    r.stage = 1;
    return { text: "安置名单会议开始：每个人的去向，由总监逐人拍板。", tone: "pickReorg20" };
  },

  /* 【2020 主线①】分团安置落地（UI.showReorg20Picker 确认回调）：
     assign = { 成员id → "SII"|"NII"|"HII"|"X"|"XII"(保留时)|"stay"|"idft" }。
     stay 仅对保留旗号的分团开放（每团≤16人，无队伍编制 → 统一挂分团名，用户口径）；
     本部每队 13~20 人（现有人数+新上调；XII 保留时视同正常本部队伍，见 headTeams 口径）；
     未决定（null/缺失）的成员自动落 IDFT（2020 优化：UI 只点想上调的人，其余默认 IDFT，减少点击）。（羁绊-6）。
     完成后分团剧场关停（月收入终止）。 */
  applyReorg20(assign) {
    const st = this.st, r = st.reorg20;
    const pool = st.members.filter(m => m.status === "branch" && (m.branchTeam === "SHY48" || m.branchTeam === "CKG48"));
    if (!pool.length) return { text: "当前没有待安置的 CKG48/SHY48 成员。", tone: "blocked" };
    const TEAMS = this.headTeams(st);   // XII 保留时含 XII（用户规则：不得硬编码本部四队）
    const KEPT = this.keptBranchFlags20(st);
    assign = assign || {};
    /* 校验：全员分配、stay 限保留旗号且≤16人、本部每队13~20 */
    const cnt = {}; TEAMS.forEach(t => { cnt[t] = st.members.filter(m => m.status === "active" && m.team === t && !m.hall).length; });
    const stayCnt = { SHY48: 0, CKG48: 0 };
    let idftN = 0;
    for (const m of pool) {
      const t = assign[m.id];
      if (t === "idft" || t == null) idftN++;   // 未决定归属 → 自动落 IDFT（用户口径，减少玩家点击）
      else if (t === "stay") {
        if (KEPT.indexOf(m.branchTeam) < 0) return { text: m.branchTeam + " 的旗号已解散——其成员不能选择留任。" };
        stayCnt[m.branchTeam]++;
        if (stayCnt[m.branchTeam] > 16) return { text: m.branchTeam + " 留任 " + stayCnt[m.branchTeam] + " 人越界——保留旗号至多留任 16 人。" };
      } else if (TEAMS.indexOf(t) >= 0) { cnt[t]++; if (cnt[t] > 20) return { text: "Team " + t + " 编制 " + cnt[t] + " 人越界——本部每队上限 20 人。" }; }
      else return { text: "编制表无效（含未知去向）。" };
    }
    for (const t of TEAMS) if (cnt[t] < 13) return { text: "Team " + t + " 编制仅 " + cnt[t] + " 人——本部每队下限 13 人，请补足。" };
    /* 落地 */
    const upped = [], stayed = [], idft = [];
    for (const m of pool) {
      const t = assign[m.id];
      if (t === "stay") {
        m.branchLabel = m.branchTeam;   // 无队伍编制 → 统一挂分团名（用户口径，不叫预备生）
        m.note = "2020疫情 · 旗号留任（" + m.branchTeam + "）";
        m.bond = this.clamp((m.bond || 0) + 2, 1, 100);
        stayed.push(m.name);
      } else if (t === "idft" || t == null) {   // 未决定 → 自动落 IDFT
        m.status = "idft"; m.team = "IDFT"; m.branchTeam = null; m.branchLabel = null;
        m.captain = false; m.vice = false; delete m.sub;
        m.bond = this.clamp((m.bond || 0) - 6, 1, 100);
        m.note = "2020疫情 · 分团解散移籍IDFT";
        idft.push(m.name);
      } else {
        m.status = "active"; m.team = t; m.branchTeam = null; m.branchLabel = null;
        m.pop = this.clamp((m.pop || 0) + this.rnd(8, 14), 1, 100);
        m.bond = this.clamp((m.bond || 0) + 12, 1, 100);
        m.note = "2020疫情 · 自分团上调本部 Team " + t;
        upped.push(m.name);
      }
    }
    r.done = true; r.stage = 2; st.flags.reorg20Done = true;
    /* 分团剧场关停：月收入终止（保留旗号＝仅保留队伍名号与留任成员，无剧场收入） */
    if (st.branch17) { st.branch17.shyOpen = false; st.branch17.ckgOpen = false; }
    const text = "★主线①「安置分团成员」达成：上调本部 " + upped.length + " 人 · 旗号留任 " + stayed.length + " 人 · 移籍 IDFT " + idft.length + " 人。分团剧场正式关停，月收入终止。";
    this.addLog(st, st.month, text, "main");
    this.save();
    return { text: text, tone: "main", vn: STORY.scenes20.reorgDone20 };
  },

  /* 【2020 主线④】与日方和平分手（仅复刻线）：
     TEB48 已建成 → 先安置其成员（pickTeb20：上调本部四队或「返回日本」）；
     未建成 → 婉拒接手的叙事事件。分手后 TEB48 月收入终止。 */
  advanceTeb20() {
    const st = this.st, t = st.teb20;
    if (t.done) return { text: "与日方的分手事宜已经办妥。", tone: "blocked" };
    t.done = true; st.flags.teb20Done = true;
    if (st.teb19 && st.teb19.open) {
      st.teb19.open = false;   // 台北星梦剧院交还日方：月收入终止（安置窗确认后生效）
      return { text: "东京会谈日程已定——先安置台北的孩子们。", tone: "pickTeb20" };
    }
    st.burden = this.clamp(st.burden + 5, 0, 100);
    this.addLog(st, st.month, "★主线④「和平分手」达成：以财政压力为由婉拒接手 TEB48，并借此与日方谈妥和平分手。", "main");
    this.save();
    return { text: "你以财政压力为由正式婉拒了 TEB48 接手提案，并借此与日方谈妥和平分手——从此这条河按自己的规矩走。（叶盛负担+5）", tone: "main", vn: STORY.scenes20.tebNoTeb };
  },

  /* 【2020 主线④】TEB48 成员安置落地（UI.showTeb20Picker 确认回调）：
     assign = { 成员id → "SII"|"NII"|"HII"|"X"|"XII"(保留时)|"japan" }；japan = 离团备注返回日本。
     本部每队 13~20 人（XII 保留时视同正常本部队伍，见 headTeams 口径）。 */
  applyTeb20(assign) {
    const st = this.st;
    const pool = st.members.filter(m => m.status === "branch" && m.branchTeam === "TEB48");
    if (!pool.length) return { text: "当前没有待安置的 TEB48 成员。", tone: "blocked" };
    const TEAMS = this.headTeams(st);   // XII 保留时含 XII（用户规则：不得硬编码本部四队）
    assign = assign || {};
    const cnt = {}; TEAMS.forEach(t2 => { cnt[t2] = st.members.filter(m => m.status === "active" && m.team === t2 && !m.hall).length; });
    for (const m of pool) {
      const t2 = assign[m.id];
      if (t2 == null) return { text: "还有成员未分配去向（本部各队 / 返回日本）。" };
      if (TEAMS.indexOf(t2) >= 0) { cnt[t2]++; if (cnt[t2] > 20) return { text: "Team " + t2 + " 编制 " + cnt[t2] + " 人越界——本部每队上限 20 人。" }; }
      else if (t2 !== "japan") return { text: "编制表无效（含未知去向）。" };
    }
    for (const t2 of TEAMS) if (cnt[t2] < 13) return { text: "Team " + t2 + " 编制仅 " + cnt[t2] + " 人——本部每队下限 13 人，请补足。" };
    const upped = [], home = [];
    for (const m of pool) {
      const t2 = assign[m.id];
      if (t2 === "japan") {
        m.status = "left"; m.team = "TEB48"; m.branchTeam = null; m.branchLabel = null;
        m.note = "2020和平分手 · 返回日本";
        home.push(m.name);
      } else {
        m.status = "active"; m.team = t2; m.branchTeam = null; m.branchLabel = null;
        m.pop = this.clamp((m.pop || 0) + this.rnd(6, 12), 1, 100);
        m.bond = this.clamp((m.bond || 0) + 10, 1, 100);
        m.note = "2020和平分手 · 自TEB48上调本部 Team " + t2;
        upped.push(m.name);
      }
    }
    const text = "★主线④「和平分手」达成：TEB48 交还日方——上调本部 " + upped.length + " 人 · 返回日本 " + home.length + " 人。两岸的合作时代落幕。";
    this.addLog(st, st.month, text, "main");
    this.save();
    return { text: text, tone: "main", vn: STORY.scenes20.tebFarewell };
  },

  /* 【2020 主线⑤】一期生合约安置（UI.showGen1Picker 确认回调，用户口径改版·概率结算）：
     assign = { 成员id → "renew"|"grad"|"staff" }。选项均按概率结算，未成功者自动按毕业路线处理：
     · renew = 说服续约：基础 50%；成员在小分队（HO2/BlueV/DEMOON/7SENSES）中时 85%；
       进入过历届总选前三（flags.geTop3All，resolveGE 历年累积）时提升至 65%
       （低于小分队加成；与小分队同时满足取 85%）。
     · staff = 转为工作人员：基础 50%；羁绊≥70 时提升至 75%。
     · 落地分类（用户口径）：毕业（含续约/转岗未成自动转毕业）→「荣誉毕业生」分类
       （m.honorGrad，status=left，不再视为在籍）；续约成功或转岗成功 →「丝芭传媒」分类
       （m.siba：续约者 status=left、转岗者 status=staff，均不再视为在籍）。 */
  applyGen1(assign) {
    const st = this.st;
    const pool = st.members.filter(m => m.gen === "一期生" && (m.status === "active" || m.status === "rest")
      && !(m.name === "赵嘉敏" && st.decisions.zhaoMin === "study"));
    if (!pool.length) return { text: "当前没有合约到期的一期生。", tone: "blocked" };
    assign = assign || {};
    for (const m of pool) {
      const t = assign[m.id];
      if (t !== "renew" && t !== "grad" && t !== "staff") return { text: "还有一期生未拍板去留（续约 / 毕业 / 工作人员）。" };
    }
    const inUnit = m => !!this.memberSubUnit(st, m.name) || (m.note || "").indexOf("7SENSES") >= 0;
    const top3Ever = m => (st.flags.geTop3All || []).indexOf(m.name) >= 0;
    const by = { renew: [], grad: [], staff: [], fail: [] };
    for (const m of pool) {
      const t = assign[m.id];
      m.captain = false; m.vice = false; delete m.sub;
      if (t === "renew") {
        const rate = inUnit(m) ? 0.85 : top3Ever(m) ? 0.65 : 0.5;
        if (Math.random() < rate) {
          m.status = "left"; m.siba = true;
          m.note = "2020 · 一期生合约续签（丝芭传媒签约艺人，剧场在籍名册除名）";
          by.renew.push(m.name);
        } else {
          m.status = "left"; m.honorGrad = true;
          m.note = "2020 · 续约未谈拢，合约期满毕业（荣誉毕业生）";
          by.grad.push(m.name); by.fail.push(m.name);
        }
      } else if (t === "grad") {
        m.status = "left"; m.honorGrad = true;
        m.note = "2020 · 一期生合约期满毕业（荣誉毕业生）";
        by.grad.push(m.name);
      } else {
        const rate = (m.bond || 0) >= 70 ? 0.75 : 0.5;
        if (Math.random() < rate) {
          m.status = "staff"; m.siba = true;
          m.note = "2020 · 一期生转任工作人员（丝芭传媒）";
          by.staff.push(m.name);
        } else {
          m.status = "left"; m.honorGrad = true;
          m.note = "2020 · 转岗未谈拢，合约期满毕业（荣誉毕业生）";
          by.grad.push(m.name); by.fail.push(m.name);
        }
      }
    }
    st.gen1.done = true; st.flags.gen1Done = true;
    const text = "★主线⑤「一期生合约安置」达成：续约成功 " + by.renew.length + " 人 · 转任工作人员成功 " + by.staff.length
      + " 人 · 毕业 " + by.grad.length + " 人（其中续约/转岗未谈拢自动转毕业 " + by.fail.length + " 人）。半部历史的册页，轻轻合上了。";
    this.addLog(st, st.month, text, "main");
    this.save();
    return { text: text, tone: "main" };
  },

  /* 【2020】年度评分：安置(25)+防疫返工(15)+云公演(20)+一期生(15)+分手(10，仅复刻线)
     + 实力成长(10)+热度/4(≤10)+士气/10(≤5)+资金/60(≤5) − 赤字10 → S≥85 / A≥65 / B≥50 / C */
  computeGrade20(st) {
    st = st || this.st;
    let score = 0;
    // ① 分团安置（25）：仅去年保住分团时计入
    if (st.decisions.branch19Keep === "keep") {
      if (st.reorg20.done) score += 25;
      else if (st.reorg20.stage >= 1) score += 8;
    } else score += 15;   // 去年已善后：直接计安置分
    // ② 防疫与返工（15）
    if (st.covid20.done) score += 15;
    else if (st.covid20.stage >= 1) score += 6;
    // ③ 云公演（20）
    if (st.cloud20.done) score += st.cloud20.held >= 3 ? 20 : 12;
    else if (st.cloud20.stage >= 1) score += 6;
    // ④ 一期生合约（15）
    if (st.gen1.done) score += 15;
    // ⑤ 和平分手（10，仅复刻线）
    if (this.isReplicate(st) && st.teb20.done) score += 10;
    // ⑥ 成员实力成长（10）
    score += this.clamp(Math.round((this.avgPwr(st) - (st.pwrBase || 0)) * 2), 0, 10);
    // ⑦ 资源面
    score += Math.min(10, Math.round(st.heat / 4));
    score += Math.min(5, Math.round(st.morale / 10));
    score += Math.min(5, Math.floor(st.money / 60));
    if (st.debt >= 1) score -= 10;

    if (score >= 85) return "S";
    if (score >= 65) return "A";
    if (score >= 50) return "B";
    return "C";
  },

  /* 【预备生汇报公演】本年度组阁中刚被降格/发配的成员不参与升格候选：
     ① 正式队 → 预备生（编入预备生）；② 本部/分团 → 分团（落编移籍、发配分团、
     移交改派分团）——刚被编制会重新安置的孩子需要一整年重新证明自己。
     双口径识别：新档读 prepDown 年份 tag（applyReorg18/19 落笔时写入）；
     旧档无 tag，用成员卡 note 前缀年份 + 降格/发配关键词兑底。
     注：分团成员转预备生属于上调红利通道，不视为降格、不受此限。 */
  isPrepDownThisYear(m, st) {
    st = st || this.st;
    if (!m) return false;
    const inScope = m.team === "PREP" || m.status === "branch";
    if (!inScope) return false;
    if (m.prepDown === st.era) return true;
    if (typeof m.note !== "string" || m.note.indexOf(st.era) !== 0) return false;
    return ["编入预备生", "落编", "发配", "移籍"].some(k => m.note.indexOf(k) >= 0);
  },

  /* 【2018 主线②】预备生汇报公演：月度事件回调——表现优异者升格（含分团预备生上调本部） */
  promotePrep18(id, team) {
    const st = this.st;
    const m = st.members.find(x => x.id === id);
    if (!m) return { text: "未找到该成员。", tone: "blocked" };
    if (this.isPrepDownThisYear(m, st)) return { text: m.name + " 本年度刚经组阁降入预备生/分团，暂不参与汇报公演升格。", tone: "blocked" };
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

  /* 【2018/2019 主线②】预备生汇报公演批量升格：assign = { [memberId]: team }。
     候选取 prepStageCandidates 加权前 2 位（每次公演升格 2 人）；
     逐人走 promotePrep18（分团上调/本部升格加成与计数逻辑不变）。
     去向经 headTeams 口径：XII 保留时 XII 亦可作为升格目标。 */
  promotePrepStage(assign) {
    const st = this.st;
    const targets = this.prepStageCandidates(st).slice(0, 2);
    if (!targets.length) return { text: "当前没有待升格的预备生。", tone: "blocked" };
    const TEAM = this.headTeams(st).concat(["FT"]);
    const tNames = "SII / NII / HII / X" + (this.keptXiiInRoster(st) ? " / XII" : "") + (st.flags.ftFormed ? " / FT" : "");
    for (const m of targets) {
      const t = assign ? assign[m.id] : null;
      if (!t || TEAM.indexOf(t) < 0) return { text: "还有成员未分配队伍（" + tNames + "）。" };
    }
    const texts = targets.map(m => this.promotePrep18(m.id, assign[m.id]).text);
    this.save();
    return { text: texts.join(""), tone: "main" };
  },

  /* 【2018 主线②】预备生汇报公演候选：本部 PREP + 分团预备生（含旗号留任挂分团名的成员——
     两者同为分团预备生口径，仅建卡新期生挂「预备生」、留任成员挂分团名以作区分）。
     本年度组阁中刚被降格/发配的成员不列入（isPrepDownThisYear）。
     确定性排序（pwr×2 + 人气 + 羁绊×0.5 加权）取前 3——pages 与裁决 effect 两次调用
     必须指向同一位成员，故不用随机。 */
  prepStageCandidates(st) {
    const pool = st.members.filter(m => (m.team === "PREP" || (m.status === "branch" && (m.branchLabel === "预备生" || m.branchLabel === "" || m.branchLabel === m.branchTeam)))
      && m.status !== "left" && m.name && !this.isPrepDownThisYear(m, st));
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
    if (b.stage === 1 && st.money < 220) return "资金不足（武汉剧场需≥220万）";
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
      st.money -= 200; b.stage = 2;
      return { text: "武汉星梦剧院改造开工：长江边的商圈顶层，第五座支流剧院破土动工。（资金-200万）", tone: "main", vn: STORY.scenes27.whTheater };
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
  /* 【2018 通用】《国风美少年》内推名额落地：被选中者人气+5 羁绊+3；
     热度+8 资金+20万 士气+2；名单记入 decisions.guofeng18（殿堂偶像任导师）。 */
  guofeng18Pick(id) {
    const st = this.st;
    st.flags.guofeng18 = true;
    const m = st.members.find(x => x.id === id);
    if (!m || m.status === "left" || m.status === "rest" || m.hall) return { text: "该成员无法参赛。", tone: "blocked" };
    m.pop = this.clamp(m.pop + 5, 0, 100);
    m.bond = this.clamp(m.bond + 3, 0, 100);
    st.heat = this.clamp(st.heat + 8, 0, 100);
    st.money += 20;
    st.morale = this.clamp(st.morale + 2, 0, 100);
    this.recordDecision("guofeng18", m.name);
    const hall = st.members.find(x => x.hall && x.status === "active");
    this.addLog(st, st.month, "★《国风美少年》：" + (hall ? hall.name : "殿堂偶像") + " 担任导师，" + m.name + " 内推参赛（热度+8 资金+20万）。", "main");
    return { text: "官宣当天，「殿堂偶像坐镇导师席」和「内推名单里那个名字」同时上了热搜——国风舞台的首秀，这条河没缺席。（" + m.name + " 人气+5 羁绊+3；热度+8 资金+20万 士气+2）", tone: "main" };
  },

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

  /* ========================================================================
     成员关系 & 队伍磨合度系统（v0.13.0 · 全线通用）
     --------------------------------------------------------------------------
     【队伍磨合度】st.chem（key = 本部队名 / "PREP" / 分团名）+ st.chemStable（稳定月数）：
       · 初始值由队伍成员的【人气·实力均匀度】决定——成员越接近，初始磨合越高；
       · 队伍连续三个月未发生人员变动（退团除外）后，每月磨合度 +1（稳定加成）；
       · 任何人员变动（预备生升格 / 移籍 / 组阁 / 新人入队 / 暂休与归队等）都会
         重算该队磨合度初始值并清零稳定加成；队伍人员退团不重算、不加成不清零。
       · 变动检测采用「队伍成员指纹」对比（syncTeams）：所有改队伍的代码路径
         （组阁 / 移籍 / 升格 / 招新 / 淘汰……）无需逐一埋点，月末统一结算。
     【成员关系】挂在成员卡上（m.rels[对方id]，双向同步），0-100：
       · 初始值：同队队友 52，其他成员 40（略高）；预备生时期不计成员关系；
       · 两名成员在同一队伍效力每满半年，关系 +1；
       · 在磨合度 <40 的低磨合队伍效力，每月每人随机与一位队友关系 -1（轻微磨损）。
       关系数据随 members 数组跨年继承自动保留；磨合度由 inheritRel 沿用。
     ========================================================================== */

  REL_BASE_OTHER: 40,    // 成员关系初始值：非同队
  REL_BASE_TEAM: 52,     // 成员关系初始值：同队队友（略高）
  REL_CHEM_LOW: 40,      // 低磨合度阈值（低于此值触发每月关系磨损）

  /* 成员当前所属队伍 key（本部队名 / PREP / 分团名；殿堂·暂休·离团·IDFT 无队伍） */
  teamKeyOf(m) {
    if (!m || m.hall) return null;
    if (m.status === "active") return m.team || null;
    if (m.status === "branch") return m.branchTeam || null;
    return null;
  },

  teamRoster(st, key) {
    return st.members.filter(m => this.teamKeyOf(m) === key);
  },

  /* 磨合度初始值：成员人气/实力越均匀（离散度越低），初始磨合越高。
     无实力系统的年代线（2016/2026）只按人气均匀度计。 */
  calcChem(st, key) {
    const list = this.teamRoster(st, key);
    if (list.length < 2) return 60;
    const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
    const mad = a => mean(a.map(v => Math.abs(v - mean(a))));
    const popDev = mad(list.map(m => m.pop || 0));
    const pwrList = list.map(m => m.pwr).filter(v => v != null);
    const pwrDev = pwrList.length >= 2 ? mad(pwrList) : null;
    const chem = 88 - popDev * 1.1 - (pwrDev != null ? pwrDev * 0.8 : 0);
    return Math.round(this.clamp(chem, 15, 90));
  },

  /* 【2016 团建链·用户口径】本部队伍按磨合度升序（在册≥1人；exclude 排除项，
     如 2 月观察轮排除 Team NII——NII 留给 3 月固定团建） */
  chemRankedHQ(st, exclude) {
    st = st || this.st;
    exclude = exclude || [];
    return this.headTeams(st)
      .filter(t => exclude.indexOf(t) < 0 && this.teamRoster(st, t).length > 0)
      .map(t => {
        if (st.chem[t] == null) { st.chem[t] = this.calcChem(st, t); st.chemStable[t] = st.chemStable[t] || 0; }
        return { team: t, chem: st.chem[t] };
      })
      .sort((a, b) => a.chem - b.chem || (a.team < b.team ? -1 : 1));
  },

  /* 【2016 团建链】剩余待团建队伍（排除 NII 与 2 月已建队伍，按磨合度升序；
     4/5/6 月依序各取一队自动触发） */
  tbRest16(st) {
    st = st || this.st;
    const done = st.flags.tbBld16Done || [];
    const feb = st.decisions.tbLow16 && st.decisions.tbLow16 !== "skip" ? [st.decisions.tbLow16] : [];
    return this.chemRankedHQ(st, ["NII"].concat(feb)).map(r => r.team).filter(t => done.indexOf(t) < 0);
  },

  /* 【2016 团建链】自动团建落地（与行动 teamBld 同效：资金-15万（余额不足免收）、
     磨合度+6、士气+2、随机队友关系+1） */
  autoTeamBld(st, team) {
    if (st.money >= 15) st.money -= 15;
    if (st.chem[team] == null) { st.chem[team] = this.calcChem(st, team); st.chemStable[team] = st.chemStable[team] || 0; }
    st.chem[team] = Math.min(100, st.chem[team] + 6);
    st.morale = this.clamp(st.morale + 2, 0, 100);
    const list = this.teamRoster(st, team).filter(m => !m.hall);
    for (const m of list) {
      const mates = list.filter(x => x.id !== m.id);
      if (mates.length) this.relAdd(st, m.id, mates[this.rnd(0, mates.length - 1)].id, 1);
    }
    return team + " 团建圆满结束——磨合度+6（现 " + st.chem[team] + "），队内气氛明显升温（士气+2）。";
  },

  /* 人员变动检测：对比每支队伍的成员指纹。
     纯退团（无新增、离开者全部 status='left'）只更新指纹——磨合度与稳定加成保留；
     其余变动重算磨合度初始值并清零稳定计数。 */
  syncTeams(st) {
    if (!st.chem) st.chem = {};
    if (!st.chemStable) st.chemStable = {};
    if (!st.chemFp) st.chemFp = {};
    const keys = new Set();
    for (const m of st.members) { const k = this.teamKeyOf(m); if (k) keys.add(k); }
    for (const k of keys) {
      const fp = this.teamRoster(st, k).map(m => m.id).sort().join(",");
      const old = st.chemFp[k];
      if (old === fp) continue;
      st.chemFp[k] = fp;
      if (old != null) {
        const oldSet = old ? old.split(",") : [];
        const newSet = fp ? fp.split(",") : [];
        const added = newSet.filter(id => oldSet.indexOf(id) < 0);
        const removed = oldSet.filter(id => newSet.indexOf(id) < 0);
        const onlyLeft = added.length === 0 && removed.length > 0 && removed.every(id => {
          const m = st.members.find(x => x.id === id);
          return m && m.status === "left";
        });
        if (onlyLeft) continue;   // 纯退团：不重算、不清加成
      }
      st.chem[k] = this.calcChem(st, k);
      st.chemStable[k] = 0;
    }
  },

  /* 遍历同队（非预备生、非殿堂）成员两两组合 */
  eachTeamPair(st, fn) {
    const groups = {};
    for (const m of st.members) {
      const k = this.teamKeyOf(m);
      if (!k || k === "PREP") continue;   // 预备生时期不计成员关系
      (groups[k] = groups[k] || []).push(m);
    }
    for (const k in groups) {
      const list = groups[k];
      for (let i = 0; i < list.length; i++)
        for (let j = i + 1; j < list.length; j++)
          fn(list[i], list[j], k);
    }
  },

  relKey(a, b) { return a < b ? a + "|" + b : b + "|" + a; },

  /* 读取关系值（懒初始化：同队队友 52 / 其他成员 40） */
  relGet(st, aId, bId) {
    const ma = st.members.find(m => m.id === aId);
    const mb = st.members.find(m => m.id === bId);
    if (!ma || !mb) return null;
    const k = this.relKey(aId, bId);
    if (!ma.rels) ma.rels = {};
    if (ma.rels[k] == null) {
      const ka = this.teamKeyOf(ma), kb = this.teamKeyOf(mb);
      ma.rels[k] = (ka && ka === kb) ? this.REL_BASE_TEAM : this.REL_BASE_OTHER;
      if (!mb.rels) mb.rels = {};
      mb.rels[k] = ma.rels[k];
    }
    return ma.rels[k];
  },

  relAdd(st, aId, bId, d) {
    const v = this.relGet(st, aId, bId);
    if (v == null) return;
    const nv = this.clamp(v + d, 0, 100);
    const k = this.relKey(aId, bId);
    const ma = st.members.find(m => m.id === aId);
    const mb = st.members.find(m => m.id === bId);
    if (ma) { if (!ma.rels) ma.rels = {}; ma.rels[k] = nv; }
    if (mb) { if (!mb.rels) mb.rels = {}; mb.rels[k] = nv; }
  },

  /* 初始化 / 旧档追补（新开局、读档共用；跨年继承走 inheritRel） */
  initRelSystem(st) {
    if (!st.chem) st.chem = {};
    if (!st.chemStable) st.chemStable = {};
    if (!st.chemFp) st.chemFp = {};
    if (st.relMonths == null) st.relMonths = 0;
    this.syncTeams(st);
    /* 首次启用：预置同队队友初始关系（略高于其他成员） */
    if (!st.relSeeded) {
      this.eachTeamPair(st, (a, b) => { this.relGet(st, a.id, b.id); });
      st.relSeeded = true;
    }
  },

  /* 跨年继承：磨合度/稳定计数沿用（成员卡上的关系随 members 数组自动保留）；
     年初编制若有变动，syncTeams 会自动重算受影响队伍 */
  inheritRel(src, st) {
    st.chem = src.chem ? Object.assign({}, src.chem) : {};
    st.chemStable = src.chemStable ? Object.assign({}, src.chemStable) : {};
    st.chemFp = src.chemFp ? Object.assign({}, src.chemFp) : {};
    st.relMonths = src.relMonths || 0;
    st.relSeeded = !!src.relSeeded;
    this.syncTeams(st);
  },

  /* 月度推进（endMonth 调用）：稳定加成 / 半年关系增长 / 低磨合磨损 */
  tickRelations(st) {
    this.initRelSystem(st);
    this.syncTeams(st);
    /* ① 稳定加成：连续三个月无人员变动（退团除外）→ 每月磨合 +1 */
    for (const k in st.chem) {
      st.chemStable[k] = (st.chemStable[k] || 0) + 1;
      if (st.chemStable[k] >= 3) st.chem[k] = Math.min(100, st.chem[k] + 1);
    }
    /* ② 成员关系：同队效力每满半年 +1（预备生不计） */
    st.relMonths = (st.relMonths || 0) + 1;
    if (st.relMonths >= 6) {
      st.relMonths = 0;
      this.eachTeamPair(st, (a, b) => { this.relAdd(st, a.id, b.id, 1); });
    }
    /* ③ 低磨合队伍：每月每人随机与一位队友关系 -1（轻微磨损） */
    for (const k in st.chem) {
      if (st.chem[k] == null || st.chem[k] >= this.REL_CHEM_LOW || k === "PREP") continue;
      const list = this.teamRoster(st, k);
      for (const m of list) {
        const mates = list.filter(x => x.id !== m.id);
        if (!mates.length) continue;
        this.relAdd(st, m.id, mates[this.rnd(0, mates.length - 1)].id, -1);
      }
    }
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
    /* 总结任期字段兑底（老存档）：抉择记录 / 年初羁绊快照缺失时按空账处理 */
    if (!Array.isArray(st.termLog)) st.termLog = [];
    if (!st.bondBase) st.bondBase = {};
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
    /* 【去重】同名非离团卡只保留最早一张——历史版本月末重入曾生成重复卡
       （2018 组阁预备生栏整列重复的根因；已成长的旧卡数值更完整，留首张） */
    if (st.members && st.members.length) {
      const seen = {};
      st.members = st.members.filter(m => {
        if (m.status === "left") return true;                 // 离团卡同名共存允许（如再入团）
        if (seen[m.name]) return false;
        seen[m.name] = true;
        return true;
      });
    }
    /* 【旧档兼容】2020 线分团 TOP1 名单：v0.14.0 前为单名字符串 → 统一转为数组 */
    if (st.flags && typeof st.flags.ge20BranchTop1 === "string") st.flags.ge20BranchTop1 = [st.flags.ge20BranchTop1];
    /* 【v0.13.0】旧档追补：初始化成员关系 & 队伍磨合度（首次读档时预置同队初始关系） */
    this.initRelSystem(st);
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

  /* 【2019 通用】小分队成军·官方钦点（UI 点将回调，pickMode demoonpick）：
     DEMOON 七人；选中者小分队成军曝光（人气+5 羁绊+5，成员卡备注），名单存姓名
     （decisions.unitsDemoon）供后续剧情回收（memberSubUnit/dissolveSubUnit19）。 */
  setDemoon19(ids) {
    const st = this.st;
    const members = (ids || []).map(id => st.members.find(m => m.id === id)).filter(Boolean);
    if (members.length !== 7) return { text: "名单无效（DEMOON 需 7 人）。", tone: "blocked" };
    st.decisions.unitsDemoon = members.map(m => m.name);
    for (const m of members) {
      m.pop = this.clamp((m.pop || 0) + 5, 0, 100);
      m.bond = this.clamp((m.bond || 0) + 5, 0, 100);
      m.note = (m.note ? m.note + "；" : "") + "SNH48小分队DEMOON成员（官方钦点成军）";
    }
    this.addLog(st, st.month, "小分队 DEMOON 名单公布（官方钦点）：" + members.map(m => m.name).join("、") + "。", "main");
    this.save();
    return { text: "DEMOON 名单敲定：" + members.map(m => m.name).join("、") + "。小分队成军曝光（每人人气+5 羁绊+5）。", tone: "main" };
  },

  /* 【2019 通用】成员所属小分队查询（HO2/BlueV/DEMOON，按成员卡备注识别；不在则返回 null）。 */
  memberSubUnit(st, name) {
    const m = st.members.find(x => x.name === name);
    if (!m) return null;
    if ((m.note || "").indexOf("SNH48小分队HO2成员") >= 0) return "HO2";
    if ((m.note || "").indexOf("SNH48小分队BlueV成员") >= 0) return "BlueV";
    if ((m.note || "").indexOf("SNH48小分队DEMOON成员") >= 0) return "DEMOON";
    return null;
  },

  /* 【2019 通用】小分队解散（成员兼任分团/离团导致活动终止，冯薪朵兼任/葛佳慧解约/
     黄婷婷解约路线回收）：旗标登记 flags.unitsDissolved19，全队备注追加解散记录，
     写入年志；返回追加到事件文案末尾的提示（未在队/已解散返回空串）。 */
  dissolveSubUnit19(st, unit) {
    if (!unit || (st.flags.unitsDissolved19 || []).indexOf(unit) >= 0) return "";
    st.flags.unitsDissolved19 = (st.flags.unitsDissolved19 || []).concat(unit);
    const mark = "SNH48小分队" + unit + "成员";
    /* 名单来源：decisions.unitsHO2/unitsBlueV/unitsDemoon（点将存名）+ 成员卡备注（打投/钦点成军），取并集 */
    const listKey = unit === "HO2" ? "unitsHO2" : unit === "DEMOON" ? "unitsDemoon" : "unitsBlueV";
    const byList = ((st.decisions && st.decisions[listKey]) || []);
    const names = [];
    for (const m of st.members) {
      if ((m.note || "").indexOf(mark) >= 0 || byList.indexOf(m.name) >= 0) {
        names.push(m.name);
        if ((m.note || "").indexOf(unit + "解散") < 0) {
          m.note = (m.note ? m.note + "；" : "") + "2019 · 小分队" + unit + "解散（活动终止）";
        }
      }
    }
    this.addLog(st, st.month, "小分队 " + unit + " 解散（活动终止）：原成员 " + names.join("、") + "。", "main");
    return "\n\n同日，官网挂出一行小字：小分队 " + unit + " 活动终止——" + (names.length ? "原成员（" + names.join("、") + "）的" : "") + "小分队日程全部下线。（小分队 " + unit + " 解散）";
  },

  /* 【2020 通用·小分队补员】可补员小分队查询：HO2（2人）/BlueV（5人）/DEMOON（7人）。
     口径：粉丝一票票投出/钦点的原成员不可替换——只统计仍在籍（active）的原成员，
     空缺可补足至编制上限；2019 已解散（flags.unitsDissolved19）或无在籍成员的小分队
     不在补员范围。返回 [{ unit, cur:[在籍原成员名], vac:空缺数 }]。 */
  unitFill20Info(st) {
    const CAP = { HO2: 2, BlueV: 5, DEMOON: 7 };
    const dissolved = st.flags.unitsDissolved19 || [];
    const out = [];
    for (const unit of ["HO2", "BlueV", "DEMOON"]) {
      if (dissolved.indexOf(unit) >= 0) continue;
      const mark = "SNH48小分队" + unit + "成员";
      const listKey = unit === "HO2" ? "unitsHO2" : unit === "DEMOON" ? "unitsDemoon" : "unitsBlueV";
      const byList = st.decisions[listKey] || [];
      const cur = st.members.filter(m => m.status === "active" &&
        (((m.note || "").indexOf(mark) >= 0 && (m.note || "").indexOf(unit + "解散") < 0) || byList.indexOf(m.name) >= 0));
      const vac = CAP[unit] - cur.length;
      if (cur.length > 0 && vac > 0) out.push({ unit: unit, cur: cur.map(m => m.name), vac: vac });
    }
    return out;
  },

  /* 【2020 通用·小分队补员】落地（UI.showUnitFill20Picker 链式点将回调，pickMode="unitFill20"）：
     assign = { unit → [新成员id…] }；逐队校验人数与资格（本部在籍/非殿堂/未属其他小分队）；
     生效：补员成员人气+3 羁绊+4（云固粉曝光），备注登记；名单并入 decisions.units* 供后续回收；
     全团热度+4 士气+2；旗标 flags.unitFill20Done / 决策标签 unitFill20=fill。 */
  applyUnitFill20(assign) {
    const st = this.st;
    if (st.flags.unitFill20Done) return { text: "小分队补员已经收官。", tone: "blocked" };
    const info = this.unitFill20Info(st);
    assign = assign || {};
    const added = {};
    for (const it of info) {
      const members = (assign[it.unit] || []).map(id => st.members.find(m => m.id === id)).filter(Boolean);
      if (members.length !== it.vac) return { text: it.unit + " 补员名单无效（需 " + it.vac + " 人）。", tone: "blocked" };
      for (const m of members) {
        if (m.status !== "active" || m.hall || this.memberSubUnit(st, m.name))
          return { text: m.name + " 不可入队（需本部在籍、非荣誉殿堂、未属其他小分队）。", tone: "blocked" };
      }
      added[it.unit] = members;
    }
    for (const unit in added) {
      const key = unit === "HO2" ? "unitsHO2" : unit === "DEMOON" ? "unitsDemoon" : "unitsBlueV";
      for (const m of added[unit]) {
        m.pop = this.clamp((m.pop || 0) + 3, 0, 100);
        m.bond = this.clamp((m.bond || 0) + 4, 0, 100);
        m.note = (m.note ? m.note + "；" : "") + "SNH48小分队" + unit + "成员（2020疫情补员·云固粉）";
        if ((st.decisions[key] || []).indexOf(m.name) < 0) st.decisions[key] = (st.decisions[key] || []).concat(m.name);
      }
      this.addLog(st, st.month, "小分队 " + unit + " 补员名单公布：" + added[unit].map(m => m.name).join("、") + "（原成员保留）。", "main");
    }
    st.heat = this.clamp(st.heat + 4, 0, 100);
    st.morale = this.clamp(st.morale + 2, 0, 100);
    st.flags.unitFill20Done = true;
    st.decisions.unitFill20 = "fill";
    this.save();
    const lines = info.map(it => it.unit + " 补员 " + it.vac + " 人：" + added[it.unit].map(m => m.name).join("、") + "（原成员 " + it.cur.join("、") + " 保留）");
    return { text: "小分队补员收官——名单照旧、人心照齐：\n" + lines.join("\n") + "\n\n（决策已登记：unitFill20=fill。补员成员每人人气+3 羉绊+4；热度+4 士气+2。）", tone: "main" };
  },

  /* 【2020·9月事件①】电商女团浪彩少女AW9（按用户口径挂载，2020-09 史实锚点）：
     ① 史实正式成员九人自动挂载（陆婷/莫寒/戴萌/苏杉杉/钱蓓婷/刘增艳/张雨鑫/张怡/刘倩倩），
        不在籍（离团/暂休/IDFT 等）者跳过，不得虚构；分团在册者兼任不调动；
     ② 总监钦点九位预备役（UI.showAW9Picker，pickMode="aw9pick"）：
        全团在册（本部/分团 active/branch）、非殿堂、未属 AW9 者皆可选。
     名单存姓名（decisions.unitsAW9 / unitsAW9R）供后续回收；旗标 flags.aw9Formed。 */
  AW9_HIST: ["陆婷", "莫寒", "戴萌", "苏杉杉", "钱蓓婷", "刘增艳", "张雨鑫", "张怡", "刘倩倩"],

  setAW9Reserve(ids) {
    const st = this.st;
    if (st.flags.aw9Formed) return { text: "浪彩少女AW9 已经成团。", tone: "blocked" };
    /* ① 史实正式成员挂载（不在籍跳过） */
    const joined = [], skipped = [];
    for (const name of this.AW9_HIST) {
      const m = st.members.find(x => x.name === name);
      if (m && (m.status === "active" || m.status === "branch") && (m.note || "").indexOf("浪彩少女AW9") < 0) {
        m.pop = this.clamp((m.pop || 0) + 4, 0, 100);
        m.bond = this.clamp((m.bond || 0) + 4, 0, 100);
        m.note = (m.note ? m.note + "；" : "") + "电商女团浪彩少女AW9成员（2020-09 史实锚点挂载" + (m.status === "branch" ? "·兼任" : "") + "）";
        joined.push(name);
      } else skipped.push(name);
    }
    st.decisions.unitsAW9 = joined;
    /* ② 总监钦点九位预备役 */
    const reserve = (ids || []).map(id => st.members.find(m => m.id === id)).filter(Boolean);
    if (reserve.length !== 9) return { text: "预备役名单无效（需 9 人）。", tone: "blocked" };
    for (const m of reserve) {
      if (!(m.status === "active" || m.status === "branch") || m.hall || (m.note || "").indexOf("浪彩少女AW9") >= 0)
        return { text: m.name + " 不可入预备役（需在册、非荣誉殿堂、未属 AW9）。", tone: "blocked" };
    }
    for (const m of reserve) {
      m.pop = this.clamp((m.pop || 0) + 3, 0, 100);
      m.bond = this.clamp((m.bond || 0) + 3, 0, 100);
      m.note = (m.note ? m.note + "；" : "") + "浪彩少女AW9预备役（2020-09 总监钦点）";
    }
    st.decisions.unitsAW9R = reserve.map(m => m.name);
    st.flags.aw9Formed = true;
    st.heat = this.clamp(st.heat + 6, 0, 100);
    st.morale = this.clamp(st.morale + 2, 0, 100);
    this.syncTeams(st);
    this.addLog(st, st.month, "电商女团「浪彩少女AW9」官宣：正式成员 " + joined.join("、") + "；预备役 " + reserve.map(m => m.name).join("、") + "。", "main");
    this.save();
    return { text: "浪彩少女AW9 官宣——电商直播间与云公演体系并网。\n正式成员（" + joined.length + " 人）：" + joined.join("、") +
      (skipped.length ? "\n不在籍，未挂载：" + skipped.join("、") : "") +
      "\n预备役（总监钦点 9 人）：" + reserve.map(m => m.name).join("、") +
      "\n\n（正式成员每人人气+4 羉绊+4；预备役每人人气+3 羁绊+3；热度+6 士气+2。）", tone: "main" };
  },

  /* 【2016·3月事件】毕志飞导演电影《纯洁心灵·逐梦演艺圈》同名主题曲 MV 邀约
     （用户口径，同人演绎）：点将一支队伍全员参演 MV；婉拒不进本函数。
     参演队伍在册成员：人气+2 实力+1 羁绊+2（MV 拍摄历练），通告费 +20万；热度+3。
     落地队伍记入 decisions.zhumeng16（队名），旗标 flags.zhumeng16Done 防重触发。 */
  applyZhumeng16(teamKey) {
    const st = this.st;
    if (st.flags.zhumeng16Done) return { text: "《纯洁心灵·逐梦演艺圈》主题曲 MV 邀约已有结论。", tone: "blocked" };
    const roster = st.members.filter(m => m.status === "active" && m.team === teamKey);
    if (!roster.length) return { text: "该队伍没有在册成员。", tone: "blocked" };
    for (const m of roster) {
      m.pop = this.clamp((m.pop || 0) + 2, 0, 100);
      if (m.pwr != null) m.pwr = this.clamp(m.pwr + 1, 0, 100);
      m.bond = this.clamp((m.bond || 0) + 2, 0, 100);
      m.note = (m.note ? m.note + "；" : "") + "参演《纯洁心灵·逐梦演艺圈》同名主题曲MV（2016-03 拍板·用户口径）";
    }
    st.money += 20;
    st.heat = this.clamp(st.heat + 3, 0, 100);
    st.decisions.zhumeng16 = teamKey;
    st.flags.zhumeng16Done = true;
    this.syncTeams(st);
    this.addLog(st, st.month, "★《纯洁心灵·逐梦演艺圈》同名主题曲 MV 拍摄：Team " + teamKey + " 全员参演（通告费 +20万）。", "main");
    this.save();
    return { text: "MV 拍摄敲定：Team " + teamKey + " 全员参演《纯洁心灵·逐梦演艺圈》同名主题曲 MV。\n\n（全队每人人气+2 实力+1 羁绊+2；通告费 +20万；热度+3。）", tone: "main" };
  },

  /* 【2020·11月事件】张一白导演电影《燃野少年的天空》演员招募（用户口径，同人演绎）：
     实际有分量的配角仅 1 个名额，其余多为不露脸的群像龙套。
     count=2（总监争取到 2 个配角名额）或 1（龙套历练）；婉拒不进本函数。
     参演成员：人气+2 实力+1 羁绊+3（剧组历练），含分团在册与影视部（HALL）成员；
     通告费：2 人 +35万 / 1 人 +18万；热度+3 士气+2。
     名单记入 decisions.ranye20（{ count, names }）。 */
  applyRanye20(count, ids) {
    const st = this.st;
    if (st.flags.ranye20Done) return { text: "《燃野少年的天空》参演名单已敲定。", tone: "blocked" };
    const picked = (ids || []).map(id => st.members.find(m => m.id === id)).filter(Boolean);
    if (picked.length !== count) return { text: "参演名单无效（需 " + count + " 人）。", tone: "blocked" };
    for (const m of picked) {
      if (!(m.status === "active" || m.status === "branch"))
        return { text: m.name + " 不可参演（需在册成员）。", tone: "blocked" };
    }
    for (const m of picked) {
      m.pop = this.clamp((m.pop || 0) + 2, 0, 100);
      if (m.pwr != null) m.pwr = this.clamp(m.pwr + 1, 0, 100);
      m.bond = this.clamp((m.bond || 0) + 3, 0, 100);
      m.note = (m.note ? m.note + "；" : "") + "参演《燃野少年的天空》（2020-11 拍板·用户口径）";
    }
    const money = count >= 2 ? 35 : 18;
    st.money += money;
    st.heat = this.clamp(st.heat + 3, 0, 100);
    st.morale = this.clamp(st.morale + 2, 0, 100);
    st.decisions.ranye20 = { count: count, names: picked.map(m => m.name) };
    st.flags.ranye20Done = true;
    this.syncTeams(st);
    this.addLog(st, st.month, "★《燃野少年的天空》：张一白导演剧组来团选角，参演 " + picked.map(m => m.name).join("、") + "（通告费 +" + money + "万）。", "main");
    this.save();
    return { text: "剧组的车开进园区那天，孩子们扒着窗户看了很久。舞蹈房里练出来的节奏感，被大银幕看中了。\n\n参演名单（" + picked.length + " 人）：" + picked.map(m => m.name).join("、") +
      "\n\n（参演成员每人：人气+2 实力+1 羁绊+3；通告费 +" + money + "万；热度+3 士气+2。）", tone: "main" };
  },

  /* 【2020·9月事件②】BEJ48 解散队伍编号（疫情效益下滑，用户口径）：
     assign = { 成员id → "SII"|"NII"|"HII"|"X"|"XII"(保留时)|"stay" }。
     上调本部：每队至多接收 3 人（不含预备生队伍，PREP 不可作为去向；XII 保留时同队待遇）；
     未上调者留任 BEJ48——队伍编号摘除，统一挂分团名（branchLabel="BEJ48"，无队伍编制，用户口径）。
     落地记录 decisions.bej20Up / bej20Stay；旗标 flags.bej20Done。 */
  applyBej20(assign) {
    const st = this.st;
    if (st.flags.bej20Done) return { text: "BEJ48 的队伍编号已经摘下。", tone: "blocked" };
    const pool = st.members.filter(m => m.status === "branch" && m.branchTeam === "BEJ48");
    if (!pool.length) return { text: "当前没有在册的 BEJ48 成员。", tone: "blocked" };
    const TEAMS = this.headTeams(st);   // XII 保留时含 XII（用户规则：不得硬编码本部四队）
    assign = assign || {};
    const upCnt = {};
    for (const m of pool) {
      const t = assign[m.id];
      if (t == null) return { text: "还有成员未分配去向（上调本部每队至多 3 人 / 留任挂分团名）。" };
      if (TEAMS.indexOf(t) >= 0) {
        upCnt[t] = (upCnt[t] || 0) + 1;
        if (upCnt[t] > 3) return { text: "Team " + t + " 本次接收已满 3 人——每队至多接收 3 人。" };
      } else if (t !== "stay") return { text: "编制表无效（含未知去向）。" };
    }
    const up = [], stay = [];
    for (const m of pool) {
      const t = assign[m.id];
      if (t === "stay") {
        m.branchLabel = "BEJ48";   // 无队伍编制 → 统一挂分团名（用户口径，不叫预备生）
        m.captain = false; m.vice = false;
        m.note = (m.note ? m.note + "；" : "") + "2020-09 BEJ48队伍编号解散 · 留任（挂分团名，无队伍编制）";
        stay.push(m.name);
      } else {
        m.status = "active"; m.team = t; m.branchTeam = null; m.branchLabel = null;
        m.captain = false; m.vice = false;
        m.pop = this.clamp((m.pop || 0) + this.rnd(6, 12), 0, 100);
        m.bond = this.clamp((m.bond || 0) + 10, 0, 100);
        m.note = "2020-09 BEJ48队伍编号解散 · 上调本部 Team " + t;
        up.push(m.name);
      }
    }
    st.flags.bej20Done = true;
    st.decisions.bej20Up = up;
    st.decisions.bej20Stay = stay;
    this.syncTeams(st);
    this.addLog(st, st.month, "BEJ48 宣布解散队伍编号：上调本部 " + up.length + " 人（每队≤3），其余 " + stay.length + " 人留任挂分团名。", "main");
    this.save();
    return { text: "★「BEJ48 编号谢幕」——上调本部 " + up.length + " 人：" + (up.join("、") || "无") +
      "\n留任（统一挂分团名）" + stay.length + " 人。北京的灯牌摘下了，孩子们的路还长。\n\n（上调成员每人人气+6~12 羁绊+10；旗标 bej20Done 已登记。）", tone: "main" };
  },

  /* 【2020·9月事件②】全员留任快选：BEJ48 全员留任挂分团名（不逐人拍板） */
  bej20StayAll() {
    const st = this.st;
    if (st.flags.bej20Done) return { text: "BEJ48 的队伍编号已经摘下。", tone: "blocked" };
    const pool = st.members.filter(m => m.status === "branch" && m.branchTeam === "BEJ48");
    if (!pool.length) return { text: "当前没有在册的 BEJ48 成员。", tone: "blocked" };
    const stay = [];
    for (const m of pool) {
      m.branchLabel = "BEJ48";   // 无队伍编制 → 统一挂分团名（用户口径，不叫预备生）
      m.captain = false; m.vice = false;
      m.note = (m.note ? m.note + "；" : "") + "2020-09 BEJ48队伍编号解散 · 留任（挂分团名，无队伍编制）";
      stay.push(m.name);
    }
    st.flags.bej20Done = true;
    st.decisions.bej20Up = [];
    st.decisions.bej20Stay = stay;
    this.syncTeams(st);
    this.addLog(st, st.month, "BEJ48 宣布解散队伍编号：全员 " + stay.length + " 人留任挂分团名。", "main");
    this.save();
    return { text: "编号摘下，人都在：BEJ48 全员 " + stay.length + " 人留任（统一挂分团名），北京名号保留、队伍编制不再。（旗标 bej20Done 已登记。）", tone: "main" };
  },

  /* 【2020】疫情裁撤补偿落地（用户口径，动态分配后的统一出口）：
     names = 待裁成员名（已按卡况过滤）；pay=true 支付补偿金 15 万/人
     （资金支出，士气+2 体面转身）；pay=false 不支付（士气-4 热度-3；
     涉及分团则该分团在册成员羁绊-4，涉本部则本部在册成员羁绊-2）。
     调用方：月首离团表（未兼任分团自动支付）与 UI layoff20Pick 拍板窗。
     决策标签 decisions.layoff20 追加 { names, pay } 记录。 */
  applyLayoff20(names, pay) {
    const st = this.st;
    const left = [];
    for (const nm of (names || [])) {
      const m = st.members.find(x => x.name === nm && x.status !== "left" && x.status !== "rest");
      if (!m) continue;
      m.status = "left";
      m.note = (m.note ? m.note + "；" : "") + "2020疫情裁撤" + (pay ? " · 支付补偿金" : " · 未付补偿金");
      left.push({ name: nm, branchTeam: m.branchTeam || null, wasBranch: m.branchTeam != null, team: m.team });
    }
    if (!left.length) return { text: "没有待裁的在册成员。", tone: "none" };
    const nmList = left.map(x => x.name).join("、");
    let text;
    if (pay) {
      const cost = left.length * 15;
      st.money -= cost;
      st.morale = this.clamp(st.morale + 2, 0, 100);
      this.addLog(st, st.month, "疫情裁撤：" + nmList + " 离团（支付补偿金共 " + cost + " 万）。", "bad");
      text = "你签了字：按合同足额支付补偿金。" + nmList + " 带着体面离开了名册。疫情年的账本又薄了一页，但人心还稳。\n\n（资金-" + cost + " 万（15 万/人）；士气+2。）";
    } else {
      st.morale = Math.max(0, st.morale - 4);
      st.heat = Math.max(0, st.heat - 3);
      const branches = {};
      let hq = false;
      for (const x of left) { if (x.wasBranch) branches[x.branchTeam] = true; else hq = true; }
      for (const m of st.members) {
        if (m.status === "branch" && m.bond != null && branches[m.branchTeam]) m.bond = Math.max(0, m.bond - 4);
      }
      if (hq) {
        for (const m of st.members) {
          if (m.status === "active" && m.bond != null) m.bond = Math.max(0, m.bond - 2);
        }
      }
      this.addLog(st, st.month, "疫情裁撤：" + nmList + " 离团（未支付补偿金，士气与信任受损）。", "bad");
      text = "你在补偿金那一栏画了斜线：今年没有这笔预算。" + nmList + " 静静地办完了离团手续，没有鲜花也没有告别公演。消息传开，排练室安静了很久。\n\n（未支付补偿金：士气-4 热度-3；涉分团在册成员羁绊-4，涉本部在册成员羁绊-2。）";
    }
    st.decisions.layoff20 = (st.decisions.layoff20 || []).concat([{ names: left.map(x => x.name), pay: pay }]);
    this.save();
    return { text: text, tone: "main" };
  },

  /* 【2017】名册精简补偿落地（用户口径 2026-10-26）：
     names = 待裁成员名（已按卡况过滤）；pay=true 支付补偿金 10 万/人（同 2016 线口径，
     资金支出，士气+2 体面转身）；pay=false 不支付（士气-4 热度-3；涉分团则该分团在册
     成员羁绊-4，涉本部则本部在册成员羁绊-2）。
     调用方：月首离团表（未兼任分团自动支付）与 UI layoff17Pick 拍板窗。
     决策标签 decisions.layoff17 追加 { names, pay } 记录。 */
  applyLayoff17(names, pay) {
    const st = this.st;
    const left = [];
    for (const nm of (names || [])) {
      const m = st.members.find(x => x.name === nm && x.status !== "left" && x.status !== "rest");
      if (!m || m.hall) continue;
      m.status = "left";
      m.note = st.year + "-" + (st.month < 10 ? "0" : "") + st.month + " 名册精简" + (pay ? "（公司支付补偿金10万）" : "（无补偿）");
      this.addLog(st, st.month, nm + " 名册精简" + (pay ? "（补偿金10万）" : "（无补偿）") + "。", "bad");
      left.push(m);
    }
    if (!left.length) return { text: "名单上的成员均已不在册。", tone: "blocked" };
    const nmList = left.map(x => x.name).join("、");
    let text = "";
    if (pay) {
      st.money = Math.max(0, st.money - 10 * left.length);
      st.morale = Math.min(100, st.morale + 2);
      this.addLog(st, st.month, "名册精简：" + nmList + " 离团（支付补偿金 " + 10 * left.length + " 万）。", "bad");
      text = "补偿金签领单一张张签下去，每张背后都是一段没来得及展开的路。离团公告写得很温和：「感谢她们的付出，愿她们前程似锦。」\n\n（已支付补偿金：资金-" + 10 * left.length + "，士气+2。" + nmList + " 已离团。）";
    } else {
      st.morale = Math.max(0, st.morale - 4); st.heat = Math.min(100, st.heat + 3);
      for (const m of left) {
        if (m.status === "branch" || m.branchTeam) {
          for (const x of st.members) if (x.branchTeam === (m.branchTeam || m.team) && x.status !== "left" && x.status !== "rest") x.bond = Math.max(0, (x.bond || 0) - 4);
        } else {
          for (const x of st.members) if (!x.branchTeam && x.status !== "left" && x.status !== "rest") x.bond = Math.max(0, (x.bond || 0) - 2);
        }
      }
      this.addLog(st, st.month, "名册精简：" + nmList + " 离团（未支付补偿金，士气与信任受损）。", "bad");
      text = "你在补偿金那一栏画了斜线：今年没有这笔预算。" + nmList + " 静静地办完了离团手续，没有鲜花也没有告别公演。消息传开，排练室安静了很久。\n\n（未支付补偿金：士气-4 热度-3；涉分团在册成员羁绊-4，涉本部在册成员羁绊-2。）";
    }
    st.decisions.layoff17 = (st.decisions.layoff17 || []).concat([{ names: left.map(x => x.name), pay: pay }]);
    this.save();
    return { text: text, tone: "main" };
  },

  /* ========================================================================
     【全线通用·新系统】公演站位调整（用户口径 2026-10-26）
     --------------------------------------------------------------------------
     · 总选完成后解锁（st.geDone）；逐队拍板，每队 1 行动点，一次只显示一队（含分团）。
     · 大歌 16 人站位：人数 ≤16 时每人必须有站位；人数 >16 时至多 16 个站位（超员欠席）。
     · unit：solo/双人/三人/四人/五人各一；同 unit 成员相互好感度上升（rel +3/对）；
       每名成员至多同时编入 2 个 unit。
     · 规则（拍板即时反馈）：以队内总选名次为基准序（未入总选名单者同级、排在队内末尾）——
       总选第一未站一号位 → 其羁绊-8；基准序比站位靠后 ≥3 位（破格提拔）→ 羁绊+2；
       基准序比站位靠前 ≥3 位（明显压后）→ 羁绊-6；±2 以内不产生增减。
     · 年末结算（endMonth 12月，先于年度评分与跨年继承）：本年度未主动拍板的队伍默认
       一键安排（按总选成绩）；按年末站位结算人气加成——1号位+6、2号位+5、3号位+4、
       4~5号位+3、6~8号位+2、9~12号位+1、13~16号位+0（站位越靠前提升越多）。
     ======================================================================== */
  stageGain(pos) { return pos <= 3 ? [6, 5, 4][pos - 1] : pos <= 5 ? 3 : pos <= 8 ? 2 : pos <= 12 ? 1 : 0; },

  /* 参与公演站位的队伍（含分团；预备生/殿堂不列） */
  stageTeams(st) {
    st = st || this.st;
    const keys = [...new Set(st.members.map(m => this.teamKeyOf(m)).filter(k => k && k !== "PREP" && k !== "HALL"))];
    const order = ["SII", "NII", "HII", "X", "XII", "FT", "BEJ48", "GNZ48", "SHY48", "CKG48", "TEB48"];
    keys.sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || (a < b ? -1 : 1);
    });
    return keys;
  },

  stageInit(st) {
    if (!st.stage) st.stage = { pos: {}, units: {}, done: {}, manual: {} };
    return st.stage;
  },

  /* 队内总选基准序：top48 中该队成员按名次在前；未入名单者视为同级，按人气降序续后 */
  stageBaseline(st, team) {
    const roster = this.teamRoster(st, team);
    const top = (st.geResult && Array.isArray(st.geResult.top48)) ? st.geResult.top48 : [];
    const inGE = [];
    for (const r of top) {
      const m = roster.find(x => x.name === r.name && (r.team === team));
      if (m && inGE.indexOf(m.id) < 0) inGE.push(m.id);
    }
    const rest = roster.filter(m => inGE.indexOf(m.id) < 0)
      .sort((a, b) => (b.pop || 0) - (a.pop || 0) || (a.name < b.name ? -1 : 1))
      .map(m => m.id);
    return inGE.concat(rest);
  },

  /* 一键安排：按基准序填站位；unit 按基准序顺次填满五种编制（允许复用，每人≤2个） */
  autoStageAssign(st, team) {
    const base = this.stageBaseline(st, team);
    const pos = {};
    base.slice(0, Math.min(16, base.length)).forEach((id, i) => { pos[id] = i + 1; });
    const units = { solo: [], duo: [], trio: [], quad: [], quint: [] };
    const sizes = { solo: 1, duo: 2, trio: 3, quad: 4, quint: 5 };
    const cnt = {};
    if (base.length >= 3) {
      let p = 0;
      for (const k of ["solo", "duo", "trio", "quad", "quint"]) {
        let guard = 0;
        while (units[k].length < sizes[k] && guard < 200) {
          guard++;
          const id = base[p % base.length]; p++;
          if ((cnt[id] || 0) >= 2 || units[k].indexOf(id) >= 0) continue;
          units[k].push(id); cnt[id] = (cnt[id] || 0) + 1;
        }
        if (units[k].length < sizes[k]) units[k] = [];   // 人数不足以填满 → 该 unit 留空
      }
    }
    return { pos: pos, units: units };
  },

  /* 拍板校验：返回错误文案或 null */
  validateStage(st, team, assign) {
    const roster = this.teamRoster(st, team);
    const ids = roster.map(m => m.id);
    const pos = (assign && assign.pos) || {};
    const ranks = [];
    for (const id in pos) {
      if (ids.indexOf(id) < 0) return "站位名单中有非本队成员。";
      const r = pos[id];
      if (!Number.isInteger(r) || r < 1 || r > 16) return "站位号必须在 1~16 号位之间。";
      if (ranks.indexOf(r) >= 0) return r + " 号位重复。";
      ranks.push(r);
    }
    if (roster.length <= 16 && ranks.length < roster.length) return "队伍人数不足 16 人——每名成员都必须分配到站位。";
    if (roster.length > 16 && ranks.length > 16) return "公演站位只有 16 个——超员成员只能欠席。";
    const units = (assign && assign.units) || {};
    const sizes = { solo: 1, duo: 2, trio: 3, quad: 4, quint: 5 };
    const ucnt = {};
    for (const k in sizes) {
      const arr = units[k];
      if (!arr || !arr.length) continue;
      if (arr.length !== sizes[k]) return "unit 编制不符：solo/双人/三人/四人/五人各一个。";
      for (const id of arr) {
        if (ids.indexOf(id) < 0) return "unit 名单中有非本队成员。";
        if (arr.indexOf(id) < arr.lastIndexOf(id)) return "同一 unit 内成员不能重复。";
        ucnt[id] = (ucnt[id] || 0) + 1;
        if (ucnt[id] > 2) return roster.find(x => x.id === id).name + " 已编入 2 个 unit（每人至多两个）。";
      }
    }
    return null;
  },

  /* 拍板落地：写站位/unit、unit 内好感度+3/对、按基准序即时反馈羁绊；auto=年末默认一键 */
  applyStage(st, team, assign, opts) {
    opts = opts || {};
    const err = this.validateStage(st, team, assign);
    if (err) return { err: err };
    const s = this.stageInit(st);
    s.pos[team] = assign.pos; s.units[team] = assign.units;
    s.done[team] = true; if (!opts.auto) s.manual[team] = true;
    const nameOf = id => { const m = st.members.find(x => x.id === id); return m ? m.name : id; };
    /* unit 内好感度 */
    for (const k in assign.units) {
      const arr = assign.units[k];
      for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) this.relAdd(st, arr[i], arr[j], 3);
    }
    /* 羁绊反馈（基准序 vs 站位） */
    const base = this.stageBaseline(st, team);
    const msgs = [];
    for (const id in assign.pos) {
      const m = st.members.find(x => x.id === id);
      if (!m) continue;
      const b = (base.indexOf(id) >= 0 ? base.indexOf(id) : base.length) + 1;
      const p = assign.pos[id];
      const d = b - p;
      if (d >= 2) { m.bond = this.clamp((m.bond || 0) + 2, 0, 100); msgs.push(nameOf(id) + " 被破格提拔（基准" + b + "→" + p + "号位）羁绊+2"); }
      else if (d <= -3) { m.bond = Math.max(0, (m.bond || 0) - 6); msgs.push(nameOf(id) + " 站位明显低于总选成绩（基准" + b + "→" + p + "号位）羁绊-6"); }
    }
    const t1id = base[0];
    const t1 = t1id != null ? st.members.find(x => x.id === t1id) : null;
    if (t1 && assign.pos[t1.id] != null && assign.pos[t1.id] !== 1) {
      t1.bond = Math.max(0, (t1.bond || 0) - 8);
      msgs.unshift("「总选第一」" + t1.name + " 未站一号位，羁绊-8");
    }
    /* 欠席反馈（仅超员队）：基准序在前 16 的成员未获站位 → 视为明显压后 */
    for (let i = 0; i < base.length && i < 16; i++) {
      if (assign.pos[base[i]] != null) continue;
      const m = st.members.find(x => x.id === base[i]);
      if (!m) continue;
      m.bond = Math.max(0, (m.bond || 0) - 6);
      msgs.push(nameOf(base[i]) + " 未能站上公演站位（基准第" + (i + 1) + "）羁绊-6");
    }
    return { ok: true, msgs: msgs };
  },

  /* 年末结算（endMonth 12月调用，先于年度评分与跨年继承）：
     未拍板队伍默认一键安排 → 全部队按年末站位结算人气加成 */
  settleStage(st) {
    if (!st.geDone || st.flags.stageSettled === st.era) return;
    st.flags.stageSettled = st.era;
    const teams = this.stageTeams(st);
    const autoTeams = [];
    for (const t of teams) {
      const s = this.stageInit(st);
      if (!s.done[t]) {
        const r = this.applyStage(st, t, this.autoStageAssign(st, t), { auto: true });
        if (r.ok) autoTeams.push(t);
      }
    }
    const gains = [];
    let total = 0;
    const s = this.stageInit(st);
    for (const t of teams) {
      const pos = s.pos[t];
      if (!pos || !s.done[t]) continue;
      let g = 0;
      for (const id in pos) {
        const m = st.members.find(x => x.id === id);
        if (!m) continue;
        const v = this.stageGain(pos[id]);
        if (v) { m.pop = (m.pop || 0) + v; g += v; }
      }
      if (g) { gains.push(t + " +" + g); total += g; }
    }
    if (autoTeams.length || total) {
      this.addLog(st, st.month, "年末公演站位结算：" +
        (autoTeams.length ? "未调整队伍已按总选成绩自动排站（" + autoTeams.join("、") + "）。" : "") +
        (total ? "站位人气加成合计 +" + total + "（" + gains.join("、") + "）。" : ""), "main");
    }
  },

  /* 【2020·10月事件】GNZ48 首次分团内大重组（用户口径，2020-10 史实锚点，按用户口径挂载）：
     仅玩家兼任 GNZ48 总监（2016「下一站」选 GNZ48 → flags.concur17.GNZ48）时触发。
     分班公演收官、恢复队伍公演：Team G / Team NIII / Team Z 重新编成，
     人数限制同本部队伍（每队 13~20 人）；未编入队伍者转入 GNZ48 预备生。
     assign = { 成员id → "G"|"NIII"|"Z"|"prep" }；旗标 flags.gnzReorg20Done；名单 decisions.gnzReorg20。
     【人数下限特则】分团在册成员总数不足 39（=3×13）时无法物理满足每队 13 人下限，
     此时只校验上限 20（下限不强制），避免编制窗无法敲定的死锁。
     【队长任命】编入队伍者保留原队长/副队长任命（重组不改队长任命，史实后续任命待用户口径）；
     转入预备生者解除队长/副队长。 */
  GNZ_REORG20_TEAMS: { G: "Team G", NIII: "Team NIII", Z: "Team Z" },
  applyGnzReorg20(assign) {
    const st = this.st;
    if (st.flags.gnzReorg20Done) return { text: "GNZ48 的分团内大重组早已落定。", tone: "blocked" };
    const pool = st.members.filter(m => m.status === "branch" && m.branchTeam === "GNZ48");
    if (!pool.length) return { text: "当前没有在册的 GNZ48 成员。", tone: "blocked" };
    const TL = this.GNZ_REORG20_TEAMS;
    const TKEYS = Object.keys(TL);
    const curKey = { "Team G": "G", "Team NIII": "NIII", "Team Z": "Z" };
    /* 全员都在重组池内（现编队只是预填默认值），最终各队人数由分配结果决定，cnt 从零起算 */
    const cnt = { G: 0, NIII: 0, Z: 0 };
    const minPer = pool.length >= 39 ? 13 : 0;   // 人手不足时放开 13 人下限（见函数头注）
    assign = assign || {};
    for (const m of pool) {
      const t = assign[m.id];
      if (t == null) return { text: "还有成员未分配去向（Team G / Team NIII / Team Z / GNZ48预备生）。" };
      if (TKEYS.indexOf(t) >= 0) { cnt[t]++; if (cnt[t] > 20) return { text: TL[t] + " 编制将超 20 人——每队 13~20 人，同本部队伍限制。" }; }
      else if (t !== "prep") return { text: "编制表无效（含未知去向）。", tone: "blocked" };
    }
    for (const k of TKEYS) if (cnt[k] < minPer) return { text: TL[k] + " 编制不足 13 人——每队 13~20 人，同本部队伍限制。" };
    const roster = { G: [], NIII: [], Z: [], prep: [] };
    for (const m of pool) {
      const t = assign[m.id];
      if (t === "prep") {
        m.branchLabel = "预备生"; m.captain = false; m.vice = false;
        m.note = (m.note ? m.note + "；" : "") + "2020-10 GNZ48分团内大重组 · 转入预备生";
        roster.prep.push(m.name);
      } else {
        m.branchLabel = TL[t];
        m.note = (m.note ? m.note + "；" : "") + "2020-10 GNZ48分团内大重组 · 编入 " + TL[t];
        roster[t].push(m.name);
      }
    }
    st.flags.gnzReorg20Done = true;
    st.decisions.gnzReorg20 = roster;
    this.syncTeams(st);
    this.addLog(st, st.month, "GNZ48 结束分班公演、恢复队伍公演：分团内大重组——Team G " + roster.G.length + " 人 / Team NIII " + roster.NIII.length + " 人 / Team Z " + roster.Z.length + " 人，预备生 " + roster.prep.length + " 人。", "main");
    this.save();
    return { text: "★「广州 · 重新出发」——分班公演落幕，队伍公演回归：\nTeam G " + roster.G.length + " 人（" + roster.G.join("、") + "）\nTeam NIII " + roster.NIII.length + " 人（" + roster.NIII.join("、") + "）\nTeam Z " + roster.Z.length + " 人（" + roster.Z.join("、") + "）\n转入 GNZ48 预备生 " + roster.prep.length + " 人（" + (roster.prep.join("、") || "无") + "）。\n\n（旗标 gnzReorg20Done 已登记。）", tone: "main" };
  },

  /* 【2020 总选新机制·用户口径】分团 TOP1 兼任本部队伍（9月事件安排，UI.showGe20Branch1Picker）：
     每个分团的 TOP1 都可以兼任；assign = { 成员id → 本部队|"none" }。
     兼任不调动（保留分团在册），备注登记；兼任者羁绊+4 人气+4；旗标 ge20Branch1Done。 */
  applyGe20Branch1(assign) {
    const st = this.st;
    if (st.flags.ge20Branch1Done) return { text: "分团 TOP1 的兼任安排早已落定。", tone: "blocked" };
    /* 旧档兼容：v0.14.0 前登记的是单名字符串，读档时已在 _normalize 转数组 */
    const names = Array.isArray(st.flags.ge20BranchTop1) ? st.flags.ge20BranchTop1 : (st.flags.ge20BranchTop1 ? [st.flags.ge20BranchTop1] : []);
    const pool = names.map(n => st.members.find(x => x.name === n && x.status === "branch")).filter(Boolean);
    if (!pool.length) return { text: "分团 TOP1 当前均不在册，兼任安排作废。", tone: "blocked" };
    assign = assign || {};
    const TEAM = this.headTeams(st);
    const done = [];
    for (const m of pool) {
      const raw = assign[m.id];
      const t = (!raw || raw === "none") ? null : raw;
      if (t) {
        if (TEAM.indexOf(t) < 0) return { text: "兼任目标无效（需本部在编队伍或不兼任）。", tone: "blocked" };
      }
    }
    for (const m of pool) {
      const raw = assign[m.id];
      const t = (!raw || raw === "none") ? null : raw;
      if (!t) {
        st.decisions["ge20Branch1_" + m.name] = null;
        continue;
      }
      m.note = (m.note ? m.note + "；" : "") + "2020总选" + m.branchTeam + "TOP1 · 兼任 Team " + t + "（用户口径）";
      m.pop = this.clamp((m.pop || 0) + 4, 0, 100);
      m.bond = this.clamp((m.bond || 0) + 4, 0, 100);
      done.push(m.name + "→Team " + t);
      this.addLog(st, st.month, "2020总选" + m.branchTeam + "TOP1 " + m.name + " 兼任本部 Team " + t + "。", "main");
    }
    st.decisions.ge20Branch1 = pool.map(m => {
      const raw = assign[m.id];
      return { name: m.name, branch: m.branchTeam, team: (!raw || raw === "none") ? null : raw };
    });
    st.flags.ge20Branch1Done = true;
    this.syncTeams(st);
    this.save();
    if (!done.length) return { text: "各分团 TOP1 均留在分团，不作兼任。（决策已登记：全员不兼任。）", tone: "normal" };
    return { text: done.map(s => s.split("→")[0]).join("、") + " 以分团 TOP1 的身份兼任本部队伍（" + done.map(s => s.replace("→", " → ")).join("、") + "）——两地的灯牌，第一次照在同一些人身上。\n\n（兼任不调动：保留分团在册；兼任者人气+4 羁绊+4。）", tone: "main" };
  },

  /* 【2020 总选新机制·用户口径】入榜 IDFT 成员升格移籍（9月事件安排，UI.showGe20IdftPicker）：
     assign = { 成员id → 本部队|分团名|"stay" }。升格本部=入编现役；升格分团=移籍挂分团名（无队伍编制）；
     stay=留任 IDFT。升格红利：人气+8~14 羁绊+10；旗标 ge20IdftDone，名单 decisions.ge20IdftUp。 */
  applyGe20Idft(assign) {
    const st = this.st;
    if (st.flags.ge20IdftDone) return { text: "入榜 IDFT 成员的去向已经落定。", tone: "blocked" };
    const names = st.flags.ge20Idft || [];
    const pool = names.map(n => st.members.find(m => m.name === n && m.status === "idft")).filter(Boolean);
    if (!pool.length) return { text: "入榜的 IDFT 成员均已不在池中。", tone: "blocked" };
    const TEAMS = this.headTeams(st);
    const BR = ["BEJ48", "GNZ48", "SHY48", "CKG48"].concat(st.teb19 && st.teb19.open ? ["TEB48"] : []);
    assign = assign || {};
    for (const m of pool) {
      const t = assign[m.id];
      if (t == null) return { text: "还有成员未安排去向（升格本部 / 移籍分团 / 留任 IDFT）。" };
      if (t !== "stay" && TEAMS.indexOf(t) < 0 && BR.indexOf(t) < 0) return { text: "编制表无效（含未知去向）。", tone: "blocked" };
    }
    const up = [], br = [];
    for (const m of pool) {
      const t = assign[m.id];
      if (t === "stay") continue;
      if (TEAMS.indexOf(t) >= 0) {
        m.status = "active"; m.team = t;
        m.pop = this.clamp((m.pop || 0) + this.rnd(8, 14), 0, 100);
        m.bond = this.clamp((m.bond || 0) + 10, 0, 100);
        m.note = "2020总选 · IDFT升格移籍 Team " + t + "（用户口径）";
        up.push(m.name);
      } else {
        m.status = "branch"; m.team = t; m.branchTeam = t; m.branchLabel = t;   // 无队伍编制 → 挂分团名
        m.pop = this.clamp((m.pop || 0) + this.rnd(6, 12), 0, 100);
        m.bond = this.clamp((m.bond || 0) + 8, 0, 100);
        m.note = "2020总选 · IDFT升格移籍 分团 " + t + "（挂分团名）";
        br.push(m.name);
      }
    }
    st.flags.ge20IdftDone = true;
    st.decisions.ge20IdftUp = up.concat(br);
    this.syncTeams(st);
    this.addLog(st, st.month, "2020总选入榜 IDFT 成员去向落定：升格本部 " + up.length + " 人，移籍分团 " + br.length + " 人。", "main");
    this.save();
    return { text: "训练生池的门被总选票数推开了：升格本部 " + up.length + " 人（" + up.join("、") + "）\n移籍分团 " + br.length + " 人（" + br.join("、") + "）。\n\n（升格本部人气+8~14 羁绊+10；移籍分团人气+6~12 羁绊+8，挂分团名；旗标 ge20IdftDone 已登记。）", tone: "main" };
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
     五人羁绊+10 人气+3；名单记入 decisions.mariaInvite，并登记 mariaDispatch 供后续派遣事件。 */
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
    this.addLog(st, st.month, "赴日名单公布：" + names.join("、") + " ——随铃木玛莉亚赴东京参加毕业公演。（羁绊+10 人气+3）", "main");
    this.save();
    return { text: "东京的镜头对准了她们：" + names.join("、") + "。毕业公演的安可环节，玛莉亚把话筒递向了上海来的五个孩子。（五人羁绊+10 人气+3）" };
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

  /* 【总结任期·年度归档】跨年时（carryTo*）把刚结束那一年打包存入新档的 termArchive：
     年初/年末资金、年初/年末实力均值、年度喜爱成员（按 bondBase 快照比对）。
     总结任期窗据其中放开局至当前年份的每一年。 */
  termArchiveYear(src) {
    const era = src.era;
    const bb = src.bondBase || {};
    let top = null, topD = 0;
    for (const m of src.members) {
      if (m.status !== "active") continue;
      const d = (m.bond || 0) - (bb[m.name] || 0);
      if (d > topD) { topD = d; top = m; }
    }
    const mBase = src.history && src.history["money" + (parseInt(era, 10) - 1)];
    const prevArc = src.termArchive && src.termArchive[String(parseInt(era, 10) - 1)];
    const mStart = mBase != null ? mBase
      : prevArc && prevArc.moneyEnd != null ? prevArc.moneyEnd   /* 上年归档年末 = 本年年初 */
      : era === "2016" ? 600       /* 2016 开局初始资金（newGame）*/
      : era === "2026" ? 380       /* 2026 开局初始资金 */
      : null;
    return {
      moneyStart: mStart,
      moneyEnd: src.money,
      pwrStart: src.pwrBase || 0,
      pwrEnd: this.avgPwr(src),
      favorite: top ? { name: top.name, d: topD } : null,
      /* 翻页式总结任期（2026-10-26）：每页补关键成绩快照，历史年份也能显示。
         老存档归档无这些字段 → UI 按 — 兜底，不凑数。 */
      top1: (src.geResult && src.geResult.top1) || null,
      rtScore: src.rtDone ? (src.rtScore != null ? src.rtScore : null) : (src.rtCancelled ? "cancelled" : null),
      heat: src.heat != null ? src.heat : null,
      morale: src.morale != null ? src.morale : null,
    };
  },

  /* 【总结任期·抉择记录】UI 在玩家点下事件选项时调用（月度事件 / 行动剧情 / 序章抉择）。
     记入 st.termLog（全程累积，跨年由 carryTo 继承），供结算画面「总结任期」窗逐年回放。 */
  logTermChoice(event, label) {
    const st = this.st;
    st.termLog = st.termLog || [];
    st.termLog.push({ era: st.era, month: st.month, event: event || "", choice: label || "" });
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
    st.ap = 4;

    // ⓪ 旧存档追补：错过月度事件装载的唐安琪（v0.9.1 前建的档已过 3 月时不会再触发）
    //    · 2016 线 4 月起仍在籍 → 补为暂休（3月末意外烧伤）；
    //    · 2017 线 4 月起仍暂休 → 补为依约解约离团（默认祝福路线，无副作用）。
    const taq = st.members.find(x => x.name === "唐安琪");
    if (taq) {
      if (st.era === "2016" && st.month >= 4 && taq.status === "active" && st.decisions.tanqiQJ16 !== "refuse") {
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

    // ① 新成员入队（2016：六期生3月 / 七期生9、10月；2017：八期生4、5、6、9、10月 + SHY48二期生；2018：九/十/十一期生+分团新期生；
    //    2026：二十四期生5月；2027：预挂载表）。2017 起支持 branchTeam 字段：分团新期生建分团预备生简卡
    //    （2017 线仅限对应分团已开业，未开业则不入册，后续离团表自然跳过）。
    const joinSrc = st.era === "2016" ? DATA.joining2016
      : st.era === "2017" ? DATA.joining2017
      : st.era === "2018" ? DATA.joining2018
      : st.era === "2019" ? []   // 【2019】不挂载静态入团表：招新由 9 月剧情事件承载（主线③）
      : st.era === "2020" ? (DATA.joining2020 || [])   // 【2020】疫情年史实入团表（分团新期生建简卡）
      : st.era === "2027" ? (DATA2026.joining2027 || [])
      : DATA2026.joining2026;
    for (const j of joinSrc) {
      if (j.month === st.month) {
        /* 【去重】同名成员已在册则跳过——月末流程重复跑同一月（旧档 monthStarted 缺失重入等）
           不再生成第二张卡（曾致 2018 组阁预备生栏整列重复） */
        if (st.members.some(x => x.name === j.name && x.status !== "left")) continue;
        /* 【2016】分团方向直落成员（用户口径 2026-10-25：王馨悦 4·20 直落 GNZ48
           Team G）：分团官宣后方入册（官宣晚于史实月份则顺延到官宣当月落地）；
           分团主线失败（未官宣）则不入册。branchLabel 有值则直落正式队。 */
        if (st.era === "2016" && j.branchTeam) {
          if (!(st.branch && st.branch.announce)) continue;
          st.members.push({
            id: "j" + j.name, name: j.name, team: j.branchTeam, gen: j.gen,
            pop: this.rnd(10, 20), bond: 12, status: "branch", branchTeam: j.branchTeam,
            branchLabel: j.branchLabel || "预备生",
            note: j.note,
          });
          this.addLog(st, st.month, j.branchTeam + " 新成员入团：" + j.name + "（" + j.gen + " · " + (j.branchLabel || "预备生") + "）", "good");
          continue;
        }
        if ((st.era === "2017" || st.era === "2018" || st.era === "2020") && j.branchTeam) {
          /* 【2017】分团未开业则不入册（如玩家未点亮沈阳剧场，SHY48二期生张羽涵不入册） */
          if (st.era === "2017" && st.branch17) {
            const bOpen = j.branchTeam === "SHY48" ? st.branch17.shyOpen : j.branchTeam === "CKG48" ? st.branch17.ckgOpen : true;
            if (!bOpen) continue;
          }
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

    // ② 离团/移籍生效（2016/2017/2018/2019/2020/2027 线；2026 线的人员退出走末位淘汰事件）
    //    移籍分团（type 以「移籍」开头）→ status='branch'；兼任（type 以「兼任」开头）→ 保留在籍仅备注
    const leaveSrc = st.era === "2026" ? []
      : st.era === "2027" ? (DATA2026.leaving2027 || [])
      : st.era === "2020" ? (DATA.leaving2020 || [])   // 【2020】史实离团表挂载（v0.13.9）：
                                                       // 分团解散安置/TEB48/一期生合约仍由主线①④⑤承载，本表只负责散点离团
      : st.era === "2019" ? (DATA.leaving2019 || [])   // 【2019】史实离团表挂载（v0.12.3）：
                                                       // 二次组阁/IDFT 移籍照旧由主线②承载，本表只负责散点离团
      : st.era === "2018" ? DATA.leaving2018
      : st.era === "2017" ? DATA.leaving2017 : DATA.leaving2016;
    for (const lv of leaveSrc) {
      if (lv.month !== st.month) continue;
      /* 人员表按「2016 年末游戏内实况」装载：已因玩家决策离团/暂休的成员自动跳过；
         lv.branchTeam 有值时优先命中对应分团卡（如 CKG48 孟玥 vs 本部 NII 孟玥同名双卡） */
      const m0 = lv.branchTeam
        ? st.members.find(x => x.name === lv.name && x.branchTeam === lv.branchTeam)
        : st.members.find(x => x.name === lv.name);
      if (!m0 || m0.status === "left" || m0.status === "rest") continue;
      /* 分团出身限定（lv.branchTeam 有值时）：如 2020-02 离团的 CKG48 孟玥与已毕业的
         本部 NII 一期生孟玥重名，按 branchTeam 限定避免误命中同名本部卡 */
      if (lv.branchTeam && m0.branchTeam !== lv.branchTeam) continue;
      /* 荣誉殿堂成员不再走离团表（与 2026 杨冰怡口径一致） */
      if (m0.hall) continue;
      /* 【2020】疫情裁撤（用户口径，多月份散点）：先登记待裁名单，离团表循环
         结束后按成员卡现状动态分配落地（见下方 layoff20 分配块）。 */
      if (st.era === "2020" && (lv.note || "").indexOf("疫情裁撤") >= 0) {
        st.flags.layoff20Names = (st.flags.layoff20Names || []).concat(lv.name);
        continue;
      }
      /* 【2017】名册精简（用户口径 2026-10-26，多月份散点）：不走通用离团，
         先登记待裁名单，离团表循环结束后按成员卡现状动态分配落地
         （见下方 layoff17 分配块）。 */
      if (st.era === "2017" && (lv.note || "").indexOf("名册精简") >= 0) {
        st.flags.layoff17Names = (st.flags.layoff17Names || []).concat(lv.name);
        continue;
      }
      /* 【2019】去年点将出征鹅厂选秀的成员不随史实表离团——封闭集训/限定团线
         承载她们的年内在籍（6月成团者已转暂休，上面 rest 已跳过；未成团派遣
         成员留在队里等 7 月总选加成结算）。 */
      if (st.era === "2019" && st.show18 && Array.isArray(st.show18.squad) &&
          st.show18.squad.some(id => { const sm = st.members.find(x => x.id === id); return sm && sm.name === lv.name; })) continue;
      /* 复刻路线：与日方关系良好，铃木玛莉亚的兼任延续至明年（不退团） */
      if (lv.name === "铃木玛莉亚" && this.isReplicate(st)) {
        this.addLog(st, st.month, "AKB48方面确认：铃木玛莉亚的兼任将延续到明年。", "good");
        continue;
      }
      /* 赵嘉敏：2018-06 毕业仅限「史实官司暂休」路线（zhaoMin17=freeze，旧档默认史实）；
         学业线归队等其他在籍状态不随史实表离团（在籍至 2020-10） */
      if (lv.name === "赵嘉敏" && !this.zjmFreezeRoute(st)) continue;
      /* 唐安琪：2016-03 烧伤仅限「同意请假」路线（tanqiQJ16=agree，旧档无决策时默认史实发生）；
         拒绝请假（refuse）则意外不发生——2016 暂休不落地、2017 康复离团同样不落地，
         成员保持在籍（3 月叙事事件同步跳过） */
      if (lv.name === "唐安琪"
          && ((st.era === "2016" && lv.type === "暂休") || st.era === "2017")
          && st.decisions.tanqiQJ16 === "refuse") continue;
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

    /* 【2016】名册精简·张韵雯追补（用户口径 2026-10-25）：8月「名册精简」事件
       （m8_layoff16）选了提前毕业路线时，张韵雯延至10月同一口径离团。
       与唐安琪同理不走离团表（避免离团表先行落地的时序 bug），全部事件控制。 */
    if (st.era === "2016" && st.month === 10 && (st.flags.layoff16 === "paid" || st.flags.layoff16 === "nopaid")) {
      const zyw = st.members.find(x => x.name === "张韵雯");
      if (zyw && zyw.status === "active") {
        zyw.status = "left";
        if (st.flags.layoff16 === "paid") {
          zyw.note = "2016-10 名册精简提前毕业（公司支付补偿金10万）";
          st.money -= 10;
          this.addLog(st, st.month, "张韵雯 提前毕业（名册精简，补偿金10万）。", "bad");
        } else {
          zyw.note = "2016-10 名册精简提前毕业（无补偿）";
          this.addLog(st, st.month, "张韵雯 提前毕业（名册精简，无补偿）。", "bad");
        }
      }
    }

    /* 【2020】疫情裁撤落地·动态分配（用户口径）：逐人查卡判定归属——
       本部成员（active，含 PREP）或玩家兼任分团（concur17）成员 → 进入
       layoff20Choice，由玩家拍板是否支付补偿（主线行动「layoff20」→
       UI layoff20Pick 拍板窗）；未兼任分团成员 → 默认自动支付 15 万/人。 */
    if (st.era === "2020" && (st.flags.layoff20Names || []).length) {
      const pend = st.flags.layoff20Names;
      st.flags.layoff20Names = [];
      const concur = st.flags.concur17 || {};
      const choice = [], auto = [];
      for (const nm of pend) {
        const mm = st.members.find(x => x.name === nm && x.status !== "left" && x.status !== "rest");
        if (!mm) continue;
        const domain = (mm.status === "active") ? "本部" : (mm.branchTeam || "本部");
        if (domain === "本部" || (concur && concur[domain])) choice.push(nm);
        else auto.push(nm);
      }
      if (auto.length) this.applyLayoff20(auto, true);
      if (choice.length) st.flags.layoff20Choice = (st.flags.layoff20Choice || []).concat(choice);
    }

    /* 【2017】名册精简落地·动态分配（用户口径 2026-10-26）：逐人查卡判定归属——
       本部成员（active，含 PREP）或玩家兼任分团（concur17）成员 → layoff17Choice，
       由玩家拍板是否支付补偿；未兼任分团成员 → 默认自动支付 10 万/人（同 2016 线口径）。 */
    if (st.era === "2017" && (st.flags.layoff17Names || []).length) {
      const pend = st.flags.layoff17Names;
      st.flags.layoff17Names = [];
      const concur = st.flags.concur17 || {};
      const choice = [], auto = [];
      for (const nm of pend) {
        const mm = st.members.find(x => x.name === nm && x.status !== "left" && x.status !== "rest");
        if (!mm || mm.hall) continue;
        const domain = mm.status === "branch" ? (mm.branchTeam || mm.team) : "本部";
        if (domain === "本部" || (concur && concur[domain])) choice.push(nm);
        else auto.push(nm);
      }
      if (auto.length) this.applyLayoff17(auto, true);
      if (choice.length) st.flags.layoff17Choice = (st.flags.layoff17Choice || []).concat(choice);
    }

    // ③ 分团成立后的固定月收益提示（2016 线，5月起在结算体现，这里只提示首月）
    if (st.era === "2016" && st.branch.announce && st.month === st.branch.announceMonth + 1) {
      this.addLog(st, st.month, "分团进入稳定运营期，每月为总账带来 35 万收入。", "gold");
    }

    /* 【全线通用】总选后·马跃提醒重排公演站位（用户口径 2026-10-26）：
       总选完成后首月初一次性引导剧情，指引玩家使用「公演站位调整」。 */
    if (st.geDone && !st.flags.stageIntro && !st.flags.stageSettled && this.stageTeams(st).length) {
      st.flags.stageIntro = true;
      steps.push({ type: "vn", title: "总选之后 · 一年成绩单", pages: [
        { nar: true, t: "总选举的灯光刚落，舞台总监马跃抱着一叠资料敲开了总监办公室的门。" },
        { s: "马跃", cls: "", t: "总监，总选举是一年成绩单的报告——名次是粉丝给的答案，但奖励不能缺席：接下来的公演站位，得重新安排了。" },
        { s: "马跃", cls: "", t: "大歌十六个站位，solo 到五人的 unit 也各留了一个。站得越靠前，人气涨得越猛——但站位若和总选成绩差得离谱，孩子们心里会有意见。站位表已经放到「公演站位调整」里了，一支队伍一支队伍来，每队占一点行动力。" },
        { s: "马跃", cls: "", t: "当然，您要是忙不过来，年末我按总选成绩默认排好。但有些话……还是由您亲口安排的好。" },
        { nar: true, t: "（本月起行动区新增「公演站位调整」：逐队拍板，每队 1 行动点；年末仍未拍板的队伍将按总选成绩自动排站。）" },
      ] });
    }
    return steps;
  },

  /* ============================ 行动定义 ============================ */

  /* 返回本月可用行动（含可用性检查），UI 据此渲染按钮 */
  listActionsCore() {
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
        2: "剧场翻新与设备更换（需资金≥220万，投入200万）",
        3: "首演彩排与出道曲打磨（需训练度≥50）",
        4: "重建就绪，静待重启首演",
      };
      const canCgtStage = () => {
        if (st.cgt.stage === 1) return st.morale >= 55;
        if (st.cgt.stage === 2) return st.money >= 220;
        if (st.cgt.stage === 3) return st.train >= 50;
        return true;
      };
      return [
        { id: "cgt", main: true, name: "推进CGT48重建", desc: cgtDesc[st.cgt.stage],
          disabled: st.cgt.stage >= 4 || !canCgtStage(),
          disabledTip: st.cgt.stage === 1 ? "士气不足（需≥55），先安抚人心" :
                       st.cgt.stage === 2 ? "资金不足（需≥220万）" :
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
        if (b17.shy === 0 && !b17.shyOpen) return st.money >= 220;
        if (b17.ckg === 1) return st.money >= 220;
        if (b17.ckg === 2) return st.morale >= 55;
        return true;
      };
      const b17Desc = (() => {
        if (!b17.shyOpen && b17.shy === 0) return "SHY48（沈阳）剧场筹备冲刺：1月12日首演亮灯（需资金≥220万，投入200万）";
        if (b17.ckg === 0) return "CKG48（重庆）筹备启动：对接孟波筹备组，锁定剧场与首批苗子";
        if (b17.ckg === 1) return "CKG48 剧场改造（需资金≥220万，投入200万）";
        if (b17.ckg === 2) return "CKG48 首批成员招募集训（需士气≥55）";
        return "双团筹备全部就绪，静待开业亮灯";
      })();
      const acts = [
        { id: "branch17", main: true, name: "推进双团开设", desc: b17Desc,
          disabled: (b17.shyOpen || b17.shy >= 1) && b17.ckg >= 3 || !canB17(),
          disabledTip: (b17.shy === 0 && !b17.shyOpen) ? "资金不足（需≥220万）" :
                       b17.ckg === 1 ? "资金不足（需≥220万）" :
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
      /* 【2017】名册精简补偿拍板（layoff17Choice 非空时出现；动态分配后待拍板名单） */
      if ((st.flags.layoff17Choice || []).length) {
        acts.push({ id: "layoff17", main: true, name: "名册精简补偿拍板", desc: "待拍板：" + st.flags.layoff17Choice.join("、") + "（支付 10 万/人 / 不支付）" });
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

    /* ============ 2020 线（共渡）：疫情年，五条主线 ============ */
    if (st.era === "2020") {
      const lockPeak = st.month <= 3;   // 1~3 月：聚众类行动停办（公演/团建）
      const rep20 = this.isReplicate(st);
      const covidDesc = { 0: "防疫部署：物资采购与《疫情期运营管理办法》成文（需资金≥20万）", 1: "返工安排：分批错峰返工与隔离防疫制度落地", 2: "防疫与返工体系已建成" };
      const cloudDesc = { 0: "策划案：机位/推流/线上打投体系立项", 1: "技术测试：全流程彩排（需资金≥20万）", 2: "首场试播：云公演正式上线" };
      const acts20 = [];
      if (st.decisions.branch19Keep === "keep") {
        acts20.push({ id: "reorg20", main: true, name: "安置分团成员", desc: st.reorg20.done
          ? "安置已完成——上调本部/旗号留任/IDFT 全部归位"
          : "CKG48/SHY48 解散：成员逐人拍板去向（上调本部每阉13~20人；保留旗号的分团可留任16人；其余移入 IDFT）",
          disabled: st.reorg20.done || !st.members.some(m => m.status === "branch" && (m.branchTeam === "SHY48" || m.branchTeam === "CKG48")) });
      }
      acts20.push(
        { id: "covid20", main: true, name: "防疫与返工安排", desc: covidDesc[st.covid20.done ? 2 : st.covid20.stage],
          disabled: st.covid20.done || (st.covid20.stage === 0 && st.money < 20),
          disabledTip: st.covid20.stage === 0 && st.money < 20 ? "资金不足（需≥20万）" : "" },
        { id: "cloud20", main: true, name: "策划云公演", desc: st.cloud20.done ? "云公演体系运行中——本月「剧场公演」已替换为线上「云公演」" : cloudDesc[st.cloud20.stage],
          disabled: st.cloud20.done || (st.cloud20.stage === 1 && st.money < 20),
          disabledTip: st.cloud20.stage === 1 && st.money < 20 ? "资金不足（需≥20万）" : "" },
      );
      if (rep20) {
        acts20.push({ id: "teb20", main: true, name: "与日方和平分手", desc: st.teb20.done
          ? "分手事宜已办妥" : "以财政压力为由将 TEB48 还给日方，并以此为契机洽谈和平分手" + (st.teb19 && st.teb19.open ? "（台北成员需先安置）" : ""),
          disabled: st.teb20.done });
      }
      acts20.push(
        { id: "ge", main: true, name: "筹备总选举", desc: "线上打投组织与物料（8月线上总选前，筹备度+18）",
          disabled: st.month < 2 || st.month > 7 || st.geDone },
        { id: "rt", main: true, name: "筹备金曲大赏", desc: "舞台编排与新歌打磨（12月线上大赏前，筹备度+20）",
          disabled: st.month < 10 || st.month > 12 || st.rtDone },
        { id: "gen1", main: true, name: "一期生合约", desc: st.gen1.done ? "一期生去留已全部拍板" : "一期生合约年内全部到期（赵嘉敏学业线除外）——总选落幕后逐人拍板",
          disabled: st.gen1.done || st.month < 9, disabledTip: st.month < 9 ? "总选落幕后（9月）开放" : "" },
        ...(st.decisions.htt19 === "promise" && st.members.some(x => x.name === "黄婷婷" && x.status === "active") ? (() => {
          /* 【2020·黄婷婷承诺线】htt19=promise 专属（同葛佳慧专辑事件口径）：
             年间走访她≥1次、特训她≥3次后方可兑现；需资金≥40万。 */
          const v = !!st.flags.httVisit20, c = st.flags.httCoach20 || 0;
          return [{ id: "htt20", main: true, name: "兑现给黄婷婷的承诺", desc: st.flags.httPromise20Done ? "承诺已兑现——待遇账本对上了"
            : "2019 年末的承诺回收：走访她 " + (v ? "1/1" : "0/1") + " · 特训她 " + c + "/3，齐备后可兑现（需资金≥40万）",
            disabled: st.flags.httPromise20Done || !v || c < 3 || st.money < 40,
            disabledTip: st.money < 40 ? "资金不足（需≥40万）" : (!v || c < 3) ? "承诺的账要一笔笔对：先走访她 1 次、特训她 3 次" : "" }];
        })() : []),
        { id: "visit", main: true, name: "走访成员", desc: "与一名成员谈心：羁绊↑ 士气↑ 叶盛负担↓（视频连线）" },
        { id: "duty", name: "替叶盛值班", desc: "接手一轮成员事务：叶盛负担-15" },
        { id: "show", name: lockPeak ? "剧场公演（停办）" : (st.cloud20.done ? "云公演" : "剧场公演（空场）"),
          desc: lockPeak ? "疫情封控，聚众活动停办——4月起恢复（收益减半）"
            : st.cloud20.done ? "线上开演：资金↑ 热度↑ 士气↓（收益减半口径）"
            : "空场录制：资金↑ 热度↑ 士气↓（收益减半口径）",
          disabled: lockPeak, disabledTip: lockPeak ? "政策原因：聚众活动不能进行（1~3月）" : "" },
        { id: "business", name: "商务合作", desc: "接代言与商演：资金↑↑ 热度↓ 叶盛负担↑" },
        { id: "train", name: "全团特训", desc: "提升训练度（分批错峰训练）：花费15万，全团实力+1" },
        { id: "promo", name: "宣传造势", desc: "线上投放与话题运营：热度+10（花费20万）" },
      );
      /* 【2020】疫情裁撤补偿拍板（layoff20Choice 非空时出现；动态分配后待拍板名单） */
      if ((st.flags.layoff20Choice || []).length) {
        acts20.push({ id: "layoff20", main: true, name: "疫情裁撤补偿拍板", desc: "待拍板：" + st.flags.layoff20Choice.join("、") + "（支付 15 万/人 / 不支付）" });
      }
      return acts20;
    }

    /* ============ 2019 线（双岸）：五条主线 ============ */
    if (st.era === "2019") {
      const t19 = st.teb19;
      const tebDesc = {
        0: "参与日方台北选拔：运营代表坐进甄选席（热度+4）",
        1: "剧场选址：台北星梦剧院租赁与改造（需资金≥200万，投入200万）",
        2: "招商：「双岸」招商说明会（招商款+50万）",
        3: "派遣移籍决定：全团点将至多5人，可以一个不派",
        4: "TEB48 已建成——台北星梦剧院运营中",
      };
      const acts19 = [];
      if (st.decisions.teb19Push === "go") {
        acts19.push({ id: "teb19", main: true, name: "推进TEB48筹建", desc: tebDesc[t19.stage],
          disabled: t19.done || (t19.stage === 1 && st.money < 80),
          disabledTip: t19.stage === 1 ? "资金不足（需≥200万）" : "" });
      }
      acts19.push(
        { id: "reorg19", main: true, name: "推进二次组阁", desc: st.reorg19.done ? "二次组阁已完成——新体制运行中" : "全团重排：本部每队13~20人、预备生≤16人；名额放不下的发配分团或移籍 IDFT",
          disabled: st.reorg19.done },
        { id: "outreach19", main: true, name: "借风布局外务", desc: st.outreach19.done ? "外务布局已成体系落地" : "借选秀余温打包谈判综艺/代言/晚会（一次性收益60~90万，需2018选秀录制完成）",
          disabled: st.outreach19.done || !st.show18 || !st.show18.done,
          disabledTip: !st.show18 || !st.show18.done ? "选秀首轮录制尚未完成，东风未起" : "" },
        { id: "ge", main: true, name: "筹备总选举", desc: "打投组织、物料与拉票（7月第六届总决选前，筹备度+18）",
          disabled: st.month < 2 || st.month > 6 || st.geDone },
        { id: "rt", main: true, name: "筹备金曲大赏", desc: "舞台编排与新歌打磨（12月大赏前，筹备度+20）",
          disabled: st.month < 10 || st.month > 12 || st.rtDone },
        { id: "coach", main: true, name: "安排成员特训", desc: "一对一特训：目标成员实力+6 羁绊+4（耗资20万）" },
        { id: "visit", main: true, name: this.branchDutyPost(st) ? "分团巡访" : "走访成员", desc: this.branchDutyPost(st) ? "赴" + this.branchDutyPost(st) + "与成员谈心：羁绊↑ 士气↑ 叶盛负担↓" : "与一名成员谈心：羁绊↑ 士气↑ 叶盛负担↓" },
        { id: "duty", name: this.branchDutyPost(st) ? "分团事务值班" : "替叶盛值班", desc: this.branchDutyPost(st) ? "接手一轮" + this.branchDutyPost(st) + "日常事务：叶盛负担-15" : "接手一轮成员事务：叶盛负担-15" },
        { id: "show", name: "剧场公演", desc: "稳定票仓：资金↑ 热度↑ 士气↓" },
        { id: "business", name: "商务合作", desc: "接代言与商演：资金↑↑ 热度↓ 叶盛负担↑" },
        { id: "train", name: "全团特训", desc: "提升训练度（影响公演收入与大赏评分）：花费15万，全团实力+1" },
        { id: "promo", name: "宣传造势", desc: "投放物料与线下活动：热度+10（花费20万）" },
      );
      return acts19;
    }

    /* ============ 2027 线（大河新篇）：五条主线 ============ */
    if (st.era === "2027") {
      const b27 = st.branch27;
      const whDesc = {
        0: "WHN48 立项启动：对接武汉方面，敲定剧场与筹备组（王婧督办）",
        1: "武汉星梦剧院改造（需资金≥220万，投入200万）",
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
          disabledTip: b27.stage === 1 ? "资金不足（需≥220万）" :
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

  /* 【v0.13.1】全线通用：在各年代线行动列表末尾追加「队伍团建」 */
  listActions() {
    const st = this.st;
    const acts = this.listActionsCore();
    const lockPeak = st.era === "2020" && st.month <= 3;   // 2020 疫情：1~3 月聚众类行动停办
    const ok = st.money >= 15 && !lockPeak;
    acts.push({
      id: "teamBld", name: lockPeak ? "队伍团建（停办）" : "队伍团建",
      desc: lockPeak ? "政策原因：聚众活动不能进行（1~3月）"
        : "为指定队伍安排团建：磨合度+6 士气+2 队友关系小幅升温（耗资15万）",
      disabled: !ok, disabledTip: ok ? "" : lockPeak ? "政策原因：聚众活动不能进行（1~3月）" : "资金不足（需≥15万）",
    });
    /* 【全线通用】队伍团建（v0.13.1）+ 公演站位调整（用户口径 2026-10-26：总选后解锁，逐队拍板） */
    const stageTeamsAvail = st.geDone && !st.flags.stageSettled ? this.stageTeams(st) : [];
    if (stageTeamsAvail.length) {
      const stg = this.stageInit(st);
      const doneN = stageTeamsAvail.filter(t => stg.done[t]).length;
      acts.push({
        id: "stageSet", name: "公演站位调整",
        desc: "逐队拍板大歌 16 人站位与五个 unit（每队 1 行动点）：已拍板 " + doneN + "/" + stageTeamsAvail.length + " 队",
      });
    }
    return acts;
  },

  /* 执行行动（payload 供 visit 使用）。返回 {text, tone} 给 UI 提示与记日志 */
  doAction(id, payload) {
    const st = this.st;
    if (st.ap <= 0) return null;
    let res = { text: "", tone: "normal" };

    switch (id) {
      case "teamBld": {
        /* 【v0.13.1】队伍团建（全线通用）：先弹队伍选择窗（早退不耗AP），选定后落地 */
        if (st.era === "2020" && st.month <= 3) return { text: "政策红线：疫情期间聚众活动不能进行。", tone: "blocked" };
        if (!payload || !payload.team) return { text: "", tone: "pickTeamBld" };
        const tbKey = payload.team;
        const tbRoster = this.teamRoster(st, tbKey);
        if (!tbRoster.length) return { text: "该队伍当前没有在册成员。", tone: "blocked" };
        if (st.money < 15) return { text: "资金不足（队伍团建需15万）。", tone: "blocked" };
        st.money -= 15;
        if (st.chem[tbKey] == null) { st.chem[tbKey] = this.calcChem(st, tbKey); st.chemStable[tbKey] = st.chemStable[tbKey] || 0; }
        st.chem[tbKey] = Math.min(100, st.chem[tbKey] + 6);
        st.morale = this.clamp(st.morale + 2, 0, 100);
        /* 团建升温：每人随机与一位队友关系+1（殿堂/影视部成员不参与队伍排班，跳过） */
        const tbList = tbRoster.filter(m => !m.hall);
        for (const m of tbList) {
          const mates = tbList.filter(x => x.id !== m.id);
          if (mates.length) this.relAdd(st, m.id, mates[this.rnd(0, mates.length - 1)].id, 1);
        }
        res = { text: tbKey + " 团建圆满结束——磨合度+6（现 " + st.chem[tbKey] + "），队内气氛明显升温（士气+2）。", tone: "good" };
        break;
      }
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
      case "htt20": {
        res = this.advanceHtt20();
        break;
      }
      case "layoff20": {
        /* 【2020】疫情裁撤补偿拍板：不耗行动点，转交 UI 拍板窗（支付/不支付） */
        if (!(st.flags.layoff20Choice || []).length) return { text: "当前没有待拍板的裁撤补偿。", tone: "blocked" };
        return { text: "", tone: "layoff20Pick", names: st.flags.layoff20Choice.slice() };
      }
      case "layoff17": {
        /* 【2017】名册精简补偿拍板：不耗行动点，转交 UI 拍板窗（支付/不支付） */
        if (!(st.flags.layoff17Choice || []).length) return { text: "当前没有待拍板的名册精简补偿。", tone: "blocked" };
        return { text: "", tone: "layoff17Pick", names: st.flags.layoff17Choice.slice() };
      }
      case "stageSet": {
        /* 【全线通用】公演站位调整（用户口径 2026-10-26）：
           无 payload → 队伍选择窗（不耗 AP）；{team} → 编辑窗（不耗 AP）；
           {team, assign} → 落地该队拍板（耗 1 AP，校验失败不耗 AP）。 */
        if (!st.geDone) return { text: "总选尚未落幕——公演站位调整在总选完成后开放。", tone: "blocked" };
        if (!payload || !payload.team) return { text: "", tone: "stageTeamPick" };
        if (!this.teamRoster(st, payload.team).length) return { text: "该队伍当前没有在册成员。", tone: "blocked" };
        if (!payload.assign) return { text: "", tone: "stageEdit", team: payload.team };
        const stgRes = this.applyStage(st, payload.team, payload.assign, {});
        if (stgRes.err) return { text: stgRes.err, tone: "blocked" };
        const stg = this.stageInit(st);
        const teamsAll = this.stageTeams(st);
        const doneN = teamsAll.filter(t => stg.done[t]).length;
        res = { text: payload.team + " 公演站位已拍板（" + doneN + "/" + teamsAll.length + " 队完成）。" +
          (stgRes.msgs.length ? "\n" + stgRes.msgs.join("；") + "。" : " 队内无人对站位有异议。"), tone: "good" };
        break;
      }
      case "teb19": {
        if (st.decisions.teb19Push !== "go") return { text: "TEB48 今年没有立项——序章时未拍板推进。", tone: "blocked" };
        const blockedT = this.teb19BlockReason();
        if (blockedT) return { text: "TEB48 筹建暂无法推进：" + blockedT, tone: "blocked" };
        res = this.advanceTeb19();
        if (res.tone === "pickTeb19") return res;   // 派遣决定不消耗行动点
        break;
      }
      case "reorg19": {
        res = this.advanceReorg19();
        break;
      }
      case "outreach19": {
        res = this.advanceOutreach19();
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
        /* 【2020·黄婷婷承诺线】特训她计数（htt19=promise 专属；兑现需特训≥3次） */
        if (st.era === "2020" && st.decisions.htt19 === "promise" && m.name === "黄婷婷") {
          st.flags.httCoach20 = (st.flags.httCoach20 || 0) + 1;
        }
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
        if (st.month < 2 || st.month > (st.era === "2020" ? 7 : 6) || st.geDone)
          return { text: st.era === "2020" ? "当前不在总选举筹备期（2-7月，8月线上开榜）。" : "当前不在总选举筹备期（2-6月）。", tone: "blocked" };
        st.gePlan = this.clamp(st.gePlan + 18, 0, 100);
        st.money -= 25;
        res = { text: "总选举筹备推进" + (st.era === "2020" ? "（线上打投体系）" : "") + "：打投组、物料组就位。筹备度+18，资金-25万。", tone: "main" };
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
        /* v0.11.10：分团成员（branch）也可走访（分团巡访）——移籍分团不中断羁绊培养，
           此前培养的羁绊/人气在上调回本部时（2018 组阁/预备生公演）完整保留并享上调红利。 */
        if (!m || (m.status !== "active" && m.status !== "branch")) return null;
        m.bond = this.clamp(m.bond + 12, 0, 100);
        st.morale = this.clamp(st.morale + 3, 0, 100);
        st.burden = this.clamp(st.burden - 8, 0, 100);
        /* 【2020·黄婷婷承诺线】走访她登记（htt19=promise 专属；兑现需走访≥1次） */
        if (st.era === "2020" && st.decisions.htt19 === "promise" && m.name === "黄婷婷") {
          st.flags.httVisit20 = true;
        }
        const lines = m.status === "branch" ? [
          "你飞了一趟" + (m.branchTeam || "分团") + "，在排练厅后头和{name}聊了一下午。",
          "你去看了一眼{name}在" + (m.branchTeam || "分团") + "的公演，散场后在后台递上了一瓶水。",
          "巡访的间隙，你请{name}吃了顿当地宵夜，听她讲分团的日子。",
        ] : [
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
        const income = Math.round((45 + st.heat * 0.3 + st.train * 0.5) * (st.era === "2020" ? 0.5 : 1));
        st.money += income;
        st.heat = this.clamp(st.heat + 4, 0, 100);
        st.morale = this.clamp(st.morale - 4, 0, 100);
        if (st.era === "2020") {
          if (st.month <= 3) return { text: "政策红线：疫情期间聚众活动不能进行。", tone: "blocked" };
          if (st.cloud20.done) st.cloud20.held += 1;
          res = { text: (st.cloud20.done ? "云公演" : "空场录制的公演") + "收官，线上票房与打投 +" + income + " 万。（热度+4 士气-4；疫情年收益减半）", tone: "good" };
        } else {
          res = { text: "剧场公演满座，票房 +" + income + " 万，应援声浪持续到深夜。（热度+4 士气-4）", tone: "good" };
        }
        break;
      }
      case "covid20": res = this.advanceCovid20(); break;
      case "cloud20": res = this.advanceCloud20(); break;
      case "reorg20": res = this.advanceReorg20(); break;
      case "teb20": res = this.advanceTeb20(); break;
      case "gen1": return { text: "", tone: "pickGen1" };   // 转交 UI 一期生逐人拍板窗
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
    if (s === 2 && st.money < 220) return "资金不足（需≥220万）";
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
      st.money -= 200; st.cgt.stage = 3;
      return { text: "成都剧场翻新开工：舞台、灯光、地板全部更换。（资金-200万）", tone: "main", vn: STORY.scenesCgt.theater };
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
    if (!b.shyOpen && b.shy === 0 && st.money < 220) return "资金不足（SHY48 剧场需≥220万）";
    if (b.ckg === 1 && st.money < 220) return "资金不足（CKG48 剧场需≥220万）";
    if (b.ckg === 2 && st.morale < 55) return "士气不足（需≥55）";
    return null;
  },

  /* 双团开设推进（2017 线：先沈阳后重庆；阶段场景见 STORY.scenes17） */
  advanceBranch17() {
    const st = this.st, b = st.branch17;
    if (!b.shyOpen && b.shy === 0) {
      st.money -= 200; b.shy = 1;
      return { text: "SHY48 剧场改造全面展开，一期生集训进入冲刺。（资金-200万）", tone: "main", vn: STORY.scenes17.shyPrep };
    }
    if (b.ckg === 0) {
      b.ckg = 1;
      return { text: "重庆筹备组进驻解放碑：CKG48 立项启动，剧场选址与首批苗子锁定。", tone: "main", vn: STORY.scenes17.ckgStart };
    }
    if (b.ckg === 1) {
      st.money -= 200; b.ckg = 2;
      return { text: "重庆星梦剧院改造开工：山城的坡道上，第二座支流动工了。（资金-200万）", tone: "main", vn: STORY.scenes17.ckgTheater };
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

  /* ============================ 经济系统 v2（经营压力版） ============================
     月支出不再是一个固定数，而是四项合计：
     ① 本部工资：在册本部成员（status=active，含预备生/影视部）每人每月 0.5 万
        ——暂休成员（status=rest）不发工资；招新/毕业/移籍会实时改变这笔支出；
     ② TOP7 分成：最近一届总决选 TOP7 且未升入荣誉殿堂的在册成员，按名次月付
        ——第1名 3万、第2~3名 各2万、第4~7名 各1万（总决选结算后生效，跨年延续）；
     ③ 分团维系：分团在册成员的工资（每人 0.35 万估算，IDFT 训练生池不计）
        ——分团人越多，维系越贵；分团撤资/停运会实时减负；
     ④ 固定运营：剧场租金、设备折旧、行政后勤等（各年代线基数不同）。
     收入基数已按人头成本重校，正常经营下月收支在盈亏线附近浮动——
     热度/训练度低迷、人浮于事的月份，是真会亏的。 */
  SALARY_UNIT: 0.5,            // 本部成员月薪（万）
  BRANCH_UPKEEP_UNIT: 0.35,    // 分团成员月薪估算（万）
  FIXED_EXPENSE: { "2016": 25, "2017": 30, "2018": 32, "2019": 34, "2020": 34, "2026": 26, "2027": 28 },

  /* 在册本部成员数（暂休 rest 不计工资） */
  hqPayrollCount(st) {
    return st.members.filter(m => m.status === "active").length;
  },

  /* 分团在册成员数（IDFT 训练生池 status=idft，不计维系费） */
  branchPayrollCount(st) {
    return st.members.filter(m => m.status === "branch").length;
  },

  /* TOP7 分成：最近一届总决选 TOP7（flags.geTop7），离团/升堂者自动停付 */
  top7Share(st) {
    const names = (st.flags && st.flags.geTop7) || [];
    let sum = 0, n = 0;
    names.forEach((name, i) => {
      const m = st.members.find(x => x.name === name);
      if (!m || m.status === "left" || m.hall) return;
      sum += i === 0 ? 3 : (i <= 2 ? 2 : 1);
      n += 1;
    });
    return { sum, n };
  },

  /* 汇总本月收支（供结算表展示） */
  settle(st) {
    let income;
    if (st.era === "2020") {
      /* 2020：疫情年。1~3 月收益停止（剧场停摆）；4 月起收益减半（上座受限，云公演补位）。
         TEB48 开业收入延续至分手；SHY48/CKG48 开业收入延续至安置落地（剧场关停）。 */
      const base = 70 + st.heat * 0.5 + st.train * 0.25
        + (st.teb19 && st.teb19.open ? 25 : 0)
        + (st.branch17 && st.branch17.shyOpen ? 20 : 0) + (st.branch17 && st.branch17.ckgOpen ? 25 : 0);
      income = st.month <= 3 ? 0 : base * 0.5;
    } else if (st.era === "2026") {
      /* 2026：危局之年（人头成本重校后基数 95）；CGT48 重建成功后贡献月收入 */
      income = 95 + st.heat * 0.5 + st.train * 0.25 + (st.cgt.open ? 25 : 0);
    } else if (st.era === "2027") {
      /* 2027：回暖之年（基数 86）；成都（2026 重建成功）与 WHN48 开业后各贡献月收入 */
      income = 86 + st.heat * 0.5 + st.train * 0.25
        + (st.cgt && st.cgt.open ? 25 : 0) + (st.branch27 && st.branch27.open ? 25 : 0);
    } else if (st.era === "2017") {
      /* 2017：基数 75，SHY48/CKG48 开业后各自贡献月收入 */
      income = 75 + st.heat * 0.5 + st.train * 0.25
        + (st.branch17.shyOpen ? 20 : 0) + (st.branch17.ckgOpen ? 25 : 0);
    } else if (st.era === "2019") {
      /* 2019：多事之年（基数 82）；SHY48/CKG48 开业收入延续（序章放弃则关停）、
         TEB48 开业后贡献月收入 */
      income = 82 + st.heat * 0.5 + st.train * 0.25
        + (st.branch17 && st.branch17.shyOpen ? 20 : 0) + (st.branch17 && st.branch17.ckgOpen ? 25 : 0)
        + (st.teb19 && st.teb19.open ? 25 : 0);
    } else if (st.era === "2018") {
      /* 2018：组阁年（基数 80）；SHY48/CKG48 延续月收入 */
      income = 80 + st.heat * 0.5 + st.train * 0.25
        + (st.branch17 && st.branch17.shyOpen ? 20 : 0) + (st.branch17 && st.branch17.ckgOpen ? 25 : 0);
    } else {
      /* 2016：基数 58；分团官宣后贡献月收入 */
      income = 58 + st.heat * 0.5 + st.train * 0.25 + (st.branch.announce ? 35 : 0);
    }
    /* —— 支出四项 —— */
    const hqCount = this.hqPayrollCount(st);
    const brCount = this.branchPayrollCount(st);
    const t7 = this.top7Share(st);
    const salary = hqCount * this.SALARY_UNIT;
    const branchCost = Math.round(brCount * this.BRANCH_UPKEEP_UNIT * 10) / 10;
    const top7 = t7.sum;
    const fixed = this.FIXED_EXPENSE[st.era] != null ? this.FIXED_EXPENSE[st.era] : 30;
    income = Math.round(income);
    const rawExpense = salary + top7 + branchCost + fixed;
    /* 2020 疫情年：1~3 月公司半速运转，支出减半 */
    const expense = Math.round(st.era === "2020" && st.month <= 3 ? rawExpense * 0.5 : rawExpense);
    return {
      income, expense, net: income - expense,
      detail: { salary, top7, top7Count: t7.n, branchCost, fixed, hqCount, brCount },
    };
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

    /* ③' 成员关系 & 队伍磨合度月度推进（v0.13.0 · 全线通用）：
       稳定加成（连续三个月无人员变动 → 每月磨合+1）/ 半年同队关系+1 /
       低磨合队伍（<40）每月随机磨损队友关系。人员变动（升格/移籍/组阁/招新等）
       由 syncTeams 按队伍成员指纹自动识别——重算磨合初始值并取消稳定加成。 */
    this.tickRelations(st);

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
      : st.era === "2026" ? STORY.monthly26
      : st.era === "2020" ? STORY.monthly20
      : st.era === "2019" ? STORY.monthly19
      : st.era === "2018" ? STORY.monthly18
      : st.era === "2017" ? STORY.monthly17 : STORY.monthly;
    let randomSrc;
    if (st.era === "2027") randomSrc = STORY.randomPool26.concat(STORY.randomPool27 || []);
    else if (st.era === "2026") randomSrc = STORY.randomPool26;
    else if (st.era === "2020") randomSrc = [];   // 疫情年：月度表覆盖全年，不挂 2016 随机池
    else if (st.era === "2019") randomSrc = STORY.randomPool.concat(STORY.randomPool19 || []);
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

    /* ⑥ 七月：总选举结算（2020 疫情年延迟至 8 月线上举行，见下） */
    if (st.month === 7 && !st.geDone && st.era !== "2020") {
      steps.push(this.resolveGE(st));
      this.applyHallReign(st, steps);   // 【荣誉殿堂】连霸升堂统一判定（各年代线通用规则）
    }
    /* 【2020】疫情年总选举延迟至 8 月：线上直播收费、不卖票，活动收益减半（用户口径） */
    if (st.month === 8 && !st.geDone && st.era === "2020") {
      st.flags.geOnline20 = true;
      steps.push(this.resolveGE(st));
      this.applyHallReign(st, steps);
    }

    /* ⑦ 十二月：金曲大赏结算（2020 疫情年改为线上直播收费，收益减半；2026/2027 线若被取消则改为年末总结会）+ 年度结局 */
    if (st.month === 12) {
      /* 【全线通用】公演站位·年末结算（用户口径 2026-10-26）：未拍板队伍默认一键安排，
         按年末站位结算人气加成——先于年度评分与跨年继承，数值计入下一年。 */
      this.settleStage(st);
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
      type: "vn", title: typeof ev.title === "function" ? ev.title(st) : ev.title,
      pages: pages.map(p => ({ ...p, t: this.fmt(p.t) })),
      after: (ev.after || []).map(p => ({ ...p, t: this.fmt(p.t) })),   // 选项结算后追加的公共剧情
      choices: ev.choices ? ev.choices.map(c => ({
        label: c.label, hint: typeof c.hint === "function" ? c.hint(st) : (c.hint || ""),
        gate: c.gate ? c.gate(st) : true,
        tag: c.tag, value: c.value,          // 决策标签透传给 UI
        pickMode: c.pickMode,                // 特殊交互模式（如 sii5：Team SII 五人选将）
        run: () => { if (c.tag) this.recordDecision(c.tag, c.value !== undefined ? c.value : c.tag); return c.effect(this.st); },
      })) : null,
    };
  },

  /* 总选举结算：生成排名 + 叙事 + 奖励 */
  /* 【荣誉殿堂·通用连霸升堂（v0.11.8）】任意成员连续两年总选第一即升堂：
     引擎按「上一年总选第一 tag」判定（resolveGE 每年登记 decisions["ge{年}Top1"]，
     跨线交接存入 history），不再由剧情事件升堂。
     上年基准：2017=history.ge2016Top1 / 2018=history.ge2017Top1 / 2027=history.ge2026Top1；
     2026=杨冰怡（2025 史实第一，游戏内无 2025 数据的既定前提）；2016 无基准（2015 无游戏数据）不判定。
     非连霸不升堂、保持在籍；升堂者金边卡（team=HALL），此后不再参加总选举。 */
  applyHallReign(st, steps) {
    if (!st.geResult || !st.geResult.top1) return;
    const mark = st.era === "2026" ? "bingyiHall" : "hall" + st.era.slice(2);   // 判定已执行标记（hall17/hall18/hall19/hall27）
    if (st.flags[mark]) return;
    st.flags[mark] = true;
    const prevTop1 = st.era === "2026" ? "杨冰怡"
      : (st.history && st.history["ge" + (parseInt(st.era, 10) - 1) + "Top1"]) || null;
    if (!prevTop1 || st.geResult.top1 !== prevTop1) return;   // 非连霸：不升堂
    const top1 = st.members.find(m => m.name === st.geResult.top1);
    if (!top1 || top1.status === "left" || top1.hall) return;  // 防御：不在籍/已殿堂不重复升
    if (st.era !== "2026") st.flags["reignHall" + st.era.slice(2)] = true;
    top1.hall = true; top1.hallIdol = true; top1.team = "HALL"; top1.branchTeam = null; top1.status = "active";
    top1.note = st.era === "2026" ? "连续两届总决选第一名 · 升入荣誉殿堂"
      : st.era === "2017" ? "第三届、第四届总决选连霸 · 升入荣誉殿堂"
      : st.era === "2018" ? "第四届、第五届总决选连霸 · 升入荣誉殿堂"
      : st.era === "2019" ? "第五届、第六届总决选连霸 · 升入荣誉殿堂"
      : "第十三届、第十四届总决选连霸 · 升入荣誉殿堂";
    st.morale = this.clamp(st.morale + 3, 0, 100);
    st.heat = this.clamp(st.heat + 3, 0, 100);
    const vn = st.era === "2017" ? STORY.hallAscend17 : st.era === "2018" ? STORY.hallAscend18
      : st.era === "2019" ? STORY.hallAscend19
      : st.era === "2026" ? STORY.hallAscension : STORY.hallAscend27;
    const title = st.era === "2017" ? "荣誉殿堂 · 首位升堂"
      : st.era === "2026" ? "荣誉殿堂 · 升堂仪式" : "荣誉殿堂 · 连霸升堂";
    steps.push({ type: "vn", title, pages: vn(st).map(p => ({ ...p, t: this.fmt(p.t) })) });
  },

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
    // 2017/2018/2027 线新增：实力（pwr）为第二大影响因子（人气第一）；HALL 不参选；
    // 赵嘉敏仅 2016 年不参选（史实：本年未参加第三届总决选，无论在籍状态）——
    // 2017+ 按在籍状态自然判定：学业线 2017-09 学成归队后自 2018 总选恢复参选，
    // 官司暂休线 2018-06 毕业离团自然退出；2017 年 7 月总选时学业线尚未归队（rest 不在池）。
    const pwrW = (st.era === "2017" || st.era === "2018" || st.era === "2019" || st.era === "2027") ? 1.1 : 0;    // 实力权重（占比第二）
    const bondW = (st.era === "2017" || st.era === "2018" || st.era === "2019" || st.era === "2027") ? 0.6 : 0.8;
    const extraPool = st.era === "2027"
      ? (st.branch27 && st.branch27.open ? st.members.filter(m => m.status === "branch" && m.branchTeam === "WHN48") : [])
      : (st.branch.announce ? st.members.filter(m => m.status === "branch") : []);
    /* 【2020 新机制·用户口径】IDFT 训练生池成员入总选名单——入榜者可升格移籍（含分团，由玩家安排）；
       2020 总选除赵嘉敏外一期生不参选（一期生合约年，毕业公演后安置）。 */
    if (st.era === "2020") extraPool.push(...st.members.filter(m => m.status === "idft"));
    const pool = this.activeMembers(st).concat(extraPool)
      .filter(m => !(st.era === "2016" && m.name === "赵嘉敏") && m.team !== "HALL")   // 荣誉殿堂/影视部成员不参选
      .filter(m => st.era !== "2020" || m.gen !== "一期生" || m.name === "赵嘉敏");   // 2020：除赵嘉敏外一期生不参选
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
    /* 【荣誉殿堂·连霸基准】每年总选第一登记为决策 tag（ge2016Top1 / ge2017Top1 / …），
       次年总选结算据此判定连霸升堂（applyHallReign）；快速通道年份在 fastState* 里按史实预填同名 tag。 */
    st.decisions["ge" + st.era + "Top1"] = st.geResult.top1;
    /* 【2020 新机制·用户口径】登记各分团 TOP1（每个分团的第一名都可兼任本部队伍）
       与入榜 IDFT 成员（可升格移籍），由玩家在 9 月事件中逐项安排
       （flags.ge20BranchTop1 = 各分团 TOP1 名单数组 / ge20Idft）。 */
    if (st.era === "2020") {
      const brTeams = [];
      const b1List = [];
      for (const r of ranked) {
        if (r.m.status !== "branch" || !r.m.branchTeam || !top48.some(t => t.name === r.m.name)) continue;
        if (brTeams.indexOf(r.m.branchTeam) >= 0) continue;   // 每个分团只取名次最高的一位
        brTeams.push(r.m.branchTeam);
        b1List.push(r.m.name);
      }
      st.flags.ge20BranchTop1 = b1List;
      st.flags.ge20Idft = ranked.filter(r => r.m.status === "idft" && top48.some(t => t.name === r.m.name)).map(r => r.m.name);
    }
    /* 【经济系统 v2】TOP7 分成名单：总选后按名次登记（flags 跨年继承），
       此后每月按 第1名3万/2~3名2万/4~7名1万 支付分成，升堂/离团自动停付。 */
    st.flags.geTop7 = top48.slice(0, 7).map(r => r.name);
    /* 【总选前三档案】历届总选前三名单（flags 跨年继承；2020 一期生续约成功率加成用，用户口径） */
    st.flags.geTop3All = Array.from(new Set((st.flags.geTop3All || []).concat(top48.slice(0, 3).map(r => r.name))));
    for (const m of st.members) delete m.geBoost;

    /* 【2020 线特例】疫情年线上直播收费（flags.geOnline20），活动收益减半（用户口径）。 */
    const money = Math.round((120 + st.heat * 0.8) * (st.era === "2020" ? 0.5 : 1));
    st.money += money;
    st.heat = this.clamp(st.heat + (st.geStrategy === "focus" ? 15 : 12), 0, 100);
    this.addLog(st, st.month, "总选举落幕（" + (st.era === "2020" ? "线上直播" : "") + "），第一名：" + ranked[0].m.name + "。全团话题度暴涨。", "gold");

    const narr = st.geStrategy === "balance" ? STORY.geNarrative.balance : STORY.geNarrative.good;
    const crownPages = STORY.geNarrative.crown.map(p => ({
      ...p, s: p.s === "{top1}" ? ranked[0].m.name : p.s, t: this.fmt(p.t),
    }));
    const title = st.era === "2027" ? "第十四届偶像年度人气总决选 · 结果"
      : st.era === "2020" ? "第七届偶像年度人气总决选 · 线上直播 · 结果"
      : st.era === "2026" ? "SNH48 年度人气总决选 · 结果"
      : st.era === "2019" ? "「星梦远航」第六届总决选 · 结果"
      : st.era === "2018" ? "「砥砺前行」第五届总决选 · 结果"
      : st.era === "2017" ? "「我心翱翔」第四届总决选 · 结果"
      : "「比翼齐飞」第三届总决选 · 结果";
    const aftermath = st.era === "2027" ? STORY.geAftermath27(st)
      : st.era === "2026" ? STORY.geAftermath26
      : st.era === "2020" ? STORY.geAftermath20(st)
      : st.era === "2019" ? STORY.geAftermath19(st)
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
    if (st.era === "2020") money = Math.round(money * 0.5);   // 【2020】线上直播收费：收益减半（用户口径）
    st.money += money;
    st.heat = this.clamp(st.heat + heat, 0, 100);
    this.addLog(st, 12, "年度金曲大赏落幕（评价：" + tier + (origBonus ? "，含原创曲目加成" : "") + "）。资金+" + money + "万。", "gold");
    const rtNar = st.era === "2027" ? STORY.rtNarrative27 : st.era === "2020" ? STORY.rtNarrative20
      : st.era === "2019" ? STORY.rtNarrative19
      : st.era === "2018" ? STORY.rtNarrative18
      : st.era === "2017" ? STORY.rtNarrative17 : STORY.rtNarrative;
    const narPages = rtNar[tier === "great" ? "great" : "normal"];
    /* 【2016~2019】年度金曲榜单挂载 + 人气/关系加成 */
    const gold = this.resolveGoldSongs(st);
    return {
      type: "rtResult", tier, score, money, gold,
      title: "年度金曲大赏 · 收官",
      pagesAfter: (typeof narPages === "function" ? narPages(st) : narPages).map(p => ({ ...p, t: this.fmt(p.t) })),
    };
  },

  /* 【2016~2019】金曲大赏 TOP10 榜单（DATA.goldSongs）：
     · 2016 完全照表挂载；2017/2018 前三锁史实，4~10 歌名按史实、参演按人气生成；
     · 2019 公布模式不同：公布前8+队歌第一——年度金曲《就差一点点》即为第一，
       往上排名顺延，最下为年度荣耀队歌第一（按史实 BEJ48 Team B）；
     · 生成规则：同一成员至多参加两曲（已满顺延下一位）；史实为队伍参演的名次
       选磨合度最高的队伍（全榜队伍只能出现一次）；
     · 加成：前三参演成员人气+4（队伍参演则全队+2）；4~5名略低（+2 / 队伍+1）；
       共演成员相互关系提升（前三+3 / 其余+2；队伍参演则全队两两+1~2）。 */
  goldCastText(cast) {
    if (!cast) return "";
    return cast.team ? cast.team : (cast.names || []).join("、");
  },

  resolveGoldSongs(st) {
    const data = (typeof DATA !== "undefined" && DATA.goldSongs) ? DATA.goldSongs[st.era] : null;
    if (!data || !data.list) return null;
    const used = {};        // 成员名 → 已参加曲数（至多2）
    const usedTeams = {};   // 队伍只能出现一次
    const inRoster = m => m && (m.status === "active" || m.status === "branch") && !m.hall;
    const elig = st.members.filter(m => inRoster(m) && m.team !== "PREP" && m.name);
    const byPop = elig.slice().sort((a, b) => (b.pop || 0) - (a.pop || 0) || (a.id < b.id ? -1 : 1));
    const pickMembers = n => {
      const picks = [];
      for (const m of byPop) {
        if ((used[m.name] || 0) >= 2) continue;   // 已满两个节目 → 顺延
        picks.push(m);
        if (picks.length >= n) break;
      }
      return picks.map(m => m.name);
    };
    const BR_TEAMS = ["BEJ48", "GNZ48", "SHY48", "CKG48", "CGT48", "WHN48"];
    const pickTeam = () => {
      const cands = [];
      for (const t of ["SII", "NII", "HII", "X", "XII", "FT"])
        if (!usedTeams[t] && st.members.some(m => m.status === "active" && m.team === t)) cands.push(t);
      for (const t of BR_TEAMS)
        if (!usedTeams[t] && st.chem[t] != null && st.members.some(m => m.status === "branch" && m.branchTeam === t)) cands.push(t);
      let best = null, bestC = -1;
      for (const t of cands) {
        const c = st.chem[t] != null ? st.chem[t] : 0;
        if (c > bestC) { bestC = c; best = t; }
      }
      return best;
    };
    const list = [];
    const casts = new Map();
    /* 第一遍：史实锁定名次（前三/2016全榜）先登记——其成员计入“至多两曲”额度，
       史实队伍参演也计入“队伍只出现一次”，生成时才不会超额 */
    for (const e of data.list) {
      if (!e.fixed) continue;
      const cast = e.team ? { team: e.team, key: e.teamKey } : { names: e.names.slice() };
      casts.set(e, cast);
      if (cast.key) usedTeams[cast.key] = true;
      if (cast.names) for (const n of cast.names) used[n] = (used[n] || 0) + 1;
    }
    /* 第二遍：生成名次（按人气点人；队伍参演取磨合度最高队伍） */
    for (const e of data.list) {
      if (e.fixed) continue;
      let cast;
      if (e.gen === "team") {
        const t = pickTeam();
        if (t) {
          cast = { team: BR_TEAMS.indexOf(t) >= 0 ? t : "SNH48 Team " + t, key: t };
          usedTeams[t] = true;
        } else cast = { names: pickMembers(3) };   // 兜底：无可用队伍时按人气点三人
      } else {
        cast = { names: pickMembers(e.gen || 1) };
      }
      casts.set(e, cast);
      if (cast.key) usedTeams[cast.key] = true;
      if (cast.names) for (const n of cast.names) used[n] = (used[n] || 0) + 1;
    }
    for (const e of data.list) {
      list.push({ rank: e.rank, song: e.song, from: e.from || "", cast: casts.get(e), tag: e.tag || "", last: !!e.last });
    }
    /* —— 加成：参演成员人气 + 共演关系 —— */
    const boost = cast => {
      const r = typeof cast._r === "number" ? cast._r : 9;
      const top3 = r <= 3, top5 = r <= 5;
      if (cast.team) {
        const ms = st.members.filter(m => ((m.status === "active" && m.team === cast.key) || (m.status === "branch" && m.branchTeam === cast.key)) && !m.hall);
        for (const m of ms) m.pop = this.clamp((m.pop || 0) + (top3 ? 2 : top5 ? 1 : 0), 0, 100);
        const d = top3 ? 2 : 1;
        for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) this.relAdd(st, ms[i].id, ms[j].id, d);
      } else {
        const ms = (cast.names || []).map(n => st.members.find(m => m.name === n)).filter(inRoster);
        for (const m of ms) m.pop = this.clamp((m.pop || 0) + (top3 ? 4 : top5 ? 2 : 0), 0, 100);
        const d = top3 ? 3 : 2;
        for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) this.relAdd(st, ms[i].id, ms[j].id, d);
      }
    };
    for (const e of list) { e.cast._r = typeof e.rank === "number" ? e.rank : 9; boost(e.cast); }
    const top1 = list.find(e => e.rank === 1) || list[0];
    this.addLog(st, 12, "年度金曲榜单公布——年度金曲《" + top1.song + "》（" + this.goldCastText(top1.cast) + "）。", "gold");
    st.goldSongs = { year: st.era, list };
    return st.goldSongs;
  },

  /* ============================ 年度评分与结局 ============================ */

  computeGrade(st) {
    if (st.era === "2027") return this.computeGrade27(st);
    if (st.era === "2026") return this.computeGrade26(st);
    if (st.era === "2020") return this.computeGrade20(st);
    if (st.era === "2019") return this.computeGrade19(st);
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

  /* 2019 线年度评分（v0.12「双岸」）：
     二次组阁(20) + TEB48(15，仅拍板推进线计分) + 招新(10) + 总选(15) + 大赏(12)
     + 外务(8) + 实力成长(10) + 热度/4(≤10) + 士气/10(≤5) + 资金/60(≤5) − 赤字10
     → S≥90 / A≥70 / B≥55 / C（非复刻线无 TEB48，满分约 95，S 仍可达） */
  computeGrade19(st) {
    let score = 0;
    // ① 二次组阁（20）：落地 20 / 启动 8
    if (st.reorg19.done) score += 20;
    else if (st.reorg19.stage >= 1) score += 8;
    // ② TEB48（15，仅拍板推进线）：开业 15 / 招商后 8 / 选拔后 4
    if (st.decisions.teb19Push === "go") {
      if (st.teb19.open) score += st.teb19.openMonth <= 9 ? 15 : 10;
      else if (st.teb19.stage >= 2) score += 8;
      else if (st.teb19.stage >= 1) score += 4;
    }
    // ③ 年度招新（10）：完成招录 10（含部分招录 6）
    if (st.recruit19.done) score += (st.recruit19.hq + st.recruit19.br) > 0 ? 10 : 4;
    // ④ 总选举（15）
    if (st.geDone) {
      score += 12;
      const t1 = st.members.find(m => m.name === st.geResult.top1);
      if (t1 && t1.bond >= 60) score += 3;
    }
    // ⑤ 金曲大赏（12）
    if (st.rtScore >= 85) score += 12;
    else if (st.rtScore >= 65) score += 9;
    else if (st.rtDone) score += 4;
    // ⑥ 外务布局（8）
    if (st.outreach19.done) score += 8;
    // ⑦ 成员实力成长（10）：年末均值相较年初的提升×2
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
    st.ap = 4;
    this.save();
  },

  /* 当前月份显示 */
  dateLabel() {
    const st = this.st;
    return st.era + "年" + st.month + "月";
  },
};

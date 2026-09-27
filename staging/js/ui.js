/* ============================================================================
   ui.js — 界面渲染与交互
   ----------------------------------------------------------------------------
   屏幕流：标题 → 开局 → 序章(VN) → 经营主界面 →(月末步骤队列)→ 结局
   引擎联动：
     - Game.monthStart() 返回的 steps 先播（告别等），再交给玩家行动
     - 玩家 AP 用完（或主动）触发 endMonth()，steps 队列依次播放：
       settle 结算表 → vn 事件 → geResult/rtResult 大事件 → ending 结局
     - 播放完 Game.advanceMonth() + Game.monthStart() 进入新月
   所有弹窗复用 modal-root；VN 页面结构见 data_story.js 头部约定。
============================================================================ */

"use strict";

const UI = {

  /* ---------------- 基础工具 ---------------- */

  $(id) { return document.getElementById(id); },

  /* 便捷建元素：<tag class=cls>text</tag>
     text 可为：字符串 / Node / 数组（字符串与 Node 混合均可）。
     注意：不能用 textContent 直接赋值非字符串，否则会得到
     "[object HTMLSpanElement]" 之类的占位文本。 */
  el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) {
      const items = Array.isArray(text) ? text : [text];
      for (const it of items) {
        if (it instanceof Node) e.appendChild(it);
        else e.appendChild(document.createTextNode(String(it)));
      }
    }
    return e;
  },

  showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    this.$(id).classList.remove("hidden");
  },

  toast(msg, ms) {
    const t = this.$("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.add("hidden"), ms || 2400);
  },

  /* ---------------- 弹窗系统 ---------------- */

  /* show: (card) => void，card 为 .modal-card 元素；返回关闭函数 */
  modal(card) {
    const root = this.$("modal-root");
    root.innerHTML = "";
    root.classList.remove("hidden");
    root.appendChild(card);
    return () => this.closeModal();
  },

  closeModal() {
    const root = this.$("modal-root");
    root.classList.add("hidden");
    root.innerHTML = "";
  },

  /* 构建通用弹窗卡片 */
  card(title, sub) {
    const c = this.el("div", "modal-card");
    if (title) c.appendChild(this.el("div", "modal-title", title));
    if (sub) c.appendChild(this.el("div", "modal-sub", sub));
    return c;
  },

  /* ---------------- 步骤队列播放器 ---------------- */

  /* 依次播放 steps（月末/月初流程），全部结束后回调 */
  playSteps(steps, onDone) {
    let i = 0;
    const next = () => {
      if (i >= steps.length) { if (onDone) onDone(); return; }
      const step = steps[i++];
      this.playStep(step, next);
    };
    next();
  },

  playStep(step, next) {
    switch (step.type) {
      case "settle": this.stepSettle(step, next); break;
      case "vn": this.stepVN(step, next); break;
      case "chain": this.stepChain(step.events, next); break;
      case "geResult": this.stepGEResult(step, next); break;
      case "rtResult": this.stepRTResult(step, next); break;
      case "ending": this.showEnding(step.grade); break;   // 终局不再回调
      default: next();
    }
  },

  /* 月末结算表 */
  /* 存档码弹窗：textarea 呈现/粘贴存档码。cfg = { title, sub, code, readonly, confirmLabel, onConfirm(ta, close) } */
  showCodeModal(cfg) {
    const c = this.card(cfg.title, cfg.sub);
    const ta = this.el("textarea", "code-area");
    ta.value = cfg.code || "";
    ta.readOnly = !!cfg.readOnly;
    ta.setAttribute("spellcheck", "false");
    c.appendChild(ta);
    const btn = this.el("button", "btn btn-primary modal-close", cfg.confirmLabel);
    btn.onclick = () => cfg.onConfirm(ta, () => this.closeModal());
    c.appendChild(btn);
    this.modal(c);
  },

  /* 月度事件惰性链：播放每个事件前才评估其 gate——
     同一月末里，前置事件的选择可以解锁后续事件（如 下一站选SHY48/CKG48 → 开拓者点将） */
  stepChain(events, done) {
    const queue = (events || []).slice();
    const playNext = () => {
      let ev;
      while (queue.length) {
        const e = queue.shift();
        if (!e.gate || e.gate(Game.st)) { ev = e; break; }
      }
      if (!ev) { if (done) done(); return; }
      this.stepVN(Game.buildEventStep(ev, Game.st), playNext);
    };
    playNext();
  },

  /* 月末结算表 */
  stepSettle(step, next) {
    const st = Game.st;
    const c = this.card("月末结算 · " + Game.dateLabel(), "剧场的灯每晚都亮着，账本也是");
    const rows = [
      ["经营收入（公演/商务/分团）", "+" + step.income + " 万", "sr-plus"],
      ["固定运营支出", "-" + step.expense + " 万", "sr-minus"],
      ["本月净收支", (step.net >= 0 ? "+" : "") + step.net + " 万", step.net >= 0 ? "sr-plus" : "sr-minus"],
      ["账面资金", step.money + " 万", ""],
    ];
    for (const [k, v, cls] of rows) {
      const r = this.el("div", "settle-row");
      r.appendChild(this.el("span", "", k));
      const val = this.el("span", "sr-val " + cls, v);
      r.appendChild(val);
      c.appendChild(r);
    }
    if (step.money <= 60) c.appendChild(this.el("p", "modal-text", "⚠ 资金见底了——再这样下去，董事会要请你喝茶了。"));
    const btn = this.el("button", "btn btn-primary modal-close", "知道了");
    btn.onclick = () => { this.closeModal(); next(); };
    c.appendChild(btn);
    this.modal(c);
  },

  /* 通用 VN 事件弹窗（含 choices 分支）：逐页点击推进，末页出选项/继续 */
  stepVN(step, next) {
    const pages = step.pages.slice();
    const c = this.card(step.title || "", "");
    const body = this.el("div", "vn-body");
    body.style.minHeight = "auto";
    body.style.padding = "0 0 6px";
    c.appendChild(body);
    this.modal(c);

    let idx = 0;
    const finish = () => { this.closeModal(); if (next) next(); };

    const showEnd = () => {
      body.innerHTML = "";
      body.onclick = null;
      if (step.choices && step.choices.length) {
        const box = this.el("div", "vn-choices");
        for (const ch of step.choices) {
          if (ch.gate === false) continue;
          const b = this.el("button", "vn-choice", ch.label + (ch.hint ? "　—— " + ch.hint : ""));
          b.onclick = (e) => {
            e.stopPropagation();
            /* 特殊交互：pickMode="sii5" → Team SII 五人选将窗（宫泽佐江毕业公演）
                          pickMode="sii5m" → Team SII 五人选将窗（玛莉亚东京毕业公演）
                          pickMode="pioneer6" → 开拓者六人点将窗（2017 移籍名单） */
            if (ch.pickMode === "sii5") {
              this.closeModal();
              this.showSIIInvitePicker(finish);
              return;
            }
            if (ch.pickMode === "sii5m") {
              this.closeModal();
              this.showMariaInvitePicker(finish);
              return;
            }
            if (ch.pickMode === "pioneer6") {
              this.closeModal();
              this.showPioneerPicker(finish);
              return;
            }
            if (ch.pickMode === "kohaku5") {
              this.closeModal();
              this.showKohakuPicker(finish);
              return;
            }
            if (ch.pickMode === "kitahara5") {
              this.closeModal();
              this.showKitaharaPicker(finish);   // 北原里英东京毕业公演赴日名单（2018 复刻路线专属）
              return;
            }
            if (ch.pickMode === "ho2pick") {
              this.closeModal();
              this.showUnit18Picker("HO2", finish);
              return;
            }
            if (ch.pickMode === "bluevpick") {
              this.closeModal();
              this.showUnit18Picker("BlueV", finish);
              return;
            }
            if (ch.pickMode === "reorg18") {
              this.closeModal();
              this.showReorg18Picker(finish);   // 组阁编制会（2018 主线①，两阶段）
              return;
            }
            if (ch.pickMode === "cgtPromote") {
              this.closeModal();
              this.showCgtPromotePicker(finish);
              return;
            }
            if (ch.pickMode === "p23Promote") {
              this.closeModal();
              this.showP23PromotePicker(finish);
              return;
            }
            const resultText = ch.run();
            // 选择结果作为一段旁白接着播放（再接事件 after 公共剧情），播完再结束本事件
            this.closeModal();
            this.stepVN({ title: "——", pages: [{ nar: true, t: Game.fmt(resultText) }].concat(step.after || []) }, finish);
          };
          box.appendChild(b);
        }
        body.appendChild(box);
      } else {
        const btn = this.el("button", "btn btn-primary modal-close", "继续");
        btn.onclick = finish;
        body.appendChild(btn);
      }
    };

    const renderPage = () => {
      body.innerHTML = "";
      const p = pages[idx];
      if (p.nar) {
        body.appendChild(this.el("div", "vn-text narration", p.t));
      } else {
        const wrap = this.el("div", "vn-page");
        wrap.appendChild(this.el("span", "vn-speaker " + (p.cls || ""), p.s));
        wrap.appendChild(this.el("div", "vn-text", p.t));
        body.appendChild(wrap);
      }
      body.appendChild(this.el("div", "vn-hint", idx < pages.length - 1 ? "点击继续 ▼" : ""));
      body.onclick = () => {
        if (idx < pages.length - 1) { idx++; renderPage(); }
        else showEnd();
      };
    };
    renderPage();
  },

  /* 总选举结果 */
  stepGEResult(step, next) {
    const c = this.card(step.title, "打投、应援与一年的经营，都压在这串名字上");

    /* 单行排名：名次 + 队徽 + 姓名 + （展示用）票数 */
    const mkRow = r => {
      const row = this.el("div", "settle-row");
      row.appendChild(this.el("span", "", "第" + r.rank + "名"));
      const right = this.el("span", "sr-val" + (r.rank === 1 ? " sr-plus" : ""), "");
      right.appendChild(this.el("span", "team-badge tb-" + r.team, r.team));
      right.appendChild(document.createTextNode(r.name));
      right.appendChild(this.el("span", "ge-votes", "　" + (r.votes / 10000).toFixed(1) + " 万票"));
      row.appendChild(right);
      return row;
    };

    /* 完整 TOP48 总名单（滚动） */
    c.appendChild(this.el("p", "ge-sub", "═══ TOP48 总名单 ═══"));
    const list = this.el("div", "ge-list");
    step.top48.forEach(r => list.appendChild(mkRow(r)));
    c.appendChild(list);

    /* 分团 TOP7（史实：2016 分团首次参加总选，各选 TOP7） */
    if (step.bejTop7 && step.bejTop7.length) {
      c.appendChild(this.el("p", "ge-sub", "BEJ48 TOP7"));
      const b = this.el("div", "ge-top7");
      step.bejTop7.forEach((n, i) => b.appendChild(this.el("span", "ge-chip", (i + 1) + ". " + n)));
      c.appendChild(b);
    }
    if (step.gnzTop7 && step.gnzTop7.length) {
      c.appendChild(this.el("p", "ge-sub", "GNZ48 TOP7"));
      const g = this.el("div", "ge-top7");
      step.gnzTop7.forEach((n, i) => g.appendChild(this.el("span", "ge-chip", (i + 1) + ". " + n)));
      c.appendChild(g);
    }

    c.appendChild(this.el("p", "modal-text", "打投与门票为账面带来 " + step.money + " 万收入，全团热度大涨。"));
    const btn = this.el("button", "btn btn-primary modal-close", "见证这一夜");
    btn.onclick = () => {
      this.closeModal();
      this.stepVN({ title: "总选举之夜", pages: step.pagesAfter }, next);
    };
    c.appendChild(btn);
    this.modal(c);
  },

  /* 金曲大赏结果 */
  stepRTResult(step, next) {
    const tierText = { great: "大成功 —— 全场手机灯海，年度舞台没有之一", good: "成功 —— 稳稳的收官，口碑票房双收", normal: "平淡 —— 有惊无险地唱到了最后" }[step.tier];
    const c = this.card(step.title, "舞台质量评价：" + step.score + " / 100");
    c.appendChild(this.el("p", "modal-text", tierText + "\n\n门票与周边为账面带来 " + step.money + " 万。"));
    const btn = this.el("button", "btn btn-primary modal-close", "落幕");
    btn.onclick = () => {
      this.closeModal();
      this.stepVN({ title: "——", pages: step.pagesAfter }, next);
    };
    c.appendChild(btn);
    this.modal(c);
  },

  /* ---------------- 标题 / 开局 ---------------- */

  initTitle() {
    this.$("btn-new").onclick = () => this.showStart();
    /* 读档入口：有存档时显示存档详情卡（年代/进度/资金），点击载入 */
    const cont = this.$("btn-continue");
    let info = null;
    try {
      let raw = localStorage.getItem(Game.SAVE_KEY);
      if (!raw) raw = localStorage.getItem(Game.BACKUP_KEY);   // 主档缺失 → 备份
      if (raw) info = JSON.parse(raw);
    } catch (e) { info = null; }
    const eraName = info && info.era === "2027" ? "大河新篇"
      : info && info.era === "2026" ? "革新征程"
      : info && info.era === "2017" ? "本部新章" : "开辟分团";
    const ok = !!info && Game.hasSave();
    cont.classList.toggle("hidden", !ok);
    if (ok) {
      this.$("sc-line1").textContent = "读取存档 · " + info.era + "「" + eraName + "」线";
      this.$("sc-line2").textContent = info.year + "年" + info.month + "月 · 资金 " + info.money + " 万 · 热度 " + info.heat + " · 士气 " + info.morale;
    }
    cont.onclick = () => {
      const st = Game.load();
      if (!st) { this.toast("存档读取失败（版本不符或已损坏）"); return; }
      this.enterGame(false);
    };
    /* 「从存档码导入」常驻（无存档时它是找回进度的入口之一） */
    const imp = this.$("btn-import-title");
    imp.classList.remove("hidden");
    imp.onclick = () => {
      this.showCodeModal({
        title: "导入存档码",
        sub: "粘贴之前导出的存档码（以 SG48V1. 开头），确认后即可从标题页读档。",
        code: "",
        readonly: false,
        confirmLabel: "确认导入",
        onConfirm: (ta, close) => {
          const r = Game.importCode(ta.value);
          this.toast(r.msg);
          if (r.ok) { close(); this.showTitle(); }   // 重新初始化标题页，读档卡随即出现
        },
      });
    };
    /* 「从文件恢复进度」常驻（实测 360 本地打开不保留 localStorage，文件是最可靠兜底） */
    this.$("btn-file-title").classList.remove("hidden");
    this.$("btn-file-title").onclick = () => this.pickSaveFile(() => { this.showTitle(); this.toast("进度已从文件恢复，请点「读取存档」继续"); });
  },

  /* 保存进度为文件（触发浏览器下载 .sg48save）；file:// 下可用 */
  downloadSaveFile() {
    const f = Game.exportSaveFile();
    if (!f) { this.toast("还没有可导出的存档"); return; }
    try {
      const blob = new Blob([f.text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = f.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.toast("已下载存档文件：" + f.name + "（请勿改名后缀）");
    } catch (e) { this.toast("下载失败，请改用「导出存档码」"); }
  },

  /* 弹出文件选择器并读回存档文件；done 在成功后回调 */
  pickSaveFile(done) {
    const input = this.$("save-file-input");
    input.onchange = () => {
      const file = input.files && input.files[0];
      input.value = "";   // 允许重复选择同一文件
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const r = Game.importSaveText(String(reader.result), "进度已从文件恢复");
        this.toast(r.msg);
        if (r.ok && done) done();
      };
      reader.readAsText(file);
    };
    input.click();
  },

  showStart() {
    this.showScreen("screen-start");
    this._pickedEra = null;
    this.$("btn-start-game").disabled = true;
    this.$("btn-start-game").onclick = () => this.startPrologue();
    this.$("btn-back-title").onclick = () => this.showTitle();
    this.$("input-name").value = "";
    /* 五个开局年代：2016/2026 为完整线；2017/2018/2027 为快速通道（中途年份直入，v0.11.1） */
    const ERAS = ["2016", "2026", "2017", "2018", "2027"];
    const FAST = ["2017", "2018", "2027"];
    const cards = {};
    for (const e of ERAS) {
      cards[e] = this.$("era-card-" + e);
      cards[e].classList.remove("selected");
    }
    this.$("fast-track-warn").classList.add("hidden");
    const pick = era => {
      this._pickedEra = era;
      for (const e of ERAS) cards[e].classList.toggle("selected", e === era);
      this.$("fast-track-warn").classList.toggle("hidden", FAST.indexOf(era) < 0);
      this.$("btn-start-game").disabled = this.$("input-name").value.trim() === "";
    };
    for (const e of ERAS) cards[e].onclick = () => pick(e);
  },

  startPrologue() {
    const name = this.$("input-name").value.trim();
    if (!name) { this.toast("先写下你的名字吧"); return; }
    const FAST = ["2017", "2018", "2027"];
    if (this._pickedEra !== "2016" && this._pickedEra !== "2026" && FAST.indexOf(this._pickedEra) < 0) {
      this.toast("请选择一个开局年代"); return;
    }
    /* 快速通道：开局前补选影响当年的关键决策（缺失决策按史实默认），再伪造年末实况交接 */
    if (FAST.indexOf(this._pickedEra) >= 0) {
      const era = this._pickedEra;
      this.showFastTrackChoices(era, choices => {
        Game.newGameFast(name, era, choices);
        this.showPrologue();
      });
      return;
    }
    Game.newGame(name, null, this._pickedEra);
    this.showPrologue();
  },

  /* 【快速通道】中途年份开局的决策补选窗：按年代列出影响当年的关键决策组，
     每组单选、按史实默认预选；确认后交 Game.newGameFast 伪造年末实况并走真实交接。 */
  showFastTrackChoices(era, onDone) {
    const GROUPS = {
      "2017": [
        { key: "branchPost", title: "2016 年末 · 你的下一站（分团兼任）", def: "none", opts: [
          { v: "none", label: "婉拒调任，专注上海总部", d: "不加兼任，先守好本部（默认）" },
          { v: "GNZ48", label: "出任 GNZ48（广州）运营总监", d: "解锁 2017 分团线·广州篇（周马交接）" },
          { v: "CKG48", label: "调任 CKG48（重庆）运营总监", d: "解锁 2017 分团线·重庆篇（孟波交接）" },
          { v: "BEJ48", label: "出任 BEJ48（北京）运营总监", d: "解锁 2017 分团线·北京篇" },
          { v: "SHY48", label: "出任 SHY48（沈阳）运营总监", d: "含开拓者六人（快速通道按人气自动点定）" },
        ] },
        { key: "zhaoMin", title: "2016 年 6 月 · 赵嘉敏的学业与舞台", def: "rest", opts: [
          { v: "rest", label: "保留合约，批准暂休", d: "史实路线（默认）：2017 年 9 月触发后续事件" },
          { v: "study", label: "支持她专注学业（延迟毕业年限）", d: "2017 年 9 月学成归队、恢复在籍" },
          { v: "terminate", label: "尊重她的学业，协商解除合约", d: "违约金+150万；赵嘉敏已离团" },
        ] },
        { key: "jpMode", title: "2016 年末 · 对日合作基调", def: "normal", opts: [
          { v: "normal", label: "正常合作（原创公演路线）", d: "默认：2017 主线⑥为四队原创公演" },
          { v: "replicate", label: "复刻模式（日方授权曲目）", d: "2017 主线⑥变为四套复刻公演；铃木玛莉亚兼任延续" },
        ] },
      ],
      "2018": [
        { key: "branchPost", title: "2016–2017 · 分团兼任（主线⑥分担对象）", def: "none", opts: [
          { v: "none", label: "无分团兼任", d: "主线⑥为「分担叶盛」（默认）" },
          { v: "BEJ48", label: "兼任 BEJ48（北京）", d: "主线⑥为「专注 BEJ48 事务」" },
          { v: "GNZ48", label: "兼任 GNZ48（广州）", d: "主线⑥为「专注 GNZ48 事务」" },
          { v: "SHY48", label: "兼任 SHY48（沈阳）", d: "含开拓者六人已随开业进驻（快速通道自动处理）" },
          { v: "CKG48", label: "兼任 CKG48（重庆）", d: "含开拓者六人已随开业进驻（快速通道自动处理）" },
        ] },
        { key: "xiiKeep18", title: "2018 年 1 月 · Team XII 的去留（张怡的请求）", def: "dissolve", opts: [
          { v: "dissolve", label: "取消 XII 编制", d: "史实路线（默认）：组阁三步完成；XII 成员全员重编；资金+20" },
          { v: "keep", label: "保留 XII 编制", d: "组阁多一步编制确认；XII 参与本次编组；士气+4" },
        ] },
        { key: "zhaoState", title: "赵嘉敏的现状（2016–2017 决策合成）", def: "freeze", opts: [
          { v: "freeze", label: "官司暂休（史实路线）", d: "2018 年 6 月合约期满毕业、专注影视" },
          { v: "study", label: "学业线：已学成归队", d: "在籍至 2020 年 10 月（后续年份实装离团）" },
          { v: "release", label: "2017 无责解约", d: "公司放弃违约金放人；已离团" },
          { v: "terminate", label: "2016 协商解约", d: "违约金已收；已离团" },
        ] },
        { key: "jpMode", title: "2016 年末 · 对日合作基调（2018 复刻路线专属内容的前提）", def: "normal", opts: [
          { v: "normal", label: "正常合作（原创公演路线）", d: "默认：2017 主线⑥为四队原创公演" },
          { v: "replicate", label: "复刻模式（日方授权曲目）", d: "解锁 2018 复刻路线专属：红白歌会中国预赛（4月）；2017 主线⑥为四套复刻公演；《双面偶像》复刻决议自动作废" },
        ] },
        { key: "shuangmian17", title: "2017 年 8 月 · 《双面偶像》复刻决议（对日基调为原创线时生效）", def: "plan", opts: [
          { v: "plan", label: "坚持复刻到本部", d: "开启 2018 主线④「复刻《双面偶像》」（默认）" },
          { v: "giveup", label: "放弃复刻", d: "2018 无复刻主线（复刻模式下此项自动作废）" },
        ] },
        { key: "gejiahui17", title: "2017 年 11 月 · 葛佳慧的辞呈", def: "promise", opts: [
          { v: "promise", label: "承诺音乐规划", d: "开启 2018 个人专辑行动；选秀自动占位（默认）" },
          { v: "release", label: "允许支付违约金解约", d: "葛佳慧已离团；无专辑线" },
        ] },
        { key: "ajiTalk", title: "2017 年 1 月 · 阿吉的方案（卫视资源）", def: "yes", opts: [
          { v: "yes", label: "和阿吉聊到深夜", d: "结识阿吉（卫视资源图谱）；2018 年 5 月他提出辞职时留任概率 75%（默认）" },
          { v: "no", label: "今天太累了，改天再约", d: "未结识阿吉；2018 年 5 月留任概率 50%" },
        ] },
      ],
      "2027": [
        { key: "camp26Final", title: "2026 年末 · 理念阵营结算", def: "balance", opts: [
          { v: "balance", label: "平票（平衡派）", d: "王婧拍板主线一「WHN48 年内落地」（默认）" },
          { v: "wang", label: "王婧遗志派占上风", d: "主线一「WHN48 年内落地」确立" },
          { v: "tao", label: "陶莺实权派占上风", d: "武汉今年不立项（无主线一，守成路线）" },
        ] },
        { key: "cgtPath", title: "2026 年 · 成都 CGT48 的命运", def: "rebuild", opts: [
          { v: "rebuild", label: "重建成效", d: "成都剧院重启，每月继续创收（默认）" },
          { v: "dissolve", label: "解散安置", d: "前成员妥善安置；2027 叙事按「安置收尾」口径分叉" },
        ] },
        { key: "jjyEnd", title: "2026 年 6 月 · 鞠婧祎合约官司结局", def: "cinema", opts: [
          { v: "cinema", label: "重新签约·转入影视部", d: "荣誉殿堂·影视部；2027 影视部主线的谈话对象（默认）" },
          { v: "buyout", label: "违约金解约，好聚好散", d: "资金+200万；2027 影视部主线对象为孙珍妮、陆婷玉" },
          { v: "lose", label: "公司败诉，合作关系终止", d: "2027 影视部主线对象为孙珍妮、陆婷玉" },
        ] },
      ],
    };
    const groups = GROUPS[era] || [];
    const state = {};
    for (const g of groups) state[g.key] = g.def;
    const c = this.card("快速通道 · 补选关键决策（" + era + " 年开局）",
      "从中间年份开局将跳过此前年份的剧情——以下是影响 " + era + " 年剧情走向的关键决策，已按史实默认预选，可自行调整后开工。");
    const wrap = this.el("div", "");
    for (const g of groups) {
      const title = this.el("div", "ft-group-title", g.title);
      wrap.appendChild(title);
      const box = this.el("div", "modal-choices ft-group");
      for (const o of g.opts) {
        const b = this.el("button", "ft-opt" + (state[g.key] === o.v ? " on" : ""), "");
        b.innerHTML = "<b>" + o.label + "</b><span>" + o.d + "</span>";
        b.onclick = () => {
          state[g.key] = o.v;
          for (const x of box.children) x.classList.remove("on");
          b.classList.add("on");
        };
        box.appendChild(b);
      }
      wrap.appendChild(box);
    }
    c.appendChild(wrap);
    const confirm = this.el("button", "btn btn-primary modal-close", "确认补选，进入 " + era + " 序章 →");
    confirm.onclick = () => {
      this.closeModal();
      onDone(state);
    };
    c.appendChild(confirm);
    this.modal(c);
  },

  showPrologue() {
    this.showScreen("screen-vn");
    /* 按 era 取对应序章（2016 任职会议 / 2017 本部新章 / 2018 星阵重列 / 2026 临危受命 / 2027 年度决策会议） */
    const pro = Game.st.era === "2027" ? STORY.prologue27
      : Game.st.era === "2026" ? STORY.prologue26
      : Game.st.era === "2018" ? STORY.prologue18
      : Game.st.era === "2017" ? STORY.prologue17
      : STORY.prologue;
    const rawPages = typeof pro.pages === "function" ? pro.pages(Game.st) : pro.pages;   // 序章页面支持按状态定制（2017 分团线交接）
    const pages = rawPages.map(p => ({ ...p, t: Game.fmt(p.t), s: p.s ? Game.fmt(p.s) : p.s }));
    const label = this.$("vn-scene-label");
    label.textContent = pro.sceneLabel;
    const body = this.$("vn-body");
    const footer = this.$("vn-footer");
    let idx = 0;

    const renderPage = () => {
      body.innerHTML = "";
      footer.innerHTML = "";
      const p = pages[idx];
      const hint = this.el("div", "vn-hint", "点击画面继续 ▼");
      if (p.nar) {
        body.appendChild(this.el("div", "vn-text narration", p.t));
      } else {
        const wrap = this.el("div", "vn-page");
        wrap.appendChild(this.el("span", "vn-speaker " + (p.cls || ""), p.s));
        wrap.appendChild(this.el("div", "vn-text", p.t));
        body.appendChild(wrap);
      }
      footer.appendChild(hint);
    };

    const startClosing = () => {
      /* closing 支持数组或函数（2026 线按会后抉择分支） */
      const rawClosing = typeof pro.closing === "function" ? pro.closing(Game.st) : pro.closing;
      const closing = rawClosing.map(p => ({ ...p, t: Game.fmt(p.t) }));
      this.playVNFull(closing, pro.sceneLabel, () => this.enterGame(true));
    };

    /* 序章后的「路线抉择」（2026 线：解散/重建 CGT48；2027 线：年度会议发言）；2016 线无此环节 */
    const showPathChoice = () => {
      const pc = pro.pathChoice;
      if (!pc) { startClosing(); return; }
      body.onclick = null;
      footer.innerHTML = "";
      const box = this.el("div", "vn-choices");
      for (const c of pc.choices) {
        if (c.gate && !c.gate(Game.st)) continue;   // 选项可声明 gate（2027 序章按阵营出发言选项）
        const b = this.el("button", "vn-choice", c.label + "　—— " + (c.hint || ""));
        b.onclick = (e) => {
          e.stopPropagation();
          if (c.tag) Game.recordDecision(c.tag, c.value !== undefined ? c.value : c.id);
          const rt = c.apply(Game.st);
          const resultPages = [{ nar: true, t: rt }].concat((pc.after || []).map(p => ({ ...p, t: Game.fmt(p.t) })));
          this.playVNFull(resultPages, pro.sceneLabel, startClosing);
        };
        box.appendChild(b);
      }
      footer.appendChild(box);
    };

    const showStyleChoice = () => {
      footer.innerHTML = "";
      body.onclick = null;
      const box = this.el("div", "vn-choices");
      for (const s of pro.styles) {
        const b = this.el("button", "vn-choice", s.label + "　—— " + s.hint);
        b.onclick = (e) => {
          e.stopPropagation();
          Game.applyStyle(s.id);
          if (pro.pathChoice) {
            const pcfg = pro.pathChoice;
            const pcPages = (typeof pcfg.pages === "function" ? pcfg.pages(Game.st) : pcfg.pages).map(p => ({ ...p, t: Game.fmt(p.t), s: p.s ? Game.fmt(p.s) : p.s }));
            this.playVNFull(pcPages, pcfg.sceneLabel || pro.sceneLabel, showPathChoice);
          } else startClosing();
        };
        box.appendChild(b);
      }
      footer.appendChild(box);
    };

    body.onclick = () => {
      if (idx < pages.length - 1) { idx++; renderPage(); }
      else showStyleChoice();
    };
    renderPage();
  },

  /* 全屏 VN 播放器（序章后半 / 复用屏幕三） */
  playVNFull(pages, sceneLabel, onDone) {
    this.showScreen("screen-vn");
    this.$("vn-scene-label").textContent = sceneLabel || "";
    const body = this.$("vn-body");
    const footer = this.$("vn-footer");
    let idx = 0;
    const render = () => {
      body.innerHTML = ""; footer.innerHTML = "";
      const p = pages[idx];
      if (p.nar) body.appendChild(this.el("div", "vn-text narration", p.t));
      else {
        const wrap = this.el("div", "vn-page");
        wrap.appendChild(this.el("span", "vn-speaker " + (p.cls || ""), p.s));
        wrap.appendChild(this.el("div", "vn-text", p.t));
        body.appendChild(wrap);
      }
      footer.appendChild(this.el("div", "vn-hint", "点击画面继续 ▼"));
    };
    body.onclick = () => {
      if (idx < pages.length - 1) { idx++; render(); }
      else { body.onclick = null; if (onDone) onDone(); }
    };
    render();
  },

  /* 行动剧情场景播放器（分团主线各阶段、走访小剧场共用）。
     scene 结构：{ label, pages, choices?, after? }
       pages  先播放；播完若有 choices 显示选项（apply(st) 返回结算文本，
              会记入日志），结算文本作为旁白页接在 after 页之前播放。
     播放完毕自动回到经营界面再回调 onDone。 */
  playScene(scene, onDone) {
    const st = Game.st;
    /* 2027 线状态无 st.branch（分团筹备是 2016 线字段），取值兜底 */
    const fmt = t => Game.fmt(t, { city: (st.branch && st.branch.city) || "目的地" });
    const rawPages = typeof scene.pages === "function" ? scene.pages(st) : (scene.pages || []);
    const main = rawPages.map(p => ({ ...p, t: fmt(p.t), s: p.s ? fmt(p.s) : p.s }));
    const after = (scene.after || []).map(p => ({ ...p, t: fmt(p.t), s: p.s ? fmt(p.s) : p.s }));
    this.showScreen("screen-vn");
    this.$("vn-scene-label").textContent = scene.label ? fmt(scene.label) : "";
    const body = this.$("vn-body");
    const footer = this.$("vn-footer");
    let queue = main, idx = 0;

    const render = () => {
      body.innerHTML = ""; footer.innerHTML = "";
      const p = queue[idx];
      if (p.nar) body.appendChild(this.el("div", "vn-text narration", p.t));
      else {
        const wrap = this.el("div", "vn-page");
        wrap.appendChild(this.el("span", "vn-speaker " + (p.cls || ""), p.s));
        wrap.appendChild(this.el("div", "vn-text", p.t));
        body.appendChild(wrap);
      }
      footer.appendChild(this.el("div", "vn-hint", "点击画面继续 ▼"));
      body.onclick = () => {
        if (idx < queue.length - 1) { idx++; render(); return; }
        if (queue === main && scene.choices && scene.choices.length) { showChoices(); return; }
        if (queue === main && after.length) { queue = after; idx = 0; render(); return; }
        this.showScreen("screen-game");
        if (onDone) onDone();
      };
    };
    const showChoices = () => {
      body.onclick = null; footer.innerHTML = "";
      const box = this.el("div", "vn-choices");
      for (const ch of scene.choices) {
        const b = this.el("button", "vn-choice", ch.label + (ch.hint ? "　—— " + ch.hint : ""));
        b.onclick = (e) => {
          e.stopPropagation();
          if (ch.tag) Game.recordDecision(ch.tag, ch.value !== undefined ? ch.value : ch.id);   // 决策标签登记
          const rt = ch.apply(Game.st);   // 选项效果落地
          Game.logChoice(rt);             // 结算文本记入当月日志
          queue = [{ nar: true, t: rt }, ...after];
          idx = 0;
          render();
        };
        box.appendChild(b);
      }
      footer.appendChild(box);
    };
    render();
  },

  /* ---------------- 经营主界面 ---------------- */

  enterGame(isNew) {
    this.showScreen("screen-game");
    this._memberFilter = "all";
    /* monthStart 有幂等保护：新开局/推进到新月/中途读档三种进入方式都安全 */
    const steps = Game.monthStart();
    this.playSteps(steps, () => this.renderGame());
  },

  renderGame() {
    const st = Game.st;
    this.renderHUD();
    this.renderBoard();
    this.renderMembers();
    this.renderLog();
    this.switchTab("board");
  },

  renderHUD() {
    const st = Game.st;
    this.$("hud-date").textContent = Game.dateLabel();
    // 行动点
    let apHtml = "";
    for (let i = 0; i < 3; i++) apHtml += i < st.ap ? '<span class="ap-on">●</span>' : '<span class="ap-off">○</span>';
    this.$("hud-ap").innerHTML = "行动 " + apHtml;
    // 资源
    const chips = [
      { label: "资金", val: st.money + "万", cls: "v-money", warn: st.money <= 60 },
      { label: "热度", val: st.heat, cls: "v-heat", warn: false },
      { label: "士气", val: st.morale, cls: "v-morale", warn: st.morale < 40 },
      { label: "叶盛负担", val: st.burden, cls: "v-burden", warn: st.burden >= 80 },
      { label: "训练度", val: st.train, cls: "v-train", warn: false },
    ];
    if (st.era === "2017" || st.era === "2027") chips.push({ label: "平均实力", val: Game.avgPwr(st), cls: "v-train", warn: false });
    this.$("hud-res").innerHTML = chips.map(c =>
      '<div class="res-chip"><div class="res-label">' + c.label + '</div><div class="res-value ' + c.cls + (c.warn ? " warn" : "") + '">' + c.val + "</div></div>"
    ).join("");
  },

  renderBoard() {
    const st = Game.st;
    const box = this.$("quest-cards");
    box.innerHTML = "";

    /* ============ 2026 线：四条主线看板 ============ */
    if (st.era === "2026") {
      const mkCard = (name, tag, tagCls, body) => {
        const c = this.el("div", "quest-card");
        const head = this.el("div", "quest-head", this.el("span", "quest-name", name));
        head.appendChild(this.el("span", "quest-tag " + tagCls, tag));
        c.appendChild(head);
        if (body) c.appendChild(body);
        return c;
      };
      /* 主线① 年度活动（总选举 + 金曲大赏，营业不佳会取消） */
      const b1 = this.el("div", "quest-desc",
        (st.geDone ? "总选举 ✔（第一名：" + st.geResult.top1 + "）" : "总选举 7月 · 筹备度 " + st.gePlan + "/100")
        + "　|　" +
        (st.rtCancelled ? "金曲大赏 ✘ 已被陶莺取消" : st.rtDone ? "金曲大赏 ✔（" + st.rtScore + "/100）" : "金曲大赏 12月 · 筹备度 " + st.rtPlan + "/100"));
      box.appendChild(mkCard("主线① · 年度活动策划",
        st.geDone && (st.rtDone || st.rtCancelled) ? "✔ 已了结" : "进行中",
        st.geDone && (st.rtDone || st.rtCancelled) ? "q-done" : "q-open", b1));
      /* 主线② 分担叶盛 */
      const b2bar = this.el("div", "mc-bar bond"); b2bar.innerHTML = "<i style=\"width:" + (100 - st.burden) + "%\"></i>";
      const b2 = this.el("div", "");
      b2.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "叶盛的负担"), this.el("span", "", st.burden + "/100")]));
      b2.appendChild(b2bar);
      box.appendChild(mkCard("主线② · 分担叶盛",
        st.burden <= 30 ? "✔ 负担已减至低位" : st.burden >= 80 ? "⚠ 负担过重" : "进行中",
        st.burden <= 30 ? "q-done" : st.burden >= 80 ? "q-open" : "", b2));
      /* 主线③ 末位淘汰（陶莺机制） */
      const done3 = st.elim.executed + st.elim.transferred;
      const b3 = this.el("div", "quest-desc",
        "已执行 " + st.elim.executed + " 次 · 调往CGT48 " + st.elim.transferred + " 人 · 缓刑 " + st.elim.defied + " 次"
        + (st.elim.defied >= 2 ? "　⚠ 陶莺的耐心正在耗尽" : ""));
      box.appendChild(mkCard("主线③ · 执行末位淘汰",
        done3 >= 3 ? "✔ 陶总认可" : "评审 ×" + Math.max(0, 3 - done3) + " 待执行", done3 >= 3 ? "q-done" : "q-open", b3));
      /* 主线④ CGT48 重建（解散路线变更为「安置前成员」） */
      if (st.cgt.closed) {
        const n4 = st.cgt.settled || 0;
        const bar4b = this.el("div", "mc-bar bond"); bar4b.innerHTML = "<i style=\"width:" + Math.round(n4 / 3 * 100) + "%\"></i>";
        const b4b = this.el("div", "");
        b4b.appendChild(bar4b);
        b4b.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "安置进度（3批）"), this.el("span", "", n4 + "/3")]));
        b4b.appendChild(this.el("div", "quest-detail",
          st.cgt.settleDone ? "✔ 前成员已全部妥善安置" : "通过「安置CGT48前成员」行动，为前成员安排转型与本部考核"));
        box.appendChild(mkCard("主线④ · 安置CGT48前成员",
          st.cgt.settleDone ? "✔ 安置完成" : "进行中", st.cgt.settleDone ? "q-done" : "q-open", b4b));
        this.renderActions();
        return;
      }
      const dots4 = this.el("div", "quest-progress");
      for (let i = 1; i <= 4; i++) dots4.appendChild(this.el("div", "p-dot" + (st.cgt.stage >= i ? " on" : "")));
      const b4 = this.el("div", "");
      b4.appendChild(dots4);
      b4.appendChild(this.el("div", "quest-detail",
        st.cgt.open ? "✔ 重启首演已于 " + st.cgt.openMonth + " 月落幕" : st.cgt.stage >= 4 ? "重建就绪，本月末重启首演！" : "目标：年内让成都的剧场重新亮灯"));
      box.appendChild(mkCard("主线④ · CGT48 重建",
        st.cgt.open ? "✔ 已重启" : st.cgt.stage >= 4 ? "待首演" : "目标：重启首演", st.cgt.open ? "q-done" : "q-open", b4));
      this.renderActions();
      return;
    }

    /* ============ 2027 线（大河新篇）：五条主线看板 ============ */
    if (st.era === "2027") {
      const mkCard = (name, tag, tagCls, body) => {
        const c = this.el("div", "quest-card");
        const head = this.el("div", "quest-head", this.el("span", "quest-name", name));
        head.appendChild(this.el("span", "quest-tag " + tagCls, tag));
        c.appendChild(head);
        if (body) c.appendChild(body);
        return c;
      };
      /* 主线① WHN48·武汉（仅王婧派/平衡派：flags.wh27Main） */
      if (st.flags.wh27Main) {
        const dots27 = this.el("div", "quest-progress");
        for (let i = 1; i <= 3; i++) dots27.appendChild(this.el("div", "p-dot" + (st.branch27.stage >= i ? " on" : "")));
        const b1 = this.el("div", "");
        b1.appendChild(this.el("div", "quest-detail",
          st.branch27.open ? "✔ " + st.branch27.openMonth + " 月首演亮灯（每月+25万收入）" :
          st.branch27.stage === 0 ? "立项启动 → 剧场改造（需资金≥160万）→ 招募集训（需士气≥55）" :
          st.branch27.stage === 1 ? "剧场改造中（需资金≥160万，投入150万）" :
          st.branch27.stage === 2 ? "招募集训中（需士气≥55）" : "筹备就绪，本月末首演亮灯！"));
        b1.appendChild(dots27);
        box.appendChild(mkCard("主线① · WHN48 年内落地",
          st.branch27.open ? "✔ 江城的灯亮了" : st.branch27.stage >= 3 ? "待首演" : "进行中",
          st.branch27.open ? "q-done" : "q-open", b1));
      } else {
        const b0 = this.el("div", "quest-detail",
          "今年没有新团立项（陶总拍板：把已有的灯守亮）——武汉的档案袋，在王总办公室里留到了下一年");
        box.appendChild(mkCard("主线① · 年度基调 · 守成", "陶莺路线", "q-open", b0));
      }
      /* 主线② 影视部焕新 */
      const filmStageTxt = st.film.done ? "✔ 项目已播出（" + st.film.doneMonth + " 月开播）"
        : st.film.stage === 3 ? "已杀青，本月末开播！" :
        st.film.stage === 2 ? "开机拍摄中（需资金≥120万，投入100万）" :
        st.film.stage === 1 ? "项目遴选（冲奖大制作 60万 / 网剧快跑 30万）" : "立项会谈（谈话对象：" + Game.filmLeadName(st) + "）";
      const b2 = this.el("div", "quest-detail", filmStageTxt);
      box.appendChild(mkCard("主线② · 影视部焕新",
        st.film.done ? "✔ 重新点亮" : st.film.stage >= 3 ? "待开播" : "进行中",
        st.film.done ? "q-done" : "q-open", b2));
      /* 主线③ 提升团队实力 */
      const growth27 = Game.avgPwr(st) - (st.pwrBase || 0);
      const bar3b = this.el("div", "mc-bar pop"); bar3b.innerHTML = "<i style=\"width:" + Game.avgPwr(st) + "%\"></i>";
      const b3 = this.el("div", "");
      b3.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "全团平均实力"), this.el("span", "", Game.avgPwr(st) + "（较年初 " + (growth27 >= 0 ? "+" : "") + growth27 + "）")]));
      b3.appendChild(bar3b);
      box.appendChild(mkCard("主线③ · 提升团队实力",
        growth27 >= 5 ? "✔ 淬炼有成" : "进行中", growth27 >= 5 ? "q-done" : "q-open", b3));
      /* 主线④ 分担叶盛 */
      const bar4b = this.el("div", "mc-bar bond"); bar4b.innerHTML = "<i style=\"width:" + (100 - st.burden) + "%\"></i>";
      const b4 = this.el("div", "");
      b4.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "叶盛的负担"), this.el("span", "", st.burden + "/100")]));
      b4.appendChild(bar4b);
      box.appendChild(mkCard("主线④ · 分担叶盛",
        st.burden <= 30 ? "✔ 负担已减至低位" : st.burden >= 80 ? "⚠ 负担过重" : "进行中",
        st.burden <= 30 ? "q-done" : "q-open", b4));
      /* 主线⑤ 年度活动 */
      const b5 = this.el("div", "quest-desc",
        (st.geDone ? "总决选 ✔（第一名：" + st.geResult.top1 + "）" : "总决选 7月 · 筹备度 " + st.gePlan + "/100")
        + "　|　" +
        (st.rtCancelled ? "金曲大赏 ✘ 已被取消" : st.rtDone ? "金曲大赏 ✔（" + st.rtScore + "/100）" : "金曲大赏 12月 · 筹备度 " + st.rtPlan + "/100"));
      box.appendChild(mkCard("主线⑤ · 年度活动筹备",
        st.geDone && (st.rtDone || st.rtCancelled) ? "✔ 已了结" : "进行中",
        st.geDone && (st.rtDone || st.rtCancelled) ? "q-done" : "q-open", b5));
      this.renderActions();
      return;
    }

    /* ============ 2017 线（本部新章）：六条主线看板 ============ */
    if (st.era === "2017") {
      const mkCard = (name, tag, tagCls, body) => {
        const c = this.el("div", "quest-card");
        const head = this.el("div", "quest-head", this.el("span", "quest-name", name));
        head.appendChild(this.el("span", "quest-tag " + tagCls, tag));
        c.appendChild(head);
        if (body) c.appendChild(body);
        return c;
      };
      /* 主线① 双团开设 */
      const b17 = st.branch17;
      const dots17 = this.el("div", "quest-progress");
      for (let i = 1; i <= 4; i++) dots17.appendChild(this.el("div", "p-dot" + (b17.ckg >= i ? " on" : "")));
      const b1 = this.el("div", "");
      b1.appendChild(this.el("div", "quest-detail",
        "SHY48（沈阳）：" + (b17.shyOpen ? "✔ " + b17.shyOpenMonth + " 月开业首演" : b17.shy >= 1 ? "筹备就绪，月末开业" : "剧场筹备中（目标：1月首演）")));
      b1.appendChild(dots17);
      b1.appendChild(this.el("div", "quest-detail",
        "CKG48（重庆）：" + (b17.ckgOpen ? "✔ " + b17.ckgOpenMonth + " 月开业首演" : "筹备阶段 " + b17.ckg + "/3（目标：10月末首演）")));
      box.appendChild(mkCard("主线① · 双团开设",
        b17.shyOpen && b17.ckgOpen ? "✔ 四城灯已亮" : "进行中", b17.shyOpen && b17.ckgOpen ? "q-done" : "q-open", b1));
      /* 主线② 年度活动 */
      const b2 = this.el("div", "quest-desc",
        (st.geDone ? "总决选 ✔（第一名：" + st.geResult.top1 + "）" : "总决选 7月 · 筹备度 " + st.gePlan + "/100")
        + "　|　" +
        (st.rtDone ? "金曲大赏 ✔（" + st.rtScore + "/100）" : "金曲大赏 12月 · 筹备度 " + st.rtPlan + "/100"));
      box.appendChild(mkCard("主线② · 年度大活动",
        st.geDone && st.rtDone ? "✔ 已了结" : "进行中", st.geDone && st.rtDone ? "q-done" : "q-open", b2));
      /* 主线③ 成员实力 */
      const growth = Game.avgPwr(st) - (st.pwrBase || 0);
      const bar3 = this.el("div", "mc-bar pop"); bar3.innerHTML = "<i style=\"width:" + Game.avgPwr(st) + "%\"></i>";
      const b3 = this.el("div", "");
      b3.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "全团平均实力"), this.el("span", "", Game.avgPwr(st) + "（较年初 " + (growth >= 0 ? "+" : "") + growth + "）")]));
      b3.appendChild(bar3);
      box.appendChild(mkCard("主线③ · 提升成员实力",
        growth >= 5 ? "✔ 淬炼有成" : "进行中", growth >= 5 ? "q-done" : "q-open", b3));
      /* 主线④ 分担叶盛（分团线：专注对应分团事务） */
      const dutyPost = Game.branchDutyPost(st);
      const bar4 = this.el("div", "mc-bar bond"); bar4.innerHTML = "<i style=\"width:" + (100 - st.burden) + "%\"></i>";
      const b4 = this.el("div", "");
      b4.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", dutyPost ? dutyPost + "的事务压力" : "叶盛的负担"), this.el("span", "", st.burden + "/100")]));
      b4.appendChild(bar4);
      box.appendChild(mkCard(dutyPost ? "主线④ · 专注" + dutyPost + "事务" : "主线④ · 分担叶盛",
        st.burden <= 30 ? "✔ 负担已减至低位" : st.burden >= 80 ? "⚠ 负担过重" : "进行中",
        st.burden <= 30 ? "q-done" : "", b4));
      /* 主线⑤ 团体影响力 */
      const marks = [
        st.flags.tvCny ? "卫视春晚×" + st.flags.tvCny : null,
        st.flags.s7 ? "7SENSES" : null,
        st.flags.aji ? "阿吉资源线" : null,
        st.heat >= 80 ? "热度长红" : null,
      ].filter(Boolean);
      const b5 = this.el("div", "quest-detail", "当前热度 " + st.heat + " / 100" + (marks.length ? "　|　里程碑：" + marks.join(" · ") : "　|　提示：会后找工作人员阿吉谈谈"));
      box.appendChild(mkCard("主线⑤ · 提高团体影响力",
        st.heat >= 80 ? "✔ 影响力出圈" : "进行中", st.heat >= 80 ? "q-done" : "q-open", b5));
      /* 主线⑥ 原创公演（复刻模式：四套新复刻公演） */
      const rep17 = Game.isReplicate(st);
      const b6 = this.el("div", "quest-detail",
        ["SII", "NII", "HII", "X"].map(t => (st.orig[t] ? "✔ " : "○ ") + t).join("　")
        + "　|　已完成 " + Game.origCount(st) + "/4 套（" + (rep17 ? "山本学：让它们像自己的舞台一样立起来" : "王子杰：自己的歌，才是根") + "）");
      box.appendChild(mkCard(rep17 ? "主线⑥ · 四套新复刻公演" : "主线⑥ · 四队原创公演",
        Game.origCount(st) >= 4 ? "✔ 全部首演" : "进行中", Game.origCount(st) >= 4 ? "q-done" : "q-open", b6));
      this.renderActions();
      return;
    }

    /* ============ 2018 线（星阵重列）：六条主线看板 ============ */
    if (st.era === "2018") {
      const mkCard = (name, tag, tagCls, body) => {
        const c = this.el("div", "quest-card");
        const head = this.el("div", "quest-head", this.el("span", "quest-name", name));
        head.appendChild(this.el("span", "quest-tag " + tagCls, tag));
        c.appendChild(head);
        if (body) c.appendChild(body);
        return c;
      };
      const r18 = st.reorg18;
      const kept18 = !!st.flags.xiiKept18;
      /* 主线① 全团大重组（保留XII为四步，取消为三步） */
      const steps18 = kept18 ? 4 : 3;
      const dots18 = this.el("div", "quest-progress");
      for (let i = 1; i <= steps18; i++) dots18.appendChild(this.el("div", "p-dot" + (r18.stage >= i ? " on" : "")));
      const b1 = this.el("div", "");
      b1.appendChild(this.el("div", "quest-detail", r18.done
        ? "✔ 新编制名单已公布——" + (kept18 ? "Team XII 保留" : "Team XII 完成历史使命") + " · Team FT 成立，星阵重列"
        : r18.stage >= 2
        ? "编制会待开：逐人定队（每队13~20人）+ 队长队副任命，确认后公布名单"
        : (kept18 ? "编制对象：SII / NII / HII / X / XII / FT / 预备生（含 XII 编制确认）" : "编制对象：SII / NII / HII / X / FT / 预备生")));
      b1.appendChild(dots18);
      box.appendChild(mkCard("主线① · 全团大重组", r18.done ? "✔ 组阁落地" : kept18 ? "保留XII" : "XII谢幕", r18.done ? "q-done" : "q-open", b1));
      /* 主线② 预备生汇报公演 */
      const p18 = st.prep18;
      box.appendChild(mkCard("主线② · 预备生汇报公演",
        p18.promoted >= 6 ? "✔ 新星升格" : p18.sys ? "制度运行中" : "待推行",
        p18.promoted >= 6 ? "q-done" : "q-open",
        this.el("div", "quest-detail", "舞台总监马跃每月汇报公演情况：表现优异的预备生由总监定队升格（含分团上调）——年内升格 " + p18.promoted + " / 6 人")));
      /* 主线③ 年度活动筹备 */
      const geTip = st.history.ge2017Top1 ? "（若 " + st.history.ge2017Top1 + " 连霸，将触发升堂事件）" : "";
      box.appendChild(mkCard("主线③ · 年度活动筹备",
        st.geDone && st.rtDone ? "✔ 双活动收官" : st.geDone ? "总选已落幕" : "进行中", st.geDone && st.rtDone ? "q-done" : "q-open",
        this.el("div", "quest-detail", "总选举（7月「砥砺前行」）+ 金曲大赏（12月）" + geTip)));
      /* 主线④ 复刻双面偶像（仅 shuangmian17=plan） */
      if (st.decisions.shuangmian17 === "plan") {
        const sm = st.sm18;
        box.appendChild(mkCard("主线④ · 复刻《双面偶像》", sm.done ? "✔ 首演落幕" : sm.team ? "承办：" + sm.team : "待立项", sm.done ? "q-done" : "q-open",
          this.el("div", "quest-detail", sm.done ? "✔ " + sm.team + " 承办复刻成功——广州的舞台在上海重生" : sm.team ? "排练推进中（队伍平均实力 " + Game.avgTeamPwr(st, sm.team) + " 影响效果）" : "选定承办队伍后立项（队伍平均实力影响复刻效果）")));
      }
      /* 主线⑤ 备战鹅厂选秀 */
      const s18 = st.show18;
      box.appendChild(mkCard("主线⑤ · 备战鹅厂选秀",
        s18.done && (!st.decisions.gejiahui17 || st.decisions.gejiahui17 !== "promise" || s18.album) ? (st.decisions.gejiahui17 === "promise" ? "✔ 出征+专辑" : "✔ 首轮录制") : s18.done ? "录制完成" : s18.squad ? "集训中" : "待点将",
        s18.done && (st.decisions.gejiahui17 !== "promise" || s18.album) ? "q-done" : "q-open",
        this.el("div", "quest-detail", s18.done
          ? "✔ 派遣 " + (s18.squad ? s18.squad.length : 0) + " 人完成首轮录制" + (st.decisions.gejiahui17 === "promise" && !s18.album ? "——别忘了个人的约定：为葛佳慧发行专辑" : "")
          : s18.squad ? "封闭集训推进中" : "派遣至少 11 人出征" + (st.decisions.gejiahui17 === "promise" ? "（葛佳慧自动占一席）" : ""))));
      /* 主线⑥ 分担叶盛/分担分团 */
      const dutyPost18 = Game.branchDutyPost(st);
      box.appendChild(mkCard(dutyPost18 ? "主线⑥ · 分担分团（" + dutyPost18 + "）" : "主线⑥ · 分担叶盛",
        "常设", "q-open", this.el("div", "quest-detail", dutyPost18 ? "分团巡访与事务值班：兼顾" + dutyPost18 + "的日常" : "走访成员与替叶盛值班，给大管家松绑")));
      this.renderActions();
      return;
    }

    /* ============ 2016 线（原版看板） ============ */

    /* 主线① 分团 */
    const q1 = this.el("div", "quest-card");
    q1.appendChild(this.el("div", "quest-head",
      this.el("span", "quest-name", "主线① · 分团筹备")));
    q1.querySelector(".quest-head").appendChild(this.el("span", "quest-tag" + (st.branch.announce ? " q-done" : " q-open"),
      st.branch.announce ? "✔ 已官宣成立（" + st.branch.announceMonth + "月）" : "目标：4月20日官宣"));
    const dots = this.el("div", "quest-progress");
    for (let i = 1; i <= 5; i++) dots.appendChild(this.el("div", "p-dot" + (st.branch.stage >= i ? " on" : "")));
    q1.appendChild(dots);
    const stage = st.branch.stage === 0 ? "尚未启动" : (STORY.branchStages[st.branch.stage - 1].stage <= st.branch.stage ? (st.branch.stage >= 5 ? "筹备完成，静待官宣" : "已完成：" + STORY.branchStages[st.branch.stage - 1].title) : "");
    q1.appendChild(this.el("div", "quest-desc",
      (st.branch.city ? "选址：" + st.branch.city + " · " : "") + stage));
    box.appendChild(q1);

    /* 主线② 总选举 */
    const q2 = this.el("div", "quest-card");
    q2.appendChild(this.el("div", "quest-head",
      this.el("span", "quest-name", "主线② · 总选举")));
    q2.querySelector(".quest-head").appendChild(this.el("span", "quest-tag" + (st.geDone ? " q-done" : " q-open"),
      st.geDone ? "✔ 第一名：" + st.geResult.top1 : "7月30日 · 比翼齐飞"));
    if (!st.geDone) {
      const bar = this.el("div", "mc-bar pop"); bar.innerHTML = "<i style=\"width:" + st.gePlan + "%\"></i>";
      q2.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "筹备度"), this.el("span", "", st.gePlan + "/100")]));
      q2.appendChild(bar);
    }
    box.appendChild(q2);

    /* 主线③ 金曲大赏 */
    const q3 = this.el("div", "quest-card");
    q3.appendChild(this.el("div", "quest-head",
      this.el("span", "quest-name", "主线③ · 金曲大赏")));
    q3.querySelector(".quest-head").appendChild(this.el("span", "quest-tag" + (st.rtDone ? " q-done" : " q-open"),
      st.rtDone ? "✔ 质量评价 " + st.rtScore : "12月30日 · BEST 50"));
    if (!st.rtDone && st.month >= 10) {
      const bar = this.el("div", "mc-bar pop"); bar.innerHTML = "<i style=\"width:" + st.rtPlan + "%\"></i>";
      q3.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "筹备度"), this.el("span", "", st.rtPlan + "/100")]));
      q3.appendChild(bar);
    }
    box.appendChild(q3);

    /* 主线④ 叶盛 */
    const q4 = this.el("div", "quest-card");
    q4.appendChild(this.el("div", "quest-head",
      this.el("span", "quest-name", "主线④ · 分担叶盛")));
    q4.querySelector(".quest-head").appendChild(this.el("span", "quest-tag",
      st.burden >= 80 ? "⚠ 事务积压" : st.burden <= 25 ? "运转顺畅" : "正常运转"));
    const bar4 = this.el("div", "mc-bar bond"); bar4.innerHTML = "<i style=\"width:" + st.burden + "%;background:var(--gold)\"></i>";
    q4.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "叶盛的负担"), this.el("span", "", st.burden + "/100")]));
    q4.appendChild(bar4);
    box.appendChild(q4);
    this.renderActions();
  },

  /* 行动区（两条线共用）：本月行动按钮 + 月末按钮 */
  renderActions() {
    const st = Game.st;
    const grid = this.$("action-grid");
    grid.innerHTML = "";
    for (const a of Game.listActions()) {
      const b = this.el("button", "action-btn" + (a.main ? " q-main" : "") + (st.ap <= 0 ? " ap-zero" : ""));
      b.appendChild(this.el("div", "action-name", a.name));
      b.appendChild(this.el("div", "action-desc", a.disabled && a.disabledTip ? "🔒 " + a.disabledTip : a.desc));
      b.disabled = a.disabled || st.ap <= 0;
      b.onclick = () => this.onAction(a.id);
      grid.appendChild(b);
    }
    this.$("ap-note").textContent = st.ap > 0 ? "（剩余 " + st.ap + " 点）" : "（本日工作已排满）";

    /* 月末按钮（每次重渲染时替换，避免重复追加） */
    const oldEnd = this.$("btn-month-end");
    if (oldEnd) oldEnd.remove();
    const endBtn = this.el("button", "btn " + (st.ap <= 0 ? "btn-primary" : "btn-ghost") + " btn-big");
    endBtn.id = "btn-month-end";
    endBtn.style.marginTop = "14px";
    endBtn.textContent = st.ap <= 0 ? "进入月末结算 →" : "提前进入月末（还有 " + st.ap + " 点行动力）";
    endBtn.onclick = () => this.onMonthEnd();
    grid.parentElement.appendChild(endBtn);
  },

  onAction(id) {
    if (id === "visit") { this.showMemberPicker(); return; }
    if (id === "coach") { this.showCoachPicker(); return; }   // 2017：先选特训对象
    const res = Game.doAction(id);
    if (!res) return;
    this.renderGame();
    /* 安置点将（解散路线）：先播剧情（首批），再弹分批点将窗 */
    if (res.tone === "settlePick") {
      const ids = res.batchList;
      const openPicker = () => this.showSettleBatchPicker(ids);
      if (res.vn) this.playScene(res.vn, openPicker); else openPicker();
      return;
    }
    /* 原创公演（2017）：先弹队伍选择窗，选队后播放制作场景 */
    if (res.tone === "origPick") { this.showOrigPicker(); return; }
    /* 复刻《双面偶像》（2018）：先弹承办队伍选择窗 */
    if (res.tone === "pickTeam18") { this.showSm18TeamPicker(); return; }
    /* 组阁编制会（2018）：逐人定队 + 队长队副任命，落地在 Game.applyReorg18 */
    if (res.tone === "pickReorg18") { this.showReorg18Picker(); return; }
    /* 选秀派遣点将（2018）：弹十一人点将窗（葛佳慧承诺自动占位） */
    if (res.tone === "pickSquad18") { this.showShow18Picker(); return; }
    /* 行动附带剧情场景：先播放场景，结束后再弹结算/选址 */
    if (res.vn) {
      this.playScene(res.vn, () => {
        this.renderGame();
        if (res.tone === "pickCity") this.showCityPicker();
        else if (res.text) this.toast(res.text);
      });
      return;
    }
    if (res.tone === "pickCity") { this.showCityPicker(); return; }
    this.toast(res.text);
  },

  showCityPicker() {
    const c = this.card("分团选址", "考察组列出了四座候选城市——这一笔，决定分团未来十年");
    const grid = this.el("div", "modal-choices");
    for (const city of STORY.branchCities) {
      const b = this.el("button", "vn-choice", "");
      b.innerHTML = "<b>" + city.name + "</b>　<span style=\"font-size:12px;color:var(--text-dim)\">" + city.desc + "</span><br><span style=\"font-size:11px;color:var(--gold)\">一次性：资金" + (city.cost + city.moneyBonus >= 0 ? "+" : "") + (city.cost + city.moneyBonus) + "万 · 热度" + (city.heatBonus >= 0 ? "+" : "") + city.heatBonus + "</span>";
      b.onclick = () => {
        const res = Game.pickCity(city.id);
        this.closeModal();
        if (res) { this.toast(res.text); this.renderGame(); }
      };
      grid.appendChild(b);
    }
    c.appendChild(grid);
    this.modal(c);   // 不给关闭按钮——选址必须拍板
  },

  /* Team SII 五人选将窗（复刻路线：宫泽佐江毕业公演赴日名单）。
     多选模式：点选/取消，选满 5 人方可确认；生效逻辑在 engine.miyazawaInvite。 */
  /* 通用多选点将窗：cfg = { title, sub, pool, count, confirmLabel, cardInfo(m), onConfirm(ids) }
     （赴日五人 / 开拓者六人等「选 N 人」交互共用） */
  showMultiPick(cfg) {
    const picked = new Set();
    const c = this.card(cfg.title, cfg.sub);
    const counter = this.el("p", "modal-text", "已选 0 / " + cfg.count);
    const grid = this.el("div", "pick-grid");
    const confirmBtn = this.el("button", "btn btn-primary modal-close", cfg.confirmLabel);
    confirmBtn.disabled = true;
    const refresh = () => {
      counter.textContent = "已选 " + picked.size + " / " + cfg.count + (picked.size === cfg.count ? "　✔ 可以确认" : "　（点击卡片选择 / 取消）");
      confirmBtn.disabled = picked.size !== cfg.count;
    };
    for (const m of cfg.pool) {
      const b = this.el("button", "pick-btn", "");
      b.innerHTML = m.name + '<span class="pb-team">' + cfg.cardInfo(m) + "</span>";
      b.onclick = () => {
        if (picked.has(m.id)) { picked.delete(m.id); b.classList.remove("on"); }
        else if (picked.size < cfg.count) { picked.add(m.id); b.classList.add("on"); }
        else { this.toast("最多" + cfg.count + "个人——先取消一位再选"); return; }
        refresh();
      };
      grid.appendChild(b);
    }
    confirmBtn.onclick = () => {
      this.closeModal();
      cfg.onConfirm([...picked]);
    };
    c.appendChild(counter);
    c.appendChild(grid);
    c.appendChild(confirmBtn);
    this.modal(c);   // 不给关闭按钮——必须点将才能继续
  },

  /* Team SII 五人选将窗（复刻路线：宫泽佐江毕业公演赴日名单） */
  showSIIInvitePicker(onDone) {
    this.showMultiPick({
      title: "赴日名单 · 点将五人",
      sub: "宫泽佐江的毕业公演——仅限 Team SII 在籍成员，被选中者羁绊+10 人气+3",
      pool: Game.st.members.filter(m => m.status === "active" && m.team === "SII"),
      count: 5,
      confirmLabel: "名单敲定，出发东京 →",
      cardInfo: m => m.team + " · 羁绊" + m.bond + " 人气" + m.pop,
      onConfirm: ids => {
        const res = Game.miyazawaInvite(ids);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* Team SII 五人选将窗（复刻模式：铃木玛莉亚东京毕业公演赴日名单）。
     生效逻辑在 engine.mariaInvite。 */
  showMariaInvitePicker(onDone) {
    this.showMultiPick({
      title: "铃木玛莉亚毕业公演 · 赴日名单",
      sub: "东京的毕业公演——仅限 Team SII 在籍成员，被选中者羄绊+10 人气+3",
      pool: Game.st.members.filter(m => m.status === "active" && m.team === "SII"),
      count: 5,
      confirmLabel: "名单敲定，出发东京 →",
      cardInfo: m => m.team + " · 羄绊" + m.bond + " 人气" + m.pop,
      onConfirm: ids => {
        const res = Game.mariaInvite(ids);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 开拓者六人点将窗（2017 分团线伏笔：六人随总监移籍 SHY48/CKG48） */
  /* 小分队成军点将窗（2018 通用·公司选取）：HO2 双人 / BlueV 五人，全团非殿堂成员皆可选；
     生效逻辑在 engine.setUnit18。 */
  showUnit18Picker(unit, onDone) {
    const st = Game.st;
    const count = unit === "HO2" ? 2 : 5;
    this.showMultiPick({
      title: "小分队 " + unit + " · 点将" + count + "人",
      sub: "7SENSES 模式延续——" + unit + "（" + count + " 人）名单由公司（你）指定，全团在册成员皆可入选（非荣誉殿堂/影视部）",
      pool: st.members.filter(m => m.status === "active" && !m.hall && m.team !== "HALL" && m.pop != null),
      count: count,
      confirmLabel: unit + " 名单敲定 →",
      cardInfo: m => m.team + " · 人气" + m.pop,
      onConfirm: ids => {
        const res = Game.setUnit18(unit, ids);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 红白歌会·中国预赛出征名单窗（2018 复刻路线专属）：全团（本部+分团在册、非殿堂）
     点将五人；生效逻辑在 engine.setKohakuSquad。 */
  showKohakuPicker(onDone) {
    const st = Game.st;
    this.showMultiPick({
      title: "红白歌会 · 中国预赛 出征名单",
      sub: "全团在册成员皆可点将（本部 + 分团，非殿堂）——预赛表现优异者将获邀赴日参加年末红白决赛（复刻路线专属）",
      pool: st.members.filter(m => (m.status === "active" || m.status === "branch") && !m.hall && m.team !== "HALL" && m.pop != null && m.pop > 0),
      count: 5,
      confirmLabel: "名单敲定，上报东京 →",
      cardInfo: m => (m.status === "branch" ? m.branchTeam : m.team) + " · 人气" + m.pop + (m.status === "branch" ? " · 分团" : ""),
      onConfirm: ids => {
        const res = Game.setKohakuSquad(ids);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 北原里英东京毕业公演 · 赴日名单窗（2018 复刻路线专属）：其效力队伍点将五人；
     生效逻辑在 engine.kitaharaSend（五人羁绊+10 人气+3，公演落幕北原里英退团）。 */
  showKitaharaPicker(onDone) {
    const st = Game.st;
    const kh = st.members.find(m => m.name === "北原里英" && m.status === "active");
    const team = kh ? kh.team : "SII";
    this.showMultiPick({
      title: "北原里英毕业公演 · 赴日名单",
      sub: "北原里英效力 Team " + team + "——从该队点将五人，赴东京送她最后一程（复刻路线专属）",
      pool: st.members.filter(m => m.status === "active" && m.team === team && m.pop != null && !m.hall),
      count: 5,
      confirmLabel: "名单敲定，随她赴东京 →",
      cardInfo: m => "Team " + m.team + " · 人气" + m.pop,
      onConfirm: ids => {
        const res = Game.kitaharaSend(ids);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 安置分批点将窗（2026 解散路线）：每批名额 上海3 / 广州2 / 重庆2。
     点击卡片循环分配：未定 → 上海 → 广州 → 重庆 → 未定；名额满后不可再选。
     确认时未分配者协商解约离团（备注「解散安置」）。落地逻辑在 engine.settleBatch。 */
  showSettleBatchPicker(batchIds) {
    const st = Game.st;
    const QUOTA = { sh: 3, gz: 2, cq: 2 };
    const DST = [
      { key: "sh", label: "调往上海 · 预备生", cls: "on-sh" },
      { key: "gz", label: "调往广州 GNZ48 · 预备生", cls: "on-gz" },
      { key: "cq", label: "调往重庆 CKG48 · 预备生", cls: "on-cq" },
    ];
    const dst = {};   // id → "sh"|"gz"|"cq"
    const count = key => Object.values(dst).filter(v => v === key).length;
    const cur0 = id => dst[id];
    const c = this.card("安置名单 · 第" + (st.cgt.settled + 1) + "批",
      "点击卡片循环分配去处：上海 3 人 / 广州 2 人 / 重庆 2 人。未分配者将协商解约离团（解散安置）");
    const counter = this.el("p", "modal-text", "");
    const grid = this.el("div", "pick-grid");
    const confirmBtn = this.el("button", "btn btn-primary modal-close", "本批名单敲定 →");
    confirmBtn.disabled = true;
    const refresh = () => {
      counter.textContent = "上海 " + count("sh") + "/" + QUOTA.sh + " · 广州 " + count("gz") + "/" + QUOTA.gz + " · 重庆 " + count("cq") + "/" + QUOTA.cq;
      confirmBtn.disabled = !(count("sh") === QUOTA.sh && count("gz") === QUOTA.gz && count("cq") === QUOTA.cq);
    };
    for (const id of batchIds) {
      const m = st.members.find(x => x.id === id);
      if (!m) continue;
      const b = this.el("button", "pick-btn", "");
      const paint = () => {
        const cur = dst[id];
        DST.forEach(d => b.classList.remove(d.cls));
        let label;
        if (!cur) { label = "点击分配去处"; }
        else {
          const d = DST.find(x => x.key === cur);
          b.classList.add(d.cls);
          label = d.label;
        }
        b.innerHTML = m.name + '<span class="pb-team">' + label + "</span>";
      };
      b.onclick = () => {
        let nextIdx = cur0(id) ? DST.findIndex(x => x.key === cur0(id)) + 1 : 0;
        /* 从下一档开始找有空位的档位；全满则重置为未分配 */
        for (; nextIdx < DST.length; nextIdx++) {
          const k = DST[nextIdx].key;
          if (count(k) < QUOTA[k]) { dst[id] = k; paint(); refresh(); return; }
        }
        delete dst[id]; paint(); refresh();
      };
      paint();
      grid.appendChild(b);
    }
    confirmBtn.onclick = () => {
      const dest = { sh: [], gz: [], cq: [] };
      for (const id in dst) dest[dst[id]].push(id);
      const res = Game.settleBatch(dest);
      this.closeModal();
      this.renderGame();
      this.toast(res.text);
    };
    c.appendChild(counter);
    c.appendChild(grid);
    c.appendChild(confirmBtn);
    this.modal(c);   // 不给关闭按钮——本批名单必须敲定
  },

  /* 四队循环分配窗核心（SII→NII→HII→X 点击循环，无名额限制；全员分配后可确认）
     cfg = { title, sub, pool, confirmLabel, onConfirm(dst) } */
  showTeamAssignPicker(cfg) {
    const TEAMS = [
      { key: "SII", label: "升入 Team SII", cls: "on-sii" },
      { key: "NII", label: "升入 Team NII", cls: "on-nii" },
      { key: "HII", label: "升入 Team HII", cls: "on-hii" },
      { key: "X",   label: "升入 Team X",   cls: "on-x" },
    ];
    const targets = cfg.pool;
    const dst = {};   // id → "SII"|"NII"|"HII"|"X"
    const count = key => Object.values(dst).filter(v => v === key).length;
    const c = this.card(cfg.title, cfg.sub);
    const counter = this.el("p", "modal-text", "");
    const grid = this.el("div", "pick-grid");
    const confirmBtn = this.el("button", "btn btn-primary modal-close", cfg.confirmLabel);
    confirmBtn.disabled = true;
    const refresh = () => {
      counter.textContent = "SII " + count("SII") + " · NII " + count("NII") + " · HII " + count("HII") + " · X " + count("X") +
        "（共 " + targets.length + " 人）";
      confirmBtn.disabled = Object.keys(dst).length !== targets.length;
    };
    for (const m of targets) {
      const b = this.el("button", "pick-btn", "");
      const paint = () => {
        TEAMS.forEach(t => b.classList.remove(t.cls));
        const cur = dst[m.id];
        let label;
        if (!cur) label = "点击选择队伍";
        else {
          const t = TEAMS.find(x => x.key === cur);
          b.classList.add(t.cls);
          label = t.label;
        }
        b.innerHTML = m.name + '<span class="pb-team">' + label + "</span>";
      };
      b.onclick = () => {
        const nextIdx = dst[m.id] ? TEAMS.findIndex(x => x.key === dst[m.id]) + 1 : 0;
        if (nextIdx >= TEAMS.length) delete dst[m.id];
        else dst[m.id] = TEAMS[nextIdx].key;
        paint(); refresh();
      };
      paint();
      grid.appendChild(b);
    }
    confirmBtn.onclick = () => {
      this.closeModal();
      cfg.onConfirm(dst);
    };
    c.appendChild(counter);
    c.appendChild(grid);
    c.appendChild(confirmBtn);
    this.modal(c);   // 不给关闭按钮——必须完成分配
  },

  /* CGT48 移籍预备生升格窗（2026 解散路线）：落地逻辑在 engine.promoteCgt */
  showCgtPromotePicker(onDone) {
    const st = Game.st;
    const targets = st.members.filter(m => m.gen === "CGT48移籍" && m.team === "PREP" && m.status === "active");
    this.showTeamAssignPicker({
      title: "升格名单 · 选择队伍",
      sub: "为每位 CGT48 移籍预备生选择归队（点击卡片循环切换队伍）；全员分配后可确认",
      pool: targets,
      confirmLabel: "升格名单敲定 →",
      onConfirm: dst => {
        const res = Game.promoteCgt(dst);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 二十三期预备生升格窗（2026 年 2 月，含 22 期应籽言一并转正）；落地在 engine.promoteTeams23。
     注意排除 CGT48 移籍预备生——她们的升格走 5 月联动事件（flags.cgtPromoted 线） */
  showP23PromotePicker(onDone) {
    const st = Game.st;
    const targets = st.members.filter(m => m.team === "PREP" && m.status === "active" && m.gen !== "CGT48移籍");
    this.showTeamAssignPicker({
      title: "二十三期升格名单 · 选择队伍",
      sub: "为二十三期预备生选择归队（22 期应籽言一并转正）；点击卡片循环切换队伍",
      pool: targets,
      confirmLabel: "升格名单敲定 →",
      onConfirm: dst => {
        const res = Game.promoteTeams23(dst);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 开拓者六人点将窗（2017 分团线伏笔：六人随总监移籍 SHY48/CKG48） */
  showPioneerPicker(onDone) {
    const st = Game.st;
    const target = st.decisions.branchPost;
    const city = target === "SHY48" ? "沈阳" : "重庆";
    this.showMultiPick({
      title: "开拓者名单 · 点将六人",
      sub: "明年一月随你移籍" + city + "（" + target + "）。BEJ48/GNZ48 成员无影响；SNH48 高人气成员（⚠）可能不满，有概率提出离团",
      pool: st.members.filter(m => m.status === "active" || m.status === "branch"),
      count: 6,
      confirmLabel: "名单敲定，共赴新河 →",
      cardInfo: m => m.status === "branch"
        ? m.branchTeam + " " + (m.branchLabel || "")
        : m.team + " · 人气" + m.pop + (m.pop >= 60 ? " ⚠高人气" : ""),
      onConfirm: ids => {
        const res = Game.pioneerPick(ids);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 2017 线：安排成员特训的成员选择窗（按实力升序：优先补短板，也可反着点） */
  showCoachPicker() {
    const c = this.card("安排成员特训", "选择一名成员进行一对一特训（实力+6 羁绊+4 资金-20万）");
    const grid = this.el("div", "pick-grid");
    for (const m of Game.activeMembers(Game.st).slice().sort((a, b) => (a.pwr || 0) - (b.pwr || 0))) {
      const b = this.el("button", "pick-btn", "");
      b.innerHTML = m.name + '<span class="pb-team">' + m.team + " · 实力" + (m.pwr || 0) + " · 羁绊" + m.bond + "</span>";
      b.onclick = () => {
        this.closeModal();
        const res = Game.doAction("coach", { memberId: m.id });
        if (!res) return;
        this.renderGame();
        this.toast(res.text);
      };
      grid.appendChild(b);
    }
    c.appendChild(grid);
    const cancel = this.el("button", "btn btn-ghost modal-close", "先不练了（不消耗行动）");
    cancel.onclick = () => this.closeModal();
    c.appendChild(cancel);
    this.modal(c);
  },

  /* 2017 线：公演制作的队伍选择窗（选队后播放制作/排练场景，选项内落地数值）；复刻模式文案随 jpMode 切换 */
  showOrigPicker() {
    const st = Game.st;
    const rep = Game.isReplicate(st);
    const TEAMS = ["SII", "NII", "HII", "X"].filter(t => !st.orig[t]);
    const c = this.card(rep ? "复刻公演排练 · 选择队伍" : "原创公演制作 · 选择队伍", rep
      ? "排练日方授权的四套新复刻公演（主线⑥）；每套排练成本 40万"
      : "为本部四队各制作一套原创公演（主线⑥）；每套耗资 "
        + (st.decisions.akbSplit === "original" || st.flags.originalSongsStarted ? "60万（源头计划曲库支援）" : "80万"));
    const grid = this.el("div", "pick-grid");
    for (const t of TEAMS) {
      const members = st.members.filter(m => m.status === "active" && m.team === t && m.pwr != null);
      const avg = members.length ? Math.round(members.reduce((s, m) => s + m.pwr, 0) / members.length) : 0;
      const b = this.el("button", "pick-btn", "");
      b.innerHTML = "Team " + t + '<span class="pb-team">队内平均实力 ' + avg + (st.orig[t] ? " · ✔ 已完成" : "") + "</span>";
      b.onclick = () => {
        this.closeModal();
        this.playScene(STORY.scenes17.orig(t), () => this.renderGame());
      };
      grid.appendChild(b);
    }
    c.appendChild(grid);
    const cancel = this.el("button", "btn btn-ghost modal-close", "再考虑一下（不消耗行动）");
    cancel.onclick = () => this.closeModal();
    c.appendChild(cancel);
    this.modal(c);
  },

  /* 【2018 主线④】《双面偶像》复刻承办队伍选择窗（队伍平均实力影响复刻效果） */
  showSm18TeamPicker() {
    const st = Game.st;
    const teams = st.flags.xiiKept18 ? ["SII", "NII", "HII", "X", "XII"] : ["SII", "NII", "HII", "X"];
    const c = this.card("《双面偶像》复刻 · 选择承办队伍", "由哪支队伍把广州的舞台复刻到本部？队伍平均实力越高，复刻效果越好（主线④）");
    const grid = this.el("div", "pick-grid");
    for (const t of teams) {
      const members = st.members.filter(m => m.status === "active" && m.team === t && m.pwr != null);
      const avg = members.length ? Math.round(members.reduce((s, m) => s + m.pwr, 0) / members.length) : 0;
      const b = this.el("button", "pick-btn", "");
      b.innerHTML = "Team " + t + '<span class="pb-team">队内平均实力 ' + avg + "（" + members.length + " 人）</span>";
      b.onclick = () => {
        this.closeModal();
        const res = Game.setSm18Team(t);
        this.renderGame();
        this.playScene(res.vn, () => this.renderGame());
      };
      grid.appendChild(b);
    }
    c.appendChild(grid);
    const cancel = this.el("button", "btn btn-ghost modal-close", "再考虑一下（不消耗行动）");
    cancel.onclick = () => this.closeModal();
    c.appendChild(cancel);
    this.modal(c);
  },

  /* 【2018 主线①】组阁编制会（两阶段）：逐人定队 → 队长队副任命 → 引擎落笔（Game.applyReorg18）。
     规则：每队下限13 / 上限20（主力16+替补4，按人气自动划档）；FT 随组阁成立；
     编入预备生 ≤16 人（本部成员羁绊-4；分团成员上调预备生视为上调、享红利）；
     落编者移籍分团（BEJ→GNZ→SHY→CKG 轮替，羁绊-8）；分团上调候选享「上调红利」。
     onDone：月末链回调（编制会经 3 月末事件 pickMode 转交时传入，落地后恢复链推进）。 */
  showReorg18Picker(onDone) {
    const st = Game.st;
    /* 【兜底】XII 去留未定时先补问（正常流程 1 月张怡事件已问；
       若玩家先于 1 月月末启动组阁，张怡事件不再触发，在此补上同一抉择） */
    if (st.decisions.xiiKeep18 == null) { this.showXiiKeepChoice(onDone); return; }
    const kept = !!st.flags.xiiKept18;
    const TEAMS = kept ? ["SII", "NII", "HII", "X", "XII", "FT"] : ["SII", "NII", "HII", "X", "FT"];
    const pools = Game.reorg18Pools(st);
    const assign = {};   // id → 队伍 | "prep"(编入/留任预备生) | "drop" | "stay"
    /* 默认值：本部成员留原队；预备生默认留任（不计入编入上限）；
       XII 解散时 XII 成员默认落编；分团候选默认留任 */
    for (const m of pools.head) {
      if (m.team === "PREP") assign[m.id] = "prep";
      else assign[m.id] = (kept || m.team !== "XII") ? m.team : "drop";
    }
    for (const m of pools.branch) assign[m.id] = "stay";

    /* ---- 实时计数：每队名册 + 主力/替补划档 ---- */
    const rosterOf = () => {
      const byTeam = {}; TEAMS.forEach(t => { byTeam[t] = []; });
      for (const m of pools.head.concat(pools.branch)) {
        const t = assign[m.id];
        if (t && TEAMS.indexOf(t) >= 0) byTeam[t].push(m);
      }
      for (const t of TEAMS) byTeam[t].sort((a, b) => (b.pop || 0) - (a.pop || 0));
      return byTeam;
    };

    /* ================= 阶段一：逐人定队 ================= */
    const c = this.card("组阁编制会 · 逐人定队",
      "点击卡片循环选择新队伍；落编者将移籍分团（BEJ→GNZ→SHY→CKG 轮替，羁绊-8）。" +
      "每队下限 13 人、上限 20 人（前 16 主力 · 其余替补）；Team FT 随组阁成立" + (kept ? "；XII 保留编制" : "；XII 解散、全员重编") +
      "；正式成员可编入预备生至多 16 人（羁绊-4，轻于落编），预备生可留任或直接定队升格（人气+4 羁绊+4）" +
      (pools.branch.length ? "；带 ★ 的分团成员可上调本部/预备生（视为上调、享红利）" : ""));
    const counter = this.el("p", "modal-text", "");
    const grid = this.el("div", "pick-grid");
    const confirmBtn = this.el("button", "btn btn-primary modal-close", "名册敲定，进入队长任命 →");
    confirmBtn.disabled = true;

    const refresh = () => {
      const byTeam = rosterOf();
      let bad = false;
      const parts = TEAMS.map(t => {
        const n = byTeam[t].length;
        const sub = Math.max(0, n - 16);
        const out = n < 13 || n > 20;
        if (out) bad = true;
        return "Team " + t + " " + n + " 人" + (out ? "⚠" : "✔") + (n > 16 ? "（主力16·替补" + sub + "）" : "");
      });
      /* 编入预备生计数：仅正式成员降入 + 分团上调预备生（预备生留任不计） */
      const prepN = pools.head.filter(m => m.team !== "PREP" && assign[m.id] === "prep").length
        + pools.branch.filter(m => assign[m.id] === "prep").length;
      if (prepN > 16) bad = true;
      const dropN = pools.head.filter(m => assign[m.id] === "drop").length;
      counter.textContent = parts.join(" · ") + " · 编入预备生 " + prepN + "/16 · 落编移籍 " + dropN + " 人" +
        (bad ? "　——人数越界（队伍或预备生）" : "　——可以确认");
      confirmBtn.disabled = bad;
    };

    /* 本部成员：按现队分节（预备生=九期生等一并参编） */
    for (const t of ["SII", "NII", "HII", "X", "XII"]) {
      const list = pools.head.filter(m => m.team === t);
      if (!list.length) continue;
      grid.appendChild(this.el("div", "pick-section", "—— 原 Team " + t + (t === "XII" && !kept ? "（解散·全员重编）" : "") + " ——"));
      for (const m of list) {
        grid.appendChild(this.makeReorgBtn(m, TEAMS, assign, refresh, true));
      }
    }
    {
      /* 预备生节：默认留任；可选入各队（直接定队升格） */
      const list = pools.head.filter(m => m.team === "PREP");
      if (list.length) {
        grid.appendChild(this.el("div", "pick-section", "—— 预备生（PREP）· 默认留任；可选入各队直接定队 ——"));
        for (const m of list) {
          grid.appendChild(this.makeReorgBtn(m, TEAMS, assign, refresh, "prep"));
        }
      }
    }
    /* 分团上调候选 */
    if (pools.branch.length) {
      grid.appendChild(this.el("div", "pick-section", "—— 分团上调候选（★ 默认留任；上调本部/预备生享红利）——"));
      for (const m of pools.branch) {
        grid.appendChild(this.makeReorgBtn(m, TEAMS, assign, refresh, false));
      }
    }
    confirmBtn.onclick = () => this.showReorg18Captains(TEAMS, pools, assign, onDone);
    c.appendChild(counter);
    c.appendChild(grid);
    c.appendChild(confirmBtn);
    this.modal(c);   // 不给关闭按钮——编制会必须完成
    refresh();
  },

  /* 组阁编制会 · 前置：Team XII 去留（与 1 月张怡事件同一决策 tag/效果，见 Game.confirmXiiKeep18）。
     落定后自动进入编制会主体（保留=XII 参与编组；取消=XII 成员默认落编、全员重编）。 */
  showXiiKeepChoice(onDone) {
    const c = this.card("组阁编制会 · Team XII 去留",
      "编制名单落笔前的最后一项确认——XII 的去留将决定本次编制的对象（此项通常在 1 月张怡的请求中决定）");
    const box = this.el("div", "modal-choices");
    const mk = (label, hint, keep) => {
      const b = this.el("button", "ft-opt", "");
      b.innerHTML = "<b>" + label + "</b><span>" + hint + "</span>";
      b.onclick = () => {
        const res = Game.confirmXiiKeep18(keep);
        this.closeModal();
        this.toast(res.text);
        this.renderGame();
        this.showReorg18Picker(onDone);
      };
      box.appendChild(b);
    };
    mk("「XII 保留。名字我来保，成绩你们自己挣。」", "保留 XII 编制：士气+4；组阁多一步编制确认；XII 参与本次编组", true);
    mk("「XII 的名字停在最好的时候。孩子们，往前走。」", "取消 XII 编制：资金+20；组阁三步完成；XII 成员全员重编（默认落编分团）", false);
    c.appendChild(box);
    this.modal(c);   // 不给关闭按钮——去留必须先落定
  },

  /* 组阁编制会：单张成员卡（点击循环选择目标）。
     kind=true（本部正式成员）：循环 当前队→各队→预备生→落编；
     kind="prep"（本部预备生）：循环 留任预备生→各队；
     kind=false（分团候选）：循环 各队→预备生→留任。 */
  makeReorgBtn(m, TEAMS, assign, refresh, kind) {
    const b = this.el("button", "pick-btn", "");
    const isPrep = kind === "prep";
    const order = isPrep ? ["prep"].concat(TEAMS)
      : kind ? TEAMS.concat(["prep", "drop"]) : TEAMS.concat(["prep", "stay"]);
    const CLS = { SII: "on-sii", NII: "on-nii", HII: "on-hii", X: "on-x", XII: "on-xii", FT: "on-ft", prep: "on-prep", drop: "on-drop", stay: "" };
    const labelOf = t => {
      if (t === "prep") return isPrep ? "留任预备生" : "→ 预备生（PREP）";
      if (t === "drop") return "落编 · 移籍分团";
      if (t === "stay") return "★ 留任分团";
      return "→ Team " + t;
    };
    const paint = () => {
      Object.keys(CLS).forEach(k => { if (CLS[k]) b.classList.remove(CLS[k]); });
      const cur = assign[m.id];
      if (CLS[cur]) b.classList.add(CLS[cur]);
      const mark = kind ? (isPrep ? "☆ " : "") : "★ ";
      b.innerHTML = mark + m.name + '<span class="pb-team">' + labelOf(cur) + " · 人气" + (m.pop || 0) + "</span>";
    };
    b.onclick = () => {
      const idx = order.indexOf(assign[m.id]);
      assign[m.id] = order[(idx + 1) % order.length];
      paint(); refresh();
    };
    paint();
    return b;
  },

  /* 组阁编制会 · 阶段二：队长队副任命（每队 1 队长必须 / 队副至多 1；现职仍在队内则预填） */
  showReorg18Captains(TEAMS, pools, assign, onDone) {
    const byTeam = {}; TEAMS.forEach(t => { byTeam[t] = []; });
    for (const m of pools.head.concat(pools.branch)) {
      const t = assign[m.id];
      if (t && TEAMS.indexOf(t) >= 0) byTeam[t].push(m);
    }
    for (const t of TEAMS) byTeam[t].sort((a, b) => (b.pop || 0) - (a.pop || 0));
    const role = {};   // id → "cap" | "vice"
    /* 预填：现任队长/队副仍在该队 → 保留；XII 保留且无现职队长 → 张怡预填；
       其余无现职队长的队伍（如新成立的 FT）预填人气最高者——玩家可点击更换 */
    for (const t of TEAMS) {
      const cap0 = byTeam[t].find(m => m.captain);
      const vice0 = byTeam[t].find(m => m.vice);
      if (cap0) role[cap0.id] = "cap";
      if (vice0) role[vice0.id] = "vice";
      if (!cap0 && t === "XII") {
        const zy = byTeam[t].find(m => m.name === "张怡");
        if (zy) role[zy.id] = "cap";
      }
      if (!byTeam[t].some(m => role[m.id] === "cap")) {
        const top = byTeam[t][0];
        if (top) role[top.id] = "cap";
      }
    }
    const c = this.card("组阁编制会 · 队长队副任命",
      "点击成员卡片循环：未任 → 队长 → 队副 → 未任。每队必须任命一名队长，队副可选（结果在成员卡上显示徽标）");
    const counter = this.el("p", "modal-text", "");
    const grid = this.el("div", "pick-grid");
    const confirmBtn = this.el("button", "btn btn-primary modal-close", "公布新编制名单 →");
    confirmBtn.disabled = true;
    const refresh = () => {
      let bad = false;
      const parts = TEAMS.map(t => {
        const cap = byTeam[t].filter(m => role[m.id] === "cap").length;
        const vice = byTeam[t].filter(m => role[m.id] === "vice").length;
        const out = cap !== 1 || vice > 1;
        if (out) bad = true;
        return "Team " + t + (out ? " 队长⚠" : " ✔") + (vice ? "·副×" + vice : "");
      });
      counter.textContent = parts.join(" · ") + (bad ? "　——每队恰一名队长（队副至多一名）" : "　——可以公布");
      confirmBtn.disabled = bad;
    };
    for (const t of TEAMS) {
      grid.appendChild(this.el("div", "pick-section", "—— Team " + t + "（" + byTeam[t].length + " 人）——"));
      for (const m of byTeam[t]) {
        const b = this.el("button", "pick-btn", "");
        const paint = () => {
          b.classList.remove("on-cap", "on-vice");
          const r = role[m.id];
          if (r === "cap") b.classList.add("on-cap");
          if (r === "vice") b.classList.add("on-vice");
          b.innerHTML = m.name + '<span class="pb-team">' + (r === "cap" ? "队长" : r === "vice" ? "队副" : "点击任命") + " · 人气" + (m.pop || 0) + "</span>";
        };
        b.onclick = () => {
          if (role[m.id]) {
            delete role[m.id];   // 已任 → 摘下
          } else {
            const hasCap = byTeam[t].some(x => role[x.id] === "cap");
            const hasVice = byTeam[t].some(x => role[x.id] === "vice");
            role[m.id] = !hasCap ? "cap" : (!hasVice ? "vice" : "cap");   // 无队长授队长；有队长无队副授队副；都满则顶替队长
          }
          /* 每队至多一正一副：新授者顶替同队旧任（保留刚点的这位） */
          const caps = byTeam[t].filter(x => role[x.id] === "cap");
          if (caps.length > 1) { const other = caps.find(x => x.id !== m.id); if (other) delete role[other.id]; }
          const vices = byTeam[t].filter(x => role[x.id] === "vice");
          if (vices.length > 1) { const other = vices.find(x => x.id !== m.id); if (other) delete role[other.id]; }
          paint(); refresh();
        };
        paint();
        grid.appendChild(b);
      }
    }
    confirmBtn.onclick = () => {
      const captains = {};
      for (const t of TEAMS) {
        captains[t] = { captain: null, vice: null };
        for (const m of byTeam[t]) {
          if (role[m.id] === "cap") captains[t].captain = m.id;
          if (role[m.id] === "vice") captains[t].vice = m.id;
        }
      }
      const res = Game.applyReorg18(assign, captains);
      if (res.tone === "blocked") { this.toast(res.text); return; }
      this.closeModal();
      this.renderGame();
      /* onDone：月末链回调——公布会 VN 播完后恢复链推进（行动触发的路径无 onDone） */
      this.playScene(res.vn, () => { this.renderGame(); if (onDone) onDone(); });
      this.toast(res.text);
    };
    c.appendChild(counter);
    c.appendChild(grid);
    c.appendChild(confirmBtn);
    this.modal(c);   // 不给关闭按钮——任命必须完成
    refresh();
  },

  /* 【2018 主线⑤】选秀派遣点将窗：全团（非殿堂）选 11 人；葛佳慧承诺 → 选 10 人+她自动占位 */
  showShow18Picker() {
    const st = Game.st;
    const autoGjh = st.decisions.gejiahui17 === "promise" && st.members.some(m => m.name === "葛佳慧" && m.status === "active");
    const need = autoGjh ? 10 : 11;
    const pool = st.members.filter(m => m.status === "active" && !m.hall && m.team !== "HALL" && m.pop != null);
    this.showMultiPick({
      title: "选秀派遣 · 点将" + need + "人",
      sub: "备战鹅厂选秀（主线⑤）——" + (autoGjh ? "葛佳慧依约自动占一席，再选 " + need + " 人" : "从全团非殿堂成员中选 11 人出征")
        + "；分团成员亦可上调（人气羁绊将在集训中提升）",
      pool: pool, count: need,
      confirmLabel: "名单敲定，封闭集训 →",
      cardInfo: m => (m.status === "branch" ? m.branchTeam + " · " : m.team + " · ") + "人气" + m.pop + (m.pwr != null ? " 实力" + m.pwr : ""),
      onConfirm: ids => {
        const res = Game.setShow18Squad(ids);
        this.renderGame();
        this.toast(res.text);
      },
    });
  },

  showMemberPicker() {
    const c = this.card("走访成员", "选择一位成员谈心（羁绊+12 士气+3 叶盛负担-8）");
    const grid = this.el("div", "pick-grid");
    for (const m of Game.activeMembers(Game.st).slice().sort((a, b) => b.bond - a.bond)) {
      const b = this.el("button", "pick-btn", "");
      b.innerHTML = m.name + '<span class="pb-team">' + m.team + " · 羁绊" + m.bond + "</span>";
      b.onclick = () => {
        this.closeModal();
        const res = Game.doAction("visit", { memberId: m.id });
        if (!res) return;
        this.renderGame();
        if (res.vn) this.playScene(res.vn, () => { this.renderGame(); this.toast(res.text); });
        else { this.toast(res.text); this.renderGame(); }
      };
      grid.appendChild(b);
    }
    c.appendChild(grid);
    const cancel = this.el("button", "btn btn-ghost modal-close", "先不聊了（不消耗行动）");
    cancel.onclick = () => this.closeModal();
    c.appendChild(cancel);
    this.modal(c);
  },

  onMonthEnd() {
    const st = Game.st;
    if (st.ap > 0 && !confirm("本月还有 " + st.ap + " 点行动力，确定提前进入月末结算？")) return;
    const steps = Game.endMonth();
    this.playSteps(steps, () => {
      if (st.month >= 12) return;          // 12月由结局步骤接管
      Game.advanceMonth();
      const startSteps = Game.monthStart();
      this.playSteps(startSteps, () => this.renderGame());
    });
  },

  /* ---------------- 成员页 ---------------- */

  renderMembers() {
    const st = Game.st;
    const filter = this.$("team-filter");
    filter.innerHTML = "";
    /* 标签页按 era 组装：2016 = 五队 + 分团两页；2017 = 五队+预备生+四分团；2026 = 本部队 + 三分团 */
    let teams;
    if (st.era === "2026") {
      teams = [["all", "全部"]];
      for (const t of DATA2026.teams) teams.push([t.id, t.short]);
      teams.push(["HALL", "荣誉殿堂"]);
      for (const b of DATA2026.branches) teams.push([b.id, b.id]);
      teams.push(["rest", "暂休"], ["left", "已离团"]);
    } else if (st.era === "2027") {
      teams = [["all", "全部"]];
      for (const t of DATA2026.teams) teams.push([t.id, t.short]);
      teams.push(["HALL", "荣誉殿堂"]);
      for (const b of DATA2026.branches) teams.push([b.id, b.id]);
      teams.push(["WHN48", "WHN48"], ["rest", "暂休"], ["left", "已离团"]);
    } else if (st.era === "2017") {
      teams = [["all", "全部"], ["SII", "SII"], ["NII", "NII"], ["HII", "HII"], ["X", "X"], ["XII", "XII"], ["PREP", "预备生"],
               ["BEJ48", "BEJ48"], ["GNZ48", "GNZ48"], ["SHY48", "SHY48"], ["CKG48", "CKG48"], ["HALL", "荣誉殿堂"], ["rest", "暂休"], ["left", "已离团"]];
    } else if (st.era === "2018") {
      teams = [["all", "全部"], ["SII", "SII"], ["NII", "NII"], ["HII", "HII"], ["X", "X"], ["XII", "XII"], ["PREP", "预备生"],
               ["BEJ48", "BEJ48"], ["GNZ48", "GNZ48"], ["SHY48", "SHY48"], ["CKG48", "CKG48"], ["HALL", "荣誉殿堂"], ["rest", "暂休"], ["left", "已离团"]];
      if (st.flags.ftFormed) teams.splice(6, 0, ["FT", "FT"]);   // 2018 组阁：Team FT 成立后入列
    } else {
      teams = [["all", "全部"], ["SII", "SII"], ["NII", "NII"], ["HII", "HII"], ["X", "X"], ["XII", "XII"],
               ["BEJ48", "BEJ48"], ["GNZ48", "GNZ48"], ["rest", "暂休"], ["left", "已离团"]];
    }
    for (const [k, label] of teams) {
      const chip = this.el("button", "tf-chip" + (this._memberFilter === k ? " on" : ""), label);
      chip.onclick = () => { this._memberFilter = k; this.renderMembers(); };
      filter.appendChild(chip);
    }
    const list = this.$("member-list");
    list.innerHTML = "";
    let members = st.members.slice();
    const isBranchTab = ["BEJ48", "GNZ48", "CKG48", "SHY48", "CGT48", "WHN48"].includes(this._memberFilter);
    /* 「全部」= 全部在册（active + 暂休）；已离团、分团另有独立页签 */
    if (this._memberFilter === "all") members = members.filter(m => m.status === "active" || m.status === "rest");
    else if (isBranchTab)
      members = members.filter(m => m.status === "branch" && m.branchTeam === this._memberFilter);
    else if (this._memberFilter === "rest") members = members.filter(m => m.status === "rest");
    else if (this._memberFilter === "left") members = members.filter(m => m.status === "left");
    else members = members.filter(m => m.team === this._memberFilter && m.status === "active");

    members.sort((a, b) => b.pop - a.pop);
    for (const m of members) {
      const isBranch = m.status === "branch";
      const isHall = m.team === "HALL" || m.hall;             // 荣誉殿堂/影视部分类
      const badgeTeam = isBranch ? m.branchTeam : m.team;   // 分团成员显示分团队徽
      const badgeText = badgeTeam === "HALL" ? "影视部" : badgeTeam;
      const card = this.el("div", "member-card" + (m.status === "left" ? " mc-left" : isBranch ? " mc-branch" : m.hall ? " mc-hall" : ""));
      const nameRow = this.el("div", "mc-name", "");
      nameRow.appendChild(this.el("span", "team-badge tb-" + badgeTeam, badgeText));
      nameRow.appendChild(document.createTextNode(m.name));
      if (m.hall) nameRow.appendChild(this.el("span", "mc-flag", "殿堂"));
      if (m.captain) nameRow.appendChild(this.el("span", "mc-flag", "队长"));
      else if (m.vice) nameRow.appendChild(this.el("span", "mc-flag", "副队"));
      else if (m.sub) nameRow.appendChild(this.el("span", "mc-flag", "替补"));   // 2018 组阁：每队主力16+替补4
      card.appendChild(nameRow);
      /* 2026 分团成员为简卡：仅姓名 + 队伍标注（用户要求），无人气/羁绊条 */
      const simple = isBranch && !m.pop && !m.bond;
      const metaText = (m.gen || "")
        + (isBranch ? " · " + (m.branchLabel || m.branchTeam) : "")
        + (isHall ? " · 荣誉殿堂 · 影视部" : "")
        + (!isBranch ? (m.status === "rest" ? " · 暂休" : m.status === "left" ? " · 已离团" : "") : "")
        + (!isBranch && m.note && m.status !== "active" ? " · " + m.note : "");
      card.appendChild(this.el("div", "mc-meta", metaText));
      if (simple) { list.appendChild(card); continue; }
      const popBar = this.el("div", "mc-bar pop"); popBar.innerHTML = "<i style=\"width:" + m.pop + "%\"></i>";
      card.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "人气"), this.el("span", "", m.pop)]));
      card.appendChild(popBar);
      /* 实力条（2017 线：成员卡新增实力计数） */
      if (m.pwr != null) {
        const pwrBar = this.el("div", "mc-bar pop"); pwrBar.innerHTML = "<i style=\"width:" + m.pwr + "%;background:#6fd7ff\"></i>";
        card.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "实力"), this.el("span", "", m.pwr)]));
        card.appendChild(pwrBar);
      }
      if (m.status === "active") {
        const bondBar = this.el("div", "mc-bar bond"); bondBar.innerHTML = "<i style=\"width:" + m.bond + "%\"></i>";
        card.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "羁绊"), this.el("span", "", m.bond)]));
        card.appendChild(bondBar);
      }
      list.appendChild(card);
    }
  },

  /* ---------------- 日志页 ---------------- */

  renderLog() {
    const st = Game.st;
    const box = this.$("log-list");
    box.innerHTML = "";
    if (!st.log.length) {
      box.appendChild(this.el("p", "modal-text", "还没有记录。"));
      return;
    }
    for (const entry of st.log) {
      box.appendChild(this.el("div", "log-item t-" + entry.tone, "【" + entry.month + "月】" + entry.text));
    }
  },

  /* ---------------- 标签页 ---------------- */

  switchTab(name) {
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));
    ["board", "members", "log", "sys"].forEach(t => {
      this.$("tab-" + t).classList.toggle("hidden", t !== name);
    });
  },

  initTabs() {
    document.querySelectorAll(".tab").forEach(t => {
      t.onclick = () => this.switchTab(t.dataset.tab);
    });
  },

  /* ---------------- 系统页 ---------------- */

  initSys() {
    this.$("btn-save").onclick = () => this.toast(Game.save() ? "已保存" : "保存失败");
    this.$("btn-load").onclick = () => {
      const st = Game.load();
      if (!st) { this.toast("没有找到存档"); return; }
      this.enterGame(false);
    };
    this.$("btn-export-code").onclick = () => {
      const code = Game.exportCode();
      if (!code) { this.toast("还没有可导出的存档"); return; }
      this.showCodeModal({
        title: "导出存档码",
        sub: "复制下面整段文字并保存到别处（备忘录/聊天框均可）。换目录、换浏览器、换电脑时，用它即可恢复进度。",
        code: code,
        readonly: true,
        confirmLabel: "复制到剪贴板",
        onConfirm: (ta, close) => {
          ta.select();
          let okCopy = false;
          try { okCopy = document.execCommand("copy"); } catch (e) {}
          if (!okCopy && navigator.clipboard) { navigator.clipboard.writeText(ta.value); okCopy = true; }
          close();
          this.toast(okCopy ? "已复制到剪贴板——请粘贴保存好" : "已全选，请手动复制（Ctrl+C）");
        },
      });
    };
    this.$("btn-import-code").onclick = () => {
      this.showCodeModal({
        title: "导入存档码",
        sub: "粘贴之前导出的存档码（以 SG48V1. 开头），确认后覆盖当前进度。",
        code: "",
        readonly: false,
        confirmLabel: "确认导入",
        onConfirm: (ta, close) => {
          const r = Game.importCode(ta.value);
          this.toast(r.msg);
          if (r.ok) { this.renderGame(); close(); }
        },
      });
    };
    this.$("btn-export-file").onclick = () => this.downloadSaveFile();
    this.$("btn-import-file").onclick = () => this.pickSaveFile(() => { this.renderGame(); this.toast("可点击「读取存档」继续经营"); });
    this.$("btn-to-title").onclick = () => {
      if (confirm("放弃当前任期并回到标题？（存档会保留，可从标题「继续」）")) {
        Game.save();
        this.showTitle();
      }
    };
  },

  showTitle() {
    this.showScreen("screen-title");
    this.initTitle();
  },

  /* ---------------- 结局 ---------------- */

  showEnding(grade) {
    const st = Game.st;
    const endingsSrc = st.era === "2027" ? STORY.endings27
      : st.era === "2026" ? STORY.endings26 : st.era === "2018" ? STORY.endings18
      : st.era === "2017" ? STORY.endings17 : STORY.endings;
    const ending = endingsSrc[grade] || endingsSrc.C;
    Game.clearSave();
    this.$("ending-rank").textContent = ending.rank;
    this.$("ending-title").textContent = ending.title;
    /* 结局正文支持函数（按 2026 成都决策 / WHN48 状态分叉，见 data_story_2027.js endings27） */
    this.$("ending-text").textContent = typeof ending.text === "function" ? ending.text(st) : ending.text;

    const stats = this.$("ending-stats");
    stats.innerHTML = "";
    const styleNames = st.era === "2018"
      ? { steady18: "稳进派", polish18: "淬炼派", hype18: "造势派" }
      : st.era === "2027"
      ? { steady27: "守正派", polish27: "淬炼派", hype27: "造势派" }
      : st.era === "2026"
      ? { steady: "守成派", content: "内容派", people: "人事派" }
      : st.era === "2017"
      ? { stable: "稳进派", content17: "淬炼派", hype: "造势派" }
      : { pragmatic: "实干派", communicator: "沟通派", visionary: "造势派" };
    const rows = st.era === "2018" ? [
      ["年度总分", grade === "S" ? "★★★★★" : grade === "A" ? "★★★★" : grade === "B" ? "★★★" : "★★"],
      ["全团大重组", st.reorg18.done ? "✔ 新编制落地（" + (st.flags.xiiKept18 ? "XII 保留" : "XII 谢幕") + " · FT 成立）" : st.reorg18.ready ? "筹备完毕 · 编制会 3 月末召开" : st.reorg18.stage >= 1 ? "筹备到第 " + st.reorg18.stage + " 步" : "未启动"],
      ["预备生公演升格", (st.prep18.promoted || 0) + " 人（含分团上调）"],
      ["选秀派遣", (st.show18.done ? "✔ " + (st.show18.squad ? st.show18.squad.length : 0) + " 人完成首轮录制" : st.show18.squad ? "集训中" : "未启动")
        + (st.show18.album ? " · ✔ 葛佳慧专辑已发行" : "")],
      ["总决选第一名", st.geResult ? st.geResult.top1 : "—"],
      ["金曲大赏", st.rtDone ? st.rtScore + " / 100" : "—"],
      ["全团平均实力", Game.avgPwr(st) + "（年初 " + (st.pwrBase || 0) + "）"],
      ["年末资金", st.money + " 万"],
      ["年末热度 / 士气", st.heat + " / " + st.morale],
      ["管理风格", styleNames[st.startStyle] || "—"],
    ] : st.era === "2027" ? [
      ["年度总分", grade === "S" ? "★★★★★" : grade === "A" ? "★★★★" : grade === "B" ? "★★★" : "★★"],
      ["WHN48", st.flags.wh27Main
        ? (st.branch27.open ? "✔ " + st.branch27.openMonth + " 月首演亮灯" : st.branch27.stage >= 1 ? "筹备到第 " + st.branch27.stage + " 阶段" : "未启动")
        : "未立项（守成路线）"],
      ["影视部焕新", st.film.done ? "✔ " + st.film.doneMonth + " 月开播" : st.film.stage >= 1 ? "推进到第 " + st.film.stage + " 阶段" : "未启动"],
      ["总决选第一名", st.geResult ? st.geResult.top1 : "—"],
      ["金曲大赏", st.rtCancelled ? "✘ 已取消" : st.rtDone ? st.rtScore + " / 100" : "—"],
      ["全团平均实力", Game.avgPwr(st) + "（年初 " + (st.pwrBase || 0) + "）"],
      ["年末资金", st.money + " 万"],
      ["年末热度 / 士气", st.heat + " / " + st.morale],
      ["管理风格", styleNames[st.startStyle] || "—"],
    ] : st.era === "2026" ? [
      ["年度总分", grade === "S" ? "★★★★★" : grade === "A" ? "★★★★" : grade === "B" ? "★★★" : "★★"],
      ["CGT48", st.cgt.closed
        ? (st.cgt.settleDone ? "✔ 已解散·前成员妥善安置" : "✘ 已解散（安置 " + (st.cgt.settled || 0) + "/3）")
        : st.cgt.open ? "✔ " + st.cgt.openMonth + " 月重启首演" : st.cgt.stage >= 1 ? "重建进行到第 " + st.cgt.stage + " 阶段" : "未启动"],
      ["末位淘汰", "执行 " + st.elim.executed + " · 调往CGT " + st.elim.transferred + " · 缓刑 " + st.elim.defied],
      ["总选举第一名", st.geResult ? st.geResult.top1 : "—"],
      ["金曲大赏", st.rtCancelled ? "✘ 已取消" : st.rtDone ? st.rtScore + " / 100" : "—"],
      ["年末资金", st.money + " 万"],
      ["年末热度 / 士气", st.heat + " / " + st.morale],
      ["管理风格", styleNames[st.startStyle] || "—"],
    ] : st.era === "2017" ? [
      ["年度总分", grade === "S" ? "★★★★★" : grade === "A" ? "★★★★" : grade === "B" ? "★★★" : "★★"],
      ["双团开设", (st.branch17.shyOpen ? "✔ SHY48 " + st.branch17.shyOpenMonth + " 月开业" : "SHY48 未开业")
        + "　|　" + (st.branch17.ckgOpen ? "✔ CKG48 " + st.branch17.ckgOpenMonth + " 月开业" : "CKG48 未开业")],
      ["总决选第一名", st.geResult ? st.geResult.top1 : "—"],
      ["金曲大赏评价", st.rtDone ? st.rtScore + " / 100" : "—"],
      ["原创公演", Game.origCount(st) + " / 4 套"],
      ["全团平均实力", Game.avgPwr(st) + "（年初 " + (st.pwrBase || 0) + "）"],
      ["年末资金", st.money + " 万"],
      ["年末热度 / 士气", st.heat + " / " + st.morale],
      ["管理风格", styleNames[st.startStyle] || "—"],
    ] : [
      ["年度总分", grade === "S" ? "★★★★★" : grade === "A" ? "★★★★" : grade === "B" ? "★★★" : "★★"],
      ["分团", st.branch.announce ? "✔ " + st.branch.city + " · " + st.branch.announceMonth + "月官宣" : "未成立"],
      ["总选举第一名", st.geResult ? st.geResult.top1 : "—"],
      ["金曲大赏评价", st.rtDone ? st.rtScore + " / 100" : "—"],
      ["年末资金", st.money + " 万"],
      ["年末热度 / 士气", st.heat + " / " + st.morale],
      ["管理风格", styleNames[st.startStyle] || "—"],
    ];
    for (const [k, v] of rows) {
      const r = this.el("div", "settle-row");
      r.appendChild(this.el("span", "", k));
      r.appendChild(this.el("span", "sr-val", v));
      stats.appendChild(r);
    }
    this.showScreen("screen-ending");
    this.$("btn-ending-restart").onclick = () => this.showStart();
    this.$("btn-ending-title").onclick = () => this.showTitle();
    /* 【「进入下一年」入口】2016→2017「本部新章」/ 2017→2018「星阵重列」/ 2026→2027「大河新篇」：
       继承年末成员卡与经营状态开启续写线（破产结局除外）。 */
    if ((st.era === "2016" || st.era === "2017" || st.era === "2026") && grade !== "bankrupt") {
      const btnNext = this.el("button", "btn btn-primary", "进入下一年 →");
      btnNext.id = "btn-ending-next";
      btnNext.onclick = () => {
        if (st.era === "2026") Game.carryTo2027();
        else if (st.era === "2017") Game.carryTo2018();
        else Game.carryTo2017();
        this.showPrologue();
      };
      this.$("btn-ending-restart").parentElement.insertBefore(btnNext, this.$("btn-ending-title"));
    }
  },
};
